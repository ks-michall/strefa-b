-- Apply in the Supabase SQL Editor before deploying the first-login feature.
-- This table holds ONLY scrypt hashes, never clear-text passwords.
create table if not exists public.student_passwords (
  student_name text primary key,
  password_hash text not null
    check (password_hash ~ '^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$'),
  changed_at timestamptz not null default now()
);

alter table public.student_passwords enable row level security;
-- The browser's public anon key and ordinary authenticated clients cannot
-- read or modify student password hashes, even if other policies are added.
revoke all on table public.student_passwords from anon, authenticated;
-- No RLS policies. Only server-side service_role can access these rows.
