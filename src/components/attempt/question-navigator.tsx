'use client'

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
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  submitting: boolean
}

export function QuestionNavigator({
  currentIndex,
  totalCount,
  answeredIndices,
  onPrevious,
  onNext,
  onSubmit,
  submitting,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Pregunta {currentIndex + 1} de {totalCount}
        </span>
        <div className="flex gap-1 ml-2">
          {Array.from({ length: totalCount }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === currentIndex
                  ? 'bg-primary'
                  : answeredIndices.has(i)
                    ? 'bg-primary/40'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
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
                    Has respondido {answeredIndices.size} de {totalCount} preguntas.
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
