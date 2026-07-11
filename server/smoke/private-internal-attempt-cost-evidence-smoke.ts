import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ApiError } from '../errors/api-error'
import {
  beginPrivateInternalAttemptCostEvidence,
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostClock,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-internal-attempt-cost-'))

try {
  const common = {
    localStorageRoot: root,
    workspaceId: 'workspace-cost-proof',
    projectId: 'project-cost-proof',
    editSessionId: 'edit-cost-proof',
    approvedPlanSnapshotId: 'snapshot-cost-proof',
    approvedWorkItemId: 'work-item-cost-proof',
    jobId: 'job-cost-proof',
    executionAttemptId: 'attempt-cost-proof-1',
    retryAttempt: 0,
    toolId: 'deepfilternet' as const,
    operationId: 'tool.deepfilternet.enhance_voice.v1' as const,
  }
  const linkedCanonicalOutcomeHash = 'a'.repeat(64)
  const first = await beginPrivateInternalAttemptCostEvidence(common, clock([
    1_000_000_000n,
    2_500_000_000n,
  ], ['2026-07-11T12:00:00.000Z']))
  const inserted = await first.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 384_214,
    linkedCanonicalOutcomeHash,
  })
  assert.equal(inserted.idempotencyStatus, 'inserted')
  assert.equal(inserted.evidence.boundary, 'internal_production_cost_only')
  assert.equal(inserted.evidence.evidenceClassification, 'provisional_local_metered')
  assert.equal(inserted.evidence.rateCardVersion, 'rp-ratecard-01-mock-safe')
  assert.equal(inserted.evidence.resourceUsage.wallTimeMilliseconds, 1_500)
  assert.equal(inserted.evidence.resourceUsage.billableMilliseconds, 1_500)
  assert.equal(inserted.evidence.resourceUsage.vcpuCount, 4)
  assert.equal(inserted.evidence.resourceUsage.memoryGib, 4)
  assert.equal(inserted.evidence.resourceUsage.gpuCount, 0)
  assert.equal(inserted.evidence.resourceUsage.outputByteLength, 384_214)
  assert(Number.isSafeInteger(inserted.evidence.actualInternalCostMicros))
  assert(inserted.evidence.actualInternalCostMicros > 0)
  assert.equal(inserted.evidence.linkedCanonicalOutcomeHash, linkedCanonicalOutcomeHash)
  assert.equal(inserted.evidence.persistence.privateLocalCreateOnly, true)
  assert.equal(inserted.evidence.persistence.databaseBacked, false)
  assert.equal(inserted.evidence.persistence.productionDurability, false)
  assert.equal(inserted.evidence.persistence.invoiceReconciled, false)
  assertNoCommercialKeys(inserted.evidence)

  const persisted = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: root,
    workspaceId: common.workspaceId,
    projectId: common.projectId,
    executionAttemptId: common.executionAttemptId,
  })
  assert.deepEqual(persisted, inserted.evidence)

  const replayMeter = await beginPrivateInternalAttemptCostEvidence(common, clock([
    3_000_000_000n,
    9_000_000_000n,
  ], ['2026-07-11T12:01:00.000Z']))
  const replay = await replayMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: 384_214,
    linkedCanonicalOutcomeHash,
  })
  assert.equal(replay.idempotencyStatus, 'duplicate_returned')
  assert.deepEqual(replay.evidence, inserted.evidence)

  await expectCode(() => beginPrivateInternalAttemptCostEvidence({
    ...common,
    jobId: 'different-job',
  }), 'IDEMPOTENCY_CONFLICT')

  const failedInput = {
    ...common,
    executionAttemptId: 'attempt-cost-proof-2',
    retryAttempt: 1,
  }
  const failedMeter = await beginPrivateInternalAttemptCostEvidence(failedInput, clock([
    10_000_000_000n,
    11_250_000_000n,
  ], ['2026-07-11T12:02:00.000Z']))
  const failed = await failedMeter.finalize({
    status: 'failed',
    failureCategory: 'reeditpro_error_absorbed',
    outputByteLength: null,
    linkedCanonicalOutcomeHash: null,
  })
  assert.equal(failed.idempotencyStatus, 'inserted')
  assert.equal(failed.evidence.outcome.status, 'failed')
  assert.equal(failed.evidence.identity.retryAttempt, 1)
  assert.equal(failed.evidence.resourceUsage.outputByteLength, null)
  assert(failed.evidence.actualInternalCostMicros > 0)
  assert.notEqual(failed.evidence.evidenceHash, inserted.evidence.evidenceHash)
  assertNoCommercialKeys(failed.evidence)

  await expectCode(async () => {
    const conflict = await beginPrivateInternalAttemptCostEvidence(failedInput)
    await conflict.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: 384_214,
      linkedCanonicalOutcomeHash,
    })
  }, 'IDEMPOTENCY_CONFLICT')

  console.log(JSON.stringify({
    ok: true,
    schemaVersion: inserted.evidence.schemaVersion,
    rateCardVersion: inserted.evidence.rateCardVersion,
    successfulAttemptCostMicros: inserted.evidence.actualInternalCostMicros,
    failedAttemptCostMicros: failed.evidence.actualInternalCostMicros,
    replayHash: replay.evidence.evidenceHash,
    checks: [
      'attempt_level_internal_cost_only',
      'integer_micros_and_versioned_rate_card',
      'create_only_checksum_protected_private_persistence',
      'same_attempt_replay_returns_same_record',
      'conflicting_replay_fails_closed',
      'retry_attempt_has_distinct_cost_record',
      'executed_failure_retains_internal_cost',
      'commercial_pricing_credit_and_wallet_fields_absent',
    ],
  }))
} finally {
  await rm(root, { recursive: true, force: true })
}

function clock(nanoseconds: bigint[], timestamps: string[]): PrivateInternalAttemptCostClock {
  return {
    monotonicNanoseconds() {
      const value = nanoseconds.shift()
      if (value === undefined) throw new Error('Monotonic smoke clock exhausted.')
      return value
    },
    nowIso() {
      const value = timestamps.shift()
      if (value === undefined) throw new Error('Timestamp smoke clock exhausted.')
      return value
    },
  }
}

async function expectCode(action: () => unknown | Promise<unknown>, code: string) {
  await assert.rejects(async () => action(), (error: unknown) => {
    assert(error instanceof ApiError)
    assert.equal(error.code, code)
    return true
  })
}

function assertNoCommercialKeys(value: unknown): void {
  const keys: string[] = []
  visit(value, keys)
  const forbidden = keys.filter((key) => {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    return normalized.includes('customerprice') || normalized.includes('customercredit') ||
      normalized.includes('servicefee') || normalized.includes('markup') ||
      normalized.includes('margin') || normalized.includes('discount') ||
      normalized.includes('wallet') || normalized.includes('settlement') ||
      normalized.includes('billabletouser') || normalized.includes('toolcostcredit') ||
      normalized === 'credits' || normalized === 'tax' || normalized.startsWith('tax')
  })
  assert.deepEqual(forbidden, [])
}

function visit(value: unknown, keys: string[]): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry) => visit(entry, keys))
    return
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    keys.push(key)
    visit(entry, keys)
  }
}
