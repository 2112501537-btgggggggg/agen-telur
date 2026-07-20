# Perencanaan: Konfirmasi Pembayaran COD

Dokumen ini adalah panduan untuk endpoint admin/staff menandai pembayaran COD sudah diterima secara fisik (uang tunai/transfer di tempat saat barang diterima customer).

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Mengisi `Order.paymentStatus`, `Order.codConfirmedBy`, `Order.codConfirmedAt` yang sudah dibuat di issue #17.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── services/order.service.js        # UPDATE: tambah confirmCodPayment()
├── controllers/order.controller.js  # UPDATE: tambah handler
└── routes/order.routes.js           # UPDATE: tambah PUT /admin/orders/:id/confirm-cod-payment
```

---

## 3. Tahapan Implementasi

### Langkah 1: Service
Di `order.service.js`, buat `confirmCodPayment(orderId, adminUserId)`:
1. Ambil `Order`. Jika tidak ditemukan, 404.
2. **Jika `order.paymentType !== 'COD'`, tolak** dengan error 400, pesan jelas: "Order ini menggunakan Midtrans, status pembayarannya otomatis lewat webhook, bukan konfirmasi manual".
3. **Jika `order.paymentStatus === 'PAID'`, tolak** dengan error 400: "Pembayaran order ini sudah dikonfirmasi sebelumnya" (mencegah konfirmasi ganda).
4. Update `Order`: `paymentStatus: 'PAID'`, `codConfirmedBy: adminUserId`, `codConfirmedAt: new Date()`.
5. Return data order yang sudah terupdate.

### Langkah 2: Controller & Route
Buat handler `confirmCodPayment(req, res, next)`, ambil `adminUserId` dari `req.user.id`, panggil service. Daftarkan `PUT /api/admin/orders/:id/confirm-cod-payment`, dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])`.

---

## 4. Verifikasi dan Pengujian

> Gunakan order dengan `paymentType: COD` dari issue #17 sebagai data test.

### Skenario 1 — Konfirmasi Berhasil
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/1/confirm-cod-payment -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`. Cek Prisma Studio: `paymentStatus: PAID`, `codConfirmedBy` berisi id admin yang login, `codConfirmedAt` terisi waktu sekarang.

### Skenario 2 — Konfirmasi Ganda (Ditolak)
Ulangi curl yang sama persis.
**Expected:** Status `400`, pesan sudah dikonfirmasi sebelumnya.

### Skenario 3 — Coba Konfirmasi Order Midtrans (Ditolak)
Gunakan `id` order dengan `paymentType: MIDTRANS` dari issue #18.
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/2/confirm-cod-payment -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `400`, pesan menjelaskan order ini pakai Midtrans.

---

## Catatan
- Endpoint ini melengkapi pasangan issue #19 (Webhook Midtrans) — dua-duanya sama-sama mengisi `paymentStatus: PAID`, tapi lewat jalur berbeda sesuai `paymentType`. Jangan sampai ada endpoint lain yang bisa mengubah `paymentStatus` di luar dua jalur resmi ini.
- Hasil `paymentStatus: PAID` dari issue ini **dipakai sebagai syarat** di issue "Update Poin Member Otomatis" berikutnya — order COD tidak bisa di-set `DELIVERED` sebelum pembayarannya dikonfirmasi lewat endpoint ini.
