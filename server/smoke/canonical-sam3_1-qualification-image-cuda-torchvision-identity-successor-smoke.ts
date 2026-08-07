import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-cuda-torchvision-identity-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-cuda-torchvision-identity-successor.ts',
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
const baseIdentityBuild = readFileSync(
  'docker/prod/gpu-worker/sam3_1/cloudbuild.qualification-base-identity.yaml',
  'utf8',
)
const capsuleBuilder = readFileSync(
  'docker/prod/gpu-worker/sam3_1/build-qualification-capsule.sh',
  'utf8',
)
const sourceProvenance = readFileSync(
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  'utf8',
)
const qualificationRunner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  'utf8',
)
const runtimeRunner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/runner.py',
  'utf8',
)
const runtimeRelease = readFileSync(
  'server/workers/masks/canonical-sam3_1-gpu-runtime-release.ts',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-9d7ac7aec46776f3bc96',
    'sha256:9d7ac7aec46776f3bc9640512a6b56284ad7c48c55d0705c5dd3c8e8e629c695',
    '2ab7085c-99f6-4bba-9679-113469339b1c',
    'sam31-qualification-image-build-pycocotools-offline-successor-10',
    '431975dfe7527fa3951162d2055abcc1d354843a70519c1e29edee41eea68181',
    'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1',
    'c26c5a090028c6fd0603b8f280cd119048bfc799552c1979659525bcc6308747',
    'c5548051769395807d1dd3baea15d425e8231900593c66c0231ef3599c980fe9',
    'sam31-qualification-image-build-cuda-torchvision-identity-successor-11',
    'pinned_base_torchvision_cuda_local_version_identity_mismatch',
    'exact_pinned_torchvision_0_25_0_cu128_identity_bound_across_build_runtime_and_release_contract',
    'automaticRetryOfPredecessor: false',
    "cloudBuildPolicy.machineType !== 'E2_STANDARD_2'",
  ] as const) assert.ok(
    source.includes(expected),
    `CUDA TorchVision identity successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'cuda_torchvision_identity_corrected',
  'sam31-qualification-capsule-reproducibility-cuda-torchvision-identity-corrected-20260807',
  'c0be5124-c29d-483b-9d8e-c2f0847f38cc',
  '5ae87019-d6d1-4f26-b9a5-d027374b97cf',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `CUDA TorchVision reproducibility publisher lost ${expected}`,
)

for (const source of [
  qualificationDockerfile,
  runtimeDockerfile,
  capsuleBuilder,
  sourceProvenance,
  qualificationRunner,
  runtimeRunner,
  runtimeRelease,
] as const) assert.ok(
  source.includes('0.25.0+cu128'),
  'SAM 3.1 closure lost the exact CUDA-qualified TorchVision identity',
)

for (const expected of [
  'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
  "'torchVersion': torch.__version__",
  "'torchvisionVersion': torchvision.__version__",
  "'torchCudaVersion': torch.version.cuda",
] as const) assert.ok(
  baseIdentityBuild.includes(expected),
  `pinned base identity diagnostic lost ${expected}`,
)

for (const source of [qualificationDockerfile, runtimeDockerfile] as const) {
  assert.ok(source.includes("print(json.dumps(observed, sort_keys=True))"))
  assert.ok(
    source.includes("torchvision.__version__ == '0.25.0+cu128'"),
  )
  assert.doesNotMatch(
    source,
    /torchvision\.__version__ == '0\.25\.0'/u,
  )
}

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-cuda-torchvision-identity-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-cuda-torchvision-identity-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-cuda-torchvision-identity-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-cuda-torchvision-identity-successor.ts',
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-cuda-torchvision-identity-successor',
  predecessorTerminalRereadRequired: true,
  distinctCorrectedSuccessorAuthorityRequired: true,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  pinnedBaseIdentityDiagnosticCloudBuildRequired: true,
  exactCudaTorchVisionLocalVersionRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
