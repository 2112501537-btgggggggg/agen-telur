# Perencanaan: Full Integration Test

> **Catatan sebelum mulai:** Issue ini **beda sifatnya** dari semua issue sebelumnya — tidak ada kode fitur baru yang ditulis. Ini adalah verifikasi menyeluruh bahwa **seluruh 28 issue backend sebelumnya benar-benar bekerja sama dengan benar sebagai satu sistem utuh**, bukan cuma lolos test secara terisolasi satu-satu. Anggap ini "gladi resik" sebelum lanjut ke fase frontend.

---

## 1. Tujuan

1. Memastikan `prisma/schema.prisma` benar-benar cocok 100% dengan `DATABASE.md` (15 tabel).
2. Menjalankan **1 alur bisnis panjang dan berkesinambungan** (bukan skenario terpisah-pisah seperti di issue lain) untuk menemukan bug yang cuma muncul saat fitur-fitur saling berinteraksi.
3. Memverifikasi konsistensi data secara matematis di akhir (stok, poin, total transaksi semua harus "pas").
4. Mendokumentasikan hasilnya di `TESTING.md`.

---

## 2. Verifikasi Skema Database

Buka `prisma/schema.prisma` dan `DATABASE.md` berdampingan, centang manual satu per satu:

- [ ] `User` — semua kolom & enum `Role` sesuai
- [ ] `Address`
- [ ] `Category`
- [ ] `Product`
- [ ] `ProductVariant` — termasuk enum `Grade`, unique constraint `[productId, grade]`
- [ ] `UnitConversion` — termasuk enum `Unit`
- [ ] `PriceHistory`
- [ ] `Supplier`
- [ ] `StockIn`
- [ ] `StockAdjustment`
- [ ] `ServiceArea`
- [ ] `MembershipConfig`
- [ ] `Order` — termasuk enum `OrderStatus`, `PaymentStatus`, `PaymentType`
- [ ] `OrderItem`
- [ ] `Review` — termasuk unique constraint `orderId`

**Total harus 15 tabel.** Kalau ada yang tidak cocok dengan `DATABASE.md`, catat perbedaannya dulu sebelum lanjut (perbedaan kecil yang muncul organik saat development itu wajar, tapi harus disadari & dicatat, bukan diabaikan).

---

## 3. Skenario Bisnis End-to-End

> Jalankan berurutan, satu alur cerita utuh. Catat hasil tiap langkah (lolos/gagal) di `TESTING.md`.

### Bagian A — Setup Data Dasar
1. Register 2 akun customer baru: **Customer A** (nanti akan jadi member) dan **Customer B** (tetap non-member sampai akhir skenario).
2. Login sebagai admin, buat 1 kategori baru "Telur Ayam Negeri — Test Integrasi", 1 produk dengan 2 varian grade (BESAR & SEDANG) dengan harga awal.
3. Update harga salah satu varian (issue #11) — cek `PriceHistory` bertambah 1 baris.
4. Catat StockIn dari 1 supplier baru sejumlah cukup besar (misal 200kg) ke salah satu varian (issue #12).
5. Lakukan 1x stock adjustment manual (misal -5kg, alasan "rusak") ke varian yang sama (issue #13).
6. Tambahkan `ServiceArea` yang mencakup alamat yang akan dipakai Customer A & B.
7. Set `MembershipConfig`: `minimumOrderKg: 5`, `memberDiscountPercent: 10`, `pointsThresholdForMember: 100`, `pointsPerRupiah` yang masuk akal.
8. Customer A & B masing-masing tambah 1 alamat pengiriman yang sesuai `ServiceArea` di atas.

### Bagian B — Alur Checkout COD (Customer A)
9. Customer A checkout via `POST /api/orders/validate` dulu — pastikan preview-nya benar (berat, subtotal, belum ada diskon karena belum member).
10. Customer A checkout sungguhan (`paymentType: COD`) — catat `stockKg` varian **sebelum** dan **sesudah** checkout, pastikan berkurang tepat sesuai.
11. Admin konfirmasi pembayaran COD (issue #23).
12. Admin proses status order maju: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED` (issue #21), pastikan tidak bisa lompat/mundur di tengah jalan.
13. Setelah `DELIVERED`, cek `User.totalPoints` milik Customer A bertambah sesuai formula.
14. Customer A submit review untuk order ini, termasuk `damagedEggCount`.

### Bagian C — Ulangi Sampai Customer A Jadi Member
15. Ulangi langkah 9-13 (checkout COD baru → proses sampai DELIVERED) beberapa kali sampai `totalPoints` Customer A **melewati** `pointsThresholdForMember`.
16. Verifikasi `User.isMember` Customer A berubah jadi `true`.

### Bagian D — Alur Checkout Midtrans dengan Diskon Member (Customer A)
17. Customer A (sekarang member) checkout lagi dengan `paymentType: MIDTRANS` — cek response `POST /api/orders/validate` **sekarang menampilkan `discountAmount` > 0**.
18. Lanjutkan checkout sungguhan, dapatkan `midtransSnapToken`.
19. Simulasikan webhook Midtrans sukses (`transaction_status: settlement`) — cek `Order.paymentStatus` jadi `PAID` otomatis (issue #19), **tanpa perlu** konfirmasi manual admin.
20. Admin proses status sampai `DELIVERED` — pastikan **tidak ditolak** meskipun tidak lewat endpoint confirm-cod-payment (karena memang sudah `PAID` lewat webhook).
21. Cek poin Customer A bertambah lagi, dengan `totalAmount` yang sudah dipotong diskon (pastikan poin dihitung dari `totalAmount` **setelah** diskon, bukan `subtotalAmount`).

### Bagian E — Alur Non-Member & Pembatalan (Customer B)
22. Customer B (masih non-member) checkout COD — cek `discountAmount: 0` di preview.
23. **Sebelum** dikonfirmasi/diproses, admin **batalkan** order ini (issue #22) — cek stok varian **kembali bertambah** tepat sesuai yang tadi dikurangi.
24. Coba cancel order yang sama lagi (double-cancel) — harus ditolak.

### Bagian F — Verifikasi Dashboard & Laporan
25. Buka `GET /api/admin/dashboard/summary` — cocokkan `salesToday`/`salesThisMonth` dengan total manual dari semua order `PAID` yang dibuat di skenario ini.
26. Buka `GET /api/admin/dashboard/sales-report` dengan rentang tanggal hari ini — pastikan angkanya konsisten dengan Langkah 25.
27. Buka `GET /api/admin/dashboard/damaged-report` — pastikan produk dari review Langkah 14 muncul.

---

## 4. Verifikasi Konsistensi Data (Matematis)

Setelah seluruh skenario di atas selesai, lakukan pengecekan silang berikut lewat Prisma Studio atau query manual:

1. **Stok akhir masuk akal**: `stockKg` varian yang dipakai = `stok awal + total StockIn - total stock adjustment negatif - total weightKgEquivalent dari semua order yang TIDAK dibatalkan + total weightKgEquivalent dari order yang dibatalkan (dikembalikan)`. Hitung manual dan bandingkan dengan angka di database — harus sama persis.
2. **Tidak ada `OrderItem` tanpa `Order` induk** (orphan record) — seharusnya mustahil karena FK constraint, tapi cek sekali untuk memastikan tidak ada data aneh dari testing sebelumnya.
3. **Total `PriceHistory`** — jumlah baris harus sama dengan jumlah total pemanggilan endpoint update harga yang pernah dilakukan sepanjang semua testing (issue #11 dan langkah 3 di atas).
4. **`User.totalPoints` Customer A** — hitung ulang manual dari semua order `DELIVERED` miliknya (`totalAmount` masing-masing × `pointsPerRupiah`, dibulatkan ke bawah, dijumlahkan) — harus cocok dengan nilai di database.
5. **Tidak ada `Order` dengan `status: DELIVERED` tapi `paymentStatus` bukan `PAID`** — cek dengan query `WHERE status = 'DELIVERED' AND paymentStatus != 'PAID'`, hasilnya harus kosong (ini seharusnya mustahil terjadi karena validasi di issue #24, tapi baik untuk dipastikan).

---

## 5. Dokumentasikan Hasil

Buat file `TESTING.md` di root repo, isi dengan:
- Tanggal pengujian dilakukan
- Checklist skema (bagian 2) — hasil centang
- Ringkasan tiap bagian skenario (A-F) — lolos/gagal, dan detail kalau ada yang gagal
- Hasil verifikasi konsistensi data (bagian 4) — angka manual vs angka di database
- Daftar bug/isu yang ditemukan (kalau ada) beserta issue mana yang perlu direvisi untuk memperbaikinya

---

## Catatan
- Kalau ada satu langkah yang gagal, **jangan lanjut ke langkah berikutnya dulu** — perbaiki dulu (kembali ke issue terkait untuk revisi), baru ulangi dari langkah yang gagal.
- Ini adalah gerbang terakhir sebelum masuk fase frontend — pastikan benar-benar solid, karena bug backend yang lolos sampai sini akan jauh lebih merepotkan untuk dilacak setelah frontend mulai dibangun di atasnya.
