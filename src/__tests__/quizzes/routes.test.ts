import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

const mockResults = { data: null as unknown, error: null as { message: string } | null }

function createQueryBuilder() {
  const qb = {
    select: vi.fn(() => qb),
    insert: vi.fn(() => qb),
    update: vi.fn(() => qb),
    delete: vi.fn(() => qb),
    eq: vi.fn(() => qb),
    order: vi.fn(() => qb),
    single: vi.fn(() => qb),
    then(resolve: (value: unknown) => void) {
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

function setData(data: unknown) {
  mockResults.data = data
  mockResults.error = null
}

function setError(message: string) {
  mockResults.data = null
  mockResults.error = { message }
}

beforeEach(() => {
  mockResults.data = null
  mockResults.error = null
  vi.clearAllMocks()
  mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
})

function req(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init))
}

describe('GET /api/quizzes', () => {
  it('returns quiz list', async () => {
    const quizzes = [{ id: '1', title: 'Test Quiz', author_id: 'user-1' }]
    setData(quizzes)

    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(quizzes)
    expect(mockClient.from).toHaveBeenCalledWith('quizzes')
    expect(qb.eq).toHaveBeenCalledWith('author_id', 'user-1')
  })

  it('returns 500 on database error', async () => {
    setError('DB error')

    const { GET } = await import('@/app/api/quizzes/route')
    const response = await GET()

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('DB error')
  })
})

describe('POST /api/quizzes', () => {
  it('creates a quiz', async () => {
    const created = { id: 'new-id', title: 'New Quiz', author_id: 'user-1' }
    setData(created)

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
    setData(quiz)

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
    setData(null)

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
    setData(updated)

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
    setData(null)

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
