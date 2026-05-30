-- Fix migration: correct the broken migration_multiuser.sql
-- Run this in Supabase SQL Editor

-- 1. Fix the sequence if it's stuck (causes duplicate key on insert)
SELECT setval(
  pg_get_serial_sequence('user_profile', 'id'),
  COALESCE((SELECT MAX(id) FROM user_profile), 0) + 1,
  false
);

-- 2. Add columns if not already added
alter table user_profile
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists claude_api_key text;

-- 3. Create unique index on user_id (correct syntax — not "add constraint if not exists")
create unique index if not exists user_profile_user_id_unique on user_profile(user_id);

-- 4. Enable RLS on all user tables
alter table user_profile enable row level security;
alter table cvs enable row level security;
alter table answers enable row level security;
alter table jobs enable row level security;
alter table article_summaries enable row level security;

-- 5. Drop and recreate policies
drop policy if exists "users_own_profile" on user_profile;
drop policy if exists "users_own_cvs" on cvs;
drop policy if exists "users_own_answers" on answers;
drop policy if exists "users_own_jobs" on jobs;
drop policy if exists "users_own_articles" on article_summaries;

create policy "users_own_profile" on user_profile
  for all using (auth.uid() = user_id);

create policy "users_own_cvs" on cvs
  for all using (auth.uid() = user_id);

create policy "users_own_answers" on answers
  for all using (auth.uid() = user_id);

create policy "users_own_jobs" on jobs
  for all using (auth.uid() = user_id);

create policy "users_own_articles" on article_summaries
  for all using (auth.uid() = user_id);

-- 6. Questions: allow authenticated users to read
alter table questions enable row level security;

drop policy if exists "authed_read_questions" on questions;
create policy "authed_read_questions" on questions
  for select using (auth.role() = 'authenticated');
