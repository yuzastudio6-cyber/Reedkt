import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_URI,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
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
  createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane-repository'
import {
  admitCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-admission-service'
import {
  createCanonicalGcsSam31VertexModelVersionRolloutRepository,
  createCanonicalSam31VertexModelVersionRolloutService,
} from '../services/canonical-sam3_1-vertex-model-version-rollout-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'observe-weeditpro-sam31-a100-model-version-2-rollout-v1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_MODEL_VERSION_ROLLOUT_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_MODEL_VERSION_ROLLOUT_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_VERTEX_MODEL_VERSION_ROLLOUT_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_PLANE_BUCKET,
})
const recordedAt = new Date().toISOString()
const imageBuildRuntime = createCanonicalSam31GcpCloudImageBuildRuntime({
  storage,
  auth: authClient,
})
const profile = await admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: {
    imageSupplyChainReleaseRef: {
      id: 'sam31-production-image-supply-chain-release-a14e4ac5e5067a37c38d4db7',
      version: 1,
      contentHash:
        'sha256:69344ac8adbe2775ad50ab919f1a117d2f628e805dce8f331bd4b8082752ad6f',
    },
    immutableImageRef: {
      id: 'sam31-image-2f758d4c1be7e483fe8aa1c8',
      version: 1,
      contentHash: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
    },
    immutableImageUri: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_URI,
    immutableImageDigest: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_DIGEST,
    sourceCheckpointQualificationRef: {
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
      id: 'sam31-source-checkpoint-qualification-20260809-v8-vertex-result-publication-corrected',
      version: 2,
      contentHash:
        'sha256:ba8708871ddace51ca8ed0602beeaa8a406c66494848a07ef6f58d377e7085d9',
    },
    servingQuotaPreferenceRef: {
      id: 'vertex-a100-serving-quota:sam31-a100-serving-us-central1-20260812-v2',
      version: 1,
      contentHash:
        'sha256:5e0d29f150920c2fc9ce2607dce543325470e07d97e5aa527576b9385f976461',
    },
    accountEffectiveRateAuthorityRef: {
      id: 'vertex-a100-serving-rate:sam31-a100-serving-20260812-v2',
      version: 1,
      contentHash:
        'sha256:d6856690b8099356c6ce7871e99d84d16f4a0b764e7ad1b7bd349d7a02a70b1c',
    },
    recordedAt,
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
const deploymentProfileRef =
  await createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository({ storage })
    .persistDeploymentProfile(profile)
const rollout = await createCanonicalSam31VertexModelVersionRolloutService({
  auth: authClient,
  repository:
    createCanonicalGcsSam31VertexModelVersionRolloutRepository({ storage }),
}).observeCurrent()

process.stdout.write(`${JSON.stringify({
  deploymentProfileRef,
  rollout,
  customerInvocationStarted: false,
  modelInferenceExecuted: false,
  customerCreditsMutated: false,
  runtimeQualified: false,
  productionReady: false,
})}\n`)
