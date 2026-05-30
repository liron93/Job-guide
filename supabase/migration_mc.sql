-- Add multiple-choice support to questions table
alter table questions
  add column if not exists question_type text not null default 'open',
  add column if not exists options jsonb,
  add column if not exists correct_answer text,
  add column if not exists explanation text;
