export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_MERGE_EVIDENCE_VERSION =
  'living-frame-complete-character-keypose-action-prompt-merge-evidence-v1' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_BINDING_VERSION =
  'living-frame-complete-character-keypose-action-prompt-binding-v1' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_BINDING_ISSUE_CODES = [
  'input_invalid',
  'action_conditioning_invalid',
  'prompt_merge_evidence_invalid',
  'prompt_materialization_invalid',
  'source_lineage_mismatch',
  'unit_set_mismatch',
  'cross_keypose_work_item_or_output_substitution',
  'conditioning_digest_mismatch',
  'graph_policy_invalid',
  'generation_canvas_invalid',
  'unsafe_receipt_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameCompleteCharacterKeyposeActionPromptBindingIssueCode =
  (typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_BINDING_ISSUE_CODES)[number]

export interface LivingFrameCompleteCharacterKeyposeActionPromptBindingIssue {
  readonly code:
    LivingFrameCompleteCharacterKeyposeActionPromptBindingIssueCode
  readonly path: string
}

export interface LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceUnit {
  readonly order: number
  readonly conditioningUnitId: string
  readonly conditioningUnitDigestSha256: string
  readonly selectedSceneRequestUnitId: string
  readonly selectedSceneRequestUnitDigestSha256: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly basePositiveConditioningDigestSha256: string
  readonly positiveActionDirectiveDigestSha256: string
  readonly mergedPositiveConditioningDigestSha256: string
  readonly baseNegativeConditioningDigestSha256: string
  readonly negativeActionDirectiveDigestSha256: string
  readonly mergedNegativeConditioningDigestSha256: string
  readonly rawBaseConditioningIncluded: false
  readonly rawActionDirectiveIncluded: false
  readonly rawMergedConditioningIncluded: false
}

export interface LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_MERGE_EVIDENCE_VERSION
  readonly evidenceClass:
    'process_bound_byte_free_action_conditioning_prompt_merge_evidence'
  readonly mergeState:
    'exact_private_action_conditioning_merged_into_selected_scene_packet'
  readonly mergeEvidenceId: string
  readonly serverOwnedLocatorDigestSha256: string
  readonly sourceBindings: {
    readonly actionConditioningVersion:
      'living-frame-complete-character-keypose-private-action-conditioning-v1'
    readonly actionConditioningId: string
    readonly actionConditioningDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
  }
  readonly units:
    readonly LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceUnit[]
  readonly keyposeUnitCount: 3 | 4
  readonly nonKeyposeSelectedSceneUnitCount: number
  readonly everyActionLeaseConsumedExactlyOnce: true
  readonly nonKeyposeSelectedSceneUnitsUnchanged: true
  readonly rawPromptConditioningAliasImageModelPathUrlBytesCredentialCommandOrEnvironmentIncluded:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence
  extends LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceDraft {
  readonly mergeEvidenceDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposeActionPromptBindingUnit {
  readonly order: number
  readonly promptBindingUnitId: string
  readonly conditioningUnitId: string
  readonly conditioningUnitDigestSha256: string
  readonly materializationUnitId: string
  readonly materializationUnitDigestSha256: string
  readonly selectedSceneRequestUnitId: string
  readonly selectedSceneRequestUnitDigestSha256: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly positiveConditioning: {
    readonly actionDirectiveDigestSha256: string
    readonly mergedConditioningDigestSha256: string
    readonly materializedPromptSlotDigestSha256: string
    readonly exactDigestMatch: true
  }
  readonly negativeConditioning: {
    readonly actionDirectiveDigestSha256: string
    readonly mergedConditioningDigestSha256: string
    readonly materializedPromptSlotDigestSha256: string
    readonly exactDigestMatch: true
  }
  readonly graphPolicy: {
    readonly graphFamily: 'controlled_sdxl_selected_scene_v1'
    readonly controlNetEnabled: true
    readonly genericIpAdapterEnabled: true
    readonly faceIdOrInsightFaceAllowed: false
    readonly inGraphPreprocessorAllowed: false
    readonly arbitrarySaveOrPreviewNodeAllowed: false
    readonly websocketOutputOnly: true
  }
  readonly generationCanvas: {
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly promptBindingUnitDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposeActionPromptBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_BINDING_VERSION
  readonly resultClass:
    'server_derived_non_executable_complete_character_action_prompt_binding'
  readonly bindingState:
    'every_action_keypose_exactly_bound_to_private_materialized_prompt_runtime_blocked'
  readonly promptBindingId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly actionConditioningId: string
    readonly actionConditioningDigestSha256: string
    readonly promptMergeEvidenceId: string
    readonly promptMergeEvidenceDigestSha256: string
    readonly promptMaterializationVersion:
      'living-frame-controlled-image-selected-scene-private-prompt-materialization-v1'
    readonly promptMaterializationBatchId: string
    readonly promptMaterializationDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly currentMasterTimingDigestSha256: string
  }
  readonly promptBindingUnits:
    readonly LivingFrameCompleteCharacterKeyposeActionPromptBindingUnit[]
  readonly metrics: {
    readonly actionKeyposeCount: 3 | 4
    readonly exactPositiveDigestMatchCount: number
    readonly exactNegativeDigestMatchCount: number
    readonly controlNetUnitCount: number
    readonly genericIpAdapterUnitCount: number
  }
  readonly proofBoundary: {
    readonly actionTextRemainsPrivate: true
    readonly receiptContainsOnlyDigestsCountsAndLineage: true
    readonly everyActionKeyposeHasOneMaterializedPrompt: true
    readonly everyMaterializedActionPromptHasOneKeypose: true
    readonly promptMaterializerRemainsCanonicalOwner: true
    readonly operationRequestMayUseOnlyExactBoundMaterializationUnit:
      true
    readonly independentPerFrameGenerationAllowed: false
    readonly professionalVisualAcceptanceRequiredAfterGeneration:
      true
    readonly remotionOwnsFinalCanvas: true
  }
  readonly privatePromptMaterializationReconciled: true
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly actualCostReceiptCreated: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterKeyposeActionPromptBinding
  extends LivingFrameCompleteCharacterKeyposeActionPromptBindingDraft {
  readonly promptBindingDigestSha256: string
}
