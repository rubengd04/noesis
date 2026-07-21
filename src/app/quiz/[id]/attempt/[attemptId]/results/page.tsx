'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, ChevronDown, Trophy, Zap, Target, BookOpen, RotateCcw, BarChart2, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnswerValue } from '@/types/database'

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
    difficulty: number
    question_options?: { id: string; content: string; is_correct: boolean; order_index: number }[]
    question_pairs?: { id: string; left_text: string; right_text: string; order_index: number }[]
    question_items?: { id: string; content: string; correct_order: number; order_index: number }[]
  }[]
}

export default function ResultsPage() {
  const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>()
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
  const incorrect = maxScore - totalScore

  const resultByQuestionId = new Map(results.map((r) => [r.questionId, r]))
  const userAnswerByQuestionId = new Map(
    (data as ResultData & { userAnswers?: { questionId: string; answer: AnswerValue }[] })
      .userAnswers?.map((ua) => [ua.questionId, ua.answer]) ?? [],
  )

  const gradeConfig =
    percentage === 100
      ? { label: 'Perfecto', sub: 'Respondiste todo correctamente.', color: 'text-chart-3', ring: 'text-chart-3', icon: Trophy }
      : percentage >= 80
        ? { label: 'Excelente', sub: 'Gran resultado, sigue así.', color: 'text-brand', ring: 'text-brand', icon: Zap }
        : percentage >= 60
          ? { label: 'Bien', sub: 'Vas por buen camino.', color: 'text-chart-4', ring: 'text-chart-4', icon: Target }
          : { label: 'Sigue practicando', sub: 'Revisa las respuestas y vuelve a intentarlo.', color: 'text-chart-5', ring: 'text-chart-5', icon: BookOpen }

  const GradeIcon = gradeConfig.icon
  const circumference = 2 * Math.PI * 54

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">
      {/* ── Hero card ── */}
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6 text-center">
        {/* Donut + grade icon */}
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64" cy="64" r="54"
              fill="none" stroke="currentColor" strokeWidth="10"
              className="text-border"
            />
            <circle
              cx="64" cy="64" r="54"
              fill="none" stroke="currentColor" strokeWidth="10"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${circumference * (1 - percentage / 100)}`}
              strokeLinecap="round"
              className={gradeConfig.ring}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-3xl font-bold text-foreground">{percentage}%</span>
          </div>
        </div>

        {/* Grade label */}
        <div className="flex flex-col items-center gap-1">
          <div className={cn('flex items-center gap-2', gradeConfig.color)}>
            <GradeIcon size={20} />
            <h2 className="text-2xl font-bold">{gradeConfig.label}</h2>
          </div>
          <p className="text-muted-foreground text-sm">{gradeConfig.sub}</p>
          {minutes !== null && (
            <p className="text-xs text-muted-foreground">
              Tiempo: {minutes}:{String(seconds).padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="w-full grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-chart-3/10 border border-chart-3/20 p-3 flex flex-col items-center gap-1">
            <Check size={16} className="text-chart-3" />
            <span className="text-xl font-bold text-foreground">{totalScore}</span>
            <span className="text-xs text-muted-foreground">Correctas</span>
          </div>
          <div className="rounded-xl bg-chart-5/10 border border-chart-5/20 p-3 flex flex-col items-center gap-1">
            <X size={16} className="text-chart-5" />
            <span className="text-xl font-bold text-foreground">{incorrect}</span>
            <span className="text-xs text-muted-foreground">Incorrectas</span>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-3 flex flex-col items-center gap-1">
            <BookOpen size={16} className="text-muted-foreground" />
            <span className="text-xl font-bold text-foreground">{maxScore}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3 w-full">
          <Link href={`/quiz/${quizId}/attempt`} className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <RotateCcw size={15} />
              Reintentar
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full gap-2 bg-brand hover:bg-brand/90 text-brand-foreground">
              <BarChart2 size={15} />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Review section ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Revisión de respuestas</h3>
          <span className="text-xs text-muted-foreground">
            Haz clic en cada pregunta para ver el detalle
          </span>
        </div>

        {questions.map((q, i) => (
          <QuestionReview
            key={q.id}
            q={q}
            index={i}
            result={resultByQuestionId.get(q.id)}
            userAnswer={userAnswerByQuestionId.get(q.id)}
            isExpanded={expanded.has(q.id)}
            onToggle={() => toggle(q.id)}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Question Review ── */

function difficultyLabel(d: number): string {
  return d <= 1 ? 'Fácil' : d === 2 ? 'Medio' : 'Difícil'
}

function difficultyColor(d: number): string {
  return d <= 1
    ? 'bg-chart-3/10 text-chart-3 border-chart-3/30'
    : d === 2
      ? 'bg-chart-4/10 text-chart-4 border-chart-4/30'
      : 'bg-chart-5/10 text-chart-5 border-chart-5/30'
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

function getOptionLabel(q: ResultData['questions'][0], id: string): string {
  if (q.type === 'multiple-choice') return q.question_options?.find((o) => o.id === id)?.content ?? id
  if (q.type === 'true-false') return id === 'true' ? 'Verdadero' : 'Falso'
  return id
}

interface QuestionReviewProps {
  q: ResultData['questions'][0]
  index: number
  result: ResultAnswer | undefined
  userAnswer: AnswerValue | undefined
  isExpanded: boolean
  onToggle: () => void
}

function QuestionReview({ q, index, result, userAnswer, isExpanded, onToggle }: QuestionReviewProps) {
  const correct = result?.isCorrect ?? false
  const skipped = !userAnswer

  const renderUserAnswerContent = () => {
    if (!userAnswer) return <span className="text-muted-foreground">Sin respuesta</span>

    switch (q.type) {
      case 'true-false': {
        const val = 'value' in userAnswer ? (userAnswer as { value: boolean }).value : null
        return <span>{val === true ? 'Verdadero' : val === false ? 'Falso' : '—'}</span>
      }
      case 'multiple-choice': {
        const selectedIds = 'selectedOptionIds' in userAnswer
          ? (userAnswer as { selectedOptionIds: string[] }).selectedOptionIds
          : []
        const texts = selectedIds.map((id) => q.question_options?.find((o) => o.id === id)?.content).filter(Boolean)
        if (texts.length === 0) return <span className="text-muted-foreground">Ninguna</span>
        return (
          <ul className="list-disc list-inside space-y-0.5">
            {texts.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        )
      }
      case 'matching': {
        const pairs = 'pairs' in userAnswer
          ? (userAnswer as { pairs: { pairId: string; matchedRight: string }[] }).pairs
          : []
        if (pairs.length === 0) return <span className="text-muted-foreground">Ninguno</span>
        return (
          <div className="space-y-0.5">
            {pairs.map((p) => {
              const leftText = q.question_pairs?.find((pp) => pp.id === p.pairId)?.left_text
              return <p key={p.pairId}><span className="font-medium">{leftText ?? '?'}</span> → {p.matchedRight}</p>
            })}
          </div>
        )
      }
      case 'ordering': {
        const itemOrder = 'itemOrder' in userAnswer
          ? (userAnswer as { itemOrder: string[] }).itemOrder
          : []
        if (itemOrder.length === 0) return <span className="text-muted-foreground">Ninguno</span>
        return (
          <div className="space-y-0.5">
            {itemOrder.map((id, i) => {
              const content = q.question_items?.find((it) => it.id === id)?.content
              return <p key={id}>{i + 1}. {content ?? '?'}</p>
            })}
          </div>
        )
      }
      default:
        return <span className="text-muted-foreground italic">Tipo no soportado</span>
    }
  }

  const renderCorrectAnswer = () => {
    switch (q.type) {
      case 'true-false':
      case 'multiple-choice': {
        if (!q.question_options) return null
        return (
          <div className="space-y-0.5">
            {q.question_options.filter((o) => o.is_correct).map((opt) => (
              <p key={opt.id} className="font-medium">{opt.content}</p>
            ))}
          </div>
        )
      }
      case 'matching': {
        if (!q.question_pairs) return null
        return (
          <div className="space-y-0.5">
            {q.question_pairs.map((p) => (
              <p key={p.id}><span className="font-medium">{p.left_text}</span> → {p.right_text}</p>
            ))}
          </div>
        )
      }
      case 'ordering': {
        if (!q.question_items) return null
        return (
          <div className="space-y-0.5">
            {[...q.question_items].sort((a, b) => a.correct_order - b.correct_order).map((it, i) => (
              <p key={it.id}>{i + 1}. {it.content}</p>
            ))}
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden transition-colors',
        correct ? 'border-chart-3/30' : skipped ? 'border-border' : 'border-chart-5/30',
      )}
    >
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
            correct ? 'bg-chart-3' : skipped ? 'bg-muted' : 'bg-chart-5',
          )}
        >
          {correct ? (
            <Check size={13} className="text-white" />
          ) : skipped ? (
            <span className="text-xs text-muted-foreground font-bold">—</span>
          ) : (
            <X size={13} className="text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted-foreground font-medium">Pregunta {index + 1}</span>
          <p className="text-sm font-medium text-foreground leading-snug mt-0.5 truncate pr-2">{q.content}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn('text-xs hidden sm:inline-flex', difficultyColor(q.difficulty))}
          >
            {difficultyLabel(q.difficulty)}
          </Badge>
          <ChevronDown
            size={16}
            className={cn('text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')}
          />
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-border/50 pt-4">
          <p className="text-sm text-foreground leading-relaxed">{q.content}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              className={cn(
                'rounded-xl border p-3 flex flex-col gap-1',
                correct ? 'border-chart-3/40 bg-chart-3/8' : 'border-chart-5/40 bg-chart-5/8',
              )}
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tu respuesta
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  correct ? 'text-chart-3' : skipped ? 'text-muted-foreground' : 'text-chart-5',
                )}
              >
                {renderUserAnswerContent()}
              </span>
            </div>

            {!correct && (
              <div className="rounded-xl border border-chart-3/40 bg-chart-3/8 p-3 flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Respuesta correcta
                </span>
                <span className="text-sm font-medium text-chart-3">
                  {renderCorrectAnswer()}
                </span>
              </div>
            )}
          </div>

          {q.explanation && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-subtle/50 border border-brand/20">
              <Lightbulb size={15} className="text-brand mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
