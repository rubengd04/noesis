'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

interface QuestionNavigatorProps {
  currentIndex: number
  totalCount: number
  answeredIndices: Set<number>
  timeLimitMinutes?: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  submitting: boolean
  onTimeExpire?: () => void
}

export function QuestionNavigator({
  currentIndex,
  totalCount,
  answeredIndices,
  timeLimitMinutes,
  onPrevious,
  onNext,
  onSubmit,
  submitting,
  onTimeExpire,
}: QuestionNavigatorProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const expired = useRef(false)

  const hasTimeLimit = timeLimitMinutes != null && timeLimitMinutes > 0

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1

        if (hasTimeLimit && onTimeExpire) {
          const maxSeconds = timeLimitMinutes * 60
          if (next >= maxSeconds) {
            clearInterval(interval)
            if (!expired.current) {
              expired.current = true
              onTimeExpire()
            }
            return maxSeconds
          }
        }

        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [hasTimeLimit, timeLimitMinutes, onTimeExpire])

  const displaySeconds = hasTimeLimit
    ? Math.max(0, timeLimitMinutes * 60 - secondsElapsed)
    : secondsElapsed

  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const urgent = hasTimeLimit && secondsElapsed >= timeLimitMinutes * 60 - 60

  const answeredCount = answeredIndices.size

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Pregunta {currentIndex + 1} de {totalCount}
        </span>
        <span
          className={`font-mono font-bold text-lg tabular-nums ${
            urgent ? 'text-destructive animate-pulse' : 'text-foreground'
          }`}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
        />
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          Anterior
        </Button>

        <div className="flex gap-2">
          {currentIndex < totalCount - 1 ? (
            <Button onClick={onNext}>
              Siguiente
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger render={<Button disabled={submitting} />}>
                {submitting ? 'Enviando...' : 'Enviar intento'}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar intento</DialogTitle>
                  <DialogDescription>
                    Has respondido {answeredCount} de {totalCount} preguntas.
                    Una vez enviado no podrás modificar tus respuestas.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Cancelar
                  </DialogClose>
                  <Button onClick={onSubmit}>
                    Enviar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}
