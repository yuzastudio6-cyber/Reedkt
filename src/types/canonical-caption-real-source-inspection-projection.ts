import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionDirectVisualInspectionEvidence,
} from './canonical-caption-direct-visual-inspection-evidence'

export const CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_REQUEST_VERSION =
  'canonical-caption-real-source-inspection-projection-request-v1' as const
export const CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_READ_PORT_VERSION =
  'canonical-caption-real-source-inspection-bundle-read-port-v1' as const
export const CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_READ_PORT_VERSION =
  'canonical-caption-real-source-inspection-authority-read-port-v1' as const
export const CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_VERSION =
  'canonical-caption-real-source-inspection-authority-v1' as const
export const CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_SERVICE_VERSION =
  'canonical-caption-real-source-inspection-projection-service-v1' as const

export type CanonicalCaptionRealSourceInspectionReceiptKind =
  | 'vertical_complete_time_v1'
  | 'multi_output_complete_time_v1'

export type CanonicalCaptionRealSourceInspectionVariant =
  | 'vertical_full_motion'
  | 'vertical_reduced_motion'
  | 'widescreen_full_motion'
  | 'widescreen_reduced_motion'
  | 'square_full_motion'
  | 'square_reduced_motion'

export interface CanonicalCaptionRealSourceInspectionProjectionRequest {
  schemaVersion:
    typeof CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  receiptKind: CanonicalCaptionRealSourceInspectionReceiptKind
  receiptRef: CaptionDomainRef
  variant: CanonicalCaptionRealSourceInspectionVariant
  canonicalScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    planVersionId: string
    approvedSnapshotRef: CaptionDomainRef
    executionPackageRef: CaptionDomainRef
    outputId: string
  }
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  expectedOriginalSourceRef: CaptionDomainRef
  exactCaptionReceiptRereadRequired: true
  exactReviewSpecRereadRequired: true
  canonicalApprovedRunAuthorityRereadRequired: true
  canonicalQualificationReaderMustRevalidateAuthority: true
  callerSuppliedReceiptAccepted: false
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

export interface CanonicalCaptionRealSourceInspectionBundle {
  receiptKind: CanonicalCaptionRealSourceInspectionReceiptKind
  receipt: unknown
  reviewSpecs: unknown[]
}

export interface CanonicalCaptionRealSourceInspectionBundleReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_READ_PORT_VERSION
  readonly sourceAuthority:
    'caption_owned_persisted_real_source_inspection_bundle'
  readonly callerSuppliedReceiptAccepted: false
  readExact(input: {
    readonly receiptRef: CaptionDomainRef
  }): Promise<CanonicalCaptionRealSourceInspectionBundle | null>
}

/**
 * Exact canonical approved-run authority used to bind an already-inspected
 * Caption output to the immutable execution package and approved source set.
 * The projection service never accepts this record directly from its caller.
 */
export interface CanonicalCaptionRealSourceInspectionAuthority {
  schemaVersion:
    typeof CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_VERSION
  authorityId: string
  authorityDigestSha256: string
  canonicalScope:
    CanonicalCaptionRealSourceInspectionProjectionRequest['canonicalScope']
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  originalSourceRef: CaptionDomainRef
  sourceMediaAuthorityRef: CaptionDomainRef
  sourceMediaBindingRefs: CaptionDomainRef[]
  exactApprovedSnapshotExecutionPackageOutputAndSourceReread: true
}

export interface CanonicalCaptionRealSourceInspectionAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_backend_approved_caption_run_authority'
  readonly callerSuppliedAuthorityAccepted: false
  readExact(input: {
    readonly approvedSnapshotRef: CaptionDomainRef
    readonly executionPackageRef: CaptionDomainRef
    readonly outputId: string
    readonly renderedArtifactRef: CaptionDomainRef
  }): Promise<CanonicalCaptionRealSourceInspectionAuthority | null>
}

export interface CanonicalCaptionRealSourceInspectionProjectionOutcome {
  disposition: 'projected_canonical_direct_visual_inspection_evidence'
  request: CanonicalCaptionRealSourceInspectionProjectionRequest
  evidence: CanonicalCaptionDirectVisualInspectionEvidence
  captionReceiptRereadTwice: true
  reviewSpecsRereadTwice: true
  canonicalApprovedRunAuthorityRereadTwice: true
  canonicalApprovedRunAuthorityRef: CaptionDomainRef
  evidencePersistedCreateOnlyAndReread: true
  canonicalQualificationReaderMustRevalidateAuthority: true
  currentProductStatusChanged: false
  publicOrProductionAuthorityGranted: false
}

export interface CanonicalCaptionRealSourceInspectionProjectionService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_SERVICE_VERSION
  readonly callerSuppliedReceiptAccepted: false
  readonly callerSuppliedAuthorityAccepted: false
  readonly canonicalApprovedRunAuthorityRereadRequired: true
  readonly canonicalQualificationReaderMustRevalidateAuthority: true
  project(
    request: CanonicalCaptionRealSourceInspectionProjectionRequest,
  ): Promise<CanonicalCaptionRealSourceInspectionProjectionOutcome>
}
