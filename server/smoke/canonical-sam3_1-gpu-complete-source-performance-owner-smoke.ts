import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
import {
  canonicalSam31GpuCompleteSourceExecutionObservationRef,
  canonicalSam31GpuCompleteSourceStitchEvidenceRef,
  createCanonicalSam31GpuCompleteSourcePerformanceOwner,
  createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPort,
  createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPorts,
  createCanonicalSam31GpuCompleteSourcePerformanceRepository,
  persistCanonicalSam31GpuCompleteSourceOwnerInput,
  sealCanonicalSam31GpuCompleteSourceExecutionObservation,
  sealCanonicalSam31GpuCompleteSourceStitchEvidence,
  type CanonicalSam31GpuCompleteSourcePerformanceReadPort,
} from '../services/canonical-sam3_1-gpu-complete-source-performance-owner'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  buildCanonicalSam31A100RunFixture,
  type CanonicalSam31A100RunFixture,
  type CanonicalSam31A100RunFixtureRef,
} from './canonical-sam3_1-gpu-runtime-deterministic-qualification-owner-smoke'

const exactEightMinuteSourceRef = ref(
  'sam31-eight-minute-source',
  digest('sam31-eight-minute-source'),
)
const chunkPlanRef = ref(
  'sam31-eight-minute-chunk-plan',
  digest('sam31-eight-minute-chunk-plan'),
)
const sourceFrameCount = 11_520
const chunkFrameCount = 240
const chunkOverlapFrameCount = 1
const chunkStrideFrameCount = chunkFrameCount - chunkOverlapFrameCount
const exactChunkCount = Math.ceil(
  (sourceFrameCount - chunkFrameCount) / chunkStrideFrameCount,
) + 1
const fixtures = Array.from({ length: exactChunkCount }, (_, index) => {
  const canonicalStartFrameInclusive = index * chunkStrideFrameCount
  const decodedFrameCount = Math.min(
    chunkFrameCount,
    sourceFrameCount - canonicalStartFrameInclusive,
  )
  return buildCanonicalSam31A100RunFixture(index + 1, {
    invocationPrefix: 'sam31-eight-minute-run-01-chunk',
    exactSourceRef: exactEightMinuteSourceRef,
    maskProxyRef: ref(
      `sam31-eight-minute-run-01-mask-proxy-${index + 1}`,
      digest(`sam31-eight-minute-run-01-mask-proxy-${index + 1}`),
    ),
    canonicalStartFrameInclusive,
    decodedFrameCount,
    fpsNumerator: 24,
    uniqueChunkIdentity: true,
  })
})
const observation = sealCanonicalSam31GpuCompleteSourceExecutionObservation({
  schemaVersion:
    'canonical-sam3_1-gpu-complete-source-execution-observation-v1',
  source: 'canonical_sam3_1_gpu_complete_source_execution_telemetry_owner',
  evidenceClass: 'canonical_private_reread',
  status: 'complete_source_execution_observed',
  executionGroupId: 'sam31-eight-minute-execution-group-01',
  executionGroupVersion: 1,
  qualificationId: 'sam31-a100-runtime-qualification',
  runOrdinal: 1,
  exactEightMinuteSourceRef,
  sourceDurationMilliseconds: 480_000,
  sourceWidth: 2_160,
  sourceHeight: 3_840,
  sourceFrameCount,
  fpsNumerator: 24,
  fpsDenominator: 1,
  chunkPlanRef,
  route: {
    routeId: 'a100_80gb_heavy_primary',
    gpuProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
    runtimeRegion: 'us-central1',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
  },
  immutableImageDigest: fixtures[0].launch.immutableImageDigest,
  chunks: fixtures.map((fixture, index) => ({
    chunkOrdinal: index + 1,
    invocationId: fixture.request.invocationId,
    canonicalStartFrameInclusive:
      fixture.task.runtimeRequest.sourceMedia.canonicalSourceStartFrameInclusive,
    canonicalEndFrameInclusive:
      fixture.task.runtimeRequest.sourceMedia.canonicalSourceEndFrameInclusive,
    overlapWithPreviousFrames: index === 0 ? 0 : chunkOverlapFrameCount,
    taskRef: fixture.request.taskRef,
    launchRef: fixture.request.launchRef,
    resultAdmissionRef: fixture.request.resultAdmissionRef,
    runtimeResponseObjectRef: fixture.request.runtimeResponseObjectRef,
  })),
  phaseObservationRefs: {
    userTriggeredExecutionGroupRef: ref('sam31-user-triggered-group-01'),
    cloudProvisioningObservationSetRef:
      ref('sam31-cloud-provisioning-set-01'),
    workerPhaseTelemetrySetRef: ref('sam31-worker-telemetry-set-01'),
    terminalCapacityObservationSetRef:
      ref('sam31-terminal-capacity-set-01'),
    accountEffectiveCostReceiptSetRef:
      ref('sam31-account-effective-cost-set-01'),
  },
  phaseTiming: {
    wallTimeMilliseconds: 420_000,
    coldStartAndImagePullMilliseconds: 40_000,
    modelLoadMilliseconds: 60_000,
    decodePromptPropagationAndStitchMilliseconds: 300_000,
    outputPersistenceAndExactRereadMilliseconds: 20_000,
  },
  exactCloudJobWorkerAndPhaseTimestampsReread: true,
  everyChunkTerminalAndAccountEffectiveCostReread: true,
  allGpuCapacityStoppedAfterTerminal: true,
  maximumActiveGpuJobsAfterTerminal: 0,
  callerTimingOrCompletionClaimsAccepted: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  observedAt: '2026-08-04T19:07:00.000Z',
})
const executionGroupObservationRef =
  canonicalSam31GpuCompleteSourceExecutionObservationRef(observation)
const stitchedOutputMaskSetDigestSha256 = digest(
  'sam31-eight-minute-stitched-mask-set',
)
const stitch = sealCanonicalSam31GpuCompleteSourceStitchEvidence({
  schemaVersion: 'canonical-sam3_1-gpu-complete-source-stitch-evidence-v1',
  source: 'canonical_track_all_sam3_1_mask_stitch_owner',
  evidenceClass: 'canonical_private_reread',
  status: 'complete_source_stitch_evidence_ready',
  stitchEvidenceId: 'sam31-eight-minute-stitch-01',
  stitchEvidenceVersion: 1,
  executionGroupRef: executionGroupObservationRef,
  exactEightMinuteSourceRef,
  chunkPlanRef,
  orderedChunkResultRefs: fixtures.map((fixture) =>
    fixture.request.resultAdmissionRef),
  stitchedMaskSequenceRef: ref(
    'sam31-eight-minute-stitched-mask-sequence-01',
    stitchedOutputMaskSetDigestSha256,
  ),
  stitchedOutputMaskSetDigestSha256,
  sourceWidth: 2_160,
  sourceHeight: 3_840,
  sourceFrameCount: 11_520,
  firstFrameIndex: 0,
  lastFrameIndex: 11_519,
  everyExpectedFrameAndObjectPresent: true,
  completeIntervalNoGapCoverageVerified: true,
  deterministicOverlapReconciliationVerified: true,
  everyMaskMatchesSourceGeometry: true,
  sourceResolutionPreserved: true,
  quantizationOrDownscaleUsed: false,
  exactStitchedManifestAndEveryMaskByteReread: true,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
  assetManifestMutated: false,
  qaApprovalGranted: false,
  customerCreditsMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  stitchedAt: '2026-08-04T19:06:30.000Z',
})
const stitchEvidenceRef =
  canonicalSam31GpuCompleteSourceStitchEvidenceRef(stitch)
const request = {
  performanceEvidenceId: 'sam31-eight-minute-performance-evidence-01',
  executionGroupObservationRef,
  stitchEvidenceRef,
}
const repository =
  createCanonicalSam31GpuCompleteSourcePerformanceRepository({
    objectPort: memoryObjectPort(new Map()),
  })
const owner = createCanonicalSam31GpuCompleteSourcePerformanceOwner({
  readPort: fixtureReadPort(fixtures),
  repository,
  now: () => '2026-08-04T19:08:00.000Z',
})
const evidence = await owner.compileAndPersistPerformanceEvidence(request)
assert.equal(evidence.sourceDurationMilliseconds, 480_000)
assert.equal(evidence.sourceFrameCount, 11_520)
assert.equal(evidence.chunkCount, 49)
assert.equal(evidence.phaseTiming.wallTimeMilliseconds, 420_000)
assert.equal(evidence.route.accelerator, 'nvidia_a100_80gb')
assert.equal(evidence.sourceResolutionAndCompleteFrameRangePreserved, true)
assert.equal(evidence.everyChunkTaskResponseResultAndTerminalCostReread, true)
assert.equal(evidence.allGpuCapacityStoppedAfterTerminal, true)
assert.equal(evidence.automaticQualityReductionAllowed, false)
export {
  evidence as canonicalSam31A100CompleteSourcePerformanceEvidenceFixture,
}
const replay = await owner.compileAndPersistPerformanceEvidence(request)
assert.deepEqual(replay, evidence)

const wiredStorage = new Map<string, Buffer>()
const wiredObjectPort = memoryObjectPort(wiredStorage)
const wiredTaskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort: wiredObjectPort,
})
const wiredResultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort: wiredObjectPort,
})
const wiredLifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort: wiredObjectPort,
})
const wiredRefs = await persistCanonicalSam31GpuCompleteSourceOwnerInput({
  objectPort: wiredObjectPort,
  observation,
  stitchEvidence: stitch,
})
for (const fixture of fixtures) {
  await wiredTaskStore.persistTaskCreateOnly(fixture.task)
  await wiredLifecycleStore.createLaunchRecordOnly({ record: fixture.launch })
  await wiredLifecycleStore.createTerminalRecordOnly({
    record: fixture.terminal,
  })
  await wiredResultStore.persistPrivateOutputRereadEvidenceCreateOnly(
    fixture.request.invocationId,
    fixture.privateOutput,
  )
  await wiredResultStore.persistResultAdmissionCreateOnly(fixture.result)
  const responseBody = Buffer.from(
    stableAuthorityStringify(fixture.response),
    'utf8',
  )
  await wiredObjectPort.createOnly({
    objectPath:
      `private/canonical-professional-gpu/sam3_1/v1/invocations/${fixture.request.invocationId}/response.json`,
    body: responseBody,
    contentSha256: digest(responseBody),
  })
}
const wiredOwner =
  createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPort({
    objectPort: wiredObjectPort,
    now: () => '2026-08-04T19:08:30.000Z',
  })
const wiredEvidence = await wiredOwner.compileAndPersistPerformanceEvidence({
  performanceEvidenceId: 'sam31-eight-minute-performance-evidence-wired',
  ...wiredRefs,
})
assert.equal(wiredEvidence.chunkCount, 49)
assert.equal(wiredEvidence.phaseTiming.wallTimeMilliseconds, 420_000)

const splitControlObjectPort = memoryObjectPort(new Map())
const splitPrivateObjectPort = memoryObjectPort(new Map())
const splitTaskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort: splitPrivateObjectPort,
})
const splitResultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort: splitPrivateObjectPort,
})
const splitLifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort: splitControlObjectPort,
})
const splitRefs = await persistCanonicalSam31GpuCompleteSourceOwnerInput({
  objectPort: splitControlObjectPort,
  observation,
  stitchEvidence: stitch,
})
for (const fixture of fixtures) {
  await splitTaskStore.persistTaskCreateOnly(fixture.task)
  await splitLifecycleStore.createLaunchRecordOnly({ record: fixture.launch })
  await splitLifecycleStore.createTerminalRecordOnly({
    record: fixture.terminal,
  })
  await splitResultStore.persistPrivateOutputRereadEvidenceCreateOnly(
    fixture.request.invocationId,
    fixture.privateOutput,
  )
  await splitResultStore.persistResultAdmissionCreateOnly(fixture.result)
  const responseBody = Buffer.from(
    stableAuthorityStringify(fixture.response),
    'utf8',
  )
  await splitPrivateObjectPort.createOnly({
    objectPath:
      `private/canonical-professional-gpu/sam3_1/v1/invocations/${fixture.request.invocationId}/response.json`,
    body: responseBody,
    contentSha256: digest(responseBody),
  })
}
const splitEvidence = await
createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPorts({
  controlPlaneObjectPort: splitControlObjectPort,
  privateGpuObjectPort: splitPrivateObjectPort,
  now: () => '2026-08-04T19:10:00.000Z',
}).compileAndPersistPerformanceEvidence({
  performanceEvidenceId: 'sam31-eight-minute-performance-evidence-split-store',
  ...splitRefs,
})
assert.equal(splitEvidence.chunkCount, 49)
assert.equal(splitEvidence.phaseTiming.wallTimeMilliseconds, 420_000)

await assert.rejects(() => ownerWith({ missingChunk: 17 })
  .compileAndPersistPerformanceEvidence(request))
await assert.rejects(() => ownerWith({ missingTerminalChunk: 17 })
  .compileAndPersistPerformanceEvidence(request))
await assert.rejects(() => ownerWith({ missingPrivateOutputChunk: 17 })
  .compileAndPersistPerformanceEvidence(request))
const crossedPrivateOutput = structuredClone(fixtures[1].privateOutput)
crossedPrivateOutput.taskRef = fixtures[0].privateOutput.taskRef
crossedPrivateOutput.evidenceHash = privateOutputHash(crossedPrivateOutput)
const exactOutputReadPort = fixtureReadPort(fixtures)
await assert.rejects(() => createCanonicalSam31GpuCompleteSourcePerformanceOwner({
  readPort: {
    ...exactOutputReadPort,
    async rereadPrivateOutputEvidence(input) {
      return input.invocationId === fixtures[1].request.invocationId
        ? structuredClone(crossedPrivateOutput)
        : exactOutputReadPort.rereadPrivateOutputEvidence(input)
    },
  },
  repository: createCanonicalSam31GpuCompleteSourcePerformanceRepository({
    objectPort: memoryObjectPort(new Map()),
  }),
  now: () => '2026-08-04T19:08:00.000Z',
}).compileAndPersistPerformanceEvidence(request))
const crossedTerminal = structuredClone(fixtures[1].terminal)
crossedTerminal.workerUsageEvidenceRef =
  fixtures[0].terminal.workerUsageEvidenceRef
crossedTerminal.terminalHash = terminalHash(crossedTerminal)
const exactReadPort = fixtureReadPort(fixtures)
await assert.rejects(() => createCanonicalSam31GpuCompleteSourcePerformanceOwner({
  readPort: {
    ...exactReadPort,
    async rereadTerminal(input) {
      return input.invocationId === fixtures[1].request.invocationId
        ? structuredClone(crossedTerminal)
        : exactReadPort.rereadTerminal(input)
    },
  },
  repository: createCanonicalSam31GpuCompleteSourcePerformanceRepository({
    objectPort: memoryObjectPort(new Map()),
  }),
  now: () => '2026-08-04T19:08:00.000Z',
}).compileAndPersistPerformanceEvidence({
  ...request,
  executionGroupObservationRef,
}))
await assert.rejects(() => owner.compileAndPersistPerformanceEvidence({
  ...request,
  callerPerformanceQualified: true,
}))
const tamperedObservation = structuredClone(observation)
tamperedObservation.phaseTiming.wallTimeMilliseconds = 200_000
await assert.rejects(() => ownerWith({ observation: tamperedObservation })
  .compileAndPersistPerformanceEvidence(request))
const incompleteStitch = sealCanonicalSam31GpuCompleteSourceStitchEvidence({
  ...withoutKey(stitch, 'stitchEvidenceHash'),
  stitchEvidenceId: 'sam31-eight-minute-incomplete-stitch',
  orderedChunkResultRefs: stitch.orderedChunkResultRefs.slice(0, 48),
})
const incompleteStitchRef =
  canonicalSam31GpuCompleteSourceStitchEvidenceRef(incompleteStitch)
await assert.rejects(() => ownerWith({ stitch: incompleteStitch })
  .compileAndPersistPerformanceEvidence({
    ...request,
    stitchEvidenceRef: incompleteStitchRef,
  }))
assert.throws(() => sealCanonicalSam31GpuCompleteSourceExecutionObservation({
  ...withoutKey(observation, 'observationHash'),
  executionGroupId: 'sam31-eight-minute-gap-observation',
  chunks: observation.chunks.map((chunk, index) => index === 20
    ? { ...chunk, canonicalStartFrameInclusive:
      chunk.canonicalStartFrameInclusive + 1 }
    : chunk),
}))
assert.throws(() => sealCanonicalSam31GpuCompleteSourceExecutionObservation({
  ...withoutKey(observation, 'observationHash'),
  executionGroupId: 'sam31-eight-minute-duplicate-observation',
  chunks: observation.chunks.map((chunk, index) => index === 1
    ? { ...chunk, taskRef: observation.chunks[0].taskRef }
    : chunk),
}))
assert.throws(() => sealCanonicalSam31GpuCompleteSourceStitchEvidence({
  ...withoutKey(stitch, 'stitchEvidenceHash'),
  stitchEvidenceId: 'sam31-eight-minute-downscaled-stitch',
  quantizationOrDownscaleUsed: true,
}))
let getterInvoked = false
const accessor = Object.defineProperty({}, 'performanceEvidenceId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return request.performanceEvidenceId
  },
})
await assert.rejects(() => owner.compileAndPersistPerformanceEvidence(accessor))
assert.equal(getterInvoked, false)
const cyclic: Record<string, unknown> = { ...request }
cyclic.self = cyclic
await assert.rejects(() => owner.compileAndPersistPerformanceEvidence(cyclic))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-complete-source-performance-owner',
  checks: 50,
  exactEightMinuteSourceCovered: true,
  orderedChunkCount: 49,
  oneFrameCrossChunkOverlapRequired: true,
  finalPartialChunkFrameCount: 48,
  exactChunkTaskLaunchResponseResultAndCostReread: true,
  deterministicNoGapStitchRequired: true,
  wallClockPhaseTelemetryReread: true,
  scaleToZeroVerifiedForEveryChunk: true,
  durableCanonicalStoreFactoryWired: true,
  splitControlPlaneAndPrivateGpuStoresWired: true,
  callerPerformanceClaimsAccepted: false,
  liveGpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function fixtureReadPort(
  source: readonly CanonicalSam31A100RunFixture[],
  overrides: {
    readonly observation?: unknown
    readonly stitch?: unknown
    readonly missingChunk?: number
    readonly missingTerminalChunk?: number
    readonly missingPrivateOutputChunk?: number
  } = {},
): CanonicalSam31GpuCompleteSourcePerformanceReadPort {
  const byInvocation = new Map(source.map((fixture) => [
    fixture.request.invocationId,
    fixture,
  ]))
  const lookup = (invocationId: string) => {
    if (overrides.missingChunk !== undefined
      && invocationId.endsWith(
        String(overrides.missingChunk).padStart(2, '0'),
      )) return null
    return byInvocation.get(invocationId) ?? null
  }
  return {
    async rereadExecutionGroupObservation() {
      return structuredClone(overrides.observation ?? observation)
    },
    async rereadStitchEvidence() {
      return structuredClone(overrides.stitch ?? stitch)
    },
    async rereadTask({ invocationId, taskRef }) {
      const value = lookup(invocationId)
      return value && sameRef(value.request.taskRef, taskRef)
        ? structuredClone(value.task) : null
    },
    async rereadLaunch({ invocationId, launchRef }) {
      const value = lookup(invocationId)
      return value && sameRef(value.request.launchRef, launchRef)
        ? structuredClone(value.launch) : null
    },
    async rereadResultAdmission({ invocationId, resultAdmissionRef }) {
      const value = lookup(invocationId)
      return value && sameRef(value.request.resultAdmissionRef,
        resultAdmissionRef) ? structuredClone(value.result) : null
    },
    async rereadTerminal({ invocationId, terminalRef }) {
      if (overrides.missingTerminalChunk !== undefined
        && invocationId.endsWith(
          String(overrides.missingTerminalChunk).padStart(2, '0'),
        )) return null
      const value = lookup(invocationId)
      return value && sameRef({
        id: value.terminal.terminalRecordId,
        version: 1,
        contentHash: `sha256:${value.terminal.terminalHash}`,
      }, terminalRef) ? structuredClone(value.terminal) : null
    },
    async rereadPrivateOutputEvidence({
      invocationId,
      privateOutputRereadEvidenceRef,
    }) {
      if (overrides.missingPrivateOutputChunk !== undefined
        && invocationId.endsWith(
          String(overrides.missingPrivateOutputChunk).padStart(2, '0'),
        )) return null
      const value = lookup(invocationId)
      return value && sameRef({
        id: `sam31-private-output-reread:${value.privateOutput.runtimeResponseObjectRef.id}`,
        version: 1,
        contentHash: `sha256:${value.privateOutput.evidenceHash}`,
      }, privateOutputRereadEvidenceRef)
        ? structuredClone(value.privateOutput) : null
    },
    async rereadRuntimeResponse({ invocationId, runtimeResponseObjectRef }) {
      const value = lookup(invocationId)
      return value && sameRef(value.request.runtimeResponseObjectRef,
        runtimeResponseObjectRef) ? structuredClone(value.response) : null
    },
  }
}

function ownerWith(overrides: {
  readonly observation?: unknown
  readonly stitch?: unknown
  readonly missingChunk?: number
  readonly missingTerminalChunk?: number
  readonly missingPrivateOutputChunk?: number
}) {
  return createCanonicalSam31GpuCompleteSourcePerformanceOwner({
    readPort: fixtureReadPort(fixtures, overrides),
    repository:
      createCanonicalSam31GpuCompleteSourcePerformanceRepository({
        objectPort: memoryObjectPort(new Map()),
      }),
    now: () => '2026-08-04T19:08:00.000Z',
  })
}

function ref(
  id: string,
  hash = digest(id),
): CanonicalSam31A100RunFixtureRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function withoutKey<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(digest(input.body), input.contentSha256)
      if (storage.has(input.objectPath)) return 'already_exists'
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = storage.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function terminalHash(
  terminal: CanonicalSam31A100RunFixture['terminal'],
): string {
  return digest(stableAuthorityStringify(
    withoutKey(terminal, 'terminalHash'),
  ))
}

function privateOutputHash(
  evidence: CanonicalSam31A100RunFixture['privateOutput'],
): string {
  return digest(stableAuthorityStringify(
    withoutKey(evidence, 'evidenceHash'),
  ))
}
