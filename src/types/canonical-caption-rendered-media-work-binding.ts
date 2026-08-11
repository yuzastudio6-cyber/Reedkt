import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_RENDERED_MEDIA_WORK_BINDING_VERSION =
  'canonical-caption-rendered-media-work-binding-v1' as const
export const CANONICAL_CAPTION_RENDERED_MEDIA_WORK_BINDING_COMPONENT_KEY =
  'canonicalCaptionRenderedMediaWorkBinding' as const

export interface CanonicalCaptionRenderedMediaWorkBinding {
  schemaVersion:
    typeof CANONICAL_CAPTION_RENDERED_MEDIA_WORK_BINDING_VERSION
  bindingId: string
  bindingDigestSha256: string
  planningProjectionRef: CaptionDomainRef
  planningBindingRef: CaptionDomainRef
  outputId: string
  confirmedOutputFrame: {
    frameRef: CaptionDomainRef
    width: number
    height: number
    fpsNumerator: number
    fpsDenominator: number
  }
  masterTimingRef: CaptionDomainRef
  canonicalMasterTimingId: string
  renderSpecPlanningWorkItemKeys: string[]
  captionOverlays: Array<{
    workItemKey: string
    outputKey: string
    timingIds: string[]
    rendererLayerIds: string[]
    startFrame: number
    endFrameExclusive: number
    structuredPayloadDigestSha256: string
    captionTextDigestSha256: string
  }>
  finalComposition: {
    workItemKey: string
    operation:
      | 'render_approved_source_caption_final'
      | 'render_approved_source_sequence_caption_final'
      | 'render_approved_source_caption_track_final'
      | 'render_approved_source_sequence_caption_track_final'
    canonicalOperationId: 'tool.remotion.render_approved_composition.v1'
    outputKey: string
    structuredPayloadDigestSha256: string
    dependencyKeys: string[]
  }
  captionRenderOwner: 'libass'
  finalCanvasOwner: 'remotion'
  captionOverlayPolicy:
    | 'approved_full_frame_rgba'
    | 'approved_timed_full_frame_rgba_track'
  captionAboveLivingFrame: true
  captionAboveControlledVisuals: true
  exactConfirmedFrameBound: true
  exactMasterTimingBound: true
  exactApprovedWorkGraphBound: true
  planningJobsClaimFinishedCaptionMedia: false
  browserWorkCreationAccepted: false
  directPeerDispatchGranted: false
  providerRuntimeAuthorityGranted: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
