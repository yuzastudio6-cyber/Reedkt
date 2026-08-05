import { z } from 'zod'
import {
  CAPTION_SOUND_ADMISSION_VERSION,
  CAPTION_SOUND_CUE_REQUEST_VERSION,
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  type CaptionSoundAdmission,
  type CaptionSoundCueIntent,
  type CaptionSoundCueRequest,
  type CaptionSoundSupportBundle,
  type CaptionSoundSupportResult,
} from '../../src/types/caption-sound-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type { CaptionMultiTrackSceneGraph } from '../../src/types/caption-multi-track-scene-graph'
import type {
  CaptionMotionLock,
  CaptionMotionPlan,
  CaptionStoryTimingResolutionBinding,
} from '../../src/types/caption-storytiming-motion'
import {
  SKILL_SUPPORT_REQUEST_VERSION,
  type SkillContractRef,
  type SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import { parseCaptionMultiTrackSceneGraph } from './caption-multi-track-scene-graph'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from './caption-authority-boundary'

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

const cueIntentSchema: z.ZodType<CaptionSoundCueIntent> = z.object({
  cueIntentId: safeKey,
  nodeId: safeKey,
  trackId: safeKey,
  phraseId: safeKey,
  motionPrimitiveId: safeKey,
  motionPrimitive: z.enum([
    'reveal', 'fade', 'scale', 'slide', 'wipe', 'tracked_move',
    'depth_transition', 'emphasis_pulse', 'brush_reveal', 'list_append',
    'hero_expansion', 'handoff_morph', 'stable_hold', 'cut',
  ]),
  eligibility: z.enum(['sound_required', 'sound_optional', 'sound_forbidden']),
  decision: z.enum(['request_cue', 'remain_silent']),
  targetLayer: z.enum(['caption_emphasis', 'title_card', 'graphic_handoff']),
  semanticReasonCode: safeKey,
  storyTimingEventRef: refSchema,
  requestedCueRelationship: z.enum([
    'hit_on_semantic_event', 'lead_into_semantic_event', 'tail_after_semantic_event',
  ]),
  requestedTextureCode: safeKey.nullable(),
  intensity: z.enum(['whisper', 'subtle_polish', 'premium_soft']),
  narrationProtection: z.literal('strict_voice_first'),
  musicRelationship: z.enum(['duck_under_voice', 'do_not_compete', 'silence']),
  lowerCostOrSilentFallback: z.literal('silent'),
  providerOrAssetSelectedByCaption: z.literal(false),
  finalFramesManufacturedByCaption: z.literal(false),
}).strict()

const requestSchema: z.ZodType<CaptionSoundCueRequest> = z.object({
  schemaVersion: z.literal(CAPTION_SOUND_CUE_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  idempotencyKey: safeKey,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  motionPlanRef: refSchema,
  motionLockRef: refSchema,
  storyTimingResolutionRef: refSchema,
  masterTimingRef: refSchema,
  approvedCaptionEnvelopeRef: refSchema,
  soundSupportBoundary: z.object({
    targetSkillKey: z.literal('soundsync'),
    neutralSupportRequestVersion: z.literal(SKILL_SUPPORT_REQUEST_VERSION),
    expectedResultVersion: z.literal(CAPTION_SOUND_SUPPORT_RESULT_VERSION),
    captionMayOnlyRequestSemanticCueIntent: z.literal(true),
    soundSyncOwnsCueSelectionGenerationAndMix: z.literal(true),
  }).strict(),
  cueIntents: z.array(cueIntentSchema).min(1).max(4_096),
  densityBudget: z.object({
    windowRange: frameRangeSchema,
    maximumRequestedCueCount: z.number().int().nonnegative().max(64),
    requestedCueCount: z.number().int().nonnegative().max(64),
    forbiddenPerWordCuePattern: z.literal(true),
    simultaneousCueCountLimit: z.literal(1),
  }).strict(),
  dialogueProtection: z.object({
    dialogueTrackRef: refSchema,
    dialogueActivityRef: refSchema,
    finalMixDependencyRequired: z.literal(true),
    dialogueProtectedFinalMixQaRequired: z.literal(true),
    voiceClarityOutranksCueImpact: z.literal(true),
  }).strict(),
  silentFallback: z.object({
    alwaysAllowed: z.literal(true),
    selectedWhenSupportUnavailable: z.literal(true),
    preservesCaptionMeaning: z.literal(true),
    preservesMotionTiming: z.literal(true),
    createsNoSoundAsset: z.literal(true),
  }).strict(),
  estimateInputs: z.object({
    requestedCueCount: z.number().int().nonnegative().max(64),
    premiumSoundExpected: z.literal(false),
    lowerCostSilentAlternativeAvailable: z.literal(true),
    priceOrBillingAuthorityClaimed: z.literal(false),
  }).strict(),
  byteFreeRequest: z.literal(true),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  providerPromptIncluded: z.literal(false),
  providerCredentialIncluded: z.literal(false),
  soundAssetSelectionPerformedByCaption: z.literal(false),
  soundGenerationRequestedDirectlyByCaption: z.literal(false),
  mixOrLoudnessAuthorityClaimed: z.literal(false),
  directPeerDispatchRequested: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  costAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const resultSchema: z.ZodType<CaptionSoundSupportResult> = z.object({
  schemaVersion: z.literal(CAPTION_SOUND_SUPPORT_RESULT_VERSION),
  resultId: safeKey,
  resultDigestSha256: sha256,
  supportRequestRef: refSchema,
  captionSoundRequestRef: refSchema,
  canonicalScope: scopeSchema,
  sceneGraphRef: refSchema,
  motionLockRef: refSchema,
  storyTimingResolutionRef: refSchema,
  masterTimingRef: refSchema,
  producerSkillKey: z.literal('soundsync'),
  cueResults: z.array(z.object({
    cueIntentId: safeKey,
    disposition: z.enum(['admitted', 'declined', 'silent']),
    reasonCode: safeKey,
    storyTimingEventRef: refSchema,
    soundSyncCueRef: refSchema.nullable(),
    selectedSoundAssetRef: refSchema.nullable(),
    trimAndAlignmentRef: refSchema.nullable(),
    mixPlanRef: refSchema.nullable(),
    dialogueProtectionRef: refSchema.nullable(),
  }).strict()).min(1).max(4_096),
  dialogueProtectedFinalMix: z.object({
    dependencyRef: refSchema,
    finalMixRef: refSchema.nullable(),
    dialogueProtectionQaRef: refSchema.nullable(),
    finalMixRereadVerified: z.boolean(),
    voiceClarityPassed: z.boolean(),
    noCueMasksDialogue: z.boolean(),
  }).strict(),
  evidenceMode: z.enum(['approved_contract_fixture', 'authenticated_private_runtime']),
  exactCanonicalScopeReread: z.boolean(),
  exactMotionAndTimingLineageVerified: z.boolean(),
  actualSoundRuntimeObserved: z.boolean(),
  actualAudioAssetReread: z.boolean(),
  actualDialogueProtectedFinalMixQaCompleted: z.boolean(),
  browserLocalStateUsed: z.literal(false),
  rawAudioBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  providerPayloadIncluded: z.literal(false),
  runtimeAuthorityGrantedToCaption: z.literal(false),
  assetAuthorityGrantedToCaption: z.literal(false),
  mixAuthorityGrantedToCaption: z.literal(false),
  costOrBillingAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const admissionSchema: z.ZodType<CaptionSoundAdmission> = z.object({
  schemaVersion: z.literal(CAPTION_SOUND_ADMISSION_VERSION),
  admissionId: safeKey,
  admissionDigestSha256: sha256,
  canonicalScope: scopeSchema,
  captionSoundRequestRef: refSchema,
  supportRequestRef: refSchema,
  supportResultRef: refSchema.nullable(),
  cueAdmissions: z.array(z.object({
    cueIntentId: safeKey,
    selectedDisposition: z.enum([
      'contract_fixture_only', 'authenticated_private_ready', 'silent_fallback',
    ]),
    soundSyncCueRef: refSchema.nullable(),
    selectedSoundAssetRef: refSchema.nullable(),
    blockerCodes: z.array(safeKey).max(32),
  }).strict()).min(1).max(4_096),
  disposition: z.enum([
    'contract_ready_silent_fallback', 'authenticated_private_ready',
    'silent_fallback_selected', 'blocked_dialogue_protection',
  ]),
  dialogueProtectedFinalMixRequired: z.literal(true),
  dialogueProtectedFinalMixVerified: z.boolean(),
  everyForbiddenCueStayedSilent: z.literal(true),
  requestedCueCountWithinDensityBudget: z.literal(true),
  silentFallbackAvailable: z.literal(true),
  soundSyncRemainsAudioOwner: z.literal(true),
  storyTimingRemainsFrameOwner: z.literal(true),
  captionSelectedProvider: z.literal(false),
  captionCreatedSoundAsset: z.literal(false),
  captionMixedAudio: z.literal(false),
  captionGrantedFinalQa: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export interface CaptionSoundContext {
  sceneGraph: CaptionMultiTrackSceneGraph
  motionPlan: CaptionMotionPlan
  motionLock: CaptionMotionLock
  storyTimingResolution: CaptionStoryTimingResolutionBinding
  approvedCaptionEnvelopeRef: CaptionDomainRef
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function graphRef(value: CaptionMultiTrackSceneGraph): CaptionDomainRef {
  return ref(value.graphId, value.schemaVersion, value.graphDigestSha256)
}

function motionPlanRef(value: CaptionMotionPlan): CaptionDomainRef {
  return ref(value.planId, value.schemaVersion, value.planDigestSha256)
}

function motionLockRef(value: CaptionMotionLock): CaptionDomainRef {
  return ref(value.lockId, value.schemaVersion, value.lockDigestSha256)
}

function resolutionRef(value: CaptionStoryTimingResolutionBinding): CaptionDomainRef {
  return ref(value.resolutionId, value.schemaVersion, value.resolutionDigestSha256)
}

function requestRef(value: CaptionSoundCueRequest): CaptionDomainRef {
  return ref(value.requestId, value.schemaVersion, value.requestDigestSha256)
}

function resultRef(value: CaptionSoundSupportResult): CaptionDomainRef {
  return ref(value.resultId, value.schemaVersion, value.resultDigestSha256)
}

function supportRef(value: SkillSupportRequest): SkillContractRef {
  return ref(value.requestId, value.schemaVersion, value.requestDigestSha256)
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}\u0000${value.version}\u0000${value.contentHash}`
}

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function exactNullableRef(
  left: CaptionDomainRef | null,
  right: CaptionDomainRef | null,
): boolean {
  return left === null || right === null ? left === right : exactRef(left, right)
}

function exactScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return calculateSkillContractDigest({ value: left, digest: '' }, 'digest')
    === calculateSkillContractDigest({ value: right, digest: '' }, 'digest')
}

function containsRange(outer: CaptionDomainFrameRange, inner: CaptionDomainFrameRange): boolean {
  return inner.startFrame >= outer.startFrame
    && inner.endFrameExclusive <= outer.endFrameExclusive
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (calculateSkillContractDigest(value, field) !== value[field]) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function eligibilityForNode(
  value: CaptionMultiTrackSceneGraph['nodes'][number]['soundEligibility'],
): CaptionSoundCueIntent['eligibility'] {
  if (value === 'required') return 'sound_required'
  if (value === 'optional') return 'sound_optional'
  return 'sound_forbidden'
}

function targetLayerFor(
  node: CaptionMultiTrackSceneGraph['nodes'][number],
  primitive: CaptionMotionPlan['primitives'][number],
): CaptionSoundCueIntent['targetLayer'] {
  if (primitive.primitive === 'handoff_morph') return 'graphic_handoff'
  if (node.compositionRole === 'full_screen_hero') return 'title_card'
  return 'caption_emphasis'
}

function validateContext(context: CaptionSoundContext): CaptionMultiTrackSceneGraph {
  assertClosedContractTree(context, 'Caption sound context')
  const graph = parseCaptionMultiTrackSceneGraph(context.sceneGraph)
  verifyDigest(context.motionPlan as unknown as Record<string, unknown>,
    'planDigestSha256', 'Caption motion plan')
  verifyDigest(context.motionLock as unknown as Record<string, unknown>,
    'lockDigestSha256', 'Caption motion lock')
  verifyDigest(context.storyTimingResolution as unknown as Record<string, unknown>,
    'resolutionDigestSha256', 'Caption StoryTiming resolution')
  if (!exactScope(graph.canonicalScope, context.motionPlan.canonicalScope)
    || !exactScope(graph.canonicalScope, context.motionLock.canonicalScope)
    || !exactScope(graph.canonicalScope, context.storyTimingResolution.canonicalScope)
    || !exactRef(context.motionPlan.sceneGraphRef, graphRef(graph))
    || !exactRef(context.motionLock.sceneGraphRef, graphRef(graph))
    || !exactRef(context.motionLock.motionPlanRef, motionPlanRef(context.motionPlan))
    || !exactRef(context.motionLock.storyTimingResolutionRef,
      resolutionRef(context.storyTimingResolution))
    || !exactRef(context.approvedCaptionEnvelopeRef, graph.approvalEnvelopeRef)) {
    throw new Error('Caption sound context is stale or cross-scoped.')
  }
  return graph
}

export function parseCaptionSoundCueRequest(
  value: unknown,
  context: CaptionSoundContext,
): CaptionSoundCueRequest {
  assertClosedContractTree(value, 'Caption sound cue request')
  const graph = validateContext(context)
  const request = requestSchema.parse(value)
  const requestedCount = request.cueIntents.filter((intent) =>
    intent.decision === 'request_cue').length
  const seenNodes = new Set<string>()
  if (!exactScope(request.canonicalScope, graph.canonicalScope)
    || !exactRef(request.sceneGraphRef, graphRef(graph))
    || !exactRef(request.motionPlanRef, motionPlanRef(context.motionPlan))
    || !exactRef(request.motionLockRef, motionLockRef(context.motionLock))
    || !exactRef(request.storyTimingResolutionRef,
      resolutionRef(context.storyTimingResolution))
    || !exactRef(request.masterTimingRef, context.storyTimingResolution.masterTimingRef)
    || !exactRef(request.approvedCaptionEnvelopeRef, context.approvedCaptionEnvelopeRef)
    || request.cueIntents.length !== graph.nodes.length
    || request.densityBudget.requestedCueCount !== requestedCount
    || request.estimateInputs.requestedCueCount !== requestedCount
    || requestedCount > request.densityBudget.maximumRequestedCueCount
    || request.densityBudget.maximumRequestedCueCount > 4
    || !request.canonicalScope.authorizedFrameRanges.some((range) =>
      containsRange(range, request.densityBudget.windowRange))
    || context.motionPlan.primitives.some((primitive) =>
      !containsRange(request.densityBudget.windowRange, primitive.frameRange))) {
    throw new Error('Caption sound request scope, density, or source lineage is invalid.')
  }
  for (const intent of request.cueIntents) {
    const node = graph.nodes.find((candidate) => candidate.nodeId === intent.nodeId)
    const primitive = context.motionPlan.primitives.find((candidate) =>
      candidate.primitiveId === intent.motionPrimitiveId)
    const resolution = context.storyTimingResolution.nodeResolutions.find((candidate) =>
      candidate.nodeId === intent.nodeId)
    const expectedEligibility = node ? eligibilityForNode(node.soundEligibility) : null
    const expectedDecision = expectedEligibility === 'sound_forbidden'
      ? 'remain_silent' : 'request_cue'
    if (!node || !primitive || !resolution || seenNodes.has(intent.nodeId)
      || node.trackId !== intent.trackId || node.phraseId !== intent.phraseId
      || primitive.nodeId !== node.nodeId || primitive.primitive !== intent.motionPrimitive
      || intent.eligibility !== expectedEligibility || intent.decision !== expectedDecision
      || intent.targetLayer !== targetLayerFor(node, primitive)
      || !resolution.semanticEventRefs.some((event) =>
        exactRef(event.eventRef, intent.storyTimingEventRef))
      || (intent.decision === 'remain_silent') !== (intent.requestedTextureCode === null)
      || intent.decision === 'remain_silent'
        && (intent.musicRelationship !== 'silence' || intent.intensity !== 'whisper')) {
      throw new Error(`Caption sound intent ${intent.cueIntentId} violates eligibility or timing.`)
    }
    seenNodes.add(intent.nodeId)
  }
  verifyDigest(request as unknown as Record<string, unknown>,
    'requestDigestSha256', 'Caption sound cue request')
  return request
}

function soundWindow(plan: CaptionMotionPlan): CaptionDomainFrameRange {
  return {
    startFrame: Math.min(...plan.primitives.map((primitive) => primitive.frameRange.startFrame)),
    endFrameExclusive: Math.max(
      ...plan.primitives.map((primitive) => primitive.frameRange.endFrameExclusive),
    ),
  }
}

export function createCaptionSoundSupportBundle(input: {
  requestId: string
  idempotencyKey: string
  originalCallRef: SkillContractRef
  context: CaptionSoundContext
  dialogueTrackRef: CaptionDomainRef
  dialogueActivityRef: CaptionDomainRef
  maximumRequestedCueCount?: number
}): CaptionSoundSupportBundle {
  assertClosedContractTree(input, 'Caption sound support build input')
  const graph = validateContext(input.context)
  const cueIntents: CaptionSoundCueIntent[] = graph.nodes.map((node) => {
    const primitive = input.context.motionPlan.primitives.find((candidate) =>
      candidate.nodeId === node.nodeId)
    const timing = input.context.storyTimingResolution.nodeResolutions.find((candidate) =>
      candidate.nodeId === node.nodeId)
    if (!primitive || !timing) {
      throw new Error(`Caption node ${node.nodeId} lacks exact motion or StoryTiming.`)
    }
    const eligibility = eligibilityForNode(node.soundEligibility)
    const decision = eligibility === 'sound_forbidden' ? 'remain_silent' : 'request_cue'
    const preferredIntent = node.semanticRole === 'hero_concept' ? 'hero_hit' : 'motion_entry_end'
    const event = timing.semanticEventRefs.find((candidate) =>
      candidate.eventIntent === preferredIntent) ?? timing.semanticEventRefs[0]
    const targetLayer = targetLayerFor(node, primitive)
    return {
      cueIntentId: `${input.requestId}.${node.nodeId}`,
      nodeId: node.nodeId,
      trackId: node.trackId,
      phraseId: node.phraseId,
      motionPrimitiveId: primitive.primitiveId,
      motionPrimitive: primitive.primitive,
      eligibility,
      decision,
      targetLayer,
      semanticReasonCode: decision === 'remain_silent'
        ? 'caption_sound_restraint_required' : 'semantic_caption_polish_requested',
      storyTimingEventRef: structuredClone(event.eventRef),
      requestedCueRelationship: 'hit_on_semantic_event',
      requestedTextureCode: decision === 'remain_silent' ? null
        : targetLayer === 'title_card' ? 'restrained_soft_bloom'
          : targetLayer === 'graphic_handoff' ? 'restrained_soft_whoosh'
            : 'restrained_soft_tick',
      intensity: decision === 'remain_silent' ? 'whisper' : 'subtle_polish',
      narrationProtection: 'strict_voice_first',
      musicRelationship: decision === 'remain_silent' ? 'silence' : 'do_not_compete',
      lowerCostOrSilentFallback: 'silent',
      providerOrAssetSelectedByCaption: false,
      finalFramesManufacturedByCaption: false,
    }
  })
  const requestedCueCount = cueIntents.filter((intent) => intent.decision === 'request_cue').length
  const base: Omit<CaptionSoundCueRequest, 'requestDigestSha256'> = {
    schemaVersion: CAPTION_SOUND_CUE_REQUEST_VERSION,
    requestId: safeKey.parse(input.requestId),
    idempotencyKey: safeKey.parse(input.idempotencyKey),
    canonicalScope: structuredClone(graph.canonicalScope),
    sceneGraphRef: graphRef(graph),
    motionPlanRef: motionPlanRef(input.context.motionPlan),
    motionLockRef: motionLockRef(input.context.motionLock),
    storyTimingResolutionRef: resolutionRef(input.context.storyTimingResolution),
    masterTimingRef: structuredClone(input.context.storyTimingResolution.masterTimingRef),
    approvedCaptionEnvelopeRef: structuredClone(input.context.approvedCaptionEnvelopeRef),
    soundSupportBoundary: {
      targetSkillKey: 'soundsync',
      neutralSupportRequestVersion: SKILL_SUPPORT_REQUEST_VERSION,
      expectedResultVersion: CAPTION_SOUND_SUPPORT_RESULT_VERSION,
      captionMayOnlyRequestSemanticCueIntent: true,
      soundSyncOwnsCueSelectionGenerationAndMix: true,
    },
    cueIntents,
    densityBudget: {
      windowRange: soundWindow(input.context.motionPlan),
      maximumRequestedCueCount:
        input.maximumRequestedCueCount ?? requestedCueCount,
      requestedCueCount,
      forbiddenPerWordCuePattern: true,
      simultaneousCueCountLimit: 1,
    },
    dialogueProtection: {
      dialogueTrackRef: refSchema.parse(input.dialogueTrackRef),
      dialogueActivityRef: refSchema.parse(input.dialogueActivityRef),
      finalMixDependencyRequired: true,
      dialogueProtectedFinalMixQaRequired: true,
      voiceClarityOutranksCueImpact: true,
    },
    silentFallback: {
      alwaysAllowed: true,
      selectedWhenSupportUnavailable: true,
      preservesCaptionMeaning: true,
      preservesMotionTiming: true,
      createsNoSoundAsset: true,
    },
    estimateInputs: {
      requestedCueCount,
      premiumSoundExpected: false,
      lowerCostSilentAlternativeAvailable: true,
      priceOrBillingAuthorityClaimed: false,
    },
    byteFreeRequest: true,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    providerPromptIncluded: false,
    providerCredentialIncluded: false,
    soundAssetSelectionPerformedByCaption: false,
    soundGenerationRequestedDirectlyByCaption: false,
    mixOrLoudnessAuthorityClaimed: false,
    directPeerDispatchRequested: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    costAuthorityGranted: false,
    billingAuthorityGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const payload = parseCaptionSoundCueRequest({
    ...base,
    requestDigestSha256: calculateSkillContractDigest(
      { ...base, requestDigestSha256: '' }, 'requestDigestSha256'),
  }, input.context)
  const skillScope = {
    ownerUserId: graph.canonicalScope.ownerUserId,
    workspaceId: graph.canonicalScope.workspaceId,
    projectId: graph.canonicalScope.projectId,
    editSessionId: graph.canonicalScope.editSessionId,
    approvedSnapshotRef: graph.canonicalScope.approvedSnapshotRef,
    outputId: graph.canonicalScope.outputId,
    sceneId: graph.canonicalScope.sceneId,
    boundaryId: `${payload.requestId}.sound-boundary`,
    authorizedFrameRanges: graph.canonicalScope.authorizedFrameRanges,
  }
  const supportBase: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: `${payload.requestId}.support`,
    originalCallRef: refSchema.parse(input.originalCallRef),
    requestingSkillKey: 'captions',
    targetSkillKey: 'soundsync',
    reasonCode: 'caption_semantic_sound_support_requested',
    requestedArtifactTypes: [CAPTION_SOUND_SUPPORT_RESULT_VERSION],
    canonicalScope: skillScope,
    typedPayloadType: payload.schemaVersion,
    typedPayload: payload,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  const supportRequest = parseSkillSupportRequest({
    ...supportBase,
    requestDigestSha256: calculateSkillContractDigest(
      { ...supportBase, requestDigestSha256: '' }, 'requestDigestSha256'),
  })
  return { payload, supportRequest }
}

export function parseCaptionSoundSupportResult(
  value: unknown,
  bundle: CaptionSoundSupportBundle,
  context: CaptionSoundContext,
): CaptionSoundSupportResult {
  assertClosedContractTree(value, 'Caption sound support result')
  const request = parseCaptionSoundCueRequest(bundle.payload, context)
  const support = parseSkillSupportRequest(bundle.supportRequest)
  const result = resultSchema.parse(value)
  if (support.targetSkillKey !== 'soundsync'
    || support.typedPayloadType !== request.schemaVersion
    || !exactRef(supportRef(support), result.supportRequestRef)
    || !exactRef(result.captionSoundRequestRef, requestRef(request))
    || !exactScope(result.canonicalScope, request.canonicalScope)
    || !exactRef(result.sceneGraphRef, request.sceneGraphRef)
    || !exactRef(result.motionLockRef, request.motionLockRef)
    || !exactRef(result.storyTimingResolutionRef, request.storyTimingResolutionRef)
    || !exactRef(result.masterTimingRef, request.masterTimingRef)
    || result.cueResults.length !== request.cueIntents.length
    || new Set(result.cueResults.map((item) => item.cueIntentId)).size
      !== result.cueResults.length) {
    throw new Error('Caption sound support result is stale or does not bind the exact request.')
  }
  for (const [index, cueResult] of result.cueResults.entries()) {
    const intent = request.cueIntents[index]
    const mustRemainSilent = intent.eligibility === 'sound_forbidden'
      || intent.decision === 'remain_silent'
    const allExecutionRefs = [
      cueResult.selectedSoundAssetRef,
      cueResult.trimAndAlignmentRef,
      cueResult.mixPlanRef,
      cueResult.dialogueProtectionRef,
    ]
    if (cueResult.cueIntentId !== intent.cueIntentId
      || !exactRef(cueResult.storyTimingEventRef, intent.storyTimingEventRef)
      || (mustRemainSilent && (cueResult.disposition !== 'silent'
        || cueResult.soundSyncCueRef !== null
        || allExecutionRefs.some((item) => item !== null)))
      || (cueResult.disposition === 'admitted'
        && (intent.decision !== 'request_cue' || cueResult.soundSyncCueRef === null))
      || (cueResult.disposition !== 'admitted'
        && (cueResult.soundSyncCueRef !== null
          || allExecutionRefs.some((item) => item !== null)))) {
      throw new Error(`SoundSync cue result ${cueResult.cueIntentId} violates Caption restraint.`)
    }
  }
  const mix = result.dialogueProtectedFinalMix
  if (result.evidenceMode === 'approved_contract_fixture') {
    if (result.exactCanonicalScopeReread
      || result.exactMotionAndTimingLineageVerified
      || result.actualSoundRuntimeObserved
      || result.actualAudioAssetReread
      || result.actualDialogueProtectedFinalMixQaCompleted
      || mix.finalMixRef !== null
      || mix.dialogueProtectionQaRef !== null
      || mix.finalMixRereadVerified
      || mix.voiceClarityPassed
      || mix.noCueMasksDialogue
      || result.cueResults.some((item) =>
        item.selectedSoundAssetRef !== null
        || item.trimAndAlignmentRef !== null
        || item.mixPlanRef !== null
        || item.dialogueProtectionRef !== null)) {
      throw new Error('Contract-only Sound fixture cannot claim runtime, assets, mix, or audio QA.')
    }
  } else if (!result.exactCanonicalScopeReread
    || !result.exactMotionAndTimingLineageVerified
    || !result.actualSoundRuntimeObserved
    || !result.actualAudioAssetReread
    || !result.actualDialogueProtectedFinalMixQaCompleted
    || mix.finalMixRef === null
    || mix.dialogueProtectionQaRef === null
    || !mix.finalMixRereadVerified
    || result.cueResults.some((item) => item.disposition === 'admitted'
      && (item.selectedSoundAssetRef === null
        || item.trimAndAlignmentRef === null
        || item.mixPlanRef === null
        || item.dialogueProtectionRef === null))) {
    throw new Error('Authenticated Sound result lacks exact runtime, asset, mix, or QA evidence.')
  }
  verifyDigest(result as unknown as Record<string, unknown>,
    'resultDigestSha256', 'Caption sound support result')
  return result
}

function derivedAdmission(input: {
  request: CaptionSoundCueRequest
  result: CaptionSoundSupportResult | null
}) {
  const authenticated = input.result?.evidenceMode === 'authenticated_private_runtime'
  const mixVerified = Boolean(authenticated
    && input.result?.dialogueProtectedFinalMix.finalMixRereadVerified
    && input.result.dialogueProtectedFinalMix.voiceClarityPassed
    && input.result.dialogueProtectedFinalMix.noCueMasksDialogue)
  const cueAdmissions = input.request.cueIntents.map((intent, index) => {
    const result = input.result?.cueResults[index] ?? null
    if (!result || result.disposition !== 'admitted') {
      return {
        cueIntentId: intent.cueIntentId,
        selectedDisposition: 'silent_fallback' as const,
        soundSyncCueRef: null,
        selectedSoundAssetRef: null,
        blockerCodes: result?.disposition === 'declined'
          ? ['soundsync_declined_cue'] : [],
      }
    }
    if (authenticated && mixVerified) {
      return {
        cueIntentId: intent.cueIntentId,
        selectedDisposition: 'authenticated_private_ready' as const,
        soundSyncCueRef: result.soundSyncCueRef,
        selectedSoundAssetRef: result.selectedSoundAssetRef,
        blockerCodes: [],
      }
    }
    return {
      cueIntentId: intent.cueIntentId,
      selectedDisposition: 'contract_fixture_only' as const,
      soundSyncCueRef: result.soundSyncCueRef,
      selectedSoundAssetRef: null,
      blockerCodes: [
        'authenticated_private_sound_runtime_required',
        'dialogue_protected_final_mix_qa_required',
      ],
    }
  })
  const disposition: CaptionSoundAdmission['disposition'] = input.result === null
    ? 'silent_fallback_selected'
    : input.result.evidenceMode === 'approved_contract_fixture'
      ? 'contract_ready_silent_fallback'
      : mixVerified ? 'authenticated_private_ready' : 'blocked_dialogue_protection'
  return { cueAdmissions, disposition, mixVerified }
}

export function parseCaptionSoundAdmission(
  value: unknown,
  bundle: CaptionSoundSupportBundle,
  context: CaptionSoundContext,
  supportResultValue: unknown | null,
): CaptionSoundAdmission {
  assertClosedContractTree(value, 'Caption sound admission')
  const request = parseCaptionSoundCueRequest(bundle.payload, context)
  const support = parseSkillSupportRequest(bundle.supportRequest)
  const result = supportResultValue === null ? null
    : parseCaptionSoundSupportResult(supportResultValue, bundle, context)
  const admission = admissionSchema.parse(value)
  const expected = derivedAdmission({ request, result })
  if (!exactScope(admission.canonicalScope, request.canonicalScope)
    || !exactRef(admission.captionSoundRequestRef, requestRef(request))
    || !exactRef(admission.supportRequestRef, supportRef(support))
    || !exactNullableRef(admission.supportResultRef, result ? resultRef(result) : null)
    || admission.disposition !== expected.disposition
    || admission.dialogueProtectedFinalMixVerified !== expected.mixVerified
    || admission.cueAdmissions.length !== expected.cueAdmissions.length
    || calculateSkillContractDigest({ value: admission.cueAdmissions, digest: '' }, 'digest')
      !== calculateSkillContractDigest({ value: expected.cueAdmissions, digest: '' }, 'digest')) {
    throw new Error('Caption sound admission is stale or overclaims SoundSync evidence.')
  }
  verifyDigest(admission as unknown as Record<string, unknown>,
    'admissionDigestSha256', 'Caption sound admission')
  return admission
}

export function createCaptionSoundAdmission(input: {
  admissionId: string
  bundle: CaptionSoundSupportBundle
  context: CaptionSoundContext
  supportResult: CaptionSoundSupportResult | null
}): CaptionSoundAdmission {
  assertClosedContractTree(input, 'Caption sound admission input')
  const request = parseCaptionSoundCueRequest(input.bundle.payload, input.context)
  const support = parseSkillSupportRequest(input.bundle.supportRequest)
  const result = input.supportResult === null ? null
    : parseCaptionSoundSupportResult(input.supportResult, input.bundle, input.context)
  const derived = derivedAdmission({ request, result })
  const base: Omit<CaptionSoundAdmission, 'admissionDigestSha256'> = {
    schemaVersion: CAPTION_SOUND_ADMISSION_VERSION,
    admissionId: safeKey.parse(input.admissionId),
    canonicalScope: structuredClone(request.canonicalScope),
    captionSoundRequestRef: requestRef(request),
    supportRequestRef: supportRef(support),
    supportResultRef: result ? resultRef(result) : null,
    cueAdmissions: derived.cueAdmissions,
    disposition: derived.disposition,
    dialogueProtectedFinalMixRequired: true,
    dialogueProtectedFinalMixVerified: derived.mixVerified,
    everyForbiddenCueStayedSilent: true,
    requestedCueCountWithinDensityBudget: true,
    silentFallbackAvailable: true,
    soundSyncRemainsAudioOwner: true,
    storyTimingRemainsFrameOwner: true,
    captionSelectedProvider: false,
    captionCreatedSoundAsset: false,
    captionMixedAudio: false,
    captionGrantedFinalQa: false,
    runtimeExecutionGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionSoundAdmission({
    ...base,
    admissionDigestSha256: calculateSkillContractDigest(
      { ...base, admissionDigestSha256: '' }, 'admissionDigestSha256'),
  }, input.bundle, input.context, result)
}
