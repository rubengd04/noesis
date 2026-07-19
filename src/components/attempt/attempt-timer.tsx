'use client'

import { useEffect, useState, useRef } from 'react'

interface AttemptTimerProps {
  timeLimitMinutes: number
  onExpire: () => void
}

export function AttemptTimer({ timeLimitMinutes, onExpire }: AttemptTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes * 60)
  const expired = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!expired.current) {
            expired.current = true
            onExpire()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onExpire])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const urgent = secondsLeft <= 60

  return (
    <div className={`text-center text-2xl font-mono font-bold ${urgent ? 'text-destructive animate-pulse' : ''}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}
