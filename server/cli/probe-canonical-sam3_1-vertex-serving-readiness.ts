import { z } from 'zod'

import {
  createCanonicalGcsSam31VertexServingReadinessProbeRepository,
  createCanonicalSam31VertexServingReadinessProbeService,
} from '../services/canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'probe-one-weeditpro-sam31-a100-scale-zero-readiness-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.coerce.number().int().positive().safe()

const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_READINESS_CONFIRMATION: z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_VERTEX_READINESS_OBSERVATION_ID: safeId,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_ID: safeId,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_VERSION: positiveInteger,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_SHA256: sha256,
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_READINESS_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_VERTEX_READINESS_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_VERTEX_READINESS_OBSERVATION_ID:
    process.env.WEEDITPRO_SAM31_VERTEX_READINESS_OBSERVATION_ID,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_ID:
    process.env.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_ID,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_VERSION:
    process.env.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_VERSION,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_SHA256:
    process.env.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_SHA256,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const endpointDeploymentRef = ref(
  environment.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_ID,
  environment.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_VERSION,
  environment.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF_SHA256,
)
const readinessTriggerPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-readiness-trigger-v1' as const,
  source:
    'canonical_backend_private_sam3_1_serving_qualification_owner' as const,
  readinessObservationId:
    environment.WEEDITPRO_SAM31_VERTEX_READINESS_OBSERVATION_ID,
  deploymentProfileRef: {
    id: 'sam31-vertex-deployment-profile-ad6717d119fd554e2ce1a52bb3314880',
    version: 1,
    contentHash:
      'sha256:ad6717d119fd554e2ce1a52bb33148807aff53b364fe4540dacbd24a75582305',
  },
  endpointDeploymentRef,
  qualificationFixtureId:
    'sam31-official-eight-minute-quality-fixture-v1' as const,
  nonCustomerReadinessOnly: true as const,
  modelInferenceAuthorized: false as const,
  customerCreditMutationAuthorized: false as const,
  publicOrProductionAuthorityGranted: false as const,
}
const readinessTriggerHash = sha256AuthorityValue(readinessTriggerPayload)
const readinessTriggerRef = {
  id: `sam31-a100-serving-readiness-${readinessTriggerHash.slice(0, 32)}`,
  version: 1,
  contentHash: `sha256:${readinessTriggerHash}` as const,
}

const probe = await createCanonicalSam31VertexServingReadinessProbeService({
  auth: authClient,
  repository:
    createCanonicalGcsSam31VertexServingReadinessProbeRepository({ storage }),
}).warmAndObserve({
  endpointDeploymentRef,
  readinessTriggerRef,
  imageSupplyChainReleaseRef: {
    id: 'sam31-production-image-supply-chain-release-a14e4ac5e5067a37c38d4db7',
    version: 1,
    contentHash:
      'sha256:69344ac8adbe2775ad50ab919f1a117d2f628e805dce8f331bd4b8082752ad6f',
  },
  immutableImageDigest:
    'sha256:b8ac1fe762564f7debf30f4045b68a25f508ce202f758d4c1be7e483fe8aa1c8',
})

process.stdout.write(`${JSON.stringify({
  probe,
  customerInvocationStarted: false,
  modelInferenceExecuted: false,
  customerCreditsMutated: false,
  runtimeQualified: false,
  productionReady: false,
})}\n`)

function ref(id: string, version: number, digest: string) {
  return {
    id,
    version,
    contentHash: `sha256:${digest}` as const,
  }
}
