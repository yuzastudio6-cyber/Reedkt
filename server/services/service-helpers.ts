import { randomUUID } from 'node:crypto'
import type { PostgrestError } from '@supabase/supabase-js'
import { ApiError } from '../errors/api-error'
import type { ApiErrorCode } from '../errors/error-codes'
import type { ServiceContext } from '../types'

export function nowIso(): string {
  return new Date().toISOString()
}

export function createMockId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

export function ensureAdminClient(context: ServiceContext) {
  if (!context.clients.admin || context.env.mockOnly) {
    throw new ApiError('MOCK_ONLY', 'Supabase service-role runtime is unavailable; returning mock-safe behavior only.', 202)
  }

  return context.clients.admin
}

export function mockWarning(scope: string): string {
  return `${scope} is running in explicit local/mock mode; no Supabase service-role write occurred.`
}

export function throwOnSupabaseError(error: PostgrestError | null, fallbackCode: ApiErrorCode = 'INTERNAL_ERROR'): void {
  if (error) {
    throw new ApiError(fallbackCode, error.message, 500, {
      code: error.code,
      hint: error.hint,
    })
  }
}

export function getRequiredAuthUserId(context: ServiceContext): string {
  if (!context.auth?.userId) {
    throw new ApiError('AUTH_REQUIRED', 'Authenticated user context is required.', 401)
  }

  return context.auth.userId
}

export function sanitizeJson(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !/secret|token|api.?key|signed.?url|service.?role/i.test(key)),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
