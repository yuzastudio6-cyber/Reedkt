import { z } from 'zod'

import {
  CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_VERSION,
  CAPTION_CROSS_SYSTEM_HANDOFF_VERSION_V2,
  CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_VERSION,
  CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION,
  type CaptionCrossSystemCoordinationPlan,
  type CaptionCrossSystemHandoffV2,
  type CaptionCrossSystemOutboundPayloadV2,
  type CaptionCrossSystemReceiverV2,
  type CaptionIncomingTypographyRequest,
} from '../../src/types/caption-cross-system-coordination'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import {
  CAPTION_LIVING_FRAME_REQUEST_VERSION,
  type CaptionLivingFrameRequest,
} from '../../src/types/caption-direction-living-frame'
import {
  CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
} from '../../src/types/caption-living-frame-boundary'
import type {
  CaptionCrossSystemHandoff,
  CaptionMotionPlan,
  CaptionStoryTimingResolutionBinding,
} from '../../src/types/caption-storytiming-motion'
import type { CaptionMultiTrackSceneGraph } from
  '../../src/types/caption-multi-track-scene-graph'
import type {
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportRequest,
  SkillSupportTarget,
} from '../../src/types/orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  '../../src/types/orchestra-skill-support-request-v2'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { validateCaptionLivingFrameRequest } from
  '../../src/lib/caption-direction/caption-living-frame-adapter'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import { parseSkillSupportRequestV2 } from
  '../orchestra/orchestra-skill-support-request-v2'
import { parseCaptionLivingFrameRequestV2 } from
  './caption-living-frame-boundary'
import { parseCaptionCrossSystemHandoff } from
  './caption-storytiming-motion'
import { parseCaptionMultiTrackSceneGraph } from
  './caption-multi-track-scene-graph'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
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
}).strict()
const skillScopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey.nullable(),
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(256),
}).strict()
const authoritySchema = z.object({
  scopeExpansionGranted: z.literal(false),
  timelineMutationGranted: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  providerCallGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  costAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const receiverSchema = z.enum([
  'living_frame', 'transitions', 'graphic', 'map', 'chart', 'diagram',
  'broll_owner', 'stroke_motion',
])
const receiverSkillIdSchema = z.enum([
  'motion.living_frame_storytelling',
  'motion.transition_language',
  'graphics.visual_explain_layer',
  'graphics.map_route_visual',
  'graphics.chart_or_data_visual',
  'dataviz.diagram_layout',
  'b_roll',
  'motion.stroke_motion_storytelling',
])
const handoffKindSchema = z.enum([
  'caption_to_living_frame',
  'caption_to_transition',
  'caption_to_graphic',
  'caption_to_map',
  'caption_to_chart',
  'caption_to_diagram',
  'caption_to_broll_constraints',
  'caption_to_motion_support',
])

const unsafeTextPattern =
  /https?:\/\/|file:\/\/|\/(?:Users|Volumes|home|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu

function assertNoUnsafeText(value: unknown, label: string): void {
  const stack = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string' && unsafeTextPattern.test(current)) {
      throw new Error(`${label} contains URL, path, or credential-shaped text.`)
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

const outboundPayloadSchema: z.ZodType<CaptionCrossSystemOutboundPayloadV2> =
  z.object({
    schemaVersion: z.literal(CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_VERSION),
    payloadId: safeKey,
    payloadDigestSha256: sha256,
    canonicalScope: scopeSchema,
    originCaptionCallRef: refSchema,
    receiver: receiverSchema,
    receiverSkillId: receiverSkillIdSchema,
    handoffKind: handoffKindSchema,
    sourceCaptionPlanRef: refSchema,
    sourceCaptionSceneGraphRef: refSchema,
    sourceCaptionMotionPlanRef: refSchema,
    canonicalTranscriptRef: refSchema,
    confirmedOutputFrameRef: refSchema,
    masterTimingRef: refSchema,
    storyTimingResolutionRef: refSchema,
    sourceNodeId: safeKey,
    sourcePhraseId: safeKey,
    exactSourceWordIds: z.array(safeKey).min(1).max(20_000),
    authorizedRange: frameRangeSchema,
    handoffFrameRequirement: z.object({
      handoffEventRef: refSchema,
      holdEventRef: refSchema,
      restoreEventRef: refSchema,
      framesResolvedByStoryTiming: z.literal(true),
      captionManufacturedReceiverFrames: z.literal(false),
    }).strict(),
    semantic: z.object({
      conceptId: safeKey,
      purposeCode: safeKey,
      visualVerbCode: safeKey,
      sourceTruthPolicy: z.enum([
        'canonical_transcript_lineage',
        'documentary_fact_safe',
        'exact_data_source_required',
        'exact_geography_source_required',
        'exact_selected_media_required',
      ]),
    }).strict(),
    requestedReceivingCapability: z.object({
      capabilityCode: safeKey,
      expectedArtifactTypes: z.array(safeKey).min(1).max(64),
      receiverOwnsExecution: z.literal(true),
    }).strict(),
    expectedVisualResultCode: safeKey,
    informationOwnership: z.object({
      ownerBeforeHandoff: z.literal('captions'),
      transferRequested: z.boolean(),
      ownerAfterAcceptedHandoff: z.union([
        z.literal('captions'), receiverSkillIdSchema,
      ]),
      captionRetainsCompleteAccessibleProjection: z.literal(true),
      duplicateInformationAfterAcceptedTransferAllowed: z.literal(false),
      captionRegainsInformationOwnershipOnFailure: z.literal(true),
    }).strict(),
    soundIntent: z.object({
      policy: z.enum(['sound_forbidden', 'sound_optional', 'sound_required']),
      captionSoundRequestRef: refSchema.nullable(),
      soundOwnerRemainsExternal: z.literal(true),
    }).strict(),
    accessibility: z.object({
      counterpartNodeIds: z.array(safeKey).min(1).max(512),
      completeWordingPreserved: z.literal(true),
      remainsAvailableDuringHandoff: z.literal(true),
      reducedMotionMeaningPreserved: z.literal(true),
    }).strict(),
    fallback: z.object({
      ladderCodes: z.array(safeKey).min(1).max(16),
      selectedDefaultCode: safeKey,
      restoreCreativeCaption: z.boolean(),
      preserveAccessibleCaption: z.literal(true),
    }).strict(),
    requiredEvidence: z.object({
      artifactTypes: z.array(safeKey).min(1).max(64),
      qaCodes: z.array(safeKey).min(1).max(64),
      exactReceiverResultMustBeInjected: z.literal(true),
    }).strict(),
    returnToHq: z.object({
      hqMediated: z.literal(true),
      dispositionBeforeReceiverResult: z.literal('needs_followup'),
      receiverResultMustBeInjected: z.literal(true),
      directPeerDispatchAllowed: z.literal(false),
      scopeExpansionAllowed: z.literal(false),
    }).strict(),
    sharedTargetAdmission: z.object({
      state: z.enum([
        'admitted_generic_v1', 'pending_future_orchestra_target',
      ]),
      targetSkillKey: z.enum([
        'visual_intelligence', 'track_all', 'living_frame', 'soundsync',
        'transitions', 'broll_owner', 'canonical_timing_owner',
        'canonical_layout_owner',
      ]).nullable(),
    }).strict(),
    privateArtifactPolicy: z.object({
      tenantScoped: z.literal(true),
      byteFreeCoordinationOnly: z.literal(true),
      rawChatIncluded: z.literal(false),
      mediaBytesIncluded: z.literal(false),
      urlsOrPathsIncluded: z.literal(false),
      credentialsIncluded: z.literal(false),
      executablePromptOrCodeIncluded: z.literal(false),
    }).strict(),
    authorityBoundary: authoritySchema,
  }).strict()

const handoffSchema: z.ZodType<CaptionCrossSystemHandoffV2> = z.object({
  schemaVersion: z.literal(CAPTION_CROSS_SYSTEM_HANDOFF_VERSION_V2),
  handoffId: safeKey,
  handoffDigestSha256: sha256,
  canonicalScope: scopeSchema,
  receiver: receiverSchema,
  receiverSkillId: receiverSkillIdSchema,
  handoffKind: handoffKindSchema,
  outboundPayloadRef: refSchema,
  supportRequestRef: refSchema.nullable(),
  frozenCompatibilityHandoffRef: refSchema.nullable(),
  coordinationState: z.enum([
    'support_request_ready', 'awaiting_shared_target_registry',
  ]),
  receiverExecutionClaimed: z.literal(false),
  captionExecutedReceiverWork: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  timelineMutationGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const incomingTypographySchema: z.ZodType<CaptionIncomingTypographyRequest> =
  z.object({
    schemaVersion: z.literal(CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION),
    requestId: safeKey,
    requestDigestSha256: sha256,
    canonicalScope: scopeSchema,
    requester: z.enum(['living_frame', 'transitions']),
    requesterSkillId: z.enum([
      'motion.living_frame_storytelling', 'motion.transition_language',
    ]),
    requesterOriginCallRef: refSchema,
    requestedCaptionJobType: z.enum([
      'provide_speech_derived_typography_spec',
      'provide_typographic_transition_component',
    ]),
    expectedCaptionArtifactType: z.enum([
      'caption_speech_derived_typography_spec',
      'caption_typographic_transition_component',
    ]),
    sourceCaptionPlanRef: refSchema,
    canonicalTranscriptRef: refSchema,
    confirmedOutputFrameRef: refSchema,
    masterTimingRef: refSchema,
    storyTimingResolutionRef: refSchema,
    sourceNodeId: safeKey,
    sourcePhraseId: safeKey,
    exactSourceWordIds: z.array(safeKey).min(1).max(20_000),
    authorizedRange: frameRangeSchema,
    requestedTypographyRoleCode: safeKey,
    semanticPurposeCode: safeKey,
    continuityToken: safeKey,
    requestedEventRefs: z.array(refSchema).min(1).max(16),
    informationOwnership: z.object({
      captionsOwnsTypographySpecification: z.literal(true),
      requesterOwnsExternalDomainExecution: z.literal(true),
      requesterMayNotMutateCaptionPlan: z.literal(true),
      noInformationOwnershipTransferInferred: z.literal(true),
    }).strict(),
    accessibility: z.object({
      completeWordingRequired: z.literal(true),
      accessibleCounterpartRequired: z.literal(true),
      reducedMotionCounterpartRequired: z.literal(true),
    }).strict(),
    requiredEvidenceTypes: z.array(safeKey).min(1).max(64),
    returnToHq: z.object({
      hqMediated: z.literal(true),
      captionResultMustReturnToRequesterThroughHq: z.literal(true),
      directPeerResponseAllowed: z.literal(false),
    }).strict(),
    privateArtifactPolicy: z.object({
      tenantScoped: z.literal(true),
      byteFreeCoordinationOnly: z.literal(true),
      rawChatIncluded: z.literal(false),
      mediaBytesIncluded: z.literal(false),
      urlsOrPathsIncluded: z.literal(false),
      credentialsIncluded: z.literal(false),
      executablePromptOrCodeIncluded: z.literal(false),
    }).strict(),
    authorityBoundary: authoritySchema,
  }).strict()

const coordinationPlanSchema: z.ZodType<CaptionCrossSystemCoordinationPlan> =
  z.object({
    schemaVersion: z.literal(CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_VERSION),
    planId: safeKey,
    planDigestSha256: sha256,
    canonicalScope: scopeSchema,
    sourceCaptionPlanRef: refSchema,
    sourceMotionPlanRef: refSchema,
    canonicalTranscriptRef: refSchema,
    confirmedOutputFrameRef: refSchema,
    masterTimingRef: refSchema,
    storyTimingResolutionRef: refSchema,
    outboundHandoffRefs: z.array(refSchema).min(1).max(512),
    outboundPayloadRefs: z.array(refSchema).min(1).max(512),
    outboundSupportRequestRefs: z.array(refSchema).max(512),
    incomingTypographyRequestRefs: z.array(refSchema).max(512),
    incomingSupportRequestRefs: z.array(refSchema).max(512),
    receiverCoverage: z.array(receiverSchema).min(1).max(8),
    pendingSharedTargetReceivers: z.array(receiverSchema).max(8),
    counts: z.object({
      outboundHandoffs: z.number().int().nonnegative().max(512),
      admittedOutboundSupportRequests: z.number().int().nonnegative().max(512),
      pendingSharedTargetRegistrations: z.number().int().nonnegative().max(512),
      incomingTypographyRequests: z.number().int().nonnegative().max(512),
    }).strict(),
    exactOneToOneArtifactLineageVerified: z.literal(true),
    captionOwnedHandoffSurfaceComplete: z.literal(true),
    futureOrchestraTargetRegistryComplete: z.boolean(),
    centralOrchestraImplemented: z.literal(false),
    directPeerDispatchAdded: z.literal(false),
    receiverExecutionClaimed: z.literal(false),
    timelineMutationGranted: z.literal(false),
    runtimeExecutionGranted: z.literal(false),
    assetCreationGranted: z.literal(false),
    finalQaApprovalGranted: z.literal(false),
    billingAuthorityGranted: z.literal(false),
    publicDeliveryGranted: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict()

const RECEIVER_PROFILE: Readonly<Record<CaptionCrossSystemReceiverV2, {
  skillId: CaptionCrossSystemOutboundPayloadV2['receiverSkillId']
  kind: CaptionCrossSystemOutboundPayloadV2['handoffKind']
  supportTarget: SkillSupportTarget | null
  transferAllowed: boolean
}>> = Object.freeze({
  living_frame: {
    skillId: 'motion.living_frame_storytelling',
    kind: 'caption_to_living_frame',
    supportTarget: 'living_frame',
    transferAllowed: true,
  },
  transitions: {
    skillId: 'motion.transition_language',
    kind: 'caption_to_transition',
    supportTarget: 'transitions',
    transferAllowed: false,
  },
  graphic: {
    skillId: 'graphics.visual_explain_layer',
    kind: 'caption_to_graphic',
    supportTarget: null,
    transferAllowed: true,
  },
  map: {
    skillId: 'graphics.map_route_visual',
    kind: 'caption_to_map',
    supportTarget: null,
    transferAllowed: true,
  },
  chart: {
    skillId: 'graphics.chart_or_data_visual',
    kind: 'caption_to_chart',
    supportTarget: null,
    transferAllowed: true,
  },
  diagram: {
    skillId: 'dataviz.diagram_layout',
    kind: 'caption_to_diagram',
    supportTarget: null,
    transferAllowed: true,
  },
  broll_owner: {
    skillId: 'b_roll',
    kind: 'caption_to_broll_constraints',
    supportTarget: 'broll_owner',
    transferAllowed: false,
  },
  stroke_motion: {
    skillId: 'motion.stroke_motion_storytelling',
    kind: 'caption_to_motion_support',
    supportTarget: null,
    transferAllowed: true,
  },
})

const REQUIRED_RECEIVER_COVERAGE: readonly CaptionCrossSystemReceiverV2[] =
  Object.freeze([
    'living_frame', 'transitions', 'graphic', 'map', 'chart', 'diagram',
    'broll_owner', 'stroke_motion',
  ])

const REQUIRED_INCOMING_REQUESTER_COVERAGE = Object.freeze([
  'living_frame', 'transitions',
] as const)

function digestRecord(
  value: Record<string, unknown>,
  field: string,
): string {
  return calculateSkillContractDigest(value, field)
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (digestRecord(value, field) !== value[field]) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function exactRef(
  actual: SkillContractRef | CaptionDomainRef,
  expected: SkillContractRef | CaptionDomainRef,
): boolean {
  return actual.id === expected.id
    && actual.version === expected.version
    && actual.contentHash === expected.contentHash
}

function exactNullableRef(
  actual: SkillContractRef | CaptionDomainRef | null,
  expected: SkillContractRef | CaptionDomainRef | null,
): boolean {
  return actual === null || expected === null
    ? actual === expected
    : exactRef(actual, expected)
}

function exactScope(
  actual: CaptionDomainCanonicalScope,
  expected: CaptionDomainCanonicalScope,
): boolean {
  return actual.ownerUserId === expected.ownerUserId
    && actual.workspaceId === expected.workspaceId
    && actual.projectId === expected.projectId
    && actual.editSessionId === expected.editSessionId
    && actual.planVersionId === expected.planVersionId
    && exactNullableRef(actual.approvedSnapshotRef, expected.approvedSnapshotRef)
    && actual.outputId === expected.outputId
    && actual.sceneId === expected.sceneId
    && JSON.stringify(actual.authorizedFrameRanges)
      === JSON.stringify(expected.authorizedFrameRanges)
}

function exactSkillScope(
  actual: SkillCanonicalScope,
  expected: CaptionDomainCanonicalScope,
): boolean {
  return actual.ownerUserId === expected.ownerUserId
    && actual.workspaceId === expected.workspaceId
    && actual.projectId === expected.projectId
    && actual.editSessionId === expected.editSessionId
    && exactNullableRef(actual.approvedSnapshotRef, expected.approvedSnapshotRef)
    && actual.outputId === expected.outputId
    && actual.sceneId === expected.sceneId
    && actual.boundaryId !== null
    && JSON.stringify(actual.authorizedFrameRanges)
      === JSON.stringify(expected.authorizedFrameRanges)
}

function containsRange(
  outer: CaptionDomainFrameRange,
  inner: CaptionDomainFrameRange,
): boolean {
  return inner.startFrame >= outer.startFrame
    && inner.endFrameExclusive <= outer.endFrameExclusive
}

function resolutionRef(
  value: CaptionStoryTimingResolutionBinding,
): CaptionDomainRef {
  return {
    id: value.resolutionId,
    version: value.schemaVersion,
    contentHash: value.resolutionDigestSha256,
  }
}

function sceneGraphRef(value: CaptionMultiTrackSceneGraph): CaptionDomainRef {
  return {
    id: value.graphId,
    version: value.schemaVersion,
    contentHash: value.graphDigestSha256,
  }
}

function motionPlanRef(value: CaptionMotionPlan): CaptionDomainRef {
  return {
    id: value.planId,
    version: value.schemaVersion,
    contentHash: value.planDigestSha256,
  }
}

export function captionCrossSystemOutboundPayloadRef(
  value: CaptionCrossSystemOutboundPayloadV2,
): CaptionDomainRef {
  return {
    id: value.payloadId,
    version: value.schemaVersion,
    contentHash: value.payloadDigestSha256,
  }
}

export function captionCrossSystemHandoffV2Ref(
  value: CaptionCrossSystemHandoffV2,
): CaptionDomainRef {
  return {
    id: value.handoffId,
    version: value.schemaVersion,
    contentHash: value.handoffDigestSha256,
  }
}

export function captionIncomingTypographyRequestRef(
  value: CaptionIncomingTypographyRequest,
): CaptionDomainRef {
  return {
    id: value.requestId,
    version: value.schemaVersion,
    contentHash: value.requestDigestSha256,
  }
}

function skillSupportRequestRef(
  value: SkillSupportRequest | SkillSupportRequestV2,
): SkillContractRef {
  return {
    id: value.requestId,
    version: value.schemaVersion,
    contentHash: value.requestDigestSha256,
  }
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length
}

function sourceResolution(
  resolution: CaptionStoryTimingResolutionBinding,
  nodeId: string,
  phraseId: string,
) {
  return resolution.nodeResolutions.find((entry) =>
    entry.nodeId === nodeId && entry.phraseId === phraseId)
}

function exactEvent(
  source: CaptionStoryTimingResolutionBinding['nodeResolutions'][number],
  intent: 'handoff' | 'motion_exit_start' | 'restore',
  ref: CaptionDomainRef,
): boolean {
  return source.semanticEventRefs.some((event) =>
    event.eventIntent === intent && exactRef(event.eventRef, ref))
}

function resolvedEvent(
  source: CaptionStoryTimingResolutionBinding['nodeResolutions'][number],
  intent: 'handoff' | 'motion_exit_start' | 'restore',
  ref: CaptionDomainRef,
) {
  return source.semanticEventRefs.find((event) =>
    event.eventIntent === intent && exactRef(event.eventRef, ref))
}

function validateReceiverTruthPolicy(
  payload: CaptionCrossSystemOutboundPayloadV2,
): boolean {
  if (payload.receiver === 'map') {
    return payload.semantic.sourceTruthPolicy === 'exact_geography_source_required'
  }
  if (payload.receiver === 'chart' || payload.receiver === 'diagram') {
    return payload.semantic.sourceTruthPolicy === 'exact_data_source_required'
  }
  if (payload.receiver === 'broll_owner') {
    return payload.semantic.sourceTruthPolicy === 'exact_selected_media_required'
  }
  return payload.semantic.sourceTruthPolicy === 'canonical_transcript_lineage'
    || payload.semantic.sourceTruthPolicy === 'documentary_fact_safe'
}

export interface CaptionCrossSystemSourceContext {
  sceneGraph: unknown
  resolution: CaptionStoryTimingResolutionBinding
}

function parseSourceContext(
  context: CaptionCrossSystemSourceContext,
): {
  sceneGraph: CaptionMultiTrackSceneGraph
  resolution: CaptionStoryTimingResolutionBinding
} {
  const sceneGraph = parseCaptionMultiTrackSceneGraph(context.sceneGraph)
  assertClosedContractTree(
    context.resolution, 'Caption cross-system StoryTiming resolution context')
  verifyDigest(context.resolution as unknown as Record<string, unknown>,
    'resolutionDigestSha256',
    'Caption cross-system StoryTiming resolution context')
  if (!exactScope(context.resolution.canonicalScope, sceneGraph.canonicalScope)
    || !exactRef(context.resolution.sceneGraphRef, sceneGraphRef(sceneGraph))) {
    throw new Error(
      'Caption cross-system source context has crossed scene lineage.',
    )
  }
  return { sceneGraph, resolution: context.resolution }
}

function sourceSceneNode(
  graph: CaptionMultiTrackSceneGraph,
  nodeId: string,
  phraseId: string,
) {
  return graph.nodes.find((node) =>
    node.nodeId === nodeId && node.phraseId === phraseId)
}

function exactStringList(actual: string[], expected: string[]): boolean {
  return actual.length === expected.length
    && actual.every((value, index) => value === expected[index])
}

function validAccessibleCounterparts(input: {
  graph: CaptionMultiTrackSceneGraph
  sourceNode: CaptionMultiTrackSceneGraph['nodes'][number]
  counterpartNodeIds: string[]
}): boolean {
  if (input.sourceNode.accessibilityCounterpartNodeId === null
    || !input.counterpartNodeIds.includes(
      input.sourceNode.accessibilityCounterpartNodeId)) {
    return false
  }
  return input.counterpartNodeIds.every((nodeId) => {
    const node = input.graph.nodes.find((candidate) => candidate.nodeId === nodeId)
    const track = node === undefined ? undefined : input.graph.tracks.find(
      (candidate) => candidate.trackId === node.trackId)
    return node !== undefined
      && (track?.role === 'accessible_sidecar'
        || track?.role === 'localized_accessible')
      && node.phraseId === input.sourceNode.phraseId
      && exactStringList(
        node.exactSourceWordIds, input.sourceNode.exactSourceWordIds)
  })
}

export function parseCaptionCrossSystemOutboundPayloadV2(
  value: unknown,
  context: CaptionCrossSystemSourceContext,
): CaptionCrossSystemOutboundPayloadV2 {
  assertClosedContractTree(value, 'Caption cross-system outbound payload V2')
  assertNoUnsafeText(value, 'Caption cross-system outbound payload V2')
  const { sceneGraph, resolution } = parseSourceContext(context)
  const payload = outboundPayloadSchema.parse(value)
  const profile = RECEIVER_PROFILE[payload.receiver]
  const source = sourceResolution(
    resolution, payload.sourceNodeId, payload.sourcePhraseId)
  const sourceNode = sourceSceneNode(
    sceneGraph, payload.sourceNodeId, payload.sourcePhraseId)
  const handoffEvent = source === undefined ? undefined : resolvedEvent(
    source, 'handoff', payload.handoffFrameRequirement.handoffEventRef)
  const holdEvent = source === undefined ? undefined : resolvedEvent(
    source, 'motion_exit_start', payload.handoffFrameRequirement.holdEventRef)
  const restoreEvent = source === undefined ? undefined : resolvedEvent(
    source, 'restore', payload.handoffFrameRequirement.restoreEventRef)
  const expectedOwnerAfter = payload.informationOwnership.transferRequested
    ? payload.receiverSkillId : 'captions'
  const expectedAdmissionState = profile.supportTarget === null
    ? 'pending_future_orchestra_target' : 'admitted_generic_v1'
  const soundBindingValid = payload.soundIntent.policy === 'sound_forbidden'
    ? payload.soundIntent.captionSoundRequestRef === null
    : payload.soundIntent.policy === 'sound_required'
      ? payload.soundIntent.captionSoundRequestRef !== null
      : true
  if (!exactScope(payload.canonicalScope, resolution.canonicalScope)
    || !exactRef(payload.confirmedOutputFrameRef,
      resolution.confirmedOutputFrameRef)
    || !exactRef(payload.masterTimingRef, resolution.masterTimingRef)
    || !exactRef(payload.storyTimingResolutionRef, resolutionRef(resolution))
    || !exactRef(payload.sourceCaptionSceneGraphRef, sceneGraphRef(sceneGraph))
    || profile.skillId !== payload.receiverSkillId
    || profile.kind !== payload.handoffKind
    || source === undefined
    || sourceNode === undefined
    || !exactStringList(
      payload.exactSourceWordIds, sourceNode.exactSourceWordIds)
    || !validAccessibleCounterparts({
      graph: sceneGraph,
      sourceNode,
      counterpartNodeIds: payload.accessibility.counterpartNodeIds,
    })
    || !containsRange(source.cueRange, payload.authorizedRange)
    || !payload.canonicalScope.authorizedFrameRanges.some((range) =>
      containsRange(range, payload.authorizedRange))
    || !exactEvent(source, 'handoff',
      payload.handoffFrameRequirement.handoffEventRef)
    || !exactEvent(source, 'motion_exit_start',
      payload.handoffFrameRequirement.holdEventRef)
    || !exactEvent(source, 'restore',
      payload.handoffFrameRequirement.restoreEventRef)
    || handoffEvent === undefined
    || holdEvent === undefined
    || restoreEvent === undefined
    || handoffEvent.frame > holdEvent.frame
    || holdEvent.frame > restoreEvent.frame
    || !unique(payload.exactSourceWordIds)
    || !unique(payload.requestedReceivingCapability.expectedArtifactTypes)
    || !unique(payload.accessibility.counterpartNodeIds)
    || !unique(payload.fallback.ladderCodes)
    || !unique(payload.requiredEvidence.artifactTypes)
    || !unique(payload.requiredEvidence.qaCodes)
    || !payload.fallback.ladderCodes.includes(
      payload.fallback.selectedDefaultCode)
    || payload.fallback.restoreCreativeCaption
      !== payload.informationOwnership.transferRequested
    || payload.informationOwnership.ownerAfterAcceptedHandoff
      !== expectedOwnerAfter
    || !profile.transferAllowed
      && payload.informationOwnership.transferRequested
    || payload.sharedTargetAdmission.state !== expectedAdmissionState
    || payload.sharedTargetAdmission.targetSkillKey !== profile.supportTarget
    || !validateReceiverTruthPolicy(payload)
    || !soundBindingValid) {
    throw new Error(
      'Caption cross-system outbound payload violates its owner boundary.',
    )
  }
  verifyDigest(payload as unknown as Record<string, unknown>,
    'payloadDigestSha256', 'Caption cross-system outbound payload V2')
  return payload
}

function parseFrozenLivingFramePayload(value: unknown, version: string): {
  phraseIds: string[]
  wordIds: string[]
  canonicalScope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    planVersionId: string
    approvedSnapshotId: string | null
    outputId: string | null
    sceneId: string | null
    authorizedFrameRanges: CaptionDomainFrameRange[] | null
  }
} {
  if (version === CAPTION_LIVING_FRAME_REQUEST_V2_VERSION) {
    const parsed = parseCaptionLivingFrameRequestV2(value)
    return {
      phraseIds: parsed.semanticRequest.sourcePhraseIds,
      wordIds: parsed.semanticRequest.exactSourceWordIds,
      canonicalScope: {
        workspaceId: parsed.canonicalScope.workspaceId,
        projectId: parsed.canonicalScope.projectId,
        editSessionId: parsed.canonicalScope.editSessionId,
        planVersionId: parsed.canonicalScope.planVersionId,
        approvedSnapshotId: parsed.canonicalScope.approvedSnapshotRef?.id ?? null,
        outputId: parsed.canonicalScope.outputId,
        sceneId: parsed.canonicalScope.sceneId,
        authorizedFrameRanges: parsed.canonicalScope.authorizedFrameRanges,
      },
    }
  }
  if (version !== CAPTION_LIVING_FRAME_REQUEST_VERSION) {
    throw new Error('The frozen Living Frame payload version is unsupported.')
  }
  const validation = validateCaptionLivingFrameRequest(
    value as CaptionLivingFrameRequest)
  if (!validation.ok) {
    throw new Error(
      `The frozen Living Frame payload is invalid: ${validation.errors.join(' ')}`,
    )
  }
  const parsed = value as CaptionLivingFrameRequest
  return {
    phraseIds: parsed.semanticRequest.sourceSemanticPhraseIds,
    wordIds: parsed.semanticRequest.exactSourceWordIds,
    canonicalScope: {
      workspaceId: parsed.canonicalScope.workspaceId,
      projectId: parsed.canonicalScope.projectId,
      editSessionId: parsed.canonicalScope.editSessionId,
      planVersionId: parsed.canonicalScope.planVersionId,
      approvedSnapshotId: parsed.canonicalScope.approvedSnapshotId,
      outputId: null,
      sceneId: null,
      authorizedFrameRanges: null,
    },
  }
}

function frozenHandoffRef(value: CaptionCrossSystemHandoff): CaptionDomainRef {
  return {
    id: value.handoffId,
    version: value.schemaVersion,
    contentHash: value.handoffDigestSha256,
  }
}

export interface CaptionCrossSystemHandoffV2Context
  extends CaptionCrossSystemSourceContext {
  outboundPayload: unknown
  supportRequest?: unknown
  frozenCompatibilityHandoff?: CaptionCrossSystemHandoff | null
  frozenCompatibilitySupportRequest?: unknown
}

export function parseCaptionCrossSystemHandoffV2(
  value: unknown,
  context: CaptionCrossSystemHandoffV2Context,
): CaptionCrossSystemHandoffV2 {
  assertClosedContractTree(value, 'Caption cross-system handoff V2')
  assertNoUnsafeText(value, 'Caption cross-system handoff V2')
  const handoff = handoffSchema.parse(value)
  const payload = parseCaptionCrossSystemOutboundPayloadV2(
    context.outboundPayload, context)
  const profile = RECEIVER_PROFILE[payload.receiver]
  const support = context.supportRequest === undefined
    ? null : parseSkillSupportRequest(context.supportRequest)
  const frozen = context.frozenCompatibilityHandoff ?? null
  const explicitFrozenSupport =
    context.frozenCompatibilitySupportRequest === undefined
      ? null
      : parseSkillSupportRequest(context.frozenCompatibilitySupportRequest)
  const frozenSupport = explicitFrozenSupport ?? support
  const parsedFrozen = frozen === null || frozenSupport === null
    ? null : parseCaptionCrossSystemHandoff(
      frozen, context.resolution, frozenSupport)
  const genericPayload = support !== null && payload.receiver !== 'living_frame'
    ? parseCaptionCrossSystemOutboundPayloadV2(
      support.typedPayload, context)
    : null
  let livingFrameLineageValid = true
  if (support !== null && payload.receiver === 'living_frame') {
    const frozenPayload = parseFrozenLivingFramePayload(
      support.typedPayload, support.typedPayloadType)
    livingFrameLineageValid = frozenPayload.phraseIds.includes(
      payload.sourcePhraseId)
      && payload.exactSourceWordIds.every((wordId) =>
        frozenPayload.wordIds.includes(wordId))
      && frozenPayload.canonicalScope.workspaceId
        === payload.canonicalScope.workspaceId
      && frozenPayload.canonicalScope.projectId
        === payload.canonicalScope.projectId
      && frozenPayload.canonicalScope.editSessionId
        === payload.canonicalScope.editSessionId
      && frozenPayload.canonicalScope.planVersionId
        === payload.canonicalScope.planVersionId
      && frozenPayload.canonicalScope.approvedSnapshotId
        === (payload.canonicalScope.approvedSnapshotRef?.id ?? null)
      && (frozenPayload.canonicalScope.outputId === null
        || frozenPayload.canonicalScope.outputId === payload.canonicalScope.outputId)
      && (frozenPayload.canonicalScope.sceneId === null
        || frozenPayload.canonicalScope.sceneId === payload.canonicalScope.sceneId)
      && (frozenPayload.canonicalScope.authorizedFrameRanges === null
        || JSON.stringify(frozenPayload.canonicalScope.authorizedFrameRanges)
          === JSON.stringify(payload.canonicalScope.authorizedFrameRanges))
  }
  const expectedState = profile.supportTarget === null
    ? 'awaiting_shared_target_registry' : 'support_request_ready'
  const supportValid = profile.supportTarget === null
    ? support === null && handoff.supportRequestRef === null
    : support !== null
      && handoff.supportRequestRef !== null
      && support.targetSkillKey === profile.supportTarget
      && support.requestingSkillKey === 'captions'
      && exactRef(support.originalCallRef, payload.originCaptionCallRef)
      && exactSkillScope(skillScopeSchema.parse(support.canonicalScope),
        payload.canonicalScope)
      && exactRef(handoff.supportRequestRef, skillSupportRequestRef(support))
      && support.requestedArtifactTypes.length
        === payload.requestedReceivingCapability.expectedArtifactTypes.length
      && [...support.requestedArtifactTypes].sort().join('|')
        === [...payload.requestedReceivingCapability.expectedArtifactTypes]
          .sort().join('|')
      && (payload.receiver === 'living_frame'
        ? livingFrameLineageValid
        : support.typedPayloadType
            === CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_VERSION
          && genericPayload !== null
          && genericPayload.payloadId === payload.payloadId
          && genericPayload.payloadDigestSha256 === payload.payloadDigestSha256)
  const compatibilityRequired = payload.receiver === 'living_frame'
    || payload.receiver === 'transitions'
  const expectedFrozenKind = payload.receiver === 'living_frame'
    ? 'caption_to_living_frame' : 'transition_support'
  const frozenValid = handoff.frozenCompatibilityHandoffRef === null
    ? frozen === null && explicitFrozenSupport === null
      && !compatibilityRequired
    : parsedFrozen !== null
      && compatibilityRequired
      && exactRef(handoff.frozenCompatibilityHandoffRef,
        frozenHandoffRef(parsedFrozen))
      && parsedFrozen.receiver === payload.receiver
      && parsedFrozen.handoffKind === expectedFrozenKind
      && parsedFrozen.sourcePhraseIds.includes(payload.sourcePhraseId)
      && payload.exactSourceWordIds.every((wordId) =>
        parsedFrozen.exactSourceWordIds.includes(wordId))
  if (!exactScope(handoff.canonicalScope, payload.canonicalScope)
    || handoff.receiver !== payload.receiver
    || handoff.receiverSkillId !== payload.receiverSkillId
    || handoff.handoffKind !== payload.handoffKind
    || !exactRef(handoff.outboundPayloadRef,
      captionCrossSystemOutboundPayloadRef(payload))
    || handoff.coordinationState !== expectedState
    || !supportValid
    || !frozenValid) {
    throw new Error('Caption cross-system handoff V2 lineage is invalid.')
  }
  verifyDigest(handoff as unknown as Record<string, unknown>,
    'handoffDigestSha256', 'Caption cross-system handoff V2')
  return handoff
}

function expectedIncomingProfile(
  value: CaptionIncomingTypographyRequest,
): {
  requesterSkillId: CaptionIncomingTypographyRequest['requesterSkillId']
  jobType: CaptionIncomingTypographyRequest['requestedCaptionJobType']
  artifactType: CaptionIncomingTypographyRequest['expectedCaptionArtifactType']
} {
  return value.requester === 'living_frame' ? {
    requesterSkillId: 'motion.living_frame_storytelling',
    jobType: 'provide_speech_derived_typography_spec',
    artifactType: 'caption_speech_derived_typography_spec',
  } : {
    requesterSkillId: 'motion.transition_language',
    jobType: 'provide_typographic_transition_component',
    artifactType: 'caption_typographic_transition_component',
  }
}

export function parseCaptionIncomingTypographyRequestStructure(
  value: unknown,
): CaptionIncomingTypographyRequest {
  assertClosedContractTree(value, 'Caption incoming typography request')
  assertNoUnsafeText(value, 'Caption incoming typography request')
  const request = incomingTypographySchema.parse(value)
  const profile = expectedIncomingProfile(request)
  if (request.requesterSkillId !== profile.requesterSkillId
    || request.requestedCaptionJobType !== profile.jobType
    || request.expectedCaptionArtifactType !== profile.artifactType
    || !unique(request.exactSourceWordIds)
    || !unique(request.requestedEventRefs.map((ref) =>
      `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`))
    || !unique(request.requiredEvidenceTypes)) {
    throw new Error('Caption incoming typography request ownership is invalid.')
  }
  verifyDigest(request as unknown as Record<string, unknown>,
    'requestDigestSha256', 'Caption incoming typography request')
  return request
}

export function parseCaptionIncomingTypographyRequest(
  value: unknown,
  context: CaptionCrossSystemSourceContext,
): CaptionIncomingTypographyRequest {
  const { sceneGraph, resolution } = parseSourceContext(context)
  const request = parseCaptionIncomingTypographyRequestStructure(value)
  const source = sourceResolution(
    resolution, request.sourceNodeId, request.sourcePhraseId)
  const sourceNode = sourceSceneNode(
    sceneGraph, request.sourceNodeId, request.sourcePhraseId)
  const requestedEvents = source === undefined ? []
    : request.requestedEventRefs.map((ref) => source.semanticEventRefs.find(
      (event) => exactRef(event.eventRef, ref)))
  const handoffEvent = requestedEvents.find((event) =>
    event?.eventIntent === 'handoff')
  const restoreEvent = requestedEvents.find((event) =>
    event?.eventIntent === 'restore')
  if (!exactScope(request.canonicalScope, resolution.canonicalScope)
    || !exactRef(request.confirmedOutputFrameRef,
      resolution.confirmedOutputFrameRef)
    || !exactRef(request.masterTimingRef, resolution.masterTimingRef)
    || !exactRef(request.storyTimingResolutionRef, resolutionRef(resolution))
    || source === undefined
    || sourceNode === undefined
    || sourceNode.accessibilityCounterpartNodeId === null
    || !exactStringList(
      request.exactSourceWordIds, sourceNode.exactSourceWordIds)
    || !containsRange(source.cueRange, request.authorizedRange)
    || !request.canonicalScope.authorizedFrameRanges.some((range) =>
      containsRange(range, request.authorizedRange))
    || !request.requestedEventRefs.every((ref) =>
      source.semanticEventRefs.some((event) => exactRef(event.eventRef, ref)))
    || handoffEvent === undefined
    || restoreEvent === undefined
    || handoffEvent.frame > restoreEvent.frame
  ) {
    throw new Error('Caption incoming typography request lineage is invalid.')
  }
  return request
}

export function parseCaptionIncomingTypographySupportBundle(input: {
  payload: unknown
  supportRequest: unknown
  sceneGraph: unknown
  resolution: CaptionStoryTimingResolutionBinding
}): {
  payload: CaptionIncomingTypographyRequest
  supportRequest: SkillSupportRequestV2
} {
  assertClosedContractTree(input, 'Caption incoming typography bundle')
  const payload = parseCaptionIncomingTypographyRequest(
    input.payload, input)
  const supportRequest = parseSkillSupportRequestV2(input.supportRequest)
  const embeddedPayload = parseCaptionIncomingTypographyRequest(
    supportRequest.typedPayload, input)
  if (supportRequest.targetSkillKey !== 'captions'
    || supportRequest.requestingSkillKey !== payload.requesterSkillId
    || supportRequest.requestedJobType !== payload.requestedCaptionJobType
    || supportRequest.requestedArtifactTypes.length !== 1
    || supportRequest.requestedArtifactTypes[0]
      !== payload.expectedCaptionArtifactType
    || supportRequest.typedPayloadType
      !== CAPTION_INCOMING_TYPOGRAPHY_REQUEST_VERSION
    || !exactRef(supportRequest.originalCallRef,
      payload.requesterOriginCallRef)
    || !exactSkillScope(skillScopeSchema.parse(supportRequest.canonicalScope),
      payload.canonicalScope)
    || embeddedPayload.requestId !== payload.requestId
    || embeddedPayload.requestDigestSha256 !== payload.requestDigestSha256) {
    throw new Error(
      'Caption incoming typography support-request binding is invalid.',
    )
  }
  return { payload, supportRequest }
}

export interface CaptionCrossSystemCoordinationPlanContext {
  sceneGraph: unknown
  motionPlan: CaptionMotionPlan
  resolution: CaptionStoryTimingResolutionBinding
  outboundBundles: Array<{
    handoff: unknown
    outboundPayload: unknown
    supportRequest?: unknown
    frozenCompatibilityHandoff?: CaptionCrossSystemHandoff | null
    frozenCompatibilitySupportRequest?: unknown
  }>
  incomingBundles: Array<{
    payload: unknown
    supportRequest: unknown
  }>
}

function uniqueReceivers(values: CaptionCrossSystemReceiverV2[]) {
  return values.filter((value, index) => values.indexOf(value) === index)
}

function parseCoordinationContext(
  context: CaptionCrossSystemCoordinationPlanContext,
) {
  if (context.outboundBundles.length === 0
    || context.outboundBundles.length > 512
    || context.incomingBundles.length > 512) {
    throw new Error('Caption coordination requires a bounded outbound surface.')
  }
  const sceneGraph = parseCaptionMultiTrackSceneGraph(context.sceneGraph)
  assertClosedContractTree(
    context.motionPlan, 'Caption cross-system motion-plan context')
  verifyDigest(context.motionPlan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption cross-system motion-plan context')
  if (!exactScope(context.motionPlan.canonicalScope, sceneGraph.canonicalScope)
    || !exactRef(context.motionPlan.sceneGraphRef, sceneGraphRef(sceneGraph))) {
    throw new Error('Caption coordination motion-plan lineage is crossed.')
  }
  const outbound = context.outboundBundles.map((bundle) => {
    const payload = parseCaptionCrossSystemOutboundPayloadV2(
      bundle.outboundPayload, context)
    const handoff = parseCaptionCrossSystemHandoffV2(bundle.handoff, {
      resolution: context.resolution,
      sceneGraph: context.sceneGraph,
      outboundPayload: payload,
      supportRequest: bundle.supportRequest,
      frozenCompatibilityHandoff: bundle.frozenCompatibilityHandoff,
      frozenCompatibilitySupportRequest:
        bundle.frozenCompatibilitySupportRequest,
    })
    const supportRequest = bundle.supportRequest === undefined
      ? null : parseSkillSupportRequest(bundle.supportRequest)
    return { payload, handoff, supportRequest }
  })
  const incoming = context.incomingBundles.map((bundle) =>
    parseCaptionIncomingTypographySupportBundle({
      ...bundle,
      sceneGraph: context.sceneGraph,
      resolution: context.resolution,
    }))
  const first = outbound[0]!.payload
  if (outbound.some(({ payload }) =>
    !exactScope(payload.canonicalScope, context.motionPlan.canonicalScope)
      || !exactRef(payload.sourceCaptionPlanRef, first.sourceCaptionPlanRef)
      || !exactRef(payload.sourceCaptionSceneGraphRef,
        context.motionPlan.sceneGraphRef)
      || !exactRef(payload.sourceCaptionMotionPlanRef,
        motionPlanRef(context.motionPlan))
      || !exactRef(payload.canonicalTranscriptRef,
        first.canonicalTranscriptRef)
      || !exactRef(payload.confirmedOutputFrameRef,
        context.motionPlan.confirmedOutputFrameRef)
      || !exactRef(payload.masterTimingRef, context.resolution.masterTimingRef))
    || incoming.some(({ payload }) =>
      !exactRef(payload.sourceCaptionPlanRef, first.sourceCaptionPlanRef)
        || !exactRef(payload.canonicalTranscriptRef,
          first.canonicalTranscriptRef)
        || !exactRef(payload.confirmedOutputFrameRef,
          context.motionPlan.confirmedOutputFrameRef)
        || !exactRef(payload.masterTimingRef,
          context.resolution.masterTimingRef))) {
    throw new Error('Caption coordination source lineage is crossed or stale.')
  }
  return { outbound, incoming }
}

function refKeys(values: Array<SkillContractRef | CaptionDomainRef>): string[] {
  return values.map((ref) => `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`)
}

export function parseCaptionCrossSystemCoordinationPlan(
  value: unknown,
  context: CaptionCrossSystemCoordinationPlanContext,
): CaptionCrossSystemCoordinationPlan {
  assertClosedContractTree(value, 'Caption cross-system coordination plan')
  assertNoUnsafeText(value, 'Caption cross-system coordination plan')
  const plan = coordinationPlanSchema.parse(value)
  const parsed = parseCoordinationContext(context)
  const handoffRefs = parsed.outbound.map(({ handoff }) =>
    captionCrossSystemHandoffV2Ref(handoff))
  const payloadRefs = parsed.outbound.map(({ payload }) =>
    captionCrossSystemOutboundPayloadRef(payload))
  const outboundSupportRefs = parsed.outbound.flatMap(({ supportRequest }) =>
    supportRequest === null ? [] : [skillSupportRequestRef(supportRequest)])
  const incomingPayloadRefs = parsed.incoming.map(({ payload }) =>
    captionIncomingTypographyRequestRef(payload))
  const incomingSupportRefs = parsed.incoming.map(({ supportRequest }) =>
    skillSupportRequestRef(supportRequest))
  const receiverCoverage = uniqueReceivers(parsed.outbound.map(({ payload }) =>
    payload.receiver))
  const pending = uniqueReceivers(parsed.outbound
    .filter(({ payload }) => payload.sharedTargetAdmission.targetSkillKey === null)
    .map(({ payload }) => payload.receiver))
  const pendingHandoffCount = parsed.outbound.filter(({ payload }) =>
    payload.sharedTargetAdmission.targetSkillKey === null).length
  const receiverSurfaceComplete = REQUIRED_RECEIVER_COVERAGE.every((receiver) =>
    receiverCoverage.includes(receiver))
    && receiverCoverage.length === REQUIRED_RECEIVER_COVERAGE.length
  const incomingRequesterCoverage = Array.from(new Set(parsed.incoming.map(
    ({ payload }) => payload.requester)))
  const incomingRequesterSurfaceComplete =
    REQUIRED_INCOMING_REQUESTER_COVERAGE.every((requester) =>
      incomingRequesterCoverage.includes(requester))
    && incomingRequesterCoverage.length
      === REQUIRED_INCOMING_REQUESTER_COVERAGE.length
  const everyRefListUnique = [
    handoffRefs, payloadRefs, outboundSupportRefs,
    incomingPayloadRefs, incomingSupportRefs,
  ].every((refs) => unique(refKeys(refs)))
  if (!exactScope(plan.canonicalScope, context.motionPlan.canonicalScope)
    || !exactRef(plan.sourceCaptionPlanRef,
      parsed.outbound[0]!.payload.sourceCaptionPlanRef)
    || !exactRef(plan.sourceMotionPlanRef, motionPlanRef(context.motionPlan))
    || !exactRef(plan.canonicalTranscriptRef,
      parsed.outbound[0]!.payload.canonicalTranscriptRef)
    || !exactRef(plan.confirmedOutputFrameRef,
      context.motionPlan.confirmedOutputFrameRef)
    || !exactRef(plan.masterTimingRef, context.resolution.masterTimingRef)
    || !exactRef(plan.storyTimingResolutionRef,
      resolutionRef(context.resolution))
    || !exactScope(plan.canonicalScope, context.resolution.canonicalScope)
    || JSON.stringify(plan.outboundHandoffRefs) !== JSON.stringify(handoffRefs)
    || JSON.stringify(plan.outboundPayloadRefs) !== JSON.stringify(payloadRefs)
    || JSON.stringify(plan.outboundSupportRequestRefs)
      !== JSON.stringify(outboundSupportRefs)
    || JSON.stringify(plan.incomingTypographyRequestRefs)
      !== JSON.stringify(incomingPayloadRefs)
    || JSON.stringify(plan.incomingSupportRequestRefs)
      !== JSON.stringify(incomingSupportRefs)
    || JSON.stringify(plan.receiverCoverage) !== JSON.stringify(receiverCoverage)
    || JSON.stringify(plan.pendingSharedTargetReceivers)
      !== JSON.stringify(pending)
    || plan.counts.outboundHandoffs !== parsed.outbound.length
    || plan.counts.admittedOutboundSupportRequests
      !== outboundSupportRefs.length
    || plan.counts.pendingSharedTargetRegistrations !== pendingHandoffCount
    || plan.counts.incomingTypographyRequests !== parsed.incoming.length
    || plan.futureOrchestraTargetRegistryComplete !== (pending.length === 0)
    || !receiverSurfaceComplete
    || !incomingRequesterSurfaceComplete
    || !everyRefListUnique) {
    throw new Error('Caption cross-system coordination plan is inconsistent.')
  }
  verifyDigest(plan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption cross-system coordination plan')
  return plan
}

export function createCaptionCrossSystemCoordinationPlan(input: {
  planId: string
  context: CaptionCrossSystemCoordinationPlanContext
}): CaptionCrossSystemCoordinationPlan {
  assertClosedContractTree(input, 'Caption cross-system coordination input')
  const parsed = parseCoordinationContext(input.context)
  const handoffRefs = parsed.outbound.map(({ handoff }) =>
    captionCrossSystemHandoffV2Ref(handoff))
  const payloadRefs = parsed.outbound.map(({ payload }) =>
    captionCrossSystemOutboundPayloadRef(payload))
  const outboundSupportRefs = parsed.outbound.flatMap(({ supportRequest }) =>
    supportRequest === null ? [] : [skillSupportRequestRef(supportRequest)])
  const incomingPayloadRefs = parsed.incoming.map(({ payload }) =>
    captionIncomingTypographyRequestRef(payload))
  const incomingSupportRefs = parsed.incoming.map(({ supportRequest }) =>
    skillSupportRequestRef(supportRequest))
  const receiverCoverage = uniqueReceivers(parsed.outbound.map(({ payload }) =>
    payload.receiver))
  const pending = uniqueReceivers(parsed.outbound
    .filter(({ payload }) => payload.sharedTargetAdmission.targetSkillKey === null)
    .map(({ payload }) => payload.receiver))
  const pendingHandoffCount = parsed.outbound.filter(({ payload }) =>
    payload.sharedTargetAdmission.targetSkillKey === null).length
  const base: Omit<CaptionCrossSystemCoordinationPlan,
  'planDigestSha256'> = {
    schemaVersion: CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_VERSION,
    planId: safeKey.parse(input.planId),
    canonicalScope: structuredClone(input.context.motionPlan.canonicalScope),
    sourceCaptionPlanRef: structuredClone(
      parsed.outbound[0]!.payload.sourceCaptionPlanRef),
    sourceMotionPlanRef: motionPlanRef(input.context.motionPlan),
    canonicalTranscriptRef: structuredClone(
      parsed.outbound[0]!.payload.canonicalTranscriptRef),
    confirmedOutputFrameRef: structuredClone(
      input.context.motionPlan.confirmedOutputFrameRef),
    masterTimingRef: structuredClone(input.context.resolution.masterTimingRef),
    storyTimingResolutionRef: resolutionRef(input.context.resolution),
    outboundHandoffRefs: handoffRefs,
    outboundPayloadRefs: payloadRefs,
    outboundSupportRequestRefs: outboundSupportRefs,
    incomingTypographyRequestRefs: incomingPayloadRefs,
    incomingSupportRequestRefs: incomingSupportRefs,
    receiverCoverage,
    pendingSharedTargetReceivers: pending,
    counts: {
      outboundHandoffs: handoffRefs.length,
      admittedOutboundSupportRequests: outboundSupportRefs.length,
      pendingSharedTargetRegistrations: pendingHandoffCount,
      incomingTypographyRequests: incomingPayloadRefs.length,
    },
    exactOneToOneArtifactLineageVerified: true,
    captionOwnedHandoffSurfaceComplete: true,
    futureOrchestraTargetRegistryComplete: pending.length === 0,
    centralOrchestraImplemented: false,
    directPeerDispatchAdded: false,
    receiverExecutionClaimed: false,
    timelineMutationGranted: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionCrossSystemCoordinationPlan({
    ...base,
    planDigestSha256: digestRecord(
      { ...base, planDigestSha256: '' }, 'planDigestSha256'),
  }, input.context)
}
