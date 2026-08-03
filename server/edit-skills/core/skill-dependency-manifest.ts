import { z } from 'zod'

import { EDIT_SKILL_KEYS } from './edit-skill-ids'
import { editSkillArtifactReferenceSchema } from './skill-assignment-schema'
import { skillSha256Schema } from './skill-capability-manifest-schema'

export const skillDependencyManifestSchema = z.object({
  schemaVersion: z.literal('edit-skill-dependency-manifest-v1'),
  assignmentId: z.string().trim().min(1).max(180),
  satisfied: z.array(z.object({
    skillKey: z.enum(EDIT_SKILL_KEYS),
    artifactType: z.string().trim().min(1).max(180),
    artifactRef: editSkillArtifactReferenceSchema,
  }).strict()).max(100),
  missing: z.array(z.object({
    skillKey: z.enum(EDIT_SKILL_KEYS),
    artifactType: z.string().trim().min(1).max(180),
    reason: z.string().trim().min(1).max(2_000),
  }).strict()).max(100),
  dependencyHash: skillSha256Schema,
}).strict()

export type SkillDependencyManifest = z.infer<typeof skillDependencyManifestSchema>

