import { z } from 'zod'

import {
  professionalLongFormFirstObjectChunkMediaArtifactRefSchema,
} from './professional-long-form-first-object-chunk-execution-contract'

export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORITY_VERSION =
  'professional-long-form-cross-chunk-color-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORIZATION_VERSION =
  'professional-long-form-cross-chunk-color-authorization-v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_ATTEMPT_VERSION =
  'professional-long-form-cross-chunk-color-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_VALIDATION_VERSION =
  'professional-long-form-cross-chunk-color-validation-v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RECONCILIATION_VERSION =
  'professional-long-form-cross-chunk-color-reconciliation-v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_TERMINAL_VERSION =
  'professional-long-form-cross-chunk-color-terminal-v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COMPLETION_VERSION =
  'professional-long-form-cross-chunk-color-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND =
  'validate_cross_chunk_color_continuity' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_WORK_ITEM_ID =
  'long-form-validate-cross-chunk-color-continuity' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RUNNER_CLASS =
  'canonical_professional_long_form_cross_chunk_color_ffmpeg_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID =
  'ffmpeg_cross_chunk_color_continuity_cpu_2vcpu_4gib_v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const expectedOutputIdentity = z.string().trim().min(1).max(512)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const jsonBlobRef = z.object({
  sha256,
  byteLength: positiveInteger.max(2 * 1024 * 1024),
}).strict()

const operationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
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
  globalStartFrame: z.number().int().nonnegative().max(1_294_650),
  globalEndFrameExclusive: z.number().int().min(1_350).max(1_296_000),
  durationFrames: z.number().int().min(1_350).max(5_400),
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
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

const approvedBoundarySchema = z.object({
  boundaryId: identity,
  leftChunkIndex: z.number().int().min(1).max(123),
  rightChunkIndex: z.number().int().min(2).max(124),
  boundaryBefore: z.enum(['approved_hard_cut', 'continuous_technical_split']),
  expectedEvidenceIdentity: identity,
}).strict()

const approvedColorPlanSchema = z.object({
  colorAuthorityHash: sha256,
  continuityPolicyId: z.literal('bt709_adjacent_chunk_boundary_rgb_policy_v1'),
  recipeProfileId: z.literal('approved_cross_chunk_color_continuity_rgb_sample_v1'),
  sampleWindowFrames: z.literal(30),
  sampleFramesPerSide: z.literal(3),
  width: z.union([z.literal(2_160), z.literal(2_880), z.literal(3_840)]),
  height: z.union([z.literal(2_160), z.literal(2_700), z.literal(3_840)]),
  fps: z.literal(30),
  chunkCount: z.number().int().min(2).max(124),
  boundaryCount: z.number().int().min(1).max(123),
  chunks: z.array(approvedChunkSchema).min(2).max(124),
  boundaries: z.array(approvedBoundarySchema).min(1).max(123),
  sourcePolicy: z.literal('independently_qa_passed_private_vp9_bt709_chunks_v1'),
  technicalSplitMismatchDisposition: z.literal('block_finalization'),
  editorialCutMismatchDisposition: z.literal('review_required'),
  mediaMutationAllowed: z.literal(false),
  planHash: sha256,
}).strict()

export const professionalLongFormCrossChunkColorAuthoritySchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_reopened_professional_long_form_cross_chunk_color_authority',
  ),
  purpose: z.literal(
    'authorize_one_private_pairwise_cross_chunk_color_continuity_validation',
  ),
  status: z.literal('cross_chunk_color_authorized_all_chunk_qa_required'),
  identity: authorityIdentitySchema,
  approval: approvalSchema,
  approvedColorPlan: approvedColorPlanSchema,
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
    colorJobAuthorityHash: sha256,
    colorJobDefinitionHash: sha256,
    colorPlacementHash: sha256,
    dependencySetHash: sha256,
  }).strict(),
  operation: operationSchema.extend({
    workerType: z.literal('qa_worker'),
    resourceClassId: z.literal('qa_cpu_standard_v1'),
    maximumAttempts: z.literal(2),
    attemptTimeoutSeconds: z.literal(1_800),
    leaseDurationMilliseconds: z.literal(300_000),
    heartbeatIntervalMilliseconds: z.number().int().min(1_000).max(60_000),
    vcpuCount: z.literal(2),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
  }).strict(),
  permissions: z.object({
    immutableQaCompletionsRequired: z.literal(true),
    exactPrivateChunkRead: z.literal(true),
    pairwiseBoundedAnalysis: z.literal(true),
    independentProbeAndRgbSampling: z.literal(true),
    createOnlyBoundaryCheckpointPersistence: z.literal(true),
    mediaMutationAllowed: z.literal(false),
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

export const professionalLongFormCrossChunkColorAuthorizationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORIZATION_VERSION,
  ),
  source: z.literal(
    'server_persisted_professional_long_form_cross_chunk_color_authority',
  ),
  authorizationId: identity,
  authorityRef: jsonBlobRef,
  authorityHash: sha256,
  queueDefinitionHash: sha256,
  jobId: identity,
  approvedWorkItemId: identity,
  jobDefinitionHash: sha256,
  placementHash: sha256,
  kind: z.literal(PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_KIND),
  expectedOutputIdentity,
  operation: operationSchema,
  authorizedAt: timestamp,
  reservationExpiresAt: timestamp,
  permissions: z.object({
    privateLocalLease: z.literal(true),
    oneUseInternalDispatch: z.literal(true),
    exactQaPassedPrivateChunkRead: z.literal(true),
    fixedPairwiseColorAnalysis: z.literal(true),
    createOnlyBoundaryCheckpointPersistence: z.literal(true),
    providerCall: z.literal(false),
    googleCloudDispatch: z.literal(false),
    publicDelivery: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  receiptHash: sha256,
}).strict()

export const professionalLongFormCrossChunkColorAttemptSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_ATTEMPT_VERSION),
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

const boundaryResultSchema = z.object({
  boundaryId: identity,
  leftChunkIndex: z.number().int().min(1).max(123),
  rightChunkIndex: z.number().int().min(2).max(124),
  boundaryBefore: z.enum(['approved_hard_cut', 'continuous_technical_split']),
  leftChunkSha256: sha256,
  rightChunkSha256: sha256,
  requestEnvelopeSha256: sha256,
  runtimeResultSha256: sha256,
  resultDocumentRef: jsonBlobRef,
  attestationRecordId: sha256,
  attestationHash: sha256,
  confinementEvidenceHash: sha256,
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
}).strict()

export const professionalLongFormCrossChunkColorValidationArtifactSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_VALIDATION_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_cross_chunk_color_ffmpeg_runner',
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
    colorAuthorityHash: sha256,
    chunkCount: z.number().int().min(2).max(124),
    boundaryCount: z.number().int().min(1).max(123),
    boundaryResults: z.array(boundaryResultSchema).min(1).max(123),
    runtime: z.object({
      binaryVersion: z.literal('8.1.2'),
      imageIdentityHash: sha256,
      networkMode: z.literal('none'),
      containerExitCode: z.literal(0),
      oomKilled: z.literal(false),
    }).strict(),
    checks: z.object({
      everyChunkQaCompletionReopened: z.literal('passed'),
      everyPrivateChunkChecksumReopened: z.literal('passed'),
      everyAdjacentBoundaryEvaluatedExactlyOnce: z.literal('passed'),
      everyTechnicalContinuationWithinTolerance: z.literal('passed'),
      everyEditorialCutAcceptedOrWithinTolerance: z.literal('passed'),
      noMediaMutation: z.literal('passed'),
    }).strict(),
    outcome: z.literal('passed'),
    evaluatedAt: timestamp,
    validationHash: sha256,
  }).strict()

export const professionalLongFormCrossChunkColorReconciliationSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_RECONCILIATION_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_cross_chunk_color_reconciliation',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  downstreamFinalization: z.object({
    jobId: identity,
    approvedWorkItemId: identity,
    dependencyJobId: identity,
    thisDependencySatisfied: z.literal(true),
    everyRequiredDependencySatisfied: z.boolean(),
    executionAuthorized: z.literal(false),
  }).strict(),
  decision: z.literal(
    'cross_chunk_color_passed_finalization_requires_separate_authority',
  ),
  reconciledAt: timestamp,
  reconciliationHash: sha256,
}).strict()

export const professionalLongFormCrossChunkColorTerminalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_TERMINAL_VERSION),
  source: z.literal(
    'canonical_professional_long_form_cross_chunk_color_execution_service',
  ),
  jobId: identity,
  approvedWorkItemId: identity,
  executionAttemptId: identity,
  queueReceiptId: identity,
  authorityHash: sha256,
  operation: operationSchema,
  validationArtifactRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  remainingPipelineExecutionAuthorized: z.literal(false),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export const professionalLongFormCrossChunkColorCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COMPLETION_VERSION,
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

export type ProfessionalLongFormCrossChunkColorAuthority = z.infer<
  typeof professionalLongFormCrossChunkColorAuthoritySchema
>
export type ProfessionalLongFormCrossChunkColorAuthorization = z.infer<
  typeof professionalLongFormCrossChunkColorAuthorizationSchema
>
export type ProfessionalLongFormCrossChunkColorAttempt = z.infer<
  typeof professionalLongFormCrossChunkColorAttemptSchema
>
export type ProfessionalLongFormCrossChunkColorValidationArtifact = z.infer<
  typeof professionalLongFormCrossChunkColorValidationArtifactSchema
>
export type ProfessionalLongFormCrossChunkColorReconciliation = z.infer<
  typeof professionalLongFormCrossChunkColorReconciliationSchema
>
export type ProfessionalLongFormCrossChunkColorTerminal = z.infer<
  typeof professionalLongFormCrossChunkColorTerminalSchema
>
export type ProfessionalLongFormCrossChunkColorCompletion = z.infer<
  typeof professionalLongFormCrossChunkColorCompletionSchema
>
