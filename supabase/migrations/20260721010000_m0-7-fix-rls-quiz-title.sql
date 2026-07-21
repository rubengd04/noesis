-- Migration: M0.7 — Fix RLS causing "Quiz eliminado" in dashboard
--
-- Root cause: The "users can insert own attempts" policy (M0.3) only checks
-- auth.uid() = user_id, which is always true for self-insert. Combined with
-- "anyone can attempt public quizzes" (OR logic), it bypasses the quiz
-- accessibility check — users can attempt private quizzes they don't own.
-- Later, the JOIN from attempts → quizzes fails due to RLS on quizzes,
-- making quiz_title = NULL → "Quiz eliminado" in the UI.
--
-- Fix:
--   1. Drop the overly permissive "users can insert own attempts" policy.
--      The M0.6 "anyone can attempt public quizzes" policy already covers
--      the correct logic (owner OR public).
--   2. Add a SELECT policy on quizzes so users who attempted a quiz can
--      view its basic info (id, title, scoring_mode, pass_percentage).

-- ============================================================
-- 1. Drop overly permissive INSERT policy on attempts
-- ============================================================
DROP POLICY IF EXISTS "users can insert own attempts" ON attempts;

-- ============================================================
-- 2. Allow attempters to view quiz basic info
-- ============================================================
CREATE POLICY "attempters can view quiz info"
  ON quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.quiz_id = quizzes.id
      AND attempts.user_id = auth.uid()
    )
  );
