# 🍲 Bagi-Rasa — Real-Time Community Food Rescue Platform

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6+-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%7C_Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

**Bagi-Rasa** adalah platform web *mobile-first* berbasis komunitas yang menghubungkan penyedia makanan berlebih (warung makan, toko roti, panitia acara, dan warga) dengan masyarakat sekitar secara *real-time* sebelum makanan melewati batas aman konsumsi.

---

## 🎯 Masalah & Solusi Utama

Banyak makanan layak konsumsi terbuang setiap hari menjelang jam tutup toko atau usai acara, sementara warga di lingkungan sekitar membutuhkan akses pangan cepat. Bagi-Rasa memangkas hambatan distribusi dengan tiga pilar utama:

1. **Akun Komunitas Terpadu:** Pengunjung dapat melihat dan menyaring katalog secara publik. Klaim porsi dan pengelolaan donasi memerlukan akun dengan profil lengkap agar tiket serta riwayat klaim tersimpan.
2. **Food Safety Guardrails:** Setiap donasi memiliki batas waktu aman konsumsi (2, 3, atau 4 jam) dengan *Countdown Timer* berjalan mundur. Postingan otomatis menghilang dari katalog ketika waktu habis atau kuota mencapai nol.
3. **Closed-Loop Verification & Anti-Ghosting:** Warga menerima tiket kode unik (`#BR-XXXX`) dengan QR Code, pintasan Google Maps, dan chat WhatsApp ke donatur. Poin warga dan donatur bertambah setelah pengambilan diverifikasi.
4. **Animated Community Experience:** Scroll-reveal, penghitung dampak, kartu katalog, tab, FAQ, dan dialog memakai Framer Motion dengan dukungan preferensi reduced-motion.

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
| **Typography** | Plus Jakarta Sans (self-hosted via Fontsource) |
| **Motion & Tickets** | Framer Motion, qrcode.react |
| **Ikon** | Lucide React (vektor garis murni, tanpa emoji pada tombol/status) |
| **Backend & DB** | Supabase (PostgreSQL, Auth, Storage, Realtime, RPC) |
| **Media Optimization** | browser-image-compression (WebWorker) |
| **Deployment** | Vercel (CI/CD via GitHub) |

---

## 📁 Struktur Direktori

```text
bagirasa/
├── public/
│   └── favicon.svg           # Ikon browser
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
│   ├── App.jsx               # Routing & ProtectedRoute
│   ├── index.css             # Konfigurasi Tailwind v4 & Design Tokens
│   └── main.jsx              # Entry point React
├── supabase-schema.sql       # Skema tabel, view, RLS policies, & fungsi RPC
├── .env.example              # Template variabel lingkungan
└── README.md
```

---

## 🚀 Panduan Instalasi Lokal

**1. Clone repositori ini:**
```bash
git clone https://github.com/Nazwarrrr/Bagi-Rasa.git
cd Bagi-Rasa
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
- Buka menu **SQL Editor** di dasbor Supabase Anda.
- Jalankan seluruh isi file `supabase-schema.sql` (skema ini sudah otomatis membuat tabel, view, RLS, storage bucket `food-images`, dan fungsi RPC).
- Di menu **Database > Replication**, aktifkan replikasi untuk tabel `food_posts` agar fitur Realtime aktif.

**5. Jalankan server pengembangan:**
```bash
npm run dev
```

**6. Build untuk Production:**
```bash
npm run build
```

---

## 🗂️ Database Schema Overview

```sql
-- Tabel Utama
profiles        → Data profil donatur & statistik porsi terselamatkan
food_posts      → Katalog donasi makanan aktif & kuota
claims          → Rekaman klaim warga dengan kode unik (#BR-XXXX)

-- Views
active_districts  → Kecamatan dengan donasi aktif
donor_leaderboard → Peringkat Top 10 donatur berdasarkan porsi terverifikasi

-- RPC Functions (Row-Level Locked)
claim_food_portion()  → Atomic stock deduction + generate pickup code
cancel_claim()        → Kembalikan stok ke katalog jika dibatalkan
confirm_pickup()      → Verifikasi pengambilan + tambah skor donatur
```

---

## 📸 Fitur Unggulan

| Fitur | Deskripsi |
|---|---|
| 🕐 **Countdown Timer** | Berjalan mundur per-detik, otomatis pulsa Amber saat < 30 menit |
| 📡 **Realtime Sync** | Supabase Realtime — kuota porsi berkurang live tanpa refresh |
| 🎫 **Digital Ticket** | Kode unik `#BR-XXXX` + pintasan rute Google Maps & WA otomatis |
| 🗺️ **Google Maps** | Tombol navigasi rute langsung ke titik lokasi donatur |
| 🏆 **Leaderboard** | Top 10 donatur apresiasi berdasarkan porsi terverifikasi diambil |
| 🌙 **Dark Mode** | Desain Glassmorphism dengan toggle Light/Dark tersimpan di localStorage |
| 📱 **Mobile-First** | Responsif penuh dari layar 360px (mobile) hingga desktop |
| 🔒 **Anti-Race Condition** | PostgreSQL `FOR UPDATE` lock di tingkat database untuk mencegah overselling |

---

## 👨‍💻 Lead Developer

Dikembangkan oleh **Nazwar Makarim Mahardhika** ([@Nazwarrrr](https://github.com/Nazwarrrr)) — XI RPL 2, SMKN 1 Garut.

---

<p align="center">
  <i>Makanan diselamatkan adalah rezeki yang dibagikan. 🍛</i>
</p>

