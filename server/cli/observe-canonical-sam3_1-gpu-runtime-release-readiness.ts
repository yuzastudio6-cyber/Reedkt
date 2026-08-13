import { z } from 'zod'

import {
  createCanonicalSam31GcpGpuRuntimeReleaseReadinessObserver,
} from '../services/canonical-sam3_1-gpu-runtime-release-readiness-observer'
import {
  createWeEditProGcpLocalOperatorAuth,
} from './weeditpro-gcp-local-operator-auth'

const environment = z.object({
  routeId: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  qualificationId: z.string().trim().min(1),
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict().parse({
  routeId: process.env.WEEDITPRO_SAM31_GPU_RUNTIME_ROUTE_ID,
  qualificationId: process.env.WEEDITPRO_SAM31_GPU_QUALIFICATION_ID,
  immutableImageDigest:
    process.env.WEEDITPRO_SAM31_GPU_IMMUTABLE_IMAGE_DIGEST,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
})

const observation = await
createCanonicalSam31GcpGpuRuntimeReleaseReadinessObserver({ storage })
  .observe(environment)

process.stdout.write(`${JSON.stringify(observation, null, 2)}\n`)
