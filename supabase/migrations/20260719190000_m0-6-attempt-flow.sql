-- Migration: M0.6 — Quiz attempt flow: scoring_mode, question_order, RLS, difficulty fix.

-- ============================================================
-- 1. Añadir scoring_mode a quizzes
-- ============================================================
ALTER TABLE quizzes
  ADD COLUMN scoring_mode TEXT NOT NULL DEFAULT 'all-or-nothing'
  CHECK (scoring_mode IN ('all-or-nothing', 'partial'));

-- ============================================================
-- 2. Corregir CHECK de difficulty (1-5 -> 1-3)
-- ============================================================
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions
  ADD CONSTRAINT questions_difficulty_check
  CHECK (difficulty BETWEEN 1 AND 3);

-- ============================================================
-- 3. Añadir question_order a attempts (para persistir shuffle)
-- ============================================================
ALTER TABLE attempts
  ADD COLUMN question_order UUID[];

-- ============================================================
-- 4. RLS: permitir a cualquiera insertar attempts en quizzes públicos
-- ============================================================
CREATE POLICY "anyone can attempt public quizzes"
  ON attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = attempts.quiz_id
      AND (quizzes.author_id = auth.uid() OR quizzes.visibility = 'public')
    )
  );

-- ============================================================
-- 5. RLS: permitir SELECT de questions durante un intento activo
-- ============================================================
CREATE POLICY "attempters can view questions"
  ON questions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM attempts
      WHERE attempts.quiz_id = questions.quiz_id
      AND attempts.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.visibility = 'public'
    )
  );
