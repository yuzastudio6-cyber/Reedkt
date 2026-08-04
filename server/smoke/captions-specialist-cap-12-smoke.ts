import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import {
  createCaptionEffectiveReadReport,
  createCaptionMotionLock,
  createCaptionMotionPlan,
  createCaptionStoryTimingRegistration,
  parseCaptionCameraRequest,
  parseCaptionCrossSystemHandoff,
  parseCaptionEffectiveReadReport,
  parseCaptionMotionPlan,
  parseCaptionStoryTimingResolution,
  type CaptionMotionPrimitiveProposal,
} from '../captions-specialist/caption-storytiming-motion'
import {
  parseCaptionLivingFrameRequestV2,
  parseLivingFrameCaptionResponseV2,
} from '../captions-specialist/caption-living-frame-boundary'
import {
  CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
  LIVING_FRAME_CAPTION_RESPONSE_V2_VERSION,
  type CaptionLivingFrameRequestV2,
  type LivingFrameCaptionResponseV2,
} from '../../src/types/caption-living-frame-boundary'
import {
  CAPTION_CAMERA_REQUEST_VERSION,
  CAPTION_CROSS_SYSTEM_HANDOFF_VERSION,
  CAPTION_STORYTIMING_RESOLUTION_VERSION,
  type CaptionCameraRequest,
  type CaptionCrossSystemHandoff,
  type CaptionStoryTimingResolutionBinding,
} from '../../src/types/caption-storytiming-motion'
import {
  SKILL_SUPPORT_REQUEST_VERSION,
  type SkillCanonicalScope,
  type SkillSupportRequest,
  type SkillSupportTarget,
} from '../../src/types/orchestra-skill-contracts'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from '../captions-specialist/captions-specialist-runtime'
import {
  CAP_11_CONFIRMED_FRAME_REF,
  CAP_11_MASTER_TIMING_REF,
  CAP_11_SCENE_GRAPH_FIXTURE,
  CAP_11_STYLE_PROFILE_REF,
  CAP_11_TRANSCRIPT_REF,
} from './captions-specialist-cap-11-smoke'
import {
  runCaptionLivingFrameCompatibilitySmoke,
} from './captions-specialist-cap-12-living-frame-compatibility-smoke'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = `${id}.v1`): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}
function digest<T extends Record<string, unknown>>(value: T, field: keyof T & string): string {
  return calculateSkillContractDigest(value, field)
}
function withDigest<T extends Record<string, unknown>, K extends keyof T & string>(
  value: T,
  field: K,
): T {
  return { ...value, [field]: digest(value, field) }
}

const graph = CAP_11_SCENE_GRAPH_FIXTURE
const registration = createCaptionStoryTimingRegistration({
  registrationId: 'caption.storytiming.cap12.fixture',
  sceneGraph: graph,
  masterTimingRef: CAP_11_MASTER_TIMING_REF,
  minimumStableReadFramesByNode: Object.fromEntries(
    graph.nodes.map((node) => [node.nodeId, 24]),
  ),
})

const phraseOrder = Array.from(new Set(graph.nodes.map((node) => node.phraseId)))
const phraseRange = (phraseId: string) => {
  const index = phraseOrder.indexOf(phraseId)
  return { startFrame: index * 60, endFrameExclusive: index * 60 + 60 }
}
const eventFrame = (intent: string, start: number, end: number) => {
  if (intent === 'caption_on') return start
  if (intent === 'motion_entry_end') return start + 4
  if (intent === 'motion_exit_start') return end - 4
  if (intent === 'caption_off') return end - 1
  return start + 12
}
const resolutionWithoutDigest: Omit<
  CaptionStoryTimingResolutionBinding,
  'resolutionDigestSha256'
> = {
  schemaVersion: CAPTION_STORYTIMING_RESOLUTION_VERSION,
  resolutionId: 'storytiming.caption.resolution.cap12.fixture',
  registrationRef: {
    id: registration.registrationId,
    version: registration.schemaVersion,
    contentHash: registration.registrationDigestSha256,
  },
  canonicalScope: structuredClone(graph.canonicalScope),
  sceneGraphRef: {
    id: graph.graphId,
    version: graph.schemaVersion,
    contentHash: graph.graphDigestSha256,
  },
  confirmedOutputFrameRef: CAP_11_CONFIRMED_FRAME_REF,
  masterTimingRef: CAP_11_MASTER_TIMING_REF,
  storyTimingRef: ref('storytiming.cap12.canonical'),
  fpsNumerator: 30,
  fpsDenominator: 1,
  nodeResolutions: registration.registrations.map((item) => {
    const cueRange = phraseRange(item.phraseId)
    return {
      registrationItemId: item.registrationItemId,
      nodeId: item.nodeId,
      trackId: item.trackId,
      phraseId: item.phraseId,
      timingRequirementRef: item.timingRequirementRef,
      cueRange,
      semanticEventRefs: item.semanticEventIntents.map((intent) => ({
        eventIntent: intent,
        eventRef: ref(`storytiming.event.${item.nodeId}.${intent}`),
        frame: eventFrame(intent, cueRange.startFrame, cueRange.endFrameExclusive),
      })),
      stableReadRange: {
        startFrame: cueRange.startFrame + 4,
        endFrameExclusive: cueRange.endFrameExclusive - 4,
      },
    }
  }),
  phaseResolutions: registration.phaseRegistrations.map((phase, index) => ({
    phaseId: phase.phaseId,
    storyTimingRequirementRef: phase.storyTimingRequirementRef,
    resolvedEventRef: ref(`storytiming.phase.${phase.phaseId}`),
    frameRange: { startFrame: index * 60, endFrameExclusive: index * 60 + 60 },
  })),
  evidenceMode: 'contract_fixture',
  exactCanonicalRereadVerified: false,
  exactMasterTimingDigestVerified: false,
  storyTimingProducedBinding: true,
  captionProducedFinalFrames: false,
  parallelClockCreated: false,
  timelineMutationGrantedToCaption: false,
  runtimeExecutionGrantedToCaption: false,
  finalQaApprovalGrantedToCaption: false,
  productionAuthorityGranted: false,
}
const resolution = parseCaptionStoryTimingResolution(withDigest({
  ...resolutionWithoutDigest,
  resolutionDigestSha256: '',
}, 'resolutionDigestSha256'), registration, graph)

const skillScope: SkillCanonicalScope = {
  ownerUserId: graph.canonicalScope.ownerUserId,
  workspaceId: graph.canonicalScope.workspaceId,
  projectId: graph.canonicalScope.projectId,
  editSessionId: graph.canonicalScope.editSessionId,
  approvedSnapshotRef: graph.canonicalScope.approvedSnapshotRef,
  outputId: graph.canonicalScope.outputId,
  sceneId: graph.canonicalScope.sceneId,
  boundaryId: 'boundary.cap12',
  authorizedFrameRanges: graph.canonicalScope.authorizedFrameRanges,
}

function createSupportRequest(input: {
  id: string
  target: SkillSupportTarget
  typedPayloadType: string
  typedPayload: unknown
  artifactTypes: string[]
}): SkillSupportRequest {
  const base: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: input.id,
    originalCallRef: ref('orchestra.call.cap12'),
    requestingSkillKey: 'captions',
    targetSkillKey: input.target,
    reasonCode: `cap12.${input.target}.support_required`,
    requestedArtifactTypes: input.artifactTypes,
    canonicalScope: structuredClone(skillScope),
    typedPayloadType: input.typedPayloadType,
    typedPayload: input.typedPayload,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseSkillSupportRequest(withDigest({
    ...base,
    requestDigestSha256: '',
  }, 'requestDigestSha256'))
}

const lfRequestWithoutDigest: Omit<CaptionLivingFrameRequestV2, 'requestDigestSha256'> = {
  schemaVersion: CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
  requestId: 'caption.lf.request.cap12.fixture',
  idempotencyKey: 'caption.lf.cap12.idempotency',
  createdForPhase: 'approved_projection',
  receiverSkillId: 'motion.living_frame_storytelling',
  canonicalScope: { ...structuredClone(graph.canonicalScope), handoffId: 'handoff.cap12.lf' },
  captionPlanRef: { id: graph.graphId, version: graph.schemaVersion, contentHash: graph.graphDigestSha256 },
  captionProjectionRef: ref('caption.projection.cap12'),
  canonicalTranscript: {
    artifactRef: CAP_11_TRANSCRIPT_REF,
    language: 'en-US',
    sourceSegmentIds: ['segment.cap12.1'],
    phraseIds: ['phrase.cap11.hero.full'],
    exactSourceWordIds: ['word.19', 'word.20', 'word.21'],
  },
  semanticRequest: {
    conceptId: 'concept.cap12.frame-motion',
    classification: 'cross_system_transform',
    purposeCode: 'reinforce_key_concept',
    visualVerbCode: 'transform',
    sourcePhraseIds: ['phrase.cap11.hero.full'],
    exactSourceWordIds: ['word.19', 'word.20', 'word.21'],
    sourceOwner: 'caption',
    intendedTargetOwner: 'living_frame',
    duplicateConceptAfterSuccessfulTransferAllowed: false,
    restoreCaptionOnFailure: true,
  },
  confirmedFrame: {
    outputId: graph.canonicalScope.outputId,
    width: 1_920,
    height: 1_080,
    aspectRatioNumerator: 16,
    aspectRatioDenominator: 9,
    confirmedOutputFrameDigestSha256: CAP_11_CONFIRMED_FRAME_REF.contentHash,
  },
  reservation: {
    regions: [{
      regionId: 'region.cap11.safe',
      normalizedBasisPoints: { x: 500, y: 7000, width: 9000, height: 2000 },
      pixelBounds: { x: 96, y: 756, width: 1_728, height: 216 },
    }],
    captionPlanePriority: 900,
    protectedRegionIds: ['region.cap11.speaker'],
    desiredRange: { startFrame: 300, endFrameExclusive: 360 },
    desiredPhraseBoundaryIds: ['phrase.cap11.hero.full'],
    fallbackRegionIds: ['region.cap11.safe.upper'],
  },
  timing: {
    masterTimingRef: CAP_11_MASTER_TIMING_REF,
    storyTimingRef: resolution.storyTimingRef,
    eventRefs: resolution.nodeResolutions.find((item) =>
      item.phraseId === 'phrase.cap11.hero.full')!.semanticEventRefs.map((item) => item.eventRef),
    cueRefs: [ref('storytiming.cue.cap12.hero')],
    semanticStartIntent: 'begin_after_caption_read',
    semanticHitIntent: 'visual_takes_information_ownership',
    semanticHoldIntent: 'hold_without_duplicate_caption',
    semanticExitIntent: 'restore_caption_if_visual_unavailable',
    finalLivingFrameFramesManufacturedByCaption: false,
  },
  style: {
    captionStyleProfileRef: CAP_11_STYLE_PROFILE_REF,
    approvedSemanticColorTokenRefs: [ref('color.cap11.hero')],
    motionIntentCode: 'handoff_morph',
    reducedMotionIntentCode: 'stable_cut_then_hold',
  },
  dependencies: {
    layoutOccupancyManifestRef: graph.occupancyManifestRef,
    visualAssetExpectationRefs: [ref('visual.expectation.cap12')],
    depthExpectationRefs: [ref('depth.expectation.cap12')],
    maskExpectationRefs: [],
    livingFrameComponentVersionExpected: 'living-frame-professional-skill-component-v1',
    captionComponentVersion: 'caption-design-composite-v1',
  },
  estimateInputs: {
    requestedComplexityCeiling: 'moderate',
    premiumOperationPermissionExpected: false,
    lowerCostFallbackPreferred: true,
    billingAuthorityClaimed: false,
  },
  fallbackLadder: ['stable_hero_caption', 'stable_accessible_caption', 'user_review'],
  qaExpectationCodes: [
    'caption_safe_region', 'attention_restoration', 'semantic_timing',
    'reduced_motion_parity',
  ],
  accessibility: {
    completeCaptionCounterpartRetained: true,
    reducedMotionRequired: true,
  },
  documentaryFactSafetyRefs: [],
  privateArtifactPolicy: {
    tenantScoped: true,
    retentionClass: 'private_edit_artifact',
    accessClass: 'owner_and_service_only',
    byteFreeRequest: true,
    replayPolicyCode: 'exact_idempotent_replay_only',
    stalenessRefs: [
      CAP_11_TRANSCRIPT_REF,
      { id: graph.graphId, version: graph.schemaVersion, contentHash: graph.graphDigestSha256 },
      CAP_11_CONFIRMED_FRAME_REF,
      CAP_11_MASTER_TIMING_REF, graph.occupancyManifestRef,
    ],
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    urlsOrPathsIncluded: false,
    credentialsIncluded: false,
    executablePromptTextIncluded: false,
  },
  operationRegistered: false,
  dispatchGranted: false,
  runtimeAuthority: false,
  assetCreated: false,
  qaApprovalGranted: false,
  publicDeliveryCreated: false,
  productionReady: false,
}
export const CAP_12_LIVING_FRAME_REQUEST_V2_FIXTURE = parseCaptionLivingFrameRequestV2(withDigest({
  ...lfRequestWithoutDigest,
  requestDigestSha256: '',
}, 'requestDigestSha256'))
const lfRequest = CAP_12_LIVING_FRAME_REQUEST_V2_FIXTURE
const lfSupport = createSupportRequest({
  id: 'support.cap12.living-frame',
  target: 'living_frame',
  typedPayloadType: CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
  typedPayload: lfRequest,
  artifactTypes: ['living_frame_caption_direction_response'],
})

const visualSupport = createSupportRequest({
  id: 'support.cap12.visual',
  target: 'visual_intelligence',
  typedPayloadType: 'caption-to-visual-request-v1',
  typedPayload: {
    semanticConceptId: 'concept.cap12.statement',
    sourcePhraseIds: ['phrase.cap11.statement'],
    exactSourceWordIds: ['word.1', 'word.2', 'word.3', 'word.4', 'word.5'],
    requestIsByteFree: true,
    providerCallRequested: false,
  },
  artifactTypes: ['caption_to_visual_evidence'],
})
const transitionSupport = createSupportRequest({
  id: 'support.cap12.transitions',
  target: 'transitions',
  typedPayloadType: 'caption-transition-support-request-v1',
  typedPayload: {
    semanticConceptId: 'concept.cap12.transition',
    requestedRelationship: 'protect_stable_read_then_transition',
    requestIsByteFree: true,
    transitionSelectionRequested: false,
  },
  artifactTypes: ['caption_transition_support_result'],
})

function handoff(input: {
  id: string
  receiver: CaptionCrossSystemHandoff['receiver']
  kind: CaptionCrossSystemHandoff['handoffKind']
  phraseIds: string[]
  wordIds: string[]
  support: SkillSupportRequest
  payloadRef: CaptionDomainRef
  transfer: boolean
}): CaptionCrossSystemHandoff {
  const base: Omit<CaptionCrossSystemHandoff, 'handoffDigestSha256'> = {
    schemaVersion: CAPTION_CROSS_SYSTEM_HANDOFF_VERSION,
    handoffId: input.id,
    canonicalScope: structuredClone(graph.canonicalScope),
    receiver: input.receiver,
    handoffKind: input.kind,
    sourceOwner: 'captions',
    targetOwner: input.receiver,
    sourcePhraseIds: input.phraseIds,
    exactSourceWordIds: input.wordIds,
    semanticConceptId: `concept.${input.id}`,
    semanticPurposeCode: 'preserve_semantic_continuity',
    continuityToken: `continuity.${input.id}`,
    storyTimingResolutionRef: {
      id: resolution.resolutionId,
      version: resolution.schemaVersion,
      contentHash: resolution.resolutionDigestSha256,
    },
    requestedEventRefs: [ref(`storytiming.event.${input.id}`)],
    accessibleCounterpartNodeIds: [graph.nodes[0].nodeId],
    sourceSupportPayloadRef: input.payloadRef,
    supportRequestRef: {
      id: input.support.requestId,
      version: input.support.schemaVersion,
      contentHash: input.support.requestDigestSha256,
    },
    fallback: {
      preserveAccessibleCaption: true,
      restoreCreativeCaption: input.transfer,
      selectedFallbackCode: input.transfer ? 'restore_stable_caption' : 'stable_caption',
    },
    informationOwnershipTransferRequested: input.transfer,
    duplicateConceptAfterSuccessfulTransferAllowed: false,
    receiverExecutionClaimed: false,
    directPeerDispatchGranted: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionCrossSystemHandoff(withDigest({
    ...base,
    handoffDigestSha256: '',
  }, 'handoffDigestSha256'), resolution, input.support)
}

const handoffs = [{
  handoff: handoff({
    id: 'handoff.cap12.visual', receiver: 'visual_intelligence',
    kind: 'caption_to_visual', phraseIds: ['phrase.cap11.statement'],
    wordIds: ['word.1', 'word.2', 'word.3', 'word.4', 'word.5'],
    support: visualSupport, payloadRef: ref('caption.visual.payload.cap12'), transfer: false,
  }),
  supportRequest: visualSupport,
}, {
  handoff: handoff({
    id: 'handoff.cap12.lf', receiver: 'living_frame',
    kind: 'caption_to_living_frame', phraseIds: ['phrase.cap11.hero.full'],
    wordIds: ['word.19', 'word.20', 'word.21'],
    support: lfSupport,
    payloadRef: {
      id: lfRequest.requestId,
      version: lfRequest.schemaVersion,
      contentHash: lfRequest.requestDigestSha256,
    },
    transfer: true,
  }),
  supportRequest: lfSupport,
}, {
  handoff: handoff({
    id: 'handoff.cap12.transition', receiver: 'transitions',
    kind: 'transition_support', phraseIds: ['phrase.cap11.environment'],
    wordIds: ['word.12', 'word.13', 'word.14', 'word.15'],
    support: transitionSupport, payloadRef: ref('caption.transition.payload.cap12'),
    transfer: false,
  }),
  supportRequest: transitionSupport,
}]

const cameraBase: Omit<CaptionCameraRequest, 'requestDigestSha256'> = {
  schemaVersion: CAPTION_CAMERA_REQUEST_VERSION,
  requestId: 'caption.camera.cap12.fixture',
  canonicalScope: structuredClone(graph.canonicalScope),
  sceneGraphRef: { id: graph.graphId, version: graph.schemaVersion, contentHash: graph.graphDigestSha256 },
  storyTimingResolutionRef: {
    id: resolution.resolutionId,
    version: resolution.schemaVersion,
    contentHash: resolution.resolutionDigestSha256,
  },
  requestedFrameRange: { startFrame: 0, endFrameExclusive: 60 },
  semanticPurposeCode: 'preserve_primary_statement_readability',
  protectedRegionIds: ['region.cap11.safe'],
  requestedBehavior: 'reduce_motion_during_read',
  maximumCameraMotionBasisPoints: 1_000,
  reducedMotionBehavior: 'hold_stable',
  cameraOwnerResponseRef: null,
  captionControlsCamera: false,
  timelineMutationGranted: false,
  runtimeExecutionGranted: false,
  finalQaApprovalGranted: false,
  productionAuthorityGranted: false,
}
const cameraRequest = parseCaptionCameraRequest(withDigest({
  ...cameraBase,
  requestDigestSha256: '',
}, 'requestDigestSha256'), graph, resolution)

const proposals: CaptionMotionPrimitiveProposal[] = graph.nodes.map((node, index) => {
  const track = graph.tracks.find((candidate) => candidate.trackId === node.trackId)!
  const accessible = track.role === 'accessible_sidecar'
  const hero = track.role === 'hero_typography'
  const list = track.role === 'persistent_topic_list'
  const transfer = !accessible && node.phraseId === 'phrase.cap11.hero.full'
  return {
    primitiveId: `motion.cap12.${index + 1}`,
    nodeId: node.nodeId,
    primitive: accessible ? 'stable_hold' : transfer ? 'handoff_morph'
      : hero ? 'hero_expansion' : list ? 'list_append' : 'fade',
    unstableEntryFrames: accessible ? 0 : hero ? 6 : 4,
    unstableExitFrames: accessible ? 0 : 4,
    additionalUnreadableRanges: [],
    easing: hero ? 'spring_restrained' : 'ease_out',
    travelBasisPoints: { x: 0, y: hero ? 200 : 0 },
    startScaleBasisPoints: hero ? 9_000 : 10_000,
    endScaleBasisPoints: 10_000,
    startOpacityBasisPoints: accessible ? 10_000 : 0,
    endOpacityBasisPoints: 10_000,
    overshootBasisPoints: hero ? 300 : 0,
    staggerFrames: list ? 2 : 0,
    interruptionPolicy: 'preserve_accessible_text',
    semanticReasonCode: accessible ? 'accessible_stability' : hero
      ? 'earned_hero_emphasis' : list ? 'persistent_order' : 'restrained_semantic_reveal',
    reducedMotionPrimitive: accessible ? 'stable_hold' : 'fade',
  }
})

const { plan, effectiveReadReport } = createCaptionMotionPlan({
  planId: 'caption.motion.cap12.fixture',
  sceneGraph: graph,
  registration,
  resolution,
  primitiveProposals: proposals,
  handoffBundles: handoffs,
  cameraRequests: [cameraRequest],
})
const lock = createCaptionMotionLock({
  lockId: 'caption.motion.lock.cap12.fixture',
  plan,
  resolution,
  effectiveReadReport,
})

export const CAP_12_STORYTIMING_REGISTRATION_FIXTURE = registration
export const CAP_12_STORYTIMING_RESOLUTION_FIXTURE = resolution
export const CAP_12_MOTION_PLAN_FIXTURE = plan
export const CAP_12_EFFECTIVE_READ_REPORT_FIXTURE = effectiveReadReport
export const CAP_12_MOTION_LOCK_FIXTURE = lock

const lfResponseWithoutDigest: Omit<LivingFrameCaptionResponseV2, 'responseDigestSha256'> = {
  schemaVersion: LIVING_FRAME_CAPTION_RESPONSE_V2_VERSION,
  responseId: 'living.frame.caption.response.cap12.fixture',
  originalRequestRef: {
    id: lfRequest.requestId,
    version: lfRequest.schemaVersion,
    contentHash: lfRequest.requestDigestSha256,
  },
  originalRequestIdempotencyKey: lfRequest.idempotencyKey,
  canonicalScope: structuredClone(lfRequest.canonicalScope),
  disposition: 'supported_selected',
  reasonCode: 'non_character_visual_explanation_supported',
  safeUserSummary: 'Living Frame can support the approved non-character visual explanation.',
  livingFrameComponentRef: ref('living.frame.component.cap12', 'living-frame-professional-skill-component-v1'),
  semanticProjectionRef: ref('living.frame.semantic.cap12', 'living-frame-semantic-plan-projection-v1'),
  selectedScene: {
    admissionRef: ref('living.frame.admission.cap12'),
    bindingRef: ref('living.frame.selected.binding.cap12', 'canonical-living-frame-selected-scene-binding-v1'),
    selectedSceneIds: ['scene.cap12.diagram.1', 'scene.cap12.diagram.2'],
    selectedModes: ['living_diagram', 'living_archive'],
    selectedTreatments: ['use_full', 'use_subtle'],
    deliberateNonUse: false,
    executionClaimed: false,
  },
  informationOwnerHandoff: {
    state: 'accepted',
    attentionEventIds: ['attention.cap12.handoff', 'attention.cap12.restore'],
    semanticTimingRequestIds: ['timing.cap12.handoff', 'timing.cap12.restore'],
  },
  timing: {
    masterTimingRef: lfRequest.timing.masterTimingRef,
    storyTimingEventRefs: lfRequest.timing.eventRefs,
    storyTimingCueRefs: lfRequest.timing.cueRefs,
    livingFrameTimingBindingRef: ref('living.frame.timing.cap12', 'canonical-living-frame-timing-binding-v1'),
    parallelClockCreated: false,
  },
  layoutDependencies: {
    occupancyRegionRefs: [ref('living.frame.occupancy.cap12')],
    captionSafeExpectationRefs: [ref('living.frame.caption.safe.cap12')],
    faceGestureProtectionRefs: [],
    depthBandRefs: [ref('living.frame.depth.cap12')],
    occlusionExpectationRefs: [],
    maskArtifactRefs: [],
    unresolvedGateCodes: ['approved_snapshot_reread_required'],
    captionPlaneAboveLivingFrame: true,
  },
  estimateProjectionRef: ref('living.frame.estimate.cap12'),
  requiredCapabilityCategories: ['deterministic_scene_composition'],
  requiredWorkCategories: ['living_frame_selected_scene_candidate'],
  selectedFallbackCode: 'simplified_depth_composition',
  captionRetainsOrRegainsInformationOwnership: true,
  qaEvidenceRequirementCodes: [
    'caption_safe_region_expected', 'semantic_timing_binding_required',
    'attention_restoration_required', 'visual_density_restraint_expected',
    'narration_protection_required',
  ],
  stalenessTuple: {
    transcriptRef: lfRequest.canonicalTranscript.artifactRef,
    captionPlanRef: lfRequest.captionPlanRef,
    confirmedFrameRef: CAP_11_CONFIRMED_FRAME_REF,
    layoutOccupancyRef: lfRequest.dependencies.layoutOccupancyManifestRef,
    masterTimingRef: lfRequest.timing.masterTimingRef,
    livingFrameComponentRef: ref('living.frame.component.cap12', 'living-frame-professional-skill-component-v1'),
    selectedSceneBindingRef: ref('living.frame.selected.binding.cap12', 'canonical-living-frame-selected-scene-binding-v1'),
    approvedSnapshotRef: lfRequest.canonicalScope.approvedSnapshotRef,
  },
  operationRegistered: false,
  dispatchGranted: false,
  providerAuthority: false,
  runtimeAuthority: false,
  assetCreated: false,
  qaApprovalGranted: false,
  publicDeliveryCreated: false,
  productionReady: false,
}
export const CAP_12_LIVING_FRAME_RESPONSE_V2_FIXTURE = parseLivingFrameCaptionResponseV2(withDigest({
  ...lfResponseWithoutDigest,
  responseDigestSha256: '',
}, 'responseDigestSha256'), lfRequest)
const lfResponse = CAP_12_LIVING_FRAME_RESPONSE_V2_FIXTURE

function runCap12Smoke(): void {
const compatibilityReceipt = runCaptionLivingFrameCompatibilitySmoke({
  v2Request: lfRequest,
  v2Response: lfResponse,
})
assertions += compatibilityReceipt.assertions
const lfV1Support = createSupportRequest({
  id: 'support.cap12.living-frame.v1.compatibility',
  target: 'living_frame',
  typedPayloadType: compatibilityReceipt.v1Request.schemaVersion,
  typedPayload: compatibilityReceipt.v1Request,
  artifactTypes: ['living_frame_caption_direction_response'],
})
const lfV1Handoff = handoff({
  id: 'handoff.cap12.lf.v1.compatibility',
  receiver: 'living_frame',
  kind: 'caption_to_living_frame',
  phraseIds: compatibilityReceipt.v1Request.semanticRequest.sourceSemanticPhraseIds,
  wordIds: compatibilityReceipt.v1Request.semanticRequest.exactSourceWordIds,
  support: lfV1Support,
  payloadRef: {
    id: compatibilityReceipt.v1Request.requestId,
    version: compatibilityReceipt.v1Request.schemaVersion,
    contentHash: compatibilityReceipt.v1Request.requestDigestSha256.slice(7),
  },
  transfer: true,
})
check(registration.registrations.length === graph.nodes.length,
  'Every Caption node must register semantic timing requirements with StoryTiming.')
check(resolution.nodeResolutions.every((item) => item.semanticEventRefs.length >= 4),
  'StoryTiming must resolve typed semantic events for every Caption node.')
check(resolution.captionProducedFinalFrames === false && resolution.parallelClockCreated === false,
  'Caption must not manufacture final frames or create a parallel clock.')
check(effectiveReadReport.allEntriesPassed
  && effectiveReadReport.entries.every((entry) => entry.effectiveStableReadFrames >= 24),
  'Effective stable-read time must pass after unstable motion is subtracted.')
check(plan.primitives.length === graph.nodes.length
  && plan.primitives.every((primitive) => primitive.reducedMotionReplacement.preservesMeaning),
  'Every node must receive a typed primitive and meaning-preserving reduced-motion alternative.')
check(new Set(plan.handoffs.map((item) => item.handoffKind)).size === 3,
  'CAP-12 must represent Visual, Living Frame, and Transition coordination separately.')
check(plan.supportRequests.every((request) => request.mediationPolicy.hqMediated
  && !request.mediationPolicy.directPeerDispatchAllowed),
  'Every receiver request must use the neutral mediated support envelope.')
check(plan.cameraRequests[0].captionControlsCamera === false,
  'Camera behavior must remain a request to the camera owner.')
check(lock.state === 'contract_ready'
  && lock.blockerCodes.includes('authenticated_storytiming_reread_required'),
  'Fixture timing may close contract structure but cannot claim runtime readiness.')
check(lfRequest.receiverSkillId === 'motion.living_frame_storytelling'
  && !lfRequest.dispatchGranted && !lfRequest.runtimeAuthority,
  'The frozen Living Frame request must target the professional skill without dispatch authority.')
check(lfResponse.selectedScene.selectedSceneIds.length === 2,
  'One frozen CAP-11 request may validly select multiple Living Frame scenes.')
check(lfV1Handoff.sourceSupportPayloadRef.contentHash
  === compatibilityReceipt.v1Request.requestDigestSha256.slice(7),
'The StoryTiming handoff must accept the frozen V1 payload without relabeling it.')
check(lfResponse.layoutDependencies.captionPlaneAboveLivingFrame
  && lfResponse.captionRetainsOrRegainsInformationOwnership,
  'Living Frame response must preserve Caption ordering and information restoration.')
check(!plan.runtimeExecutionGranted && !plan.finalQaApprovalGranted
  && !plan.productionAuthorityGranted,
  'CAP-12 must keep runtime, final QA, and production authority closed.')

const badResolution = structuredClone(resolution)
badResolution.nodeResolutions[0].cueRange.endFrameExclusive = 361
badResolution.resolutionDigestSha256 = digest(
  badResolution as unknown as Record<string, unknown>, 'resolutionDigestSha256')
expectThrow(() => parseCaptionStoryTimingResolution(badResolution, registration, graph))

const shortRead = createCaptionEffectiveReadReport({
  reportId: 'caption.read.cap12.too-short',
  resolution,
  registration,
  sceneGraph: graph,
  primitiveImpacts: [{
    nodeId: graph.nodes[0].nodeId,
    unstableEntryFrames: 25,
    unstableExitFrames: 25,
    additionalUnreadableRanges: [{ startFrame: 4, endFrameExclusive: 55 }],
  }],
})
check(!shortRead.allEntriesPassed
  && shortRead.entries[0].blockerCodes.includes('effective_read_time_too_short')
  && shortRead.entries[0].additionalUnreadableFrames === 51,
  'Long nominal cues must still fail when effective stable read time is insufficient.')

const loweredReadRequirement = structuredClone(effectiveReadReport)
loweredReadRequirement.entries[0].minimumStableReadFrames = 1
loweredReadRequirement.reportDigestSha256 = digest(
  loweredReadRequirement as unknown as Record<string, unknown>, 'reportDigestSha256')
expectThrow(() => parseCaptionEffectiveReadReport(
  loweredReadRequirement, registration, resolution,
))

const handoffSwap = structuredClone(plan)
handoffSwap.handoffs[0].handoffDigestSha256 = hash('unrelated.handoff')
handoffSwap.planDigestSha256 = digest(
  handoffSwap as unknown as Record<string, unknown>, 'planDigestSha256')
expectThrow(() => parseCaptionMotionPlan(handoffSwap, {
  graph,
  registration,
  resolution,
  effectiveReadReport,
  handoffBundles: handoffs,
}))

const receiverKindMismatch = structuredClone(handoffs[0].handoff)
receiverKindMismatch.handoffKind = 'transition_support'
receiverKindMismatch.handoffDigestSha256 = digest(
  receiverKindMismatch as unknown as Record<string, unknown>, 'handoffDigestSha256')
expectThrow(() => parseCaptionCrossSystemHandoff(
  receiverKindMismatch, resolution, visualSupport,
))

expectThrow(() => createCaptionMotionPlan({
  planId: 'caption.motion.cap12.missing-transfer-morph',
  sceneGraph: graph,
  registration,
  resolution,
  primitiveProposals: proposals.map((proposal) =>
    proposal.primitive === 'handoff_morph'
      ? { ...proposal, primitive: 'hero_expansion' as const } : proposal),
  handoffBundles: handoffs,
  cameraRequests: [cameraRequest],
}))

const badLfAspect = structuredClone(lfRequest)
badLfAspect.confirmedFrame.aspectRatioNumerator = 9
badLfAspect.confirmedFrame.aspectRatioDenominator = 16
badLfAspect.requestDigestSha256 = digest(
  badLfAspect as unknown as Record<string, unknown>, 'requestDigestSha256')
expectThrow(() => parseCaptionLivingFrameRequestV2(badLfAspect))

const badLfResponse = structuredClone(lfResponse)
badLfResponse.selectedScene.selectedModes.pop()
badLfResponse.responseDigestSha256 = digest(
  badLfResponse as unknown as Record<string, unknown>, 'responseDigestSha256')
expectThrow(() => parseLivingFrameCaptionResponseV2(badLfResponse, lfRequest))

const staleLfResponse = structuredClone(lfResponse)
staleLfResponse.stalenessTuple.captionPlanRef = ref('caption.plan.stale')
staleLfResponse.responseDigestSha256 = digest(
  staleLfResponse as unknown as Record<string, unknown>, 'responseDigestSha256')
expectThrow(() => parseLivingFrameCaptionResponseV2(staleLfResponse, lfRequest))

const peerDispatch = structuredClone(visualSupport)
peerDispatch.mediationPolicy.directPeerDispatchAllowed = true as false
peerDispatch.requestDigestSha256 = digest(
  peerDispatch as unknown as Record<string, unknown>, 'requestDigestSha256')
expectThrow(() => parseSkillSupportRequest(peerDispatch))

const cameraOverclaim = structuredClone(cameraRequest)
cameraOverclaim.captionControlsCamera = true as false
cameraOverclaim.requestDigestSha256 = digest(
  cameraOverclaim as unknown as Record<string, unknown>, 'requestDigestSha256')
expectThrow(() => parseCaptionCameraRequest(cameraOverclaim, graph, resolution))

const inherited = Object.create(lfRequest) as CaptionLivingFrameRequestV2
expectThrow(() => parseCaptionLivingFrameRequestV2(inherited))

console.log(JSON.stringify({
  status: 'passed_with_authenticated_storytiming_and_receiver_runtime_gates',
  milestone: 'CAP-12',
  assertions,
  storyTimingRegistrationCount: registration.registrations.length,
  resolvedNodeCount: resolution.nodeResolutions.length,
  typedMotionPrimitiveCount: plan.primitives.length,
  handoffKinds: plan.handoffs.map((item) => item.handoffKind),
  livingFrameSelectedSceneCount: lfResponse.selectedScene.selectedSceneIds.length,
  livingFrameV1RequestVersion: compatibilityReceipt.v1Request.schemaVersion,
  livingFrameV2RequestVersion: lfRequest.schemaVersion,
  livingFrameCompatibilityRequestBindingDigestSha256:
    compatibilityReceipt.requestCompatibilityDigestSha256,
  livingFrameCompatibilityResponseBindingDigestSha256:
    compatibilityReceipt.responseCompatibilityDigestSha256,
  effectiveReadPassed: effectiveReadReport.allEntriesPassed,
  reducedMotionComplete: plan.reducedMotionComplete,
  motionLockState: lock.state,
  actualStoryTimingAuthenticatedReread: false,
  receiverRuntimeExecuted: false,
  productionAuthorityPromoted: false,
}, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap12Smoke()
}
