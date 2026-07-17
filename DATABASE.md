# DATABASE.md — Skema Database
## Aplikasi Toko Agen Telur (MySQL + Prisma ORM)

> Dokumen ini adalah sumber kebenaran (source of truth) untuk struktur database. Jangan ubah relasi/tabel di luar dokumen ini tanpa update dokumen terlebih dahulu.

---

## ERD Ringkas (Teks)

```
User 1───* Address
User 1───* Order
User 1───* Review

Supplier 1───* StockIn

Category 1───* Product
Product 1───* ProductVariant   (grade: BESAR/SEDANG/KECIL, stok & harga per varian)
Product 1───* StockIn
ProductVariant 1───* OrderItem
ProductVariant 1───* PriceHistory   (catatan tiap perubahan harga)

Order 1───* OrderItem
Order 1───1 Review (per order, opsional)
Order *───1 Address (alamat pengiriman yang dipilih)

ServiceArea (independen, dicek saat checkout by kecamatan/kota)
MembershipConfig (singleton config, bukan per-user)
UnitConversion (referensi global satuan)
```

---

## Detail Tabel

### User
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| name | String | |
| email | String, unique | |
| phone | String | |
| password | String | hashed (bcrypt) |
| role | Enum(CUSTOMER, ADMIN, STAFF) | default CUSTOMER |
| totalPoints | Int | default 0, bertambah tiap transaksi selesai |
| isMember | Boolean | default false, otomatis true saat totalPoints >= threshold |
| createdAt / updatedAt | DateTime | |

### Address
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| userId | Int FK → User | |
| label | String | "Rumah", "Warung", dst |
| fullAddress | String | |
| kecamatan | String | dipakai untuk cek ServiceArea |
| city | String | dipakai untuk cek ServiceArea |
| isDefault | Boolean | |

### Supplier
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| name | String | nama peternak/supplier |
| contact | String | no. telp/WA |
| address | String? | |

### Category
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| name | String | contoh: Telur Ayam Negeri, Ayam Kampung, Puyuh, Itik |

### Product
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| categoryId | Int FK → Category | |
| name | String | |
| description | String? | |
| imageUrl | String? | |
| isActive | Boolean | default true (soft delete) |
| createdAt / updatedAt | DateTime | |

### ProductVariant
> Setiap Product punya 1+ varian berdasarkan grade. Stok & harga disimpan di sini, bukan di Product.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| productId | Int FK → Product | |
| grade | Enum(BESAR, SEDANG, KECIL) | |
| pricePerKg | Decimal(10,2) | |
| stockKg | Decimal(10,2) | stok dalam satuan kg (satuan dasar) |
| lowStockThreshold | Decimal(10,2) | default 10, untuk alert stok menipis |
| lastPriceUpdateAt | DateTime? | waktu terakhir `pricePerKg` diubah, ditampilkan di menu update harga |

### PriceHistory
> Mencatat setiap kali `ProductVariant.pricePerKg` diubah — penting karena harga telur fluktuatif harian.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| productVariantId | Int FK → ProductVariant | |
| oldPrice | Decimal(10,2) | |
| newPrice | Decimal(10,2) | |
| changedBy | Int FK → User | admin/staff yang mengubah |
| changedAt | DateTime | default now() |

### UnitConversion
> Tabel referensi global, hanya diisi 1x oleh admin, berlaku untuk semua produk.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| unit | Enum(KG, TRAY, PETI) | |
| kgEquivalent | Decimal(10,3) | contoh: KG=1, TRAY=1.5, PETI=15 |

### StockIn (Pembelian dari Supplier)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| supplierId | Int FK → Supplier | |
| productVariantId | Int FK → ProductVariant | |
| quantityKg | Decimal(10,2) | |
| pricePerKg | Decimal(10,2) | harga beli dari supplier |
| totalCost | Decimal(10,2) | |
| createdAt | DateTime | |
| createdBy | Int FK → User | staff/admin yang input |

### StockAdjustment (Koreksi Stok Manual)
> Untuk pencatatan penyesuaian stok di luar StockIn/penjualan — misal telur rusak, koreksi hitung fisik, dsb. Wajib diisi tiap kali endpoint `stock-adjustment` dipanggil, supaya ada jejak audit.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| productVariantId | Int FK → ProductVariant | |
| changeKg | Decimal(10,2) | bisa negatif (stok berkurang) atau positif (stok bertambah) |
| reason | String | contoh: "rusak", "koreksi hitung fisik" |
| adjustedBy | Int FK → User | admin/staff yang melakukan |
| createdAt | DateTime | default now() |

### ServiceArea
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| city | String | |
| kecamatan | String? | null berarti seluruh kota dilayani |
| isActive | Boolean | default true |

### MembershipConfig
> Singleton — hanya 1 baris data, diupdate admin.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | selalu id=1 |
| pointsPerRupiah | Decimal | contoh: 1 poin per Rp10.000 belanja |
| pointsThresholdForMember | Int | contoh: 500 poin jadi member |
| memberDiscountPercent | Decimal(5,2) | contoh: 5.00 (%) |
| minimumOrderKg | Decimal(10,2) | default 5, mudah diubah tanpa redeploy |

### Order
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| orderNumber | String, unique | format: ORD-YYYYMMDD-XXXX |
| userId | Int FK → User | |
| addressId | Int FK → Address | snapshot alamat saat checkout |
| status | Enum(PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED) | |
| totalWeightKg | Decimal(10,2) | dihitung dari OrderItem, untuk validasi minimum order |
| subtotalAmount | Decimal(10,2) | sebelum diskon |
| discountAmount | Decimal(10,2) | dari member discount |
| totalAmount | Decimal(10,2) | subtotal - discount |
| paymentStatus | Enum(UNPAID, PAID, EXPIRED, FAILED) | untuk COD: tetap UNPAID sampai admin/kurir konfirmasi manual saat barang diterima |
| paymentType | Enum(MIDTRANS, COD) | dipilih customer saat checkout |
| midtransOrderId | String? | id transaksi dikirim ke Midtrans, null jika COD |
| midtransTransactionId | String? | id dari response Midtrans, null jika COD |
| paymentChannel | String? | diisi dari callback Midtrans (qris/gopay/va/dll), null jika COD |
| codConfirmedBy | Int? FK → User | staff/kurir yang konfirmasi uang COD diterima |
| codConfirmedAt | DateTime? | |
| createdAt / updatedAt | DateTime | |

### OrderItem
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| orderId | Int FK → Order | |
| productVariantId | Int FK → ProductVariant | |
| unit | Enum(KG, TRAY, PETI) | satuan yang dipilih customer |
| quantity | Decimal(10,2) | jumlah dalam satuan yang dipilih |
| weightKgEquivalent | Decimal(10,2) | quantity × kgEquivalent, untuk total berat & kurangi stok |
| pricePerKg | Decimal(10,2) | snapshot harga saat transaksi |
| subtotal | Decimal(10,2) | |

### Review
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int PK | |
| orderId | Int FK → Order, unique | 1 review per order |
| userId | Int FK → User | |
| rating | Int | 1-5 |
| comment | String? | |
| damagedEggCount | Int? | opsional, jumlah telur retak/pecah |
| createdAt | DateTime | |

---

## Catatan Implementasi Penting
1. **Stok disimpan di `ProductVariant`, bukan `Product`** — karena tiap grade (besar/sedang/kecil) punya stok & harga sendiri.
2. **Semua kuantitas dikonversi ke kg** (`weightKgEquivalent`) saat disimpan di `OrderItem`, supaya perhitungan minimum order & pengurangan stok konsisten walau customer pilih satuan tray/peti.
3. **Poin & status member dihitung ulang** setiap kali `Order.status` berubah menjadi `DELIVERED` dan `paymentStatus = PAID` — tambahkan `totalPoints` di `User`, lalu cek apakah sudah melewati `pointsThresholdForMember`.
4. **Diskon member dihitung saat checkout** (bukan disimpan permanen di harga produk) — ambil `memberDiscountPercent` dari `MembershipConfig` jika `User.isMember = true`.
5. Gunakan **Prisma transaction** (`$transaction`) untuk operasi checkout: validasi stok → kurangi stok → buat Order & OrderItem → hitung total, supaya atomic.
6. Index yang disarankan: `Order.userId`, `Order.status`, `ProductVariant.productId`, `Address.userId`.
7. **Update harga**: setiap kali admin mengubah `ProductVariant.pricePerKg`, sistem wajib membuat 1 baris `PriceHistory` (oldPrice, newPrice) dalam satu transaction dengan update harga itu sendiri — jangan pernah update harga tanpa mencatat history.
8. **COD**: saat checkout dengan `paymentType = COD`, tidak perlu memanggil Midtrans sama sekali — order langsung dibuat dengan `paymentStatus = UNPAID`. Status berubah jadi `PAID` hanya lewat endpoint konfirmasi manual admin (`codConfirmedBy`, `codConfirmedAt` terisi), biasanya dilakukan bersamaan dengan update status jadi `DELIVERED`.
