import { z } from 'zod'
import { privateUploadMediaSafeIdSchema } from './private-upload-media-authority-schemas'

export const canonicalSourceLedChatQuerySchema = z.object({
  workspaceId: privateUploadMediaSafeIdSchema,
}).strict()

export const appendCanonicalSourceLedChatDirectionSchema = z.object({
  workspaceId: privateUploadMediaSafeIdSchema,
  purpose: z.literal('append_named_edit_planning_direction'),
  clientMessageId: privateUploadMediaSafeIdSchema,
  message: z.string()
    .trim()
    .min(1)
    .max(4_000)
    .refine(
      (value) => Array.from(value).every((character) => {
        const code = character.charCodeAt(0)
        return code === 9 || code === 10 || code === 13 || code > 31
      }),
      'Chat direction contains unsupported control characters.',
    ),
}).strict()

export type AppendCanonicalSourceLedChatDirectionBody = z.infer<
  typeof appendCanonicalSourceLedChatDirectionSchema
>
