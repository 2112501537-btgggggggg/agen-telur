# Perencanaan: Adjustment Stok Manual

Dokumen ini adalah panduan untuk fitur penyesuaian stok manual (di luar pembelian dari supplier) — misal karena telur pecah/rusak, atau koreksi hasil hitung fisik gudang. Setiap penyesuaian wajib tercatat sebagai jejak audit.

---

## 1. Spesifikasi Database (Tabel `StockAdjustment`)

| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| productVariantId | Int | Foreign Key → `ProductVariant.id` |
| changeKg | Decimal(10,2) | Bisa negatif (stok berkurang) atau positif (stok bertambah) |
| reason | String | Not null (contoh: "rusak", "koreksi hitung fisik") |
| adjustedBy | Int | Foreign Key → `User.id` |
| createdAt | DateTime | default now() |

```bash
npx prisma migrate dev --name add_stock_adjustment_table
```

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/stockAdjustment.validator.js
├── services/stockAdjustment.service.js
├── controllers/stockAdjustment.controller.js
└── routes/product.routes.js       # UPDATE: tambah route stock-adjustment
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `StockAdjustment`, migrate.

### Langkah 2: Validator
`stockAdjustmentSchema`: `changeKg` (number, tidak boleh 0 — tolak jika 0 karena tidak ada gunanya), `reason` (string, min 3 karakter).

### Langkah 3: Service
Di `stockAdjustment.service.js`, buat `adjustStock(variantId, changeKg, reason, adminUserId)`:
1. Ambil data `ProductVariant` saat ini.
2. Hitung `stokBaru = stockKg_saat_ini + changeKg`.
3. **Jika `stokBaru < 0`, lempar error setara HTTP 400** dengan pesan jelas (contoh: "Stok tidak cukup, sisa stok saat ini hanya Xkg") — stok tidak boleh jadi negatif.
4. Dalam `prisma.$transaction`: update `ProductVariant.stockKg = stokBaru`, dan buat 1 row `StockAdjustment` baru mencatat `changeKg`, `reason`, `adjustedBy`.
5. Kembalikan data varian yang sudah terupdate.

Buat juga `getAdjustmentHistory(variantId)` — return semua `StockAdjustment` untuk varian tertentu, urut terbaru dulu (untuk keperluan audit/laporan nanti).

### Langkah 4: Controller & Route
Tambahkan ke `product.routes.js` (atau file routes terpisah jika lebih rapi):
- `POST /api/admin/products/variants/:id/stock-adjustment` — body `{ "changeKg": number, "reason": string }`, dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])`.
- `GET /api/admin/products/variants/:id/stock-adjustments` — riwayat penyesuaian (opsional tapi disarankan, untuk transparansi).

---

## 4. Verifikasi dan Pengujian

> Sebelum test, catat dulu `stockKg` varian yang dipakai (via Prisma Studio atau `GET /api/products/:id`).

### Skenario 1 — Kurangi Stok (Telur Rusak)
```bash
curl -i -X POST http://localhost:4000/api/admin/products/variants/1/stock-adjustment \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"changeKg": -2, "reason": "rusak saat penyimpanan"}'
```
**Expected:** Status `200`. Cek `ProductVariant.stockKg` berkurang tepat 2 dari nilai sebelumnya. Ada 1 row baru di `StockAdjustment` dengan `changeKg: -2`.

### Skenario 2 — Kurangi Melebihi Stok yang Ada
```bash
curl -i -X POST http://localhost:4000/api/admin/products/variants/1/stock-adjustment \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"changeKg": -99999, "reason": "test kurangi berlebihan"}'
```
**Expected:** Status `400`, pesan jelas menyebutkan sisa stok saat ini. `ProductVariant.stockKg` **tidak berubah** sama sekali (verifikasi tidak ada perubahan meskipun request gagal).

### Skenario 3 — Tambah Stok (Koreksi Hitung Fisik)
```bash
curl -i -X POST http://localhost:4000/api/admin/products/variants/1/stock-adjustment \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"changeKg": 5, "reason": "koreksi hitung fisik, ternyata lebih"}'
```
**Expected:** Status `200`, `stockKg` bertambah 5.

### Skenario 4 — changeKg = 0
```bash
curl -i -X POST http://localhost:4000/api/admin/products/variants/1/stock-adjustment \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"changeKg": 0, "reason": "test"}'
```
**Expected:** Status `400` (validasi menolak sebelum sampai ke service).

### Skenario 5 — Riwayat Adjustment
```bash
curl -i http://localhost:4000/api/admin/products/variants/1/stock-adjustments -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, menampilkan seluruh riwayat dari Skenario 1 dan 3 (Skenario 2 & 4 tidak tercatat karena gagal validasi/business rule).

---

## Catatan
- Ini melengkapi dua sumber perubahan stok lainnya: `StockIn` (dari supplier, issue sebelumnya) dan pengurangan otomatis saat checkout (issue "Checkout COD"/"Checkout Midtrans" nanti). Total ada 3 cara stok berubah — pastikan ketiganya konsisten menjaga `stockKg` tidak pernah negatif.
- Dengan selesainya issue ini, seluruh fitur **EPIC: Produk, Harga, Stok** sudah lengkap. Batch berikutnya masuk ke area **Order & Checkout** — bagian paling kritis dari aplikasi ini.
