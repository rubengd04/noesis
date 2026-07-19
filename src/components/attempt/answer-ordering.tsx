'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'

interface ItemDef {
  id: string
  content: string
}

interface Props {
  items: ItemDef[]
  itemOrder: string[]
  onChange: (order: string[]) => void
  disabled: boolean
}

export function OrderingAnswer({ items, itemOrder, onChange, disabled }: Props) {
  const ordered = itemOrder.map((id) => items.find((it) => it.id === id)!).filter(Boolean)

  const move = (index: number, direction: -1 | 1) => {
    const next = [...itemOrder]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {ordered.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-sm font-medium">
            {idx + 1}
          </span>
          <span className="flex-1">{item.content}</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={disabled || idx === 0}
              onClick={() => move(idx, -1)}
              className="rounded p-1 hover:bg-accent disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={disabled || idx === ordered.length - 1}
              onClick={() => move(idx, 1)}
              className="rounded p-1 hover:bg-accent disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
