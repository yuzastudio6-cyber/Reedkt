export const LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_VERSION =
  'living-frame-ipadapter-workflow-extension-v1' as const

export const LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_CLASS =
  'controlled_non_executable_generic_ipadapter_workflow_extension' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_IPADAPTER_WORKFLOW_NODE_CLASSES = [
  'CLIPVisionLoader',
  'IPAdapterModelLoader',
  'IPAdapterAdvanced',
] as const
export type LivingFrameIpAdapterWorkflowNodeClass =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_WORKFLOW_NODE_CLASSES>

export const LIVING_FRAME_IPADAPTER_WEIGHT_TYPES = [
  'linear',
  'ease_in',
  'ease_out',
] as const
export type LivingFrameIpAdapterWeightType =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_WEIGHT_TYPES>

export const LIVING_FRAME_IPADAPTER_COMBINE_EMBEDS = [
  'concat',
  'average',
  'norm_average',
] as const
export type LivingFrameIpAdapterCombineEmbeds =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_COMBINE_EMBEDS>

export const LIVING_FRAME_IPADAPTER_EMBEDS_SCALING = [
  'v_only',
  'k_plus_v',
] as const
export type LivingFrameIpAdapterEmbedsScaling =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_EMBEDS_SCALING>

export const LIVING_FRAME_IPADAPTER_WORKFLOW_OPEN_GATES = [
  'generic_model_artifact_repository_required',
  'ipadapter_checkpoint_manifest_required',
  'clip_vision_checkpoint_manifest_required',
  'base_model_compatibility_manifest_required',
  'approved_reference_image_artifact_required',
  'gpl3_deployment_legal_review_required',
  'exact_dependency_lock_required',
  'comfyui_compatibility_benchmark_required',
  'network_off_runtime_confinement_required',
  'canonical_asset_manifest_binding_required',
  'canonical_dispatch_admission_required',
  'quality_style_and_continuity_benchmark_required',
] as const
export type LivingFrameIpAdapterWorkflowOpenGate =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_WORKFLOW_OPEN_GATES>

export const LIVING_FRAME_IPADAPTER_WORKFLOW_ISSUE_CODES = [
  'input_invalid',
  'unknown_key',
  'unsafe_input',
  'stock_workflow_invalid',
  'extension_evaluation_invalid',
  'extension_lineage_mismatch',
  'model_edge_missing',
  'model_edge_duplicate',
  'model_edge_invalid',
  'parameter_invalid',
  'binding_invalid',
  'node_set_invalid',
  'edge_set_invalid',
  'gate_set_invalid',
  'faceid_route_forbidden',
  'auraface_generation_route_forbidden',
  'authority_promotion_forbidden',
  'subject_specific_routing_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameIpAdapterWorkflowIssueCode =
  ValueOf<typeof LIVING_FRAME_IPADAPTER_WORKFLOW_ISSUE_CODES>

export interface LivingFrameIpAdapterWorkflowExtensionNode {
  readonly nodeId: string
  readonly order: number
  readonly nodeClass: LivingFrameIpAdapterWorkflowNodeClass
  readonly nodeRole:
    | 'clip_vision_loader'
    | 'generic_ipadapter_model_loader'
    | 'generic_ipadapter_apply'
  readonly builtinStockNode: boolean
  readonly reviewedExtensionNode: boolean
  readonly executableNode: false
}

export interface LivingFrameIpAdapterWorkflowExtensionEdge {
  readonly edgeId: string
  readonly order: number
  readonly fromNodeId: string
  readonly fromPort: 'model' | 'clip_vision' | 'ipadapter'
  readonly toNodeId: string
  readonly toPort: 'model' | 'clip_vision' | 'ipadapter'
}

export interface LivingFrameIpAdapterWorkflowAuthorityBoundary {
  readonly controlledGraphExtensionExpectationOnly: true
  readonly sourceCurrentTruthAuthority: false
  readonly legalReviewAuthority: false
  readonly packageAuthority: false
  readonly installationAuthority: false
  readonly modelWeightAuthority: false
  readonly referenceImageAuthority: false
  readonly identityDecisionAuthority: false
  readonly semanticRouteAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly artifactCreationAuthority: false
  readonly assetManifestAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameIpAdapterWorkflowExtensionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_CLASS
  readonly extensionId: string
  readonly sourceBindings: {
    readonly stockWorkflowExpectationId: string
    readonly stockWorkflowExpectationDigestSha256: string
    readonly ipAdapterSourceEvaluationId: string
    readonly ipAdapterSourceEvaluationDigestSha256: string
  }
  readonly replacedModelEdgeExpectation: {
    readonly stockEdgeId: string
    readonly modelSourceNodeId: string
    readonly samplerNodeId: string
    readonly directModelEdgeMustBeSuperseded: true
    readonly stockWorkflowMutationPerformed: false
  }
  readonly nodes: readonly LivingFrameIpAdapterWorkflowExtensionNode[]
  readonly edges: readonly LivingFrameIpAdapterWorkflowExtensionEdge[]
  readonly externalBindings: readonly [
    {
      readonly bindingKind: 'generic_ipadapter_checkpoint_artifact'
      readonly bindingDigestSha256: string
      readonly targetNodeId: string
      readonly targetPort: 'ipadapter_file'
      readonly artifactResolved: false
    },
    {
      readonly bindingKind: 'clip_vision_checkpoint_artifact'
      readonly bindingDigestSha256: string
      readonly targetNodeId: string
      readonly targetPort: 'clip_name'
      readonly artifactResolved: false
    },
    {
      readonly bindingKind: 'approved_reference_image_artifact'
      readonly bindingDigestSha256: string
      readonly targetNodeId: string
      readonly targetPort: 'image'
      readonly artifactResolved: false
    },
  ]
  readonly applyParameters: {
    readonly weight: number
    readonly weightType: LivingFrameIpAdapterWeightType
    readonly combineEmbeds: LivingFrameIpAdapterCombineEmbeds
    readonly startPercent: number
    readonly endPercent: number
    readonly embedsScaling: LivingFrameIpAdapterEmbedsScaling
  }
  readonly openGateCodes:
    readonly LivingFrameIpAdapterWorkflowOpenGate[]
  readonly authorityBoundary:
    LivingFrameIpAdapterWorkflowAuthorityBoundary
  readonly genericRouteOnly: true
  readonly faceIdRoutePresent: false
  readonly insightFaceRoutePresent: false
  readonly auraFaceGenerationConditioningPresent: false
  readonly rawReferenceImagePresent: false
  readonly filenamePathOrUrlPresent: false
  readonly providerOrToolIdentifierPresent: false
  readonly workOrQueueIdentifierPresent: false
  readonly executableWorkflowPresent: false
  readonly parentContractsRevalidationRequired: true
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameIpAdapterWorkflowExtension
  extends LivingFrameIpAdapterWorkflowExtensionDraft {
  readonly extensionDigestSha256: string
}

export interface LivingFrameIpAdapterWorkflowIssue {
  readonly code: LivingFrameIpAdapterWorkflowIssueCode
  readonly path: string
}

export type LivingFrameIpAdapterWorkflowValidationResult =
  | {
      readonly ok: true
      readonly extension: LivingFrameIpAdapterWorkflowExtension
    }
  | {
      readonly ok: false
      readonly issues: readonly LivingFrameIpAdapterWorkflowIssue[]
    }
