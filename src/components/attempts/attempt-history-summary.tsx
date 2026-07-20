'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import type { AttemptSummary, HistorySummary } from '@/types/api'

export function AttemptHistorySummary() {
  const [data, setData] = useState<AttemptSummary[]>([])
  const [summary, setSummary] = useState<HistorySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attempts?limit=5&page=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setData(json.data ?? [])
          setSummary(json.summary ?? null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!summary || summary.totalAttempts === 0) return null

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

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Tu progreso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[100px] rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{summary.totalAttempts}</p>
            <p className="text-xs text-muted-foreground">intentos</p>
          </div>
          <div className="flex-1 min-w-[100px] rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{summary.avgPercentage}%</p>
            <p className="text-xs text-muted-foreground">promedio</p>
          </div>
          <div className="flex-1 min-w-[100px] rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{summary.passRate}%</p>
            <p className="text-xs text-muted-foreground">aprobados</p>
          </div>
        </div>

        {data.length > 0 && (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Últimos intentos</p>
              {data.map((item) => (
                <Link
                  key={item.id}
                  href={`/quiz/${item.quiz_id}/attempt/${item.id}/results`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{item.quiz_title ?? 'Quiz eliminado'}</span>
                    <Badge variant={item.passed ? 'default' : 'destructive'} className="shrink-0">
                      {item.percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                    <span className="text-xs">{formatTime(item.time_seconds)}</span>
                    <span className="text-xs">{formatDate(item.created_at)}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/dashboard/history"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver historial completo
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
