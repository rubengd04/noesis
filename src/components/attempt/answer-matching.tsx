'use client'

import { useState, useMemo } from 'react'

interface PairDef {
  id: string
  left_text: string
}

interface PairAnswer {
  pairId: string
  matchedRight: string
}

interface Props {
  pairs: PairDef[]
  rightOptions: string[]
  value: PairAnswer[]
  onChange: (pairs: PairAnswer[]) => void
  disabled: boolean
}

export function MatchingAnswer({ pairs, rightOptions, value, onChange, disabled }: Props) {
  const shuffled = useMemo(
    () => [...rightOptions].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const getSelected = (pairId: string) => value.find((p) => p.pairId === pairId)?.matchedRight ?? ''

  const setMatch = (pairId: string, matchedRight: string) => {
    const updated = value.filter((p) => p.pairId !== pairId)
    onChange([...updated, { pairId, matchedRight }])
  }

  const used = new Set(value.map((p) => p.matchedRight))

  return (
    <div className="space-y-3">
      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-3">
          <span className="flex-1 font-medium">{pair.left_text}</span>
          <select
            value={getSelected(pair.id)}
            onChange={(e) => setMatch(pair.id, e.target.value)}
            disabled={disabled}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">Seleccionar...</option>
            {shuffled.map((text) => (
              <option
                key={text}
                value={text}
                disabled={used.has(text) && getSelected(pair.id) !== text}
              >
                {text}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
