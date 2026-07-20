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
import type { QuizSort } from '@/types/api'

type LanguageFilter = 'es' | 'en' | 'all'
type VisibilityFilter = 'private' | 'public' | 'all'

interface QuizSearchFiltersProps {
  search: string
  language: LanguageFilter
  visibility: VisibilityFilter
  sort: QuizSort
  hasFilters: boolean
  onSearchChange: (value: string) => void
  onLanguageChange: (value: LanguageFilter) => void
  onVisibilityChange: (value: VisibilityFilter) => void
  onSortChange: (value: QuizSort) => void
  onResetFilters: () => void
}

export function QuizSearchFilters({
  search,
  language,
  visibility,
  sort,
  hasFilters,
  onSearchChange,
  onLanguageChange,
  onVisibilityChange,
  onSortChange,
  onResetFilters,
}: QuizSearchFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por título..."
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
        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <Select
            value={language}
            onValueChange={(v) => onLanguageChange(v as LanguageFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los idiomas</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <Select
            value={visibility}
            onValueChange={(v) => onVisibilityChange(v as VisibilityFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las visibilidades</SelectItem>
              <SelectItem value="private">Privado</SelectItem>
              <SelectItem value="public">Público</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <Select
            value={sort}
            onValueChange={(v) => onSortChange(v as QuizSort)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
              <SelectItem value="title-asc">A-Z</SelectItem>
              <SelectItem value="title-desc">Z-A</SelectItem>
            </SelectContent>
          </Select>
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
