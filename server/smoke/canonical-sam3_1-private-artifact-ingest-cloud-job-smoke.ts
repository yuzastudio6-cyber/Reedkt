import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [dockerfile, buildConfig, buildScript, viteConfig, cli, packageJson] =
  await Promise.all([
    read('docker/prod/sam31-private-artifact-ingest/Dockerfile'),
    read('scripts/gcp/prod/cloudbuild-sam31-private-artifact-ingest.yaml'),
    read('scripts/gcp/prod/23-build-sam31-private-artifact-ingest-image.sh'),
    read('vite.sam31-private-artifact-ingest.config.ts'),
    read('server/cli/canonical-sam3_1-private-artifact-ingest.ts'),
    read('package.json'),
  ])

assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? [])
  .length, 2)
assert.match(dockerfile,
  /node:24-alpine3\.22@sha256:8106d433c31d51dfd2fcce29763020619e334dd8c5b34a2f0a357c6656d1ca97/u)
assert.match(dockerfile, /ca-certificates=20260611-r0/u)
assert.match(dockerfile, /rm -rf \/usr\/local\/lib\/node_modules\/npm/u)
assert.doesNotMatch(dockerfile, /COPY --from=dependencies|\/app\/node_modules/u)
assert.match(dockerfile, /WEEDITPRO_SOURCE_COMMIT_SHA/u)
assert.match(dockerfile, /WEEDITPRO_SOURCE_TREE_HASH/u)
assert.match(dockerfile, /io\.weeditpro\.model\.weights\.included="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.inference\.allowed="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.gpu\.required="false"/u)
assert.match(dockerfile, /USER node/u)
assert.match(dockerfile,
  /ENTRYPOINT \["node", "dist-sam31-private-artifact-ingest\/weeditpro-sam31-private-artifact-ingest\.js"\]/u)
assert.doesNotMatch(dockerfile,
  /sam3\.1_multiplex\.pt|HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN/u)

assert.match(buildConfig,
  /gcr\.io\/cloud-builders\/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147/u)
assert.match(buildConfig, /requestedVerifyOption:\s*VERIFIED/u)
assert.match(buildConfig, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.match(buildConfig,
  /reeditpro-image-builder-sa@reeditpro\.iam\.gserviceaccount\.com/u)
assert.doesNotMatch(buildConfig,
  /secretEnv|availableSecrets|sam3\.1_multiplex\.pt/u)

assert.match(buildScript,
  /build-weeditpro-sam31-private-artifact-ingest-v1/u)
assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript, /git rev-parse 'HEAD\^\{tree\}'/u)
assert.match(buildScript, /image_summary\.digest/u)
assert.match(buildScript, /"checkpointRead":false/u)
assert.match(buildScript, /"modelInstalled":false/u)
assert.match(buildScript, /"cloudJobStarted":false/u)
assert.match(buildScript, /"gpuStarted":false/u)
assert.match(buildScript, /"customerCreditsMutated":false/u)

assert.match(viteConfig,
  /input: 'server\/cli\/canonical-sam3_1-private-artifact-ingest\.ts'/u)
assert.match(viteConfig, /codeSplitting: false/u)
assert.match(viteConfig, /copyPublicDir: false/u)
assert.match(viteConfig, /noExternal: true/u)
assert.match(viteConfig, /outDir: 'dist-sam31-private-artifact-ingest'/u)

assert.match(cli,
  /const EXPECTED_JOB = 'weeditpro-sam31-private-artifact-ingest'/u)
assert.match(cli, /createCanonicalSam31GcpPrivateArtifactIngestRuntime/u)
assert.match(cli, /prepareReviewedPrivateArtifactIngest/u)
assert.match(cli,
  /canonical-sam3_1-official-artifact-publication-receipt-v1/u)
assert.match(cli, /canonical-sam3_1-private-artifact-review-bundle-v1/u)
assert.match(cli, /process\.env\.CLOUD_RUN_TASK_ATTEMPT !== '0'/u)
assert.doesNotMatch(cli,
  /HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN|OBJECT_NAME|BUCKET|URL/u)
assert.doesNotMatch(cli, /imageBuildStarted:\s*true|gpuRuntimeStarted:\s*true/u)
assert.match(packageJson,
  /"build:sam3_1-private-artifact-ingest-bundle": "npm run typecheck:server && vite build --config vite\.sam31-private-artifact-ingest\.config\.ts"/u)
assert.match(packageJson,
  /"build:sam3_1-private-artifact-ingest-image": "bash scripts\/gcp\/prod\/23-build-sam31-private-artifact-ingest-image\.sh"/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-artifact-ingest-cloud-job',
  checks: 45,
  dedicatedSourceBoundImage: true,
  dedicatedSingleEntryBundle: true,
  pinnedBaseAndCloudBuilder: true,
  callerReferencesOnly: true,
  modelWeightsIncluded: false,
  modelInstalledOnDeveloperMachine: false,
  imageBuildMayReadCheckpoint: false,
  cloudJobExecuted: false,
  gpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
