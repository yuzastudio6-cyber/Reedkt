import { z } from 'zod'
import { privateUploadMediaSafeIdSchema } from './private-upload-media-authority-schemas'

export const presentCanonicalSourceLedPlanSchema = z.object({
  workspaceId: privateUploadMediaSafeIdSchema,
  purpose: z.literal('present_server_derived_source_led_plan'),
  orderedMediaAssetIds: z.array(privateUploadMediaSafeIdSchema).min(1).max(8)
    .refine(
      (values) => new Set(values).size === values.length,
      'Source media asset IDs must be unique.',
    ),
  sourceOrderConfirmed: z.literal(true),
  preserveUnanalyzedSourceRanges: z.literal(true),
}).strict()

export type PresentCanonicalSourceLedPlanBody = z.infer<
  typeof presentCanonicalSourceLedPlanSchema
>
