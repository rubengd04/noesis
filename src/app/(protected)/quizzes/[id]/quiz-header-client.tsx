'use client'

import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteQuizButton } from '@/components/quizzes/delete-quiz-button'

interface QuizHeaderClientProps {
  quizId: string
}

export function QuizHeaderClient({ quizId }: QuizHeaderClientProps) {
  const handleEdit = () => {
    const settingsEl = document.querySelector('[data-quiz-settings]')
    if (settingsEl) {
      settingsEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button variant="outline" size="sm" onClick={handleEdit}>
        <Pencil className="mr-1 h-4 w-4" />
        Editar
      </Button>
      <DeleteQuizButton quizId={quizId} />
    </div>
  )
}
