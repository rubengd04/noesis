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
  auth: {},
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
})

async function getHandlers() {
  return {
    GET_LIST: (await import('@/app/api/quizzes/[quizId]/questions/route')).GET,
    POST: (await import('@/app/api/quizzes/[quizId]/questions/route')).POST,
    GET_ONE: (
      await import('@/app/api/quizzes/[quizId]/questions/[questionId]/route')
    ).GET,
    PUT: (
      await import('@/app/api/quizzes/[quizId]/questions/[questionId]/route')
    ).PUT,
    DELETE: (
      await import('@/app/api/quizzes/[quizId]/questions/[questionId]/route')
    ).DELETE,
  }
}

function req(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init))
}

describe('mock chain verification', () => {
  it('createClient returns chainable mock', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    const qbFromClient = client.from('questions')
    expect(typeof qbFromClient.select).toBe('function')
    const qb2 = qbFromClient.select('*')
    expect(typeof qb2.eq).toBe('function')
    const qb3 = qb2.eq('id', '1')
    expect(typeof qb3.single).toBe('function')
    expect(typeof qb3.order).toBe('function')
    expect(typeof qb3.insert).toBe('function')
    expect(typeof qb3.update).toBe('function')
    expect(typeof qb3.delete).toBe('function')
  })

  it('handler uses the same mock client', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    expect(client).toBe(mockClient)
    const qbFromClient = client.from('questions')
    expect(typeof qbFromClient.select).toBe('function')
  })

  it('GET handler works end-to-end with mock', async () => {
    setData([{ id: '1', content: 'Test', type: 'true-false' }])

    const { GET } = await import('@/app/api/quizzes/[quizId]/questions/route')
    const response = await GET(
      req('http://localhost/api/quizzes/q1/questions'),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toHaveLength(1)
  })
})

describe('GET /api/quizzes/[quizId]/questions', () => {
  it('returns questions list', async () => {
    const questions = [{ id: '1', content: 'Test', type: 'true-false' }]
    setData(questions)

    const { GET_LIST } = await getHandlers()
    const response = await GET_LIST(req('http://localhost/api/quizzes/q1/questions'), {
      params: Promise.resolve({ quizId: 'q1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(questions)
    expect(mockClient.from).toHaveBeenCalledWith('questions')
    expect(qb.eq).toHaveBeenCalledWith('quiz_id', 'q1')
  })

  it('returns 500 on database error', async () => {
    setError('DB error')

    const { GET_LIST } = await getHandlers()
    const response = await GET_LIST(req('http://localhost/api/quizzes/q1/questions'), {
      params: Promise.resolve({ quizId: 'q1' }),
    })

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('DB error')
  })
})

describe('GET /api/quizzes/[quizId]/questions/[questionId]', () => {
  it('returns a single question', async () => {
    const question = { id: '1', content: 'Test', type: 'true-false' }
    setData(question)

    const { GET_ONE } = await getHandlers()
    const response = await GET_ONE(
      req('http://localhost/api/quizzes/q1/questions/1'),
      { params: Promise.resolve({ quizId: 'q1', questionId: '1' }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(question)
    expect(qb.eq).toHaveBeenCalledWith('id', '1')
  })
})

describe('POST /api/quizzes/[quizId]/questions', () => {
  const basePayload = {
    content: 'Test question',
    difficulty: 2,
    points: 1,
    order_index: 0,
  }

  it('creates a true-false question', async () => {
    setData({ id: 'new-id' })

    const { POST } = await getHandlers()
    const response = await POST(
      req('http://localhost/api/quizzes/q1/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, type: 'true-false', correct_answer: true }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(201)
    expect(qb.single).toHaveBeenCalled()
    expect(qb.insert).toHaveBeenCalled()
  })

  it('creates a multiple-choice question', async () => {
    setData({ id: 'new-id' })

    const { POST } = await getHandlers()
    const response = await POST(
      req('http://localhost/api/quizzes/q1/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          type: 'multiple-choice',
          options: [
            { content: 'A', is_correct: true },
            { content: 'B', is_correct: false },
          ],
        }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(201)
  })

  it('creates a matching question', async () => {
    setData({ id: 'new-id' })

    const { POST } = await getHandlers()
    const response = await POST(
      req('http://localhost/api/quizzes/q1/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          type: 'matching',
          pairs: [{ left_text: 'A', right_text: 'B' }],
        }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(201)
  })

  it('creates an ordering question', async () => {
    setData({ id: 'new-id' })

    const { POST } = await getHandlers()
    const response = await POST(
      req('http://localhost/api/quizzes/q1/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          type: 'ordering',
          items: [
            { content: 'First', correct_order: 1 },
            { content: 'Second', correct_order: 2 },
          ],
        }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(201)
  })

  it('returns 400 for invalid payload', async () => {
    const { POST } = await getHandlers()
    const response = await POST(
      req('http://localhost/api/quizzes/q1/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'true-false', content: '' }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Validation failed')
  })

  it('returns 500 when question insert fails', async () => {
    setError('Insert failed')

    const { POST } = await getHandlers()
    const response = await POST(
      req('http://localhost/api/quizzes/q1/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, type: 'true-false', correct_answer: true }),
      }),
      { params: Promise.resolve({ quizId: 'q1' }) },
    )

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Insert failed')
  })
})

describe('PUT /api/quizzes/[quizId]/questions/[questionId]', () => {
  const basePayload = {
    content: 'Updated question',
    type: 'true-false' as const,
    difficulty: 3,
  }

  it('updates common fields only', async () => {
    setData([{ id: 'q1', content: 'Updated' }])

    const { PUT } = await getHandlers()
    const response = await PUT(
      req('http://localhost/api/quizzes/q1/questions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload),
      }),
      { params: Promise.resolve({ quizId: 'q1', questionId: '1' }) },
    )

    expect(response.status).toBe(200)
    expect(qb.update).toHaveBeenCalled()
    expect(qb.eq).toHaveBeenCalledWith('id', '1')
  })

  it('replaces type-specific data on true-false update', async () => {
    setData([{ id: 'q1' }])

    const { PUT } = await getHandlers()
    const response = await PUT(
      req('http://localhost/api/quizzes/q1/questions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, correct_answer: false }),
      }),
      { params: Promise.resolve({ quizId: 'q1', questionId: '1' }) },
    )

    expect(response.status).toBe(200)
    expect(qb.delete).toHaveBeenCalled()
    expect(qb.insert).toHaveBeenCalled()
  })

  it('returns 400 for invalid payload', async () => {
    const { PUT } = await getHandlers()
    const response = await PUT(
      req('http://localhost/api/quizzes/q1/questions/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'true-false', content: '' }),
      }),
      { params: Promise.resolve({ quizId: 'q1', questionId: '1' }) },
    )

    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/quizzes/[quizId]/questions/[questionId]', () => {
  it('deletes a question successfully', async () => {
    setData(null)

    const { DELETE } = await getHandlers()
    const response = await DELETE(
      req('http://localhost/api/quizzes/q1/questions/1', { method: 'DELETE' }),
      { params: Promise.resolve({ quizId: 'q1', questionId: '1' }) },
    )

    expect(response.status).toBe(204)
    expect(mockClient.from).toHaveBeenCalledWith('questions')
    expect(qb.eq).toHaveBeenCalledWith('id', '1')
  })

  it('returns 500 on delete error', async () => {
    setError('Delete failed')

    const { DELETE } = await getHandlers()
    const response = await DELETE(
      req('http://localhost/api/quizzes/q1/questions/1', { method: 'DELETE' }),
      { params: Promise.resolve({ quizId: 'q1', questionId: '1' }) },
    )

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Delete failed')
  })
})
