import type {
  LivingFrameCapabilityKey,
  LivingFrameMiniSkillKey,
  LivingFrameQaCode,
} from './living-frame'
import type {
  LivingFrameMissingOperationCode,
  LivingFrameWorkExternalGateCode,
} from './living-frame-work-admission'
import type {
  CanonicalLivingFrameSelectedSceneTreatment,
} from './living-frame-selected-scene-binding'
import type {
  EditWorkItemType,
} from './editing-agent-runtime'

export const CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_VERSION =
  'canonical-living-frame-execution-requirements-v1' as const

export const CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_SOURCE =
  'canonical_living_frame_execution_requirements_compiler' as const

export const CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_COMPONENT_KEY =
  'livingFrameExecutionRequirements' as const

export const CANONICAL_LIVING_FRAME_EXECUTION_READINESS_STATES = [
  'ready_without_living_frame_execution',
  'blocked_until_canonical_execution_projection',
] as const

export type CanonicalLivingFrameExecutionReadinessState =
  (typeof CANONICAL_LIVING_FRAME_EXECUTION_READINESS_STATES)[number]

export const CANONICAL_LIVING_FRAME_EXECUTION_BLOCKER_CODES = [
  'exact_master_timing_binding_required',
  'exact_soundsync_binding_required',
  'itemized_estimate_projection_required',
  'named_work_item_projection_required',
  'asset_manifest_projection_required',
  'artifact_qa_projection_required',
  'private_review_projection_required',
] as const

export type CanonicalLivingFrameExecutionBlockerCode =
  (typeof CANONICAL_LIVING_FRAME_EXECUTION_BLOCKER_CODES)[number]

export interface CanonicalLivingFrameSceneExecutionRequirement {
  readonly sceneId: string
  readonly treatment: CanonicalLivingFrameSelectedSceneTreatment
  readonly segmentExpectationId: string
  readonly canonicalSegmentId: string
  readonly canonicalSegmentDigestSha256: string
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly componentIds: readonly string[]
  readonly semanticTimingRequestIds: readonly string[]
  readonly soundRequestIds: readonly string[]
  readonly capabilityKeys: readonly LivingFrameCapabilityKey[]
  readonly miniSkillKeys: readonly LivingFrameMiniSkillKey[]
  readonly requiredNamedWorkItemTypes:
    readonly Exclude<EditWorkItemType, 'custom'>[]
  readonly missingOperationCodes:
    readonly LivingFrameMissingOperationCode[]
  readonly requiredExternalGateCodes:
    readonly LivingFrameWorkExternalGateCode[]
  readonly qaExpectationCodes: readonly LivingFrameQaCode[]
}

export interface CanonicalLivingFrameExecutionRequirementsMetrics {
  readonly selectedSceneCount: number
  readonly selectedComponentCount: number
  readonly semanticTimingRequestCount: number
  readonly soundRequestCount: number
  readonly requiredNamedWorkItemTypeCount: number
  readonly requiredExternalGateCount: number
  readonly missingOperationCount: number
  readonly qaExpectationCount: number
}

export interface CanonicalLivingFrameExecutionRequirementsAuthorityBoundary {
  readonly serverDerivedRequirementsAuthority: true
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
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

export interface CanonicalLivingFrameExecutionRequirementsDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_VERSION
  readonly source:
    typeof CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_SOURCE
  readonly evidenceClass:
    'private_internal_server_derived_execution_requirements'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly deferredLivingFrameComponentDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly currentSoundSyncDigestSha256: string
    readonly canonicalSegmentsDigestSha256: string
    readonly workAdmissionCatalogDigestSha256: string
  }
  readonly readiness:
    CanonicalLivingFrameExecutionReadinessState
  readonly blockerCodes:
    readonly CanonicalLivingFrameExecutionBlockerCode[]
  readonly scenes:
    readonly CanonicalLivingFrameSceneExecutionRequirement[]
  readonly metrics:
    CanonicalLivingFrameExecutionRequirementsMetrics
  readonly authorityBoundary:
    CanonicalLivingFrameExecutionRequirementsAuthorityBoundary
  readonly existingEstimateApprovalSnapshotPipelineRemainsAuthority: true
  readonly existingWorkAssetQaReviewPipelineRemainsAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderPromptOrExecutablePayload: false
  readonly containsResolvedToolProviderModelOrCostRoute: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameExecutionRequirements
  extends CanonicalLivingFrameExecutionRequirementsDraft {
  readonly requirementsDigestSha256: string
}
