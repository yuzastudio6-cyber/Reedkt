import { z } from 'zod'

import type {
  EditSkillArtifactReference,
  EditSkillArtifactSchemaRegistry,
} from './edit-skill-artifact-store'
import { editSkillDependencyAcceptanceSchema } from './edit-skill-dependency-request'
import { ACTIVE_QUALIFICATION_RANK } from './edit-skill-ids'
import { canonicalSkillJson, hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from './skill-assignment-schema'
import { skillRouteQualificationReceiptSchema } from './skill-route-qualification'

const activeProducerQualificationSchema = z.enum([
  'planning_qualified',
  'internal_execution_qualified',
  'production_qualified',
])

export const editSkillSupportRequestReferenceSchema =
  editSkillArtifactReferenceSchema.extend({
    artifactType: z.literal('edit_skill_support_request_v1'),
  }).strict()

export const editSkillSupportResultReferenceSchema =
  editSkillArtifactReferenceSchema.extend({
    artifactType: z.literal('edit_skill_support_result_v1'),
  }).strict()

const sharedSupportAuthoritySchema = z.object({
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  editSessionId: z.string().trim().min(1).max(180),
  sourceSha256: skillSha256Schema,
  sourceArtifactRef: editSkillArtifactReferenceSchema,
}).strict().superRefine((value, context) => {
  if (
    value.sourceArtifactRef.ownerUserId !== value.ownerUserId ||
    value.sourceArtifactRef.workspaceId !== value.workspaceId ||
    value.sourceArtifactRef.projectId !== value.projectId
  ) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support source authority is cross-tenant.',
  })
})

const supportConsumerSchema = z.object({
  skillKey: skillIdentitySchema,
  manifestRef: skillManifestReferenceSchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  dependencyRequestHash: skillSha256Schema,
  requestedRange: skillFrameRangeSchema,
  requestedArtifactType: skillIdentitySchema,
  requiredForPhase: skillIdentitySchema,
}).strict().superRefine((value, context) => {
  if (value.manifestRef.skillKey !== value.skillKey) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support consumer manifest and skill key differ.',
  })
})

const supportProducerSchema = z.object({
  manifestRef: skillManifestReferenceSchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  resultReceiptHash: skillSha256Schema,
  qualificationStatus: activeProducerQualificationSchema,
  qualificationReceiptHash: skillSha256Schema,
  routeQualification: skillRouteQualificationReceiptSchema,
}).strict().superRefine((value, context) => {
  const route = value.routeQualification
  if (
    canonicalSkillJson(route.manifestRef) !== canonicalSkillJson(value.manifestRef) ||
    route.skillQualificationReceiptHash !== value.qualificationReceiptHash ||
    route.qualificationCandidateOnly ||
    route.fixtureEvidenceOnly ||
    !['canonical_private', 'production_server'].includes(route.environmentClass) ||
    !['internal_execution_qualified', 'production_qualified'].includes(
      route.qualificationStatus,
    )
  ) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support producer route is stale, injected, or under-qualified.',
  })
})

const supportRequestCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-support-request-v1'),
  requestId: z.string().trim().min(1).max(180),
  consumer: supportConsumerSchema,
  sharedAuthority: sharedSupportAuthoritySchema,
  producerSkillKey: skillIdentitySchema,
  requiredProducerRouteKey: skillIdentitySchema,
  minimumProducerRouteQualification: z.enum([
    'internal_execution_qualified',
    'production_qualified',
  ]),
  supportRequestOnly: z.literal(true),
  executionAuthorityGranted: z.literal(false),
  providerInvocationAuthorityGranted: z.literal(false),
  timelineMutationAuthorityGranted: z.literal(false),
  scopeExpansionAuthorityGranted: z.literal(false),
}).strict()

export const editSkillSupportRequestSchema = supportRequestCoreSchema.extend({
  requestHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { requestHash, ...core } = value
  if (hashSkillValue(core) !== requestHash) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support request hash is stale or forged.',
  })
})

export type EditSkillSupportRequest = z.infer<typeof editSkillSupportRequestSchema>

export function createEditSkillSupportRequest(
  input: z.input<typeof supportRequestCoreSchema>,
): EditSkillSupportRequest {
  const core = supportRequestCoreSchema.parse(input)
  return editSkillSupportRequestSchema.parse({
    ...core,
    requestHash: hashSkillValue(core),
  })
}

const supportResultCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-support-result-v1'),
  supportRequestRef: editSkillSupportRequestReferenceSchema,
  supportRequestHash: skillSha256Schema,
  consumer: supportConsumerSchema,
  producer: supportProducerSchema,
  sharedAuthority: sharedSupportAuthoritySchema,
  compatibleRange: skillFrameRangeSchema,
  producedArtifactRef: editSkillArtifactReferenceSchema,
  modelNeutral: z.literal(true),
  privateArtifactReferencesOnly: z.literal(true),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
}).strict().superRefine((value, context) => {
  const refs = [value.supportRequestRef, value.producedArtifactRef]
  if (refs.some((reference) =>
    reference.ownerUserId !== value.sharedAuthority.ownerUserId ||
    reference.workspaceId !== value.sharedAuthority.workspaceId ||
    reference.projectId !== value.sharedAuthority.projectId)) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support result contains a cross-tenant artifact.',
  })
  if (
    value.producedArtifactRef.artifactType !== value.consumer.requestedArtifactType ||
    !rangeContains(value.compatibleRange, value.consumer.requestedRange)
  ) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support result type or compatible range differs from the request.',
  })
})

export const editSkillSupportResultSchema = supportResultCoreSchema.extend({
  supportResultHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { supportResultHash, ...core } = value
  if (hashSkillValue(core) !== supportResultHash) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support result hash is stale or forged.',
  })
})

export type EditSkillSupportResult = z.infer<typeof editSkillSupportResultSchema>

export function createEditSkillSupportResult(input: {
  request: EditSkillSupportRequest
  supportRequestRef: EditSkillArtifactReference
  producer: z.input<typeof supportProducerSchema>
  compatibleRange: z.input<typeof skillFrameRangeSchema>
  producedArtifactRef: EditSkillArtifactReference
}): EditSkillSupportResult {
  const request = editSkillSupportRequestSchema.parse(input.request)
  if (
    input.supportRequestRef.artifactType !== 'edit_skill_support_request_v1' ||
    input.supportRequestRef.sha256 !== hashSkillValue(request) ||
    input.supportRequestRef.ownerUserId !== request.sharedAuthority.ownerUserId ||
    input.supportRequestRef.workspaceId !== request.sharedAuthority.workspaceId ||
    input.supportRequestRef.projectId !== request.sharedAuthority.projectId
  ) throw new Error('Edit-skill support result lost its exact persisted request.')
  const core = supportResultCoreSchema.parse({
    schemaVersion: 'edit-skill-support-result-v1',
    supportRequestRef: input.supportRequestRef,
    supportRequestHash: request.requestHash,
    consumer: request.consumer,
    producer: input.producer,
    sharedAuthority: request.sharedAuthority,
    compatibleRange: input.compatibleRange,
    producedArtifactRef: input.producedArtifactRef,
    modelNeutral: true,
    privateArtifactReferencesOnly: true,
    publicArtifactCount: 0,
    productionMutationCount: 0,
  })
  if (
    core.producer.manifestRef.skillKey !== request.producerSkillKey ||
    core.producer.routeQualification.routeKey !== request.requiredProducerRouteKey ||
    qualificationRank(core.producer.routeQualification.qualificationStatus) <
      qualificationRank(request.minimumProducerRouteQualification)
  ) throw new Error('Edit-skill support producer does not satisfy the exact requested route.')
  return editSkillSupportResultSchema.parse({
    ...core,
    supportResultHash: hashSkillValue(core),
  })
}

const supportAcceptanceCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-support-acceptance-v1'),
  requestHash: skillSha256Schema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  artifactRef: editSkillArtifactReferenceSchema,
  validatedArtifactHash: skillSha256Schema,
  acceptedForPhase: skillIdentitySchema,
  productionQualified: z.boolean(),
  supportRequestHash: skillSha256Schema,
  supportResultRef: editSkillSupportResultReferenceSchema,
  supportResultHash: skillSha256Schema,
  producerManifestRef: skillManifestReferenceSchema,
  producerAssignmentId: z.string().trim().min(1).max(180),
  producerAssignmentHash: skillSha256Schema,
  producerPlanHash: skillSha256Schema,
  producerResultReceiptHash: skillSha256Schema,
  producerQualificationStatus: activeProducerQualificationSchema,
  producerQualificationReceiptHash: skillSha256Schema,
  producerRouteQualificationReceiptHash: skillSha256Schema,
  sourceSha256: skillSha256Schema,
  compatibleRange: skillFrameRangeSchema,
}).strict()

export const editSkillSupportAcceptanceSchema = supportAcceptanceCoreSchema.extend({
  acceptanceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { acceptanceHash, ...core } = value
  if (hashSkillValue(core) !== acceptanceHash) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support acceptance hash is stale or forged.',
  })
  if (value.validatedArtifactHash !== value.artifactRef.sha256) context.addIssue({
    code: 'custom',
    message: 'Edit-skill support acceptance lost its exact produced artifact.',
  })
})

export type EditSkillSupportAcceptance = z.infer<typeof editSkillSupportAcceptanceSchema>

export function createEditSkillSupportAcceptance(
  input: z.input<typeof supportAcceptanceCoreSchema>,
): EditSkillSupportAcceptance {
  const core = supportAcceptanceCoreSchema.parse(input)
  return editSkillSupportAcceptanceSchema.parse({
    ...core,
    acceptanceHash: hashSkillValue(core),
  })
}

export const editSkillArtifactAcceptanceSchema = z.union([
  editSkillDependencyAcceptanceSchema,
  editSkillSupportAcceptanceSchema,
])

export type EditSkillArtifactAcceptance = z.infer<
  typeof editSkillArtifactAcceptanceSchema
>

export function assertEditSkillSupportResultForRequest(input: {
  request: EditSkillSupportRequest
  result: EditSkillSupportResult
  supportResultRef: EditSkillArtifactReference
}): EditSkillSupportResult {
  const request = editSkillSupportRequestSchema.parse(input.request)
  const result = editSkillSupportResultSchema.parse(input.result)
  if (
    input.supportResultRef.artifactType !== 'edit_skill_support_result_v1' ||
    input.supportResultRef.sha256 !== hashSkillValue(result) ||
    result.supportRequestHash !== request.requestHash ||
    canonicalSkillJson(result.consumer) !== canonicalSkillJson(request.consumer) ||
    canonicalSkillJson(result.sharedAuthority) !== canonicalSkillJson(request.sharedAuthority) ||
    result.producer.manifestRef.skillKey !== request.producerSkillKey ||
    result.producer.routeQualification.routeKey !== request.requiredProducerRouteKey ||
    qualificationRank(result.producer.routeQualification.qualificationStatus) <
      qualificationRank(request.minimumProducerRouteQualification) ||
    result.producedArtifactRef.artifactType !== request.consumer.requestedArtifactType ||
    !rangeContains(result.compatibleRange, request.consumer.requestedRange)
  ) throw new Error(
    'Edit-skill support result is stale, cross-source, out-of-range, or under-qualified.',
  )
  return result
}

export function registerEditSkillSupportArtifactSchemas(
  registry: EditSkillArtifactSchemaRegistry,
): void {
  for (const [artifactType, schema] of [
    ['edit_skill_support_request_v1', editSkillSupportRequestSchema],
    ['edit_skill_support_result_v1', editSkillSupportResultSchema],
  ] as const) {
    if (!registry.has(artifactType)) registry.register(artifactType, schema)
  }
}

function qualificationRank(value: string): number {
  const rank = ACTIVE_QUALIFICATION_RANK[value as keyof typeof ACTIVE_QUALIFICATION_RANK]
  if (rank === undefined) throw new Error(`Inactive edit-skill qualification ${value}.`)
  return rank
}

function rangeContains(
  outer: z.infer<typeof skillFrameRangeSchema>,
  inner: z.infer<typeof skillFrameRangeSchema>,
): boolean {
  return outer.fps === inner.fps &&
    outer.startFrameInclusive <= inner.startFrameInclusive &&
    outer.endFrameExclusive >= inner.endFrameExclusive
}
