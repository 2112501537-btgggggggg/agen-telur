# Perencanaan: Halaman Login & Register (Customer-App)

Dokumen ini adalah panduan untuk halaman autentikasi customer — login, register, dan pengelolaan sesi (token) yang akan dipakai seluruh halaman lain di `customer-app`.

---

## 1. Spesifikasi API yang Dipanggil

| Endpoint | Method | Body | Response Sukses |
|---|---|---|---|
| `/api/auth/register` | POST | `{ name, email, phone, password }` | `{ success: true, data: { id, name, email, role } }` |
| `/api/auth/login` | POST | `{ email, password }` | `{ success: true, data: { accessToken, refreshToken, user } }` |
| `/api/auth/me` | GET | (pakai header Authorization) | `{ success: true, data: { id, name, email, totalPoints, isMember, ... } }` |

Referensi lengkap ada di `API_SPEC.md`. Backend sudah 100% siap dan terverifikasi (issue #05, #06, #30).

---

## 2. Spesifikasi Desain

Ikuti `DESIGN.md`: background `fresh-cream`, tombol utama `egg-yolk`, heading pakai font Poppins. Form login/register terpusat di tengah halaman (card putih dengan shadow lembut di atas background cream), tidak perlu sidebar/navbar kompleks untuk halaman ini.

---

## 3. Struktur File Terkait

```
customer-app/src/
├── api/
│   └── auth.api.js            # register(), login(), getMe()
├── context/
│   └── AuthContext.jsx         # state global: user, accessToken, isLoading, login(), register(), logout()
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── HomePage.jsx             # placeholder sementara, halaman sungguhan dibuat di issue berikutnya
├── App.jsx                       # UPDATE: setup routing
└── main.jsx                      # UPDATE: bungkus dengan AuthProvider
```

---

## 4. Tahapan Implementasi

### Langkah 1: Install Routing
`customer-app` sebelumnya (issue #03) belum pakai routing karena cuma 1 halaman percobaan. Sekarang install:
```bash
npm install react-router-dom
```

### Langkah 2: Buat `api/auth.api.js`
Buat 3 fungsi yang memanggil `axiosClient` (sudah ada dari issue #03):
```js
import axiosClient from './axiosClient';

export const register = (data) => axiosClient.post('/auth/register', data).then(res => res.data);
export const login = (data) => axiosClient.post('/auth/login', data).then(res => res.data);
export const getMe = () => axiosClient.get('/auth/me').then(res => res.data);
```

### Langkah 3: Buat `AuthContext`
Di `context/AuthContext.jsx`:
1. State: `user` (null jika belum login), `accessToken`, `isLoading` (true saat pertama kali cek sesi).
2. Saat context pertama kali dimuat (`useEffect` kosong): cek `localStorage.getItem('accessToken')`. Kalau ada, panggil `getMe()` untuk ambil data user terbaru, set ke state. Kalau gagal (token expired/invalid), hapus token dari `localStorage`, `user` tetap `null`.
3. Fungsi `handleLogin(credentials)`: panggil `login()` dari `auth.api.js`, simpan `accessToken` & `refreshToken` ke `localStorage`, set `user` dari response.
4. Fungsi `handleRegister(data)`: panggil `register()`, **lalu otomatis panggil `handleLogin()`** dengan email+password yang sama (supaya user langsung masuk tanpa perlu login manual lagi setelah daftar).
5. Fungsi `handleLogout()`: hapus token dari `localStorage`, set `user` ke `null`.
6. Export `AuthProvider` (component pembungkus) dan `useAuth()` (custom hook, `useContext(AuthContext)`).

### Langkah 4: Bungkus App dengan `AuthProvider` & Router
Di `main.jsx`, bungkus `<App />` dengan `<AuthProvider>` dan `<BrowserRouter>`.

### Langkah 5: Buat `LoginPage.jsx`
Form dengan field `email`, `password`. Saat submit:
1. Panggil `useAuth().handleLogin(...)`.
2. Kalau sukses, `navigate('/')` (pakai `useNavigate` dari react-router-dom).
3. Kalau gagal, tampilkan pesan error dari response API (`error.response.data.message`) di bawah form, jangan pakai `alert()`.
4. Sertakan link ke `/register` untuk yang belum punya akun.

### Langkah 6: Buat `RegisterPage.jsx`
Form dengan field `name`, `email`, `phone`, `password`. Validasi sederhana di sisi client (semua wajib diisi) sebelum submit. Saat submit:
1. Panggil `useAuth().handleRegister(...)`.
2. Kalau sukses (otomatis login juga dari Langkah 3.4), `navigate('/')`.
3. Kalau gagal (misal email duplikat — status 409 dari backend), tampilkan pesan error yang sesuai.

### Langkah 7: Buat `HomePage.jsx` (Placeholder Sementara)
Halaman minimal yang menampilkan:
- Jika `user` ada: "Selamat datang, {user.name}!" + tombol Logout (panggil `handleLogout()`, lalu `navigate('/login')`).
- Jika `user` null (belum login): pesan "Silakan login" + link ke `/login`.

Ini **bukan** halaman katalog sungguhan — itu dibuat di issue berikutnya. Tujuannya di sini cuma untuk membuktikan alur auth bekerja end-to-end.

### Langkah 8: Setup Routes di `App.jsx`
```jsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
</Routes>
```

---

## 5. Verifikasi (Manual di Browser)

### Skenario 1 — Register Berhasil, Auto-Login
Buka `/register`, isi form dengan data baru, submit. **Expected:** langsung redirect ke `/`, halaman menampilkan "Selamat datang, {nama}!" tanpa perlu login manual lagi.

### Skenario 2 — Register dengan Email Duplikat
Coba register dengan email yang sama seperti Skenario 1. **Expected:** tetap di halaman register, muncul pesan error (bukan redirect, bukan halaman blank/crash).

### Skenario 3 — Login Berhasil
Buka `/login` (setelah logout dari Skenario 1), masukkan kredensial yang benar. **Expected:** redirect ke `/`, tampil nama user.

### Skenario 4 — Login Gagal
Masukkan password salah di `/login`. **Expected:** pesan error tampil jelas di halaman, tidak redirect.

### Skenario 5 — Sesi Bertahan Setelah Refresh
Setelah login berhasil (Skenario 3), tekan F5 (refresh browser) di halaman `/`. **Expected:** tetap menampilkan "Selamat datang, {nama}!" — bukan balik ke kondisi belum login (buktikan `AuthContext` berhasil restore sesi dari `localStorage` + panggil `getMe()`).

### Skenario 6 — Logout
Klik tombol Logout di HomePage. **Expected:** kembali ke state belum login, `localStorage` tidak lagi punya `accessToken` (cek lewat DevTools → Application → Local Storage).

### Skenario 7 — Cek Console Bersih
Selama semua skenario di atas, buka DevTools Console — pastikan tidak ada error merah (warning React boleh diabaikan kalau tidak kritikal).

---

## Catatan
- `HomePage.jsx` di issue ini **sengaja sangat minimal** — akan ditulis ulang total di issue berikutnya ("Halaman Katalog Produk") untuk jadi halaman utama yang sesungguhnya.
- `AuthContext` yang dibuat di issue ini akan **dipakai di semua halaman customer-app berikutnya** (untuk cek status login, ambil data user, proteksi halaman checkout, dll) — pastikan diekspor dengan rapi.
