import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch quiz (must be accessible: public or owned by user)
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .or(`author_id.eq.${user.id},visibility.eq.public`)
    .single()

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // Check max_attempts
  if (quiz.max_attempts) {
    const { count } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (count !== null && count >= quiz.max_attempts) {
      return NextResponse.json(
        { error: 'Maximum number of attempts reached' },
        { status: 403 },
      )
    }
  }

  // Parse optional config from body
  let filterDifficulty: number | null = null
  let limitCount: number | null = null
  try {
    const body = await request.json()
    if (body.difficulty && body.difficulty !== 'Mixta') {
      const diffMap: Record<string, number> = { Fácil: 1, Medio: 2, Difícil: 3 }
      filterDifficulty = diffMap[body.difficulty] ?? null
    }
    if (typeof body.questionCount === 'number' && body.questionCount > 0) {
      limitCount = body.questionCount
    }
  } catch {
    // No body — use all questions
  }

  // Fetch questions with type-specific data
  let query = supabase
    .from('questions')
    .select('*, question_options(*), question_pairs(*), question_items(*)')
    .eq('quiz_id', quizId)

  if (filterDifficulty !== null) {
    query = query.eq('difficulty', filterDifficulty)
  }

  const { data: questions, error: questionsError } = await query.order('order_index')

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  // Pick a random subset if limitCount is set
  let selectedQuestions = questions
  if (limitCount !== null && limitCount < questions.length) {
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    selectedQuestions = shuffled.slice(0, limitCount)
  }

  // Shuffle if enabled
  let questionOrder: string[] | null = null
  if (quiz.shuffle_questions && selectedQuestions.length > 0) {
    const indices = selectedQuestions.map((_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const shuffled = indices.map((i) => selectedQuestions[i])
    questionOrder = shuffled.map((q) => q.id)

    // Reorder in-place for the response
    selectedQuestions.splice(0, selectedQuestions.length, ...shuffled)
  } else {
    questionOrder = selectedQuestions.map((q) => q.id)
  }

  // Create attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('attempts')
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      status: 'in-progress',
      question_order: questionOrder,
    })
    .select()
    .single()

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 })
  }

  // Strip correct answers from response
  const sanitizedQuestions = selectedQuestions.map((q) => {
    const { question_options: opts, question_pairs: pairs, question_items: items, ...rest } = q
    return {
      ...rest,
      ...(opts && opts.length > 0 && {
        question_options: opts.map((o: { id: string; content: string; is_correct: boolean; order_index: number }) => ({
          id: o.id,
          content: o.content,
          order_index: o.order_index,
          is_correct: undefined,
        })),
      }),
      ...(pairs && pairs.length > 0 && {
        question_pairs: pairs.map((p: { id: string; left_text: string; order_index: number }) => ({
          id: p.id,
          left_text: p.left_text,
          order_index: p.order_index,
        })),
      }),
      ...(items && items.length > 0 && {
        question_items: items.map((it: { id: string; content: string; order_index: number }) => ({
          id: it.id,
          content: it.content,
          order_index: it.order_index,
        })),
      }),
    }
  })

  return NextResponse.json({ attempt, questions: sanitizedQuestions }, { status: 201 })
}
