'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
        setSubmitting(false)
        submitted.current = false
        return
      }
      router.push(`/quiz/${quizId}/attempt/${attemptId}/results`)
    } catch {
      setError('Error de conexión')
      setSubmitting(false)
      submitted.current = false
    }
  }, [quizId, attemptId, answers, router])

  if (error) {
    return <div className="flex justify-center pt-12 text-destructive">{error}</div>
  }

  if (questions.length === 0) {
    return <div className="flex justify-center pt-12 text-muted-foreground">Cargando preguntas...</div>
  }

  const question = questions[currentIndex]

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-8">
      <Card>
        <CardContent className="p-6">
          <QuestionRenderer
            question={question}
            answer={answers[question.id] ?? null}
            onAnswer={handleAnswer}
            disabled={submitting}
          />
        </CardContent>
      </Card>

      <QuestionNavigator
        currentIndex={currentIndex}
        totalCount={questions.length}
        answeredIndices={answeredIndices}
        timeLimitMinutes={timeLimit ?? undefined}
        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
        onSubmit={doSubmit}
        submitting={submitting}
        onTimeExpire={doSubmit}
      />
    </div>
  )
}
