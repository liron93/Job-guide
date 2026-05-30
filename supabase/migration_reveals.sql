-- Cache model answers on questions
alter table questions add column if not exists reveal jsonb;
alter table questions add column if not exists reveal_en jsonb;
