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
