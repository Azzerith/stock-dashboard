# Stock Dashboard

Aplikasi web full-stack yang dirancang untuk manajemen stok dan inventaris secara komprehensif dan real-time.

## Fitur Utama
- **Pembaruan Real-time**: Sinkronisasi inventaris secara langsung menggunakan WebSockets, memastikan jumlah stok diperbarui secara instan di semua klien yang terhubung.
- **Kontrol Akses Berbasis Peran**: Autentikasi aman berbasis JWT yang membedakan hak akses antara pengguna `admin` (administrator) dan `operator`.
- **Manajemen Inventaris (Barang)**: Kemampuan penuh untuk mengelola barang, termasuk manajemen kode barang, jumlah stok, dan lokasi rak secara spesifik.
- **Riwayat Transaksi**: Mencatat dan melacak setiap proses barang masuk maupun barang keluar.
- **Visualisasi Data**: Grafik terintegrasi yang memudahkan pengawasan metrik pelaporan dan analisis jumlah stok berdasarkan data.

## Teknologi yang Digunakan
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Axios, Socket.IO-Client, Recharts.
- **Backend**: Go, Framework web Gin, GORM (sebagai ORM), JSON Web Tokens (JWT), Gorilla WebSockets.
- **Database**: MySQL 8.0.
- **Infrastruktur/Deployment**: Docker & Docker Compose.

## Persyaratan
Jika Anda berencana menjalankan aplikasi menggunakan Docker (Direkomendasikan):
- [Docker & Docker Compose](https://www.docker.com/)

Jika Anda ingin menjalankan aplikasi secara langsung secara lokal untuk pengembangan (development):
- [Go 1.22+](https://go.dev/)
- [Node.js 18+](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/)

---

## 🚀 Memulai Aplikasi

### Penggunaan Standar (Menggunakan Docker Compose - Direkomendasikan)
Cara tercepat untuk menjalankan aplikasi secara keseluruhan (frontend, backend API, dan database) secara serempak adalah dengan menggunakan Docker Compose.

1. Buka direktori utama (root directory) melalui terminal.
2. Jalankan perintah berikut:
```bash
docker-compose up -d --build
```

Setelah selesai, Anda dapat mengakses:
- **Tampilan Antarmuka (Frontend):** `http://localhost:3000`
- **Backend API:** `http://localhost:8080`

*Untuk mematikan aplikasi:*
```bash
docker-compose down
```

### Panduan Pengembangan Lokal (Tanpa Docker)

#### 1. Menjalankan Backend
1. Pastikan Anda memiliki database MySQL lokal beroperasi.
2. Buka file `backend/.env` dan ubah konfigurasi string koneksi SQL dan password Anda (nama database default: `stock-db`).
3. Mulai backend dan unduh dependensi:
```bash
cd backend
go mod download
go run main.go
```
*Catatan: Backend akan otomatis melakukan proses auto-migrate menggunakan GORM dan melakukan seeding data (inisialisasi data bawaan) ke tabel database Anda saat startup. Pastikan database `stock-db` telah dibuat di MySQL Server lokal Anda.*

#### 2. Menjalankan Frontend
1. Buka terminal baru.
2. Instal semua dependensi React Node.js:
```bash
cd frontend
npm install
```
3. Nyalakan server dev:
```bash
npm run dev
```

---

## Akun Default
Saat aplikasi pertama kali dijalankan, backend menanamkan data _seeder_ otomatis agar pengguna bisa segera berinteraksi menggunakan aplikasi. Berikut adalah kredensial yang dapat dipakai:

| Peran (Role) | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| User Operator | `operator` | `operator123` |
