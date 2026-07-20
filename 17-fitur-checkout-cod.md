# Perencanaan: Checkout COD

Dokumen ini adalah panduan untuk fitur pembuatan order sungguhan dengan metode pembayaran COD — mencakup pembuatan tabel `Order` & `OrderItem`, pengurangan stok secara atomic, dan generate nomor order.

---

## 1. Spesifikasi Database

### Tabel `Order`
| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| orderNumber | String | Unique, format `ORD-YYYYMMDD-XXXX` |
| userId | Int | Foreign Key → `User.id` |
| addressId | Int | Foreign Key → `Address.id` (snapshot alamat saat checkout) |
| status | Enum | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` — default `PENDING` |
| totalWeightKg | Decimal(10,2) | Not null |
| subtotalAmount | Decimal(10,2) | Not null (sebelum diskon) |
| discountAmount | Decimal(10,2) | default 0 |
| totalAmount | Decimal(10,2) | Not null (subtotal - discount) |
| paymentStatus | Enum | `UNPAID`, `PAID`, `EXPIRED`, `FAILED` — default `UNPAID` |
| paymentType | Enum | `MIDTRANS`, `COD` |
| midtransOrderId | String? | Nullable, null untuk COD |
| midtransTransactionId | String? | Nullable |
| paymentChannel | String? | Nullable |
| codConfirmedBy | Int? | Foreign Key → `User.id`, nullable |
| codConfirmedAt | DateTime? | Nullable |
| createdAt / updatedAt | DateTime | |

### Tabel `OrderItem`
| Kolom | Tipe | Constraint |
|---|---|---|
| id | Int | Primary Key, auto increment |
| orderId | Int | Foreign Key → `Order.id` |
| productVariantId | Int | Foreign Key → `ProductVariant.id` |
| unit | Enum | `KG`, `TRAY`, `PETI` |
| quantity | Decimal(10,2) | Not null |
| weightKgEquivalent | Decimal(10,2) | Not null |
| pricePerKg | Decimal(10,2) | Not null (snapshot harga saat transaksi) |
| subtotal | Decimal(10,2) | Not null |

```bash
npx prisma migrate dev --name add_order_orderitem_tables
```

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── utils/orderNumber.util.js         # generateOrderNumber()
├── validators/order.validator.js      # createOrderSchema
├── services/order.service.js          # createOrder()
├── controllers/order.controller.js
└── routes/order.routes.js             # POST /api/orders
```

---

## 3. Tahapan Implementasi

### Langkah 1: Migration
Tambahkan model `Order`, `OrderItem` + enum `OrderStatus`, `PaymentStatus`, `PaymentType` sesuai spesifikasi, migrate.

### Langkah 2: Utility Generate Order Number
Di `utils/orderNumber.util.js`, buat `generateOrderNumber()`:
1. Ambil tanggal hari ini, format `YYYYMMDD`.
2. Hitung jumlah `Order` yang `createdAt`-nya hari ini (query `count` dengan filter tanggal).
3. Format nomor urut jadi 4 digit dengan leading zero (`0001`, `0002`, dst).
4. Return string `ORD-${YYYYMMDD}-${nomorUrut}`.

### Langkah 3: Validator
`createOrderSchema`: `addressId` (number), `paymentType` (enum `'MIDTRANS'` atau `'COD'`), `items` (array, sama seperti `validateCheckoutSchema` di issue #16: `{ productVariantId, unit, quantity }`).

### Langkah 4: Service — Fungsi `createOrder` (Khusus Jalur COD di Issue Ini)
Di `order.service.js`, buat `createOrder(userId, data)`:

1. **Panggil ulang `validateCheckout(userId, data.addressId, data.items)` dari `checkout.service.js`** (issue #16) — jangan tulis ulang logika validasi area/minimum order/stok, pakai fungsi yang sudah ada. Jika validasi gagal, biarkan error-nya menyebar (propagate) ke controller.
2. Jika `data.paymentType === 'COD'`, lanjutkan dengan blok berikut. **(Jalur `MIDTRANS` belum diimplementasikan di issue ini — akan ditambahkan di issue "Checkout Midtrans" berikutnya, untuk sekarang cukup lempar error 501 "Belum diimplementasikan" jika `paymentType === 'MIDTRANS'`.)**
3. Bungkus semua langkah berikut dalam **satu `prisma.$transaction`**:
   a. Untuk tiap item, ambil ulang data `ProductVariant` **di dalam transaction** (bukan pakai data dari langkah validasi tadi, supaya data stok benar-benar terbaru — hindari race condition kalau ada checkout lain berjalan bersamaan). Cek ulang `stockKg >= weightKgEquivalent`; jika tidak cukup, lempar error 400 (transaction otomatis rollback semua perubahan sebelumnya).
   b. Kurangi `ProductVariant.stockKg` (`decrement: weightKgEquivalent`) untuk tiap item.
   c. Generate `orderNumber` via `generateOrderNumber()`.
   d. Buat 1 row `Order` dengan `status: 'PENDING'`, `paymentStatus: 'UNPAID'`, `paymentType: 'COD'`, dan seluruh total dari hasil `validateCheckout`.
   e. Buat row `OrderItem` untuk tiap item (snapshot `pricePerKg`, `weightKgEquivalent`, `subtotal`).
4. Return data order yang baru dibuat beserta items-nya.

### Langkah 5: Controller & Route
Buat handler `createOrder(req, res, next)`, ambil `userId` dari `req.user.id`, panggil service, response:
```json
{
  "success": true,
  "data": {
    "orderId": 101,
    "orderNumber": "ORD-20260711-0001",
    "totalWeightKg": 15,
    "totalAmount": 324900,
    "paymentType": "COD",
    "paymentStatus": "UNPAID"
  }
}
```
Daftarkan `POST /api/orders`, dilindungi `authMiddleware`.

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Checkout COD Berhasil
```bash
curl -i -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"addressId":2,"paymentType":"COD","items":[{"productVariantId":1,"unit":"TRAY","quantity":10}]}'
```
**Expected:** Status `201`. Cek via Prisma Studio:
- `ProductVariant.stockKg` (id 1) berkurang tepat sesuai `weightKgEquivalent` (10 tray × 1.5kg = 15kg).
- 1 row baru di `Order` dengan `paymentType: COD`, `paymentStatus: UNPAID`, `status: PENDING`.
- 1 row baru di `OrderItem` terhubung ke order tersebut, dengan `pricePerKg` sesuai harga saat itu (bukan harga yang mungkin berubah nanti).

### Skenario 2 — Order Number Unik & Berurutan
Ulangi Skenario 1 sekali lagi di hari yang sama.
**Expected:** `orderNumber` kedua berbeda dari yang pertama, urutan bertambah (`...0002`).

### Skenario 3 — Validasi dari Issue #16 Tetap Berlaku
```bash
curl -i -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"addressId":2,"paymentType":"COD","items":[{"productVariantId":1,"unit":"KG","quantity":1}]}'
```
(jumlah sengaja di bawah minimum order)
**Expected:** Status `400` dengan pesan minimum order yang sama seperti issue #16 — **tidak ada** `Order` baru tercipta di database.

### Skenario 4 — Race Condition / Stok Tidak Cukup Saat Transaction
Set `stockKg` salah satu varian jadi angka kecil (misal 1kg) langsung via Prisma Studio, lalu coba checkout dengan quantity yang melebihi itu.
**Expected:** Status `400`, **dan** pastikan tidak ada `Order`/`OrderItem` yang ter-buat sebagian (cek keduanya benar-benar 0 row baru — transaction harus rollback total, bukan cuma sebagian tabel).

---

## Catatan
- Jalur `paymentType: 'MIDTRANS'` sengaja belum diimplementasikan penuh di issue ini (cukup return error jelas) — akan dilanjutkan di issue "Checkout Midtrans" berikutnya, yang akan mengedit ulang fungsi `createOrder` ini untuk menambah cabang logikanya.
- Perhatikan baik-baik Langkah 4a: **jangan** pakai data stok dari hasil `validateCheckout` di Langkah 1 untuk keputusan kurangi stok — data itu bisa saja sudah basi (stale) kalau ada checkout lain yang selesai duluan di antara waktu validasi dan waktu transaction ini berjalan.
