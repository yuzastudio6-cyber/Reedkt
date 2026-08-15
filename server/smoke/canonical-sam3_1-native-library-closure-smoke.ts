import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const qualificationDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  'utf8',
)
const runtimeDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
  'utf8',
)
const baseIdentityDiagnostic = readFileSync(
  'docker/prod/gpu-worker/sam3_1/cloudbuild.qualification-base-identity.yaml',
  'utf8',
)
const sourceProvenance = readFileSync(
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  'utf8',
)

const torchLibraryDirectory =
  '/usr/local/lib/python3.12/dist-packages/torch/lib'
const cudaRuntimeLibraryDirectory =
  '/usr/local/lib/python3.12/dist-packages/nvidia/cuda_runtime/lib'
const cudaNvrtcLibraryDirectory =
  '/usr/local/lib/python3.12/dist-packages/nvidia/cuda_nvrtc/lib'

for (const source of [qualificationDockerfile, runtimeDockerfile] as const) {
  for (const expected of [
    `LD_LIBRARY_PATH=/opt/weeditpro/ffmpeg/lib:/opt/weeditpro/cuda-npp/lib:${torchLibraryDirectory}:${cudaRuntimeLibraryDirectory}:${cudaNvrtcLibraryDirectory}:/usr/local/cuda/lib64`,
    `test -d ${torchLibraryDirectory}`,
    `test -d ${cudaRuntimeLibraryDirectory}`,
    `test -d ${cudaNvrtcLibraryDirectory}`,
    'libtorchcodec_core8.so',
    "grep -F 'not found'",
  ] as const) assert.ok(
    source.includes(expected),
    `SAM 3.1 image lost native-library closure check: ${expected}`,
  )
  assert.doesNotMatch(source, /cpuVideoDecodeFallbackAllowed=True/u)
}

for (const expected of [
  "'torchLibraryDirectory': str(torch_lib)",
  "'torchLibraryDirectoryExists': torch_lib.is_dir()",
  'libtorch*.so',
  'libc10*.so',
  'libcudart.so.12',
  'libnvrtc.so.12',
] as const) assert.ok(
  baseIdentityDiagnostic.includes(expected),
  `pinned-base native-library diagnostic lost ${expected}`,
)

for (const expected of [
  `candidate_torch_library_directory=${torchLibraryDirectory}`,
  `candidate_cuda_runtime_library_directory=${cudaRuntimeLibraryDirectory}`,
  `candidate_cuda_nvrtc_library_directory=${cudaNvrtcLibraryDirectory}`,
  'candidate_torchcodec_native_library_closure_check=ldd_no_unresolved_dependencies',
  'candidate_torchcodec_native_library_closure_required=true',
] as const) assert.ok(
  sourceProvenance.includes(expected),
  `SAM 3.1 provenance lost ${expected}`,
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-native-library-closure',
  pinnedBaseDiagnosticBuildId: '778000fb-115a-46a7-ac6f-4d8cbaabd8fa',
  pinnedBaseDiagnosticSucceeded: true,
  torchLibraryDirectory,
  cudaRuntimeLibraryDirectory,
  cudaNvrtcLibraryDirectory,
  torchcodecNativeClosureMustResolve: true,
  cpuSubstantiveMediaOrModelFallbackAllowed: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
