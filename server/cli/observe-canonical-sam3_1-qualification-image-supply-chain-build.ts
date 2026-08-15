import { z } from 'zod'

import {
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-runtime'

const CONFIRMATION =
  'observe-one-sam31-qualification-image-supply-chain-build' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_OBSERVATION_CONFIRMATION
    !== CONFIRMATION
) throw new Error('SAM 3.1 supply-chain observation confirmation missing.')

const runtime =
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime()
const observation = await runtime.observeOnePersistedSupplyChainBuild({
  admissionRef: readRef('ADMISSION'),
  submissionRef: readRef('SUBMISSION'),
})

console.log(JSON.stringify(observation, null, 2))

function readRef(kind: 'ADMISSION' | 'SUBMISSION') {
  return {
    id: safeId.parse(
      process.env[
        `WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_${kind}_ID`
      ],
    ),
    version: 1 as const,
    contentHash: `sha256:${rawSha256.parse(
      process.env[
        `WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_${kind}_SHA256`
      ],
    )}` as const,
  }
}
