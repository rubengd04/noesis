'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateQuizFormProps {
  onSuccess?: (quizId: string) => void
  onCancel?: () => void
}

export function CreateQuizForm({ onSuccess, onCancel }: CreateQuizFormProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!res.ok) {
        const body = await res.json()
        const msg = body.error ?? 'Error al crear el quiz'
        setError(msg)
        toast.error(msg)
        return
      }

      const quiz = await res.json()
      setTitle('')
      toast.success('Quiz creado correctamente')
      onSuccess?.(quiz.id)
    } catch {
      const msg = 'Error de conexión'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Matemáticas básicas"
          autoFocus
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Creando...' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}
