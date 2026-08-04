import { z } from 'zod'

import {
  professionalLongFormDeliveryMuxArtifactRefSchema,
} from './professional-long-form-customer-delivery-mux-execution-contract'

export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORITY_VERSION =
  'professional-long-form-customer-delivery-decoded-video-qa-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORIZATION_VERSION =
  'professional-long-form-customer-delivery-decoded-video-qa-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ATTEMPT_VERSION =
  'professional-long-form-customer-delivery-decoded-video-qa-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ARTIFACT_VERSION =
  'professional-long-form-customer-delivery-decoded-video-qa-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECONCILIATION_VERSION =
  'professional-long-form-customer-delivery-decoded-video-qa-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_TERMINAL_VERSION =
  'professional-long-form-customer-delivery-decoded-video-qa-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COMPLETION_VERSION =
  'professional-long-form-customer-delivery-decoded-video-qa-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORITY_VERSION =
  'professional-long-form-customer-delivery-decoded-audio-qa-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORIZATION_VERSION =
  'professional-long-form-customer-delivery-decoded-audio-qa-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ATTEMPT_VERSION =
  'professional-long-form-customer-delivery-decoded-audio-qa-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ARTIFACT_VERSION =
  'professional-long-form-customer-delivery-decoded-audio-qa-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECONCILIATION_VERSION =
  'professional-long-form-customer-delivery-decoded-audio-qa-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_TERMINAL_VERSION =
  'professional-long-form-customer-delivery-decoded-audio-qa-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COMPLETION_VERSION =
  'professional-long-form-customer-delivery-decoded-audio-qa-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND =
  'qa_customer_delivery_decoded_video' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND =
  'qa_customer_delivery_decoded_audio' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RUNNER_CLASS =
  'offline_media_binary_final_master_video_qa_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RUNNER_CLASS =
  'offline_media_binary_final_master_audio_qa_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID =
  'ffmpeg_final_master_decoded_video_qa_cpu_2vcpu_2gib_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID =
  'ffmpeg_final_master_decoded_audio_qa_cpu_2vcpu_2gib_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECIPE_ID =
  'approved_final_master_decoded_video_integrity_v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECIPE_ID =
  'approved_final_master_decoded_audio_quality_sync_v1' as const

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
const qaOutcome = z.enum(['passed', 'needs_user_review'])

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

const commonIdentityShape = {
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
}

const muxCompletionSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  queueCompletionHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
  artifact: professionalLongFormDeliveryMuxArtifactRefSchema,
}).strict()

const commonLineageShape = {
  deliveryPackageHash: sha256,
  deliveryPackageRef: jsonBlobRef,
  deliveryPlacementManifestHash: sha256,
  deliveryPlacementManifestRef: jsonBlobRef,
  queueDefinitionHash: sha256,
  qaJobDefinitionHash: sha256,
  qaPlacementHash: sha256,
  sourceEvidenceHash: sha256,
  muxCompletion: muxCompletionSchema,
  muxCompletionHash: sha256,
  mediaBinaryRuntimeAuthorityHash: sha256,
  mediaBinaryImageIdentityHash: sha256,
}

const commonQaPlanShape = {
  qaRunId: identity,
  approvedExecutionPackageHash: sha256,
  approvedDeliverableId: identity,
  expectedEvidenceIdentity: expectedOutputIdentity,
  finalMasterArtifactId: identity,
  finalMasterObjectIdentityHash: sha256,
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
  totalFrames: z.number().int().min(2_700).max(648_000),
  mediaPolicyId: z.literal('approved_h264_aac_yuv420p_bt709_web_master_v1'),
  usesApprovedEditReservation: z.literal(true),
  requiresSeparateExportEstimate: z.literal(false),
  allowsAdditionalExportCharge: z.literal(false),
  mediaMutationAllowed: z.literal(false),
  providerCallAllowed: z.literal(false),
}

const visualExceptionManifestSchema = z.object({
  schemaVersion: z.literal('approved-final-master-visual-exception-manifest-v1'),
  ranges: z.array(z.object({
    exceptionId: identity,
    kind: z.enum([
      'approved_black_hold',
      'approved_freeze_hold',
      'approved_flash_or_cut',
    ]),
    startFrame: z.number().int().nonnegative().max(647_999),
    endFrameExclusive: z.number().int().positive().max(648_000),
    approvalEvidenceHash: sha256,
  }).strict()).max(2_048),
  manifestHash: sha256,
}).strict()

const audioExceptionManifestSchema = z.object({
  schemaVersion: z.literal('approved-final-master-audio-exception-manifest-v1'),
  ranges: z.array(z.object({
    exceptionId: identity,
    kind: z.literal('approved_digital_silence'),
    startFrame: z.number().int().nonnegative().max(647_999),
    endFrameExclusive: z.number().int().positive().max(648_000),
    approvalEvidenceHash: sha256,
  }).strict()).max(2_048),
  manifestHash: sha256,
}).strict()

const videoOperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID),
  runnerClass: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RUNNER_CLASS,
  ),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
  ),
  fixedRecipeProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECIPE_ID,
  ),
}).strict()

const audioOperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID),
  runnerClass: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RUNNER_CLASS,
  ),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
  ),
  fixedRecipeProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECIPE_ID,
  ),
}).strict()

const operationRuntimeShape = {
  workerType: z.literal('qa_worker'),
  resourceClassId: z.literal('qa_cpu_standard_v1'),
  maximumAttempts: z.literal(2),
  attemptTimeoutSeconds: z.literal(21_600),
  leaseDurationMilliseconds: z.literal(300_000),
  heartbeatIntervalMilliseconds: z.number().int().min(1_000).max(60_000),
  vcpuCount: z.literal(2),
  memoryGib: z.literal(2),
  gpuCount: z.literal(0),
}

const attemptCommonShape = {
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

const authorizationCommonShape = {
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  expectedOutputIdentity,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    exactCompletedPrivateMasterRead: z.literal(true),
    fullDecodedStreamAnalysis: z.literal(true),
    privateQaPersistence: z.literal(true),
    mediaMutationAllowed: z.literal(false),
    downloadExecutionAuthorized: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}

export const professionalLongFormDeliveryDecodedVideoQaAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_reopened_professional_long_form_customer_delivery_decoded_video_qa_authority',
  ),
  purpose: z.literal(
    'authorize_one_full_decode_and_visual_integrity_scan_of_exact_private_customer_delivery_master',
  ),
  status: z.literal(
    'decoded_video_qa_authorized_private_download_separately_blocked',
  ),
  identity: z.object({
    ...commonIdentityShape,
    kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND),
  }).strict(),
  approval: approvalSchema,
  approvedQaPlan: z.object({
    ...commonQaPlanShape,
    recipeProfileId: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECIPE_ID,
    ),
    anomalyPolicyId: z.literal('approved_objective_visual_anomaly_policy_v1'),
    blackMinimumDurationFrames: z.number().int().min(2).max(240),
    freezeMinimumDurationFrames: z.number().int().min(30).max(14_400),
    flashSceneChangeThreshold: z.literal(0.8),
    visualExceptionManifest: visualExceptionManifestSchema,
    planHash: sha256,
  }).strict(),
  muxArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  lineage: z.object(commonLineageShape).strict(),
  operation: videoOperationSchema.extend(operationRuntimeShape).strict(),
  permissions: z.object({
    immutableMuxCompletionRequired: z.literal(true),
    exactPrivateMasterChecksumRequired: z.literal(true),
    independentTechnicalProbe: z.literal(true),
    fullDecodedFrameIntegrity: z.literal(true),
    visualAnomalyPolicyRequired: z.literal(true),
    privateQaArtifactCreateOnly: z.literal(true),
    downloadExecutionAuthorized: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: persistenceSchema,
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

export const professionalLongFormDeliveryDecodedAudioQaAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_reopened_professional_long_form_customer_delivery_decoded_audio_qa_authority',
  ),
  purpose: z.literal(
    'authorize_one_full_decode_audio_quality_and_av_sync_scan_of_exact_private_customer_delivery_master',
  ),
  status: z.literal(
    'decoded_audio_qa_authorized_private_download_separately_blocked',
  ),
  identity: z.object({
    ...commonIdentityShape,
    kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND),
  }).strict(),
  approval: approvalSchema,
  approvedQaPlan: z.object({
    ...commonQaPlanShape,
    recipeProfileId: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECIPE_ID,
    ),
    audioPolicyId: z.literal('approved_web_delivery_audio_policy_v1'),
    sampleRate: z.literal(48_000),
    channels: z.literal(2),
    targetIntegratedLufs: z.literal(-14),
    integratedLufsTolerance: z.literal(1),
    maximumTruePeakDbtp: z.literal(-1),
    maximumLoudnessRangeLufs: z.literal(7),
    maximumAvSyncDriftFrames: z.literal(2),
    silenceMinimumDurationFrames: z.literal(30),
    speechClarityEvidenceHash: sha256,
    speechClarityEvidenceSource: z.literal(
      'bound_upstream_private_review_audio_acceptance_v1',
    ),
    actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
    audioExceptionManifest: audioExceptionManifestSchema,
    planHash: sha256,
  }).strict(),
  muxArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  lineage: z.object(commonLineageShape).strict(),
  operation: audioOperationSchema.extend(operationRuntimeShape).strict(),
  permissions: z.object({
    immutableMuxCompletionRequired: z.literal(true),
    exactPrivateMasterChecksumRequired: z.literal(true),
    independentTechnicalProbe: z.literal(true),
    fullDecodedAudioIntegrity: z.literal(true),
    loudnessPeakSilenceAndAvSyncPolicyRequired: z.literal(true),
    separateSpeechClarityEvidenceRequired: z.literal(true),
    ffmpegSpeechUnderstandingAllowed: z.literal(false),
    privateQaArtifactCreateOnly: z.literal(true),
    downloadExecutionAuthorized: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  persistence: persistenceSchema,
  authorizedAt: timestamp,
  authorityHash: sha256,
}).strict()

export const professionalLongFormDeliveryDecodedVideoQaAuthorizationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORIZATION_VERSION,
    ),
    source: z.literal(
      'server_persisted_professional_long_form_customer_delivery_decoded_video_qa_authority',
    ),
    ...authorizationCommonShape,
    kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND),
    operation: videoOperationSchema,
  }).strict()

export const professionalLongFormDeliveryDecodedAudioQaAuthorizationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORIZATION_VERSION,
    ),
    source: z.literal(
      'server_persisted_professional_long_form_customer_delivery_decoded_audio_qa_authority',
    ),
    ...authorizationCommonShape,
    kind: z.literal(PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND),
    operation: audioOperationSchema,
  }).strict()

export const professionalLongFormDeliveryDecodedVideoQaAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ATTEMPT_VERSION,
  ),
  ...attemptCommonShape,
  operation: videoOperationSchema,
}).strict()

export const professionalLongFormDeliveryDecodedAudioQaAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ATTEMPT_VERSION,
  ),
  ...attemptCommonShape,
  operation: audioOperationSchema,
}).strict()

const artifactIdentityShape = {
  workspaceId: identity,
  projectId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
}

const artifactCommonShape = {
  identity: z.object(artifactIdentityShape).strict(),
  authorityHash: sha256,
  executionAttemptHash: sha256,
  muxArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  rawRunnerResultRef: jsonBlobRef,
  runtimeReceiptRef: jsonBlobRef,
  objectiveEvidenceRef: jsonBlobRef,
  objectiveEvidenceHash: sha256,
  requestEnvelopeSha256: sha256,
  runtimeImageIdentityHash: sha256,
  runtimeAttestationHash: sha256,
  outcome: qaOutcome,
  evaluatedAt: timestamp,
}

export const professionalLongFormDeliveryDecodedVideoQaArtifactSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ARTIFACT_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_decoded_video_qa',
  ),
  ...artifactCommonShape,
  operation: videoOperationSchema,
  approvedVisualExceptionManifestHash: sha256,
  observed: z.object({
    fullFrameDecodeCompleted: z.literal(true),
    decodedFrameCount: positiveInteger.max(100_000_000),
    decodeErrorCount: z.literal(0),
    nonMonotonicTimestampCount: z.literal(0),
    unexpectedBlackFrameCount: z.number().int().nonnegative().max(100_000_000),
    unexpectedFreezeFrameCount: z.number().int().nonnegative().max(100_000_000),
    unexpectedFlashFrameCount: z.number().int().nonnegative().max(100_000_000),
    fullFrameCoverage: z.literal(true),
  }).strict(),
  checks: z.object({
    exactPersistedCustomerDeliveryMasterReopened: z.literal('passed'),
    independentPinnedFfmpegExecution: z.literal('passed'),
    exactH264Yuv420pBt709FrameContract: z.literal('passed'),
    everyDecodedFrameAccountedFor: z.literal('passed'),
    visualAnomaliesReconciledAgainstApprovedExceptions: qaOutcome,
    noMediaMutationOrCommercialAction: z.literal('passed'),
  }).strict(),
  qaHash: sha256,
}).strict()

export const professionalLongFormDeliveryDecodedAudioQaArtifactSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ARTIFACT_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_decoded_audio_qa',
  ),
  ...artifactCommonShape,
  operation: audioOperationSchema,
  approvedAudioExceptionManifestHash: sha256,
  speechClarityEvidenceHash: sha256,
  speechClarityEvidenceSource: z.literal(
    'bound_upstream_private_review_audio_acceptance_v1',
  ),
  actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
  observed: z.object({
    fullProgramAudioDecodeCompleted: z.literal(true),
    sampleRate: z.literal(48_000),
    channels: z.literal(2),
    decodedSampleFrameCount: positiveInteger,
    integratedLufs: z.union([z.number(), z.literal('negative_infinity')]),
    truePeakDbtp: z.union([z.number(), z.literal('negative_infinity')]),
    loudnessRangeLufs: z.union([z.number(), z.literal('negative_infinity')]),
    avSyncDriftFrames: z.number().nonnegative().max(100_000),
    unexpectedClippedSampleCount: z.number().int().nonnegative(),
    unexpectedDigitalSilenceFrameCount: z.number().int().nonnegative(),
    speechClarityGatePassed: z.boolean(),
  }).strict(),
  checks: z.object({
    exactPersistedCustomerDeliveryMasterReopened: z.literal('passed'),
    independentPinnedFfmpegExecution: z.literal('passed'),
    exactAac48kStereoContract: z.literal('passed'),
    everyDecodedAudioSampleRangeAccountedFor: z.literal('passed'),
    loudnessPeakSilenceAndAvSyncPolicy: qaOutcome,
    separateSpeechClarityEvidenceBound: z.literal('passed'),
    ffmpegClaimedSpeechUnderstanding: z.literal(false),
    noMediaMutationOrCommercialAction: z.literal('passed'),
  }).strict(),
  qaHash: sha256,
}).strict()

const siblingQaSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  state: z.enum(['queued', 'completed']),
  executionAuthorized: z.boolean(),
}).strict()

const reconciliationCommonShape = {
  qaJobId: identity,
  qaApprovedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  muxArtifact: professionalLongFormDeliveryMuxArtifactRefSchema,
  qaArtifactRef: jsonBlobRef,
  qaOutcome,
  siblingDecodedQa: siblingQaSchema,
  privateDownload: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    dependencyJobIds: z.array(identity).length(2),
    thisQaDependencySatisfied: z.literal(true),
    executionAuthorized: z.literal(false),
    capabilityBlockedPendingExactReconciliationAuthority: z.literal(true),
  }).strict(),
  publicDeliveryAuthorized: z.literal(false),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}

export const professionalLongFormDeliveryDecodedVideoQaReconciliationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_RECONCILIATION_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_customer_delivery_decoded_video_qa_reconciliation',
    ),
    ...reconciliationCommonShape,
    decision: z.literal(
      'decoded_video_qa_finished_decoded_audio_and_private_download_remain_separately_gated',
    ),
  }).strict()

export const professionalLongFormDeliveryDecodedAudioQaReconciliationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_RECONCILIATION_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_customer_delivery_decoded_audio_qa_reconciliation',
    ),
    ...reconciliationCommonShape,
    actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
    decision: z.literal(
      'decoded_audio_quality_and_sync_qa_finished_private_download_requires_exact_qa_reconciliation',
    ),
  }).strict()

const terminalCommonShape = {
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  objectiveQaOutcome: qaOutcome,
  privateDownloadReconciled: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}

export const professionalLongFormDeliveryDecodedVideoQaTerminalSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service',
  ),
  ...terminalCommonShape,
  operation: videoOperationSchema,
  decodedAudioQaCompleted: z.boolean(),
}).strict()

export const professionalLongFormDeliveryDecodedAudioQaTerminalSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service',
  ),
  ...terminalCommonShape,
  operation: audioOperationSchema,
  decodedVideoQaCompleted: z.boolean(),
  actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
}).strict()

const completionCommonShape = {
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
  objectiveQaOutcome: qaOutcome,
}

export const professionalLongFormDeliveryDecodedVideoQaCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COMPLETION_VERSION,
  ),
  ...completionCommonShape,
  operation: videoOperationSchema,
}).strict()

export const professionalLongFormDeliveryDecodedAudioQaCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COMPLETION_VERSION,
  ),
  ...completionCommonShape,
  operation: audioOperationSchema,
  actualSpeechIntelligibilityAnalysisPerformed: z.literal(false),
}).strict()

export type ProfessionalLongFormDeliveryDecodedVideoQaAuthority = z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaAuthoritySchema
>
export type ProfessionalLongFormDeliveryDecodedAudioQaAuthority = z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaAuthoritySchema
>
export type ProfessionalLongFormDeliveryDecodedVideoQaAuthorization = z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaAuthorizationSchema
>
export type ProfessionalLongFormDeliveryDecodedAudioQaAuthorization = z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaAuthorizationSchema
>
export type ProfessionalLongFormDeliveryDecodedVideoQaAttempt = z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaAttemptSchema
>
export type ProfessionalLongFormDeliveryDecodedAudioQaAttempt = z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaAttemptSchema
>
export type ProfessionalLongFormDeliveryDecodedVideoQaArtifact = z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaArtifactSchema
>
export type ProfessionalLongFormDeliveryDecodedAudioQaArtifact = z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaArtifactSchema
>
export type ProfessionalLongFormDeliveryDecodedVideoQaReconciliation = z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaReconciliationSchema
>
export type ProfessionalLongFormDeliveryDecodedAudioQaReconciliation = z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaReconciliationSchema
>
export type ProfessionalLongFormDeliveryDecodedVideoQaTerminal = z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaTerminalSchema
>
export type ProfessionalLongFormDeliveryDecodedAudioQaTerminal = z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaTerminalSchema
>
export type ProfessionalLongFormDeliveryDecodedVideoQaCompletion = z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaCompletionSchema
>
export type ProfessionalLongFormDeliveryDecodedAudioQaCompletion = z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaCompletionSchema
>
