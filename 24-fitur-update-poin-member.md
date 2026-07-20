# Perencanaan: Update Poin Member Otomatis

Dokumen ini adalah panduan untuk melengkapi `updateOrderStatus` (dari issue #21) supaya saat order berubah jadi `DELIVERED`, sistem otomatis menambah poin customer dan mengecek apakah dia sudah layak jadi member.

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Mengisi `User.totalPoints` dan `User.isMember` (sudah ada sejak issue #05), berdasarkan aturan di `MembershipConfig` (issue #15).

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
└── services/order.service.js   # UPDATE: sisipkan logika poin ke dalam updateOrderStatus()
```

---

## 3. Tahapan Implementasi

### Langkah 1: Tambah Syarat Pembayaran Sebelum DELIVERED
Kembali ke `updateOrderStatus(orderId, newStatus)` di `order.service.js` (issue #21). **Sebelum** melakukan update status, tambahkan pengecekan khusus untuk `newStatus === 'DELIVERED'`:
- Jika `order.paymentStatus !== 'PAID'`, lempar error 400 dengan pesan jelas: "Order belum dibayar. Untuk COD, konfirmasi pembayaran dulu lewat endpoint confirm-cod-payment sebelum menandai DELIVERED."

Ini memastikan urutan yang benar: order COD harus lewat issue #23 dulu, order Midtrans harus sudah dapat notifikasi webhook (issue #19) dulu, baru boleh di-set `DELIVERED`.

### Langkah 2: Sisipkan Logika Poin di Dalam Transaction yang Sama
Masih di fungsi yang sama, ketika `newStatus === 'DELIVERED'` dan validasi Langkah 1 lolos, lakukan **dalam `prisma.$transaction`** bersamaan dengan update status:
1. Ambil `MembershipConfig` (panggil `getConfig()` dari `membershipConfig.service.js`, issue #15).
2. Hitung `pointsEarned = Math.floor(Number(order.totalAmount) * Number(config.pointsPerRupiah))`.
3. Update `Order.status = 'DELIVERED'`.
4. Ambil data `User` (customer pemilik order) saat ini, hitung `newTotalPoints = user.totalPoints + pointsEarned`.
5. Update `User`: `totalPoints: newTotalPoints`, dan **jika `newTotalPoints >= config.pointsThresholdForMember` dan `user.isMember` masih `false`**, set `isMember: true` sekalian dalam update yang sama.

### Langkah 3: Status Lain Tidak Terpengaruh
Pastikan untuk `newStatus` selain `DELIVERED` (misal `CONFIRMED`, `PROCESSING`, `SHIPPED`), logika poin ini **tidak** dijalankan — cukup update status seperti biasa (behavior dari issue #21 tetap sama).

---

## 4. Verifikasi dan Pengujian

> Siapkan 1 user customer dengan `totalPoints` awal yang **dekat** dengan `pointsThresholdForMember` (misal set manual via Prisma Studio jadi `450` kalau threshold-nya `500`), untuk memudahkan test skenario jadi member.

### Skenario 1 — DELIVERED Tanpa Pembayaran Lunas (Ditolak)
Buat order COD baru (issue #17), **jangan** konfirmasi pembayarannya dulu, langsung coba:
```bash
curl -i -X PUT http://localhost:4000/api/admin/orders/<id>/status \
  -H "Authorization: Bearer <token admin>" -H "Content-Type: application/json" \
  -d '{"status":"DELIVERED"}'
```
(pastikan status order saat ini sudah `SHIPPED` dulu, karena masih harus urut sesuai issue #21)
**Expected:** Status `400`, pesan soal pembayaran belum lunas.

### Skenario 2 — DELIVERED Setelah Konfirmasi COD (Poin Bertambah)
Konfirmasi dulu pembayarannya (`PUT /admin/orders/:id/confirm-cod-payment` dari issue #23), baru ulangi update status ke `DELIVERED`.
**Expected:** Status `200`. Hitung manual: `pointsEarned = floor(totalAmount × pointsPerRupiah)`. Cek `User.totalPoints` bertambah **tepat** sejumlah itu di Prisma Studio.

### Skenario 3 — Poin Melewati Threshold, Jadi Member
Gunakan user yang `totalPoints`-nya sudah di-set dekat threshold (lihat catatan di atas). Buat & selesaikan 1 order lagi (checkout → proses sampai DELIVERED) sampai `totalPoints` melewati `pointsThresholdForMember`.
**Expected:** Setelah update status DELIVERED, `User.isMember` berubah dari `false` jadi `true`.

### Skenario 4 — Order Midtrans yang Sudah PAID via Webhook
Buat order Midtrans (issue #18), simulasikan webhook sukses (issue #19) supaya `paymentStatus: PAID`, lalu proses status sampai `DELIVERED`.
**Expected:** Poin bertambah dengan cara yang sama seperti order COD — tidak ada perbedaan perlakuan poin antara COD dan Midtrans, keduanya sama-sama syaratnya `paymentStatus: PAID`.

### Skenario 5 — User yang Sudah Member Tidak "Turun Level"
Test dengan user yang `isMember` sudah `true` sebelumnya — pastikan tidak ada logika yang tidak sengaja mengubahnya jadi `false` lagi (harusnya kode di Langkah 2 poin 5 tidak menyentuh `isMember` sama sekali kalau sudah `true`).

---

## Catatan
- Ini adalah **titik pertemuan** dari banyak issue sebelumnya (#15, #17, #19, #21, #23) — pastikan Anda benar-benar jalankan semua skenario test di atas, jangan cuma baca kodenya, karena bug di sini bisa menyebabkan poin salah hitung dan sulit dilacak belakangan.
- Dengan selesainya issue ini, **seluruh siklus hidup order dari checkout sampai selesai sudah lengkap dan saling terhubung dengan benar**.
