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
