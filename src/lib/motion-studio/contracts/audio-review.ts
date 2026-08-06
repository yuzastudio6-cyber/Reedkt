import { z } from 'zod'

import {
  MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION,
  type MotionStudioAudioReviewSummaryDto,
} from '../../../types/motion-studio/audio-review'

const stableId = z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const nonnegativeSafeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const safeReviewReason = z.string().min(1).max(1_000).refine((value) =>
  [...value].every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }))

const audioReviewRoleSummarySchema = z.object({
  role: z.enum(['music', 'foley', 'ambience', 'exact_sfx']),
  decision: z.enum(['included', 'not_selected', 'not_needed']),
  selectedItemCount: nonnegativeSafeInteger.max(64),
}).strict().superRefine((value, context) => {
  const selected = value.decision === 'included'
  if (selected !== (value.selectedItemCount > 0)) {
    context.addIssue({
      code: 'custom',
      path: ['selectedItemCount'],
      message: 'Included audio roles require selected items; omitted roles require zero selected items.',
    })
  }
})

export const motionStudioAudioReviewSummaryDtoSchema:
z.ZodType<MotionStudioAudioReviewSummaryDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION),
  productionId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  state: z.enum(['ready_for_review', 'changes_requested', 'rejected', 'approved_locked', 'stale']),
  selectionVersion: positiveSafeInteger,
  requiredNarrationSegmentCount: positiveSafeInteger.max(512),
  selectedNarrationSegmentCount: positiveSafeInteger.max(512),
  optionalRoles: z.array(audioReviewRoleSummarySchema).length(4).readonly(),
  narrationAssemblyVerified: z.literal(true),
  integratedMixVerified: z.literal(true),
  mixArtifactId: stableId,
  durationFrames: positiveSafeInteger,
  frameRate: z.number().int().min(1).max(120),
  passedBlockingCheckCount: nonnegativeSafeInteger.max(14),
  totalBlockingCheckCount: z.literal(14),
  allBlockingChecksPassed: z.literal(true),
  review: z.object({
    decision: z.enum(['accepted', 'changes_requested', 'rejected']),
    reason: safeReviewReason,
    reviewedAt: z.string().datetime(),
    immutable: z.literal(true),
  }).strict().optional(),
  recoveryAction: z.enum([
    'replanning_required',
    'reselection_required',
    'remix_required',
    're_review_required',
  ]).optional(),
  fineCutHandoffEligible: z.boolean(),
  privateReviewOnly: z.literal(true),
  timelineReady: z.literal(false),
  finalVideoReady: z.literal(false),
  renderReady: z.literal(false),
  exportReady: z.literal(false),
  publicDeliveryReady: z.literal(false),
  productReady: z.literal(false),
}).strict().superRefine((value, context) => {
  const roles = value.optionalRoles.map((role) => role.role)
  if (new Set(roles).size !== 4) {
    context.addIssue({ code: 'custom', path: ['optionalRoles'], message: 'Every optional audio role must appear exactly once.' })
  }
  if (value.selectedNarrationSegmentCount !== value.requiredNarrationSegmentCount) {
    context.addIssue({
      code: 'custom',
      path: ['selectedNarrationSegmentCount'],
      message: 'Reviewable audio must select every required narration segment.',
    })
  }
  if (value.passedBlockingCheckCount !== value.totalBlockingCheckCount) {
    context.addIssue({
      code: 'custom',
      path: ['passedBlockingCheckCount'],
      message: 'Reviewable audio requires every blocking quality check to pass.',
    })
  }

  const expectedDecision = value.state === 'approved_locked'
    ? 'accepted'
    : value.state === 'changes_requested'
      ? 'changes_requested'
      : value.state === 'rejected'
        ? 'rejected'
        : undefined
  if (value.state !== 'stale' && expectedDecision !== value.review?.decision) {
    context.addIssue({
      code: 'custom',
      path: ['review'],
      message: 'Audio review state must match its immutable review decision.',
    })
  }
  if (value.state === 'stale' && !value.recoveryAction) {
    context.addIssue({ code: 'custom', path: ['recoveryAction'], message: 'Stale audio must name its recovery path.' })
  }
  if (value.state !== 'stale' && value.recoveryAction) {
    context.addIssue({ code: 'custom', path: ['recoveryAction'], message: 'Only stale audio may expose a recovery path.' })
  }
  const eligible = value.state === 'approved_locked' && value.review?.decision === 'accepted'
  if (value.fineCutHandoffEligible !== eligible) {
    context.addIssue({
      code: 'custom',
      path: ['fineCutHandoffEligible'],
      message: 'Fine Cut handoff requires an immutable accepted review and every blocking check.',
    })
  }
})
