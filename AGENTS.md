# AGENT.md — Instruksi untuk AI Coding Agent

> Dokumen ini adalah "aturan main" untuk model AI yang mengeksekusi pembangunan aplikasi ini (biasanya model yang lebih murah/cepat dibanding model planner). Baca dokumen ini SEBELUM mengerjakan issue apa pun.

> **Catatan penggunaan:** Jika Anda menjalankan eksekusi lewat **Claude Code**, salin isi file ini (atau buat ringkasannya) ke file `CLAUDE.md` di root repo — Claude Code otomatis membaca `CLAUDE.md` di awal setiap sesi. Dokumen lain (`PRD.md`, `DATABASE.md`, `API_SPEC.md`, `DESIGN.md`) **tidak dibaca otomatis** — harus direferensikan di `CLAUDE.md` atau disebutkan eksplisit di prompt/issue agar dibaca modelnya. Lihat penjelasan lengkap mekanismenya di percakapan dengan planner.

## Dokumen Rujukan Wajib
Sebelum mengerjakan issue apa pun, pastikan sudah membaca:
1. `PRD.md` — business rules & scope fitur
2. `DATABASE.md` — struktur database, JANGAN menyimpang dari skema ini tanpa alasan kuat & mencatat perubahannya
3. `API_SPEC.md` — kontrak endpoint, path & response harus sesuai ini
4. `DESIGN.md` — panduan visual, JANGAN pakai warna/gaya di luar ini tanpa alasan

## Tech Stack (Wajib, Jangan Diganti)
- Backend: Node.js + Express.js + Prisma ORM + MySQL
- Auth: JWT (access token + refresh token)
- Validasi: Zod
- Upload file: Multer (local storage folder `/uploads`)
- Payment: Midtrans (Snap API + webhook)
- Frontend Customer: React + Vite + Tailwind CSS
- Frontend Admin: React + Vite + Tailwind CSS + shadcn/ui

Jangan mengganti library inti (misal ganti Prisma ke Sequelize, atau Express ke Fastify) tanpa persetujuan eksplisit dari pemilik proyek.

## Struktur Folder Backend (Wajib)
```
backend-api/
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── routes/          # 1 file per modul (auth.routes.js, product.routes.js, dst)
│   ├── controllers/      # logika request/response
│   ├── services/          # business logic (dipanggil controller)
│   ├── middlewares/       # authMiddleware, roleMiddleware, errorHandler
│   ├── utils/             # helper (generateOrderNumber, dll)
│   ├── validators/        # skema Zod per modul
│   └── index.js
└── uploads/
```

## Konvensi Kode
- Penamaan file: `camelCase.js` untuk file biasa, `PascalCase` untuk komponen React.
- Penamaan route: gunakan kebab-case di URL (`/stock-in`, bukan `/stockIn`).
- Semua response API **wajib** mengikuti format standar di `API_SPEC.md` — jangan buat format ad-hoc.
- Semua endpoint yang butuh login **wajib** melalui `authMiddleware`; endpoint admin **wajib** tambahan `requireRole(['ADMIN'])` atau `requireRole(['ADMIN','STAFF'])` sesuai kebutuhan.
- Semua angka uang & berat pakai tipe `Decimal` di Prisma (bukan Float) untuk menghindari floating point error.
- Operasi yang melibatkan lebih dari 1 tabel (checkout, cancel order, stock adjustment) **wajib** dibungkus `prisma.$transaction`.

## Alur Kerja Eksekusi
1. Kerjakan issue **satu per satu**, sesuai urutan nomor di `issue.md` (dibuat terpisah setelah dokumen ini selesai).
2. Setelah selesai 1 issue, jalankan/tes acceptance criteria-nya sebelum lanjut.
3. Jika issue butuh keputusan yang tidak diatur di `PRD.md`/`DATABASE.md`/`API_SPEC.md`/`DESIGN.md`, ambil keputusan yang paling masuk akal & konsisten dengan pola yang sudah ada — jangan berhenti untuk hal trivial (nama variabel, dsb).
4. Jika issue butuh mengubah skema database di luar yang direncanakan di `DATABASE.md`, **berhenti dan laporkan** ke pemilik proyek dulu — jangan langsung migrate.
5. Selalu tulis kode yang bisa langsung dijalankan (`npm run dev` / `npm run build` tanpa error) sebelum melaporkan issue selesai.

## Larangan
- Jangan menambah dependency baru yang tidak disebut di atas tanpa alasan jelas di penjelasan hasil kerja.
- Jangan menghapus/mengubah struktur tabel yang sudah dipakai fitur lain tanpa migration yang aman (gunakan `migrate dev`, jangan edit database manual).
- Jangan hardcode nilai bisnis (harga diskon member, minimum order, threshold stok, harga produk) — semua harus dari tabel config (`MembershipConfig`) atau tabel produk (`ProductVariant.pricePerKg`) sesuai `DATABASE.md`.
- Setiap update harga produk **wajib** membuat baris `PriceHistory` — jangan pernah update `pricePerKg` tanpa mencatat riwayatnya.
- Logika checkout wajib bercabang sesuai `paymentType` (MIDTRANS vs COD) sesuai `API_SPEC.md` — jangan asumsikan semua order melalui Midtrans.
- Jangan expose `password` atau data sensitif lain di response API manapun.
