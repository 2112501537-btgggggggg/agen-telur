# Agen Telur — Sistem Manajemen Penjualan Telur

> Aplikasi fullstack untuk manajemen penjualan telur dengan fitur customer app (pemesanan) dan admin app (inventory & order management).

---

## 📋 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Prisma
- **Auth:** JWT (access token + refresh token)
- **Validation:** Zod
- **File Upload:** Multer (local storage)
- **Payment:** Midtrans (Snap API + webhook)

### Frontend
- **Customer App:** React + Vite + Tailwind CSS
- **Admin App:** React + Vite + Tailwind CSS + shadcn/ui
- **State Management:** React Context API
- **HTTP Client:** Axios

---

## 🏗️ Struktur Monorepo

```
agen-telur/
├── backend-api/          # Backend API (Express + Prisma)
├── customer-app/         # Customer-facing web app
├── admin-app/            # Admin & staff web app
├── issues/               # Individual issue files (task breakdown)
├── AGENTS.md             # Aturan untuk AI coding agent
├── CLAUDE.md             # Auto-loaded by Claude Code
├── PRD.md                # Product Requirements Document
├── DATABASE.md           # Database schema & business rules
├── API_SPEC.md           # API endpoint specifications
├── DESIGN.md             # Design system & visual guidelines
└── ISSUES_INDEX.md       # Daftar urutan pengerjaan issue
```

---

## 🔄 Development Workflow

Proyek ini menggunakan pendekatan **"planning dulu, eksekusi belakangan"**:

1. **Planning Phase (Done)**
   - Semua requirements, database schema, API spec, dan design sudah disiapkan di file `PRD.md`, `DATABASE.md`, `API_SPEC.md`, dan `DESIGN.md`.
   - Breakdown task detail ada di folder `issues/`, urutan pengerjaan di `ISSUES_INDEX.md`.

2. **Execution Phase (Current)**
   - AI coding agent mengerjakan issue satu per satu sesuai urutan di `ISSUES_INDEX.md`.
   - Setiap issue punya acceptance criteria yang harus dipenuhi sebelum lanjut ke issue berikutnya.
   - **Aturan proyek lengkap ada di `AGENTS.md`** — wajib dibaca sebelum coding.

3. **Testing & Deployment Phase**
   - End-to-end testing (issue 36-40)
   - Security audit & performance optimization
   - Production deployment preparation

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MySQL >= 8.0
- npm atau yarn

### Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/2112501537-btgggggggg/agen-telur.git
   cd agen-telur
   ```

2. **Setup Backend**
   ```bash
   cd backend-api
   npm install
   cp .env.example .env
   # Edit .env dengan database credentials Anda
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

3. **Setup Customer App**
   ```bash
   cd customer-app
   npm install
   cp .env.example .env
   # Edit .env dengan backend API URL
   npm run dev
   ```

4. **Setup Admin App**
   ```bash
   cd admin-app
   npm install
   cp .env.example .env
   # Edit .env dengan backend API URL
   npm run dev
   ```

---

## 📚 Dokumentasi

### Untuk Developer
- **[AGENTS.md](./AGENTS.md)** — Aturan & workflow untuk AI coding agent
- **[PRD.md](./PRD.md)** — Business requirements & scope fitur
- **[DATABASE.md](./DATABASE.md)** — Database schema & relationship
- **[API_SPEC.md](./API_SPEC.md)** — API endpoint documentation
- **[DESIGN.md](./DESIGN.md)** — Design system & UI guidelines

### Task Management
- **[ISSUES_INDEX.md](./ISSUES_INDEX.md)** — Master list urutan issue
- **[issues/](./issues/)** — Individual issue files dengan acceptance criteria

---

## 🎯 Current Status

**Fase 1: Project Setup** ✅ (Done)
- Monorepo structure
- Backend, customer-app, dan admin-app boilerplate
- Planning documents

**Fase 2: Database & Core Backend** ⏳ (Next)
- Database schema & migration
- Auth module
- Core API endpoints (product, order, stock, etc.)

**Fase 3-5:** Customer App → Admin App → Testing & Deployment

Lihat progress lengkap di [ISSUES_INDEX.md](./ISSUES_INDEX.md).

---

## 👥 Team

- **Project Owner:** [2112501537-btgggggggg](https://github.com/2112501537-btgggggggg)
- **Planning:** AI Planner (Claude Sonnet 4.0)
- **Execution:** AI Coding Agent (mengikuti aturan di `AGENTS.md`)

---

## 📄 License

[Tentukan license Anda di sini]

---

## 🤝 Contributing

Karena proyek ini menggunakan AI-driven development workflow:
1. Jangan langsung edit kode — buat issue baru di GitHub dulu.
2. Issue akan dikerjakan oleh AI agent sesuai urutan prioritas.
3. Review PR yang dibuat oleh agent, berikan feedback jika ada yang perlu diperbaiki.

---

## 📞 Support

Jika ada pertanyaan atau menemukan bug, buat issue baru di [GitHub Issues](https://github.com/2112501537-btgggggggg/agen-telur/issues).
