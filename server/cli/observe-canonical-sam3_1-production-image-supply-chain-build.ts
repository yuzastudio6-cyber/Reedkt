import { z } from 'zod'

import {
  imageSupplyChainBuildObservationReference,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-service'
import {
  createCanonicalSam31GcpImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-runtime'

const CONFIRMATION =
  'observe-one-weeditpro-sam31-production-image-supply-chain-build-v1' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const sha = z.string().regex(/^[a-f0-9]{64}$/u)
const environment = z.object({
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_OBSERVATION_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_ID: safeId,
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_SHA256: sha,
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_ID: safeId,
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_SHA256: sha,
}).passthrough().parse(process.env)
const runtime = createCanonicalSam31GcpImageSupplyChainBuildRuntime()
const observation = await runtime.observeOnePersistedSupplyChainBuild({
  admissionRef: ref(
    environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_ID,
    environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_ADMISSION_SHA256,
  ),
  submissionRef: ref(
    environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_ID,
    environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_SUBMISSION_SHA256,
  ),
})

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-production-image-supply-chain-observation-v1',
  observation,
  observationRef: imageSupplyChainBuildObservationReference(observation),
  gpuJobDispatched: false,
  modelOrCheckpointExecuted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
})}\n`)

function ref(id: string, sha256: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${sha256}` as const,
  }
}
