# Perencanaan: Produk & Varian Grade

Dokumen ini adalah panduan untuk fitur CRUD produk beserta variannya (grade Besar/Sedang/Kecil dengan harga & stok masing-masing), upload gambar produk, dan endpoint publik untuk katalog.

---

## 1. Spesifikasi Database

### Tabel `Product`
| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| categoryId | Int | Foreign Key → `Category.id` |
| name | String | Not null |
| description | String? | Nullable |
| imageUrl | String? | Nullable |
| isActive | Boolean | default true |
| createdAt / updatedAt | DateTime | |

### Tabel `ProductVariant`
| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| productId | Int | Foreign Key → `Product.id` |
| grade | Enum | `BESAR`, `SEDANG`, `KECIL` |
| pricePerKg | Decimal(10,2) | Not null |
| stockKg | Decimal(10,2) | default 0 |
| lowStockThreshold | Decimal(10,2) | default 10 |
| lastPriceUpdateAt | DateTime? | Nullable |

Tambahkan **unique constraint gabungan** `@@unique([productId, grade])` — satu produk tidak boleh punya 2 varian dengan grade yang sama.

### Tabel `UnitConversion`
| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key |
| unit | Enum | `KG`, `TRAY`, `PETI` |
| kgEquivalent | Decimal(10,3) | Not null |

```bash
npx prisma migrate dev --name add_product_variant_unit_tables
```

Setelah migrate, isi `UnitConversion` **manual lewat Prisma Studio** (data referensi tetap, jarang berubah): `KG=1`, `TRAY=1.5`, `PETI=15`. Endpoint API untuk tabel ini akan dibuat di issue "Validasi Checkout".

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── middlewares/upload.middleware.js   # konfigurasi multer
├── validators/product.validator.js
├── services/product.service.js
├── controllers/product.controller.js
├── routes/product.routes.js           # admin + publik
└── routes/category.routes.js          # UPDATE: tambah validasi delete
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `Product`, `ProductVariant` (+ enum `Grade`), `UnitConversion` (+ enum `Unit`) sesuai spesifikasi, migrate. Isi `UnitConversion` manual via Prisma Studio.

### Langkah 2: Setup Multer
Di `middlewares/upload.middleware.js`:
- Storage: `diskStorage`, tujuan folder `uploads/`, nama file: `${Date.now()}-${originalname}` (hindari nama file bentrok).
- Filter: hanya terima mimetype `image/jpeg`, `image/png`, `image/webp`.
- Limit ukuran file: 2MB.
- Export middleware siap pakai, contoh `upload.single('image')`.
- Di `src/index.js`, tambahkan `app.use('/uploads', express.static('uploads'))` supaya gambar bisa diakses lewat URL.

### Langkah 3: Validator
- `productSchema`: `name` (string), `categoryId` (number), `description` (string, opsional).
- `variantSchema`: `grade` (enum BESAR/SEDANG/KECIL), `pricePerKg` (number, positif), `stockKg` (number, opsional default 0), `lowStockThreshold` (number, opsional default 10).

### Langkah 4: Service — Produk
Di `product.service.js`:
- `createProduct(data, imageFile)` — simpan `imageUrl` sebagai path relatif (`/uploads/nama-file.jpg`) jika ada `imageFile`.
- `listProductsAdmin(filters)` — return semua produk (termasuk `isActive=false`), sertakan relasi `variants`, dukung filter `categoryId`.
- `updateProduct(id, data, imageFile)` — jika ada `imageFile` baru, update `imageUrl`.
- `softDeleteProduct(id)` — set `isActive: false`, jangan benar-benar hapus row.

### Langkah 5: Service — Varian
- `addVariant(productId, data)` — cek dulu belum ada varian dengan `grade` yang sama untuk produk ini (manfaatkan unique constraint, tangkap error Prisma P2002 dan ubah jadi pesan error yang jelas: "Varian grade ini sudah ada untuk produk ini").
- `updateVariant(variantId, data)` — **hanya boleh update field selain `pricePerKg`** (nama tidak relevan di sini karena nama ada di Product, jadi field yang bisa diubah cukup `lowStockThreshold`). Update harga punya endpoint terpisah di issue selanjutnya — jangan izinkan ubah harga lewat endpoint ini.

### Langkah 6: Controller & Routes — Admin
- `POST /api/admin/products` (pakai `upload.single('image')`, multipart/form-data)
- `PUT /api/admin/products/:id` (multipart, gambar opsional)
- `DELETE /api/admin/products/:id` (soft delete)
- `GET /api/admin/products` (list lengkap, filter `?categoryId=`)
- `POST /api/admin/products/:id/variants`
- `PUT /api/admin/products/variants/:id`

Semua dilindungi `authMiddleware` + `requireRole(['ADMIN'])`.

### Langkah 7: Controller & Routes — Publik
- `GET /api/products` — hanya `isActive=true`, sertakan `variants`, dukung filter `?categoryId=&search=&page=&limit=`.
- `GET /api/products/:id` — detail + semua varian. Jika produk `isActive=false` atau tidak ditemukan, return 404.

### Langkah 8: Update Endpoint Delete Kategori (dari Issue Sebelumnya)
Kembali ke `category.service.js`, ubah `deleteCategory(id)`: sebelum menghapus, cek apakah ada `Product` dengan `categoryId` tersebut. Jika ada, lempar error setara HTTP 400 dengan pesan "Kategori masih memiliki produk, tidak bisa dihapus".

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Buat Produk dengan Gambar
```bash
curl -i -X POST http://localhost:4000/api/admin/products \
  -H "Authorization: Bearer <token admin>" \
  -F "name=Telur Ayam Negeri" -F "categoryId=1" -F "description=Segar dari peternak lokal" \
  -F "image=@/path/ke/gambar-test.jpg"
```
**Expected:** Status `201`, response berisi `imageUrl` (contoh `/uploads/xxxx-gambar-test.jpg`). Buka URL tersebut di browser (`http://localhost:4000/uploads/xxxx-gambar-test.jpg`) — gambar harus tampil.

### Skenario 2 — Tambah Varian
```bash
curl -i -X POST http://localhost:4000/api/admin/products/1/variants \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"grade":"BESAR","pricePerKg":24000,"stockKg":0,"lowStockThreshold":10}'
```
**Expected:** Status `201`.

### Skenario 3 — Grade Duplikat
Ulangi curl Skenario 2 persis sama (grade `BESAR` untuk produk yang sama).
**Expected:** Status `409` (atau `400`), pesan jelas bahwa grade ini sudah ada.

### Skenario 4 — List & Detail Publik
```bash
curl -i http://localhost:4000/api/products
curl -i http://localhost:4000/api/products/1
```
**Expected:** Kedua endpoint bisa diakses tanpa token, produk dari Skenario 1 muncul lengkap dengan array `variants`.

### Skenario 5 — Soft Delete Tidak Muncul di Publik
```bash
curl -i -X DELETE http://localhost:4000/api/admin/products/1 -H "Authorization: Bearer <token admin>"
curl -i http://localhost:4000/api/products
```
**Expected:** `DELETE` sukses (`200`), lalu produk tersebut **tidak muncul** di `GET /api/products` (publik), tapi masih muncul di `GET /api/admin/products` (cek manual) dengan `isActive: false`.

### Skenario 6 — Delete Kategori yang Punya Produk (Validasi Baru)
```bash
curl -i -X DELETE http://localhost:4000/api/admin/categories/1 -H "Authorization: Bearer <token admin>"
```
(gunakan id kategori yang dipakai produk dari Skenario 1, meskipun produknya sudah soft-delete — relasi masih ada di DB)
**Expected:** Status `400`, pesan jelas kategori masih punya produk.

---

## Catatan
- Update harga (`pricePerKg`) sengaja **tidak bisa** diubah lewat `PUT /admin/products/variants/:id` di issue ini — itu punya endpoint & mekanisme pencatatan riwayat sendiri di issue "Update Harga Harian" berikutnya.
- Pastikan folder `uploads/` sudah ada (dibuat di issue setup backend) dan writable.
