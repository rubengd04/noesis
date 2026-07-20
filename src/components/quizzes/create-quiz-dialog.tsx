'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreateQuizForm } from '@/components/quizzes/create-quiz-form'

export function CreateQuizDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Crear Quiz
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Quiz</DialogTitle>
          <DialogDescription>
            Dale un título a tu quiz. Podrás configurarlo después.
          </DialogDescription>
        </DialogHeader>
        <CreateQuizForm
          onSuccess={(quizId) => {
            setOpen(false)
            router.push(`/quizzes/${quizId}`)
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
