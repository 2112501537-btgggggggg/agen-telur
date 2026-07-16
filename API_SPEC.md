# API_SPEC.md — Spesifikasi REST API
## Aplikasi Toko Agen Telur

Base URL: `/api`
Format response standar:
```json
// Sukses
{ "success": true, "data": {...} }

// Gagal
{ "success": false, "message": "Pesan error", "errors": [ ] }
```
Auth: `Authorization: Bearer <accessToken>` (JWT) di header untuk endpoint yang butuh login.

---

## 1. Auth
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /auth/register | Publik | Daftar akun customer |
| POST | /auth/login | Publik | Login customer |
| POST | /auth/admin/login | Publik | Login admin/staff (role ADMIN/STAFF saja) |
| POST | /auth/refresh-token | Publik (refresh token) | Perbarui access token |
| POST | /auth/logout | User login | Invalidasi refresh token |
| GET | /auth/me | User login | Ambil data user yang sedang login |

**POST /auth/register** — Request:
```json
{ "name": "Budi", "email": "budi@mail.com", "phone": "0812xxx", "password": "secret123" }
```
Response 201:
```json
{ "success": true, "data": { "id": 1, "name": "Budi", "email": "budi@mail.com", "role": "CUSTOMER" } }
```
Error 409 jika email sudah terdaftar.

---

## 2. User & Address
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /users/me | User | Profil + isMember + totalPoints |
| PUT | /users/me | User | Update nama/telp |
| GET | /users/me/addresses | User | List alamat milik user |
| POST | /users/me/addresses | User | Tambah alamat |
| PUT | /users/me/addresses/:id | User | Edit alamat |
| DELETE | /users/me/addresses/:id | User | Hapus alamat |

---

## 3. Kategori & Produk

### Publik (customer)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | /categories | List kategori |
| GET | /products | List produk aktif + varian grade, filter: `?categoryId=&grade=&search=&page=&limit=` |
| GET | /products/:id | Detail produk + semua varian (grade, harga, stok) |
| GET | /products/:id/reviews | List review produk (dari OrderItem yang terkait) |

### Admin
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | /admin/categories | Tambah kategori |
| PUT | /admin/categories/:id | Edit kategori |
| DELETE | /admin/categories/:id | Hapus (tolak jika masih ada produk) |
| GET | /admin/products | List semua produk (termasuk nonaktif), pagination |
| POST | /admin/products | Tambah produk + varian awal, upload gambar (multipart) |
| PUT | /admin/products/:id | Edit produk |
| DELETE | /admin/products/:id | Soft delete (isActive=false) |
| POST | /admin/products/:id/variants | Tambah varian grade baru ke produk |
| PUT | /admin/products/variants/:id | Edit varian (nama, threshold — bukan untuk harga, lihat endpoint harga di bawah) |
| POST | /admin/products/variants/:id/stock-adjustment | Penyesuaian stok manual: `{ "changeKg": -2, "reason": "rusak" }` |
| GET | /admin/products/prices | **Menu Update Harga Harian** — list semua varian produk beserta harga saat ini & `lastPriceUpdateAt`, untuk ditampilkan di quick-edit table |
| PUT | /admin/products/variants/:id/price | Update harga 1 varian: `{ "newPrice": 24000 }` — otomatis catat ke `PriceHistory` |
| PUT | /admin/products/prices/bulk | Update banyak harga sekaligus: `{ "updates": [{ "productVariantId": 5, "newPrice": 24000 }, ...] }` |
| GET | /admin/products/variants/:id/price-history | Riwayat perubahan harga varian tertentu (untuk lihat tren) |

---

## 4. Supplier & Stok Masuk (Admin only)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | /admin/suppliers | List supplier |
| POST | /admin/suppliers | Tambah supplier |
| PUT | /admin/suppliers/:id | Edit supplier |
| DELETE | /admin/suppliers/:id | Hapus supplier |
| POST | /admin/stock-in | Catat pembelian stok dari supplier |
| GET | /admin/stock-in | Riwayat stok masuk, filter by productVariantId/supplierId/tanggal |

**POST /admin/stock-in** — Request:
```json
{ "supplierId": 1, "productVariantId": 5, "quantityKg": 100, "pricePerKg": 22000 }
```
Efek: menambah `ProductVariant.stockKg` sebesar `quantityKg`.

---

## 5. Order & Checkout

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /unit-conversions | Publik | Ambil rasio kg/tray/peti (untuk kalkulasi di frontend) |
| POST | /orders/validate | User | Cek keranjang: area layanan, minimum order, hitung estimasi diskon — dipanggil sebelum checkout final |
| POST | /orders | User | Buat order + generate Midtrans Snap token |
| GET | /orders | User | Riwayat order milik user, filter `?status=` |
| GET | /orders/:id | User | Detail order (hanya milik sendiri) |
| POST | /orders/:id/reviews | User | Submit review (hanya jika status DELIVERED & belum pernah review) |

**POST /orders** — Request:
```json
{
  "addressId": 3,
  "paymentType": "MIDTRANS",
  "items": [
    { "productVariantId": 5, "unit": "TRAY", "quantity": 10 }
  ]
}
```
`paymentType` wajib diisi: `"MIDTRANS"` atau `"COD"`.

Response 201 (jika `paymentType = MIDTRANS`):
```json
{
  "success": true,
  "data": {
    "orderId": 101,
    "orderNumber": "ORD-20260711-0001",
    "totalWeightKg": 15,
    "totalAmount": 342000,
    "paymentType": "MIDTRANS",
    "midtransSnapToken": "xxxxx-xxxx-xxxx"
  }
}
```
Response 201 (jika `paymentType = COD`):
```json
{
  "success": true,
  "data": {
    "orderId": 102,
    "orderNumber": "ORD-20260711-0002",
    "totalWeightKg": 6,
    "totalAmount": 138000,
    "paymentType": "COD",
    "paymentStatus": "UNPAID"
  }
}
```
Error 400 jika `totalWeightKg < minimumOrderKg` atau alamat di luar `ServiceArea`.

### Midtrans Webhook
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /payments/midtrans/webhook | Signature key Midtrans | Terima notifikasi status pembayaran, update `Order.paymentStatus` & `paymentChannel` (hanya berlaku untuk order dengan `paymentType=MIDTRANS`) |

### Konfirmasi Pembayaran COD (Admin)
| Method | Endpoint | Deskripsi |
|---|---|---|
| PUT | /admin/orders/:id/confirm-cod-payment | Tandai pembayaran COD sudah diterima — set `paymentStatus=PAID`, `codConfirmedBy`, `codConfirmedAt`. Hanya berlaku untuk order dengan `paymentType=COD` |

---

## 6. Admin — Order Management
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | /admin/orders | List semua order, filter `?status=&paymentStatus=&from=&to=` |
| GET | /admin/orders/:id | Detail order lengkap |
| PUT | /admin/orders/:id/status | Update status (urutan tidak boleh mundur), jika DELIVERED → trigger update poin member |
| PUT | /admin/orders/:id/cancel | Cancel order (hanya sebelum SHIPPED) + kembalikan stok |

---

## 7. Service Area (Admin)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | /service-areas | Publik — dipakai frontend cek area saat checkout |
| POST | /admin/service-areas | Tambah area layanan |
| PUT | /admin/service-areas/:id | Edit/nonaktifkan area |
| DELETE | /admin/service-areas/:id | Hapus area |

---

## 8. Membership Config (Admin)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | /admin/membership-config | Lihat konfigurasi poin/diskon/minimum order saat ini |
| PUT | /admin/membership-config | Update konfigurasi (singleton) |

---

## 9. Dashboard & Laporan (Admin)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | /admin/dashboard/summary | Total penjualan hari ini/bulan ini, order per status, stok menipis |
| GET | /admin/dashboard/sales-report?from=&to= | Data penjualan harian untuk chart |
| GET | /admin/dashboard/damaged-report | Produk dengan `damagedEggCount` terbanyak dari review |

---

## Kode Error Umum
| Kode | Arti |
|---|---|
| 400 | Validasi gagal / business rule tidak terpenuhi (misal minimum order) |
| 401 | Belum login / token invalid |
| 403 | Tidak punya akses (role salah / bukan pemilik data) |
| 404 | Data tidak ditemukan |
| 409 | Konflik (misal email duplikat) |
| 500 | Server error |
