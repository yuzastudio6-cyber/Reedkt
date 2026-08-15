import assert from 'node:assert/strict'

import {
  assertCanonicalProfessionalGpuTerminalObservation,
  canonicalProfessionalGpuJobLaunchSchema,
  recordCanonicalProfessionalGpuJobTerminal,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobLifecycleStore,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createGoogleCloudProfessionalGpuTerminalObservationPort,
  type CanonicalProfessionalGoogleCloudGpuExecutionBinding,
  type CanonicalProfessionalGpuTerminalCostEvidence,
} from '../services/canonical-professional-google-cloud-gpu-terminal-observation-port'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const a100Launch = buildLaunch({
  launchRecordId: 'sam31-a100-launch-terminal-smoke',
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.segment_and_track_subject.v1',
  routeId: 'a100_80gb_heavy_primary',
  executionTarget: 'google_cloud_batch_a2_ultra_job',
  accelerator: 'nvidia_a100_80gb',
  cloudJobExecutionId: 'sam31-a100-cloud-execution',
  launchedAt: '2026-08-02T18:00:00.000Z',
})
const a100Binding = buildA100Binding(a100Launch)
const a100Requests: Array<Record<string, unknown>> = []
let a100CostReads = 0
const a100TerminalPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(a100Binding)
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence(input) {
      a100CostReads += 1
      assert.equal(input.terminalOutcome, 'completed')
      return buildCostEvidence({
        launch: input.launch,
        cloudProviderTerminalRef: input.cloudProviderTerminalRef,
        outcome: 'executed',
        observedAt: '2026-08-02T18:04:59.000Z',
      })
    },
  },
  auth: {
    async request(input) {
      a100Requests.push(structuredClone(input as Record<string, unknown>))
      return {
        data: {
          name: a100Binding.providerJobResource,
          uid: a100Binding.providerJobUid,
          status: {
            state: 'SUCCEEDED',
            runDuration: '299.125s',
          },
        },
      } as never
    },
  },
  now: () => '2026-08-02T18:05:00.000Z',
})

const a100Observation = assertCanonicalProfessionalGpuTerminalObservation(
  await a100TerminalPort
    .rereadTerminalUsagePriceAndCost({ launch: a100Launch }),
)
assert.equal(a100Observation.terminalOutcome, 'completed')
assert.equal(
  a100Observation.providerInferenceOrSubstantiveWorkOutcome,
  'executed',
)
assert.equal(a100Observation.workerStoppedVerified, true)
assert.equal(a100Observation.activeGpuInstancesAfterTerminalObservation, 0)
assert.notEqual(
  a100Observation.cloudCapacityTeardownObservationRef.id,
  a100Observation.cloudTerminalObservationRef.id,
)
assert.equal(a100CostReads, 1)
assert.equal(a100Requests.length, 1)
assert.equal(
  a100Requests[0]?.url,
  'https://batch.googleapis.com/v1/'
    + a100Binding.providerJobResource,
)
assert.equal(a100Requests[0]?.method, 'GET')
assert.equal(a100Requests[0]?.retry, false)
assert.equal(a100Requests[0]?.maxRedirects, 0)

const terminalRecords = new Map<string, unknown>()
const lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore = {
  async consumeAdmissionCreateOnly() {
    throw new Error('Terminal proof must not consume another admission.')
  },
  async createExecutionEnvelopeOnly() {
    throw new Error('Terminal proof must not create another envelope.')
  },
  async rereadExecutionEnvelope() {
    throw new Error('Terminal proof must not reread an execution envelope.')
  },
  async createLaunchRecordOnly() {
    throw new Error('Terminal proof must not create another launch.')
  },
  async createTerminalRecordOnly({ record }) {
    if (terminalRecords.has(record.terminalRecordId)) return 'already_exists'
    terminalRecords.set(record.terminalRecordId, structuredClone(record))
    return 'created'
  },
}
const a100TerminalRecord = await recordCanonicalProfessionalGpuJobTerminal({
  terminalRecordId: 'sam31-a100-terminal-record',
  launch: a100Launch,
  terminalObservationPort: a100TerminalPort,
  store: lifecycleStore,
})
assert.equal(a100TerminalRecord.terminalOutcome, 'completed')
assert.equal(a100TerminalRecord.workerStoppedVerified, true)
assert.equal(a100TerminalRecord.activeGpuInstancesAfterTerminalObservation, 0)
assert.equal(a100TerminalRecord.minimumIdleInstances, 0)
assert.equal(a100TerminalRecord.unknownOutcomeBlocksRetry, false)
assert.equal(a100TerminalRecord.customerWalletOrLedgerMutated, false)

const l4Launch = buildLaunch({
  launchRecordId: 'ffmpeg-l4-launch-terminal-smoke',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.professional_media_processing.v1',
  routeId: 'l4_standard_primary',
  executionTarget: 'google_cloud_run_l4_job',
  accelerator: 'nvidia_l4',
  cloudJobExecutionId: 'ffmpeg-l4-cloud-execution',
  launchedAt: '2026-08-02T18:10:00.000Z',
})
const l4Binding = buildL4Binding(l4Launch)
const l4Requests: Array<Record<string, unknown>> = []
const l4TerminalPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(l4Binding)
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence(input) {
      assert.equal(input.terminalOutcome, 'completed')
      return buildCostEvidence({
        launch: input.launch,
        cloudProviderTerminalRef: input.cloudProviderTerminalRef,
        outcome: 'executed',
        observedAt: '2026-08-02T18:11:59.000Z',
      })
    },
  },
  auth: {
    async request(input) {
      l4Requests.push(structuredClone(input as Record<string, unknown>))
      if (l4Requests.length === 1) return {
        data: {
          name: l4Binding.providerOperationResource,
          done: true,
          response: {
            name: `${l4Binding.expectedCloudRunJobResource}`
              + '/executions/execution-1',
          },
        },
      } as never
      return {
        data: {
          name: `${l4Binding.expectedCloudRunJobResource}`
            + '/executions/execution-1',
          uid: 'l4-execution-uid-1',
          completionTime: '2026-08-02T18:11:58.000Z',
          taskCount: 1,
          runningCount: 0,
          succeededCount: 1,
          failedCount: 0,
          cancelledCount: 0,
          conditions: [{
            type: 'Completed',
            state: 'CONDITION_SUCCEEDED',
          }],
        },
      } as never
    },
  },
  now: () => '2026-08-02T18:12:00.000Z',
})
const l4Observation = assertCanonicalProfessionalGpuTerminalObservation(
  await l4TerminalPort
    .rereadTerminalUsagePriceAndCost({ launch: l4Launch }),
)
assert.equal(l4Observation.terminalOutcome, 'completed')
assert.equal(l4Observation.activeGpuInstancesAfterTerminalObservation, 0)
assert.equal(l4Requests.length, 2)
for (const request of l4Requests) {
  assert.equal(request.method, 'GET')
  assert.equal(request.retry, false)
  assert.equal(request.maxRedirects, 0)
}

const canceledL4Launch = buildLaunch({
  launchRecordId: 'ffmpeg-l4-canceled-launch',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.professional_media_processing.v1',
  routeId: 'l4_standard_primary',
  executionTarget: 'google_cloud_run_l4_job',
  accelerator: 'nvidia_l4',
  cloudJobExecutionId: 'ffmpeg-l4-canceled-cloud-execution',
  launchedAt: '2026-08-02T18:20:00.000Z',
})
const canceledL4Binding = buildL4Binding(canceledL4Launch, 'operation-canceled')
let canceledL4ReadCount = 0
const canceledL4Port = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(canceledL4Binding)
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence(input) {
      assert.equal(input.terminalOutcome, 'canceled')
      return buildCostEvidence({
        launch: input.launch,
        cloudProviderTerminalRef: input.cloudProviderTerminalRef,
        outcome: 'not_executed',
        observedAt: '2026-08-02T18:20:59.000Z',
      })
    },
  },
  auth: {
    async request() {
      canceledL4ReadCount += 1
      if (canceledL4ReadCount === 1) return {
        data: {
          name: canceledL4Binding.providerOperationResource,
          done: true,
          response: {
            name: `${canceledL4Binding.expectedCloudRunJobResource}`
              + '/executions/execution-canceled',
          },
        },
      } as never
      return {
        data: {
          name: `${canceledL4Binding.expectedCloudRunJobResource}`
            + '/executions/execution-canceled',
          uid: 'l4-execution-uid-canceled',
          completionTime: '2026-08-02T18:20:58.000Z',
          taskCount: 1,
          runningCount: 0,
          succeededCount: 0,
          failedCount: 0,
          cancelledCount: 1,
          conditions: [{
            type: 'Completed',
            state: 'CONDITION_FAILED',
            executionReason: 'CANCELLED',
          }],
        },
      } as never
    },
  },
  now: () => '2026-08-02T18:21:00.000Z',
})
const canceledObservation = assertCanonicalProfessionalGpuTerminalObservation(
  await canceledL4Port
    .rereadTerminalUsagePriceAndCost({ launch: canceledL4Launch }),
)
assert.equal(canceledObservation.terminalOutcome, 'canceled')
assert.equal(canceledObservation.workerStoppedVerified, true)

let nonterminalCostReads = 0
const nonterminalPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(a100Binding)
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence() {
      nonterminalCostReads += 1
      throw new Error('A running job cannot reach cost settlement evidence.')
    },
  },
  auth: {
    async request() {
      return {
        data: {
          name: a100Binding.providerJobResource,
          uid: a100Binding.providerJobUid,
          status: { state: 'RUNNING' },
        },
      } as never
    },
  },
})
await assert.rejects(() => nonterminalPort
  .rereadTerminalUsagePriceAndCost({ launch: a100Launch }))
assert.equal(nonterminalCostReads, 0)

const mismatchedBinding = rehashBinding({
  ...structuredClone(a100Binding),
  launchRef: ref('another-launch'),
})
let mismatchedProviderReads = 0
const mismatchedPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return mismatchedBinding
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence() {
      throw new Error('Mismatched binding must not reach cost evidence.')
    },
  },
  auth: {
    async request() {
      mismatchedProviderReads += 1
      throw new Error('Mismatched binding must not reach Google Cloud.')
    },
  },
})
await assert.rejects(() => mismatchedPort
  .rereadTerminalUsagePriceAndCost({ launch: a100Launch }))
assert.equal(mismatchedProviderReads, 0)

let hostileBindingGetterInvoked = false
const hostileBinding: Record<string, unknown> = {}
Object.defineProperty(hostileBinding, 'launchRef', {
  enumerable: true,
  get() {
    hostileBindingGetterInvoked = true
    return ref('hostile')
  },
})
const hostileBindingPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return hostileBinding
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence() {
      throw new Error('Hostile binding must not reach cost evidence.')
    },
  },
  auth: {
    async request() {
      throw new Error('Hostile binding must not reach Google Cloud.')
    },
  },
})
await assert.rejects(() => hostileBindingPort
  .rereadTerminalUsagePriceAndCost({ launch: a100Launch }))
assert.equal(hostileBindingGetterInvoked, false)

let hostileProviderGetterInvoked = false
const hostileProviderPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(a100Binding)
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence() {
      throw new Error('Hostile provider response cannot reach cost evidence.')
    },
  },
  auth: {
    async request() {
      const data: Record<string, unknown> = {
        uid: a100Binding.providerJobUid,
        status: { state: 'SUCCEEDED' },
      }
      Object.defineProperty(data, 'name', {
        enumerable: true,
        get() {
          hostileProviderGetterInvoked = true
          return a100Binding.providerJobResource
        },
      })
      return { data } as never
    },
  },
})
await assert.rejects(() => hostileProviderPort
  .rereadTerminalUsagePriceAndCost({ launch: a100Launch }))
assert.equal(hostileProviderGetterInvoked, false)

const mismatchedCostPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(a100Binding)
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence(input) {
      const evidence = buildCostEvidence({
        launch: input.launch,
        cloudProviderTerminalRef: ref('wrong-provider-terminal'),
        outcome: 'executed',
        observedAt: '2026-08-02T18:04:59.000Z',
      })
      return evidence
    },
  },
  auth: {
    async request() {
      return {
        data: {
          name: a100Binding.providerJobResource,
          uid: a100Binding.providerJobUid,
          status: { state: 'SUCCEEDED' },
        },
      } as never
    },
  },
  now: () => '2026-08-02T18:05:00.000Z',
})
await assert.rejects(() => mismatchedCostPort
  .rereadTerminalUsagePriceAndCost({ launch: a100Launch }))

let networkReadCount = 0
const networkUnknownPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(a100Binding)
    },
  },
  costEvidenceReadPort: {
    async rereadUsagePriceAndCostEvidence() {
      throw new Error('Unknown provider read cannot settle cost evidence.')
    },
  },
  auth: {
    async request() {
      networkReadCount += 1
      throw new Error('Synthetic terminal-read network abort.')
    },
  },
})
await assert.rejects(() => networkUnknownPort
  .rereadTerminalUsagePriceAndCost({ launch: a100Launch }))
assert.equal(networkReadCount, 1)

console.log(JSON.stringify({
  smoke: 'canonical-professional-google-cloud-gpu-terminal-observation-port',
  checks: 69,
  a100BatchTerminalAndCostAccepted: true,
  l4CloudRunTerminalAndCostAccepted: true,
  l4CancellationPreserved: true,
  separateScaleToZeroEvidenceRequired: true,
  activeGpuInstancesAfterTerminalObservation: 0,
  providerRedirectAllowed: false,
  automaticProviderRetryAllowed: false,
  nonterminalObservationPromoted: false,
  hostileAccessorInvoked: false,
  callerOrPlanTerminalClaimAccepted: false,
  customerWalletOrLedgerMutated: false,
  liveCloudReadPerformed: false,
  productionAuthorityGranted: false,
}))

function buildLaunch(input: {
  launchRecordId: string
  toolId: string
  operationId: string
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary'
  executionTarget:
    | 'google_cloud_batch_a2_ultra_job'
    | 'google_cloud_run_l4_job'
  accelerator: 'nvidia_a100_80gb' | 'nvidia_l4'
  cloudJobExecutionId: string
  launchedAt: string
}): CanonicalProfessionalGpuJobLaunch {
  const payload = {
    schemaVersion: 'canonical-professional-gpu-job-launch-v1' as const,
    source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
    launchRecordId: input.launchRecordId,
    admissionRef: ref(`${input.launchRecordId}.admission`),
    admissionConsumptionRef: ref(`${input.launchRecordId}.consumption`),
    runtimeReleaseRef: ref(`${input.launchRecordId}.release`),
    executionEnvelopeRef: ref(`${input.launchRecordId}.envelope`),
    toolId: input.toolId,
    operationId: input.operationId,
    routeId: input.routeId,
    runtimeRegion: 'us-central1' as const,
    executionTarget: input.executionTarget,
    accelerator: input.accelerator,
    immutableImageDigest: prefixedSha(`${input.launchRecordId}.image`),
    cloudJobCreateRequestRef: ref(`${input.launchRecordId}.create-request`),
    cloudJobExecutionRef: ref(input.cloudJobExecutionId),
    launchDisposition: 'job_created' as const,
    providerInferenceOrSubstantiveWorkKnownExecuted:
      'not_executed' as const,
    createOnlyAdmissionConsumedBeforeLaunch: true as const,
    duplicateLaunchAllowed: false as const,
    unknownOutcomeRetryAllowed: false as const,
    noApprovedAdmissionMeansZeroGpuJobs: true as const,
    minimumIdleInstances: 0 as const,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    launchedAt: input.launchedAt,
  }
  return canonicalProfessionalGpuJobLaunchSchema.parse({
    ...payload,
    launchHash: sha256AuthorityValue(payload),
  })
}

function buildA100Binding(
  launch: CanonicalProfessionalGpuJobLaunch,
): Extract<CanonicalProfessionalGoogleCloudGpuExecutionBinding, {
  executionTarget: 'google_cloud_batch_a2_ultra_job'
}> {
  if (!launch.cloudJobExecutionRef) throw new Error('Expected launch ref.')
  const payload = {
    schemaVersion:
      'canonical-professional-google-cloud-gpu-execution-binding-v1' as const,
    source:
      'canonical_server_professional_gpu_cloud_execution_repository' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    cloudJobExecutionRef: launch.cloudJobExecutionRef,
    projectId: 'reeditpro' as const,
    runtimeRegion: 'us-central1' as const,
    providerExecutionPersistedBeforeTerminalRead: true as const,
    callerProviderResourceAccepted: false as const,
    browserLocalStateAccepted: false as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    executionTarget: 'google_cloud_batch_a2_ultra_job' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    providerJobResource:
      'projects/reeditpro/locations/us-central1/jobs/sam31-a100-job-1',
    providerJobUid: 'sam31-a100-job-uid-1',
  }
  return {
    ...payload,
    bindingHash: sha256AuthorityValue(payload),
  }
}

function buildL4Binding(
  launch: CanonicalProfessionalGpuJobLaunch,
  operationId = 'operation-1',
): Extract<CanonicalProfessionalGoogleCloudGpuExecutionBinding, {
  executionTarget: 'google_cloud_run_l4_job'
}> {
  if (!launch.cloudJobExecutionRef) throw new Error('Expected launch ref.')
  const payload = {
    schemaVersion:
      'canonical-professional-google-cloud-gpu-execution-binding-v1' as const,
    source:
      'canonical_server_professional_gpu_cloud_execution_repository' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    cloudJobExecutionRef: launch.cloudJobExecutionRef,
    projectId: 'reeditpro' as const,
    runtimeRegion: 'us-central1' as const,
    providerExecutionPersistedBeforeTerminalRead: true as const,
    callerProviderResourceAccepted: false as const,
    browserLocalStateAccepted: false as const,
    routeId: launch.routeId as 'l4_heavy_fallback' | 'l4_standard_primary',
    executionTarget: 'google_cloud_run_l4_job' as const,
    accelerator: 'nvidia_l4' as const,
    providerOperationResource:
      `projects/reeditpro/locations/us-central1/operations/${operationId}`,
    expectedCloudRunJobResource:
      'projects/reeditpro/locations/us-central1/jobs/reeditpro-professional-l4',
  }
  return {
    ...payload,
    bindingHash: sha256AuthorityValue(payload),
  }
}

function buildCostEvidence(input: {
  launch: CanonicalProfessionalGpuJobLaunch
  cloudProviderTerminalRef:
    CanonicalProfessionalGpuTerminalCostEvidence['cloudProviderTerminalRef']
  outcome: 'executed' | 'not_executed' | 'unknown'
  observedAt: string
}): CanonicalProfessionalGpuTerminalCostEvidence {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-terminal-cost-evidence-v1' as const,
    source:
      'canonical_server_professional_gpu_usage_price_and_cost_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: ref(input.launch.launchRecordId, input.launch.launchHash),
    cloudProviderTerminalRef: input.cloudProviderTerminalRef,
    cloudCapacityTeardownObservationRef:
      ref(`${input.launch.launchRecordId}.capacity-teardown`),
    workerUsageEvidenceRef: ref(`${input.launch.launchRecordId}.usage`),
    currentAccountPriceAuthorityRef:
      ref(`${input.launch.launchRecordId}.account-price`),
    attemptCostReceiptRef: ref(`${input.launch.launchRecordId}.attempt-cost`),
    providerInferenceOrSubstantiveWorkOutcome: input.outcome,
    exactPlatformUsageReread: true as const,
    exactCurrentAccountPriceReread: true as const,
    attemptCostReceiptPersistedBeforeSettlement: true as const,
    providerCapacityOrExecutionRunningCountReread: true as const,
    activeGpuResourcesAfterObservation: 0 as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    callerOrPlanCostClaimAccepted: false as const,
    observedAt: input.observedAt,
  }
  return {
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  }
}

function rehashBinding(
  binding: CanonicalProfessionalGoogleCloudGpuExecutionBinding,
): CanonicalProfessionalGoogleCloudGpuExecutionBinding {
  const payload = { ...binding }
  Reflect.deleteProperty(payload, 'bindingHash')
  return {
    ...payload,
    bindingHash: sha256AuthorityValue(payload),
  } as CanonicalProfessionalGoogleCloudGpuExecutionBinding
}

function prefixedSha(value: unknown): `sha256:${string}` {
  return `sha256:${sha256AuthorityValue(value)}`
}

function ref(id: string, hash = sha256AuthorityValue(id)) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${hash}` as const,
  }
}
