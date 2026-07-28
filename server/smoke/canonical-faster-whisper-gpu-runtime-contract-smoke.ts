import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assertCanonicalFasterWhisperGpuRuntimeContract,
  getCanonicalFasterWhisperGpuRuntimeContract,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { CANONICAL_PRIVATE_E2E_TOOL_IDS } from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution'

const contract =
  await getCanonicalFasterWhisperGpuRuntimeContract()

assert.equal(
  contract.contractClass,
  'source_verified_cuda_only_shared_gpu_worker_operation_contract',
)
assert.equal(
  contract.operationIdentity.sharedWorkerType,
  'gpu_ai_worker',
)
assert.equal(
  contract.operationIdentity.productionToolRegistryCount,
  50,
)
assert.equal(
  contract.runtimeImage.baseImage,
  'nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04',
)
assert.equal(
  contract.runtimeImage.linuxAmd64ManifestDigest,
  'sha256:edc99e084ef003e1e6f180dbe2e9f64496c61254cb109c09060532c2d3b61d75',
)
assert.equal(
  contract.runtimeImage.cudaMinorVersionCompatibilityRequired,
  true,
)
assert.equal(
  contract.runtimeImage.cudaForwardCompatibilityPackageRequired,
  false,
)
assert.equal(
  contract.cloudRunGpuPolicy.admittedExistingRegion,
  'europe-west1',
)
assert.equal(
  contract.cloudRunGpuPolicy.blockedExistingRegion,
  'us-east1',
)
assert.equal(
  contract.cloudRunGpuPolicy.crossRegionTransferAllowed,
  false,
)
assert.equal(contract.packageIdentity.packageCount, 28)
assert.equal(contract.packageIdentity.packages.length, 28)
assert.equal(
  contract.packageIdentity.packages.find(
    (entry) => entry.packageName === 'faster-whisper',
  )?.version,
  '1.2.1',
)
assert.equal(
  contract.packageIdentity.packages.find(
    (entry) => entry.packageName === 'ctranslate2',
  )?.version,
  '4.6.2',
)
assert.equal(
  contract.packageIdentity.packages.find(
    (entry) => entry.packageName === 'numpy',
  )?.version,
  '1.26.4',
)
assert.equal(contract.fixedFileLayout.modelFiles.length, 4)
assert.equal(
  contract.fixedFileLayout.modelFiles.reduce(
    (sum, file) => sum + file.byteLength,
    0,
  ),
  486_212_372,
)
assert.equal(contract.runtimeProtocol.device, 'cuda')
assert.equal(contract.runtimeProtocol.computeType, 'float16')
assert.equal(contract.runtimeProtocol.cpuFallbackAllowed, false)
assert.equal(contract.runtimeProtocol.networkFetchAllowed, false)
assert.equal(
  contract.runtimeProtocol.outputBytesReturnedInReceipt,
  false,
)
assert.equal(
  contract.runtimeProtocol.transcriptTextReturnedInReceipt,
  false,
)
assert.equal(
  contract.runtimeProtocol.maximumSingleOutputBytes,
  33_554_432,
)
assert.equal(
  contract.runtimeProtocol.maximumCombinedOutputBytes,
  67_108_864,
)
assert.equal(contract.boundaries.runnerSourceImplemented, true)
assert.equal(
  contract.boundaries.packageDependencyLockVerified,
  true,
)
assert.equal(contract.boundaries.runtimeImageBuilt, false)
assert.equal(
  contract.boundaries.cloudRunL4CudaCompatibilityVerified,
  false,
)
assert.equal(
  contract.boundaries.ctranslate2CudaModelLoadVerified,
  false,
)
assert.equal(
  contract.boundaries.fasterWhisperInferenceVerified,
  false,
)
assert.equal(contract.boundaries.cloudDispatchAuthorized, false)
assert.equal(contract.boundaries.productionReady, false)
assert.equal(CANONICAL_PRIVATE_E2E_TOOL_IDS.length, 50)
assert.equal(
  (CANONICAL_PRIVATE_E2E_TOOL_IDS as readonly string[])
    .includes('faster_whisper'),
  false,
)
assert.equal(
  resolveProfessionalToolOperationSpec('faster_whisper'),
  undefined,
)
assert.deepEqual(
  await assertCanonicalFasterWhisperGpuRuntimeContract(
    structuredClone(contract),
  ),
  contract,
)

const runnerPath = fileURLToPath(new URL(
  '../../docker/prod/gpu-worker/faster-whisper/runner.py',
  import.meta.url,
))
const compiled = spawnSync(
  'python3',
  ['-m', 'py_compile', runnerPath],
  {
    env: {
      ...process.env,
      PYTHONPYCACHEPREFIX: join(
        tmpdir(),
        `reeditpro-faster-whisper-pyc-${process.pid}`,
      ),
    },
    encoding: 'utf8',
  },
)
assert.equal(
  compiled.status,
  0,
  `Faster Whisper runner syntax failed: ${compiled.stderr}`,
)

const malformedRun = runRunner({})
assert.equal(malformedRun.status, 3)
assert.deepEqual(JSON.parse(malformedRun.stdout), {
  schemaVersion:
    'canonical-faster-whisper-gpu-runtime-response-v1',
  ok: false,
  code: 'REQUEST_VALIDATION_FAILED',
})
assert.equal(
  malformedRun.stderr,
  'Private Faster Whisper GPU execution failed.\n',
)
assert.doesNotMatch(
  `${malformedRun.stdout}\n${malformedRun.stderr}`,
  /traceback|exception|\/Users\/|\/Volumes\//iu,
)

const runtimeRequestWithoutBinding = {
  schemaVersion:
    'canonical-faster-whisper-gpu-runtime-request-v1',
  operationId:
    'tool.faster_whisper.transcribe_private_audio.v1',
  admissionDigestSha256: 'a'.repeat(64),
  dispatch: {
    dispatchIntentId: 'dispatch-intent-faster-whisper-0001',
    dispatchBindingHash: 'b'.repeat(64),
    attemptPlanHash: 'c'.repeat(64),
    runtimeRegion: 'europe-west1',
  },
  source: {
    artifactId: 'audio-artifact-0001',
    contentSha256: 'd'.repeat(64),
    byteLength: 44,
    durationMilliseconds: 1,
    contentType: 'audio/wav',
    sampleRateHz: 16_000,
    channelCount: 1,
    sampleFormat: 'pcm_s16le',
  },
  modelArtifacts: contract.fixedFileLayout.modelFiles,
  settings: {
    device: 'cuda',
    computeType: 'float16',
    beamSize: 5,
    wordTimestamps: true,
    vadFilter: true,
    languagePolicy: 'auto_detect_v1',
    temperature: 0,
    conditionOnPreviousText: true,
  },
}
const runtimeRequest = {
  ...runtimeRequestWithoutBinding,
  requestBindingSha256:
    sha256AuthorityValue(runtimeRequestWithoutBinding),
}

const noMountRun = runRunner(runtimeRequest)
assert.equal(noMountRun.status, 3)
assert.deepEqual(JSON.parse(noMountRun.stdout), {
  schemaVersion:
    'canonical-faster-whisper-gpu-runtime-response-v1',
  ok: false,
  code: 'MODEL_ARTIFACT_VALIDATION_FAILED',
})
assert.equal(
  noMountRun.stderr,
  'Private Faster Whisper GPU execution failed.\n',
)

const bindingTamperRun = runRunner({
  ...runtimeRequest,
  requestBindingSha256: '0'.repeat(64),
})
assert.equal(bindingTamperRun.status, 3)
assert.equal(
  JSON.parse(bindingTamperRun.stdout).code,
  'REQUEST_VALIDATION_FAILED',
)

const cpuRun = runRunner({
  ...runtimeRequest,
  settings: {
    ...runtimeRequest.settings,
    device: 'cpu',
  },
})
assert.equal(cpuRun.status, 3)
assert.equal(
  JSON.parse(cpuRun.stdout).code,
  'REQUEST_VALIDATION_FAILED',
)

const blockedRegionRun = runRunner({
  ...runtimeRequest,
  dispatch: {
    ...runtimeRequest.dispatch,
    runtimeRegion: 'us-east1',
  },
})
assert.equal(blockedRegionRun.status, 3)
assert.equal(
  JSON.parse(blockedRegionRun.stdout).code,
  'REQUEST_VALIDATION_FAILED',
)

const pathInjectionRun = runRunner({
  ...runtimeRequest,
  sourcePath: '/tmp/caller.wav',
})
assert.equal(pathInjectionRun.status, 3)
assert.equal(
  JSON.parse(pathInjectionRun.stdout).code,
  'REQUEST_VALIDATION_FAILED',
)

let adversarialAssertions = 0
await expectRejects({
  ...structuredClone(contract),
  forgedAuthority: true,
}, 'unknown contract field')
await expectRejects({
  ...structuredClone(contract),
  operationIdentity: {
    ...contract.operationIdentity,
    registryPromotionAuthorized: true,
  },
}, 'registry promotion')
await expectRejects({
  ...structuredClone(contract),
  runtimeImage: {
    ...contract.runtimeImage,
    baseImage: 'nvidia/cuda:latest',
  },
}, 'mutable base image')
await expectRejects({
  ...structuredClone(contract),
  cloudRunGpuPolicy: {
    ...contract.cloudRunGpuPolicy,
    admittedExistingRegion: 'us-east1',
  },
}, 'unsupported L4 region')
await expectRejects({
  ...structuredClone(contract),
  fixedFileLayout: {
    ...contract.fixedFileLayout,
    callerPathsAccepted: true,
  },
}, 'caller path promotion')
await expectRejects({
  ...structuredClone(contract),
  runtimeProtocol: {
    ...contract.runtimeProtocol,
    cpuFallbackAllowed: true,
  },
}, 'CPU fallback promotion')
await expectRejects({
  ...structuredClone(contract),
  runtimeProtocol: {
    ...contract.runtimeProtocol,
    outputBytesReturnedInReceipt: true,
  },
}, 'output bytes in receipt')
await expectRejects({
  ...structuredClone(contract),
  packageIdentity: {
    ...contract.packageIdentity,
    packages: contract.packageIdentity.packages.map(
      (entry, index) => index === 0
        ? { ...entry, wheelSha256: '0'.repeat(64) }
        : entry,
    ),
  },
}, 'dependency hash tampering')
await expectRejects({
  ...structuredClone(contract),
  sourceFiles: contract.sourceFiles.map(
    (entry, index) => index === 0
      ? { ...entry, contentSha256: '0'.repeat(64) }
      : entry,
  ),
}, 'runner source tampering')
await expectRejects({
  ...structuredClone(contract),
  boundaries: {
    ...contract.boundaries,
    runtimeAuthority: true,
  },
}, 'runtime authority promotion')
await expectRejects({
  ...structuredClone(contract),
  boundaries: {
    ...contract.boundaries,
    productionReady: true,
  },
}, 'production authority promotion')

console.log(JSON.stringify({
  ok: true,
  productionToolRegistryCount:
    CANONICAL_PRIVATE_E2E_TOOL_IDS.length,
  fasterWhisperRegistered: false,
  sourceFiles: contract.sourceFiles.length,
  dependencyPackages: contract.packageIdentity.packageCount,
  modelArtifacts: contract.fixedFileLayout.modelFiles.length,
  modelArtifactBytes:
    contract.fixedFileLayout.modelFiles.reduce(
      (sum, file) => sum + file.byteLength,
      0,
    ),
  admittedExistingL4Region:
    contract.cloudRunGpuPolicy.admittedExistingRegion,
  blockedExistingUsRegion:
    contract.cloudRunGpuPolicy.blockedExistingRegion,
  invalidRunnerRequestRejected: true,
  requestBindingTamperingRejected: true,
  missingMountsRejectedBeforeGpuImport: true,
  cpuFallbackRejected: true,
  callerPathRejected: true,
  adversarialAssertions,
}, null, 2))

function runRunner(value: unknown) {
  return spawnSync('python3', ['-B', runnerPath], {
    input: JSON.stringify(value),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
}

async function expectRejects(
  value: unknown,
  label: string,
): Promise<void> {
  await assert.rejects(
    () => assertCanonicalFasterWhisperGpuRuntimeContract(
      value,
    ),
    (error: unknown) => {
      assert.equal(
        (error as { code?: unknown }).code,
        'TOOL_NOT_READY',
        label,
      )
      return true
    },
  )
  adversarialAssertions += 1
}
