import { z } from 'zod'

import type {
  MotionStudioGenerationRoutePolicy,
  MotionStudioGenerationRoutePolicyV1,
  MotionStudioGenerationRoutePolicyV2,
  MotionStudioGenerationShotSpecV1,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_GENERATION_SPEC_VERSION,
  MOTION_STUDIO_VIDEO_ROUTING_AUTHORITY_VERSION,
} from '../../../types/motion-studio'
import { validateMotionStudioDeepValue } from './safe-values'
import { motionStudioTimingAuthoritySchema } from './safe-values'

const safeText = (maximum: number) => z.string().trim().min(1).max(maximum)
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }))
  .refine((value) => !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/i.test(value))

const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)

const generationReferenceSchema = z.object({
  referenceContract: z.object({
    artifactId: stableId,
    versionId: stableId,
    versionNumber: z.number().int().positive().refine(Number.isSafeInteger),
    contentDigest: digest,
  }).strict(),
  assetId: stableId,
  assetVersionId: stableId,
  contentDigest: digest,
  role: z.enum([
    'style', 'composition', 'character', 'location', 'object', 'motion',
    'camera', 'first_frame', 'last_frame', 'do_not_copy',
  ]),
  instruction: safeText(500),
}).strict()

const legacyRouteCandidateSchema = z.object({
  providerRoute: z.enum(['gpt_image_2', 'wan', 'hailuo', 'veo']),
  routeRole: z.enum(['primary', 'alternate', 'fallback', 'final_rescue']),
  supportedMediaKind: z.enum(['still_image', 'video_clip']),
  allowedTiers: z.array(z.enum(['basic', 'pro', 'premium'])).min(1).max(3).readonly(),
  finalFallbackOnly: z.boolean(),
  capabilityReason: safeText(500),
}).strict()

const routeCandidateSchema = z.object({
  providerRoute: z.enum(['gpt_image_2', 'gemini_omni_flash', 'wan', 'hailuo', 'veo']),
  routeRole: z.enum(['primary', 'alternate', 'fallback', 'final_rescue']),
  supportedMediaKind: z.enum(['still_image', 'video_clip']),
  allowedTiers: z.array(z.enum(['basic', 'pro', 'premium'])).min(1).max(3).readonly(),
  finalFallbackOnly: z.boolean(),
  capabilityReason: safeText(500),
}).strict()

export const motionStudioGenerationRoutePolicyV1Schema: z.ZodType<MotionStudioGenerationRoutePolicyV1> = z.object({
  policyId: z.literal('motion_studio_generation_route_policy_v1'),
  modelTier: z.enum(['basic', 'pro', 'premium']),
  mediaKind: z.enum(['still_image', 'video_clip']),
  candidates: z.array(legacyRouteCandidateSchema).min(1).max(4).readonly(),
  automaticFallbackAllowed: z.literal(false),
  newApprovalRequiredForFallback: z.literal(true),
  exactTextDataAndLogosRemainDeterministic: z.literal(true),
}).strict().superRefine((value, context) => {
  const ids = new Set<string>()
  value.candidates.forEach((candidate, index) => {
    if (ids.has(candidate.providerRoute)) {
      context.addIssue({ code: 'custom', path: ['candidates', index], message: 'Provider route candidates must be unique.' })
    }
    ids.add(candidate.providerRoute)
    if (candidate.supportedMediaKind !== value.mediaKind) {
      context.addIssue({ code: 'custom', path: ['candidates', index, 'supportedMediaKind'], message: 'Route candidate media kind must match the policy.' })
    }
    if (!candidate.allowedTiers.includes(value.modelTier)) {
      context.addIssue({ code: 'custom', path: ['candidates', index, 'allowedTiers'], message: 'Route candidate must explicitly allow the selected tier.' })
    }
    if (candidate.providerRoute === 'gpt_image_2' && value.mediaKind !== 'still_image') {
      context.addIssue({ code: 'custom', path: ['candidates', index], message: 'GPT Image 2 cannot be a video route.' })
    }
    if (candidate.providerRoute === 'veo') {
      if (value.modelTier !== 'premium' || candidate.routeRole !== 'final_rescue' || !candidate.finalFallbackOnly) {
        context.addIssue({ code: 'custom', path: ['candidates', index], message: 'Veo is Premium final rescue only.' })
      }
    } else if (candidate.finalFallbackOnly) {
      context.addIssue({ code: 'custom', path: ['candidates', index, 'finalFallbackOnly'], message: 'Only the registered final-rescue route may be final-fallback-only.' })
    }
  })
  const primaryCount = value.candidates.filter((candidate) => candidate.routeRole === 'primary').length
  if (primaryCount !== 1) {
    context.addIssue({ code: 'custom', path: ['candidates'], message: 'Generation route policy requires exactly one primary route.' })
  }
  const primary = value.candidates.find((candidate) => candidate.routeRole === 'primary')
  if (value.mediaKind === 'still_image' && primary?.providerRoute !== 'gpt_image_2') {
    context.addIssue({ code: 'custom', path: ['candidates'], message: 'GPT Image 2 is the registered primary still route.' })
  }
  if (value.mediaKind === 'video_clip' && primary?.providerRoute !== 'wan') {
    context.addIssue({ code: 'custom', path: ['candidates'], message: 'Wan is the registered legacy V1 primary video route.' })
  }
})

export const motionStudioGenerationRoutePolicyV2Schema: z.ZodType<MotionStudioGenerationRoutePolicyV2> = z.object({
  policyId: z.literal('motion_studio_generation_route_policy_v2'),
  routingAuthorityVersion: z.literal(MOTION_STUDIO_VIDEO_ROUTING_AUTHORITY_VERSION),
  modelTier: z.enum(['basic', 'pro', 'premium']),
  mediaKind: z.enum(['still_image', 'video_clip']),
  candidates: z.array(routeCandidateSchema).min(1).max(4).readonly(),
  automaticFallbackAllowed: z.literal(false),
  newApprovalRequiredForFallback: z.literal(true),
  exactTextDataAndLogosRemainDeterministic: z.literal(true),
}).strict().superRefine((value, context) => {
  const routes = value.candidates.map((candidate) => candidate.providerRoute)
  if (new Set(routes).size !== routes.length) {
    context.addIssue({ code: 'custom', path: ['candidates'], message: 'Provider route candidates must be unique.' })
  }
  value.candidates.forEach((candidate, index) => {
    if (candidate.supportedMediaKind !== value.mediaKind) {
      context.addIssue({ code: 'custom', path: ['candidates', index, 'supportedMediaKind'], message: 'Route candidate media kind must match the policy.' })
    }
    if (!candidate.allowedTiers.includes(value.modelTier)) {
      context.addIssue({ code: 'custom', path: ['candidates', index, 'allowedTiers'], message: 'Route candidate must explicitly allow the selected tier.' })
    }
    if (candidate.providerRoute === 'gpt_image_2' && value.mediaKind !== 'still_image') {
      context.addIssue({ code: 'custom', path: ['candidates', index], message: 'GPT Image 2 cannot be a video route.' })
    }
    if (candidate.providerRoute === 'gemini_omni_flash' && value.mediaKind !== 'video_clip') {
      context.addIssue({ code: 'custom', path: ['candidates', index], message: 'Gemini Omni Flash is a video route.' })
    }
    if (candidate.providerRoute === 'veo') {
      if (value.modelTier !== 'premium' || candidate.routeRole !== 'final_rescue' || !candidate.finalFallbackOnly) {
        context.addIssue({ code: 'custom', path: ['candidates', index], message: 'Veo is Premium final rescue only.' })
      }
    } else if (candidate.finalFallbackOnly) {
      context.addIssue({ code: 'custom', path: ['candidates', index, 'finalFallbackOnly'], message: 'Only Veo may be final-fallback-only.' })
    }
  })
  const expectedRoutes = value.mediaKind === 'still_image'
    ? ['gpt_image_2']
    : value.modelTier === 'premium'
      ? ['gemini_omni_flash', 'wan', 'hailuo', 'veo']
      : ['gemini_omni_flash', 'wan', 'hailuo']
  if (routes.join('\u0000') !== expectedRoutes.join('\u0000')) {
    context.addIssue({ code: 'custom', path: ['candidates'], message: 'Current provider routes must follow the registered deterministic order.' })
  }
  const expectedRoles = value.mediaKind === 'still_image'
    ? ['primary']
    : value.modelTier === 'premium'
      ? ['primary', 'alternate', 'fallback', 'final_rescue']
      : ['primary', 'alternate', 'fallback']
  const roles = value.candidates.map((candidate) => candidate.routeRole)
  if (roles.join('\u0000') !== expectedRoles.join('\u0000')) {
    context.addIssue({ code: 'custom', path: ['candidates'], message: 'Current provider route roles do not match the registered authority.' })
  }
})

export const motionStudioGenerationRoutePolicySchema: z.ZodType<MotionStudioGenerationRoutePolicy> =
  z.union([motionStudioGenerationRoutePolicyV2Schema, motionStudioGenerationRoutePolicyV1Schema])

export const motionStudioGenerationShotSpecV1Schema: z.ZodType<MotionStudioGenerationShotSpecV1> = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_GENERATION_SPEC_VERSION),
  productionId: stableId,
  approvedSnapshotId: stableId,
  sceneId: stableId,
  semanticPurpose: safeText(240),
  mediaKind: z.enum(['still_image', 'video_clip']),
  timingAuthority: motionStudioTimingAuthoritySchema,
  sceneRange: z.object({
    startFrame: z.number().int().nonnegative().refine(Number.isSafeInteger),
    endFrame: z.number().int().positive().refine(Number.isSafeInteger),
  }).strict(),
  visualDirection: safeText(1_500),
  primaryAction: safeText(700),
  cameraBehavior: safeText(500),
  continuityProfileId: stableId,
  references: z.array(generationReferenceSchema).max(16).readonly(),
  output: z.object({
    quality: z.literal('draft'),
    imageFormat: z.enum(['png', 'jpeg', 'webp']).optional(),
    videoFormat: z.literal('mp4').optional(),
  }).strict(),
  deterministicOverlayPolicy: z.object({
    exactTextInProviderMediaAllowed: z.literal(false),
    captionsInProviderMediaAllowed: z.literal(false),
    chartsInProviderMediaAllowed: z.literal(false),
    mapsInProviderMediaAllowed: z.literal(false),
    statisticsInProviderMediaAllowed: z.literal(false),
    logosInProviderMediaAllowed: z.literal(false),
    finalCanvasOwnedByRemotion: z.literal(true),
  }).strict(),
  exclusions: z.array(safeText(300)).min(1).max(32).readonly(),
  qaRequirements: z.array(z.enum([
    'checksum', 'media_facts', 'safety', 'reference_adherence', 'continuity',
    'intent_alignment',
  ])).min(3).max(6).readonly(),
  simulatorPolicy: z.object({
    allowed: z.literal(true),
    outputIsProviderGenerated: z.literal(false),
    finalAssetEligible: z.literal(false),
    qualityCalibrationMeasured: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.sceneRange.startFrame >= value.sceneRange.endFrame) {
    context.addIssue({ code: 'custom', path: ['sceneRange'], message: 'Generation scene range must advance in frames.' })
  }
  if (value.sceneRange.endFrame > value.timingAuthority.durationFrames) {
    context.addIssue({ code: 'custom', path: ['sceneRange', 'endFrame'], message: 'Generation scene range exceeds exact timing authority.' })
  }
  if (value.mediaKind === 'still_image' && (!value.output.imageFormat || value.output.videoFormat)) {
    context.addIssue({ code: 'custom', path: ['output'], message: 'Still generation requires only an image format.' })
  }
  if (value.mediaKind === 'video_clip' && (!value.output.videoFormat || value.output.imageFormat)) {
    context.addIssue({ code: 'custom', path: ['output'], message: 'Video generation requires only the registered MP4 format.' })
  }
  if (value.mediaKind === 'still_image') {
    const pixels = value.timingAuthority.width * value.timingAuthority.height
    if (value.timingAuthority.width > 3840 || value.timingAuthority.height > 3840 ||
      pixels < 655_360 || pixels > 8_294_400 ||
      Math.max(value.timingAuthority.width, value.timingAuthority.height) /
        Math.min(value.timingAuthority.width, value.timingAuthority.height) > 3) {
      context.addIssue({ code: 'custom', path: ['timingAuthority'], message: 'GPT Image 2 draft dimensions are outside the registered documented constraints.' })
    }
  }
  const referenceIdentities = new Set<string>()
  value.references.forEach((reference, index) => {
    const identity = `${reference.referenceContract.versionId}\u0000${reference.assetId}\u0000${reference.assetVersionId}\u0000${reference.role}`
    if (referenceIdentities.has(identity)) {
      context.addIssue({ code: 'custom', path: ['references', index], message: 'Generation reference bindings must be unique.' })
    }
    referenceIdentities.add(identity)
  })
})

export function validateMotionStudioGenerationShotSpec(value: unknown): {
  ok: boolean
  errors: readonly string[]
} {
  const parsed = motionStudioGenerationShotSpecV1Schema.safeParse(value)
  const errors = parsed.success
    ? []
    : parsed.error.issues.map((issue) => `${issue.path.join('.') || '$'}: ${issue.message}`)
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export function validateMotionStudioGenerationRoutePolicy(value: unknown): {
  ok: boolean
  errors: readonly string[]
} {
  const parsed = motionStudioGenerationRoutePolicySchema.safeParse(value)
  const errors = parsed.success
    ? []
    : parsed.error.issues.map((issue) => `${issue.path.join('.') || '$'}: ${issue.message}`)
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}
