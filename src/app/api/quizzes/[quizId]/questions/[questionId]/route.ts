import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateQuestionSchema } from '@/lib/validations/questions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> },
) {
  const { questionId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('questions')
    .select('*, question_options(*), question_pairs(*), question_items(*)')
    .eq('id', questionId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> },
) {
  const { questionId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { type, content, explanation, hint, difficulty, points, order_index, ...rest } =
    parsed.data

  const updatePayload: Record<string, unknown> = {}
  if (content !== undefined) updatePayload.content = content
  if (explanation !== undefined) updatePayload.explanation = explanation ?? null
  if (hint !== undefined) updatePayload.hint = hint ?? null
  if (difficulty !== undefined) updatePayload.difficulty = difficulty
  if (points !== undefined) updatePayload.points = points
  if (order_index !== undefined) updatePayload.order_index = order_index

  if (Object.keys(updatePayload).length > 0) {
    const { error: uError } = await supabase
      .from('questions')
      .update(updatePayload)
      .eq('id', questionId)

    if (uError) {
      return NextResponse.json({ error: uError.message }, { status: 500 })
    }
  }

  if (type === 'true-false' && 'correct_answer' in rest) {
    const { correct_answer } = rest as { correct_answer: boolean }
    await supabase.from('question_options').delete().eq('question_id', questionId)
    await supabase.from('question_options').insert([
      { question_id: questionId, content: 'Verdadero', is_correct: correct_answer === true, order_index: 0 },
      { question_id: questionId, content: 'Falso', is_correct: correct_answer === false, order_index: 1 },
    ])
  }

  if (type === 'multiple-choice' && 'options' in rest) {
    const { options } = rest as { options: { content: string; is_correct: boolean }[] }
    await supabase.from('question_options').delete().eq('question_id', questionId)
    await supabase.from('question_options').insert(
      options.map((opt, i) => ({
        question_id: questionId,
        content: opt.content,
        is_correct: opt.is_correct,
        order_index: i,
      })),
    )
  }

  if (type === 'matching' && 'pairs' in rest) {
    const { pairs } = rest as { pairs: { left_text: string; right_text: string }[] }
    await supabase.from('question_pairs').delete().eq('question_id', questionId)
    await supabase.from('question_pairs').insert(
      pairs.map((pair, i) => ({
        question_id: questionId,
        left_text: pair.left_text,
        right_text: pair.right_text,
        order_index: i,
      })),
    )
  }

  if (type === 'ordering' && 'items' in rest) {
    const { items } = rest as { items: { content: string; correct_order: number }[] }
    await supabase.from('question_items').delete().eq('question_id', questionId)
    await supabase.from('question_items').insert(
      items.map((item, i) => ({
        question_id: questionId,
        content: item.content,
        correct_order: item.correct_order,
        order_index: i,
      })),
    )
  }

  const { data: updated } = await supabase
    .from('questions')
    .select('*, question_options(*), question_pairs(*), question_items(*)')
    .eq('id', questionId)
    .single()

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> },
) {
  const { questionId } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('questions').delete().eq('id', questionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
