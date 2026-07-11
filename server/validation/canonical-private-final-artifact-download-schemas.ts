import { z } from 'zod'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))

export const canonicalPrivateFinalArtifactDownloadQuerySchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  snapshotId: identity,
  jobId: identity,
  expectedAssetId: identity,
  purpose: z.literal('download_canonical_private_final_artifact'),
}).strict()

export type CanonicalPrivateFinalArtifactDownloadQuery = z.infer<
  typeof canonicalPrivateFinalArtifactDownloadQuerySchema
>
