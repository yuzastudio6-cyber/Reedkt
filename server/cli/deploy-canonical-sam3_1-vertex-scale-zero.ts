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
  createCanonicalSam31VertexScaleZeroControlPlane,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane'
import {
  createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane-repository'
import {
  admitCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-admission-service'
import {
  createCanonicalSam31VertexScaleZeroDeploymentOperator,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-operator'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'deploy-one-weeditpro-sam31-a100-scale-zero-v1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_SCALE_ZERO_DEPLOYMENT_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_VERTEX_DEPLOYMENT_RECORDED_AT:
    z.string().datetime({ offset: true }),
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_ID: safeId,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_SHA256: rawSha256,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_ID: safeId,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION:
    z.coerce.number().int().positive().safe(),
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_SHA256: rawSha256,
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_SCALE_ZERO_DEPLOYMENT_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_VERTEX_SCALE_ZERO_DEPLOYMENT_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_VERTEX_DEPLOYMENT_RECORDED_AT:
    process.env.WEEDITPRO_SAM31_VERTEX_DEPLOYMENT_RECORDED_AT,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_ID:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_ID,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION,
  WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_SHA256:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_SHA256,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_ID:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_ID,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION,
  WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_SHA256:
    process.env.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_SHA256,
})

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
const profile = await admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: {
    imageSupplyChainReleaseRef: {
      id: 'sam31-production-image-supply-chain-release-a9f7b7a33ce0b25d8fa6dde1',
      version: 1,
      contentHash:
        'sha256:dcd4c3a0bf2ffa75e4a7dae6df14b8329f33525c7564de856a7f33ffaaa379fd',
    },
    immutableImageRef: {
      id: 'sam31-image-86faa51ab82256d3b1b0e62b',
      version: 1,
      contentHash:
        'sha256:1ad0cdcf646333e1422dae075d3af1305452a19a86faa51ab82256d3b1b0e62b',
    },
    immutableImageUri:
      'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:1ad0cdcf646333e1422dae075d3af1305452a19a86faa51ab82256d3b1b0e62b',
    immutableImageDigest:
      'sha256:1ad0cdcf646333e1422dae075d3af1305452a19a86faa51ab82256d3b1b0e62b',
    sourceCheckpointQualificationRef: {
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
      id: 'sam31-source-checkpoint-qualification-20260809-v8-vertex-result-publication-corrected',
      version: 2,
      contentHash:
        'sha256:ba8708871ddace51ca8ed0602beeaa8a406c66494848a07ef6f58d377e7085d9',
    },
    servingQuotaPreferenceRef: {
      id: environment.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_ID,
      version:
        environment.WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_VERSION,
      contentHash: prefixedSha256.parse(
        `sha256:${environment
          .WEEDITPRO_VERTEX_A100_SERVING_QUOTA_AUTHORITY_SHA256}`,
      ),
    },
    accountEffectiveRateAuthorityRef: {
      id: environment.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_ID,
      version:
        environment.WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION,
      contentHash: prefixedSha256.parse(
        `sha256:${environment
          .WEEDITPRO_VERTEX_A100_SERVING_RATE_AUTHORITY_SHA256}`,
      ),
    },
    recordedAt: environment.WEEDITPRO_SAM31_VERTEX_DEPLOYMENT_RECORDED_AT,
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
const receipt = await createCanonicalSam31VertexScaleZeroDeploymentOperator({
  controlPlane: createCanonicalSam31VertexScaleZeroControlPlane({
    auth: authClient,
  }),
  repository:
    createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository({ storage }),
}).deployOne(profile)

process.stdout.write(`${JSON.stringify({
  ...receipt,
  modelOrCheckpointInferenceStarted: false,
  customerCreditsMutated: false,
  runtimeQualified: false,
  productionReady: false,
})}\n`)
