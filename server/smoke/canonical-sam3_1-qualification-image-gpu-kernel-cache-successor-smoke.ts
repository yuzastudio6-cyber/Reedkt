import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publicationPath =
  'server/cli/publish-canonical-sam3_1-qualification-image-build-gpu-kernel-cache-authority.ts'
const startPath =
  'server/cli/start-canonical-sam3_1-qualification-image-build-gpu-kernel-cache.ts'
const publication = readFileSync(publicationPath, 'utf8')
const start = readFileSync(startPath, 'utf8')
const qualificationDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  'utf8',
)
const productionDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
  'utf8',
)
const qualificationEntrypoint = readFileSync(
  'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
  'utf8',
)
const productionEntrypoint = readFileSync(
  'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
  'utf8',
)
const provenance = readFileSync(
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-build-gpu-kernel-cache-corrected-v1',
    'provide_ephemeral_private_nonroot_gpu_kernel_cache_paths',
    'failedAttemptAutomaticallyRetried: false',
  ] as const) assert.ok(source.includes(expected), `cache successor lost ${expected}`)
  assert.doesNotMatch(
    source,
    /failedAttemptAutomaticallyRetried: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'sam31-a100-multiplex-gpu-forwarding-corrected-20260808-v12',
  'sam31-vertex-terminal.9a6a1f19fa0533d37e2e4de9943b5fad',
  '9a6a1f19fa0533d37e2e4de9943b5fade817719529459d9f144324661233c80a',
  "gpuKernelCacheOwner: '65532:65532'",
  "gpuKernelCacheMode: '0700'",
  'gpuKernelCachePersistedBetweenJobs: false',
  'callerGpuKernelCachePathAccepted: false',
] as const) assert.ok(publication.includes(expected), `cache lineage lost ${expected}`)

for (const source of [qualificationDockerfile, productionDockerfile] as const) {
  for (const expected of [
    'io.weeditpro.runtime.gpu-kernel-cache="ephemeral-nonroot-private-v1"',
    'HOME=/var/lib/weeditpro/sam31',
    'XDG_CACHE_HOME=/var/cache/weeditpro/sam31/xdg',
    'TRITON_CACHE_DIR=/var/cache/weeditpro/sam31/triton',
    'TORCHINDUCTOR_CACHE_DIR=/var/cache/weeditpro/sam31/torchinductor',
    'CUDA_CACHE_PATH=/var/cache/weeditpro/sam31/cuda',
    '--uid 65532',
    '--gid 65532',
    '--mode=0700',
    'WORKDIR /var/lib/weeditpro/sam31',
  ] as const) assert.ok(source.includes(expected), `Dockerfile lost ${expected}`)
  assert.doesNotMatch(source, /WORKDIR \/nonexistent/u)
}

for (const source of [qualificationEntrypoint, productionEntrypoint] as const) {
  for (const expected of [
    'umask 077',
    'assert_private_runtime_directory',
    'stat -c',
    '65532:65532:700',
    'changed from its admitted path',
    'is absent or symlinked',
    'is not private-writable',
  ] as const) assert.ok(source.includes(expected), `entrypoint lost ${expected}`)
  assert.doesNotMatch(source, /chmod|chown|mkdir/u)
}

for (const expected of [
  'gpu_kernel_cache_policy=sam3_1_ephemeral_nonroot_private_gpu_kernel_cache_v1',
  'gpu_kernel_cache_owner=65532:65532',
  'gpu_kernel_cache_mode=0700',
  'gpu_kernel_cache_persisted_between_jobs=false',
  'gpu_kernel_cache_caller_path_accepted=false',
] as const) assert.ok(provenance.includes(expected), `provenance lost ${expected}`)

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-gpu-kernel-cache-authority'
  ],
  `tsx ${publicationPath}`,
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-gpu-kernel-cache-build'
  ],
  `tsx ${startPath}`,
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-image-gpu-kernel-cache-successor',
  gpuKernelCachePolicy:
    'sam3_1_ephemeral_nonroot_private_gpu_kernel_cache_v1',
  nonRootUidGid: '65532:65532',
  cacheDirectoriesPrivate: true,
  cacheDirectoriesEphemeralPerContainer: true,
  callerCachePathAccepted: false,
  cpuStateOffloadAllowed: false,
  cpuVideoDecodeFallbackAllowed: false,
  predecessorAutomaticallyRetried: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
