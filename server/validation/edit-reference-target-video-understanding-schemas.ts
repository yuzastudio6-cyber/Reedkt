import { z } from 'zod'
import {
  EDIT_REFERENCE_TARGET_BUDGET_PREFERENCES,
  EDIT_REFERENCE_TARGET_CONTENT_TYPES,
  EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES,
} from '../../src/types/edit-reference'
import { idSchema } from './common-schemas'
import {
  projectEditSessionAspectRatioSchema,
  projectEditSessionPlatformTargetSchema,
} from './project-edit-session-schemas'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const startEditReferenceTargetVideoUnderstandingSchema = z.object({
  workspaceId: idSchema.max(160),
  editReferenceId: idSchema.max(200),
  studySessionId: idSchema.max(200),
  sourceStorageObjectRecordId: idSchema.max(200),
  sourceMediaAssetId: idSchema.max(200),
  expectedEditBriefRevision: z.number().int().positive(),
  expectedEditBriefDigestSha256: sha256Schema,
  contentType: z.enum(EDIT_REFERENCE_TARGET_CONTENT_TYPES),
  currentUserInstruction: z.string().trim().min(1).max(4_000),
  selectedEditLevel: z.enum(['normal', 'premium', 'ultra_premium']),
  aspectRatio: projectEditSessionAspectRatioSchema.exclude(['custom']),
  outputFrameConfirmed: z.literal(true),
  platformTarget: projectEditSessionPlatformTargetSchema,
  storyRole: z.string().trim().min(1).max(500),
  budgetPreference: z.enum(EDIT_REFERENCE_TARGET_BUDGET_PREFERENCES),
  directives: z.object({
    captions: z.enum(EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES),
    music: z.enum(EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES),
    sfx: z.enum(EDIT_REFERENCE_TARGET_DIRECTIVE_VALUES),
    sourceOrder: z.enum(['adapt', 'preserve']),
  }).strict(),
  approvedConstraints: z.array(z.string().trim().min(1).max(500)).max(12),
}).strict()

export const readEditReferenceTargetVideoUnderstandingSchema = z.object({
  workspaceId: idSchema.max(160),
  editReferenceId: idSchema.max(200),
  studySessionId: idSchema.max(200),
  sourceStorageObjectRecordId: idSchema.max(200),
  sourceMediaAssetId: idSchema.max(200),
  expectedEditBriefRevision: z.coerce.number().int().positive(),
  expectedEditBriefDigestSha256: sha256Schema,
}).strict()

export type StartEditReferenceTargetVideoUnderstandingRequest = z.infer<
  typeof startEditReferenceTargetVideoUnderstandingSchema
>

export type ReadEditReferenceTargetVideoUnderstandingRequest = z.infer<
  typeof readEditReferenceTargetVideoUnderstandingSchema
>
