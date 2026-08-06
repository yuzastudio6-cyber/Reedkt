import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_CANONICAL_PROVIDER_ATTEMPT_PORT_SCHEMA_VERSION =
  'motion-studio.canonical-provider-attempt-port.v1' as const
export const MOTION_STUDIO_PROVIDER_ATTEMPT_EXPECTATION_SCHEMA_VERSION =
  'motion-studio.provider-attempt-consumption-expectation.v1' as const
export const MOTION_STUDIO_PROVIDER_ATTEMPT_PORT_READINESS_SCHEMA_VERSION =
  'motion-studio.provider-attempt-port-readiness.v1' as const

export const MOTION_STUDIO_PROVIDER_ATTEMPT_INTENTS = [
  'generated_music_candidate',
  'synchronized_foley_candidate',
] as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const providerModelIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const safeMicrosSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const intentSchema = z.enum(MOTION_STUDIO_PROVIDER_ATTEMPT_INTENTS)
const privateOutputRoleSchema = z.enum([
  'generated_instrumental_score_candidate',
  'provider_synchronized_audio_mp4',
])

const privateOutputSchema = z.object({
  outputId: stableIdSchema,
  role: privateOutputRoleSchema,
  assetId: stableIdSchema,
  assetVersionId: stableIdSchema,
  privateObjectIdentityHash: digestSchema,
  contentSha256: digestSchema,
  byteLength: z.number().int().positive().max(128 * 1024 * 1024),
  mimeType: z.enum(['audio/wav', 'video/mp4']),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  artifactEvidenceDigest: digestSchema,
}).strict()

const completedOutcomeSchema = z.object({
  state: z.literal('succeeded'),
  providerRequestCount: z.literal(1),
  retryCount: z.literal(0),
  fallbackCount: z.literal(0),
  dispatchConsumptionCount: z.literal(1),
  unknownOutcomeReconciled: z.literal(true),
  providerResponseUsageDigest: digestSchema,
  sanitizedFailureCode: z.null(),
  privateOutput: privateOutputSchema,
  terminalEvidenceDigest: digestSchema,
}).strict()

const failedOutcomeSchema = z.object({
  state: z.literal('failed'),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  retryCount: z.literal(0),
  fallbackCount: z.literal(0),
  dispatchConsumptionCount: z.literal(1),
  unknownOutcomeReconciled: z.literal(true),
  providerResponseUsageDigest: digestSchema.nullable(),
  sanitizedFailureCode: stableIdSchema,
  privateOutput: z.null(),
  terminalEvidenceDigest: digestSchema,
}).strict()

const unknownOutcomeSchema = z.object({
  state: z.literal('unknown_reconciliation_required'),
  providerRequestCount: z.literal(1),
  retryCount: z.literal(0),
  fallbackCount: z.literal(0),
  dispatchConsumptionCount: z.literal(1),
  unknownOutcomeReconciled: z.literal(false),
  providerResponseUsageDigest: digestSchema.nullable(),
  sanitizedFailureCode: z.literal('provider_outcome_unknown'),
  privateOutput: z.null(),
  terminalEvidenceDigest: digestSchema,
}).strict()

const terminalOutcomeSchema = z.discriminatedUnion('state', [
  completedOutcomeSchema,
  failedOutcomeSchema,
  unknownOutcomeSchema,
])

export const motionStudioCanonicalProviderAttemptPortV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_CANONICAL_PROVIDER_ATTEMPT_PORT_SCHEMA_VERSION),
  authorityClass: z.enum(['contract_fixture', 'canonical_backend_verified_runtime']),
  intent: intentSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedPackageId: stableIdSchema,
  approvedPackageDigest: digestSchema,
  approvedWorkItemId: stableIdSchema,
  expectedOutputId: stableIdSchema,
  queueJobId: stableIdSchema,
  queueAttemptId: stableIdSchema,
  claimId: stableIdSchema,
  leaseId: stableIdSchema,
  idempotencyKeyHash: digestSchema,
  providerOperationId: stableIdSchema,
  providerRouteId: stableIdSchema,
  providerModelId: providerModelIdSchema,
  sourceRequestId: stableIdSchema,
  sourceRequestDigest: digestSchema,
  providerRequestPayloadDigest: digestSchema,
  projectDataPolicyDigest: digestSchema,
  providerAccountPolicyDigest: digestSchema,
  oneUseDispatchEvidenceDigest: digestSchema,
  startedAt: isoDateSchema,
  completedAt: isoDateSchema,
  attemptNumber: z.literal(1),
  terminalOutcome: terminalOutcomeSchema,
  cost: z.object({
    state: z.enum(['complete', 'reconciliation_required']),
    providerUsageEvidenceDigest: digestSchema.nullable(),
    providerRateCardDigest: digestSchema.nullable(),
    providerCostMicros: safeMicrosSchema.nullable(),
    infrastructureUsageEvidenceDigest: digestSchema.nullable(),
    infrastructureRateCardDigest: digestSchema.nullable(),
    infrastructureCostMicros: safeMicrosSchema.nullable(),
    totalInternalProductionCostMicros: safeMicrosSchema.nullable(),
    failedAttemptCostRetained: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
    costEvidenceDigest: digestSchema,
  }).strict(),
  security: z.object({
    credentialPayloadPersisted: z.literal(false),
    credentialValueLogged: z.literal(false),
    providerRequestBodyPersistedInQueue: z.literal(false),
    providerUrlPersisted: z.literal(false),
    browserReadableProviderEvidence: z.literal(false),
    callerSelectedExecutableAllowed: z.literal(false),
    callerSelectedRouteAllowed: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  receiptDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const output = value.terminalOutcome.privateOutput
  if (
    output && (
      (value.intent === 'generated_music_candidate' &&
        (output.role !== 'generated_instrumental_score_candidate' || output.mimeType !== 'audio/wav')) ||
      (value.intent === 'synchronized_foley_candidate' &&
        (output.role !== 'provider_synchronized_audio_mp4' || output.mimeType !== 'video/mp4'))
    )
  ) {
    context.addIssue({
      code: 'custom',
      path: ['terminalOutcome', 'privateOutput'],
      message: 'Canonical provider output role and media type must match the exact Motion Studio intent.',
    })
  }

  const startedAt = Date.parse(value.startedAt)
  const completedAt = Date.parse(value.completedAt)
  if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt) || completedAt < startedAt) {
    context.addIssue({
      code: 'custom',
      path: ['completedAt'],
      message: 'Canonical provider attempt completion must not predate its start.',
    })
  }

  const costComplete = value.cost.state === 'complete'
  const completeFields = [
    value.cost.providerUsageEvidenceDigest,
    value.cost.providerRateCardDigest,
    value.cost.providerCostMicros,
    value.cost.infrastructureUsageEvidenceDigest,
    value.cost.infrastructureRateCardDigest,
    value.cost.infrastructureCostMicros,
    value.cost.totalInternalProductionCostMicros,
  ]
  if (costComplete && completeFields.some((entry) => entry === null)) {
    context.addIssue({
      code: 'custom',
      path: ['cost'],
      message: 'A complete provider attempt cost record requires both provider and infrastructure evidence.',
    })
  }
  if (!costComplete && completeFields.every((entry) => entry !== null)) {
    context.addIssue({
      code: 'custom',
      path: ['cost', 'state'],
      message: 'A fully reconciled provider attempt cost record cannot remain reconciliation-required.',
    })
  }
  if (
    costComplete && value.cost.providerCostMicros !== null &&
    value.cost.infrastructureCostMicros !== null &&
    value.cost.totalInternalProductionCostMicros !==
      value.cost.providerCostMicros + value.cost.infrastructureCostMicros
  ) {
    context.addIssue({
      code: 'custom',
      path: ['cost', 'totalInternalProductionCostMicros'],
      message: 'Provider attempt internal cost must equal its separate provider and infrastructure components.',
    })
  }
})

export type MotionStudioCanonicalProviderAttemptPortV1 =
  z.infer<typeof motionStudioCanonicalProviderAttemptPortV1Schema>

const operationBindingSchema = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('backend_owned_pending_freeze'),
    providerOperationId: z.null(),
  }).strict(),
  z.object({
    state: z.literal('frozen'),
    providerOperationId: stableIdSchema,
  }).strict(),
])

export const motionStudioProviderAttemptConsumptionExpectationV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_ATTEMPT_EXPECTATION_SCHEMA_VERSION),
  expectationId: stableIdSchema,
  intent: intentSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedWorkItemId: stableIdSchema,
  expectedOutputId: stableIdSchema,
  approvedPackageId: stableIdSchema,
  approvedPackageDigest: digestSchema,
  sourceRequestId: stableIdSchema,
  sourceRequestDigest: digestSchema,
  providerRequestPayloadDigest: digestSchema,
  projectDataPolicyDigest: digestSchema,
  providerAccountPolicyDigest: digestSchema,
  idempotencyKeyHash: digestSchema,
  providerRouteId: stableIdSchema,
  providerModelId: providerModelIdSchema,
  operationBinding: operationBindingSchema,
  expectedPrivateOutput: z.object({
    role: privateOutputRoleSchema,
    mimeType: z.enum(['audio/wav', 'video/mp4']),
    maximumByteLength: z.number().int().positive().max(128 * 1024 * 1024),
  }).strict(),
  maximumAuthorizedProviderCostMicros: safeMicrosSchema,
  maximumAuthorizedInfrastructureCostMicros: safeMicrosSchema.nullable(),
  rules: z.object({
    exactApprovedSnapshotRequired: z.literal(true),
    exactRequestWorkAndOutputRequired: z.literal(true),
    activeLeaseAndClaimRequired: z.literal(true),
    oneUseDispatchRequired: z.literal(true),
    maximumProviderRequests: z.literal(1),
    retriesAllowed: z.literal(false),
    fallbacksAllowed: z.literal(false),
    privateCreateOnlyOutputRequired: z.literal(true),
    providerAndInfrastructureCostSeparated: z.literal(true),
    failedAndUnknownAttemptCostRetained: z.literal(true),
    unknownOutcomeMustReconcileBeforeIngest: z.literal(true),
    automaticSelectionAllowed: z.literal(false),
    finalMixAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  expectationDigest: digestSchema,
}).strict().superRefine((value, context) => {
  if (
    (value.intent === 'generated_music_candidate' &&
      (value.expectedPrivateOutput.role !== 'generated_instrumental_score_candidate' ||
        value.expectedPrivateOutput.mimeType !== 'audio/wav')) ||
    (value.intent === 'synchronized_foley_candidate' &&
      (value.expectedPrivateOutput.role !== 'provider_synchronized_audio_mp4' ||
        value.expectedPrivateOutput.mimeType !== 'video/mp4'))
  ) {
    context.addIssue({
      code: 'custom',
      path: ['expectedPrivateOutput'],
      message: 'Expected private output role and media type must match the exact provider intent.',
    })
  }
})

export type MotionStudioProviderAttemptConsumptionExpectationV1 =
  z.infer<typeof motionStudioProviderAttemptConsumptionExpectationV1Schema>

export const motionStudioProviderAttemptAdmissionV1Schema = z.object({
  state: z.enum([
    'not_admitted_contract_fixture',
    'not_admitted_runtime_verification_missing',
    'not_admitted_operation_identity_pending',
    'not_admitted_lineage_mismatch',
    'not_admitted_terminal_outcome',
    'not_admitted_cost_reconciliation_required',
    'admitted_for_private_candidate_ingest',
  ]),
  intent: intentSchema,
  expectationId: stableIdSchema,
  expectationDigest: digestSchema,
  receiptDigest: digestSchema,
  blockers: z.array(z.enum([
    'actual_canonical_backend_receipt_required',
    'canonical_backend_runtime_receipt_verifier_not_integrated',
    'canonical_provider_operation_identity_not_frozen',
    'exact_scope_snapshot_request_work_output_or_route_mismatch',
    'provider_attempt_did_not_succeed',
    'provider_attempt_unknown_outcome_not_reconciled',
    'provider_or_infrastructure_cost_not_reconciled',
    'provider_or_infrastructure_cost_exceeds_authorized_ceiling',
    'private_output_integrity_missing_or_mismatched',
  ])).max(8).readonly(),
  readyForPrivateCandidateIngest: z.boolean(),
  readyForObjectiveQa: z.literal(false),
  readyForHumanReview: z.literal(false),
  selectionEligible: z.literal(false),
  finalMixEligible: z.literal(false),
  timelineEligible: z.literal(false),
  admissionDigest: digestSchema,
}).strict()

export type MotionStudioProviderAttemptAdmissionV1 =
  z.infer<typeof motionStudioProviderAttemptAdmissionV1Schema>

export function createMotionStudioProviderAttemptConsumptionExpectation(
  input: Omit<MotionStudioProviderAttemptConsumptionExpectationV1, 'schemaVersion' | 'expectationDigest'>,
): MotionStudioProviderAttemptConsumptionExpectationV1 {
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_ATTEMPT_EXPECTATION_SCHEMA_VERSION,
    ...input,
  }
  return deepFreeze(motionStudioProviderAttemptConsumptionExpectationV1Schema.parse({
    ...base,
    expectationDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioCanonicalProviderAttemptPort(
  input: MotionStudioCanonicalProviderAttemptPortV1,
): MotionStudioCanonicalProviderAttemptPortV1 {
  const parsed = motionStudioCanonicalProviderAttemptPortV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.receiptDigest
  if (sha256CanonicalJson(base) !== parsed.receiptDigest) {
    blocked('Canonical provider-attempt port receipt failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

export function evaluateMotionStudioProviderAttemptReceipt(input: {
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1
  receipt: MotionStudioCanonicalProviderAttemptPortV1
}): MotionStudioProviderAttemptAdmissionV1 {
  const expectation = motionStudioProviderAttemptConsumptionExpectationV1Schema.parse(input.expectation)
  const expectationBase = { ...expectation } as Record<string, unknown>
  delete expectationBase.expectationDigest
  if (sha256CanonicalJson(expectationBase) !== expectation.expectationDigest) {
    blocked('Provider-attempt expectation failed immutable digest verification.')
  }
  const receipt = assertMotionStudioCanonicalProviderAttemptPort(input.receipt)
  const blockers: MotionStudioProviderAttemptAdmissionV1['blockers'][number][] = []
  if (receipt.authorityClass !== 'canonical_backend_verified_runtime') {
    blockers.push('actual_canonical_backend_receipt_required')
  } else {
    // A caller-selected authorityClass plus a self-digest is not backend runtime provenance.
    // The future shared-backend adapter must replace this closed gate with exact receipt
    // verification before any canonical-shaped record can enter private candidate ingest.
    blockers.push('canonical_backend_runtime_receipt_verifier_not_integrated')
  }
  if (expectation.operationBinding.state !== 'frozen') {
    blockers.push('canonical_provider_operation_identity_not_frozen')
  }
  if (!exactLineageMatches(expectation, receipt)) {
    blockers.push('exact_scope_snapshot_request_work_output_or_route_mismatch')
  }
  if (receipt.terminalOutcome.state === 'unknown_reconciliation_required') {
    blockers.push('provider_attempt_unknown_outcome_not_reconciled')
  } else if (receipt.terminalOutcome.state !== 'succeeded') {
    blockers.push('provider_attempt_did_not_succeed')
  }
  if (receipt.cost.state !== 'complete') {
    blockers.push('provider_or_infrastructure_cost_not_reconciled')
  }
  if (receipt.cost.state === 'complete' && !costWithinAuthorizedCeilings(expectation, receipt)) {
    blockers.push('provider_or_infrastructure_cost_exceeds_authorized_ceiling')
  }
  if (receipt.terminalOutcome.state === 'succeeded' && !privateOutputMatches(expectation, receipt)) {
    blockers.push('private_output_integrity_missing_or_mismatched')
  }
  const uniqueBlockers = [...new Set(blockers)]
  const readyForPrivateCandidateIngest = uniqueBlockers.length === 0
  const state = readyForPrivateCandidateIngest
    ? 'admitted_for_private_candidate_ingest'
    : admissionState(uniqueBlockers)
  const base = {
    state,
    intent: expectation.intent,
    expectationId: expectation.expectationId,
    expectationDigest: expectation.expectationDigest,
    receiptDigest: receipt.receiptDigest,
    blockers: uniqueBlockers,
    readyForPrivateCandidateIngest,
    readyForObjectiveQa: false as const,
    readyForHumanReview: false as const,
    selectionEligible: false as const,
    finalMixEligible: false as const,
    timelineEligible: false as const,
  }
  return deepFreeze(motionStudioProviderAttemptAdmissionV1Schema.parse({
    ...base,
    admissionDigest: sha256CanonicalJson(base),
  }))
}

export const motionStudioProviderAttemptPortReadinessV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_ATTEMPT_PORT_READINESS_SCHEMA_VERSION),
  readinessId: stableIdSchema,
  createdAt: isoDateSchema,
  state: z.literal('consumption_port_ready_actual_canonical_receipts_absent'),
  supportedIntents: z.tuple([
    z.literal('generated_music_candidate'),
    z.literal('synchronized_foley_candidate'),
  ]).readonly(),
  boundaries: z.object({
    backendOwnsPackageQueueClaimLeaseAndDispatch: z.literal(true),
    backendOwnsCanonicalProviderOperationIdentity: z.literal(true),
    motionOwnsCandidateSemanticsNormalizationAndQa: z.literal(true),
    toolDispatchMayExecuteProviderRoutes: z.literal(false),
    duplicateQueueCreated: z.literal(false),
    duplicateProviderRegistryCreated: z.literal(false),
    duplicateCostAuthorityCreated: z.literal(false),
    browserMaySupplyReceiptAuthority: z.literal(false),
  }).strict(),
  readiness: z.object({
    strictReceiptSchemaReady: z.literal(true),
    strictExpectationSchemaReady: z.literal(true),
    terminalOutcomeReconciliationRepresented: z.literal(true),
    failedAttemptCostRetentionRepresented: z.literal(true),
    providerInfrastructureCostSeparationRepresented: z.literal(true),
    canonicalBackendRuntimeReceiptVerifierIntegrated: z.literal(false),
    actualCanonicalProviderReceiptPresent: z.literal(false),
    canonicalProviderOperationIdentityFrozen: z.literal(false),
    privateCandidateIngestActivated: z.literal(false),
    ms012dAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCount: z.literal(0),
    costMutationCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    selectionCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  readinessDigest: digestSchema,
}).strict()

export type MotionStudioProviderAttemptPortReadinessV1 =
  z.infer<typeof motionStudioProviderAttemptPortReadinessV1Schema>

export function createMotionStudioProviderAttemptPortReadiness(input: {
  createdAt: string
}): MotionStudioProviderAttemptPortReadinessV1 {
  const createdAt = canonicalIso(input.createdAt)
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_ATTEMPT_PORT_READINESS_SCHEMA_VERSION,
    readinessId: 'ms012d-canonical-provider-attempt-consumption-port-v1',
    createdAt,
    state: 'consumption_port_ready_actual_canonical_receipts_absent' as const,
    supportedIntents: MOTION_STUDIO_PROVIDER_ATTEMPT_INTENTS,
    boundaries: {
      backendOwnsPackageQueueClaimLeaseAndDispatch: true as const,
      backendOwnsCanonicalProviderOperationIdentity: true as const,
      motionOwnsCandidateSemanticsNormalizationAndQa: true as const,
      toolDispatchMayExecuteProviderRoutes: false as const,
      duplicateQueueCreated: false as const,
      duplicateProviderRegistryCreated: false as const,
      duplicateCostAuthorityCreated: false as const,
      browserMaySupplyReceiptAuthority: false as const,
    },
    readiness: {
      strictReceiptSchemaReady: true as const,
      strictExpectationSchemaReady: true as const,
      terminalOutcomeReconciliationRepresented: true as const,
      failedAttemptCostRetentionRepresented: true as const,
      providerInfrastructureCostSeparationRepresented: true as const,
      canonicalBackendRuntimeReceiptVerifierIntegrated: false as const,
      actualCanonicalProviderReceiptPresent: false as const,
      canonicalProviderOperationIdentityFrozen: false as const,
      privateCandidateIngestActivated: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCount: 0 as const,
      costMutationCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      selectionCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioProviderAttemptPortReadinessV1Schema.parse({
    ...base,
    readinessDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioProviderAttemptPortReadiness(
  input: MotionStudioProviderAttemptPortReadinessV1,
): MotionStudioProviderAttemptPortReadinessV1 {
  const parsed = motionStudioProviderAttemptPortReadinessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.readinessDigest
  if (sha256CanonicalJson(base) !== parsed.readinessDigest) {
    blocked('Provider-attempt port readiness failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

function exactLineageMatches(
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1,
  receipt: MotionStudioCanonicalProviderAttemptPortV1,
): boolean {
  return receipt.intent === expectation.intent &&
    receipt.workspaceId === expectation.workspaceId &&
    receipt.projectId === expectation.projectId &&
    receipt.editSessionId === expectation.editSessionId &&
    receipt.productionId === expectation.productionId &&
    receipt.approvedSnapshotId === expectation.approvedSnapshotId &&
    receipt.approvedSnapshotDigest === expectation.approvedSnapshotDigest &&
    receipt.approvedPackageId === expectation.approvedPackageId &&
    receipt.approvedPackageDigest === expectation.approvedPackageDigest &&
    receipt.approvedWorkItemId === expectation.approvedWorkItemId &&
    receipt.expectedOutputId === expectation.expectedOutputId &&
    receipt.sourceRequestId === expectation.sourceRequestId &&
    receipt.sourceRequestDigest === expectation.sourceRequestDigest &&
    receipt.providerRequestPayloadDigest === expectation.providerRequestPayloadDigest &&
    receipt.projectDataPolicyDigest === expectation.projectDataPolicyDigest &&
    receipt.providerAccountPolicyDigest === expectation.providerAccountPolicyDigest &&
    receipt.idempotencyKeyHash === expectation.idempotencyKeyHash &&
    receipt.providerRouteId === expectation.providerRouteId &&
    receipt.providerModelId === expectation.providerModelId &&
    (expectation.operationBinding.state !== 'frozen' ||
      receipt.providerOperationId === expectation.operationBinding.providerOperationId)
}

function privateOutputMatches(
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1,
  receipt: MotionStudioCanonicalProviderAttemptPortV1,
): boolean {
  const output = receipt.terminalOutcome.privateOutput
  return receipt.terminalOutcome.state === 'succeeded' && output !== null &&
    output.outputId === expectation.expectedOutputId &&
    output.role === expectation.expectedPrivateOutput.role &&
    output.mimeType === expectation.expectedPrivateOutput.mimeType &&
    output.byteLength <= expectation.expectedPrivateOutput.maximumByteLength
}

function costWithinAuthorizedCeilings(
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1,
  receipt: MotionStudioCanonicalProviderAttemptPortV1,
): boolean {
  return receipt.cost.state === 'complete' &&
    receipt.cost.providerCostMicros !== null &&
    receipt.cost.providerCostMicros <= expectation.maximumAuthorizedProviderCostMicros &&
    receipt.cost.infrastructureCostMicros !== null &&
    expectation.maximumAuthorizedInfrastructureCostMicros !== null &&
    receipt.cost.infrastructureCostMicros <= expectation.maximumAuthorizedInfrastructureCostMicros
}

function admissionState(
  blockers: readonly MotionStudioProviderAttemptAdmissionV1['blockers'][number][],
): MotionStudioProviderAttemptAdmissionV1['state'] {
  if (blockers.includes('actual_canonical_backend_receipt_required')) {
    return 'not_admitted_contract_fixture'
  }
  if (blockers.includes('canonical_provider_operation_identity_not_frozen')) {
    return 'not_admitted_operation_identity_pending'
  }
  if (blockers.includes('exact_scope_snapshot_request_work_output_or_route_mismatch') ||
      blockers.includes('private_output_integrity_missing_or_mismatched')) {
    return 'not_admitted_lineage_mismatch'
  }
  if (blockers.includes('provider_attempt_unknown_outcome_not_reconciled')) {
    return 'not_admitted_terminal_outcome'
  }
  if (blockers.includes('provider_attempt_did_not_succeed')) {
    return 'not_admitted_terminal_outcome'
  }
  if (
    blockers.includes('provider_or_infrastructure_cost_not_reconciled') ||
    blockers.includes('provider_or_infrastructure_cost_exceeds_authorized_ceiling')
  ) {
    return 'not_admitted_cost_reconciliation_required'
  }
  if (blockers.includes('canonical_backend_runtime_receipt_verifier_not_integrated')) {
    return 'not_admitted_runtime_verification_missing'
  }
  return 'not_admitted_cost_reconciliation_required'
}

function canonicalIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Provider-attempt port time must be canonical ISO-8601.')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_provider_attempt_port',
  })
}
