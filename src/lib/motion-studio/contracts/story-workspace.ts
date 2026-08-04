import { z } from 'zod'

import type {
  MotionStudioPreparedScriptDto,
  MotionStudioStoryBibleDto,
  MotionStudioStoryScriptChapterDto,
  MotionStudioStoryScriptSegmentDto,
  MotionStudioStoryVersionAuthorityDto,
  MotionStudioStoryWorkspaceDto,
  StorytellingStyleCalibrationReviewDto,
  StorytellingStyleCalibrationScenarioDto,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_STYLE_CALIBRATION_REVIEW_VERSION,
} from '../../../types/motion-studio'
import { motionStudioVersionReferenceSchema } from './schemas'
import { storytellingStoryContinuityReviewDtoSchema } from './story-continuity'
import {
  storytellingMotionStyleDecisionDtoSchema,
  storytellingMotionStyleReviewDtoSchema,
} from './styles'

const nonEmpty = z.string().trim().min(1)
const stableId = nonEmpty.max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => !value.includes('..'))
const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const currentVersionState = z.enum(['draft', 'in_review', 'approved', 'locked'])
const calibrationScenarioKind = z.enum([
  'style_led_motion',
  'character_continuity',
  'strict_first_last_frame',
  'reference_heavy',
  'exact_text_data',
])

const storyVersionAuthorityShape = {
  artifactId: z.string().uuid(),
  currentVersion: motionStudioVersionReferenceSchema,
  versionState: currentVersionState,
  currentApprovedVersion: motionStudioVersionReferenceSchema.optional(),
} as const

function validateVersionAuthority(
  value: MotionStudioStoryVersionAuthorityDto,
  context: z.RefinementCtx,
): void {
  if (value.currentVersion.artifactId !== value.artifactId) {
    context.addIssue({ code: 'custom', path: ['currentVersion', 'artifactId'], message: 'Current version must belong to the exact artifact.' })
  }
  if (value.currentApprovedVersion?.artifactId !== undefined && value.currentApprovedVersion.artifactId !== value.artifactId) {
    context.addIssue({ code: 'custom', path: ['currentApprovedVersion', 'artifactId'], message: 'Approved version must belong to the exact artifact.' })
  }
  if (['approved', 'locked'].includes(value.versionState) && !value.currentApprovedVersion) {
    context.addIssue({ code: 'custom', path: ['currentApprovedVersion'], message: 'Approved or locked current state requires an approved version reference.' })
  }
}

export const motionStudioStoryVersionAuthorityDtoSchema: z.ZodType<MotionStudioStoryVersionAuthorityDto> = z.object(
  storyVersionAuthorityShape,
).strict().superRefine(validateVersionAuthority)

export const motionStudioStoryBibleDtoSchema: z.ZodType<MotionStudioStoryBibleDto> = z.object({
  ...storyVersionAuthorityShape,
  premise: nonEmpty.max(8_000),
  narrativeAngle: nonEmpty.max(2_000),
  narratorPerspective: nonEmpty.max(1_000),
  chapters: z.array(nonEmpty.max(500)).min(1).max(64).readonly(),
  people: z.array(nonEmpty.max(500)).max(256).readonly(),
  locations: z.array(nonEmpty.max(500)).max(256).readonly(),
  events: z.array(nonEmpty.max(2_000)).max(512).readonly(),
  emotionalArc: z.array(nonEmpty.max(500)).max(128).readonly(),
  approvedDecisionCount: safeInteger,
}).strict().superRefine(validateVersionAuthority)

export const motionStudioStoryScriptSegmentDtoSchema: z.ZodType<MotionStudioStoryScriptSegmentDto> = z.object({
  order: safeInteger,
  startFrame: safeInteger,
  endFrame: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  text: nonEmpty.max(8_000),
  meaning: nonEmpty.max(2_000),
  visualCue: nonEmpty.max(2_000),
  claimCount: safeInteger.max(128),
  sourceReferenceCount: safeInteger.max(128),
}).strict().refine((value) => value.endFrame > value.startFrame, {
  message: 'Story script segment requires a positive frame range.',
  path: ['endFrame'],
})

export const motionStudioStoryScriptChapterDtoSchema: z.ZodType<MotionStudioStoryScriptChapterDto> = z.object({
  order: safeInteger,
  title: nonEmpty.max(240),
  sceneCount: z.number().int().positive().max(8),
  narrationSegments: z.array(motionStudioStoryScriptSegmentDtoSchema).max(40).readonly(),
}).strict()

export const motionStudioPreparedScriptDtoSchema: z.ZodType<MotionStudioPreparedScriptDto> = z.object({
  ...storyVersionAuthorityShape,
  title: nonEmpty.max(240),
  language: nonEmpty.max(120),
  timing: z.object({
    frameRate: z.number().finite().positive().max(240),
    width: z.number().int().positive().max(16_384),
    height: z.number().int().positive().max(16_384),
    aspectRatio: nonEmpty.max(32),
    durationFrames: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    timingAuthorityDigest: digest,
  }).strict(),
  chapters: z.array(motionStudioStoryScriptChapterDtoSchema).min(1).max(8).readonly(),
  narrationSegmentCount: z.number().int().positive().max(40),
  userLockedText: z.literal(true),
}).strict().superRefine((value, context) => {
  validateVersionAuthority(value, context)
  let segmentCount = 0
  let nextSegmentOrder = 0
  let nextFrame = 0
  value.chapters.forEach((chapter, chapterIndex) => {
    if (chapter.order !== chapterIndex) {
      context.addIssue({ code: 'custom', path: ['chapters', chapterIndex, 'order'], message: 'Script chapter order must be contiguous and zero-based.' })
    }
    chapter.narrationSegments.forEach((segment, segmentIndex) => {
      if (segment.order !== nextSegmentOrder) {
        context.addIssue({ code: 'custom', path: ['chapters', chapterIndex, 'narrationSegments', segmentIndex, 'order'], message: 'Script segment order must remain globally contiguous.' })
      }
      if (segment.startFrame !== nextFrame) {
        context.addIssue({ code: 'custom', path: ['chapters', chapterIndex, 'narrationSegments', segmentIndex, 'startFrame'], message: 'Script segments must remain gap-free and non-overlapping.' })
      }
      nextSegmentOrder += 1
      segmentCount += 1
      nextFrame = segment.endFrame
    })
  })
  if (segmentCount !== value.narrationSegmentCount) {
    context.addIssue({ code: 'custom', path: ['narrationSegmentCount'], message: 'Narration segment count does not match the chapter projection.' })
  }
  if (nextFrame !== value.timing.durationFrames) {
    context.addIssue({ code: 'custom', path: ['timing', 'durationFrames'], message: 'Script projection must cover the exact timing duration.' })
  }
})

export const storytellingStyleCalibrationScenarioDtoSchema:
z.ZodType<StorytellingStyleCalibrationScenarioDto> = z.object({
  kind: calibrationScenarioKind,
  label: nonEmpty.max(120),
  purpose: nonEmpty.max(500),
  status: z.enum([
    'not_started',
    'preparing',
    'ready_for_review',
    'accepted',
    'needs_attention',
    'stale',
  ]),
  statusLabel: nonEmpty.max(80),
}).strict()

export const storytellingStyleCalibrationReviewDtoSchema:
z.ZodType<StorytellingStyleCalibrationReviewDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_CALIBRATION_REVIEW_VERSION),
  state: z.enum([
    'not_ready',
    'awaiting_plan_review',
    'approved_not_started',
    'preparing',
    'resumable',
    'needs_review',
    'blocked',
    'approved_locked',
    'stale',
  ]),
  selectedStyleDisplayName: nonEmpty.max(120).optional(),
  statusLabel: nonEmpty.max(120),
  title: nonEmpty.max(240),
  summary: nonEmpty.max(1_000),
  scenarios: z.array(storytellingStyleCalibrationScenarioDtoSchema).max(5).readonly(),
  completedScenarioCount: z.number().int().nonnegative().max(5),
  acceptedScenarioCount: z.number().int().nonnegative().max(5),
  needsAttentionCount: z.number().int().nonnegative().max(5),
  currentScenarioKind: calibrationScenarioKind.optional(),
  nextAction: z.object({
    kind: z.enum([
      'discuss_in_chat',
      'review_plan',
      'continue_in_chat',
      'request_recovery_in_chat',
      'request_revision_in_chat',
      'continue_replanning',
    ]),
    label: nonEmpty.max(120),
  }).strict(),
  decisionAuthority: z.literal('existing_chat_and_plan_review'),
  privateReviewOnly: z.literal(true),
  automaticSelectionAllowed: z.literal(false),
  approvedPlanMutationAllowed: z.literal(false),
  readOnly: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  notice: nonEmpty.max(1_000),
}).strict().superRefine((value, context) => {
  const expectedScenarioCount = value.state === 'not_ready' ? 0 : 5
  if (value.scenarios.length !== expectedScenarioCount) {
    context.addIssue({ code: 'custom', path: ['scenarios'], message: 'Calibration review state has an invalid scenario set.' })
  }
  const kinds = value.scenarios.map((scenario) => scenario.kind)
  if (new Set(kinds).size !== kinds.length) {
    context.addIssue({ code: 'custom', path: ['scenarios'], message: 'Calibration scenario kinds must be unique.' })
  }
  if (expectedScenarioCount === 5 && calibrationScenarioKind.options.some((kind) => !kinds.includes(kind))) {
    context.addIssue({ code: 'custom', path: ['scenarios'], message: 'Calibration review requires the exact five-scenario set.' })
  }
  const accepted = value.scenarios.filter((scenario) => scenario.status === 'accepted').length
  const attention = value.scenarios.filter((scenario) => scenario.status === 'needs_attention').length
  const completed = value.scenarios.filter((scenario) => [
    'ready_for_review', 'accepted', 'needs_attention',
  ].includes(scenario.status)).length
  if (value.acceptedScenarioCount !== accepted || value.needsAttentionCount !== attention ||
      value.completedScenarioCount !== completed) {
    context.addIssue({ code: 'custom', path: ['completedScenarioCount'], message: 'Calibration review counts must be derived from scenario state.' })
  }
  if (value.currentScenarioKind) {
    const current = value.scenarios.find((scenario) => scenario.kind === value.currentScenarioKind)
    if (!current || current.status !== 'preparing' || !['preparing', 'resumable'].includes(value.state)) {
      context.addIssue({ code: 'custom', path: ['currentScenarioKind'], message: 'Current scenario must be the exact preparing scenario.' })
    }
  }
  if (value.state === 'approved_locked' && (accepted !== 5 || attention !== 0)) {
    context.addIssue({ code: 'custom', path: ['state'], message: 'Approved calibration requires five accepted scenarios.' })
  }
  if (value.state === 'stale' && value.scenarios.some((scenario) => scenario.status !== 'stale')) {
    context.addIssue({ code: 'custom', path: ['scenarios'], message: 'Stale calibration must mark every scenario stale.' })
  }
  const expectedAction = {
    not_ready: 'discuss_in_chat',
    awaiting_plan_review: 'review_plan',
    approved_not_started: 'continue_in_chat',
    preparing: 'continue_in_chat',
    resumable: 'request_recovery_in_chat',
    needs_review: 'continue_in_chat',
    blocked: 'request_recovery_in_chat',
    approved_locked: 'request_revision_in_chat',
    stale: 'continue_replanning',
  }[value.state]
  if (value.nextAction.kind !== expectedAction) {
    context.addIssue({ code: 'custom', path: ['nextAction', 'kind'], message: 'Calibration review action does not match its state.' })
  }
})

export const motionStudioStoryWorkspaceDtoSchema: z.ZodType<MotionStudioStoryWorkspaceDto> = z.object({
  productionId: z.string().uuid(),
  projectId: stableId,
  editSessionId: stableId,
  state: z.enum(['empty', 'story_ready', 'script_ready', 'approved_read_only']),
  storyBible: motionStudioStoryBibleDtoSchema.optional(),
  preparedScript: motionStudioPreparedScriptDtoSchema.optional(),
  motionStyleReview: storytellingMotionStyleReviewDtoSchema,
  motionStyleDecision: storytellingMotionStyleDecisionDtoSchema,
  storyContinuityReview: storytellingStoryContinuityReviewDtoSchema,
  styleCalibrationReview: storytellingStyleCalibrationReviewDtoSchema,
  readOnly: z.literal(true),
  notice: nonEmpty.max(1_000),
  localCandidateOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.preparedScript && !value.storyBible) {
    context.addIssue({ code: 'custom', path: ['preparedScript'], message: 'Prepared Script cannot appear without the Story Bible authority.' })
  }
  if (value.state === 'empty' && (value.storyBible || value.preparedScript)) {
    context.addIssue({ code: 'custom', path: ['state'], message: 'Empty Story workspace cannot contain story artifacts.' })
  }
  if (value.state === 'story_ready' && (!value.storyBible || value.preparedScript)) {
    context.addIssue({ code: 'custom', path: ['state'], message: 'Story-ready state requires only a Story Bible.' })
  }
  if (['script_ready', 'approved_read_only'].includes(value.state) && (!value.storyBible || !value.preparedScript)) {
    context.addIssue({ code: 'custom', path: ['state'], message: 'Script states require both Story Bible and Prepared Script.' })
  }
  if (value.state === 'approved_read_only' && (
    !value.storyBible || !value.preparedScript ||
    !['approved', 'locked'].includes(value.storyBible.versionState) ||
    !['approved', 'locked'].includes(value.preparedScript.versionState)
  )) {
    context.addIssue({ code: 'custom', path: ['state'], message: 'Approved read-only state requires approved or locked Story Bible and script versions.' })
  }
  const calibrationStatesByDecision = {
    comparison_only: ['not_ready'],
    selected_for_plan: ['not_ready'],
    awaiting_plan_review: ['awaiting_plan_review'],
    approved_locked: [
      'approved_not_started', 'preparing', 'resumable', 'needs_review', 'blocked', 'approved_locked',
    ],
    stale_replan_required: ['stale'],
  } as const
  if (!(calibrationStatesByDecision[value.motionStyleDecision.state] as readonly string[])
    .includes(value.styleCalibrationReview.state)) {
    context.addIssue({ code: 'custom', path: ['styleCalibrationReview', 'state'], message: 'Calibration review does not match the style decision lifecycle.' })
  }
  if (value.motionStyleDecision.selectedStyleDisplayName !== value.styleCalibrationReview.selectedStyleDisplayName) {
    context.addIssue({ code: 'custom', path: ['styleCalibrationReview', 'selectedStyleDisplayName'], message: 'Calibration review must preserve the exact selected style name.' })
  }
})
