import { z } from 'zod'
import type { CaptionIntegrationClass } from '../../src/types/caption-design-composite'
import {
  CAPTION_APPROVAL_ENVELOPE_VERSION,
  CAPTION_BLOCKING_METADATA_VERSION,
  CAPTION_EARLY_PLANNING_BUNDLE_VERSION,
  CAPTION_ESTIMATE_INPUT_VERSION,
  CAPTION_INTEGRATION_CLASSIFICATION_VERSION,
  CAPTION_OPPORTUNITY_MAP_VERSION,
  CAPTION_RESERVATION_PLAN_VERSION,
  CAPTION_RESTRAINT_VERSION,
  CAPTION_STRATEGY_PLAN_VERSION,
  type CaptionApprovalEnvelopeV2,
  type CaptionBlockingMetadata,
  type CaptionEarlyPlanningBundle,
  type CaptionEarlyPlanningInput,
  type CaptionEstimateFactorCode,
  type CaptionEstimateInput,
  type CaptionIntegrationClassificationV2,
  type CaptionOpportunityMapV2,
  type CaptionPlanningIntegrationClass,
  type CaptionReservationPlanV2,
  type CaptionRestraint,
  type CaptionStrategyPlanV2,
} from '../../src/types/caption-early-planning'
import type {
  CaptionDomainClosedAuthorityBoundary,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import { CAPTION_DESIGN_COMPOSITE } from './caption-design-composite'

const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const languageTag = z.string().min(2).max(64)
  .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u)
const keyList = z.array(safeKey).max(512)
const nonEmptyKeyList = z.array(safeKey).min(1).max(512)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Planning frame range has no duration.' })
  }
})
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
}).strict().superRefine((scope, context) => {
  let priorEnd = -1
  for (const range of scope.authorizedFrameRanges) {
    if (range.startFrame < priorEnd) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Authorized ranges must be ordered and non-overlapping.' })
    }
    priorEnd = range.endFrameExclusive
  }
})
const integrationClassSchema = z.enum([
  'late_overlay', 'reserved_composition', 'structural_typography',
  'cross_system_transform',
])
const projectModeSchema = z.enum([
  'accessibility_first', 'clean_long_form', 'dynamic_short_form',
  'cinematic_editorial', 'educational_explainer', 'multi_speaker_dialogue',
  'brand_directed', 'minimal_support',
])
const textTransformationSchema = z.enum([
  'exact', 'punctuation_cleanup', 'filler_omission',
  'condensed_without_meaning_change', 'translated',
  'paraphrase_requires_approval',
])
const regionSchema = z.object({
  x: z.number().int().min(0).max(10_000),
  y: z.number().int().min(0).max(10_000),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
}).strict().superRefine((region, context) => {
  if (region.x + region.width > 10_000 || region.y + region.height > 10_000) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Caption reservation exceeds the confirmed frame.' })
  }
})
const safeRegionSchema = z.object({
  regionId: safeKey,
  regionBasisPoints: regionSchema,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  protectedRegionIds: keyList,
  evidenceRef: refSchema,
}).strict()
const confirmedFrameSchema = z.object({
  outputId: safeKey,
  width: z.number().int().min(320).max(16_384),
  height: z.number().int().min(180).max(16_384),
  aspectRatioNumerator: z.number().int().positive().max(16_384),
  aspectRatioDenominator: z.number().int().positive().max(16_384),
  confirmedOutputFrameDigestSha256: sha256,
}).strict()
const sceneInputSchema = z.object({
  sceneId: safeKey,
  planningFrameRange: frameRangeSchema,
  sourcePhraseIds: keyList,
  speechRole: z.enum(['none', 'supporting', 'primary']),
  semanticImportanceBasisPoints: z.number().int().min(0).max(10_000),
  visualDensity: z.enum(['low', 'moderate', 'high']),
  multiTrackLikely: z.boolean(),
  depthMaskOrTrackingLikely: z.boolean(),
  requestedTreatment: z.union([z.literal('auto'), integrationClassSchema]),
  crossSystemTarget: z.enum([
    'broll', 'living_frame', 'map', 'chart', 'diagram', 'transition',
  ]).nullable(),
  candidateSafeRegions: z.array(safeRegionSchema).max(64),
  reasonCodes: nonEmptyKeyList,
}).strict()
const inputSchema: z.ZodType<CaptionEarlyPlanningInput> = z.object({
  bundleId: safeKey,
  canonicalScope: scopeSchema,
  captionCompositeRef: refSchema,
  compiledIntentRef: refSchema,
  professionalSkillTraceRef: refSchema,
  confirmedOutputFrame: confirmedFrameSchema,
  canonicalTranscriptRef: refSchema,
  sourceSpeechEvidenceRef: refSchema,
  sourceVisualUnderstandingRef: refSchema,
  editPreferencesRef: refSchema,
  referenceDnaRef: refSchema.nullable(),
  planningTimingBasisRef: refSchema,
  directive: z.object({
    disposition: z.enum(['caption_design_selected', 'no_captions']),
    reasonCodes: nonEmptyKeyList,
    ownerApprovedRestraintRef: refSchema.nullable(),
  }).strict(),
  projectMode: projectModeSchema,
  primaryLanguage: languageTag,
  requestedLanguages: z.array(languageTag).min(1).max(32),
  accessibleOutputKinds: z.array(z.enum(['srt', 'webvtt', 'stable_burn_in'])).max(3),
  constraints: z.object({
    allowedTypographyRoles: keyList,
    maximumMotionLevel: z.enum(['none', 'restrained', 'moderate', 'expressive']),
    maximumHeroMoments: z.number().int().min(0).max(64),
    subjectOverlapAllowed: z.boolean(),
    objectAnchoringAllowed: z.boolean(),
    captionToVisualAllowed: z.boolean(),
    captionSoundAllowed: z.boolean(),
    allowedTextTransformations: z.array(textTransformationSchema).min(1).max(6),
    requestedMaximumCaptionCredits: z.number().int().nonnegative().max(1_000_000),
    fallbackIds: keyList,
  }).strict(),
  scenes: z.array(sceneInputSchema).min(1).max(2_048),
}).strict()

const identityShapes = {
  componentId: safeKey,
  componentVersion: safeKey,
  componentDigestSha256: sha256,
}
const strategySchema: z.ZodType<CaptionStrategyPlanV2> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_STRATEGY_PLAN_VERSION),
  projectMode: projectModeSchema,
  approximateDensity: z.enum(['none', 'sparse', 'balanced', 'dense']),
  primaryLanguage: languageTag,
  requestedLanguages: z.array(languageTag).min(1).max(32),
  accessibleProjectionRequired: z.boolean(),
  selectedIntegrationClasses: z.array(integrationClassSchema).max(4),
  allowedTypographyRoles: keyList,
  likelyHeroMomentCount: z.number().int().nonnegative().max(64),
  likelyMaskOrTrackingNeeded: z.boolean(),
  likelyCaptionToVisualHandoffNeeded: z.boolean(),
  reasonCodes: keyList,
}).strict()
const opportunitySchema: z.ZodType<CaptionOpportunityMapV2> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_OPPORTUNITY_MAP_VERSION),
  opportunities: z.array(z.object({
    opportunityId: safeKey,
    sceneId: safeKey,
    planningFrameRange: frameRangeSchema,
    sourcePhraseIds: keyList,
    semanticPurposeCode: safeKey,
    integrationClass: integrationClassSchema,
    confidenceBasisPoints: z.number().int().min(0).max(10_000),
    likelyNeedsVisualEvidence: z.boolean(),
    likelyNeedsTracking: z.boolean(),
    heroCandidate: z.boolean(),
    handoffTarget: sceneInputSchema.shape.crossSystemTarget,
  }).strict()).max(2_048),
}).strict()
const classificationSchema: z.ZodType<CaptionIntegrationClassificationV2> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_INTEGRATION_CLASSIFICATION_VERSION),
  sceneClassifications: z.array(z.object({
    sceneId: safeKey,
    integrationClass: integrationClassSchema.nullable(),
    reasonCodes: keyList,
    deliberateNonUse: z.boolean(),
  }).strict()).min(1).max(2_048),
}).strict()
const reservationSchema: z.ZodType<CaptionReservationPlanV2> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_RESERVATION_PLAN_VERSION),
  reservations: z.array(z.object({
    reservationId: safeKey,
    sceneId: safeKey,
    planningFrameRange: frameRangeSchema,
    selectedRegionId: safeKey.nullable(),
    regionBasisPoints: regionSchema.nullable(),
    protectedRegionIds: keyList,
    sourceVisualEvidenceRef: refSchema.nullable(),
    priority: z.enum(['caption_primary', 'caption_support']),
    disposition: z.enum(['reserved_intent', 'blocked_missing_safe_region']),
    fallbackRegionIds: keyList,
  }).strict()).max(2_048),
  intentOnly: z.literal(true),
  createsLayoutAuthority: z.literal(false),
  finalPlacementResolved: z.literal(false),
}).strict()
const blockingSchema: z.ZodType<CaptionBlockingMetadata> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_BLOCKING_METADATA_VERSION),
  scenes: z.array(z.object({
    sceneId: safeKey,
    approximateTrackCount: z.number().int().min(0).max(16),
    approximateDensity: z.enum(['sparse', 'balanced', 'dense']),
    reservedRegionId: safeKey.nullable(),
    integrationClass: integrationClassSchema.nullable(),
    nonFinalLabelRequired: z.literal(true),
  }).strict()).min(1).max(2_048),
  approximateOnly: z.literal(true),
  renderable: z.literal(false),
  finalCaptionTextIncluded: z.literal(false),
  executableFramesIncluded: z.literal(false),
}).strict()
const approvalSchema: z.ZodType<CaptionApprovalEnvelopeV2> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_APPROVAL_ENVELOPE_VERSION),
  selectionDisposition: z.enum(['caption_design_selected', 'no_captions']),
  allowedIntegrationClasses: z.array(integrationClassSchema).max(4),
  allowedTypographyRoles: keyList,
  maximumMotionLevel: z.enum(['none', 'restrained', 'moderate', 'expressive']),
  maximumHeroMoments: z.number().int().nonnegative().max(64),
  subjectOverlapAllowed: z.boolean(),
  objectAnchoringAllowed: z.boolean(),
  captionToVisualAllowed: z.boolean(),
  captionSoundAllowed: z.boolean(),
  allowedTextTransformations: z.array(textTransformationSchema).min(1).max(6),
  languages: z.array(languageTag).min(1).max(32),
  accessibleOutputKinds: z.array(z.enum(['srt', 'webvtt', 'stable_burn_in'])).max(3),
  requestedMaximumCaptionCredits: z.number().int().nonnegative().max(1_000_000),
  approvedFallbackIds: keyList,
  canonicalEstimateApprovalStillRequired: z.literal(true),
  canonicalPlanApprovalStillRequired: z.literal(true),
  creditReservationCreated: z.literal(false),
}).strict()
const estimateFactorSchema = z.object({
  factorCode: z.enum([
    'transcription', 'alignment', 'diarization', 'visual_evidence',
    'mask_tracking', 'custom_fonts', 'output_count', 'languages',
    'spatial_scenes', 'hero_typography', 'cross_system_handoffs', 'sound',
    'render_complexity', 'visual_qa', 'revisions',
  ]),
  quantity: z.number().int().positive().max(1_000_000),
  complexity: z.enum(['low', 'moderate', 'high']),
  reasonCodes: keyList,
}).strict()
const estimateSchema: z.ZodType<CaptionEstimateInput> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_ESTIMATE_INPUT_VERSION),
  factors: z.array(estimateFactorSchema).max(15),
  lowerCostFallbackIds: keyList,
  priceCalculated: z.literal(false),
  creditsReserved: z.literal(false),
  billingAuthorityClaimed: z.literal(false),
}).strict()
const restraintSchema: z.ZodType<CaptionRestraint> = z.object({
  ...identityShapes,
  componentVersion: z.literal(CAPTION_RESTRAINT_VERSION),
  restraint: z.enum(['no_captions', 'none']),
  reasonCodes: keyList,
  ownerApprovedRestraintRef: refSchema.nullable(),
  captionWorkAllowed: z.boolean(),
}).strict()
const authoritySchema = z.object({
  canonicalApprovalGranted: z.literal(false),
  snapshotMutationGranted: z.literal(false),
  timelineMutationGranted: z.literal(false),
  workCreationGranted: z.literal(false),
  providerDispatchGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  costAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  finalCanvasAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const bundleSchema: z.ZodType<CaptionEarlyPlanningBundle> = z.object({
  schemaVersion: z.literal(CAPTION_EARLY_PLANNING_BUNDLE_VERSION),
  bundleId: safeKey,
  bundleDigestSha256: sha256,
  canonicalScope: scopeSchema,
  confirmedOutputFrame: confirmedFrameSchema,
  inputRefs: z.array(refSchema).min(8).max(9),
  strategyPlan: strategySchema,
  opportunityMap: opportunitySchema,
  integrationClassification: classificationSchema,
  reservationPlan: reservationSchema,
  blockingMetadata: blockingSchema,
  approvalEnvelope: approvalSchema,
  estimateInput: estimateSchema,
  restraint: restraintSchema,
  lifecycleState: z.enum([
    'early_planned', 'reserved', 'blocked_needs_visual_support',
    'restrained_no_captions',
  ]),
  supportRequirementCodes: keyList,
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  privateArtifact: z.literal(true),
  byteFree: z.literal(true),
  authorityBoundary: authoritySchema,
}).strict()

const CLOSED_AUTHORITY: CaptionDomainClosedAuthorityBoundary = {
  canonicalApprovalGranted: false,
  snapshotMutationGranted: false,
  timelineMutationGranted: false,
  workCreationGranted: false,
  providerDispatchGranted: false,
  runtimeExecutionGranted: false,
  assetCreationGranted: false,
  costAuthorityGranted: false,
  billingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  finalCanvasAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

const LEGACY_INTEGRATION_CLASS_MAP: Readonly<
  Record<CaptionIntegrationClass, CaptionPlanningIntegrationClass>
> = Object.freeze({
  clean_phrase: 'late_overlay',
  active_word: 'late_overlay',
  semantic_kinetic: 'late_overlay',
  spatial_composite: 'reserved_composition',
  subject_occluded: 'reserved_composition',
  object_anchored: 'reserved_composition',
  environmental: 'reserved_composition',
  persistent_topic: 'reserved_composition',
  hero: 'structural_typography',
  caption_to_visual: 'cross_system_transform',
})

export function adaptLegacyCaptionIntegrationClass(
  value: CaptionIntegrationClass,
): CaptionPlanningIntegrationClass {
  return LEGACY_INTEGRATION_CLASS_MAP[value]
}

function gcd(left: number, right: number): number {
  let a = left
  let b = right
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function component<T extends { componentId: string; componentVersion: string }>(
  value: T,
): T & { componentDigestSha256: string } {
  return {
    ...value,
    componentDigestSha256: calculateSkillContractDigest(
      { ...value, componentDigestSha256: '' },
      'componentDigestSha256',
    ),
  }
}

function assertComponentDigest(
  value: { componentDigestSha256: string } & Record<string, unknown>,
): void {
  const expected = calculateSkillContractDigest(value, 'componentDigestSha256')
  if (expected !== value.componentDigestSha256) {
    throw new Error('Caption early-planning component digest verification failed.')
  }
}

function validateInputSemantics(input: CaptionEarlyPlanningInput): void {
  const frame = input.confirmedOutputFrame
  const divisor = gcd(frame.width, frame.height)
  if (frame.outputId !== input.canonicalScope.outputId
    || frame.aspectRatioNumerator !== frame.width / divisor
    || frame.aspectRatioDenominator !== frame.height / divisor) {
    throw new Error('Caption early planning requires the exact confirmed output-frame ratio.')
  }
  if (input.canonicalScope.approvedSnapshotRef !== null) {
    throw new Error('Caption early planning cannot claim an approved snapshot.')
  }
  if (input.captionCompositeRef.id !== CAPTION_DESIGN_COMPOSITE.compositeId
    || input.captionCompositeRef.version !== CAPTION_DESIGN_COMPOSITE.compositeVersion
    || input.captionCompositeRef.contentHash !== CAPTION_DESIGN_COMPOSITE.compositeDigestSha256) {
    throw new Error('Caption early planning has stale composite lineage.')
  }
  if (input.directive.disposition === 'no_captions'
    && input.directive.ownerApprovedRestraintRef === null) {
    throw new Error('no_captions requires an exact owner-approved restraint ref.')
  }
  if (input.directive.disposition === 'caption_design_selected'
    && input.directive.ownerApprovedRestraintRef !== null) {
    throw new Error('Caption selection conflicts with no_captions restraint lineage.')
  }
  if (!input.requestedLanguages.includes(input.primaryLanguage)) {
    throw new Error('Requested languages omit the primary Caption language.')
  }
  if (new Set(input.requestedLanguages.map((item) => item.toLowerCase())).size
    !== input.requestedLanguages.length) {
    throw new Error('Requested Caption languages must be unique.')
  }
  const sceneIds = new Set<string>()
  for (const scene of input.scenes) {
    if (sceneIds.has(scene.sceneId)) throw new Error('Caption scene IDs must be unique.')
    sceneIds.add(scene.sceneId)
    if (!input.canonicalScope.authorizedFrameRanges.some((range) =>
      scene.planningFrameRange.startFrame >= range.startFrame
      && scene.planningFrameRange.endFrameExclusive <= range.endFrameExclusive)) {
      throw new Error(`Caption scene ${scene.sceneId} exceeds its authorized planning scope.`)
    }
    if (scene.speechRole !== 'none' && scene.sourcePhraseIds.length === 0) {
      throw new Error(`Caption scene ${scene.sceneId} lacks source phrase lineage.`)
    }
    if (scene.speechRole === 'none' && scene.requestedTreatment !== 'auto') {
      throw new Error(`Caption scene ${scene.sceneId} requests treatment without captionable speech.`)
    }
    if (scene.requestedTreatment === 'cross_system_transform'
      && scene.crossSystemTarget === null) {
      throw new Error('Cross-system Caption treatment requires an exact target.')
    }
    if (scene.crossSystemTarget !== null
      && scene.requestedTreatment !== 'auto'
      && scene.requestedTreatment !== 'cross_system_transform') {
      throw new Error('Cross-system target conflicts with the requested Caption treatment.')
    }
    if (scene.crossSystemTarget !== null && !input.constraints.captionToVisualAllowed) {
      throw new Error('Caption-to-Visual planning exceeds the approval-envelope request.')
    }
    const regionIds = new Set(scene.candidateSafeRegions.map((region) => region.regionId))
    if (regionIds.size !== scene.candidateSafeRegions.length) {
      throw new Error(`Caption scene ${scene.sceneId} has duplicate safe regions.`)
    }
  }
}

function classifyScene(
  input: CaptionEarlyPlanningInput,
  scene: CaptionEarlyPlanningInput['scenes'][number],
  heroCount: number,
): CaptionPlanningIntegrationClass | null {
  if (scene.speechRole === 'none') return null
  if (scene.requestedTreatment !== 'auto') {
    if (scene.requestedTreatment === 'structural_typography'
      && heroCount >= input.constraints.maximumHeroMoments) {
      throw new Error('Requested structural typography exceeds the hero-moment ceiling.')
    }
    return scene.requestedTreatment
  }
  if (scene.crossSystemTarget !== null) return 'cross_system_transform'
  if (scene.semanticImportanceBasisPoints >= 9_000
    && heroCount < input.constraints.maximumHeroMoments) return 'structural_typography'
  if (scene.multiTrackLikely || scene.depthMaskOrTrackingLikely
    || scene.visualDensity === 'high') return 'reserved_composition'
  return 'late_overlay'
}

function sceneDensity(
  scene: CaptionEarlyPlanningInput['scenes'][number],
): 'sparse' | 'balanced' | 'dense' {
  if (scene.multiTrackLikely || scene.visualDensity === 'high') return 'dense'
  if (scene.speechRole === 'primary' || scene.visualDensity === 'moderate') return 'balanced'
  return 'sparse'
}

function estimateComplexity(quantity: number): 'low' | 'moderate' | 'high' {
  return quantity >= 6 ? 'high' : quantity >= 2 ? 'moderate' : 'low'
}

function createEstimateFactors(input: {
  sceneCount: number
  opportunityCount: number
  trackingCount: number
  multiTrackCount: number
  spatialCount: number
  heroCount: number
  handoffCount: number
  languageCount: number
  soundAllowed: boolean
  restraint: boolean
}): CaptionEstimateInput['factors'] {
  if (input.restraint) return []
  const factors: Array<[CaptionEstimateFactorCode, number, string]> = [
    ['transcription', 1, 'canonical_transcript_required'],
    ['alignment', Math.max(1, input.opportunityCount), 'word_timing_provenance_required'],
    ['visual_evidence', input.sceneCount, 'safe_region_and_hierarchy_evidence'],
    ['output_count', 1, 'confirmed_output_frame'],
    ['languages', input.languageCount, 'language_specific_caption_projection'],
    ['render_complexity', Math.max(1, input.opportunityCount), 'caption_render_projection'],
    ['visual_qa', Math.max(1, input.languageCount), 'per_output_visual_inspection'],
    ['revisions', 1, 'bounded_caption_repair_allowance'],
  ]
  if (input.trackingCount > 0) factors.push(['mask_tracking', input.trackingCount, 'depth_or_anchor_support'])
  if (input.multiTrackCount > 0) factors.push(['diarization', input.multiTrackCount, 'multi_track_speaker_separation'])
  if (input.spatialCount > 0) factors.push(['spatial_scenes', input.spatialCount, 'reserved_caption_composition'])
  if (input.heroCount > 0) factors.push(['hero_typography', input.heroCount, 'structural_typography'])
  if (input.handoffCount > 0) factors.push(['cross_system_handoffs', input.handoffCount, 'typed_information_owner_handoff'])
  if (input.soundAllowed) factors.push(['sound', 1, 'caption_sound_request_allowed'])
  return factors.map(([factorCode, quantity, reasonCode]) => ({
    factorCode,
    quantity,
    complexity: estimateComplexity(quantity),
    reasonCodes: [reasonCode],
  }))
}

export function createCaptionEarlyPlanningBundle(
  value: unknown,
): CaptionEarlyPlanningBundle {
  assertClosedContractTree(value, 'Caption early-planning input')
  const input = inputSchema.parse(value)
  validateInputSemantics(input)
  const restrained = input.directive.disposition === 'no_captions'
  let heroCount = 0
  const classifications = input.scenes.map((scene) => {
    const integrationClass = restrained ? null : classifyScene(input, scene, heroCount)
    if (integrationClass === 'structural_typography') heroCount += 1
    return { scene, integrationClass }
  })
  const active = classifications.filter((item) => item.integrationClass !== null)
  const opportunityMap = component({
    componentId: `${input.bundleId}.opportunities`,
    componentVersion: CAPTION_OPPORTUNITY_MAP_VERSION,
    opportunities: active.map(({ scene, integrationClass }, index) => ({
      opportunityId: `${input.bundleId}.opportunity.${index + 1}`,
      sceneId: scene.sceneId,
      planningFrameRange: scene.planningFrameRange,
      sourcePhraseIds: scene.sourcePhraseIds,
      semanticPurposeCode: scene.reasonCodes[0] ?? 'caption_scene_support',
      integrationClass: integrationClass!,
      confidenceBasisPoints: Math.min(
        scene.semanticImportanceBasisPoints,
        scene.candidateSafeRegions[0]?.confidenceBasisPoints ?? 7_000,
      ),
      likelyNeedsVisualEvidence: true,
      likelyNeedsTracking: scene.depthMaskOrTrackingLikely,
      heroCandidate: integrationClass === 'structural_typography',
      handoffTarget: integrationClass === 'cross_system_transform'
        ? scene.crossSystemTarget : null,
    })),
  }) as CaptionOpportunityMapV2
  const integrationClassification = component({
    componentId: `${input.bundleId}.classification`,
    componentVersion: CAPTION_INTEGRATION_CLASSIFICATION_VERSION,
    sceneClassifications: classifications.map(({ scene, integrationClass }) => ({
      sceneId: scene.sceneId,
      integrationClass,
      reasonCodes: restrained
        ? input.directive.reasonCodes
        : scene.speechRole === 'none'
          ? ['scene_has_no_captionable_speech']
          : scene.reasonCodes,
      deliberateNonUse: integrationClass === null,
    })),
  }) as CaptionIntegrationClassificationV2
  const reservations = active.map(({ scene }, index) => {
    const candidates = [...scene.candidateSafeRegions]
      .sort((left, right) => right.confidenceBasisPoints - left.confidenceBasisPoints
        || left.regionId.localeCompare(right.regionId))
    const selected = candidates[0] ?? null
    return {
      reservationId: `${input.bundleId}.reservation.${index + 1}`,
      sceneId: scene.sceneId,
      planningFrameRange: scene.planningFrameRange,
      selectedRegionId: selected?.regionId ?? null,
      regionBasisPoints: selected?.regionBasisPoints ?? null,
      protectedRegionIds: selected?.protectedRegionIds ?? [],
      sourceVisualEvidenceRef: selected?.evidenceRef ?? null,
      priority: scene.speechRole === 'primary' ? 'caption_primary' as const : 'caption_support' as const,
      disposition: selected ? 'reserved_intent' as const : 'blocked_missing_safe_region' as const,
      fallbackRegionIds: candidates.slice(1).map((candidate) => candidate.regionId),
    }
  })
  const reservationPlan = component({
    componentId: `${input.bundleId}.reservations`,
    componentVersion: CAPTION_RESERVATION_PLAN_VERSION,
    reservations,
    intentOnly: true as const,
    createsLayoutAuthority: false as const,
    finalPlacementResolved: false as const,
  }) as CaptionReservationPlanV2
  const selectedClasses = Array.from(new Set(active.map((item) => item.integrationClass!)))
  const strategyPlan = component({
    componentId: `${input.bundleId}.strategy`,
    componentVersion: CAPTION_STRATEGY_PLAN_VERSION,
    projectMode: input.projectMode,
    approximateDensity: restrained || active.length === 0
      ? 'none' as const
      : active.length >= Math.ceil(input.scenes.length * 0.75)
        ? 'dense' as const
        : active.length >= Math.ceil(input.scenes.length * 0.33)
          ? 'balanced' as const
          : 'sparse' as const,
    primaryLanguage: input.primaryLanguage,
    requestedLanguages: input.requestedLanguages,
    accessibleProjectionRequired: input.accessibleOutputKinds.length > 0,
    selectedIntegrationClasses: selectedClasses,
    allowedTypographyRoles: restrained ? [] : input.constraints.allowedTypographyRoles,
    likelyHeroMomentCount: restrained ? 0 : heroCount,
    likelyMaskOrTrackingNeeded: !restrained
      && active.some(({ scene }) => scene.depthMaskOrTrackingLikely),
    likelyCaptionToVisualHandoffNeeded: !restrained
      && active.some((item) => item.integrationClass === 'cross_system_transform'),
    reasonCodes: input.directive.reasonCodes,
  }) as CaptionStrategyPlanV2
  const blockingMetadata = component({
    componentId: `${input.bundleId}.blocking`,
    componentVersion: CAPTION_BLOCKING_METADATA_VERSION,
    scenes: classifications.map(({ scene, integrationClass }) => ({
      sceneId: scene.sceneId,
      approximateTrackCount: integrationClass === null ? 0 : scene.multiTrackLikely ? 2 : 1,
      approximateDensity: sceneDensity(scene),
      reservedRegionId: reservations.find((reservation) =>
        reservation.sceneId === scene.sceneId)?.selectedRegionId ?? null,
      integrationClass,
      nonFinalLabelRequired: true as const,
    })),
    approximateOnly: true as const,
    renderable: false as const,
    finalCaptionTextIncluded: false as const,
    executableFramesIncluded: false as const,
  }) as CaptionBlockingMetadata
  const approvalEnvelope = component({
    componentId: `${input.bundleId}.approval`,
    componentVersion: CAPTION_APPROVAL_ENVELOPE_VERSION,
    selectionDisposition: input.directive.disposition,
    allowedIntegrationClasses: restrained ? [] : selectedClasses,
    allowedTypographyRoles: restrained ? [] : input.constraints.allowedTypographyRoles,
    maximumMotionLevel: restrained ? 'none' as const : input.constraints.maximumMotionLevel,
    maximumHeroMoments: restrained ? 0 : input.constraints.maximumHeroMoments,
    subjectOverlapAllowed: !restrained && input.constraints.subjectOverlapAllowed,
    objectAnchoringAllowed: !restrained && input.constraints.objectAnchoringAllowed,
    captionToVisualAllowed: !restrained && input.constraints.captionToVisualAllowed,
    captionSoundAllowed: !restrained && input.constraints.captionSoundAllowed,
    allowedTextTransformations: restrained ? ['exact' as const]
      : input.constraints.allowedTextTransformations,
    languages: input.requestedLanguages,
    accessibleOutputKinds: restrained ? [] : input.accessibleOutputKinds,
    requestedMaximumCaptionCredits: restrained ? 0 : input.constraints.requestedMaximumCaptionCredits,
    approvedFallbackIds: restrained ? [] : input.constraints.fallbackIds,
    canonicalEstimateApprovalStillRequired: true as const,
    canonicalPlanApprovalStillRequired: true as const,
    creditReservationCreated: false as const,
  }) as CaptionApprovalEnvelopeV2
  const trackingCount = active.filter(({ scene }) => scene.depthMaskOrTrackingLikely).length
  const multiTrackCount = active.filter(({ scene }) => scene.multiTrackLikely).length
  const spatialCount = active.filter((item) =>
    item.integrationClass === 'reserved_composition').length
  const handoffCount = active.filter((item) =>
    item.integrationClass === 'cross_system_transform').length
  const estimateInput = component({
    componentId: `${input.bundleId}.estimate`,
    componentVersion: CAPTION_ESTIMATE_INPUT_VERSION,
    factors: createEstimateFactors({
      sceneCount: input.scenes.length,
      opportunityCount: active.length,
      trackingCount,
      multiTrackCount,
      spatialCount,
      heroCount,
      handoffCount,
      languageCount: input.requestedLanguages.length,
      soundAllowed: input.constraints.captionSoundAllowed,
      restraint: restrained,
    }),
    lowerCostFallbackIds: restrained ? [] : input.constraints.fallbackIds,
    priceCalculated: false as const,
    creditsReserved: false as const,
    billingAuthorityClaimed: false as const,
  }) as CaptionEstimateInput
  const restraint = component({
    componentId: `${input.bundleId}.restraint`,
    componentVersion: CAPTION_RESTRAINT_VERSION,
    restraint: restrained ? 'no_captions' as const : 'none' as const,
    reasonCodes: input.directive.reasonCodes,
    ownerApprovedRestraintRef: input.directive.ownerApprovedRestraintRef,
    captionWorkAllowed: !restrained,
  }) as CaptionRestraint
  const refs = [
    input.captionCompositeRef,
    input.compiledIntentRef,
    input.professionalSkillTraceRef,
    input.canonicalTranscriptRef,
    input.sourceSpeechEvidenceRef,
    input.sourceVisualUnderstandingRef,
    input.editPreferencesRef,
    input.planningTimingBasisRef,
    ...(input.referenceDnaRef ? [input.referenceDnaRef] : []),
  ]
  const supportRequirementCodes = Array.from(new Set([
    ...(reservations.some((item) => item.disposition === 'blocked_missing_safe_region')
      ? ['visual_intelligence.safe_region_required'] : []),
    ...(trackingCount > 0 ? ['track_all.mask_track_candidate_required'] : []),
    ...active.filter((item) => item.integrationClass === 'cross_system_transform')
      .map(({ scene }) => `support.${scene.crossSystemTarget}.handoff_required`),
  ])).sort()
  const lifecycleState: CaptionEarlyPlanningBundle['lifecycleState'] = restrained
    ? 'restrained_no_captions'
    : reservations.some((item) => item.disposition === 'blocked_missing_safe_region')
      ? 'blocked_needs_visual_support'
      : reservations.length > 0 ? 'reserved' : 'early_planned'
  const withoutDigest: Omit<CaptionEarlyPlanningBundle, 'bundleDigestSha256'> = {
    schemaVersion: CAPTION_EARLY_PLANNING_BUNDLE_VERSION,
    bundleId: input.bundleId,
    canonicalScope: input.canonicalScope,
    confirmedOutputFrame: input.confirmedOutputFrame,
    inputRefs: refs,
    strategyPlan,
    opportunityMap,
    integrationClassification,
    reservationPlan,
    blockingMetadata,
    approvalEnvelope,
    estimateInput,
    restraint,
    lifecycleState,
    supportRequirementCodes,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    privateArtifact: true,
    byteFree: true,
    authorityBoundary: CLOSED_AUTHORITY,
  }
  return parseCaptionEarlyPlanningBundle({
    ...withoutDigest,
    bundleDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, bundleDigestSha256: '' },
      'bundleDigestSha256',
    ),
  })
}

export function parseCaptionEarlyPlanningBundle(
  value: unknown,
): CaptionEarlyPlanningBundle {
  assertClosedContractTree(value, 'Caption early-planning bundle')
  const parsed = bundleSchema.parse(value)
  const components = [
    parsed.strategyPlan, parsed.opportunityMap, parsed.integrationClassification,
    parsed.reservationPlan, parsed.blockingMetadata, parsed.approvalEnvelope,
    parsed.estimateInput, parsed.restraint,
  ]
  components.forEach((item) => assertComponentDigest(
    item as unknown as { componentDigestSha256: string } & Record<string, unknown>,
  ))
  const frameDivisor = gcd(
    parsed.confirmedOutputFrame.width,
    parsed.confirmedOutputFrame.height,
  )
  if (new Set(parsed.inputRefs.map(refKey)).size !== parsed.inputRefs.length
    || parsed.confirmedOutputFrame.outputId !== parsed.canonicalScope.outputId
    || parsed.confirmedOutputFrame.aspectRatioNumerator
      !== parsed.confirmedOutputFrame.width / frameDivisor
    || parsed.confirmedOutputFrame.aspectRatioDenominator
      !== parsed.confirmedOutputFrame.height / frameDivisor) {
    throw new Error('Caption early-planning source lineage is invalid.')
  }
  const restrained = parsed.restraint.restraint === 'no_captions'
  if (restrained !== (parsed.lifecycleState === 'restrained_no_captions')
    || parsed.restraint.captionWorkAllowed === restrained
    || (restrained && (parsed.opportunityMap.opportunities.length > 0
      || parsed.reservationPlan.reservations.length > 0
      || parsed.estimateInput.factors.length > 0
      || parsed.approvalEnvelope.selectionDisposition !== 'no_captions'))
    || (!restrained && parsed.approvalEnvelope.selectionDisposition !== 'caption_design_selected')) {
    throw new Error('Caption early-planning restraint semantics are invalid.')
  }
  if (new Set(parsed.strategyPlan.selectedIntegrationClasses).size
    !== parsed.strategyPlan.selectedIntegrationClasses.length
    || new Set(parsed.approvalEnvelope.allowedIntegrationClasses).size
      !== parsed.approvalEnvelope.allowedIntegrationClasses.length) {
    throw new Error('Caption early-planning integration classes must be unique.')
  }
  const opportunityScenes = new Set(parsed.opportunityMap.opportunities.map((item) => item.sceneId))
  const classificationByScene = new Map(
    parsed.integrationClassification.sceneClassifications.map((item) => [item.sceneId, item]),
  )
  const blockingByScene = new Map(
    parsed.blockingMetadata.scenes.map((item) => [item.sceneId, item]),
  )
  if (classificationByScene.size
      !== parsed.integrationClassification.sceneClassifications.length
    || blockingByScene.size !== parsed.blockingMetadata.scenes.length
    || classificationByScene.size !== blockingByScene.size) {
    throw new Error('Caption early-planning scene coverage is not one-to-one.')
  }
  for (const classification of parsed.integrationClassification.sceneClassifications) {
    if ((classification.integrationClass === null) !== classification.deliberateNonUse
      || classification.reasonCodes.length === 0
      || (classification.integrationClass !== null
        && !opportunityScenes.has(classification.sceneId))
      || blockingByScene.get(classification.sceneId)?.integrationClass
        !== classification.integrationClass) {
      throw new Error('Caption integration classification coverage is invalid.')
    }
  }
  for (const opportunity of parsed.opportunityMap.opportunities) {
    if (classificationByScene.get(opportunity.sceneId)?.integrationClass
      !== opportunity.integrationClass) {
      throw new Error('Caption opportunity classification lineage is inconsistent.')
    }
  }
  const classifiedClasses = new Set(
    parsed.integrationClassification.sceneClassifications.flatMap((item) =>
      item.integrationClass === null ? [] : [item.integrationClass]),
  )
  if (classifiedClasses.size !== parsed.strategyPlan.selectedIntegrationClasses.length
    || parsed.strategyPlan.selectedIntegrationClasses.some((item) => !classifiedClasses.has(item))
    || classifiedClasses.size !== parsed.approvalEnvelope.allowedIntegrationClasses.length
    || parsed.approvalEnvelope.allowedIntegrationClasses.some((item) => !classifiedClasses.has(item))
    || parsed.strategyPlan.likelyHeroMomentCount
      !== parsed.opportunityMap.opportunities.filter((item) => item.heroCandidate).length) {
    throw new Error('Caption strategy, classification, and approval coverage diverged.')
  }
  const reservationScenes = new Set(parsed.reservationPlan.reservations.map((item) => item.sceneId))
  if (reservationScenes.size !== parsed.reservationPlan.reservations.length
    || reservationScenes.size !== opportunityScenes.size
    || Array.from(opportunityScenes).some((sceneId) => !reservationScenes.has(sceneId))) {
    throw new Error('Caption opportunity and reservation coverage diverged.')
  }
  for (const reservation of parsed.reservationPlan.reservations) {
    const missing = reservation.disposition === 'blocked_missing_safe_region'
    if (missing !== (reservation.selectedRegionId === null)
      || missing !== (reservation.regionBasisPoints === null)
      || missing !== (reservation.sourceVisualEvidenceRef === null)
      || !opportunityScenes.has(reservation.sceneId)) {
      throw new Error('Caption reservation evidence semantics are invalid.')
    }
  }
  const missingReservation = parsed.reservationPlan.reservations.some((item) =>
    item.disposition === 'blocked_missing_safe_region')
  if ((parsed.lifecycleState === 'blocked_needs_visual_support') !== missingReservation
    || (missingReservation
      && !parsed.supportRequirementCodes.includes('visual_intelligence.safe_region_required'))
    || (!restrained && !missingReservation && parsed.reservationPlan.reservations.length > 0
      && parsed.lifecycleState !== 'reserved')
    || (!restrained && parsed.reservationPlan.reservations.length === 0
      && parsed.lifecycleState !== 'early_planned')) {
    throw new Error('Caption early lifecycle does not match reservation readiness.')
  }
  if (new Set(parsed.estimateInput.factors.map((item) => item.factorCode)).size
    !== parsed.estimateInput.factors.length) {
    throw new Error('Caption estimate factors must be unique.')
  }
  const expectedDigest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'bundleDigestSha256',
  )
  if (expectedDigest !== parsed.bundleDigestSha256) {
    throw new Error('Caption early-planning bundle digest verification failed.')
  }
  return parsed
}
