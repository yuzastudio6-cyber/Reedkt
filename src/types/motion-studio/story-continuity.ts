import type { ID } from '../shared'
import type { MotionStudioOwnership, MotionStudioVersionReference } from './shared'
import type { StorytellingMotionStyleProfileReference } from './styles'

export const MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_GRAMMAR_VERSION =
  'motion-studio.storytelling-story-continuity-grammar.v1' as const
export const MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_PREPARATION_VERSION =
  'motion-studio.storytelling-story-continuity-preparation.v1' as const
export const MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_REVIEW_VERSION =
  'motion-studio.storytelling-story-continuity-review.v1' as const
export const MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_REVIEW_VERSION =
  'motion-studio.storytelling-scene-continuity-review.v1' as const
export const MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_SLICE_VERSION =
  'motion-studio.storytelling-scene-continuity-slice.v1' as const

export type StorytellingStoryArcMode =
  | 'question_resolution'
  | 'thesis_evidence'
  | 'chronology_consequence'
  | 'character_transformation'

export interface StorytellingStoryArcPlan {
  mode: StorytellingStoryArcMode
  openingPrompt: string
  openingSegmentId: ID
  resolutionSummary: string
  resolutionSegmentId: ID
  resolutionMode: 'answered' | 'qualified' | 'intentionally_open'
  unresolvedUncertainty: readonly string[]
}

export type StorytellingThroughLineOrigin =
  | 'original_reeditpro_concept'
  | 'user_authorized_asset'
  | 'licensed_asset'
  | 'public_domain_source'
  | 'source_derived_noncopying'
  | 'representative_nonliteral'

export interface StorytellingThroughLineAppearance {
  order: number
  sceneId: ID
  segmentId: ID
  role: 'establish' | 'develop' | 'complicate' | 'reveal' | 'payoff'
  semanticChange: string
  treatmentDirection: string
  claimIds: readonly ID[]
  sourceReferenceIds: readonly ID[]
}

export type StorytellingThroughLinePlan =
  | {
      mode: 'none_selected'
      reason: string
    }
  | {
      mode: 'recurring_motif'
      motifId: ID
      label: string
      semanticRole: string
      origin: StorytellingThroughLineOrigin
      rightsEvidenceIds: readonly ID[]
      continuityRules: readonly string[]
      appearances: readonly StorytellingThroughLineAppearance[]
    }

export interface StorytellingRevealBeat {
  id: ID
  sceneId: ID
  segmentId: ID
  triggerFrame: number
  kind: 'evidence' | 'identity' | 'cause' | 'consequence' | 'motif_payoff'
  purpose: string
  claimIds: readonly ID[]
  sourceReferenceIds: readonly ID[]
}

export interface StorytellingTransitionContinuity {
  id: ID
  fromSceneId: ID
  fromSegmentId: ID
  toSceneId: ID
  toSegmentId: ID
  anchorKind: 'motif' | 'screen_direction' | 'shape' | 'location' | 'chronology' | 'sound_bridge'
  anchorId: ID
  continuityRule: string
  transitionFamily: string
}

export interface StorytellingRhythmBeat {
  id: ID
  sceneId: ID
  segmentId: ID
  triggerFrame: number
  kind: 'impact' | 'pause' | 'scale_shift'
  narrativeReason: string
  scaleDirection?: 'expand' | 'contract' | 'reset'
}

export interface StorytellingStoryContinuityGrammarProposal {
  arc: StorytellingStoryArcPlan
  throughLine: StorytellingThroughLinePlan
  revealBeats: readonly StorytellingRevealBeat[]
  transitionContinuity: readonly StorytellingTransitionContinuity[]
  rhythmBeats: readonly StorytellingRhythmBeat[]
}

/**
 * Cross-scene story grammar frozen inside the existing Motion DNA artifact.
 * It contains no provider, executable, billing, or customer-price authority.
 */
export interface StorytellingStoryContinuityGrammar
  extends MotionStudioOwnership, StorytellingStoryContinuityGrammarProposal {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_GRAMMAR_VERSION
  productionId: ID
  storyBibleVersion: MotionStudioVersionReference
  preparedScriptVersion: MotionStudioVersionReference
  styleProfile: StorytellingMotionStyleProfileReference
  referenceContractVersions: readonly MotionStudioVersionReference[]
  sourceAuditDigests: readonly string[]
  precisionCompositionPolicy: {
    essentialTextAuthority: 'reeditpro_deterministic_layers'
    mapChartDataAuthority: 'reeditpro_deterministic_layers'
    finalCompositionAuthority: 'remotion'
    fixedStoryBlockDurationAllowed: false
    forcedContinuousOnerAllowed: false
    providerIdentityAllowed: false
    publisherImitationAllowed: false
  }
  grammarDigest: string
  status: 'draft_for_plan_review'
  immutable: true
  planReviewIsSoleApprovalAuthority: true
  approvedSnapshotMutationAllowed: false
  runtimeExecutionAuthorized: false
}

/** Browser-safe result of persisting the grammar into the one Motion DNA artifact. */
export interface StorytellingStoryContinuityPreparationDto {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_PREPARATION_VERSION
  productionId: ID
  projectId: ID
  editSessionId: ID
  state: 'ready_for_plan_review'
  styleDisplayName: string
  arcMode: StorytellingStoryArcMode
  throughLineMode: StorytellingThroughLinePlan['mode']
  throughLineAppearanceCount: number
  revealBeatCount: number
  transitionCount: number
  rhythmBeatCount: number
  motionDnaVersion: MotionStudioVersionReference
  planReviewIsSoleApprovalAuthority: true
  customerPriceCalculatedHere: false
  customerCreditsMutated: false
  runtimeExecutionAuthorized: false
  localCandidateOnly: true
}

export type StorytellingStoryContinuityReviewState =
  | 'not_ready'
  | 'needs_preparation'
  | 'ready_for_plan_review'
  | 'approved_locked'
  | 'stale'

export type StorytellingStoryContinuityReviewAction =
  | 'continue_in_chat'
  | 'review_plan'
  | 'request_revision_in_chat'
  | 'continue_replanning'

/**
 * Browser-safe, read-only projection of the Story Continuity Grammar stored in
 * the production's one Motion DNA artifact. Artifact IDs, version IDs,
 * digests, compiler inputs, providers, jobs, and cost evidence stay server-only.
 */
export interface StorytellingStoryContinuityReviewDto {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_REVIEW_VERSION
  state: StorytellingStoryContinuityReviewState
  statusLabel: string
  title: string
  summary: string
  arcMode?: StorytellingStoryArcMode
  arcLabel?: string
  throughLineMode?: StorytellingThroughLinePlan['mode']
  throughLineLabel?: string
  throughLineAppearanceCount: number
  revealBeatCount: number
  transitionCount: number
  rhythmBeatCount: number
  unresolvedUncertaintyCount: number
  nextAction: {
    kind: StorytellingStoryContinuityReviewAction
    label: string
  }
  planReviewIsSoleApprovalAuthority: true
  approvedLocked: boolean
  priorApprovedVersionPreserved: true
  approvedSnapshotMutationAllowed: false
  readOnly: true
  runtimeExecutionAuthorized: false
  localCandidateOnly: true
  notice: string
}

export type StorytellingSceneContinuityReviewState =
  | 'not_ready'
  | 'ready_for_review'
  | 'needs_review'
  | 'approved_locked'
  | 'stale'

export type StorytellingSceneContinuityReviewAction =
  | 'continue_in_chat'
  | 'review_scene'
  | 'request_revision_in_chat'
  | 'continue_replanning'

/**
 * Browser-safe scene projection. Exact artifact/version/digest, transition
 * target, provider, job, and cost authority remain server-only.
 */
export interface StorytellingSceneContinuityReviewDto {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_REVIEW_VERSION
  state: StorytellingSceneContinuityReviewState
  statusLabel: string
  title: string
  summary: string
  arcRole?: StorytellingSceneArcRole
  arcRoleLabel?: string
  throughLineMode?: StorytellingThroughLinePlan['mode']
  throughLineLabel?: string
  throughLineAppearanceCount: number
  revealBeatCount: number
  transitionCount: number
  rhythmBeatCount: number
  unresolvedUncertaintyCount: number
  nextAction: {
    kind: StorytellingSceneContinuityReviewAction
    label: string
  }
  reviewRequired: boolean
  planReviewIsSoleApprovalAuthority: true
  approvedLocked: boolean
  priorApprovedVersionPreserved: true
  approvedSnapshotMutationAllowed: false
  readOnly: true
  runtimeExecutionAuthorized: false
  localCandidateOnly: true
  notice: string
}

export type StorytellingSceneArcRole =
  | 'opening'
  | 'development'
  | 'resolution'
  | 'opening_and_resolution'

export type StorytellingSceneThroughLine =
  | {
      mode: 'none_selected'
      reason: string
    }
  | {
      mode: 'recurring_motif'
      motifId: ID
      label: string
      semanticRole: string
      origin: StorytellingThroughLineOrigin
      rightsEvidenceIds: readonly ID[]
      continuityRules: readonly string[]
      appearances: readonly StorytellingThroughLineAppearance[]
    }

/**
 * One scene's read-only projection from the exact Story Continuity Grammar
 * stored in the Motion DNA version frozen by the approved plan snapshot.
 */
export interface StorytellingSceneContinuitySlice extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_SLICE_VERSION
  productionId: ID
  sceneId: ID
  sourceMotionDnaVersion: MotionStudioVersionReference
  sourcePreparedScriptVersion: MotionStudioVersionReference
  sourceGrammarDigest: string
  arc: {
    mode: StorytellingStoryArcMode
    role: StorytellingSceneArcRole
    openingPrompt?: string
    resolutionSummary?: string
    resolutionMode?: StorytellingStoryArcPlan['resolutionMode']
    unresolvedUncertainty: readonly string[]
  }
  throughLine: StorytellingSceneThroughLine
  revealBeats: readonly StorytellingRevealBeat[]
  incomingTransition?: StorytellingTransitionContinuity
  outgoingTransition?: StorytellingTransitionContinuity
  rhythmBeats: readonly StorytellingRhythmBeat[]
  precisionCompositionPolicy: StorytellingStoryContinuityGrammar['precisionCompositionPolicy']
  approvedSnapshotProjection: true
  runtimeExecutionAuthorized: false
  sliceDigest: string
  immutable: true
}
