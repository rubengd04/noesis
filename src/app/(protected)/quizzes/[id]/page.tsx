import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { QuizDetailClient } from './quiz-detail-client'
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

  const { data: attempts } = await supabase
    .from('attempts')
    .select('score, max_score, time_seconds, completed_at, created_at')
    .eq('quiz_id', id)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .not('max_score', 'is', null)
    .gt('max_score', 0)
    .order('completed_at', { ascending: false })

  const percentages: number[] = []
  for (const a of attempts ?? []) {
    if (a.max_score && a.max_score > 0 && a.score !== null) {
      percentages.push(Math.round((a.score / a.max_score) * 1000) / 10)
    }
  }

  const stats = {
    bestPercentage: percentages.length > 0 ? Math.max(...percentages) : null,
    latestPercentage: percentages.length > 0 ? percentages[0] : null,
    avgPercentage:
      percentages.length > 0
        ? Math.round(
            (percentages.reduce((sum, p) => sum + p, 0) / percentages.length) * 10
          ) / 10
        : null,
    totalAttempts: percentages.length,
  }

  const { count: completedCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', id)
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const attemptsLeft = quiz.max_attempts
    ? Math.max(0, quiz.max_attempts - (completedCount ?? 0))
    : null

  const questionCount = questions?.length ?? 0

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/quizzes"
          className="hover:text-foreground transition-colors"
        >
          Mis quizzes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[300px]">
          {quiz.title}
        </span>
      </nav>

      <QuizDetailClient
        quiz={quiz}
        questions={questions ?? []}
        questionCount={questionCount}
        stats={stats}
        attemptsLeft={attemptsLeft}
      />
    </div>
  )
}


