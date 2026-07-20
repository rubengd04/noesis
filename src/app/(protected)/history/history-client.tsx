'use client'

import { useAttemptHistory } from '@/hooks/use-attempt-history'
import { AttemptHistoryFilters } from '@/components/attempts/attempt-history-filters'
import { AttemptHistoryList } from '@/components/attempts/attempt-history-list'

export function HistoryClient() {
  const {
    data,
    total,
    page,
    totalPages,
    limit,
    loading,
    search,
    statusFilter,
    dateFrom,
    dateTo,
    hasFilters,
    setSearch,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    setPage,
    resetFilters,
  } = useAttemptHistory()

  return (
    <div className="space-y-6">
      <AttemptHistoryFilters
        search={search}
        statusFilter={statusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        hasFilters={hasFilters}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onResetFilters={resetFilters}
      />

      <AttemptHistoryList
        data={data}
        total={total}
        page={page}
        totalPages={totalPages}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
      />
    </div>
  )
}
