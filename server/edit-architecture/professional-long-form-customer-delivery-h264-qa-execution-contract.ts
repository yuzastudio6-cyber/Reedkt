import { z } from 'zod'

import {
  professionalLongFormDeliveryH264ArtifactRefSchema,
} from './professional-long-form-customer-delivery-execution-contract'

export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORITY_VERSION =
  'professional-long-form-customer-delivery-h264-qa-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORIZATION_VERSION =
  'professional-long-form-customer-delivery-h264-qa-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ATTEMPT_VERSION =
  'professional-long-form-customer-delivery-h264-qa-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ARTIFACT_VERSION =
  'professional-long-form-customer-delivery-h264-qa-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECONCILIATION_VERSION =
  'professional-long-form-customer-delivery-h264-qa-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_TERMINAL_VERSION =
  'professional-long-form-customer-delivery-h264-qa-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COMPLETION_VERSION =
  'professional-long-form-customer-delivery-h264-qa-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND =
  'qa_customer_delivery_h264_chunk' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID =
  'tool.ffprobe.inspect_approved_media.v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RUNNER_CLASS =
  'canonical_long_form_delivery_h264_chunk_ffprobe_qa_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID =
  'ffprobe_4k_h264_video_chunk_qa_cpu_2vcpu_4gib_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECIPE_ID =
  'approved_long_form_delivery_h264_chunk_qa_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_INSPECTION_PROFILE_ID =
  'customer_delivery_h264_chunk_qa_v1' as const

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
  kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND),
}).strict()

const qaOperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
  ),
  fixedRecipeProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECIPE_ID,
  ),
  inspectionProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_INSPECTION_PROFILE_ID,
  ),
}).strict()

const attemptCommon = {
  source: z.literal('private_canonical_package_work_queue_store'),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  claimId: identity,
  claimHash: sha256,
  workerIdentityHash: sha256,
  deliveryAttempt: z.union([z.literal(1), z.literal(2)]),
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}

export const professionalLongFormDeliveryH264QaAuthorizationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORIZATION_VERSION,
  ),
  source: z.literal(
    'server_persisted_professional_long_form_customer_delivery_h264_qa_authority',
  ),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_KIND),
  expectedOutputIdentity,
  operation: qaOperationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    exactCompletedH264ArtifactRead: z.literal(true),
    independentFfprobe: z.literal(true),
    privateQaPersistence: z.literal(true),
    mediaMutationAllowed: z.literal(false),
    muxExecutionAuthorized: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264QaAttemptSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ATTEMPT_VERSION),
  ...attemptCommon,
  operation: qaOperationSchema,
}).strict()

export const professionalLongFormDeliveryH264QaAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_reopened_professional_long_form_customer_delivery_h264_qa_authority',
  ),
  purpose: z.literal(
    'authorize_one_private_independent_probe_of_exact_customer_delivery_h264_chunk',
  ),
  status: z.literal('delivery_h264_chunk_independent_qa_authorized_mux_blocked'),
  identity: commonIdentitySchema,
  approval: approvalSchema,
  h264Artifact: professionalLongFormDeliveryH264ArtifactRefSchema,
  lineage: z.object({
    deliveryPackageHash: sha256,
    deliveryPackageRef: jsonBlobRef,
    deliveryPlacementManifestHash: sha256,
    deliveryPlacementManifestRef: jsonBlobRef,
    queueDefinitionHash: sha256,
    qaJobDefinitionHash: sha256,
    qaPlacementHash: sha256,
    h264JobId: identity,
    h264ApprovedWorkItemId: identity,
    h264AuthorityHash: sha256,
    h264QueueCompletionHash: sha256,
    h264CanonicalResultHash: sha256,
    h264AttemptInternalCostEvidenceHash: sha256,
    h264RuntimeEvidenceRef: jsonBlobRef,
    h264ReconciliationEvidenceRef: jsonBlobRef,
    h264TerminalEvidenceRef: jsonBlobRef,
    mediaBinaryRuntimeAuthorityHash: sha256,
    mediaBinaryImageIdentityHash: sha256,
  }).strict(),
  operation: qaOperationSchema.extend({
    workerType: z.literal('qa_worker'),
    resourceClassId: z.literal('qa_cpu_standard_v1'),
    maximumAttempts: z.literal(2),
    attemptTimeoutSeconds: z.literal(3_600),
    leaseDurationMilliseconds: z.literal(120_000),
    vcpuCount: z.literal(2),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableH264CompletionRequired: z.literal(true),
    exactPrivateArtifactRead: z.literal(true),
    exactArtifactChecksumRequired: z.literal(true),
    independentFfprobe: z.literal(true),
    exactH264ProfileFrameColorDurationValidation: z.literal(true),
    mediaMutationAllowed: z.literal(false),
    privateQaArtifactCreateOnly: z.literal(true),
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

export const professionalLongFormDeliveryH264QaArtifactSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ARTIFACT_VERSION),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_h264_ffprobe_qa',
  ),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    jobId: identity,
    approvedWorkItemId: identity,
    sourceChunkId: identity,
    executionAttemptId: identity,
  }).strict(),
  authorityHash: sha256,
  executionAttemptHash: sha256,
  operation: qaOperationSchema,
  h264Artifact: professionalLongFormDeliveryH264ArtifactRefSchema,
  rawProbeResultRef: jsonBlobRef,
  probeRuntimeEvidenceRef: jsonBlobRef,
  requestEnvelopeSha256: sha256,
  probeAttestationHash: sha256,
  observed: z.object({
    container: z.literal('mp4'),
    videoStreamCount: z.literal(1),
    audioStreamCount: z.literal(0),
    codecName: z.literal('h264'),
    codecProfile: z.literal('High'),
    codecLevel: z.number().int().min(31).max(62),
    pixelFormat: z.literal('yuv420p'),
    width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
    height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
    frameRateNumerator: z.literal(30),
    frameRateDenominator: z.literal(1),
    frameCount: z.number().int().min(1_350).max(5_400),
    formatStartTimeSeconds: z.number().min(0).max(0.034),
    videoStartTimeSeconds: z.number().min(0).max(0.034),
    durationSeconds: z.number().positive().max(180.034),
    durationFrames: z.number().int().min(1_350).max(5_400),
    colorRange: z.enum(['tv', 'limited']),
    colorSpace: z.literal('bt709'),
    colorTransfer: z.literal('bt709'),
    colorPrimaries: z.literal('bt709'),
  }).strict(),
  checks: z.object({
    exactPersistedH264ArtifactReopened: z.literal('passed'),
    independentPinnedFfprobeExecuted: z.literal('passed'),
    exactHighProfileH264VideoOnly: z.literal('passed'),
    exactFrameCountRateAndDuration: z.literal('passed'),
    exactUhdOutputFrame: z.literal('passed'),
    exactYuv420pBt709LimitedMetadata: z.literal('passed'),
    immutableChunkAndQueueLineage: z.literal('passed'),
    noMediaMutationOrCommercialAction: z.literal('passed'),
  }).strict(),
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
  qaHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264QaReconciliationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_h264_qa_reconciliation',
  ),
  qaJobId: identity,
  qaApprovedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  h264Artifact: professionalLongFormDeliveryH264ArtifactRefSchema,
  qaArtifactRef: jsonBlobRef,
  muxDependency: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    dependencyJobId: identity,
    thisDependencySatisfied: z.literal(true),
    requiredH264ChunkQaDependencyCount: z.number().int().min(2).max(124),
    executionAuthorized: z.literal(false),
    capabilityBlockedPendingExactMuxAuthority: z.literal(true),
  }).strict(),
  decision: z.literal(
    'private_h264_chunk_qa_passed_mux_remains_exact_authority_gated',
  ),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264QaTerminalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_TERMINAL_VERSION),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: qaOperationSchema,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  muxExecutionAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormDeliveryH264QaCompletionSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COMPLETION_VERSION),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: qaOperationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export type ProfessionalLongFormDeliveryH264QaAuthorization = z.infer<
  typeof professionalLongFormDeliveryH264QaAuthorizationSchema
>
export type ProfessionalLongFormDeliveryH264QaAttempt = z.infer<
  typeof professionalLongFormDeliveryH264QaAttemptSchema
>
export type ProfessionalLongFormDeliveryH264QaAuthority = z.infer<
  typeof professionalLongFormDeliveryH264QaAuthoritySchema
>
export type ProfessionalLongFormDeliveryH264QaArtifact = z.infer<
  typeof professionalLongFormDeliveryH264QaArtifactSchema
>
export type ProfessionalLongFormDeliveryH264QaReconciliation = z.infer<
  typeof professionalLongFormDeliveryH264QaReconciliationSchema
>
export type ProfessionalLongFormDeliveryH264QaTerminal = z.infer<
  typeof professionalLongFormDeliveryH264QaTerminalSchema
>
export type ProfessionalLongFormDeliveryH264QaCompletion = z.infer<
  typeof professionalLongFormDeliveryH264QaCompletionSchema
>
