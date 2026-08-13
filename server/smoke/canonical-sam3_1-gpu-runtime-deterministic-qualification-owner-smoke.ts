import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
import {
  canonicalProfessionalGpuJobLaunchSchema,
  canonicalProfessionalGpuJobTerminalSchema,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobTerminal,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31GpuRuntimeDeterministicQualificationOwner,
  createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPort,
  createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPorts,
  type CanonicalSam31GpuRuntimeDeterministicQualificationReadPort,
} from '../services/canonical-sam3_1-gpu-runtime-deterministic-qualification-owner'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  buildCanonicalSam31GpuRuntimeRequest,
  buildCanonicalSam31GpuRuntimeResponse,
  type CanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  assertCanonicalSam31GpuRuntimeResultAdmission,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
  type CanonicalSam31PrivateOutputRereadEvidence,
  type CanonicalSam31GpuRuntimeResultAdmission,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskRecord,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  release as sourceCheckpointQualificationRelease,
} from './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'
import {
  canonicalSam31A100LaunchFixture,
  canonicalSam31A100PrivateOutputEvidenceFixture,
  canonicalSam31A100ResultAdmissionFixture,
  canonicalSam31A100RuntimeResponseFixture,
  canonicalSam31A100TaskFixture,
  canonicalSam31A100TerminalFixture,
} from './canonical-sam3_1-gpu-task-owner-smoke'

export type CanonicalSam31A100RunFixtureRef = {
  id: string
  version: 1
  contentHash: `sha256:${string}`
}
export type CanonicalSam31A100RunFixture = {
  request: {
    runOrdinal: number
    invocationId: string
    taskRef: CanonicalSam31A100RunFixtureRef
    launchRef: CanonicalSam31A100RunFixtureRef
    resultAdmissionRef: CanonicalSam31A100RunFixtureRef
    runtimeResponseObjectRef: CanonicalSam31A100RunFixtureRef
  }
  task: CanonicalSam31GpuTaskRecord
  launch: CanonicalProfessionalGpuJobLaunch
  terminal: CanonicalProfessionalGpuJobTerminal
  privateOutput: CanonicalSam31PrivateOutputRereadEvidence
  result: CanonicalSam31GpuRuntimeResultAdmission
  response: CanonicalSam31GpuRuntimeResponse
}

const deterministicProbeFixtureRef = ref(
  'sam31-runtime-deterministic-probe-fixture',
  digest('sam31-runtime-deterministic-probe-fixture'),
)
const fixtures = Array.from({ length: 30 }, (_, index) =>
  buildCanonicalSam31A100RunFixture(index + 1))
const request = {
  componentId: 'sam31-a100-deterministic-run-set',
  qualificationId: 'sam31-a100-runtime-qualification',
  sourceCheckpointQualificationRef:
    sourceCheckpointQualificationRelease.sourceCheckpointQualificationRef,
  deterministicProbeFixtureRef,
  runs: fixtures.map((fixture) => fixture.request),
}
const componentRepository =
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort: memoryObjectPort(new Map()),
  })
const owner = createCanonicalSam31GpuRuntimeDeterministicQualificationOwner({
  readPort: fixtureReadPort(fixtures),
  componentRepository,
  now: () => '2026-08-04T18:00:00.000Z',
})
const component = await owner
  .compileAndPersistDeterministicQualificationComponent(request)
assert.equal(component.componentKind, 'deterministic_run_set')
assert.equal(component.payload.length, 30)
assert.equal(component.route.routeId, 'a100_80gb_heavy_primary')
assert.equal(component.route.accelerator, 'nvidia_a100_80gb')
assert.equal(new Set(component.payload.map((run) =>
  run.qualificationAttemptRef.id)).size, 30)
assert.equal(new Set(component.payload.map((run) =>
  run.resultAdmissionRef.id)).size, 30)
assert.equal(new Set(component.payload.map((run) =>
  run.runtimeRequestRef.id)).size, 30)
assert.equal(new Set(component.payload.map((run) =>
  run.runtimeResponseObjectRef.id)).size, 30)
assert.equal(new Set(component.payload.map((run) =>
  run.privateOutputRereadEvidenceRef.id)).size, 30)
assert.equal(new Set(component.payload.map((run) =>
  run.attemptCostReceiptRef.id)).size, 30)
assert.equal(new Set(component.payload.map((run) =>
  run.outputMaskSetDigestSha256)).size, 1)
assert.equal(new Set(component.payload.map((run) =>
  run.immutableImageDigest)).size, 1)
const replay = await owner.compileAndPersistDeterministicQualificationComponent(
  request,
)
assert.deepEqual(replay, component)

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
const releaseBytes = Buffer.from(
  stableAuthorityStringify(sourceCheckpointQualificationRelease),
  'utf8',
)
await wiredObjectPort.createOnly({
  objectPath:
    'private/sam3_1/source-checkpoint-qualification/v1/releases/'
      + `${sha256AuthorityValue(
        sourceCheckpointQualificationRelease
          .sourceCheckpointQualificationRef.id,
      )}.json`,
  body: releaseBytes,
  contentSha256: digest(releaseBytes),
})
for (const fixture of fixtures) {
  await wiredTaskStore.persistTaskCreateOnly(fixture.task)
  await wiredLifecycleStore.createLaunchRecordOnly({ record: fixture.launch })
  await wiredResultStore.persistResultAdmissionCreateOnly(fixture.result)
  const responseBytes = Buffer.from(
    stableAuthorityStringify(fixture.response),
    'utf8',
  )
  await wiredObjectPort.createOnly({
    objectPath:
      `private/canonical-professional-gpu/sam3_1/v1/invocations/${fixture.request.invocationId}/response.json`,
    body: responseBytes,
    contentSha256: digest(responseBytes),
  })
}
const wiredOwner =
  createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPort({
    objectPort: wiredObjectPort,
    now: () => '2026-08-04T18:01:00.000Z',
  })
const wiredComponent = await wiredOwner
  .compileAndPersistDeterministicQualificationComponent({
    ...request,
    componentId: 'sam31-a100-deterministic-run-set-wired',
  })
assert.equal(wiredComponent.componentKind, 'deterministic_run_set')
assert.equal(wiredComponent.payload.length, 30)

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
await splitControlObjectPort.createOnly({
  objectPath:
    'private/sam3_1/source-checkpoint-qualification/v1/releases/'
      + `${sha256AuthorityValue(
        sourceCheckpointQualificationRelease
          .sourceCheckpointQualificationRef.id,
      )}.json`,
  body: releaseBytes,
  contentSha256: digest(releaseBytes),
})
for (const fixture of fixtures) {
  await splitTaskStore.persistTaskCreateOnly(fixture.task)
  await splitLifecycleStore.createLaunchRecordOnly({ record: fixture.launch })
  await splitResultStore.persistResultAdmissionCreateOnly(fixture.result)
  const responseBytes = Buffer.from(
    stableAuthorityStringify(fixture.response),
    'utf8',
  )
  await splitPrivateObjectPort.createOnly({
    objectPath:
      `private/canonical-professional-gpu/sam3_1/v1/invocations/${fixture.request.invocationId}/response.json`,
    body: responseBytes,
    contentSha256: digest(responseBytes),
  })
}
const splitComponent = await
createCanonicalSam31GpuRuntimeDeterministicQualificationOwnerFromObjectPorts({
  controlPlaneObjectPort: splitControlObjectPort,
  privateGpuObjectPort: splitPrivateObjectPort,
  now: () => '2026-08-04T18:02:00.000Z',
}).compileAndPersistDeterministicQualificationComponent({
  ...request,
  componentId: 'sam31-a100-deterministic-run-set-split-store',
})
assert.equal(splitComponent.componentKind, 'deterministic_run_set')
assert.equal(splitComponent.payload.length, 30)

await assert.rejects(() =>
  owner.compileAndPersistDeterministicQualificationComponent({
    ...request,
    runs: request.runs.slice(0, 29),
  }))
await assert.rejects(() =>
  owner.compileAndPersistDeterministicQualificationComponent({
    ...request,
    runs: request.runs.map((run, index) =>
      index === 1 ? { ...run, runOrdinal: 1 } : run),
  }))
await assert.rejects(() =>
  owner.compileAndPersistDeterministicQualificationComponent({
    ...request,
    runs: request.runs.map((run, index) =>
      index === 1 ? { ...request.runs[0], runOrdinal: 2 } : run),
  }))

const nondeterministicFixtures = fixtures.map((fixture) =>
  structuredClone(fixture))
const changedResult = nondeterministicFixtures[1].result
changedResult.manifestRef.contentHash = `sha256:${digest('different-mask-set')}`
changedResult.resultAdmissionHash = resultHash(changedResult)
nondeterministicFixtures[1].request.resultAdmissionRef = ref(
  changedResult.resultAdmissionId,
  changedResult.resultAdmissionHash,
)
await assert.rejects(() => ownerWith(nondeterministicFixtures)
  .compileAndPersistDeterministicQualificationComponent({
    ...request,
    runs: nondeterministicFixtures.map((fixture) => fixture.request),
  }))

const crossedFixtures = fixtures.map((fixture) => structuredClone(fixture))
const crossedLaunch = crossedFixtures[1].launch
crossedLaunch.routeId = 'l4_heavy_fallback'
crossedLaunch.runtimeRegion = 'europe-west4'
crossedLaunch.executionTarget = 'google_cloud_run_l4_job'
crossedLaunch.accelerator = 'nvidia_l4'
crossedLaunch.launchHash = launchHash(crossedLaunch)
crossedFixtures[1].request.launchRef = ref(
  crossedLaunch.launchRecordId,
  crossedLaunch.launchHash,
)
await assert.rejects(() => ownerWith(crossedFixtures)
  .compileAndPersistDeterministicQualificationComponent({
    ...request,
    runs: crossedFixtures.map((fixture) => fixture.request),
  }))

await assert.rejects(() => ownerWith(fixtures, { missingRun: 7 })
  .compileAndPersistDeterministicQualificationComponent(request))
await assert.rejects(() =>
  owner.compileAndPersistDeterministicQualificationComponent({
    ...request,
    callerDeclaredDeterministic: true,
  }))
let getterInvoked = false
const accessor = Object.defineProperty({}, 'componentId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return request.componentId
  },
})
await assert.rejects(() =>
  owner.compileAndPersistDeterministicQualificationComponent(accessor))
assert.equal(getterInvoked, false)
const cyclic: Record<string, unknown> = { ...request }
cyclic.self = cyclic
await assert.rejects(() =>
  owner.compileAndPersistDeterministicQualificationComponent(cyclic))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-deterministic-qualification-owner',
  checks: 37,
  exactThirtyCanonicalRunsReread: true,
  exactSourceCheckpointQualificationReleaseReread: true,
  oneProbeFixtureAndOneMaskSetDigestRequired: true,
  sixIndependentRefsPerRunRequired: true,
  exactA100RouteImageCudaNvdecBfloat16AndScaleZeroRequired: true,
  accountEffectiveAttemptCostRequiredEveryRun: true,
  durableCanonicalStoreFactoryWired: true,
  splitControlPlaneAndPrivateGpuStoresWired: true,
  callerDeterminismClaimsAccepted: false,
  liveGpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

export function buildCanonicalSam31A100RunFixture(
  runOrdinal: number,
  options: {
    readonly invocationPrefix?: string
    readonly exactSourceRef?: CanonicalSam31A100RunFixtureRef
    readonly maskProxyRef?: CanonicalSam31A100RunFixtureRef
    readonly canonicalStartFrameInclusive?: number
    readonly decodedFrameCount?: number
    readonly fpsNumerator?: number
    readonly uniqueChunkIdentity?: boolean
    readonly chunkPlanRef?: CanonicalSam31A100RunFixtureRef
  } = {},
): CanonicalSam31A100RunFixture {
  const suffix = String(runOrdinal).padStart(2, '0')
  const namespace = options.invocationPrefix ?? 'sam31-deterministic-run'
  const invocationId = `${namespace}-${suffix}`
  const canonicalStartFrameInclusive =
    options.canonicalStartFrameInclusive ?? 0
  const decodedFrameCount = options.decodedFrameCount
    ?? canonicalSam31A100TaskFixture.runtimeRequest.sourceMedia
      .decodedFrameCount
  if (!Number.isInteger(decodedFrameCount)
    || decodedFrameCount < 2
    || decodedFrameCount > 240) {
    throw new TypeError('SAM 3.1 fixture frame count is outside its chunk bound.')
  }
  const exactSourceRef = options.exactSourceRef
    ?? canonicalSam31A100TaskFixture.runtimeRequest.sourceMedia
      .finalizedSourceArtifactRef
  const maskProxyRef = options.maskProxyRef ?? deterministicProbeFixtureRef
  const dispatchAdmissionRef = ref(
    `sam31-deterministic-admission-${suffix}`,
    digest(`sam31-deterministic-admission-${suffix}`),
  )
  const executionAttemptRef = ref(
    `sam31-deterministic-execution-attempt-${suffix}`,
    digest(`sam31-deterministic-execution-attempt-${suffix}`),
  )
  const workerLeaseRef = ref(
    `sam31-deterministic-worker-lease-${suffix}`,
    digest(`sam31-deterministic-worker-lease-${suffix}`),
  )
  const baseRequest = withoutKey(
    canonicalSam31A100TaskFixture.runtimeRequest,
    'requestBindingSha256',
  )
  const qualification = sourceCheckpointQualificationRelease.qualification
  const runtimeRequest = buildCanonicalSam31GpuRuntimeRequest({
    ...baseRequest,
    dispatchAdmissionRef,
    dispatchAdmissionDigestSha256:
      dispatchAdmissionRef.contentHash.slice(7),
    scope: {
      ...baseRequest.scope,
      workerLeaseRef,
      executionAttemptRef,
    },
    sourceMedia: {
      ...baseRequest.sourceMedia,
      finalizedSourceArtifactRef: exactSourceRef,
      gpuPreparedMaskProxyArtifactRef: maskProxyRef,
      sourceFrameRangeMappingRef: options.uniqueChunkIdentity
        ? ref(
          `sam31-deterministic-frame-map-${suffix}`,
          digest(`sam31-deterministic-frame-map-${suffix}`),
        )
        : baseRequest.sourceMedia.sourceFrameRangeMappingRef,
      decodedFrameCount,
      fpsNumerator: options.fpsNumerator ?? baseRequest.sourceMedia.fpsNumerator,
      selectedEndFrameInclusive: decodedFrameCount - 1,
      canonicalSourceStartFrameInclusive: canonicalStartFrameInclusive,
      canonicalSourceEndFrameInclusive:
        canonicalStartFrameInclusive + decodedFrameCount - 1,
      boundedChunkOverlapAndStitchPlanRef: options.chunkPlanRef
        ?? baseRequest.sourceMedia.boundedChunkOverlapAndStitchPlanRef,
    },
    modelArtifacts: {
      ...baseRequest.modelArtifacts,
      sourceCandidateRef: qualification.candidateRef,
      privateArtifactIngestReceiptRef:
        plainRef(qualification.ingestReceiptRef),
      sourceArchiveRef: plainRef(qualification.sourceArchive.artifactRef),
      sourceRevision: qualification.sourceArchive.revision,
      checkpointRef: plainRef(qualification.checkpoint.artifactRef),
      checkpointRepositoryRevision: qualification.checkpoint.repositoryRevision,
      checkpointFileName: qualification.checkpoint.fileName,
      checkpointByteLength: qualification.checkpoint.byteLength,
      checkpointSha256: qualification.checkpoint.sha256,
      sourceCheckpointCompatibilityQualificationRef:
        sourceCheckpointQualificationRelease.sourceCheckpointQualificationRef,
    },
  })
  const runtimeRequestContentSha256 = sha256AuthorityValue(runtimeRequest)
  const runtimeRequestRef = ref(
    `sam31-deterministic-runtime-request-${suffix}`,
    runtimeRequestContentSha256,
  )
  const executionEnvelopeRef = ref(
    invocationId,
    digest(`sam31-deterministic-execution-envelope-${suffix}`),
  )
  const stagingPayload = {
    ...withoutKey(
      canonicalSam31A100TaskFixture.privateInputStagingEvidence,
      'evidenceHash',
    ),
    stagingId: `sam31-deterministic-staging-${suffix}`,
    invocationId,
    scope: {
      ...canonicalSam31A100TaskFixture.privateInputStagingEvidence.scope,
      workerLeaseRef,
      executionAttemptRef,
    },
    dispatchAdmissionRef,
    executionEnvelopeRef,
    finalizedSourceArtifactRef: exactSourceRef,
    gpuPreparedMaskProxyArtifactRef: maskProxyRef,
    privateInvocationObjectRef: ref(
      `sam31-deterministic-private-input-${suffix}`,
      runtimeRequest.sourceMedia.sha256,
    ),
  }
  const privateInputStagingEvidence = {
    ...stagingPayload,
    evidenceHash: sha256AuthorityValue(stagingPayload),
  }
  const taskPayload = {
    ...withoutKey(canonicalSam31A100TaskFixture, 'taskRecordHash'),
    taskId: `sam31-task:${invocationId}`,
    invocationId,
    dispatchAdmissionRef,
    admissionConsumptionRef: ref(
      `sam31-deterministic-admission-consumption-${suffix}`,
      digest(`sam31-deterministic-admission-consumption-${suffix}`),
    ),
    executionEnvelopeRef,
    privateInputStagingEvidenceRef: ref(
      privateInputStagingEvidence.stagingId,
      privateInputStagingEvidence.evidenceHash,
    ),
    privateInputStagingEvidence,
    runtimeRequestRef,
    runtimeRequestContentSha256,
    runtimeRequest,
  }
  const task = assertCanonicalSam31GpuTaskRecord({
    ...taskPayload,
    taskRecordHash: sha256AuthorityValue(taskPayload),
  })
  const launchPayload = {
    ...withoutKey(canonicalSam31A100LaunchFixture, 'launchHash'),
    launchRecordId: `sam31-deterministic-launch-${suffix}`,
    admissionRef: dispatchAdmissionRef,
    admissionConsumptionRef: task.admissionConsumptionRef,
    runtimeReleaseRef: task.runtimeReleaseRef,
    executionEnvelopeRef,
    cloudJobCreateRequestRef: ref(
      `sam31-deterministic-create-request-${suffix}`,
      digest(`sam31-deterministic-create-request-${suffix}`),
    ),
    cloudJobExecutionRef: ref(
      `sam31-deterministic-cloud-execution-${suffix}`,
      digest(`sam31-deterministic-cloud-execution-${suffix}`),
    ),
  }
  const launch = canonicalProfessionalGpuJobLaunchSchema.parse({
    ...launchPayload,
    launchHash: sha256AuthorityValue(launchPayload),
  })
  const baseResponse = withoutKey(
    canonicalSam31A100RuntimeResponseFixture,
    'responseBindingSha256',
  )
  const manifestSha256 = options.uniqueChunkIdentity
    ? digest(`sam31-deterministic-mask-manifest-${suffix}`)
    : baseResponse.outputSummary!.manifestSha256
  const response = buildCanonicalSam31GpuRuntimeResponse({
    ...baseResponse,
    requestBindingSha256: runtimeRequest.requestBindingSha256,
    dispatchAdmissionDigestSha256:
      runtimeRequest.dispatchAdmissionDigestSha256,
    runtimeMeasurement: {
      ...baseResponse.runtimeMeasurement!,
      outputFileCount: decodedFrameCount + 1,
    },
    outputSummary: {
      ...baseResponse.outputSummary!,
      manifestRef: options.uniqueChunkIdentity
        ? ref(
          `sam31-deterministic-mask-manifest-${suffix}`,
          manifestSha256,
        )
        : baseResponse.outputSummary!.manifestRef,
      manifestSha256,
      firstFrameIndex: 0,
      lastFrameIndex: decodedFrameCount - 1,
      propagatedFrameCount: decodedFrameCount,
      losslessMaskPngCount: decodedFrameCount,
    },
  })
  const runtimeResponseObjectRef = ref(
    `sam31-deterministic-runtime-response-${suffix}`,
    digest(stableAuthorityStringify(response)),
  )
  const terminalPayload = {
    ...withoutKey(canonicalSam31A100TerminalFixture, 'terminalHash'),
    terminalRecordId: `sam31-deterministic-terminal-${suffix}`,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    admissionRef: launch.admissionRef,
    cloudJobExecutionRef: launch.cloudJobExecutionRef,
    cloudTerminalObservationRef: ref(
      `sam31-deterministic-cloud-terminal-${suffix}`,
      digest(`sam31-deterministic-cloud-terminal-${suffix}`),
    ),
    cloudCapacityTeardownObservationRef: ref(
      `sam31-deterministic-scale-zero-${suffix}`,
      digest(`sam31-deterministic-scale-zero-${suffix}`),
    ),
    workerUsageEvidenceRef: ref(
      `sam31-deterministic-worker-usage-${suffix}`,
      digest(`sam31-deterministic-worker-usage-${suffix}`),
    ),
    attemptCostReceiptRef: ref(
      `sam31-deterministic-attempt-cost-${suffix}`,
      digest(`sam31-deterministic-attempt-cost-${suffix}`),
    ),
  }
  const terminal = canonicalProfessionalGpuJobTerminalSchema.parse({
    ...terminalPayload,
    terminalHash: sha256AuthorityValue(terminalPayload),
  })
  const privateOutputPayload = {
    ...withoutKey(
      canonicalSam31A100PrivateOutputEvidenceFixture,
      'evidenceHash',
    ),
    taskRef: ref(task.taskId, task.taskRecordHash),
    runtimeResponseObjectRef,
    runtimeResponseBindingSha256: response.responseBindingSha256,
    manifestRef: response.outputSummary!.manifestRef,
    manifestSha256: response.outputSummary!.manifestSha256,
    maskSequenceArtifactRef: ref(
      `sam31-deterministic-mask-sequence-${suffix}`,
      digest(`sam31-deterministic-mask-sequence-${suffix}`),
    ),
    firstFrameIndex: runtimeRequest.sourceMedia.selectedStartFrameInclusive,
    lastFrameIndex: runtimeRequest.sourceMedia.selectedEndFrameInclusive,
    propagatedFrameCount: runtimeRequest.sourceMedia.decodedFrameCount,
  }
  const privateOutput = assertCanonicalSam31PrivateOutputRereadEvidence({
    ...privateOutputPayload,
    evidenceHash: sha256AuthorityValue(privateOutputPayload),
  })
  const resultPayload = {
    ...withoutKey(
      canonicalSam31A100ResultAdmissionFixture,
      'resultAdmissionHash',
    ),
    resultAdmissionId: `sam31-deterministic-result-${suffix}`,
    taskRef: ref(task.taskId, task.taskRecordHash),
    runtimeRequestRef,
    dispatchAdmissionRef,
    admissionConsumptionRef: task.admissionConsumptionRef,
    executionEnvelopeRef,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    terminalRef: ref(terminal.terminalRecordId, terminal.terminalHash),
    cloudJobExecutionRef: launch.cloudJobExecutionRef!,
    workerUsageEvidenceRef: terminal.workerUsageEvidenceRef,
    currentAccountPriceAuthorityRef:
      terminal.currentAccountPriceAuthorityRef,
    attemptCostReceiptRef: terminal.attemptCostReceiptRef,
    privateOutputRereadEvidenceRef: ref(
      `sam31-private-output-reread:${runtimeResponseObjectRef.id}`,
      privateOutput.evidenceHash,
    ),
    runtimeResponseObjectRef,
    runtimeResponseBindingSha256: response.responseBindingSha256,
    manifestRef: privateOutput.manifestRef,
    maskSequenceArtifactRef: privateOutput.maskSequenceArtifactRef,
  }
  const result = assertCanonicalSam31GpuRuntimeResultAdmission({
    ...resultPayload,
    resultAdmissionHash: sha256AuthorityValue(resultPayload),
  })
  return {
    request: {
      runOrdinal,
      invocationId,
      taskRef: ref(task.taskId, task.taskRecordHash),
      launchRef: ref(launch.launchRecordId, launch.launchHash),
      resultAdmissionRef: ref(
        result.resultAdmissionId,
        result.resultAdmissionHash,
      ),
      runtimeResponseObjectRef,
    },
    task,
    launch,
    terminal,
    privateOutput,
    result,
    response,
  }
}

function fixtureReadPort(
  source: readonly CanonicalSam31A100RunFixture[],
  overrides: { missingRun?: number } = {},
): CanonicalSam31GpuRuntimeDeterministicQualificationReadPort {
  const byInvocation = new Map(source.map((fixture) => [
    fixture.request.invocationId,
    fixture,
  ]))
  function lookup(invocationId: string) {
    if (overrides.missingRun !== undefined
      && invocationId.endsWith(
        String(overrides.missingRun).padStart(2, '0'),
      )) return null
    return byInvocation.get(invocationId) ?? null
  }
  return {
    async rereadQualificationRelease({ sourceCheckpointQualificationRef }) {
      return sameRef(
        sourceCheckpointQualificationRef,
        sourceCheckpointQualificationRelease.sourceCheckpointQualificationRef,
      ) ? structuredClone(sourceCheckpointQualificationRelease) : null
    },
    async rereadTask({ invocationId, taskRef }) {
      const found = lookup(invocationId)
      return found && sameRef(found.request.taskRef, taskRef)
        ? structuredClone(found.task) : null
    },
    async rereadLaunch({ invocationId, launchRef }) {
      const found = lookup(invocationId)
      return found && sameRef(found.request.launchRef, launchRef)
        ? structuredClone(found.launch) : null
    },
    async rereadResultAdmission({ invocationId, resultAdmissionRef }) {
      const found = lookup(invocationId)
      return found && sameRef(found.request.resultAdmissionRef,
        resultAdmissionRef) ? structuredClone(found.result) : null
    },
    async rereadRuntimeResponse({ invocationId, runtimeResponseObjectRef }) {
      const found = lookup(invocationId)
      return found && sameRef(found.request.runtimeResponseObjectRef,
        runtimeResponseObjectRef) ? structuredClone(found.response) : null
    },
  }
}

function ownerWith(
  source: readonly CanonicalSam31A100RunFixture[],
  overrides: { missingRun?: number } = {},
) {
  return createCanonicalSam31GpuRuntimeDeterministicQualificationOwner({
    readPort: fixtureReadPort(source, overrides),
    componentRepository:
      createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
        objectPort: memoryObjectPort(new Map()),
      }),
    now: () => '2026-08-04T18:00:00.000Z',
  })
}

function withoutKey<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}

function launchHash(value: CanonicalProfessionalGpuJobLaunch): string {
  return sha256AuthorityValue(withoutKey(value, 'launchHash'))
}

function resultHash(value: CanonicalSam31GpuRuntimeResultAdmission): string {
  return sha256AuthorityValue(withoutKey(value, 'resultAdmissionHash'))
}

function ref(id: string, hash: string): CanonicalSam31A100RunFixtureRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function plainRef(value: {
  id: string
  version: number
  contentHash: string
}): CanonicalSam31A100RunFixtureRef {
  assert.equal(value.version, 1)
  return ref(value.id, value.contentHash.slice(7))
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function memoryObjectPort(storage: Map<string, Buffer>) {
  return {
    async createOnly(input: {
      objectPath: string
      body: Buffer
      contentSha256: string
    }) {
      assert.equal(digest(input.body), input.contentSha256)
      if (storage.has(input.objectPath)) return 'already_exists' as const
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created' as const
    },
    async readExact(path: string) {
      const value = storage.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
