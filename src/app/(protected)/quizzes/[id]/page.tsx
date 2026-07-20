import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { QuizSettings } from '@/components/quizzes/quiz-settings'
import { QuestionList } from '@/components/questions/question-list'
import { QuizAttemptHistory } from '@/components/quizzes/quiz-attempt-history'
import { QuizHeaderClient } from './quiz-header-client'
import Link from 'next/link'

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single()

  if (!quiz) {
    redirect('/quizzes')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', id)
    .order('order_index')

  const { count: completedCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', id)
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const attemptsLeft = quiz.max_attempts
    ? Math.max(0, quiz.max_attempts - (completedCount ?? 0))
    : null

  const visibilityLabel = quiz.visibility === 'public' ? 'Público' : 'Privado'
  const scoringLabel = quiz.scoring_mode === 'all-or-nothing' ? 'Todo o nada' : 'Puntuación parcial'
  const langLabel = quiz.language === 'es' ? 'ES' : 'EN'
  const createdDate = new Date(quiz.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-sm text-muted-foreground">{quiz.description}</p>
            )}
            <p className="text-xs text-muted-foreground">Creado el {createdDate}</p>
          </div>
          <QuizHeaderClient quizId={id} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{questions?.length ?? 0} preguntas</Badge>
          <Badge variant="outline">{scoringLabel}</Badge>
          <Badge variant={quiz.visibility === 'public' ? 'default' : 'secondary'}>
            {visibilityLabel}
          </Badge>
          <Badge variant="outline">{langLabel}</Badge>
          {quiz.time_limit_minutes && (
            <Badge variant="outline">{quiz.time_limit_minutes} min</Badge>
          )}
        </div>
      </div>

      <div data-quiz-settings>
        <QuizSettings quiz={quiz} />
      </div>

      <section className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold">Realizar intento</h2>
            <p className="text-sm text-muted-foreground">
              {attemptsLeft !== null
                ? `Te quedan ${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''}`
                : 'Intentos ilimitados'}
            </p>
          </div>
          <Link href={`/quiz/${id}/attempt`}>
            <Button disabled={attemptsLeft === 0}>
              Comenzar intento
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{questions?.length ?? 0} preguntas</Badge>
          <Badge variant="outline">{scoringLabel}</Badge>
          {quiz.time_limit_minutes && (
            <Badge variant="outline">{quiz.time_limit_minutes} min</Badge>
          )}
        </div>
      </section>

      <QuizAttemptHistory quizId={id} />

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            Preguntas ({questions?.length ?? 0})
          </h2>
        </div>

        <QuestionList
          quizId={id}
          questions={questions ?? []}
        />
      </section>
    </div>
  )
}
