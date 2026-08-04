import { z } from 'zod'
import {
  CAPTION_TRACK_ALL_ADMISSION_VERSION,
  CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION,
  CAPTION_TRACK_ALL_SUPPORT_PAYLOAD_VERSION,
  type CaptionTrackAllAdmission,
  type CaptionTrackAllEvidencePacket,
  type CaptionTrackAllPurpose,
  type CaptionTrackAllSubjectEvidence,
  type CaptionTrackAllSupportBundle,
  type CaptionTrackAllSupportPayload,
} from '../../src/types/caption-track-all-support'
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
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from './captions-specialist-runtime'

const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Track All range has no duration.' })
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
const purposeSchema = z.enum([
  'subject_occlusion', 'object_anchor', 'environmental_anchor',
])
const subjectRoleSchema = z.enum([
  'primary_speaker', 'secondary_speaker', 'hand', 'product',
  'important_object', 'environmental_surface',
])
const refinementOperationSchema = z.enum([
  'morphological_cleanup', 'hole_fill', 'edge_feather_measurement',
  'temporal_median_check', 'connected_component_filter',
])
const qaThresholdSchema = z.object({
  minimumBinaryIntersectionOverUnionBasisPoints: z.number().int().min(0).max(10_000),
  maximumNormalizedCentroidShiftBasisPoints: z.number().int().min(0).max(10_000),
  maximumBoundaryDisagreementBasisPoints: z.number().int().min(0).max(10_000),
  maximumAlphaFlickerBasisPoints: z.number().int().min(0).max(10_000),
  minimumEdgeQualityBasisPoints: z.number().int().min(0).max(10_000),
  minimumSubjectCoverageBasisPoints: z.number().int().min(0).max(10_000),
  emptyMaskFrameCountAllowed: z.literal(0),
  fullFrameMaskCountAllowed: z.literal(0),
  identitySwapCountAllowed: z.literal(0),
  lostAnchorFrameCountAllowed: z.literal(0),
}).strict()
const supportPayloadSchema: z.ZodType<CaptionTrackAllSupportPayload> = z.object({
  schemaVersion: z.literal(CAPTION_TRACK_ALL_SUPPORT_PAYLOAD_VERSION),
  payloadId: safeKey,
  payloadDigestSha256: sha256,
  purpose: purposeSchema,
  canonicalScope: scopeSchema,
  pictureLockRef: refSchema,
  finishReadinessRef: refSchema,
  visualOccupancyManifestRef: refSchema,
  confirmedOutputFrameDigestSha256: sha256,
  sourcePrivateArtifactRef: refSchema,
  sourceFrameMappingRef: refSchema,
  requestedSceneId: safeKey,
  requestedRange: frameRangeSchema,
  subjectRequests: z.array(z.object({
    subjectRequestId: safeKey,
    subjectRole: subjectRoleSchema,
    visualObservationRefs: z.array(refSchema).min(1).max(512),
    sourcePhraseRefs: z.array(refSchema).min(1).max(512),
    maskRequired: z.boolean(),
    trackRequired: z.literal(true),
    anchorRequired: z.boolean(),
    preserveHairAndFineEdges: z.boolean(),
    preserveContactObjects: z.boolean(),
  }).strict()).min(1).max(16),
  depthIntent: z.enum([
    'behind_subject', 'in_front_of_subject', 'object_attached',
    'environmental_surface',
  ]),
  qaThresholds: qaThresholdSchema,
  refinementPolicy: z.object({
    opencvMaskQaRequired: z.literal(true),
    korniaRefinementAllowed: z.boolean(),
    korniaCannotReplacePrimarySegmentation: z.literal(true),
    deterministicOperations: z.array(refinementOperationSchema).min(1).max(5),
  }).strict(),
  cachePolicy: z.object({
    cacheIdentityDigestSha256: sha256,
    exactSourceRangeSubjectFrameAndPolicyBound: z.literal(true),
    crossSceneReuseAllowed: z.literal(false),
    crossOutputReuseAllowed: z.literal(false),
    staleReuseAllowed: z.literal(false),
  }).strict(),
  fallbackLadder: z.tuple([
    z.literal('retry_track_all_same_approved_input'),
    z.literal('opencv_kornia_refine'),
    z.literal('safe_top_plane'),
    z.literal('stable_libass'),
    z.literal('user_review'),
  ]),
  expectedArtifactTypes: z.array(z.enum([
    'mask_sequence', 'track_manifest', 'anchor_manifest',
  ])).min(1).max(3),
  byteFreeRequest: z.literal(true),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  modelPromptIncluded: z.literal(false),
  providerCredentialIncluded: z.literal(false),
  samRuntimeSelectedOrDispatchedByCaption: z.literal(false),
  directPeerDispatchRequested: z.literal(false),
  trackAllRemainsArtifactOwner: z.literal(true),
}).strict()
const temporalQaSchema = z.object({
  measuredFrameCount: z.number().int().positive(),
  expectedFrameCount: z.number().int().positive(),
  emptyMaskFrameCount: z.number().int().nonnegative(),
  fullFrameMaskCount: z.number().int().nonnegative(),
  minimumBinaryIntersectionOverUnionBasisPoints: z.number().int().min(0).max(10_000),
  maximumNormalizedCentroidShiftBasisPoints: z.number().int().min(0).max(10_000),
  maximumBoundaryDisagreementBasisPoints: z.number().int().min(0).max(10_000),
  maximumAlphaFlickerBasisPoints: z.number().int().min(0).max(10_000),
  minimumEdgeQualityBasisPoints: z.number().int().min(0).max(10_000),
  minimumSubjectCoverageBasisPoints: z.number().int().min(0).max(10_000),
  identitySwapCount: z.number().int().nonnegative(),
  lostAnchorFrameCount: z.number().int().nonnegative(),
  completeRequestedRangeCoverage: z.boolean(),
}).strict()
const subjectEvidenceSchema: z.ZodType<CaptionTrackAllSubjectEvidence> = z.object({
  subjectRequestId: safeKey,
  subjectEvidenceId: safeKey,
  subjectRole: subjectRoleSchema,
  frameRange: frameRangeSchema,
  maskSequenceRef: refSchema.nullable(),
  trackManifestRef: refSchema,
  anchorManifestRef: refSchema.nullable(),
  sourceFrameMappingRef: refSchema,
  outputFrameDigestSha256: sha256,
  temporalQa: temporalQaSchema,
  refinementEvidence: z.array(z.object({
    refinementId: safeKey,
    tool: z.enum(['opencv', 'kornia']),
    operation: refinementOperationSchema,
    inputArtifactRef: refSchema,
    outputArtifactRef: refSchema,
    executionEvidenceRef: refSchema,
    actualExecutionObserved: z.boolean(),
  }).strict()).max(64),
  evidenceRefs: z.array(refSchema).min(1).max(512),
}).strict()
const packetSchema: z.ZodType<CaptionTrackAllEvidencePacket> = z.object({
  schemaVersion: z.literal(CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION),
  packetId: safeKey,
  packetDigestSha256: sha256,
  supportRequestRef: refSchema,
  supportPayloadRef: refSchema,
  canonicalScope: scopeSchema,
  purpose: purposeSchema,
  pictureLockRef: refSchema,
  finishReadinessRef: refSchema,
  visualOccupancyManifestRef: refSchema,
  sourcePrivateArtifactRef: refSchema,
  sourceFrameMappingRef: refSchema,
  confirmedOutputFrameDigestSha256: sha256,
  requestedSceneId: safeKey,
  requestedRange: frameRangeSchema,
  producerSkillKey: z.literal('track_all'),
  selectedSegmentationRoute: z.literal('sam3_1'),
  canonicalSam31OperationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  trackAllResultRef: refSchema,
  authenticatedReadResultRef: refSchema.nullable(),
  canonicalSam31RuntimeResultAdmissionRef: refSchema.nullable(),
  subjectEvidence: z.array(subjectEvidenceSchema).min(1).max(16),
  cache: z.object({
    cacheIdentityDigestSha256: sha256,
    disposition: z.enum(['new_result', 'exact_cache_reuse']),
    originalResultRef: refSchema.nullable(),
    exactSourceRangeSubjectFrameAndPolicyMatch: z.boolean(),
    staleArtifactReused: z.literal(false),
  }).strict(),
  evidenceMode: z.enum(['contract_fixture', 'authenticated_private_runtime']),
  exactCanonicalScopeReread: z.boolean(),
  exactPrivateArtifactsReread: z.boolean(),
  exactSam31ResultLineageVerified: z.boolean(),
  actualSam31GpuExecutionObserved: z.boolean(),
  actualOpenCvExecutionObserved: z.boolean(),
  actualKorniaExecutionObserved: z.boolean(),
  independentMaskArtifactQaCompleted: z.boolean(),
  privateVisualReviewCompleted: z.boolean(),
  browserLocalStateUsed: z.literal(false),
  rawMaskBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  providerCredentialIncluded: z.literal(false),
  runtimeOrDispatchAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const admissionSchema: z.ZodType<CaptionTrackAllAdmission> = z.object({
  schemaVersion: z.literal(CAPTION_TRACK_ALL_ADMISSION_VERSION),
  admissionId: safeKey,
  admissionDigestSha256: sha256,
  canonicalScope: scopeSchema,
  supportRequestRef: refSchema,
  evidencePacketRef: refSchema,
  requestedSceneId: safeKey,
  subjectAdmissions: z.array(z.object({
    subjectRequestId: safeKey,
    subjectEvidenceId: safeKey,
    qaPassed: z.boolean(),
    maskSequenceRef: refSchema.nullable(),
    trackManifestRef: refSchema,
    anchorManifestRef: refSchema.nullable(),
    blockerCodes: z.array(safeKey).max(64),
  }).strict()).min(1).max(16),
  disposition: z.enum([
    'admitted_for_caption_scene_graph', 'blocked_private_runtime_evidence',
    'blocked_temporal_qa',
  ]),
  textBehindSubjectAllowed: z.boolean(),
  objectAnchorAllowed: z.boolean(),
  selectedFallback: z.enum(['none', 'safe_top_plane', 'stable_libass', 'user_review']),
  cacheReuseAccepted: z.boolean(),
  trackAllRemainsArtifactOwner: z.literal(true),
  sam31RemainsCanonicalRuntimeOwner: z.literal(true),
  captionExecutedSam31: z.literal(false),
  captionSelectedGpuRoute: z.literal(false),
  captionCreatedMaskAsset: z.literal(false),
  captionGrantedFinalQa: z.literal(false),
  finalCanvasAuthorityClaimed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()

const DEFAULT_QA_THRESHOLDS: CaptionTrackAllSupportPayload['qaThresholds'] = {
  minimumBinaryIntersectionOverUnionBasisPoints: 7_000,
  maximumNormalizedCentroidShiftBasisPoints: 800,
  maximumBoundaryDisagreementBasisPoints: 1_200,
  maximumAlphaFlickerBasisPoints: 1_000,
  minimumEdgeQualityBasisPoints: 8_000,
  minimumSubjectCoverageBasisPoints: 9_500,
  emptyMaskFrameCountAllowed: 0,
  fullFrameMaskCountAllowed: 0,
  identitySwapCountAllowed: 0,
  lostAnchorFrameCountAllowed: 0,
}

function refKey(ref: { id: string; version: string; contentHash: string }): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function exactRef(left: CaptionDomainRef | null, right: CaptionDomainRef | null): boolean {
  return left === null || right === null ? left === right : refKey(left) === refKey(right)
}

function exactRange(
  left: { startFrame: number; endFrameExclusive: number },
  right: { startFrame: number; endFrameExclusive: number },
): boolean {
  return left.startFrame === right.startFrame
    && left.endFrameExclusive === right.endFrameExclusive
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

function verifyDigest(value: Record<string, unknown>, field: string, label: string): void {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function payloadRef(payload: CaptionTrackAllSupportPayload): CaptionDomainRef {
  return { id: payload.payloadId, version: payload.schemaVersion, contentHash: payload.payloadDigestSha256 }
}

function requestRef(request: SkillSupportRequest): SkillContractRef {
  return { id: request.requestId, version: request.schemaVersion, contentHash: request.requestDigestSha256 }
}

function packetRef(packet: CaptionTrackAllEvidencePacket): CaptionDomainRef {
  return { id: packet.packetId, version: packet.schemaVersion, contentHash: packet.packetDigestSha256 }
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

function supportScopeMatches(scope: SkillCanonicalScope, payload: CaptionTrackAllSupportPayload): boolean {
  const expected = skillScope(payload.canonicalScope)
  return scope.ownerUserId === expected.ownerUserId
    && scope.workspaceId === expected.workspaceId
    && scope.projectId === expected.projectId
    && scope.editSessionId === expected.editSessionId
    && exactRef(scope.approvedSnapshotRef, expected.approvedSnapshotRef)
    && scope.outputId === expected.outputId
    && scope.sceneId === expected.sceneId
    && JSON.stringify(scope.authorizedFrameRanges) === JSON.stringify(expected.authorizedFrameRanges)
}

function expectedDepthIntent(purpose: CaptionTrackAllPurpose): CaptionTrackAllSupportPayload['depthIntent'] {
  if (purpose === 'subject_occlusion') return 'behind_subject'
  if (purpose === 'object_anchor') return 'object_attached'
  return 'environmental_surface'
}

function expectedArtifacts(payload: Pick<CaptionTrackAllSupportPayload, 'subjectRequests'>): CaptionTrackAllSupportPayload['expectedArtifactTypes'] {
  return [
    ...(payload.subjectRequests.some((subject) => subject.maskRequired)
      ? ['mask_sequence' as const] : []),
    'track_manifest' as const,
    ...(payload.subjectRequests.some((subject) => subject.anchorRequired)
      ? ['anchor_manifest' as const] : []),
  ]
}

export function parseCaptionTrackAllSupportPayload(value: unknown): CaptionTrackAllSupportPayload {
  assertClosedContractTree(value, 'Caption Track All support payload')
  const parsed = supportPayloadSchema.parse(value)
  const subjects = new Set(parsed.subjectRequests.map((subject) => subject.subjectRequestId))
  const cacheIdentity = calculateSkillContractDigest({
    purpose: parsed.purpose,
    canonicalScope: parsed.canonicalScope,
    sourcePrivateArtifactRef: parsed.sourcePrivateArtifactRef,
    sourceFrameMappingRef: parsed.sourceFrameMappingRef,
    confirmedOutputFrameDigestSha256: parsed.confirmedOutputFrameDigestSha256,
    requestedRange: parsed.requestedRange,
    subjectRequests: parsed.subjectRequests,
    qaThresholds: parsed.qaThresholds,
    refinementPolicy: parsed.refinementPolicy,
  }, 'cacheIdentityDigestSha256')
  if (parsed.canonicalScope.approvedSnapshotRef === null
    || parsed.canonicalScope.sceneId !== parsed.requestedSceneId
    || parsed.canonicalScope.authorizedFrameRanges.length !== 1
    || !exactRange(parsed.canonicalScope.authorizedFrameRanges[0]!, parsed.requestedRange)
    || subjects.size !== parsed.subjectRequests.length
    || parsed.subjectRequests.some((subject) =>
      new Set(subject.visualObservationRefs.map(refKey)).size
        !== subject.visualObservationRefs.length
      || new Set(subject.sourcePhraseRefs.map(refKey)).size
        !== subject.sourcePhraseRefs.length)
    || parsed.depthIntent !== expectedDepthIntent(parsed.purpose)
    || (parsed.purpose === 'subject_occlusion'
      && parsed.subjectRequests.some((subject) => !subject.maskRequired))
    || (parsed.purpose !== 'subject_occlusion'
      && parsed.subjectRequests.some((subject) => !subject.anchorRequired))
    || new Set(parsed.refinementPolicy.deterministicOperations).size
      !== parsed.refinementPolicy.deterministicOperations.length
    || parsed.cachePolicy.cacheIdentityDigestSha256 !== cacheIdentity
    || parsed.expectedArtifactTypes.join('|') !== expectedArtifacts(parsed).join('|')) {
    throw new Error('Caption Track All request scope, cache, or requirements are invalid.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'payloadDigestSha256',
    'Caption Track All support payload',
  )
  return parsed
}

export function createCaptionTrackAllSupport(input: {
  payloadId: string
  requestId: string
  idempotencyKey: string
  originalCallRef: SkillContractRef
  purpose: CaptionTrackAllPurpose
  canonicalScope: CaptionDomainCanonicalScope
  pictureLockRef: CaptionDomainRef
  finishReadinessRef: CaptionDomainRef
  visualOccupancyManifestRef: CaptionDomainRef
  confirmedOutputFrameDigestSha256: string
  sourcePrivateArtifactRef: CaptionDomainRef
  sourceFrameMappingRef: CaptionDomainRef
  subjectRequests: CaptionTrackAllSupportPayload['subjectRequests']
  korniaRefinementAllowed: boolean
}): CaptionTrackAllSupportBundle {
  assertClosedContractTree(input, 'Caption Track All support input')
  if (input.canonicalScope.sceneId === null
    || input.canonicalScope.authorizedFrameRanges.length !== 1) {
    throw new Error('Caption Track All support requires one exact scene range.')
  }
  const refinementPolicy = {
    opencvMaskQaRequired: true as const,
    korniaRefinementAllowed: input.korniaRefinementAllowed,
    korniaCannotReplacePrimarySegmentation: true as const,
    deterministicOperations: [
      'morphological_cleanup', 'hole_fill', 'edge_feather_measurement',
      'temporal_median_check', 'connected_component_filter',
    ] as CaptionTrackAllSupportPayload['refinementPolicy']['deterministicOperations'],
  }
  const requestedRange = input.canonicalScope.authorizedFrameRanges[0]!
  const cachePolicyWithoutDigest = {
    purpose: input.purpose,
    canonicalScope: input.canonicalScope,
    sourcePrivateArtifactRef: input.sourcePrivateArtifactRef,
    sourceFrameMappingRef: input.sourceFrameMappingRef,
    confirmedOutputFrameDigestSha256: input.confirmedOutputFrameDigestSha256,
    requestedRange,
    subjectRequests: input.subjectRequests,
    qaThresholds: DEFAULT_QA_THRESHOLDS,
    refinementPolicy,
  }
  const withoutDigest: Omit<CaptionTrackAllSupportPayload, 'payloadDigestSha256'> = {
    schemaVersion: CAPTION_TRACK_ALL_SUPPORT_PAYLOAD_VERSION,
    payloadId: safeKey.parse(input.payloadId),
    purpose: input.purpose,
    canonicalScope: structuredClone(input.canonicalScope),
    pictureLockRef: structuredClone(input.pictureLockRef),
    finishReadinessRef: structuredClone(input.finishReadinessRef),
    visualOccupancyManifestRef: structuredClone(input.visualOccupancyManifestRef),
    confirmedOutputFrameDigestSha256: sha256.parse(input.confirmedOutputFrameDigestSha256),
    sourcePrivateArtifactRef: structuredClone(input.sourcePrivateArtifactRef),
    sourceFrameMappingRef: structuredClone(input.sourceFrameMappingRef),
    requestedSceneId: input.canonicalScope.sceneId,
    requestedRange: structuredClone(requestedRange),
    subjectRequests: structuredClone(input.subjectRequests),
    depthIntent: expectedDepthIntent(input.purpose),
    qaThresholds: { ...DEFAULT_QA_THRESHOLDS },
    refinementPolicy,
    cachePolicy: {
      cacheIdentityDigestSha256: calculateSkillContractDigest(
        { ...cachePolicyWithoutDigest, cacheIdentityDigestSha256: '' },
        'cacheIdentityDigestSha256',
      ),
      exactSourceRangeSubjectFrameAndPolicyBound: true,
      crossSceneReuseAllowed: false,
      crossOutputReuseAllowed: false,
      staleReuseAllowed: false,
    },
    fallbackLadder: [
      'retry_track_all_same_approved_input', 'opencv_kornia_refine',
      'safe_top_plane', 'stable_libass', 'user_review',
    ],
    expectedArtifactTypes: expectedArtifacts({ subjectRequests: input.subjectRequests }),
    byteFreeRequest: true,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    modelPromptIncluded: false,
    providerCredentialIncluded: false,
    samRuntimeSelectedOrDispatchedByCaption: false,
    directPeerDispatchRequested: false,
    trackAllRemainsArtifactOwner: true,
  }
  const payload = parseCaptionTrackAllSupportPayload({
    ...withoutDigest,
    payloadDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, payloadDigestSha256: '' },
      'payloadDigestSha256',
    ),
  })
  const requestWithoutDigest: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: safeKey.parse(input.requestId),
    originalCallRef: refSchema.parse(input.originalCallRef),
    requestingSkillKey: 'captions',
    targetSkillKey: 'track_all',
    reasonCode: `caption_track_all.${payload.purpose}.required`,
    requestedArtifactTypes: ['track_all_mask_binding'],
    canonicalScope: skillScope(payload.canonicalScope),
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
    ...requestWithoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      { ...requestWithoutDigest, requestDigestSha256: '' },
      'requestDigestSha256',
    ),
  })
  return { payload, supportRequest }
}

function subjectQa(input: {
  subject: CaptionTrackAllSubjectEvidence
  request: CaptionTrackAllSupportPayload['subjectRequests'][number]
  thresholds: CaptionTrackAllSupportPayload['qaThresholds']
}): { passed: boolean; blockers: string[] } {
  const { subject, request, thresholds } = input
  const qa = subject.temporalQa
  const blockers = [
    ...(subject.frameRange.endFrameExclusive - subject.frameRange.startFrame
        !== qa.expectedFrameCount || qa.measuredFrameCount !== qa.expectedFrameCount
      ? ['caption_track_all.frame_count_mismatch'] : []),
    ...(!qa.completeRequestedRangeCoverage
      ? ['caption_track_all.incomplete_range_coverage'] : []),
    ...(qa.emptyMaskFrameCount > thresholds.emptyMaskFrameCountAllowed
      ? ['caption_track_all.empty_mask_frame'] : []),
    ...(qa.fullFrameMaskCount > thresholds.fullFrameMaskCountAllowed
      ? ['caption_track_all.full_frame_mask'] : []),
    ...(qa.minimumBinaryIntersectionOverUnionBasisPoints
        < thresholds.minimumBinaryIntersectionOverUnionBasisPoints
      ? ['caption_track_all.mask_overlap_low'] : []),
    ...(qa.maximumNormalizedCentroidShiftBasisPoints
        > thresholds.maximumNormalizedCentroidShiftBasisPoints
      ? ['caption_track_all.centroid_jitter_high'] : []),
    ...(qa.maximumBoundaryDisagreementBasisPoints
        > thresholds.maximumBoundaryDisagreementBasisPoints
      ? ['caption_track_all.boundary_disagreement_high'] : []),
    ...(qa.maximumAlphaFlickerBasisPoints > thresholds.maximumAlphaFlickerBasisPoints
      ? ['caption_track_all.alpha_flicker_high'] : []),
    ...(qa.minimumEdgeQualityBasisPoints < thresholds.minimumEdgeQualityBasisPoints
      ? ['caption_track_all.edge_quality_low'] : []),
    ...(qa.minimumSubjectCoverageBasisPoints < thresholds.minimumSubjectCoverageBasisPoints
      ? ['caption_track_all.subject_coverage_low'] : []),
    ...(qa.identitySwapCount > thresholds.identitySwapCountAllowed
      ? ['caption_track_all.identity_swap'] : []),
    ...(qa.lostAnchorFrameCount > thresholds.lostAnchorFrameCountAllowed
      ? ['caption_track_all.anchor_lost'] : []),
    ...(request.maskRequired && subject.maskSequenceRef === null
      ? ['caption_track_all.mask_missing'] : []),
    ...(request.anchorRequired && subject.anchorManifestRef === null
      ? ['caption_track_all.anchor_missing'] : []),
  ]
  return { passed: blockers.length === 0, blockers }
}

export function parseCaptionTrackAllEvidencePacket(
  value: unknown,
  input: { payload: unknown; supportRequest: unknown },
): CaptionTrackAllEvidencePacket {
  assertClosedContractTree(value, 'Caption Track All evidence packet')
  const payload = parseCaptionTrackAllSupportPayload(input.payload)
  const request = parseSkillSupportRequest(input.supportRequest)
  const embeddedPayload = parseCaptionTrackAllSupportPayload(request.typedPayload)
  const parsed = packetSchema.parse(value)
  const fixture = parsed.evidenceMode === 'contract_fixture'
  const requestById = new Map(payload.subjectRequests.map((item) => [item.subjectRequestId, item]))
  const subjectIds = new Set(parsed.subjectEvidence.map((item) => item.subjectRequestId))
  const evidenceIds = new Set(parsed.subjectEvidence.map((item) => item.subjectEvidenceId))
  const anyKornia = parsed.subjectEvidence.some((subject) =>
    subject.refinementEvidence.some((refinement) => refinement.tool === 'kornia'))
  if (request.requestingSkillKey !== 'captions'
    || request.targetSkillKey !== 'track_all'
    || request.reasonCode !== `caption_track_all.${payload.purpose}.required`
    || request.requestedArtifactTypes.join('|') !== 'track_all_mask_binding'
    || request.typedPayloadType !== payload.schemaVersion
    || !exactRef(payloadRef(embeddedPayload), payloadRef(payload))
    || !supportScopeMatches(request.canonicalScope, payload)
    || !exactRef(parsed.supportRequestRef, requestRef(request))
    || !exactRef(parsed.supportPayloadRef, payloadRef(payload))
    || !exactScope(parsed.canonicalScope, payload.canonicalScope)
    || parsed.purpose !== payload.purpose
    || !exactRef(parsed.pictureLockRef, payload.pictureLockRef)
    || !exactRef(parsed.finishReadinessRef, payload.finishReadinessRef)
    || !exactRef(parsed.visualOccupancyManifestRef, payload.visualOccupancyManifestRef)
    || !exactRef(parsed.sourcePrivateArtifactRef, payload.sourcePrivateArtifactRef)
    || !exactRef(parsed.sourceFrameMappingRef, payload.sourceFrameMappingRef)
    || parsed.confirmedOutputFrameDigestSha256 !== payload.confirmedOutputFrameDigestSha256
    || parsed.requestedSceneId !== payload.requestedSceneId
    || !exactRange(parsed.requestedRange, payload.requestedRange)
    || subjectIds.size !== parsed.subjectEvidence.length
    || evidenceIds.size !== parsed.subjectEvidence.length
    || subjectIds.size !== payload.subjectRequests.length
    || payload.subjectRequests.some((item) => !subjectIds.has(item.subjectRequestId))
    || parsed.subjectEvidence.some((subject) => {
      const expected = requestById.get(subject.subjectRequestId)
      return !expected
        || subject.subjectRole !== expected.subjectRole
        || !exactRange(subject.frameRange, payload.requestedRange)
        || !exactRef(subject.sourceFrameMappingRef, payload.sourceFrameMappingRef)
        || subject.outputFrameDigestSha256 !== payload.confirmedOutputFrameDigestSha256
        || (expected.maskRequired !== (subject.maskSequenceRef !== null))
        || (expected.anchorRequired !== (subject.anchorManifestRef !== null))
        || new Set(subject.evidenceRefs.map(refKey)).size !== subject.evidenceRefs.length
        || new Set(subject.refinementEvidence.map((item) => item.refinementId)).size
          !== subject.refinementEvidence.length
        || subject.refinementEvidence.some((refinement) =>
          !payload.refinementPolicy.deterministicOperations.includes(refinement.operation)
          || (refinement.tool === 'kornia'
            && !payload.refinementPolicy.korniaRefinementAllowed)
          || refinement.actualExecutionObserved !== !fixture)
    })
    || parsed.cache.cacheIdentityDigestSha256
      !== payload.cachePolicy.cacheIdentityDigestSha256
    || (parsed.cache.disposition === 'new_result') !== (parsed.cache.originalResultRef === null)
    || parsed.cache.exactSourceRangeSubjectFrameAndPolicyMatch !== true
    || (fixture && (parsed.authenticatedReadResultRef !== null
      || parsed.canonicalSam31RuntimeResultAdmissionRef !== null
      || parsed.exactCanonicalScopeReread
      || parsed.exactPrivateArtifactsReread
      || parsed.exactSam31ResultLineageVerified
      || parsed.actualSam31GpuExecutionObserved
      || parsed.actualOpenCvExecutionObserved
      || parsed.actualKorniaExecutionObserved
      || parsed.independentMaskArtifactQaCompleted
      || parsed.privateVisualReviewCompleted))
    || (!fixture && (parsed.authenticatedReadResultRef === null
      || parsed.canonicalSam31RuntimeResultAdmissionRef === null
      || !parsed.exactCanonicalScopeReread
      || !parsed.exactPrivateArtifactsReread
      || !parsed.exactSam31ResultLineageVerified
      || !parsed.actualSam31GpuExecutionObserved
      || !parsed.actualOpenCvExecutionObserved
      || !parsed.independentMaskArtifactQaCompleted
      || !parsed.privateVisualReviewCompleted))
    || parsed.actualKorniaExecutionObserved !== (!fixture && anyKornia)) {
    throw new Error('Caption Track All evidence is stale, incomplete, or overclaimed.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'packetDigestSha256',
    'Caption Track All evidence packet',
  )
  return parsed
}

export function createCaptionTrackAllEvidencePacketForContractFixture(input: {
  packetId: string
  payload: unknown
  supportRequest: unknown
  trackAllResultRef: CaptionDomainRef
  subjectEvidence: CaptionTrackAllSubjectEvidence[]
  cacheDisposition?: 'new_result' | 'exact_cache_reuse'
  originalResultRef?: CaptionDomainRef | null
}): CaptionTrackAllEvidencePacket {
  const payload = parseCaptionTrackAllSupportPayload(input.payload)
  const request = parseSkillSupportRequest(input.supportRequest)
  const disposition = input.cacheDisposition ?? 'new_result'
  const withoutDigest: Omit<CaptionTrackAllEvidencePacket, 'packetDigestSha256'> = {
    schemaVersion: CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION,
    packetId: safeKey.parse(input.packetId),
    supportRequestRef: requestRef(request),
    supportPayloadRef: payloadRef(payload),
    canonicalScope: structuredClone(payload.canonicalScope),
    purpose: payload.purpose,
    pictureLockRef: structuredClone(payload.pictureLockRef),
    finishReadinessRef: structuredClone(payload.finishReadinessRef),
    visualOccupancyManifestRef: structuredClone(payload.visualOccupancyManifestRef),
    sourcePrivateArtifactRef: structuredClone(payload.sourcePrivateArtifactRef),
    sourceFrameMappingRef: structuredClone(payload.sourceFrameMappingRef),
    confirmedOutputFrameDigestSha256: payload.confirmedOutputFrameDigestSha256,
    requestedSceneId: payload.requestedSceneId,
    requestedRange: structuredClone(payload.requestedRange),
    producerSkillKey: 'track_all',
    selectedSegmentationRoute: 'sam3_1',
    canonicalSam31OperationId: 'tool.sam3_1.segment_and_track_subject.v1',
    trackAllResultRef: structuredClone(input.trackAllResultRef),
    authenticatedReadResultRef: null,
    canonicalSam31RuntimeResultAdmissionRef: null,
    subjectEvidence: structuredClone(input.subjectEvidence),
    cache: {
      cacheIdentityDigestSha256: payload.cachePolicy.cacheIdentityDigestSha256,
      disposition,
      originalResultRef: disposition === 'new_result'
        ? null : structuredClone(input.originalResultRef ?? input.trackAllResultRef),
      exactSourceRangeSubjectFrameAndPolicyMatch: true,
      staleArtifactReused: false,
    },
    evidenceMode: 'contract_fixture',
    exactCanonicalScopeReread: false,
    exactPrivateArtifactsReread: false,
    exactSam31ResultLineageVerified: false,
    actualSam31GpuExecutionObserved: false,
    actualOpenCvExecutionObserved: false,
    actualKorniaExecutionObserved: false,
    independentMaskArtifactQaCompleted: false,
    privateVisualReviewCompleted: false,
    browserLocalStateUsed: false,
    rawMaskBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    providerCredentialIncluded: false,
    runtimeOrDispatchAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionTrackAllEvidencePacket({
    ...withoutDigest,
    packetDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, packetDigestSha256: '' },
      'packetDigestSha256',
    ),
  }, { payload, supportRequest: request })
}

export function parseCaptionTrackAllAdmission(
  value: unknown,
  input: { packet: unknown; payload: unknown; supportRequest: unknown },
): CaptionTrackAllAdmission {
  assertClosedContractTree(value, 'Caption Track All admission')
  const payload = parseCaptionTrackAllSupportPayload(input.payload)
  const request = parseSkillSupportRequest(input.supportRequest)
  const packet = parseCaptionTrackAllEvidencePacket(input.packet, { payload, supportRequest: request })
  const parsed = admissionSchema.parse(value)
  const subjectAdmissions = packet.subjectEvidence.map((subject) => {
    const subjectRequest = payload.subjectRequests.find((item) =>
      item.subjectRequestId === subject.subjectRequestId)!
    const qa = subjectQa({ subject, request: subjectRequest, thresholds: payload.qaThresholds })
    return { subject, qa }
  })
  const runtimeQualified = packet.evidenceMode === 'authenticated_private_runtime'
    && packet.exactCanonicalScopeReread
    && packet.exactPrivateArtifactsReread
    && packet.exactSam31ResultLineageVerified
    && packet.actualSam31GpuExecutionObserved
    && packet.actualOpenCvExecutionObserved
    && packet.independentMaskArtifactQaCompleted
    && packet.privateVisualReviewCompleted
  const qaPassed = subjectAdmissions.every((item) => item.qa.passed)
  const expectedDisposition = !runtimeQualified
    ? 'blocked_private_runtime_evidence' as const
    : qaPassed ? 'admitted_for_caption_scene_graph' as const
      : 'blocked_temporal_qa' as const
  const admitted = expectedDisposition === 'admitted_for_caption_scene_graph'
  const expectedSubjects = subjectAdmissions.map(({ subject, qa }) => ({
    subjectRequestId: subject.subjectRequestId,
    subjectEvidenceId: subject.subjectEvidenceId,
    qaPassed: qa.passed,
    maskSequenceRef: subject.maskSequenceRef,
    trackManifestRef: subject.trackManifestRef,
    anchorManifestRef: subject.anchorManifestRef,
    blockerCodes: qa.blockers,
  }))
  if (!exactScope(parsed.canonicalScope, payload.canonicalScope)
    || !exactRef(parsed.supportRequestRef, requestRef(request))
    || !exactRef(parsed.evidencePacketRef, packetRef(packet))
    || parsed.requestedSceneId !== payload.requestedSceneId
    || JSON.stringify(parsed.subjectAdmissions) !== JSON.stringify(expectedSubjects)
    || parsed.disposition !== expectedDisposition
    || parsed.textBehindSubjectAllowed !== (admitted && payload.purpose === 'subject_occlusion')
    || parsed.objectAnchorAllowed !== (admitted && payload.purpose !== 'subject_occlusion')
    || parsed.selectedFallback !== (admitted ? 'none' : 'safe_top_plane')
    || parsed.cacheReuseAccepted !== (runtimeQualified
      && packet.cache.disposition === 'exact_cache_reuse')) {
    throw new Error('Caption Track All admission is overclaimed or inconsistent.')
  }
  verifyDigest(
    parsed as unknown as Record<string, unknown>,
    'admissionDigestSha256',
    'Caption Track All admission',
  )
  return parsed
}

export function createCaptionTrackAllAdmission(input: {
  admissionId: string
  packet: unknown
  payload: unknown
  supportRequest: unknown
}): CaptionTrackAllAdmission {
  const payload = parseCaptionTrackAllSupportPayload(input.payload)
  const request = parseSkillSupportRequest(input.supportRequest)
  const packet = parseCaptionTrackAllEvidencePacket(input.packet, { payload, supportRequest: request })
  const subjectAdmissions = packet.subjectEvidence.map((subject) => {
    const subjectRequest = payload.subjectRequests.find((item) =>
      item.subjectRequestId === subject.subjectRequestId)!
    const qa = subjectQa({ subject, request: subjectRequest, thresholds: payload.qaThresholds })
    return {
      subjectRequestId: subject.subjectRequestId,
      subjectEvidenceId: subject.subjectEvidenceId,
      qaPassed: qa.passed,
      maskSequenceRef: subject.maskSequenceRef,
      trackManifestRef: subject.trackManifestRef,
      anchorManifestRef: subject.anchorManifestRef,
      blockerCodes: qa.blockers,
    }
  })
  const runtimeQualified = packet.evidenceMode === 'authenticated_private_runtime'
    && packet.exactCanonicalScopeReread
    && packet.exactPrivateArtifactsReread
    && packet.exactSam31ResultLineageVerified
    && packet.actualSam31GpuExecutionObserved
    && packet.actualOpenCvExecutionObserved
    && packet.independentMaskArtifactQaCompleted
    && packet.privateVisualReviewCompleted
  const qaPassed = subjectAdmissions.every((item) => item.qaPassed)
  const disposition = !runtimeQualified
    ? 'blocked_private_runtime_evidence' as const
    : qaPassed ? 'admitted_for_caption_scene_graph' as const
      : 'blocked_temporal_qa' as const
  const admitted = disposition === 'admitted_for_caption_scene_graph'
  const withoutDigest: Omit<CaptionTrackAllAdmission, 'admissionDigestSha256'> = {
    schemaVersion: CAPTION_TRACK_ALL_ADMISSION_VERSION,
    admissionId: safeKey.parse(input.admissionId),
    canonicalScope: structuredClone(payload.canonicalScope),
    supportRequestRef: requestRef(request),
    evidencePacketRef: packetRef(packet),
    requestedSceneId: payload.requestedSceneId,
    subjectAdmissions,
    disposition,
    textBehindSubjectAllowed: admitted && payload.purpose === 'subject_occlusion',
    objectAnchorAllowed: admitted && payload.purpose !== 'subject_occlusion',
    selectedFallback: admitted ? 'none' : 'safe_top_plane',
    cacheReuseAccepted: runtimeQualified && packet.cache.disposition === 'exact_cache_reuse',
    trackAllRemainsArtifactOwner: true,
    sam31RemainsCanonicalRuntimeOwner: true,
    captionExecutedSam31: false,
    captionSelectedGpuRoute: false,
    captionCreatedMaskAsset: false,
    captionGrantedFinalQa: false,
    finalCanvasAuthorityClaimed: false,
    productionAuthorityClaimed: false,
  }
  return parseCaptionTrackAllAdmission({
    ...withoutDigest,
    admissionDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, admissionDigestSha256: '' },
      'admissionDigestSha256',
    ),
  }, { packet, payload, supportRequest: request })
}
