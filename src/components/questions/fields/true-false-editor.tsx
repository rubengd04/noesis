'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface TrueFalseEditorProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function TrueFalseEditor({ value, onChange }: TrueFalseEditorProps) {
  return (
    <div className="space-y-2">
      <Label>Respuesta correcta</Label>
      <RadioGroup
        value={String(value)}
        onValueChange={(v) => onChange(v === 'true')}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="true" id="tf-true" />
          <Label htmlFor="tf-true">Verdadero</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="false" id="tf-false" />
          <Label htmlFor="tf-false">Falso</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
