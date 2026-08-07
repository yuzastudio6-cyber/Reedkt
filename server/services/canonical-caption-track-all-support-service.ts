import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
  CanonicalTrackAllSam31CaptionSceneEvidence,
} from '../../src/types/canonical-caption-track-all-support'
import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_EVIDENCE_VERSION,
} from '../../src/types/canonical-caption-track-all-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CanonicalTrackAllSam31CaptionSceneQaAuthority,
} from '../../src/types/canonical-track-all-sam3_1-task-qa'
import {
  CAPTION_TRACK_ALL_ADMISSION_VERSION,
  CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION,
  CAPTION_TRACK_ALL_SUPPORT_PAYLOAD_VERSION,
  type CaptionTrackAllAdmission,
  type CaptionTrackAllEvidencePacket,
  type CaptionTrackAllSubjectEvidence,
  type CaptionTrackAllSupportPayload,
} from '../../src/types/caption-track-all-support'
import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  CanonicalSpecialistSupportResumeRecord,
} from '../../src/types/canonical-specialist-support-resume'
import type {
  SkillArtifactRef,
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import type { CanonicalCaptionCrossSystemExecutionInputReadPort } from
  '../../src/types/canonical-caption-cross-system-execution-input'
import type { CanonicalCaptionIncomingSupportRequestReadPort } from
  '../../src/types/canonical-caption-specialist-execution'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  parseOrchestraSkillCall as parseBackendOrchestraSkillCall,
  parseSkillSupportRequest as parseBackendSkillSupportRequest,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  assertCanonicalSam31GpuTaskContext,
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import type {
  CanonicalSam31GpuTaskContextRepository,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  createCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  parseCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  resumeCanonicalSpecialistWithAuthenticatedSupport,
  type CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'
import {
  canonicalCaptionCrossSystemRuntimeInput,
  resolveCanonicalCaptionCrossSystemExecutionInput,
} from './canonical-caption-cross-system-execution-input-service'
import { resolveCanonicalCaptionIncomingSupportRequestForCall } from
  './canonical-caption-incoming-support-request-service'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_EVIDENCE_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-caption-scene-evidence-repository-v1' as const
export const CANONICAL_CAPTION_TRACK_ALL_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-track-all-evidence-repository-v2' as const
export const CANONICAL_CAPTION_TRACK_ALL_SUPPORT_SERVICE_VERSION =
  'canonical-caption-track-all-support-service-v2' as const

const SCENE_PREFIX =
  'private/track-all/sam3_1/v1/caption-scene-evidence'
const RECORD_PREFIX =
  'private/orchestra/v2/caption-track-all-support'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const safeBackendId = z.string().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))

const domainRefSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const skillRefSchema: z.ZodType<SkillContractRef> = domainRefSchema
const backendRefSchema = z.object({
  id: safeBackendId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const frameRangeSchema: z.ZodType<CaptionDomainFrameRange> = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: 'custom', message: 'Frame range is empty.' })
  }
})
const scopeSchema: z.ZodType<CaptionDomainCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: domainRefSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
}).strict()
const subjectRoleSchema = z.enum([
  'primary_speaker', 'secondary_speaker', 'hand', 'product',
  'important_object', 'environmental_surface',
])
const refinementOperationSchema = z.enum([
  'morphological_cleanup', 'hole_fill', 'edge_feather_measurement',
  'temporal_median_check', 'connected_component_filter',
])
const qaThresholdSchema = z.object({
  minimumBinaryIntersectionOverUnionBasisPoints:
    z.number().int().min(0).max(10_000),
  maximumNormalizedCentroidShiftBasisPoints:
    z.number().int().min(0).max(10_000),
  maximumBoundaryDisagreementBasisPoints:
    z.number().int().min(0).max(10_000),
  maximumAlphaFlickerBasisPoints:
    z.number().int().min(0).max(10_000),
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
  payloadDigestSha256: rawSha256,
  purpose: z.enum([
    'subject_occlusion', 'object_anchor', 'environmental_anchor',
  ]),
  canonicalScope: scopeSchema,
  pictureLockRef: domainRefSchema,
  finishReadinessRef: domainRefSchema,
  visualOccupancyManifestRef: domainRefSchema,
  confirmedOutputFrameDigestSha256: rawSha256,
  sourcePrivateArtifactRef: domainRefSchema,
  sourceFrameMappingRef: domainRefSchema,
  requestedSceneId: safeKey,
  requestedRange: frameRangeSchema,
  subjectRequests: z.array(z.object({
    subjectRequestId: safeKey,
    subjectRole: subjectRoleSchema,
    visualObservationRefs: z.array(domainRefSchema).min(1).max(512),
    sourcePhraseRefs: z.array(domainRefSchema).min(1).max(512),
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
    deterministicOperations:
      z.array(refinementOperationSchema).min(1).max(5),
  }).strict(),
  cachePolicy: z.object({
    cacheIdentityDigestSha256: rawSha256,
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
  minimumBinaryIntersectionOverUnionBasisPoints:
    z.number().int().min(0).max(10_000),
  maximumNormalizedCentroidShiftBasisPoints:
    z.number().int().min(0).max(10_000),
  maximumBoundaryDisagreementBasisPoints:
    z.number().int().min(0).max(10_000),
  maximumAlphaFlickerBasisPoints:
    z.number().int().min(0).max(10_000),
  minimumEdgeQualityBasisPoints: z.number().int().min(0).max(10_000),
  minimumSubjectCoverageBasisPoints: z.number().int().min(0).max(10_000),
  identitySwapCount: z.number().int().nonnegative(),
  lostAnchorFrameCount: z.number().int().nonnegative(),
  completeRequestedRangeCoverage: z.boolean(),
}).strict()
const subjectEvidenceSchema: z.ZodType<CaptionTrackAllSubjectEvidence> =
  z.object({
    subjectRequestId: safeKey,
    subjectEvidenceId: safeKey,
    subjectRole: subjectRoleSchema,
    frameRange: frameRangeSchema,
    maskSequenceRef: domainRefSchema.nullable(),
    trackManifestRef: domainRefSchema,
    anchorManifestRef: domainRefSchema.nullable(),
    sourceFrameMappingRef: domainRefSchema,
    outputFrameDigestSha256: rawSha256,
    temporalQa: temporalQaSchema,
    refinementEvidence: z.array(z.object({
      refinementId: safeKey,
      tool: z.enum(['opencv', 'kornia']),
      operation: refinementOperationSchema,
      inputArtifactRef: domainRefSchema,
      outputArtifactRef: domainRefSchema,
      executionEvidenceRef: domainRefSchema,
      actualExecutionObserved: z.boolean(),
    }).strict()).max(64),
    evidenceRefs: z.array(domainRefSchema).min(1).max(512),
  }).strict()

const sceneEvidenceWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_EVIDENCE_VERSION,
  ),
  evidenceId: safeKey,
  invocationId: safeKey,
  taskRef: domainRefSchema,
  runtimeResultAdmissionRef: domainRefSchema,
  trackAllResultRef: domainRefSchema,
  canonicalScope: scopeSchema,
  sourcePrivateArtifactRef: domainRefSchema,
  sourceFrameMappingRef: domainRefSchema,
  confirmedOutputFrameRef: domainRefSchema,
  requestedRange: frameRangeSchema,
  subjectEvidence: z.array(subjectEvidenceSchema).min(1).max(16),
  independentMaskArtifactQaRef: domainRefSchema,
  privateVisualReviewRef: domainRefSchema,
  cache: z.object({
    cacheIdentityDigestSha256: rawSha256,
    disposition: z.enum(['new_result', 'exact_cache_reuse']),
    originalResultRef: domainRefSchema.nullable(),
    exactSourceRangeSubjectFrameAndPolicyMatch: z.literal(true),
    staleArtifactReused: z.literal(false),
  }).strict(),
  exactTaskResultAndPrivateArtifactReread: z.literal(true),
  exactApprovedSnapshotOutputSceneRangeAndSourceBindingVerified:
    z.literal(true),
  actualSam31GpuExecutionObserved: z.literal(true),
  actualOpenCvExecutionObserved: z.literal(true),
  actualKorniaExecutionObserved: z.boolean(),
  independentMaskArtifactQaCompleted: z.literal(true),
  privateVisualReviewCompleted: z.literal(true),
  completeRequestedRangeCoverageVerified: z.literal(true),
  browserOrCallerQaClaimsAccepted: z.literal(false),
  rawMaskMediaBytesPathsUrlsOrCredentialsIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict()
const sceneEvidenceSchema = sceneEvidenceWithoutDigestSchema.extend({
  evidenceDigestSha256: rawSha256,
}).strict()

const packetSchema: z.ZodType<CaptionTrackAllEvidencePacket> = z.object({
  schemaVersion: z.literal(CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION),
  packetId: safeKey,
  packetDigestSha256: rawSha256,
  supportRequestRef: skillRefSchema,
  supportPayloadRef: domainRefSchema,
  canonicalScope: scopeSchema,
  purpose: z.enum([
    'subject_occlusion', 'object_anchor', 'environmental_anchor',
  ]),
  pictureLockRef: domainRefSchema,
  finishReadinessRef: domainRefSchema,
  visualOccupancyManifestRef: domainRefSchema,
  sourcePrivateArtifactRef: domainRefSchema,
  sourceFrameMappingRef: domainRefSchema,
  confirmedOutputFrameDigestSha256: rawSha256,
  requestedSceneId: safeKey,
  requestedRange: frameRangeSchema,
  producerSkillKey: z.literal('track_all'),
  selectedSegmentationRoute: z.literal('sam3_1'),
  canonicalSam31OperationId:
    z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  trackAllResultRef: domainRefSchema,
  authenticatedReadResultRef: domainRefSchema,
  canonicalSam31RuntimeResultAdmissionRef: domainRefSchema,
  subjectEvidence: z.array(subjectEvidenceSchema).min(1).max(16),
  cache: z.object({
    cacheIdentityDigestSha256: rawSha256,
    disposition: z.enum(['new_result', 'exact_cache_reuse']),
    originalResultRef: domainRefSchema.nullable(),
    exactSourceRangeSubjectFrameAndPolicyMatch: z.literal(true),
    staleArtifactReused: z.literal(false),
  }).strict(),
  evidenceMode: z.literal('authenticated_private_runtime'),
  exactCanonicalScopeReread: z.literal(true),
  exactPrivateArtifactsReread: z.literal(true),
  exactSam31ResultLineageVerified: z.literal(true),
  actualSam31GpuExecutionObserved: z.literal(true),
  actualOpenCvExecutionObserved: z.literal(true),
  actualKorniaExecutionObserved: z.boolean(),
  independentMaskArtifactQaCompleted: z.literal(true),
  privateVisualReviewCompleted: z.literal(true),
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
  admissionDigestSha256: rawSha256,
  canonicalScope: scopeSchema,
  supportRequestRef: skillRefSchema,
  evidencePacketRef: domainRefSchema,
  requestedSceneId: safeKey,
  subjectAdmissions: z.array(z.object({
    subjectRequestId: safeKey,
    subjectEvidenceId: safeKey,
    qaPassed: z.boolean(),
    maskSequenceRef: domainRefSchema.nullable(),
    trackManifestRef: domainRefSchema,
    anchorManifestRef: domainRefSchema.nullable(),
    blockerCodes: z.array(safeKey).max(64),
  }).strict()).min(1).max(16),
  disposition: z.enum([
    'admitted_for_caption_scene_graph', 'blocked_private_runtime_evidence',
    'blocked_temporal_qa',
  ]),
  textBehindSubjectAllowed: z.boolean(),
  objectAnchorAllowed: z.boolean(),
  selectedFallback: z.enum([
    'none', 'safe_top_plane', 'stable_libass', 'user_review',
  ]),
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

const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  ),
  recordId: safeKey,
  recordDigestSha256: rawSha256,
  originalCallRef: skillRefSchema,
  supportRequestRef: skillRefSchema,
  supportRequest: z.unknown(),
  supportPayload: z.unknown(),
  backendTrackAllCallRef: domainRefSchema,
  backendTrackAllSupportRequestRef: domainRefSchema,
  sam31TaskRef: domainRefSchema,
  sam31RuntimeResultAdmissionRef: domainRefSchema,
  trackAllSceneQaAuthorityRef: domainRefSchema,
  trackAllSceneEvidenceRef: domainRefSchema,
  captionEvidencePacket: z.unknown(),
  captionAdmission: z.unknown(),
  authenticatedOwnerProjection: z.unknown(),
  authenticatedPrincipalVerified: z.literal(true),
  priorCallAndSupportRequestExactReread: z.literal(true),
  backendTrackAllCallAndSupportRequestExactReread: z.literal(true),
  distinctCaptionAndBackendSupportWireIdentitiesPreserved: z.literal(true),
  sam31TaskAndResultExactReread: z.literal(true),
  taskLevelSceneQaAuthorityExactReread: z.literal(true),
  independentSceneEvidenceExactReread: z.literal(true),
  exactCaptionScopeOutputSceneRangeSourceAndFrameBindingVerified:
    z.literal(true),
  ownerProjectionCreateOnlyPersisted: z.literal(true),
  evidenceRecordCreateOnlyPersisted: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  rawMaskMediaBytesPathsUrlsOrCredentialsAccepted: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  runtimeExecutionPerformedByBridge: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  runtimeExecutionAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  costOrBillingAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export interface CanonicalTrackAllSam31CaptionSceneEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_EVIDENCE_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly evidence: CanonicalTrackAllSam31CaptionSceneEvidence
  }): Promise<'created' | 'identical_replay'>
  rereadByRef(input: {
    readonly evidenceRef: CaptionDomainRef
  }): Promise<CanonicalTrackAllSam31CaptionSceneEvidence | null>
}

export interface CanonicalCaptionTrackAllEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TRACK_ALL_EVIDENCE_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly record: CanonicalCaptionTrackAllAuthenticatedEvidenceRecord
  }): Promise<'created' | 'identical_replay'>
  rereadBySupportRequestRef(input: {
    readonly supportRequestRef: SkillContractRef
  }): Promise<CanonicalCaptionTrackAllAuthenticatedEvidenceRecord | null>
}

export interface CanonicalCaptionTrackAllSupportService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TRACK_ALL_SUPPORT_SERVICE_VERSION
  projectAuthenticatedEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly priorCallRef: SkillContractRef
    readonly selectedSupportRequestRef: SkillContractRef
    readonly invocationId: string
    readonly runtimeResultAdmissionRef: CaptionDomainRef
    readonly trackAllSceneQaAuthorityRef: CaptionDomainRef
    readonly trackAllSceneEvidenceRef: CaptionDomainRef
  }): Promise<CanonicalCaptionTrackAllAuthenticatedEvidenceRecord>
  projectAndResumeAuthenticatedEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly priorCallRef: SkillContractRef
    readonly selectedSupportRequestRef: SkillContractRef
    readonly invocationId: string
    readonly runtimeResultAdmissionRef: CaptionDomainRef
    readonly trackAllSceneQaAuthorityRef: CaptionDomainRef
    readonly trackAllSceneEvidenceRef: CaptionDomainRef
  }): Promise<{
    readonly evidenceRecord: CanonicalCaptionTrackAllAuthenticatedEvidenceRecord
    readonly resumeRecord: CanonicalSpecialistSupportResumeRecord
  }>
}

export interface CanonicalTrackAllSam31CaptionSceneQaAuthorityReadPort {
  rereadAuthority(input: {
    readonly authorityRef: CaptionDomainRef
  }): Promise<CanonicalTrackAllSam31CaptionSceneQaAuthority | null>
}

export interface CanonicalTrackAllSam31CaptionSceneQaAuthorityReadPort {
  rereadAuthority(input: {
    readonly authorityRef: CaptionDomainRef
  }): Promise<CanonicalTrackAllSam31CaptionSceneQaAuthority | null>
}

export function sealCanonicalTrackAllSam31CaptionSceneEvidence(
  value: Omit<CanonicalTrackAllSam31CaptionSceneEvidence,
    'evidenceDigestSha256'>,
): CanonicalTrackAllSam31CaptionSceneEvidence {
  assertClosedContractTree(value, 'Track All SAM 3.1 scene evidence input')
  const payload = sceneEvidenceWithoutDigestSchema.parse(value)
  return parseCanonicalTrackAllSam31CaptionSceneEvidence({
    ...payload,
    evidenceDigestSha256: contractDigest(payload, 'evidenceDigestSha256'),
  })
}

export function parseCanonicalTrackAllSam31CaptionSceneEvidence(
  value: unknown,
): CanonicalTrackAllSam31CaptionSceneEvidence {
  assertClosedContractTree(value, 'Track All SAM 3.1 scene evidence')
  const evidence = sceneEvidenceSchema.parse(value)
  const { evidenceDigestSha256, ...payload } = evidence
  const subjects = evidence.subjectEvidence
  if (
    evidenceDigestSha256 !== contractDigest(payload, 'evidenceDigestSha256')
    || evidence.canonicalScope.approvedSnapshotRef === null
    || evidence.canonicalScope.sceneId === null
    || evidence.canonicalScope.authorizedFrameRanges.length !== 1
    || !sameRange(
      evidence.canonicalScope.authorizedFrameRanges[0]!,
      evidence.requestedRange,
    )
    || new Set(subjects.map((subject) => subject.subjectRequestId)).size
      !== subjects.length
    || new Set(subjects.map((subject) => subject.subjectEvidenceId)).size
      !== subjects.length
    || subjects.some((subject) =>
      !sameRange(subject.frameRange, evidence.requestedRange)
      || subject.temporalQa.expectedFrameCount !== rangeLength(
        evidence.requestedRange,
      )
      || subject.temporalQa.measuredFrameCount !== rangeLength(
        evidence.requestedRange,
      )
      || !subject.temporalQa.completeRequestedRangeCoverage
      || !sameDomainRef(subject.sourceFrameMappingRef,
        evidence.sourceFrameMappingRef)
      || subject.outputFrameDigestSha256
        !== evidence.confirmedOutputFrameRef.contentHash
      || new Set(subject.evidenceRefs.map(domainRefKey)).size
        !== subject.evidenceRefs.length
      || new Set(subject.refinementEvidence.map((item) => item.refinementId))
        .size !== subject.refinementEvidence.length
      || !subject.refinementEvidence.some((item) =>
        item.tool === 'opencv' && item.actualExecutionObserved)
      || subject.refinementEvidence.some((item) =>
        !item.actualExecutionObserved)
      || !subject.evidenceRefs.some((item) =>
        sameDomainRef(item, evidence.independentMaskArtifactQaRef))
      || !subject.evidenceRefs.some((item) =>
        sameDomainRef(item, evidence.privateVisualReviewRef)))
    || evidence.actualKorniaExecutionObserved !== subjects.some((subject) =>
      subject.refinementEvidence.some((item) => item.tool === 'kornia'))
    || (evidence.cache.disposition === 'new_result')
      !== (evidence.cache.originalResultRef === null)
  ) throw new Error('Track All SAM 3.1 scene evidence is inconsistent.')
  return freeze(evidence)
}

export function createCanonicalTrackAllSam31CaptionSceneEvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31CaptionSceneEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? SCENE_PREFIX)
  const repository: CanonicalTrackAllSam31CaptionSceneEvidenceRepository = {
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_EVIDENCE_REPOSITORY_VERSION,
    async persistCreateOnly({ evidence: value }: {
      readonly evidence: CanonicalTrackAllSam31CaptionSceneEvidence
    }) {
      const evidence = parseCanonicalTrackAllSam31CaptionSceneEvidence(value)
      return persistExact(
        input.objectPort,
        scenePath(prefix, sceneEvidenceRef(evidence)),
        evidence,
        parseCanonicalTrackAllSam31CaptionSceneEvidence,
      )
    },
    async rereadByRef({ evidenceRef: untrusted }: {
      readonly evidenceRef: CaptionDomainRef
    }) {
      assertClosedContractTree(untrusted, 'Track All scene evidence read ref')
      const ref = domainRefSchema.parse(untrusted)
      return readExact(
        input.objectPort,
        scenePath(prefix, ref),
        parseCanonicalTrackAllSam31CaptionSceneEvidence,
      )
    },
  }
  return Object.freeze(repository)
}

export function parseCaptionTrackAllSupportPayload(
  value: unknown,
): CaptionTrackAllSupportPayload {
  assertClosedContractTree(value, 'Caption Track All support payload')
  const payload = supportPayloadSchema.parse(value)
  const expectedDepth = payload.purpose === 'subject_occlusion'
    ? 'behind_subject'
    : payload.purpose === 'object_anchor'
      ? 'object_attached'
      : 'environmental_surface'
  const expectedArtifacts = [
    ...(payload.subjectRequests.some((item) => item.maskRequired)
      ? ['mask_sequence'] : []),
    'track_manifest',
    ...(payload.subjectRequests.some((item) => item.anchorRequired)
      ? ['anchor_manifest'] : []),
  ]
  const cacheDigest = contractDigest({
    purpose: payload.purpose,
    canonicalScope: payload.canonicalScope,
    sourcePrivateArtifactRef: payload.sourcePrivateArtifactRef,
    sourceFrameMappingRef: payload.sourceFrameMappingRef,
    confirmedOutputFrameDigestSha256:
      payload.confirmedOutputFrameDigestSha256,
    requestedRange: payload.requestedRange,
    subjectRequests: payload.subjectRequests,
    qaThresholds: payload.qaThresholds,
    refinementPolicy: payload.refinementPolicy,
  }, 'cacheIdentityDigestSha256')
  if (
    payload.payloadDigestSha256 !== contractDigest(
      payload,
      'payloadDigestSha256',
    )
    || payload.cachePolicy.cacheIdentityDigestSha256 !== cacheDigest
    || payload.canonicalScope.approvedSnapshotRef === null
    || payload.canonicalScope.sceneId !== payload.requestedSceneId
    || payload.canonicalScope.authorizedFrameRanges.length !== 1
    || !sameRange(payload.canonicalScope.authorizedFrameRanges[0]!,
      payload.requestedRange)
    || payload.depthIntent !== expectedDepth
    || stableAuthorityStringify(payload.expectedArtifactTypes)
      !== stableAuthorityStringify(expectedArtifacts)
    || new Set(payload.subjectRequests.map((item) => item.subjectRequestId))
      .size !== payload.subjectRequests.length
    || payload.subjectRequests.some((item) =>
      (payload.purpose === 'subject_occlusion' && !item.maskRequired)
      || (payload.purpose !== 'subject_occlusion' && !item.anchorRequired)
      || new Set(item.visualObservationRefs.map(domainRefKey)).size
        !== item.visualObservationRefs.length
      || new Set(item.sourcePhraseRefs.map(domainRefKey)).size
        !== item.sourcePhraseRefs.length)
    || new Set(payload.refinementPolicy.deterministicOperations).size
      !== payload.refinementPolicy.deterministicOperations.length
  ) throw new Error('Caption Track All support payload is invalid.')
  return freeze(payload)
}

export function parseCaptionTrackAllEvidencePacket(
  value: unknown,
  input: { readonly payload: unknown; readonly supportRequest: unknown },
): CaptionTrackAllEvidencePacket {
  assertClosedContractTree(value, 'Caption Track All evidence packet')
  const payload = parseCaptionTrackAllSupportPayload(input.payload)
  const supportRequest = parseCaptionTrackAllSupportRequest(
    input.supportRequest,
    payload,
  )
  const packet = packetSchema.parse(value)
  const expected = new Map(payload.subjectRequests.map((item) => [
    item.subjectRequestId,
    item,
  ]))
  if (
    packet.packetDigestSha256 !== contractDigest(
      packet,
      'packetDigestSha256',
    )
    || !sameSkillRef(packet.supportRequestRef,
      requestRef(supportRequest))
    || !sameDomainRef(packet.supportPayloadRef, supportPayloadRef(payload))
    || !sameCaptionScope(packet.canonicalScope, payload.canonicalScope)
    || packet.purpose !== payload.purpose
    || !sameDomainRef(packet.pictureLockRef, payload.pictureLockRef)
    || !sameDomainRef(packet.finishReadinessRef, payload.finishReadinessRef)
    || !sameDomainRef(packet.visualOccupancyManifestRef,
      payload.visualOccupancyManifestRef)
    || !sameDomainRef(packet.sourcePrivateArtifactRef,
      payload.sourcePrivateArtifactRef)
    || !sameDomainRef(packet.sourceFrameMappingRef,
      payload.sourceFrameMappingRef)
    || packet.confirmedOutputFrameDigestSha256
      !== payload.confirmedOutputFrameDigestSha256
    || packet.requestedSceneId !== payload.requestedSceneId
    || !sameRange(packet.requestedRange, payload.requestedRange)
    || packet.cache.cacheIdentityDigestSha256
      !== payload.cachePolicy.cacheIdentityDigestSha256
    || (packet.cache.disposition === 'new_result')
      !== (packet.cache.originalResultRef === null)
    || packet.subjectEvidence.length !== payload.subjectRequests.length
    || new Set(packet.subjectEvidence.map((item) => item.subjectRequestId))
      .size !== packet.subjectEvidence.length
    || packet.subjectEvidence.some((subject) => {
      const request = expected.get(subject.subjectRequestId)
      return !request
        || request.subjectRole !== subject.subjectRole
        || !sameRange(subject.frameRange, payload.requestedRange)
        || request.maskRequired !== (subject.maskSequenceRef !== null)
        || request.anchorRequired !== (subject.anchorManifestRef !== null)
        || !sameDomainRef(subject.sourceFrameMappingRef,
          payload.sourceFrameMappingRef)
        || subject.outputFrameDigestSha256
          !== payload.confirmedOutputFrameDigestSha256
    })
    || packet.actualKorniaExecutionObserved
      !== packet.subjectEvidence.some((subject) =>
        subject.refinementEvidence.some((item) => item.tool === 'kornia'))
  ) throw new Error('Caption Track All evidence packet is invalid.')
  return freeze(packet)
}

export function parseCaptionTrackAllAdmission(
  value: unknown,
  input: {
    readonly packet: unknown
    readonly payload: unknown
    readonly supportRequest: unknown
  },
): CaptionTrackAllAdmission {
  assertClosedContractTree(value, 'Caption Track All admission')
  const payload = parseCaptionTrackAllSupportPayload(input.payload)
  const request = parseCaptionTrackAllSupportRequest(
    input.supportRequest,
    payload,
  )
  const packet = parseCaptionTrackAllEvidencePacket(input.packet, {
    payload,
    supportRequest: request,
  })
  const admission = admissionSchema.parse(value)
  const expectedSubjects = packet.subjectEvidence.map((subject) => {
    const requested = payload.subjectRequests.find((item) =>
      item.subjectRequestId === subject.subjectRequestId)!
    const blockers = subjectBlockers(subject, requested, payload.qaThresholds)
    return {
      subjectRequestId: subject.subjectRequestId,
      subjectEvidenceId: subject.subjectEvidenceId,
      qaPassed: blockers.length === 0,
      maskSequenceRef: subject.maskSequenceRef,
      trackManifestRef: subject.trackManifestRef,
      anchorManifestRef: subject.anchorManifestRef,
      blockerCodes: blockers,
    }
  })
  const passed = expectedSubjects.every((item) => item.qaPassed)
  const expectedDisposition = passed
    ? 'admitted_for_caption_scene_graph'
    : 'blocked_temporal_qa'
  if (
    admission.admissionDigestSha256 !== contractDigest(
      admission,
      'admissionDigestSha256',
    )
    || !sameCaptionScope(admission.canonicalScope, payload.canonicalScope)
    || !sameSkillRef(admission.supportRequestRef, requestRef(request))
    || !sameDomainRef(admission.evidencePacketRef, packetRef(packet))
    || admission.requestedSceneId !== payload.requestedSceneId
    || stableAuthorityStringify(admission.subjectAdmissions)
      !== stableAuthorityStringify(expectedSubjects)
    || admission.disposition !== expectedDisposition
    || admission.textBehindSubjectAllowed
      !== (passed && payload.purpose === 'subject_occlusion')
    || admission.objectAnchorAllowed
      !== (passed && payload.purpose !== 'subject_occlusion')
    || admission.selectedFallback !== (passed ? 'none' : 'safe_top_plane')
    || admission.cacheReuseAccepted
      !== (packet.cache.disposition === 'exact_cache_reuse')
  ) throw new Error('Caption Track All admission is invalid.')
  return freeze(admission)
}

export function parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord(
  value: unknown,
): CanonicalCaptionTrackAllAuthenticatedEvidenceRecord {
  assertClosedContractTree(value, 'Canonical Caption Track All record')
  const envelope = recordEnvelopeSchema.parse(value)
  const supportPayload = parseCaptionTrackAllSupportPayload(
    envelope.supportPayload,
  )
  const supportRequest = parseCaptionTrackAllSupportRequest(
    envelope.supportRequest,
    supportPayload,
  )
  const packet = parseCaptionTrackAllEvidencePacket(
    envelope.captionEvidencePacket,
    { payload: supportPayload, supportRequest },
  )
  const admission = parseCaptionTrackAllAdmission(
    envelope.captionAdmission,
    { packet, payload: supportPayload, supportRequest },
  )
  const projection =
    parseCanonicalAuthenticatedSpecialistSupportArtifactProjection(
      envelope.authenticatedOwnerProjection,
    )
  const record = {
    ...envelope,
    supportRequest,
    supportPayload,
    captionEvidencePacket: packet,
    captionAdmission: admission,
    authenticatedOwnerProjection: projection,
  } as CanonicalCaptionTrackAllAuthenticatedEvidenceRecord
  const artifact = captionPacketArtifactRef(packet, supportRequest)
  if (
    record.recordDigestSha256 !== contractDigest(
      record,
      'recordDigestSha256',
    )
    || !sameSkillRef(record.originalCallRef, supportRequest.originalCallRef)
    || !sameSkillRef(record.supportRequestRef, requestRef(supportRequest))
    || !sameDomainRef(record.sam31RuntimeResultAdmissionRef,
      packet.canonicalSam31RuntimeResultAdmissionRef!)
    || !sameDomainRef(record.trackAllSceneEvidenceRef,
      packet.authenticatedReadResultRef!)
    || !sameSkillRef(projection.originalCallRef, record.originalCallRef)
    || !sameSkillRef(projection.supportRequestRef, record.supportRequestRef)
    || projection.ownerKey !== 'track_all'
    || projection.artifactRefs.length !== 1
    || !sameArtifactRef(projection.artifactRefs[0], artifact)
    || admission.disposition !== 'admitted_for_caption_scene_graph'
  ) throw new Error('Canonical Caption Track All record mismatch.')
  return freeze(record)
}

export function createCanonicalCaptionTrackAllEvidenceRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalCaptionTrackAllEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? RECORD_PREFIX)
  const repository: CanonicalCaptionTrackAllEvidenceRepository = {
    schemaVersion: CANONICAL_CAPTION_TRACK_ALL_EVIDENCE_REPOSITORY_VERSION,
    async persistCreateOnly({ record: value }: {
      readonly record: CanonicalCaptionTrackAllAuthenticatedEvidenceRecord
    }) {
      const record =
        parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord(value)
      return persistExact(
        input.objectPort,
        recordPath(prefix, record.supportRequestRef),
        record,
        parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
      )
    },
    async rereadBySupportRequestRef({ supportRequestRef: untrusted }: {
      readonly supportRequestRef: SkillContractRef
    }) {
      assertClosedContractTree(untrusted, 'Caption Track All record read ref')
      const ref = skillRefSchema.parse(untrusted)
      return readExact(
        input.objectPort,
        recordPath(prefix, ref),
        parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
      )
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalCaptionTrackAllSupportService(input: {
  readonly supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  readonly taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
  readonly taskContextRepository: Pick<
    CanonicalSam31GpuTaskContextRepository,
    'rereadTaskContext'
  >
  readonly resultStore: Pick<
    CanonicalSam31GpuRuntimeResultStore,
    'rereadResultAdmission'
  >
  readonly sceneQaAuthorityReadPort:
    CanonicalTrackAllSam31CaptionSceneQaAuthorityReadPort
  readonly sceneEvidenceRepository:
    CanonicalTrackAllSam31CaptionSceneEvidenceRepository
  readonly evidenceRepository: CanonicalCaptionTrackAllEvidenceRepository
  readonly crossSystemExecutionInputReadPort?:
    CanonicalCaptionCrossSystemExecutionInputReadPort
  readonly incomingSupportRequestReadPort?:
    CanonicalCaptionIncomingSupportRequestReadPort
  readonly now?: () => Date
}): CanonicalCaptionTrackAllSupportService {
  assertPorts(input)
  const service: CanonicalCaptionTrackAllSupportService = {
    schemaVersion: CANONICAL_CAPTION_TRACK_ALL_SUPPORT_SERVICE_VERSION,
    async projectAuthenticatedEvidence(value: Parameters<
      CanonicalCaptionTrackAllSupportService['projectAuthenticatedEvidence']
    >[0]) {
      assertClosedContractTree(value, 'Caption Track All bridge input')
      const authenticatedOwnerUserId = safeKey.parse(
        value.authenticatedOwnerUserId,
      )
      const priorCallRef = skillRefSchema.parse(value.priorCallRef)
      const selectedSupportRequestRef = skillRefSchema.parse(
        value.selectedSupportRequestRef,
      )
      const invocationId = safeKey.parse(value.invocationId)
      const expectedResultRef = domainRefSchema.parse(
        value.runtimeResultAdmissionRef,
      )
      const expectedSceneQaAuthorityRef = domainRefSchema.parse(
        value.trackAllSceneQaAuthorityRef,
      )
      const expectedSceneEvidenceRef = domainRefSchema.parse(
        value.trackAllSceneEvidenceRef,
      )
      const pair = await input.supportResumeRepository.rereadCallResultPair({
        callRef: priorCallRef,
      })
      if (!pair || !sameSkillRef(callRef(pair.call), priorCallRef)) {
        throw new Error('Caption prior call/result pair is unavailable.')
      }
      const selected = pair.result.supportRequests[0]
      if (!selected || !sameSkillRef(requestRef(selected),
        selectedSupportRequestRef)) {
        throw new Error('Caption Track All request is not current.')
      }
      const payload = parseCaptionTrackAllSupportPayload(selected.typedPayload)
      const supportRequest = parseCaptionTrackAllSupportRequest(
        selected,
        payload,
      )
      if (authenticatedOwnerUserId !== payload.canonicalScope.ownerUserId) {
        throw new Error('Caption Track All authenticated owner mismatch.')
      }
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(invocationId),
      )
      const context = assertCanonicalSam31GpuTaskContext(
        await input.taskContextRepository.rereadTaskContext({
          taskContextRef: task.taskContextRef,
        }),
      )
      const result = assertCanonicalSam31GpuRuntimeResultAdmission(
        await input.resultStore.rereadResultAdmission(invocationId),
      )
      const resultRef = backendResultRef(result)
      if (!sameDomainRef(resultRef, expectedResultRef)) {
        throw new Error('SAM 3.1 result admission reference mismatch.')
      }
      const sceneQaAuthority =
        await input.sceneQaAuthorityReadPort.rereadAuthority({
          authorityRef: expectedSceneQaAuthorityRef,
        })
      if (!sceneQaAuthority || !sameDomainRef(
        sceneQaAuthorityRef(sceneQaAuthority),
        expectedSceneQaAuthorityRef,
      )) throw new Error('Track All task-level QA authority is unavailable.')
      const sceneEvidence =
        await input.sceneEvidenceRepository.rereadByRef({
          evidenceRef: expectedSceneEvidenceRef,
        })
      if (!sceneEvidence || !sameDomainRef(
        sceneEvidenceRef(sceneEvidence),
        expectedSceneEvidenceRef,
      )) throw new Error('Track All independent scene evidence is unavailable.')
      if (
        sceneQaAuthority.invocationId !== invocationId
        || !sameDomainRef(sceneQaAuthority.sam31TaskRef,
          taskDomainRef(task))
        || !sameDomainRef(sceneQaAuthority.sam31RuntimeResultAdmissionRef,
          resultRef)
        || !sameDomainRef(sceneQaAuthority.captionSceneEvidenceRef,
          sceneEvidenceRef(sceneEvidence))
        || !sameDomainRef(sceneQaAuthority.supportRequestRef,
          requestRef(supportRequest))
      ) throw new Error('Track All task-level QA authority lost lineage.')
      assertRuntimeMatchesCaption({
        payload,
        supportRequest,
        invocationId,
        task,
        context,
        result,
        sceneEvidence,
      })
      const packet = createCaptionPacket({
        payload,
        supportRequest,
        resultRef,
        sceneEvidence,
      })
      const admission = createCaptionAdmission({
        payload,
        supportRequest,
        packet,
      })
      if (admission.disposition !== 'admitted_for_caption_scene_graph') {
        throw new Error('Track All scene evidence did not pass Caption QA.')
      }
      const projection =
        createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
          schemaVersion:
            'canonical-authenticated-specialist-support-artifact-projection-v1',
          projectionId:
            `caption.track-all.projection.${packet.packetDigestSha256.slice(0, 32)}`,
          originalCallRef: supportRequest.originalCallRef,
          supportRequestRef: requestRef(supportRequest),
          ownerResultRef: skillRefFromDomain(sceneEvidenceRef(sceneEvidence)),
          ownerKey: 'track_all',
          canonicalScope: supportRequest.canonicalScope,
          artifactRefs: [captionPacketArtifactRef(packet, supportRequest)],
          authenticatedPrincipalVerified: true,
          exactApprovedSnapshotReread: true,
          exactCanonicalScopeReread: true,
          exactOwnerResultReread: true,
          ownerResultPersistedBeforeProjection: true,
          browserLocalStateUsed: false,
          rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
          directPeerDispatchPerformed: false,
          timelineMutationPerformed: false,
          runtimeExecutionAuthorityGrantedToSpecialist: false,
          assetMutationAuthorityGrantedToSpecialist: false,
          costOrBillingAuthorityGrantedToSpecialist: false,
          finalQaApprovalGrantedToSpecialist: false,
          publicDeliveryGranted: false,
          productionAuthorityGranted: false,
        })
      await input.supportResumeRepository
        .persistAuthenticatedOwnerProjectionCreateOnly({ projection })
      const projectionReread = await input.supportResumeRepository
        .rereadAuthenticatedOwnerProjection({
          supportRequestRef: requestRef(supportRequest),
        })
      if (!projectionReread || projectionReread.projectionDigestSha256
        !== projection.projectionDigestSha256) {
        throw new Error('Caption Track All projection reread failed.')
      }
      const record = createRecord({
        supportRequest,
        supportPayload: payload,
        backendTrackAllCallRef: domainRefFromBackend(
          context.trackAllOrchestraBinding.orchestraCallRef,
        ),
        backendTrackAllSupportRequestRef: domainRefFromBackend(
          context.trackAllOrchestraBinding.supportRequestRef!,
        ),
        sam31TaskRef: taskDomainRef(task),
        sam31RuntimeResultAdmissionRef: resultRef,
        trackAllSceneQaAuthorityRef:
          sceneQaAuthorityRef(sceneQaAuthority),
        trackAllSceneEvidenceRef: sceneEvidenceRef(sceneEvidence),
        captionEvidencePacket: packet,
        captionAdmission: admission,
        authenticatedOwnerProjection: projectionReread,
      })
      await input.evidenceRepository.persistCreateOnly({ record })
      const reread = await input.evidenceRepository
        .rereadBySupportRequestRef({
          supportRequestRef: requestRef(supportRequest),
        })
      if (!reread || reread.recordDigestSha256 !== record.recordDigestSha256) {
        throw new Error('Caption Track All evidence did not reconcile.')
      }
      return reread
    },
    async projectAndResumeAuthenticatedEvidence(value: Parameters<
      CanonicalCaptionTrackAllSupportService[
        'projectAndResumeAuthenticatedEvidence'
      ]
    >[0]) {
      const evidenceRecord = await service.projectAuthenticatedEvidence(value)
      const resumeRecord =
        await resumeCanonicalSpecialistWithAuthenticatedSupport({
          priorCallRef: evidenceRecord.originalCallRef,
          selectedSupportRequestRef: evidenceRecord.supportRequestRef,
          repository: input.supportResumeRepository,
          specialistExecutionPort: {
            execute: async ({ call, resumeSupportRequest }) => {
              const exactRecord = await input.evidenceRepository
                .rereadBySupportRequestRef({
                  supportRequestRef: requestRef(resumeSupportRequest),
                })
              if (!exactRecord || exactRecord.recordDigestSha256
                !== evidenceRecord.recordDigestSha256) {
                throw new Error(
                  'Caption Track All resume evidence is unavailable.',
                )
              }
              const crossSystemExecutionInput =
                await resolveCanonicalCaptionCrossSystemExecutionInput({
                  call,
                  readPort: input.crossSystemExecutionInputReadPort,
                })
              const incomingSupportRequest =
                await resolveCanonicalCaptionIncomingSupportRequestForCall({
                  call,
                  readPort: input.incomingSupportRequestReadPort,
                })
              return runCaptionsSpecialistJob({
                call,
                resumeSupportRequest,
                canonicalTrackAllEvidenceRecord: exactRecord,
                ...(incomingSupportRequest === null ? {} : {
                  incomingSupportRequest,
                }),
                ...canonicalCaptionCrossSystemRuntimeInput(
                  crossSystemExecutionInput),
              })
            },
          },
          now: input.now,
        })
      return Object.freeze({ evidenceRecord, resumeRecord })
    },
  }
  return Object.freeze(service)
}

function assertRuntimeMatchesCaption(input: {
  payload: CaptionTrackAllSupportPayload
  supportRequest: SkillSupportRequest
  invocationId: string
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  context: ReturnType<typeof assertCanonicalSam31GpuTaskContext>
  result: ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>
  sceneEvidence: CanonicalTrackAllSam31CaptionSceneEvidence
}): void {
  const { payload, task, context, result, sceneEvidence } = input
  const request = task.runtimeRequest
  const scope = request.scope
  const media = request.sourceMedia
  const binding = context.trackAllOrchestraBinding
  const backendCall = parseBackendOrchestraSkillCall(binding.orchestraCall)
  const backendSupport = binding.supportRequest === null
    ? null
    : parseBackendSkillSupportRequest(binding.supportRequest)
  const resultMaskRef = domainRefFromBackend(result.maskSequenceArtifactRef)
  const resultManifestRef = domainRefFromBackend(result.manifestRef)
  if (
    input.invocationId !== task.invocationId
    || task.invocationId !== task.executionEnvelopeRef.id
    || !sameBackendRef(context.taskContextRef, task.taskContextRef)
    || result.executionEnvelopeRef.id !== input.invocationId
    || !sameBackendRef(result.taskRef, backendRef(
      task.taskId,
      task.taskRecordHash,
    ))
    || !sameBackendRef(result.runtimeRequestRef, task.runtimeRequestRef)
    || !sameBackendRef(result.dispatchAdmissionRef,
      task.dispatchAdmissionRef)
    || !sameBackendRef(result.admissionConsumptionRef,
      task.admissionConsumptionRef)
    || !sameBackendRef(result.executionEnvelopeRef,
      task.executionEnvelopeRef)
    || result.status !== 'ready_for_independent_mask_artifact_qa'
    || !result.actualNvdecCudaBfloat16ExecutionVerified
    || !result.terminalWorkerStoppedAndScaleBackToZeroVerified
    || result.routeId !== request.dispatch.routeRole
    || result.accelerator !== request.dispatch.accelerator
    || request.operationId !== 'tool.sam3_1.segment_and_track_subject.v1'
    || scope.ownerUserId !== payload.canonicalScope.ownerUserId
    || scope.workspaceId !== payload.canonicalScope.workspaceId
    || scope.projectId !== payload.canonicalScope.projectId
    || scope.editSessionId !== payload.canonicalScope.editSessionId
    || scope.editPlanVersionId !== payload.canonicalScope.planVersionId
    || scope.approvedPlanSnapshotId
      !== payload.canonicalScope.approvedSnapshotRef!.id
    || scope.approvedPlanSnapshotHash
      !== payload.canonicalScope.approvedSnapshotRef!.contentHash
    || scope.outputId !== payload.canonicalScope.outputId
    || scope.sceneId !== payload.requestedSceneId
    || media.canonicalSourceStartFrameInclusive
      !== payload.requestedRange.startFrame
    || media.canonicalSourceEndFrameInclusive + 1
      !== payload.requestedRange.endFrameExclusive
    || !sameDomainAndBackendRef(payload.sourcePrivateArtifactRef,
      media.finalizedSourceArtifactRef)
    || !sameDomainAndBackendRef(payload.sourceFrameMappingRef,
      media.sourceFrameRangeMappingRef)
    || payload.confirmedOutputFrameDigestSha256
      !== stripSha(context.confirmedOutputFrameRef.contentHash)
    || binding.targetSkillKey !== 'track_all'
    || binding.operationId !== 'tool.sam3_1.segment_and_track_subject.v1'
    || backendCall.requestedBy.kind !== 'skill'
    || backendCall.requestedBy.skillKey !== 'captions'
    || backendSupport === null
    || backendSupport.requestingSkillKey !== 'captions'
    || backendSupport.requiredCapability !== 'track_all'
    || backendSupport.requestedJobType !== 'track_subject_geometry'
    || backendSupport.purposeCode !== 'produce_exact_subject_geometry'
    || backendSupport.scope.scopeType !== 'scene'
    || backendSupport.scope.sceneId !== payload.requestedSceneId
    || backendSupport.scope.outputId !== payload.canonicalScope.outputId
    || backendSupport.scope.authorizedRange.startFrame
      !== payload.requestedRange.startFrame
    || backendSupport.scope.authorizedRange.endFrameExclusive
      !== payload.requestedRange.endFrameExclusive
    || !sameDomainAndBackendRef(payload.sourcePrivateArtifactRef,
      backendSupport.scope.sourceArtifactRef)
    || sceneEvidence.invocationId !== input.invocationId
    || !sameDomainRef(sceneEvidence.taskRef, taskDomainRef(task))
    || !sameDomainRef(sceneEvidence.runtimeResultAdmissionRef,
      backendResultRef(result))
    || !sameCaptionScope(sceneEvidence.canonicalScope,
      payload.canonicalScope)
    || !sameDomainRef(sceneEvidence.sourcePrivateArtifactRef,
      payload.sourcePrivateArtifactRef)
    || !sameDomainRef(sceneEvidence.sourceFrameMappingRef,
      payload.sourceFrameMappingRef)
    || sceneEvidence.confirmedOutputFrameRef.contentHash
      !== payload.confirmedOutputFrameDigestSha256
    || !sameRange(sceneEvidence.requestedRange, payload.requestedRange)
    || sceneEvidence.cache.cacheIdentityDigestSha256
      !== payload.cachePolicy.cacheIdentityDigestSha256
    || sceneEvidence.subjectEvidence.length
      !== payload.subjectRequests.length
    || sceneEvidence.subjectEvidence.some((subject) => {
      const requested = payload.subjectRequests.find((item) =>
        item.subjectRequestId === subject.subjectRequestId)
      return !requested
        || subject.subjectRole !== requested.subjectRole
        || (requested.maskRequired
          && (!subject.maskSequenceRef
            || !sameDomainRef(subject.maskSequenceRef, resultMaskRef)))
        || (!requested.maskRequired && subject.maskSequenceRef !== null)
        || !sameDomainRef(subject.trackManifestRef, resultManifestRef)
        || requested.anchorRequired !== (subject.anchorManifestRef !== null)
    })
  ) throw new Error(
    'Caption Track All request differs from canonical SAM 3.1 evidence.',
  )
}

function createCaptionPacket(input: {
  payload: CaptionTrackAllSupportPayload
  supportRequest: SkillSupportRequest
  resultRef: CaptionDomainRef
  sceneEvidence: CanonicalTrackAllSam31CaptionSceneEvidence
}): CaptionTrackAllEvidencePacket {
  const payload = input.payload
  const sceneEvidence = input.sceneEvidence
  const withoutDigest: Omit<
    CaptionTrackAllEvidencePacket,
    'packetDigestSha256'
  > = {
    schemaVersion: CAPTION_TRACK_ALL_EVIDENCE_PACKET_VERSION,
    packetId:
      `caption.track-all.packet.${sceneEvidence.evidenceDigestSha256.slice(0, 32)}`,
    supportRequestRef: requestRef(input.supportRequest),
    supportPayloadRef: supportPayloadRef(payload),
    canonicalScope: structuredClone(payload.canonicalScope),
    purpose: payload.purpose,
    pictureLockRef: structuredClone(payload.pictureLockRef),
    finishReadinessRef: structuredClone(payload.finishReadinessRef),
    visualOccupancyManifestRef:
      structuredClone(payload.visualOccupancyManifestRef),
    sourcePrivateArtifactRef: structuredClone(payload.sourcePrivateArtifactRef),
    sourceFrameMappingRef: structuredClone(payload.sourceFrameMappingRef),
    confirmedOutputFrameDigestSha256:
      payload.confirmedOutputFrameDigestSha256,
    requestedSceneId: payload.requestedSceneId,
    requestedRange: structuredClone(payload.requestedRange),
    producerSkillKey: 'track_all',
    selectedSegmentationRoute: 'sam3_1',
    canonicalSam31OperationId:
      'tool.sam3_1.segment_and_track_subject.v1',
    trackAllResultRef: structuredClone(sceneEvidence.trackAllResultRef),
    authenticatedReadResultRef: sceneEvidenceRef(sceneEvidence),
    canonicalSam31RuntimeResultAdmissionRef: structuredClone(input.resultRef),
    subjectEvidence: structuredClone(sceneEvidence.subjectEvidence),
    cache: structuredClone(sceneEvidence.cache),
    evidenceMode: 'authenticated_private_runtime',
    exactCanonicalScopeReread: true,
    exactPrivateArtifactsReread: true,
    exactSam31ResultLineageVerified: true,
    actualSam31GpuExecutionObserved: true,
    actualOpenCvExecutionObserved: true,
    actualKorniaExecutionObserved:
      sceneEvidence.actualKorniaExecutionObserved,
    independentMaskArtifactQaCompleted: true,
    privateVisualReviewCompleted: true,
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
    packetDigestSha256: contractDigest(withoutDigest, 'packetDigestSha256'),
  }, { payload, supportRequest: input.supportRequest })
}

function createCaptionAdmission(input: {
  payload: CaptionTrackAllSupportPayload
  supportRequest: SkillSupportRequest
  packet: CaptionTrackAllEvidencePacket
}): CaptionTrackAllAdmission {
  const subjectAdmissions = input.packet.subjectEvidence.map((subject) => {
    const request = input.payload.subjectRequests.find((item) =>
      item.subjectRequestId === subject.subjectRequestId)!
    const blockers = subjectBlockers(
      subject,
      request,
      input.payload.qaThresholds,
    )
    return {
      subjectRequestId: subject.subjectRequestId,
      subjectEvidenceId: subject.subjectEvidenceId,
      qaPassed: blockers.length === 0,
      maskSequenceRef: subject.maskSequenceRef,
      trackManifestRef: subject.trackManifestRef,
      anchorManifestRef: subject.anchorManifestRef,
      blockerCodes: blockers,
    }
  })
  const passed = subjectAdmissions.every((item) => item.qaPassed)
  const withoutDigest: Omit<CaptionTrackAllAdmission,
    'admissionDigestSha256'> = {
    schemaVersion: CAPTION_TRACK_ALL_ADMISSION_VERSION,
    admissionId:
      `caption.track-all.admission.${input.packet.packetDigestSha256.slice(0, 32)}`,
    canonicalScope: structuredClone(input.payload.canonicalScope),
    supportRequestRef: requestRef(input.supportRequest),
    evidencePacketRef: packetRef(input.packet),
    requestedSceneId: input.payload.requestedSceneId,
    subjectAdmissions,
    disposition: passed
      ? 'admitted_for_caption_scene_graph'
      : 'blocked_temporal_qa',
    textBehindSubjectAllowed:
      passed && input.payload.purpose === 'subject_occlusion',
    objectAnchorAllowed:
      passed && input.payload.purpose !== 'subject_occlusion',
    selectedFallback: passed ? 'none' : 'safe_top_plane',
    cacheReuseAccepted:
      input.packet.cache.disposition === 'exact_cache_reuse',
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
    admissionDigestSha256:
      contractDigest(withoutDigest, 'admissionDigestSha256'),
  }, {
    packet: input.packet,
    payload: input.payload,
    supportRequest: input.supportRequest,
  })
}

function createRecord(input: {
  supportRequest: SkillSupportRequest
  supportPayload: CaptionTrackAllSupportPayload
  backendTrackAllCallRef: CaptionDomainRef
  backendTrackAllSupportRequestRef: CaptionDomainRef
  sam31TaskRef: CaptionDomainRef
  sam31RuntimeResultAdmissionRef: CaptionDomainRef
  trackAllSceneQaAuthorityRef: CaptionDomainRef
  trackAllSceneEvidenceRef: CaptionDomainRef
  captionEvidencePacket: CaptionTrackAllEvidencePacket
  captionAdmission: CaptionTrackAllAdmission
  authenticatedOwnerProjection:
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
}): CanonicalCaptionTrackAllAuthenticatedEvidenceRecord {
  const withoutDigest: Omit<
    CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
    'recordDigestSha256'
  > = {
    schemaVersion:
      CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
    recordId:
      `caption.track-all.record.${input.captionEvidencePacket.packetDigestSha256.slice(0, 32)}`,
    originalCallRef: structuredClone(input.supportRequest.originalCallRef),
    supportRequestRef: requestRef(input.supportRequest),
    supportRequest: structuredClone(input.supportRequest),
    supportPayload: structuredClone(input.supportPayload),
    backendTrackAllCallRef: structuredClone(input.backendTrackAllCallRef),
    backendTrackAllSupportRequestRef:
      structuredClone(input.backendTrackAllSupportRequestRef),
    sam31TaskRef: structuredClone(input.sam31TaskRef),
    sam31RuntimeResultAdmissionRef:
      structuredClone(input.sam31RuntimeResultAdmissionRef),
    trackAllSceneQaAuthorityRef:
      structuredClone(input.trackAllSceneQaAuthorityRef),
    trackAllSceneEvidenceRef:
      structuredClone(input.trackAllSceneEvidenceRef),
    captionEvidencePacket: structuredClone(input.captionEvidencePacket),
    captionAdmission: structuredClone(input.captionAdmission),
    authenticatedOwnerProjection:
      structuredClone(input.authenticatedOwnerProjection),
    authenticatedPrincipalVerified: true,
    priorCallAndSupportRequestExactReread: true,
    backendTrackAllCallAndSupportRequestExactReread: true,
    distinctCaptionAndBackendSupportWireIdentitiesPreserved: true,
    sam31TaskAndResultExactReread: true,
    taskLevelSceneQaAuthorityExactReread: true,
    independentSceneEvidenceExactReread: true,
    exactCaptionScopeOutputSceneRangeSourceAndFrameBindingVerified: true,
    ownerProjectionCreateOnlyPersisted: true,
    evidenceRecordCreateOnlyPersisted: true,
    browserLocalStateUsed: false,
    rawMaskMediaBytesPathsUrlsOrCredentialsAccepted: false,
    directPeerDispatchPerformed: false,
    runtimeExecutionPerformedByBridge: false,
    timelineMutationPerformed: false,
    runtimeExecutionAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    costOrBillingAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord({
    ...withoutDigest,
    recordDigestSha256: contractDigest(withoutDigest, 'recordDigestSha256'),
  })
}

export function parseCaptionTrackAllSupportRequest(
  value: unknown,
  payload: CaptionTrackAllSupportPayload,
): SkillSupportRequest {
  const request = parseSkillSupportRequest(value)
  const embeddedPayload = parseCaptionTrackAllSupportPayload(
    request.typedPayload,
  )
  if (
    request.requestingSkillKey !== 'captions'
    || request.targetSkillKey !== 'track_all'
    || request.reasonCode !== `caption_track_all.${payload.purpose}.required`
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0] !== 'track_all_mask_binding'
    || request.typedPayloadType !== payload.schemaVersion
    || !sameDomainRef(supportPayloadRef(embeddedPayload),
      supportPayloadRef(payload))
    || !supportScopeMatches(request.canonicalScope, payload)
  ) throw new Error('Caption Track All support request is invalid.')
  return freeze(request)
}

function subjectBlockers(
  subject: CaptionTrackAllSubjectEvidence,
  request: CaptionTrackAllSupportPayload['subjectRequests'][number],
  threshold: CaptionTrackAllSupportPayload['qaThresholds'],
): string[] {
  const qa = subject.temporalQa
  return [
    ...(qa.measuredFrameCount !== qa.expectedFrameCount
      ? ['caption_track_all.frame_count_mismatch'] : []),
    ...(!qa.completeRequestedRangeCoverage
      ? ['caption_track_all.incomplete_range_coverage'] : []),
    ...(qa.emptyMaskFrameCount > threshold.emptyMaskFrameCountAllowed
      ? ['caption_track_all.empty_mask_frame'] : []),
    ...(qa.fullFrameMaskCount > threshold.fullFrameMaskCountAllowed
      ? ['caption_track_all.full_frame_mask'] : []),
    ...(qa.minimumBinaryIntersectionOverUnionBasisPoints
      < threshold.minimumBinaryIntersectionOverUnionBasisPoints
      ? ['caption_track_all.mask_overlap_low'] : []),
    ...(qa.maximumNormalizedCentroidShiftBasisPoints
      > threshold.maximumNormalizedCentroidShiftBasisPoints
      ? ['caption_track_all.centroid_jitter_high'] : []),
    ...(qa.maximumBoundaryDisagreementBasisPoints
      > threshold.maximumBoundaryDisagreementBasisPoints
      ? ['caption_track_all.boundary_disagreement_high'] : []),
    ...(qa.maximumAlphaFlickerBasisPoints
      > threshold.maximumAlphaFlickerBasisPoints
      ? ['caption_track_all.alpha_flicker_high'] : []),
    ...(qa.minimumEdgeQualityBasisPoints
      < threshold.minimumEdgeQualityBasisPoints
      ? ['caption_track_all.edge_quality_low'] : []),
    ...(qa.minimumSubjectCoverageBasisPoints
      < threshold.minimumSubjectCoverageBasisPoints
      ? ['caption_track_all.subject_coverage_low'] : []),
    ...(qa.identitySwapCount > threshold.identitySwapCountAllowed
      ? ['caption_track_all.identity_swap'] : []),
    ...(qa.lostAnchorFrameCount > threshold.lostAnchorFrameCountAllowed
      ? ['caption_track_all.anchor_lost'] : []),
    ...(request.maskRequired && subject.maskSequenceRef === null
      ? ['caption_track_all.mask_missing'] : []),
    ...(request.anchorRequired && subject.anchorManifestRef === null
      ? ['caption_track_all.anchor_missing'] : []),
  ]
}

function supportScopeMatches(
  scope: SkillCanonicalScope,
  payload: CaptionTrackAllSupportPayload,
): boolean {
  const expected = payload.canonicalScope
  return scope.ownerUserId === expected.ownerUserId
    && scope.workspaceId === expected.workspaceId
    && scope.projectId === expected.projectId
    && scope.editSessionId === expected.editSessionId
    && sameNullableDomainRef(scope.approvedSnapshotRef,
      expected.approvedSnapshotRef)
    && scope.outputId === expected.outputId
    && scope.sceneId === expected.sceneId
    && scope.boundaryId === null
    && stableAuthorityStringify(scope.authorizedFrameRanges)
      === stableAuthorityStringify(expected.authorizedFrameRanges)
}

function captionPacketArtifactRef(
  packet: CaptionTrackAllEvidencePacket,
  request: SkillSupportRequest,
): SkillArtifactRef {
  return {
    id: packet.packetId,
    version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256,
    artifactType: 'track_all_mask_binding',
    producerSkillKey: 'track_all',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: requestRef(request),
  }
}

function taskDomainRef(
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>,
): CaptionDomainRef {
  return { id: task.taskId, version: task.schemaVersion,
    contentHash: task.taskRecordHash }
}

function backendResultRef(
  result: ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>,
): CaptionDomainRef {
  return { id: result.resultAdmissionId, version: result.schemaVersion,
    contentHash: result.resultAdmissionHash }
}

function sceneEvidenceRef(
  evidence: CanonicalTrackAllSam31CaptionSceneEvidence,
): CaptionDomainRef {
  return { id: evidence.evidenceId, version: evidence.schemaVersion,
    contentHash: evidence.evidenceDigestSha256 }
}

function sceneQaAuthorityRef(
  authority: CanonicalTrackAllSam31CaptionSceneQaAuthority,
): CaptionDomainRef {
  return { id: authority.authorityId, version: authority.schemaVersion,
    contentHash: authority.authorityDigestSha256 }
}

function supportPayloadRef(
  payload: CaptionTrackAllSupportPayload,
): CaptionDomainRef {
  return { id: payload.payloadId, version: payload.schemaVersion,
    contentHash: payload.payloadDigestSha256 }
}

function requestRef(request: SkillSupportRequest): SkillContractRef {
  return { id: request.requestId, version: request.schemaVersion,
    contentHash: request.requestDigestSha256 }
}

function callRef(call: {
  callId: string
  schemaVersion: string
  callDigestSha256: string
}): SkillContractRef {
  return { id: call.callId, version: call.schemaVersion,
    contentHash: call.callDigestSha256 }
}

function packetRef(packet: CaptionTrackAllEvidencePacket): CaptionDomainRef {
  return { id: packet.packetId, version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256 }
}

function domainRefFromBackend(
  value: z.infer<typeof backendRefSchema>,
): CaptionDomainRef {
  return { id: value.id, version: String(value.version),
    contentHash: stripSha(value.contentHash) }
}

function backendRef(id: string, hash: string) {
  return backendRefSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameBackendRef(
  left: z.infer<typeof backendRefSchema>,
  right: z.infer<typeof backendRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function skillRefFromDomain(value: CaptionDomainRef): SkillContractRef {
  return { ...value }
}

function sameDomainAndBackendRef(
  left: CaptionDomainRef,
  right: z.infer<typeof backendRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === String(right.version)
    && left.contentHash === stripSha(right.contentHash)
}

function sameCaptionScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameNullableDomainRef(
  left: SkillContractRef | null,
  right: CaptionDomainRef | null,
): boolean {
  return left === null || right === null
    ? left === right
    : sameDomainRef(left, right)
}

function sameDomainRef(
  left: CaptionDomainRef,
  right: CaptionDomainRef,
): boolean {
  return domainRefKey(left) === domainRefKey(right)
}

function sameSkillRef(left: SkillContractRef, right: SkillContractRef) {
  return domainRefKey(left) === domainRefKey(right)
}

function sameArtifactRef(
  left: SkillArtifactRef,
  right: SkillArtifactRef,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameRange(
  left: CaptionDomainFrameRange,
  right: CaptionDomainFrameRange,
): boolean {
  return left.startFrame === right.startFrame
    && left.endFrameExclusive === right.endFrameExclusive
}

function rangeLength(range: CaptionDomainFrameRange): number {
  return range.endFrameExclusive - range.startFrame
}

function domainRefKey(value: CaptionDomainRef | SkillContractRef): string {
  return `${value.id}\u0000${value.version}\u0000${value.contentHash}`
}

function stripSha(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function contractDigest(value: unknown, omittedField: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>,
    omittedField,
  )
}

function freeze<T>(value: T): T {
  return Object.freeze(structuredClone(value))
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Canonical Caption Track All record size is invalid.')
  }
  return body
}

async function persistExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: T,
  parse: (value: unknown) => T,
): Promise<'created' | 'identical_replay'> {
  const body = serialize(value)
  const disposition = await port.createOnly({
    objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(objectPath)
  if (!reread || !Buffer.isBuffer(reread) || !reread.equals(body)) {
    throw new Error('Canonical Caption Track All exact reread failed.')
  }
  parse(JSON.parse(reread.toString('utf8')) as unknown)
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Canonical Caption Track All record bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('Canonical Caption Track All record JSON is invalid.')
  }
  const parsed = parse(value)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new Error('Canonical Caption Track All canonical bytes differ.')
  }
  return parsed
}

function scenePath(prefix: string, ref: CaptionDomainRef): string {
  return `${prefix}/${pathDigest(ref)}.json`
}

function recordPath(prefix: string, ref: SkillContractRef): string {
  return `${prefix}/${pathDigest(ref)}.json`
}

function pathDigest(value: unknown): string {
  return sha256AuthorityValue(value)
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Canonical Caption Track All object port is unavailable.')
  }
}

function assertPorts(input: {
  supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
  taskContextRepository: Pick<
    CanonicalSam31GpuTaskContextRepository,
    'rereadTaskContext'
  >
  resultStore: Pick<
    CanonicalSam31GpuRuntimeResultStore,
    'rereadResultAdmission'
  >
  sceneQaAuthorityReadPort:
    CanonicalTrackAllSam31CaptionSceneQaAuthorityReadPort
  sceneEvidenceRepository: CanonicalTrackAllSam31CaptionSceneEvidenceRepository
  evidenceRepository: CanonicalCaptionTrackAllEvidenceRepository
}): void {
  if (!input.supportResumeRepository
    || typeof input.supportResumeRepository.rereadCallResultPair !== 'function'
    || typeof input.supportResumeRepository
      .persistAuthenticatedOwnerProjectionCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      .rereadAuthenticatedOwnerProjection !== 'function'
    || typeof input.supportResumeRepository
      .persistCallResultPairCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      .persistResumeRecordCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      .rereadResumeRecordByResumedCall !== 'function'
    || typeof input.taskStore?.rereadTask !== 'function'
    || typeof input.taskContextRepository?.rereadTaskContext !== 'function'
    || typeof input.resultStore?.rereadResultAdmission !== 'function'
    || typeof input.sceneQaAuthorityReadPort?.rereadAuthority !== 'function'
    || typeof input.sceneEvidenceRepository?.rereadByRef !== 'function'
    || typeof input.evidenceRepository?.persistCreateOnly !== 'function'
    || typeof input.evidenceRepository?.rereadBySupportRequestRef
      !== 'function') {
    throw new Error('Canonical Caption Track All ports are unavailable.')
  }
}
