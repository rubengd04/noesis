'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Lightbulb, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  onNext: () => void
  isLast: boolean
}

export function QuestionRenderer({ question, answer, onAnswer, disabled, onNext, isLast }: QuestionRendererProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const answerType = question.type === 'true-false' ? 'Verdadero / Falso'
    : question.type === 'multiple-choice' ? 'Opción múltiple'
    : question.type === 'matching' ? 'Relacionar'
    : question.type === 'ordering' ? 'Ordenar'
    : question.type

  const difficultyLabel = question.difficulty <= 1 ? 'Fácil'
    : question.difficulty === 2 ? 'Medio' : 'Difícil'

  const difficultyColor = question.difficulty <= 1
    ? 'bg-chart-3/10 text-chart-3 border-chart-3/30'
    : question.difficulty === 2
      ? 'bg-chart-4/10 text-chart-4 border-chart-4/30'
      : 'bg-chart-5/10 text-chart-5 border-chart-5/30'

  const hasAnswer = answer !== null
  const canConfirm = hasAnswer && !confirmed

  const handleConfirm = () => {
    if (!hasAnswer) return
    setConfirmed(true)
  }

  const handleNext = () => {
    setConfirmed(false)
    setShowHint(false)
    onNext()
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Question header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">{answerType}</Badge>
          <Badge variant="outline" className={cn('text-xs', difficultyColor)}>
            {difficultyLabel}
          </Badge>
        </div>
        <h2 className="text-lg font-semibold text-foreground leading-relaxed">{question.content}</h2>
      </div>

      {/* Answer area */}
      <div className="p-6 flex flex-col gap-3">
        {renderAnswer(question, answer, onAnswer, disabled, confirmed)}

        {/* Hint toggle */}
        {question.hint && !confirmed && (
          <>
            {showHint && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-subtle border border-brand/20">
                <Lightbulb size={16} className="text-brand mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{question.hint}</p>
              </div>
            )}
          </>
        )}

        {/* Explanation after confirm */}
        {confirmed && question.explanation && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-brand-subtle/50 border-brand/20">
            <Lightbulb size={15} className="text-brand mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{question.explanation}</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-6 pb-6 flex items-center justify-between">
        {!confirmed && question.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
          >
            <Lightbulb size={15} />
            {showHint ? 'Ocultar pista' : 'Ver pista'}
          </button>
        )}
        {!confirmed && !question.hint && <div />}
        {confirmed ? (
          <Button onClick={handleNext} className="ml-auto bg-brand hover:bg-brand/90 text-brand-foreground gap-2">
            {isLast ? 'Ver resultado' : 'Siguiente'}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="ml-auto bg-brand hover:bg-brand/90 text-brand-foreground disabled:opacity-40 gap-2"
          >
            Confirmar
            <Check size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}

function renderAnswer(
  question: QuestionRendererProps['question'],
  answer: AnswerValue | null,
  onAnswer: (answer: AnswerValue) => void,
  disabled: boolean,
  confirmed: boolean,
) {
  switch (question.type) {
    case 'true-false': {
      const val = answer && 'value' in answer ? (answer as { value: boolean }).value : null
      return (
        <div className="grid grid-cols-2 gap-3">
          {[{ id: 'true' as const, label: 'Verdadero' }, { id: 'false' as const, label: 'Falso' }].map((opt) => {
            const isSelected = answer !== null && 'value' in answer && (answer as { value: boolean }).value === (opt.id === 'true')
            const isCorrectOpt = false // We don't know correct answer on the client
            let optStyle = 'border-border hover:border-brand/50 hover:bg-brand-subtle/30'
            if (isSelected) {
              optStyle = 'border-brand bg-brand-subtle'
            }
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled || confirmed}
                onClick={() => onAnswer({ value: opt.id === 'true' })}
                className={cn('p-5 rounded-xl border text-center font-semibold text-sm transition-all', optStyle, 'disabled:opacity-50 disabled:cursor-not-allowed')}
              >
                {opt.label}
              </button>
            )
          })}
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
          disabled={disabled || confirmed}
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
          disabled={disabled || confirmed}
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
          disabled={disabled || confirmed}
        />
      )
    }

    default:
      return <p className="text-muted-foreground">Tipo de pregunta no soportado</p>
  }
}
