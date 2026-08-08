import type {
  CaptionCrossSystemReceiverV2,
  CaptionIncomingTypographyRequest,
} from '../../src/types/caption-cross-system-coordination'
import {
  CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
  type CaptionLivingFrameRequestV2,
} from '../../src/types/caption-living-frame-boundary'
import {
  CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION,
} from '../../src/types/caption-cross-system-coordination'
import type {
  OrchestraSkillCall,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { SKILL_SUPPORT_REQUEST_VERSION } from
  '../../src/types/orchestra-skill-contracts'
import {
  CAPTION_CROSS_SYSTEM_HANDOFF_VERSION,
  CAPTION_MOTION_PLAN_VERSION,
  type CaptionCrossSystemHandoff,
  type CaptionMotionPlan,
} from '../../src/types/caption-storytiming-motion'
import {
  SKILL_SUPPORT_REQUEST_VERSION_V2,
  type SkillSupportRequestV2,
} from '../../src/types/orchestra-skill-support-request-v2'
import type { CaptionDomainCanonicalScope, CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import {
  createCaptionCrossSystemCoordinationPlan,
  createCaptionCrossSystemHandoffV2,
  createCaptionCrossSystemOutboundPayloadV2,
  parseCaptionIncomingTypographyRequest,
} from '../captions-specialist/caption-cross-system-coordination'
import { parseCaptionLivingFrameRequestV2 } from
  '../captions-specialist/caption-living-frame-boundary'
import { parseCaptionMultiTrackSceneGraph } from
  '../captions-specialist/caption-multi-track-scene-graph'
import { parseCaptionCrossSystemHandoff } from
  '../captions-specialist/caption-storytiming-motion'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  calculateSkillSupportRequestV2Digest,
  parseSkillSupportRequestV2,
} from '../orchestra/orchestra-skill-support-request-v2'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import { CAP_11_SCENE_GRAPH_FIXTURE } from
  './captions-specialist-cap-11-smoke'
import { CAP_12_STORYTIMING_RESOLUTION_FIXTURE } from
  './captions-specialist-cap-12-smoke'

function skillCallRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function requiredCallArtifactRef(
  call: OrchestraSkillCall,
  artifactType: string,
): SkillContractRef {
  const matches = call.inputArtifactRefs.filter((artifact) =>
    artifact.artifactType === artifactType)
  if (matches.length !== 1) {
    throw new Error(`Expected one ${artifactType} Caption call artifact.`)
  }
  const match = matches[0]!
  return {
    id: match.id,
    version: match.version,
    contentHash: match.contentHash,
  }
}

/**
 * Deterministic byte-free source fixture for the canonical persistence and
 * resume smokes. Production code still rereads Caption-owned artifacts through
 * its admitted source port; this helper never creates receiver execution.
 */
export function createCanonicalCaptionBrollCrossSystemSourceFixture(
  call: OrchestraSkillCall,
  planVersionId: string,
) {
  return createCanonicalCaptionCrossSystemSourceFixture(
    call, planVersionId, 'broll_owner')
}

export function createCanonicalCaptionTransitionCrossSystemSourceFixture(
  call: OrchestraSkillCall,
  planVersionId: string,
) {
  return createCanonicalCaptionCrossSystemSourceFixture(
    call, planVersionId, 'transitions')
}

export function createCanonicalCaptionLivingFrameCrossSystemSourceFixture(
  call: OrchestraSkillCall,
  planVersionId: string,
) {
  return createCanonicalCaptionCrossSystemSourceFixture(
    call, planVersionId, 'living_frame')
}

export function createCanonicalCaptionMapCrossSystemSourceFixture(
  call: OrchestraSkillCall,
  planVersionId: string,
) {
  return createCanonicalCaptionCrossSystemSourceFixture(
    call, planVersionId, 'map')
}

/**
 * Produces the complete eight-receiver, two-requester coordination surface
 * required by the aggregate Caption handoff job. This remains a byte-free
 * source-contract fixture: it neither dispatches a receiver nor claims that
 * any receiver executed the handoff.
 */
export function createCanonicalCaptionAggregateCrossSystemSourceFixture(
  call: OrchestraSkillCall,
  planVersionId: string,
) {
  const seed = createCanonicalCaptionMapCrossSystemSourceFixture(
    call, planVersionId)
  const sceneGraph = structuredClone(seed.outboundHandoffContext.sceneGraph)
  const resolution = structuredClone(seed.outboundHandoffContext.resolution)
  const callRef = skillCallRef(call)
  const canonicalTranscriptRef = requiredCallArtifactRef(
    call, 'canonical_transcript')
  const sourceCaptionPlanRef = {
    id: `caption.cross-system.plan.${call.callDigestSha256.slice(0, 32)}`,
    version: 'caption-direction-plan-v1',
    contentHash: sha256AuthorityValue({
      callDigestSha256: call.callDigestSha256,
      kind: 'caption-plan',
    }),
  }
  const sceneGraphRef = {
    id: sceneGraph.graphId,
    version: sceneGraph.schemaVersion,
    contentHash: sceneGraph.graphDigestSha256,
  }
  const motionWithoutDigest: Omit<CaptionMotionPlan,
    'planDigestSha256'> = {
    schemaVersion: CAPTION_MOTION_PLAN_VERSION,
    planId: `caption.cross-system.motion.${
      call.callDigestSha256.slice(0, 32)}`,
    canonicalScope: structuredClone(sceneGraph.canonicalScope),
    sceneGraphRef,
    storyTimingRegistrationRef: fixtureRef(
      `caption.cross-system.registration.${call.callDigestSha256.slice(0, 24)}`,
      'caption-story-timing-registration-v1',
      { callDigestSha256: call.callDigestSha256, kind: 'registration' },
    ),
    storyTimingResolutionRef: {
      id: resolution.resolutionId,
      version: resolution.schemaVersion,
      contentHash: resolution.resolutionDigestSha256,
    },
    confirmedOutputFrameRef:
      structuredClone(resolution.confirmedOutputFrameRef),
    primitives: [],
    effectiveReadReportRef: fixtureRef(
      `caption.cross-system.read-report.${call.callDigestSha256.slice(0, 24)}`,
      'caption-effective-read-report-v1',
      { callDigestSha256: call.callDigestSha256, kind: 'read-report' },
    ),
    handoffs: [],
    cameraRequests: [],
    supportRequests: [],
    reducedMotionComplete: true,
    repetitionLimitApplied: true,
    sharedAttentionBudgetApplied: true,
    modelAuthoredCodeIncluded: false,
    storyTimingSoleFrameAuthority: true,
    remotionRemainsFinalCanvas: true,
    runtimeExecutionGranted: false,
    finalQaApprovalGranted: false,
    productionAuthorityGranted: false,
  }
  const motionPlan: CaptionMotionPlan = {
    ...motionWithoutDigest,
    planDigestSha256: calculateSkillContractDigest(
      { ...motionWithoutDigest, planDigestSha256: '' } as unknown as Record<
        string, unknown
      >,
      'planDigestSha256',
    ),
  }
  const sourceCaptionMotionPlanRef = {
    id: motionPlan.planId,
    version: motionPlan.schemaVersion,
    contentHash: motionPlan.planDigestSha256,
  }
  const receivers: readonly CaptionCrossSystemReceiverV2[] = [
    'living_frame', 'transitions', 'graphic', 'map', 'chart', 'diagram',
    'broll_owner', 'stroke_motion',
  ]
  const sourceNode = sceneGraph.nodes.find((node) =>
    node.nodeId === 'node.creative.phrase.cap11.list')
  if (!sourceNode) {
    throw new Error('Aggregate cross-system fixture source node is missing.')
  }
  const outboundBundles = receivers.map((receiver) => {
    const expectedArtifactType = receiverExpectedArtifactType(receiver)
    const transferRequested = receiver !== 'transitions'
      && receiver !== 'broll_owner'
    const outboundPayload = createCaptionCrossSystemOutboundPayloadV2({
      payloadId: `caption.cross-system.aggregate.payload.${receiver}.${
        call.callDigestSha256.slice(0, 24)}`,
      originCaptionCallRef: callRef,
      receiver,
      sourceCaptionPlanRef,
      sourceCaptionMotionPlanRef,
      canonicalTranscriptRef,
      sourceNodeId: sourceNode.nodeId,
      sourcePhraseId: sourceNode.phraseId,
      semantic: {
        conceptId: `concept.caption.aggregate.${receiver}`,
        purposeCode: `coordinate_caption_handoff_${receiver}`,
        visualVerbCode: transferRequested ? 'transform' : 'coordinate',
        sourceTruthPolicy: receiverSourceTruthPolicy(receiver),
      },
      requestedReceivingCapability: {
        capabilityCode: receiverCapabilityCode(receiver),
        expectedArtifactTypes: [expectedArtifactType],
      },
      expectedVisualResultCode:
        `expected.${receiver}.caption-meaning-preserved`,
      transferRequested,
      soundIntent: {
        policy: receiver === 'stroke_motion'
          ? 'sound_optional' : 'sound_forbidden',
        captionSoundRequestRef: null,
      },
      fallback: {
        ladderCodes: [
          `fallback.${receiver}.stable-caption`,
          'fallback.accessible-sidecar',
        ],
        selectedDefaultCode: `fallback.${receiver}.stable-caption`,
      },
      requiredEvidence: {
        artifactTypes: [expectedArtifactType],
        qaCodes: [
          'semantic_timing_verified',
          'accessible_counterpart_preserved',
          'receiver_result_scope_verified',
        ],
      },
      resolution,
      sceneGraph,
    })
    const supportRequest = createOutboundSupportRequest(
      call, outboundPayload)
    const frozenCompatibility = receiver === 'transitions'
      ? createTransitionCompatibility({
          call,
          canonicalScope: sceneGraph.canonicalScope,
          resolution,
          sourceNode,
        })
      : receiver === 'living_frame' && supportRequest !== null
        ? createLivingFrameCompatibility({
            call,
            canonicalScope: sceneGraph.canonicalScope,
            resolution,
            sourceNode,
            supportRequest,
          })
      : null
    const handoff = createCaptionCrossSystemHandoffV2({
      handoffId: `caption.cross-system.aggregate.handoff.${receiver}.${
        call.callDigestSha256.slice(0, 24)}`,
      outboundPayload,
      ...(supportRequest === null ? {} : { supportRequest }),
      frozenCompatibilityHandoff: frozenCompatibility?.handoff ?? null,
      ...(frozenCompatibility === null ? {} : {
        frozenCompatibilitySupportRequest:
          frozenCompatibility.supportRequest,
      }),
      resolution,
      sceneGraph,
    })
    return {
      handoff,
      outboundPayload,
      ...(supportRequest === null ? {} : { supportRequest }),
      frozenCompatibilityHandoff: frozenCompatibility?.handoff ?? null,
      ...(frozenCompatibility === null ? {} : {
        frozenCompatibilitySupportRequest:
          frozenCompatibility.supportRequest,
      }),
    }
  })
  const incomingBundles = (['living_frame', 'transitions'] as const)
    .map((requester) => createAggregateIncomingBundle({
      call,
      requester,
      sceneGraph,
      resolution,
      sourceCaptionPlanRef,
      canonicalTranscriptRef,
      sourceNode,
    }))
  const coordinationContext = {
    sceneGraph,
    motionPlan,
    resolution,
    outboundBundles,
    incomingBundles,
  }
  const coordinationPlan = createCaptionCrossSystemCoordinationPlan({
    planId: `caption.cross-system.aggregate.plan.${
      call.callDigestSha256.slice(0, 24)}`,
    context: coordinationContext,
  })
  return {
    mode: 'aggregate_coordination_plan' as const,
    coordinationPlan,
    coordinationContext,
  }
}

function createCanonicalCaptionCrossSystemSourceFixture(
  call: OrchestraSkillCall,
  planVersionId: string,
  receiver: 'broll_owner' | 'transitions' | 'living_frame' | 'map',
) {
  const callRef = skillCallRef(call)
  const confirmedOutputFrameRef = requiredCallArtifactRef(
    call, 'confirmed_output_frame')
  const masterTimingRef = requiredCallArtifactRef(
    call, 'master_timing_or_planning_timing')
  const canonicalTranscriptRef = requiredCallArtifactRef(
    call, 'canonical_transcript')
  if (!call.canonicalScope.approvedSnapshotRef
    || !call.canonicalScope.outputId
    || !call.canonicalScope.sceneId) {
    throw new Error(
      'The cross-system fixture requires exact approved output and scene scope.',
    )
  }
  const canonicalScope = {
    ownerUserId: call.canonicalScope.ownerUserId,
    workspaceId: call.canonicalScope.workspaceId,
    projectId: call.canonicalScope.projectId,
    editSessionId: call.canonicalScope.editSessionId,
    planVersionId,
    approvedSnapshotRef:
      structuredClone(call.canonicalScope.approvedSnapshotRef),
    outputId: call.canonicalScope.outputId,
    sceneId: call.canonicalScope.sceneId,
    authorizedFrameRanges:
      structuredClone(call.canonicalScope.authorizedFrameRanges),
  }
  const graphCandidate = structuredClone(CAP_11_SCENE_GRAPH_FIXTURE)
  graphCandidate.graphId = `caption.cross-system.graph.${
    call.callDigestSha256.slice(0, 32)}`
  graphCandidate.canonicalScope = canonicalScope
  graphCandidate.confirmedOutputFrameRef = confirmedOutputFrameRef
  graphCandidate.graphDigestSha256 = calculateSkillContractDigest(
    { ...graphCandidate, graphDigestSha256: '' },
    'graphDigestSha256',
  )
  const sceneGraph = parseCaptionMultiTrackSceneGraph(graphCandidate)

  const resolution = structuredClone(
    CAP_12_STORYTIMING_RESOLUTION_FIXTURE)
  resolution.resolutionId = `caption.cross-system.resolution.${
    call.callDigestSha256.slice(0, 32)}`
  resolution.canonicalScope = structuredClone(canonicalScope)
  resolution.sceneGraphRef = {
    id: sceneGraph.graphId,
    version: sceneGraph.schemaVersion,
    contentHash: sceneGraph.graphDigestSha256,
  }
  resolution.confirmedOutputFrameRef = confirmedOutputFrameRef
  resolution.masterTimingRef = masterTimingRef
  const sourceRange = call.canonicalScope.authorizedFrameRanges[0]
  if (!sourceRange
    || sourceRange.endFrameExclusive - sourceRange.startFrame < 3) {
    throw new Error(
      'The cross-system fixture requires a three-frame authorized range.',
    )
  }
  const sourceResolution = resolution.nodeResolutions.find((candidate) =>
    candidate.nodeId === 'node.creative.phrase.cap11.list')
  if (!sourceResolution) {
    throw new Error('The cross-system fixture source resolution is missing.')
  }
  sourceResolution.cueRange = structuredClone(sourceRange)
  sourceResolution.stableReadRange = {
    startFrame: sourceRange.startFrame + 1,
    endFrameExclusive: sourceRange.endFrameExclusive - 1,
  }
  for (const event of sourceResolution.semanticEventRefs) {
    event.frame = event.eventIntent === 'caption_on'
      ? sourceRange.startFrame
      : event.eventIntent === 'motion_entry_end'
        || event.eventIntent === 'handoff'
        ? sourceRange.startFrame + 1
        : event.eventIntent === 'motion_exit_start'
          ? sourceRange.endFrameExclusive - 2
          : sourceRange.endFrameExclusive - 1
  }
  resolution.resolutionDigestSha256 = calculateSkillContractDigest(
    { ...resolution, resolutionDigestSha256: '' },
    'resolutionDigestSha256',
  )

  const outboundPayload = createCaptionCrossSystemOutboundPayloadV2({
    payloadId: `caption.cross-system.payload.${receiver}.${
      call.callDigestSha256.slice(0, 32)}`,
    originCaptionCallRef: callRef,
    receiver,
    sourceCaptionPlanRef: {
      id: `caption.cross-system.plan.${call.callDigestSha256.slice(0, 32)}`,
      version: 'caption-direction-plan-v1',
      contentHash: sha256AuthorityValue({
        callDigestSha256: call.callDigestSha256,
        kind: 'caption-plan',
      }),
    },
    sourceCaptionMotionPlanRef: {
      id: `caption.cross-system.motion.${call.callDigestSha256.slice(0, 32)}`,
      version: 'caption-motion-plan-v1',
      contentHash: sha256AuthorityValue({
        callDigestSha256: call.callDigestSha256,
        kind: 'caption-motion',
      }),
    },
    canonicalTranscriptRef,
    sourceNodeId: 'node.creative.phrase.cap11.list',
    sourcePhraseId: 'phrase.cap11.list',
    semantic: {
      conceptId: 'concept.caption.cross-system.broll-constraints',
      purposeCode: 'preserve_caption_readability_over_selected_media',
      visualVerbCode: 'coordinate',
      sourceTruthPolicy: receiver === 'broll_owner'
        ? 'exact_selected_media_required'
        : receiver === 'map'
          ? 'exact_geography_source_required'
        : receiver === 'living_frame'
          ? 'canonical_transcript_lineage'
          : 'canonical_transcript_lineage',
    },
    requestedReceivingCapability: {
      capabilityCode: receiver === 'broll_owner'
        ? 'caption_broll_composition_constraints'
        : receiver === 'transitions'
          ? 'caption_typographic_transition_handoff'
          : receiver === 'living_frame'
            ? 'caption_living_frame_handoff_constraints'
            : 'caption_map_handoff_spec',
      expectedArtifactTypes: [receiverExpectedArtifactType(receiver)],
    },
    expectedVisualResultCode: receiver === 'broll_owner'
      ? 'expected.broll.caption-safe-layout-preserved'
      : receiver === 'transitions'
        ? 'expected.transition.caption-information-restored'
        : receiver === 'living_frame'
          ? 'expected.living-frame.caption-information-owner-preserved'
          : 'expected.map.caption-semantic-handoff-preserved',
    transferRequested: false,
    soundIntent: {
      policy: receiver === 'broll_owner' || receiver === 'map'
        ? 'sound_forbidden'
        : 'sound_optional',
      captionSoundRequestRef: null,
    },
    fallback: {
      ladderCodes: receiver === 'broll_owner'
        ? [
            'fallback.broll.stable-caption',
            'fallback.accessible-sidecar',
          ]
        : receiver === 'transitions' ? [
            'fallback.transition.stable-caption',
            'fallback.transition.cut',
          ] : receiver === 'living_frame' ? [
            'fallback.living-frame.caption-retains-information-owner',
            'fallback.accessible-sidecar',
          ] : [
            'fallback.map.stable-caption',
            'fallback.accessible-sidecar',
          ],
      selectedDefaultCode: receiver === 'broll_owner'
        ? 'fallback.broll.stable-caption'
        : receiver === 'transitions'
          ? 'fallback.transition.stable-caption'
          : receiver === 'living_frame'
            ? 'fallback.living-frame.caption-retains-information-owner'
            : 'fallback.map.stable-caption',
    },
    requiredEvidence: {
      artifactTypes: [receiverExpectedArtifactType(receiver)],
      qaCodes: receiver === 'broll_owner'
        ? [
            'caption_safe_region_verified',
            'canonical_selected_media_lineage_verified',
          ]
        : receiver === 'transitions' ? [
            'caption_readability_verified',
            'information_ownership_restoration_verified',
          ] : receiver === 'living_frame' ? [
            'caption_safe_region_verified',
            'information_ownership_restoration_verified',
          ] : [
            'caption_readability_verified',
            'map_label_collision_avoidance_verified',
          ],
    },
    resolution,
    sceneGraph,
  })
  const supportWithoutDigest: Omit<SkillSupportRequest,
    'requestDigestSha256'> | null = receiver === 'map' ? null : {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: `caption.cross-system.support.${receiver}.${
      call.callDigestSha256.slice(0, 32)}`,
    originalCallRef: callRef,
    requestingSkillKey: 'captions',
    targetSkillKey: receiver,
    reasonCode: receiver === 'broll_owner'
      ? 'caption.broll.composition_constraints.required'
      : receiver === 'transitions'
        ? 'caption.transition.handoff.required'
        : receiver === 'living_frame'
          ? 'caption.living_frame.handoff_constraints.required'
          : 'caption.map.handoff_spec.required',
    requestedArtifactTypes:
      [...outboundPayload.requestedReceivingCapability.expectedArtifactTypes],
    canonicalScope: {
      ...structuredClone(call.canonicalScope),
      boundaryId: `boundary.caption.cross-system.${receiver}.${
        call.callDigestSha256.slice(0, 24)}`,
    },
    typedPayloadType: outboundPayload.schemaVersion,
    typedPayload: outboundPayload,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  const genericSupportRequest = supportWithoutDigest === null ? null
    : parseSkillSupportRequest({
        ...supportWithoutDigest,
        requestDigestSha256: calculateSkillContractDigest(
          supportWithoutDigest as unknown as Record<string, unknown>,
          'requestDigestSha256',
        ),
      })
  const supportRequest = receiver === 'living_frame'
    ? createOutboundSupportRequest(call, outboundPayload)
    : genericSupportRequest
  const frozenCompatibility = receiver === 'transitions'
    ? createTransitionCompatibility({
        call,
        canonicalScope,
        resolution,
        sourceNode: sceneGraph.nodes.find((candidate) =>
          candidate.nodeId === 'node.creative.phrase.cap11.list')!,
      })
    : receiver === 'living_frame' && supportRequest !== null
      ? createLivingFrameCompatibility({
          call,
          canonicalScope,
          resolution,
          sourceNode: sceneGraph.nodes.find((candidate) =>
            candidate.nodeId === 'node.creative.phrase.cap11.list')!,
          supportRequest,
        })
      : null
  const outboundHandoff = createCaptionCrossSystemHandoffV2({
    handoffId: `caption.cross-system.handoff.${receiver}.${
      call.callDigestSha256.slice(0, 32)}`,
    outboundPayload,
    ...(supportRequest === null ? {} : { supportRequest }),
    frozenCompatibilityHandoff:
      frozenCompatibility?.handoff ?? null,
    ...(frozenCompatibility === null ? {} : {
      frozenCompatibilitySupportRequest:
        frozenCompatibility.supportRequest,
    }),
    resolution,
    sceneGraph,
  })
  return {
    mode: 'single_outbound_handoff' as const,
    outboundHandoff,
    outboundHandoffContext: {
      sceneGraph,
      resolution,
      outboundPayload,
      ...(supportRequest === null ? {} : { supportRequest }),
      frozenCompatibilityHandoff:
        frozenCompatibility?.handoff ?? null,
      ...(frozenCompatibility === null ? {} : {
        frozenCompatibilitySupportRequest:
          frozenCompatibility.supportRequest,
      }),
    },
  }
}

function receiverExpectedArtifactType(
  receiver: CaptionCrossSystemReceiverV2,
): string {
  if (receiver === 'broll_owner') {
    return 'b_roll_caption_constraint_acknowledgement'
  }
  if (receiver === 'transitions') {
    return 'transition_caption_handoff_acknowledgement'
  }
  if (receiver === 'living_frame') {
    return 'living_frame_caption_direction_response'
  }
  if (receiver === 'map') return 'map_caption_handoff_acknowledgement'
  if (receiver === 'graphic') return 'graphic_visual_layer_plan'
  if (receiver === 'chart') return 'chart_data_visual_plan'
  if (receiver === 'diagram') return 'diagram_layout_plan'
  return 'stroke_motion_visual_plan'
}

function receiverCapabilityCode(
  receiver: CaptionCrossSystemReceiverV2,
): string {
  if (receiver === 'living_frame') return 'semantic_living_frame_transform'
  if (receiver === 'transitions') return 'typographic_boundary_transition'
  if (receiver === 'graphic') return 'semantic_visual_explain_layer'
  if (receiver === 'map') return 'exact_map_route_visual'
  if (receiver === 'chart') return 'exact_chart_data_visual'
  if (receiver === 'diagram') return 'exact_diagram_layout'
  if (receiver === 'broll_owner') {
    return 'caption_broll_composition_constraints'
  }
  return 'semantic_stroke_motion_support'
}

function receiverSourceTruthPolicy(
  receiver: CaptionCrossSystemReceiverV2,
): 'canonical_transcript_lineage' | 'exact_data_source_required'
  | 'exact_geography_source_required' | 'exact_selected_media_required' {
  if (receiver === 'map') return 'exact_geography_source_required'
  if (receiver === 'chart' || receiver === 'diagram') {
    return 'exact_data_source_required'
  }
  if (receiver === 'broll_owner') return 'exact_selected_media_required'
  return 'canonical_transcript_lineage'
}

function createOutboundSupportRequest(
  call: OrchestraSkillCall,
  payload: ReturnType<typeof createCaptionCrossSystemOutboundPayloadV2>,
): SkillSupportRequest | null {
  const target = payload.sharedTargetAdmission.targetSkillKey
  if (target === null) return null
  if (payload.receiver === 'living_frame') {
    return createAggregateLivingFrameSupportRequest(call, payload)
  }
  const withoutDigest: Omit<SkillSupportRequest,
    'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: `caption.cross-system.aggregate.support.${payload.receiver}.${
      call.callDigestSha256.slice(0, 24)}`,
    originalCallRef: skillCallRef(call),
    requestingSkillKey: 'captions',
    targetSkillKey: target,
    reasonCode: `caption.aggregate.${payload.receiver}.handoff.required`,
    requestedArtifactTypes: [
      ...payload.requestedReceivingCapability.expectedArtifactTypes,
    ],
    canonicalScope: {
      ...structuredClone(call.canonicalScope),
      boundaryId: call.canonicalScope.boundaryId
        ?? `boundary.caption.cross-system.${payload.receiver}.${
          call.callDigestSha256.slice(0, 24)}`,
    },
    typedPayloadType: payload.schemaVersion,
    typedPayload: payload,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseSkillSupportRequest({
    ...withoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'requestDigestSha256',
    ),
  })
}

function createAggregateLivingFrameSupportRequest(
  call: OrchestraSkillCall,
  payload: ReturnType<typeof createCaptionCrossSystemOutboundPayloadV2>,
): SkillSupportRequest {
  const requestWithoutDigest: Omit<CaptionLivingFrameRequestV2,
    'requestDigestSha256'> = {
    schemaVersion: CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
    requestId: `caption.aggregate.living-frame.request.${
      call.callDigestSha256.slice(0, 24)}`,
    idempotencyKey: `caption.aggregate.living-frame.${
      call.callDigestSha256.slice(0, 24)}`,
    createdForPhase: 'approved_projection',
    receiverSkillId: 'motion.living_frame_storytelling',
    canonicalScope: {
      ...structuredClone(payload.canonicalScope),
      handoffId: `caption.aggregate.living-frame.handoff.${
        call.callDigestSha256.slice(0, 20)}`,
    },
    captionPlanRef: structuredClone(payload.sourceCaptionPlanRef),
    captionProjectionRef:
      structuredClone(payload.sourceCaptionSceneGraphRef),
    canonicalTranscript: {
      artifactRef: structuredClone(payload.canonicalTranscriptRef),
      language: 'en-US',
      sourceSegmentIds: [
        `segment.caption.aggregate.${call.callDigestSha256.slice(0, 16)}`,
      ],
      phraseIds: [payload.sourcePhraseId],
      exactSourceWordIds: [...payload.exactSourceWordIds],
    },
    semanticRequest: {
      conceptId: payload.semantic.conceptId,
      classification: 'cross_system_transform',
      purposeCode: payload.semantic.purposeCode,
      visualVerbCode: payload.semantic.visualVerbCode,
      sourcePhraseIds: [payload.sourcePhraseId],
      exactSourceWordIds: [...payload.exactSourceWordIds],
      sourceOwner: 'caption',
      intendedTargetOwner: 'living_frame',
      duplicateConceptAfterSuccessfulTransferAllowed: false,
      restoreCaptionOnFailure: true,
    },
    confirmedFrame: {
      outputId: payload.canonicalScope.outputId,
      width: 1_920,
      height: 1_080,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      confirmedOutputFrameDigestSha256:
        payload.confirmedOutputFrameRef.contentHash,
    },
    reservation: {
      regions: [{
        regionId: `caption.aggregate.safe.${
          call.callDigestSha256.slice(0, 16)}`,
        normalizedBasisPoints: {
          x: 500, y: 7_000, width: 9_000, height: 2_000,
        },
        pixelBounds: { x: 96, y: 756, width: 1_728, height: 216 },
      }],
      captionPlanePriority: 900,
      protectedRegionIds: [
        `caption.aggregate.protected.${call.callDigestSha256.slice(0, 16)}`,
      ],
      desiredRange: structuredClone(payload.authorizedRange),
      desiredPhraseBoundaryIds: [payload.sourcePhraseId],
      fallbackRegionIds: [
        `caption.aggregate.safe.upper.${
          call.callDigestSha256.slice(0, 16)}`,
      ],
    },
    timing: {
      masterTimingRef: structuredClone(payload.masterTimingRef),
      storyTimingRef: structuredClone(payload.storyTimingResolutionRef),
      eventRefs: [
        structuredClone(payload.handoffFrameRequirement.handoffEventRef),
        structuredClone(payload.handoffFrameRequirement.holdEventRef),
        structuredClone(payload.handoffFrameRequirement.restoreEventRef),
      ],
      cueRefs: [fixtureRef(
        `caption.aggregate.living-frame.cue.${
          call.callDigestSha256.slice(0, 16)}`,
        'storytiming-cue-v1',
        { callDigestSha256: call.callDigestSha256, kind: 'living-frame-cue' },
      )],
      semanticStartIntent: 'begin_after_caption_read',
      semanticHitIntent: 'visual_takes_information_ownership',
      semanticHoldIntent: 'hold_without_duplicate_caption',
      semanticExitIntent: 'restore_caption_if_visual_unavailable',
      finalLivingFrameFramesManufacturedByCaption: false,
    },
    style: {
      captionStyleProfileRef: fixtureRef(
        `caption.aggregate.style.${call.callDigestSha256.slice(0, 16)}`,
        'caption-style-profile-v1',
        { callDigestSha256: call.callDigestSha256, kind: 'style' },
      ),
      approvedSemanticColorTokenRefs: [fixtureRef(
        `caption.aggregate.color.${call.callDigestSha256.slice(0, 16)}`,
        'semantic-color-token-v1',
        { callDigestSha256: call.callDigestSha256, kind: 'color' },
      )],
      motionIntentCode: 'handoff_morph',
      reducedMotionIntentCode: 'stable_cut_then_hold',
    },
    dependencies: {
      layoutOccupancyManifestRef: fixtureRef(
        `caption.aggregate.occupancy.${call.callDigestSha256.slice(0, 16)}`,
        'layout-occupancy-manifest-v1',
        { callDigestSha256: call.callDigestSha256, kind: 'occupancy' },
      ),
      visualAssetExpectationRefs: [],
      depthExpectationRefs: [],
      maskExpectationRefs: [],
      livingFrameComponentVersionExpected:
        'living-frame-professional-skill-component-v1',
      captionComponentVersion: 'caption-design-composite-v1',
    },
    estimateInputs: {
      requestedComplexityCeiling: 'moderate',
      premiumOperationPermissionExpected: false,
      lowerCostFallbackPreferred: true,
      billingAuthorityClaimed: false,
    },
    fallbackLadder: [
      'stable_hero_caption', 'stable_accessible_caption', 'user_review',
    ],
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
        structuredClone(payload.canonicalTranscriptRef),
        structuredClone(payload.sourceCaptionPlanRef),
        structuredClone(payload.confirmedOutputFrameRef),
        structuredClone(payload.masterTimingRef),
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
  const request = parseCaptionLivingFrameRequestV2({
    ...requestWithoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      { ...requestWithoutDigest, requestDigestSha256: '' } as unknown as Record<
        string, unknown
      >,
      'requestDigestSha256',
    ),
  })
  const supportWithoutDigest: Omit<SkillSupportRequest,
    'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: `caption.cross-system.aggregate.support.living-frame.${
      call.callDigestSha256.slice(0, 20)}`,
    originalCallRef: skillCallRef(call),
    requestingSkillKey: 'captions',
    targetSkillKey: 'living_frame',
    reasonCode: 'caption.aggregate.living-frame.handoff.required',
    requestedArtifactTypes: [
      'living_frame_caption_direction_response',
    ],
    canonicalScope: {
      ...structuredClone(call.canonicalScope),
      boundaryId: call.canonicalScope.boundaryId
        ?? `boundary.caption.cross-system.living-frame.${
          call.callDigestSha256.slice(0, 24)}`,
    },
    typedPayloadType: request.schemaVersion,
    typedPayload: request,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseSkillSupportRequest({
    ...supportWithoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      supportWithoutDigest as unknown as Record<string, unknown>,
      'requestDigestSha256',
    ),
  })
}

function createAggregateIncomingBundle(input: {
  call: OrchestraSkillCall
  requester: 'living_frame' | 'transitions'
  sceneGraph: typeof CAP_11_SCENE_GRAPH_FIXTURE
  resolution: typeof CAP_12_STORYTIMING_RESOLUTION_FIXTURE
  sourceCaptionPlanRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  sourceNode: typeof CAP_11_SCENE_GRAPH_FIXTURE.nodes[number]
}) {
  const sourceResolution = input.resolution.nodeResolutions.find((candidate) =>
    candidate.nodeId === input.sourceNode.nodeId)
  const handoffEvent = sourceResolution?.semanticEventRefs.find((event) =>
    event.eventIntent === 'handoff')
  const restoreEvent = sourceResolution?.semanticEventRefs.find((event) =>
    event.eventIntent === 'restore')
  if (!sourceResolution || !handoffEvent || !restoreEvent) {
    throw new Error(
      'Aggregate incoming typography source timing is incomplete.',
    )
  }
  const livingFrame = input.requester === 'living_frame'
  const requesterSkillId = livingFrame
    ? 'motion.living_frame_storytelling' as const
    : 'motion.transition_language' as const
  const requesterOriginCallRef = fixtureRef(
    `caption.cross-system.aggregate.requester.${input.requester}.${
      input.call.callDigestSha256.slice(0, 20)}`,
    'orchestra-skill-call-v1',
    {
      callDigestSha256: input.call.callDigestSha256,
      requester: input.requester,
    },
  )
  const withoutDigest: Omit<CaptionIncomingTypographyRequest,
    'requestDigestSha256'> = {
    schemaVersion: CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION,
    requestId: `caption.incoming.aggregate.${input.requester}.${
      input.call.callDigestSha256.slice(0, 20)}`,
    canonicalScope: structuredClone(input.sceneGraph.canonicalScope),
    requester: input.requester,
    requesterSkillId,
    requesterOriginCallRef,
    requestedCaptionJobType: livingFrame
      ? 'provide_speech_derived_typography_spec'
      : 'provide_typographic_transition_component',
    expectedCaptionArtifactType: livingFrame
      ? 'caption_speech_derived_typography_spec'
      : 'caption_typographic_transition_component',
    sourceCaptionPlanRef: structuredClone(input.sourceCaptionPlanRef),
    canonicalTranscriptRef: structuredClone(input.canonicalTranscriptRef),
    confirmedOutputFrameRef:
      structuredClone(input.resolution.confirmedOutputFrameRef),
    masterTimingRef: structuredClone(input.resolution.masterTimingRef),
    storyTimingResolutionRef: {
      id: input.resolution.resolutionId,
      version: input.resolution.schemaVersion,
      contentHash: input.resolution.resolutionDigestSha256,
    },
    sourceNodeId: input.sourceNode.nodeId,
    sourcePhraseId: input.sourceNode.phraseId,
    exactSourceWordIds: [...input.sourceNode.exactSourceWordIds],
    authorizedRange: structuredClone(sourceResolution.cueRange),
    requestedTypographyRoleCode: livingFrame
      ? 'speech_derived_supporting_type'
      : 'boundary_typographic_component',
    semanticPurposeCode: livingFrame
      ? 'preserve_narration_lineage'
      : 'preserve_boundary_continuity',
    continuityToken: `continuity.caption.aggregate.${input.requester}.${
      input.call.callDigestSha256.slice(0, 16)}`,
    requestedEventRefs: [
      structuredClone(handoffEvent.eventRef),
      structuredClone(restoreEvent.eventRef),
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
  const payload = parseCaptionIncomingTypographyRequest({
    ...withoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, requestDigestSha256: '' } as unknown as Record<
        string, unknown
      >,
      'requestDigestSha256',
    ),
  }, {
    sceneGraph: input.sceneGraph,
    resolution: input.resolution,
  })
  const requestWithoutDigest: Omit<SkillSupportRequestV2,
    'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION_V2,
    requestId: `caption.aggregate.support.incoming.${input.requester}.${
      input.call.callDigestSha256.slice(0, 20)}`,
    originalCallRef: requesterOriginCallRef,
    requestingSkillKey: requesterSkillId,
    targetSkillKey: 'captions',
    requestedJobType: payload.requestedCaptionJobType,
    reasonCode: `caption.typography.required.${input.requester}`,
    requestedArtifactTypes: [payload.expectedCaptionArtifactType],
    canonicalScope: structuredClone(input.call.canonicalScope),
    typedPayloadType: payload.schemaVersion,
    typedPayload: payload,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  const supportRequest = parseSkillSupportRequestV2({
    ...requestWithoutDigest,
    requestDigestSha256: calculateSkillSupportRequestV2Digest(
      { ...requestWithoutDigest, requestDigestSha256: '' }),
  })
  return { payload, supportRequest }
}

function fixtureRef(
  id: string,
  version: string,
  lineage: Record<string, unknown>,
): SkillContractRef {
  return {
    id,
    version,
    contentHash: sha256AuthorityValue(lineage),
  }
}

function createTransitionCompatibility(input: {
  call: OrchestraSkillCall
  canonicalScope: CaptionDomainCanonicalScope
  resolution: typeof CAP_12_STORYTIMING_RESOLUTION_FIXTURE
  sourceNode: typeof CAP_11_SCENE_GRAPH_FIXTURE.nodes[number]
}): {
  handoff: CaptionCrossSystemHandoff
  supportRequest: SkillSupportRequest
} {
  const supportWithoutDigest: Omit<SkillSupportRequest,
    'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: `caption.cross-system.compatibility.transitions.${
      input.call.callDigestSha256.slice(0, 24)}`,
    originalCallRef: skillCallRef(input.call),
    requestingSkillKey: 'captions',
    targetSkillKey: 'transitions',
    reasonCode: 'caption.transition.compatibility.required',
    requestedArtifactTypes: ['caption_transition_support_result'],
    canonicalScope: structuredClone(input.call.canonicalScope),
    typedPayloadType: 'caption-transition-support-request-v1',
    typedPayload: {
      semanticConceptId: 'concept.caption.transition.compatibility',
      requestedRelationship: 'protect_stable_read_then_transition',
      requestIsByteFree: true,
      transitionSelectionRequested: false,
    },
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  const supportRequest = parseSkillSupportRequest({
    ...supportWithoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      supportWithoutDigest as unknown as Record<string, unknown>,
      'requestDigestSha256'),
  })
  const base: Omit<CaptionCrossSystemHandoff, 'handoffDigestSha256'> = {
    schemaVersion: CAPTION_CROSS_SYSTEM_HANDOFF_VERSION,
    handoffId: `caption.cross-system.compatibility.handoff.${
      input.call.callDigestSha256.slice(0, 24)}`,
    canonicalScope: structuredClone(input.canonicalScope),
    receiver: 'transitions',
    handoffKind: 'transition_support',
    sourceOwner: 'captions',
    targetOwner: 'transitions',
    sourcePhraseIds: [input.sourceNode.phraseId],
    exactSourceWordIds: [...input.sourceNode.exactSourceWordIds],
    semanticConceptId: 'concept.caption.transition.compatibility',
    semanticPurposeCode: 'preserve_semantic_continuity',
    continuityToken: `continuity.caption.transition.${
      input.call.callDigestSha256.slice(0, 24)}`,
    storyTimingResolutionRef: {
      id: input.resolution.resolutionId,
      version: input.resolution.schemaVersion,
      contentHash: input.resolution.resolutionDigestSha256,
    },
    requestedEventRefs: [{
      id: `caption.transition.event.${
        input.call.callDigestSha256.slice(0, 24)}`,
      version: 'storytiming-event-v1',
      contentHash: sha256AuthorityValue({
        call: input.call.callDigestSha256,
        event: 'transition-support',
      }),
    }],
    accessibleCounterpartNodeIds: [
      input.sourceNode.accessibilityCounterpartNodeId!,
    ],
    sourceSupportPayloadRef: {
      id: `caption.transition.payload.${
        input.call.callDigestSha256.slice(0, 24)}`,
      version: 'caption-transition-support-request-v1',
      contentHash: sha256AuthorityValue({
        call: input.call.callDigestSha256,
        payload: 'transition-support',
      }),
    },
    supportRequestRef: {
      id: supportRequest.requestId,
      version: supportRequest.schemaVersion,
      contentHash: supportRequest.requestDigestSha256,
    },
    fallback: {
      preserveAccessibleCaption: true,
      restoreCreativeCaption: false,
      selectedFallbackCode: 'stable_caption',
    },
    informationOwnershipTransferRequested: false,
    duplicateConceptAfterSuccessfulTransferAllowed: false,
    receiverExecutionClaimed: false,
    directPeerDispatchGranted: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    productionAuthorityGranted: false,
  }
  const handoff = parseCaptionCrossSystemHandoff({
    ...base,
    handoffDigestSha256: calculateSkillContractDigest(
      { ...base, handoffDigestSha256: '' } as unknown as Record<
        string, unknown
      >,
      'handoffDigestSha256'),
  }, input.resolution, supportRequest)
  return { handoff, supportRequest }
}

function createLivingFrameCompatibility(input: {
  call: OrchestraSkillCall
  canonicalScope: CaptionDomainCanonicalScope
  resolution: typeof CAP_12_STORYTIMING_RESOLUTION_FIXTURE
  sourceNode: typeof CAP_11_SCENE_GRAPH_FIXTURE.nodes[number]
  supportRequest: SkillSupportRequest
}): {
  handoff: CaptionCrossSystemHandoff
  supportRequest: SkillSupportRequest
} {
  const request = parseCaptionLivingFrameRequestV2(
    input.supportRequest.typedPayload)
  const base: Omit<CaptionCrossSystemHandoff,
    'handoffDigestSha256'> = {
    schemaVersion: CAPTION_CROSS_SYSTEM_HANDOFF_VERSION,
    handoffId: `caption.cross-system.compatibility.living-frame.${
      input.call.callDigestSha256.slice(0, 24)}`,
    canonicalScope: structuredClone(input.canonicalScope),
    receiver: 'living_frame',
    handoffKind: 'caption_to_living_frame',
    sourceOwner: 'captions',
    targetOwner: 'living_frame',
    sourcePhraseIds: [input.sourceNode.phraseId],
    exactSourceWordIds: [...input.sourceNode.exactSourceWordIds],
    semanticConceptId: request.semanticRequest.conceptId,
    semanticPurposeCode: request.semanticRequest.purposeCode,
    continuityToken: `continuity.caption.living-frame.${
      input.call.callDigestSha256.slice(0, 20)}`,
    storyTimingResolutionRef: {
      id: input.resolution.resolutionId,
      version: input.resolution.schemaVersion,
      contentHash: input.resolution.resolutionDigestSha256,
    },
    requestedEventRefs: [
      ...request.timing.eventRefs.map((ref) => structuredClone(ref)),
    ],
    accessibleCounterpartNodeIds: [
      input.sourceNode.accessibilityCounterpartNodeId!,
    ],
    sourceSupportPayloadRef: {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    },
    supportRequestRef: {
      id: input.supportRequest.requestId,
      version: input.supportRequest.schemaVersion,
      contentHash: input.supportRequest.requestDigestSha256,
    },
    fallback: {
      preserveAccessibleCaption: true,
      restoreCreativeCaption: true,
      selectedFallbackCode:
        'caption_retains_information_owner',
    },
    informationOwnershipTransferRequested: true,
    duplicateConceptAfterSuccessfulTransferAllowed: false,
    receiverExecutionClaimed: false,
    directPeerDispatchGranted: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    productionAuthorityGranted: false,
  }
  const handoff = parseCaptionCrossSystemHandoff({
    ...base,
    handoffDigestSha256: calculateSkillContractDigest(
      { ...base, handoffDigestSha256: '' } as unknown as Record<
        string, unknown
      >,
      'handoffDigestSha256',
    ),
  }, input.resolution, input.supportRequest)
  return { handoff, supportRequest: input.supportRequest }
}
