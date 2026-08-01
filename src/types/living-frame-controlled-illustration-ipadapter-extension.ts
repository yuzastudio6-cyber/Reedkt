export const LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_VERSION =
  'living-frame-ipadapter-extension-evaluation-v1' as const

export const LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_CLASS =
  'controlled_non_promotable_ipadapter_extension_source_evaluation' as const

export const LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_REVISION =
  'b188a6cb39b512a9c6da7235b880af42c78ccd0d' as const

export const LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_TREE =
  '8e16f8055ae089c28a68c2d9711c1d5d93bb52b8' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_FILE_CODES = [
  'license',
  'pyproject',
  'package_init',
  'ipadapter_plus',
  'utils',
  'cross_attention_patch',
  'image_projection_models',
  'readme',
] as const
export type LivingFrameIpAdapterExtensionSourceFileCode =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_FILE_CODES>

export const LIVING_FRAME_IPADAPTER_EXTENSION_GENERIC_NODE_CLASSES = [
  'IPAdapterModelLoader',
  'IPAdapterAdvanced',
] as const
export type LivingFrameIpAdapterExtensionGenericNodeClass =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_EXTENSION_GENERIC_NODE_CLASSES>

export const LIVING_FRAME_IPADAPTER_EXTENSION_BLOCKED_NODE_CLASSES = [
  'IPAdapterUnifiedLoader',
  'IPAdapterUnifiedLoaderFaceID',
  'IPAdapterInsightFaceLoader',
  'IPAdapterFaceID',
  'IPAdapterFaceIDKolors',
  'IPAAdapterFaceIDBatch',
  'IPAdapterSaveEmbeds',
  'IPAdapterLoadEmbeds',
] as const
export type LivingFrameIpAdapterExtensionBlockedNodeClass =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_EXTENSION_BLOCKED_NODE_CLASSES>

export const LIVING_FRAME_IPADAPTER_EXTENSION_OPEN_GATE_CODES = [
  'source_provenance_review_required',
  'gpl3_deployment_legal_review_required',
  'exact_dependency_lock_required',
  'comfyui_revision_compatibility_benchmark_required',
  'ipadapter_checkpoint_manifest_required',
  'clip_vision_checkpoint_manifest_required',
  'base_model_compatibility_manifest_required',
  'reference_image_artifact_binding_required',
  'generic_model_license_review_required',
  'workflow_compiler_integration_required',
  'security_confinement_review_required',
  'quality_and_identity_benchmark_required',
  'canonical_registry_and_dispatch_admission_required',
  'faceid_and_insightface_route_prohibited',
] as const
export type LivingFrameIpAdapterExtensionOpenGateCode =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_EXTENSION_OPEN_GATE_CODES>

export const LIVING_FRAME_IPADAPTER_EXTENSION_ISSUE_CODES = [
  'input_invalid',
  'unknown_key',
  'unsafe_input',
  'source_binding_invalid',
  'file_observation_invalid',
  'file_observation_order_invalid',
  'duplicate_file_observation',
  'node_boundary_invalid',
  'gate_set_invalid',
  'dependency_boundary_invalid',
  'authority_promotion_forbidden',
  'faceid_promotion_forbidden',
  'subject_specific_routing_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameIpAdapterExtensionIssueCode =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_EXTENSION_ISSUE_CODES>

export interface LivingFrameIpAdapterExtensionSourceFileObservation {
  readonly fileCode: LivingFrameIpAdapterExtensionSourceFileCode
  readonly order: number
  readonly digestSha256: string
  readonly controlledSourceObservationOnly: true
  readonly currentUpstreamTruthAuthority: false
  readonly legalReviewAuthority: false
  readonly runtimeArtifactAuthority: false
}

export interface LivingFrameIpAdapterExtensionNodeBoundary {
  readonly genericAllowlistedNodeClasses:
    readonly LivingFrameIpAdapterExtensionGenericNodeClass[]
  readonly explicitlyBlockedNodeClasses:
    readonly LivingFrameIpAdapterExtensionBlockedNodeClass[]
  readonly genericDirectModelLoaderOnly: true
  readonly genericAdvancedApplyOnly: true
  readonly unifiedLoaderAllowed: false
  readonly faceIdNodeAllowed: false
  readonly insightFaceLoaderAllowed: false
  readonly customFileIoNodeAllowed: false
  readonly arbitraryPluginNodeAllowed: false
  readonly runtimeFilenameSelectionAllowed: false
  readonly runtimeDownloadAllowed: false
}

export interface LivingFrameIpAdapterExtensionDependencyBoundary {
  readonly pluginVersionObservation: '2.0.0'
  readonly declaredSourceLicenseObservation: 'gpl-3.0'
  readonly sourceRepositoryMetadataPointsToOriginalCubiqProject: true
  readonly sourceCommitDateObservation: '2024-09-13'
  readonly torchDependencyObserved: true
  readonly einopsDependencyObserved: true
  readonly comfyUiInternalApiDependencyObserved: true
  readonly optionalInsightFaceCodeObserved: true
  readonly networkDownloadImportObservedInReviewedPythonFiles: false
  readonly dependencyLockPresent: false
  readonly genericIpAdapterWeightManifestPresent: false
  readonly clipVisionWeightManifestPresent: false
  readonly baseModelCompatibilityManifestPresent: false
  readonly modelLicensesIndependentlyApproved: false
  readonly sourceLicenseLegallyApprovedForDeployment: false
  readonly comfyUiCompatibilityProven: false
}

export interface LivingFrameIpAdapterExtensionAuthorityBoundary {
  readonly controlledSourceEvaluationOnly: true
  readonly currentSourceAuthority: false
  readonly legalReviewAuthority: false
  readonly installationAuthority: false
  readonly packageAuthority: false
  readonly containerAuthority: false
  readonly modelWeightAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
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
  readonly identityDecisionAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameIpAdapterExtensionEvaluationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_IPADAPTER_EXTENSION_EVALUATION_CLASS
  readonly evaluationId: string
  readonly sourceBindings: {
    readonly repositoryLocatorCode: 'github_comfyorg_comfyui_ipadapter'
    readonly immutableRevisionSha1:
      typeof LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_REVISION
    readonly sourceTreeSha1:
      typeof LIVING_FRAME_IPADAPTER_EXTENSION_SOURCE_TREE
    readonly controlledIllustrationQualificationDigestSha256: string
    readonly controlledIllustrationSourceObservationDigestSha256: string
    readonly stockComfyUiGraphExpectationDigestSha256: string
  }
  readonly sourceFileObservations:
    readonly LivingFrameIpAdapterExtensionSourceFileObservation[]
  readonly nodeBoundary: LivingFrameIpAdapterExtensionNodeBoundary
  readonly dependencyBoundary:
    LivingFrameIpAdapterExtensionDependencyBoundary
  readonly openGateCodes:
    readonly LivingFrameIpAdapterExtensionOpenGateCode[]
  readonly authorityBoundary:
    LivingFrameIpAdapterExtensionAuthorityBoundary
  readonly genericRouteStructurallyRepresentable: true
  readonly genericRouteQualified: false
  readonly faceIdRouteQualified: false
  readonly auraFaceUsedAsGenerationAdapter: false
  readonly executableWorkflowPresent: false
  readonly packageInstalled: false
  readonly runtimeArtifactPresent: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameIpAdapterExtensionEvaluation
  extends LivingFrameIpAdapterExtensionEvaluationDraft {
  readonly evaluationDigestSha256: string
}

export interface LivingFrameIpAdapterExtensionIssue {
  readonly code: LivingFrameIpAdapterExtensionIssueCode
  readonly path: string
}

export type LivingFrameIpAdapterExtensionValidationResult =
  | {
      readonly ok: true
      readonly evaluation:
        LivingFrameIpAdapterExtensionEvaluation
    }
  | {
      readonly ok: false
      readonly issues: readonly LivingFrameIpAdapterExtensionIssue[]
    }
