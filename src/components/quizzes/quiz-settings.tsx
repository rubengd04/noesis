'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Quiz } from '@/types/database'

interface QuizSettingsProps {
  quiz: Quiz
}

export function QuizSettings({ quiz }: QuizSettingsProps) {
  const router = useRouter()
  const [title, setTitle] = useState(quiz.title)
  const [description, setDescription] = useState(quiz.description ?? '')
  const [language, setLanguage] = useState(quiz.language)
  const [visibility, setVisibility] = useState(quiz.visibility)
  const [shuffle, setShuffle] = useState(quiz.shuffle_questions)
  const [scoringMode, setScoringMode] = useState(quiz.scoring_mode)
  const [maxAttempts, setMaxAttempts] = useState(quiz.max_attempts?.toString() ?? '')
  const [timeLimit, setTimeLimit] = useState(quiz.time_limit_minutes?.toString() ?? '')
  const [passPercentage, setPassPercentage] = useState(quiz.pass_percentage)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          language,
          visibility,
          shuffle_questions: shuffle,
          scoring_mode: scoringMode,
          max_attempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
          time_limit_minutes: timeLimit ? parseInt(timeLimit, 10) : null,
          pass_percentage: passPercentage,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setMessage(body.error ?? 'Error al guardar')
        return
      }

      setMessage('Guardado')
      router.refresh()
    } catch {
      setMessage('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilidad</Label>
              <Select
                value={visibility}
                onValueChange={(v) => v && setVisibility(v)}
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privado</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scoringMode">Puntuación</Label>
            <Select value={scoringMode} onValueChange={(v) => v && setScoringMode(v)}>
              <SelectTrigger id="scoringMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-or-nothing">Todo o nada</SelectItem>
                <SelectItem value="partial">Puntuación parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Intentos máximos</Label>
              <Input
                id="maxAttempts"
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="Sin límite"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimit">Límite de tiempo (min)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="Sin límite"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passPercentage">
              Porcentaje para aprobar: {passPercentage}%
            </Label>
            <input
              id="passPercentage"
              type="range"
              min={0}
              max={100}
              value={passPercentage}
              onChange={(e) => setPassPercentage(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="shuffle"
              checked={shuffle}
              onCheckedChange={(v) => setShuffle(v === true)}
            />
            <Label htmlFor="shuffle">Revolver preguntas</Label>
          </div>

          {message && (
            <p
              className={`text-sm ${
                message === 'Guardado' ? 'text-green-600' : 'text-destructive'
              }`}
            >
              {message}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
