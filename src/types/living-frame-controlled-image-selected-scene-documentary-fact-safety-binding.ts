import type {
  DocumentaryFactSafetyPlan,
  FactClaimStatus,
  FactSafetyVisualTreatment,
} from './reeditpro'
import type {
  LivingFrameSourceTruthMode,
} from './living-frame'

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_VERSION =
  'living-frame-controlled-image-selected-scene-documentary-fact-safety-binding-v1' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_CLASS =
  'server_private_selected_scene_approved_documentary_fact_safety_binding_candidate' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_STATE =
  'approved_fact_safety_bound_private_prompt_merge_pending' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_OPEN_GATES = [
  'canonical_approved_snapshot_fact_safety_reader_required',
  'canonical_scene_to_claim_binding_owner_required',
  'selected_scene_private_prompt_materializer_integration_required',
  'canonical_documentary_fact_review_required',
  'canonical_generated_asset_fact_safety_qa_required',
  'canonical_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_ISSUE_CODES = [
  'input_invalid',
  'selected_scene_request_invalid',
  'reader_invalid',
  'reader_failed',
  'snapshot_packet_invalid',
  'approved_snapshot_mismatch',
  'selected_scene_mismatch',
  'source_truth_mismatch',
  'fact_safety_expectation_mismatch',
  'claim_binding_incomplete',
  'blocking_claim_unresolved',
  'cross_scene_work_item_or_output_substitution',
  'lease_invalid',
  'lease_reused',
  'fact_safety_text_unsafe',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_ISSUE_CODES)[number]

export type LivingFrameSelectedSceneDocumentaryFactSafetyDisposition =
  | 'approved_verified_or_attributed_claim_guard'
  | 'approved_illustrative_interpretation_guard'
  | 'approved_fictional_or_stylized_guard'

export type LivingFrameSelectedSceneDocumentaryFactSafetySeverity =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'

export interface LivingFrameSelectedSceneDocumentaryFactSafetySceneClaimBinding {
  readonly sceneId: string
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly factSafetyExpectationRefIds: readonly string[]
  readonly claimItemIds: readonly string[]
  readonly bindingSource:
    'canonical_approved_snapshot_scene_claim_binding'
}

export interface LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacketDraft {
  readonly packetVersion:
    'canonical-approved-snapshot-documentary-fact-safety-packet-v1'
  readonly approvedSnapshotId: string
  readonly approvedSnapshotHashSha256: string
  readonly selectedSceneBindingDigestSha256: string
  readonly documentaryFactSafetyPlan:
    DocumentaryFactSafetyPlan
  readonly sceneClaimBindings:
    readonly LivingFrameSelectedSceneDocumentaryFactSafetySceneClaimBinding[]
  readonly callerSuppliedPacket: false
  readonly packetContainsProviderPromptModelPathUrlBytesCredentialCommandOrEnvironment:
    false
  readonly factVerificationAuthority: false
  readonly approvalAuthority: false
  readonly snapshotMutationAuthority: false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket
  extends LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacketDraft {
  readonly packetDigestSha256: string
}

export interface LivingFrameSelectedSceneDocumentaryFactSafetySnapshotReaderPort {
  readonly readerClass:
    'process_bound_server_owned_approved_snapshot_documentary_fact_safety_reader_v1'
  readonly sourceAuthority:
    'current_immutable_approved_snapshot_documentary_fact_safety_repository'
  readonly callerPacketAccepted: false
  readonly callerPlanAccepted: false
  readonly callerClaimBindingAccepted: false
  readonly factVerificationAuthority: false
  readonly approvalAuthority: false
  readonly snapshotMutationAuthority: false
  readonly promptAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    serverOwnedFactSafetyLocatorId: string,
  ): Promise<unknown>
}

export interface LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief {
  readonly bindingUnitId: string
  readonly requestUnitId: string
  readonly sceneId: string
  readonly componentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly serverOwnedConditioningLocatorId: string
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly disposition:
    LivingFrameSelectedSceneDocumentaryFactSafetyDisposition
  readonly claimStatusCodes: readonly FactClaimStatus[]
  readonly approvedVisualTreatmentCodes:
    readonly FactSafetyVisualTreatment[]
  readonly positiveFactSafetyConditioningText: string
  readonly negativeFactSafetyConditioningText: string
  readonly rawClaimTextIncluded: false
  readonly rawSafeWordingIncluded: false
  readonly rawSourceLabelIncluded: false
  readonly authenticArchiveOrVerifiedEvidenceClaimAllowed: false
  readonly unsupportedSpecificActDepictionAllowed: false
  readonly finalTextOrSourceAttributionOwnedByImageGenerator: false
}

export interface LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease {
  readonly leaseClass:
    'process_bound_single_use_selected_scene_documentary_fact_safety_brief_lease_v1'
  readonly leaseId: string
  readonly bindingDigestSha256: string
  readonly bindingUnitId: string
  readonly requestUnitId: string
  readonly callerSerializable: false
  readonly promptMergeAuthority: false
  readonly factVerificationAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingUnit {
  readonly order: number
  readonly bindingUnitId: string
  readonly requestUnitId: string
  readonly requestUnitDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly disposition:
    LivingFrameSelectedSceneDocumentaryFactSafetyDisposition
  readonly factSafetyExpectationRefCount: number
  readonly boundClaimCount: number
  readonly sourceRequiredClaimCount: number
  readonly sourceResolvedClaimCount: number
  readonly highestSeverity:
    LivingFrameSelectedSceneDocumentaryFactSafetySeverity
  readonly claimBindingDigestSha256: string
  readonly approvedVisualTreatmentCodes:
    readonly FactSafetyVisualTreatment[]
  readonly privateBriefReceipt: {
    readonly leaseId: string
    readonly positiveFactSafetyConditioningDigestSha256: string
    readonly positiveFactSafetyConditioningByteLength: number
    readonly negativeFactSafetyConditioningDigestSha256: string
    readonly negativeFactSafetyConditioningByteLength: number
    readonly rawClaimTextIncludedInReceipt: false
    readonly rawSafeWordingIncludedInReceipt: false
    readonly rawSourceLabelIncludedInReceipt: false
    readonly rawFactSafetyPlanIncludedInReceipt: false
    readonly privateBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentIncludedInReceipt:
      false
    readonly leaseConsumed: false
  }
  readonly authenticArchiveOrVerifiedEvidenceClaimAllowed: false
  readonly unsupportedSpecificActDepictionAllowed: false
  readonly promptPacketMerged: false
  readonly documentaryFactsVerifiedByThisBinding: false
  readonly bindingUnitDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyAuthority {
  readonly serverDerivedPrivateFactSafetyBindingAuthority: true
  readonly privateFactSafetyConstraintMergeAuthority: true
  readonly selectedSceneAuthority: false
  readonly documentaryFactAuthority: false
  readonly factVerificationAuthority: false
  readonly sourceTruthAuthority: false
  readonly promptAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly snapshotMutationAuthority: false
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
  readonly workItemAuthority: false
  readonly workGraphMutationAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly artifactQaAuthority: false
  readonly assetManifestAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_CLASS
  readonly bindingState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_STATE
  readonly bindingId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly snapshotFactSafetyPacketDigestSha256: string
    readonly documentaryFactSafetyPlanDigestSha256: string
    readonly selectedSceneClaimBindingDigestSha256: string
  }
  readonly factSafetyPlanSummary: {
    readonly planId: string
    readonly active: boolean
    readonly totalClaimCount: number
    readonly selectedSceneBoundClaimCount: number
    readonly selectedSceneFactSafetyExpectationRefCount: number
    readonly blockingClaimCount: 0
    readonly unresolvedSourceRequiredClaimCount: 0
    readonly rawPlanIncludedInReceipt: false
    readonly rawClaimTextIncludedInReceipt: false
    readonly rawSafeWordingIncludedInReceipt: false
    readonly rawSourceLabelIncludedInReceipt: false
  }
  readonly bindingUnits:
    readonly LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingUnit[]
  readonly metrics: {
    readonly bindingUnitCount: number
    readonly verifiedOrAttributedGuardUnitCount: number
    readonly illustrativeGuardUnitCount: number
    readonly fictionalGuardUnitCount: number
    readonly totalBoundClaimCount: number
    readonly sourceResolvedClaimCount: number
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly immutableApprovedSnapshotFactSafetyPacketRevalidated: true
  readonly exactSceneFactSafetyExpectationAndClaimBindingRevalidated: true
  readonly sourceTruthDispositionRevalidated: true
  readonly documentaryFactSafetyPlanCopiedIntoReceipt: false
  readonly documentaryFactsVerifiedByThisBinding: false
  readonly rawClaimTextPassedToImageGenerator: false
  readonly promptPacketMerged: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly runtimeExecuted: false
  readonly gpuAttemptCreated: false
  readonly actualCostReceiptCreated: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly artifactQaExecuted: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly finalCanvasCreatedByComfyUi: false
  readonly containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding
  extends LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingDraft {
  readonly bindingDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingResult {
  readonly receipt:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding
  readonly privateFactSafetyBriefLeases:
    readonly LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease[]
}

export interface LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssueCode
  readonly path: string
}
