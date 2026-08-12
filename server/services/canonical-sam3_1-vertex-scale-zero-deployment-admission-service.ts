import { z } from 'zod'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import type {
  CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const timestamp = z.string().datetime({ offset: true })
const immutableImageUri = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
)

const requestSchema = z.object({
  imageSupplyChainReleaseRef: refSchema,
  runtimeReleaseRef: refSchema,
  immutableImageRef: refSchema,
  immutableImageUri,
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  sourceCheckpointQualificationRef: refSchema,
  servingQuotaPreferenceRef: refSchema,
  accountEffectiveRateAuthorityRef: refSchema,
  recordedAt: timestamp,
}).strict()

export async function admitCanonicalSam31VertexScaleZeroDeploymentProfile(
  input: {
    readonly request: z.input<typeof requestSchema>
    readonly rateAuthorityRepository:
      CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository
  },
): Promise<CanonicalSam31VertexScaleZeroDeploymentProfile> {
  assertPlainSerializedData(input.request,
    'sam3_1_vertex_scale_zero_deployment_admission')
  const request = requestSchema.parse(input.request)
  const untrustedRateAuthority = await input.rateAuthorityRepository.reread({
    rateAuthorityRef: request.accountEffectiveRateAuthorityRef,
    at: request.recordedAt,
  })
  if (untrustedRateAuthority === null) {
    throw new Error('Current Vertex A100 serving rate authority was not found.')
  }
  const rateAuthority =
    assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
      untrustedRateAuthority,
      request.recordedAt,
    )
  const exactRateReference = {
    id: rateAuthority.rateAuthorityId,
    version: rateAuthority.rateAuthorityVersion,
    contentHash: `sha256:${rateAuthority.rateAuthorityHash}`,
  }
  if (
    stableAuthorityStringify(exactRateReference) !==
      stableAuthorityStringify(request.accountEffectiveRateAuthorityRef)
    || rateAuthority.routeId !== 'a100_80gb_heavy_primary'
    || rateAuthority.executionTarget !==
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
    || rateAuthority.endpointId !== 'weeditpro-sam31-a100-scale-zero-v1'
    || rateAuthority.machineType !== 'a2-ultragpu-1g'
    || rateAuthority.accelerator !== 'nvidia_a100_80gb'
    || rateAuthority.acceleratorCount !== 1
    || rateAuthority.minimumReplicaCount !== 0
    || rateAuthority.maximumReplicaCount !== 1
    || rateAuthority.minimumWarmBillingWindowSeconds !== 300
    || rateAuthority.trainingOrCustomJobSkuSetIncluded
    || rateAuthority.computeEngineVmSkuSetIncluded
    || rateAuthority.mixedOrDoubleCountedPricingSetAccepted
    || rateAuthority.endpointOrGpuJobStarted
    || rateAuthority.walletOrCreditMutationAuthorityGranted
    || rateAuthority.productionAuthorityGranted
  ) {
    throw new Error(
      'Current Vertex A100 serving rate authority does not admit this endpoint.',
    )
  }
  return createCanonicalSam31VertexScaleZeroDeploymentProfile(request)
}
