import type {
  CaptionCrossSystemCoordinationPlan,
  CaptionCrossSystemCoordinationPlanContext,
  CaptionCrossSystemHandoffV2,
  CaptionCrossSystemHandoffV2Context,
} from './caption-cross-system-coordination'
import type { CaptionsCrossSystemOutputJobType } from './captions-specialist'
import type {
  OrchestraSkillCall,
  SkillCanonicalScope,
  SkillContractRef,
} from './orchestra-skill-contracts'

export const CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_VERSION =
  'canonical-caption-cross-system-execution-input-v1' as const
export const CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_REPOSITORY_VERSION =
  'canonical-caption-cross-system-execution-input-repository-v1' as const
export const CANONICAL_CAPTION_CROSS_SYSTEM_SOURCE_READ_PORT_VERSION =
  'canonical-caption-cross-system-source-read-port-v1' as const
export const CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_READ_PORT_VERSION =
  'canonical-caption-cross-system-execution-input-read-port-v1' as const

export interface CanonicalCaptionCrossSystemExecutionAuthorityBindings {
  executionPackageRef: SkillContractRef
  approvedSnapshotRef: SkillContractRef
  approvedWorkItemRef: SkillContractRef
  canonicalJobRef: SkillContractRef
  plannedManifestEntryRef: SkillContractRef
  estimateRef: SkillContractRef
  reservationRef: SkillContractRef
}

export interface CanonicalCaptionCrossSystemAggregateSourceInput {
  mode: 'aggregate_coordination_plan'
  coordinationPlan: CaptionCrossSystemCoordinationPlan
  coordinationContext: CaptionCrossSystemCoordinationPlanContext
}

export interface CanonicalCaptionCrossSystemSingleSourceInput {
  mode: 'single_outbound_handoff'
  outboundHandoff: CaptionCrossSystemHandoffV2
  outboundHandoffContext: CaptionCrossSystemHandoffV2Context
}

export type CanonicalCaptionCrossSystemSourceInput =
  | CanonicalCaptionCrossSystemAggregateSourceInput
  | CanonicalCaptionCrossSystemSingleSourceInput

/**
 * Immutable, private execution input assembled by the canonical backend from
 * exact Caption-owned artifacts after approval. It is data-only: it neither
 * dispatches a receiver nor grants timeline, runtime, asset, QA, or billing
 * authority.
 */
export interface CanonicalCaptionCrossSystemExecutionInput {
  schemaVersion:
    typeof CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_VERSION
  inputId: string
  inputDigestSha256: string
  originCaptionCallRef: SkillContractRef
  captionJobType: CaptionsCrossSystemOutputJobType
  canonicalScope: SkillCanonicalScope
  authorityBindings: CanonicalCaptionCrossSystemExecutionAuthorityBindings
  sourceInput: CanonicalCaptionCrossSystemSourceInput
  exactApprovedSnapshotWorkJobManifestEstimateAndReservationBound: true
  exactCaptionCallScopeAndCanonicalInputsBound: true
  sourceArtifactsPersistedCreateOnlyAndReread: true
  receiverExecutionClaimed: false
  directPeerDispatchPerformed: false
  timelineMutationPerformed: false
  providerCallPerformed: false
  mediaRuntimePerformed: false
  assetMutationPerformed: false
  costOrBillingMutationPerformed: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionCrossSystemExecutionInputRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly executionInput: CanonicalCaptionCrossSystemExecutionInput
  }): Promise<'created' | 'identical_replay'>
  rereadExact(input: {
    readonly originCaptionCallRef: SkillContractRef
  }): Promise<CanonicalCaptionCrossSystemExecutionInput | null>
}

/**
 * Admitted backend adapter over the canonical Caption artifact owner. The
 * executor supplies the derived call and immutable authority refs; browser or
 * route callers cannot submit a pre-shaped coordination package.
 */
export interface CanonicalCaptionCrossSystemSourceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_CROSS_SYSTEM_SOURCE_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_caption_domain_artifact_owner'
  readonly callerSuppliedSourceInputAccepted: false
  readExact(input: {
    readonly call: OrchestraSkillCall
    readonly authorityBindings:
      CanonicalCaptionCrossSystemExecutionAuthorityBindings
  }): Promise<CanonicalCaptionCrossSystemSourceInput | null>
}

/**
 * One-writer projection used by both the initial approved-work executor and a
 * later HQ-mediated specialist resume. Full authority refs are supplied only
 * by the initial canonical executor; resumes can only reread the already
 * persisted call-bound input.
 */
export interface CanonicalCaptionCrossSystemExecutionInputReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_CROSS_SYSTEM_EXECUTION_INPUT_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_backend_persisted_caption_cross_system_execution_input'
  readonly callerSuppliedExecutionInputAccepted: false
  readExact(input: {
    readonly call: OrchestraSkillCall
    readonly authorityBindings:
      CanonicalCaptionCrossSystemExecutionAuthorityBindings | null
  }): Promise<CanonicalCaptionCrossSystemExecutionInput | null>
}
