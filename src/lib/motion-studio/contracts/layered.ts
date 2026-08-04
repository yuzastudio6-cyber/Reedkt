import { z } from 'zod'

import type { MotionStudioLayerManifestV1 } from '../../../types/motion-studio'
import {
  MOTION_STUDIO_LAYERED_PROFILE_ID,
  MOTION_STUDIO_LAYER_MANIFEST_VERSION,
} from '../../../types/motion-studio'
import { motionStudioTimingAuthoritySchema } from './safe-values'

const safeText = (maximum: number) => z.string().trim().min(1).max(maximum)
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }))
  .refine((value) => !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/i.test(value))

const planeSchema = z.object({
  planeId: z.enum(['background-plane', 'headline-plane', 'subject-plane', 'caption-plane']),
  role: z.enum(['background', 'headline', 'subject', 'caption']),
  zIndex: z.union([z.literal(0), z.literal(10), z.literal(20), z.literal(30)]),
  sourceKind: z.enum(['remotion_native', 'approved_cutout_slot']),
  motionToken: z.enum(['ambient_drift', 'headline_reveal', 'subject_parallax', 'caption_hold']),
  editablePropertyKeys: z.array(z.enum([
    'design.background_token',
    'scene.semantic_purpose',
    'asset.subject_cutout',
    'scene.caption_copy',
  ])).max(2).readonly(),
}).strict()

export const motionStudioLayerManifestV1Schema: z.ZodType<MotionStudioLayerManifestV1> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LAYER_MANIFEST_VERSION),
  compositionProfileId: z.literal(MOTION_STUDIO_LAYERED_PROFILE_ID),
  depthModel: z.literal('semantic_planes_v1'),
  sceneId: safeText(160),
  semanticPurpose: safeText(120),
  headline: safeText(120),
  caption: safeText(160),
  timingAuthority: motionStudioTimingAuthoritySchema,
  sceneRange: z.object({
    startFrame: z.number().int().nonnegative().refine(Number.isSafeInteger),
    endFrame: z.number().int().positive().refine(Number.isSafeInteger),
  }).strict(),
  planes: z.array(planeSchema).length(4).readonly(),
  design: z.object({
    panelBackground: z.literal('#0F172A'),
    panelHighlight: z.literal('#16213E'),
    headlineColor: z.literal('#E0F2FE'),
    accentColor: z.literal('#FF4D8D'),
    captionColor: z.literal('#F8FAFC'),
  }).strict(),
  safeZones: z.object({
    horizontalPercent: z.literal(8),
    verticalPercent: z.literal(8),
    captionBottomPercent: z.literal(9),
  }).strict(),
  maskPolicy: z.object({
    sourceFixtureId: z.literal('server_owned_rembg_portrait_v1'),
    maskRisk: z.literal('low_fixture_only'),
    contactObjectPresent: z.literal(false),
    captionAboveMask: z.literal(true),
    callerMediaAllowed: z.literal(false),
    automaticDepthModelUsed: z.literal(false),
    productionLicenseReviewRequired: z.literal(true),
  }).strict(),
  fallbackPolicy: z.object({
    automaticFallbackAllowed: z.literal(false),
    aiVideoFallbackAllowed: z.literal(false),
    approvedAlternative: z.literal('new_approval_required_for_full_panel_native_graphics'),
  }).strict(),
  revisionPolicy: z.object({
    immutableAssembly: z.literal(true),
    newSceneDocumentVersionRequired: z.literal(true),
    freeFormLayerJsonAllowed: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.sceneRange.startFrame >= value.sceneRange.endFrame) {
    context.addIssue({ code: 'custom', path: ['sceneRange'], message: 'Layered scene range must advance in frames.' })
  }
  if (value.sceneRange.endFrame > value.timingAuthority.durationFrames) {
    context.addIssue({ code: 'custom', path: ['sceneRange', 'endFrame'], message: 'Layered scene range exceeds exact timing authority.' })
  }
  const expected = [
    ['background-plane', 'background', 0, 'remotion_native', 'ambient_drift'],
    ['headline-plane', 'headline', 10, 'remotion_native', 'headline_reveal'],
    ['subject-plane', 'subject', 20, 'approved_cutout_slot', 'subject_parallax'],
    ['caption-plane', 'caption', 30, 'remotion_native', 'caption_hold'],
  ] as const
  value.planes.forEach((plane, index) => {
    const identity = expected[index]
    if (!identity || plane.planeId !== identity[0] || plane.role !== identity[1] ||
      plane.zIndex !== identity[2] || plane.sourceKind !== identity[3] || plane.motionToken !== identity[4]) {
      context.addIssue({ code: 'custom', path: ['planes', index], message: 'Layer plane identity or order is not registered.' })
    }
  })
})

export function validateMotionStudioLayerManifest(value: unknown): {
  ok: boolean
  errors: readonly string[]
} {
  const parsed = motionStudioLayerManifestV1Schema.safeParse(value)
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || '$'}: ${issue.message}`),
    }
  }
  return { ok: true, errors: [] }
}
