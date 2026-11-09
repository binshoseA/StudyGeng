"use strict";
/* =========================================================
   StudyGeng: script.js
   Isi file (cari tanda ===== untuk lompat ke bagian):
   1. Config & helper   2. API (mock/asli)   3. UI helper
   4. Validasi          5. Pintu & kunci     6. OTP
   7. Alur form         8. Init
   ========================================================= */

/* ===== 1. CONFIG & HELPER ===== */
const MOCK = false; // false = backend Express asli. true = server palsu untuk latihan tanpa backend.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = ms => sleep(reduced ? 50 : ms); // tunggu animasi (singkat bila reduced-motion)
const state = { otpMode: "signup", email: "" };

/* ===== 2. API ===== */
// Server palsu untuk belajar. Respons meniru backend sungguhan: { ok, message }
const mock = {
  "/api/auth/login": b => b.password === "geng1234" ? { ok: true } : { ok: false, message: "Email atau password salah." },
  "/api/auth/register": () => ({ ok: true }),
  "/api/auth/verify-otp": b => b.code === "123456" ? { ok: true } : { ok: false, message: "Kode salah. Cek email lalu coba lagi." },
  "/api/auth/resend-otp": () => ({ ok: true }),
  "/api/auth/google": () => ({ ok: true }),
  "/api/auth/forgot-password": () => ({ ok: true }),
  "/api/auth/reset-password": () => ({ ok: true }),
};

async function call(path, body) {
  if (MOCK) { await sleep(900); return mock[path](body); }
  try {
    const res = await fetch(path, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, ...data };
  } catch {
    return { ok: false, message: "Tidak bisa terhubung ke server." };
  }
}

/* ===== 3. UI HELPER ===== */
const stage = $("#stage");
const copy = { // [label kecil, headline]
  login:  ["masuk", "<b>Unlock</b> your space."],
  signup: ["daftar", "<b>Join</b> the geng."],
  otp:    ["verifikasi", "<b>Six</b> become one."],
  forgot: ["pemulihan", "<b>Lost</b> the key?"],
  reset:  ["password baru", "<b>Cut</b> a new key."],
};

function switchView(name) {
  stage.dataset.view = name;
  $$("[data-panel]").forEach(p => (p.hidden = p.dataset.panel !== name));
  $("#label").textContent = copy[name][0];
  $("#headline").innerHTML = copy[name][1];
  $(`[data-panel="${name}"] input`)?.focus({ preventScroll: true });
}

let toastTimer;
function toast(msg, type = "info") {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 3500);
}

function busy(btn, on) { btn.disabled = on; btn.classList.toggle("loading", on); }

/* ===== 4. VALIDASI ===== */
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
function strength(p) { // skor 0 sampai 4
  return (p.length >= 8) + (/[a-z]/.test(p) && /[A-Z]/.test(p)) + /\d/.test(p) + /[^A-Za-z0-9]/.test(p);
}
// Tampilkan / hapus pesan error di bawah field. Mengembalikan true bila valid.
function check(input, message) {
  const field = input.closest(".field");
  field.classList.toggle("invalid", !!message);
  $(".err", field).textContent = message || "";
  return !message;
}
const allValid = results => results.every(Boolean); // semua dicek dulu, supaya semua error tampil

/* ===== 5. PINTU & KUNCI ===== */
const scene = $("#scene");
const door = {
  state(s) { scene.classList.remove("typing", "loading"); if (s) scene.classList.add(s); },
  async unlock() { door.state(); scene.classList.add("unlocked"); await wait(3200); }, // urutan diatur CSS
  async fail() { door.state(); scene.classList.add("error"); await sleep(550); scene.classList.remove("error"); },
  reset() { scene.classList.remove("unlocked", "error", "loading", "typing"); },
};

/* ===== 6. OTP ===== */
const otp = $("#otp");
const boxes = $$("input", otp);
let verifying = false, timerId;

boxes.forEach((box, i) => {
  box.style.setProperty("--i", i); // dipakai CSS untuk jeda & jarak tiap kotak
  box.addEventListener("input", () => {
    box.value = box.value.replace(/\D/g, "").slice(-1);
    if (box.value && i < 5) boxes[i + 1].focus();
    if (boxes.every(b => b.value)) verifyOtp();
  });
  box.addEventListener("keydown", e => {
    if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
  });
  box.addEventListener("paste", e => {
    e.preventDefault();
    const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    [...digits].forEach((c, k) => (boxes[k].value = c));
    boxes[Math.min(digits.length, 5)].focus();
    if (digits.length === 6) verifyOtp();
  });
});

function startTimer(seconds = 60) {
  const btn = $("#resend");
  let left = seconds;
  clearInterval(timerId);
  const tick = () => {
    btn.disabled = left > 0;
    btn.textContent = left > 0 ? `Kirim ulang dalam ${left} detik` : "Kirim ulang kode";
    if (left-- <= 0) clearInterval(timerId);
  };
  tick();
  timerId = setInterval(tick, 1000);
}

function resetOtp() {
  otp.className = "otp";
  boxes.forEach(b => (b.value = ""));
  $("#otp-msg").hidden = true;
}

// Enam kotak berputar 3D, bergerak ke tengah, lalu melebur jadi satu lingkaran + centang.
async function mergeAnimation() {
  otp.classList.add("spin");   await wait(1300);
  otp.classList.remove("spin");
  otp.classList.add("gather"); await wait(750);
  otp.classList.add("fused");  await wait(900);
}

async function verifyOtp() {
  if (verifying) return;
  verifying = true;
  otp.classList.add("loading");
  const code = boxes.map(b => b.value).join("");
  const res = await call("/api/auth/verify-otp", { email: state.email, code, purpose: state.otpMode });
  otp.classList.remove("loading");

  if (res.ok) {                       // animasi sukses HANYA setelah server bilang benar
    await mergeAnimation();
    if (state.otpMode === "signup") {
      $("#otp-msg").hidden = false;
      await wait(2000);
      location.href = "/dashboard.html"; // server sudah membuat sesi saat OTP benar
    } else {
      resetOtp(); switchView("reset");
    }
  } else {                            // salah: kotak bergetar, isi dikosongkan
    otp.classList.add("shake");
    toast(res.message || "Kode salah.", "error");
    await sleep(500);
    otp.classList.remove("shake");
    boxes.forEach(b => (b.value = ""));
    boxes[0].focus();
  }
  verifying = false;
}

/* ===== 7. ALUR FORM ===== */
// Login
$("#form-login").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = $(".btn", f);
  if (!allValid([
    check(f.email, isEmail(f.email.value.trim()) ? "" : "Format email belum benar."),
    check(f.password, f.password.value ? "" : "Password wajib diisi."),
  ])) return;

  busy(btn, true); door.state("loading");
  const res = await call("/api/auth/login", { email: f.email.value.trim(), password: f.password.value });
  if (res.ok) {
    await door.unlock();
    toast("Selamat datang di StudyGeng!", "success");
    await wait(900);
    location.href = "/dashboard.html";
    return;
  } else {
    await door.fail();
    toast(res.message || "Login gagal.", "error");
  }
  busy(btn, false);
});
// Kunci condong ke pintu saat form difokus
$("#form-login").addEventListener("focusin", () => door.state("typing"));
$("#form-login").addEventListener("focusout", () => door.state());

// Signup
$("#form-signup").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = $(".btn", f);
  if (!allValid([
    check(f.name, f.name.value.trim().length >= 2 ? "" : "Nama minimal 2 huruf."),
    check(f.institution, f.institution.value.trim().length >= 2 ? "" : "Asal universitas/sekolah wajib diisi."),
    check(f.email, isEmail(f.email.value.trim()) ? "" : "Format email belum benar."),
    check(f.password, f.password.value.length >= 8 ? "" : "Minimal 8 karakter."),
    check(f.password2, f.password2.value === f.password.value ? "" : "Password tidak sama."),
    check(f.terms, f.terms.checked ? "" : "Centang dulu untuk lanjut."),
  ])) return;

  busy(btn, true);
  const res = await call("/api/auth/register", {
    name: f.name.value.trim(),
    institution: f.institution.value.trim(),
    email: f.email.value.trim(),
    password: f.password.value
  });
  busy(btn, false);
  if (!res.ok) return toast(res.message || "Pendaftaran gagal.", "error");

  state.email = f.email.value.trim(); state.otpMode = "signup";
  $("#otp-email").textContent = state.email;
  resetOtp(); switchView("otp"); startTimer();
});

// Lupa password, langkah 1: kirim OTP
$("#form-forgot").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = $(".btn", f);
  if (!check(f.email, isEmail(f.email.value.trim()) ? "" : "Format email belum benar.")) return;
  busy(btn, true);
  const res = await call("/api/auth/forgot-password", { email: f.email.value.trim() });
  busy(btn, false);
  if (!res.ok) return toast(res.message || "Gagal mengirim kode.", "error");

  state.email = f.email.value.trim(); state.otpMode = "reset";
  $("#otp-email").textContent = state.email;
  resetOtp(); switchView("otp"); startTimer();
});

// Lupa password, langkah 3: password baru
$("#form-reset").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = $(".btn", f);
  if (!allValid([
    check(f.password, f.password.value.length >= 8 ? "" : "Minimal 8 karakter."),
    check(f.password2, f.password2.value === f.password.value ? "" : "Password tidak sama."),
  ])) return;
  busy(btn, true);
  const res = await call("/api/auth/reset-password", { email: state.email, password: f.password.value });
  busy(btn, false);
  if (!res.ok) return toast(res.message || "Gagal menyimpan password.", "error");

  f.reset(); switchView("login");
  toast("Password baru tersimpan. Pintunya terbuka lagi.", "success");
  scene.classList.add("unlocked"); await wait(3200); door.reset(); // animasi pemulihan
});

// Kirim ulang OTP
$("#resend").addEventListener("click", async () => {
  const res = await call("/api/auth/resend-otp", { email: state.email, purpose: state.otpMode });
  toast(res.ok ? "Kode baru sudah dikirim." : (res.message || "Gagal mengirim ulang."), res.ok ? "success" : "error");
  if (res.ok) startTimer();
});
$("#form-otp").addEventListener("submit", e => { e.preventDefault(); if (boxes.every(b => b.value)) verifyOtp(); else toast("Isi keenam digit dulu.", "error"); });

// Google Auth via Google Identity Services (GSI)
let googleClientId = null;

async function handleGoogleCredential(response) {
  if (!response?.credential) return;
  door.load();
  const res = await call("/api/auth/google", { credential: response.credential });
  if (!res.ok) {
    door.error();
    return toast(res.message || "Login Google gagal.", "error");
  }
  switchView("login");
  await door.unlock();
  toast("Masuk dengan Google berhasil!", "success");
  await wait(900);
  location.href = "/dashboard.html";
}

async function initGoogleAuth() {
  if (MOCK) return;
  try {
    const res = await fetch("/api/auth/config").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      googleClientId = data.googleClientId;
    }
  } catch {}

  const setupGsi = () => {
    if (window.google?.accounts?.id && googleClientId) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render tombol resmi Google yang langsung membuka pop-up akun tanpa terkena cooldown One Tap
      const btnOpts = {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        logo_alignment: "left",
        width: 320
      };

      const loginSlot = $("#g-login-slot");
      if (loginSlot) {
        google.accounts.id.renderButton(loginSlot, { ...btnOpts, text: "continue_with" });
      }
      const signupSlot = $("#g-signup-slot");
      if (signupSlot) {
        google.accounts.id.renderButton(signupSlot, { ...btnOpts, text: "signup_with" });
      }

      // Coba tampilkan One Tap di pojok jika tersedia
      google.accounts.id.prompt(notification => {
        if (notification.isNotDisplayed()) {
          console.log("[Google Auth] One Tap note:", notification.getNotDisplayedReason());
        }
      });
    }
  };

  if (window.google?.accounts?.id) setupGsi();
  else window.addEventListener("load", () => setTimeout(setupGsi, 300));
}

initGoogleAuth();

$$("[data-google]").forEach(btn => btn.addEventListener("click", async () => {
  if (MOCK) {
    busy(btn, true);
    await sleep(600);
    busy(btn, false);
    switchView("login");
    await door.unlock();
    toast("Mode Mock: Masuk dengan Google berhasil!", "success");
    await wait(900);
    location.href = "/dashboard.html#demo";
    return;
  }

  if (!googleClientId) {
    return toast("GOOGLE_CLIENT_ID belum diisi di file .env. Lihat panduan terminal/setup.", "error");
  }

  if (window.google?.accounts?.id) {
    google.accounts.id.prompt(notification => {
      const reason = notification.getNotDisplayedReason?.() || "";
      console.warn("[Google Auth Reason]:", reason, notification);
      if (reason === "unregistered_origin") {
        toast("Origin belum terdaftar di Google Cloud. Pastikan http://localhost:3000 ada di Authorized JavaScript origins.", "error");
      } else if (reason === "suppressed_by_user") {
        toast("Pop-up Google sedang cooldown karena baru saja ditutup. Gunakan tombol resmi Google di atas.", "error");
      } else {
        toast("Pop-up Google tertutup atau diblokir. Pastikan buka di http://localhost:3000 dan izinkan pop-up.", "error");
      }
    });
  } else {
    toast("Google Identity Services sedang dimuat. Coba beberapa detik lagi.", "error");
  }
}));

/* ===== 8. INIT: tombol navigasi, lihat password, meter kekuatan ===== */
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) { door.reset(); switchView(go.dataset.go); }

  const eye = e.target.closest(".eye");
  if (eye) {
    const input = $("input", eye.parentElement);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    eye.textContent = show ? "Sembunyi" : "Lihat";
  }
});
$$("[data-meter]").forEach(input => input.addEventListener("input", () => {
  $(".meter span", input.closest(".field")).style.setProperty("--s", strength(input.value));
}));

switchView("login");
