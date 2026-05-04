-- =============================================================
-- FINAL MODULE STANDARDIZATION — RUN THIS IN SUPABASE
-- =============================================================

-- 1. Professors table
ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS module text;
UPDATE public.professors SET module = subject WHERE module IS NULL;

-- 2. Lessons (courses) table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS module text;
UPDATE public.lessons SET module = subject WHERE module IS NULL;

-- 3. Homework (devoirs) table
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS module text;
UPDATE public.homework SET module = subject WHERE module IS NULL;

-- 4. Grades table
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS module text;
-- No backfill needed for grades as it's a new system
