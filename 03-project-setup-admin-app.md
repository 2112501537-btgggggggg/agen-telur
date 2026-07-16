# Project Setup: Admin-App (React + Vite + Tailwind CSS + shadcn/ui)

## Overview

Buat frontend admin menggunakan stack berikut:

- **Build tool**: Vite
- **Library**: React
- **Styling**: Tailwind CSS + shadcn/ui
- **HTTP client**: Axios
- **Icon set**: Lucide React

Frontend ini dipakai admin/staff toko untuk kelola produk, harga, stok, dan pesanan. Karena banyak tampilan tabel & form data-heavy, dipakai shadcn/ui di atas Tailwind. Belum ada fitur bisnis di issue ini.

---

## 1. Inisialisasi Project

- Jalankan `npm create vite@latest admin-app -- --template react` di root repo (folder `admin-app/` sudah ada kosong dari setup awal).
- Install dependency tambahan: `axios`, `lucide-react`, `react-router-dom`.

---

## 2. Struktur Folder

Gunakan struktur berikut sebagai panduan:

```
admin-app/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/            # 1 file per halaman (Dashboard, Products, Orders, dst)
│   ├── components/
│   │   ├── ui/            # komponen hasil generate shadcn/ui
│   │   └── layout/         # Sidebar.jsx, Header.jsx
│   ├── api/                 # axiosClient.js + 1 file per modul API
│   ├── context/              # AuthContext (admin)
│   ├── hooks/
│   └── lib/                  # utils.js (dari shadcn init)
├── components.json            # config shadcn
├── .env
└── .env.example
```

---

## 3. Setup Tailwind CSS + shadcn/ui

- Install Tailwind CSS mengikuti panduan resmi untuk Vite.
- Tambahkan warna kustom yang sama dengan customer-app (lihat `DESIGN.md`), tapi admin-app dominan pakai warna netral (putih/cream + aksen Egg Yolk secukupnya untuk tombol utama).
- Jalankan `npx shadcn@latest init` — pilih style default, base color netral, konfirmasi path alias `@/*` mengarah ke `src/*`.
- Install komponen dasar:
  ```bash
  npx shadcn@latest add button table dialog input select card badge
  ```

---

## 4. Setup API Client

- Sama seperti `customer-app`: buat `src/api/axiosClient.js` dengan `baseURL` dari `VITE_API_URL` dan interceptor attach token dari `localStorage` (gunakan key berbeda, misal `adminAccessToken`, supaya tidak bentrok kalau customer-app & admin-app pernah dibuka di browser yang sama).

---

## 5. Komponen Layout Dasar

- Buat `src/components/layout/Sidebar.jsx` — sidebar kiri fixed dengan menu placeholder (belum perlu routing sungguhan):
  - Dashboard
  - Produk
  - Update Harga
  - Kategori
  - Supplier
  - Pesanan
  - Service Area
- Gunakan ikon dari `lucide-react` untuk tiap menu (cari ikon bertema sesuai: Store, DollarSign, Tag, Truck, Package, MapPin).
- Setup routing dasar dengan `react-router-dom` (`BrowserRouter`, beberapa `<Route>` placeholder yang render halaman kosong).

---

## 6. Halaman Percobaan

- Buat `src/pages/TestPage.jsx` yang merender `<Button>` dan `<Table>` dari shadcn/ui dengan 2-3 baris data dummy, untuk memverifikasi shadcn/ui terpasang benar.

---

## 7. Environment & Konfigurasi

- Buat `.env.example`:
  ```
  VITE_API_URL=http://localhost:4000/api
  ```
- Salin jadi `.env`.

---

## 8. Development Script

Pastikan `package.json` sudah punya `dev` dan `build` (default Vite).

---

## Catatan

- Tidak perlu membuat halaman bisnis sungguhan (Dashboard, Kelola Produk, dll) di issue ini — itu dikerjakan di issue fitur masing-masing.
- Tidak perlu authentication/login sungguhan — cukup kerangka `AuthContext` kosong yang siap diisi.
- Pastikan `npm run dev` jalan, Sidebar placeholder tampil, dan halaman test menampilkan `<Button>`+`<Table>` shadcn/ui dengan styling benar (bukan HTML polos) di browser.
- Setelah diverifikasi, hapus routing ke `TestPage.jsx` (boleh simpan filenya untuk referensi, tapi jangan tampil di navigasi utama).
