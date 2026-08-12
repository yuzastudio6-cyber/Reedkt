import { z } from 'zod'

import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingQuotaRepository,
  observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-quota-authority'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const environment = z.object({
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_ID:
    z.string().trim().min(1).max(120)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH: z.literal(
    WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  ),
}).strict().parse({
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_ID:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_ID,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_VERSION:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_VERSION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const authority =
  await observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority({
    quotaAuthorityId:
      `vertex-a100-serving-quota:${environment
        .WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_ID}`,
    quotaAuthorityVersion:
      environment.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_PUBLICATION_VERSION,
    auth: authClient,
  })
const receipt =
  await createCanonicalGcsCurrentGoogleCloudVertexA100ServingQuotaRepository({
    storage,
  }).persistCreateOnly({ authority })

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-current-google-cloud-vertex-a100-serving-quota-publication-v1',
  quotaAuthorityRef: receipt.quotaAuthorityRef,
  effectiveLimit: authority.effectiveLimit,
  region: authority.region,
  exactCloudQuotaMetricAndRegionalBucketReread:
    authority.exactCloudQuotaMetricAndRegionalBucketReread,
  endpointOrGpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
})}\n`)
