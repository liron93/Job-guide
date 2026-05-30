-- Multi-user migration: add user_id to all user data tables + RLS

-- 1. user_profile: add user_id and claude_api_key
alter table user_profile
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists claude_api_key text;

alter table user_profile
  add constraint if not exists user_profile_user_id_unique unique (user_id);

-- 2. cvs: add user_id
alter table cvs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 3. answers: add user_id
alter table answers
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 4. jobs: add user_id
alter table jobs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 5. article_summaries: add user_id
alter table article_summaries
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Enable RLS
alter table user_profile enable row level security;
alter table cvs enable row level security;
alter table answers enable row level security;
alter table jobs enable row level security;
alter table article_summaries enable row level security;

-- Drop existing policies if any, then recreate
drop policy if exists "users_own_profile" on user_profile;
drop policy if exists "users_own_cvs" on cvs;
drop policy if exists "users_own_answers" on answers;
drop policy if exists "users_own_jobs" on jobs;
drop policy if exists "users_own_articles" on article_summaries;

-- RLS policies: users can only access their own rows
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

-- questions table: allow authenticated users to read (reveals are cached there)
-- No user_id needed — questions are shared across all users
alter table questions enable row level security;

drop policy if exists "authed_read_questions" on questions;
drop policy if exists "authed_update_questions" on questions;

create policy "authed_read_questions" on questions
  for select using (auth.role() = 'authenticated');

-- Service role bypasses RLS for reveal caching (scripts/admin ops)
