'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttemptStartProps {
  quiz: {
    title: string
    description: string | null
    time_limit_minutes: number | null
    scoring_mode: string
  }
  totalQuestions: number
  attemptsLeft: number | null
  onStart: (config: { questionCount: number; difficulty: string }) => void
  loading: boolean
}

export function AttemptStart({ quiz, totalQuestions, attemptsLeft, onStart, loading }: AttemptStartProps) {
  const [questionCount, setQuestionCount] = useState<number>(totalQuestions)
  const [difficulty, setDifficulty] = useState('Mixta')

  const scoringLabel = quiz.scoring_mode === 'all-or-nothing' ? 'Todo o nada' : 'Puntuación parcial'

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 min-h-[80dvh] justify-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">{quiz.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">Configura cómo quieres practicar</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 text-left">
        {/* Number of questions */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Número de preguntas</label>
          <input
            type="number"
            min={1}
            max={totalQuestions}
            value={questionCount}
            onChange={(e) => {
              const v = Math.min(totalQuestions, Math.max(1, parseInt(e.target.value) || 1))
              setQuestionCount(v)
            }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 tabular-nums"
          />
          <span className="text-xs text-muted-foreground">Máximo: {totalQuestions} preguntas</span>
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Dificultad</label>
          <div className="flex gap-2 flex-wrap">
            {['Mixta', 'Fácil', 'Medio', 'Difícil'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                  difficulty === d
                    ? 'bg-brand border-brand text-brand-foreground'
                    : 'border-border text-muted-foreground hover:border-brand/40',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{scoringLabel}</Badge>
          {quiz.time_limit_minutes && (
            <Badge variant="outline">{quiz.time_limit_minutes} minutos</Badge>
          )}
          <Badge variant="outline">
            {attemptsLeft !== null
              ? `${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''}`
              : 'Intentos ilimitados'}
          </Badge>
        </div>
      </div>

      <Button
        onClick={() => onStart({ questionCount, difficulty })}
        disabled={loading || attemptsLeft === 0}
        className="bg-brand hover:bg-brand/90 text-brand-foreground h-12 text-base gap-2"
      >
        {loading ? 'Preparando...' : 'Comenzar intento'}
        <ChevronRight size={18} />
      </Button>
    </div>
  )
}
