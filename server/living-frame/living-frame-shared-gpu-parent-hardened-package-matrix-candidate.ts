import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_CLASS,
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_STATUS,
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_VERSION,
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_OPEN_GATES,
  type LivingFrameSharedGpuParentHardenedPackageMatrixCandidate,
  type LivingFrameSharedGpuParentHardenedPackageMatrixObservation,
} from '../../src/types/living-frame-shared-gpu-parent-hardened-package-matrix-candidate'

const SHA256 = /^[a-f0-9]{64}$/u
const CURRENT_PARENT_DIGEST_SHA256 =
  '8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4'
const PUBLISHED_ARTIFACT_BYTE_LENGTH = 1_178_861_927

const EXPECTED_PUBLISHED_ARTIFACTS = [
  {
    role: 'torch',
    version: '2.6.0+cu124',
    fileName:
      'torch-2.6.0+cu124-cp310-cp310-linux_x86_64.whl',
    byteLength: 768_431_694,
    sha256:
      '7f2ba7f7c0459320a521696f6b5bccc187f59890b23c9dfb6c49b0b87c6bfc97',
    metadataSha256:
      '76581c0d424f2d45de443327dfe1d5e115fd5e090b553deca3c3e23fc31c8da0',
    source: 'official_pytorch_wheel_index',
  },
  {
    role: 'torchvision',
    version: '0.21.0+cu124',
    fileName:
      'torchvision-0.21.0+cu124-cp310-cp310-linux_x86_64.whl',
    byteLength: 7_282_128,
    sha256:
      '3d3e74018eaa7837c73e3764dad3b7792b7544401c25a42977e9744303731bd3',
    metadataSha256:
      '3a57df864d3a3ff47bdfad0b8a2323d1d8215bf7676f3d693b379cd759179ce1',
    source: 'official_pytorch_wheel_index',
  },
  {
    role: 'triton',
    version: '3.2.0',
    fileName:
      'triton-3.2.0-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl',
    byteLength: 253_090_354,
    sha256:
      'b3e54983cd51875855da7c68ec05c05cf8bb08df361b1d5b69e05e40b0c9bd62',
    metadataSha256:
      'eb453b047fc6fa887de70a505bd868123957b58cf12c78129f0020b1046a6d58',
    source: 'official_pytorch_wheel_index',
  },
  {
    role: 'nvidia_cusparselt',
    version: '0.6.2',
    fileName:
      'nvidia_cusparselt_cu12-0.6.2-py3-none-manylinux2014_x86_64.whl',
    byteLength: 150_057_751,
    sha256:
      'df2c24502fd76ebafe7457dbc4716b2fec071aabaed4fb7691a201cde03704d9',
    metadataSha256:
      'dadf99277198dbbcf27096ce95c06892984a754098a662bb056b8fbb0532428a',
    source: 'official_python_package_index',
  },
] as const

const EXPECTED_RETAINED_CUDA_VERSIONS = {
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
} as const

const EXPECTED_UNRESOLVED_SECURITY_PACKAGES = [
  'pillow',
  'transformers',
  'setuptools_system_metadata',
  'wheel_system_metadata',
] as const

export function compileLivingFrameSharedGpuParentHardenedPackageMatrixCandidate(
  observation:
    LivingFrameSharedGpuParentHardenedPackageMatrixObservation,
): LivingFrameSharedGpuParentHardenedPackageMatrixCandidate {
  assertObservation(observation)
  const observationDigestSha256 =
    sha256CanonicalJson(observation)
  const draft = {
    contractVersion:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_VERSION,
    candidateClass:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_CLASS,
    status:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_STATUS,
    candidateId:
      `lf-shared-gpu-hardening.${observationDigestSha256.slice(0, 40)}`,
    candidateDigestSha256: '',
    observationDigestSha256,
    currentParentDigestSha256:
      observation.currentParent.digestSha256,
    targetPlatform: observation.target.platform,
    targetPythonTag: observation.target.pythonTag,
    targetCudaBuild: observation.target.cudaBuild,
    candidateTorchVersion: '2.6.0+cu124',
    candidateTorchVisionVersion: '0.21.0+cu124',
    candidateTritonVersion: '3.2.0',
    requiredCusparseLtVersion: '0.6.2',
    publishedArtifactCount: 4,
    publishedArtifactByteLength:
      PUBLISHED_ARTIFACT_BYTE_LENGTH,
    publishedArtifacts: observation.publishedArtifacts,
    completeOfflineClosure: false,
    currentParentHardened: false,
    sam2CompatibilityProven: false,
    comfyUiCompatibilityProven: false,
    openGateCodes:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_OPEN_GATES,
    packageDownloaded: false,
    imageBuilt: false,
    imageScanned: false,
    gpuAttemptCreated: false,
    runtimeExecuted: false,
    operationRegistered: false,
    dispatchGranted: false,
    assetCreated: false,
    actualCostReceiptCreated: false,
    customerChargeCreated: false,
    publicDeliveryCreated: false,
    productionReady: false,
  } as const

  return Object.freeze({
    ...draft,
    candidateDigestSha256: sha256CanonicalJson({
      ...draft,
      candidateDigestSha256: undefined,
    }),
  })
}

export function verifyLivingFrameSharedGpuParentHardenedPackageMatrixCandidate(
  candidate:
    LivingFrameSharedGpuParentHardenedPackageMatrixCandidate,
): boolean {
  const expectedObservationDigest =
    expectedObservationDigestSha256()
  return (
    candidate.contractVersion ===
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_VERSION
    && candidate.candidateClass ===
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_CLASS
    && candidate.status ===
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_STATUS
    && candidate.observationDigestSha256 ===
      expectedObservationDigest
    && candidate.candidateId ===
      `lf-shared-gpu-hardening.${expectedObservationDigest.slice(0, 40)}`
    && candidate.currentParentDigestSha256 ===
      CURRENT_PARENT_DIGEST_SHA256
    && candidate.targetPlatform === 'linux/amd64'
    && candidate.targetPythonTag === 'cp310-cp310'
    && candidate.targetCudaBuild === '12.4'
    && candidate.candidateTorchVersion === '2.6.0+cu124'
    && candidate.candidateTorchVisionVersion ===
      '0.21.0+cu124'
    && candidate.candidateTritonVersion === '3.2.0'
    && candidate.requiredCusparseLtVersion === '0.6.2'
    && candidate.publishedArtifactCount === 4
    && candidate.publishedArtifactByteLength ===
      PUBLISHED_ARTIFACT_BYTE_LENGTH
    && canonicalJson(candidate.publishedArtifacts) ===
      canonicalJson(EXPECTED_PUBLISHED_ARTIFACTS)
    && canonicalJson(candidate.openGateCodes) ===
      canonicalJson(
        LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_OPEN_GATES,
      )
    && SHA256.test(candidate.candidateDigestSha256)
    && candidate.candidateDigestSha256 ===
      sha256CanonicalJson({
        ...candidate,
        candidateDigestSha256: undefined,
      })
    && !candidate.completeOfflineClosure
    && !candidate.currentParentHardened
    && !candidate.sam2CompatibilityProven
    && !candidate.comfyUiCompatibilityProven
    && !candidate.packageDownloaded
    && !candidate.imageBuilt
    && !candidate.imageScanned
    && !candidate.gpuAttemptCreated
    && !candidate.runtimeExecuted
    && !candidate.operationRegistered
    && !candidate.dispatchGranted
    && !candidate.assetCreated
    && !candidate.actualCostReceiptCreated
    && !candidate.customerChargeCreated
    && !candidate.publicDeliveryCreated
    && !candidate.productionReady
  )
}

function assertObservation(
  observation:
    LivingFrameSharedGpuParentHardenedPackageMatrixObservation,
): void {
  const artifactBytes = observation.publishedArtifacts
    .reduce((total, artifact) => total + artifact.byteLength, 0)
  if (
    observation.observedAt !== '2026-07-30'
    || observation.target.platform !== 'linux/amd64'
    || observation.target.pythonVersion !== '3.10'
    || observation.target.pythonTag !== 'cp310-cp310'
    || observation.target.cudaBuild !== '12.4'
    || observation.currentParent.digestSha256 !==
      CURRENT_PARENT_DIGEST_SHA256
    || observation.currentParent.torchVersion !==
      '2.5.1+cu124'
    || observation.currentParent.torchvisionVersion !==
      '0.20.1+cu124'
    || observation.currentParent.tritonVersion !== '3.1.0'
    || observation.currentParent.cusparseLtMetadataPresent
    || canonicalJson(observation.publishedArtifacts) !==
      canonicalJson(EXPECTED_PUBLISHED_ARTIFACTS)
    || artifactBytes !== PUBLISHED_ARTIFACT_BYTE_LENGTH
    || observation.publishedArtifacts.some((artifact) =>
      !SHA256.test(artifact.sha256)
      || !SHA256.test(artifact.metadataSha256)
      || artifact.byteLength <= 0
    )
    || canonicalJson(observation.retainedCudaVersions) !==
      canonicalJson(EXPECTED_RETAINED_CUDA_VERSIONS)
    || !observation.compatibilityChanges
      .torchLoadWeightsOnlyDefaultChanged
    || !observation.compatibilityChanges
      .sam2CheckpointRegressionRequired
    || !observation.compatibilityChanges
      .comfyUiCheckpointRegressionRequired
    || !observation.compatibilityChanges
      .comfyUiCustomNodeRegressionRequired
    || canonicalJson(
      observation.unresolvedSecurityPackages,
    ) !== canonicalJson(
      EXPECTED_UNRESOLVED_SECURITY_PACKAGES,
    )
  ) {
    throw new Error(
      'Living Frame shared GPU parent hardening observation does not match the frozen official package matrix and current-parent delta.',
    )
  }
}

function expectedObservationDigestSha256(): string {
  return sha256CanonicalJson({
    observedAt: '2026-07-30',
    target: {
      platform: 'linux/amd64',
      pythonVersion: '3.10',
      pythonTag: 'cp310-cp310',
      cudaBuild: '12.4',
    },
    currentParent: {
      digestSha256: CURRENT_PARENT_DIGEST_SHA256,
      torchVersion: '2.5.1+cu124',
      torchvisionVersion: '0.20.1+cu124',
      tritonVersion: '3.1.0',
      cusparseLtMetadataPresent: false,
    },
    publishedArtifacts: EXPECTED_PUBLISHED_ARTIFACTS,
    retainedCudaVersions: EXPECTED_RETAINED_CUDA_VERSIONS,
    compatibilityChanges: {
      torchLoadWeightsOnlyDefaultChanged: true,
      sam2CheckpointRegressionRequired: true,
      comfyUiCheckpointRegressionRequired: true,
      comfyUiCustomNodeRegressionRequired: true,
    },
    unresolvedSecurityPackages:
      EXPECTED_UNRESOLVED_SECURITY_PACKAGES,
  })
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sha256CanonicalJson(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value))
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
