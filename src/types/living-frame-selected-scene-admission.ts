import type {
  LivingFrameMode,
} from './living-frame'

export const LIVING_FRAME_SELECTED_SCENE_ADMISSION_VERSION =
  'living-frame-selected-scene-admission-candidate-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_ADMISSION_CLASS =
  'controlled_non_promotable_selected_scene_admission_candidate' as const

export const LIVING_FRAME_SELECTED_SCENE_ADMISSION_STATES = [
  'candidate_ready_for_canonical_owner_decision',
  'deliberate_non_use_preserved',
  'blocked_by_upstream_authority_expectation',
] as const
export type LivingFrameSelectedSceneAdmissionState =
  (typeof LIVING_FRAME_SELECTED_SCENE_ADMISSION_STATES)[number]

export const LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS = [
  'canonical_planning_handoff',
  'planning_evidence',
  'source_speech_evidence',
  'route_data_assurance',
  'released_reasoning_result',
  'visual_continuity_pack',
  'confirmed_output_frame',
  'current_master_timing',
] as const
export type LivingFrameSelectedSceneAuthorityKind =
  (typeof LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS)[number]

export const LIVING_FRAME_SELECTED_SCENE_AUTHORITY_EXPECTATION_STATES = [
  'controlled_current_match',
  'missing',
  'stale_or_mismatched',
] as const
export type LivingFrameSelectedSceneAuthorityExpectationState =
  (typeof LIVING_FRAME_SELECTED_SCENE_AUTHORITY_EXPECTATION_STATES)[number]

export const LIVING_FRAME_SELECTED_SCENE_ADMISSION_BLOCKERS = [
  'canonical_planning_handoff_required',
  'planning_evidence_required',
  'source_speech_evidence_required',
  'route_data_assurance_required',
  'released_reasoning_result_required',
  'visual_continuity_pack_required',
  'confirmed_output_frame_required',
  'current_master_timing_required',
  'canonical_plan_owner_selection_required',
  'canonical_estimate_required',
  'canonical_approval_required',
  'approved_snapshot_required',
] as const
export type LivingFrameSelectedSceneAdmissionBlocker =
  (typeof LIVING_FRAME_SELECTED_SCENE_ADMISSION_BLOCKERS)[number]

export interface LivingFrameSelectedSceneCanonicalScope {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly handoffId: string
}

export interface LivingFrameSelectedSceneAuthorityExpectation {
  readonly authorityKind: LivingFrameSelectedSceneAuthorityKind
  readonly expectationState:
    LivingFrameSelectedSceneAuthorityExpectationState
  readonly authorityDigestSha256: string | null
}

export interface LivingFrameSelectedSceneCandidateRef {
  readonly sceneId: string
  readonly order: number
  readonly segmentExpectationId: string
  readonly mode: LivingFrameMode
  readonly scenePlanDigestSha256: string
  readonly sourceDecision: 'defer'
}

export interface LivingFrameSelectedSceneAdmissionMetrics {
  readonly candidateSceneCount: number
  readonly currentAuthorityExpectationCount: number
  readonly unresolvedAuthorityExpectationCount: number
  readonly blockerCount: number
}

export interface LivingFrameSelectedSceneAdmissionAuthorityBoundary {
  readonly admissionCandidateOnly: true
  readonly selectedSceneAuthority: false
  readonly professionalSkillPlanMutationAuthority: false
  readonly planningHandoffMutationAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly artifactQaAuthority: false
  readonly rendererAuthority: false
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSelectedSceneAdmissionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_ADMISSION_VERSION
  readonly admissionClass:
    typeof LIVING_FRAME_SELECTED_SCENE_ADMISSION_CLASS
  readonly admissionState: LivingFrameSelectedSceneAdmissionState
  readonly canonicalScope: LivingFrameSelectedSceneCanonicalScope
  readonly sourceBindings: {
    readonly deferredLivingFrameComponentDigestSha256: string
    readonly semanticPlanProjectionDigestSha256: string
    readonly semanticProposalBindingDigestSha256: string
    readonly semanticRequestDigestSha256: string
    readonly semanticResultDigestSha256: string
    readonly visualContinuityPackDigestSha256: string | null
    readonly outputFrameExpectationDigestSha256: string
    readonly masterTimingExpectationDigestSha256: string
  }
  readonly authorityExpectations:
    readonly LivingFrameSelectedSceneAuthorityExpectation[]
  readonly candidateScenes:
    readonly LivingFrameSelectedSceneCandidateRef[]
  readonly deliberateNonUse: boolean
  readonly blockerCodes:
    readonly LivingFrameSelectedSceneAdmissionBlocker[]
  readonly metrics: LivingFrameSelectedSceneAdmissionMetrics
  readonly authorityBoundary:
    LivingFrameSelectedSceneAdmissionAuthorityBoundary
  readonly existingProfessionalSkillPlanRemainsAuthority: true
  readonly existingCanonicalPlanningHandoffRemainsAuthority: true
  readonly canonicalPlanOwnerMustSelectOrReject: true
  readonly containsSelectedScene: false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderToolWorkQueueCostOrCommercialRoute: false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
  readonly promotionAllowed: false
}

export interface LivingFrameSelectedSceneAdmission
  extends LivingFrameSelectedSceneAdmissionDraft {
  readonly admissionDigestSha256: string
}
