'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface ResultAnswer {
  questionId: string
  isCorrect: boolean
  pointsEarned: number
}

interface ResultData {
  attempt: {
    score: number
    max_score: number
    time_seconds: number | null
    status: string
  }
  results: ResultAnswer[]
  totalScore: number
  maxScore: number
  percentage: number
  passed: boolean
  questions: {
    id: string
    type: string
    content: string
    points: number
    explanation: string | null
    question_options?: { id: string; content: string; is_correct: boolean; order_index: number }[]
    question_pairs?: { id: string; left_text: string; right_text: string; order_index: number }[]
    question_items?: { id: string; content: string; correct_order: number; order_index: number }[]
  }[]
}

export default function ResultsPage() {
  const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>()
  const router = useRouter()
  const [data, setData] = useState<ResultData | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/quizzes/${quizId}/attempts/${attemptId}`)
      if (!res.ok) {
        setError('Resultados no encontrados')
        return
      }
      const body = await res.json()
      setData(body)
    }
    load()
  }, [quizId, attemptId])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (error) {
    return <div className="flex justify-center pt-12 text-destructive">{error}</div>
  }

  if (!data) {
    return <div className="flex justify-center pt-12 text-muted-foreground">Cargando resultados...</div>
  }

  const { passed, percentage, totalScore, maxScore, results, questions } = data
  const timeSeconds = data.attempt.time_seconds
  const minutes = timeSeconds ? Math.floor(timeSeconds / 60) : null
  const seconds = timeSeconds ? timeSeconds % 60 : null

  // Build answer map
  const resultByQuestionId = new Map(results.map((r) => [r.questionId, r]))

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-8">
      <div className="text-center space-y-4">
        <div className={`inline-flex rounded-full p-3 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {passed ? (
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          ) : (
            <XCircle className="h-12 w-12 text-red-600" />
          )}
        </div>

        <h1 className="text-3xl font-bold">
          {passed ? '¡Aprobado!' : 'No aprobado'}
        </h1>

        <div className="text-5xl font-bold">{percentage}%</div>

        <p className="text-lg text-muted-foreground">
          {totalScore} / {maxScore} puntos
        </p>

        {minutes !== null && (
          <p className="text-sm text-muted-foreground">
            Tiempo: {minutes}:{String(seconds).padStart(2, '0')}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Link href={`/quiz/${quizId}/attempt`}>
          <Button variant="outline">Intentar de nuevo</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Volver al dashboard</Button>
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Detalle de preguntas</h2>
        {questions.map((q) => {
          const result = resultByQuestionId.get(q.id)
          const isExpanded = expanded.has(q.id)
          return (
            <Card key={q.id} className="cursor-pointer" onClick={() => toggle(q.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {result?.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                    )}
                    <span className="font-medium truncate">{q.content}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={result?.isCorrect ? 'default' : 'destructive'}>
                      {result?.pointsEarned ?? 0}/{q.points}
                    </Badge>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <p className="text-sm"><span className="font-medium">Tipo:</span> {typeLabel(q.type)}</p>

                    {q.type === 'true-false' && q.question_options && (
                      <div className="space-y-1">
                        {q.question_options.map((opt) => (
                          <p key={opt.id} className={`text-sm ${opt.is_correct ? 'text-green-600 font-medium' : ''}`}>
                            {opt.content} {opt.is_correct ? '(correcta)' : ''}
                          </p>
                        ))}
                      </div>
                    )}

                    {q.type === 'multiple-choice' && q.question_options && (
                      <div className="space-y-1">
                        {q.question_options.map((opt) => (
                          <p key={opt.id} className={`text-sm ${opt.is_correct ? 'text-green-600 font-medium' : ''}`}>
                            {opt.content} {opt.is_correct ? '(correcta)' : ''}
                          </p>
                        ))}
                      </div>
                    )}

                    {q.type === 'matching' && q.question_pairs && (
                      <div className="space-y-1">
                        {q.question_pairs.map((p) => (
                          <p key={p.id} className="text-sm">
                            <span className="font-medium">{p.left_text}</span> → {p.right_text}
                          </p>
                        ))}
                      </div>
                    )}

                    {q.type === 'ordering' && q.question_items && (
                      <div className="space-y-1">
                        {[...q.question_items]
                          .sort((a, b) => a.correct_order - b.correct_order)
                          .map((it, i) => (
                            <p key={it.id} className="text-sm">
                              {i + 1}. {it.content}
                            </p>
                          ))}
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-sm text-muted-foreground italic">{q.explanation}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function typeLabel(type: string): string {
  switch (type) {
    case 'true-false': return 'Verdadero / Falso'
    case 'multiple-choice': return 'Opción múltiple'
    case 'matching': return 'Relacionar'
    case 'ordering': return 'Ordenar'
    default: return type
  }
}
