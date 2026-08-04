import type { CaptionDomainRef } from './caption-domain-contracts'

export const CAPTION_LIVING_FRAME_V1_V2_COMPATIBILITY_VERSION =
  'caption-direction-living-frame-v1-v2-compatibility-binding-v1' as const

export interface CaptionLivingFrameWireRef {
  id: string
  schemaVersion: string
  digestSha256: string
}

export interface CaptionLivingFrameCompatibilityScope {
  workspaceId: string
  projectId: string
  editSessionId: string
  handoffId: string
  planVersionId: string
  approvedSnapshotId: string | null
  outputId: string
}

export interface CaptionLivingFrameRequestCompatibilityBinding {
  schemaVersion: typeof CAPTION_LIVING_FRAME_V1_V2_COMPATIBILITY_VERSION
  bindingId: string
  bindingDigestSha256: string
  v1RequestRef: CaptionLivingFrameWireRef
  v2RequestRef: CaptionLivingFrameWireRef
  canonicalScope: CaptionLivingFrameCompatibilityScope
  sharedLineageAssertions: {
    phaseMatched: true
    canonicalScopeMatched: true
    approvedSnapshotMatched: true
    captionPlanMatched: true
    transcriptMatched: true
    semanticIntentMatched: true
    confirmedFrameMatched: true
    reservationMatched: true
    masterAndStoryTimingMatched: true
    styleAndOccupancyMatched: true
    privateStalenessMatched: true
  }
  versionSpecificFieldsRemainOwnedByTheirWireVersion: true
  wireSchemaRelabelingPerformed: false
  missingCompatibilityDataInvented: false
  livingFrameServerImplementationImported: false
  operationRegistered: false
  dispatchGranted: false
  runtimeAuthority: false
  assetCreated: false
  qaApprovalGranted: false
  publicDeliveryCreated: false
  productionReady: false
}

export interface CaptionLivingFrameResponseCompatibilityBinding {
  schemaVersion: typeof CAPTION_LIVING_FRAME_V1_V2_COMPATIBILITY_VERSION
  bindingId: string
  bindingDigestSha256: string
  requestCompatibilityBindingRef: CaptionDomainRef
  v1ResponseRef: CaptionLivingFrameWireRef
  v2ResponseRef: CaptionLivingFrameWireRef
  selectedSceneIds: string[]
  sharedLineageAssertions: {
    dispositionMatched: true
    requestAndScopeMatched: true
    selectedSceneDecisionMatched: true
    informationOwnerHandoffMatched: true
    masterAndStoryTimingMatched: true
    layoutAndCaptionPlaneMatched: true
    estimateFallbackAndQaMatched: true
    stalenessMatched: true
  }
  versionSpecificFieldsRemainOwnedByTheirWireVersion: true
  wireSchemaRelabelingPerformed: false
  missingCompatibilityDataInvented: false
  livingFrameServerImplementationImported: false
  operationRegistered: false
  dispatchGranted: false
  runtimeAuthority: false
  assetCreated: false
  qaApprovalGranted: false
  publicDeliveryCreated: false
  productionReady: false
}
