import { z } from 'zod'
import {
  CAPTION_LIVING_FRAME_REQUEST_VERSION,
  LIVING_FRAME_CAPTION_RESPONSE_VERSION,
  type CaptionLivingFrameRequest,
  type LivingFrameCaptionResponse,
} from '../../src/types/caption-living-frame-boundary'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const safeCode = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint < 32 || codePoint === 127
  })
}
const safeSummary = z.string().min(1).max(500)
  .refine((value) => !containsControlCharacter(value))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const baseScopeSchema = z.object({
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
const scopeSchema = baseScopeSchema.extend({ handoffId: safeKey }).strict()
const rectSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
}).strict()
const normalizedRectSchema = rectSchema.superRefine((rect, context) => {
  if (rect.x + rect.width > 10_000 || rect.y + rect.height > 10_000) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Normalized region exceeds frame.' })
  }
})

const requestSchema: z.ZodType<CaptionLivingFrameRequest> = z.object({
  schemaVersion: z.literal(CAPTION_LIVING_FRAME_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  idempotencyKey: safeKey,
  createdForPhase: z.enum(['planning_draft', 'approved_projection']),
  receiverSkillId: z.literal('motion.living_frame_storytelling'),
  canonicalScope: scopeSchema,
  captionPlanRef: refSchema,
  captionProjectionRef: refSchema,
  canonicalTranscript: z.object({
    artifactRef: refSchema,
    language: safeCode,
    sourceSegmentIds: z.array(safeKey).min(1).max(4_096),
    phraseIds: z.array(safeKey).min(1).max(4_096),
    exactSourceWordIds: z.array(safeKey).min(1).max(20_000),
  }).strict(),
  semanticRequest: z.object({
    conceptId: safeKey,
    classification: z.literal('cross_system_transform'),
    purposeCode: safeCode,
    visualVerbCode: safeCode,
    sourcePhraseIds: z.array(safeKey).min(1).max(4_096),
    exactSourceWordIds: z.array(safeKey).min(1).max(20_000),
    sourceOwner: z.literal('caption'),
    intendedTargetOwner: z.literal('living_frame'),
    duplicateConceptAfterSuccessfulTransferAllowed: z.literal(false),
    restoreCaptionOnFailure: z.literal(true),
  }).strict(),
  confirmedFrame: z.object({
    outputId: safeKey,
    width: z.number().int().min(320).max(16_384),
    height: z.number().int().min(180).max(16_384),
    aspectRatioNumerator: z.number().int().positive().max(16_384),
    aspectRatioDenominator: z.number().int().positive().max(16_384),
    confirmedOutputFrameDigestSha256: sha256,
  }).strict(),
  reservation: z.object({
    regions: z.array(z.object({
      regionId: safeKey,
      normalizedBasisPoints: normalizedRectSchema,
      pixelBounds: rectSchema,
    }).strict()).min(1).max(16),
    captionPlanePriority: z.number().int().min(0).max(1_000),
    protectedRegionIds: z.array(safeKey).max(512),
    desiredRange: frameRangeSchema,
    desiredPhraseBoundaryIds: z.array(safeKey).min(1).max(512),
    fallbackRegionIds: z.array(safeKey).max(16),
  }).strict(),
  timing: z.object({
    masterTimingRef: refSchema,
    storyTimingRef: refSchema,
    eventRefs: z.array(refSchema).min(1).max(512),
    cueRefs: z.array(refSchema).max(512),
    semanticStartIntent: safeCode,
    semanticHitIntent: safeCode,
    semanticHoldIntent: safeCode,
    semanticExitIntent: safeCode,
    finalLivingFrameFramesManufacturedByCaption: z.literal(false),
  }).strict(),
  style: z.object({
    captionStyleProfileRef: refSchema,
    approvedSemanticColorTokenRefs: z.array(refSchema).max(64),
    motionIntentCode: safeCode,
    reducedMotionIntentCode: safeCode,
  }).strict(),
  dependencies: z.object({
    layoutOccupancyManifestRef: refSchema,
    visualAssetExpectationRefs: z.array(refSchema).max(512),
    depthExpectationRefs: z.array(refSchema).max(512),
    maskExpectationRefs: z.array(refSchema).max(512),
    livingFrameComponentVersionExpected: safeKey,
    captionComponentVersion: safeKey,
  }).strict(),
  estimateInputs: z.object({
    requestedComplexityCeiling: z.enum(['restrained', 'moderate', 'expressive']),
    premiumOperationPermissionExpected: z.boolean(),
    lowerCostFallbackPreferred: z.boolean(),
    billingAuthorityClaimed: z.literal(false),
  }).strict(),
  fallbackLadder: z.array(safeCode).min(1).max(16),
  qaExpectationCodes: z.array(safeCode).min(1).max(64),
  accessibility: z.object({
    completeCaptionCounterpartRetained: z.literal(true),
    reducedMotionRequired: z.boolean(),
  }).strict(),
  documentaryFactSafetyRefs: z.array(refSchema).max(512),
  privateArtifactPolicy: z.object({
    tenantScoped: z.literal(true),
    retentionClass: safeCode,
    accessClass: safeCode,
    byteFreeRequest: z.literal(true),
    replayPolicyCode: safeCode,
    stalenessRefs: z.array(refSchema).min(1).max(1_024),
    rawChatIncluded: z.literal(false),
    mediaBytesIncluded: z.literal(false),
    urlsOrPathsIncluded: z.literal(false),
    credentialsIncluded: z.literal(false),
    executablePromptTextIncluded: z.literal(false),
  }).strict(),
  operationRegistered: z.literal(false),
  dispatchGranted: z.literal(false),
  runtimeAuthority: z.literal(false),
  assetCreated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryCreated: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const responseSchema: z.ZodType<LivingFrameCaptionResponse> = z.object({
  schemaVersion: z.literal(LIVING_FRAME_CAPTION_RESPONSE_VERSION),
  responseId: safeKey,
  responseDigestSha256: sha256,
  originalRequestRef: refSchema,
  originalRequestIdempotencyKey: safeKey,
  canonicalScope: scopeSchema,
  disposition: z.enum([
    'supported_selected', 'supported_simpler_treatment', 'declined_not_applicable',
    'declined_caption_or_speaker_priority', 'blocked_stale_authority',
    'blocked_missing_canonical_authority',
  ]),
  reasonCode: safeCode,
  safeUserSummary: safeSummary,
  livingFrameComponentRef: refSchema,
  semanticProjectionRef: refSchema,
  selectedScene: z.object({
    admissionRef: refSchema.nullable(),
    bindingRef: refSchema.nullable(),
    selectedSceneIds: z.array(safeKey).max(64),
    selectedModes: z.array(safeCode).max(64),
    selectedTreatments: z.array(safeCode).max(64),
    deliberateNonUse: z.boolean(),
    executionClaimed: z.literal(false),
  }).strict(),
  informationOwnerHandoff: z.object({
    state: z.enum(['retained_by_caption', 'requested', 'accepted', 'restored_to_caption']),
    attentionEventIds: z.array(safeKey).max(512),
    semanticTimingRequestIds: z.array(safeKey).max(512),
  }).strict(),
  timing: z.object({
    masterTimingRef: refSchema,
    storyTimingEventRefs: z.array(refSchema).max(512),
    storyTimingCueRefs: z.array(refSchema).max(512),
    livingFrameTimingBindingRef: refSchema.nullable(),
    parallelClockCreated: z.literal(false),
  }).strict(),
  layoutDependencies: z.object({
    occupancyRegionRefs: z.array(refSchema).max(512),
    captionSafeExpectationRefs: z.array(refSchema).max(512),
    faceGestureProtectionRefs: z.array(refSchema).max(512),
    depthBandRefs: z.array(refSchema).max(512),
    occlusionExpectationRefs: z.array(refSchema).max(512),
    maskArtifactRefs: z.array(refSchema).max(512),
    unresolvedGateCodes: z.array(safeCode).max(512),
    captionPlaneAboveLivingFrame: z.literal(true),
  }).strict(),
  estimateProjectionRef: refSchema.nullable(),
  requiredCapabilityCategories: z.array(safeCode).max(128),
  requiredWorkCategories: z.array(safeCode).max(128),
  selectedFallbackCode: safeCode,
  captionRetainsOrRegainsInformationOwnership: z.boolean(),
  qaEvidenceRequirementCodes: z.array(safeCode).min(1).max(128),
  stalenessTuple: z.object({
    transcriptRef: refSchema,
    captionPlanRef: refSchema,
    confirmedFrameRef: refSchema,
    layoutOccupancyRef: refSchema,
    masterTimingRef: refSchema,
    livingFrameComponentRef: refSchema,
    selectedSceneBindingRef: refSchema.nullable(),
    approvedSnapshotRef: refSchema.nullable(),
  }).strict(),
  operationRegistered: z.literal(false),
  dispatchGranted: z.literal(false),
  providerAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  assetCreated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryCreated: z.literal(false),
  productionReady: z.literal(false),
}).strict()

function refKey(ref: { id: string; version: string; contentHash: string }): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function scopeKey(scope: CaptionLivingFrameRequest['canonicalScope']): string {
  return calculateSkillContractDigest({ scope, digest: '' }, 'digest')
}

function verifyDigest(value: Record<string, unknown>, field: string, label: string): void {
  if (calculateSkillContractDigest(value, field) !== value[field]) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length
}

function containsRange(
  outer: { startFrame: number; endFrameExclusive: number },
  inner: { startFrame: number; endFrameExclusive: number },
): boolean {
  return inner.startFrame >= outer.startFrame
    && inner.endFrameExclusive <= outer.endFrameExclusive
}

function exactNullableRef(
  left: { id: string; version: string; contentHash: string } | null,
  right: { id: string; version: string; contentHash: string } | null,
): boolean {
  return left === null || right === null ? left === right : refKey(left) === refKey(right)
}

export function parseCaptionLivingFrameRequest(value: unknown): CaptionLivingFrameRequest {
  assertClosedContractTree(value, 'Caption Living Frame request')
  const request = requestSchema.parse(value)
  if (request.confirmedFrame.outputId !== request.canonicalScope.outputId
    || request.confirmedFrame.width * request.confirmedFrame.aspectRatioDenominator
      !== request.confirmedFrame.height * request.confirmedFrame.aspectRatioNumerator
    || !unique(request.canonicalTranscript.sourceSegmentIds)
    || !unique(request.canonicalTranscript.phraseIds)
    || !unique(request.canonicalTranscript.exactSourceWordIds)
    || request.semanticRequest.sourcePhraseIds.some((id) =>
      !request.canonicalTranscript.phraseIds.includes(id))
    || request.semanticRequest.exactSourceWordIds.some((id) =>
      !request.canonicalTranscript.exactSourceWordIds.includes(id))
    || !request.canonicalScope.authorizedFrameRanges.some((range) =>
      containsRange(range, request.reservation.desiredRange))
    || request.createdForPhase === 'approved_projection'
      && request.canonicalScope.approvedSnapshotRef === null) {
    throw new Error('Caption Living Frame request lineage or confirmed frame is invalid.')
  }
  for (const region of request.reservation.regions) {
    const normalized = region.normalizedBasisPoints
    const pixels = region.pixelBounds
    if (pixels.x + pixels.width > request.confirmedFrame.width
      || pixels.y + pixels.height > request.confirmedFrame.height
      || Math.abs(pixels.x * 10_000 - normalized.x * request.confirmedFrame.width) > 10_000
      || Math.abs(pixels.y * 10_000 - normalized.y * request.confirmedFrame.height) > 10_000
      || Math.abs(pixels.width * 10_000
        - normalized.width * request.confirmedFrame.width) > 10_000
      || Math.abs(pixels.height * 10_000
        - normalized.height * request.confirmedFrame.height) > 10_000) {
      throw new Error('Caption Living Frame reservation does not match the confirmed frame.')
    }
  }
  verifyDigest(request as unknown as Record<string, unknown>, 'requestDigestSha256',
    'Caption Living Frame request')
  return request
}

export function parseLivingFrameCaptionResponse(
  value: unknown,
  requestValue: unknown,
): LivingFrameCaptionResponse {
  assertClosedContractTree(value, 'Living Frame Caption response')
  const request = parseCaptionLivingFrameRequest(requestValue)
  const response = responseSchema.parse(value)
  const selected = response.selectedScene
  if (scopeKey(response.canonicalScope) !== scopeKey(request.canonicalScope)
    || response.originalRequestRef.id !== request.requestId
    || response.originalRequestRef.version !== request.schemaVersion
    || response.originalRequestRef.contentHash !== request.requestDigestSha256
    || response.originalRequestIdempotencyKey !== request.idempotencyKey
    || refKey(response.timing.masterTimingRef) !== refKey(request.timing.masterTimingRef)
    || refKey(response.stalenessTuple.transcriptRef)
      !== refKey(request.canonicalTranscript.artifactRef)
    || refKey(response.stalenessTuple.captionPlanRef) !== refKey(request.captionPlanRef)
    || response.stalenessTuple.confirmedFrameRef.contentHash
      !== request.confirmedFrame.confirmedOutputFrameDigestSha256
    || refKey(response.stalenessTuple.layoutOccupancyRef)
      !== refKey(request.dependencies.layoutOccupancyManifestRef)
    || refKey(response.stalenessTuple.masterTimingRef) !== refKey(request.timing.masterTimingRef)
    || refKey(response.stalenessTuple.livingFrameComponentRef)
      !== refKey(response.livingFrameComponentRef)
    || !exactNullableRef(response.stalenessTuple.approvedSnapshotRef,
      request.canonicalScope.approvedSnapshotRef)
    || selected.selectedSceneIds.length !== selected.selectedModes.length
    || selected.selectedSceneIds.length !== selected.selectedTreatments.length
    || !unique(selected.selectedSceneIds)
    || (selected.deliberateNonUse !== (selected.selectedSceneIds.length === 0))
    || (response.disposition.startsWith('supported_') && selected.selectedSceneIds.length === 0)
    || (!response.disposition.startsWith('supported_') && selected.selectedSceneIds.length > 0)
    || (response.informationOwnerHandoff.state === 'accepted'
      && !response.captionRetainsOrRegainsInformationOwnership
      && response.informationOwnerHandoff.attentionEventIds.length < 2)) {
    throw new Error('Living Frame Caption response does not bind the exact request.')
  }
  verifyDigest(response as unknown as Record<string, unknown>, 'responseDigestSha256',
    'Living Frame Caption response')
  return response
}
