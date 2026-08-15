import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane-repository'
import {
  createCanonicalGcsSam31VertexModelVersionRolloutRepository,
  createCanonicalSam31VertexModelVersionRolloutService,
} from '../services/canonical-sam3_1-vertex-model-version-rollout-service'
import {
  rereadCanonicalSam31VertexSuccessorDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-model-version-successor-rollout-service'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'observe-weeditpro-sam31-a100-model-version-4-rollout-v1' as const
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
const profile = await rereadCanonicalSam31VertexSuccessorDeploymentProfile({
  objectPort,
  profileRef: {
    id: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_ID,
    version: 1,
    contentHash: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_HASH,
  },
})
if (!profile) throw new Error('Current SAM 3.1 successor profile is absent.')
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
