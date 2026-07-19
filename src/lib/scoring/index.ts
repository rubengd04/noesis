import type {
  Question,
  QuestionType,
  QuestionOption,
  QuestionPair,
  QuestionItem,
  AnswerValue,
  ScoringMode,
} from '@/types/database'

interface ScoreInput {
  question: Pick<Question, 'id' | 'type' | 'points'>
  typeData: QuestionOption[] | QuestionPair[] | QuestionItem[]
  answer: AnswerValue
  scoringMode: ScoringMode
}

interface ScoreResult {
  isCorrect: boolean
  pointsEarned: number
}

interface AttemptScoreInput {
  questions: Pick<Question, 'id' | 'type' | 'points'>[]
  typeDataMap: Record<string, QuestionOption[] | QuestionPair[] | QuestionItem[]>
  answers: { questionId: string; answer: AnswerValue }[]
  scoringMode: ScoringMode
}

interface AttemptScoreResult {
  results: { questionId: string; isCorrect: boolean; pointsEarned: number }[]
  totalScore: number
  maxScore: number
}

// ─── Strategies ─────────────────────────────────────────────

interface ScoringStrategy {
  score(input: ScoreInput): ScoreResult
}

class TrueFalseScoring implements ScoringStrategy {
  score({ question, typeData, answer }: ScoreInput): ScoreResult {
    const options = typeData as QuestionOption[]
    const val = (answer as { value: boolean }).value
    const isCorrect = val === options[0].is_correct
    return { isCorrect, pointsEarned: isCorrect ? question.points : 0 }
  }
}

class MultipleChoiceScoring implements ScoringStrategy {
  score({ question, typeData, answer }: ScoreInput): ScoreResult {
    const options = typeData as QuestionOption[]
    const selected = new Set((answer as { selectedOptionIds: string[] }).selectedOptionIds)
    const correctIds = new Set(
      options.filter((o) => o.is_correct).map((o) => o.id),
    )
    if (selected.size !== correctIds.size) {
      return { isCorrect: false, pointsEarned: 0 }
    }
    for (const id of selected) {
      if (!correctIds.has(id)) return { isCorrect: false, pointsEarned: 0 }
    }
    return { isCorrect: true, pointsEarned: question.points }
  }
}

class MatchingScoring implements ScoringStrategy {
  score({ question, typeData, answer, scoringMode }: ScoreInput): ScoreResult {
    const pairs = typeData as QuestionPair[]
    const userPairs = (answer as { pairs: { pairId: string; matchedRight: string }[] }).pairs

    const rightByPairId = new Map(pairs.map((p) => [p.id, p.right_text]))
    let correct = 0
    for (const up of userPairs) {
      const expected = rightByPairId.get(up.pairId)
      if (expected && up.matchedRight.trim().toLowerCase() === expected.trim().toLowerCase()) {
        correct++
      }
    }

    if (correct === pairs.length) {
      return { isCorrect: true, pointsEarned: question.points }
    }

    if (scoringMode === 'all-or-nothing') {
      return { isCorrect: false, pointsEarned: 0 }
    }

    const fraction = pairs.length > 0 ? correct / pairs.length : 1
    const earned = Math.round(fraction * question.points)
    return { isCorrect: false, pointsEarned: earned }
  }
}

class OrderingScoring implements ScoringStrategy {
  score({ question, typeData, answer, scoringMode }: ScoreInput): ScoreResult {
    const items = typeData as QuestionItem[]
    const userOrder = (answer as { itemOrder: string[] }).itemOrder

    const orderByItemId = new Map(items.map((it) => [it.id, it.correct_order]))
    let correct = 0
    for (let i = 0; i < userOrder.length; i++) {
      const expected = orderByItemId.get(userOrder[i])
      if (expected === i + 1) correct++
    }

    if (correct === items.length) {
      return { isCorrect: true, pointsEarned: question.points }
    }

    if (scoringMode === 'all-or-nothing') {
      return { isCorrect: false, pointsEarned: 0 }
    }

    const fraction = items.length > 0 ? correct / items.length : 1
    const earned = Math.round(fraction * question.points)
    return { isCorrect: false, pointsEarned: earned }
  }
}

// ─── Registry ──────────────────────────────────────────────

const strategies: Record<QuestionType, ScoringStrategy> = {
  'true-false': new TrueFalseScoring(),
  'multiple-choice': new MultipleChoiceScoring(),
  matching: new MatchingScoring(),
  ordering: new OrderingScoring(),
}

function getStrategy(type: QuestionType): ScoringStrategy {
  return strategies[type]
}

// ─── Public API ────────────────────────────────────────────

export function scoreAnswer(input: ScoreInput): ScoreResult {
  const strategy = getStrategy(input.question.type)
  return strategy.score(input)
}

export function scoreAttempt(input: AttemptScoreInput): AttemptScoreResult {
  let totalScore = 0
  let maxScore = 0
  const results: AttemptScoreResult['results'] = []

  for (const ans of input.answers) {
    const question = input.questions.find((q) => q.id === ans.questionId)
    if (!question) {
      results.push({ questionId: ans.questionId, isCorrect: false, pointsEarned: 0 })
      continue
    }

    const typeData = input.typeDataMap[ans.questionId] ?? []
    const result = scoreAnswer({
      question,
      typeData,
      answer: ans.answer,
      scoringMode: input.scoringMode,
    })

    totalScore += result.pointsEarned
    maxScore += question.points
    results.push({
      questionId: ans.questionId,
      isCorrect: result.isCorrect,
      pointsEarned: result.pointsEarned,
    })
  }

  return { results, totalScore, maxScore }
}
