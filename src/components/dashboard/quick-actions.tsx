'use client'

import Link from 'next/link'
import { Plus, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function QuickActions() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Acción rápida</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/quizzes/new" className="group block">
          <Card className="h-24 transition-colors hover:bg-primary/5 cursor-pointer">
            <CardContent className="flex items-center gap-4 h-full">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/15 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">Crear quiz nuevo</p>
                <p className="text-sm text-muted-foreground truncate">
                  Crea preguntas desde cero o con IA
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/history" className="group block">
          <Card className="h-24 transition-colors hover:bg-muted/50 cursor-pointer">
            <CardContent className="flex items-center gap-4 h-full">
              <div className="rounded-lg bg-muted p-3 group-hover:bg-muted/80 transition-colors">
                <Play className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">Último quiz revisitado</p>
                <p className="text-sm text-muted-foreground truncate">
                  Continúa donde lo dejaste
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  )
}
