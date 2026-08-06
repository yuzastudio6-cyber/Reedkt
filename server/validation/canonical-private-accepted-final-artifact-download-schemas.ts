import { z } from 'zod'

const identity = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const canonicalPrivateAcceptedFinalArtifactDownloadQuerySchema =
  z.object({
    workspaceId: identity,
    packageRecordId: identity,
    expectedDecisionManifestSha256: sha256,
    expectedFinalArtifactSha256: sha256,
    purpose: z.literal(
      'download_accepted_canonical_private_final_artifact',
    ),
  }).strict()

export type CanonicalPrivateAcceptedFinalArtifactDownloadQuery = z.infer<
  typeof canonicalPrivateAcceptedFinalArtifactDownloadQuerySchema
>
