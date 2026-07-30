import type {
  LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass,
} from './living-frame-controlled-image-selected-scene-private-output-observation'

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_VERSION =
  'living-frame-controlled-image-selected-scene-exact-output-alpha-source-handoff-v1' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_CLASS =
  'server_private_exact_selected_output_alpha_source_handoff_candidate' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_STATE =
  'exact_isolated_output_source_lease_created_canonical_alpha_work_admission_blocked' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_OPEN_GATES =
  [
    'canonical_multi_output_generated_source_selector_admission_required',
    'canonical_rembg_and_sharp_work_item_projection_required',
    'canonical_rembg_dispatch_completion_and_cost_evidence_required',
    'create_only_mask_and_rgba_artifact_persistence_required',
    'component_alpha_continuity_fact_and_destination_qa_required',
    'asset_manifest_reconciliation_and_private_review_required',
    'remotion_final_composition_required',
  ] as const

export type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_ISSUE_CODES =
  [
    'input_invalid',
    'selected_scene_request_invalid',
    'output_observation_invalid',
    'alpha_work_chain_reconciliation_invalid',
    'work_graph_integrity_invalid',
    'source_reader_invalid',
    'source_reader_reused',
    'source_reader_failed',
    'source_reader_lineage_invalid',
    'source_packet_invalid',
    'source_packet_lineage_invalid',
    'source_byte_digest_mismatch',
    'decoded_rgba_digest_mismatch',
    'decoded_rgba_shape_invalid',
    'opaque_alpha_policy_invalid',
    'isolated_component_required',
    'exact_generation_output_selector_invalid',
    'known_canonical_conflict_not_present',
    'cross_scene_work_item_or_output_substitution',
    'lease_invalid',
    'lease_reused',
    'unsafe_handoff_forbidden',
    'authority_promotion_forbidden',
    'digest_mismatch',
  ] as const

export type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_ISSUE_CODES)[number]

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffAuthority {
  readonly privateExactOutputRereadAndLeaseAuthority: true
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
  readonly rembgAdmissionAuthority: false
  readonly rembgDispatchAuthority: false
  readonly maskArtifactAuthority: false
  readonly sharpAdmissionAuthority: false
  readonly alphaComponentAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_CLASS
  readonly handoffState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_STATE
  readonly handoffId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly exactSourceSelector: {
    readonly sourceVariant:
      'living_frame_generated_opaque_still'
    readonly componentId: string
    readonly outputKey: string
    readonly approvedWorkItemId: string
    readonly parentGenerationWorkItemKey: string
    readonly parentExpectedOutputIndex: number
    readonly parentExpectedOutputCount: number
    readonly generatedAssetIntentId: string
    readonly expectedArtifactType:
      'living_frame_generated_opaque_still_png'
    readonly expectedContentType: 'image/png'
    readonly approvedPlannedAssetManifestEntryId: string
    readonly rendererLayerId: string
    readonly outputCandidateId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly privateOutputObservationId: string
    readonly privateOutputObservationDigestSha256: string
    readonly alphaWorkChainReconciliationId: string
    readonly alphaWorkChainReconciliationDigestSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly controlledIllustrationCostWorkBindingDigestSha256:
      string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly sourceReaderBindingDigestSha256: string
  }
  readonly verifiedPrivateSource: {
    readonly evidenceClass:
      LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass
    readonly contentType: 'image/png'
    readonly byteLength: number
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly decodedChannelCount: 4
    readonly decodedRgbaByteLength: 4_194_304
    readonly transparentPixelCount: 0
    readonly semiTransparentPixelCount: 0
    readonly opaquePixelCount: 1_048_576
    readonly sourceIsFfmpegExtractedFrame: false
    readonly sourceIsCommittedArtifact: false
    readonly oneShotReaderConsumed: true
    readonly oneShotPrivateSourceLeaseIssued: true
    readonly verifiedBytesDeliveredOnlyOutOfBand: true
  }
  readonly canonicalOwnerHandoff: {
    readonly canonicalOwnerMustSelectExactParentOutput: true
    readonly parentGenerationMayContainMultipleExactOutputs: true
    readonly duplicateOutputOrAssetIntentMatchAllowed: false
    readonly requiredRembgWorkItemType: 'generate_mask_asset'
    readonly requiredRembgToolId: 'rembg'
    readonly requiredRembgOperationId:
      'tool.rembg.remove_image_background.v1'
    readonly requiredRembgMaskArtifactType:
      'living_frame_alpha_mask_png'
    readonly requiredSharpWorkItemType: 'process_image_asset'
    readonly requiredSharpToolId: 'sharp'
    readonly requiredSharpOperationId:
      'tool.sharp.prepare_approved_image_asset.v1'
    readonly requiredSharpRgbaArtifactType:
      'living_frame_component_rgba_png'
    readonly existingCanonicalWorkGraphRemainsSoleOwner: true
    readonly existingCanonicalAssetManifestRemainsSoleOwner: true
    readonly remotionRemainsFinalCanvasOwner: true
  }
  readonly knownCanonicalConflict: {
    readonly parentGenerationHasMultipleExpectedOutputs: true
    readonly exactGenerationWorkItemMatched: true
    readonly exactGenerationOutputMatched: true
    readonly exactGeneratedAssetIntentMatched: true
    readonly currentCanonicalRembgWorkItemMissing: true
    readonly currentCanonicalSharpWorkItemMissing: true
    readonly canonicalOwnerReconciliationRequired: true
  }
  readonly fixedRuntimeLineage: {
    readonly expectedCanonicalToolId: 'comfyui'
    readonly expectedCanonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly processEntrypointKind:
      'fixed_supervised_python_process'
    readonly runtimeConfinementRequirementDigestSha256: string
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly exactModelArtifactCount: 5
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly allFiveModelRolesMountedReadOnlyForAttempt: true
    readonly oneRequestOneImageOneAttemptRequired: true
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
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly privateOutputObservationRevalidated: true
  readonly alphaWorkChainReconciliationRevalidated: true
  readonly canonicalWorkGraphIntegrityRevalidated: true
  readonly exactPrivateSourceBytesReread: true
  readonly sourceLeaseCreated: true
  readonly canonicalWorkGraphMutated: false
  readonly rembgRequestCreated: false
  readonly rembgInferenceExecuted: false
  readonly sharpRequestCreated: false
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

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff
  extends LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffDraft {
  readonly handoffDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssueCode
  readonly path: string
}
