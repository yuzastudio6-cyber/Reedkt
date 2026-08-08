import { z } from 'zod'

import {
  createCanonicalSam31GcpProductionCapsuleBuildInputOwner,
} from '../services/canonical-sam3_1-production-capsule-build-input-owner'

const CONFIRMATION =
  'prepare-one-sam31-production-capsule-two-build-input-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const environment = z.object({
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_BUILD_INPUT_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256: rawSha256,
}).strict().parse({
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_BUILD_INPUT_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_BUILD_INPUT_CONFIRMATION,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256,
})

const result = await createCanonicalSam31GcpProductionCapsuleBuildInputOwner()
  .prepare({
    sourceCheckpointQualificationRef: {
      id: environment.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
      version: 1,
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1',
      contentHash:
        `sha256:${environment.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256}`,
    },
  })

process.stdout.write(`${JSON.stringify(result)}\n`)
