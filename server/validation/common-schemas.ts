import { z } from 'zod'
import { ApiError } from '../errors/api-error'

export const idSchema = z.string().min(1)
export const workspaceBodySchema = z.object({ workspaceId: idSchema })

export function validateBody<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ApiError('VALIDATION_FAILED', 'Request body validation failed.', 400, result.error.flatten())
  }
  return result.data
}
