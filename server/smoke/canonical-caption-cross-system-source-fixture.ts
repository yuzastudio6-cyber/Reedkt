import type {
  OrchestraSkillCall,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { SKILL_SUPPORT_REQUEST_VERSION } from
  '../../src/types/orchestra-skill-contracts'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import {
  createCaptionCrossSystemHandoffV2,
  createCaptionCrossSystemOutboundPayloadV2,
} from '../captions-specialist/caption-cross-system-coordination'
import { parseCaptionMultiTrackSceneGraph } from
  '../captions-specialist/caption-multi-track-scene-graph'
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
  resolution.resolutionDigestSha256 = calculateSkillContractDigest(
    { ...resolution, resolutionDigestSha256: '' },
    'resolutionDigestSha256',
  )

  const outboundPayload = createCaptionCrossSystemOutboundPayloadV2({
    payloadId: `caption.cross-system.payload.broll.${
      call.callDigestSha256.slice(0, 32)}`,
    originCaptionCallRef: callRef,
    receiver: 'broll_owner',
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
      sourceTruthPolicy: 'exact_selected_media_required',
    },
    requestedReceivingCapability: {
      capabilityCode: 'caption_broll_composition_constraints',
      expectedArtifactTypes: [
        'b_roll_caption_constraint_acknowledgement',
      ],
    },
    expectedVisualResultCode:
      'expected.broll.caption-safe-layout-preserved',
    transferRequested: false,
    soundIntent: {
      policy: 'sound_forbidden',
      captionSoundRequestRef: null,
    },
    fallback: {
      ladderCodes: [
        'fallback.broll.stable-caption',
        'fallback.accessible-sidecar',
      ],
      selectedDefaultCode: 'fallback.broll.stable-caption',
    },
    requiredEvidence: {
      artifactTypes: ['b_roll_caption_constraint_acknowledgement'],
      qaCodes: [
        'caption_safe_region_verified',
        'canonical_selected_media_lineage_verified',
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
    targetSkillKey: 'broll_owner',
    reasonCode: 'caption.broll.composition_constraints.required',
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
  const outboundHandoff = createCaptionCrossSystemHandoffV2({
    handoffId: `caption.cross-system.handoff.broll.${
      call.callDigestSha256.slice(0, 32)}`,
    outboundPayload,
    supportRequest,
    frozenCompatibilityHandoff: null,
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
      frozenCompatibilityHandoff: null,
    },
  }
}
