# Perencanaan: Kelola Alamat Customer

Dokumen ini adalah panduan untuk fitur multi-alamat pengiriman milik customer, termasuk logika "hanya 1 alamat default" per user.

---

## 1. Spesifikasi Database (Tabel `Address`)

| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| userId | Int | Foreign Key → `User.id` |
| label | String | Not null (contoh: "Rumah", "Warung") |
| fullAddress | String | Not null |
| kecamatan | String | Not null |
| city | String | Not null |
| isDefault | Boolean | default false |

Relasi: `User` 1───\* `Address`.

```bash
npx prisma migrate dev --name add_address_table
```

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/address.validator.js
├── services/address.service.js
├── controllers/address.controller.js
└── routes/address.routes.js       # mount di /api/users/me/addresses
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `Address` sesuai spesifikasi, migrate.

### Langkah 2: Validator
`addressSchema`: `label` (string), `fullAddress` (string, min 10 karakter), `kecamatan` (string), `city` (string), `isDefault` (boolean, opsional).

### Langkah 3: Service
Di `address.service.js`:
- `listAddresses(userId)` — return semua alamat milik user.
- `createAddress(userId, data)`:
  1. Jika ini adalah alamat **pertama** user tersebut (belum ada alamat lain), paksa `isDefault = true` apa pun input-nya.
  2. Jika `data.isDefault === true` dan user sudah punya alamat lain, jalankan dalam `prisma.$transaction`: set semua alamat lain milik user ini jadi `isDefault: false`, baru insert alamat baru dengan `isDefault: true`.
  3. Jika `data.isDefault` bukan true dan bukan alamat pertama, simpan biasa dengan `isDefault: false`.
- `updateAddress(userId, addressId, data)`: verifikasi `address.userId === userId` (jika tidak, lempar error setara 403). Jika update men-set `isDefault: true`, terapkan logika unset alamat lain seperti di atas.
- `deleteAddress(userId, addressId)`: verifikasi kepemilikan, lalu hapus.

### Langkah 4: Controller & Routes
Buat handler untuk `GET`, `POST`, `PUT /:id`, `DELETE /:id`, semua dilindungi `authMiddleware` (tidak perlu role khusus, customer biasa boleh akses). Mount di `/api/users/me/addresses`.

---

## 4. Verifikasi dan Pengujian

> Gunakan `accessToken` dari login customer (issue "Login User & JWT") di header `Authorization: Bearer <token>` untuk semua request berikut.

### Skenario 1 — Alamat Pertama Otomatis Default
```bash
curl -i -X POST http://localhost:4000/api/users/me/addresses \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"label":"Rumah","fullAddress":"Jl. Contoh No. 1","kecamatan":"Soreang","city":"Bandung","isDefault":false}'
```
**Expected:** Status `201`, meskipun `isDefault` dikirim `false`, response harus menunjukkan `isDefault: true` (karena ini alamat pertama).

### Skenario 2 — Alamat Kedua Jadi Default, Alamat Pertama Otomatis Nonaktif
```bash
curl -i -X POST http://localhost:4000/api/users/me/addresses \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"label":"Warung","fullAddress":"Jl. Contoh No. 2","kecamatan":"Soreang","city":"Bandung","isDefault":true}'
```
**Expected:** Status `201`, `isDefault: true`. Lalu `GET /api/users/me/addresses` — pastikan alamat "Rumah" dari Skenario 1 sekarang `isDefault: false`.

### Skenario 3 — Akses Alamat Milik User Lain
Login dengan akun customer kedua (buat dulu via register jika belum ada), coba:
```bash
curl -i -X PUT http://localhost:4000/api/users/me/addresses/1 \
  -H "Authorization: Bearer <token milik user kedua>" -H "Content-Type: application/json" \
  -d '{"label":"Coba Edit"}'
```
(ganti `1` dengan id alamat milik user pertama)
**Expected:** Status `403` atau `404` — user kedua tidak boleh mengedit alamat milik user pertama.

### Skenario 4 — List Hanya Menampilkan Alamat Sendiri
`GET /api/users/me/addresses` dengan token user kedua — pastikan tidak menampilkan alamat milik user pertama.

---

## Catatan
- Logika "hanya 1 default" ini penting karena nanti dipakai di checkout — pastikan diuji dengan teliti sebelum lanjut ke issue berikutnya.
- Belum perlu validasi `kecamatan`/`city` terhadap `ServiceArea` di issue ini — itu dilakukan saat checkout (issue "Validasi Checkout").
