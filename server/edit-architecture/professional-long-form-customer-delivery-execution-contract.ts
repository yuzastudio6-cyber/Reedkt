import { z } from 'zod'

import {
  professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
} from './professional-long-form-first-object-chunk-execution-contract'

export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORITY_VERSION =
  'professional-long-form-customer-delivery-root-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORIZATION_VERSION =
  'professional-long-form-customer-delivery-root-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_ATTEMPT_VERSION =
  'professional-long-form-customer-delivery-root-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_VALIDATION_VERSION =
  'professional-long-form-customer-delivery-root-validation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_QA_VERSION =
  'professional-long-form-customer-delivery-root-qa-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RECONCILIATION_VERSION =
  'professional-long-form-customer-delivery-root-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_TERMINAL_VERSION =
  'professional-long-form-customer-delivery-root-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COMPLETION_VERSION =
  'professional-long-form-customer-delivery-root-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORITY_VERSION =
  'professional-long-form-customer-delivery-h264-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORIZATION_VERSION =
  'professional-long-form-customer-delivery-h264-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_ATTEMPT_VERSION =
  'professional-long-form-customer-delivery-h264-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNTIME_EVIDENCE_VERSION =
  'professional-long-form-customer-delivery-h264-runtime-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECONCILIATION_VERSION =
  'professional-long-form-customer-delivery-h264-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_TERMINAL_VERSION =
  'professional-long-form-customer-delivery-h264-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_COMPLETION_VERSION =
  'professional-long-form-customer-delivery-h264-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_KIND =
  'validate_private_review_master_qa' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID =
  'internal.validate_professional_long_form_customer_delivery_source.v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RUNNER_CLASS =
  'canonical_long_form_delivery_review_gate_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID =
  'long_form_delivery_review_gate_cpu_1vcpu_1gib_v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND =
  'encode_customer_delivery_h264_chunk' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID =
  'tool.remotion.render_approved_composition.v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNNER_CLASS =
  'canonical_long_form_delivery_h264_chunk_remotion_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID =
  'remotion_4k_h264_video_chunk_cpu_4vcpu_8gib_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECIPE_ID =
  'approved_long_form_delivery_h264_video_chunk_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const expectedOutputIdentity = z.string().trim().min(1).max(512)
const jsonBlobRef = z.object({
  sha256,
  byteLength: positiveInteger.max(4 * 1024 * 1024),
}).strict()

const commercialBoundarySchema = z.object({
  internalProductionCostOnly: z.literal(true),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  approvedFourKEstimateAndReservationReused: z.literal(true),
  customerDeliveryCoveredByOriginalApprovedEstimate: z.literal(true),
  secondExportEstimateCreated: z.literal(false),
  secondExportChargeCreated: z.literal(false),
  exportTimeEstimatePromptAllowed: z.literal(false),
  exportTimeCreditPromptAllowed: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  settlementAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const persistenceSchema = z.object({
  privateLocalContentAddressed: z.literal(true),
  queueReceiptRequiredBeforeLease: z.literal(true),
  queueAttemptRequiredBeforeOperation: z.literal(true),
  queueCompletionIsAuthorityCommit: z.literal(true),
  orphanBlobsGrantExecutionAuthority: z.literal(false),
  distributedDatabaseBacked: z.literal(false),
  productionDurabilityProven: z.literal(false),
}).strict()

const approvalSchema = z.object({
  approvedByUserId: identity,
  approvalRecordId: identity,
  approvedEstimateId: identity,
  creditReservationId: identity,
  reservationStatus: z.literal('reserved'),
  remainingReservedCredits: positiveInteger,
  reservationExpiresAt: timestamp,
  snapshotApprovedAt: timestamp,
}).strict()

const commonIdentitySchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanId: identity,
  approvedPlanSnapshotId: identity,
  approvedPlanSnapshotHash: sha256,
  packageRecordId: identity,
  jobId: identity,
  approvedWorkItemId: identity,
  expectedOutputIdentity,
}).strict()

const commonDeliveryLineageSchema = z.object({
  sourceReviewPackageRecordId: identity,
  sourceReviewPackageHash: sha256,
  sourceReviewQueueDefinitionHash: sha256,
  sourceReviewQueueAggregateHash: sha256,
  sourcePrivateMasterQaJobId: identity,
  sourcePrivateMasterQaApprovedWorkItemId: identity,
  sourcePrivateMasterQaQueueCompletionHash: sha256,
  sourcePrivateMasterQaCanonicalResultHash: sha256,
  sourcePrivateMasterQaArtifactHash: sha256,
  deliveryPackageHash: sha256,
  deliveryPackageRef: jsonBlobRef,
  deliveryPlacementManifestHash: sha256,
  deliveryPlacementManifestRef: jsonBlobRef,
  deliveryWorkGraphHash: sha256,
  deliveryOperationBoundaryHash: sha256,
  deliveryPlacementAuthorityHash: sha256,
  queueDefinitionHash: sha256,
  queueCreatedEventHash: sha256,
}).strict()

const rootOperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
  ),
}).strict()

const h264OperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
  ),
  fixedRecipeProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECIPE_ID,
  ),
}).strict()

const commonAttemptFields = {
  source: z.literal('private_canonical_package_work_queue_store'),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  claimId: identity,
  claimHash: sha256,
  workerIdentityHash: sha256,
  deliveryAttempt: z.literal(1),
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}

export const professionalLongFormDeliveryRootAuthorizationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORIZATION_VERSION,
  ),
  source: z.literal(
    'server_persisted_professional_long_form_customer_delivery_root_authority',
  ),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_KIND),
  expectedOutputIdentity,
  operation: rootOperationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    immutableDeliveryAuthorityValidation: z.literal(true),
    privateValidationArtifact: z.literal(true),
    privateQaAndReconciliation: z.literal(true),
    mediaReadOrTransform: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264AuthorizationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORIZATION_VERSION,
  ),
  source: z.literal(
    'server_persisted_professional_long_form_customer_delivery_h264_authority',
  ),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND),
  expectedOutputIdentity: sha256,
  operation: h264OperationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    exactPassedVp9ArtifactRead: z.literal(true),
    fixedH264Recipe: z.literal(true),
    createOnlyPrivateMediaPersistence: z.literal(true),
    independentQaRequiredBeforeDownstream: z.literal(true),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormDeliveryRootAttemptSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_ATTEMPT_VERSION),
  ...commonAttemptFields,
  operation: rootOperationSchema,
}).strict()

export const professionalLongFormDeliveryH264AttemptSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_ATTEMPT_VERSION),
  ...commonAttemptFields,
  operation: h264OperationSchema,
}).strict()

export const professionalLongFormDeliveryRootAuthoritySchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORITY_VERSION),
  source: z.literal(
    'server_reopened_professional_long_form_customer_delivery_root_authority',
  ),
  purpose: z.literal(
    'authorize_one_private_customer_delivery_source_review_validation',
  ),
  status: z.literal(
    'delivery_root_private_execution_authorized_h264_children_blocked',
  ),
  identity: commonIdentitySchema.extend({
    kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_KIND),
  }).strict(),
  approval: approvalSchema,
  lineage: commonDeliveryLineageSchema.extend({
    rootJobDefinitionHash: sha256,
    rootPlacementHash: sha256,
    sourceReviewDependencyJobId: identity,
  }).strict(),
  operation: rootOperationSchema.extend({
    workerType: z.literal('api_service'),
    resourceClassId: z.literal('control_plane_cpu_v1'),
    maximumAttempts: z.literal(1),
    attemptTimeoutSeconds: z.literal(300),
    leaseDurationMilliseconds: z.literal(60_000),
    vcpuCount: z.literal(1),
    memoryGib: z.literal(1),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableDeliveryPackageRequired: z.literal(true),
    immutablePlacementAndQueueRequired: z.literal(true),
    passedPrivateMasterQaLineageRequired: z.literal(true),
    originalReservationRequired: z.literal(true),
    privateValidationArtifact: z.literal(true),
    privateQa: z.literal(true),
    privateReconciliation: z.literal(true),
    downstreamDependencyEvidence: z.literal(true),
    furtherDeliveryExecution: z.literal(false),
    mediaReadOrTransform: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: persistenceSchema,
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

const approvedDeliveryChunkSchema = z.object({
  chunkId: identity,
  chunkIndex: z.number().int().min(1).max(124),
  chunkCount: z.number().int().min(2).max(124),
  globalStartFrame: z.number().int().nonnegative().max(647_999),
  globalEndFrameExclusive: z.number().int().positive().max(648_000),
  durationFrames: z.number().int().min(1_350).max(5_400),
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
  chunkAuthorityHash: sha256,
  sourceQaArtifactHash: sha256,
  sourceVp9Artifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
  expectedH264ObjectIdentity: sha256,
}).strict().superRefine((chunk, context) => {
  if (
    chunk.chunkIndex > chunk.chunkCount ||
    chunk.globalEndFrameExclusive - chunk.globalStartFrame !==
      chunk.durationFrames
  ) context.addIssue({
    code: 'custom',
    message: 'Customer-delivery H.264 chunk timing is inconsistent.',
  })
})

export const professionalLongFormDeliveryH264AuthoritySchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORITY_VERSION),
  source: z.literal(
    'server_reopened_professional_long_form_customer_delivery_h264_authority',
  ),
  purpose: z.literal(
    'authorize_one_private_passed_vp9_chunk_to_h264_delivery_transcode',
  ),
  status: z.literal(
    'delivery_h264_chunk_private_execution_authorized_independent_qa_required',
  ),
  identity: commonIdentitySchema.extend({
    kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_KIND),
  }).strict(),
  approval: approvalSchema,
  approvedChunk: approvedDeliveryChunkSchema,
  lineage: commonDeliveryLineageSchema.extend({
    h264JobDefinitionHash: sha256,
    h264PlacementHash: sha256,
    rootJobId: identity,
    rootQueueCompletionHash: sha256,
    rootCanonicalResultHash: sha256,
    rootAttemptInternalCostEvidenceHash: sha256,
    sourceRenderJobId: identity,
    sourceRenderQueueCompletionHash: sha256,
    sourceRenderCanonicalResultHash: sha256,
    sourceQaJobId: identity,
    sourceQaQueueCompletionHash: sha256,
    sourceQaCanonicalResultHash: sha256,
    remotionRuntimeAuthorityHash: sha256,
    remotionImageIdentityHash: sha256,
  }).strict(),
  operation: h264OperationSchema.extend({
    workerType: z.literal('render_worker'),
    resourceClassId: z.literal('render_cpu_high_memory_v1'),
    maximumAttempts: z.literal(2),
    attemptTimeoutSeconds: z.literal(21_600),
    leaseDurationMilliseconds: z.literal(300_000),
    vcpuCount: z.literal(4),
    memoryGib: z.literal(8),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableRootCompletionRequired: z.literal(true),
    exactPassedVp9ArtifactRead: z.literal(true),
    exactSourceChecksumRequired: z.literal(true),
    fixedH264HighCrf18MediumRecipe: z.literal(true),
    privateMediaArtifactCreateOnly: z.literal(true),
    independentQaRequiredBeforeDownstream: z.literal(true),
    furtherDeliveryExecution: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: persistenceSchema,
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264ArtifactRefSchema = z.object({
  objectIdentity: sha256,
  mediaFormat: z.literal('mp4'),
  contentType: z.literal('video/mp4'),
  byteLength: positiveInteger.max(3 * 1024 * 1024 * 1024),
  sha256,
  objectVersion: z.literal(1),
  assetRole: z.literal('processed'),
  sourceChunkId: identity,
  chunkIndex: z.number().int().min(1).max(124),
  chunkCount: z.number().int().min(2).max(124),
  globalStartFrame: z.number().int().nonnegative().max(647_999),
  globalEndFrameExclusive: z.number().int().positive().max(648_000),
  durationFrames: z.number().int().min(1_350).max(5_400),
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
  videoCodec: z.literal('h264'),
  videoProfile: z.literal('high'),
  encoderCrf: z.literal(18),
  encoderPreset: z.literal('medium'),
  pixelFormat: z.literal('yuv420p'),
  colorRange: z.literal('tv'),
  colorSpace: z.literal('bt709'),
  colorTransfer: z.literal('bt709'),
  colorPrimaries: z.literal('bt709'),
  audioStreamCount: z.literal(0),
  privateLocalCreateOnly: z.literal(true),
  databaseBacked: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
}).strict().superRefine((artifact, context) => {
  if (
    artifact.chunkIndex > artifact.chunkCount ||
    artifact.globalEndFrameExclusive - artifact.globalStartFrame !==
      artifact.durationFrames
  ) context.addIssue({
    code: 'custom',
    message: 'Customer-delivery H.264 artifact timing is inconsistent.',
  })
})

export const professionalLongFormDeliveryRootValidationArtifactSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_VALIDATION_VERSION),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_root_validation',
  ),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    jobId: identity,
    approvedWorkItemId: identity,
    executionAttemptId: identity,
  }).strict(),
  authorityHash: sha256,
  executionAttemptHash: sha256,
  operation: rootOperationSchema,
  checks: z.object({
    exactApprovedSnapshotAndReservation: z.literal('passed'),
    exactDeliveryPackageAndPlacement: z.literal('passed'),
    exactQueueAndRootJob: z.literal('passed'),
    passedPrivateMasterQaSourceLineage: z.literal('passed'),
    originalFourKEstimateReused: z.literal('passed'),
    noSecondEstimateOrCharge: z.literal('passed'),
    oneUseAttemptAndCommercialBoundary: z.literal('passed'),
  }).strict(),
  valid: z.literal(true),
  validatedAt: timestamp,
  artifactHash: sha256,
}).strict()

export const professionalLongFormDeliveryRootQaEvidenceSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_QA_VERSION),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_root_qa',
  ),
  jobId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  validationArtifactHash: sha256,
  checks: z.object({
    schemaAndChecksum: z.literal('passed'),
    deliveryAndSourceReviewLineage: z.literal('passed'),
    queueAttemptAndReservationBoundary: z.literal('passed'),
    noMediaProviderOrCommercialMutation: z.literal('passed'),
  }).strict(),
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
  qaHash: sha256,
}).strict()

const deliveryDownstreamSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  sourceChunkId: identity,
  dependencyJobId: identity,
  dependencySatisfiedByThisCompletion: z.literal(true),
  executionAuthorized: z.literal(false),
  capabilityBlockedPendingExactAuthority: z.literal(true),
}).strict()

export const professionalLongFormDeliveryRootReconciliationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_root_reconciliation',
  ),
  rootJobId: identity,
  rootApprovedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  downstreamH264Chunks: z.array(deliveryDownstreamSchema).min(2).max(124),
  decision: z.literal(
    'delivery_source_review_valid_h264_execution_still_exact_authority_gated',
  ),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormDeliveryRootTerminalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_TERMINAL_VERSION),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: rootOperationSchema,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  h264ExecutionAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormDeliveryRootCompletionSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COMPLETION_VERSION),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: rootOperationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export const professionalLongFormDeliveryH264RuntimeEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_RUNTIME_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_h264_runner',
  ),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    jobId: identity,
    approvedWorkItemId: identity,
    chunkId: identity,
    executionAttemptId: identity,
  }).strict(),
  authorityHash: sha256,
  executionAttemptHash: sha256,
  operation: h264OperationSchema,
  requestEnvelopeSha256: sha256,
  sourceVp9Sha256: sha256,
  outputArtifact: professionalLongFormDeliveryH264ArtifactRefSchema,
  runtime: z.object({
    packageVersion: z.literal('4.0.487'),
    imageIdentityHash: sha256,
    attestationRecordId: identity,
    attestationHash: sha256,
    resourceProfileId: z.literal('delivery_h264_chunk_cpu_4vcpu_8gib_v1'),
    networkMode: z.literal('none'),
    readOnlyRootFilesystem: z.literal(true),
    nonRootUser: z.literal('10001:10001'),
    containerExitCode: z.literal(0),
    oomKilled: z.literal(false),
  }).strict(),
  checks: z.object({
    exactPassedVp9ArtifactReopened: z.literal('passed'),
    sourceChecksumReverified: z.literal('passed'),
    fixedH264HighCrf18MediumRecipeExecuted: z.literal('passed'),
    frameTimingAndUhdFramePreserved: z.literal('passed'),
    videoOnlyAndBt709LimitedEncoded: z.literal('passed'),
    exactPrivateCreateOnlyPersistence: z.literal('passed'),
    independentQaStillRequired: z.literal(true),
  }).strict(),
  completedAt: timestamp,
  evidenceHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264ReconciliationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_h264_reconciliation',
  ),
  h264JobId: identity,
  h264ApprovedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  outputArtifact: professionalLongFormDeliveryH264ArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  qaDependency: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    dependencyJobId: identity,
    dependencySatisfiedByThisCompletion: z.literal(true),
    executionAuthorized: z.literal(false),
    capabilityBlockedPendingQueueGate: z.literal(true),
  }).strict(),
  decision: z.literal(
    'private_h264_chunk_ready_independent_qa_execution_not_yet_authorized',
  ),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264TerminalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_TERMINAL_VERSION),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: h264OperationSchema,
  outputArtifact: professionalLongFormDeliveryH264ArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  independentQaCompleted: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264CompletionSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_COMPLETION_VERSION),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: h264OperationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outputArtifact: professionalLongFormDeliveryH264ArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export type ProfessionalLongFormDeliveryRootAuthorization = z.infer<
  typeof professionalLongFormDeliveryRootAuthorizationSchema
>
export type ProfessionalLongFormDeliveryH264Authorization = z.infer<
  typeof professionalLongFormDeliveryH264AuthorizationSchema
>
export type ProfessionalLongFormDeliveryRootAttempt = z.infer<
  typeof professionalLongFormDeliveryRootAttemptSchema
>
export type ProfessionalLongFormDeliveryH264Attempt = z.infer<
  typeof professionalLongFormDeliveryH264AttemptSchema
>
export type ProfessionalLongFormDeliveryRootAuthority = z.infer<
  typeof professionalLongFormDeliveryRootAuthoritySchema
>
export type ProfessionalLongFormDeliveryH264Authority = z.infer<
  typeof professionalLongFormDeliveryH264AuthoritySchema
>
export type ProfessionalLongFormDeliveryH264ArtifactRef = z.infer<
  typeof professionalLongFormDeliveryH264ArtifactRefSchema
>
export type ProfessionalLongFormDeliveryRootValidationArtifact = z.infer<
  typeof professionalLongFormDeliveryRootValidationArtifactSchema
>
export type ProfessionalLongFormDeliveryRootQaEvidence = z.infer<
  typeof professionalLongFormDeliveryRootQaEvidenceSchema
>
export type ProfessionalLongFormDeliveryRootReconciliation = z.infer<
  typeof professionalLongFormDeliveryRootReconciliationSchema
>
export type ProfessionalLongFormDeliveryRootTerminal = z.infer<
  typeof professionalLongFormDeliveryRootTerminalSchema
>
export type ProfessionalLongFormDeliveryRootCompletion = z.infer<
  typeof professionalLongFormDeliveryRootCompletionSchema
>
export type ProfessionalLongFormDeliveryH264RuntimeEvidence = z.infer<
  typeof professionalLongFormDeliveryH264RuntimeEvidenceSchema
>
export type ProfessionalLongFormDeliveryH264Reconciliation = z.infer<
  typeof professionalLongFormDeliveryH264ReconciliationSchema
>
export type ProfessionalLongFormDeliveryH264Terminal = z.infer<
  typeof professionalLongFormDeliveryH264TerminalSchema
>
export type ProfessionalLongFormDeliveryH264Completion = z.infer<
  typeof professionalLongFormDeliveryH264CompletionSchema
>
