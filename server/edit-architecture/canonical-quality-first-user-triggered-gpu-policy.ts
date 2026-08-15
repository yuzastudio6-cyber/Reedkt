import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_QUALITY_FIRST_USER_TRIGGERED_GPU_POLICY_VERSION =
  'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v4' as const
export const WEEDITPRO_QUALITY_FIRST_SHORT_EDIT_TARGET_VERSION =
  'weeditpro-quality-first-short-edit-target-v2' as const

export const CANONICAL_QUALITY_FIRST_GPU_REGIONS = [
  'us-central1',
  'europe-west4',
] as const

export type CanonicalQualityFirstGpuRegion =
  (typeof CANONICAL_QUALITY_FIRST_GPU_REGIONS)[number]

export const CANONICAL_QUALITY_FIRST_HEAVY_STAGE_IDS = [
  'speech_audio_and_instruction_understanding',
  'private_model_inference_and_asset_generation',
  'sam3_1_temporal_segmentation_and_tracking',
] as const

export const CANONICAL_QUALITY_FIRST_STANDARD_GPU_STAGE_IDS = [
  'source_decode_and_analysis_proxy',
  'approved_media_audio_caption_color_execution',
  'remotion_composition_and_gpu_encode',
  'deterministic_media_qa_and_repair',
] as const

export type CanonicalQualityFirstHeavyStageId =
  (typeof CANONICAL_QUALITY_FIRST_HEAVY_STAGE_IDS)[number]

export type CanonicalQualityFirstStandardGpuStageId =
  (typeof CANONICAL_QUALITY_FIRST_STANDARD_GPU_STAGE_IDS)[number]

export const CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS = [
  'quality_a100_80gb_user_triggered_heavy_job_v1',
  'quality_l4_user_triggered_heavy_fallback_job_v1',
  'quality_l4_user_triggered_standard_media_job_v1',
] as const

export const CANONICAL_QUALITY_FIRST_MODEL_COST_PROFILE_IDS = [
  'sam3_1_multiplex_video_segmentation_v1',
  'faster_whisper_large_v3_source_transcription_v2',
  'stable_audio_3_small_sfx_generation_v1',
  'birefnet_foreground_extraction_v1',
  'real_esrgan_enhancement_v1',
  'film_frame_interpolation_v1',
  'comfyui_controlled_image_v1',
  'source_video_lossless_provider_input_sharding_v1',
  'l4_standard_media_render_and_qa_v1',
] as const

const HEAVY_MODEL_COST_PROFILE_IDS = [
  'sam3_1_multiplex_video_segmentation_v1',
  'faster_whisper_large_v3_source_transcription_v2',
  'stable_audio_3_small_sfx_generation_v1',
  'comfyui_controlled_image_v1',
] as const

const PROFILE_IDS = CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS
const MODEL_COST_PROFILE_IDS = CANONICAL_QUALITY_FIRST_MODEL_COST_PROFILE_IDS

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeText = z.string().trim().min(1).max(1_000)

const acceleratorProfileSchema = z.object({
  profileId: z.enum(PROFILE_IDS),
  routeRole: z.enum([
    'heavy_primary',
    'heavy_fallback',
    'standard_primary',
  ]),
  executionTarget: z.enum([
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  gpuCount: z.literal(1),
  gpuMemoryGiB: z.union([z.literal(80), z.literal(24)]),
  minimumVcpu: z.union([z.literal(12), z.literal(8)]),
  minimumMemoryGiB: z.union([z.literal(170), z.literal(32)]),
  localScratchGiB: z.union([z.literal(375), z.literal(0)]),
  runtimeKind: z.enum(['dedicated_prediction_endpoint', 'job']),
  minimumIdleInstances: z.literal(0),
  maximumRequestConcurrencyPerInstance: z.literal(1),
  startsOnlyForApprovedWork: z.literal(true),
  lifecycleMode: z.enum([
    'idle_scaledown_to_zero',
    'terminal_attempt_teardown',
  ]),
  stopsAfterTerminalAttempt: z.boolean(),
  returnsToZeroAfterIdle: z.literal(true),
  idleScaleDownSeconds: z.union([z.literal(300), z.literal(0)]),
  immutableImageDigestRequired: z.literal(true),
  exactCudaRuntimeRequired: z.literal(true),
  exactModelOrBinaryManifestRequired: z.literal(true),
  runtimeNetworkDownloadAllowed: z.literal(false),
  cpuOnlyHeavyFallbackAllowed: z.literal(false),
  qualityReducingFallbackAllowed: z.literal(false),
  productionQualified: z.literal(false),
}).strict().superRefine((profile, context) => {
  const a100 = profile.profileId === PROFILE_IDS[0]
  const exact = a100
    ? profile.executionTarget ===
        'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
      && profile.routeRole === 'heavy_primary'
      && profile.machineType === 'a2-ultragpu-1g'
      && profile.accelerator === 'nvidia_a100_80gb'
      && profile.gpuMemoryGiB === 80
      && profile.minimumVcpu === 12
      && profile.minimumMemoryGiB === 170
      && profile.localScratchGiB === 0
      && profile.runtimeKind === 'dedicated_prediction_endpoint'
      && profile.lifecycleMode === 'idle_scaledown_to_zero'
      && !profile.stopsAfterTerminalAttempt
      && profile.idleScaleDownSeconds === 300
    : profile.executionTarget === 'google_cloud_run_l4_job'
      && profile.routeRole === (
        profile.profileId === PROFILE_IDS[1]
          ? 'heavy_fallback'
          : 'standard_primary'
      )
      && profile.machineType === 'cloud_run_nvidia_l4'
      && profile.accelerator === 'nvidia_l4'
      && profile.gpuMemoryGiB === 24
      && profile.minimumVcpu === 8
      && profile.minimumMemoryGiB === 32
      && profile.localScratchGiB === 0
      && profile.runtimeKind === 'job'
      && profile.lifecycleMode === 'terminal_attempt_teardown'
      && profile.stopsAfterTerminalAttempt
      && profile.idleScaleDownSeconds === 0
  if (!exact) {
    context.addIssue({
      code: 'custom',
      message: 'Quality-first accelerator profile lost its exact GPU route.',
    })
  }
})

const heavyStageSchema = z.object({
  stageId: z.enum(CANONICAL_QUALITY_FIRST_HEAVY_STAGE_IDS),
  primaryProfileId: z.literal(PROFILE_IDS[0]),
  fallbackProfileId: z.literal(PROFILE_IDS[1]),
  cpuOnlyExecutionAllowed: z.literal(false),
  fallbackRequiresClassifiedPrimaryFailure: z.literal(true),
  fallbackMayReduceResolution: z.literal(false),
  fallbackMayQuantizeModel: z.literal(false),
  fallbackMaySkipQa: z.literal(false),
  exactApprovedSnapshotRequired: z.literal(true),
  exactWorkItemAndIdempotencyKeyRequired: z.literal(true),
  exactPerAttemptCostEvidenceRequired: z.literal(true),
}).strict()

const standardGpuStageSchema = z.object({
  stageId: z.enum(CANONICAL_QUALITY_FIRST_STANDARD_GPU_STAGE_IDS),
  primaryProfileId: z.literal(PROFILE_IDS[2]),
  fallbackProfileId: z.null(),
  cpuOnlyExecutionAllowed: z.literal(false),
  gpuKernelOrHardwareCodecEvidenceRequiredForMediaWork: z.literal(true),
  cpuHelperUseLimitedToIoContainerMetadataAndControl: z.literal(true),
  exactApprovedSnapshotRequired: z.literal(true),
  exactWorkItemAndIdempotencyKeyRequired: z.literal(true),
  exactPerAttemptCostEvidenceRequired: z.literal(true),
}).strict()

const modelCostProfileSchema = z.object({
  profileId: z.enum(MODEL_COST_PROFILE_IDS),
  routeClass: z.enum([
    'a100_primary_l4_classified_fallback',
    'l4_standard_primary_only',
  ]),
  meterClass: z.literal('user_triggered_scale_to_zero_gpu_attempt_wall_time_v1'),
  primaryProfileId: z.enum([PROFILE_IDS[0], PROFILE_IDS[2]]),
  fallbackProfileId: z.literal(PROFILE_IDS[1]).nullable(),
  estimateBeforeApprovalRequired: z.literal(true),
  exactModelOrToolIdentityRequired: z.literal(true),
  coldStartAndModelLoadIncludedInEstimate: z.literal(true),
  activeRuntimeIncludedInEstimate: z.literal(true),
  scratchStorageIncludedInEstimate: z.literal(true),
  privateObjectReadWriteIncludedInEstimate: z.literal(true),
  networkEgressIncludedWhenApplicable: z.literal(true),
  failedAndUnknownAttemptCostRecorded: z.literal(true),
  reeditproSystemFailureChargedToUser: z.literal(false),
  unapprovedOverageChargedToUser: z.literal(false),
  serviceFeeIncludedInToolCost: z.literal(false),
  exactCloudRateSnapshotRequired: z.literal(true),
  exactAttemptUsageRereadRequired: z.literal(true),
}).strict().superRefine((profile, context) => {
  const heavy = profile.routeClass ===
    'a100_primary_l4_classified_fallback'
  if (
    (heavy && (
      profile.primaryProfileId !== PROFILE_IDS[0]
      || profile.fallbackProfileId !== PROFILE_IDS[1]
    ))
    || (!heavy && (
      profile.primaryProfileId !== PROFILE_IDS[2]
      || profile.fallbackProfileId !== null
    ))
  ) context.addIssue({
    code: 'custom',
    message: 'GPU cost profile lost its exact heavy or standard route.',
  })
})

const policyWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_QUALITY_FIRST_USER_TRIGGERED_GPU_POLICY_VERSION,
  ),
  source: z.literal(
    'canonical_backend_quality_first_user_triggered_gpu_policy',
  ),
  serviceClass: z.literal('quality_first_user_triggered_scale_to_zero_gpu'),
  migration: z.object({
    supersedesPolicyVersion: z.literal(
      'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v3',
    ),
    priorVertexCustomJobPolicyRemainsHistoricalReadable: z.literal(true),
    priorVertexCustomJobPolicyMayAuthorizeNewPlan: z.literal(false),
    priorBatchA100PolicyRemainsHistoricalReadable: z.literal(true),
    priorBatchA100PolicyMayAuthorizeNewPlan: z.literal(false),
    priorL4PrimaryPolicyRemainsHistoricalReadable: z.literal(true),
    priorL4PrimaryPolicyMayAuthorizeNewPlan: z.literal(false),
    a100IsPrimaryForHeavyProcessing: z.literal(true),
    l4IsClassifiedFallbackForHeavyProcessing: z.literal(true),
    l4IsPrimaryForNormalMediaRenderAndQa: z.literal(true),
    lightweightControlPlaneRemainsNonGpu: z.literal(true),
    cpuOnlyHeavyExecutionAllowed: z.literal(false),
    existingApprovedSnapshotMayBeRewritten: z.literal(false),
    newPlanEstimateApprovalSnapshotRequired: z.literal(true),
  }).strict(),
  workloadBoundary: z.object({
    gpuRequiredWorkerClasses: z.tuple([
      z.literal('cpu_analysis_worker'),
      z.literal('gpu_ai_worker'),
      z.literal('render_worker'),
      z.literal('qa_worker'),
    ]),
    lightweightWorkerClasses: z.tuple([
      z.literal('api_service'),
      z.literal('tool_readiness_worker'),
    ]),
    externalProviderExecutionRemainsProviderOwned: z.literal(true),
    lightweightControlPlaneMayAuthenticateValidateHashQueueAndPersist:
      z.literal(true),
    lightweightControlPlaneMayDecodeTransformRenderOrRunModels:
      z.literal(false),
    gpuJobCpuMayOnlyOrchestrateIoMetadataAndGpuAdjacentHelpers:
      z.literal(true),
    gpuJobCpuMayBecomeAHeavyFallbackLane: z.literal(false),
    helperCpuUseMayBeReportedAsGpuExecution: z.literal(false),
    cpuOnlyMediaOrModelAttemptMayBeAdmittedOnGpuHost: z.literal(false),
    standardGpuMediaAttemptMustProveCudaNvencNvdecOrGpuKernelUse:
      z.literal(true),
    everyHeavyOperationMustDeclareOneCostProfile: z.literal(true),
    everyStandardGpuOperationMustDeclareOneCostProfile: z.literal(true),
  }).strict(),
  userTriggeredScaleToZeroLifecycle: z.object({
    explicitUserEditTriggerRequired: z.literal(true),
    approvedPlanAndWorkTriggerRequired: z.literal(true),
    fundedCreditReservationRequiredBeforeStart: z.literal(true),
    noApprovedWorkMeansNoGpuInstance: z.literal(true),
    newApprovedUserWorkCreatesBoundedGpuAttempt: z.literal(true),
    speculativeBackgroundGpuStartupAllowed: z.literal(false),
    scheduledPrewarmingAllowed: z.literal(false),
    periodicKeepaliveAllowed: z.literal(false),
    concurrentUserAttemptsMayShareGpuInstance: z.literal(false),
    sequentialWarmReuseRequiresStatelessIsolation: z.literal(true),
    minimumIdleA100ReplicaCount: z.literal(0),
    minimumIdleL4JobCount: z.literal(0),
    warmAlwaysOnGpuPoolAllowed: z.literal(false),
    coldStartExpected: z.literal(true),
    coldStartIsMeasuredBillableAttemptTime: z.literal(true),
    modelLoadIsMeasuredBillableAttemptTime: z.literal(true),
    endpointReturnsToZeroAfterBoundedIdleOrJobStopsAtTerminal:
      z.literal(true),
    idleGpuBillingAllowed: z.literal(false),
    maximumEndpointIdleScaleDownSeconds: z.literal(300),
    maximumJobPostTerminalShutdownGraceSeconds: z.literal(0),
    jobTimeModelDownloadAllowed: z.literal(false),
    exactPrebuiltImageAndPrivateModelArtifactRequired: z.literal(true),
  }).strict(),
  target: z.object({
      schemaVersion: z.literal(
      WEEDITPRO_QUALITY_FIRST_SHORT_EDIT_TARGET_VERSION,
    ),
    rawFootageCeilingSeconds: z.literal(480),
    maximumUserTriggeredEndToEndSecondsIncludingColdStart: z.literal(480),
    approvedTriggerToTerminalResultMeasured: z.literal(true),
    coldStartAndModelLoadIncludedInEndToEndTarget: z.literal(true),
    coldStartReportedSeparatelyFromActiveCompute: z.literal(true),
    qualificationPercentile: z.literal('p95'),
    minimumRepresentativeBenchmarkRunsPerRoute: z.literal(30),
    fiveHourEightMinuteEditFailsQualification: z.literal(true),
    qualityGatesMayBeSkippedForSpeed: z.literal(false),
    targetIsQualificationObjectiveNotGuarantee: z.literal(true),
  }).strict(),
  regionalPlacement: z.object({
    approvedPrivateDataLocalRuntimeRegions: z.tuple([
      z.literal('us-central1'),
      z.literal('europe-west4'),
    ]),
    vertexA100Region: z.literal('us-central1'),
    vertexDedicatedEndpointParent: z.literal(
      'projects/reeditpro/locations/us-central1',
    ),
    directComputeOrBatchA100MayAuthorizeNewWork: z.literal(false),
    l4FallbackUsesSameRegionAsPrimary: z.literal(true),
    l4StandardUsesPrivateDataLocalRegion: z.literal(true),
    sourceLifecycleArtifactAndWorkerRegionMustMatch: z.literal(true),
    crossRegionPrivateMediaTransferAllowed: z.literal(false),
    serverOwnedBucketAndGpuAvailabilityRereadRequired: z.literal(true),
    callerSelectedRegionOrAcceleratorAllowed: z.literal(false),
  }).strict(),
  acceleratorProfiles: z.array(acceleratorProfileSchema)
    .length(PROFILE_IDS.length),
  heavyStages: z.array(heavyStageSchema)
    .length(CANONICAL_QUALITY_FIRST_HEAVY_STAGE_IDS.length),
  standardGpuStages: z.array(standardGpuStageSchema)
    .length(CANONICAL_QUALITY_FIRST_STANDARD_GPU_STAGE_IDS.length),
  fallbackAdmission: z.object({
    allowedPrimaryFailureClasses: z.tuple([
      z.literal('a100_capacity_unavailable_before_attempt_start'),
      z.literal('a100_job_boot_failed_before_private_media_read'),
      z.literal('a100_runtime_qualification_blocked_before_dispatch'),
      z.literal('a100_driver_or_cuda_incompatible_before_model_load'),
    ]),
    costOptimizationAloneMayTriggerFallback: z.literal(false),
    unknownPrimaryOutcomeMayTriggerFallback: z.literal(false),
    primaryProviderOrModelOutcomeMayBeRetriedOnFallback: z.literal(false),
    priorAttemptTerminalReceiptRequired: z.literal(true),
    priorAttemptCostEvidenceRequired: z.literal(true),
    sameOperationModelSettingsInputAndOutputQualityRequired: z.literal(true),
    newFallbackAttemptIdAndLeaseRequired: z.literal(true),
    fallbackStillMustMeetQualityAndQaContract: z.literal(true),
  }).strict(),
  creditAndCost: z.object({
    creditPolicyVersion: z.literal('rp-creditpolicy-01'),
    usdPerCreditMicros: z.literal(100_000),
    toolCostReportsInternalInfrastructureOnly: z.literal(true),
    reeditproServiceFeeComputedBySettlementOwner: z.literal(true),
    estimateBeforeExpensiveExecutionRequired: z.literal(true),
    fundedReservationBeforeJobCreationRequired: z.literal(true),
    perModelOrHeavyOperationEstimateLineRequired: z.literal(true),
    perStandardGpuOperationEstimateLineRequired: z.literal(true),
    primaryAndFallbackRateSnapshotsMustBeDistinct: z.literal(true),
    exactCloudSkuRegionCurrencyTierAndCurrentAccountPriceRequired:
      z.literal(true),
    billableColdStartActiveRuntimeAndShutdownMeasured: z.literal(true),
    failedAndUnknownAttemptInfrastructureCostRetained: z.literal(true),
    reeditproFailureRefundOrReleaseRequired: z.literal(true),
    providerVarianceWithoutApprovalAbsorbedByReeditpro: z.literal(true),
    unapprovedOverageAbsorbedByReeditpro: z.literal(true),
    projectedOverageRequiresReestimateBeforeAdditionalWork: z.literal(true),
    walletOrLedgerMutationOwnedHere: z.literal(false),
  }).strict(),
  modelCostProfiles: z.array(modelCostProfileSchema)
    .length(MODEL_COST_PROFILE_IDS.length),
  quality: z.object({
    completeSourceTimelineUnderstandingRequiredBeforeCleanup: z.literal(true),
    embeddedEditorInstructionResolutionRequired: z.literal(true),
    timeOrDurationOnlyCutDecisionAllowed: z.literal(false),
    meaningPreservationRequired: z.literal(true),
    fallbackMayChangeApprovedMeaningOrScope: z.literal(false),
    deterministicVisualAudioQaRequired: z.literal(true),
    postrenderVisualQaRequired: z.literal(true),
    completeTimelineProfessionalReviewRequired: z.literal(true),
    repairCreatesNewArtifactVersionAndReinspection: z.literal(true),
  }).strict(),
  remainingGates: z.tuple([
    z.literal(
      'authenticated_account_effective_cloud_price_live_reread_and_credit_estimate_bridge',
    ),
    z.literal(
      'a100_80gb_vertex_dedicated_endpoint_identity_quota_image_and_runtime_qualification',
    ),
    z.literal('l4_cloud_run_fallback_identity_quota_image_and_runtime_qualification'),
    z.literal('l4_standard_media_render_qa_identity_image_and_gpu_kernel_qualification'),
    z.literal('same_region_private_object_transport_for_both_gpu_routes'),
    z.literal('durable_attempt_usage_cost_and_terminal_outcome_store'),
    z.literal('heavy_operation_registry_and_dispatch_migration'),
    z.literal('sam3_1_gated_checkpoint_access_license_ingest_and_hash'),
    z.literal('sam3_1_a100_and_l4_quality_performance_qualification'),
    z.literal('thirty_run_eight_minute_p95_end_to_end_benchmark'),
    z.literal('observability_kill_switch_capacity_and_rollback'),
  ]),
  authority: z.object({
    sourcePolicyOnly: z.literal(true),
    cloudResourceCreated: z.literal(false),
    imageBuiltOrPushed: z.literal(false),
    workerDeployed: z.literal(false),
    gpuRuntimeExecuted: z.literal(false),
    modelArtifactIngested: z.literal(false),
    costRateApproved: z.literal(false),
    customerChargeCreated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((policy, context) => {
  const profileIds = policy.acceleratorProfiles.map((profile) =>
    profile.profileId)
  const stageIds = policy.heavyStages.map((stage) => stage.stageId)
  const standardStageIds = policy.standardGpuStages.map((stage) =>
    stage.stageId)
  const modelCostProfileIds = policy.modelCostProfiles.map((profile) =>
    profile.profileId)
  if (
    stableAuthorityStringify(profileIds) !==
      stableAuthorityStringify(PROFILE_IDS)
    || stableAuthorityStringify(stageIds) !==
      stableAuthorityStringify(CANONICAL_QUALITY_FIRST_HEAVY_STAGE_IDS)
    || stableAuthorityStringify(standardStageIds) !==
      stableAuthorityStringify(
        CANONICAL_QUALITY_FIRST_STANDARD_GPU_STAGE_IDS,
      )
    || stableAuthorityStringify(modelCostProfileIds) !==
      stableAuthorityStringify(MODEL_COST_PROFILE_IDS)
    || new Set(profileIds).size !== profileIds.length
    || new Set(stageIds).size !== stageIds.length
    || new Set(standardStageIds).size !== standardStageIds.length
    || new Set(modelCostProfileIds).size !== modelCostProfileIds.length
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Quality-first policy lost its exact profiles or coverage.',
    })
  }
})

export const canonicalQualityFirstUserTriggeredGpuPolicySchema =
  policyWithoutHashSchema.extend({ policyHash: sha256 }).strict()

export type CanonicalQualityFirstUserTriggeredGpuPolicy = z.infer<
  typeof canonicalQualityFirstUserTriggeredGpuPolicySchema
>

export function createCanonicalQualityFirstUserTriggeredGpuPolicy():
CanonicalQualityFirstUserTriggeredGpuPolicy {
  const payload = policyWithoutHashSchema.parse({
    schemaVersion: CANONICAL_QUALITY_FIRST_USER_TRIGGERED_GPU_POLICY_VERSION,
    source: 'canonical_backend_quality_first_user_triggered_gpu_policy',
    serviceClass: 'quality_first_user_triggered_scale_to_zero_gpu',
    migration: {
      supersedesPolicyVersion:
        'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v3',
      priorVertexCustomJobPolicyRemainsHistoricalReadable: true,
      priorVertexCustomJobPolicyMayAuthorizeNewPlan: false,
      priorBatchA100PolicyRemainsHistoricalReadable: true,
      priorBatchA100PolicyMayAuthorizeNewPlan: false,
      priorL4PrimaryPolicyRemainsHistoricalReadable: true,
      priorL4PrimaryPolicyMayAuthorizeNewPlan: false,
      a100IsPrimaryForHeavyProcessing: true,
      l4IsClassifiedFallbackForHeavyProcessing: true,
      l4IsPrimaryForNormalMediaRenderAndQa: true,
      lightweightControlPlaneRemainsNonGpu: true,
      cpuOnlyHeavyExecutionAllowed: false,
      existingApprovedSnapshotMayBeRewritten: false,
      newPlanEstimateApprovalSnapshotRequired: true,
    },
    workloadBoundary: {
      gpuRequiredWorkerClasses: [
        'cpu_analysis_worker',
        'gpu_ai_worker',
        'render_worker',
        'qa_worker',
      ],
      lightweightWorkerClasses: [
        'api_service',
        'tool_readiness_worker',
      ],
      externalProviderExecutionRemainsProviderOwned: true,
      lightweightControlPlaneMayAuthenticateValidateHashQueueAndPersist: true,
      lightweightControlPlaneMayDecodeTransformRenderOrRunModels: false,
      gpuJobCpuMayOnlyOrchestrateIoMetadataAndGpuAdjacentHelpers: true,
      gpuJobCpuMayBecomeAHeavyFallbackLane: false,
      helperCpuUseMayBeReportedAsGpuExecution: false,
      cpuOnlyMediaOrModelAttemptMayBeAdmittedOnGpuHost: false,
      standardGpuMediaAttemptMustProveCudaNvencNvdecOrGpuKernelUse: true,
      everyHeavyOperationMustDeclareOneCostProfile: true,
      everyStandardGpuOperationMustDeclareOneCostProfile: true,
    },
    userTriggeredScaleToZeroLifecycle: {
      explicitUserEditTriggerRequired: true,
      approvedPlanAndWorkTriggerRequired: true,
      fundedCreditReservationRequiredBeforeStart: true,
      noApprovedWorkMeansNoGpuInstance: true,
      newApprovedUserWorkCreatesBoundedGpuAttempt: true,
      speculativeBackgroundGpuStartupAllowed: false,
      scheduledPrewarmingAllowed: false,
      periodicKeepaliveAllowed: false,
      concurrentUserAttemptsMayShareGpuInstance: false,
      sequentialWarmReuseRequiresStatelessIsolation: true,
      minimumIdleA100ReplicaCount: 0,
      minimumIdleL4JobCount: 0,
      warmAlwaysOnGpuPoolAllowed: false,
      coldStartExpected: true,
      coldStartIsMeasuredBillableAttemptTime: true,
      modelLoadIsMeasuredBillableAttemptTime: true,
      endpointReturnsToZeroAfterBoundedIdleOrJobStopsAtTerminal: true,
      idleGpuBillingAllowed: false,
      maximumEndpointIdleScaleDownSeconds: 300,
      maximumJobPostTerminalShutdownGraceSeconds: 0,
      jobTimeModelDownloadAllowed: false,
      exactPrebuiltImageAndPrivateModelArtifactRequired: true,
    },
    target: {
      schemaVersion: WEEDITPRO_QUALITY_FIRST_SHORT_EDIT_TARGET_VERSION,
      rawFootageCeilingSeconds: 480,
      maximumUserTriggeredEndToEndSecondsIncludingColdStart: 480,
      approvedTriggerToTerminalResultMeasured: true,
      coldStartAndModelLoadIncludedInEndToEndTarget: true,
      coldStartReportedSeparatelyFromActiveCompute: true,
      qualificationPercentile: 'p95',
      minimumRepresentativeBenchmarkRunsPerRoute: 30,
      fiveHourEightMinuteEditFailsQualification: true,
      qualityGatesMayBeSkippedForSpeed: false,
      targetIsQualificationObjectiveNotGuarantee: true,
    },
    regionalPlacement: {
      approvedPrivateDataLocalRuntimeRegions:
        CANONICAL_QUALITY_FIRST_GPU_REGIONS,
      vertexA100Region: 'us-central1',
      vertexDedicatedEndpointParent:
        'projects/reeditpro/locations/us-central1',
      directComputeOrBatchA100MayAuthorizeNewWork: false,
      l4FallbackUsesSameRegionAsPrimary: true,
      l4StandardUsesPrivateDataLocalRegion: true,
      sourceLifecycleArtifactAndWorkerRegionMustMatch: true,
      crossRegionPrivateMediaTransferAllowed: false,
      serverOwnedBucketAndGpuAvailabilityRereadRequired: true,
      callerSelectedRegionOrAcceleratorAllowed: false,
    },
    acceleratorProfiles: [
      acceleratorProfile({
        profileId: PROFILE_IDS[0],
        routeRole: 'heavy_primary',
        executionTarget:
          'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
        machineType: 'a2-ultragpu-1g',
        accelerator: 'nvidia_a100_80gb',
        gpuMemoryGiB: 80,
        minimumVcpu: 12,
        minimumMemoryGiB: 170,
        localScratchGiB: 0,
      }),
      acceleratorProfile({
        profileId: PROFILE_IDS[1],
        routeRole: 'heavy_fallback',
        executionTarget: 'google_cloud_run_l4_job',
        machineType: 'cloud_run_nvidia_l4',
        accelerator: 'nvidia_l4',
        gpuMemoryGiB: 24,
        minimumVcpu: 8,
        minimumMemoryGiB: 32,
        localScratchGiB: 0,
      }),
      acceleratorProfile({
        profileId: PROFILE_IDS[2],
        routeRole: 'standard_primary',
        executionTarget: 'google_cloud_run_l4_job',
        machineType: 'cloud_run_nvidia_l4',
        accelerator: 'nvidia_l4',
        gpuMemoryGiB: 24,
        minimumVcpu: 8,
        minimumMemoryGiB: 32,
        localScratchGiB: 0,
      }),
    ],
    heavyStages: CANONICAL_QUALITY_FIRST_HEAVY_STAGE_IDS.map((stageId) => ({
      stageId,
      primaryProfileId: PROFILE_IDS[0],
      fallbackProfileId: PROFILE_IDS[1],
      cpuOnlyExecutionAllowed: false,
      fallbackRequiresClassifiedPrimaryFailure: true,
      fallbackMayReduceResolution: false,
      fallbackMayQuantizeModel: false,
      fallbackMaySkipQa: false,
      exactApprovedSnapshotRequired: true,
      exactWorkItemAndIdempotencyKeyRequired: true,
      exactPerAttemptCostEvidenceRequired: true,
    })),
    standardGpuStages:
      CANONICAL_QUALITY_FIRST_STANDARD_GPU_STAGE_IDS.map((stageId) => ({
        stageId,
        primaryProfileId: PROFILE_IDS[2],
        fallbackProfileId: null,
        cpuOnlyExecutionAllowed: false,
        gpuKernelOrHardwareCodecEvidenceRequiredForMediaWork: true,
        cpuHelperUseLimitedToIoContainerMetadataAndControl: true,
        exactApprovedSnapshotRequired: true,
        exactWorkItemAndIdempotencyKeyRequired: true,
        exactPerAttemptCostEvidenceRequired: true,
      })),
    fallbackAdmission: {
      allowedPrimaryFailureClasses: [
        'a100_capacity_unavailable_before_attempt_start',
        'a100_job_boot_failed_before_private_media_read',
        'a100_runtime_qualification_blocked_before_dispatch',
        'a100_driver_or_cuda_incompatible_before_model_load',
      ],
      costOptimizationAloneMayTriggerFallback: false,
      unknownPrimaryOutcomeMayTriggerFallback: false,
      primaryProviderOrModelOutcomeMayBeRetriedOnFallback: false,
      priorAttemptTerminalReceiptRequired: true,
      priorAttemptCostEvidenceRequired: true,
      sameOperationModelSettingsInputAndOutputQualityRequired: true,
      newFallbackAttemptIdAndLeaseRequired: true,
      fallbackStillMustMeetQualityAndQaContract: true,
    },
    creditAndCost: {
      creditPolicyVersion: 'rp-creditpolicy-01',
      usdPerCreditMicros: 100_000,
      toolCostReportsInternalInfrastructureOnly: true,
      reeditproServiceFeeComputedBySettlementOwner: true,
      estimateBeforeExpensiveExecutionRequired: true,
      fundedReservationBeforeJobCreationRequired: true,
      perModelOrHeavyOperationEstimateLineRequired: true,
      perStandardGpuOperationEstimateLineRequired: true,
      primaryAndFallbackRateSnapshotsMustBeDistinct: true,
      exactCloudSkuRegionCurrencyTierAndCurrentAccountPriceRequired: true,
      billableColdStartActiveRuntimeAndShutdownMeasured: true,
      failedAndUnknownAttemptInfrastructureCostRetained: true,
      reeditproFailureRefundOrReleaseRequired: true,
      providerVarianceWithoutApprovalAbsorbedByReeditpro: true,
      unapprovedOverageAbsorbedByReeditpro: true,
      projectedOverageRequiresReestimateBeforeAdditionalWork: true,
      walletOrLedgerMutationOwnedHere: false,
    },
    modelCostProfiles: MODEL_COST_PROFILE_IDS.map((profileId) => {
      const heavy = (HEAVY_MODEL_COST_PROFILE_IDS as readonly string[])
        .includes(profileId)
      return {
        profileId,
        routeClass: heavy
          ? 'a100_primary_l4_classified_fallback' as const
          : 'l4_standard_primary_only' as const,
        meterClass:
          'user_triggered_scale_to_zero_gpu_attempt_wall_time_v1' as const,
        primaryProfileId: heavy ? PROFILE_IDS[0] : PROFILE_IDS[2],
        fallbackProfileId: heavy ? PROFILE_IDS[1] : null,
        estimateBeforeApprovalRequired: true,
        exactModelOrToolIdentityRequired: true,
        coldStartAndModelLoadIncludedInEstimate: true,
        activeRuntimeIncludedInEstimate: true,
        scratchStorageIncludedInEstimate: true,
        privateObjectReadWriteIncludedInEstimate: true,
        networkEgressIncludedWhenApplicable: true,
        failedAndUnknownAttemptCostRecorded: true,
        reeditproSystemFailureChargedToUser: false,
        unapprovedOverageChargedToUser: false,
        serviceFeeIncludedInToolCost: false,
        exactCloudRateSnapshotRequired: true,
        exactAttemptUsageRereadRequired: true,
      }
    }),
    quality: {
      completeSourceTimelineUnderstandingRequiredBeforeCleanup: true,
      embeddedEditorInstructionResolutionRequired: true,
      timeOrDurationOnlyCutDecisionAllowed: false,
      meaningPreservationRequired: true,
      fallbackMayChangeApprovedMeaningOrScope: false,
      deterministicVisualAudioQaRequired: true,
      postrenderVisualQaRequired: true,
      completeTimelineProfessionalReviewRequired: true,
      repairCreatesNewArtifactVersionAndReinspection: true,
    },
    remainingGates: [
      'authenticated_account_effective_cloud_price_live_reread_and_credit_estimate_bridge',
      'a100_80gb_vertex_dedicated_endpoint_identity_quota_image_and_runtime_qualification',
      'l4_cloud_run_fallback_identity_quota_image_and_runtime_qualification',
      'l4_standard_media_render_qa_identity_image_and_gpu_kernel_qualification',
      'same_region_private_object_transport_for_both_gpu_routes',
      'durable_attempt_usage_cost_and_terminal_outcome_store',
      'heavy_operation_registry_and_dispatch_migration',
      'sam3_1_gated_checkpoint_access_license_ingest_and_hash',
      'sam3_1_a100_and_l4_quality_performance_qualification',
      'thirty_run_eight_minute_p95_end_to_end_benchmark',
      'observability_kill_switch_capacity_and_rollback',
    ],
    authority: {
      sourcePolicyOnly: true,
      cloudResourceCreated: false,
      imageBuiltOrPushed: false,
      workerDeployed: false,
      gpuRuntimeExecuted: false,
      modelArtifactIngested: false,
      costRateApproved: false,
      customerChargeCreated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalQualityFirstUserTriggeredGpuPolicySchema.parse({
    ...payload,
    policyHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalQualityFirstUserTriggeredGpuPolicy(
  value: unknown,
): CanonicalQualityFirstUserTriggeredGpuPolicy {
  const parsed = canonicalQualityFirstUserTriggeredGpuPolicySchema.parse(value)
  const { policyHash, ...payload } = parsed
  if (
    policyHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(parsed) !== stableAuthorityStringify(
      createCanonicalQualityFirstUserTriggeredGpuPolicy(),
    )
  ) {
    throw new Error(
      'Quality-first user-triggered GPU policy is stale or invalid.',
    )
  }
  return parsed
}

export function canonicalQualityFirstModelCostProfileIds(): readonly string[] {
  return MODEL_COST_PROFILE_IDS
}

function acceleratorProfile(input: {
  profileId: (typeof PROFILE_IDS)[number]
  routeRole: 'heavy_primary' | 'heavy_fallback' | 'standard_primary'
  executionTarget:
    | 'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
    | 'google_cloud_run_l4_job'
  machineType: 'a2-ultragpu-1g' | 'cloud_run_nvidia_l4'
  accelerator: 'nvidia_a100_80gb' | 'nvidia_l4'
  gpuMemoryGiB: 80 | 24
  minimumVcpu: 12 | 8
  minimumMemoryGiB: 170 | 32
  localScratchGiB: 0
}) {
  const endpoint = input.executionTarget ===
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
  return {
    ...input,
    gpuCount: 1 as const,
    runtimeKind: endpoint
      ? 'dedicated_prediction_endpoint' as const
      : 'job' as const,
    minimumIdleInstances: 0 as const,
    maximumRequestConcurrencyPerInstance: 1 as const,
    startsOnlyForApprovedWork: true as const,
    lifecycleMode: endpoint
      ? 'idle_scaledown_to_zero' as const
      : 'terminal_attempt_teardown' as const,
    stopsAfterTerminalAttempt: !endpoint,
    returnsToZeroAfterIdle: true as const,
    idleScaleDownSeconds: endpoint ? 300 as const : 0 as const,
    immutableImageDigestRequired: true as const,
    exactCudaRuntimeRequired: true as const,
    exactModelOrBinaryManifestRequired: true as const,
    runtimeNetworkDownloadAllowed: false as const,
    cpuOnlyHeavyFallbackAllowed: false as const,
    qualityReducingFallbackAllowed: false as const,
    productionQualified: false as const,
  }
}

export function qualityFirstGpuPolicySummary(
  policy: CanonicalQualityFirstUserTriggeredGpuPolicy =
    createCanonicalQualityFirstUserTriggeredGpuPolicy(),
) {
  const verified = assertCanonicalQualityFirstUserTriggeredGpuPolicy(policy)
  return {
    policyVersion: verified.schemaVersion,
    policyHash: verified.policyHash,
    primary: verified.acceleratorProfiles[0],
    fallback: verified.acceleratorProfiles[1],
    standard: verified.acceleratorProfiles[2],
    heavyStageCount: verified.heavyStages.length,
    standardGpuStageCount: verified.standardGpuStages.length,
    modelCostProfileCount: verified.modelCostProfiles.length,
    minimumIdleGpuCount:
      verified.userTriggeredScaleToZeroLifecycle.minimumIdleA100ReplicaCount
      + verified.userTriggeredScaleToZeroLifecycle.minimumIdleL4JobCount,
    cpuOnlyHeavyExecutionAllowed:
      verified.migration.cpuOnlyHeavyExecutionAllowed,
    productionReady: verified.authority.productionReady,
  }
}

export const CANONICAL_QUALITY_FIRST_GPU_POLICY_SOURCE_NOTE = safeText.parse(
  'Approved heavy work activates a private A100 80 GB endpoint from zero with a non-customer readiness trigger and an independently qualified L4 fallback; normal media, rendering, encoding, and deterministic QA start bounded L4 jobs; idle GPU capacity returns to zero; non-GPU hosts remain control-plane only.',
)
