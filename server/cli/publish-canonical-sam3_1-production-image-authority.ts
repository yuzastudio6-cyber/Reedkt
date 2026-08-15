import { z } from 'zod'

import {
  createCanonicalSam31GcpProductionImageAuthorityPublisher,
} from '../services/canonical-sam3_1-production-image-authority-publisher'

const CONFIRMATION =
  'publish-one-qualified-sam31-production-image-authority-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const environment = z.object({
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256: rawSha256,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_ID: safeId,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_SHA256: rawSha256,
}).strict().parse({
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_PRODUCTION_IMAGE_AUTHORITY_CONFIRMATION,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_ID:
    process.env.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_ID,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_SHA256:
    process.env.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_SHA256,
})

const result = await createCanonicalSam31GcpProductionImageAuthorityPublisher()
  .publish({
    sourceCheckpointQualificationRef: {
      id: environment.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
      version: 2,
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
      contentHash:
        `sha256:${environment.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256}`,
    },
    capsuleManifestRef: {
      id: environment.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_ID,
      version: 1,
      contentHash:
        `sha256:${environment.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_MANIFEST_SHA256}`,
    },
  })

process.stdout.write(`${JSON.stringify(result)}\n`)
