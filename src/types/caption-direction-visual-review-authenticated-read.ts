import type { CaptionRenderedVisualReviewOutputSetProductStatus } from
  './caption-direction-visual-review-product-status'
import type { PlatformAspectRatio } from './workflow-common'

export const CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION =
  'caption-rendered-visual-review-authenticated-read-request-v1' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION =
  'caption-rendered-visual-review-authenticated-read-result-v1' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION =
  'caption-rendered-visual-review-authenticated-read-projection-v1' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE_ID =
  'visualIntelligence.captionPostrenderAuthenticatedRead' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE =
  '/v1/postrender-visual-qa/caption/authenticated-read' as const

export interface CaptionRenderedVisualReviewAuthenticatedReadScope {
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
}

export interface CaptionRenderedVisualReviewConfirmedOutputFrameRef {
  id: string
  version: number
  contentHash: string
  outputId: string
  aspectRatio: PlatformAspectRatio
  width: number
  height: number
  fps: number
  confirmedByUser: true
  confirmationRecordId: string
}

export interface CaptionRenderedVisualReviewAuthenticatedOutputScope {
  outputId: string
  aspectRatio: PlatformAspectRatio
  confirmedOutputFrameRef:
    CaptionRenderedVisualReviewConfirmedOutputFrameRef
}

/** Byte-free request for the canonical authenticated backend read owner. */
export interface CaptionRenderedVisualReviewAuthenticatedReadRequest {
  schemaVersion:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION
  scope: CaptionRenderedVisualReviewAuthenticatedReadScope
  requiredOutputs: CaptionRenderedVisualReviewAuthenticatedOutputScope[]
  byteFreeRequest: true
  browserLocalCompletionAccepted: false
}

export type CaptionRenderedVisualReviewAuthenticatedReadDisposition =
  | 'not_found'
  | 'pending'
  | 'completed'

export interface CaptionRenderedVisualReviewAuthenticatedProjectionRef {
  id: string
  version: number
  schemaVersion:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION
  contentHash: string
}

export interface CaptionRenderedVisualReviewAuthenticatedReadAuthorityBoundary {
  owner: 'authenticated_caption_visual_review_read_route'
  canonicalPersistenceOwnerRemainsExternal: true
  authenticationAuthorityRemainsCanonicalBackend: true
  browserLocalCompletionAccepted: false
  approvedSnapshotMutated: false
  operationDispatched: false
  providerCallMade: false
  qaApprovalGranted: false
  repairExecuted: false
  assetMutated: false
  creditOrBillingMutated: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionRenderedVisualReviewAuthenticatedReadResult {
  schemaVersion:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION
  disposition: CaptionRenderedVisualReviewAuthenticatedReadDisposition
  scope: CaptionRenderedVisualReviewAuthenticatedReadScope
  confirmedOutputs: CaptionRenderedVisualReviewAuthenticatedOutputScope[]
  projectionRef: CaptionRenderedVisualReviewAuthenticatedProjectionRef
  outputSetStatus: CaptionRenderedVisualReviewOutputSetProductStatus | null
  userFacingSummary: string
  authenticatedPrincipalVerified: true
  exactCanonicalScopeReread: true
  requestedOutputFramesReread: true
  approvedSnapshotImmutable: true
  browserLocalStateUsed: false
  rawModelTextIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  authorityBoundary:
    CaptionRenderedVisualReviewAuthenticatedReadAuthorityBoundary
}
