'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { HistoryStatusFilter } from '@/types/api'

interface AttemptHistoryFiltersProps {
  search: string
  statusFilter: HistoryStatusFilter
  dateFrom: string | null
  dateTo: string | null
  hasFilters: boolean
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: HistoryStatusFilter) => void
  onDateFromChange: (value: string | null) => void
  onDateToChange: (value: string | null) => void
  onResetFilters: () => void
}

export function AttemptHistoryFilters({
  search,
  statusFilter,
  dateFrom,
  dateTo,
  hasFilters,
  onSearchChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onResetFilters,
}: AttemptHistoryFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por título del quiz..."
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="w-full sm:w-auto sm:min-w-[160px]">
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as HistoryStatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="passed">Aprobados</SelectItem>
              <SelectItem value="failed">Suspendidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <Input
            type="date"
            value={dateFrom ?? ''}
            onChange={(e) => onDateFromChange(e.target.value || null)}
            placeholder="Desde"
            className="h-10"
          />
        </div>

        <div className="w-full sm:w-auto">
          <Input
            type="date"
            value={dateTo ?? ''}
            onChange={(e) => onDateToChange(e.target.value || null)}
            placeholder="Hasta"
            className="h-10"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters} className="h-10">
            <X className="mr-1 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
