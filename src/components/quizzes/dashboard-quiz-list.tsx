'use client'

import { useQuizList } from '@/hooks/use-quiz-list'
import { QuizCard } from '@/components/quizzes/quiz-card'
import { CreateQuizDialog } from '@/components/quizzes/create-quiz-dialog'
import { QuizSearchFilters } from '@/components/quizzes/quiz-search-filters'
import { QuizPagination } from '@/components/quizzes/quiz-pagination'
import { Button } from '@/components/ui/button'

export function DashboardQuizList() {
  const {
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
  } = useQuizList()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Quizzes</h1>
        <CreateQuizDialog />
      </div>

      <QuizSearchFilters
        search={search}
        language={language}
        visibility={visibility}
        sort={sort}
        hasFilters={hasFilters}
        onSearchChange={setSearch}
        onLanguageChange={setLanguage}
        onVisibilityChange={setVisibility}
        onSortChange={setSort}
        onResetFilters={resetFilters}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-lg border bg-muted/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => resetFilters()}>
            Reintentar
          </Button>
        </div>
      ) : data.length === 0 && !hasFilters ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Aún no tienes quizzes. Crea tu primer quiz.
          </p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            No se encontraron quizzes con esos filtros.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>

          <QuizPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
