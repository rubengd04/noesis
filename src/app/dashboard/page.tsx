import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardQuizList } from '@/components/quizzes/dashboard-quiz-list'
import { AttemptHistorySummary } from '@/components/attempts/attempt-history-summary'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <AttemptHistorySummary />
      <DashboardQuizList />
    </>
  )
}
