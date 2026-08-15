import { z } from 'zod'

import {
  createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane-repository'
import {
  rereadCanonicalSam31VertexDedicatedPredictionRoute,
} from '../services/canonical-sam3_1-vertex-dedicated-prediction-route'
import {
  createCanonicalGcsSam31VertexModelVersionRolloutRepository,
} from '../services/canonical-sam3_1-vertex-model-version-rollout-service'
import {
  createCanonicalGcsSam31VertexServingQualificationCandidateRepository,
  createCanonicalSam31VertexServingQualificationCandidateService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-candidate'
import {
  createCanonicalGcpSam31VertexServingQualificationInvocationService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-invocation-service'
import {
  createCanonicalGcpSam31VertexServingQualificationPreparationService,
  createCanonicalSam31VertexServingQualificationPreparationRef,
} from '../services/canonical-sam3_1-vertex-serving-qualification-preparation-service'
import {
  createCanonicalGcpSam31VertexServingQualificationOutputService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-output-service'
import {
  assertCanonicalSam31VertexServingReadinessProbe,
  createCanonicalGcsSam31VertexServingReadinessProbeRepository,
  createCanonicalSam31VertexServingReadinessProbeService,
} from '../services/canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'qualify-one-weeditpro-sam31-a100-serving-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const contentHash = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash,
}).strict()
const requestSchema = z.object({
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  deploymentProfileRef: refSchema.extend({ version: z.literal(1) }).strict(),
  modelVersionRolloutRef: refSchema.extend({ version: z.literal(1) })
    .strict(),
  bootstrapReadinessProbeId: safeId,
  sourceCheckpointQualificationRef: refSchema.extend({
    schemaVersion: z.literal(
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
    ),
    version: z.literal(2),
  }).strict(),
  imageSupplyChainReleaseRef: refSchema.extend({ version: z.literal(1) })
    .strict(),
  currentA100ServingRateAuthorityRef: refSchema,
  currentL4FallbackRateAuthorityRef: refSchema,
  currentA100ServingQuotaAuthorityRef: refSchema,
}).strict()

const environment = z.object({
  WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_REQUEST_JSON:
    z.string().min(2).max(16_384),
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_REQUEST_JSON:
    process.env.WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_REQUEST_JSON,
})

let decodedRequest: unknown
try {
  decodedRequest = JSON.parse(
    environment.WEEDITPRO_SAM31_VERTEX_SERVING_QUALIFICATION_REQUEST_JSON,
  )
} catch {
  throw new Error('SAM 3.1 serving qualification request JSON is invalid.')
}
const request = requestSchema.parse(decodedRequest)
const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const controlPlane =
  createCanonicalGcsSam31VertexScaleZeroControlPlaneRepository({ storage })
const readinessRepository =
  createCanonicalGcsSam31VertexServingReadinessProbeRepository({ storage })
const rolloutRepository =
  createCanonicalGcsSam31VertexModelVersionRolloutRepository({ storage })
const [profile, readinessRaw, modelVersionRollout] = await Promise.all([
  controlPlane.rereadDeploymentProfile(request.deploymentProfileRef),
  readinessRepository.reread({
    readinessProbeId: request.bootstrapReadinessProbeId,
  }),
  rolloutRepository.reread({
    rolloutId: request.modelVersionRolloutRef.id,
  }),
])
if (!profile || !readinessRaw || !modelVersionRollout) {
  throw new Error(
    'SAM 3.1 profile, rollout, or readiness probe is absent.',
  )
}
const bootstrapReadinessProbe =
  assertCanonicalSam31VertexServingReadinessProbe(readinessRaw)
if (
  profile.imageSupplyChainReleaseRef.contentHash !==
    request.imageSupplyChainReleaseRef.contentHash
  || bootstrapReadinessProbe.imageSupplyChainReleaseRef.contentHash !==
    request.imageSupplyChainReleaseRef.contentHash
) throw new Error('SAM 3.1 deployed image lineage changed.')

const readinessTriggerPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-qualification-readiness-trigger-v1',
  source: 'canonical_server_sam3_1_vertex_serving_qualification_operator',
  qualificationId: request.qualificationId,
  runOrdinal: request.runOrdinal,
  deploymentProfileRef: request.deploymentProfileRef,
  endpointDeploymentRef: request.modelVersionRolloutRef,
  imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
  nonCustomerReadinessOnly: true,
  modelInferenceAuthorized: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
} as const
const readinessTriggerHash = sha256AuthorityValue(readinessTriggerPayload)
const readinessProbe =
  await createCanonicalSam31VertexServingReadinessProbeService({
    auth: authClient,
    repository: readinessRepository,
  }).warmAndObserve({
    endpointDeploymentRef: request.modelVersionRolloutRef,
    readinessTriggerRef: {
      id: `sam31-serving-qualification-readiness-${
        readinessTriggerHash.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${readinessTriggerHash}`,
    },
    imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
    immutableImageDigest: profile.immutableImageDigest,
  })

const observedAt = new Date().toISOString()
const expiresAt = new Date(Date.parse(observedAt) + 10 * 60_000).toISOString()
const readinessProbeRef = {
  id: readinessProbe.readinessProbeId,
  version: 1,
  contentHash: `sha256:${readinessProbe.probeHash}` as const,
}
const candidate =
  await createCanonicalSam31VertexServingQualificationCandidateService({
    currentRouteReadPort: {
      rereadCurrentRoute: () =>
        rereadCanonicalSam31VertexDedicatedPredictionRoute({
          auth: authClient,
        }),
    },
    repository:
      createCanonicalGcsSam31VertexServingQualificationCandidateRepository({
        storage,
      }),
  }).produceOne({
    profile,
    deploymentProfileRef: request.deploymentProfileRef,
    modelVersionRolloutRef: request.modelVersionRolloutRef,
    modelVersionRollout,
    endpointDeploymentRef: readinessProbe.endpointDeploymentRef,
    readinessProbeRef,
    readinessProbe,
    observedAt,
    expiresAt,
  })
const qualificationCandidateRef = {
  id: candidate.candidateId,
  version: 1,
  contentHash: `sha256:${candidate.candidateHash}` as const,
}
const preparation =
  await createCanonicalGcpSam31VertexServingQualificationPreparationService({
    storage,
  }).prepareOne({
    qualificationId: request.qualificationId,
    runOrdinal: request.runOrdinal,
    qualificationCandidateRef,
    sourceCheckpointQualificationRef:
      request.sourceCheckpointQualificationRef,
    imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
    currentA100ServingRateAuthorityRef:
      request.currentA100ServingRateAuthorityRef,
    currentL4FallbackRateAuthorityRef:
      request.currentL4FallbackRateAuthorityRef,
    currentA100ServingQuotaAuthorityRef:
      request.currentA100ServingQuotaAuthorityRef,
  })
const qualificationPreparationRef =
  createCanonicalSam31VertexServingQualificationPreparationRef(preparation)
const result =
  await createCanonicalGcpSam31VertexServingQualificationInvocationService({
    storage,
    auth: authClient,
  }).invokeOne({
    invocationId: preparation.invocationId,
    qualificationPreparationRef,
    dispatchAdmissionDigestSha256:
      preparation.dispatchAdmissionDigestSha256,
  })
const exactOutput = result.disposition === 'completed'
  ? await createCanonicalGcpSam31VertexServingQualificationOutputService({
    storage,
  }).verifyOne({ invocationId: preparation.invocationId })
  : null

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-vertex-serving-qualification-invocation-receipt-v1',
  qualificationCandidateRef,
  qualificationPreparationRef,
  result,
  exactOutput,
  customerInvocationAuthorized: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
})}\n`)
