# StudyGeng 🎓
> **Find Your People. Learn Together.**  
> *Platform kolaboratif cerdas untuk menemukan partner belajar (study buddy), membentuk geng belajar, dan berkolaborasi dalam persiapan ujian maupun tugas akademis.*

---

## 📌 Daftar Isi
1. [Tentang StudyGeng](#-tentang-studygeng)
2. [Hasil & Fitur yang Sudah Selesai (Current Results)](#-hasil--fitur-yang-sudah-selesai-current-results)
   - [A. Autentikasi & Keamanan Tingkat Lanjut](#a-autentikasi--keamanan-tingkat-lanjut)
   - [B. Icons Bar / Navigasi Utama (Sesuai File XLSX)](#b-icons-bar--navigasi-utama-sesuai-file-xlsx)
   - [C. Beranda, Jam Real-Time & Kalender Mengambang](#c-beranda-jam-real-time--kalender-mengambang)
   - [D. Algoritma Pencocokan Teman Belajar (Smart Matching)](#d-algoritma-pencocokan-teman-belajar-smart-matching)
   - [E. Geng Belajar & Sinkronisasi Google Calendar](#e-geng-belajar--sinkronisasi-google-calendar)
   - [F. Pesan, Forum Publik, & Profil Terverifikasi](#f-pesan-forum-publik--profil-terverifikasi)
3. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
4. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
5. [Panduan Instalasi & Menjalankan Proyek](#-panduan-instalasi--menjalankan-proyek)
   - [Prasyarat](#prasyarat)
   - [Langkah Setup Lokal](#langkah-setup-lokal)
   - [Menjalankan Mode Demo Cepat](#menjalankan-mode-demo-cepat)
6. [Konfigurasi Integrasi](#-konfigurasi-integrasi)
   - [Setup Supabase Database](#setup-supabase-database)
   - [Setup Google OAuth (Sign-In dengan Google)](#setup-google-oauth-sign-in-dengan-google)
   - [Setup Email OTP Asli (SMTP)](#setup-email-otp-asli-smtp)
7. [Daftar Endpoint API Backend](#-daftar-endpoint-api-backend)
8. [Roadmap & Perkembangan yang Akan Datang (Future Development)](#-roadmap--perkembangan-yang-akan-datang-future-development)
   - [Fase 1: Migrasi Database & Realtime WebSocket](#fase-1-migrasi-database--realtime-websocket)
   - [Fase 2: Virtual Study Room & Pomodoro Timer](#fase-2-virtual-study-room--pomodoro-timer)
   - [Fase 3: Asisten AI StudyGeng (Smart Q&A Helper)](#fase-3-asisten-ai-studygeng-smart-qa-helper)
   - [Fase 4: Multi-Channel Reminder & Notifikasi](#fase-4-multi-channel-reminder--notifikasi)
   - [Fase 5: PWA & Aplikasi Mobile](#fase-5-pwa--aplikasi-mobile)
9. [Panduan Deploy ke Cloud (Vercel)](#-panduan-deploy-ke-cloud-vercel)

---

## 📖 Tentang StudyGeng

Belajar sendirian sering kali memicu kejenuhan, penundaan (*procrastination*), dan kesulitan memecahkan soal ujian yang rumit. Namun, mencari rekan belajar yang cocok secara materi, jadwal, dan karakter belajar bukanlah hal yang mudah.

**StudyGeng** hadir untuk menjembatani kesenjangan tersebut. Bukan sekadar platform media sosial, StudyGeng dirancang khusus dengan pendekatan berbasis data (*data-driven matching*) yang menghubungkan pelajar dan mahasiswa berdasarkan:
* Kesamaan subjek pelajaran/mata kuliah minat.
* Preferensi gaya belajar (metode online/offline, hening vs diskusi, visual vs auditori).
* Waktu luang mingguan yang beririsan.
* Jarak geografis untuk sesi belajar tatap muka yang aman.

---

## 🚀 Hasil & Fitur yang Sudah Selesai (Current Results)

Website StudyGeng saat ini telah memiliki fungsionalitas menyeluruh dari sisi Frontend interaktif, API Backend Express, integrasi database Supabase, hingga autentikasi Google OAuth.

### A. Autentikasi & Keamanan Tingkat Lanjut
* **Pintu & Kunci Interaktif (Door Scene Animation)**: Visual SVG interaktif dengan animasi pintu terbuka saat kunci dimasukkan, bereaksi terhadap status mengetik, verifikasi OTP, hingga login berhasil.
* **Dual Login Options**:
  * Login kredensial Email & Password dengan hashing `bcrypt` (12 rounds).
  * **Login 1-Klik dengan Google** (*Google Identity Services / GSI*) memverifikasi ID Token secara aman di backend menggunakan `google-auth-library`.
* **Verifikasi Kode OTP 6-Digit (*Six become one*)**: Animasi fusi 6 kotak OTP berputar dan menyatu menjadi orb centang hijau. Kode terlindungi HMAC-SHA256 dengan batas waktu (TTL 10 menit), limit percobaan (*max 5 tries*), dan cooldown kirim ulang 60 detik.
* **Sesi Stateless JWT**: Disimpan dalam `httpOnly`, `SameSite=Lax`, dan `Secure` cookies sehingga kebal dari pencurian script XSS browser.
* **Proteksi Lapis Baja**: Diberlakukan pembatasan laju request (*Rate Limiting* per IP) dan HTTP Security Headers (*Helmet Content Security Policy*).

---

### B. Icons Bar / Navigasi Utama (Sesuai File XLSX)
Navigasi utama dashboard dirancang responsif mengikuti spesifikasi file XLSX dengan ikon Lucide native SVG (ringan, ramah CSP, dan tanpa ketergantungan CDN eksternal):

| Menu | Ikon Lucide | Fungsi Spesifik | Implementasi pada Tampilan |
| :--- | :---: | :--- | :--- |
| **Beranda** | `house` | Rekomendasi teman belajar | Hero penjelasan platform, jam live, kalender melayang, & kartu kecocokan 80%+ |
| **Cari** | `search` | Cari teman dan grup dengan filter | Filter dinamis mata pelajaran, jenjang, bahasa, metode online/offline, & slider radius km |
| **Geng** | `users` | Buat dan gabung Geng Belajar | Buat geng privat/publik, kelola anggota, tambah sesi, & sinkronisasi Google Calendar |
| **Pesan** | `message-circle` | Chat dengan teman belajar | Antarmuka chat personal dengan kontak calon partner belajar sebelum menyepakati sesi |
| **Forum** | `circle-help` | Tanya jawab publik | Papan tanya jawab PR & materi ujian publik dengan kemampuan memberi jawaban |
| **Profil** | `user` | Ubah profil dan lihat status verifikasi | Kustomisasi biodata, minat materi, preferensi gaya belajar, matriks jadwal 7 hari, & badge verifikasi |

> **Responsivitas**:
> * **Desktop (>= 992px)**: Tampil sebagai **Sidebar Kiri Tetap (Left Sidebar)** dengan nama menu, ikon, dan subjudul fungsi.
> * **Mobile & Tablet (< 992px)**: Tampil sebagai **Bottom Navigation Bar** yang ramah ibu jari dengan indikator halaman aktif.

---

### C. Beranda, Jam Real-Time & Kalender Mengambang
Halaman Beranda (`home`) dilengkapi dengan pengalaman visual modern:
1. **Hero Penjelasan Platform**:
   * Headline dinamis dengan sapaan kontekstual waktu (*"Selamat Pagi ☀️"*, *"Selamat Siang 🌤️"*, *"Selamat Malam 🌙"*).
   * Penjelasan ringkas platform StudyGeng beserta 4 pilar keunggulan (Smart Matching 80%+, Geng Belajar Terarah, Forum Tanya Jawab, dan Komunitas Terverifikasi).
2. **Deteksi Zona Waktu Otomatis (*Auto Timezone*) & Jam Digital Real-Time**:
   * Membaca zona waktu browser perangkat secara otomatis (`Intl.DateTimeFormat`).
   * Menampilkan jam berdetik real-time (Jam:Menit:Detik) dengan lampu status hijau (*pulsing dot*).
   * Menampilkan kode zona waktu Indonesia (WIB, WITA, WIT) atau offset UTC lokasi pengunjung.
3. **Kalender Belajar Mengambang (*Floating Calendar*)**:
   * Kartu kalender interaktif beranimasi melayang halus (*gentle float animation*).
   * Kontrol navigasi bulan (`<` dan `>`) serta tombol instan *"Hari ini"*.
   * Sorotan otomatis tanggal hari ini dengan warna aksen cobalt cerah.
   * **Titik Sesi (*Session Dots*)**: Tanggal yang memiliki agenda belajar bersama Geng ditandai dengan dot kuning menyala.
   * **Session Drawer Interaktif**: Mengklik tanggal mana pun langsung menampilkan daftar sesi belajar di tanggal tersebut dan tombol pintas `+ Sesi Baru`.

---

### D. Algoritma Pencocokan Teman Belajar (Smart Matching)
Sistem menghitung persentase kecocokan (*match score*) antar-pelajar dengan rumus:

$$\text{Score} = 100 \times \left( 0.5 \times \text{Overlap}(\text{Subjek}) + 0.3 \times \frac{\text{Match}(\text{Gaya Belajar})}{3} + 0.2 \times \text{Overlap}(\text{Jadwal}) \right)$$

* **Bobot 50%**: Kesamaan mata pelajaran yang diminati.
* **Bobot 30%**: Keselarasan metode (online/offline), lingkungan (hening/diskusi), dan modalitas sensori (visual/auditori).
* **Bobot 20%**: Irisan ketersediaan jadwal mingguan (7 hari x 3 slot waktu).
* Filter pencarian juga dilengkapi pembatasan **Radius Jarak Offline (1–30 km)** untuk menjaga privasi lokasi pengguna.

---

### E. Geng Belajar & Sinkronisasi Google Calendar
* Buat kelompok belajar tematik dengan pilihan akses **Publik** (bebas gabung) atau **Privat** (perlu persetujuan Geng Master).
* Fitur jadwal sesi bersama: Setiap sesi memiliki judul dan waktu pertemuan.
* **1-Click Google Calendar Sync**: Tautan otomatis yang menyusun parameter event Google Calendar lengkap dengan judul sesi, waktu mulai, dan estimasi durasi sehingga langsung masuk ke kalender HP/laptop anggota.

---

### F. Pesan, Forum Publik, & Profil Terverifikasi
* **Pesan Pribadi**: Memungkinkan percakapan langsung antarpelajar sebelum memutuskan untuk belajar bersama.
* **Forum Tanya Jawab Publik**: Tempat bertanya soal PR yang sulit dan berdiskusi antarpelajar dari berbagai institusi.
* **Badge Pelajar Terverifikasi**: Akun yang mendaftar menggunakan email kampus/sekolah berekstensi `.ac.id`, `.edu`, atau `.sch.id` secara otomatis mendapatkan lencana resmi (*Verified Student Badge*).
* **Fitur Ulasan & Moderasi**: Kemampuan memberikan ulasan bintang (1-5) dan melaporkan/memblokir pengguna yang melanggar norma komunitas.

---

## 🛠 Arsitektur & Tech Stack

```
[ Client: Browser ]
   │
   ├── HTML5 + CSS3 (Space Grotesk, Instrument Sans, Neo-Brutalist Styling)
   ├── Vanilla ES6+ JavaScript (Komponen Modular, Engine Lucide Native, Auto Timezone)
   └── Google Identity Services (OAuth 2.0 Web Client)
   │
   ▼ HTTP/HTTPS (REST API & Cookie Session)
[ Backend: Node.js + Express ]
   │
   ├── Helmet Security Headers & Content Security Policy (CSP)
   ├── Rate Limiting (Express Rate Limit)
   ├── Autentikasi JWT (JSON Web Token) & Cookie Parser
   ├── Google Auth Library (ID Token Verification)
   └── Nodemailer (Pengiriman OTP Email via SMTP)
   │
   ▼ SSL / PostgreSQL Connection
[ Database: Supabase ]
   ├── Tabel users (ID, Email, Password Hash, Google ID, Avatar, Status Verifikasi)
   ├── Tabel email_verifications (OTP Hash, Expiration, Attempt Counter)
   ├── Tabel password_resets (OTP Hash, Expiration, Reset Ticket)
   └── Row Level Security (RLS) terisolasi
```

---

## 📂 Struktur Direktori Proyek

```
StudyGeng/
├── public/                       # Frontend Aset Statis
│   ├── index.html                # Halaman Masuk/Daftar/Verifikasi OTP & Google Sign-In
│   ├── script.js                 # Logika Frontend Auth, Pintu SVG, OTP, & GSI Client
│   ├── dashboard.html            # App Shell Utama (Topbar, Auto Timezone, Icons Bar, Main)
│   ├── dashboard.js              # State Management, Algoritma Skor, Floating Calendar, & View
│   └── style.css                 # Desain Sistem Lengkap, Animasi Float, & Responsivitas
├── .env.example                  # Template Variabel Lingkungan
├── .env                          # Variabel Rahasia Lokal (Diabaikan oleh Git)
├── package.json                  # Dependensi Node.js & Perintah Scripts
├── schema.sql                    # Skema Database PostgreSQL Supabase
├── server.js                     # Server Express, Endpoint Auth, & Middleware Keamanan
├── vercel.json                   # Konfigurasi Serverless Deployment Vercel
└── README.md                     # Dokumentasi Resmi Proyek
```

---

## 💻 Panduan Instalasi & Menjalankan Proyek

### Prasyarat
* [Node.js](https://nodejs.org/) versi 18 atau yang lebih baru.
* Akun [Supabase](https://supabase.com/) gratis.
* Browser modern (Chrome, Edge, Firefox, atau Safari).

### Langkah Setup Lokal
1. **Clone atau buka folder proyek:**
   ```bash
   cd StudyGeng
   ```
2. **Install dependensi:**
   ```bash
   npm install
   ```
3. **Siapkan file environment:**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
4. **Generate rahasia JWT & OTP:**
   Jalankan perintah berikut dua kali di terminal untuk mendapatkan string acak yang aman:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Salin hasil pertama ke `JWT_SECRET` dan hasil kedua ke `OTP_SECRET` di file `.env`.

5. **Jalankan server dalam mode development:**
   ```bash
   npm run dev
   ```
6. **Buka aplikasi:**
   Akses **[http://localhost:3000](http://localhost:3000)** di browser favoritmu.

### Menjalankan Mode Demo Cepat
Jika kamu ingin langsung mencoba seluruh tampilan frontend, dashboard, navigasi 6 menu, dan kalender mengambang tanpa perlu login database terlebih dahulu:
* Buka langsung URL: **[http://localhost:3000/dashboard.html#demo](http://localhost:3000/dashboard.html#demo)**
* Atau klik tombol **"Coba Demo Frontend"** di pojok kanan atas halaman login.

---

## ⚙️ Konfigurasi Integrasi

### Setup Supabase Database
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Buka menu **SQL Editor**, buat query baru, lalu salin seluruh isi file [`schema.sql`](file:///d:/Hosea/INFORMATICS/StudyGeng/schema.sql) dan klik tombol **Run**.
3. Buka **Project Settings** > **API**, salin:
   * **Project URL** ke `SUPABASE_URL` di `.env`.
   * **service_role key** (Secret) ke `SUPABASE_SERVICE_ROLE_KEY` di `.env`.

### Setup Google OAuth (Sign-In dengan Google)
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat project baru (contoh: `StudyGeng`).
3. Pada **APIs & Services** > **OAuth consent screen**:
   * Pilih **External**, isi nama aplikasi `StudyGeng` dan email kontakmu.
   * Pada tab **Test Users**, tambahkan email Google yang akan kamu gunakan untuk menguji login.
4. Pada **APIs & Services** > **Credentials**:
   * Klik **+ Create Credentials** > **OAuth client ID**.
   * Pilih tipe **Web application**.
   * Di bagian **Authorized JavaScript origins**, tambahkan:
     * `http://localhost:3000` (tanpa tanda garis miring di ujung).
     * Domain hosting production kamu (misal: `https://studygeng.vercel.app`).
   * Klik **Create** dan salin **Client ID**.
5. Tempelkan Client ID ke baris `GOOGLE_CLIENT_ID` di file `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```
6. Restart server `npm run dev`. Tombol resmi Google Sign-In otomatis aktif!

### Setup Email OTP Asli (SMTP)
* **Mode Belajar/Lokal**: Biarkan variabel `SMTP_HOST` kosong. Kode OTP 6 digit akan langsung tercetak di terminal/konsol tempat server berjalan.
* **Mode Produksi (Gmail)**:
  * `SMTP_HOST=smtp.gmail.com`
  * `SMTP_PORT=587`
  * `SMTP_USER=emailkamu@gmail.com`
  * `SMTP_PASS=xxxx xxxx xxxx xxxx` *(Gunakan 16 digit App Password dari Akun Google > Keamanan > Verifikasi 2 Langkah > Sandi Aplikasi)*.

---

## 📡 Daftar Endpoint API Backend

Semua respons endpoint backend berupa format JSON standar `{ ok: true/false, message?, ... }`:

| Metode | Endpoint | Keterangan |
| :---: | :--- | :--- |
| `GET` | `/api/auth/config` | Mengambil konfigurasi publik (misal: Google Client ID) |
| `POST` | `/api/auth/register` | Mendaftarkan akun baru & menerbitkan OTP verifikasi email |
| `POST` | `/api/auth/verify-otp` | Memvalidasi 6-digit OTP pendaftaran & membuat sesi login |
| `POST` | `/api/auth/resend-otp` | Mengirim ulang kode OTP baru (dengan cooldown 60 detik) |
| `POST` | `/api/auth/login` | Masuk dengan email & password terdaftar |
| `POST` | `/api/auth/google` | Verifikasi ID Token Google Sign-In & sinkronisasi akun |
| `POST` | `/api/auth/forgot-password` | Meminta kode pemulihan password via email |
| `POST` | `/api/auth/reset-password` | Mereset password baru menggunakan token verifikasi |
| `POST` | `/api/auth/logout` | Menghapus cookie sesi `sg_session` |
| `GET` | `/api/auth/me` | Mengambil data profil pengguna yang sedang login |

---

## 🔮 Roadmap & Perkembangan yang Akan Datang (Future Development)

Berikut adalah cetak biru (*blueprint*) pengembangan fitur StudyGeng di masa depan untuk terus berevolusi menjadi ekosistem belajar komprehensif:

```
[ Fase 1: Real-time Cloud ] ➔ [ Fase 2: Virtual Study Room ] ➔ [ Fase 3: AI Assistant ] ➔ [ Fase 4: Multi-Channel Bot ] ➔ [ Fase 5: Mobile App ]
```

### Fase 1: Migrasi Database & Realtime WebSocket
- [ ] **Migrasi State Mock ke Supabase Database Penuh**: Mengganti penyimpanan `localStorage` pada grup, sesi, chat, ulasan, dan forum ke tabel relational Supabase.
- [ ] **Supabase Realtime / WebSocket**:
  * Notifikasi instan saat ada pesan masuk atau saat permintaan gabung geng disetujui.
  * Indikator status kehadiran (*Online / Sedang Belajar / Offline*).
  * Status pesan terbaca (*Read Receipts*).

### Fase 2: Virtual Study Room & Pomodoro Timer
- [ ] **Study Room Virtual Terintegrasi**:
  * Integrasi video/audio room (menggunakan WebRTC / Jitsi Meet SDK) langsung di dalam website tanpa perlu aplikasi pihak ketiga.
  * Fitur *Screen Sharing* untuk presentasi soal latihan dan catatan kuliah.
- [ ] **Collaborative Pomodoro Timer**:
  * Pengatur waktu belajar bersama (25 menit belajar fokus, 5 menit istirahat) yang tersinkronisasi antar-anggota geng.
  * Papan musik latar instrumen/lo-fi ambient untuk meningkatkan konsentrasi.

### Fase 3: Asisten AI StudyGeng (Smart Q&A Helper)
- [ ] **AI Study Partner**:
  * Asisten AI berbasis LLM (Gemini API) yang dapat memberikan petunjuk langkah demi langkah (*hint*) saat memecahkan soal di Forum tanpa langsung memberikan jawaban instan (pendekatan Sokratik).
  * Pembuat ringkasan materi dan kuis latihan otomatis berdasarkan silabus mata kuliah yang dipilih.
- [ ] **Smart Matchmaking 2.0**:
  * Peningkatan algoritma pencocokan dengan *Embedding Vectors* untuk menganalisis topik skripsi, tugas akhir, atau minat riset yang sangat spesifik.

### Fase 4: Multi-Channel Reminder & Notifikasi
- [ ] **Bot Pengingat Belajar (WhatsApp & Telegram)**:
  * Pengingat otomatis 30 menit sebelum sesi belajar geng dimulai langsung ke chat WhatsApp/Telegram anggota.
  * Fitur konfirmasi kehadiran (*RSVP*) langsung via tombol bot.
- [ ] **Web Push Notifications**:
  * Notifikasi browser pada desktop dan smartphone saat ada jadwal belajar atau jawaban baru di forum.

### Fase 5: PWA & Aplikasi Mobile
- [ ] **Progressive Web App (PWA)**:
  * Dukungan *Install to Home Screen* di Android & iOS dengan kemampuan offline caching.
- [ ] **Aplikasi Mobile Native (React Native / Flutter)**:
  * Fitur pencarian teman berbasis GPS live lokasi terdekat saat berada di perpustakaan atau area kampus.
  * Fitur *Tap-to-connect* menggunakan QR Code antar-pelajar saat bertemu di dunia nyata.

---

## ☁️ Panduan Deploy ke Cloud (Vercel)

Aplikasi StudyGeng telah dilengkapi dengan konfigurasi [`vercel.json`](file:///d:/Hosea/INFORMATICS/StudyGeng/vercel.json) dan siap di-deploy secara serverless:

1. Simpan dan push repository ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete studygeng frontend and google auth"
   git branch -M main
   git remote add origin https://github.com/username/studygeng.git
   git push -u origin main
   ```
2. Buka dashboard [Vercel](https://vercel.com/) > **Add New** > **Project** > Pilih repository `studygeng`.
3. Di bagian **Environment Variables**, masukkan seluruh variabel dari file `.env`:
   * `NODE_ENV` = `production`
   * `SUPABASE_URL`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `JWT_SECRET`
   * `OTP_SECRET`
   * `GOOGLE_CLIENT_ID`
   * *(Opsional)* `SMTP_*` untuk email asli.
4. Klik **Deploy**. Website StudyGeng kamu akan langsung online dalam beberapa detik!
5. Jangan lupa menambahkan URL Vercel yang didapat (misal: `https://studygeng.vercel.app`) ke menu **Authorized JavaScript origins** di Google Cloud Console agar Login Google di domain live langsung aktif.

---

<p align="center">
  Dibuat dengan ❤️ untuk kemajuan pelajar dan mahasiswa Indonesia.<br>
  <b>StudyGeng: Find Your People. Learn Together.</b>
</p>
