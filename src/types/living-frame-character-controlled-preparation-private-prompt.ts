import type {
  LivingFrameCharacterControlledPreparationGraphNodeClass,
  LivingFrameCharacterControlledPreparationPrivateSlotKind,
  LivingFrameCharacterControlledPreparationPurpose,
} from './living-frame-character-controlled-preparation'

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_VERSION =
  'living-frame-character-controlled-preparation-private-prompt-v1' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_CLASS =
  'server_private_single_use_character_preparation_prompt_materialization_receipt' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_STATE =
  'character_preparation_private_prompt_leases_created_dispatch_blocked' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_ISSUE_CODES = [
  'input_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'packet_invalid',
  'preparation_candidate_invalid',
  'source_lineage_mismatch',
  'unit_set_invalid',
  'unit_substitution_forbidden',
  'slot_set_invalid',
  'slot_value_invalid',
  'graph_invalid',
  'lease_invalid',
  'lease_reused',
  'unsafe_receipt_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameCharacterControlledPreparationPrivatePromptIssueCode =
  (typeof
    LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_ISSUE_CODES)[number]

export interface LivingFrameCharacterControlledPreparationPrivatePromptSlotReceipt {
  readonly order: number
  readonly slotKind:
    LivingFrameCharacterControlledPreparationPrivateSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly valueDigestSha256: string
  readonly valueByteLength: number
  readonly valueIncluded: false
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptUnit {
  readonly order: number
  readonly promptUnitId: string
  readonly preparationUnitId: string
  readonly preparationUnitDigestSha256: string
  readonly purpose:
    LivingFrameCharacterControlledPreparationPurpose
  readonly sceneId: string
  readonly componentId: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly graphProfile: {
    readonly graphFamily:
      | 'controlled_sdxl_masked_inpaint_v1'
      | 'controlled_sdxl_selected_scene_v1'
    readonly nodeClasses:
      readonly LivingFrameCharacterControlledPreparationGraphNodeClass[]
    readonly graphTopologyDigestSha256: string
    readonly maskedInpaintUsesVaeEncodeForInpaint:
      boolean
    readonly genericEmptyLatentSubstitutionAllowed:
      false
    readonly inGraphPreprocessorAllowed: false
    readonly faceIdOrInsightFaceAllowed: false
    readonly arbitrarySaveOrPreviewNodeAllowed: false
    readonly websocketOutputOnly: true
  }
  readonly generationCanvas: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly widthPixels: number
    readonly heightPixels: number
    readonly confirmedOutputFrameExpectationDigestSha256:
      string
    readonly callerSelectedDimensionsAllowed: false
    readonly squareFullFrameSubstitutionApplied: false
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly deterministicSeedPolicy: {
    readonly policyVersion:
      'living_frame_character_preparation_server_seed_v1'
    readonly seedDigestSha256: string
    readonly seedIncludedInReceipt: false
    readonly callerSeedAllowed: false
  }
  readonly attemptPolicy: {
    readonly onePromptUnitPerPreparationUnit: true
    readonly oneLeaseRepresentsOneFutureGpuAttempt: true
    readonly oneImagePerAttempt: true
    readonly outputBatchingAllowed: false
    readonly fixedSupervisedProcessRequired: true
    readonly exactModelRoleCount: 5
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly atomicReadOnlyModelMountLifetimeRequired: true
    readonly confinementDigestSha256: string
    readonly deniedTopLevelImports: readonly ['sam2']
  }
  readonly privatePromptRequest: {
    readonly leaseId: string
    readonly promptRequestDigestSha256: string
    readonly serializedPromptRequestByteLength: number
    readonly nodeCount: number
    readonly slotReceipts:
      readonly LivingFrameCharacterControlledPreparationPrivatePromptSlotReceipt[]
    readonly rawPromptIncludedInReceipt: false
    readonly rawConditioningTextIncludedInReceipt: false
    readonly modelOrImageAliasIncludedInReceipt: false
    readonly modelOrImageBytesIncludedInReceipt: false
    readonly pathUrlCredentialCommandOrEnvironmentIncludedInReceipt:
      false
    readonly leaseConsumed: false
  }
  readonly downstreamPolicy: {
    readonly outputContentType: 'image/png'
    readonly outputImageCount: 1
    readonly outputRemainsIntermediate: true
    readonly stillAlphaPipelineRequired: boolean
    readonly opaqueRectangleMayReplaceRequiredAlpha: false
    readonly independentPerFrameGenerationAllowed: false
    readonly rerouteAfterQaRequired: true
    readonly remotionOwnsFinalComposition: true
  }
  readonly operationRegistered: false
  readonly dispatched: false
  readonly gpuAttemptCreated: false
  readonly runtimeExecuted: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly promptUnitDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptAuthority {
  readonly privatePromptMaterializationAuthority: true
  readonly characterPreparationProjectionAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptPlanningAuthority: false
  readonly outputFrameAuthority: false
  readonly timingAuthority: false
  readonly approvalAuthority: false
  readonly approvedWorkItemMutationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly operationRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly actualCostAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_CLASS
  readonly materializationState:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_STATE
  readonly materializationBatchId: string
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
    readonly characterRouteDecisionDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly fullFrameRatioExtensionDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly approvedWorkGraphDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256:
      string
    readonly privatePacketDigestSha256: string
  }
  readonly promptUnits:
    readonly LivingFrameCharacterControlledPreparationPrivatePromptUnit[]
  readonly metrics: {
    readonly preparationUnitCount: number
    readonly promptUnitCount: number
    readonly privateLeaseCount: number
    readonly maskedInpaintPromptCount: number
    readonly isolatedComponentPromptCount: number
    readonly anchorKeyposePromptCount: number
    readonly totalPromptNodeCount: number
    readonly totalPrivateSlotCount: number
  }
  readonly runtimeBoundary: {
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly oneComfyUiIdentityAndOneAttemptCostEventPerOutput:
      true
    readonly weightsAdaptersLibrariesOrPreprocessorsCreateToolIdentity:
      false
    readonly exactFiveModelRolesShareOneAtomicReadOnlyMountLifetime:
      true
    readonly fixedSupervisedEntrypointRequired:
      true
    readonly sam2ImportDenied: true
    readonly noRuntimeDownloadOrNetworkFetch: true
  }
  readonly authorityBoundary:
    LivingFrameCharacterControlledPreparationPrivatePromptAuthority
  readonly preparationCandidateRevalidated: true
  readonly onePromptUnitPerPreparationUnit: true
  readonly processBoundSingleUsePromptLeasesCreated: true
  readonly sourceAndMaskValuesExcludedFromReceipt: true
  readonly callerSeedDimensionsPromptModelPathUrlBytesCredentialCommandOrEnvironmentAllowed:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly runtimeExecuted: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly finalCanvasClaimAllowed: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterControlledPreparationPrivatePrompt
  extends LivingFrameCharacterControlledPreparationPrivatePromptDraft {
  readonly materializationDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptIssue {
  readonly code:
    LivingFrameCharacterControlledPreparationPrivatePromptIssueCode
  readonly path: string
}
