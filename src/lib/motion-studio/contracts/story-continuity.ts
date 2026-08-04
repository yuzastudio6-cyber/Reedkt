import { z } from 'zod'

import type {
  StorytellingStoryContinuityGrammar,
  StorytellingStoryContinuityGrammarProposal,
  StorytellingStoryContinuityPreparationDto,
  StorytellingStoryContinuityReviewDto,
  StorytellingSceneContinuityReviewDto,
  StorytellingSceneContinuitySlice,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_REVIEW_VERSION,
  MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_SLICE_VERSION,
  MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_GRAMMAR_VERSION,
  MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_PREPARATION_VERSION,
  MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_REVIEW_VERSION,
} from '../../../types/motion-studio'

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const safeText = (maximum: number) => z.string().trim().min(1).max(maximum)
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }))
  .refine((value) => !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/i.test(value))
const safeFrame = z.number().int().nonnegative().refine(Number.isSafeInteger)

const ownership = z.object({
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
}).strict()

const versionReference = z.object({
  artifactId: stableId,
  versionId: stableId,
  versionNumber: z.number().int().positive().refine(Number.isSafeInteger),
  contentDigest: digest,
}).strict()

const styleProfileReference = z.object({
  styleProfileId: z.enum([
    'storytelling_style.editorial_collage',
    'storytelling_style.cinematic_realist_documentary',
    'storytelling_style.paper_diorama_documentary',
    'storytelling_style.technical_blueprint',
  ]),
  styleProfileVersion: safeText(80),
  styleProfileDigest: digest,
}).strict()

export const storytellingStoryArcPlanSchema = z.object({
  mode: z.enum([
    'question_resolution',
    'thesis_evidence',
    'chronology_consequence',
    'character_transformation',
  ]),
  openingPrompt: safeText(2_000),
  openingSegmentId: stableId,
  resolutionSummary: safeText(2_000),
  resolutionSegmentId: stableId,
  resolutionMode: z.enum(['answered', 'qualified', 'intentionally_open']),
  unresolvedUncertainty: z.array(safeText(1_000)).max(32).readonly(),
}).strict().superRefine((value, context) => {
  if (value.openingSegmentId === value.resolutionSegmentId) {
    context.addIssue({
      code: 'custom',
      path: ['resolutionSegmentId'],
      message: 'Story arc opening and resolution must use different script segments.',
    })
  }
  if (value.resolutionMode === 'intentionally_open' && value.unresolvedUncertainty.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['unresolvedUncertainty'],
      message: 'An intentionally open ending must retain its unresolved uncertainty.',
    })
  }
})

const throughLineAppearance = z.object({
  order: z.number().int().nonnegative().refine(Number.isSafeInteger),
  sceneId: stableId,
  segmentId: stableId,
  role: z.enum(['establish', 'develop', 'complicate', 'reveal', 'payoff']),
  semanticChange: safeText(2_000),
  treatmentDirection: safeText(2_000),
  claimIds: z.array(stableId).max(128).readonly(),
  sourceReferenceIds: z.array(stableId).max(128).readonly(),
}).strict()

export const storytellingThroughLinePlanSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('none_selected'),
    reason: safeText(1_000),
  }).strict(),
  z.object({
    mode: z.literal('recurring_motif'),
    motifId: stableId,
    label: safeText(240),
    semanticRole: safeText(1_000),
    origin: z.enum([
      'original_reeditpro_concept',
      'user_authorized_asset',
      'licensed_asset',
      'public_domain_source',
      'source_derived_noncopying',
      'representative_nonliteral',
    ]),
    rightsEvidenceIds: z.array(stableId).max(128).readonly(),
    continuityRules: z.array(safeText(1_000)).min(1).max(32).readonly(),
    appearances: z.array(throughLineAppearance).min(2).max(128).readonly(),
  }).strict().superRefine((value, context) => {
    value.appearances.forEach((appearance, index) => {
      if (appearance.order !== index) {
        context.addIssue({
          code: 'custom',
          path: ['appearances', index, 'order'],
          message: 'Through-line appearances must be contiguous and zero-based.',
        })
      }
    })
    if (value.appearances[0]?.role !== 'establish') {
      context.addIssue({
        code: 'custom',
        path: ['appearances', 0, 'role'],
        message: 'A recurring motif must first be established.',
      })
    }
    if (value.appearances.at(-1)?.role !== 'payoff') {
      context.addIssue({
        code: 'custom',
        path: ['appearances', value.appearances.length - 1, 'role'],
        message: 'A recurring motif must end with an explicit payoff.',
      })
    }
    if (['user_authorized_asset', 'licensed_asset', 'public_domain_source']
      .includes(value.origin) && value.rightsEvidenceIds.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['rightsEvidenceIds'],
        message: 'An external motif origin requires exact rights evidence.',
      })
    }
  }),
])

export const storytellingRevealBeatSchema = z.object({
  id: stableId,
  sceneId: stableId,
  segmentId: stableId,
  triggerFrame: safeFrame,
  kind: z.enum(['evidence', 'identity', 'cause', 'consequence', 'motif_payoff']),
  purpose: safeText(2_000),
  claimIds: z.array(stableId).max(128).readonly(),
  sourceReferenceIds: z.array(stableId).max(128).readonly(),
}).strict()

export const storytellingTransitionContinuitySchema = z.object({
  id: stableId,
  fromSceneId: stableId,
  fromSegmentId: stableId,
  toSceneId: stableId,
  toSegmentId: stableId,
  anchorKind: z.enum(['motif', 'screen_direction', 'shape', 'location', 'chronology', 'sound_bridge']),
  anchorId: stableId,
  continuityRule: safeText(1_000),
  transitionFamily: safeText(240),
}).strict().refine((value) => value.fromSceneId !== value.toSceneId, {
  path: ['toSceneId'],
  message: 'Transition continuity must connect two different scenes.',
})

export const storytellingRhythmBeatSchema = z.object({
  id: stableId,
  sceneId: stableId,
  segmentId: stableId,
  triggerFrame: safeFrame,
  kind: z.enum(['impact', 'pause', 'scale_shift']),
  narrativeReason: safeText(1_000),
  scaleDirection: z.enum(['expand', 'contract', 'reset']).optional(),
}).strict().superRefine((value, context) => {
  if (value.kind === 'scale_shift' && !value.scaleDirection) {
    context.addIssue({
      code: 'custom',
      path: ['scaleDirection'],
      message: 'A scale-shift beat requires an explicit direction.',
    })
  }
  if (value.kind !== 'scale_shift' && value.scaleDirection) {
    context.addIssue({
      code: 'custom',
      path: ['scaleDirection'],
      message: 'Only a scale-shift beat may carry scale direction.',
    })
  }
})

const proposalShape = {
  arc: storytellingStoryArcPlanSchema,
  throughLine: storytellingThroughLinePlanSchema,
  revealBeats: z.array(storytellingRevealBeatSchema).max(128).readonly(),
  transitionContinuity: z.array(storytellingTransitionContinuitySchema).max(128).readonly(),
  rhythmBeats: z.array(storytellingRhythmBeatSchema).max(256).readonly(),
} as const

export const storytellingStoryContinuityGrammarProposalSchema:
z.ZodType<StorytellingStoryContinuityGrammarProposal> = z.object(proposalShape).strict()

export const storytellingStoryContinuityGrammarSchema:
z.ZodType<StorytellingStoryContinuityGrammar> = ownership.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_GRAMMAR_VERSION),
  productionId: stableId,
  storyBibleVersion: versionReference,
  preparedScriptVersion: versionReference,
  styleProfile: styleProfileReference,
  referenceContractVersions: z.array(versionReference).max(128).readonly(),
  sourceAuditDigests: z.array(digest).max(32).readonly(),
  ...proposalShape,
  precisionCompositionPolicy: z.object({
    essentialTextAuthority: z.literal('reeditpro_deterministic_layers'),
    mapChartDataAuthority: z.literal('reeditpro_deterministic_layers'),
    finalCompositionAuthority: z.literal('remotion'),
    fixedStoryBlockDurationAllowed: z.literal(false),
    forcedContinuousOnerAllowed: z.literal(false),
    providerIdentityAllowed: z.literal(false),
    publisherImitationAllowed: z.literal(false),
  }).strict(),
  grammarDigest: digest,
  status: z.literal('draft_for_plan_review'),
  immutable: z.literal(true),
  planReviewIsSoleApprovalAuthority: z.literal(true),
  approvedSnapshotMutationAllowed: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
}).strict().superRefine((value, context) => {
  assertUnique(value.sourceAuditDigests, ['sourceAuditDigests'], context)
  assertUnique(value.referenceContractVersions.map((version) => version.artifactId), ['referenceContractVersions'], context)
  assertUnique(value.revealBeats.map((beat) => beat.id), ['revealBeats'], context)
  assertUnique(value.transitionContinuity.map((transition) => transition.id), ['transitionContinuity'], context)
  assertUnique(value.transitionContinuity.map((transition) => `${transition.fromSceneId}:${transition.toSceneId}`), ['transitionContinuity'], context)
  assertUnique(value.rhythmBeats.map((beat) => beat.id), ['rhythmBeats'], context)
  assertUnique(value.rhythmBeats.map((beat) => `${beat.segmentId}:${beat.triggerFrame}`), ['rhythmBeats'], context)
})

export const storytellingStoryContinuityPreparationDtoSchema:
z.ZodType<StorytellingStoryContinuityPreparationDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_PREPARATION_VERSION),
  productionId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  state: z.literal('ready_for_plan_review'),
  styleDisplayName: safeText(120),
  arcMode: z.enum([
    'question_resolution',
    'thesis_evidence',
    'chronology_consequence',
    'character_transformation',
  ]),
  throughLineMode: z.enum(['none_selected', 'recurring_motif']),
  throughLineAppearanceCount: z.number().int().nonnegative().max(128),
  revealBeatCount: z.number().int().nonnegative().max(128),
  transitionCount: z.number().int().nonnegative().max(128),
  rhythmBeatCount: z.number().int().nonnegative().max(256),
  motionDnaVersion: versionReference,
  planReviewIsSoleApprovalAuthority: z.literal(true),
  customerPriceCalculatedHere: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  localCandidateOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.throughLineMode === 'none_selected' && value.throughLineAppearanceCount !== 0) {
    context.addIssue({
      code: 'custom',
      path: ['throughLineAppearanceCount'],
      message: 'A continuity plan without a recurring motif cannot report motif appearances.',
    })
  }
  if (value.throughLineMode === 'recurring_motif' && value.throughLineAppearanceCount < 2) {
    context.addIssue({
      code: 'custom',
      path: ['throughLineAppearanceCount'],
      message: 'A recurring motif requires at least two appearances.',
    })
  }
})

export const storytellingStoryContinuityReviewDtoSchema:
z.ZodType<StorytellingStoryContinuityReviewDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STORY_CONTINUITY_REVIEW_VERSION),
  state: z.enum([
    'not_ready',
    'needs_preparation',
    'ready_for_plan_review',
    'approved_locked',
    'stale',
  ]),
  statusLabel: safeText(120),
  title: safeText(240),
  summary: safeText(1_000),
  arcMode: z.enum([
    'question_resolution',
    'thesis_evidence',
    'chronology_consequence',
    'character_transformation',
  ]).optional(),
  arcLabel: safeText(120).optional(),
  throughLineMode: z.enum(['none_selected', 'recurring_motif']).optional(),
  throughLineLabel: safeText(240).optional(),
  throughLineAppearanceCount: z.number().int().nonnegative().max(128),
  revealBeatCount: z.number().int().nonnegative().max(128),
  transitionCount: z.number().int().nonnegative().max(128),
  rhythmBeatCount: z.number().int().nonnegative().max(256),
  unresolvedUncertaintyCount: z.number().int().nonnegative().max(32),
  nextAction: z.object({
    kind: z.enum([
      'continue_in_chat',
      'review_plan',
      'request_revision_in_chat',
      'continue_replanning',
    ]),
    label: safeText(120),
  }).strict(),
  planReviewIsSoleApprovalAuthority: z.literal(true),
  approvedLocked: z.boolean(),
  priorApprovedVersionPreserved: z.literal(true),
  approvedSnapshotMutationAllowed: z.literal(false),
  readOnly: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  localCandidateOnly: z.literal(true),
  notice: safeText(1_000),
}).strict().superRefine((value, context) => {
  const hasGrammarSummary = value.arcMode !== undefined && value.arcLabel !== undefined &&
    value.throughLineMode !== undefined && value.throughLineLabel !== undefined
  const expectsGrammarSummary = ['ready_for_plan_review', 'approved_locked', 'stale'].includes(value.state)
  if (hasGrammarSummary !== expectsGrammarSummary) {
    context.addIssue({
      code: 'custom',
      path: ['state'],
      message: 'Continuity review detail must appear only for a prepared current or preserved stale grammar.',
    })
  }
  const countTotal = value.throughLineAppearanceCount + value.revealBeatCount +
    value.transitionCount + value.rhythmBeatCount + value.unresolvedUncertaintyCount
  if (!expectsGrammarSummary && countTotal !== 0) {
    context.addIssue({
      code: 'custom',
      path: ['throughLineAppearanceCount'],
      message: 'Unprepared continuity review cannot report compiled story-flow counts.',
    })
  }
  if (value.throughLineMode === 'none_selected' && value.throughLineAppearanceCount !== 0) {
    context.addIssue({
      code: 'custom',
      path: ['throughLineAppearanceCount'],
      message: 'A story flow without a recurring motif cannot report motif appearances.',
    })
  }
  if (value.throughLineMode === 'recurring_motif' && value.throughLineAppearanceCount < 2) {
    context.addIssue({
      code: 'custom',
      path: ['throughLineAppearanceCount'],
      message: 'A recurring motif requires at least two story-flow appearances.',
    })
  }
  const expectedAction = {
    not_ready: 'continue_in_chat',
    needs_preparation: 'continue_in_chat',
    ready_for_plan_review: 'review_plan',
    approved_locked: 'request_revision_in_chat',
    stale: 'continue_replanning',
  }[value.state]
  if (value.nextAction.kind !== expectedAction) {
    context.addIssue({
      code: 'custom',
      path: ['nextAction', 'kind'],
      message: 'Continuity review action does not match its current lifecycle state.',
    })
  }
  if (value.approvedLocked !== (value.state === 'approved_locked')) {
    context.addIssue({
      code: 'custom',
      path: ['approvedLocked'],
      message: 'Only approved continuity may be presented as locked.',
    })
  }
})

export const storytellingSceneContinuityReviewDtoSchema:
z.ZodType<StorytellingSceneContinuityReviewDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_REVIEW_VERSION),
  state: z.enum(['not_ready', 'ready_for_review', 'needs_review', 'approved_locked', 'stale']),
  statusLabel: safeText(120),
  title: safeText(240),
  summary: safeText(1_000),
  arcRole: z.enum(['opening', 'development', 'resolution', 'opening_and_resolution']).optional(),
  arcRoleLabel: safeText(120).optional(),
  throughLineMode: z.enum(['none_selected', 'recurring_motif']).optional(),
  throughLineLabel: safeText(240).optional(),
  throughLineAppearanceCount: z.number().int().nonnegative().max(128),
  revealBeatCount: z.number().int().nonnegative().max(128),
  transitionCount: z.number().int().nonnegative().max(2),
  rhythmBeatCount: z.number().int().nonnegative().max(256),
  unresolvedUncertaintyCount: z.number().int().nonnegative().max(32),
  nextAction: z.object({
    kind: z.enum(['continue_in_chat', 'review_scene', 'request_revision_in_chat', 'continue_replanning']),
    label: safeText(120),
  }).strict(),
  reviewRequired: z.boolean(),
  planReviewIsSoleApprovalAuthority: z.literal(true),
  approvedLocked: z.boolean(),
  priorApprovedVersionPreserved: z.literal(true),
  approvedSnapshotMutationAllowed: z.literal(false),
  readOnly: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  localCandidateOnly: z.literal(true),
  notice: safeText(1_000),
}).strict().superRefine((value, context) => {
  const detailParts = [value.arcRole, value.arcRoleLabel, value.throughLineMode, value.throughLineLabel]
  const anyDetail = detailParts.some((part) => part !== undefined)
  const detailed = detailParts.every((part) => part !== undefined)
  if (anyDetail && !detailed) {
    context.addIssue({
      code: 'custom',
      path: ['arcRole'],
      message: 'Scene continuity detail must be complete or omitted.',
    })
  }
  if (detailed !== (value.state !== 'not_ready')) {
    context.addIssue({
      code: 'custom',
      path: ['state'],
      message: 'Only a continuity-bound current or preserved stale scene may expose story-flow detail.',
    })
  }
  const countTotal = value.throughLineAppearanceCount + value.revealBeatCount +
    value.transitionCount + value.rhythmBeatCount + value.unresolvedUncertaintyCount
  if (value.state === 'not_ready' && countTotal !== 0) {
    context.addIssue({
      code: 'custom',
      path: ['throughLineAppearanceCount'],
      message: 'An unbound scene cannot expose compiled continuity counts.',
    })
  }
  if (value.throughLineMode === 'none_selected' && value.throughLineAppearanceCount !== 0) {
    context.addIssue({
      code: 'custom',
      path: ['throughLineAppearanceCount'],
      message: 'A scene without a recurring motif cannot report motif appearances.',
    })
  }
  const expectedAction = {
    not_ready: 'continue_in_chat',
    ready_for_review: 'review_scene',
    needs_review: 'review_scene',
    approved_locked: 'request_revision_in_chat',
    stale: 'continue_replanning',
  }[value.state]
  if (value.nextAction.kind !== expectedAction) {
    context.addIssue({
      code: 'custom',
      path: ['nextAction', 'kind'],
      message: 'Scene continuity action does not match its current lifecycle state.',
    })
  }
  if (value.reviewRequired !== ['ready_for_review', 'needs_review'].includes(value.state)) {
    context.addIssue({
      code: 'custom',
      path: ['reviewRequired'],
      message: 'Only current unapproved scene continuity may require scene review.',
    })
  }
  if (value.approvedLocked !== (value.state === 'approved_locked')) {
    context.addIssue({
      code: 'custom',
      path: ['approvedLocked'],
      message: 'Only approved scene continuity may be presented as locked.',
    })
  }
})

const storytellingSceneThroughLineSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('none_selected'),
    reason: safeText(1_000),
  }).strict(),
  z.object({
    mode: z.literal('recurring_motif'),
    motifId: stableId,
    label: safeText(240),
    semanticRole: safeText(1_000),
    origin: z.enum([
      'original_reeditpro_concept',
      'user_authorized_asset',
      'licensed_asset',
      'public_domain_source',
      'source_derived_noncopying',
      'representative_nonliteral',
    ]),
    rightsEvidenceIds: z.array(stableId).max(128).readonly(),
    continuityRules: z.array(safeText(1_000)).min(1).max(32).readonly(),
    appearances: z.array(throughLineAppearance).max(128).readonly(),
  }).strict(),
])

export const storytellingSceneContinuitySliceSchema:
z.ZodType<StorytellingSceneContinuitySlice> = ownership.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_SCENE_CONTINUITY_SLICE_VERSION),
  productionId: stableId,
  sceneId: stableId,
  sourceMotionDnaVersion: versionReference,
  sourcePreparedScriptVersion: versionReference,
  sourceGrammarDigest: digest,
  arc: z.object({
    mode: z.enum([
      'question_resolution',
      'thesis_evidence',
      'chronology_consequence',
      'character_transformation',
    ]),
    role: z.enum(['opening', 'development', 'resolution', 'opening_and_resolution']),
    openingPrompt: safeText(2_000).optional(),
    resolutionSummary: safeText(2_000).optional(),
    resolutionMode: z.enum(['answered', 'qualified', 'intentionally_open']).optional(),
    unresolvedUncertainty: z.array(safeText(1_000)).max(32).readonly(),
  }).strict().superRefine((value, context) => {
    const opening = value.role === 'opening' || value.role === 'opening_and_resolution'
    const resolution = value.role === 'resolution' || value.role === 'opening_and_resolution'
    if (opening !== Boolean(value.openingPrompt)) {
      context.addIssue({ code: 'custom', path: ['openingPrompt'], message: 'Opening copy must appear only on an opening scene.' })
    }
    if (resolution !== Boolean(value.resolutionSummary) ||
        resolution !== Boolean(value.resolutionMode)) {
      context.addIssue({ code: 'custom', path: ['resolutionSummary'], message: 'Resolution authority must appear only on a resolution scene.' })
    }
    if (!resolution && value.unresolvedUncertainty.length > 0) {
      context.addIssue({ code: 'custom', path: ['unresolvedUncertainty'], message: 'Only the resolution scene may carry unresolved uncertainty.' })
    }
  }),
  throughLine: storytellingSceneThroughLineSchema,
  revealBeats: z.array(storytellingRevealBeatSchema).max(128).readonly(),
  incomingTransition: storytellingTransitionContinuitySchema.optional(),
  outgoingTransition: storytellingTransitionContinuitySchema.optional(),
  rhythmBeats: z.array(storytellingRhythmBeatSchema).max(256).readonly(),
  precisionCompositionPolicy: z.object({
    essentialTextAuthority: z.literal('reeditpro_deterministic_layers'),
    mapChartDataAuthority: z.literal('reeditpro_deterministic_layers'),
    finalCompositionAuthority: z.literal('remotion'),
    fixedStoryBlockDurationAllowed: z.literal(false),
    forcedContinuousOnerAllowed: z.literal(false),
    providerIdentityAllowed: z.literal(false),
    publisherImitationAllowed: z.literal(false),
  }).strict(),
  approvedSnapshotProjection: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  sliceDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const sceneMatches = [
    ...value.revealBeats.map((beat) => beat.sceneId),
    ...value.rhythmBeats.map((beat) => beat.sceneId),
    ...(value.throughLine.mode === 'recurring_motif'
      ? value.throughLine.appearances.map((appearance) => appearance.sceneId)
      : []),
  ]
  if (sceneMatches.some((sceneId) => sceneId !== value.sceneId)) {
    context.addIssue({ code: 'custom', path: ['sceneId'], message: 'Scene continuity entries must target the exact scene.' })
  }
  if (value.incomingTransition?.toSceneId !== undefined &&
      value.incomingTransition.toSceneId !== value.sceneId) {
    context.addIssue({ code: 'custom', path: ['incomingTransition'], message: 'Incoming continuity must terminate at the exact scene.' })
  }
  if (value.outgoingTransition?.fromSceneId !== undefined &&
      value.outgoingTransition.fromSceneId !== value.sceneId) {
    context.addIssue({ code: 'custom', path: ['outgoingTransition'], message: 'Outgoing continuity must originate from the exact scene.' })
  }
  assertUnique(value.revealBeats.map((beat) => beat.id), ['revealBeats'], context)
  assertUnique(value.rhythmBeats.map((beat) => beat.id), ['rhythmBeats'], context)
})

function assertUnique(values: readonly string[], path: (string | number)[], context: z.RefinementCtx): void {
  if (new Set(values).size !== values.length) {
    context.addIssue({ code: 'custom', path, message: 'Values must be unique.' })
  }
}
