import { z } from 'zod'

import {
  createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  publishCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../services/canonical-current-google-cloud-vertex-a100-rate-authority-publisher'
import {
  createGoogleCloudAccountEffectiveVertexA100RateReadPort,
  createWeEditProVertexA100RateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-vertex-a100-rate-read-port'

const environment = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(
    'reeditpro-production-reeditpro-control-plane-state',
  ),
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    z.string().regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_ID:
    z.string().trim().min(1).max(120)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_VERSION:
    z.coerce.number().int().positive().safe(),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    process.env.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_ID:
    process.env.WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_ID,
  WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_VERSION:
    process.env.WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_VERSION,
})

const configuration = createWeEditProVertexA100RateReaderConfiguration({
  billingAccountResourceName:
    environment.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
})
const receipt = await publishCanonicalCurrentGoogleCloudVertexA100RateAuthority({
  publicationId: environment.WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_ID,
  publicationVersion:
    environment.WEEDITPRO_VERTEX_A100_RATE_PUBLICATION_VERSION,
  readPort: createGoogleCloudAccountEffectiveVertexA100RateReadPort({
    configuration,
  }),
  repository:
    createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository({
      projectId: environment.GOOGLE_CLOUD_PROJECT_ID,
      bucketName: environment.GCS_CONTROL_PLANE_STATE_BUCKET,
    }),
})

process.stdout.write(`${JSON.stringify(receipt)}\n`)
