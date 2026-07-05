import { z } from 'zod'
import { idSchema } from './common-schemas'

export const projectEditSessionAspectRatioSchema = z.enum(['9:16', '16:9', '1:1', '4:5', 'custom'])

export const projectEditSessionPlatformTargetSchema = z.enum([
  'tiktok_reel',
  'instagram_reel',
  'instagram_feed',
  'youtube_shorts',
  'youtube_standard',
  'linkedin',
  'website',
  'podcast_clip',
  'ad_creative',
  'internal_review',
  'custom',
])

export const projectEditSessionEditLevelSchema = z.enum([
  'basic',
  'pro',
  'premium',
  'normal',
  'ultra_premium',
])

export const projectEditSessionStatusSchema = z.enum([
  'draft',
  'setup_ready',
  'awaiting_approval',
  'approved',
  'in_progress_mock',
  'preview_ready',
  'final_export_ready',
  'revision_requested',
  'needs_review',
  'rendered_future',
  'archived',
])

export const projectEditSessionApprovalStatusSchema = z.enum([
  'not_requested',
  'requested',
  'approved',
  'rejected',
  'reset_after_revision',
])

export const projectEditSessionLifecycleCheckpointSchema = z.object({
  workspaceId: idSchema,
  status: projectEditSessionStatusSchema,
  checkpointKind: z.enum([
    'source_uploaded',
    'brief_saved',
    'plan_approved',
    'preview_ready',
    'preview_reviewed',
    'professional_qa_checked',
    'final_export_ready',
    'setup_reset',
  ]),
  approvalStatus: projectEditSessionApprovalStatusSchema.optional(),
  sourceMediaAssetId: z.string().optional(),
  latestSnapshotId: z.string().optional(),
  latestPreviewId: z.string().optional(),
  latestPreviewUrl: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const createProjectEditSessionSchema = z.object({
  workspaceId: idSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  aspectRatio: projectEditSessionAspectRatioSchema,
  platformTarget: projectEditSessionPlatformTargetSchema,
  selectedEditLevel: projectEditSessionEditLevelSchema.optional(),
  selectedEditPreferenceHandle: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateProjectEditSessionRequest = z.infer<typeof createProjectEditSessionSchema>
export type ProjectEditSessionLifecycleCheckpointRequest = z.infer<typeof projectEditSessionLifecycleCheckpointSchema>
