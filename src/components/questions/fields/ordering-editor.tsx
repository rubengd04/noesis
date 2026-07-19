'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Item {
  content: string
  correct_order: number
}

interface OrderingEditorProps {
  value: Item[]
  onChange: (items: Item[]) => void
}

export function OrderingEditor({ value, onChange }: OrderingEditorProps) {
  const updateItem = (
    index: number,
    field: keyof Item,
    fieldValue: string | number,
  ) => {
    const next = value.map((item, i) =>
      i === index ? { ...item, [field]: fieldValue } : item,
    )
    onChange(next)
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChange([
      ...value,
      { content: '', correct_order: value.length + 1 },
    ])
  }

  return (
    <div className="space-y-2">
      <Label>Ítems para ordenar</Label>
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded border text-sm font-medium">
            {i + 1}
          </span>
          <Input
            value={item.content}
            onChange={(e) => updateItem(i, 'content', e.target.value)}
            placeholder="Contenido del ítem"
            className="flex-1"
          />
          <Input
            type="number"
            min={1}
            value={item.correct_order}
            onChange={(e) =>
              updateItem(i, 'correct_order', parseInt(e.target.value) || 1)
            }
            className="w-16"
            placeholder="Ord."
          />
          {value.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(i)}
            >
              ×
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        + Añadir ítem
      </Button>
    </div>
  )
}
