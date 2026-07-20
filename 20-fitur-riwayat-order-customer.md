# Perencanaan: Riwayat & Detail Order Customer

Dokumen ini adalah panduan untuk endpoint yang dipakai customer melihat daftar pesanan mereka sendiri beserta detail lengkapnya.

---

## 1. Spesifikasi Database

**Tidak ada tabel baru.** Murni query terhadap `Order` dan `OrderItem` yang sudah dibuat di issue #17, dengan penekanan pada **kepemilikan** (`Order.userId` harus cocok dengan user yang login).

---

## 2. Struktur Folder & File Terkait

```
backend-api/src/
├── services/order.service.js       # UPDATE: tambah listOrders(), getOrderDetail()
├── controllers/order.controller.js # UPDATE: tambah handler list & detail
└── routes/order.routes.js          # UPDATE: tambah GET /, GET /:id
```

---

## 3. Tahapan Implementasi

### Langkah 1: Service — List Order
Di `order.service.js`, tambahkan `listOrders(userId, filters)`:
- Query `Order` dengan `where: { userId }`, urut `createdAt` descending (terbaru dulu).
- Dukung filter opsional `filters.status` — jika diisi, tambahkan ke `where`.
- Return field ringkas per order: `id`, `orderNumber`, `status`, `paymentStatus`, `paymentType`, `totalAmount`, `createdAt` — **tidak perlu** menyertakan detail `items` di list (supaya response ringan), itu baru muncul di endpoint detail.

### Langkah 2: Service — Detail Order
Tambahkan `getOrderDetail(userId, orderId)`:
1. Ambil `Order` berdasarkan `id`, sertakan relasi `items` (dengan `productVariant` → `product` di dalamnya, supaya bisa tampilkan nama produk & grade) dan `address`.
2. Jika order tidak ditemukan, lempar error 404.
3. **Jika `order.userId !== userId`, lempar error 403** — ini bagian paling penting di issue ini, jangan sampai customer bisa lihat order orang lain.
4. Return data lengkap.

### Langkah 3: Controller & Routes
- `GET /api/orders` — query param `?status=` opsional, panggil `listOrders(req.user.id, req.query)`.
- `GET /api/orders/:id` — panggil `getOrderDetail(req.user.id, req.params.id)`.

Keduanya dilindungi `authMiddleware`, tidak perlu role khusus (customer biasa).

---

## 4. Verifikasi dan Pengujian

> Gunakan order yang sudah dibuat di issue #17/#18 sebelumnya sebagai data test.

### Skenario 1 — List Order Milik Sendiri
```bash
curl -i http://localhost:4000/api/orders -H "Authorization: Bearer <token customer>"
```
**Expected:** Status `200`, menampilkan order-order yang dibuat customer ini saja, urut terbaru dulu.

### Skenario 2 — Filter Berdasarkan Status
```bash
curl -i "http://localhost:4000/api/orders?status=PENDING" -H "Authorization: Bearer <token customer>"
```
**Expected:** Hanya order dengan status `PENDING` yang muncul.

### Skenario 3 — Detail Order Milik Sendiri
```bash
curl -i http://localhost:4000/api/orders/1 -H "Authorization: Bearer <token customer>"
```
**Expected:** Status `200`, response menampilkan array `items` lengkap dengan nama produk, grade, quantity, unit, dan subtotal masing-masing.

### Skenario 4 — Detail Order Milik User Lain (Harus Ditolak)
Login dengan akun customer kedua (yang bukan pemilik order id 1), coba akses:
```bash
curl -i http://localhost:4000/api/orders/1 -H "Authorization: Bearer <token customer kedua>"
```
**Expected:** Status `403`.

### Skenario 5 — Order Tidak Ditemukan
```bash
curl -i http://localhost:4000/api/orders/99999 -H "Authorization: Bearer <token customer>"
```
**Expected:** Status `404`.

---

## Catatan
- Pastikan urutan pengecekan di `getOrderDetail`: **cek dulu apakah order ada (404), baru cek kepemilikan (403)** — supaya customer tidak bisa "menebak-nebak" ID order orang lain dan membedakan mana yang ada/tidak ada berdasarkan pesan error yang berbeda (403 vs 404 idealnya konsisten, tapi minimal urutan pengecekannya benar).
