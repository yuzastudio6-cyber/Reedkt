import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assertCanonicalRembgGpuRuntimeContract,
  createCanonicalGpuWorkerRembgSubprocessRuntimePort,
  getCanonicalRembgGpuRuntimeContract,
  CANONICAL_GPU_WORKER_REMBG_PYTHON,
  CANONICAL_GPU_WORKER_REMBG_RUNNER,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { CANONICAL_PRIVATE_E2E_TOOL_IDS } from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution'

const contract = await getCanonicalRembgGpuRuntimeContract()

assert.equal(
  contract.contractClass,
  'source_verified_cuda_only_shared_gpu_worker_operation_contract',
)
assert.equal(contract.operationIdentity.approvedToolId, 'rembg')
assert.equal(
  contract.operationIdentity.operationId,
  'tool.rembg.remove_image_background.v1',
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
  contract.runtimeImage.pythonVersion,
  '3.11.14',
)
assert.equal(
  contract.cloudRunGpuPolicy.admittedExistingRegion,
  'europe-west1',
)
assert.equal(
  contract.cloudRunGpuPolicy.blockedExistingRegion,
  'us-east1',
)
assert.equal(contract.packageIdentity.packageCount, 29)
assert.equal(contract.packageIdentity.packages.length, 29)
assert.equal(
  contract.packageIdentity.packages.find(
    (entry) => entry.packageName === 'rembg',
  )?.version,
  '2.0.76',
)
assert.equal(
  contract.packageIdentity.packages.find(
    (entry) => entry.packageName === 'onnxruntime-gpu',
  )?.version,
  '1.27.0',
)
assert.equal(contract.fixedFileLayout.modelFiles.length, 1)
assert.equal(
  contract.fixedFileLayout.modelFiles[0].contentSha256,
  '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
)
assert.equal(contract.runtimeProtocol.device, 'cuda')
assert.equal(
  contract.runtimeProtocol.executionProvider,
  'CUDAExecutionProvider',
)
assert.equal(contract.runtimeProtocol.cpuFallbackAllowed, false)
assert.equal(contract.runtimeProtocol.networkFetchAllowed, false)
assert.equal(
  contract.runtimeProtocol.outputBytesReturnedInReceipt,
  false,
)
assert.equal(contract.boundaries.runnerSourceImplemented, true)
assert.equal(
  contract.boundaries.packageDependencyLockVerified,
  true,
)
assert.equal(contract.boundaries.runtimeImageBuilt, false)
assert.equal(
  contract.boundaries.onnxRuntimeCudaProviderLoadVerified,
  false,
)
assert.equal(contract.boundaries.u2netpInferenceVerified, false)
assert.equal(contract.boundaries.cloudDispatchAuthorized, false)
assert.equal(contract.boundaries.productionReady, false)
assert.equal(CANONICAL_PRIVATE_E2E_TOOL_IDS.length, 50)
assert.equal(
  (CANONICAL_PRIVATE_E2E_TOOL_IDS as readonly string[])
    .includes('rembg'),
  true,
)
assert.equal(
  resolveProfessionalToolOperationSpec('rembg')
    ?.allowedOperationIds[0],
  'tool.rembg.remove_image_background.v1',
)
assert.deepEqual(
  await assertCanonicalRembgGpuRuntimeContract(
    structuredClone(contract),
  ),
  contract,
)

const subprocessPort =
  createCanonicalGpuWorkerRembgSubprocessRuntimePort()
assert.deepEqual(subprocessPort.supportedOperationIds, [
  'tool.rembg.remove_image_background.v1',
])
assert.equal(
  CANONICAL_GPU_WORKER_REMBG_PYTHON,
  '/opt/reeditpro/gpu-operations/rembg/venv/bin/python',
)
assert.equal(
  CANONICAL_GPU_WORKER_REMBG_RUNNER,
  '/opt/reeditpro/gpu-operations/rembg/runner.py',
)

const runnerPath = fileURLToPath(new URL(
  '../../docker/prod/gpu-worker/rembg/runner.py',
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
        `weeditpro-rembg-pyc-${process.pid}`,
      ),
    },
    encoding: 'utf8',
  },
)
assert.equal(
  compiled.status,
  0,
  `rembg runner syntax failed: ${compiled.stderr}`,
)

const malformedRun = runRunner({})
assert.equal(malformedRun.status, 3)
assert.deepEqual(JSON.parse(malformedRun.stdout), {
  schemaVersion: 'canonical-rembg-gpu-runtime-response-v1',
  ok: false,
  code: 'REQUEST_VALIDATION_FAILED',
})
assert.equal(
  malformedRun.stderr,
  'Private rembg GPU execution failed.\n',
)
assert.doesNotMatch(
  `${malformedRun.stdout}\n${malformedRun.stderr}`,
  /traceback|exception|\/Users\/|\/Volumes\//iu,
)

const runtimeRequestWithoutBinding = {
  schemaVersion: 'canonical-rembg-gpu-runtime-request-v1',
  operationId: 'tool.rembg.remove_image_background.v1',
  admissionDigestSha256: 'a'.repeat(64),
  dispatch: {
    dispatchIntentId: 'dispatch-intent-rembg-0001',
    dispatchBindingHash: 'b'.repeat(64),
    attemptPlanHash: 'c'.repeat(64),
    runtimeRegion: 'europe-west1',
  },
  source: {
    artifactId: 'source-frame-artifact-0001',
    contentSha256: 'd'.repeat(64),
    byteLength: 96,
    contentType: 'image/png',
    width: 4,
    height: 3,
    decodedRgbaSha256: 'e'.repeat(64),
    opaquePixelCount: 12,
  },
  modelArtifacts: contract.fixedFileLayout.modelFiles,
  settings: {
    device: 'cuda',
    modelId: 'u2netp',
    outputMode: 'mask_only_png',
    confidenceThreshold: 0.5,
    alphaMatteMode: 'straight',
    edgeRefinementProfileId:
      'approved_u2netp_default_v1',
    maximumSubjects: 1,
    preserveSourceDimensions: true,
    runtimeDownloadAllowed: false,
    networkFetchAllowed: false,
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
  schemaVersion: 'canonical-rembg-gpu-runtime-response-v1',
  ok: false,
  code: 'MODEL_ARTIFACT_VALIDATION_FAILED',
})
assert.equal(
  noMountRun.stderr,
  'Private rembg GPU execution failed.\n',
)

assert.equal(
  JSON.parse(runRunner({
    ...runtimeRequest,
    requestBindingSha256: '0'.repeat(64),
  }).stdout).code,
  'REQUEST_VALIDATION_FAILED',
)
assert.equal(
  JSON.parse(runRunner({
    ...runtimeRequest,
    settings: {
      ...runtimeRequest.settings,
      device: 'cpu',
    },
  }).stdout).code,
  'REQUEST_VALIDATION_FAILED',
)
assert.equal(
  JSON.parse(runRunner({
    ...runtimeRequest,
    dispatch: {
      ...runtimeRequest.dispatch,
      runtimeRegion: 'us-east1',
    },
  }).stdout).code,
  'REQUEST_VALIDATION_FAILED',
)
assert.equal(
  JSON.parse(runRunner({
    ...runtimeRequest,
    sourcePath: '/tmp/caller.png',
  }).stdout).code,
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
    registryMutationAuthorized: true,
  },
}, 'registry mutation')
await expectRejects({
  ...structuredClone(contract),
  runtimeImage: {
    ...contract.runtimeImage,
    baseImage: 'nvidia/cuda:latest',
  },
}, 'mutable base image')
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
  rembgRegistered: true,
  sourceFiles: contract.sourceFiles.length,
  dependencyPackages: contract.packageIdentity.packageCount,
  modelArtifacts: contract.fixedFileLayout.modelFiles.length,
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
    maxBuffer: 1_024 * 1_024,
  })
}

async function expectRejects(
  value: unknown,
  label: string,
): Promise<void> {
  await assert.rejects(
    () => assertCanonicalRembgGpuRuntimeContract(value),
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
