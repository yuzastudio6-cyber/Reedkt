import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-track-all-support'
import {
  CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_VERSION,
  type CaptionTrackAllEvidenceFinalizationAdapterReceipt,
} from '../../src/types/caption-track-all-evidence-finalization-adapter'
import {
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION,
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE,
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE_ID,
  type TrackAllSam31CaptionEvidenceFinalizationRequest,
  type TrackAllSam31CaptionEvidenceFinalizationResult,
} from '../../src/types/track-all-sam3_1-caption-evidence-finalization'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseCaptionCanonicalTrackAllEvidenceRecord } from
  './caption-canonical-track-all-evidence-read'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: safeId,
  contentHash: rawSha256,
}).strict()
const requestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION),
  requestId: safeId,
  requestDigestSha256: rawSha256,
  priorCallRef: refSchema,
  selectedSupportRequestRef: refSchema,
  invocationId: safeId,
  runtimeResultAdmissionRef: refSchema,
  l4MaskQaMeasurementRef: refSchema,
  privateSceneReviewRef: refSchema,
  byteFreeRequest: z.literal(true),
  browserOrCallerEvidenceAccepted: z.literal(false),
  directPeerDispatchRequested: z.literal(false),
  runtimeOrAssetMutationRequested: z.literal(false),
}).strict()
const resultSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION),
  requestRef: refSchema,
  workspaceId: safeId,
  invocationId: safeId,
  supportRequestRef: refSchema,
  sceneQaAuthorityRef: refSchema,
  sceneEvidenceRef: refSchema,
  authenticatedEvidenceRecordRef: refSchema,
  authenticatedOwnerProjectionRef: refSchema,
  disposition: z.literal('ready_for_specialist_resume'),
  authenticatedPrincipalVerified: z.literal(true),
  exactPersistedRuntimeMeasurementAndReviewReread: z.literal(true),
  createOnlySceneAuthorityAndEvidenceReread: z.literal(true),
  authenticatedProjectionPersistedAndReread: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  runtimeExecutionPerformedByFinalizer: z.literal(false),
  assetMutationPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  resultDigestSha256: rawSha256,
}).strict()
const receiptSchema:
z.ZodType<CaptionTrackAllEvidenceFinalizationAdapterReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_VERSION),
  receiptId: safeId,
  receiptDigestSha256: rawSha256,
  backendSource: z.object({
    repository: z.literal('yuzastudio6-cyber/Reedkt'),
    branch: z.literal('codex/backend-workflow-pipeline-continuation'),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/u),
    sourceTree: z.string().regex(/^[a-f0-9]{40}$/u),
    publicTypeFileSha256: rawSha256,
  }).strict(),
  routeId: z.literal(TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE_ID),
  routePath: z.literal(TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE),
  requestVersion: z.literal(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION),
  resultVersion: z.literal(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION),
  evidenceRecordVersion: z.literal(
    'canonical-caption-track-all-authenticated-evidence-record-v2'),
  parserEntrypointId: z.literal(
    'parseCaptionTrackAllEvidenceFinalizationHandoff'),
  exactRequestResultRecordAndProjectionLineageRequired: z.literal(true),
  byteFreeReferencesOnly: z.literal(true),
  backendImplementationImported: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  runtimeExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  costOrBillingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function withoutField<T extends object>(value: T, field: keyof T): unknown {
  const clone = structuredClone(value) as Record<string, unknown>
  delete clone[field as string]
  return clone
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]))
  }
  return value
}

function backendDigest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

export function parseCaptionTrackAllEvidenceFinalizationHandoff(input: {
  workspaceId: string
  request: unknown
  result: unknown
  canonicalEvidenceRecord: unknown
}): {
  request: TrackAllSam31CaptionEvidenceFinalizationRequest
  result: TrackAllSam31CaptionEvidenceFinalizationResult
  canonicalEvidenceRecord: CanonicalCaptionTrackAllAuthenticatedEvidenceRecord
} {
  assertClosedContractTree(input, 'Caption Track All finalization handoff')
  const workspaceId = safeId.parse(input.workspaceId)
  const request = requestSchema.parse(input.request)
  const result = resultSchema.parse(input.result)
  const record = parseCaptionCanonicalTrackAllEvidenceRecord(
    input.canonicalEvidenceRecord)
  const requestRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  const recordRef = {
    id: record.recordId,
    version: record.schemaVersion,
    contentHash: record.recordDigestSha256,
  }
  const projectionRef = {
    id: record.authenticatedOwnerProjection.projectionId,
    version: record.authenticatedOwnerProjection.schemaVersion,
    contentHash:
      record.authenticatedOwnerProjection.projectionDigestSha256,
  }
  if (
    request.requestDigestSha256 !== backendDigest(
      withoutField(request, 'requestDigestSha256'))
    || result.resultDigestSha256 !== backendDigest(
      withoutField(result, 'resultDigestSha256'))
    || result.workspaceId !== workspaceId
    || result.invocationId !== request.invocationId
    || !sameRef(result.requestRef, requestRef)
    || !sameRef(result.supportRequestRef, request.selectedSupportRequestRef)
    || !sameRef(record.originalCallRef, request.priorCallRef)
    || !sameRef(record.supportRequestRef, request.selectedSupportRequestRef)
    || !sameRef(record.sam31RuntimeResultAdmissionRef,
      request.runtimeResultAdmissionRef)
    || !sameRef(record.trackAllSceneQaAuthorityRef,
      result.sceneQaAuthorityRef)
    || !sameRef(record.trackAllSceneEvidenceRef, result.sceneEvidenceRef)
    || !sameRef(result.authenticatedEvidenceRecordRef, recordRef)
    || !sameRef(result.authenticatedOwnerProjectionRef, projectionRef)
    || record.supportPayload.canonicalScope.workspaceId !== workspaceId
  ) throw new Error('Caption Track All finalization lineage is mismatched.')
  return Object.freeze({
    request: structuredClone(request),
    result: structuredClone(result),
    canonicalEvidenceRecord: structuredClone(record),
  })
}

export function parseCaptionTrackAllEvidenceFinalizationAdapterReceipt(
  value: unknown,
): CaptionTrackAllEvidenceFinalizationAdapterReceipt {
  assertClosedContractTree(value, 'Caption Track All finalization receipt')
  const receipt = receiptSchema.parse(value)
  if (receipt.receiptDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256')) {
    throw new Error('Caption Track All finalization receipt is stale.')
  }
  return structuredClone(receipt)
}

const receiptWithoutDigest: Omit<
  CaptionTrackAllEvidenceFinalizationAdapterReceipt,
  'receiptDigestSha256'
> = {
  schemaVersion: CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_VERSION,
  receiptId: 'captions.track-all.evidence-finalization.adapter',
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt',
    branch: 'codex/backend-workflow-pipeline-continuation',
    sourceCommit: '62fddefd38daf41f759426b25ff494bd6cadbb06',
    sourceTree: '01c4be3874b79ed6617dd046b3671bdef09ce319',
    publicTypeFileSha256:
      '46024fcdcf97d7700b515037c8aeb761fc0699423a9a57abee35806d5425b9dc',
  },
  routeId: TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE_ID,
  routePath: TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE,
  requestVersion:
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION,
  resultVersion:
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION,
  evidenceRecordVersion:
    'canonical-caption-track-all-authenticated-evidence-record-v2',
  parserEntrypointId: 'parseCaptionTrackAllEvidenceFinalizationHandoff',
  exactRequestResultRecordAndProjectionLineageRequired: true,
  byteFreeReferencesOnly: true,
  backendImplementationImported: false,
  directPeerDispatchAdded: false,
  runtimeExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  costOrBillingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_RECEIPT =
  parseCaptionTrackAllEvidenceFinalizationAdapterReceipt({
    ...receiptWithoutDigest,
    receiptDigestSha256: calculateSkillContractDigest({
      ...receiptWithoutDigest,
      receiptDigestSha256: '',
    }, 'receiptDigestSha256'),
  })
