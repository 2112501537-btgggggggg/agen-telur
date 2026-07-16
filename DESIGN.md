# DESIGN.md — Panduan Visual & UI/UX
## Aplikasi Toko Agen Telur

## Konsep
Gaya visual: **cerah & hangat**, memberi kesan segar seperti pasar/peternakan — hangat, terpercaya, tidak kaku, tapi tetap rapi dan mudah dipakai untuk transaksi.

## Palet Warna

### Warna Utama
| Nama | Hex | Penggunaan |
|---|---|---|
| Egg Yolk (Primary) | `#F5A623` | Tombol utama, aksen, highlight harga |
| Warm Amber (Primary Dark) | `#D4820A` | Hover state, teks penting |
| Fresh Cream (Background) | `#FFF8EC` | Background utama halaman |
| Soft White | `#FFFFFF` | Card, surface |

### Warna Sekunder
| Nama | Hex | Penggunaan |
|---|---|---|
| Barn Brown | `#5C4033` | Teks heading, footer |
| Straw Yellow | `#FCE9C5` | Background badge/tag, section alternatif |
| Fresh Green | `#6FA96E` | Sukses, status DELIVERED, stok aman |
| Alert Red | `#E0553F` | Error, stok habis, status CANCELLED |
| Neutral Gray | `#8A8580` | Teks sekunder, placeholder |

### Status Badge (Order)
| Status | Warna |
|---|---|
| PENDING | Straw Yellow bg + Barn Brown text |
| CONFIRMED / PROCESSING | Egg Yolk bg + White text |
| SHIPPED | Blue muda `#5B9BD5` bg + White text |
| DELIVERED | Fresh Green bg + White text |
| CANCELLED | Alert Red bg + White text |

## Tipografi
- **Heading:** `Poppins` (SemiBold/Bold) — kesan hangat & ramah, tidak terlalu formal
- **Body text:** `Inter` atau `Nunito Sans` — mudah dibaca di ukuran kecil, cocok untuk tabel admin
- Ukuran dasar: 16px body, scale 1.25 untuk heading (h1: 39px, h2: 31px, h3: 25px, h4: 20px)

## Prinsip Layout

### Customer App
- Gaya kartu produk (product card) dengan gambar besar, badge grade (Besar/Sedang/Kecil), harga jelas per kg dan estimasi per satuan lain.
- Navigasi sederhana: Home, Kategori, Keranjang, Pesanan Saya, Profil.
- Tampilkan badge "Member" dengan aksen Egg Yolk di profil jika `isMember = true`, beserta progress poin menuju status member (jika belum).
- Checkout: tampilkan ringkasan berat total & indikator minimum order (misal progress bar "3.5kg dari minimal 5kg").

### Admin App
- Layout sidebar kiri (fixed) + konten kanan, gunakan komponen shadcn/ui `Table`, `Card`, `Badge`.
- Warna admin lebih netral (didominasi putih/cream + aksen Egg Yolk secukupnya untuk CTA), supaya nyaman dipakai lama untuk kerja data-heavy.
- Dashboard: cards ringkasan di atas, chart penjualan (garis/area, warna Egg Yolk) di tengah, tabel stok menipis di bawah.

## Halaman Update Harga Harian (Admin)
- Tabel quick-edit: nama produk, grade, harga saat ini (input langsung bisa diedit inline), panah kecil hijau/merah menunjukkan naik/turun dibanding harga terakhir, timestamp "diupdate X jam lalu".
- Tombol "Simpan Semua Perubahan" di atas tabel untuk update massal (bulk).
- Beri warna Straw Yellow pada baris yang sudah lebih dari 24 jam belum diupdate, sebagai pengingat visual karena harga telur fluktuatif harian.

## Badge Metode Pembayaran
| Metode | Warna |
|---|---|
| MIDTRANS (paid) | Fresh Green bg |
| MIDTRANS (unpaid/pending) | Straw Yellow bg |
| COD (belum dikonfirmasi) | Neutral Gray bg + Barn Brown text |
| COD (sudah dikonfirmasi) | Fresh Green bg |

## Komponen Kunci
- **Tombol utama:** background Egg Yolk, teks putih, rounded-lg, hover ke Warm Amber.
- **Tombol sekunder:** outline Barn Brown, teks Barn Brown.
- **Card produk:** rounded-xl, shadow lembut, gambar rasio 1:1 di atas.
- **Badge grade telur:** pill kecil, background Straw Yellow, teks Barn Brown.
- **Input form:** border tipis Neutral Gray, focus ring Egg Yolk.

## Tone & Voice (Microcopy)
- Gunakan bahasa Indonesia santai tapi sopan, hindari jargon teknis di sisi customer.
- Contoh pesan error ramah: "Yah, pesananmu belum memenuhi minimum order 5kg nih. Tambah 1.5kg lagi yuk!" — bukan "Error: minimum order not met".
- Sisi admin boleh lebih lugas/teknis karena dipakai staff internal.

## Referensi Ikon
Gunakan set ikon **Lucide** (sudah tersedia via `lucide-react`, konsisten dengan shadcn/ui) — pilih ikon bertema alami (Egg, Truck, Package, Store) untuk aksen di dashboard/empty state.
