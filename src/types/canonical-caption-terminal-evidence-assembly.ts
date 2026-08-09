import type { CaptionTerminalQualificationEvidenceInputV2 } from
  './caption-terminal-qualification'
import type {
  CanonicalCaptionPrivateReviewEvidenceProjection,
} from './canonical-caption-private-review-evidence-projection'
import type {
  CanonicalCaptionTerminalEvidenceBundle,
  CanonicalCaptionTerminalEvidenceReadPort,
  CanonicalCaptionTerminalQualificationRequest,
} from './canonical-caption-terminal-qualification'

export const CANONICAL_CAPTION_TERMINAL_INPUT_READ_PORT_VERSION =
  'canonical-caption-terminal-input-read-port-v1' as const
export const CANONICAL_CAPTION_TERMINAL_PRIVATE_REVIEW_READ_PORT_VERSION =
  'canonical-caption-terminal-private-review-read-port-v1' as const
export const CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_REPOSITORY_VERSION =
  'canonical-caption-terminal-evidence-bundle-repository-v1' as const
export const CANONICAL_CAPTION_TERMINAL_EVIDENCE_ASSEMBLY_VERSION =
  'canonical-caption-terminal-evidence-assembly-v1' as const

export interface CanonicalCaptionTerminalInputReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TERMINAL_INPUT_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_backend_completed_caption_work_and_owner_evidence'
  readonly callerSuppliedQualificationInputAccepted: false
  readExact(input: {
    readonly request: CanonicalCaptionTerminalQualificationRequest
  }): Promise<CaptionTerminalQualificationEvidenceInputV2 | null>
}

export interface CanonicalCaptionTerminalPrivateReviewReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TERMINAL_PRIVATE_REVIEW_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_private_review_persisted_output_evidence'
  readonly callerSuppliedPrivateReviewEvidenceAccepted: false
  readExact(input: {
    readonly request: CanonicalCaptionTerminalQualificationRequest
  }): Promise<CanonicalCaptionPrivateReviewEvidenceProjection[] | null>
}

export interface CanonicalCaptionTerminalEvidenceBundleRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_REPOSITORY_VERSION
  persistBundleCreateOnly(input: {
    readonly request: CanonicalCaptionTerminalQualificationRequest
    readonly bundle: CanonicalCaptionTerminalEvidenceBundle
  }): Promise<'created' | 'identical_replay'>
  rereadBundle(input: {
    readonly request: CanonicalCaptionTerminalQualificationRequest
  }): Promise<CanonicalCaptionTerminalEvidenceBundle | null>
}

export interface CanonicalCaptionTerminalEvidenceAssembly {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TERMINAL_EVIDENCE_ASSEMBLY_VERSION
  readonly evidenceReadPort: CanonicalCaptionTerminalEvidenceReadPort
  readonly bundleRepository:
    CanonicalCaptionTerminalEvidenceBundleRepository
  readonly exactSourceRereadBeforeAssembly: true
  readonly bundlePersistedCreateOnlyBeforeQualification: true
  readonly callerSuppliedEvidenceAccepted: false
  readonly browserLocalCompletionAccepted: false
  readonly directPeerDispatchPerformedByCaption: false
  readonly operationOrRuntimeAuthorityGrantedToCaption: false
  readonly providerOrModelAuthorityGrantedToCaption: false
  readonly assetMutationAuthorityGrantedToCaption: false
  readonly finalQaApprovalAuthorityGrantedToCaption: false
  readonly creditOrBillingAuthorityGrantedToCaption: false
  readonly publicDeliveryAuthorityGrantedToCaption: false
  readonly productionAuthorityGrantedToCaption: false
}
