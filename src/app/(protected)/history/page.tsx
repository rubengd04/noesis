import { HistoryClient } from './history-client'

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de intentos</h1>
        <p className="text-sm text-muted-foreground">
          Todos tus quizzes realizados, con resultados y estadísticas.
        </p>
      </div>

      <HistoryClient />
    </div>
  )
}
