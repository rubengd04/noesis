'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface QuestionNavigatorProps {
  timeLimitMinutes?: number
  answeredCount: number
  totalCount: number
  submitting: boolean
  onSubmit: () => void
  onTimeExpire?: () => void
  currentIndex: number
}

export function QuestionNavigator({
  timeLimitMinutes,
  answeredCount,
  totalCount,
  submitting,
  onSubmit,
  onTimeExpire,
  currentIndex,
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
  const secs = displaySeconds % 60
  const urgent = hasTimeLimit && secondsElapsed >= timeLimitMinutes * 60 - 60

  return (
    <div className="flex items-center gap-3">
      {/* Timer */}
      {hasTimeLimit && (
        <div className={cn('flex items-center gap-1 text-sm tabular-nums', urgent ? 'text-destructive' : 'text-muted-foreground')}>
          <Clock size={14} />
          <span className={cn('font-mono', urgent && 'animate-pulse')}>
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Submit */}
      <Dialog>
        <DialogTrigger render={<Button variant="default" size="sm" disabled={submitting} />}>
          {submitting ? 'Enviando...' : 'Finalizar intento'}
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
    </div>
  )
}
