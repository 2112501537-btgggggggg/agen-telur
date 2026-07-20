# Perencanaan: Kategori Produk

Dokumen ini adalah panduan untuk fitur CRUD kategori produk (admin) dan endpoint list kategori publik (dipakai frontend customer untuk filter).

---

## 1. Spesifikasi Database (Tabel `Category`)

| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| name | String | Not null, unique (hindari kategori duplikat, contoh: "Telur Ayam Negeri") |

```bash
npx prisma migrate dev --name add_category_table
```

> **Catatan penting:** Relasi `Category` → `Product` belum bisa dibuat di issue ini karena tabel `Product` belum ada (dibuat di issue berikutnya). Konsekuensinya, endpoint `DELETE` di issue ini **belum** melakukan pengecekan "tolak hapus jika masih ada produk terkait" — validasi itu akan **ditambahkan** ke endpoint yang sama saat mengerjakan issue "Produk & Varian Grade". Jangan lupa kembali ke sini nanti.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/category.validator.js
├── services/category.service.js
├── controllers/category.controller.js
└── routes/category.routes.js     # GET publik di /api/categories, CRUD admin di /api/admin/categories
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `Category`, migrate.

### Langkah 2: Validator
`categorySchema`: `name` (string, min 3 karakter).

### Langkah 3: Service
Di `category.service.js`: `listCategories()`, `createCategory(data)` (cek nama duplikat → error 409), `updateCategory(id, data)`, `deleteCategory(id)` (untuk sekarang: hapus langsung, **tanpa** cek relasi produk — akan diperbarui di issue berikutnya).

### Langkah 4: Controller & Routes
- `GET /api/categories` — **publik**, tidak perlu `authMiddleware`.
- `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id` — dilindungi `authMiddleware` + `requireRole(['ADMIN'])` (pakai `roleMiddleware` yang sudah dibuat di issue Login Admin).

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Buat Kategori (Admin)
```bash
curl -i -X POST http://localhost:4000/api/admin/categories \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"name":"Telur Ayam Negeri"}'
```
**Expected:** Status `201`.

### Skenario 2 — Nama Duplikat
Ulangi curl yang sama.
**Expected:** Status `409`.

### Skenario 3 — List Publik (Tanpa Token)
```bash
curl -i http://localhost:4000/api/categories
```
**Expected:** Status `200`, tanpa perlu header Authorization, kategori dari Skenario 1 muncul.

### Skenario 4 — Customer Coba Buat Kategori
```bash
curl -i -X POST http://localhost:4000/api/admin/categories \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"name":"Telur Bebek"}'
```
**Expected:** Status `403`.

### Skenario 5 — Edit & Hapus Kategori
Update nama kategori via `PUT`, lalu hapus salah satu kategori (yang tidak dipakai testing lain) via `DELETE` — pastikan berhasil `200`/`204`.

---

## Catatan
- **Wajib kembali ke endpoint `DELETE` di issue ini saat mengerjakan issue "Produk & Varian Grade"** — tambahkan validasi tolak hapus jika kategori masih punya produk terkait.
- Simpan minimal 2-3 kategori hasil testing (misal "Telur Ayam Negeri", "Telur Ayam Kampung") karena akan dipakai sebagai data referensi di issue Produk berikutnya.
