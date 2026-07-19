BEGIN;

-- Test 1: Verificar existencia de todas las tablas
DO $$
BEGIN
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles'), 'profiles missing';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quizzes'), 'quizzes missing';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questions'), 'questions missing';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'question_options'), 'question_options missing';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'question_pairs'), 'question_pairs missing';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'question_items'), 'question_items missing';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attempts'), 'attempts missing';
  ASSERT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'answers'), 'answers missing';
  RAISE NOTICE 'Test 1 PASS: All 8 tables exist';
END $$;

-- Test 2: CHECK constraint quizzes.language IN ('es','en')
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'quizzes'
      AND ccu.column_name = 'language'
      AND cc.check_clause LIKE '%es%en%'
  ), 'Language CHECK constraint missing';
  RAISE NOTICE 'Test 2 PASS: language CHECK constraint exists';
END $$;

-- Test 3: CHECK constraint questions.difficulty BETWEEN 1 AND 5
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'questions'
      AND ccu.column_name = 'difficulty'
  ), 'Difficulty CHECK constraint missing';
  RAISE NOTICE 'Test 3 PASS: difficulty CHECK constraint exists';
END $$;

-- Test 4: CHECK constraint quizzes.pass_percentage BETWEEN 0 AND 100
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'quizzes'
      AND ccu.column_name = 'pass_percentage'
  ), 'Pass_percentage CHECK constraint missing';
  RAISE NOTICE 'Test 4 PASS: pass_percentage CHECK constraint exists';
END $$;

-- Test 5: Verificar FK quizzes.author_id -> profiles.id
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'quizzes'
      AND tc.constraint_type = 'FOREIGN KEY'
  ), 'FK on quizzes missing';
  RAISE NOTICE 'Test 5 PASS: quizzes has FK constraint';
END $$;

-- Test 6: Verificar trigger on_auth_user_created
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ), 'Trigger on_auth_user_created missing';
  RAISE NOTICE 'Test 6 PASS: trigger exists';
END $$;

-- Test 7: RLS habilitado en todas las tablas
DO $$
DECLARE
  tables_without_rls INT;
BEGIN
  SELECT COUNT(*) INTO tables_without_rls
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
      SELECT FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = t.table_name
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    );
  ASSERT tables_without_rls = 0, 'Some tables missing RLS';
  RAISE NOTICE 'Test 7 PASS: RLS enabled on all tables';
END $$;

COMMIT;
