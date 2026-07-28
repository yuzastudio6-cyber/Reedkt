import type {
  CanonicalLivingFrameProjectedExecutionPlacement,
  CanonicalLivingFrameProjectedToolId,
  CanonicalLivingFrameProjectedWorkItemType,
} from './living-frame-estimate-work-asset-projection'
import type {
  CanonicalLivingFrameNamedWorkSourceFrameInput,
} from './living-frame-asset-work-input-binding'

export const CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION =
  'canonical-living-frame-work-graph-projection-v2' as const

export const CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE =
  'canonical_living_frame_work_graph_projection_compiler' as const

export const CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_COMPONENT_KEY =
  'livingFrameCanonicalWorkGraphProjection' as const

export const CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS =
  'living_frame_operation_admission_pending_worker' as const

export const CANONICAL_LIVING_FRAME_PENDING_OPERATION =
  'await_exact_living_frame_dependency_input_operation_admission' as const

export const CANONICAL_LIVING_FRAME_PENDING_OPERATION_AUTHORITY_VERSION =
  'canonical-living-frame-pending-operation-authority-v2' as const

export type CanonicalLivingFrameWorkGraphProjectionReadiness =
  | 'ready_without_living_frame_work_items'
  | 'canonical_work_items_projected_operation_admission_pending'

export interface CanonicalLivingFramePendingOperationAuthority {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION_AUTHORITY_VERSION
  readonly selectedSceneBindingDigestSha256: string
  readonly assetWorkInputBindingDigestSha256: string
  readonly estimateWorkAssetProjectionDigestSha256: string
  readonly customerEstimateAuthorityDigestSha256: string
  readonly sceneId: string
  readonly workRequirementDigestSha256: string
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
  readonly exactDependencyInputOperationAdmitted: false
  readonly executableStructuredPayloadPresent: false
}

export interface CanonicalLivingFramePendingWorkExecutionInput {
  readonly operation:
    typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION
  readonly approvedToolOperationIds: readonly []
  readonly expectedOutputKeys: readonly [string]
  readonly pendingOperationAuthority:
    CanonicalLivingFramePendingOperationAuthority
}

export interface CanonicalLivingFramePendingExpectedOutput {
  readonly outputKey: string
  readonly artifactType: string
  readonly assetRole: 'processed'
  readonly required: true
  readonly previewPlaceholderAllowed: false
  readonly contentType: 'application/json' | 'image/png'
  readonly segmentIds: readonly string[]
  readonly timingIds: readonly string[]
  readonly rendererLayerIds: readonly string[]
}

export interface CanonicalLivingFramePendingWorkItem {
  readonly workItemKey: string
  readonly workItemType:
    CanonicalLivingFrameProjectedWorkItemType
  readonly workerClass:
    typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
  readonly executionInput:
    CanonicalLivingFramePendingWorkExecutionInput
  readonly sourceSequenceItemIds: readonly string[]
  readonly sourceCleanupDecisionIds: readonly string[]
  readonly expectedOutputs:
    readonly [CanonicalLivingFramePendingExpectedOutput]
  readonly dependencyKeys: readonly string[]
  readonly approvedToolIds: readonly []
  readonly providerExecutionMode: 'none'
  readonly fallbackPolicy: {
    readonly policy:
      'block_affected_living_frame_branch_until_exact_operation_admission'
    readonly unapprovedFallbackAllowed: false
    readonly finalRenderBlockedWhilePending: true
  }
  readonly maxAttempts: 1
  readonly attemptTimeoutSeconds: 300
  readonly scheduledDelaySeconds: 0
  readonly maximumCreditBudget: number
  readonly required: true
}

export interface CanonicalLivingFrameWorkGraphProjectedItem {
  readonly sceneId: string
  readonly workItemKey: string
  readonly workItemType:
    CanonicalLivingFrameProjectedWorkItemType
  readonly costOwnerToolId:
    CanonicalLivingFrameProjectedToolId
  readonly costOwnerOperationId: string
  readonly executionPlacement:
    CanonicalLivingFrameProjectedExecutionPlacement
  readonly cpuFallbackAllowed: boolean
  readonly inputAssetIntentIds: readonly string[]
  readonly outputAssetIntentIds: readonly string[]
  readonly sourceFrameInputs:
    readonly CanonicalLivingFrameNamedWorkSourceFrameInput[]
  readonly dependencyWorkItemKeys: readonly string[]
  readonly workItemDigestSha256: string
}

export interface CanonicalLivingFrameWorkGraphProjectionAuthorityBoundary {
  readonly serverDerivedPendingWorkGraphMutationAuthority: true
  readonly callerWorkGraphMutationAuthority: false
  readonly approvedWorkGraphAuthority: false
  readonly exactToolOperationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactQaAuthority: false
  readonly privateReviewAuthority: false
  readonly finalCompositionAuthority: false
  readonly rendererAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalLivingFrameWorkGraphProjectionDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION
  readonly source:
    typeof CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE
  readonly evidenceClass:
    'private_internal_server_derived_pending_canonical_work_graph'
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
    readonly estimateWorkAssetProjectionDigestSha256: string
    readonly customerEstimateAuthorityDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly currentSoundSyncDigestSha256: string
  }
  readonly readiness:
    CanonicalLivingFrameWorkGraphProjectionReadiness
  readonly projectedItems:
    readonly CanonicalLivingFrameWorkGraphProjectedItem[]
  readonly workItems:
    readonly CanonicalLivingFramePendingWorkItem[]
  readonly blockerCodes: readonly [
    'exact_dependency_input_operations_required',
    'artifact_qa_work_items_required',
    'private_review_required',
    'final_composition_dependency_binding_required',
  ] | readonly []
  readonly metrics: {
    readonly selectedSceneCount: number
    readonly canonicalWorkItemCount: number
    readonly requiredExpectedOutputCount: number
    readonly gpuPendingWorkItemCount: number
    readonly blockedWorkItemCount: number
    readonly maximumCreditBudget: number
  }
  readonly authorityBoundary:
    CanonicalLivingFrameWorkGraphProjectionAuthorityBoundary
  readonly createsCanonicalWorkItems: true
  readonly createsApprovedWorkItems: false
  readonly createsAssetManifestEntries: false
  readonly currentResourcePlacementExecutionReady: false
  readonly existingApprovedAssetManifestRemainsAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
    false
  readonly containsProviderPromptOrExecutablePayload: false
  readonly expandsExactFiftyToolRegistry: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameWorkGraphProjection
  extends CanonicalLivingFrameWorkGraphProjectionDraft {
  readonly projectionDigestSha256: string
}
