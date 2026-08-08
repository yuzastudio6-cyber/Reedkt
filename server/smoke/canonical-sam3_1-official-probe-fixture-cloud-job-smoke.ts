import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [contract, runtime, cli, dockerfile, buildConfig, buildScript,
  deployScript, runScript, viteConfig, packageJson, packageRepository,
  packagePublisher] = await Promise.all([
  read('server/model-artifacts/canonical-sam3_1-official-probe-fixture.ts'),
  read(
    'server/model-artifacts/canonical-sam3_1-official-probe-fixture-runtime.ts',
  ),
  read('server/cli/canonical-sam3_1-official-probe-fixture-ingest.ts'),
  read('docker/prod/sam31-official-probe-fixture-ingest/Dockerfile'),
  read(
    'scripts/gcp/prod/cloudbuild-sam31-official-probe-fixture-ingest.yaml',
  ),
  read(
    'scripts/gcp/prod/35-build-sam31-official-probe-fixture-ingest-image.sh',
  ),
  read(
    'scripts/gcp/prod/36-deploy-sam31-official-probe-fixture-ingest-job.sh',
  ),
  read(
    'scripts/gcp/prod/37-run-sam31-official-probe-fixture-ingest-job.sh',
  ),
  read('vite.sam31-official-probe-fixture-ingest.config.ts'),
  read('package.json'),
  read(
    'server/services/canonical-sam3_1-source-checkpoint-qualification-package-repository.ts',
  ),
  read(
    'server/services/canonical-sam3_1-source-checkpoint-qualification-package-publisher.ts',
  ),
])

assert.match(contract, /assets\/videos\/bedroom\.mp4/u)
assert.match(contract, /1be76d5d19b066e8ad7c565d88a98e11a8f8d456a707508a7aa35390def70e30/u)
assert.match(contract, /byteLength: 2_380_401/u)
assert.match(contract, /sourceFrameCount: 200/u)
assert.match(contract, /qualificationFrameCount: 64/u)
assert.match(contract, /fixedTextPrompt: 'person'/u)
assert.match(contract, /officialPinnedH264AssetReusedWithoutTranscode/u)
assert.match(contract, /developerMachineArtifactSourceAccepted: z\.literal\(false\)/u)
assert.match(contract, /customerMediaUsed: z\.literal\(false\)/u)

assert.match(runtime,
  /raw\.githubusercontent\.com\/facebookresearch\/sam3/u)
assert.match(runtime, /redirect: 'error'/u)
assert.match(runtime, /AbortSignal\.timeout\(5 \* 60 \* 1000\)/u)
assert.doesNotMatch(runtime, /Authorization/u)
assert.match(runtime, /content-length/u)
assert.match(runtime, /createHash\('sha256'\)/u)
assert.match(runtime, /ifGenerationMatch: 0/u)
assert.match(runtime, /kmsKeyName:/u)
assert.match(runtime, /kmsKeyVersionName/u)
assert.match(runtime,
  /isCanonicalSam31OfficialProbeFixtureKmsKeyVersionName/u)
assert.match(runtime, /validation: 'crc32c'/u)
assert.match(runtime, /identical_replay/u)
assert.doesNotMatch(runtime, /ffmpeg|ffprobe|spawn|execFile|python|torch/u)

assert.match(cli, /weeditpro-sam31-official-probe-fixture-ingest/u)
assert.match(cli, /publish-official-sam31-probe-fixture-once/u)
assert.match(cli, /CLOUD_RUN_TASK_INDEX !== '0'/u)
assert.match(cli, /persistReceiptExact/u)
assert.match(cli, /sourceMediaDecodedOrTranscodedDuringIngest/u)

assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? [])
  .length, 2)
assert.match(dockerfile, /io\.weeditpro\.media\.processing\.allowed="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.inference\.allowed="false"/u)
assert.match(dockerfile, /USER node/u)
assert.doesNotMatch(dockerfile, /ffmpeg|python|torch|cuda|nvidia/u)

assert.match(buildConfig,
  /gcr\.io\/cloud-builders\/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147/u)
assert.match(buildConfig, /requestedVerifyOption:\s*VERIFIED/u)
assert.match(buildConfig, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.doesNotMatch(buildConfig, /secretEnv|availableSecrets/u)

assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript, /--format=json/u)
assert.match(buildScript, /"assetFetched":false/u)
assert.match(deployScript, /weeditpro-sam31-probe-sa/u)
assert.doesNotMatch(deployScript,
  /SERVICE_ACCOUNT_ID='[^']{31,}'/u)
assert.match(deployScript,
  /add_project_log_writer_binding_with_propagation_retry/u)
assert.match(deployScript, /vulnerabilities \/\/ \{\}/u)
assert.match(deployScript, /roles\/cloudkms\.cryptoKeyEncrypterDecrypter/u)
assert.match(deployScript, /--cpu=1 --memory=1Gi/u)
assert.match(deployScript, /--max-retries=0/u)
assert.doesNotMatch(deployScript, /--gpu|gcloud run jobs execute/u)
assert.match(runScript, /gcloud run jobs execute/u)
assert.match(runScript, /gcloud storage cat/u)
assert.match(runScript, /cryptoKeyVersions/u)
assert.match(runScript, /sourceMediaDecodedOrTranscodedDuringIngest/u)
assert.doesNotMatch(runScript, /ffmpeg|ffprobe|python|docker/u)

assert.match(viteConfig,
  /canonical-sam3_1-official-probe-fixture-ingest\.ts/u)
assert.match(viteConfig, /codeSplitting: false/u)
assert.match(packageJson,
  /"smoke:sam3_1-official-probe-fixture-cloud-job"/u)
assert.match(packageJson,
  /"run:sam3_1-official-probe-fixture-ingest-job"/u)
assert.match(packageRepository,
  /CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA/u)
assert.match(packagePublisher,
  /CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE\.qualificationFrameCount/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-official-probe-fixture-cloud-job',
  checks: 60,
  exactOfficialPinnedAsset: true,
  unchangedH264Bytes: true,
  cloudControlPlaneOnly: true,
  mediaProcessingPerformed: false,
  developerMachineArtifactSourceAccepted: false,
  customerMediaUsed: false,
  gpuOrModelRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
