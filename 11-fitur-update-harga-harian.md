# Perencanaan: Update Harga Harian

Dokumen ini adalah panduan untuk fitur update harga (single & bulk) beserta pencatatan riwayatnya — penting karena harga telur fluktuatif dan admin perlu update sesering mungkin.

---

## 1. Spesifikasi Database (Tabel `PriceHistory`)

| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| productVariantId | Int | Foreign Key → `ProductVariant.id` |
| oldPrice | Decimal(10,2) | Not null |
| newPrice | Decimal(10,2) | Not null |
| changedBy | Int | Foreign Key → `User.id` |
| changedAt | DateTime | default now() |

```bash
npx prisma migrate dev --name add_price_history_table
```

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/price.validator.js
├── services/price.service.js
├── controllers/price.controller.js
└── routes/price.routes.js       # mount di /api/admin/products (prefix sama dengan produk)
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `PriceHistory`, migrate.

### Langkah 2: Validator
- `updatePriceSchema`: `newPrice` (number, positif, > 0).
- `bulkUpdatePriceSchema`: `updates` (array of object `{ productVariantId: number, newPrice: number positif }`, minimal 1 item).

### Langkah 3: Service
Di `price.service.js`:
- `updateVariantPrice(variantId, newPrice, adminUserId)`:
  1. Ambil data `ProductVariant` saat ini (untuk tahu `oldPrice`).
  2. Jika varian tidak ditemukan, lempar error 404.
  3. Dalam `prisma.$transaction`: buat 1 row `PriceHistory` (`oldPrice` = harga lama, `newPrice` = harga baru, `changedBy` = adminUserId), lalu update `ProductVariant.pricePerKg` = newPrice dan `lastPriceUpdateAt` = now().
- `bulkUpdatePrices(updates, adminUserId)`:
  1. Loop tiap item di `updates`, lakukan langkah yang sama seperti `updateVariantPrice`, **semua dalam satu `prisma.$transaction`** (supaya kalau salah satu gagal, semua dibatalkan).
- `listPricesWithProduct()`:
  - Return semua `ProductVariant` beserta relasi `Product` (nama produk) dan `Category` (nama kategori), termasuk `pricePerKg` dan `lastPriceUpdateAt`. Ini dipakai untuk tampilan "quick-edit table" di admin-app.
- `getPriceHistory(variantId)`:
  - Return semua `PriceHistory` untuk varian tertentu, urut `changedAt` terbaru dulu.

### Langkah 4: Controller & Routes
Semua endpoint dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])` (update harga adalah tugas rutin harian, wajar dilakukan staff juga, bukan cuma admin).

- `GET /api/admin/products/prices` → panggil `listPricesWithProduct()`.
- `PUT /api/admin/products/variants/:id/price` → body `{ "newPrice": number }`, panggil `updateVariantPrice`, `adminUserId` diambil dari `req.user.id`.
- `PUT /api/admin/products/prices/bulk` → body `{ "updates": [...] }`, panggil `bulkUpdatePrices`.
- `GET /api/admin/products/variants/:id/price-history` → panggil `getPriceHistory`.

---

## 4. Verifikasi dan Pengujian

> Gunakan `variantId` dari produk yang sudah dibuat di issue "Produk & Varian Grade".

### Skenario 1 — Update Harga Single
```bash
curl -i -X PUT http://localhost:4000/api/admin/products/variants/1/price \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"newPrice": 26000}'
```
**Expected:** Status `200`. Cek via Prisma Studio: `ProductVariant.pricePerKg` sekarang `26000`, `lastPriceUpdateAt` terupdate ke waktu sekarang. Ada 1 row baru di `PriceHistory` dengan `oldPrice` = harga sebelumnya dan `newPrice = 26000`.

### Skenario 2 — Update Harga Bulk
```bash
curl -i -X PUT http://localhost:4000/api/admin/products/prices/bulk \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"updates":[{"productVariantId":1,"newPrice":27000},{"productVariantId":2,"newPrice":22000}]}'
```
**Expected:** Status `200`. Kedua varian berubah harganya, dan **kedua-duanya** punya row baru di `PriceHistory` (total sekarang ada 2 row untuk varian 1: dari Skenario 1 dan Skenario 2).

### Skenario 3 — Riwayat Harga
```bash
curl -i http://localhost:4000/api/admin/products/variants/1/price-history \
  -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, menampilkan minimal 2 entri riwayat harga dari Skenario 1 dan 2, urut dari yang terbaru.

### Skenario 4 — Validasi Harga Negatif
```bash
curl -i -X PUT http://localhost:4000/api/admin/products/variants/1/price \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"newPrice": -5000}'
```
**Expected:** Status `400`.

### Skenario 5 — List untuk Quick-Edit Table
```bash
curl -i http://localhost:4000/api/admin/products/prices -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, tiap item menampilkan nama produk, grade, harga saat ini, dan `lastPriceUpdateAt`.

---

## Catatan
- **Setiap** perubahan harga wajib tercatat di `PriceHistory` — tidak ada jalur update harga yang melewati pencatatan ini. Kalau nanti ada endpoint lain yang secara tidak sengaja mengubah `pricePerKg` langsung, itu bug dan harus diperbaiki.
- Endpoint ini sengaja dibuka untuk role `STAFF` juga, bukan cuma `ADMIN`, karena update harga adalah tugas rutin harian.
