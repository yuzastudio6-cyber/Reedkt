import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CAPTION_SHARED_OWNER_INTEGRATION_HANDOFF_VERSION =
  'caption-shared-owner-integration-handoff-v1' as const

export type CaptionSharedOwnerKey =
  | 'visual_intelligence'
  | 'canonical_transcript'
  | 'track_all'
  | 'soundsync'
  | 'broll_owner'

export type CaptionSharedOwnerIntegrationMode =
  | 'initial_call_authenticated_input'
  | 'hq_mediated_support_resume'
  | 'authenticated_owner_read_binding'

export interface CaptionSharedOwnerPublicContract {
  publicTypeName: string
  schemaVersion: string
  contractRole:
    | 'initial_input'
    | 'request_payload'
    | 'neutral_support_request'
    | 'owner_result'
    | 'caption_admission'
    | 'caption_projection'
    | 'qualification'
    | 'authenticated_read_binding'
  captionParserEntrypointId: string
  artifactType: string | null
  suppliedByCaption: boolean
  suppliedBySharedOwner: boolean
}

export interface CaptionSharedOwnerBoundaryBinding {
  ownerKey: CaptionSharedOwnerKey
  integrationMode: CaptionSharedOwnerIntegrationMode
  publicContracts: CaptionSharedOwnerPublicContract[]
  requiredArtifactTypes: string[]
  currentGapCodes: string[]
  publicCaptionBoundaryComplete: boolean
  authenticatedOwnerAdapterComplete: boolean
  authenticatedPrivateRuntimeEvidenceIntegrated: false
  exactCanonicalScopeRereadRequired: true
  exactApprovedSnapshotRereadRequired: true
  exactOutputFrameAndTimingMatchRequired: true
  rawChatMediaBytesPathsUrlsOrCredentialsAllowed: false
  captionMayConstructOwnerResult: false
  captionMayDispatchOwnerDirectly: false
  duplicateSharedOwnerCreated: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CaptionConditionalJobOwnerBinding {
  jobType: CaptionsSupportedJobType
  requiredOwnerKeys: CaptionSharedOwnerKey[]
  requiredArtifactTypes: string[]
  fallbackCode: 'caption_fail_closed_without_required_integration'
  exactOriginalCallResumeRequired: true
  deterministicCaptionQaStillRequired: true
  directVisualInspectionStillRequiredWhenMediaExists: true
  independentFinalQaStillRequired: true
  currentlyAdmitted: false
}

export interface CaptionSharedOwnerIntegrationHandoff {
  schemaVersion: typeof CAPTION_SHARED_OWNER_INTEGRATION_HANDOFF_VERSION
  handoffId: string
  handoffDigestSha256: string
  sourceCommitRef: CaptionDomainRef
  sourceCap20ReleaseRef: CaptionDomainRef
  sourceCap20FinalJobReportRef: CaptionDomainRef
  ownerBindings: CaptionSharedOwnerBoundaryBinding[]
  conditionalJobBindings: CaptionConditionalJobOwnerBinding[]
  counts: {
    sharedOwners: 5
    conditionalJobs: 12
    ownerBoundariesWithCompleteCaptionContracts: number
    ownerAdaptersStillRequired: number
    authenticatedPrivateIntegrationsComplete: 0
  }
  allConditionalJobsMappedExactlyOnce: true
  everyConditionalJobRetainsFailClosedFallback: true
  captionOwnedImplementationComplete: true
  sharedOwnerRuntimeIntegrationComplete: false
  currentAdmittedSurfaceChanged: false
  privateInternalSpecialistQualified: false
  finalGoalCompletionClaimed: false
  centralOrchestraImplemented: false
  directPeerDispatchAdded: false
  providerOrModelAuthorityGranted: false
  operationOrRuntimeAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryAuthorityGranted: false
  productionAuthorityGranted: false
}
