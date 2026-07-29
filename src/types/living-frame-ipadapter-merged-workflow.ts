import type {
  LivingFrameControlledComfyUiBindingKind,
  LivingFrameControlledComfyUiBuiltinNodeClass,
  LivingFrameControlledComfyUiNodeRole,
  LivingFrameControlledComfyUiPort,
  LivingFrameControlledComfyUiWorkflowProfile,
} from './living-frame-controlled-illustration-comfyui-workflow'
import type {
  LivingFrameIpAdapterWorkflowNodeClass,
} from './living-frame-ipadapter-workflow-extension'

export const LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_VERSION =
  'living-frame-ipadapter-merged-workflow-v1' as const

export const LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_CLASS =
  'controlled_non_executable_merged_generic_ipadapter_graph' as const

export const LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_OPEN_GATES = [
  'current_parent_workflow_reread_required',
  'current_ipadapter_extension_reread_required',
  'generic_model_artifact_repository_required',
  'exact_model_compatibility_manifest_required',
  'exact_extension_dependency_lock_required',
  'approved_reference_image_artifact_required',
  'network_off_runtime_confinement_required',
  'canonical_asset_manifest_binding_required',
  'canonical_dispatch_admission_required',
  'private_quality_and_continuity_benchmark_required',
] as const
export type LivingFrameIpAdapterMergedWorkflowOpenGate =
  (typeof LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_OPEN_GATES)[number]

export type LivingFrameIpAdapterMergedNodeClass =
  | LivingFrameControlledComfyUiBuiltinNodeClass
  | LivingFrameIpAdapterWorkflowNodeClass

export type LivingFrameIpAdapterMergedNodeRole =
  | LivingFrameControlledComfyUiNodeRole
  | 'clip_vision_loader'
  | 'generic_ipadapter_model_loader'
  | 'generic_ipadapter_apply'

export type LivingFrameIpAdapterMergedPort =
  | LivingFrameControlledComfyUiPort
  | 'clip_vision'
  | 'ipadapter'
  | 'ipadapter_file'
  | 'clip_name'

export type LivingFrameIpAdapterMergedBindingKind =
  | LivingFrameControlledComfyUiBindingKind
  | 'generic_ipadapter_checkpoint_artifact'
  | 'clip_vision_checkpoint_artifact'
  | 'approved_reference_image_artifact'

export interface LivingFrameIpAdapterMergedWorkflowNode {
  readonly nodeId: string
  readonly nodeOrigin: 'stock_workflow' | 'ipadapter_extension'
  readonly sourceOrder: number
  readonly topologicalOrder: number
  readonly nodeClass: LivingFrameIpAdapterMergedNodeClass
  readonly nodeRole: LivingFrameIpAdapterMergedNodeRole
  readonly executableNode: false
}

export interface LivingFrameIpAdapterMergedWorkflowEdge {
  readonly edgeId: string
  readonly edgeOrigin: 'stock_workflow' | 'ipadapter_extension'
  readonly sourceOrder: number
  readonly fromNodeId: string
  readonly fromPort: LivingFrameIpAdapterMergedPort
  readonly toNodeId: string
  readonly toPort: LivingFrameIpAdapterMergedPort
}

export interface LivingFrameIpAdapterMergedWorkflowBinding {
  readonly bindingId: string
  readonly bindingOrigin: 'stock_workflow' | 'ipadapter_extension'
  readonly bindingKind: LivingFrameIpAdapterMergedBindingKind
  readonly bindingDigestSha256: string
  readonly targetNodeId: string
  readonly targetPort: LivingFrameIpAdapterMergedPort
  readonly artifactResolved: false
}

export interface LivingFrameIpAdapterMergedWorkflowAuthorityBoundary {
  readonly deterministicGraphMaterializationOnly: true
  readonly sourceCurrentTruthAuthority: false
  readonly legalReviewAuthority: false
  readonly packageAuthority: false
  readonly installationAuthority: false
  readonly modelCompatibilityAuthority: false
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

export interface LivingFrameIpAdapterMergedWorkflowDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_CLASS
  readonly mergedWorkflowId: string
  readonly profile: LivingFrameControlledComfyUiWorkflowProfile
  readonly sourceBindings: {
    readonly stockWorkflowExpectationId: string
    readonly stockWorkflowExpectationDigestSha256: string
    readonly stockWorkflowGateSetDigestSha256: string
    readonly ipAdapterExtensionId: string
    readonly ipAdapterExtensionDigestSha256: string
    readonly ipAdapterExtensionGateSetDigestSha256: string
  }
  readonly graph: {
    readonly nodes: readonly LivingFrameIpAdapterMergedWorkflowNode[]
    readonly effectiveEdges:
      readonly LivingFrameIpAdapterMergedWorkflowEdge[]
    readonly externalBindings:
      readonly LivingFrameIpAdapterMergedWorkflowBinding[]
    readonly topologicalNodeIds: readonly string[]
    readonly terminalImageNodeId: string
    readonly supersededStockModelEdgeId: string
    readonly directStockModelEdgePresent: false
    readonly acyclic: true
    readonly deterministicOrder: true
  }
  readonly metrics: {
    readonly stockNodeCount: number
    readonly extensionNodeCount: number
    readonly effectiveNodeCount: number
    readonly stockEdgeCountBeforeSupersession: number
    readonly supersededStockEdgeCount: 1
    readonly extensionEdgeCount: number
    readonly effectiveEdgeCount: number
    readonly externalBindingCount: number
  }
  readonly openGateCodes:
    readonly LivingFrameIpAdapterMergedWorkflowOpenGate[]
  readonly authorityBoundary:
    LivingFrameIpAdapterMergedWorkflowAuthorityBoundary
  readonly parentContractsRevalidated: true
  readonly parentObjectsMutated: false
  readonly genericRouteOnly: true
  readonly faceIdRoutePresent: false
  readonly insightFaceRoutePresent: false
  readonly auraFaceGenerationConditioningPresent: false
  readonly rawPromptOrReferenceImagePresent: false
  readonly filenamePathOrUrlPresent: false
  readonly providerOrToolIdentifierPresent: false
  readonly executableWorkflowPresent: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameIpAdapterMergedWorkflow
  extends LivingFrameIpAdapterMergedWorkflowDraft {
  readonly mergedWorkflowDigestSha256: string
}
