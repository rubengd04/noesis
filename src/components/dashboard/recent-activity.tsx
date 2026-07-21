'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { AttemptSummary } from '@/types/api'

function formatRelativeDate(iso: string): string {
  const now = new Date()
  const d = new Date(iso)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 3_600_000)
    if (diffHours === 0) return 'hace minutos'
    return `hace ${diffHours}h`
  }
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) {
    const daysOfWeek = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
    return daysOfWeek[d.getDay()]
  }
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
  })
}

function scoreBgColor(percentage: number): string {
  if (percentage >= 80) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (percentage >= 60) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  return 'bg-red-50 text-red-700 ring-red-600/20'
}

interface RecentActivityProps {
  attempts: AttemptSummary[]
}

export function RecentActivity({ attempts }: RecentActivityProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Actividad reciente</h2>
      <Card>
        <CardContent className="p-0 divide-y">
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aún no tienes intentos
            </p>
          ) : (
            attempts.map((item) => (
              <Link
                key={item.id}
                href={`/quiz/${item.quiz_id}/attempt/${item.id}/results`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`inline-flex items-center rounded-md ring-1 px-2 py-0.5 text-xs font-medium ${scoreBgColor(item.percentage)}`}>
                    {item.percentage}%
                  </span>
                  <span className="truncate">{item.quiz_title ?? 'Quiz eliminado'}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                  <span className="text-xs">{formatRelativeDate(item.created_at)}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))
          )}
        </CardContent>
        {attempts.length > 0 && (
          <div className="border-t">
            <Link
              href="/history"
              className="flex items-center justify-center gap-1 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver historial completo
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </Card>
    </section>
  )
}
