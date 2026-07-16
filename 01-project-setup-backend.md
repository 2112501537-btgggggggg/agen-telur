# Project Setup: Node.js + Express + Prisma + MySQL

## Overview

Buat REST API backend menggunakan stack berikut:

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: MySQL

---

## 1. Inisialisasi Project

- Jalankan `npm init -y` di folder `backend-api/` untuk membuat project baru.
- Pastikan entry point di-set ke `src/index.js`.
- Install semua dependency yang dibutuhkan menggunakan `npm install`.

**Dependencies:**
- `express`
- `cors`
- `dotenv`
- `prisma`
- `@prisma/client`
- `bcryptjs`
- `jsonwebtoken`
- `zod`
- `multer`

**Dev Dependencies:**
- `nodemon`

---

## 2. Struktur Folder

Gunakan struktur berikut sebagai panduan:

```
backend-api/
├── src/
│   ├── index.js          # Entry point, setup Express app
│   ├── routes/            # Definisi route per fitur/modul
│   ├── controllers/       # Handler request/response per route
│   ├── services/          # Business logic (dipanggil controller)
│   ├── middlewares/       # authMiddleware, roleMiddleware, errorHandler, dll
│   ├── validators/        # Skema validasi Zod per modul
│   └── utils/              # Helper (generateOrderNumber, dll)
├── prisma/
│   └── schema.prisma       # Skema database (diisi di issue berikutnya)
├── uploads/                 # Folder penyimpanan gambar produk
├── .env
└── .env.example
```

---

## 3. Setup Database

- Jalankan `npx prisma init` untuk membuat `prisma/schema.prisma` dan `.env`.
- Set `datasource db` ke provider `mysql`.
- Baca kredensial dari `.env` melalui variabel `DATABASE_URL`.
- **Belum perlu membuat model/tabel apa pun di issue ini** — skema tabel bisnis (User, Product, Order, dst) akan dibuat satu per satu di issue fitur berikutnya, digabung dengan implementasi fiturnya masing-masing.
- Cukup pastikan koneksi ke database berhasil (lihat bagian Verifikasi).

---

## 4. Konfigurasi Prisma

- Tambahkan script berikut di `package.json`:
  - `prisma:generate` → `prisma generate`
  - `migrate:dev` → `prisma migrate dev`
  - `prisma:studio` → `prisma studio` (opsional, untuk lihat data via browser)

---

## 5. Setup Express App

- Di `src/index.js`, buat instance Express app.
- Gunakan middleware `cors()` dan `express.json()`.
- Baca `PORT` dari `.env` (default 4000 jika tidak diset).
- Siapkan folder `routes/` untuk didaftarkan satu per satu di issue-issue fitur berikutnya (`app.use('/api/...', someRouter)`), tidak perlu diisi sekarang.

---

## 6. Contoh Endpoint

Buat minimal satu endpoint healthcheck:

- `GET /health` → response `{ "status": "ok" }` dengan status code 200.

Endpoint ini dipakai untuk memastikan server backend hidup dan bisa diakses, sebelum fitur bisnis mulai dibangun di issue selanjutnya.

---

## 7. Environment & Konfigurasi

- Buat file `.env` untuk menyimpan konfigurasi sensitif.
- Buat juga `.env.example` sebagai template tanpa nilai asli, isi:
  ```
  PORT=4000
  DATABASE_URL="mysql://user:password@localhost:3306/egg_shop"
  JWT_SECRET=changeme
  JWT_REFRESH_SECRET=changeme_too
  ```
- Gunakan package `dotenv` untuk membaca environment variable di `src/index.js`.

---

## 8. Development Script

Tambahkan script berikut di `package.json`:

- `dev` → jalankan server dengan hot reload (`nodemon src/index.js`)
- `start` → jalankan server production (`node src/index.js`)

---

## Catatan

- Tidak perlu membuat schema/tabel bisnis (User, Product, Order, dll) di issue ini — itu akan dikerjakan bertahap di issue-issue fitur berikutnya, masing-masing digabung dengan implementasi fiturnya.
- Tidak perlu authentication atau fitur lanjutan di tahap ini.
- Fokus pada setup yang bersih dan siap dikembangkan.
- Pastikan project bisa dijalankan dengan `npm run dev` setelah setup selesai, dan `GET /health` merespons `{"status":"ok"}`.
- Pastikan koneksi Prisma ke MySQL berhasil — cara cek: jalankan `npx prisma db pull` (atau `npx prisma migrate dev` dengan schema kosong) dan pastikan tidak ada error koneksi.
