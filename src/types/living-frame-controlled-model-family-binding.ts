import type {
  LivingFrameControlledComfyUiBindingKind,
  LivingFrameControlledComfyUiWorkflowProfile,
} from './living-frame-controlled-illustration-comfyui-workflow'

export const LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_VERSION =
  'living-frame-controlled-model-family-binding-v1' as const

export const LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_CLASS =
  'controlled_non_promotable_model_family_coherence_binding' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_CONTROLLED_MODEL_FAMILIES = [
  'stable_diffusion_1_5',
  'stable_diffusion_xl_base_1_0',
] as const
export type LivingFrameControlledModelFamily =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_MODEL_FAMILIES>

export const LIVING_FRAME_CONTROLLED_CLIP_VISION_FAMILIES = [
  'clip_vision_vit_h_14',
  'clip_vision_vit_big_g_14',
] as const
export type LivingFrameControlledClipVisionFamily =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_CLIP_VISION_FAMILIES>

export const LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ROLES = [
  'base_checkpoint',
  'controlnet_checkpoint',
  'lora_adapter',
  'generic_ipadapter_checkpoint',
  'clip_vision_checkpoint',
] as const
export type LivingFrameControlledModelFamilyRole =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ROLES>

export const LIVING_FRAME_CONTROLLED_MODEL_FAMILY_OPEN_GATES = [
  'generic_model_artifact_repository_required',
  'checksum_protected_read_only_mount_required',
  'exact_artifact_manifest_entries_required',
  'artifact_metadata_independent_verification_required',
  'exact_runtime_dependency_lock_required',
  'model_and_adapter_license_review_required',
  'offline_host_compatibility_benchmark_required',
  'quality_and_fallback_benchmark_required',
  'canonical_asset_work_dispatch_and_qa_binding_required',
  'approved_plan_snapshot_and_private_review_required',
] as const
export type LivingFrameControlledModelFamilyOpenGate =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_MODEL_FAMILY_OPEN_GATES>

export const LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ISSUES = [
  'input_invalid',
  'unknown_key',
  'unsafe_input',
  'stock_workflow_invalid',
  'control_image_binding_invalid',
  'control_image_binding_missing',
  'control_image_binding_unexpected',
  'control_image_lineage_mismatch',
  'ipadapter_extension_invalid',
  'ipadapter_merged_workflow_invalid',
  'ipadapter_inputs_incomplete',
  'ipadapter_lineage_mismatch',
  'family_declaration_missing',
  'family_declaration_unexpected',
  'base_family_mismatch',
  'clip_vision_family_mismatch',
  'binding_expectation_missing',
  'binding_expectation_duplicate',
  'authority_promotion_forbidden',
  'subject_specific_routing_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameControlledModelFamilyIssueCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ISSUES>

export type LivingFrameControlledModelBindingKind =
  | Extract<
      LivingFrameControlledComfyUiBindingKind,
      | 'base_checkpoint_artifact_expectation'
      | 'controlnet_checkpoint_artifact_expectation'
      | 'lora_artifact_expectation'
    >
  | 'generic_ipadapter_checkpoint_artifact'
  | 'clip_vision_checkpoint_artifact'

export interface LivingFrameControlledBaseFamilyExpectation {
  readonly order: 1
  readonly role: 'base_checkpoint'
  readonly bindingKind: 'base_checkpoint_artifact_expectation'
  readonly bindingDigestSha256: string
  readonly expectedBaseModelFamily: LivingFrameControlledModelFamily
  readonly controlledExpectationOnly: true
  readonly artifactResolved: false
  readonly artifactMetadataVerified: false
  readonly compatibilityBenchmarkPassed: false
}

export interface LivingFrameControlledAdapterFamilyExpectation {
  readonly order: number
  readonly role:
    | 'controlnet_checkpoint'
    | 'lora_adapter'
    | 'generic_ipadapter_checkpoint'
  readonly bindingKind:
    | 'controlnet_checkpoint_artifact_expectation'
    | 'lora_artifact_expectation'
    | 'generic_ipadapter_checkpoint_artifact'
  readonly bindingDigestSha256: string
  readonly expectedBaseModelFamily: LivingFrameControlledModelFamily
  readonly controlledExpectationOnly: true
  readonly artifactResolved: false
  readonly artifactMetadataVerified: false
  readonly compatibilityBenchmarkPassed: false
}

export interface LivingFrameControlledClipVisionFamilyExpectation {
  readonly order: number
  readonly role: 'clip_vision_checkpoint'
  readonly bindingKind: 'clip_vision_checkpoint_artifact'
  readonly bindingDigestSha256: string
  readonly expectedClipVisionFamily:
    LivingFrameControlledClipVisionFamily
  readonly controlledExpectationOnly: true
  readonly artifactResolved: false
  readonly artifactMetadataVerified: false
  readonly compatibilityBenchmarkPassed: false
}

export type LivingFrameControlledModelFamilyExpectation =
  | LivingFrameControlledBaseFamilyExpectation
  | LivingFrameControlledAdapterFamilyExpectation
  | LivingFrameControlledClipVisionFamilyExpectation

export interface LivingFrameControlledModelFamilyBindingAuthority {
  readonly controlledFamilyCoherenceExpectationOnly: true
  readonly currentArtifactAuthority: false
  readonly artifactRepositoryAuthority: false
  readonly artifactManifestAuthority: false
  readonly artifactMetadataAuthority: false
  readonly modelCompatibilityAuthority: false
  readonly modelWeightAuthority: false
  readonly legalReviewAuthority: false
  readonly installationAuthority: false
  readonly packageAuthority: false
  readonly containerAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly semanticRouteAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactCreationAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledModelFamilyBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_CLASS
  readonly bindingId: string
  readonly workflowProfile: LivingFrameControlledComfyUiWorkflowProfile
  readonly sourceBindings: {
    readonly stockWorkflowExpectationId: string
    readonly stockWorkflowExpectationDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly controlImageWorkflowBinding:
      | {
          readonly present: false
        }
      | {
          readonly present: true
          readonly bindingId: string
          readonly bindingDigestSha256: string
        }
    readonly ipAdapterMergedWorkflow:
      | {
          readonly present: false
        }
      | {
          readonly present: true
          readonly extensionId: string
          readonly extensionDigestSha256: string
          readonly mergedWorkflowId: string
          readonly mergedWorkflowDigestSha256: string
        }
  }
  readonly baseModelFamily: LivingFrameControlledModelFamily
  readonly familyExpectations:
    readonly LivingFrameControlledModelFamilyExpectation[]
  readonly coherenceChecks: {
    readonly expectedRolesExactlyMatchGraph: true
    readonly bindingDigestsExactlyMatchGraph: true
    readonly allAdapterFamiliesMatchBaseExpectation: true
    readonly clipVisionFamilyMatchesIpAdapterExpectation: true
    readonly controlImageBindingMatchesWorkflowWhenRequired: true
    readonly ipAdapterMergedGraphMatchesWorkflowWhenPresent: true
  }
  readonly openGateCodes:
    readonly LivingFrameControlledModelFamilyOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledModelFamilyBindingAuthority
  readonly controlledDeclarationRevalidated: true
  readonly currentArtifactMetadataPresent: false
  readonly exactArtifactCompatibilityProven: false
  readonly executableWorkflowPresent: false
  readonly callerModelBytesPathsUrlsOrFilenamesPresent: false
  readonly providerToolWorkQueueOrCostIdentifiersPresent: false
  readonly auraFaceGenerationConditioningPresent: false
  readonly faceIdOrInsightFaceRoutePresent: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledModelFamilyBinding
  extends LivingFrameControlledModelFamilyBindingDraft {
  readonly bindingDigestSha256: string
}

export interface LivingFrameControlledModelFamilyIssue {
  readonly code: LivingFrameControlledModelFamilyIssueCode
  readonly path: string
}
