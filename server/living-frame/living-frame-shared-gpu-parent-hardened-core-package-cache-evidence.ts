import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_CLASS,
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_STATUS,
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_VERSION,
  LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_OPEN_GATES,
  type LivingFrameCachedGpuPackageArtifact,
  type LivingFrameSharedGpuParentHardenedCorePackageCacheEvidence,
  type LivingFrameSharedGpuParentHardenedCorePackageCacheObservation,
} from '../../src/types/living-frame-shared-gpu-parent-hardened-core-package-cache-evidence'

const SHA256 = /^[a-f0-9]{64}$/u
const MATRIX_OBSERVATION_DIGEST_SHA256 =
  '6b244e74833fa78229e4def52954319a676bb705d66106e32f91ee5a3dd4719c'
const TOTAL_BYTE_LENGTH = 1_178_861_927

const EXPECTED_ARTIFACTS = [
  artifact(
    'torch',
    '2.6.0+cu124',
    'torch-2.6.0+cu124-cp310-cp310-linux_x86_64.whl',
    768_431_694,
    '7f2ba7f7c0459320a521696f6b5bccc187f59890b23c9dfb6c49b0b87c6bfc97',
    '76581c0d424f2d45de443327dfe1d5e115fd5e090b553deca3c3e23fc31c8da0',
    'official_pytorch_wheel_index',
    ['cp310-cp310-linux_x86_64'],
  ),
  artifact(
    'torchvision',
    '0.21.0+cu124',
    'torchvision-0.21.0+cu124-cp310-cp310-linux_x86_64.whl',
    7_282_128,
    '3d3e74018eaa7837c73e3764dad3b7792b7544401c25a42977e9744303731bd3',
    '3a57df864d3a3ff47bdfad0b8a2323d1d8215bf7676f3d693b379cd759179ce1',
    'official_pytorch_wheel_index',
    ['cp310-cp310-linux_x86_64'],
  ),
  artifact(
    'triton',
    '3.2.0',
    'triton-3.2.0-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl',
    253_090_354,
    'b3e54983cd51875855da7c68ec05c05cf8bb08df361b1d5b69e05e40b0c9bd62',
    'eb453b047fc6fa887de70a505bd868123957b58cf12c78129f0020b1046a6d58',
    'official_pytorch_wheel_index',
    [
      'cp310-cp310-manylinux_2_17_x86_64',
      'cp310-cp310-manylinux2014_x86_64',
    ],
  ),
  artifact(
    'nvidia_cusparselt',
    '0.6.2',
    'nvidia_cusparselt_cu12-0.6.2-py3-none-manylinux2014_x86_64.whl',
    150_057_751,
    'df2c24502fd76ebafe7457dbc4716b2fec071aabaed4fb7691a201cde03704d9',
    'dadf99277198dbbcf27096ce95c06892984a754098a662bb056b8fbb0532428a',
    'official_python_package_index',
    ['py3-none-manylinux2014_x86_64'],
  ),
] as const

export function compileLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence(
  observation:
    LivingFrameSharedGpuParentHardenedCorePackageCacheObservation,
): LivingFrameSharedGpuParentHardenedCorePackageCacheEvidence {
  assertObservation(observation)
  const observationDigestSha256 =
    sha256CanonicalJson(observation)
  const draft = {
    contractVersion:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_VERSION,
    evidenceClass:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_CLASS,
    status:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_STATUS,
    evidenceId:
      `lf-gpu-core-cache.${observationDigestSha256.slice(0, 40)}`,
    evidenceDigestSha256: '',
    observationDigestSha256,
    matrixObservationDigestSha256:
      observation.matrix.observationDigestSha256,
    artifactCount: observation.artifactCount,
    totalByteLength: observation.totalByteLength,
    artifactDigestsSha256:
      observation.artifacts.map((entry) => entry.sha256),
    archiveIntegrityVerified: true,
    embeddedMetadataDigestsVerified: true,
    hostFilesystemReadOnlyModeVerified: false,
    consumerMustRehashBeforeAndAfterUse: true,
    canonicalRepositoryIngested: false,
    atomicReadOnlyMountVerified: false,
    completeOfflineClosure: false,
    packageInstalled: false,
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
    openGateCodes:
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_OPEN_GATES,
  } as const

  return Object.freeze({
    ...draft,
    evidenceDigestSha256: sha256CanonicalJson({
      ...draft,
      evidenceDigestSha256: undefined,
    }),
  })
}

export function verifyLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence(
  evidence:
    LivingFrameSharedGpuParentHardenedCorePackageCacheEvidence,
  observation:
    LivingFrameSharedGpuParentHardenedCorePackageCacheObservation,
): boolean {
  try {
    assertObservation(observation)
  } catch {
    return false
  }
  const observationDigestSha256 =
    sha256CanonicalJson(observation)
  return (
    evidence.contractVersion ===
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_VERSION
    && evidence.evidenceClass ===
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_CLASS
    && evidence.status ===
      LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_STATUS
    && evidence.observationDigestSha256 ===
      observationDigestSha256
    && evidence.evidenceId ===
      `lf-gpu-core-cache.${observationDigestSha256.slice(0, 40)}`
    && evidence.matrixObservationDigestSha256 ===
      MATRIX_OBSERVATION_DIGEST_SHA256
    && evidence.artifactCount === 4
    && evidence.totalByteLength === TOTAL_BYTE_LENGTH
    && canonicalJson(evidence.artifactDigestsSha256) ===
      canonicalJson(
        EXPECTED_ARTIFACTS.map((entry) => entry.sha256),
      )
    && evidence.archiveIntegrityVerified
    && evidence.embeddedMetadataDigestsVerified
    && !evidence.hostFilesystemReadOnlyModeVerified
    && evidence.consumerMustRehashBeforeAndAfterUse
    && !evidence.canonicalRepositoryIngested
    && !evidence.atomicReadOnlyMountVerified
    && !evidence.completeOfflineClosure
    && !evidence.packageInstalled
    && !evidence.imageBuilt
    && !evidence.imageScanned
    && !evidence.gpuAttemptCreated
    && !evidence.runtimeExecuted
    && !evidence.operationRegistered
    && !evidence.dispatchGranted
    && !evidence.assetCreated
    && !evidence.actualCostReceiptCreated
    && !evidence.customerChargeCreated
    && !evidence.publicDeliveryCreated
    && !evidence.productionReady
    && canonicalJson(evidence.openGateCodes) ===
      canonicalJson(
        LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_OPEN_GATES,
      )
    && SHA256.test(evidence.evidenceDigestSha256)
    && evidence.evidenceDigestSha256 ===
      sha256CanonicalJson({
        ...evidence,
        evidenceDigestSha256: undefined,
      })
  )
}

function assertObservation(
  observation:
    LivingFrameSharedGpuParentHardenedCorePackageCacheObservation,
): void {
  const totalByteLength = observation.artifacts
    .reduce((total, entry) => total + entry.byteLength, 0)
  if (
    observation.observedAt !== '2026-07-30'
    || observation.matrix.sourceCommit !==
      'fe94fda0ddb0e50f7d28123b40bab45328174d2b'
    || observation.matrix.contractVersion !==
      'living-frame-shared-gpu-parent-hardened-package-matrix-candidate-v1'
    || observation.matrix.observationDigestSha256 !==
      MATRIX_OBSERVATION_DIGEST_SHA256
    || !observation.cache.privateLocalOnly
    || observation.cache.pathSerialized
    || observation.cache.hostFilesystemReadOnlyModeVerified
    || !observation.cache.consumerMustRehashBeforeAndAfterUse
    || observation.cache.canonicalRepositoryIngested
    || observation.cache.atomicReadOnlyMountVerified
    || observation.artifactCount !== 4
    || observation.totalByteLength !== TOTAL_BYTE_LENGTH
    || totalByteLength !== TOTAL_BYTE_LENGTH
    || canonicalJson(observation.artifacts) !==
      canonicalJson(EXPECTED_ARTIFACTS)
  ) {
    throw new Error(
      'Living Frame shared GPU core package cache observation does not match the exact private-local bytes and honest mutability boundary.',
    )
  }
}

function artifact(
  role: LivingFrameCachedGpuPackageArtifact['role'],
  version: string,
  fileName: string,
  byteLength: number,
  sha256: string,
  metadataSha256: string,
  source: LivingFrameCachedGpuPackageArtifact['source'],
  wheelTags: readonly string[],
): LivingFrameCachedGpuPackageArtifact {
  return {
    role,
    version,
    fileName,
    byteLength,
    sha256,
    metadataSha256,
    source,
    archiveIntegrityVerified: true,
    embeddedMetadataDigestVerified: true,
    wheelTags,
    hostReadOnlyModeVerified: false,
  }
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
