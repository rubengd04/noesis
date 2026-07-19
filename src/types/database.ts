export type Language = 'es' | 'en'
export type QuizVisibility = 'private' | 'public'
export type QuestionType = 'true-false' | 'multiple-choice' | 'matching' | 'ordering'
export type AttemptStatus = 'in-progress' | 'completed' | 'abandoned'

export interface Profile {
  id: string
  display_name: string | null
  preferred_language: Language
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  author_id: string
  title: string
  description: string | null
  language: Language
  visibility: QuizVisibility
  shuffle_questions: boolean
  max_attempts: number | null
  time_limit_minutes: number | null
  pass_percentage: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  quiz_id: string
  type: QuestionType
  content: string
  explanation: string | null
  hint: string | null
  difficulty: number
  points: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: string
  question_id: string
  content: string
  is_correct: boolean
  order_index: number
}

export interface QuestionPair {
  id: string
  question_id: string
  left_text: string
  right_text: string
  order_index: number
}

export interface QuestionItem {
  id: string
  question_id: string
  content: string
  correct_order: number
  order_index: number
}

export interface Attempt {
  id: string
  quiz_id: string
  user_id: string
  status: AttemptStatus
  score: number | null
  max_score: number | null
  time_seconds: number | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export type TrueFalseAnswer = { value: boolean }
export type MultipleChoiceAnswer = { selectedOptionIds: string[] }
export type MatchingAnswer = { pairs: { pairId: string; matchedRight: string }[] }
export type OrderingAnswer = { itemOrder: string[] }
export type AnswerValue =
  | TrueFalseAnswer
  | MultipleChoiceAnswer
  | MatchingAnswer
  | OrderingAnswer

export interface Answer {
  id: string
  attempt_id: string
  question_id: string
  answer: AnswerValue
  is_correct: boolean | null
  points_earned: number
  answered_at: string
}
