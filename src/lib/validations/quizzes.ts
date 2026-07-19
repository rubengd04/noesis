import { z } from 'zod'

export const createQuizSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío'),
  description: z.string().optional(),
  language: z.enum(['es', 'en']).default('es'),
  visibility: z.enum(['private', 'public']).default('private'),
  shuffle_questions: z.boolean().default(false),
  max_attempts: z.number().int().min(1).optional(),
  time_limit_minutes: z.number().int().min(1).optional(),
  pass_percentage: z.number().int().min(0).max(100).default(70),
})

export const updateQuizSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío').optional(),
  description: z.string().optional(),
  language: z.enum(['es', 'en']).optional(),
  visibility: z.enum(['private', 'public']).optional(),
  shuffle_questions: z.boolean().optional(),
  max_attempts: z.number().int().min(1).nullable().optional(),
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  pass_percentage: z.number().int().min(0).max(100).optional(),
})

export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>
