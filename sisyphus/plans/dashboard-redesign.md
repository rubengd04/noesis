# Rediseño del Dashboard

## Understanding Summary

- **Qué**: Rediseño del dashboard principal de Noesis con tres secciones.
- **Quick Actions** (25%): Dos botones tipo card — "Crear quiz nuevo" y "Último quiz revisitado".
- **Estadísticas** (45%): Tres tarjetas con score promedio reciente, intentos esta semana, y distribución temporal.
- **Actividad reciente** (30%): Feed con los últimos 5 intentos de quizzes.
- **Stack**: shadcn/ui + Tailwind CSS sobre Next.js App Router.

## Assumptions

- Las estadísticas tienen datos disponibles desde Supabase (queries existentes).
- "Último quiz revisitado" redirige al quiz en sí (no al intento).
- "Distribución temporal" se representa con mini barras por día.
- Los componentes vivirán en `src/components/dashboard/`.

## Decision Log

| Decisión | Alternativas | Razón |
|---|---|---|
| Layout stacked vertical | Dos columnas, card grid | Mejor responsive, jerarquía 25/45/30 clara |
| Quick Actions como cards con icono | Botones planos | Consistencia visual con el resto del dashboard |
| Card 2: "Intentos esta semana" | Progreso general | Preferencia del usuario |
| Stats en grid 3 columnas > 2 > 1 | 2 columnas fijas | Responsive progresivo |
| Actividad: solo intentos de quizzes | Feed mixto | Preferencia del usuario |
| Activity: 5 items | 3 o 10 items | Suficiente info sin ocupar demasiado espacio |

## Diseño Final

```
┌─────────────────────────────────────────────┐
│  Acción rápida                              │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Crear quiz    │  │ Último quiz          │ │
│  │ nuevo         │  │ revisitado           │ │
│  │ + icono       │  │ ▶ icono              │ │
│  └──────────────┘  └──────────────────────┘ │
│                                              │
│  Estadísticas                                │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ Score avg  │ │ Intentos   │ │ Distrib. │ │
│  │   72%      │ │  7 esta    │ │  ▄▃▅▇▆   │ │
│  │ ▲ +5%     │ │  semana    │ │  14 días │ │
│  └────────────┘ └────────────┘ └──────────┘ │
│                                              │
│  Actividad Reciente                          │
│  ┌─ Nombre quiz ───── puntuación ─ fecha ─┐ │
│  ├─ ... 5 items ───────────────────────────┤ │
│  └─────────────────────────────────────────┘ │
│  [Ver historial completo →]                  │
└─────────────────────────────────────────────┘
```

## Plan de Implementación

### Paso 1: Estructura de componentes
Crear `src/components/dashboard/` con:
- `quick-actions.tsx` — las dos action cards
- `stats-cards.tsx` — las tres tarjetas de estadísticas
- `recent-activity.tsx` — lista de últimos 5 intentos

### Paso 2: Quick Actions
Componente `QuickActions` con dos `QuickActionCard`:
- Cada card con icono (Lucide), título, descripción corta
- Una con variante primary (Crear), otra outline (Último quiz)
- Wrapper con grid responsive (`grid-cols-2` → `grid-cols-1`)

### Paso 3: Stats Cards
Componente `StatsCards` con tres cards:
- `ScoreCard` — número grande + badge de tendencia
- `WeeklyAttemptsCard` — número + comparativa semanal
- `DistributionCard` — mini barras por día

### Paso 4: Recent Activity
Componente `RecentActivity` con:
- Lista de 5 items con nombre, puntuación (coloreada), fecha relativa, dificultad
- Enlace "Ver historial completo" al final

### Paso 5: Integración en page.tsx
Sustituir el contenido actual de `page.tsx` por el nuevo layout con las tres secciones.
