# Project Setup: Customer-App (React + Vite + Tailwind CSS)

## Overview

Buat frontend customer menggunakan stack berikut:

- **Build tool**: Vite
- **Library**: React
- **Styling**: Tailwind CSS
- **HTTP client**: Axios

Frontend ini dipakai pelanggan untuk browsing produk, checkout, dan lihat riwayat pesanan. Belum ada fitur bisnis di issue ini — fokus hanya kerangka project yang siap dikembangkan di issue-issue fitur berikutnya.

---

## 1. Inisialisasi Project

- Jalankan `npm create vite@latest customer-app -- --template react` di root repo (folder `customer-app/` sudah ada kosong dari setup awal — pastikan proses ini mengisi ke dalamnya).
- Install dependency tambahan: `axios`.

---

## 2. Struktur Folder

Gunakan struktur berikut sebagai panduan:

```
customer-app/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/           # 1 file per halaman (Home, ProductDetail, Cart, Checkout, dst)
│   ├── components/       # Komponen reusable (ProductCard, Navbar, dst)
│   ├── api/               # axiosClient.js + 1 file per modul API (products.api.js, orders.api.js, dst)
│   ├── context/            # AuthContext, CartContext
│   └── hooks/
├── .env
└── .env.example
```

---

## 3. Setup Tailwind CSS

- Install Tailwind CSS mengikuti panduan resmi untuk Vite (plugin `@tailwindcss/vite`).
- Tambahkan warna kustom sesuai `DESIGN.md` ke konfigurasi Tailwind:
  - `egg-yolk: #F5A623`
  - `warm-amber: #D4820A`
  - `fresh-cream: #FFF8EC`
  - `barn-brown: #5C4033`
  - `fresh-green: #6FA96E`
  - `alert-red: #E0553F`
  - `straw-yellow: #FCE9C5`

---

## 4. Setup API Client

Buat `src/api/axiosClient.js`:

```js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Interceptor: attach token dari localStorage jika ada
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
```

Belum perlu membuat file `*.api.js` per modul (products.api.js, dst) — itu dibuat bersamaan dengan issue fitur yang membutuhkannya.

---

## 5. Environment & Konfigurasi

- Buat `.env.example`:
  ```
  VITE_API_URL=http://localhost:4000/api
  ```
- Salin jadi `.env` (sudah di-gitignore dari setup monorepo).

---

## 6. Halaman Percobaan

- Buat `src/App.jsx` sementara yang merender 1 elemen dengan warna kustom Tailwind, contoh:
  ```jsx
  <div className="bg-egg-yolk text-white p-4 rounded-lg">
    Customer App — Setup OK
  </div>
  ```
- Ini hanya untuk memverifikasi Tailwind + warna kustom aktif, akan diganti halaman sungguhan di issue berikutnya.

---

## 7. Development Script

Pastikan `package.json` (hasil default Vite) sudah punya:
- `dev` → `vite`
- `build` → `vite build`

---

## Catatan

- Tidak perlu membuat halaman/komponen bisnis apa pun di issue ini (Home, Cart, dll dibuat di issue fitur masing-masing).
- Tidak perlu integrasi API sungguhan — `axiosClient.js` cukup siap dipakai.
- Pastikan project bisa dijalankan dengan `npm run dev`, dan elemen percobaan tampil dengan warna oranye (Egg Yolk) yang benar di browser.
- Setelah diverifikasi, kosongkan kembali `App.jsx` jadi placeholder sederhana (jangan hapus tapi juga jangan biarkan elemen test tertinggal permanen).
