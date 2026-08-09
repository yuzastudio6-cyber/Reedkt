import type { CanonicalPictureLockManifest } from
  './canonical-picture-lock-manifest'
import type {
  CaptionDependencyManifestV2,
  CaptionFinishReadinessV2,
} from './caption-finish-readiness'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CANONICAL_CAPTION_POSTAPPROVAL_FINISH_BINDING_VERSION =
  'canonical-caption-postapproval-finish-binding-v1' as const
export const CANONICAL_CAPTION_POSTAPPROVAL_FINISH_RECORD_VERSION =
  'canonical-caption-postapproval-finish-record-v1' as const
export const CANONICAL_CAPTION_POSTAPPROVAL_FINISH_REPOSITORY_VERSION =
  'canonical-caption-postapproval-finish-repository-v1' as const
export const CANONICAL_CAPTION_POSTAPPROVAL_FINISH_READ_PORT_VERSION =
  'canonical-caption-postapproval-finish-read-port-v1' as const

export interface CanonicalCaptionPostapprovalFinishScope
  extends Omit<
    CaptionDomainCanonicalScope,
    'approvedSnapshotRef' | 'sceneId'
  > {
  approvedSnapshotRef: CaptionDomainRef
  sceneId: string
}

/**
 * Byte-free execution-time proof that one exact Caption scene is admitted for
 * late resolution. Picture lock remains shared edit-architecture authority;
 * Caption owns only its dependency/readiness interpretation.
 */
export interface CanonicalCaptionPostapprovalFinishBinding {
  schemaVersion:
    typeof CANONICAL_CAPTION_POSTAPPROVAL_FINISH_BINDING_VERSION
  bindingId: string
  bindingDigestSha256: string
  canonicalScope: CanonicalCaptionPostapprovalFinishScope
  executionPackageRef: CaptionDomainRef
  captionPlanningProjectionRef: CaptionDomainRef
  earlyPlanningBundleRef: CaptionDomainRef
  pictureLockRef: CaptionDomainRef
  dependencyManifestRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  sceneDisposition: 'ready' | 'ready_with_fallback'
  selectedFallbackIds: string[]
  originalTreatmentReady: boolean
  pictureLockImmutableAndSharedOwnerVerified: true
  exactApprovedSnapshotOutputAndSceneVerified: true
  exactExecutionPackageAndPlanningProjectionVerified: true
  exactDependencyManifestAndFinishReadinessReread: true
  unrelatedBlockedScenesDoNotBlockThisScene: true
  byteFree: true
  callerSuppliedEvidenceAccepted: false
  browserLocalCompletionAccepted: false
  directPeerDispatchGranted: false
  timelineMutationAuthorityGrantedToCaption: false
  pictureLockAuthorityGrantedToCaption: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalRenderAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

/** Private create-only record. The public binding above remains byte-free. */
export interface CanonicalCaptionPostapprovalFinishRecord {
  schemaVersion: typeof CANONICAL_CAPTION_POSTAPPROVAL_FINISH_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  binding: CanonicalCaptionPostapprovalFinishBinding
  pictureLock: CanonicalPictureLockManifest
  dependencyManifest: CaptionDependencyManifestV2
  finishReadiness: CaptionFinishReadinessV2
  persistedAsPrivateArtifact: true
  createOnly: true
  exactRereadRequired: true
  rawChatIncluded: false
  transcriptTextIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  publicDeliveryAuthorityClaimed: false
  productionAuthorityClaimed: false
}

export interface CanonicalCaptionPostapprovalFinishLookup {
  canonicalScope: CanonicalCaptionPostapprovalFinishScope
  executionPackageRef: CaptionDomainRef
  captionPlanningProjectionRef: CaptionDomainRef
}

export interface CanonicalCaptionPostapprovalFinishReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_POSTAPPROVAL_FINISH_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_caption_postapproval_finish_repository'
  readonly callerSuppliedEvidenceAccepted: false
  readExact(input: CanonicalCaptionPostapprovalFinishLookup):
    Promise<CanonicalCaptionPostapprovalFinishRecord | null>
}

export interface CanonicalCaptionPostapprovalFinishRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_POSTAPPROVAL_FINISH_REPOSITORY_VERSION
  readonly readPort: CanonicalCaptionPostapprovalFinishReadPort
  persistCreateOnly(input: {
    record: CanonicalCaptionPostapprovalFinishRecord
  }): Promise<'created' | 'identical_replay'>
}
