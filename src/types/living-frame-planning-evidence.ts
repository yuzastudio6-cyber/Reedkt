export const LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_VERSION =
  'living-frame-planning-evidence-binding-v1' as const
export const LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_SOURCE =
  'living_frame_private_visual_evidence_projection_planning_only' as const
export const LIVING_FRAME_PLANNING_EVIDENCE_LOCATOR_VERSION =
  'canonical-living-frame-planning-evidence-locator-v1' as const
export const LIVING_FRAME_PLANNING_EVIDENCE_RUNTIME_READINESS =
  'planning_evidence_only' as const

export type LivingFramePlanningEvidenceStatus =
  | 'available_for_preapproval_reasoning'
  | 'not_applicable_idea_first'

export type LivingFramePlanningEvidenceSourceMode =
  | 'uploaded_media'
  | 'idea_first_no_uploaded_media'

export type LivingFramePlanningEvidenceClass =
  | 'private_source_bound_visual_observation_projection'
  | 'not_applicable_canonical_idea_first'

export type LivingFramePlanningObservationCategory =
  | 'scene'
  | 'object'
  | 'person'
  | 'action'
  | 'camera_motion'
  | 'visible_text'
  | 'layout'
  | 'continuity'
  | 'broll_opportunity'
  | 'visual_risk'
  | 'color_or_lighting'

export interface LivingFramePlanningEvidenceLocator {
  readonly schemaVersion:
    typeof LIVING_FRAME_PLANNING_EVIDENCE_LOCATOR_VERSION
  readonly serverOwnedLocatorId: string | null
}

export interface LivingFramePlanningEvidenceAuthorityBoundary {
  readonly planningEvidenceOnly: true
  readonly liveEvidenceAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly executionAuthority: false
  readonly runtimeAuthority: false
  readonly queueAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly costAuthority: false
  readonly qaAuthority: false
  readonly productionReady: false
}

export interface LivingFramePlanningEvidenceCanonicalBindings {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly livingFrameComponentDigestSha256: string
  readonly compiledIntentDigestSha256: string
  readonly sourceSequenceDigestSha256: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingDigestSha256: string
  readonly ideaFirstAuthorityDigestSha256: string | null
}

export interface LivingFramePlanningObservationProjection {
  readonly observationId: string
  readonly order: number
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly category: LivingFramePlanningObservationCategory
  readonly summary: string
  readonly confidenceBasisPoints: number
  readonly evidenceSampleCount: number
  readonly evidenceSampleSetDigestSha256: string
}

export interface LivingFramePlanningSourceEvidenceProjection {
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly sourceChecksumSha256: string
  readonly planHashSha256: string
  readonly evidencePackageHashSha256: string
  readonly checkpointSha256: string
  readonly coverageDigestSha256: string
  readonly cacheKeySha256: string
  readonly observationCount: number
  readonly observations: readonly LivingFramePlanningObservationProjection[]
  readonly observationSetDigestSha256: string
  readonly reasoningConsumptionAllowed: true
  readonly userReviewRequired: false
}

export interface LivingFramePlanningEvidenceBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_VERSION
  readonly contractSource:
    typeof LIVING_FRAME_PLANNING_EVIDENCE_CONTRACT_SOURCE
  readonly status: LivingFramePlanningEvidenceStatus
  readonly runtimeReadiness:
    typeof LIVING_FRAME_PLANNING_EVIDENCE_RUNTIME_READINESS
  readonly sourceMode: LivingFramePlanningEvidenceSourceMode
  readonly evidenceClass: LivingFramePlanningEvidenceClass
  readonly canonicalBindings: LivingFramePlanningEvidenceCanonicalBindings
  readonly sourceEvidence: readonly LivingFramePlanningSourceEvidenceProjection[]
  readonly sourceEvidenceCount: number
  readonly evidenceSetDigestSha256: string
  readonly authorityBoundary: LivingFramePlanningEvidenceAuthorityBoundary
}

export interface LivingFramePlanningEvidenceBinding
  extends LivingFramePlanningEvidenceBindingDraft {
  readonly contractDigestSha256: string
}

export interface LivingFramePlanningEvidenceValidationIssue {
  readonly code:
    | 'schema_invalid'
    | 'contract_digest_invalid'
    | 'semantic_invariant_invalid'
  readonly path: string
}

export type LivingFramePlanningEvidenceValidationResult =
  | {
      readonly ok: true
      readonly binding: LivingFramePlanningEvidenceBinding
    }
  | {
      readonly ok: false
      readonly issues: readonly LivingFramePlanningEvidenceValidationIssue[]
    }
