import { z } from 'zod'

import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from './skill-assignment-schema'

const editSkillDependencyRequestCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-dependency-request-v1'),
  requestId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planId: z.string().trim().min(1).max(180),
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  dependencySkillKey: skillIdentitySchema,
  requiredArtifactType: skillIdentitySchema,
  requiredForPhase: skillIdentitySchema,
  minimumQualificationStatus: z.enum([
    'declared',
    'implementation_pending',
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
  ]),
  reason: z.string().trim().min(1).max(2_000),
  required: z.literal(true),
}).strict()

export const editSkillDependencyRequestSchema = editSkillDependencyRequestCoreSchema.extend({
  requestHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { requestHash, ...core } = value
  if (hashSkillValue(core) !== requestHash) {
    context.addIssue({ code: 'custom', message: 'Edit-skill dependency request hash is stale or forged.' })
  }
})

export type EditSkillDependencyRequest = z.infer<typeof editSkillDependencyRequestSchema>

export function createEditSkillDependencyRequest(
  input: z.input<typeof editSkillDependencyRequestCoreSchema>,
): EditSkillDependencyRequest {
  const core = editSkillDependencyRequestCoreSchema.parse(input)
  return editSkillDependencyRequestSchema.parse({
    ...core,
    requestHash: hashSkillValue(core),
  })
}

const editSkillDependencyAcceptanceCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-dependency-acceptance-v1'),
  requestHash: skillSha256Schema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  artifactRef: editSkillArtifactReferenceSchema,
  validatedArtifactHash: skillSha256Schema,
  acceptedForPhase: skillIdentitySchema,
  productionQualified: z.boolean(),
}).strict()

export const editSkillDependencyAcceptanceSchema = editSkillDependencyAcceptanceCoreSchema.extend({
  acceptanceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { acceptanceHash, ...core } = value
  if (hashSkillValue(core) !== acceptanceHash) {
    context.addIssue({ code: 'custom', message: 'Edit-skill dependency acceptance hash is stale or forged.' })
  }
  if (value.validatedArtifactHash !== value.artifactRef.sha256) {
    context.addIssue({ code: 'custom', message: 'Dependency acceptance does not bind the exact artifact hash.' })
  }
})

export type EditSkillDependencyAcceptance = z.infer<typeof editSkillDependencyAcceptanceSchema>

export function createEditSkillDependencyAcceptance(
  input: z.input<typeof editSkillDependencyAcceptanceCoreSchema>,
): EditSkillDependencyAcceptance {
  const core = editSkillDependencyAcceptanceCoreSchema.parse(input)
  return editSkillDependencyAcceptanceSchema.parse({
    ...core,
    acceptanceHash: hashSkillValue(core),
  })
}
