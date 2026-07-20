export type QuizSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

export interface QuizListParams {
  search?: string
  language?: 'es' | 'en'
  visibility?: 'private' | 'public'
  sort?: QuizSort
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface AttemptSummary {
  id: string
  quiz_id: string
  quiz_title: string | null
  quiz_deleted: boolean
  percentage: number
  passed: boolean
  time_seconds: number | null
  num_correct: number
  num_questions: number
  scoring_mode: string
  created_at: string
}

export interface HistorySummary {
  totalAttempts: number
  avgPercentage: number
  passCount: number
  passRate: number
}

export type HistoryStatusFilter = 'all' | 'passed' | 'failed'
