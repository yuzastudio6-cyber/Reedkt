import { z } from 'zod'

import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from './skill-assignment-schema'
import { skillSha256Schema } from './skill-capability-manifest-schema'

export const skillContextManifestSchema = z.object({
  schemaVersion: z.literal('edit-skill-context-manifest-v1'),
  assignmentId: z.string().trim().min(1).max(180),
  authorizedRange: skillFrameRangeSchema,
  wholeVideoContextReadOnly: z.literal(true),
  adjacentSceneContextReadOnly: z.literal(true),
  transcriptRef: editSkillArtifactReferenceSchema.optional(),
  visualEvidenceRefs: z.array(editSkillArtifactReferenceSchema).max(100),
  sourceInventoryRef: editSkillArtifactReferenceSchema,
  editPreferenceRef: editSkillArtifactReferenceSchema.optional(),
  referenceDnaRef: editSkillArtifactReferenceSchema.optional(),
  priorSkillResultRefs: z.array(editSkillArtifactReferenceSchema).max(100),
  contextHash: skillSha256Schema,
}).strict()

export type SkillContextManifest = z.infer<typeof skillContextManifestSchema>

