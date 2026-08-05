import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from '../services/canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  createCanonicalSam31GcpImageSupplyChainReleaseRepository,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31GoogleCloudDeploymentObservationRepository,
  publishCanonicalSam31GoogleCloudRuntimeConfiguration,
} from '../services/canonical-sam3_1-google-cloud-runtime-configuration-publisher'
import {
  createCanonicalSam31GpuRuntimeReleaseRegistry,
} from '../services/canonical-sam3_1-gpu-runtime-release-registry'

const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal('reeditpro'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(
    'reeditpro-production-reeditpro-control-plane-state',
  ),
  GCS_PROCESSED_MEDIA_BUCKET: z.literal(
    'reeditpro-production-reeditpro-masks',
  ),
  WEEDITPRO_SAM31_GPU_ROUTE_ID: z.enum([
    'a100_80gb_heavy_primary',
    'l4_heavy_fallback',
  ]),
  WEEDITPRO_SAM31_RUNTIME_RELEASE_ID: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  WEEDITPRO_SAM31_RUNTIME_RELEASE_VERSION: z.coerce.number()
    .int().positive().safe(),
  WEEDITPRO_SAM31_RUNTIME_RELEASE_CONTENT_HASH: z.string()
    .regex(/^sha256:[a-f0-9]{64}$/u),
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  GCS_PROCESSED_MEDIA_BUCKET: process.env.GCS_PROCESSED_MEDIA_BUCKET,
  WEEDITPRO_SAM31_GPU_ROUTE_ID:
    process.env.WEEDITPRO_SAM31_GPU_ROUTE_ID,
  WEEDITPRO_SAM31_RUNTIME_RELEASE_ID:
    process.env.WEEDITPRO_SAM31_RUNTIME_RELEASE_ID,
  WEEDITPRO_SAM31_RUNTIME_RELEASE_VERSION:
    process.env.WEEDITPRO_SAM31_RUNTIME_RELEASE_VERSION,
  WEEDITPRO_SAM31_RUNTIME_RELEASE_CONTENT_HASH:
    process.env.WEEDITPRO_SAM31_RUNTIME_RELEASE_CONTENT_HASH,
})

const storage = new Storage({
  projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
})
const controlPlaneObjectPort =
  createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
  })
const receipt =
  await publishCanonicalSam31GoogleCloudRuntimeConfiguration({
    routeId: configuration.WEEDITPRO_SAM31_GPU_ROUTE_ID,
    runtimeReleaseRef: {
      id: configuration.WEEDITPRO_SAM31_RUNTIME_RELEASE_ID,
      version: configuration.WEEDITPRO_SAM31_RUNTIME_RELEASE_VERSION,
      contentHash:
        configuration.WEEDITPRO_SAM31_RUNTIME_RELEASE_CONTENT_HASH,
    },
    releasePairReadPort: createCanonicalSam31GpuRuntimeReleaseRegistry({
      objectPort: controlPlaneObjectPort,
    }),
    imageSupplyChainReleaseReadPort:
      createCanonicalSam31GcpImageSupplyChainReleaseRepository({ storage }),
    deploymentObservationRepository:
      createCanonicalSam31GoogleCloudDeploymentObservationRepository({
        objectPort: controlPlaneObjectPort,
      }),
    runtimeConfigurationRepository:
      createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository({
        storage,
        projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
        bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
        privateObjectTransportBucketName:
          configuration.GCS_PROCESSED_MEDIA_BUCKET,
      }),
  })

process.stdout.write(`${JSON.stringify(receipt)}\n`)
