import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Quiz } from '@/types/database'

interface QuizCardProps {
  quiz: Quiz
}

export function QuizCard({ quiz }: QuizCardProps) {
  const visibilityLabel = quiz.visibility === 'public' ? 'Público' : 'Privado'
  const langLabel = quiz.language === 'es' ? 'ES' : 'EN'
  const scoringLabel = quiz.scoring_mode === 'all-or-nothing' ? 'Todo/Nada' : 'Parcial'

  return (
    <Link href={`/dashboard/quizzes/${quiz.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {quiz.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={quiz.visibility === 'public' ? 'default' : 'secondary'}>
              {visibilityLabel}
            </Badge>
            <Badge variant="outline">{langLabel}</Badge>
            <Badge variant="outline">{scoringLabel}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
