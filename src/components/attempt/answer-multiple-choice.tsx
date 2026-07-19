'use client'

interface Option {
  id: string
  content: string
}

interface Props {
  options: Option[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  disabled: boolean
}

export function MultipleChoiceAnswer({ options, selectedIds, onSelect, disabled }: Props) {
  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id]
    onSelect(next)
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const active = selectedIds.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt.id)}
            className={`w-full text-left rounded-lg border p-4 transition-colors ${
              active
                ? 'border-primary bg-primary/10 font-medium'
                : 'border-border hover:bg-accent'
            } disabled:opacity-50`}
          >
            {opt.content}
          </button>
        )
      })}
    </div>
  )
}
