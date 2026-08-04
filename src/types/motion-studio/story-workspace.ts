import type { ID } from '../shared'
import type { MotionStudioArtifactVersionState } from './artifacts'
import type { MotionStudioDigest, MotionStudioVersionReference } from './shared'
import type {
  StorytellingMotionStyleDecisionDto,
  StorytellingMotionStyleReviewDto,
  StyleCalibrationScenarioKind,
} from './styles'
import type { StorytellingStoryContinuityReviewDto } from './story-continuity'

export const MOTION_STUDIO_STORYTELLING_STYLE_CALIBRATION_REVIEW_VERSION =
  'motion-studio.storytelling-style-calibration-review.v1' as const

export type MotionStudioStoryWorkspaceState =
  | 'empty'
  | 'story_ready'
  | 'script_ready'
  | 'approved_read_only'

export interface MotionStudioStoryVersionAuthorityDto {
  artifactId: ID
  currentVersion: MotionStudioVersionReference
  versionState: Extract<
    MotionStudioArtifactVersionState,
    'draft' | 'in_review' | 'approved' | 'locked'
  >
  currentApprovedVersion?: MotionStudioVersionReference
}

export interface MotionStudioStoryBibleDto extends MotionStudioStoryVersionAuthorityDto {
  premise: string
  narrativeAngle: string
  narratorPerspective: string
  chapters: readonly string[]
  people: readonly string[]
  locations: readonly string[]
  events: readonly string[]
  emotionalArc: readonly string[]
  approvedDecisionCount: number
}

export interface MotionStudioStoryScriptSegmentDto {
  order: number
  startFrame: number
  endFrame: number
  text: string
  meaning: string
  visualCue: string
  claimCount: number
  sourceReferenceCount: number
}

export interface MotionStudioStoryScriptChapterDto {
  order: number
  title: string
  sceneCount: number
  narrationSegments: readonly MotionStudioStoryScriptSegmentDto[]
}

export interface MotionStudioPreparedScriptDto extends MotionStudioStoryVersionAuthorityDto {
  title: string
  language: string
  timing: {
    frameRate: number
    width: number
    height: number
    aspectRatio: string
    durationFrames: number
    timingAuthorityDigest: MotionStudioDigest
  }
  chapters: readonly MotionStudioStoryScriptChapterDto[]
  narrationSegmentCount: number
  userLockedText: true
}

export type StorytellingStyleCalibrationReviewState =
  | 'not_ready'
  | 'awaiting_plan_review'
  | 'approved_not_started'
  | 'preparing'
  | 'resumable'
  | 'needs_review'
  | 'blocked'
  | 'approved_locked'
  | 'stale'

export type StorytellingStyleCalibrationScenarioStatus =
  | 'not_started'
  | 'preparing'
  | 'ready_for_review'
  | 'accepted'
  | 'needs_attention'
  | 'stale'

export interface StorytellingStyleCalibrationScenarioDto {
  kind: StyleCalibrationScenarioKind
  label: string
  purpose: string
  status: StorytellingStyleCalibrationScenarioStatus
  statusLabel: string
}

export type StorytellingStyleCalibrationReviewAction =
  | 'discuss_in_chat'
  | 'review_plan'
  | 'continue_in_chat'
  | 'request_recovery_in_chat'
  | 'request_revision_in_chat'
  | 'continue_replanning'

/**
 * Browser-safe, read-only projection of the private five-scenario calibration
 * lifecycle. Canonical attempts, provider/tool identities, object locations,
 * digests, and internal cost amounts remain server-only.
 */
export interface StorytellingStyleCalibrationReviewDto {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_CALIBRATION_REVIEW_VERSION
  state: StorytellingStyleCalibrationReviewState
  selectedStyleDisplayName?: string
  statusLabel: string
  title: string
  summary: string
  scenarios: readonly StorytellingStyleCalibrationScenarioDto[]
  completedScenarioCount: number
  acceptedScenarioCount: number
  needsAttentionCount: number
  currentScenarioKind?: StyleCalibrationScenarioKind
  nextAction: {
    kind: StorytellingStyleCalibrationReviewAction
    label: string
  }
  decisionAuthority: 'existing_chat_and_plan_review'
  privateReviewOnly: true
  automaticSelectionAllowed: false
  approvedPlanMutationAllowed: false
  readOnly: true
  runtimeExecutionAuthorized: false
  notice: string
}

/** Browser-safe, read-only projection of exact Story Bible and Prepared Script versions. */
export interface MotionStudioStoryWorkspaceDto {
  productionId: ID
  projectId: ID
  editSessionId: ID
  state: MotionStudioStoryWorkspaceState
  storyBible?: MotionStudioStoryBibleDto
  preparedScript?: MotionStudioPreparedScriptDto
  motionStyleReview: StorytellingMotionStyleReviewDto
  motionStyleDecision: StorytellingMotionStyleDecisionDto
  storyContinuityReview: StorytellingStoryContinuityReviewDto
  styleCalibrationReview: StorytellingStyleCalibrationReviewDto
  readOnly: true
  notice: string
  localCandidateOnly: true
}
