import { z } from 'zod'

import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'

const CONFIRMATION =
  'observe-one-reconciled-sam31-qualification-image-build' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_OBSERVATION_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 reconciled observation confirmation missing.')

const reconciliationId = safeId.parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RECONCILIATION_ID,
)
const reconciliationHash = rawSha256.parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RECONCILIATION_SHA256,
)
const runtime =
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime()
const result = await runtime.observeAndPersistOne({
  terminalId:
    `sam31-qualification-image-build-terminal-${reconciliationHash.slice(0, 24)}-${Date.now()}`,
  reconciliationRef: {
    id: reconciliationId,
    version: 1,
    contentHash: `sha256:${reconciliationHash}`,
  },
})

console.log(JSON.stringify(result, null, 2))
