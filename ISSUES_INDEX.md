# ISSUES_INDEX.md — Daftar Urutan Pengerjaan Issue

> Dokumen ini berisi daftar semua issue yang harus dikerjakan, diurutkan berdasarkan prioritas dan dependensi. Kerjakan issue sesuai urutan yang tercantum di sini.

## Status Legend
- ⏳ **TODO** — Belum dikerjakan
- 🚧 **IN PROGRESS** — Sedang dikerjakan
- ✅ **DONE** — Sudah selesai

---

## Fase 1: Project Setup (Foundation)

| No | Status | Issue | Deskripsi | File Detail |
|----|--------|-------|-----------|-------------|
| 1  | ✅     | Setup Monorepo | Initial project structure untuk backend, customer-app, dan admin-app | - |
| 2  | ✅     | Setup Backend API | Install dependencies, konfigurasi Prisma, environment setup | - |
| 3  | ✅     | Setup Customer App | Install dependencies React + Vite + Tailwind | - |
| 4  | ✅     | Setup Admin App | Install dependencies React + Vite + Tailwind + shadcn/ui | - |
| 5  | ✅     | Setup Planning Docs | Setup PRD, DATABASE, API_SPEC, DESIGN docs | - |
| 6  | 🚧     | Tempatkan AGENTS.md & CLAUDE.md | Taruh file instruksi AI di root repo | - |

---

## Fase 2: Database & Core Backend (Issue 7-15)

| No | Status | Issue | Deskripsi | File Detail |
|----|--------|-------|-----------|-------------|
| 7  | ⏳     | Database Schema & Migration | Buat schema Prisma lengkap + migration awal | `issues/007-database-schema.md` |
| 8  | ⏳     | Seed Data | Data awal untuk testing (admin user, kategori, dll) | `issues/008-seed-data.md` |
| 9  | ✅     | Auth Module (Backend) | Register, login, refresh token, logout | `issues/009-auth-backend.md` |
| 10 | ⏳     | User Management (Backend) | CRUD user, change password, update profile | `issues/010-user-management.md` |
| 11 | ⏳     | Product Module (Backend) | CRUD produk + varian | `issues/011-product-module.md` |
| 12 | ⏳     | Category Module (Backend) | CRUD kategori | `issues/012-category-module.md` |
| 13 | ⏳     | Cart Module (Backend) | Add/update/remove items di keranjang | `issues/013-cart-module.md` |
| 14 | ⏳     | Order Module (Backend) | Create order, payment integration, webhook | `issues/014-order-module.md` |
| 15 | ⏳     | Stock Module (Backend) | Stock in/out, adjustment, history | `issues/015-stock-module.md` |

---

## Fase 3: Customer App (Issue 16-25)

| No | Status | Issue | Deskripsi | File Detail |
|----|--------|-------|-----------|-------------|
| 16 | ⏳     | Auth Pages (Customer) | Login, register, forgot password | `issues/016-customer-auth.md` |
| 17 | ⏳     | Home & Product List (Customer) | Homepage, list produk, filter, search | `issues/017-customer-home.md` |
| 18 | ⏳     | Product Detail (Customer) | Detail produk, pilih varian, add to cart | `issues/018-customer-product-detail.md` |
| 19 | ⏳     | Cart Page (Customer) | Keranjang, update qty, remove item | `issues/019-customer-cart.md` |
| 20 | ⏳     | Checkout Page (Customer) | Form alamat, pilih payment, create order | `issues/020-customer-checkout.md` |
| 21 | ⏳     | Order History (Customer) | List order, detail order, status tracking | `issues/021-customer-order-history.md` |
| 22 | ⏳     | Profile Page (Customer) | Edit profile, change password, membership info | `issues/022-customer-profile.md` |
| 23 | ⏳     | Notification (Customer) | Toast notification untuk success/error | `issues/023-customer-notification.md` |
| 24 | ⏳     | Responsive Design (Customer) | Pastikan mobile-friendly | `issues/024-customer-responsive.md` |
| 25 | ⏳     | Customer App Final Polish | Bug fixes, loading states, error handling | `issues/025-customer-final-polish.md` |

---

## Fase 4: Admin App (Issue 26-35)

| No | Status | Issue | Deskripsi | File Detail |
|----|--------|-------|-----------|-------------|
| 26 | ⏳     | Auth Pages (Admin) | Login admin/staff | `issues/026-admin-auth.md` |
| 27 | ⏳     | Dashboard (Admin) | Overview: total order, revenue, low stock alert | `issues/027-admin-dashboard.md` |
| 28 | ⏳     | Product Management (Admin) | CRUD produk + varian, upload gambar | `issues/028-admin-product-management.md` |
| 29 | ⏳     | Category Management (Admin) | CRUD kategori | `issues/029-admin-category-management.md` |
| 30 | ⏳     | Order Management (Admin) | List order, update status, cancel order | `issues/030-admin-order-management.md` |
| 31 | ⏳     | Stock Management (Admin) | Stock in/out, adjustment, view history | `issues/031-admin-stock-management.md` |
| 32 | ⏳     | User Management (Admin) | List users, upgrade to member, block user | `issues/032-admin-user-management.md` |
| 33 | ⏳     | Report (Admin) | Sales report, stock report, customer report | `issues/033-admin-report.md` |
| 34 | ⏳     | Settings (Admin) | Membership config, payment settings | `issues/034-admin-settings.md` |
| 35 | ⏳     | Admin App Final Polish | Bug fixes, loading states, permission checks | `issues/035-admin-final-polish.md` |

---

## Fase 5: Integration & Testing (Issue 36-40)

| No | Status | Issue | Deskripsi | File Detail |
|----|--------|-------|-----------|-------------|
| 36 | ⏳     | End-to-End Testing | Test full flow: register → browse → checkout → payment | `issues/036-e2e-testing.md` |
| 37 | ⏳     | Payment Integration Testing | Test Midtrans sandbox + webhook | `issues/037-payment-testing.md` |
| 38 | ⏳     | Security Audit | Check SQL injection, XSS, auth bypass, dll | `issues/038-security-audit.md` |
| 39 | ⏳     | Performance Optimization | Query optimization, lazy loading, caching | `issues/039-performance-optimization.md` |
| 40 | ⏳     | Deployment Preparation | Setup production env, docker, CI/CD (optional) | `issues/040-deployment-prep.md` |

---

## Catatan Penting

1. **Jangan skip issue** — meski terlihat sederhana, setiap issue punya acceptance criteria yang harus dipenuhi.
2. **Jika ada blocker**, catat di issue yang bersangkutan dan laporkan ke pemilik proyek.
3. **Setelah selesai 1 issue**, update status di file ini dari ⏳ ke ✅.
4. **Jika ada perubahan skema/desain** yang tidak tercantum di `DATABASE.md`/`API_SPEC.md`/`DESIGN.md`, **berhenti dan konfirmasi dulu** sebelum lanjut.

---

## Progress Summary

- **Total Issues:** 40
- **Done:** 6 (15%)
- **In Progress:** 1 (2.5%)
- **TODO:** 33 (82.5%)

**Target:** Fase 1-2 selesai minggu ke-1, Fase 3-4 selesai minggu ke-2-3, Fase 5 selesai minggu ke-4.
