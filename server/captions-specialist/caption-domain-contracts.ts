import { z } from 'zod'
import {
  CAPTION_DOMAIN_CONTRACT_SCHEMA_VERSION,
  CAPTION_DOMAIN_CONTRACT_VERSIONS,
  type AnyCaptionDomainContract,
  type CaptionDomainContract,
  type CaptionDomainContractKind,
  type CaptionDomainPayloadMap,
} from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import { CAPTION_DESIGN_COMPOSITE } from './caption-design-composite'

const safeKey = z.string().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const keyList = z.array(safeKey).max(512)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().min(0),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Frame range must have positive duration.' })
  }
})
const integrationClassSchema = z.enum([
  'clean_phrase', 'active_word', 'semantic_kinetic', 'spatial_composite',
  'subject_occluded', 'object_anchored', 'environmental', 'persistent_topic',
  'hero', 'caption_to_visual',
])
const projectModeSchema = z.enum([
  'accessibility_first', 'clean_long_form', 'dynamic_short_form',
  'cinematic_editorial', 'educational_explainer', 'multi_speaker_dialogue',
  'brand_directed', 'minimal_support',
])

const payloadSchemas: Record<CaptionDomainContractKind, z.ZodTypeAny> = {
  strategy_plan: z.object({
    projectMode: projectModeSchema,
    approximateDensity: z.enum(['sparse', 'balanced', 'dense']),
    primaryLanguage: safeKey,
    accessibleProjectionRequired: z.boolean(),
    integrationClasses: z.array(integrationClassSchema).max(10),
    allowedTypographyRoles: keyList,
    likelyHeroMomentCount: z.number().int().min(0).max(64),
    likelyMaskOrTrackingNeeded: z.boolean(),
    likelyCaptionToVisualHandoffNeeded: z.boolean(),
    estimateFactorCodes: keyList,
    reasonCodes: keyList,
  }).strict(),
  opportunity_map: z.object({
    opportunities: z.array(z.object({
      opportunityId: safeKey,
      sceneId: safeKey,
      frameRange: frameRangeSchema,
      semanticPurposeCode: safeKey,
      integrationClass: integrationClassSchema,
      confidenceBasisPoints: z.number().int().min(0).max(10_000),
      likelyNeedsVisualEvidence: z.boolean(),
      likelyNeedsTracking: z.boolean(),
      heroCandidate: z.boolean(),
      handoffCandidate: z.boolean(),
      sourcePhraseIds: keyList,
    }).strict()).max(2048),
  }).strict(),
  integration_classification: z.object({
    sceneClassifications: z.array(z.object({
      sceneId: safeKey,
      integrationClass: integrationClassSchema,
      reasonCodes: keyList,
      deliberateNonUse: z.boolean(),
    }).strict()).max(2048),
  }).strict(),
  reservation_plan: z.object({
    reservations: z.array(z.object({
      reservationId: safeKey,
      sceneId: safeKey,
      frameRange: frameRangeSchema,
      regionBasisPoints: z.object({
        x: z.number().int().min(0).max(10_000),
        y: z.number().int().min(0).max(10_000),
        width: z.number().int().positive().max(10_000),
        height: z.number().int().positive().max(10_000),
      }).strict(),
      priority: z.enum(['caption_primary', 'caption_support', 'caption_fallback']),
      protectedRegionIds: keyList,
      fallbackRegionIds: keyList,
    }).strict().superRefine((reservation, context) => {
      if (reservation.regionBasisPoints.x + reservation.regionBasisPoints.width > 10_000
        || reservation.regionBasisPoints.y + reservation.regionBasisPoints.height > 10_000) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Reservation exceeds confirmed frame.' })
      }
    })).max(2048),
    intentOnly: z.literal(true),
    createsLayoutAuthority: z.literal(false),
  }).strict(),
  approval_envelope: z.object({
    allowedProjectModes: z.array(projectModeSchema).min(1).max(8),
    allowedTypographyRoles: keyList,
    maximumMotionLevel: z.enum(['none', 'restrained', 'moderate', 'expressive']),
    maximumHeroMoments: z.number().int().min(0).max(64),
    subjectOverlapAllowed: z.boolean(),
    objectAnchoringAllowed: z.boolean(),
    captionToVisualAllowed: z.boolean(),
    captionSoundAllowed: z.boolean(),
    allowedTextTransformations: z.array(z.enum([
      'exact', 'punctuation_cleanup', 'filler_omission',
      'condensed_without_meaning_change', 'translated',
      'paraphrase_requires_approval',
    ])).min(1).max(6),
    languages: keyList,
    accessibleOutputKinds: z.array(z.enum(['srt', 'webvtt', 'stable_burn_in'])).max(3),
    maximumCaptionCredits: z.number().int().min(0).max(1_000_000),
    approvedFallbackIds: keyList,
    canonicalApprovalStillRequired: z.literal(true),
  }).strict(),
  style_profile: z.object({
    projectMode: projectModeSchema,
    typographyRoles: z.array(z.object({
      roleId: safeKey,
      purposeCode: safeKey,
      allowedSceneIds: keyList,
      maximumFrequency: z.number().int().min(0).max(10_000),
      fontAssetRef: refSchema,
      weightCodes: keyList,
      colorRoleIds: keyList,
      motionPresetIds: keyList,
      supportedScriptCodes: keyList,
      fallbackRoleId: safeKey.nullable(),
    }).strict()).max(128),
    colorRoles: z.array(z.object({
      colorRoleId: safeKey,
      semanticPurposeCode: safeKey,
      colorTokenRef: refSchema,
      nonColorCounterpartRequired: z.literal(true),
    }).strict()).max(128),
    legibility: z.object({
      minimumContrastRatioMilli: z.number().int().min(1_000).max(21_000),
      strokeAllowed: z.boolean(),
      shadowAllowed: z.boolean(),
      backplateAllowed: z.boolean(),
      localScrimAllowed: z.boolean(),
      backgroundBlurAllowed: z.boolean(),
    }).strict(),
    motionLanguage: z.object({
      allowedPrimitiveIds: keyList,
      repetitionLimit: z.number().int().min(0).max(64),
      reducedMotionReplacementIds: keyList,
      modelAuthoredCodeAllowed: z.literal(false),
    }).strict(),
    placementLanguage: z.object({
      preferredZoneIds: keyList,
      fallbackZoneIds: keyList,
      protectedRoleCodes: keyList,
      allowedDepthPlanes: keyList,
    }).strict(),
  }).strict(),
  lifecycle: z.object({
    state: z.enum([
      'early_planned', 'reserved', 'waiting_picture_lock', 'finish_ready',
      'late_resolved', 'render_ready', 'rendered', 'caption_qa_checked',
      'stale', 'blocked',
    ]),
    affectedSceneIds: keyList,
    transitionReasonCodes: keyList,
    priorLifecycleRef: refSchema.nullable(),
    globalWorkflowOwnerChanged: z.literal(false),
  }).strict(),
  dependency_manifest: z.object({
    dependencies: z.array(z.object({
      dependencyId: safeKey,
      ownerKey: safeKey,
      artifactType: safeKey,
      requiredForJobTypes: keyList,
      status: z.enum(['ready', 'missing', 'stale', 'not_applicable']),
      artifactRef: refSchema.nullable(),
      affectedSceneIds: keyList,
      blockerCode: safeKey.nullable(),
    }).strict().superRefine((dependency, context) => {
      if (dependency.status === 'ready' && dependency.artifactRef === null) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ready dependency requires an artifact ref.' })
      }
      if ((dependency.status === 'missing' || dependency.status === 'stale')
        && dependency.blockerCode === null) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Unavailable dependency requires a blocker code.' })
      }
    })).max(2048),
    unrelatedScenesMayContinue: z.literal(true),
  }).strict(),
  finish_readiness: z.object({
    pictureLockRef: refSchema.nullable(),
    gates: z.array(z.object({
      gateCode: safeKey,
      status: z.enum(['ready', 'blocked', 'not_applicable']),
      evidenceRef: refSchema.nullable(),
      affectedSceneIds: keyList,
    }).strict()).max(512),
    readySceneIds: keyList,
    blockedSceneIds: keyList,
    allFinalCaptionScenesReady: z.boolean(),
    staleFinalSceneRenderAllowed: z.literal(false),
  }).strict().superRefine((readiness, context) => {
    const overlap = readiness.readySceneIds.some((id) => readiness.blockedSceneIds.includes(id))
    if (overlap) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Scene cannot be ready and blocked.' })
    if (readiness.allFinalCaptionScenesReady
      && (readiness.pictureLockRef === null
        || readiness.blockedSceneIds.length > 0
        || readiness.gates.some((gate) => gate.status === 'blocked'))) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Final readiness is overclaimed.' })
    }
  }),
  scene_graph: z.object({
    nodes: z.array(z.object({
      nodeId: safeKey,
      sceneId: safeKey,
      trackRole: z.enum([
        'verbatim_speech', 'semantic_phrase', 'active_word', 'hero_typography',
        'persistent_topic', 'quote', 'speaker_attribution', 'caption_to_visual',
        'accessible_sidecar',
      ]),
      phraseLineageRefs: z.array(refSchema).min(1).max(256),
      typographyRoleId: safeKey,
      timingRequirementRef: refSchema,
      depthPlane: safeKey,
      maskOrTrackRef: refSchema.nullable(),
      objectAnchorRef: refSchema.nullable(),
      motionIntentRef: refSchema.nullable(),
      accessibilityCounterpartNodeId: safeKey.nullable(),
      fallbackId: safeKey,
    }).strict()).max(4096),
    edges: z.array(z.object({
      edgeId: safeKey,
      fromNodeId: safeKey,
      toNodeId: safeKey,
      edgeKind: z.enum(['sequence', 'synchronizes_with', 'accessibility_counterpart']),
    }).strict()).max(8192),
    remotionRemainsFinalCanvas: z.literal(true),
  }).strict().superRefine((graph, context) => {
    const ids = new Set(graph.nodes.map((node) => node.nodeId))
    if (ids.size !== graph.nodes.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Scene graph node IDs must be unique.' })
    }
    for (const edge of graph.edges) {
      if (!ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Scene graph edge ${edge.edgeId} is dangling.` })
      }
    }
    for (const node of graph.nodes) {
      if (node.accessibilityCounterpartNodeId !== null
        && !ids.has(node.accessibilityCounterpartNodeId)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Node ${node.nodeId} has a missing accessibility counterpart.` })
      }
    }
  }),
  motion_lock: z.object({
    motions: z.array(z.object({
      nodeId: safeKey,
      motionPrimitiveId: safeKey,
      semanticTimingRequestRef: refSchema,
      resolvedStoryTimingRef: refSchema.nullable(),
      reducedMotionPrimitiveId: safeKey,
    }).strict()).max(4096),
    storyTimingSoleFrameAuthority: z.literal(true),
    captionAuthoredExecutableFrames: z.literal(false),
    modelAuthoredCodeAllowed: z.literal(false),
  }).strict(),
  render_spec: z.object({
    renderer: z.enum(['remotion', 'libass', 'srt', 'webvtt']),
    confirmedFrameRef: refSchema,
    sceneGraphRef: refSchema,
    motionLockRef: refSchema.nullable(),
    fontAssetRefs: z.array(refSchema).max(128),
    layerOrderRule: z.literal('caption_above_living_frame'),
    executableCodeIncluded: z.literal(false),
    arbitraryAssTagsIncluded: z.literal(false),
    arbitraryFfmpegArgumentsIncluded: z.literal(false),
    finalCanvasOwner: z.literal('remotion'),
  }).strict(),
  qa_report: z.object({
    checks: z.array(z.object({
      checkCode: safeKey,
      disposition: z.enum(['passed', 'failed', 'needs_evidence', 'not_applicable']),
      affectedSceneIds: keyList,
      evidenceRefs: z.array(refSchema).max(256),
      proposedRepairCode: safeKey.nullable(),
    }).strict()).max(2048),
    captionQaRecommendation: z.enum([
      'accept_caption_scope', 'repair_caption_scope', 'block_caption_scope',
    ]),
    independentFinalQaStillRequired: z.literal(true),
  }).strict(),
  repair_plan: z.object({
    repairs: z.array(z.object({
      repairId: safeKey,
      issueCode: safeKey,
      affectedSceneIds: keyList,
      affectedNodeIds: keyList,
      repairActionCode: safeKey,
      fallbackId: safeKey.nullable(),
      requiresNewApproval: z.boolean(),
      requiresReinspection: z.boolean(),
    }).strict()).max(2048),
    smallestAffectedScopeOnly: z.literal(true),
    hiddenQualityDowngradeAllowed: z.literal(false),
    unrelatedWorkMayContinue: z.literal(true),
  }).strict(),
}

const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(512),
}).strict().superRefine((scope, context) => {
  let priorEnd = -1
  for (const range of scope.authorizedFrameRanges) {
    if (range.startFrame < priorEnd) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Scope ranges must be ordered and non-overlapping.' })
    }
    priorEnd = range.endFrameExclusive
  }
})

const sourceBindingsSchema = z.object({
  captionCompositeRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  canonicalTranscriptRef: refSchema.nullable(),
  masterTimingRef: refSchema.nullable(),
  storyTimingRef: refSchema.nullable(),
  captionApprovalEnvelopeRef: refSchema.nullable(),
}).strict()

const authoritySchema = z.object({
  canonicalApprovalGranted: z.literal(false),
  snapshotMutationGranted: z.literal(false),
  timelineMutationGranted: z.literal(false),
  workCreationGranted: z.literal(false),
  providerDispatchGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  costAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  finalCanvasAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const envelopeSchema = z.object({
  schemaVersion: z.literal(CAPTION_DOMAIN_CONTRACT_SCHEMA_VERSION),
  contractId: safeKey,
  contractDigestSha256: sha256,
  contractKind: z.enum(Object.keys(CAPTION_DOMAIN_CONTRACT_VERSIONS) as [
    CaptionDomainContractKind,
    ...CaptionDomainContractKind[],
  ]),
  contractVersion: safeKey,
  canonicalScope: scopeSchema,
  sourceBindings: sourceBindingsSchema,
  stalenessTuple: z.array(refSchema).min(1).max(256),
  payload: z.unknown(),
  privateArtifact: z.literal(true),
  byteFree: z.literal(true),
  authorityBoundary: authoritySchema,
}).strict()

function findUnsafeText(value: unknown): boolean {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|\/(?:Users|Volumes|home|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu.test(current)) return true
    } else if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
  return false
}

function uniqueRefKey(ref: { id: string; version: string; contentHash: string }): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

export function parseCaptionDomainContract(value: unknown): AnyCaptionDomainContract {
  assertClosedContractTree(value, 'Caption domain contract')
  if (findUnsafeText(value)) throw new Error('Caption domain contract contains unsafe text.')
  const envelope = envelopeSchema.parse(value)
  const expectedVersion = CAPTION_DOMAIN_CONTRACT_VERSIONS[envelope.contractKind]
  if (envelope.contractVersion !== expectedVersion) {
    throw new Error('Caption domain contract version does not match its kind.')
  }
  const payload = payloadSchemas[envelope.contractKind].parse(envelope.payload)
  if (new Set(envelope.stalenessTuple.map(uniqueRefKey)).size
    !== envelope.stalenessTuple.length) {
    throw new Error('Caption staleness tuple contains duplicate references.')
  }
  const compositeRef = envelope.sourceBindings.captionCompositeRef
  if (compositeRef.id !== CAPTION_DESIGN_COMPOSITE.compositeId
    || compositeRef.version !== CAPTION_DESIGN_COMPOSITE.compositeVersion
    || compositeRef.contentHash !== CAPTION_DESIGN_COMPOSITE.compositeDigestSha256) {
    throw new Error('Caption domain contract has stale composite lineage.')
  }
  const stalenessKeys = new Set(envelope.stalenessTuple.map(uniqueRefKey))
  for (const sourceRef of Object.values(envelope.sourceBindings)) {
    if (sourceRef !== null && !stalenessKeys.has(uniqueRefKey(sourceRef))) {
      throw new Error('Caption staleness tuple omits a source binding.')
    }
  }
  if (envelope.contractKind === 'render_spec') {
    const renderPayload = payload as CaptionDomainPayloadMap['render_spec']
    if (uniqueRefKey(renderPayload.confirmedFrameRef)
      !== uniqueRefKey(envelope.sourceBindings.confirmedOutputFrameRef)) {
      throw new Error('Caption render spec does not bind the exact confirmed frame.')
    }
  }
  if (envelope.contractKind === 'finish_readiness') {
    const readiness = payload as CaptionDomainPayloadMap['finish_readiness']
    if (readiness.allFinalCaptionScenesReady
      && (envelope.canonicalScope.approvedSnapshotRef === null
        || envelope.sourceBindings.storyTimingRef === null
        || envelope.sourceBindings.captionApprovalEnvelopeRef === null)) {
      throw new Error('Final Caption readiness lacks approved snapshot, StoryTiming, or approval lineage.')
    }
  }
  if (envelope.contractKind === 'qa_report') {
    const qa = payload as CaptionDomainPayloadMap['qa_report']
    if (qa.captionQaRecommendation === 'accept_caption_scope'
      && qa.checks.some((check) =>
        check.disposition === 'failed' || check.disposition === 'needs_evidence')) {
      throw new Error('Caption QA acceptance is inconsistent with unresolved checks.')
    }
  }
  const parsed = { ...envelope, payload } as AnyCaptionDomainContract
  const expectedDigest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'contractDigestSha256',
  )
  if (expectedDigest !== parsed.contractDigestSha256) {
    throw new Error('Caption domain contract digest verification failed.')
  }
  return parsed
}

export function createCaptionDomainContract<K extends CaptionDomainContractKind>(
  input: Omit<CaptionDomainContract<K>,
    'schemaVersion' | 'contractVersion' | 'contractDigestSha256'>,
): CaptionDomainContract<K> {
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion: CAPTION_DOMAIN_CONTRACT_SCHEMA_VERSION,
    contractVersion: CAPTION_DOMAIN_CONTRACT_VERSIONS[input.contractKind],
  }
  const candidate = {
    ...withoutDigest,
    contractDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, contractDigestSha256: '' },
      'contractDigestSha256',
    ),
  }
  return parseCaptionDomainContract(candidate) as CaptionDomainContract<K>
}
