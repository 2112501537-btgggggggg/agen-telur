# Perencanaan: Sales Report & Damaged Report

Dokumen ini adalah panduan untuk 2 endpoint laporan tambahan: tren penjualan harian dalam rentang tanggal (untuk chart), dan produk dengan laporan telur cacat terbanyak (dari data review).

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Agregasi dari `Order` (untuk sales report) dan `Review` + `OrderItem` (untuk damaged report).

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── services/dashboard.service.js    # UPDATE: tambah getSalesReport(), getDamagedReport()
├── controllers/dashboard.controller.js
└── routes/dashboard.routes.js       # UPDATE: tambah 2 route baru
```

---

## 3. Tahapan Implementasi

### Langkah 1: Service — Sales Report Harian
Buat `getSalesReport(from, to)`:
1. Karena MySQL perlu grouping berdasarkan tanggal (bukan timestamp lengkap), gunakan `prisma.$queryRaw` dengan template tag `Prisma.sql` (supaya otomatis ter-parameterisasi, aman dari SQL injection):
   ```js
   const result = await prisma.$queryRaw`
     SELECT DATE(createdAt) as date, SUM(totalAmount) as totalSales
     FROM \`Order\`
     WHERE paymentStatus = 'PAID' AND createdAt BETWEEN ${from} AND ${to}
     GROUP BY DATE(createdAt)
     ORDER BY date ASC
   `;
   ```
2. Return array `[{ date: '2026-07-10', totalSales: 1250000 }, ...]`. Tanggal yang tidak ada order-nya boleh tidak muncul di array (frontend nanti yang mengisi celah tanggal kosong jadi 0 kalau perlu untuk chart).

### Langkah 2: Service — Damaged Report
Buat `getDamagedReport(limit = 10)`:
1. Ambil semua `Review` dengan `damagedEggCount > 0`, sertakan relasi `order.items.productVariant.product`.
2. Untuk tiap review, telusuri **semua produk berbeda** yang ada di order tersebut (lewat `order.items`), lalu tambahkan `damagedEggCount` review itu ke akumulasi tiap produk (pakai `Map` atau object `{ [productId]: totalDamaged }`).
3. Urutkan hasil akumulasi dari yang terbesar, ambil sejumlah `limit`.
4. Return `[{ productId, productName, totalDamaged }, ...]`.

> **Catatan desain penting (keterbatasan yang disengaja):** karena `Review` bersifat per-**order** (bukan per-produk — lihat issue #25), kalau 1 order berisi 2 produk berbeda dan reviewnya bilang "2 butir cacat", maka **kedua produk** di order itu akan sama-sama tercatat +2 di laporan ini (bukan dibagi proporsional). Ini penyederhanaan yang disengaja untuk MVP — laporan ini sifatnya indikatif ("produk mana yang perlu diperhatikan"), bukan angka presisi untuk akuntansi. Kalau nanti dirasa perlu lebih akurat, perlu redesain `Review` jadi per-item, tapi itu di luar scope issue ini.

### Langkah 3: Controller & Routes
- `GET /api/admin/dashboard/sales-report?from=2026-07-01&to=2026-07-31`
- `GET /api/admin/dashboard/damaged-report?limit=10` (`limit` opsional, default 10)

Keduanya dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])`.

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Sales Report Sesuai Data
Hitung manual total `Order.totalAmount` (yang `PAID`) per tanggal dari data testing sebelumnya.
```bash
curl -i "http://localhost:4000/api/admin/dashboard/sales-report?from=2026-07-01&to=2026-07-31" -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, tiap tanggal yang ada transaksi menunjukkan total yang cocok dengan hitungan manual.

### Skenario 2 — Sales Report Rentang Tanpa Data
```bash
curl -i "http://localhost:4000/api/admin/dashboard/sales-report?from=2020-01-01&to=2020-01-31" -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, array kosong `[]` (bukan error).

### Skenario 3 — Damaged Report
Pastikan sudah ada minimal 1-2 review dengan `damagedEggCount > 0` dari issue #25.
```bash
curl -i "http://localhost:4000/api/admin/dashboard/damaged-report" -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, produk dari review tersebut muncul dengan `totalDamaged` sesuai (atau akumulasi kalau ada beberapa review untuk produk yang sama).

### Skenario 4 — Limit Parameter
```bash
curl -i "http://localhost:4000/api/admin/dashboard/damaged-report?limit=2" -H "Authorization: Bearer <token admin>"
```
**Expected:** Hasil maksimal 2 item saja, meskipun ada lebih banyak produk dengan data cacat.

---

## Catatan
- Dengan selesainya issue ini, seluruh fitur inti backend (Auth, Produk, Harga, Stok, Order, Review, Dashboard) **sudah lengkap fungsional**. Issue berikutnya (#28) murni soal kerapian & konsistensi, bukan fitur baru.
