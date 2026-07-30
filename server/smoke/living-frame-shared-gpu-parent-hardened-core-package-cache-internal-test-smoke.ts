import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  createReadStream,
  lstatSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'

import type {
  LivingFrameCachedGpuPackageArtifact,
  LivingFrameSharedGpuParentHardenedCorePackageCacheObservation,
} from '../../src/types/living-frame-shared-gpu-parent-hardened-core-package-cache-evidence'
import {
  compileLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence,
  verifyLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence,
} from '../living-frame/living-frame-shared-gpu-parent-hardened-core-package-cache-evidence'

const configuredRoot =
  process.env
    .REEDITPRO_LIVING_FRAME_GPU_HARDENING_CORE_CACHE_ROOT
    ?.trim()

if (!configuredRoot) {
  process.stdout.write(`${JSON.stringify({
    suite:
      'living-frame-shared-gpu-parent-hardened-core-package-cache-internal-test',
    status: 'skipped_private_core_package_cache_unconfigured',
    privateInternalOnly: true,
    productionReady: false,
  })}\n`)
  process.exit(0)
}

const root = resolve(configuredRoot)
assert.match(
  basename(root),
  /^reeditpro-lf-gpu-hardening-core-v1\.[A-Za-z0-9]+$/u,
)
assert.equal(lstatSync(root).isDirectory(), true)

const expected = expectedArtifacts()
const visibleFiles = readdirSync(root)
  .filter((entry) => !entry.startsWith('._'))
  .sort()
assert.deepEqual(
  visibleFiles,
  expected.map((entry) => entry.fileName).sort(),
)

const artifacts:
  LivingFrameCachedGpuPackageArtifact[] = []
for (const artifact of expected) {
  const source = join(root, artifact.fileName)
  const fileStat = lstatSync(source)
  assert.equal(fileStat.isFile(), true)
  assert.equal(fileStat.isSymbolicLink(), false)
  assert.equal(fileStat.size, artifact.byteLength)
  assert.equal(await sha256File(source), artifact.sha256)
  execFileSync('/usr/bin/unzip', ['-t', source], {
    stdio: 'ignore',
  })
  const metadata = execFileSync(
    '/usr/bin/unzip',
    ['-p', source, '*/METADATA'],
  )
  assert.equal(sha256(metadata), artifact.metadataSha256)
  const wheel = execFileSync(
    '/usr/bin/unzip',
    ['-p', source, '*/WHEEL'],
    { encoding: 'utf8' },
  )
  const wheelTags = wheel.split(/\r?\n/u)
    .filter((line) => line.startsWith('Tag: '))
    .map((line) => line.slice('Tag: '.length))
  assert.deepEqual(wheelTags, artifact.wheelTags)
  assert.equal((statSync(source).mode & 0o200) !== 0, true)
  artifacts.push({
    ...artifact,
    archiveIntegrityVerified: true,
    embeddedMetadataDigestVerified: true,
    hostReadOnlyModeVerified: false,
  })
}

const observation:
  LivingFrameSharedGpuParentHardenedCorePackageCacheObservation = {
    observedAt: '2026-07-30',
    matrix: {
      sourceCommit:
        'fe94fda0ddb0e50f7d28123b40bab45328174d2b',
      contractVersion:
        'living-frame-shared-gpu-parent-hardened-package-matrix-candidate-v1',
      observationDigestSha256:
        '6b244e74833fa78229e4def52954319a676bb705d66106e32f91ee5a3dd4719c',
    },
    cache: {
      privateLocalOnly: true,
      pathSerialized: false,
      hostFilesystemReadOnlyModeVerified: false,
      consumerMustRehashBeforeAndAfterUse: true,
      canonicalRepositoryIngested: false,
      atomicReadOnlyMountVerified: false,
    },
    artifacts,
    artifactCount: 4,
    totalByteLength: 1_178_861_927,
  }

const evidence =
  compileLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence(
    observation,
  )
assert.equal(
  verifyLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence(
    evidence,
    observation,
  ),
  true,
)

let adversarialAssertions = 0
for (const forged of [
  {
    ...observation,
    cache: {
      ...observation.cache,
      hostFilesystemReadOnlyModeVerified: true,
    },
  },
  {
    ...observation,
    cache: {
      ...observation.cache,
      canonicalRepositoryIngested: true,
    },
  },
  {
    ...observation,
    artifacts: observation.artifacts.slice(1),
  },
  {
    ...observation,
    artifacts: observation.artifacts.map((artifact, index) =>
      index === 0
        ? { ...artifact, sha256: 'f'.repeat(64) }
        : artifact),
  },
] as unknown as readonly LivingFrameSharedGpuParentHardenedCorePackageCacheObservation[]) {
  assert.throws(() => {
    compileLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence(
      forged,
    )
  })
  adversarialAssertions += 1
}

assert.equal(
  verifyLivingFrameSharedGpuParentHardenedCorePackageCacheEvidence(
    {
      ...evidence,
      imageBuilt: true,
    } as never,
    observation,
  ),
  false,
)
adversarialAssertions += 1

process.stdout.write(`${JSON.stringify({
  suite:
    'living-frame-shared-gpu-parent-hardened-core-package-cache-internal-test',
  status: 'passed',
  evidenceDigestSha256:
    evidence.evidenceDigestSha256,
  observationDigestSha256:
    evidence.observationDigestSha256,
  artifactCount: evidence.artifactCount,
  totalByteLength: evidence.totalByteLength,
  archiveIntegrityVerified:
    evidence.archiveIntegrityVerified,
  embeddedMetadataDigestsVerified:
    evidence.embeddedMetadataDigestsVerified,
  hostFilesystemReadOnlyModeVerified:
    evidence.hostFilesystemReadOnlyModeVerified,
  consumerMustRehashBeforeAndAfterUse:
    evidence.consumerMustRehashBeforeAndAfterUse,
  canonicalRepositoryIngested:
    evidence.canonicalRepositoryIngested,
  atomicReadOnlyMountVerified:
    evidence.atomicReadOnlyMountVerified,
  completeOfflineClosure:
    evidence.completeOfflineClosure,
  imageBuilt: evidence.imageBuilt,
  runtimeExecuted: evidence.runtimeExecuted,
  adversarialAssertions,
  pathSerialized: false,
  productionReady: evidence.productionReady,
})}\n`)

function expectedArtifacts(): readonly Omit<
  LivingFrameCachedGpuPackageArtifact,
  | 'archiveIntegrityVerified'
  | 'embeddedMetadataDigestVerified'
  | 'hostReadOnlyModeVerified'
>[] {
  return [
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
  ]
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
): Omit<
  LivingFrameCachedGpuPackageArtifact,
  | 'archiveIntegrityVerified'
  | 'embeddedMetadataDigestVerified'
  | 'hostReadOnlyModeVerified'
> {
  return {
    role,
    version,
    fileName,
    byteLength,
    sha256,
    metadataSha256,
    source,
    wheelTags,
  }
}

async function sha256File(path: string): Promise<string> {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(path)) {
    digest.update(chunk as Buffer)
  }
  return digest.digest('hex')
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
