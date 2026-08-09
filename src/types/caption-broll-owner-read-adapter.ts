import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionBrollOwnerReadBinding } from
  './caption-multi-track-scene-graph'

export const BROLL_CAPTION_OWNER_READ_REQUEST_VERSION =
  'b_roll_caption_owner_read_request_v1' as const
export const BROLL_CAPTION_OWNER_READ_RESULT_VERSION =
  'b_roll_caption_owner_read_result_v1' as const
export const BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT_VERSION =
  'b_roll_caption_public_contract_receipt_v1' as const
export const CAPTION_BROLL_OWNER_READ_ADAPTER_VERSION =
  'caption-broll-owner-read-adapter-v1' as const
export const BROLL_CAPTION_OWNER_READ_RESULT_ARTIFACT_TYPE =
  'b_roll_caption_owner_read_result' as const

export interface BrollCaptionOpaqueReference {
  id: string
  version: string
  contentHash: string
}

export interface BrollCaptionManifestReference {
  schemaVersion: 'edit-skill-manifest-reference-v1'
  skillKey: 'b_roll'
  skillVersion: '1.0.0'
  contractVersion: 'b_roll.skill_contract.v1'
  manifestHash: string
}

export interface BrollCaptionCanonicalScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planVersionId: string
  approvedSnapshotRef: BrollCaptionOpaqueReference
  outputId: string
  outputFrameRef: BrollCaptionOpaqueReference
  sceneId: string
  authorizedFrameRange: {
    startFrameInclusive: number
    endFrameExclusive: number
    fps: number
  }
  masterTimingRef: BrollCaptionOpaqueReference
  masterTimingHash: string
}

export interface BrollCaptionClosedAuthorityBoundary {
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  rawChatIncluded: false
  credentialsIncluded: false
  sourceSelectionAuthorityGranted: false
  cropOrTimingMutationAuthorityGranted: false
  runtimeOrDispatchAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface BrollCaptionOwnerReadRequest
extends BrollCaptionClosedAuthorityBoundary {
  schemaVersion: typeof BROLL_CAPTION_OWNER_READ_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  requestingSkillKey: 'captions'
  ownerSkillKey: 'b_roll'
  requestedJobType: 'provide_caption_broll_composition_constraints'
  mediationMode: 'hq_mediated_owner_read'
  brollManifestRef: BrollCaptionManifestReference
  canonicalScope: BrollCaptionCanonicalScope
  planningConstraintRef: BrollCaptionOpaqueReference
  requestedReferenceRoles: [
    'selectedMediaManifestRef',
    'layoutOccupancyRef',
    'cropTimingRef',
    'visibleTextEvidenceRef',
  ]
}

export interface BrollCaptionOwnerReadResult
extends BrollCaptionClosedAuthorityBoundary {
  schemaVersion: typeof BROLL_CAPTION_OWNER_READ_RESULT_VERSION
  resultId: string
  resultDigestSha256: string
  ownerSkillKey: 'b_roll'
  requestingSkillKey: 'captions'
  requestedJobType: 'provide_caption_broll_composition_constraints'
  mediationMode: 'hq_mediated_owner_read'
  brollManifestRef: BrollCaptionManifestReference
  canonicalScope: BrollCaptionCanonicalScope
  ownerRequestRef: BrollCaptionOpaqueReference
  brollResultReceiptRef: BrollCaptionOpaqueReference
  selectedMediaManifestRef: BrollCaptionOpaqueReference
  layoutOccupancyRef: BrollCaptionOpaqueReference
  cropTimingRef: BrollCaptionOpaqueReference
  visibleTextEvidenceRef: BrollCaptionOpaqueReference
  sourceContractVersions: {
    selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1'
    layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1'
    cropTimingRef: 'b_roll_caption_crop_timing_projection_v1'
    visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1'
  }
  authenticatedOwnerEvidenceRef: BrollCaptionOpaqueReference
  exactPrivateOwnerRereadVerified: true
  exactCanonicalScopeVerified: true
  exactApprovedSnapshotVerified: true
  exactOutputFrameAndMasterTimingVerified: true
  sourceSelectionPerformedByCaption: false
  cropOrTimingPerformedByCaption: false
}

export interface CaptionBrollOwnerReadProjectionAuthority {
  canonicalScope: CaptionDomainCanonicalScope
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  masterTimingHash: string
  authorizedFps: number
  planningConstraintRef: CaptionDomainRef
}

export interface CaptionBrollOwnerReadAdapterReceipt {
  schemaVersion: typeof CAPTION_BROLL_OWNER_READ_ADAPTER_VERSION
  adapterId: string
  adapterDigestSha256: string
  sourcePublicContract: {
    repository: 'yuzastudio6-cyber/Reedkt'
    branch: 'codex/reeditpro-b-roll-skill-end-to-end'
    sourceCommit: string
    evidenceCommit: string
    requestVersion: typeof BROLL_CAPTION_OWNER_READ_REQUEST_VERSION
    requestContractDigestSha256: string
    resultVersion: typeof BROLL_CAPTION_OWNER_READ_RESULT_VERSION
    resultContractDigestSha256: string
    receiptVersion: typeof BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT_VERSION
    receiptDigestSha256: string
    ownerManifestDigestSha256: string
  }
  sourceReferenceContractDigests: {
    selectedMediaManifestRef: string
    layoutOccupancyRef: string
    cropTimingRef: string
    visibleTextEvidenceRef: string
  }
  captionBindingTargetVersion: CaptionBrollOwnerReadBinding['schemaVersion']
  mediationMode: 'hq_mediated_owner_read'
  exactRequestResultScopeBindingRequired: true
  exactCaptionScopeFrameTimingRereadRequired: true
  opaqueReferencesOnly: true
  runtimeBindingDeclared: false
  ownerResultPersistenceDeclared: false
  authenticatedOwnerResultIntegrated: false
  captionMayConstructOwnerResult: false
  captionMaySelectSource: false
  captionMayMutateCropOrTiming: false
  directPeerDispatchAdded: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
