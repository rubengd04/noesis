'use client'

import { TrendingUp, Flame, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardsProps {
  avgPercentage: number
  totalAttempts: number
  weeklyAttempts: number
  weeklyDiff: number
  scoreTrend: number | null
  dailyDistribution: Array<{ date: string; count: number }>
  passRate: number
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null
  const isPositive = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      <TrendingUp
        className={`h-3 w-3 ${!isPositive ? 'rotate-180' : ''}`}
      />
      {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

function MiniBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 rounded-t-sm bg-primary/30"
          style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '1px' }}
        />
      ))}
    </div>
  )
}

export function StatsCards({
  avgPercentage,
  totalAttempts,
  weeklyAttempts,
  weeklyDiff,
  scoreTrend,
  dailyDistribution,
  passRate,
}: StatsCardsProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Estadísticas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Score promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{avgPercentage}%</span>
              <TrendBadge value={scoreTrend} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En {totalAttempts} intentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Intentos esta semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{weeklyAttempts}</span>
              {weeklyDiff !== 0 && (
                <span
                  className={`text-xs font-medium ${
                    weeklyDiff > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {weeklyDiff > 0 ? '+' : ''}
                  {weeklyDiff} vs semana anterior
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {passRate.toFixed(0)}% de aprobados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Distribución temporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={dailyDistribution} />
            <p className="text-xs text-muted-foreground mt-2">Actividad últimos 14 días</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
