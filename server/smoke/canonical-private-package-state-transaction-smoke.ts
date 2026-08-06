import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import { GCP_PRODUCTION_API_SERVICE } from '../config/gcp-production-config'
import {
  canonicalCloudWorkerDispatchHandoffManifestSchema,
  createCanonicalCloudRuntimeRegionAuthority,
  createCanonicalProvenToolCloudDispatchCatalog,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalPrivateServiceIdentityFixture,
  type CanonicalVerifiedServiceIdentity,
} from '../security/canonical-service-identity-verifier'
import {
  createCanonicalPrivateCloudDispatchReceiverService,
} from '../services/canonical-private-cloud-dispatch-receiver-service'
import {
  readPrivateCanonicalCloudDispatchOutbox,
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
} from '../services/private-canonical-cloud-dispatch-outbox-store'
import {
  claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt,
} from '../services/private-canonical-package-cloud-dispatch-transaction-store'
import {
  ensurePrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueueForPackageStateTransaction,
} from '../services/private-canonical-package-work-queue-store'
import {
  canonicalPrivatePackageStatePaths,
  type CanonicalPrivatePackageStateLockAuthority,
  type CanonicalPrivatePackageStateFaultStage,
  type CanonicalPrivatePackageStateScope,
} from '../services/private-canonical-package-state-transaction'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  beginPrivateInternalAttemptCostEvidence,
  privateInternalAttemptCostEvidenceRelativePath,
  privateInternalAttemptCostEvidenceSchema,
  readPrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { ServiceContext } from '../types'
import type {
  CanonicalCloudDispatchWorkerCompletionEvidence,
  CanonicalCloudDispatchWorkerFailureEvidence,
  CanonicalServiceIdentityEvidence,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import { REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP } from
  '../../src/backend/cloud/reeditpro-gcp-production-resource-map'

const baseTimeMs = Date.parse('2026-07-17T08:00:00.000Z')
const committedAt = new Date(baseTimeMs + 1_000).toISOString()
const completionAt = new Date(baseTimeMs + 2_000).toISOString()
const failureAt = completionAt
const timeoutAt = new Date(baseTimeMs + 121_000).toISOString()
const controllerAudience = 'https://private-controller.reeditpro.test'
const workerAudience = 'https://private-worker.reeditpro.test'
const roots: string[] = []

try {
  const afterCommit = await proveFaultRecovery('after_write_ahead_commit', 'after-commit')
  const afterQueue = await proveFaultRecovery('after_queue_projection', 'after-queue')
  const realCrashAfterCommit = await proveRealProcessCrashRecovery(
    'crash-after-commit',
    'real-crash-after-commit',
  )
  const realCrashAfterQueue = await proveRealProcessCrashRecovery(
    'crash-after-queue',
    'real-crash-after-queue',
  )
  const completionAfterCommit = await proveCompletionFaultRecovery(
    'after_write_ahead_commit',
    'completion-after-commit',
  )
  const completionAfterQueue = await proveCompletionFaultRecovery(
    'after_queue_projection',
    'completion-after-queue',
  )
  const realCompletionCrashAfterCommit = await proveRealCompletionProcessCrashRecovery(
    'crash-completion-after-commit',
    'real-completion-crash-after-commit',
  )
  const realCompletionCrashAfterQueue = await proveRealCompletionProcessCrashRecovery(
    'crash-completion-after-queue',
    'real-completion-crash-after-queue',
  )
  const completionRace = await proveCrossProcessCompletionRace()
  await proveTamperedCompletionTransactionFailsClosed()
  await proveCompletionProjectionDriftFailsClosed()
  await proveExpiredCompletionFailsClosed()
  const failureAfterCommit = await proveFailureFaultRecovery(
    'after_write_ahead_commit',
    'failure-after-commit',
  )
  const failureAfterQueue = await proveFailureFaultRecovery(
    'after_queue_projection',
    'failure-after-queue',
  )
  const realFailureCrashAfterCommit = await proveRealFailureProcessCrashRecovery(
    'crash-failure-after-commit',
    'real-failure-crash-after-commit',
  )
  const realFailureCrashAfterQueue = await proveRealFailureProcessCrashRecovery(
    'crash-failure-after-queue',
    'real-failure-crash-after-queue',
  )
  const failureRace = await proveCrossProcessFailureRace()
  const terminalRace = await proveCompletionFailureTerminalRace()
  await proveFailedAttemptCannotComplete()
  await proveTamperedFailureTransactionFailsClosed()
  await proveFailureProjectionDriftFailsClosed()
  await proveExpiredFailureFailsClosed()
  await proveUserReviewFailureDoesNotRetry()
  const failureCost = await proveVersionedAttemptCostEvidenceBoundToFailure()
  const timeoutAfterCommit = await proveTimeoutFaultRecovery(
    'after_write_ahead_commit',
    'timeout-after-commit',
  )
  const timeoutAfterQueue = await proveTimeoutFaultRecovery(
    'after_queue_projection',
    'timeout-after-queue',
  )
  const realTimeoutCrashAfterCommit = await proveRealTimeoutProcessCrashRecovery(
    'crash-timeout-after-commit',
    'real-timeout-crash-after-commit',
  )
  const realTimeoutCrashAfterQueue = await proveRealTimeoutProcessCrashRecovery(
    'crash-timeout-after-queue',
    'real-timeout-crash-after-queue',
  )
  const timeoutRace = await proveCrossProcessTimeoutRace()
  const timeoutTerminalRace = await proveTimeoutCompletionFailureTerminalRace()
  await proveTimedOutAttemptCannotCompleteOrFail()
  await proveTamperedTimeoutTransactionFailsClosed()
  await proveTimeoutProjectionDriftFailsClosed()
  await proveTimeoutBeforeExpiryFailsClosed()
  await proveWrongControllerTimeoutIdentityFailsClosed()
  await proveMissingTimeoutAttemptCostEvidenceFailsClosed()
  await proveTamperedTimeoutAttemptCostEvidenceFailsClosed()
  await proveMismatchedTimeoutAttemptCostEvidenceFailsClosed()
  const timeoutCost = await proveVersionedAttemptCostEvidenceBoundToTimeout()
  await proveTamperedTransactionFailsClosed()
  await proveProjectionDriftFailsClosed()
  await proveTransactionOnlyReadsRequireActiveLock()
  const queueRace = await proveGenericQueueCrossProcessClaimRace()
  const race = await proveCrossProcessClaimRace()
  const expiredClaim = await proveAcceptedWorkerTimeoutFencesAndExhaustionPersists()
  const staleLock = await proveDeadOwnerLockRecovery()
  await proveLockSymlinkRefusal()

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'atomic_write_ahead_record_is_the_queue_claim_and_outbox_commit_point',
      'crash_after_commit_before_projection_recovers_queue_and_outbox_together',
      'crash_after_queue_projection_recovers_missing_outbox_without_another_attempt',
      'real_process_exit_after_commit_recovers_wal_and_dead_owner_lock',
      'real_process_exit_after_queue_projection_recovers_outbox_without_another_attempt',
      'worker_completion_queue_and_outbox_share_one_write_ahead_commit',
      'completion_crash_after_commit_recovers_queue_and_outbox_together',
      'completion_crash_after_queue_projection_recovers_outbox_without_duplicate_completion',
      'real_process_exit_during_completion_recovers_exactly_once_at_both_commit_stages',
      'separate_node_processes_reconcile_one_completion_and_one_exact_replay',
      'tampered_completion_transaction_fails_closed_without_projection_mutation',
      'completion_projection_drift_fails_closed_without_overwrite',
      'expired_package_attempt_cannot_reconcile_worker_completion',
      'worker_failure_release_and_terminal_outbox_share_one_write_ahead_commit',
      'failure_crash_after_commit_recovers_queue_and_outbox_together',
      'failure_crash_after_queue_projection_recovers_outbox_without_duplicate_release',
      'real_process_exit_during_failure_recovers_exactly_once_at_both_commit_stages',
      'separate_node_processes_reconcile_one_failure_and_one_exact_replay',
      'completion_and_failure_race_terminalizes_exactly_one_outcome',
      'terminal_failure_cannot_later_be_reconciled_as_completion',
      'tampered_failure_transaction_fails_closed_without_projection_mutation',
      'failure_projection_drift_fails_closed_without_overwrite',
      'expired_package_attempt_cannot_reconcile_worker_failure',
      'unknown_internal_failure_requires_user_review_without_automatic_retry',
      'failed_attempt_receipt_binds_versioned_internal_production_cost_evidence',
      'accepted_worker_timeout_release_and_terminal_outbox_share_one_write_ahead_commit',
      'timeout_crash_after_commit_recovers_queue_and_outbox_together',
      'timeout_crash_after_queue_projection_recovers_outbox_without_duplicate_release',
      'real_process_exit_during_timeout_recovers_exactly_once_at_both_commit_stages',
      'separate_node_processes_reconcile_one_timeout_and_one_exact_replay',
      'timeout_completion_and_failure_race_terminalizes_exactly_one_outcome',
      'terminal_timeout_cannot_later_be_reconciled_as_completion_or_failure',
      'tampered_timeout_transaction_fails_closed_without_projection_mutation',
      'timeout_projection_drift_fails_closed_without_overwrite',
      'unexpired_accepted_worker_attempt_cannot_be_reconciled_as_timed_out',
      'timeout_requires_the_exact_accepted_controller_principal',
      'timeout_refuses_missing_persisted_attempt_cost_evidence_without_mutation',
      'timeout_refuses_tampered_persisted_attempt_cost_evidence_without_mutation',
      'timeout_refuses_valid_but_mismatched_attempt_cost_identity_without_mutation',
      'timed_out_attempt_receipt_binds_versioned_internal_production_cost_evidence',
      'tampered_transaction_record_fails_closed_without_projection_mutation',
      'out_of_band_projection_drift_fails_closed_without_overwrite',
      'transaction_only_projection_reads_require_live_package_lock_capability',
      'separate_node_processes_create_one_generic_queue_claim',
      'separate_node_processes_create_one_claim_one_attempt_and_one_outbox_entry',
      'expired_accepted_worker_attempt_fences_later_attempt_until_atomic_timeout_reconciliation',
      'second_reconciled_timeout_exhausts_attempts_without_a_third_outbox',
      'dead_same_host_lock_owner_is_reclaimed_after_real_child_process_termination',
      'lock_target_symlink_is_refused_without_external_file_mutation',
      'private_queue_outbox_transaction_and_lock_files_use_restrictive_modes',
      'distributed_database_google_cloud_worker_and_production_authority_remain_false',
    ],
    summary: {
      recoveredAfterCommit: afterCommit,
      recoveredAfterQueueProjection: afterQueue,
      realProcessCrashAfterCommit: realCrashAfterCommit,
      realProcessCrashAfterQueueProjection: realCrashAfterQueue,
      completionAfterCommit,
      completionAfterQueueProjection: completionAfterQueue,
      realCompletionCrashAfterCommit,
      realCompletionCrashAfterQueueProjection: realCompletionCrashAfterQueue,
      crossProcessCompletionDispositions: completionRace,
      failureAfterCommit,
      failureAfterQueueProjection: failureAfterQueue,
      realFailureCrashAfterCommit,
      realFailureCrashAfterQueueProjection: realFailureCrashAfterQueue,
      crossProcessFailureDispositions: failureRace,
      completionFailureTerminalRace: terminalRace,
      failedAttemptInternalCostEvidence: failureCost,
      timeoutAfterCommit,
      timeoutAfterQueueProjection: timeoutAfterQueue,
      realTimeoutCrashAfterCommit,
      realTimeoutCrashAfterQueueProjection: realTimeoutCrashAfterQueue,
      crossProcessTimeoutDispositions: timeoutRace,
      timeoutCompletionFailureTerminalRace: timeoutTerminalRace,
      timedOutAttemptInternalCostEvidence: timeoutCost,
      genericQueueCrossProcessDispositions: queueRace,
      crossProcessDispositions: race,
      expiredClaimAttemptProgression: expiredClaim,
      deadOwnerLockRecovered: staleLock,
      distributedDatabaseTransactionVerified: false,
      productionAuthority: false,
    },
  }))
} finally {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
}

async function proveTransactionOnlyReadsRequireActiveLock(): Promise<void> {
  const fixture = await createFixture('forged-lock-authority')
  const forgedAuthority = Object.freeze({
    scope: Object.freeze({ ...fixture.scope }),
    paths: Object.freeze(canonicalPrivatePackageStatePaths(fixture.scope)),
  }) as CanonicalPrivatePackageStateLockAuthority
  await expectApiError(
    () => readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
      forgedAuthority,
      fixture.scope,
      fixture.definition,
    ),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  await expectApiError(
    () => readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
      forgedAuthority,
      fixture.scope,
    ),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
}

async function proveRealProcessCrashRecovery(
  mode: 'crash-after-commit' | 'crash-after-queue',
  suffix: string,
) {
  const fixture = await createFixture(suffix)
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const scopePath = join(fixture.rootPath, `${suffix}-scope.json`)
  const definitionPath = join(fixture.rootPath, `${suffix}-definition.json`)
  const manifestPath = join(fixture.rootPath, `${suffix}-manifest.json`)
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  await writeFile(definitionPath, JSON.stringify(fixture.definition))
  await writeFile(manifestPath, JSON.stringify(fixture.manifest))
  const child = spawnChild(mode, [scopePath, definitionPath, manifestPath, committedAt])
  const exit = await waitForExit(child)
  assert.equal(exit.code, 77)
  assert.equal(exit.signal, null)
  assert.equal(await pathExists(fixture.transactionPath), true)
  assert.equal(await pathExists(fixture.lockPath), true)
  assert.equal((await stat(fixture.transactionPath)).mode & 0o777, 0o600)
  assert.equal((await stat(fixture.lockPath)).mode & 0o777, 0o600)
  if (mode === 'crash-after-commit') {
    assert.equal(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
  } else {
    assert.notEqual(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
  }
  assert.equal(await pathExists(fixture.outboxPath), false)

  const recovered = await claim(fixture)
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    mode === 'crash-after-commit',
  )
  assert.equal(await pathExists(fixture.transactionPath), false)
  assert.equal(await pathExists(fixture.lockPath), false)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: fixture.scope })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(outbox?.summary.totalEntryCount, 1)
  return {
    childExitCode: exit.code,
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
    packageDeliveryAttemptCount: queue?.summary.totalDeliveryAttemptCount,
  }
}

async function proveCompletionFaultRecovery(
  stage: CanonicalPrivatePackageStateFaultStage,
  suffix: string,
) {
  const accepted = await createAcceptedCompletionFixture(suffix)
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error(`simulated-completion-crash-${stage}`)
  await assert.rejects(
    () => accepted.service.reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: accepted.workerIdentity,
      faultInjectionForSmoke: (currentStage) => {
        if (currentStage === stage) throw sentinel
      },
    }),
    (error: unknown) => error === sentinel,
  )
  const transactionBytes = await readFile(accepted.fixture.transactionPath, 'utf8')
  assert.equal((await stat(accepted.fixture.transactionPath)).mode & 0o777, 0o600)
  assert.equal(transactionBytes.includes('claimCredential'), false)
  assert.equal(transactionBytes.includes('Bearer '), false)
  assert.equal(transactionBytes.includes('signedUrl'), false)
  assert.equal(transactionBytes.includes('/Users/'), false)
  if (stage === 'after_write_ahead_commit') {
    assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  } else {
    assert.notEqual(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  }
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)

  const recovered = await createCompletionService(accepted.fixture, completionAt)
    .reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: accepted.workerIdentity,
    })
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    stage === 'after_write_ahead_commit',
  )
  await assertCompletionPersistedExactlyOnce(accepted)
  return {
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
    disposition: recovered.disposition,
  }
}

async function proveRealCompletionProcessCrashRecovery(
  mode: 'crash-completion-after-commit' | 'crash-completion-after-queue',
  suffix: string,
) {
  const accepted = await createAcceptedCompletionFixture(suffix)
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const childInputs = await writeCompletionChildInputs(accepted, suffix)
  const child = spawnChild(mode, childInputs)
  const exit = await waitForExit(child)
  assert.equal(exit.code, 78)
  assert.equal(exit.signal, null)
  assert.equal(await pathExists(accepted.fixture.transactionPath), true)
  assert.equal(await pathExists(accepted.fixture.lockPath), true)
  if (mode === 'crash-completion-after-commit') {
    assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  } else {
    assert.notEqual(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  }
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)

  const recovered = await createCompletionService(accepted.fixture, completionAt)
    .reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: accepted.workerIdentity,
    })
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    mode === 'crash-completion-after-commit',
  )
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
  assert.equal(await pathExists(accepted.fixture.lockPath), false)
  await assertCompletionPersistedExactlyOnce(accepted)
  return {
    childExitCode: exit.code,
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
  }
}

async function proveCrossProcessCompletionRace(): Promise<string[]> {
  const accepted = await createAcceptedCompletionFixture('completion-cross-process-race')
  const args = await writeCompletionChildInputs(accepted, 'completion-race')
  const results = await Promise.all([
    runChild('complete', args),
    runChild('complete', args),
  ])
  const parsed = results.map((stdout) => JSON.parse(lastNonEmptyLine(stdout)) as {
    disposition: string
    receiptHash: string
  })
  assert.deepEqual(
    parsed.map((result) => result.disposition).sort(),
    ['exact_replay', 'reconciled'],
  )
  assert.equal(new Set(parsed.map((result) => result.receiptHash)).size, 1)
  await assertCompletionPersistedExactlyOnce(accepted)
  return parsed.map((result) => result.disposition).sort()
}

async function proveTamperedCompletionTransactionFailsClosed(): Promise<void> {
  const accepted = await createAcceptedCompletionFixture('tampered-completion-transaction')
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error('stop-after-completion-commit')
  await assert.rejects(
    () => accepted.service.reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: accepted.workerIdentity,
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  const untampered = await readFile(accepted.fixture.transactionPath, 'utf8')
  const decoded = JSON.parse(untampered) as {
    authority: { completionReceiptHash: string }
  }
  decoded.authority.completionReceiptHash = 'f'.repeat(64)
  await writeFile(accepted.fixture.transactionPath, JSON.stringify(decoded))
  await expectApiError(
    () => createCompletionService(accepted.fixture, completionAt)
      .reconcileWorkerCompletion({
        dispatchIntentId: accepted.dispatchIntentId,
        completionEvidence: accepted.completionEvidence,
        verifiedIdentity: accepted.workerIdentity,
      }),
    'VALIDATION_FAILED',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)
  await writeFile(accepted.fixture.transactionPath, untampered)
  assert.equal(
    (await createCompletionService(accepted.fixture, completionAt)
      .reconcileWorkerCompletion({
        dispatchIntentId: accepted.dispatchIntentId,
        completionEvidence: accepted.completionEvidence,
        verifiedIdentity: accepted.workerIdentity,
      })).disposition,
    'exact_replay',
  )
}

async function proveCompletionProjectionDriftFailsClosed(): Promise<void> {
  const accepted = await createAcceptedCompletionFixture('completion-projection-drift')
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error('stop-before-completion-projection')
  await assert.rejects(
    () => accepted.service.reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: accepted.workerIdentity,
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  await writeFile(accepted.fixture.queuePath, `${initialQueueBytes} `)
  await expectApiError(
    () => createCompletionService(accepted.fixture, completionAt)
      .reconcileWorkerCompletion({
        dispatchIntentId: accepted.dispatchIntentId,
        completionEvidence: accepted.completionEvidence,
        verifiedIdentity: accepted.workerIdentity,
      }),
    'IDEMPOTENCY_CONFLICT',
  )
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)
  await writeFile(accepted.fixture.queuePath, initialQueueBytes)
  assert.equal(
    (await createCompletionService(accepted.fixture, completionAt)
      .reconcileWorkerCompletion({
        dispatchIntentId: accepted.dispatchIntentId,
        completionEvidence: accepted.completionEvidence,
        verifiedIdentity: accepted.workerIdentity,
      })).disposition,
    'exact_replay',
  )
}

async function proveExpiredCompletionFailsClosed(): Promise<void> {
  const accepted = await createAcceptedCompletionFixture('expired-completion')
  const expiredAt = new Date(baseTimeMs + 121_000).toISOString()
  const expiredIdentity = privateServiceIdentity({
    authenticationMechanism: 'google_cloud_run_workload_identity',
    principalEmail: accepted.fixture.manifest.entries[0]!.target.workerServiceAccountEmail,
    audience: workerAudience,
    subject: 'completion-worker-subject',
    now: expiredAt,
  })
  await expectApiError(
    () => createCompletionService(accepted.fixture, expiredAt)
      .reconcileWorkerCompletion({
        dispatchIntentId: accepted.dispatchIntentId,
        completionEvidence: accepted.completionEvidence,
        verifiedIdentity: expiredIdentity,
      }),
    'WORKER_LEASE_EXPIRED',
  )
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.equal(queue?.entries[0]?.state, 'leased')
  assert.equal(outbox?.entries[0]?.state, 'worker_identity_accepted')
  assert.equal(outbox?.summary.workerCompletionReconciledCount, 0)
}

interface AcceptedCompletionFixture {
  fixture: Fixture
  service: ReturnType<typeof createCanonicalPrivateCloudDispatchReceiverService>
  dispatchIntentId: string
  workerIdentity: CanonicalVerifiedServiceIdentity
  completionEvidence: CanonicalCloudDispatchWorkerCompletionEvidence
}

async function createAcceptedCompletionFixture(
  suffix: string,
  canonicalToolId = 'ffprobe',
): Promise<AcceptedCompletionFixture> {
  const fixture = await createFixture(suffix, canonicalToolId)
  const service = createCompletionService(fixture, committedAt)
  const enqueued = await service.enqueueApprovedAttempt({
    jobId: fixture.definition.jobs[0]!.jobId,
  })
  const outboxEntry = 'outboxEntry' in enqueued ? enqueued.outboxEntry : undefined
  const attemptPlan = 'attemptPlan' in enqueued ? enqueued.attemptPlan : undefined
  if (!outboxEntry || !attemptPlan) {
    throw new Error('Completion fixture did not create a dispatch attempt.')
  }
  const taskBody = attemptPlan.cloudTask?.taskBody
  if (!taskBody) throw new Error('Completion fixture task body is missing.')
  await service.receiveController({
    taskBody,
    verifiedIdentity: privateServiceIdentity({
      authenticationMechanism: 'google_oidc_id_token',
      principalEmail: outboxEntry.immutable.controllerServiceAccountEmail,
      audience: controllerAudience,
      subject: 'completion-controller-subject',
      now: committedAt,
    }),
  })
  const invocation = await service.createWorkerInvocation(
    outboxEntry.immutable.dispatchIntentId,
  )
  const workerIdentity = privateServiceIdentity({
    authenticationMechanism: 'google_cloud_run_workload_identity',
    principalEmail: outboxEntry.immutable.workerServiceAccountEmail,
    audience: workerAudience,
    subject: 'completion-worker-subject',
    now: committedAt,
  })
  await service.receiveWorker({ invocation, verifiedIdentity: workerIdentity })
  return {
    fixture,
    service: createCompletionService(fixture, completionAt),
    dispatchIntentId: outboxEntry.immutable.dispatchIntentId,
    workerIdentity,
    completionEvidence: completionEvidence(suffix),
  }
}

async function assertCompletionPersistedExactlyOnce(
  accepted: AcceptedCompletionFixture,
): Promise<void> {
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.ok(queue)
  assert.ok(outbox)
  assert.equal(queue?.summary.completedJobCount, 1)
  assert.equal(queue?.summary.leasedJobCount, 0)
  assert.equal(queue?.events.filter((event) => event.eventType === 'job_completed').length, 1)
  assert.equal(outbox?.summary.workerCompletionReconciledCount, 1)
  assert.equal(outbox?.events.filter((event) =>
    event.eventType === 'worker_completion_reconciled').length, 1)
  assert.ok(queue.entries[0]?.completion)
  assert.equal(outbox.entries[0]?.completionReceipt?.completionOutcomeHash,
    sha256AuthorityValue(queue.entries[0].completion.outcome))
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
}

async function writeCompletionChildInputs(
  accepted: AcceptedCompletionFixture,
  suffix: string,
): Promise<string[]> {
  const scopePath = join(accepted.fixture.rootPath, `${suffix}-scope.json`)
  const definitionPath = join(accepted.fixture.rootPath, `${suffix}-definition.json`)
  const manifestPath = join(accepted.fixture.rootPath, `${suffix}-manifest.json`)
  const evidencePath = join(accepted.fixture.rootPath, `${suffix}-completion-evidence.json`)
  await writeFile(scopePath, JSON.stringify(accepted.fixture.scope))
  await writeFile(definitionPath, JSON.stringify(accepted.fixture.definition))
  await writeFile(manifestPath, JSON.stringify(accepted.fixture.manifest))
  await writeFile(evidencePath, JSON.stringify(accepted.completionEvidence))
  return [
    scopePath,
    definitionPath,
    manifestPath,
    completionAt,
    evidencePath,
    accepted.dispatchIntentId,
  ]
}

interface AcceptedFailureFixture {
  fixture: Fixture
  service: ReturnType<typeof createCanonicalPrivateCloudDispatchReceiverService>
  dispatchIntentId: string
  workerIdentity: CanonicalVerifiedServiceIdentity
  failureEvidence: CanonicalCloudDispatchWorkerFailureEvidence
}

async function createAcceptedFailureFixture(
  suffix: string,
  evidence: CanonicalCloudDispatchWorkerFailureEvidence = failureEvidence(suffix),
  canonicalToolId = 'ffprobe',
): Promise<AcceptedFailureFixture> {
  const accepted = await createAcceptedCompletionFixture(suffix, canonicalToolId)
  return {
    fixture: accepted.fixture,
    service: accepted.service,
    dispatchIntentId: accepted.dispatchIntentId,
    workerIdentity: accepted.workerIdentity,
    failureEvidence: evidence,
  }
}

async function proveFailureFaultRecovery(
  stage: CanonicalPrivatePackageStateFaultStage,
  suffix: string,
) {
  const accepted = await createAcceptedFailureFixture(suffix)
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error(`simulated-failure-crash-${stage}`)
  await assert.rejects(
    () => accepted.service.reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: accepted.failureEvidence,
      verifiedIdentity: accepted.workerIdentity,
      faultInjectionForSmoke: (currentStage) => {
        if (currentStage === stage) throw sentinel
      },
    }),
    (error: unknown) => error === sentinel,
  )
  const transactionBytes = await readFile(accepted.fixture.transactionPath, 'utf8')
  assert.equal((await stat(accepted.fixture.transactionPath)).mode & 0o777, 0o600)
  assert.equal(transactionBytes.includes('claimCredential'), false)
  assert.equal(transactionBytes.includes('Bearer '), false)
  assert.equal(transactionBytes.includes('signedUrl'), false)
  assert.equal(transactionBytes.includes('/Users/'), false)
  assert.equal(transactionBytes.includes('failure stack trace'), false)
  if (stage === 'after_write_ahead_commit') {
    assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  } else {
    assert.notEqual(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  }
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)

  const recovered = await createCompletionService(accepted.fixture, failureAt)
    .reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: accepted.failureEvidence,
      verifiedIdentity: accepted.workerIdentity,
    })
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    stage === 'after_write_ahead_commit',
  )
  assert.equal(recovered.queueDisposition, 'retry_available')
  assert.equal(recovered.remainingAttempts, 1)
  await assertFailurePersistedExactlyOnce(accepted)
  return {
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
    disposition: recovered.disposition,
  }
}

async function proveRealFailureProcessCrashRecovery(
  mode: 'crash-failure-after-commit' | 'crash-failure-after-queue',
  suffix: string,
) {
  const accepted = await createAcceptedFailureFixture(suffix)
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const childInputs = await writeFailureChildInputs(accepted, suffix)
  const child = spawnChild(mode, childInputs)
  const exit = await waitForExit(child)
  assert.equal(exit.code, 79)
  assert.equal(exit.signal, null)
  assert.equal(await pathExists(accepted.fixture.transactionPath), true)
  assert.equal(await pathExists(accepted.fixture.lockPath), true)
  if (mode === 'crash-failure-after-commit') {
    assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  } else {
    assert.notEqual(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  }
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)

  const recovered = await createCompletionService(accepted.fixture, failureAt)
    .reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: accepted.failureEvidence,
      verifiedIdentity: accepted.workerIdentity,
    })
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    mode === 'crash-failure-after-commit',
  )
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
  assert.equal(await pathExists(accepted.fixture.lockPath), false)
  await assertFailurePersistedExactlyOnce(accepted)
  return {
    childExitCode: exit.code,
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
  }
}

async function proveCrossProcessFailureRace(): Promise<string[]> {
  const accepted = await createAcceptedFailureFixture('failure-cross-process-race')
  const args = await writeFailureChildInputs(accepted, 'failure-race')
  const results = await Promise.all([
    runChild('fail', args),
    runChild('fail', args),
  ])
  const parsed = results.map((stdout) => JSON.parse(lastNonEmptyLine(stdout)) as {
    disposition: string
    receiptHash: string
  })
  assert.deepEqual(
    parsed.map((result) => result.disposition).sort(),
    ['exact_replay', 'reconciled'],
  )
  assert.equal(new Set(parsed.map((result) => result.receiptHash)).size, 1)
  await assertFailurePersistedExactlyOnce(accepted)
  return parsed.map((result) => result.disposition).sort()
}

async function proveCompletionFailureTerminalRace(): Promise<string> {
  const accepted = await createAcceptedCompletionFixture('completion-failure-race')
  const failure = failureEvidence('completion-failure-race')
  const completionService = createCompletionService(accepted.fixture, completionAt)
  const failureService = createCompletionService(accepted.fixture, failureAt)
  const results = await Promise.allSettled([
    completionService.reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: accepted.workerIdentity,
    }),
    failureService.reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: failure,
      verifiedIdentity: accepted.workerIdentity,
    }),
  ])
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  const rejected = results.find((result) => result.status === 'rejected')
  assert.ok(rejected?.status === 'rejected')
  assert.ok(rejected.reason instanceof ApiError)
  assert.equal(rejected.reason.code, 'IDEMPOTENCY_ATOMICITY_REQUIRED')

  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.ok(queue)
  assert.ok(outbox)
  assert.equal(
    (outbox.summary.workerCompletionReconciledCount ?? 0) +
      (outbox.summary.workerFailureReconciledCount ?? 0),
    1,
  )
  assert.equal(
    outbox.events.filter((event) =>
      event.eventType === 'worker_completion_reconciled' ||
      event.eventType === 'worker_failure_reconciled').length,
    1,
  )
  assert.equal(queue.summary.completedJobCount + queue.summary.releasedClaimCount, 1)
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
  return outbox.entries[0]!.state
}

async function proveFailedAttemptCannotComplete(): Promise<void> {
  const accepted = await createAcceptedFailureFixture('failure-before-completion')
  await accepted.service.reconcileWorkerFailure({
    dispatchIntentId: accepted.dispatchIntentId,
    failureEvidence: accepted.failureEvidence,
    verifiedIdentity: accepted.workerIdentity,
  })
  const queueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  await expectApiError(
    () => createCompletionService(accepted.fixture, completionAt)
      .reconcileWorkerCompletion({
        dispatchIntentId: accepted.dispatchIntentId,
        completionEvidence: completionEvidence('failure-before-completion'),
        verifiedIdentity: accepted.workerIdentity,
      }),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), queueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), outboxBytes)
}

async function proveTamperedFailureTransactionFailsClosed(): Promise<void> {
  const accepted = await createAcceptedFailureFixture('tampered-failure-transaction')
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error('stop-after-failure-commit')
  await assert.rejects(
    () => accepted.service.reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: accepted.failureEvidence,
      verifiedIdentity: accepted.workerIdentity,
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  const untampered = await readFile(accepted.fixture.transactionPath, 'utf8')
  const decoded = JSON.parse(untampered) as {
    authority: { failureReceiptHash: string }
  }
  decoded.authority.failureReceiptHash = 'f'.repeat(64)
  await writeFile(accepted.fixture.transactionPath, JSON.stringify(decoded))
  await expectApiError(
    () => createCompletionService(accepted.fixture, failureAt)
      .reconcileWorkerFailure({
        dispatchIntentId: accepted.dispatchIntentId,
        failureEvidence: accepted.failureEvidence,
        verifiedIdentity: accepted.workerIdentity,
      }),
    'VALIDATION_FAILED',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), initialQueueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)
  await writeFile(accepted.fixture.transactionPath, untampered)
  assert.equal(
    (await createCompletionService(accepted.fixture, failureAt)
      .reconcileWorkerFailure({
        dispatchIntentId: accepted.dispatchIntentId,
        failureEvidence: accepted.failureEvidence,
        verifiedIdentity: accepted.workerIdentity,
      })).disposition,
    'exact_replay',
  )
}

async function proveFailureProjectionDriftFailsClosed(): Promise<void> {
  const accepted = await createAcceptedFailureFixture('failure-projection-drift')
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error('stop-before-failure-projection')
  await assert.rejects(
    () => accepted.service.reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: accepted.failureEvidence,
      verifiedIdentity: accepted.workerIdentity,
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  await writeFile(accepted.fixture.queuePath, `${initialQueueBytes} `)
  await expectApiError(
    () => createCompletionService(accepted.fixture, failureAt)
      .reconcileWorkerFailure({
        dispatchIntentId: accepted.dispatchIntentId,
        failureEvidence: accepted.failureEvidence,
        verifiedIdentity: accepted.workerIdentity,
      }),
    'IDEMPOTENCY_CONFLICT',
  )
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), initialOutboxBytes)
  await writeFile(accepted.fixture.queuePath, initialQueueBytes)
  assert.equal(
    (await createCompletionService(accepted.fixture, failureAt)
      .reconcileWorkerFailure({
        dispatchIntentId: accepted.dispatchIntentId,
        failureEvidence: accepted.failureEvidence,
        verifiedIdentity: accepted.workerIdentity,
      })).disposition,
    'exact_replay',
  )
}

async function proveExpiredFailureFailsClosed(): Promise<void> {
  const accepted = await createAcceptedFailureFixture('expired-failure')
  const expiredAt = new Date(baseTimeMs + 121_000).toISOString()
  const expiredIdentity = privateServiceIdentity({
    authenticationMechanism: 'google_cloud_run_workload_identity',
    principalEmail: accepted.fixture.manifest.entries[0]!.target.workerServiceAccountEmail,
    audience: workerAudience,
    subject: 'completion-worker-subject',
    now: expiredAt,
  })
  await expectApiError(
    () => createCompletionService(accepted.fixture, expiredAt)
      .reconcileWorkerFailure({
        dispatchIntentId: accepted.dispatchIntentId,
        failureEvidence: accepted.failureEvidence,
        verifiedIdentity: expiredIdentity,
      }),
    'WORKER_LEASE_EXPIRED',
  )
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.equal(queue?.entries[0]?.state, 'leased')
  assert.equal(queue?.summary.releasedClaimCount, 0)
  assert.equal(outbox?.entries[0]?.state, 'worker_identity_accepted')
  assert.equal(outbox?.summary.workerFailureReconciledCount, 0)
}

async function proveUserReviewFailureDoesNotRetry(): Promise<void> {
  const accepted = await createAcceptedFailureFixture(
    'user-review-failure',
    failureEvidence('user-review-failure', {
      failureCategory: 'unknown_internal',
      failureCode: 'INTERNAL_ERROR',
    }),
  )
  const failed = await accepted.service.reconcileWorkerFailure({
    dispatchIntentId: accepted.dispatchIntentId,
    failureEvidence: accepted.failureEvidence,
    verifiedIdentity: accepted.workerIdentity,
  })
  assert.equal(failed.disposition, 'reconciled')
  assert.equal(failed.queueDisposition, 'user_review_required')
  assert.equal(failed.retryDisposition, 'fallback_or_user_review_required')
  assert.equal(failed.remainingAttempts, 1)
  assert.equal(failed.boundaries.automaticRetryLoopStarted, false)
  const blocked = await accepted.service.enqueueApprovedAttempt({
    jobId: accepted.fixture.definition.jobs[0]!.jobId,
  })
  assert.equal(blocked.disposition, 'user_review_required')
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(queue?.summary.releasedClaimCount, 1)
  assert.equal(outbox?.summary.totalEntryCount, 1)
  assert.equal(outbox?.summary.workerFailureReconciledCount, 1)
}

async function proveVersionedAttemptCostEvidenceBoundToFailure() {
  const suffix = 'versioned-failure-cost'
  const accepted = await createAcceptedFailureFixture(
    suffix,
    failureEvidence(suffix),
    'deepfilternet',
  )
  const job = accepted.fixture.definition.jobs[0]!
  const meter = await beginPrivateInternalAttemptCostEvidence({
    localStorageRoot: accepted.fixture.rootPath,
    workspaceId: accepted.fixture.definition.identity.workspaceId,
    projectId: accepted.fixture.definition.identity.projectId,
    editSessionId: accepted.fixture.definition.identity.editSessionId,
    approvedPlanSnapshotId:
      accepted.fixture.definition.identity.approvedPlanSnapshotId,
    approvedWorkItemId: job.approvedWorkItemId,
    jobId: job.jobId,
    executionAttemptId: accepted.dispatchIntentId,
    retryAttempt: 0,
    toolId: 'deepfilternet',
    operationId: 'tool.deepfilternet.enhance_voice.v1',
  }, {
    nowIso: () => failureAt,
    monotonicNanoseconds: (() => {
      const values = [1_000_000_000n, 2_250_000_000n]
      return () => values.shift() ?? 2_250_000_000n
    })(),
  })
  const finalized = await meter.finalize({
    status: 'failed',
    failureCategory: 'reeditpro_error_absorbed',
    outputByteLength: null,
    linkedCanonicalOutcomeHash: null,
  })
  const evidence = {
    ...accepted.failureEvidence,
    attemptInternalCostEvidenceHash: finalized.evidence.evidenceHash,
  }
  const reconciled = await accepted.service.reconcileWorkerFailure({
    dispatchIntentId: accepted.dispatchIntentId,
    failureEvidence: evidence,
    verifiedIdentity: accepted.workerIdentity,
  })
  const persisted = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: accepted.fixture.rootPath,
    workspaceId: accepted.fixture.definition.identity.workspaceId,
    projectId: accepted.fixture.definition.identity.projectId,
    executionAttemptId: accepted.dispatchIntentId,
  })
  assert.ok(persisted)
  assert.equal(persisted.evidenceHash, reconciled.receipt.attemptInternalCostEvidenceHash)
  assert.equal(persisted.rateCardVersion, 'rp-ratecard-01-mock-safe')
  assert.equal(persisted.boundary, 'internal_production_cost_only')
  assert.equal(persisted.outcome.status, 'failed')
  assert.equal(persisted.identity.toolId, 'deepfilternet')
  assert.equal(persisted.identity.jobId, job.jobId)
  assert.equal(persisted.identity.approvedWorkItemId, job.approvedWorkItemId)
  assert.equal(persisted.identity.approvedPlanSnapshotId,
    accepted.fixture.definition.identity.approvedPlanSnapshotId)
  assert.equal(persisted.actualInternalCostMicros > 0, true)
  assert.equal(persisted.persistence.databaseBacked, false)
  assert.equal(persisted.persistence.invoiceReconciled, false)
  assert.equal(
    reconciled.receipt.boundaries.customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )
  return {
    rateCardVersion: persisted.rateCardVersion,
    actualInternalCostMicros: persisted.actualInternalCostMicros,
    attemptCostBoundary: persisted.boundary,
    customerCommercialAuthorityIncluded: false,
  }
}

interface AcceptedTimeoutFixture extends AcceptedCompletionFixture {
  controllerServiceAccountEmail: string
  workerServiceAccountEmail: string
  attemptInternalCostEvidenceHash: string
}

async function createAcceptedTimeoutFixture(
  suffix: string,
  canonicalToolId = 'deepfilternet',
  persistCostEvidence = true,
): Promise<AcceptedTimeoutFixture> {
  const accepted = await createAcceptedCompletionFixture(suffix, canonicalToolId)
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  const entry = outbox?.entries.find((candidate) =>
    candidate.immutable.dispatchIntentId === accepted.dispatchIntentId)
  if (!entry) throw new Error('Accepted timeout outbox entry is missing.')
  const attemptCost = persistCostEvidence
    ? await persistTimeoutAttemptCostEvidence({
        accepted,
        dispatchIntentId: accepted.dispatchIntentId,
        retryAttempt: entry.immutable.packageDeliveryAttempt - 1,
      })
    : undefined
  return {
    ...accepted,
    controllerServiceAccountEmail:
      entry.immutable.controllerServiceAccountEmail,
    workerServiceAccountEmail: entry.immutable.workerServiceAccountEmail,
    attemptInternalCostEvidenceHash: attemptCost?.evidenceHash ?? '0'.repeat(64),
  }
}

async function persistTimeoutAttemptCostEvidence(input: {
  accepted: AcceptedCompletionFixture
  dispatchIntentId: string
  retryAttempt: number
}) {
  const job = input.accepted.fixture.definition.jobs[0]!
  const meter = await beginPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.accepted.fixture.rootPath,
    workspaceId: input.accepted.fixture.definition.identity.workspaceId,
    projectId: input.accepted.fixture.definition.identity.projectId,
    editSessionId: input.accepted.fixture.definition.identity.editSessionId,
    approvedPlanSnapshotId:
      input.accepted.fixture.definition.identity.approvedPlanSnapshotId,
    approvedWorkItemId: job.approvedWorkItemId,
    jobId: job.jobId,
    executionAttemptId: input.dispatchIntentId,
    retryAttempt: input.retryAttempt,
    toolId: 'deepfilternet',
    operationId: 'tool.deepfilternet.enhance_voice.v1',
  }, {
    nowIso: () => timeoutAt,
    monotonicNanoseconds: (() => {
      const values = [3_000_000_000n, 4_750_000_000n]
      return () => values.shift() ?? 4_750_000_000n
    })(),
  })
  return (await meter.finalize({
    status: 'failed',
    failureCategory: 'timeout',
    outputByteLength: null,
    linkedCanonicalOutcomeHash: null,
  })).evidence
}

function timeoutControllerIdentity(
  accepted: AcceptedTimeoutFixture,
  now: string,
  options: { principalEmail?: string; subject?: string } = {},
): CanonicalVerifiedServiceIdentity {
  return privateServiceIdentity({
    authenticationMechanism: 'google_oidc_id_token',
    principalEmail:
      options.principalEmail ?? accepted.controllerServiceAccountEmail,
    audience: controllerAudience,
    subject: options.subject ?? 'completion-controller-subject',
    now,
  })
}

function timeoutWorkerIdentity(
  accepted: AcceptedTimeoutFixture,
  now: string,
): CanonicalVerifiedServiceIdentity {
  return privateServiceIdentity({
    authenticationMechanism: 'google_cloud_run_workload_identity',
    principalEmail: accepted.workerServiceAccountEmail,
    audience: workerAudience,
    subject: 'completion-worker-subject',
    now,
  })
}

function reconcileAcceptedTimeout(
  accepted: AcceptedTimeoutFixture,
  options: {
    now?: string
    verifiedIdentity?: CanonicalVerifiedServiceIdentity
    faultInjectionForSmoke?: (
      stage: CanonicalPrivatePackageStateFaultStage,
    ) => void
  } = {},
) {
  const now = options.now ?? timeoutAt
  return createCompletionService(accepted.fixture, now).reconcileWorkerTimeout({
    dispatchIntentId: accepted.dispatchIntentId,
    verifiedIdentity:
      options.verifiedIdentity ?? timeoutControllerIdentity(accepted, now),
    faultInjectionForSmoke: options.faultInjectionForSmoke,
  })
}

async function proveTimeoutFaultRecovery(
  stage: CanonicalPrivatePackageStateFaultStage,
  suffix: string,
) {
  const accepted = await createAcceptedTimeoutFixture(suffix)
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error(`simulated-timeout-crash-${stage}`)
  await assert.rejects(
    () => reconcileAcceptedTimeout(accepted, {
      faultInjectionForSmoke: (currentStage) => {
        if (currentStage === stage) throw sentinel
      },
    }),
    (error: unknown) => error === sentinel,
  )
  const transactionBytes = await readFile(
    accepted.fixture.transactionPath,
    'utf8',
  )
  assert.equal((await stat(accepted.fixture.transactionPath)).mode & 0o777, 0o600)
  assert.equal(transactionBytes.includes('claimCredential'), false)
  assert.equal(transactionBytes.includes('Bearer '), false)
  assert.equal(transactionBytes.includes('signedUrl'), false)
  assert.equal(transactionBytes.includes('/Users/'), false)
  assert.equal(transactionBytes.includes('timeout stack trace'), false)
  if (stage === 'after_write_ahead_commit') {
    assert.equal(
      await readFile(accepted.fixture.queuePath, 'utf8'),
      initialQueueBytes,
    )
  } else {
    assert.notEqual(
      await readFile(accepted.fixture.queuePath, 'utf8'),
      initialQueueBytes,
    )
  }
  assert.equal(
    await readFile(accepted.fixture.outboxPath, 'utf8'),
    initialOutboxBytes,
  )
  const recovered = await reconcileAcceptedTimeout(accepted)
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    stage === 'after_write_ahead_commit',
  )
  assert.equal(recovered.queueDisposition, 'retry_available')
  assert.equal(recovered.remainingAttempts, 1)
  await assertTimeoutPersistedExactlyOnce(accepted)
  return {
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
    disposition: recovered.disposition,
  }
}

async function proveRealTimeoutProcessCrashRecovery(
  mode: 'crash-timeout-after-commit' | 'crash-timeout-after-queue',
  suffix: string,
) {
  const accepted = await createAcceptedTimeoutFixture(suffix)
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const childInputs = await writeTimeoutChildInputs(accepted, suffix)
  const child = spawnChild(mode, childInputs)
  const exit = await waitForExit(child)
  assert.equal(exit.code, 80)
  assert.equal(exit.signal, null)
  assert.equal(await pathExists(accepted.fixture.transactionPath), true)
  assert.equal(await pathExists(accepted.fixture.lockPath), true)
  if (mode === 'crash-timeout-after-commit') {
    assert.equal(
      await readFile(accepted.fixture.queuePath, 'utf8'),
      initialQueueBytes,
    )
  } else {
    assert.notEqual(
      await readFile(accepted.fixture.queuePath, 'utf8'),
      initialQueueBytes,
    )
  }
  assert.equal(
    await readFile(accepted.fixture.outboxPath, 'utf8'),
    initialOutboxBytes,
  )
  const recovered = await reconcileAcceptedTimeout(accepted)
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    mode === 'crash-timeout-after-commit',
  )
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
  assert.equal(await pathExists(accepted.fixture.lockPath), false)
  await assertTimeoutPersistedExactlyOnce(accepted)
  return {
    childExitCode: exit.code,
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
  }
}

async function proveCrossProcessTimeoutRace(): Promise<string[]> {
  const accepted = await createAcceptedTimeoutFixture('timeout-cross-process-race')
  const args = await writeTimeoutChildInputs(accepted, 'timeout-race')
  const results = await Promise.all([
    runChild('timeout', args),
    runChild('timeout', args),
  ])
  const parsed = results.map((stdout) =>
    JSON.parse(lastNonEmptyLine(stdout)) as {
      disposition: string
      receiptHash: string
    })
  assert.deepEqual(
    parsed.map((result) => result.disposition).sort(),
    ['exact_replay', 'reconciled'],
  )
  assert.equal(new Set(parsed.map((result) => result.receiptHash)).size, 1)
  await assertTimeoutPersistedExactlyOnce(accepted)
  return parsed.map((result) => result.disposition).sort()
}

async function proveTimeoutCompletionFailureTerminalRace(): Promise<string> {
  const accepted = await createAcceptedTimeoutFixture(
    'timeout-completion-failure-race',
  )
  const service = createCompletionService(accepted.fixture, timeoutAt)
  const workerIdentity = timeoutWorkerIdentity(accepted, timeoutAt)
  const results = await Promise.allSettled([
    service.reconcileWorkerTimeout({
      dispatchIntentId: accepted.dispatchIntentId,
      verifiedIdentity: timeoutControllerIdentity(accepted, timeoutAt),
    }),
    service.reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: workerIdentity,
    }),
    service.reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: failureEvidence('timeout-completion-failure-race'),
      verifiedIdentity: workerIdentity,
    }),
  ])
  const fulfilled = results.filter((result) => result.status === 'fulfilled')
  assert.equal(fulfilled.length, 1)
  assert.equal(
    fulfilled[0]?.status === 'fulfilled'
      ? fulfilled[0].value.outboxState
      : undefined,
    'worker_timeout_reconciled',
  )
  for (const rejected of results.filter((result) =>
    result.status === 'rejected')) {
    assert.ok(rejected.status === 'rejected')
    assert.ok(rejected.reason instanceof ApiError)
    assert.ok([
      'WORKER_LEASE_EXPIRED',
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
    ].includes(rejected.reason.code))
  }
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.ok(queue)
  assert.ok(outbox)
  assert.equal(
    (outbox.summary.workerCompletionReconciledCount ?? 0) +
      (outbox.summary.workerFailureReconciledCount ?? 0) +
      (outbox.summary.workerTimeoutReconciledCount ?? 0),
    1,
  )
  assert.equal(queue.summary.completedJobCount, 0)
  assert.equal(queue.summary.expiredClaimRecoveryCount, 1)
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
  return outbox.entries[0]!.state
}

async function proveTimedOutAttemptCannotCompleteOrFail(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture('timeout-before-worker-result')
  await reconcileAcceptedTimeout(accepted)
  const queueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const service = createCompletionService(accepted.fixture, timeoutAt)
  const workerIdentity = timeoutWorkerIdentity(accepted, timeoutAt)
  await expectApiError(
    () => service.reconcileWorkerCompletion({
      dispatchIntentId: accepted.dispatchIntentId,
      completionEvidence: accepted.completionEvidence,
      verifiedIdentity: workerIdentity,
    }),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  await expectApiError(
    () => service.reconcileWorkerFailure({
      dispatchIntentId: accepted.dispatchIntentId,
      failureEvidence: failureEvidence('timeout-before-worker-result'),
      verifiedIdentity: workerIdentity,
    }),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), queueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), outboxBytes)
}

async function proveTamperedTimeoutTransactionFailsClosed(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture('tampered-timeout-transaction')
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error('stop-after-timeout-commit')
  await assert.rejects(
    () => reconcileAcceptedTimeout(accepted, {
      faultInjectionForSmoke: (stage) => {
        if (stage === 'after_write_ahead_commit') throw sentinel
      },
    }),
    (error: unknown) => error === sentinel,
  )
  const untampered = await readFile(accepted.fixture.transactionPath, 'utf8')
  const decoded = JSON.parse(untampered) as {
    authority: { timeoutReceiptHash: string }
  }
  decoded.authority.timeoutReceiptHash = 'f'.repeat(64)
  await writeFile(accepted.fixture.transactionPath, JSON.stringify(decoded))
  await expectApiError(
    () => reconcileAcceptedTimeout(accepted),
    'VALIDATION_FAILED',
  )
  assert.equal(
    await readFile(accepted.fixture.queuePath, 'utf8'),
    initialQueueBytes,
  )
  assert.equal(
    await readFile(accepted.fixture.outboxPath, 'utf8'),
    initialOutboxBytes,
  )
  await writeFile(accepted.fixture.transactionPath, untampered)
  assert.equal((await reconcileAcceptedTimeout(accepted)).disposition, 'exact_replay')
}

async function proveTimeoutProjectionDriftFailsClosed(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture('timeout-projection-drift')
  const initialQueueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const initialOutboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const sentinel = new Error('stop-before-timeout-projection')
  await assert.rejects(
    () => reconcileAcceptedTimeout(accepted, {
      faultInjectionForSmoke: (stage) => {
        if (stage === 'after_write_ahead_commit') throw sentinel
      },
    }),
    (error: unknown) => error === sentinel,
  )
  await writeFile(accepted.fixture.queuePath, `${initialQueueBytes} `)
  await expectApiError(
    () => reconcileAcceptedTimeout(accepted),
    'IDEMPOTENCY_CONFLICT',
  )
  assert.equal(
    await readFile(accepted.fixture.outboxPath, 'utf8'),
    initialOutboxBytes,
  )
  await writeFile(accepted.fixture.queuePath, initialQueueBytes)
  assert.equal((await reconcileAcceptedTimeout(accepted)).disposition, 'exact_replay')
}

async function proveTimeoutBeforeExpiryFailsClosed(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture('timeout-before-expiry')
  const queueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  await expectApiError(
    () => reconcileAcceptedTimeout(accepted, {
      now: completionAt,
      verifiedIdentity: timeoutControllerIdentity(accepted, completionAt),
    }),
    'VALIDATION_FAILED',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), queueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), outboxBytes)
}

async function proveWrongControllerTimeoutIdentityFailsClosed(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture('wrong-timeout-controller')
  const queueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  await expectApiError(
    () => reconcileAcceptedTimeout(accepted, {
      verifiedIdentity: timeoutControllerIdentity(accepted, timeoutAt, {
        principalEmail: 'wrong-controller@reeditpro-test.iam.gserviceaccount.com',
      }),
    }),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), queueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), outboxBytes)
}

async function proveMissingTimeoutAttemptCostEvidenceFailsClosed(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture(
    'missing-timeout-attempt-cost',
    'deepfilternet',
    false,
  )
  const queueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  await expectApiError(
    () => reconcileAcceptedTimeout(accepted),
    'JOB_DEPENDENCY_NOT_READY',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), queueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), outboxBytes)
}

async function proveTamperedTimeoutAttemptCostEvidenceFailsClosed(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture(
    'tampered-timeout-attempt-cost',
  )
  const queueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const evidencePath = timeoutAttemptCostEvidencePath(accepted)
  const evidence = privateInternalAttemptCostEvidenceSchema.parse(
    JSON.parse(await readFile(evidencePath, 'utf8')),
  )
  await writeFile(evidencePath, `${stableAuthorityStringify({
    ...evidence,
    actualInternalCostMicros: evidence.actualInternalCostMicros + 1,
  })}\n`)
  await expectApiError(
    () => reconcileAcceptedTimeout(accepted),
    'VALIDATION_FAILED',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), queueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), outboxBytes)
}

async function proveMismatchedTimeoutAttemptCostEvidenceFailsClosed(): Promise<void> {
  const accepted = await createAcceptedTimeoutFixture(
    'mismatched-timeout-attempt-cost',
  )
  const queueBytes = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBytes = await readFile(accepted.fixture.outboxPath, 'utf8')
  const evidencePath = timeoutAttemptCostEvidencePath(accepted)
  const evidence = privateInternalAttemptCostEvidenceSchema.parse(
    JSON.parse(await readFile(evidencePath, 'utf8')),
  )
  const { evidenceHash: originalEvidenceHash, ...withoutHash } = evidence
  assert.equal(originalEvidenceHash, accepted.attemptInternalCostEvidenceHash)
  const mismatchedWithoutHash = {
    ...withoutHash,
    identity: {
      ...withoutHash.identity,
      approvedWorkItemId: 'work-intentionally-wrong-timeout-attempt-cost',
    },
  }
  await writeFile(evidencePath, `${stableAuthorityStringify({
    ...mismatchedWithoutHash,
    evidenceHash: sha256AuthorityValue(mismatchedWithoutHash),
  })}\n`)
  await expectApiError(
    () => reconcileAcceptedTimeout(accepted),
    'IDEMPOTENCY_CONFLICT',
  )
  assert.equal(await readFile(accepted.fixture.queuePath, 'utf8'), queueBytes)
  assert.equal(await readFile(accepted.fixture.outboxPath, 'utf8'), outboxBytes)
}

function timeoutAttemptCostEvidencePath(
  accepted: AcceptedTimeoutFixture,
): string {
  return join(
    accepted.fixture.rootPath,
    privateInternalAttemptCostEvidenceRelativePath({
      workspaceId: accepted.fixture.definition.identity.workspaceId,
      projectId: accepted.fixture.definition.identity.projectId,
      executionAttemptId: accepted.dispatchIntentId,
    }),
  )
}

async function proveVersionedAttemptCostEvidenceBoundToTimeout() {
  const suffix = 'versioned-timeout-cost'
  const accepted = await createAcceptedTimeoutFixture(suffix, 'deepfilternet')
  const job = accepted.fixture.definition.jobs[0]!
  const reconciled = await reconcileAcceptedTimeout(accepted)
  const persisted = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: accepted.fixture.rootPath,
    workspaceId: accepted.fixture.definition.identity.workspaceId,
    projectId: accepted.fixture.definition.identity.projectId,
    executionAttemptId: accepted.dispatchIntentId,
  })
  assert.ok(persisted)
  assert.equal(
    persisted.evidenceHash,
    reconciled.receipt.attemptInternalCostEvidenceHash,
  )
  assert.equal(persisted.rateCardVersion, 'rp-ratecard-01-mock-safe')
  assert.equal(persisted.boundary, 'internal_production_cost_only')
  assert.equal(persisted.outcome.status, 'failed')
  assert.equal(persisted.outcome.failureCategory, 'timeout')
  assert.equal(persisted.identity.toolId, 'deepfilternet')
  assert.equal(persisted.identity.jobId, job.jobId)
  assert.equal(persisted.actualInternalCostMicros > 0, true)
  assert.equal(persisted.persistence.databaseBacked, false)
  assert.equal(persisted.persistence.invoiceReconciled, false)
  assert.equal(reconciled.receipt.failureCategory, 'execution_timeout')
  assert.equal(reconciled.receipt.failureCode, 'WORKER_LEASE_EXPIRED')
  assert.equal(
    reconciled.receipt.boundaries
      .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )
  return {
    rateCardVersion: persisted.rateCardVersion,
    actualInternalCostMicros: persisted.actualInternalCostMicros,
    attemptCostBoundary: persisted.boundary,
    failureCategory: persisted.outcome.failureCategory,
    customerCommercialAuthorityIncluded: false,
  }
}

async function assertTimeoutPersistedExactlyOnce(
  accepted: AcceptedTimeoutFixture,
): Promise<void> {
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.ok(queue)
  assert.ok(outbox)
  assert.equal(queue.summary.completedJobCount, 0)
  assert.equal(queue.summary.leasedJobCount, 0)
  assert.equal(queue.summary.expiredClaimRecoveryCount, 1)
  assert.equal(queue.entries[0]?.state, 'queued')
  assert.equal(queue.entries[0]?.activeClaim, undefined)
  assert.equal(queue.entries[0]?.completion, undefined)
  assert.equal(outbox.summary.workerTimeoutReconciledCount, 1)
  assert.equal(outbox.summary.workerCompletionReconciledCount, 0)
  assert.equal(outbox.summary.workerFailureReconciledCount, 0)
  assert.equal(outbox.events.filter((event) =>
    event.eventType === 'worker_timeout_reconciled').length, 1)
  const release = queue.entries[0]?.lastRelease
  const receipt = outbox.entries[0]?.timeoutReceipt
  assert.ok(release?.dispatchTimeout)
  assert.ok(receipt)
  assert.equal(receipt.queueReleaseHash, release.releaseHash)
  assert.equal(
    receipt.attemptInternalCostEvidenceHash,
    accepted.attemptInternalCostEvidenceHash,
  )
  assert.equal(
    receipt.boundaries.customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
}

async function writeTimeoutChildInputs(
  accepted: AcceptedTimeoutFixture,
  suffix: string,
): Promise<string[]> {
  const scopePath = join(accepted.fixture.rootPath, `${suffix}-scope.json`)
  const definitionPath = join(
    accepted.fixture.rootPath,
    `${suffix}-definition.json`,
  )
  const manifestPath = join(accepted.fixture.rootPath, `${suffix}-manifest.json`)
  const evidencePath = join(
    accepted.fixture.rootPath,
    `${suffix}-timeout-evidence.json`,
  )
  await writeFile(scopePath, JSON.stringify(accepted.fixture.scope))
  await writeFile(definitionPath, JSON.stringify(accepted.fixture.definition))
  await writeFile(manifestPath, JSON.stringify(accepted.fixture.manifest))
  await writeFile(evidencePath, JSON.stringify({
    persistedAttemptCostEvidenceRequired: true,
  }))
  return [
    scopePath,
    definitionPath,
    manifestPath,
    timeoutAt,
    evidencePath,
    accepted.dispatchIntentId,
  ]
}

async function assertFailurePersistedExactlyOnce(
  accepted: AcceptedFailureFixture,
): Promise<void> {
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.ok(queue)
  assert.ok(outbox)
  assert.equal(queue.summary.completedJobCount, 0)
  assert.equal(queue.summary.leasedJobCount, 0)
  assert.equal(queue.summary.releasedClaimCount, 1)
  assert.equal(queue.events.filter((event) => event.eventType === 'claim_released').length, 1)
  assert.equal(queue.entries[0]?.state, 'queued')
  assert.equal(queue.entries[0]?.activeClaim, undefined)
  assert.equal(queue.entries[0]?.completion, undefined)
  assert.equal(outbox.summary.workerFailureReconciledCount, 1)
  assert.equal(outbox.summary.workerCompletionReconciledCount, 0)
  assert.equal(outbox.events.filter((event) =>
    event.eventType === 'worker_failure_reconciled').length, 1)
  const release = queue.entries[0]?.lastRelease
  const receipt = outbox.entries[0]?.failureReceipt
  assert.ok(release?.dispatchFailure)
  assert.ok(receipt)
  assert.equal(receipt.queueReleaseHash, release.releaseHash)
  assert.equal(
    receipt.attemptInternalCostEvidenceHash,
    accepted.failureEvidence.attemptInternalCostEvidenceHash,
  )
  assert.equal(
    receipt.boundaries.customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )
  assert.equal(await pathExists(accepted.fixture.transactionPath), false)
}

async function writeFailureChildInputs(
  accepted: AcceptedFailureFixture,
  suffix: string,
): Promise<string[]> {
  const scopePath = join(accepted.fixture.rootPath, `${suffix}-scope.json`)
  const definitionPath = join(accepted.fixture.rootPath, `${suffix}-definition.json`)
  const manifestPath = join(accepted.fixture.rootPath, `${suffix}-manifest.json`)
  const evidencePath = join(accepted.fixture.rootPath, `${suffix}-failure-evidence.json`)
  await writeFile(scopePath, JSON.stringify(accepted.fixture.scope))
  await writeFile(definitionPath, JSON.stringify(accepted.fixture.definition))
  await writeFile(manifestPath, JSON.stringify(accepted.fixture.manifest))
  await writeFile(evidencePath, JSON.stringify(accepted.failureEvidence))
  return [
    scopePath,
    definitionPath,
    manifestPath,
    failureAt,
    evidencePath,
    accepted.dispatchIntentId,
  ]
}

async function proveFaultRecovery(
  stage: CanonicalPrivatePackageStateFaultStage,
  suffix: string,
) {
  const fixture = await createFixture(suffix)
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const sentinel = new Error(`simulated-crash-${stage}`)
  await assert.rejects(
    () => claim(fixture, {
      faultInjectionForSmoke: (currentStage) => {
        if (currentStage === stage) throw sentinel
      },
    }),
    (error: unknown) => error === sentinel,
  )
  const transactionBytes = await readFile(fixture.transactionPath, 'utf8')
  assert.equal((await stat(fixture.transactionPath)).mode & 0o777, 0o600)
  assert.equal(transactionBytes.includes('simulated-worker-identity'), false)
  assert.equal(transactionBytes.includes('claimCredential'), false)
  assert.equal(transactionBytes.includes('Bearer '), false)
  assert.equal(transactionBytes.includes('signedUrl'), false)

  if (stage === 'after_write_ahead_commit') {
    assert.equal(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
    assert.equal(await pathExists(fixture.outboxPath), false)
  } else {
    assert.notEqual(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
    assert.equal(await pathExists(fixture.outboxPath), false)
  }

  const recovered = await claim(fixture)
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    stage === 'after_write_ahead_commit',
  )
  assert.equal(await pathExists(fixture.transactionPath), false)
  assert.equal((await stat(fixture.queuePath)).mode & 0o777, 0o600)
  assert.equal((await stat(fixture.outboxPath)).mode & 0o777, 0o600)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: fixture.scope })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(queue?.summary.leasedJobCount, 1)
  assert.equal(outbox?.summary.totalEntryCount, 1)
  assert.equal(
    outbox?.entries[0]?.immutable.queueClaimId,
    queue?.entries[0]?.activeClaim?.claimId,
  )
  return {
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
    packageDeliveryAttemptCount: queue?.summary.totalDeliveryAttemptCount,
  }
}

async function proveTamperedTransactionFailsClosed(): Promise<void> {
  const fixture = await createFixture('tampered-transaction')
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const sentinel = new Error('stop-after-transaction-commit')
  await assert.rejects(
    () => claim(fixture, {
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  const untampered = await readFile(fixture.transactionPath, 'utf8')
  const decoded = JSON.parse(untampered) as { authority: { jobId: string } }
  decoded.authority.jobId = 'job_tampered_transaction'
  await writeFile(fixture.transactionPath, JSON.stringify(decoded))
  await expectApiError(() => claim(fixture), 'VALIDATION_FAILED')
  assert.equal(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
  assert.equal(await pathExists(fixture.outboxPath), false)
  await writeFile(fixture.transactionPath, untampered)
  assert.equal((await claim(fixture)).disposition, 'exact_replay')
}

async function proveProjectionDriftFailsClosed(): Promise<void> {
  const fixture = await createFixture('projection-drift')
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const sentinel = new Error('stop-before-projection')
  await assert.rejects(
    () => claim(fixture, {
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  await writeFile(fixture.queuePath, `${initialQueueBytes} `)
  await expectApiError(() => claim(fixture), 'IDEMPOTENCY_CONFLICT')
  assert.equal(await pathExists(fixture.outboxPath), false)
  await writeFile(fixture.queuePath, initialQueueBytes)
  assert.equal((await claim(fixture)).disposition, 'exact_replay')
}

async function proveCrossProcessClaimRace(): Promise<string[]> {
  const fixture = await createFixture('cross-process-race')
  const scopePath = join(fixture.rootPath, 'scope-fixture.json')
  const definitionPath = join(fixture.rootPath, 'definition-fixture.json')
  const manifestPath = join(fixture.rootPath, 'manifest-fixture.json')
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  await writeFile(definitionPath, JSON.stringify(fixture.definition))
  await writeFile(manifestPath, JSON.stringify(fixture.manifest))
  const args = [scopePath, definitionPath, manifestPath, committedAt]
  const results = await Promise.all([
    runChild('claim', args),
    runChild('claim', args),
  ])
  const parsed = results.map((stdout) => JSON.parse(lastNonEmptyLine(stdout)) as {
    disposition: string
    queueClaimId: string
    dispatchIntentId: string
  })
  assert.deepEqual(
    parsed.map((result) => result.disposition).sort(),
    ['created', 'exact_replay'],
  )
  assert.equal(new Set(parsed.map((result) => result.queueClaimId)).size, 1)
  assert.equal(new Set(parsed.map((result) => result.dispatchIntentId)).size, 1)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: fixture.scope })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(queue?.events.filter((event) => event.eventType === 'job_claimed').length, 1)
  assert.equal(outbox?.summary.totalEntryCount, 1)
  assert.equal(outbox?.events.filter((event) => event.eventType === 'outbox_entry_created').length, 1)
  return parsed.map((result) => result.disposition).sort()
}

async function proveGenericQueueCrossProcessClaimRace(): Promise<string[]> {
  const fixture = await createFixture('generic-queue-cross-process-race')
  const scopePath = join(fixture.rootPath, 'queue-scope-fixture.json')
  const definitionPath = join(fixture.rootPath, 'queue-definition-fixture.json')
  const manifestPath = join(fixture.rootPath, 'queue-unused-manifest-fixture.json')
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  await writeFile(definitionPath, JSON.stringify(fixture.definition))
  await writeFile(manifestPath, JSON.stringify(fixture.manifest))
  const args = [scopePath, definitionPath, manifestPath, committedAt]
  const results = await Promise.all([
    runChild('queue-claim', args),
    runChild('queue-claim', args),
  ])
  const parsed = results.map((stdout) => JSON.parse(lastNonEmptyLine(stdout)) as {
    disposition: string
    queueClaimId?: string
  })
  assert.deepEqual(
    parsed.map((result) => result.disposition).sort(),
    ['already_leased', 'claimed'],
  )
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(queue?.events.filter((event) => event.eventType === 'job_claimed').length, 1)
  return parsed.map((result) => result.disposition).sort()
}

async function proveAcceptedWorkerTimeoutFencesAndExhaustionPersists() {
  const accepted = await createAcceptedTimeoutFixture(
    'accepted-worker-timeout-progression',
  )
  const initialOutbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  const firstEntry = initialOutbox?.entries.find((entry) =>
    entry.immutable.dispatchIntentId === accepted.dispatchIntentId)
  if (!firstEntry) throw new Error('First accepted timeout attempt is missing.')
  const queueBeforeFence = await readFile(accepted.fixture.queuePath, 'utf8')
  const outboxBeforeFence = await readFile(accepted.fixture.outboxPath, 'utf8')
  const timeoutService = createCompletionService(accepted.fixture, timeoutAt)
  const fenced = await timeoutService.enqueueApprovedAttempt({
    jobId: accepted.fixture.definition.jobs[0]!.jobId,
  })
  assert.equal(fenced.disposition, 'stale_attempt_reconciliation_required')
  assert.equal(
    'requiredGate' in fenced ? fenced.requiredGate : undefined,
    'canonical_cloud_dispatch_accepted_worker_timeout_reconciliation',
  )
  assert.equal(
    await readFile(accepted.fixture.queuePath, 'utf8'),
    queueBeforeFence,
  )
  assert.equal(
    await readFile(accepted.fixture.outboxPath, 'utf8'),
    outboxBeforeFence,
  )

  const firstTimeout = await reconcileAcceptedTimeout(accepted)
  assert.equal(firstTimeout.disposition, 'reconciled')
  assert.equal(firstTimeout.queueDisposition, 'retry_available')
  assert.equal(firstTimeout.retryDisposition, 'retry_same_approved_operation')
  assert.equal(firstTimeout.remainingAttempts, 1)
  assert.equal(firstTimeout.boundaries.automaticRetryLoopStarted, false)
  const firstReplay = await reconcileAcceptedTimeout(accepted)
  assert.equal(firstReplay.disposition, 'exact_replay')
  assert.equal(firstReplay.receipt.receiptHash, firstTimeout.receipt.receiptHash)

  const secondService = createCompletionService(accepted.fixture, timeoutAt)
  const second = await secondService.enqueueApprovedAttempt({
    jobId: accepted.fixture.definition.jobs[0]!.jobId,
  })
  assert.equal(second.disposition, 'created')
  if (!('outboxEntry' in second) || !('attemptPlan' in second)) {
    throw new Error('Second dispatch attempt was not created after reconciliation.')
  }
  assert.equal(second.outboxEntry.immutable.packageDeliveryAttempt, 2)
  assert.notEqual(
    second.outboxEntry.immutable.queueClaimId,
    firstEntry.immutable.queueClaimId,
  )
  const secondTaskBody = second.attemptPlan.cloudTask?.taskBody
  if (!secondTaskBody) throw new Error('Second timeout task body is missing.')
  const secondControllerSubject = 'timeout-second-controller-subject'
  await secondService.receiveController({
    taskBody: secondTaskBody,
    verifiedIdentity: privateServiceIdentity({
      authenticationMechanism: 'google_oidc_id_token',
      principalEmail:
        second.outboxEntry.immutable.controllerServiceAccountEmail,
      audience: controllerAudience,
      subject: secondControllerSubject,
      now: timeoutAt,
    }),
  })
  const secondInvocation = await secondService.createWorkerInvocation(
    second.outboxEntry.immutable.dispatchIntentId,
  )
  await secondService.receiveWorker({
    invocation: secondInvocation,
    verifiedIdentity: privateServiceIdentity({
      authenticationMechanism: 'google_cloud_run_workload_identity',
      principalEmail: second.outboxEntry.immutable.workerServiceAccountEmail,
      audience: workerAudience,
      subject: 'timeout-second-worker-subject',
      now: timeoutAt,
    }),
  })

  const secondTimeoutAt = new Date(Date.parse(timeoutAt) + 121_000).toISOString()
  const queueBeforeSecondFence = await readFile(
    accepted.fixture.queuePath,
    'utf8',
  )
  const outboxBeforeSecondFence = await readFile(
    accepted.fixture.outboxPath,
    'utf8',
  )
  const secondTimeoutService = createCompletionService(
    accepted.fixture,
    secondTimeoutAt,
  )
  const secondFenced = await secondTimeoutService.enqueueApprovedAttempt({
    jobId: accepted.fixture.definition.jobs[0]!.jobId,
  })
  assert.equal(
    secondFenced.disposition,
    'stale_attempt_reconciliation_required',
  )
  assert.equal(
    await readFile(accepted.fixture.queuePath, 'utf8'),
    queueBeforeSecondFence,
  )
  assert.equal(
    await readFile(accepted.fixture.outboxPath, 'utf8'),
    outboxBeforeSecondFence,
  )
  const secondTimeoutCostHash = sha256AuthorityValue({
    suffix: 'accepted-worker-timeout-progression-unused-caller-hash',
  })
  const secondAttemptCost = await persistTimeoutAttemptCostEvidence({
    accepted,
    dispatchIntentId: second.outboxEntry.immutable.dispatchIntentId,
    retryAttempt: second.outboxEntry.immutable.packageDeliveryAttempt - 1,
  })
  assert.notEqual(secondAttemptCost.evidenceHash, secondTimeoutCostHash)
  const secondTimeout = await secondTimeoutService.reconcileWorkerTimeout({
    dispatchIntentId: second.outboxEntry.immutable.dispatchIntentId,
    verifiedIdentity: privateServiceIdentity({
      authenticationMechanism: 'google_oidc_id_token',
      principalEmail:
        second.outboxEntry.immutable.controllerServiceAccountEmail,
      audience: controllerAudience,
      subject: secondControllerSubject,
      now: secondTimeoutAt,
    }),
  })
  assert.equal(secondTimeout.disposition, 'reconciled')
  assert.equal(secondTimeout.queueDisposition, 'attempts_exhausted')
  assert.equal(
    secondTimeout.retryDisposition,
    'fallback_or_user_review_required',
  )
  assert.equal(secondTimeout.remainingAttempts, 0)
  const secondReplay = await secondTimeoutService.reconcileWorkerTimeout({
    dispatchIntentId: second.outboxEntry.immutable.dispatchIntentId,
    verifiedIdentity: privateServiceIdentity({
      authenticationMechanism: 'google_oidc_id_token',
      principalEmail:
        second.outboxEntry.immutable.controllerServiceAccountEmail,
      audience: controllerAudience,
      subject: secondControllerSubject,
      now: secondTimeoutAt,
    }),
  })
  assert.equal(secondReplay.disposition, 'exact_replay')
  assert.equal(secondReplay.receipt.receiptHash, secondTimeout.receipt.receiptHash)

  const exhausted = await secondTimeoutService.enqueueApprovedAttempt({
    jobId: accepted.fixture.definition.jobs[0]!.jobId,
  })
  assert.equal(exhausted.disposition, 'attempts_exhausted')
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: accepted.fixture.scope,
    definition: accepted.fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({
    scope: accepted.fixture.scope,
  })
  assert.equal(queue?.entries[0]?.state, 'queued')
  assert.equal(queue?.entries[0]?.activeClaim, undefined)
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 2)
  assert.equal(queue?.summary.expiredClaimRecoveryCount, 2)
  assert.equal(outbox?.summary.totalEntryCount, 2)
  assert.equal(outbox?.summary.workerTimeoutReconciledCount, 2)
  assert.equal(outbox?.summary.workerCompletionReconciledCount, 0)
  assert.equal(outbox?.summary.workerFailureReconciledCount, 0)
  return {
    firstFence: fenced.disposition,
    firstTimeoutDisposition: firstTimeout.queueDisposition,
    secondFence: secondFenced.disposition,
    deliveryAttemptCount: queue?.summary.totalDeliveryAttemptCount,
    expiredClaimRecoveryCount: queue?.summary.expiredClaimRecoveryCount,
    outboxEntryCount: outbox?.summary.totalEntryCount,
    terminalTimeoutCount: outbox?.summary.workerTimeoutReconciledCount,
    finalDisposition: exhausted.disposition,
  }
}

async function proveDeadOwnerLockRecovery(): Promise<boolean> {
  const fixture = await createFixture('dead-lock-owner')
  const scopePath = join(fixture.rootPath, 'dead-owner-scope.json')
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  const child = spawnChild('hold-lock', [scopePath])
  await waitForStdout(child, 'LOCK_ACQUIRED')
  assert.equal((await stat(fixture.lockPath)).mode & 0o777, 0o600)
  assert.equal(child.kill('SIGKILL'), true)
  await waitForExit(child)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  assert.ok(queue)
  assert.equal(await pathExists(fixture.lockPath), false)
  return true
}

async function proveLockSymlinkRefusal(): Promise<void> {
  const fixture = await createFixture('lock-symlink')
  const outsidePath = join(tmpdir(), `reeditpro-lock-symlink-outside-${process.pid}.txt`)
  await writeFile(outsidePath, 'outside-sentinel')
  try {
    await mkdir(dirname(fixture.lockPath), { recursive: true })
    await symlink(outsidePath, fixture.lockPath)
    await expectApiError(
      () => readPrivateCanonicalPackageWorkQueue({
        scope: fixture.scope,
        definition: fixture.definition,
      }),
      'VALIDATION_FAILED',
    )
    assert.equal(await readFile(outsidePath, 'utf8'), 'outside-sentinel')
  } finally {
    await rm(outsidePath, { force: true })
  }
}

interface Fixture {
  rootPath: string
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  scope: CanonicalPrivatePackageStateScope
  queuePath: string
  outboxPath: string
  transactionPath: string
  lockPath: string
}

async function createFixture(
  suffix: string,
  canonicalToolId = 'ffprobe',
): Promise<Fixture> {
  const rootPath = await mkdtemp(join(tmpdir(), `reeditpro-package-state-${suffix}-`))
  roots.push(rootPath)
  const definition = createQueueDefinition(suffix, canonicalToolId)
  const manifest = createManifest(definition)
  const scope: CanonicalPrivatePackageStateScope = {
    localStorageRoot: rootPath,
    ownerUserId: `owner-${suffix}`,
    workspaceId: definition.identity.workspaceId,
    projectId: definition.identity.projectId,
    editSessionId: definition.identity.editSessionId,
    packageRecordId: definition.identity.packageRecordId,
    approvedPlanSnapshotId: definition.identity.approvedPlanSnapshotId,
  }
  await ensurePrivateCanonicalPackageWorkQueue({
    scope,
    definition,
    now: new Date(baseTimeMs).toISOString(),
  })
  const paths = canonicalPrivatePackageStatePaths(scope)
  return {
    rootPath,
    definition,
    manifest,
    scope,
    queuePath: join(rootPath, paths.queueRelativePath),
    outboxPath: join(rootPath, paths.outboxRelativePath),
    transactionPath: join(rootPath, paths.transactionRelativePath),
    lockPath: join(rootPath, paths.lockRelativePath),
  }
}

function claim(
  fixture: Fixture,
  options: {
    faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
    now?: string
  } = {},
) {
  return claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt({
    scope: fixture.scope,
    definition: fixture.definition,
    manifest: fixture.manifest,
    jobId: fixture.definition.jobs[0]!.jobId,
    workerIdentity: 'simulated-worker-identity',
    now: options.now ?? committedAt,
    leaseDurationMs: 120_000,
    faultInjectionForSmoke: options.faultInjectionForSmoke,
  })
}

function createCompletionService(fixture: Fixture, now: string) {
  const context: ServiceContext = {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'local',
      STORAGE_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      LOCAL_STORAGE_ROOT: fixture.rootPath,
    }),
    clients: { admin: null, public: null },
    requestId: `completion-${fixture.scope.packageRecordId}`,
    auth: { userId: fixture.scope.ownerUserId, isMockUser: true },
  }
  return createCanonicalPrivateCloudDispatchReceiverService({
    context,
    ownerUserId: fixture.scope.ownerUserId,
    queueDefinition: fixture.definition,
    manifest: fixture.manifest,
    controllerAudience,
    workerReceiverAudience: workerAudience,
    now: () => new Date(now),
  })
}

function privateServiceIdentity(input: {
  authenticationMechanism: CanonicalServiceIdentityEvidence['authenticationMechanism']
  principalEmail: string
  audience: string
  subject: string
  now: string
}): CanonicalVerifiedServiceIdentity {
  const nowMs = Date.parse(input.now)
  return createCanonicalPrivateServiceIdentityFixture({
    authenticationMechanism: input.authenticationMechanism,
    subject: input.subject,
    principalEmail: input.principalEmail,
    audience: input.audience,
    issuedAt: new Date(nowMs - 1_000).toISOString(),
    expiresAt: new Date(nowMs + 120_000).toISOString(),
    verifiedAt: new Date(nowMs - 500).toISOString(),
  })
}

function completionEvidence(suffix: string): CanonicalCloudDispatchWorkerCompletionEvidence {
  return {
    schemaVersion: 'canonical-cloud-dispatch-worker-completion-evidence-v1',
    artifactId: `artifact-${suffix}`,
    contentType: 'application/json',
    artifactSha256: sha256AuthorityValue({ suffix, kind: 'artifact' }),
    adapterReplayed: false,
    privateArtifactManifestHash: sha256AuthorityValue({ suffix, kind: 'manifest' }),
    qaEvidenceHash: sha256AuthorityValue({ suffix, kind: 'qa' }),
    assetReconciliationEvidenceHash: sha256AuthorityValue({
      suffix,
      kind: 'reconciliation',
    }),
    downstreamLeaseVerificationHash: sha256AuthorityValue({
      suffix,
      kind: 'downstream-lease',
    }),
    attemptInternalCostEvidenceHash: sha256AuthorityValue({
      suffix,
      kind: 'attempt-internal-cost',
    }),
    artifactStorageClass: 'private_internal_test',
    qaStatus: 'passed',
    assetReconciliationStatus: 'reconciled',
    downstreamLeaseStatus: 'verified',
  }
}

function failureEvidence(
  suffix: string,
  overrides: Partial<Pick<
    CanonicalCloudDispatchWorkerFailureEvidence,
    'failureCategory' | 'failureCode' | 'executionState'
  >> = {},
): CanonicalCloudDispatchWorkerFailureEvidence {
  return {
    schemaVersion: 'canonical-cloud-dispatch-worker-failure-evidence-v1',
    failureCategory: overrides.failureCategory ?? 'runtime_unavailable',
    failureCode: overrides.failureCode ?? 'TOOL_NOT_READY',
    executionState: overrides.executionState ?? 'failed_before_commit',
    failureDetailHash: sha256AuthorityValue({ suffix, kind: 'failure-detail' }),
    attemptInternalCostEvidenceHash: sha256AuthorityValue({
      suffix,
      kind: 'failure-attempt-internal-cost',
    }),
    attemptCostBoundary: 'internal_production_cost_only',
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false,
    rawFailureMessageLogStackPathOrCredentialRetained: false,
  }
}

function createQueueDefinition(
  suffix: string,
  canonicalToolId: string,
): CanonicalPrivatePackageWorkQueueDefinition {
  const target = createCanonicalProvenToolCloudDispatchCatalog().tools.find((tool) =>
    tool.canonicalToolId === canonicalToolId)
  assert.ok(target)
  const jobPayload = {
    canonicalOrder: 0,
    jobId: `job-${suffix}`,
    approvedWorkItemId: `work-${suffix}`,
    workItemKey: `work-key-${suffix}`,
    required: true,
    dependencyJobIds: [],
    workerType: target.workerType,
    resourceClassId: target.resourceClassId,
    plannedCloudExecutionTarget: 'cloud_run_job' as const,
    preferredAccelerator: target.workerType === 'gpu_ai_worker'
      ? 'nvidia_l4' as const
      : 'none' as const,
    placementHash: target.privatePlacementHash,
    privateExecutionReady: true,
    providerExecutionMode: 'none' as const,
    maxAttempts: 2,
    attemptTimeoutSeconds: 120,
    scheduledFor: new Date(baseTimeMs).toISOString(),
  }
  const job = { ...jobPayload, definitionHash: sha256AuthorityValue(jobPayload) }
  const payload = {
    schemaVersion: 'canonical-private-package-work-queue-definition-v1' as const,
    source: 'canonical_execution_package_and_snapshot_resource_placement' as const,
    identity: {
      workspaceId: `workspace-${suffix}`,
      projectId: `project-${suffix}`,
      editSessionId: `session-${suffix}`,
      packageRecordId: `package-${suffix}`,
      approvedPlanSnapshotId: `snapshot-${suffix}`,
      packageHash: sha256AuthorityValue({ suffix, kind: 'package' }),
      snapshotHash: sha256AuthorityValue({ suffix, kind: 'snapshot' }),
      workGraphHash: sha256AuthorityValue({ suffix, kind: 'work-graph' }),
      placementManifestHash: sha256AuthorityValue({ suffix, kind: 'placement' }),
      toolExecutionAuthorityHash: sha256AuthorityValue({ suffix, kind: 'tool-authority' }),
      approvedResourcePlacementAuthorityHash:
        sha256AuthorityValue({ suffix, kind: 'resource-authority' }),
    },
    jobs: [job],
    summary: {
      totalJobCount: 1,
      requiredJobCount: 1,
      cpuAnalysisJobCount: target.workerType === 'cpu_analysis_worker' ? 1 : 0,
      gpuJobCount: target.workerType === 'gpu_ai_worker' ? 1 : 0,
      renderJobCount: target.workerType === 'render_worker' ? 1 : 0,
      allJobsHaveSnapshotBoundPlacement: true as const,
      callerSelectedJobs: false as const,
      callerSelectedDependencies: false as const,
      callerSelectedPlacement: false as const,
    },
    boundaries: {
      approvedSnapshotRequired: true as const,
      fundedReservationRequired: true as const,
      privateArtifactsQaAndReconciliationRequired: true as const,
      browserClaimAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalPrivatePackageWorkQueueDefinitionSchema.parse({
    ...payload,
    definitionHash: sha256AuthorityValue(payload),
  })
}

function createManifest(
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): CanonicalCloudWorkerDispatchHandoffManifest {
  const catalog = createCanonicalProvenToolCloudDispatchCatalog()
  const queueJob = definition.jobs[0]!
  const tool = catalog.tools.find((candidate) =>
    candidate.privatePlacementHash === queueJob.placementHash)
  assert.ok(tool)
  const regionAuthority = createCanonicalCloudRuntimeRegionAuthority({
    queueDefinition: definition,
    runtimeRegion: 'us-east1',
    sourceObjectRegions: ['us-east1'],
    allRequiredObjectsRegionBound: true,
    liveProjectRegionPersistenceVerified: false,
    liveGcsObjectResidencyVerified: false,
  })
  const queueResourceName = 'projects/reeditpro/locations/us-east1/queues/' +
    REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.cloudTasksQueuesByRegion['us-east1'].workerDispatch
  const entryPayload = {
    canonicalOrder: 0,
    jobId: queueJob.jobId,
    approvedWorkItemId: queueJob.approvedWorkItemId,
    workItemKey: queueJob.workItemKey,
    required: true,
    dependencyJobIds: [],
    scheduledFor: queueJob.scheduledFor,
    maxAttempts: queueJob.maxAttempts,
    approvedToolId: tool.canonicalToolId,
    approvedToolOperationIds: [tool.operationId],
    queueJobDefinitionHash: queueJob.definitionHash,
    placementHash: queueJob.placementHash,
    workerType: queueJob.workerType,
    resourceClassId: queueJob.resourceClassId,
    runtimeRegion: 'us-east1' as const,
    target: tool.target,
    queueResourceName,
    privateDispatchControllerServiceName: GCP_PRODUCTION_API_SERVICE.name,
    privateDispatchControllerPath: '/internal/v1/canonical-cloud-dispatch' as const,
    taskOidcServiceAccountEmail:
      REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.serviceAccounts.apiOrchestrator,
    taskOidcAudienceState: 'deployed_private_controller_url_required' as const,
    cloudRunTaskTimeoutSeconds: queueJob.attemptTimeoutSeconds,
    cloudRunTaskTimeoutLimitSeconds: 604_800,
    packageQueueOwnsApprovedAttempts: true as const,
    cloudTasksDeliveryRetryDoesNotAuthorizeAnotherExecutionAttempt: true as const,
    workerLoadsAuthorityByOpaqueDispatchIntent: true as const,
    taskBodyCarriesRawMediaOrSecrets: false as const,
    blockers: ['distributed_dispatch_outbox_transaction_not_verified'],
    cloudDispatchAuthorized: false as const,
    productionExecutionAuthorized: false as const,
  }
  const entry = { ...entryPayload, entryHash: sha256AuthorityValue(entryPayload) }
  const payload = {
    schemaVersion: 'canonical-cloud-worker-dispatch-handoff-manifest-v1' as const,
    source: 'approved_package_queue_region_and_cloud_target_authority' as const,
    identity: {
      workspaceId: definition.identity.workspaceId,
      projectId: definition.identity.projectId,
      editSessionId: definition.identity.editSessionId,
      packageRecordId: definition.identity.packageRecordId,
      approvedPlanSnapshotId: definition.identity.approvedPlanSnapshotId,
      packageHash: definition.identity.packageHash,
      snapshotHash: definition.identity.snapshotHash,
      workGraphHash: definition.identity.workGraphHash,
      queueDefinitionHash: definition.definitionHash,
      regionAuthorityHash: regionAuthority.authorityHash,
      toolTargetCatalogHash: catalog.catalogHash,
    },
    runtimeRegion: 'us-east1' as const,
    entries: [entry],
    summary: {
      totalJobCount: 1,
      controlPlaneJobCount: 0,
      cloudTaskHandoffJobCount: 1,
      cpuAnalysisJobCount: queueJob.workerType === 'cpu_analysis_worker' ? 1 : 0,
      gpuJobCount: queueJob.workerType === 'gpu_ai_worker' ? 1 : 0,
      renderJobCount: queueJob.workerType === 'render_worker' ? 1 : 0,
      allJobsHaveExactCloudTargetContract: true as const,
      cloudRunHiddenRetryCount: 0 as const,
      allTaskBodiesOpaque: true as const,
    },
    boundaries: {
      browserDispatchAllowed: false as const,
      rawChatPromptMediaBytesOrSignedUrlsAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      remoteSupabaseAuthorized: false as const,
      distributedOutboxTransactionVerified: false as const,
      cloudTasksOidcAndIamVerified: false as const,
      cloudRunJobDeploymentVerified: false as const,
      workerServiceIdentityVerified: false as const,
      privateGcsObjectTransportVerified: false as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalCloudWorkerDispatchHandoffManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

function spawnChild(
  mode: 'claim' | 'queue-claim' | 'hold-lock' | 'crash-after-commit' |
    'crash-after-queue' | 'complete' | 'crash-completion-after-commit' |
    'crash-completion-after-queue' | 'fail' | 'crash-failure-after-commit' |
    'crash-failure-after-queue' | 'timeout' | 'crash-timeout-after-commit' |
    'crash-timeout-after-queue',
  args: string[],
): ChildProcess {
  return spawn(
    process.execPath,
    [
      '--import=tsx',
      join(process.cwd(), 'server/smoke/helpers/canonical-package-state-transaction-child.ts'),
      mode,
      ...args,
    ],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
  )
}

async function runChild(
  mode: 'claim' | 'queue-claim' | 'complete' | 'fail' | 'timeout',
  args: string[],
): Promise<string> {
  const child = spawnChild(mode, args)
  let stdout = ''
  let stderr = ''
  child.stdout?.on('data', (chunk) => { stdout += String(chunk) })
  child.stderr?.on('data', (chunk) => { stderr += String(chunk) })
  const exit = await waitForExit(child)
  if (exit.code !== 0) throw new Error(`Package-state child failed: ${stderr}`)
  return stdout
}

async function waitForStdout(child: ChildProcess, expected: string): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    let output = ''
    const timeout = setTimeout(() => rejectPromise(new Error('Timed out waiting for child lock.')), 10_000)
    child.stdout?.on('data', (chunk) => {
      output += String(chunk)
      if (output.includes(expected)) {
        clearTimeout(timeout)
        resolvePromise()
      }
    })
    child.once('error', (error) => {
      clearTimeout(timeout)
      rejectPromise(error)
    })
    child.once('exit', (code) => {
      if (!output.includes(expected)) {
        clearTimeout(timeout)
        rejectPromise(new Error(`Lock child exited early with code ${code}.`))
      }
    })
  })
}

function waitForExit(child: ChildProcess): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolvePromise, rejectPromise) => {
    child.once('error', rejectPromise)
    child.once('exit', (code, signal) => resolvePromise({ code, signal }))
  })
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function lastNonEmptyLine(value: string): string {
  const lines = value.trim().split(/\r?\n/u).filter(Boolean)
  const line = lines.at(-1)
  if (!line) throw new Error('Package-state child returned no output.')
  return line
}

async function expectApiError(
  operation: () => Promise<unknown>,
  expectedCode: ApiError['code'],
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === expectedCode)
}
