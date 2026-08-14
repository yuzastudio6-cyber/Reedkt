import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalProfessionalGpuJobTerminalSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31PrivateCompleteSourceChunkTerminalOwner,
  createCanonicalSam31PrivateCompleteSourceChunkTerminalRepository,
} from '../services/canonical-sam3_1-private-complete-source-chunk-terminal-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31GpuRuntimeResultAdmissionSchema,
  canonicalSam31PrivateOutputRereadEvidenceSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  canonicalSam31PrivateCompleteSourceTerminalSmokeFixture as fixture,
} from './canonical-sam3_1-private-complete-source-chunk-launch-owner-smoke'

const task = assertCanonicalSam31GpuTaskRecord(
  await fixture.taskStore.rereadTask(
    fixture.plan.chunks[0].privateInvocationId,
  ),
)
const launchRef = fixture.launchResult.canonicalProfessionalLaunchRef
assert.ok(launchRef)
const launch = await fixture.gpuLifecycleStore.rereadLaunchRecord({
  launchRecordId: launchRef.id,
})
assert.ok(launch)
const frameCount = fixture.plan.chunks[0].canonicalEndFrameInclusive
  - fixture.plan.chunks[0].canonicalStartFrameInclusive + 1
const terminal = buildTerminal()
await fixture.gpuLifecycleStore.createTerminalRecordOnly({ record: terminal })
const output = buildOutput(frameCount)
const result = buildResult({ frameCount, output })
const objects = new Map<string, Buffer>()
const repository =
  createCanonicalSam31PrivateCompleteSourceChunkTerminalRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/sam31-private-complete-source-terminals',
  })
let finalizationCalls = 0
const owner = createOwner({ repository, result, output })
const completed = await owner.finalize({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  finalizedAt: '2026-08-13T16:16:00.000Z',
})
assert.equal(owner.privateInternalOnly, true)
assert.equal(owner.customerOrPublicDispatchAuthorized, false)
assert.equal(completed.providerOutcome, 'executed')
assert.equal(completed.runtimeStatus, 'completed')
assert.equal(completed.chunkOrdinal, 1)
assert.equal(completed.activeGpuExecutionsAfterTerminal, 0)
assert.equal(completed.minimumIdleGpuInstancesAfterTerminal, 0)
assert.equal(completed.scaleBackToZeroVerified, true)
assert.equal(completed.nextChunkTaskMaterializationAllowed, true)
assert.equal(completed.customerCreditsMutated, false)
assert.equal(completed.productionAuthorityGranted, false)
assert.equal(
  completed.accountEffectiveAttemptCostReceiptRef.contentHash,
  result.attemptCostReceiptRef.contentHash,
)
assert.equal(
  completed.privateOutputRereadEvidenceRef.contentHash,
  result.privateOutputRereadEvidenceRef.contentHash,
)
assert.equal(finalizationCalls, 1)

const replay = await owner.finalize({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  finalizedAt: '2026-08-13T16:16:00.000Z',
})
assert.equal(replay.terminalHash, completed.terminalHash)
assert.equal(finalizationCalls, 1)
assert.throws(() =>
  fixture.plan.chunks.length === 49
    ? createCanonicalSam31PrivateCompleteSourceChunkTerminalRepository({
      objectPort: memoryObjectPort(new Map()),
      prefix: '../unsafe',
    })
    : null,
)

const truncatedOutput = buildOutput(frameCount - 1)
const truncatedResult = buildResult({
  frameCount: frameCount - 1,
  output: truncatedOutput,
})
const truncatedOwner = createOwner({
  repository:
    createCanonicalSam31PrivateCompleteSourceChunkTerminalRepository({
      objectPort: memoryObjectPort(new Map()),
      prefix: 'private/smoke/sam31-private-truncated-terminal',
    }),
  result: truncatedResult,
  output: truncatedOutput,
})
await assert.rejects(() => truncatedOwner.finalize({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  finalizedAt: '2026-08-13T16:16:00.000Z',
}), /complete output changed/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-complete-source-chunk-terminal-owner',
  checks: 34,
  exactCanonicalLaunchTerminalResultAndOutputReread: true,
  accountEffectiveAttemptCostBound: true,
  scaleBackToZeroRequiredBeforeNextChunk: true,
  truncatedChunkOutputRejected: true,
  replayRepeatedNoFinalization: true,
  customerCreditsMutated: completed.customerCreditsMutated,
  publicDeliveryAuthorized: completed.publicDeliveryAuthorized,
  productionAuthorityGranted: completed.productionAuthorityGranted,
}))

function createOwner(input: {
  repository: ReturnType<
    typeof createCanonicalSam31PrivateCompleteSourceChunkTerminalRepository
  >
  result: ReturnType<typeof buildResult>
  output: ReturnType<typeof buildOutput>
}) {
  return createCanonicalSam31PrivateCompleteSourceChunkTerminalOwner({
    executionPlanRepository: fixture.planRepository,
    materializationRepository: fixture.materializationRepository,
    launchRepository: fixture.launchRepository,
    taskStore: fixture.taskStore,
    resultFinalizationPort: {
      schemaVersion:
        'canonical-sam3_1-private-complete-source-chunk-result-finalization-port-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async finalize() {
        finalizationCalls += 1
        return structuredClone(input.result)
      },
    },
    resultReadPort: {
      schemaVersion:
        'canonical-sam3_1-private-complete-source-chunk-result-read-port-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async rereadLaunch() { return structuredClone(launch) },
      async rereadTerminal() { return structuredClone(terminal) },
      async rereadResultAdmission() {
        return structuredClone(input.result)
      },
      async rereadPrivateOutputEvidence() {
        return structuredClone(input.output)
      },
    },
    repository: input.repository,
  })
}

function buildTerminal() {
  const payload = {
    schemaVersion: 'canonical-professional-gpu-job-terminal-v1' as const,
    source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
    terminalRecordId: `${task.invocationId}:terminal`,
    launchRef,
    admissionRef: launch!.admissionRef,
    cloudJobExecutionRef: launch!.cloudJobExecutionRef,
    cloudTerminalObservationRef: ref('private-chunk-1-cloud-terminal'),
    cloudCapacityTeardownObservationRef:
      ref('private-chunk-1-capacity-zero'),
    workerUsageEvidenceRef: ref('private-chunk-1-worker-usage'),
    currentAccountPriceAuthorityRef:
      fixture.plan.accountEffectiveRateAuthorityRef,
    attemptCostReceiptRef: ref('private-chunk-1-attempt-cost'),
    terminalOutcome: 'completed' as const,
    providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
    cloudJobTerminalStateReread: true as const,
    workerStoppedVerified: true as const,
    activeGpuInstancesAfterTerminalObservation: 0 as const,
    minimumIdleInstances: 0 as const,
    retryAllowedWithoutCanonicalReconciliation: false as const,
    unknownOutcomeBlocksRetry: false as const,
    exactPlatformUsageAndAccountPriceReread: true as const,
    costReceiptPersistedBeforeSettlement: true as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: '2026-08-13T16:15:00.000Z',
  }
  return canonicalProfessionalGpuJobTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

function buildOutput(propagatedFrameCount: number) {
  const manifestHash = sha256AuthorityValue(
    `private-chunk-1-manifest:${propagatedFrameCount}`,
  )
  const payload = {
    schemaVersion: 'canonical-sam3_1-private-output-reread-evidence-v1' as const,
    source: 'canonical_server_sam3_1_private_output_reader' as const,
    evidenceClass: 'canonical_private_reread' as const,
    taskRef: ref(task.taskId, task.taskRecordHash),
    runtimeResponseObjectRef:
      ref(`private-chunk-1-response-${propagatedFrameCount}`),
    runtimeResponseBindingSha256:
      sha256AuthorityValue(`private-chunk-1-response-binding-${propagatedFrameCount}`),
    manifestRef: ref(
      `private-chunk-1-manifest-${propagatedFrameCount}`,
      manifestHash,
    ),
    manifestSha256: manifestHash,
    manifestByteLength: 2_048,
    maskSequenceArtifactRef:
      ref(`private-chunk-1-mask-sequence-${propagatedFrameCount}`),
    maskFileCount: propagatedFrameCount,
    combinedMaskByteLength: propagatedFrameCount * 512,
    width: fixture.plan.sourceWidth,
    height: fixture.plan.sourceHeight,
    firstFrameIndex: 0,
    lastFrameIndex: propagatedFrameCount - 1,
    propagatedFrameCount,
    distinctObjectIds: [1],
    responseCreateOnlyPersistenceVerified: true as const,
    exactResponseBytesReread: true as const,
    exactManifestBytesRereadAndParsed: true as const,
    everyMaskPngByteHashReread: true as const,
    everyMaskPngDecodedDimensionsMatchSource: true as const,
    completeApprovedFrameIntervalCoverageVerified: true as const,
    noUnexpectedFilesOrCrossInvocationArtifacts: true as const,
    sourceCheckpointOrTaskBytesMutated: false as const,
    pathsUrlsCredentialsOrMediaBytesIncluded: false as const,
    qaApproved: false as const,
    assetManifestMutated: false as const,
    customerCreditsMutated: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    rereadAt: '2026-08-13T16:15:10.000Z',
  }
  return canonicalSam31PrivateOutputRereadEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function buildResult(input: {
  frameCount: number
  output: ReturnType<typeof buildOutput>
}) {
  const payload = {
    schemaVersion: 'canonical-sam3_1-gpu-runtime-result-admission-v1' as const,
    source: 'canonical_server_sam3_1_gpu_runtime_result_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'ready_for_independent_mask_artifact_qa' as const,
    resultAdmissionId: `private-chunk-1-result-${input.frameCount}`,
    taskRef: ref(task.taskId, task.taskRecordHash),
    runtimeRequestRef: task.runtimeRequestRef,
    dispatchAdmissionRef: task.dispatchAdmissionRef,
    admissionConsumptionRef: task.admissionConsumptionRef,
    executionEnvelopeRef: task.executionEnvelopeRef,
    runtimeReleaseRef: task.runtimeReleaseRef,
    specializedRuntimeReleaseRef: task.specializedRuntimeReleaseRef,
    launchRef,
    terminalRef: ref(terminal.terminalRecordId, terminal.terminalHash),
    cloudJobExecutionRef: launch!.cloudJobExecutionRef!,
    workerUsageEvidenceRef: terminal.workerUsageEvidenceRef,
    currentAccountPriceAuthorityRef:
      terminal.currentAccountPriceAuthorityRef,
    attemptCostReceiptRef: terminal.attemptCostReceiptRef,
    privateOutputRereadEvidenceRef:
      ref(
        `sam31-private-output-reread:${input.output.runtimeResponseObjectRef.id}`,
        input.output.evidenceHash,
      ),
    runtimeResponseObjectRef: input.output.runtimeResponseObjectRef,
    runtimeResponseBindingSha256:
      input.output.runtimeResponseBindingSha256,
    manifestRef: input.output.manifestRef,
    maskSequenceArtifactRef: input.output.maskSequenceArtifactRef,
    routeId: fixture.plan.routeId,
    accelerator: 'nvidia_a100_80gb' as const,
    wallTimeMilliseconds: 85_000,
    cudaEventInferenceMilliseconds: 55_000,
    peakCudaAllocatedBytes: 42_000_000_000,
    propagatedFrameCount: input.frameCount,
    maskFileCount: input.frameCount,
    exactTaskResponseLaunchTerminalAndOutputReread: true as const,
    exactGpuAndApprovedFrameRangeVerified: true as const,
    actualNvdecCudaBfloat16ExecutionVerified: true as const,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true as const,
    accountEffectiveAttemptCostReceiptPersisted: true as const,
    independentMaskArtifactQaPending: true as const,
    assetManifestReconciliationPending: true as const,
    rendererLayerAdmissionPending: true as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    assetManifestMutated: false as const,
    renderAuthorized: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    admittedAt: '2026-08-13T16:15:20.000Z',
  }
  return canonicalSam31GpuRuntimeResultAdmissionSchema.parse({
    ...payload,
    resultAdmissionHash: sha256AuthorityValue(payload),
  })
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const existing = values.get(input.objectPath)
      if (existing) {
        if (!existing.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function ref(id: string, raw = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}
