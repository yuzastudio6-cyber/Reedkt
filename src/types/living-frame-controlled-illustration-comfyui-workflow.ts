export const LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_VERSION =
  'living-frame-controlled-comfyui-workflow-v2' as const

export const LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_CLASS =
  'controlled_non_executable_comfyui_builtin_graph_expectation' as const

export const LIVING_FRAME_CONTROLLED_COMFYUI_SOURCE_REVISION =
  '093d571b83e7a79833200e199b46b9f5a62217f9' as const

export const LIVING_FRAME_CONTROLLED_COMFYUI_NODES_SOURCE_DIGEST_SHA256 =
  '860b5aa27a99be08627c4f996b2852c998081473a54e7be4f24c6c421f667a8d' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_PROFILES = [
  'base_txt2img',
  'lora_txt2img',
  'controlnet_txt2img',
  'controlnet_lora_txt2img',
] as const
export type LivingFrameControlledComfyUiWorkflowProfile =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_PROFILES>

export const LIVING_FRAME_CONTROLLED_COMFYUI_CONTROL_IMAGE_PREPARATION_MODES = [
  'not_applicable',
  'external_precomputed_control_image_only',
] as const
export type LivingFrameControlledComfyUiControlImagePreparationMode =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_COMFYUI_CONTROL_IMAGE_PREPARATION_MODES
  >

export const LIVING_FRAME_CONTROLLED_COMFYUI_BUILTIN_NODE_CLASSES = [
  'CheckpointLoaderSimple',
  'LoraLoader',
  'CLIPTextEncode',
  'EmptyLatentImage',
  'ControlNetLoader',
  'ControlNetApplyAdvanced',
  'KSampler',
  'VAEDecode',
] as const
export type LivingFrameControlledComfyUiBuiltinNodeClass =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_COMFYUI_BUILTIN_NODE_CLASSES>

export const LIVING_FRAME_CONTROLLED_COMFYUI_NODE_ROLES = [
  'base_checkpoint_loader',
  'lora_loader',
  'positive_conditioning_encoder',
  'negative_conditioning_encoder',
  'empty_latent',
  'controlnet_loader',
  'controlnet_conditioning',
  'sampler',
  'vae_decoder',
] as const
export type LivingFrameControlledComfyUiNodeRole =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_COMFYUI_NODE_ROLES>

export const LIVING_FRAME_CONTROLLED_COMFYUI_PORTS = [
  'ckpt_name',
  'text',
  'control_net_name',
  'lora_name',
  'model',
  'clip',
  'vae',
  'conditioning',
  'positive',
  'negative',
  'control_net',
  'image',
  'latent_image',
  'samples',
] as const
export type LivingFrameControlledComfyUiPort =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_COMFYUI_PORTS>

export const LIVING_FRAME_CONTROLLED_COMFYUI_BINDING_KINDS = [
  'base_checkpoint_artifact_expectation',
  'positive_conditioning_expectation',
  'negative_conditioning_expectation',
  'controlnet_checkpoint_artifact_expectation',
  'control_image_artifact_expectation',
  'lora_artifact_expectation',
] as const
export type LivingFrameControlledComfyUiBindingKind =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_COMFYUI_BINDING_KINDS>

export const LIVING_FRAME_CONTROLLED_COMFYUI_OPEN_GATE_CODES = [
  'base_checkpoint_artifact_resolution_required',
  'approved_conditioning_resolution_required',
  'runtime_model_weight_manifest_required',
  'sampler_scheduler_allowlist_required',
  'comfyui_execution_host_qualification_required',
  'canonical_artifact_manifest_binding_required',
  'canonical_dispatch_admission_required',
  'controlnet_checkpoint_artifact_resolution_required',
  'control_image_artifact_resolution_required',
  'lora_artifact_resolution_required',
  'ip_adapter_runtime_binding_unavailable_in_stock_host',
] as const
export type LivingFrameControlledComfyUiOpenGateCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_COMFYUI_OPEN_GATE_CODES>

export const LIVING_FRAME_CONTROLLED_COMFYUI_ISSUE_CODES = [
  'input_invalid',
  'unknown_key',
  'unsafe_input',
  'source_binding_invalid',
  'profile_invalid',
  'profile_configuration_invalid',
  'frame_invalid',
  'node_set_invalid',
  'node_order_invalid',
  'node_class_invalid',
  'node_role_invalid',
  'node_input_contract_invalid',
  'duplicate_node',
  'edge_set_invalid',
  'duplicate_edge',
  'dangling_edge',
  'cyclic_graph',
  'binding_set_invalid',
  'binding_target_invalid',
  'duplicate_binding',
  'output_binding_invalid',
  'gate_set_invalid',
  'capability_boundary_invalid',
  'control_image_preparation_invalid',
  'authority_promotion_forbidden',
  'subject_specific_routing_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameControlledComfyUiIssueCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_COMFYUI_ISSUE_CODES>

export interface LivingFrameControlledComfyUiGraphNode {
  readonly nodeId: string
  readonly order: number
  readonly nodeClass: LivingFrameControlledComfyUiBuiltinNodeClass
  readonly nodeRole: LivingFrameControlledComfyUiNodeRole
  readonly literalInputs:
    | {
        readonly kind: 'none'
      }
    | {
        readonly kind: 'empty_latent'
        readonly widthPixels: number
        readonly heightPixels: number
        readonly batchSize: 1
      }
    | {
        readonly kind: 'controlnet_application'
        readonly strength: number
        readonly startPercent: number
        readonly endPercent: number
      }
    | {
        readonly kind: 'lora_strength'
        readonly strengthModel: number
        readonly strengthClip: number
      }
    | {
        readonly kind: 'sampler_policy'
        readonly seedBindingRequired: true
        readonly samplerAllowlistBindingRequired: true
        readonly schedulerAllowlistBindingRequired: true
        readonly stepCountBindingRequired: true
        readonly cfgBindingRequired: true
        readonly denoiseBindingRequired: true
      }
  readonly builtinSourceObservedOnly: true
  readonly executableNode: false
}

export interface LivingFrameControlledComfyUiGraphEdge {
  readonly edgeId: string
  readonly fromNodeId: string
  readonly fromPort: LivingFrameControlledComfyUiPort
  readonly toNodeId: string
  readonly toPort: LivingFrameControlledComfyUiPort
}

export interface LivingFrameControlledComfyUiExternalBindingExpectation {
  readonly bindingExpectationId: string
  readonly bindingKind: LivingFrameControlledComfyUiBindingKind
  readonly bindingDigestSha256: string
  readonly targetNodeId: string
  readonly targetPort: LivingFrameControlledComfyUiPort
  readonly runtimeValuePresent: false
  readonly filenamePresent: false
  readonly pathPresent: false
  readonly urlPresent: false
  readonly promptTextPresent: false
  readonly providerOrToolIdPresent: false
  readonly artifactResolved: false
}

export interface LivingFrameControlledComfyUiCapabilityBoundary {
  readonly stockCheckpointLoaderObserved: true
  readonly stockControlNetNodesObserved: true
  readonly stockLoraLoaderObserved: true
  readonly stockIpAdapterNodeObserved: false
  readonly stockControlNetAuxPreprocessorObserved: false
  readonly customNodeExecutionAllowed: false
  readonly customPreprocessorExecutionAllowed: false
  readonly ipAdapterExecutionSupported: false
  readonly auraFaceGenerationConditioningSupported: false
  readonly auraFaceContinuityQaIsSeparate: true
  readonly copiedAnnotatorsQualified: false
  readonly modelWeightsQualified: false
  readonly runtimeDependencyClosurePresent: false
}

export interface LivingFrameControlledComfyUiAuthorityBoundary {
  readonly controlledSourceGraphExpectationOnly: true
  readonly sourceCurrentTruthAuthority: false
  readonly installationAuthority: false
  readonly packageAuthority: false
  readonly containerAuthority: false
  readonly modelWeightAuthority: false
  readonly promptAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly selectedSceneAuthority: false
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

export interface LivingFrameControlledComfyUiControlImagePreparation {
  readonly mode:
    LivingFrameControlledComfyUiControlImagePreparationMode
  readonly controlImageRequired:
    boolean
  readonly externalContentAddressedArtifactRequired:
    boolean
  readonly inGraphPreprocessorPresent: false
  readonly customPreprocessorRequired: false
  readonly controlNetAuxRequired: false
  readonly controlImageEvidenceAndQaRequired:
    boolean
}

export interface LivingFrameControlledComfyUiWorkflowExpectationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_CLASS
  readonly workflowExpectationId: string
  readonly profile: LivingFrameControlledComfyUiWorkflowProfile
  readonly sourceBindings: {
    readonly comfyUiRevisionSha1:
      typeof LIVING_FRAME_CONTROLLED_COMFYUI_SOURCE_REVISION
    readonly nodesSourceDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_COMFYUI_NODES_SOURCE_DIGEST_SHA256
    readonly controlledIllustrationQualificationDigestSha256: string
    readonly controlledIllustrationSourceObservationDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
  }
  readonly frameExpectation: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly batchSize: 1
    readonly exactOutputFrameRevalidationRequired: true
  }
  readonly nodes: readonly LivingFrameControlledComfyUiGraphNode[]
  readonly edges: readonly LivingFrameControlledComfyUiGraphEdge[]
  readonly externalBindingExpectations:
    readonly LivingFrameControlledComfyUiExternalBindingExpectation[]
  readonly controlImagePreparation:
    LivingFrameControlledComfyUiControlImagePreparation
  readonly terminalImageNodeId: string
  readonly openGateCodes: readonly LivingFrameControlledComfyUiOpenGateCode[]
  readonly capabilityBoundary: LivingFrameControlledComfyUiCapabilityBoundary
  readonly authorityBoundary: LivingFrameControlledComfyUiAuthorityBoundary
  readonly graphAcyclic: true
  readonly graphDeterministicallyOrdered: true
  readonly rawPromptPresent: false
  readonly fileOrUrlPresent: false
  readonly executableWorkflowPresent: false
  readonly customNodePresent: false
  readonly providerOrToolIdentifierPresent: false
  readonly workOrQueueIdentifierPresent: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledComfyUiWorkflowExpectation
  extends LivingFrameControlledComfyUiWorkflowExpectationDraft {
  readonly expectationDigestSha256: string
}

export interface LivingFrameControlledComfyUiIssue {
  readonly code: LivingFrameControlledComfyUiIssueCode
  readonly path: string
}

export type LivingFrameControlledComfyUiValidationResult =
  | {
      readonly ok: true
      readonly expectation:
        LivingFrameControlledComfyUiWorkflowExpectation
    }
  | {
      readonly ok: false
      readonly issues: readonly LivingFrameControlledComfyUiIssue[]
    }
