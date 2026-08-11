import { createHash } from 'node:crypto'
import {
  createCaptionFinalVisualHierarchy,
  createCaptionVisualEvidencePacketForContractFixture,
  createCaptionVisualIntelligenceSupport,
  createCaptionVisualOccupancyManifest,
  parseCaptionFinalVisualHierarchy,
  parseCaptionVisualIntelligenceEvidencePacket,
  parseCaptionVisualIntelligenceSupportPayload,
  parseCaptionVisualOccupancyManifest,
} from '../captions-specialist/caption-visual-intelligence-support'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionVisualEvidenceObservation,
} from '../../src/types/caption-visual-intelligence-support'

let assertions = 0

function check(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
  assertions += 1
}

function expectThrow(operation: () => unknown): void {
  let threw = false
  try {
    operation()
  } catch {
    threw = true
  }
  check(threw, 'Expected CAP-08 validation to fail closed.')
}

function hash(seed: string): string {
  return createHash('sha256').update(seed, 'utf8').digest('hex')
}

function ref(id: string, version = 'fixture-v1'): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}

function visualRef(id: string) {
  return { id, version: 1, contentHash: `sha256:${hash(id)}` }
}

const sceneRange = { startFrame: 90, endFrameExclusive: 240 }
const scope: CaptionDomainCanonicalScope = {
  ownerUserId: 'user.cap08',
  workspaceId: 'workspace.cap08',
  projectId: 'project.cap08',
  editSessionId: 'edit.cap08',
  planVersionId: 'plan.cap08.v1',
  approvedSnapshotRef: ref('snapshot.cap08'),
  outputId: 'output.vertical',
  sceneId: 'scene.cap08',
  authorizedFrameRanges: [sceneRange],
}
const originalCallRef = ref('call.cap08.occupancy', 'orchestra-skill-call-v1')
const confirmedOutputFrame = {
  outputId: 'output.vertical',
  width: 1080,
  height: 1920,
  aspectRatioNumerator: 9,
  aspectRatioDenominator: 16,
  fpsNumerator: 30,
  fpsDenominator: 1,
  confirmedOutputFrameDigestSha256: hash('output.vertical.frame'),
}
const requiredRoles = [
  'safe_candidate', 'face', 'screen_text', 'broll_panel', 'living_frame',
] as const

const occupancySupport = createCaptionVisualIntelligenceSupport({
  payloadId: 'caption.visual.payload.occupancy',
  requestId: 'caption.visual.support.occupancy',
  idempotencyKey: 'caption.visual.occupancy.idempotency',
  originalCallRef,
  purpose: 'final_frame_occupancy',
  canonicalScope: scope,
  pictureLockRef: ref('picture.lock.cap08', 'canonical-picture-lock-manifest-v1'),
  finishReadinessRef: ref('caption.finish.cap08', 'caption-finish-readiness-v2'),
  confirmedOutputFrame,
  sourcePrivateArtifactRef: ref('near.final.visual.proxy'),
  canonicalLayoutOccupancyRef: ref('canonical.layout.occupancy'),
  requiredObservationRoles: [...requiredRoles],
  expectedOutcomeRefs: [ref('outcome.caption.safe'), ref('outcome.visual.hierarchy')],
})

check(
  occupancySupport.supportRequest.targetSkillKey === 'visual_intelligence'
    && occupancySupport.supportRequest.mediationPolicy.hqMediated
    && !occupancySupport.supportRequest.mediationPolicy.directPeerDispatchAllowed,
  'Caption visual evidence must use the neutral HQ-mediated support envelope.',
)
check(
  occupancySupport.payload.expectedVisualIntelligenceOperation === 'inspect_edit'
    && occupancySupport.payload.expectedVisualIntelligenceProfile === 'caption_layout_qa',
  'CAP-08 must target the existing public Visual Intelligence inspection contract.',
)
check(
  !occupancySupport.payload.providerOrModelSelectedByCaption
    && !occupancySupport.payload.providerPromptIncluded
    && !occupancySupport.payload.mediaLocatorIncluded,
  'Caption must not create a provider, prompt, or media-locator owner.',
)

function observation(
  observationId: string,
  role: CaptionVisualEvidenceObservation['role'],
  regionBasisPoints: CaptionVisualEvidenceObservation['regionBasisPoints'],
  metrics: Partial<Pick<CaptionVisualEvidenceObservation,
    | 'confidenceBasisPoints'
    | 'temporalStabilityBasisPoints'
    | 'measuredContrastRatioMilli'
    | 'clutterBasisPoints'
    | 'cropResilienceBasisPoints'
    | 'compositionBalanceBasisPoints'>> = {},
): CaptionVisualEvidenceObservation {
  return {
    observationId,
    sceneId: 'scene.cap08',
    frameRange: sceneRange,
    role,
    regionBasisPoints,
    confidenceBasisPoints: metrics.confidenceBasisPoints ?? 9_000,
    temporalStabilityBasisPoints: metrics.temporalStabilityBasisPoints ?? 9_000,
    measuredContrastRatioMilli: metrics.measuredContrastRatioMilli ?? 5_600,
    clutterBasisPoints: metrics.clutterBasisPoints ?? 1_500,
    cropResilienceBasisPoints: metrics.cropResilienceBasisPoints ?? 8_500,
    compositionBalanceBasisPoints: metrics.compositionBalanceBasisPoints ?? 8_000,
    findingIds: [],
    evidenceRefs: [visualRef(`evidence.${observationId}`)],
    uncertaintyCode: null,
  }
}

const observations: CaptionVisualEvidenceObservation[] = [
  observation('region.safe.primary', 'safe_candidate', {
    x: 3_200, y: 6_000, width: 3_500, height: 1_500,
  }),
  observation('region.safe.overlaps.face', 'safe_candidate', {
    x: 4_000, y: 2_000, width: 2_500, height: 2_000,
  }, { confidenceBasisPoints: 9_800 }),
  observation('region.face', 'face', {
    x: 3_500, y: 1_000, width: 3_000, height: 4_000,
  }),
  observation('region.screen.text', 'screen_text', {
    x: 100, y: 7_000, width: 3_000, height: 1_000,
  }),
  observation('region.broll', 'broll_panel', {
    x: 7_000, y: 0, width: 3_000, height: 10_000,
  }),
  observation('region.living.frame', 'living_frame', {
    x: 0, y: 0, width: 3_000, height: 7_000,
  }),
]

const occupancyPacket = createCaptionVisualEvidencePacketForContractFixture({
  packetId: 'caption.visual.packet.occupancy',
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
  visualIntelligenceReportRef: visualRef('visual.report.occupancy'),
  observations,
  findingIds: [],
})
check(
  occupancyPacket.evidenceMode === 'contract_fixture'
    && !occupancyPacket.actualVisualInferenceObserved
    && !occupancyPacket.canonicalReportRereadVerified,
  'Contract fixtures must never masquerade as authenticated visual runtime evidence.',
)

const occupancyManifest = createCaptionVisualOccupancyManifest({
  manifestId: 'caption.visual.occupancy.scene.cap08',
  packet: occupancyPacket,
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
})
check(
  occupancyManifest.provisionalSelectedCandidateRegionId === 'region.safe.primary'
    && occupancyManifest.safeCandidateRegionIds.length === 1,
  'Only a stable, readable, non-overlapping region may remain a safe candidate.',
)
check(
  occupancyManifest.regions.find((region) =>
    region.regionId === 'region.safe.overlaps.face')
    ?.overlapsProtectedRegionIds.includes('region.face')
    && !occupancyManifest.regions.find((region) =>
      region.regionId === 'region.safe.overlaps.face')?.selectableForStableCaption,
  'Face overlap must disqualify a nominally high-confidence candidate.',
)
check(
  occupancyManifest.protectedRegionIds.includes('region.screen.text')
    && occupancyManifest.protectedRegionIds.includes('region.broll')
    && occupancyManifest.protectedRegionIds.includes('region.living.frame'),
  'Screen text, B-roll, and Living Frame regions must remain protected.',
)
check(
  !occupancyManifest.evidenceQualifiedForPrivateRuntime
    && !occupancyManifest.lateFinalVisualHierarchyAllowed,
  'Source-only fixtures cannot open late final visual hierarchy.',
)

const hierarchy = createCaptionFinalVisualHierarchy({
  hierarchyId: 'caption.visual.hierarchy.scene.cap08',
  occupancyManifest,
})
check(
  hierarchy.qualificationState === 'blocked_visual_runtime_evidence'
    && hierarchy.accessibleCaptionRegionId === null
    && hierarchy.creativeCaptionRegionId === null,
  'A provisional region must stay blocked until authenticated private visual evidence exists.',
)
check(
  hierarchy.layerOrderBottomToTop.at(-1) === 'accessible_caption'
    && hierarchy.layerOrderBottomToTop.indexOf('creative_caption')
      > hierarchy.layerOrderBottomToTop.indexOf('living_frame')
    && hierarchy.captionAboveLivingFrameByDefault,
  'Accessible captions stay topmost and Caption remains above Living Frame by default.',
)
check(
  !hierarchy.nonTopPlaneCreativeCaptionAdmitted
    && hierarchy.trackAllEvidenceRequiredForNonTopPlane,
  'CAP-08 cannot admit behind-subject typography before Track All evidence.',
)

const renderedSupport = createCaptionVisualIntelligenceSupport({
  payloadId: 'caption.visual.payload.rendered.inspection',
  requestId: 'caption.visual.support.rendered.inspection',
  idempotencyKey: 'caption.visual.rendered.inspection.idempotency',
  originalCallRef: ref('call.cap08.rendered', 'orchestra-skill-call-v1'),
  purpose: 'rendered_caption_inspection',
  canonicalScope: scope,
  pictureLockRef: occupancySupport.payload.pictureLockRef,
  finishReadinessRef: occupancySupport.payload.finishReadinessRef,
  confirmedOutputFrame,
  sourcePrivateArtifactRef: ref('rendered.caption.preview'),
  canonicalLayoutOccupancyRef: ref('canonical.layout.occupancy'),
  requiredObservationRoles: ['safe_candidate', 'face'],
  expectedOutcomeRefs: [ref('outcome.rendered.caption.readability')],
})
check(
  renderedSupport.payload.renderedInspectionPolicy.actualRenderedPixelsRequired
    && renderedSupport.payload.renderedInspectionPolicy.directRasterInspectionStillRequired
    && renderedSupport.payload.renderedInspectionPolicy.deterministicQaStillRequired,
  'Rendered AI inspection must look at actual pixels without replacing direct or deterministic QA.',
)
const renderedPacket = createCaptionVisualEvidencePacketForContractFixture({
  packetId: 'caption.visual.packet.rendered.inspection',
  payload: renderedSupport.payload,
  supportRequest: renderedSupport.supportRequest,
  visualIntelligenceReportRef: visualRef('visual.report.rendered.inspection'),
  observations: observations.filter((item) =>
    item.role === 'safe_candidate' || item.role === 'face'),
  findingIds: [],
})
check(
  !renderedPacket.actualRenderedPixelsInspected
    && !renderedPacket.visualIntelligenceGrantedFinalQa
    && !renderedPacket.visualIntelligenceMutatedEdit,
  'CAP-08 fixture wiring cannot claim an actual rendered inspection, final QA, or edit mutation.',
)

expectThrow(() => createCaptionVisualIntelligenceSupport({
  payloadId: 'caption.visual.payload.no.scene',
  requestId: 'caption.visual.support.no.scene',
  idempotencyKey: 'caption.visual.no.scene.idempotency',
  originalCallRef,
  purpose: 'final_frame_occupancy',
  canonicalScope: { ...scope, sceneId: null },
  pictureLockRef: occupancySupport.payload.pictureLockRef,
  finishReadinessRef: occupancySupport.payload.finishReadinessRef,
  confirmedOutputFrame,
  sourcePrivateArtifactRef: ref('near.final.visual.proxy'),
  canonicalLayoutOccupancyRef: ref('canonical.layout.occupancy'),
  requiredObservationRoles: ['safe_candidate'],
  expectedOutcomeRefs: [ref('outcome.caption.safe')],
}))

const wrongRatioPayload = structuredClone(occupancySupport.payload)
wrongRatioPayload.confirmedOutputFrame.aspectRatioNumerator = 16
wrongRatioPayload.confirmedOutputFrame.aspectRatioDenominator = 9
wrongRatioPayload.payloadDigestSha256 = calculateSkillContractDigest(
  wrongRatioPayload as unknown as Record<string, unknown>,
  'payloadDigestSha256',
)
expectThrow(() => parseCaptionVisualIntelligenceSupportPayload(wrongRatioPayload))

const staleSupportPacket = structuredClone(occupancyPacket)
staleSupportPacket.supportRequestRef.contentHash = hash('stale.support')
staleSupportPacket.packetDigestSha256 = calculateSkillContractDigest(
  staleSupportPacket as unknown as Record<string, unknown>,
  'packetDigestSha256',
)
expectThrow(() => parseCaptionVisualIntelligenceEvidencePacket(staleSupportPacket, {
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
}))

const fixtureRuntimeOverclaim = structuredClone(occupancyPacket)
fixtureRuntimeOverclaim.actualVisualInferenceObserved = true
fixtureRuntimeOverclaim.packetDigestSha256 = calculateSkillContractDigest(
  fixtureRuntimeOverclaim as unknown as Record<string, unknown>,
  'packetDigestSha256',
)
expectThrow(() => parseCaptionVisualIntelligenceEvidencePacket(fixtureRuntimeOverclaim, {
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
}))

const incompleteCoverageOverclaim = structuredClone(occupancyPacket)
incompleteCoverageOverclaim.coverage.analyzedRanges = [{
  startFrame: 90, endFrameExclusive: 180,
}]
incompleteCoverageOverclaim.packetDigestSha256 = calculateSkillContractDigest(
  incompleteCoverageOverclaim as unknown as Record<string, unknown>,
  'packetDigestSha256',
)
expectThrow(() => parseCaptionVisualIntelligenceEvidencePacket(incompleteCoverageOverclaim, {
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
}))

const missingRequiredRole = structuredClone(occupancyPacket)
missingRequiredRole.observations = missingRequiredRole.observations.filter((item) =>
  item.role !== 'screen_text')
missingRequiredRole.packetDigestSha256 = calculateSkillContractDigest(
  missingRequiredRole as unknown as Record<string, unknown>,
  'packetDigestSha256',
)
expectThrow(() => parseCaptionVisualIntelligenceEvidencePacket(missingRequiredRole, {
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
}))

const duplicateObservation = structuredClone(occupancyPacket)
duplicateObservation.observations.push(structuredClone(duplicateObservation.observations[0]!))
duplicateObservation.packetDigestSha256 = calculateSkillContractDigest(
  duplicateObservation as unknown as Record<string, unknown>,
  'packetDigestSha256',
)
expectThrow(() => parseCaptionVisualIntelligenceEvidencePacket(duplicateObservation, {
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
}))

const unknownNested = structuredClone(occupancyPacket) as unknown as {
  observations: Array<Record<string, unknown>>
  packetDigestSha256: string
}
unknownNested.observations[0]!.providerPrompt = 'ignored'
unknownNested.packetDigestSha256 = calculateSkillContractDigest(
  unknownNested as unknown as Record<string, unknown>,
  'packetDigestSha256',
)
expectThrow(() => parseCaptionVisualIntelligenceEvidencePacket(unknownNested, {
  payload: occupancySupport.payload,
  supportRequest: occupancySupport.supportRequest,
}))

const occupancyOverclaim = structuredClone(occupancyManifest)
occupancyOverclaim.evidenceQualifiedForPrivateRuntime = true
occupancyOverclaim.lateFinalVisualHierarchyAllowed = true
occupancyOverclaim.blockerCodes = []
occupancyOverclaim.manifestDigestSha256 = calculateSkillContractDigest(
  occupancyOverclaim as unknown as Record<string, unknown>,
  'manifestDigestSha256',
)
expectThrow(() => parseCaptionVisualOccupancyManifest(occupancyOverclaim))

const protectedOverlapOverclaim = structuredClone(occupancyManifest)
const overlappedCandidate = protectedOverlapOverclaim.regions.find((region) =>
  region.regionId === 'region.safe.overlaps.face')!
overlappedCandidate.overlapsProtectedRegionIds = []
overlappedCandidate.selectableForStableCaption = true
protectedOverlapOverclaim.safeCandidateRegionIds = [
  'region.safe.overlaps.face', 'region.safe.primary',
]
protectedOverlapOverclaim.provisionalSelectedCandidateRegionId =
  'region.safe.overlaps.face'
protectedOverlapOverclaim.provisionalFallbackCandidateRegionIds = [
  'region.safe.primary',
]
protectedOverlapOverclaim.manifestDigestSha256 = calculateSkillContractDigest(
  protectedOverlapOverclaim as unknown as Record<string, unknown>,
  'manifestDigestSha256',
)
expectThrow(() => parseCaptionVisualOccupancyManifest(protectedOverlapOverclaim))

const hierarchyOverclaim = structuredClone(hierarchy)
hierarchyOverclaim.finalPlacementClaimed = true as false
hierarchyOverclaim.hierarchyDigestSha256 = calculateSkillContractDigest(
  hierarchyOverclaim as unknown as Record<string, unknown>,
  'hierarchyDigestSha256',
)
expectThrow(() => parseCaptionFinalVisualHierarchy(hierarchyOverclaim, occupancyManifest))

const tamperedHierarchy = structuredClone(hierarchy)
tamperedHierarchy.requestedSceneId = 'scene.tampered'
expectThrow(() => parseCaptionFinalVisualHierarchy(tamperedHierarchy, occupancyManifest))

const forgedHierarchyRegion = structuredClone(hierarchy)
forgedHierarchyRegion.qualificationState = 'ready'
forgedHierarchyRegion.accessibleCaptionRegionId = 'region.safe.primary'
forgedHierarchyRegion.creativeCaptionRegionId = 'region.safe.primary'
forgedHierarchyRegion.hierarchyDigestSha256 = calculateSkillContractDigest(
  forgedHierarchyRegion as unknown as Record<string, unknown>,
  'hierarchyDigestSha256',
)
expectThrow(() => parseCaptionFinalVisualHierarchy(
  forgedHierarchyRegion, occupancyManifest,
))

check(
  !occupancyManifest.captionLayoutAuthorityClaimed
    && !occupancyManifest.maskOrTrackingAuthorityClaimed
    && !occupancyManifest.finalQaApprovalClaimed
    && !occupancyManifest.finalRenderAuthorityClaimed,
  'CAP-08 must keep layout, Track All, final QA, and render authorities closed.',
)

process.stdout.write(`${JSON.stringify({
  status: 'passed_with_explicit_private_visual_runtime_gate',
  milestone: 'CAP-08',
  assertions,
  supportTarget: occupancySupport.supportRequest.targetSkillKey,
  observationRoleCount: requiredRoles.length,
  occupancyRegionCount: occupancyManifest.regions.length,
  protectedRegionCount: occupancyManifest.protectedRegionIds.length,
  selectableCandidateCount: occupancyManifest.safeCandidateRegionIds.length,
  hierarchyQualificationState: hierarchy.qualificationState,
  renderedInspectionContractReady: true,
  actualVisualInferenceExecuted: false,
  actualRenderedPixelsInspected: false,
  directCaptionQwenOwnerCreated: false,
  providerCallMadeByCaption: false,
  productionAuthorityPromoted: false,
}, null, 2)}\n`)
