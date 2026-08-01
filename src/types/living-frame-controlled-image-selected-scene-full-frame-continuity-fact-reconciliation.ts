import type {
  LivingFrameSourceTruthMode,
} from './living-frame'

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_VERSION =
  'living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation-v1' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_CLASS =
  'server_private_selected_scene_full_frame_continuity_fact_requirement_reconciliation_candidate' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_STATE =
  'canonical_continuity_reference_and_fact_evidence_interfaces_pending' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_OPEN_GATES = [
  'validated_visual_continuity_pack_payload_or_immutable_artifact_binding_required',
  'canonical_semantic_style_continuity_qa_owner_binding_required',
  'canonical_persisted_reference_artifact_binding_required_when_reference_conditioned',
  'aligned_same_view_registration_required_before_deterministic_continuity_measurement',
  'canonical_documentary_fact_safety_snapshot_binding_required_when_source_truth_demands_it',
  'canonical_private_artifact_and_asset_qa_evidence_required',
  'living_frame_scene_evidence_package_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameControlledImageSelectedSceneFullFrameContinuityFactOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_ISSUE_CODES = [
  'input_invalid',
  'full_frame_evidence_readiness_invalid',
  'selected_request_unit_missing',
  'cross_scene_component_work_or_output_substitution',
  'continuity_direction_mismatch',
  'reference_alias_promoted_to_artifact_evidence',
  'aligned_measurement_promoted_without_registration',
  'documentary_fact_authority_promoted',
  'unsafe_reconciliation_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_ISSUE_CODES)[number]

export type LivingFrameControlledImageSelectedSceneFullFrameContinuityQaRequirement =
  | 'semantic_style_continuity_qa_required'
  | 'canonical_continuity_revalidation_then_not_applicable'

export type LivingFrameControlledImageSelectedSceneFullFrameReferenceEvidenceRequirement =
  | 'canonical_persisted_reference_artifact_required'
  | 'not_required_for_unconditioned_full_frame_plate'

export type LivingFrameControlledImageSelectedSceneFullFrameAlignedMeasurementEligibility =
  | 'canonical_reference_artifact_and_alignment_registration_required'
  | 'not_applicable_without_reference_conditioning'

export type LivingFrameControlledImageSelectedSceneFullFrameFactEvidenceRequirement =
  | 'canonical_documentary_fact_safety_snapshot_required'
  | 'illustrative_or_fictional_provenance_guard_required'
  | 'controlled_source_revalidation_required'
  | 'unknown_source_truth_blocks_promotion'

export interface LivingFrameControlledImageSelectedSceneFullFrameContinuityFactAuthority {
  readonly serverDerivedReadOnlyRequirementReconciliationAuthority: true
  readonly selectedSceneAuthority: false
  readonly visualContinuityPackAuthority: false
  readonly canonicalReferenceArtifactAuthority: false
  readonly alignmentRegistrationAuthority: false
  readonly continuityMeasurementAuthority: false
  readonly semanticVisualQaAuthority: false
  readonly documentaryFactAuthority: false
  readonly sourceTruthAuthority: false
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
  readonly artifactQaAuthority: false
  readonly sceneEvidencePackageAuthority: false
  readonly assetManifestAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_CLASS
  readonly reconciliationState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_STATE
  readonly reconciliationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly exactOutputLineage: {
    readonly componentId: string
    readonly componentRole: 'opaque_background_plate' | 'reconstructed_background_plate'
    readonly requestUnitId: string
    readonly outputKey: string
    readonly approvedWorkItemId: string
    readonly approvedWorkItemKey: string
    readonly generatedAssetIntentId: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly rendererLayerId: string
    readonly outputCandidateId: string
  }
  readonly sourceBindings: {
    readonly fullFrameEvidenceReadinessDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly visualContinuityPackDigestSha256: string | null
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
  }
  readonly continuityRequirements: {
    readonly continuityQaRequirement:
      LivingFrameControlledImageSelectedSceneFullFrameContinuityQaRequirement
    readonly semanticStyleContinuityQaRequired: boolean
    readonly referenceConditioningRequired: boolean
    readonly referenceEvidenceRequirement:
      LivingFrameControlledImageSelectedSceneFullFrameReferenceEvidenceRequirement
    readonly canonicalPersistedReferenceArtifactRequired: boolean
    readonly validatedVisualContinuityPackPayloadAvailableInSelectedSceneInterface:
      false
    readonly canonicalPersistedReferenceArtifactAvailableInSelectedSceneInterface:
      false
    readonly privatePromptImageAliasIsCanonicalArtifactEvidence: false
    readonly controlledReferenceViewExpectationIsCanonicalArtifactEvidence:
      false
    readonly alignedSameViewMeasurementRequiredAtThisStage: false
    readonly alignedSameViewMeasurementEligibility:
      LivingFrameControlledImageSelectedSceneFullFrameAlignedMeasurementEligibility
    readonly alignedSameViewMeasurementContractVersion:
      'living-frame-visual-continuity-measurement-v1'
    readonly generalSemanticStyleQaMustNotBeRelabeledAsAlignedMeasurement:
      true
  }
  readonly factAndProvenanceRequirements: {
    readonly sourceTruthMode: LivingFrameSourceTruthMode
    readonly factEvidenceRequirement:
      LivingFrameControlledImageSelectedSceneFullFrameFactEvidenceRequirement
    readonly canonicalDocumentaryFactSafetySnapshotRequired: boolean
    readonly documentaryFactSafetyPlanAvailableInCanonicalSelectedSceneComponents:
      false
    readonly generatedIllustrationMayBePresentedAsAuthenticArchiveOrDocumentaryEvidence:
      false
    readonly sourceTruthMustBeRevalidatedByCanonicalOwner: true
  }
  readonly missingCanonicalBridgeInputs: {
    readonly validatedVisualContinuityPackPayloadOrImmutableArtifactBinding:
      true
    readonly canonicalSemanticStyleContinuityQaOwnerBinding: true
    readonly canonicalReferenceArtifactSnapshotSceneComponentViewManifestAndAlignmentBinding:
      boolean
    readonly documentaryFactSafetyPlanSnapshotOrImmutableClaimBinding:
      boolean
  }
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
    readonly registryExpansionPermittedForReleasedDistinctExecutables:
      true
    readonly fakeIdentityForWeightAdapterLibraryPreprocessorOrCapabilityAllowed:
      false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneFullFrameContinuityFactOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneFullFrameContinuityFactAuthority
  readonly fullFrameEvidenceReadinessRevalidated: true
  readonly exactSelectedOutputAndConfirmedFrameLineagePreserved: true
  readonly canonicalReferenceArtifactResolved: false
  readonly alignedSameViewRegistrationResolved: false
  readonly continuityMeasurementExecuted: false
  readonly semanticVisualQaExecuted: false
  readonly documentaryFactSafetyRevalidated: false
  readonly artifactPersisted: false
  readonly artifactQaExecuted: false
  readonly sceneEvidencePackageCompiled: false
  readonly assetManifestMutated: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly finalCanvasCreatedByComfyUi: false
  readonly containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation
  extends LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationDraft {
  readonly reconciliationDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssueCode
  readonly path: string
}
