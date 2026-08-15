import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31PrivateInternalDispatchReadiness,
  createCanonicalSam31PrivateInternalDispatchReadinessRepository,
} from '../services/canonical-sam3_1-private-internal-dispatch-readiness-owner'
import {
  assertCanonicalSam31PrivateInternalInvocationReadiness,
  createCanonicalSam31PrivateInternalInvocationReadinessOwner,
  createCanonicalSam31PrivateInternalInvocationReadinessRepository,
} from '../services/canonical-sam3_1-private-internal-invocation-readiness-owner'
import {
  createCanonicalSam31VertexServingDeploymentReadyRepository,
} from '../services/canonical-sam3_1-vertex-serving-deployment-ready-repository'
import {
  assertCanonicalSam31VertexServingDeploymentReady,
} from '../services/canonical-sam3_1-vertex-serving-invocation-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const CONFIRMATION =
  'publish-one-sam3_1-private-internal-invocation-readiness-v1' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const refText = z.string().trim().min(1).max(700)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_STATE_BUCKET),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_PRIVATE_INVOCATION_READINESS_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_PRIVATE_INVOCATION_READINESS_ID: safeId,
  WEEDITPRO_SAM31_A100_RUNTIME_RELEASE_REF: refText,
  WEEDITPRO_SAM31_A100_RATE_AUTHORITY_REF: refText,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF: refText,
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET: process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_PRIVATE_INVOCATION_READINESS_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_PRIVATE_INVOCATION_READINESS_CONFIRMATION,
  WEEDITPRO_SAM31_PRIVATE_INVOCATION_READINESS_ID:
    process.env.WEEDITPRO_SAM31_PRIVATE_INVOCATION_READINESS_ID,
  WEEDITPRO_SAM31_A100_RUNTIME_RELEASE_REF:
    process.env.WEEDITPRO_SAM31_A100_RUNTIME_RELEASE_REF,
  WEEDITPRO_SAM31_A100_RATE_AUTHORITY_REF:
    process.env.WEEDITPRO_SAM31_A100_RATE_AUTHORITY_REF,
  WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF:
    process.env.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: configuration.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const runtimeReleaseRef = parseRef(
  configuration.WEEDITPRO_SAM31_A100_RUNTIME_RELEASE_REF,
)
const rateAuthorityRef = parseRef(
  configuration.WEEDITPRO_SAM31_A100_RATE_AUTHORITY_REF,
)
const endpointDeploymentRef = parseRef(
  configuration.WEEDITPRO_SAM31_VERTEX_ENDPOINT_DEPLOYMENT_REF,
)
const observedAt = new Date().toISOString()
const dispatchRepository =
  createCanonicalSam31PrivateInternalDispatchReadinessRepository({
    objectPort,
  })
const endpointRepository =
  createCanonicalSam31VertexServingDeploymentReadyRepository({ objectPort })
const [dispatchRaw, endpointRaw] = await Promise.all([
  dispatchRepository.rereadCurrent({
    runtimeReleaseRef,
    rateAuthorityRef,
    at: observedAt,
  }),
  endpointRepository.rereadReadyDeployment({
    endpointDeploymentRef,
    at: observedAt,
  }),
])
const dispatchReadiness =
  assertCanonicalSam31PrivateInternalDispatchReadiness(
    dispatchRaw,
    observedAt,
  )
const endpointReadiness = assertCanonicalSam31VertexServingDeploymentReady(
  endpointRaw,
  observedAt,
)
const expiresAt = new Date(Math.min(
  Date.parse(dispatchReadiness.expiresAt),
  Date.parse(endpointReadiness.expiresAt),
)).toISOString()
const readiness =
  createCanonicalSam31PrivateInternalInvocationReadinessOwner().observe({
    readinessId:
      configuration.WEEDITPRO_SAM31_PRIVATE_INVOCATION_READINESS_ID,
    privateInternalDispatchReadiness: dispatchReadiness,
    vertexServingDeploymentReadiness: endpointReadiness,
    observedAt,
    expiresAt,
  })
const repository =
  createCanonicalSam31PrivateInternalInvocationReadinessRepository({
    objectPort,
  })
const persistenceDisposition = await repository.persistCreateOnly({ readiness })
const exactRaw = await repository.rereadCurrent({
  runtimeReleaseRef,
  rateAuthorityRef,
  at: observedAt,
})
if (!exactRaw) {
  throw new Error('Private invocation readiness publication is missing.')
}
const exact = assertCanonicalSam31PrivateInternalInvocationReadiness(
  exactRaw,
  observedAt,
)
if (exact.readinessHash !== readiness.readinessHash) {
  throw new Error('Private invocation readiness publication reread changed.')
}

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'canonical-sam3_1-private-internal-invocation-readiness-publication-receipt-v1',
  readinessRef: {
    id: readiness.readinessId,
    version: 1,
    contentHash: `sha256:${readiness.readinessHash}`,
  },
  endpointDeploymentRef: readiness.endpointDeploymentRef,
  persistenceDisposition,
  exactPrivateDispatchAndEndpointReread: true,
  privateInternalOnly: true,
  customerOrPublicDispatchAuthorized: false,
  gpuInvocationStarted: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})}\n`)

function parseRef(value: string) {
  const match = /^(?<id>[^|]+)\|(?<version>[1-9]\d*)\|(?<hash>sha256:[a-f0-9]{64})$/u
    .exec(value)
  if (!match?.groups) throw new Error('Readiness ref text is invalid.')
  return {
    id: safeId.parse(match.groups.id),
    version: z.coerce.number().int().positive().safe()
      .parse(match.groups.version),
    contentHash: prefixedSha256.parse(match.groups.hash),
  }
}
