'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AttemptStart } from '@/components/attempt/attempt-start'

export default function AttemptStartPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quiz, setQuiz] = useState<{
    title: string
    description: string | null
    time_limit_minutes: number | null
    scoring_mode: string
  } | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/quizzes/${id}`)
      if (!res.ok) {
        setError('Quiz no encontrado')
        setLoading(false)
        return
      }
      const data = await res.json()
      setQuiz({
        title: data.title,
        description: data.description,
        time_limit_minutes: data.time_limit_minutes,
        scoring_mode: data.scoring_mode,
      })
      setTotalQuestions(data._questionCount ?? 0)
      setAttemptsLeft(data.max_attempts ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  const handleStart = async (config: { questionCount: number; difficulty: string }) => {
    setStarting(true)
    try {
      const res = await fetch(`/api/quizzes/${id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Error al comenzar')
        setStarting(false)
        return
      }
      const data = await res.json()
      router.push(`/quiz/${id}/attempt/${data.attempt.id}`)
    } catch {
      setError('Error de conexión')
      setStarting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center pt-12 text-muted-foreground">Cargando...</div>
  }

  if (error || !quiz) {
    return <div className="flex justify-center pt-12 text-destructive">{error ?? 'Quiz no encontrado'}</div>
  }

  return (
    <AttemptStart
      quiz={quiz}
      totalQuestions={totalQuestions}
      attemptsLeft={attemptsLeft}
      onStart={handleStart}
      loading={starting}
    />
  )
}
