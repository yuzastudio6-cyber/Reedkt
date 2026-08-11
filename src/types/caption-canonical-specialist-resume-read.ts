import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalSpecialistSupportResumeRecord,
} from './canonical-specialist-support-resume'
import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
} from './orchestra-skill-contracts'

export const CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_VERSION =
  'caption-canonical-specialist-resume-read-adapter-v1' as const
export const CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION =
  'caption-canonical-specialist-resume-sequence-v1' as const

export interface CaptionCanonicalSpecialistResumeSequence {
  schemaVersion: typeof CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION
  sequenceId: string
  sequenceDigestSha256: string
  initialCallRef: CaptionDomainRef
  initialResultRef: CaptionDomainRef
  resumeRecordRefs: CaptionDomainRef[]
  finalCallRef: CaptionDomainRef
  finalResultRef: CaptionDomainRef
  ownerOrder: Array<
    CanonicalSpecialistSupportResumeRecord['authenticatedOwnerProjection']['ownerKey']
  >
  stepCount: number
  exactCreateOnlyPersistenceRereadVerified: true
  exactSequentialLineageVerified: true
  onlyCurrentOwnerResultInjectedPerStep: true
  priorOwnerResultsPromotedAsCanonicalInputs: true
  finalDisposition: OrchestraSkillJobResult['disposition']
  directPeerDispatchPerformed: false
  providerCallPerformedByCaption: false
  runtimeExecutionPerformedByCaption: false
  assetMutationPerformedByCaption: false
  costOrBillingMutationPerformedByCaption: false
  finalQaApprovalGrantedByCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionCanonicalSpecialistResumeReadAdapterReceipt {
  schemaVersion:
    typeof CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_VERSION
  adapterId: string
  adapterDigestSha256: string
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt'
    branch: 'codex/backend-workflow-pipeline-continuation'
    sourceCommit: string
    sourceTree: string
    publicTypeFileSha256: string
    orchestraPublicTypeFileSha256: string
    orchestraParserFileSha256: string
    skillManifestPublicTypeFileSha256: string
    closedValidatorFileSha256: string
  }
  canonicalProjectionVersion:
    'canonical-authenticated-specialist-support-artifact-projection-v1'
  canonicalResumeRecordVersion: 'canonical-specialist-support-resume-record-v1'
  canonicalCallResultPairVersion: 'canonical-specialist-call-result-pair-v1'
  captionSequenceVersion:
    typeof CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION
  captionParserEntrypointId:
    'parseCaptionCanonicalSpecialistSupportResumeRecord'
  captionSequenceEntrypointId:
    'createCaptionCanonicalSpecialistResumeSequence'
  sourcePublicTypeCopiedByteForByte: true
  backendImplementationImported: false
  canonicalPersistenceReaderMounted: false
  authenticatedOwnerAdaptersMounted: false
  actualCanonicalResumeRecordConsumed: false
  directPeerDispatchAdded: false
  providerCallAuthorityGranted: false
  runtimeExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  costOrBillingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionCanonicalSpecialistResumeSequenceInput {
  sequenceId: string
  initialCall: OrchestraSkillCall
  initialResult: OrchestraSkillJobResult
  records: CanonicalSpecialistSupportResumeRecord[]
}
