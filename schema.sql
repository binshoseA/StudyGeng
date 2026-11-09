-- Jalankan di Supabase: SQL Editor > New query > paste > Run

create table public.users (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (char_length(full_name) between 2 and 80),
  email         text not null,
  password_hash text,                       -- kosong untuk akun yang hanya pakai Google
  google_id     text unique,
  avatar_url    text,
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now()
);
create unique index users_email_lower_key on public.users (lower(email));

create table public.email_verifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  otp_hash   text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.email_verifications (user_id);

create table public.password_resets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  otp_hash   text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on public.password_resets (user_id);

-- Kunci tabel dari akses publik. Backend memakai service role key, yang tetap bisa akses.
alter table public.users               enable row level security;
alter table public.email_verifications enable row level security;
alter table public.password_resets     enable row level security;