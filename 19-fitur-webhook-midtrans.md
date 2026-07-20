# Perencanaan: Webhook Midtrans

Dokumen ini adalah panduan untuk menerima notifikasi pembayaran dari Midtrans (dipanggil otomatis oleh server Midtrans, bukan oleh frontend kita) dan memperbarui status pembayaran order sesuai hasilnya.

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Mengisi `Order.paymentStatus`, `Order.paymentChannel`, `Order.midtransTransactionId` yang dibuat di issue #17.

> **Prasyarat:** Daftarkan URL webhook ini di Dashboard Sandbox Midtrans (Settings → Configuration → Payment Notification URL). Karena `localhost` tidak bisa diakses dari internet, untuk testing lokal gunakan tool tunnel seperti `ngrok` (`ngrok http 4000`) supaya dapat URL publik sementara, atau untuk verifikasi awal cukup simulasikan payload secara manual lewat `curl` (lihat bagian Verifikasi).

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── utils/midtransSignature.util.js   # verifySignature()
├── services/payment.service.js        # handleMidtransNotification()
├── controllers/payment.controller.js
└── routes/payment.routes.js           # POST /api/payments/midtrans/webhook
```

---

## 3. Tahapan Implementasi

### Langkah 1: Utility Verifikasi Signature
Midtrans mengirim `signature_key` di tiap notifikasi, dihitung dari `order_id + status_code + gross_amount + ServerKey` (SHA512). Di `utils/midtransSignature.util.js`:
```js
const crypto = require('crypto');

function verifySignature({ order_id, status_code, gross_amount, signature_key }) {
  const raw = order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto.createHash('sha512').update(raw).digest('hex');
  return expectedSignature === signature_key;
}

module.exports = { verifySignature };
```

### Langkah 2: Service — Handle Notification
Di `payment.service.js`, buat `handleMidtransNotification(payload)`:
1. Panggil `verifySignature(payload)`. Jika `false`, lempar error 401 ("Signature tidak valid").
2. Cari `Order` dengan `orderNumber === payload.order_id`. Jika tidak ditemukan, lempar error 404.
3. Petakan `payload.transaction_status` (dan `payload.fraud_status` untuk kasus kartu kredit) ke `paymentStatus` kita:
   - `transaction_status === 'capture'` dan `fraud_status === 'accept'` → `PAID`
   - `transaction_status === 'settlement'` → `PAID`
   - `transaction_status === 'pending'` → tetap `UNPAID` (tidak berubah)
   - `transaction_status === 'deny'` atau `'cancel'` → `FAILED`
   - `transaction_status === 'expire'` → `EXPIRED`
4. Update `Order`: `paymentStatus` (hasil pemetaan), `paymentChannel: payload.payment_type`, `midtransTransactionId: payload.transaction_id`.
5. Return sukses. **Idempotent**: kalau webhook ini terpanggil 2x untuk status yang sama (Midtrans kadang retry), hasil akhirnya harus tetap sama, tidak boleh ada efek samping ganda (issue ini hanya update field, jadi otomatis aman/idempotent — tidak perlu penanganan khusus tambahan).

### Langkah 3: Controller & Route
Buat handler `midtransWebhook(req, res)`:
1. Panggil `handleMidtransNotification(req.body)`.
2. **Apa pun hasilnya (asal tidak error fatal), selalu response `200 OK`** ke Midtrans — kalau server kita response selain 200, Midtrans akan terus mencoba kirim ulang notifikasi yang sama berkali-kali.

Daftarkan `POST /api/payments/midtrans/webhook` — **TIDAK memakai `authMiddleware`** (Midtrans memanggil endpoint ini langsung, tidak punya token JWT kita; keamanannya dijamin lewat `verifySignature`, bukan lewat auth header).

---

## 4. Verifikasi dan Pengujian

> Untuk testing manual tanpa perlu `ngrok`, hitung signature secara manual dulu di Node REPL atau script kecil:
> ```js
> const crypto = require('crypto');
> const order_id = 'ORD-20260711-0001'; // ganti sesuai order dari issue #18
> const status_code = '200';
> const gross_amount = '324900.00'; // format Midtrans: 2 desimal
> const raw = order_id + status_code + gross_amount + '<MIDTRANS_SERVER_KEY Anda>';
> console.log(crypto.createHash('sha512').update(raw).digest('hex'));
> ```

### Skenario 1 — Notifikasi Pembayaran Sukses (Settlement)
```bash
curl -i -X POST http://localhost:4000/api/payments/midtrans/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-20260711-0001",
    "status_code": "200",
    "gross_amount": "324900.00",
    "transaction_status": "settlement",
    "payment_type": "qris",
    "transaction_id": "abc-123-def",
    "signature_key": "<hasil hitung manual di atas>"
  }'
```
**Expected:** Status `200`. Cek Prisma Studio: `Order.paymentStatus: PAID`, `paymentChannel: qris`, `midtransTransactionId: abc-123-def`.

### Skenario 2 — Signature Salah
Ulangi Skenario 1 dengan `signature_key` diubah jadi string acak.
**Expected:** Endpoint tetap response `200` ke Midtrans (sesuai aturan Langkah 3), **tapi** `Order.paymentStatus` **tidak berubah** — cek log server untuk konfirmasi error signature terdeteksi secara internal meskipun response ke Midtrans tetap 200.

### Skenario 3 — Order Tidak Ditemukan
Kirim payload dengan `order_id` yang tidak ada di database.
**Expected:** Response tetap `200` ke Midtrans (jangan sampai Midtrans retry terus karena order memang tidak akan pernah ada), tapi tidak ada perubahan data apa pun.

### Skenario 4 — Transaction Expire
Ulangi Skenario 1 dengan `transaction_status: "expire"` dan signature yang dihitung ulang sesuai payload baru.
**Expected:** `Order.paymentStatus: EXPIRED`.

### Skenario 5 — Transaction Pending
Ulangi dengan `transaction_status: "pending"`.
**Expected:** `Order.paymentStatus` **tetap `UNPAID`**, tidak berubah jadi status lain.

---

## Catatan
- **Selalu response `200`** ke Midtrans terlepas dari hasil internal (signature invalid, order tidak ketemu, dll) — ini beda dengan pola error handling di endpoint lain yang biasanya return 401/404 apa adanya. Aturan ini khusus untuk endpoint webhook supaya Midtrans tidak spam retry.
- Dengan selesainya issue ini, **alur checkout end-to-end sudah lengkap**: customer checkout → (COD langsung UNPAID menunggu konfirmasi admin, atau Midtrans → bayar di Snap popup → webhook update status otomatis).
- Update `Order.status` (PENDING → CONFIRMED → dst, yang dikontrol admin) **belum** disentuh sama sekali oleh webhook ini — itu murni tugas issue "Kelola Order Admin" berikutnya. Webhook ini **hanya** mengurus `paymentStatus`.
