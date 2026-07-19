'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AttemptStartProps {
  quiz: {
    title: string
    description: string | null
    time_limit_minutes: number | null
    scoring_mode: string
  }
  questionCount: number
  attemptsLeft: number | null
  onStart: () => void
  loading: boolean
}

export function AttemptStart({ quiz, questionCount, attemptsLeft, onStart, loading }: AttemptStartProps) {
  const scoringLabel = quiz.scoring_mode === 'all-or-nothing' ? 'Todo o nada' : 'Puntuación parcial'

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-muted-foreground">{quiz.description}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="outline">{questionCount} preguntas</Badge>
        <Badge variant="outline">{scoringLabel}</Badge>
        {quiz.time_limit_minutes && (
          <Badge variant="outline">{quiz.time_limit_minutes} minutos</Badge>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {attemptsLeft !== null
          ? `Te quedan ${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''}`
          : 'Intentos ilimitados'}
      </p>

      <div className="flex justify-center">
        <Button size="lg" onClick={onStart} disabled={loading || attemptsLeft === 0}>
          {loading ? 'Preparando...' : 'Comenzar intento'}
        </Button>
      </div>
    </div>
  )
}
