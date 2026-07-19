'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/questions/question-card'
import { QuestionEditor } from '@/components/questions/question-editor'
import type { Question } from '@/types/database'

interface QuestionListProps {
  quizId: string
  questions: Question[]
}

export function QuestionList({ quizId, questions: initial }: QuestionListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [questions, setQuestions] = useState(initial)
  const [editing, setEditing] = useState<Question | null>(null)
  const [creating, setCreating] = useState(false)
  const [, setDeleting] = useState<string | null>(null)

  const handleDelete = async (questionId: string) => {
    if (!confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return

    setDeleting(questionId)
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error al eliminar pregunta:', error)
      setDeleting(null)
      return
    }

    setQuestions((prev) => prev.filter((q) => q.id !== questionId))
    router.refresh()
    setDeleting(null)
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Preguntas ({questions.length})</h2>
        <Button onClick={() => { setCreating(true); setEditing(null) }}>
          + Añadir pregunta
        </Button>
      </div>

      {creating && (
        <QuestionEditor quizId={quizId} onSave={handleSave} />
      )}

      {editing && (
        <QuestionEditor
          quizId={quizId}
          initialData={editing}
          onSave={handleSave}
        />
      )}

      <div className="space-y-2">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {questions.length === 0 && !creating && (
          <p className="py-8 text-center text-muted-foreground">
            Este quiz aún no tiene preguntas. Crea la primera.
          </p>
        )}
      </div>
    </div>
  )
}
