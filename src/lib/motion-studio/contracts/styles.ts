import { z } from 'zod'

import type {
  ProjectVideoRoutingProfile,
  StorytellingMotionStyleChangeImpact,
  StorytellingMotionStyleDecisionDto,
  StorytellingMotionStylePlanBinding,
  StorytellingMotionStylePlanPreparationDto,
  StorytellingMotionStylePlanReviewInput,
  StorytellingMotionStyleProfile,
  StorytellingMotionStyleProfileReference,
  StorytellingMotionStyleReviewDto,
  StorytellingMotionStyleSelection,
  StorytellingSceneRecipeCompilation,
  StorytellingStyleSourceAudit,
  StyleCalibrationCandidateEvidence,
  StyleCalibrationPlan,
  StyleCalibrationReel,
  StyleCalibrationScenarioKind,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_PROJECT_VIDEO_ROUTING_PROFILE_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_CHANGE_IMPACT_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_DECISION_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_PLAN_BINDING_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_PLAN_PREPARATION_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_PLAN_REVIEW_INPUT_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_REVIEW_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_SELECTION_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_SOURCE_AUDIT_VERSION,
  MOTION_STUDIO_STORYTELLING_SCENE_RECIPE_COMPILATION_VERSION,
  MOTION_STUDIO_STYLE_CALIBRATION_PLAN_VERSION,
  MOTION_STUDIO_STYLE_CALIBRATION_CANDIDATE_EVIDENCE_VERSION,
  MOTION_STUDIO_STYLE_CALIBRATION_REEL_VERSION,
} from '../../../types/motion-studio'
import { MOTION_STUDIO_ARTIFACT_KINDS } from './constants'
import { motionStudioGenerationRoutePolicySchema } from './generation'
import {
  motionStudioOwnershipSchema,
  motionStudioProductionRouteSchema,
  motionStudioSceneRecipeInstantiationSchema,
  motionStudioSceneRecipeSchema,
  motionStudioTimingAuthoritySchema,
  motionStudioVersionReferenceSchema,
} from './schemas'
import { validateMotionStudioDeepValue } from './safe-values'
import { storytellingSceneContinuitySliceSchema } from './story-continuity'

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
const safeMicros = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveMilliseconds = z.number().int().nonnegative().refine(Number.isSafeInteger)
const productionMode = z.enum([
  'generative_first',
  'layered_first',
  'native_graphics_first',
  'footage_first',
  'hybrid_directed',
])
const styleProfileId = z.enum([
  'storytelling_style.editorial_collage',
  'storytelling_style.cinematic_realist_documentary',
  'storytelling_style.paper_diorama_documentary',
  'storytelling_style.technical_blueprint',
])
const recipeFamily = z.enum([
  'editorial_archive_reveal',
  'native_evidence_graphic',
  'layered_paper_depth',
  'cinematic_reconstruction',
  'footage_evidence',
  'hybrid_documentary',
])
const scenarioKind = z.enum([
  'style_led_motion',
  'character_continuity',
  'strict_first_last_frame',
  'reference_heavy',
  'exact_text_data',
])
const artifactKind = z.enum(MOTION_STUDIO_ARTIFACT_KINDS)
const styleArtifactImpactDisposition = z.enum([
  'preserve',
  'review_required',
  'rebuild_required',
])

const motionLanguageReference = z.object({
  motionLanguageId: stableId,
  motionLanguageVersion: safeText(80),
  motionLanguageDigest: digest,
}).strict()

const narrativeFunctionReference = z.object({
  narrativeFunctionId: stableId,
  narrativeFunctionVersion: safeText(80),
  narrativeFunctionDigest: digest,
}).strict()

export const storytellingMotionStyleProfileReferenceSchema:
z.ZodType<StorytellingMotionStyleProfileReference> = z.object({
  styleProfileId,
  styleProfileVersion: safeText(80),
  styleProfileDigest: digest,
}).strict()

export const storytellingMotionStyleDirectionDtoSchema = z.object({
  styleProfile: storytellingMotionStyleProfileReferenceSchema,
  displayName: safeText(120),
  shortDescription: safeText(500),
  bestFor: z.array(safeText(240)).min(1).max(12).readonly(),
  constructionLabel: z.enum(['Directed hybrid', 'Native graphics']),
  relativeCostTendency: z.enum(['lower', 'moderate', 'higher']),
  editability: z.enum(['high', 'medium']),
}).strict()

export const storytellingMotionStyleReviewDtoSchema:
z.ZodType<StorytellingMotionStyleReviewDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_REVIEW_VERSION),
  catalogVersion: safeText(80),
  catalogDigest: digest,
  state: z.literal('comparison_only'),
  directions: z.array(storytellingMotionStyleDirectionDtoSchema).length(4).readonly(),
  decisionAuthority: z.literal('chat_then_plan_review'),
  notice: safeText(1_000),
  readOnly: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
}).strict().superRefine((value, context) => {
  requireUnique(
    value.directions.map((direction) => direction.styleProfile.styleProfileId),
    context,
    ['directions'],
    'Style directions',
  )
})

export const storytellingMotionStyleDecisionDtoSchema:
z.ZodType<StorytellingMotionStyleDecisionDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_DECISION_VERSION),
  state: z.enum([
    'comparison_only',
    'selected_for_plan',
    'awaiting_plan_review',
    'approved_locked',
    'stale_replan_required',
  ]),
  selectedStyleProfileId: styleProfileId.optional(),
  selectedStyleDisplayName: safeText(120).optional(),
  statusLabel: safeText(120),
  title: safeText(240),
  summary: safeText(1_000),
  nextAction: z.object({
    kind: z.enum([
      'discuss_in_chat',
      'continue_in_chat',
      'review_plan',
      'request_revision',
      'continue_replanning',
    ]),
    label: safeText(120),
  }).strict(),
  planReviewRequired: z.boolean(),
  approvedLocked: z.boolean(),
  approvedDecisionPreserved: z.boolean(),
  calibrationState: z.enum(['not_planned', 'planning_only', 'approved_not_executed', 'stale']),
  calibrationScenarioCount: z.number().int().nonnegative().max(5),
  changeImpact: z.object({
    preservedVersionCount: z.number().int().nonnegative().max(512),
    reviewRequiredVersionCount: z.number().int().nonnegative().max(512),
    rebuildRequiredVersionCount: z.number().int().nonnegative().max(512),
    priorApprovalRemainsImmutable: z.literal(true),
  }).strict().optional(),
  decisionAuthority: z.literal('existing_plan_review'),
  readOnly: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
}).strict().superRefine((value, context) => {
  const hasSelection = value.selectedStyleProfileId !== undefined &&
    value.selectedStyleDisplayName !== undefined
  if (value.state === 'comparison_only') {
    if (hasSelection || value.selectedStyleProfileId !== undefined || value.selectedStyleDisplayName !== undefined) {
      context.addIssue({ code: 'custom', path: ['selectedStyleProfileId'], message: 'Comparison-only style state cannot claim a selected direction.' })
    }
  } else if (!hasSelection) {
    context.addIssue({ code: 'custom', path: ['selectedStyleProfileId'], message: 'Style decision state requires one exact selected direction.' })
  }

  const expected = {
    comparison_only: {
      action: 'discuss_in_chat', planReview: false, locked: false, preserved: false,
      calibration: 'not_planned', scenarios: 0, impact: false,
    },
    selected_for_plan: {
      action: 'continue_in_chat', planReview: true, locked: false, preserved: false,
      calibration: 'not_planned', scenarios: 0, impact: false,
    },
    awaiting_plan_review: {
      action: 'review_plan', planReview: true, locked: false, preserved: false,
      calibration: 'planning_only', scenarios: 5, impact: false,
    },
    approved_locked: {
      action: 'request_revision', planReview: false, locked: true, preserved: true,
      calibration: 'approved_not_executed', scenarios: 5, impact: false,
    },
    stale_replan_required: {
      action: 'continue_replanning', planReview: true, locked: false, preserved: true,
      calibration: 'stale', scenarios: 0, impact: true,
    },
  }[value.state]
  if (value.nextAction.kind !== expected.action) {
    context.addIssue({ code: 'custom', path: ['nextAction', 'kind'], message: 'Style decision next action does not match its lifecycle state.' })
  }
  if (value.planReviewRequired !== expected.planReview || value.approvedLocked !== expected.locked ||
      value.approvedDecisionPreserved !== expected.preserved || value.calibrationState !== expected.calibration ||
      value.calibrationScenarioCount !== expected.scenarios || Boolean(value.changeImpact) !== expected.impact) {
    context.addIssue({ code: 'custom', path: ['state'], message: 'Style decision lifecycle flags do not match its state.' })
  }
})

export const storytellingMotionStyleProfileSchema:
z.ZodType<StorytellingMotionStyleProfile> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION),
  id: styleProfileId,
  version: safeText(80),
  contentDigest: digest,
  displayName: safeText(120),
  shortDescription: safeText(500),
  inputAliases: z.array(safeText(120)).min(1).max(24).readonly(),
  motionLanguage: motionLanguageReference,
  defaultProductionMode: productionMode,
  supportedProductionModes: z.array(productionMode).min(1).max(5).readonly(),
  recipeFamilies: z.array(recipeFamily).min(1).max(6).readonly(),
  bestFor: z.array(safeText(240)).min(1).max(12).readonly(),
  relativeCostTendency: z.enum(['lower', 'moderate', 'higher']),
  editability: z.enum(['high', 'medium']),
  sourceAndBrandPolicy: z.object({
    publisherImitationAllowed: z.literal(false),
    unlicensedReferenceBundlingAllowed: z.literal(false),
    providerPresetOrJobIdentityAdoptionAllowed: z.literal(false),
    doNotCopyReferenceRequiredForNamedPublisherRequests: z.literal(true),
  }).strict(),
  deterministicCompositionPolicy: z.object({
    exactTextGeneratedInMediaAllowed: z.literal(false),
    captionsGeneratedInMediaAllowed: z.literal(false),
    exactMapsChartsAndDataGeneratedInMediaAllowed: z.literal(false),
    finalCanvasOwnedByReeditpro: z.literal(true),
    editableTimelineRequired: z.literal(true),
  }).strict(),
  providerNeutral: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!value.supportedProductionModes.includes(value.defaultProductionMode)) {
    context.addIssue({
      code: 'custom',
      path: ['defaultProductionMode'],
      message: 'Default production mode must be explicitly supported.',
    })
  }
  requireUnique(value.inputAliases.map(normalizeAlias), context, ['inputAliases'], 'Style aliases')
  requireUnique(value.supportedProductionModes, context, ['supportedProductionModes'], 'Supported production modes')
  requireUnique(value.recipeFamilies, context, ['recipeFamilies'], 'Recipe families')
})

export const storytellingStyleSourceAuditSchema:
z.ZodType<StorytellingStyleSourceAudit> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_SOURCE_AUDIT_VERSION),
  sourceId: stableId,
  sourceKind: z.enum(['uploaded_skill_archive', 'reference_video', 'reference_image', 'reference_document']),
  sourceContentDigest: digest,
  sourceLabel: safeText(240),
  trustStatus: z.literal('untrusted_reference'),
  licenseEvidenceStatus: z.enum(['missing', 'present_unverified', 'reviewed']),
  commercialReuseAuthorizationStatus: z.enum(['unknown', 'restricted', 'authorized']),
  extractedTechniqueFamilies: z.array(safeText(240)).min(1).max(32).readonly(),
  rejectedDirectiveFamilies: z.array(safeText(240)).min(1).max(32).readonly(),
  executableInstructionsAllowed: z.literal(false),
  exactPromptBundlingAllowed: z.literal(false),
  providerPresetOrJobIdentityAdopted: z.literal(false),
  originalAssetBundlingAllowed: z.literal(false),
  disposition: z.literal('reference_only_generalized_grammar'),
  auditDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  requireUnique(value.extractedTechniqueFamilies, context, ['extractedTechniqueFamilies'], 'Technique families')
  requireUnique(value.rejectedDirectiveFamilies, context, ['rejectedDirectiveFamilies'], 'Rejected directives')
})

export const storytellingMotionStyleSelectionSchema:
z.ZodType<StorytellingMotionStyleSelection> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_SELECTION_VERSION),
  id: stableId,
  productionId: stableId,
  styleProfile: storytellingMotionStyleProfileReferenceSchema,
  motionLanguage: motionLanguageReference,
  motionDnaVersion: motionStudioVersionReferenceSchema,
  referenceContractVersions: z.array(motionStudioVersionReferenceSchema).max(32).readonly(),
  sourceAuditDigests: z.array(digest).max(32).readonly(),
  selectionOrigin: z.enum(['director_recommendation', 'user_selected', 'user_customized']),
  matchedInputAliases: z.array(safeText(120)).max(24).readonly(),
  customizationNotes: z.array(safeText(500)).max(32).readonly(),
  state: z.enum(['draft', 'in_review', 'selected_for_plan', 'approved_snapshot_bound', 'stale']),
  approvedPlanSnapshotId: stableId.optional(),
  approvedPlanSnapshotDigest: digest.optional(),
  selectionDigest: digest,
  runtimeExecutionAuthorized: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  requireUnique(value.referenceContractVersions.map((reference) => reference.versionId), context,
    ['referenceContractVersions'], 'Reference contract versions')
  requireUnique(value.sourceAuditDigests, context, ['sourceAuditDigests'], 'Source audits')
  requireUnique(value.matchedInputAliases.map(normalizeAlias), context, ['matchedInputAliases'], 'Matched aliases')
  const hasApprovedSnapshot = Boolean(value.approvedPlanSnapshotId && value.approvedPlanSnapshotDigest)
  if (value.state === 'approved_snapshot_bound' && !hasApprovedSnapshot) {
    context.addIssue({
      code: 'custom',
      path: ['approvedPlanSnapshotId'],
      message: 'Approved-snapshot-bound selections require exact snapshot identity and digest.',
    })
  }
  if (value.state !== 'approved_snapshot_bound' && value.state !== 'stale' &&
      (value.approvedPlanSnapshotId || value.approvedPlanSnapshotDigest)) {
    context.addIssue({
      code: 'custom',
      path: ['approvedPlanSnapshotId'],
      message: 'Pre-approval style selections cannot claim approved snapshot authority.',
    })
  }
})

export const styleCalibrationScenarioSchema = z.object({
  id: stableId,
  kind: scenarioKind,
  narrativeFunction: narrativeFunctionReference,
  motionLanguage: motionLanguageReference,
  productionMode,
  recipeFamily,
  requiresGeneratedMedia: z.boolean(),
  deterministicTextDataRequired: z.boolean(),
  referenceContractVersions: z.array(motionStudioVersionReferenceSchema).max(32).readonly(),
  acceptanceCriteria: z.array(safeText(500)).min(1).max(24).readonly(),
}).strict()

export const styleCalibrationApprovalAuthoritySchema = z.object({
  state: z.enum(['planning_only', 'approved_bounded_execution']),
  approvedPlanSnapshotId: stableId.optional(),
  approvedPlanSnapshotDigest: digest.optional(),
  approvedEstimateId: stableId.optional(),
  approvedEstimateDigest: digest.optional(),
  maximumAuthorizedInternalCostMicros: safeMicros.optional(),
  customerPriceIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
}).strict()

export const styleCalibrationPlanSchema:
z.ZodType<StyleCalibrationPlan> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STYLE_CALIBRATION_PLAN_VERSION),
  id: stableId,
  productionId: stableId,
  styleSelectionDigest: digest,
  styleProfile: storytellingMotionStyleProfileReferenceSchema,
  motionLanguage: motionLanguageReference,
  motionDnaVersion: motionStudioVersionReferenceSchema,
  routePolicy: motionStudioGenerationRoutePolicySchema,
  scenarios: z.array(styleCalibrationScenarioSchema).length(5).readonly(),
  estimatedInternalCostRangeMicros: z.object({
    minimum: safeMicros,
    maximum: safeMicros,
  }).strict(),
  approvalAuthority: styleCalibrationApprovalAuthoritySchema,
  automaticFallbackAllowed: z.literal(false),
  fallbackRequiresNewApproval: z.literal(true),
  bulkGenerationAllowed: z.literal(false),
  planDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.routePolicy.mediaKind !== 'video_clip') {
    context.addIssue({ code: 'custom', path: ['routePolicy', 'mediaKind'], message: 'Style Calibration Reel requires a video route policy.' })
  }
  if (value.estimatedInternalCostRangeMicros.minimum > value.estimatedInternalCostRangeMicros.maximum) {
    context.addIssue({ code: 'custom', path: ['estimatedInternalCostRangeMicros'], message: 'Calibration cost range is inverted.' })
  }
  requireExactScenarioSet(value.scenarios.map((scenario) => scenario.kind), context)
  requireUnique(value.scenarios.map((scenario) => scenario.id), context, ['scenarios'], 'Calibration scenario IDs')
  value.scenarios.forEach((scenario, index) => {
    if (scenario.motionLanguage.motionLanguageId !== value.motionLanguage.motionLanguageId ||
        scenario.motionLanguage.motionLanguageVersion !== value.motionLanguage.motionLanguageVersion ||
        scenario.motionLanguage.motionLanguageDigest !== value.motionLanguage.motionLanguageDigest) {
      context.addIssue({ code: 'custom', path: ['scenarios', index, 'motionLanguage'], message: 'Every calibration scenario must use the selected exact Motion Language.' })
    }
  })
  const authority = value.approvalAuthority
  const approvalFields = [
    authority.approvedPlanSnapshotId,
    authority.approvedPlanSnapshotDigest,
    authority.approvedEstimateId,
    authority.approvedEstimateDigest,
    authority.maximumAuthorizedInternalCostMicros,
  ]
  if (authority.state === 'planning_only' && approvalFields.some((field) => field !== undefined)) {
    context.addIssue({ code: 'custom', path: ['approvalAuthority'], message: 'Planning-only calibration cannot claim execution approval or a cost ceiling.' })
  }
  if (authority.state === 'approved_bounded_execution') {
    if (approvalFields.some((field) => field === undefined)) {
      context.addIssue({ code: 'custom', path: ['approvalAuthority'], message: 'Bounded calibration requires exact plan, estimate, and internal-cost authority.' })
    }
    if ((authority.maximumAuthorizedInternalCostMicros ?? Number.MAX_SAFE_INTEGER) >
        value.estimatedInternalCostRangeMicros.maximum) {
      context.addIssue({ code: 'custom', path: ['approvalAuthority', 'maximumAuthorizedInternalCostMicros'], message: 'Authorized calibration cost exceeds the approved plan range.' })
    }
  }
})

const styleCalibrationPrivateOutputEvidenceSchema = z.object({
  assetId: stableId,
  assetVersionId: stableId,
  mimeType: z.literal('video/mp4'),
  contentDigest: digest,
  byteLength: z.number().int().positive().max(512 * 1024 * 1024),
  timingAuthority: motionStudioTimingAuthoritySchema,
  privateObjectIdentityHash: digest,
  storageEvidenceDigest: digest,
  checksumReadbackEvidenceDigest: digest,
  createOnly: z.literal(true),
  privateProjectAsset: z.literal(true),
}).strict()

export const styleCalibrationCandidateEvidenceSchema:
z.ZodType<StyleCalibrationCandidateEvidence> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STYLE_CALIBRATION_CANDIDATE_EVIDENCE_VERSION),
  id: stableId,
  productionId: stableId,
  calibrationPlanDigest: digest,
  scenarioId: stableId,
  scenarioKind,
  routeCandidateId: stableId,
  productionMode,
  sourceEvidence: z.object({
    kind: z.enum([
      'canonical_tool_attempt',
      'canonical_provider_attempt',
      'non_promotable_private_injected',
      'contract_only',
    ]),
    readiness: z.enum([
      'canonical_private_routing_eligible',
      'unreleased_runtime_blocked',
      'non_promotable_injected',
      'contract_only',
    ]),
    sourceAttemptId: stableId,
    sourceEvidenceDigest: digest,
    sourceVerifierId: stableId,
    sourceVerified: z.boolean(),
  }).strict(),
  attemptOutcome: z.enum(['succeeded', 'failed', 'unknown']),
  output: styleCalibrationPrivateOutputEvidenceSchema.optional(),
  technicalQa: z.object({
    status: z.enum(['not_run', 'passed', 'failed']),
    evidenceDigest: digest.optional(),
    blockingIssueCodes: z.array(stableId).max(64).readonly(),
  }).strict(),
  creativeReview: z.object({
    decision: z.enum(['pending', 'accepted', 'rejected']),
    reviewedBy: stableId.optional(),
    reviewedAt: z.string().datetime({ offset: true }).optional(),
    selectionReason: safeText(1_000).optional(),
  }).strict(),
  knownFailureModes: z.array(safeText(500)).min(1).max(32).readonly(),
  measuredLatencyMilliseconds: positiveMilliseconds,
  cost: z.object({
    providerCostMicros: safeMicros.nullable(),
    infrastructureCostMicros: safeMicros,
    totalInternalProductionCostMicros: safeMicros.nullable(),
    costEvidenceDigest: digest,
    reconciled: z.boolean(),
    failedOrUnknownAttemptCostRetained: z.literal(true),
    internalProductionCostOnly: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  costPerAcceptedSecondMicros: safeMicros.nullable(),
  routingEligible: z.boolean(),
  candidateDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  requireUnique(value.technicalQa.blockingIssueCodes, context, ['technicalQa', 'blockingIssueCodes'], 'Calibration QA issue codes')
  requireUnique(value.knownFailureModes, context, ['knownFailureModes'], 'Calibration known failure modes')
  const hasOutput = value.output !== undefined
  const qaRan = value.technicalQa.status !== 'not_run'
  const reviewed = value.creativeReview.decision !== 'pending'
  const hasReviewEvidence = value.creativeReview.reviewedBy !== undefined &&
    value.creativeReview.reviewedAt !== undefined && value.creativeReview.selectionReason !== undefined
  const total = value.cost.providerCostMicros === null
    ? null
    : value.cost.providerCostMicros + value.cost.infrastructureCostMicros
  const frameRateRatio = value.output
    ? timingAuthorityFrameRateRatio(value.output.timingAuthority)
    : null
  const expectedCostPerAcceptedSecond = value.creativeReview.decision === 'accepted' &&
    value.output && total !== null && frameRateRatio
      ? Math.ceil(total * frameRateRatio.numerator /
        (value.output.timingAuthority.durationFrames * frameRateRatio.denominator))
      : null
  const expectedRoutingEligible = value.attemptOutcome === 'succeeded' && hasOutput &&
    value.technicalQa.status === 'passed' && value.creativeReview.decision === 'accepted' &&
    value.sourceEvidence.readiness === 'canonical_private_routing_eligible' &&
    value.sourceEvidence.sourceVerified && value.cost.reconciled && total !== null
  if ((value.attemptOutcome === 'succeeded') !== hasOutput || qaRan !== hasOutput ||
      (qaRan && !value.technicalQa.evidenceDigest) || (!qaRan && value.technicalQa.evidenceDigest) ||
      reviewed !== hasReviewEvidence ||
      (value.creativeReview.decision === 'accepted' && value.technicalQa.status !== 'passed') ||
      value.cost.totalInternalProductionCostMicros !== total ||
      value.cost.reconciled !== (total !== null) ||
      value.costPerAcceptedSecondMicros !== expectedCostPerAcceptedSecond ||
      value.routingEligible !== expectedRoutingEligible) {
    context.addIssue({ code: 'custom', message: 'Calibration candidate outcome, output, QA, review, cost, and routing eligibility do not reconcile.' })
  }
  if (value.output && !frameRateRatio) {
    context.addIssue({ code: 'custom', path: ['output', 'timingAuthority'], message: 'Calibration output requires a positive exact timebase consistent with its frame rate.' })
  }
  if ((value.technicalQa.status === 'failed') !== (value.technicalQa.blockingIssueCodes.length > 0)) {
    context.addIssue({ code: 'custom', path: ['technicalQa', 'blockingIssueCodes'], message: 'Failed calibration QA requires blocking issues; passed or unrun QA cannot carry them.' })
  }
  if (value.sourceEvidence.readiness === 'canonical_private_routing_eligible' &&
      (!value.sourceEvidence.sourceVerified ||
       !['canonical_tool_attempt', 'canonical_provider_attempt'].includes(value.sourceEvidence.kind))) {
    context.addIssue({ code: 'custom', path: ['sourceEvidence'], message: 'Routing-eligible evidence requires one source-verified canonical attempt.' })
  }
  const readinessKindMismatch =
    (value.sourceEvidence.kind === 'non_promotable_private_injected' &&
      value.sourceEvidence.readiness !== 'non_promotable_injected') ||
    (value.sourceEvidence.kind === 'contract_only' &&
      value.sourceEvidence.readiness !== 'contract_only') ||
    (['canonical_tool_attempt', 'canonical_provider_attempt'].includes(value.sourceEvidence.kind) &&
      ['non_promotable_injected', 'contract_only'].includes(value.sourceEvidence.readiness))
  if (readinessKindMismatch) {
    context.addIssue({ code: 'custom', path: ['sourceEvidence'], message: 'Calibration source evidence kind and readiness classification do not match.' })
  }
})

export const styleCalibrationReelSchema:
z.ZodType<StyleCalibrationReel> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STYLE_CALIBRATION_REEL_VERSION),
  id: stableId,
  productionId: stableId,
  calibrationPlanDigest: digest,
  approvedPlanSnapshotId: stableId,
  approvedPlanSnapshotDigest: digest,
  candidates: z.array(styleCalibrationCandidateEvidenceSchema).max(64).readonly(),
  decisions: z.array(z.lazy(() => styleCalibrationRouteDecisionSchema)).max(5).readonly(),
  state: z.enum(['collecting', 'awaiting_review', 'approved', 'blocked', 'stale']),
  totalActualInternalProductionCostMicros: safeMicros,
  maximumAuthorizedInternalCostMicros: safeMicros,
  costWithinAuthority: z.boolean(),
  unreconciledCostCandidateCount: z.number().int().nonnegative().max(64),
  rejectedCandidateCount: z.number().int().nonnegative().max(64),
  failedCandidateCount: z.number().int().nonnegative().max(64),
  unknownCandidateCount: z.number().int().nonnegative().max(64),
  allRequiredScenariosAccepted: z.boolean(),
  humanReviewComplete: z.boolean(),
  productionScaleRoutingApproved: z.boolean(),
  acceptedAndRejectedOutputsRetained: z.literal(true),
  automaticSelectionAllowed: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  reelDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  requireUnique(value.candidates.map((candidate) => candidate.id), context, ['candidates'], 'Calibration candidate IDs')
  requireUnique(value.candidates.map((candidate) => candidate.candidateDigest), context, ['candidates'], 'Calibration candidate digests')
  requireUnique(value.decisions.map((decision) => decision.scenarioKind), context, ['decisions'], 'Calibration scenario decisions')
  const candidates = new Map(value.candidates.map((candidate) => [candidate.id, candidate]))
  for (const [index, decision] of value.decisions.entries()) {
    const candidate = candidates.get(decision.calibrationCandidateId)
    if (!candidate || candidate.candidateDigest !== decision.candidateEvidenceDigest ||
        candidate.scenarioKind !== decision.scenarioKind || !candidate.output ||
        candidate.routeCandidateId !== decision.routeCandidateId ||
        candidate.productionMode !== decision.productionMode ||
        candidate.technicalQa.evidenceDigest !== decision.outputPerformanceDigest ||
        candidate.technicalQa.status !== decision.technicalQaStatus ||
        candidate.creativeReview.decision !== decision.creativeDecision ||
        candidate.creativeReview.selectionReason !== decision.selectionReason ||
        JSON.stringify(candidate.knownFailureModes) !== JSON.stringify(decision.knownFailureModes) ||
        candidate.output.timingAuthority.durationFrames !== decision.acceptedDurationFrames ||
        timingAuthorityFrameRateRatio(candidate.output.timingAuthority)?.numerator !== decision.fpsNumerator ||
        timingAuthorityFrameRateRatio(candidate.output.timingAuthority)?.denominator !== decision.fpsDenominator ||
        candidate.measuredLatencyMilliseconds !== decision.measuredLatencyMilliseconds ||
        candidate.cost.totalInternalProductionCostMicros !== decision.internalProductionCostMicros ||
        candidate.costPerAcceptedSecondMicros !== decision.costPerAcceptedSecondMicros ||
        !candidate.routingEligible) {
      context.addIssue({ code: 'custom', path: ['decisions', index], message: 'Routing decision must derive from one exact routing-eligible calibration candidate.' })
    }
  }
  const total = value.candidates.reduce((sum, candidate) =>
    sum + (candidate.cost.totalInternalProductionCostMicros ?? 0), 0)
  const unreconciled = value.candidates.filter((candidate) => !candidate.cost.reconciled).length
  const rejected = value.candidates.filter((candidate) => candidate.creativeReview.decision === 'rejected').length
  const failed = value.candidates.filter((candidate) => candidate.attemptOutcome === 'failed').length
  const unknown = value.candidates.filter((candidate) => candidate.attemptOutcome === 'unknown').length
  const allAccepted = ALL_STYLE_CALIBRATION_SCENARIOS.every((kind) =>
    value.decisions.some((decision) => decision.scenarioKind === kind))
  const humanReviewComplete = value.candidates.some((candidate) => candidate.attemptOutcome === 'succeeded') &&
    value.candidates.filter((candidate) => candidate.attemptOutcome === 'succeeded')
      .every((candidate) => candidate.creativeReview.decision !== 'pending')
  const within = unreconciled === 0 && total <= value.maximumAuthorizedInternalCostMicros
  const approved = value.state === 'approved' && allAccepted && humanReviewComplete && within && unknown === 0
  if (value.totalActualInternalProductionCostMicros !== total ||
      value.unreconciledCostCandidateCount !== unreconciled ||
      value.rejectedCandidateCount !== rejected || value.failedCandidateCount !== failed ||
      value.unknownCandidateCount !== unknown || value.costWithinAuthority !== within ||
      value.allRequiredScenariosAccepted !== allAccepted || value.humanReviewComplete !== humanReviewComplete ||
      value.productionScaleRoutingApproved !== approved ||
      (value.state === 'approved' && !approved)) {
    context.addIssue({ code: 'custom', message: 'Calibration Reel aggregate state, cost, review, and routing approval do not reconcile.' })
  }
})

export const storytellingMotionStylePlanReviewInputSchema:
z.ZodType<StorytellingMotionStylePlanReviewInput> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_PLAN_REVIEW_INPUT_VERSION),
  productionId: stableId,
  styleSelection: storytellingMotionStyleSelectionSchema,
  calibrationPlan: styleCalibrationPlanSchema,
  internalCostEstimateId: stableId,
  internalCostEstimateDigest: digest,
  internalCostEnvelopeIncludedInPlanReview: z.literal(true),
  customerPricingCalculatedHere: z.literal(false),
  customerCreditsMutated: z.literal(false),
  decisionAuthority: z.literal('existing_plan_review'),
  runtimeExecutionAuthorized: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.styleSelection.state !== 'selected_for_plan') {
    context.addIssue({ code: 'custom', path: ['styleSelection', 'state'], message: 'Plan Review requires a style selected for the plan.' })
  }
  if (value.calibrationPlan.approvalAuthority.state !== 'planning_only') {
    context.addIssue({ code: 'custom', path: ['calibrationPlan', 'approvalAuthority'], message: 'Pre-approval calibration must remain planning-only.' })
  }
  if (value.styleSelection.workspaceId !== value.workspaceId ||
      value.styleSelection.projectId !== value.projectId ||
      value.styleSelection.editSessionId !== value.editSessionId ||
      value.styleSelection.productionId !== value.productionId) {
    context.addIssue({ code: 'custom', path: ['styleSelection'], message: 'Style selection must preserve the exact Plan Review production identity.' })
  }
  if (value.calibrationPlan.workspaceId !== value.workspaceId ||
      value.calibrationPlan.projectId !== value.projectId ||
      value.calibrationPlan.editSessionId !== value.editSessionId ||
      value.calibrationPlan.productionId !== value.productionId) {
    context.addIssue({ code: 'custom', path: ['calibrationPlan'], message: 'Calibration plan must preserve the exact Plan Review production identity.' })
  }
  if (value.calibrationPlan.styleSelectionDigest !== value.styleSelection.selectionDigest) {
    context.addIssue({ code: 'custom', path: ['calibrationPlan', 'styleSelectionDigest'], message: 'Calibration plan must bind the exact Plan Review style selection.' })
  }
})

export const storytellingMotionStylePlanPreparationDtoSchema:
z.ZodType<StorytellingMotionStylePlanPreparationDto> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_PLAN_PREPARATION_VERSION),
  productionId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  state: z.enum(['needs_selection', 'ready_for_plan_review']),
  decision: storytellingMotionStyleDecisionDtoSchema,
  planReviewInput: storytellingMotionStylePlanReviewInputSchema.optional(),
  blockerMessage: safeText(500).optional(),
  planReviewIsSoleApprovalAuthority: z.literal(true),
  customerPriceCalculatedHere: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  localCandidateOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  const ready = value.state === 'ready_for_plan_review'
  if (ready !== Boolean(value.planReviewInput)) {
    context.addIssue({ code: 'custom', path: ['planReviewInput'], message: 'Ready style preparation requires one exact Plan Review input.' })
  }
  if (ready && value.decision.state !== 'awaiting_plan_review') {
    context.addIssue({ code: 'custom', path: ['decision', 'state'], message: 'Ready style preparation must project the existing Plan Review state.' })
  }
  if (!ready && (value.decision.state !== 'comparison_only' || !value.blockerMessage)) {
    context.addIssue({ code: 'custom', path: ['state'], message: 'Unselected style preparation must remain comparison-only with a clear blocker.' })
  }
  const plan = value.planReviewInput
  if (plan && (plan.projectId !== value.projectId || plan.editSessionId !== value.editSessionId ||
      plan.productionId !== value.productionId)) {
    context.addIssue({ code: 'custom', path: ['planReviewInput'], message: 'Style preparation changed the exact project, edit, or production identity.' })
  }
})

export const storytellingMotionStylePlanBindingSchema:
z.ZodType<StorytellingMotionStylePlanBinding> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_PLAN_BINDING_VERSION),
  id: stableId,
  productionId: stableId,
  approvedPlanSnapshotId: stableId,
  approvedPlanSnapshotDigest: digest,
  approvedEditPlanVersionId: stableId,
  approvedCreditEstimateId: stableId,
  approvedCreditEstimateDigest: digest,
  approvedInternalCostEstimateId: stableId,
  approvedInternalCostEstimateDigest: digest,
  preApprovalSelectionDigest: digest,
  approvedStyleSelection: storytellingMotionStyleSelectionSchema,
  approvedCalibrationPlan: styleCalibrationPlanSchema,
  decisionAuthority: z.literal('existing_plan_review'),
  approvalState: z.literal('approved_locked'),
  previousApprovedSnapshotRemainsImmutable: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  customerPriceCalculatedHere: z.literal(false),
  customerCreditsMutated: z.literal(false),
  bindingDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const selection = value.approvedStyleSelection
  const calibration = value.approvedCalibrationPlan
  if (selection.state !== 'approved_snapshot_bound' ||
      selection.approvedPlanSnapshotId !== value.approvedPlanSnapshotId ||
      selection.approvedPlanSnapshotDigest !== value.approvedPlanSnapshotDigest) {
    context.addIssue({ code: 'custom', path: ['approvedStyleSelection'], message: 'Approved style selection must bind the exact frozen Plan Review snapshot.' })
  }
  if (calibration.approvalAuthority.state !== 'approved_bounded_execution' ||
      calibration.approvalAuthority.approvedPlanSnapshotId !== value.approvedPlanSnapshotId ||
      calibration.approvalAuthority.approvedPlanSnapshotDigest !== value.approvedPlanSnapshotDigest ||
      calibration.approvalAuthority.approvedEstimateId !== value.approvedInternalCostEstimateId ||
      calibration.approvalAuthority.approvedEstimateDigest !== value.approvedInternalCostEstimateDigest) {
    context.addIssue({ code: 'custom', path: ['approvedCalibrationPlan'], message: 'Approved calibration must bind the exact plan and estimate authority.' })
  }
  for (const candidate of [selection, calibration]) {
    if (candidate.workspaceId !== value.workspaceId || candidate.projectId !== value.projectId ||
        candidate.editSessionId !== value.editSessionId || candidate.productionId !== value.productionId) {
      context.addIssue({ code: 'custom', path: ['productionId'], message: 'Plan binding changed the exact Motion Studio production identity.' })
      break
    }
  }
  if (calibration.styleSelectionDigest !== selection.selectionDigest) {
    context.addIssue({ code: 'custom', path: ['approvedCalibrationPlan', 'styleSelectionDigest'], message: 'Approved calibration must bind the approved style selection digest.' })
  }
})

const storytellingStyleArtifactImpactPolicyEntrySchema = z.object({
  artifactKind,
  disposition: styleArtifactImpactDisposition,
  reason: safeText(500),
}).strict()

const storytellingStyleVersionImpactSchema = z.object({
  artifactKind,
  artifactVersion: motionStudioVersionReferenceSchema,
  disposition: styleArtifactImpactDisposition,
  reason: safeText(500),
}).strict()

export const storytellingMotionStyleChangeImpactSchema:
z.ZodType<StorytellingMotionStyleChangeImpact> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_STYLE_CHANGE_IMPACT_VERSION),
  id: stableId,
  productionId: stableId,
  priorPlanBindingDigest: digest,
  priorApprovedPlanSnapshotId: stableId,
  priorApprovedPlanSnapshotDigest: digest,
  staleStyleSelection: storytellingMotionStyleSelectionSchema,
  proposedStyleSelection: storytellingMotionStyleSelectionSchema,
  artifactPolicy: z.array(storytellingStyleArtifactImpactPolicyEntrySchema)
    .length(MOTION_STUDIO_ARTIFACT_KINDS.length).readonly(),
  currentVersionImpacts: z.array(storytellingStyleVersionImpactSchema).max(512).readonly(),
  preservedArtifactVersions: z.array(motionStudioVersionReferenceSchema).max(512).readonly(),
  reviewRequiredArtifactVersions: z.array(motionStudioVersionReferenceSchema).max(512).readonly(),
  rebuildRequiredArtifactVersions: z.array(motionStudioVersionReferenceSchema).max(512).readonly(),
  approvalResetRequired: z.literal(true),
  newPlanReviewRequired: z.literal(true),
  newCreditEstimateRequired: z.literal(true),
  providerWorkAuthorized: z.literal(false),
  renderAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  impactDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  requireUnique(value.artifactPolicy.map((entry) => entry.artifactKind), context, ['artifactPolicy'], 'Style artifact policy kinds')
  requireUnique(value.currentVersionImpacts.map((entry) => entry.artifactVersion.versionId), context, ['currentVersionImpacts'], 'Current artifact version impacts')
  const expected = new Map(value.currentVersionImpacts.map((entry) => [entry.artifactVersion.versionId, entry.disposition]))
  const lists: ReadonlyArray<readonly [readonly { versionId: string }[], StorytellingMotionStyleChangeImpact['currentVersionImpacts'][number]['disposition']]> = [
    [value.preservedArtifactVersions, 'preserve'],
    [value.reviewRequiredArtifactVersions, 'review_required'],
    [value.rebuildRequiredArtifactVersions, 'rebuild_required'],
  ]
  const listed = new Set<string>()
  for (const [versions, disposition] of lists) {
    for (const version of versions) {
      if (listed.has(version.versionId) || expected.get(version.versionId) !== disposition) {
        context.addIssue({ code: 'custom', path: ['currentVersionImpacts'], message: 'Style change version partitions must be exact, unique, and disposition-matched.' })
        return
      }
      listed.add(version.versionId)
    }
  }
  if (listed.size !== expected.size) {
    context.addIssue({ code: 'custom', path: ['currentVersionImpacts'], message: 'Every current artifact impact must appear in exactly one version partition.' })
  }
  if (value.staleStyleSelection.state !== 'stale' || value.proposedStyleSelection.state !== 'selected_for_plan') {
    context.addIssue({ code: 'custom', path: ['proposedStyleSelection'], message: 'Style change must stale the prior selection and return the proposal to Plan Review.' })
  }
})

export const styleCalibrationRouteDecisionSchema = z.object({
  scenarioKind,
  calibrationCandidateId: stableId,
  candidateEvidenceDigest: digest,
  routeCandidateId: stableId,
  productionMode,
  outputPerformanceDigest: digest,
  technicalQaStatus: z.enum(['passed', 'failed']),
  creativeDecision: z.enum(['pending', 'accepted', 'rejected']),
  selectionReason: safeText(1_000),
  knownFailureModes: z.array(safeText(500)).min(1).max(32).readonly(),
  acceptedDurationFrames: z.number().int().positive().max(60 * 60 * 240),
  fpsNumerator: z.number().int().positive().max(240_000),
  fpsDenominator: z.number().int().positive().max(10_000),
  measuredLatencyMilliseconds: positiveMilliseconds,
  internalProductionCostMicros: safeMicros,
  costPerAcceptedSecondMicros: safeMicros,
}).strict()

export const projectVideoRoutingProfileSchema:
z.ZodType<ProjectVideoRoutingProfile> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_PROJECT_VIDEO_ROUTING_PROFILE_VERSION),
  id: stableId,
  productionId: stableId,
  calibrationPlanDigest: digest,
  calibrationReelDigest: digest,
  approvedPlanSnapshotId: stableId.optional(),
  approvedPlanSnapshotDigest: digest.optional(),
  styleProfile: storytellingMotionStyleProfileReferenceSchema,
  motionDnaVersion: motionStudioVersionReferenceSchema,
  routePolicyId: z.enum(['motion_studio_generation_route_policy_v1', 'motion_studio_generation_route_policy_v2']),
  routePolicyDigest: digest,
  decisions: z.array(styleCalibrationRouteDecisionSchema).max(32).readonly(),
  state: z.enum(['draft', 'in_review', 'approved', 'stale']),
  allRequiredScenariosAccepted: z.boolean(),
  bulkGenerationAllowed: z.boolean(),
  automaticFallbackAllowed: z.literal(false),
  fallbackRequiresNewApproval: z.literal(true),
  normalUserUiExposesProviderInternals: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  profileDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const hasApprovedSnapshotId = Boolean(value.approvedPlanSnapshotId)
  const hasApprovedSnapshotDigest = Boolean(value.approvedPlanSnapshotDigest)
  if (hasApprovedSnapshotId !== hasApprovedSnapshotDigest) {
    context.addIssue({ code: 'custom', path: ['approvedPlanSnapshotId'], message: 'Project routing snapshot identity and digest must appear together.' })
  }
  requireUnique(value.decisions.map((decision) => decision.scenarioKind), context, ['decisions'], 'Calibration scenario decisions')
  const acceptedKinds = new Set(value.decisions
    .filter((decision) => decision.technicalQaStatus === 'passed' && decision.creativeDecision === 'accepted')
    .map((decision) => decision.scenarioKind))
  const allAccepted = ALL_STYLE_CALIBRATION_SCENARIOS.every((kind) => acceptedKinds.has(kind))
  if (value.allRequiredScenariosAccepted !== allAccepted) {
    context.addIssue({ code: 'custom', path: ['allRequiredScenariosAccepted'], message: 'Required-scenario acceptance does not match exact candidate decisions.' })
  }
  if (value.state === 'approved') {
    if (!allAccepted || !value.bulkGenerationAllowed || !hasApprovedSnapshotId || !hasApprovedSnapshotDigest) {
      context.addIssue({ code: 'custom', path: ['state'], message: 'Approved routing requires all five accepted scenarios and explicit bulk-generation eligibility.' })
    }
  } else if (value.bulkGenerationAllowed) {
    context.addIssue({ code: 'custom', path: ['bulkGenerationAllowed'], message: 'Only an approved routing profile may allow bulk generation.' })
  }
})

export const storytellingSceneRecipeCompilationSchema:
z.ZodType<StorytellingSceneRecipeCompilation> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_SCENE_RECIPE_COMPILATION_VERSION),
  productionId: stableId,
  approvedPlanSnapshotId: stableId,
  approvedPlanSnapshotDigest: digest,
  styleSelectionDigest: digest,
  styleProfile: storytellingMotionStyleProfileReferenceSchema,
  recipeFamily,
  recipe: motionStudioSceneRecipeSchema,
  instantiation: motionStudioSceneRecipeInstantiationSchema,
  storyContinuity: storytellingSceneContinuitySliceSchema,
  productionRoute: motionStudioProductionRouteSchema,
  requiresGeneratedMedia: z.boolean(),
  projectVideoRoutingProfileDigest: digest.optional(),
  runtimeExecutionAuthorized: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  compilationDigest: digest,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const expectedRecipeId = `scene-recipe-storytelling-${value.recipeFamily}`
  if (value.recipe.id !== expectedRecipeId) {
    context.addIssue({ code: 'custom', path: ['recipe', 'id'], message: 'Scene Recipe identity does not match its declared family.' })
  }
  if (value.instantiation.recipeVersion.artifactId !== value.recipe.id ||
      value.instantiation.recipeDefinitionVersion !== value.recipe.definitionVersion ||
      value.instantiation.recipeDefinitionDigest !== value.recipe.definitionDigest) {
    context.addIssue({ code: 'custom', path: ['instantiation'], message: 'Scene Recipe instantiation changed the exact recipe authority.' })
  }
  if (value.instantiation.workspaceId !== value.workspaceId ||
      value.instantiation.projectId !== value.projectId ||
      value.instantiation.editSessionId !== value.editSessionId ||
      value.instantiation.productionId !== value.productionId) {
    context.addIssue({ code: 'custom', path: ['instantiation'], message: 'Scene Recipe instantiation changed the exact workspace, project, edit, or production identity.' })
  }
  if (value.storyContinuity.workspaceId !== value.workspaceId ||
      value.storyContinuity.projectId !== value.projectId ||
      value.storyContinuity.editSessionId !== value.editSessionId ||
      value.storyContinuity.productionId !== value.productionId ||
      value.storyContinuity.sceneId !== value.instantiation.sceneId) {
    context.addIssue({ code: 'custom', path: ['storyContinuity'], message: 'Scene continuity changed the exact compilation scope or scene.' })
  }
  for (const requiredDigest of [
    value.storyContinuity.sourceMotionDnaVersion.contentDigest,
    value.storyContinuity.sourcePreparedScriptVersion.contentDigest,
    value.storyContinuity.sourceGrammarDigest,
  ]) {
    if (!value.instantiation.inputArtifactDigests.includes(requiredDigest)) {
      context.addIssue({ code: 'custom', path: ['instantiation', 'inputArtifactDigests'], message: 'Scene Recipe inputs omit exact Story Continuity lineage.' })
      break
    }
  }
  if (value.productionRoute.mode !== value.instantiation.productionMode ||
      value.productionRoute.sceneRecipeVersion.artifactId !== value.instantiation.recipeVersion.artifactId ||
      value.productionRoute.sceneRecipeVersion.versionId !== value.instantiation.recipeVersion.versionId ||
      value.productionRoute.sceneRecipeVersion.versionNumber !== value.instantiation.recipeVersion.versionNumber ||
      value.productionRoute.sceneRecipeVersion.contentDigest !== value.instantiation.recipeVersion.contentDigest ||
      value.productionRoute.sceneRecipeDefinitionVersion !== value.instantiation.recipeDefinitionVersion ||
      value.productionRoute.sceneRecipeDefinitionDigest !== value.instantiation.recipeDefinitionDigest) {
    context.addIssue({ code: 'custom', path: ['productionRoute'], message: 'Production Route changed the exact approved recipe instantiation.' })
  }
  if (value.productionRoute.motionLanguage.motionLanguageId !== value.instantiation.motionLanguage.motionLanguageId ||
      value.productionRoute.motionLanguage.motionLanguageVersion !== value.instantiation.motionLanguage.motionLanguageVersion ||
      value.productionRoute.motionLanguage.motionLanguageDigest !== value.instantiation.motionLanguage.motionLanguageDigest ||
      value.productionRoute.narrativeFunction.narrativeFunctionId !== value.instantiation.narrativeFunction.narrativeFunctionId ||
      value.productionRoute.narrativeFunction.narrativeFunctionVersion !== value.instantiation.narrativeFunction.narrativeFunctionVersion ||
      value.productionRoute.narrativeFunction.narrativeFunctionDigest !== value.instantiation.narrativeFunction.narrativeFunctionDigest) {
    context.addIssue({ code: 'custom', path: ['productionRoute'], message: 'Production Route changed the exact Motion Language or Narrative Function authority.' })
  }
  if (value.productionRoute.capabilityIds.length !== value.recipe.toolCapabilityIds.length ||
      value.productionRoute.capabilityIds.some((capability, index) => capability !== value.recipe.toolCapabilityIds[index])) {
    context.addIssue({ code: 'custom', path: ['productionRoute', 'capabilityIds'], message: 'Production Route capabilities must match the exact Scene Recipe capability plan.' })
  }
  if (!value.productionRoute.providerNeutral ||
      !value.productionRoute.approvalRequired ||
      !value.productionRoute.costEstimateRequired) {
    context.addIssue({ code: 'custom', path: ['productionRoute'], message: 'Storytelling Scene Recipe routes must remain provider-neutral, approval-bound, and cost-estimated.' })
  }
  if (value.requiresGeneratedMedia !== Boolean(value.projectVideoRoutingProfileDigest)) {
    context.addIssue({ code: 'custom', path: ['projectVideoRoutingProfileDigest'], message: 'Generated-media recipes require one approved project routing profile digest; deterministic recipes must not invent one.' })
  }
})

export const ALL_STYLE_CALIBRATION_SCENARIOS: readonly StyleCalibrationScenarioKind[] = [
  'style_led_motion',
  'character_continuity',
  'strict_first_last_frame',
  'reference_heavy',
  'exact_text_data',
]

export function validateStorytellingMotionStyleProfile(value: unknown) {
  return validationResult(storytellingMotionStyleProfileSchema, value)
}

export function validateStorytellingStyleSourceAudit(value: unknown) {
  return validationResult(storytellingStyleSourceAuditSchema, value)
}

export function validateStorytellingMotionStyleSelection(value: unknown) {
  return validationResult(storytellingMotionStyleSelectionSchema, value)
}

export function validateStorytellingMotionStylePlanReviewInput(value: unknown) {
  return validationResult(storytellingMotionStylePlanReviewInputSchema, value)
}

export function validateStorytellingMotionStyleDecisionDto(value: unknown) {
  return validationResult(storytellingMotionStyleDecisionDtoSchema, value)
}

export function validateStorytellingMotionStylePlanBinding(value: unknown) {
  return validationResult(storytellingMotionStylePlanBindingSchema, value)
}

export function validateStorytellingMotionStyleChangeImpact(value: unknown) {
  return validationResult(storytellingMotionStyleChangeImpactSchema, value)
}

export function validateStyleCalibrationPlan(value: unknown) {
  return validationResult(styleCalibrationPlanSchema, value)
}

export function validateStyleCalibrationCandidateEvidence(value: unknown) {
  return validationResult(styleCalibrationCandidateEvidenceSchema, value)
}

export function validateStyleCalibrationReel(value: unknown) {
  return validationResult(styleCalibrationReelSchema, value)
}

export function validateProjectVideoRoutingProfile(value: unknown) {
  return validationResult(projectVideoRoutingProfileSchema, value)
}

export function validateStorytellingSceneRecipeCompilation(value: unknown) {
  return validationResult(storytellingSceneRecipeCompilationSchema, value)
}

function validationResult(schema: z.ZodTypeAny, value: unknown): { ok: boolean; errors: readonly string[] } {
  const parsed = schema.safeParse(value)
  const errors = parsed.success
    ? []
    : parsed.error.issues.map((issue) => `${issue.path.join('.') || '$'}: ${issue.message}`)
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

function timingAuthorityFrameRateRatio(
  value: { frameRate: number; timebase: string },
): { numerator: number; denominator: number } | null {
  const [frameDurationNumeratorText, frameDurationDenominatorText, ...extra] = value.timebase.split('/')
  if (extra.length > 0 || frameDurationNumeratorText === undefined || frameDurationDenominatorText === undefined) {
    return null
  }
  const denominator = Number(frameDurationNumeratorText)
  const numerator = Number(frameDurationDenominatorText)
  if (!Number.isSafeInteger(numerator) || numerator <= 0 ||
      !Number.isSafeInteger(denominator) || denominator <= 0) return null
  const derived = numerator / denominator
  const tolerance = Math.max(1e-9, derived * 1e-9)
  return Math.abs(derived - value.frameRate) <= tolerance ? { numerator, denominator } : null
}

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function requireUnique(
  values: readonly string[],
  context: z.RefinementCtx,
  path: PropertyKey[],
  label: string,
): void {
  if (new Set(values).size !== values.length) {
    context.addIssue({ code: 'custom', path, message: `${label} must be unique.` })
  }
}

function requireExactScenarioSet(values: readonly StyleCalibrationScenarioKind[], context: z.RefinementCtx): void {
  if (values.length !== ALL_STYLE_CALIBRATION_SCENARIOS.length ||
      ALL_STYLE_CALIBRATION_SCENARIOS.some((kind) => !values.includes(kind))) {
    context.addIssue({ code: 'custom', path: ['scenarios'], message: 'Style Calibration Reel requires each canonical scenario exactly once.' })
  }
}
