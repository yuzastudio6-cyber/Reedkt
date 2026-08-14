import { z } from 'zod'

import {
  createCanonicalSam31GcpGpuRuntimeReleaseReadinessObserver,
} from '../services/canonical-sam3_1-gpu-runtime-release-readiness-observer'
import {
  createWeEditProGcpLocalOperatorAuth,
} from './weeditpro-gcp-local-operator-auth'

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const componentEvidenceRefsSchema = z.object({
  driverAndCudaRef: refSchema.nullable(),
  deterministicRunSetRef: refSchema.nullable(),
  eightMinutePerformanceRef: refSchema.nullable(),
  independentTemporalQualityRef: refSchema.nullable(),
}).strict()
const environment = z.object({
  routeId: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  qualificationId: safeId,
  immutableImageDigest: prefixedSha256,
  componentEvidenceRefsJson: z.string().min(2).max(4_096),
}).strict().parse({
  routeId: process.env.WEEDITPRO_SAM31_GPU_RUNTIME_ROUTE_ID,
  qualificationId: process.env.WEEDITPRO_SAM31_GPU_QUALIFICATION_ID,
  immutableImageDigest:
    process.env.WEEDITPRO_SAM31_GPU_IMMUTABLE_IMAGE_DIGEST,
  componentEvidenceRefsJson:
    process.env.WEEDITPRO_SAM31_GPU_COMPONENT_EVIDENCE_REFS_JSON,
})

let untrustedComponentEvidenceRefs: unknown
try {
  untrustedComponentEvidenceRefs = JSON.parse(
    environment.componentEvidenceRefsJson,
  ) as unknown
} catch {
  throw new Error('SAM 3.1 component-evidence refs JSON is invalid.')
}
const componentEvidenceRefs = componentEvidenceRefsSchema.parse(
  untrustedComponentEvidenceRefs,
)

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
})

const observation = await
createCanonicalSam31GcpGpuRuntimeReleaseReadinessObserver({ storage })
  .observe({
    routeId: environment.routeId,
    qualificationId: environment.qualificationId,
    immutableImageDigest: environment.immutableImageDigest,
    componentEvidenceRefs,
  })

process.stdout.write(`${JSON.stringify(observation, null, 2)}\n`)
