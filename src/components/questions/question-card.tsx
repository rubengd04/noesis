'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Question } from '@/types/database'

interface QuestionCardProps {
  question: Question
  onEdit: (question: Question) => void
  onDelete: (questionId: string) => void
}

const typeLabels: Record<string, string> = {
  'true-false': 'V/F',
  'multiple-choice': 'Opción múltiple',
  matching: 'Relacionar',
  ordering: 'Ordenar',
}

export function QuestionCard({ question, onEdit, onDelete }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{typeLabels[question.type] ?? question.type}</Badge>
          <Badge variant="secondary">{question.difficulty}/3</Badge>
          <span className="text-sm text-muted-foreground">{question.points} pt{question.points !== 1 && 's'}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(question)}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onDelete(question.id)}
          >
            Eliminar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{question.content}</p>
      </CardContent>
    </Card>
  )
}
