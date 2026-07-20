'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateQuizForm } from '@/components/quizzes/create-quiz-form'

export default function CreateQuizPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateQuizForm
            onSuccess={(quizId) => router.push(`/quizzes/${quizId}`)}
            onCancel={() => router.push('/quizzes')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
