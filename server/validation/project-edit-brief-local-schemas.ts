import { z } from 'zod'
import { idSchema } from './common-schemas'

export const saveProjectEditBriefLocalSchema = z.object({
  workspaceId: idSchema,
  briefText: z.string().min(1),
  sourceStorageObjectRecordId: z.string().optional(),
  sourceMediaAssetId: z.string().optional(),
})

export type SaveProjectEditBriefLocalRequest = z.infer<typeof saveProjectEditBriefLocalSchema>
