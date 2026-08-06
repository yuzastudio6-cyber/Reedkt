import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORITY_VERSION =
  'professional-long-form-continuous-program-audio-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORIZATION_VERSION =
  'professional-long-form-continuous-program-audio-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_ATTEMPT_VERSION =
  'professional-long-form-continuous-program-audio-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNTIME_EVIDENCE_VERSION =
  'professional-long-form-continuous-program-audio-runtime-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_ARTIFACT_VERSION =
  'professional-long-form-continuous-program-audio-qa-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RECONCILIATION_VERSION =
  'professional-long-form-continuous-program-audio-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_TERMINAL_VERSION =
  'professional-long-form-continuous-program-audio-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COMPLETION_VERSION =
  'professional-long-form-continuous-program-audio-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND =
  'mix_continuous_program_audio' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_WORK_ITEM_ID =
  'long-form-mix-continuous-program-audio' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNNER_CLASS =
  'canonical_professional_long_form_continuous_program_audio_ffmpeg_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID =
  'ffmpeg_continuous_program_audio_cpu_2vcpu_4gib_v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID =
  'tool.ffprobe.inspect_approved_media.v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_RUNNER_CLASS =
  'canonical_professional_long_form_continuous_program_audio_ffprobe_qa_v1' as const
export const PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID =
  'ffprobe_continuous_program_audio_qa_cpu_2vcpu_4gib_v1' as const

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
  secondExportEstimateCreated: z.literal(false),
  secondExportChargeCreated: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const audioOperationSchema = z.object({
  operationId: z.literal(
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
  ),
  runnerClass: z.literal(
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNNER_CLASS,
  ),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
  ),
}).strict()

const qaOperationSchema = z.object({
  operationId: z.literal(
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
  ),
  runnerClass: z.literal(
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_RUNNER_CLASS,
  ),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
  ),
}).strict()

const sourceSchema = z.object({
  inputId: identity,
  sourceSequenceItemId: identity,
  mediaAssetId: identity,
  sourceObjectGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  mimeType: z.literal('video/mp4'),
  byteLength: positiveInteger.max(192 * 1024 * 1024),
  sha256,
}).strict()

const sourceSliceSchema = z.object({
  sliceIndex: z.number().int().min(1).max(512),
  segmentId: identity,
  sourceSequenceItemId: identity,
  mediaAssetId: identity,
  sourceObjectGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  sourceSha256: sha256,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.number().int().nonnegative().max(648_000),
  sourceEndFrameExclusive: z.number().int().positive().max(648_000),
  timelineStartFrame: z.number().int().nonnegative().max(647_999),
  timelineEndFrameExclusive: z.number().int().positive().max(648_000),
  boundaryBefore: z.enum(['timeline_start', 'approved_hard_cut']),
}).strict()

const approvedAudioPlanSchema = z.object({
  audioAuthorityHash: sha256,
  privateObjectIdentityHash: sha256,
  totalFrames: z.number().int().min(1_350).max(648_000),
  frameRateNumerator: z.literal(30),
  frameRateDenominator: z.literal(1),
  sampleRate: z.literal(48_000),
  channels: z.literal(2),
  bitsPerRawSample: z.literal(24),
  outputContainer: z.literal('flac'),
  outputAudioCodec: z.literal('flac'),
  sourceQualityPolicy: z.literal(
    'immutable_source_master_audio_no_proxy_v1',
  ),
  transitionPolicy: z.literal('approved_hard_cuts_only_v1'),
  timestampPolicy: z.literal('normalize_from_zero'),
  musicPlanned: z.literal(false),
  sfxPlanned: z.literal(false),
  duckingPlanned: z.literal(false),
  realAudioAnalysisPerformed: z.literal(false),
  sources: z.array(sourceSchema).min(2).max(8),
  sourceSlices: z.array(sourceSliceSchema).min(2).max(512),
  planHash: sha256,
}).strict()

export const professionalLongFormContinuousProgramAudioArtifactRefSchema =
  z.object({
    objectIdentity: sha256,
    mediaFormat: z.literal('flac'),
    contentType: z.literal('audio/flac'),
    byteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
    sha256,
    totalFrames: z.number().int().min(1_350).max(648_000),
    sampleCount: z.number().int().min(2_160_000).max(1_036_800_000),
    sampleRate: z.literal(48_000),
    channels: z.literal(2),
    bitsPerRawSample: z.literal(24),
    objectVersion: z.literal(1),
    assetRole: z.literal('processed'),
    placeholderAllowed: z.literal(false),
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
  }).strict()

const identitySchema = z.object({
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

const dependencyCompletionSchema = z.object({
  kind: z.enum([
    'validate_private_source_authority',
    'validate_master_timing',
  ]),
  jobId: identity,
  approvedWorkItemId: identity,
  queueCompletionHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
}).strict()

export const professionalLongFormContinuousProgramAudioAuthoritySchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORITY_VERSION,
    ),
    source: z.literal(
      'server_reopened_professional_long_form_continuous_program_audio_authority',
    ),
    purpose: z.literal(
      'authorize_one_private_lossless_source_program_audio_assembly_and_qa',
    ),
    status: z.literal(
      'continuous_program_audio_authorized_independent_qa_required',
    ),
    identity: identitySchema,
    approval: approvalSchema,
    approvedAudioPlan: approvedAudioPlanSchema,
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
      sourceManifestHash: sha256,
      parentApprovedWorkItemHash: sha256,
      audioJobAuthorityHash: sha256,
      audioJobDefinitionHash: sha256,
      audioPlacementHash: sha256,
      dependencyCompletions: z.array(dependencyCompletionSchema).length(2),
      dependencySetHash: sha256,
    }).strict(),
    operation: audioOperationSchema.extend({
      workerType: z.literal('cpu_analysis_worker'),
      resourceClassId: z.literal('cpu_analysis_standard_v1'),
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
      approvedPrivateSourceRead: z.literal(true),
      exactSourceChecksumsRequired: z.literal(true),
      fixedSourceAudioAssemblyRecipe: z.literal(true),
      sourceAudioDecodeAllowed: z.literal(true),
      musicGenerationOrMixingAllowed: z.literal(false),
      sfxGenerationOrMixingAllowed: z.literal(false),
      duckingOrNormalizationAllowed: z.literal(false),
      privateProgramAudioCreateOnly: z.literal(true),
      independentQaRequiredBeforeCompletion: z.literal(true),
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

export const professionalLongFormContinuousProgramAudioAuthorizationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORIZATION_VERSION,
    ),
    source: z.literal(
      'server_persisted_professional_long_form_continuous_program_audio_authority',
    ),
    authorizationId: identity,
    authorityRef: jsonBlobRef,
    authorityHash: sha256,
    queueDefinitionHash: sha256,
    jobId: identity,
    approvedWorkItemId: identity,
    jobDefinitionHash: sha256,
    placementHash: sha256,
    kind: z.literal(PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_KIND),
    expectedOutputIdentity,
    operation: audioOperationSchema,
    authorizedAt: timestamp,
    reservationExpiresAt: timestamp,
    permissions: z.object({
      privateLocalLease: z.literal(true),
      oneUseInternalDispatch: z.literal(true),
      approvedPrivateSourceRead: z.literal(true),
      fixedSourceAudioAssemblyRecipe: z.literal(true),
      createOnlyPrivateProgramAudioPersistence: z.literal(true),
      independentQaWithinAttempt: z.literal(true),
      providerCall: z.literal(false),
      googleCloudDispatch: z.literal(false),
      publicDelivery: z.literal(false),
    }).strict(),
    commercialBoundary: commercialBoundarySchema,
    receiptHash: sha256,
  }).strict()

export const professionalLongFormContinuousProgramAudioAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_ATTEMPT_VERSION,
  ),
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
  operation: audioOperationSchema,
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}).strict()

export const professionalLongFormContinuousProgramAudioRuntimeEvidenceSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RUNTIME_EVIDENCE_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_continuous_program_audio_ffmpeg_runner',
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
    operation: audioOperationSchema,
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
    sourceReadEvidenceHashes: z.array(sha256).min(2).max(8),
    sourceStagingEvidenceHashes: z.array(sha256).min(2).max(8),
    sourceSha256s: z.array(sha256).min(2).max(8),
    capacityEvidenceHash: sha256,
    outputArtifact: professionalLongFormContinuousProgramAudioArtifactRefSchema,
    embeddedOutputProbeHash: sha256,
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
      immutableSourceBytesVerified: z.literal('passed'),
      approvedSourceRangesAndHardCutsVerified: z.literal('passed'),
      exactFrameToSampleMappingVerified: z.literal('passed'),
      losslessFlacPersistedCreateOnly: z.literal('passed'),
      noMusicSfxDuckingOrNormalization: z.literal('passed'),
      independentQaStillRequired: z.literal(true),
    }).strict(),
    completedAt: timestamp,
    artifactHash: sha256,
  }).strict()

export const professionalLongFormContinuousProgramAudioQaArtifactSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_ARTIFACT_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_continuous_program_audio_ffprobe_qa',
    ),
    identity: z.object({
      workspaceId: identity,
      projectId: identity,
      approvedPlanSnapshotId: identity,
      jobId: identity,
      approvedWorkItemId: identity,
      executionAttemptId: identity,
      qaExecutionAttemptId: identity,
    }).strict(),
    authorityHash: sha256,
    executionAttemptHash: sha256,
    operation: qaOperationSchema,
    outputArtifact: professionalLongFormContinuousProgramAudioArtifactRefSchema,
    rawQaResultRef: jsonBlobRef,
    qaRuntimeEvidenceRef: jsonBlobRef,
    requestEnvelopeSha256: sha256,
    qaAttestationHash: sha256,
    observed: z.object({
      container: z.literal('flac'),
      audioCodec: z.literal('flac'),
      streamCount: z.literal(1),
      sampleRate: z.literal(48_000),
      channels: z.literal(2),
      channelLayout: z.literal('stereo'),
      sampleFormat: z.literal('s32'),
      bitsPerRawSample: z.literal(24),
      timeBase: z.literal('1/48000'),
      expectedSamples: z.number().int().min(2_160_000).max(1_036_800_000),
      actualSamples: z.number().int().min(2_160_000).max(1_036_800_000),
      decodedBytes: positiveInteger.max(8 * 1024 * 1024 * 1024),
      durationSeconds: z.number().positive().max(21_600),
    }).strict(),
    checks: z.object({
      exactPersistedArtifactReopened: z.literal('passed'),
      independentProbeExecuted: z.literal('passed'),
      exactFlacStreamShape: z.literal('passed'),
      exactLosslessDecodedSampleCount: z.literal('passed'),
      exactFrameToSampleDuration: z.literal('passed'),
      noMediaMutation: z.literal('passed'),
    }).strict(),
    outcome: z.literal('passed'),
    evaluatedAt: timestamp,
    qaHash: sha256,
  }).strict()

export const professionalLongFormContinuousProgramAudioReconciliationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_RECONCILIATION_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_continuous_program_audio_reconciliation',
    ),
    jobId: identity,
    approvedWorkItemId: identity,
    executionAttemptId: identity,
    authorityHash: sha256,
    outputArtifact: professionalLongFormContinuousProgramAudioArtifactRefSchema,
    runtimeEvidenceRef: jsonBlobRef,
    qaArtifactRef: jsonBlobRef,
    downstreamFinalization: z.object({
      jobId: identity,
      approvedWorkItemId: identity,
      dependencyJobId: identity,
      thisDependencySatisfied: z.literal(true),
      everyRequiredDependencySatisfied: z.literal(false),
      executionAuthorized: z.literal(false),
    }).strict(),
    decision: z.literal(
      'program_audio_and_qa_ready_video_chunks_color_and_finalization_remain_blocked',
    ),
    reconciledAt: timestamp,
    reconciliationHash: sha256,
  }).strict()

export const professionalLongFormContinuousProgramAudioTerminalSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_TERMINAL_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_continuous_program_audio_execution_service',
    ),
    jobId: identity,
    approvedWorkItemId: identity,
    executionAttemptId: identity,
    qaExecutionAttemptId: identity,
    queueReceiptId: identity,
    authorityHash: sha256,
    operation: audioOperationSchema,
    outputArtifact: professionalLongFormContinuousProgramAudioArtifactRefSchema,
    runtimeEvidenceRef: jsonBlobRef,
    qaArtifactRef: jsonBlobRef,
    reconciliationEvidenceRef: jsonBlobRef,
    canonicalResultHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    qaAttemptInternalCostEvidenceHash: sha256,
    outcome: z.literal('completed_private_test'),
    remainingPipelineExecutionAuthorized: z.literal(false),
    commercialBoundary: commercialBoundarySchema,
    completedAt: timestamp,
    terminalHash: sha256,
  }).strict()

export const professionalLongFormContinuousProgramAudioCompletionSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COMPLETION_VERSION,
    ),
    executionAttemptId: identity,
    authorizationId: identity,
    authorityHash: sha256,
    operation: audioOperationSchema,
    canonicalResultHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    qaAttemptInternalCostEvidenceHash: sha256,
    qaExecutionAttemptId: identity,
    outputArtifact: professionalLongFormContinuousProgramAudioArtifactRefSchema,
    runtimeEvidenceRef: jsonBlobRef,
    qaArtifactRef: jsonBlobRef,
    reconciliationEvidenceRef: jsonBlobRef,
    terminalEvidenceRef: jsonBlobRef,
  }).strict()

export type ProfessionalLongFormContinuousProgramAudioAuthority = z.infer<
  typeof professionalLongFormContinuousProgramAudioAuthoritySchema
>
export type ProfessionalLongFormContinuousProgramAudioAuthorization = z.infer<
  typeof professionalLongFormContinuousProgramAudioAuthorizationSchema
>
export type ProfessionalLongFormContinuousProgramAudioAttempt = z.infer<
  typeof professionalLongFormContinuousProgramAudioAttemptSchema
>
export type ProfessionalLongFormContinuousProgramAudioArtifactRef = z.infer<
  typeof professionalLongFormContinuousProgramAudioArtifactRefSchema
>
export type ProfessionalLongFormContinuousProgramAudioRuntimeEvidence = z.infer<
  typeof professionalLongFormContinuousProgramAudioRuntimeEvidenceSchema
>
export type ProfessionalLongFormContinuousProgramAudioQaArtifact = z.infer<
  typeof professionalLongFormContinuousProgramAudioQaArtifactSchema
>
export type ProfessionalLongFormContinuousProgramAudioReconciliation = z.infer<
  typeof professionalLongFormContinuousProgramAudioReconciliationSchema
>
export type ProfessionalLongFormContinuousProgramAudioTerminal = z.infer<
  typeof professionalLongFormContinuousProgramAudioTerminalSchema
>
export type ProfessionalLongFormContinuousProgramAudioCompletion = z.infer<
  typeof professionalLongFormContinuousProgramAudioCompletionSchema
>
