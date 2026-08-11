import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
} from '../../src/types/orchestra-skill-capability'
import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  createOrchestraSkillCall,
  createSkillSupportRequest,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalProfessionalGpuJobLaunchSchema,
  canonicalProfessionalGpuJobTerminalSchema,
  type CanonicalProfessionalGpuCloudJobLaunchPort,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  buildCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  CANONICAL_SAM3_1_GPU_PRIVATE_BINARY_OBJECT_PORT_VERSION,
  createCanonicalSam31GpuPrivateInputStagingPort,
  type CanonicalSam31GpuPrivateBinaryObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  admitCanonicalSam31GpuRuntimeResult,
  canonicalSam31PrivateOutputRereadEvidenceSchema,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  buildCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt,
  buildCanonicalSam31GpuTaskContext,
  canonicalSam31GpuFixedTaskContractRef,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  createCanonicalSam31PreparingCloudJobLaunchPort,
  type CanonicalSam31GpuApprovedTaskMaterialPreparationPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
  CANONICAL_TRACK_ALL_SAM3_1_PURPOSE_CODE,
  createCanonicalTrackAllSam31OrchestraBinding,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import {
  canonicalSam31GpuRuntimeReleaseObservationSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-release'
import {
  a100 as a100RateAuthority,
  l4Fallback as l4FallbackRateAuthority,
} from './canonical-professional-tool-gpu-cost-authority-smoke'

const objects = new Map<string, Buffer>()
const maskProxyBytes = Buffer.alloc(4_096, 0x31)
const maskProxySha256 = createHash('sha256').update(maskProxyBytes)
  .digest('hex')
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    const digest = createHash('sha256').update(input.body).digest('hex')
    assert.equal(digest, input.contentSha256)
    const existing = objects.get(input.objectPath)
    if (existing) {
      assert.equal(existing.equals(input.body), true)
      return 'already_exists'
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(objectPath) {
    const value = objects.get(objectPath)
    return value ? Buffer.from(value) : null
  },
}
const store = createCanonicalSam31GpuTaskStoreFromObjectPort({ objectPort })
const stagedProxyObjects = new Map<string, Buffer>()
const privateInputStagingPort = createCanonicalSam31GpuPrivateInputStagingPort({
  sourceReadPort: {
    async rereadExactApprovedMaskProxy(input) {
      assert.equal(input.expectedByteLength, maskProxyBytes.byteLength)
      assert.equal(input.expectedSha256, maskProxySha256)
      return {
        contentType: 'video/mp4' as const,
        byteLength: maskProxyBytes.byteLength,
        sha256: maskProxySha256,
        width: 2_160,
        height: 3_840,
        decodedFrameCount: 240,
        selectedStartFrameInclusive: 0,
        selectedEndFrameInclusive: 239,
        sourceBindingRef: input.sourceBindingRef,
        finalizedSourceArtifactRef: input.finalizedSourceArtifactRef,
        gpuPreparedMaskProxyArtifactRef:
          input.gpuPreparedMaskProxyArtifactRef,
        exactSourceReadEvidenceRef: input.exactSourceReadEvidenceRef,
        sourceFrameRangeMappingRef: input.sourceFrameRangeMappingRef,
        proxyPixelGeometryQaRef: input.proxyPixelGeometryQaRef,
        exactApprovedSnapshotWorkLeaseAndSourceReread: true as const,
        sourcePathUrlBucketObjectGenerationOrBytesExposed: false as const,
        async openStream() {
          return Readable.from([Buffer.from(maskProxyBytes)])
        },
      }
    },
  },
  binaryObjectPort: memoryPrivateBinaryObjectPort(stagedProxyObjects),
})

export const primaryRateRef = ref(
  a100RateAuthority.rateAuthorityId,
  a100RateAuthority.rateAuthorityHash,
  a100RateAuthority.rateAuthorityVersion,
)
export const fallbackRateRef = ref(
  l4FallbackRateAuthority.rateAuthorityId,
  l4FallbackRateAuthority.rateAuthorityHash,
  l4FallbackRateAuthority.rateAuthorityVersion,
)
export const a100 = fixture('a100_80gb_heavy_primary')
let delegateCalls = 0
const delegate: CanonicalProfessionalGpuCloudJobLaunchPort = {
  async startOneShotJob() {
    delegateCalls += 1
    return {
      disposition: 'accepted',
      cloudJobExecutionRef: ref(`cloud-execution-${delegateCalls}`),
      cloudJobCreateRequestRef: ref(`cloud-create-${delegateCalls}`),
      providerRequestIdDigestSha256: sha256AuthorityValue(
        `provider-request-${delegateCalls}`,
      ),
      observedAt: '2026-08-02T18:01:00.000Z',
      providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed',
    }
  },
}
let currentContext: unknown = a100.context
let materialPreparationCalls = 0
const taskMaterialPreparationPort:
  CanonicalSam31GpuApprovedTaskMaterialPreparationPort = {
    async preparePersistAndRereadApprovedTaskMaterial(input) {
      materialPreparationCalls += 1
      return buildCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt({
        ...input,
        approvedTaskMaterialRef: ref(
          `approved-material-${input.executionEnvelopeRef.id}`,
        ),
        preparedAt: '2026-08-02T18:00:20.000Z',
      })
    },
  }
const preparingPort = createCanonicalSam31PreparingCloudJobLaunchPort({
  taskMaterialPreparationPort,
  taskContextReadPort: {
    async rereadCanonicalTaskContext() {
      return structuredClone(currentContext)
    },
  },
  privateInputStagingPort,
  taskStore: store,
  delegate,
  now: () => '2026-08-02T18:00:30.000Z',
})
const a100Input = {
  admission: a100.admission,
  target: a100.target,
  admissionConsumptionRef: ref('a100-admission-consumption'),
  executionEnvelopeRef: ref('a100-execution-envelope'),
}
const accepted = await preparingPort.startOneShotJob(a100Input)
assert.equal(accepted.disposition, 'accepted')
assert.equal(delegateCalls, 1)
assert.equal(materialPreparationCalls, 1)
const task = assertCanonicalSam31GpuTaskRecord(
  await store.rereadTask('a100-execution-envelope'),
)
assert.equal(task.runtimeRequest.dispatch.accelerator, 'nvidia_a100_80gb')
assert.equal(task.runtimeRequest.dispatch.attemptOrdinal, 1)
assert.equal(task.runtimeRequest.scope.sceneId, 'scene-1')
assert.equal(task.runtimeRequest.sourceMedia.decodedFrameCount, 240)
assert.equal(task.privateInputStagingEvidence.sha256, maskProxySha256)
assert.equal(
  task.privateInputStagingEvidence.exactCreatedGenerationBytesRereadAndHashed,
  true,
)
assert.equal(
  task.fixedTaskContractRef.contentHash,
  canonicalSam31GpuFixedTaskContractRef().contentHash,
)
assert.equal(
  task.taskContextRef.contentHash,
  a100.context.taskContextRef.contentHash,
)
assert.equal(a100.trackAllOrchestraBinding.targetSkillKey, 'track_all')
assert.equal(
  a100.trackAllOrchestraBinding.trackAllOwnsTrackingAndMaskArtifacts,
  true,
)

const crossedPreparationStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort: memoryObjectPort(new Map<string, Buffer>()),
})
const crossedPreparationPort = createCanonicalSam31PreparingCloudJobLaunchPort({
  taskMaterialPreparationPort: {
    async preparePersistAndRereadApprovedTaskMaterial(input) {
      return buildCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt({
        ...input,
        executionEnvelopeRef: ref('crossed-material-envelope'),
        approvedTaskMaterialRef: ref('crossed-approved-material'),
        preparedAt: '2026-08-02T18:00:20.000Z',
      })
    },
  },
  taskContextReadPort: {
    async rereadCanonicalTaskContext() {
      throw new Error('Crossed preparation must fail before context reread.')
    },
  },
  privateInputStagingPort,
  taskStore: crossedPreparationStore,
  delegate,
  now: () => '2026-08-02T18:00:30.000Z',
})
assert.equal((await crossedPreparationPort.startOneShotJob({
  ...a100Input,
  executionEnvelopeRef: ref('crossed-preparation-request-envelope'),
})).disposition, 'rejected_before_creation')
assert.equal(delegateCalls, 1)

const futurePreparationPort = createCanonicalSam31PreparingCloudJobLaunchPort({
  taskMaterialPreparationPort: {
    async preparePersistAndRereadApprovedTaskMaterial(input) {
      return buildCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt({
        ...input,
        approvedTaskMaterialRef: ref('future-approved-material'),
        preparedAt: '2026-08-02T18:00:31.000Z',
      })
    },
  },
  taskContextReadPort: {
    async rereadCanonicalTaskContext() {
      return structuredClone(a100.context)
    },
  },
  privateInputStagingPort,
  taskStore: crossedPreparationStore,
  delegate,
  now: () => '2026-08-02T18:00:30.000Z',
})
assert.equal((await futurePreparationPort.startOneShotJob({
  ...a100Input,
  executionEnvelopeRef: ref('future-preparation-request-envelope'),
})).disposition, 'rejected_before_creation')
assert.equal(delegateCalls, 1)

const {
  callDigestSha256: _orchestraCallDigest,
  ...orchestraCallWithoutDigest
} = a100.orchestraCall
assert.equal(_orchestraCallDigest, a100.orchestraCall.callDigestSha256)
const visualIntelligenceCall = createOrchestraSkillCall({
  ...orchestraCallWithoutDigest,
  callId: 'visual-intelligence-must-not-own-sam31-call',
  targetSkillKey: 'visual_intelligence',
})
assert.throws(() => createCanonicalTrackAllSam31OrchestraBinding({
  bindingId: 'visual-intelligence-must-not-own-sam31-binding',
  call: visualIntelligenceCall,
  admission: a100.admission,
}))
const peerSupportRequest = createSkillSupportRequest({
  schemaVersion: ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
  requestId: 'living-frame-track-all-support-request-1',
  requestingSkillKey: 'living_frame',
  requestingSkillJobId: 'living-frame-job-1',
  parentOrchestraJobId: a100.orchestraCall.orchestraJobRef.id,
  requiredCapability: 'track_all',
  requestedJobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
  phase: a100.orchestraCall.phase,
  scope: a100.orchestraCall.scope,
  purposeCode: CANONICAL_TRACK_ALL_SAM3_1_PURPOSE_CODE,
  inputArtifactRefs: a100.orchestraCall.sourceArtifactRefs,
  comparisonArtifactRefs: a100.orchestraCall.comparisonArtifactRefs,
  expectedOutcomeRefs: a100.orchestraCall.expectedOutcomeRefs,
  requiredEvidenceRefs: a100.orchestraCall.requiredEvidenceRefs,
  urgency: 'blocking',
  supportRequestOnly: true,
  executionAuthorityGranted: false,
  providerInvocationAuthorityGranted: false,
  timelineMutationAuthorityGranted: false,
  scopeExpansionAuthorityGranted: false,
})
const peerSkillCall = createOrchestraSkillCall({
  ...orchestraCallWithoutDigest,
  callId: 'peer-skill-must-not-directly-dispatch-sam31-call',
  requestedBy: {
    kind: 'skill',
    skillKey: 'living_frame',
    skillJobRef: ref('living-frame-job-1'),
    supportRequestRef: {
      id: peerSupportRequest.requestId,
      version: 1,
      contentHash: peerSupportRequest.requestDigestSha256,
    },
  },
})
assert.throws(() => createCanonicalTrackAllSam31OrchestraBinding({
  bindingId: 'peer-skill-must-not-directly-dispatch-sam31-binding',
  call: peerSkillCall,
  admission: a100.admission,
}))
const orchestraValidatedPeerBinding =
  createCanonicalTrackAllSam31OrchestraBinding({
    bindingId: 'orchestra-validated-peer-track-all-sam31-binding',
    call: peerSkillCall,
    supportRequest: peerSupportRequest,
    admission: a100.admission,
  })
assert.equal(
  orchestraValidatedPeerBinding.supportRequestRef?.contentHash,
  peerSupportRequest.requestDigestSha256,
)

const duplicate = await preparingPort.startOneShotJob(a100Input)
assert.equal(duplicate.disposition, 'rejected_before_creation')
assert.equal(delegateCalls, 1)

if (a100.orchestraCall.scope.scopeType !== 'scene') {
  throw new Error('Track All smoke fixture lost scene scope.')
}
const crossSceneCall = createOrchestraSkillCall({
  ...orchestraCallWithoutDigest,
  callId: 'cross-scene-track-all-call',
  scope: {
    ...a100.orchestraCall.scope,
    sceneId: 'scene-2',
  },
})
const crossSceneBinding = createCanonicalTrackAllSam31OrchestraBinding({
  bindingId: 'cross-scene-track-all-binding',
  call: crossSceneCall,
  admission: a100.admission,
})
currentContext = rebindTaskContext({
  base: a100.context,
  binding: crossSceneBinding,
  taskContextId: 'cross-scene-task-context',
})
const crossScene = await preparingPort.startOneShotJob({
  ...a100Input,
  executionEnvelopeRef: ref('cross-scene-envelope'),
})
assert.equal(crossScene.disposition, 'rejected_before_creation')
assert.equal(delegateCalls, 1)

const cpuTamper = structuredClone(a100.context)
;(cpuTamper.sourceMedia as Record<string, unknown>).callerPathOrUrlAccepted =
  true
currentContext = cpuTamper
const tampered = await preparingPort.startOneShotJob({
  ...a100Input,
  executionEnvelopeRef: ref('a100-tampered-envelope'),
})
assert.equal(tampered.disposition, 'rejected_before_creation')
assert.equal(delegateCalls, 1)

currentContext = rebindTaskContext({
  base: a100.context,
  binding: a100.trackAllOrchestraBinding,
  taskContextId: 'crossed-specialized-release-task-context',
  specializedRuntimeRelease: reissueSpecializedReleaseWithId(
    a100.context.specializedRuntimeRelease,
    'older-sam31-specialized-release',
  ),
})
const crossedSpecializedRelease = await preparingPort.startOneShotJob({
  ...a100Input,
  executionEnvelopeRef: ref('crossed-specialized-release-envelope'),
})
assert.equal(
  crossedSpecializedRelease.disposition,
  'rejected_before_creation',
)
assert.equal(delegateCalls, 1)

const l4Objects = new Map<string, Buffer>()
const l4Store = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort: memoryObjectPort(l4Objects),
})
const l4 = fixture('l4_heavy_fallback')
const l4Port = createCanonicalSam31PreparingCloudJobLaunchPort({
  taskMaterialPreparationPort,
  taskContextReadPort: {
    async rereadCanonicalTaskContext() {
      return structuredClone(l4.context)
    },
  },
  privateInputStagingPort,
  taskStore: l4Store,
  delegate,
  now: () => '2026-08-02T18:00:40.000Z',
})
const l4Accepted = await l4Port.startOneShotJob({
  admission: l4.admission,
  target: l4.target,
  admissionConsumptionRef: ref('l4-admission-consumption'),
  executionEnvelopeRef: ref('l4-execution-envelope'),
})
assert.equal(l4Accepted.disposition, 'accepted')
const l4Task = assertCanonicalSam31GpuTaskRecord(
  await l4Store.rereadTask('l4-execution-envelope'),
)
assert.equal(l4Task.runtimeRequest.dispatch.accelerator, 'nvidia_l4')
assert.equal(l4Task.runtimeRequest.dispatch.attemptOrdinal, 2)
assert.equal(
  l4Task.runtimeRequest.dispatch.priorAttemptDisposition,
  'not_executed_retry_safe',
)
assert.equal(delegateCalls, 2)

const wrongTarget = {
  ...a100.target,
  fixedServerTaskContractRef: ref('caller-invented-task-contract'),
}
currentContext = a100.context
const wrongContract = await preparingPort.startOneShotJob({
  ...a100Input,
  target: wrongTarget,
  executionEnvelopeRef: ref('wrong-contract-envelope'),
})
assert.equal(wrongContract.disposition, 'rejected_before_creation')
assert.equal(delegateCalls, 2)

const manifestSha256 = sha256AuthorityValue('sam31-mask-manifest')
const runtimeResponse = buildCanonicalSam31GpuRuntimeResponse({
  schemaVersion: 'canonical-sam3_1-gpu-runtime-response-v1',
  operationId: task.runtimeRequest.operationId,
  requestBindingSha256: task.runtimeRequest.requestBindingSha256,
  dispatchAdmissionDigestSha256:
    task.runtimeRequest.dispatchAdmissionDigestSha256,
  status: 'completed',
  terminalStage: 'completed',
  gpuEvidence: {
    requestedAccelerator: 'nvidia_a100_80gb',
    observedDeviceNameDigestSha256: sha256AuthorityValue(
      'NVIDIA A100-SXM4-80GB',
    ),
    observedNvidiaDriverVersion: '570.211.01',
    observedCudaRuntimeVersion: '12.8',
    observedTorchVersion: '2.10.0+cu128',
    observedTorchcodecVersion: '0.10.0',
    observedComputeCapabilityMajor: 8,
    observedComputeCapabilityMinor: 0,
    observedTotalDeviceMemoryBytes: 85_899_345_920,
    maximumObservedNvdecUtilizationPercent: 82,
    maximumObservedGpuUtilizationPercent: 96,
    cudaAvailable: true,
    bfloat16AutocastUsed: true,
    nvdecHardwareDecodeMeasured: true,
    decodedFramesResidentOnCuda: true,
    boundedCpuOutputSerializationUsed: true,
    cudaKernelExecutionMeasured: true,
    cpuOnlyInferenceUsed: false,
    cudaDriverLibraryMode: 'host_driver',
    observedCudaDriverLibraryPathDigestSha256: sha256AuthorityValue(
      '/usr/local/nvidia/lib64/libcuda.so.570.211.01',
    ),
    cudaForwardCompatibilityPackageSha256:
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    cudaForwardCompatibilityLibraryLoaded: false,
    hostCudaDriverLibraryLoaded: true,
  },
  runtimeMeasurement: {
    wallTimeMilliseconds: 118_000,
    modelLoadMilliseconds: 21_000,
    promptMilliseconds: 2_000,
    propagationMilliseconds: 86_000,
    outputPersistenceMilliseconds: 9_000,
    cudaEventInferenceMilliseconds: 84_000,
    peakCudaAllocatedBytes: 42_000_000_000,
    peakCudaReservedBytes: 50_000_000_000,
    outputFileCount: 241,
    outputByteLength: 2_100_000_000,
  },
  outputSummary: {
    manifestRef: exactRef('sam31-mask-manifest', manifestSha256),
    manifestSha256,
    firstFrameIndex: 0,
    lastFrameIndex: 239,
    propagatedFrameCount: 240,
    distinctObjectIds: [0],
    losslessMaskPngCount: 240,
    normalizedBoxRecordCount: 240,
    allMasksMatchSourceDimensions: true,
    allFramesWithinApprovedInterval: true,
    createOnlyPrivatePersistence: true,
    exactPrivateRereadPending: true,
  },
  failureCode: 'none',
  modelSourceAndCheckpointHashesVerifiedBeforeAndAfter: true,
  sourceCheckpointCompatibilityQualificationReread: true,
  serverCostReceiptIncluded: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
const runtimeResponseBytes = Buffer.from(
  canonicalSam31GpuWireStringify(runtimeResponse),
  'utf8',
)
await objectPort.createOnly({
  objectPath:
    'private/canonical-professional-gpu/sam3_1/v1/invocations/a100-execution-envelope/response.json',
  body: runtimeResponseBytes,
  contentSha256: createHash('sha256').update(runtimeResponseBytes).digest('hex'),
})

const launchPayload = {
  schemaVersion: 'canonical-professional-gpu-job-launch-v1' as const,
  source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
  launchRecordId: 'sam31-a100-launch',
  admissionRef: task.dispatchAdmissionRef,
  admissionConsumptionRef: task.admissionConsumptionRef,
  runtimeReleaseRef: task.runtimeReleaseRef,
  executionEnvelopeRef: task.executionEnvelopeRef,
  toolId: 'sam3_1',
  operationId: task.runtimeRequest.operationId,
  routeId: 'a100_80gb_heavy_primary' as const,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_vertex_custom_job_a2_ultra' as const,
  accelerator: 'nvidia_a100_80gb' as const,
  immutableImageDigest: a100.target.immutableImageDigest,
  cloudJobCreateRequestRef: ref('sam31-a100-create-request'),
  cloudJobExecutionRef: ref('sam31-a100-cloud-execution'),
  launchDisposition: 'job_created' as const,
  providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed' as const,
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
  launchedAt: '2026-08-02T18:01:00.000Z',
}
const launch = canonicalProfessionalGpuJobLaunchSchema.parse({
  ...launchPayload,
  launchHash: sha256AuthorityValue(launchPayload),
})
const terminalPayload = {
  schemaVersion: 'canonical-professional-gpu-job-terminal-v1' as const,
  source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
  terminalRecordId: 'sam31-a100-terminal',
  launchRef: exactRef(launch.launchRecordId, launch.launchHash),
  admissionRef: launch.admissionRef,
  cloudJobExecutionRef: launch.cloudJobExecutionRef,
  cloudTerminalObservationRef: ref('sam31-cloud-terminal'),
  cloudCapacityTeardownObservationRef: ref('sam31-scale-zero-terminal'),
  workerUsageEvidenceRef: ref('sam31-worker-usage'),
  currentAccountPriceAuthorityRef: primaryRateRef,
  attemptCostReceiptRef: ref('sam31-attempt-cost'),
  terminalOutcome: 'completed' as const,
  providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
  cloudJobTerminalStateReread: true as const,
  workerStoppedVerified: true as const,
  activeGpuInstancesAfterTerminalObservation: 0 as const,
  minimumIdleInstances: 0 as const,
  retryAllowedWithoutCanonicalReconciliation: false as const,
  unknownOutcomeBlocksRetry: false,
  exactPlatformUsageAndAccountPriceReread: true as const,
  costReceiptPersistedBeforeSettlement: true as const,
  systemFailureOrUnknownCostChargedToCustomer: false as const,
  unapprovedOverageChargedToCustomer: false as const,
  customerWalletOrLedgerMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt: '2026-08-02T18:05:00.000Z',
}
const terminal = canonicalProfessionalGpuJobTerminalSchema.parse({
  ...terminalPayload,
  terminalHash: sha256AuthorityValue(terminalPayload),
})
const outputEvidencePayload = {
  schemaVersion: 'canonical-sam3_1-private-output-reread-evidence-v1' as const,
  source: 'canonical_server_sam3_1_private_output_reader' as const,
  evidenceClass: 'canonical_private_reread' as const,
  taskRef: exactRef(task.taskId, task.taskRecordHash),
  runtimeResponseObjectRef: exactRef(
    'sam31-a100-runtime-response',
    createHash('sha256').update(runtimeResponseBytes).digest('hex'),
  ),
  runtimeResponseBindingSha256: runtimeResponse.responseBindingSha256,
  manifestRef: runtimeResponse.outputSummary!.manifestRef,
  manifestSha256,
  manifestByteLength: 750_000,
  maskSequenceArtifactRef: ref('sam31-private-mask-sequence'),
  maskFileCount: 240,
  combinedMaskByteLength: 2_099_250_000,
  width: 2_160,
  height: 3_840,
  firstFrameIndex: 0,
  lastFrameIndex: 239,
  propagatedFrameCount: 240,
  distinctObjectIds: [0],
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
  rereadAt: '2026-08-02T18:06:00.000Z',
}
const outputEvidence = canonicalSam31PrivateOutputRereadEvidenceSchema.parse({
  ...outputEvidencePayload,
  evidenceHash: sha256AuthorityValue(outputEvidencePayload),
})
const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort,
})
const result = await admitCanonicalSam31GpuRuntimeResult({
  invocationId: task.invocationId,
  launch,
  terminal,
  taskStore: store,
  privateOutputRereadPort: {
    async rereadExactPrivateOutput() {
      return structuredClone(outputEvidence)
    },
  },
  resultStore,
  resultAdmissionId: 'sam31-a100-result-admission',
  admittedAt: '2026-08-02T18:07:00.000Z',
})
assert.equal(result.status, 'ready_for_independent_mask_artifact_qa')
assert.equal(result.accelerator, 'nvidia_a100_80gb')
assert.equal(result.terminalWorkerStoppedAndScaleBackToZeroVerified, true)
assert.equal(result.accountEffectiveAttemptCostReceiptPersisted, true)
assert.equal(result.independentMaskArtifactQaPending, true)
await assert.rejects(() => admitCanonicalSam31GpuRuntimeResult({
  invocationId: task.invocationId,
  launch,
  terminal,
  taskStore: store,
  privateOutputRereadPort: {
    async rereadExactPrivateOutput() {
      return structuredClone(outputEvidence)
    },
  },
  resultStore,
  resultAdmissionId: 'sam31-a100-result-admission-duplicate',
  admittedAt: '2026-08-02T18:08:00.000Z',
}))

const badOutputEvidencePayload = {
  ...outputEvidencePayload,
  width: 1_920,
}
const badOutputEvidence = canonicalSam31PrivateOutputRereadEvidenceSchema.parse({
  ...badOutputEvidencePayload,
  evidenceHash: sha256AuthorityValue(badOutputEvidencePayload),
})
await assert.rejects(() => admitCanonicalSam31GpuRuntimeResult({
  invocationId: task.invocationId,
  launch,
  terminal,
  taskStore: store,
  privateOutputRereadPort: {
    async rereadExactPrivateOutput() {
      return structuredClone(badOutputEvidence)
    },
  },
  resultStore: createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: memoryObjectPort(new Map()),
  }),
  resultAdmissionId: 'sam31-a100-bad-output-result',
  admittedAt: '2026-08-02T18:08:00.000Z',
}))

export {
  task as canonicalSam31A100TaskFixture,
  runtimeResponse as canonicalSam31A100RuntimeResponseFixture,
  launch as canonicalSam31A100LaunchFixture,
  terminal as canonicalSam31A100TerminalFixture,
  outputEvidence as canonicalSam31A100PrivateOutputEvidenceFixture,
  result as canonicalSam31A100ResultAdmissionFixture,
}

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-task-owner',
  checks: 68,
  approvedTaskMaterialPreparedBeforeContextRead: true,
  preparationReceiptExactLineageRequired: true,
  crossedOrFuturePreparationReceiptRejected: true,
  rawCloudLaunchPortAccepted: false,
  exactTrackAllOrchestraCallBoundBeforeSam31Task: true,
  exactTrackAllSubjectPromptAndFrameIntervalBound: true,
  crossSceneTrackAllReuseRejected: true,
  visualIntelligenceDirectSam31OwnershipRejected: true,
  directPeerSkillSam31DispatchRejected: true,
  orchestraValidatedPeerSupportAccepted: true,
  a100PrimaryPreparedBeforeLaunch: true,
  independentlyQualifiedL4FallbackPreparedBeforeLaunch: true,
  duplicateLaunchBlocked: true,
  callerTaskContractRejected: true,
  cpuOrPathFallbackRejected: true,
  specializedReleaseIdVersionAndValidityBoundToAdmission: true,
  exactApprovedMaskProxyStagedBeforeTask: true,
  createOnlyGenerationAndBytesReread: true,
  createOnlyRuntimeResponseReread: true,
  exactGpuAndFrameRangeAdmission: true,
  terminalScaleBackToZeroVerified: true,
  accountEffectiveAttemptCostReceiptBound: true,
  independentMaskQaStillRequired: true,
  runtimeDownloadAllowed: false,
  minimumIdleInstances: 0,
  liveGpuJobCreated: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function fixture(
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback',
) {
  const primary = routeId === 'a100_80gb_heavy_primary'
  const imageDigest = hash(`${routeId}-image`)
  const runtimeReleaseRef = ref(`${routeId}-runtime-release`)
  const admission = buildAdmission({ routeId, runtimeReleaseRef })
  const target = {
    releaseRef: runtimeReleaseRef,
    releaseEvidenceClass: 'canonical_private_reread' as const,
    privateInternalQualified: true as const,
    toolId: 'sam3_1',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId,
    runtimeRegion: 'us-central1' as const,
    executionTarget: primary
      ? 'google_cloud_vertex_custom_job_a2_ultra' as const
      : 'google_cloud_run_l4_job' as const,
    machineType: primary
      ? 'a2-ultragpu-1g' as const
      : 'cloud_run_nvidia_l4' as const,
    accelerator: primary
      ? 'nvidia_a100_80gb' as const
      : 'nvidia_l4' as const,
    immutableImageRef: {
      id: `${routeId}-image`,
      version: 1,
      contentHash: imageDigest,
    },
    immutableImageDigest: imageDigest,
    fixedServerTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
    serviceIdentityRef: ref(`${routeId}-service-identity`),
    privateNetworkAndArtifactTransportRef:
      ref(`${routeId}-private-transport`),
    minimumIdleInstances: 0 as const,
    maximumConcurrentAttemptsPerInstance: 1 as const,
    runtimeNetworkDownloadAllowed: false as const,
    callerCommandImageModelOrEnvironmentAccepted: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    startsOnlyFromConsumedApprovedAdmission: true as const,
    stopsAtTerminalAttempt: true as const,
  }
  const specializedRuntimeRelease = buildSpecializedRelease({
    routeId,
    target,
  })
  const sourceArtifactRef = ref('source-video-1')
  const sourceBindingRef = ref('source-binding-1')
  const compiledIntentRef = ref('compiled-intent-1')
  const promptApprovalRef = ref('prompt-approval-1')
  const sourceFrameLineageRef = ref('source-frame-300-local-0')
  const orchestraCall = createOrchestraSkillCall({
    schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
    callId: `${routeId}-track-all-call`,
    orchestraPlanRef: ref('orchestra-plan-1'),
    orchestraJobRef: ref('orchestra-track-all-job-1'),
    parentJobRef: null,
    requestedBy: { kind: 'orchestra' },
    targetSkillKey: 'track_all',
    jobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
    phase: 'approved_execution',
    scope: {
      scopeType: 'scene',
      sourceArtifactRef,
      sceneId: 'scene-1',
      outputId: 'output-1',
      authorizedRange: {
        startFrame: 300,
        endFrameExclusive: 540,
        frameRate: { numerator: 30, denominator: 1 },
      },
      selectedSceneBindingRef: sourceBindingRef,
      completeSceneCoverageRequired: true,
    },
    sceneContextSnapshotRef: ref('scene-context-1'),
    sourceArtifactRefs: [sourceArtifactRef],
    comparisonArtifactRefs: [],
    expectedOutcomeRefs: [ref('expected-mask-outcome-1')],
    requiredEvidenceRefs: [
      sourceBindingRef,
      admission.scope.confirmedOutputFrameRef,
      admission.scope.masterTimingRef,
      compiledIntentRef,
      promptApprovalRef,
      sourceFrameLineageRef,
    ],
    manifestRef: ref('track-all-capability-manifest-1'),
    qualificationSnapshotRef: ref('track-all-qualification-snapshot-1'),
    timeBudgetRef: ref('track-all-time-budget-1'),
    creditBudgetRef: ref('track-all-credit-budget-1'),
    attemptEnvelopeRef: admission.scope.executionAttemptRef,
    approvedSnapshotRef: admission.scope.approvedSnapshotRef,
    idempotencyKey: admission.scope.idempotencyKey,
    orchestraDispatchAuthorized: true,
    directProviderCallAllowed: false,
    directTimelineMutationAllowed: false,
    directArtifactMutationAllowed: false,
    scopeExpansionAllowed: false,
    peerSkillExecutionAuthorityAccepted: false,
  })
  const trackAllOrchestraBinding =
    createCanonicalTrackAllSam31OrchestraBinding({
      bindingId: `${routeId}-track-all-sam31-binding`,
      call: orchestraCall,
      admission,
    })
  const context = buildCanonicalSam31GpuTaskContext({
    taskContextId: `${routeId}-task-context`,
    trackAllOrchestraBinding,
    editPlanVersionId: 'edit-plan-version-1',
    editPlanVersionRef: {
      id: 'edit-plan-version-1',
      version: 1,
      contentHash: hash('edit-plan-version-1'),
    },
    outputId: 'output-1',
    confirmedOutputFrameRef: admission.scope.confirmedOutputFrameRef,
    sceneId: 'scene-1',
    sourceBindingRef,
    sourceMedia: {
      mediaForm: 'private_read_only_mp4' as const,
      finalizedSourceArtifactRef: sourceArtifactRef,
      gpuPreparedMaskProxyArtifactRef: ref('gpu-mask-proxy-1'),
      exactSourceReadEvidenceRef: ref('source-read-1'),
      ffprobeOrFrameDirectoryEvidenceRef: ref('source-probe-1'),
      sourceFrameRangeMappingRef: ref('source-frame-map-1'),
      proxyPixelGeometryQaRef: ref('proxy-pixel-qa-1'),
      byteLength: maskProxyBytes.byteLength,
      sha256: maskProxySha256,
      width: 2_160,
      height: 3_840,
      decodedFrameCount: 240,
      fpsNumerator: 30,
      fpsDenominator: 1,
      selectedStartFrameInclusive: 0,
      selectedEndFrameInclusive: 239,
      canonicalSourceStartFrameInclusive: 300,
      canonicalSourceEndFrameInclusive: 539,
      boundedChunkOverlapAndStitchPlanRef: ref('chunk-stitch-1'),
      variableFrameRateAllowed: false as const,
      callerPathOrUrlAccepted: false as const,
    },
    approvedPrompt: {
      promptType: 'server_compiled_text_subject' as const,
      approvedSubjectText: 'basketball player in the foreground',
      promptFrameIndex: 0 as const,
      compiledIntentRef,
      promptApprovalRef,
      sourceFrameLineageRef,
      rawUserChatIncluded: false as const,
      executableTextIncluded: false as const,
    },
    specializedRuntimeRelease,
    primaryRateAuthorityRef: primaryRateRef,
    fallbackRateAuthorityRef: fallbackRateRef,
    privateTaskInputTransportRef: ref('sam31-private-task-input'),
    privateTaskOutputTransportRef: ref('sam31-private-task-output'),
    preparedAt: '2026-08-02T18:00:15.000Z',
  })
  return {
    admission,
    target,
    context,
    orchestraCall,
    trackAllOrchestraBinding,
  }
}

function buildAdmission(input: {
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback'
  runtimeReleaseRef: ReturnType<typeof ref>
}) {
  const primary = input.routeId === 'a100_80gb_heavy_primary'
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-dispatch-admission-v1' as const,
    source: 'canonical_server_professional_gpu_dispatch_owner' as const,
    admissionId: `${input.routeId}-admission`,
    toolId: 'sam3_1' as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: input.routeId,
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
      workerLeaseRef: ref(`${input.routeId}-lease`),
      fundedReservationRef: ref('funded-reservation-1'),
      userApprovalRecordRef: ref('user-approval-1'),
      userTriggerRecordRef: ref(`${input.routeId}-user-trigger`),
      executionAttemptRef: ref(`${input.routeId}-attempt`),
      idempotencyKey: `${input.routeId}.attempt.idempotency`,
    },
    estimateRef: ref('sam31-estimate-1'),
    estimateMaximumReservedToolCostCredits: 300,
    currentRateAuthorityRef: primary ? primaryRateRef : fallbackRateRef,
    placementPolicyRef: {
      schemaVersion:
        'canonical-quality-first-professional-tool-gpu-placement-v1' as const,
      policyHash: sha256AuthorityValue('placement-policy'),
      entryHash: sha256AuthorityValue('sam31-placement-entry'),
    },
    gpuPolicyRef: {
      schemaVersion:
        'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v3' as const,
      policyHash: sha256AuthorityValue('gpu-policy'),
    },
    runtimeReleaseRef: input.runtimeReleaseRef,
    priorPrimaryTerminalReceiptRef: primary
      ? null
      : ref('a100-known-not-executed-terminal'),
    priorPrimaryFailureClass: primary
      ? 'not_applicable' as const
      : 'a100_capacity_unavailable_before_attempt_start' as const,
    priorPrimaryOutcomeKnownNotExecuted: !primary,
    admittedAttemptOrdinal: primary ? 1 as const : 2 as const,
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
    admittedAt: '2026-08-02T18:00:00.000Z',
    expiresAt: '2026-08-02T19:00:00.000Z',
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function buildSpecializedRelease(input: {
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback'
  target: ReturnType<typeof fixture>['target']
}): unknown {
  const primary = input.routeId === 'a100_80gb_heavy_primary'
  const sourceSha =
    '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
  const checkpointSha = sha256AuthorityValue('authorized-sam31-checkpoint')
  const payload = {
    schemaVersion: 'canonical-sam3_1-gpu-runtime-release-v2' as const,
    source: 'canonical_sam3_1_gpu_runtime_release_compiler' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'private_internal_qualified' as const,
    releaseId: input.target.releaseRef.id,
    releaseVersion: 1,
    toolId: 'sam3_1' as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
    sourceCandidateRef: {
      schemaVersion: 'canonical-sam3_1-source-runtime-candidate-v4' as const,
      candidateHash: sha256AuthorityValue('sam31-candidate'),
    },
    privateArtifactIngestReceiptRef: ref('sam31-private-ingest'),
    privateArtifactIngestReceiptHash:
      sha256AuthorityValue('sam31-private-ingest'),
    ingestStatus: 'ready_for_immutable_image_build_review' as const,
    sourceArchive: {
      revision: '96914d2425f90a64f45ca977c2b5165418099543' as const,
      artifactRef: {
        id: 'sam31-source-archive',
        version: 1,
        contentHash: `sha256:${sourceSha}` as const,
      },
      byteLength: 73_605_120,
      sha256: sourceSha,
      gpuDecodePatchSha256:
        'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca' as const,
    },
    checkpoint: {
      repositoryRevision:
        'daa63191845a41281374e725f4c9e51c7a824460' as const,
      fileName: 'sam3.1_multiplex.pt' as const,
      artifactRef: {
        id: 'sam31-checkpoint',
        version: 1,
        contentHash: `sha256:${checkpointSha}` as const,
      },
      byteLength: 3_500_000_000,
      sha256: checkpointSha,
      officialGatedCheckpointOnly: true as const,
      automatedTermsAcceptanceUsed: false as const,
      thirdPartyMirrorUsed: false as const,
    },
    runtimeClosure: {
      pythonVersion: '3.12' as const,
      torchVersion: '2.10.0+cu128' as const,
      torchvisionVersion: '0.25.0+cu128' as const,
      cudaVersion: '12.8' as const,
      torchcodecVersion: '0.10.0' as const,
      einopsVersion: '0.8.2' as const,
      pycocotoolsVersion: '2.0.11' as const,
      cudaForwardCompatibilityPackageSha256:
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893' as const,
      cudaDriverLibrarySelectionEntrypointVersion:
        'weeditpro-sam3_1-cuda-driver-entrypoint-v1' as const,
      fixedBuilder: 'build_sam3_multiplex_video_predictor' as const,
      runtimeNetworkDownloadAllowed: false as const,
      cpuOnlyInferenceAllowed: false as const,
      flashAttention3Enabled: false as const,
    },
    route: {
      routeId: input.routeId,
      gpuProfileId: primary
        ? 'quality_a100_80gb_user_triggered_heavy_job_v1' as const
        : 'quality_l4_user_triggered_heavy_fallback_job_v1' as const,
      runtimeRegion: input.target.runtimeRegion,
      executionTarget: input.target.executionTarget,
      machineType: input.target.machineType,
      accelerator: input.target.accelerator,
      allocatedVcpuCount: primary ? 12 as const : 8 as const,
      allocatedMemoryGiB: primary ? 170 as const : 32 as const,
      allocatedLocalScratchGiB: 0 as const,
    },
    serviceIdentityRef: input.target.serviceIdentityRef,
    immutableImageRef: input.target.immutableImageRef,
    immutableImageDigest: input.target.immutableImageDigest,
    imageSupplyChainReleaseRef:
      ref(`${input.routeId}-image-supply-chain-release`),
    sourceAndDependencyClosureRef: ref('sam31-source-dependency-closure'),
    sbomRef: ref('sam31-sbom'),
    imageScanAndSignatureRef: ref('sam31-image-scan-signature'),
    scaleToZeroConfigurationRef: ref(`${input.routeId}-scale-zero`),
    privateNetworkAndArtifactTransportRef:
      input.target.privateNetworkAndArtifactTransportRef,
    qualification: {
      sourceCheckpointCompatibilityQualificationRef: {
        ...ref('sam31-source-checkpoint-compatibility'),
        version: 1 as const,
        schemaVersion:
          'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1' as const,
      },
      cudaDriverRuntimeQualificationRef: ref(`${input.routeId}-cuda`),
      observedNvidiaDriverVersion: primary ? '570.211.01' : '535.216.03',
      cudaDriverLibraryMode: primary
        ? 'host_driver' as const
        : 'cuda_compat_12_8' as const,
      loadedCudaDriverLibraryPathDigestSha256: sha256AuthorityValue(
        primary
          ? '/usr/local/nvidia/lib64/libcuda.so.570.211.01'
          : '/usr/local/cuda-12.8/compat/libcuda.so.570.211.01',
      ),
      cudaForwardCompatibilityPackageSha256:
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893' as const,
      cudaForwardCompatibilityLibraryLoaded: !primary,
      hostCudaDriverLibraryLoaded: primary,
      runtimeDriverAndLibraryPathEvidenceReread: true,
      substantiveGpuExecutionQualificationRef:
        ref(`${input.routeId}-gpu-execution`),
      temporalMaskQualityQualificationRef: ref(`${input.routeId}-mask-qa`),
      eightMinuteSourcePerformanceQualificationRef:
        ref(`${input.routeId}-eight-minute-performance`),
      exactToolModelAndCheckpointReread: true,
      exactPythonTorchCudaWheelAndNativeClosureReread: true,
      strictCheckpointLoadWithNoMissingOrUnexpectedKeys: true,
      actualCudaModelInferenceMeasured: true,
      actualNvdecDecodeMeasured: true,
      decodedFramesRemainedCudaResident: true,
      bfloat16AutocastMeasured: true,
      cpuOnlyInferenceObserved: false as const,
      quantizationOrResolutionReductionUsed: false as const,
      sourceResolutionAndFrameRangePreserved: true,
      temporalMaskQaPassed: true,
      directPrivateCompleteIntervalReviewPassed: true,
      qualificationRunCount: 30,
      eightMinuteSourceP95WallTimeMilliseconds: primary ? 360_000 : 470_000,
      eightMinuteSourceTargetMilliseconds: 480_000 as const,
      qualityEqualToOrBetterThanApprovedA100Baseline: true,
    },
    scaleToZero: {
      minimumIdleInstances: 0 as const,
      maximumConcurrentAttemptsPerInstance: 1 as const,
      prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
      startsOnlyFromCreateOnlyApprovedUserAttempt: true as const,
      stopsAtTerminalAttempt: true as const,
    },
    qualifiedAt: '2026-08-02T17:00:00.000Z',
    expiresAt: '2026-08-03T17:00:00.000Z',
    authority: {
      specializedReleaseObservationOnly: true as const,
      privateInternalQualified: true,
      customerCreditsMutated: false as const,
      customerBillingAuthorityGranted: false as const,
      qaApprovalGranted: false as const,
      publicDeliveryAuthorized: false as const,
      productionQualified: false as const,
    },
  }
  return canonicalSam31GpuRuntimeReleaseObservationSchema.parse({
    ...payload,
    releaseObservationHash: sha256AuthorityValue(payload),
  })
}

function rebindTaskContext(input: {
  base: ReturnType<typeof buildCanonicalSam31GpuTaskContext>
  binding: unknown
  taskContextId: string
  specializedRuntimeRelease?: unknown
}) {
  const { base } = input
  return buildCanonicalSam31GpuTaskContext({
    taskContextId: input.taskContextId,
    trackAllOrchestraBinding: input.binding,
    editPlanVersionId: base.editPlanVersionId,
    editPlanVersionRef: base.editPlanVersionRef,
    outputId: base.outputId,
    confirmedOutputFrameRef: base.confirmedOutputFrameRef,
    sceneId: base.sceneId,
    sourceBindingRef: base.sourceBindingRef,
    sourceMedia: base.sourceMedia,
    approvedPrompt: base.approvedPrompt,
    specializedRuntimeRelease:
      input.specializedRuntimeRelease ?? base.specializedRuntimeRelease,
    primaryRateAuthorityRef: base.primaryRateAuthorityRef,
    fallbackRateAuthorityRef: base.fallbackRateAuthorityRef,
    privateTaskInputTransportRef: base.privateTaskInputTransportRef,
    privateTaskOutputTransportRef: base.privateTaskOutputTransportRef,
    preparedAt: base.preparedAt,
  })
}

function reissueSpecializedReleaseWithId(value: unknown, releaseId: string) {
  const parsed = canonicalSam31GpuRuntimeReleaseObservationSchema.parse(value)
  const { releaseObservationHash: _oldHash, ...priorPayload } = parsed
  assert.ok(_oldHash)
  const payload = { ...priorPayload, releaseId }
  return canonicalSam31GpuRuntimeReleaseObservationSchema.parse({
    ...payload,
    releaseObservationHash: sha256AuthorityValue(payload),
  })
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const digest = createHash('sha256').update(input.body).digest('hex')
      assert.equal(digest, input.contentSha256)
      const existing = values.get(input.objectPath)
      if (existing) return 'already_exists'
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = values.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function memoryPrivateBinaryObjectPort(
  values: Map<string, Buffer>,
): CanonicalSam31GpuPrivateBinaryObjectPort {
  return {
    schemaVersion:
      CANONICAL_SAM3_1_GPU_PRIVATE_BINARY_OBJECT_PORT_VERSION,
    async stageCreateOnlyAndReread(input) {
      const chunks: Buffer[] = []
      let byteLength = 0
      const digest = createHash('sha256')
      for await (const chunk of await input.openSourceStream()) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        chunks.push(bytes)
        byteLength += bytes.byteLength
        digest.update(bytes)
      }
      const contentSha256 = digest.digest('hex')
      assert.equal(byteLength, input.expectedByteLength)
      assert.equal(contentSha256, input.expectedSha256)
      const body = Buffer.concat(chunks, byteLength)
      const existing = values.get(input.invocationId)
      if (existing) assert.equal(existing.equals(body), true)
      else values.set(input.invocationId, Buffer.from(body))
      const reread = values.get(input.invocationId)!
      assert.equal(
        createHash('sha256').update(reread).digest('hex'),
        input.expectedSha256,
      )
      return {
        disposition: existing ? 'identical_replay' as const : 'created' as const,
        contentType: 'video/mp4' as const,
        byteLength: reread.byteLength,
        sha256: input.expectedSha256,
        storageGeneration: '1',
        storageEtagSha256: sha256AuthorityValue(
          `etag:${input.invocationId}`,
        ),
        createdWithIfGenerationMatchZero: true as const,
        exactGenerationMetadataReread: true as const,
        exactGenerationBytesRereadAndHashed: true as const,
      }
    },
  }
}

function hash(seed: string): `sha256:${string}` {
  return `sha256:${sha256AuthorityValue(seed)}`
}

function exactRef(id: string, rawHash: string) {
  return ref(id, rawHash)
}

function ref(id: string, raw = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}
