'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnswerValue } from '@/types/database'
import { QuestionRenderer } from '@/components/attempt/question-renderer'
import { QuestionNavigator } from '@/components/attempt/question-navigator'

import type { QuestionType } from '@/types/database'

type QuestionData = {
  id: string
  quiz_id: string
  type: QuestionType
  content: string
  points: number
  hint: string | null
  difficulty: number
  order_index: number
  explanation: string | null
  created_at: string
  updated_at: string
  question_options?: { id: string; content: string; order_index: number }[]
  question_pairs?: { id: string; left_text: string; order_index: number }[]
  question_items?: { id: string; content: string; order_index: number }[]
}

export default function AttemptSessionPage() {
  const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>()
  const router = useRouter()
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitted = useRef(false)

  // Exit confirmation
  useEffect(() => {
    if (submitted.current) return
    if (Object.keys(answers).length === 0) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    const handlePopState = () => {
      const confirmed = window.confirm('¿Estás seguro? Si sales perderás tus respuestas.')
      if (!confirmed) {
        window.history.pushState(null, '', window.location.href)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [answers])

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/quizzes/${quizId}/attempts/${attemptId}`)
      if (!res.ok) {
        setError('Intento no encontrado')
        return
      }
      const data = await res.json()
      if (data.attempt.status !== 'in-progress') {
        router.replace(`/quiz/${quizId}/attempt/${attemptId}/results`)
        return
      }
      setQuestions(data.questions ?? [])
      setTimeLimit(data.quiz_time_limit ?? null)
    }
    load()
  }, [quizId, attemptId, router])

  const handleAnswer = useCallback((answer: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questions[currentIndex]?.id]: answer }))
  }, [currentIndex, questions])

  const answeredIndices = new Set(
    questions.map((q, i) => (answers[q.id] ? i : -1)).filter((i) => i !== -1),
  )

  const doSubmit = useCallback(async () => {
    if (submitted.current) return
    submitted.current = true
    setSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Error al enviar')
        toast.error(body.error ?? 'Error al enviar')
        setSubmitting(false)
        submitted.current = false
        return
      }
      toast.success('Intento enviado correctamente')
      router.push(`/quiz/${quizId}/attempt/${attemptId}/results`)
    } catch {
      setError('Error de conexión')
      toast.error('Error de conexión')
      setSubmitting(false)
      submitted.current = false
    }
  }, [quizId, attemptId, answers, router])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
  }, [questions.length])

  const goPrevious = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  if (error) {
    return <div className="flex justify-center pt-12 text-destructive">{error}</div>
  }

  if (questions.length === 0) {
    return <div className="flex justify-center pt-12 text-muted-foreground">Cargando preguntas...</div>
  }

  const question = questions[currentIndex]
  const progress = currentIndex / questions.length * 100

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">
      {/* Progress header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question card */}
      <QuestionRenderer
        question={question}
        answer={answers[question.id] ?? null}
        onAnswer={handleAnswer}
        disabled={submitting}
        onNext={currentIndex < questions.length - 1 ? goNext : doSubmit}
        isLast={currentIndex === questions.length - 1}
      />

      {/* Navigation footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrevious}
          disabled={currentIndex === 0}
        >
          Anterior
        </Button>

        <QuestionNavigator
          timeLimitMinutes={timeLimit ?? undefined}
          answeredCount={answeredIndices.size}
          totalCount={questions.length}
          submitting={submitting}
          onSubmit={doSubmit}
          onTimeExpire={doSubmit}
          currentIndex={currentIndex}
        />
      </div>
    </div>
  )
}
