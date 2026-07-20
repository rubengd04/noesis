import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createQuizSchema } from '@/lib/validations/quizzes'
import type { QuizSort } from '@/types/api'

const VALID_LANGUAGES = ['es', 'en'] as const
const VALID_VISIBILITIES = ['private', 'public'] as const
const VALID_SORTS: QuizSort[] = ['newest', 'oldest', 'title-asc', 'title-desc']
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function parseSort(sort: string | null): {
  column: string
  ascending: boolean
} {
  switch (sort) {
    case 'oldest':
      return { column: 'created_at', ascending: true }
    case 'title-asc':
      return { column: 'title', ascending: true }
    case 'title-desc':
      return { column: 'title', ascending: false }
    case 'newest':
    default:
      return { column: 'created_at', ascending: false }
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl

  const search = searchParams.get('search') || undefined
  const language = searchParams.get('language') || undefined
  const visibility = searchParams.get('visibility') || undefined
  const sort = searchParams.get('sort') || 'newest'
  const pageRaw = searchParams.get('page') || String(DEFAULT_PAGE)
  const limitRaw = searchParams.get('limit') || String(DEFAULT_LIMIT)

  const page = parseInt(pageRaw, 10)
  const limit = parseInt(limitRaw, 10)

  if (language && !VALID_LANGUAGES.includes(language as 'es' | 'en')) {
    return NextResponse.json(
      { error: `Idioma inválido. Valores: ${VALID_LANGUAGES.join(', ')}` },
      { status: 400 },
    )
  }
  if (visibility && !VALID_VISIBILITIES.includes(visibility as 'private' | 'public')) {
    return NextResponse.json(
      { error: `Visibilidad inválida. Valores: ${VALID_VISIBILITIES.join(', ')}` },
      { status: 400 },
    )
  }
  if (!VALID_SORTS.includes(sort as QuizSort)) {
    return NextResponse.json(
      { error: `Ordenación inválida. Valores: ${VALID_SORTS.join(', ')}` },
      { status: 400 },
    )
  }
  if (Number.isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Página inválida (mínimo 1)' }, { status: 400 })
  }
  if (Number.isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
    return NextResponse.json(
      { error: `Límite inválido (1-${MAX_LIMIT})` },
      { status: 400 },
    )
  }

  const fromOffset = (page - 1) * limit
  const toOffset = fromOffset + limit - 1
  const { column, ascending } = parseSort(sort)

  let query = supabase.from('quizzes').select('*', { count: 'exact', head: false })
  let countQuery = supabase.from('quizzes').select('*', { count: 'exact', head: true })

  query = query.eq('author_id', user.id)
  countQuery = countQuery.eq('author_id', user.id)

  if (search) {
    query = query.ilike('title', `%${search}%`)
    countQuery = countQuery.ilike('title', `%${search}%`)
  }
  if (language) {
    query = query.eq('language', language)
    countQuery = countQuery.eq('language', language)
  }
  if (visibility) {
    query = query.eq('visibility', visibility)
    countQuery = countQuery.eq('visibility', visibility)
  }

  const { count: total, error: countError } = await countQuery

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  const { data, error } = await query
    .order(column, { ascending })
    .range(fromOffset, toOffset)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    total: total ?? 0,
    page,
    limit,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createQuizSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert({ ...parsed.data, author_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(quiz, { status: 201 })
}
