import { z } from 'zod'

import {
  OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution/offline-media-binary-customer-delivery-mux-protocol'
import {
  professionalLongFormContinuousProgramAudioArtifactRefSchema,
} from './professional-long-form-continuous-program-audio-execution-contract'
import {
  professionalLongFormDeliveryH264ArtifactRefSchema,
} from './professional-long-form-customer-delivery-execution-contract'

export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORITY_VERSION =
  'professional-long-form-customer-delivery-mux-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORIZATION_VERSION =
  'professional-long-form-customer-delivery-mux-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_ATTEMPT_VERSION =
  'professional-long-form-customer-delivery-mux-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNTIME_EVIDENCE_VERSION =
  'professional-long-form-customer-delivery-mux-runtime-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECONCILIATION_VERSION =
  'professional-long-form-customer-delivery-mux-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_TERMINAL_VERSION =
  'professional-long-form-customer-delivery-mux-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COMPLETION_VERSION =
  'professional-long-form-customer-delivery-mux-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND =
  'mux_customer_delivery_h264_aac_master' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNNER_CLASS =
  'canonical_long_form_delivery_h264_aac_mux_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID =
  'ffmpeg_4k_h264_aac_master_mux_cpu_4vcpu_8gib_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID =
  'approved_long_form_delivery_h264_aac_master_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const jsonBlobRef = z.object({
  sha256,
  byteLength: positiveInteger.max(4 * 1024 * 1024),
}).strict()

const operationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
  ),
  fixedRecipeProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID,
  ),
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
  expectedOutputIdentity: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND),
}).strict()

const completedH264ChunkSchema = z.object({
  chunkId: identity,
  chunkIndex: z.number().int().min(1).max(124),
  chunkCount: z.number().int().min(2).max(124),
  globalStartFrame: z.number().int().nonnegative().max(647_999),
  globalEndFrameExclusive: z.number().int().positive().max(648_000),
  durationFrames: z.number().int().min(1_350).max(5_400),
  h264JobId: identity,
  h264ApprovedWorkItemId: identity,
  h264QueueCompletionHash: sha256,
  h264CanonicalResultHash: sha256,
  h264AttemptInternalCostEvidenceHash: sha256,
  h264RuntimeEvidenceRef: jsonBlobRef,
  h264ReconciliationEvidenceRef: jsonBlobRef,
  h264TerminalEvidenceRef: jsonBlobRef,
  qaJobId: identity,
  qaApprovedWorkItemId: identity,
  qaQueueCompletionHash: sha256,
  qaCanonicalResultHash: sha256,
  qaAttemptInternalCostEvidenceHash: sha256,
  qaArtifactRef: jsonBlobRef,
  qaArtifactHash: sha256,
  qaReconciliationEvidenceRef: jsonBlobRef,
  qaTerminalEvidenceRef: jsonBlobRef,
  artifact: professionalLongFormDeliveryH264ArtifactRefSchema,
}).strict().superRefine((chunk, context) => {
  if (
    chunk.chunkIndex > chunk.chunkCount ||
    chunk.globalEndFrameExclusive - chunk.globalStartFrame !==
      chunk.durationFrames ||
    chunk.artifact.sourceChunkId !== chunk.chunkId ||
    chunk.artifact.chunkIndex !== chunk.chunkIndex ||
    chunk.artifact.chunkCount !== chunk.chunkCount ||
    chunk.artifact.globalStartFrame !== chunk.globalStartFrame ||
    chunk.artifact.globalEndFrameExclusive !== chunk.globalEndFrameExclusive
  ) context.addIssue({
    code: 'custom',
    message: 'Customer-delivery mux chunk lineage is inconsistent.',
  })
})

const programAudioSchema = z.object({
  sourceJobId: identity,
  sourceQueueCompletionHash: sha256,
  sourceCanonicalResultHash: sha256,
  sourceAttemptInternalCostEvidenceHash: sha256,
  sourceQaAttemptInternalCostEvidenceHash: sha256,
  sourceQaArtifactRef: jsonBlobRef,
  sourceQaArtifactHash: sha256,
  artifact: professionalLongFormContinuousProgramAudioArtifactRefSchema,
}).strict()

const approvedMuxPlanSchema = z.object({
  muxAuthorityHash: sha256,
  privateObjectIdentityHash: sha256,
  recipeProfileId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID),
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
  totalFrames: z.number().int().min(2_700).max(648_000),
  chunkCount: z.number().int().min(2).max(124),
  chunks: z.array(completedH264ChunkSchema).min(2).max(124),
  programAudio: programAudioSchema,
  videoAssemblyPolicy: z.literal(
    'ordered_compatible_h264_chunk_stream_copy_v1',
  ),
  audioAssemblyPolicy: z.literal(
    'encode_exact_continuous_flac_program_audio_to_aac_once_v1',
  ),
  timestampPolicy: z.literal(
    'normalize_from_zero_preserve_frame_and_sample_time_v1',
  ),
  compatibilityPolicy: z.literal(
    'exact_h264_high_yuv420p_bt709_4k_30fps_and_flac_48k_stereo_v1',
  ),
  outputContainer: z.literal('mp4'),
  outputVideoCodec: z.literal('copy_h264'),
  outputAudioCodec: z.literal('aac_lc'),
  outputAudioBitrate: z.literal(192_000),
  outputAudioSampleRate: z.literal(48_000),
  outputAudioChannels: z.literal(2),
  frontLoadedInitializationMetadataRequired: z.literal(true),
  fullProgramVideoReencodeAllowed: z.literal(false),
  audioEncodeCount: z.literal(1),
  renderPurpose: z.literal('private_4k_customer_delivery_master_v1'),
  planHash: sha256,
}).strict().superRefine((plan, context) => {
  if (
    plan.chunks.length !== plan.chunkCount ||
    plan.chunks[0]?.globalStartFrame !== 0 ||
    plan.chunks.at(-1)?.globalEndFrameExclusive !== plan.totalFrames ||
    plan.chunks.some((chunk, index) =>
      chunk.chunkIndex !== index + 1 ||
      chunk.chunkCount !== plan.chunkCount ||
      (index > 0 && plan.chunks[index - 1]?.globalEndFrameExclusive !==
        chunk.globalStartFrame)) ||
    plan.programAudio.artifact.totalFrames !== plan.totalFrames
  ) context.addIssue({
    code: 'custom',
    message: 'Customer-delivery mux plan lost contiguous program authority.',
  })
})

const dependencyCompletionSchema = z.object({
  kind: z.literal('qa_customer_delivery_h264_chunk'),
  jobId: identity,
  approvedWorkItemId: identity,
  queueCompletionHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  artifactHash: sha256,
}).strict()

export const professionalLongFormDeliveryMuxArtifactRefSchema = z.object({
  objectIdentity: sha256,
  mediaFormat: z.literal('mp4'),
  contentType: z.literal('video/mp4'),
  byteLength: positiveInteger.max(
    OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_OUTPUT_BYTES,
  ),
  sha256,
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  frameRateNumerator: z.literal(30),
  frameRateDenominator: z.literal(1),
  frameCount: z.number().int().min(2_700).max(648_000),
  videoCodec: z.literal('h264'),
  videoProfile: z.literal('high'),
  videoStreamCopiedWithoutReencode: z.literal(true),
  pixelFormat: z.literal('yuv420p'),
  colorRange: z.literal('tv'),
  colorSpace: z.literal('bt709'),
  colorTransfer: z.literal('bt709'),
  colorPrimaries: z.literal('bt709'),
  audioCodec: z.literal('aac_lc'),
  audioBitrate: z.literal(192_000),
  sampleRate: z.literal(48_000),
  channels: z.literal(2),
  audioEncodeCount: z.literal(1),
  frontLoadedInitializationMetadata: z.literal(true),
  initializationMode: z.literal('fragmented_mp4_front_loaded_moov_v1'),
  objectVersion: z.literal(1),
  assetRole: z.literal('processed'),
  renderPurpose: z.literal('private_4k_customer_delivery_master_v1'),
  placeholderAllowed: z.literal(false),
  privateLocalCreateOnly: z.literal(true),
  databaseBacked: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
}).strict()

export const professionalLongFormDeliveryMuxAuthoritySchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORITY_VERSION),
  source: z.literal(
    'server_reopened_professional_long_form_customer_delivery_mux_authority',
  ),
  purpose: z.literal(
    'authorize_one_private_h264_stream_copy_and_single_aac_customer_delivery_mux',
  ),
  status: z.literal(
    'private_customer_delivery_mux_authorized_decoded_qa_and_download_blocked',
  ),
  identity: authorityIdentitySchema,
  approval: approvalSchema,
  approvedMuxPlan: approvedMuxPlanSchema,
  lineage: z.object({
    deliveryPackageHash: sha256,
    deliveryPackageRef: jsonBlobRef,
    deliveryPlacementManifestHash: sha256,
    deliveryPlacementManifestRef: jsonBlobRef,
    queueDefinitionHash: sha256,
    muxJobDefinitionHash: sha256,
    muxPlacementHash: sha256,
    sourceEvidenceHash: sha256,
    dependencyCompletions: z.array(dependencyCompletionSchema).min(2).max(124),
    dependencySetHash: sha256,
    mediaBinaryRuntimeAuthorityHash: sha256,
    mediaBinaryImageIdentityHash: sha256,
  }).strict(),
  operation: operationSchema.extend({
    workerType: z.literal('render_worker'),
    resourceClassId: z.literal('render_cpu_high_memory_v1'),
    maximumAttempts: z.literal(2),
    attemptTimeoutSeconds: z.literal(21_600),
    leaseDurationMilliseconds: z.literal(300_000),
    heartbeatIntervalMilliseconds: z.literal(30_000),
    vcpuCount: z.literal(4),
    memoryGib: z.literal(8),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableH264AndIndependentQaCompletionsRequired: z.literal(true),
    exactQaPassedPrivateH264ChunksRead: z.literal(true),
    exactQaPassedPrivateProgramAudioRead: z.literal(true),
    fixedH264StreamCopyAndSingleAacEncodeRecipe: z.literal(true),
    completeProgramVideoReencodeAllowed: z.literal(false),
    privateCustomerDeliveryMasterCreateOnly: z.literal(true),
    independentDecodedVideoQaRequired: z.literal(true),
    independentDecodedAudioQaRequired: z.literal(true),
    privateDownloadReconciliationSeparatelyGated: z.literal(true),
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

export const professionalLongFormDeliveryMuxAuthorizationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORIZATION_VERSION,
  ),
  source: z.literal(
    'server_persisted_professional_long_form_customer_delivery_mux_authority',
  ),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND),
  expectedOutputIdentity: sha256,
  operation: operationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    exactDependencyArtifactsRead: z.literal(true),
    fixedVideoStreamCopyAndSingleAudioEncode: z.literal(true),
    createOnlyPrivateMp4Persistence: z.literal(true),
    decodedQaSeparatelyGated: z.literal(true),
    downloadSeparatelyGated: z.literal(true),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormDeliveryMuxAttemptSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_ATTEMPT_VERSION),
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
  operation: operationSchema,
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}).strict()

export const professionalLongFormDeliveryMuxRuntimeEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RUNTIME_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_mux_ffmpeg_runner',
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
    deliveryAttempt: z.literal(1),
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
  outputArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  outputProbeRef: jsonBlobRef,
  outputProbeHash: sha256,
  frontLoadedInitializationRef: jsonBlobRef,
  frontLoadedInitializationHash: sha256,
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
    exactOrderedH264TimelineVerified: z.literal('passed'),
    exactContinuousProgramAudioVerified: z.literal('passed'),
    h264VideoStreamCopiedWithoutReencode: z.literal('passed'),
    continuousFlacEncodedToAacExactlyOnce: z.literal('passed'),
    frontLoadedMp4InitializationVerified: z.literal('passed'),
    independentOutputProbeExecuted: z.literal('passed'),
    privateMasterPersistedCreateOnly: z.literal('passed'),
    decodedVideoQaStillRequired: z.literal(true),
    decodedAudioQaStillRequired: z.literal(true),
    privateDownloadStillRequired: z.literal(true),
  }).strict(),
  completedAt: timestamp,
  evidenceHash: sha256,
}).strict()

const downstreamQaSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  dependencyJobId: identity,
  thisDependencySatisfied: z.literal(true),
  everyRequiredDependencySatisfied: z.literal(true),
  executionAuthorized: z.literal(false),
}).strict()

export const professionalLongFormDeliveryMuxReconciliationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_mux_reconciliation',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  outputArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  downstreamDecodedVideoQa: downstreamQaSchema,
  downstreamDecodedAudioQa: downstreamQaSchema,
  privateDownload: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    dependencyJobIds: z.array(identity).length(2),
    executionAuthorized: z.literal(false),
    capabilityBlockedPendingBothDecodedQa: z.literal(true),
  }).strict(),
  decision: z.literal(
    'private_customer_delivery_master_ready_decoded_qa_and_download_require_separate_authority',
  ),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormDeliveryMuxTerminalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_MUX_TERMINAL_VERSION),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: operationSchema,
  outputArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  decodedVideoQaCompleted: z.literal(false),
  decodedAudioQaCompleted: z.literal(false),
  privateDownloadReconciled: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormDeliveryMuxCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COMPLETION_VERSION,
  ),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: operationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outputArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export type ProfessionalLongFormDeliveryMuxAuthority = z.infer<
  typeof professionalLongFormDeliveryMuxAuthoritySchema
>
export type ProfessionalLongFormDeliveryMuxAuthorization = z.infer<
  typeof professionalLongFormDeliveryMuxAuthorizationSchema
>
export type ProfessionalLongFormDeliveryMuxAttempt = z.infer<
  typeof professionalLongFormDeliveryMuxAttemptSchema
>
export type ProfessionalLongFormDeliveryMuxArtifactRef = z.infer<
  typeof professionalLongFormDeliveryMuxArtifactRefSchema
>
export type ProfessionalLongFormDeliveryMuxRuntimeEvidence = z.infer<
  typeof professionalLongFormDeliveryMuxRuntimeEvidenceSchema
>
export type ProfessionalLongFormDeliveryMuxReconciliation = z.infer<
  typeof professionalLongFormDeliveryMuxReconciliationSchema
>
export type ProfessionalLongFormDeliveryMuxTerminal = z.infer<
  typeof professionalLongFormDeliveryMuxTerminalSchema
>
export type ProfessionalLongFormDeliveryMuxCompletion = z.infer<
  typeof professionalLongFormDeliveryMuxCompletionSchema
>
