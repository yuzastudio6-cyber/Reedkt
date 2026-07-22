import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

import {
  assertCanonicalDistributedPrePlanStudyProductionAuthority,
  canonicalDistributedPrePlanStudyAttemptCostEvidenceHash,
  canonicalDistributedPrePlanStudyClaimRequestSchema,
  canonicalDistributedPrePlanStudyCompletionRequestSchema,
  canonicalDistributedPrePlanStudyControlRequestSchema,
  canonicalDistributedPrePlanStudyEnqueueRequestSchema,
  canonicalDistributedPrePlanStudyFailureRequestSchema,
  canonicalDistributedPrePlanStudyHeartbeatRequestSchema,
  canonicalDistributedPrePlanStudyIdempotencyKeyHash,
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
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import {
  createCanonicalDistributedPrePlanStudyLocalHttpClient,
  assertCanonicalDistributedPrePlanStudyLocalHttpClientIsNotProduction,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-local-supabase-http-rpc-client'
import {
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY,
  createCanonicalDistributedPrePlanStudyLocalPostgresAdapter,
  createCanonicalDistributedPrePlanStudyLocalPostgresCapability,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-rpc-adapter'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const ownerAToken = createLocalAuthenticatedJwt(ownerA, jwtSecret)
const clientA = createCanonicalDistributedPrePlanStudyLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: ownerAToken,
  localInternalSigningSecret: jwtSecret,
})
const clientB = createCanonicalDistributedPrePlanStudyLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: createLocalAuthenticatedJwt(ownerB, jwtSecret),
  localInternalSigningSecret: jwtSecret,
})
const unsignedBrowserClient = createCanonicalDistributedPrePlanStudyLocalHttpClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
  localInternalSigningSecret: hash('browser-held-token-has-no-internal-signing-authority'),
})
const capabilityA = createCanonicalDistributedPrePlanStudyLocalPostgresCapability({
  client: clientA,
  endpointOrigin,
})
const adapterA = createCanonicalDistributedPrePlanStudyLocalPostgresAdapter({
  client: clientA,
  capability: capabilityA,
})
const portA = createCanonicalDistributedPrePlanStudyStatePort(adapterA)

assert.equal(adapterA.descriptor.databaseBackend, 'postgres')
assert.equal(adapterA.descriptor.liveSupabaseOrPostgresCallPerformed, true)
assert.equal(adapterA.descriptor.distributedDatabaseTransactionVerified, false)
assert.equal(adapterA.descriptor.multiReplicaDurabilityVerified, false)
assert.equal(adapterA.descriptor.authenticatedWorkerDispatchVerified, false)
assert.equal(adapterA.descriptor.livePrivateObjectReadVerified, false)
assert.equal(adapterA.descriptor.productionAuthority, false)
assert.throws(
  () => assertCanonicalDistributedPrePlanStudyLocalHttpClientIsNotProduction(clientA),
  isAtomicityError,
)
assert.throws(
  () => assertCanonicalDistributedPrePlanStudyProductionAuthority(portA),
  isAtomicityError,
)
const unsignedBrowserCapability =
  createCanonicalDistributedPrePlanStudyLocalPostgresCapability({
    client: unsignedBrowserClient,
    endpointOrigin,
  })
const unsignedBrowserPort = createCanonicalDistributedPrePlanStudyStatePort(
  createCanonicalDistributedPrePlanStudyLocalPostgresAdapter({
    client: unsignedBrowserClient,
    capability: unsignedBrowserCapability,
  }),
)
await assert.rejects(
  () => unsignedBrowserPort.enqueue(enqueueRequest(
    createSeed('local-browser-denial', 'deterministic_tool'),
    'local-browser-denial-enqueue-0001',
    '2026-07-21T17:59:00.000Z',
  )),
  isAtomicityError,
)

const signatureTamperSeed = createSeed('local-signature-tamper', 'deterministic_tool')
const signatureTamperRequest = enqueueRequest(
  signatureTamperSeed,
  'local-signature-original-0001',
  new Date().toISOString(),
)
const originalInternalSignature = createHmac('sha256', jwtSecret).update(
  `canonical_pre_plan_local_internal_v1:${signatureTamperRequest.requestHash}:`
    + canonicalDistributedPrePlanStudyIdempotencyKeyHash(
      signatureTamperRequest.idempotencyKey,
    ),
).digest('hex')
const signatureTamperResponse = await fetch(
  `${endpointOrigin}/rest/v1/rpc/`
    + CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.functions.enqueue,
  {
    method: 'POST',
    headers: {
      accept: 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${ownerAToken}`,
      'content-type': 'application/json',
      'x-reeditpro-local-pre-plan-authority': originalInternalSignature,
    },
    body: JSON.stringify({
      p_contract_version: 'canonical-distributed-pre-plan-study-state-port-v1',
      p_request: {
        ...signatureTamperRequest,
        idempotencyKey: 'local-signature-tampered-0001',
      },
    }),
  },
)
assert.equal(signatureTamperResponse.ok, false)
await signatureTamperResponse.text()

const sourceLineageTamperSeed = withTamperedSourceSize(
  createSeed('local-source-lineage-tamper', 'deterministic_tool'),
)
await assert.rejects(
  () => portA.enqueue(enqueueRequest(
    sourceLineageTamperSeed,
    'local-source-lineage-tamper-enqueue-0001',
    new Date().toISOString(),
  )),
  isAtomicityError,
)

const base = new Date(Date.now() - 1_000).toISOString()
const completeSeed = createSeed('local-complete', 'deterministic_tool')
const enqueue = enqueueRequest(completeSeed, 'local-complete-enqueue-0001', base)
const enqueueResults = await Promise.all([portA.enqueue(enqueue), portA.enqueue(enqueue)])
assert.deepEqual(
  enqueueResults.map((result) => result.idempotencyStatus).sort(),
  ['exact_replay', 'inserted'],
)
assert.deepEqual(enqueueResults[0]?.response, enqueueResults[1]?.response)
await assert.rejects(
  () => portA.enqueue(enqueueRequest(
    completeSeed,
    'local-complete-enqueue-0001',
    plus(base, 1),
  )),
  isAtomicityError,
)

const claimRequestValue = claimRequest(
  completeSeed,
  'local-complete-claim-0001',
  plus(base, 1_000),
)
const claims = await Promise.all([
  portA.claimAndStart(claimRequestValue),
  portA.claimAndStart(claimRequestValue),
])
assert.deepEqual(
  claims.map((result) => result.idempotencyStatus).sort(),
  ['exact_replay', 'inserted'],
)
assert.ok(claims[0]?.transientLeaseCredential)
assert.equal(claims[0]?.transientLeaseCredential, claims[1]?.transientLeaseCredential)
assert.deepEqual(claims[0]?.response, claims[1]?.response)
const claim = required(claims[0])
const heartbeat = await portA.heartbeatAndCheckpoint(heartbeatRequest({
  seed: completeSeed,
  claim: claim.response,
  credential: required(claim.transientLeaseCredential),
  key: 'local-complete-heartbeat-0001',
  at: plus(base, 10_000),
  sequence: 1,
  progress: 4_000,
}))
assert.equal(heartbeat.response.workItem?.latestCheckpoint?.checkpointSequence, 1)
await assert.rejects(
  () => portA.heartbeatAndCheckpoint(heartbeatRequest({
    seed: completeSeed,
    claim: claim.response,
    credential: required(claim.transientLeaseCredential),
    key: 'local-complete-stale-heartbeat-0001',
    at: plus(base, 20_000),
    sequence: 1,
    progress: 5_000,
  })),
  isAtomicityError,
)
const completion = completionRequest({
  seed: completeSeed,
  claim: heartbeat.response,
  credential: required(claim.transientLeaseCredential),
  key: 'local-complete-terminal-0001',
  at: plus(base, 30_000),
})
const completed = await portA.complete(completion)
const completedReplay = await portA.complete(completion)
assert.equal(completed.response.run.state, 'completed')
assert.equal(completed.response.workItem?.state, 'completed')
assert.equal(completed.response.attempt?.terminal?.costEvidence.totalInternalCostMicros, '800')
assert.equal(completedReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(completedReplay.response, completed.response)
await assert.rejects(
  () => portA.claimAndStart(claimRequestValue),
  isAtomicityError,
)

const failedSeed = createSeed('local-failure', 'visual_model')
await portA.enqueue(enqueueRequest(failedSeed, 'local-failure-enqueue-0001', base))
const failedClaim = await portA.claimAndStart(claimRequest(
  failedSeed,
  'local-failure-claim-0001',
  plus(base, 1_000),
))
const failed = await portA.fail(failureRequest({
  seed: failedSeed,
  claim: failedClaim.response,
  credential: required(failedClaim.transientLeaseCredential),
  key: 'local-failure-terminal-0001',
  at: plus(base, 20_000),
  category: 'provider_unknown_outcome',
}))
assert.equal(failed.response.run.state, 'needs_operator_review')
assert.equal(failed.response.workItem?.state, 'blocked')
assert.equal(
  failed.response.attempt?.terminal?.costEvidence.evidenceStatus,
  'provisional_provider_reconciliation_required',
)

const controlSeed = createSeed('local-control', 'deterministic_tool')
const controlEnqueue = await portA.enqueue(enqueueRequest(
  controlSeed,
  'local-control-enqueue-0001',
  base,
))
const paused = await portA.control(controlRequest({
  seed: controlSeed,
  key: 'local-control-pause-0001',
  action: 'pause',
  revision: controlEnqueue.response.run.revision,
  at: plus(base, 1_000),
}))
const resumed = await portA.control(controlRequest({
  seed: controlSeed,
  key: 'local-control-resume-0001',
  action: 'resume',
  revision: paused.response.run.revision,
  at: plus(base, 2_000),
}))
const controlClaim = await portA.claimAndStart(claimRequest(
  controlSeed,
  'local-control-claim-0001',
  plus(base, 3_000),
))
const cancelling = await portA.control(controlRequest({
  seed: controlSeed,
  key: 'local-control-cancel-0001',
  action: 'cancel',
  revision: controlClaim.response.run.revision,
  at: plus(base, 4_000),
}))
assert.equal(resumed.response.run.state, 'queued')
assert.equal(cancelling.response.run.state, 'cancellation_requested')
const cancelled = await portA.fail(failureRequest({
  seed: controlSeed,
  claim: controlClaim.response,
  credential: required(controlClaim.transientLeaseCredential),
  key: 'local-control-cancel-terminal-0001',
  at: plus(base, 5_000),
  category: 'cancelled',
}))
assert.equal(cancelled.response.run.state, 'cancelled')

const recoverySeed = createSeed('local-recovery', 'deterministic_tool')
await portA.enqueue(enqueueRequest(recoverySeed, 'local-recovery-enqueue-0001', base))
const recoveryClaim = await portA.claimAndStart(claimRequest(
  recoverySeed,
  'local-recovery-claim-0001',
  plus(base, 1_000),
))
await portA.heartbeatAndCheckpoint(heartbeatRequest({
  seed: recoverySeed,
  claim: recoveryClaim.response,
  credential: required(recoveryClaim.transientLeaseCredential),
  key: 'local-recovery-heartbeat-0001',
  at: plus(base, 10_000),
  sequence: 1,
  progress: 5_000,
}))
const early = await portA.recoverExpiredLease(recoveryRequest(
  recoverySeed,
  'local-recovery-early-0001',
  plus(base, 50_000),
))
assert.equal(early.response.expiredAttemptRecovered, false)
assert.equal(early.response.transaction, null)
const recoveryRequestValue = recoveryRequest(
  recoverySeed,
  'local-recovery-expired-0001',
  plus(base, 80_000),
)
const recovered = await portA.recoverExpiredLease(recoveryRequestValue)
const recoveredReplay = await portA.recoverExpiredLease(recoveryRequestValue)
assert.equal(recovered.response.expiredAttemptRecovered, true)
assert.equal(recovered.response.workItem?.state, 'retry_wait')
assert.equal(recovered.response.attempt?.state, 'timed_out')
assert.equal(recoveredReplay.idempotencyStatus, 'exact_replay')
assert.deepEqual(recoveredReplay.response, recovered.response)
const retry = await portA.claimAndStart(claimRequest(
  recoverySeed,
  'local-recovery-retry-claim-0001',
  plus(base, 81_000),
))
assert.equal(retry.response.attempt?.attemptStart.attemptNumber, 2)
assert.equal(
  retry.response.attempt?.attemptStart.resumeCheckpointHash,
  recovered.response.workItem?.latestCheckpoint?.checkpointHash,
)

const capabilityB = createCanonicalDistributedPrePlanStudyLocalPostgresCapability({
  client: clientB,
  endpointOrigin,
})
const portB = createCanonicalDistributedPrePlanStudyStatePort(
  createCanonicalDistributedPrePlanStudyLocalPostgresAdapter({
    client: clientB,
    capability: capabilityB,
  }),
)
await assert.rejects(
  () => portB.enqueue(enqueueRequest(
    createSeed('tenant-denial', 'deterministic_tool'),
    'local-tenant-denial-enqueue-0001',
    base,
  )),
  isAtomicityError,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'canonical-distributed-pre-plan-study-local-postgres-smoke-v1',
  operationsVerified: 7,
  concurrentEnqueueAndClaimReplayVerified: true,
  digestOnlyReplayableLeaseVerified: true,
  monotonicCheckpointVerified: true,
  terminalOutputAndCostAtomicityVerified: true,
  providerUnknownOutcomeBlocked: true,
  pauseResumeCancelVerified: true,
  deterministicExpiredLeaseRecoveryVerified: true,
  crossWorkspaceMutationDenied: true,
  browserHeldTokenWithoutInternalSignatureDenied: true,
  idempotencyKeySignatureTamperDenied: true,
  canonicalSourceObjectLineageTamperDenied: true,
  terminalLeaseCredentialReplayDenied: true,
  approvedPlanSnapshotOrCreditReservationFabricated: false,
  remoteDatabaseMutationAllowed: false,
  workerOrProviderExecutionStarted: false,
  productionAuthority: false,
}, null, 2))

function createSeed(
  suffix: string,
  executionKind: 'deterministic_tool' | 'visual_model',
): CanonicalDistributedPrePlanStudySeed {
  const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const sourceAssetId = 'aaaaaaaa-d000-4000-8000-000000000001'
  const sourceStorageObjectId = 'tenant-a/reference/source.mp4'
  const sourceChecksumSha256 = 'a'.repeat(64)
  const identityWithoutHash = {
    authorityClass: 'pre_plan_edit_reference_long_form_study' as const,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    ownerUserId: ownerA,
    workspaceId,
    editReferenceId: 'aaaaaaaa-3000-4000-8000-000000000001',
    studySessionId: 'aaaaaaaa-4000-4000-8000-000000000001',
    sourceAssetId,
    sourceStorageObjectId,
    sourceStorageObjectIdentityHash: sha256AuthorityValue({
      domain: 'canonical_v3_local_preference_asset_storage_identity_v1',
      payload: {
        workspaceId,
        assetId: sourceAssetId,
        storageObjectId: sourceStorageObjectId,
        storageGeneration: '1',
        storageEtag: 'etag-a',
        checksumSha256: sourceChecksumSha256,
      },
    }),
    sourceChecksumSha256,
    sourceSizeBytes: 250 * 1024 ** 3,
    sourceDurationMilliseconds: 6 * 60 * 60 * 1_000,
    sourceMimeType: 'video/mp4',
  }
  const identity = {
    ...identityWithoutHash,
    identityHash: canonicalDistributedPrePlanStudyIdentityHash(identityWithoutHash),
  }
  const workWithoutHash = {
    workItemId: `local-work-${suffix}-1`,
    sequence: 1,
    stageId: executionKind === 'deterministic_tool' ? 'stage-media' : 'stage-visual',
    dependencyWorkItemIds: [] as string[],
    required: true,
    weightBasisPoints: 10_000,
    executionKind,
    workerClass: executionKind === 'deterministic_tool'
      ? 'media_worker' as const
      : 'visual_worker' as const,
    operationId: executionKind === 'deterministic_tool'
      ? 'tool.ffmpeg.execute_approved_media_recipe.v1'
      : 'model.visual.study.v1',
    profileId: 'local-approved-study-v1',
    modelId: executionKind === 'deterministic_tool' ? null : 'qwen2.5-vl-local-proof',
    maximumAttempts: 2,
    leaseDurationMs: 60_000,
    attemptDeadlineDurationMs: 300_000,
    resourceEnvelope: {
      vcpuCount: 2,
      memoryGib: 8,
      gpuCount: executionKind === 'visual_model' ? 1 : 0,
      temporaryStorageGib: 200,
    },
    providerRateCardSnapshotDigestSha256: hash(`provider-rate-${suffix}`),
    infrastructureRateCardSnapshotDigestSha256: hash(`infra-rate-${suffix}`),
    maximumAuthorizedInternalCostMicrosPerAttempt: '1000000',
    inputBindingHash: hash(`input-${suffix}`),
  }
  const workItem = {
    ...workWithoutHash,
    workItemHash: canonicalDistributedPrePlanStudyWorkItemHash(workWithoutHash),
  }
  const withoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-seed-v1' as const,
    runId: `local-run-${suffix}`,
    planId: `local-plan-${suffix}`,
    planVersion: 'v1',
    planDigestSha256: hash(`plan-${suffix}`),
    identity,
    studyUsageApprovalId: `local-study-usage-${suffix}`,
    studyUsageApprovalDigestSha256: hash(`usage-approval-${suffix}`),
    internalCostBudgetId: `local-cost-budget-${suffix}`,
    maximumAuthorizedInternalCostMicros: '2000000',
    currency: 'USD' as const,
    wholeStudyTimeoutApplied: false as const,
    browserSessionRequiredForCompletion: false as const,
    workItems: [workItem],
  }
  return {
    ...withoutHash,
    seedHash: canonicalDistributedPrePlanStudySeedHash(withoutHash),
  }
}

function withTamperedSourceSize(
  seed: CanonicalDistributedPrePlanStudySeed,
): CanonicalDistributedPrePlanStudySeed {
  const { identityHash: _identityHash, ...identityPayload } = seed.identity
  void _identityHash
  const identityWithoutHash = {
    ...identityPayload,
    sourceSizeBytes: seed.identity.sourceSizeBytes - 1,
  }
  const identity = {
    ...identityWithoutHash,
    identityHash: canonicalDistributedPrePlanStudyIdentityHash(identityWithoutHash),
  }
  const { seedHash: _seedHash, ...seedPayload } = seed
  void _seedHash
  const seedWithoutHash = { ...seedPayload, identity }
  return {
    ...seedWithoutHash,
    seedHash: canonicalDistributedPrePlanStudySeedHash(seedWithoutHash),
  }
}

function enqueueRequest(seed: CanonicalDistributedPrePlanStudySeed, key: string, at: string) {
  return canonicalDistributedPrePlanStudyEnqueueRequestSchema.parse(withHash('enqueue', {
    runId: seed.runId,
    studyIdentityHash: seed.identity.identityHash,
    idempotencyKey: key,
    seed,
    controllerIdentityEvidenceHash: hash('local-controller-a'),
    requestedAt: at,
  }))
}

function claimRequest(seed: CanonicalDistributedPrePlanStudySeed, key: string, at: string) {
  const workItem = required(seed.workItems[0])
  return canonicalDistributedPrePlanStudyClaimRequestSchema.parse(withHash('claim_and_start', {
    runId: seed.runId,
    studyIdentityHash: seed.identity.identityHash,
    idempotencyKey: key,
    workerClass: workItem.workerClass,
    workerIdentityEvidenceHash: hash(`worker-${workItem.workerClass}`),
    workerReceiptHash: hash(`worker-receipt-${workItem.workerClass}`),
    capacityAdmissionEvidenceHash: hash(`capacity-${workItem.workerClass}`),
    acceptedAt: at,
  }))
}

function heartbeatRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  credential: string
  key: string
  at: string
  sequence: number
  progress: number
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  return canonicalDistributedPrePlanStudyHeartbeatRequestSchema.parse(withHash(
    'heartbeat_and_checkpoint',
    {
      runId: input.seed.runId,
      studyIdentityHash: input.seed.identity.identityHash,
      idempotencyKey: input.key,
      attemptId: attempt.attemptId,
      leaseCredential: input.credential,
      workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
      workerReceiptHash: attempt.workerReceiptHash,
      checkpoint: {
        checkpointSequence: input.sequence,
        progressBasisPoints: input.progress,
        progressEvidenceHash: hash(`progress-${input.key}`),
        privateCheckpointObjectId: `checkpoint-${input.key}`,
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
  credential: string
  key: string
  at: string
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  const outputWithoutHash = {
    outputId: `local-output-${attempt.attemptId}`,
    outputKind: 'private-study-evidence',
    storageObjectId: `private/evidence/${attempt.attemptId}.json`,
    storageObjectIdentityHash: hash(`storage-${attempt.attemptId}`),
    checksumSha256: hash(`checksum-${attempt.attemptId}`),
    byteLength: 4096,
    mimeType: 'application/json',
    lineageHash: hash(`lineage-${attempt.attemptId}`),
    privateCreateOnlyReadbackVerified: true as const,
    providerUrlPersisted: false as const,
    localPathPersisted: false as const,
  }
  return canonicalDistributedPrePlanStudyCompletionRequestSchema.parse(withHash('complete', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    attemptId: attempt.attemptId,
    leaseCredential: input.credential,
    workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
    workerReceiptHash: attempt.workerReceiptHash,
    outputs: [{
      ...outputWithoutHash,
      outputHash: canonicalDistributedPrePlanStudyOutputHash(outputWithoutHash),
    }],
    costEvidence: costEvidence(input.seed, input.claim, input.at, 'final'),
    completionEvidenceHash: hash(`completion-${input.key}`),
    completedAt: input.at,
  }))
}

function failureRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  claim: CanonicalDistributedPrePlanStudyMutationResponse
  credential: string
  key: string
  at: string
  category: 'provider_unknown_outcome' | 'cancelled'
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  return canonicalDistributedPrePlanStudyFailureRequestSchema.parse(withHash('fail', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    attemptId: attempt.attemptId,
    leaseCredential: input.credential,
    workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
    workerReceiptHash: attempt.workerReceiptHash,
    costEvidence: costEvidence(
      input.seed,
      input.claim,
      input.at,
      input.category === 'provider_unknown_outcome'
        ? 'provisional_provider_reconciliation_required'
        : 'final',
    ),
    failureCategory: input.category,
    sanitizedFailureCode: input.category === 'cancelled'
      ? 'CONTROLLER_CANCELLED'
      : 'PROVIDER_RESULT_UNKNOWN',
    failureEvidenceHash: hash(`failure-${input.key}`),
    failedAt: input.at,
  }))
}

function controlRequest(input: {
  seed: CanonicalDistributedPrePlanStudySeed
  key: string
  action: 'pause' | 'resume' | 'cancel'
  revision: number
  at: string
}) {
  return canonicalDistributedPrePlanStudyControlRequestSchema.parse(withHash('control', {
    runId: input.seed.runId,
    studyIdentityHash: input.seed.identity.identityHash,
    idempotencyKey: input.key,
    action: input.action,
    expectedRunRevision: input.revision,
    controllerIdentityEvidenceHash: hash('local-controller-a'),
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
      controllerIdentityEvidenceHash: hash('local-controller-a'),
      observedAt: at,
    },
  ))
}

function costEvidence(
  seed: CanonicalDistributedPrePlanStudySeed,
  claim: CanonicalDistributedPrePlanStudyMutationResponse,
  finishedAt: string,
  status: 'final' | 'provisional_provider_reconciliation_required',
): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const attempt = required(claim.attempt?.attemptStart)
  const work = required(seed.workItems.find((item) => item.workItemId === attempt.workItemId))
  const withoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-attempt-cost-v1' as const,
    evidenceStatus: status,
    attemptId: attempt.attemptId,
    attemptStartHash: attempt.attemptStartHash,
    startedAt: attempt.startedAt,
    finishedAt,
    approvedUsageEstimateId: seed.studyUsageApprovalId,
    internalCostBudgetId: seed.internalCostBudgetId,
    maximumAuthorizedInternalCostMicros: work.maximumAuthorizedInternalCostMicrosPerAttempt,
    providerUsageEvidenceDigestSha256: hash(`provider-usage-${attempt.attemptId}`),
    providerRateCardSnapshotDigestSha256: work.providerRateCardSnapshotDigestSha256,
    providerCostMicros: '0',
    infrastructureUsageEvidenceDigestSha256: hash(`infra-usage-${attempt.attemptId}`),
    infrastructureRateCardSnapshotDigestSha256:
      work.infrastructureRateCardSnapshotDigestSha256,
    infrastructureCostMicros: '800',
    totalInternalCostMicros: '800',
    usageEventIds: [`usage-${attempt.attemptId}`],
    internalCostRecordIds: [`cost-${attempt.attemptId}`],
    failedOrUnknownAttemptCostRetained: true as const,
    invoiceReconciled: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ...withoutHash,
    evidenceHash: canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(withoutHash),
  }
}

function withHash<T extends {
  runId: string
  studyIdentityHash: string
  idempotencyKey: string
}>(operation: string, value: T): T & { requestHash: string } {
  const draft = { ...value, requestHash: hash('placeholder') }
  return {
    ...value,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(operation, draft),
  }
}

function hash(value: unknown): string {
  return sha256AuthorityValue({ domain: 'canonical_local_pre_plan_smoke_v1', value })
}

function plus(value: string, milliseconds: number): string {
  return new Date(Date.parse(value) + milliseconds).toISOString()
}

function required<T>(value: T | null | undefined): T {
  assert.notEqual(value, null)
  assert.notEqual(value, undefined)
  return value as T
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated', exp: now + 900, iat: now, role: 'authenticated', sub: subject,
  })).toString('base64url')
  const unsigned = `${header}.${payload}`
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`pre_plan_local_postgres_environment_missing:${name}`)
  return value
}

function isAtomicityError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}
