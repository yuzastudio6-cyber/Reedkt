import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'

export interface ProductionRateLimitInput {
  routeId: string
  workspaceId: string
  userId: string
  projectId?: string
  editSessionId?: string
  markerId?: string
  maxHits: number
  windowMs: number
  scopeParts?: string[]
}

export interface ProductionRateLimitResult {
  allowed: boolean
  routeId: string
  scopeKey: string
  hitCount: number
  maxHits: number
  windowMs: number
  windowStartedAt: string
  supabaseWriteMade: false
  warnings: string[]
}

const memoryBuckets = new Map<string, { hitCount: number; expiresAt: number }>()

export function createProductionRateLimitService(context: ServiceContext) {
  return {
    async assertAllowed(input: ProductionRateLimitInput): Promise<ProductionRateLimitResult> {
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'INTERNAL_ERROR',
          'Distributed production rate limiting is fail-closed until the canonical Supabase baseline is approved.',
          503,
        )
      }

      if (!context.env.allowMockWithoutSupabase || context.env.nodeEnv === 'production' || context.env.mode === 'cloud_run') {
        throw new ApiError('RATE_LIMITED', 'Local in-memory rate limiting is unavailable outside explicit local mock mode.', 429)
      }

      const scopeKey = createScopeKey(input)
      const now = Date.now()
      const existing = memoryBuckets.get(scopeKey)
      const hitCount = existing && existing.expiresAt > now ? existing.hitCount + 1 : 1
      memoryBuckets.set(scopeKey, { hitCount, expiresAt: now + input.windowMs })

      if (hitCount > input.maxHits) {
        throw new ApiError('RATE_LIMITED', 'Production route rate limit exceeded.', 429, {
          routeId: input.routeId,
          hitCount,
          maxHits: input.maxHits,
          windowMs: input.windowMs,
          scopeKey,
        })
      }

      return {
        allowed: true,
        routeId: input.routeId,
        scopeKey,
        hitCount,
        maxHits: input.maxHits,
        windowMs: input.windowMs,
        windowStartedAt: new Date(Math.floor(now / input.windowMs) * input.windowMs).toISOString(),
        supabaseWriteMade: false,
        warnings: ['Rate limit checked in process-local memory for explicit local mock runtime only.'],
      }
    },
  }
}

function createScopeKey(input: ProductionRateLimitInput): string {
  return createHash('sha256').update([
    input.routeId,
    input.workspaceId,
    input.userId,
    input.projectId ?? '',
    input.editSessionId ?? '',
    input.markerId ?? '',
    ...(input.scopeParts ?? []),
  ].join(':')).digest('hex')
}
