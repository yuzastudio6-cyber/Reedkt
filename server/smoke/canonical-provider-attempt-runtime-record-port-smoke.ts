import assert from 'node:assert/strict'

import {
  resolveCanonicalProviderLifecyclePolicy,
} from '../edit-architecture/canonical-provider-lifecycle-policy'
import {
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
} from '../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../errors/api-error'
import {
  CANONICAL_PROVIDER_ATTEMPT_RELEASE_QUALIFICATION_VERSION,
  CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION,
  createCanonicalProviderAttemptRuntimeLocator,
  createControlledCanonicalProviderAttemptRuntimeRecordPort,
  createQualifiedCanonicalProviderAttemptRuntimeRecordPort,
  readCanonicalProviderAttemptRuntimeRecord,
  type CanonicalProviderAttemptCurrentReleaseIdentity,
  type CanonicalProviderAttemptNonExecutionEvidence,
  type CanonicalProviderAttemptReleaseEvidence,
  type CanonicalProviderAttemptReleaseQualificationCapability,
  type CanonicalProviderAttemptReleasedRepositoryAdapter,
} from '../services/canonical-provider-attempt-runtime-record-port'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type {
  CanonicalProviderAttemptConsumerReceipt,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'

const BASE_TIME_MS = Date.parse('2026-07-22T15:00:00.000Z')
const at = (offsetMs: number) => new Date(BASE_TIME_MS + offsetMs).toISOString()
const policy = resolveCanonicalProviderLifecyclePolicy(
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
)

const runtimeSuccess = createReceipt({
  evidenceClass: 'canonical_backend_runtime_unreleased',
  terminalState: 'succeeded',
})
const locator = createLocator(runtimeSuccess)
const currentReleaseIdentity = createCurrentReleaseIdentity()
const releaseEvidence = createReleaseEvidence(
  runtimeSuccess,
  locator.locatorDigest,
  currentReleaseIdentity,
)

const completeControlledPort = createControlledCanonicalProviderAttemptRuntimeRecordPort({
  readExactAttempt: async () => ({
    state: 'attempt_record',
    receipt: runtimeSuccess,
    releaseEvidence,
  }),
  readCurrentReleaseIdentity: async () => currentReleaseIdentity,
})

const complete = await readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: completeControlledPort,
  locator,
  projectedAt: at(10_000),
})
assert.equal(complete.recordKind, 'provider_attempt')
if (complete.recordKind !== 'provider_attempt') {
  throw new Error('Expected provider attempt record.')
}
assert.equal(complete.attemptOutcome, 'completed')
assert.equal(complete.state, 'validated_unreleased_runtime_blocked')
assert.equal(complete.verification.exactReleaseEvidenceDigestVerified, true)
assert.equal(complete.verification.exactCurrentReleaseIdentityDigestVerified, true)
assert.equal(complete.verification.exactCurrentReleaseIdentityMatched, true)
assert.equal(complete.verification.runtimePortQualified, false)
assert.equal(complete.verification.providerUsageAndCostReconciled, true)
assert.equal(complete.verification.workerResourceUsageObserved, true)
assert.equal(complete.verification.workerInfrastructureCostProvisional, true)
assert.equal(complete.verification.workerInfrastructureCostReconciled, false)
assert.equal(complete.verification.productionInternalCostReconciled, false)
assert.equal(complete.consumerProjection.workerInfrastructureCostProvisional, true)
assert.equal(complete.consumerProjection.workerInfrastructureCostReconciled, false)
assert.equal(complete.consumerProjection.productionInternalCostReconciled, false)
assert.equal(complete.consumerProjection.provisionalTotalInternalCostMicros, 3_000)
assert.equal(complete.boundaries.providerTransportActivated, false)
assert.equal(complete.boundaries.canonicalBackendVerifiedRuntime, false)
assert.equal(complete.boundaries.promotionAuthorized, false)
assert.equal(complete.boundaries.productionReady, false)
assert.ok(complete.blockers.includes('trusted_release_port_unqualified'))
assert.ok(complete.blockers.includes('worker_infrastructure_rate_is_provisional'))
assert.ok(complete.blockers.includes('worker_infrastructure_cost_not_reconciled'))

const replay = await readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: completeControlledPort,
  locator,
  projectedAt: at(10_000),
})
assert.deepEqual(replay, complete)
assert.equal(replay.recordDigest, complete.recordDigest)
assert.equal(Object.isFrozen(replay), true)

const injectedReceipt = createReceipt({
  evidenceClass: 'private_injected_nonprovider_test',
  terminalState: 'succeeded',
})
const injectedLocator = createLocator(injectedReceipt)
const injected = await readWithReceipt(injectedReceipt, injectedLocator)
assert.equal(injected.recordKind, 'provider_attempt')
if (injected.recordKind !== 'provider_attempt') {
  throw new Error('Expected injected provider attempt record.')
}
assert.equal(injected.state, 'non_promotable_private_injected')
assert.equal(injected.verification.providerRequestObserved, false)
assert.ok(injected.blockers.includes('private_injected_source_evidence'))
assert.equal(injected.boundaries.promotionAuthorized, false)

const failedReceipt = createReceipt({
  evidenceClass: 'canonical_backend_runtime_unreleased',
  terminalState: 'failed',
})
const failed = await readWithReceipt(failedReceipt, createLocator(failedReceipt))
assert.equal(failed.recordKind, 'provider_attempt')
if (failed.recordKind !== 'provider_attempt') throw new Error('Expected failure.')
assert.equal(failed.attemptOutcome, 'failed')
assert.equal(failed.consumerProjection.failedOrUnknownAttemptCostRetained, true)
assert.equal(failed.consumerProjection.providerCostMicros, 2_000)
assert.equal(failed.consumerProjection.canonicalCheckbackRequired, true)
assert.equal(failed.consumerProjection.canonicalCheckbackPermitIncluded, false)
assert.equal(failed.consumerProjection.fallbackAllowed, false)
assert.equal(failed.consumerProjection.rerunAllowed, false)
assert.ok(failed.blockers.includes('canonical_checkback_permit_required'))

const unknownReceipt = createReceipt({
  evidenceClass: 'canonical_backend_runtime_unreleased',
  terminalState: 'unknown_reconciliation_required',
})
const unknown = await readWithReceipt(unknownReceipt, createLocator(unknownReceipt))
assert.equal(unknown.recordKind, 'provider_attempt')
if (unknown.recordKind !== 'provider_attempt') throw new Error('Expected unknown.')
assert.equal(unknown.attemptOutcome, 'unknown_reconciliation_required')
assert.equal(unknown.consumerProjection.providerCostMicros, null)
assert.equal(unknown.consumerProjection.providerUsageAndCostReconciled, false)
assert.equal(unknown.consumerProjection.failedOrUnknownAttemptCostRetained, true)
assert.equal(unknown.consumerProjection.provisionalTotalInternalCostMicros, null)
assert.equal(unknown.consumerProjection.canonicalCheckbackRequired, true)
assert.equal(unknown.consumerProjection.fallbackAllowed, false)
assert.equal(unknown.consumerProjection.rerunAllowed, false)

for (const [terminalState, expectedOutcome] of [
  ['unknown_reconciled_succeeded', 'unknown_reconciled_completed'],
  ['unknown_reconciled_failed', 'unknown_reconciled_failed'],
] as const) {
  const receipt = createReceipt({
    evidenceClass: 'canonical_backend_runtime_unreleased',
    terminalState,
  })
  const result = await readWithReceipt(receipt, createLocator(receipt))
  assert.equal(result.recordKind, 'provider_attempt')
  assert.equal(result.attemptOutcome, expectedOutcome)
  if (
    result.recordKind === 'provider_attempt' &&
    expectedOutcome === 'unknown_reconciled_completed'
  ) assert.equal(result.consumerProjection.canonicalCheckbackRequired, false)
}

const neverSubmittedLocator = createLocator(runtimeSuccess)
const neverSubmittedEvidence = createNonExecutionEvidence({
  state: 'never_submitted',
  locatorDigest: neverSubmittedLocator.locatorDigest,
})
const neverSubmitted = await readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: createControlledCanonicalProviderAttemptRuntimeRecordPort({
    readExactAttempt: async () => ({
      state: 'never_submitted',
      lifecycleEvidence: neverSubmittedEvidence,
    }),
  }),
  locator: neverSubmittedLocator,
  projectedAt: at(10_000),
})
assert.equal(neverSubmitted.recordKind, 'provider_non_execution')
assert.equal(neverSubmitted.attemptOutcome, 'never_submitted')
assert.equal(neverSubmitted.consumerProjection.providerRequestCount, 0)
assert.equal(neverSubmitted.consumerProjection.rerunAllowed, false)
assert.ok(neverSubmitted.blockers.includes('provider_attempt_never_submitted'))

const cancelledEvidence = createNonExecutionEvidence({
  state: 'cancelled',
  locatorDigest: neverSubmittedLocator.locatorDigest,
})
const cancelled = await readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: createControlledCanonicalProviderAttemptRuntimeRecordPort({
    readExactAttempt: async () => ({
      state: 'cancelled',
      lifecycleEvidence: cancelledEvidence,
    }),
  }),
  locator: neverSubmittedLocator,
  projectedAt: at(10_000),
})
assert.equal(cancelled.recordKind, 'provider_non_execution')
assert.equal(cancelled.attemptOutcome, 'cancelled')
assert.equal(cancelled.consumerProjection.failedOrUnknownAttemptCostRetained, true)
assert.equal(cancelled.consumerProjection.providerRequestCount, 1)
assert.equal(cancelled.consumerProjection.rerunAllowed, false)
assert.equal(cancelled.boundaries.cancellationPromotionBlockedByReceiptSchemaGap,
  true)
assert.ok(cancelled.blockers.includes('canonical_cancellation_receipt_schema_gap'))

const staleIdentity = createCurrentReleaseIdentity({
  deploymentRevision: 'provider-runtime-revision-stale',
})
const staleRelease = await readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: createControlledCanonicalProviderAttemptRuntimeRecordPort({
    readExactAttempt: async () => ({
      state: 'attempt_record',
      receipt: runtimeSuccess,
      releaseEvidence,
    }),
    readCurrentReleaseIdentity: async () => staleIdentity,
  }),
  locator,
  projectedAt: at(10_000),
})
assert.equal(staleRelease.recordKind, 'provider_attempt')
if (staleRelease.recordKind !== 'provider_attempt') throw new Error('Expected attempt.')
assert.equal(staleRelease.verification.exactCurrentReleaseIdentityMatched, false)
assert.ok(staleRelease.blockers.includes('current_release_identity_mismatch'))
assert.equal(staleRelease.boundaries.promotionAuthorized, false)

const missingCurrentIdentity = await readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: createControlledCanonicalProviderAttemptRuntimeRecordPort({
    readExactAttempt: async () => ({
      state: 'attempt_record',
      receipt: runtimeSuccess,
      releaseEvidence,
    }),
  }),
  locator,
  projectedAt: at(10_000),
})
assert.equal(missingCurrentIdentity.recordKind, 'provider_attempt')
if (missingCurrentIdentity.recordKind !== 'provider_attempt') {
  throw new Error('Expected attempt.')
}
assert.ok(missingCurrentIdentity.blockers.includes('current_release_identity_missing'))

const missingProviderUsage = rehashReceipt({
  ...structuredClone(runtimeSuccess),
  internalCost: {
    ...structuredClone(runtimeSuccess.internalCost),
    providerUsageEvidenceDigest: null,
  },
})
const missingProviderUsageResult = await readWithReceipt(
  missingProviderUsage,
  createLocator(missingProviderUsage),
)
assert.equal(missingProviderUsageResult.recordKind, 'provider_attempt')
if (missingProviderUsageResult.recordKind !== 'provider_attempt') {
  throw new Error('Expected attempt.')
}
assert.equal(
  missingProviderUsageResult.verification.providerUsageAndCostReconciled,
  false,
)
assert.ok(missingProviderUsageResult.blockers.includes(
  'provider_usage_or_cost_not_reconciled',
))

const wrongTenantLocator = createCanonicalProviderAttemptRuntimeLocator({
  ownerUserId: locator.ownerUserId,
  workspaceId: 'workspace-other',
  projectId: locator.projectId,
  editSessionId: locator.editSessionId,
  approvedPlanSnapshotId: locator.approvedPlanSnapshotId,
  approvedPlanSnapshotHash: locator.approvedPlanSnapshotHash,
  packageRecordId: locator.packageRecordId,
  packageHash: locator.packageHash,
  workGraphHash: locator.workGraphHash,
  approvedWorkItemId: locator.approvedWorkItemId,
  approvedWorkItemHash: locator.approvedWorkItemHash,
  queueDefinitionHash: locator.queueDefinitionHash,
  queueJobId: locator.queueJobId,
  queueJobDefinitionHash: locator.queueJobDefinitionHash,
  authorizationHash: locator.authorizationHash,
  dispatchAttemptId: locator.dispatchAttemptId,
  operationId: locator.operationId,
  sourceRequestId: locator.sourceRequestId,
  expectedOutputSetDigest: locator.expectedOutputSetDigest,
})
await expectApiError(() => readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: createControlledCanonicalProviderAttemptRuntimeRecordPort({
    readExactAttempt: async () => ({
      state: 'attempt_record',
      receipt: runtimeSuccess,
      releaseEvidence: null,
    }),
  }),
  locator: wrongTenantLocator,
  projectedAt: at(10_000),
}), 'WORKSPACE_ACCESS_DENIED')

const tamperedLocator = structuredClone(locator)
tamperedLocator.queueJobId = 'job-tampered'
await expectApiError(() => readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: completeControlledPort,
  locator: tamperedLocator,
  projectedAt: at(10_000),
}), 'VALIDATION_FAILED')

const tamperedReleaseEvidence = structuredClone(releaseEvidence)
tamperedReleaseEvidence.deploymentRevision = 'tampered-revision'
await expectApiError(() => readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  port: createControlledCanonicalProviderAttemptRuntimeRecordPort({
    readExactAttempt: async () => ({
      state: 'attempt_record',
      receipt: runtimeSuccess,
      releaseEvidence: tamperedReleaseEvidence,
    }),
  }),
  locator,
  projectedAt: at(10_000),
}), 'VALIDATION_FAILED')

const wrongModelReceipt = rehashReceipt({
  ...structuredClone(runtimeSuccess),
  provider: {
    ...structuredClone(runtimeSuccess.provider),
    providerModelId: 'different-provider-model',
  },
})
await expectApiError(() => readWithReceipt(
  wrongModelReceipt,
  createLocator(wrongModelReceipt),
), 'VALIDATION_FAILED')

const wrongRouteReceipt = rehashReceipt({
  ...structuredClone(runtimeSuccess),
  provider: {
    ...structuredClone(runtimeSuccess.provider),
    providerRouteId: 'different-provider-route',
  },
})
await expectApiError(() => readWithReceipt(
  wrongRouteReceipt,
  createLocator(wrongRouteReceipt),
), 'VALIDATION_FAILED')

const missingOutput = rehashReceipt({
  ...structuredClone(runtimeSuccess),
  privateOutput: null,
  privateOutputs: [],
  outputSet: {
    ...structuredClone(runtimeSuccess.outputSet),
    outputCount: 0,
  },
})
await expectApiError(() => readWithReceipt(
  missingOutput,
  createLocator(missingOutput),
), 'VALIDATION_FAILED')

const missingLease = structuredClone(runtimeSuccess) as unknown as Record<string, unknown>
delete (missingLease.queue as Record<string, unknown>).leaseId
await expectApiError(() => readWithReceipt(
  missingLease as unknown as CanonicalProviderAttemptConsumerReceipt,
  locator,
), 'VALIDATION_FAILED')

const missingDispatch = structuredClone(runtimeSuccess) as unknown as
  Record<string, unknown>
delete (missingDispatch.dispatch as Record<string, unknown>).grantId
await expectApiError(() => readWithReceipt(
  missingDispatch as unknown as CanonicalProviderAttemptConsumerReceipt,
  locator,
), 'VALIDATION_FAILED')

const missingCost = structuredClone(runtimeSuccess) as unknown as Record<string, unknown>
delete (missingCost.internalCost as Record<string, unknown>)
  .providerAttemptEvidenceHash
await expectApiError(() => readWithReceipt(
  missingCost as unknown as CanonicalProviderAttemptConsumerReceipt,
  locator,
), 'VALIDATION_FAILED')

await expectApiError(() => readCanonicalProviderAttemptRuntimeRecord({
  hosted: true,
  port: completeControlledPort,
  locator,
  projectedAt: at(10_000),
}), 'TOOL_NOT_READY')
await expectApiError(() => readCanonicalProviderAttemptRuntimeRecord({
  hosted: false,
  locator,
  projectedAt: at(10_000),
}), 'TOOL_NOT_READY')

const forgedQualification: CanonicalProviderAttemptReleaseQualificationCapability = {
  contractVersion: CANONICAL_PROVIDER_ATTEMPT_RELEASE_QUALIFICATION_VERSION,
  capabilityClass: 'server_owned_provider_attempt_release_qualification',
  readCurrentReleaseIdentity: async () => currentReleaseIdentity,
}
const forgedRepository: CanonicalProviderAttemptReleasedRepositoryAdapter = {
  contractVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION,
  sourceAuthority: 'canonical_provider_attempt_release_evidence_repository',
  readExactAttempt: async () => ({
    state: 'attempt_record',
    receipt: runtimeSuccess,
    releaseEvidence,
  }),
}
assert.throws(
  () => createQualifiedCanonicalProviderAttemptRuntimeRecordPort({
    qualification: forgedQualification,
    repository: forgedRepository,
  }),
  (error: unknown) => error instanceof ApiError && error.code === 'TOOL_NOT_READY',
)

const forgedPort = {
  contractVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION,
  sourceAuthority: 'canonical_provider_attempt_release_evidence_repository' as const,
  evidenceClass: 'canonical_same_release_live_runtime' as const,
  productionAuthority: true,
  readExactAttempt: forgedRepository.readExactAttempt,
  readCurrentReleaseIdentity: forgedQualification.readCurrentReleaseIdentity,
}
await expectApiError(() => readCanonicalProviderAttemptRuntimeRecord({
  hosted: true,
  port: forgedPort,
  locator,
  projectedAt: at(10_000),
}), 'TOOL_NOT_READY')

const serialized = JSON.stringify({
  complete,
  failed,
  unknown,
  neverSubmitted,
  cancelled,
})
for (const forbidden of [
  'secret-value',
  'api-key',
  'authorization-bearer',
  '"rawPrompt":',
  '"requestBody":',
  '"providerUrl":"',
  '"customerPrice":',
  '"customerCredits":',
  '"serviceFee":',
  '"wallet":',
  'https://',
  'http://',
  '/tmp/',
]) assert.equal(serialized.includes(forbidden), false)

console.log(JSON.stringify({
  ok: true,
  contractVersion: CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_VERSION,
  outcomesProven: [
    'never_submitted',
    'completed',
    'failed',
    'cancelled',
    'unknown_reconciliation_required',
    'unknown_reconciled_completed',
    'unknown_reconciled_failed',
  ],
  releasePromotionAvailable: false,
  workerInfrastructureCostReconciled: false,
  providerRequestCount: 0,
  secretPayloadReadCount: 0,
  cloudMutationCount: 0,
  supabaseMutationCount: 0,
  billingMutationCount: 0,
  deploymentCount: 0,
  productionReady: false,
}, null, 2))

function createReceipt(input: {
  evidenceClass:
    | 'private_injected_nonprovider_test'
    | 'canonical_backend_runtime_unreleased'
  terminalState:
    CanonicalProviderAttemptConsumerReceipt['dispatch']['terminalState']
}): CanonicalProviderAttemptConsumerReceipt {
  const injected = input.evidenceClass === 'private_injected_nonprovider_test'
  const success = input.terminalState === 'succeeded' ||
    input.terminalState === 'unknown_reconciled_succeeded'
  const unknown = input.terminalState.startsWith('unknown_')
  const reconciled = input.terminalState.startsWith('unknown_reconciled_')
  const requestStarted = !injected
  const providerCostMicros = input.terminalState ===
    'unknown_reconciliation_required'
    ? null
    : requestStarted ? 2_000 : 0
  const providerUsageEvidenceDigest = providerCostMicros === null
    ? null
    : digest(`provider-usage-${input.evidenceClass}-${input.terminalState}`)
  const dispatchAttemptHash = digest(`dispatch-attempt-${input.terminalState}`)
  const terminalHash = digest(`terminal-${input.terminalState}`)
  const privateOutputs = success
    ? [{
        outputId: `output-${input.terminalState}`,
        role: policy.expectedOutput.role,
        assetId: `asset-${input.terminalState}`,
        assetVersionId: `asset-version-${input.terminalState}`,
        privateObjectIdentityHash: digest(`object-${input.terminalState}`),
        contentSha256: digest(`content-${input.terminalState}`),
        byteLength: 4096,
        mimeType: 'audio/wav' as const,
        artifactEvidenceDigest: digest(`artifact-${input.terminalState}`),
        storageEvidenceHash: digest(`storage-${input.terminalState}`),
        sourceReadbackEvidenceHash: digest(`readback-${input.terminalState}`),
        providerGenerated: !injected,
        createOnly: true as const,
        checksumReadbackVerified: true as const,
        providerUrlPersisted: false as const,
        localPathProjected: false as const,
      }]
    : []
  const outputSetDigest = sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-private-output-set:v1',
    dispatchAttemptHash,
    terminalHash,
    outputs: privateOutputs,
  })
  const selectedInfrastructureCostMicros = 1_000
  const selectedTotalInternalCostMicros = providerCostMicros === null
    ? null
    : providerCostMicros + selectedInfrastructureCostMicros
  const requestCount = requestStarted ? 1 as const : 0 as const
  const observedCount = requestStarted ? 1 : 0
  const payload = {
    schemaVersion: 'canonical-provider-attempt-consumer-receipt-v2' as const,
    source: 'verified_private_canonical_provider_attempt_stores' as const,
    receiptId: `receipt-${input.evidenceClass}-${input.terminalState}`,
    evidenceClass: input.evidenceClass,
    promotionClass: injected
      ? 'non_promotable_private_injected' as const
      : 'unreleased_runtime_not_production' as const,
    identity: {
      ownerUserId: 'user-owner',
      workspaceId: 'workspace-one',
      projectId: 'project-one',
      editSessionId: 'edit-one',
      approvedPlanSnapshotId: 'snapshot-one',
      approvedPlanSnapshotHash: digest('snapshot'),
      packageRecordId: 'package-one',
      packageHash: digest('package'),
      workGraphHash: digest('work-graph'),
      approvedWorkItemId: 'work-item-one',
      approvedWorkItemHash: digest('work-item'),
      queueDefinitionHash: digest('queue-definition'),
      queueJobId: 'queue-job-one',
      queueJobDefinitionHash: digest('queue-job-definition'),
      placementHash: digest('placement'),
      authorizationHash: digest('authorization'),
      authorizationRequestHash: digest('authorization-request'),
      sourceRequestId: 'source-request-one',
      sourceRequestDigest: digest('source-request'),
      providerRequestPayloadDigest: digest('provider-request-payload'),
      projectDataPolicyDigest: digest('data-policy'),
      providerAccountPolicyDigest: digest('provider-account-policy'),
      idempotencyKeyHash: digest('idempotency-key'),
    },
    consumerContext: {
      schemaVersion: 'canonical-provider-attempt-consumer-context-v1' as const,
      contextClass: 'source_verified_exact_edit_approved_work_item' as const,
      consumerContextId: 'consumer-context-one',
      consumerContextDigest: digest('consumer-context'),
      derivation:
        'owner_workspace_project_edit_snapshot_package_work_item_job_operation_output' as const,
      productionBindingIncluded: false as const,
      callerAssertedProductionIdAccepted: false as const,
      consumerOwnedProductionBindingRequired: true as const,
    },
    provider: {
      operationId: policy.operationId,
      operationProfileHash: digest('operation-profile'),
      intent: policy.intent,
      providerBoundaryProfileId: policy.providerBoundaryProfileId,
      providerRouteId: policy.providerRouteId,
      providerModelId: policy.providerModelId,
      lifecyclePolicyVersion: policy.schemaVersion,
      lifecyclePolicyHash: policy.policyHash,
    },
    timing: {
      startedAt: at(1_000),
      completedAt: at(2_000),
    },
    requestAccounting: {
      legacyV1ProviderRequestCount: requestCount,
      legacyV1MaximumProviderRequests: 1 as const,
      legacyV1Semantic:
        'generation_submission_count_not_total_http_requests' as const,
      accountedGenerationSubmissionCount: requestCount,
      injectedSimulationGenerationSubmissionCount:
        injected ? requestCount : 0 as const,
      observedTransport: {
        privateInputUploadCount: 0,
        generationSubmissionCount: observedCount,
        statusReadCount: 0,
        resultReadCount: 0,
        binaryDownloadCount: 0,
        cancellationCount: 0,
        totalLifecycleHttpRequestCount: observedCount,
      },
      ceilings: policy.requestCeilings,
      continuationRequestsBelongToSameAttempt: true as const,
      unknownOutcomeBlocksNewSubmission: true as const,
    },
    queue: {
      aggregateHash: digest('queue-aggregate'),
      entryHash: digest('queue-entry'),
      state: success ? 'completed' as const : 'leased' as const,
      claimId: 'queue-attempt-one',
      claimHash: digest('queue-attempt'),
      queueAttemptId: 'queue-attempt-one',
      leaseId: 'queue-attempt-one',
      leaseHash: digest('queue-attempt'),
      queueAttemptAndLeaseSemantic:
        'canonical_provider_queue_claim_is_attempt_and_lease' as const,
      deliveryAttempt: 1,
      claimExpiresAt: at(60_000),
      providerExecutionFenceHash: digest('provider-execution-fence'),
      providerExecutionState: input.terminalState === 'succeeded' ||
        input.terminalState === 'failed'
        ? 'terminal_known' as const
        : input.terminalState === 'unknown_reconciliation_required'
          ? 'terminal_unknown' as const
          : input.terminalState,
      terminalQueueCompletion: success,
      unknownOutcomeReconciled: reconciled,
    },
    dispatch: {
      aggregateHash: digest('dispatch-aggregate'),
      grantId: 'dispatch-grant-one',
      immutableGrantHash: digest('dispatch-grant'),
      dispatchAttemptId: 'dispatch-attempt-one',
      dispatchAttemptHash,
      consumptionCount: 1 as const,
      providerRequestStarted: requestStarted,
      terminalId: `terminal-${input.terminalState}`,
      terminalHash,
      terminalSequence: reconciled ? 2 as const : 1 as const,
      terminalState: input.terminalState,
      retryCount: 0 as const,
      fallbackCount: 0 as const,
      sanitizedFailureCode: success ? null : 'provider_safe_failure',
    },
    privateOutput: privateOutputs[0] ?? null,
    privateOutputs,
    outputSet: {
      schemaVersion: 'canonical-provider-private-output-set-v1' as const,
      sourceAuthorityClass: 'canonical_v1_zero_or_one_source' as const,
      outputCount: privateOutputs.length,
      outputSetDigest,
      multiOutputProviderOperationAdmitted: false,
    },
    internalCost: {
      providerAttemptEvidenceHash: digest(`provider-cost-${input.terminalState}`),
      providerUsageEvidenceDigest,
      providerRateCardDigest: digest('provider-rate-card'),
      providerCostMicros,
      providerCostReconciled: providerCostMicros !== null,
      legacyProvisionalInfrastructureRateCardDigest:
        digest('legacy-worker-rate-card'),
      legacyProvisionalInfrastructureCostMicros: 1_000,
      legacyProvisionalTotalInternalCostMicros: selectedTotalInternalCostMicros,
      workerResourceEvidenceHash: digest('worker-resource'),
      workerInfrastructureEvidenceDigest: digest('worker-infrastructure'),
      workerInfrastructureRateCardDigest: digest('worker-rate-card'),
      selectedInfrastructureRateCardDigest: digest('worker-rate-card'),
      observedWorkerInfrastructureCostMicros: selectedInfrastructureCostMicros,
      selectedInfrastructureCostMicros,
      selectedTotalInternalCostMicros,
      placeholderInfrastructureRate: true as const,
      infrastructureInvoiceReconciled: false as const,
      providerCostIncludedInWorkerEvidence: false as const,
      legacyProvisionalInfrastructureAddedToSelectedTotal: false as const,
      failedOrUnknownAttemptCostRetained: true as const,
      internalProductionCostOnly: true as const,
    },
    workerResourceUsage: {
      evidenceClass: injected
        ? 'private_injected_observed_usage_test' as const
        : 'canonical_backend_observed_usage_unreleased' as const,
      attemptIdentityHash: digest('worker-attempt'),
      runtimeExecutionIdentityDigest: digest('runtime-execution'),
      containerIdentityDigest: digest('container'),
      wallTimeMilliseconds: 500,
      observedCpuMicroseconds: 100_000,
      observedPeakMemoryBytes: 16_777_216,
      observedGpuActiveMilliseconds: 0,
      networkEgressBytes: requestStarted ? 4096 : 0,
      outcomeState: success ? 'completed' as const
        : unknown ? 'unknown' as const
          : 'failed' as const,
    },
    boundaries: {
      hashesAndSafeIdentityOnly: true as const,
      rawCredentialIncluded: false as const,
      rawPromptOrRequestBodyIncluded: false as const,
      providerUrlIncluded: false as const,
      credentialValueLogged: false as const,
      requestBodyPersistedInQueue: false as const,
      callerSelectedExecutableAllowed: false as const,
      callerSelectedProviderRouteAllowed: false as const,
      browserAuthorityIncluded: false as const,
      commercialAuthorityIncluded: false as const,
      providerTransportActivated: false as const,
      distributedPersistenceProven: false as const,
      sourceVerified: true as const,
      canonicalBackendVerifiedRuntime: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
    },
    projectedAt: at(3_000),
  }
  return canonicalProviderAttemptConsumerReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

function createLocator(receipt: CanonicalProviderAttemptConsumerReceipt) {
  return createCanonicalProviderAttemptRuntimeLocator({
    ownerUserId: receipt.identity.ownerUserId,
    workspaceId: receipt.identity.workspaceId,
    projectId: receipt.identity.projectId,
    editSessionId: receipt.identity.editSessionId,
    approvedPlanSnapshotId: receipt.identity.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: receipt.identity.approvedPlanSnapshotHash,
    packageRecordId: receipt.identity.packageRecordId,
    packageHash: receipt.identity.packageHash,
    workGraphHash: receipt.identity.workGraphHash,
    approvedWorkItemId: receipt.identity.approvedWorkItemId,
    approvedWorkItemHash: receipt.identity.approvedWorkItemHash,
    queueDefinitionHash: receipt.identity.queueDefinitionHash,
    queueJobId: receipt.identity.queueJobId,
    queueJobDefinitionHash: receipt.identity.queueJobDefinitionHash,
    authorizationHash: receipt.identity.authorizationHash,
    dispatchAttemptId: receipt.dispatch.dispatchAttemptId,
    operationId: CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
    sourceRequestId: receipt.identity.sourceRequestId,
    expectedOutputSetDigest: receipt.outputSet.outputSetDigest,
  })
}

function createCurrentReleaseIdentity(
  overrides: Partial<CanonicalProviderAttemptCurrentReleaseIdentity> = {},
): CanonicalProviderAttemptCurrentReleaseIdentity {
  const overrideFields = { ...overrides }
  delete overrideFields.identityDigest
  const payload = {
    schemaVersion: 'canonical-provider-attempt-current-release-identity-v1' as const,
    sourceAuthority: 'server_owned_current_release_identity_repository' as const,
    releaseId: 'release-one',
    sourceCommit: 'a'.repeat(40),
    sourceTree: 'b'.repeat(40),
    deploymentRevision: 'provider-runtime-revision-one',
    runtimeImageDigest: digest('runtime-image'),
    buildProvenanceDigest: digest('build-provenance'),
    queueRuntimeEvidenceDigest: digest('queue-runtime'),
    leaseRuntimeEvidenceDigest: digest('lease-runtime'),
    outputRepositoryEvidenceDigest: digest('output-repository-runtime'),
    providerRateAuthorityEvidenceDigest: digest('provider-rate-runtime'),
    workerCostAuthorityEvidenceDigest: digest('worker-cost-runtime'),
    recordedAt: at(4_000),
    ...overrideFields,
  }
  return {
    ...payload,
    identityDigest: sha256AuthorityValue(payload),
  }
}

function createReleaseEvidence(
  receipt: CanonicalProviderAttemptConsumerReceipt,
  locatorDigest: string,
  current: CanonicalProviderAttemptCurrentReleaseIdentity,
): CanonicalProviderAttemptReleaseEvidence {
  const payload = {
    schemaVersion: 'canonical-provider-attempt-release-evidence-v1' as const,
    evidenceClass: 'canonical_same_release_provider_runtime_evidence' as const,
    sourceAuthority:
      'canonical_provider_attempt_release_evidence_repository' as const,
    releaseId: current.releaseId,
    sourceCommit: current.sourceCommit,
    sourceTree: current.sourceTree,
    deploymentRevision: current.deploymentRevision,
    runtimeImageDigest: current.runtimeImageDigest,
    currentReleaseIdentityDigest: current.identityDigest,
    sourceReceiptHash: receipt.receiptHash,
    locatorDigest,
    authorizationHash: receipt.identity.authorizationHash,
    dispatchAttemptId: receipt.dispatch.dispatchAttemptId,
    operationId: CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
    serviceIdentityEvidenceDigest: digest('service-identity'),
    pinnedSecretBindingEvidenceDigest: digest('pinned-secret-binding'),
    providerTransportQualificationDigest: digest('provider-transport'),
    providerAccountQualificationDigest: digest('provider-account'),
    immutableProviderRevisionEvidenceDigest: digest('immutable-provider-revision'),
    queueRuntimeEvidenceDigest: current.queueRuntimeEvidenceDigest,
    leaseRuntimeEvidenceDigest: current.leaseRuntimeEvidenceDigest,
    oneUseDispatchEvidenceDigest: digest('one-use-dispatch'),
    outputRepositoryEvidenceDigest: current.outputRepositoryEvidenceDigest,
    privateOutputReadbackEvidenceDigest: digest('private-output-readback'),
    providerRateAuthorityEvidenceDigest:
      current.providerRateAuthorityEvidenceDigest,
    providerUsageAndCostEvidenceDigest: digest('provider-usage-and-cost'),
    workerResourceUsageEvidenceDigest: digest('worker-resource-usage'),
    workerCostAuthorityEvidenceDigest: current.workerCostAuthorityEvidenceDigest,
    workerInfrastructureCostSettlementEvidenceDigest:
      digest('worker-cost-settlement'),
    sameReleaseAcceptanceEvidenceDigest: digest('same-release-acceptance'),
    verifiedAt: at(5_000),
    gates: {
      exactSourceAndTreeDeployed: true as const,
      immutableRuntimeImageVerified: true as const,
      workloadIdentityVerified: true as const,
      serviceAccountJsonKeyAbsent: true as const,
      exactPinnedSecretVersionVerified: true as const,
      directEnvironmentSecretFallbackRejected: true as const,
      githubSecretRuntimeAuthorityRejected: true as const,
      canonicalQueueLeaseAndIdempotencyVerified: true as const,
      oneUseProviderDispatchVerified: true as const,
      providerTransportQualified: true as const,
      providerAccountModelAndFundsQualified: true as const,
      immutableProviderRevisionQualified: true as const,
      providerRateAuthorityQualified: true as const,
      privateCreateOnlyOutputReadbackVerified: true as const,
      providerUsageAndCostReconciled: true as const,
      workerResourceUsageObserved: true as const,
      workerInfrastructureRateAuthorityQualified: true as const,
      workerInfrastructureCostReconciled: true as const,
      failedAndUnknownAttemptCostRetained: true as const,
      sameReleaseProtectedAcceptanceVerified: true as const,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    deliveryBoundary: {
      privateInternalTestingOnly: true as const,
      browserAuthorityIncluded: false as const,
      publicDeliveryAuthorized: false as const,
      productionReady: false as const,
    },
  }
  return {
    ...payload,
    evidenceDigest: sha256AuthorityValue(payload),
  }
}

function createNonExecutionEvidence(input: {
  state: 'never_submitted' | 'cancelled'
  locatorDigest: string
}): CanonicalProviderAttemptNonExecutionEvidence {
  const cancelled = input.state === 'cancelled'
  const payload = {
    schemaVersion: 'canonical-provider-attempt-non-execution-evidence-v1' as const,
    sourceAuthority: 'canonical_provider_attempt_lifecycle_repository' as const,
    attemptState: input.state,
    locatorDigest: input.locatorDigest,
    queueDefinitionHash: digest('queue-definition'),
    queueEntryHash: cancelled ? digest('cancelled-queue-entry') : null,
    queueState: cancelled ? 'leased' as const : null,
    queueAttemptId: cancelled ? 'queue-attempt-one' : null,
    leaseId: cancelled ? 'queue-attempt-one' : null,
    leaseHash: cancelled ? digest('queue-attempt') : null,
    dispatchGrantId: cancelled ? 'dispatch-grant-one' : null,
    dispatchGrantHash: cancelled ? digest('dispatch-grant') : null,
    dispatchAttemptId: cancelled ? 'dispatch-attempt-one' : null,
    providerRouteId: policy.providerRouteId,
    providerModelId: policy.providerModelId,
    providerRequestStarted: cancelled,
    providerRequestCount: cancelled ? 1 as const : 0 as const,
    providerAttemptCostEvidenceHash: cancelled
      ? digest('cancelled-provider-cost')
      : null,
    workerResourceEvidenceHash: cancelled
      ? digest('cancelled-worker-resource')
      : null,
    failedOrUnknownAttemptCostRetained: true as const,
    cancellationReceiptDigest: cancelled
      ? digest('cancellation-receipt')
      : null,
    canonicalCheckbackPermitDigest: null,
    fallbackAllowed: false as const,
    rerunAllowed: false as const,
    recordedAt: at(3_000),
  }
  return {
    ...payload,
    evidenceDigest: sha256AuthorityValue(payload),
  }
}

async function readWithReceipt(
  receipt: CanonicalProviderAttemptConsumerReceipt,
  exactLocator: ReturnType<typeof createLocator>,
) {
  return readCanonicalProviderAttemptRuntimeRecord({
    hosted: false,
    port: createControlledCanonicalProviderAttemptRuntimeRecordPort({
      readExactAttempt: async () => ({
        state: 'attempt_record',
        receipt,
        releaseEvidence: null,
      }),
    }),
    locator: exactLocator,
    projectedAt: at(10_000),
  })
}

function rehashReceipt(
  input: Omit<CanonicalProviderAttemptConsumerReceipt, 'receiptHash'> & {
    receiptHash?: string
  },
): CanonicalProviderAttemptConsumerReceipt {
  const payload = { ...input }
  delete payload.receiptHash
  return {
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  } as CanonicalProviderAttemptConsumerReceipt
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === code)
}

function digest(label: string): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-runtime-record-smoke:v1',
    label,
  })
}
