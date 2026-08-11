import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { CaptionIntegrationClass } from '../../src/types/caption-design-composite'
import type { CaptionEarlyPlanningInput } from '../../src/types/caption-early-planning'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { CAPTION_DESIGN_COMPOSITE } from '../captions-specialist/caption-design-composite'
import {
  adaptLegacyCaptionIntegrationClass,
  createCaptionEarlyPlanningBundle,
  parseCaptionEarlyPlanningBundle,
} from '../captions-specialist/caption-early-planning'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string): CaptionDomainRef {
  return { id, version: `${id}.v1`, contentHash: digest(id) }
}
function region(
  regionId: string,
  confidenceBasisPoints: number,
  y: number,
) {
  return {
    regionId,
    regionBasisPoints: { x: 800, y, width: 8400, height: 1800 },
    confidenceBasisPoints,
    protectedRegionIds: ['subject.primary'],
    evidenceRef: ref(`visual.${regionId}`),
  }
}

const compositeRef = {
  id: CAPTION_DESIGN_COMPOSITE.compositeId,
  version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
  contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
}
const input: CaptionEarlyPlanningInput = {
  bundleId: 'caption.early.plan.fixture',
  canonicalScope: {
    ownerUserId: 'owner.fixture',
    workspaceId: 'workspace.fixture',
    projectId: 'project.fixture',
    editSessionId: 'edit.fixture',
    planVersionId: 'plan.fixture.v1',
    approvedSnapshotRef: null,
    outputId: 'output.vertical',
    sceneId: null,
    authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 500 }],
  },
  captionCompositeRef: compositeRef,
  compiledIntentRef: ref('compiled.intent'),
  professionalSkillTraceRef: ref('professional.skill.trace'),
  confirmedOutputFrame: {
    outputId: 'output.vertical',
    width: 1080,
    height: 1920,
    aspectRatioNumerator: 9,
    aspectRatioDenominator: 16,
    confirmedOutputFrameDigestSha256: digest('confirmed.output.frame'),
  },
  canonicalTranscriptRef: ref('canonical.transcript'),
  sourceSpeechEvidenceRef: ref('source.speech.evidence'),
  sourceVisualUnderstandingRef: ref('source.visual.understanding'),
  editPreferencesRef: ref('edit.preferences'),
  referenceDnaRef: ref('reference.dna'),
  planningTimingBasisRef: ref('planning.timing.basis'),
  directive: {
    disposition: 'caption_design_selected',
    reasonCodes: ['caption_design_selected_by_professional_trace'],
    ownerApprovedRestraintRef: null,
  },
  projectMode: 'dynamic_short_form',
  primaryLanguage: 'en',
  requestedLanguages: ['en', 'es'],
  accessibleOutputKinds: ['srt', 'webvtt'],
  constraints: {
    allowedTypographyRoles: ['primary_speech', 'hero_display', 'accessible_sidecar'],
    maximumMotionLevel: 'moderate',
    maximumHeroMoments: 1,
    subjectOverlapAllowed: false,
    objectAnchoringAllowed: true,
    captionToVisualAllowed: true,
    captionSoundAllowed: true,
    allowedTextTransformations: ['exact', 'punctuation_cleanup'],
    requestedMaximumCaptionCredits: 240,
    fallbackIds: ['fallback.clean_phrase', 'fallback.accessible_sidecar'],
  },
  scenes: [{
    sceneId: 'scene.late',
    planningFrameRange: { startFrame: 0, endFrameExclusive: 100 },
    sourcePhraseIds: ['phrase.late'],
    speechRole: 'supporting',
    semanticImportanceBasisPoints: 7000,
    visualDensity: 'low',
    multiTrackLikely: false,
    depthMaskOrTrackingLikely: false,
    requestedTreatment: 'auto',
    crossSystemTarget: null,
    candidateSafeRegions: [region('region.late.high', 9300, 7000), region('region.late.fallback', 8500, 800)],
    reasonCodes: ['clean_supporting_speech'],
  }, {
    sceneId: 'scene.reserved',
    planningFrameRange: { startFrame: 100, endFrameExclusive: 200 },
    sourcePhraseIds: ['phrase.reserved'],
    speechRole: 'primary',
    semanticImportanceBasisPoints: 8200,
    visualDensity: 'high',
    multiTrackLikely: true,
    depthMaskOrTrackingLikely: true,
    requestedTreatment: 'auto',
    crossSystemTarget: null,
    candidateSafeRegions: [region('region.reserved', 9000, 7200)],
    reasonCodes: ['multi_track_spatial_support'],
  }, {
    sceneId: 'scene.hero',
    planningFrameRange: { startFrame: 200, endFrameExclusive: 300 },
    sourcePhraseIds: ['phrase.hero'],
    speechRole: 'primary',
    semanticImportanceBasisPoints: 9600,
    visualDensity: 'moderate',
    multiTrackLikely: false,
    depthMaskOrTrackingLikely: false,
    requestedTreatment: 'auto',
    crossSystemTarget: null,
    candidateSafeRegions: [region('region.hero', 9400, 4000)],
    reasonCodes: ['single_high_value_hero_phrase'],
  }, {
    sceneId: 'scene.handoff',
    planningFrameRange: { startFrame: 300, endFrameExclusive: 400 },
    sourcePhraseIds: ['phrase.handoff'],
    speechRole: 'primary',
    semanticImportanceBasisPoints: 8800,
    visualDensity: 'moderate',
    multiTrackLikely: false,
    depthMaskOrTrackingLikely: false,
    requestedTreatment: 'auto',
    crossSystemTarget: 'living_frame',
    candidateSafeRegions: [region('region.handoff', 9100, 7000)],
    reasonCodes: ['phrase_becomes_non_character_visual'],
  }, {
    sceneId: 'scene.no.speech',
    planningFrameRange: { startFrame: 400, endFrameExclusive: 500 },
    sourcePhraseIds: [],
    speechRole: 'none',
    semanticImportanceBasisPoints: 0,
    visualDensity: 'low',
    multiTrackLikely: false,
    depthMaskOrTrackingLikely: false,
    requestedTreatment: 'auto',
    crossSystemTarget: null,
    candidateSafeRegions: [],
    reasonCodes: ['scene_has_no_speech'],
  }],
}

const bundle = createCaptionEarlyPlanningBundle(input)
check(bundle.lifecycleState === 'reserved', 'Complete safe-region evidence should produce reserved intent.')
check(
  new Set(bundle.strategyPlan.selectedIntegrationClasses).size === 4,
  'The early strategy must exercise all four canonical integration classes.',
)
check(
  bundle.opportunityMap.opportunities.map((item) => item.integrationClass).join(',')
    === 'late_overlay,reserved_composition,structural_typography,cross_system_transform',
  'Automatic classification must remain deterministic and scene ordered.',
)
check(
  bundle.integrationClassification.sceneClassifications.at(-1)?.deliberateNonUse === true,
  'A scene without captionable speech must record deliberate local non-use.',
)
check(
  bundle.reservationPlan.reservations[0].selectedRegionId === 'region.late.high'
    && bundle.reservationPlan.reservations[0].fallbackRegionIds[0] === 'region.late.fallback',
  'Reservation must select exact ranked visual evidence and retain fallbacks.',
)
check(
  bundle.reservationPlan.intentOnly
    && !bundle.reservationPlan.createsLayoutAuthority
    && !bundle.reservationPlan.finalPlacementResolved,
  'Early reservation must never claim final layout.',
)
check(
  bundle.blockingMetadata.approximateOnly
    && !bundle.blockingMetadata.renderable
    && !bundle.blockingMetadata.finalCaptionTextIncluded
    && !bundle.blockingMetadata.executableFramesIncluded,
  'Blocking metadata must remain visibly non-final and non-renderable.',
)
check(
  bundle.approvalEnvelope.canonicalEstimateApprovalStillRequired
    && bundle.approvalEnvelope.canonicalPlanApprovalStillRequired
    && !bundle.approvalEnvelope.creditReservationCreated,
  'Caption approval envelope cannot replace canonical plan/estimate approval.',
)
check(
  bundle.estimateInput.factors.some((item) => item.factorCode === 'mask_tracking')
    && bundle.estimateInput.factors.some((item) => item.factorCode === 'hero_typography')
    && bundle.estimateInput.factors.some((item) => item.factorCode === 'cross_system_handoffs')
    && !bundle.estimateInput.priceCalculated
    && !bundle.estimateInput.creditsReserved,
  'Caption may contribute exact estimate factors but no price or reservation.',
)
check(
  bundle.supportRequirementCodes.includes('track_all.mask_track_candidate_required')
    && bundle.supportRequirementCodes.includes('support.living_frame.handoff_required'),
  'Tracking and Living Frame needs must remain typed support requirements.',
)
check(
  Object.values(bundle.authorityBoundary).every((claim) => claim === false),
  'Every canonical execution authority must remain closed.',
)

const legacyClasses: CaptionIntegrationClass[] = [
  'clean_phrase', 'active_word', 'semantic_kinetic', 'spatial_composite',
  'subject_occluded', 'object_anchored', 'environmental', 'persistent_topic',
  'hero', 'caption_to_visual',
]
check(
  legacyClasses.map(adaptLegacyCaptionIntegrationClass).join(',')
    === [
      'late_overlay', 'late_overlay', 'late_overlay',
      'reserved_composition', 'reserved_composition', 'reserved_composition',
      'reserved_composition', 'reserved_composition',
      'structural_typography', 'cross_system_transform',
    ].join(','),
  'Every CAP-03 treatment label must have an explicit four-class v2 adapter.',
)

const restraintInput = structuredClone(input)
restraintInput.bundleId = 'caption.early.plan.restraint'
restraintInput.directive = {
  disposition: 'no_captions',
  reasonCodes: ['owner_selected_no_captions'],
  ownerApprovedRestraintRef: ref('owner.no.captions.restraint'),
}
const restraint = createCaptionEarlyPlanningBundle(restraintInput)
check(
  restraint.lifecycleState === 'restrained_no_captions'
    && restraint.restraint.restraint === 'no_captions'
    && !restraint.restraint.captionWorkAllowed,
  'no_captions must produce an exact owner-bound restraint state.',
)
check(
  restraint.opportunityMap.opportunities.length === 0
    && restraint.reservationPlan.reservations.length === 0
    && restraint.estimateInput.factors.length === 0,
  'no_captions must create no hidden Caption work or estimate factors.',
)

const missingSafeInput = structuredClone(input)
missingSafeInput.bundleId = 'caption.early.plan.missing.safe.region'
missingSafeInput.scenes[0].candidateSafeRegions = []
const missingSafe = createCaptionEarlyPlanningBundle(missingSafeInput)
check(
  missingSafe.lifecycleState === 'blocked_needs_visual_support'
    && missingSafe.supportRequirementCodes.includes('visual_intelligence.safe_region_required'),
  'Missing safe-region evidence must block only the affected planning readiness.',
)

const missingRestraintRef = structuredClone(restraintInput)
missingRestraintRef.directive.ownerApprovedRestraintRef = null
expectThrow(() => createCaptionEarlyPlanningBundle(missingRestraintRef))
const conflictingRestraint = structuredClone(input)
conflictingRestraint.directive.ownerApprovedRestraintRef = ref('conflicting.restraint')
expectThrow(() => createCaptionEarlyPlanningBundle(conflictingRestraint))
const wrongRatio = structuredClone(input)
wrongRatio.confirmedOutputFrame.aspectRatioNumerator = 16
wrongRatio.confirmedOutputFrame.aspectRatioDenominator = 9
expectThrow(() => createCaptionEarlyPlanningBundle(wrongRatio))
const wrongOutput = structuredClone(input)
wrongOutput.confirmedOutputFrame.outputId = 'output.other'
expectThrow(() => createCaptionEarlyPlanningBundle(wrongOutput))
const preapproved = structuredClone(input)
preapproved.canonicalScope.approvedSnapshotRef = ref('snapshot.invalid.early')
expectThrow(() => createCaptionEarlyPlanningBundle(preapproved))
const crossSystemForbidden = structuredClone(input)
crossSystemForbidden.constraints.captionToVisualAllowed = false
expectThrow(() => createCaptionEarlyPlanningBundle(crossSystemForbidden))
const crossSystemTargetMissing = structuredClone(input)
crossSystemTargetMissing.scenes[0].requestedTreatment = 'cross_system_transform'
expectThrow(() => createCaptionEarlyPlanningBundle(crossSystemTargetMissing))
const sceneOutsideScope = structuredClone(input)
sceneOutsideScope.scenes[0].planningFrameRange = { startFrame: 500, endFrameExclusive: 600 }
expectThrow(() => createCaptionEarlyPlanningBundle(sceneOutsideScope))
const speechWithoutPhrase = structuredClone(input)
speechWithoutPhrase.scenes[0].sourcePhraseIds = []
expectThrow(() => createCaptionEarlyPlanningBundle(speechWithoutPhrase))
const duplicateScene = structuredClone(input)
duplicateScene.scenes[1].sceneId = duplicateScene.scenes[0].sceneId
expectThrow(() => createCaptionEarlyPlanningBundle(duplicateScene))
const duplicateRegion = structuredClone(input)
duplicateRegion.scenes[0].candidateSafeRegions[1].regionId =
  duplicateRegion.scenes[0].candidateSafeRegions[0].regionId
expectThrow(() => createCaptionEarlyPlanningBundle(duplicateRegion))
const tooManyHeroes = structuredClone(input)
tooManyHeroes.scenes[0].requestedTreatment = 'structural_typography'
tooManyHeroes.scenes[1].requestedTreatment = 'structural_typography'
expectThrow(() => createCaptionEarlyPlanningBundle(tooManyHeroes))
const staleComposite = structuredClone(input)
staleComposite.captionCompositeRef.contentHash = digest('stale.composite')
expectThrow(() => createCaptionEarlyPlanningBundle(staleComposite))

const unknownNested = structuredClone(bundle) as unknown as {
  strategyPlan: Record<string, unknown>
  bundleDigestSha256: string
} & Record<string, unknown>
unknownNested.strategyPlan.rawChat = 'not allowed'
unknownNested.bundleDigestSha256 = calculateSkillContractDigest(
  unknownNested,
  'bundleDigestSha256',
)
expectThrow(() => parseCaptionEarlyPlanningBundle(unknownNested))

const authorityOverclaim = structuredClone(bundle)
authorityOverclaim.authorityBoundary.workCreationGranted = true as never
authorityOverclaim.bundleDigestSha256 = calculateSkillContractDigest(
  authorityOverclaim as unknown as Record<string, unknown>,
  'bundleDigestSha256',
)
expectThrow(() => parseCaptionEarlyPlanningBundle(authorityOverclaim))

const staleComponent = structuredClone(bundle)
staleComponent.strategyPlan.reasonCodes = ['tampered']
staleComponent.bundleDigestSha256 = calculateSkillContractDigest(
  staleComponent as unknown as Record<string, unknown>,
  'bundleDigestSha256',
)
expectThrow(() => parseCaptionEarlyPlanningBundle(staleComponent))

const rereadRatioOverclaim = structuredClone(bundle)
rereadRatioOverclaim.confirmedOutputFrame.aspectRatioNumerator = 16
rereadRatioOverclaim.confirmedOutputFrame.aspectRatioDenominator = 9
rereadRatioOverclaim.bundleDigestSha256 = calculateSkillContractDigest(
  rereadRatioOverclaim as unknown as Record<string, unknown>,
  'bundleDigestSha256',
)
expectThrow(() => parseCaptionEarlyPlanningBundle(rereadRatioOverclaim))

const duplicateClass = structuredClone(bundle)
duplicateClass.strategyPlan.selectedIntegrationClasses.push('late_overlay')
duplicateClass.strategyPlan.componentDigestSha256 = calculateSkillContractDigest(
  duplicateClass.strategyPlan as unknown as Record<string, unknown>,
  'componentDigestSha256',
)
duplicateClass.bundleDigestSha256 = calculateSkillContractDigest(
  duplicateClass as unknown as Record<string, unknown>,
  'bundleDigestSha256',
)
expectThrow(() => parseCaptionEarlyPlanningBundle(duplicateClass))

const reservationOverclaim = structuredClone(bundle)
reservationOverclaim.reservationPlan.reservations[0].disposition =
  'blocked_missing_safe_region'
reservationOverclaim.reservationPlan.componentDigestSha256 = calculateSkillContractDigest(
  reservationOverclaim.reservationPlan as unknown as Record<string, unknown>,
  'componentDigestSha256',
)
reservationOverclaim.bundleDigestSha256 = calculateSkillContractDigest(
  reservationOverclaim as unknown as Record<string, unknown>,
  'bundleDigestSha256',
)
expectThrow(() => parseCaptionEarlyPlanningBundle(reservationOverclaim))

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  milestone: 'CAP-06',
  assertions,
  integrationClassCount: bundle.strategyPlan.selectedIntegrationClasses.length,
  opportunityCount: bundle.opportunityMap.opportunities.length,
  reservationCount: bundle.reservationPlan.reservations.length,
  estimateFactorCount: bundle.estimateInput.factors.length,
  restraintVerified: true,
  blockingMetadataRenderable: false,
  priceCalculated: false,
  creditsReserved: false,
  runtimeStarted: false,
  canonicalAuthorityPromoted: false,
}, null, 2)}\n`)
