-- CVs uploaded by user (only one active at a time, but keep history)
create table cvs (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  extracted_text text not null,
  is_active boolean default false,
  uploaded_at timestamptz default now()
);

-- Questions seeded from JSON file
create table questions (
  id text primary key,
  category text not null,
  subcategory text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question text not null,
  frameworks text[],
  tags text[],
  hint text,
  created_at timestamptz default now()
);

-- Practice sessions / answers
create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id text references questions(id) on delete cascade,
  cv_id uuid references cvs(id) on delete set null,
  answer_text text not null,
  evaluation jsonb,
  overall_score integer,
  duration_seconds integer,
  created_at timestamptz default now()
);

create index idx_answers_question on answers(question_id);
create index idx_answers_created on answers(created_at desc);
create index idx_questions_category on questions(category);
create index idx_questions_difficulty on questions(difficulty);

-- Jobs tracker
create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role_title text not null,
  job_url text,
  job_description text not null,
  fit_score integer check (fit_score between 1 and 10),
  fit_summary text,
  fit_pros text[],
  fit_cons text[],
  should_apply boolean,
  company_summary text,
  product_summary text,
  tailored_cv text,
  cover_letter text,
  tailored_questions jsonb,
  status text not null default 'considering' check (status in ('considering', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  applied_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Article summaries
create table article_summaries (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  summary text,
  key_points text[],
  pm_relevance_score integer,
  pm_relevance_reason text,
  recommendation text check (recommendation in ('must_read', 'worth_reading', 'skip')),
  estimated_read_minutes integer,
  created_at timestamptz default now()
);
