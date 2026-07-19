import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreAttempt } from '@/lib/scoring'
import type { QuestionOption, QuestionPair, QuestionItem } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; attemptId: string }> },
) {
  const { quizId, attemptId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch attempt (owner only)
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  // Fetch quiz for scoring_mode and pass_percentage
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('scoring_mode, pass_percentage')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // Fetch answers
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('answered_at')

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 })
  }

  // Fetch questions with type-specific data
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*, question_options(*), question_pairs(*), question_items(*)')
    .eq('quiz_id', quizId)
    .order('order_index')

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  // Reorder questions according to attempt.question_order if present
  let orderedQuestions = questions
  if (attempt.question_order && attempt.question_order.length > 0) {
    const qMap = new Map(questions.map((q) => [q.id, q]))
    orderedQuestions = attempt.question_order
      .map((id: string) => qMap.get(id))
      .filter(Boolean)
  }

  // If attempt is in-progress, strip correct answers (session view)
  if (attempt.status === 'in-progress') {
    const sanitized = orderedQuestions.map((q: Record<string, unknown>) => {
      const opts = q.question_options as Array<Record<string, unknown>> | undefined
      const pairs = q.question_pairs as Array<Record<string, unknown>> | undefined
      const items = q.question_items as Array<Record<string, unknown>> | undefined
      return {
        ...q,
        question_options: opts?.map((o) => ({ id: o.id, content: o.content, order_index: o.order_index })),
        question_pairs: pairs?.map((p) => ({ id: p.id, left_text: p.left_text, order_index: p.order_index })),
        question_items: items?.map((it) => ({ id: it.id, content: it.content, order_index: it.order_index })),
      }
    })
    return NextResponse.json({ attempt, questions: sanitized })
  }

  // For completed attempts: re-score and return same shape as submit endpoint
  const typeDataMap: Record<string, QuestionOption[] | QuestionPair[] | QuestionItem[]> = {}
  for (const q of questions) {
    typeDataMap[q.id] = (
      q.question_options ?? q.question_pairs ?? q.question_items ?? []
    ) as QuestionOption[] | QuestionPair[] | QuestionItem[]
  }

  const scoringResult = scoreAttempt({
    questions: questions.map((q) => ({ id: q.id, type: q.type, points: q.points })),
    typeDataMap,
    answers: (answers ?? []).map((a) => ({
      questionId: a.question_id,
      answer: a.answer as Record<string, unknown>,
    })),
    scoringMode: quiz.scoring_mode,
  })

  const percentage = scoringResult.maxScore > 0
    ? Math.round((scoringResult.totalScore / scoringResult.maxScore) * 100)
    : 100
  const passed = percentage >= quiz.pass_percentage

  return NextResponse.json({
    attempt,
    results: scoringResult.results,
    totalScore: scoringResult.totalScore,
    maxScore: scoringResult.maxScore,
    percentage,
    passed,
    questions: orderedQuestions,
  })
}
