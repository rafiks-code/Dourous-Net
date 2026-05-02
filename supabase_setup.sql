-- Add missing columns to existing tables
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS filiere text;

ALTER TABLE homework ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS filiere text;

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS correction_url text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status text 
  DEFAULT 'en attente';

ALTER TABLE grades ADD COLUMN IF NOT EXISTS subject text;

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own notifications" ON notifications;
CREATE POLICY "Users insert own notifications"
  ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- STUDENTS POLICIES
DROP POLICY IF EXISTS "Profs read all students" ON students;
CREATE POLICY "Profs read all students"
  ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM professors WHERE id = auth.uid()));

-- LESSONS POLICIES
DROP POLICY IF EXISTS "Students read lessons" ON lessons;
CREATE POLICY "Students read lessons"
  ON lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profs manage lessons" ON lessons;
CREATE POLICY "Profs manage lessons"
  ON lessons FOR ALL
  USING (auth.uid() = prof_id)
  WITH CHECK (auth.uid() = prof_id);

-- HOMEWORK POLICIES
DROP POLICY IF EXISTS "Students read homework" ON homework;
CREATE POLICY "Students read homework"
  ON homework FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profs manage homework" ON homework;
CREATE POLICY "Profs manage homework"
  ON homework FOR ALL
  USING (auth.uid() = prof_id)
  WITH CHECK (auth.uid() = prof_id);

-- SUBMISSIONS POLICIES
DROP POLICY IF EXISTS "Students manage submissions" ON submissions;
CREATE POLICY "Students manage submissions"
  ON submissions FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Profs read submissions" ON submissions;
CREATE POLICY "Profs read submissions"
  ON submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM professors WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Profs update submissions" ON submissions;
CREATE POLICY "Profs update submissions"
  ON submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM professors WHERE id = auth.uid()));

-- GRADES POLICIES
DROP POLICY IF EXISTS "Profs manage grades" ON grades;
CREATE POLICY "Profs manage grades"
  ON grades FOR ALL
  USING (auth.uid() = prof_id)
  WITH CHECK (auth.uid() = prof_id);

DROP POLICY IF EXISTS "Students read own grades" ON grades;
CREATE POLICY "Students read own grades"
  ON grades FOR SELECT
  USING (auth.uid() = student_id);

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Users manage own messages" ON messages;
CREATE POLICY "Users manage own messages"
  ON messages FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id);

-- Allow professors to insert lessons
drop policy if exists "Professors can insert lessons" on lessons;
create policy "Professors can insert lessons"
on lessons for insert
with check (auth.uid() = prof_id);

-- Allow professors to insert homework  
drop policy if exists "Professors can insert homework" on homework;
create policy "Professors can insert homework"
on homework for insert
with check (auth.uid() = prof_id);

-- Allow professors to select their own lessons
drop policy if exists "Professors see own lessons" on lessons;
create policy "Professors see own lessons"
on lessons for select
using (auth.uid() = prof_id);

-- Allow professors to select their own homework
drop policy if exists "Professors see own homework" on homework;
create policy "Professors see own homework"
on homework for select
using (auth.uid() = prof_id);

-- Allow anyone to select lessons
drop policy if exists "Anyone can see lessons" on lessons;
create policy "Anyone can see lessons"
on lessons for select
using (auth.uid() is not null);

-- Allow anyone to select homework
drop policy if exists "Anyone can see homework" on homework;
create policy "Anyone can see homework"
on homework for select
using (auth.uid() is not null);
