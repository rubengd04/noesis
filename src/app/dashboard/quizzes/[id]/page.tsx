import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'
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
