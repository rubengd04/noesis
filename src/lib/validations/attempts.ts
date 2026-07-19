import { z } from 'zod'

export const answerValueSchema = z.union([
  z.object({ value: z.boolean() }),
  z.object({ selectedOptionIds: z.array(z.string()) }),
  z.object({
    pairs: z.array(
      z.object({
        pairId: z.string(),
        matchedRight: z.string(),
      }),
    ),
  }),
  z.object({ itemOrder: z.array(z.string()) }),
])

export const submitAnswerSchema = z.object({
  questionId: z.string(),
  answer: answerValueSchema,
})

export const submitAttemptSchema = z.object({
  answers: z.array(submitAnswerSchema),
  time_spent_seconds: z.number().int().min(0).optional(),
})

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>
