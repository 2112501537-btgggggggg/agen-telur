# Perencanaan: Dashboard Summary

Dokumen ini adalah panduan untuk endpoint ringkasan dashboard admin — total penjualan hari ini/bulan ini, jumlah order per status, dan produk dengan stok menipis.

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Murni agregasi dari `Order` (total penjualan, jumlah per status) dan `ProductVariant` (stok menipis, dibandingkan dengan `lowStockThreshold` yang sudah ada sejak issue #10).

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── services/dashboard.service.js
├── controllers/dashboard.controller.js
└── routes/dashboard.routes.js       # /api/admin/dashboard
```

---

## 3. Tahapan Implementasi

### Langkah 1: Service — Hitung Rentang Tanggal
Di `dashboard.service.js`, buat helper untuk menentukan:
- `todayStart` = awal hari ini (00:00:00), `todayEnd` = sekarang.
- `monthStart` = tanggal 1 bulan ini jam 00:00:00.

### Langkah 2: Service — Total Penjualan
Buat `getSalesSummary()`:
- `salesToday` = jumlahkan `Order.totalAmount` dengan `where: { paymentStatus: 'PAID', createdAt: { gte: todayStart, lte: todayEnd } }` (pakai `prisma.order.aggregate({ _sum: { totalAmount: true }, where: {...} })`).
- `salesThisMonth` = sama, tapi rentang dari `monthStart`.

> **Catatan:** sengaja hanya menghitung order dengan `paymentStatus: 'PAID'` — order yang masih `UNPAID` (misal COD yang belum dikonfirmasi) tidak dihitung sebagai penjualan real.

### Langkah 3: Service — Order per Status
Buat `getOrdersByStatus()`: `prisma.order.groupBy({ by: ['status'], _count: true })` — return jumlah order untuk tiap status (`PENDING`, `CONFIRMED`, dst).

### Langkah 4: Service — Stok Menipis
Buat `getLowStockVariants()`: query `ProductVariant` dengan kondisi `stockKg <= lowStockThreshold` (Prisma tidak bisa membandingkan 2 kolom langsung dalam `where` biasa — gunakan `prisma.$queryRaw` atau ambil semua variant lalu filter di JavaScript kalau jumlah produk masih sedikit; untuk skala toko ini, filter di JavaScript setelah `findMany` sudah cukup memadai). Sertakan nama produk & grade di hasilnya.

### Langkah 5: Controller & Route
Buat handler `getDashboardSummary(req, res, next)` yang memanggil ketiga fungsi service di atas secara paralel (`Promise.all`), gabungkan hasilnya jadi 1 response:
```json
{
  "success": true,
  "data": {
    "salesToday": 1250000,
    "salesThisMonth": 18400000,
    "ordersByStatus": { "PENDING": 3, "CONFIRMED": 2, "PROCESSING": 1, "SHIPPED": 0, "DELIVERED": 15, "CANCELLED": 1 },
    "lowStockVariants": [{ "productVariantId": 5, "productName": "Telur Ayam Negeri", "grade": "BESAR", "stockKg": 8, "lowStockThreshold": 10 }]
  }
}
```
Daftarkan `GET /api/admin/dashboard/summary`, dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])`.

---

## 4. Verifikasi dan Pengujian

> Sebelum test, hitung manual dulu berapa total `Order.totalAmount` dengan `paymentStatus: PAID` untuk hari ini dari data yang sudah Anda buat di issue-issue sebelumnya, sebagai pembanding.

### Skenario 1 — Ambil Summary
```bash
curl -i http://localhost:4000/api/admin/dashboard/summary -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`. Bandingkan `salesToday` dan `salesThisMonth` dengan hitungan manual Anda — harus sama persis.

### Skenario 2 — Order per Status Sesuai Data Nyata
Hitung manual berapa order Anda yang berstatus `DELIVERED` (dari testing issue #21/#24), bandingkan dengan `ordersByStatus.DELIVERED` di response.
**Expected:** Angka cocok.

### Skenario 3 — Stok Menipis Terdeteksi
Set 1 varian produk stoknya manual lewat Prisma Studio jadi lebih kecil dari `lowStockThreshold` (misal `stockKg: 5` sedangkan `lowStockThreshold: 10`).
```bash
curl -i http://localhost:4000/api/admin/dashboard/summary -H "Authorization: Bearer <token admin>"
```
**Expected:** Varian tersebut muncul di `lowStockVariants`.

### Skenario 4 — Customer Tidak Bisa Akses
```bash
curl -i http://localhost:4000/api/admin/dashboard/summary -H "Authorization: Bearer <token customer>"
```
**Expected:** Status `403`.

---

## Catatan
- Endpoint ini akan jadi sumber data untuk halaman Dashboard di `admin-app` nanti (fase frontend) — pastikan bentuk JSON-nya sudah nyaman dipakai langsung tanpa perlu diproses ulang berat-berat di sisi frontend.
