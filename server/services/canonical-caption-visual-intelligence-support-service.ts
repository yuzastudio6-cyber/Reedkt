import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import {
  CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION,
  CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION,
  type CaptionVisualEvidenceObservation,
  type CaptionVisualIntelligenceEvidencePacket,
  type CaptionVisualIntelligenceSupportPayload,
  type CaptionVisualObservationRole,
} from '../../src/types/caption-visual-intelligence-support'
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
import type {
  VisualIntelligenceAuthenticatedReadResult,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceFrameRange,
  VisualIntelligenceReport,
  VisualIntelligenceRequest,
  VisualIntelligenceSpatialEvidence,
} from '../../src/types/visual-intelligence'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
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
  createVisualIntelligenceAuthenticatedReadRequest,
  parseVisualIntelligenceAuthenticatedReadResult,
  type VisualIntelligenceAuthenticatedReadService,
} from '../visual-intelligence/visual-intelligence-authenticated-read-service'
import type {
  VisualIntelligenceCanonicalRequestPackageStore,
} from '../visual-intelligence/visual-intelligence-canonical-request-package-store'
import {
  parseVisualIntelligenceReport,
  parseVisualIntelligenceRequest,
  parseVisualIntelligenceSpatialEvidence,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligenceSpatialEvidenceRepository,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'

export const CANONICAL_CAPTION_VISUAL_INTELLIGENCE_SUPPORT_SERVICE_VERSION =
  'canonical-caption-visual-intelligence-support-service-v1' as const
export const CANONICAL_CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-visual-intelligence-evidence-repository-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/caption-visual-intelligence-support'
const MAX_RECORD_BYTES = 16 * 1024 * 1024
const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
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
const visualRefSchema: z.ZodType<VisualIntelligenceEvidenceRef> = z.object({
  id: z.string().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  version: z.number().int().positive().max(1_000_000),
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
const roles = [
  'safe_candidate', 'face', 'eyes', 'mouth', 'hair', 'hand', 'gesture',
  'speaker', 'product', 'important_object', 'screen_text', 'map_label',
  'chart_label', 'browser_highlight', 'lower_third', 'fact_safety_note',
  'cta', 'broll_panel', 'living_frame', 'platform_ui', 'crop_risk',
] as const satisfies readonly CaptionVisualObservationRole[]
const roleSchema = z.enum(roles)
const rectSchema = z.object({
  x: z.number().int().min(0).max(10_000),
  y: z.number().int().min(0).max(10_000),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
}).strict().superRefine((rect, context) => {
  if (rect.x + rect.width > 10_000 || rect.y + rect.height > 10_000) {
    context.addIssue({ code: 'custom', message: 'Region exceeds output frame.' })
  }
})
const payloadSchema: z.ZodType<CaptionVisualIntelligenceSupportPayload> =
  z.object({
    schemaVersion: z.literal(
      CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION,
    ),
    payloadId: safeKey,
    payloadDigestSha256: rawSha256,
    purpose: z.enum(['final_frame_occupancy', 'rendered_caption_inspection']),
    canonicalScope: scopeSchema,
    pictureLockRef: domainRefSchema,
    finishReadinessRef: domainRefSchema,
    confirmedOutputFrame: z.object({
      outputId: safeKey,
      width: z.number().int().min(320).max(16_384),
      height: z.number().int().min(180).max(16_384),
      aspectRatioNumerator: z.number().int().positive().max(16_384),
      aspectRatioDenominator: z.number().int().positive().max(16_384),
      fpsNumerator: z.number().int().positive().max(240_000),
      fpsDenominator: z.number().int().positive().max(10_000),
      confirmedOutputFrameDigestSha256: rawSha256,
    }).strict(),
    sourcePrivateArtifactRef: domainRefSchema,
    canonicalLayoutOccupancyRef: domainRefSchema,
    requestedSceneId: safeKey,
    requestedRange: frameRangeSchema,
    requiredObservationRoles: z.array(roleSchema).min(1).max(roles.length),
    expectedOutcomeRefs: z.array(domainRefSchema).min(1).max(512),
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

const observationSchema: z.ZodType<CaptionVisualEvidenceObservation> = z.object({
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

const packetSchema: z.ZodType<CaptionVisualIntelligenceEvidencePacket> =
  z.object({
    schemaVersion: z.literal(
      CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION,
    ),
    packetId: safeKey,
    packetDigestSha256: rawSha256,
    supportRequestRef: skillRefSchema,
    supportPayloadRef: domainRefSchema,
    canonicalScope: scopeSchema,
    purpose: z.enum(['final_frame_occupancy', 'rendered_caption_inspection']),
    sourcePrivateArtifactRef: domainRefSchema,
    canonicalLayoutOccupancyRef: domainRefSchema,
    pictureLockRef: domainRefSchema,
    finishReadinessRef: domainRefSchema,
    confirmedOutputFrameDigestSha256: rawSha256,
    requestedSceneId: safeKey,
    requestedRange: frameRangeSchema,
    visualIntelligenceContractVersion: z.literal('visual-intelligence-contract-v1'),
    visualIntelligenceReportRef: visualRefSchema,
    authenticatedReadResultRef: domainRefSchema,
    reportOperation: z.literal('inspect_edit'),
    reportProfile: z.literal('caption_layout_qa'),
    reportDisposition: z.enum([
      'pass', 'pass_with_warnings', 'needs_revision', 'blocked',
    ]),
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
    evidenceMode: z.literal('authenticated_private_runtime'),
    canonicalReportRereadVerified: z.literal(true),
    exactCanonicalScopeVerified: z.literal(true),
    actualVisualInferenceObserved: z.literal(true),
    actualRenderedPixelsInspected: z.boolean(),
    immutableReportReread: z.literal(true),
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

const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  ),
  recordId: safeKey,
  recordDigestSha256: rawSha256,
  originalCallRef: skillRefSchema,
  supportRequestRef: skillRefSchema,
  supportRequest: z.unknown(),
  supportPayload: z.unknown(),
  visualIntelligenceRequestRef: visualRefSchema,
  visualIntelligenceReportRef: visualRefSchema,
  visualIntelligenceSpatialEvidenceRef: visualRefSchema,
  authenticatedReadResultRef: skillRefSchema,
  captionEvidencePacket: z.unknown(),
  authenticatedOwnerProjection: z.unknown(),
  authenticatedPrincipalVerified: z.literal(true),
  priorCallAndSupportRequestExactReread: z.literal(true),
  canonicalVisualIntelligenceRequestExactReread: z.literal(true),
  immutableReportExactReread: z.literal(true),
  immutableSpatialEvidenceExactReread: z.literal(true),
  exactCaptionScopeOutputSceneRangeAndArtifactBindingVerified: z.literal(true),
  exactExpectedOutcomeLineageVerified: z.literal(true),
  exactRequiredObservationRoleCoverageVerified: z.literal(true),
  ownerProjectionCreateOnlyPersisted: z.literal(true),
  evidenceRecordCreateOnlyPersisted: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  rawChatMediaBytesPathsUrlsOrCredentialsAccepted: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallPerformedByBridge: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  runtimeExecutionAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  costOrBillingAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export interface CanonicalCaptionVisualIntelligenceEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly record:
      CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord
  }): Promise<'created' | 'identical_replay'>
  rereadBySupportRequestRef(input: {
    readonly supportRequestRef: SkillContractRef
  }): Promise<CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord | null>
}

export interface CanonicalCaptionVisualIntelligenceSupportService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_VISUAL_INTELLIGENCE_SUPPORT_SERVICE_VERSION
  projectAuthenticatedEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly priorCallRef: SkillContractRef
    readonly selectedSupportRequestRef: SkillContractRef
    readonly visualIntelligenceRequestRef: VisualIntelligenceEvidenceRef
    readonly visualIntelligenceReportRef: VisualIntelligenceEvidenceRef
  }): Promise<CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord>
  projectAndResumeAuthenticatedEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly priorCallRef: SkillContractRef
    readonly selectedSupportRequestRef: SkillContractRef
    readonly visualIntelligenceRequestRef: VisualIntelligenceEvidenceRef
    readonly visualIntelligenceReportRef: VisualIntelligenceEvidenceRef
  }): Promise<{
    readonly evidenceRecord:
      CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord
    readonly resumeRecord: CanonicalSpecialistSupportResumeRecord
  }>
}

export function parseCaptionVisualIntelligenceSupportPayload(
  value: unknown,
): CaptionVisualIntelligenceSupportPayload {
  assertClosedContractTree(value, 'Caption Visual Intelligence support payload')
  const payload = payloadSchema.parse(value)
  const divisor = gcd(
    payload.confirmedOutputFrame.width,
    payload.confirmedOutputFrame.height,
  )
  if (
    payload.canonicalScope.approvedSnapshotRef === null
    || payload.canonicalScope.outputId !== payload.confirmedOutputFrame.outputId
    || payload.canonicalScope.sceneId !== payload.requestedSceneId
    || payload.confirmedOutputFrame.aspectRatioNumerator
      !== payload.confirmedOutputFrame.width / divisor
    || payload.confirmedOutputFrame.aspectRatioDenominator
      !== payload.confirmedOutputFrame.height / divisor
    || !payload.canonicalScope.authorizedFrameRanges.some((range) =>
      rangeWithin(payload.requestedRange, range))
    || new Set(payload.requiredObservationRoles).size
      !== payload.requiredObservationRoles.length
    || (payload.purpose === 'final_frame_occupancy'
      && !payload.requiredObservationRoles.includes('safe_candidate'))
    || new Set(payload.expectedOutcomeRefs.map(domainRefKey)).size
      !== payload.expectedOutcomeRefs.length
    || payload.renderedInspectionPolicy.actualRenderedPixelsRequired
      !== (payload.purpose === 'rendered_caption_inspection')
    || payload.payloadDigestSha256 !== contractDigest(
      payload,
      'payloadDigestSha256',
    )
  ) throw new Error('Caption Visual Intelligence support payload is invalid.')
  return freeze(payload)
}

export function parseCaptionVisualIntelligenceEvidencePacket(
  value: unknown,
  input: {
    readonly payload: unknown
    readonly supportRequest: unknown
  },
): CaptionVisualIntelligenceEvidencePacket {
  assertClosedContractTree(value, 'Caption Visual Intelligence evidence packet')
  const payload = parseCaptionVisualIntelligenceSupportPayload(input.payload)
  const supportRequest = parseCaptionSupportRequest(
    input.supportRequest,
    payload,
  )
  const packet = packetSchema.parse(value)
  const requiredRoles = new Set(payload.requiredObservationRoles)
  if (
    !sameSkillRef(packet.supportRequestRef, supportRequestRef(supportRequest))
    || !sameDomainRef(packet.supportPayloadRef, supportPayloadRef(payload))
    || !sameCaptionScope(packet.canonicalScope, payload.canonicalScope)
    || packet.purpose !== payload.purpose
    || !sameDomainRef(packet.sourcePrivateArtifactRef,
      payload.sourcePrivateArtifactRef)
    || !sameDomainRef(packet.canonicalLayoutOccupancyRef,
      payload.canonicalLayoutOccupancyRef)
    || !sameDomainRef(packet.pictureLockRef, payload.pictureLockRef)
    || !sameDomainRef(packet.finishReadinessRef, payload.finishReadinessRef)
    || packet.confirmedOutputFrameDigestSha256
      !== payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256
    || packet.requestedSceneId !== payload.requestedSceneId
    || !sameRange(packet.requestedRange, payload.requestedRange)
    || !sameRange(packet.coverage.requestedRange, payload.requestedRange)
    || packet.actualRenderedPixelsInspected
      !== (payload.purpose === 'rendered_caption_inspection')
    || packet.observations.some((observation) =>
      observation.sceneId !== payload.requestedSceneId
      || !rangeWithin(observation.frameRange, payload.requestedRange)
      || new Set(observation.findingIds).size !== observation.findingIds.length
      || observation.findingIds.some((findingId) =>
        !packet.findingIds.includes(findingId))
      || new Set(observation.evidenceRefs.map(visualRefKey)).size
        !== observation.evidenceRefs.length)
    || new Set(packet.observations.map((item) => item.observationId)).size
      !== packet.observations.length
    || new Set(packet.findingIds).size !== packet.findingIds.length
    || [...requiredRoles].some((role) =>
      !packet.observations.some((observation) => observation.role === role))
    || packet.coverage.incompleteRanges.length !== 0
    || !packet.coverage.completeRequestedRangeCoverage
    || !rangesCoverExactly(packet.coverage.analyzedRanges, payload.requestedRange)
    || [
      ...packet.coverage.analyzedRanges,
      ...packet.coverage.targetedFollowupRanges,
    ].some((range) => !rangeWithin(range, payload.requestedRange))
    || packet.packetDigestSha256 !== contractDigest(
      packet,
      'packetDigestSha256',
    )
  ) throw new Error('Caption Visual Intelligence evidence packet is invalid.')
  return freeze(packet)
}

export function parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord(
  value: unknown,
): CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord {
  assertClosedContractTree(value, 'Canonical Caption Visual Intelligence record')
  const envelope = recordEnvelopeSchema.parse(value)
  const supportPayload = parseCaptionVisualIntelligenceSupportPayload(
    envelope.supportPayload,
  )
  const supportRequest = parseCaptionSupportRequest(
    envelope.supportRequest,
    supportPayload,
  )
  const packet = parseCaptionVisualIntelligenceEvidencePacket(
    envelope.captionEvidencePacket,
    { payload: supportPayload, supportRequest },
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
    authenticatedOwnerProjection: projection,
  } as CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord
  const packetArtifact = captionPacketArtifactRef(packet, supportRequest)
  if (
    !sameSkillRef(record.originalCallRef, supportRequest.originalCallRef)
    || !sameSkillRef(record.supportRequestRef,
      supportRequestRef(supportRequest))
    || !sameVisualRef(record.visualIntelligenceReportRef,
      packet.visualIntelligenceReportRef)
    || !sameSkillRef(record.authenticatedReadResultRef,
      packet.authenticatedReadResultRef as SkillContractRef)
    || !sameSkillRef(projection.originalCallRef, record.originalCallRef)
    || !sameSkillRef(projection.supportRequestRef, record.supportRequestRef)
    || projection.ownerKey !== 'visual_intelligence'
    || projection.artifactRefs.length !== 1
    || !sameArtifactRef(projection.artifactRefs[0], packetArtifact)
    || record.recordDigestSha256 !== contractDigest(
      record,
      'recordDigestSha256',
    )
  ) throw new Error('Canonical Caption Visual Intelligence record mismatch.')
  return freeze(record)
}

export function createCanonicalCaptionVisualIntelligenceEvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionVisualIntelligenceEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalCaptionVisualIntelligenceEvidenceRepository = {
    schemaVersion:
      CANONICAL_CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION,
    async persistCreateOnly({ record: value }: {
      readonly record:
        CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord
    }) {
      const record =
        parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord(
          value,
        )
      const body = serialize(record)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, record.supportRequestRef),
        body,
        contentSha256: rawDigest(body),
      })
      const reread = await readRecord(
        input.objectPort,
        recordPath(prefix, record.supportRequestRef),
      )
      if (!reread || reread.recordDigestSha256 !== record.recordDigestSha256) {
        throw new Error('Caption Visual Intelligence record reread failed.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadBySupportRequestRef({ supportRequestRef: untrusted }: {
      readonly supportRequestRef: SkillContractRef
    }) {
      assertClosedContractTree(
        untrusted,
        'Caption Visual Intelligence repository request',
      )
      const ref = skillRefSchema.parse(untrusted)
      return readRecord(input.objectPort, recordPath(prefix, ref))
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalCaptionVisualIntelligenceSupportService(input: {
  readonly supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  readonly visualIntelligenceRequestStore: Pick<
    VisualIntelligenceCanonicalRequestPackageStore,
    'rereadCanonicalRequestByRef'
  >
  readonly visualIntelligenceAuthenticatedReadService:
    VisualIntelligenceAuthenticatedReadService
  readonly visualIntelligenceSpatialEvidenceRepository: Pick<
    VisualIntelligenceSpatialEvidenceRepository,
    'readAcceptedSpatialEvidenceByReportRef'
  >
  readonly evidenceRepository:
    CanonicalCaptionVisualIntelligenceEvidenceRepository
  readonly crossSystemExecutionInputReadPort?:
    CanonicalCaptionCrossSystemExecutionInputReadPort
  readonly incomingSupportRequestReadPort?:
    CanonicalCaptionIncomingSupportRequestReadPort
  readonly now?: () => Date
}): CanonicalCaptionVisualIntelligenceSupportService {
  assertPorts(input)
  const service: CanonicalCaptionVisualIntelligenceSupportService = {
    schemaVersion:
      CANONICAL_CAPTION_VISUAL_INTELLIGENCE_SUPPORT_SERVICE_VERSION,
    async projectAuthenticatedEvidence(value: Parameters<
      CanonicalCaptionVisualIntelligenceSupportService[
        'projectAuthenticatedEvidence'
      ]
    >[0]) {
      assertClosedContractTree(value, 'Caption Visual Intelligence bridge input')
      const authenticatedOwnerUserId = safeKey.parse(
        value.authenticatedOwnerUserId,
      )
      const priorCallRef = skillRefSchema.parse(value.priorCallRef)
      const selectedSupportRequestRef = skillRefSchema.parse(
        value.selectedSupportRequestRef,
      )
      const visualIntelligenceRequestRef = visualRefSchema.parse(
        value.visualIntelligenceRequestRef,
      )
      const visualIntelligenceReportRef = visualRefSchema.parse(
        value.visualIntelligenceReportRef,
      )
      const pair = await input.supportResumeRepository.rereadCallResultPair({
        callRef: priorCallRef,
      })
      if (!pair || !sameSkillRef(callRef(pair.call), priorCallRef)) {
        throw new Error('Caption prior call/result pair is unavailable.')
      }
      const selectedSupportRequest = pair.result.supportRequests[0]
      if (
        !selectedSupportRequest
        || !sameSkillRef(
          supportRequestRef(selectedSupportRequest),
          selectedSupportRequestRef,
        )
      ) throw new Error('Caption Visual Intelligence request is not current.')
      const supportPayload = parseCaptionVisualIntelligenceSupportPayload(
        selectedSupportRequest.typedPayload,
      )
      const supportRequest = parseCaptionSupportRequest(
        selectedSupportRequest,
        supportPayload,
      )
      if (
        authenticatedOwnerUserId !== supportPayload.canonicalScope.ownerUserId
      ) throw new Error('Caption authenticated owner scope does not match.')
      const visualRequestValue = await input.visualIntelligenceRequestStore
        .rereadCanonicalRequestByRef({
          requestRef: visualIntelligenceRequestRef,
        })
      if (!visualRequestValue) {
        throw new Error('Canonical Visual Intelligence request is unavailable.')
      }
      const visualRequest = parseVisualIntelligenceRequest(visualRequestValue)
      assertVisualRequestMatchesCaption(supportPayload, visualRequest)
      const readRequest = createVisualIntelligenceAuthenticatedReadRequest({
        requestId: `caption-vi-read-${visualRequest.requestDigestSha256.slice(7, 55)}`,
        scope: visualRequest.scope,
        reportRef: visualIntelligenceReportRef,
      })
      const readResult = parseVisualIntelligenceAuthenticatedReadResult(
        await input.visualIntelligenceAuthenticatedReadService.read({
          authenticatedOwnerUserId,
          request: readRequest,
        }),
      )
      if (readResult.disposition !== 'completed' || !readResult.report) {
        throw new Error('Visual Intelligence authenticated report is unavailable.')
      }
      const report = parseVisualIntelligenceReport(readResult.report)
      const spatialValue = await input
        .visualIntelligenceSpatialEvidenceRepository
        .readAcceptedSpatialEvidenceByReportRef(visualIntelligenceReportRef)
      if (!spatialValue) {
        throw new Error('Visual Intelligence spatial evidence is unavailable.')
      }
      const spatialEvidence = parseVisualIntelligenceSpatialEvidence(
        spatialValue,
      )
      assertVisualEvidenceMatchesCaption({
        payload: supportPayload,
        request: visualRequest,
        report,
        spatialEvidence,
        reportRef: visualIntelligenceReportRef,
      })
      const authenticatedReadResultRef = readResultRef(readResult)
      const packet = createCaptionPacket({
        payload: supportPayload,
        supportRequest,
        report,
        reportRef: visualIntelligenceReportRef,
        spatialEvidence,
        authenticatedReadResultRef,
      })
      const projection =
        createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
          schemaVersion:
            'canonical-authenticated-specialist-support-artifact-projection-v1',
          projectionId:
            `caption.vi.projection.${packet.packetDigestSha256.slice(0, 32)}`,
          originalCallRef: supportRequest.originalCallRef,
          supportRequestRef: supportRequestRef(supportRequest),
          ownerResultRef: authenticatedReadResultRef,
          ownerKey: 'visual_intelligence',
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
          supportRequestRef: supportRequestRef(supportRequest),
        })
      if (
        !projectionReread
        || projectionReread.projectionDigestSha256
          !== projection.projectionDigestSha256
      ) throw new Error('Caption Visual Intelligence projection reread failed.')
      const record = createRecord({
        supportRequest,
        supportPayload,
        visualIntelligenceRequestRef,
        visualIntelligenceReportRef,
        visualIntelligenceSpatialEvidenceRef: spatialEvidenceRef(spatialEvidence),
        authenticatedReadResultRef,
        captionEvidencePacket: packet,
        authenticatedOwnerProjection: projectionReread,
      })
      await input.evidenceRepository.persistCreateOnly({ record })
      const reread = await input.evidenceRepository
        .rereadBySupportRequestRef({
          supportRequestRef: supportRequestRef(supportRequest),
        })
      if (!reread || reread.recordDigestSha256 !== record.recordDigestSha256) {
        throw new Error('Caption Visual Intelligence evidence did not reconcile.')
      }
      return reread
    },
    async projectAndResumeAuthenticatedEvidence(value: Parameters<
      CanonicalCaptionVisualIntelligenceSupportService[
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
                  supportRequestRef: supportRequestRef(resumeSupportRequest),
                })
              if (!exactRecord || exactRecord.recordDigestSha256
                !== evidenceRecord.recordDigestSha256) {
                throw new Error(
                  'Caption Visual Intelligence resume evidence is unavailable.',
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
                canonicalVisualIntelligenceEvidenceRecord: exactRecord,
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

function parseCaptionSupportRequest(
  value: unknown,
  payload: CaptionVisualIntelligenceSupportPayload,
): SkillSupportRequest {
  const request = parseSkillSupportRequest(value)
  const embeddedPayload = parseCaptionVisualIntelligenceSupportPayload(
    request.typedPayload,
  )
  const expectedArtifactType = payload.purpose === 'final_frame_occupancy'
    ? 'caption_visual_intelligence_occupancy_evidence'
    : 'caption_visual_intelligence_rendered_inspection_evidence'
  if (
    request.requestingSkillKey !== 'captions'
    || request.targetSkillKey !== 'visual_intelligence'
    || request.reasonCode !== `caption_visual.${payload.purpose}.required`
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0] !== expectedArtifactType
    || request.typedPayloadType !== payload.schemaVersion
    || !sameDomainRef(supportPayloadRef(embeddedPayload),
      supportPayloadRef(payload))
    || !supportScopeMatches(request.canonicalScope, payload)
  ) throw new Error('Caption Visual Intelligence support request is invalid.')
  return freeze(request)
}

function assertVisualRequestMatchesCaption(
  payload: CaptionVisualIntelligenceSupportPayload,
  request: VisualIntelligenceRequest,
): void {
  const approvedSnapshotRef = payload.canonicalScope.approvedSnapshotRef
  const outputFrame = request.outputFrame
  const source = request.sourceArtifacts[0]
  if (
    !approvedSnapshotRef
    || request.scope.ownerUserId !== payload.canonicalScope.ownerUserId
    || request.scope.workspaceId !== payload.canonicalScope.workspaceId
    || request.scope.projectId !== payload.canonicalScope.projectId
    || request.scope.editSessionId !== payload.canonicalScope.editSessionId
    || request.scope.approvedSnapshotId !== approvedSnapshotRef.id
    || request.operation !== payload.expectedVisualIntelligenceOperation
    || request.profile !== payload.expectedVisualIntelligenceProfile
    || request.requestedRanges.length !== 1
    || !sameVisualRange(request.requestedRanges[0], payload.requestedRange,
      payload)
    || request.sourceArtifacts.length !== 1
    || request.comparisonArtifacts.length !== 0
    || !source
    || source.artifactId !== payload.sourcePrivateArtifactRef.id
    || source.checksumSha256 !== payload.sourcePrivateArtifactRef.contentHash
    || !outputFrame
    || outputFrame.outputId !== payload.confirmedOutputFrame.outputId
    || outputFrame.width !== payload.confirmedOutputFrame.width
    || outputFrame.height !== payload.confirmedOutputFrame.height
    || outputFrame.aspectRatioNumerator
      !== payload.confirmedOutputFrame.aspectRatioNumerator
    || outputFrame.aspectRatioDenominator
      !== payload.confirmedOutputFrame.aspectRatioDenominator
    || outputFrame.frameRate.numerator
      !== payload.confirmedOutputFrame.fpsNumerator
    || outputFrame.frameRate.denominator
      !== payload.confirmedOutputFrame.fpsDenominator
    || stripSha(outputFrame.confirmedOutputFrameRef.contentHash)
      !== payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256
    || request.admission.mode !== 'approved_edit_inspection'
    || request.admission.approvedPlanSnapshotRef.id !== approvedSnapshotRef.id
    || stripSha(request.admission.approvedPlanSnapshotRef.contentHash)
      !== approvedSnapshotRef.contentHash
    || request.admission.privatePreviewArtifactRef.id !== source.artifactId
    || stripSha(request.admission.privatePreviewArtifactRef.contentHash)
      !== source.checksumSha256
    || !domainAndVisualRefSetsMatch(
      payload.expectedOutcomeRefs,
      request.expectedOutcomeRefs,
    )
  ) throw new Error('Visual Intelligence request does not match Caption scope.')
}

function assertVisualEvidenceMatchesCaption(input: {
  payload: CaptionVisualIntelligenceSupportPayload
  request: VisualIntelligenceRequest
  report: VisualIntelligenceReport
  spatialEvidence: VisualIntelligenceSpatialEvidence
  reportRef: VisualIntelligenceEvidenceRef
}): void {
  const { payload, request, report, spatialEvidence, reportRef } = input
  const source = request.sourceArtifacts[0]
  const spatialSource = spatialEvidence.sourceArtifacts[0]
  const reportFindingIds = new Set(report.findings.map((item) => item.findingId))
  const reportEvidenceRefs = new Set([
    ...report.evidence.map((item) => visualRefKey(item.evidenceRef)),
    ...report.findings.flatMap((item) => item.evidenceRefs.map(visualRefKey)),
    ...report.segments.flatMap((item) => item.evidenceRefs.map(visualRefKey)),
  ])
  if (
    !source
    || !sameVisualRef(report.requestRef, requestRef(request))
    || !sameVisualRef(spatialEvidence.requestRef, requestRef(request))
    || !sameVisualRef(spatialEvidence.reportRef, reportRef)
    || report.reportId !== reportRef.id
    || report.reportDigestSha256 !== reportRef.contentHash
    || !sameVisualScope(report.scope, request.scope)
    || !sameVisualScope(spatialEvidence.scope, request.scope)
    || report.operation !== request.operation
    || report.profile !== request.profile
    || spatialEvidence.operation !== request.operation
    || spatialEvidence.profile !== request.profile
    || report.sourceArtifacts.length !== 1
    || spatialEvidence.sourceArtifacts.length !== 1
    || !spatialSource
    || report.sourceArtifacts[0]?.artifactId !== source.artifactId
    || report.sourceArtifacts[0]?.checksumSha256 !== source.checksumSha256
    || spatialSource.artifactId !== source.artifactId
    || spatialSource.checksumSha256 !== source.checksumSha256
    || spatialSource.width !== source.width
    || spatialSource.height !== source.height
    || spatialSource.durationFrames !== source.durationFrames
    || !sameVisualOutputFrame(spatialEvidence.outputFrame, request.outputFrame)
    || !domainAndVisualRefSetsMatch(
      payload.expectedOutcomeRefs,
      report.expectedOutcomeRefs,
    )
    || !report.coverage.completeRequestedRangeCoverage
    || report.coverage.incompleteRanges.length !== 0
    || !rangesCoverExactly(
      report.coverage.analyzedRanges.map(stripFrameRate),
      payload.requestedRange,
    )
    || spatialEvidence.observations.length === 0
    || spatialEvidence.observations.some((observation) =>
      observation.artifactId !== source.artifactId
      || observation.sceneId !== payload.requestedSceneId
      || !rangeWithin(stripFrameRate(observation.range), payload.requestedRange)
      || observation.findingIds.some((id) => !reportFindingIds.has(id))
      || observation.evidenceRefs.some((ref) =>
        !reportEvidenceRefs.has(visualRefKey(ref))))
    || payload.requiredObservationRoles.some((role) =>
      !spatialEvidence.observations.some((item) => item.role === role))
    || !spatialEvidence.actualVisualInferenceObserved
    || !spatialEvidence.exactCanonicalPrivateMediaSuppliedToProvider
    || report.usage.providerCallMade !== true
  ) throw new Error('Visual Intelligence evidence does not match Caption scope.')
}

function createCaptionPacket(input: {
  payload: CaptionVisualIntelligenceSupportPayload
  supportRequest: SkillSupportRequest
  report: VisualIntelligenceReport
  reportRef: VisualIntelligenceEvidenceRef
  spatialEvidence: VisualIntelligenceSpatialEvidence
  authenticatedReadResultRef: SkillContractRef
}): CaptionVisualIntelligenceEvidencePacket {
  const observations = input.spatialEvidence.observations.map((item) => ({
    observationId: item.observationId,
    sceneId: item.sceneId as string,
    frameRange: stripFrameRate(item.range),
    role: item.role,
    regionBasisPoints: { ...item.regionBasisPoints },
    confidenceBasisPoints: item.confidenceBasisPoints,
    temporalStabilityBasisPoints: item.temporalStabilityBasisPoints,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: item.clutterBasisPoints,
    cropResilienceBasisPoints: item.cropResilienceBasisPoints,
    compositionBalanceBasisPoints: item.compositionBalanceBasisPoints,
    findingIds: [...item.findingIds],
    evidenceRefs: item.evidenceRefs.map((ref) => ({ ...ref })),
    uncertaintyCode: item.uncertaintyCode,
  }))
  const findingIds = [...new Set(observations.flatMap((item) =>
    item.findingIds))]
  const withoutDigest: Omit<
    CaptionVisualIntelligenceEvidencePacket,
    'packetDigestSha256'
  > = {
    schemaVersion: CAPTION_VISUAL_INTELLIGENCE_EVIDENCE_PACKET_VERSION,
    packetId:
      `caption.vi.packet.${input.report.reportDigestSha256.slice(7, 39)}`,
    supportRequestRef: supportRequestRef(input.supportRequest),
    supportPayloadRef: supportPayloadRef(input.payload),
    canonicalScope: structuredClone(input.payload.canonicalScope),
    purpose: input.payload.purpose,
    sourcePrivateArtifactRef:
      structuredClone(input.payload.sourcePrivateArtifactRef),
    canonicalLayoutOccupancyRef:
      structuredClone(input.payload.canonicalLayoutOccupancyRef),
    pictureLockRef: structuredClone(input.payload.pictureLockRef),
    finishReadinessRef: structuredClone(input.payload.finishReadinessRef),
    confirmedOutputFrameDigestSha256:
      input.payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
    requestedSceneId: input.payload.requestedSceneId,
    requestedRange: structuredClone(input.payload.requestedRange),
    visualIntelligenceContractVersion: 'visual-intelligence-contract-v1',
    visualIntelligenceReportRef: { ...input.reportRef },
    authenticatedReadResultRef: { ...input.authenticatedReadResultRef },
    reportOperation: input.report.operation,
    reportProfile: input.report.profile,
    reportDisposition: input.report.disposition,
    coverage: {
      requestedRange: structuredClone(input.payload.requestedRange),
      analyzedRanges: input.report.coverage.analyzedRanges.map(stripFrameRate),
      incompleteRanges: [],
      targetedFollowupRanges:
        input.report.coverage.targetedFollowupRanges.map(stripFrameRate),
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    observations,
    findingIds,
    evidenceMode: 'authenticated_private_runtime',
    canonicalReportRereadVerified: true,
    exactCanonicalScopeVerified: true,
    actualVisualInferenceObserved: true,
    actualRenderedPixelsInspected:
      input.payload.purpose === 'rendered_caption_inspection',
    immutableReportReread: true,
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
    packetDigestSha256: contractDigest(withoutDigest, 'packetDigestSha256'),
  }, { payload: input.payload, supportRequest: input.supportRequest })
}

function createRecord(input: {
  supportRequest: SkillSupportRequest
  supportPayload: CaptionVisualIntelligenceSupportPayload
  visualIntelligenceRequestRef: VisualIntelligenceEvidenceRef
  visualIntelligenceReportRef: VisualIntelligenceEvidenceRef
  visualIntelligenceSpatialEvidenceRef: VisualIntelligenceEvidenceRef
  authenticatedReadResultRef: SkillContractRef
  captionEvidencePacket: CaptionVisualIntelligenceEvidencePacket
  authenticatedOwnerProjection:
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
}): CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
    recordId:
      `caption.vi.record.${input.captionEvidencePacket.packetDigestSha256.slice(0, 32)}`,
    originalCallRef: structuredClone(input.supportRequest.originalCallRef),
    supportRequestRef: supportRequestRef(input.supportRequest),
    supportRequest: structuredClone(input.supportRequest),
    supportPayload: structuredClone(input.supportPayload),
    visualIntelligenceRequestRef: { ...input.visualIntelligenceRequestRef },
    visualIntelligenceReportRef: { ...input.visualIntelligenceReportRef },
    visualIntelligenceSpatialEvidenceRef:
      { ...input.visualIntelligenceSpatialEvidenceRef },
    authenticatedReadResultRef: { ...input.authenticatedReadResultRef },
    captionEvidencePacket: structuredClone(input.captionEvidencePacket),
    authenticatedOwnerProjection:
      structuredClone(input.authenticatedOwnerProjection),
    authenticatedPrincipalVerified: true as const,
    priorCallAndSupportRequestExactReread: true as const,
    canonicalVisualIntelligenceRequestExactReread: true as const,
    immutableReportExactReread: true as const,
    immutableSpatialEvidenceExactReread: true as const,
    exactCaptionScopeOutputSceneRangeAndArtifactBindingVerified: true as const,
    exactExpectedOutcomeLineageVerified: true as const,
    exactRequiredObservationRoleCoverageVerified: true as const,
    ownerProjectionCreateOnlyPersisted: true as const,
    evidenceRecordCreateOnlyPersisted: true as const,
    browserLocalStateUsed: false as const,
    rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false as const,
    directPeerDispatchPerformed: false as const,
    providerCallPerformedByBridge: false as const,
    timelineMutationPerformed: false as const,
    runtimeExecutionAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    costOrBillingAuthorityGrantedToCaption: false as const,
    finalQaApprovalGrantedToCaption: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord({
    ...withoutDigest,
    recordDigestSha256: contractDigest(withoutDigest, 'recordDigestSha256'),
  })
}

function supportScopeMatches(
  scope: SkillCanonicalScope,
  payload: CaptionVisualIntelligenceSupportPayload,
): boolean {
  return scope.ownerUserId === payload.canonicalScope.ownerUserId
    && scope.workspaceId === payload.canonicalScope.workspaceId
    && scope.projectId === payload.canonicalScope.projectId
    && scope.editSessionId === payload.canonicalScope.editSessionId
    && nullableDomainSkillRefEqual(
      payload.canonicalScope.approvedSnapshotRef,
      scope.approvedSnapshotRef,
    )
    && scope.outputId === payload.canonicalScope.outputId
    && scope.sceneId === payload.canonicalScope.sceneId
    && scope.boundaryId === null
    && sameRangeList(
      scope.authorizedFrameRanges,
      payload.canonicalScope.authorizedFrameRanges,
    )
}

function supportRequestRef(request: SkillSupportRequest): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function supportPayloadRef(
  payload: CaptionVisualIntelligenceSupportPayload,
): CaptionDomainRef {
  return {
    id: payload.payloadId,
    version: payload.schemaVersion,
    contentHash: payload.payloadDigestSha256,
  }
}

function requestRef(request: VisualIntelligenceRequest): VisualIntelligenceEvidenceRef {
  return {
    id: request.requestId,
    version: 1,
    contentHash: request.requestDigestSha256,
  }
}

function spatialEvidenceRef(
  evidence: VisualIntelligenceSpatialEvidence,
): VisualIntelligenceEvidenceRef {
  return {
    id: evidence.spatialEvidenceId,
    version: 1,
    contentHash: evidence.spatialEvidenceDigestSha256,
  }
}

function readResultRef(
  result: VisualIntelligenceAuthenticatedReadResult,
): SkillContractRef {
  return {
    id: `caption.vi.authenticated-read.${result.resultDigestSha256.slice(7, 39)}`,
    version: result.schemaVersion,
    contentHash: stripSha(result.resultDigestSha256),
  }
}

function captionPacketArtifactRef(
  packet: CaptionVisualIntelligenceEvidencePacket,
  request: SkillSupportRequest,
): SkillArtifactRef {
  return {
    id: packet.packetId,
    version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256,
    artifactType: request.requestedArtifactTypes[0] as string,
    producerSkillKey: 'visual_intelligence',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: supportRequestRef(request),
  }
}

function callRef(call: { callId: string; schemaVersion: string; callDigestSha256: string }):
SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function sameVisualOutputFrame(
  left: VisualIntelligenceSpatialEvidence['outputFrame'],
  right: VisualIntelligenceRequest['outputFrame'],
): boolean {
  return canonicalEqual(left, right)
}

function sameVisualScope(
  left: VisualIntelligenceRequest['scope'],
  right: VisualIntelligenceRequest['scope'],
): boolean {
  return canonicalEqual(left, right)
}

function domainAndVisualRefSetsMatch(
  domain: CaptionDomainRef[],
  visual: VisualIntelligenceEvidenceRef[],
): boolean {
  if (domain.length !== visual.length) return false
  return domain.every((left) => visual.some((right) =>
    left.id === right.id && left.contentHash === stripSha(right.contentHash)))
}

function sameVisualRange(
  range: VisualIntelligenceFrameRange,
  captionRange: CaptionDomainFrameRange,
  payload: CaptionVisualIntelligenceSupportPayload,
): boolean {
  return sameRange(stripFrameRate(range), captionRange)
    && range.frameRate.numerator === payload.confirmedOutputFrame.fpsNumerator
    && range.frameRate.denominator === payload.confirmedOutputFrame.fpsDenominator
}

function stripFrameRate(range: VisualIntelligenceFrameRange): CaptionDomainFrameRange {
  return {
    startFrame: range.startFrame,
    endFrameExclusive: range.endFrameExclusive,
  }
}

function sameCaptionScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return canonicalEqual(left, right)
}

function sameRangeList(
  left: CaptionDomainFrameRange[],
  right: CaptionDomainFrameRange[],
): boolean {
  return left.length === right.length
    && left.every((range, index) => sameRange(range, right[index] as CaptionDomainFrameRange))
}

function sameRange(
  left: CaptionDomainFrameRange,
  right: CaptionDomainFrameRange,
): boolean {
  return left.startFrame === right.startFrame
    && left.endFrameExclusive === right.endFrameExclusive
}

function rangeWithin(
  inner: CaptionDomainFrameRange,
  outer: CaptionDomainFrameRange,
): boolean {
  return inner.startFrame >= outer.startFrame
    && inner.endFrameExclusive <= outer.endFrameExclusive
}

function rangesCoverExactly(
  ranges: CaptionDomainFrameRange[],
  expected: CaptionDomainFrameRange,
): boolean {
  if (ranges.length === 0) return false
  const ordered = [...ranges].sort((left, right) =>
    left.startFrame - right.startFrame
    || left.endFrameExclusive - right.endFrameExclusive)
  let cursor = expected.startFrame
  for (const range of ordered) {
    if (!rangeWithin(range, expected) || range.startFrame !== cursor) return false
    cursor = range.endFrameExclusive
  }
  return cursor === expected.endFrameExclusive
}

function sameDomainRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return domainRefKey(left) === domainRefKey(right)
}

function sameSkillRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return domainRefKey(left) === domainRefKey(right)
}

function sameVisualRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return visualRefKey(left) === visualRefKey(right)
}

function sameArtifactRef(left: SkillArtifactRef, right: SkillArtifactRef): boolean {
  return canonicalEqual(left, right)
}

function nullableDomainSkillRefEqual(
  left: CaptionDomainRef | null,
  right: SkillContractRef | null,
): boolean {
  return left === null ? right === null : right !== null && sameDomainRef(left, right)
}

function domainRefKey(ref: CaptionDomainRef | SkillContractRef): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function visualRefKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function stripSha(value: string): string {
  return prefixedSha256.parse(value).slice(7)
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

function contractDigest(value: unknown, digestField: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>,
    digestField,
  )
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  return contractDigest({ value: left }, 'unusedDigestField')
    === contractDigest({ value: right }, 'unusedDigestField')
}

function freeze<T>(value: T): T {
  return Object.freeze(structuredClone(value)) as T
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Caption Visual Intelligence record size is invalid.')
  }
  return body
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
): Promise<CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Caption Visual Intelligence record bytes are invalid.')
  }
  try {
    return parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord(
      JSON.parse(body.toString('utf8')) as unknown,
    )
  } catch (error) {
    throw new Error('Caption Visual Intelligence record JSON is invalid.', {
      cause: error,
    })
  }
}

function recordPath(prefix: string, ref: SkillContractRef): string {
  return `${prefix}/records/${ref.contentHash}.json`
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw new Error('Caption Visual Intelligence object port is missing.')
}

function assertPorts(input: {
  supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  visualIntelligenceRequestStore: Pick<
    VisualIntelligenceCanonicalRequestPackageStore,
    'rereadCanonicalRequestByRef'
  >
  visualIntelligenceAuthenticatedReadService:
    VisualIntelligenceAuthenticatedReadService
  visualIntelligenceSpatialEvidenceRepository: Pick<
    VisualIntelligenceSpatialEvidenceRepository,
    'readAcceptedSpatialEvidenceByReportRef'
  >
  evidenceRepository: CanonicalCaptionVisualIntelligenceEvidenceRepository
}): void {
  if (
    typeof input.supportResumeRepository?.rereadCallResultPair !== 'function'
    || typeof input.supportResumeRepository
      ?.persistAuthenticatedOwnerProjectionCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      ?.rereadAuthenticatedOwnerProjection !== 'function'
    || typeof input.supportResumeRepository
      ?.persistCallResultPairCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      ?.persistResumeRecordCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      ?.rereadResumeRecordByResumedCall !== 'function'
    || typeof input.visualIntelligenceRequestStore
      ?.rereadCanonicalRequestByRef !== 'function'
    || typeof input.visualIntelligenceAuthenticatedReadService?.read !== 'function'
    || typeof input.visualIntelligenceSpatialEvidenceRepository
      ?.readAcceptedSpatialEvidenceByReportRef !== 'function'
    || typeof input.evidenceRepository?.persistCreateOnly !== 'function'
    || typeof input.evidenceRepository?.rereadBySupportRequestRef !== 'function'
  ) throw new Error('Caption Visual Intelligence bridge ports are incomplete.')
}
