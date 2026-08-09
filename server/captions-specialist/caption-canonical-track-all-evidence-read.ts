import { z } from 'zod'

import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  type CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-track-all-support'
import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION,
  type CanonicalCaptionTrackAllAuthenticatedEvidenceRecordAny,
  type CanonicalCaptionTrackAllAuthenticatedEvidenceRecordV3,
} from '../../src/types/caption-canonical-track-all-foreground-support'
import {
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION,
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_V3_VERSION,
  type CaptionCanonicalTrackAllEvidenceReadAdapterReceipt,
  type CaptionCanonicalTrackAllEvidenceReadAdapterReceiptV3,
} from '../../src/types/caption-canonical-track-all-evidence-read'
import type {
  SkillArtifactRef,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
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
  parseCaptionTrackAllAdmission,
  parseCaptionTrackAllAdmissionV2,
  parseCaptionTrackAllEvidencePacket,
  parseCaptionTrackAllEvidencePacketV2,
  parseCaptionTrackAllSupportPayload,
  parseCaptionTrackAllSupportPayloadV2,
} from './caption-track-all-support'

const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const skillRefSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const domainRefSchema = skillRefSchema

const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
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
  exactCaptionScopeOutputSceneRangeSourceAndFrameBindingVerified: z.literal(true),
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
const recordEnvelopeV3Schema = recordEnvelopeSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION),
}).strict()

const receiptSchema:
z.ZodType<CaptionCanonicalTrackAllEvidenceReadAdapterReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION),
  adapterId: safeKey,
  adapterDigestSha256: rawSha256,
  backendSource: z.object({
    repository: z.literal('yuzastudio6-cyber/Reedkt'),
    branch: z.literal('codex/backend-workflow-pipeline-continuation'),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/u),
    sourceTree: z.string().regex(/^[a-f0-9]{40}$/u),
    publicTypeFileSha256: rawSha256,
    captionTrackAllPublicTypeFileSha256: rawSha256,
  }).strict(),
  consumedRecordVersion: z.literal(
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  captionParserEntrypointId: z.literal(
    'parseCaptionCanonicalTrackAllEvidenceRecord'),
  sourcePublicTypeCopiedByteForByte: z.literal(true),
  backendImplementationImported: z.literal(false),
  exactSupportPayloadRequestPacketAdmissionAndProjectionBindingRequired:
    z.literal(true),
  exactTaskLevelSceneQaAuthorityRefRequired: z.literal(true),
  exactCreateOnlyPersistenceRereadClaimsRequired: z.literal(true),
  sourceFixtureExercised: z.literal(true),
  actualCanonicalEvidenceRecordConsumed: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  runtimeExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  costOrBillingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const receiptV3Schema:
z.ZodType<CaptionCanonicalTrackAllEvidenceReadAdapterReceiptV3> = z.object({
  schemaVersion: z.literal(
    CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_V3_VERSION),
  adapterId: safeKey,
  adapterDigestSha256: rawSha256,
  priorAdapterReceiptRef: z.object({
    id: safeKey,
    version: z.literal(
      CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION),
    contentHash: rawSha256,
  }).strict(),
  consumedRecordVersion: z.literal(
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION),
  captionParserEntrypointId: z.literal(
    'parseCaptionCanonicalTrackAllEvidenceRecordV3'),
  frozenV2ReceiptPreserved: z.literal(true),
  frozenTrackAllV1WirePreserved: z.literal(true),
  foregroundPurposeRequiresCaptionTrackAllV2: z.literal(true),
  exactForegroundDepthAndAdmissionBindingRequired: z.literal(true),
  backendImplementationImported: z.literal(false),
  structuralSourceFixtureExercised: z.literal(true),
  actualCanonicalEvidenceRecordConsumed: z.literal(false),
  canonicalTrackAllProducerMounted: z.literal(false),
  canonicalTrackAllRuntimeRequiredForQualification: z.literal(true),
  directPeerDispatchAdded: z.literal(false),
  runtimeExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  costOrBillingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

function sameRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameArtifactRef(
  left: SkillArtifactRef,
  right: SkillArtifactRef,
): boolean {
  return sameRef(left, right)
    && left.artifactType === right.artifactType
    && left.producerSkillKey === right.producerSkillKey
    && left.privateArtifact === right.privateArtifact
    && left.byteFreeRef === right.byteFreeRef
    && left.sourceSupportRequestRef !== null
    && right.sourceSupportRequestRef !== null
    && sameRef(left.sourceSupportRequestRef, right.sourceSupportRequestRef)
}

function parseCaptionCanonicalTrackAllEvidenceRecordForVersion(
  value: unknown,
  version: 'v2' | 'v3',
): CanonicalCaptionTrackAllAuthenticatedEvidenceRecordAny {
  assertClosedContractTree(value, 'Caption canonical Track All evidence record')
  const envelope = version === 'v3'
    ? recordEnvelopeV3Schema.parse(value)
    : recordEnvelopeSchema.parse(value)
  const supportPayload = version === 'v3'
    ? parseCaptionTrackAllSupportPayloadV2(envelope.supportPayload)
    : parseCaptionTrackAllSupportPayload(envelope.supportPayload)
  const supportRequest = parseSkillSupportRequest(envelope.supportRequest)
  const packet = version === 'v3'
    ? parseCaptionTrackAllEvidencePacketV2(
      envelope.captionEvidencePacket,
      { payload: supportPayload, supportRequest },
    )
    : parseCaptionTrackAllEvidencePacket(
      envelope.captionEvidencePacket,
      { payload: supportPayload, supportRequest },
    )
  const admission = version === 'v3'
    ? parseCaptionTrackAllAdmissionV2(
      envelope.captionAdmission,
      { packet, payload: supportPayload, supportRequest },
    )
    : parseCaptionTrackAllAdmission(
      envelope.captionAdmission,
      { packet, payload: supportPayload, supportRequest },
    )
  const projection = parseCaptionCanonicalAuthenticatedSpecialistProjection(
    envelope.authenticatedOwnerProjection)
  const requestRef: SkillContractRef = {
    id: supportRequest.requestId,
    version: supportRequest.schemaVersion,
    contentHash: supportRequest.requestDigestSha256,
  }
  const expectedArtifact: SkillArtifactRef = {
    id: packet.packetId,
    version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256,
    artifactType: 'track_all_mask_binding',
    producerSkillKey: 'track_all',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: structuredClone(requestRef),
  }
  if (supportRequest.requestingSkillKey !== 'captions'
    || supportRequest.targetSkillKey !== 'track_all'
    || packet.evidenceMode !== 'authenticated_private_runtime'
    || packet.authenticatedReadResultRef === null
    || packet.canonicalSam31RuntimeResultAdmissionRef === null
    || admission.disposition !== 'admitted_for_caption_scene_graph'
    || !sameRef(envelope.originalCallRef, supportRequest.originalCallRef)
    || !sameRef(envelope.supportRequestRef, requestRef)
    || !sameRef(envelope.sam31RuntimeResultAdmissionRef,
      packet.canonicalSam31RuntimeResultAdmissionRef)
    || sameRef(envelope.trackAllSceneQaAuthorityRef,
      envelope.trackAllSceneEvidenceRef)
    || sameRef(envelope.trackAllSceneQaAuthorityRef,
      envelope.sam31RuntimeResultAdmissionRef)
    || !sameRef(envelope.trackAllSceneEvidenceRef,
      packet.authenticatedReadResultRef)
    || sameRef(envelope.supportRequestRef,
      envelope.backendTrackAllSupportRequestRef)
    || !sameRef(projection.originalCallRef, envelope.originalCallRef)
    || !sameRef(projection.supportRequestRef, envelope.supportRequestRef)
    || !sameRef(projection.ownerResultRef,
      envelope.trackAllSceneEvidenceRef)
    || projection.ownerKey !== 'track_all'
    || JSON.stringify(projection.canonicalScope)
      !== JSON.stringify(supportRequest.canonicalScope)
    || projection.artifactRefs.length !== 1
    || !sameArtifactRef(projection.artifactRefs[0], expectedArtifact)
    || (version === 'v3'
      && (supportPayload.purpose !== 'subject_foreground'
        || !('textInFrontOfSubjectAllowed' in admission)
        || admission.textInFrontOfSubjectAllowed !== true
        || admission.textBehindSubjectAllowed
        || admission.objectAnchorAllowed))
    || envelope.recordDigestSha256 !== calculateSkillContractDigest(
      envelope as unknown as Record<string, unknown>,
      'recordDigestSha256')) {
    throw new Error('Caption canonical Track All evidence record is mismatched.')
  }
  return structuredClone({
    ...envelope,
    supportRequest,
    supportPayload,
    captionEvidencePacket: packet,
    captionAdmission: admission,
    authenticatedOwnerProjection: projection,
  } as CanonicalCaptionTrackAllAuthenticatedEvidenceRecordAny)
}

export function parseCaptionCanonicalTrackAllEvidenceRecord(
  value: unknown,
): CanonicalCaptionTrackAllAuthenticatedEvidenceRecord {
  return parseCaptionCanonicalTrackAllEvidenceRecordForVersion(
    value, 'v2') as CanonicalCaptionTrackAllAuthenticatedEvidenceRecord
}

export function parseCaptionCanonicalTrackAllEvidenceRecordV3(
  value: unknown,
): CanonicalCaptionTrackAllAuthenticatedEvidenceRecordV3 {
  return parseCaptionCanonicalTrackAllEvidenceRecordForVersion(
    value, 'v3') as CanonicalCaptionTrackAllAuthenticatedEvidenceRecordV3
}

export function parseCaptionCanonicalTrackAllEvidenceRecordAny(
  value: unknown,
): CanonicalCaptionTrackAllAuthenticatedEvidenceRecordAny {
  assertClosedContractTree(
    value, 'Caption canonical Track All versioned evidence record')
  const version = z.object({
    schemaVersion: z.enum([
      CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
      CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION,
    ]),
  }).passthrough().parse(value).schemaVersion
  return parseCaptionCanonicalTrackAllEvidenceRecordForVersion(
    value,
    version ===
      CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION
      ? 'v3' : 'v2',
  )
}

export function parseCaptionCanonicalTrackAllEvidenceReadReceipt(
  value: unknown,
): CaptionCanonicalTrackAllEvidenceReadAdapterReceipt {
  assertClosedContractTree(
    value, 'Caption canonical Track All evidence-read receipt')
  const receipt = receiptSchema.parse(value)
  if (receipt.adapterDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'adapterDigestSha256')) {
    throw new Error('Caption canonical Track All evidence-read receipt is stale.')
  }
  return structuredClone(receipt)
}

export function parseCaptionCanonicalTrackAllEvidenceReadReceiptV3(
  value: unknown,
): CaptionCanonicalTrackAllEvidenceReadAdapterReceiptV3 {
  assertClosedContractTree(
    value, 'Caption canonical Track All V3 evidence-read receipt')
  const receipt = receiptV3Schema.parse(value)
  if (receipt.adapterDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'adapterDigestSha256')) {
    throw new Error(
      'Caption canonical Track All V3 evidence-read receipt is stale.')
  }
  return structuredClone(receipt)
}

const receiptWithoutDigest: Omit<
  CaptionCanonicalTrackAllEvidenceReadAdapterReceipt,
  'adapterDigestSha256'
> = {
  schemaVersion: CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_VERSION,
  adapterId: 'captions.canonical.track-all.evidence-read.adapter',
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt',
    branch: 'codex/backend-workflow-pipeline-continuation',
    sourceCommit: 'b4241b6023de986de634fd1a20b705dbedf811cb',
    sourceTree: '6e73a1777a012a64aeca01564cf08eebdcbd0ec9',
    publicTypeFileSha256:
      '43c80e3ca576d4cd93eb6c2e0a96dc556d84f8f14c25c284f8c13b88254571db',
    captionTrackAllPublicTypeFileSha256:
      '38fce85b11b1d5692dacb873fc056f61808ddbf115356c7a7556158bd80145b3',
  },
  consumedRecordVersion:
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  captionParserEntrypointId: 'parseCaptionCanonicalTrackAllEvidenceRecord',
  sourcePublicTypeCopiedByteForByte: true,
  backendImplementationImported: false,
  exactSupportPayloadRequestPacketAdmissionAndProjectionBindingRequired: true,
  exactTaskLevelSceneQaAuthorityRefRequired: true,
  exactCreateOnlyPersistenceRereadClaimsRequired: true,
  sourceFixtureExercised: true,
  actualCanonicalEvidenceRecordConsumed: false,
  directPeerDispatchAdded: false,
  runtimeExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  costOrBillingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT =
  parseCaptionCanonicalTrackAllEvidenceReadReceipt({
    ...receiptWithoutDigest,
    adapterDigestSha256: calculateSkillContractDigest({
      ...receiptWithoutDigest,
      adapterDigestSha256: '',
    }, 'adapterDigestSha256'),
  })

const receiptV3WithoutDigest: Omit<
  CaptionCanonicalTrackAllEvidenceReadAdapterReceiptV3,
  'adapterDigestSha256'
> = {
  schemaVersion:
    CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_ADAPTER_V3_VERSION,
  adapterId: 'captions.canonical.track-all.evidence-read.adapter.v3',
  priorAdapterReceiptRef: {
    id: CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.adapterId,
    version: CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.schemaVersion,
    contentHash:
      CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.adapterDigestSha256,
  },
  consumedRecordVersion:
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_V3_VERSION,
  captionParserEntrypointId:
    'parseCaptionCanonicalTrackAllEvidenceRecordV3',
  frozenV2ReceiptPreserved: true,
  frozenTrackAllV1WirePreserved: true,
  foregroundPurposeRequiresCaptionTrackAllV2: true,
  exactForegroundDepthAndAdmissionBindingRequired: true,
  backendImplementationImported: false,
  structuralSourceFixtureExercised: true,
  actualCanonicalEvidenceRecordConsumed: false,
  canonicalTrackAllProducerMounted: false,
  canonicalTrackAllRuntimeRequiredForQualification: true,
  directPeerDispatchAdded: false,
  runtimeExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  costOrBillingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT_V3 =
  parseCaptionCanonicalTrackAllEvidenceReadReceiptV3({
    ...receiptV3WithoutDigest,
    adapterDigestSha256: calculateSkillContractDigest({
      ...receiptV3WithoutDigest,
      adapterDigestSha256: '',
    }, 'adapterDigestSha256'),
  })
