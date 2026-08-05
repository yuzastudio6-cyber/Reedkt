import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const dockerfile = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.private-capsule-builder',
  'utf8',
)
const builder = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/build-private-capsule.sh',
  'utf8',
)
const cloudBuild = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/cloudbuild.private-capsule.yaml',
  'utf8',
)
const candidate = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
  'utf8',
)
const verifier = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/verify-private-build-input.py',
  'utf8',
)
const runner = readFileSync(
  'docker/prod/gpu-worker/track-all-task-qa/runner.py',
  'utf8',
)
const iam = readFileSync('scripts/gcp/prod/06-configure-iam.sh', 'utf8')
const foundation = readFileSync(
  'scripts/gcp/prod/17-provision-visual-intelligence-sam31-foundation.sh',
  'utf8',
)
const operator = readFileSync(
  'scripts/gcp/prod/18-build-track-all-l4-task-qa-private-capsule.sh',
  'utf8',
)

for (const expected of [
  'pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081',
  'Dockerfile.candidate',
  'runner.py',
  'entrypoint.sh',
  'verify-private-build-input.py',
  'source-provenance.lock',
  'build-private-capsule.sh',
] as const) assert.ok(dockerfile.includes(expected), `builder Dockerfile lost ${expected}`)

for (const expected of [
  '49486f61fb25722cbcf586b7f4320921d46fb38e',
  '8f00b42869ab2836be36090f6631ae4c38ba59171e22a69a8e0f92f8ef1771d4',
  '0b15f5d359aeafd7ff54ea631ed1943a3eb295c4a6dae3f745ddeada25e33289',
  '396f84661fcf260885c3f9db717caf6904eafd44857dca17be09a835bd7da8d9',
  'fd83c01228a688733f1ded5201c678f0c53ecc1006ffbc404db9f7a899ac6249',
  'd7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c',
  'bef9768cab184e7ae6e559c032e95ba8d07b3023c289f79a2bd36e8bf85605a5',
  'f13c72698edef492f985cc225f14faafe68ae065a2e407f45bdf6f4b9b43fde8',
  'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
  '-DBUILD_LIST=core,imgproc,cudaarithm,python3',
  '-DCUDA_ARCH_BIN=8.9',
  '-DCUDA_FAST_MATH=OFF',
  '-DENABLE_FAST_MATH=OFF',
  '-DOPENCV_ENABLE_NONFREE=OFF',
  '-DOPENCV_SKIP_PYTHON_LOADER=ON',
  'sourceReleaseTagSignatureVerified',
  'runtimeNetworkDownloadsAllowed',
  'weeditpro-track-all-sam3_1-l4-task-qa-private-build-capsule-v1',
  '--format=ustar',
  "--mtime='@0'",
  'gzip --no-name --best',
] as const) assert.ok(builder.includes(expected), `capsule builder lost ${expected}`)

assert.equal((builder.match(/download_exact \\\n/gu) ?? []).length, 8)
assert.doesNotMatch(builder, /apt-get|conda install|pip install [^\n]*https?:/u)
assert.doesNotMatch(builder, /sam(?:2|3)[._-]?(?:checkpoint|weights)|huggingface|customer[_ -]media/iu)

for (const expected of [
  'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
  'gs://reeditpro-production-reeditpro-image-build-inputs/private/image-build-inputs/track-all-l4-task-qa/',
  'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
  'E2_HIGHCPU_8',
  'CLOUD_LOGGING_ONLY',
  'requestedVerifyOption: VERIFIED',
] as const) assert.ok(cloudBuild.includes(expected), `Cloud Build lost ${expected}`)
assert.doesNotMatch(cloudBuild, /secretEnv|availableSecrets|gpu|nvidia-l4|a100/iu)

for (const expected of [
  'PIP_NO_INDEX=1',
  'PYTHONPATH=/opt/weeditpro/opencv-cuda/python',
  '--no-index',
  '--no-deps',
  '--ignore-installed',
  'opencv-build-information.txt',
  "assert PIL.__version__ == '12.1.0'",
] as const) assert.ok(candidate.includes(expected), `runtime candidate lost ${expected}`)

for (const expected of [
  'opencv_cuda_python_module',
  'opencv_cuda_shared_library',
  'opencv_source_license',
  'OpenCV CUDA runtime artifact set changed',
  'capsule requirements lock changed',
] as const) assert.ok(verifier.includes(expected), `capsule verifier lost ${expected}`)

assert.match(runner, /from PIL import Image, ImageFile/u)
assert.match(runner, /decoded\.format != "PNG"/u)
assert.match(runner, /decoded\.mode != "L"/u)
assert.doesNotMatch(runner, /cv2\.imdecode/u)

for (const source of [iam, foundation]) {
  assert.match(
    source,
    /IMAGE_BUILDER(?:_SERVICE_ACCOUNT|_SA)[^\n]*"? roles\/storage\.objectCreator/u,
  )
}
assert.doesNotMatch(`${dockerfile}\n${candidate}`, /COPY .*checkpoint|ADD https?:/iu)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly REGION='us-central1'",
  "readonly CONFIRMATION='start-weeditpro-track-all-l4-task-qa-private-capsule-build-v1'",
  "readonly CONTEXT='docker/prod/gpu-worker/track-all-task-qa'",
  'git status --short',
  'gcloud config get project',
  'gcloud builds submit "${CONTEXT}"',
  '--async',
] as const) assert.ok(operator.includes(expected), `capsule operator lost ${expected}`)
assert.doesNotMatch(operator, /(?:--substitutions|--gcs-source-staging-dir|--service-account|secret|model|checkpoint)/iu)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-private-capsule-builder',
  productName: 'WeEditPro',
  cloudOnlyCompilerImage: true,
  exactPinnedDownloadCount: 8,
  opencvVersion: '4.12.0',
  opencvCudaArchitecture: '8.9',
  runtimeNetworkDownloadsAllowed: false,
  checkpointOrModelWeightsIncluded: false,
  developerMachineInstallPerformed: false,
  immutableRuntimeImageBuilt: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
