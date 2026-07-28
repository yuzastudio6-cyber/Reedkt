import assert from 'node:assert/strict'

import {
  CANONICAL_GPU_WORKER_FASTER_WHISPER_PYTHON,
  CANONICAL_GPU_WORKER_FASTER_WHISPER_RUNNER,
  createCanonicalGpuWorkerOperationRuntimePort,
  createCanonicalGpuWorkerFasterWhisperSubprocessRuntimePort,
  getCanonicalFasterWhisperGpuRuntimeContract,
  hashCanonicalGpuWorkerStderr,
  routeCanonicalGpuWorkerOperation,
  type CanonicalFasterWhisperGpuRuntimeRunnerRequest,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const runtimeContract =
  await getCanonicalFasterWhisperGpuRuntimeContract()
const requestWithoutBinding = {
  schemaVersion:
    'canonical-faster-whisper-gpu-runtime-request-v1' as const,
  operationId:
    'tool.faster_whisper.transcribe_private_audio.v1' as const,
  admissionDigestSha256: 'a'.repeat(64),
  dispatch: {
    dispatchIntentId: 'dispatch-intent-faster-whisper-0001',
    dispatchBindingHash: 'b'.repeat(64),
    attemptPlanHash: 'c'.repeat(64),
    runtimeRegion: 'europe-west1' as const,
  },
  source: {
    artifactId: 'private-audio-artifact-0001',
    contentSha256: 'd'.repeat(64),
    byteLength: 9_600_044,
    durationMilliseconds: 300_000,
    contentType: 'audio/wav' as const,
    sampleRateHz: 16_000 as const,
    channelCount: 1 as const,
    sampleFormat: 'pcm_s16le' as const,
  },
  modelArtifacts: runtimeContract.fixedFileLayout.modelFiles,
  settings: {
    device: 'cuda' as const,
    computeType: 'float16' as const,
    beamSize: 5 as const,
    wordTimestamps: true as const,
    vadFilter: true as const,
    languagePolicy: 'auto_detect_v1' as const,
    temperature: 0 as const,
    conditionOnPreviousText: true as const,
  },
}
const request: CanonicalFasterWhisperGpuRuntimeRunnerRequest = {
  ...requestWithoutBinding,
  requestBindingSha256:
    sha256AuthorityValue(requestWithoutBinding),
}

let invocationCount = 0
let observedSerializedRequest = ''
const runtimePort =
  createCanonicalGpuWorkerOperationRuntimePort({
    evidenceClass: 'controlled_source_fixture',
    async execute(input) {
      invocationCount += 1
      observedSerializedRequest = input.serializedRequest
      assert.deepEqual(input.request, request)
      assert.equal(input.maximumResponseBytes, 128 * 1_024)
      assert.equal(
        input.timeoutMilliseconds,
        2 * 60 * 60 * 1_000,
      )
      const response = successResponse(input.request)
      const stdout = JSON.stringify(response)
      return {
        wireResponse: response,
        process: {
          exitCode: 0,
          timedOut: false,
          oomKilled: false,
          stdoutByteLength: Buffer.byteLength(stdout),
          stderrByteLength: 0,
          stderrSha256: hashCanonicalGpuWorkerStderr(''),
        },
      }
    },
  })

const receipt = await routeCanonicalGpuWorkerOperation({
  request,
  runtimePort,
})

assert.equal(invocationCount, 1)
assert.equal(
  observedSerializedRequest,
  stableAuthorityStringify(request),
)
assert.equal(
  receipt.operation.operationId,
  'tool.faster_whisper.transcribe_private_audio.v1',
)
assert.equal(receipt.operation.sharedWorkerType, 'gpu_ai_worker')
assert.equal(receipt.operation.executionTarget, 'google_cloud_run_gpu')
assert.equal(receipt.operation.accelerator, 'nvidia_l4')
assert.equal(receipt.operation.device, 'cuda')
assert.equal(receipt.operation.cpuFallbackAllowed, false)
assert.equal(
  receipt.runtimeContract.contractDigestSha256,
  runtimeContract.contractDigestSha256,
)
assert.equal(
  receipt.runtimeContract.sourceDigestSha256,
  runtimeContract.sourceDigestSha256,
)
assert.equal(
  receipt.runtimePort.evidenceClass,
  'controlled_source_fixture',
)
assert.equal(receipt.runtimePort.processInvoked, true)
assert.equal(receipt.runtimePort.oneShotPortConsumed, true)
assert.equal(receipt.response.runtimeIdentity.cudaDeviceCount, 1)
assert.equal(receipt.response.outputs.length, 3)
assert.equal(receipt.summary.outputBytesIncluded, false)
assert.equal(receipt.summary.transcriptTextIncluded, false)
assert.equal(
  receipt.boundaries.operationRouterSourceImplemented,
  true,
)
assert.equal(receipt.boundaries.controlledFixtureOnly, true)
assert.equal(
  receipt.boundaries.actualCloudRunExecutionVerified,
  false,
)
assert.equal(receipt.boundaries.cloudDispatchAuthority, false)
assert.equal(receipt.boundaries.productionAuthority, false)
assert.equal(receipt.receiptDigestSha256.length, 64)

const fixedSubprocessPort =
  createCanonicalGpuWorkerFasterWhisperSubprocessRuntimePort()
assert.equal(
  fixedSubprocessPort.evidenceClass,
  'fixed_gpu_subprocess_unqualified',
)
assert.deepEqual(fixedSubprocessPort.supportedOperationIds, [
  'tool.faster_whisper.transcribe_private_audio.v1',
])
assert.equal(
  CANONICAL_GPU_WORKER_FASTER_WHISPER_PYTHON,
  '/opt/reeditpro/gpu-operations/faster-whisper/venv/bin/python',
)
assert.equal(
  CANONICAL_GPU_WORKER_FASTER_WHISPER_RUNNER,
  '/opt/reeditpro/gpu-operations/faster-whisper/runner.py',
)

let adversarialAssertions = 0

await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort,
  }),
  'runtime port replay',
  'canonical_gpu_worker_process_bound_runtime_port_required',
)

const clonedPort = {
  ...createFixturePort(),
}
await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort: clonedPort,
  }),
  'cloned runtime port',
  'canonical_gpu_worker_process_bound_runtime_port_required',
)

await expectRejects(
  () => routeWithFreshPort({
    ...request,
    requestBindingSha256: '0'.repeat(64),
  }),
  'request binding tamper',
  'canonical_gpu_worker_runtime_request_binding_mismatch',
)

await expectRejects(
  () => routeWithFreshPort({
    ...request,
    settings: {
      ...request.settings,
      device: 'cpu',
    },
  }),
  'CPU substitution',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => routeWithFreshPort({
    ...request,
    dispatch: {
      ...request.dispatch,
      runtimeRegion: 'us-east1',
    },
  }),
  'non-admitted region',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => routeWithFreshPort({
    ...request,
    sourcePath: '/tmp/caller.wav',
  }),
  'caller path',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => routeWithFreshPort({
    ...request,
    modelArtifacts: [
      request.modelArtifacts[1],
      request.modelArtifacts[0],
      request.modelArtifacts[2],
      request.modelArtifacts[3],
    ],
  }),
  'model artifact reorder',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort:
      createCanonicalGpuWorkerOperationRuntimePort({
        evidenceClass: 'controlled_source_fixture',
        async execute() {
          return {
            wireResponse: successResponse(request),
            process: {
              exitCode: 3,
              timedOut: false,
              oomKilled: false,
              stdoutByteLength: 64,
              stderrByteLength: 8,
              stderrSha256:
                hashCanonicalGpuWorkerStderr('failure'),
            },
          }
        },
      }),
  }),
  'runtime process failure',
  'canonical_gpu_worker_runtime_process_failed',
)

await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort:
      createCanonicalGpuWorkerOperationRuntimePort({
        evidenceClass: 'controlled_source_fixture',
        async execute() {
          const response = successResponse(request)
          return successfulPortResult({
            ...response,
            dispatchIntentId: 'dispatch-intent-substituted-0001',
          })
        },
      }),
  }),
  'response dispatch lineage substitution',
  'faster_whisper_gpu_runtime_result_request_lineage_mismatch',
)

await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort:
      createCanonicalGpuWorkerOperationRuntimePort({
        evidenceClass: 'controlled_source_fixture',
        async execute() {
          const response = successResponse(request)
          return successfulPortResult({
            ...response,
            runtimeIdentity: {
              ...response.runtimeIdentity,
              device: 'cpu',
            },
          })
        },
      }),
  }),
  'response CPU substitution',
  'faster_whisper_gpu_runtime_result_wire_invalid',
)

await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort:
      createCanonicalGpuWorkerOperationRuntimePort({
        evidenceClass: 'controlled_source_fixture',
        async execute() {
          const response = successResponse(request)
          return successfulPortResult({
            ...response,
            outputPath: '/tmp/transcript.json',
          })
        },
      }),
  }),
  'response caller path',
  'faster_whisper_gpu_runtime_result_wire_invalid',
)

console.log(JSON.stringify({
  ok: true,
  operationId: receipt.operation.operationId,
  sharedWorkerType: receipt.operation.sharedWorkerType,
  executionTarget: receipt.operation.executionTarget,
  runtimePortEvidenceClass: receipt.runtimePort.evidenceClass,
  outputCount: receipt.response.outputs.length,
  operationRouterSourceImplemented:
    receipt.boundaries.operationRouterSourceImplemented,
  actualCloudRunExecutionVerified:
    receipt.boundaries.actualCloudRunExecutionVerified,
  productionAuthority:
    receipt.boundaries.productionAuthority,
  adversarialAssertions,
}))

function createFixturePort() {
  return createCanonicalGpuWorkerOperationRuntimePort({
    evidenceClass: 'controlled_source_fixture',
    async execute() {
      return successfulPortResult(successResponse(request))
    },
  })
}

async function routeWithFreshPort(value: unknown) {
  return routeCanonicalGpuWorkerOperation({
    request: value,
    runtimePort: createFixturePort(),
  })
}

function successResponse(
  value: CanonicalFasterWhisperGpuRuntimeRunnerRequest,
) {
  return {
    schemaVersion:
      'canonical-faster-whisper-gpu-runtime-response-v1' as const,
    ok: true as const,
    status:
      'controlled_faster_whisper_gpu_inference_completed' as const,
    operationId: value.operationId,
    admissionDigestSha256: value.admissionDigestSha256,
    requestBindingSha256: value.requestBindingSha256,
    dispatchIntentId: value.dispatch.dispatchIntentId,
    runtimeIdentity: {
      fasterWhisperVersion: '1.2.1' as const,
      ctranslate2Version: '4.6.2' as const,
      cudaDeviceCount: 1,
      device: 'cuda' as const,
      computeType: 'float16' as const,
      runtimeRegion: 'europe-west1' as const,
    },
    outputs: [
      {
        canonicalOrder: 0 as const,
        artifactKind: 'transcript_json' as const,
        fileName: 'transcript.json' as const,
        byteLength: 18_402,
        contentSha256: 'e'.repeat(64),
      },
      {
        canonicalOrder: 1 as const,
        artifactKind: 'caption_segments_json' as const,
        fileName: 'caption-segments.json' as const,
        byteLength: 5_817,
        contentSha256: 'f'.repeat(64),
      },
      {
        canonicalOrder: 2 as const,
        artifactKind: 'analysis_report' as const,
        fileName: 'analysis-report.json' as const,
        byteLength: 614,
        contentSha256: '1'.repeat(64),
      },
    ] as const,
    receiptBoundaries: {
      outputBytesIncluded: false as const,
      transcriptTextIncluded: false as const,
      sourceBytesIncluded: false as const,
      modelBytesIncluded: false as const,
      pathsIncluded: false as const,
      urlsIncluded: false as const,
      credentialsIncluded: false as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      artifactCommitAuthority: false as const,
      qaPassAuthority: false as const,
      productionReady: false as const,
    },
  }
}

function successfulPortResult(wireResponse: unknown) {
  const serialized = JSON.stringify(wireResponse)
  return {
    wireResponse,
    process: {
      exitCode: 0,
      timedOut: false,
      oomKilled: false,
      stdoutByteLength: Buffer.byteLength(serialized),
      stderrByteLength: 0,
      stderrSha256: hashCanonicalGpuWorkerStderr(''),
    },
  }
}

async function expectRejects(
  action: () => Promise<unknown>,
  label: string,
  expectedCode: string,
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) => {
      assert.ok(error instanceof Error, `${label}: missing error`)
      assert.match(error.message, new RegExp(expectedCode, 'u'))
      return true
    },
  )
  adversarialAssertions += 1
}
