import { z } from 'zod'

import {
  deepFreezeSkillValue,
  hashSkillValue,
  skillManifestReference,
} from '../core/skill-capability-manifest-hash'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { BROLL_CAPABILITY_MANIFEST } from './b-roll-capability-manifest'

export const BROLL_CAPTION_OWNER_READ_REQUEST_VERSION =
  'b_roll_caption_owner_read_request_v1' as const
export const BROLL_CAPTION_OWNER_READ_RESULT_VERSION =
  'b_roll_caption_owner_read_result_v1' as const
export const BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT_VERSION =
  'b_roll_caption_public_contract_receipt_v1' as const

const identity = z.string().trim().min(1).max(240)

export const brollCaptionOpaqueReferenceSchema = z.object({
  id: identity,
  version: identity,
  contentHash: skillSha256Schema,
}).strict()

export const brollCaptionCanonicalScopeSchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  planVersionId: identity,
  approvedSnapshotRef: brollCaptionOpaqueReferenceSchema,
  outputId: identity,
  outputFrameRef: brollCaptionOpaqueReferenceSchema,
  sceneId: identity,
  authorizedFrameRange: skillFrameRangeSchema,
  masterTimingRef: brollCaptionOpaqueReferenceSchema,
  masterTimingHash: skillSha256Schema,
}).strict().superRefine((scope, context) => {
  if (scope.masterTimingRef.contentHash !== scope.masterTimingHash) {
    context.addIssue({
      code: 'custom',
      message: 'B-roll Caption scope MasterTiming reference and hash differ.',
    })
  }
})

const authorityDenialShape = {
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  sourceSelectionAuthorityGranted: z.literal(false),
  cropOrTimingMutationAuthorityGranted: z.literal(false),
  runtimeOrDispatchAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
} as const

const REQUESTED_REFERENCE_ROLES = [
  'selectedMediaManifestRef',
  'layoutOccupancyRef',
  'cropTimingRef',
  'visibleTextEvidenceRef',
] as const

const requestCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_CAPTION_OWNER_READ_REQUEST_VERSION),
  requestId: identity,
  requestingSkillKey: z.literal('captions'),
  ownerSkillKey: z.literal('b_roll'),
  requestedJobType: z.literal('provide_caption_broll_composition_constraints'),
  mediationMode: z.literal('hq_mediated_owner_read'),
  brollManifestRef: skillManifestReferenceSchema,
  canonicalScope: brollCaptionCanonicalScopeSchema,
  planningConstraintRef: brollCaptionOpaqueReferenceSchema,
  requestedReferenceRoles: z.tuple([
    z.literal(REQUESTED_REFERENCE_ROLES[0]),
    z.literal(REQUESTED_REFERENCE_ROLES[1]),
    z.literal(REQUESTED_REFERENCE_ROLES[2]),
    z.literal(REQUESTED_REFERENCE_ROLES[3]),
  ]),
  ...authorityDenialShape,
}).strict()

export const brollCaptionOwnerReadRequestSchema = requestCoreSchema.extend({
  requestDigestSha256: skillSha256Schema,
}).strict().superRefine((request, context) => {
  const { requestDigestSha256, ...core } = request
  if (
    hashSkillValue(core) !== requestDigestSha256 ||
    request.brollManifestRef.manifestHash !== BROLL_CAPABILITY_MANIFEST.manifestHash ||
    request.brollManifestRef.skillKey !== 'b_roll' ||
    request.brollManifestRef.skillVersion !== BROLL_CAPABILITY_MANIFEST.skillVersion ||
    request.brollManifestRef.contractVersion !== BROLL_CAPABILITY_MANIFEST.contractVersion
  ) context.addIssue({
    code: 'custom',
    message: 'B-roll Caption owner-read request has stale or forged lineage.',
  })
})

export type BrollCaptionOpaqueReference = z.infer<
  typeof brollCaptionOpaqueReferenceSchema
>
export type BrollCaptionCanonicalScope = z.infer<
  typeof brollCaptionCanonicalScopeSchema
>
export type BrollCaptionOwnerReadRequest = z.infer<
  typeof brollCaptionOwnerReadRequestSchema
>

export function createBrollCaptionOwnerReadRequest(
  input: Omit<z.input<typeof requestCoreSchema>, 'schemaVersion' | 'brollManifestRef'>,
): BrollCaptionOwnerReadRequest {
  const core = requestCoreSchema.parse({
    ...structuredClone(input),
    schemaVersion: BROLL_CAPTION_OWNER_READ_REQUEST_VERSION,
    brollManifestRef: skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  })
  return brollCaptionOwnerReadRequestSchema.parse({
    ...core,
    requestDigestSha256: hashSkillValue(core),
  })
}

const resultCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_CAPTION_OWNER_READ_RESULT_VERSION),
  resultId: identity,
  ownerSkillKey: z.literal('b_roll'),
  requestingSkillKey: z.literal('captions'),
  requestedJobType: z.literal('provide_caption_broll_composition_constraints'),
  mediationMode: z.literal('hq_mediated_owner_read'),
  brollManifestRef: skillManifestReferenceSchema,
  canonicalScope: brollCaptionCanonicalScopeSchema,
  ownerRequestRef: brollCaptionOpaqueReferenceSchema,
  brollResultReceiptRef: brollCaptionOpaqueReferenceSchema,
  selectedMediaManifestRef: brollCaptionOpaqueReferenceSchema,
  layoutOccupancyRef: brollCaptionOpaqueReferenceSchema,
  cropTimingRef: brollCaptionOpaqueReferenceSchema,
  visibleTextEvidenceRef: brollCaptionOpaqueReferenceSchema,
  sourceContractVersions: z.object({
    selectedMediaManifestRef: z.literal('b_roll_candidate_media_manifest_v1'),
    layoutOccupancyRef: z.literal('b_roll_remotion_layer_manifest_v1'),
    cropTimingRef: z.literal('b_roll_caption_crop_timing_projection_v1'),
    visibleTextEvidenceRef: z.literal('b_roll_caption_visible_text_evidence_v1'),
  }).strict(),
  authenticatedOwnerEvidenceRef: brollCaptionOpaqueReferenceSchema,
  exactPrivateOwnerRereadVerified: z.literal(true),
  exactCanonicalScopeVerified: z.literal(true),
  exactApprovedSnapshotVerified: z.literal(true),
  exactOutputFrameAndMasterTimingVerified: z.literal(true),
  sourceSelectionPerformedByCaption: z.literal(false),
  cropOrTimingPerformedByCaption: z.literal(false),
  ...authorityDenialShape,
}).strict()

export const brollCaptionOwnerReadResultSchema = resultCoreSchema.extend({
  resultDigestSha256: skillSha256Schema,
}).strict().superRefine((result, context) => {
  const { resultDigestSha256, ...core } = result
  if (
    hashSkillValue(core) !== resultDigestSha256 ||
    result.brollManifestRef.manifestHash !== BROLL_CAPABILITY_MANIFEST.manifestHash ||
    result.brollManifestRef.skillKey !== 'b_roll' ||
    result.brollManifestRef.skillVersion !== BROLL_CAPABILITY_MANIFEST.skillVersion ||
    result.brollManifestRef.contractVersion !== BROLL_CAPABILITY_MANIFEST.contractVersion
  ) context.addIssue({
    code: 'custom',
    message: 'B-roll Caption owner-read result has stale or forged lineage.',
  })
  if (
    result.ownerRequestRef.version !== BROLL_CAPTION_OWNER_READ_REQUEST_VERSION ||
    result.brollResultReceiptRef.version !== 'b_roll_result_receipt_v1' ||
    result.selectedMediaManifestRef.version !==
      result.sourceContractVersions.selectedMediaManifestRef ||
    result.layoutOccupancyRef.version !==
      result.sourceContractVersions.layoutOccupancyRef ||
    result.cropTimingRef.version !== result.sourceContractVersions.cropTimingRef ||
    result.visibleTextEvidenceRef.version !==
      result.sourceContractVersions.visibleTextEvidenceRef ||
    result.authenticatedOwnerEvidenceRef.version !==
      'b_roll_authenticated_owner_read_evidence_v1'
  ) context.addIssue({
    code: 'custom',
    message: 'B-roll Caption owner-read reference version contradicts its frozen role.',
  })
})

export type BrollCaptionOwnerReadResult = z.infer<
  typeof brollCaptionOwnerReadResultSchema
>

export function assertBrollCaptionOwnerReadResultForRequest(input: {
  request: unknown
  result: unknown
}): BrollCaptionOwnerReadResult {
  const request = brollCaptionOwnerReadRequestSchema.parse(input.request)
  const result = brollCaptionOwnerReadResultSchema.parse(input.result)
  const expectedRequestRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  if (
    hashSkillValue(request.canonicalScope) !== hashSkillValue(result.canonicalScope) ||
    hashSkillValue(expectedRequestRef) !== hashSkillValue(result.ownerRequestRef)
  ) throw new Error('B-roll Caption owner-read result does not match the exact request scope.')
  return result
}

const SOURCE_CONTRACT_DESCRIPTORS = [
  {
    referenceField: 'selectedMediaManifestRef',
    sourceContractVersion: 'b_roll_candidate_media_manifest_v1',
    sourceFields: [
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId', 'assignmentId',
      'assignmentHash', 'manifestRef', 'planId', 'planHash', 'sourceClass',
      'candidateVersion', 'objectSha256', 'durationSeconds', 'frameCount', 'fps',
      'width', 'height', 'generationClassification', 'proofSafetyClassification',
      'privateOnly', 'publicDeliveryAllowed', 'timelineMutationAllowed',
      'mediaManifestHash',
    ],
  },
  {
    referenceField: 'layoutOccupancyRef',
    sourceContractVersion: 'b_roll_remotion_layer_manifest_v1',
    sourceFields: [
      'assignmentReference', 'manifestRef', 'planReference', 'selectedArtifact',
      'exactTimelineRange', 'position', 'displayTreatment', 'speakerVisibilityIntent',
      'captionSafeBehavior', 'layerOrder', 'trackGraphRef', 'outputQaHash',
      'privatePreviewOnly', 'outsideAuthorizedRangeModified', 'layerManifestHash',
    ],
  },
  {
    referenceField: 'cropTimingRef',
    sourceContractVersion: 'b_roll_caption_crop_timing_projection_v1',
    sourceFields: [
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId', 'planVersionId',
      'approvedSnapshotRef', 'outputId', 'outputFrameRef', 'sceneId',
      'authorizedFrameRange', 'masterTimingRef', 'masterTimingHash', 'sourceTrim',
      'exactTimelineRange', 'cropMode', 'cropSafeSubjectArea', 'entryIntent',
      'exitIntent', 'projectionDigestSha256',
    ],
  },
  {
    referenceField: 'visibleTextEvidenceRef',
    sourceContractVersion: 'b_roll_caption_visible_text_evidence_v1',
    sourceFields: [
      'ownerUserId', 'workspaceId', 'projectId', 'editSessionId', 'planVersionId',
      'approvedSnapshotRef', 'outputId', 'outputFrameRef', 'sceneId',
      'authorizedFrameRange', 'masterTimingRef', 'masterTimingHash',
      'inspectionDisposition', 'visibleTextRegionRefs', 'producerEvidenceRef',
      'providerOrModelIdentityExposed', 'privateOnly', 'publicDeliveryAllowed',
      'evidenceDigestSha256',
    ],
  },
] as const

function descriptorDigest(descriptor: (typeof SOURCE_CONTRACT_DESCRIPTORS)[number]): string {
  return hashSkillValue({
    ...descriptor,
    captionReadMode: 'opaque_reference_only',
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
  })
}

const REQUEST_CONTRACT_DESCRIPTOR = {
  publicTypeName: 'BrollCaptionOwnerReadRequest',
  schemaVersion: BROLL_CAPTION_OWNER_READ_REQUEST_VERSION,
  fields: [...Object.keys(requestCoreSchema.shape), 'requestDigestSha256'].sort(),
  contractRole: 'hq_mediated_owner_read_request',
} as const

const RESULT_CONTRACT_DESCRIPTOR = {
  publicTypeName: 'BrollCaptionOwnerReadResult',
  schemaVersion: BROLL_CAPTION_OWNER_READ_RESULT_VERSION,
  fields: [...Object.keys(resultCoreSchema.shape), 'resultDigestSha256'].sort(),
  contractRole: 'authenticated_owner_read_result',
} as const

const receiptCore = {
  schemaVersion: BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT_VERSION,
  ownerSkillKey: 'b_roll',
  ownerSkillVersion: BROLL_CAPABILITY_MANIFEST.skillVersion,
  ownerContractVersion: BROLL_CAPABILITY_MANIFEST.contractVersion,
  ownerManifestRef: skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  requestContract: {
    ...REQUEST_CONTRACT_DESCRIPTOR,
    contractDigestSha256: hashSkillValue(REQUEST_CONTRACT_DESCRIPTOR),
  },
  resultContract: {
    ...RESULT_CONTRACT_DESCRIPTOR,
    contractDigestSha256: hashSkillValue(RESULT_CONTRACT_DESCRIPTOR),
  },
  sourceContracts: SOURCE_CONTRACT_DESCRIPTORS.map((descriptor) => ({
    ...descriptor,
    contractDigestSha256: descriptorDigest(descriptor),
    captionReadMode: 'opaque_reference_only' as const,
  })),
  captionBindingTarget: 'caption-broll-owner-read-binding-v1',
  mediationMode: 'hq_mediated_owner_read',
  runtimeBindingDeclared: false,
  runtimeExecutionAuthorized: false,
  authenticatedPrivateEvidenceClaimed: false,
  mediaBytesIncluded: false,
  mediaLocatorIncluded: false,
  sourceSelectionAuthorityGrantedToCaption: false,
  cropOrTimingAuthorityGrantedToCaption: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
} as const

export const BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT = deepFreezeSkillValue({
  ...receiptCore,
  receiptDigestSha256: hashSkillValue(receiptCore),
})

export type BrollCaptionPublicContractReceipt =
  typeof BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT
