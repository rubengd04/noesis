import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AttemptRow {
  id: string
  quiz_id: string
  score: number
  max_score: number
  time_seconds: number | null
  completed_at: string
  created_at: string
  quizzes: Array<{
    id: string
    title: string
    scoring_mode: string
    pass_percentage: number
  }>
}

interface ScoreRow {
  score: number
  max_score: number
  quiz_id: string
}

const VALID_STATUSES = ['passed', 'failed', 'all'] as const
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE)
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
  const search = searchParams.get('search')?.trim() || undefined
  const statusFilter = searchParams.get('status') || 'all'
  const quizId = searchParams.get('quizId')?.trim() || undefined
  const dateFrom = searchParams.get('date_from') || undefined
  const dateTo = searchParams.get('date_to') || undefined

  if (!VALID_STATUSES.includes(statusFilter as 'passed' | 'failed' | 'all')) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  // Unpaginated fetch: filters (search, status) are applied in JS, and summary
  // stats require the full set
  let query = supabase
    .from('attempts')
    .select(`
      id, quiz_id, score, max_score, time_seconds, completed_at, created_at,
      quizzes ( id, title, scoring_mode, pass_percentage )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .not('max_score', 'is', null)
    .gt('max_score', 0)

  if (quizId) {
    query = query.eq('quiz_id', quizId)
  }

  if (dateFrom) {
    query = query.gte('completed_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('completed_at', `${dateTo}T23:59:59.999Z`)
  }

  const { data: attempts, error } = await query.order('completed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const attemptIds = (attempts ?? []).map((a) => a.id)
  const answerCounts = new Map<string, { correct: number; total: number }>()

  if (attemptIds.length > 0) {
    const { data: answers } = await supabase
      .from('answers')
      .select('attempt_id, is_correct')
      .in('attempt_id', attemptIds)

    for (const ans of answers ?? []) {
      const entry = answerCounts.get(ans.attempt_id) ?? { correct: 0, total: 0 }
      entry.total++
      if (ans.is_correct) entry.correct++
      answerCounts.set(ans.attempt_id, entry)
    }
  }

  let rows = (attempts ?? []).map((a: AttemptRow) => {
    const quiz = a.quizzes?.[0] ?? null
    const percentage = Math.round((a.score / a.max_score) * 1000) / 10
    const ansStats = answerCounts.get(a.id)
    return {
      id: a.id,
      quiz_id: a.quiz_id,
      quiz_title: quiz?.title ?? null,
      quiz_deleted: !quiz,
      percentage,
      passed: quiz ? percentage >= quiz.pass_percentage : false,
      time_seconds: a.time_seconds,
      num_correct: ansStats?.correct ?? 0,
      num_questions: ansStats?.total ?? 0,
      scoring_mode: quiz?.scoring_mode ?? 'all-or-nothing',
      created_at: a.created_at,
    }
  })

  if (search) {
    const q = search.toLowerCase()
    rows = rows.filter((r) => r.quiz_title?.toLowerCase().includes(q))
  }
  if (statusFilter === 'passed') {
    rows = rows.filter((r) => r.passed)
  } else if (statusFilter === 'failed') {
    rows = rows.filter((r) => !r.passed)
  }

  // Paginate in JS
  const total = rows.length
  const totalPages = Math.ceil(total / limit) || 1
  const fromOffset = (page - 1) * limit
  const paginatedRows = rows.slice(fromOffset, fromOffset + limit)

  let summaryQuery = supabase
    .from('attempts')
    .select('score, max_score, quiz_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .not('max_score', 'is', null)
    .gt('max_score', 0)

  if (quizId) {
    summaryQuery = summaryQuery.eq('quiz_id', quizId)
  }

  if (dateFrom) summaryQuery = summaryQuery.gte('completed_at', dateFrom)
  if (dateTo) summaryQuery = summaryQuery.lte('completed_at', `${dateTo}T23:59:59.999Z`)

  const { data: allScores } = await summaryQuery

  let summary = { totalAttempts: 0, avgPercentage: 0, passCount: 0, passRate: 0 }

  if (allScores && allScores.length > 0) {
    const allQuizIds = [...new Set(allScores.map((s: ScoreRow) => s.quiz_id))]
    const { data: quizMap } = await supabase
      .from('quizzes')
      .select('id, pass_percentage')
      .in('id', allQuizIds)

    const ppMap = new Map((quizMap ?? []).map((q) => [q.id, q.pass_percentage]))

    let totalPct = 0
    let passCount = 0
    for (const item of allScores as Array<{ score: number; max_score: number; quiz_id: string }>) {
      if (item.max_score > 0) {
        const pct = (item.score / item.max_score) * 100
        totalPct += pct
        const pp = ppMap.get(item.quiz_id) ?? 0
        if (pct >= pp) passCount++
      }
    }

    summary = {
      totalAttempts: allScores.length,
      avgPercentage: Math.round((totalPct / allScores.length) * 10) / 10,
      passCount,
      passRate: Math.round((passCount / allScores.length) * 1000) / 10,
    }
  }

  const now = new Date()
  const msDay = 86_400_000
  const weekAgo = new Date(now.getTime() - 7 * msDay)
  const twoWeeksAgo = new Date(now.getTime() - 14 * msDay)

  const weeklyAttempts = (attempts ?? []).filter(
    (a) => new Date(a.created_at) >= weekAgo,
  ).length

  const prevWeekAttempts = (attempts ?? []).filter((a) => {
    const d = new Date(a.created_at)
    return d >= twoWeeksAgo && d < weekAgo
  }).length

  const sortedScores = (allScores ?? [])
    .filter((s: ScoreRow) => s.max_score > 0)
    .map((s: ScoreRow) => (s.score / s.max_score) * 100)
  const recentAvg =
    sortedScores.length > 0
      ? sortedScores.slice(0, 15).reduce((a: number, b: number) => a + b, 0) /
        Math.min(sortedScores.length, 15)
      : 0
  const olderAvg =
    sortedScores.length > 15
      ? sortedScores
          .slice(15, 30)
          .reduce((a: number, b: number) => a + b, 0) /
        Math.min(sortedScores.length - 15, 15)
      : 0
  const scoreTrend =
    olderAvg > 0 ? Math.round((recentAvg - olderAvg) * 10) / 10 : null

  const dailyDistribution: Array<{ date: string; count: number }> = []
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * msDay)
    const dayStr = day.toISOString().split('T')[0]
    dailyDistribution.push({
      date: dayStr,
      count: (attempts ?? []).filter(
        (a) => new Date(a.created_at).toISOString().split('T')[0] === dayStr,
      ).length,
    })
  }

  return NextResponse.json({
    data: paginatedRows,
    total,
    page,
    limit,
    totalPages,
    summary,
    dashboardStats: {
      weeklyAttempts,
      prevWeekAttempts,
      scoreTrend,
      dailyDistribution,
    },
  })
}
