export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_VERSION =
  'living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation-v1' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_CLASS =
  'server_private_selected_scene_generated_alpha_work_chain_reconciliation_candidate' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_STATES =
  [
    'not_applicable_to_confirmed_full_frame_plate',
    'blocked_by_missing_canonical_generated_alpha_work_chain',
    'exact_canonical_generated_alpha_work_chain_reconciled',
  ] as const

export type LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationState =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_STATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_CONFLICT_CODES =
  [
    'canonical_generation_work_item_missing',
    'canonical_generation_output_missing',
    'canonical_generated_asset_intent_missing',
    'canonical_rembg_work_item_missing',
    'canonical_rembg_source_lineage_mismatch',
    'canonical_rembg_mask_output_missing',
    'canonical_sharp_work_item_missing',
    'canonical_sharp_dependency_lineage_mismatch',
    'canonical_sharp_rgba_output_missing',
    'canonical_multi_output_generation_not_admitted_to_rembg',
  ] as const

export type LivingFrameControlledImageSelectedSceneAlphaWorkChainConflictCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_CONFLICT_CODES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_OPEN_GATES =
  [
    'canonical_selected_scene_generated_alpha_work_chain_required',
    'canonical_rembg_dispatch_completion_and_cost_evidence_required',
    'create_only_mask_artifact_persistence_and_qa_required',
    'canonical_sharp_rgba_component_completion_and_alpha_qa_required',
    'multi_background_destination_continuity_and_documentary_fact_qa_required',
    'asset_manifest_reconciliation_and_private_review_required',
    'remotion_final_composition_required',
  ] as const

export type LivingFrameControlledImageSelectedSceneAlphaWorkChainOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_ISSUE_CODES =
  [
    'input_invalid',
    'selected_scene_request_invalid',
    'output_observation_invalid',
    'work_graph_integrity_invalid',
    'cross_scene_work_item_or_output_substitution',
    'full_frame_alpha_chain_forbidden',
    'unsafe_reconciliation_forbidden',
    'authority_promotion_forbidden',
    'digest_mismatch',
  ] as const

export type LivingFrameControlledImageSelectedSceneAlphaWorkChainIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_ISSUE_CODES)[number]

export interface LivingFrameControlledImageSelectedSceneAlphaWorkChainAuthority {
  readonly serverDerivedReadOnlyReconciliationAuthority: true
  readonly selectedSceneAuthority: false
  readonly outputFrameAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly workerCompletionAuthority: false
  readonly runtimeAuthority: false
  readonly gpuAttemptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphMutationAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly maskArtifactAuthority: false
  readonly alphaComponentAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_CLASS
  readonly reconciliationState:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationState
  readonly reconciliationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly exactOutputLineage: {
    readonly componentId: string
    readonly outputKey: string
    readonly approvedWorkItemId: string
    readonly approvedWorkItemKey: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly rendererLayerId: string
    readonly generationWorkItemKey: string | null
    readonly generatedAssetIntentId: string | null
    readonly rembgWorkItemKey: string | null
    readonly rembgMaskOutputKey: string | null
    readonly sharpWorkItemKey: string | null
    readonly rgbaComponentOutputKey: string | null
  }
  readonly sourceBindings: {
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly privateOutputObservationDigestSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly controlledIllustrationCostWorkBindingDigestSha256:
      string
    readonly confirmedOutputFrameExpectationDigestSha256: string
  }
  readonly workGraphEvidence: {
    readonly generationWorkItemMatched: boolean
    readonly generationOutputMatched: boolean
    readonly exactGeneratedAssetIntentMatched: boolean
    readonly exactRembgGeneratedSourceDependencyMatched: boolean
    readonly rembgMaskExpectedOutputMatched: boolean
    readonly sharpDependsOnExactGenerationAndMask: boolean
    readonly sharpRgbaExpectedOutputMatched: boolean
    readonly generationWorkItemExpectedOutputCount: number
    readonly sourceOutputMaterializationIsPerExactIntent: true
  }
  readonly alphaPipelineExpectation: {
    readonly appliesToIsolatedComponentOnly: true
    readonly fullFramePlateMustNotEnterAlphaPipeline: true
    readonly sourceCanvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly sourceWidthPixels: number
    readonly sourceHeightPixels: number
    readonly sourceMustRemainOpaqueUntilRembg: true
    readonly canonicalRembgToolId: 'rembg'
    readonly canonicalRembgOperationId:
      'tool.rembg.remove_image_background.v1'
    readonly canonicalSharpToolId: 'sharp'
    readonly canonicalSharpOperationId:
      'tool.sharp.prepare_approved_image_asset.v1'
    readonly remotionRemainsFinalCanvasOwner: true
  }
  readonly costLineage: {
    readonly comfyUiGpuAttemptMustNotBeChargedAgain: true
    readonly rembgAndSharpKeepExistingIndependentCostOwners: true
    readonly costAmountIncluded: false
    readonly customerPriceOrCreditIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly registryPolicy: {
    readonly currentObservedCountIsProductCap: false
    readonly registryExpansionPermitted: true
    readonly postAdmissionCountDerivedFromReleasedDistinctIdentities:
      true
    readonly oneComfyUiIdentityForSharedGpuAttempt: true
    readonly fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
      false
  }
  readonly conflictCodes:
    readonly LivingFrameControlledImageSelectedSceneAlphaWorkChainConflictCode[]
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneAlphaWorkChainOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly privateOutputObservationRevalidated: true
  readonly workGraphIntegrityRevalidated: true
  readonly exactSceneComponentWorkItemAndOutputLineageMatched: boolean
  readonly canonicalWorkGraphMutated: false
  readonly rembgRequestCreated: false
  readonly rembgInferenceExecuted: false
  readonly maskArtifactCreated: false
  readonly transparentComponentCreated: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly finalCanvasCreatedByComfyUi: false
  readonly containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation
  extends LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationDraft {
  readonly reconciliationDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneAlphaWorkChainIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainIssueCode
  readonly path: string
}
