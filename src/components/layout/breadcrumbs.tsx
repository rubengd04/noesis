'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'

interface BreadcrumbSegment {
  href: string
  label: string
  isLast: boolean
}

const labelMap: Record<string, string> = {
  dashboard: 'Inicio',
  quizzes: 'Quizzes',
  new: 'Nuevo quiz',
  history: 'Historial',
  explore: 'Explorar',
  quiz: 'Quizzes',
  attempt: 'Realizar intento',
  results: 'Resultados',
  settings: 'Ajustes',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(segment: string): boolean {
  return UUID_REGEX.test(segment)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const [quizTitles, setQuizTitles] = useState<Record<string, string>>({})

  const segments = pathname.split('/').filter(Boolean)

  useEffect(() => {
    const ids = segments.filter(isUuid)
    if (ids.length === 0) return

    let cancelled = false
    async function fetchTitles() {
      const titles: Record<string, string> = {}
      for (const id of ids) {
        try {
          const res = await fetch(`/api/quizzes/${id}`)
          if (res.ok) {
            const data = await res.json()
            titles[id] = data.title ?? id
          } else {
            titles[id] = id.slice(0, 8) + '…'
          }
        } catch {
          titles[id] = id.slice(0, 8) + '…'
        }
      }
      if (!cancelled) setQuizTitles(titles)
    }
    fetchTitles()
    return () => { cancelled = true }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const breadcrumbs: BreadcrumbSegment[] = []
  let accumulatedHref = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    accumulatedHref += '/' + seg

    if (seg === 'quiz') {
      breadcrumbs.push({
        href: '/quizzes',
        label: 'Quizzes',
        isLast: false,
      })
      continue
    }

    if (isUuid(seg)) {
      const label = quizTitles[seg] ?? 'Cargando…'
      breadcrumbs.push({
        href: accumulatedHref,
        label,
        isLast: i === segments.length - 1,
      })
      continue
    }

    if (seg === 'attempt' && segments[i - 1] && isUuid(segments[i - 1])) {
      breadcrumbs.push({
        href: accumulatedHref,
        label: 'Intento',
        isLast: i === segments.length - 1,
      })
      continue
    }

    const label = labelMap[seg] ?? seg
    breadcrumbs.push({
      href: accumulatedHref,
      label,
      isLast: i === segments.length - 1,
    })
  }

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        {breadcrumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            {i > 0 && <span className="text-muted-foreground/40">/</span>}
            {crumb.isLast ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
