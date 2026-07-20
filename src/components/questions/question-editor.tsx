'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrueFalseEditor } from '@/components/questions/fields/true-false-editor'
import { MultipleChoiceEditor } from '@/components/questions/fields/multiple-choice-editor'
import { MatchingEditor } from '@/components/questions/fields/matching-editor'
import { OrderingEditor } from '@/components/questions/fields/ordering-editor'
import type { Question, QuestionType } from '@/types/database'

interface QuestionEditorProps {
  quizId: string
  initialData?: Question
  onSave?: () => void
}

export function QuestionEditor({ quizId, initialData, onSave }: QuestionEditorProps) {
  const router = useRouter()

  const [type, setType] = useState<QuestionType>(initialData?.type ?? 'multiple-choice')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 1)
  const [points] = useState(initialData?.points ?? 1)
  const [explanation, setExplanation] = useState(initialData?.explanation ?? '')
  const [hint, setHint] = useState(initialData?.hint ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [correctAnswer, setCorrectAnswer] = useState<boolean>(true)
  const [options, setOptions] = useState([{ content: '', is_correct: false }])
  const [pairs, setPairs] = useState([{ left_text: '', right_text: '' }])
  const [items, setItems] = useState([{ content: '', correct_order: 1 }])

  const collectPayload = () => {
    const base = {
      type,
      content,
      difficulty,
      points,
      order_index: initialData?.order_index ?? 0,
      explanation: explanation || undefined,
      hint: hint || undefined,
    }

    switch (type) {
      case 'true-false':
        return { ...base, correct_answer: correctAnswer }
      case 'multiple-choice':
        return { ...base, options }
      case 'matching':
        return { ...base, pairs }
      case 'ordering':
        return { ...base, items }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const payload = collectPayload()

    if (initialData) {
      const res = await fetch(
        `/api/quizzes/${quizId}/questions/${initialData.id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
      )
      if (!res.ok) {
        const err = await res.json()
        const msg = err.error ?? 'Error al actualizar'
        setError(msg)
        toast.error(msg)
        setSaving(false)
        return
      }
      toast.success('Pregunta actualizada')
    } else {
      const res = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        const msg = err.error ?? 'Error al crear'
        setError(msg)
        toast.error(msg)
        setSaving(false)
        return
      }
      toast.success('Pregunta creada')
    }

    router.refresh()
    onSave?.()
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="question-type">Tipo</Label>
          <Select
            value={type}
            onValueChange={(v) => v && setType(v as QuestionType)}
          >
            <SelectTrigger id="question-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true-false">Verdadero / Falso</SelectItem>
              <SelectItem value="multiple-choice">Opción múltiple</SelectItem>
              <SelectItem value="matching">Relacionar</SelectItem>
              <SelectItem value="ordering">Ordenar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Dificultad</Label>
          <Select
            value={String(difficulty)}
            onValueChange={(v) => v && setDifficulty(Number(v))}
          >
            <SelectTrigger id="difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Pregunta</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe la pregunta..."
          rows={3}
        />
      </div>

      {type === 'true-false' && (
        <TrueFalseEditor value={correctAnswer} onChange={setCorrectAnswer} />
      )}
      {type === 'multiple-choice' && (
        <MultipleChoiceEditor value={options} onChange={setOptions} />
      )}
      {type === 'matching' && (
        <MatchingEditor value={pairs} onChange={setPairs} />
      )}
      {type === 'ordering' && (
        <OrderingEditor value={items} onChange={setItems} />
      )}

      <div className="space-y-2">
        <Label htmlFor="explanation">Explicación (opcional)</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explica por qué esta respuesta es correcta..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hint">Pista (opcional)</Label>
        <Input
          id="hint"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Una pista para ayudar a responder..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}
