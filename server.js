"use strict";
/* =========================================================
   StudyGeng: server.js (Express + Supabase)
   Isi file:
   1. Config      2. Helper      3. OTP & email   4. Session & middleware
   5. Rute auth   6. Error handler & start
   ========================================================= */
require("dotenv").config();
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");
const { OAuth2Client } = require("google-auth-library");

/* ===== 1. CONFIG ===== */
const env = process.env;
const isProd = env.NODE_ENV === "production";
for (const key of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "OTP_SECRET"]) {
  if (!env[key]) throw new Error(`Isi ${key} di file .env (lihat .env.example)`);
}
const OTP_TTL_MIN = 10;      // kode berlaku 10 menit
const OTP_MAX_TRIES = 5;     // salah 5 kali, kode hangus
const OTP_COOLDOWN_SEC = 60; // jarak minimal kirim ulang
const SESSION_DAYS = 7;

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const app = express();
app.set("trust proxy", 1); // wajib di Vercel agar rate limit membaca IP asli
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://accounts.google.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      "font-src": ["https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https://accounts.google.com"],
      "frame-src": ["https://accounts.google.com"],
      "upgrade-insecure-requests": null, // supaya jalan di http://localhost
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // popup Google
}));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

/* ===== 2. HELPER ===== */
const ok = (res, data = {}, status = 200) => res.status(status).json({ ok: true, ...data });
const fail = (res, status, message) => res.status(status).json({ ok: false, message });
const wrap = fn => (req, res, next) => fn(req, res).catch(next); // tangkap error async
const q = async query => { const { data, error } = await query; if (error) throw error; return data; };

const normEmail = v => String(v || "").trim().toLowerCase();
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
const passwordOk = p => typeof p === "string" && p.length >= 8 && p.length <= 72; // batas bcrypt: 72
const publicUser = u => ({ id: u.id, full_name: u.full_name, email: u.email, avatar_url: u.avatar_url });
const findUser = email => q(supabase.from("users").select("*").eq("email", email).maybeSingle());

class Cooldown extends Error {}

const limiter = (minutes, max, message) => rateLimit({
  windowMs: minutes * 60_000, limit: max, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => fail(res, 429, message),
});
const loginLimiter = limiter(15, 10, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
const registerLimiter = limiter(60, 10, "Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.");
const otpLimiter = limiter(10, 15, "Terlalu banyak percobaan kode. Tunggu beberapa menit.");

/* ===== 3. OTP & EMAIL ===== */
const TABLE = { signup: "email_verifications", reset: "password_resets" };
const genOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
// OTP tidak pernah disimpan polos. HMAC + rahasia server membuat hash sulit ditebak walau DB bocor.
const hashOtp = (code, userId, purpose) =>
  crypto.createHmac("sha256", env.OTP_SECRET).update(`${purpose}:${userId}:${code}`).digest("hex");
const safeEqual = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

const mailer = env.SMTP_HOST ? nodemailer.createTransport({
  host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: Number(env.SMTP_PORT) === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
}) : null;

async function sendOtpEmail(to, code, purpose) {
  if (!mailer) {
    console.log(`\n[DEV OTP] Kode OTP (${purpose}) untuk ${to}: ${code}\n`); // mode belajar: lihat di terminal
    if (isProd) {
      throw new Error("Layanan email OTP belum dikonfigurasi di server. Silakan gunakan Login dengan Google.");
    }
    return;
  }
  const title = purpose === "signup" ? "Verifikasi Email StudyGeng" : "Reset Password StudyGeng";
  await mailer.sendMail({
    from: env.MAIL_FROM || env.SMTP_USER,
    to,
    subject: `${code} adalah kode verifikasi StudyGeng kamu`,
    text: `${title}\n\nKode verifikasi kamu: ${code}\n\nKode berlaku selama ${OTP_TTL_MIN} menit. Jangan bagikan kode ini kepada siapa pun.`,
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,sans-serif;max-width:500px;margin:20px auto;padding:24px;border:2px solid #14264A;border-radius:4px;background:#F7F7F2;color:#20232A">
        <h1 style="color:#14264A;font-size:24px;margin:0 0 6px">Study<b style="color:#245BDB">Geng</b></h1>
        <p style="color:#5F6673;font-size:13px;margin:0 0 20px">Find Your People. Learn Together.</p>
        <h2 style="color:#14264A;font-size:18px;margin:0 0 10px">${title}</h2>
        <p style="font-size:14px;line-height:1.5">Gunakan kode 6 digit di bawah ini untuk menyelesaikan pendaftaran akun StudyGeng kamu:</p>
        <div style="background:#fff;border:2px solid #245BDB;padding:16px;text-align:center;border-radius:4px;margin:20px 0;box-shadow:4px 4px 0 #14264A">
          <span style="font-size:36px;letter-spacing:10px;font-weight:700;color:#245BDB;display:inline-block">${code}</span>
        </div>
        <p style="color:#5F6673;font-size:12px;line-height:1.5;margin:16px 0 0">
          Kode ini berlaku selama <b>${OTP_TTL_MIN} menit</b>. Jangan pernah membagikan kode verifikasi ini kepada siapa pun.
        </p>
      </div>
    `,
  });
}

async function issueOtp(user, purpose) {
  const table = TABLE[purpose];
  const last = await q(supabase.from(table).select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle());
  if (last && Date.now() - new Date(last.created_at) < OTP_COOLDOWN_SEC * 1000) throw new Cooldown();
  const code = genOtp();
  await q(supabase.from(table).delete().eq("user_id", user.id)); // hanya satu kode aktif per user
  await q(supabase.from(table).insert({
    user_id: user.id, otp_hash: hashOtp(code, user.id, purpose),
    expires_at: new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString(),
  }));
  await sendOtpEmail(user.email, code, purpose);
}

// Mengembalikan { row } bila kode benar, atau { error } bila salah / kedaluwarsa.
async function checkOtp(user, purpose, code) {
  const table = TABLE[purpose];
  const row = await q(supabase.from(table).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle());
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return { error: "Kode kedaluwarsa. Minta kode baru." };
  if (row.attempts >= OTP_MAX_TRIES) return { error: "Terlalu banyak salah. Minta kode baru." };
  if (!safeEqual(row.otp_hash, hashOtp(code, user.id, purpose))) {
    await q(supabase.from(table).update({ attempts: row.attempts + 1 }).eq("id", row.id));
    return { error: "Kode salah. Cek email lalu coba lagi." };
  }
  return { row };
}

/* ===== 4. SESSION & MIDDLEWARE ===== */
const cookieOpts = maxAgeMs => ({ httpOnly: true, secure: isProd, sameSite: "lax", maxAge: maxAgeMs, path: "/" });
// Sesi = JWT di cookie httpOnly (JavaScript di browser tidak bisa membacanya). Stateless, cocok untuk Vercel.
function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie("sg_session", token, cookieOpts(SESSION_DAYS * 86_400_000));
}
async function requireAuth(req, res, next) {
  try {
    const { sub } = jwt.verify(req.cookies.sg_session || "", env.JWT_SECRET);
    const user = await q(supabase.from("users").select("*").eq("id", sub).maybeSingle());
    if (!user || !user.is_verified) return fail(res, 401, "Sesi tidak valid. Silakan masuk lagi.");
    req.user = user;
    next();
  } catch {
    fail(res, 401, "Silakan masuk dulu.");
  }
}

/* ===== 5. RUTE AUTH ===== */
const auth = express.Router();

auth.post("/register", registerLimiter, wrap(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normEmail(req.body.email);
  const { password } = req.body;
  if (name.length < 2 || name.length > 80) return fail(res, 400, "Nama harus 2 sampai 80 karakter.");
  if (!isEmail(email)) return fail(res, 400, "Format email belum benar.");
  if (!passwordOk(password)) return fail(res, 400, "Password harus 8 sampai 72 karakter.");

  const existing = await findUser(email);
  if (existing?.is_verified) return fail(res, 409, "Email ini sudah terdaftar. Silakan masuk.");

  const password_hash = await bcrypt.hash(password, 12);
  const user = existing // email belum terverifikasi: perbarui data & kirim kode baru
    ? await q(supabase.from("users").update({ full_name: name, password_hash }).eq("id", existing.id).select().single())
    : await q(supabase.from("users").insert({ full_name: name, email, password_hash }).select().single());

  try { await issueOtp(user, "signup"); }
  catch (e) { if (e instanceof Cooldown) return fail(res, 429, "Tunggu sebentar sebelum minta kode baru."); throw e; }
  ok(res, { message: "Kode verifikasi dikirim.", email }, 201);
}));

auth.post("/verify-otp", otpLimiter, wrap(async (req, res) => {
  const email = normEmail(req.body.email), code = String(req.body.code || ""), purpose = req.body.purpose;
  if (!isEmail(email) || !/^\d{6}$/.test(code) || !TABLE[purpose]) return fail(res, 400, "Data tidak lengkap.");

  const user = await findUser(email);
  if (!user || (purpose === "signup" && user.is_verified)) return fail(res, 400, "Kode salah atau sudah kedaluwarsa.");
  const result = await checkOtp(user, purpose, code);
  if (result.error) return fail(res, 400, result.error);

  if (purpose === "signup") {
    await q(supabase.from("users").update({ is_verified: true }).eq("id", user.id));
    await q(supabase.from("email_verifications").delete().eq("user_id", user.id));
    setSession(res, user);
    return ok(res, { message: "Verifikasi berhasil.", user: publicUser(user) });
  }
  // purpose "reset": beri tiket singkat (10 menit) yang hanya boleh dipakai untuk ganti password
  const ticket = jwt.sign({ sub: user.id, rid: result.row.id, typ: "reset" }, env.JWT_SECRET, { expiresIn: "10m" });
  res.cookie("sg_reset", ticket, cookieOpts(10 * 60_000));
  ok(res, { message: "Kode benar. Silakan buat password baru." });
}));

auth.post("/resend-otp", otpLimiter, wrap(async (req, res) => {
  const email = normEmail(req.body.email), purpose = req.body.purpose;
  if (!isEmail(email) || !TABLE[purpose]) return fail(res, 400, "Data tidak lengkap.");
  const user = await findUser(email);
  const eligible = user && (purpose === "signup" ? !user.is_verified : user.is_verified);
  if (eligible) {
    try { await issueOtp(user, purpose); }
    catch (e) { if (e instanceof Cooldown) return fail(res, 429, "Tunggu sebentar sebelum minta kode baru."); throw e; }
  }
  ok(res, { message: "Jika email terdaftar, kode baru sudah dikirim." }); // jawaban sama agar email tidak bisa ditebak
}));

auth.post("/login", loginLimiter, wrap(async (req, res) => {
  const email = normEmail(req.body.email), { password } = req.body;
  if (!isEmail(email) || typeof password !== "string" || !password) return fail(res, 400, "Email dan password wajib diisi.");

  const user = await findUser(email);
  // Selalu jalankan bcrypt supaya waktu respons tidak membocorkan apakah email terdaftar
  const hash = user?.password_hash || (auth.dummyHash ??= await bcrypt.hash("dummy-password", 12));
  const valid = (await bcrypt.compare(password, hash)) && !!user?.password_hash;
  if (!valid) return fail(res, 401, "Email atau password salah.");
  if (!user.is_verified) return fail(res, 403, "Email belum diverifikasi. Daftar lagi dengan email ini untuk dapat kode baru.");

  setSession(res, user);
  ok(res, { user: publicUser(user) });
}));

auth.get("/config", (req, res) => ok(res, { googleClientId: env.GOOGLE_CLIENT_ID || null }));

auth.post("/google", loginLimiter, wrap(async (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) return fail(res, 503, "Login Google belum dikonfigurasi di server.");
  const { credential } = req.body; // ID token dari Google Identity Services di frontend
  if (typeof credential !== "string" || !credential) return fail(res, 400, "Token Google tidak ada.");

  let profile;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    profile = ticket.getPayload();
  } catch { return fail(res, 401, "Token Google tidak valid."); }
  if (!profile?.email || !profile.email_verified) return fail(res, 403, "Email Google belum terverifikasi.");

  const email = normEmail(profile.email);
  let user = await findUser(email);
  if (!user) {
    user = await q(supabase.from("users").insert({
      full_name: profile.name || email.split("@")[0], email, avatar_url: profile.picture || null,
      google_id: profile.sub, is_verified: true,
    }).select().single());
  } else {
    user = await q(supabase.from("users").update({
      google_id: user.google_id || profile.sub, avatar_url: user.avatar_url || profile.picture || null, is_verified: true,
      // akun password yang belum diverifikasi bisa dibuat orang lain: buang passwordnya
      ...(user.is_verified ? {} : { password_hash: null }),
    }).eq("id", user.id).select().single());
  }
  setSession(res, user);
  ok(res, { user: publicUser(user) });
}));

auth.post("/forgot-password", otpLimiter, wrap(async (req, res) => {
  const email = normEmail(req.body.email);
  if (!isEmail(email)) return fail(res, 400, "Format email belum benar.");
  const user = await findUser(email);
  if (user?.is_verified) {
    try { await issueOtp(user, "reset"); }
    catch (e) { if (!(e instanceof Cooldown)) throw e; }
  }
  ok(res, { message: "Jika email terdaftar, kode pemulihan sudah dikirim." }); // jawaban selalu sama
}));

auth.post("/reset-password", otpLimiter, wrap(async (req, res) => {
  let ticket;
  try { ticket = jwt.verify(req.cookies.sg_reset || "", env.JWT_SECRET); if (ticket.typ !== "reset") throw 0; }
  catch { return fail(res, 401, "Sesi pemulihan habis. Ulangi dari awal."); }
  if (!passwordOk(req.body.password)) return fail(res, 400, "Password harus 8 sampai 72 karakter.");

  const row = await q(supabase.from("password_resets").select("*").eq("id", ticket.rid).eq("user_id", ticket.sub).maybeSingle());
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return fail(res, 400, "Kode pemulihan sudah tidak berlaku.");

  await q(supabase.from("users").update({ password_hash: await bcrypt.hash(req.body.password, 12) }).eq("id", ticket.sub));
  await q(supabase.from("password_resets").update({ used_at: new Date().toISOString() }).eq("id", row.id));
  res.clearCookie("sg_reset", { path: "/" });
  ok(res, { message: "Password berhasil diganti." });
}));

auth.post("/logout", (req, res) => { res.clearCookie("sg_session", { path: "/" }); ok(res, { message: "Berhasil keluar." }); });
auth.get("/me", requireAuth, (req, res) => ok(res, { user: publicUser(req.user) }));

app.use("/api/auth", auth);
app.use("/api", (req, res) => fail(res, 404, "Endpoint tidak ditemukan."));
app.use(express.static(path.join(__dirname, "public")));

/* ===== 6. ERROR HANDLER & START ===== */
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return fail(res, 400, "Format JSON tidak valid.");
  console.error(err); // detail error hanya di log server, tidak dikirim ke pengguna
  fail(res, 500, "Terjadi kesalahan di server. Coba lagi sebentar.");
});

if (require.main === module) {
  const port = env.PORT || 3000;
  app.listen(port, () => console.log(`StudyGeng jalan di http://localhost:${port}`));
}
module.exports = app; // dipakai Vercel
