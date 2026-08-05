import { z } from 'zod'

import { hashSkillValue } from './skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from './skill-capability-manifest-schema'
import { skillFrameRangeSchema } from './skill-assignment-schema'

const skillResultEnvelopeCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-result-envelope-v1'),
  resultId: z.string().trim().min(1).max(180),
  planId: z.string().trim().min(1).max(180),
  planHash: skillSha256Schema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  disposition: z.enum([
    'selected', 'rejected', 'deferred', 'use_no_action', 'needs_other_skill',
    'needs_user_review', 'blocked',
  ]),
  resultArtifactType: z.string().trim().min(1).max(180),
  resultArtifactHash: skillSha256Schema,
  qaEvidenceHashes: z.array(skillSha256Schema).max(100),
  mutationRanges: z.array(skillFrameRangeSchema).max(100),
}).strict()

export const skillResultEnvelopeSchema = skillResultEnvelopeCoreSchema.extend({
  resultHash: skillSha256Schema,
}).strict()

export type SkillResultEnvelope = z.infer<typeof skillResultEnvelopeSchema>

export function createSkillResultEnvelope(
  input: z.input<typeof skillResultEnvelopeCoreSchema>,
): SkillResultEnvelope {
  const core = skillResultEnvelopeCoreSchema.parse(input)
  return skillResultEnvelopeSchema.parse({ ...core, resultHash: hashSkillValue(core) })
}
