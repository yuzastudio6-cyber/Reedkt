import { z } from 'zod'

import {
  createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcpGpuRuntimeReleaseReadinessObserver,
} from '../services/canonical-sam3_1-gpu-runtime-release-readiness-observer'
import {
  createCanonicalSam31GpuRuntimeReleaseRegistry,
} from '../services/canonical-sam3_1-gpu-runtime-release-registry'
import {
  createCanonicalSam31PrivateInternalDispatchReadinessOwner,
  createCanonicalSam31PrivateInternalDispatchReadinessRepository,
} from '../services/canonical-sam3_1-private-internal-dispatch-readiness-owner'
import {
  createCanonicalSam31PrivateInternalReleaseReadinessOwner,
} from '../services/canonical-sam3_1-private-internal-release-readiness-owner'
import {
  assertCanonicalSam31PrivateQualificationCapacityObservation,
  createCanonicalSam31PrivateQualificationCapacityRepository,
} from '../services/canonical-sam3_1-private-qualification-capacity-owner'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const CONFIRMATION =
  'publish-one-sam3_1-private-internal-dispatch-readiness-v1' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const refText = z.string().trim().min(1).max(700)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const routeConfiguration = z.object({
  qualificationId: safeId,
  immutableImageDigest: prefixedSha256,
  driverAndCudaRef: refText,
  deterministicRunSetRef: refText,
  eightMinutePerformanceRef: refText,
  independentTemporalQualityRef: refText,
  runtimeReleaseRef: refText,
  rateAuthorityRef: refText,
}).strict()
const configuration = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_STATE_BUCKET),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_PRIVATE_DISPATCH_READINESS_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_PRIVATE_DISPATCH_READINESS_ID: safeId,
  WEEDITPRO_SAM31_PRIVATE_RELEASE_READINESS_ID: safeId,
  WEEDITPRO_SAM31_PRIVATE_CAPACITY_OBSERVATION_ID: safeId,
  a100: routeConfiguration,
  l4: routeConfiguration,
}).strict().parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET: process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_PRIVATE_DISPATCH_READINESS_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_PRIVATE_DISPATCH_READINESS_CONFIRMATION,
  WEEDITPRO_SAM31_PRIVATE_DISPATCH_READINESS_ID:
    process.env.WEEDITPRO_SAM31_PRIVATE_DISPATCH_READINESS_ID,
  WEEDITPRO_SAM31_PRIVATE_RELEASE_READINESS_ID:
    process.env.WEEDITPRO_SAM31_PRIVATE_RELEASE_READINESS_ID,
  WEEDITPRO_SAM31_PRIVATE_CAPACITY_OBSERVATION_ID:
    process.env.WEEDITPRO_SAM31_PRIVATE_CAPACITY_OBSERVATION_ID,
  a100: routeEnvironment('A100'),
  l4: routeEnvironment('L4'),
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: configuration.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const observedAt = new Date().toISOString()
const capacityRaw = await createCanonicalSam31PrivateQualificationCapacityRepository({
  objectPort,
}).reread({
  observationId:
    configuration.WEEDITPRO_SAM31_PRIVATE_CAPACITY_OBSERVATION_ID,
})
if (!capacityRaw) throw new Error(
  'Current private sequential GPU capacity observation is missing.',
)
const capacity = assertCanonicalSam31PrivateQualificationCapacityObservation(
  capacityRaw,
  observedAt,
)
const componentObserver =
  createCanonicalSam31GcpGpuRuntimeReleaseReadinessObserver({ storage })
const [a100Observation, l4Observation] = await Promise.all([
  componentObserver.observe(componentRequest(
    'a100_80gb_heavy_primary',
    configuration.a100,
  )),
  componentObserver.observe(componentRequest(
    'l4_heavy_fallback',
    configuration.l4,
  )),
])
const privateReleaseReadiness =
  createCanonicalSam31PrivateInternalReleaseReadinessOwner().observe({
    readinessId:
      configuration.WEEDITPRO_SAM31_PRIVATE_RELEASE_READINESS_ID,
    capacityObservation: capacity,
    a100RouteReadinessObservation: a100Observation,
    l4RouteReadinessObservation: l4Observation,
    observedAt,
  })
if (!privateReleaseReadiness.privateInternalReleasePublicationMayProceed) {
  throw new Error(
    `Private SAM 3.1 release evidence is incomplete: ${
      privateReleaseReadiness.blockers.join(',')}`,
  )
}

const releaseRegistry = createCanonicalSam31GpuRuntimeReleaseRegistry({
  objectPort,
})
const a100RuntimeReleaseRef = parseRef(configuration.a100.runtimeReleaseRef)
const l4RuntimeReleaseRef = parseRef(configuration.l4.runtimeReleaseRef)
const [a100ReleasePair, l4ReleasePair] = await Promise.all([
  releaseRegistry.rereadReleasePair({
    runtimeReleaseRef: a100RuntimeReleaseRef,
  }),
  releaseRegistry.rereadReleasePair({
    runtimeReleaseRef: l4RuntimeReleaseRef,
  }),
])
if (!a100ReleasePair || !l4ReleasePair) {
  throw new Error('Exact private SAM 3.1 runtime release pair is missing.')
}

const a100RateAuthorityRef = parseRef(configuration.a100.rateAuthorityRef)
const l4RateAuthorityRef = parseRef(configuration.l4.rateAuthorityRef)
const [a100Rate, l4Rate] = await Promise.all([
  createCanonicalGcsCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
    storage,
    projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
  }).reread({ rateAuthorityRef: a100RateAuthorityRef, at: observedAt }),
  createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository({
    storage,
    projectId: configuration.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
  }).rereadApprovedCurrentRate({
    rateAuthorityRef: l4RateAuthorityRef,
    routeId: 'l4_heavy_fallback',
    at: observedAt,
  }),
])
if (!a100Rate || !l4Rate) {
  throw new Error('Current account-effective A100/L4 rate pair is missing.')
}
const expiresAt = new Date(Math.min(
  Date.parse(a100ReleasePair.runtimeRelease.expiresAt),
  Date.parse(l4ReleasePair.runtimeRelease.expiresAt),
)).toISOString()
const readiness =
  createCanonicalSam31PrivateInternalDispatchReadinessOwner().observe({
    readinessId: configuration.WEEDITPRO_SAM31_PRIVATE_DISPATCH_READINESS_ID,
    privateInternalReleaseReadiness: privateReleaseReadiness,
    a100RouteReadinessObservation: a100Observation,
    l4RouteReadinessObservation: l4Observation,
    a100RuntimeRelease: a100ReleasePair.runtimeRelease,
    l4RuntimeRelease: l4ReleasePair.runtimeRelease,
    currentA100RateAuthority: a100Rate,
    currentL4RateAuthority: l4Rate,
    observedAt,
    expiresAt,
  })
const repository =
  createCanonicalSam31PrivateInternalDispatchReadinessRepository({ objectPort })
const persistenceDisposition = await repository.persistCreateOnly({ readiness })
const [a100Exact, l4Exact] = await Promise.all([
  repository.rereadCurrent({
    runtimeReleaseRef: readiness.a100RuntimeReleaseRef,
    rateAuthorityRef: readiness.currentA100RateAuthorityRef,
    at: observedAt,
  }),
  repository.rereadCurrent({
    runtimeReleaseRef: readiness.l4RuntimeReleaseRef,
    rateAuthorityRef: readiness.currentL4RateAuthorityRef,
    at: observedAt,
  }),
])
if (!a100Exact || !l4Exact
  || a100Exact.readinessHash !== readiness.readinessHash
  || l4Exact.readinessHash !== readiness.readinessHash) {
  throw new Error('Private SAM 3.1 dispatch publication reread changed.')
}

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'canonical-sam3_1-private-internal-dispatch-readiness-publication-receipt-v1',
  readinessRef: {
    id: readiness.readinessId,
    version: 1,
    contentHash: `sha256:${readiness.readinessHash}`,
  },
  persistenceDisposition,
  exactCapacityComponentReleaseAndRateReread: true,
  exactA100AndL4RepositoryReread: true,
  privateInternalSequentialDispatchAuthorized: true,
  publicConcurrencyCapacityRequired: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})}\n`)

function routeEnvironment(prefix: 'A100' | 'L4') {
  return {
    qualificationId:
      process.env[`WEEDITPRO_SAM31_${prefix}_QUALIFICATION_ID`],
    immutableImageDigest:
      process.env[`WEEDITPRO_SAM31_${prefix}_IMMUTABLE_IMAGE_DIGEST`],
    driverAndCudaRef:
      process.env[`WEEDITPRO_SAM31_${prefix}_DRIVER_AND_CUDA_REF`],
    deterministicRunSetRef:
      process.env[`WEEDITPRO_SAM31_${prefix}_DETERMINISTIC_RUN_SET_REF`],
    eightMinutePerformanceRef:
      process.env[`WEEDITPRO_SAM31_${prefix}_EIGHT_MINUTE_PERFORMANCE_REF`],
    independentTemporalQualityRef:
      process.env[`WEEDITPRO_SAM31_${prefix}_TEMPORAL_QUALITY_REF`],
    runtimeReleaseRef:
      process.env[`WEEDITPRO_SAM31_${prefix}_RUNTIME_RELEASE_REF`],
    rateAuthorityRef:
      process.env[`WEEDITPRO_SAM31_${prefix}_RATE_AUTHORITY_REF`],
  }
}

function componentRequest(
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback',
  route: z.infer<typeof routeConfiguration>,
) {
  return {
    routeId,
    qualificationId: route.qualificationId,
    immutableImageDigest: route.immutableImageDigest,
    componentEvidenceRefs: {
      driverAndCudaRef: parseRef(route.driverAndCudaRef, 1),
      deterministicRunSetRef: parseRef(route.deterministicRunSetRef, 1),
      eightMinutePerformanceRef: parseRef(route.eightMinutePerformanceRef, 1),
      independentTemporalQualityRef:
        parseRef(route.independentTemporalQualityRef, 1),
    },
  }
}

function parseRef(value: string, requiredVersion?: number) {
  const match = /^(?<id>[^|]+)\|(?<version>[1-9]\d*)\|(?<hash>sha256:[a-f0-9]{64})$/u
    .exec(value)
  if (!match?.groups) throw new Error('Private readiness ref text is invalid.')
  const version = z.coerce.number().int().positive().safe()
    .parse(match.groups.version)
  if (requiredVersion !== undefined && version !== requiredVersion) {
    throw new Error('Private readiness component ref version changed.')
  }
  return {
    id: safeId.parse(match.groups.id),
    version,
    contentHash: prefixedSha256.parse(match.groups.hash),
  }
}
