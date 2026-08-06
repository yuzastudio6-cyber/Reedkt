import { createHash, randomBytes, randomUUID } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION,
  largeMediaFinalizationJobRecordSchema,
  type LargeMediaFinalizationJobRecord,
  type LargeMediaFinalizationJobResult,
} from '../validation/large-media-finalization-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const STORE_SOURCE = 'private_large_media_finalization_job_authority' as const
const MAX_RECORD_BYTES = 256 * 1024
const locks = new Map<string, Promise<void>>()

export interface PrivateLargeMediaFinalizationScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

interface PersistedJobEnvelope {
  recordVersion: typeof LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION
  source: typeof STORE_SOURCE
  job: LargeMediaFinalizationJobRecord
  checksumSha256: string
}

export type LargeMediaFinalizationClaim =
  | {
      disposition: 'claimed'
      job: LargeMediaFinalizationJobRecord
      leaseCredential: string
    }
  | {
      disposition: 'already_running' | 'already_completed' | 'terminal_failure'
      job: LargeMediaFinalizationJobRecord
    }

export function clearPrivateLargeMediaFinalizationProcessStateForSmoke(): void {
  locks.clear()
}

export function largeMediaFinalizationJobId(input: {
  ownerUserId: string
  workspaceId: string
  uploadIntentId: string
}): string {
  const digest = createHash('sha256')
    .update([
      LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION,
      safeScopeValue(input.ownerUserId, 'ownerUserId'),
      safeScopeValue(input.workspaceId, 'workspaceId'),
      safeScopeValue(input.uploadIntentId, 'uploadIntentId'),
    ].join('\u0000'))
    .digest('hex')
  return `large-media-finalize-${digest.slice(0, 48)}`
}

export async function readPrivateLargeMediaFinalizationJob(input: {
  scope: PrivateLargeMediaFinalizationScope
  jobId: string
}): Promise<LargeMediaFinalizationJobRecord | undefined> {
  assertScope(input.scope)
  assertExpectedJobIdentity(input.scope, input.jobId)
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: jobRecordPath(input.scope, input.jobId),
  })
  if (!content) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw invalidStoredJob('Large-media finalization authority is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw invalidStoredJob('Large-media finalization authority envelope is invalid.')
  }
  const envelope = parsed as Partial<PersistedJobEnvelope>
  if (
    envelope.recordVersion !== LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION ||
    envelope.source !== STORE_SOURCE || !envelope.job ||
    typeof envelope.checksumSha256 !== 'string'
  ) {
    throw invalidStoredJob('Large-media finalization authority envelope is unsupported.')
  }
  const parsedJob = largeMediaFinalizationJobRecordSchema.safeParse(envelope.job)
  if (!parsedJob.success) {
    throw invalidStoredJob('Large-media finalization authority shape is invalid.', parsedJob.error.flatten())
  }
  const job = parsedJob.data
  if (
    envelope.checksumSha256 !== sha256AuthorityValue(job) ||
    job.ownerUserId !== input.scope.ownerUserId ||
    job.workspaceId !== input.scope.workspaceId ||
    job.jobId !== input.jobId
  ) {
    throw invalidStoredJob('Large-media finalization authority checksum or scope is invalid.')
  }
  assertExpectedJobIdentity(input.scope, job.jobId, job.uploadIntentId)
  return job
}

export async function enqueuePrivateLargeMediaFinalizationJob(input: {
  scope: PrivateLargeMediaFinalizationScope
  projectId: string
  uploadIntentId: string
  uploadPurpose: 'source_media' | 'reference_media'
  expectedSizeBytes: number
  idempotencyKey: string
  requestHash: string
  now: string
}): Promise<LargeMediaFinalizationJobRecord> {
  assertScope(input.scope)
  const jobId = largeMediaFinalizationJobId({
    ownerUserId: input.scope.ownerUserId,
    workspaceId: input.scope.workspaceId,
    uploadIntentId: input.uploadIntentId,
  })
  const idempotencyKey = input.idempotencyKey.trim()
  if (!idempotencyKey || idempotencyKey.length > 240 || !/^[a-f0-9]{64}$/.test(input.requestHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Safe large-media finalization idempotency authority is required.', 400)
  }
  const requested: LargeMediaFinalizationJobRecord = {
    schemaVersion: LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION,
    jobId,
    ownerUserId: input.scope.ownerUserId,
    workspaceId: input.scope.workspaceId,
    projectId: input.projectId,
    uploadIntentId: input.uploadIntentId,
    uploadPurpose: input.uploadPurpose,
    expectedSizeBytes: input.expectedSizeBytes,
    storageMode: 'gcs',
    processingPolicyId: 'restart_safe_hash_probe_finalize_v1',
    status: 'queued',
    attemptCount: 0,
    maximumAttempts: 3,
    idempotencyKeyHash: sha256Text(idempotencyKey),
    requestHash: input.requestHash,
    createdAt: input.now,
    updatedAt: input.now,
    privateInternalOnly: true,
    productReady: false,
    externalBetaReady: false,
    productionReady: false,
  }
  parseJob(requested)
  const result = await mutateJob({
    scope: input.scope,
    jobId,
    mutation: (existing) => {
      if (!existing) return { job: requested, changed: true }
      if (
        existing.uploadIntentId !== requested.uploadIntentId ||
        existing.projectId !== requested.projectId ||
        existing.uploadPurpose !== requested.uploadPurpose ||
        existing.expectedSizeBytes !== requested.expectedSizeBytes ||
        existing.idempotencyKeyHash !== requested.idempotencyKeyHash ||
        existing.requestHash !== requested.requestHash
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Large-media finalization already exists with different authority.',
          409,
        )
      }
      return { job: existing, changed: false }
    },
  })
  return result.job
}

export async function claimPrivateLargeMediaFinalizationJob(input: {
  scope: PrivateLargeMediaFinalizationScope
  jobId: string
  workerInstanceId: string
  now: string
  leaseDurationMs: number
  attemptTimeoutMs: number
  credentialFactory?: () => string
}): Promise<LargeMediaFinalizationClaim> {
  return mutateJob({
    scope: input.scope,
    jobId: input.jobId,
    mutation: (existing) => {
      if (!existing) throw new ApiError('JOB_NOT_FOUND', 'Large-media finalization job was not found.', 404)
      if (existing.status === 'completed') {
        return { job: existing, changed: false, disposition: 'already_completed' as const }
      }
      if (existing.status === 'failed_terminal') {
        return { job: existing, changed: false, disposition: 'terminal_failure' as const }
      }
      const nowMs = Date.parse(input.now)
      if (!Number.isFinite(nowMs)) throw new ApiError('VALIDATION_FAILED', 'Worker claim time is invalid.', 400)
      if (existing.status === 'running' && existing.lease && Date.parse(existing.lease.expiresAt) > nowMs) {
        return { job: existing, changed: false, disposition: 'already_running' as const }
      }
      if (existing.attemptCount >= existing.maximumAttempts) {
        const terminal: LargeMediaFinalizationJobRecord = {
          ...existing,
          status: 'failed_terminal',
          lease: undefined,
          failure: existing.failure ?? {
            code: 'ATTEMPTS_EXHAUSTED',
            summary: 'Large-media finalization exhausted its approved attempts.',
            retryable: false,
            failedAt: input.now,
          },
          updatedAt: input.now,
        }
        return { job: parseJob(terminal), changed: true, disposition: 'terminal_failure' as const }
      }
      const leaseDurationMs = boundedMs(input.leaseDurationMs, 30_000, 15 * 60_000, 'leaseDurationMs')
      const attemptTimeoutMs = boundedMs(input.attemptTimeoutMs, 60_000, 24 * 60 * 60_000, 'attemptTimeoutMs')
      const attemptDeadlineMs = nowMs + attemptTimeoutMs
      const leaseExpiresMs = Math.min(nowMs + leaseDurationMs, attemptDeadlineMs)
      const leaseCredential = (input.credentialFactory ?? (() => randomBytes(32).toString('hex')))()
      if (!/^[a-f0-9]{64}$/.test(leaseCredential)) {
        throw new ApiError('INTERNAL_ERROR', 'Large-media finalization lease credential generation failed.', 500)
      }
      const claimed: LargeMediaFinalizationJobRecord = {
        ...existing,
        status: 'running',
        attemptCount: existing.attemptCount + 1,
        failure: undefined,
        lease: {
          leaseId: `large-media-lease-${randomUUID()}`,
          workerInstanceId: safeScopeValue(input.workerInstanceId, 'workerInstanceId'),
          credentialSha256: sha256Text(leaseCredential),
          claimedAt: input.now,
          heartbeatAt: input.now,
          expiresAt: new Date(leaseExpiresMs).toISOString(),
          attemptDeadlineAt: new Date(attemptDeadlineMs).toISOString(),
        },
        updatedAt: input.now,
      }
      return {
        job: parseJob(claimed),
        changed: true,
        disposition: 'claimed' as const,
        leaseCredential,
      }
    },
  }).then((result) => {
    if (result.disposition === 'claimed') {
      return { disposition: result.disposition, job: result.job, leaseCredential: result.leaseCredential }
    }
    return { disposition: result.disposition, job: result.job }
  })
}

export async function heartbeatPrivateLargeMediaFinalizationJob(input: {
  scope: PrivateLargeMediaFinalizationScope
  jobId: string
  leaseId: string
  leaseCredential: string
  now: string
  leaseDurationMs: number
}): Promise<LargeMediaFinalizationJobRecord> {
  return mutateActiveLease(input, (job, nowMs) => {
    const deadlineMs = Date.parse(job.lease!.attemptDeadlineAt)
    if (nowMs >= deadlineMs) {
      throw new ApiError('WORKER_LEASE_EXPIRED', 'Large-media finalization attempt deadline expired.', 409)
    }
    const leaseDurationMs = boundedMs(input.leaseDurationMs, 30_000, 15 * 60_000, 'leaseDurationMs')
    return {
      ...job,
      lease: {
        ...job.lease!,
        heartbeatAt: input.now,
        expiresAt: new Date(Math.min(nowMs + leaseDurationMs, deadlineMs)).toISOString(),
      },
      updatedAt: input.now,
    }
  })
}

export async function completePrivateLargeMediaFinalizationJob(input: {
  scope: PrivateLargeMediaFinalizationScope
  jobId: string
  leaseId: string
  leaseCredential: string
  result: LargeMediaFinalizationJobResult
  now: string
}): Promise<LargeMediaFinalizationJobRecord> {
  return mutateActiveLease(input, (job) => {
    if (input.result.uploadIntentId !== job.uploadIntentId || input.result.sizeBytes !== job.expectedSizeBytes) {
      throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Finalization result does not match the queued source authority.', 409)
    }
    const completed: LargeMediaFinalizationJobRecord = {
      ...job,
      status: 'completed',
      lease: undefined,
      result: input.result,
      failure: undefined,
      updatedAt: input.now,
      completedAt: input.now,
    }
    return completed
  })
}

export async function failPrivateLargeMediaFinalizationJob(input: {
  scope: PrivateLargeMediaFinalizationScope
  jobId: string
  leaseId: string
  leaseCredential: string
  code: string
  summary: string
  retryable: boolean
  now: string
}): Promise<LargeMediaFinalizationJobRecord> {
  return mutateActiveLease(input, (job) => {
    const retryable = input.retryable && job.attemptCount < job.maximumAttempts
    return {
      ...job,
      status: retryable ? 'failed_retryable' : 'failed_terminal',
      lease: undefined,
      failure: {
        code: input.code.trim().slice(0, 80) || 'FINALIZATION_FAILED',
        summary: input.summary.trim().replace(/\s+/g, ' ').slice(0, 240) || 'Large-media finalization failed.',
        retryable,
        failedAt: input.now,
      },
      updatedAt: input.now,
    }
  })
}

async function mutateActiveLease(
  input: {
    scope: PrivateLargeMediaFinalizationScope
    jobId: string
    leaseId: string
    leaseCredential: string
    now: string
  },
  mutation: (job: LargeMediaFinalizationJobRecord, nowMs: number) => LargeMediaFinalizationJobRecord,
): Promise<LargeMediaFinalizationJobRecord> {
  const result = await mutateJob({
    scope: input.scope,
    jobId: input.jobId,
    mutation: (existing) => {
      if (!existing) throw new ApiError('JOB_NOT_FOUND', 'Large-media finalization job was not found.', 404)
      const nowMs = Date.parse(input.now)
      if (
        existing.status !== 'running' || !existing.lease ||
        existing.lease.leaseId !== input.leaseId ||
        existing.lease.credentialSha256 !== sha256Text(input.leaseCredential) ||
        !Number.isFinite(nowMs) || Date.parse(existing.lease.expiresAt) <= nowMs
      ) {
        throw new ApiError('WORKER_LEASE_EXPIRED', 'Large-media finalization lease is not active.', 409)
      }
      return { job: parseJob(mutation(existing, nowMs)), changed: true }
    },
  })
  return result.job
}

async function mutateJob<T extends { job: LargeMediaFinalizationJobRecord; changed: boolean }>(input: {
  scope: PrivateLargeMediaFinalizationScope
  jobId: string
  mutation: (job: LargeMediaFinalizationJobRecord | undefined) => T
}): Promise<T> {
  assertScope(input.scope)
  const lockKey = `${scopeHash(input.scope)}:${input.jobId}`
  return withProcessLock(lockKey, async () => {
    const existing = await readPrivateLargeMediaFinalizationJob({ scope: input.scope, jobId: input.jobId })
    const result = input.mutation(existing)
    if (!result.changed) return result
    await persistJob(input.scope, result.job)
    return result
  })
}

async function persistJob(
  scope: PrivateLargeMediaFinalizationScope,
  job: LargeMediaFinalizationJobRecord,
): Promise<void> {
  const parsed = parseJob(job)
  const envelope: PersistedJobEnvelope = {
    recordVersion: LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION,
    source: STORE_SOURCE,
    job: parsed,
    checksumSha256: sha256AuthorityValue(parsed),
  }
  const content = `${stableAuthorityStringify(envelope)}\n`
  if (Buffer.byteLength(content) > MAX_RECORD_BYTES) {
    throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', 'Large-media finalization record exceeded its safe bound.', 503)
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: jobRecordPath(scope, parsed.jobId),
    content,
  })
}

function jobRecordPath(scope: PrivateLargeMediaFinalizationScope, jobId: string): string {
  return `internal/large-media-finalization/${scopeHash(scope)}/${safeScopeValue(jobId, 'jobId')}.json`
}

function scopeHash(scope: PrivateLargeMediaFinalizationScope): string {
  assertScope(scope)
  return createHash('sha256')
    .update([LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION, scope.ownerUserId, scope.workspaceId].join('\u0000'))
    .digest('hex')
}

function assertExpectedJobIdentity(
  scope: PrivateLargeMediaFinalizationScope,
  jobId: string,
  uploadIntentId?: string,
): void {
  safeScopeValue(jobId, 'jobId')
  if (uploadIntentId) {
    const expected = largeMediaFinalizationJobId({
      ownerUserId: scope.ownerUserId,
      workspaceId: scope.workspaceId,
      uploadIntentId,
    })
    if (jobId !== expected) throw invalidStoredJob('Large-media finalization job identity is invalid.')
  }
}

function assertScope(scope: PrivateLargeMediaFinalizationScope): void {
  if (!scope.localStorageRoot.trim()) {
    throw new ApiError('VALIDATION_FAILED', 'Private large-media finalization storage root is required.', 400)
  }
  safeScopeValue(scope.ownerUserId, 'ownerUserId')
  safeScopeValue(scope.workspaceId, 'workspaceId')
}

function safeScopeValue(value: string, field: string): string {
  const normalized = value.trim()
  if (
    !normalized || normalized.length > 160 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized) || normalized.includes('..')
  ) {
    throw new ApiError('VALIDATION_FAILED', `Safe ${field} is required.`, 400)
  }
  return normalized
}

function parseJob(value: unknown): LargeMediaFinalizationJobRecord {
  const parsed = largeMediaFinalizationJobRecordSchema.safeParse(value)
  if (!parsed.success) throw invalidStoredJob('Large-media finalization job is invalid.', parsed.error.flatten())
  return parsed.data
}

function boundedMs(value: number, minimum: number, maximum: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new ApiError('VALIDATION_FAILED', `${field} is outside the approved range.`, 400)
  }
  return value
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalidStoredJob(message: string, details?: unknown): ApiError {
  return new ApiError('INTERNAL_ERROR', message, 500, details, { internal: true })
}

async function withProcessLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  const queued = previous.then(() => current)
  locks.set(key, queued)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (locks.get(key) === queued) locks.delete(key)
  }
}
