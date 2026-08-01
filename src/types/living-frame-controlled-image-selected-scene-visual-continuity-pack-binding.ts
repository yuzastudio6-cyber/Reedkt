import type {
  LivingFrameMode,
  LivingFrameSourceTruthMode,
} from './living-frame'
import type {
  LivingFrameSemanticSceneProposal,
} from './living-frame-semantic-reasoning-request'

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_VERSION =
  'living-frame-controlled-image-selected-scene-visual-continuity-pack-binding-v1' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_CLASS =
  'server_private_selected_scene_visual_continuity_pack_payload_binding_candidate' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_STATE =
  'validated_pack_payload_bound_read_only_pending_canonical_owner_integration' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_OPEN_GATES = [
  'canonical_selected_scene_interface_or_immutable_private_pack_artifact_binding_required',
  'canonical_semantic_style_continuity_qa_owner_binding_required',
  'canonical_reference_artifact_binding_required_if_downstream_reference_conditioning_is_enabled',
  'canonical_documentary_fact_safety_binding_required_when_source_truth_demands_it',
  'approved_prompt_materialization_source_binding_required',
  'canonical_private_artifact_and_asset_qa_evidence_required',
  'living_frame_scene_evidence_package_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_ISSUE_CODES = [
  'input_invalid',
  'semantic_proposal_binding_invalid',
  'semantic_plan_projection_invalid',
  'selected_scene_admission_invalid',
  'selected_scene_binding_invalid',
  'visual_continuity_pack_missing',
  'source_lineage_mismatch',
  'selected_scene_mismatch',
  'semantic_decision_mismatch',
  'scene_design_sheet_mismatch',
  'continuity_expectation_unresolved',
  'cross_scene_or_pack_substitution',
  'reference_expectation_promoted_to_artifact',
  'fact_or_qa_authority_promoted',
  'authority_promotion_forbidden',
  'unsafe_payload_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_ISSUE_CODES)[number]

export type LivingFrameControlledImageSelectedSceneContinuityExpectationKind =
  LivingFrameSemanticSceneProposal['continuityExpectationKinds'][number]

export interface LivingFrameControlledImageSelectedSceneVisualContinuityPackAuthority {
  readonly serverDerivedReadOnlyPackBindingCandidateAuthority: true
  readonly canonicalSelectedSceneMutationAuthority: false
  readonly visualContinuityPackCreationAuthority: false
  readonly immutableArtifactAuthority: false
  readonly referenceArtifactAuthority: false
  readonly semanticVisualQaAuthority: false
  readonly documentaryFactAuthority: false
  readonly sourceTruthAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
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
  readonly promptMaterializationAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly artifactQaAuthority: false
  readonly sceneEvidencePackageAuthority: false
  readonly assetManifestAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedSceneContinuityPackSceneBinding {
  readonly order: number
  readonly sceneLineageDigestSha256: string
  readonly semanticDecisionLineageDigestSha256: string
  readonly sceneDesignSheetDigestSha256: string
  readonly mode: LivingFrameMode
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly requiredContinuityExpectationKinds:
    readonly LivingFrameControlledImageSelectedSceneContinuityExpectationKind[]
  readonly boundContinuityExpectationKinds:
    readonly LivingFrameControlledImageSelectedSceneContinuityExpectationKind[]
  readonly styleBibleDigestSha256: string
  readonly characterSheetDigestsSha256: readonly string[]
  readonly objectSheetDigestsSha256: readonly string[]
  readonly environmentSheetDigestsSha256: readonly string[]
  readonly motionLanguageSheetDigestSha256: string
  readonly soundLanguageSheetDigestSha256: string
  readonly alphaEdgeRulesDigestSha256: string
  readonly continuityLedgerDigestSha256: string
  readonly controlledReferenceViewExpectationCount: number
  readonly semanticStyleContinuityQaRequired: true
  readonly exactDocumentaryFactSafetyBindingRequired: boolean
  readonly referenceViewsAreControlledUnverifiedExpectations: true
  readonly referenceViewsArePersistedReferenceArtifacts: false
  readonly referenceArtifactRequirementResolvedByThisBinding: false
  readonly semanticStyleQaExecuted: false
  readonly documentaryFactSafetyRevalidated: false
}

export interface LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_CLASS
  readonly bindingState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_STATE
  readonly bindingId: string
  readonly canonicalScopeDigestSha256: string
  readonly sourceBindings: {
    readonly canonicalPlanComponentsDigestSha256: string
    readonly deferredLivingFrameComponentDigestSha256: string
    readonly semanticProposalBindingDigestSha256: string
    readonly semanticRequestDigestSha256: string
    readonly semanticResultDigestSha256: string
    readonly semanticPlanProjectionDigestSha256: string
    readonly selectedSceneAdmissionDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly selectorDecisionDigestSha256: string
    readonly visualContinuityPackDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
  }
  readonly packBinding: {
    readonly visualContinuityPackDigestSha256: string
    readonly packCanonicalBindingsDigestSha256: string
    readonly styleBibleDigestSha256: string
    readonly motionLanguageSheetDigestSha256: string
    readonly soundLanguageSheetDigestSha256: string
    readonly alphaEdgeRulesDigestSha256: string
    readonly continuityLedgerDigestSha256: string
    readonly sheetDependencyGraphDigestSha256: string
    readonly expectationRefCount: number
    readonly characterSheetCount: number
    readonly objectSheetCount: number
    readonly environmentSheetCount: number
    readonly sceneDesignSheetCount: number
    readonly continuityLedgerEntryCount: number
    readonly selectedSceneBindingCount: number
    readonly controlledReferenceViewExpectationCount: number
    readonly packPayloadFullyRevalidated: true
    readonly packPayloadEmbeddedInReceipt: false
    readonly immutablePackArtifactCreated: false
    readonly controlledReferenceViewExpectationsAreAssetEvidence: false
    readonly continuityLedgerEntriesAreExecutableAssetEvidence: false
  }
  readonly selectedSceneContinuityBindings:
    readonly LivingFrameControlledImageSelectedSceneContinuityPackSceneBinding[]
  readonly fixedRuntimeAndRegistryPolicy: {
    readonly expectedCanonicalToolId: 'comfyui'
    readonly expectedCanonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly fixedSupervisedProcessEntrypointRequired: true
    readonly runtimeConfinementRequirementDigestSha256: string
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly exactModelArtifactCount: 5
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly atomicReadOnlyMountRequiredForOneAttempt: true
    readonly oneRequestUnitOneImageOneGpuAttemptRequired: true
    readonly fiveGpuCapabilityRolesCreateOneCostEvent: true
    readonly auraFaceCpuQaExcludedFromGpuAttempt: true
    readonly registryExpansionPermittedForReleasedDistinctExecutables: true
    readonly fakeIdentityForWeightAdapterLibraryPreprocessorOrCapabilityAllowed:
      false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackAuthority
  readonly semanticProposalBindingRevalidated: true
  readonly semanticPlanProjectionRevalidated: true
  readonly selectedSceneAdmissionRevalidated: true
  readonly selectedSceneBindingRevalidated: true
  readonly fullVisualContinuityPackPayloadRevalidated: true
  readonly exactSelectedSceneDecisionAndDesignSheetMappingRevalidated: true
  readonly validatedPackPayloadAvailableForReadOnlyDownstreamBinding: true
  readonly canonicalSelectedSceneInterfaceMutated: false
  readonly immutablePackArtifactPersisted: false
  readonly canonicalReferenceArtifactResolved: false
  readonly semanticVisualQaExecuted: false
  readonly documentaryFactSafetyRevalidated: false
  readonly promptMaterializationChanged: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly runtimeExecuted: false
  readonly gpuAttemptCreated: false
  readonly actualCostReceiptCreated: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly finalCanvasCreatedByComfyUi: false
  readonly containsRawPackPayloadOrSubjectSpecificSummaries: false
  readonly containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding
  extends LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingDraft {
  readonly bindingDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssueCode
  readonly path: string
}
