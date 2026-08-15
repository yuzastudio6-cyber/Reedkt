import { z } from 'zod'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
  type CanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  canonicalSam31QualifiedSourceCheckpointAuthorityRef,
  canonicalSam31SourceCheckpointQualificationReferenceSchema,
  projectCanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31QualifiedSourceCheckpointReleaseReadPort,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import type {
  CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-quota-authority'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  type CanonicalSam31CloudImageBuildRepository,
} from './canonical-sam3_1-cloud-image-build-runtime'
import {
  type CanonicalSam31ImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  assertCanonicalSam31AnyCloudImageBuildAuthority,
} from './canonical-sam3_1-cloud-image-build-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const versionOneRefSchema = refSchema.extend({
  version: z.literal(1),
}).strict()
const timestamp = z.string().datetime({ offset: true })
const immutableImageUri = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
)

const requestSchema = z.object({
  imageSupplyChainReleaseRef: versionOneRefSchema,
  immutableImageRef: versionOneRefSchema,
  immutableImageUri,
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  sourceCheckpointQualificationRef:
    canonicalSam31SourceCheckpointQualificationReferenceSchema,
  servingQuotaPreferenceRef: refSchema,
  accountEffectiveRateAuthorityRef: refSchema,
  recordedAt: timestamp,
}).strict()

export async function admitCanonicalSam31VertexScaleZeroDeploymentProfile(
  input: {
    readonly request: z.input<typeof requestSchema>
    readonly rateAuthorityRepository:
      CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository
    readonly quotaAuthorityRepository:
      CanonicalCurrentGoogleCloudVertexA100ServingQuotaRepository
    readonly imageSupplyChainReleaseRepository: Pick<
      CanonicalSam31ImageSupplyChainReleaseRepository,
      'rereadQualifiedRelease'
    >
    readonly imageBuildRepository: Pick<
      CanonicalSam31CloudImageBuildRepository,
      'rereadBuildAuthority'
    >
    readonly sourceCheckpointQualificationReleaseReadPort:
      CanonicalSam31QualifiedSourceCheckpointReleaseReadPort
  },
): Promise<CanonicalSam31VertexScaleZeroDeploymentProfile> {
  assertPlainSerializedData(input.request,
    'sam3_1_vertex_scale_zero_deployment_admission')
  const request = requestSchema.parse(input.request)
  const [
    untrustedRateAuthority,
    untrustedQuotaAuthority,
    untrustedImageRelease,
    untrustedSourceRelease,
  ] = await Promise.all([
    input.rateAuthorityRepository.reread({
      rateAuthorityRef: request.accountEffectiveRateAuthorityRef,
      at: request.recordedAt,
    }),
    input.quotaAuthorityRepository.reread({
      quotaAuthorityRef: request.servingQuotaPreferenceRef,
      at: request.recordedAt,
    }),
    input.imageSupplyChainReleaseRepository.rereadQualifiedRelease({
      releaseRef: request.imageSupplyChainReleaseRef,
    }),
    input.sourceCheckpointQualificationReleaseReadPort
      .rereadQualificationRelease({
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
      }),
  ])
  if (
    untrustedRateAuthority === null
    || untrustedQuotaAuthority === null
    || untrustedImageRelease === null
    || untrustedSourceRelease === null
  ) {
    throw new Error(
      'Current SAM 3.1 image, checkpoint, rate, or quota authority was not found.',
    )
  }
  const rateAuthority = assertServingRateAuthority(
    untrustedRateAuthority,
    request.recordedAt,
  )
  const rateAuthorityV2 = rateAuthority.schemaVersion ===
    'canonical-current-google-cloud-vertex-a100-serving-rate-authority-v2'
      ? rateAuthority : null
  const exactRateReference = {
    id: rateAuthority.rateAuthorityId,
    version: rateAuthority.rateAuthorityVersion,
    contentHash: `sha256:${rateAuthority.rateAuthorityHash}`,
  }
  const quotaAuthority =
    assertCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority(
      untrustedQuotaAuthority,
      request.recordedAt,
    )
  const exactQuotaReference = {
    id: quotaAuthority.quotaAuthorityId,
    version: quotaAuthority.quotaAuthorityVersion,
    contentHash: `sha256:${quotaAuthority.authorityHash}`,
  }
  const imageRelease = assertCanonicalSam31CloudImageSupplyChainRelease(
    untrustedImageRelease,
  )
  const exactImageSupplyChainReleaseRef = {
    id: imageRelease.releaseId,
    version: imageRelease.releaseVersion,
    contentHash: `sha256:${imageRelease.releaseHash}`,
  }
  const untrustedImageBuildAuthority = await input.imageBuildRepository
    .rereadBuildAuthority({ authorityRef: imageRelease.buildAuthorityRef })
  if (untrustedImageBuildAuthority === null) {
    throw new Error('Current SAM 3.1 image build authority was not found.')
  }
  const imageBuildAuthority = assertCanonicalSam31AnyCloudImageBuildAuthority(
    untrustedImageBuildAuthority,
  )
  const sourceRelease = assertCanonicalSam31QualifiedSourceCheckpointRelease(
    untrustedSourceRelease,
  )
  const source = projectCanonicalSam31QualifiedSourceCheckpointRelease(
    sourceRelease,
  )
  const exactSourceReference =
    canonicalSam31QualifiedSourceCheckpointAuthorityRef(
      sourceRelease.qualification,
    )
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
    || (rateAuthorityV2 !== null && (
      rateAuthorityV2.maximumConcurrentInvocations !== 1
      || !rateAuthorityV2.exactCurrentEndpointCapacityReread
      || !rateAuthorityV2.perReplicaPricingNotMultipliedByConfiguredMaximum
    ))
    || rateAuthority.minimumWarmBillingWindowSeconds !== 300
    || rateAuthority.trainingOrCustomJobSkuSetIncluded
    || rateAuthority.computeEngineVmSkuSetIncluded
    || rateAuthority.mixedOrDoubleCountedPricingSetAccepted
    || rateAuthority.endpointOrGpuJobStarted
    || rateAuthority.walletOrCreditMutationAuthorityGranted
    || rateAuthority.productionAuthorityGranted
    || stableAuthorityStringify(exactQuotaReference) !==
      stableAuthorityStringify(request.servingQuotaPreferenceRef)
    || quotaAuthority.region !== 'us-central1'
    || quotaAuthority.effectiveLimit !== 1
    || quotaAuthority.requiredMaximumReplicaCount !== 1
    || !quotaAuthority.exactCloudQuotaMetricAndRegionalBucketReread
    || !quotaAuthority.servingCapacityGranted
    || quotaAuthority.endpointOrGpuJobStarted
    || quotaAuthority.walletOrCreditMutationAuthorityGranted
    || quotaAuthority.productionAuthorityGranted
    || stableAuthorityStringify(exactImageSupplyChainReleaseRef) !==
      stableAuthorityStringify(request.imageSupplyChainReleaseRef)
    || imageRelease.evidenceClass !== 'canonical_private_reread'
    || imageRelease.status !== 'image_supply_chain_qualified'
    || imageRelease.operationId !==
      'tool.sam3_1.segment_and_track_subject.v1'
    || stableAuthorityStringify(imageRelease.immutableImageRef) !==
      stableAuthorityStringify(request.immutableImageRef)
    || imageRelease.immutableImageUri !== request.immutableImageUri
    || imageRelease.immutableImageDigest !== request.immutableImageDigest
    || !imageRelease.authority.imageSupplyChainQualified
    || imageRelease.authority.a100RuntimeQualified
    || imageRelease.authority.l4RuntimeQualified
    || imageRelease.authority.runtimeReleaseGranted
    || imageRelease.authority.gpuJobDispatched
    || imageRelease.authority.checkpointIncludedInImage
    || imageRelease.authority.customerCreditMutationAllowed
    || imageRelease.authority.publicDeliveryAuthorized
    || imageRelease.authority.productionReady
    || imageBuildAuthority.schemaVersion !==
      'canonical-sam3_1-cloud-image-build-authority-v4'
    || stableAuthorityStringify(imageRelease.buildAuthorityRef) !==
      stableAuthorityStringify({
        id: imageBuildAuthority.authorityId,
        version: imageBuildAuthority.authorityVersion,
        contentHash: `sha256:${imageBuildAuthority.authorityHash}`,
      })
    || stableAuthorityStringify(imageBuildAuthority.capsuleManifestRef) !==
      stableAuthorityStringify(imageRelease.sourceAndDependencyClosureRef)
    || stableAuthorityStringify(
      imageBuildAuthority.sourceCheckpointQualificationRef,
    ) !== stableAuthorityStringify(request.sourceCheckpointQualificationRef)
    || imageBuildAuthority.evidenceClass !== 'canonical_private_reread'
    || imageBuildAuthority.status !== 'authorized_for_private_cloud_build'
    || !imageBuildAuthority.authority.cloudImageBuildAuthorized
    || imageBuildAuthority.authority.runtimeReleaseGranted
    || imageBuildAuthority.authority.gpuJobDispatched
    || imageBuildAuthority.authority.customerCreditMutationAllowed
    || imageBuildAuthority.authority.qaApproved
    || imageBuildAuthority.authority.productionReady
    || sourceRelease.schemaVersion !==
      'canonical-sam3_1-source-checkpoint-qualification-release-v2'
    || stableAuthorityStringify(exactSourceReference) !==
      stableAuthorityStringify(request.sourceCheckpointQualificationRef)
    || !source.exactCanonicalReread
    || !source.deterministicA100CompatibilityProbeVerified
    || !source.sourceCheckpointQualificationGranted
    || !source.compatibilityProbe.actualCudaModelInferenceExecuted
    || source.compatibilityProbe.cpuOnlyModelExecutionObserved
    || source.compatibilityProbe.quantizationOrResolutionReductionUsed
  ) {
    throw new Error(
      'Current SAM 3.1 deployment authorities do not admit this endpoint.',
    )
  }
  return createCanonicalSam31VertexScaleZeroDeploymentProfile(request)
}

function assertServingRateAuthority(
  value: unknown,
  at: string,
): CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
  | CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2 {
  if (
    value && typeof value === 'object'
    && Reflect.get(value, 'schemaVersion') ===
      'canonical-current-google-cloud-vertex-a100-serving-rate-authority-v2'
  ) {
    return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
      value,
      at,
    )
  }
  return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
    value,
    at,
  )
}
