'use client'

import { useState, useEffect } from 'react'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import type { AttemptSummary, DashboardStats } from '@/types/api'

export default function DashboardPage() {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [avgPercentage, setAvgPercentage] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [passRate, setPassRate] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attempts?limit=5&page=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setAttempts(json.data ?? [])
          setAvgPercentage(json.summary?.avgPercentage ?? 0)
          setTotalAttempts(json.summary?.totalAttempts ?? 0)
          setPassRate(json.summary?.passRate ?? 0)
          setStats(json.dashboardStats ?? null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const weeklyDiff = stats
    ? stats.weeklyAttempts - stats.prevWeekAttempts
    : 0

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <QuickActions />
      <StatsCards
        avgPercentage={avgPercentage}
        totalAttempts={totalAttempts}
        weeklyAttempts={stats?.weeklyAttempts ?? 0}
        weeklyDiff={weeklyDiff}
        scoreTrend={stats?.scoreTrend ?? null}
        dailyDistribution={stats?.dailyDistribution ?? []}
        passRate={passRate}
      />
      <RecentActivity attempts={attempts} />
    </div>
  )
}
