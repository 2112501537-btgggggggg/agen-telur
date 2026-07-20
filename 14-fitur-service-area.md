# Perencanaan: Service Area

Dokumen ini adalah panduan untuk fitur kelola area layanan pengiriman — dipakai untuk membatasi checkout hanya ke kota/kecamatan yang dilayani toko.

---

## 1. Spesifikasi Database (Tabel `ServiceArea`)

| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| city | String | Not null |
| kecamatan | String? | Nullable — jika `null`, berarti **seluruh kota** dilayani, bukan hanya kecamatan tertentu |
| isActive | Boolean | default true |

```bash
npx prisma migrate dev --name add_service_area_table
```

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/serviceArea.validator.js
├── services/serviceArea.service.js
├── controllers/serviceArea.controller.js
└── routes/serviceArea.routes.js
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `ServiceArea`, migrate.

### Langkah 2: Validator
`serviceAreaSchema`: `city` (string), `kecamatan` (string, opsional/nullable), `isActive` (boolean, opsional, default true).

### Langkah 3: Service
Di `serviceArea.service.js`:
- `listActiveServiceAreas()` — hanya `isActive: true`, dipakai endpoint publik.
- `listAllServiceAreas()` — semua data (termasuk nonaktif), dipakai admin.
- `createServiceArea(data)`, `updateServiceArea(id, data)`, `deleteServiceArea(id)` — CRUD standar.
- `isAddressInServiceArea(city, kecamatan)` — **fungsi helper penting**, dipakai lagi di issue "Validasi Checkout" nanti:
  1. Cari `ServiceArea` dengan `isActive: true` dan `city` yang sama (case-insensitive).
  2. Jika ditemukan row dengan `kecamatan: null` → cocok (seluruh kota dilayani), return `true`.
  3. Jika ditemukan row dengan `kecamatan` yang sama persis dengan alamat → cocok, return `true`.
  4. Jika tidak ada yang cocok → return `false`.

### Langkah 4: Controller & Routes
- `GET /api/service-areas` — **publik**, panggil `listActiveServiceAreas()`.
- `POST/PUT/DELETE /api/admin/service-areas`(`/:id`) — dilindungi `authMiddleware` + `requireRole(['ADMIN'])`.
- `GET /api/admin/service-areas` — admin, panggil `listAllServiceAreas()` (termasuk yang nonaktif, untuk keperluan kelola).

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Tambah Area Spesifik Kecamatan
```bash
curl -i -X POST http://localhost:4000/api/admin/service-areas \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"city":"Bandung","kecamatan":"Soreang"}'
```
**Expected:** Status `201`.

### Skenario 2 — Tambah Area Seluruh Kota
```bash
curl -i -X POST http://localhost:4000/api/admin/service-areas \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"city":"Cimahi"}'
```
(tanpa `kecamatan`, biarkan `null`)
**Expected:** Status `201`.

### Skenario 3 — List Publik
```bash
curl -i http://localhost:4000/api/service-areas
```
**Expected:** Status `200`, tanpa token, kedua area dari Skenario 1 & 2 muncul.

### Skenario 4 — Nonaktifkan Area, Hilang dari List Publik
```bash
curl -i -X PUT http://localhost:4000/api/admin/service-areas/1 \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"isActive": false}'
curl -i http://localhost:4000/api/service-areas
```
**Expected:** Area id 1 tidak lagi muncul di `GET /api/service-areas`, tapi masih muncul di `GET /api/admin/service-areas`.

### Skenario 5 — Customer Coba Tambah Area
```bash
curl -i -X POST http://localhost:4000/api/admin/service-areas \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"city":"Jakarta"}'
```
**Expected:** Status `403`.

### Skenario 6 — Tes Fungsi Helper (via kode/console, bukan HTTP)
Kalau memungkinkan, jalankan `isAddressInServiceArea('Bandung', 'Soreang')` secara langsung (misal lewat `node -e` atau file test sementara) — harus return `true`. Coba juga `isAddressInServiceArea('Bandung', 'Lembang')` (kecamatan tidak terdaftar, dan tidak ada row `city:'Bandung', kecamatan:null`) — harus return `false`. Coba `isAddressInServiceArea('Cimahi', 'Apapun')` — harus return `true` karena ada row Cimahi dengan `kecamatan:null`.

---

## Catatan
- Fungsi `isAddressInServiceArea` **wajib** diekspor dari service ini dengan baik karena akan **langsung dipakai ulang** (bukan ditulis ulang) di issue "Validasi Checkout" — pastikan penamaan & lokasinya jelas (`serviceArea.service.js`).
