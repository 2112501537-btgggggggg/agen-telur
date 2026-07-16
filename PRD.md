# PRD.md — Product Requirements Document
## Aplikasi Toko Agen Telur

## 1. Latar Belakang & Tujuan
Aplikasi web untuk agen/distributor telur yang melayani pelanggan retail (rumah tangga) maupun pembeli dalam jumlah besar (warung, restoran, toko kue) tanpa membedakan jenis akun — pembeda utama adalah status **member** yang didapat dari akumulasi total belanja. Aplikasi terdiri dari sisi **customer** (belanja online) dan **admin/toko** (kelola produk, stok, pesanan, laporan), dengan **REST API** sebagai penghubung keduanya.

## 2. Target Pengguna
| Persona | Deskripsi | Kebutuhan Utama |
|---|---|---|
| Pelanggan Retail | Beli untuk kebutuhan rumah tangga, jumlah kecil | Praktis, cepat, harga jelas |
| Pelanggan Grosir (B2B) | Warung, restoran, toko kue — beli rutin & dalam jumlah besar | Harga kompetitif (lewat diskon member), satuan tray/peti, riwayat transaksi rapi |
| Admin/Owner Toko | Pemilik atau pengelola toko | Kontrol stok, pantau penjualan, kelola supplier |
| Staff | Karyawan yang bantu proses pesanan | Update status pesanan, cek stok |

## 3. Business Rules (Disepakati)
1. **Tidak ada tipe akun terpisah** untuk retail vs B2B — satu tipe `CUSTOMER`, dibedakan lewat status member.
2. **Sistem member**: didapat otomatis berdasarkan akumulasi poin dari total belanja. Satu level member (tidak bertingkat), memberikan diskon tetap (persentase dikonfigurasi admin lewat `MembershipConfig`).
3. **Satuan jual**: kg, tray (30 butir ≈ 1.5kg), peti — rasio konversi **tetap sama untuk semua produk**, dikelola sebagai referensi global (`UnitConversion`), bukan per produk.
4. **Varian produk**: setiap produk punya grade/ukuran (Besar/Sedang/Kecil) sebagai varian terpisah dengan stok & harga masing-masing.
5. **Minimum order**: 5kg (dapat dikonfigurasi), dihitung dari **total berat gabungan semua item** dalam satu pesanan (bukan per produk).
6. **Pembayaran**: dua metode — (a) online via Midtrans (QRIS, e-wallet, VA, kartu), status diperbarui otomatis via webhook; atau (b) **COD (bayar di tempat saat barang diterima)**, status pembayaran dikonfirmasi manual oleh admin/staff/kurir setelah uang diterima. Tidak ada upload bukti transfer manual untuk metode Midtrans.
7. **Ongkos kirim**: gratis untuk semua pesanan dalam area layanan (berlaku untuk kedua metode pembayaran).
8. **Harga telur sangat fluktuatif** — admin harus bisa **update harga per kg kapan pun, idealnya tiap hari**, per grade/varian produk. Setiap perubahan harga dicatat sebagai riwayat (`PriceHistory`) untuk transparansi dan analisis tren, dan tidak memengaruhi harga di pesanan yang sudah dibuat sebelumnya (harga di `OrderItem` tetap snapshot).
9. **Area layanan**: dibatasi ke kota/kabupaten tertentu (`ServiceArea`), dicek saat checkout — alamat di luar area ditolak dengan pesan jelas.
10. **Checkout wajib login** — tidak ada guest checkout.
11. **Tidak ada fitur retur formal.** Sebagai gantinya, setelah pesanan berstatus DELIVERED, pelanggan dapat mengisi review opsional: rating bintang, komentar, dan jumlah telur cacat (retak/pecah).
12. **Stok masuk** dicatat melalui pencatatan pembelian dari `Supplier` (peternak), terpisah dari transaksi penjualan ke customer.
13. **Notifikasi** cukup in-app dulu (badge/notifikasi status pesanan di dashboard customer), tanpa WhatsApp/email di versi awal.

## 4. Fitur Inti (In Scope — MVP)

### Sisi Customer
- Register/login, kelola profil & multi-alamat
- Browsing produk (filter kategori, grade, search), lihat harga per kg/tray/peti
- Keranjang belanja (client-side)
- Checkout dengan validasi: area layanan, minimum order 5kg, hitung otomatis diskon member
- Pembayaran via Midtrans Snap
- Riwayat & tracking status pesanan
- Review pasca-pesanan (rating, komentar, jumlah cacat)
- Lihat status member & poin

### Sisi Admin/Toko
- Login admin/staff dengan role (ADMIN/STAFF)
- CRUD kategori & produk (termasuk grade, harga per kg, upload gambar)
- **Menu Update Harga Harian**: halaman khusus untuk melihat & mengubah harga semua varian produk sekaligus (quick-edit table), dengan indikator perubahan dibanding harga sebelumnya, dan riwayat harga per produk
- Kelola stok: pembelian dari supplier (StockIn), penyesuaian manual
- Kelola supplier
- Kelola pesanan: lihat daftar, ubah status, lihat status pembayaran (otomatis dari Midtrans untuk pembayaran online, atau konfirmasi manual "Tandai Sudah Dibayar" untuk pesanan COD)
- Kelola `ServiceArea` (area layanan)
- Kelola `MembershipConfig` (aturan poin & diskon)
- Dashboard: ringkasan penjualan, stok menipis, produk dengan komplain cacat terbanyak
- Lihat review pelanggan per produk

## 5. Out of Scope (Versi Awal)
- Sistem hutang/piutang (bayar tempo)
- Retur formal / refund otomatis
- Notifikasi WhatsApp/email otomatis
- Multi-gudang / multi-cabang
- Aplikasi mobile native (fokus web dulu)
- Kalkulasi ongkir dinamis (karena gratis ongkir)

## 6. Referensi Dokumen Terkait
- Struktur data lengkap → `DATABASE.md`
- Daftar & spesifikasi endpoint → `API_SPEC.md`
- Aturan untuk AI coding agent → `AGENT.md`
- Panduan visual/UI → `DESIGN.md`
