'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DeleteQuizButtonProps {
  quizId: string
}

export function DeleteQuizButton({ quizId }: DeleteQuizButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.error ?? 'Error al eliminar el quiz')
        return
      }
      toast.success('Quiz eliminado')
      router.push('/quizzes')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeleting(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 className="mr-1 h-4 w-4" />
        Borrar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar quiz</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar este quiz? Esta acción no se puede deshacer.
            Se eliminarán todas las preguntas e intentos asociados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
