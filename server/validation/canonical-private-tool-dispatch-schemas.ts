import { z } from 'zod'

import { canonicalWorkerLeaseCredentialSchema, canonicalWorkerLeaseHashesSchema } from './canonical-worker-lease-authority-schemas'

export const CANONICAL_PRIVATE_TOOL_DISPATCH_RECORD_VERSION =
  'canonical-private-tool-dispatch-record-v1' as const
export const CANONICAL_PRIVATE_TOOL_DISPATCH_AGGREGATE_VERSION =
  'canonical-private-tool-dispatch-aggregate-v1' as const
export const CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION =
  'canonical-private-tool-dispatch-response-v1' as const

const safeIdentitySchema = z.string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'), 'Unsafe identity.')

const requestedToolNameSchema = z.string()
  .min(1)
  .max(128)
  .refine((value) => value === value.trim(), 'Tool name must not have surrounding whitespace.')
  .regex(/^[A-Za-z0-9@._ +()-]+$/)
  .refine(
    (value) => !value.includes('..') && !/(?:[a-z][a-z0-9+.-]*:|[/\\])/i.test(value),
    'Tool name contains a forbidden path or URI form.',
  )

const operationIdSchema = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'), 'Unsafe operation identity.')

const idempotencyKeySchema = z.string()
  .min(8)
  .max(240)
  .refine((value) => value === value.trim(), 'Idempotency key must not have surrounding whitespace.')
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }), 'Idempotency key contains control characters.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const timestampSchema = z.string().datetime({ offset: true })

const dispatchIdentitySchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  approvedWorkItemId: safeIdentitySchema,
  expectedAssetId: safeIdentitySchema,
  requestedToolName: requestedToolNameSchema,
  operationId: operationIdSchema,
}).strict()

/**
 * Public/service-call identity only. Lease credentials, paths, URLs, commands,
 * settings, artifacts, provider data, and cost values cannot be caller fields.
 */
export const authorizeCanonicalPrivateToolDispatchSchema = dispatchIdentitySchema.extend({
  purpose: z.literal('private_internal_canonical_tool_dispatch_authorization'),
  idempotencyKey: idempotencyKeySchema,
}).strict()

/** Server-injected authority. This is deliberately not part of the request schema. */
export const canonicalPrivateToolDispatchLeaseAuthoritySchema = z.object({
  leaseId: safeIdentitySchema,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
}).strict()

export const canonicalPrivateToolDispatchCredentialSchema = z.string()
  .regex(/^rpdt_v1_[A-Za-z0-9_-]{43}$/)

export const consumeCanonicalPrivateToolDispatchSchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  grantId: safeIdentitySchema,
  purpose: z.literal('private_internal_canonical_tool_dispatch_consume'),
  idempotencyKey: idempotencyKeySchema,
}).strict()

/** Both credentials are injected by the private worker control plane. */
export const canonicalPrivateToolDispatchConsumptionAuthoritySchema = z.object({
  leaseId: safeIdentitySchema,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

const expectedOutputBindingSchema = z.object({
  outputKey: safeIdentitySchema,
  artifactType: safeIdentitySchema,
  assetRole: z.enum(['processed', 'generated', 'qa', 'preview', 'final']),
  required: z.boolean(),
  previewPlaceholderAllowed: z.boolean(),
  contentType: z.string().min(1).max(160).optional(),
  segmentIds: z.array(safeIdentitySchema).max(256),
  timingIds: z.array(safeIdentitySchema).max(512),
  rendererLayerIds: z.array(safeIdentitySchema).max(512),
}).strict()

/**
 * Compact, non-secret commitment to the exact dependency authority carried by
 * worker-lease v2. `authorityHash` commits the full authority object and
 * `selectedArtifactsHash` independently commits the ordered, frozen artifact
 * selections without returning those selections from the dispatch response.
 */
const immutableLeaseDependencyAuthorityBindingSchema = z.object({
  state: z.enum(['not_required_for_root_job', 'private_test_dependencies_verified']),
  readinessHash: sha256Schema,
  authorityHash: sha256Schema,
  selectedArtifactsHash: sha256Schema,
  selectedArtifactCount: z.number().int().nonnegative().max(2_048),
  liveRuntimeEligible: z.literal(false),
}).strict().superRefine((binding, context) => {
  if (
    (binding.state === 'not_required_for_root_job' && binding.selectedArtifactCount !== 0) ||
    (binding.state === 'private_test_dependencies_verified' && binding.selectedArtifactCount === 0)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Dispatch dependency-authority state and selected-artifact count are inconsistent.',
    })
  }
})

const immutableDispatchBindingSchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  approvedPlanSnapshotId: safeIdentitySchema,
  approvedWorkItemId: safeIdentitySchema,
  expectedAssetId: safeIdentitySchema,
  requestedToolName: requestedToolNameSchema,
  canonicalToolId: safeIdentitySchema,
  operationId: operationIdSchema,
  leaseId: safeIdentitySchema,
  leaseAttemptNumber: z.number().int().positive().max(10),
  leaseImmutableHash: sha256Schema,
  leaseDependencyAuthority: immutableLeaseDependencyAuthorityBindingSchema,
  leaseExecutionFenceState: z.literal('not_started'),
  reservationId: safeIdentitySchema,
  maximumCreditBudget: z.number().int().positive().max(10_000_000),
  remainingReservedCreditsAtDecision: z.number().int().positive().max(10_000_000),
  expectedOutput: expectedOutputBindingSchema,
}).strict()

export const canonicalPrivateToolDispatchRecordSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_TOOL_DISPATCH_RECORD_VERSION),
  id: safeIdentitySchema,
  status: z.enum(['authorized', 'denied', 'consumed', 'expired']),
  binding: immutableDispatchBindingSchema,
  authorityRevision: z.number().int().positive(),
  canonicalHashes: canonicalWorkerLeaseHashesSchema,
  toolOperationSpecHash: sha256Schema,
  runtimeEvidenceAuthorityHash: sha256Schema,
  runtimeEvidenceRecordHash: sha256Schema,
  privateRuntimeAuthorityHash: sha256Schema,
  privateRuntimeImageIdentityHash: sha256Schema,
  specPrivateInternalReady: z.boolean(),
  runtimePrivateInternalReady: z.boolean(),
  specProductReady: z.boolean(),
  runtimeProductReady: z.boolean(),
  exactOperationApproved: z.boolean(),
  offlineExecutionOnly: z.boolean(),
  decisionRequestHash: sha256Schema,
  credentialHashSha256: sha256Schema.optional(),
  immutableGrantHash: sha256Schema,
  blockers: z.array(safeIdentitySchema).max(32),
  issuedAt: timestampSchema,
  expiresAt: timestampSchema,
  consumedAt: timestampSchema.optional(),
  expiredAt: timestampSchema.optional(),
}).strict().superRefine((record, context) => {
  const issuedAt = Date.parse(record.issuedAt)
  const expiresAt = Date.parse(record.expiresAt)
  if (expiresAt <= issuedAt) {
    context.addIssue({ code: 'custom', message: 'Dispatch grant expiry must follow issuance.' })
  }
  const authorizedShape = record.status === 'authorized' &&
    record.credentialHashSha256 !== undefined &&
    record.blockers.length === 0 &&
    record.specPrivateInternalReady &&
    record.runtimePrivateInternalReady &&
    record.exactOperationApproved &&
    record.offlineExecutionOnly &&
    record.consumedAt === undefined &&
    record.expiredAt === undefined
  const deniedShape = record.status === 'denied' &&
    record.credentialHashSha256 === undefined &&
    record.blockers.length > 0 &&
    record.consumedAt === undefined &&
    record.expiredAt === undefined
  const consumedShape = record.status === 'consumed' &&
    record.credentialHashSha256 !== undefined &&
    record.consumedAt !== undefined &&
    record.expiredAt === undefined &&
    Date.parse(record.consumedAt) >= issuedAt &&
    Date.parse(record.consumedAt) <= expiresAt
  const expiredShape = record.status === 'expired' &&
    record.credentialHashSha256 !== undefined &&
    record.consumedAt === undefined &&
    record.expiredAt !== undefined &&
    Date.parse(record.expiredAt) >= expiresAt
  if (!authorizedShape && !deniedShape && !consumedShape && !expiredShape) {
    context.addIssue({ code: 'custom', message: 'Dispatch grant state is inconsistent.' })
  }
})

export const canonicalPrivateToolDispatchIdempotencyRecordSchema = z.object({
  operation: z.enum(['authorize', 'consume']),
  keyHash: sha256Schema,
  requestHash: sha256Schema,
  grantId: safeIdentitySchema,
  createdAt: timestampSchema,
}).strict()

export const canonicalPrivateToolDispatchAuditEventSchema = z.object({
  id: safeIdentitySchema,
  eventType: z.enum(['authorized', 'denied', 'consumed', 'expired']),
  grantId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  approvedWorkItemId: safeIdentitySchema,
  expectedAssetId: safeIdentitySchema,
  canonicalToolId: safeIdentitySchema,
  operationId: operationIdSchema,
  leaseId: safeIdentitySchema,
  leaseAttemptNumber: z.number().int().positive().max(10),
  createdAt: timestampSchema,
}).strict()

export const canonicalPrivateToolDispatchAggregateSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_TOOL_DISPATCH_AGGREGATE_VERSION),
  source: z.literal('private_single_host_canonical_tool_dispatch_authority'),
  workspaceId: safeIdentitySchema,
  ownerUserId: safeIdentitySchema,
  revision: z.number().int().nonnegative(),
  grants: z.array(canonicalPrivateToolDispatchRecordSchema).max(4_096),
  idempotencyRecords: z.array(canonicalPrivateToolDispatchIdempotencyRecordSchema).max(8_192),
  auditEvents: z.array(canonicalPrivateToolDispatchAuditEventSchema).max(16_384),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).strict()

export const persistedCanonicalPrivateToolDispatchAggregateSchema = z.object({
  recordVersion: z.literal(CANONICAL_PRIVATE_TOOL_DISPATCH_AGGREGATE_VERSION),
  source: z.literal('private_single_host_canonical_tool_dispatch_store'),
  aggregate: canonicalPrivateToolDispatchAggregateSchema,
  checksumSha256: sha256Schema,
}).strict()

const executionAuthoritySchema = z.object({
  dispatchGrantRecorded: z.literal(true),
  dispatchAuthorized: z.boolean(),
  toolExecutionAuthorized: z.literal(false),
  providerCallAuthorized: z.literal(false),
  sourceObjectReadAuthorized: z.literal(false),
  artifactWriteAuthorized: z.literal(false),
  renderAuthorized: z.literal(false),
  privatePreviewRenderAuthorized: z.literal(false),
  privateCaptionRenderAuthorized: z.literal(false),
  privateFinalCompositionAuthorized: z.literal(false),
  creditSpendAuthorized: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  settlementAuthorized: z.literal(false),
  noExecutionSideEffects: z.literal(true),
}).strict()

export const canonicalPrivateToolDispatchResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION),
  source: z.literal('canonical_private_tool_dispatch_authority'),
  purpose: z.literal('private_internal_canonical_tool_dispatch_authorization'),
  grant: z.object({
    grantId: safeIdentitySchema,
    status: z.enum(['authorized', 'denied', 'consumed', 'expired']),
    binding: immutableDispatchBindingSchema,
    blockers: z.array(safeIdentitySchema).max(32),
    issuedAt: timestampSchema,
    expiresAt: timestampSchema,
    singleUse: z.literal(true),
    consumptionRequiredBeforeExecution: z.literal(true),
    credentialIssued: z.boolean(),
    immutableGrantHash: sha256Schema,
  }).strict(),
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema.optional(),
  evidence: z.object({
    tenantAndCanonicalAuthority: z.literal('passed'),
    activeOpaqueLease: z.literal('passed'),
    fundedReservationAndBudget: z.literal('passed'),
    exactWorkItemAndOutput: z.literal('passed'),
    canonicalToolApproval: z.literal('passed'),
    exactOperationContract: z.literal('passed'),
    providerAndRenderBoundary: z.literal('passed'),
    leaseDependencyAuthorityBinding: z.literal('passed'),
    leaseExecutionFenceNotStarted: z.literal('passed'),
    specProductReady: z.boolean(),
    runtimeProductReady: z.boolean(),
    runtimeEvidenceAuthorityHash: sha256Schema,
    runtimeEvidenceRecordHash: sha256Schema,
    privateRuntimeAuthorityHash: sha256Schema,
    privateRuntimeImageIdentityHash: sha256Schema,
    specPrivateInternalReady: z.boolean(),
    runtimePrivateInternalReady: z.boolean(),
    toolOperationSpecHash: sha256Schema,
    leaseCredentialReturned: z.literal(false),
    leaseCredentialHashReturned: z.literal(false),
    rawExecutionInputReturned: z.literal(false),
    sourceLocationReturned: z.literal(false),
    callerPathUrlCommandAccepted: z.literal(false),
  }).strict(),
  executionAuthority: executionAuthoritySchema,
  persistenceEvidence: z.object({
    privateSingleHostOnly: z.literal(true),
    checksumProtected: z.literal(true),
    credentialStoredAsSha256Only: z.literal(true),
    oneActiveGrantPerExactBinding: z.literal(true),
    dependencyAuthorityCommittedToGrant: z.literal(true),
    notStartedExecutionFenceCommittedToGrant: z.literal(true),
    distributedAuthority: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  responseHash: sha256Schema,
  testOnly: z.literal(true),
}).strict().superRefine((response, context) => {
  const authorized = response.grant.status === 'authorized'
  if (
    authorized !== response.grant.credentialIssued ||
    authorized !== (response.dispatchCredential !== undefined) ||
    authorized !== response.executionAuthority.dispatchAuthorized
  ) {
    context.addIssue({ code: 'custom', message: 'Dispatch response authority or credential state is inconsistent.' })
  }
})

export const canonicalPrivateToolDispatchConsumptionResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_TOOL_DISPATCH_RESPONSE_VERSION),
  source: z.literal('canonical_private_tool_dispatch_authority'),
  purpose: z.literal('private_internal_canonical_tool_dispatch_consume'),
  consumed: z.literal(true),
  consumedAt: timestampSchema,
  executionAttemptId: safeIdentitySchema,
  consumptionReplayed: z.boolean(),
  grant: z.object({
    grantId: safeIdentitySchema,
    status: z.literal('consumed'),
    binding: immutableDispatchBindingSchema,
    issuedAt: timestampSchema,
    expiresAt: timestampSchema,
    immutableGrantHash: sha256Schema,
    singleUse: z.literal(true),
    credentialReturned: z.literal(false),
  }).strict(),
  verificationEvidence: z.object({
    tenantAndCanonicalAuthority: z.literal('passed'),
    activeOpaqueLease: z.literal('passed'),
    timingSafeDispatchCredentialMatch: z.literal('passed'),
    immutableGrantHash: z.literal('passed'),
    exactWorkItemOutputToolOperation: z.literal('passed'),
    fundedReservationAndBudget: z.literal('passed'),
    toolOperationSpecHash: z.literal('passed'),
    runtimeEvidenceAuthorityHash: z.literal('passed'),
    runtimeEvidenceRecordHash: z.literal('passed'),
    privateRuntimeAuthorityHash: z.literal('passed'),
    privateRuntimeImageIdentityHash: z.literal('passed'),
    privateInternalReadiness: z.literal('passed'),
    leaseDependencyAuthorityBinding: z.literal('passed'),
    leaseExecutionFenceNotStarted: z.literal('passed'),
    atomicSingleUseTransition: z.literal('passed'),
    leaseCredentialReturned: z.literal(false),
    dispatchCredentialReturned: z.literal(false),
    credentialHashReturned: z.literal(false),
  }).strict(),
  executionAuthority: z.object({
    dispatchGrantConsumed: z.literal(true),
    newExecutionStartAuthorized: z.boolean(),
    resumeSameIdempotentAttemptOnly: z.boolean(),
    toolExecutionAuthorized: z.boolean(),
    executionAttemptId: safeIdentitySchema,
    outputPromotionRequiresCreateOnlyAttemptId: z.literal(true),
    costEventRequiresSameIdempotentAttemptId: z.literal(true),
    providerCallAuthorized: z.literal(false),
    sourceObjectReadAuthorized: z.literal(false),
    artifactWriteAuthorized: z.literal(false),
    renderAuthorized: z.literal(false),
    privatePreviewRenderAuthorized: z.boolean(),
    privateCaptionRenderAuthorized: z.boolean(),
    privateFinalCompositionAuthorized: z.boolean(),
    creditSpendAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    settlementAuthorized: z.literal(false),
    toolExecutionPerformedByConsume: z.literal(false),
  }).strict(),
  responseHash: sha256Schema,
  testOnly: z.literal(true),
}).strict().superRefine((response, context) => {
  if (
    response.executionAttemptId !== response.grant.grantId ||
    response.executionAuthority.executionAttemptId !== response.executionAttemptId ||
    response.executionAuthority.newExecutionStartAuthorized !== !response.consumptionReplayed ||
    response.executionAuthority.resumeSameIdempotentAttemptOnly !== response.consumptionReplayed ||
    response.executionAuthority.toolExecutionAuthorized !== !response.consumptionReplayed
  ) {
    context.addIssue({ code: 'custom', message: 'Dispatch consumption replay semantics are inconsistent.' })
  }
})

export type AuthorizeCanonicalPrivateToolDispatchInput = z.infer<
  typeof authorizeCanonicalPrivateToolDispatchSchema
>
export type CanonicalPrivateToolDispatchLeaseAuthority = z.infer<
  typeof canonicalPrivateToolDispatchLeaseAuthoritySchema
>
export type ConsumeCanonicalPrivateToolDispatchInput = z.infer<
  typeof consumeCanonicalPrivateToolDispatchSchema
>
export type CanonicalPrivateToolDispatchConsumptionAuthority = z.infer<
  typeof canonicalPrivateToolDispatchConsumptionAuthoritySchema
>
export type CanonicalPrivateToolDispatchRecord = z.infer<
  typeof canonicalPrivateToolDispatchRecordSchema
>
export type CanonicalPrivateToolDispatchAggregate = z.infer<
  typeof canonicalPrivateToolDispatchAggregateSchema
>
export type CanonicalPrivateToolDispatchIdempotencyRecord = z.infer<
  typeof canonicalPrivateToolDispatchIdempotencyRecordSchema
>
export type CanonicalPrivateToolDispatchResponse = z.infer<
  typeof canonicalPrivateToolDispatchResponseSchema
>
export type CanonicalPrivateToolDispatchConsumptionResponse = z.infer<
  typeof canonicalPrivateToolDispatchConsumptionResponseSchema
>
