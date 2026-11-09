-- ============================================================
-- StudyGeng: Skema Lengkap Database Supabase (Multi-User Real)
-- Buka Supabase > SQL Editor > New query > Paste semua > Run
-- ============================================================

-- 1. TABEL PENGGUNA (USERS)
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (char_length(full_name) between 2 and 80),
  email         text not null,
  password_hash text,                       -- kosong jika daftar pakai Google
  google_id     text unique,
  avatar_url    text,
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now()
);
create unique index if not exists users_email_lower_key on public.users (lower(email));

-- 2. VERIFIKASI EMAIL (OTP)
create table if not exists public.email_verifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  otp_hash   text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_email_verif_user on public.email_verifications (user_id);

-- 3. RESET PASSWORD (OTP)
create table if not exists public.password_resets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  otp_hash   text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_password_resets_user on public.password_resets (user_id);

-- 4. PROFIL LENGKAP PENGGUNA (USER PROFILES)
create table if not exists public.user_profiles (
  user_id      uuid primary key references public.users(id) on delete cascade,
  full_name    text not null,
  institution  text,
  level        text default 'D3/S1',
  subjects     text[] default '{}',
  languages    text[] default '{"Indonesia"}',
  mode         text default 'online',
  env          text default 'diskusi',
  sense        text default 'visual',
  availability text[] default '{}',
  updated_at   timestamptz not null default now()
);

-- 5. FORUM TANYA JAWAB PUBLIK (REAL)
create table if not exists public.forum_questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  author_name text not null,
  title       text not null check (char_length(title) between 3 and 150),
  body        text not null check (char_length(body) <= 1000),
  created_at  timestamptz not null default now()
);
create index if not exists idx_forum_questions_created on public.forum_questions (created_at desc);

create table if not exists public.forum_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.forum_questions(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  author_name text not null,
  content     text not null check (char_length(content) between 1 and 800),
  created_at  timestamptz not null default now()
);
create index if not exists idx_forum_answers_question on public.forum_answers (question_id);

-- 6. PESAN & CHAT LANGSUNG REAL ANTAR PENGGUNA
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.users(id) on delete cascade,
  receiver_id   uuid not null references public.users(id) on delete cascade,
  sender_name   text not null,
  receiver_name text not null,
  content       text not null check (char_length(content) between 1 and 1000),
  created_at    timestamptz not null default now()
);
create index if not exists idx_messages_pair on public.messages (sender_id, receiver_id, created_at);

-- 7. GENG BELAJAR (GROUPS)
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 80),
  subj        text not null,
  is_public   boolean not null default true,
  master_id   uuid references public.users(id) on delete set null,
  master_name text not null,
  members     text[] not null default '{}',
  pending     text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- 8. SESI JADWAL BELAJAR BERSAMA GENG (GROUP SESSIONS)
create table if not exists public.group_sessions (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 100),
  session_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_group_sessions_group on public.group_sessions (group_id);

-- KEAMANAN: Row Level Security (RLS) diaktifkan, backend memakai service_role key yang aman.
alter table public.users               enable row level security;
alter table public.email_verifications enable row level security;
alter table public.password_resets     enable row level security;
alter table public.user_profiles       enable row level security;
alter table public.forum_questions     enable row level security;
alter table public.forum_answers       enable row level security;
alter table public.messages            enable row level security;
alter table public.groups              enable row level security;
alter table public.group_sessions      enable row level security;