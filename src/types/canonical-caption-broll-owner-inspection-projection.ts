import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionBrollAuthenticatedEvidenceRecord,
} from './canonical-caption-broll-support'
import type {
  CanonicalCaptionDirectVisualInspectionEvidence,
} from './canonical-caption-direct-visual-inspection-evidence'
import type { BrollCaptionOwnerReadResult } from
  './caption-broll-owner-read-adapter'
import type { SkillContractRef } from './orchestra-skill-contracts'

export const CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_REQUEST_VERSION =
  'canonical-caption-broll-owner-inspection-projection-request-v1' as const
export const CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_READ_PORT_VERSION =
  'canonical-caption-broll-owner-inspection-bundle-read-port-v1' as const
export const CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_REPOSITORY_VERSION =
  'canonical-caption-broll-owner-inspection-bundle-repository-v1' as const
export const CANONICAL_CAPTION_BROLL_OWNER_EVIDENCE_READ_PORT_VERSION =
  'canonical-caption-broll-owner-inspection-evidence-read-port-v1' as const
export const CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_VERSION =
  'canonical-caption-broll-owner-inspection-approved-run-authority-v1' as const
export const CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_READ_PORT_VERSION =
  'canonical-caption-broll-owner-inspection-authority-read-port-v1' as const
export const CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_SERVICE_VERSION =
  'canonical-caption-broll-owner-inspection-projection-service-v1' as const

export type CanonicalCaptionBrollOwnerInspectionVariant =
  | 'full_motion'
  | 'reduced_motion'

export interface CanonicalCaptionBrollOwnerInspectionScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planVersionId: string
  approvedSnapshotRef: CaptionDomainRef
  executionPackageRef: CaptionDomainRef
  outputId: string
  sceneId: string
  authorizedFrameRange: {
    startFrame: number
    endFrameExclusive: number
    fps: number
  }
  masterTimingRef: CaptionDomainRef
  masterTimingHash: string
}

export interface CanonicalCaptionBrollOwnerInspectionProjectionRequest {
  schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  variant: CanonicalCaptionBrollOwnerInspectionVariant
  receiptRef: CaptionDomainRef
  acceptedReviewSpecRef: CaptionDomainRef
  canonicalScope: CanonicalCaptionBrollOwnerInspectionScope
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  supportRequestRef: SkillContractRef
  expectedBrollEvidenceRecordRef: CaptionDomainRef
  expectedOwnerResultRef: CaptionDomainRef
  expectedSelectedNormalizedArtifactRef: CaptionDomainRef
  exactCaptionReceiptAndReviewSpecsRereadRequired: true
  exactBrollOwnerEvidenceRereadRequired: true
  canonicalApprovedRunAuthorityRereadRequired: true
  canonicalQualificationReaderMustRevalidateAuthority: true
  callerSuppliedReceiptAccepted: false
  callerSuppliedOwnerEvidenceAccepted: false
  callerSuppliedAuthorityAccepted: false
  browserLocalCompletionAccepted: false
  mediaBytesAccepted: false
  pathsUrlsOrCredentialsAccepted: false
  providerCallRequested: false
  operationDispatchAuthorityGranted: false
  repairExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionBrollOwnerInspectionBundle {
  receipt: unknown
  acceptedFullMotionSpec: unknown
  acceptedReducedMotionSpec: unknown
  rejectedFullMotionSpec: unknown
  rejectedReducedMotionSpec: unknown
}

export interface CanonicalCaptionBrollOwnerInspectionBundleLocator {
  canonicalScope: CanonicalCaptionBrollOwnerInspectionScope
  receiptRef: CaptionDomainRef
  variant: CanonicalCaptionBrollOwnerInspectionVariant
}

export interface CanonicalCaptionBrollOwnerInspectionBundleReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_READ_PORT_VERSION
  readonly sourceAuthority:
    'caption_owned_tenant_scoped_persisted_broll_inspection_bundle'
  readonly callerSuppliedReceiptAccepted: false
  readExact(
    input: CanonicalCaptionBrollOwnerInspectionBundleLocator,
  ): Promise<CanonicalCaptionBrollOwnerInspectionBundle | null>
}

export interface CanonicalCaptionBrollOwnerInspectionBundleRepository
  extends CanonicalCaptionBrollOwnerInspectionBundleReadPort {
  readonly repositoryVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_REPOSITORY_VERSION
  persistBundleCreateOnly(input: {
    readonly locator: CanonicalCaptionBrollOwnerInspectionBundleLocator
    readonly bundle: CanonicalCaptionBrollOwnerInspectionBundle
  }): Promise<'created' | 'identical_replay'>
}

export interface CanonicalCaptionBrollOwnerEvidenceSnapshot {
  ownerResult: BrollCaptionOwnerReadResult
  evidenceRecord: CanonicalCaptionBrollAuthenticatedEvidenceRecord
}

export interface CanonicalCaptionBrollOwnerEvidenceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_EVIDENCE_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_caption_broll_evidence_repository'
  readonly callerSuppliedOwnerEvidenceAccepted: false
  readExact(input: {
    readonly supportRequestRef: SkillContractRef
  }): Promise<CanonicalCaptionBrollOwnerEvidenceSnapshot | null>
}

export interface CanonicalCaptionBrollOwnerInspectionAuthority {
  schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_VERSION
  authorityId: string
  authorityDigestSha256: string
  canonicalScope: CanonicalCaptionBrollOwnerInspectionScope
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  supportRequestRef: SkillContractRef
  brollEvidenceRecordRef: CaptionDomainRef
  ownerResultRef: CaptionDomainRef
  selectedNormalizedArtifactRef: CaptionDomainRef
  sourceMediaAuthorityRef: CaptionDomainRef
  sourceMediaBindingRefs: CaptionDomainRef[]
  exactApprovedSnapshotExecutionPackageOutputAndBrollWorkReread: true
  exactBrollOwnerEvidenceAndSelectedArtifactReread: true
  exactMasterTimingFrameAndSceneReread: true
  exactApprovedSourceManifestReread: true
}

export interface CanonicalCaptionBrollOwnerInspectionAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_backend_approved_caption_broll_run_authority'
  readonly callerSuppliedAuthorityAccepted: false
  readExact(input: {
    readonly request:
      CanonicalCaptionBrollOwnerInspectionProjectionRequest
  }): Promise<CanonicalCaptionBrollOwnerInspectionAuthority | null>
}

export interface CanonicalCaptionBrollOwnerInspectionProjectionOutcome {
  disposition: 'projected_canonical_direct_visual_inspection_evidence'
  request: CanonicalCaptionBrollOwnerInspectionProjectionRequest
  evidence: CanonicalCaptionDirectVisualInspectionEvidence
  captionReceiptAndReviewSpecsRereadTwice: true
  brollOwnerEvidenceRereadTwice: true
  canonicalApprovedRunAuthorityRereadTwice: true
  canonicalApprovedRunAuthorityRef: CaptionDomainRef
  evidencePersistedCreateOnlyAndReread: true
  canonicalQualificationReaderMustRevalidateAuthority: true
  currentProductStatusChanged: false
  publicOrProductionAuthorityGranted: false
}

export interface CanonicalCaptionBrollOwnerInspectionProjectionService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_SERVICE_VERSION
  readonly tenantScopedBundleRereadRequired: true
  readonly brollOwnerEvidenceRereadRequired: true
  readonly canonicalApprovedRunAuthorityRereadRequired: true
  readonly canonicalQualificationReaderMustRevalidateAuthority: true
  readonly callerSuppliedReceiptAccepted: false
  readonly callerSuppliedOwnerEvidenceAccepted: false
  readonly callerSuppliedAuthorityAccepted: false
  project(
    request: CanonicalCaptionBrollOwnerInspectionProjectionRequest,
  ): Promise<CanonicalCaptionBrollOwnerInspectionProjectionOutcome>
}
