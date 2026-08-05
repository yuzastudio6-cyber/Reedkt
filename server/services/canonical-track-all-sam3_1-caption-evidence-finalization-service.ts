import { z } from 'zod'

import {
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION,
  type TrackAllSam31CaptionEvidenceFinalizationRequest,
  type TrackAllSam31CaptionEvidenceFinalizationResult,
  type TrackAllSam31CaptionEvidenceRef,
} from '../../src/types/track-all-sam3_1-caption-evidence-finalization'
import type {
  CanonicalCaptionTrackAllSupportService,
} from './canonical-caption-track-all-support-service'
import type {
  CanonicalTrackAllSam31TaskQaOwner,
} from './canonical-track-all-sam3_1-task-qa-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-caption-evidence-finalization-runtime-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema: z.ZodType<TrackAllSam31CaptionEvidenceRef> = z.object({
  id: safeId,
  version: safeId,
  contentHash: sha256,
}).strict()
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION,
  ),
  requestId: safeId,
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
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION,
  ),
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
}).strict()
const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: sha256,
}).strict()
const runtimeInputSchema = z.object({
  authenticatedOwnerUserId: safeId,
  workspaceId: safeId,
  idempotencyKey: safeId,
  request: z.unknown(),
}).strict()

export interface CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RUNTIME_VERSION
  readonly acceptsRawEvidenceOrMedia: false
  readonly performsRuntimeOrAssetMutation: false
  finalizeCaptionEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly workspaceId: string
    readonly idempotencyKey: string
    readonly request: unknown
  }): Promise<TrackAllSam31CaptionEvidenceFinalizationResult>
}

type FinalizationRuntimeInput = Parameters<
  CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort[
    'finalizeCaptionEvidence'
  ]
>[0]

export function buildTrackAllSam31CaptionEvidenceFinalizationRequest(input: {
  readonly requestId: string
  readonly priorCallRef: TrackAllSam31CaptionEvidenceRef
  readonly selectedSupportRequestRef: TrackAllSam31CaptionEvidenceRef
  readonly invocationId: string
  readonly runtimeResultAdmissionRef: TrackAllSam31CaptionEvidenceRef
  readonly l4MaskQaMeasurementRef: TrackAllSam31CaptionEvidenceRef
  readonly privateSceneReviewRef: TrackAllSam31CaptionEvidenceRef
}): TrackAllSam31CaptionEvidenceFinalizationRequest {
  assertPlainSerializedData(input, 'track_all_sam31_caption_finalization_input')
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_REQUEST_VERSION,
    ...structuredClone(input),
    byteFreeRequest: true,
    browserOrCallerEvidenceAccepted: false,
    directPeerDispatchRequested: false,
    runtimeOrAssetMutationRequested: false,
  })
  return Object.freeze(requestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function parseTrackAllSam31CaptionEvidenceFinalizationRequest(
  value: unknown,
): TrackAllSam31CaptionEvidenceFinalizationRequest {
  assertPlainSerializedData(value, 'track_all_sam31_caption_finalization_request')
  const request = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = request
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All Caption finalization request digest is invalid.')
  }
  return structuredClone(request)
}

export function parseTrackAllSam31CaptionEvidenceFinalizationResult(
  value: unknown,
): TrackAllSam31CaptionEvidenceFinalizationResult {
  assertPlainSerializedData(value, 'track_all_sam31_caption_finalization_result')
  const result = resultSchema.parse(value)
  const { resultDigestSha256, ...payload } = result
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All Caption finalization result digest is invalid.')
  }
  return structuredClone(result)
}

export function createCanonicalTrackAllSam31CaptionEvidenceFinalizationRuntime(
  input: {
    readonly taskQaOwner: Pick<
      CanonicalTrackAllSam31TaskQaOwner,
      'admitCaptionSceneEvidence'
    >
    readonly supportService: Pick<
      CanonicalCaptionTrackAllSupportService,
      'projectAuthenticatedEvidence'
    >
  },
): CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort {
  if (typeof input.taskQaOwner?.admitCaptionSceneEvidence !== 'function'
    || typeof input.supportService?.projectAuthenticatedEvidence !== 'function') {
    throw new TypeError('Track All Caption finalization ports are unavailable.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RUNTIME_VERSION,
    acceptsRawEvidenceOrMedia: false as const,
    performsRuntimeOrAssetMutation: false as const,
    async finalizeCaptionEvidence(untrusted: FinalizationRuntimeInput) {
      assertPlainSerializedData(untrusted,
        'track_all_sam31_caption_finalization_runtime_input')
      const runtimeInput = runtimeInputSchema.parse(untrusted)
      const request = parseTrackAllSam31CaptionEvidenceFinalizationRequest(
        runtimeInput.request,
      )
      if (request.requestId !== runtimeInput.idempotencyKey) {
        throw new TypeError(
          'Track All Caption finalization differs from its idempotency key.',
        )
      }
      const authority = await input.taskQaOwner.admitCaptionSceneEvidence({
        authenticatedOwnerUserId: runtimeInput.authenticatedOwnerUserId,
        priorCallRef: request.priorCallRef,
        selectedSupportRequestRef: request.selectedSupportRequestRef,
        invocationId: request.invocationId,
        measurementRef: request.l4MaskQaMeasurementRef,
        privateSceneReviewRef: request.privateSceneReviewRef,
      })
      const authorityRef = Object.freeze({
        id: authority.authorityId,
        version: authority.schemaVersion,
        contentHash: authority.authorityDigestSha256,
      })
      const record = await input.supportService.projectAuthenticatedEvidence({
        authenticatedOwnerUserId: runtimeInput.authenticatedOwnerUserId,
        priorCallRef: request.priorCallRef,
        selectedSupportRequestRef: request.selectedSupportRequestRef,
        invocationId: request.invocationId,
        runtimeResultAdmissionRef: request.runtimeResultAdmissionRef,
        trackAllSceneQaAuthorityRef: authorityRef,
        trackAllSceneEvidenceRef: authority.captionSceneEvidenceRef,
      })
      if (
        record.supportPayload.canonicalScope.workspaceId
          !== runtimeInput.workspaceId
        || record.supportPayload.canonicalScope.ownerUserId
          !== runtimeInput.authenticatedOwnerUserId
        || record.recordId.length === 0
        || record.sam31RuntimeResultAdmissionRef.contentHash
          !== request.runtimeResultAdmissionRef.contentHash
      ) throw new TypeError(
        'Track All Caption finalization scope or result lineage is invalid.',
      )
      const projection = record.authenticatedOwnerProjection
      const payload = resultWithoutDigestSchema.parse({
        schemaVersion:
          TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_RESULT_VERSION,
        requestRef: {
          id: request.requestId,
          version: request.schemaVersion,
          contentHash: request.requestDigestSha256,
        },
        workspaceId: runtimeInput.workspaceId,
        invocationId: request.invocationId,
        supportRequestRef: structuredClone(record.supportRequestRef),
        sceneQaAuthorityRef: authorityRef,
        sceneEvidenceRef: structuredClone(authority.captionSceneEvidenceRef),
        authenticatedEvidenceRecordRef: {
          id: record.recordId,
          version: record.schemaVersion,
          contentHash: record.recordDigestSha256,
        },
        authenticatedOwnerProjectionRef: {
          id: projection.projectionId,
          version: projection.schemaVersion,
          contentHash: projection.projectionDigestSha256,
        },
        disposition: 'ready_for_specialist_resume',
        authenticatedPrincipalVerified: true,
        exactPersistedRuntimeMeasurementAndReviewReread: true,
        createOnlySceneAuthorityAndEvidenceReread: true,
        authenticatedProjectionPersistedAndReread: true,
        browserLocalStateUsed: false,
        directPeerDispatchPerformed: false,
        runtimeExecutionPerformedByFinalizer: false,
        assetMutationPerformed: false,
        customerCreditsMutated: false,
        finalQaApprovalGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      })
      return parseTrackAllSam31CaptionEvidenceFinalizationResult({
        ...payload,
        resultDigestSha256: sha256AuthorityValue(payload),
      })
    },
  })
}
