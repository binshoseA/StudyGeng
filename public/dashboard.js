"use strict";
/* =========================================================
   StudyGeng: dashboard.js
   Fitur Lengkap:
   1. Data & Mock State
   2. Lucide Icons Engine
   3. Automatic Timezone & Live Clock
   4. Floating Calendar Engine
   5. Algoritma Pencocokan & Helper
   6. View Renderer (Beranda, Cari, Geng, Pesan, Forum, Profil)
   7. Event Handlers & Aksi
   8. Inisialisasi & Boot
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

/* ===== 1. LUCIDE ICONS ENGINE (SVG NATIVE, CSP-SAFE, OFFLINE-READY) ===== */
const LUCIDE_ICONS = {
  "house": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  "circle-help": '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "calendar": '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  "globe": '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  "sparkles": '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "plus": '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  "arrow-right": '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  "star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
};

function icon(name, size = 18, cls = "") {
  const d = LUCIDE_ICONS[name] || LUCIDE_ICONS["circle-help"];
  return `<svg class="lucide lucide-${name} ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

function renderTabIcons() {
  $$("#tabs [data-icon]").forEach(el => {
    const name = el.dataset.icon;
    el.innerHTML = icon(name, 20);
  });
}

/* ===== 2. AUTOMATIC TIMEZONE & LIVE CLOCK ===== */
function initTimezoneClock() {
  const clockEl = $("#tz-clock");
  const periodEl = $("#tz-period");
  const cityEl = $("#tz-city");

  function update() {
    const now = new Date();
    // Deteksi zona waktu otomatis
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    
    // Format jam:menit:detik
    const timeParts = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz
    }).format(now);

    // Ambil offset jam (contoh GMT+7)
    const offsetMin = -now.getTimezoneOffset();
    const offsetHour = Math.floor(Math.abs(offsetMin) / 60);
    const offsetSign = offsetMin >= 0 ? "+" : "-";
    const gmtStr = `UTC${offsetSign}${offsetHour}`;

    // Singkatan WIB/WITA/WIT jika di Indonesia, atau nama zona waktu
    let zoneCode = gmtStr;
    if (tz.includes("Jakarta") || tz.includes("Pontianak") || offsetMin === 420) zoneCode = "WIB";
    else if (tz.includes("Makassar") || tz.includes("Bali") || offsetMin === 480) zoneCode = "WITA";
    else if (tz.includes("Jayapura") || offsetMin === 540) zoneCode = "WIT";

    const cleanCity = tz.split("/").pop().replace(/_/g, " ");

    if (clockEl) clockEl.textContent = timeParts;
    if (periodEl) periodEl.textContent = zoneCode;
    if (cityEl) cityEl.textContent = `${cleanCity} (${gmtStr})`;
  }

  update();
  setInterval(update, 1000);
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return { text: "Selamat Pagi", icon: "☀️", note: "Waktu yang segar untuk belajar materi baru." };
  if (hour >= 11 && hour < 15) return { text: "Selamat Siang", icon: "🌤️", note: "Tetap fokus dan terhidrasi di tengah aktivitas." };
  if (hour >= 15 && hour < 18) return { text: "Selamat Sore", icon: "🌇", note: "Saat yang pas untuk review materi atau diskusi tugas." };
  return { text: "Selamat Malam", icon: "🌙", note: "Sesi belajar malam bersama Geng lebih seru dan tenang." };
}

/* ===== 3. DATA & MODEL SEED ===== */
const SUBJECTS = ["Matematika", "Fisika", "Kimia", "Biologi", "Pemrograman", "UI/UX", "Ekonomi", "Bahasa Inggris"];
const LEVELS = ["SMA/SMK", "D3/S1", "S2"];
const LANGS = ["Indonesia", "English"];
const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const SLOTS = ["Pagi", "Siang", "Malam"];

const P = (id, name, inst, level, subj, lang, mode, env, sense, km, av, verified, rating, n) =>
  ({ id, name, inst, level, subj, lang, mode, env, sense, km, av, verified, rating, n });

const PEOPLE = [
  P(1, "Rara Anindya", "Kampus Nusantara", "D3/S1", ["Matematika", "Fisika"], ["Indonesia"], "online", "diskusi", "visual", 4, ["Sen-Malam", "Rab-Malam", "Sab-Pagi"], true, 4.8, 12),
  P(2, "Dimas Pratama", "Politeknik Garuda", "D3/S1", ["Pemrograman", "UI/UX"], ["Indonesia", "English"], "offline", "hening", "visual", 7, ["Sel-Siang", "Kam-Malam", "Sab-Siang"], true, 4.6, 9),
  P(3, "Salsa Putri", "SMAN 8 Kota", "SMA/SMK", ["Matematika", "Kimia", "Bahasa Inggris"], ["Indonesia"], "offline", "diskusi", "auditori", 3, ["Sen-Siang", "Rab-Siang", "Jum-Siang"], true, 4.9, 21),
  P(4, "Kevin Wijaya", "Institut Cakrawala", "D3/S1", ["Ekonomi", "Bahasa Inggris"], ["English", "Indonesia"], "online", "diskusi", "auditori", 12, ["Sen-Malam", "Kam-Malam"], false, 4.2, 4),
  P(5, "Nadia Rahma", "Universitas Harapan", "S2", ["Fisika", "Matematika", "Pemrograman"], ["English"], "online", "hening", "visual", 25, ["Sel-Malam", "Sab-Pagi", "Min-Pagi"], true, 4.7, 15),
  P(6, "Bima Arya", "Kampus Nusantara", "D3/S1", ["Biologi", "Kimia"], ["Indonesia"], "offline", "hening", "visual", 9, ["Rab-Pagi", "Jum-Malam"], false, 4.4, 6),
];

// Buat tanggal sesi realistis (hari ini & beberapa hari ke depan)
const todayIso = new Date().toISOString().slice(0, 10);
const tomorrowIso = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const next3DaysIso = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);

const SEED_GROUPS = [
  {
    id: "g1",
    name: "Geng Kalkulus Malam",
    subj: "Matematika",
    pub: true,
    master: "Rara Anindya",
    members: ["Rara Anindya", "Salsa Putri"],
    pending: [],
    sessions: [
      { title: "Review Turunan & Integral Parsial", at: `${todayIso}T19:30` },
      { title: "Latihan Soal Ujian Tengah Semester", at: `${next3DaysIso}T20:00` }
    ]
  },
  {
    id: "g2",
    name: "UI/UX Bareng & Design Sprint",
    subj: "UI/UX",
    pub: false,
    master: "Dimas Pratama",
    members: ["Dimas Pratama"],
    pending: [],
    sessions: [
      { title: "Wireframing & Prototype Review", at: `${tomorrowIso}T14:00` }
    ]
  },
];

const SEED_FORUM = [
  {
    id: "q1",
    title: "Cara cepat paham limit fungsi trigonometri?",
    body: "Aku selalu bingung saat ketemu bentuk 0/0 di limit sin dan tan. Ada tips cepat atau penurunan rumusnya?",
    by: "Salsa Putri",
    answers: [
      { by: "Nadia Rahma", t: "Ingat rumus dasar lim x->0 sin(ax)/bx = a/b. Faktorkan dan kelompokkan bentuk sin/tan-nya lebih dulu!" }
    ]
  },
  {
    id: "q2",
    title: "Rekomendasi roadmap belajar React & Express untuk pemula?",
    body: "Lebih baik kuasai JavaScript DOM dulu atau langsung lompat ke komponen framework?",
    by: "Kevin Wijaya",
    answers: [
      { by: "Dimas Pratama", t: "Sangat disarankan pahami array methods (map, filter, reduce), async/await, dan destructuring dulu sebelum masuk state React." }
    ]
  }
];

/* ===== 4. STATE & SKOR ===== */
let user, S, KEY, cur = "home", chatId = null, verified = false;

// State untuk Kalender Mengambang
let calState = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-11
  selectedDateStr: todayIso
};

const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const me = () => S.profile;
const person = id => PEOPLE.find(p => p.id == id);
const ov = (a, b) => a.filter(x => b.includes(x)).length / Math.max(1, Math.min(a.length, b.length));
// Skor kecocokan: 50% kesamaan subjek, 30% gaya belajar, 20% ketersediaan jadwal
const score = p => Math.round(100 * (
  .5 * ov(me().subj, p.subj) +
  .3 * ((me().mode === p.mode) + (me().env === p.env) + (me().sense === p.sense)) / 3 +
  .2 * ov(me().av, p.av)
));

const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
const opts = a => a.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
const gcal = (g, s) => {
  const d = new Date(s.at), e = new Date(+d + 36e5), f = x => x.toISOString().replace(/[-:]|\.\d{3}/g, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(g.name + ": " + s.title)}&dates=${f(d)}/${f(e)}`;
};

let toastT;
function toast(m, type = "success") {
  const t = $("#toast");
  t.textContent = m;
  t.className = `toast show ${type}`;
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.className = "toast"), 3000);
}

/* ===== 5. FLOATING CALENDAR ENGINE ===== */
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Ambil semua sesi belajar dari semua grup untuk ditampilkan di kalender
function getAllSessions() {
  const list = [];
  if (!S || !S.groups) return list;
  for (const g of S.groups) {
    for (const s of g.sessions) {
      list.push({ groupName: g.name, groupId: g.id, title: s.title, at: s.at, date: s.at.slice(0, 10) });
    }
  }
  return list;
}

function renderFloatingCalendarHtml() {
  const { viewYear, viewMonth, selectedDateStr } = calState;
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mulai dari Senin (0)
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();

  const sessions = getAllSessions();
  const sessionDates = new Set(sessions.map(s => s.date));

  let daysHtml = "";

  // Hari dari bulan sebelumnya (faded)
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    daysHtml += `<div class="cal-day cal-day-faded" aria-disabled="true">${d}</div>`;
  }

  // Hari di bulan aktif
  for (let d = 1; d <= totalDays; d++) {
    const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = dayStr === todayIso;
    const isSelected = dayStr === selectedDateStr;
    const hasSession = sessionDates.has(dayStr);

    daysHtml += `
      <button type="button" class="cal-day ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${hasSession ? "has-session" : ""}"
        data-cal-date="${dayStr}" title="${dayStr}${hasSession ? " (Ada Sesi Belajar)" : ""}">
        <span class="day-number">${d}</span>
        ${hasSession ? '<span class="session-dot" aria-label="Ada jadwal sesi"></span>' : ""}
      </button>
    `;
  }

  // Cari sesi pada tanggal yang dipilih
  const selectedSessions = sessions.filter(s => s.date === selectedDateStr);
  const selectedDateObj = new Date(selectedDateStr + "T00:00:00");
  const formattedSelectedDate = selectedDateObj.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return `
    <div class="floating-cal-card" id="floating-cal">
      <div class="cal-floating-badge">
        <span class="sparkle-anim">${icon("sparkles", 14)}</span>
        <span>Kalender Belajar Mengambang</span>
      </div>

      <div class="cal-header">
        <div class="cal-title-wrap">
          <span class="cal-month">${MONTH_NAMES[viewMonth]}</span>
          <span class="cal-year">${viewYear}</span>
        </div>
        <div class="cal-controls">
          <button type="button" class="cal-nav-btn" data-cal-nav="prev" title="Bulan Sebelumnya">
            ${icon("chevron-left", 16)}
          </button>
          <button type="button" class="cal-nav-today" data-cal-nav="today" title="Lompat ke Hari Ini">
            Hari ini
          </button>
          <button type="button" class="cal-nav-btn" data-cal-nav="next" title="Bulan Berikutnya">
            ${icon("chevron-right", 16)}
          </button>
        </div>
      </div>

      <div class="cal-weekdays">
        <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
      </div>

      <div class="cal-grid">
        ${daysHtml}
      </div>

      <!-- Detail Jadwal Tanggal yang Dipilih -->
      <div class="cal-session-drawer">
        <div class="cal-drawer-header">
          <div class="cal-selected-info">
            <span class="cal-label-date">${formattedSelectedDate}</span>
            <span class="cal-count-badge">${selectedSessions.length} Sesi</span>
          </div>
          <button type="button" class="btn-cal-action" data-act="jump-geng" title="Buka Geng Belajar">
            ${icon("plus", 13)} Sesi Baru
          </button>
        </div>

        <div class="cal-session-list">
          ${selectedSessions.length ? selectedSessions.map(s => `
            <div class="cal-session-item">
              <div class="session-time">${icon("clock", 13)} ${s.at.slice(11, 16)} WIB</div>
              <div class="session-text">
                <b>${esc(s.title)}</b>
                <span class="session-group">${esc(s.groupName)}</span>
              </div>
            </div>
          `).join("") : `
            <div class="cal-session-empty">
              <span>Tidak ada sesi di tanggal ini. Klik tombol di atas untuk jadwalkan sesi baru bersama Geng!</span>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/* ===== 6. VIEW RENDERER (HALAMAN-HALAMAN) ===== */

function card(p) {
  const r = S.reviews[p.id];
  return `
    <article class="card study-card">
      <div class="row">
        <b>${esc(p.name)}</b>
        <span class="score" title="Tingkat kecocokan dengan profilmu">${score(p)}% Cocok</span>
      </div>
      ${p.verified ? `<span class="vb">${icon("shield-check", 13)} Pelajar Terverifikasi</span>` : ""}
      <p class="meta">${esc(p.inst)}, ${esc(p.level)}, ~${p.km} km</p>
      <div class="tags-wrap">
        ${p.subj.map(s => `<span class="tag">${esc(s)}</span>`).join("")}
      </div>
      <p class="meta">
        ${p.mode === "online" ? "🌐 Daring (Online)" : "📍 Luring (Offline)"} • ${p.env} • Gaya ${p.sense}.
        Rating ${p.rating} ★ (${p.n} ulasan)${r ? ` • Ulasanmu: ${stars(r.stars)}` : ""}
      </p>
      <div class="acts">
        <button class="btn sm" data-act="chat" data-id="${p.id}">${icon("message-circle", 15)} Chat</button>
        <button class="btn ghost sm" data-act="review" data-id="${p.id}">${icon("star", 15)} Ulas</button>
        <button class="btn ghost sm" data-act="report" data-id="${p.id}">Lapor</button>
      </div>
    </article>
  `;
}

const visible = () => PEOPLE.filter(p => !S.blocked.includes(p.id));

/* ===== 6A. BERANDA (HOME) DENGAN PENJELASAN WEB, KALENDER MENGAMBANG, & AUTO TIMEZONE ===== */
function home() {
  const greeting = getTimeGreeting();
  const userName = me()?.name ? esc(me().name.split(" ")[0]) : "Kawan";
  const rec = visible().filter(p => score(p) >= 80).sort((a, b) => score(b) - score(a));

  return `
    <!-- HERO BERANDA: GREETING & PENJELASAN WEBSITE -->
    <section class="home-hero-grid">
      <!-- SISI KIRI: PENJELASAN WEBSITE & LIVE TIMEZONE -->
      <div class="home-intro-card">
        <div class="greeting-pill">
          <span>${greeting.icon} ${greeting.text}, <b>${userName}</b>!</span>
        </div>
        
        <h1 class="home-headline">
          Temukan <b>Frekuensi Belajarmu</b> Bersama Teman Sejati.
        </h1>
        
        <p class="home-desc">
          <b>StudyGeng</b> adalah platform cerdas untuk menemukan teman belajar (<i>study buddy</i>) 
          dan membentuk kelompok belajar (<i>Geng Belajar</i>) dengan kecocokan tinggi berdasarkan 
          minat materi, gaya belajar, dan ketersediaan waktu. Belajar tak lagi sendirian, lebih seru dan konsisten!
        </p>

        <!-- 4 PILAR FITUR STUDYGENG -->
        <div class="features-pill-grid">
          <div class="feat-item">
            <span class="feat-icon">${icon("sparkles", 18)}</span>
            <div class="feat-body">
              <strong>Smart Matching 80%+</strong>
              <small>Cocokkan subjek, gaya hening/diskusi, & jadwal otomatis.</small>
            </div>
          </div>
          <div class="feat-item">
            <span class="feat-icon">${icon("users", 18)}</span>
            <div class="feat-body">
              <strong>Geng Belajar Terarah</strong>
              <small>Buat kelompok belajar & sinkronkan ke Google Calendar.</small>
            </div>
          </div>
          <div class="feat-item">
            <span class="feat-icon">${icon("circle-help", 18)}</span>
            <div class="feat-body">
              <strong>Forum & Tanya Jawab</strong>
              <small>Diskusi PR, bedah soal ujian, dan berbagi catatan.</small>
            </div>
          </div>
          <div class="feat-item">
            <span class="feat-icon">${icon("shield-check", 18)}</span>
            <div class="feat-body">
              <strong>Komunitas Terverifikasi</strong>
              <small>Keamanan aman terverifikasi via email kampus/sekolah.</small>
            </div>
          </div>
        </div>

        <!-- QUICK ACTION SHORTCUTS -->
        <div class="home-cta-row">
          <button type="button" class="btn sm" data-act="go-search">
            ${icon("search", 16)} Cari Teman Sekarang
          </button>
          <button type="button" class="btn ghost sm" data-act="go-geng">
            ${icon("users", 16)} Lihat Geng Belajar
          </button>
        </div>
      </div>

      <!-- SISI KANAN: KALENDER MENGAMBANG & JADWAL SESI -->
      <div class="home-cal-wrapper">
        ${renderFloatingCalendarHtml()}
      </div>
    </section>

    <!-- SECTION REKOMENDASI TEMAN BELAJAR -->
    <section class="home-rec-section">
      <div class="section-header-row">
        <div>
          <h2>Rekomendasi Teman Belajar</h2>
          <p class="lead">Daftar calon study partner dengan kecocokan di atas 80% berdasarkan profil belajarmu.</p>
        </div>
        <button type="button" class="link-view-all" data-act="go-search">
          Lihat semua & filter ${icon("arrow-right", 14)}
        </button>
      </div>

      ${rec.length ? `
        <div class="cards">${rec.map(card).join("")}</div>
      ` : `
        <div class="empty">
          <p><b>Belum ada teman dengan skor di atas 80%.</b></p>
          <p class="meta">Coba lengkapi subjek minat dan jadwal di menu Profil, atau gunakan menu Cari untuk menyetel radius offline.</p>
        </div>
      `}
    </section>
  `;
}

/* ===== 6B. CARI TEMAN & GRUP ===== */
function search() {
  const sel = (n, l, o) => `<div class="field"><label>${l}</label><select name="${n}"><option value="">Semua</option>${o}</select></div>`;
  return `
    <div class="section-head">
      <h2>${icon("search", 24)} Cari Teman Belajar & Grup</h2>
      <p class="lead">Gunakan filter cerdas di bawah untuk menemukan partner sesuai mata pelajaran, jenjang, atau jarak radius belajar bersama.</p>
    </div>
    
    <form class="filters card" id="filters">
      ${sel("subj", "Mata Pelajaran", opts(SUBJECTS))}
      ${sel("level", "Jenjang Pendidikan", opts(LEVELS))}
      ${sel("lang", "Bahasa Pengantar", opts(LANGS))}
      ${sel("mode", "Metode Belajar", '<option value="online">Online (Daring)</option><option value="offline">Offline (Tatap Muka)</option>')}
      
      <div class="field">
        <label for="km">Radius Offline: <b id="rad">10</b> km</label>
        <input id="km" type="range" name="km" min="1" max="30" value="10">
      </div>
    </form>
    
    <p class="meta info-tip">${icon("globe", 14)} Radius hanya berlaku untuk sesi belajar offline. Lokasi pasti dijaga privasinya dan hanya berupa estimasi jarak.</p>
    
    <div class="cards" id="results"></div>
  `;
}

function results() {
  const formEl = $("#filters");
  if (!formEl) return;
  const f = Object.fromEntries(new FormData(formEl));
  $("#rad").textContent = f.km;
  const list = visible().filter(p =>
    (!f.subj || p.subj.includes(f.subj)) &&
    (!f.level || p.level === f.level) &&
    (!f.lang || p.lang.includes(f.lang)) &&
    (!f.mode || p.mode === f.mode) &&
    (f.mode !== "offline" || p.km <= +f.km)
  ).sort((a, b) => score(b) - score(a));

  $("#results").innerHTML = list.length
    ? list.map(card).join("")
    : '<p class="empty">Tidak ada hasil yang cocok dengan filter saat ini. Coba longgarkan pilihan filtermu.</p>';
}

/* ===== 6C. GENG BELAJAR ===== */
function groupCard(g) {
  const nm = me().name;
  const mem = g.members.includes(nm);
  const wait = g.pending.includes(nm);

  return `
    <article class="card group-card">
      <div class="row">
        <b>${esc(g.name)}</b>
        <span class="tag ${g.pub ? "tag-pub" : "tag-priv"}">${g.pub ? "Publik" : "Privat"}</span>
      </div>
      <p class="meta">Materi: <b>${esc(g.subj)}</b> • Master: <b>${esc(g.master)}</b> • ${g.members.length} Anggota</p>
      
      ${mem ? "" : `
        <button class="btn sm" data-act="join" data-id="${g.id}" ${wait ? "disabled" : ""}>
          ${wait ? "Menunggu Persetujuan Master" : g.pub ? "Gabung Geng Ini" : "Minta Izin Bergabung"}
        </button>
      `}
      
      ${g.master === nm && g.pending.length ? `
        <div class="pending-list">
          <small class="lb">Permintaan Gabung:</small>
          ${g.pending.map(n => `
            <div class="pending-row">
              <span>${esc(n)}</span>
              <button class="link" data-act="approve" data-id="${g.id}" data-n="${esc(n)}">Setujui</button>
            </div>
          `).join("")}
        </div>
      ` : ""}
      
      ${mem ? `
        <details class="session-details" open>
          <summary>${icon("calendar", 14)} Jadwal Sesi Bersama (${g.sessions.length})</summary>
          <div class="session-box">
            ${g.sessions.map(s => `
              <div class="session-row-item">
                <div>
                  <strong>${esc(s.title)}</strong>
                  <div class="meta">${new Date(s.at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} WIB</div>
                </div>
                <a href="${gcal(g, s)}" target="_blank" rel="noopener" class="link-gcal" title="Tambahkan ke Google Calendar">
                  + Google Calendar
                </a>
              </div>
            `).join("")}
            <form class="send session-create-form" data-form="session" data-id="${g.id}">
              <input name="title" placeholder="Judul sesi (misal: Bedah Bab 3)" required maxlength="60" aria-label="Judul sesi">
              <input type="datetime-local" name="at" required aria-label="Waktu sesi">
              <button class="btn sm">+ Tambah Sesi</button>
            </form>
          </div>
        </details>
      ` : ""}
    </article>
  `;
}

function groups() {
  return `
    <div class="section-head">
      <h2>${icon("users", 24)} Geng Belajar</h2>
      <p class="lead">Gabung ke grup belajar tematik atau bangun Geng barumu sendiri untuk mengatur sesi latihan bersama yang teratur.</p>
    </div>

    <details class="card new-group-box">
      <summary>${icon("plus", 16)} <b>Buat Geng Belajar Baru</b></summary>
      <form id="f-group" class="group-form">
        <div class="field">
          <label for="gn">Nama Geng</label>
          <input id="gn" name="name" placeholder="Contoh: Study Group Pemrograman Web" required maxlength="40">
        </div>
        <div class="field">
          <label for="gs">Subjek Materi</label>
          <select id="gs" name="subj">${opts(SUBJECTS)}</select>
        </div>
        <div class="field">
          <label for="gp">Akses Bergabung</label>
          <select id="gp" name="pub">
            <option value="1">Publik (Siapa pun dapat langsung bergabung)</option>
            <option value="0">Privat (Perlu persetujuan kamu sebagai Geng Master)</option>
          </select>
        </div>
        <button class="btn sm">Buat Geng Sekarang</button>
      </form>
    </details>

    <div class="cards">${S.groups.map(groupCard).join("")}</div>
  `;
}

/* ===== 6D. PESAN (CHAT) ===== */
function chat() {
  const ids = Object.keys(S.chats).filter(id => !S.blocked.includes(+id));
  if (!ids.length) {
    return `
      <div class="section-head">
        <h2>${icon("message-circle", 24)} Pesan & Diskusi</h2>
        <p class="empty">Belum ada percakapan aktif. Buka tab <b>Beranda</b> atau <b>Cari</b>, lalu klik tombol <b>Chat</b> pada profil teman belajar untuk memulai diskusi.</p>
      </div>
    `;
  }

  if (!ids.includes(String(chatId))) chatId = ids[0];
  const activePeer = person(chatId) || { name: "Teman Belajar" };
  const msgs = S.chats[chatId] || [];

  return `
    <div class="section-head">
      <h2>${icon("message-circle", 24)} Pesan & Diskusi</h2>
      <p class="lead">Diskusikan topik, bahan ajar, dan kepastian jadwal sebelum memulai sesi belajar bersama.</p>
    </div>

    <div class="chat-container">
      <div class="clist">
        ${ids.map(id => {
          const p = person(id) || { name: "User #" + id };
          return `
            <button class="chat-contact-btn ${id == chatId ? "on" : ""}" data-act="open" data-id="${id}">
              <span class="contact-avatar">${esc(p.name.slice(0, 2).toUpperCase())}</span>
              <span class="contact-name">${esc(p.name)}</span>
            </button>
          `;
        }).join("")}
      </div>

      <div class="chat-window">
        <div class="chat-peer-bar">
          <b>${esc(activePeer.name)}</b>
          <small class="meta">${esc(activePeer.inst || "Pelajar")}</small>
        </div>

        <div class="msgs" id="msgs">
          ${msgs.length ? msgs.map(m => `<div class="m me">${esc(m)}</div>`).join("") : `
            <p class="meta chat-hint">Mulai percakapan dengan ${esc(activePeer.name)}. Berikan sapaan dan tanyakan materi belajarnya!</p>
          `}
        </div>

        <form class="send chat-send-form" data-form="msg">
          <input name="t" placeholder="Ketik pesan..." maxlength="500" required autocomplete="off" aria-label="Tulis pesan">
          <button class="btn sm">Kirim</button>
        </form>
        <p class="meta chat-footer-note">Pesan tersimpan lokal di browser ini untuk kelancaran sesi belajarmu.</p>
      </div>
    </div>
  `;
}

/* ===== 6E. FORUM TANYA JAWAB ===== */
function forum() {
  return `
    <div class="section-head">
      <h2>${icon("circle-help", 24)} Forum Tanya Jawab Publik</h2>
      <p class="lead">Punya kesulitan memahami materi pelajaran atau PR? Tanyakan ke seluruh komunitas StudyGeng!</p>
    </div>

    <form id="f-q" class="card forum-new-q">
      <h3 class="forum-ask-title">${icon("plus", 16)} Ajukan Pertanyaan Baru</h3>
      <div class="field">
        <label for="qt">Judul Pertanyaan (Singkat & Jelas)</label>
        <input id="qt" name="title" placeholder="Contoh: Bagaimana cara menghitung determinan matriks 3x3?" required maxlength="120">
      </div>
      <div class="field">
        <label for="qb">Detail Kendala & Catatan Tambahan</label>
        <textarea id="qb" name="body" placeholder="Tuliskan bagian mana yang membingungkan atau metode yang sudah kamu coba..." rows="3" maxlength="600"></textarea>
      </div>
      <button class="btn sm">Posting ke Forum</button>
    </form>

    <div class="forum-list">
      ${S.forum.map(q => `
        <article class="card forum-card">
          <div class="forum-q-head">
            <b>${esc(q.title)}</b>
            <span class="meta">Ditanyakan oleh <b>${esc(q.by)}</b></span>
          </div>
          <p class="forum-body">${esc(q.body)}</p>
          
          <div class="forum-answers-wrap">
            <span class="meta">${q.answers.length} Jawaban Komunitas:</span>
            ${q.answers.map(a => `
              <div class="ans">
                <b>${esc(a.by)}:</b> <span>${esc(a.t)}</span>
              </div>
            `).join("")}
          </div>

          <form class="send forum-reply-form" data-form="answer" data-id="${q.id}">
            <input name="t" placeholder="Bantu jawab pertanyaan ini..." required maxlength="400" aria-label="Jawaban">
            <button class="btn sm">Jawab</button>
          </form>
        </article>
      `).join("")}
    </div>
  `;
}

/* ===== 6F. PROFIL & PENGATURAN ===== */
const chk = (type, name, vals, sel = []) => vals.map(v => `
  <label class="chip">
    <input type="${type}" name="${name}" value="${esc(v)}" ${sel.includes(v) ? "checked" : ""}>
    <span>${esc(v)}</span>
  </label>
`).join("");

function profileForm(p, first) {
  return `
    <form id="f-profile" class="card profile-form" novalidate>
      <div class="field">
        <label for="pn">Nama Lengkap</label>
        <input id="pn" name="name" value="${esc(p.name)}" maxlength="80" required>
      </div>
      <div class="field">
        <label for="pi">Institusi Pendidikan (Sekolah / Kampus)</label>
        <input id="pi" name="inst" value="${esc(p.inst)}" maxlength="80" required>
      </div>
      <div class="field">
        <span class="lb">Jenjang Pendidikan</span>
        <div class="chips-row">${chk("radio", "level", LEVELS, [p.level])}</div>
      </div>
      <div class="field">
        <span class="lb">Minat Mata Pelajaran (Bisa pilih lebih dari satu)</span>
        <div class="chips-row">${chk("checkbox", "subj", SUBJECTS, p.subj)}</div>
      </div>
      <div class="field">
        <span class="lb">Bahasa Pengantar Diskusi</span>
        <div class="chips-row">${chk("checkbox", "lang", LANGS, p.lang)}</div>
      </div>
      <div class="field">
        <span class="lb">Preferensi Gaya Belajar</span>
        <div class="chips-row">${chk("radio", "mode", ["online", "offline"], [p.mode])}</div>
        <div class="chips-row">${chk("radio", "env", ["hening", "diskusi"], [p.env])}</div>
        <div class="chips-row">${chk("radio", "sense", ["visual", "auditori"], [p.sense])}</div>
      </div>
      <div class="field">
        <span class="lb">Jadwal Rutin yang Tersedia untuk Belajar</span>
        <div class="grid7">
          ${DAYS.map(d => `
            <div>
              <small>${d}</small>
              ${SLOTS.map(s => `
                <label class="chip">
                  <input type="checkbox" name="av" value="${d}-${s}" ${p.av.includes(d + "-" + s) ? "checked" : ""}>
                  <span>${s}</span>
                </label>
              `).join("")}
            </div>
          `).join("")}
        </div>
      </div>
      <small class="err" id="pf-err"></small>
      <button class="btn">${first ? "Simpan Profil & Mulai Belajar" : "Simpan Perubahan Profil"}</button>
    </form>
  `;
}

function profile() {
  return `
    <div class="section-head">
      <h2>${icon("user", 24)} Profil Pengguna & Verifikasi</h2>
      <p class="lead">
        ${verified 
          ? `<span class="vb">${icon("shield-check", 13)} Pelajar Terverifikasi</span> Email institusimu diakui sistem.`
          : "Gunakan email dengan akhiran .edu, .sch.id, atau .ac.id untuk mendapatkan badge Pelajar Terverifikasi resmi."}
        <br><span class="meta">Lokasi detailmu dirahasiakan, sistem hanya membagikan estimasi jarak untuk belajar tatap muka.</span>
      </p>
    </div>
    ${profileForm(me(), false)}
  `;
}

function onboard() {
  return `
    <div class="section-head">
      <h2>Selamat Datang di StudyGeng! 🎉</h2>
      <p class="lead">Lengkapi profil belajarmu terlebih dahulu agar sistem kami dapat mencocokkanmu dengan teman belajar yang paling sefrekuensi.</p>
    </div>
    ${profileForm({
      name: user.full_name || "Pelajar Baru",
      inst: "",
      level: "D3/S1",
      subj: ["Matematika", "Pemrograman"],
      lang: ["Indonesia"],
      mode: "online",
      env: "diskusi",
      sense: "visual",
      av: ["Sen-Malam", "Rab-Malam", "Sab-Pagi"]
    }, true)}
  `;
}

const views = { home, search, groups, chat, forum, profile };

function show(v) {
  cur = v;
  document.body.classList.toggle("onboarding", !me());
  $("#main").innerHTML = me() ? views[v]() : onboard();
  
  // Update atribut navigasi tabs
  $$("#tabs button").forEach(b => {
    b.setAttribute("aria-current", b.dataset.v === v ? "page" : "false");
  });

  if (me() && v === "search") results();
  if ($("#msgs")) $("#msgs").scrollTop = 1e9;
  scrollTo(0, 0);
}

/* ===== 7. MODAL DIALOG & AKSI USER ===== */
function ask(title, body, done) {
  const f = $("#dlg-form");
  f.innerHTML = `
    <h3>${title}</h3>
    ${body}
    <div class="acts">
      <button class="btn ghost sm" value="cancel" formnovalidate>Batal</button>
      <button class="btn sm" value="ok">Kirim</button>
    </div>
  `;
  f.onsubmit = e => {
    if (e.submitter?.value === "ok") done(new FormData(f));
  };
  $("#dlg").showModal();
}

const acts = {
  chat(id) {
    S.chats[id] ||= [];
    chatId = id;
    save();
    show("chat");
  },
  open(id) {
    chatId = id;
    show("chat");
  },
  review(id) {
    ask(
      `Ulas Pengalaman Belajar dengan ${esc(person(id).name)}`,
      `<div class="field"><label for="rs">Rating Bintang</label><select id="rs" name="stars">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${n} Bintang</option>`).join("")}</select></div>
       <div class="field"><label for="rt">Ulasan / Kesan</label><textarea id="rt" name="text" rows="3" maxlength="300" placeholder="Orangnya tepat waktu dan enak diajak diskusi..."></textarea></div>`,
      f => {
        S.reviews[id] = { stars: +f.get("stars"), text: f.get("text") };
        save();
        toast("Ulasan berhasil disimpan.");
        show(cur);
      }
    );
  },
  report(id) {
    ask(
      `Laporkan Akun ${esc(person(id).name)}`,
      `<div class="field"><label for="rw">Alasan Laporan</label><select id="rw" name="why">${opts(["Pelecehan / Kata Kasar", "Spam / Iklan", "Penipuan", "Tidak Hadir Sesi", "Lainnya"])}</select></div>
       <label class="chip"><input type="checkbox" name="block" checked><span>Blokir pengguna ini juga</span></label>`,
      f => {
        S.reports.push({ id: +id, why: f.get("why") });
        if (f.get("block")) S.blocked.push(+id);
        save();
        toast("Laporan telah dikirimkan ke tim moderasi.");
        show(cur);
      }
    );
  },
  join(id) {
    const g = S.groups.find(x => x.id === id);
    (g.pub ? g.members : g.pending).push(me().name);
    save();
    toast(g.pub ? "Berhasil bergabung ke Geng!" : "Permintaan bergabung telah dikirim.");
    show("groups");
  },
  approve(id, el) {
    const g = S.groups.find(x => x.id === id);
    g.pending = g.pending.filter(n => n !== el.dataset.n);
    g.members.push(el.dataset.n);
    save();
    toast(`${el.dataset.n} diterima menjadi anggota.`);
    show("groups");
  },
  "go-search"() { show("search"); },
  "go-geng"() { show("groups"); },
  "jump-geng"() { show("groups"); }
};

const forms = {
  "f-profile"(d) {
    const p = {
      name: d.get("name").trim(),
      inst: d.get("inst").trim(),
      level: d.get("level"),
      subj: d.getAll("subj"),
      lang: d.getAll("lang"),
      mode: d.get("mode"),
      env: d.get("env"),
      sense: d.get("sense"),
      av: d.getAll("av")
    };
    const err = !p.name ? "Nama lengkap wajib diisi."
      : !p.inst ? "Institusi pendidikan wajib diisi."
      : !p.subj.length ? "Pilih minimal satu mata pelajaran minat."
      : !p.lang.length ? "Pilih minimal satu bahasa pengantar."
      : !p.av.length ? "Pilih minimal satu slot jadwal luang." : "";
    if (err) return ($("#pf-err").textContent = err);

    const first = !S.profile;
    S.profile = p;
    save();
    updateUserBadge();
    toast("Profil berhasil disimpan.");
    show(first ? "home" : "profile");
  },
  "f-group"(d) {
    S.groups.unshift({
      id: "g" + Date.now(),
      name: d.get("name").trim(),
      subj: d.get("subj"),
      pub: d.get("pub") === "1",
      master: me().name,
      members: [me().name],
      pending: [],
      sessions: []
    });
    save();
    toast("Geng baru berhasil dibuat!");
    show("groups");
  },
  "f-q"(d) {
    S.forum.unshift({
      id: "q" + Date.now(),
      title: d.get("title").trim(),
      body: d.get("body").trim(),
      by: me().name,
      answers: []
    });
    save();
    toast("Pertanyaan berhasil diposting ke forum.");
    show("forum");
  },
  session(d, f) {
    const g = S.groups.find(x => x.id === f.dataset.id);
    g.sessions.push({ title: d.get("title").trim(), at: d.get("at") });
    g.sessions.sort((a, b) => a.at.localeCompare(b.at));
    save();
    toast("Sesi belajar berhasil ditambahkan.");
    show("groups");
  },
  msg(d) {
    S.chats[chatId].push(d.get("t").trim());
    save();
    show("chat");
  },
  answer(d, f) {
    S.forum.find(x => x.id === f.dataset.id).answers.push({
      by: me().name,
      t: d.get("t").trim()
    });
    save();
    toast("Jawaban terkirim.");
    show("forum");
  }
};

/* ===== 8. EVENT LISTENER GLOBAL ===== */

// Klik aksi di main view
$("#main").addEventListener("click", e => {
  // Aksi standar
  const b = e.target.closest("[data-act]");
  if (b) acts[b.dataset.act]?.(b.dataset.id, b);

  // Navigasi kalender mengambang
  const navBtn = e.target.closest("[data-cal-nav]");
  if (navBtn) {
    const nav = navBtn.dataset.calNav;
    if (nav === "prev") {
      calState.viewMonth--;
      if (calState.viewMonth < 0) {
        calState.viewMonth = 11;
        calState.viewYear--;
      }
    } else if (nav === "next") {
      calState.viewMonth++;
      if (calState.viewMonth > 11) {
        calState.viewMonth = 0;
        calState.viewYear++;
      }
    } else if (nav === "today") {
      const now = new Date();
      calState.viewYear = now.getFullYear();
      calState.viewMonth = now.getMonth();
      calState.selectedDateStr = todayIso;
    }
    // Re-render hanya bagian kalender
    const calWrap = $(".home-cal-wrapper");
    if (calWrap) calWrap.innerHTML = renderFloatingCalendarHtml();
    return;
  }

  // Klik tanggal pada kalender
  const dayBtn = e.target.closest("[data-cal-date]");
  if (dayBtn) {
    calState.selectedDateStr = dayBtn.dataset.calDate;
    const calWrap = $(".home-cal-wrapper");
    if (calWrap) calWrap.innerHTML = renderFloatingCalendarHtml();
    return;
  }
});

// Submit formulir
$("#main").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  forms[f.dataset.form || f.id]?.(new FormData(f), f);
});

// Input filter pencarian
$("#main").addEventListener("input", e => {
  if (e.target.closest("#filters")) results();
});

// Klik menu navbar / tabs (6 menu dari XLSX)
$("#tabs").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (b && me()) show(b.dataset.v);
});

// Tombol keluar
$("#logout").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  location.href = "/";
});

function updateUserBadge() {
  const name = me()?.name || user?.full_name || "Pelajar";
  const avatarEl = $("#u-avatar");
  const nameEl = $("#u-name");
  if (avatarEl) {
    const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    avatarEl.textContent = initials || "SG";
  }
  if (nameEl) nameEl.textContent = name;
}

/* ===== 9. BOOT & INIT ===== */
(async () => {
  // Render ikon tab navigasi lebih dulu
  renderTabIcons();

  // Aktifkan live timezone & jam digital otomatis
  initTimezoneClock();

  // Cek otentikasi
  const res = await fetch("/api/auth/me", { credentials: "include" }).catch(() => null);
  if (res?.ok) {
    user = (await res.json()).user;
  } else if (location.hash === "#demo" || !location.pathname.includes("dashboard")) {
    // Mode demo jika hash #demo
    user = { id: "demo", full_name: "Hosea Pratama", email: "hosea@kampus.ac.id" };
  } else {
    // Jika belum login, redirect ke halaman utama
    return location.replace("/");
  }

  verified = /\.(edu|sch\.id|ac\.id)$/i.test(user.email);
  $("#badge").innerHTML = verified ? `<span class="vb">${icon("shield-check", 13)} Terverifikasi</span>` : "";

  KEY = "sg_state_v1_" + user.id;
  S = JSON.parse(localStorage.getItem(KEY) || "null") || {
    profile: {
      name: user.full_name || "Hosea Pratama",
      inst: "Institut Teknologi",
      level: "D3/S1",
      subj: ["Matematika", "Pemrograman", "UI/UX"],
      lang: ["Indonesia", "English"],
      mode: "online",
      env: "diskusi",
      sense: "visual",
      av: ["Sen-Malam", "Rab-Malam", "Sab-Pagi"]
    },
    groups: SEED_GROUPS,
    chats: {
      1: ["Halo Rara! Salam kenal, aku lihat jadwal kita sama-sama luang di Senin malam.", "Bisa janjian belajar kalkulus bareng?"]
    },
    forum: SEED_FORUM,
    reviews: {},
    blocked: [],
    reports: []
  };

  updateUserBadge();
  show("home");
})();
