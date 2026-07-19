import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { QuizSettings } from '@/components/quizzes/quiz-settings'
import { QuestionList } from '@/components/questions/question-list'

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
    redirect('/dashboard')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', id)
    .order('order_index')

  // Count completed attempts for this user
  const { count: completedCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', id)
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const attemptsLeft = quiz.max_attempts
    ? Math.max(0, quiz.max_attempts - (completedCount ?? 0))
    : null

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Mis Quizzes
        </Link>
      </div>

      <QuizSettings quiz={quiz} />

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
          <Badge variant="outline">
            {quiz.scoring_mode === 'all-or-nothing' ? 'Todo o nada' : 'Puntuación parcial'}
          </Badge>
          {quiz.time_limit_minutes && (
            <Badge variant="outline">{quiz.time_limit_minutes} min</Badge>
          )}
        </div>
      </section>

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
