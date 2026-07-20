import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

type MockResult = {
  data: unknown
  error: { message: string } | null
  count: number | null
}

const mockResults: MockResult = {
  data: null as unknown,
  error: null as { message: string } | null,
  count: null as number | null,
}

function createQueryBuilder() {
  const qb = {
    select: vi.fn(() => qb),
    insert: vi.fn(() => qb),
    update: vi.fn(() => qb),
    delete: vi.fn(() => qb),
    eq: vi.fn(() => qb),
    neq: vi.fn(() => qb),
    ilike: vi.fn(() => qb),
    order: vi.fn(() => qb),
    range: vi.fn(() => qb),
    single: vi.fn(() => qb),
    then(resolve: (value: MockResult) => void) {
      resolve(mockResults)
    },
  }
  return qb
}

const qb = createQueryBuilder()

const mockClient = {
  from: vi.fn(() => qb),
  rpc: vi.fn(() => qb),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}))

function setResult(data: unknown, count: number | null = null) {
  mockResults.data = data
  mockResults.error = null
  mockResults.count = count
}

function setError(message: string) {
  mockResults.data = null
  mockResults.error = { message }
  mockResults.count = null
}

beforeEach(() => {
  mockResults.data = null
  mockResults.error = null
  mockResults.count = null
  vi.clearAllMocks()
  mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
})

function req(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init))
}

describe('GET /api/quizzes', () => {
  it('returns paginated quiz list', async () => {
    const quizzes = [{ id: '1', title: 'Test Quiz', author_id: 'user-1' }]
    setResult(quizzes, 1)

    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET(req('http://localhost/api/quizzes'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      data: quizzes,
      total: 1,
      page: 1,
      limit: 20,
    })
    expect(mockClient.from).toHaveBeenCalledWith('quizzes')
    expect(qb.eq).toHaveBeenCalledWith('author_id', 'user-1')
  })

  it('filters by search param', async () => {
    setResult([], 0)

    const { GET } = await import('@/app/api/quizzes/route')
    await GET(req('http://localhost/api/quizzes?search=math'))

    expect(qb.ilike).toHaveBeenCalledWith('title', '%math%')
  })

  it('filters by language', async () => {
    setResult([], 0)

    const { GET } = await import('@/app/api/quizzes/route')
    await GET(req('http://localhost/api/quizzes?language=es'))

    expect(qb.eq).toHaveBeenCalledWith('language', 'es')
  })

  it('filters by visibility', async () => {
    setResult([], 0)

    const { GET } = await import('@/app/api/quizzes/route')
    await GET(req('http://localhost/api/quizzes?visibility=public'))

    expect(qb.eq).toHaveBeenCalledWith('visibility', 'public')
  })

  it('sorts by title ascending', async () => {
    setResult([], 0)

    const { GET } = await import('@/app/api/quizzes/route')
    await GET(req('http://localhost/api/quizzes?sort=title-asc'))

    expect(qb.order).toHaveBeenCalledWith('title', { ascending: true })
  })

  it('sorts by oldest first', async () => {
    setResult([], 0)

    const { GET } = await import('@/app/api/quizzes/route')
    await GET(req('http://localhost/api/quizzes?sort=oldest'))

    expect(qb.order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('paginates with page and limit', async () => {
    setResult([], 0)

    const { GET } = await import('@/app/api/quizzes/route')
    await GET(req('http://localhost/api/quizzes?page=2&limit=5'))

    expect(qb.range).toHaveBeenCalledWith(5, 9)
  })

  it('uses defaults when no params provided', async () => {
    const quizzes = [
      { id: '1', title: 'Q1', author_id: 'user-1' },
      { id: '2', title: 'Q2', author_id: 'user-1' },
    ]
    setResult(quizzes, 2)

    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET(req('http://localhost/api/quizzes'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(20)
    expect(body.total).toBe(2)
    expect(body.data).toEqual(quizzes)
    expect(qb.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('returns 400 for invalid page param', async () => {
    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET(req('http://localhost/api/quizzes?page=-1'))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Página')
  })

  it('returns 400 for invalid limit param', async () => {
    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET(req('http://localhost/api/quizzes?limit=999'))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Límite')
  })

  it('returns 400 for invalid language', async () => {
    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET(req('http://localhost/api/quizzes?language=fr'))

    expect(response.status).toBe(400)
  })

  it('returns 400 for invalid sort', async () => {
    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET(req('http://localhost/api/quizzes?sort=invalid'))

    expect(response.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    setError('DB error')

    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET(req('http://localhost/api/quizzes'))

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('DB error')
  })

  it('applies combined search, language, and visibility filters', async () => {
    setResult([], 0)

    const { GET } = await import('@/app/api/quizzes/route')
    await GET(req('http://localhost/api/quizzes?search=test&language=en&visibility=public'))

    expect(qb.ilike).toHaveBeenCalledWith('title', '%test%')
    expect(qb.eq).toHaveBeenCalledWith('language', 'en')
    expect(qb.eq).toHaveBeenCalledWith('visibility', 'public')
  })
})

describe('POST /api/quizzes', () => {
  it('creates a quiz', async () => {
    const created = { id: 'new-id', title: 'New Quiz', author_id: 'user-1' }
    setResult(created)

    const { POST } = await import('@/app/api/quizzes/route')
    const response = await POST(
      req('http://localhost/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Quiz' }),
      }),
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.title).toBe('New Quiz')
    expect(qb.insert).toHaveBeenCalled()
  })

  it('returns 400 for empty title', async () => {
    const { POST } = await import('@/app/api/quizzes/route')
    const response = await POST(
      req('http://localhost/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      }),
    )

    expect(response.status).toBe(400)
  })
})

describe('GET /api/quizzes/[quizId]', () => {
  it('returns a single quiz', async () => {
    const quiz = { id: 'q1', title: 'Test', author_id: 'user-1' }
    setResult(quiz)

    const { GET } = await import('@/app/api/quizzes/[quizId]/route')
    const response = await GET(
      req('http://localhost/api/quizzes/q1'),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.title).toBe('Test')
    expect(qb.eq).toHaveBeenCalledWith('id', 'q1')
  })

  it('returns 404 when quiz not found', async () => {
    setResult(null)

    const { GET } = await import('@/app/api/quizzes/[quizId]/route')
    const response = await GET(
      req('http://localhost/api/quizzes/q1'),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(404)
  })
})

describe('PUT /api/quizzes/[quizId]', () => {
  it('updates a quiz', async () => {
    const updated = { id: 'q1', title: 'Updated', author_id: 'user-1' }
    setResult(updated)

    const { PUT } = await import('@/app/api/quizzes/[quizId]/route')
    const response = await PUT(
      req('http://localhost/api/quizzes/q1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.title).toBe('Updated')
    expect(qb.update).toHaveBeenCalled()
    expect(qb.eq).toHaveBeenCalledWith('id', 'q1')
  })

  it('returns 400 for invalid payload', async () => {
    const { PUT } = await import('@/app/api/quizzes/[quizId]/route')
    const response = await PUT(
      req('http://localhost/api/quizzes/q1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass_percentage: 200 }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/quizzes/[quizId]', () => {
  it('deletes a quiz', async () => {
    setResult(null)

    const { DELETE } = await import('@/app/api/quizzes/[quizId]/route')
    const response = await DELETE(
      req('http://localhost/api/quizzes/q1', { method: 'DELETE' }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(204)
    expect(mockClient.from).toHaveBeenCalledWith('quizzes')
    expect(qb.eq).toHaveBeenCalledWith('id', 'q1')
  })

  it('returns 500 on delete error', async () => {
    setError('Delete failed')

    const { DELETE } = await import('@/app/api/quizzes/[quizId]/route')
    const response = await DELETE(
      req('http://localhost/api/quizzes/q1', { method: 'DELETE' }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Delete failed')
  })
})
