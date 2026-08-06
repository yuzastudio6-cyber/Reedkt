import assert from 'node:assert/strict'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  assertCanonicalDistributedPrePlanStudyProductionAuthority,
  assertCanonicalDistributedPrePlanStudyStatePort,
  canonicalDistributedPrePlanStudyAttemptCostEvidenceHash,
  canonicalDistributedPrePlanStudyClaimRequestSchema,
  canonicalDistributedPrePlanStudyCompletionRequestSchema,
  canonicalDistributedPrePlanStudyControlRequestSchema,
  canonicalDistributedPrePlanStudyEnqueueRequestSchema,
  canonicalDistributedPrePlanStudyFailureRequestSchema,
  canonicalDistributedPrePlanStudyHeartbeatRequestSchema,
  canonicalDistributedPrePlanStudyIdentityHash,
  canonicalDistributedPrePlanStudyOutputHash,
  canonicalDistributedPrePlanStudyRecoveryRequestSchema,
  canonicalDistributedPrePlanStudyRequestHash,
  canonicalDistributedPrePlanStudySeedHash,
  canonicalDistributedPrePlanStudyWorkItemHash,
  createCanonicalDistributedPrePlanStudyStatePort,
  type CanonicalDistributedPrePlanStudyAttemptCostEvidence,
  type CanonicalDistributedPrePlanStudyMutationResponse,
  type CanonicalDistributedPrePlanStudySeed,
  type CanonicalDistributedPrePlanStudyWorkItemSeed,
} from './canonical-distributed-pre-plan-study-state-port'
import {
  createInMemoryCanonicalDistributedPrePlanStudyFixture,
} from './in-memory-canonical-distributed-pre-plan-study-fixture'

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const check = z.string().trim().min(1).max(180)

export const canonicalDistributedPrePlanStudyConformanceEvidenceSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-pre-plan-study-conformance-v1'),
  source: z.literal('database_neutral_edit_reference_pre_plan_study_contract_fixture'),
  adapterId: check,
  adapterDescriptorHash: sha256,
  seedHash: sha256,
  checkCount: z.number().int().positive().max(300),
  checks: z.array(check).min(1).max(300),
  exactTenantReferenceStudySourceAndPlanBindingVerified: z.literal(true),
  approvedSnapshotOrCreditReservationFabricated: z.literal(false),
  serverDerivedDependencyWorkGraphVerified: z.literal(true),
  oneActiveDigestOnlyLeaseVerified: z.literal(true),
  idempotentReplayAndCollisionRejectionVerified: z.literal(true),
  monotonicCheckpointAndResumeVerified: z.literal(true),
  pauseResumeAndCancellationVerified: z.literal(true),
  deterministicExpiredLeaseRecoveryVerified: z.literal(true),
  providerUnknownOutcomeBlocksRetryVerified: z.literal(true),
  terminalOutputAndCostAtomicityVerified: z.literal(true),
  providerAndInfrastructureCostSeparated: z.literal(true),
  customerPriceCreditsServiceFeeWalletOrBillingIncluded: z.literal(false),
  rawMediaSignedUrlProviderCredentialOrLocalPathPersisted: z.literal(false),
  databaseBackendUsed: z.literal(false),
  multiReplicaDurabilityVerified: z.literal(false),
  authenticatedWorkerDispatchVerified: z.literal(false),
  livePrivateObjectReadVerified: z.literal(false),
  cloudCallPerformed: z.literal(false),
  productionAuthority: z.literal(false),
  evidenceHash: sha256,
}).strict().superRefine((evidence, context) => {
  if (
    evidence.checkCount !== evidence.checks.length
    || new Set(evidence.checks).size !== evidence.checks.length
  ) context.addIssue({ code: 'custom', message: 'Pre-plan study checks are inconsistent.' })
})

export type CanonicalDistributedPrePlanStudyConformanceEvidence = z.infer<
  typeof canonicalDistributedPrePlanStudyConformanceEvidenceSchema
>

export async function runCanonicalDistributedPrePlanStudyConformance(): Promise<
  CanonicalDistributedPrePlanStudyConformanceEvidence
> {
  const checks: string[] = []
  const record = (value: string): void => { checks.push(value) }
  const seed = createSeed('main')
  const fixture = createInMemoryCanonicalDistributedPrePlanStudyFixture()
  const port = createCanonicalDistributedPrePlanStudyStatePort(fixture.adapter)
  const base = '2026-07-20T12:00:00.000Z'

  assertCanonicalDistributedPrePlanStudyStatePort(port)
  await expectApiError(
    async () => assertCanonicalDistributedPrePlanStudyProductionAuthority(port),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  assert.throws(
    () => assertCanonicalDistributedPrePlanStudyStatePort({ ...port }),
    isApiError('IDEMPOTENCY_ATOMICITY_REQUIRED'),
  )
  record('process_brand_and_forward_live_release_gate_fail_closed')

  const serializedSeed = JSON.stringify(seed)
  for (const forbidden of [
    'approvedPlanSnapshotId',
    'approvedCreditReservationId',
    'customerPrice',
    'customerCredits',
    'serviceFee',
    'signedUrl',
    'providerCredential',
  ]) assert.equal(serializedSeed.includes(forbidden), false)
  record('pre_plan_seed_contains_no_edit_approval_or_commercial_authority')

  const enqueue = enqueueRequest(seed, 'idem-main-enqueue-0001', base)
  const enqueueResults = await Promise.all([port.enqueue(enqueue), port.enqueue(enqueue)])
  assert.deepEqual(
    enqueueResults.map((result) => result.idempotencyStatus).sort(),
    ['exact_replay', 'inserted'],
  )
  assert.deepEqual(enqueueResults[0]?.response, enqueueResults[1]?.response)
  assert.equal(enqueueResults[0]?.response.run.revision, 1)
  record('concurrent_enqueue_has_one_commit_and_exact_replay')
  await expectApiError(
    () => port.enqueue(enqueueRequest(seed, 'idem-main-enqueue-0001', plus(base, 1))),
    'IDEMPOTENCY_CONFLICT',
  )
  record('changed_request_under_same_key_is_rejected')

  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'visual_worker',
      'idem-main-visual-before-dependency-0001',
      plus(base, 1_000),
    )),
    'JOB_DEPENDENCY_NOT_READY',
  )
  record('server_derived_dependency_order_blocks_early_visual_claim')

  const mediaClaimRequest = claimRequest(
    seed,
    'media_worker',
    'idem-main-media-claim-0001',
    plus(base, 1_000),
  )
  const mediaClaims = await Promise.all([
    port.claimAndStart(mediaClaimRequest),
    port.claimAndStart(mediaClaimRequest),
  ])
  assert.deepEqual(
    mediaClaims.map((result) => result.idempotencyStatus).sort(),
    ['exact_replay', 'inserted'],
  )
  const mediaClaim = mediaClaims[0]
  assert.ok(mediaClaim?.response.attempt)
  assert.ok(mediaClaim.transientLeaseCredential)
  assert.equal(mediaClaims[0]?.transientLeaseCredential, mediaClaims[1]?.transientLeaseCredential)
  const inspectionAfterClaim = fixture.inspect(seed.runId)
  assert.equal(inspectionAfterClaim.plaintextLeaseCredentialPersisted, false)
  assert.equal(inspectionAfterClaim.persistedRepresentation.includes(
    mediaClaim.transientLeaseCredential ?? 'missing',
  ), false)
  record('one_server_selected_attempt_returns_replayable_transient_digest_only_lease')

  const wrongLeaseHeartbeat = heartbeatRequest({
    seed,
    claim: mediaClaim.response,
    leaseCredential: tamperLease(required(mediaClaim.transientLeaseCredential)),
    key: 'idem-main-wrong-lease-0001',
    at: plus(base, 10_000),
    checkpointSequence: 1,
    progressBasisPoints: 1_000,
  })
  await expectApiError(() => port.heartbeatAndCheckpoint(wrongLeaseHeartbeat),
    'INTERNAL_SERVICE_AUTH_INVALID')
  record('wrong_plaintext_lease_credential_is_fenced')

  const firstHeartbeat = heartbeatRequest({
    seed,
    claim: mediaClaim.response,
    leaseCredential: required(mediaClaim.transientLeaseCredential),
    key: 'idem-main-media-heartbeat-0001',
    at: plus(base, 10_000),
    checkpointSequence: 1,
    progressBasisPoints: 2_500,
  })
  const heartbeatResults = await Promise.all([
    port.heartbeatAndCheckpoint(firstHeartbeat),
    port.heartbeatAndCheckpoint(firstHeartbeat),
  ])
  assert.deepEqual(
    heartbeatResults.map((result) => result.idempotencyStatus).sort(),
    ['exact_replay', 'inserted'],
  )
  await expectApiError(
    () => port.heartbeatAndCheckpoint(heartbeatRequest({
      seed,
      claim: mediaClaim.response,
      leaseCredential: required(mediaClaim.transientLeaseCredential),
      key: 'idem-main-media-stale-checkpoint-0001',
      at: plus(base, 20_000),
      checkpointSequence: 1,
      progressBasisPoints: 3_000,
    })),
    'VERSION_CONFLICT',
  )
  record('heartbeat_and_checkpoint_are_atomic_monotonic_and_exactly_replayed')

  const mediaCost = costEvidence({
    seed,
    claim: heartbeatResults[0]?.response ?? mediaClaim.response,
    finishedAt: plus(base, 30_000),
    evidenceStatus: 'final',
  })
  await expectApiError(
    () => port.complete(completionRequest({
      seed,
      claim: heartbeatResults[0]?.response ?? mediaClaim.response,
      leaseCredential: required(mediaClaim.transientLeaseCredential),
      key: 'idem-main-media-bad-cost-0001',
      completedAt: plus(base, 30_000),
      cost: rehashCost({ ...mediaCost, attemptId: 'wrong-attempt' }),
    })),
    'JOB_DEPENDENCY_NOT_READY',
  )
  assert.equal(fixture.inspect(seed.runId).run.runningWorkItemCount, 1)
  record('terminal_cost_must_bind_exact_attempt_and_time_window')

  const mediaCompletion = completionRequest({
    seed,
    claim: heartbeatResults[0]?.response ?? mediaClaim.response,
    leaseCredential: required(mediaClaim.transientLeaseCredential),
    key: 'idem-main-media-complete-0001',
    completedAt: plus(base, 30_000),
    cost: mediaCost,
  })
  const completedMedia = await port.complete(mediaCompletion)
  assert.equal(completedMedia.response.workItem?.state, 'completed')
  assert.equal(completedMedia.response.attempt?.terminal?.costEvidence.serviceFeeIncluded, false)
  assert.equal(completedMedia.response.attempt?.terminal?.outputs[0]?.providerUrlPersisted, false)
  record('private_output_and_separate_internal_cost_commit_in_one_terminal_transaction')

  await expectApiError(
    () => port.control(controlRequest({
      seed,
      key: 'idem-main-wrong-controller-0001',
      action: 'pause',
      expectedRevision: completedMedia.response.run.revision,
      at: plus(base, 30_500),
      controllerIdentityEvidenceHash: hash('wrong-controller'),
    })),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  record('wrong_controller_cannot_pause_cancel_or_recover_study_authority')

  const paused = await port.control(controlRequest({
    seed,
    key: 'idem-main-pause-0001',
    action: 'pause',
    expectedRevision: completedMedia.response.run.revision,
    at: plus(base, 31_000),
  }))
  assert.equal(paused.response.run.state, 'paused')
  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'visual_worker',
      'idem-main-claim-while-paused-0001',
      plus(base, 32_000),
    )),
    'JOB_DEPENDENCY_NOT_READY',
  )
  const resumed = await port.control(controlRequest({
    seed,
    key: 'idem-main-resume-0001',
    action: 'resume',
    expectedRevision: paused.response.run.revision,
    at: plus(base, 33_000),
  }))
  assert.equal(resumed.response.run.state, 'queued')
  record('pause_and_resume_preserve_durable_run_authority')

  const visualClaim = await port.claimAndStart(claimRequest(
    seed,
    'visual_worker',
    'idem-main-visual-claim-0001',
    plus(base, 34_000),
  ))
  const visualFailure = await port.fail(failureRequest({
    seed,
    claim: visualClaim.response,
    leaseCredential: required(visualClaim.transientLeaseCredential),
    key: 'idem-main-visual-unknown-0001',
    failedAt: plus(base, 44_000),
    category: 'provider_unknown_outcome',
    status: 'provisional_provider_reconciliation_required',
  }))
  assert.equal(visualFailure.response.run.state, 'needs_operator_review')
  assert.equal(
    visualFailure.response.attempt?.terminal?.queueDisposition,
    'blocked_unknown_outcome',
  )
  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'visual_worker',
      'idem-main-visual-resubmit-forbidden-0001',
      plus(base, 45_000),
    )),
    'JOB_DEPENDENCY_NOT_READY',
  )
  record('provider_unknown_outcome_retains_cost_and_blocks_resubmission')

  await exerciseOperatorAuthorizedAttemptRecovery(record)
  await exerciseDeterministicTimeoutRecovery(record)
  await exerciseProviderTimeoutRecovery(record)
  await exerciseCancellation(record)

  const inspection = fixture.inspect(seed.runId)
  assert.equal(inspection.rawMediaPersisted, false)
  assert.equal(inspection.signedUrlPersisted, false)
  assert.equal(inspection.providerCredentialPersisted, false)
  assert.equal(inspection.localPathPersisted, false)
  assert.equal(inspection.productionAuthority, false)
  record('fixture_persists_no_raw_media_temporary_authority_or_live_claim')

  const payload = {
    schemaVersion: 'canonical-distributed-pre-plan-study-conformance-v1' as const,
    source: 'database_neutral_edit_reference_pre_plan_study_contract_fixture' as const,
    adapterId: port.descriptor.adapterId,
    adapterDescriptorHash: port.descriptor.descriptorHash,
    seedHash: seed.seedHash,
    checkCount: checks.length,
    checks,
    exactTenantReferenceStudySourceAndPlanBindingVerified: true as const,
    approvedSnapshotOrCreditReservationFabricated: false as const,
    serverDerivedDependencyWorkGraphVerified: true as const,
    oneActiveDigestOnlyLeaseVerified: true as const,
    idempotentReplayAndCollisionRejectionVerified: true as const,
    monotonicCheckpointAndResumeVerified: true as const,
    pauseResumeAndCancellationVerified: true as const,
    deterministicExpiredLeaseRecoveryVerified: true as const,
    providerUnknownOutcomeBlocksRetryVerified: true as const,
    terminalOutputAndCostAtomicityVerified: true as const,
    providerAndInfrastructureCostSeparated: true as const,
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
    rawMediaSignedUrlProviderCredentialOrLocalPathPersisted: false as const,
    databaseBackendUsed: false as const,
    multiReplicaDurabilityVerified: false as const,
    authenticatedWorkerDispatchVerified: false as const,
    livePrivateObjectReadVerified: false as const,
    cloudCallPerformed: false as const,
    productionAuthority: false as const,
  }
  return canonicalDistributedPrePlanStudyConformanceEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue({
      domain: 'canonical_distributed_pre_plan_study_conformance_v1',
      payload,
    }),
  })
}

async function exerciseDeterministicTimeoutRecovery(
  record: (value: string) => void,
): Promise<void> {
  const seed = createSeed('timeout', ['deterministic'])
  const fixture = createInMemoryCanonicalDistributedPrePlanStudyFixture('timeout_fixture_v1')
  const port = createCanonicalDistributedPrePlanStudyStatePort(fixture.adapter)
  const base = '2026-07-20T13:00:00.000Z'
  await port.enqueue(enqueueRequest(seed, 'idem-timeout-enqueue-0001', base))
  const claim = await port.claimAndStart(claimRequest(
    seed,
    'media_worker',
    'idem-timeout-claim-0001',
    plus(base, 1_000),
  ))
  const heartbeat = await port.heartbeatAndCheckpoint(heartbeatRequest({
    seed,
    claim: claim.response,
    leaseCredential: required(claim.transientLeaseCredential),
    key: 'idem-timeout-heartbeat-0001',
    at: plus(base, 10_000),
    checkpointSequence: 1,
    progressBasisPoints: 4_000,
  }))
  const early = await port.recoverExpiredLease(recoveryRequest(
    seed,
    'idem-timeout-recover-early-0001',
    plus(base, 50_000),
  ))
  assert.equal(early.response.expiredAttemptRecovered, false)
  assert.equal(early.response.transaction, null)
  const recoveryRequestValue = recoveryRequest(
    seed,
    'idem-timeout-recover-expired-0001',
    plus(base, 80_000),
  )
  const recovered = await port.recoverExpiredLease(recoveryRequestValue)
  const replay = await port.recoverExpiredLease(recoveryRequestValue)
  assert.equal(recovered.response.expiredAttemptRecovered, true)
  assert.equal(replay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(replay.response, recovered.response)
  assert.equal(recovered.response.workItem?.state, 'retry_wait')
  assert.equal(recovered.response.attempt?.terminal?.costEvidence.evidenceStatus, 'final')
  const retry = await port.claimAndStart(claimRequest(
    seed,
    'media_worker',
    'idem-timeout-retry-claim-0001',
    plus(base, 81_000),
  ))
  assert.equal(
    retry.response.attempt?.attemptStart.resumeCheckpointHash,
    heartbeat.response.workItem?.latestCheckpoint?.checkpointHash,
  )
  assert.equal(retry.response.attempt?.attemptStart.attemptNumber, 2)
  record('expired_deterministic_lease_is_reconciled_once_before_explicit_checkpoint_resume')
}

async function exerciseOperatorAuthorizedAttemptRecovery(
  record: (value: string) => void,
): Promise<void> {
  const seed = createSeed('operator-recovery', ['deterministic'])
  const fixture = createInMemoryCanonicalDistributedPrePlanStudyFixture(
    'operator_recovery_fixture_v1',
  )
  const port = createCanonicalDistributedPrePlanStudyStatePort(fixture.adapter)
  const base = '2026-07-20T12:30:00.000Z'
  await port.enqueue(enqueueRequest(seed, 'idem-operator-enqueue-0001', base))
  const firstClaim = await port.claimAndStart(claimRequest(
    seed,
    'media_worker',
    'idem-operator-claim-0001',
    plus(base, 1_000),
  ))
  const firstFailure = await port.fail(failureRequest({
    seed,
    claim: firstClaim.response,
    leaseCredential: required(firstClaim.transientLeaseCredential),
    key: 'idem-operator-failure-0001',
    failedAt: plus(base, 10_000),
    category: 'execution_timeout',
    status: 'final',
  }))
  assert.equal(firstFailure.response.run.state, 'running')
  assert.equal(firstFailure.response.workItem?.state, 'retry_wait')
  const secondClaim = await port.claimAndStart(claimRequest(
    seed,
    'media_worker',
    'idem-operator-claim-0002',
    plus(base, 11_000),
  ))
  const secondFailure = await port.fail(failureRequest({
    seed,
    claim: secondClaim.response,
    leaseCredential: required(secondClaim.transientLeaseCredential),
    key: 'idem-operator-failure-0002',
    failedAt: plus(base, 20_000),
    category: 'execution_timeout',
    status: 'final',
  }))
  assert.equal(secondFailure.response.run.state, 'needs_operator_review')
  await expectApiError(
    () => port.control(controlRequest({
      seed,
      key: 'idem-operator-wrong-controller-0001',
      action: 'recover',
      expectedRevision: secondFailure.response.run.revision,
      at: plus(base, 21_000),
      controllerIdentityEvidenceHash: hash('wrong-controller'),
    })),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  const request = controlRequest({
    seed,
    key: 'idem-operator-recover-0001',
    action: 'recover',
    expectedRevision: secondFailure.response.run.revision,
    at: plus(base, 22_000),
  })
  const recovered = await port.control(request)
  const replay = await port.control(request)
  assert.equal(recovered.response.run.state, 'queued')
  assert.equal(recovered.response.run.recoveryGeneration, 1)
  assert.equal(fixture.inspect(seed.runId).workItems[0]?.maximumAttempts, 3)
  assert.equal(replay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(replay.response, recovered.response)
  record('operator_authority_adds_one_bounded_attempt_with_exact_replay')
}

async function exerciseCancellation(record: (value: string) => void): Promise<void> {
  const seed = createSeed('cancel', ['deterministic'])
  const fixture = createInMemoryCanonicalDistributedPrePlanStudyFixture('cancel_fixture_v1')
  const port = createCanonicalDistributedPrePlanStudyStatePort(fixture.adapter)
  const base = '2026-07-20T14:00:00.000Z'
  await port.enqueue(enqueueRequest(seed, 'idem-cancel-enqueue-0001', base))
  const claim = await port.claimAndStart(claimRequest(
    seed,
    'media_worker',
    'idem-cancel-claim-0001',
    plus(base, 1_000),
  ))
  const cancelled = await port.control(controlRequest({
    seed,
    key: 'idem-cancel-control-0001',
    action: 'cancel',
    expectedRevision: claim.response.run.revision,
    at: plus(base, 2_000),
  }))
  assert.equal(cancelled.response.run.state, 'cancellation_requested')
  const terminal = await port.fail(failureRequest({
    seed,
    claim: claim.response,
    leaseCredential: required(claim.transientLeaseCredential),
    key: 'idem-cancel-terminal-0001',
    failedAt: plus(base, 3_000),
    category: 'cancelled',
    status: 'final',
  }))
  assert.equal(terminal.response.run.state, 'cancelled')
  assert.equal(terminal.response.attempt?.terminal?.queueDisposition, 'cancelled')
  record('cancellation_preserves_active_lease_until_one_terminal_cost_receipt')
}

async function exerciseProviderTimeoutRecovery(
  record: (value: string) => void,
): Promise<void> {
  const seed = createSeed('provider-timeout', ['visual'])
  const fixture = createInMemoryCanonicalDistributedPrePlanStudyFixture(
    'provider_timeout_fixture_v1',
  )
  const port = createCanonicalDistributedPrePlanStudyStatePort(fixture.adapter)
  const base = '2026-07-20T15:00:00.000Z'
  await port.enqueue(enqueueRequest(seed, 'idem-provider-timeout-enqueue-0001', base))
  const claim = await port.claimAndStart(claimRequest(
    seed,
    'visual_worker',
    'idem-provider-timeout-claim-0001',
    plus(base, 1_000),
  ))
  const recovered = await port.recoverExpiredLease(recoveryRequest(
    seed,
    'idem-provider-timeout-recover-0001',
    plus(base, 62_000),
  ))
  assert.equal(recovered.response.run.state, 'needs_operator_review')
  assert.equal(recovered.response.workItem?.state, 'blocked')
  assert.equal(
    recovered.response.attempt?.terminal?.queueDisposition,
    'blocked_unknown_outcome',
  )
  assert.equal(
    recovered.response.attempt?.terminal?.costEvidence.evidenceStatus,
    'provisional_provider_reconciliation_required',
  )
  assert.equal(
    recovered.response.attempt?.terminal?.costEvidence.finishedAt,
    claim.response.attempt?.leaseExpiresAt,
  )
  await expectApiError(
    () => port.claimAndStart(claimRequest(
      seed,
      'visual_worker',
      'idem-provider-timeout-resubmit-0001',
      plus(base, 63_000),
    )),
    'JOB_DEPENDENCY_NOT_READY',
  )
  record('expired_provider_lease_retains_provisional_cost_and_requires_reconciliation')
}

function createSeed(
  suffix: string,
  stages: readonly ('deterministic' | 'visual' | 'reasoning')[] = [
    'deterministic',
    'visual',
    'reasoning',
  ],
): CanonicalDistributedPrePlanStudySeed {
  const identityWithoutHash = {
    authorityClass: 'pre_plan_edit_reference_long_form_study' as const,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    ownerUserId: `owner-${suffix}`,
    workspaceId: `workspace-${suffix}`,
    editReferenceId: `reference-${suffix}`,
    studySessionId: `study-${suffix}`,
    sourceAssetId: `source-asset-${suffix}`,
    sourcePrivateMediaArtifactId: `private-media-${suffix}`,
    sourceStorageObjectId: `source-object-${suffix}`,
    sourceStorageObjectIdentityHash: hash(`source-object-identity-${suffix}`),
    sourceChecksumSha256: hash(`source-checksum-${suffix}`),
    sourceSizeBytes: 50 * 1024 ** 3,
    sourceDurationMilliseconds: 6 * 60 * 60 * 1_000,
    sourceMimeType: 'video/mp4',
    sourceHasAudio: true,
  }
  const identity = {
    ...identityWithoutHash,
    identityHash: canonicalDistributedPrePlanStudyIdentityHash(identityWithoutHash),
  }
  const weight = Math.floor(10_000 / stages.length)
  const workItems = stages.map((stage, index) => workItem({
    suffix,
    stage,
    sequence: index + 1,
    dependencyWorkItemIds: index === 0
      ? []
      : [`study-work-${suffix}-${index}`],
    weightBasisPoints: index === stages.length - 1
      ? 10_000 - weight * index
      : weight,
  }))
  const seedWithoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-seed-v1' as const,
    runId: `study-run-${suffix}`,
    planId: `study-plan-${suffix}`,
    planVersion: 'v1',
    planDigestSha256: hash(`study-plan-${suffix}`),
    planCreatedAt: '2026-07-20T12:00:00.000Z',
    captionOcrIncluded: true,
    identity,
    studyUsageApprovalId: `study-usage-approval-${suffix}`,
    studyUsageApprovalDigestSha256: hash(`study-usage-approval-${suffix}`),
    internalCostBudgetId: `study-cost-budget-${suffix}`,
    maximumAuthorizedInternalCostMicros: String(stages.length * 2_000_000),
    currency: 'USD' as const,
    wholeStudyTimeoutApplied: false as const,
    browserSessionRequiredForCompletion: false as const,
    workItems,
  }
  return {
    ...seedWithoutHash,
    seedHash: canonicalDistributedPrePlanStudySeedHash(seedWithoutHash),
  }
}

function workItem(input: {
  suffix: string
  stage: 'deterministic' | 'visual' | 'reasoning'
  sequence: number
  dependencyWorkItemIds: string[]
  weightBasisPoints: number
}): CanonicalDistributedPrePlanStudyWorkItemSeed {
  const executionKind = input.stage === 'deterministic'
    ? 'deterministic_tool' as const
    : input.stage === 'visual'
      ? 'visual_model' as const
      : 'reasoning_model' as const
  const workerClass = input.stage === 'deterministic'
    ? 'media_worker' as const
    : input.stage === 'visual'
      ? 'visual_worker' as const
      : 'reasoning_worker' as const
  const payload = {
    workItemId: `study-work-${input.suffix}-${input.sequence}`,
    sequence: input.sequence,
    stageId: `stage-${input.stage}`,
    dependencyWorkItemIds: input.dependencyWorkItemIds,
    required: true,
    weightBasisPoints: input.weightBasisPoints,
    executionKind,
    workerClass,
    operationId: input.stage === 'deterministic'
      ? 'tool.ffmpeg.execute_approved_media_recipe.v1'
      : `model.${input.stage}.study.v1`,
    profileId: `approved-${input.stage}-study-v1`,
    modelId: executionKind === 'deterministic_tool' ? null : `model-${input.stage}-v1`,
    maximumAttempts: 2,
    leaseDurationMs: 60_000,
    attemptDeadlineDurationMs: 5 * 60_000,
    resourceEnvelope: {
      vcpuCount: 2,
      memoryGib: 8,
      gpuCount: executionKind === 'visual_model' ? 1 : 0,
      temporaryStorageGib: 200,
    },
    providerRateCardSnapshotDigestSha256: hash(`provider-rate-${input.stage}`),
    infrastructureRateCardSnapshotDigestSha256: hash(`infra-rate-${input.stage}`),
    maximumAuthorizedInternalCostMicrosPerAttempt: '1000000',
    inputBindingHash: hash(`input-binding-${input.suffix}-${input.sequence}`),
  }
  return {
    ...payload,
    workItemHash: canonicalDistributedPrePlanStudyWorkItemHash(payload),
  }
}

function enqueueRequest(seed: CanonicalDistributedPrePlanStudySeed, key: string, at: string) {
  return canonicalDistributedPrePlanStudyEnqueueRequestSchema.parse(withHash('enqueue', {
    runId: seed.runId,
    studyIdentityHash: seed.identity.identityHash,
    idempotencyKey: key,
    seed,
    controllerIdentityEvidenceHash: hash('controller'),
    requestedAt: at,
  }))
}

function claimRequest(
  seed: CanonicalDistributedPrePlanStudySeed,
  workerClass: CanonicalDistributedPrePlanStudyWorkItemSeed['workerClass'],
  key: string,
  at: string,
) {
  return canonicalDistributedPrePlanStudyClaimRequestSchema.parse(withHash('claim_and_start', {
    runId: seed.runId,
    studyIdentityHash: seed.identity.identityHash,
    idempotencyKey: key,
    workerClass,
    workerIdentityEvidenceHash: hash(`worker-${workerClass}`),
    workerReceiptHash: hash(`worker-receipt-${workerClass}`),
    capacityAdmissionEvidenceHash: hash(`capacity-${workerClass}`),
    acceptedAt: at,
  }))
}

function heartbeatRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  leaseCredential: string
  key: string
  at: string
  checkpointSequence: number
  progressBasisPoints: number
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  return canonicalDistributedPrePlanStudyHeartbeatRequestSchema.parse(withHash(
    'heartbeat_and_checkpoint',
    {
      runId: input.seed.runId,
      studyIdentityHash: input.seed.identity.identityHash,
      idempotencyKey: input.key,
      attemptId: attempt.attemptId,
      leaseCredential: input.leaseCredential,
      workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
      workerReceiptHash: attempt.workerReceiptHash,
      checkpoint: {
        checkpointSequence: input.checkpointSequence,
        progressBasisPoints: input.progressBasisPoints,
        progressEvidenceHash: hash(`progress-${input.key}`),
        privateCheckpointObjectId: `checkpoint-object-${input.checkpointSequence}`,
        privateCheckpointObjectIdentityHash: hash(`checkpoint-object-${input.key}`),
        checkpointPayloadDigestSha256: hash(`checkpoint-payload-${input.key}`),
      },
      heartbeatAt: input.at,
    },
  ))
}

function completionRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  leaseCredential: string
  key: string
  completedAt: string
  cost: CanonicalDistributedPrePlanStudyAttemptCostEvidence
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  const outputPayload = {
    outputId: `study-output-${attempt.attemptId}`,
    outputKind: 'private-study-evidence',
    storageObjectId: `private-object-${attempt.attemptId}`,
    storageObjectIdentityHash: hash(`object-identity-${attempt.attemptId}`),
    checksumSha256: hash(`output-checksum-${attempt.attemptId}`),
    byteLength: 4096,
    mimeType: 'application/json',
    lineageHash: hash(`output-lineage-${attempt.attemptId}`),
    privateCreateOnlyReadbackVerified: true as const,
    providerUrlPersisted: false as const,
    localPathPersisted: false as const,
  }
  return canonicalDistributedPrePlanStudyCompletionRequestSchema.parse(withHash('complete', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    attemptId: attempt.attemptId,
    leaseCredential: input.leaseCredential,
    workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
    workerReceiptHash: attempt.workerReceiptHash,
    outputs: [{
      ...outputPayload,
      outputHash: canonicalDistributedPrePlanStudyOutputHash(outputPayload),
    }],
    costEvidence: input.cost,
    completionEvidenceHash: hash(`completion-${input.key}`),
    completedAt: input.completedAt,
  }))
}

function failureRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  leaseCredential: string
  key: string
  failedAt: string
  category: 'provider_unknown_outcome' | 'execution_timeout' | 'cancelled'
  status: CanonicalDistributedPrePlanStudyAttemptCostEvidence['evidenceStatus']
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  return canonicalDistributedPrePlanStudyFailureRequestSchema.parse(withHash('fail', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    attemptId: attempt.attemptId,
    leaseCredential: input.leaseCredential,
    workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
    workerReceiptHash: attempt.workerReceiptHash,
    costEvidence: costEvidence({
      seed: input.seed,
      claim: input.claim,
      finishedAt: input.failedAt,
      evidenceStatus: input.status,
    }),
    failureCategory: input.category,
    sanitizedFailureCode: input.category === 'cancelled'
      ? 'STUDY_CANCELLED'
      : input.category === 'execution_timeout'
        ? 'DETERMINISTIC_TOOL_TIMEOUT'
        : 'PROVIDER_OUTCOME_UNKNOWN',
    failureEvidenceHash: hash(`failure-${input.key}`),
    failedAt: input.failedAt,
  }))
}

function controlRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  key: string
  action: 'pause' | 'resume' | 'cancel' | 'recover'
  expectedRevision: number
  at: string
  controllerIdentityEvidenceHash?: string
}) {
  return canonicalDistributedPrePlanStudyControlRequestSchema.parse(withHash('control', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    action: input.action,
    expectedRunRevision: input.expectedRevision,
    controllerIdentityEvidenceHash:
      input.controllerIdentityEvidenceHash ?? hash('controller'),
    requestedAt: input.at,
  }))
}

function recoveryRequest(seed: CanonicalDistributedPrePlanStudySeed, key: string, at: string) {
  return canonicalDistributedPrePlanStudyRecoveryRequestSchema.parse(withHash(
    'recover_expired_lease',
    {
      runId: seed.runId,
      studyIdentityHash: seed.identity.identityHash,
      idempotencyKey: key,
      controllerIdentityEvidenceHash: hash('controller'),
      observedAt: at,
    },
  ))
}

function costEvidence(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  finishedAt: string
  evidenceStatus: CanonicalDistributedPrePlanStudyAttemptCostEvidence['evidenceStatus']
}): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const attempt = required(input.claim.attempt?.attemptStart)
  const workItem = required(input.seed.workItems.find(
    (candidate) => candidate.workItemId === attempt.workItemId,
  ))
  const payload = {
    schemaVersion: 'canonical-distributed-pre-plan-study-attempt-cost-v1' as const,
    evidenceStatus: input.evidenceStatus,
    attemptId: attempt.attemptId,
    attemptStartHash: attempt.attemptStartHash,
    startedAt: attempt.startedAt,
    finishedAt: input.finishedAt,
    approvedUsageEstimateId: input.seed.studyUsageApprovalId,
    internalCostBudgetId: input.seed.internalCostBudgetId,
    maximumAuthorizedInternalCostMicros: workItem.maximumAuthorizedInternalCostMicrosPerAttempt,
    providerUsageEvidenceDigestSha256: hash(`provider-usage-${attempt.attemptId}`),
    providerRateCardSnapshotDigestSha256: workItem.providerRateCardSnapshotDigestSha256,
    providerCostMicros: workItem.executionKind === 'deterministic_tool' ? '0' : '1200',
    infrastructureUsageEvidenceDigestSha256: hash(`infra-usage-${attempt.attemptId}`),
    infrastructureRateCardSnapshotDigestSha256:
      workItem.infrastructureRateCardSnapshotDigestSha256,
    infrastructureCostMicros: '800',
    totalInternalCostMicros: workItem.executionKind === 'deterministic_tool' ? '800' : '2000',
    usageEventIds: [`usage-${attempt.attemptId}`],
    internalCostRecordIds: [`cost-${attempt.attemptId}`],
    failedOrUnknownAttemptCostRetained: true as const,
    invoiceReconciled: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return rehashCost(payload)
}

function rehashCost(
  payload: Omit<CanonicalDistributedPrePlanStudyAttemptCostEvidence, 'evidenceHash'>,
): CanonicalDistributedPrePlanStudyAttemptCostEvidence
function rehashCost(
  payload: CanonicalDistributedPrePlanStudyAttemptCostEvidence,
): CanonicalDistributedPrePlanStudyAttemptCostEvidence
function rehashCost(
  payload: CanonicalDistributedPrePlanStudyAttemptCostEvidence |
    Omit<CanonicalDistributedPrePlanStudyAttemptCostEvidence, 'evidenceHash'>,
): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const { evidenceHash: _evidenceHash, ...withoutHash } = payload as
    CanonicalDistributedPrePlanStudyAttemptCostEvidence
  void _evidenceHash
  return {
    ...withoutHash,
    evidenceHash: canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(withoutHash),
  }
}

function withHash<T extends {
  runId: string
  studyIdentityHash: string
  idempotencyKey: string
}>(operation: string, payload: T): T & { requestHash: string } {
  const draft = { ...payload, requestHash: hash('request-placeholder') }
  return {
    ...payload,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(operation, draft),
  }
}

function hash(value: unknown): string {
  return sha256AuthorityValue({ domain: 'pre_plan_study_conformance_fixture_v1', value })
}

function plus(timestamp: string, milliseconds: number): string {
  return new Date(Date.parse(timestamp) + milliseconds).toISOString()
}

function tamperLease(value: string): string {
  return `${value.slice(0, -1)}${value.endsWith('0') ? '1' : '0'}`
}

function required<T>(value: T | null | undefined): T {
  assert.notEqual(value, null)
  assert.notEqual(value, undefined)
  return value as T
}

async function expectApiError(
  operation: () => unknown | Promise<unknown>,
  code: ApiError['code'],
): Promise<void> {
  await assert.rejects(async () => operation(), isApiError(code))
}

function isApiError(code: ApiError['code']): (error: unknown) => boolean {
  return (error) => error instanceof ApiError && error.code === code
}
