import { z } from 'zod'

import { hashSkillValue, skillManifestReference } from '../core/skill-capability-manifest-hash'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from '../core/skill-assignment-schema'
import { BROLL_CAPABILITY_MANIFEST } from './b-roll-capability-manifest'

export const CAPTION_SHARED_OWNER_HANDOFF = Object.freeze({
  sourceCommit: 'a97dc0a931d6364e154f9fab2bebf488e6f708b3',
  publicTypePath: 'src/types/caption-shared-owner-integration.ts',
  contractVersion: 'caption-shared-owner-integration-handoff-v1',
  contractDigest: '12f6bfbb3316d3908b65a00d637ccb0d20cdcf42311ca95a22726c3e8726bd4c',
} as const)

export const BROLL_CAPTION_OWNER_READ_CONTRACT = Object.freeze({
  requestSchemaVersion: 'b_roll_caption_owner_read_request_v1' as const,
  resultSchemaVersion: 'b_roll_caption_owner_read_result_v1' as const,
  selectedMediaManifestArtifactType: 'b_roll_selected_media_manifest_v1' as const,
  layoutOccupancyArtifactType: 'b_roll_caption_layout_occupancy_v1' as const,
  cropTimingArtifactType: 'b_roll_caption_crop_timing_v1' as const,
  visibleTextEvidenceArtifactType: 'b_roll_caption_visible_text_evidence_v1' as const,
  readOnly: true as const,
  executionAuthorityGranted: false as const,
  assetMutationAuthorityGranted: false as const,
  qaApprovalAuthorityGranted: false as const,
  billingAuthorityGranted: false as const,
  publicDeliveryAuthorityGranted: false as const,
  productionAuthorityGranted: false as const,
})

export const BROLL_CAPTION_OWNER_READ_CONTRACT_DIGEST = hashSkillValue({
  schemaVersion: 'b_roll_caption_owner_read_contract_descriptor_v1',
  captionContract: CAPTION_SHARED_OWNER_HANDOFF,
  brollManifestRef: skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  contract: BROLL_CAPTION_OWNER_READ_CONTRACT,
})

export const BROLL_CAPTION_OWNER_READ_INTERFACE_STATUS = Object.freeze({
  typeContractFrozen: true,
  authenticatedOwnerEvidencePublished: false,
  captionPrivateInternalSpecialistQualified: false,
  runtimeRequested: false,
  peerDispatcherImplemented: false,
} as const)

const identity = z.string().trim().min(1).max(180)
const outputLineageSchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedSnapshotId: identity,
  approvedSnapshotHash: skillSha256Schema,
  outputId: identity,
  sceneId: identity,
  frameRange: skillFrameRangeSchema,
  masterTimingHash: skillSha256Schema,
}).strict()

const requestCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_caption_owner_read_request_v1'),
  requestId: identity,
  captionContract: z.object({
    sourceCommit: z.literal(CAPTION_SHARED_OWNER_HANDOFF.sourceCommit),
    contractVersion: z.literal(CAPTION_SHARED_OWNER_HANDOFF.contractVersion),
    contractDigest: z.literal(CAPTION_SHARED_OWNER_HANDOFF.contractDigest),
  }).strict(),
  consumerAssignmentHash: skillSha256Schema,
  brollManifestRef: skillManifestReferenceSchema,
  outputLineage: outputLineageSchema,
  requestedArtifactTypes: z.tuple([
    z.literal('b_roll_selected_media_manifest_v1'),
    z.literal('b_roll_caption_layout_occupancy_v1'),
    z.literal('b_roll_caption_crop_timing_v1'),
    z.literal('b_roll_caption_visible_text_evidence_v1'),
  ]),
  readOnly: z.literal(true),
  executionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  qaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (hashSkillValue(value.brollManifestRef) !== hashSkillValue(
    skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  )) context.addIssue({
    code: 'custom',
    message: 'Caption owner-read request binds a stale B-roll manifest.',
  })
})

export const brollCaptionOwnerReadRequestSchema = requestCoreSchema.extend({
  requestHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { requestHash, ...core } = value
  if (hashSkillValue(core) !== requestHash) context.addIssue({
    code: 'custom',
    message: 'Caption owner-read request hash is stale or forged.',
  })
})

export type BrollCaptionOwnerReadRequest = z.infer<
  typeof brollCaptionOwnerReadRequestSchema
>

export function createBrollCaptionOwnerReadRequest(
  input: z.input<typeof requestCoreSchema>,
): BrollCaptionOwnerReadRequest {
  const core = requestCoreSchema.parse(input)
  return brollCaptionOwnerReadRequestSchema.parse({
    ...core,
    requestHash: hashSkillValue(core),
  })
}

const typedRef = <T extends string>(artifactType: T) =>
  editSkillArtifactReferenceSchema.extend({ artifactType: z.literal(artifactType) }).strict()

const resultCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_caption_owner_read_result_v1'),
  requestHash: skillSha256Schema,
  outputLineage: outputLineageSchema,
  producerManifestRef: skillManifestReferenceSchema,
  producerAssignmentId: identity,
  producerAssignmentHash: skillSha256Schema,
  producerPlanHash: skillSha256Schema,
  producerResultReceiptHash: skillSha256Schema,
  producerQualificationReceiptHash: skillSha256Schema,
  selectedMediaManifestRef: typedRef('b_roll_selected_media_manifest_v1'),
  layoutOccupancyRef: typedRef('b_roll_caption_layout_occupancy_v1'),
  cropTimingRef: typedRef('b_roll_caption_crop_timing_v1'),
  visibleTextEvidenceRef: typedRef('b_roll_caption_visible_text_evidence_v1'),
  authenticatedOwnerRead: z.literal(true),
  byteFreeReferencesOnly: z.literal(true),
  readOnly: z.literal(true),
  executionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  qaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const scope = value.outputLineage
  const refs = [
    value.selectedMediaManifestRef,
    value.layoutOccupancyRef,
    value.cropTimingRef,
    value.visibleTextEvidenceRef,
  ]
  if (refs.some((reference) =>
    reference.ownerUserId !== scope.ownerUserId ||
    reference.workspaceId !== scope.workspaceId ||
    reference.projectId !== scope.projectId)) context.addIssue({
    code: 'custom',
    message: 'Caption owner-read result contains a cross-tenant B-roll reference.',
  })
  if (hashSkillValue(value.producerManifestRef) !== hashSkillValue(
    skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  )) context.addIssue({
    code: 'custom',
    message: 'Caption owner-read result binds a stale B-roll producer manifest.',
  })
})

export const brollCaptionOwnerReadResultSchema = resultCoreSchema.extend({
  resultHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { resultHash, ...core } = value
  if (hashSkillValue(core) !== resultHash) context.addIssue({
    code: 'custom',
    message: 'Caption owner-read result hash is stale or forged.',
  })
})

export type BrollCaptionOwnerReadResult = z.infer<
  typeof brollCaptionOwnerReadResultSchema
>

export function createBrollCaptionOwnerReadResult(input: {
  request: BrollCaptionOwnerReadRequest
  result: z.input<typeof resultCoreSchema>
}): BrollCaptionOwnerReadResult {
  const request = brollCaptionOwnerReadRequestSchema.parse(input.request)
  const core = resultCoreSchema.parse(input.result)
  if (
    core.requestHash !== request.requestHash ||
    hashSkillValue(core.outputLineage) !== hashSkillValue(request.outputLineage)
  ) throw new Error('Caption owner-read result differs from the exact frozen request lineage.')
  return brollCaptionOwnerReadResultSchema.parse({
    ...core,
    resultHash: hashSkillValue(core),
  })
}
