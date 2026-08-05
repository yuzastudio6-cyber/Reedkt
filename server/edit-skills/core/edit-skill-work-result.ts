import { z } from 'zod'

import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from './skill-assignment-schema'

const editSkillWorkResultCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-work-result-v1'),
  workItemKey: z.string().trim().min(1).max(180),
  workItemHash: skillSha256Schema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planId: z.string().trim().min(1).max(180),
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  operationId: skillIdentitySchema,
  workerClass: skillIdentitySchema,
  status: z.enum(['succeeded', 'failed']),
  outputArtifactRefs: z.array(editSkillArtifactReferenceSchema).max(100),
  qaLineageKeys: z.array(skillIdentitySchema).min(1).max(100),
  qaEvidenceArtifactRefs: z.array(editSkillArtifactReferenceSchema).max(100),
  mutationRanges: z.array(skillFrameRangeSchema).max(100),
  callerSelectedExecutable: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
  failureCode: skillIdentitySchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.status === 'succeeded' && value.failureCode) {
    context.addIssue({ code: 'custom', message: 'Successful work cannot carry a failure code.' })
  }
  if (value.status === 'failed' && !value.failureCode) {
    context.addIssue({ code: 'custom', message: 'Failed work must carry a safe failure code.' })
  }
})

export const editSkillWorkResultSchema = editSkillWorkResultCoreSchema.extend({
  workResultHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { workResultHash, ...core } = value
  if (hashSkillValue(core) !== workResultHash) {
    context.addIssue({ code: 'custom', message: 'Edit-skill work result hash is stale or forged.' })
  }
})

export type EditSkillWorkResult = z.infer<typeof editSkillWorkResultSchema>

export function createEditSkillWorkResult(
  input: z.input<typeof editSkillWorkResultCoreSchema>,
): EditSkillWorkResult {
  const core = editSkillWorkResultCoreSchema.parse(input)
  return editSkillWorkResultSchema.parse({
    ...core,
    workResultHash: hashSkillValue(core),
  })
}
