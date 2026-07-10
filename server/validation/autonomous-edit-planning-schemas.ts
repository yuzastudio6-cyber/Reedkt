import { z } from 'zod'
import type {
  AutonomousEditOperationId,
  CreateAutonomousEditPlanRequest,
} from '../../src/types/autonomous-edit-planning'
import { idSchema } from './common-schemas'

const safeText = (max: number) => z.string().trim().min(1).max(max)

export const autonomousEditOperationIds = [
  'timeline.select',
  'timeline.trim',
  'timeline.smart_cut',
  'caption.generate',
  'caption.align',
  'caption.style',
  'graphics.compose',
  'graphics.animate',
  'broll.select',
  'broll.generate',
  'audio.cleanup',
  'audio.loudness.normalize',
  'audio.music.plan',
  'audio.sfx.plan',
  'color.correct',
  'color.grade',
  'transition.apply',
  'render.compose',
  'qa.validate',
] as const satisfies readonly AutonomousEditOperationId[]

const outputFrameSchema = z.object({
  aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5', 'custom']),
  platformTarget: z.enum([
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
  ]),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
  confirmed: z.literal(true),
}).strict()

const sourceSchema = z.object({
  storageObjectRecordId: idSchema,
  mediaAssetId: idSchema,
  bucketName: safeText(240),
  objectPath: safeText(1200),
  fileName: safeText(240),
  mimeType: safeText(120),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024 * 1024),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
}).strict()

export const createAutonomousEditPlanSchema = z.object({
  workspaceId: idSchema,
  prompt: safeText(6000),
  source: sourceSchema,
  outputFrame: outputFrameSchema,
  editBrief: z.object({
    briefId: idSchema,
    revisionNumber: z.number().int().positive(),
    briefFingerprint: safeText(160),
    summary: safeText(6000),
  }).strict().optional(),
  preferences: z.object({
    pacing: safeText(240).optional(),
    captionStyle: safeText(240).optional(),
    visualStyle: safeText(240).optional(),
    audioStyle: safeText(240).optional(),
    colorStyle: safeText(240).optional(),
    cleanupPreference: safeText(240).optional(),
    notes: z.array(safeText(500)).max(24).optional(),
  }).strict().optional(),
  referenceSource: sourceSchema.optional(),
  analysisMode: z.literal('local_internal'),
}).strict() satisfies z.ZodType<CreateAutonomousEditPlanRequest>
