import assert from 'node:assert/strict'

import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  createGoogleCloudProfessionalGpuJobLaunchPort,
  type CanonicalProfessionalGoogleCloudGpuRelease,
} from '../services/canonical-professional-google-cloud-gpu-job-launch-port'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31GpuFixedTaskContractRef,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'

const a100ImageRaw = sha('sam31-a100-image')
const a100ImageRef = evidenceRef('sam31-a100-private-image', a100ImageRaw)
const a100ReleaseRef = evidenceRef(
  'sam31-a100-private-runtime-release',
  sha('sam31-a100-runtime-release-record'),
)
assert.notEqual(a100ReleaseRef.contentHash, a100ImageRef.contentHash)
export const a100Admission = buildAdmission({
  admissionId: 'sam31-a100-admission',
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.segment_and_track_subject.v1',
  routeId: 'a100_80gb_heavy_primary',
  releaseRef: a100ReleaseRef,
})
export const a100Target = {
  releaseRef: a100ReleaseRef,
  releaseEvidenceClass: 'canonical_private_reread' as const,
  privateInternalQualified: true as const,
  toolId: a100Admission.toolId,
  operationId: a100Admission.operationId,
  routeId: a100Admission.routeId,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_batch_a2_ultra_job' as const,
  machineType: 'a2-ultragpu-1g' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  immutableImageRef: a100ImageRef,
  immutableImageDigest: a100ImageRef.contentHash,
  fixedServerTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
  serviceIdentityRef: ref('sam31-service-identity'),
  privateNetworkAndArtifactTransportRef: ref('sam31-private-transport'),
  minimumIdleInstances: 0 as const,
  maximumConcurrentAttemptsPerInstance: 1 as const,
  runtimeNetworkDownloadAllowed: false as const,
  callerCommandImageModelOrEnvironmentAccepted: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  startsOnlyFromConsumedApprovedAdmission: true as const,
  stopsAtTerminalAttempt: true as const,
}
export const a100Release = buildA100Release()
export const a100PrivateTransport = buildSam31PrivateObjectTransport({
  routeId: 'a100_80gb_heavy_primary',
  target: a100Target,
  cloudRunJobResource: null,
})
let a100Request: Record<string, unknown> | null = null
const a100Port = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return structuredClone(a100Release)
    },
  },
  privateObjectTransportReadPort: {
    async rereadPrivateObjectTransport() {
      return structuredClone(a100PrivateTransport)
    },
  },
  auth: {
    async request(input) {
      a100Request = structuredClone(input as Record<string, unknown>)
      const params = input.params as { jobId: string; requestId: string }
      return {
        data: {
          name: `projects/reeditpro/locations/us-central1/jobs/${params.jobId}`,
          uid: 'a100-job-uid-1',
        },
      } as never
    },
  },
  now: () => '2026-08-02T17:00:00.000Z',
})
const a100Result = await a100Port.startOneShotJob({
  admission: a100Admission,
  target: a100Target,
  admissionConsumptionRef: ref('sam31-a100-consumption'),
  executionEnvelopeRef: ref('sam31-a100-execution-envelope'),
})
assert.equal(a100Result.disposition, 'accepted')
assert.ok(a100Result.cloudJobExecutionRef)
assert.equal(
  a100Result.providerInferenceOrSubstantiveWorkKnownExecuted,
  'not_executed',
)
const observedA100Request = requireCapturedRequest(a100Request)
assert.equal(
  observedA100Request.url,
  'https://batch.googleapis.com/v1/projects/reeditpro/locations/us-central1/jobs',
)
assert.equal(observedA100Request.retry, false)
assert.equal(observedA100Request.maxRedirects, 0)
const a100Body = observedA100Request.data as Record<string, unknown>
const a100Task = ((a100Body.taskGroups as Array<Record<string, unknown>>)[0]
  .taskSpec as Record<string, unknown>)
assert.equal(a100Task.maxRetryCount, 0)
assert.equal(
  JSON.stringify(a100Body).includes(a100Release.immutableImageUri),
  true,
)
assert.equal(JSON.stringify(a100Body).includes('command'), false)
assert.equal(JSON.stringify(a100Body).includes('workspace-1'), false)
assert.equal(JSON.stringify(a100Body).includes('sam2'), false)
assert.equal(JSON.stringify(a100Body).includes(
  'reeditpro-private-professional-gpu',
), true)
assert.equal(JSON.stringify(a100Body).includes('/mnt/reeditpro'), true)
assert.equal(JSON.stringify(a100Body).includes(
  'WEEDITPRO_GPU_ACCELERATOR_CLASS',
), true)
assert.equal(JSON.stringify(a100Body).includes('nvidia_a100_80gb'), true)

let missingTransportProviderCalls = 0
const missingTransportPort = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return structuredClone(a100Release)
    },
  },
  auth: {
    async request() {
      missingTransportProviderCalls += 1
      throw new Error('Missing transport must not reach Google Cloud.')
    },
  },
  now: () => '2026-08-02T17:00:30.000Z',
})
const missingTransportResult = await missingTransportPort.startOneShotJob({
  admission: a100Admission,
  target: a100Target,
  admissionConsumptionRef: ref('sam31-a100-no-transport-consumption'),
  executionEnvelopeRef: ref('sam31-a100-no-transport-envelope'),
})
assert.equal(missingTransportResult.disposition, 'rejected_before_creation')
assert.equal(missingTransportProviderCalls, 0)

const sam31L4ImageRaw = sha('sam31-l4-image')
const sam31L4ImageRef = evidenceRef(
  'sam31-l4-private-image',
  sam31L4ImageRaw,
)
const sam31L4ReleaseRef = evidenceRef(
  'sam31-l4-private-runtime-release',
  sha('sam31-l4-runtime-release-record'),
)
export const sam31L4Admission = buildAdmission({
  admissionId: 'sam31-l4-fallback-admission',
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.segment_and_track_subject.v1',
  routeId: 'l4_heavy_fallback',
  releaseRef: sam31L4ReleaseRef,
})
export const sam31L4Target = {
  ...a100Target,
  releaseRef: sam31L4ReleaseRef,
  routeId: 'l4_heavy_fallback' as const,
  runtimeRegion: 'europe-west4' as const,
  executionTarget: 'google_cloud_run_l4_job' as const,
  machineType: 'cloud_run_nvidia_l4' as const,
  accelerator: 'nvidia_l4' as const,
  immutableImageRef: sam31L4ImageRef,
  immutableImageDigest: sam31L4ImageRef.contentHash,
  serviceIdentityRef: ref('sam31-l4-service-identity'),
  privateNetworkAndArtifactTransportRef: ref('sam31-l4-private-transport'),
}
export const sam31L4Release = buildSam31L4Release()
export const sam31L4PrivateTransport = buildSam31PrivateObjectTransport({
  routeId: 'l4_heavy_fallback',
  target: sam31L4Target,
  cloudRunJobResource:
    'projects/reeditpro/locations/europe-west4/jobs/reeditpro-sam31-l4-fallback',
})
let sam31L4Request: Record<string, unknown> | null = null
const sam31L4Port = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return structuredClone(sam31L4Release)
    },
  },
  privateObjectTransportReadPort: {
    async rereadPrivateObjectTransport() {
      return structuredClone(sam31L4PrivateTransport)
    },
  },
  auth: {
    async request(input) {
      sam31L4Request = structuredClone(input as Record<string, unknown>)
      return {
        data: {
          name:
            'projects/reeditpro/locations/europe-west4/operations/sam31-l4-op-1',
          done: false,
        },
      } as never
    },
  },
  now: () => '2026-08-02T17:00:45.000Z',
})
const sam31L4Result = await sam31L4Port.startOneShotJob({
  admission: sam31L4Admission,
  target: sam31L4Target,
  admissionConsumptionRef: ref('sam31-l4-consumption'),
  executionEnvelopeRef: ref('sam31-l4-execution-envelope'),
})
assert.equal(sam31L4Result.disposition, 'accepted')
const observedSam31L4Request = requireCapturedRequest(sam31L4Request)
assert.equal(
  observedSam31L4Request.url,
  'https://run.googleapis.com/v2/projects/reeditpro/locations/europe-west4/jobs/reeditpro-sam31-l4-fallback:run',
)
assert.equal(JSON.stringify(observedSam31L4Request.data).includes(
  'REEDITPRO_GPU_INVOCATION_ID',
), true)
assert.equal(JSON.stringify(observedSam31L4Request.data).includes(
  'WEEDITPRO_GPU_ACCELERATOR_CLASS',
), true)
assert.equal(JSON.stringify(observedSam31L4Request.data).includes(
  'nvidia_l4',
), true)
assert.equal(JSON.stringify(observedSam31L4Request.data).includes(
  'reeditpro-private-professional-gpu',
), false)

const l4ImageRaw = sha('ffmpeg-l4-image')
const l4ImageRef = evidenceRef('ffmpeg-l4-private-image', l4ImageRaw)
const l4ReleaseRef = evidenceRef(
  'ffmpeg-l4-private-runtime-release',
  sha('ffmpeg-l4-runtime-release-record'),
)
assert.notEqual(l4ReleaseRef.contentHash, l4ImageRef.contentHash)
const l4Admission = buildAdmission({
  admissionId: 'ffmpeg-l4-admission',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.professional_media_processing.v1',
  routeId: 'l4_standard_primary',
  releaseRef: l4ReleaseRef,
})
const l4Target = {
  ...a100Target,
  releaseRef: l4ReleaseRef,
  toolId: l4Admission.toolId,
  operationId: l4Admission.operationId,
  routeId: l4Admission.routeId,
  executionTarget: 'google_cloud_run_l4_job' as const,
  machineType: 'cloud_run_nvidia_l4' as const,
  accelerator: 'nvidia_l4' as const,
  immutableImageRef: l4ImageRef,
  immutableImageDigest: l4ImageRef.contentHash,
  fixedServerTaskContractRef: ref('ffmpeg-fixed-task'),
  serviceIdentityRef: ref('ffmpeg-service-identity'),
  privateNetworkAndArtifactTransportRef: ref('ffmpeg-private-transport'),
}
const l4Release = buildL4Release()
let l4Request: Record<string, unknown> | null = null
const l4Port = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return structuredClone(l4Release)
    },
  },
  auth: {
    async request(input) {
      l4Request = structuredClone(input as Record<string, unknown>)
      return {
        data: {
          name: 'projects/reeditpro/locations/us-central1/operations/l4-op-1',
          done: false,
        },
      } as never
    },
  },
  now: () => '2026-08-02T17:01:00.000Z',
})
const l4Result = await l4Port.startOneShotJob({
  admission: l4Admission,
  target: l4Target,
  admissionConsumptionRef: ref('ffmpeg-l4-consumption'),
  executionEnvelopeRef: ref('ffmpeg-l4-execution-envelope'),
})
assert.equal(l4Result.disposition, 'accepted')
const observedL4Request = requireCapturedRequest(l4Request)
assert.equal(
  observedL4Request.url,
  'https://run.googleapis.com/v2/projects/reeditpro/locations/us-central1/jobs/reeditpro-professional-l4:run',
)
assert.equal(observedL4Request.retry, false)
assert.equal(observedL4Request.maxRedirects, 0)
const l4Serialized = JSON.stringify(observedL4Request.data)
assert.equal(l4Serialized.includes('image'), false)
assert.equal(l4Serialized.includes('command'), false)
assert.equal(l4Serialized.includes('REEDITPRO_GPU_INVOCATION_ID'), true)
assert.equal(l4Serialized.includes('WEEDITPRO_GPU_ACCELERATOR_CLASS'), true)
assert.equal(l4Serialized.includes('nvidia_l4'), true)
assert.equal(l4Serialized.includes('workspace-1'), false)

const maskQaImageRaw = sha('track-all-mask-qa-l4-image')
const maskQaImageRef = evidenceRef(
  'track-all-mask-qa-l4-private-image',
  maskQaImageRaw,
)
const maskQaReleaseRef = evidenceRef(
  'track-all-mask-qa-l4-runtime-release',
  sha('track-all-mask-qa-l4-runtime-release-record'),
)
export const maskQaAdmission = buildAdmission({
  admissionId: 'track-all-mask-qa-l4-admission',
  toolId: 'kornia',
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary',
  releaseRef: maskQaReleaseRef,
})
export const maskQaTarget = {
  ...l4Target,
  releaseRef: maskQaReleaseRef,
  toolId: maskQaAdmission.toolId,
  operationId: maskQaAdmission.operationId,
  immutableImageRef: maskQaImageRef,
  immutableImageDigest: maskQaImageRef.contentHash,
  fixedServerTaskContractRef:
    canonicalTrackAllSam31L4TaskQaFixedTaskContractRef(),
  serviceIdentityRef: ref('track-all-mask-qa-l4-service-identity'),
  privateNetworkAndArtifactTransportRef:
    ref('track-all-mask-qa-l4-private-transport'),
}
export const maskQaRelease = buildMaskQaL4Release()
export const maskQaPrivateTransport = buildMaskQaPrivateObjectTransport()
let maskQaRequest: Record<string, unknown> | null = null
const maskQaPort = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return structuredClone(maskQaRelease)
    },
  },
  privateObjectTransportReadPort: {
    async rereadPrivateObjectTransport() {
      return structuredClone(maskQaPrivateTransport)
    },
  },
  auth: {
    async request(input) {
      maskQaRequest = structuredClone(input as Record<string, unknown>)
      return {
        data: {
          name:
            'projects/reeditpro/locations/us-central1/operations/mask-qa-l4-op-1',
          done: false,
        },
      } as never
    },
  },
  now: () => '2026-08-02T17:01:30.000Z',
})
const maskQaResult = await maskQaPort.startOneShotJob({
  admission: maskQaAdmission,
  target: maskQaTarget,
  admissionConsumptionRef: ref('track-all-mask-qa-l4-consumption'),
  executionEnvelopeRef: ref('track-all-mask-qa-l4-execution-envelope'),
})
assert.equal(maskQaResult.disposition, 'accepted')
const observedMaskQaRequest = requireCapturedRequest(maskQaRequest)
assert.equal(
  observedMaskQaRequest.url,
  'https://run.googleapis.com/v2/projects/reeditpro/locations/us-central1/jobs/reeditpro-track-all-mask-qa-l4:run',
)
const maskQaSerialized = JSON.stringify(observedMaskQaRequest.data)
assert.equal(maskQaSerialized.includes('REEDITPRO_GPU_INVOCATION_ID'), true)
assert.equal(maskQaSerialized.includes('nvidia_l4'), true)
assert.equal(maskQaSerialized.includes('command'), false)
assert.equal(maskQaSerialized.includes('image'), false)

let missingMaskQaTransportProviderCalls = 0
const missingMaskQaTransportPort =
  createGoogleCloudProfessionalGpuJobLaunchPort({
    releaseReadPort: {
      async rereadPrivateRelease() {
        return structuredClone(maskQaRelease)
      },
    },
    auth: {
      async request() {
        missingMaskQaTransportProviderCalls += 1
        throw new Error('Missing mask-QA transport must not reach cloud.')
      },
    },
    now: () => '2026-08-02T17:01:45.000Z',
  })
const missingMaskQaTransport = await missingMaskQaTransportPort.startOneShotJob({
  admission: maskQaAdmission,
  target: maskQaTarget,
  admissionConsumptionRef: ref('track-all-mask-qa-no-transport-consumption'),
  executionEnvelopeRef: ref('track-all-mask-qa-no-transport-envelope'),
})
assert.equal(missingMaskQaTransport.disposition, 'rejected_before_creation')
assert.equal(missingMaskQaTransportProviderCalls, 0)

let unknownRequestCount = 0
const unknownPort = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return structuredClone(a100Release)
    },
  },
  privateObjectTransportReadPort: {
    async rereadPrivateObjectTransport() {
      return structuredClone(a100PrivateTransport)
    },
  },
  auth: {
    async request() {
      unknownRequestCount += 1
      throw new Error('Synthetic network abort after provider call started.')
    },
  },
  now: () => '2026-08-02T17:02:00.000Z',
})
const unknownResult = await unknownPort.startOneShotJob({
  admission: a100Admission,
  target: a100Target,
  admissionConsumptionRef: ref('sam31-a100-unknown-consumption'),
  executionEnvelopeRef: ref('sam31-a100-unknown-envelope'),
})
assert.equal(unknownRequestCount, 1)
assert.equal(unknownResult.disposition, 'outcome_unknown')
assert.equal(
  unknownResult.providerInferenceOrSubstantiveWorkKnownExecuted,
  'unknown',
)

let rejectedRequestCount = 0
const mismatchedReleasePayload = {
  ...a100Release,
  operationId: 'tool.ffmpeg.professional_media_processing.v1',
}
Reflect.deleteProperty(mismatchedReleasePayload, 'configurationHash')
const mismatchedRelease = {
  ...mismatchedReleasePayload,
  configurationHash: sha256AuthorityValue(mismatchedReleasePayload),
}
const rejectedPort = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return mismatchedRelease
    },
  },
  auth: {
    async request() {
      rejectedRequestCount += 1
      throw new Error('Mismatched release must not reach Google Cloud.')
    },
  },
  now: () => '2026-08-02T17:03:00.000Z',
})
const rejectedResult = await rejectedPort.startOneShotJob({
  admission: a100Admission,
  target: a100Target,
  admissionConsumptionRef: ref('sam31-a100-rejected-consumption'),
  executionEnvelopeRef: ref('sam31-a100-rejected-envelope'),
})
assert.equal(rejectedRequestCount, 0)
assert.equal(rejectedResult.disposition, 'rejected_before_creation')
assert.equal(
  rejectedResult.providerInferenceOrSubstantiveWorkKnownExecuted,
  'not_executed',
)

let hostileReleaseProviderCalls = 0
const hostileReleasePort = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return new Proxy({}, {
        ownKeys() {
          throw new Error('Hostile release ownKeys trap must be contained.')
        },
      })
    },
  },
  auth: {
    async request() {
      hostileReleaseProviderCalls += 1
      throw new Error('Hostile release must not reach Google Cloud.')
    },
  },
  now: () => '2026-08-02T17:04:00.000Z',
})
const hostileReleaseResult = await hostileReleasePort.startOneShotJob({
  admission: a100Admission,
  target: a100Target,
  admissionConsumptionRef: ref('sam31-a100-hostile-consumption'),
  executionEnvelopeRef: ref('sam31-a100-hostile-envelope'),
})
assert.equal(hostileReleaseProviderCalls, 0)
assert.equal(hostileReleaseResult.disposition, 'rejected_before_creation')

let providerGetterInvoked = false
const hostileResponsePort = createGoogleCloudProfessionalGpuJobLaunchPort({
  releaseReadPort: {
    async rereadPrivateRelease() {
      return structuredClone(a100Release)
    },
  },
  privateObjectTransportReadPort: {
    async rereadPrivateObjectTransport() {
      return structuredClone(a100PrivateTransport)
    },
  },
  auth: {
    async request() {
      const response: Record<string, unknown> = {
        uid: 'a100-job-uid-hostile',
      }
      Object.defineProperty(response, 'name', {
        enumerable: true,
        get() {
          providerGetterInvoked = true
          return 'must-not-be-read'
        },
      })
      return { data: response } as never
    },
  },
  now: () => '2026-08-02T17:05:00.000Z',
})
const hostileResponseResult = await hostileResponsePort.startOneShotJob({
  admission: a100Admission,
  target: a100Target,
  admissionConsumptionRef: ref('sam31-a100-hostile-response-consumption'),
  executionEnvelopeRef: ref('sam31-a100-hostile-response-envelope'),
})
assert.equal(providerGetterInvoked, false)
assert.equal(hostileResponseResult.disposition, 'outcome_unknown')

console.log(JSON.stringify({
  smoke: 'canonical-professional-google-cloud-gpu-job-launch-port',
  checks: 72,
  a100BatchRequestAccepted: true,
  sam31L4FallbackPreconfiguredPrivateMountAccepted: true,
  l4CloudRunRequestAccepted: true,
  trackAllMaskQaL4PrivateTransportAccepted: true,
  callerCommandImageModelOrEnvironmentAccepted: false,
  providerRedirectAllowed: false,
  automaticProviderRetryAllowed: false,
  unknownCreateOutcomeRetryAllowed: false,
  mismatchedReleaseProviderCalls: rejectedRequestCount,
  missingPrivateTransportProviderCalls: missingTransportProviderCalls,
  missingMaskQaTransportProviderCalls,
  cpuOnlySubstantiveExecutionAllowed: false,
  liveCloudJobCreated: false,
  productionAuthorityGranted: false,
}))

function buildSam31PrivateObjectTransport(input: {
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary'
  target: {
    serviceIdentityRef: ReturnType<typeof ref>
    privateNetworkAndArtifactTransportRef: ReturnType<typeof ref>
  }
  cloudRunJobResource: string | null
}) {
  const a100 = input.routeId === 'a100_80gb_heavy_primary'
  const payload = {
    schemaVersion:
      'canonical-professional-google-cloud-gpu-private-object-transport-v1' as const,
    source:
      'canonical_server_professional_gpu_private_object_transport_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    transportRef: input.target.privateNetworkAndArtifactTransportRef,
    serviceIdentityRef: input.target.serviceIdentityRef,
    routeId: input.routeId,
    projectId: 'reeditpro' as const,
    privateBucketName: 'reeditpro-private-professional-gpu',
    bucketCmekAndUniformAccessPolicyRef: ref('private-gpu-bucket-policy'),
    invocationRootMountPath: '/mnt/reeditpro' as const,
    invocationObjectPrefix:
      'private/canonical-professional-gpu/sam3_1/v1/invocations' as const,
    taskObjectName: 'task.json' as const,
    sourceProxyObjectName: 'mask-proxy.mp4' as const,
    responseObjectName: 'response.json' as const,
    gcsFuseVolumeName: 'reeditpro-private-gpu-objects' as const,
    gcsFuseMountOptions: 'rw,implicit-dirs' as const,
    cloudRunJobResource: input.cloudRunJobResource,
    cloudRunJobConfigurationRef: a100
      ? null
      : ref('sam31-l4-cloud-run-job-configuration'),
    a100BatchMountCompiledIntoCreateRequest: a100,
    l4CloudRunMountPreconfiguredAndReread: !a100,
    taskAndSourceGenerationOneRereadBeforeLaunch: true as const,
    responseAndOutputGenerationOneRequired: true as const,
    serviceIdentityLeastPrivilegeReadTaskSourceWriteOutputOnly: true as const,
    signedUrlPublicObjectOrCallerPathTransportAllowed: false as const,
    runtimeModelOrMediaDownloadAllowed: false as const,
    publicNetworkEgressAllowed: false as const,
    observedAt: '2026-08-02T16:55:00.000Z',
  }
  return {
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  }
}

function buildMaskQaPrivateObjectTransport() {
  const payload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-private-object-transport-v2' as const,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_private_transport_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    transportRef: maskQaTarget.privateNetworkAndArtifactTransportRef,
    serviceIdentityRef: maskQaTarget.serviceIdentityRef,
    routeId: 'l4_standard_primary' as const,
    projectId: 'reeditpro' as const,
    privateBucketName: 'reeditpro-private-professional-gpu',
    bucketSecurityPolicyRef: ref('private-gpu-bucket-security-policy'),
    bucketEncryptionMode: 'google_managed_encryption' as const,
    uniformBucketLevelAccessEnabled: true as const,
    publicAccessPreventionEnforced: true as const,
    invocationRootMountPath: '/mnt/reeditpro' as const,
    invocationObjectPrefix:
      'private/canonical-professional-gpu/sam3_1/v1/invocations' as const,
    sam31ManifestObjectName: 'output/mask-manifest.json' as const,
    sam31MaskObjectPattern:
      'output/frame-{frameIndex:06}-object-{objectId:06}.png' as const,
    l4TaskObjectName: 'task-qa/task.json' as const,
    l4ResponseObjectName: 'task-qa/response.json' as const,
    gcsFuseVolumeName: 'reeditpro-private-gpu-objects' as const,
    gcsFuseMountOptions:
      'uid=65532,gid=65532,implicit-dirs=true' as const,
    cloudRunJobResource:
      'projects/reeditpro/locations/us-central1/jobs/reeditpro-track-all-mask-qa-l4',
    cloudRunJobConfigurationRef:
      ref('track-all-mask-qa-l4-cloud-run-configuration'),
    l4CloudRunMountPreconfiguredAndReread: true as const,
    separateSam31ReadRootAndL4TaskQaWriteRoot: true as const,
    exactSam31ManifestAndEveryMaskRereadRequired: true as const,
    l4TaskGenerationOneRereadBeforeLaunch: true as const,
    l4ResponseGenerationOneRequired: true as const,
    callerPathUrlObjectNameCommandOrEnvironmentAllowed: false as const,
    runtimeModelOrMediaDownloadAllowed: false as const,
    publicNetworkEgressAllowed: false as const,
    observedAt: '2026-08-02T16:55:00.000Z',
  }
  return {
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  }
}

function buildMaskQaL4Release(): CanonicalProfessionalGoogleCloudGpuRelease {
  const payload = {
    ...buildL4Release(),
    releaseRef: maskQaReleaseRef,
    fixedServerTaskContractRef:
      maskQaTarget.fixedServerTaskContractRef,
    serviceIdentityRef: maskQaTarget.serviceIdentityRef,
    privateNetworkAndArtifactTransportRef:
      maskQaTarget.privateNetworkAndArtifactTransportRef,
    toolId: maskQaAdmission.toolId,
    operationId: maskQaAdmission.operationId,
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/gpu/track-all-mask-qa-l4@sha256:${maskQaImageRaw}`,
    immutableImageRef: maskQaImageRef,
    immutableImageDigest: maskQaImageRef.contentHash,
    cloudRunJobResource:
      'projects/reeditpro/locations/us-central1/jobs/reeditpro-track-all-mask-qa-l4',
  }
  Reflect.deleteProperty(payload, 'configurationHash')
  return {
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  }
}

function buildA100Release(): CanonicalProfessionalGoogleCloudGpuRelease {
  const payload = {
    schemaVersion:
      'canonical-professional-google-cloud-gpu-release-v2' as const,
    source:
      'canonical_server_professional_google_cloud_gpu_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseRef: a100ReleaseRef,
    fixedServerTaskContractRef: a100Target.fixedServerTaskContractRef,
    serviceIdentityRef: a100Target.serviceIdentityRef,
    privateNetworkAndArtifactTransportRef:
      a100Target.privateNetworkAndArtifactTransportRef,
    toolId: a100Admission.toolId,
    operationId: a100Admission.operationId,
    routeId: 'a100_80gb_heavy_primary' as const,
    projectId: 'reeditpro' as const,
    runtimeRegion: 'us-central1' as const,
    serviceAccountEmail:
      'reeditpro-professional-gpu@reeditpro.iam.gserviceaccount.com',
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/gpu/sam3-1@sha256:${a100ImageRaw}`,
    immutableImageRef: a100ImageRef,
    immutableImageDigest: a100ImageRef.contentHash,
    maximumExecutionSeconds: 1_200,
    taskCount: 1 as const,
    taskParallelism: 1 as const,
    maximumTaskRetries: 0 as const,
    invocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID' as const,
    acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS' as const,
    privateExecutionEnvelopeRereadRequired: true as const,
    runtimeDownloadAllowed: false as const,
    callerCommandImageModelPathUrlOrEnvironmentAccepted: false as const,
    externalIpAllowed: false as const,
    privateNetworkOnly: true as const,
    minimumIdleInstances: 0 as const,
    prewarmingOrKeepaliveAllowed: false as const,
    oneConsumedAdmissionCreatesAtMostOneJob: true as const,
    retryAfterUnknownCreateOutcomeAllowed: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    executionTarget: 'google_cloud_batch_a2_ultra_job' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 12 as const,
    allocatedMemoryGiB: 170 as const,
    allocatedLocalScratchGiB: 375 as const,
    batchCollectionResource:
      'projects/reeditpro/locations/us-central1/jobs',
    batchInstanceTemplateResource:
      'projects/reeditpro/global/instanceTemplates/reeditpro-a100-ultra',
    allowedZones: ['us-central1-a', 'us-central1-c'],
    localScratchDeviceName: 'reeditpro-a100-scratch' as const,
    localScratchMountPath: '/mnt/disks/reeditpro-a100-scratch' as const,
    installGpuDriversAtJobStart: false as const,
  }
  return {
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  }
}

function buildSam31L4Release(): CanonicalProfessionalGoogleCloudGpuRelease {
  const payload = {
    schemaVersion:
      'canonical-professional-google-cloud-gpu-release-v2' as const,
    source:
      'canonical_server_professional_google_cloud_gpu_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseRef: sam31L4ReleaseRef,
    fixedServerTaskContractRef:
      sam31L4Target.fixedServerTaskContractRef,
    serviceIdentityRef: sam31L4Target.serviceIdentityRef,
    privateNetworkAndArtifactTransportRef:
      sam31L4Target.privateNetworkAndArtifactTransportRef,
    toolId: sam31L4Admission.toolId,
    operationId: sam31L4Admission.operationId,
    routeId: 'l4_heavy_fallback' as const,
    projectId: 'reeditpro' as const,
    runtimeRegion: 'europe-west4' as const,
    serviceAccountEmail:
      'reeditpro-professional-gpu@reeditpro.iam.gserviceaccount.com',
    immutableImageUri:
      `europe-west4-docker.pkg.dev/reeditpro/gpu/sam3-1@sha256:${sam31L4ImageRaw}`,
    immutableImageRef: sam31L4ImageRef,
    immutableImageDigest: sam31L4ImageRef.contentHash,
    maximumExecutionSeconds: 1_200,
    taskCount: 1 as const,
    taskParallelism: 1 as const,
    maximumTaskRetries: 0 as const,
    invocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID' as const,
    acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS' as const,
    privateExecutionEnvelopeRereadRequired: true as const,
    runtimeDownloadAllowed: false as const,
    callerCommandImageModelPathUrlOrEnvironmentAccepted: false as const,
    externalIpAllowed: false as const,
    privateNetworkOnly: true as const,
    minimumIdleInstances: 0 as const,
    prewarmingOrKeepaliveAllowed: false as const,
    oneConsumedAdmissionCreatesAtMostOneJob: true as const,
    retryAfterUnknownCreateOutcomeAllowed: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedLocalScratchGiB: 0 as const,
    cloudRunJobResource:
      'projects/reeditpro/locations/europe-west4/jobs/reeditpro-sam31-l4-fallback',
    configuredMinimumInstances: 0 as const,
    configuredMaximumInstances: 4,
    configuredGpuType: 'nvidia-l4' as const,
    configuredGpuCount: 1 as const,
    gpuZonalRedundancyDisabled: true as const,
  }
  return {
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  }
}

function buildL4Release(): CanonicalProfessionalGoogleCloudGpuRelease {
  const payload = {
    schemaVersion:
      'canonical-professional-google-cloud-gpu-release-v2' as const,
    source:
      'canonical_server_professional_google_cloud_gpu_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseRef: l4ReleaseRef,
    fixedServerTaskContractRef: l4Target.fixedServerTaskContractRef,
    serviceIdentityRef: l4Target.serviceIdentityRef,
    privateNetworkAndArtifactTransportRef:
      l4Target.privateNetworkAndArtifactTransportRef,
    toolId: l4Admission.toolId,
    operationId: l4Admission.operationId,
    routeId: 'l4_standard_primary' as const,
    projectId: 'reeditpro' as const,
    runtimeRegion: 'us-central1' as const,
    serviceAccountEmail:
      'reeditpro-professional-gpu@reeditpro.iam.gserviceaccount.com',
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/gpu/ffmpeg-l4@sha256:${l4ImageRaw}`,
    immutableImageRef: l4ImageRef,
    immutableImageDigest: l4ImageRef.contentHash,
    maximumExecutionSeconds: 900,
    taskCount: 1 as const,
    taskParallelism: 1 as const,
    maximumTaskRetries: 0 as const,
    invocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID' as const,
    acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS' as const,
    privateExecutionEnvelopeRereadRequired: true as const,
    runtimeDownloadAllowed: false as const,
    callerCommandImageModelPathUrlOrEnvironmentAccepted: false as const,
    externalIpAllowed: false as const,
    privateNetworkOnly: true as const,
    minimumIdleInstances: 0 as const,
    prewarmingOrKeepaliveAllowed: false as const,
    oneConsumedAdmissionCreatesAtMostOneJob: true as const,
    retryAfterUnknownCreateOutcomeAllowed: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedLocalScratchGiB: 0 as const,
    cloudRunJobResource:
      'projects/reeditpro/locations/us-central1/jobs/reeditpro-professional-l4',
    configuredMinimumInstances: 0 as const,
    configuredMaximumInstances: 8,
    configuredGpuType: 'nvidia-l4' as const,
    configuredGpuCount: 1 as const,
    gpuZonalRedundancyDisabled: true as const,
  }
  return {
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  }
}

function buildAdmission(input: {
  admissionId: string
  toolId: 'sam3_1' | 'ffmpeg' | 'kornia'
  operationId: string
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary'
  releaseRef: ReturnType<typeof ref>
}) {
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-dispatch-admission-v1' as const,
    source: 'canonical_server_professional_gpu_dispatch_owner' as const,
    admissionId: input.admissionId,
    toolId: input.toolId,
    operationId: input.operationId,
    routeId: input.routeId,
    scope: {
      ownerUserId: 'owner-user-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      editSessionId: 'edit-session-1',
      editPlanId: 'edit-plan-1',
      editPlanVersion: 1,
      approvedSnapshotRef: ref('approved-snapshot-1'),
      confirmedOutputFrameRef: ref('confirmed-frame-1'),
      masterTimingRef: ref('master-timing-1'),
      approvedWorkItemRef: ref(`${input.admissionId}-work`),
      workerLeaseRef: ref(`${input.admissionId}-lease`),
      fundedReservationRef: ref(`${input.admissionId}-reservation`),
      userApprovalRecordRef: ref(`${input.admissionId}-approval`),
      userTriggerRecordRef: ref(`${input.admissionId}-trigger`),
      executionAttemptRef: ref(`${input.admissionId}-attempt`),
      idempotencyKey: `${input.admissionId}.idempotency`,
    },
    estimateRef: ref(`${input.admissionId}-estimate`),
    estimateMaximumReservedToolCostCredits: 100,
    currentRateAuthorityRef: ref(`${input.admissionId}-current-rate`),
    placementPolicyRef: {
      schemaVersion:
        'canonical-quality-first-professional-tool-gpu-placement-v1' as const,
      policyHash: sha('placement-policy'),
      entryHash: sha(`${input.toolId}-placement`),
    },
    gpuPolicyRef: {
      schemaVersion:
        'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v3' as const,
      policyHash: sha('gpu-policy'),
    },
    runtimeReleaseRef: input.releaseRef,
    priorPrimaryTerminalReceiptRef:
      input.routeId === 'l4_heavy_fallback'
        ? ref(`${input.admissionId}-a100-terminal`)
        : null,
    priorPrimaryFailureClass: input.routeId === 'l4_heavy_fallback'
      ? 'a100_capacity_unavailable_before_attempt_start' as const
      : 'not_applicable' as const,
    priorPrimaryOutcomeKnownNotExecuted:
      input.routeId === 'l4_heavy_fallback',
    admittedAttemptOrdinal:
      input.routeId === 'l4_heavy_fallback' ? 2 as const : 1 as const,
    callerSelectedRouteImageModelOrCommand: false as const,
    exactCurrentRateEstimateApprovalReservationAndReleaseReread:
      true as const,
    exactApprovedUserTriggerAndIdempotencyReread: true as const,
    actualGpuEvidenceRequiredFromTerminalResult: true as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    gpuHostCpuOnlyExecutionMaySatisfyAdmission: false as const,
    unknownPriorOutcomeMayRetryOrFallback: false as const,
    createOnlyDurableConsumptionRequiredBeforeJobCreation: true as const,
    userTriggeredScaleFromZero: true as const,
    noApprovedAttemptMeansZeroGpuInstances: true as const,
    minimumIdleInstances: 0 as const,
    stopAtTerminalAttempt: true as const,
    workDispatched: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    admittedAt: '2026-08-02T16:59:00.000Z',
    expiresAt: '2026-08-02T18:00:00.000Z',
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function sha(value: string): string {
  return sha256AuthorityValue(value)
}

function evidenceRef(id: string, rawHash: string) {
  return { id, version: 1, contentHash: `sha256:${rawHash}` as const }
}

function ref(id: string) {
  return evidenceRef(id, sha(id))
}

function requireCapturedRequest(
  value: Record<string, unknown> | null,
): Record<string, unknown> {
  assert.ok(value)
  return value
}
