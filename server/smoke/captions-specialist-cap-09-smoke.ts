import { createHash } from 'node:crypto'
import {
  createCaptionTrackAllAdmission,
  createCaptionTrackAllEvidencePacketForContractFixture,
  createCaptionTrackAllSupport,
  parseCaptionTrackAllAdmission,
  parseCaptionTrackAllEvidencePacket,
  parseCaptionTrackAllSupportPayload,
} from '../captions-specialist/caption-track-all-support'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionTrackAllSubjectEvidence,
} from '../../src/types/caption-track-all-support'

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
  check(threw, 'Expected CAP-09 validation to fail closed.')
}

function hash(seed: string): string {
  return createHash('sha256').update(seed, 'utf8').digest('hex')
}

function ref(id: string, version = 'fixture-v1'): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}

const sceneRange = { startFrame: 300, endFrameExclusive: 450 }
const scope: CaptionDomainCanonicalScope = {
  ownerUserId: 'user.cap09',
  workspaceId: 'workspace.cap09',
  projectId: 'project.cap09',
  editSessionId: 'edit.cap09',
  planVersionId: 'plan.cap09.v1',
  approvedSnapshotRef: ref('snapshot.cap09'),
  outputId: 'output.vertical',
  sceneId: 'scene.text.behind.subject',
  authorizedFrameRanges: [sceneRange],
}
const sourceFrameMappingRef = ref('source.mapping.cap09')
const frameDigest = hash('output.vertical.frame')
const subjectRequest = {
  subjectRequestId: 'subject.request.primary.speaker',
  subjectRole: 'primary_speaker' as const,
  visualObservationRefs: [ref('visual.observation.primary.speaker')],
  sourcePhraseRefs: [ref('phrase.behind.subject')],
  maskRequired: true,
  trackRequired: true as const,
  anchorRequired: false,
  preserveHairAndFineEdges: true,
  preserveContactObjects: false,
}

const support = createCaptionTrackAllSupport({
  payloadId: 'caption.track.all.payload.subject.occlusion',
  requestId: 'caption.track.all.support.subject.occlusion',
  idempotencyKey: 'caption.track.all.subject.occlusion.idempotency',
  originalCallRef: ref('call.cap09.subject.occlusion', 'orchestra-skill-call-v1'),
  purpose: 'subject_occlusion',
  canonicalScope: scope,
  pictureLockRef: ref('picture.lock.cap09', 'canonical-picture-lock-manifest-v1'),
  finishReadinessRef: ref('caption.finish.cap09', 'caption-finish-readiness-v2'),
  visualOccupancyManifestRef: ref(
    'caption.visual.occupancy.cap09', 'caption-visual-occupancy-manifest-v1',
  ),
  confirmedOutputFrameDigestSha256: frameDigest,
  sourcePrivateArtifactRef: ref('private.source.proxy.cap09'),
  sourceFrameMappingRef,
  subjectRequests: [subjectRequest],
  korniaRefinementAllowed: true,
})

check(
  support.supportRequest.targetSkillKey === 'track_all'
    && support.supportRequest.requestedArtifactTypes.join('|')
      === 'track_all_mask_binding'
    && support.supportRequest.mediationPolicy.hqMediated
    && !support.supportRequest.mediationPolicy.directPeerDispatchAllowed,
  'Caption must request mask evidence through Track All and the neutral support envelope.',
)
check(
  support.payload.depthIntent === 'behind_subject'
    && support.payload.expectedArtifactTypes.join('|')
      === 'mask_sequence|track_manifest',
  'Subject occlusion requires an exact mask and track without inventing an anchor.',
)
check(
  !support.payload.samRuntimeSelectedOrDispatchedByCaption
    && support.payload.trackAllRemainsArtifactOwner,
  'Caption cannot select or dispatch the SAM runtime.',
)
check(
  support.payload.fallbackLadder.join('|')
    === 'retry_track_all_same_approved_input|opencv_kornia_refine|safe_top_plane|stable_libass|user_review',
  'CAP-09 fallback order must be deterministic and meaning-preserving.',
)

const subjectEvidence: CaptionTrackAllSubjectEvidence = {
  subjectRequestId: subjectRequest.subjectRequestId,
  subjectEvidenceId: 'subject.evidence.primary.speaker',
  subjectRole: 'primary_speaker',
  frameRange: sceneRange,
  maskSequenceRef: ref('mask.sequence.primary.speaker'),
  trackManifestRef: ref('track.manifest.primary.speaker'),
  anchorManifestRef: null,
  sourceFrameMappingRef,
  outputFrameDigestSha256: frameDigest,
  temporalQa: {
    measuredFrameCount: 150,
    expectedFrameCount: 150,
    emptyMaskFrameCount: 0,
    fullFrameMaskCount: 0,
    minimumBinaryIntersectionOverUnionBasisPoints: 8_400,
    maximumNormalizedCentroidShiftBasisPoints: 420,
    maximumBoundaryDisagreementBasisPoints: 700,
    maximumAlphaFlickerBasisPoints: 500,
    minimumEdgeQualityBasisPoints: 9_000,
    minimumSubjectCoverageBasisPoints: 9_800,
    identitySwapCount: 0,
    lostAnchorFrameCount: 0,
    completeRequestedRangeCoverage: true,
  },
  refinementEvidence: [{
    refinementId: 'refinement.opencv.mask.qa',
    tool: 'opencv',
    operation: 'temporal_median_check',
    inputArtifactRef: ref('mask.sequence.primary.speaker.raw'),
    outputArtifactRef: ref('mask.sequence.primary.speaker'),
    executionEvidenceRef: ref('opencv.mask.qa.evidence'),
    actualExecutionObserved: false,
  }, {
    refinementId: 'refinement.kornia.edge.measurement',
    tool: 'kornia',
    operation: 'edge_feather_measurement',
    inputArtifactRef: ref('mask.sequence.primary.speaker'),
    outputArtifactRef: ref('mask.sequence.primary.speaker.refined'),
    executionEvidenceRef: ref('kornia.edge.evidence'),
    actualExecutionObserved: false,
  }],
  evidenceRefs: [ref('temporal.mask.measurement'), ref('mask.edge.measurement')],
}

const packet = createCaptionTrackAllEvidencePacketForContractFixture({
  packetId: 'caption.track.all.packet.subject.occlusion',
  payload: support.payload,
  supportRequest: support.supportRequest,
  trackAllResultRef: ref('track.all.result.subject.occlusion'),
  subjectEvidence: [subjectEvidence],
})
check(
  packet.selectedSegmentationRoute === 'sam3_1'
    && packet.canonicalSam31OperationId
      === 'tool.sam3_1.segment_and_track_subject.v1',
  'New Caption mask work must identify only the canonical SAM 3.1 route behind Track All.',
)
check(
  packet.evidenceMode === 'contract_fixture'
    && !packet.actualSam31GpuExecutionObserved
    && !packet.actualOpenCvExecutionObserved
    && !packet.actualKorniaExecutionObserved,
  'Contract fixtures cannot masquerade as SAM, OpenCV, or Kornia execution.',
)

const admission = createCaptionTrackAllAdmission({
  admissionId: 'caption.track.all.admission.subject.occlusion',
  packet,
  payload: support.payload,
  supportRequest: support.supportRequest,
})
check(
  admission.subjectAdmissions[0]?.qaPassed
    && admission.subjectAdmissions[0]?.blockerCodes.length === 0,
  'The deterministic temporal metrics must pass their exact requested thresholds.',
)
check(
  admission.disposition === 'blocked_private_runtime_evidence'
    && !admission.textBehindSubjectAllowed
    && admission.selectedFallback === 'safe_top_plane',
  'A structurally good fixture must still fall back safely without authenticated runtime evidence.',
)
check(
  admission.trackAllRemainsArtifactOwner
    && admission.sam31RemainsCanonicalRuntimeOwner
    && !admission.captionExecutedSam31
    && !admission.captionCreatedMaskAsset,
  'Track All and canonical SAM 3.1 ownership must remain external to Caption.',
)

const cachedPacket = createCaptionTrackAllEvidencePacketForContractFixture({
  packetId: 'caption.track.all.packet.subject.occlusion.cached',
  payload: support.payload,
  supportRequest: support.supportRequest,
  trackAllResultRef: ref('track.all.result.subject.occlusion.cached'),
  subjectEvidence: [subjectEvidence],
  cacheDisposition: 'exact_cache_reuse',
  originalResultRef: ref('track.all.result.subject.occlusion.original'),
})
const cachedAdmission = createCaptionTrackAllAdmission({
  admissionId: 'caption.track.all.admission.subject.occlusion.cached',
  packet: cachedPacket,
  payload: support.payload,
  supportRequest: support.supportRequest,
})
check(
  cachedPacket.cache.disposition === 'exact_cache_reuse'
    && cachedPacket.cache.originalResultRef !== null
    && !cachedAdmission.cacheReuseAccepted,
  'Exact cache lineage is representable but cannot be admitted from a contract fixture.',
)

const anchorSupport = createCaptionTrackAllSupport({
  payloadId: 'caption.track.all.payload.object.anchor',
  requestId: 'caption.track.all.support.object.anchor',
  idempotencyKey: 'caption.track.all.object.anchor.idempotency',
  originalCallRef: ref('call.cap09.object.anchor', 'orchestra-skill-call-v1'),
  purpose: 'object_anchor',
  canonicalScope: { ...scope, sceneId: 'scene.object.anchor' },
  pictureLockRef: support.payload.pictureLockRef,
  finishReadinessRef: support.payload.finishReadinessRef,
  visualOccupancyManifestRef: support.payload.visualOccupancyManifestRef,
  confirmedOutputFrameDigestSha256: frameDigest,
  sourcePrivateArtifactRef: support.payload.sourcePrivateArtifactRef,
  sourceFrameMappingRef,
  subjectRequests: [{
    ...subjectRequest,
    subjectRequestId: 'subject.request.product',
    subjectRole: 'product',
    maskRequired: false,
    anchorRequired: true,
    preserveHairAndFineEdges: false,
  }],
  korniaRefinementAllowed: false,
})
check(
  anchorSupport.payload.depthIntent === 'object_attached'
    && anchorSupport.payload.expectedArtifactTypes.join('|')
      === 'track_manifest|anchor_manifest',
  'Object anchoring must require track and anchor artifacts without forcing a mask.',
)
check(
  anchorSupport.payload.cachePolicy.cacheIdentityDigestSha256
    !== support.payload.cachePolicy.cacheIdentityDigestSha256,
  'Cache identity must change with scene, purpose, subject, or artifact requirements.',
)

const weakEvidence = structuredClone(subjectEvidence)
weakEvidence.temporalQa.minimumBinaryIntersectionOverUnionBasisPoints = 5_000
weakEvidence.temporalQa.maximumAlphaFlickerBasisPoints = 2_000
const weakPacket = createCaptionTrackAllEvidencePacketForContractFixture({
  packetId: 'caption.track.all.packet.weak.temporal.qa',
  payload: support.payload,
  supportRequest: support.supportRequest,
  trackAllResultRef: ref('track.all.result.weak.temporal.qa'),
  subjectEvidence: [weakEvidence],
})
const weakAdmission = createCaptionTrackAllAdmission({
  admissionId: 'caption.track.all.admission.weak.temporal.qa',
  packet: weakPacket,
  payload: support.payload,
  supportRequest: support.supportRequest,
})
check(
  !weakAdmission.subjectAdmissions[0]?.qaPassed
    && weakAdmission.subjectAdmissions[0]?.blockerCodes.includes(
      'caption_track_all.mask_overlap_low',
    )
    && weakAdmission.subjectAdmissions[0]?.blockerCodes.includes(
      'caption_track_all.alpha_flicker_high',
    ),
  'Weak overlap or flicker must remain explicit even while the runtime gate is closed.',
)

const wrongDepth = structuredClone(support.payload)
wrongDepth.depthIntent = 'in_front_of_subject'
wrongDepth.payloadDigestSha256 = calculateSkillContractDigest(
  wrongDepth as unknown as Record<string, unknown>, 'payloadDigestSha256',
)
expectThrow(() => parseCaptionTrackAllSupportPayload(wrongDepth))

const missingPhraseLineage = structuredClone(support.payload)
missingPhraseLineage.subjectRequests[0]!.sourcePhraseRefs = []
expectThrow(() => parseCaptionTrackAllSupportPayload(missingPhraseLineage))

const staleCache = structuredClone(packet)
staleCache.cache.cacheIdentityDigestSha256 = hash('stale.cache')
staleCache.packetDigestSha256 = calculateSkillContractDigest(
  staleCache as unknown as Record<string, unknown>, 'packetDigestSha256',
)
expectThrow(() => parseCaptionTrackAllEvidencePacket(staleCache, {
  payload: support.payload, supportRequest: support.supportRequest,
}))

const invalidCacheReuse = structuredClone(cachedPacket)
invalidCacheReuse.cache.originalResultRef = null
invalidCacheReuse.packetDigestSha256 = calculateSkillContractDigest(
  invalidCacheReuse as unknown as Record<string, unknown>, 'packetDigestSha256',
)
expectThrow(() => parseCaptionTrackAllEvidencePacket(invalidCacheReuse, {
  payload: support.payload, supportRequest: support.supportRequest,
}))

const historicalSamRoute = structuredClone(packet) as unknown as Record<string, unknown>
historicalSamRoute.selectedSegmentationRoute = 'sam2'
historicalSamRoute.packetDigestSha256 = calculateSkillContractDigest(
  historicalSamRoute, 'packetDigestSha256',
)
expectThrow(() => parseCaptionTrackAllEvidencePacket(historicalSamRoute, {
  payload: support.payload, supportRequest: support.supportRequest,
}))

const fixtureExecutionOverclaim = structuredClone(packet)
fixtureExecutionOverclaim.actualSam31GpuExecutionObserved = true
fixtureExecutionOverclaim.packetDigestSha256 = calculateSkillContractDigest(
  fixtureExecutionOverclaim as unknown as Record<string, unknown>,
  'packetDigestSha256',
)
expectThrow(() => parseCaptionTrackAllEvidencePacket(fixtureExecutionOverclaim, {
  payload: support.payload, supportRequest: support.supportRequest,
}))

const missingMask = structuredClone(packet)
missingMask.subjectEvidence[0]!.maskSequenceRef = null
missingMask.packetDigestSha256 = calculateSkillContractDigest(
  missingMask as unknown as Record<string, unknown>, 'packetDigestSha256',
)
expectThrow(() => parseCaptionTrackAllEvidencePacket(missingMask, {
  payload: support.payload, supportRequest: support.supportRequest,
}))

const forbiddenKornia = structuredClone(packet)
expectThrow(() => parseCaptionTrackAllEvidencePacket(forbiddenKornia, {
  payload: { ...anchorSupport.payload },
  supportRequest: anchorSupport.supportRequest,
}))

const unknownNested = structuredClone(packet) as unknown as {
  subjectEvidence: Array<Record<string, unknown>>
  packetDigestSha256: string
}
unknownNested.subjectEvidence[0]!.maskPath = '/private/mask.png'
unknownNested.packetDigestSha256 = calculateSkillContractDigest(
  unknownNested as unknown as Record<string, unknown>, 'packetDigestSha256',
)
expectThrow(() => parseCaptionTrackAllEvidencePacket(unknownNested, {
  payload: support.payload, supportRequest: support.supportRequest,
}))

const admissionOverclaim = structuredClone(admission)
admissionOverclaim.disposition = 'admitted_for_caption_scene_graph'
admissionOverclaim.textBehindSubjectAllowed = true
admissionOverclaim.selectedFallback = 'none'
admissionOverclaim.admissionDigestSha256 = calculateSkillContractDigest(
  admissionOverclaim as unknown as Record<string, unknown>,
  'admissionDigestSha256',
)
expectThrow(() => parseCaptionTrackAllAdmission(admissionOverclaim, {
  packet, payload: support.payload, supportRequest: support.supportRequest,
}))

const tamperedAdmission = structuredClone(admission)
tamperedAdmission.requestedSceneId = 'scene.other'
expectThrow(() => parseCaptionTrackAllAdmission(tamperedAdmission, {
  packet, payload: support.payload, supportRequest: support.supportRequest,
}))

check(
  !admission.captionGrantedFinalQa
    && !admission.finalCanvasAuthorityClaimed
    && !admission.productionAuthorityClaimed,
  'CAP-09 cannot promote final QA, Remotion canvas, or production authority.',
)

process.stdout.write(`${JSON.stringify({
  status: 'passed_with_explicit_private_track_all_runtime_gate',
  milestone: 'CAP-09',
  assertions,
  supportTarget: support.supportRequest.targetSkillKey,
  canonicalSegmentationRoute: packet.selectedSegmentationRoute,
  subjectEvidenceCount: packet.subjectEvidence.length,
  temporalQaPassedInContractFixture: admission.subjectAdmissions[0]?.qaPassed,
  textBehindSubjectAdmitted: admission.textBehindSubjectAllowed,
  safeFallbackSelected: admission.selectedFallback,
  cacheIdentityBound: true,
  actualSam31GpuExecutionObserved: false,
  actualOpenCvExecutionObserved: false,
  actualKorniaExecutionObserved: false,
  realTextBehindSubjectFixtureExecuted: false,
  captionExecutedSam31: false,
  productionAuthorityPromoted: false,
}, null, 2)}\n`)
