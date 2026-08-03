import assert from 'node:assert/strict'

import type { GoogleAuth } from 'google-auth-library'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalA100BatchReleaseObservation,
  createCanonicalA100BatchReleaseObservation,
  createGoogleBatchA100JobInvocationPort,
} from '../services/canonical-a100-batch-job-invocation-service'

const HASH = {
  a: 'a'.repeat(64),
  b: 'b'.repeat(64),
  c: 'c'.repeat(64),
  d: 'd'.repeat(64),
  e: 'e'.repeat(64),
  f: 'f'.repeat(64),
  one: '1'.repeat(64),
  two: '2'.repeat(64),
} as const

const ref = (id: string, hash: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${hash}` as const,
})

const release = createCanonicalA100BatchReleaseObservation({
  releaseRef: ref('a100-transcript-release-2026-08-02', HASH.a),
  runtimeRegion: 'us-central1',
  batchInstanceTemplateResource:
    'projects/reeditpro/global/instanceTemplates/reeditpro-source-transcript-a100-v1',
  batchInstanceTemplateRef: ref('a100-instance-template-v1', HASH.b),
  runtimeImageUri:
    `us-central1-docker.pkg.dev/reeditpro/gpu-workers/source-transcript-a100@sha256:${HASH.c}`,
  runtimeImageRef: ref('source-transcript-a100-image-v1', HASH.c),
  cudaRuntimeRef: ref('cuda-runtime-12-8-v1', HASH.d),
  gpuDriverRuntimeRef: ref('nvidia-driver-a100-qualified-v1', HASH.e),
  gpuDriverVersion: '570.195.03',
  modelArtifactImageRef: ref('faster-whisper-large-v3-image-v1', HASH.f),
  modelManifestRef: ref('faster-whisper-source-model-v1', HASH.two),
  modelDigestSha256: `sha256:${HASH.two}`,
  runtimeQualificationEvidenceRef: ref(
    'a100-runtime-private-qualification-v1', HASH.a,
  ),
  modelArtifactQualificationEvidenceRef: ref(
    'large-v3-private-qualification-v1', HASH.b,
  ),
  instanceTemplateQualificationEvidenceRef: ref(
    'a100-instance-template-private-qualification-v1', HASH.c,
  ),
  privateSecurityReviewRef: ref('a100-private-security-review-v1', HASH.d),
  privateLicenseReviewRef: ref('large-v3-private-license-review-v1', HASH.e),
  lifecycleBucketName: 'reeditpro-source-analysis-lifecycle-us',
  privateArtifactBucketName: 'reeditpro-source-analysis-private-us',
  maximumExecutionSeconds: 480,
})
const consumptionRef = ref('a100-dispatch-consumption-001', HASH.one)

const calls: Array<Record<string, unknown>> = []
let jobResource = ''
let poll = 0
const auth = {
  async request(request: Record<string, unknown>) {
    calls.push(structuredClone(request))
    if (request.method === 'POST') {
      const params = request.params as { jobId: string; requestId: string }
      assert.match(params.requestId,
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u)
      jobResource = `projects/reeditpro/locations/us-central1/jobs/${params.jobId}`
      return { data: job('QUEUED') }
    }
    poll += 1
    return { data: job(poll === 1 ? 'RUNNING' : 'SUCCEEDED') }
  },
} as unknown as Pick<GoogleAuth, 'request'>

const port = createGoogleBatchA100JobInvocationPort({
  auth,
  pollMilliseconds: 1,
  sleep: async () => undefined,
})
const result = await port.runOnce({
  invocationId: 'tom-source-two-transcript-a100-001',
  release,
  durableDispatchConsumptionRef: consumptionRef,
  durableDispatchConsumptionRereadVerified: true,
})

assert.equal(result.terminalState, 'SUCCEEDED')
assert.deepEqual(result.observedStateSequence, ['QUEUED', 'RUNNING', 'SUCCEEDED'])
assert.equal(result.runDuration, '73.125s')
assert.equal(result.maximumTaskRetries, 0)
assert.equal(result.customerCreditMutated, false)
assert.equal(result.retryAfterUnknownCreateOutcomeAllowed, false)
assert.equal(result.serverOwnedFixedRuntimeEnvironmentBound, true)
assert.deepEqual(result.durableDispatchConsumptionRef, consumptionRef)
assert.equal(calls.length, 3)
assert.equal(calls.every((call) => call.timeout === 30_000), true)
assert.equal(calls.every((call) => call.maxRedirects === 0), true)
assert.equal(calls.every((call) => call.retry === false), true)

const createCall = calls[0]
assert.equal(createCall.method, 'POST')
assert.equal(createCall.url,
  'https://batch.googleapis.com/v1/projects/reeditpro/locations/us-central1/jobs')
const createBody = createCall.data as Record<string, unknown>
assert.equal('name' in createBody, false, 'Batch job name is output-only')
assert.equal(createBody.priority, '99')
const taskGroup = (createBody.taskGroups as Array<Record<string, unknown>>)[0]
assert.equal(taskGroup.taskCount, '1')
assert.equal(taskGroup.parallelism, '1')
assert.equal(taskGroup.runAsNonRoot, true)
const taskSpec = taskGroup.taskSpec as Record<string, unknown>
assert.equal(taskSpec.maxRetryCount, 0)
assert.equal(taskSpec.maxRunDuration, '480s')
assert.deepEqual(taskSpec.computeResource, {
  cpuMilli: '12000',
  memoryMib: '174080',
})
assert.deepEqual(taskSpec.environment, {
  variables: {
    REEDITPRO_SOURCE_TRANSCRIPT_A100_INVOCATION_ID:
      'tom-source-two-transcript-a100-001',
    REEDITPRO_SOURCE_TRANSCRIPT_A100_LIFECYCLE_BUCKET:
      release.lifecycleBucketName,
    REEDITPRO_SOURCE_TRANSCRIPT_A100_RELEASE_DIGEST_SHA256:
      release.observationDigestSha256,
    REEDITPRO_SOURCE_TRANSCRIPT_A100_RUNTIME_REGION: 'us-central1',
  },
})
assert.deepEqual(taskSpec.volumes, [{
  deviceName: 'reeditpro-a100-scratch',
  mountPath: '/mnt/disks/reeditpro-a100-scratch',
  mountOptions: 'rw,async',
}])
assert.equal(JSON.stringify(createBody).includes('secretVariables'), false)
assert.equal(JSON.stringify(createBody).includes('storagePath'), false)
assert.equal(JSON.stringify(createBody).includes('sourceBytes'), false)
assert.equal(JSON.stringify(createBody).includes('nvidia_l4'), false)
assert.equal(JSON.stringify(createBody).includes('cpu_fallback'), false)
const allocation = createBody.allocationPolicy as Record<string, unknown>
assert.deepEqual(allocation.location, {
  allowedLocations: ['zones/us-central1-a', 'zones/us-central1-c'],
})
assert.deepEqual(allocation.instances, [{
  instanceTemplate:
    'projects/reeditpro/global/instanceTemplates/reeditpro-source-transcript-a100-v1',
  installGpuDrivers: false,
  installOpsAgent: false,
  blockProjectSshKeys: true,
}])
assert.deepEqual(allocation.serviceAccount, {
  email: 'reeditpro-source-transcript-a100@reeditpro.iam.gserviceaccount.com',
})

const tampered = structuredClone(release)
tampered.allowedZones = ['europe-west4-a']
assert.throws(
  () => assertCanonicalA100BatchReleaseObservation(tampered),
  /A100 release lost exact region|immutable release/u,
)

let createFailureCalls = 0
const createFailurePort = createGoogleBatchA100JobInvocationPort({
  auth: {
    async request() {
      createFailureCalls += 1
      throw new Error('simulated connection ambiguity')
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  pollMilliseconds: 1,
  sleep: async () => undefined,
})
await assert.rejects(
  createFailurePort.runOnce({
    invocationId: 'tom-source-two-transcript-a100-create-unknown',
    release,
    durableDispatchConsumptionRef: consumptionRef,
    durableDispatchConsumptionRereadVerified: true,
  }),
  (error: unknown) => unknownAndNotRetryable(
    error,
    'a100_batch_create_outcome_unknown',
  ),
)
assert.equal(createFailureCalls, 1, 'unknown create outcome must not retry')

let pollFailureCalls = 0
const pollFailurePort = createGoogleBatchA100JobInvocationPort({
  auth: {
    async request(request: Record<string, unknown>) {
      pollFailureCalls += 1
      if (request.method === 'POST') {
        const params = request.params as { jobId: string }
        jobResource = `projects/reeditpro/locations/us-central1/jobs/${params.jobId}`
        return { data: job('QUEUED') }
      }
      throw new Error('simulated poll ambiguity')
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  pollMilliseconds: 1,
  sleep: async () => undefined,
})
await assert.rejects(
  pollFailurePort.runOnce({
    invocationId: 'tom-source-two-transcript-a100-poll-unknown',
    release,
    durableDispatchConsumptionRef: consumptionRef,
    durableDispatchConsumptionRereadVerified: true,
  }),
  (error: unknown) => unknownAndNotRetryable(
    error,
    'a100_batch_poll_outcome_unknown',
  ),
)
assert.equal(pollFailureCalls, 2, 'unknown poll outcome must not redispatch')

let failedJobResource = ''
const failedPort = createGoogleBatchA100JobInvocationPort({
  auth: {
    async request(request: Record<string, unknown>) {
      const params = request.params as { jobId?: string } | undefined
      if (request.method === 'POST') {
        failedJobResource = `projects/reeditpro/locations/us-central1/jobs/${params?.jobId}`
        return { data: failedJob('FAILED') }
      }
      throw new Error('failed job must already be terminal')
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  pollMilliseconds: 1,
})
const failed = await failedPort.runOnce({
  invocationId: 'tom-source-two-transcript-a100-failed',
  release,
  durableDispatchConsumptionRef: consumptionRef,
  durableDispatchConsumptionRereadVerified: true,
})
assert.equal(failed.terminalState, 'FAILED')
assert.equal(failed.runDuration, '12.5s')
assert.deepEqual(failed.observedStateSequence, ['FAILED'])

let reconciliationPostCount = 0
let reconciliationReadCount = 0
const reconciliationPort = createGoogleBatchA100JobInvocationPort({
  auth: {
    async request(request: Record<string, unknown>) {
      if (request.method === 'POST') reconciliationPostCount += 1
      reconciliationReadCount += 1
      const resource = String(request.url).replace(
        'https://batch.googleapis.com/v1/',
        '',
      )
      return {
        data: {
          name: resource,
          uid: 'batch-job-uid-reconciled-001',
          status: {
            state: reconciliationReadCount === 1 ? 'RUNNING' : 'SUCCEEDED',
            ...(reconciliationReadCount === 1
              ? {}
              : { runDuration: '74s' }),
          },
        },
      }
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  pollMilliseconds: 1,
  sleep: async () => undefined,
})
const reconciled = await reconciliationPort.reconcileExisting({
  invocationId: 'tom-source-two-transcript-a100-reconcile',
  release,
  durableDispatchConsumptionRef: consumptionRef,
  durableDispatchConsumptionRereadVerified: true,
})
assert.equal(reconciled.terminalState, 'SUCCEEDED')
assert.equal(reconciliationPostCount, 0)
assert.equal(reconciliationReadCount, 2)

const europeRelease = createCanonicalA100BatchReleaseObservation({
  releaseRef: ref('a100-transcript-release-eu-2026-08-02', HASH.two),
  runtimeRegion: 'europe-west4',
  batchInstanceTemplateResource:
    'projects/reeditpro/global/instanceTemplates/reeditpro-source-transcript-a100-eu-v1',
  batchInstanceTemplateRef: ref('a100-instance-template-eu-v1', HASH.b),
  runtimeImageUri:
    `europe-west4-docker.pkg.dev/reeditpro/gpu-workers/source-transcript-a100@sha256:${HASH.c}`,
  runtimeImageRef: ref('source-transcript-a100-image-eu-v1', HASH.c),
  cudaRuntimeRef: ref('cuda-runtime-12-8-eu-v1', HASH.d),
  gpuDriverRuntimeRef: ref('nvidia-driver-a100-qualified-eu-v1', HASH.e),
  gpuDriverVersion: '570.195.03',
  modelArtifactImageRef: ref(
    'faster-whisper-large-v3-image-eu-v1', HASH.f,
  ),
  modelManifestRef: ref('faster-whisper-source-model-eu-v1', HASH.two),
  modelDigestSha256: `sha256:${HASH.two}`,
  runtimeQualificationEvidenceRef: ref(
    'a100-runtime-private-qualification-eu-v1', HASH.a,
  ),
  modelArtifactQualificationEvidenceRef: ref(
    'large-v3-private-qualification-eu-v1', HASH.b,
  ),
  instanceTemplateQualificationEvidenceRef: ref(
    'a100-instance-template-private-qualification-eu-v1', HASH.c,
  ),
  privateSecurityReviewRef: ref(
    'a100-private-security-review-eu-v1', HASH.d,
  ),
  privateLicenseReviewRef: ref(
    'large-v3-private-license-review-eu-v1', HASH.e,
  ),
  lifecycleBucketName: 'reeditpro-source-analysis-lifecycle-eu',
  privateArtifactBucketName: 'reeditpro-source-analysis-private-eu',
  maximumExecutionSeconds: 480,
})
assert.deepEqual(europeRelease.allowedZones, ['europe-west4-a'])

console.log(JSON.stringify({
  a100BatchCreateWireVerified: true,
  a2UltraOneGpuTaskVerified: true,
  exactUsZonesVerified: true,
  exactEuropeZoneVerified: true,
  immutableImageTemplateModelLineageVerified: true,
  taskRetries: result.maximumTaskRetries,
  durableConsumptionRequiredBeforeCreate: true,
  unknownCreateOutcomeRetryPrevented: true,
  unknownPollOutcomeRedispatchPrevented: true,
  restartSafeReadOnlyReconciliationVerified: true,
  terminalFailedJobNotMisclassifiedAsSafeFallback: true,
  customerCreditMutated: result.customerCreditMutated,
}))

function job(state: 'QUEUED' | 'RUNNING' | 'SUCCEEDED') {
  return {
    name: jobResource,
    uid: 'batch-job-uid-001',
    status: {
      state,
      ...(state === 'SUCCEEDED' ? { runDuration: '73.125s' } : {}),
    },
  }
}

function failedJob(state: 'FAILED') {
  return {
    name: failedJobResource,
    uid: 'batch-job-uid-failed-001',
    status: { state, runDuration: '12.5s' },
  }
}

function unknownAndNotRetryable(
  error: unknown,
  requiredGate: string,
): boolean {
  assert.ok(error instanceof ApiError)
  assert.equal(error.code, 'JOB_DEPENDENCY_NOT_READY')
  assert.equal(error.status, 503)
  assert.deepEqual(error.details, {
    requiredGate,
    retryAllowed: false,
    fallbackAllowed: false,
  })
  return true
}
