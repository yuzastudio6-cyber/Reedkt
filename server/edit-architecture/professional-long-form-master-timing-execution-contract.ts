import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_AUTHORITY_VERSION =
  'professional-long-form-master-timing-execution-authority-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_AUTHORIZATION_RECEIPT_VERSION =
  'professional-long-form-master-timing-authorization-receipt-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_ATTEMPT_VERSION =
  'professional-long-form-master-timing-execution-attempt-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_VALIDATION_ARTIFACT_VERSION =
  'professional-long-form-master-timing-validation-artifact-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_QA_EVIDENCE_VERSION =
  'professional-long-form-master-timing-qa-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_RECONCILIATION_EVIDENCE_VERSION =
  'professional-long-form-master-timing-reconciliation-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_TERMINAL_EVIDENCE_VERSION =
  'professional-long-form-master-timing-terminal-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPLETION_VERSION =
  'professional-long-form-master-timing-completion-v1' as const

export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION =
  'canonical-professional-long-form-source-led-timing-components-v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID =
  'canonical_professional_long_form_source_led_no_generated_cues_v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND =
  'validate_master_timing' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID =
  'long-form-validate-master-timing' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID =
  'internal.validate_professional_long_form_master_timing_authority.v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_RUNNER_CLASS =
  'canonical_professional_long_form_master_timing_validation_runner_v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID =
  'reeditpro_long_form_master_timing_validation_cpu_2vcpu_4gib_v1' as const
export const PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY =
  'long-form-object-graph' as const

export const PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES = [
  'frame_confirmation',
  'timing_base',
  'source_timing',
  'final_timeline',
  'transcript_timing',
  'caption_readability',
  'visual_readability',
  'caption_visual_collision',
  'transition_safety',
  'beat_alignment',
  'sfx_justification',
  'music_ducking',
  'provider_clip_duration',
  'remotion_layer_timing',
  'tier_complexity',
  'credit_impact',
  'approval_gate',
  'worker_readiness',
] as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const expectedOutputIdentity = z.string().trim().min(1).max(512)
const boundedCount = z.number().int().nonnegative().max(100_000_000)
const positiveCount = z.number().int().positive().max(100_000_000)
const jsonBlobRef = z.object({
  sha256,
  byteLength: z.number().int().positive().max(4 * 1024 * 1024),
}).strict()

const rationalFrameRateSchema = z.object({
  numerator: z.number().int().positive().max(120_000),
  denominator: z.number().int().positive().max(120_000),
}).strict()

const exactOperationSchema = z.object({
  operationId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID),
  runnerClass: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_RUNNER_CLASS),
  attemptCostProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID,
  ),
}).strict()

const commercialBoundarySchema = z.object({
  internalProductionCostOnly: z.literal(true),
  customerPriceAuthorityIncluded: z.literal(false),
  customerCreditAuthorityIncluded: z.literal(false),
  serviceFeeAuthorityIncluded: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  billingAuthorized: z.literal(false),
}).strict()

const timingExecutionPermissionsSchema = z.object({
  privateLocalLease: z.literal(true),
  oneUseInternalDispatch: z.literal(true),
  structuredApprovedTimingValidation: z.literal(true),
  exactComponentHashValidation: z.literal(true),
  exactFrameTimelineValidation: z.literal(true),
  privateValidationArtifact: z.literal(true),
  privateQaAndReconciliation: z.literal(true),
  mediaByteRead: z.literal(false),
  transcriptAlignment: z.literal(false),
  beatDetection: z.literal(false),
  mediaDecodeOrTransform: z.literal(false),
  render: z.literal(false),
  providerCall: z.literal(false),
  googleCloudDispatch: z.literal(false),
  publicDelivery: z.literal(false),
}).strict()

export const canonicalProfessionalLongFormMasterTimingPlanSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
  ),
  profileId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID),
  status: z.literal('ready'),
  timingBase: z.object({
    fps: z.number().positive().max(240),
    frameRate: rationalFrameRateSchema,
    totalFrames: positiveCount,
    firstFrame: z.literal(0),
    endFrameExclusive: positiveCount,
    executionUnit: z.literal('frames'),
    displayUnit: z.literal('seconds'),
    frameRoundingMode: z.literal('exact_rational'),
  }).strict(),
  timeline: z.object({
    segmentCount: positiveCount,
    segmentSetHash: sha256,
    approvedHardCutCount: boundedCount,
    gapFreeRequired: z.literal(true),
    overlapFreeRequired: z.literal(true),
    fullDurationCoverageRequired: z.literal(true),
  }).strict(),
  sourceCleanup: z.object({
    confirmed: z.literal(true),
    sourceCleanupPlanHash: sha256,
    preserveMeaningRequired: z.literal(true),
  }).strict(),
  priorityHierarchy: z.tuple([
    z.literal('speech_clarity'),
    z.literal('story_meaning_emotion'),
    z.literal('visual_readability'),
    z.literal('music_beat_rhythm'),
    z.literal('motion_smoothness'),
    z.literal('platform_retention'),
    z.literal('decorative_effects'),
  ]),
  rendererPolicy: z.object({
    rendererUsesApprovedFramesOnly: z.literal(true),
    finalCanvasOwnedByReeditPro: z.literal(true),
    requiredAssetPlaceholdersAllowedInFinal: z.literal(false),
  }).strict(),
}).strict()

export const canonicalProfessionalLongFormCaptionVisualTimingPlanSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
    ),
    profileId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID),
    status: z.literal('synced'),
    captionItemCount: z.literal(0),
    visualCueCount: z.literal(0),
    collisionCount: z.literal(0),
    speechClarityPriority: z.literal(true),
    generatedCueTimingRequested: z.literal(false),
    noRandomCaptionsOrVisuals: z.literal(true),
  }).strict()

export const canonicalProfessionalLongFormSoundSyncTimingPlanSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
  ),
  profileId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID),
  status: z.literal('ready'),
  speechPriority: z.literal(true),
  transitionPolicy: z.literal('approved_hard_cuts_only'),
  approvedHardCutCount: boundedCount,
  musicPlanned: z.literal(false),
  sfxPlanned: z.literal(false),
  duckingPlanned: z.literal(false),
  beatGridMode: z.literal('not_requested'),
  realAudioAnalysisPerformed: z.literal(false),
}).strict()

const timingValidationCategorySchema = z.enum(
  PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES,
)

export const canonicalProfessionalLongFormTimingValidationPlanSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPONENT_PROFILE_VERSION,
  ),
  profileId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID),
  overallStatus: z.literal('passed'),
  approvalBlocked: z.literal(false),
  frameCoverageVerified: z.literal(true),
  categories: z.array(z.object({
    category: timingValidationCategorySchema,
    outcome: z.enum(['passed', 'passed_not_applicable']),
  }).strict()).length(PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES.length),
  timingComplexity: z.object({
    level: z.literal('simple'),
    approvedEstimateLineKey: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY,
    ),
    includedInApprovedEstimate: z.literal(true),
    lowerCostAlternativesRequired: z.literal(false),
  }).strict(),
  workerPolicy: z.object({
    approvedSnapshotOnly: z.literal(true),
    rawChatReinterpretationAllowed: z.literal(false),
    materialTimingChangeRequiresNewApproval: z.literal(true),
  }).strict(),
  limitations: z.object({
    structuredPlanValidationOnly: z.literal(true),
    transcriptAlignmentPerformed: z.literal(false),
    beatDetectionPerformed: z.literal(false),
    mediaInspectionPerformed: z.literal(false),
    renderPerformed: z.literal(false),
  }).strict(),
}).strict()

export const professionalLongFormMasterTimingAuthorizationReceiptSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_AUTHORIZATION_RECEIPT_VERSION,
    ),
    source: z.literal(
      'server_persisted_professional_long_form_master_timing_execution_authority',
    ),
    authorizationId: identity,
    authorityRef: jsonBlobRef,
    authorityHash: sha256,
    queueDefinitionHash: sha256,
    jobId: identity,
    approvedWorkItemId: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
    ),
    jobDefinitionHash: sha256,
    placementHash: sha256,
    kind: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND),
    expectedOutputIdentity,
    operation: exactOperationSchema,
    authorizedAt: timestamp,
    reservationExpiresAt: timestamp,
    permissions: timingExecutionPermissionsSchema,
    commercialBoundary: commercialBoundarySchema,
    receiptHash: sha256,
  }).strict()

export const professionalLongFormMasterTimingExecutionAttemptSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_ATTEMPT_VERSION,
  ),
  source: z.literal('private_canonical_package_work_queue_store'),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  jobId: identity,
  approvedWorkItemId: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
  ),
  claimId: identity,
  claimHash: sha256,
  workerIdentityHash: sha256,
  deliveryAttempt: z.literal(1),
  operation: exactOperationSchema,
  startedAt: timestamp,
  dispatchConsumed: z.literal(true),
  plaintextClaimCredentialPersisted: z.literal(false),
  attemptHash: sha256,
}).strict()

export const professionalLongFormMasterTimingCompletionSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPLETION_VERSION,
  ),
  executionAttemptId: identity,
  authorizationId: identity,
  authorityHash: sha256,
  operation: exactOperationSchema,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  terminalEvidenceRef: jsonBlobRef,
}).strict()

export const professionalLongFormMasterTimingExecutionAuthoritySchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_AUTHORITY_VERSION,
    ),
    source: z.literal(
      'server_reopened_canonical_professional_long_form_master_timing_authority',
    ),
    purpose: z.literal(
      'authorize_one_private_structured_master_timing_validation_child',
    ),
    status: z.literal(
      'master_timing_private_execution_authorized_media_children_blocked',
    ),
    identity: z.object({
      ownerUserId: identity,
      workspaceId: identity,
      projectId: identity,
      editSessionId: identity,
      approvedPlanId: identity,
      approvedPlanSnapshotId: identity,
      approvedPlanSnapshotHash: sha256,
      packageRecordId: identity,
      jobId: identity,
      approvedWorkItemId: z.literal(
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
      ),
      kind: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_KIND),
      expectedOutputIdentity,
    }).strict(),
    approval: z.object({
      approvedByUserId: identity,
      approvalRecordId: identity,
      approvedEstimateId: identity,
      creditReservationId: identity,
      reservationStatus: z.literal('reserved'),
      remainingReservedCredits: z.number().int().positive(),
      reservationExpiresAt: timestamp,
      snapshotApprovedAt: timestamp,
    }).strict(),
    lineage: z.object({
      planningAuthorityHash: sha256,
      planHash: sha256,
      estimateHash: sha256,
      workGraphHash: sha256,
      timingHash: sha256,
      bridgeAuthorityHash: sha256,
      bridgeRef: jsonBlobRef,
      childJobManifestHash: sha256,
      childJobManifestRef: jsonBlobRef,
      childPackageHash: sha256,
      childPackageRef: jsonBlobRef,
      childPlacementManifestHash: sha256,
      childPlacementManifestRef: jsonBlobRef,
      queueDefinitionHash: sha256,
      queueCreatedEventHash: sha256,
      masterTimingPlanHash: sha256,
      masterTimingPlanRef: jsonBlobRef,
      captionVisualCueTimingPlanHash: sha256,
      captionVisualCueTimingPlanRef: jsonBlobRef,
      soundSyncTransitionTimingPlanHash: sha256,
      soundSyncTransitionTimingPlanRef: jsonBlobRef,
      timingValidationPlanHash: sha256,
      timingValidationPlanRef: jsonBlobRef,
      timingSummaryHash: sha256,
      timingSummaryRef: jsonBlobRef,
      segmentSetHash: sha256,
      sourceCleanupPlanHash: sha256,
      timingEstimateCoverageHash: sha256,
      timingJobAuthorityHash: sha256,
      timingJobDefinitionHash: sha256,
      timingPlacementHash: sha256,
      rootJobId: identity,
      rootQueueCompletionHash: sha256,
      rootCanonicalResultHash: sha256,
      rootValidationArtifactRef: jsonBlobRef,
      rootQaEvidenceRef: jsonBlobRef,
      rootReconciliationEvidenceRef: jsonBlobRef,
      rootTerminalEvidenceRef: jsonBlobRef,
      rootAttemptInternalCostEvidenceHash: sha256,
      rootCompletionEventHash: sha256,
    }).strict(),
    operation: exactOperationSchema.extend({
      workerType: z.literal('qa_worker'),
      resourceClassId: z.literal('qa_cpu_standard_v1'),
      maximumAttempts: z.literal(1),
      attemptTimeoutSeconds: z.literal(900),
      leaseDurationMilliseconds: z.literal(60_000),
      vcpuCount: z.literal(2),
      memoryGib: z.literal(4),
      gpuCount: z.literal(0),
    }).strict(),
    permissions: timingExecutionPermissionsSchema.extend({
      immutableRootCompletionRequired: z.literal(true),
      exactApprovedTimingComponentsRequired: z.literal(true),
      timingComplexityEstimateCoverageRequired: z.literal(true),
      directDownstreamDependencyEvidence: z.literal(true),
      furtherChildExecution: z.literal(false),
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

const timingCoverageSchema = z.object({
  profileId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID),
  fps: z.number().positive().max(240),
  frameRate: rationalFrameRateSchema,
  totalFrames: positiveCount,
  segmentCount: positiveCount,
  approvedHardCutCount: boundedCount,
  validationCategoryCount: z.literal(
    PROFESSIONAL_LONG_FORM_TIMING_VALIDATION_CATEGORIES.length,
  ),
  timingEstimateLineKey: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY,
  ),
  timingEstimateCredits: boundedCount,
}).strict()

const timingValidationHashesSchema = z.object({
  timingComponentSetHash: sha256,
  segmentTimelineHash: sha256,
  timingPriorityHash: sha256,
  timingValidationCategoryHash: sha256,
  timingEstimateCoverageHash: sha256,
}).strict()

export const professionalLongFormMasterTimingValidationArtifactSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_VALIDATION_ARTIFACT_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_master_timing_validation_runner',
    ),
    identity: z.object({
      workspaceId: identity,
      projectId: identity,
      approvedPlanSnapshotId: identity,
      jobId: identity,
      approvedWorkItemId: z.literal(
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
      ),
      executionAttemptId: identity,
    }).strict(),
    executionAuthorityId: identity,
    authorityHash: sha256,
    approvedTimingHash: sha256,
    timingCoverage: timingCoverageSchema,
    hashes: timingValidationHashesSchema,
    validation: z.object({
      exactApprovedComponentRefs: z.literal(true),
      confirmedOutputFrameAndRationalRate: z.literal(true),
      cleanupConfirmationAndMeaningPreservation: z.literal(true),
      gapFreeOverlapFreeFullFrameCoverage: z.literal(true),
      speechFirstPriorityHierarchy: z.literal(true),
      captionVisualNoRandomCueBoundary: z.literal(true),
      approvedHardCutSoundSyncBoundary: z.literal(true),
      timingValidationApprovalGatePassed: z.literal(true),
      timingComplexityIncludedInApprovedEstimate: z.literal(true),
      approvedSnapshotOnlyWorkerPolicy: z.literal(true),
      structuredMetadataOnly: z.literal(true),
      mediaOrTranscriptAnalysisPerformed: z.literal(false),
      renderOrProviderExecutionPerformed: z.literal(false),
      customerCommercialAuthorityIncluded: z.literal(false),
    }).strict(),
    validatedAt: timestamp,
    artifactHash: sha256,
  }).strict()

export const professionalLongFormMasterTimingQaEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_QA_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_professional_long_form_master_timing_qa'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    jobId: identity,
    executionAttemptId: identity,
  }).strict(),
  executionAuthorityId: identity,
  authorityHash: sha256,
  validationArtifactRef: jsonBlobRef,
  validationArtifactHash: sha256,
  checks: z.object({
    schemaChecksumAndComponentRefs: z.literal('passed'),
    confirmedFrameAndExactRationalTimingBase: z.literal('passed'),
    cleanupSegmentsAndFullFrameCoverage: z.literal('passed'),
    speechCaptionVisualTransitionAudioPolicies: z.literal('passed'),
    approvalGateAndEstimateCoverage: z.literal('passed'),
    queueRootAttemptAndReservationBoundary: z.literal('passed'),
    noMediaRenderProviderOrCommercialAuthority: z.literal('passed'),
  }).strict(),
  outcome: z.literal('passed'),
  evaluatedAt: timestamp,
  qaHash: sha256,
}).strict()

const timingDownstreamKindSchema = z.enum([
  'render_object_mezzanine_chunk',
  'mix_continuous_program_audio',
  'finalize_private_4k_master',
])

export const professionalLongFormMasterTimingReconciliationEvidenceSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_RECONCILIATION_EVIDENCE_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_master_timing_dependency_reconciliation',
    ),
    identity: z.object({
      workspaceId: identity,
      projectId: identity,
      approvedPlanSnapshotId: identity,
      completedJobId: identity,
      completedWorkItemId: z.literal(
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
      ),
      executionAttemptId: identity,
    }).strict(),
    executionAuthorityId: identity,
    authorityHash: sha256,
    validationArtifactRef: jsonBlobRef,
    qaEvidenceRef: jsonBlobRef,
    qaOutcome: z.literal('passed'),
    directDownstream: z.array(z.object({
      jobId: identity,
      approvedWorkItemId: identity,
      kind: timingDownstreamKindSchema,
      dependencyJobIds: z.array(identity).min(1).max(128),
      timingDependencyJobId: identity,
      timingDependencySatisfiedByThisCompletion: z.literal(true),
      executionAuthorized: z.literal(false),
      capabilityBlocked: z.literal(true),
    }).strict()).min(1).max(128),
    summary: z.object({
      directDownstreamCount: z.number().int().positive().max(128),
      renderJobCount: boundedCount,
      continuousAudioJobCount: z.literal(1),
      finalizationJobCount: z.literal(1),
      remainingQueueJobCountAfterCompletion: boundedCount,
      allDirectDownstreamExecutionBlocked: z.literal(true),
      directDownstreamHash: sha256,
    }).strict(),
    decision: z.literal(
      'timing_dependency_evidence_ready_downstream_operation_and_other_dependencies_blocked',
    ),
    reconciledAt: timestamp,
    reconciliationHash: sha256,
  }).strict()

export const professionalLongFormMasterTimingTerminalEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_TERMINAL_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_master_timing_execution_service',
  ),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    approvedPlanSnapshotId: identity,
    jobId: identity,
    approvedWorkItemId: z.literal(
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
    ),
    executionAttemptId: identity,
  }).strict(),
  executionAuthorityId: identity,
  authorityHash: sha256,
  operation: exactOperationSchema,
  validationArtifactRef: jsonBlobRef,
  qaEvidenceRef: jsonBlobRef,
  reconciliationEvidenceRef: jsonBlobRef,
  canonicalResultHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  outcome: z.literal('completed_private_test'),
  permissions: z.object({
    timingDependencyEvidenceCreated: z.literal(true),
    downstreamExecutionAuthorized: z.literal(false),
    mediaExecutionAuthorized: z.literal(false),
    providerCallAuthorized: z.literal(false),
    renderAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
  }).strict(),
  commercialBoundary: commercialBoundarySchema,
  completedAt: timestamp,
  terminalHash: sha256,
}).strict()

export type CanonicalProfessionalLongFormMasterTimingPlan = z.infer<
  typeof canonicalProfessionalLongFormMasterTimingPlanSchema
>
export type CanonicalProfessionalLongFormCaptionVisualTimingPlan = z.infer<
  typeof canonicalProfessionalLongFormCaptionVisualTimingPlanSchema
>
export type CanonicalProfessionalLongFormSoundSyncTimingPlan = z.infer<
  typeof canonicalProfessionalLongFormSoundSyncTimingPlanSchema
>
export type CanonicalProfessionalLongFormTimingValidationPlan = z.infer<
  typeof canonicalProfessionalLongFormTimingValidationPlanSchema
>
export type ProfessionalLongFormMasterTimingExecutionAuthority = z.infer<
  typeof professionalLongFormMasterTimingExecutionAuthoritySchema
>
export type ProfessionalLongFormMasterTimingAuthorizationReceipt = z.infer<
  typeof professionalLongFormMasterTimingAuthorizationReceiptSchema
>
export type ProfessionalLongFormMasterTimingExecutionAttempt = z.infer<
  typeof professionalLongFormMasterTimingExecutionAttemptSchema
>
export type ProfessionalLongFormMasterTimingValidationArtifact = z.infer<
  typeof professionalLongFormMasterTimingValidationArtifactSchema
>
export type ProfessionalLongFormMasterTimingQaEvidence = z.infer<
  typeof professionalLongFormMasterTimingQaEvidenceSchema
>
export type ProfessionalLongFormMasterTimingReconciliationEvidence = z.infer<
  typeof professionalLongFormMasterTimingReconciliationEvidenceSchema
>
export type ProfessionalLongFormMasterTimingTerminalEvidence = z.infer<
  typeof professionalLongFormMasterTimingTerminalEvidenceSchema
>
