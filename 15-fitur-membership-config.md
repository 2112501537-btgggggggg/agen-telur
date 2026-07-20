# Perencanaan: Membership Config

Dokumen ini adalah panduan untuk fitur pengaturan aturan member (poin, threshold, diskon) dan minimum order — semuanya dikonfigurasi lewat 1 baris data (singleton), bukan hardcode di kode.

---

## 1. Spesifikasi Database (Tabel `MembershipConfig`)

| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key — **selalu bernilai 1** (singleton, hanya ada 1 baris data selamanya) |
| pointsPerRupiah | Decimal(10,6) | Not null. Contoh: `0.0001` berarti 1 poin didapat tiap belanja Rp10.000 |
| pointsThresholdForMember | Int | Not null. Contoh: `500` — total poin untuk jadi member |
| memberDiscountPercent | Decimal(5,2) | Not null. Contoh: `5.00` berarti diskon 5% |
| minimumOrderKg | Decimal(10,2) | Not null. Contoh: `5.00` |

```bash
npx prisma migrate dev --name add_membership_config_table
```

Setelah migrate, **isi 1 baris data awal manual lewat Prisma Studio** dengan `id: 1` dan nilai contoh di atas — tabel ini tidak boleh kosong karena akan langsung dipakai issue "Validasi Checkout" berikutnya.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/membershipConfig.validator.js
├── services/membershipConfig.service.js
├── controllers/membershipConfig.controller.js
└── routes/membershipConfig.routes.js
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration & Isi Data Awal
Tambahkan model, migrate, isi manual 1 baris seperti dijelaskan di atas.

### Langkah 2: Validator
`membershipConfigSchema`: `pointsPerRupiah` (number, positif), `pointsThresholdForMember` (integer, positif), `memberDiscountPercent` (number, 0-100), `minimumOrderKg` (number, positif).

### Langkah 3: Service
Di `membershipConfig.service.js`:
- `getConfig()` — ambil row dengan `id: 1`. Jika somehow tidak ada (belum diisi manual), lempar error jelas yang menyuruh isi data awal dulu (jangan bikin default otomatis diam-diam, supaya admin sadar harus setting).
- `updateConfig(data)` — update row `id: 1` dengan data baru (gunakan `prisma.membershipConfig.update({ where: { id: 1 }, data })`).

### Langkah 4: Controller & Routes
- `GET /api/admin/membership-config`
- `PUT /api/admin/membership-config`

Keduanya dilindungi `authMiddleware` + `requireRole(['ADMIN'])` — **khusus `ADMIN` saja, tidak untuk `STAFF`**, karena ini pengaturan bisnis yang sensitif (beda dengan update harga harian yang boleh staff).

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Lihat Config Saat Ini
```bash
curl -i http://localhost:4000/api/admin/membership-config -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, menampilkan nilai yang Anda isi manual di Prisma Studio.

### Skenario 2 — Update Config
```bash
curl -i -X PUT http://localhost:4000/api/admin/membership-config \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"pointsPerRupiah":0.0001,"pointsThresholdForMember":500,"memberDiscountPercent":7.5,"minimumOrderKg":5}'
```
**Expected:** Status `200`. Ulangi Skenario 1 — `memberDiscountPercent` sekarang `7.5`.

### Skenario 3 — Staff Coba Akses (Harus Ditolak)
Login sebagai akun dengan role `STAFF` (buat dulu manual via Prisma Studio kalau belum ada — ubah role salah satu user jadi `STAFF`), lalu:
```bash
curl -i http://localhost:4000/api/admin/membership-config -H "Authorization: Bearer <token staff>"
```
**Expected:** Status `403` — beda dengan endpoint update harga yang mengizinkan staff, endpoint ini khusus admin.

### Skenario 4 — Validasi Diskon di Luar Rentang
```bash
curl -i -X PUT http://localhost:4000/api/admin/membership-config \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"pointsPerRupiah":0.0001,"pointsThresholdForMember":500,"memberDiscountPercent":150,"minimumOrderKg":5}'
```
**Expected:** Status `400` (diskon 150% tidak masuk akal, harus ditolak validasi).

---

## Catatan
- Nilai yang Anda isi di Skenario 2 (`minimumOrderKg: 5`, `memberDiscountPercent: 7.5`) akan **langsung dipakai** perhitungannya di issue "Validasi Checkout" berikutnya — pastikan datanya masuk akal sebelum lanjut.
- Tidak perlu bikin endpoint untuk membuat baris config baru (`POST`) — sengaja hanya `GET` dan `PUT` karena ini singleton, barisnya sudah ada dari awal (diisi manual).
