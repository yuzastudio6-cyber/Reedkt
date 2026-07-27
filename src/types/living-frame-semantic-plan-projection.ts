import type {
  LivingFrameProfessionalSkillComponent,
} from './living-frame'

export const LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_VERSION =
  'living-frame-semantic-plan-projection-v1' as const

export const LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_CLASS =
  'controlled_non_promotable_professional_skill_plan_projection' as const

export const LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_STATES = [
  'blocked_candidate_projection',
  'deliberate_non_use_projection',
  'blocked_semantic_result_projection',
] as const
export type LivingFrameSemanticPlanProjectionState =
  (typeof LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_STATES)[number]

export const LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_BLOCKERS = [
  'generic_source_speech_evidence_required',
  'shared_route_data_assurance_required',
  'continuity_pack_required',
  'released_reasoning_lifecycle_required',
  'canonical_selected_scene_admission_required',
] as const
export type LivingFrameSemanticPlanProjectionBlocker =
  (typeof LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_BLOCKERS)[number]

export interface LivingFrameSemanticPlanProjectionAuthorityBoundary {
  readonly controlledPlanShapeProjectionOnly: true
  readonly liveEvidenceAuthority: false
  readonly reasoningRunAuthority: false
  readonly reasoningResultAuthority: false
  readonly selectedSceneAuthority: false
  readonly canonicalComponentPlanAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactQaAuthority: false
  readonly renderAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSemanticPlanProjectionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_VERSION
  readonly projectionClass:
    typeof LIVING_FRAME_SEMANTIC_PLAN_PROJECTION_CLASS
  readonly projectionState: LivingFrameSemanticPlanProjectionState
  readonly sourceBindings: {
    readonly deferredLivingFrameComponentDigestSha256: string
    readonly semanticProposalBindingDigestSha256: string
    readonly semanticRequestDigestSha256: string
    readonly semanticResultDigestSha256: string
    readonly visualContinuityPackDigestSha256: string | null
  }
  readonly projectedComponent: LivingFrameProfessionalSkillComponent
  readonly blockingReasonCodes:
    readonly LivingFrameSemanticPlanProjectionBlocker[]
  readonly authorityBoundary:
    LivingFrameSemanticPlanProjectionAuthorityBoundary
  readonly existingProfessionalSkillPlanRemainsAuthority: true
  readonly sharedSpeechRouteAndReasoningAuthoritiesStillRequired: true
  readonly containsSelectedSceneOrRuntimeAuthority: false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderToolWorkQueueCostOrCommercialRoute: false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
  readonly promotionAllowed: false
}

export interface LivingFrameSemanticPlanProjection
  extends LivingFrameSemanticPlanProjectionDraft {
  readonly projectionDigestSha256: string
}
