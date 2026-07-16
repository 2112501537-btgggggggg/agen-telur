# Project Setup: Tempatkan AGENTS.md & CLAUDE.md di Root Repo

## Overview

Taruh file instruksi proyek (`AGENTS.md` dan `CLAUDE.md`) yang sudah disiapkan planner ke root repo, supaya otomatis terbaca oleh tool AI coding apa pun yang dipakai untuk eksekusi issue-issue selanjutnya.

---

## 1. Salin File

- Salin file `AGENTS.md` (sudah disiapkan planner) ke root repo, sejajar dengan folder `backend-api/`, `customer-app/`, `admin-app/`.
- Salin file `CLAUDE.md` (isinya cuma 1 baris `@AGENTS.md` + catatan singkat) ke root repo juga.

---

## 2. Salin Dokumen Pendukung Lain

Salin juga ke root repo (kalau belum ada):
- `PRD.md`
- `DATABASE.md`
- `API_SPEC.md`
- `DESIGN.md`
- `ISSUES_INDEX.md`
- Folder `issues/` berisi semua file issue individual

---

## 3. Update README.md

- Tambahkan bagian di `README.md` (dibuat di issue pertama monorepo) yang menjelaskan singkat:
  - Proyek ini pakai workflow "planning dulu, eksekusi belakangan"
  - Semua aturan proyek ada di `AGENTS.md`
  - Semua tugas ada di folder `issues/`, urutan pengerjaan di `ISSUES_INDEX.md`

---

## Catatan

- Ini bukan issue coding — cukup file management & commit.
- Verifikasi: buka repo di file explorer/`ls -la` root, pastikan semua file di atas ada dan bisa dibaca.
- Commit dengan pesan: `docs: add project planning documents`.
