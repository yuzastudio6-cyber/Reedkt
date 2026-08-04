import assert from 'node:assert/strict'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  canonicalDistributedLargeMediaFinalizationReadiness,
  createCanonicalDistributedLargeMediaFinalizationSeed,
} from '../services/canonical-distributed-large-media-finalization-contract-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { UploadFinalizationCandidate } from '../services/upload-service'
import {
  assertCanonicalDistributedMediaIngestProductionAuthority,
  assertCanonicalDistributedMediaIngestStatePort,
  canonicalDistributedMediaIngestCancellationRequestSchema,
  canonicalDistributedMediaIngestClaimRequestSchema,
  canonicalDistributedMediaIngestCompletionRequestSchema,
  canonicalDistributedMediaIngestEnqueueRequestSchema,
  canonicalDistributedMediaIngestFailureRequestSchema,
  canonicalDistributedMediaIngestPortDescriptorSchema,
  canonicalDistributedMediaIngestProgressRequestSchema,
  canonicalDistributedMediaIngestRequestHash,
  canonicalDistributedMediaIngestTimeoutRequestSchema,
  createCanonicalDistributedMediaIngestStatePort,
  type CanonicalDistributedMediaIngestMutationResponse,
  type CanonicalDistributedMediaIngestSeed,
  type CanonicalDistributedMediaIngestTransactionAdapter,
} from './canonical-distributed-media-ingest-state-port'
import {
  createInMemoryCanonicalDistributedMediaIngestFixture,
} from './in-memory-canonical-distributed-media-ingest-fixture'

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeCheck = z.string().trim().min(1).max(160)
const evidenceBrands = new WeakSet<object>()

export const canonicalDistributedMediaIngestConformanceEvidenceSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-media-ingest-conformance-v1'),
  source: z.literal('database_neutral_pre_plan_media_ingest_contract_fixture'),
  adapterId: safeCheck,
  adapterDescriptorHash: sha256,
  seedHash: sha256,
  readinessHash: sha256,
  checkCount: z.number().int().positive().max(300),
  checks: z.array(safeCheck).min(1).max(300),
  prePlanTechnicalIngestAuthorityVerified: z.literal(true),
  approvedPackageAuthorityReusedOrFabricated: z.literal(false),
  serializableClaimAndReplayVerified: z.literal(true),
  capacityBeforeAttemptVerified: z.literal(true),
  generationIdentityRetryBindingVerified: z.literal(true),
  monotonicDurableCheckpointAndResumeVerified: z.literal(true),
  freshAdapterRecoveryVerified: z.literal(true),
  leaseLossAndTimeoutReconciliationVerified: z.literal(true),
  completionFailureTimeoutExclusivityVerified: z.literal(true),
  attemptInternalCostRetentionVerified: z.literal(true),
  cancellationVerified: z.literal(true),
  customerCommercialAuthorityIncluded: z.literal(false),
  automaticRetryStarted: z.literal(false),
  databaseBackendUsed: z.literal(false),
  distributedDatabaseTransactionVerified: z.literal(false),
  multiReplicaDurabilityVerified: z.literal(false),
  cloudDispatchVerified: z.literal(false),
  liveGcsObjectBytesRead: z.literal(false),
  hostedUploadsAboveInlineCeilingAllowed: z.literal(false),
  productionAuthority: z.literal(false),
  evidenceHash: sha256,
}).strict().superRefine((evidence, context) => {
  if (
    evidence.checkCount !== evidence.checks.length ||
    new Set(evidence.checks).size !== evidence.checks.length
  ) {
    context.addIssue({ code: 'custom', message: 'Media-ingest conformance checks are invalid.' })
  }
})

export type CanonicalDistributedMediaIngestConformanceEvidence = z.infer<
  typeof canonicalDistributedMediaIngestConformanceEvidenceSchema
>

export async function runCanonicalDistributedMediaIngestConformance(): Promise<
  CanonicalDistributedMediaIngestConformanceEvidence
> {
  const checks: string[] = []
  const record = (check: string): void => { checks.push(check) }
  const baseTime = '2026-07-20T00:00:00.000Z'
  const seed = createCanonicalDistributedLargeMediaFinalizationSeed(candidate('main'))
  const fixture = createInMemoryCanonicalDistributedMediaIngestFixture(seed)
  const port = createCanonicalDistributedMediaIngestStatePort(fixture.adapter)

  assertCanonicalDistributedMediaIngestStatePort(port)
  record('process_branded_exact_schema_port_boundary')
  await expectApiError(
    async () => assertCanonicalDistributedMediaIngestProductionAuthority(port),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  record('fixture_cannot_authorize_production')
  const liveFlagDescriptorPayload = {
    ...fixture.adapter.descriptor,
    adapterId: 'canonical_media_ingest_forward_version_required_fixture_v1',
    implementationClass: 'database_transaction_adapter' as const,
    databaseBackend: 'postgres' as const,
    distributedDatabaseTransactionVerified: true,
    multiReplicaDurabilityVerified: true,
    liveSupabaseOrPostgresCallPerformed: true,
    cloudDispatchVerified: true,
    liveGcsObjectBytesRead: true,
  }
  const { descriptorHash: _descriptorHash, ...liveFlagDescriptorWithoutHash } =
    liveFlagDescriptorPayload
  void _descriptorHash
  const liveFlagPort = createCanonicalDistributedMediaIngestStatePort({
    ...fixture.adapter,
    descriptor: canonicalDistributedMediaIngestPortDescriptorSchema.parse({
      ...liveFlagDescriptorWithoutHash,
      descriptorHash: sha256AuthorityValue(liveFlagDescriptorWithoutHash),
    }),
  })
  await expectApiError(
    async () => assertCanonicalDistributedMediaIngestProductionAuthority(liveFlagPort),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  record('v1_contract_cannot_self_promote_even_with_live_evidence_flags')
  const forged = { ...port } as CanonicalDistributedMediaIngestTransactionAdapter
  assert.throws(
    () => assertCanonicalDistributedMediaIngestStatePort(forged),
    isApiError('IDEMPOTENCY_ATOMICITY_REQUIRED'),
  )
  record('structured_copy_loses_port_authority')

  assert.throws(
    () => createCanonicalDistributedLargeMediaFinalizationSeed({
      ...candidate('inline'),
      expectedSizeBytes: 1024,
      backgroundFinalizationRequired: false,
    }),
    isApiError('SOURCE_MEDIA_NOT_READY'),
  )
  record('inline_or_ineligible_upload_cannot_enter_distributed_ingest')
  assert.throws(
    () => createCanonicalDistributedLargeMediaFinalizationSeed({
      ...candidate('oversized-reference'),
      uploadPurpose: 'reference_media',
      expectedSizeBytes: 251 * 1024 ** 3,
    }),
    isApiError('SOURCE_MEDIA_NOT_READY'),
  )
  record('reference_media_cannot_cross_its_250_gib_product_ceiling')
  const serializedSeed = JSON.stringify(seed)
  for (const forbiddenAuthority of [
    'approvedPlanSnapshotId',
    'approvedCreditReservationId',
    'customerPrice',
    'wallet',
  ]) {
    assert.equal(serializedSeed.includes(forbiddenAuthority), false)
  }
  record('pre_plan_seed_fabricates_no_approved_or_commercial_authority')

  const enqueue = enqueueRequest(seed, 'idem-main-enqueue-0001', baseTime)
  fixture.controls.failNextBeforeCommit('enqueue')
  await expectApiError(() => port.enqueue(enqueue), 'INTERNAL_ERROR')
  assert.equal(fixture.controls.inspect().revision, 0)
  assert.equal(fixture.controls.inspect().job, null)
  assert.equal(fixture.controls.inspect().idempotencyRecordCount, 0)
  record('enqueue_rollback_leaves_no_partial_state')
  const concurrentEnqueue = await Promise.all([port.enqueue(enqueue), port.enqueue(enqueue)])
  assert.deepEqual(
    concurrentEnqueue.map((result) => result.idempotencyStatus).sort(),
    ['exact_replay', 'inserted'],
  )
  assert.deepEqual(concurrentEnqueue[0]?.response, concurrentEnqueue[1]?.response)
  assert.equal(fixture.controls.inspect().revision, 1)
  record('concurrent_enqueue_serializes_to_one_exact_response')
  await expectApiError(
    () => port.enqueue(enqueueRequest(seed, 'idem-main-enqueue-0001', plus(baseTime, 1))),
    'IDEMPOTENCY_CONFLICT',
  )
  record('changed_request_under_same_idempotency_key_is_rejected')
  await expectApiError(
    () => port.enqueue({
      ...enqueue,
      approvedPlanSnapshotId: 'forbidden_snapshot',
    } as unknown as typeof enqueue),
    'VALIDATION_FAILED',
  )
  record('caller_cannot_add_approved_snapshot_authority')

  const claim = claimRequest(seed, 'idem-main-claim-a1-0001', plus(baseTime, 1_000))
  const { capacityAdmission: _capacity, ...claimWithoutCapacity } = claim
  void _capacity
  await expectApiError(
    () => port.claimAndStart(claimWithoutCapacity as typeof claim),
    'VALIDATION_FAILED',
  )
  assert.equal(fixture.controls.inspect().attempts.length, 0)
  record('missing_capacity_admission_starts_no_attempt')
  const insufficientCapacity = capacityAdmission(seed, seed.identity.expectedSizeBytes)
  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'idem-main-insufficient-capacity-0001',
      plus(baseTime, 1_000),
      { capacityAdmission: insufficientCapacity },
    )),
    'VALIDATION_FAILED',
  )
  assert.equal(fixture.controls.inspect().attempts.length, 0)
  record('insufficient_exact_capacity_starts_no_attempt')
  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'idem-main-wrong-controller-0001',
      plus(baseTime, 1_000),
      { controllerIdentityEvidenceHash: hash('wrong-controller') },
    )),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  assert.equal(fixture.controls.inspect().attempts.length, 0)
  record('wrong_controller_cannot_claim')
  fixture.controls.failNextBeforeCommit('claim_and_start')
  await expectApiError(() => port.claimAndStart(claim), 'INTERNAL_ERROR')
  assert.equal(fixture.controls.inspect().attempts.length, 0)
  assert.equal(fixture.controls.inspect().job?.attemptCount, 0)
  record('claim_start_cost_lease_rollback_is_atomic')
  const started = await port.claimAndStart(claim)
  const attemptOne = requiredAttempt(started.response)
  assert.equal(attemptOne.attemptNumber, 1)
  assert.equal(attemptOne.attemptStart.resumeOffsetBytes, 0)
  assert.equal(attemptOne.attemptStart.resumeCheckpointHash, null)
  assert.equal(attemptOne.attemptStart.approvedPlanSnapshotOrCreditReservationRequired, false)
  assert.equal(
    attemptOne.attemptStart.customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )
  record('claim_lease_and_internal_cost_start_share_one_transaction')
  record('pre_plan_attempt_contains_no_approval_or_customer_commercial_authority')
  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'idem-main-concurrent-claim-0001',
      plus(baseTime, 1_100),
    )),
    'IDEMPOTENCY_CONFLICT',
  )
  assert.equal(fixture.controls.inspect().attempts.length, 1)
  record('one_active_attempt_blocks_duplicate_claim')

  const progressOne = progressRequest({
    seed,
    attempt: attemptOne,
    key: 'idem-main-progress-a1-0001',
    phase: 'hashing',
    verifiedByteOffset: 8 * 1024 ** 2,
    at: plus(baseTime, 2_000),
  })
  const progressInserted = await port.recordProgress(progressOne)
  const progressReplay = await port.recordProgress(progressOne)
  assert.equal(progressReplay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(progressReplay.response, progressInserted.response)
  record('lost_progress_response_replays_exact_checkpoint')
  await expectApiError(
    () => port.recordProgress(progressRequest({
      seed,
      attempt: attemptOne,
      key: 'idem-main-progress-regress-0001',
      phase: 'hashing',
      verifiedByteOffset: 4 * 1024 ** 2,
      at: plus(baseTime, 2_500),
    })),
    'VALIDATION_FAILED',
  )
  record('byte_progress_regression_is_rejected')
  await expectApiError(
    () => port.recordProgress(progressRequest({
      seed,
      attempt: attemptOne,
      key: 'idem-main-progress-skip-0001',
      phase: 'probe_complete',
      verifiedByteOffset: seed.identity.expectedSizeBytes,
      at: plus(baseTime, 2_500),
    })),
    'VALIDATION_FAILED',
  )
  record('checkpoint_phase_skipping_is_rejected')
  await expectApiError(
    () => port.recordProgress(progressRequest({
      seed,
      attempt: attemptOne,
      key: 'idem-main-progress-wrong-worker-0001',
      phase: 'hashing',
      verifiedByteOffset: 16 * 1024 ** 2,
      at: plus(baseTime, 2_500),
      workerIdentityEvidenceHash: hash('wrong-worker'),
    })),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  record('wrong_worker_cannot_heartbeat_or_checkpoint')

  const failed = await port.reconcileFailure(failureRequest({
    seed,
    attempt: attemptOne,
    key: 'idem-main-failure-a1-0001',
    category: 'reeditpro_error_absorbed',
    at: plus(baseTime, 3_000),
  }))
  assert.equal(failed.response.job.state, 'retry_available')
  assert.equal(failed.response.job.latestDurableCheckpoint?.verifiedByteOffset, 8 * 1024 ** 2)
  assert.equal(failed.response.attempt?.terminal?.queueDisposition, 'retry_available')
  assert.equal(failed.response.attempt?.terminal?.automaticRetryStarted, false)
  assert.ok((failed.response.attempt?.terminal?.terminalCost.actualInternalCostMicros ?? 0) > 0)
  assert.equal(
    failed.response.attempt?.terminal?.terminalCost
      .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )
  record('failed_attempt_retains_internal_cost_and_durable_checkpoint')
  record('failure_exposes_retry_without_starting_it')
  const failedReplay = await port.reconcileFailure(failureRequest({
    seed,
    attempt: attemptOne,
    key: 'idem-main-failure-a1-0001',
    category: 'reeditpro_error_absorbed',
    at: plus(baseTime, 3_000),
  }))
  assert.equal(failedReplay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(failedReplay.response, failed.response)
  record('failed_terminal_lost_response_replays_exactly')

  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'idem-main-claim-wrong-generation-0001',
      plus(baseTime, 4_000),
      { sourceObjectIdentityEvidenceHash: hash('changed-generation') },
    )),
    'UPLOAD_SOURCE_MISMATCH',
  )
  assert.equal(fixture.controls.inspect().attempts.length, 1)
  record('retry_requires_same_generation_bound_source_identity')
  const secondStart = await port.claimAndStart(claimRequest(
    seed,
    'idem-main-claim-a2-0001',
    plus(baseTime, 4_000),
  ))
  const attemptTwo = requiredAttempt(secondStart.response)
  assert.equal(attemptTwo.attemptNumber, 2)
  assert.equal(attemptTwo.attemptStart.resumeOffsetBytes, 8 * 1024 ** 2)
  assert.equal(
    attemptTwo.attemptStart.resumeCheckpointHash,
    failed.response.job.latestDurableCheckpoint?.checkpointHash,
  )
  record('new_attempt_resumes_exact_durable_byte_checkpoint')

  const hashComplete = await port.recordProgress(progressRequest({
    seed,
    attempt: attemptTwo,
    key: 'idem-main-hash-complete-a2-0001',
    phase: 'hash_complete',
    verifiedByteOffset: seed.identity.expectedSizeBytes,
    at: plus(baseTime, 5_000),
  }))
  await expectApiError(
    () => port.reconcileCompletion(completionRequest({
      seed,
      attempt: requiredAttempt(hashComplete.response),
      key: 'idem-main-premature-completion-0001',
      at: plus(baseTime, 5_500),
    })),
    'JOB_DEPENDENCY_NOT_READY',
  )
  record('completion_requires_probe_and_canonical_commit_checkpoint')
  const probeComplete = await port.recordProgress(progressRequest({
    seed,
    attempt: attemptTwo,
    key: 'idem-main-probe-complete-a2-0001',
    phase: 'probe_complete',
    verifiedByteOffset: seed.identity.expectedSizeBytes,
    at: plus(baseTime, 6_000),
  }))
  const commitReady = await port.recordProgress(progressRequest({
    seed,
    attempt: requiredAttempt(probeComplete.response),
    key: 'idem-main-commit-ready-a2-0001',
    phase: 'canonical_commit_ready',
    verifiedByteOffset: seed.identity.expectedSizeBytes,
    at: plus(baseTime, 7_000),
  }))
  const finalAttempt = requiredAttempt(commitReady.response)
  await expectApiError(
    () => port.reconcileCompletion(completionRequest({
      seed,
      attempt: finalAttempt,
      key: 'idem-main-wrong-generation-completion-0001',
      at: plus(baseTime, 7_500),
      generationIdentityHash: hash('wrong-completion-generation'),
    })),
    'JOB_DEPENDENCY_NOT_READY',
  )
  record('completion_cannot_change_generation_bound_source_identity')
  const completion = completionRequest({
    seed,
    attempt: finalAttempt,
    key: 'idem-main-completion-a2-0001',
    at: plus(baseTime, 8_000),
  })
  const competingFailure = failureRequest({
    seed,
    attempt: finalAttempt,
    key: 'idem-main-competing-failure-a2-0001',
    category: 'unknown',
    at: plus(baseTime, 8_000),
  })
  const terminalRace = await Promise.allSettled([
    port.reconcileCompletion(completion),
    port.reconcileFailure(competingFailure),
  ])
  assert.equal(terminalRace.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(terminalRace.filter((result) => result.status === 'rejected').length, 1)
  const completionResult = terminalRace[0]
  assert.equal(completionResult.status, 'fulfilled')
  const completed = (completionResult as PromiseFulfilledResult<{
    idempotencyStatus: 'inserted' | 'exact_replay'
    response: CanonicalDistributedMediaIngestMutationResponse
  }>).value
  assert.equal(completed.response.job.state, 'completed')
  assert.equal(completed.response.attempt?.terminal?.completionResult?.sizeBytes, seed.identity.expectedSizeBytes)
  assert.equal(completed.response.attempt?.terminal?.completionResult?.privateCreateOnlyReadbackVerified, true)
  assert.equal(completed.response.attempt?.terminal?.completionResult?.rawPathSignedUrlOrProviderUrlPersisted, false)
  assert.equal(completed.response.attempt?.terminal?.terminalCost.invoiceReconciled, false)
  record('completion_failure_race_commits_one_terminal_outcome')
  record('completion_binds_private_create_only_source_readback')
  record('successful_attempt_retains_separate_internal_infrastructure_cost')
  const completionReplay = await port.reconcileCompletion(completion)
  assert.equal(completionReplay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(completionReplay.response, completed.response)
  record('completion_lost_response_replays_exactly')

  await verifyTimeoutLifecycle(seed, baseTime, record)
  await verifyCancellationLifecycle(seed, baseTime, record)
  await verifyFreshAdapterRecovery(baseTime, record)
  await verifyTerminalSourceFailure(baseTime, record)

  const inspection = fixture.controls.inspect()
  assert.equal(inspection.persistedPlaintextIdempotencyKeyCount, 0)
  assert.equal(inspection.persistedPlaintextLeaseCredentialCount, 0)
  assert.equal(inspection.persistedRawPathSignedUrlProviderUrlOrCredentialCount, 0)
  assert.equal(inspection.approvedSnapshotOrCreditReservationRecordCount, 0)
  assert.equal(inspection.customerCommercialAuthorityRecordCount, 0)
  assert.ok(inspection.idempotencyKeyHashes.every((value) => /^[a-f0-9]{64}$/u.test(value)))
  record('fixture_persists_hash_only_idempotency_and_no_credentials_or_paths')
  record('fixture_contains_no_approved_package_or_customer_commercial_records')

  const readiness = canonicalDistributedLargeMediaFinalizationReadiness()
  assert.equal(readiness.sourceContractReady, true)
  assert.equal(readiness.productionRuntimeEnabled, false)
  assert.equal(readiness.hostedUploadsAboveInlineCeilingAllowed, false)
  assert.equal(readiness.productionReady, false)
  record('source_contract_does_not_unlock_hosted_large_uploads')
  const descriptor = port.descriptor
  assert.equal(descriptor.databaseBackend, 'none')
  assert.equal(descriptor.distributedDatabaseTransactionVerified, false)
  assert.equal(descriptor.multiReplicaDurabilityVerified, false)
  assert.equal(descriptor.cloudDispatchVerified, false)
  assert.equal(descriptor.liveGcsObjectBytesRead, false)
  record('database_cloud_dispatch_and_live_gcs_gates_remain_false')

  const payload = {
    schemaVersion: 'canonical-distributed-media-ingest-conformance-v1' as const,
    source: 'database_neutral_pre_plan_media_ingest_contract_fixture' as const,
    adapterId: descriptor.adapterId,
    adapterDescriptorHash: descriptor.descriptorHash,
    seedHash: seed.seedHash,
    readinessHash: readiness.readinessHash,
    checkCount: checks.length,
    checks,
    prePlanTechnicalIngestAuthorityVerified: true as const,
    approvedPackageAuthorityReusedOrFabricated: false as const,
    serializableClaimAndReplayVerified: true as const,
    capacityBeforeAttemptVerified: true as const,
    generationIdentityRetryBindingVerified: true as const,
    monotonicDurableCheckpointAndResumeVerified: true as const,
    freshAdapterRecoveryVerified: true as const,
    leaseLossAndTimeoutReconciliationVerified: true as const,
    completionFailureTimeoutExclusivityVerified: true as const,
    attemptInternalCostRetentionVerified: true as const,
    cancellationVerified: true as const,
    customerCommercialAuthorityIncluded: false as const,
    automaticRetryStarted: false as const,
    databaseBackendUsed: false as const,
    distributedDatabaseTransactionVerified: false as const,
    multiReplicaDurabilityVerified: false as const,
    cloudDispatchVerified: false as const,
    liveGcsObjectBytesRead: false as const,
    hostedUploadsAboveInlineCeilingAllowed: false as const,
    productionAuthority: false as const,
  }
  const evidence = Object.freeze(
    canonicalDistributedMediaIngestConformanceEvidenceSchema.parse({
      ...payload,
      evidenceHash: sha256AuthorityValue(payload),
    }),
  )
  evidenceBrands.add(evidence)
  return evidence
}

async function verifyFreshAdapterRecovery(
  baseTime: string,
  record: (check: string) => void,
): Promise<void> {
  const seed = createCanonicalDistributedLargeMediaFinalizationSeed(candidate('restart'))
  const firstFixture = createInMemoryCanonicalDistributedMediaIngestFixture(seed)
  const firstPort = createCanonicalDistributedMediaIngestStatePort(firstFixture.adapter)
  await firstPort.enqueue(enqueueRequest(seed, 'idem-restart-enqueue-0001', baseTime))
  const started = await firstPort.claimAndStart(claimRequest(
    seed,
    'idem-restart-claim-a1-0001',
    plus(baseTime, 1_000),
  ))
  const attempt = requiredAttempt(started.response)
  await firstPort.recordProgress(progressRequest({
    seed,
    attempt,
    key: 'idem-restart-progress-a1-0001',
    phase: 'hashing',
    verifiedByteOffset: 12 * 1024 ** 2,
    at: plus(baseTime, 2_000),
  }))
  const failure = failureRequest({
    seed,
    attempt,
    key: 'idem-restart-failure-a1-0001',
    category: 'unknown',
    at: plus(baseTime, 3_000),
  })
  const failed = await firstPort.reconcileFailure(failure)
  const recoverySnapshot = firstFixture.controls.captureRecoverySnapshot()
  const tampered = structuredClone(recoverySnapshot)
  tampered.state.revision += 1
  assert.throws(
    () => createInMemoryCanonicalDistributedMediaIngestFixture(seed, tampered),
    isApiError('IDEMPOTENCY_ATOMICITY_REQUIRED'),
  )
  record('tampered_restart_snapshot_is_rejected')
  const nestedTamper = structuredClone(recoverySnapshot)
  const mutationRecord = Object.values(nestedTamper.state.idempotency)
    .find((recordValue) => recordValue.operation !== 'finalize_expired_attempt')
  assert.ok(mutationRecord)
  if ('transaction' in mutationRecord.response && mutationRecord.response.transaction) {
    mutationRecord.response.transaction.auditEventHash = hash('tampered-nested-audit')
  }
  const { snapshotHash: _snapshotHash, ...nestedPayload } = nestedTamper
  void _snapshotHash
  nestedTamper.snapshotHash = sha256AuthorityValue(nestedPayload)
  assert.throws(
    () => createInMemoryCanonicalDistributedMediaIngestFixture(seed, nestedTamper),
    isApiError('IDEMPOTENCY_ATOMICITY_REQUIRED'),
  )
  record('recomputed_outer_snapshot_cannot_hide_nested_response_tamper')

  const restartedFixture = createInMemoryCanonicalDistributedMediaIngestFixture(
    seed,
    recoverySnapshot,
  )
  const restartedPort = createCanonicalDistributedMediaIngestStatePort(restartedFixture.adapter)
  const replay = await restartedPort.reconcileFailure(failure)
  assert.equal(replay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(replay.response, failed.response)
  const resumed = await restartedPort.claimAndStart(claimRequest(
    seed,
    'idem-restart-claim-a2-0001',
    plus(baseTime, 4_000),
  ))
  assert.equal(requiredAttempt(resumed.response).attemptStart.resumeOffsetBytes, 12 * 1024 ** 2)
  assert.equal(restartedFixture.controls.inspect().attempts.length, 2)
  record('fresh_adapter_restores_exact_replay_and_checkpoint_resume')
}

async function verifyTerminalSourceFailure(
  baseTime: string,
  record: (check: string) => void,
): Promise<void> {
  const seed = createCanonicalDistributedLargeMediaFinalizationSeed(candidate('source-changed'))
  const fixture = createInMemoryCanonicalDistributedMediaIngestFixture(seed)
  const port = createCanonicalDistributedMediaIngestStatePort(fixture.adapter)
  await port.enqueue(enqueueRequest(seed, 'idem-source-changed-enqueue-0001', baseTime))
  const started = await port.claimAndStart(claimRequest(
    seed,
    'idem-source-changed-claim-0001',
    plus(baseTime, 1_000),
  ))
  const terminal = await port.reconcileFailure(failureRequest({
    seed,
    attempt: requiredAttempt(started.response),
    key: 'idem-source-changed-terminal-0001',
    category: 'source_changed',
    at: plus(baseTime, 2_000),
  }))
  assert.equal(terminal.response.job.state, 'failed_terminal')
  assert.equal(terminal.response.job.remainingAttempts, 2)
  assert.equal(
    terminal.response.attempt?.terminal?.queueDisposition,
    'terminal_source_or_validation_failure',
  )
  assert.equal(
    terminal.response.attempt?.terminal?.retryDisposition,
    'fresh_upload_or_manual_review_required',
  )
  record('source_identity_failure_is_terminal_without_false_attempt_exhaustion')
}

export function assertCanonicalDistributedMediaIngestConformanceEvidence(
  input: unknown,
): asserts input is CanonicalDistributedMediaIngestConformanceEvidence {
  if (!input || typeof input !== 'object' || !evidenceBrands.has(input)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Media-ingest conformance evidence is not process-branded.',
      503,
    )
  }
  const parsed = canonicalDistributedMediaIngestConformanceEvidenceSchema.parse(input)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Media-ingest conformance evidence checksum is invalid.',
      503,
    )
  }
}

async function verifyTimeoutLifecycle(
  baseSeed: CanonicalDistributedMediaIngestSeed,
  baseTime: string,
  record: (check: string) => void,
): Promise<void> {
  const seed = createCanonicalDistributedLargeMediaFinalizationSeed(candidate('timeout'))
  assert.notEqual(seed.seedHash, baseSeed.seedHash)
  const fixture = createInMemoryCanonicalDistributedMediaIngestFixture(seed)
  const port = createCanonicalDistributedMediaIngestStatePort(fixture.adapter)
  await port.enqueue(enqueueRequest(seed, 'idem-timeout-enqueue-0001', baseTime))
  const started = await port.claimAndStart(claimRequest(
    seed,
    'idem-timeout-claim-a1-0001',
    plus(baseTime, 1_000),
  ))
  const attempt = requiredAttempt(started.response)
  await port.recordProgress(progressRequest({
    seed,
    attempt,
    key: 'idem-timeout-progress-a1-0001',
    phase: 'hashing',
    verifiedByteOffset: 4 * 1024 ** 2,
    at: plus(baseTime, 2_000),
  }))
  const early = await port.finalizeExpiredAttempt(timeoutRequest(
    seed,
    'idem-timeout-early-0001',
    plus(baseTime, 60_000),
  ))
  assert.equal(early.response.expiredAttemptReconciled, false)
  assert.equal(early.response.transaction, null)
  record('pre_expiry_timeout_observation_is_non_mutating')
  const timeoutAt = plus(baseTime, 5 * 60_000 + 2_000)
  const timeout = timeoutRequest(seed, 'idem-timeout-finalize-0001', timeoutAt)
  fixture.controls.failNextBeforeCommit('finalize_expired_attempt')
  await expectApiError(() => port.finalizeExpiredAttempt(timeout), 'INTERNAL_ERROR')
  assert.equal(fixture.controls.inspect().activeAttemptId, attempt.attemptId)
  assert.equal(fixture.controls.inspect().attempts[0]?.terminal, null)
  record('timeout_rollback_leaves_active_attempt_intact')
  const timedOut = await port.finalizeExpiredAttempt(timeout)
  assert.equal(timedOut.response.expiredAttemptReconciled, true)
  assert.equal(timedOut.response.job.state, 'retry_available')
  assert.equal(timedOut.response.attempt?.state, 'timed_out')
  assert.equal(
    timedOut.response.attempt?.terminal?.terminalAt,
    timedOut.response.attempt?.leaseExpiresAt,
  )
  assert.equal(
    timedOut.response.attempt?.terminal?.terminalCost.finishedAt,
    timedOut.response.attempt?.leaseExpiresAt,
  )
  assert.equal(timedOut.response.job.latestDurableCheckpoint?.verifiedByteOffset, 4 * 1024 ** 2)
  const replay = await port.finalizeExpiredAttempt(timeout)
  assert.equal(replay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(replay.response, timedOut.response)
  record('expired_lease_retains_checkpoint_and_cost_at_exact_expiry')
  record('timeout_lost_response_replays_without_duplicate_terminal')
  await expectApiError(
    () => port.finalizeExpiredAttempt({
      ...timeoutRequest(seed, 'idem-timeout-caller-attempt-0001', plus(timeoutAt, 1_000)),
      attemptId: attempt.attemptId,
    } as unknown as ReturnType<typeof timeoutRequest>),
    'VALIDATION_FAILED',
  )
  record('timeout_observer_cannot_select_attempt')
}

async function verifyCancellationLifecycle(
  _baseSeed: CanonicalDistributedMediaIngestSeed,
  baseTime: string,
  record: (check: string) => void,
): Promise<void> {
  const queuedSeed = createCanonicalDistributedLargeMediaFinalizationSeed(candidate('cancel-queued'))
  const queuedFixture = createInMemoryCanonicalDistributedMediaIngestFixture(queuedSeed)
  const queuedPort = createCanonicalDistributedMediaIngestStatePort(queuedFixture.adapter)
  await queuedPort.enqueue(enqueueRequest(queuedSeed, 'idem-cancel-queued-enqueue-0001', baseTime))
  const queuedCancel = cancellationRequest(
    queuedSeed,
    'idem-cancel-queued-0001',
    plus(baseTime, 1_000),
  )
  const cancelled = await queuedPort.requestCancellation(queuedCancel)
  assert.equal(cancelled.response.job.state, 'cancelled')
  assert.equal(cancelled.response.attempt, null)
  assert.equal(queuedFixture.controls.inspect().attempts.length, 0)
  const cancelReplay = await queuedPort.requestCancellation(queuedCancel)
  assert.equal(cancelReplay.idempotencyStatus, 'exact_replay')
  record('queued_cancellation_starts_no_attempt_and_replays_exactly')

  const runningSeed = createCanonicalDistributedLargeMediaFinalizationSeed(candidate('cancel-running'))
  const runningFixture = createInMemoryCanonicalDistributedMediaIngestFixture(runningSeed)
  const runningPort = createCanonicalDistributedMediaIngestStatePort(runningFixture.adapter)
  await runningPort.enqueue(enqueueRequest(runningSeed, 'idem-cancel-running-enqueue-0001', baseTime))
  const started = await runningPort.claimAndStart(claimRequest(
    runningSeed,
    'idem-cancel-running-claim-0001',
    plus(baseTime, 1_000),
  ))
  const attempt = requiredAttempt(started.response)
  const requested = await runningPort.requestCancellation(cancellationRequest(
    runningSeed,
    'idem-cancel-running-request-0001',
    plus(baseTime, 2_000),
  ))
  assert.equal(requested.response.job.state, 'cancellation_requested')
  assert.equal(requested.response.attempt?.state, 'cancellation_requested')
  await expectApiError(
    () => runningPort.reconcileCompletion(completionRequest({
      seed: runningSeed,
      attempt,
      key: 'idem-cancel-forbidden-completion-0001',
      at: plus(baseTime, 3_000),
    })),
    'IDEMPOTENCY_CONFLICT',
  )
  const terminal = await runningPort.reconcileFailure(failureRequest({
    seed: runningSeed,
    attempt,
    key: 'idem-cancel-running-terminal-0001',
    category: 'cancelled',
    at: plus(baseTime, 3_000),
  }))
  assert.equal(terminal.response.job.state, 'cancelled')
  assert.equal(terminal.response.attempt?.terminal?.queueDisposition, 'cancelled')
  assert.equal(terminal.response.attempt?.terminal?.terminalCost.outcome, 'failed')
  assert.equal(terminal.response.attempt?.terminal?.automaticRetryStarted, false)
  record('running_cancellation_requires_worker_terminal_and_retains_cost')
}

function candidate(suffix: string): UploadFinalizationCandidate {
  return {
    uploadIntentId: `upload_${suffix}`,
    ownerUserId: 'user_fixture',
    workspaceId: 'workspace_fixture',
    projectId: 'project_fixture',
    uploadPurpose: 'source_media',
    expectedSizeBytes: 64 * 1024 ** 2,
    status: 'signed',
    storageMode: 'gcs',
    backgroundFinalizationRequired: true,
    authorityFingerprint: hash(`upload-authority:${suffix}`),
  }
}

function enqueueRequest(seed: CanonicalDistributedMediaIngestSeed, key: string, at: string) {
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: controllerHash(seed),
    requestedAt: at,
  }
  return canonicalDistributedMediaIngestEnqueueRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('enqueue', payload),
  })
}

function claimRequest(
  seed: CanonicalDistributedMediaIngestSeed,
  key: string,
  at: string,
  overrides: Partial<{
    controllerIdentityEvidenceHash: string
    workerIdentityEvidenceHash: string
    workerReceiptHash: string
    capacityAdmission: ReturnType<typeof capacityAdmission>
    sourceObjectIdentityEvidenceHash: string
  }> = {},
) {
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: overrides.controllerIdentityEvidenceHash ?? controllerHash(seed),
    workerIdentityEvidenceHash: overrides.workerIdentityEvidenceHash ?? workerHash(seed),
    workerReceiptHash: overrides.workerReceiptHash ?? workerReceiptHash(seed),
    capacityAdmission: overrides.capacityAdmission ?? capacityAdmission(seed),
    sourceObjectIdentityEvidenceHash: overrides.sourceObjectIdentityEvidenceHash ?? sourceObjectHash(seed),
    acceptedAt: at,
  }
  return canonicalDistributedMediaIngestClaimRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('claim_and_start', payload),
  })
}

function capacityAdmission(
  seed: CanonicalDistributedMediaIngestSeed,
  observedAvailableBytes?: number,
) {
  const safetyReserveBytes = Math.max(
    seed.policy.minimumHeadroomBytes,
    Math.ceil(seed.identity.expectedSizeBytes * 0.1),
  )
  const requiredAvailableBytes = seed.identity.expectedSizeBytes + safetyReserveBytes
  const payload = {
    policyId: 'large_media_worker_capacity_v1' as const,
    expectedSourceBytes: seed.identity.expectedSizeBytes,
    sourceStagingBytes: seed.identity.expectedSizeBytes,
    safetyReserveBytes,
    requiredAvailableBytes,
    observedAvailableBytes: observedAvailableBytes ?? requiredAvailableBytes,
    reservationIdentityHash: hash(`capacity-reservation:${seed.seedHash}`),
    byteTraversalAuthorized: true as const,
  }
  return {
    ...payload,
    evidenceHash: sha256AuthorityValue({
      domain: 'canonical_distributed_media_ingest_capacity_admission_v1',
      ingestIdentityHash: seed.identity.identityHash,
      ...payload,
    }),
  }
}

function progressRequest(input: {
  seed: CanonicalDistributedMediaIngestSeed
  attempt: NonNullable<CanonicalDistributedMediaIngestMutationResponse['attempt']>
  key: string
  phase: 'hashing' | 'hash_complete' | 'probe_complete' | 'canonical_commit_ready'
  verifiedByteOffset: number
  at: string
  workerIdentityEvidenceHash?: string
}) {
  const payload = {
    jobId: input.seed.jobId,
    idempotencyKey: input.key,
    attemptId: input.attempt.attemptId,
    workerIdentityEvidenceHash: input.workerIdentityEvidenceHash ?? workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.seed),
    phase: input.phase,
    verifiedByteOffset: input.verifiedByteOffset,
    continuationStateObjectIdentityHash: hash(`continuation:${input.key}`),
    checkpointEvidenceHash: hash(`checkpoint:${input.key}`),
    heartbeatAt: input.at,
  }
  return canonicalDistributedMediaIngestProgressRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('record_progress', payload),
  })
}

function completionRequest(input: {
  seed: CanonicalDistributedMediaIngestSeed
  attempt: NonNullable<CanonicalDistributedMediaIngestMutationResponse['attempt']>
  key: string
  at: string
  generationIdentityHash?: string
}) {
  const payload = {
    jobId: input.seed.jobId,
    idempotencyKey: input.key,
    attemptId: input.attempt.attemptId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.seed),
    mediaAssetId: `media_${input.seed.identity.uploadIntentId}`,
    storageObjectRecordId: `storage_${input.seed.identity.uploadIntentId}`,
    sizeBytes: input.seed.identity.expectedSizeBytes,
    checksumSha256: hash(`bytes:${input.seed.seedHash}`),
    sourceMetadataHash: hash(`probe:${input.seed.seedHash}`),
    generationIdentityHash: input.generationIdentityHash ?? sourceObjectHash(input.seed),
    canonicalOutcomeHash: hash(`outcome:${input.seed.seedHash}`),
    completedAt: input.at,
  }
  return canonicalDistributedMediaIngestCompletionRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('reconcile_completion', payload),
  })
}

function failureRequest(input: {
  seed: CanonicalDistributedMediaIngestSeed
  attempt: NonNullable<CanonicalDistributedMediaIngestMutationResponse['attempt']>
  key: string
  category: 'source_changed' | 'validation_error' | 'reeditpro_error_absorbed' | 'cancelled' | 'unknown'
  at: string
}) {
  const payload = {
    jobId: input.seed.jobId,
    idempotencyKey: input.key,
    attemptId: input.attempt.attemptId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.seed),
    failureCategory: input.category,
    sanitizedFailureCode: input.category === 'cancelled'
      ? 'CANCELLED_BY_CONTROLLER'
      : 'INGEST_RUNTIME_FAILED',
    failureEvidenceHash: hash(`failure:${input.key}`),
    failedAt: input.at,
  }
  return canonicalDistributedMediaIngestFailureRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('reconcile_failure', payload),
  })
}

function cancellationRequest(seed: CanonicalDistributedMediaIngestSeed, key: string, at: string) {
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: controllerHash(seed),
    cancellationEvidenceHash: hash(`cancel:${key}`),
    requestedAt: at,
  }
  return canonicalDistributedMediaIngestCancellationRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('request_cancellation', payload),
  })
}

function timeoutRequest(seed: CanonicalDistributedMediaIngestSeed, key: string, at: string) {
  const payload = {
    jobId: seed.jobId,
    idempotencyKey: key,
    controllerIdentityEvidenceHash: controllerHash(seed),
    observedAt: at,
  }
  return canonicalDistributedMediaIngestTimeoutRequestSchema.parse({
    ...payload,
    requestHash: canonicalDistributedMediaIngestRequestHash('finalize_expired_attempt', payload),
  })
}

function requiredAttempt(response: CanonicalDistributedMediaIngestMutationResponse) {
  assert.ok(response.attempt)
  return response.attempt
}

function controllerHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`controller:${seed.identity.workspaceId}`)
}

function workerHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`worker:${seed.policy.workerClass}:${seed.policy.region}`)
}

function workerReceiptHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`worker-receipt:${seed.seedHash}`)
}

function sourceObjectHash(seed: CanonicalDistributedMediaIngestSeed): string {
  return hash(`source-object:${seed.identity.uploadAuthorityFingerprint}`)
}

function hash(value: string): string {
  return sha256AuthorityValue({ fixture: value })
}

function plus(value: string, milliseconds: number): string {
  return new Date(Date.parse(value) + milliseconds).toISOString()
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, isApiError(code))
}

function isApiError(code: string): (error: unknown) => boolean {
  return (error: unknown) => error instanceof ApiError && error.code === code
}
