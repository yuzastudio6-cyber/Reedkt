import type {
  EditWorkItemType,
} from './editing-agent-runtime'
import type {
  CanonicalLivingFrameNamedWorkOperationClass,
  CanonicalLivingFrameNamedWorkSourceFrameInput,
} from './living-frame-asset-work-input-binding'
import type {
  LivingFrameComponentAssetKind,
} from './living-frame-component-asset-intent'
import type {
  CanonicalLivingFrameControlledIllustrationCapabilityId,
  CanonicalLivingFrameControlledIllustrationCostComponentId,
} from './living-frame-controlled-illustration-estimate-basis'

export const CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_VERSION =
  'canonical-living-frame-estimate-work-asset-projection-v6' as const

export const CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_SOURCE =
  'canonical_living_frame_estimate_work_asset_projection_compiler' as const

export const CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_COMPONENT_KEY =
  'livingFrameEstimateWorkAssetProjection' as const

export const CANONICAL_LIVING_FRAME_PROJECTED_TOOL_IDS = [
  'ffmpeg',
  'openimageio',
  'rembg',
  'remotion',
  'sam2',
  'sharp',
] as const

export type CanonicalLivingFrameProjectedToolId =
  (typeof CANONICAL_LIVING_FRAME_PROJECTED_TOOL_IDS)[number]

export type CanonicalLivingFrameProjectedWorkItemType = Exclude<
  EditWorkItemType,
  'custom'
>

export type CanonicalLivingFrameProjectedExecutionPlacement =
  | 'google_cloud_run_gpu'
  | 'private_cpu_worker'
  | 'private_render_worker'

export type CanonicalLivingFrameEstimateWorkAssetProjectionReadiness =
  | 'ready_without_living_frame_projection'
  | 'requirements_projected_unreleased_cost_and_execution_admission_pending'
  | 'requirements_projected_execution_admission_pending'

export interface CanonicalLivingFrameProjectedCostRange {
  readonly lowCredits: number
  readonly expectedCredits: number
  readonly highCredits: number
  readonly lowInternalCostMicros: number
  readonly expectedInternalCostMicros: number
  readonly highInternalCostMicros: number
  readonly riskLevel: 'low' | 'medium' | 'high'
  readonly rateCardVersion: string
  readonly serviceFeeIncluded: false
}

interface CanonicalLivingFrameProjectedEstimateLineItemBase {
  readonly lineKey: string
  readonly label: string
  readonly category: 'living_frame'
  readonly estimatedCredits: number
  readonly removable: false
  readonly sceneId: string
  readonly executionPlacement:
    CanonicalLivingFrameProjectedExecutionPlacement
  readonly cpuFallbackAllowed: boolean
  readonly costRange:
    CanonicalLivingFrameProjectedCostRange
  readonly estimateOnly: true
}

export interface CanonicalLivingFrameProjectedRegisteredToolEstimateLineItem
  extends CanonicalLivingFrameProjectedEstimateLineItemBase {
  readonly costOwnerClass: 'canonical_production_tool'
  readonly workItemType:
    CanonicalLivingFrameProjectedWorkItemType
  readonly costOwnerToolId:
    CanonicalLivingFrameProjectedToolId
  readonly costOwnerOperationId: string
  readonly controlledIllustrationCostComponentId: null
  readonly activeControlledIllustrationCapabilityIds:
    readonly []
  readonly exactFiftyToolRegistryMember: true
  readonly operationContractObserved: true
  readonly actualAttemptCostEvidenceRequired: true
  readonly productionRateAuthority: false
}

export interface CanonicalLivingFrameProjectedUnreleasedToolEstimateLineItem
  extends CanonicalLivingFrameProjectedEstimateLineItemBase {
  readonly costOwnerClass:
    'canonical_unreleased_tool_candidate'
  readonly workItemType:
    CanonicalLivingFrameProjectedWorkItemType
  readonly costOwnerToolId: 'sam2'
  readonly costOwnerOperationId:
    'tool.sam2.segment_and_track_subject.v1'
  readonly controlledIllustrationCostComponentId: null
  readonly activeControlledIllustrationCapabilityIds:
    readonly []
  readonly exactFiftyToolRegistryMember: false
  readonly operationContractObserved: false
  readonly actualAttemptCostEvidenceRequired: true
  readonly productionRateAuthority: false
  readonly runtimeCostAdmissionRequired: true
  readonly customerEstimateEligibleBeforeCostAdmission: false
}

export interface CanonicalLivingFrameProjectedInfrastructureEstimateLineItem
  extends CanonicalLivingFrameProjectedEstimateLineItemBase {
  readonly costOwnerClass:
    'shared_controlled_illustration_runtime'
  readonly workItemType: null
  readonly costOwnerToolId: null
  readonly costOwnerOperationId: null
  readonly controlledIllustrationCostComponentId:
    CanonicalLivingFrameControlledIllustrationCostComponentId
  readonly activeControlledIllustrationCapabilityIds:
    readonly CanonicalLivingFrameControlledIllustrationCapabilityId[]
  readonly generationUnitCount: number
  readonly attemptOrComparisonCount: number
  readonly billableMilliseconds: number
  readonly exactFiftyToolRegistryMember: false
  readonly operationContractObserved: false
  readonly actualAttemptCostEvidenceRequired: true
  readonly productionRateAuthority: false
}

export type CanonicalLivingFrameProjectedEstimateLineItem =
  | CanonicalLivingFrameProjectedRegisteredToolEstimateLineItem
  | CanonicalLivingFrameProjectedUnreleasedToolEstimateLineItem
  | CanonicalLivingFrameProjectedInfrastructureEstimateLineItem

export interface CanonicalLivingFrameProjectedExpectedOutput {
  readonly outputKey: string
  readonly artifactType: string
  readonly assetRole: 'processed' | 'qa'
  readonly required: true
  readonly previewPlaceholderAllowed: false
  readonly contentType:
    | 'application/json'
    | 'image/png'
    | 'video/mp4'
    | 'video/x-matroska'
  readonly segmentIds: readonly string[]
  readonly timingIds: readonly string[]
  readonly rendererLayerIds: readonly string[]
  readonly assetManifestEntryRequiredAfterApproval: true
}

export interface CanonicalLivingFrameProjectedWorkRequirement {
  readonly workInputKey: string
  readonly workItemKey: string
  readonly sceneId: string
  readonly workItemType:
    CanonicalLivingFrameProjectedWorkItemType
  readonly operationClass:
    CanonicalLivingFrameNamedWorkOperationClass
  readonly outputAssetKinds:
    readonly LivingFrameComponentAssetKind[]
  readonly dependencyWorkInputKeys: readonly string[]
  readonly dependencyWorkItemKeys: readonly string[]
  readonly inputAssetIntentIds: readonly string[]
  readonly outputAssetIntentIds: readonly string[]
  readonly sourceFrameInputs:
    readonly CanonicalLivingFrameNamedWorkSourceFrameInput[]
  readonly costOwnerToolId:
    CanonicalLivingFrameProjectedToolId
  readonly costOwnerOperationId: string
  readonly executionPlacement:
    CanonicalLivingFrameProjectedExecutionPlacement
  readonly cpuFallbackAllowed: boolean
  readonly expectedOutputs:
    readonly CanonicalLivingFrameProjectedExpectedOutput[]
  readonly currentRuntimeAdmission:
    | 'blocked_until_real_dependency_input_operation_is_admitted'
    | 'blocked_until_temporal_source_recipe_and_sam2_model_runtime_are_admitted'
  readonly workGraphMutationAuthorized: false
  readonly executablePayloadPresent: false
}

export interface CanonicalLivingFrameProjectedSceneRequirements {
  readonly sceneId: string
  readonly canonicalSegmentId: string
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly timingSceneDigestSha256: string
  readonly estimateLineItems:
    readonly CanonicalLivingFrameProjectedEstimateLineItem[]
  readonly workRequirements:
    readonly CanonicalLivingFrameProjectedWorkRequirement[]
}

export interface CanonicalLivingFrameEstimateWorkAssetProjectionMetrics {
  readonly selectedSceneCount: number
  readonly projectedEstimateLineItemCount: number
  readonly projectedNamedWorkItemCount: number
  readonly projectedExpectedAssetCount: number
  readonly projectedGpuWorkItemCount: number
  readonly projectedControlledIllustrationGenerationUnitCount:
    number
  readonly projectedControlledIllustrationCostComponentCount:
    number
  readonly projectedMaximumInternalToolCostCredits: number
  readonly projectedMaximumInternalToolCostMicros: number
  readonly controlledIllustrationCreditRoundingAppliedOnceAcrossLivingFrameBundle:
    true
  readonly observedProductionToolRegistryCount: number
  readonly productionToolRegistryCountIsProductCap: false
  readonly productionToolRegistrySemanticIntegrityVerified: true
}

export interface CanonicalLivingFrameEstimateWorkAssetProjectionAuthorityBoundary {
  readonly serverDerivedEstimateRequirementAuthority: true
  readonly serverDerivedNamedWorkRequirementAuthority: true
  readonly serverDerivedExpectedAssetRequirementAuthority: true
  readonly customerEstimateAuthority: false
  readonly customerServiceFeeAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly rendererAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalLivingFrameEstimateWorkAssetProjectionDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_VERSION
  readonly source:
    typeof CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_SOURCE
  readonly evidenceClass:
    'private_internal_server_derived_estimate_work_asset_requirements'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly executionRequirementsDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly assetWorkInputBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly currentSoundSyncDigestSha256: string
    readonly confirmedSettingsDigestSha256: string
  }
  readonly productEditLevel:
    'normal' | 'premium' | 'ultra_premium'
  readonly readiness:
    CanonicalLivingFrameEstimateWorkAssetProjectionReadiness
  readonly scenes:
    readonly CanonicalLivingFrameProjectedSceneRequirements[]
  readonly metrics:
    CanonicalLivingFrameEstimateWorkAssetProjectionMetrics
  readonly authorityBoundary:
    CanonicalLivingFrameEstimateWorkAssetProjectionAuthorityBoundary
  readonly existingCustomerEstimateAndServiceFeePipelineRemainsAuthority: true
  readonly existingApprovedWorkGraphRemainsAuthority: true
  readonly existingApprovedAssetManifestRemainsAuthority: true
  readonly customerEstimateRecalculationRequired: boolean
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderPromptOrExecutablePayload: false
  readonly createsCanonicalWorkItems: false
  readonly createsAssetManifestEntries: false
  readonly createsProductionToolIdentity: false
  readonly expandsExactFiftyToolRegistry: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameEstimateWorkAssetProjection
  extends CanonicalLivingFrameEstimateWorkAssetProjectionDraft {
  readonly projectionDigestSha256: string
}
