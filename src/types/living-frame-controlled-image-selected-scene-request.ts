import type {
  LivingFrameCapabilityKey,
  LivingFrameComponentRole,
  LivingFrameImportance,
  LivingFrameMode,
  LivingFrameNarrativePurposeCode,
  LivingFrameSourceTruthMode,
  LivingFrameVisualVerb,
} from './living-frame'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_VERSION =
  'living-frame-controlled-image-selected-scene-request-v1' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_CLASS =
  'server_derived_non_executable_selected_scene_controlled_image_request_projection' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_STATE =
  'selected_scene_request_projected_operation_admission_pending' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_OPEN_GATES = [
  'canonical_comfyui_operation_admission_required',
  'fixed_supervised_process_entrypoint_required',
  'signed_scanned_nonroot_gpu_image_required',
  'exact_read_only_model_mount_required',
  'license_and_paid_use_approval_required',
  'approved_work_item_operation_binding_required',
  'private_gpu_dispatch_and_worker_lease_required',
  'actual_worker_resource_cost_receipt_required',
  'generated_asset_qa_manifest_private_review_required',
  'full_frame_generation_canvas_extension_required_when_projected',
] as const

export type LivingFrameControlledImageSelectedSceneRequestOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_ISSUE_CODES = [
  'input_invalid',
  'approved_lineage_invalid',
  'work_graph_invalid',
  'source_lineage_mismatch',
  'selected_scene_missing',
  'generation_work_item_missing',
  'asset_intent_missing',
  'component_missing',
  'continuity_pack_required',
  'request_unit_invalid',
  'unsafe_projection_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageSelectedSceneRequestIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_ISSUE_CODES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_UNIT_STATES = [
  'ready_for_exact_operation_binding',
  'blocked_by_full_frame_generation_canvas_extension',
] as const

export type LivingFrameControlledImageSelectedSceneRequestUnitState =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_UNIT_STATES)[number]

export interface LivingFrameControlledImageSelectedSceneRequestAuthority {
  readonly selectedSceneRequestProjectionAuthority: true
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly visualContinuityPackAuthority: false
  readonly exactFrameAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly approvedWorkItemMutationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly modelArtifactAuthority: false
  readonly artifactMountAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly actualCostAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedSceneRequestUnit {
  readonly order: number
  readonly requestUnitId: string
  readonly requestUnitState:
    LivingFrameControlledImageSelectedSceneRequestUnitState
  readonly sceneId: string
  readonly componentId: string
  readonly componentRole: LivingFrameComponentRole
  readonly assetIntentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly rendererLayerId: string
  readonly serverOwnedConditioningLocatorId: string
  readonly semanticDirectionDigestSha256: string
  readonly componentDirectionDigestSha256: string
  readonly continuityDirectionDigestSha256: string | null
  readonly activeCapabilityKeys:
    readonly LivingFrameCapabilityKey[]
  readonly privateSlotKinds:
    readonly LivingFrameControlledSdxlBenchmarkRequestSlotKind[]
  readonly controlPolicy: {
    readonly structureConditioningRequired: boolean
    readonly referenceConditioningRequired: boolean
    readonly loraAdapterRequired: boolean
    readonly controlImagePreparedOutsideComfyUi: boolean
    readonly referenceImageMustComeFromApprovedContinuityPack:
      boolean
    readonly genericIpAdapterOnly: true
    readonly faceIdOrUnapprovedIdentityAdapterAllowed: false
  }
  readonly generationCanvas: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'full_frame_ratio_extension_required'
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly finalOutputFrameExpectationDigestSha256: string
    readonly finalOutputFrameWidthPixels: number
    readonly finalOutputFrameHeightPixels: number
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly attemptPolicy: {
    readonly oneImagePerAttempt: true
    readonly sharedSceneAttemptBudget: true
    readonly maximumSceneAttemptCount: number
    readonly deterministicSeedDerivedServerSide: true
    readonly callerSeedAllowed: false
  }
  readonly downstreamPolicy: {
    readonly generatedArtifactType:
      'living_frame_generated_opaque_still_png'
    readonly stillAlphaPipelineRequired: boolean
    readonly finalRenderMayUseOpaqueRectangle: false
    readonly aiVideoFallbackAllowed: false
    readonly remotionOwnsFinalComposition: true
  }
  readonly rawConditioningTextIncluded: false
  readonly imageBytesIncluded: false
  readonly modelBytesPathUrlOrFilenameIncluded: false
  readonly requestUnitDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneRequestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_CLASS
  readonly projectionState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_REQUEST_STATE
  readonly requestBindingId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly approvedLineageBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly executionRequirementsDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly assetWorkInputBindingDigestSha256: string
    readonly estimateWorkAssetProjectionDigestSha256: string
    readonly customerEstimateAuthorityDigestSha256: string
    readonly controlledIllustrationCostWorkBindingDigestSha256:
      string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly selectedSceneContractDigestSha256: string
    readonly visualContinuityPackDigestSha256: string | null
    readonly outputFrameExpectationDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
  }
  readonly selectedSceneSummary: {
    readonly mode: LivingFrameMode
    readonly sourceTruthMode: LivingFrameSourceTruthMode
    readonly narrativePurposeCode:
      LivingFrameNarrativePurposeCode
    readonly visualVerb: LivingFrameVisualVerb
    readonly importance: LivingFrameImportance
    readonly generatedComponentCount: number
  }
  readonly operationExpectation: {
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly workItemType: 'generate_image_asset'
    readonly workerType: 'gpu_ai_worker'
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly exactModelManifestRoleCount: 5
    readonly modelArtifactsTravelInRequestBindings: false
    readonly oneRequestUnitProducesOneImage: true
    readonly sixCapabilityToolIdentityFanoutAllowed: false
    readonly fiveGpuCapabilityChargesAllowed: false
    readonly auraFaceRunsInsideGpuAttempt: false
  }
  readonly requestUnits:
    readonly LivingFrameControlledImageSelectedSceneRequestUnit[]
  readonly metrics: {
    readonly requestUnitCount: number
    readonly readyRequestUnitCount: number
    readonly blockedRequestUnitCount: number
    readonly structureConditionedUnitCount: number
    readonly referenceConditionedUnitCount: number
    readonly loraConditionedUnitCount: number
    readonly maximumPrivateInputImageCountPerUnit: number
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneRequestOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneRequestAuthority
  readonly currentApprovedSnapshotLineageRevalidated: true
  readonly currentCanonicalWorkGraphRevalidated: true
  readonly selectedSceneRequestProjectionImplemented: true
  readonly benchmarkRequestMaySubstituteForSelectedSceneRequest:
    false
  readonly executableComfyUiPromptIncluded: false
  readonly callerPromptPathUrlCommandCredentialOrModelChoiceAllowed:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneRequest
  extends LivingFrameControlledImageSelectedSceneRequestDraft {
  readonly requestBindingDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneRequestIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneRequestIssueCode
  readonly path: string
}
