import { z } from 'zod'

import { hashSkillValue } from './skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from './skill-capability-manifest-schema'
import { skillFrameRangeSchema } from './skill-assignment-schema'

const skillPlanEnvelopeCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-plan-envelope-v1'),
  planId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  disposition: z.enum(['use_skill', 'use_no_action', 'needs_other_skill', 'needs_user_review', 'blocked']),
  payloadArtifactType: z.string().trim().min(1).max(180),
  payloadHash: skillSha256Schema,
  dependencySkillKey: z.string().trim().min(1).max(180).optional(),
}).strict().superRefine((value, context) => {
  if ((value.disposition === 'needs_other_skill') !== Boolean(value.dependencySkillKey)) {
    context.addIssue({ code: 'custom', message: 'Only needs_other_skill plans carry a dependency skill key.' })
  }
})

export const skillPlanEnvelopeSchema = skillPlanEnvelopeCoreSchema.extend({
  planHash: skillSha256Schema,
}).strict()

export type SkillPlanEnvelope = z.infer<typeof skillPlanEnvelopeSchema>

export function createSkillPlanEnvelope(
  input: z.input<typeof skillPlanEnvelopeCoreSchema>,
): SkillPlanEnvelope {
  const core = skillPlanEnvelopeCoreSchema.parse(input)
  return skillPlanEnvelopeSchema.parse({ ...core, planHash: hashSkillValue(core) })
}

