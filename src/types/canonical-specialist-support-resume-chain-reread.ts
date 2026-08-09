import type {
  CanonicalSpecialistCallResultPair,
  CanonicalSpecialistSupportResumeRecord,
} from './canonical-specialist-support-resume'
import type {
  OrchestraSkillJobResult,
  SkillContractRef,
} from './orchestra-skill-contracts'

export const CANONICAL_SPECIALIST_SUPPORT_RESUME_CHAIN_REREAD_VERSION =
  'canonical-specialist-support-resume-chain-reread-v1' as const

/**
 * Exact read model over the existing create-only call/result, owner projection,
 * and sequential-resume records. It never performs an owner call or creates a
 * resume step; it only proves the current persisted head of one specialist
 * call chain so a canonical work-item runner can retry safely after HQ-owned
 * support evidence has already been admitted.
 */
export interface CanonicalSpecialistSupportResumeChainReread {
  schemaVersion:
    typeof CANONICAL_SPECIALIST_SUPPORT_RESUME_CHAIN_REREAD_VERSION
  chainDigestSha256: string
  initialPair: CanonicalSpecialistCallResultPair
  currentPair: CanonicalSpecialistCallResultPair
  records: CanonicalSpecialistSupportResumeRecord[]
  status:
    | 'completed_without_support'
    | 'completed_after_support_resume'
    | 'waiting_for_authenticated_owner_projection'
    | 'waiting_for_persisted_resume_record'
    | 'terminal_non_completed'
  pendingSupportRequestRef: SkillContractRef | null
  authenticatedOwnerProjectionRef: SkillContractRef | null
  stepCount: number
  currentDisposition: OrchestraSkillJobResult['disposition']
  exactInitialPairReread: true
  exactEveryOwnerProjectionAndResumeRecordReread: true
  currentPersistedHeadVerified: true
  callerSuppliedResultAccepted: false
  directPeerDispatchPerformed: false
  providerCallPerformedByReader: false
  runtimeExecutionPerformedByReader: false
  assetMutationPerformedByReader: false
  costOrBillingMutationPerformedByReader: false
  finalQaApprovalGrantedByReader: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
