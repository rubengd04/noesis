'use client'

import { Badge } from '@/components/ui/badge'
import type { Question, AnswerValue } from '@/types/database'
import { MultipleChoiceAnswer } from './answer-multiple-choice'
import { MatchingAnswer } from './answer-matching'
import { OrderingAnswer } from './answer-ordering'

interface QuestionRendererProps {
  question: Question & {
    question_options?: { id: string; content: string; is_correct?: boolean; order_index: number }[]
    question_pairs?: { id: string; left_text: string; right_text?: string; order_index: number }[]
    question_items?: { id: string; content: string; correct_order?: number; order_index: number }[]
  }
  answer: AnswerValue | null
  onAnswer: (answer: AnswerValue) => void
  disabled: boolean
}

export function QuestionRenderer({ question, answer, onAnswer, disabled }: QuestionRendererProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{typeLabel(question.type)}</Badge>
          <span className="text-sm text-muted-foreground">{question.points} pt{question.points !== 1 && 's'}</span>
        </div>
        <h2 className="text-xl font-semibold">{question.content}</h2>
        {question.hint && (
          <p className="text-sm text-muted-foreground italic">{question.hint}</p>
        )}
      </div>

      {renderAnswer(question, answer, onAnswer, disabled)}
    </div>
  )
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

function renderAnswer(
  question: QuestionRendererProps['question'],
  answer: AnswerValue | null,
  onAnswer: (answer: AnswerValue) => void,
  disabled: boolean,
) {
  switch (question.type) {
    case 'true-false': {
      const val = answer && 'value' in answer ? (answer as { value: boolean }).value : null
      return (
        <div className="flex gap-4">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer({ value: v })}
              className={`flex-1 rounded-lg border p-6 text-center text-lg font-medium transition-colors ${
                val === v
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-accent'
              } disabled:opacity-50`}
            >
              {v ? 'Verdadero' : 'Falso'}
            </button>
          ))}
        </div>
      )
    }

    case 'multiple-choice': {
      const selectedIds = answer && 'selectedOptionIds' in answer
        ? (answer as { selectedOptionIds: string[] }).selectedOptionIds
        : []
      const options = (question.question_options ?? []).map((o) => ({
        id: o.id,
        content: o.content,
      }))
      return (
        <MultipleChoiceAnswer
          options={options}
          selectedIds={selectedIds}
          onSelect={(ids) => onAnswer({ selectedOptionIds: ids })}
          disabled={disabled}
        />
      )
    }

    case 'matching': {
      const pairs = (question.question_pairs ?? []).map((p) => ({
        id: p.id,
        left_text: p.left_text,
      }))
      const rightOptions = (question.question_pairs ?? []).map((p) => p.right_text ?? '')
      const val = answer && 'pairs' in answer
        ? (answer as { pairs: { pairId: string; matchedRight: string }[] }).pairs
        : []
      return (
        <MatchingAnswer
          pairs={pairs}
          rightOptions={rightOptions}
          value={val}
          onChange={(pairs) => onAnswer({ pairs })}
          disabled={disabled}
        />
      )
    }

    case 'ordering': {
      const items = (question.question_items ?? []).map((it) => ({
        id: it.id,
        content: it.content,
      }))
      const itemOrder = answer && 'itemOrder' in answer
        ? (answer as { itemOrder: string[] }).itemOrder
        : items.map((it) => it.id)
      return (
        <OrderingAnswer
          items={items}
          itemOrder={itemOrder}
          onChange={(order) => onAnswer({ itemOrder: order })}
          disabled={disabled}
        />
      )
    }

    default:
      return <p className="text-muted-foreground">Tipo de pregunta no soportado</p>
  }
}
