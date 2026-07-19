import { z } from 'zod'

const trueFalseAnswerSchema = z.object({
  value: z.boolean(),
})

const multipleChoiceAnswerSchema = z.object({
  selectedOptionIds: z.array(z.string()),
})

const matchingAnswerSchema = z.object({
  pairs: z.array(
    z.object({
      pairId: z.string(),
      matchedRight: z.string(),
    }),
  ),
})

const orderingAnswerSchema = z.object({
  itemOrder: z.array(z.string()),
})

const answerValueSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('true-false'), ...trueFalseAnswerSchema.shape }),
  z.object({ type: z.literal('multiple-choice'), ...multipleChoiceAnswerSchema.shape }),
  z.object({ type: z.literal('matching'), ...matchingAnswerSchema.shape }),
  z.object({ type: z.literal('ordering'), ...orderingAnswerSchema.shape }),
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
