import { resolve } from 'node:path'

import { ApiError } from '../errors/api-error'
import {
  inspectPrivateFlatDirectoryWithinRoot,
  listPrivateRegularDirectoriesWithinRoot,
  removePrivateDirectoryTreeWithinRoot,
  type PrivateDirectoryIdentity,
} from '../security/private-local-persistence'
import {
  PRIVATE_SOURCE_PROBE_ATTEMPT_ID_PATTERN,
  PRIVATE_SOURCE_PROBE_SCOPE_HASH_PATTERN,
  privateSourceProbeAttemptRelativeDirectory,
  privateSourceProbeScopeRelativeDirectory,
  privateSourceProbeVersionRelativeDirectory,
} from './private-source-probe-paths'
import { isPrivateSourceProbeAttemptActive } from './private-source-probe-staging'

export const PRIVATE_SOURCE_PROBE_MINIMUM_ORPHAN_AGE_MS = 24 * 60 * 60 * 1_000

export type PrivateSourceProbeOrphanReconciliationMode = 'inspect_only' | 'delete_stale'

export interface PrivateSourceProbeOrphanReconciliationLimits {
  maximumScopes: number
  maximumAttemptsPerScope: number
  maximumTotalAttempts: number
  maximumEntriesPerAttempt: number
  maximumDeletes: number
}

export interface PrivateSourceProbeOrphanReconciliationReport {
  schemaVersion: 'private-source-probe-orphan-reconciliation-v1'
  mode: PrivateSourceProbeOrphanReconciliationMode
  status: 'completed'
  staleAfterMs: number
  scopeCount: number
  emptyScopeCount: number
  attemptCount: number
  staleCandidateCount: number
  activeAttemptSkippedCount: number
  recentAttemptSkippedCount: number
  futureDatedAttemptSkippedCount: number
  removedAttemptCount: number
  deletionAuthorityUsed: boolean
  singleProcessLocalInternalOnly: true
  sharedOrDistributedStorageSafe: false
  productionReady: false
}

type ReconciliationCandidate = {
  relativeDirectory: string
  identity: PrivateDirectoryIdentity
  newestActivityAtMs: number
}

const DEFAULT_LIMITS: PrivateSourceProbeOrphanReconciliationLimits = {
  maximumScopes: 128,
  maximumAttemptsPerScope: 256,
  maximumTotalAttempts: 2_048,
  maximumEntriesPerAttempt: 8,
  maximumDeletes: 128,
}

const HARD_LIMITS: PrivateSourceProbeOrphanReconciliationLimits = {
  maximumScopes: 512,
  maximumAttemptsPerScope: 512,
  maximumTotalAttempts: 4_096,
  maximumEntriesPerAttempt: 16,
  maximumDeletes: 256,
}

const reconciliationLocks = new Map<string, Promise<void>>()

export async function reconcilePrivateSourceProbeOrphans(input: {
  localStorageRoot: string
  mode?: PrivateSourceProbeOrphanReconciliationMode
  staleAfterMs?: number
  nowMs?: number
  limits?: Partial<PrivateSourceProbeOrphanReconciliationLimits>
  maintenanceAuthority?: {
    kind: 'private_single_process_local_storage_maintenance'
    requestServingStopped: true
    exclusiveLocalStorageRootConfirmed: true
  }
  onPreflightComplete?: () => Promise<void>
}): Promise<PrivateSourceProbeOrphanReconciliationReport> {
  const localStorageRoot = input.localStorageRoot.trim()
  if (!localStorageRoot) throw reconciliationError('private_source_probe_reconciliation_root_required')
  const mode = input.mode ?? 'inspect_only'
  if (mode !== 'inspect_only' && mode !== 'delete_stale') {
    throw reconciliationError('private_source_probe_reconciliation_mode_invalid')
  }
  const staleAfterMs = input.staleAfterMs ?? PRIVATE_SOURCE_PROBE_MINIMUM_ORPHAN_AGE_MS
  if (!Number.isSafeInteger(staleAfterMs) || staleAfterMs < PRIVATE_SOURCE_PROBE_MINIMUM_ORPHAN_AGE_MS) {
    throw reconciliationError('private_source_probe_reconciliation_age_below_minimum')
  }
  const nowMs = input.nowMs ?? Date.now()
  if (!Number.isFinite(nowMs) || nowMs <= 0) {
    throw reconciliationError('private_source_probe_reconciliation_now_invalid')
  }
  if (mode === 'delete_stale' && !hasMaintenanceAuthority(input.maintenanceAuthority)) {
    throw reconciliationError('private_source_probe_reconciliation_maintenance_authority_required')
  }
  const limits = normalizedLimits(input.limits)

  return withPrivateSourceProbeReconciliationLock(localStorageRoot, async () => {
    try {
      return await reconcileWithinLock({
        localStorageRoot,
        mode,
        staleAfterMs,
        nowMs,
        limits,
        onPreflightComplete: input.onPreflightComplete,
      })
    } catch (error) {
      if (isPrivateSourceProbeReconciliationError(error)) throw error
      throw reconciliationError(privatePersistenceReason(error), error)
    }
  })
}

export function isPrivateSourceProbeReconciliationError(error: unknown): error is ApiError {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED') return false
  const details = error.details
  return Boolean(
    details
    && typeof details === 'object'
    && 'reason' in details
    && typeof details.reason === 'string'
    && details.reason.startsWith('private_source_probe_reconciliation_'),
  )
}

async function reconcileWithinLock(input: {
  localStorageRoot: string
  mode: PrivateSourceProbeOrphanReconciliationMode
  staleAfterMs: number
  nowMs: number
  limits: PrivateSourceProbeOrphanReconciliationLimits
  onPreflightComplete?: () => Promise<void>
}): Promise<PrivateSourceProbeOrphanReconciliationReport> {
  const cutoffMs = input.nowMs - input.staleAfterMs
  const scopes = await listPrivateRegularDirectoriesWithinRoot({
    rootPath: input.localStorageRoot,
    relativeDirectoryPath: privateSourceProbeVersionRelativeDirectory(),
    maximumEntries: input.limits.maximumScopes,
  })
  let emptyScopeCount = 0
  let attemptCount = 0
  let activeAttemptSkippedCount = 0
  let recentAttemptSkippedCount = 0
  let futureDatedAttemptSkippedCount = 0
  const candidates: ReconciliationCandidate[] = []

  for (const scope of scopes) {
    if (!PRIVATE_SOURCE_PROBE_SCOPE_HASH_PATTERN.test(scope.name)) {
      throw reconciliationError('private_source_probe_reconciliation_scope_name_invalid')
    }
    const attempts = await listPrivateRegularDirectoriesWithinRoot({
      rootPath: input.localStorageRoot,
      relativeDirectoryPath: privateSourceProbeScopeRelativeDirectory(scope.name),
      maximumEntries: input.limits.maximumAttemptsPerScope,
      expectedIdentity: scope.identity,
    })
    if (attempts.length === 0) emptyScopeCount += 1
    attemptCount += attempts.length
    if (attemptCount > input.limits.maximumTotalAttempts) {
      throw reconciliationError('private_source_probe_reconciliation_attempt_limit_exceeded')
    }

    for (const attempt of attempts) {
      if (!PRIVATE_SOURCE_PROBE_ATTEMPT_ID_PATTERN.test(attempt.name)) {
        throw reconciliationError('private_source_probe_reconciliation_attempt_name_invalid')
      }
      const relativeDirectory = privateSourceProbeAttemptRelativeDirectory(scope.name, attempt.name)
      const inspection = await inspectPrivateFlatDirectoryWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativeDirectory,
        maximumEntries: input.limits.maximumEntriesPerAttempt,
        expectedIdentity: attempt.identity,
      })
      if (!inspection) {
        throw reconciliationError('private_source_probe_reconciliation_state_changed_during_preflight')
      }
      if (isPrivateSourceProbeAttemptActive({
        localStorageRoot: input.localStorageRoot,
        relativeDirectory,
        identity: inspection.identity,
      })) {
        activeAttemptSkippedCount += 1
        continue
      }
      if (inspection.newestActivityAtMs > input.nowMs) {
        futureDatedAttemptSkippedCount += 1
        continue
      }
      if (inspection.newestActivityAtMs >= cutoffMs) {
        recentAttemptSkippedCount += 1
        continue
      }
      candidates.push({
        relativeDirectory,
        identity: inspection.identity,
        newestActivityAtMs: inspection.newestActivityAtMs,
      })
    }
  }

  if (candidates.length > input.limits.maximumDeletes) {
    throw reconciliationError('private_source_probe_reconciliation_delete_limit_exceeded')
  }
  if (input.mode === 'inspect_only') {
    return report({
      mode: input.mode,
      staleAfterMs: input.staleAfterMs,
      scopeCount: scopes.length,
      emptyScopeCount,
      attemptCount,
      staleCandidateCount: candidates.length,
      activeAttemptSkippedCount,
      recentAttemptSkippedCount,
      futureDatedAttemptSkippedCount,
      removedAttemptCount: 0,
    })
  }

  await input.onPreflightComplete?.()
  const finalCandidates: ReconciliationCandidate[] = []
  for (const candidate of candidates) {
    if (isPrivateSourceProbeAttemptActive({
      localStorageRoot: input.localStorageRoot,
      relativeDirectory: candidate.relativeDirectory,
      identity: candidate.identity,
    })) {
      activeAttemptSkippedCount += 1
      continue
    }
    const inspection = await inspectPrivateFlatDirectoryWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: candidate.relativeDirectory,
      maximumEntries: input.limits.maximumEntriesPerAttempt,
      expectedIdentity: candidate.identity,
    })
    if (!inspection || inspection.newestActivityAtMs !== candidate.newestActivityAtMs) {
      throw reconciliationError('private_source_probe_reconciliation_state_changed_before_delete')
    }
    if (inspection.newestActivityAtMs >= cutoffMs || inspection.newestActivityAtMs > input.nowMs) {
      throw reconciliationError('private_source_probe_reconciliation_candidate_became_recent')
    }
    finalCandidates.push(candidate)
  }

  let removedAttemptCount = 0
  for (const candidate of finalCandidates) {
    const removal = await removePrivateDirectoryTreeWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: candidate.relativeDirectory,
      expectedIdentity: candidate.identity,
    })
    if (!removal.removed) {
      throw reconciliationError('private_source_probe_reconciliation_state_changed_during_delete')
    }
    removedAttemptCount += 1
  }

  return report({
    mode: input.mode,
    staleAfterMs: input.staleAfterMs,
    scopeCount: scopes.length,
    emptyScopeCount,
    attemptCount,
    staleCandidateCount: candidates.length,
    activeAttemptSkippedCount,
    recentAttemptSkippedCount,
    futureDatedAttemptSkippedCount,
    removedAttemptCount,
  })
}

function report(input: {
  mode: PrivateSourceProbeOrphanReconciliationMode
  staleAfterMs: number
  scopeCount: number
  emptyScopeCount: number
  attemptCount: number
  staleCandidateCount: number
  activeAttemptSkippedCount: number
  recentAttemptSkippedCount: number
  futureDatedAttemptSkippedCount: number
  removedAttemptCount: number
}): PrivateSourceProbeOrphanReconciliationReport {
  return Object.freeze({
    schemaVersion: 'private-source-probe-orphan-reconciliation-v1',
    mode: input.mode,
    status: 'completed',
    staleAfterMs: input.staleAfterMs,
    scopeCount: input.scopeCount,
    emptyScopeCount: input.emptyScopeCount,
    attemptCount: input.attemptCount,
    staleCandidateCount: input.staleCandidateCount,
    activeAttemptSkippedCount: input.activeAttemptSkippedCount,
    recentAttemptSkippedCount: input.recentAttemptSkippedCount,
    futureDatedAttemptSkippedCount: input.futureDatedAttemptSkippedCount,
    removedAttemptCount: input.removedAttemptCount,
    deletionAuthorityUsed: input.mode === 'delete_stale',
    singleProcessLocalInternalOnly: true,
    sharedOrDistributedStorageSafe: false,
    productionReady: false,
  })
}

function normalizedLimits(
  input: Partial<PrivateSourceProbeOrphanReconciliationLimits> | undefined,
): PrivateSourceProbeOrphanReconciliationLimits {
  return {
    maximumScopes: boundedLimit(input?.maximumScopes, DEFAULT_LIMITS.maximumScopes, HARD_LIMITS.maximumScopes),
    maximumAttemptsPerScope: boundedLimit(
      input?.maximumAttemptsPerScope,
      DEFAULT_LIMITS.maximumAttemptsPerScope,
      HARD_LIMITS.maximumAttemptsPerScope,
    ),
    maximumTotalAttempts: boundedLimit(
      input?.maximumTotalAttempts,
      DEFAULT_LIMITS.maximumTotalAttempts,
      HARD_LIMITS.maximumTotalAttempts,
    ),
    maximumEntriesPerAttempt: boundedLimit(
      input?.maximumEntriesPerAttempt,
      DEFAULT_LIMITS.maximumEntriesPerAttempt,
      HARD_LIMITS.maximumEntriesPerAttempt,
    ),
    maximumDeletes: boundedLimit(input?.maximumDeletes, DEFAULT_LIMITS.maximumDeletes, HARD_LIMITS.maximumDeletes),
  }
}

function boundedLimit(value: number | undefined, fallback: number, hardMaximum: number): number {
  const resolved = value ?? fallback
  if (!Number.isSafeInteger(resolved) || resolved <= 0 || resolved > hardMaximum) {
    throw reconciliationError('private_source_probe_reconciliation_limit_invalid')
  }
  return resolved
}

function hasMaintenanceAuthority(
  value: {
    kind: 'private_single_process_local_storage_maintenance'
    requestServingStopped: true
    exclusiveLocalStorageRootConfirmed: true
  } | undefined,
): boolean {
  return Boolean(
    value
    && value.kind === 'private_single_process_local_storage_maintenance'
    && value.requestServingStopped === true
    && value.exclusiveLocalStorageRootConfirmed === true,
  )
}

async function withPrivateSourceProbeReconciliationLock<T>(
  localStorageRoot: string,
  operation: () => Promise<T>,
): Promise<T> {
  const key = resolve(localStorageRoot)
  const previous = reconciliationLocks.get(key) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolveLock) => {
    release = resolveLock
  })
  const queued = previous.catch(() => undefined).then(() => current)
  reconciliationLocks.set(key, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (reconciliationLocks.get(key) === queued) reconciliationLocks.delete(key)
  }
}

function reconciliationError(reason: string, cause?: unknown): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Private source probe orphan reconciliation failed closed.',
    409,
    { reason },
    cause === undefined ? {} : { cause },
  )
}

function privatePersistenceReason(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details
    if (
      details
      && typeof details === 'object'
      && 'reason' in details
      && typeof details.reason === 'string'
      && /^[a-z0-9_]+$/.test(details.reason)
    ) {
      return `private_source_probe_reconciliation_${details.reason}`
    }
  }
  return 'private_source_probe_reconciliation_filesystem_refused'
}
