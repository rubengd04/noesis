'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface Option {
  content: string
  is_correct: boolean
}

interface MultipleChoiceEditorProps {
  value: Option[]
  onChange: (options: Option[]) => void
}

export function MultipleChoiceEditor({ value, onChange }: MultipleChoiceEditorProps) {
  const updateOption = (index: number, field: keyof Option, fieldValue: string | boolean) => {
    const next = value.map((opt, i) =>
      i === index ? { ...opt, [field]: fieldValue } : opt,
    )
    onChange(next)
  }

  const removeOption = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const addOption = () => {
    onChange([...value, { content: '', is_correct: false }])
  }

  return (
    <div className="space-y-2">
      <Label>Opciones</Label>
      {value.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Checkbox
            checked={opt.is_correct}
            onCheckedChange={(checked) =>
              updateOption(i, 'is_correct', checked === true)
            }
          />
          <Input
            value={opt.content}
            onChange={(e) => updateOption(i, 'content', e.target.value)}
            placeholder={`Opción ${i + 1}`}
            className="flex-1"
          />
          {value.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOption(i)}
            >
              ×
            </Button>
          )}
        </div>
      ))}
      {value.length < 10 && (
        <Button variant="outline" size="sm" onClick={addOption}>
          + Añadir opción
        </Button>
      )}
    </div>
  )
}
