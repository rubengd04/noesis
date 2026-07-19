import { describe, it, expect } from 'vitest'
import { createQuestionSchema, updateQuestionSchema } from '@/lib/validations/questions'

const validBase = {
  content: '¿Cuál es la capital de Francia?',
  difficulty: 2,
  points: 1,
  order_index: 0,
}

describe('createQuestionSchema', () => {
  describe('true-false', () => {
    const payload = { ...validBase, type: 'true-false' as const, correct_answer: true }

    it('accepts valid true-false question', () => {
      const result = createQuestionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('rejects missing correct_answer', () => {
      const noAnswer = { ...payload } as Record<string, unknown>
      delete noAnswer.correct_answer
      const result = createQuestionSchema.safeParse(noAnswer)
      expect(result.success).toBe(false)
    })

    it('rejects wrong type for correct_answer', () => {
      const result = createQuestionSchema.safeParse({ ...payload, correct_answer: 'yes' })
      expect(result.success).toBe(false)
    })
  })

  describe('multiple-choice', () => {
    const payload = {
      ...validBase,
      type: 'multiple-choice' as const,
      options: [
        { content: 'París', is_correct: true },
        { content: 'Londres', is_correct: false },
      ],
    }

    it('accepts valid multiple-choice question', () => {
      const result = createQuestionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('rejects fewer than 2 options', () => {
      const result = createQuestionSchema.safeParse({
        ...payload,
        options: [{ content: 'Solo una', is_correct: true }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty option content', () => {
      const result = createQuestionSchema.safeParse({
        ...payload,
        options: [
          { content: 'París', is_correct: true },
          { content: '', is_correct: false },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing options', () => {
      const noOpts = { ...payload } as Record<string, unknown>
      delete noOpts.options
      const result = createQuestionSchema.safeParse(noOpts)
      expect(result.success).toBe(false)
    })
  })

  describe('matching', () => {
    const payload = {
      ...validBase,
      type: 'matching' as const,
      pairs: [
        { left_text: 'París', right_text: 'Francia' },
        { left_text: 'Madrid', right_text: 'España' },
      ],
    }

    it('accepts valid matching question', () => {
      const result = createQuestionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('rejects empty left_text', () => {
      const result = createQuestionSchema.safeParse({
        ...payload,
        pairs: [{ left_text: '', right_text: 'Francia' }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty right_text', () => {
      const result = createQuestionSchema.safeParse({
        ...payload,
        pairs: [{ left_text: 'París', right_text: '' }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('ordering', () => {
    const payload = {
      ...validBase,
      type: 'ordering' as const,
      items: [
        { content: 'Primero', correct_order: 1 },
        { content: 'Segundo', correct_order: 2 },
      ],
    }

    it('accepts valid ordering question', () => {
      const result = createQuestionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('rejects fewer than 2 items', () => {
      const result = createQuestionSchema.safeParse({
        ...payload,
        items: [{ content: 'Único', correct_order: 1 }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects items with missing content', () => {
      const result = createQuestionSchema.safeParse({
        ...payload,
        items: [
          { content: '', correct_order: 1 },
          { content: 'Segundo', correct_order: 2 },
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('common validation', () => {
    it('rejects empty content', () => {
      const result = createQuestionSchema.safeParse({
        ...validBase,
        content: '',
        type: 'true-false',
        correct_answer: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects difficulty out of range', () => {
      const result = createQuestionSchema.safeParse({
        ...validBase,
        type: 'true-false',
        correct_answer: true,
        difficulty: 4,
      })
      expect(result.success).toBe(false)
    })

    it('rejects unknown type', () => {
      const result = createQuestionSchema.safeParse({
        ...validBase,
        type: 'essay',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('updateQuestionSchema', () => {
  it('accepts partial update (only content)', () => {
    const result = updateQuestionSchema.safeParse({
      type: 'true-false',
      content: 'Nueva pregunta',
    })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with type-specific field', () => {
    const result = updateQuestionSchema.safeParse({
      type: 'matching',
      pairs: [{ left_text: 'A', right_text: 'B' }],
    })
    expect(result.success).toBe(true)
  })

  it('strips extra fields not in the matched schema', () => {
    const result = updateQuestionSchema.safeParse({
      type: 'true-false',
      options: [{ content: 'A', is_correct: true }],
    })
    expect(result.success).toBe(true)
  })

  it('requires type in update', () => {
    const result = updateQuestionSchema.safeParse({ content: 'No type' })
    expect(result.success).toBe(false)
  })
})
