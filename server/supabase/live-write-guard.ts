import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { RuntimeEnv } from '../config/env'

export interface LiveSmokeMetadata {
  e2eSmoke: true
  smokeRunId: string
  createdBy: 'rp-e2e-smoke'
  milestone: string
  [key: string]: unknown
}

export interface LiveWriteGuardStatus {
  ok: boolean
  smokeRunId?: string
  writesAllowed: boolean
  cleanupAllowed: boolean
  warnings: string[]
  blockers: string[]
}

const SECRET_MARKER = /api[_-]?key|service[_-]?role|signed[_-]?url|password|bearer|secret|token/i

export function createSmokeRunId(prefix = 'rp-e2e-smoke'): string {
  return `${prefix}-${randomUUID()}`
}

export function createSmokeMetadata(smokeRunId = createSmokeRunId(), extra: Record<string, unknown> = {}): LiveSmokeMetadata {
  return sanitizeLiveSmokePayload({
    ...extra,
    e2eSmoke: true,
    smokeRunId,
    createdBy: 'rp-e2e-smoke',
    milestone: 'RP-E2E-READY-01 Prompt 10',
  }) as LiveSmokeMetadata
}

export function getLiveWriteGuardStatus(env: RuntimeEnv, smokeRunId?: string): LiveWriteGuardStatus {
  const blockers: string[] = []
  const warnings: string[] = []

  if (env.supabaseE2eSmokeMode !== 'live') blockers.push('SUPABASE_E2E_SMOKE_MODE=live is required for live smoke writes.')
  if (!env.supabaseE2eAllowWrites) blockers.push('SUPABASE_E2E_ALLOW_WRITES=true is required for live smoke writes.')
  if (!env.hasSupabaseAdmin) blockers.push('Supabase service-role runtime is not configured.')
  if (!env.supabaseE2eUserId) blockers.push('SUPABASE_E2E_USER_ID must reference an existing safe test user.')
  if (!env.supabaseE2eCleanup) warnings.push('SUPABASE_E2E_CLEANUP=false; live smoke records will remain for manual inspection.')

  return {
    ok: blockers.length === 0,
    smokeRunId,
    writesAllowed: env.supabaseE2eSmokeMode === 'live' && env.supabaseE2eAllowWrites,
    cleanupAllowed: env.supabaseE2eCleanup,
    warnings,
    blockers,
  }
}

export function assertLiveWritesAllowed(env: RuntimeEnv): void {
  const status = getLiveWriteGuardStatus(env)
  if (!status.ok) {
    throw new ApiError('SUPABASE_WRITE_NOT_ALLOWED', 'Live Supabase writes are not allowed for this run.', 403, {
      blockers: status.blockers,
    })
  }
}

export function assertSmokeRecordTag(metadata: unknown): asserts metadata is LiveSmokeMetadata {
  if (!isRecord(metadata)) {
    throw new ApiError('VALIDATION_FAILED', 'Live smoke writes require metadata_json with an E2E smoke tag.', 400)
  }
  if (metadata.e2eSmoke !== true || metadata.createdBy !== 'rp-e2e-smoke' || typeof metadata.smokeRunId !== 'string' || !metadata.smokeRunId.trim()) {
    throw new ApiError('VALIDATION_FAILED', 'Live smoke metadata must include e2eSmoke=true, smokeRunId, and createdBy=rp-e2e-smoke.', 400)
  }
  assertNoSecretMarkers(metadata)
}

export function assertCleanupAllowed(env: RuntimeEnv): void {
  if (!env.supabaseE2eCleanup) {
    throw new ApiError('SUPABASE_WRITE_NOT_ALLOWED', 'SUPABASE_E2E_CLEANUP=false; destructive cleanup is disabled.', 403)
  }
}

export function rejectNonSmokeCleanup(record: { metadata?: unknown; metadata_json?: unknown; smokeRunId?: string }, expectedSmokeRunId: string): void {
  const metadata = record.metadata_json ?? record.metadata
  assertSmokeRecordTag(metadata)
  if (metadata.smokeRunId !== expectedSmokeRunId) {
    throw new ApiError('SUPABASE_WRITE_NOT_ALLOWED', 'Cleanup can only delete records tagged with the same smokeRunId.', 403, {
      expectedSmokeRunId,
      actualSmokeRunId: metadata.smokeRunId,
    })
  }
}

export function sanitizeLiveSmokePayload(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}
  const entries = Object.entries(value)
    .filter(([key]) => !SECRET_MARKER.test(key))
    .map(([key, item]) => [key, sanitizeValue(item)])
  const sanitized = Object.fromEntries(entries)
  assertNoSecretMarkers(sanitized)
  return sanitized
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return SECRET_MARKER.test(value) ? '[redacted]' : value
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (isRecord(value)) return sanitizeLiveSmokePayload(value)
  return value
}

function assertNoSecretMarkers(value: unknown): void {
  const serialized = JSON.stringify(value).toLowerCase()
  if (SECRET_MARKER.test(serialized)) {
    throw new ApiError('VALIDATION_FAILED', 'Live smoke metadata contains secret-like or signed URL markers.', 400)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
