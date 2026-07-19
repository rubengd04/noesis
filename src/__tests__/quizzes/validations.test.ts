import { describe, it, expect } from 'vitest'
import { createQuizSchema, updateQuizSchema } from '@/lib/validations/quizzes'

describe('createQuizSchema', () => {
  it('accepts valid title', () => {
    const result = createQuizSchema.safeParse({ title: 'Mi quiz' })
    expect(result.success).toBe(true)
  })

  it('applies defaults for optional fields', () => {
    const result = createQuizSchema.safeParse({ title: 'Test' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.language).toBe('es')
      expect(result.data.visibility).toBe('private')
      expect(result.data.shuffle_questions).toBe(false)
      expect(result.data.pass_percentage).toBe(70)
    }
  })

  it('rejects empty title', () => {
    const result = createQuizSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid language', () => {
    const result = createQuizSchema.safeParse({ title: 'Test', language: 'fr' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid visibility', () => {
    const result = createQuizSchema.safeParse({ title: 'Test', visibility: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects pass_percentage out of range', () => {
    const result = createQuizSchema.safeParse({ title: 'Test', pass_percentage: 150 })
    expect(result.success).toBe(false)
  })

  it('accepts all fields', () => {
    const result = createQuizSchema.safeParse({
      title: 'Full quiz',
      description: 'A description',
      language: 'en',
      visibility: 'public',
      shuffle_questions: true,
      max_attempts: 3,
      time_limit_minutes: 30,
      pass_percentage: 80,
    })
    expect(result.success).toBe(true)
  })
})

describe('updateQuizSchema', () => {
  it('accepts partial update with one field', () => {
    const result = updateQuizSchema.safeParse({ title: 'New title' })
    expect(result.success).toBe(true)
  })

  it('accepts nullable max_attempts', () => {
    const result = updateQuizSchema.safeParse({ max_attempts: null })
    expect(result.success).toBe(true)
  })
})
