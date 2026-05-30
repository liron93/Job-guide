-- Add missing columns to article_summaries
alter table article_summaries
  add column if not exists article_published_at date,
  add column if not exists why_worth_reading text[];
