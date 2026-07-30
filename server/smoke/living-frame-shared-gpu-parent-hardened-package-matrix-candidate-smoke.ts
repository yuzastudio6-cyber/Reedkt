import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameSharedGpuParentHardenedPackageMatrixObservation,
} from '../../src/types/living-frame-shared-gpu-parent-hardened-package-matrix-candidate'
import {
  compileLivingFrameSharedGpuParentHardenedPackageMatrixCandidate,
  verifyLivingFrameSharedGpuParentHardenedPackageMatrixCandidate,
} from '../living-frame/living-frame-shared-gpu-parent-hardened-package-matrix-candidate'

const observation = buildObservation()
const candidate =
  compileLivingFrameSharedGpuParentHardenedPackageMatrixCandidate(
    observation,
  )

assert.equal(
  verifyLivingFrameSharedGpuParentHardenedPackageMatrixCandidate(
    candidate,
  ),
  true,
)
assert.equal(candidate.candidateTorchVersion, '2.6.0+cu124')
assert.equal(
  candidate.candidateTorchVisionVersion,
  '0.21.0+cu124',
)
assert.equal(candidate.candidateTritonVersion, '3.2.0')
assert.equal(candidate.requiredCusparseLtVersion, '0.6.2')
assert.equal(candidate.publishedArtifactCount, 4)
assert.equal(
  candidate.publishedArtifactByteLength,
  1_178_861_927,
)
assert.equal(candidate.completeOfflineClosure, false)
assert.equal(candidate.imageBuilt, false)
assert.equal(candidate.runtimeExecuted, false)
assert.equal(candidate.productionReady, false)

let adversarialAssertions = 0
for (const forged of [
  {
    ...observation,
    currentParent: {
      ...observation.currentParent,
      digestSha256: 'f'.repeat(64),
    },
  },
  {
    ...observation,
    target: {
      ...observation.target,
      cudaBuild: '12.6',
    },
  },
  {
    ...observation,
    publishedArtifacts:
      observation.publishedArtifacts.slice(1),
  },
  {
    ...observation,
    publishedArtifacts:
      observation.publishedArtifacts.map((artifact, index) =>
        index === 0
          ? { ...artifact, sha256: 'f'.repeat(64) }
          : artifact),
  },
  {
    ...observation,
    currentParent: {
      ...observation.currentParent,
      cusparseLtMetadataPresent: true,
    },
  },
  {
    ...observation,
    compatibilityChanges: {
      ...observation.compatibilityChanges,
      sam2CheckpointRegressionRequired: false,
    },
  },
] as unknown as readonly LivingFrameSharedGpuParentHardenedPackageMatrixObservation[]) {
  assert.throws(() => {
    compileLivingFrameSharedGpuParentHardenedPackageMatrixCandidate(
      forged,
    )
  })
  adversarialAssertions += 1
}

for (const forgedCandidate of [
  {
    ...candidate,
    observationDigestSha256: 'f'.repeat(64),
  },
  {
    ...candidate,
    publishedArtifacts:
      candidate.publishedArtifacts.slice(1),
  },
  {
    ...candidate,
    imageBuilt: true,
  },
  {
    ...candidate,
    openGateCodes:
      candidate.openGateCodes.slice(0, -1),
  },
]) {
  const unsigned = {
    ...forgedCandidate,
    candidateDigestSha256: undefined,
  }
  assert.equal(
    verifyLivingFrameSharedGpuParentHardenedPackageMatrixCandidate({
      ...forgedCandidate,
      candidateDigestSha256:
        sha256CanonicalJson(unsigned),
    } as never),
    false,
  )
  adversarialAssertions += 1
}

process.stdout.write(`${JSON.stringify({
  suite:
    'living-frame-shared-gpu-parent-hardened-package-matrix-candidate',
  status: 'passed',
  observationDigestSha256:
    candidate.observationDigestSha256,
  currentParentDigestSha256:
    candidate.currentParentDigestSha256,
  candidateTorchVersion:
    candidate.candidateTorchVersion,
  candidateTorchVisionVersion:
    candidate.candidateTorchVisionVersion,
  candidateTritonVersion:
    candidate.candidateTritonVersion,
  requiredCusparseLtVersion:
    candidate.requiredCusparseLtVersion,
  publishedArtifactCount:
    candidate.publishedArtifactCount,
  publishedArtifactByteLength:
    candidate.publishedArtifactByteLength,
  completeOfflineClosure:
    candidate.completeOfflineClosure,
  imageBuilt: candidate.imageBuilt,
  runtimeExecuted: candidate.runtimeExecuted,
  adversarialAssertions,
  productionReady: candidate.productionReady,
})}\n`)

function buildObservation():
  LivingFrameSharedGpuParentHardenedPackageMatrixObservation {
  return {
    observedAt: '2026-07-30',
    target: {
      platform: 'linux/amd64',
      pythonVersion: '3.10',
      pythonTag: 'cp310-cp310',
      cudaBuild: '12.4',
    },
    currentParent: {
      digestSha256:
        '8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4',
      torchVersion: '2.5.1+cu124',
      torchvisionVersion: '0.20.1+cu124',
      tritonVersion: '3.1.0',
      cusparseLtMetadataPresent: false,
    },
    publishedArtifacts: [
      artifact(
        'torch',
        '2.6.0+cu124',
        'torch-2.6.0+cu124-cp310-cp310-linux_x86_64.whl',
        768_431_694,
        '7f2ba7f7c0459320a521696f6b5bccc187f59890b23c9dfb6c49b0b87c6bfc97',
        '76581c0d424f2d45de443327dfe1d5e115fd5e090b553deca3c3e23fc31c8da0',
        'official_pytorch_wheel_index',
      ),
      artifact(
        'torchvision',
        '0.21.0+cu124',
        'torchvision-0.21.0+cu124-cp310-cp310-linux_x86_64.whl',
        7_282_128,
        '3d3e74018eaa7837c73e3764dad3b7792b7544401c25a42977e9744303731bd3',
        '3a57df864d3a3ff47bdfad0b8a2323d1d8215bf7676f3d693b379cd759179ce1',
        'official_pytorch_wheel_index',
      ),
      artifact(
        'triton',
        '3.2.0',
        'triton-3.2.0-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl',
        253_090_354,
        'b3e54983cd51875855da7c68ec05c05cf8bb08df361b1d5b69e05e40b0c9bd62',
        'eb453b047fc6fa887de70a505bd868123957b58cf12c78129f0020b1046a6d58',
        'official_pytorch_wheel_index',
      ),
      artifact(
        'nvidia_cusparselt',
        '0.6.2',
        'nvidia_cusparselt_cu12-0.6.2-py3-none-manylinux2014_x86_64.whl',
        150_057_751,
        'df2c24502fd76ebafe7457dbc4716b2fec071aabaed4fb7691a201cde03704d9',
        'dadf99277198dbbcf27096ce95c06892984a754098a662bb056b8fbb0532428a',
        'official_python_package_index',
      ),
    ],
    retainedCudaVersions: {
      cudaNvrtc: '12.4.127',
      cudaRuntime: '12.4.127',
      cudaCupti: '12.4.127',
      cudnn: '9.1.0.70',
      cublas: '12.4.5.8',
      cufft: '11.2.1.3',
      curand: '10.3.5.147',
      cusolver: '11.6.1.9',
      cusparse: '12.3.1.170',
      nccl: '2.21.5',
      nvtx: '12.4.127',
      nvjitlink: '12.4.127',
      sympy: '1.13.1',
    },
    compatibilityChanges: {
      torchLoadWeightsOnlyDefaultChanged: true,
      sam2CheckpointRegressionRequired: true,
      comfyUiCheckpointRegressionRequired: true,
      comfyUiCustomNodeRegressionRequired: true,
    },
    unresolvedSecurityPackages: [
      'pillow',
      'transformers',
      'setuptools_system_metadata',
      'wheel_system_metadata',
    ],
  }
}

function artifact(
  role:
    LivingFrameSharedGpuParentHardenedPackageMatrixObservation[
      'publishedArtifacts'
    ][number]['role'],
  version: string,
  fileName: string,
  byteLength: number,
  sha256: string,
  metadataSha256: string,
  source:
    LivingFrameSharedGpuParentHardenedPackageMatrixObservation[
      'publishedArtifacts'
    ][number]['source'],
): LivingFrameSharedGpuParentHardenedPackageMatrixObservation[
  'publishedArtifacts'
][number] {
  return {
    role,
    version,
    fileName,
    byteLength,
    sha256,
    metadataSha256,
    source,
  }
}

function sha256CanonicalJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortValue(value)))
    .digest('hex')
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)]),
    )
  }
  return value
}
