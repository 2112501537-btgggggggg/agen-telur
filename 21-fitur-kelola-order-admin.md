# Perencanaan: Kelola Order Admin

Dokumen ini adalah panduan untuk endpoint admin/staff melihat semua pesanan yang masuk dan memproses statusnya secara berurutan (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED).

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Update terhadap `Order.status` yang sudah ada, dengan validasi urutan yang ketat.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/order.validator.js    # UPDATE: tambah updateStatusSchema
├── services/order.service.js        # UPDATE: tambah listOrdersAdmin(), getOrderDetailAdmin(), updateOrderStatus()
├── controllers/order.controller.js  # UPDATE: tambah handler admin
└── routes/order.routes.js           # UPDATE: tambah route /admin/orders
```

---

## 3. Tahapan Implementasi

### Langkah 1: Definisikan Urutan Status
Di `order.service.js` (atau file constant terpisah `constants/orderStatus.js`), definisikan urutan progresif:
```js
const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
```
`CANCELLED` **sengaja tidak dimasukkan** ke array ini — status itu hanya bisa dicapai lewat endpoint terpisah (issue "Cancel Order" berikutnya), bukan lewat endpoint update status biasa ini.

### Langkah 2: Validator
`updateStatusSchema`: `status` (enum, salah satu dari `STATUS_ORDER` — **tolak jika value-nya `CANCELLED`**, arahkan pesan error "Gunakan endpoint cancel untuk membatalkan order").

### Langkah 3: Service — List & Detail Admin
- `listOrdersAdmin(filters)`: query semua `Order` (tanpa filter `userId`, karena ini admin), dukung filter opsional `status`, `paymentStatus`, `from`/`to` (rentang `createdAt`). Sertakan relasi `user` (untuk nama & kontak customer) dan ringkasan `items` (jumlah item, total berat).
- `getOrderDetailAdmin(orderId)`: sama seperti `getOrderDetail` customer tapi **tanpa cek kepemilikan** (admin boleh lihat semua order), sertakan relasi lengkap `items`, `user`, `address`.

### Langkah 4: Service — Update Status
Buat `updateOrderStatus(orderId, newStatus)`:
1. Ambil `Order` saat ini. Jika tidak ditemukan, 404.
2. **Jika `order.status === 'CANCELLED'` atau `order.status === 'DELIVERED'`, tolak** (status setara HTTP 400, pesan "Order sudah dalam status akhir, tidak bisa diubah lagi") — kedua status ini adalah *terminal state*.
3. Cari index `newStatus` dan index `order.status` di `STATUS_ORDER`. **Jika index `newStatus` <= index status saat ini, tolak** dengan pesan jelas (tidak boleh mundur atau diam di tempat).
4. Update `Order.status = newStatus`.
5. Return order yang sudah terupdate.

> **Catatan penting untuk issue selanjutnya:** ketika `newStatus === 'DELIVERED'`, di issue "Update Poin Member Otomatis" nanti akan ada logika tambahan (trigger tambah poin) yang **disisipkan** ke fungsi ini — untuk issue ini, cukup update status-nya saja dulu.

### Langkah 5: Controller & Routes
- `GET /api/admin/orders` — query params `status`, `paymentStatus`, `from`, `to`.
- `GET /api/admin/orders/:id`
- `PUT /api/admin/orders/:id/status` — body `{ "status": "CONFIRMED" }`

Semua dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])` (memproses pesanan adalah tugas operasional harian, wajar dilakukan staff).

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — List Semua Order (Admin)
```bash
curl -i http://localhost:4000/api/admin/orders -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, menampilkan order dari **semua** customer (beda dengan endpoint customer yang cuma lihat punya sendiri).

### Skenario 2 — Filter Kombinasi
```bash
curl -i "http://localhost:4000/api/admin/orders?status=PENDING&paymentStatus=UNPAID" -H "Authorization: Bearer <token admin>"
```
**Expected:** Hanya order yang cocok kedua filter yang muncul.

### Skenario 3 — Update Status Maju (Berhasil)
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/1/status \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"status":"CONFIRMED"}'
```
**Expected:** Status `200`, `Order.status` berubah jadi `CONFIRMED`.

### Skenario 4 — Update Status Mundur (Ditolak)
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/1/status \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"status":"PENDING"}'
```
(order saat ini sudah `CONFIRMED` dari Skenario 3)
**Expected:** Status `400`.

### Skenario 5 — Set CANCELLED Lewat Endpoint Ini (Ditolak)
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/1/status \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"status":"CANCELLED"}'
```
**Expected:** Status `400`, pesan mengarahkan pakai endpoint cancel (yang akan dibuat di issue berikutnya — untuk sekarang cukup pastikan endpoint ini menolaknya).

### Skenario 6 — Update Status Order yang Sudah DELIVERED
Set 1 order manual ke `DELIVERED` via Prisma Studio untuk keperluan test, lalu coba update lagi.
**Expected:** Status `400` (terminal state, tidak bisa diubah lagi).

---

## Catatan
- Endpoint ini sengaja **tidak** menangani pembatalan order — itu murni tugas issue "Cancel Order & Kembalikan Stok" berikutnya, yang akan punya endpoint & logika pengembalian stok sendiri.
- `STATUS_ORDER` array ini akan dipakai ulang di issue "Update Poin Member Otomatis" — pastikan diekspor dengan rapi dari file ini kalau dipisah ke file constant.
