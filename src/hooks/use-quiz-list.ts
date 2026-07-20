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
  limit?: number
}): URLSearchParams {
  const sp = new URLSearchParams()
  if (params.search) sp.set('search', params.search)
  if (params.language !== 'all') sp.set('language', params.language)
  if (params.visibility !== 'all') sp.set('visibility', params.visibility)
  if (params.sort !== 'newest') sp.set('sort', params.sort)
  if (params.page > 1) sp.set('page', String(params.page))
  if (params.limit != null && params.limit !== 20) sp.set('limit', String(params.limit))
  return sp
}

export function useQuizList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearchState] = useState(searchParams.get('search') ?? '')
  const initialLanguage = searchParams.get('language')
  const [language, setLanguageState] = useState<LanguageFilter>(
    isValidLanguage(initialLanguage) ? initialLanguage : 'all',
  )
  const initialVisibility = searchParams.get('visibility')
  const [visibility, setVisibilityState] = useState<VisibilityFilter>(
    isValidVisibility(initialVisibility) ? initialVisibility : 'all',
  )
  const initialSort = searchParams.get('sort')
  const [sort, setSortState] = useState<QuizSort>(
    isValidSort(initialSort) ? initialSort : 'newest',
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
  const initialLoadDone = useRef(false)

  const syncUrl = useCallback(
    (next: { search: string; language: LanguageFilter; visibility: VisibilityFilter; sort: QuizSort; page: number }) => {
      const sp = buildParams(next)
      const qs = sp.toString()
      const url = qs ? `/dashboard?${qs}` : '/dashboard'
      router.replace(url, { scroll: false })
    },
    [router],
  )

  function fetchData(
    params: { search: string; language: LanguageFilter; visibility: VisibilityFilter; sort: QuizSort; page: number },
  ) {
    const sp = buildParams(params)
    return fetch(`/api/quizzes?${sp.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? 'Error al cargar quizzes')
        }
        return res.json() as Promise<PaginatedResponse<Quiz>>
      })
      .then((json) => {
        setData(json.data)
        setTotal(json.total)
      })
      .catch((err: Error) => {
        setError(err.message)
      })
  }

  useEffect(() => {
    fetchData({ search, language, visibility, sort, page }).then(() => {
      setLoading(false)
    })
    initialLoadDone.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initialLoadDone.current) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      syncUrl({ search, language, visibility, sort, page })
      setLoading(true)
      fetchData({ search, language, visibility, sort, page }).then(() => {
        setLoading(false)
      })
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    if (!initialLoadDone.current) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    syncUrl({ search, language, visibility, sort, page })
    setLoading(true)
    fetchData({ search, language, visibility, sort, page }).then(() => {
      setLoading(false)
    })
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
