import { z } from 'zod'

import {
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingQuotaRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-quota-authority'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcpCloudImageBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31GcpImageSupplyChainReleaseRepository,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  admitCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-admission-service'
import {
  createCanonicalSam31VertexModelVersionSuccessorRolloutOwner,
} from '../services/canonical-sam3_1-vertex-model-version-successor-rollout-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'rollout-one-weeditpro-sam31-a100-scale-zero-successor-v1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const sha = z.string().regex(/^[a-f0-9]{64}$/u)
const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_SUCCESSOR_ROLLOUT_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_VERTEX_SUCCESSOR_RECORDED_AT:
    z.string().datetime({ offset: true }),
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_RELEASE_ID: safeId,
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256: sha,
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_ID: safeId,
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_SHA256: sha,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_ID: safeId,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_SHA256: sha,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_ID: safeId,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_SHA256: sha,
}).passthrough().parse(process.env)

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_PLANE_BUCKET,
})
const imageBuildRuntime = createCanonicalSam31GcpCloudImageBuildRuntime({
  storage,
  auth: authClient,
})
const imageHash = environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_SHA256
const profile = await admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: {
    imageSupplyChainReleaseRef: ref(
      environment
        .WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
      environment
        .WEEDITPRO_SAM31_PRODUCTION_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256,
      1,
    ),
    immutableImageRef: ref(
      environment.WEEDITPRO_SAM31_PRODUCTION_IMAGE_ID,
      imageHash,
      1,
    ),
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:${imageHash}`,
    immutableImageDigest: `sha256:${imageHash}`,
    sourceCheckpointQualificationRef: {
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
      id: 'sam31-source-checkpoint-qualification-20260809-v8-vertex-result-publication-corrected',
      version: 2,
      contentHash:
        'sha256:ba8708871ddace51ca8ed0602beeaa8a406c66494848a07ef6f58d377e7085d9',
    },
    servingQuotaPreferenceRef: ref(
      environment.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_ID,
      environment.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_SHA256,
      environment.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION,
    ),
    accountEffectiveRateAuthorityRef: ref(
      environment.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_ID,
      environment.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_SHA256,
      environment.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION,
    ),
    recordedAt: environment.WEEDITPRO_SAM31_VERTEX_SUCCESSOR_RECORDED_AT,
  },
  rateAuthorityRepository:
    createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
      storage,
    }),
  quotaAuthorityRepository:
    createCanonicalGcsCurrentGoogleCloudVertexA100ServingQuotaRepository({
      storage,
    }),
  imageSupplyChainReleaseRepository:
    createCanonicalSam31GcpImageSupplyChainReleaseRepository({ storage }),
  imageBuildRepository: imageBuildRuntime.repository,
  sourceCheckpointQualificationReleaseReadPort:
    createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort({
      objectPort,
    }),
})
const result = await createCanonicalSam31VertexModelVersionSuccessorRolloutOwner({
  auth: authClient,
  objectPort,
}).rolloutOne(profile)

process.stdout.write(`${JSON.stringify({
  ...result,
  immutableImageDigest: profile.immutableImageDigest,
  minimumReplicaCount: profile.dedicatedResources.minimumReplicaCount,
  maximumReplicaCount: profile.dedicatedResources.maximumReplicaCount,
  gpuRuntimeExecuted: false,
  customerCreditsMutated: false,
  runtimeQualified: false,
  publicDeliveryAuthorized: false,
  productionReady: false,
})}\n`)

function ref<const Version extends number>(
  id: string,
  contentHash: string,
  version: Version,
) {
  return {
    id,
    version,
    contentHash: `sha256:${contentHash}` as const,
  }
}
