import { z } from 'zod'

import { EDIT_SKILL_KEYS } from './edit-skill-ids'
import { skillManifestReferenceSchema, skillSha256Schema } from './skill-capability-manifest-schema'
import { timelineRateDisplayFps, timelineRateSchema } from './timeline-rate'

export const skillFrameRangeSchema = z.object({
  startFrameInclusive: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  endFrameExclusive: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  timelineRate: timelineRateSchema.optional(),
  fps: z.number().positive().max(240),
}).strict().superRefine((value, context) => {
  if (value.endFrameExclusive <= value.startFrameInclusive) {
    context.addIssue({ code: 'custom', message: 'Skill assignment range must have positive duration.' })
  }
  if (value.timelineRate && Math.abs(timelineRateDisplayFps(value.timelineRate) - value.fps) > 1e-9) {
    context.addIssue({ code: 'custom', message: 'Legacy fps does not match the exact timeline rate.' })
  }
})

export const editSkillArtifactReferenceSchema = z.object({
  artifactType: z.string().trim().min(1).max(180),
  sha256: skillSha256Schema,
  byteLength: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
}).strict()

const skillAssignmentCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-assignment-v1'),
  assignmentId: z.string().trim().min(1).max(180),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  editSessionId: z.string().trim().min(1).max(180),
  planningRequestId: z.string().trim().min(1).max(180),
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  reason: z.string().trim().min(1).max(4_000),
  intendedViewerBenefit: z.string().trim().min(1).max(4_000),
  editorialContext: z.string().trim().min(1).max(8_000),
  visualOwnership: z.enum(['primary', 'support', 'coordination_only']),
  contextArtifactRefs: z.array(editSkillArtifactReferenceSchema).max(200),
  dependencyArtifactRefs: z.array(editSkillArtifactReferenceSchema).max(200),
  requestedBySkill: z.union([z.enum(EDIT_SKILL_KEYS), z.literal('orchestra')]),
}).strict()

export const skillAssignmentSchema = skillAssignmentCoreSchema.extend({
  assignmentHash: skillSha256Schema,
}).strict()

export type SkillAssignmentInput = z.input<typeof skillAssignmentCoreSchema>

export { skillAssignmentCoreSchema }
