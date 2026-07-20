# Perencanaan: Global Error Handler & Standarisasi Response

> **Catatan sebelum mulai:** Issue ini **beda sifatnya** dari issue-issue sebelumnya — ini bukan fitur baru, tapi **refactor lintas file** untuk merapikan error handling yang selama ini (issue #05-#27) ditulis manual di tiap controller. Karena menyentuh banyak file, kerjakan dengan hati-hati dan **jalankan ulang beberapa skenario test dari issue-issue sebelumnya** setelah selesai, untuk memastikan tidak ada yang rusak.

---

## 1. Spesifikasi Database

**Tidak ada perubahan database sama sekali** di issue ini.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── utils/AppError.js            # class error kustom
├── utils/asyncHandler.js         # wrapper untuk hilangkan try/catch berulang
├── middlewares/errorHandler.js   # middleware error global
├── middlewares/validate.js        # middleware validasi Zod generik
├── index.js                       # UPDATE: mount errorHandler paling akhir
└── controllers/*.js               # UPDATE: semua controller, ganti pola try/catch manual
└── services/*.js                  # UPDATE: semua service, lempar AppError alih-alih return/throw ad-hoc
```

---

## 3. Tahapan Implementasi

### Langkah 1: Buat Class `AppError`
Di `utils/AppError.js`:
```js
class AppError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
module.exports = AppError;
```

### Langkah 2: Buat `asyncHandler`
Di `utils/asyncHandler.js` — wrapper supaya controller tidak perlu `try/catch` manual di tiap fungsi:
```js
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
module.exports = asyncHandler;
```

### Langkah 3: Buat Middleware `errorHandler` Global
Di `middlewares/errorHandler.js`, tangani beberapa jenis error secara spesifik:
```js
function errorHandler(err, req, res, next) {
  // Error kustom kita sendiri
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors || undefined });
  }
  // Error validasi Zod
  if (err.name === 'ZodError') {
    const errors = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
  }
  // Error Prisma: unique constraint (duplikat)
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Data sudah ada (duplikat)' });
  }
  // Error Prisma: data tidak ditemukan
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
  }
  // Fallback — jangan bocorkan detail error internal ke client
  console.error(err); // tetap log detail lengkap untuk debugging
  return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
}
module.exports = errorHandler;
```

### Langkah 4: Buat Middleware `validate` Generik
Di `middlewares/validate.js` — supaya semua route tidak perlu manual `schema.parse(req.body)` satu-satu:
```js
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err); // ZodError akan ditangkap errorHandler
    }
  };
}
module.exports = validate;
```
Pakai sebagai middleware di route, contoh: `router.post('/register', validate(registerSchema), authController.register)`.

### Langkah 5: Mount Error Handler di `index.js`
**Penting:** `app.use(errorHandler)` harus jadi middleware **paling terakhir** yang di-mount, setelah semua routes.

### Langkah 6: Refactor Bertahap — Semua Controller & Service
Untuk **setiap** file di `controllers/*.js` dan `services/*.js` yang sudah dibuat dari issue #05 sampai #27:
1. Bungkus tiap handler controller dengan `asyncHandler(...)`, hapus `try/catch` manual yang sebelumnya ada di situ.
2. Di service, ganti setiap `throw new Error(...)` atau response error ad-hoc lainnya jadi `throw new AppError(statusCode, message)` (atau dengan `errors` array kalau relevan, misal untuk validasi custom di luar Zod).
3. Ganti route yang tadinya validasi manual (`schema.parse(req.body)` langsung di controller) jadi pakai middleware `validate(schema)` di level route.

**Checklist file yang perlu direfactor** (centang manual saat mengerjakan):
- [ ] `auth.controller.js` / `auth.service.js`
- [ ] `address.controller.js` / `address.service.js`
- [ ] `category.controller.js` / `category.service.js`
- [ ] `product.controller.js` / `product.service.js`
- [ ] `price.controller.js` / `price.service.js`
- [ ] `supplier.controller.js`, `stockIn.controller.js` / services terkait
- [ ] `stockAdjustment.controller.js` / service terkait
- [ ] `serviceArea.controller.js` / service terkait
- [ ] `membershipConfig.controller.js` / service terkait
- [ ] `checkout.controller.js` / `checkout.service.js`
- [ ] `order.controller.js` / `order.service.js` (paling banyak fungsi, cek teliti)
- [ ] `payment.controller.js` / `payment.service.js` — **kecuali** handler webhook Midtrans (issue #19), yang **tetap harus selalu response 200** sesuai aturan khusus di issue itu, jangan sampai tertimpa pola generik ini.
- [ ] `review.controller.js` / `review.service.js`
- [ ] `dashboard.controller.js` / service terkait

---

## 4. Verifikasi dan Pengujian

### Skenario 1 — Format Error Konsisten di Berbagai Modul
Trigger error di beberapa endpoint dari modul berbeda, pastikan **semuanya** punya bentuk `{ success: false, message, errors? }` yang sama persis strukturnya:
```bash
curl -i -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d '{"email":"bukan-email"}'
curl -i -X POST http://localhost:4000/api/admin/categories -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" -d '{"name":"Test"}'
curl -i http://localhost:4000/api/orders/99999 -H "Authorization: Bearer <token customer>"
```
**Expected:** Ketiganya (validasi gagal, akses ditolak, data tidak ditemukan) punya struktur JSON response yang identik pola-nya, hanya beda `message` dan status code.

### Skenario 2 — Regresi: Ulangi Beberapa Test dari Issue Sebelumnya
Jalankan ulang minimal 5 skenario test dari issue-issue sebelumnya yang **sebelumnya lolos** (pilih dari beberapa modul berbeda: auth, produk, order), pastikan **masih lolos** setelah refactor ini — tidak ada yang tidak sengaja rusak.

### Skenario 3 — Webhook Midtrans Tetap Response 200
Ulangi Skenario 2 dari issue #19 (signature salah).
**Expected:** Tetap response `200` seperti sebelumnya — **pastikan refactor ini tidak mengubah perilaku khusus endpoint webhook.**

### Skenario 4 — Error Tak Terduga Tidak Bocorkan Detail Internal
Coba picu error yang tidak biasa (misal matikan koneksi database sebentar, lalu panggil endpoint apa saja).
**Expected:** Status `500`, `message: "Terjadi kesalahan pada server"` — **tidak** menampilkan stack trace atau detail teknis ke client, tapi tetap ter-log di console server untuk debugging.

---

## Catatan
- Refactor ini murni soal konsistensi & maintainability — kalau ada bagian yang membuat Anda ragu apakah aman diubah, mending skip file itu dulu dan tandai untuk direview manual daripada memaksakan perubahan yang berisiko merusak endpoint yang sudah lolos test.
- Dengan selesainya issue ini, **seluruh backend (issue #01-#28) sudah lengkap dan konsisten**. Batch berikutnya masuk ke **Full Integration Test**, lalu **fase frontend**.
