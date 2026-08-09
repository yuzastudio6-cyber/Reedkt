import type { PlatformAspectRatio } from './workflow-common'

export const CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION =
  'caption-rendered-visual-review-product-status-v2' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION =
  'caption-rendered-visual-review-output-set-product-status-v1' as const

export type CaptionRenderedVisualReviewProductState =
  | 'waiting_for_render'
  | 'waiting_for_qualified_ai'
  | 'blocked_evidence_reconciliation'
  | 'repair_required'
  | 'needs_human_review'
  | 'passed'

export interface CaptionRenderedVisualReviewProductStatus {
  schemaVersion: typeof CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION
  scope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  state: CaptionRenderedVisualReviewProductState
  userFacingLabel: string
  userFacingSummary: string
  deterministicQaStatus: 'waiting' | 'passed' | 'failed'
  aiVisualInspectionStatus:
    | 'waiting'
    | 'passed'
    | 'repair_required'
    | 'needs_human_review'
    | 'blocked'
  exactApprovedRenderBound: boolean
  actualModelInferenceVerified: boolean
  deterministicAndModelEvidenceAgree: boolean
  canonicalEvidenceReconciled: boolean
  serverDerivedFromCanonicalEvidence: boolean
  modelInspectionCoverage?: {
    scope:
      | 'complete_segment_coverage'
      | 'bounded_representative_segment_coverage'
    sampledSegmentCount: number
    unsampledSegmentCount: number
    modelInspectedOnlyPlannedSamples: true
    unsampledSegmentsNeverImpliedInspected: true
  }
  canonicalEvidenceRefs?: {
    decisionRef: CaptionVisualReviewProductEvidenceRef
    providerExecutionReceiptRef: CaptionVisualReviewProductEvidenceRef
    persistedEvidenceArtifactRef: CaptionVisualReviewProductEvidenceRef
    independentArtifactQaRef: CaptionVisualReviewProductEvidenceRef
    assetManifestReconciliationRef: CaptionVisualReviewProductEvidenceRef
  }
  visualQaGateSatisfied: boolean
  visualQaBlocksDelivery: boolean
  smallestScopeRepairRequired: boolean
  privateHumanReviewRequired: boolean
  rawModelTextIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  authorityBoundary: CaptionRenderedVisualReviewProductAuthorityBoundary
}

export interface CaptionVisualReviewProductEvidenceRef {
  id: string
  version: number
  contentHash: string
}

export interface CaptionRenderedVisualReviewProductAuthorityBoundary {
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  qaApprovalAuthority: false
  repairExecutionAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionRenderedVisualReviewOutputProductStatus {
  outputId: string
  aspectRatio: PlatformAspectRatio
  width: number
  height: number
  fps: number
  status: CaptionRenderedVisualReviewProductStatus
}

export interface CaptionRenderedVisualReviewOutputSetProductStatus {
  schemaVersion:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION
  scope: CaptionRenderedVisualReviewProductStatus['scope']
  requiredOutputIds: string[]
  requiredAspectRatios: PlatformAspectRatio[]
  outputs: CaptionRenderedVisualReviewOutputProductStatus[]
  state: CaptionRenderedVisualReviewProductState
  userFacingLabel: string
  userFacingSummary: string
  allRequiredOutputsCovered: boolean
  everyOutputDeterministicQaPassed: boolean
  everyOutputQualifiedVisualReviewPassed: boolean
  unresolvedOutputIds: string[]
  outputEvidenceCannotBeReusedAcrossCanvases: true
  serverDerivedFromAuthenticatedCanonicalReads: true
  visualQaGateSatisfied: boolean
  visualQaBlocksDelivery: boolean
  rawModelTextIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  authorityBoundary: CaptionRenderedVisualReviewProductAuthorityBoundary
}
