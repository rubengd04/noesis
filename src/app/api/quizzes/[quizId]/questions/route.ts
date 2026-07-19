import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createQuestionSchema } from '@/lib/validations/questions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('questions')
    .select('*, question_options(*), question_pairs(*), question_items(*)')
    .eq('quiz_id', quizId)
    .order('order_index')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = createQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const {
    type,
    content,
    explanation,
    hint,
    difficulty,
    points,
    order_index,
    ...rest
  } = parsed.data

  const { data: question, error: qError } = await supabase
    .from('questions')
    .insert({
      quiz_id: quizId,
      type,
      content,
      explanation: explanation ?? null,
      hint: hint ?? null,
      difficulty,
      points,
      order_index,
    })
    .select()
    .single()

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 })
  }

  switch (type) {
    case 'true-false': {
      const { correct_answer } = rest as { correct_answer: boolean }
      await supabase.from('question_options').insert([
        {
          question_id: question.id,
          content: 'Verdadero',
          is_correct: correct_answer === true,
          order_index: 0,
        },
        {
          question_id: question.id,
          content: 'Falso',
          is_correct: correct_answer === false,
          order_index: 1,
        },
      ])
      break
    }
    case 'multiple-choice': {
      const { options } = rest as { options: { content: string; is_correct: boolean }[] }
      await supabase.from('question_options').insert(
        options.map((opt, i) => ({
          question_id: question.id,
          content: opt.content,
          is_correct: opt.is_correct,
          order_index: i,
        })),
      )
      break
    }
    case 'matching': {
      const { pairs } = rest as { pairs: { left_text: string; right_text: string }[] }
      await supabase.from('question_pairs').insert(
        pairs.map((pair, i) => ({
          question_id: question.id,
          left_text: pair.left_text,
          right_text: pair.right_text,
          order_index: i,
        })),
      )
      break
    }
    case 'ordering': {
      const { items } = rest as { items: { content: string; correct_order: number }[] }
      await supabase.from('question_items').insert(
        items.map((item, i) => ({
          question_id: question.id,
          content: item.content,
          correct_order: item.correct_order,
          order_index: i,
        })),
      )
      break
    }
  }

  return NextResponse.json(question, { status: 201 })
}
