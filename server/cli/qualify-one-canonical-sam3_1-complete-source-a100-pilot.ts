import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_HASH,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  publishCanonicalCurrentGoogleCloudGpuRateAuthorities,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-publisher'
import {
  publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-publisher'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort,
  createCanonicalSam31GcpL4CompleteSourceCapacityReadPort,
} from '../services/canonical-sam3_1-complete-source-capacity-owner'
import {
  createCanonicalSam31GcpImageSupplyChainReleaseRepository,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31EightMinuteQualificationSourceRepository,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  createCanonicalSam31EightMinuteSourcePreparationTerminalRepository,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-terminal-owner'
import {
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef,
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionOwner,
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository,
} from '../services/canonical-sam3_1-private-complete-source-qualification-admission-owner'
import {
  createCanonicalSam31PrivateQualificationCapacityOwner,
  createCanonicalSam31PrivateQualificationCapacityRepository,
} from '../services/canonical-sam3_1-private-qualification-capacity-owner'
import {
  rereadCanonicalSam31VertexDedicatedPredictionRoute,
} from '../services/canonical-sam3_1-vertex-dedicated-prediction-route'
import {
  assertCanonicalSam31VertexModelVersionRollout,
  createCanonicalGcsSam31VertexModelVersionRolloutRepository,
} from '../services/canonical-sam3_1-vertex-model-version-rollout-service'
import {
  rereadCanonicalSam31VertexSuccessorDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-model-version-successor-rollout-service'
import {
  createCanonicalGcsSam31VertexServingQualificationCandidateRepository,
  createCanonicalSam31VertexServingQualificationCandidateService,
} from '../services/canonical-sam3_1-vertex-serving-qualification-candidate'
import {
  createCanonicalGcsSam31VertexServingReadinessProbeRepository,
  createCanonicalSam31VertexServingReadinessProbeService,
} from '../services/canonical-sam3_1-vertex-serving-readiness-probe-service'
import {
  canonicalSam31VertexServingRuntimeComponentRef,
  createCanonicalSam31VertexServingRuntimeComponentRepository,
} from '../services/canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  createCanonicalGcpSam31VertexCompleteSourceQualificationInvocationService,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-invocation-service'
import {
  createCanonicalGcpSam31VertexCompleteSourceQualificationPreparationService,
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-preparation-service'
import {
  rereadCanonicalSam31VertexServingCapacity,
} from '../services/canonical-sam3_1-vertex-serving-capacity-mutation'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createGoogleCloudAccountEffectiveGpuRateReadPort,
  createWeEditProGoogleCloudGpuRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-gpu-rate-read-port'
import {
  createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort,
  createWeEditProVertexA100ServingRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-vertex-a100-serving-rate-read-port'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'qualify-one-weeditpro-sam31-complete-source-a100-pilot-v1' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const QUALIFICATION_ID = 'sam31-complete-source-a100-4k-20260814-v2' as const
const SOURCE_PLAN_ID = 'sam31-eight-minute-qualification-source-v2' as const
const SOURCE_PREPARATION_ID =
  'sam31-eight-minute-qualification-source-v2:preparation:sam31-source-prep-canonical-20260814T180041Z' as const
const SOURCE_TERMINAL_ID =
  'sam31-source-prep-canonical-20260814T180041Z' as const
const IMAGE_RELEASE_REF = {
  id: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
  version: 1,
  contentHash: CANONICAL_SAM3_1_VERTEX_CURRENT_IMAGE_SUPPLY_CHAIN_RELEASE_HASH,
} as const
const SOURCE_CHECKPOINT_REF = {
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
  id: 'sam31-source-checkpoint-qualification-20260809-v8-vertex-result-publication-corrected',
  version: 2,
  contentHash:
    'sha256:ba8708871ddace51ca8ed0602beeaa8a406c66494848a07ef6f58d377e7085d9',
} as const
const DEPLOYMENT_PROFILE_REF = {
  id: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_ID,
  version: 1,
  contentHash: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYMENT_PROFILE_HASH,
} as const
const DRIVER_COMPONENT_REF = {
  id: `${QUALIFICATION_ID}:vertex-serving-driver-and-cuda`,
  version: 1,
  contentHash:
    'sha256:e6c18d66f75be00186876b81fb7acc93e9c459c7d43f5ce1b01a174e747b6d1c',
} as const
const DETERMINISTIC_COMPONENT_REF = {
  id: `${QUALIFICATION_ID}:vertex-serving-deterministic-run-set`,
  version: 1,
  contentHash:
    'sha256:83a28e189491aa22d879a2309921622bfaa772baeb756a4311d15217bc1249b3',
} as const

const environment = z.object({
  WEEDITPRO_SAM31_COMPLETE_SOURCE_A100_PILOT_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    z.string().regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  WEEDITPRO_SAM31_COMPLETE_SOURCE_A100_PILOT_RUN_ID:
    z.string().trim().min(1).max(70)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
      .refine((value) => !value.includes('..')),
}).strict().parse({
  WEEDITPRO_SAM31_COMPLETE_SOURCE_A100_PILOT_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_COMPLETE_SOURCE_A100_PILOT_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME:
    process.env.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME,
  WEEDITPRO_SAM31_COMPLETE_SOURCE_A100_PILOT_RUN_ID:
    process.env.WEEDITPRO_SAM31_COMPLETE_SOURCE_A100_PILOT_RUN_ID,
})

const runId = environment.WEEDITPRO_SAM31_COMPLETE_SOURCE_A100_PILOT_RUN_ID
const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_BUCKET,
})
const readinessRepository =
  createCanonicalGcsSam31VertexServingReadinessProbeRepository({ storage })
const rolloutRepository =
  createCanonicalGcsSam31VertexModelVersionRolloutRepository({ storage })
const candidateRepository =
  createCanonicalGcsSam31VertexServingQualificationCandidateRepository({
    storage,
  })
const [profile, rolloutRaw] = await Promise.all([
  rereadCanonicalSam31VertexSuccessorDeploymentProfile({
    objectPort,
    profileRef: DEPLOYMENT_PROFILE_REF,
  }),
  rolloutRepository.reread({
    rolloutId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_ID,
  }),
])
if (!profile || !rolloutRaw) {
  throw new Error('Current A100 deployment lineage is absent.')
}
const rollout = assertCanonicalSam31VertexModelVersionRollout(rolloutRaw)
if (`sha256:${rollout.rolloutHash}` !==
    CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_HASH) {
  throw new Error('Current A100 deployment lineage is absent.')
}
const modelVersionRolloutRef = {
  id: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_ID,
  version: 1,
  contentHash: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ROLLOUT_HASH,
}
const readinessTriggerPayload = {
  schemaVersion:
    'canonical-sam3_1-complete-source-a100-pilot-readiness-trigger-v1',
  source: 'canonical_server_sam3_1_complete_source_a100_pilot_operator',
  runId,
  qualificationId: QUALIFICATION_ID,
  runOrdinal: 1,
  deploymentProfileRef: DEPLOYMENT_PROFILE_REF,
  endpointDeploymentRef: modelVersionRolloutRef,
  imageSupplyChainReleaseRef: IMAGE_RELEASE_REF,
  exactPreparedSourceChunkWillBeUsedOnlyAfterReadiness: true,
  nonCustomerReadinessOnly: true,
  modelInferenceAuthorized: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
} as const
const readinessTriggerHash = sha256AuthorityValue(readinessTriggerPayload)
const readiness = await createCanonicalSam31VertexServingReadinessProbeService({
  auth: authClient,
  repository: readinessRepository,
}).warmAndObserve({
  endpointDeploymentRef: modelVersionRolloutRef,
  readinessTriggerRef: {
    id: `sam31-complete-source-readiness-${readinessTriggerHash.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${readinessTriggerHash}`,
  },
  imageSupplyChainReleaseRef: IMAGE_RELEASE_REF,
  immutableImageDigest: profile.immutableImageDigest,
})
const candidateObservedAt = new Date().toISOString()
const candidate =
  await createCanonicalSam31VertexServingQualificationCandidateService({
    currentRouteReadPort: {
      rereadCurrentRoute: () =>
        rereadCanonicalSam31VertexDedicatedPredictionRoute({
          auth: authClient,
        }),
    },
    repository: candidateRepository,
  }).produceOne({
    profile,
    deploymentProfileRef: DEPLOYMENT_PROFILE_REF,
    modelVersionRolloutRef,
    modelVersionRollout: rollout,
    endpointDeploymentRef: readiness.endpointDeploymentRef,
    readinessProbeRef: {
      id: readiness.readinessProbeId,
      version: 1,
      contentHash: `sha256:${readiness.probeHash}`,
    },
    readinessProbe: readiness,
    observedAt: candidateObservedAt,
    expiresAt: new Date(
      Date.parse(candidateObservedAt) + 10 * 60_000,
    ).toISOString(),
  })
const candidateRef = {
  id: candidate.candidateId,
  version: 1,
  contentHash: `sha256:${candidate.candidateHash}` as const,
}

const billingAccountResourceName =
  environment.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME
const a100RateRepository =
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
    storage,
  })
const gpuRateRepository =
  createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository({ storage })
const capacityRepository =
  createCanonicalSam31PrivateQualificationCapacityRepository({ objectPort })
const [a100RateReceipt, gpuRateReceipt, capacity] = await Promise.all([
  publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
    publicationId: `${runId}-a100-rate`,
    publicationVersion: 1,
    readPort:
      createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort({
        configuration: createWeEditProVertexA100ServingRateReaderConfiguration({
          billingAccountResourceName,
        }),
        auth: authClient,
      }),
    capacityObservation:
      await rereadCanonicalSam31VertexServingCapacity({ auth: authClient }),
    repository: a100RateRepository,
  }),
  publishCanonicalCurrentGoogleCloudGpuRateAuthorities({
    publicationId: `${runId}-gpu-rates`,
    publicationVersion: 1,
    readPort: createGoogleCloudAccountEffectiveGpuRateReadPort({
      configuration: createWeEditProGoogleCloudGpuRateReaderConfiguration({
        billingAccountResourceName,
      }),
      auth: authClient,
    }),
    repository: gpuRateRepository,
  }),
  createCanonicalSam31PrivateQualificationCapacityOwner({
    a100QuotaReadPort:
      createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort({
        auth: authClient,
      }),
    l4QuotaReadPort: createCanonicalSam31GcpL4CompleteSourceCapacityReadPort({
      auth: authClient,
    }),
    repository: capacityRepository,
  }).observeAndPersist({ observationId: `${runId}-capacity` }),
])
const l4RateRef = gpuRateReceipt.routePublications.find(
  (route) => route.routeId === 'l4_heavy_fallback',
)?.rateAuthorityRef
if (!l4RateRef) throw new Error('Current L4 fallback rate is absent.')
const authorityReadAt = new Date().toISOString()
const [a100Rate, l4Rate] = await Promise.all([
  a100RateRepository.reread({
    rateAuthorityRef: a100RateReceipt.rateAuthorityRef,
    at: authorityReadAt,
  }),
  gpuRateRepository.rereadApprovedCurrentRate({
    rateAuthorityRef: l4RateRef,
    routeId: 'l4_heavy_fallback',
    at: authorityReadAt,
  }),
])
if (!a100Rate || !l4Rate || !capacity.privateSequentialCapacityReady) {
  throw new Error('Fresh private capacity or account-effective rate is absent.')
}

const sourceRepository =
  createCanonicalSam31EightMinuteQualificationSourceRepository({ objectPort })
const terminalRepository =
  createCanonicalSam31EightMinuteSourcePreparationTerminalRepository({
    objectPort,
  })
const componentRepository =
  createCanonicalSam31VertexServingRuntimeComponentRepository({ objectPort })
const imageRepository =
  createCanonicalSam31GcpImageSupplyChainReleaseRepository({ storage })
const [plan, sourcePreparation, terminal, driver, deterministic, image] =
  await Promise.all([
    sourceRepository.rereadPlan({ qualificationSourceId: SOURCE_PLAN_ID }),
    sourceRepository.rereadPreparation({
      preparationId: SOURCE_PREPARATION_ID,
    }),
    terminalRepository.reread({ invocationId: SOURCE_TERMINAL_ID }),
    componentRepository.reread({ componentRef: DRIVER_COMPONENT_REF }),
    componentRepository.reread({ componentRef: DETERMINISTIC_COMPONENT_REF }),
    imageRepository.rereadQualifiedRelease({
      releaseRef: IMAGE_RELEASE_REF,
    }),
  ])
if (!plan || !sourcePreparation || !terminal || !driver || !deterministic
  || !image) {
  throw new Error('Exact source, image, or current component evidence is absent.')
}
if (canonicalSam31VertexServingRuntimeComponentRef(driver).contentHash !==
    DRIVER_COMPONENT_REF.contentHash
  || canonicalSam31VertexServingRuntimeComponentRef(deterministic)
    .contentHash !== DETERMINISTIC_COMPONENT_REF.contentHash) {
  throw new Error('Current A100 component evidence changed.')
}

const admittedAt = new Date().toISOString()
const expiresAt = new Date(Math.min(
  Date.parse(candidate.expiresAt),
  Date.parse(capacity.expiresAt),
  Date.parse(a100Rate.expiresAt),
  Date.parse(admittedAt) + 8 * 60_000,
)).toISOString()
const parent =
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionOwner().admit({
    admissionId: `${runId}-parent`,
    qualificationId: QUALIFICATION_ID,
    runOrdinal: 1,
    routeId: 'a100_80gb_heavy_primary',
    qualificationSourcePlan: plan,
    sourcePreparation,
    sourcePreparationTerminal: terminal,
    privateQualificationCapacity: capacity,
    driverAndCudaComponent: driver,
    deterministicRunSetComponent: deterministic,
    imageSupplyChainRelease: image,
    accountEffectiveRateAuthority: a100Rate,
    admittedAt,
    expiresAt,
  })
const parentRepository =
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository({
    objectPort,
  })
await parentRepository.persistCreateOnly({ admission: parent })
const parentRef =
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(parent)
const preparation =
  await createCanonicalGcpSam31VertexCompleteSourceQualificationPreparationService({
    storage,
  }).prepareOne({
    parentQualificationAdmissionRef: parentRef,
    qualificationCandidateRef: candidateRef,
    sourceCheckpointQualificationRef: SOURCE_CHECKPOINT_REF,
    currentA100ServingRateAuthorityRef: a100RateReceipt.rateAuthorityRef,
    currentL4FallbackRateAuthorityRef: l4RateRef,
    chunkOrdinal: 1,
  })
const preparationRef =
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRef(
    preparation,
  )
const result =
  await createCanonicalGcpSam31VertexCompleteSourceQualificationInvocationService({
    storage,
    auth: authClient,
  }).invokeOne({
    invocationId: preparation.invocationId,
    qualificationPreparationRef: preparationRef,
    dispatchAdmissionDigestSha256:
      preparation.dispatchAdmissionDigestSha256,
  })

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-complete-source-a100-pilot-receipt-v1',
  runId,
  qualificationId: QUALIFICATION_ID,
  sourcePlanRef: parent.qualificationSourcePlanRef,
  sourcePreparationRef: parent.sourcePreparationRef,
  sourcePreparationTerminalRef: parent.sourcePreparationTerminalRef,
  readinessProbeRef: candidate.readinessProbeRef,
  qualificationCandidateRef: candidateRef,
  privateQualificationCapacityRef: parent.privateQualificationCapacityRef,
  currentA100ServingRateAuthorityRef: a100RateReceipt.rateAuthorityRef,
  currentL4FallbackRateAuthorityRef: l4RateRef,
  parentQualificationAdmissionRef: parentRef,
  qualificationPreparationRef: preparationRef,
  chunkOrdinal: preparation.chunkOrdinal,
  canonicalStartFrameInclusive: preparation.canonicalStartFrameInclusive,
  canonicalEndFrameInclusive: preparation.canonicalEndFrameInclusive,
  decodedFrameCount: preparation.decodedFrameCount,
  result,
  exactPrepared4kSourceChunkUsed: true,
  userTriggeredScaleFromZero: true,
  automaticRetryOrFallbackAllowed: false,
  customerInvocationAuthorized: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)
