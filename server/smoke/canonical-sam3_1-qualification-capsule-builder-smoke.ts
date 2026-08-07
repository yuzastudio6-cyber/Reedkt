import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = 'docker/prod/gpu-worker/sam3_1'
const dockerfile = readFileSync(
  `${root}/Dockerfile.qualification-capsule-builder`,
  'utf8',
)
const builder = readFileSync(`${root}/build-qualification-capsule.sh`, 'utf8')
const cloudBuild = readFileSync(
  `${root}/cloudbuild.qualification-capsule.yaml`,
  'utf8',
)
const candidate = readFileSync(
  `${root}/Dockerfile.qualification.candidate`,
  'utf8',
)
const operator = readFileSync(
  'scripts/gcp/prod/31-build-sam31-qualification-capsule.sh',
  'utf8',
)
const gcloudIgnore = readFileSync(`${root}/.gcloudignore`, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const expected of [
  'pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081',
  'Dockerfile.qualification.candidate',
  'qualification_runner.py',
  'qualification_entrypoint.sh',
  'source-provenance.lock',
  '0001-reeditpro-gpu-decode.patch',
  'build-qualification-capsule.sh',
  'private-staging/sam3-source.tar',
] as const) assert.ok(
  dockerfile.includes(expected),
  `qualification capsule Dockerfile lost ${expected}`,
)
assert.doesNotMatch(
  dockerfile,
  /(?:sam3\.1_multiplex\.pt|checkpoint\/|HF_TOKEN|huggingface\.co)/u,
)

for (const expected of [
  '96914d2425f90a64f45ca977c2b5165418099543',
  '573deb167702e014829a5b830de8ae62abe891d5',
  'f3a58b95a0e460d76e1cf38abff0382a7307f67d',
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
  'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
  'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
  'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
  'developer.download.nvidia.com',
  'files.pythonhosted.org',
  'capsule download origin is not allowlisted',
  'capsule download identity changed',
  'git write-tree',
  'git apply --index',
  '--format=ustar',
  "--mtime='@0'",
  'gzip --no-name --best',
  'weeditpro-sam3_1-source-patch-application-receipt-v1',
  'weeditpro-sam3_1-python-dependency-closure-receipt-v1',
  'weeditpro-cuda-forward-compat-ingest-receipt-v1',
  'weeditpro-sam3_1-qualification-capsule-builder-result-v1',
  'offlineInstallRequired',
  'dependencyResolutionAtRuntimeAllowed',
  'cpuDecodeFallbackAllowed',
  'checkpointIncluded',
  'containsCredentials',
  'containsCustomerMedia',
] as const) assert.ok(builder.includes(expected), `capsule builder lost ${expected}`)

assert.equal((builder.match(/^download_wheel \\/gmu) ?? []).length, 22)
assert.equal((builder.match(/^download_exact \\/gmu) ?? []).length, 2)
assert.doesNotMatch(builder, /python -m pip download/u)
assert.doesNotMatch(builder, /python -m pip install/u)
assert.doesNotMatch(builder, /(?:apt-get|conda install|git clone)/u)
assert.doesNotMatch(
  builder,
  /(?:sam3\.1_multiplex\.pt|huggingface\.co|HF_TOKEN|GOOGLE_APPLICATION_CREDENTIALS)/u,
)
assert.match(builder, /python -m pip wheel[\s\S]*--no-build-isolation/u)
assert.match(builder, /'42226'/u)
assert.match(builder, /find "\$\{BUILD_SOURCE\}" -type f -exec touch -d '@0'/u)

for (const expected of [
  'reread-exact-official-source',
  '--if-generation-match=1786071963625032',
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
  'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
  '--platform=linux/amd64',
  '--no-cache',
  'reproducibility/${BUILD_ID}/',
  'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
  'CLOUD_LOGGING_ONLY',
  'requestedVerifyOption: VERIFIED',
] as const) assert.ok(cloudBuild.includes(expected), `Cloud Build lost ${expected}`)
assert.doesNotMatch(
  cloudBuild,
  /(?:secretEnv|availableSecrets|sam3\.1_multiplex\.pt|nvidia-l4|a100-80gb|customer[_ -]media)/iu,
)

for (const expected of [
  '**',
  '!.gcloudignore',
  '!Dockerfile.qualification-capsule-builder',
  '!Dockerfile.qualification.candidate',
  '!build-qualification-capsule.sh',
  '!qualification_entrypoint.sh',
  '!qualification_runner.py',
  '!source-provenance.lock',
  '!patches/0001-reeditpro-gpu-decode.patch',
] as const) assert.ok(gcloudIgnore.includes(expected), `.gcloudignore lost ${expected}`)
assert.doesNotMatch(gcloudIgnore, /!Dockerfile\.candidate|!runner\.py|!entrypoint\.sh/u)

for (const expected of [
  'PIP_NO_INDEX=1',
  '--no-index',
  '--no-cache-dir',
  '--no-deps',
  '--require-hashes',
  'torch.__version__ == \'2.10.0+cu128\'',
  'torchvision.__version__ == \'0.25.0\'',
  "m.version('torchcodec') == '0.10.0'",
  'torch.version.cuda == \'12.8\'',
] as const) assert.ok(candidate.includes(expected), `candidate lost ${expected}`)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly REGION='us-central1'",
  "readonly CONFIRMATION='start-weeditpro-sam31-qualification-capsule-build-v1'",
  "readonly CONTEXT='docker/prod/gpu-worker/sam3_1'",
  "readonly APPLE_COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'",
  'env DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}"',
  'git status --short',
  'gcloud config get project',
  'git rev-parse HEAD',
  "git rev-parse 'HEAD^{tree}'",
  'gcloud builds submit "${CONTEXT}"',
  '--async',
] as const) assert.ok(operator.includes(expected), `operator lost ${expected}`)
assert.doesNotMatch(operator, /(?:secret|checkpoint|model-artifact|docker run)/iu)

assert.equal(
  packageJson.scripts?.['build:sam3_1-qualification-capsule'],
  'bash scripts/gcp/prod/31-build-sam31-qualification-capsule.sh',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-capsule-builder',
  productName: 'WeEditPro',
  officialSourceGenerationBound: true,
  exactPinnedPythonWheelCount: 22,
  deterministicLocalSdistWheelCount: 1,
  exactPinnedCudaForwardCompatibilityPackageCount: 1,
  runtimeDependencyResolutionAllowed: false,
  runtimeNetworkAllowed: false,
  checkpointIncluded: false,
  developerMachineInstallPerformed: false,
  immutableQualificationImageBuilt: false,
  gpuQualificationStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
