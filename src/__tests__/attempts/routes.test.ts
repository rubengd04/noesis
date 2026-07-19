import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

// ─── Per-table mock data ────────────────────────────────────

const tableData: Record<string, unknown[]> = {}
const queryLog: { table: string }[] = []

function mockGetData(table: string, singleMode: boolean) {
  const rows = tableData[table]
  if (!rows || rows.length === 0) {
    return { data: null, error: { message: 'Not found' } }
  }
  if (singleMode) {
    return { data: rows[0], error: null }
  }
  return { data: rows, error: null }
}

class MockBuilder {
  private _select: string | undefined
  private _single = false
  private _table = ''

  constructor(table: string) { this._table = table }

  select(cols?: string) { this._select = cols; return this }
  insert(_rows: unknown) { return this }
  update(_data: unknown) { return this }
  delete() { return this }
  eq(_col: string, _val: unknown) { return this }
  or(_filter: string) { return this }
  order(_col: string, _dir?: unknown) { return this }
  single() { this._single = true; return this }
  then(resolve: (value: unknown) => void) {
    queryLog.push({ table: this._table })
    resolve(mockGetData(this._table, this._single))
  }
}

const mockClient = {
  from: vi.fn((table: string) => new MockBuilder(table)),
  rpc: vi.fn(() => new MockBuilder('rpc')),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}))

beforeEach(() => {
  vi.clearAllMocks()
  queryLog.length = 0
  Object.keys(tableData).forEach((k) => delete tableData[k])
  mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
})

function setTable(table: string, data: unknown[]) {
  tableData[table] = data
}

function req(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init))
}

// ─── Tests ──────────────────────────────────────────────────

describe('POST /api/quizzes/[quizId]/attempts', () => {
  it('starts an attempt for a public quiz', async () => {
    setTable('quizzes', [{
      id: 'quiz-1', title: 'Test Quiz', author_id: 'other-user',
      visibility: 'public', scoring_mode: 'all-or-nothing',
      shuffle_questions: false, max_attempts: null,
    }])
    setTable('questions', [
      { id: 'q1', quiz_id: 'quiz-1', type: 'true-false', content: 'Test', points: 1, order_index: 0 },
    ])
    setTable('attempts', [
      { id: 'att-1', quiz_id: 'quiz-1', user_id: 'user-1', status: 'in-progress', score: null, max_score: null },
    ])

    const { POST } = await import('@/app/api/quizzes/[quizId]/attempts/route')
    const response = await POST(
      req('http://localhost/api/quizzes/quiz-1/attempts', { method: 'POST' }),
      { params: Promise.resolve({ quizId: 'quiz-1' }) },
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.attempt).toBeDefined()
    expect(body.attempt.status).toBe('in-progress')
  })

  it('returns 404 for non-existent quiz', async () => {
    setTable('quizzes', [])

    const { POST } = await import('@/app/api/quizzes/[quizId]/attempts/route')
    const response = await POST(
      req('http://localhost/api/quizzes/quiz-1/attempts', { method: 'POST' }),
      { params: Promise.resolve({ quizId: 'quiz-1' }) },
    )

    expect(response.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized', status: 401 } })

    const { POST } = await import('@/app/api/quizzes/[quizId]/attempts/route')
    const response = await POST(
      req('http://localhost/api/quizzes/quiz-1/attempts', { method: 'POST' }),
      { params: Promise.resolve({ quizId: 'quiz-1' }) },
    )

    expect(response.status).toBe(401)
  })
})

describe('POST /api/quizzes/[quizId]/attempts/[attemptId]/submit', () => {
  it('submits answers successfully', async () => {
    setTable('attempts', [{
      id: 'att-1', quiz_id: 'quiz-1', user_id: 'user-1', status: 'in-progress',
      question_order: null, score: null, max_score: null,
    }])
    setTable('quizzes', [{
      id: 'quiz-1', scoring_mode: 'all-or-nothing', pass_percentage: 60,
    }])
    setTable('questions', [
      { id: 'q1', quiz_id: 'quiz-1', type: 'true-false', content: 'Test', points: 1, order_index: 0,
        question_options: [{ id: 'o1', question_id: 'q1', content: 'Verdadero', is_correct: true, order_index: 0 }],
      },
    ])
    setTable('answers', [{ id: 'dummy', attempt_id: 'att-1' }]) // insert needs seeded answers table

    const { POST } = await import('@/app/api/quizzes/[quizId]/attempts/[attemptId]/submit/route')
    const response = await POST(
      req('http://localhost/api/quizzes/quiz-1/attempts/att-1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: [{ questionId: 'q1', answer: { type: 'true-false', value: true } }],
        }),
      }),
      { params: Promise.resolve({ quizId: 'quiz-1', attemptId: 'att-1' }) },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.results).toHaveLength(1)
    expect(body.results[0].isCorrect).toBe(true)
  })

  it('returns 400 for invalid payload', async () => {
    setTable('attempts', [{
      id: 'att-1', quiz_id: 'quiz-1', user_id: 'user-1', status: 'in-progress',
    }])

    const { POST } = await import('@/app/api/quizzes/[quizId]/attempts/[attemptId]/submit/route')
    const response = await POST(
      req('http://localhost/api/quizzes/quiz-1/attempts/att-1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: 'invalid' }),
      }),
      { params: Promise.resolve({ quizId: 'quiz-1', attemptId: 'att-1' }) },
    )

    expect(response.status).toBe(400)
  })

  it('returns 400 for already completed attempt', async () => {
    setTable('attempts', [{
      id: 'att-1', quiz_id: 'quiz-1', user_id: 'user-1', status: 'completed',
    }])

    const { POST } = await import('@/app/api/quizzes/[quizId]/attempts/[attemptId]/submit/route')
    const response = await POST(
      req('http://localhost/api/quizzes/quiz-1/attempts/att-1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [] }),
      }),
      { params: Promise.resolve({ quizId: 'quiz-1', attemptId: 'att-1' }) },
    )

    expect(response.status).toBe(400)
  })

  it('returns 404 for non-existent attempt', async () => {
    setTable('attempts', [])

    const { POST } = await import('@/app/api/quizzes/[quizId]/attempts/[attemptId]/submit/route')
    const response = await POST(
      req('http://localhost/api/quizzes/quiz-1/attempts/att-999/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [] }),
      }),
      { params: Promise.resolve({ quizId: 'quiz-1', attemptId: 'att-999' }) },
    )

    expect(response.status).toBe(404)
  })
})

describe('GET /api/quizzes/[quizId]/attempts/[attemptId]', () => {
  it('returns attempt results', async () => {
    setTable('quizzes', [{
      id: 'quiz-1', scoring_mode: 'all-or-nothing', pass_percentage: 60,
    }])
    setTable('attempts', [{
      id: 'att-1', quiz_id: 'quiz-1', user_id: 'user-1', status: 'completed',
      score: 5, max_score: 10, completed_at: '2026-07-19T12:00:00Z',
    }])
    setTable('answers', [
      { id: 'a1', attempt_id: 'att-1', question_id: 'q1', is_correct: true, points_earned: 1, answer: { value: true } },
    ])
    setTable('questions', [
      {
        id: 'q1', quiz_id: 'quiz-1', type: 'true-false', content: 'Test question', points: 1, order_index: 0,
        question_options: [
          { id: 'o1', question_id: 'q1', content: 'Verdadero', is_correct: true, order_index: 0 },
          { id: 'o2', question_id: 'q1', content: 'Falso', is_correct: false, order_index: 1 },
        ],
      },
    ])

    const { GET } = await import('@/app/api/quizzes/[quizId]/attempts/[attemptId]/route')
    const response = await GET(
      req('http://localhost/api/quizzes/quiz-1/attempts/att-1'),
      { params: Promise.resolve({ quizId: 'quiz-1', attemptId: 'att-1' }) },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.totalScore).toBeDefined()
    expect(body.maxScore).toBeDefined()
    expect(body.percentage).toBeDefined()
    expect(body.passed).toBeDefined()
    expect(body.results).toHaveLength(1)
    expect(body.questions).toHaveLength(1)
  })

  it('returns 404 for non-existent attempt', async () => {
    setTable('attempts', [])

    const { GET } = await import('@/app/api/quizzes/[quizId]/attempts/[attemptId]/route')
    const response = await GET(
      req('http://localhost/api/quizzes/quiz-1/attempts/att-999'),
      { params: Promise.resolve({ quizId: 'quiz-1', attemptId: 'att-999' }) },
    )

    expect(response.status).toBe(404)
  })
})
