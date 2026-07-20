'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { QuestionType } from '@/types/database'

// ─── Local types ──────────────────────────────────────────────

type Difficulty = 1 | 2 | 3

interface OptionDraft {
  content: string
  is_correct: boolean
}

interface PairDraft {
  left_text: string
  right_text: string
}

interface ItemDraft {
  content: string
  correct_order: number
}

interface QuestionDraft {
  id: string
  type: QuestionType
  content: string
  difficulty: Difficulty
  points: number
  explanation: string
  hint: string
  expanded: boolean

  // type-specific
  correct_answer: boolean // true-false
  options: OptionDraft[] // multiple-choice
  pairs: PairDraft[] // matching
  items: ItemDraft[] // ordering
}

type Mode = 'manual' | 'ai'

// ─── Constants ────────────────────────────────────────────────

const questionTypes: {
  value: QuestionType
  label: string
  description: string
}[] = [
  {
    value: 'true-false',
    label: 'Verdadero / Falso',
    description: 'El estudiante indica si la afirmación es verdadera o falsa',
  },
  {
    value: 'multiple-choice',
    label: 'Opción múltiple',
    description: '4 opciones, una correcta',
  },
  {
    value: 'matching',
    label: 'Relacionar columnas',
    description: 'Conecta conceptos de dos listas',
  },
  {
    value: 'ordering',
    label: 'Ordenar',
    description: 'Organiza elementos en la secuencia correcta',
  },
]

const difficultyLabels: Record<Difficulty, string> = {
  1: 'Fácil',
  2: 'Medio',
  3: 'Difícil',
}

const difficultyColor: Record<Difficulty, string> = {
  1: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  2: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  3: 'bg-chart-5/15 text-chart-5 border-chart-5/30',
}

function generateId(): string {
  return `q_${crypto.randomUUID()}`
}

function createEmptyQuestion(type: QuestionType): QuestionDraft {
  return {
    id: generateId(),
    type,
    content: '',
    difficulty: 1,
    points: 1,
    explanation: '',
    hint: '',
    expanded: true,
    correct_answer: true,
    options:
      type === 'multiple-choice'
        ? [
            { content: '', is_correct: false },
            { content: '', is_correct: false },
            { content: '', is_correct: false },
            { content: '', is_correct: false },
          ]
        : [],
    pairs:
      type === 'matching'
        ? [
            { left_text: '', right_text: '' },
            { left_text: '', right_text: '' },
          ]
        : [],
    items:
      type === 'ordering'
        ? [
            { content: '', correct_order: 1 },
            { content: '', correct_order: 2 },
            { content: '', correct_order: 3 },
          ]
        : [],
  }
}

// ─── Component ────────────────────────────────────────────────

export function QuizBuilder() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('manual')
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [language, setLanguage] = useState<'es' | 'en'>('es')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [scoringMode, setScoringMode] = useState<'all-or-nothing' | 'partial'>('all-or-nothing')
  const [passPercentage, setPassPercentage] = useState(70)
  const [maxAttempts, setMaxAttempts] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [selectedType, setSelectedType] = useState<QuestionType>('multiple-choice')

  // AI placeholder state
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Save state
  const [saving, setSaving] = useState(false)

  // ─── Handlers ──────────────────────────────────────────────────

  const toggleExpand = useCallback((id: string) => {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, expanded: !q.expanded } : q)),
    )
  }, [])

  const removeQuestion = useCallback((id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id))
  }, [])

  const addQuestion = useCallback(() => {
    setQuestions((qs) => [...qs, createEmptyQuestion(selectedType)])
  }, [selectedType])

  const updateQuestion = useCallback(
    (id: string, patch: Partial<QuestionDraft>) => {
      setQuestions((qs) =>
        qs.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      )
    },
    [],
  )

  const updateOption = useCallback(
    (qId: string, optIdx: number, patch: Partial<OptionDraft>) => {
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === qId
            ? {
                ...q,
                options: q.options.map((opt, i) =>
                  i === optIdx ? { ...opt, ...patch } : opt,
                ),
              }
            : q,
        ),
      )
    },
    [],
  )

  const setCorrectOption = useCallback((qId: string, optIdx: number) => {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt, i) => ({
                ...opt,
                is_correct: i === optIdx,
              })),
            }
          : q,
      ),
    )
  }, [])

  const updatePair = useCallback(
    (qId: string, pairIdx: number, patch: Partial<PairDraft>) => {
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === qId
            ? {
                ...q,
                pairs: q.pairs.map((p, i) =>
                  i === pairIdx ? { ...p, ...patch } : p,
                ),
              }
            : q,
        ),
      )
    },
    [],
  )

  const updateItem = useCallback(
    (qId: string, itemIdx: number, patch: Partial<ItemDraft>) => {
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === qId
            ? {
                ...q,
                items: q.items.map((it, i) =>
                  i === itemIdx ? { ...it, ...patch } : it,
                ),
              }
            : q,
        ),
      )
    },
    [],
  )

  // ─── AI placeholder ───────────────────────────────────────────

  const simulateAi = () => {
    setAiLoading(true)
    setTimeout(() => {
      setAiLoading(false)
      toast.info('Generación con IA no disponible en esta versión')
    }, 1500)
  }

  // ─── Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!quizTitle.trim()) {
      toast.error('El título del quiz es obligatorio')
      return
    }

    setSaving(true)

    try {
      // 1. Create the quiz
      const payload: Record<string, unknown> = {
        title: quizTitle.trim(),
        language,
        visibility,
        shuffle_questions: shuffleQuestions,
        scoring_mode: scoringMode,
        pass_percentage: passPercentage,
      }
      if (quizDescription.trim()) {
        payload.description = quizDescription.trim()
      }
      if (maxAttempts.trim()) {
        payload.max_attempts = parseInt(maxAttempts, 10)
      }
      if (timeLimit.trim()) {
        payload.time_limit_minutes = parseInt(timeLimit, 10)
      }

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error al crear el quiz')
      }

      const quiz = await res.json()

      // 2. Create each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]

        const base = {
          content: q.content || 'Pregunta sin enunciado',
          difficulty: q.difficulty,
          points: q.points,
          order_index: i,
        }

        let qRes: Response

        switch (q.type) {
          case 'true-false': {
            qRes = await fetch(`/api/quizzes/${quiz.id}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'true-false',
                ...base,
                ...(q.explanation ? { explanation: q.explanation } : {}),
                ...(q.hint ? { hint: q.hint } : {}),
                correct_answer: q.correct_answer,
              }),
            })
            break
          }
          case 'multiple-choice': {
            const validOptions = q.options.filter((o) => o.content.trim())
            const hasCorrect = validOptions.some((o) => o.is_correct)
            const options =
              validOptions.length >= 2 && hasCorrect
                ? validOptions
                : [
                    { content: 'Opción A', is_correct: true },
                    { content: 'Opción B', is_correct: false },
                    { content: 'Opción C', is_correct: false },
                    { content: 'Opción D', is_correct: false },
                  ]

            qRes = await fetch(`/api/quizzes/${quiz.id}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'multiple-choice',
                ...base,
                ...(q.explanation ? { explanation: q.explanation } : {}),
                ...(q.hint ? { hint: q.hint } : {}),
                options,
              }),
            })
            break
          }
          case 'matching': {
            const validPairs = q.pairs.filter(
              (p) => p.left_text.trim() && p.right_text.trim(),
            )
            const pairs =
              validPairs.length >= 1
                ? validPairs
                : [
                    { left_text: 'Concepto A', right_text: 'Definición A' },
                    { left_text: 'Concepto B', right_text: 'Definición B' },
                  ]

            qRes = await fetch(`/api/quizzes/${quiz.id}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'matching',
                ...base,
                ...(q.explanation ? { explanation: q.explanation } : {}),
                ...(q.hint ? { hint: q.hint } : {}),
                pairs,
              }),
            })
            break
          }
          case 'ordering': {
            const validItems = q.items.filter((it) => it.content.trim())
            const items =
              validItems.length >= 2
                ? validItems
                : [
                    { content: 'Primero', correct_order: 1 },
                    { content: 'Segundo', correct_order: 2 },
                    { content: 'Tercero', correct_order: 3 },
                  ]

            qRes = await fetch(`/api/quizzes/${quiz.id}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'ordering',
                ...base,
                ...(q.explanation ? { explanation: q.explanation } : {}),
                ...(q.hint ? { hint: q.hint } : {}),
                items,
              }),
            })
            break
          }
        }

        if (!qRes.ok) {
          const qBody = await qRes.json()
          console.error('Error creating question:', qBody)
        }
      }

      toast.success('Quiz creado correctamente')
      router.push(`/quizzes/${quiz.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render helpers ──────────────────────────────────────────

  function renderQuestionEditor(q: QuestionDraft) {
    return (
      <div className="border-t border-border p-4 bg-muted/30 flex flex-col gap-4">
        {/* Enunciado */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Enunciado
          </label>
          <Textarea
            value={q.content}
            onChange={(e) => updateQuestion(q.id, { content: e.target.value })}
            rows={2}
            placeholder="Escribe el enunciado de la pregunta..."
          />
        </div>

        {/* Type-specific editor */}
        {q.type === 'true-false' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Respuesta correcta
            </label>
            <div className="flex gap-3">
              {[
                { value: true, label: 'Verdadero' },
                { value: false, label: 'Falso' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() =>
                    updateQuestion(q.id, { correct_answer: opt.value })
                  }
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                    q.correct_answer === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {q.type === 'multiple-choice' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Opciones
            </label>
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => setCorrectOption(q.id, i)}
                  className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                    opt.is_correct
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40',
                  )}
                >
                  {opt.is_correct && (
                    <Check size={10} className="text-primary-foreground" />
                  )}
                </button>
                <Input
                  value={opt.content}
                  onChange={(e) =>
                    updateOption(q.id, i, { content: e.target.value })
                  }
                  placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                />
                {opt.is_correct && (
                  <span className="text-xs text-primary font-medium whitespace-nowrap">
                    Correcta
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {q.type === 'matching' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pares (izquierda → derecha)
            </label>
            {q.pairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={pair.left_text}
                  onChange={(e) =>
                    updatePair(q.id, i, { left_text: e.target.value })
                  }
                  placeholder={`Concepto ${i + 1}`}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">→</span>
                <Input
                  value={pair.right_text}
                  onChange={(e) =>
                    updatePair(q.id, i, { right_text: e.target.value })
                  }
                  placeholder={`Definición ${i + 1}`}
                  className="flex-1"
                />
                <button
                  onClick={() => {
                    setQuestions((qs) =>
                      qs.map((qq) =>
                        qq.id === q.id
                          ? {
                              ...qq,
                              pairs: qq.pairs.filter((_, idx) => idx !== i),
                            }
                          : qq,
                      ),
                    )
                  }}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setQuestions((qs) =>
                  qs.map((qq) =>
                    qq.id === q.id
                      ? {
                          ...qq,
                          pairs: [
                            ...qq.pairs,
                            { left_text: '', right_text: '' },
                          ],
                        }
                      : qq,
                  ),
                )
              }
              className="w-fit gap-1"
            >
              <Plus size={13} />
              Añadir par
            </Button>
          </div>
        )}

        {q.type === 'ordering' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Elementos (en orden correcto)
            </label>
            {q.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground/60 w-5 text-center shrink-0">
                  {i + 1}
                </span>
                <Input
                  value={item.content}
                  onChange={(e) =>
                    updateItem(q.id, i, { content: e.target.value })
                  }
                  placeholder={`Elemento ${i + 1}`}
                />
                <button
                  onClick={() => {
                    setQuestions((qs) =>
                      qs.map((qq) =>
                        qq.id === q.id
                          ? {
                              ...qq,
                              items: qq.items.filter((_, idx) => idx !== i),
                            }
                          : qq,
                      ),
                    )
                  }}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setQuestions((qs) =>
                  qs.map((qq) =>
                    qq.id === q.id
                      ? {
                          ...qq,
                          items: [
                            ...qq.items,
                            {
                              content: '',
                              correct_order: qq.items.length + 1,
                            },
                          ],
                        }
                      : qq,
                  ),
                )
              }
              className="w-fit gap-1"
            >
              <Plus size={13} />
              Añadir elemento
            </Button>
          </div>
        )}

        {/* Difficulty */}
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-32">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Dificultad
            </label>
            <div className="flex gap-1.5">
              {([1, 2, 3] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => updateQuestion(q.id, { difficulty: d })}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                    q.difficulty === d
                      ? difficultyColor[d]
                      : 'border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {difficultyLabels[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pista{' '}
            <span className="font-normal normal-case text-muted-foreground/60">
              (opcional)
            </span>
          </label>
          <Input
            value={q.hint}
            onChange={(e) => updateQuestion(q.id, { hint: e.target.value })}
            placeholder="Añade una pista para guiar al estudiante..."
          />
        </div>

        {/* Explanation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Explicación{' '}
            <span className="font-normal normal-case text-muted-foreground/60">
              (opcional)
            </span>
          </label>
          <Textarea
            value={q.explanation}
            onChange={(e) =>
              updateQuestion(q.id, { explanation: e.target.value })
            }
            rows={2}
            placeholder="Explicación que aparece si el usuario responde incorrectamente..."
          />
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-24">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crear quiz</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manual o asistido por IA
        </p>
      </div>

      {/* Quiz meta */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Título del quiz
          </label>
          <Input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Ej. Fundamentos de Álgebra Lineal"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Descripción{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <textarea
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder="Breve descripción del contenido del quiz..."
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Idioma
            </label>
            <Select value={language} onValueChange={(v) => v && setLanguage(v as 'es' | 'en')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Visibilidad
            </label>
            <Select
              value={visibility}
              onValueChange={(v) => v && setVisibility(v as 'private' | 'public')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="public">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Puntuación
            </label>
            <Select
              value={scoringMode}
              onValueChange={(v) => v && setScoringMode(v as 'all-or-nothing' | 'partial')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-or-nothing">Todo o nada</SelectItem>
                <SelectItem value="partial">Puntuación parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Intentos máximos{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              placeholder="Sin límite"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Límite de tiempo (min){' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              type="number"
              min={1}
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              placeholder="Sin límite"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Porcentaje para aprobar: {passPercentage}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={passPercentage}
            onChange={(e) => setPassPercentage(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(e) => setShuffleQuestions(e.target.checked)}
            className="rounded border-input accent-primary"
          />
          <span className="text-foreground">Revolver preguntas</span>
        </label>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setMode('manual')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'manual'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Manual
        </button>
        <button
          onClick={() => setMode('ai')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'ai'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Sparkles size={14} className="text-primary" />
          Generar con IA
        </button>
      </div>

      {/* AI mode panel (placeholder - not functional) */}
      {mode === 'ai' && (
        <div className="bg-card border border-primary/30 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">
              Generación asistida
            </h2>
          </div>

          {/* Input tabs */}
          <div className="flex gap-2">
            {[
              { label: 'Tópico', icon: FileText },
              { label: 'Texto pegado', icon: FileText },
              { label: 'PDF', icon: Upload },
            ].map(({ label, icon: Icon }, i) => (
              <button
                key={label}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  i === 0
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder="Escribe un tópico (ej. 'Segunda Guerra Mundial, causas y consecuencias') o pega un texto del que generar preguntas..."
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground">Nº preguntas</label>
              <select className="h-8 px-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option>5</option>
                <option>10</option>
                <option>15</option>
                <option>20</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground">Dificultad</label>
              <select className="h-8 px-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Mixta</option>
                <option>Fácil</option>
                <option>Medio</option>
                <option>Difícil</option>
              </select>
            </div>
            <Button
              onClick={simulateAi}
              className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              disabled={aiLoading}
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generar preguntas
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Las preguntas generadas se mostrarán abajo para que las revises y
            edites antes de guardar.
          </p>
        </div>
      )}

      {/* Manual add question */}
      {mode === 'manual' && (
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground text-sm">
            Añadir pregunta
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {questionTypes.map((qt) => (
              <button
                key={qt.value}
                onClick={() => setSelectedType(qt.value)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                  selectedType === qt.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40 bg-background',
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                    selectedType === qt.value
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40',
                  )}
                >
                  {selectedType === qt.value && (
                    <Check size={10} className="text-primary-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {qt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {qt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={addQuestion}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10 w-fit"
          >
            <Plus size={15} />
            Agregar pregunta
          </Button>
        </div>
      )}

      {/* Questions list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">
            Preguntas{' '}
            <span className="text-muted-foreground font-normal text-sm">
              ({questions.length})
            </span>
          </h2>
        </div>

        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 bg-card border border-border rounded-2xl">
            {mode === 'manual'
              ? 'Añade tu primera pregunta usando el panel de arriba.'
              : 'Usa el panel de IA para generar preguntas automáticamente.'}
          </p>
        )}

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Question header */}
            <div className="flex items-center gap-3 p-4">
              <GripVertical
                size={16}
                className="text-muted-foreground/40 cursor-grab shrink-0"
              />
              <span className="text-xs font-semibold text-muted-foreground/60 w-5 shrink-0">
                {idx + 1}
              </span>
              <p className="flex-1 text-sm font-medium text-foreground truncate">
                {q.content || 'Pregunta sin enunciado'}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn('text-xs', difficultyColor[q.difficulty])}
                >
                  {difficultyLabels[q.difficulty]}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {questionTypes.find((t) => t.value === q.type)?.label}
                </Badge>
                <button
                  onClick={() => toggleExpand(q.id)}
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                >
                  {q.expanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Expanded editor */}
            {q.expanded && renderQuestionEditor(q)}
          </div>
        ))}
      </div>

      {/* Save bar */}
      {questions.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-[calc(50vw+8rem)] w-full max-w-4xl px-4 z-50">
          <div className="bg-card border border-border rounded-2xl shadow-lg p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {questions.length} preguntas &mdash;{' '}
              {quizTitle || 'Sin título'}
            </p>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
