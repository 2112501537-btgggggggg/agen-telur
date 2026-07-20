# Perencanaan: Checkout Midtrans

Dokumen ini adalah panduan untuk melengkapi jalur `paymentType: 'MIDTRANS'` pada fungsi `createOrder` (yang di issue #17 sengaja baru menangani jalur COD) — termasuk integrasi Midtrans Snap API dan penanganan kegagalan panggilan eksternal.

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Issue ini hanya mengisi kolom yang sudah ada di `Order` (dari issue #17) yang sebelumnya null untuk jalur COD: `midtransOrderId`, `midtransTransactionId`, `paymentChannel`.

> **Prasyarat:** Anda perlu akun Midtrans **Sandbox** (gratis, untuk testing) — daftar di https://dashboard.sandbox.midtrans.com/register jika belum punya, lalu ambil `Server Key` dan `Client Key` dari menu Settings → Access Keys.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── utils/midtrans.util.js       # inisialisasi Midtrans Snap client
├── services/order.service.js    # UPDATE: lengkapi cabang paymentType MIDTRANS di createOrder()
└── .env                          # tambah MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION
```

---

## 3. Tahapan Implementasi

### Langkah 1: Install Dependency & Setup Environment
```bash
npm install midtrans-client
```
Tambahkan ke `.env` dan `.env.example`:
```
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

### Langkah 2: Setup Utility Midtrans
Di `utils/midtrans.util.js`:
```js
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = { snap };
```

### Langkah 3: Lengkapi `createOrder` — Cabang MIDTRANS
Kembali ke `order.service.js`, ubah bagian yang di issue #17 masih `throw error 501` untuk `paymentType === 'MIDTRANS'`. Ikuti urutan ini (**penting, karena melibatkan panggilan API eksternal yang bisa gagal**):

1. **Langkah A — Buat Order di database dulu** (seperti jalur COD): dalam `prisma.$transaction`, cek stok ulang, kurangi stok, generate `orderNumber`, buat `Order` (`status: PENDING`, `paymentStatus: UNPAID`, `paymentType: MIDTRANS`) dan `OrderItem`. **Commit transaction ini dulu** sebelum lanjut ke langkah berikutnya.

2. **Langkah B — Panggil Midtrans Snap API**, di luar transaction Prisma:
   ```js
   const transaction = await snap.createTransaction({
     transaction_details: {
       order_id: order.orderNumber, // harus unik, pakai orderNumber yang sudah dibuat
       gross_amount: Math.round(Number(order.totalAmount)),
     },
     customer_details: {
       first_name: user.name,
       email: user.email,
       phone: user.phone,
     },
   });
   ```
   `transaction.token` adalah Snap token yang akan dikembalikan ke frontend.

3. **Langkah C — Jika Langkah B berhasil**: update `Order.midtransOrderId = order.orderNumber`, return data order beserta `midtransSnapToken: transaction.token`.

4. **Langkah D — Jika Langkah B gagal** (network error, API key salah, dsb): lakukan **compensating action** — dalam transaction baru: hapus `OrderItem` yang baru dibuat, hapus `Order` yang baru dibuat, dan **kembalikan stok** (`increment` sejumlah yang tadi dikurangi). Baru setelah itu lempar error 500 ke client dengan pesan "Gagal memproses pembayaran, silakan coba lagi." Ini penting supaya tidak ada order "hantu" yang stoknya sudah terpotong tapi tidak pernah bisa dibayar.

### Langkah 4: Tidak Ada Perubahan di Controller/Route
Endpoint `POST /api/orders` dari issue #17 **tidak berubah** — logic branching-nya ada sepenuhnya di dalam `order.service.js`.

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Checkout Midtrans Berhasil
```bash
curl -i -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"addressId":2,"paymentType":"MIDTRANS","items":[{"productVariantId":1,"unit":"TRAY","quantity":10}]}'
```
**Expected:** Status `201`, response berisi `midtransSnapToken`. Cek via Prisma Studio: `Order.paymentType: MIDTRANS`, `paymentStatus: UNPAID`, `midtransOrderId` terisi sama dengan `orderNumber`, stok sudah berkurang.

### Skenario 2 — Buka Snap Token di Browser (Manual)
Buat halaman HTML sederhana (atau pakai contoh dari dokumentasi Midtrans) yang memuat:
```html
<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="<MIDTRANS_CLIENT_KEY>"></script>
<script>
  snap.pay("<midtransSnapToken dari Skenario 1>");
</script>
```
**Expected:** Popup pembayaran Midtrans sandbox muncul dengan opsi QRIS/e-wallet/VA, menampilkan nominal sesuai `totalAmount`.

### Skenario 3 — Simulasikan Kegagalan Midtrans (Compensating Action)
Sengaja ubah `MIDTRANS_SERVER_KEY` di `.env` jadi nilai salah (misal tambahkan karakter acak), restart server, lalu ulangi Skenario 1.
**Expected:** Status `500` dengan pesan jelas. Cek via Prisma Studio: **tidak ada** `Order`/`OrderItem` baru tersisa di database (sudah dihapus lewat compensating action), dan `ProductVariant.stockKg` **kembali ke nilai semula** (tidak jadi berkurang). Setelah test ini, kembalikan `.env` ke server key yang benar.

### Skenario 4 — order_id Selalu Unik
Lakukan 2x checkout Midtrans berturut-turut (dengan server key yang sudah benar lagi).
**Expected:** Kedua `midtransOrderId` berbeda (mengikuti `orderNumber` yang berbeda) — Midtrans akan menolak `order_id` yang sama dipakai dua kali, jadi ini penting dipastikan tidak terjadi.

---

## Catatan
- `gross_amount` yang dikirim ke Midtrans **wajib bilangan bulat** (tidak boleh desimal) — makanya dibungkus `Math.round()`.
- Compensating action di Langkah D adalah bagian yang paling gampang terlewat tapi paling penting — pastikan benar-benar diuji lewat Skenario 3, jangan cuma dibaca kodenya.
- Update status pembayaran dari `UNPAID` ke `PAID` **tidak** terjadi di issue ini — itu tugas issue "Webhook Midtrans" berikutnya, yang menerima notifikasi dari Midtrans setelah customer benar-benar membayar di popup Snap.
