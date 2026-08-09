import type {
  CaptionDomainClosedAuthorityBoundary,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionEarlyPlanningBundle } from './caption-early-planning'
import type {
  CanonicalCaptionSpecialistEstimateBindingMetadata,
  CanonicalCaptionSpecialistPlanningBinding,
} from './canonical-caption-specialist-planning'
import type { ProfessionalSkillCompositionTrace } from
  './caption-specialist-integration'

export const CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_REQUEST_VERSION =
  'canonical-caption-source-led-professional-planning-request-v1' as const
export const CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_AUTHORITY_VERSION =
  'canonical-caption-source-led-professional-planning-authority-v1' as const
export const CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION =
  'canonical-caption-source-led-professional-planning-read-port-v1' as const

export interface CanonicalCaptionSourceLedProfessionalPlanningScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  outputId: string
}

export interface CanonicalCaptionSourceLedProfessionalPlanningRequest {
  schemaVersion:
    typeof CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  canonicalScope: CanonicalCaptionSourceLedProfessionalPlanningScope
  baseCanonicalPlanComponentsRef: CaptionDomainRef
  confirmedOutputFrame: {
    width: number
    height: number
    fpsNumerator: number
    fpsDenominator: number
    confirmedOutputFrameRef: CaptionDomainRef
  }
  masterTimingRef: CaptionDomainRef
  sourceSequenceRef: CaptionDomainRef
  confirmedCaptionMarkerSetRef: CaptionDomainRef | null
  totalFrames: number
  captionSelectionMustComeFromProfessionalSkillTrace: true
  canonicalTranscriptMustBeRereadByOwner: true
  visualEvidenceMustBeRereadByOwner: true
  browserPlanComponentsAccepted: false
  browserCaptionSelectionAccepted: false
  rawChatIncluded: false
  transcriptTextIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  workCreationAuthorityGranted: false
  operationDispatchAuthorityGranted: false
  providerRuntimeAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionSourceLedProfessionalPlanningEstimateLine {
  lineKey: string
  label: 'Caption specialist planning, rendering, and private review'
  category: 'caption_specialist'
  estimatedCredits: number
  removable: false
  metadata: CanonicalCaptionSpecialistEstimateBindingMetadata
}

export interface CanonicalCaptionSourceLedProfessionalPlanningAuthority {
  schemaVersion:
    typeof CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_AUTHORITY_VERSION
  authorityId: string
  authorityDigestSha256: string
  requestRef: CaptionDomainRef
  canonicalScope: CanonicalCaptionSourceLedProfessionalPlanningScope
  baseCanonicalPlanComponentsRef: CaptionDomainRef
  selectionDisposition: 'caption_design_selected' | 'no_captions'
  professionalSkillPlan: {
    compositionTrace: ProfessionalSkillCompositionTrace
  }
  captionEarlyPlanningBundle: CaptionEarlyPlanningBundle
  captionSpecialistPlanningBinding:
    CanonicalCaptionSpecialistPlanningBinding
  captionEstimateLine:
    CanonicalCaptionSourceLedProfessionalPlanningEstimateLine | null
  exactCanonicalOwnerReread: true
  stableDoubleRereadRequired: true
  existingApprovalInvalidatedOrMutated: false
  planPublished: false
  approvalGranted: false
  snapshotCreated: false
  workCreated: false
  creditReserved: false
  operationDispatched: false
  providerCalled: false
  assetCreated: false
  finalQaApproved: false
  publicDeliveryCreated: false
  productionReady: false
  privateArtifact: true
  byteFree: true
  authorityBoundary: CaptionDomainClosedAuthorityBoundary
}

export type CanonicalCaptionSourceLedProfessionalPlanningReadResult =
  | {
      schemaVersion:
        typeof CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION
      status: 'not_requested'
      requestRef: CaptionDomainRef
      authority: null
      blockerCodes: []
    }
  | {
      schemaVersion:
        typeof CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION
      status: 'blocked_requested'
      requestRef: CaptionDomainRef
      authority: null
      blockerCodes: string[]
    }
  | {
      schemaVersion:
        typeof CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION
      status: 'ready'
      requestRef: CaptionDomainRef
      authority: CanonicalCaptionSourceLedProfessionalPlanningAuthority
      blockerCodes: []
    }

export interface CanonicalCaptionSourceLedProfessionalPlanningReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION
  readForSourceLedPlan(
    request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
  ): Promise<CanonicalCaptionSourceLedProfessionalPlanningReadResult>
}
