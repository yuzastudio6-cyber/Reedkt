import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CaptionTerminalQualificationEvidenceInputV2,
  CaptionTerminalQualificationPreflightV2,
  CaptionTerminalQualificationProjectionV2,
} from './caption-terminal-qualification'
import type {
  CanonicalCaptionPrivateReviewEvidenceProjection,
} from './canonical-caption-private-review-evidence-projection'

export const CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REQUEST_VERSION =
  'canonical-caption-terminal-qualification-request-v1' as const
export const CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_VERSION =
  'canonical-caption-terminal-evidence-bundle-v1' as const
export const CANONICAL_CAPTION_TERMINAL_QUALIFICATION_RECORD_VERSION =
  'canonical-caption-terminal-qualification-record-v1' as const
export const CANONICAL_CAPTION_TERMINAL_EVIDENCE_READ_PORT_VERSION =
  'canonical-caption-terminal-evidence-read-port-v1' as const
export const CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REPOSITORY_VERSION =
  'canonical-caption-terminal-qualification-repository-v1' as const
export const CANONICAL_CAPTION_TERMINAL_QUALIFICATION_SERVICE_VERSION =
  'canonical-caption-terminal-qualification-service-v1' as const

export interface CanonicalCaptionTerminalQualificationRequest {
  schemaVersion:
    typeof CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  canonicalScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    planVersionId: string
    approvedSnapshotRef: CaptionDomainRef
  }
  executionPackageRef: CaptionDomainRef
  currentJobReadinessRef: CaptionDomainRef
  requiredOutputIds: string[]
  privateInternalQualificationRun: true
  callerSuppliedEvidenceAccepted: false
  browserLocalCompletionAccepted: false
  rawChatMediaBytesPathsUrlsOrCredentialsIncluded: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionTerminalEvidenceBundle {
  schemaVersion: typeof CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_VERSION
  bundleId: string
  bundleDigestSha256: string
  requestRef: CaptionDomainRef
  qualificationInput: CaptionTerminalQualificationEvidenceInputV2
  privateReviewEvidenceProjections:
    CanonicalCaptionPrivateReviewEvidenceProjection[]
  sourceAuthority: 'canonical_backend_persisted_caption_evidence'
  actualCanonicalRecordsReread: true
  exactRequestScopePackageAndOutputSetBound: true
  callerSuppliedEvidenceAccepted: false
  sourceFixtureRelabeledAsRuntimeEvidence: false
  browserLocalCompletionAccepted: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionTerminalQualificationRecord {
  schemaVersion: typeof CANONICAL_CAPTION_TERMINAL_QUALIFICATION_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  request: CanonicalCaptionTerminalQualificationRequest
  requestRef: CaptionDomainRef
  evidenceBundle: CanonicalCaptionTerminalEvidenceBundle
  evidenceBundleRef: CaptionDomainRef
  qualificationInputRef: CaptionDomainRef
  preflight: CaptionTerminalQualificationPreflightV2
  terminalProjection: CaptionTerminalQualificationProjectionV2
  createdAt: string
  exactCanonicalEvidenceReread: true
  evidenceBundlePersistedOwnerSideBeforeQualification: true
  qualificationRecordPersistedCreateOnlyAndReread: true
  allFortyOneJobsQualified: true
  allConfirmedOutputsQualified: true
  privateInternalOnly: true
  centralOrchestraImplemented: false
  directPeerDispatchPerformedByCaption: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  providerOrModelAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionTerminalEvidenceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TERMINAL_EVIDENCE_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_backend_persisted_caption_evidence'
  readonly callerSuppliedEvidenceAccepted: false
  readExact(input: {
    readonly request: CanonicalCaptionTerminalQualificationRequest
  }): Promise<CanonicalCaptionTerminalEvidenceBundle | null>
}

export interface CanonicalCaptionTerminalQualificationRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REPOSITORY_VERSION
  persistRecordCreateOnly(input: {
    readonly record: CanonicalCaptionTerminalQualificationRecord
  }): Promise<'created' | 'identical_replay'>
  rereadRecord(input: {
    readonly requestRef: CaptionDomainRef
  }): Promise<CanonicalCaptionTerminalQualificationRecord | null>
}

export interface CanonicalCaptionTerminalQualificationOutcome {
  disposition:
    | 'blocked_missing_canonical_evidence'
    | 'qualified_private_internal'
  request: CanonicalCaptionTerminalQualificationRequest
  preflight: CaptionTerminalQualificationPreflightV2
  record: CanonicalCaptionTerminalQualificationRecord | null
  terminalProjection: CaptionTerminalQualificationProjectionV2 | null
  currentProductStatusChanged: false
  publicOrProductionAuthorityGranted: false
}
