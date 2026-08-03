import assert from 'node:assert/strict'

import {
  admitCanonicalProfessionalToolGpuDispatch,
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  canonicalProfessionalGpuTerminalCostEvidenceSchema,
  createGoogleCloudProfessionalGpuTerminalObservationPort,
} from '../services/canonical-professional-google-cloud-gpu-terminal-observation-port'
import {
  createCanonicalProfessionalGpuTerminalCostEvidenceReadPort,
  type CanonicalProfessionalGpuAttemptCostReceiptStore,
} from '../services/canonical-professional-gpu-terminal-cost-evidence-service'
import {
  recordCanonicalProfessionalGpuJobTerminal,
  startCanonicalProfessionalGpuJob,
  type CanonicalProfessionalGpuAdmissionConsumption,
  type CanonicalProfessionalGpuExecutionEnvelope,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobLifecycleStore,
  type CanonicalProfessionalGpuJobTerminal,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  assertCanonicalProfessionalToolGpuAttemptCostReceipt,
  createCanonicalProfessionalToolGpuCostEstimate,
  type CanonicalProfessionalToolGpuAttemptCostReceipt,
  type CanonicalProfessionalToolGpuUsage,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'

const rateObservedAt = '2026-08-02T16:00:00.000Z'
const admittedAt = '2026-08-02T16:10:00.000Z'
const launchStartedAt = '2026-08-02T16:11:00.000Z'
const usageObservedAt = '2026-08-02T16:13:00.000Z'
const a100Rate = await rate('a100_80gb_heavy_primary')
const l4FallbackRate = await rate('l4_heavy_fallback')
const runtimeRelease = buildRuntimeRelease()
const estimate = createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'sam31-terminal-cost-estimate',
  scope: {
    ownerUserId: 'owner-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersion: 1,
    editPlanHash: sha('edit-plan-1'),
    outputId: 'output-1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    plannedWorkItemRef: ref('sam31-work-1'),
    toolId: 'sam3_1',
    exactToolOrModelReleaseRef:
      runtimeRelease.toolOrModelArtifactReleaseRef,
  },
  primaryRateAuthority: a100Rate,
  primaryUsageRange: usageRange('a100', 60_000, 120_000, 240_000),
  fallbackRateAuthority: l4FallbackRate,
  fallbackUsageRange: usageRange('l4', 120_000, 240_000, 420_000),
  primaryPreInferenceFailureHighUsage: usage('a100', 0),
  createdAt: admittedAt,
})
const admission = admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'sam31-terminal-cost-admission',
  estimate,
  runtimeRelease,
  currentRateAuthority: a100Rate,
  scope: {
    ownerUserId: 'owner-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersion: 1,
    approvedSnapshotRef: ref('approved-snapshot-1'),
    confirmedOutputFrameRef: ref('confirmed-output-frame-1'),
    masterTimingRef: ref('master-timing-1'),
    approvedWorkItemRef: ref('sam31-work-1'),
    workerLeaseRef: ref('sam31-worker-lease-1'),
    fundedReservationRef: ref('sam31-funded-reservation-1'),
    userApprovalRecordRef: ref('sam31-user-approval-1'),
    userTriggerRecordRef: ref('sam31-user-trigger-1'),
    executionAttemptRef: ref('sam31-execution-attempt-1'),
    idempotencyKey: 'sam31-execution-attempt-1.idempotency',
  },
  routeId: 'a100_80gb_heavy_primary',
  admittedAt,
  expiresAt: '2026-08-02T16:15:00.000Z',
})

const consumptions = new Map<string, CanonicalProfessionalGpuAdmissionConsumption>()
const envelopes = new Map<string, CanonicalProfessionalGpuExecutionEnvelope>()
const launches = new Map<string, CanonicalProfessionalGpuJobLaunch>()
const terminals = new Map<string, CanonicalProfessionalGpuJobTerminal>()
const lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore = {
  async consumeAdmissionCreateOnly({ record }) {
    if (consumptions.has(record.admissionRef.id)) return 'already_exists'
    consumptions.set(record.admissionRef.id, structuredClone(record))
    return 'created'
  },
  async createExecutionEnvelopeOnly({ record }) {
    if (envelopes.has(record.envelopeId)) return 'already_exists'
    envelopes.set(record.envelopeId, structuredClone(record))
    return 'created'
  },
  async rereadExecutionEnvelope({ envelopeId }) {
    return structuredClone(envelopes.get(envelopeId) ?? null)
  },
  async createLaunchRecordOnly({ record }) {
    if (launches.has(record.launchRecordId)) return 'already_exists'
    launches.set(record.launchRecordId, structuredClone(record))
    return 'created'
  },
  async createTerminalRecordOnly({ record }) {
    if (terminals.has(record.terminalRecordId)) return 'already_exists'
    terminals.set(record.terminalRecordId, structuredClone(record))
    return 'created'
  },
}
const launchTarget = {
  releaseRef: admission.runtimeReleaseRef,
  releaseEvidenceClass: 'canonical_private_reread' as const,
  privateInternalQualified: true as const,
  toolId: admission.toolId,
  operationId: admission.operationId,
  routeId: admission.routeId,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_batch_a2_ultra_job' as const,
  machineType: 'a2-ultragpu-1g' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  immutableImageRef: runtimeRelease.immutableImageRef,
  immutableImageDigest: runtimeRelease.immutableImageDigest,
  fixedServerTaskContractRef: ref('sam31-fixed-task-contract'),
  serviceIdentityRef: runtimeRelease.serviceIdentityRef,
  privateNetworkAndArtifactTransportRef:
    runtimeRelease.privateNetworkAndArtifactTransportRef,
  minimumIdleInstances: 0 as const,
  maximumConcurrentAttemptsPerInstance: 1 as const,
  runtimeNetworkDownloadAllowed: false as const,
  callerCommandImageModelOrEnvironmentAccepted: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  startsOnlyFromConsumedApprovedAdmission: true as const,
  stopsAtTerminalAttempt: true as const,
}
const launch = await startCanonicalProfessionalGpuJob({
  launchRecordId: 'sam31-terminal-cost-launch',
  admission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return structuredClone(launchTarget)
    },
  },
  launchPort: {
    async startOneShotJob() {
      return {
        disposition: 'accepted',
        cloudJobExecutionRef: ref('sam31-cloud-execution-1'),
        cloudJobCreateRequestRef: ref('sam31-cloud-create-1'),
        providerRequestIdDigestSha256: sha('provider-request-1'),
        observedAt: '2026-08-02T16:11:01.000Z',
        providerInferenceOrSubstantiveWorkKnownExecuted:
          'not_executed',
      }
    },
  },
  store: lifecycleStore,
  startedAt: launchStartedAt,
})
const executionEnvelope = envelopes.get(
  `${admission.admissionId}.execution-envelope`,
)
if (!executionEnvelope) throw new Error('Execution envelope was not persisted.')

const receiptRecords = new Map<
  string,
  CanonicalProfessionalToolGpuAttemptCostReceipt
>()
const receiptStore: CanonicalProfessionalGpuAttemptCostReceiptStore = {
  async createAttemptCostReceiptOnly({ receipt }) {
    if (receiptRecords.has(receipt.receiptId)) return 'already_exists'
    receiptRecords.set(receipt.receiptId, structuredClone(receipt))
    return 'created'
  },
  async rereadAttemptCostReceipt({ receiptId }) {
    return structuredClone(receiptRecords.get(receiptId) ?? null)
  },
}
const providerTerminalRef = ref('sam31-provider-terminal-1')

const completedPort = costPort({
  receiptId: 'sam31-attempt-cost-completed',
  substantiveWorkOutcome: 'executed',
  actualUsage: usage('a100', 60_000),
})
const completedEvidence = canonicalProfessionalGpuTerminalCostEvidenceSchema
  .parse(await completedPort.rereadUsagePriceAndCostEvidence({
    launch,
    cloudProviderTerminalRef: providerTerminalRef,
    terminalOutcome: 'completed',
  }))
const completedReceipt = assertCanonicalProfessionalToolGpuAttemptCostReceipt(
  receiptRecords.get('sam31-attempt-cost-completed'),
)
assert.equal(completedReceipt.terminalOutcome, 'completed')
assert.ok(completedReceipt.customerEligibleToolCostCredits > 0)
assert.equal(completedReceipt.walletOrLedgerMutationPerformed, false)
assert.equal(completedEvidence.activeGpuResourcesAfterObservation, 0)
assert.equal(completedEvidence.customerWalletOrLedgerMutated, false)
assert.equal(
  completedEvidence.currentAccountPriceAuthorityRef.contentHash,
  `sha256:${a100Rate.rateAuthorityHash}`,
)

const repeatedCompletedEvidence = canonicalProfessionalGpuTerminalCostEvidenceSchema
  .parse(await completedPort.rereadUsagePriceAndCostEvidence({
    launch,
    cloudProviderTerminalRef: providerTerminalRef,
    terminalOutcome: 'completed',
  }))
assert.equal(
  repeatedCompletedEvidence.attemptCostReceiptRef.contentHash,
  completedEvidence.attemptCostReceiptRef.contentHash,
)
assert.equal(receiptRecords.size, 1)

const notExecutedPort = costPort({
  receiptId: 'sam31-attempt-cost-not-executed',
  substantiveWorkOutcome: 'not_executed',
  actualUsage: usage('a100', 0),
})
await notExecutedPort.rereadUsagePriceAndCostEvidence({
  launch,
  cloudProviderTerminalRef: providerTerminalRef,
  terminalOutcome: 'completed',
})
const notExecutedReceipt = assertCanonicalProfessionalToolGpuAttemptCostReceipt(
  receiptRecords.get('sam31-attempt-cost-not-executed'),
)
assert.equal(notExecutedReceipt.terminalOutcome, 'reeditpro_failed')
assert.equal(notExecutedReceipt.customerEligibleToolCostCredits, 0)
assert.equal(
  notExecutedReceipt.creditsRecommendedToReleaseOrRefund,
  estimate.maximumReservedToolCostCredits,
)

const unknownPort = costPort({
  receiptId: 'sam31-attempt-cost-unknown',
  substantiveWorkOutcome: 'unknown',
  actualUsage: usage('a100', 20_000),
})
await unknownPort.rereadUsagePriceAndCostEvidence({
  launch,
  cloudProviderTerminalRef: providerTerminalRef,
  terminalOutcome: 'failed',
})
const unknownReceipt = assertCanonicalProfessionalToolGpuAttemptCostReceipt(
  receiptRecords.get('sam31-attempt-cost-unknown'),
)
assert.equal(unknownReceipt.terminalOutcome, 'unknown_requires_reconciliation')
assert.equal(unknownReceipt.unknownOutcomeBlocksRetry, true)
assert.equal(unknownReceipt.customerEligibleToolCostCredits, 0)
assert.equal(
  unknownReceipt.creditsRecommendedToHoldPendingReconciliation,
  estimate.maximumReservedToolCostCredits,
)

const canceledPort = costPort({
  receiptId: 'sam31-attempt-cost-canceled',
  substantiveWorkOutcome: 'not_executed',
  actualUsage: usage('a100', 0),
})
await canceledPort.rereadUsagePriceAndCostEvidence({
  launch,
  cloudProviderTerminalRef: providerTerminalRef,
  terminalOutcome: 'canceled',
})
const canceledReceipt = assertCanonicalProfessionalToolGpuAttemptCostReceipt(
  receiptRecords.get('sam31-attempt-cost-canceled'),
)
assert.equal(
  canceledReceipt.terminalOutcome,
  'unknown_requires_reconciliation',
)
assert.equal(canceledReceipt.unknownOutcomeBlocksRetry, true)
assert.equal(canceledReceipt.customerEligibleToolCostCredits, 0)
assert.equal(
  canceledReceipt.creditsRecommendedToHoldPendingReconciliation,
  estimate.maximumReservedToolCostCredits,
)

let malformedTerminalContextReads = 0
const malformedTerminalPort = createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
  contextReadPort: {
    async rereadPrivateTerminalCostContext() {
      malformedTerminalContextReads += 1
      throw new Error('Malformed terminal ref must not reach context.')
    },
  },
  usageReadPort: {
    async rereadPlatformUsageAndCapacity() {
      throw new Error('Malformed terminal ref must not reach usage.')
    },
  },
  rateReadPort: {
    async rereadApprovedCurrentAccountRateAuthority() {
      throw new Error('Malformed terminal ref must not reach pricing.')
    },
  },
  receiptStore,
})
await assert.rejects(() => malformedTerminalPort.rereadUsagePriceAndCostEvidence({
  launch,
  cloudProviderTerminalRef: {
    id: '',
    version: 1,
    contentHash: `sha256:${sha('malformed-terminal')}`,
  } as never,
  terminalOutcome: 'completed',
}))
assert.equal(malformedTerminalContextReads, 0)

let hostileContextGetterInvoked = false
const hostileContext: Record<string, unknown> = {}
Object.defineProperty(hostileContext, 'launchRef', {
  enumerable: true,
  get() {
    hostileContextGetterInvoked = true
    return ref('hostile-launch')
  },
})
let hostileContextUsageReads = 0
const hostileContextPort = createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
  contextReadPort: {
    async rereadPrivateTerminalCostContext() {
      return hostileContext
    },
  },
  usageReadPort: {
    async rereadPlatformUsageAndCapacity() {
      hostileContextUsageReads += 1
      throw new Error('Hostile context must not reach usage evidence.')
    },
  },
  rateReadPort: {
    async rereadApprovedCurrentAccountRateAuthority() {
      throw new Error('Hostile context must not reach pricing.')
    },
  },
  receiptStore,
})
await assert.rejects(() => hostileContextPort
  .rereadUsagePriceAndCostEvidence({
    launch,
    cloudProviderTerminalRef: providerTerminalRef,
    terminalOutcome: 'completed',
  }))
assert.equal(hostileContextGetterInvoked, false)
assert.equal(hostileContextUsageReads, 0)

const mismatchedUsagePort = createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
  contextReadPort: {
    async rereadPrivateTerminalCostContext() {
      return buildContext('sam31-attempt-cost-mismatched-usage')
    },
  },
  usageReadPort: {
    async rereadPlatformUsageAndCapacity() {
      return buildUsageEvidence({
        substantiveWorkOutcome: 'executed',
        actualUsage: usage('a100', 60_000),
        cloudProviderTerminalRef: ref('another-provider-terminal'),
      })
    },
  },
  rateReadPort: {
    async rereadApprovedCurrentAccountRateAuthority() {
      throw new Error('Mismatched usage must not reach pricing.')
    },
  },
  receiptStore,
})
await assert.rejects(() => mismatchedUsagePort
  .rereadUsagePriceAndCostEvidence({
    launch,
    cloudProviderTerminalRef: providerTerminalRef,
    terminalOutcome: 'completed',
  }))
assert.equal(receiptRecords.has('sam31-attempt-cost-mismatched-usage'), false)

const reusedTeardownPort = createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
  contextReadPort: {
    async rereadPrivateTerminalCostContext() {
      return buildContext('sam31-attempt-cost-reused-teardown')
    },
  },
  usageReadPort: {
    async rereadPlatformUsageAndCapacity() {
      return buildUsageEvidence({
        substantiveWorkOutcome: 'executed',
        actualUsage: usage('a100', 60_000),
        cloudProviderTerminalRef: providerTerminalRef,
        cloudCapacityTeardownObservationRef: providerTerminalRef,
      })
    },
  },
  rateReadPort: {
    async rereadApprovedCurrentAccountRateAuthority() {
      throw new Error('Reused teardown evidence must not reach pricing.')
    },
  },
  receiptStore,
})
await assert.rejects(() => reusedTeardownPort
  .rereadUsagePriceAndCostEvidence({
    launch,
    cloudProviderTerminalRef: providerTerminalRef,
    terminalOutcome: 'completed',
  }))
assert.equal(receiptRecords.has('sam31-attempt-cost-reused-teardown'), false)

const staleClockPort = createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
  contextReadPort: {
    async rereadPrivateTerminalCostContext() {
      return buildContext('sam31-attempt-cost-stale-clock')
    },
  },
  usageReadPort: {
    async rereadPlatformUsageAndCapacity() {
      return buildUsageEvidence({
        substantiveWorkOutcome: 'executed',
        actualUsage: usage('a100', 60_000),
        cloudProviderTerminalRef: providerTerminalRef,
      })
    },
  },
  rateReadPort: {
    async rereadApprovedCurrentAccountRateAuthority() {
      return structuredClone(a100Rate)
    },
  },
  receiptStore,
  now: () => '2026-08-02T16:12:59.000Z',
})
await assert.rejects(() => staleClockPort
  .rereadUsagePriceAndCostEvidence({
    launch,
    cloudProviderTerminalRef: providerTerminalRef,
    terminalOutcome: 'completed',
  }))
assert.equal(receiptRecords.has('sam31-attempt-cost-stale-clock'), false)

const wrongRatePort = createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
  contextReadPort: {
    async rereadPrivateTerminalCostContext() {
      return buildContext('sam31-attempt-cost-wrong-rate')
    },
  },
  usageReadPort: {
    async rereadPlatformUsageAndCapacity() {
      return buildUsageEvidence({
        substantiveWorkOutcome: 'executed',
        actualUsage: usage('a100', 60_000),
        cloudProviderTerminalRef: providerTerminalRef,
      })
    },
  },
  rateReadPort: {
    async rereadApprovedCurrentAccountRateAuthority() {
      return l4FallbackRate
    },
  },
  receiptStore,
})
await assert.rejects(() => wrongRatePort
  .rereadUsagePriceAndCostEvidence({
    launch,
    cloudProviderTerminalRef: providerTerminalRef,
    terminalOutcome: 'completed',
  }))
assert.equal(receiptRecords.has('sam31-attempt-cost-wrong-rate'), false)

const executionBindingPayload = {
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
    'projects/reeditpro/locations/us-central1/jobs/sam31-composed-job-1',
  providerJobUid: 'sam31-composed-job-uid-1',
}
const executionBinding = {
  ...executionBindingPayload,
  bindingHash: sha256AuthorityValue(executionBindingPayload),
}
let composedProviderTerminalReads = 0
const composedTerminalPort = createGoogleCloudProfessionalGpuTerminalObservationPort({
  executionReadPort: {
    async rereadPrivateExecutionBinding() {
      return structuredClone(executionBinding)
    },
  },
  costEvidenceReadPort: completedPort,
  auth: {
    async request() {
      composedProviderTerminalReads += 1
      return {
        data: {
          name: executionBinding.providerJobResource,
          uid: executionBinding.providerJobUid,
          status: {
            state: 'SUCCEEDED',
            runDuration: '119.000s',
          },
        },
      } as never
    },
  },
  now: () => '2026-08-02T16:13:02.000Z',
})
const composedTerminalRecord = await recordCanonicalProfessionalGpuJobTerminal({
  terminalRecordId: 'sam31-composed-terminal-record',
  launch,
  terminalObservationPort: composedTerminalPort,
  store: lifecycleStore,
})
assert.equal(composedProviderTerminalReads, 1)
assert.equal(composedTerminalRecord.terminalOutcome, 'completed')
assert.equal(composedTerminalRecord.workerStoppedVerified, true)
assert.equal(
  composedTerminalRecord.activeGpuInstancesAfterTerminalObservation,
  0,
)
assert.equal(composedTerminalRecord.customerWalletOrLedgerMutated, false)
assert.equal(composedTerminalRecord.unknownOutcomeBlocksRetry, false)
assert.equal(terminals.size, 1)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-terminal-cost-evidence-service',
  checks: 77,
  completedCustomerEligibleCredits:
    completedReceipt.customerEligibleToolCostCredits,
  notExecutedCustomerEligibleCredits:
    notExecutedReceipt.customerEligibleToolCostCredits,
  notExecutedReservationReleaseCredits:
    notExecutedReceipt.creditsRecommendedToReleaseOrRefund,
  unknownRetryBlocked: unknownReceipt.unknownOutcomeBlocksRetry,
  unknownCreditsHeld:
    unknownReceipt.creditsRecommendedToHoldPendingReconciliation,
  unprovenCancellationRetryBlocked:
    canceledReceipt.unknownOutcomeBlocksRetry,
  accountEffectiveRateReread: true,
  exactPlatformUsageReread: true,
  separateScaleToZeroEvidence: true,
  providerTerminalToCostToLifecycleComposed: true,
  idempotentReceiptReread: true,
  callerUsageOutcomeOrCostAccepted: false,
  workerSuppliedPricingAccepted: false,
  walletOrLedgerMutationPerformed: false,
  liveCloudOrBillingReadPerformed: false,
  productionAuthorityGranted: false,
}))

function costPort(input: {
  receiptId: string
  substantiveWorkOutcome: 'executed' | 'not_executed' | 'unknown'
  actualUsage: CanonicalProfessionalToolGpuUsage
}) {
  return createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
    contextReadPort: {
      async rereadPrivateTerminalCostContext() {
        return buildContext(input.receiptId)
      },
    },
    usageReadPort: {
      async rereadPlatformUsageAndCapacity(request) {
        return buildUsageEvidence({
          substantiveWorkOutcome: input.substantiveWorkOutcome,
          actualUsage: input.actualUsage,
          cloudProviderTerminalRef: request.cloudProviderTerminalRef,
        })
      },
    },
    rateReadPort: {
      async rereadApprovedCurrentAccountRateAuthority() {
        return structuredClone(a100Rate)
      },
    },
    receiptStore,
    now: () => '2026-08-02T16:13:01.000Z',
  })
}

function buildContext(receiptId: string) {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-terminal-cost-context-v1' as const,
    source:
      'canonical_server_professional_gpu_terminal_cost_context_repository' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    admission,
    runtimeRelease,
    executionEnvelope,
    estimate,
    approvedCurrentAccountRateAuthorityRef: ref(
      a100Rate.rateAuthorityId,
      a100Rate.rateAuthorityHash,
      a100Rate.rateAuthorityVersion,
    ),
    attemptCostReceiptId: receiptId,
    priorPrimaryFailureReceiptRef: null,
    priorPrimaryFailureClass: 'not_applicable' as const,
    exactApprovalEstimateReservationAdmissionEnvelopeAndLaunchReread:
      true as const,
    callerEstimateRateUsageOutcomeOrCostAccepted: false as const,
    walletOrLedgerMutationAuthorityGranted: false as const,
    preparedAt: admittedAt,
  }
  return {
    ...payload,
    contextHash: sha256AuthorityValue(payload),
  }
}

function buildUsageEvidence(input: {
  substantiveWorkOutcome: 'executed' | 'not_executed' | 'unknown'
  actualUsage: CanonicalProfessionalToolGpuUsage
  cloudProviderTerminalRef: {
    readonly id: string
    readonly version: number
    readonly contentHash: string
  }
  cloudCapacityTeardownObservationRef?: {
    readonly id: string
    readonly version: number
    readonly contentHash: string
  }
}) {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-platform-usage-evidence-v1' as const,
    source:
      'canonical_server_google_cloud_gpu_platform_usage_repository' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    admissionRef: launch.admissionRef,
    executionEnvelopeRef: launch.executionEnvelopeRef,
    cloudProviderTerminalRef: input.cloudProviderTerminalRef,
    cloudCapacityTeardownObservationRef:
      input.cloudCapacityTeardownObservationRef
      ?? ref('sam31-cloud-capacity-teardown-1'),
    workerUsageEvidenceRef: ref('sam31-worker-usage-1'),
    platformUsageRereadRef: ref('sam31-platform-usage-1'),
    routeId: launch.routeId,
    providerInferenceOrSubstantiveWorkOutcome:
      input.substantiveWorkOutcome,
    actualUsage: input.actualUsage,
    exactWorkerAndPlatformUsageReread: true as const,
    providerCapacityOrExecutionRunningCountReread: true as const,
    activeGpuResourcesAfterObservation: 0 as const,
    workerSuppliedPricingAccepted: false as const,
    callerUsageOutcomeOrCapacityClaimAccepted: false as const,
    observedAt: usageObservedAt,
  }
  return {
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  }
}

function buildRuntimeRelease() {
  const toolOrModelArtifactReleaseRef = ref('sam31-model-artifact-release')
  const imageRef = ref('sam31-a100-image')
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-runtime-release-observation-v2' as const,
    source: 'canonical_server_gpu_runtime_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseId: 'sam31-a100-private-runtime-release',
    releaseVersion: 1,
    status: 'private_internal_qualified' as const,
    toolId: 'sam3_1' as const,
    gpuExecutionOwnerBindingMode: 'native_gpu_implementation' as const,
    gpuExecutionOwnerToolId: 'sam3_1' as const,
    legacyToolSubstantiveExecutionObserved: false as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    toolCostProfileId: 'gpu-tool-sam3_1-v1',
    modelOrOperationCostProfileId:
      'sam3_1_multiplex_video_segmentation_v1' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    runtimeRegion: 'us-central1' as const,
    executionTarget: 'google_cloud_batch_a2_ultra_job' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 12 as const,
    allocatedMemoryGiB: 170 as const,
    allocatedLocalScratchGiB: 375 as const,
    serviceIdentityRef: ref('sam31-gpu-service-identity'),
    immutableImageRef: imageRef,
    immutableImageDigest: imageRef.contentHash,
    sourceAndDependencyClosureRef: ref('sam31-source-dependency-closure'),
    toolOrModelArtifactReleaseRef,
    sbomRef: ref('sam31-runtime-sbom'),
    imageScanAndSignatureRef: ref('sam31-image-scan-signature'),
    cudaDriverRuntimeQualificationRef: ref('sam31-cuda-qualification'),
    substantiveGpuExecutionQualificationRef:
      ref('sam31-substantive-gpu-qualification'),
    scaleToZeroConfigurationRef: ref('sam31-scale-to-zero-configuration'),
    privateNetworkAndArtifactTransportRef:
      ref('sam31-private-network-artifact-transport'),
    substantiveGpuEvidenceClass:
      'cuda_model_inference_and_nvdec' as const,
    exactToolOrModelVersionReread: true as const,
    exactCudaAndNativeDependencyClosureReread: true as const,
    actualGpuKernelModelRenderOrHardwareCodecMeasured: true as const,
    cpuOnlySubstantiveExecutionObserved: false as const,
    gpuHostCpuOnlyExecutionMaySatisfyQualification: false as const,
    runtimeNetworkDownloadAllowed: false as const,
    callerImageModelToolOrCommandSelectionAllowed: false as const,
    minimumIdleInstances: 0 as const,
    maximumConcurrentAttemptsPerInstance: 1 as const,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
    startsOnlyFromCreateOnlyApprovedUserAttempt: true as const,
    stopsAtTerminalAttempt: true as const,
    qualificationRunCount: 30,
    qualifiedAt: '2026-08-02T16:05:00.000Z',
    expiresAt: '2026-09-01T16:05:00.000Z',
    privateInternalQualified: true as const,
    customerBillingAuthorityGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionQualified: false as const,
  }
  return canonicalProfessionalToolGpuRuntimeReleaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

function usage(
  route: 'a100' | 'l4',
  activeGpuMilliseconds: number,
): CanonicalProfessionalToolGpuUsage {
  const coldStartMilliseconds = 10_000
  const runtimeAndModelLoadMilliseconds = activeGpuMilliseconds === 0
    ? 0
    : 20_000
  const drainAndShutdownMilliseconds = 2_000
  return {
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds,
    totalBillableMilliseconds: coldStartMilliseconds
      + runtimeAndModelLoadMilliseconds
      + activeGpuMilliseconds
      + drainAndShutdownMilliseconds,
    allocatedGpuCount: 1,
    allocatedVcpuCount: route === 'a100' ? 12 : 8,
    allocatedMemoryGiB: route === 'a100' ? 170 : 32,
    allocatedLocalScratchGiB: route === 'a100' ? 375 : 0,
    privateArtifactBytes: 64 * 1024 * 1024,
    privateArtifactRetentionMilliseconds: 24 * 60 * 60 * 1_000,
    networkEgressBytes: 0,
    classAOperationCount: 4,
    classBOperationCount: 8,
  }
}

function usageRange(
  route: 'a100' | 'l4',
  low: number,
  expected: number,
  high: number,
) {
  return {
    low: usage(route, low),
    expected: usage(route, expected),
    high: usage(route, high),
  }
}

async function rate(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: `rate-${routeId}`,
    rateAuthorityVersion: 1,
    routeId,
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawRate(routeId)
      },
    },
  })
}

function rawRate(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
): CanonicalGoogleCloudGpuRateRawObservation {
  const components = routeId === 'a100_80gb_heavy_primary'
    ? [
        component('a2_ultragpu_1g_machine_bundle',
          'machine_hour', 5_068_797_890, 'a'),
        ...commonComponents(),
      ]
    : [
        component('cloud_run_l4_gpu_second',
          'gpu_second', 186_700, 'b'),
        component('cloud_run_vcpu_second',
          'vcpu_second', 18_000, 'c'),
        component('cloud_run_memory_gib_second',
          'gib_second', 2_000, 'd'),
        ...commonComponents(),
      ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-account-pricing-scope'),
    pricingReaderConfigurationRef: ref('gpu-rate-reader-configuration'),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`),
    pricingReadStartedAt: '2026-08-02T15:59:55.000Z',
    pricingReadFinishedAt: rateObservedAt,
  }
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
  }
}

function commonComponents() {
  return [
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, 'e'),
    component('network_egress_gib', 'gib', 120_000_000, 'f'),
    component('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '1'),
    component('object_class_b_per_1000',
      'per_1000_operations', 400_000, '2'),
  ]
}

function component(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  usdNanosPerBillingUnit: number,
  character: string,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run'
    : componentClass.startsWith('a2_')
      ? 'service-compute-engine'
      : 'service-cloud-storage'
  const skuId = `sku-${componentClass}`
  return {
    componentClass,
    cloudServiceName: componentClass.startsWith('cloud_run')
      ? 'cloud-run'
      : componentClass.startsWith('a2_')
        ? 'compute-engine'
        : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: usdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: usdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}-${character}`),
      billingAccountPriceRef:
        ref(`billing-account-price-${componentClass}-${character}`),
    }],
    skuDescriptionDigestSha256: sha(`${componentClass}-${character}`),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: usdNanosPerBillingUnit,
    currentPriceObservedAt: rateObservedAt,
    skuRecordRef: ref(`sku-record-${componentClass}-${character}`),
  }
}

function ref(id: string, hash = sha(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${hash}` as const,
  }
}

function sha(value: unknown): string {
  return sha256AuthorityValue(value)
}
