import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Fetch answers
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('answered_at')

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 })
  }

  // Fetch questions with full type-specific data (including correct answers for review)
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

  return NextResponse.json({ attempt, answers, questions: orderedQuestions })
}
