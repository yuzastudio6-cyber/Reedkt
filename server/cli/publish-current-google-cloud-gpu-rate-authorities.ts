import { z } from 'zod'

import {
  createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  publishCanonicalCurrentGoogleCloudGpuRateAuthorities,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-publisher'
import {
  createGoogleCloudAccountEffectiveGpuRateReadPort,
  createWeEditProGoogleCloudGpuRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-gpu-rate-read-port'

const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(
    'reeditpro-production-reeditpro-control-plane-state',
  ),
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    z.string().regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  WEEDITPRO_GPU_RATE_PUBLICATION_ID: z.string().trim().min(1).max(120)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  WEEDITPRO_GPU_RATE_PUBLICATION_VERSION: z.coerce.number()
    .int().positive().safe(),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    process.env.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  WEEDITPRO_GPU_RATE_PUBLICATION_ID:
    process.env.WEEDITPRO_GPU_RATE_PUBLICATION_ID,
  WEEDITPRO_GPU_RATE_PUBLICATION_VERSION:
    process.env.WEEDITPRO_GPU_RATE_PUBLICATION_VERSION,
})

const readerConfiguration =
  createWeEditProGoogleCloudGpuRateReaderConfiguration({
    billingAccountResourceName:
      configuration.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  })
const receipt = await publishCanonicalCurrentGoogleCloudGpuRateAuthorities({
  publicationId: configuration.WEEDITPRO_GPU_RATE_PUBLICATION_ID,
  publicationVersion: configuration.WEEDITPRO_GPU_RATE_PUBLICATION_VERSION,
  readPort: createGoogleCloudAccountEffectiveGpuRateReadPort({
    configuration: readerConfiguration,
  }),
  repository: createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository({
    projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
  }),
})

process.stdout.write(`${JSON.stringify(receipt)}\n`)
