import { z } from 'zod'

import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-publisher'
import {
  rereadCanonicalSam31VertexServingCapacity,
} from '../services/canonical-sam3_1-vertex-serving-capacity-mutation'
import {
  createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort,
  createWeEditProVertexA100ServingRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-vertex-a100-serving-rate-read-port'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const environment = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(
    'reeditpro-production-reeditpro-control-plane-state',
  ),
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    z.string().regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_ID:
    z.string().trim().min(1).max(120)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH: z.literal(
    WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  ),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    process.env.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_ID:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_ID,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_VERSION:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_VERSION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const configuration =
  createWeEditProVertexA100ServingRateReaderConfiguration({
    billingAccountResourceName:
      environment.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  })
const receipt =
  await publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
    publicationId:
      environment.WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_ID,
    publicationVersion:
      environment.WEEDITPRO_VERTEX_A100_SERVING_RATE_PUBLICATION_VERSION,
    readPort:
      createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort({
        configuration,
        auth: authClient,
      }),
    capacityObservation:
      await rereadCanonicalSam31VertexServingCapacity({
        auth: authClient,
      }),
    repository:
      createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
        storage,
        projectId: environment.GOOGLE_CLOUD_PROJECT_ID,
        bucketName: environment.GCS_CONTROL_PLANE_STATE_BUCKET,
      }),
  })

process.stdout.write(`${JSON.stringify(receipt)}\n`)
