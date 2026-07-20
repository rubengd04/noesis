'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Quiz } from '@/types/database'
import type { QuizSort, PaginatedResponse } from '@/types/api'

type LanguageFilter = 'es' | 'en' | 'all'
type VisibilityFilter = 'private' | 'public' | 'all'

const VALID_LANGUAGES = ['es', 'en', 'all'] as const
const VALID_VISIBILITIES = ['private', 'public', 'all'] as const
const VALID_SORTS: QuizSort[] = ['newest', 'oldest', 'title-asc', 'title-desc']

function isValidLanguage(v: string | null): v is LanguageFilter {
  return VALID_LANGUAGES.includes(v as LanguageFilter)
}
function isValidVisibility(v: string | null): v is VisibilityFilter {
  return VALID_VISIBILITIES.includes(v as VisibilityFilter)
}
function isValidSort(v: string | null): v is QuizSort {
  return VALID_SORTS.includes(v as QuizSort)
}

function buildParams(params: {
  search: string
  language: LanguageFilter
  visibility: VisibilityFilter
  sort: QuizSort
  page: number
  limit: number
}): URLSearchParams {
  const sp = new URLSearchParams()
  if (params.search) sp.set('search', params.search)
  if (params.language !== 'all') sp.set('language', params.language)
  if (params.visibility !== 'all') sp.set('visibility', params.visibility)
  if (params.sort !== 'newest') sp.set('sort', params.sort)
  if (params.page > 1) sp.set('page', String(params.page))
  if (params.limit !== 20) sp.set('limit', String(params.limit))
  return sp
}

export function useQuizList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearchState] = useState(searchParams.get('search') ?? '')
  const [language, setLanguageState] = useState<LanguageFilter>(
    isValidLanguage(searchParams.get('language')) ? searchParams.get('language')! : 'all',
  )
  const [visibility, setVisibilityState] = useState<VisibilityFilter>(
    isValidVisibility(searchParams.get('visibility')) ? searchParams.get('visibility')! : 'all',
  )
  const [sort, setSortState] = useState<QuizSort>(
    isValidSort(searchParams.get('sort')) ? searchParams.get('sort')! : 'newest',
  )
  const [page, setPageState] = useState(
    Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
  )
  const [limit] = useState(20)

  const [data, setData] = useState<Quiz[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncUrl = useCallback(
    (next: { search: string; language: LanguageFilter; visibility: VisibilityFilter; sort: QuizSort; page: number }) => {
      const sp = buildParams(next)
      const qs = sp.toString()
      const url = qs ? `/dashboard?${qs}` : '/dashboard'
      router.replace(url, { scroll: false })
    },
    [router],
  )

  const fetchQuizzes = useCallback(
    async (params: { search: string; language: LanguageFilter; visibility: VisibilityFilter; sort: QuizSort; page: number }) => {
      setLoading(true)
      setError(null)

      try {
        const sp = buildParams(params)
        const res = await fetch(`/api/quizzes?${sp.toString()}`)

        if (!res.ok) {
          const body = await res.json()
          setError(body.error ?? 'Error al cargar quizzes')
          return
        }

        const json: PaginatedResponse<Quiz> = await res.json()
        setData(json.data)
        setTotal(json.total)
      } catch {
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const initialSearch = sp.get('search') ?? ''
    const initialLanguage: LanguageFilter = isValidLanguage(sp.get('language'))
      ? sp.get('language')!
      : 'all'
    const initialVisibility: VisibilityFilter = isValidVisibility(sp.get('visibility'))
      ? sp.get('visibility')!
      : 'all'
    const initialSort: QuizSort = isValidSort(sp.get('sort'))
      ? sp.get('sort')!
      : 'newest'
    const initialPage = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1)

    setSearchState(initialSearch)
    setLanguageState(initialLanguage)
    setVisibilityState(initialVisibility)
    setSortState(initialSort)
    setPageState(initialPage)

    fetchQuizzes({
      search: initialSearch,
      language: initialLanguage,
      visibility: initialVisibility,
      sort: initialSort,
      page: initialPage,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      syncUrl({ search, language, visibility, sort, page })
      fetchQuizzes({ search, language, visibility, sort, page })
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    syncUrl({ search, language, visibility, sort, page })
    fetchQuizzes({ search, language, visibility, sort, page })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, visibility, sort, page])

  const setSearch = useCallback((v: string) => {
    setSearchState(v)
    setPageState(1)
  }, [])

  const setLanguage = useCallback((v: LanguageFilter) => {
    setLanguageState(v)
    setPageState(1)
  }, [])

  const setVisibility = useCallback((v: VisibilityFilter) => {
    setVisibilityState(v)
    setPageState(1)
  }, [])

  const setSort = useCallback((v: QuizSort) => {
    setSortState(v)
    setPageState(1)
  }, [])

  const setPage = useCallback((v: number) => {
    setPageState(v)
  }, [])

  const resetFilters = useCallback(() => {
    setSearchState('')
    setLanguageState('all')
    setVisibilityState('all')
    setSortState('newest')
    setPageState(1)
  }, [])

  const hasFilters = search !== '' || language !== 'all' || visibility !== 'all' || sort !== 'newest'
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    search,
    language,
    visibility,
    sort,
    hasFilters,
    setSearch,
    setLanguage,
    setVisibility,
    setSort,
    setPage,
    resetFilters,
  }
}
