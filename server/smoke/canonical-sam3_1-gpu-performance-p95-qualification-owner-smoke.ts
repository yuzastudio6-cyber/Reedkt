import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31GpuCompleteSourcePerformanceEvidence,
  canonicalSam31GpuCompleteSourcePerformanceEvidenceRef,
  createCanonicalSam31GpuCompleteSourcePerformanceRepository,
  type CanonicalSam31GpuCompleteSourcePerformanceEvidence,
} from '../services/canonical-sam3_1-gpu-complete-source-performance-owner'
import {
  createCanonicalSam31GpuPerformanceP95EvidenceRepository,
  createCanonicalSam31GpuPerformanceP95QualificationOwner,
  createCanonicalSam31GpuPerformanceP95QualificationOwnerFromObjectPort,
} from '../services/canonical-sam3_1-gpu-performance-p95-qualification-owner'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

type Ref = { id: string; version: 1; contentHash: `sha256:${string}` }

const wallTimes = [410_000, 424_000, 438_000, 452_000, 466_000]
const records = wallTimes.map((wallTime, index) =>
  completeSourceEvidence(index + 1, wallTime))
const recordMap = new Map(records.map((record) => [
  refKey(canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(record)),
  record,
]))
const request = {
  componentId: 'sam31-a100-eight-minute-performance',
  performanceQualificationId: 'sam31-a100-eight-minute-p95-set',
  qualificationId: 'sam31-a100-runtime-qualification',
  completeSourcePerformanceEvidenceRefs: records.map((record) =>
    canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(record)),
}
const objectPort = memoryObjectPort(new Map())
const p95Repository =
  createCanonicalSam31GpuPerformanceP95EvidenceRepository({ objectPort })
const componentRepository =
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort,
  })
const owner = createCanonicalSam31GpuPerformanceP95QualificationOwner({
  readPort: readPort(recordMap),
  p95Repository,
  componentRepository,
  now: () => '2026-08-04T20:00:00.000Z',
})
const component = await owner
  .compileAndPersistPerformanceQualificationComponent(request)
assert.equal(component.componentKind, 'eight_minute_performance')
if (component.componentKind !== 'eight_minute_performance') {
  throw new Error('Expected the eight-minute performance component.')
}
assert.equal(component.payload.measurements.length, 5)
assert.equal(component.payload.p95WallTimeMilliseconds, 466_000)
assert.equal(component.payload.targetWallTimeMilliseconds, 480_000)
assert.equal(component.payload.completeSourceIntervalCovered, true)
assert.equal(component.payload.automaticQualityReductionAllowed, false)
const persistedP95 = await p95Repository.rereadP95Evidence({
  evidenceRef:
    component.payload.eightMinuteSourcePerformanceQualificationRef,
})
assert.ok(persistedP95)
assert.equal(persistedP95.performanceEvidence.p95WallTimeMilliseconds, 466_000)
const replay = await owner
  .compileAndPersistPerformanceQualificationComponent(request)
assert.deepEqual(replay, component)

const maximumRecords = Array.from({ length: 30 }, (_, index) =>
  completeSourceEvidence(index + 1, 400_000 + index * 1_000))
const maximumComponent = await ownerWith(maximumRecords)
  .compileAndPersistPerformanceQualificationComponent({
    componentId: 'sam31-a100-eight-minute-performance-maximum-set',
    performanceQualificationId:
      'sam31-a100-eight-minute-p95-maximum-set',
    qualificationId: 'sam31-a100-runtime-qualification',
    completeSourcePerformanceEvidenceRefs: maximumRecords.map((record) =>
      canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(record)),
  })
assert.equal(maximumComponent.componentKind, 'eight_minute_performance')
if (maximumComponent.componentKind !== 'eight_minute_performance') {
  throw new Error('Expected the maximum-set performance component.')
}
assert.equal(maximumComponent.payload.measurements.length, 30)
assert.equal(maximumComponent.payload.p95WallTimeMilliseconds, 428_000)

const wiredStorage = new Map<string, Buffer>()
const wiredObjectPort = memoryObjectPort(wiredStorage)
const wiredPerformanceRepository =
  createCanonicalSam31GpuCompleteSourcePerformanceRepository({
    objectPort: wiredObjectPort,
  })
for (const record of records) {
  await wiredPerformanceRepository.persistPerformanceEvidenceCreateOnly({
    evidence: record,
  })
}
const wiredOwner =
  createCanonicalSam31GpuPerformanceP95QualificationOwnerFromObjectPort({
    objectPort: wiredObjectPort,
    now: () => '2026-08-04T20:00:30.000Z',
  })
const wiredComponent = await wiredOwner
  .compileAndPersistPerformanceQualificationComponent({
    ...request,
    componentId: 'sam31-a100-eight-minute-performance-wired',
    performanceQualificationId: 'sam31-a100-eight-minute-p95-set-wired',
  })
assert.equal(wiredComponent.componentKind, 'eight_minute_performance')

await assert.rejects(() => owner
  .compileAndPersistPerformanceQualificationComponent({
    ...request,
    completeSourcePerformanceEvidenceRefs:
      request.completeSourcePerformanceEvidenceRefs.slice(0, 4),
  }))
await assert.rejects(() => owner
  .compileAndPersistPerformanceQualificationComponent({
    ...request,
    completeSourcePerformanceEvidenceRefs: [
      ...request.completeSourcePerformanceEvidenceRefs.slice(0, 4),
      request.completeSourcePerformanceEvidenceRefs[0],
    ],
  }))
await assert.rejects(() => ownerWith(records, { missingIndex: 3 })
  .compileAndPersistPerformanceQualificationComponent(request))
await assert.rejects(() => owner
  .compileAndPersistPerformanceQualificationComponent({
    ...request,
    callerP95WallTimeMilliseconds: 1,
  }))
await rejectChangedRecord(records, 2, {
  route: {
    routeId: 'l4_heavy_fallback',
    gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
    runtimeRegion: 'us-central1',
    executionTarget: 'google_cloud_run_l4_job',
    machineType: 'cloud_run_nvidia_l4',
    accelerator: 'nvidia_l4',
  },
})
await rejectChangedRecord(records, 2, {
  immutableImageDigest: `sha256:${digest('cross-image')}`,
})
await rejectChangedRecord(records, 2, {
  exactEightMinuteSourceRef: ref('cross-source'),
})
await rejectChangedRecord(records, 2, { runOrdinal: 4 })
await rejectChangedRecords(records, new Map([
  [5, performanceTiming(490_000)],
]))
await rejectChangedRecord(records, 2, {
  fullSourceExecutionRef: records[0].fullSourceExecutionRef,
})
const tampered = structuredClone(records[1])
tampered.phaseTiming.wallTimeMilliseconds = 1
const tamperedMap = new Map(recordMap)
tamperedMap.set(
  refKey(request.completeSourcePerformanceEvidenceRefs[1]),
  tampered,
)
await assert.rejects(() => createOwner(tamperedMap)
  .compileAndPersistPerformanceQualificationComponent(request))
let getterInvoked = false
const accessor = Object.defineProperty({}, 'componentId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return request.componentId
  },
})
await assert.rejects(() => owner
  .compileAndPersistPerformanceQualificationComponent(accessor))
assert.equal(getterInvoked, false)
const cyclic: Record<string, unknown> = { ...request }
cyclic.self = cyclic
await assert.rejects(() => owner
  .compileAndPersistPerformanceQualificationComponent(cyclic))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-performance-p95-qualification-owner',
  checks: 40,
  minimumCompleteEightMinuteRunCount: 5,
  maximumCompleteEightMinuteRunCount: 30,
  testedCompleteEightMinuteRunCount: 5,
  nearestRankP95WallTimeMilliseconds: 466_000,
  exactCompleteSourceEvidenceReread: true,
  sameRouteImageSourceGeometryAndChunkPlanRequired: true,
  uniqueExecutionResultCostAndStitchLineageRequired: true,
  p95AboveEightMinutesRejected: true,
  durableP95AndComponentRepositoriesWired: true,
  callerMeasurementsOrP95Accepted: false,
  liveGpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

async function rejectChangedRecord(
  source: readonly CanonicalSam31GpuCompleteSourcePerformanceEvidence[],
  runOrdinal: number,
  changes: Record<string, unknown>,
) {
  const changed = source.map((record) => record.runOrdinal === runOrdinal
    ? completeSourceEvidence(runOrdinal,
      (changes.phaseTiming as { wallTimeMilliseconds?: number } | undefined)
        ?.wallTimeMilliseconds ?? record.phaseTiming.wallTimeMilliseconds,
      changes)
    : record)
  const changedRequest = {
    ...request,
    completeSourcePerformanceEvidenceRefs: changed.map((record) =>
      canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(record)),
  }
  await assert.rejects(() => ownerWith(changed)
    .compileAndPersistPerformanceQualificationComponent(changedRequest))
}

async function rejectChangedRecords(
  source: readonly CanonicalSam31GpuCompleteSourcePerformanceEvidence[],
  phaseTimings: ReadonlyMap<number, ReturnType<typeof performanceTiming>>,
) {
  const changed = source.map((record) => {
    const phaseTiming = phaseTimings.get(record.runOrdinal)
    return phaseTiming
      ? completeSourceEvidence(
        record.runOrdinal,
        phaseTiming.wallTimeMilliseconds,
        { phaseTiming },
      )
      : record
  })
  await assert.rejects(() => ownerWith(changed)
    .compileAndPersistPerformanceQualificationComponent({
      ...request,
      completeSourcePerformanceEvidenceRefs: changed.map((record) =>
        canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(record)),
    }))
}

function performanceTiming(wallTimeMilliseconds: number) {
  return {
    wallTimeMilliseconds,
    coldStartAndImagePullMilliseconds: 40_000,
    modelLoadMilliseconds: 60_000,
    decodePromptPropagationAndStitchMilliseconds:
      wallTimeMilliseconds - 120_000,
    outputPersistenceAndExactRereadMilliseconds: 20_000,
  }
}

function completeSourceEvidence(
  runOrdinal: number,
  wallTimeMilliseconds: number,
  changes: Record<string, unknown> = {},
): CanonicalSam31GpuCompleteSourcePerformanceEvidence {
  const phaseTiming = changes.phaseTiming ?? {
    wallTimeMilliseconds,
    coldStartAndImagePullMilliseconds: 40_000,
    modelLoadMilliseconds: 60_000,
    decodePromptPropagationAndStitchMilliseconds:
      wallTimeMilliseconds - 120_000,
    outputPersistenceAndExactRereadMilliseconds: 20_000,
  }
  const payload = {
    schemaVersion:
      'canonical-sam3_1-gpu-complete-source-performance-evidence-v1',
    source: 'canonical_sam3_1_gpu_complete_source_performance_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'complete_source_performance_evidence_ready',
    performanceEvidenceId: `sam31-complete-source-run-${runOrdinal}`,
    performanceEvidenceVersion: 1,
    qualificationId: 'sam31-a100-runtime-qualification',
    runOrdinal,
    route: {
      routeId: 'a100_80gb_heavy_primary',
      gpuProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
      runtimeRegion: 'us-central1',
      executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
    },
    immutableImageDigest: `sha256:${digest('sam31-a100-image')}`,
    fullSourceExecutionRef: ref(`full-source-execution-${runOrdinal}`),
    completeChunkResultSetRef: ref(`chunk-result-set-${runOrdinal}`),
    terminalUsageAndCostReceiptSetRef:
      ref(`terminal-cost-set-${runOrdinal}`),
    exactEightMinuteSourceRef: ref('exact-eight-minute-source'),
    sourceDurationMilliseconds: 480_000,
    sourceWidth: 2_160,
    sourceHeight: 3_840,
    sourceFrameCount: 11_520,
    fpsNumerator: 24,
    fpsDenominator: 1,
    chunkPlanRef: ref('exact-eight-minute-chunk-plan'),
    chunkCount: 48,
    stitchedMaskSequenceRef: ref(`stitched-mask-sequence-${runOrdinal}`),
    stitchedOutputMaskSetDigestSha256:
      digest(`stitched-mask-set-${runOrdinal}`),
    phaseTiming,
    sourceResolutionAndCompleteFrameRangePreserved: true,
    everyChunkTaskResponseResultAndTerminalCostReread: true,
    exactStitchedManifestAndEveryMaskByteReread: true,
    allGpuCapacityStoppedAfterTerminal: true,
    automaticQualityReductionAllowed: false,
    callerPerformanceClaimsAccepted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    verifiedAt: `2026-08-04T19:${String(runOrdinal).padStart(2, '0')}:00.000Z`,
    ...changes,
  }
  return assertCanonicalSam31GpuCompleteSourcePerformanceEvidence({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function ownerWith(
  source: readonly CanonicalSam31GpuCompleteSourcePerformanceEvidence[],
  options: { missingIndex?: number } = {},
) {
  const map = new Map(source.map((record, index) => [
    refKey(canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(record)),
    options.missingIndex === index + 1 ? null : record,
  ]))
  return createOwner(map)
}

function createOwner(
  map: Map<string, CanonicalSam31GpuCompleteSourcePerformanceEvidence | null>,
) {
  const port = memoryObjectPort(new Map())
  return createCanonicalSam31GpuPerformanceP95QualificationOwner({
    readPort: readPort(map),
    p95Repository:
      createCanonicalSam31GpuPerformanceP95EvidenceRepository({
        objectPort: port,
      }),
    componentRepository:
      createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
        objectPort: port,
      }),
    now: () => '2026-08-04T20:01:00.000Z',
  })
}

function readPort(
  map: Map<string, CanonicalSam31GpuCompleteSourcePerformanceEvidence | null>,
) {
  return {
    async rereadCompleteSourcePerformanceEvidence({ evidenceRef }: {
      evidenceRef: Ref
    }) {
      const value = map.get(refKey(evidenceRef))
      return value ? structuredClone(value) : null
    },
  }
}

function ref(id: string): Ref {
  return { id, version: 1, contentHash: `sha256:${digest(id)}` }
}

function refKey(value: { id: string; version: number; contentHash: string }) {
  return `${value.id}:${value.version}:${value.contentHash}`
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
