import type {
  BrollCaptionCanonicalScope,
  BrollCaptionOwnerReadRequest,
  BrollCaptionOwnerReadResult,
} from './caption-broll-owner-read-adapter'
import type { BrollCaptionOpaqueReference } from
  './caption-broll-owner-read-adapter'
import type { CaptionBrollOwnerReadBinding } from
  './caption-multi-track-scene-graph'
import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  CanonicalSpecialistSupportResumeRecord,
} from './canonical-specialist-support-resume'
import type { SkillContractRef } from './orchestra-skill-contracts'

export const CANONICAL_CAPTION_BROLL_AUTHENTICATED_EVIDENCE_RECORD_VERSION =
  'canonical-caption-broll-authenticated-evidence-record-v1' as const
export const CANONICAL_CAPTION_BROLL_OWNER_READ_PORT_VERSION =
  'canonical-caption-broll-owner-read-port-v1' as const
export const CANONICAL_CAPTION_BROLL_APPROVED_SNAPSHOT_READ_PORT_VERSION =
  'canonical-caption-broll-approved-snapshot-read-port-v1' as const

export interface CanonicalCaptionBrollApprovedSnapshotAuthority {
  canonicalScope: BrollCaptionCanonicalScope
  planningConstraintRef: BrollCaptionOpaqueReference
}

export interface CanonicalCaptionBrollApprovedSnapshotReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_APPROVED_SNAPSHOT_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_approved_edit_snapshot_owner'
  readonly callerSuppliedSnapshotAccepted: false
  readExact(input: {
    readonly approvedSnapshotRef: BrollCaptionOpaqueReference
  }): Promise<unknown>
}

export interface CanonicalCaptionBrollOwnerReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_b_roll_owner'
  readonly callerSuppliedOwnerResultAccepted: false
  readExact(input: {
    readonly request: BrollCaptionOwnerReadRequest
  }): Promise<unknown>
}

export interface CanonicalCaptionBrollAuthenticatedEvidenceRecord {
  schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_AUTHENTICATED_EVIDENCE_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  priorCallRef: SkillContractRef
  supportRequestRef: SkillContractRef
  ownerRequest: BrollCaptionOwnerReadRequest
  ownerResult: BrollCaptionOwnerReadResult
  captionBinding: CaptionBrollOwnerReadBinding
  authenticatedOwnerProjection:
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
  createdAt: string
  authenticatedOwnerUserVerified: true
  exactPriorCallAndSupportRequestReread: true
  exactApprovedSnapshotReread: true
  exactOwnerResultReread: true
  exactScopeFrameTimingAndRequestLineageVerified: true
  ownerResultPersistedCreateOnlyAndReread: true
  captionBindingProjectedFromOpaqueOwnerRefs: true
  browserLocalStateUsed: false
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  rawChatIncluded: false
  credentialsIncluded: false
  sourceSelectionPerformedByCaption: false
  cropOrTimingPerformedByCaption: false
  directPeerDispatchPerformed: false
  runtimeExecutionPerformedByBridge: false
  assetMutationPerformedByBridge: false
  costOrBillingMutationPerformedByBridge: false
  finalQaApprovalGrantedByBridge: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionBrollSupportOutcome {
  evidenceRecord: CanonicalCaptionBrollAuthenticatedEvidenceRecord
  resumeRecord: CanonicalSpecialistSupportResumeRecord
}
