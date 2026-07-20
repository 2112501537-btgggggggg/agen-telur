# Perencanaan: Supplier & Stok Masuk

Dokumen ini adalah panduan untuk fitur pencatatan supplier (peternak) dan pembelian stok telur dari mereka, yang otomatis menambah stok produk terkait.

---

## 1. Spesifikasi Database

### Tabel `Supplier`
| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| name | String | Not null |
| contact | String | Not null (no. telp/WA) |
| address | String? | Nullable |

### Tabel `StockIn`
| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| supplierId | Int | Foreign Key → `Supplier.id` |
| productVariantId | Int | Foreign Key → `ProductVariant.id` |
| quantityKg | Decimal(10,2) | Not null |
| pricePerKg | Decimal(10,2) | Not null (harga beli dari supplier, beda dengan harga jual) |
| totalCost | Decimal(10,2) | Not null (dihitung otomatis: quantityKg × pricePerKg) |
| createdAt | DateTime | default now() |
| createdBy | Int | Foreign Key → `User.id` |

```bash
npx prisma migrate dev --name add_supplier_stockin_tables
```

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/supplier.validator.js
├── validators/stockIn.validator.js
├── services/supplier.service.js
├── services/stockIn.service.js
├── controllers/supplier.controller.js
├── controllers/stockIn.controller.js
├── routes/supplier.routes.js     # /api/admin/suppliers
└── routes/stockIn.routes.js       # /api/admin/stock-in
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `Supplier` dan `StockIn`, migrate.

### Langkah 2: Validator
- `supplierSchema`: `name` (string), `contact` (string), `address` (string, opsional).
- `stockInSchema`: `supplierId` (number), `productVariantId` (number), `quantityKg` (number, positif), `pricePerKg` (number, positif).

### Langkah 3: Service Supplier
CRUD standar di `supplier.service.js`: `listSuppliers()`, `createSupplier(data)`, `updateSupplier(id, data)`, `deleteSupplier(id)`.

### Langkah 4: Service StockIn
Di `stockIn.service.js`:
- `createStockIn(data, adminUserId)`:
  1. Hitung `totalCost = data.quantityKg * data.pricePerKg`.
  2. Dalam `prisma.$transaction`: buat row `StockIn` baru, lalu update `ProductVariant.stockKg` (`increment: data.quantityKg`).
  3. Kembalikan data `StockIn` yang baru dibuat.
- `listStockIn(filters)`:
  - Dukung filter opsional `productVariantId`, `supplierId`, `from`/`to` (rentang tanggal berdasarkan `createdAt`).
  - Sertakan relasi `supplier` dan `productVariant` (dengan nama produk) di response.

### Langkah 5: Controller & Routes
Semua endpoint dilindungi `authMiddleware` + `requireRole(['ADMIN', 'STAFF'])`.

- `GET/POST/PUT/DELETE /api/admin/suppliers`(`/:id`)
- `POST /api/admin/stock-in`
- `GET /api/admin/stock-in` (query params: `productVariantId`, `supplierId`, `from`, `to`)

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — CRUD Supplier
```bash
curl -i -X POST http://localhost:4000/api/admin/suppliers \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"name":"Peternak Pak Slamet","contact":"081234000111","address":"Ciwidey"}'
```
**Expected:** Status `201`. Lanjutkan test `GET`, `PUT`, `DELETE` seperti biasa, pastikan semua status code sesuai (200/204).

### Skenario 2 — Catat Stok Masuk & Cek Stok Bertambah
Sebelum test, cek dulu `stockKg` varian yang akan dipakai (misal `variantId=1`) via Prisma Studio, catat angkanya.
```bash
curl -i -X POST http://localhost:4000/api/admin/stock-in \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"supplierId":1,"productVariantId":1,"quantityKg":100,"pricePerKg":20000}'
```
**Expected:** Status `201`, response `totalCost: 2000000`. Cek lagi `ProductVariant.stockKg` via Prisma Studio — harus bertambah tepat 100 dari nilai sebelumnya.

### Skenario 3 — Filter Riwayat Stok Masuk
```bash
curl -i "http://localhost:4000/api/admin/stock-in?productVariantId=1" -H "Authorization: Bearer <token admin>"
```
**Expected:** Status `200`, hanya menampilkan entri untuk `productVariantId=1`, termasuk data supplier & produk terkait.

```bash
curl -i "http://localhost:4000/api/admin/stock-in?from=2026-07-01&to=2026-07-31" -H "Authorization: Bearer <token admin>"
```
**Expected:** Hanya entri dalam rentang tanggal tersebut yang muncul.

---

## Catatan
- `pricePerKg` di `StockIn` adalah **harga beli dari supplier**, berbeda dan tidak berhubungan langsung dengan `pricePerKg` di `ProductVariant` (harga jual ke customer). Jangan tertukar logikanya.
- Data `Supplier` dari issue ini akan dipakai lagi saat testing issue "Adjustment Stok Manual" dan seterusnya — buat minimal 1-2 supplier untuk keperluan data testing selanjutnya.
