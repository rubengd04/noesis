'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Pair {
  left_text: string
  right_text: string
}

interface MatchingEditorProps {
  value: Pair[]
  onChange: (pairs: Pair[]) => void
}

export function MatchingEditor({ value, onChange }: MatchingEditorProps) {
  const updatePair = (index: number, field: keyof Pair, fieldValue: string) => {
    const next = value.map((pair, i) =>
      i === index ? { ...pair, [field]: fieldValue } : pair,
    )
    onChange(next)
  }

  const removePair = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const addPair = () => {
    onChange([...value, { left_text: '', right_text: '' }])
  }

  return (
    <div className="space-y-2">
      <Label>Pares para relacionar</Label>
      {value.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={pair.left_text}
            onChange={(e) => updatePair(i, 'left_text', e.target.value)}
            placeholder="Texto izquierdo"
            className="flex-1"
          />
          <span className="text-muted-foreground">↔</span>
          <Input
            value={pair.right_text}
            onChange={(e) => updatePair(i, 'right_text', e.target.value)}
            placeholder="Texto derecho"
            className="flex-1"
          />
          {value.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePair(i)}
            >
              ×
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPair}>
        + Añadir par
      </Button>
    </div>
  )
}
