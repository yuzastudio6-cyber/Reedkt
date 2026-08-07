import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-native-library-closure-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-native-library-closure-successor.ts',
  'utf8',
)
const capsulePublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
  'utf8',
)
const qualificationDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  'utf8',
)
const runtimeDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-4c3f5434cf4c561336ac',
    'sha256:4c3f5434cf4c561336ac63b36c4e29a8ce7205e82b52dc8743dbdfee9db5a6f7',
    'f2bc80c5-ee55-4194-8fff-e4d03b79c691',
    'sam31-qualification-image-build-cuda-torchvision-identity-successor-11',
    '3c1a24bd271ea4b13be669815ec8ee8d84961cd97161da3959130f5646e2c55d',
    'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1',
    'c26c5a090028c6fd0603b8f280cd119048bfc799552c1979659525bcc6308747',
    '4c03cd9708e59b6f384824ed12116e0c9ef97f05c4b60374c75abbbfed8c8408',
    'sam31-qualification-image-build-native-library-closure-successor-12',
    'torchcodec_native_dependency_closure_loader_path_unbound',
    'pinned_torch_cuda_runtime_and_nvrtc_library_paths_bound_and_ldd_verified',
    'automaticRetryOfPredecessor: false',
    "cloudBuildPolicy.machineType !== 'E2_STANDARD_2'",
  ] as const) assert.ok(
    source.includes(expected),
    `native-library closure successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'native_library_closure_corrected',
  'sam31-qualification-capsule-reproducibility-native-library-closure-corrected-20260807',
  '313c8b75-4aae-4a31-a0ed-df1807013295',
  '18ae1a26-172b-481f-8c73-a15dbb82aab8',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `native-library reproducibility publisher lost ${expected}`,
)

for (const source of [qualificationDockerfile, runtimeDockerfile] as const) {
  for (const expected of [
    '/usr/local/lib/python3.12/dist-packages/torch/lib',
    '/usr/local/lib/python3.12/dist-packages/nvidia/cuda_runtime/lib',
    '/usr/local/lib/python3.12/dist-packages/nvidia/cuda_nvrtc/lib',
    'libtorchcodec_core8.so',
    "grep -F 'not found'",
  ] as const) assert.ok(source.includes(expected))
}

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-native-library-closure-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-native-library-closure-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-native-library-closure-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-native-library-closure-successor.ts',
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-native-library-closure-successor',
  predecessorTerminalRereadRequired: true,
  distinctCorrectedSuccessorAuthorityRequired: true,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  exactNativeLibraryClosureRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
