# Perencanaan: Perbaikan & Verifikasi Ulang — Integration Test Bagian D

> ## ATURAN WAJIB UNTUK EKSEKUTOR — BACA DULU SEBELUM MULAI
> 1. **Untuk setiap langkah yang ditandai 🔍 VERIFIKASI**, Anda **WAJIB** menuliskan request yang dikirim DAN response mentah yang diterima (bukan cuma "✅ berhasil") ke `TESTING.md`. Klaim tanpa bukti request/response **tidak dianggap valid** — ini memperbaiki kesalahan dari laporan sebelumnya yang menyatakan "sudah diuji terpisah" tanpa bukti.
> 2. **Jangan pindah ke Bagian berikutnya sebelum Bagian saat ini 100% lolos dengan bukti lengkap.**
> 3. Kalau di tengah jalan menemukan bug, **perbaiki dulu di kode, lalu ULANGI dari awal Bagian yang sedang dikerjakan** (bukan lanjut dari langkah yang gagal saja) — supaya hasil akhirnya konsisten satu alur utuh.
> 4. Setiap angka yang disebut "cocok"/"sesuai" harus ditunjukkan **kedua angkanya berdampingan** (angka hitungan manual vs angka dari database/API), bukan cuma disimpulkan.

---

## Bagian A — Audit & Perbaiki Path Route Admin Order

### Konteks
Laporan testing sebelumnya menunjukkan path yang dipakai adalah `/api/orders/admin/orders/:id/cancel`, padahal `API_SPEC.md` dan issue #21-#23 mendefinisikan `/api/admin/orders/:id/cancel`. Ini harus dipastikan dan diperbaiki SEKARANG, karena admin-app di fase frontend akan memanggil sesuai `API_SPEC.md`.

### Langkah A1 — Temukan Sumber Masalah
Jalankan:
```bash
grep -rn "admin/orders\|router\." backend-api/src/routes/order.routes.js
cat backend-api/src/index.js | grep -n "app.use"
```
Tuliskan **persis** output kedua command ini ke `TESTING.md` (bagian baru "Audit Route Admin Order").

### Langkah A2 — Identifikasi Pola yang Salah
Kemungkinan besar penyebabnya: route admin (`/admin/orders/:id/cancel`, dst) didefinisikan di dalam `order.routes.js` yang sama dengan route customer, lalu **seluruh file** di-mount di `index.js` dengan `app.use('/api/orders', orderRoutes)`. Akibatnya route yang di dalam file tertulis `/admin/orders/:id/cancel` jadi `/api/orders` + `/admin/orders/:id/cancel` = `/api/orders/admin/orders/:id/cancel`.

### Langkah A3 — Perbaiki Struktur Route
1. **Pisahkan** route admin ke dalam router Express terpisah (boleh tetap di file `order.routes.js` yang sama, tapi buat 2 instance `express.Router()` berbeda — 1 untuk customer, 1 untuk admin), ATAU pindahkan route admin ke file baru `adminOrder.routes.js`.
2. Route admin harus didefinisikan **tanpa** prefix `/admin/orders` di dalam route handler-nya sendiri (karena prefix itu akan ditambahkan saat mounting) — contoh: `router.put('/:id/cancel', ...)`, bukan `router.put('/admin/orders/:id/cancel', ...)`.
3. Di `index.js`, mount terpisah:
   ```js
   app.use('/api/orders', customerOrderRoutes);   // GET /, GET /:id, POST /, POST /:id/reviews
   app.use('/api/admin/orders', adminOrderRoutes); // GET /, GET /:id, PUT /:id/status, PUT /:id/cancel, PUT /:id/confirm-cod-payment
   ```
4. Pastikan **semua** endpoint admin order (dari issue #21, #22, #23) dipindah dengan pola yang sama — jangan cuma yang ketahuan salah di laporan kemarin, cek satu-satu.

### Langkah A4 — 🔍 VERIFIKASI: Path Baru Benar
Jalankan **persis** sesuai `API_SPEC.md` (bukan path lama):
```bash
curl -i -X GET http://localhost:4000/api/admin/orders -H "Authorization: Bearer <token admin>"
curl -i -X PUT http://localhost:4000/api/admin/orders/1/status -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" -d '{"status":"CONFIRMED"}'
```
**Kriteria lolos:** kedua-duanya berhasil (bukan 404) memakai path `/api/admin/orders/...` **tanpa** ada kata "orders" dobel.

### Langkah A5 — 🔍 VERIFIKASI: Path Lama Benar-Benar Mati
```bash
curl -i -X PUT http://localhost:4000/api/orders/admin/orders/1/cancel -H "Authorization: Bearer <token admin>"
```
**Kriteria lolos:** response **404** (Express: "Cannot PUT /api/orders/admin/orders/1/cancel"). Ini membuktikan perbaikannya benar-benar menghapus jalur lama, bukan cuma menambah jalur baru sebagai duplikat.

### Langkah A6 — Update `API_SPEC.md` Jika Ada Penyesuaian Lain
Kalau saat audit Langkah A1 ternyata ada endpoint lain juga yang path-nya menyimpang dari `API_SPEC.md` (bukan cuma yang 3 disebutkan), catat semuanya dan perbaiki dengan pola yang sama.

---

## Bagian B — Rekonsiliasi Stok (Investigasi Selisih 173kg vs 171kg)

### Konteks
Laporan sebelumnya menghitung manual **173kg** tapi database menunjukkan **171kg**, selisih 2kg tidak dijelaskan tuntas (cuma dicatat "1 order cancel belum dihitung" tanpa penyelesaian).

### Langkah B1 — Kumpulkan Semua Data Mentah untuk Variant id=31
Jalankan via Prisma Studio atau query, kumpulkan **daftar lengkap** (bukan cuma total) dari:
1. Semua `StockIn` dengan `productVariantId: 31` — catat tiap `quantityKg`.
2. Semua `StockAdjustment` dengan `productVariantId: 31` — catat tiap `changeKg` (perhatikan tanda +/-).
3. Semua `OrderItem` dengan `productVariantId: 31` — untuk **tiap** row, catat `weightKgEquivalent` **dan** `orderId`-nya, lalu cari `Order.status` dari `orderId` tersebut (khususnya apakah `CANCELLED` atau bukan).

Susun sebagai tabel di `TESTING.md`, contoh format:
```
| Sumber | ID | Jumlah (kg) | Order Status (jika relevan) |
|---|---|---|---|
| StockIn | 1 | +200 | - |
| StockAdjustment | 1 | -5 | - |
| OrderItem | (orderId=34) | -2 | DELIVERED |
| OrderItem | (orderId=45) | -2 | CANCELLED |
| ... | ... | ... | ... |
```

### Langkah B2 — Hitung Manual dengan Rumus yang Benar
**Rumus yang benar** (perbaikan dari rumus laporan sebelumnya yang tidak lengkap):
```
stok_akhir_seharusnya = SUM(StockIn.quantityKg)
                       + SUM(StockAdjustment.changeKg)   // signed, bisa negatif
                       - SUM(OrderItem.weightKgEquivalent UNTUK order YANG STATUSNYA BUKAN 'CANCELLED')
```
**Penting:** order yang `CANCELLED` **TIDAK** dikurangi dalam rumus ini sama sekali — karena saat order dibuat stok sudah dikurangi, lalu saat dibatalkan (issue #22) stok sudah dikembalikan lagi, jadi **net effect-nya nol**, bukan perlu dihitung dua kali atau dikecualikan dengan cara lain.

Hitung angka final dari rumus ini, tuliskan hasilnya.

### Langkah B3 — 🔍 VERIFIKASI: Bandingkan dengan Database
```bash
curl -i http://localhost:4000/api/products/28 # atau query langsung ProductVariant id=31 via Prisma Studio
```
Tuliskan berdampingan di `TESTING.md`:
```
Hasil hitungan manual (Langkah B2): ___ kg
Nilai ProductVariant.stockKg di database: ___ kg
Selisih: ___ kg
```
**Kriteria lolos:** selisih harus **0**. Jika masih ada selisih, LANJUT ke Langkah B4 — jangan tutup issue ini dengan selisih yang tidak terjelaskan.

### Langkah B4 — Jika Masih Ada Selisih: Investigasi Order id=45 Secara Spesifik
1. Ambil detail lengkap `Order` id=45 (yang di-cancel di laporan sebelumnya) beserta `OrderItem`-nya.
2. Cek log/riwayat: apakah `ProductVariant.stockKg` **sebelum** order id=45 dibuat, **setelah** dibuat (harusnya berkurang), dan **setelah** dibatalkan (harusnya kembali ke nilai sebelum dibuat) — kalau Anda tidak punya log historis, buat ulang skenario serupa dari awal (buat order baru, catat stok sebelum/sesudah checkout, cancel, catat stok sesudah cancel) untuk membuktikan perilaku `cancelOrder` benar.
3. **Jika terbukti stok tidak kembali penuh saat cancel** — ini bug di fungsi `cancelOrder` (issue #22). Buka `order.service.js`, cek logika `prisma.$transaction` di dalamnya, khususnya apakah `increment` memakai `item.weightKgEquivalent` yang benar untuk **setiap** item (kalau order idnya 45 cuma 1 item, mudah; tapi cek juga apakah ada kemungkinan ada lebih dari 1 `OrderItem` yang terlewat di loop).
4. Perbaiki bug jika ditemukan, lalu **ulangi Langkah B1-B3 dari awal** dengan data yang sudah bersih (atau reset variant stok manual ke angka yang diketahui, lalu jalankan ulang 1 siklus lengkap: StockIn → order → cancel, verifikasi stok kembali tepat).

---

## Bagian C — Membership, Diskon Midtrans & Poin Setelah Diskon (Paling Kritis)

### Konteks
Ini adalah bagian yang **paling penting untuk dibuktikan ulang** karena sebelumnya di-skip total. Ikuti persis, jangan diringkas.

### Langkah C1 — Set Ulang Config dengan Nilai yang Masuk Akal SEJAK AWAL
```bash
curl -i -X PUT http://localhost:4000/api/admin/membership-config \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"pointsPerRupiah":0.01,"pointsThresholdForMember":500,"memberDiscountPercent":10,"minimumOrderKg":5}'
```
🔍 VERIFIKASI: tampilkan response `GET /api/admin/membership-config` setelah ini untuk membuktikan tersimpan.

### Langkah C2 — Reset State Customer A ke Kondisi Bersih
Via Prisma Studio, cari `User` dengan email Customer A dari testing sebelumnya (id=38), set manual:
- `totalPoints: 0`
- `isMember: false`

🔍 VERIFIKASI: tampilkan data user ini (via `GET /api/auth/me` dengan token Customer A) SEBELUM lanjut, buktikan `totalPoints: 0` dan `isMember: false`.

### Langkah C3 — Checkout COD 1x untuk Langsung Melewati Threshold
Dengan `pricePerKg: 30000` untuk variant BESAR (id=31), checkout `2kg`:
- `subtotalAmount = 2 × 30000 = 60000`
- `pointsEarned = floor(60000 × 0.01) = 600` → **melewati threshold 500 dalam 1 order saja**.

```bash
curl -i -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token Customer A>" -H "Content-Type: application/json" \
  -d '{"addressId":34,"paymentType":"COD","items":[{"productVariantId":31,"unit":"KG","quantity":2}]}'
```
Catat `orderId`/`orderNumber` yang dihasilkan.

### Langkah C4 — Proses Sampai DELIVERED (Pakai Path yang Sudah Diperbaiki di Bagian A)
Jalankan berurutan (pakai path `/api/admin/orders/...` yang benar):
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/<id>/confirm-cod-payment -H "Authorization: Bearer <token admin>"
curl -i -X PUT http://localhost:4000/api/admin/orders/<id>/status -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" -d '{"status":"CONFIRMED"}'
curl -i -X PUT http://localhost:4000/api/admin/orders/<id>/status -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" -d '{"status":"PROCESSING"}'
curl -i -X PUT http://localhost:4000/api/admin/orders/<id>/status -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" -d '{"status":"SHIPPED"}'
curl -i -X PUT http://localhost:4000/api/admin/orders/<id>/status -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" -d '{"status":"DELIVERED"}'
```

### Langkah C5 — 🔍 VERIFIKASI WAJIB: Customer A Benar-Benar Jadi Member
```bash
curl -i http://localhost:4000/api/auth/me -H "Authorization: Bearer <token Customer A>"
```
**Kriteria lolos (tunjukkan response mentahnya):** `totalPoints: 600` DAN `isMember: true`. **Jangan lanjut ke Langkah C6 kalau ini belum terbukti dengan response asli.**

### Langkah C6 — 🔍 VERIFIKASI: Preview Checkout Menampilkan Diskon
```bash
curl -i -X POST http://localhost:4000/api/orders/validate \
  -H "Authorization: Bearer <token Customer A>" -H "Content-Type: application/json" \
  -d '{"addressId":34,"items":[{"productVariantId":31,"unit":"KG","quantity":2}]}'
```
**Kriteria lolos:** `subtotalAmount: 60000`, `discountAmount: 6000` (10% dari 60000), `totalAmount: 54000`, `isMember: true`. **Hitung manual dan bandingkan eksplisit di TESTING.md**, jangan cuma bilang "diskon muncul".

### Langkah C7 — Checkout Sungguhan dengan Midtrans
```bash
curl -i -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token Customer A>" -H "Content-Type: application/json" \
  -d '{"addressId":34,"paymentType":"MIDTRANS","items":[{"productVariantId":31,"unit":"KG","quantity":2}]}'
```
🔍 VERIFIKASI: catat `orderNumber` baru, `midtransSnapToken` ada, dan **paling penting**: cek `Order.totalAmount` yang tersimpan di database untuk order ini — harus **54000** (sudah terpotong diskon), bukan 60000. Tunjukkan hasil query/GET detail order ini.

### Langkah C8 — Simulasikan Webhook Midtrans Settlement
Hitung signature dengan script berikut (ganti `order_id` dan `gross_amount` sesuai order dari Langkah C7 — `gross_amount` **harus** 54000.00 sesuai `totalAmount` yang sudah didiskon):
```js
const crypto = require('crypto');
const order_id = '<orderNumber dari Langkah C7>';
const status_code = '200';
const gross_amount = '54000.00';
const raw = order_id + status_code + gross_amount + '<MIDTRANS_SERVER_KEY dari .env>';
console.log(crypto.createHash('sha512').update(raw).digest('hex'));
```
```bash
curl -i -X POST http://localhost:4000/api/payments/midtrans/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<orderNumber>",
    "status_code": "200",
    "gross_amount": "54000.00",
    "transaction_status": "settlement",
    "payment_type": "qris",
    "transaction_id": "test-c8-001",
    "signature_key": "<hasil hitung di atas>"
  }'
```
🔍 VERIFIKASI: `GET /api/orders/<id>` (atau via admin) — `paymentStatus: PAID`, `paymentChannel: qris`.

### Langkah C9 — 🔍 VERIFIKASI: `confirm-cod-payment` Ditolak untuk Order Midtrans Ini
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/<id dari C7>/confirm-cod-payment -H "Authorization: Bearer <token admin>"
```
**Kriteria lolos:** status `400` (sesuai aturan issue #23 — order Midtrans tidak boleh dikonfirmasi lewat jalur COD).

### Langkah C10 — Proses Sampai DELIVERED
Sama seperti Langkah C4, order ini sudah `PAID` dari webhook jadi seharusnya **tidak ditolak** oleh validasi issue #24 (yang mensyaratkan `paymentStatus: PAID` sebelum boleh `DELIVERED`).

### Langkah C11 — 🔍 VERIFIKASI PALING KRITIS: Poin Dihitung dari Total SETELAH Diskon
```bash
curl -i http://localhost:4000/api/auth/me -H "Authorization: Bearer <token Customer A>"
```
**Hitung manual:** `pointsEarned dari order ini = floor(54000 × 0.01) = 540` (bukan `floor(60000 × 0.01) = 600` — ini yang membedakan apakah bug "poin dihitung dari subtotal, bukan total setelah diskon" ada atau tidak).

`totalPoints` sebelum order ini = 600 (dari Langkah C5). **Kriteria lolos:** `totalPoints` sekarang = `600 + 540 = 1140`. Kalau hasilnya `600 + 600 = 1200`, berarti **ketemu bug**: poin dihitung dari `subtotalAmount`, bukan `totalAmount` — lapor eksplisit di `TESTING.md` dan perbaiki di `order.service.js` (fungsi `updateOrderStatus`, bagian trigger poin dari issue #24) supaya memakai `order.totalAmount`, bukan `order.subtotalAmount`.

---

## Bagian D — Perbaikan Item Non-Blocking (Ringkas)

### D1 — Dashboard dengan Angka Nyata
Ulangi `GET /api/admin/dashboard/summary`, kali ini **hitung manual** total `Order.totalAmount` (yang `PAID`) untuk hari ini dari SEMUA order yang sudah dibuat selama testing (termasuk yang baru dari Bagian C), tuliskan berdampingan dengan angka `salesToday` dari response API.

### D2 — Verifikasi Upload Gambar Produk (Jika Belum Pernah Dibuktikan)
```bash
curl -i -X POST http://localhost:4000/api/admin/products \
  -H "Authorization: Bearer <token admin>" \
  -F "name=Test Upload Gambar" -F "categoryId=25" \
  -F "image=@<path ke file gambar apa saja>"
```
🔍 VERIFIKASI: `imageUrl` di response, buka URL-nya di browser, pastikan gambar benar-benar tampil (bukan 404).

---

## Update `TESTING.md`

Tambahkan section baru di `TESTING.md` (jangan timpa yang lama, tambahkan sebagai lanjutan) berjudul **"Perbaikan & Verifikasi Ulang (Issue #30)"**, isi dengan seluruh bukti request/response dari tiap langkah 🔍 VERIFIKASI di atas, plus daftar bug yang ditemukan & diperbaiki (jika ada).

---

## Kriteria Selesai (Definition of Done)
- [ ] Bagian A: path route admin sudah benar sesuai `API_SPEC.md`, path lama terbukti 404
- [ ] Bagian B: selisih stok 0kg, dijelaskan dengan tabel rinci, atau bug ditemukan & diperbaiki
- [ ] Bagian C: **seluruh 11 langkah (C1-C11) lolos dengan bukti response asli**, terutama C11 (poin dari total setelah diskon)
- [ ] Bagian D: dashboard angka dibuktikan cocok, upload gambar dibuktikan bekerja
- [ ] `TESTING.md` terupdate dengan bukti lengkap, bukan klaim tanpa data

**Baru setelah semua checklist di atas tercentang dengan bukti nyata, aplikasi benar-benar siap lanjut ke fase frontend.**
