'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  MoreVertical, Pencil, Share2, Loader2, Play,
  ChevronRight, Trash2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { QuizSettings } from '@/components/quizzes/quiz-settings'
import { QuestionCard } from '@/components/questions/question-card'
import { QuestionEditor } from '@/components/questions/question-editor'
import type { Quiz, Question } from '@/types/database'
import type { AttemptSummary } from '@/types/api'

interface QuizStats {
  bestPercentage: number | null
  latestPercentage: number | null
  avgPercentage: number | null
  totalAttempts: number
}

interface QuizDetailClientProps {
  quiz: Quiz
  questions: Question[]
  questionCount: number
  stats: QuizStats
  attemptsLeft: number | null
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  'true-false': 'V/F',
  'multiple-choice': 'Opción múltiple',
  matching: 'Relacionar',
  ordering: 'Ordenar',
}

function ScoreCircle({ percentage, size = 112 }: { percentage: number | null; size?: number }) {
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = percentage !== null ? circumference - (percentage / 100) * circumference : circumference

  let arcClass = 'stroke-muted-300'
  let textClass = 'text-muted-foreground'
  if (percentage !== null) {
    if (percentage >= 70) { arcClass = 'stroke-green-500'; textClass = 'text-green-600' }
    else if (percentage >= 40) { arcClass = 'stroke-yellow-500'; textClass = 'text-yellow-600' }
    else { arcClass = 'stroke-red-500'; textClass = 'text-red-600' }
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-muted/30" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-700 ease-out ${arcClass}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold tabular-nums ${textClass}`}>
          {percentage !== null ? `${Math.round(percentage)}%` : '--'}
        </span>
      </div>
    </div>
  )
}

function ResumenTab({
  quiz,
  questionCount,
  stats,
  attemptsLeft,
  onEdit,
}: {
  quiz: Quiz
  questionCount: number
  stats: QuizStats
  attemptsLeft: number | null
  onEdit: () => void
}) {
  const visibilityLabel = quiz.visibility === 'public' ? 'Público' : 'Privado'
  const langLabel = quiz.language === 'es' ? 'ES' : 'EN'
  const scoringLabel = quiz.scoring_mode === 'all-or-nothing' ? 'Todo o nada' : 'Puntuación parcial'
  const createdDate = new Date(quiz.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const updatedDate = new Date(quiz.updated_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const handleShare = async () => {
    const url = `${window.location.origin}/quiz/${quiz.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                {quiz.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{langLabel}</Badge>
                <Badge variant="outline">{scoringLabel}</Badge>
                <Badge variant={quiz.visibility === 'public' ? 'default' : 'secondary'}>
                  {visibilityLabel}
                </Badge>
                {quiz.time_limit_minutes && (
                  <Badge variant="outline">{quiz.time_limit_minutes} min</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 shrink-0">
              <ScoreCircle percentage={stats.bestPercentage} />
              <span className="text-xs text-muted-foreground text-center leading-tight">
                Mejor intento
              </span>
              <Link href={`/quiz/${quiz.id}/attempt`}>
                <Button disabled={attemptsLeft === 0} className="gap-1.5">
                  <Play className="h-4 w-4" />
                  Practicar
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Editar quiz
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1" />
          Compartir
        </Button>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Más opciones" />}>
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => {
                  const el = document.querySelector('[data-delete-dialog-trigger]') as HTMLButtonElement | null
                  el?.click()
                }}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Número de preguntas</dt>
              <dd className="font-medium">{questionCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tiempo estimado</dt>
              <dd className="font-medium">
                {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'Sin límite'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fuente</dt>
              <dd className="font-medium">Manual</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Visibilidad</dt>
              <dd className="font-medium capitalize">{visibilityLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Creado</dt>
              <dd className="font-medium">{createdDate}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Actualizado</dt>
              <dd className="font-medium">{updatedDate}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function PreguntasTab({
  quizId,
  questions,
  onQuestionsChange,
}: {
  quizId: string
  questions: Question[]
  onQuestionsChange: () => void
}) {
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [editing, setEditing] = useState<Question | null>(null)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  const diffCounts: Record<number, number> = {}
  const typeCounts: Record<string, number> = {}
  for (const q of questions) {
    diffCounts[q.difficulty] = (diffCounts[q.difficulty] ?? 0) + 1
    typeCounts[q.type] = (typeCounts[q.type] ?? 0) + 1
  }

  const filtered = questions.filter((q) => {
    if (difficultyFilter !== null && q.difficulty !== difficultyFilter) return false
    if (typeFilter !== null && q.type !== typeFilter) return false
    return true
  })

  const allTypes = Array.from(new Set(questions.map((q) => q.type)))
  const allDifficulties = Array.from(new Set(questions.map((q) => q.difficulty))).sort()

  const handleDelete = async (questionId: string) => {
    const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json()
      toast.error(body.error ?? 'Error al eliminar la pregunta')
      return
    }
    toast.success('Pregunta eliminada')
    onQuestionsChange()
  }

  const handleEdit = (question: Question) => {
    setEditing(question)
    setCreating(false)
  }

  const handleSave = () => {
    setEditing(null)
    setCreating(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={difficultyFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter(null)}
        >
          Todas
        </Button>
        {allDifficulties.map((d) => (
          <Button
            key={d}
            variant={difficultyFilter === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
          >
            Dificultad {d}
            <span className="ml-1 text-xs opacity-60">({diffCounts[d]})</span>
          </Button>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        {allTypes.map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
          >
            {QUESTION_TYPE_LABELS[t] ?? t}
            <span className="ml-1 text-xs opacity-60">({typeCounts[t]})</span>
          </Button>
        ))}
        {(difficultyFilter !== null || typeFilter !== null) && (
          <Button variant="ghost" size="sm" onClick={() => { setDifficultyFilter(null); setTypeFilter(null) }}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} de {questions.length} preguntas
          {(difficultyFilter !== null || typeFilter !== null) && ' (filtradas)'}
        </p>
        <Button size="sm" onClick={() => { setCreating(true); setEditing(null) }}>
          + Añadir pregunta
        </Button>
      </div>

      {creating && <QuestionEditor quizId={quizId} onSave={handleSave} />}
      {editing && (
        <QuestionEditor quizId={quizId} initialData={editing} onSave={handleSave} />
      )}

      <div className="space-y-2">
        {filtered.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            {questions.length === 0
              ? 'Este quiz aún no tiene preguntas. Crea la primera.'
              : 'No hay preguntas que coincidan con los filtros seleccionados.'}
          </p>
        )}
      </div>
    </div>
  )
}

function HistorialTab({ quizId, stats }: { quizId: string; stats: QuizStats }) {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/attempts?quizId=${quizId}&limit=50&page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setAttempts(json.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [quizId])

  function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function formatTime(seconds: number | null): string {
    if (!seconds) return '--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {stats.totalAttempts > 0 ? stats.totalAttempts : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Intentos totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {stats.bestPercentage !== null ? `${Math.round(stats.bestPercentage)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Mejor puntuación</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {stats.latestPercentage !== null ? `${Math.round(stats.latestPercentage)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Último puntaje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {stats.avgPercentage !== null ? `${Math.round(stats.avgPercentage)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Promedio</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Intentos anteriores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : attempts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no has realizado ningún intento en este quiz.
            </p>
          ) : (
            <div className="space-y-1.5">
              {attempts.map((item) => (
                <Link
                  key={item.id}
                  href={`/quiz/${item.quiz_id}/attempt/${item.id}/results`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{item.quiz_title ?? 'Quiz'}</span>
                    <Badge variant={item.passed ? 'default' : 'destructive'} className="shrink-0">
                      {item.percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                    <span className="text-xs">{formatTime(item.time_seconds)}</span>
                    <span className="text-xs">{formatDate(item.created_at)}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && attempts.length > 0 && (
            <Link
              href={`/history?quizId=${quizId}`}
              className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver historial completo
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function QuizDetailClient({ quiz, questions, questionCount, stats, attemptsLeft }: QuizDetailClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState('resumen')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.error ?? 'Error al eliminar el quiz')
        return
      }
      toast.success('Quiz eliminado')
      router.push('/quizzes')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <div className="hidden">
        <button data-delete-dialog-trigger onClick={() => setDeleteOpen(true)} type="button" />
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar quiz</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este quiz? Esta acción no se puede deshacer.
              Se eliminarán todas las preguntas e intentos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configuración del quiz</SheetTitle>
            <SheetDescription>
              Modifica los detalles y opciones del quiz.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 pt-0">
            <QuizSettings quiz={quiz} />
          </div>
        </SheetContent>
      </Sheet>

      <Tabs value={tab} onValueChange={(v) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="preguntas">
            Preguntas{' '}
            <span className="ml-1.5 rounded-full bg-primary/10 text-primary px-1.5 py-0 text-xs font-semibold tabular-nums">
              {questionCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial{' '}
            {stats.totalAttempts > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 text-primary px-1.5 py-0 text-xs font-semibold tabular-nums">
                {stats.totalAttempts}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <ResumenTab
            quiz={quiz}
            questionCount={questionCount}
            stats={stats}
            attemptsLeft={attemptsLeft}
            onEdit={() => setSettingsOpen(true)}
          />
        </TabsContent>
        <TabsContent value="preguntas">
          <PreguntasTab
            quizId={quiz.id}
            questions={questions}
            onQuestionsChange={() => router.refresh()}
          />
        </TabsContent>
        <TabsContent value="historial">
          <HistorialTab quizId={quiz.id} stats={stats} />
        </TabsContent>
      </Tabs>
    </>
  )
}
