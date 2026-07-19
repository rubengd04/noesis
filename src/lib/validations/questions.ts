import { z } from 'zod'

const baseQuestionFields = {
  content: z.string().min(1, 'La pregunta no puede estar vacía'),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  points: z.number().int().min(1).default(1),
  order_index: z.number().int().min(0),
}

const trueFalseSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('true-false'),
  correct_answer: z.boolean(),
})

const multipleChoiceSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('multiple-choice'),
  options: z
    .array(
      z.object({
        content: z.string().min(1, 'La opción no puede estar vacía'),
        is_correct: z.boolean(),
      }),
    )
    .min(2, 'Debe haber al menos 2 opciones'),
})

const matchingSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('matching'),
  pairs: z
    .array(
      z.object({
        left_text: z.string().min(1, 'El texto izquierdo no puede estar vacío'),
        right_text: z.string().min(1, 'El texto derecho no puede estar vacío'),
      }),
    )
    .min(1, 'Debe haber al menos 1 par'),
})

const orderingSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('ordering'),
  items: z
    .array(
      z.object({
        content: z.string().min(1, 'El ítem no puede estar vacío'),
        correct_order: z.number().int().min(1),
      }),
    )
    .min(2, 'Debe haber al menos 2 ítems'),
})

export const createQuestionSchema = z.discriminatedUnion('type', [
  trueFalseSchema,
  multipleChoiceSchema,
  matchingSchema,
  orderingSchema,
])

export const updateQuestionSchema = z.discriminatedUnion('type', [
  trueFalseSchema.partial(),
  multipleChoiceSchema.partial(),
  matchingSchema.partial(),
  orderingSchema.partial(),
])

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
