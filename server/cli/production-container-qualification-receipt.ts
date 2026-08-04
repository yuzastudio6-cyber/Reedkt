import { z } from 'zod'

import {
  runProductionContainerQualificationProbeWithAdapter,
} from '../workers/readiness-validation/production-container-qualification-contract'

const envSchema = z.object({
  REEDITPRO_CONFIRM_CONTAINER_READINESS: z.literal('true'),
  REEDITPRO_READINESS_MODE: z.literal('container_runtime'),
  REEDITPRO_CONTAINER_IMAGE_ROLE: z.enum([
    'api',
    'cpu_worker',
    'gpu_worker',
    'render_worker',
    'qa_worker',
    'tool_readiness_worker',
  ]),
  REEDITPRO_CONTAINER_IMAGE_REFERENCE: z.string()
    .regex(/^[^\s@]+@sha256:[a-f0-9]{64}$/u),
  REEDITPRO_SOURCE_COMMIT_SHA: z.string().regex(/^[a-f0-9]{40}$/u),
  REEDITPRO_SOURCE_TREE_HASH: z.string().regex(/^[a-f0-9]{40}$/u),
  REEDITPRO_RUNTIME_CONFINEMENT_ATTESTED: z.literal('true'),
  REEDITPRO_NETWORK_MODE: z.literal('none'),
  REEDITPRO_USER_MEDIA_MOUNTED: z.literal('false'),
  REEDITPRO_MODEL_DOWNLOADS_DISABLED: z.literal('true'),
  REEDITPRO_INFERENCE_DISABLED: z.literal('true'),
}).passthrough()

const env = envSchema.parse(process.env)
const { createLiveProductionContainerQualificationProbeAdapter } = await import(
  '../workers/readiness-validation/production-container-qualification-live-probe'
)
const receipt = runProductionContainerQualificationProbeWithAdapter({
  imageRole: env.REEDITPRO_CONTAINER_IMAGE_ROLE,
  imageReference: env.REEDITPRO_CONTAINER_IMAGE_REFERENCE,
  sourceCommitSha: env.REEDITPRO_SOURCE_COMMIT_SHA,
  sourceTreeHash: env.REEDITPRO_SOURCE_TREE_HASH,
  adapter: createLiveProductionContainerQualificationProbeAdapter(),
})

console.log(JSON.stringify(receipt, null, 2))
