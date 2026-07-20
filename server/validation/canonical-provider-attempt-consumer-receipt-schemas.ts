import { z } from 'zod'

import {
  CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION,
  canonicalProviderLifecycleRequestCountsSchema,
} from '../edit-architecture/canonical-provider-lifecycle-policy'

export const CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION =
  'canonical-provider-attempt-consumer-receipt-v2' as const
export const CANONICAL_PROVIDER_ATTEMPT_CONSUMER_CONTEXT_VERSION =
  'canonical-provider-attempt-consumer-context-v1' as const
export const CANONICAL_PROVIDER_PRIVATE_OUTPUT_SET_VERSION =
  'canonical-provider-private-output-set-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const boundedProviderIdentity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const requestCount = z.union([z.literal(0), z.literal(1)])
const privateOutputProjectionSchema = z.object({
  outputId: identity,
  role: identity,
  assetId: identity,
  assetVersionId: identity,
  privateObjectIdentityHash: sha256,
  contentSha256: sha256,
  byteLength: z.number().int().positive().max(256 * 1024 * 1024),
  mimeType: z.enum([
    'audio/wav',
    'video/mp4',
    'audio/mpeg',
    'application/json',
  ]),
  artifactEvidenceDigest: sha256,
  storageEvidenceHash: sha256,
  sourceReadbackEvidenceHash: sha256,
  providerGenerated: z.boolean(),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
}).strict()

export const canonicalProviderAttemptConsumerReceiptSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION),
  source: z.literal('verified_private_canonical_provider_attempt_stores'),
  receiptId: identity,
  evidenceClass: z.enum([
    'private_injected_nonprovider_test',
    'canonical_backend_runtime_unreleased',
  ]),
  promotionClass: z.enum([
    'non_promotable_private_injected',
    'unreleased_runtime_not_production',
  ]),
  identity: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    approvedPlanSnapshotHash: sha256,
    packageRecordId: identity,
    packageHash: sha256,
    workGraphHash: sha256,
    approvedWorkItemId: identity,
    approvedWorkItemHash: sha256,
    queueDefinitionHash: sha256,
    queueJobId: identity,
    queueJobDefinitionHash: sha256,
    placementHash: sha256,
    authorizationHash: sha256,
    authorizationRequestHash: sha256,
    sourceRequestId: identity,
    sourceRequestDigest: sha256,
    providerRequestPayloadDigest: sha256,
    projectDataPolicyDigest: sha256,
    providerAccountPolicyDigest: sha256,
    idempotencyKeyHash: sha256,
  }).strict(),
  consumerContext: z.object({
    schemaVersion: z.literal(
      CANONICAL_PROVIDER_ATTEMPT_CONSUMER_CONTEXT_VERSION,
    ),
    contextClass: z.literal(
      'source_verified_exact_edit_approved_work_item',
    ),
    consumerContextId: identity,
    consumerContextDigest: sha256,
    derivation: z.literal(
      'owner_workspace_project_edit_snapshot_package_work_item_job_operation_output',
    ),
    productionBindingIncluded: z.literal(false),
    callerAssertedProductionIdAccepted: z.literal(false),
    consumerOwnedProductionBindingRequired: z.literal(true),
  }).strict(),
  provider: z.object({
    operationId: boundedProviderIdentity,
    operationProfileHash: sha256,
    intent: identity,
    providerBoundaryProfileId: identity,
    providerRouteId: identity,
    providerModelId: boundedProviderIdentity,
    lifecyclePolicyVersion: z.literal(CANONICAL_PROVIDER_LIFECYCLE_POLICY_VERSION),
    lifecyclePolicyHash: sha256,
  }).strict(),
  timing: z.object({
    startedAt: timestamp,
    completedAt: timestamp,
  }).strict(),
  requestAccounting: z.object({
    legacyV1ProviderRequestCount: requestCount,
    legacyV1MaximumProviderRequests: z.literal(1),
    legacyV1Semantic: z.literal(
      'generation_submission_count_not_total_http_requests',
    ),
    accountedGenerationSubmissionCount: requestCount,
    injectedSimulationGenerationSubmissionCount: requestCount,
    observedTransport: canonicalProviderLifecycleRequestCountsSchema,
    ceilings: canonicalProviderLifecycleRequestCountsSchema,
    continuationRequestsBelongToSameAttempt: z.literal(true),
    unknownOutcomeBlocksNewSubmission: z.literal(true),
  }).strict(),
  queue: z.object({
    aggregateHash: sha256,
    entryHash: sha256,
    state: z.enum(['queued', 'leased', 'completed']),
    claimId: identity,
    claimHash: sha256,
    queueAttemptId: identity,
    leaseId: identity,
    leaseHash: sha256,
    queueAttemptAndLeaseSemantic: z.literal(
      'canonical_provider_queue_claim_is_attempt_and_lease',
    ),
    deliveryAttempt: z.number().int().positive().max(10),
    claimExpiresAt: timestamp,
    providerExecutionFenceHash: sha256,
    providerExecutionState: z.enum([
      'terminal_known',
      'terminal_unknown',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    terminalQueueCompletion: z.boolean(),
    unknownOutcomeReconciled: z.boolean(),
  }).strict(),
  dispatch: z.object({
    aggregateHash: sha256,
    grantId: identity,
    immutableGrantHash: sha256,
    dispatchAttemptId: identity,
    dispatchAttemptHash: sha256,
    consumptionCount: z.literal(1),
    providerRequestStarted: z.boolean(),
    terminalId: identity,
    terminalHash: sha256,
    terminalSequence: z.union([z.literal(1), z.literal(2)]),
    terminalState: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    retryCount: z.literal(0),
    fallbackCount: z.literal(0),
    sanitizedFailureCode: identity.nullable(),
  }).strict(),
  privateOutput: privateOutputProjectionSchema.nullable(),
  privateOutputs: z.array(privateOutputProjectionSchema).max(8),
  outputSet: z.object({
    schemaVersion: z.literal(CANONICAL_PROVIDER_PRIVATE_OUTPUT_SET_VERSION),
    sourceAuthorityClass: z.enum([
      'canonical_v1_zero_or_one_source',
      'forward_multi_output_same_attempt_source',
    ]),
    outputCount: z.number().int().nonnegative().max(8),
    outputSetDigest: sha256,
    multiOutputProviderOperationAdmitted: z.boolean(),
  }).strict(),
  internalCost: z.object({
    providerAttemptEvidenceHash: sha256,
    providerUsageEvidenceDigest: sha256.nullable(),
    providerRateCardDigest: sha256,
    providerCostMicros: safeMicros.nullable(),
    providerCostReconciled: z.boolean(),
    legacyProvisionalInfrastructureRateCardDigest: sha256,
    legacyProvisionalInfrastructureCostMicros: safeMicros,
    legacyProvisionalTotalInternalCostMicros: safeMicros.nullable(),
    workerResourceEvidenceHash: sha256,
    workerInfrastructureEvidenceDigest: sha256,
    workerInfrastructureRateCardDigest: sha256,
    selectedInfrastructureRateCardDigest: sha256,
    observedWorkerInfrastructureCostMicros: safeMicros,
    selectedInfrastructureCostMicros: safeMicros,
    selectedTotalInternalCostMicros: safeMicros.nullable(),
    placeholderInfrastructureRate: z.literal(true),
    infrastructureInvoiceReconciled: z.literal(false),
    providerCostIncludedInWorkerEvidence: z.literal(false),
    legacyProvisionalInfrastructureAddedToSelectedTotal: z.literal(false),
    failedOrUnknownAttemptCostRetained: z.literal(true),
    internalProductionCostOnly: z.literal(true),
  }).strict(),
  workerResourceUsage: z.object({
    evidenceClass: z.enum([
      'private_injected_observed_usage_test',
      'canonical_backend_observed_usage_unreleased',
    ]),
    attemptIdentityHash: sha256,
    runtimeExecutionIdentityDigest: sha256,
    containerIdentityDigest: sha256,
    wallTimeMilliseconds: z.number().int().positive(),
    observedCpuMicroseconds: z.number().int().nonnegative(),
    observedPeakMemoryBytes: z.number().int().nonnegative(),
    observedGpuActiveMilliseconds: z.number().int().nonnegative(),
    networkEgressBytes: z.number().int().nonnegative(),
    outcomeState: z.enum(['completed', 'failed', 'unknown']),
  }).strict(),
  boundaries: z.object({
    hashesAndSafeIdentityOnly: z.literal(true),
    rawCredentialIncluded: z.literal(false),
    rawPromptOrRequestBodyIncluded: z.literal(false),
    providerUrlIncluded: z.literal(false),
    credentialValueLogged: z.literal(false),
    requestBodyPersistedInQueue: z.literal(false),
    callerSelectedExecutableAllowed: z.literal(false),
    callerSelectedProviderRouteAllowed: z.literal(false),
    browserAuthorityIncluded: z.literal(false),
    commercialAuthorityIncluded: z.literal(false),
    providerTransportActivated: z.literal(false),
    distributedPersistenceProven: z.literal(false),
    sourceVerified: z.literal(true),
    canonicalBackendVerifiedRuntime: z.literal(false),
    promotionAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  projectedAt: timestamp,
  receiptHash: sha256,
}).strict().superRefine((value, context) => {
  const success = ['succeeded', 'unknown_reconciled_succeeded'].includes(
    value.dispatch.terminalState,
  )
  const observed = value.requestAccounting.observedTransport
  const ceilings = value.requestAccounting.ceilings
  const observedCounts = [
    'privateInputUploadCount',
    'generationSubmissionCount',
    'statusReadCount',
    'resultReadCount',
    'binaryDownloadCount',
    'cancellationCount',
    'totalLifecycleHttpRequestCount',
  ] as const
  const selectedTotal = value.internalCost.providerCostMicros === null
    ? null
    : value.internalCost.providerCostMicros +
      value.internalCost.selectedInfrastructureCostMicros
  const projectedPrimaryOutput = value.privateOutputs[0] ?? null
  const outputProjectionMatches =
    JSON.stringify(value.privateOutput) === JSON.stringify(projectedPrimaryOutput)
  const legacyOutputAuthority =
    value.outputSet.sourceAuthorityClass === 'canonical_v1_zero_or_one_source'
  if (
    value.requestAccounting.accountedGenerationSubmissionCount !==
      value.requestAccounting.legacyV1ProviderRequestCount ||
    observedCounts.some((key) => observed[key] > ceilings[key]) ||
    value.requestAccounting.observedTransport.generationSubmissionCount !==
      (value.dispatch.providerRequestStarted
        ? value.requestAccounting.legacyV1ProviderRequestCount
        : 0) ||
    value.internalCost.selectedInfrastructureCostMicros !==
      value.internalCost.observedWorkerInfrastructureCostMicros ||
    value.internalCost.selectedInfrastructureRateCardDigest !==
      value.internalCost.workerInfrastructureRateCardDigest ||
    value.internalCost.selectedTotalInternalCostMicros !== selectedTotal ||
    value.internalCost.providerCostReconciled !==
      (value.internalCost.providerCostMicros !== null) ||
    success !== (value.privateOutputs.length > 0) ||
    !outputProjectionMatches ||
    value.outputSet.outputCount !== value.privateOutputs.length ||
    (legacyOutputAuthority && (
      value.privateOutputs.length > 1 ||
      value.outputSet.multiOutputProviderOperationAdmitted
    )) ||
    (!legacyOutputAuthority &&
      !value.outputSet.multiOutputProviderOperationAdmitted) ||
    Date.parse(value.timing.completedAt) < Date.parse(value.timing.startedAt) ||
    Date.parse(value.projectedAt) < Date.parse(value.timing.completedAt) ||
    value.queue.queueAttemptId !== value.queue.claimId ||
    value.queue.leaseId !== value.queue.claimId ||
    value.queue.leaseHash !== value.queue.claimHash ||
    success !== (value.dispatch.sanitizedFailureCode === null) ||
    value.queue.terminalQueueCompletion !== success ||
    value.queue.unknownOutcomeReconciled !==
      value.dispatch.terminalState.startsWith('unknown_reconciled_') ||
    (value.evidenceClass === 'private_injected_nonprovider_test' && (
      value.promotionClass !== 'non_promotable_private_injected' ||
      observed.totalLifecycleHttpRequestCount !== 0 ||
      value.requestAccounting.injectedSimulationGenerationSubmissionCount !==
        value.requestAccounting.legacyV1ProviderRequestCount
    )) ||
    (value.evidenceClass === 'canonical_backend_runtime_unreleased' && (
      value.promotionClass !== 'unreleased_runtime_not_production' ||
      value.requestAccounting.injectedSimulationGenerationSubmissionCount !== 0
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical provider-attempt consumer receipt is inconsistent.',
    })
  }
})

export type CanonicalProviderAttemptConsumerReceipt = z.infer<
  typeof canonicalProviderAttemptConsumerReceiptSchema
>
