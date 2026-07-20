# Perencanaan: Validasi Checkout

Dokumen ini adalah panduan untuk endpoint "preview" checkout — mengecek area layanan, menghitung total berat (dengan konversi satuan kg/tray/peti), validasi minimum order, dan estimasi diskon member, **tanpa membuat order sungguhan**. Endpoint ini dipanggil frontend sebelum tombol "Bayar Sekarang" ditekan, supaya customer tahu dulu kalau ada masalah (area tidak dilayani, kurang dari minimum order, dsb) sebelum lanjut ke pembayaran.

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Issue ini murni logika yang menggabungkan data dari tabel-tabel yang sudah ada: `Address` (issue #08), `ServiceArea` (issue #14), `MembershipConfig` (issue #15), `ProductVariant` (issue #10), `UnitConversion` (issue #10, sudah diisi manual). Issue ini juga membuka endpoint publik untuk membaca `UnitConversion` yang sebelumnya belum ada endpoint-nya.

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── validators/checkout.validator.js
├── services/checkout.service.js
├── services/unitConversion.service.js
├── controllers/checkout.controller.js
├── controllers/unitConversion.controller.js
└── routes/order.routes.js          # prefix /api/orders, dipakai lagi di issue Checkout COD/Midtrans nanti
```

---

## 3. Tahapan Implementasi

### Langkah 1: Endpoint Unit Conversion (Publik)
Buat `unitConversion.service.js` dengan `listUnitConversions()` — return semua row `UnitConversion`. Buat route `GET /api/unit-conversions` (publik, tanpa auth).

### Langkah 2: Validator
Di `checkout.validator.js`, buat `validateCheckoutSchema`:
- `addressId` (number)
- `items` (array, minimal 1 item), tiap item: `{ productVariantId: number, unit: enum('KG','TRAY','PETI'), quantity: number positif }`

### Langkah 3: Service — Fungsi Utama `validateCheckout`
Di `checkout.service.js`, buat `validateCheckout(userId, addressId, items)` dengan urutan logika berikut (**urutan ini penting**, ikuti persis supaya pesan error yang muncul relevan):

1. **Cek kepemilikan alamat**: ambil `Address` dengan `id = addressId`. Jika tidak ditemukan atau `address.userId !== userId`, lempar error 403/404.
2. **Cek area layanan**: panggil `isAddressInServiceArea(address.city, address.kecamatan)` dari `serviceArea.service.js` (issue #14). Jika `false`, lempar error 400 dengan pesan jelas, contoh: `"Maaf, kami belum melayani pengiriman ke ${address.kecamatan}, ${address.city}"`.
3. **Ambil `UnitConversion`**: query semua data, buat lookup map `{ KG: 1, TRAY: 1.5, PETI: 15 }` (atau sesuai data yang tersimpan) untuk dipakai di langkah berikutnya.
4. **Proses tiap item**: untuk tiap item di `items`:
   - Ambil `ProductVariant` beserta relasi `Product` (untuk nama produk di pesan error).
   - Jika varian tidak ditemukan atau `product.isActive === false`, lempar error 400 menyebutkan produk mana yang bermasalah.
   - Hitung `weightKgEquivalent = item.quantity * kgEquivalent[item.unit]`.
   - Jika `weightKgEquivalent > productVariant.stockKg`, lempar error 400 dengan pesan jelas, contoh: `"Stok ${product.name} (${variant.grade}) tidak cukup, sisa ${variant.stockKg}kg"`.
   - Hitung `itemSubtotal = weightKgEquivalent * variant.pricePerKg`.
5. **Total berat & minimum order**: jumlahkan semua `weightKgEquivalent` jadi `totalWeightKg`. Ambil `MembershipConfig.minimumOrderKg` (issue #15). Jika `totalWeightKg < minimumOrderKg`, lempar error 400 dengan pesan jelas termasuk **berapa kg lagi yang kurang**, contoh: `"Minimum order 5kg, pesanan Anda baru 3.5kg. Tambah 1.5kg lagi."`.
6. **Hitung diskon member**: jumlahkan semua `itemSubtotal` jadi `subtotalAmount`. Ambil `User.isMember` — jika `true`, `discountAmount = subtotalAmount * (config.memberDiscountPercent / 100)`, jika tidak, `discountAmount = 0`.
7. **Return preview**:
   ```json
   {
     "isValid": true,
     "totalWeightKg": 15,
     "subtotalAmount": 342000,
     "discountAmount": 17100,
     "totalAmount": 324900,
     "isMember": true,
     "items": [
       { "productVariantId": 5, "productName": "Telur Ayam Negeri", "grade": "BESAR", "unit": "TRAY", "quantity": 10, "weightKgEquivalent": 15, "subtotal": 342000 }
     ]
   }
   ```

### Langkah 4: Controller & Route
Buat handler `validateCheckout(req, res, next)` di `checkout.controller.js`, ambil `userId` dari `req.user.id`. Daftarkan `POST /api/orders/validate`, dilindungi `authMiddleware` saja (customer biasa, tidak perlu role khusus).

---

## 4. Verifikasi dan Pengujian

> Gunakan alamat & produk yang sudah dibuat di issue-issue sebelumnya. Pastikan `MembershipConfig` sudah diisi (issue #15) dan minimal 1 `ServiceArea` aktif (issue #14) yang cocok dengan alamat customer.

### Skenario 1 — Alamat di Luar Area Layanan
Gunakan alamat dengan `city`/`kecamatan` yang **tidak** terdaftar di `ServiceArea`.
```bash
curl -i -X POST http://localhost:4000/api/orders/validate \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"addressId": 1, "items":[{"productVariantId":1,"unit":"TRAY","quantity":10}]}'
```
**Expected:** Status `400`, pesan jelas soal area belum dilayani.

### Skenario 2 — Kurang dari Minimum Order
Gunakan alamat yang **valid** (dalam service area), tapi jumlah kecil.
```bash
curl -i -X POST http://localhost:4000/api/orders/validate \
  -H "Authorization: Bearer <token customer>" -H "Content-Type: application/json" \
  -d '{"addressId": 2, "items":[{"productVariantId":1,"unit":"KG","quantity":2}]}'
```
**Expected:** Status `400`, pesan menyebutkan sudah 2kg, butuh berapa kg lagi untuk capai minimum.

### Skenario 3 — Checkout Valid dari Member
Pastikan salah satu akun customer test punya `isMember: true` (ubah manual via Prisma Studio kalau perlu untuk keperluan test). Kirim item dengan total berat ≥ minimum order.
```bash
curl -i -X POST http://localhost:4000/api/orders/validate \
  -H "Authorization: Bearer <token customer member>" -H "Content-Type: application/json" \
  -d '{"addressId": 2, "items":[{"productVariantId":1,"unit":"TRAY","quantity":10}]}'
```
**Expected:** Status `200`, `isValid: true`, `discountAmount` **lebih dari 0** dan sesuai perhitungan manual (`subtotalAmount * memberDiscountPercent / 100`).

### Skenario 4 — Checkout Valid dari Non-Member
Ulangi Skenario 3 dengan akun `isMember: false`.
**Expected:** Status `200`, `discountAmount: 0`, `totalAmount === subtotalAmount`.

### Skenario 5 — Stok Tidak Cukup
Kirim `quantity` yang melebihi `stockKg` varian saat ini.
**Expected:** Status `400`, pesan menyebutkan nama produk & sisa stok.

### Skenario 6 — Endpoint Unit Conversion
```bash
curl -i http://localhost:4000/api/unit-conversions
```
**Expected:** Status `200`, tanpa token, menampilkan 3 baris (`KG`, `TRAY`, `PETI`) dengan `kgEquivalent` sesuai yang diisi manual di issue #10.

---

## Catatan
- Endpoint ini **tidak mengubah data apa pun** di database (tidak mengurangi stok, tidak membuat order) — murni kalkulasi & validasi. Ini penting supaya customer bisa berkali-kali cek ulang keranjangnya tanpa efek samping.
- Urutan pengecekan di Langkah 3 (area → stok per item → minimum order → diskon) sengaja dibuat berurutan seperti itu supaya pesan error yang paling relevan yang muncul duluan — jangan diacak urutannya.
- Fungsi `validateCheckout` ini akan **dipanggil ulang** (bukan ditulis ulang) oleh issue "Checkout COD" dan "Checkout Midtrans" berikutnya sebagai langkah validasi sebelum benar-benar membuat order — pastikan fungsinya diekspor dengan rapi dari `checkout.service.js`.
