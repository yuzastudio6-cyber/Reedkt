import { z } from 'zod'

import {
  professionalLongFormMasterAssemblyArtifactRefSchema,
} from './professional-long-form-master-assembly-execution-contract'

export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORITY_VERSION =
  'professional-long-form-private-master-qa-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORIZATION_VERSION =
  'professional-long-form-private-master-qa-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ATTEMPT_VERSION =
  'professional-long-form-private-master-qa-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ARTIFACT_VERSION =
  'professional-long-form-private-master-qa-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RECONCILIATION_VERSION =
  'professional-long-form-private-master-qa-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_TERMINAL_VERSION =
  'professional-long-form-private-master-qa-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COMPLETION_VERSION =
  'professional-long-form-private-master-qa-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_KIND =
  'qa_private_4k_master' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID =
  'long-form-qa-private-4k-master' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID =
  'tool.ffprobe.inspect_approved_media.v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RUNNER_CLASS =
  'canonical_professional_long_form_private_master_ffprobe_qa_v1' as const
export const PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID =
  'ffprobe_long_form_private_master_qa_cpu_2vcpu_4gib_v1' as const

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

const operationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
  ),
}).strict()

const commercialBoundarySchema = z.object({
  internalProductionCostOnly: z.literal(true),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  approvedFourKEstimateAndReservationReused: z.literal(true),
  secondExportEstimateCreated: z.literal(false),
  secondExportChargeCreated: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const authorityIdentitySchema = z.object({
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

const persistenceSchema = z.object({
  privateLocalContentAddressed: z.literal(true),
  queueReceiptRequiredBeforeLease: z.literal(true),
  queueAttemptRequiredBeforeOperation: z.literal(true),
  queueCompletionIsAuthorityCommit: z.literal(true),
  orphanBlobsGrantExecutionAuthority: z.literal(false),
  distributedDatabaseBacked: z.literal(false),
  productionDurabilityProven: z.literal(false),
}).strict()

export const professionalLongFormPrivateMasterQaAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_reopened_professional_long_form_private_master_qa_authority',
  ),
  purpose: z.literal(
    'authorize_one_independent_private_probe_of_exact_long_form_review_master',
  ),
  status: z.literal('private_long_form_master_independent_qa_authorized'),
  identity: authorityIdentitySchema,
  approval: approvalSchema,
  approvedMaster: professionalLongFormMasterAssemblyArtifactRefSchema,
  approvedQaExpectation: z.object({
    inspectionProfileId: z.literal('private_long_form_master_qa_v1'),
    container: z.literal('matroska'),
    videoCodec: z.literal('vp9'),
    audioCodec: z.literal('flac'),
    width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
    height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
    fps: z.literal(30),
    totalFrames: z.number().int().min(2_700).max(648_000),
    pixelFormat: z.literal('yuv420p'),
    colorRange: z.literal('tv'),
    colorSpace: z.literal('bt709'),
    colorTransfer: z.literal('bt709'),
    colorPrimaries: z.literal('bt709'),
    sampleRate: z.literal(48_000),
    channels: z.literal(2),
    channelLayout: z.literal('stereo'),
    expectedDurationSeconds: z.number().positive().max(21_600),
    maximumDurationDriftSeconds: z.number().positive().max(0.035),
    expectationHash: sha256,
  }).strict(),
  lineage: z.object({
    planningAuthorityHash: sha256,
    planHash: sha256,
    workGraphHash: sha256,
    timingHash: sha256,
    objectPlanAuthorityHash: sha256,
    bridgeAuthorityHash: sha256,
    childJobManifestHash: sha256,
    childPackageHash: sha256,
    childPlacementManifestHash: sha256,
    queueDefinitionHash: sha256,
    qaJobAuthorityHash: sha256,
    qaJobDefinitionHash: sha256,
    qaPlacementHash: sha256,
    assemblyJobId: identity,
    assemblyApprovedWorkItemId: identity,
    assemblyQueueCompletionHash: sha256,
    assemblyCanonicalResultHash: sha256,
    assemblyAttemptInternalCostEvidenceHash: sha256,
    assemblyRuntimeEvidenceRef: jsonBlobRef,
    assemblyReconciliationEvidenceRef: jsonBlobRef,
    assemblyTerminalEvidenceRef: jsonBlobRef,
  }).strict(),
  operation: operationSchema.extend({
    workerType: z.literal('qa_worker'),
    resourceClassId: z.literal('qa_cpu_standard_v1'),
    maximumAttempts: z.literal(2),
    attemptTimeoutSeconds: z.literal(3_600),
    leaseDurationMilliseconds: z.literal(300_000),
    heartbeatIntervalMilliseconds: z.number().int().min(1_000).max(60_000),
    vcpuCount: z.literal(2),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableAssemblyCompletionRequired: z.literal(true),
    exactPrivateMasterRead: z.literal(true),
    independentFullInputFfprobe: z.literal(true),
    exactContainerStreamFrameColorAudioDurationValidation: z.literal(true),
    mediaMutationAllowed: z.literal(false),
    privateQaArtifactCreateOnly: z.literal(true),
    customerDeliveryMasterExecution: z.literal(false),
    exportExecution: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: persistenceSchema,
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

export const professionalLongFormPrivateMasterQaAuthorizationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORIZATION_VERSION,
  ),
  source: z.literal(
    'server_persisted_professional_long_form_private_master_qa_authority',
  ),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_KIND),
  expectedOutputIdentity,
  operation: operationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    exactPrivateMasterRead: z.literal(true),
    independentFullInputProbe: z.literal(true),
    privateQaPersistence: z.literal(true),
    customerDeliveryMasterExecution: z.literal(false),
    exportExecution: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormPrivateMasterQaAttemptSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ATTEMPT_VERSION),
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
  operation: operationSchema,
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}).strict()

export const professionalLongFormPrivateMasterQaArtifactSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ARTIFACT_VERSION),
  source: z.literal(
    'canonical_professional_long_form_private_master_ffprobe_qa',
  ),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    jobId: identity,
    approvedWorkItemId: identity,
    executionAttemptId: identity,
  }).strict(),
  authorityHash: sha256,
  executionAttemptHash: sha256,
  operation: operationSchema,
  queueLeaseEvidence: z.object({
    claimId: identity,
    deliveryAttempt: z.union([z.literal(1), z.literal(2)]),
    initialClaimHash: sha256,
    heartbeatClaimHash: sha256,
    heartbeatCount: z.number().int().min(1).max(100_000),
    heartbeatAt: timestamp,
    expiresAt: timestamp,
    attemptDeadlineAt: timestamp,
    boundedLeaseRenewalObserved: z.literal(true),
  }).strict(),
  masterArtifact: professionalLongFormMasterAssemblyArtifactRefSchema,
  rawProbeResultRef: jsonBlobRef,
  probeRuntimeEvidenceRef: jsonBlobRef,
  requestEnvelopeSha256: sha256,
  probeAttestationHash: sha256,
  observed: z.object({
    container: z.literal('matroska'),
    streamCount: z.literal(2),
    videoStreamCount: z.literal(1),
    audioStreamCount: z.literal(1),
    videoCodec: z.literal('vp9'),
    audioCodec: z.literal('flac'),
    pixelFormat: z.literal('yuv420p'),
    width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
    height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
    frameRateNumerator: z.literal(30),
    frameRateDenominator: z.literal(1),
    frameCount: z.number().int().min(2_700).max(648_000),
    colorRange: z.literal('tv'),
    colorSpace: z.literal('bt709'),
    colorTransfer: z.literal('bt709'),
    colorPrimaries: z.literal('bt709'),
    sampleRate: z.literal(48_000),
    channels: z.literal(2),
    channelLayout: z.literal('stereo'),
    formatStartTimeSeconds: z.number().min(0).max(0.034),
    videoStartTimeSeconds: z.number().min(0).max(0.034),
    audioStartTimeSeconds: z.number().min(0).max(0.034),
    durationSeconds: z.number().positive().max(21_600.034),
    expectedDurationSeconds: z.number().positive().max(21_600),
    maximumDurationDriftSeconds: z.number().positive().max(0.035),
    sizeBytes: positiveInteger.max(72 * 1024 * 1024 * 1024),
  }).strict(),
  checks: z.object({
    exactPersistedMasterReopened: z.literal('passed'),
    independentFullInputProbeExecuted: z.literal('passed'),
    exactContainerAndStreamTopology: z.literal('passed'),
    exactFrameCountRateAndDuration: z.literal('passed'),
    exactOutputFrame: z.literal('passed'),
    exactVp9PixelAndBt709Metadata: z.literal('passed'),
    exactFlac48kStereoMetadata: z.literal('passed'),
    videoAudioStartSyncWithinOneFrame: z.literal('passed'),
    exactImmutableMasterChecksum: z.literal('passed'),
    mediaMutationOccurred: z.literal(false),
  }).strict(),
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
  qaHash: sha256,
}).strict()

export const professionalLongFormPrivateMasterQaReconciliationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_private_master_qa_reconciliation',
  ),
  qaJobId: identity,
  qaApprovedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  masterArtifact: professionalLongFormMasterAssemblyArtifactRefSchema,
  qaArtifactRef: jsonBlobRef,
  graph: z.object({
    totalChildJobCount: z.number().int().min(11).max(255),
    completedBeforeThisQa: z.number().int().min(10).max(254),
    completedAfterThisQa: z.number().int().min(11).max(255),
    remainingIncompleteAfterThisQa: z.literal(0),
    privateReviewGraphComplete: z.literal(true),
  }).strict(),
  downstream: z.object({
    customerDeliveryMasterCreated: z.literal(false),
    customerDeliveryMasterExecutionAuthorized: z.literal(false),
    exportExecutionAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    revisedScopeApprovalCreated: z.literal(false),
  }).strict(),
  decision: z.literal(
    'private_review_graph_complete_customer_delivery_and_export_separately_gated',
  ),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormPrivateMasterQaTerminalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_TERMINAL_VERSION),
  source: z.literal(
    'canonical_professional_long_form_private_master_qa_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: operationSchema,
  masterArtifact: professionalLongFormMasterAssemblyArtifactRefSchema,
  qaArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  privateReviewGraphComplete: z.literal(true),
  customerDeliveryMasterCreated: z.literal(false),
  exportExecutionAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormPrivateMasterQaCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COMPLETION_VERSION,
  ),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: operationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export type ProfessionalLongFormPrivateMasterQaAuthority = z.infer<
  typeof professionalLongFormPrivateMasterQaAuthoritySchema
>
export type ProfessionalLongFormPrivateMasterQaAuthorization = z.infer<
  typeof professionalLongFormPrivateMasterQaAuthorizationSchema
>
export type ProfessionalLongFormPrivateMasterQaAttempt = z.infer<
  typeof professionalLongFormPrivateMasterQaAttemptSchema
>
export type ProfessionalLongFormPrivateMasterQaArtifact = z.infer<
  typeof professionalLongFormPrivateMasterQaArtifactSchema
>
export type ProfessionalLongFormPrivateMasterQaReconciliation = z.infer<
  typeof professionalLongFormPrivateMasterQaReconciliationSchema
>
export type ProfessionalLongFormPrivateMasterQaTerminal = z.infer<
  typeof professionalLongFormPrivateMasterQaTerminalSchema
>
export type ProfessionalLongFormPrivateMasterQaCompletion = z.infer<
  typeof professionalLongFormPrivateMasterQaCompletionSchema
>
