import type { RuntimeIdempotencyRecord } from '../../types/backend-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'

export interface IdempotencyCheckResult {
  ok: boolean
  conflict: boolean
  record?: RuntimeIdempotencyRecord
  message: string
  warnings: string[]
  mockOnly: boolean
}

export function createIdempotencyKey(...parts: Array<string | number | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== undefined)
    .map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, '-'))
    .join(':')
}

export function createJobIdempotencyKey(jobId: string, attempt = 1): string {
  return createIdempotencyKey('job', jobId, `attempt-${attempt}`)
}

export function createProviderIdempotencyKey(providerKey: string, generationRequestId: string): string {
  return createIdempotencyKey('provider', providerKey, generationRequestId)
}

export function checkIdempotencyConflictMock(
  db: MockDatabase,
  idempotencyKey: string,
  sourceId?: string,
): IdempotencyCheckResult {
  const record = db.runtimeIdempotencyRecords.find((item) => item.idempotencyKey === idempotencyKey)
  if (!record) {
    return {
      ok: true,
      conflict: false,
      message: 'No mock idempotency conflict found.',
      warnings: [],
      mockOnly: true,
    }
  }

  const conflict = Boolean(sourceId && record.sourceId && record.sourceId !== sourceId)
  return {
    ok: !conflict,
    conflict,
    record,
    message: conflict
      ? 'Mock idempotency conflict detected.'
      : 'Mock idempotency key already has a compatible recorded result.',
    warnings: conflict ? ['Duplicate dispatch must be blocked or reconciled by backend runtime.'] : [],
    mockOnly: true,
  }
}

export function recordIdempotencyResultMock(
  db: MockDatabase,
  input: {
    idempotencyKey: string
    scope: RuntimeIdempotencyRecord['scope']
    sourceId?: string
    result?: Record<string, unknown>
  },
): RuntimeIdempotencyRecord {
  const existing = db.runtimeIdempotencyRecords.find((item) => item.idempotencyKey === input.idempotencyKey)
  if (existing) {
    existing.status = existing.sourceId && input.sourceId && existing.sourceId !== input.sourceId ? 'conflict' : 'completed'
    existing.result = input.result ?? existing.result
    existing.updatedAt = nowIso()
    return existing
  }

  return insertMockRecord(db, 'runtimeIdempotencyRecords', {
    id: createMockId('runtime-idempotency'),
    idempotencyKey: input.idempotencyKey,
    scope: input.scope,
    sourceId: input.sourceId,
    status: 'recorded',
    result: input.result,
    createdAt: nowIso(),
    mockOnly: true,
  })
}

export function createIdempotencySummary(result: IdempotencyCheckResult): string {
  return result.message
}
