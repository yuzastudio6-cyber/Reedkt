import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  motionStudioProviderAttemptConsumptionExpectationV1Schema,
  type MotionStudioProviderAttemptConsumptionExpectationV1,
} from './canonical-provider-attempt-port'

export const CANONICAL_BACKEND_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION =
  'canonical-provider-attempt-consumer-receipt-v2' as const
export const CANONICAL_BACKEND_PROVIDER_ATTEMPT_CONSUMER_CONTEXT_VERSION =
  'canonical-provider-attempt-consumer-context-v1' as const
export const CANONICAL_BACKEND_PROVIDER_PRIVATE_OUTPUT_SET_VERSION =
  'canonical-provider-private-output-set-v1' as const
export const CANONICAL_BACKEND_PROVIDER_LIFECYCLE_POLICY_VERSION =
  'canonical-provider-lifecycle-policy-v2' as const
export const MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_RECEIPT_CONSUMPTION_VERSION =
  'motion-studio.canonical-backend-provider-receipt-consumption.v1' as const
export const MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_PRODUCTION_BINDING_VERSION =
  'motion-studio.canonical-backend-provider-production-binding.v1' as const
export const CANONICAL_BACKEND_LYRIA_OPERATION_PROFILE_HASH =
  '4d46b379b4411d47b452e5f1e6406465808387b662c3f0d4b3a31ad6b5f63abd' as const
export const CANONICAL_BACKEND_LYRIA_LIFECYCLE_POLICY_HASH =
  '0f172e3c9e7620676bf437f21d8e572895f49bd7f15857a8ea9e886ddfd13952' as const
export const CANONICAL_BACKEND_FOLEY_LIFECYCLE_POLICY_HASH =
  '315d74dd2cb328f6c592797cf734aca42a9fe1b0a43f23596f5e6d6dbb96d52e' as const
export const MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_PIN_VERSION =
  'motion-studio.canonical-backend-provider-source-pin.v1' as const

const canonicalBackendProviderSourcePinBase = {
  schemaVersion: MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_PIN_VERSION,
  backendBranch: 'codex/backend-workflow-pipeline-continuation',
  backendCommitSha: 'a792a882929771d9d8e9a62f43f26852f5d65ec8',
  backendTreeSha: 'd545d912ac60394a0d951db58a5f222e940523e4',
  primaryVerdict:
    'CANONICAL_PROVIDER_WORK_LIFECYCLE_PRIVATE_INJECTED_PROOF_ACCEPTED_TRANSPORT_BLOCKED',
  secondaryVerdict:
    'CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_PRIVATE_INJECTED_ACCEPTED_RUNTIME_BLOCKED',
  aggregatePipelinePassedPhases: 39,
  aggregatePipelineTotalPhases: 39,
  sourceFiles: {
    receiptSchemaSha256:
      'afb79ee4f0a69f054ca49e05f813a7ae1b5f4d66f244e60c2a85bb452e192017',
    receiptServiceSha256:
      '63b13a273bb6f8e1aef5eff3741a061ea4e124dfa424543c20b670f01fe96df3',
    lifecyclePolicySha256:
      '282d802315099e496f11bb29130eeab4010283b6e37be18f99c458fc9f61ce18',
    candidateStoreSha256:
      'f6db54907bfc48233adb81942de0eefc953a54c2ccb10863856f56a10f1fd5d3',
    providerCostSha256:
      '48956a15cbba2db284b49e40b75e5552c99a8d7b745094e4eb67203d698e5aaa',
    providerVerificationSha256:
      '21a83b4034e258b8f7c0c43486ed8931a4180f18006344ed6f1ff4554166fd88',
    aggregateVerificationSha256:
      '5f0959e9b5ffb2d94a91548badfa49ef1688e499713be3ecb1808244537dae1d',
    aggregateCliSha256:
      'd4347c014f0d75e9613767cfc4b2b161d5dca923757035693ab22f83c7ff6120',
  },
  contractSourcePinned: true,
  runtimeReceiptProvenanceEstablished: false,
  providerTransportActivated: false,
  productionPromotionAuthorized: false,
} as const

export const MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_PIN = deepFreeze({
  ...canonicalBackendProviderSourcePinBase,
  sourcePinDigest: sha256CanonicalJson(canonicalBackendProviderSourcePinBase),
})

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeMicrosSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const timestampSchema = z.string().datetime({ offset: true })
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const providerIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const requestCountSchema = z.union([z.literal(0), z.literal(1)])
const boundedRequestCountSchema = z.number().int().nonnegative().max(32)

export const motionStudioCanonicalBackendProviderSourcePinV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_PIN_VERSION,
  ),
  backendBranch: z.literal('codex/backend-workflow-pipeline-continuation'),
  backendCommitSha: z.literal('a792a882929771d9d8e9a62f43f26852f5d65ec8'),
  backendTreeSha: z.literal('d545d912ac60394a0d951db58a5f222e940523e4'),
  primaryVerdict: z.literal(
    'CANONICAL_PROVIDER_WORK_LIFECYCLE_PRIVATE_INJECTED_PROOF_ACCEPTED_TRANSPORT_BLOCKED',
  ),
  secondaryVerdict: z.literal(
    'CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_PRIVATE_INJECTED_ACCEPTED_RUNTIME_BLOCKED',
  ),
  aggregatePipelinePassedPhases: z.literal(39),
  aggregatePipelineTotalPhases: z.literal(39),
  sourceFiles: z.object({
    receiptSchemaSha256: z.literal(
      'afb79ee4f0a69f054ca49e05f813a7ae1b5f4d66f244e60c2a85bb452e192017',
    ),
    receiptServiceSha256: z.literal(
      '63b13a273bb6f8e1aef5eff3741a061ea4e124dfa424543c20b670f01fe96df3',
    ),
    lifecyclePolicySha256: z.literal(
      '282d802315099e496f11bb29130eeab4010283b6e37be18f99c458fc9f61ce18',
    ),
    candidateStoreSha256: z.literal(
      'f6db54907bfc48233adb81942de0eefc953a54c2ccb10863856f56a10f1fd5d3',
    ),
    providerCostSha256: z.literal(
      '48956a15cbba2db284b49e40b75e5552c99a8d7b745094e4eb67203d698e5aaa',
    ),
    providerVerificationSha256: z.literal(
      '21a83b4034e258b8f7c0c43486ed8931a4180f18006344ed6f1ff4554166fd88',
    ),
    aggregateVerificationSha256: z.literal(
      '5f0959e9b5ffb2d94a91548badfa49ef1688e499713be3ecb1808244537dae1d',
    ),
    aggregateCliSha256: z.literal(
      'd4347c014f0d75e9613767cfc4b2b161d5dca923757035693ab22f83c7ff6120',
    ),
  }).strict(),
  contractSourcePinned: z.literal(true),
  runtimeReceiptProvenanceEstablished: z.literal(false),
  providerTransportActivated: z.literal(false),
  productionPromotionAuthorized: z.literal(false),
  sourcePinDigest: z.literal(
    MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_PIN.sourcePinDigest,
  ),
}).strict().superRefine((value, context) => {
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.sourcePinDigest
  if (sha256CanonicalJson(unsigned) !== value.sourcePinDigest) {
    context.addIssue({
      code: 'custom',
      path: ['sourcePinDigest'],
      message: 'Canonical backend source pin failed immutable digest verification.',
    })
  }
})

const requestAccountingSchema = z.object({
  privateInputUploadCount: boundedRequestCountSchema,
  generationSubmissionCount: boundedRequestCountSchema,
  statusReadCount: boundedRequestCountSchema,
  resultReadCount: boundedRequestCountSchema,
  binaryDownloadCount: boundedRequestCountSchema,
  cancellationCount: boundedRequestCountSchema,
  totalLifecycleHttpRequestCount: boundedRequestCountSchema,
}).strict().superRefine((value, context) => {
  const total = value.privateInputUploadCount + value.generationSubmissionCount +
    value.statusReadCount + value.resultReadCount + value.binaryDownloadCount +
    value.cancellationCount
  if (total !== value.totalLifecycleHttpRequestCount) {
    context.addIssue({
      code: 'custom',
      path: ['totalLifecycleHttpRequestCount'],
      message: 'Canonical provider lifecycle request counts do not reconcile.',
    })
  }
})

const privateOutputSchema = z.object({
  outputId: stableIdSchema,
  role: stableIdSchema,
  assetId: stableIdSchema,
  assetVersionId: stableIdSchema,
  privateObjectIdentityHash: digestSchema,
  contentSha256: digestSchema,
  byteLength: z.number().int().positive().max(256 * 1024 * 1024),
  mimeType: z.enum(['audio/wav', 'video/mp4', 'audio/mpeg', 'application/json']),
  artifactEvidenceDigest: digestSchema,
  storageEvidenceHash: digestSchema,
  sourceReadbackEvidenceHash: digestSchema,
  providerGenerated: z.boolean(),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
}).strict()

/**
 * Exact, server-only defensive mirror of the frozen backend receipt DTO.
 * It is a consumer parser, not another package/queue/dispatch/cost authority.
 * A schema-version change fails closed until the shared seam is reconciled.
 */
export const motionStudioCanonicalBackendProviderAttemptConsumerReceiptV2Schema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_BACKEND_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION,
    ),
    source: z.literal('verified_private_canonical_provider_attempt_stores'),
    receiptId: stableIdSchema,
    evidenceClass: z.enum([
      'private_injected_nonprovider_test',
      'canonical_backend_runtime_unreleased',
    ]),
    promotionClass: z.enum([
      'non_promotable_private_injected',
      'unreleased_runtime_not_production',
    ]),
    identity: z.object({
      ownerUserId: stableIdSchema,
      workspaceId: stableIdSchema,
      projectId: stableIdSchema,
      editSessionId: stableIdSchema,
      approvedPlanSnapshotId: stableIdSchema,
      approvedPlanSnapshotHash: digestSchema,
      packageRecordId: stableIdSchema,
      packageHash: digestSchema,
      workGraphHash: digestSchema,
      approvedWorkItemId: stableIdSchema,
      approvedWorkItemHash: digestSchema,
      queueDefinitionHash: digestSchema,
      queueJobId: stableIdSchema,
      queueJobDefinitionHash: digestSchema,
      placementHash: digestSchema,
      authorizationHash: digestSchema,
      authorizationRequestHash: digestSchema,
      sourceRequestId: stableIdSchema,
      sourceRequestDigest: digestSchema,
      providerRequestPayloadDigest: digestSchema,
      projectDataPolicyDigest: digestSchema,
      providerAccountPolicyDigest: digestSchema,
      idempotencyKeyHash: digestSchema,
    }).strict(),
    consumerContext: z.object({
      schemaVersion: z.literal(
        CANONICAL_BACKEND_PROVIDER_ATTEMPT_CONSUMER_CONTEXT_VERSION,
      ),
      contextClass: z.literal('source_verified_exact_edit_approved_work_item'),
      consumerContextId: stableIdSchema,
      consumerContextDigest: digestSchema,
      derivation: z.literal(
        'owner_workspace_project_edit_snapshot_package_work_item_job_operation_output',
      ),
      productionBindingIncluded: z.literal(false),
      callerAssertedProductionIdAccepted: z.literal(false),
      consumerOwnedProductionBindingRequired: z.literal(true),
    }).strict(),
    provider: z.object({
      operationId: providerIdSchema,
      operationProfileHash: digestSchema,
      intent: stableIdSchema,
      providerBoundaryProfileId: stableIdSchema,
      providerRouteId: stableIdSchema,
      providerModelId: providerIdSchema,
      lifecyclePolicyVersion: z.literal(
        CANONICAL_BACKEND_PROVIDER_LIFECYCLE_POLICY_VERSION,
      ),
      lifecyclePolicyHash: digestSchema,
    }).strict(),
    timing: z.object({
      startedAt: timestampSchema,
      completedAt: timestampSchema,
    }).strict(),
    requestAccounting: z.object({
      legacyV1ProviderRequestCount: requestCountSchema,
      legacyV1MaximumProviderRequests: z.literal(1),
      legacyV1Semantic: z.literal(
        'generation_submission_count_not_total_http_requests',
      ),
      accountedGenerationSubmissionCount: requestCountSchema,
      injectedSimulationGenerationSubmissionCount: requestCountSchema,
      observedTransport: requestAccountingSchema,
      ceilings: requestAccountingSchema,
      continuationRequestsBelongToSameAttempt: z.literal(true),
      unknownOutcomeBlocksNewSubmission: z.literal(true),
    }).strict(),
    queue: z.object({
      aggregateHash: digestSchema,
      entryHash: digestSchema,
      state: z.enum(['queued', 'leased', 'completed']),
      claimId: stableIdSchema,
      claimHash: digestSchema,
      queueAttemptId: stableIdSchema,
      leaseId: stableIdSchema,
      leaseHash: digestSchema,
      queueAttemptAndLeaseSemantic: z.literal(
        'canonical_provider_queue_claim_is_attempt_and_lease',
      ),
      deliveryAttempt: z.number().int().positive().max(10),
      claimExpiresAt: timestampSchema,
      providerExecutionFenceHash: digestSchema,
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
      aggregateHash: digestSchema,
      grantId: stableIdSchema,
      immutableGrantHash: digestSchema,
      dispatchAttemptId: stableIdSchema,
      dispatchAttemptHash: digestSchema,
      consumptionCount: z.literal(1),
      providerRequestStarted: z.boolean(),
      terminalId: stableIdSchema,
      terminalHash: digestSchema,
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
      sanitizedFailureCode: stableIdSchema.nullable(),
    }).strict(),
    privateOutput: privateOutputSchema.nullable(),
    privateOutputs: z.array(privateOutputSchema).max(8),
    outputSet: z.object({
      schemaVersion: z.literal(CANONICAL_BACKEND_PROVIDER_PRIVATE_OUTPUT_SET_VERSION),
      sourceAuthorityClass: z.enum([
        'canonical_v1_zero_or_one_source',
        'forward_multi_output_same_attempt_source',
      ]),
      outputCount: z.number().int().nonnegative().max(8),
      outputSetDigest: digestSchema,
      multiOutputProviderOperationAdmitted: z.boolean(),
    }).strict(),
    internalCost: z.object({
      providerAttemptEvidenceHash: digestSchema,
      providerUsageEvidenceDigest: digestSchema.nullable(),
      providerRateCardDigest: digestSchema,
      providerCostMicros: safeMicrosSchema.nullable(),
      providerCostReconciled: z.boolean(),
      legacyProvisionalInfrastructureRateCardDigest: digestSchema,
      legacyProvisionalInfrastructureCostMicros: safeMicrosSchema,
      legacyProvisionalTotalInternalCostMicros: safeMicrosSchema.nullable(),
      workerResourceEvidenceHash: digestSchema,
      workerInfrastructureEvidenceDigest: digestSchema,
      workerInfrastructureRateCardDigest: digestSchema,
      selectedInfrastructureRateCardDigest: digestSchema,
      observedWorkerInfrastructureCostMicros: safeMicrosSchema,
      selectedInfrastructureCostMicros: safeMicrosSchema,
      selectedTotalInternalCostMicros: safeMicrosSchema.nullable(),
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
      attemptIdentityHash: digestSchema,
      runtimeExecutionIdentityDigest: digestSchema,
      containerIdentityDigest: digestSchema,
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
    projectedAt: timestampSchema,
    receiptHash: digestSchema,
  }).strict().superRefine((value, context) => {
    const successful = isSuccessfulTerminal(value.dispatch.terminalState)
    const runtimeEvidence =
      value.evidenceClass === 'canonical_backend_runtime_unreleased'
    const observed = value.requestAccounting.observedTransport
    const ceilings = value.requestAccounting.ceilings
    const requestKeys = [
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
    const primaryOutput = value.privateOutputs[0] ?? null
    const legacyOutputAuthority =
      value.outputSet.sourceAuthorityClass === 'canonical_v1_zero_or_one_source'
    if (
      value.requestAccounting.accountedGenerationSubmissionCount !==
        value.requestAccounting.legacyV1ProviderRequestCount ||
      requestKeys.some((key) => observed[key] > ceilings[key]) ||
      observed.generationSubmissionCount !==
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
      successful !== (value.privateOutputs.length > 0) ||
      JSON.stringify(value.privateOutput) !== JSON.stringify(primaryOutput) ||
      value.outputSet.outputCount !== value.privateOutputs.length ||
      (legacyOutputAuthority && (
        value.privateOutputs.length > 1 ||
        value.outputSet.multiOutputProviderOperationAdmitted
      )) ||
      (!legacyOutputAuthority && !value.outputSet.multiOutputProviderOperationAdmitted) ||
      Date.parse(value.timing.completedAt) < Date.parse(value.timing.startedAt) ||
      Date.parse(value.projectedAt) < Date.parse(value.timing.completedAt) ||
      value.queue.queueAttemptId !== value.queue.claimId ||
      value.queue.leaseId !== value.queue.claimId ||
      value.queue.leaseHash !== value.queue.claimHash ||
      successful !== (value.dispatch.sanitizedFailureCode === null) ||
      value.queue.terminalQueueCompletion !== successful ||
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
      )) ||
      (successful && (
        value.dispatch.providerRequestStarted !== runtimeEvidence ||
        value.requestAccounting.legacyV1ProviderRequestCount !==
          (runtimeEvidence ? 1 : 0) ||
        observed.generationSubmissionCount !== (runtimeEvidence ? 1 : 0) ||
        value.privateOutputs.some((output) =>
          output.providerGenerated !== runtimeEvidence)
      )) ||
      (value.dispatch.terminalState === 'unknown_reconciliation_required' && (
        !value.dispatch.providerRequestStarted ||
        value.requestAccounting.legacyV1ProviderRequestCount !== 1 ||
        observed.generationSubmissionCount !== 1
      ))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical backend provider receipt is internally inconsistent.',
      })
    }
  })

export type MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2 =
  z.infer<typeof motionStudioCanonicalBackendProviderAttemptConsumerReceiptV2Schema>

const blockerSchema = z.enum([
  'source_evidence_private_injected_nonprovider_test',
  'source_evidence_canonical_backend_runtime_unreleased',
  'canonical_backend_source_provenance_verifier_required',
  'canonical_backend_runtime_receipt_release_required',
  'provider_transport_qualification_required',
  'consumer_owned_production_authority_release_required',
  'provider_attempt_failed',
  'provider_attempt_unknown_reconciliation_required',
  'provider_or_infrastructure_cost_reconciliation_required',
  'provider_or_infrastructure_cost_exceeds_authorized_ceiling',
])

export const motionStudioCanonicalBackendProviderReceiptConsumptionV1Schema =
  z.object({
    schemaVersion: z.literal(
      MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_RECEIPT_CONSUMPTION_VERSION,
    ),
    consumptionId: stableIdSchema,
    state: z.enum([
      'validated_non_promotable_private_injected',
      'validated_unreleased_runtime_blocked',
    ]),
    sourceReceipt: z.object({
      schemaVersion: z.literal(
        CANONICAL_BACKEND_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION,
      ),
      receiptId: stableIdSchema,
      receiptHash: digestSchema,
      ownerUserId: stableIdSchema,
      evidenceClass: z.enum([
        'private_injected_nonprovider_test',
        'canonical_backend_runtime_unreleased',
      ]),
      promotionClass: z.enum([
        'non_promotable_private_injected',
        'unreleased_runtime_not_production',
      ]),
      consumerContextId: stableIdSchema,
      consumerContextDigest: digestSchema,
      operationId: providerIdSchema,
      lifecyclePolicyVersion: z.literal(
        CANONICAL_BACKEND_PROVIDER_LIFECYCLE_POLICY_VERSION,
      ),
      lifecyclePolicyHash: digestSchema,
      terminalState: z.enum([
        'succeeded',
        'failed',
        'unknown_reconciliation_required',
        'unknown_reconciled_succeeded',
        'unknown_reconciled_failed',
      ]),
      outputSetDigest: digestSchema,
      outputCount: z.number().int().nonnegative().max(8),
      providerAttemptEvidenceHash: digestSchema,
      workerResourceEvidenceHash: digestSchema,
    }).strict(),
    frozenBackendSourcePin:
      motionStudioCanonicalBackendProviderSourcePinV1Schema,
    productionBinding: z.object({
      schemaVersion: z.literal(
        MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_PRODUCTION_BINDING_VERSION,
      ),
      bindingId: stableIdSchema,
      authorityClass: z.literal('contract_only_consumer_owned_binding'),
      ownerUserId: stableIdSchema,
      productionId: stableIdSchema,
      expectationId: stableIdSchema,
      expectationDigest: digestSchema,
      expectedOutputId: stableIdSchema,
      consumerContextDigest: digestSchema,
      sourceReceiptHash: digestSchema,
      backendProductionBindingIncluded: z.literal(false),
      callerAssertedProductionAcceptedByBackend: z.literal(false),
      admissionAuthority: z.literal('none'),
      bindingDigest: digestSchema,
    }).strict(),
    verification: z.object({
      receiptHashVerified: z.literal(true),
      outputSetDigestVerified: z.literal(true),
      consumerContextDigestVerified: z.literal(true),
      exactMotionExpectationMatched: z.literal(true),
      providerAndInfrastructureCostSeparated: z.literal(true),
      failedOrUnknownAttemptCostRetained: z.literal(true),
      canonicalBackendReceiptSchemaAndDigestVerifierIntegrated: z.literal(true),
      canonicalBackendFrozenContractSourcePinVerified: z.literal(true),
      canonicalBackendFrozenContractSourcePinProvidesRuntimeProvenance:
        z.literal(false),
      canonicalBackendSourceProvenanceVerifierIntegrated: z.literal(false),
      canonicalBackendRuntimeReceiptVerifierIntegrated: z.literal(false),
      sourceVerifiedClaimPreserved: z.literal(true),
    }).strict(),
    requestAccounting: z.object({
      generationSubmissionCount: requestCountSchema,
      observedTransport: requestAccountingSchema,
      ceilings: requestAccountingSchema,
      retryCount: z.literal(0),
      fallbackCount: z.literal(0),
    }).strict(),
    privateOutput: privateOutputSchema.nullable(),
    internalCost: z.object({
      providerUsageEvidenceDigest: digestSchema.nullable(),
      providerRateCardDigest: digestSchema,
      providerCostMicros: safeMicrosSchema.nullable(),
      workerInfrastructureEvidenceDigest: digestSchema,
      workerInfrastructureRateCardDigest: digestSchema,
      workerInfrastructureCostMicros: safeMicrosSchema,
      totalInternalProductionCostMicros: safeMicrosSchema.nullable(),
      costWithinMotionAuthorization: z.boolean(),
      internalProductionCostOnly: z.literal(true),
      customerPriceIncluded: z.literal(false),
      customerCreditsIncluded: z.literal(false),
      serviceFeeIncluded: z.literal(false),
      walletMutationPerformed: z.literal(false),
      billingMutationPerformed: z.literal(false),
    }).strict(),
    blockers: z.array(blockerSchema).min(3).max(10).readonly(),
    motionPortReceipt: z.null(),
    motionAdmission: z.null(),
    readiness: z.object({
      actualProviderCandidatePresent: z.literal(false),
      privateCandidateIngestAuthorized: z.literal(false),
      objectiveQaAuthorized: z.literal(false),
      humanReviewAuthorized: z.literal(false),
      selectionEligible: z.literal(false),
      finalMixEligible: z.literal(false),
      timelineEligible: z.literal(false),
      ms012dAccepted: z.literal(false),
      productReady: z.literal(false),
    }).strict(),
    sideEffects: z.object({
      externalRequestCount: z.literal(0),
      secretPayloadReadCount: z.literal(0),
      providerSubmissionCount: z.literal(0),
      privateArtifactWriteCount: z.literal(0),
      costMutationCount: z.literal(0),
      selectionCount: z.literal(0),
      timelineMutationCount: z.literal(0),
      renderCount: z.literal(0),
      exportCount: z.literal(0),
      remoteMutationCount: z.literal(0),
    }).strict(),
    immutable: z.literal(true),
    consumptionDigest: digestSchema,
  }).strict().superRefine((value, context) => {
    const injected =
      value.sourceReceipt.evidenceClass === 'private_injected_nonprovider_test'
    const expectedState = injected
      ? 'validated_non_promotable_private_injected'
      : 'validated_unreleased_runtime_blocked'
    const expectedPromotion = injected
      ? 'non_promotable_private_injected'
      : 'unreleased_runtime_not_production'
    const expectedEvidenceBlocker = injected
      ? 'source_evidence_private_injected_nonprovider_test'
      : 'source_evidence_canonical_backend_runtime_unreleased'
    const costTotal = value.internalCost.providerCostMicros === null
      ? null
      : value.internalCost.providerCostMicros +
        value.internalCost.workerInfrastructureCostMicros
    if (
      value.state !== expectedState ||
      value.sourceReceipt.promotionClass !== expectedPromotion ||
      !value.blockers.includes(expectedEvidenceBlocker) ||
      !value.blockers.includes('canonical_backend_source_provenance_verifier_required') ||
      !value.blockers.includes('canonical_backend_runtime_receipt_release_required') ||
      !value.blockers.includes('provider_transport_qualification_required') ||
      !value.blockers.includes('consumer_owned_production_authority_release_required') ||
      value.productionBinding.sourceReceiptHash !== value.sourceReceipt.receiptHash ||
      value.productionBinding.ownerUserId !== value.sourceReceipt.ownerUserId ||
      value.productionBinding.consumerContextDigest !==
        value.sourceReceipt.consumerContextDigest ||
      value.productionBinding.expectationDigest.length !== 64 ||
      value.internalCost.totalInternalProductionCostMicros !== costTotal ||
      (value.privateOutput === null) !== (value.sourceReceipt.outputCount === 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Motion provider receipt consumption is internally inconsistent.',
      })
    }
  })

export type MotionStudioCanonicalBackendProviderReceiptConsumptionV1 =
  z.infer<typeof motionStudioCanonicalBackendProviderReceiptConsumptionV1Schema>

export function consumeMotionStudioCanonicalBackendProviderAttemptReceipt(input: {
  authorizedOwnerUserId: string
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1
  sourceReceipt: MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2
}): MotionStudioCanonicalBackendProviderReceiptConsumptionV1 {
  const authorizedOwnerUserId = stableIdSchema.parse(input.authorizedOwnerUserId)
  const expectation = assertExpectation(input.expectation)
  const receipt = assertMotionStudioCanonicalBackendProviderAttemptConsumerReceipt(
    input.sourceReceipt,
  )
  assertExactExpectationLineage(expectation, receipt, authorizedOwnerUserId)
  const expectedConsumerContextDigest = sha256CanonicalJson({
    domain: 'reeditpro:canonical-provider-attempt-consumer-context:v1',
    ownerUserId: receipt.identity.ownerUserId,
    workspaceId: receipt.identity.workspaceId,
    projectId: receipt.identity.projectId,
    editSessionId: receipt.identity.editSessionId,
    approvedPlanSnapshotId: receipt.identity.approvedPlanSnapshotId,
    packageRecordId: receipt.identity.packageRecordId,
    approvedWorkItemId: receipt.identity.approvedWorkItemId,
    queueJobId: receipt.identity.queueJobId,
    operationId: receipt.provider.operationId,
    expectedOutputId: expectation.expectedOutputId,
  })
  if (expectedConsumerContextDigest !== receipt.consumerContext.consumerContextDigest) {
    blocked('Canonical backend consumer context does not bind the expected Motion output.')
  }
  assertExpectedOutput(expectation, receipt)

  const productionBindingBase = {
    schemaVersion: MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_PRODUCTION_BINDING_VERSION,
    bindingId: `provider-production-binding-${receipt.receiptHash.slice(0, 40)}`,
    authorityClass: 'contract_only_consumer_owned_binding' as const,
    ownerUserId: authorizedOwnerUserId,
    productionId: expectation.productionId,
    expectationId: expectation.expectationId,
    expectationDigest: expectation.expectationDigest,
    expectedOutputId: expectation.expectedOutputId,
    consumerContextDigest: receipt.consumerContext.consumerContextDigest,
    sourceReceiptHash: receipt.receiptHash,
    backendProductionBindingIncluded: false as const,
    callerAssertedProductionAcceptedByBackend: false as const,
    admissionAuthority: 'none' as const,
  }
  const productionBinding = {
    ...productionBindingBase,
    bindingDigest: sha256CanonicalJson(productionBindingBase),
  }
  const costWithinAuthorization = costWithinMotionAuthorization(
    expectation,
    receipt,
  )
  const costReconciled = receipt.internalCost.providerCostMicros !== null &&
    receipt.internalCost.providerUsageEvidenceDigest !== null &&
    receipt.internalCost.selectedTotalInternalCostMicros !== null
  const blockers: z.infer<typeof blockerSchema>[] = [
    receipt.evidenceClass === 'private_injected_nonprovider_test'
      ? 'source_evidence_private_injected_nonprovider_test'
      : 'source_evidence_canonical_backend_runtime_unreleased',
    'canonical_backend_source_provenance_verifier_required',
    'canonical_backend_runtime_receipt_release_required',
    'provider_transport_qualification_required',
    'consumer_owned_production_authority_release_required',
  ]
  if (receipt.dispatch.terminalState === 'unknown_reconciliation_required') {
    blockers.push('provider_attempt_unknown_reconciliation_required')
  } else if (!isSuccessfulTerminal(receipt.dispatch.terminalState)) {
    blockers.push('provider_attempt_failed')
  }
  if (!costReconciled) {
    blockers.push('provider_or_infrastructure_cost_reconciliation_required')
  } else if (!costWithinAuthorization) {
    blockers.push('provider_or_infrastructure_cost_exceeds_authorized_ceiling')
  }
  const uniqueBlockers = [...new Set(blockers)]
  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_RECEIPT_CONSUMPTION_VERSION,
    consumptionId: `provider-receipt-consumption-${receipt.receiptHash.slice(0, 40)}`,
    state: receipt.evidenceClass === 'private_injected_nonprovider_test'
      ? 'validated_non_promotable_private_injected' as const
      : 'validated_unreleased_runtime_blocked' as const,
    sourceReceipt: {
      schemaVersion: receipt.schemaVersion,
      receiptId: receipt.receiptId,
      receiptHash: receipt.receiptHash,
      ownerUserId: receipt.identity.ownerUserId,
      evidenceClass: receipt.evidenceClass,
      promotionClass: receipt.promotionClass,
      consumerContextId: receipt.consumerContext.consumerContextId,
      consumerContextDigest: receipt.consumerContext.consumerContextDigest,
      operationId: receipt.provider.operationId,
      lifecyclePolicyVersion: receipt.provider.lifecyclePolicyVersion,
      lifecyclePolicyHash: receipt.provider.lifecyclePolicyHash,
      terminalState: receipt.dispatch.terminalState,
      outputSetDigest: receipt.outputSet.outputSetDigest,
      outputCount: receipt.outputSet.outputCount,
      providerAttemptEvidenceHash:
        receipt.internalCost.providerAttemptEvidenceHash,
      workerResourceEvidenceHash: receipt.internalCost.workerResourceEvidenceHash,
    },
    frozenBackendSourcePin: MOTION_STUDIO_CANONICAL_BACKEND_PROVIDER_SOURCE_PIN,
    productionBinding,
    verification: {
      receiptHashVerified: true as const,
      outputSetDigestVerified: true as const,
      consumerContextDigestVerified: true as const,
      exactMotionExpectationMatched: true as const,
      providerAndInfrastructureCostSeparated: true as const,
      failedOrUnknownAttemptCostRetained: true as const,
      canonicalBackendReceiptSchemaAndDigestVerifierIntegrated: true as const,
      canonicalBackendFrozenContractSourcePinVerified: true as const,
      canonicalBackendFrozenContractSourcePinProvidesRuntimeProvenance:
        false as const,
      canonicalBackendSourceProvenanceVerifierIntegrated: false as const,
      canonicalBackendRuntimeReceiptVerifierIntegrated: false as const,
      sourceVerifiedClaimPreserved: true as const,
    },
    requestAccounting: {
      generationSubmissionCount:
        receipt.requestAccounting.accountedGenerationSubmissionCount,
      observedTransport: receipt.requestAccounting.observedTransport,
      ceilings: receipt.requestAccounting.ceilings,
      retryCount: receipt.dispatch.retryCount,
      fallbackCount: receipt.dispatch.fallbackCount,
    },
    privateOutput: receipt.privateOutput,
    internalCost: {
      providerUsageEvidenceDigest:
        receipt.internalCost.providerUsageEvidenceDigest,
      providerRateCardDigest: receipt.internalCost.providerRateCardDigest,
      providerCostMicros: receipt.internalCost.providerCostMicros,
      workerInfrastructureEvidenceDigest:
        receipt.internalCost.workerInfrastructureEvidenceDigest,
      workerInfrastructureRateCardDigest:
        receipt.internalCost.workerInfrastructureRateCardDigest,
      workerInfrastructureCostMicros:
        receipt.internalCost.selectedInfrastructureCostMicros,
      totalInternalProductionCostMicros:
        receipt.internalCost.selectedTotalInternalCostMicros,
      costWithinMotionAuthorization: costWithinAuthorization,
      internalProductionCostOnly: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    blockers: uniqueBlockers,
    motionPortReceipt: null,
    motionAdmission: null,
    readiness: {
      actualProviderCandidatePresent: false as const,
      privateCandidateIngestAuthorized: false as const,
      objectiveQaAuthorized: false as const,
      humanReviewAuthorized: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      costMutationCount: 0 as const,
      selectionCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioCanonicalBackendProviderReceiptConsumptionV1Schema.parse({
    ...base,
    consumptionDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioCanonicalBackendProviderAttemptConsumerReceipt(
  input: MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2,
): MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2 {
  const receipt = motionStudioCanonicalBackendProviderAttemptConsumerReceiptV2Schema
    .parse(input)
  const unsigned = { ...receipt } as Record<string, unknown>
  delete unsigned.receiptHash
  if (sha256CanonicalJson(unsigned) !== receipt.receiptHash) {
    blocked('Canonical backend provider receipt failed immutable hash verification.')
  }
  const expectedOutputSetDigest = sha256CanonicalJson({
    domain: 'reeditpro:canonical-provider-private-output-set:v1',
    dispatchAttemptHash: receipt.dispatch.dispatchAttemptHash,
    terminalHash: receipt.dispatch.terminalHash,
    outputs: receipt.privateOutputs,
  })
  if (expectedOutputSetDigest !== receipt.outputSet.outputSetDigest) {
    blocked('Canonical backend provider output set failed immutable hash verification.')
  }
  return deepFreeze(receipt)
}

export function assertMotionStudioCanonicalBackendProviderReceiptConsumption(
  input: MotionStudioCanonicalBackendProviderReceiptConsumptionV1,
): MotionStudioCanonicalBackendProviderReceiptConsumptionV1 {
  const consumption = motionStudioCanonicalBackendProviderReceiptConsumptionV1Schema
    .parse(input)
  const unsigned = { ...consumption } as Record<string, unknown>
  delete unsigned.consumptionDigest
  if (sha256CanonicalJson(unsigned) !== consumption.consumptionDigest) {
    blocked('Motion provider receipt consumption failed immutable digest verification.')
  }
  const bindingUnsigned = { ...consumption.productionBinding } as Record<string, unknown>
  delete bindingUnsigned.bindingDigest
  if (sha256CanonicalJson(bindingUnsigned) !== consumption.productionBinding.bindingDigest) {
    blocked('Motion provider production binding failed immutable digest verification.')
  }
  return deepFreeze(consumption)
}

function assertExpectation(
  input: MotionStudioProviderAttemptConsumptionExpectationV1,
): MotionStudioProviderAttemptConsumptionExpectationV1 {
  const expectation = motionStudioProviderAttemptConsumptionExpectationV1Schema.parse(input)
  const unsigned = { ...expectation } as Record<string, unknown>
  delete unsigned.expectationDigest
  if (sha256CanonicalJson(unsigned) !== expectation.expectationDigest) {
    blocked('Motion provider-attempt expectation failed immutable digest verification.')
  }
  return expectation
}

function assertExactExpectationLineage(
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1,
  receipt: MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2,
  authorizedOwnerUserId: string,
): void {
  const exactProviderIdentity = expectation.intent === 'generated_music_candidate'
    ? {
        operationId: 'provider.lyria.generate_music_candidate.v1',
        providerBoundaryProfileId: 'lyria_3_pro_provider_boundary',
        providerRouteId: 'lyria_3_pro_provider_boundary',
        providerModelId: 'lyria-3-pro-preview',
        operationProfileHash: CANONICAL_BACKEND_LYRIA_OPERATION_PROFILE_HASH,
        lifecyclePolicyHash: CANONICAL_BACKEND_LYRIA_LIFECYCLE_POLICY_HASH,
        requestCeilings: {
          privateInputUploadCount: 0,
          generationSubmissionCount: 1,
          statusReadCount: 0,
          resultReadCount: 0,
          binaryDownloadCount: 0,
          cancellationCount: 0,
          totalLifecycleHttpRequestCount: 1,
        },
      }
    : {
        operationId: 'provider.fal.generate_synchronized_foley_candidate.v1',
        providerBoundaryProfileId: 'fal_ai_mmaudio_v2_provider_boundary',
        providerRouteId: 'fal_ai_mmaudio_v2',
        providerModelId: 'fal-ai/mmaudio-v2',
        operationProfileHash: null,
        lifecyclePolicyHash: CANONICAL_BACKEND_FOLEY_LIFECYCLE_POLICY_HASH,
        requestCeilings: {
          privateInputUploadCount: 1,
          generationSubmissionCount: 1,
          statusReadCount: 12,
          resultReadCount: 1,
          binaryDownloadCount: 1,
          cancellationCount: 1,
          totalLifecycleHttpRequestCount: 17,
        },
      }
  const exactRequestCeilings = Object.entries(exactProviderIdentity.requestCeilings)
    .every(([key, expected]) =>
      receipt.requestAccounting.ceilings[
        key as keyof typeof receipt.requestAccounting.ceilings
      ] === expected)
  if (
    receipt.identity.ownerUserId !== authorizedOwnerUserId ||
    receipt.provider.intent !== expectation.intent ||
    receipt.identity.workspaceId !== expectation.workspaceId ||
    receipt.identity.projectId !== expectation.projectId ||
    receipt.identity.editSessionId !== expectation.editSessionId ||
    receipt.identity.approvedPlanSnapshotId !== expectation.approvedSnapshotId ||
    receipt.identity.approvedPlanSnapshotHash !== expectation.approvedSnapshotDigest ||
    receipt.identity.packageRecordId !== expectation.approvedPackageId ||
    receipt.identity.packageHash !== expectation.approvedPackageDigest ||
    receipt.identity.approvedWorkItemId !== expectation.approvedWorkItemId ||
    receipt.identity.sourceRequestId !== expectation.sourceRequestId ||
    receipt.identity.sourceRequestDigest !== expectation.sourceRequestDigest ||
    receipt.identity.providerRequestPayloadDigest !==
      expectation.providerRequestPayloadDigest ||
    receipt.identity.projectDataPolicyDigest !== expectation.projectDataPolicyDigest ||
    receipt.identity.providerAccountPolicyDigest !==
      expectation.providerAccountPolicyDigest ||
    receipt.identity.idempotencyKeyHash !== expectation.idempotencyKeyHash ||
    receipt.queue.deliveryAttempt !== 1 ||
    receipt.provider.providerRouteId !== expectation.providerRouteId ||
    receipt.provider.providerModelId !== expectation.providerModelId ||
    receipt.provider.operationId !== exactProviderIdentity.operationId ||
    receipt.provider.providerBoundaryProfileId !==
      exactProviderIdentity.providerBoundaryProfileId ||
    receipt.provider.providerRouteId !== exactProviderIdentity.providerRouteId ||
    receipt.provider.providerModelId !== exactProviderIdentity.providerModelId ||
    (exactProviderIdentity.operationProfileHash !== null &&
      receipt.provider.operationProfileHash !==
        exactProviderIdentity.operationProfileHash) ||
    receipt.provider.lifecyclePolicyHash !==
      exactProviderIdentity.lifecyclePolicyHash ||
    !exactRequestCeilings ||
    expectation.operationBinding.state !== 'frozen' ||
    receipt.provider.operationId !== expectation.operationBinding.providerOperationId
  ) blocked('Canonical backend receipt does not match the exact Motion expectation.')
}

function assertExpectedOutput(
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1,
  receipt: MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2,
): void {
  if (
    receipt.outputSet.sourceAuthorityClass !== 'canonical_v1_zero_or_one_source' ||
    receipt.outputSet.multiOutputProviderOperationAdmitted ||
    receipt.privateOutputs.length > 1
  ) blocked('Canonical backend output authority is not supported by this Motion contract.')
  const output = receipt.privateOutput
  if (!output) return
  if (
    receipt.privateOutputs.length !== 1 ||
    output.outputId !== expectation.expectedOutputId ||
    output.role !== expectation.expectedPrivateOutput.role ||
    output.mimeType !== expectation.expectedPrivateOutput.mimeType ||
    output.byteLength > expectation.expectedPrivateOutput.maximumByteLength
  ) blocked('Canonical backend private output does not match the Motion expectation.')
}

function costWithinMotionAuthorization(
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1,
  receipt: MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2,
): boolean {
  const providerCost = receipt.internalCost.providerCostMicros
  const infrastructureCost = receipt.internalCost.selectedInfrastructureCostMicros
  const infrastructureCeiling = expectation.maximumAuthorizedInfrastructureCostMicros
  return providerCost !== null &&
    providerCost <= expectation.maximumAuthorizedProviderCostMicros &&
    infrastructureCeiling !== null &&
    infrastructureCost <= infrastructureCeiling
}

function isSuccessfulTerminal(
  state: MotionStudioCanonicalBackendProviderAttemptConsumerReceiptV2['dispatch']['terminalState'],
): boolean {
  return state === 'succeeded' || state === 'unknown_reconciled_succeeded'
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_backend_provider_receipt_consumption',
  })
}
