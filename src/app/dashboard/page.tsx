import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuizCard } from '@/components/quizzes/quiz-card'
import { CreateQuizDialog } from '@/components/quizzes/create-quiz-dialog'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Quizzes</h1>
        <CreateQuizDialog />
      </div>

      {!quizzes || quizzes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Aún no tienes quizzes. Crea tu primer quiz.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  )
}
