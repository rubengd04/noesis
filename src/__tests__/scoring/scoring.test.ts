import { describe, it, expect } from 'vitest'
import { scoreAnswer, scoreAttempt } from '@/lib/scoring'
import type { Question, QuestionOption, QuestionPair, QuestionItem } from '@/types/database'

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    quiz_id: 'quiz-1',
    type: 'true-false',
    content: 'Test question',
    explanation: null,
    hint: null,
    difficulty: 2,
    points: 1,
    order_index: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('TrueFalseScoring', () => {
  const question = makeQuestion({ type: 'true-false' })
  const typeData: QuestionOption[] = [
    { id: 'o1', question_id: 'q-1', content: 'Verdadero', is_correct: true, order_index: 0 },
    { id: 'o2', question_id: 'q-1', content: 'Falso', is_correct: false, order_index: 1 },
  ]

  it('scores correct true answer', () => {
    const result = scoreAnswer({ question, typeData, answer: { value: true }, scoringMode: 'all-or-nothing' })
    expect(result.isCorrect).toBe(true)
    expect(result.pointsEarned).toBe(1)
  })

  it('scores incorrect false answer', () => {
    const result = scoreAnswer({ question, typeData, answer: { value: false }, scoringMode: 'all-or-nothing' })
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
  })
})

describe('MultipleChoiceScoring', () => {
  const question = makeQuestion({ type: 'multiple-choice', points: 2 })
  const typeData: QuestionOption[] = [
    { id: 'a', question_id: 'q-1', content: 'Paris', is_correct: true, order_index: 0 },
    { id: 'b', question_id: 'q-1', content: 'London', is_correct: false, order_index: 1 },
    { id: 'c', question_id: 'q-1', content: 'Madrid', is_correct: false, order_index: 2 },
  ]

  it('scores all correct selections', () => {
    const result = scoreAnswer({ question, typeData, answer: { selectedOptionIds: ['a'] }, scoringMode: 'all-or-nothing' })
    expect(result.isCorrect).toBe(true)
    expect(result.pointsEarned).toBe(2)
  })

  it('scores incorrect selection (wrong option)', () => {
    const result = scoreAnswer({ question, typeData, answer: { selectedOptionIds: ['b'] }, scoringMode: 'all-or-nothing' })
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
  })

  it('scores empty selection', () => {
    const result = scoreAnswer({ question, typeData, answer: { selectedOptionIds: [] }, scoringMode: 'all-or-nothing' })
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
  })

  it('scores too many selections', () => {
    const result = scoreAnswer({ question, typeData, answer: { selectedOptionIds: ['a', 'b'] }, scoringMode: 'all-or-nothing' })
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
  })
})

describe('MatchingScoring', () => {
  const question = makeQuestion({ type: 'matching', points: 3 })
  const typeData: QuestionPair[] = [
    { id: 'p1', question_id: 'q-1', left_text: 'Paris', right_text: 'France', order_index: 0 },
    { id: 'p2', question_id: 'q-1', left_text: 'Madrid', right_text: 'Spain', order_index: 1 },
    { id: 'p3', question_id: 'q-1', left_text: 'Rome', right_text: 'Italy', order_index: 2 },
  ]

  it('all correct with all-or-nothing returns full points', () => {
    const result = scoreAnswer({
      question, typeData, scoringMode: 'all-or-nothing',
      answer: {
        pairs: [
          { pairId: 'p1', matchedRight: 'France' },
          { pairId: 'p2', matchedRight: 'Spain' },
          { pairId: 'p3', matchedRight: 'Italy' },
        ],
      },
    })
    expect(result.isCorrect).toBe(true)
    expect(result.pointsEarned).toBe(3)
  })

  it('partial correct with all-or-nothing returns 0', () => {
    const result = scoreAnswer({
      question, typeData, scoringMode: 'all-or-nothing',
      answer: {
        pairs: [
          { pairId: 'p1', matchedRight: 'France' },
          { pairId: 'p2', matchedRight: 'Italy' },
          { pairId: 'p3', matchedRight: 'Spain' },
        ],
      },
    })
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
  })

  it('partial correct with partial scoring returns proportional points', () => {
    const result = scoreAnswer({
      question, typeData, scoringMode: 'partial',
      answer: {
        pairs: [
          { pairId: 'p1', matchedRight: 'France' },
          { pairId: 'p2', matchedRight: 'Italy' },
          { pairId: 'p3', matchedRight: 'Spain' },
        ],
      },
    })
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(1) // 1/3 * 3 = 1
  })

  it('all correct with partial scoring returns full points', () => {
    const result = scoreAnswer({
      question, typeData, scoringMode: 'partial',
      answer: {
        pairs: [
          { pairId: 'p1', matchedRight: 'France' },
          { pairId: 'p2', matchedRight: 'Spain' },
          { pairId: 'p3', matchedRight: 'Italy' },
        ],
      },
    })
    expect(result.isCorrect).toBe(true)
    expect(result.pointsEarned).toBe(3)
  })

  it('case insensitive matching', () => {
    const result = scoreAnswer({
      question, typeData, scoringMode: 'all-or-nothing',
      answer: {
        pairs: [
          { pairId: 'p1', matchedRight: 'france' },
          { pairId: 'p2', matchedRight: 'spain' },
          { pairId: 'p3', matchedRight: 'italy' },
        ],
      },
    })
    expect(result.isCorrect).toBe(true)
    expect(result.pointsEarned).toBe(3)
  })
})

describe('OrderingScoring', () => {
  const question = makeQuestion({ type: 'ordering', points: 4 })
  const typeData: QuestionItem[] = [
    { id: 'i1', question_id: 'q-1', content: 'First', correct_order: 1, order_index: 0 },
    { id: 'i2', question_id: 'q-1', content: 'Second', correct_order: 2, order_index: 1 },
    { id: 'i3', question_id: 'q-1', content: 'Third', correct_order: 3, order_index: 2 },
    { id: 'i4', question_id: 'q-1', content: 'Fourth', correct_order: 4, order_index: 3 },
  ]

  it('exact order returns full points', () => {
    const result = scoreAnswer({
      question, typeData, scoringMode: 'all-or-nothing',
      answer: { itemOrder: ['i1', 'i2', 'i3', 'i4'] },
    })
    expect(result.isCorrect).toBe(true)
    expect(result.pointsEarned).toBe(4)
  })

  it('reversed order returns 0', () => {
    const result = scoreAnswer({
      question, typeData, scoringMode: 'all-or-nothing',
      answer: { itemOrder: ['i4', 'i3', 'i2', 'i1'] },
    })
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
  })

  it('partial order with partial scoring returns proportional points', () => {
    // 2 out of 4 in correct position
    const result = scoreAnswer({
      question, typeData, scoringMode: 'partial',
      answer: { itemOrder: ['i1', 'i3', 'i2', 'i4'] },
    })
    // i1 at pos 0 → correct (expected 1), i3 at pos 1 → wrong (expected 2)
    // i2 at pos 2 → wrong (expected 1), i4 at pos 3 → correct (expected 4)
    // 2/4 * 4 = 2
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(2)
  })
})

describe('scoreAttempt (integration)', () => {
  const q1 = makeQuestion({ id: 'q1', type: 'true-false', points: 1 })
  const q2 = makeQuestion({ id: 'q2', type: 'multiple-choice', points: 2 })
  const q3 = makeQuestion({ id: 'q3', type: 'matching', points: 3 })

  const typeDataMap = {
    q1: [
      { id: 'o1', question_id: 'q1', content: 'Verdadero', is_correct: true, order_index: 0 } as QuestionOption,
      { id: 'o2', question_id: 'q1', content: 'Falso', is_correct: false, order_index: 1 } as QuestionOption,
    ],
    q2: [
      { id: 'a', question_id: 'q2', content: 'Correct', is_correct: true, order_index: 0 } as QuestionOption,
      { id: 'b', question_id: 'q2', content: 'Wrong', is_correct: false, order_index: 1 } as QuestionOption,
    ],
    q3: [
      { id: 'p1', question_id: 'q3', left_text: 'A', right_text: '1', order_index: 0 } as QuestionPair,
      { id: 'p2', question_id: 'q3', left_text: 'B', right_text: '2', order_index: 1 } as QuestionPair,
    ],
  }

  it('scores mixed correct/incorrect answers', () => {
    const result = scoreAttempt({
      questions: [q1, q2, q3],
      typeDataMap,
      answers: [
        { questionId: 'q1', answer: { value: true } },
        { questionId: 'q2', answer: { selectedOptionIds: ['a'] } },
        { questionId: 'q3', answer: { pairs: [{ pairId: 'p1', matchedRight: '1' }, { pairId: 'p2', matchedRight: 'X' }] } },
      ],
      scoringMode: 'all-or-nothing',
    })

    expect(result.totalScore).toBe(3) // q1(1) + q2(2) + q3(0) = 3
    expect(result.maxScore).toBe(6)
    expect(result.results).toHaveLength(3)
    expect(result.results[0].isCorrect).toBe(true)
    expect(result.results[0].pointsEarned).toBe(1)
    expect(result.results[1].isCorrect).toBe(true)
    expect(result.results[1].pointsEarned).toBe(2)
    expect(result.results[2].isCorrect).toBe(false)
    expect(result.results[2].pointsEarned).toBe(0)
  })

  it('handles empty answers array', () => {
    const result = scoreAttempt({
      questions: [q1, q2],
      typeDataMap,
      answers: [],
      scoringMode: 'all-or-nothing',
    })
    expect(result.totalScore).toBe(0)
    expect(result.maxScore).toBe(0)
    expect(result.results).toHaveLength(0)
  })

  it('handles unknown question id gracefully', () => {
    const result = scoreAttempt({
      questions: [q1],
      typeDataMap,
      answers: [{ questionId: 'unknown', answer: { value: true } }],
      scoringMode: 'all-or-nothing',
    })
    expect(result.results[0].isCorrect).toBe(false)
    expect(result.results[0].pointsEarned).toBe(0)
  })
})
