import assert from 'node:assert/strict'

import {
  CANONICAL_GPU_WORKER_SAM2_PYTHON,
  CANONICAL_GPU_WORKER_SAM2_RUNNER,
  assertCanonicalSam2GpuRuntimeContract,
  createCanonicalGpuWorkerOperationRuntimePort,
  createCanonicalGpuWorkerSam2SubprocessRuntimePort,
  getCanonicalSam2GpuRuntimeContract,
  hashCanonicalGpuWorkerStderr,
  routeCanonicalGpuWorkerOperation,
  type CanonicalSam2GpuRuntimeRunnerRequest,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const contract = await getCanonicalSam2GpuRuntimeContract()
assert.deepEqual(
  await assertCanonicalSam2GpuRuntimeContract(
    structuredClone(contract),
  ),
  contract,
)
assert.equal(contract.operationIdentity.requestedToolId, 'sam2')
assert.equal(
  contract.operationIdentity.registryCountIsProductCap,
  false,
)
assert.equal(contract.boundaries.runnerSourceImplemented, true)
assert.equal(contract.boundaries.checkpointIngested, false)
assert.equal(contract.boundaries.sam2InferenceVerified, false)

const promptWithoutDigest = {
  promptPacketVersion:
    'canonical-sam2-subject-prompt-packet-v1' as const,
  promptPacketClass:
    'server_compiled_normalized_subject_selection' as const,
  subjectSelectionId: 'subject-selection-sam2-router-0001',
  sourceArtifactId: 'private-source-video-sam2-router-0001',
  sourceArtifactSha256: '1'.repeat(64),
  sourceFrameIndex: 0,
  sourceFrameWidth: 320,
  sourceFrameHeight: 180,
  coordinateSpace: 'normalized_source_frame' as const,
  subjectCount: 1 as const,
  approvedSubjectLabelIncluded: false as const,
  rawChatIncluded: false as const,
  rawMediaIncluded: false as const,
  promptMode: 'box' as const,
  boundingBox: {
    x: 0.2,
    y: 0.1,
    width: 0.5,
    height: 0.8,
  },
  points: [] as const,
}
const subjectPrompt = {
  ...promptWithoutDigest,
  promptDigestSha256:
    sha256AuthorityValue(promptWithoutDigest),
}
const promptArtifactBytes = Buffer.byteLength(
  stableAuthorityStringify(subjectPrompt),
  'utf8',
)
const requestWithoutBinding = {
  schemaVersion:
    'canonical-sam2-gpu-runtime-request-v1' as const,
  operationId:
    'tool.sam2.segment_and_track_subject.v1' as const,
  admissionDigestSha256: '2'.repeat(64),
  dispatch: {
    dispatchIntentId: 'dispatch-intent-sam2-router-0001',
    dispatchBindingHash: '3'.repeat(64),
    attemptPlanHash: '4'.repeat(64),
    runtimeRegion: 'europe-west1' as const,
  },
  source: {
    artifactId: promptWithoutDigest.sourceArtifactId,
    contentSha256: promptWithoutDigest.sourceArtifactSha256,
    byteLength: 2_400_000,
    contentType: 'video/mp4' as const,
    width: 320,
    height: 180,
    frameCount: 48,
    fpsNumerator: 24,
    fpsDenominator: 1,
    durationMilliseconds: 2_000,
    sourceExpectationDigestSha256: '5'.repeat(64),
  },
  subjectPromptArtifact: {
    artifactId: 'private-prompt-sam2-router-0001',
    contentSha256: sha256AuthorityValue(subjectPrompt),
    byteLength: promptArtifactBytes,
    contentType: 'application/json' as const,
    canonicalJsonEncoding:
      'stable_authority_json_utf8_no_bom' as const,
  },
  subjectPrompt,
  modelArtifacts: contract.fixedFileLayout.modelFiles,
  settings: {
    device: 'cuda' as const,
    modelConfigPath:
      'configs/sam2.1/sam2.1_hiera_s.yaml' as const,
    confidenceThreshold: 0.8,
    maximumSubjects: 1 as const,
    frameStride: 1 as const,
    preserveContactObjects: true,
    subjectPromptProfile:
      'normalized_box_or_points_v1' as const,
    subjectPromptSha256: sha256AuthorityValue(subjectPrompt),
    outputMode:
      'gray8_ffv1_matroska_mask_sequence_v1' as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
  },
}
const request: CanonicalSam2GpuRuntimeRunnerRequest = {
  ...requestWithoutBinding,
  requestBindingSha256:
    sha256AuthorityValue(requestWithoutBinding),
}

let invocationCount = 0
const receipt = await routeCanonicalGpuWorkerOperation({
  request,
  runtimePort: createCanonicalGpuWorkerOperationRuntimePort({
    evidenceClass: 'controlled_source_fixture',
    supportedOperationIds: [
      'tool.sam2.segment_and_track_subject.v1',
    ],
    async execute(input) {
      invocationCount += 1
      assert.deepEqual(input.request, request)
      assert.equal(
        input.serializedRequest,
        stableAuthorityStringify(request),
      )
      return successfulPortResult(
        successfulWireResponse(request),
      )
    },
  }),
})

assert.equal(invocationCount, 1)
assert.equal(
  receipt.operation.operationId,
  'tool.sam2.segment_and_track_subject.v1',
)
assert.equal(receipt.operation.computeType, 'model_native')
assert.equal(
  receipt.runtimeContract.contractDigestSha256,
  contract.contractDigestSha256,
)
assert.equal(
  receipt.response.operationId,
  'tool.sam2.segment_and_track_subject.v1',
)
assert.equal(receipt.response.outputs.length, 3)
assert.equal(receipt.summary.outputCount, 3)
assert.equal(receipt.summary.processEvidenceCount, 0)
assert.equal(receipt.summary.maskBytesIncluded, false)
assert.equal(receipt.boundaries.actualCloudRunExecutionVerified, false)
assert.equal(receipt.boundaries.cloudDispatchAuthority, false)
assert.equal(receipt.boundaries.productionAuthority, false)

const subprocessPort =
  createCanonicalGpuWorkerSam2SubprocessRuntimePort()
assert.deepEqual(subprocessPort.supportedOperationIds, [
  'tool.sam2.segment_and_track_subject.v1',
])
assert.equal(CANONICAL_GPU_WORKER_SAM2_PYTHON, '/usr/bin/python3')
assert.equal(
  CANONICAL_GPU_WORKER_SAM2_RUNNER,
  '/opt/reeditpro/gpu-operations/sam2/runner.py',
)

let adversarialAssertions = 0

await expectRejects(
  () => routeWithFreshPort({
    ...request,
    sourcePath: '/tmp/caller-source.mp4',
  }),
  'caller source path',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => {
    const tamperedPrompt = {
      ...subjectPrompt,
      promptDigestSha256: '0'.repeat(64),
    }
    const tamperedWithoutBinding = {
      ...requestWithoutBinding,
      subjectPrompt: tamperedPrompt,
      subjectPromptArtifact: {
        ...requestWithoutBinding.subjectPromptArtifact,
        contentSha256: sha256AuthorityValue(tamperedPrompt),
        byteLength: Buffer.byteLength(
          stableAuthorityStringify(tamperedPrompt),
          'utf8',
        ),
      },
      settings: {
        ...requestWithoutBinding.settings,
        subjectPromptSha256:
          sha256AuthorityValue(tamperedPrompt),
      },
    }
    return routeWithFreshPort({
      ...tamperedWithoutBinding,
      requestBindingSha256:
        sha256AuthorityValue(tamperedWithoutBinding),
    })
  },
  'forged prompt digest',
  'canonical_gpu_worker_runtime_request_invalid',
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
  'region substitution',
  'canonical_gpu_worker_runtime_request_invalid',
)

await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort: createCanonicalGpuWorkerOperationRuntimePort({
      evidenceClass: 'controlled_source_fixture',
      supportedOperationIds: [
        'tool.sam2.segment_and_track_subject.v1',
      ],
      async execute() {
        const response = successfulWireResponse(request)
        return successfulPortResult({
          ...response,
          outputs: [{
            ...response.outputs[0],
            frameCount: 47,
          }, response.outputs[1], response.outputs[2]],
        })
      },
    }),
  }),
  'output frame-count substitution',
  'sam2_gpu_runtime_result_request_lineage_mismatch',
)

await expectRejects(
  () => routeCanonicalGpuWorkerOperation({
    request,
    runtimePort: subprocessPort,
  }),
  'uninstalled fixed subprocess',
  'canonical_gpu_worker_runtime_process_failed',
)

console.log(JSON.stringify({
  ok: true,
  operationId: receipt.operation.operationId,
  outputCount: receipt.summary.outputCount,
  runtimeContractSourceVerified:
    contract.boundaries.sourceContractVerified,
  fixedSubprocessSourceImplemented:
    contract.boundaries.runnerSourceImplemented,
  checkpointIngested: contract.boundaries.checkpointIngested,
  actualCloudRunExecutionVerified:
    receipt.boundaries.actualCloudRunExecutionVerified,
  productionAuthority: receipt.boundaries.productionAuthority,
  adversarialAssertions,
}))

function successfulWireResponse(
  value: CanonicalSam2GpuRuntimeRunnerRequest,
) {
  return {
    schemaVersion:
      'canonical-sam2-gpu-runtime-response-v1' as const,
    ok: true as const,
    status: 'controlled_sam2_gpu_inference_completed' as const,
    operationId: value.operationId,
    admissionDigestSha256: value.admissionDigestSha256,
    requestBindingSha256: value.requestBindingSha256,
    dispatchIntentId: value.dispatch.dispatchIntentId,
    runtimeIdentity: {
      sam2DistributionVersion: '1.0' as const,
      sam2SourceRevision:
        '2b90b9f5ceec907a1c18123530e92e794ad901a4' as const,
      sam2ConfigSha256:
        '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55' as const,
      torchVersion: '2.5.1+cu124' as const,
      torchvisionVersion: '0.20.1+cu124' as const,
      cudaBuild: '12.4' as const,
      cudaDeviceCount: 1 as const,
      accelerator: 'nvidia_l4' as const,
      device: 'cuda' as const,
      runtimeRegion: 'europe-west1' as const,
      checkpointLoaded: true as const,
      cpuFallbackDisabled: true as const,
    },
    outputs: [
      {
        canonicalOrder: 0 as const,
        artifactKind: 'mask_sequence' as const,
        fileName: 'mask-sequence.mkv' as const,
        contentType: 'video/x-matroska' as const,
        encodingProfile:
          'gray8_ffv1_matroska_mask_sequence_v1' as const,
        byteLength: 42_000,
        contentSha256: '6'.repeat(64),
        width: value.source.width,
        height: value.source.height,
        frameCount: value.source.frameCount,
        fpsNumerator: value.source.fpsNumerator,
        fpsDenominator: value.source.fpsDenominator,
        activeFrameCount: 48,
        minimumCoveragePpm: 100_000,
        maximumCoveragePpm: 300_000,
        meanCoveragePpm: 200_000,
        meanTemporalIouPpm: 950_000,
        centroidMotionPpm: 80_000,
      },
      {
        canonicalOrder: 1 as const,
        artifactKind: 'analysis_report' as const,
        fileName: 'tracking-analysis.json' as const,
        contentType: 'application/json' as const,
        encodingProfile:
          'sam2_tracking_analysis_report_json_v1' as const,
        byteLength: 900,
        contentSha256: '7'.repeat(64),
      },
      {
        canonicalOrder: 2 as const,
        artifactKind: 'qa_report' as const,
        fileName: 'mask-qa-measurement.json' as const,
        contentType: 'application/json' as const,
        encodingProfile:
          'sam2_mask_qa_measurement_report_json_v1' as const,
        byteLength: 1_100,
        contentSha256: '8'.repeat(64),
      },
    ] as const,
    receiptBoundaries: {
      outputBytesIncluded: false as const,
      sourceBytesIncluded: false as const,
      modelBytesIncluded: false as const,
      promptCoordinatesIncluded: false as const,
      pathsIncluded: false as const,
      urlsIncluded: false as const,
      credentialsIncluded: false as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      artifactCommitAuthority: false as const,
      qaPassAuthority: false as const,
      customerCostAuthority: false as const,
      productionReady: false as const,
    },
  }
}

function successfulPortResult(wireResponse: unknown) {
  const stdout = JSON.stringify(wireResponse)
  return {
    wireResponse,
    process: {
      exitCode: 0,
      timedOut: false,
      oomKilled: false,
      stdoutByteLength: Buffer.byteLength(stdout),
      stderrByteLength: 0,
      stderrSha256: hashCanonicalGpuWorkerStderr(''),
    },
  }
}

function routeWithFreshPort(value: unknown) {
  return routeCanonicalGpuWorkerOperation({
    request: value,
    runtimePort: createCanonicalGpuWorkerOperationRuntimePort({
      evidenceClass: 'controlled_source_fixture',
      supportedOperationIds: [
        'tool.sam2.segment_and_track_subject.v1',
      ],
      async execute() {
        return successfulPortResult(
          successfulWireResponse(request),
        )
      },
    }),
  })
}

async function expectRejects(
  action: () => Promise<unknown>,
  label: string,
  expectedCode: string,
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) => {
      const record = error as {
        code?: string
        message?: string
      }
      assert.equal(
        record.message?.includes(expectedCode)
          || record.code === expectedCode,
        true,
        `${label}: unexpected error ${record.message}`,
      )
      return true
    },
  )
  adversarialAssertions += 1
}
