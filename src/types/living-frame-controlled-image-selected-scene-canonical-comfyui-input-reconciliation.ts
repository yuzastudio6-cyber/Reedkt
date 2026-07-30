import type {
  LivingFrameControlledSdxlBenchmarkGraphNodeClass,
} from './living-frame-controlled-sdxl-benchmark-graph-blueprint'

type LivingFrameCanonicalComfyUiPromptInputValue =
  | null
  | boolean
  | number
  | string
  | readonly LivingFrameCanonicalComfyUiPromptInputValue[]
  | {
    readonly [key: string]:
      LivingFrameCanonicalComfyUiPromptInputValue
  }

export type LivingFrameCanonicalComfyUiPromptGraph = Readonly<
  Record<string, {
    readonly class_type:
      LivingFrameControlledSdxlBenchmarkGraphNodeClass
    readonly inputs: Readonly<
      Record<string, LivingFrameCanonicalComfyUiPromptInputValue>
    >
  }>
>

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_VERSION =
  'living-frame-controlled-image-selected-scene-canonical-comfyui-input-reconciliation-v1' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_CLASS =
  'server_private_selected_scene_canonical_comfyui_candidate_input_reconciliation_receipt' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_STATE =
  'canonical_comfyui_candidate_input_lease_created_dispatch_blocked' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_OPEN_GATES =
  [
    'canonical_backend_one_writer_adapter_required',
    'canonical_pending_dispatch_and_attempt_binding_required',
    'canonical_released_image_and_model_mount_required',
    'real_l4_generation_and_resource_receipt_required',
    'create_only_private_output_persistence_required',
    'alpha_continuity_fact_destination_and_private_review_qa_required',
    'asset_manifest_reconciliation_required',
    'remotion_final_composition_required',
  ] as const

export type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_ISSUE_CODES =
  [
    'input_invalid',
    'selected_scene_request_invalid',
    'operation_request_receipt_invalid',
    'operation_request_lease_invalid',
    'operation_request_lease_reused',
    'reader_invalid',
    'reader_reused',
    'reader_failed',
    'packet_invalid',
    'packet_digest_mismatch',
    'source_lineage_mismatch',
    'cross_scene_work_item_or_output_substitution',
    'canonical_alias_mismatch',
    'canonical_graph_mismatch',
    'canonical_canvas_mismatch',
    'canonical_input_image_metadata_mismatch',
    'canonical_work_item_hash_missing',
    'canonical_dispatch_binding_missing',
    'candidate_input_lease_invalid',
    'candidate_input_lease_reused',
    'unsafe_receipt_forbidden',
    'authority_promotion_forbidden',
    'digest_mismatch',
  ] as const

export type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_ISSUE_CODES)[number]

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssueCode
  readonly path: string
}

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationAuthority {
  readonly canonicalCandidateInputReconciliationAuthority: true
  readonly selectedSceneAuthority: false
  readonly promptPlanningAuthority: false
  readonly promptMaterializationAuthority: false
  readonly operationRequestAuthority: false
  readonly canonicalRuntimeCompilerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly modelArtifactAuthority: false
  readonly inputArtifactAuthority: false
  readonly artifactMountAuthority: false
  readonly timingAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly gpuAttemptAuthority: false
  readonly runtimeAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export type LivingFrameCanonicalComfyUiInputImageSlotId =
  | 'control_image_artifact'
  | 'reference_image_artifact'

export type LivingFrameCanonicalComfyUiInputImageFileName =
  | 'control-image.png'
  | 'reference-image.png'

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputImageBinding {
  readonly canonicalOrder: 0 | 1
  readonly slotId: LivingFrameCanonicalComfyUiInputImageSlotId
  readonly fileName: LivingFrameCanonicalComfyUiInputImageFileName
  readonly artifactId: string
  readonly contentSha256: string
  readonly byteLength: number
  readonly width: number
  readonly height: number
  readonly sourceBindingDigestSha256: string
  readonly readOnlyMountRequired: true
}

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput {
  readonly admissionDigestSha256: string
  readonly dispatch: {
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly runtimeRegion: 'europe-west1'
  }
  readonly selectedScene: {
    readonly requestBindingId: string
    readonly requestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHash: string
    readonly workItemId: string
    readonly workItemHash: string
    readonly outputKey: string
    readonly plannedAssetManifestEntryId: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
  }
  readonly prompt: {
    readonly graph: LivingFrameCanonicalComfyUiPromptGraph
    readonly outputNodeId: string
  }
  readonly modelSourceBindingDigests: readonly [
    string,
    string,
    string,
    string,
    string,
  ]
  readonly inputImages:
    readonly LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputImageBinding[]
  readonly output: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly width: number
    readonly height: number
  }
}

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket {
  readonly packetClass:
    'server_owned_selected_scene_canonical_comfyui_candidate_input_binding_packet_v1'
  readonly targetContractVersion:
    'canonical-comfyui-gpu-runtime-request-candidate-v1'
  readonly targetOperationId:
    'tool.comfyui.generate_controlled_image.v1'
  readonly selectedSceneRequestBindingDigestSha256: string
  readonly operationRequestReceiptDigestSha256: string
  readonly privateOperationRequestDigestSha256: string
  readonly materializationUnitId: string
  readonly requestUnitId: string
  readonly sceneId: string
  readonly workItemId: string
  readonly workItemKey: string
  readonly workItemHash: string
  readonly outputKey: string
  readonly plannedAssetManifestEntryId: string
  readonly confirmedOutputFrameExpectationDigestSha256: string
  readonly dispatch: {
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly runtimeRegion: 'europe-west1'
    readonly dispatchAuthority: false
    readonly workerLeaseAuthority: false
    readonly gpuAttemptAuthority: false
  }
  readonly inputImages:
    readonly LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputImageBinding[]
  readonly callerPacketAccepted: false
  readonly callerPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
    false
  readonly canonicalRuntimeCompilerAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readonly packetDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceiptDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_CLASS
  readonly reconciliationState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_STATE
  readonly reconciliationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly exactOutputLineage: {
    readonly materializationUnitId: string
    readonly requestUnitId: string
    readonly componentId: string
    readonly workItemId: string
    readonly workItemKey: string
    readonly workItemHash: string
    readonly outputKey: string
    readonly plannedAssetManifestEntryId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneRequestBindingId: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly operationRequestReceiptId: string
    readonly operationRequestReceiptDigestSha256: string
    readonly privateOperationRequestDigestSha256: string
    readonly admissionCandidateDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly packetDigestSha256: string
  }
  readonly canonicalTarget: {
    readonly requestCandidateVersion:
      'canonical-comfyui-gpu-runtime-request-candidate-v1'
    readonly operationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly outputNodeId: string
    readonly promptGraphDigestSha256: string
    readonly promptNodeCount: number
    readonly modelSourceBindingDigests: readonly [
      string,
      string,
      string,
      string,
      string,
    ]
    readonly inputImages:
      readonly LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputImageBinding[]
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly width: number
    readonly height: number
    readonly exactCanonicalModelAndImageAliasesVerified: true
    readonly exactCanonicalGraphFamilyVerified: true
    readonly exactInputImageMetadataVerified: true
    readonly exactWorkItemHashBound: true
    readonly pendingDispatchAndAttemptLineageBound: true
    readonly oneRequestOneProcessOneImageOneAttempt: true
    readonly remotionFinalCanvasRequired: true
  }
  readonly privateCandidateInput: {
    readonly leaseId: string
    readonly candidateInputDigestSha256: string
    readonly serializedCandidateInputByteLength: number
    readonly rawPromptIncludedInReceipt: false
    readonly privateCandidateInputIncludedInReceipt: false
    readonly callerSerializable: false
    readonly leaseConsumed: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly operationRequestReceiptRevalidated: true
  readonly privateOperationRequestLeaseConsumedExactlyOnce: true
  readonly reconciliationPacketReadThroughProcessBoundPort: true
  readonly canonicalCandidateInputProjected: true
  readonly canonicalRuntimeCompilerInvoked: false
  readonly benchmarkRequestPathUsed: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly gpuAttemptCreated: false
  readonly runtimeExecuted: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly finalCanvasCreatedByComfyUi: false
  readonly containsRawPromptAliasPathUrlModelOrImageBytesCredentialCommandOrEnvironment:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceipt
  extends LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceiptDraft {
  readonly reconciliationDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease {
  readonly leaseClass:
    'process_bound_single_use_non_dispatched_canonical_comfyui_candidate_input_lease_v1'
  readonly leaseId: string
  readonly reconciliationDigestSha256: string
  readonly materializationUnitId: string
  readonly requestUnitId: string
  readonly callerSerializable: false
  readonly canonicalRuntimeCompilerAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly runtimeAuthority: false
  readonly assetAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationResult {
  readonly receipt:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceipt
  readonly privateCandidateInputLease:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease
}
