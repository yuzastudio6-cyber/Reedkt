import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORITY_VERSION =
  'professional-long-form-first-object-chunk-render-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORIZATION_VERSION =
  'professional-long-form-first-object-chunk-render-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_ATTEMPT_VERSION =
  'professional-long-form-first-object-chunk-render-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_EVIDENCE_VERSION =
  'professional-long-form-first-object-chunk-render-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RECONCILIATION_VERSION =
  'professional-long-form-first-object-chunk-render-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_TERMINAL_VERSION =
  'professional-long-form-first-object-chunk-render-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COMPLETION_VERSION =
  'professional-long-form-first-object-chunk-render-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORITY_VERSION =
  'professional-long-form-first-object-chunk-qa-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORIZATION_VERSION =
  'professional-long-form-first-object-chunk-qa-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ATTEMPT_VERSION =
  'professional-long-form-first-object-chunk-qa-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ARTIFACT_VERSION =
  'professional-long-form-first-object-chunk-qa-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RECONCILIATION_VERSION =
  'professional-long-form-first-object-chunk-qa-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_TERMINAL_VERSION =
  'professional-long-form-first-object-chunk-qa-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COMPLETION_VERSION =
  'professional-long-form-first-object-chunk-qa-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_KIND =
  'render_object_mezzanine_chunk' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_KIND =
  'qa_object_mezzanine_chunk' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID =
  'tool.ffprobe.inspect_approved_media.v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RUNNER_CLASS =
  'canonical_professional_long_form_first_object_chunk_ffmpeg_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RUNNER_CLASS =
  'canonical_professional_long_form_first_object_chunk_ffprobe_qa_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID =
  'ffmpeg_4k_object_mezzanine_chunk_cpu_2vcpu_4gib_v1' as const
export const PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID =
  'ffprobe_4k_object_mezzanine_chunk_qa_cpu_2vcpu_4gib_v1' as const

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

export const professionalLongFormFirstObjectChunkMediaArtifactRefSchema =
  z.object({
    objectIdentity: sha256,
    mediaFormat: z.literal('mkv'),
    contentType: z.literal('video/x-matroska'),
    byteLength: positiveInteger.max(192 * 1024 * 1024),
    sha256,
    objectVersion: z.literal(1),
    assetRole: z.literal('processed'),
    rendererLayerIdentity: sha256,
    placeholderAllowed: z.literal(false),
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
  }).strict()

const commercialBoundarySchema = z.object({
  internalProductionCostOnly: z.literal(true),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  secondExportEstimateCreated: z.literal(false),
  secondExportChargeCreated: z.literal(false),
  approvedFourKEstimateAndReservationReused: z.literal(true),
  walletMutationAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const renderOperationSchema = z.object({
  operationId: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
  ),
  runnerClass: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RUNNER_CLASS,
  ),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
  ),
}).strict()

const qaOperationSchema = z.object({
  operationId: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
  ),
  runnerClass: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RUNNER_CLASS,
  ),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
  ),
}).strict()

const sourceSliceSchema = z.object({
  sliceIndex: z.number().int().min(1).max(16),
  segmentId: identity,
  sourceSequenceItemId: identity,
  mediaAssetId: identity,
  sourceObjectGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  sourceSha256: sha256,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.literal(0),
  sourceEndFrameExclusive: z.number().int().min(1).max(5_400),
  globalTimelineStartFrame: z.number().int().min(0).max(5_399),
  globalTimelineEndFrameExclusive: z.number().int().min(1).max(5_400),
  chunkLocalStartFrame: z.number().int().min(0).max(5_399),
  chunkLocalEndFrameExclusive: z.number().int().min(1).max(5_400),
  boundaryBefore: z.enum(['timeline_start', 'approved_hard_cut']),
}).strict()

const approvedChunkSchema = z.object({
  chunkId: identity,
  chunkIndex: z.literal(1),
  chunkCount: z.number().int().min(1).max(124),
  globalStartFrame: z.literal(0),
  globalEndFrameExclusive: z.number().int().min(1_350).max(5_400),
  durationFrames: z.number().int().min(1_350).max(5_400),
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
  sourceSlices: z.array(sourceSliceSchema).min(2).max(16),
  expectedObject: z.object({
    objectIdentity: sha256,
    runtimeRegion: z.enum(['us-east1', 'europe-west1']),
    contentType: z.literal('video/x-matroska'),
    assetRole: z.literal('processed'),
    objectVersion: z.literal(1),
    rendererLayerIdentity: sha256,
    placeholderAllowed: z.literal(false),
    createOnlyRequired: z.literal(true),
  }).strict(),
  chunkAuthorityHash: sha256,
}).strict()

const commonIdentityFields = {
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
    'validate_approved_snapshot',
    'validate_private_source_authority',
    'validate_master_timing',
  ]),
  jobId: identity,
  approvedWorkItemId: identity,
  queueCompletionHash: sha256,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
}).strict()

export const professionalLongFormFirstObjectChunkRenderAuthorizationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORIZATION_VERSION,
    ),
    source: z.literal(
      'server_persisted_professional_long_form_first_object_chunk_render_authority',
    ),
    authorizationId: identity,
    authorityRef: jsonBlobRef,
    authorityHash: sha256,
    queueDefinitionHash: sha256,
    jobId: identity,
    approvedWorkItemId: identity,
    jobDefinitionHash: sha256,
    placementHash: sha256,
    kind: z.literal(PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_KIND),
    expectedOutputIdentity,
    operation: renderOperationSchema,
    authorizedAt: timestamp,
    reservationExpiresAt: timestamp,
    permissions: z.object({
      privateLocalLease: z.literal(true),
      oneUseInternalDispatch: z.literal(true),
      approvedPrivateSourceRead: z.literal(true),
      fixedStreamCopyRecipe: z.literal(true),
      createOnlyPrivateMediaPersistence: z.literal(true),
      providerCall: z.literal(false),
      googleCloudDispatch: z.literal(false),
      publicDelivery: z.literal(false),
    }).strict(),
    commercialBoundary: commercialBoundarySchema,
    receiptHash: sha256,
  }).strict()

export const professionalLongFormFirstObjectChunkQaAuthorizationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORIZATION_VERSION,
    ),
    source: z.literal(
      'server_persisted_professional_long_form_first_object_chunk_qa_authority',
    ),
    authorizationId: identity,
    authorityRef: jsonBlobRef,
    authorityHash: sha256,
    queueDefinitionHash: sha256,
    jobId: identity,
    approvedWorkItemId: identity,
    jobDefinitionHash: sha256,
    placementHash: sha256,
    kind: z.literal(PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_KIND),
    expectedOutputIdentity,
    operation: qaOperationSchema,
    authorizedAt: timestamp,
    reservationExpiresAt: timestamp,
    permissions: z.object({
      privateLocalLease: z.literal(true),
      oneUseInternalDispatch: z.literal(true),
      exactPrivateArtifactRead: z.literal(true),
      independentProbe: z.literal(true),
      privateQaPersistence: z.literal(true),
      providerCall: z.literal(false),
      googleCloudDispatch: z.literal(false),
      publicDelivery: z.literal(false),
    }).strict(),
    commercialBoundary: commercialBoundarySchema,
    receiptHash: sha256,
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
  deliveryAttempt: z.literal(1),
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}

export const professionalLongFormFirstObjectChunkRenderAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_ATTEMPT_VERSION,
  ),
  ...attemptCommon,
  operation: renderOperationSchema,
}).strict()

export const professionalLongFormFirstObjectChunkQaAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ATTEMPT_VERSION,
  ),
  ...attemptCommon,
  operation: qaOperationSchema,
}).strict()

const commonAuthorityFields = {
  identity: z.object(commonIdentityFields).strict(),
  approval: approvalSchema,
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
}

export const professionalLongFormFirstObjectChunkRenderAuthoritySchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORITY_VERSION,
    ),
    source: z.literal(
      'server_reopened_professional_long_form_first_object_chunk_render_authority',
    ),
    purpose: z.literal(
      'authorize_one_private_checksum_bound_first_object_chunk_stream_copy',
    ),
    status: z.literal(
      'first_object_chunk_render_authorized_independent_qa_required',
    ),
    ...commonAuthorityFields,
    approvedChunk: approvedChunkSchema,
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
      renderJobAuthorityHash: sha256,
      renderJobDefinitionHash: sha256,
      renderPlacementHash: sha256,
      dependencyCompletions: z.array(dependencyCompletionSchema).length(3),
      dependencySetHash: sha256,
    }).strict(),
    operation: renderOperationSchema.extend({
      workerType: z.literal('render_worker'),
      resourceClassId: z.literal('render_cpu_high_memory_v1'),
      maximumAttempts: z.literal(2),
      attemptTimeoutSeconds: z.literal(3_600),
      leaseDurationMilliseconds: z.literal(300_000),
      vcpuCount: z.literal(2),
      memoryGib: z.literal(4),
      gpuCount: z.literal(0),
    }).strict(),
    permissions: z.object({
      immutableDependencyCompletionsRequired: z.literal(true),
      approvedPrivateSourceRead: z.literal(true),
      exactSourceChecksumsRequired: z.literal(true),
      fixedHardCutStreamCopyRecipe: z.literal(true),
      decodeOrReencodeAllowed: z.literal(false),
      privateMediaArtifactCreateOnly: z.literal(true),
      independentQaRequiredBeforeDownstream: z.literal(true),
      furtherChildExecution: z.literal(false),
      providerCall: z.literal(false),
      googleCloudDispatch: z.literal(false),
      publicDelivery: z.literal(false),
    }).strict(),
  }).strict()

export const professionalLongFormFirstObjectChunkQaAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_reopened_professional_long_form_first_object_chunk_qa_authority',
  ),
  purpose: z.literal(
    'authorize_one_private_independent_probe_of_exact_first_object_chunk',
  ),
  status: z.literal('first_object_chunk_independent_qa_authorized'),
  ...commonAuthorityFields,
  approvedChunk: approvedChunkSchema,
  renderArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
  lineage: z.object({
    planningAuthorityHash: sha256,
    objectPlanAuthorityHash: sha256,
    queueDefinitionHash: sha256,
    qaJobAuthorityHash: sha256,
    qaJobDefinitionHash: sha256,
    qaPlacementHash: sha256,
    renderJobId: identity,
    renderApprovedWorkItemId: identity,
    renderQueueCompletionHash: sha256,
    renderCanonicalResultHash: sha256,
    renderAttemptInternalCostEvidenceHash: sha256,
    renderRuntimeEvidenceRef: jsonBlobRef,
    renderReconciliationEvidenceRef: jsonBlobRef,
    renderTerminalEvidenceRef: jsonBlobRef,
  }).strict(),
  operation: qaOperationSchema.extend({
    workerType: z.literal('qa_worker'),
    resourceClassId: z.literal('qa_cpu_standard_v1'),
    maximumAttempts: z.literal(2),
    attemptTimeoutSeconds: z.literal(900),
    leaseDurationMilliseconds: z.literal(120_000),
    vcpuCount: z.literal(2),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableRenderCompletionRequired: z.literal(true),
    exactPrivateArtifactRead: z.literal(true),
    independentFfprobe: z.literal(true),
    exactFrameColorDurationValidation: z.literal(true),
    mediaMutationAllowed: z.literal(false),
    privateQaArtifactCreateOnly: z.literal(true),
    furtherChildExecution: z.literal(false),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
}).strict()

export const professionalLongFormFirstObjectChunkRenderEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_first_object_chunk_ffmpeg_runner',
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
  operation: renderOperationSchema,
  requestEnvelopeSha256: sha256,
  sourceReadEvidenceHashes: z.array(sha256).min(2).max(8),
  sourceStagingEvidenceHashes: z.array(sha256).min(2).max(8),
  sourceSha256s: z.array(sha256).min(2).max(8),
  capacityEvidenceHash: sha256,
  outputArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
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
    approvedDependenciesReopened: z.literal('passed'),
    immutableSourceBytesVerified: z.literal('passed'),
    sourceOrderAndFrameRangesVerified: z.literal('passed'),
    fixedHardCutStreamCopyExecuted: z.literal('passed'),
    noDecodeOrReencode: z.literal('passed'),
    noAudioEmbedded: z.literal('passed'),
    exactPrivateCreateOnlyPersistence: z.literal('passed'),
    independentQaStillRequired: z.literal(true),
  }).strict(),
  completedAt: timestamp,
  artifactHash: sha256,
}).strict()

export const professionalLongFormFirstObjectChunkRenderReconciliationSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_RECONCILIATION_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_first_object_chunk_render_reconciliation',
    ),
    renderJobId: identity,
    renderApprovedWorkItemId: identity,
    executionAttemptId: identity,
    authorityHash: sha256,
    outputArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
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
      'private_render_artifact_ready_independent_qa_execution_not_yet_authorized',
    ),
    reconciledAt: timestamp,
    reconciliationHash: sha256,
  }).strict()

export const professionalLongFormFirstObjectChunkRenderTerminalSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_first_object_chunk_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: renderOperationSchema,
  outputArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
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

export const professionalLongFormFirstObjectChunkQaArtifactSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ARTIFACT_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_first_object_chunk_ffprobe_qa',
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
  operation: qaOperationSchema,
  renderArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
  rawProbeResultRef: jsonBlobRef,
  probeRuntimeEvidenceRef: jsonBlobRef,
  requestEnvelopeSha256: sha256,
  probeAttestationHash: sha256,
  observed: z.object({
    container: z.literal('matroska'),
    videoStreamCount: z.literal(1),
    audioStreamCount: z.literal(0),
    codecName: z.literal('h264'),
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
    exactPersistedArtifactReopened: z.literal('passed'),
    independentProbeExecuted: z.literal('passed'),
    exactFrameCountRateAndDuration: z.literal('passed'),
    exactOutputFrame: z.literal('passed'),
    exactH264PixelAndColorMetadata: z.literal('passed'),
    videoOnlyObjectChunk: z.literal('passed'),
    sourceAndTimelineLineage: z.literal('passed'),
  }).strict(),
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
  qaHash: sha256,
}).strict()

export const professionalLongFormFirstObjectChunkQaReconciliationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_first_object_chunk_qa_reconciliation',
  ),
  qaJobId: identity,
  qaApprovedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  renderArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
  qaArtifactRef: jsonBlobRef,
  downstream: z.array(z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    dependencyJobId: identity,
    thisDependencySatisfied: z.literal(true),
    everyRequiredDependencySatisfied: z.literal(false),
    executionAuthorized: z.literal(false),
  }).strict()).length(2),
  decision: z.literal(
    'first_chunk_qa_passed_remaining_chunks_audio_color_and_finalization_blocked',
  ),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormFirstObjectChunkQaTerminalSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_first_object_chunk_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: qaOperationSchema,
  renderArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
  qaArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  remainingPipelineExecutionAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormFirstObjectChunkRenderCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COMPLETION_VERSION,
  ),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: renderOperationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outputArtifact: professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
  runtimeEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export const professionalLongFormFirstObjectChunkQaCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COMPLETION_VERSION,
  ),
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

export type ProfessionalLongFormFirstObjectChunkRenderAuthorization = z.infer<
  typeof professionalLongFormFirstObjectChunkRenderAuthorizationSchema
>
export type ProfessionalLongFormFirstObjectChunkQaAuthorization = z.infer<
  typeof professionalLongFormFirstObjectChunkQaAuthorizationSchema
>
export type ProfessionalLongFormFirstObjectChunkRenderAttempt = z.infer<
  typeof professionalLongFormFirstObjectChunkRenderAttemptSchema
>
export type ProfessionalLongFormFirstObjectChunkQaAttempt = z.infer<
  typeof professionalLongFormFirstObjectChunkQaAttemptSchema
>
export type ProfessionalLongFormFirstObjectChunkRenderAuthority = z.infer<
  typeof professionalLongFormFirstObjectChunkRenderAuthoritySchema
>
export type ProfessionalLongFormFirstObjectChunkQaAuthority = z.infer<
  typeof professionalLongFormFirstObjectChunkQaAuthoritySchema
>
export type ProfessionalLongFormFirstObjectChunkMediaArtifactRef = z.infer<
  typeof professionalLongFormFirstObjectChunkMediaArtifactRefSchema
>
export type ProfessionalLongFormFirstObjectChunkRenderEvidence = z.infer<
  typeof professionalLongFormFirstObjectChunkRenderEvidenceSchema
>
export type ProfessionalLongFormFirstObjectChunkRenderReconciliation = z.infer<
  typeof professionalLongFormFirstObjectChunkRenderReconciliationSchema
>
export type ProfessionalLongFormFirstObjectChunkRenderTerminal = z.infer<
  typeof professionalLongFormFirstObjectChunkRenderTerminalSchema
>
export type ProfessionalLongFormFirstObjectChunkQaArtifact = z.infer<
  typeof professionalLongFormFirstObjectChunkQaArtifactSchema
>
export type ProfessionalLongFormFirstObjectChunkQaReconciliation = z.infer<
  typeof professionalLongFormFirstObjectChunkQaReconciliationSchema
>
export type ProfessionalLongFormFirstObjectChunkQaTerminal = z.infer<
  typeof professionalLongFormFirstObjectChunkQaTerminalSchema
>
export type ProfessionalLongFormFirstObjectChunkRenderCompletion = z.infer<
  typeof professionalLongFormFirstObjectChunkRenderCompletionSchema
>
export type ProfessionalLongFormFirstObjectChunkQaCompletion = z.infer<
  typeof professionalLongFormFirstObjectChunkQaCompletionSchema
>
