import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateQuizSchema } from '@/lib/validations/quizzes'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params
  const supabase = await createClient()

  const body = await request.json()
  const parsed = updateQuizSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('quizzes')
    .update(parsed.data)
    .eq('id', quizId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('quizzes').delete().eq('id', quizId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
