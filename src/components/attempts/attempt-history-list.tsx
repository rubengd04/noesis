'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { QuizPagination } from '@/components/quizzes/quiz-pagination'
import { RotateCcw, ExternalLink } from 'lucide-react'
import type { AttemptSummary } from '@/types/api'

interface AttemptHistoryListProps {
  data: AttemptSummary[]
  total: number
  page: number
  totalPages: number
  limit: number
  loading: boolean
  onPageChange: (page: number) => void
}

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AttemptHistoryList({
  data,
  total,
  page,
  totalPages,
  limit,
  loading,
  onPageChange,
}: AttemptHistoryListProps) {
  if (loading && data.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-5 w-3/4 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-medium">Aún no has realizado ningún quiz</p>
        <p className="text-sm text-muted-foreground">
          Comienza un quiz desde el dashboard para ver tu historial aquí.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Ir al dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border">
        {data.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/quiz/${item.quiz_id}/attempt/${item.id}/results`}
                className="font-medium hover:underline truncate block"
              >
                {item.quiz_title ?? 'Quiz eliminado'}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{formatDate(item.created_at)}</span>
                <span className="text-xs">·</span>
                <span>{formatTime(item.time_seconds)}</span>
                <span className="text-xs">·</span>
                <span>
                  {item.num_correct}/{item.num_questions} aciertos
                </span>
                <span className="text-xs">·</span>
                <span className="capitalize">{item.scoring_mode.replace(/-/g, ' ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={item.passed ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                {item.percentage}%
              </Badge>

              <Link
                href={`/quiz/${item.quiz_id}/attempt/${item.id}/results`}
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Resultados
                </Button>
              </Link>

              <Link href={`/quiz/${item.quiz_id}/attempt`}>
                <Button variant="outline" size="sm">
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Repetir
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <QuizPagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={onPageChange}
        label="intentos"
      />
    </div>
  )
}
