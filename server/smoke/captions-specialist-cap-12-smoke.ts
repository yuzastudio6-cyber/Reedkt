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
  captionCrossSystemOutboundPayloadRef,
  createCaptionCrossSystemHandoffV2,
  createCaptionCrossSystemCoordinationPlan,
  createCaptionCrossSystemOutboundPayloadV2,
  parseCaptionCrossSystemCoordinationPlan,
  parseCaptionCrossSystemHandoffV2,
  parseCaptionCrossSystemOutboundPayloadV2,
  parseCaptionIncomingTypographyRequest,
  parseCaptionIncomingTypographySupportBundle,
} from '../captions-specialist/caption-cross-system-coordination'
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
  CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION,
  type CaptionCrossSystemOutboundPayloadV2,
  type CaptionCrossSystemReceiverV2,
  type CaptionIncomingTypographyRequest,
} from '../../src/types/caption-cross-system-coordination'
import {
  SKILL_SUPPORT_REQUEST_VERSION,
  type SkillCanonicalScope,
  type SkillSupportRequest,
  type SkillSupportTarget,
} from '../../src/types/orchestra-skill-contracts'
import {
  SKILL_SUPPORT_REQUEST_VERSION_V2,
  type SkillSupportRequestV2,
} from '../../src/types/orchestra-skill-support-request-v2'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  calculateSkillSupportRequestV2Digest,
  parseSkillSupportRequestV2,
} from '../orchestra/orchestra-skill-support-request-v2'
import {
  CAPTIONS_CLOSED_AUTHORITY_BOUNDARY,
  runCaptionsSpecialistJob,
} from '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsHarnessCall,
  resumeCaptionsHarnessCall,
} from '../internal-testing/captions-specialist-harness'
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
  handoffSourceNodeIds: [
    'node.creative.phrase.cap11.statement',
    'node.creative.phrase.cap11.hero.behind',
    'node.creative.phrase.cap11.list',
    'node.creative.phrase.cap11.environment',
    'node.creative.phrase.cap11.anchor',
    'node.creative.phrase.cap11.hero.full',
  ],
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
  if (intent === 'handoff') return start + 12
  if (intent === 'motion_exit_start') return end - 4
  if (intent === 'restore') return end - 2
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
  originalCallRef?: CaptionDomainRef
  canonicalScope?: SkillCanonicalScope
  reasonCode?: string
}): SkillSupportRequest {
  const base: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: input.id,
    originalCallRef: structuredClone(
      input.originalCallRef ?? ref('orchestra.call.cap12')),
    requestingSkillKey: 'captions',
    targetSkillKey: input.target,
    reasonCode: input.reasonCode
      ?? `cap12.${input.target}.support_required`,
    requestedArtifactTypes: input.artifactTypes,
    canonicalScope: structuredClone(input.canonicalScope ?? skillScope),
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

type OutboundFixtureSpec = {
  receiver: CaptionCrossSystemReceiverV2
  nodeId: string
  phraseId: string
  sourceTruthPolicy:
    CaptionCrossSystemOutboundPayloadV2['semantic']['sourceTruthPolicy']
  transferRequested: boolean
  capabilityCode: string
  expectedArtifactType: string
}

const outboundFixtureSpecs: OutboundFixtureSpec[] = [{
  receiver: 'living_frame',
  nodeId: 'node.creative.phrase.cap11.hero.full',
  phraseId: 'phrase.cap11.hero.full',
  sourceTruthPolicy: 'canonical_transcript_lineage',
  transferRequested: true,
  capabilityCode: 'semantic_living_frame_transform',
  expectedArtifactType: 'living_frame_caption_direction_response',
}, {
  receiver: 'transitions',
  nodeId: 'node.creative.phrase.cap11.environment',
  phraseId: 'phrase.cap11.environment',
  sourceTruthPolicy: 'canonical_transcript_lineage',
  transferRequested: false,
  capabilityCode: 'typographic_boundary_transition',
  expectedArtifactType: 'caption_transition_support_result',
}, {
  receiver: 'graphic',
  nodeId: 'node.creative.phrase.cap11.statement',
  phraseId: 'phrase.cap11.statement',
  sourceTruthPolicy: 'canonical_transcript_lineage',
  transferRequested: true,
  capabilityCode: 'semantic_visual_explain_layer',
  expectedArtifactType: 'graphic_visual_layer_plan',
}, {
  receiver: 'map',
  nodeId: 'node.creative.phrase.cap11.anchor',
  phraseId: 'phrase.cap11.anchor',
  sourceTruthPolicy: 'exact_geography_source_required',
  transferRequested: true,
  capabilityCode: 'exact_map_route_visual',
  expectedArtifactType: 'map_route_visual_plan',
}, {
  receiver: 'chart',
  nodeId: 'node.creative.phrase.cap11.list',
  phraseId: 'phrase.cap11.list',
  sourceTruthPolicy: 'exact_data_source_required',
  transferRequested: true,
  capabilityCode: 'exact_chart_data_visual',
  expectedArtifactType: 'chart_data_visual_plan',
}, {
  receiver: 'diagram',
  nodeId: 'node.creative.phrase.cap11.statement',
  phraseId: 'phrase.cap11.statement',
  sourceTruthPolicy: 'exact_data_source_required',
  transferRequested: true,
  capabilityCode: 'exact_diagram_layout',
  expectedArtifactType: 'diagram_layout_plan',
}, {
  receiver: 'broll_owner',
  nodeId: 'node.creative.phrase.cap11.list',
  phraseId: 'phrase.cap11.list',
  sourceTruthPolicy: 'exact_selected_media_required',
  transferRequested: false,
  capabilityCode: 'caption_broll_composition_constraints',
  expectedArtifactType: 'b_roll_caption_constraint_acknowledgement',
}, {
  receiver: 'stroke_motion',
  nodeId: 'node.creative.phrase.cap11.hero.behind',
  phraseId: 'phrase.cap11.hero.behind',
  sourceTruthPolicy: 'canonical_transcript_lineage',
  transferRequested: true,
  capabilityCode: 'semantic_stroke_motion_support',
  expectedArtifactType: 'stroke_motion_visual_plan',
}]

function resolutionForNode(nodeId: string) {
  const value = resolution.nodeResolutions.find((entry) =>
    entry.nodeId === nodeId)
  assert.ok(value, `Missing CAP-12 resolution for ${nodeId}.`)
  return value
}

function eventRefFor(
  nodeId: string,
  intent: 'handoff' | 'motion_exit_start' | 'restore',
): CaptionDomainRef {
  const event = resolutionForNode(nodeId).semanticEventRefs.find((entry) =>
    entry.eventIntent === intent)
  assert.ok(event, `Missing ${intent} event for ${nodeId}.`)
  return event.eventRef
}

function createOutboundPayload(
  spec: OutboundFixtureSpec,
  originCaptionCallRef: CaptionDomainRef = ref('orchestra.call.cap12'),
  payloadIdPrefix = 'caption.cross-system.payload.cap12',
): CaptionCrossSystemOutboundPayloadV2 {
  return createCaptionCrossSystemOutboundPayloadV2({
    payloadId: `${payloadIdPrefix}.${spec.receiver}`,
    originCaptionCallRef,
    receiver: spec.receiver,
    sourceCaptionPlanRef: ref('caption.plan.cap12'),
    sourceCaptionMotionPlanRef: {
      id: plan.planId,
      version: plan.schemaVersion,
      contentHash: plan.planDigestSha256,
    },
    canonicalTranscriptRef: CAP_11_TRANSCRIPT_REF,
    sourceNodeId: spec.nodeId,
    sourcePhraseId: spec.phraseId,
    semantic: {
      conceptId: `concept.cap12.${spec.receiver}`,
      purposeCode: `caption.${spec.receiver}.semantic_handoff`,
      visualVerbCode: spec.transferRequested ? 'transform' : 'coordinate',
      sourceTruthPolicy: spec.sourceTruthPolicy,
    },
    requestedReceivingCapability: {
      capabilityCode: spec.capabilityCode,
      expectedArtifactTypes: [spec.expectedArtifactType],
    },
    expectedVisualResultCode: `expected.${spec.receiver}.meaning_preserved`,
    transferRequested: spec.transferRequested,
    soundIntent: {
      policy: spec.receiver === 'stroke_motion'
        ? 'sound_optional' : 'sound_forbidden',
      captionSoundRequestRef: null,
    },
    fallback: {
      ladderCodes: [
        `fallback.${spec.receiver}.stable_caption`,
        'fallback.accessible_sidecar',
      ],
      selectedDefaultCode: `fallback.${spec.receiver}.stable_caption`,
    },
    requiredEvidence: {
      artifactTypes: [spec.expectedArtifactType],
      qaCodes: [
        'semantic_timing_verified',
        'accessible_counterpart_preserved',
        'receiver_result_scope_verified',
      ],
    },
    resolution,
    sceneGraph: graph,
  })
}

const outboundPayloads = outboundFixtureSpecs.map((spec) =>
  createOutboundPayload(spec))

function outboundSupportRequest(
  payload: CaptionCrossSystemOutboundPayloadV2,
): SkillSupportRequest | undefined {
  if (payload.receiver === 'living_frame') return lfSupport
  if (payload.sharedTargetAdmission.targetSkillKey === null) return undefined
  return createSupportRequest({
    id: `support.cap12.v2.${payload.receiver}`,
    target: payload.sharedTargetAdmission.targetSkillKey,
    typedPayloadType: payload.schemaVersion,
    typedPayload: payload,
    artifactTypes:
      payload.requestedReceivingCapability.expectedArtifactTypes,
  })
}

function frozenCompatibilityHandoff(
  receiver: CaptionCrossSystemReceiverV2,
): CaptionCrossSystemHandoff | null {
  if (receiver === 'living_frame') return handoffs[1]!.handoff
  if (receiver === 'transitions') return handoffs[2]!.handoff
  return null
}

function frozenCompatibilitySupportRequest(
  receiver: CaptionCrossSystemReceiverV2,
): SkillSupportRequest | undefined {
  if (receiver === 'living_frame') return handoffs[1]!.supportRequest
  if (receiver === 'transitions') return handoffs[2]!.supportRequest
  return undefined
}

const outboundBundlesV2 = outboundPayloads.map((outboundPayload) => {
  const supportRequest = outboundSupportRequest(outboundPayload)
  const frozen = frozenCompatibilityHandoff(outboundPayload.receiver)
  const frozenSupport = frozenCompatibilitySupportRequest(
    outboundPayload.receiver)
  const handoff = createCaptionCrossSystemHandoffV2({
    handoffId: `caption.cross-system.handoff.cap12.${outboundPayload.receiver}`,
    outboundPayload,
    ...(supportRequest === undefined ? {} : { supportRequest }),
    frozenCompatibilityHandoff: frozen,
    ...(frozenSupport === undefined
      ? {} : { frozenCompatibilitySupportRequest: frozenSupport }),
    resolution,
    sceneGraph: graph,
  })
  return {
    handoff,
    outboundPayload,
    ...(supportRequest === undefined ? {} : { supportRequest }),
    frozenCompatibilityHandoff: frozen,
    ...(frozenSupport === undefined
      ? {} : { frozenCompatibilitySupportRequest: frozenSupport }),
  }
})

function createIncomingTypographyPayload(input: {
  requester: CaptionIncomingTypographyRequest['requester']
  nodeId: string
  phraseId: string
  wordIds: string[]
}): CaptionIncomingTypographyRequest {
  const livingFrame = input.requester === 'living_frame'
  const source = resolutionForNode(input.nodeId)
  const base: Omit<CaptionIncomingTypographyRequest,
  'requestDigestSha256'> = {
    schemaVersion: CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION,
    requestId: `caption.incoming.typography.cap12.${input.requester}`,
    canonicalScope: structuredClone(graph.canonicalScope),
    requester: input.requester,
    requesterSkillId: livingFrame
      ? 'motion.living_frame_storytelling' : 'motion.transition_language',
    requesterOriginCallRef: ref(`orchestra.call.cap12.${input.requester}`),
    requestedCaptionJobType: livingFrame
      ? 'provide_speech_derived_typography_spec'
      : 'provide_typographic_transition_component',
    expectedCaptionArtifactType: livingFrame
      ? 'caption_speech_derived_typography_spec'
      : 'caption_typographic_transition_component',
    sourceCaptionPlanRef: ref('caption.plan.cap12'),
    canonicalTranscriptRef: CAP_11_TRANSCRIPT_REF,
    confirmedOutputFrameRef: CAP_11_CONFIRMED_FRAME_REF,
    masterTimingRef: CAP_11_MASTER_TIMING_REF,
    storyTimingResolutionRef: {
      id: resolution.resolutionId,
      version: resolution.schemaVersion,
      contentHash: resolution.resolutionDigestSha256,
    },
    sourceNodeId: input.nodeId,
    sourcePhraseId: input.phraseId,
    exactSourceWordIds: input.wordIds,
    authorizedRange: structuredClone(source.cueRange),
    requestedTypographyRoleCode: livingFrame
      ? 'speech_derived_supporting_type' : 'boundary_typographic_component',
    semanticPurposeCode: livingFrame
      ? 'preserve_narration_lineage' : 'preserve_boundary_continuity',
    continuityToken: `continuity.incoming.${input.requester}`,
    requestedEventRefs: [
      eventRefFor(input.nodeId, 'handoff'),
      eventRefFor(input.nodeId, 'restore'),
    ],
    informationOwnership: {
      captionsOwnsTypographySpecification: true,
      requesterOwnsExternalDomainExecution: true,
      requesterMayNotMutateCaptionPlan: true,
      noInformationOwnershipTransferInferred: true,
    },
    accessibility: {
      completeWordingRequired: true,
      accessibleCounterpartRequired: true,
      reducedMotionCounterpartRequired: true,
    },
    requiredEvidenceTypes: [
      'canonical_transcript_lineage',
      'storytiming_resolution',
      'confirmed_output_frame',
    ],
    returnToHq: {
      hqMediated: true,
      captionResultMustReturnToRequesterThroughHq: true,
      directPeerResponseAllowed: false,
    },
    privateArtifactPolicy: {
      tenantScoped: true,
      byteFreeCoordinationOnly: true,
      rawChatIncluded: false,
      mediaBytesIncluded: false,
      urlsOrPathsIncluded: false,
      credentialsIncluded: false,
      executablePromptOrCodeIncluded: false,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseCaptionIncomingTypographyRequest(withDigest({
    ...base,
    requestDigestSha256: '',
  }, 'requestDigestSha256'), { resolution, sceneGraph: graph })
}

function createIncomingSupportRequest(
  payload: CaptionIncomingTypographyRequest,
): SkillSupportRequestV2 {
  const base: Omit<SkillSupportRequestV2, 'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION_V2,
    requestId: `support.cap12.incoming.${payload.requester}`,
    originalCallRef: payload.requesterOriginCallRef,
    requestingSkillKey: payload.requesterSkillId,
    targetSkillKey: 'captions',
    requestedJobType: payload.requestedCaptionJobType,
    reasonCode: `caption.typography.required.${payload.requester}`,
    requestedArtifactTypes: [payload.expectedCaptionArtifactType],
    canonicalScope: structuredClone(skillScope),
    typedPayloadType: payload.schemaVersion,
    typedPayload: payload,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseSkillSupportRequestV2({
    ...base,
    requestDigestSha256: calculateSkillSupportRequestV2Digest(
      { ...base, requestDigestSha256: '' }),
  })
}

const incomingPayloads = [
  createIncomingTypographyPayload({
    requester: 'living_frame',
    nodeId: 'node.creative.phrase.cap11.hero.full',
    phraseId: 'phrase.cap11.hero.full',
    wordIds: ['word.19', 'word.20', 'word.21'],
  }),
  createIncomingTypographyPayload({
    requester: 'transitions',
    nodeId: 'node.creative.phrase.cap11.environment',
    phraseId: 'phrase.cap11.environment',
    wordIds: ['word.12', 'word.13', 'word.14', 'word.15'],
  }),
]
const incomingBundles = incomingPayloads.map((payload) => ({
  payload,
  supportRequest: createIncomingSupportRequest(payload),
}))
incomingBundles.forEach((bundle) =>
  parseCaptionIncomingTypographySupportBundle({
    ...bundle,
    sceneGraph: graph,
    resolution,
  }))

const coordinationContext = {
  sceneGraph: graph,
  motionPlan: plan,
  resolution,
  outboundBundles: outboundBundlesV2,
  incomingBundles,
}
export const CAP_12_CROSS_SYSTEM_COORDINATION_PLAN_FIXTURE =
  createCaptionCrossSystemCoordinationPlan({
    planId: 'caption.cross-system.coordination.cap12.fixture',
    context: coordinationContext,
  })
const coordinationPlan = CAP_12_CROSS_SYSTEM_COORDINATION_PLAN_FIXTURE

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
const incomingRuntimeSupport = incomingBundles[0]!.supportRequest
const incomingRuntimeCallCandidate = createCaptionsHarnessCall({
  callId: 'caption.incoming.typography.runtime.cap12',
  jobType: 'provide_speech_derived_typography_spec',
  scopeLevel: 'boundary',
  approvedSnapshotRef: graph.canonicalScope.approvedSnapshotRef,
  outputId: graph.canonicalScope.outputId,
  sceneId: graph.canonicalScope.sceneId,
  boundaryId: skillScope.boundaryId,
  runtimeProfile: 'cross_system_integration',
  inputArtifactTypes: [
    'canonical_transcript',
    'confirmed_output_frame',
    'master_timing_or_planning_timing',
  ],
})
incomingRuntimeCallCandidate.canonicalScope = structuredClone(skillScope)
incomingRuntimeCallCandidate.inputArtifactRefs.push({
  id: incomingRuntimeSupport.requestId,
  version: incomingRuntimeSupport.schemaVersion,
  contentHash: incomingRuntimeSupport.requestDigestSha256,
  artifactType: 'source_skill_support_request',
  producerSkillKey: 'head_of_orchestra',
  privateArtifact: true,
  byteFreeRef: true,
  sourceSupportRequestRef: null,
})
const incomingRuntimeCall = parseOrchestraSkillCall({
  ...incomingRuntimeCallCandidate,
  callDigestSha256: digest(
    incomingRuntimeCallCandidate as unknown as Record<string, unknown>,
    'callDigestSha256'),
})
const incomingRuntimeMissingContextResult = runCaptionsSpecialistJob({
  call: incomingRuntimeCall,
  incomingSupportRequest: incomingRuntimeSupport,
})
check(incomingRuntimeMissingContextResult.disposition === 'blocked'
  && incomingRuntimeMissingContextResult.reasonCodes.includes(
    'input.incoming_typography_request.source_context.missing'),
'The standalone Caption runtime must fail closed without exact incoming typography source context.')
const incomingRuntimeResult = runCaptionsSpecialistJob({
  call: incomingRuntimeCall,
  incomingSupportRequest: incomingRuntimeSupport,
  incomingTypographySceneGraph: graph,
  incomingTypographyStoryTimingResolution: resolution,
})
check(incomingRuntimeResult.disposition === 'completed'
  && incomingRuntimeResult.reasonCodes.includes(
    'incoming_typography_request.closed_contract.accepted')
  && incomingRuntimeResult.producedArtifactRefs.some((artifact) =>
    artifact.artifactType === 'caption_speech_derived_typography_spec'
      && artifact.sourceSupportRequestRef?.contentHash
        === incomingRuntimeSupport.requestDigestSha256),
'The standalone Caption runtime must accept and trace the closed incoming typography request.')
const incomingRuntimeWithOutboundPlan = runCaptionsSpecialistJob({
  call: incomingRuntimeCall,
  incomingSupportRequest: incomingRuntimeSupport,
  incomingTypographySceneGraph: graph,
  incomingTypographyStoryTimingResolution: resolution,
  crossSystemCoordinationPlan: coordinationPlan,
  crossSystemCoordinationContext: coordinationContext,
})
check(incomingRuntimeWithOutboundPlan.disposition === 'blocked'
  && incomingRuntimeWithOutboundPlan.reasonCodes.join('|')
    === 'input.cross_system_coordination.unexpected',
'An incoming-only Caption support job cannot smuggle an outbound coordination plan.')
const runtimeCallCandidate = createCaptionsHarnessCall({
  callId: 'caption.living-frame.runtime.cap12',
  jobType: 'plan_caption_to_visual_handoff',
  scopeLevel: 'boundary',
  approvedSnapshotRef: lfRequest.canonicalScope.approvedSnapshotRef,
  outputId: lfRequest.canonicalScope.outputId,
  sceneId: lfRequest.canonicalScope.sceneId,
  boundaryId: skillScope.boundaryId,
  runtimeProfile: 'cross_system_integration',
  inputArtifactTypes: [
    'canonical_transcript',
    'confirmed_output_frame',
    'master_timing_or_planning_timing',
  ],
})
runtimeCallCandidate.canonicalScope = {
  ...runtimeCallCandidate.canonicalScope,
  ownerUserId: lfRequest.canonicalScope.ownerUserId,
  workspaceId: lfRequest.canonicalScope.workspaceId,
  projectId: lfRequest.canonicalScope.projectId,
  editSessionId: lfRequest.canonicalScope.editSessionId,
  approvedSnapshotRef: structuredClone(
    lfRequest.canonicalScope.approvedSnapshotRef),
  outputId: lfRequest.canonicalScope.outputId,
  sceneId: lfRequest.canonicalScope.sceneId,
  authorizedFrameRanges: structuredClone(
    lfRequest.canonicalScope.authorizedFrameRanges),
}
runtimeCallCandidate.inputArtifactRefs =
  runtimeCallCandidate.inputArtifactRefs.map((artifact) => {
    if (artifact.artifactType === 'canonical_transcript') {
      return { ...artifact, ...lfRequest.canonicalTranscript.artifactRef }
    }
    if (artifact.artifactType === 'confirmed_output_frame') {
      return { ...artifact, ...CAP_11_CONFIRMED_FRAME_REF }
    }
    if (artifact.artifactType === 'master_timing_or_planning_timing') {
      return { ...artifact, ...lfRequest.timing.masterTimingRef }
    }
    return artifact
  })
const runtimeCall = parseOrchestraSkillCall(withDigest({
  ...runtimeCallCandidate,
  callDigestSha256: '',
}, 'callDigestSha256'))
const wrongScopeRuntimeCall = structuredClone(runtimeCall)
wrongScopeRuntimeCall.job.scopeLevel = 'scene'
wrongScopeRuntimeCall.canonicalScope.boundaryId = null
const wrongScopeRuntimeResult = runCaptionsSpecialistJob({
  call: parseOrchestraSkillCall(withDigest({
    ...wrongScopeRuntimeCall,
    callDigestSha256: '',
  }, 'callDigestSha256')),
  livingFrameRequest: lfRequest,
})
check(wrongScopeRuntimeResult.disposition === 'blocked'
  && wrongScopeRuntimeResult.reasonCodes.join('|') === 'manifest.scope.blocked',
'The boundary-only aggregate handoff job rejects a scene-scoped assignment.')
const runtimeInitial = runCaptionsSpecialistJob({
  call: runtimeCall,
  livingFrameRequest: lfRequest,
})
check(runtimeInitial.disposition === 'needs_followup'
  && runtimeInitial.supportRequests.length === 1
  && runtimeInitial.supportRequests[0].targetSkillKey === 'living_frame'
  && runtimeInitial.supportRequests[0].typedPayloadType
    === CAPTION_LIVING_FRAME_REQUEST_V2_VERSION
  && runtimeInitial.supportRequests[0].requestedArtifactTypes.join('|')
    === 'living_frame_caption_direction_response',
'The runtime emits the exact Caption-owned Living Frame V2 request.')
const runtimeSupportRequest = runtimeInitial.supportRequests[0]
const runtimeOriginRef: CaptionDomainRef = {
  id: runtimeCall.callId,
  version: runtimeCall.schemaVersion,
  contentHash: runtimeCall.callDigestSha256,
}
const runtimeOutboundPayloads = outboundFixtureSpecs.map((spec) =>
  createOutboundPayload(
    spec,
    runtimeOriginRef,
    'caption.cross-system.payload.cap12.runtime',
  ))
const runtimeOutboundBundles = runtimeOutboundPayloads.map(
  (outboundPayload) => {
    const supportRequest = outboundPayload.receiver === 'living_frame'
      ? runtimeSupportRequest
      : outboundPayload.sharedTargetAdmission.targetSkillKey === null
        ? undefined
        : createSupportRequest({
            id: `support.cap12.runtime.${outboundPayload.receiver}`,
            target: outboundPayload.sharedTargetAdmission.targetSkillKey,
            typedPayloadType: outboundPayload.schemaVersion,
            typedPayload: outboundPayload,
            artifactTypes: outboundPayload.requestedReceivingCapability
              .expectedArtifactTypes,
            originalCallRef: runtimeOriginRef,
            canonicalScope: runtimeCall.canonicalScope,
          })
    const frozen = frozenCompatibilityHandoff(outboundPayload.receiver)
    const frozenSupport = frozenCompatibilitySupportRequest(
      outboundPayload.receiver)
    const handoff = createCaptionCrossSystemHandoffV2({
      handoffId:
        `caption.cross-system.handoff.cap12.runtime.${outboundPayload.receiver}`,
      outboundPayload,
      ...(supportRequest === undefined ? {} : { supportRequest }),
      frozenCompatibilityHandoff: frozen,
      ...(frozenSupport === undefined ? {} : {
        frozenCompatibilitySupportRequest: frozenSupport,
      }),
      resolution,
      sceneGraph: graph,
    })
    return {
      handoff,
      outboundPayload,
      ...(supportRequest === undefined ? {} : { supportRequest }),
      frozenCompatibilityHandoff: frozen,
      ...(frozenSupport === undefined ? {} : {
        frozenCompatibilitySupportRequest: frozenSupport,
      }),
    }
  })
const runtimeCoordinationContext = {
  sceneGraph: graph,
  motionPlan: plan,
  resolution,
  outboundBundles: runtimeOutboundBundles,
  incomingBundles,
}
const runtimeCoordinationPlan = createCaptionCrossSystemCoordinationPlan({
  planId: 'caption.cross-system.coordination.cap12.runtime',
  context: runtimeCoordinationContext,
})
const runtimeResumedCandidate = resumeCaptionsHarnessCall(
  runtimeCall, runtimeSupportRequest)
runtimeResumedCandidate.injectedSupportArtifactRefs[0] = {
  ...runtimeResumedCandidate.injectedSupportArtifactRefs[0],
  id: lfResponse.responseId,
  version: lfResponse.schemaVersion,
  contentHash: lfResponse.responseDigestSha256,
  artifactType: 'living_frame_caption_direction_response',
  producerSkillKey: 'living_frame',
}
const runtimeResumedCall = parseOrchestraSkillCall(withDigest({
  ...runtimeResumedCandidate,
  callDigestSha256: '',
}, 'callDigestSha256'))
const missingRuntimeCoordination = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  livingFrameRequest: lfRequest,
  livingFrameResponse: lfResponse,
})
check(missingRuntimeCoordination.disposition === 'blocked'
  && missingRuntimeCoordination.reasonCodes.join('|')
    === 'input.cross_system_coordination.plan_or_context.missing',
'A V3 cross-system Caption job cannot complete from schemas without its exact coordination artifacts.')
const runtimeAdmission = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  livingFrameRequest: lfRequest,
  livingFrameResponse: lfResponse,
  crossSystemCoordinationPlan: runtimeCoordinationPlan,
  crossSystemCoordinationContext: runtimeCoordinationContext,
})
check(runtimeAdmission.disposition === 'completed'
  && runtimeAdmission.reasonCodes.includes(
    'living_frame.contract_admission.accepted')
  && runtimeAdmission.reasonCodes.includes(
    'cross_system_coordination.caption_artifacts.accepted')
  && runtimeAdmission.producedArtifactRefs.filter((artifact) =>
    artifact.artifactType === 'caption_cross_system_outbound_payload')
    .length === 8
  && runtimeAdmission.producedArtifactRefs.filter((artifact) =>
    artifact.artifactType === 'caption_cross_system_handoff').length === 8
  && runtimeAdmission.producedArtifactRefs.filter((artifact) =>
    artifact.artifactType === 'caption_cross_system_coordination_plan')
    .length === 1
  && runtimeAdmission.producedArtifactRefs.filter((artifact) =>
    artifact.artifactType.startsWith('caption_cross_system_'))
    .every((artifact) => artifact.producerSkillKey === 'captions'
      && artifact.privateArtifact
      && artifact.byteFreeRef
      && artifact.sourceSupportRequestRef === null),
'The exact Living Frame response admits the Caption job and emits the complete private coordination surface.')
const crossedRuntimeCoordination = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  livingFrameRequest: lfRequest,
  livingFrameResponse: lfResponse,
  crossSystemCoordinationPlan: coordinationPlan,
  crossSystemCoordinationContext: coordinationContext,
})
check(crossedRuntimeCoordination.disposition === 'blocked'
  && crossedRuntimeCoordination.reasonCodes.join('|')
    === 'input.cross_system_coordination.call_or_scope.mismatch',
'A digest-valid coordination plan from another Caption call fails closed.')
const transitionJobCandidate = createCaptionsHarnessCall({
  callId: 'caption.transition-support.runtime.cap12',
  jobType: 'provide_typographic_transition_support',
  scopeLevel: 'boundary',
  approvedSnapshotRef: graph.canonicalScope.approvedSnapshotRef,
  outputId: graph.canonicalScope.outputId,
  sceneId: graph.canonicalScope.sceneId,
  boundaryId: skillScope.boundaryId,
  runtimeProfile: 'cross_system_integration',
  inputArtifactTypes: [
    'canonical_transcript',
    'confirmed_output_frame',
    'master_timing_or_planning_timing',
    'caption_sound_support_result',
  ],
})
transitionJobCandidate.canonicalScope = structuredClone(skillScope)
transitionJobCandidate.inputArtifactRefs =
  transitionJobCandidate.inputArtifactRefs.map((artifact) => {
    if (artifact.artifactType === 'canonical_transcript') {
      return { ...artifact, ...CAP_11_TRANSCRIPT_REF }
    }
    if (artifact.artifactType === 'confirmed_output_frame') {
      return { ...artifact, ...CAP_11_CONFIRMED_FRAME_REF }
    }
    if (artifact.artifactType === 'master_timing_or_planning_timing') {
      return { ...artifact, ...CAP_11_MASTER_TIMING_REF }
    }
    return artifact
  })
const transitionJobCall = parseOrchestraSkillCall(withDigest({
  ...transitionJobCandidate,
  callDigestSha256: '',
}, 'callDigestSha256'))
const transitionOriginRef: CaptionDomainRef = {
  id: transitionJobCall.callId,
  version: transitionJobCall.schemaVersion,
  contentHash: transitionJobCall.callDigestSha256,
}
const transitionSpec = outboundFixtureSpecs.find((spec) =>
  spec.receiver === 'transitions')!
const transitionPayload = createOutboundPayload(
  transitionSpec,
  transitionOriginRef,
  'caption.cross-system.payload.cap12.single',
)
const transitionSupportRequest = createSupportRequest({
  id: 'support.cap12.single.transitions',
  target: 'transitions',
  typedPayloadType: transitionPayload.schemaVersion,
  typedPayload: transitionPayload,
  artifactTypes:
    transitionPayload.requestedReceivingCapability.expectedArtifactTypes,
  originalCallRef: transitionOriginRef,
  canonicalScope: transitionJobCall.canonicalScope,
})
const transitionHandoff = createCaptionCrossSystemHandoffV2({
  handoffId: 'caption.cross-system.handoff.cap12.single.transitions',
  outboundPayload: transitionPayload,
  supportRequest: transitionSupportRequest,
  frozenCompatibilityHandoff: frozenCompatibilityHandoff('transitions'),
  frozenCompatibilitySupportRequest:
    frozenCompatibilitySupportRequest('transitions'),
  resolution,
  sceneGraph: graph,
})
const transitionHandoffContext = {
  sceneGraph: graph,
  resolution,
  outboundPayload: transitionPayload,
  supportRequest: transitionSupportRequest,
  frozenCompatibilityHandoff: frozenCompatibilityHandoff('transitions'),
  frozenCompatibilitySupportRequest:
    frozenCompatibilitySupportRequest('transitions'),
}
const transitionJobResult = runCaptionsSpecialistJob({
  call: transitionJobCall,
  crossSystemOutboundHandoff: transitionHandoff,
  crossSystemOutboundHandoffContext: transitionHandoffContext,
})
check(transitionJobResult.disposition === 'completed'
  && transitionJobResult.producedArtifactRefs.filter((artifact) =>
    artifact.artifactType === 'caption_cross_system_outbound_payload'
      || artifact.artifactType === 'caption_cross_system_handoff').length === 2,
'A single transition-support assignment emits only its exact Caption-owned payload and handoff.')
const brollSpec = outboundFixtureSpecs.find((spec) =>
  spec.receiver === 'broll_owner')!
const crossedReceiverPayload = createOutboundPayload(
  brollSpec,
  transitionOriginRef,
  'caption.cross-system.payload.cap12.crossed-receiver',
)
const crossedReceiverSupport = createSupportRequest({
  id: 'support.cap12.single.crossed-receiver',
  target: 'broll_owner',
  typedPayloadType: crossedReceiverPayload.schemaVersion,
  typedPayload: crossedReceiverPayload,
  artifactTypes:
    crossedReceiverPayload.requestedReceivingCapability.expectedArtifactTypes,
  originalCallRef: transitionOriginRef,
  canonicalScope: transitionJobCall.canonicalScope,
})
const crossedReceiverHandoff = createCaptionCrossSystemHandoffV2({
  handoffId: 'caption.cross-system.handoff.cap12.crossed-receiver',
  outboundPayload: crossedReceiverPayload,
  supportRequest: crossedReceiverSupport,
  frozenCompatibilityHandoff: null,
  resolution,
  sceneGraph: graph,
})
const crossedReceiverResult = runCaptionsSpecialistJob({
  call: transitionJobCall,
  crossSystemOutboundHandoff: crossedReceiverHandoff,
  crossSystemOutboundHandoffContext: {
    sceneGraph: graph,
    resolution,
    outboundPayload: crossedReceiverPayload,
    supportRequest: crossedReceiverSupport,
    frozenCompatibilityHandoff: null,
  },
})
check(crossedReceiverResult.disposition === 'blocked'
  && crossedReceiverResult.reasonCodes.join('|')
    === 'input.cross_system_handoff.call_scope_or_receiver.mismatch',
'A digest-valid B-roll handoff cannot satisfy a Transition-only Caption job.')
const missingRuntimeResponse = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  livingFrameRequest: lfRequest,
})
check(missingRuntimeResponse.disposition === 'blocked'
  && missingRuntimeResponse.reasonCodes.join('|')
    === 'input.living_frame.response.admission.failed',
'A Living Frame response reference alone cannot satisfy Caption admission.')
const referenceOnlyInitial = runCaptionsSpecialistJob({ call: runtimeCall })
const referenceOnlyRequest = referenceOnlyInitial.supportRequests[0]
const referenceOnlyCall = resumeCaptionsHarnessCall(
  runtimeCall, referenceOnlyRequest)
const referenceOnlyResult = runCaptionsSpecialistJob({
  call: referenceOnlyCall,
  resumeSupportRequest: referenceOnlyRequest,
})
check(referenceOnlyResult.disposition === 'blocked'
  && referenceOnlyResult.reasonCodes.join('|')
    === 'input.living_frame.request.missing',
'A CAP-11 receipt reference cannot impersonate the exact Living Frame request.')
const crossedRuntimeResponse = structuredClone(lfResponse)
crossedRuntimeResponse.canonicalScope.sceneId = 'scene.living-frame.crossed'
const crossedRuntimeAdmission = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  livingFrameRequest: lfRequest,
  livingFrameResponse: withDigest({
    ...crossedRuntimeResponse,
    responseDigestSha256: '',
  }, 'responseDigestSha256'),
})
check(crossedRuntimeAdmission.disposition === 'blocked'
  && crossedRuntimeAdmission.reasonCodes.join('|')
    === 'input.living_frame.response.admission.failed',
'A digest-valid cross-scene Living Frame response fails Caption admission.')
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
check(coordinationPlan.receiverCoverage.length === 8
  && new Set(coordinationPlan.receiverCoverage).size === 8,
  'The additive CAP-12 layer must cover all eight required receiver families.')
check(coordinationPlan.counts.outboundHandoffs === 8
  && coordinationPlan.counts.admittedOutboundSupportRequests === 3
  && coordinationPlan.counts.pendingSharedTargetRegistrations === 5,
  'The coordination ledger must distinguish admitted envelopes from future registry targets.')
check(coordinationPlan.pendingSharedTargetReceivers.join('|')
  === 'graphic|map|chart|diagram|stroke_motion'
  && !coordinationPlan.futureOrchestraTargetRegistryComplete,
  'Unregistered receiver targets must return to HQ without inventing peer dispatch.')
check(coordinationPlan.counts.incomingTypographyRequests === 2
  && incomingBundles.every((bundle) =>
    bundle.supportRequest.targetSkillKey === 'captions'
      && bundle.supportRequest.mediationPolicy.hqMediated),
  'Living Frame and Transition typography requests must enter through mediated Caption support.')
check(outboundPayloads.every((payload) =>
  payload.returnToHq.dispositionBeforeReceiverResult === 'needs_followup'
    && payload.requiredEvidence.exactReceiverResultMustBeInjected
    && !payload.returnToHq.directPeerDispatchAllowed),
  'Every outbound handoff must wait for exact HQ-injected receiver evidence.')
check(outboundPayloads.find((payload) => payload.receiver === 'map')!
  .semantic.sourceTruthPolicy === 'exact_geography_source_required'
  && outboundPayloads.find((payload) => payload.receiver === 'chart')!
    .semantic.sourceTruthPolicy === 'exact_data_source_required'
  && outboundPayloads.find((payload) => payload.receiver === 'broll_owner')!
    .semantic.sourceTruthPolicy === 'exact_selected_media_required',
  'Map, chart, and B-roll handoffs must preserve their exact source-truth owners.')
check(['living_frame', 'transitions'].every((receiver) =>
  outboundBundlesV2.find((bundle) =>
    bundle.outboundPayload.receiver === receiver)!
    .handoff.frozenCompatibilityHandoffRef !== null),
  'The V2 Living Frame and Transition receipts must bind their frozen V1 handoffs instead of replacing them.')
check(registration.registrations.filter((entry) =>
  entry.semanticEventIntents.includes('handoff')).every((entry) =>
    entry.semanticEventIntents.includes('restore')),
  'Every registered handoff node must also register Caption restoration timing.')
check(!coordinationPlan.receiverExecutionClaimed
  && !coordinationPlan.runtimeExecutionGranted
  && !coordinationPlan.finalQaApprovalGranted
  && !coordinationPlan.productionAuthorityGranted,
  'The full handoff surface must retain every receiver and release authority boundary.')

const wrongGraphicSkill = structuredClone(outboundPayloads.find((payload) =>
  payload.receiver === 'graphic')!)
wrongGraphicSkill.receiverSkillId = 'graphics.map_route_visual'
wrongGraphicSkill.payloadDigestSha256 = digest(
  wrongGraphicSkill as unknown as Record<string, unknown>,
  'payloadDigestSha256')
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  wrongGraphicSkill, { resolution, sceneGraph: graph }))

const falseMapTruth = structuredClone(outboundPayloads.find((payload) =>
  payload.receiver === 'map')!)
falseMapTruth.semantic.sourceTruthPolicy = 'canonical_transcript_lineage'
falseMapTruth.payloadDigestSha256 = digest(
  falseMapTruth as unknown as Record<string, unknown>,
  'payloadDigestSha256')
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  falseMapTruth, { resolution, sceneGraph: graph }))

const credentialShapedPurpose = structuredClone(outboundPayloads.find((payload) =>
  payload.receiver === 'graphic')!)
credentialShapedPurpose.semantic.purposeCode = 'password:supersecret'
credentialShapedPurpose.payloadDigestSha256 = digest(
  credentialShapedPurpose as unknown as Record<string, unknown>,
  'payloadDigestSha256')
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  credentialShapedPurpose, { resolution, sceneGraph: graph }))

const substitutedSourceWords = structuredClone(outboundPayloads.find((payload) =>
  payload.receiver === 'graphic')!)
substitutedSourceWords.exactSourceWordIds[0] = 'word.unrelated'
substitutedSourceWords.payloadDigestSha256 = digest(
  substitutedSourceWords as unknown as Record<string, unknown>,
  'payloadDigestSha256')
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  substitutedSourceWords, { resolution, sceneGraph: graph }))

const substitutedAccessibleCounterpart = structuredClone(
  outboundPayloads.find((payload) => payload.receiver === 'graphic')!)
substitutedAccessibleCounterpart.accessibility.counterpartNodeIds = [
  substitutedAccessibleCounterpart.sourceNodeId,
]
substitutedAccessibleCounterpart.payloadDigestSha256 = digest(
  substitutedAccessibleCounterpart as unknown as Record<string, unknown>,
  'payloadDigestSha256')
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  substitutedAccessibleCounterpart, { resolution, sceneGraph: graph }))

const graphicBundle = outboundBundlesV2.find((bundle) =>
  bundle.outboundPayload.receiver === 'graphic')!
const crossedMotionPayload = structuredClone(graphicBundle.outboundPayload)
crossedMotionPayload.sourceCaptionMotionPlanRef = ref('caption.motion.crossed')
crossedMotionPayload.payloadDigestSha256 = digest(
  crossedMotionPayload as unknown as Record<string, unknown>,
  'payloadDigestSha256')
const crossedMotionHandoff = structuredClone(graphicBundle.handoff)
crossedMotionHandoff.outboundPayloadRef =
  captionCrossSystemOutboundPayloadRef(crossedMotionPayload)
crossedMotionHandoff.handoffDigestSha256 = digest(
  crossedMotionHandoff as unknown as Record<string, unknown>,
  'handoffDigestSha256')
const crossedMotionContext = {
  ...coordinationContext,
  outboundBundles: coordinationContext.outboundBundles.map((bundle) =>
    bundle.outboundPayload.receiver === 'graphic' ? {
      handoff: crossedMotionHandoff,
      outboundPayload: crossedMotionPayload,
      frozenCompatibilityHandoff: null,
    } : bundle),
}
expectThrow(() => createCaptionCrossSystemCoordinationPlan({
  planId: 'caption.cross-system.coordination.cap12.crossed-motion',
  context: crossedMotionContext,
}))

const brollOwnershipTakeover = structuredClone(outboundPayloads.find((payload) =>
  payload.receiver === 'broll_owner')!)
brollOwnershipTakeover.informationOwnership.transferRequested = true
brollOwnershipTakeover.informationOwnership.ownerAfterAcceptedHandoff = 'b_roll'
brollOwnershipTakeover.fallback.restoreCreativeCaption = true
brollOwnershipTakeover.payloadDigestSha256 = digest(
  brollOwnershipTakeover as unknown as Record<string, unknown>,
  'payloadDigestSha256')
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  brollOwnershipTakeover, { resolution, sceneGraph: graph }))

const mapBundle = outboundBundlesV2.find((bundle) =>
  bundle.outboundPayload.receiver === 'map')!
const inventedMapSupport = createSupportRequest({
  id: 'support.cap12.v2.map.invented-owner',
  target: 'canonical_layout_owner',
  typedPayloadType: mapBundle.outboundPayload.schemaVersion,
  typedPayload: mapBundle.outboundPayload,
  artifactTypes:
    mapBundle.outboundPayload.requestedReceivingCapability.expectedArtifactTypes,
})
const mapPeerDispatch = structuredClone(mapBundle.handoff)
mapPeerDispatch.coordinationState = 'support_request_ready'
mapPeerDispatch.supportRequestRef = {
  id: inventedMapSupport.requestId,
  version: inventedMapSupport.schemaVersion,
  contentHash: inventedMapSupport.requestDigestSha256,
}
mapPeerDispatch.handoffDigestSha256 = digest(
  mapPeerDispatch as unknown as Record<string, unknown>,
  'handoffDigestSha256')
expectThrow(() => parseCaptionCrossSystemHandoffV2(mapPeerDispatch, {
  resolution,
  sceneGraph: graph,
  outboundPayload: mapBundle.outboundPayload,
  supportRequest: inventedMapSupport,
}))

const transitionBundle = outboundBundlesV2.find((bundle) =>
  bundle.outboundPayload.receiver === 'transitions')!
const unboundTransitionCompatibility = structuredClone(transitionBundle.handoff)
unboundTransitionCompatibility.frozenCompatibilityHandoffRef = null
unboundTransitionCompatibility.handoffDigestSha256 = digest(
  unboundTransitionCompatibility as unknown as Record<string, unknown>,
  'handoffDigestSha256')
expectThrow(() => parseCaptionCrossSystemHandoffV2(
  unboundTransitionCompatibility, {
    resolution,
    sceneGraph: graph,
    outboundPayload: transitionBundle.outboundPayload,
    supportRequest: transitionBundle.supportRequest,
    frozenCompatibilityHandoff:
      transitionBundle.frozenCompatibilityHandoff,
    frozenCompatibilitySupportRequest:
      transitionBundle.frozenCompatibilitySupportRequest,
  }))

const requesterTakeover = structuredClone(incomingPayloads[0])
requesterTakeover.requesterSkillId = 'motion.transition_language'
requesterTakeover.requestDigestSha256 = digest(
  requesterTakeover as unknown as Record<string, unknown>,
  'requestDigestSha256')
expectThrow(() => parseCaptionIncomingTypographyRequest(
  requesterTakeover, { resolution, sceneGraph: graph }))

const incomingWithoutHandoffEvent = structuredClone(incomingPayloads[0])
incomingWithoutHandoffEvent.requestedEventRefs = [
  eventRefFor(incomingWithoutHandoffEvent.sourceNodeId, 'restore'),
]
incomingWithoutHandoffEvent.requestDigestSha256 = digest(
  incomingWithoutHandoffEvent as unknown as Record<string, unknown>,
  'requestDigestSha256')
expectThrow(() => parseCaptionIncomingTypographyRequest(
  incomingWithoutHandoffEvent, { resolution, sceneGraph: graph }))

const crossedIncomingSupport = structuredClone(incomingBundles[0].supportRequest)
crossedIncomingSupport.typedPayload = incomingPayloads[1]
crossedIncomingSupport.requestDigestSha256 =
  calculateSkillSupportRequestV2Digest({
    ...crossedIncomingSupport,
    requestDigestSha256: '',
  })
expectThrow(() => parseCaptionIncomingTypographySupportBundle({
  payload: incomingPayloads[0],
  supportRequest: crossedIncomingSupport,
  sceneGraph: graph,
  resolution,
}))

const duplicateCoordinationRef = structuredClone(coordinationPlan)
duplicateCoordinationRef.outboundHandoffRefs.push(
  duplicateCoordinationRef.outboundHandoffRefs[0]!)
duplicateCoordinationRef.counts.outboundHandoffs += 1
duplicateCoordinationRef.planDigestSha256 = digest(
  duplicateCoordinationRef as unknown as Record<string, unknown>,
  'planDigestSha256')
expectThrow(() => parseCaptionCrossSystemCoordinationPlan(
  duplicateCoordinationRef, coordinationContext))

expectThrow(() => createCaptionCrossSystemCoordinationPlan({
  planId: 'caption.cross-system.coordination.cap12.missing-receiver',
  context: {
    ...coordinationContext,
    outboundBundles: coordinationContext.outboundBundles.slice(0, -1),
  },
}))

expectThrow(() => createCaptionCrossSystemCoordinationPlan({
  planId: 'caption.cross-system.coordination.cap12.missing-requester',
  context: {
    ...coordinationContext,
    incomingBundles: coordinationContext.incomingBundles.slice(0, 1),
  },
}))

const outboundAuthorityOverclaim = structuredClone(outboundPayloads[0])
outboundAuthorityOverclaim.authorityBoundary.runtimeExecutionGranted = true as false
outboundAuthorityOverclaim.payloadDigestSha256 = digest(
  outboundAuthorityOverclaim as unknown as Record<string, unknown>,
  'payloadDigestSha256')
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  outboundAuthorityOverclaim, { resolution, sceneGraph: graph }))

const inheritedOutboundPayload = Object.create(outboundPayloads[0]) as
  CaptionCrossSystemOutboundPayloadV2
expectThrow(() => parseCaptionCrossSystemOutboundPayloadV2(
  inheritedOutboundPayload, { resolution, sceneGraph: graph }))

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
  additiveV2ReceiverCoverage: coordinationPlan.receiverCoverage,
  additiveV2OutboundHandoffs: coordinationPlan.counts.outboundHandoffs,
  additiveV2AdmittedSupportRequests:
    coordinationPlan.counts.admittedOutboundSupportRequests,
  additiveV2PendingFutureTargets:
    coordinationPlan.pendingSharedTargetReceivers,
  incomingTypographyRequests:
    coordinationPlan.counts.incomingTypographyRequests,
  captionOwnedFullHandoffSurfaceComplete:
    coordinationPlan.captionOwnedHandoffSurfaceComplete,
  futureOrchestraTargetRegistryComplete:
    coordinationPlan.futureOrchestraTargetRegistryComplete,
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
