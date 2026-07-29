import type {
  LivingFrameControlledSdxlBenchmarkGraphNodeClass,
} from './living-frame-controlled-sdxl-benchmark-graph-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export const
LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_VERSION =
  'living-frame-controlled-sdxl-private-prompt-materialization-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_CLASS =
  'server_private_single_case_comfyui_prompt_materialization_receipt' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_OPEN_GATES = [
  'current_graph_blueprint_repository_reread_required',
  'current_gpu_node_schema_revalidation_required',
  'dependency_locked_scanned_signed_gpu_image_required',
  'distributed_private_model_mount_required',
  'canonical_comfyui_operation_contract_required',
  'canonical_gpu_attempt_and_internal_cost_evidence_required',
  'canonical_gpu_metric_attestation_required',
  'license_and_paid_use_review_required',
  'selected_scene_snapshot_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameControlledSdxlPrivatePromptMaterializationOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_ISSUES = [
  'input_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'packet_invalid',
  'blueprint_lineage_invalid',
  'recipe_invalid',
  'node_allowlist_violation',
  'node_order_invalid',
  'edge_reference_invalid',
  'slot_set_invalid',
  'slot_value_invalid',
  'prompt_text_invalid',
  'private_alias_invalid',
  'output_policy_invalid',
  'unsafe_receipt_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlPrivatePromptMaterializationIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_ISSUES)[number]

export interface LivingFrameControlledSdxlPrivatePromptSlotReceipt {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly valueDigestSha256: string
  readonly valueByteLength: number
  readonly valueIncluded: false
}

export interface LivingFrameControlledSdxlPrivatePromptMaterializationAuthority {
  readonly processBoundPrivateMaterializationAuthority: true
  readonly graphBlueprintAuthority: false
  readonly promptPlanningAuthority: false
  readonly modelArtifactRepositoryAuthority: false
  readonly modelArtifactMountAuthority: false
  readonly fixtureArtifactAuthority: false
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
  readonly customerCreditAuthority: false
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

export interface LivingFrameControlledSdxlPrivatePromptMaterializationDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_CLASS
  readonly materializationId: string
  readonly serverOwnedLocatorId: string
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly sourceBindings: {
    readonly graphBlueprintId: string
    readonly graphBlueprintDigestSha256: string
    readonly graphRecipeDigestSha256: string
    readonly requestRecipeDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly privateSlotSetDigestSha256: string
  }
  readonly graphSummary: {
    readonly topologicalNodeCount: number
    readonly edgeReferenceCount: number
    readonly externalSlotReferenceCount: number
    readonly outputNodeId:
      'benchmark.bridge.websocket_image_output'
    readonly allowedNodeClasses:
      readonly LivingFrameControlledSdxlBenchmarkGraphNodeClass[]
    readonly websocketOutputOnly: true
  }
  readonly privatePrompt: {
    readonly leaseId: string
    readonly promptDigestSha256: string
    readonly serializedPromptByteLength: number
    readonly nodeCount: number
    readonly slotReceipts:
      readonly LivingFrameControlledSdxlPrivatePromptSlotReceipt[]
    readonly rawPromptIncludedInReceipt: false
    readonly rawConditioningTextIncludedInReceipt: false
    readonly modelOrImageAliasIncludedInReceipt: false
    readonly modelOrImageBytesIncludedInReceipt: false
    readonly filesystemPathOrUrlIncludedInReceipt: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlPrivatePromptMaterializationOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlPrivatePromptMaterializationAuthority
  readonly currentBlueprintRereadThroughProcessBoundPort: true
  readonly allExternalSlotsResolvedExactlyOnce: true
  readonly allNodeEdgesRemainTopological: true
  readonly exactNodeAllowlistPreserved: true
  readonly privatePromptLeaseCreated: true
  readonly privatePromptLeaseConsumed: false
  readonly canonicalOperationRegistered: false
  readonly dispatchReady: false
  readonly gpuAttemptCreated: false
  readonly actualAttemptCostEvidenceCreated: false
  readonly selectedSceneCreated: false
  readonly artifactCreated: false
  readonly containsCallerPathUrlCredentialCommandProviderToolCostOrCommercialRoute:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlPrivatePromptMaterialization
  extends LivingFrameControlledSdxlPrivatePromptMaterializationDraft {
  readonly materializationDigestSha256: string
}

export interface LivingFrameControlledSdxlPrivatePromptMaterializationIssue {
  readonly code:
    LivingFrameControlledSdxlPrivatePromptMaterializationIssueCode
  readonly path: string
}
