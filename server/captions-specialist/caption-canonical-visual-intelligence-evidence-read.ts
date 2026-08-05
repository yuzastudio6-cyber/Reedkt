import { z } from 'zod'

import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  type CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_ADAPTER_VERSION,
  type CaptionCanonicalVisualIntelligenceEvidenceReadAdapterReceipt,
} from '../../src/types/caption-canonical-visual-intelligence-evidence-read'
import type {
  SkillArtifactRef,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionCanonicalAuthenticatedSpecialistProjection,
} from './caption-canonical-specialist-resume-read'
import {
  parseCaptionVisualIntelligenceEvidencePacket,
  parseCaptionVisualIntelligenceSupportPayload,
} from './caption-visual-intelligence-support'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const skillRefSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const visualRefSchema = z.object({
  id: safeKey,
  version: z.number().int().positive().max(1_000_000),
  contentHash: prefixedSha256,
}).strict()

const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
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

const receiptSchema:
z.ZodType<CaptionCanonicalVisualIntelligenceEvidenceReadAdapterReceipt> =
z.object({
  schemaVersion: z.literal(
    CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_ADAPTER_VERSION),
  adapterId: safeKey,
  adapterDigestSha256: rawSha256,
  backendSource: z.object({
    repository: z.literal('yuzastudio6-cyber/Reedkt'),
    branch: z.literal('codex/backend-workflow-pipeline-continuation'),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/u),
    sourceTree: z.string().regex(/^[a-f0-9]{40}$/u),
    publicTypeFileSha256: rawSha256,
  }).strict(),
  consumedRecordVersion: z.literal(
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  captionParserEntrypointId: z.literal(
    'parseCaptionCanonicalVisualIntelligenceEvidenceRecord'),
  sourcePublicTypeCopiedByteForByte: z.literal(true),
  backendImplementationImported: z.literal(false),
  exactSupportPayloadRequestPacketAndProjectionBindingRequired: z.literal(true),
  exactCreateOnlyPersistenceRereadClaimsRequired: z.literal(true),
  semanticGeometryDoesNotAuthorizeFinalPlacement: z.literal(true),
  actualCanonicalEvidenceRecordConsumed: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  providerCallAuthorityGranted: z.literal(false),
  runtimeExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  costOrBillingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

function sameSkillRef(
  left: SkillContractRef,
  right: SkillContractRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameVisualRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameArtifactRef(
  left: SkillArtifactRef,
  right: SkillArtifactRef,
): boolean {
  return sameSkillRef(left, right)
    && left.artifactType === right.artifactType
    && left.producerSkillKey === right.producerSkillKey
    && left.privateArtifact === right.privateArtifact
    && left.byteFreeRef === right.byteFreeRef
    && left.sourceSupportRequestRef !== null
    && right.sourceSupportRequestRef !== null
    && sameSkillRef(left.sourceSupportRequestRef, right.sourceSupportRequestRef)
}

export function parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
  value: unknown,
): CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord {
  assertClosedContractTree(
    value, 'Caption canonical Visual Intelligence evidence record')
  const envelope = recordEnvelopeSchema.parse(value)
  const supportPayload = parseCaptionVisualIntelligenceSupportPayload(
    envelope.supportPayload)
  const supportRequest = parseSkillSupportRequest(envelope.supportRequest)
  const packet = parseCaptionVisualIntelligenceEvidencePacket(
    envelope.captionEvidencePacket,
    { payload: supportPayload, supportRequest },
  )
  const projection =
    parseCaptionCanonicalAuthenticatedSpecialistProjection(
      envelope.authenticatedOwnerProjection)
  const packetReadRef = packet.authenticatedReadResultRef
  const expectedPacketArtifact: SkillArtifactRef = {
    id: packet.packetId,
    version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256,
    artifactType: packet.purpose === 'final_frame_occupancy'
      ? 'caption_visual_intelligence_occupancy_evidence'
      : 'caption_visual_intelligence_rendered_inspection_evidence',
    producerSkillKey: 'visual_intelligence',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: structuredClone(packet.supportRequestRef),
  }
  const visualRefs = [
    envelope.visualIntelligenceRequestRef,
    envelope.visualIntelligenceReportRef,
    envelope.visualIntelligenceSpatialEvidenceRef,
  ]
  if (packetReadRef === null
    || supportRequest.requestingSkillKey !== 'captions'
    || supportRequest.targetSkillKey !== 'visual_intelligence'
    || !sameSkillRef(envelope.originalCallRef, supportRequest.originalCallRef)
    || !sameSkillRef(envelope.supportRequestRef, packet.supportRequestRef)
    || !sameSkillRef(envelope.supportRequestRef, {
      id: supportRequest.requestId,
      version: supportRequest.schemaVersion,
      contentHash: supportRequest.requestDigestSha256,
    })
    || !sameVisualRef(
      envelope.visualIntelligenceReportRef,
      packet.visualIntelligenceReportRef)
    || !sameSkillRef(envelope.authenticatedReadResultRef, packetReadRef)
    || new Set(visualRefs.map((ref) =>
      `${ref.id}|${ref.version}|${ref.contentHash}`)).size !== 3
    || !sameSkillRef(projection.originalCallRef, envelope.originalCallRef)
    || !sameSkillRef(projection.supportRequestRef, envelope.supportRequestRef)
    || !sameSkillRef(
      projection.ownerResultRef, envelope.authenticatedReadResultRef)
    || projection.ownerKey !== 'visual_intelligence'
    || JSON.stringify(projection.canonicalScope)
      !== JSON.stringify(supportRequest.canonicalScope)
    || projection.artifactRefs.length !== 1
    || !sameArtifactRef(projection.artifactRefs[0], expectedPacketArtifact)
    || envelope.recordDigestSha256 !== calculateSkillContractDigest(
      envelope as unknown as Record<string, unknown>,
      'recordDigestSha256')) {
    throw new Error(
      'Caption canonical Visual Intelligence evidence record is mismatched.')
  }
  return structuredClone({
    ...envelope,
    supportRequest,
    supportPayload,
    captionEvidencePacket: packet,
    authenticatedOwnerProjection: projection,
  } as CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord)
}

export function parseCaptionCanonicalVisualIntelligenceEvidenceReadReceipt(
  value: unknown,
): CaptionCanonicalVisualIntelligenceEvidenceReadAdapterReceipt {
  assertClosedContractTree(
    value, 'Caption canonical Visual Intelligence read receipt')
  const receipt = receiptSchema.parse(value)
  if (receipt.adapterDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'adapterDigestSha256')) {
    throw new Error(
      'Caption canonical Visual Intelligence read receipt is stale.')
  }
  return structuredClone(receipt)
}

const receiptWithoutDigest: Omit<
  CaptionCanonicalVisualIntelligenceEvidenceReadAdapterReceipt,
  'adapterDigestSha256'
> = {
  schemaVersion:
    CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_ADAPTER_VERSION,
  adapterId: 'captions.canonical.visual-intelligence.evidence-read.adapter',
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt',
    branch: 'codex/backend-workflow-pipeline-continuation',
    sourceCommit: '57919eeda74a656714fba4b3b67b81cfb2a32aa3',
    sourceTree: '5d2452c6112ecfff44952408cbb9b6911509e44a',
    publicTypeFileSha256:
      '2ce3256e3ac3d5b5ee6be042326c12ddeb6973667bd9285384c606ca8677f51c',
  },
  consumedRecordVersion:
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  captionParserEntrypointId:
    'parseCaptionCanonicalVisualIntelligenceEvidenceRecord',
  sourcePublicTypeCopiedByteForByte: true,
  backendImplementationImported: false,
  exactSupportPayloadRequestPacketAndProjectionBindingRequired: true,
  exactCreateOnlyPersistenceRereadClaimsRequired: true,
  semanticGeometryDoesNotAuthorizeFinalPlacement: true,
  actualCanonicalEvidenceRecordConsumed: false,
  directPeerDispatchAdded: false,
  providerCallAuthorityGranted: false,
  runtimeExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  costOrBillingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_RECEIPT =
  parseCaptionCanonicalVisualIntelligenceEvidenceReadReceipt({
    ...receiptWithoutDigest,
    adapterDigestSha256: calculateSkillContractDigest({
      ...receiptWithoutDigest,
      adapterDigestSha256: '',
    }, 'adapterDigestSha256'),
  })
