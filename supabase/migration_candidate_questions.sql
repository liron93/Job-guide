alter table jobs add column if not exists candidate_questions jsonb;
alter table jobs add column if not exists my_questions jsonb default '[]'::jsonb;
