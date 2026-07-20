'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import type { AttemptSummary } from '@/types/api'

interface QuizAttemptHistoryProps {
  quizId: string
}

export function QuizAttemptHistory({ quizId }: QuizAttemptHistoryProps) {
  const [data, setData] = useState<AttemptSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/attempts?quizId=${quizId}&limit=5&page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setData(json.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [quizId])

  if (loading) return null
  if (data.length === 0) return null

  function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Tus intentos anteriores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {data.map((item) => (
            <Link
              key={item.id}
              href={`/quiz/${item.quiz_id}/attempt/${item.id}/results`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{item.quiz_title ?? 'Quiz'}</span>
                <Badge variant={item.passed ? 'default' : 'destructive'} className="shrink-0">
                  {item.percentage}%
                </Badge>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                <span className="text-xs">{formatDate(item.created_at)}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <Link
          href={`/history?quizId=${quizId}`}
          className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver historial completo
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
