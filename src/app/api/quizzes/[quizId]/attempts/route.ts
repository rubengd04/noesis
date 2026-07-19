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

  // Fetch questions with type-specific data
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*, question_options(*), question_pairs(*), question_items(*)')
    .eq('quiz_id', quizId)
    .order('order_index')

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  // Shuffle if enabled
  let questionOrder: string[] | null = null
  if (quiz.shuffle_questions && questions.length > 0) {
    const indices = questions.map((_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const shuffled = indices.map((i) => questions[i])
    questionOrder = shuffled.map((q) => q.id)

    // Reorder in-place for the response (uses question_order for persistence)
    questions.splice(0, questions.length, ...shuffled)
  } else {
    questionOrder = questions.map((q) => q.id)
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
  const sanitizedQuestions = questions.map((q) => {
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
