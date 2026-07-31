import type {
  LivingFrameCharacterControlledPreparationGraphNodeClass,
  LivingFrameCharacterControlledPreparationPrivateSlotKind,
  LivingFrameCharacterControlledPreparationPurpose,
} from './living-frame-character-controlled-preparation'

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_VERSION =
  'living-frame-character-controlled-preparation-canonical-comfyui-reconciliation-v1' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_CLASS =
  'server_private_character_preparation_canonical_comfyui_reconciliation_receipt' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_STATE =
  'component_v1_candidate_lease_created_masked_plate_v2_extension_blocked' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_ISSUE_CODES =
  [
    'input_invalid',
    'preparation_invalid',
    'private_prompt_receipt_invalid',
    'source_lineage_mismatch',
    'unit_set_invalid',
    'lease_set_invalid',
    'lease_invalid',
    'lease_reused',
    'reader_invalid',
    'reader_reused',
    'reader_failed',
    'packet_invalid',
    'unit_binding_invalid',
    'private_slot_binding_invalid',
    'input_image_binding_invalid',
    'private_request_digest_mismatch',
    'canonical_v1_component_graph_mismatch',
    'masked_inpaint_extension_contract_mismatch',
    'cross_scene_work_item_or_output_substitution',
    'unsafe_receipt_forbidden',
    'authority_promotion_forbidden',
    'candidate_input_lease_invalid',
    'candidate_input_lease_reused',
    'digest_mismatch',
  ] as const

export type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssueCode =
  (typeof
    LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_ISSUE_CODES)[number]

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssue {
  readonly code:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssueCode
  readonly path: string
}

export type LivingFrameCharacterCanonicalComfyUiInputImageSlotKind =
  Extract<
    LivingFrameCharacterControlledPreparationPrivateSlotKind,
    | 'control_image_artifact'
    | 'reference_image_artifact'
    | 'source_plate_image_artifact'
    | 'source_plate_inpaint_mask_artifact'
  >

export type LivingFrameCharacterCanonicalComfyUiInputImageFileName =
  | 'control-image.png'
  | 'reference-image.png'
  | 'source-plate.png'
  | 'source-plate-mask.png'

export interface LivingFrameCharacterCanonicalComfyUiInputImageBinding {
  readonly canonicalOrder: number
  readonly slotKind:
    LivingFrameCharacterCanonicalComfyUiInputImageSlotKind
  readonly fileName:
    LivingFrameCharacterCanonicalComfyUiInputImageFileName
  readonly artifactId: string
  readonly contentSha256: string
  readonly byteLength: number
  readonly width: number
  readonly height: number
  readonly sourceBindingDigestSha256: string
  readonly readOnlyMountRequired: true
}

type LivingFrameCharacterCanonicalComfyUiPromptInputValue =
  | null
  | boolean
  | number
  | string
  | readonly LivingFrameCharacterCanonicalComfyUiPromptInputValue[]
  | {
    readonly [key: string]:
      LivingFrameCharacterCanonicalComfyUiPromptInputValue
  }

export type LivingFrameCharacterCanonicalComfyUiPromptGraph = Readonly<
  Record<string, {
    readonly class_type:
      LivingFrameCharacterControlledPreparationGraphNodeClass
    readonly inputs: Readonly<
      Record<
        string,
        LivingFrameCharacterCanonicalComfyUiPromptInputValue
      >
    >
  }>
>

export interface LivingFrameCharacterCanonicalComfyUiV1CandidateInput {
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
    readonly graph:
      LivingFrameCharacterCanonicalComfyUiPromptGraph
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
    readonly LivingFrameCharacterCanonicalComfyUiInputImageBinding[]
  readonly output: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly width: number
    readonly height: number
  }
}

export interface LivingFrameCharacterCanonicalComfyUiV1CandidateInputLease {
  readonly leaseClass:
    'process_bound_single_use_character_canonical_comfyui_v1_candidate_input_lease'
  readonly leaseId: string
  readonly preparationUnitId: string
  readonly candidateInputDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationAuthority {
  readonly characterCanonicalReconciliationAuthority: true
  readonly canonicalRuntimeCompilerAuthority: false
  readonly canonicalContractMutationAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly modelArtifactAuthority: false
  readonly inputArtifactAuthority: false
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
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit {
  readonly order: number
  readonly preparationUnitId: string
  readonly preparationUnitDigestSha256: string
  readonly promptUnitId: string
  readonly promptRequestDigestSha256: string
  readonly purpose:
    LivingFrameCharacterControlledPreparationPurpose
  readonly sceneId: string
  readonly componentId: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedWorkItemHashSha256: string
  readonly outputKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly confirmedOutputFrameExpectationDigestSha256: string
  readonly graphFamily:
    | 'controlled_sdxl_masked_inpaint_v1'
    | 'controlled_sdxl_selected_scene_v1'
  readonly graphTopologyDigestSha256: string
  readonly inputImageBindingCount: number
  readonly disposition:
    | 'canonical_v1_candidate_input_lease_created'
    | 'canonical_v1_incompatible_masked_inpaint_extension_required'
  readonly canonicalV1Compatibility: {
    readonly targetContractVersion:
      'canonical-comfyui-gpu-runtime-request-candidate-v1'
    readonly compatible: boolean
    readonly candidateInputLeaseCreated: boolean
    readonly exactEmptyLatentRequired: true
    readonly exactDenoiseOneRequired: true
    readonly acceptedInputSlotKinds: readonly [
      'control_image_artifact',
      'reference_image_artifact',
    ]
  }
  readonly maskedInpaintExtensionRequirement: {
    readonly required: boolean
    readonly requestedTargetContractVersion:
      'canonical-comfyui-gpu-runtime-request-candidate-v2'
    readonly sameCanonicalToolId: 'comfyui'
    readonly sameCanonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly additionalNodeClass:
      'VAEEncodeForInpaint'
    readonly additionalInputSlotKinds: readonly [
      'source_plate_image_artifact',
      'source_plate_inpaint_mask_artifact',
    ]
    readonly sourcePlateFileName:
      'source-plate.png'
    readonly sourcePlateMaskFileName:
      'source-plate-mask.png'
    readonly growMaskBy: 6
    readonly samplerDenoise: 0.55
    readonly emptyLatentSubstitutionAllowed: false
    readonly arbitraryNodeOrSlotExpansionAllowed: false
    readonly canonicalOneWriterImplementationRequired:
      boolean
  }
  readonly candidateInputReceipt: {
    readonly leaseId: string | null
    readonly candidateInputDigestSha256: string | null
    readonly promptGraphIncluded: false
    readonly conditioningTextIncluded: false
    readonly privateAliasesIncluded: false
    readonly pathUrlBytesCredentialsCommandOrEnvironmentIncluded:
      false
  }
  readonly operationRegistered: false
  readonly dispatched: false
  readonly gpuAttemptCreated: false
  readonly runtimeExecuted: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly unitDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_CLASS
  readonly reconciliationState:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_STATE
  readonly reconciliationId: string
  readonly serverOwnedPacketLocatorId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly preparationContractVersion:
      'living-frame-character-controlled-preparation-v1'
    readonly preparationDigestSha256: string
    readonly privatePromptContractVersion:
      'living-frame-character-controlled-preparation-private-prompt-v1'
    readonly privatePromptMaterializationDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly approvedWorkGraphDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
  }
  readonly observedCanonicalV1: {
    readonly backendReferenceCommit:
      'b6eb48277cbd'
    readonly targetContractVersion:
      'canonical-comfyui-gpu-runtime-request-candidate-v1'
    readonly typeFilePath:
      'server/model-artifacts/canonical-comfyui-gpu-runtime-request-types.ts'
    readonly typeFileGitBlobSha1:
      '212ae080049cee583131f869a42beccb6e09bff2'
    readonly typeFileSha256:
      'e127cdcf31872498b442bf9c1af834a6408ea2f56c862582b62f9dd436bec2b5'
    readonly compilerFilePath:
      'server/model-artifacts/canonical-comfyui-gpu-runtime-request.ts'
    readonly compilerFileGitBlobSha1:
      '20b6e7f5ab1ef228fd06ed92db2bac7de749b866'
    readonly compilerFileSha256:
      '72b81aac5decd59cf7977fc75443c0e41fa7182732eae6b6eab769ae3d884043'
    readonly emptyLatentOnly: true
    readonly maskedInpaintNodeAllowed: false
    readonly sourcePlateAndMaskSlotsAllowed: false
  }
  readonly reconciliationUnits:
    readonly LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit[]
  readonly metrics: {
    readonly preparationUnitCount: number
    readonly canonicalV1CompatibleUnitCount: number
    readonly canonicalV1CandidateInputLeaseCount: number
    readonly maskedInpaintExtensionBlockedUnitCount: number
  }
  readonly runtimeBoundary: {
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly registryExpansionCreatesNewIdentity: false
    readonly modelWeightsAdaptersLibrariesOrCapabilitiesCreateIdentity:
      false
    readonly exactFiveModelRolesShareOneAtomicReadOnlyMountLifetime:
      true
    readonly oneRequestOneSupervisedProcessOneImageOneAttemptOneCostEventPerOutput:
      true
    readonly fixedSupervisedEntrypointRequired: true
    readonly sam2ImportDenied: true
    readonly runtimeDownloadOrNetworkFetchAllowed: false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly authorityBoundary:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationAuthority
  readonly sourcePreparationRevalidated: true
  readonly sourcePrivatePromptRevalidated: true
  readonly canonicalV1ComponentCompatibilityProven: true
  readonly canonicalV1MaskedInpaintIncompatibilityProven: true
  readonly parallelCanonicalCompilerCreated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly gpuAttemptCreated: false
  readonly runtimeExecuted: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation
  extends LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationDraft {
  readonly reconciliationDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationResult {
  readonly receipt:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation
  readonly canonicalV1CandidateInputLeases:
    readonly LivingFrameCharacterCanonicalComfyUiV1CandidateInputLease[]
}
