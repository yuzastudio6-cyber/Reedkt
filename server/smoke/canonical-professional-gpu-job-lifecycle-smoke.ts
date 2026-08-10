import assert from 'node:assert/strict'

import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort,
  recordCanonicalProfessionalGpuJobTerminal,
  startCanonicalProfessionalGpuJob,
  type CanonicalProfessionalGpuExecutionEnvelope,
  type CanonicalProfessionalGpuJobLifecycleStore,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuCloudJobLaunchPort,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const consumedAdmissionIds = new Set<string>()
const executionEnvelopes = new Map<
  string,
  CanonicalProfessionalGpuExecutionEnvelope
>()
const launchRecordIds = new Set<string>()
const terminalRecordIds = new Set<string>()
const store: CanonicalProfessionalGpuJobLifecycleStore = {
  async consumeAdmissionCreateOnly({ record }) {
    return createOnce(consumedAdmissionIds, record.admissionRef.id)
  },
  async createExecutionEnvelopeOnly({ record }) {
    if (executionEnvelopes.has(record.envelopeId)) return 'already_exists'
    executionEnvelopes.set(record.envelopeId, structuredClone(record))
    return 'created'
  },
  async rereadExecutionEnvelope({ envelopeId }) {
    const record = executionEnvelopes.get(envelopeId)
    return record ? structuredClone(record) : null
  },
  async createLaunchRecordOnly({ record }) {
    return createOnce(launchRecordIds, record.launchRecordId)
  },
  async createTerminalRecordOnly({ record }) {
    return createOnce(terminalRecordIds, record.terminalRecordId)
  },
}

const admission = buildAdmission('sam31-gpu-admission-1', 'sam31-attempt-1')
const launchTarget = {
  releaseRef: admission.runtimeReleaseRef,
  releaseEvidenceClass: 'canonical_private_reread' as const,
  privateInternalQualified: true as const,
  toolId: admission.toolId,
  operationId: admission.operationId,
  routeId: admission.routeId,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_vertex_custom_job_a2_ultra' as const,
  machineType: 'a2-ultragpu-1g' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  immutableImageRef: ref('sam31-a100-image'),
  immutableImageDigest: hash('sam31-a100-image'),
  fixedServerTaskContractRef: ref('sam31-fixed-task-contract'),
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
let cloudLaunchCount = 0
let observedExecutionEnvelopeRef: ReturnType<typeof ref> | null = null
const rawLaunchPort: CanonicalProfessionalGpuCloudJobLaunchPort = {
  async startOneShotJob(input) {
    cloudLaunchCount += 1
    observedExecutionEnvelopeRef = input.executionEnvelopeRef
    return {
      disposition: 'accepted',
      cloudJobExecutionRef: ref('sam31-cloud-execution-1'),
      cloudJobCreateRequestRef: ref('sam31-cloud-create-1'),
      providerRequestIdDigestSha256:
        sha256AuthorityValue('provider-request-1'),
      observedAt: '2026-08-02T15:00:01.000Z',
      providerInferenceOrSubstantiveWorkKnownExecuted:
        'not_executed',
    }
  },
}

await assert.rejects(() => startCanonicalProfessionalGpuJob({
  launchRecordId: 'sam31-raw-port-must-fail-before-consumption',
  admission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return structuredClone(launchTarget)
    },
  },
  launchPort: rawLaunchPort,
  store,
  startedAt: '2026-08-02T15:00:00.000Z',
}))
assert.equal(cloudLaunchCount, 0)
assert.equal(consumedAdmissionIds.has(admission.admissionId), false)

const korniaAdmission = buildKorniaAdmission()
const korniaLaunchTarget = {
  ...structuredClone(launchTarget),
  releaseRef: korniaAdmission.runtimeReleaseRef,
  toolId: korniaAdmission.toolId,
  operationId: korniaAdmission.operationId,
  routeId: korniaAdmission.routeId,
  executionTarget: 'google_cloud_run_l4_job' as const,
  machineType: 'cloud_run_nvidia_l4' as const,
  accelerator: 'nvidia_l4' as const,
  immutableImageRef: ref('track-all-l4-qa-image'),
  immutableImageDigest: hash('track-all-l4-qa-image'),
  fixedServerTaskContractRef: ref('track-all-l4-qa-fixed-task-v2'),
}
let rawKorniaCloudLaunchCount = 0
await assert.rejects(() => startCanonicalProfessionalGpuJob({
  launchRecordId: 'track-all-l4-qa-raw-port-must-fail',
  admission: korniaAdmission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return structuredClone(korniaLaunchTarget)
    },
  },
  launchPort: {
    async startOneShotJob() {
      rawKorniaCloudLaunchCount += 1
      throw new Error('Raw Kornia L4 task-QA launch must be unreachable.')
    },
  },
  store,
  startedAt: '2026-08-02T15:00:00.000Z',
}))
assert.equal(rawKorniaCloudLaunchCount, 0)
assert.equal(consumedAdmissionIds.has(korniaAdmission.admissionId), false)

const launch = await startCanonicalProfessionalGpuJob({
  launchRecordId: 'sam31-gpu-launch-1',
  admission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return structuredClone(launchTarget)
    },
  },
  launchPort: fixedPreparingPort(rawLaunchPort),
  store,
  startedAt: '2026-08-02T15:00:00.000Z',
})
assert.equal(cloudLaunchCount, 1)
const persistedEnvelope = await store.rereadExecutionEnvelope({
  envelopeId: 'sam31-gpu-admission-1.execution-envelope',
})
assert.ok(persistedEnvelope)
assert.ok(observedExecutionEnvelopeRef)
assert.equal(
  persistedEnvelope.approvedSnapshotRef.id,
  'approved-snapshot-1',
)
assert.equal(
  persistedEnvelope.callerCodeCommandImageModelPathUrlOrEnvironmentIncluded,
  false,
)
assert.equal(launch.launchDisposition, 'job_created')
assert.equal(launch.accelerator, 'nvidia_a100_80gb')
assert.equal(launch.minimumIdleInstances, 0)
assert.equal(launch.unknownOutcomeRetryAllowed, false)
assert.equal(launch.cpuOnlySubstantiveExecutionAllowed, false)
assert.equal(
  assertCanonicalProfessionalGpuJobLaunch(launch).launchHash,
  launch.launchHash,
)

await assert.rejects(() => startCanonicalProfessionalGpuJob({
  launchRecordId: 'sam31-gpu-launch-duplicate',
  admission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return structuredClone(launchTarget)
    },
  },
  launchPort: fixedPreparingPort({
    async startOneShotJob() {
      cloudLaunchCount += 1
      throw new Error('Duplicate launch must not reach the cloud port.')
    },
  }),
  store,
  startedAt: '2026-08-02T15:00:02.000Z',
}))
assert.equal(cloudLaunchCount, 1)

const terminal = await recordCanonicalProfessionalGpuJobTerminal({
  terminalRecordId: 'sam31-gpu-terminal-1',
  launch,
  terminalObservationPort: {
    async rereadTerminalUsagePriceAndCost() {
      return buildTerminalObservation({
        id: 'sam31-cloud-terminal-1',
        launch,
        terminalOutcome: 'completed',
        substantiveWorkOutcome: 'executed',
        observedAt: '2026-08-02T15:05:00.000Z',
      })
    },
  },
  store,
})
assert.equal(terminal.workerStoppedVerified, true)
assert.equal(terminal.activeGpuInstancesAfterTerminalObservation, 0)
assert.notEqual(
  terminal.cloudCapacityTeardownObservationRef.id,
  terminal.cloudTerminalObservationRef.id,
)
assert.equal(terminal.minimumIdleInstances, 0)
assert.equal(terminal.customerWalletOrLedgerMutated, false)
assert.equal(
  assertCanonicalProfessionalGpuJobTerminal(terminal).terminalHash,
  terminal.terminalHash,
)

const knownStopUnknownWorkTerminal =
  await recordCanonicalProfessionalGpuJobTerminal({
    terminalRecordId: 'sam31-gpu-terminal-known-stop-unknown-work',
    launch,
    terminalObservationPort: {
      async rereadTerminalUsagePriceAndCost() {
        return buildTerminalObservation({
          id: 'sam31-cloud-terminal-known-stop-unknown-work',
          launch,
          terminalOutcome: 'completed',
          substantiveWorkOutcome: 'unknown',
          observedAt: '2026-08-02T15:05:30.000Z',
        })
      },
    },
    store,
  })
assert.equal(knownStopUnknownWorkTerminal.workerStoppedVerified, true)
assert.equal(
  knownStopUnknownWorkTerminal.activeGpuInstancesAfterTerminalObservation,
  0,
)
assert.equal(knownStopUnknownWorkTerminal.unknownOutcomeBlocksRetry, true)

const unknownAdmission = buildAdmission(
  'sam31-gpu-admission-unknown',
  'sam31-attempt-unknown',
)
const unknownLaunch = await startCanonicalProfessionalGpuJob({
  launchRecordId: 'sam31-gpu-launch-unknown',
  admission: unknownAdmission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return {
        ...structuredClone(launchTarget),
        releaseRef: unknownAdmission.runtimeReleaseRef,
      }
    },
  },
  launchPort: fixedPreparingPort({
    async startOneShotJob() {
      throw new Error('Synthetic network abort with unknown cloud outcome.')
    },
  }),
  store,
  startedAt: '2026-08-02T15:10:00.000Z',
})
assert.equal(unknownLaunch.launchDisposition, 'job_creation_outcome_unknown')
assert.equal(unknownLaunch.unknownOutcomeRetryAllowed, false)
const unknownTerminal = await recordCanonicalProfessionalGpuJobTerminal({
  terminalRecordId: 'sam31-gpu-terminal-unknown',
  launch: unknownLaunch,
  terminalObservationPort: {
    async rereadTerminalUsagePriceAndCost() {
      return buildTerminalObservation({
        id: 'sam31-cloud-terminal-unknown',
        launch: unknownLaunch,
        terminalOutcome: 'outcome_unknown_requires_reconciliation',
        substantiveWorkOutcome: 'unknown',
        observedAt: '2026-08-02T15:11:00.000Z',
      })
    },
  },
  store,
})
assert.equal(unknownTerminal.workerStoppedVerified, false)
assert.equal(unknownTerminal.activeGpuInstancesAfterTerminalObservation, null)
assert.equal(unknownTerminal.unknownOutcomeBlocksRetry, true)
assert.equal(
  unknownTerminal.retryAllowedWithoutCanonicalReconciliation,
  false,
)

const mismatchedObservation = buildTerminalObservation({
  id: 'sam31-cloud-terminal-mismatch',
  launch,
  terminalOutcome: 'completed',
  substantiveWorkOutcome: 'executed',
  observedAt: '2026-08-02T15:06:00.000Z',
})
const mismatchedPayload = {
  ...mismatchedObservation,
  launchRef: ref('different-gpu-launch'),
}
Reflect.deleteProperty(mismatchedPayload, 'observationHash')
await assert.rejects(() => recordCanonicalProfessionalGpuJobTerminal({
  terminalRecordId: 'sam31-gpu-terminal-mismatch',
  launch,
  terminalObservationPort: {
    async rereadTerminalUsagePriceAndCost() {
      return {
        ...mismatchedPayload,
        observationHash: sha256AuthorityValue(mismatchedPayload),
      }
    },
  },
  store,
}))

const tamperedObservation = buildTerminalObservation({
  id: 'sam31-cloud-terminal-tampered',
  launch,
  terminalOutcome: 'completed',
  substantiveWorkOutcome: 'executed',
  observedAt: '2026-08-02T15:07:00.000Z',
})
await assert.rejects(() => recordCanonicalProfessionalGpuJobTerminal({
  terminalRecordId: 'sam31-gpu-terminal-tampered',
  launch,
  terminalObservationPort: {
    async rereadTerminalUsagePriceAndCost() {
      return {
        ...tamperedObservation,
        workerStoppedVerified: false,
      }
    },
  },
  store,
}))

const wrongTargetAdmission = buildAdmission(
  'sam31-gpu-admission-wrong-target',
  'sam31-attempt-wrong-target',
)
await assert.rejects(() => startCanonicalProfessionalGpuJob({
  launchRecordId: 'sam31-gpu-launch-wrong-target',
  admission: wrongTargetAdmission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return {
        ...structuredClone(launchTarget),
        releaseRef: wrongTargetAdmission.runtimeReleaseRef,
        operationId: 'tool.ffmpeg.professional_media_processing.v1',
      }
    },
  },
  launchPort: {
    async startOneShotJob() {
      throw new Error('A mismatched target must not reach launch.')
    },
  },
  store,
  startedAt: '2026-08-02T15:15:00.000Z',
}))

const hostileEnvelopeAdmission = buildAdmission(
  'sam31-gpu-admission-hostile-envelope',
  'sam31-attempt-hostile-envelope',
)
let hostileEnvelopeCloudLaunchCount = 0
await assert.rejects(() => startCanonicalProfessionalGpuJob({
  launchRecordId: 'sam31-gpu-launch-hostile-envelope',
  admission: hostileEnvelopeAdmission,
  releaseReadPort: {
    async rereadPrivateLaunchTarget() {
      return {
        ...structuredClone(launchTarget),
        releaseRef: hostileEnvelopeAdmission.runtimeReleaseRef,
      }
    },
  },
  launchPort: {
    async startOneShotJob() {
      hostileEnvelopeCloudLaunchCount += 1
      throw new Error('Hostile envelope must not reach cloud launch.')
    },
  },
  store: {
    ...store,
    async rereadExecutionEnvelope() {
      return new Proxy({}, {
        ownKeys() {
          throw new Error('Hostile envelope ownKeys trap must be contained.')
        },
      }) as CanonicalProfessionalGpuExecutionEnvelope
    },
  },
  startedAt: '2026-08-02T15:16:00.000Z',
}))
assert.equal(hostileEnvelopeCloudLaunchCount, 0)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-job-lifecycle',
  checks: 47,
  rawSam31CloudLaunchPortAccepted: false,
  rawPortRejectedBeforeAdmissionConsumption: true,
  canonicalFixedTaskPreparingPortRequired: true,
  rawKorniaL4TaskQaLaunchPortAccepted: false,
  cloudLaunchCount,
  duplicateLaunchBlocked: true,
  acceptedJobStartsFromConsumedAdmission: true,
  terminalGpuInstances: terminal.activeGpuInstancesAfterTerminalObservation,
  unknownOutcomeRetryBlocked: unknownTerminal.unknownOutcomeBlocksRetry,
  cpuOnlySubstantiveExecutionAllowed:
    launch.cpuOnlySubstantiveExecutionAllowed,
  customerWalletMutationPerformed: terminal.customerWalletOrLedgerMutated,
  productionAuthorityGranted: terminal.productionAuthorityGranted,
}))

function fixedPreparingPort(
  delegate: CanonicalProfessionalGpuCloudJobLaunchPort,
): CanonicalProfessionalGpuCloudJobLaunchPort {
  return createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort({
    descriptor: {
      schemaVersion:
        'canonical-professional-gpu-fixed-task-preparing-launch-port-v1',
      toolId: launchTarget.toolId,
      operationId: launchTarget.operationId,
      fixedServerTaskContractRef: launchTarget.fixedServerTaskContractRef,
      approvedTaskMaterialPreparedBeforeTaskContextRead: true,
      canonicalTaskContextRereadBeforeCloudJobCreation: true,
      fixedTaskPersistedAndRereadBeforeCloudJobCreation: true,
      rawCloudLaunchPortAcceptedForFixedTaskTool: false,
    },
    delegate,
  })
}

function buildTerminalObservation(input: {
  id: string
  launch: CanonicalProfessionalGpuJobLaunch
  terminalOutcome:
    | 'completed'
    | 'failed'
    | 'canceled'
    | 'outcome_unknown_requires_reconciliation'
  substantiveWorkOutcome: 'executed' | 'not_executed' | 'unknown'
  observedAt: string
}) {
  const cloudOutcomeUnknown = input.terminalOutcome ===
    'outcome_unknown_requires_reconciliation'
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-terminal-observation-v1' as const,
    source:
      'canonical_server_cloud_terminal_usage_and_cost_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    launchRef: {
      id: input.launch.launchRecordId,
      version: 1,
      contentHash: `sha256:${input.launch.launchHash}` as const,
    },
    cloudJobExecutionRef: input.launch.cloudJobExecutionRef,
    cloudTerminalObservationRef: ref(input.id),
    cloudCapacityTeardownObservationRef:
      ref(`${input.id}-capacity-teardown`),
    workerUsageEvidenceRef: ref(`${input.id}-worker-usage`),
    currentAccountPriceAuthorityRef: ref(`${input.id}-account-price`),
    attemptCostReceiptRef: ref(`${input.id}-attempt-cost`),
    terminalOutcome: input.terminalOutcome,
    providerInferenceOrSubstantiveWorkOutcome:
      input.substantiveWorkOutcome,
    cloudJobTerminalStateReread: !cloudOutcomeUnknown,
    workerStoppedVerified: !cloudOutcomeUnknown,
    activeGpuInstancesAfterTerminalObservation:
      cloudOutcomeUnknown ? null : 0,
    exactPlatformUsageAndAccountPriceReread: true as const,
    costReceiptPersistedBeforeSettlement: true as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    callerOrPlanTerminalClaimAccepted: false as const,
    observedAt: input.observedAt,
  }
  return {
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  }
}

function buildAdmission(admissionId: string, executionAttemptId: string) {
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-dispatch-admission-v1' as const,
    source: 'canonical_server_professional_gpu_dispatch_owner' as const,
    admissionId,
    toolId: 'sam3_1' as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary' as const,
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
      approvedWorkItemRef: ref('sam31-work-1'),
      workerLeaseRef: ref(`${executionAttemptId}-lease`),
      fundedReservationRef: ref('funded-reservation-1'),
      userApprovalRecordRef: ref('user-approval-1'),
      userTriggerRecordRef: ref(`${executionAttemptId}-trigger`),
      executionAttemptRef: ref(executionAttemptId),
      idempotencyKey: `${executionAttemptId}.idempotency`,
    },
    estimateRef: ref('sam31-estimate-1'),
    estimateMaximumReservedToolCostCredits: 100,
    currentRateAuthorityRef: ref('sam31-current-rate-1'),
    placementPolicyRef: {
      schemaVersion:
        'canonical-quality-first-professional-tool-gpu-placement-v1' as const,
      policyHash: sha256AuthorityValue('placement-policy'),
      entryHash: sha256AuthorityValue('placement-entry'),
    },
    gpuPolicyRef: {
      schemaVersion:
        'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v3' as const,
      policyHash: sha256AuthorityValue('gpu-policy'),
    },
    runtimeReleaseRef: ref('sam31-private-runtime-release-1'),
    priorPrimaryTerminalReceiptRef: null,
    priorPrimaryFailureClass: 'not_applicable' as const,
    priorPrimaryOutcomeKnownNotExecuted: false,
    admittedAttemptOrdinal: 1 as const,
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
    admittedAt: '2026-08-02T14:59:00.000Z',
    expiresAt: '2026-08-02T16:00:00.000Z',
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function buildKorniaAdmission() {
  const samAdmission = buildAdmission(
    'track-all-l4-qa-admission-1',
    'track-all-l4-qa-attempt-1',
  )
  const { admissionHash: _admissionHash, ...samPayload } = samAdmission
  void _admissionHash
  const payload = {
    ...samPayload,
    toolId: 'kornia',
    operationId: 'tool.kornia.refine_mask.v1',
    routeId: 'l4_standard_primary' as const,
    runtimeReleaseRef: ref('track-all-l4-qa-runtime-release-1'),
    currentRateAuthorityRef: ref('track-all-l4-qa-rate-1'),
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function hash(value: string) {
  return `sha256:${sha256AuthorityValue(value)}`
}

function createOnce(
  identities: Set<string>,
  identity: string,
): 'created' | 'already_exists' {
  if (identities.has(identity)) return 'already_exists'
  identities.add(identity)
  return 'created'
}

function ref(id: string) {
  return { id, version: 1, contentHash: hash(id) }
}
