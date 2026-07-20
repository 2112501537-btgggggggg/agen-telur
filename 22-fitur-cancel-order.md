# Perencanaan: Cancel Order & Kembalikan Stok

Dokumen ini adalah panduan untuk fitur pembatalan order oleh admin/staff, yang secara otomatis mengembalikan stok produk yang sempat dikurangi saat checkout.

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Mengubah `Order.status` menjadi `CANCELLED` dan mengembalikan `ProductVariant.stockKg` berdasarkan data `OrderItem` yang sudah ada.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── services/order.service.js        # UPDATE: tambah cancelOrder()
├── controllers/order.controller.js  # UPDATE: tambah handler cancel
└── routes/order.routes.js           # UPDATE: tambah PUT /admin/orders/:id/cancel
```

---

## 3. Tahapan Implementasi

### Langkah 1: Service — Cancel Order
Di `order.service.js`, buat `cancelOrder(orderId)`:
1. Ambil `Order` beserta relasi `items` (untuk tahu berapa `weightKgEquivalent` tiap `productVariantId` yang perlu dikembalikan).
2. Jika order tidak ditemukan, 404.
3. **Cek status saat ini** — hanya boleh dibatalkan jika status masih `PENDING`, `CONFIRMED`, atau `PROCESSING`. Jika status sudah `SHIPPED`, `DELIVERED`, atau sudah `CANCELLED`, lempar error 400 dengan pesan jelas (contoh: "Order yang sudah dikirim tidak bisa dibatalkan").
4. Dalam `prisma.$transaction`:
   a. Update `Order.status = 'CANCELLED'`.
   b. Untuk **tiap** `OrderItem` di order ini, kembalikan stok: `ProductVariant.stockKg` (`increment: item.weightKgEquivalent`).
5. Return data order yang sudah dibatalkan.

### Langkah 2: Controller & Route
Buat handler `cancelOrder(req, res, next)`, panggil service, response:
```json
{ "success": true, "data": { "orderId": 1, "status": "CANCELLED", "message": "Order berhasil dibatalkan, stok telah dikembalikan" } }
```
Daftarkan `PUT /api/admin/orders/:id/cancel`, dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])`.

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Cancel Order PENDING (Berhasil, Stok Kembali)
Sebelum test, catat dulu `stockKg` varian yang dipakai order tersebut (via Prisma Studio).
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/2/cancel -H "Authorization: Bearer <token admin>"
```
(gunakan order dengan status `PENDING`, buat baru lewat issue #17 kalau perlu data segar)
**Expected:** Status `200`, `Order.status: CANCELLED`. Cek Prisma Studio: `ProductVariant.stockKg` **bertambah kembali** tepat sesuai `weightKgEquivalent` dari `OrderItem` order tersebut — harus sama persis dengan nilai sebelum order itu dibuat.

### Skenario 2 — Cancel Order yang Sudah SHIPPED (Ditolak)
Set 1 order manual ke status `SHIPPED` via Prisma Studio, lalu coba:
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/3/cancel -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `400`, stok **tidak berubah** sama sekali.

### Skenario 3 — Cancel Order yang Sudah CANCELLED (Double Cancel)
Ulangi Skenario 1 (cancel order yang id-nya sama, yang sudah `CANCELLED`).
**Expected:** Status `400` — mencegah stok "dikembalikan dua kali" yang akan membuat data stok jadi salah (lebih banyak dari yang seharusnya).

### Skenario 4 — Cancel Order dengan Multiple Items
Buat 1 order baru dengan 2-3 item produk berbeda (lewat issue #17), catat stok masing-masing varian sebelum cancel, lalu cancel order tersebut.
**Expected:** **Semua** varian yang terlibat di order itu stoknya kembali bertambah sesuai bagian masing-masing — bukan cuma item pertama.

---

## Catatan
- Ini melengkapi validasi status di issue "Kelola Order Admin" sebelumnya — kombinasi keduanya memastikan `Order.status` hanya bisa berubah lewat 2 jalur yang benar: maju berurutan (endpoint update status) atau dibatalkan (endpoint ini), tidak ada jalur lain.
- Dengan selesainya issue ini, sisi **operasional order sudah lengkap** dari sisi admin. Batch berikutnya masuk ke konfirmasi pembayaran COD dan trigger poin member otomatis.
