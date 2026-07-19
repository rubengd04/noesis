-- Migration: M0.3 — Modelo de datos base. 8 tablas, índices, RLS policies, trigger profile.

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL CHECK (language IN ('es', 'en')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  max_attempts INT,
  time_limit_minutes INT,
  pass_percentage INT NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('true-false', 'multiple-choice', 'matching', 'ordering')),
  content TEXT NOT NULL,
  explanation TEXT,
  hint TEXT,
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  points INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL,
  UNIQUE(question_id, order_index)
);

CREATE TABLE question_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  left_text TEXT NOT NULL,
  right_text TEXT NOT NULL,
  order_index INT NOT NULL,
  UNIQUE(question_id, order_index)
);

CREATE TABLE question_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  correct_order INT NOT NULL,
  order_index INT NOT NULL,
  UNIQUE(question_id, correct_order),
  UNIQUE(question_id, order_index)
);

CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned')),
  score INT,
  max_score INT,
  time_seconds INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  answer JSONB NOT NULL,
  is_correct BOOLEAN,
  points_earned INT NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_quizzes_author_id ON quizzes(author_id);
CREATE INDEX idx_quizzes_visibility ON quizzes(visibility) WHERE visibility = 'public';
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_question_pairs_question_id ON question_pairs(question_id);
CREATE INDEX idx_question_items_question_id ON question_items(question_id);
CREATE INDEX idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_answers_attempt_id ON answers(attempt_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY IF NOT EXISTS "users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles are publicly viewable"
  ON profiles FOR SELECT
  USING (true);

-- Quizzes
CREATE POLICY IF NOT EXISTS "owners can view own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "anyone can view public quizzes"
  ON quizzes FOR SELECT
  USING (visibility = 'public');

CREATE POLICY IF NOT EXISTS "owners can insert quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "owners can update own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "owners can delete own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = author_id);

-- Questions
CREATE POLICY IF NOT EXISTS "viewable if quiz is accessible"
  ON questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = questions.quiz_id
    AND (quizzes.author_id = auth.uid() OR quizzes.visibility = 'public')
  ));

CREATE POLICY IF NOT EXISTS "owners can insert questions"
  ON questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can update questions"
  ON questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can delete questions"
  ON questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.author_id = auth.uid()
  ));

-- Question options
CREATE POLICY IF NOT EXISTS "viewable if quiz is accessible"
  ON question_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_options.question_id
    AND (quizzes.author_id = auth.uid() OR quizzes.visibility = 'public')
  ));

CREATE POLICY IF NOT EXISTS "owners can insert options"
  ON question_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_options.question_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can update options"
  ON question_options FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_options.question_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can delete options"
  ON question_options FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_options.question_id
    AND quizzes.author_id = auth.uid()
  ));

-- Question pairs
CREATE POLICY IF NOT EXISTS "viewable if quiz is accessible"
  ON question_pairs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_pairs.question_id
    AND (quizzes.author_id = auth.uid() OR quizzes.visibility = 'public')
  ));

CREATE POLICY IF NOT EXISTS "owners can insert pairs"
  ON question_pairs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_pairs.question_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can update pairs"
  ON question_pairs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_pairs.question_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can delete pairs"
  ON question_pairs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_pairs.question_id
    AND quizzes.author_id = auth.uid()
  ));

-- Question items
CREATE POLICY IF NOT EXISTS "viewable if quiz is accessible"
  ON question_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_items.question_id
    AND (quizzes.author_id = auth.uid() OR quizzes.visibility = 'public')
  ));

CREATE POLICY IF NOT EXISTS "owners can insert items"
  ON question_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_items.question_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can update items"
  ON question_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_items.question_id
    AND quizzes.author_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "owners can delete items"
  ON question_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN quizzes ON quizzes.id = questions.quiz_id
    WHERE questions.id = question_items.question_id
    AND quizzes.author_id = auth.uid()
  ));

-- Attempts
CREATE POLICY IF NOT EXISTS "users can view own attempts"
  ON attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users can insert own attempts"
  ON attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users can update own attempts"
  ON attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Answers
CREATE POLICY IF NOT EXISTS "users can view own answers"
  ON answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM attempts
    WHERE attempts.id = answers.attempt_id
    AND attempts.user_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "users can insert own answers"
  ON answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM attempts
    WHERE attempts.id = answers.attempt_id
    AND attempts.user_id = auth.uid()
  ));

-- ============================================================
-- TRIGGER: Auto-crear profile al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'es')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Backfill profiles for existing users (si los hay)
INSERT INTO profiles (id, display_name, preferred_language)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)),
  'es'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
