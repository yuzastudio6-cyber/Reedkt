import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
  LivingFrameControlledSdxlCompatibilityBenchmarkComponent,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_VERSION =
  'living-frame-controlled-sdxl-benchmark-graph-blueprint-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_CLASS =
  'controlled_non_executable_subject_neutral_sdxl_benchmark_graph_blueprint' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_STATE =
  'exact_case_graphs_projected_private_slot_materialization_required' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES = [
  'CheckpointLoaderSimple',
  'LoraLoader',
  'CLIPTextEncode',
  'ControlNetLoader',
  'LoadImage',
  'ControlNetApplyAdvanced',
  'EmptyLatentImage',
  'CLIPVisionLoader',
  'IPAdapterModelLoader',
  'IPAdapterAdvanced',
  'KSampler',
  'VAEDecode',
  'SaveImageWebsocket',
] as const

export type LivingFrameControlledSdxlBenchmarkGraphNodeClass =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES = [
  'IPAAdapterFaceIDBatch',
  'IPAdapterFaceID',
  'IPAdapterFaceIDKolors',
  'IPAdapterInsightFaceLoader',
  'IPAdapterLoadEmbeds',
  'IPAdapterSaveEmbeds',
  'IPAdapterUnifiedLoader',
  'IPAdapterUnifiedLoaderFaceID',
  'AIO_Preprocessor',
  'DWPreprocessor',
  'MiDaS-DepthMapPreprocessor',
  'OpenposePreprocessor',
  'PreviewImage',
  'SaveImage',
] as const

export type LivingFrameControlledSdxlBenchmarkGraphDeniedNodeClass =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_ROLES = [
  'base_checkpoint_loader',
  'lora_loader',
  'positive_conditioning_encoder',
  'negative_conditioning_encoder',
  'controlnet_loader',
  'control_image_loader',
  'controlnet_apply',
  'empty_latent',
  'clip_vision_loader',
  'generic_ipadapter_model_loader',
  'reference_image_loader',
  'generic_ipadapter_apply',
  'sampler',
  'vae_decoder',
  'websocket_image_output',
] as const

export type LivingFrameControlledSdxlBenchmarkGraphNodeRole =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_ROLES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_INPUT_NAMES = [
  'ckpt_name',
  'model',
  'clip',
  'lora_name',
  'strength_model',
  'strength_clip',
  'text',
  'control_net_name',
  'image',
  'positive',
  'negative',
  'control_net',
  'strength',
  'start_percent',
  'end_percent',
  'width',
  'height',
  'batch_size',
  'clip_name',
  'ipadapter_file',
  'ipadapter',
  'clip_vision',
  'weight',
  'weight_type',
  'combine_embeds',
  'start_at',
  'end_at',
  'embeds_scaling',
  'seed',
  'steps',
  'cfg',
  'sampler_name',
  'scheduler',
  'denoise',
  'latent_image',
  'samples',
  'vae',
  'images',
] as const

export type LivingFrameControlledSdxlBenchmarkGraphInputName =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_INPUT_NAMES)[number]

export type LivingFrameControlledSdxlBenchmarkGraphLiteralEnum =
  | 'dpmpp_2m'
  | 'karras'
  | 'linear'
  | 'ease_in'
  | 'ease_out'
  | 'concat'
  | 'average'
  | 'norm_average'
  | 'v_only'
  | 'k_plus_v'

export type LivingFrameControlledSdxlBenchmarkGraphInputValue =
  | {
      readonly kind: 'external_slot_reference'
      readonly slotKind:
        LivingFrameControlledSdxlBenchmarkRequestSlotKind
    }
  | {
      readonly kind: 'node_output_reference'
      readonly fromNodeId: string
      readonly outputIndex: number
    }
  | {
      readonly kind: 'literal_integer'
      readonly value: number
    }
  | {
      readonly kind: 'literal_number'
      readonly value: number
    }
  | {
      readonly kind: 'literal_enum'
      readonly value:
        LivingFrameControlledSdxlBenchmarkGraphLiteralEnum
    }

export interface LivingFrameControlledSdxlBenchmarkGraphNodeInput {
  readonly order: number
  readonly inputName:
    LivingFrameControlledSdxlBenchmarkGraphInputName
  readonly value:
    LivingFrameControlledSdxlBenchmarkGraphInputValue
}

export interface LivingFrameControlledSdxlBenchmarkGraphNode {
  readonly nodeId: string
  readonly order: number
  readonly nodeOrigin:
    | 'stock_workflow'
    | 'generic_ipadapter_extension'
    | 'benchmark_graph_bridge'
  readonly nodeClass:
    LivingFrameControlledSdxlBenchmarkGraphNodeClass
  readonly nodeRole:
    LivingFrameControlledSdxlBenchmarkGraphNodeRole
  readonly inputs:
    readonly LivingFrameControlledSdxlBenchmarkGraphNodeInput[]
  readonly outputNode: boolean
  readonly executableNode: false
}

export interface LivingFrameControlledSdxlBenchmarkGraphRecipe {
  readonly order: number
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly recipeClass:
    | 'exact_bundle_load_without_graph'
    | 'case_specific_non_executable_graph_blueprint'
  readonly comparisonCaseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId | null
  readonly enabledComponents:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkComponent[]
  readonly disabledComponents:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkComponent[]
  readonly runtimePolicy:
    | null
    | {
        readonly seed: 19_791_104 | 420_042
        readonly widthPixels: 1024
        readonly heightPixels: 1024
        readonly batchSize: 1
        readonly sampler: 'dpmpp_2m'
        readonly scheduler: 'karras'
        readonly stepCount: 24
        readonly cfg: 5.5
        readonly denoise: 1
      }
  readonly graph: {
    readonly topologicalNodeIds: readonly string[]
    readonly nodes:
      readonly LivingFrameControlledSdxlBenchmarkGraphNode[]
    readonly outputNodeIds:
      readonly [] | readonly ['benchmark.bridge.websocket_image_output']
    readonly referencedSlotKinds:
      readonly LivingFrameControlledSdxlBenchmarkRequestSlotKind[]
    readonly nodeCount: number
    readonly edgeReferenceCount: number
    readonly externalSlotReferenceCount: number
    readonly acyclic: true
    readonly deterministicOrder: true
  }
  readonly requestRecipeDigestSha256: string
  readonly parentGraphParametersReused: true
  readonly disabledCapabilitiesRemovedAndRewired: true
  readonly slotReferencePolicy:
    | 'load_only_slots_remain_request_blueprint_only'
    | 'every_generation_request_slot_referenced_exactly_once'
  readonly everyEdgeTargetsEarlierNode: true
  readonly websocketOutputOnly: true
  readonly apiFormatPromptPresent: false
  readonly externalValuesMaterialized: false
  readonly executableGraphPresent: false
  readonly recipeDigestSha256: string
}

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_OPEN_GATES = [
  'current_request_blueprint_reread_required',
  'current_parent_graphs_reread_required',
  'canonical_comfyui_operation_contract_required',
  'exact_canonical_artifacts_and_read_only_mount_required',
  'dependency_locked_scanned_signed_gpu_image_required',
  'server_owned_conditioning_control_and_reference_fixtures_required',
  'private_slot_materialization_required',
  'current_gpu_node_schema_revalidation_required',
  'runtime_node_allowlist_enforcement_required',
  'canonical_gpu_attempt_and_internal_cost_evidence_required',
  'canonical_gpu_metric_attestation_required',
  'license_and_paid_use_review_required',
  'selected_scene_snapshot_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameControlledSdxlBenchmarkGraphBlueprintOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_ISSUES = [
  'input_invalid',
  'request_blueprint_invalid',
  'stock_workflow_invalid',
  'ipadapter_extension_invalid',
  'merged_workflow_invalid',
  'source_lineage_mismatch',
  'parent_graph_policy_mismatch',
  'case_set_or_order_mismatch',
  'case_component_mismatch',
  'case_runtime_policy_mismatch',
  'slot_reference_mismatch',
  'node_set_or_order_mismatch',
  'node_allowlist_violation',
  'node_denylist_violation',
  'edge_reference_dangling',
  'edge_reference_not_topological',
  'output_node_policy_violation',
  'unsafe_payload_forbidden',
  'authority_promotion_forbidden',
  'subject_specific_routing_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlBenchmarkGraphBlueprintIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_ISSUES)[number]

export interface LivingFrameControlledSdxlBenchmarkGraphBlueprintAuthority {
  readonly deterministicGraphBlueprintAuthority: true
  readonly requestBlueprintAuthority: false
  readonly currentNodeSchemaAuthority: false
  readonly artifactRepositoryAuthority: false
  readonly artifactMountAuthority: false
  readonly fixtureArtifactAuthority: false
  readonly promptAuthority: false
  readonly requestMaterializationAuthority: false
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

export interface LivingFrameControlledSdxlBenchmarkGraphBlueprintDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_CLASS
  readonly graphBlueprintId: string
  readonly graphBlueprintState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_STATE
  readonly sourceBindings: {
    readonly requestBlueprintId: string
    readonly requestBlueprintDigestSha256: string
    readonly benchmarkSpecificationId: string
    readonly benchmarkSpecificationDigestSha256: string
    readonly stockWorkflowExpectationId: string
    readonly stockWorkflowExpectationDigestSha256: string
    readonly ipAdapterExtensionId: string
    readonly ipAdapterExtensionDigestSha256: string
    readonly ipAdapterMergedWorkflowId: string
    readonly ipAdapterMergedWorkflowDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly nodePolicyDigestSha256: string
  }
  readonly nodePolicy: {
    readonly allowedNodeClasses:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES
    readonly deniedNodeClasses:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES
    readonly exactAllowlistOnly: true
    readonly faceIdInsightFaceAndUnifiedLoadersForbidden: true
    readonly inGraphPreprocessorsForbidden: true
    readonly arbitrarySaveAndPreviewNodesForbidden: true
    readonly websocketOutputOnly: true
  }
  readonly recipes:
    readonly LivingFrameControlledSdxlBenchmarkGraphRecipe[]
  readonly metrics: {
    readonly caseCount: 7
    readonly loadOnlyRecipeCount: 1
    readonly graphRecipeCount: 6
    readonly isolatedCapabilityRecipeCount: 3
    readonly combinedRecipeCount: 2
    readonly distinctGraphTopologyCount: 5
    readonly totalGraphNodeCount: 66
    readonly totalExternalSlotReferenceCount: 36
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphBlueprintOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlBenchmarkGraphBlueprintAuthority
  readonly requestBlueprintRevalidated: true
  readonly stockWorkflowRevalidated: true
  readonly ipAdapterExtensionRevalidated: true
  readonly mergedWorkflowRevalidated: true
  readonly sourceLineageMatched: true
  readonly exactCaseGraphsProjected: true
  readonly everyGenerationCaseHasExactGraph: true
  readonly everyGraphUsesClosedNodeAllowlist: true
  readonly everyGraphIsAcyclicAndTopological: true
  readonly everyGenerationGraphReferencesExactRequestSlots: true
  readonly loadOnlyCaseHasNoGraph: true
  readonly currentRuntimeNodeSchemaRevalidationStillRequired: true
  readonly containsRawPromptImagePixelsModelBytesAliasPathUrlFilenameCredentialOrCommand:
    false
  readonly containsProviderToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly requestMaterialized: false
  readonly dispatchReady: false
  readonly benchmarkExecuted: false
  readonly artifactCreated: false
  readonly selectedSceneCreated: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlBenchmarkGraphBlueprint
  extends LivingFrameControlledSdxlBenchmarkGraphBlueprintDraft {
  readonly graphBlueprintDigestSha256: string
}

export interface LivingFrameControlledSdxlBenchmarkGraphBlueprintIssue {
  readonly code:
    LivingFrameControlledSdxlBenchmarkGraphBlueprintIssueCode
  readonly path: string
}
