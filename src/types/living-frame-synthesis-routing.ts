import type {
  LivingFrameCapabilityKey,
  LivingFrameTransparencyExpectation,
} from './living-frame'

export const LIVING_FRAME_SYNTHESIS_ROUTING_VERSION =
  'living-frame-synthesis-routing-v1' as const

export const LIVING_FRAME_SYNTHESIS_ROUTING_CLASS =
  'controlled_non_promotable_abstract_synthesis_routing' as const

export const LIVING_FRAME_SYNTHESIS_STATES = [
  'candidate_routes_compiled',
  'deliberate_non_use',
  'blocked_no_safe_route',
] as const
export type LivingFrameSynthesisState =
  (typeof LIVING_FRAME_SYNTHESIS_STATES)[number]

export const LIVING_FRAME_SYNTHESIS_STRATEGIES = [
  'reuse_approved_asset_candidate',
  'deterministic_construction_candidate',
  'approved_still_generation_or_edit_candidate',
  'controlled_still_variation_candidate',
  'bounded_generated_video_last_resort_candidate',
  'simpler_visual_or_non_use_fallback',
] as const
export type LivingFrameSynthesisStrategy =
  (typeof LIVING_FRAME_SYNTHESIS_STRATEGIES)[number]

export const LIVING_FRAME_SYNTHESIS_REASON_CODES = [
  'approved_source_reuse_preferred',
  'exact_deterministic_construction_required',
  'generated_illustration_anchor_required',
  'continuity_conditioned_still_candidate_required',
  'organic_motion_not_reproducible_deterministically',
  'unsafe_or_unqualified_route_requires_simpler_visual',
  'deliberate_non_use_preserved',
] as const
export type LivingFrameSynthesisReasonCode =
  (typeof LIVING_FRAME_SYNTHESIS_REASON_CODES)[number]

export const LIVING_FRAME_SYNTHESIS_BLOCKER_CODES = [
  'canonical_selected_scene_required',
  'current_component_artifact_evidence_required',
  'current_visual_continuity_revalidation_required',
  'canonical_tool_strategy_projection_required',
  'canonical_provider_route_qualification_required',
  'canonical_estimate_and_approval_required',
  'alpha_artifact_and_qa_required',
  'temporal_mask_artifact_and_qa_required',
  'identity_conditioned_route_safety_blocked',
  'model_weight_or_adapter_qualification_required',
  'bounded_video_justification_required',
  'exact_map_or_data_must_remain_deterministic',
  'no_safe_synthesis_route',
] as const
export type LivingFrameSynthesisBlockerCode =
  (typeof LIVING_FRAME_SYNTHESIS_BLOCKER_CODES)[number]

export interface LivingFrameSynthesisSourceBindings {
  readonly semanticPlanProjectionDigestSha256: string
  readonly projectedComponentDigestSha256: string
}

export interface LivingFrameComponentSynthesisRoute {
  readonly sceneId: string
  readonly sceneOrder: number
  readonly componentId: string
  readonly componentOrder: number
  readonly primaryStrategy: LivingFrameSynthesisStrategy
  readonly orderedFallbackStrategies:
    readonly LivingFrameSynthesisStrategy[]
  readonly reasonCode: LivingFrameSynthesisReasonCode
  readonly capabilityKeys: readonly LivingFrameCapabilityKey[]
  readonly transparencyExpectation:
    LivingFrameTransparencyExpectation
  readonly blockerCodes: readonly LivingFrameSynthesisBlockerCode[]
  readonly generatedVideoIsLastResort: true
  readonly providerOrToolIdentitySelected: false
}

export interface LivingFrameSynthesisRoutingMetrics {
  readonly sceneCount: number
  readonly componentCount: number
  readonly reuseCandidateCount: number
  readonly deterministicCandidateCount: number
  readonly stillGenerationCandidateCount: number
  readonly controlledStillVariationCandidateCount: number
  readonly boundedVideoLastResortCandidateCount: number
  readonly simplerFallbackCount: number
}

export interface LivingFrameSynthesisRoutingAuthorityBoundary {
  readonly abstractStrategyPlanningOnly: true
  readonly selectedSceneAuthority: false
  readonly sourceAssetAuthority: false
  readonly continuityQaAuthority: false
  readonly exactFrameAuthority: false
  readonly masterTimingAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly modelWeightAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly artifactQaAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSynthesisRoutingPlanDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SYNTHESIS_ROUTING_VERSION
  readonly routingClass:
    typeof LIVING_FRAME_SYNTHESIS_ROUTING_CLASS
  readonly routingState: LivingFrameSynthesisState
  readonly sourceBindings: LivingFrameSynthesisSourceBindings
  readonly componentRoutes:
    readonly LivingFrameComponentSynthesisRoute[]
  readonly planBlockerCodes:
    readonly LivingFrameSynthesisBlockerCode[]
  readonly metrics: LivingFrameSynthesisRoutingMetrics
  readonly authorityBoundary:
    LivingFrameSynthesisRoutingAuthorityBoundary
  readonly synthesisLadderOrder: readonly [
    'reuse_approved_asset_candidate',
    'deterministic_construction_candidate',
    'approved_still_generation_or_edit_candidate',
    'controlled_still_variation_candidate',
    'bounded_generated_video_last_resort_candidate',
    'simpler_visual_or_non_use_fallback',
  ]
  readonly generatedVideoDefaultAllowed: false
  readonly containsProviderModelToolWorkQueueCostOrCommercialRoute: false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
  readonly promotionAllowed: false
}

export interface LivingFrameSynthesisRoutingPlan
  extends LivingFrameSynthesisRoutingPlanDraft {
  readonly routingDigestSha256: string
}
