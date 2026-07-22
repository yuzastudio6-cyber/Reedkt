import { z } from 'zod'

import {
  professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
} from './professional-long-form-first-object-chunk-execution-contract'
import {
  professionalLongFormContinuousProgramAudioArtifactRefSchema,
} from './professional-long-form-continuous-program-audio-execution-contract'

export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORITY_VERSION =
  'professional-long-form-master-assembly-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORIZATION_VERSION =
  'professional-long-form-master-assembly-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_ATTEMPT_VERSION =
  'professional-long-form-master-assembly-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNTIME_EVIDENCE_VERSION =
  'professional-long-form-master-assembly-runtime-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RECONCILIATION_VERSION =
  'professional-long-form-master-assembly-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_TERMINAL_VERSION =
  'professional-long-form-master-assembly-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COMPLETION_VERSION =
  'professional-long-form-master-assembly-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND =
  'finalize_private_4k_master' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID =
  'long-form-finalize-private-4k-master' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNNER_CLASS =
  'canonical_professional_long_form_master_assembly_ffmpeg_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID =
  'ffmpeg_long_form_master_assembly_cpu_2vcpu_4gib_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const expectedOutputIdentity = z.string().trim().min(1).max(512)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const jsonBlobRef = z.object({
  sha256,
  byteLength: positiveInteger.max(4 * 1024 * 1024),
}).strict()

const operationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
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

const approvedChunkSchema = z.object({
  chunkId: identity,
  chunkIndex: z.number().int().min(1).max(124),
  chunkCount: z.number().int().min(2).max(124),
  globalStartFrame: z.number().int().nonnegative().max(647_999),
  globalEndFrameExclusive: z.number().int().min(1_350).max(648_000),
  durationFrames: z.number().int().min(1_350).max(5_400),
  boundaryBefore: z.enum([
    'timeline_start',
    'approved_hard_cut',
    'continuous_technical_split',
  ]),
  qaJobId: identity,
  qaApprovedWorkItemId: identity,
  queueCompletionHash: sha256,
  qaCanonicalResultHash: sha256,
  qaAttemptInternalCostEvidenceHash: sha256,
  qaArtifactRef: jsonBlobRef,
  qaArtifactHash: sha256,
  renderArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
}).strict()

const approvedAssemblyPlanSchema = z.object({
  assemblyAuthorityHash: sha256,
  privateObjectIdentityHash: sha256,
  recipeProfileId: z.literal('approved_long_form_vp9_flac_matroska_master_v1'),
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
  totalFrames: z.number().int().min(2_700).max(648_000),
  chunkCount: z.number().int().min(2).max(124),
  chunks: z.array(approvedChunkSchema).min(2).max(124),
  programAudio: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    queueCompletionHash: sha256,
    canonicalResultHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    qaAttemptInternalCostEvidenceHash: sha256,
    qaArtifactRef: jsonBlobRef,
    qaArtifactHash: sha256,
    artifact: professionalLongFormContinuousProgramAudioArtifactRefSchema,
  }).strict(),
  crossChunkColor: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    queueCompletionHash: sha256,
    canonicalResultHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    validationArtifactRef: jsonBlobRef,
    validationHash: sha256,
  }).strict(),
  masterTiming: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    queueCompletionHash: sha256,
    canonicalResultHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
  }).strict(),
  videoAssemblyPolicy: z.literal('ordered_vp9_object_chunk_stream_copy_v1'),
  audioAssemblyPolicy: z.literal('continuous_flac_program_audio_stream_copy_v1'),
  timestampPolicy: z.literal('normalize_from_zero_preserve_frame_and_sample_time_v1'),
  compatibilityPolicy: z.literal('exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1'),
  outputContainer: z.literal('matroska'),
  outputVideoCodec: z.literal('copy_vp9'),
  outputAudioCodec: z.literal('copy_flac'),
  renderPurpose: z.literal('private_4k_long_form_review_master_v1'),
  mediaReencodingAllowed: z.literal(false),
  planHash: sha256,
}).strict()

const dependencyCompletionSchema = z.object({
  kind: z.enum([
    'qa_object_mezzanine_chunk',
    'mix_continuous_program_audio',
    'validate_cross_chunk_color_continuity',
    'validate_master_timing',
  ]),
  jobId: identity,
  approvedWorkItemId: identity,
  queueCompletionHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
}).strict()

export const professionalLongFormMasterAssemblyArtifactRefSchema = z.object({
  objectIdentity: sha256,
  mediaFormat: z.literal('mkv'),
  contentType: z.literal('video/x-matroska'),
  byteLength: positiveInteger.max(72 * 1024 * 1024 * 1024),
  sha256,
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  frameRateNumerator: z.literal(30),
  frameRateDenominator: z.literal(1),
  frameCount: z.number().int().min(2_700).max(648_000),
  videoCodec: z.literal('vp9'),
  audioCodec: z.literal('flac'),
  sampleRate: z.literal(48_000),
  channels: z.literal(2),
  objectVersion: z.literal(1),
  assetRole: z.literal('processed'),
  renderPurpose: z.literal('private_4k_long_form_review_master_v1'),
  placeholderAllowed: z.literal(false),
  privateLocalCreateOnly: z.literal(true),
  databaseBacked: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
}).strict()

export const professionalLongFormMasterAssemblyAuthoritySchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORITY_VERSION),
  source: z.literal('server_reopened_professional_long_form_master_assembly_authority'),
  purpose: z.literal('authorize_one_private_vp9_flac_long_form_review_master_assembly'),
  status: z.literal('private_master_assembly_authorized_all_dependencies_required'),
  identity: authorityIdentitySchema,
  approval: approvalSchema,
  approvedAssemblyPlan: approvedAssemblyPlanSchema,
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
    finalizationJobAuthorityHash: sha256,
    finalizationJobDefinitionHash: sha256,
    finalizationPlacementHash: sha256,
    dependencyCompletions: z.array(dependencyCompletionSchema).min(5).max(127),
    dependencySetHash: sha256,
  }).strict(),
  operation: operationSchema.extend({
    workerType: z.literal('render_worker'),
    resourceClassId: z.literal('render_cpu_high_memory_v1'),
    maximumAttempts: z.literal(2),
    attemptTimeoutSeconds: z.literal(3_600),
    leaseDurationMilliseconds: z.literal(300_000),
    heartbeatIntervalMilliseconds: z.number().int().min(1_000).max(60_000),
    vcpuCount: z.literal(2),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableDependencyCompletionsRequired: z.literal(true),
    exactQaPassedPrivateChunkRead: z.literal(true),
    exactQaPassedPrivateProgramAudioRead: z.literal(true),
    exactCrossChunkColorPassRequired: z.literal(true),
    fixedVp9FlacMatroskaStreamCopyRecipe: z.literal(true),
    mediaReencodingAllowed: z.literal(false),
    privateMasterCreateOnly: z.literal(true),
    independentPrivateMasterQaRequired: z.literal(true),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: z.object({
    privateLocalContentAddressed: z.literal(true),
    queueReceiptRequiredBeforeLease: z.literal(true),
    queueAttemptRequiredBeforeOperation: z.literal(true),
    queueCompletionIsAuthorityCommit: z.literal(true),
    orphanBlobsGrantExecutionAuthority: z.literal(false),
    distributedDatabaseBacked: z.literal(false),
    productionDurabilityProven: z.literal(false),
  }).strict(),
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

export const professionalLongFormMasterAssemblyAuthorizationSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORIZATION_VERSION),
  source: z.literal('server_persisted_professional_long_form_master_assembly_authority'),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_KIND),
  expectedOutputIdentity,
  operation: operationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    exactDependencyArtifactsRead: z.literal(true),
    fixedStreamCopyAssembly: z.literal(true),
    createOnlyPrivateMasterPersistence: z.literal(true),
    independentQaSeparatelyGated: z.literal(true),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormMasterAssemblyAttemptSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_ATTEMPT_VERSION),
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

export const professionalLongFormMasterAssemblyRuntimeEvidenceSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RUNTIME_EVIDENCE_VERSION),
  source: z.literal('canonical_professional_long_form_master_assembly_ffmpeg_runner'),
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
  requestEnvelopeSha256: sha256,
  inputSetHash: sha256,
  chunkSha256s: z.array(sha256).min(2).max(124),
  programAudioSha256: sha256,
  crossChunkColorValidationHash: sha256,
  continuousProgramAudioQaHash: sha256,
  outputArtifact: professionalLongFormMasterAssemblyArtifactRefSchema,
  outputProbeRef: jsonBlobRef,
  outputProbeHash: sha256,
  confinementEvidenceHash: sha256,
  runtime: z.object({
    binaryVersion: z.literal('8.1.2'),
    imageIdentityHash: sha256,
    attestationRecordId: sha256,
    attestationHash: sha256,
    networkMode: z.literal('none'),
    containerExitCode: z.literal(0),
    oomKilled: z.literal(false),
  }).strict(),
  checks: z.object({
    everyDependencyCompletionReopened: z.literal('passed'),
    everyPrivateInputChecksumReopened: z.literal('passed'),
    exactOrderedChunkTimelineVerified: z.literal('passed'),
    exactContinuousProgramAudioVerified: z.literal('passed'),
    crossChunkColorPassVerified: z.literal('passed'),
    vp9AndFlacStreamCopiedWithoutReencode: z.literal('passed'),
    independentOutputProbeExecuted: z.literal('passed'),
    privateMasterPersistedCreateOnly: z.literal('passed'),
    independentPrivateMasterQaStillRequired: z.literal(true),
  }).strict(),
  completedAt: timestamp,
  artifactHash: sha256,
}).strict()

export const professionalLongFormMasterAssemblyReconciliationSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_RECONCILIATION_VERSION),
  source: z.literal('canonical_professional_long_form_master_assembly_reconciliation'),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  outputArtifact: professionalLongFormMasterAssemblyArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  downstreamPrivateMasterQa: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    dependencyJobId: identity,
    thisDependencySatisfied: z.literal(true),
    everyRequiredDependencySatisfied: z.literal(true),
    executionAuthorized: z.literal(false),
  }).strict(),
  decision: z.literal('private_review_master_ready_independent_private_master_qa_requires_separate_authority'),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormMasterAssemblyTerminalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_TERMINAL_VERSION),
  source: z.literal('canonical_professional_long_form_master_assembly_execution_service'),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: operationSchema,
  outputArtifact: professionalLongFormMasterAssemblyArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  independentPrivateMasterQaCompleted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormMasterAssemblyCompletionSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COMPLETION_VERSION),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: operationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outputArtifact: professionalLongFormMasterAssemblyArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export type ProfessionalLongFormMasterAssemblyAuthority = z.infer<
  typeof professionalLongFormMasterAssemblyAuthoritySchema
>
export type ProfessionalLongFormMasterAssemblyAuthorization = z.infer<
  typeof professionalLongFormMasterAssemblyAuthorizationSchema
>
export type ProfessionalLongFormMasterAssemblyAttempt = z.infer<
  typeof professionalLongFormMasterAssemblyAttemptSchema
>
export type ProfessionalLongFormMasterAssemblyArtifactRef = z.infer<
  typeof professionalLongFormMasterAssemblyArtifactRefSchema
>
export type ProfessionalLongFormMasterAssemblyRuntimeEvidence = z.infer<
  typeof professionalLongFormMasterAssemblyRuntimeEvidenceSchema
>
export type ProfessionalLongFormMasterAssemblyReconciliation = z.infer<
  typeof professionalLongFormMasterAssemblyReconciliationSchema
>
export type ProfessionalLongFormMasterAssemblyTerminal = z.infer<
  typeof professionalLongFormMasterAssemblyTerminalSchema
>
export type ProfessionalLongFormMasterAssemblyCompletion = z.infer<
  typeof professionalLongFormMasterAssemblyCompletionSchema
>
