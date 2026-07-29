import type {
  CanonicalLivingFrameProjectedExecutionPlacement,
  CanonicalLivingFrameProjectedToolId,
  CanonicalLivingFrameProjectedWorkItemType,
} from './living-frame-estimate-work-asset-projection'
import type {
  CanonicalLivingFrameNamedWorkSourceFrameInput,
} from './living-frame-asset-work-input-binding'

export const CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION =
  'canonical-living-frame-work-graph-projection-v9' as const

export const CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE =
  'canonical_living_frame_work_graph_projection_compiler' as const

export const CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_COMPONENT_KEY =
  'livingFrameCanonicalWorkGraphProjection' as const

export const CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS =
  'living_frame_operation_admission_pending_worker' as const

export const CANONICAL_LIVING_FRAME_PENDING_OPERATION =
  'await_exact_living_frame_dependency_input_operation_admission' as const

export const CANONICAL_LIVING_FRAME_PENDING_OPERATION_AUTHORITY_VERSION =
  'canonical-living-frame-pending-operation-authority-v6' as const

export const CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION =
  'extract_approved_exact_source_frame_png' as const

export const CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE =
  'approved_exact_source_frame_png' as const

export const CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS =
  'media_processing_worker' as const

export const CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS =
  'gpu_ai_worker' as const

export const CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION =
  'generate_approved_living_frame_rembg_mask_png' as const

export const CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION =
  'tool.rembg.remove_image_background.v1' as const

export const CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_INPUT_VERSION =
  'canonical-living-frame-rembg-gpu-mask-work-input-v2' as const

export const CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE =
  'living_frame_generated_opaque_still_png' as const

export const CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS =
  'render_worker' as const

export const CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION =
  'prepare_approved_living_frame_rgba_component' as const

export const CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION =
  'tool.sharp.prepare_approved_image_asset.v1' as const

export const CANONICAL_LIVING_FRAME_SHARP_COMPONENT_RECIPE =
  'approved_living_frame_alpha_component_v1' as const

export const CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS =
  'render_planning_worker' as const

export const CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION =
  'compile_approved_living_frame_remotion_layer_manifest' as const

export const CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION =
  'canonical-living-frame-remotion-layer-work-input-v1' as const

export const CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY =
  'approved_rgba_over_source_below_captions_v1' as const

export type CanonicalLivingFrameWorkGraphProjectionReadiness =
  | 'ready_without_living_frame_work_items'
  | 'canonical_work_items_projected_operation_admission_pending'
  | 'canonical_work_items_projected_exact_source_frame_admitted'
  | 'canonical_work_items_projected_rembg_gpu_operation_admitted'
  | 'canonical_work_items_projected_sharp_component_operation_admitted'
  | 'canonical_work_items_projected_remotion_layer_and_final_composition_bound'

export interface CanonicalLivingFramePendingOperationAuthority {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION_AUTHORITY_VERSION
  readonly selectedSceneBindingDigestSha256: string
  readonly assetWorkInputBindingDigestSha256: string
  readonly estimateWorkAssetProjectionDigestSha256: string
  readonly customerEstimateAuthorityDigestSha256: string
  readonly controlledIllustrationCostWorkBindingDigestSha256:
    string
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
  readonly exactDependencyInputOperationAdmitted: boolean
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

export interface CanonicalLivingFrameControlledIllustrationPendingAuthority {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION_AUTHORITY_VERSION
  readonly selectedSceneBindingDigestSha256: string
  readonly assetWorkInputBindingDigestSha256: string
  readonly estimateWorkAssetProjectionDigestSha256: string
  readonly customerEstimateAuthorityDigestSha256: string
  readonly controlledIllustrationCostWorkBindingDigestSha256: string
  readonly sceneId: string
  readonly workRequirementKey: string
  readonly costOwnerClass:
    'shared_controlled_illustration_runtime'
  readonly costComponentId:
    | 'shared_controlled_illustration_gpu_host'
    | 'auraface_cpu_continuity_measurement'
  readonly costLineKey: string
  readonly generatedAssetIntentIds: readonly string[]
  readonly executionPlacement:
    | 'google_cloud_run_gpu'
    | 'private_cpu_worker'
  readonly cpuFallbackAllowed: false
  readonly exactOperationAdmissionRequired: true
  readonly executableStructuredPayloadPresent: false
}

export interface CanonicalLivingFrameControlledIllustrationGenerationWorkItem {
  readonly workItemKey: string
  readonly workItemType: 'generate_image_asset'
  readonly workerClass:
    typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
  readonly executionInput: {
    readonly operation:
      typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION
    readonly approvedToolOperationIds: readonly []
    readonly expectedOutputKeys: readonly string[]
    readonly pendingOperationAuthority:
      CanonicalLivingFrameControlledIllustrationPendingAuthority
  }
  readonly sourceSequenceItemIds: readonly []
  readonly sourceCleanupDecisionIds: readonly []
  readonly expectedOutputs: readonly {
    readonly outputKey: string
    readonly artifactType:
      'living_frame_generated_opaque_still_png'
    readonly assetRole: 'generated'
    readonly required: true
    readonly previewPlaceholderAllowed: false
    readonly contentType: 'image/png'
    readonly segmentIds: readonly string[]
    readonly timingIds: readonly string[]
    readonly rendererLayerIds: readonly string[]
  }[]
  readonly dependencyKeys: readonly []
  readonly approvedToolIds: readonly []
  readonly providerExecutionMode: 'none'
  readonly fallbackPolicy: {
    readonly policy:
      'block_generated_living_frame_branch_until_controlled_illustration_operation_qualification'
    readonly unapprovedFallbackAllowed: false
    readonly cpuFallbackAllowed: false
    readonly finalRenderBlockedWhilePending: true
  }
  readonly maxAttempts: number
  readonly attemptTimeoutSeconds: 3_600
  readonly scheduledDelaySeconds: 0
  readonly maximumCreditBudget: number
  readonly required: true
}

export interface CanonicalLivingFrameAuraFacePendingQaWorkItem {
  readonly workItemKey: string
  readonly workItemType: 'run_asset_qa'
  readonly workerClass:
    typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
  readonly executionInput: {
    readonly operation:
      typeof CANONICAL_LIVING_FRAME_PENDING_OPERATION
    readonly approvedToolOperationIds: readonly []
    readonly expectedOutputKeys: readonly [string]
    readonly pendingOperationAuthority:
      CanonicalLivingFrameControlledIllustrationPendingAuthority
  }
  readonly sourceSequenceItemIds: readonly []
  readonly sourceCleanupDecisionIds: readonly []
  readonly expectedOutputs: readonly [{
    readonly outputKey: string
    readonly artifactType:
      'living_frame_auraface_continuity_qa_report'
    readonly assetRole: 'qa'
    readonly required: true
    readonly previewPlaceholderAllowed: false
    readonly contentType: 'application/json'
    readonly segmentIds: readonly string[]
    readonly timingIds: readonly string[]
    readonly rendererLayerIds: readonly string[]
  }]
  readonly dependencyKeys: readonly [string]
  readonly approvedToolIds: readonly []
  readonly providerExecutionMode: 'none'
  readonly fallbackPolicy: {
    readonly policy:
      'block_identity_sensitive_living_frame_branch_until_auraface_operation_qualification'
    readonly unapprovedFallbackAllowed: false
    readonly finalRenderBlockedWhilePending: true
  }
  readonly maxAttempts: 1
  readonly attemptTimeoutSeconds: 300
  readonly scheduledDelaySeconds: 0
  readonly maximumCreditBudget: number
  readonly required: true
}

export interface CanonicalLivingFrameExactSourceFramePngWorkItem {
  readonly workItemKey: string
  readonly workItemType: 'process_image_asset'
  readonly workerClass:
    typeof CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS
  readonly executionInput: {
    readonly operation:
      typeof CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION
    readonly approvedToolOperationIds:
      readonly ['tool.ffmpeg.execute_approved_media_recipe.v1']
    readonly expectedOutputKeys: readonly [string]
    readonly structuredPayload: {
      readonly recipeProfileId:
        'approved_exact_source_frame_png_v1'
      readonly timestampPolicy:
        'select_exact_decoded_source_frame'
      readonly overwriteExistingArtifact: false
      readonly allowUnreviewedCodec: false
      readonly sourceSequenceItemId: string
      readonly sourceCleanupDecisionId: string
      readonly masterFrameIndex: number
      readonly sourceFrameIndex: number
      readonly frameRate: 24 | 25 | 30 | 50 | 60
      readonly sourceFrameSelectionDigestSha256: string
      readonly frameSelectionPolicy:
        'approved_source_frame_ordinal_v1'
      readonly outputContainer: 'png'
      readonly outputCodec: 'png'
      readonly outputPixelFormat: 'rgba'
      readonly metadataPolicy: 'strip_all'
      readonly preserveAudio: false
      readonly maximumWidth: 4096
      readonly maximumHeight: 4096
      readonly maximumPixelCount: 16_777_216
      readonly maximumOutputBytes: 16_777_216
    }
  }
  readonly sourceSequenceItemIds: readonly [string]
  readonly sourceCleanupDecisionIds: readonly [string]
  readonly expectedOutputs: readonly [{
    readonly outputKey: string
    readonly artifactType:
      typeof CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE
    readonly assetRole: 'processed'
    readonly required: true
    readonly previewPlaceholderAllowed: false
    readonly contentType: 'image/png'
    readonly segmentIds: readonly string[]
    readonly timingIds: readonly string[]
    readonly rendererLayerIds: readonly string[]
  }]
  readonly dependencyKeys: readonly []
  readonly approvedToolIds: readonly ['ffmpeg']
  readonly providerExecutionMode: 'none'
  readonly fallbackPolicy: {
    readonly policy:
      'block_living_frame_mask_until_exact_source_frame_exists'
    readonly unapprovedFallbackAllowed: false
    readonly finalRenderBlockedWhilePending: true
  }
  readonly maxAttempts: 2
  readonly attemptTimeoutSeconds: 300
  readonly scheduledDelaySeconds: 0
  readonly maximumCreditBudget: 0
  readonly required: true
}

export interface CanonicalLivingFrameRembgGpuMaskWorkItem {
  readonly workItemKey: string
  readonly workItemType: 'generate_mask_asset'
  readonly workerClass:
    typeof CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS
  readonly executionInput: {
    readonly operation:
      typeof CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION
    readonly approvedToolOperationIds: readonly [
      typeof CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
    ]
    readonly expectedOutputKeys: readonly [string]
    readonly structuredPayload: {
      readonly schemaVersion:
        typeof CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_INPUT_VERSION
      readonly selectedSceneBindingDigestSha256: string
      readonly assetWorkInputBindingDigestSha256: string
      readonly estimateWorkAssetProjectionDigestSha256: string
      readonly customerEstimateAuthorityDigestSha256: string
      readonly sceneId: string
      readonly workRequirementDigestSha256: string
      readonly inputAssetIntentIds: readonly string[]
      readonly outputAssetIntentIds: readonly string[]
      readonly sourceDependency:
        | {
          readonly sourceVariant: 'canonical_source_frame'
          readonly workItemKey: string
          readonly outputKey: string
          readonly artifactType:
            typeof CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE
          readonly sourceSequenceItemId: string
          readonly sourceCleanupDecisionId: string
          readonly masterFrameIndex: number
          readonly sourceFrameIndex: number
          readonly frameRate: 24 | 25 | 30 | 50 | 60
          readonly frameSelectionPolicy:
            'approved_source_frame_ordinal_v1'
          readonly sourceFrameSelectionDigestSha256: string
          readonly contentType: 'image/png'
        }
        | {
          readonly sourceVariant:
            'living_frame_generated_opaque_still'
          readonly workItemKey: string
          readonly outputKey: string
          readonly artifactType:
            typeof CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE
          readonly assetIntentId: string
          readonly contentType: 'image/png'
        }
      readonly runtimePolicy: {
        readonly executionTarget: 'google_cloud_run_gpu'
        readonly workerType:
          typeof CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS
        readonly accelerator: 'nvidia_l4'
        readonly gpuCount: 1
        readonly device: 'cuda'
        readonly modelId: 'u2netp'
        readonly outputMode: 'mask_only_png'
        readonly confidenceThreshold: 0.5
        readonly alphaMatteMode: 'straight'
        readonly edgeRefinementProfileId:
          'approved_u2netp_default_v1'
        readonly maximumSubjects: 1
        readonly preserveSourceDimensions: true
        readonly cpuFallbackAllowed: false
        readonly runtimeDownloadAllowed: false
        readonly networkFetchAllowed: false
      }
      readonly requiredQaGates: readonly [
        'mask_edge_quality',
        'mask_subject_coverage',
      ]
      readonly runtimeQualificationRequired: true
      readonly outputArtifactCommitRequired: true
      readonly artifactQaPassRequired: true
    }
  }
  readonly sourceSequenceItemIds:
    | readonly [string]
    | readonly []
  readonly sourceCleanupDecisionIds:
    | readonly [string]
    | readonly []
  readonly expectedOutputs: readonly [{
    readonly outputKey: string
    readonly artifactType: 'living_frame_alpha_mask_png'
    readonly assetRole: 'processed'
    readonly required: true
    readonly previewPlaceholderAllowed: false
    readonly contentType: 'image/png'
    readonly segmentIds: readonly string[]
    readonly timingIds: readonly string[]
    readonly rendererLayerIds: readonly string[]
  }]
  readonly dependencyKeys: readonly string[]
  readonly approvedToolIds: readonly ['rembg']
  readonly providerExecutionMode: 'none'
  readonly fallbackPolicy: {
    readonly policy:
      'block_living_frame_branch_until_gpu_runtime_and_mask_qa_pass'
    readonly unapprovedFallbackAllowed: false
    readonly cpuFallbackAllowed: false
    readonly finalRenderBlockedWhilePending: true
  }
  readonly maxAttempts: 2
  readonly attemptTimeoutSeconds: 3_600
  readonly scheduledDelaySeconds: 0
  readonly maximumCreditBudget: number
  readonly required: true
}

export interface CanonicalLivingFrameSharpComponentWorkItem {
  readonly workItemKey: string
  readonly workItemType: 'process_image_asset'
  readonly workerClass:
    typeof CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS
  readonly executionInput: {
    readonly operation:
      typeof CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION
    readonly approvedToolOperationIds: readonly [
      typeof CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
    ]
    readonly expectedOutputKeys: readonly [string]
    readonly structuredPayload: {
      readonly imageRecipeId:
        typeof CANONICAL_LIVING_FRAME_SHARP_COMPONENT_RECIPE
      readonly outputFormat: 'png'
      readonly outputWidth: number
      readonly outputHeight: number
      readonly preserveMetadata: false
      readonly allowUpscale: false
    }
  }
  readonly sourceSequenceItemIds:
    | readonly [string]
    | readonly []
  readonly sourceCleanupDecisionIds:
    | readonly [string]
    | readonly []
  readonly expectedOutputs: readonly [{
    readonly outputKey: string
    readonly artifactType: 'living_frame_component_rgba_png'
    readonly assetRole: 'processed'
    readonly required: true
    readonly previewPlaceholderAllowed: false
    readonly contentType: 'image/png'
    readonly segmentIds: readonly string[]
    readonly timingIds: readonly string[]
    readonly rendererLayerIds: readonly string[]
  }]
  readonly dependencyKeys: readonly string[]
  readonly approvedToolIds: readonly ['sharp']
  readonly providerExecutionMode: 'none'
  readonly fallbackPolicy: {
    readonly policy:
      'block_living_frame_branch_until_source_mask_component_and_alpha_qa_pass'
    readonly unapprovedFallbackAllowed: false
    readonly finalRenderBlockedWhilePending: true
  }
  readonly maxAttempts: 2
  readonly attemptTimeoutSeconds: 300
  readonly scheduledDelaySeconds: 0
  readonly maximumCreditBudget: number
  readonly required: true
}

export interface CanonicalLivingFrameRemotionLayerWorkItem {
  readonly workItemKey: string
  readonly workItemType: 'prepare_remotion_layer'
  readonly workerClass:
    typeof CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS
  readonly executionInput: {
    readonly operation:
      typeof CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION
    readonly approvedToolOperationIds: readonly []
    readonly expectedOutputKeys: readonly [string]
    readonly structuredPayload: {
      readonly schemaVersion:
        typeof CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION
      readonly selectedSceneBindingDigestSha256: string
      readonly timingBindingDigestSha256: string
      readonly sceneId: string
      readonly layerId: string
      readonly startFrame: number
      readonly endFrameExclusive: number
      readonly outputWidth: number
      readonly outputHeight: number
      readonly fit: 'fill'
      readonly opacity: 1
      readonly compositionPolicy:
        typeof CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY
      readonly captionPlaneRemainsAboveLivingFrame: true
      readonly componentDependency: {
        readonly workItemKey: string
        readonly outputKey: string
        readonly artifactType: 'living_frame_component_rgba_png'
        readonly contentType: 'image/png'
      }
    }
  }
  readonly sourceSequenceItemIds: readonly string[]
  readonly sourceCleanupDecisionIds: readonly string[]
  readonly expectedOutputs: readonly [{
    readonly outputKey: string
    readonly artifactType: 'living_frame_remotion_layer_manifest'
    readonly assetRole: 'processed'
    readonly required: true
    readonly previewPlaceholderAllowed: false
    readonly contentType: 'application/json'
    readonly segmentIds: readonly string[]
    readonly timingIds: readonly string[]
    readonly rendererLayerIds: readonly [string]
  }]
  readonly dependencyKeys: readonly [string]
  readonly approvedToolIds: readonly []
  readonly providerExecutionMode: 'none'
  readonly fallbackPolicy: {
    readonly policy:
      'block_final_composition_until_living_frame_component_and_layer_manifest_qa_pass'
    readonly unapprovedFallbackAllowed: false
    readonly finalRenderBlockedWhilePending: true
  }
  readonly maxAttempts: 2
  readonly attemptTimeoutSeconds: 300
  readonly scheduledDelaySeconds: 0
  readonly maximumCreditBudget: number
  readonly required: true
}

export type CanonicalLivingFrameProjectedCanonicalWorkItem =
  | CanonicalLivingFramePendingWorkItem
  | CanonicalLivingFrameControlledIllustrationGenerationWorkItem
  | CanonicalLivingFrameAuraFacePendingQaWorkItem
  | CanonicalLivingFrameExactSourceFramePngWorkItem
  | CanonicalLivingFrameRembgGpuMaskWorkItem
  | CanonicalLivingFrameSharpComponentWorkItem
  | CanonicalLivingFrameRemotionLayerWorkItem

export interface CanonicalLivingFrameFinalOverlayLayerBinding {
  readonly sceneId: string
  readonly layerId: string
  readonly manifestWorkItemKey: string
  readonly manifestOutputKey: string
  readonly componentWorkItemKey: string
  readonly componentOutputKey: string
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly fit: 'fill'
  readonly opacity: 1
}

export interface CanonicalLivingFrameFinalCompositionBinding {
  readonly policy:
    typeof CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY
  readonly requiredFinalWorkItemType: 'render_final_export'
  readonly requiredRemotionOperation:
    'tool.remotion.render_approved_composition.v1'
  readonly overlayLayers:
    readonly CanonicalLivingFrameFinalOverlayLayerBinding[]
  readonly requiredDependencyWorkItemKeys: readonly string[]
  readonly captionPlaneRemainsAboveLivingFrame: true
  readonly bindingDigestSha256: string
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

export interface CanonicalLivingFrameControlledIllustrationProjectedItem {
  readonly sceneId: string
  readonly workItemKey: string
  readonly workItemType:
    'generate_image_asset' | 'run_asset_qa'
  readonly costOwnerClass:
    'shared_controlled_illustration_runtime'
  readonly costComponentId:
    | 'shared_controlled_illustration_gpu_host'
    | 'auraface_cpu_continuity_measurement'
  readonly costLineKey: string
  readonly executionPlacement:
    | 'google_cloud_run_gpu'
    | 'private_cpu_worker'
  readonly cpuFallbackAllowed: false
  readonly inputAssetIntentIds: readonly string[]
  readonly outputAssetIntentIds: readonly string[]
  readonly dependencyWorkItemKeys: readonly string[]
  readonly workItemDigestSha256: string
}

export interface CanonicalLivingFrameWorkGraphProjectionAuthorityBoundary {
  readonly serverDerivedPendingWorkGraphMutationAuthority: true
  readonly serverDerivedControlledIllustrationPendingWorkAuthority:
    true
  readonly serverDerivedExactSourceFrameOperationAuthority: true
  readonly serverDerivedRembgGpuMaskOperationAuthority: true
  readonly serverDerivedSharpComponentOperationAuthority: true
  readonly serverDerivedRemotionLayerManifestAuthority: true
  readonly serverDerivedFinalCompositionDependencyAuthority: true
  readonly callerWorkGraphMutationAuthority: false
  readonly approvedWorkGraphAuthority: false
  readonly remainingLivingFrameExactToolOperationAuthority: false
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
    'private_internal_server_derived_canonical_work_graph_projection'
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
    readonly controlledIllustrationCostWorkBindingDigestSha256:
      string
    readonly currentMasterTimingDigestSha256: string
    readonly currentSoundSyncDigestSha256: string
  }
  readonly readiness:
    CanonicalLivingFrameWorkGraphProjectionReadiness
  readonly projectedItems:
    readonly (
      | CanonicalLivingFrameWorkGraphProjectedItem
      | CanonicalLivingFrameControlledIllustrationProjectedItem
    )[]
  readonly workItems:
    readonly CanonicalLivingFrameProjectedCanonicalWorkItem[]
  readonly finalCompositionBinding:
    CanonicalLivingFrameFinalCompositionBinding | null
  readonly blockerCodes: readonly [
    'artifact_qa_work_items_required',
    'private_review_required',
  ] | readonly []
  readonly metrics: {
    readonly selectedSceneCount: number
    readonly canonicalWorkItemCount: number
    readonly admittedControlledIllustrationGenerationWorkItemCount:
      number
    readonly admittedAuraFaceQaWorkItemCount: number
    readonly admittedExactSourceFrameWorkItemCount: number
    readonly admittedGeneratedOpaqueStillMaskSourceCount:
      number
    readonly admittedRembgGpuMaskWorkItemCount: number
    readonly admittedSharpComponentWorkItemCount: number
    readonly admittedRemotionLayerWorkItemCount: number
    readonly finalCompositionBindingCount: number
    readonly executableWorkItemCount: number
    readonly requiredExpectedOutputCount: number
    readonly gpuPendingWorkItemCount: number
    readonly blockedWorkItemCount: number
    readonly assignedWorkItemCreditBudget: number
    readonly unassignedControlledIllustrationCreditBudget:
      number
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
  readonly containsProviderPrompt: false
  readonly containsControlledIllustrationExecutablePayload:
    false
  readonly containsExactSourceFrameExecutablePayload: boolean
  readonly containsRembgGpuOperationPayload: true
  readonly containsSharpComponentOperationPayload: true
  readonly containsRemotionLayerManifestPayload: true
  readonly containsFinalCompositionDependencyBinding: true
  readonly expandsExactFiftyToolRegistry: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameWorkGraphProjection
  extends CanonicalLivingFrameWorkGraphProjectionDraft {
  readonly projectionDigestSha256: string
}
