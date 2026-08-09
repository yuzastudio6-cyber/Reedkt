import { z } from 'zod'
import {
  CAPTION_FINAL_VISUAL_HIERARCHY_VERSION,
  CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION,
  CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION,
  CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION,
  type CaptionFinalVisualHierarchy,
  type CaptionVisualIntelligenceEvidencePacket,
  type CaptionVisualIntelligenceSupportPayload,
  type CaptionVisualObservationRole,
  type CaptionVisualOccupancyManifest,
  type CaptionVisualOccupancyRegion,
  type CaptionVisualSupportBundle,
  type CaptionVisualSupportPurpose,
} from '../../src/types/caption-visual-intelligence-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import {
  SKILL_SUPPORT_REQUEST_VERSION,
  type SkillCanonicalScope,
  type SkillContractRef,
  type SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from './caption-authority-boundary'

const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const visualRefSchema = z.object({
  id: z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  version: z.number().int().positive().max(1_000_000),
  contentHash: prefixedSha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Frame range has no duration.' })
  }
})
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
const purposeSchema = z.enum(['final_frame_occupancy', 'rendered_caption_inspection'])
const roleSchema = z.enum([
  'safe_candidate', 'face', 'eyes', 'mouth', 'hair', 'hand', 'gesture',
  'speaker', 'product', 'important_object', 'screen_text', 'map_label',
  'chart_label', 'browser_highlight', 'lower_third', 'fact_safety_note',
  'cta', 'broll_panel', 'living_frame', 'platform_ui', 'crop_risk',
])
const rectSchema = z.object({
  x: z.number().int().min(0).max(10_000),
  y: z.number().int().min(0).max(10_000),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
}).strict().superRefine((rect, context) => {
  if (rect.x + rect.width > 10_000 || rect.y + rect.height > 10_000) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Region exceeds the output frame.' })
  }
})
const supportPayloadSchema: z.ZodType<CaptionVisualIntelligenceSupportPayload> = z.object({
  schemaVersion: z.literal(CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION),
  payloadId: safeKey,
  payloadDigestSha256: sha256,
  purpose: purposeSchema,
  canonicalScope: scopeSchema,
  pictureLockRef: refSchema,
  finishReadinessRef: refSchema,
  confirmedOutputFrame: z.object({
    outputId: safeKey,
    width: z.number().int().min(320).max(16_384),
    height: z.number().int().min(180).max(16_384),
    aspectRatioNumerator: z.number().int().positive().max(16_384),
    aspectRatioDenominator: z.number().int().positive().max(16_384),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
    confirmedOutputFrameDigestSha256: sha256,
  }).strict(),
  sourcePrivateArtifactRef: refSchema,
  canonicalLayoutOccupancyRef: refSchema,
  requestedSceneId: safeKey,
  requestedRange: frameRangeSchema,
  requiredObservationRoles: z.array(roleSchema).min(1).max(roleSchema.options.length),
  expectedOutcomeRefs: z.array(refSchema).min(1).max(512),
  expectedVisualIntelligenceOperation: z.literal('inspect_edit'),
  expectedVisualIntelligenceProfile: z.literal('caption_layout_qa'),
  coveragePolicy: z.object({
    completeRequestedRangeRequired: z.literal(true),
    everyTimelineFrameInspectionClaimRequired: z.literal(false),
    completeTimePixelInspectionClaimRequired: z.literal(false),
    targetedFollowupRangesAllowed: z.literal(true),
  }).strict(),
  renderedInspectionPolicy: z.object({
    actualRenderedPixelsRequired: z.boolean(),
    directRasterInspectionStillRequired: z.literal(true),
    deterministicQaStillRequired: z.literal(true),
    independentFinalQaStillRequired: z.literal(true),
  }).strict(),
  byteFreeRequest: z.literal(true),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  providerPromptIncluded: z.literal(false),
  providerCredentialIncluded: z.literal(false),
  providerOrModelSelectedByCaption: z.literal(false),
  directPeerDispatchRequested: z.literal(false),
  visualIntelligenceRemainsEvidenceOwner: z.literal(true),
}).strict()
const observationSchema = z.object({
  observationId: safeKey,
  sceneId: safeKey,
  frameRange: frameRangeSchema,
  role: roleSchema,
  regionBasisPoints: rectSchema,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  temporalStabilityBasisPoints: z.number().int().min(0).max(10_000),
  measuredContrastRatioMilli: z.number().int().min(0).max(30_000).nullable(),
  clutterBasisPoints: z.number().int().min(0).max(10_000),
  cropResilienceBasisPoints: z.number().int().min(0).max(10_000),
  compositionBalanceBasisPoints: z.number().int().min(0).max(10_000),
  findingIds: z.array(safeKey).max(512),
  evidenceRefs: z.array(visualRefSchema).min(1).max(512),
  uncertaintyCode: safeKey.nullable(),
}).strict()
const packetSchema: z.ZodType<CaptionVisualIntelligenceEvidencePacket> = z.object({
  schemaVersion: z.literal(CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION),
  packetId: safeKey,
  packetDigestSha256: sha256,
  supportRequestRef: refSchema,
  supportPayloadRef: refSchema,
  canonicalScope: scopeSchema,
  purpose: purposeSchema,
  sourcePrivateArtifactRef: refSchema,
  canonicalLayoutOccupancyRef: refSchema,
  pictureLockRef: refSchema,
  finishReadinessRef: refSchema,
  confirmedOutputFrameDigestSha256: sha256,
  requestedSceneId: safeKey,
  requestedRange: frameRangeSchema,
  visualIntelligenceContractVersion: z.literal('visual-intelligence-contract-v1'),
  visualIntelligenceReportRef: visualRefSchema,
  authenticatedReadResultRef: refSchema.nullable(),
  reportOperation: z.literal('inspect_edit'),
  reportProfile: z.literal('caption_layout_qa'),
  reportDisposition: z.enum(['pass', 'pass_with_warnings', 'needs_revision', 'blocked']),
  coverage: z.object({
    requestedRange: frameRangeSchema,
    analyzedRanges: z.array(frameRangeSchema).min(1).max(4_096),
    incompleteRanges: z.array(frameRangeSchema).max(4_096),
    targetedFollowupRanges: z.array(frameRangeSchema).max(4_096),
    completeRequestedRangeCoverage: z.boolean(),
    everyTimelineFrameInspected: z.literal(false),
    completeTimePixelInspectionClaimAllowed: z.literal(false),
  }).strict(),
  observations: z.array(observationSchema).min(1).max(20_000),
  findingIds: z.array(safeKey).max(10_000),
  evidenceMode: z.enum(['contract_fixture', 'authenticated_private_runtime']),
  canonicalReportRereadVerified: z.boolean(),
  exactCanonicalScopeVerified: z.boolean(),
  actualVisualInferenceObserved: z.boolean(),
  actualRenderedPixelsInspected: z.boolean(),
  immutableReportReread: z.boolean(),
  browserLocalStateUsed: z.literal(false),
  rawProviderPayloadIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  providerCallMadeByCaption: z.literal(false),
  visualIntelligenceMutatedEdit: z.literal(false),
  visualIntelligenceGrantedFinalQa: z.literal(false),
  runtimeAuthorityGrantedToCaption: z.literal(false),
  assetAuthorityGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const occupancyRegionSchema: z.ZodType<CaptionVisualOccupancyRegion> = z.object({
  regionId: safeKey,
  sceneId: safeKey,
  frameRange: frameRangeSchema,
  role: roleSchema,
  regionBasisPoints: rectSchema,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  temporalStabilityBasisPoints: z.number().int().min(0).max(10_000),
  measuredContrastRatioMilli: z.number().int().min(0).max(30_000).nullable(),
  clutterBasisPoints: z.number().int().min(0).max(10_000),
  cropResilienceBasisPoints: z.number().int().min(0).max(10_000),
  compositionBalanceBasisPoints: z.number().int().min(0).max(10_000),
  uncertaintyCode: safeKey.nullable(),
  protected: z.boolean(),
  overlapsProtectedRegionIds: z.array(safeKey).max(10_000),
  candidateScoreBasisPoints: z.number().int().min(0).max(10_000).nullable(),
  selectableForStableCaption: z.boolean(),
  sourceObservationId: safeKey,
  evidenceRefs: z.array(visualRefSchema).min(1).max(512),
}).strict()
const occupancySchema: z.ZodType<CaptionVisualOccupancyManifest> = z.object({
  schemaVersion: z.literal(CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION),
  manifestId: safeKey,
  manifestDigestSha256: sha256,
  canonicalScope: scopeSchema,
  pictureLockRef: refSchema,
  finishReadinessRef: refSchema,
  canonicalLayoutOccupancyRef: refSchema,
  supportRequestRef: refSchema,
  visualEvidencePacketRef: refSchema,
  visualIntelligenceReportRef: visualRefSchema,
  requestedSceneId: safeKey,
  requestedRange: frameRangeSchema,
  regions: z.array(occupancyRegionSchema).min(1).max(20_000),
  protectedRegionIds: z.array(safeKey).max(20_000),
  safeCandidateRegionIds: z.array(safeKey).max(20_000),
  provisionalSelectedCandidateRegionId: safeKey.nullable(),
  provisionalFallbackCandidateRegionIds: z.array(safeKey).max(20_000),
  sourceEvidenceMode: z.enum(['contract_fixture', 'authenticated_private_runtime']),
  sourceReportDisposition: z.enum(['pass', 'pass_with_warnings', 'needs_revision', 'blocked']),
  sourceCanonicalReportRereadVerified: z.boolean(),
  sourceExactCanonicalScopeVerified: z.boolean(),
  sourceImmutableReportReread: z.boolean(),
  sourceCompleteRequestedRangeCoverage: z.boolean(),
  evidenceQualifiedForPrivateRuntime: z.boolean(),
  lateFinalVisualHierarchyAllowed: z.boolean(),
  blockerCodes: z.array(safeKey).max(512),
  captionProjectionOnly: z.literal(true),
  visualIntelligenceRemainsEvidenceOwner: z.literal(true),
  canonicalLayoutOwnerRetained: z.literal(true),
  captionLayoutAuthorityClaimed: z.literal(false),
  maskOrTrackingAuthorityClaimed: z.literal(false),
  finalQaApprovalClaimed: z.literal(false),
  finalRenderAuthorityClaimed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()
const layerSchema = z.enum([
  'base_video', 'living_frame', 'broll_or_graphics', 'foreground_subject_mask',
  'creative_caption', 'accessible_caption',
])
const hierarchySchema: z.ZodType<CaptionFinalVisualHierarchy> = z.object({
  schemaVersion: z.literal(CAPTION_FINAL_VISUAL_HIERARCHY_VERSION),
  hierarchyId: safeKey,
  hierarchyDigestSha256: sha256,
  canonicalScope: scopeSchema,
  occupancyManifestRef: refSchema,
  requestedSceneId: safeKey,
  qualificationState: z.enum([
    'ready', 'blocked_visual_runtime_evidence', 'blocked_no_safe_region',
  ]),
  accessibleCaptionRegionId: safeKey.nullable(),
  creativeCaptionRegionId: safeKey.nullable(),
  fallbackRegionIds: z.array(safeKey).max(20_000),
  layerOrderBottomToTop: z.array(layerSchema).length(6),
  captionAboveLivingFrameByDefault: z.literal(true),
  accessibleCaptionAboveAllVisuals: z.literal(true),
  nonTopPlaneCreativeCaptionAdmitted: z.literal(false),
  trackAllEvidenceRequiredForNonTopPlane: z.literal(true),
  storyTimingStillRequiredForExecutablePlacement: z.literal(true),
  finalPlacementClaimed: z.literal(false),
  finalQaApprovalClaimed: z.literal(false),
  finalCanvasAuthorityClaimed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()

function refKey(ref: { id: string; version: string | number; contentHash: string }): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function exactRef(
  left: { id: string; version: string | number; contentHash: string } | null,
  right: { id: string; version: string | number; contentHash: string } | null,
): boolean {
  return left === null || right === null ? left === right : refKey(left) === refKey(right)
}

function exactScope(left: CaptionDomainCanonicalScope, right: CaptionDomainCanonicalScope): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.planVersionId === right.planVersionId
    && exactRef(left.approvedSnapshotRef, right.approvedSnapshotRef)
    && left.outputId === right.outputId
    && left.sceneId === right.sceneId
    && JSON.stringify(left.authorizedFrameRanges) === JSON.stringify(right.authorizedFrameRanges)
}

function exactRange(
  left: { startFrame: number; endFrameExclusive: number },
  right: { startFrame: number; endFrameExclusive: number },
): boolean {
  return left.startFrame === right.startFrame
    && left.endFrameExclusive === right.endFrameExclusive
}

function exactRefList(
  left: Array<{ id: string; version: string; contentHash: string }>,
  right: Array<{ id: string; version: string; contentHash: string }>,
): boolean {
  return left.length === right.length
    && left.every((ref, index) => exactRef(ref, right[index] ?? null))
}

function verifyDigest<T extends Record<string, unknown>>(
  value: T,
  field: keyof T & string,
  label: string,
): void {
  const expected = calculateSkillContractDigest(value, field)
  if (value[field] !== expected) throw new Error(`${label} digest verification failed.`)
}

function payloadRef(payload: CaptionVisualIntelligenceSupportPayload): CaptionDomainRef {
  return {
    id: payload.payloadId,
    version: payload.schemaVersion,
    contentHash: payload.payloadDigestSha256,
  }
}

function supportRequestRef(request: SkillSupportRequest): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function packetRef(packet: CaptionVisualIntelligenceEvidencePacket): CaptionDomainRef {
  return {
    id: packet.packetId,
    version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256,
  }
}

function manifestRef(manifest: CaptionVisualOccupancyManifest): CaptionDomainRef {
  return {
    id: manifest.manifestId,
    version: manifest.schemaVersion,
    contentHash: manifest.manifestDigestSha256,
  }
}

function gcd(left: number, right: number): number {
  let a = left
  let b = right
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

function rangeWithin(
  child: { startFrame: number; endFrameExclusive: number },
  parent: { startFrame: number; endFrameExclusive: number },
): boolean {
  return child.startFrame >= parent.startFrame
    && child.endFrameExclusive <= parent.endFrameExclusive
}

function rangesCoverExactly(
  ranges: Array<{ startFrame: number; endFrameExclusive: number }>,
  requested: { startFrame: number; endFrameExclusive: number },
): boolean {
  const ordered = [...ranges].sort((left, right) =>
    left.startFrame - right.startFrame || left.endFrameExclusive - right.endFrameExclusive)
  let cursor = requested.startFrame
  for (const range of ordered) {
    if (!rangeWithin(range, requested) || range.startFrame > cursor) return false
    cursor = Math.max(cursor, range.endFrameExclusive)
  }
  return cursor === requested.endFrameExclusive
}

function skillScope(scope: CaptionDomainCanonicalScope): SkillCanonicalScope {
  return {
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotRef: scope.approvedSnapshotRef,
    outputId: scope.outputId,
    sceneId: scope.sceneId,
    boundaryId: null,
    authorizedFrameRanges: structuredClone(scope.authorizedFrameRanges),
  }
}

function supportScopeMatches(
  support: SkillCanonicalScope,
  payload: CaptionVisualIntelligenceSupportPayload,
): boolean {
  const scope = payload.canonicalScope
  return support.ownerUserId === scope.ownerUserId
    && support.workspaceId === scope.workspaceId
    && support.projectId === scope.projectId
    && support.editSessionId === scope.editSessionId
    && exactRef(support.approvedSnapshotRef, scope.approvedSnapshotRef)
    && support.outputId === scope.outputId
    && support.sceneId === scope.sceneId
    && JSON.stringify(support.authorizedFrameRanges) === JSON.stringify(scope.authorizedFrameRanges)
}

export function parseCaptionVisualIntelligenceSupportPayload(
  value: unknown,
): CaptionVisualIntelligenceSupportPayload {
  assertClosedContractTree(value, 'Caption Visual Intelligence support payload')
  const parsed = supportPayloadSchema.parse(value)
  const divisor = gcd(parsed.confirmedOutputFrame.width, parsed.confirmedOutputFrame.height)
  if (parsed.canonicalScope.approvedSnapshotRef === null
    || parsed.canonicalScope.outputId !== parsed.confirmedOutputFrame.outputId
    || parsed.canonicalScope.sceneId !== parsed.requestedSceneId
    || parsed.confirmedOutputFrame.aspectRatioNumerator
      !== parsed.confirmedOutputFrame.width / divisor
    || parsed.confirmedOutputFrame.aspectRatioDenominator
      !== parsed.confirmedOutputFrame.height / divisor
    || !parsed.canonicalScope.authorizedFrameRanges.some((range) =>
      rangeWithin(parsed.requestedRange, range))
    || new Set(parsed.requiredObservationRoles).size
      !== parsed.requiredObservationRoles.length
    || (parsed.purpose === 'final_frame_occupancy'
      && !parsed.requiredObservationRoles.includes('safe_candidate'))
    || new Set(parsed.expectedOutcomeRefs.map(refKey)).size
      !== parsed.expectedOutcomeRefs.length
    || parsed.renderedInspectionPolicy.actualRenderedPixelsRequired
      !== (parsed.purpose === 'rendered_caption_inspection')) {
    throw new Error('Caption Visual Intelligence support payload scope or policy is invalid.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'payloadDigestSha256',
    'Caption Visual Intelligence support payload',
  )
  return parsed
}

export function createCaptionVisualIntelligenceSupport(input: {
  payloadId: string
  requestId: string
  idempotencyKey: string
  originalCallRef: SkillContractRef
  purpose: CaptionVisualSupportPurpose
  canonicalScope: CaptionDomainCanonicalScope
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  confirmedOutputFrame: CaptionVisualIntelligenceSupportPayload['confirmedOutputFrame']
  sourcePrivateArtifactRef: CaptionDomainRef
  canonicalLayoutOccupancyRef: CaptionDomainRef
  requiredObservationRoles: CaptionVisualObservationRole[]
  expectedOutcomeRefs: CaptionDomainRef[]
}): CaptionVisualSupportBundle {
  assertClosedContractTree(input, 'Caption Visual Intelligence support input')
  if (input.canonicalScope.sceneId === null) {
    throw new Error('Caption Visual Intelligence support requires an exact scene scope.')
  }
  const requestedRange = input.canonicalScope.authorizedFrameRanges[0]
  if (!requestedRange || input.canonicalScope.authorizedFrameRanges.length !== 1) {
    throw new Error('Caption Visual Intelligence support requires one exact range.')
  }
  const withoutPayloadDigest: Omit<
    CaptionVisualIntelligenceSupportPayload,
    'payloadDigestSha256'
  > = {
    schemaVersion: CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION,
    payloadId: safeKey.parse(input.payloadId),
    purpose: input.purpose,
    canonicalScope: structuredClone(input.canonicalScope),
    pictureLockRef: structuredClone(input.pictureLockRef),
    finishReadinessRef: structuredClone(input.finishReadinessRef),
    confirmedOutputFrame: structuredClone(input.confirmedOutputFrame),
    sourcePrivateArtifactRef: structuredClone(input.sourcePrivateArtifactRef),
    canonicalLayoutOccupancyRef: structuredClone(input.canonicalLayoutOccupancyRef),
    requestedSceneId: input.canonicalScope.sceneId,
    requestedRange: structuredClone(requestedRange),
    requiredObservationRoles: [...input.requiredObservationRoles],
    expectedOutcomeRefs: structuredClone(input.expectedOutcomeRefs),
    expectedVisualIntelligenceOperation: 'inspect_edit',
    expectedVisualIntelligenceProfile: 'caption_layout_qa',
    coveragePolicy: {
      completeRequestedRangeRequired: true,
      everyTimelineFrameInspectionClaimRequired: false,
      completeTimePixelInspectionClaimRequired: false,
      targetedFollowupRangesAllowed: true,
    },
    renderedInspectionPolicy: {
      actualRenderedPixelsRequired: input.purpose === 'rendered_caption_inspection',
      directRasterInspectionStillRequired: true,
      deterministicQaStillRequired: true,
      independentFinalQaStillRequired: true,
    },
    byteFreeRequest: true,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    providerPromptIncluded: false,
    providerCredentialIncluded: false,
    providerOrModelSelectedByCaption: false,
    directPeerDispatchRequested: false,
    visualIntelligenceRemainsEvidenceOwner: true,
  }
  const payload = parseCaptionVisualIntelligenceSupportPayload({
    ...withoutPayloadDigest,
    payloadDigestSha256: calculateSkillContractDigest(
      { ...withoutPayloadDigest, payloadDigestSha256: '' },
      'payloadDigestSha256',
    ),
  })
  const supportRequest = createCaptionVisualIntelligenceSupportRequest({
    requestId: input.requestId,
    originalCallRef: input.originalCallRef,
    payload,
  })
  return { payload, supportRequest }
}

export function createCaptionVisualIntelligenceSupportRequest(input: {
  requestId: string
  originalCallRef: SkillContractRef
  payload: unknown
  canonicalSkillScope?: SkillCanonicalScope
}): SkillSupportRequest {
  assertClosedContractTree(
    input, 'Caption Visual Intelligence support request input')
  const payload = parseCaptionVisualIntelligenceSupportPayload(input.payload)
  const requestWithoutDigest: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: safeKey.parse(input.requestId),
    originalCallRef: refSchema.parse(input.originalCallRef),
    requestingSkillKey: 'captions',
    targetSkillKey: 'visual_intelligence',
    reasonCode: `caption_visual.${payload.purpose}.required`,
    requestedArtifactTypes: [payload.purpose === 'final_frame_occupancy'
      ? 'caption_visual_intelligence_occupancy_evidence'
      : 'caption_visual_intelligence_rendered_inspection_evidence'],
    canonicalScope: input.canonicalSkillScope === undefined
      ? skillScope(payload.canonicalScope)
      : structuredClone(input.canonicalSkillScope),
    typedPayloadType: CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION,
    typedPayload: payload,
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  const supportRequest = parseSkillSupportRequest({
    ...requestWithoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      { ...requestWithoutDigest, requestDigestSha256: '' },
      'requestDigestSha256',
    ),
  })
  if (!supportScopeMatches(supportRequest.canonicalScope, payload)) {
    throw new Error('Caption Visual Intelligence support envelope changed scope.')
  }
  return supportRequest
}

export function parseCaptionVisualIntelligenceEvidencePacket(
  value: unknown,
  input: { payload: unknown; supportRequest: unknown },
): CaptionVisualIntelligenceEvidencePacket {
  assertClosedContractTree(value, 'Caption Visual Intelligence evidence packet')
  const payload = parseCaptionVisualIntelligenceSupportPayload(input.payload)
  const request = parseSkillSupportRequest(input.supportRequest)
  const embeddedPayload = parseCaptionVisualIntelligenceSupportPayload(request.typedPayload)
  const parsed = packetSchema.parse(value)
  const expectedSupportRef = supportRequestRef(request)
  const expectedArtifactType = payload.purpose === 'final_frame_occupancy'
    ? 'caption_visual_intelligence_occupancy_evidence'
    : 'caption_visual_intelligence_rendered_inspection_evidence'
  const requiredRoles = new Set(payload.requiredObservationRoles)
  const observationIds = new Set(parsed.observations.map((item) => item.observationId))
  const fixtureMode = parsed.evidenceMode === 'contract_fixture'
  if (request.requestingSkillKey !== 'captions'
    || request.targetSkillKey !== 'visual_intelligence'
    || request.reasonCode !== `caption_visual.${payload.purpose}.required`
    || request.requestedArtifactTypes.join('|') !== expectedArtifactType
    || request.typedPayloadType !== payload.schemaVersion
    || !exactRef(payloadRef(embeddedPayload), payloadRef(payload))
    || !supportScopeMatches(request.canonicalScope, payload)
    || !exactRef(parsed.supportRequestRef, expectedSupportRef)
    || !exactRef(parsed.supportPayloadRef, payloadRef(payload))
    || !exactScope(parsed.canonicalScope, payload.canonicalScope)
    || parsed.purpose !== payload.purpose
    || !exactRef(parsed.sourcePrivateArtifactRef, payload.sourcePrivateArtifactRef)
    || !exactRef(parsed.canonicalLayoutOccupancyRef, payload.canonicalLayoutOccupancyRef)
    || !exactRef(parsed.pictureLockRef, payload.pictureLockRef)
    || !exactRef(parsed.finishReadinessRef, payload.finishReadinessRef)
    || parsed.confirmedOutputFrameDigestSha256
      !== payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256
    || parsed.requestedSceneId !== payload.requestedSceneId
    || !exactRange(parsed.requestedRange, payload.requestedRange)
    || parsed.reportOperation !== payload.expectedVisualIntelligenceOperation
    || parsed.reportProfile !== payload.expectedVisualIntelligenceProfile
    || !exactRange(parsed.coverage.requestedRange, payload.requestedRange)
    || observationIds.size !== parsed.observations.length
    || new Set(parsed.findingIds).size !== parsed.findingIds.length
    || parsed.observations.some((observation) =>
      observation.sceneId !== payload.requestedSceneId
      || !rangeWithin(observation.frameRange, payload.requestedRange)
      || new Set(observation.evidenceRefs.map(refKey)).size
        !== observation.evidenceRefs.length
      || observation.findingIds.some((findingId) => !parsed.findingIds.includes(findingId)))
    || Array.from(requiredRoles).some((role) =>
      !parsed.observations.some((observation) => observation.role === role))
    || [
      ...parsed.coverage.analyzedRanges,
      ...parsed.coverage.incompleteRanges,
      ...parsed.coverage.targetedFollowupRanges,
    ].some((range) => !rangeWithin(range, payload.requestedRange))
    || parsed.coverage.completeRequestedRangeCoverage
      !== (parsed.coverage.incompleteRanges.length === 0
        && rangesCoverExactly(parsed.coverage.analyzedRanges, payload.requestedRange))
    || (fixtureMode && (parsed.authenticatedReadResultRef !== null
      || parsed.canonicalReportRereadVerified
      || parsed.exactCanonicalScopeVerified
      || parsed.actualVisualInferenceObserved
      || parsed.actualRenderedPixelsInspected
      || parsed.immutableReportReread))
    || (!fixtureMode && (parsed.authenticatedReadResultRef === null
      || !parsed.canonicalReportRereadVerified
      || !parsed.exactCanonicalScopeVerified
      || !parsed.actualVisualInferenceObserved
      || !parsed.immutableReportReread))
    || parsed.actualRenderedPixelsInspected
      !== (!fixtureMode && payload.purpose === 'rendered_caption_inspection')) {
    throw new Error('Caption Visual Intelligence evidence packet is stale or overclaimed.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'packetDigestSha256',
    'Caption Visual Intelligence evidence packet',
  )
  return parsed
}

function rectsOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): boolean {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
}

function candidateScore(observation: {
  confidenceBasisPoints: number
  temporalStabilityBasisPoints: number
  clutterBasisPoints: number
  cropResilienceBasisPoints: number
  compositionBalanceBasisPoints: number
}): number {
  return Math.round((
    observation.confidenceBasisPoints
    + observation.temporalStabilityBasisPoints
    + (10_000 - observation.clutterBasisPoints)
    + observation.cropResilienceBasisPoints
    + observation.compositionBalanceBasisPoints
  ) / 5)
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export function parseCaptionVisualOccupancyManifest(
  value: unknown,
): CaptionVisualOccupancyManifest {
  assertClosedContractTree(value, 'Caption visual occupancy manifest')
  const parsed = occupancySchema.parse(value)
  const regionIds = new Set(parsed.regions.map((region) => region.regionId))
  const protectedIds = parsed.regions.filter((region) => region.protected)
    .map((region) => region.regionId)
  const actualProtectedRegions = parsed.regions.filter((region) =>
    region.role !== 'safe_candidate')
  for (const region of parsed.regions) {
    const expectedProtected = region.role !== 'safe_candidate'
    const expectedOverlaps = region.role === 'safe_candidate'
      ? actualProtectedRegions.filter((protectedRegion) =>
        rectsOverlap(region.regionBasisPoints, protectedRegion.regionBasisPoints))
        .map((protectedRegion) => protectedRegion.regionId)
        .sort(lexical)
      : []
    const expectedScore = region.role === 'safe_candidate'
      ? candidateScore(region) : null
    const expectedSelectable = region.role === 'safe_candidate'
      && expectedOverlaps.length === 0
      && region.measuredContrastRatioMilli !== null
      && region.measuredContrastRatioMilli >= 4_500
      && region.temporalStabilityBasisPoints >= 7_000
      && region.uncertaintyCode === null
    if (region.protected !== expectedProtected
      || region.overlapsProtectedRegionIds.join('|') !== expectedOverlaps.join('|')
      || region.candidateScoreBasisPoints !== expectedScore
      || region.selectableForStableCaption !== expectedSelectable
      || region.sourceObservationId !== region.regionId
      || new Set(region.evidenceRefs.map(refKey)).size !== region.evidenceRefs.length) {
      throw new Error('Caption visual occupancy region semantics are invalid.')
    }
  }
  const candidates = parsed.regions.filter((region) => region.role === 'safe_candidate'
    && region.selectableForStableCaption)
    .sort((left, right) => (right.candidateScoreBasisPoints ?? 0)
      - (left.candidateScoreBasisPoints ?? 0) || lexical(left.regionId, right.regionId))
    .map((region) => region.regionId)
  const selected = candidates[0] ?? null
  const qualified = parsed.sourceEvidenceMode === 'authenticated_private_runtime'
    && parsed.sourceCanonicalReportRereadVerified
    && parsed.sourceExactCanonicalScopeVerified
    && parsed.sourceImmutableReportReread
    && parsed.sourceCompleteRequestedRangeCoverage
    && (parsed.sourceReportDisposition === 'pass'
      || parsed.sourceReportDisposition === 'pass_with_warnings')
  const blockers = [
    ...(!qualified ? ['caption_visual.runtime_evidence_unqualified'] : []),
    ...(candidates.length === 0 ? ['caption_visual.no_safe_candidate'] : []),
  ]
  if (regionIds.size !== parsed.regions.length
    || new Set(parsed.protectedRegionIds).size !== parsed.protectedRegionIds.length
    || new Set(parsed.safeCandidateRegionIds).size !== parsed.safeCandidateRegionIds.length
    || protectedIds.join('|') !== parsed.protectedRegionIds.join('|')
    || candidates.join('|') !== parsed.safeCandidateRegionIds.join('|')
    || parsed.provisionalSelectedCandidateRegionId !== selected
    || parsed.provisionalFallbackCandidateRegionIds.join('|') !== candidates.slice(1).join('|')
    || parsed.evidenceQualifiedForPrivateRuntime !== qualified
    || parsed.lateFinalVisualHierarchyAllowed !== (qualified && selected !== null)
    || parsed.blockerCodes.join('|') !== blockers.join('|')
    || parsed.regions.some((region) =>
      region.sceneId !== parsed.requestedSceneId
      || !rangeWithin(region.frameRange, parsed.requestedRange)
      || region.overlapsProtectedRegionIds.some((id) => !regionIds.has(id)))) {
    throw new Error('Caption visual occupancy semantics are invalid.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'manifestDigestSha256',
    'Caption visual occupancy manifest',
  )
  return parsed
}

export function createCaptionVisualOccupancyManifest(input: {
  manifestId: string
  packet: unknown
  payload: unknown
  supportRequest: unknown
}): CaptionVisualOccupancyManifest {
  const payload = parseCaptionVisualIntelligenceSupportPayload(input.payload)
  const request = parseSkillSupportRequest(input.supportRequest)
  const packet = parseCaptionVisualIntelligenceEvidencePacket(input.packet, {
    payload,
    supportRequest: request,
  })
  if (packet.purpose !== 'final_frame_occupancy') {
    throw new Error('Rendered-inspection evidence cannot become an occupancy manifest.')
  }
  const protectedObservations = packet.observations.filter((item) =>
    item.role !== 'safe_candidate')
  const regions: CaptionVisualOccupancyRegion[] = packet.observations.map((observation) => {
    const protectedRegionIds = observation.role === 'safe_candidate'
      ? protectedObservations.filter((protectedObservation) =>
        rectsOverlap(observation.regionBasisPoints, protectedObservation.regionBasisPoints))
        .map((protectedObservation) => protectedObservation.observationId)
        .sort(lexical)
      : []
    const score = observation.role === 'safe_candidate'
      ? candidateScore(observation) : null
    const selectable = observation.role === 'safe_candidate'
      && protectedRegionIds.length === 0
      && observation.measuredContrastRatioMilli !== null
      && observation.measuredContrastRatioMilli >= 4_500
      && observation.temporalStabilityBasisPoints >= 7_000
      && observation.uncertaintyCode === null
    return {
      regionId: observation.observationId,
      sceneId: observation.sceneId,
      frameRange: structuredClone(observation.frameRange),
      role: observation.role,
      regionBasisPoints: structuredClone(observation.regionBasisPoints),
      confidenceBasisPoints: observation.confidenceBasisPoints,
      temporalStabilityBasisPoints: observation.temporalStabilityBasisPoints,
      measuredContrastRatioMilli: observation.measuredContrastRatioMilli,
      clutterBasisPoints: observation.clutterBasisPoints,
      cropResilienceBasisPoints: observation.cropResilienceBasisPoints,
      compositionBalanceBasisPoints: observation.compositionBalanceBasisPoints,
      uncertaintyCode: observation.uncertaintyCode,
      protected: observation.role !== 'safe_candidate',
      overlapsProtectedRegionIds: protectedRegionIds,
      candidateScoreBasisPoints: score,
      selectableForStableCaption: selectable,
      sourceObservationId: observation.observationId,
      evidenceRefs: structuredClone(observation.evidenceRefs),
    }
  })
  const protectedRegionIds = regions.filter((region) => region.protected)
    .map((region) => region.regionId)
  const safeCandidateRegionIds = regions.filter((region) =>
    region.role === 'safe_candidate' && region.selectableForStableCaption)
    .sort((left, right) => (right.candidateScoreBasisPoints ?? 0)
      - (left.candidateScoreBasisPoints ?? 0) || lexical(left.regionId, right.regionId))
    .map((region) => region.regionId)
  const evidenceQualifiedForPrivateRuntime = packet.evidenceMode
      === 'authenticated_private_runtime'
    && packet.canonicalReportRereadVerified
    && packet.exactCanonicalScopeVerified
    && packet.immutableReportReread
    && packet.coverage.completeRequestedRangeCoverage
    && (packet.reportDisposition === 'pass'
      || packet.reportDisposition === 'pass_with_warnings')
  const provisionalSelectedCandidateRegionId = safeCandidateRegionIds[0] ?? null
  const blockerCodes = [
    ...(!evidenceQualifiedForPrivateRuntime
      ? ['caption_visual.runtime_evidence_unqualified'] : []),
    ...(safeCandidateRegionIds.length === 0
      ? ['caption_visual.no_safe_candidate'] : []),
  ]
  const withoutDigest: Omit<CaptionVisualOccupancyManifest, 'manifestDigestSha256'> = {
    schemaVersion: CAPTION_VISUAL_OCCUPANCY_MANIFEST_VERSION,
    manifestId: safeKey.parse(input.manifestId),
    canonicalScope: structuredClone(payload.canonicalScope),
    pictureLockRef: structuredClone(payload.pictureLockRef),
    finishReadinessRef: structuredClone(payload.finishReadinessRef),
    canonicalLayoutOccupancyRef: structuredClone(payload.canonicalLayoutOccupancyRef),
    supportRequestRef: supportRequestRef(request),
    visualEvidencePacketRef: packetRef(packet),
    visualIntelligenceReportRef: structuredClone(packet.visualIntelligenceReportRef),
    requestedSceneId: packet.requestedSceneId,
    requestedRange: structuredClone(packet.requestedRange),
    regions,
    protectedRegionIds,
    safeCandidateRegionIds,
    provisionalSelectedCandidateRegionId,
    provisionalFallbackCandidateRegionIds: safeCandidateRegionIds.slice(1),
    sourceEvidenceMode: packet.evidenceMode,
    sourceReportDisposition: packet.reportDisposition,
    sourceCanonicalReportRereadVerified: packet.canonicalReportRereadVerified,
    sourceExactCanonicalScopeVerified: packet.exactCanonicalScopeVerified,
    sourceImmutableReportReread: packet.immutableReportReread,
    sourceCompleteRequestedRangeCoverage: packet.coverage.completeRequestedRangeCoverage,
    evidenceQualifiedForPrivateRuntime,
    lateFinalVisualHierarchyAllowed: evidenceQualifiedForPrivateRuntime
      && provisionalSelectedCandidateRegionId !== null,
    blockerCodes,
    captionProjectionOnly: true,
    visualIntelligenceRemainsEvidenceOwner: true,
    canonicalLayoutOwnerRetained: true,
    captionLayoutAuthorityClaimed: false,
    maskOrTrackingAuthorityClaimed: false,
    finalQaApprovalClaimed: false,
    finalRenderAuthorityClaimed: false,
    productionAuthorityClaimed: false,
  }
  return parseCaptionVisualOccupancyManifest({
    ...withoutDigest,
    manifestDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, manifestDigestSha256: '' },
      'manifestDigestSha256',
    ),
  })
}

export function parseCaptionFinalVisualHierarchy(
  value: unknown,
  occupancyManifestValue: unknown,
): CaptionFinalVisualHierarchy {
  assertClosedContractTree(value, 'Caption final visual hierarchy')
  const parsed = hierarchySchema.parse(value)
  const manifest = parseCaptionVisualOccupancyManifest(occupancyManifestValue)
  const exactLayers = [
    'base_video', 'living_frame', 'broll_or_graphics', 'foreground_subject_mask',
    'creative_caption', 'accessible_caption',
  ]
  const region = manifest.provisionalSelectedCandidateRegionId
  const expectedState = manifest.lateFinalVisualHierarchyAllowed
    ? 'ready'
    : region === null ? 'blocked_no_safe_region'
      : 'blocked_visual_runtime_evidence'
  const admittedRegion = expectedState === 'ready' ? region : null
  if (!exactScope(parsed.canonicalScope, manifest.canonicalScope)
    || !exactRef(parsed.occupancyManifestRef, manifestRef(manifest))
    || parsed.requestedSceneId !== manifest.requestedSceneId
    || parsed.layerOrderBottomToTop.join('|') !== exactLayers.join('|')
    || parsed.qualificationState !== expectedState
    || parsed.accessibleCaptionRegionId !== admittedRegion
    || parsed.creativeCaptionRegionId !== admittedRegion
    || parsed.fallbackRegionIds.join('|')
      !== manifest.provisionalFallbackCandidateRegionIds.join('|')
    || new Set(parsed.fallbackRegionIds).size !== parsed.fallbackRegionIds.length) {
    throw new Error('Caption final visual hierarchy semantics are invalid.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'hierarchyDigestSha256',
    'Caption final visual hierarchy',
  )
  return parsed
}

export function createCaptionFinalVisualHierarchy(input: {
  hierarchyId: string
  occupancyManifest: unknown
}): CaptionFinalVisualHierarchy {
  const manifest = parseCaptionVisualOccupancyManifest(input.occupancyManifest)
  const region = manifest.provisionalSelectedCandidateRegionId
  const qualificationState = manifest.lateFinalVisualHierarchyAllowed
    ? 'ready' as const
    : region === null ? 'blocked_no_safe_region' as const
      : 'blocked_visual_runtime_evidence' as const
  const admittedRegion = qualificationState === 'ready' ? region : null
  const withoutDigest: Omit<CaptionFinalVisualHierarchy, 'hierarchyDigestSha256'> = {
    schemaVersion: CAPTION_FINAL_VISUAL_HIERARCHY_VERSION,
    hierarchyId: safeKey.parse(input.hierarchyId),
    canonicalScope: structuredClone(manifest.canonicalScope),
    occupancyManifestRef: manifestRef(manifest),
    requestedSceneId: manifest.requestedSceneId,
    qualificationState,
    accessibleCaptionRegionId: admittedRegion,
    creativeCaptionRegionId: admittedRegion,
    fallbackRegionIds: [...manifest.provisionalFallbackCandidateRegionIds],
    layerOrderBottomToTop: [
      'base_video', 'living_frame', 'broll_or_graphics', 'foreground_subject_mask',
      'creative_caption', 'accessible_caption',
    ],
    captionAboveLivingFrameByDefault: true,
    accessibleCaptionAboveAllVisuals: true,
    nonTopPlaneCreativeCaptionAdmitted: false,
    trackAllEvidenceRequiredForNonTopPlane: true,
    storyTimingStillRequiredForExecutablePlacement: true,
    finalPlacementClaimed: false,
    finalQaApprovalClaimed: false,
    finalCanvasAuthorityClaimed: false,
    productionAuthorityClaimed: false,
  }
  return parseCaptionFinalVisualHierarchy({
    ...withoutDigest,
    hierarchyDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, hierarchyDigestSha256: '' },
      'hierarchyDigestSha256',
    ),
  }, manifest)
}

export function createCaptionVisualEvidencePacketForContractFixture(input: {
  packetId: string
  payload: unknown
  supportRequest: unknown
  visualIntelligenceReportRef: CaptionVisualIntelligenceEvidencePacket['visualIntelligenceReportRef']
  observations: CaptionVisualIntelligenceEvidencePacket['observations']
  findingIds: string[]
  reportDisposition?: CaptionVisualIntelligenceEvidencePacket['reportDisposition']
}): CaptionVisualIntelligenceEvidencePacket {
  const payload = parseCaptionVisualIntelligenceSupportPayload(input.payload)
  const request = parseSkillSupportRequest(input.supportRequest)
  const withoutDigest: Omit<CaptionVisualIntelligenceEvidencePacket, 'packetDigestSha256'> = {
    schemaVersion: CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION,
    packetId: safeKey.parse(input.packetId),
    supportRequestRef: supportRequestRef(request),
    supportPayloadRef: payloadRef(payload),
    canonicalScope: structuredClone(payload.canonicalScope),
    purpose: payload.purpose,
    sourcePrivateArtifactRef: structuredClone(payload.sourcePrivateArtifactRef),
    canonicalLayoutOccupancyRef: structuredClone(payload.canonicalLayoutOccupancyRef),
    pictureLockRef: structuredClone(payload.pictureLockRef),
    finishReadinessRef: structuredClone(payload.finishReadinessRef),
    confirmedOutputFrameDigestSha256:
      payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
    requestedSceneId: payload.requestedSceneId,
    requestedRange: structuredClone(payload.requestedRange),
    visualIntelligenceContractVersion: 'visual-intelligence-contract-v1',
    visualIntelligenceReportRef: structuredClone(input.visualIntelligenceReportRef),
    authenticatedReadResultRef: null,
    reportOperation: 'inspect_edit',
    reportProfile: 'caption_layout_qa',
    reportDisposition: input.reportDisposition ?? 'pass',
    coverage: {
      requestedRange: structuredClone(payload.requestedRange),
      analyzedRanges: [structuredClone(payload.requestedRange)],
      incompleteRanges: [],
      targetedFollowupRanges: [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    observations: structuredClone(input.observations),
    findingIds: [...input.findingIds],
    evidenceMode: 'contract_fixture',
    canonicalReportRereadVerified: false,
    exactCanonicalScopeVerified: false,
    actualVisualInferenceObserved: false,
    actualRenderedPixelsInspected: false,
    immutableReportReread: false,
    browserLocalStateUsed: false,
    rawProviderPayloadIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    providerCallMadeByCaption: false,
    visualIntelligenceMutatedEdit: false,
    visualIntelligenceGrantedFinalQa: false,
    runtimeAuthorityGrantedToCaption: false,
    assetAuthorityGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionVisualIntelligenceEvidencePacket({
    ...withoutDigest,
    packetDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, packetDigestSha256: '' },
      'packetDigestSha256',
    ),
  }, { payload, supportRequest: request })
}

export function captionVisualExpectedOutcomeRefsMatch(
  payload: CaptionVisualIntelligenceSupportPayload,
  expectedOutcomeRefs: CaptionDomainRef[],
): boolean {
  return exactRefList(payload.expectedOutcomeRefs, expectedOutcomeRefs)
}
