import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { nowIso, throwOnSupabaseError } from './service-helpers'

interface IdempotencyInput {
  workspaceId: string
  userId: string
  idempotencyKey: string
  requestMethod: string
  requestPath: string
  requestHash: string
}

interface IdempotencyResult {
  replayed: boolean
}

const memoryIdempotency = new Map<string, string>()

export function createIdempotencyService(context: ServiceContext) {
  return {
    async recordOrValidate(input: IdempotencyInput): Promise<IdempotencyResult> {
      const cacheKey = `${input.workspaceId}:${input.userId}:${input.idempotencyKey}`

      if (!context.clients.admin || context.env.mockOnly) {
        const existingHash = memoryIdempotency.get(cacheKey)
        if (existingHash && existingHash !== input.requestHash) {
          throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different request body.', 409)
        }

        memoryIdempotency.set(cacheKey, input.requestHash)
        return { replayed: Boolean(existingHash) }
      }

      const { data: existing, error: selectError } = await context.clients.admin
        .from('api_idempotency_keys')
        .select('request_hash')
        .eq('workspace_id', input.workspaceId)
        .eq('user_id', input.userId)
        .eq('idempotency_key', input.idempotencyKey)
        .maybeSingle()

      throwOnSupabaseError(selectError)

      if (existing && existing.request_hash !== input.requestHash) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different request body.', 409)
      }

      if (existing) {
        return { replayed: true }
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { error: insertError } = await context.clients.admin.from('api_idempotency_keys').insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        idempotency_key: input.idempotencyKey,
        request_method: input.requestMethod,
        request_path: input.requestPath,
        request_hash: input.requestHash,
        response_status: 202,
        expires_at: expiresAt,
        created_at: nowIso(),
        updated_at: nowIso(),
      })

      throwOnSupabaseError(insertError)
      return { replayed: false }
    },
  }
}
