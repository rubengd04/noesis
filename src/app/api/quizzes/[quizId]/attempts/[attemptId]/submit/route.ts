import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitAttemptSchema } from '@/lib/validations/attempts'
import type { QuestionOption, QuestionPair, QuestionItem } from '@/types/database'
import { scoreAttempt } from '@/lib/scoring'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; attemptId: string }> },
) {
  const { quizId, attemptId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate attempt belongs to user and is in-progress
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

  if (attempt.status !== 'in-progress') {
    return NextResponse.json(
      { error: 'Attempt is already completed' },
      { status: 400 },
    )
  }

  // Parse and validate payload
  const body = await request.json()
  const parsed = submitAttemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { answers, time_spent_seconds } = parsed.data

  // Fetch quiz for scoring_mode and pass_percentage
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('scoring_mode, pass_percentage')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // Fetch questions with type-specific data
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*, question_options(*), question_pairs(*), question_items(*)')
    .eq('quiz_id', quizId)

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  // Build typeDataMap
  const typeDataMap: Record<string, QuestionOption[] | QuestionPair[] | QuestionItem[]> = {}
  for (const q of questions) {
    typeDataMap[q.id] = (
      q.question_options ?? q.question_pairs ?? q.question_items ?? []
    ) as QuestionOption[] | QuestionPair[] | QuestionItem[]
  }

  // Score all answers
  const scoringResult = scoreAttempt({
    questions: questions.map((q) => ({ id: q.id, type: q.type, points: q.points })),
    typeDataMap,
    answers: answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
    })),
    scoringMode: quiz.scoring_mode,
  })

  // Insert answers
  const answerRows = scoringResult.results.map((r) => {
    const ans = answers.find((a) => a.questionId === r.questionId)
    return {
      attempt_id: attemptId,
      question_id: r.questionId,
      answer: ans?.answer ?? {},
      is_correct: r.isCorrect,
      points_earned: r.pointsEarned,
    }
  })

  const { error: answerError } = await supabase
    .from('answers')
    .insert(answerRows)

  if (answerError) {
    return NextResponse.json({ error: answerError.message }, { status: 500 })
  }

  // Calculate result
  const percentage = scoringResult.maxScore > 0
    ? Math.round((scoringResult.totalScore / scoringResult.maxScore) * 100)
    : 100
  const passed = percentage >= quiz.pass_percentage

  // Update attempt
  const now = new Date().toISOString()
  const { data: updatedAttempt, error: updateError } = await supabase
    .from('attempts')
    .update({
      status: 'completed',
      score: scoringResult.totalScore,
      max_score: scoringResult.maxScore,
      time_seconds: time_spent_seconds ?? null,
      completed_at: now,
    })
    .eq('id', attemptId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    attempt: updatedAttempt,
    results: scoringResult.results,
    totalScore: scoringResult.totalScore,
    maxScore: scoringResult.maxScore,
    percentage,
    passed,
  })
}
