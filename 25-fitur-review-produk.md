# Perencanaan: Review Produk

Dokumen ini adalah panduan untuk fitur review pasca-pesanan (rating, komentar, jumlah telur cacat). **Ini adalah tabel terakhir dari 15 tabel yang direncanakan di `DATABASE.md` — setelah issue ini selesai, skema database sudah 100% lengkap.**

---

## 1. Spesifikasi Database (Tabel `Review`)

| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| orderId | Int | Foreign Key → `Order.id`, **unique** (1 order hanya boleh 1 review) |
| userId | Int | Foreign Key → `User.id` |
| rating | Int | Not null, 1-5 |
| comment | String? | Nullable |
| damagedEggCount | Int? | Nullable, opsional (jumlah telur retak/pecah) |
| createdAt | DateTime | default now() |

```bash
npx prisma migrate dev --name add_review_table
```

> **Catatan desain:** Review bersifat **per-order**, bukan per-produk — karena 1 order bisa berisi banyak produk berbeda, dan PRD menetapkan review cukup sederhana (1 rating + komentar + jumlah cacat untuk keseluruhan pesanan). Untuk menampilkan "review produk X", nanti dicari lewat order-order yang **mengandung** produk tersebut (lihat Langkah 4).

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/review.validator.js
├── services/review.service.js
├── controllers/review.controller.js
└── routes/review.routes.js       # POST di /api/orders/:id/reviews, GET di /api/products/:id/reviews
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `Review` sesuai spesifikasi (jangan lupa `@@unique` pada `orderId`), migrate.

### Langkah 2: Validator
`reviewSchema`: `rating` (integer, 1-5), `comment` (string, opsional), `damagedEggCount` (integer, opsional, minimal 0).

### Langkah 3: Service — Submit Review
Di `review.service.js`, buat `submitReview(userId, orderId, data)`:
1. Ambil `Order`. Jika tidak ditemukan, 404.
2. **Cek kepemilikan**: jika `order.userId !== userId`, lempar 403.
3. **Cek status**: jika `order.status !== 'DELIVERED'`, lempar 400 dengan pesan "Hanya pesanan yang sudah selesai yang bisa direview".
4. **Cek belum pernah review**: query `Review` dengan `orderId` ini — jika sudah ada, lempar 400 "Anda sudah pernah memberi review untuk pesanan ini" (manfaatkan juga unique constraint di database sebagai lapisan kedua, tangkap error Prisma P2002 sebagai fallback).
5. Buat row `Review` baru.
6. Return data review.

### Langkah 4: Service — List Review per Produk
Buat `listReviewsForProduct(productId)`:
1. Cari semua `OrderItem` yang `productVariant.productId === productId` (lewat relasi `productVariant`), ambil daftar `orderId`-nya (distinct, tanpa duplikat).
2. Cari semua `Review` dengan `orderId` yang termasuk dalam daftar tersebut.
3. Sertakan nama user (cukup `name`, jangan expose data sensitif) dan `createdAt`.
4. Return list review, urut terbaru dulu.

### Langkah 5: Controller & Routes
- `POST /api/orders/:id/reviews` — dilindungi `authMiddleware`, ambil `userId` dari `req.user.id`, `orderId` dari `req.params.id`.
- `GET /api/products/:id/reviews` — **publik**, tidak perlu auth.

---

## 4. Verifikasi dan Pengujian

> Gunakan order yang sudah berhasil di-set `DELIVERED` dari issue #24 sebagai data test.

### Skenario 1 — Submit Review Berhasil
```bash
curl -i -X POST http://localhost:4000/api/orders/1/reviews \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Telurnya segar, pengiriman cepat","damagedEggCount":2}'
```
**Expected:** Status `201`.

### Skenario 2 — Review Ganda untuk Order yang Sama (Ditolak)
Ulangi curl yang sama persis.
**Expected:** Status `400`, pesan sudah pernah review.

### Skenario 3 — Review Order yang Belum DELIVERED (Ditolak)
Gunakan order lain yang statusnya masih `PENDING`/`SHIPPED`.
```bash
curl -i -X POST http://localhost:4000/api/orders/3/reviews \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"rating":4}'
```
**Expected:** Status `400`.

### Skenario 4 — Review Order Milik Orang Lain (Ditolak)
Gunakan token customer kedua untuk review order milik customer pertama.
**Expected:** Status `403`.

### Skenario 5 — List Review per Produk
```bash
curl -i http://localhost:4000/api/products/1/reviews
```
**Expected:** Status `200`, tanpa token, menampilkan review dari Skenario 1 (karena order id 1 mengandung produk id 1), termasuk nama customer & rating.

### Skenario 6 — Validasi Rating di Luar Rentang
```bash
curl -i -X POST http://localhost:4000/api/orders/2/reviews \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"rating":10}'
```
**Expected:** Status `400`.

---

## Catatan
- **Milestone penting**: dengan selesainya issue ini, seluruh 15 tabel di `DATABASE.md` sudah terbentuk sepenuhnya di `prisma/schema.prisma`. Sebelum lanjut ke fitur berikutnya (Dashboard/Laporan), disarankan buka `prisma/schema.prisma` dan bandingkan sekali lagi dengan `DATABASE.md` untuk memastikan tidak ada yang terlewat atau menyimpang.
- Field `damagedEggCount` bersifat opsional — jangan paksa customer mengisinya kalau memang tidak ada telur yang cacat.
