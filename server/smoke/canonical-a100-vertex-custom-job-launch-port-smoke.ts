import assert from 'node:assert/strict'

import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
  CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION,
  createCanonicalA100VertexCustomJobLaunchPort,
  type CanonicalA100VertexCustomJobLaunchAuthority,
  type CanonicalA100VertexCustomJobRelease,
} from '../services/canonical-a100-vertex-custom-job-launch-port'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const NOW = '2026-08-06T18:00:00.000Z'
const IMAGE_DIGEST = sha('sam31-vertex-a100-image')
const RATE_REF = ref('vertex-a100-rate-authority')
const RELEASE_REF = ref('vertex-a100-release')

const release = buildRelease()
const authority = buildAuthority()
const sequence: string[] = []
let observedRequest: Record<string, unknown> | null = null
let persistedExecution: Record<string, unknown> | null = null
const launchPort = createCanonicalA100VertexCustomJobLaunchPort({
  consumptionPort: {
    async consumeCreateOnlyAndReread(record) {
      sequence.push('consumed')
      return structuredClone(record)
    },
  },
  executionRepository: {
    async createOnlyAndReread(record) {
      sequence.push('persisted')
      persistedExecution = structuredClone(record)
      return structuredClone(record)
    },
  },
  auth: {
    async request(request) {
      sequence.push('provider')
      observedRequest = structuredClone(request as Record<string, unknown>)
      const body = request.data as { displayName: string }
      return {
        data: {
          name: 'projects/reeditpro/locations/us-central1/customJobs/12345',
          displayName: body.displayName,
          state: 'JOB_STATE_PENDING',
        },
      } as never
    },
  },
  now: () => NOW,
})

const result = await launchPort.startOneShotJob({ authority, release })
assert.equal(result.disposition, 'accepted')
assert.deepEqual(sequence, ['consumed', 'provider', 'persisted'])
assert.ok(result.consumptionRef)
assert.ok(result.customJobExecutionRef)
assert.ok(persistedExecution)
assert.equal(
  (persistedExecution as Record<string, unknown>).customJobResourceName,
  'projects/reeditpro/locations/us-central1/customJobs/12345',
)
assert.equal(result.minimumIdleInstances, 0)
assert.equal(result.persistentEndpointCreated, false)
assert.equal(result.automaticRetryAllowed, false)
assert.equal(result.exactTerminalRereadRequired, true)
assert.equal(result.exactUsageAndAccountEffectiveCostRereadRequired, true)

const request = requireRequest(observedRequest)
assert.equal(
  request.url,
  'https://us-central1-aiplatform.googleapis.com/v1/projects/reeditpro/locations/us-central1/customJobs',
)
assert.equal(request.method, 'POST')
assert.equal(request.retry, false)
assert.equal(request.maxRedirects, 0)
assert.equal(request.timeout, 15_000)
const body = request.data as Record<string, unknown>
const jobSpec = body.jobSpec as Record<string, unknown>
const workerPools = jobSpec.workerPoolSpecs as Array<Record<string, unknown>>
assert.equal(workerPools.length, 1)
const worker = workerPools[0]
const machine = worker.machineSpec as Record<string, unknown>
assert.equal(machine.machineType, 'a2-ultragpu-1g')
assert.equal(machine.acceleratorType, 'NVIDIA_A100_80GB')
assert.equal(machine.acceleratorCount, 1)
assert.equal(worker.replicaCount, '1')
assert.deepEqual(worker.diskSpec, {
  bootDiskType: 'pd-ssd',
  bootDiskSizeGb: 200,
})
const container = worker.containerSpec as Record<string, unknown>
assert.equal(
  container.imageUri,
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/weeditpro-sam31@sha256:${IMAGE_DIGEST}`,
)
assert.deepEqual(container.env, [
  {
    name: 'WEEDITPRO_GPU_INVOCATION_ID',
    value: authority.executionEnvelopeRef.id,
  },
  {
    name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
    value: 'nvidia_a100_80gb',
  },
])
assert.equal('command' in container, false)
assert.equal('args' in container, false)
assert.equal(jobSpec.serviceAccount, 'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(
  jobSpec.network,
  'projects/390722338345/global/networks/weeditpro-gpu-private',
)
assert.deepEqual(jobSpec.scheduling, {
  timeout: '3600s',
  restartJobOnWorkerRestart: false,
})
assert.equal('persistentResourceId' in jobSpec, false)
assert.equal('enableWebAccess' in jobSpec, false)
assert.deepEqual(body.encryptionSpec, {
  kmsKeyName:
    'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
})
assert.equal(JSON.stringify(body).includes('sam2'), false)
assert.equal(JSON.stringify(body).includes('qwen'), false)

let consumptionFailureProviderCalls = 0
const consumptionFailure = await createCanonicalA100VertexCustomJobLaunchPort({
  consumptionPort: {
    async consumeCreateOnlyAndReread() {
      throw new Error('duplicate authority consumption')
    },
  },
  executionRepository: unreachableExecutionRepository(),
  auth: {
    async request() {
      consumptionFailureProviderCalls += 1
      throw new Error('must not call provider')
    },
  },
  now: () => NOW,
}).startOneShotJob({ authority, release })
assert.equal(consumptionFailure.disposition, 'rejected_before_creation')
assert.equal(consumptionFailure.consumptionRef, null)
assert.equal(consumptionFailure.providerCallStarted, false)
assert.equal(consumptionFailureProviderCalls, 0)

const unknown = await createCanonicalA100VertexCustomJobLaunchPort({
  consumptionPort: {
    async consumeCreateOnlyAndReread(record) {
      return structuredClone(record)
    },
  },
  executionRepository: unreachableExecutionRepository(),
  auth: {
    async request() {
      throw new Error('network outcome unavailable')
    },
  },
  now: () => NOW,
}).startOneShotJob({ authority, release })
assert.equal(unknown.disposition, 'outcome_unknown_requires_reconciliation')
assert.ok(unknown.consumptionRef)
assert.equal(unknown.providerCallStarted, true)
assert.equal(unknown.providerInferenceOrSubstantiveWorkKnownExecuted, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)

let tamperProviderCalls = 0
const tamperPort = createCanonicalA100VertexCustomJobLaunchPort({
  consumptionPort: {
    async consumeCreateOnlyAndReread(record) {
      return record
    },
  },
  executionRepository: unreachableExecutionRepository(),
  auth: {
    async request() {
      tamperProviderCalls += 1
      throw new Error('tampered release must not dispatch')
    },
  },
  now: () => NOW,
})
const tamperedReleaseResult = await tamperPort.startOneShotJob({
  authority,
  release: { ...release, quotaGrantedValue: 0 },
})
assert.equal(tamperedReleaseResult.disposition, 'rejected_before_creation')
const crossedRateResult = await tamperPort.startOneShotJob({
  authority: withHash({
    ...withoutHash(authority, 'authorityHash'),
    currentRateAuthorityRef: ref('another-rate'),
  }, 'authorityHash'),
  release,
})
assert.equal(crossedRateResult.disposition, 'rejected_before_creation')
const crossedReleaseResult = await tamperPort.startOneShotJob({
  authority: withHash({
    ...withoutHash(authority, 'authorityHash'),
    releaseRef: ref('another-release'),
  }, 'authorityHash'),
  release,
})
assert.equal(crossedReleaseResult.disposition, 'rejected_before_creation')
assert.equal(tamperProviderCalls, 0)

const persistenceFailure = await createCanonicalA100VertexCustomJobLaunchPort({
  consumptionPort: {
    async consumeCreateOnlyAndReread(record) {
      return structuredClone(record)
    },
  },
  executionRepository: {
    async createOnlyAndReread() {
      throw new Error('durable execution mapping unavailable')
    },
  },
  auth: {
    async request(request) {
      const requestBody = request.data as { displayName: string }
      return {
        data: {
          name: 'projects/reeditpro/locations/us-central1/customJobs/67890',
          displayName: requestBody.displayName,
          state: 'JOB_STATE_QUEUED',
        },
      } as never
    },
  },
  now: () => NOW,
}).startOneShotJob({ authority, release })
assert.equal(
  persistenceFailure.disposition,
  'outcome_unknown_requires_reconciliation',
)
assert.equal(persistenceFailure.automaticRetryAllowed, false)

let getterInvoked = false
const hostile = Object.create(null) as Record<string, unknown>
Object.defineProperty(hostile, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    return CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION
  },
})
const hostileResult = await tamperPort.startOneShotJob({
  authority: hostile,
  release,
})
assert.equal(hostileResult.disposition, 'rejected_before_creation')
assert.equal(getterInvoked, false)
assert.equal(tamperProviderCalls, 0)

console.log(JSON.stringify({
  schemaVersion: 'canonical-a100-vertex-custom-job-launch-port-smoke-v1',
  checks: {
    approvedVertexA10080QuotaBound: true,
    oneWorkerPoolAndReplica: true,
    immutableImageOnly: true,
    privateVpcAndCmekBound: true,
    scaleFromZeroNoPersistentEndpoint: true,
    consumptionBeforeProvider: true,
    providerResourcePersistedAndReread: true,
    persistenceFailureRequiresReconciliation: true,
    duplicateConsumptionRejectedBeforeProvider: true,
    unknownOutcomeRetryForbidden: true,
    tamperAndHostileInputFailClosed: true,
    accountEffectiveTerminalCostRereadRequired: true,
  },
}, null, 2))

function buildRelease(): CanonicalA100VertexCustomJobRelease {
  return withHash({
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION,
    source: 'canonical_server_a100_vertex_custom_job_release_registry',
    evidenceClass: 'canonical_private_reread',
    releaseRef: RELEASE_REF,
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    projectId: 'reeditpro',
    region: 'us-central1',
    customJobParent: 'projects/reeditpro/locations/us-central1',
    serviceAccountEmail:
      'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com',
    serviceIdentityRef: ref('vertex-a100-service-identity'),
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/weeditpro-sam31@sha256:${IMAGE_DIGEST}`,
    immutableImageRef: {
      id: 'vertex-a100-image',
      version: 1,
      contentHash: `sha256:${IMAGE_DIGEST}`,
    },
    immutableImageDigest: `sha256:${IMAGE_DIGEST}`,
    imageSupplyChainReleaseRef: ref('vertex-a100-image-supply-chain'),
    sourceCheckpointQualificationRef: ref('sam31-checkpoint-qualification'),
    privateArtifactTransportRef: ref('sam31-private-artifact-transport'),
    privateNetworkPeeringQualificationRef: ref('vertex-private-peering'),
    networkResource:
      'projects/390722338345/global/networks/weeditpro-gpu-private',
    encryptionKeyResource:
      'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
    currentRateAuthorityRef: RATE_REF,
    quotaPreferenceObservationRef: ref('vertex-a100-quota-observation'),
    quotaPreferenceId: 'weeditpro-vertex-a100-80gb-us-central1-1',
    quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
    quotaPreferredValue: 1,
    quotaGrantedValue: 1,
    quotaReconciling: false,
    machineType: 'a2-ultragpu-1g',
    acceleratorType: 'NVIDIA_A100_80GB',
    acceleratorCount: 1,
    replicaCount: 1,
    bootDiskType: 'pd-ssd',
    bootDiskSizeGb: 200,
    maximumExecutionSeconds: 3_600,
    persistentResourceAllowed: false,
    persistentEndpointAllowed: false,
    publicIpExecutionAllowed: false,
    privateIpAndVPCPeeringRequired: true,
    runtimeNetworkDownloadAllowed: false,
    callerImageCommandArgsEnvironmentOrModelSelectionAllowed: false,
    containerEntrypointFromImmutableImageOnly: true,
    oneWorkerPoolOnly: true,
    oneReplicaOnly: true,
    restartJobOnWorkerRestart: false,
    automaticRetryAllowed: false,
    minimumIdleInstances: 0,
    startsOnlyFromDurablyConsumedApprovedAuthority: true,
    stopsAtTerminalAttempt: true,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: '2026-08-06T17:00:00.000Z',
    expiresAt: '2026-08-07T17:00:00.000Z',
  }, 'configurationHash')
}

function buildAuthority(): CanonicalA100VertexCustomJobLaunchAuthority {
  return withHash({
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
    source: 'canonical_professional_gpu_dispatch_owner',
    authorityId: 'vertex-a100-authority-1',
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    releaseRef: RELEASE_REF,
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    approvedSnapshotRef: ref('approved-snapshot'),
    confirmedOutputFrameRef: ref('confirmed-output-frame'),
    masterTimingRef: ref('master-timing'),
    approvedWorkItemRef: ref('approved-work-item'),
    workerLeaseRef: ref('worker-lease'),
    fundedReservationRef: ref('funded-reservation'),
    approvedEstimateRef: ref('approved-estimate'),
    userApprovalRecordRef: ref('user-approval'),
    userTriggerRecordRef: ref('user-trigger'),
    executionAttemptRef: ref('execution-attempt'),
    executionEnvelopeRef: ref('execution-envelope'),
    currentRateAuthorityRef: RATE_REF,
    maximumReservedToolCostCredits: 500,
    exactSnapshotWorkLeaseReservationTriggerReleaseAndRateReread: true,
    createOnlyDurableConsumptionRequiredBeforeProviderCall: true,
    oneAuthorityMayCreateAtMostOneCustomJob: true,
    retryAfterUnknownCreateOutcomeAllowed: false,
    userTriggeredScaleFromZero: true,
    noApprovedAuthorityMeansZeroGpuJobs: true,
    callerImageCommandArgsEnvironmentOrModelAccepted: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: '2026-08-06T17:30:00.000Z',
    expiresAt: '2026-08-06T19:00:00.000Z',
  }, 'authorityHash')
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha(id)}` as const,
  }
}

function sha(value: string): string {
  return sha256AuthorityValue({ value })
}

function withoutHash<T extends Record<string, unknown>, K extends keyof T>(
  record: T,
  key: K,
): Omit<T, K> {
  const clone = { ...record }
  delete clone[key]
  return clone
}

function withHash<
  T extends Record<string, unknown>,
  K extends 'configurationHash' | 'authorityHash',
>(payload: T, key: K): T & Record<K, string> {
  return {
    ...payload,
    [key]: sha256AuthorityValue(payload),
  } as T & Record<K, string>
}

function requireRequest(
  value: Record<string, unknown> | null,
): Record<string, unknown> {
  assert.ok(value)
  return value
}

function unreachableExecutionRepository() {
  return {
    async createOnlyAndReread(): Promise<never> {
      throw new Error('execution persistence must not be reached')
    },
  }
}
