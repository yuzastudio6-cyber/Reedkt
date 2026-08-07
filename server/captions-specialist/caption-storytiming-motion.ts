import { z } from 'zod'
import {
  CAPTION_CAMERA_REQUEST_VERSION,
  CAPTION_CROSS_SYSTEM_HANDOFF_VERSION,
  CAPTION_EFFECTIVE_READ_REPORT_VERSION,
  CAPTION_MOTION_LOCK_VERSION,
  CAPTION_MOTION_PLAN_VERSION,
  CAPTION_STORYTIMING_REGISTRATION_VERSION,
  CAPTION_STORYTIMING_RESOLUTION_VERSION,
  type CaptionCameraRequest,
  type CaptionCrossSystemHandoff,
  type CaptionEffectiveReadReport,
  type CaptionMotionLock,
  type CaptionMotionPlan,
  type CaptionMotionPrimitive,
  type CaptionMotionPrimitiveKind,
  type CaptionStoryTimingRegistrationRequest,
  type CaptionStoryTimingResolutionBinding,
} from '../../src/types/caption-storytiming-motion'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type { CaptionMultiTrackSceneGraph } from '../../src/types/caption-multi-track-scene-graph'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  validateCaptionLivingFrameRequest,
} from '../../src/lib/caption-direction/caption-living-frame-adapter'
import {
  CAPTION_LIVING_FRAME_REQUEST_VERSION,
  type CaptionLivingFrameRequest,
} from '../../src/types/caption-direction-living-frame'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
  skillSupportRequestSchema,
} from '../orchestra/orchestra-skill-contracts'
import { parseCaptionMultiTrackSceneGraph } from './caption-multi-track-scene-graph'
import {
  parseCaptionLivingFrameRequestV2,
} from './caption-living-frame-boundary'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const safeCode = safeKey
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const scopeSchema: z.ZodType<CaptionDomainCanonicalScope> = z.object({
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
const eventIntentSchema = z.enum([
  'caption_on', 'caption_off', 'emphasis_hit', 'hero_hit', 'motion_entry_end',
  'motion_exit_start', 'handoff', 'restore',
])
const primitiveKindSchema = z.enum([
  'reveal', 'fade', 'scale', 'slide', 'wipe', 'tracked_move',
  'depth_transition', 'emphasis_pulse', 'brush_reveal', 'list_append',
  'hero_expansion', 'handoff_morph', 'stable_hold', 'cut',
])
const easingSchema = z.enum([
  'linear', 'ease_in', 'ease_out', 'ease_in_out', 'spring_restrained',
])
const interruptionSchema = z.enum([
  'preserve_accessible_text', 'stable_cut', 'defer_handoff',
])

const registrationSchema: z.ZodType<CaptionStoryTimingRegistrationRequest> = z.object({
  schemaVersion: z.literal(CAPTION_STORYTIMING_REGISTRATION_VERSION),
  registrationId: safeKey,
  registrationDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  masterTimingRef: refSchema,
  pictureLockRef: refSchema,
  registrations: z.array(z.object({
    registrationItemId: safeKey,
    nodeId: safeKey,
    trackId: safeKey,
    phraseId: safeKey,
    timingRequirementRef: refSchema,
    semanticEventIntents: z.array(eventIntentSchema).min(2).max(8),
    minimumStableReadFrames: z.number().int().positive().max(3_600),
    preferredEntryFrames: z.number().int().nonnegative().max(240),
    preferredExitFrames: z.number().int().nonnegative().max(240),
    interruptionPolicy: interruptionSchema,
  }).strict()).min(1).max(4_096),
  phaseRegistrations: z.array(z.object({
    phaseId: safeKey,
    storyTimingRequirementRef: refSchema,
    activeNodeIds: z.array(safeKey).min(1).max(64),
  }).strict()).min(1).max(128),
  semanticIntentOnly: z.literal(true),
  executableFramesIncluded: z.literal(false),
  storyTimingRemainsSoleFrameAuthority: z.literal(true),
  timelineMutationGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const resolutionSchema: z.ZodType<CaptionStoryTimingResolutionBinding> = z.object({
  schemaVersion: z.literal(CAPTION_STORYTIMING_RESOLUTION_VERSION),
  resolutionId: safeKey,
  resolutionDigestSha256: sha256,
  registrationRef: refSchema,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  masterTimingRef: refSchema,
  storyTimingRef: refSchema,
  fpsNumerator: z.number().int().positive().max(240_000),
  fpsDenominator: z.number().int().positive().max(10_000),
  nodeResolutions: z.array(z.object({
    registrationItemId: safeKey,
    nodeId: safeKey,
    trackId: safeKey,
    phraseId: safeKey,
    timingRequirementRef: refSchema,
    cueRange: frameRangeSchema,
    semanticEventRefs: z.array(z.object({
      eventIntent: eventIntentSchema,
      eventRef: refSchema,
      frame: z.number().int().nonnegative(),
    }).strict()).min(2).max(8),
    stableReadRange: frameRangeSchema,
  }).strict()).min(1).max(4_096),
  phaseResolutions: z.array(z.object({
    phaseId: safeKey,
    storyTimingRequirementRef: refSchema,
    resolvedEventRef: refSchema,
    frameRange: frameRangeSchema,
  }).strict()).min(1).max(128),
  evidenceMode: z.enum(['contract_fixture', 'authenticated_private_runtime']),
  exactCanonicalRereadVerified: z.boolean(),
  exactMasterTimingDigestVerified: z.boolean(),
  storyTimingProducedBinding: z.literal(true),
  captionProducedFinalFrames: z.literal(false),
  parallelClockCreated: z.literal(false),
  timelineMutationGrantedToCaption: z.literal(false),
  runtimeExecutionGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const primitiveSchema: z.ZodType<CaptionMotionPrimitive> = z.object({
  primitiveId: safeKey,
  nodeId: safeKey,
  primitive: primitiveKindSchema,
  frameRange: frameRangeSchema,
  stableReadImpactFrames: z.number().int().nonnegative().max(3_600),
  easing: easingSchema,
  travelBasisPoints: z.object({
    x: z.number().int().min(-10_000).max(10_000),
    y: z.number().int().min(-10_000).max(10_000),
  }).strict(),
  startScaleBasisPoints: z.number().int().min(0).max(40_000),
  endScaleBasisPoints: z.number().int().min(0).max(40_000),
  startOpacityBasisPoints: z.number().int().min(0).max(10_000),
  endOpacityBasisPoints: z.number().int().min(0).max(10_000),
  overshootBasisPoints: z.number().int().min(0).max(3_000),
  staggerFrames: z.number().int().nonnegative().max(240),
  interruptionPolicy: interruptionSchema,
  semanticReasonCode: safeCode,
  reducedMotionReplacement: z.object({
    primitive: z.enum(['fade', 'stable_hold', 'cut']),
    frameRange: frameRangeSchema,
    preservesMeaning: z.literal(true),
    preservesOrder: z.literal(true),
    preservesStableReadRequirement: z.literal(true),
  }).strict(),
}).strict()

const readReportSchema: z.ZodType<CaptionEffectiveReadReport> = z.object({
  schemaVersion: z.literal(CAPTION_EFFECTIVE_READ_REPORT_VERSION),
  reportId: safeKey,
  reportDigestSha256: sha256,
  canonicalScope: scopeSchema,
  storyTimingRegistrationRef: refSchema,
  storyTimingResolutionRef: refSchema,
  entries: z.array(z.object({
    nodeId: safeKey,
    cueRange: frameRangeSchema,
    totalCueFrames: z.number().int().positive(),
    unstableEntryFrames: z.number().int().nonnegative(),
    unstableExitFrames: z.number().int().nonnegative(),
    additionalUnreadableRanges: z.array(frameRangeSchema).max(512),
    additionalUnreadableFrames: z.number().int().nonnegative(),
    effectiveStableReadFrames: z.number().int().nonnegative(),
    minimumStableReadFrames: z.number().int().positive(),
    passed: z.boolean(),
    blockerCodes: z.array(safeCode).max(16),
  }).strict()).min(1).max(4_096),
  allEntriesPassed: z.boolean(),
  effectiveTimeUsesUnionOfUnreadableFrames: z.literal(true),
  rawCueDurationAloneAccepted: z.literal(false),
  speechClarityOutranksDecorativeMotion: z.literal(true),
}).strict()

const handoffSchema: z.ZodType<CaptionCrossSystemHandoff> = z.object({
  schemaVersion: z.literal(CAPTION_CROSS_SYSTEM_HANDOFF_VERSION),
  handoffId: safeKey,
  handoffDigestSha256: sha256,
  canonicalScope: scopeSchema,
  receiver: z.enum(['visual_intelligence', 'living_frame', 'transitions']),
  handoffKind: z.enum([
    'caption_to_visual', 'caption_to_living_frame', 'transition_support',
  ]),
  sourceOwner: z.literal('captions'),
  targetOwner: z.enum(['visual_intelligence', 'living_frame', 'transitions']),
  sourcePhraseIds: z.array(safeKey).min(1).max(4_096),
  exactSourceWordIds: z.array(safeKey).min(1).max(20_000),
  semanticConceptId: safeKey,
  semanticPurposeCode: safeCode,
  continuityToken: safeKey,
  storyTimingResolutionRef: refSchema,
  requestedEventRefs: z.array(refSchema).min(1).max(512),
  accessibleCounterpartNodeIds: z.array(safeKey).min(1).max(512),
  sourceSupportPayloadRef: refSchema,
  supportRequestRef: refSchema,
  fallback: z.object({
    preserveAccessibleCaption: z.literal(true),
    restoreCreativeCaption: z.boolean(),
    selectedFallbackCode: safeCode,
  }).strict(),
  informationOwnershipTransferRequested: z.boolean(),
  duplicateConceptAfterSuccessfulTransferAllowed: z.literal(false),
  receiverExecutionClaimed: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const cameraSchema: z.ZodType<CaptionCameraRequest> = z.object({
  schemaVersion: z.literal(CAPTION_CAMERA_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  storyTimingResolutionRef: refSchema,
  requestedFrameRange: frameRangeSchema,
  semanticPurposeCode: safeCode,
  protectedRegionIds: z.array(safeKey).min(1).max(512),
  requestedBehavior: z.enum([
    'hold_stable', 'reduce_motion_during_read', 'preserve_caption_region',
    'coordinate_semantic_reveal',
  ]),
  maximumCameraMotionBasisPoints: z.number().int().min(0).max(10_000),
  reducedMotionBehavior: z.literal('hold_stable'),
  cameraOwnerResponseRef: refSchema.nullable(),
  captionControlsCamera: z.literal(false),
  timelineMutationGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const motionPlanSchema: z.ZodType<CaptionMotionPlan> = z.object({
  schemaVersion: z.literal(CAPTION_MOTION_PLAN_VERSION),
  planId: safeKey,
  planDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  storyTimingRegistrationRef: refSchema,
  storyTimingResolutionRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  primitives: z.array(primitiveSchema).min(1).max(4_096),
  effectiveReadReportRef: refSchema,
  handoffs: z.array(handoffSchema).max(512),
  cameraRequests: z.array(cameraSchema).max(512),
  supportRequests: z.array(skillSupportRequestSchema).max(512),
  reducedMotionComplete: z.boolean(),
  repetitionLimitApplied: z.literal(true),
  sharedAttentionBudgetApplied: z.literal(true),
  modelAuthoredCodeIncluded: z.literal(false),
  storyTimingSoleFrameAuthority: z.literal(true),
  remotionRemainsFinalCanvas: z.literal(true),
  runtimeExecutionGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const lockSchema: z.ZodType<CaptionMotionLock> = z.object({
  schemaVersion: z.literal(CAPTION_MOTION_LOCK_VERSION),
  lockId: safeKey,
  lockDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  motionPlanRef: refSchema,
  storyTimingResolutionRef: refSchema,
  effectiveReadReportRef: refSchema,
  rendererSpecRef: refSchema.nullable(),
  linkedSoundPlanRefs: z.array(refSchema).max(512),
  state: z.enum(['contract_ready', 'authenticated_private_ready', 'blocked']),
  blockerCodes: z.array(safeCode).max(256),
  exactStoryTimingRereadRequiredForExecution: z.literal(true),
  motionChangeInvalidatesLinkedSound: z.literal(true),
  storyTimingSoleFrameAuthority: z.literal(true),
  runtimeExecutionGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

function digestRecord<T extends Record<string, unknown>>(value: T, field: string): string {
  return calculateSkillContractDigest(value, field)
}

function verifyDigest(value: Record<string, unknown>, field: string, label: string): void {
  if (digestRecord(value, field) !== value[field]) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function scopeKey(scope: CaptionDomainCanonicalScope): string {
  return digestRecord({ scope, digest: '' }, 'digest')
}

function exactScope(left: CaptionDomainCanonicalScope, right: CaptionDomainCanonicalScope): boolean {
  return scopeKey(left) === scopeKey(right)
}

function containsRange(outer: CaptionDomainFrameRange, inner: CaptionDomainFrameRange): boolean {
  return inner.startFrame >= outer.startFrame
    && inner.endFrameExclusive <= outer.endFrameExclusive
}

function unionFrameLength(ranges: CaptionDomainFrameRange[]): number {
  if (ranges.length === 0) return 0
  const ordered = [...ranges].sort((left, right) =>
    left.startFrame - right.startFrame
    || left.endFrameExclusive - right.endFrameExclusive)
  let total = 0
  let start = ordered[0].startFrame
  let end = ordered[0].endFrameExclusive
  for (const range of ordered.slice(1)) {
    if (range.startFrame <= end) {
      end = Math.max(end, range.endFrameExclusive)
    } else {
      total += end - start
      start = range.startFrame
      end = range.endFrameExclusive
    }
  }
  return total + end - start
}

function recordRef(id: string, version: string, digest: string): CaptionDomainRef {
  return { id, version, contentHash: digest }
}

function graphRef(graph: CaptionMultiTrackSceneGraph): CaptionDomainRef {
  return recordRef(graph.graphId, graph.schemaVersion, graph.graphDigestSha256)
}

function registrationRef(value: CaptionStoryTimingRegistrationRequest): CaptionDomainRef {
  return recordRef(value.registrationId, value.schemaVersion, value.registrationDigestSha256)
}

function resolutionRef(value: CaptionStoryTimingResolutionBinding): CaptionDomainRef {
  return recordRef(value.resolutionId, value.schemaVersion, value.resolutionDigestSha256)
}

function readReportRef(value: CaptionEffectiveReadReport): CaptionDomainRef {
  return recordRef(value.reportId, value.schemaVersion, value.reportDigestSha256)
}

function motionPlanRef(value: CaptionMotionPlan): CaptionDomainRef {
  return recordRef(value.planId, value.schemaVersion, value.planDigestSha256)
}

export function parseCaptionStoryTimingRegistration(
  value: unknown,
  graphValue: unknown,
): CaptionStoryTimingRegistrationRequest {
  assertClosedContractTree(value, 'Caption StoryTiming registration')
  const graph = parseCaptionMultiTrackSceneGraph(graphValue)
  const registration = registrationSchema.parse(value)
  const nodeIds = new Set(graph.nodes.map((node) => node.nodeId))
  const phaseIds = new Set(graph.modePhases.map((phase) => phase.phaseId))
  if (!exactScope(registration.canonicalScope, graph.canonicalScope)
    || !exactRef(registration.sceneGraphRef, graphRef(graph))
    || !exactRef(registration.confirmedOutputFrameRef, graph.confirmedOutputFrameRef)
    || !exactRef(registration.pictureLockRef, graph.pictureLockRef)
    || registration.registrations.length !== graph.nodes.length
    || new Set(registration.registrations.map((item) => item.registrationItemId)).size
      !== registration.registrations.length
    || new Set(registration.registrations.map((item) => item.nodeId)).size
      !== registration.registrations.length
    || registration.registrations.some((item) => {
      const node = graph.nodes.find((candidate) => candidate.nodeId === item.nodeId)
      return !node || !nodeIds.has(item.nodeId) || node.trackId !== item.trackId
        || node.phraseId !== item.phraseId
        || !exactRef(node.timingRequirementRef, item.timingRequirementRef)
        || !item.semanticEventIntents.includes('caption_on')
        || !item.semanticEventIntents.includes('caption_off')
    })
    || registration.phaseRegistrations.length !== graph.modePhases.length
    || registration.phaseRegistrations.some((item) => {
      const phase = graph.modePhases.find((candidate) => candidate.phaseId === item.phaseId)
      return !phase || !phaseIds.has(item.phaseId)
        || !exactRef(phase.storyTimingRequirementRef, item.storyTimingRequirementRef)
        || item.activeNodeIds.join('|') !== phase.activeNodeIds.join('|')
    })) {
    throw new Error('Caption StoryTiming registration is stale or incomplete.')
  }
  verifyDigest(registration as unknown as Record<string, unknown>,
    'registrationDigestSha256', 'Caption StoryTiming registration')
  return registration
}

export function createCaptionStoryTimingRegistration(input: {
  registrationId: string
  sceneGraph: unknown
  masterTimingRef: CaptionDomainRef
  minimumStableReadFramesByNode?: Record<string, number>
  handoffSourceNodeIds?: string[]
}): CaptionStoryTimingRegistrationRequest {
  assertClosedContractTree(input, 'Caption StoryTiming registration input')
  const graph = parseCaptionMultiTrackSceneGraph(input.sceneGraph)
  const handoffSourceNodeIds = new Set(input.handoffSourceNodeIds ?? [])
  if (handoffSourceNodeIds.size !== (input.handoffSourceNodeIds ?? []).length
    || [...handoffSourceNodeIds].some((nodeId) =>
      !graph.nodes.some((node) => node.nodeId === nodeId))) {
    throw new Error('Caption handoff timing registrations reference unknown nodes.')
  }
  const base: Omit<CaptionStoryTimingRegistrationRequest, 'registrationDigestSha256'> = {
    schemaVersion: CAPTION_STORYTIMING_REGISTRATION_VERSION,
    registrationId: safeKey.parse(input.registrationId),
    canonicalScope: structuredClone(graph.canonicalScope),
    sceneGraphRef: graphRef(graph),
    confirmedOutputFrameRef: structuredClone(graph.confirmedOutputFrameRef),
    masterTimingRef: refSchema.parse(input.masterTimingRef),
    pictureLockRef: structuredClone(graph.pictureLockRef),
    registrations: graph.nodes.map((node) => ({
      registrationItemId: `${input.registrationId}.${node.nodeId}`,
      nodeId: node.nodeId,
      trackId: node.trackId,
      phraseId: node.phraseId,
      timingRequirementRef: structuredClone(node.timingRequirementRef),
      semanticEventIntents: [
        'caption_on', 'motion_entry_end',
        ...(node.semanticRole === 'hero_concept' ? ['hero_hit' as const] : []),
        ...(handoffSourceNodeIds.has(node.nodeId)
          ? ['handoff' as const, 'restore' as const] : []),
        'motion_exit_start', 'caption_off',
      ],
      minimumStableReadFrames: input.minimumStableReadFramesByNode?.[node.nodeId] ?? 24,
      preferredEntryFrames: node.semanticRole === 'hero_concept' ? 8 : 4,
      preferredExitFrames: 4,
      interruptionPolicy: 'preserve_accessible_text',
    })),
    phaseRegistrations: graph.modePhases.map((phase) => ({
      phaseId: phase.phaseId,
      storyTimingRequirementRef: structuredClone(phase.storyTimingRequirementRef),
      activeNodeIds: [...phase.activeNodeIds],
    })),
    semanticIntentOnly: true,
    executableFramesIncluded: false,
    storyTimingRemainsSoleFrameAuthority: true,
    timelineMutationGranted: false,
    runtimeExecutionGranted: false,
    finalQaApprovalGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionStoryTimingRegistration({
    ...base,
    registrationDigestSha256: digestRecord(
      { ...base, registrationDigestSha256: '' }, 'registrationDigestSha256'),
  }, graph)
}

export function parseCaptionStoryTimingResolution(
  value: unknown,
  registrationValue: unknown,
  graphValue: unknown,
): CaptionStoryTimingResolutionBinding {
  assertClosedContractTree(value, 'Caption StoryTiming resolution')
  const graph = parseCaptionMultiTrackSceneGraph(graphValue)
  const registration = parseCaptionStoryTimingRegistration(registrationValue, graph)
  const resolution = resolutionSchema.parse(value)
  if (!exactScope(resolution.canonicalScope, graph.canonicalScope)
    || !exactRef(resolution.registrationRef, registrationRef(registration))
    || !exactRef(resolution.sceneGraphRef, graphRef(graph))
    || !exactRef(resolution.confirmedOutputFrameRef, graph.confirmedOutputFrameRef)
    || !exactRef(resolution.masterTimingRef, registration.masterTimingRef)
    || resolution.nodeResolutions.length !== registration.registrations.length
    || resolution.phaseResolutions.length !== registration.phaseRegistrations.length
    || new Set(resolution.nodeResolutions.map((item) => item.nodeId)).size
      !== resolution.nodeResolutions.length
    || resolution.nodeResolutions.some((item) => {
      const source = registration.registrations.find((candidate) =>
        candidate.registrationItemId === item.registrationItemId)
      return !source || source.nodeId !== item.nodeId || source.trackId !== item.trackId
        || source.phraseId !== item.phraseId
        || !exactRef(source.timingRequirementRef, item.timingRequirementRef)
        || !containsRange(item.cueRange, item.stableReadRange)
        || item.semanticEventRefs.some((event) => !containsRange(item.cueRange, {
          startFrame: event.frame,
          endFrameExclusive: event.frame + 1,
        }))
        || !source.semanticEventIntents.every((intent) =>
          item.semanticEventRefs.some((event) => event.eventIntent === intent))
        || !registration.canonicalScope.authorizedFrameRanges.some((range) =>
          containsRange(range, item.cueRange))
    })
    || resolution.phaseResolutions.some((item) => {
      const source = registration.phaseRegistrations.find((candidate) =>
        candidate.phaseId === item.phaseId)
      return !source || !exactRef(source.storyTimingRequirementRef,
        item.storyTimingRequirementRef)
        || !registration.canonicalScope.authorizedFrameRanges.some((range) =>
          containsRange(range, item.frameRange))
    })
    || (resolution.evidenceMode === 'authenticated_private_runtime'
      && (!resolution.exactCanonicalRereadVerified
        || !resolution.exactMasterTimingDigestVerified))) {
    throw new Error('Caption StoryTiming resolution is stale, incomplete, or out of scope.')
  }
  verifyDigest(resolution as unknown as Record<string, unknown>,
    'resolutionDigestSha256', 'Caption StoryTiming resolution')
  return resolution
}

export function createCaptionEffectiveReadReport(input: {
  reportId: string
  resolution: unknown
  registration: unknown
  sceneGraph: unknown
  primitiveImpacts: Array<{
    nodeId: string
    unstableEntryFrames: number
    unstableExitFrames: number
    additionalUnreadableRanges: CaptionDomainFrameRange[]
  }>
}): CaptionEffectiveReadReport {
  assertClosedContractTree(input, 'Caption effective-read input')
  const registration = parseCaptionStoryTimingRegistration(input.registration, input.sceneGraph)
  const resolution = parseCaptionStoryTimingResolution(
    input.resolution, registration, input.sceneGraph,
  )
  const impacts = new Map(input.primitiveImpacts.map((item) => [item.nodeId, item]))
  if (impacts.size !== input.primitiveImpacts.length
    || input.primitiveImpacts.some((item) => item.unstableEntryFrames < 0
      || item.unstableExitFrames < 0)) {
    throw new Error('Caption effective-read impacts are invalid.')
  }
  const entries = resolution.nodeResolutions.map((item) => {
    const requirement = registration.registrations.find((candidate) =>
      candidate.nodeId === item.nodeId)!
    const impact = impacts.get(item.nodeId) ?? {
      unstableEntryFrames: 0,
      unstableExitFrames: 0,
      additionalUnreadableRanges: [],
    }
    const totalCueFrames = item.cueRange.endFrameExclusive - item.cueRange.startFrame
    const explicitlyStableFrames = item.stableReadRange.endFrameExclusive
      - item.stableReadRange.startFrame
    const unreadableRanges = [
      ...(impact.unstableEntryFrames > 0 ? [{
        startFrame: item.cueRange.startFrame,
        endFrameExclusive: Math.min(item.cueRange.endFrameExclusive,
          item.cueRange.startFrame + impact.unstableEntryFrames),
      }] : []),
      ...(impact.unstableExitFrames > 0 ? [{
        startFrame: Math.max(item.cueRange.startFrame,
          item.cueRange.endFrameExclusive - impact.unstableExitFrames),
        endFrameExclusive: item.cueRange.endFrameExclusive,
      }] : []),
      ...impact.additionalUnreadableRanges,
    ]
    if (unreadableRanges.some((range) => !containsRange(item.cueRange, range))) {
      throw new Error(`Caption unreadable range for ${item.nodeId} is outside its cue.`)
    }
    const unionUnreadableFrames = unionFrameLength(unreadableRanges)
    const additionalUnreadableFrames = unionFrameLength(impact.additionalUnreadableRanges)
    const effectiveStableReadFrames = Math.min(
      explicitlyStableFrames, totalCueFrames - unionUnreadableFrames,
    )
    const passed = effectiveStableReadFrames >= requirement.minimumStableReadFrames
    return {
      nodeId: item.nodeId,
      cueRange: structuredClone(item.cueRange),
      totalCueFrames,
      unstableEntryFrames: impact.unstableEntryFrames,
      unstableExitFrames: impact.unstableExitFrames,
      additionalUnreadableRanges: structuredClone(impact.additionalUnreadableRanges),
      additionalUnreadableFrames,
      effectiveStableReadFrames,
      minimumStableReadFrames: requirement.minimumStableReadFrames,
      passed,
      blockerCodes: passed ? [] : ['effective_read_time_too_short'],
    }
  })
  const base: Omit<CaptionEffectiveReadReport, 'reportDigestSha256'> = {
    schemaVersion: CAPTION_EFFECTIVE_READ_REPORT_VERSION,
    reportId: safeKey.parse(input.reportId),
    canonicalScope: structuredClone(resolution.canonicalScope),
    storyTimingRegistrationRef: registrationRef(registration),
    storyTimingResolutionRef: resolutionRef(resolution),
    entries,
    allEntriesPassed: entries.every((entry) => entry.passed),
    effectiveTimeUsesUnionOfUnreadableFrames: true,
    rawCueDurationAloneAccepted: false,
    speechClarityOutranksDecorativeMotion: true,
  }
  return parseCaptionEffectiveReadReport({
    ...base,
    reportDigestSha256: digestRecord(
      { ...base, reportDigestSha256: '' }, 'reportDigestSha256'),
  }, registration, resolution)
}

export function parseCaptionEffectiveReadReport(
  value: unknown,
  registrationValue: CaptionStoryTimingRegistrationRequest,
  resolutionValue: CaptionStoryTimingResolutionBinding,
): CaptionEffectiveReadReport {
  assertClosedContractTree(value, 'Caption effective-read report')
  const report = readReportSchema.parse(value)
  if (!exactScope(report.canonicalScope, resolutionValue.canonicalScope)
    || !exactRef(report.storyTimingRegistrationRef, registrationRef(registrationValue))
    || !exactRef(report.storyTimingResolutionRef, resolutionRef(resolutionValue))
    || report.entries.length !== resolutionValue.nodeResolutions.length
    || report.entries.some((entry) => {
      const resolution = resolutionValue.nodeResolutions.find((candidate) =>
        candidate.nodeId === entry.nodeId)
      const requirement = registrationValue.registrations.find((candidate) =>
        candidate.nodeId === entry.nodeId)
      const total = entry.cueRange.endFrameExclusive - entry.cueRange.startFrame
      const entryRange = {
        startFrame: entry.cueRange.startFrame,
        endFrameExclusive: Math.min(entry.cueRange.endFrameExclusive,
          entry.cueRange.startFrame + entry.unstableEntryFrames),
      }
      const exitRange = {
        startFrame: Math.max(entry.cueRange.startFrame,
          entry.cueRange.endFrameExclusive - entry.unstableExitFrames),
        endFrameExclusive: entry.cueRange.endFrameExclusive,
      }
      const allUnreadableRanges = [
        ...(entry.unstableEntryFrames > 0 ? [entryRange] : []),
        ...(entry.unstableExitFrames > 0 ? [exitRange] : []),
        ...entry.additionalUnreadableRanges,
      ]
      const expectedEffective = Math.min(
        resolution
          ? resolution.stableReadRange.endFrameExclusive
            - resolution.stableReadRange.startFrame : 0,
        Math.max(0, total - unionFrameLength(allUnreadableRanges)),
      )
      return !resolution || !requirement || !exactRef(
        { id: 'range', version: `${entry.cueRange.startFrame}`, contentHash: `${entry.cueRange.endFrameExclusive}` },
        { id: 'range', version: `${resolution.cueRange.startFrame}`, contentHash: `${resolution.cueRange.endFrameExclusive}` },
      ) || entry.totalCueFrames !== total
        || entry.additionalUnreadableRanges.some((range) =>
          !containsRange(entry.cueRange, range))
        || entry.additionalUnreadableFrames
          !== unionFrameLength(entry.additionalUnreadableRanges)
        || entry.minimumStableReadFrames !== requirement.minimumStableReadFrames
        || entry.effectiveStableReadFrames !== expectedEffective
        || entry.passed !== (expectedEffective >= entry.minimumStableReadFrames)
    })
    || report.allEntriesPassed !== report.entries.every((entry) => entry.passed)) {
    throw new Error('Caption effective-read report is inconsistent.')
  }
  verifyDigest(report as unknown as Record<string, unknown>,
    'reportDigestSha256', 'Caption effective-read report')
  return report
}

export function parseCaptionCrossSystemHandoff(
  value: unknown,
  resolution: CaptionStoryTimingResolutionBinding,
  supportRequestValue: unknown,
): CaptionCrossSystemHandoff {
  assertClosedContractTree(value, 'Caption cross-system handoff')
  const handoff = handoffSchema.parse(value)
  const supportRequest = parseSkillSupportRequest(supportRequestValue)
  const expectedTarget = handoff.receiver === 'transitions' ? 'transitions' : handoff.receiver
  const expectedKindByReceiver = {
    visual_intelligence: 'caption_to_visual',
    living_frame: 'caption_to_living_frame',
    transitions: 'transition_support',
  } as const
  const livingFrameRequest = handoff.receiver === 'living_frame'
    ? parseLivingFrameSupportPayload(supportRequest.typedPayloadType,
      supportRequest.typedPayload) : null
  if (!exactScope(handoff.canonicalScope, resolution.canonicalScope)
    || !exactRef(handoff.storyTimingResolutionRef, resolutionRef(resolution))
    || handoff.receiver !== handoff.targetOwner
    || handoff.handoffKind !== expectedKindByReceiver[handoff.receiver]
    || supportRequest.targetSkillKey !== expectedTarget
    || supportRequest.requestId !== handoff.supportRequestRef.id
    || supportRequest.schemaVersion !== handoff.supportRequestRef.version
    || supportRequest.requestDigestSha256 !== handoff.supportRequestRef.contentHash
    || handoff.handoffKind === 'caption_to_living_frame'
      && supportRequest.typedPayloadType !== CAPTION_LIVING_FRAME_REQUEST_VERSION
      && supportRequest.typedPayloadType !== 'caption-direction-living-frame-request-v2'
    || handoff.handoffKind === 'caption_to_visual'
      && handoff.informationOwnershipTransferRequested
    || handoff.handoffKind === 'transition_support'
      && handoff.informationOwnershipTransferRequested
    || livingFrameRequest !== null
      && (handoff.sourceSupportPayloadRef.id !== livingFrameRequest.requestId
        || handoff.sourceSupportPayloadRef.version !== livingFrameRequest.schemaVersion
        || handoff.sourceSupportPayloadRef.contentHash
          !== normalizeLivingFrameWireDigest(livingFrameRequest.requestDigestSha256))) {
    throw new Error('Caption cross-system handoff violates its owner boundary.')
  }
  verifyDigest(handoff as unknown as Record<string, unknown>,
    'handoffDigestSha256', 'Caption cross-system handoff')
  return handoff
}

function normalizeLivingFrameWireDigest(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function parseLivingFrameSupportPayload(
  payloadType: string,
  payload: unknown,
): CaptionLivingFrameRequest | ReturnType<typeof parseCaptionLivingFrameRequestV2> {
  if (payloadType === 'caption-direction-living-frame-request-v2') {
    return parseCaptionLivingFrameRequestV2(payload)
  }
  if (payloadType !== CAPTION_LIVING_FRAME_REQUEST_VERSION) {
    throw new Error('Caption Living Frame support payload version is unsupported.')
  }
  const validation = validateCaptionLivingFrameRequest(payload as CaptionLivingFrameRequest)
  if (!validation.ok) {
    throw new Error(`Caption Living Frame V1 support payload is invalid: ${validation.errors.join(' ')}`)
  }
  return payload as CaptionLivingFrameRequest
}

export function parseCaptionCameraRequest(
  value: unknown,
  graph: CaptionMultiTrackSceneGraph,
  resolution: CaptionStoryTimingResolutionBinding,
): CaptionCameraRequest {
  assertClosedContractTree(value, 'Caption camera request')
  const request = cameraSchema.parse(value)
  if (!exactScope(request.canonicalScope, graph.canonicalScope)
    || !exactRef(request.sceneGraphRef, graphRef(graph))
    || !exactRef(request.storyTimingResolutionRef, resolutionRef(resolution))
    || !request.canonicalScope.authorizedFrameRanges.some((range) =>
      containsRange(range, request.requestedFrameRange))) {
    throw new Error('Caption camera request is stale or out of scope.')
  }
  verifyDigest(request as unknown as Record<string, unknown>,
    'requestDigestSha256', 'Caption camera request')
  return request
}

export interface CaptionMotionPrimitiveProposal {
  primitiveId: string
  nodeId: string
  primitive: CaptionMotionPrimitiveKind
  unstableEntryFrames: number
  unstableExitFrames: number
  additionalUnreadableRanges: CaptionDomainFrameRange[]
  easing: CaptionMotionPrimitive['easing']
  travelBasisPoints: CaptionMotionPrimitive['travelBasisPoints']
  startScaleBasisPoints: number
  endScaleBasisPoints: number
  startOpacityBasisPoints: number
  endOpacityBasisPoints: number
  overshootBasisPoints: number
  staggerFrames: number
  interruptionPolicy: CaptionMotionPrimitive['interruptionPolicy']
  semanticReasonCode: string
  reducedMotionPrimitive: 'fade' | 'stable_hold' | 'cut'
}

export function createCaptionMotionPlan(input: {
  planId: string
  sceneGraph: unknown
  registration: unknown
  resolution: unknown
  primitiveProposals: CaptionMotionPrimitiveProposal[]
  handoffBundles: Array<{ handoff: unknown; supportRequest: unknown }>
  cameraRequests: unknown[]
}): { plan: CaptionMotionPlan; effectiveReadReport: CaptionEffectiveReadReport } {
  assertClosedContractTree(input, 'Caption motion-plan input')
  const graph = parseCaptionMultiTrackSceneGraph(input.sceneGraph)
  const registration = parseCaptionStoryTimingRegistration(input.registration, graph)
  const resolution = parseCaptionStoryTimingResolution(input.resolution, registration, graph)
  if (input.primitiveProposals.length !== graph.nodes.length
    || new Set(input.primitiveProposals.map((item) => item.primitiveId)).size
      !== input.primitiveProposals.length
    || new Set(input.primitiveProposals.map((item) => item.nodeId)).size
      !== input.primitiveProposals.length) {
    throw new Error('Caption motion plan requires exactly one unique primitive per node.')
  }
  const primitives = input.primitiveProposals.map((proposal) => {
    const resolved = resolution.nodeResolutions.find((item) => item.nodeId === proposal.nodeId)
    if (!resolved || proposal.unstableEntryFrames < 0 || proposal.unstableExitFrames < 0
      || proposal.additionalUnreadableRanges.some((range) =>
        !containsRange(resolved?.cueRange ?? { startFrame: 0, endFrameExclusive: 1 }, range))) {
      throw new Error(`Caption motion primitive ${proposal.primitiveId} is invalid.`)
    }
    return primitiveSchema.parse({
      primitiveId: proposal.primitiveId,
      nodeId: proposal.nodeId,
      primitive: proposal.primitive,
      frameRange: resolved.cueRange,
      stableReadImpactFrames: Math.min(
        resolved.cueRange.endFrameExclusive - resolved.cueRange.startFrame,
        proposal.unstableEntryFrames + proposal.unstableExitFrames
          + unionFrameLength(proposal.additionalUnreadableRanges),
      ),
      easing: proposal.easing,
      travelBasisPoints: proposal.travelBasisPoints,
      startScaleBasisPoints: proposal.startScaleBasisPoints,
      endScaleBasisPoints: proposal.endScaleBasisPoints,
      startOpacityBasisPoints: proposal.startOpacityBasisPoints,
      endOpacityBasisPoints: proposal.endOpacityBasisPoints,
      overshootBasisPoints: proposal.overshootBasisPoints,
      staggerFrames: proposal.staggerFrames,
      interruptionPolicy: proposal.interruptionPolicy,
      semanticReasonCode: proposal.semanticReasonCode,
      reducedMotionReplacement: {
        primitive: proposal.reducedMotionPrimitive,
        frameRange: resolved.cueRange,
        preservesMeaning: true,
        preservesOrder: true,
        preservesStableReadRequirement: true,
      },
    })
  })
  const effectiveReadReport = createCaptionEffectiveReadReport({
    reportId: `${input.planId}.effective-read`,
    resolution,
    registration,
    sceneGraph: graph,
    primitiveImpacts: input.primitiveProposals.map((proposal) => ({
      nodeId: proposal.nodeId,
      unstableEntryFrames: proposal.unstableEntryFrames,
      unstableExitFrames: proposal.unstableExitFrames,
      additionalUnreadableRanges: proposal.additionalUnreadableRanges,
    })),
  })
  const handoffs = input.handoffBundles.map((bundle) =>
    parseCaptionCrossSystemHandoff(bundle.handoff, resolution, bundle.supportRequest))
  const supportRequests = input.handoffBundles.map((bundle) =>
    parseSkillSupportRequest(bundle.supportRequest))
  const cameraRequests = input.cameraRequests.map((request) =>
    parseCaptionCameraRequest(request, graph, resolution))
  const physicalPrimitiveIds = primitives
    .filter((primitive) => !['stable_hold', 'cut'].includes(primitive.primitive))
    .map((primitive) => primitive.primitive)
  const excessiveRepetition = physicalPrimitiveIds.some((primitive, index) =>
    index >= 4 && physicalPrimitiveIds.slice(index - 4, index + 1)
      .every((candidate) => candidate === primitive))
  const missingTransferMorph = handoffs.some((handoff) =>
    handoff.informationOwnershipTransferRequested
    && !graph.nodes.some((node) => handoff.sourcePhraseIds.includes(node.phraseId)
      && primitives.some((primitive) => primitive.nodeId === node.nodeId
        && primitive.primitive === 'handoff_morph')))
  if (excessiveRepetition || missingTransferMorph) {
    throw new Error('Caption motion plan violates repetition or handoff continuity policy.')
  }
  const base: Omit<CaptionMotionPlan, 'planDigestSha256'> = {
    schemaVersion: CAPTION_MOTION_PLAN_VERSION,
    planId: safeKey.parse(input.planId),
    canonicalScope: structuredClone(graph.canonicalScope),
    sceneGraphRef: graphRef(graph),
    storyTimingRegistrationRef: registrationRef(registration),
    storyTimingResolutionRef: resolutionRef(resolution),
    confirmedOutputFrameRef: structuredClone(graph.confirmedOutputFrameRef),
    primitives,
    effectiveReadReportRef: readReportRef(effectiveReadReport),
    handoffs,
    cameraRequests,
    supportRequests,
    reducedMotionComplete: primitives.every((primitive) =>
      primitive.reducedMotionReplacement.preservesMeaning
      && primitive.reducedMotionReplacement.preservesOrder
      && primitive.reducedMotionReplacement.preservesStableReadRequirement),
    repetitionLimitApplied: true,
    sharedAttentionBudgetApplied: true,
    modelAuthoredCodeIncluded: false,
    storyTimingSoleFrameAuthority: true,
    remotionRemainsFinalCanvas: true,
    runtimeExecutionGranted: false,
    finalQaApprovalGranted: false,
    productionAuthorityGranted: false,
  }
  return {
    effectiveReadReport,
    plan: parseCaptionMotionPlan({
      ...base,
      planDigestSha256: digestRecord(
        { ...base, planDigestSha256: '' }, 'planDigestSha256'),
    }, { graph, registration, resolution, effectiveReadReport, handoffBundles: input.handoffBundles }),
  }
}

export function parseCaptionMotionPlan(value: unknown, context: {
  graph: CaptionMultiTrackSceneGraph
  registration: CaptionStoryTimingRegistrationRequest
  resolution: CaptionStoryTimingResolutionBinding
  effectiveReadReport: CaptionEffectiveReadReport
  handoffBundles: Array<{ handoff: unknown; supportRequest: unknown }>
}): CaptionMotionPlan {
  assertClosedContractTree(value, 'Caption motion plan')
  const plan = motionPlanSchema.parse(value)
  const parsedSupport = plan.supportRequests.map((request) => parseSkillSupportRequest(request))
  const expectedHandoffs = context.handoffBundles.map((bundle) =>
    parseCaptionCrossSystemHandoff(
      bundle.handoff, context.resolution, bundle.supportRequest,
    ))
  const parsedCameras = plan.cameraRequests.map((request) =>
    parseCaptionCameraRequest(request, context.graph, context.resolution))
  parseCaptionEffectiveReadReport(
    context.effectiveReadReport, context.registration, context.resolution,
  )
  if (!exactScope(plan.canonicalScope, context.graph.canonicalScope)
    || !exactRef(plan.sceneGraphRef, graphRef(context.graph))
    || !exactRef(plan.storyTimingRegistrationRef, registrationRef(context.registration))
    || !exactRef(plan.storyTimingResolutionRef, resolutionRef(context.resolution))
    || !exactRef(plan.effectiveReadReportRef, readReportRef(context.effectiveReadReport))
    || !exactRef(plan.confirmedOutputFrameRef, context.graph.confirmedOutputFrameRef)
    || plan.primitives.length !== context.graph.nodes.length
    || new Set(plan.primitives.map((primitive) => primitive.nodeId)).size
      !== plan.primitives.length
    || plan.primitives.some((primitive) => {
      const resolution = context.resolution.nodeResolutions.find((item) =>
        item.nodeId === primitive.nodeId)
      return !resolution || primitive.frameRange.startFrame !== resolution.cueRange.startFrame
        || primitive.frameRange.endFrameExclusive !== resolution.cueRange.endFrameExclusive
    })
    || plan.reducedMotionComplete !== true
    || parsedSupport.length !== context.handoffBundles.length
    || expectedHandoffs.length !== plan.handoffs.length
    || expectedHandoffs.some((handoff, index) =>
      handoff.handoffId !== plan.handoffs[index]?.handoffId
      || handoff.handoffDigestSha256 !== plan.handoffs[index]?.handoffDigestSha256)
    || parsedSupport.some((support, index) => {
      const expected = parseSkillSupportRequest(
        context.handoffBundles[index]?.supportRequest,
      )
      return support.requestId !== expected.requestId
        || support.requestDigestSha256 !== expected.requestDigestSha256
    })
    || parsedCameras.length !== plan.cameraRequests.length) {
    throw new Error('Caption motion plan lineage or reduced-motion coverage is invalid.')
  }
  verifyDigest(plan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption motion plan')
  return plan
}

export function createCaptionMotionLock(input: {
  lockId: string
  plan: CaptionMotionPlan
  resolution: CaptionStoryTimingResolutionBinding
  effectiveReadReport: CaptionEffectiveReadReport
  rendererSpecRef?: CaptionDomainRef | null
  linkedSoundPlanRefs?: CaptionDomainRef[]
}): CaptionMotionLock {
  assertClosedContractTree(input, 'Caption motion-lock input')
  const runtimeReady = input.resolution.evidenceMode === 'authenticated_private_runtime'
    && input.resolution.exactCanonicalRereadVerified
    && input.resolution.exactMasterTimingDigestVerified
    && input.effectiveReadReport.allEntriesPassed
  const blockerCodes = [
    ...(!input.effectiveReadReport.allEntriesPassed ? ['effective_read_time_failed'] : []),
    ...(!runtimeReady ? ['authenticated_storytiming_reread_required'] : []),
  ]
  const base: Omit<CaptionMotionLock, 'lockDigestSha256'> = {
    schemaVersion: CAPTION_MOTION_LOCK_VERSION,
    lockId: safeKey.parse(input.lockId),
    canonicalScope: structuredClone(input.plan.canonicalScope),
    sceneGraphRef: structuredClone(input.plan.sceneGraphRef),
    motionPlanRef: motionPlanRef(input.plan),
    storyTimingResolutionRef: resolutionRef(input.resolution),
    effectiveReadReportRef: readReportRef(input.effectiveReadReport),
    rendererSpecRef: input.rendererSpecRef ?? null,
    linkedSoundPlanRefs: structuredClone(input.linkedSoundPlanRefs ?? []),
    state: input.effectiveReadReport.allEntriesPassed
      ? runtimeReady ? 'authenticated_private_ready' : 'contract_ready'
      : 'blocked',
    blockerCodes,
    exactStoryTimingRereadRequiredForExecution: true,
    motionChangeInvalidatesLinkedSound: true,
    storyTimingSoleFrameAuthority: true,
    runtimeExecutionGranted: false,
    finalQaApprovalGranted: false,
    productionAuthorityGranted: false,
  }
  const lock = lockSchema.parse({
    ...base,
    lockDigestSha256: digestRecord(
      { ...base, lockDigestSha256: '' }, 'lockDigestSha256'),
  })
  verifyDigest(lock as unknown as Record<string, unknown>,
    'lockDigestSha256', 'Caption motion lock')
  return lock
}
