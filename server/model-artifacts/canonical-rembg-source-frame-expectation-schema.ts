import { z } from 'zod'

export const CANONICAL_REMBG_MAXIMUM_SOURCE_MEDIA_BYTES =
  (4 * 1_024 * 1_024 * 1_024) - 65_536
export const CANONICAL_REMBG_MAXIMUM_SOURCE_FRAME_BYTES =
  16 * 1_024 * 1_024
export const CANONICAL_REMBG_MAXIMUM_FRAME_DIMENSION = 4_096
export const CANONICAL_REMBG_MAXIMUM_FRAME_PIXEL_COUNT =
  16_777_216

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdSchema = z.string()
  .regex(/^[A-Za-z][A-Za-z0-9_-]{7,159}$/u)
  .refine((value) => !value.includes('..'))

export const canonicalRembgSourceFrameExpectationInputSchema =
  z.object({
    sourceSequenceItemId: safeIdSchema,
    mediaAssetId: safeIdSchema,
    sourceCleanupDecisionId: safeIdSchema,
    masterFrameIndex: z.number().int().min(0)
      .max(10_000_000),
    sourceFrameIndex: z.number().int().min(0)
      .max(10_000_000),
    frameRate: z.number().int().min(1).max(240),
    frameSelectionPolicy: z.literal(
      'scene_start_meaning_anchor_v1',
    ),
    sourceFrameSelectionDigestSha256: digestSchema,
    sourceMediaContentSha256: digestSchema,
    sourceMediaByteLength: z.number().int().positive()
      .max(CANONICAL_REMBG_MAXIMUM_SOURCE_MEDIA_BYTES),
    sourceMediaContentType: z.enum([
      'video/mp4',
      'video/quicktime',
    ]),
    sourceBindingHash: digestSchema,
    storageIdentityHash: digestSchema,
    frameExtractionWorkItemKey: safeIdSchema,
    frameExtractionWorkItemDigestSha256: digestSchema,
    frameExtractionOperation: z.literal(
      'extract_approved_exact_source_frame_png',
    ),
    frameExtractionRecipeProfileId: z.literal(
      'approved_exact_source_frame_png_v1',
    ),
    frameExtractionToolId: z.literal('ffmpeg'),
    frameExtractionToolOperationId: z.literal(
      'tool.ffmpeg.execute_approved_media_recipe.v1',
    ),
    frameExtractionOutputKey: safeIdSchema,
    frameExtractionDependencyJobId: safeIdSchema,
    frameExtractionExecutionAttemptId: safeIdSchema,
    frameExtractionSourceLeaseImmutableHash: digestSchema,
    frameExtractionDependencyReadEvidenceHash: digestSchema,
    frameArtifactId: safeIdSchema,
    frameArtifactAssetId: safeIdSchema,
    frameArtifactVersion: z.number().int().positive()
      .max(10_000),
    frameArtifactType: z.literal(
      'approved_exact_source_frame_png',
    ),
    frameArtifactContentType: z.literal('image/png'),
    frameArtifactSha256: digestSchema,
    frameArtifactByteLength: z.number().int().positive()
      .max(CANONICAL_REMBG_MAXIMUM_SOURCE_FRAME_BYTES),
    frameWidth: z.number().int().min(1)
      .max(CANONICAL_REMBG_MAXIMUM_FRAME_DIMENSION),
    frameHeight: z.number().int().min(1)
      .max(CANONICAL_REMBG_MAXIMUM_FRAME_DIMENSION),
    frameDecodedRgbaSha256: digestSchema,
    frameOpaquePixelCount: z.number().int().positive()
      .max(CANONICAL_REMBG_MAXIMUM_FRAME_PIXEL_COUNT),
  }).strict().superRefine((value, context) => {
    if (
      value.frameWidth * value.frameHeight
        !== value.frameOpaquePixelCount
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frameOpaquePixelCount'],
        message:
          'Exact source-frame opaque pixel count must match dimensions.',
      })
    }
  })

export const canonicalRembgSourceFrameExpectationSchema =
  canonicalRembgSourceFrameExpectationInputSchema.extend({
    artifactKind: z.literal('image'),
    frameDerivationPolicy: z.literal(
      'canonical_ffmpeg_exact_decoded_source_frame_rgba_png_v1',
    ),
    sourceFrameExpectationDigestSha256: digestSchema,
  }).strict()
