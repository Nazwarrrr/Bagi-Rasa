# 🍲 BagiRasa — Real-Time Community Food Rescue Platform

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6+-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%7C_Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

**BagiRasa** adalah platform web *mobile-first* berbasis komunitas yang menghubungkan penyedia makanan berlebih (warung makan, toko roti, panitia acara, dan warga) dengan masyarakat sekitar secara *real-time* sebelum makanan melewati batas aman konsumsi.

---

## 🎯 Masalah & Solusi Utama

Banyak makanan layak konsumsi terbuang setiap hari menjelang jam tutup toko atau usai acara, sementara warga di lingkungan sekitar membutuhkan akses pangan cepat. BagiRasa memangkas hambatan distribusi dengan tiga pilar utama:

1. **Zero-Friction Access (Tanpa Login untuk Warga):** Pengunjung langsung dapat melihat katalog makanan aktif, menyaring berdasarkan kecamatan, dan mengklaim maksimal 2 porsi hanya menggunakan Nama dan nomor WhatsApp.
2. **Food Safety Guardrails:** Setiap donasi memiliki batas waktu aman konsumsi (2, 3, atau 4 jam) dengan *Countdown Timer* berjalan mundur. Postingan otomatis menghilang dari katalog ketika waktu habis atau kuota mencapai nol.
3. **Closed-Loop Verification & Anti-Ghosting:** Warga menerima tiket kode unik (`#BR-XXXX`) beserta pintasan rute Google Maps dan chat WhatsApp otomatis ke donatur. Poin donatur di *Leaderboard* hanya bertambah setelah donatur memverifikasi pengambilan di lokasi.

---

## ⚙️ Arsitektur Teknis & Keamanan

- **Anti-Race Condition Stock Locking:** Pemotongan kuota porsi dieksekusi di tingkat *database* menggunakan PostgreSQL RPC (`claim_food_portion`) dengan *Row-Level Locking* (`FOR UPDATE`) untuk mencegah *overselling* (stok minus) saat beberapa warga mengklaim bersamaan.
- **Live Quota Synchronization:** Memanfaatkan **Supabase Realtime** (`postgres_changes`) sehingga perubahan sisa porsi langsung memperbarui antarmuka seluruh pengguna tanpa perlu *refresh* halaman.
- **Client-Side Image Compression:** Foto makanan dikompresi otomatis di *browser* menggunakan `browser-image-compression` hingga di bawah 250 KB sebelum diunggah ke **Supabase Storage**, menghemat kuota server dan mempercepat waktu muat di jaringan seluler.
- **Anti-Spam Device Lock:** Pembatasan klaim aktif per perangkat menggunakan `localStorage` serta validasi format nomor WhatsApp Indonesia (`628xxx`).

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 18+, Vite 6+, Tailwind CSS v4 |
| **Ikon** | Lucide React (ikon vektor garis) |
| **Backend & DB** | Supabase (PostgreSQL, Auth, Storage, Realtime, RPC) |
| **Media Optimization** | browser-image-compression |
| **Deployment** | Vercel (CI/CD via GitHub) |

---

## 📁 Struktur Direktori

```text
bagirasa/
├── public/                   # Aset statis & favicon
├── src/
│   ├── components/
│   │   ├── claim/            # ClaimModal & DigitalTicketModal (#BR-XXXX)
│   │   ├── donor/            # AddFoodForm (Kompresi Foto) & ClaimQueueList
│   │   ├── food/             # FoodCard, CountdownTimer, FilterBar
│   │   └── layout/           # Navbar, ThemeToggle, CommunityImpactBanner
│   ├── contexts/             # AuthContext & ThemeContext (Light/Dark Mode)
│   ├── hooks/                # useRealtimePosts & useCountdown
│   ├── lib/                  # supabaseClient.js & WhatsApp/Date formatters
│   ├── pages/                # HomePage, LeaderboardPage, LoginPage, DashboardPage
│   ├── App.jsx               # Routing utama
│   └── index.css             # Konfigurasi Tailwind v4 & Design Tokens
├── supabase-schema.sql       # Skema tabel, view, RLS policies, & fungsi RPC
└── README.md
```

---

## 🚀 Panduan Instalasi Lokal

**1. Clone repositori ini:**
```bash
git clone https://github.com/Nazwarrrr/BagiRasa.git
cd BagiRasa
```

**2. Install dependensi:**
```bash
npm install
```

**3. Konfigurasi Environment Variables:**

Buat file `.env` di root proyek dan isi kredensial proyek Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_anon_key
```

**4. Setup Database & Storage Supabase:**
- Jalankan seluruh isi file `supabase-schema.sql` pada menu **SQL Editor** di dasbor Supabase.
- Buat **Public Storage Bucket** baru bernama `food-images` dan aktifkan policy akses baca publik (`SELECT`) serta unggah terautentikasi (`INSERT`).

**5. Jalankan server pengembangan:**
```bash
npm run dev
```

---

## 🗂️ Database Schema Overview

```sql
-- Tabel Utama
profiles        → Data profil & statistik donatur
food_posts      → Katalog donasi makanan aktif
claims          → Rekaman klaim warga (#BR-XXXX)

-- Views
active_districts  → Kecamatan dengan postingan aktif
donor_leaderboard → Peringkat donatur berdasarkan porsi terverifikasi

-- RPC Functions (Row-Level Locked)
claim_food_portion()  → Atomic stock deduction + generate pickup code
cancel_claim()        → Kembalikan stok ke katalog
confirm_pickup()      → Verifikasi pengambilan + tambah poin donatur
```

---

## 📸 Fitur Unggulan

| Fitur | Deskripsi |
|---|---|
| 🕐 **Countdown Timer** | Per-detik, berubah warna Amber saat < 30 menit |
| 📡 **Realtime Sync** | Supabase Realtime — porsi berkurang langsung tanpa refresh |
| 🎫 **Digital Ticket** | Kode `#BR-XXXX` + shortcut WA otomatis ke donatur |
| 🗺️ **Google Maps** | Tombol rute langsung ke titik pengambilan |
| 🏆 **Leaderboard** | Top 10 donatur berdasarkan porsi terverifikasi |
| 🌙 **Dark Mode** | Toggle Light/Dark, preferensi disimpan di localStorage |
| 📱 **Mobile-First** | Responsif dari 360px hingga desktop |
| 🔒 **Anti-Race Condition** | PostgreSQL `FOR UPDATE` lock pada fungsi klaim |

---

## 👨‍💻 Lead Developer

Dikembangkan oleh **Nazwar Makarim Mahardhika** ([@Nazwarrrr](https://github.com/Nazwarrrr)) — XI RPL 2, SMKN 1 Garut.

---

<p align="center">
  <i>Makanan diselamatkan adalah rezeki yang dibagikan. 🍛</i>
</p>
