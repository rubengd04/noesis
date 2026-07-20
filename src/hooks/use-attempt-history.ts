'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AttemptSummary, HistorySummary, HistoryStatusFilter } from '@/types/api'

const VALID_STATUSES: HistoryStatusFilter[] = ['all', 'passed', 'failed']

function isValidStatus(v: string | null): v is HistoryStatusFilter {
  return VALID_STATUSES.includes(v as HistoryStatusFilter)
}

function buildParams(params: {
  search?: string
  status?: HistoryStatusFilter
  date_from?: string | null
  date_to?: string | null
  page?: number
}): URLSearchParams {
  const sp = new URLSearchParams()
  if (params.search) sp.set('search', params.search)
  if (params.status && params.status !== 'all') sp.set('status', params.status)
  if (params.date_from) sp.set('date_from', params.date_from)
  if (params.date_to) sp.set('date_to', params.date_to)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  return sp
}

export function useAttemptHistory() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearchState] = useState(searchParams.get('search') ?? '')
  const initialStatus = searchParams.get('status')
  const [statusFilter, setStatusFilterState] = useState<HistoryStatusFilter>(
    isValidStatus(initialStatus) ? initialStatus : 'all',
  )
  const [dateFrom, setDateFromState] = useState<string | null>(
    searchParams.get('date_from') ?? null,
  )
  const [dateTo, setDateToState] = useState<string | null>(
    searchParams.get('date_to') ?? null,
  )
  const [page, setPageState] = useState(
    Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
  )
  const [limit] = useState(20)

  const [data, setData] = useState<AttemptSummary[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<HistorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadDone = useRef(false)

  const syncUrl = useCallback(
    (next: { search: string; status: HistoryStatusFilter; date_from: string | null; date_to: string | null; page: number }) => {
      const sp = buildParams(next)
      const qs = sp.toString()
      const url = qs ? `/dashboard/history?${qs}` : '/dashboard/history'
      router.replace(url, { scroll: false })
    },
    [router],
  )

  async function fetchData(
    params: { search: string; status: HistoryStatusFilter; date_from: string | null; date_to: string | null; page: number },
  ) {
    const sp = buildParams(params)
    try {
      const res = await fetch(`/api/attempts?${sp.toString()}`)
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error al cargar historial')
      }
      const json = await res.json()
      setData(json.data)
      setTotal(json.total)
      if (json.summary) {
        setSummary(json.summary)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  useEffect(() => {
    fetchData({ search, status: statusFilter, date_from: dateFrom, date_to: dateTo, page }).then(() => {
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
      syncUrl({ search, status: statusFilter, date_from: dateFrom, date_to: dateTo, page })
      setLoading(true)
      fetchData({ search, status: statusFilter, date_from: dateFrom, date_to: dateTo, page }).then(() => {
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

    syncUrl({ search, status: statusFilter, date_from: dateFrom, date_to: dateTo, page })
    setLoading(true)
    fetchData({ search, status: statusFilter, date_from: dateFrom, date_to: dateTo, page }).then(() => {
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFrom, dateTo, page])

  const setSearch = useCallback((v: string) => {
    setSearchState(v)
    setPageState(1)
  }, [])

  const setStatusFilter = useCallback((v: HistoryStatusFilter) => {
    setStatusFilterState(v)
    setPageState(1)
  }, [])

  const setDateFrom = useCallback((v: string | null) => {
    setDateFromState(v)
    setPageState(1)
  }, [])

  const setDateTo = useCallback((v: string | null) => {
    setDateToState(v)
    setPageState(1)
  }, [])

  const setPage = useCallback((v: number) => {
    setPageState(v)
  }, [])

  const resetFilters = useCallback(() => {
    setSearchState('')
    setStatusFilterState('all')
    setDateFromState(null)
    setDateToState(null)
    setPageState(1)
  }, [])

  const hasFilters = search !== '' || statusFilter !== 'all' || dateFrom !== null || dateTo !== null
  const totalPages = Math.ceil(total / limit) || 1

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    search,
    statusFilter,
    dateFrom,
    dateTo,
    summary,
    hasFilters,
    setSearch,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    setPage,
    resetFilters,
  }
}
