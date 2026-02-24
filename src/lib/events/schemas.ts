import { z } from 'zod'

export const eventInsertSchema = z.object({
  event_type: z.string().min(3, 'event_type must be at least 3 characters'),
  idempotency_key: z.string().min(5, 'idempotency_key must be at least 5 characters'),
  payload: z.record(z.string(), z.unknown())
})

export type EventInsertInput = z.infer<typeof eventInsertSchema>
