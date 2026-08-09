import type {
  BrollCaptionCanonicalScope,
  BrollCaptionOpaqueReference,
} from './caption-broll-owner-read-adapter'

export const CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_AUTHORITY_VERSION =
  'canonical-broll-caption-inspection-source-authority-v1' as const
export const CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_READ_PORT_VERSION =
  'canonical-broll-caption-inspection-source-read-port-v1' as const

export interface CanonicalBrollCaptionInspectionSourceAuthority {
  schemaVersion:
    typeof CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_AUTHORITY_VERSION
  authorityId: string
  authorityDigestSha256: string
  canonicalScope: BrollCaptionCanonicalScope
  ownerRequestRef: BrollCaptionOpaqueReference
  ownerResultRef: BrollCaptionOpaqueReference
  brollAssignmentRef: BrollCaptionOpaqueReference
  brollPlanRef: BrollCaptionOpaqueReference
  brollApprovedWorkGraphRef: BrollCaptionOpaqueReference
  brollCanonicalWorkGraphRef: BrollCaptionOpaqueReference
  brollResultReceiptRef: BrollCaptionOpaqueReference
  selectedMediaManifestRef: BrollCaptionOpaqueReference
  layoutOccupancyRef: BrollCaptionOpaqueReference
  privateVisualReviewRef: BrollCaptionOpaqueReference
  previewArtifactRef: BrollCaptionOpaqueReference
  integrationQaRef: BrollCaptionOpaqueReference
  selectedNormalizedArtifactRef: BrollCaptionOpaqueReference
  selectedNormalizedArtifact: {
    privateObjectIdentityDigestSha256: string
    byteLength: number
    mimeType: 'video/x-nut'
    frameCount: number
    frameRate: 24 | 30
    audioRemoved: true
  }
  selectedSourceRoute:
    | 'existing_project_clip'
    | 'approved_user_asset'
    | 'gemini_omni_generated_candidate'
    | 'gemini_omni_edited_uploaded_video'
  exactCanonicalBrollWorkAndArtifactRereadVerified: true
  exactPrivateVisualReviewRereadVerified: true
  exactSelectedNormalizedArtifactIdentityVerified: true
  persistedCreateOnlyAndExactReread: true
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  rawChatIncluded: false
  credentialsIncluded: false
  sourceSelectionPerformedByCaption: false
  cropOrTimingPerformedByCaption: false
  runtimeOrDispatchAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalBrollCaptionInspectionSourceAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_BROLL_CAPTION_INSPECTION_SOURCE_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_b_roll_owner_private_inspection_source'
  readonly callerSuppliedAuthorityAccepted: false
  readExact(input: {
    readonly ownerRequestRef: BrollCaptionOpaqueReference
    readonly ownerResultRef: BrollCaptionOpaqueReference
  }): Promise<CanonicalBrollCaptionInspectionSourceAuthority | null>
}
