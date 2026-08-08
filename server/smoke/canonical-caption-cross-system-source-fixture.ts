import type {
  OrchestraSkillCall,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { SKILL_SUPPORT_REQUEST_VERSION } from
  '../../src/types/orchestra-skill-contracts'
import {
  CAPTION_CROSS_SYSTEM_HANDOFF_VERSION,
  type CaptionCrossSystemHandoff,
} from '../../src/types/caption-storytiming-motion'
import type { CaptionDomainCanonicalScope } from
  '../../src/types/caption-domain-contracts'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import {
  createCaptionCrossSystemHandoffV2,
  createCaptionCrossSystemOutboundPayloadV2,
} from '../captions-specialist/caption-cross-system-coordination'
import { parseCaptionMultiTrackSceneGraph } from
  '../captions-specialist/caption-multi-track-scene-graph'
import { parseCaptionCrossSystemHandoff } from
  '../captions-specialist/caption-storytiming-motion'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
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

function createCanonicalCaptionCrossSystemSourceFixture(
  call: OrchestraSkillCall,
  planVersionId: string,
  receiver: 'broll_owner' | 'transitions',
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
    payloadId: `caption.cross-system.payload.broll.${
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
        : 'canonical_transcript_lineage',
    },
    requestedReceivingCapability: {
      capabilityCode: receiver === 'broll_owner'
        ? 'caption_broll_composition_constraints'
        : 'caption_typographic_transition_handoff',
      expectedArtifactTypes: receiver === 'broll_owner'
        ? ['b_roll_caption_constraint_acknowledgement']
        : ['transition_caption_handoff_acknowledgement'],
    },
    expectedVisualResultCode: receiver === 'broll_owner'
      ? 'expected.broll.caption-safe-layout-preserved'
      : 'expected.transition.caption-information-restored',
    transferRequested: false,
    soundIntent: {
      policy: receiver === 'broll_owner'
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
        : [
            'fallback.transition.stable-caption',
            'fallback.transition.cut',
          ],
      selectedDefaultCode: receiver === 'broll_owner'
        ? 'fallback.broll.stable-caption'
        : 'fallback.transition.stable-caption',
    },
    requiredEvidence: {
      artifactTypes: receiver === 'broll_owner'
        ? ['b_roll_caption_constraint_acknowledgement']
        : ['transition_caption_handoff_acknowledgement'],
      qaCodes: receiver === 'broll_owner'
        ? [
            'caption_safe_region_verified',
            'canonical_selected_media_lineage_verified',
          ]
        : [
            'caption_readability_verified',
            'information_ownership_restoration_verified',
          ],
    },
    resolution,
    sceneGraph,
  })
  const supportWithoutDigest: Omit<SkillSupportRequest,
    'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: `caption.cross-system.support.broll.${
      call.callDigestSha256.slice(0, 32)}`,
    originalCallRef: callRef,
    requestingSkillKey: 'captions',
    targetSkillKey: receiver,
    reasonCode: receiver === 'broll_owner'
      ? 'caption.broll.composition_constraints.required'
      : 'caption.transition.handoff.required',
    requestedArtifactTypes:
      [...outboundPayload.requestedReceivingCapability.expectedArtifactTypes],
    canonicalScope: {
      ...structuredClone(call.canonicalScope),
      boundaryId: `boundary.caption.cross-system.broll.${
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
  const supportRequest = parseSkillSupportRequest({
    ...supportWithoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      supportWithoutDigest as unknown as Record<string, unknown>,
      'requestDigestSha256',
    ),
  })
  const frozenCompatibility = receiver === 'transitions'
    ? createTransitionCompatibility({
        call,
        canonicalScope,
        resolution,
        sourceNode: sceneGraph.nodes.find((candidate) =>
          candidate.nodeId === 'node.creative.phrase.cap11.list')!,
      })
    : null
  const outboundHandoff = createCaptionCrossSystemHandoffV2({
    handoffId: `caption.cross-system.handoff.broll.${
      call.callDigestSha256.slice(0, 32)}`,
    outboundPayload,
    supportRequest,
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
      supportRequest,
      frozenCompatibilityHandoff:
        frozenCompatibility?.handoff ?? null,
      ...(frozenCompatibility === null ? {} : {
        frozenCompatibilitySupportRequest:
          frozenCompatibility.supportRequest,
      }),
    },
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
