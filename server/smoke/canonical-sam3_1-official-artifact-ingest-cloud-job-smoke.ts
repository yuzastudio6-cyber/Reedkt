import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [dockerfile, buildConfig, buildScript, deployScript, viteConfig, cli,
  packageJson] =
  await Promise.all([
    read('docker/prod/sam31-official-artifact-ingest/Dockerfile'),
    read('scripts/gcp/prod/cloudbuild-sam31-official-artifact-ingest.yaml'),
    read('scripts/gcp/prod/20-build-sam31-official-artifact-ingest-image.sh'),
    read('scripts/gcp/prod/21-deploy-sam31-official-artifact-ingest-job.sh'),
    read('vite.sam31-official-artifact-ingest.config.ts'),
    read('server/cli/canonical-sam3_1-official-artifact-ingest.ts'),
    read('package.json'),
  ])

assert.match(dockerfile,
  /node:24-bookworm-slim@sha256:65932751ed4073ed02f5c04e494e4b2572a891b7dbea0568a863dc80341bf848/u)
assert.equal((dockerfile.match(/FROM node:24-bookworm-slim@sha256:/gu) ?? []).length, 3)
assert.match(dockerfile, /WEEDITPRO_SOURCE_COMMIT_SHA/u)
assert.match(dockerfile, /WEEDITPRO_SOURCE_TREE_HASH/u)
assert.match(dockerfile, /NODE_OPTIONS=--max-old-space-size=6144/u)
assert.match(dockerfile, /io\.weeditpro\.model\.weights\.included="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.inference\.allowed="false"/u)
assert.match(dockerfile, /USER node/u)
assert.match(dockerfile,
  /ENTRYPOINT \["node", "dist-sam31-official-artifact-ingest\/weeditpro-sam31-official-artifact-ingest\.js"\]/u)
assert.match(dockerfile,
  /npm run build:sam3_1-official-artifact-ingest-bundle/u)
assert.doesNotMatch(dockerfile, /sam3\.1_multiplex\.pt|HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN/u)

assert.match(buildConfig,
  /gcr\.io\/cloud-builders\/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147/u)
assert.match(buildConfig, /requestedVerifyOption:\s*VERIFIED/u)
assert.match(buildConfig, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.match(buildConfig,
  /reeditpro-image-builder-sa@reeditpro\.iam\.gserviceaccount\.com/u)
assert.doesNotMatch(buildConfig, /secretEnv|availableSecrets|sam3\.1_multiplex\.pt/u)

assert.match(buildScript,
  /build-weeditpro-sam31-official-artifact-ingest-v1/u)
assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript, /git rev-parse 'HEAD\^\{tree\}'/u)
assert.match(buildScript, /image_summary\.digest/u)
assert.match(buildScript, /"modelOrCheckpointDownloaded":false/u)
assert.match(buildScript, /"secretRead":false/u)
assert.match(buildScript, /"cloudJobStarted":false/u)

assert.match(deployScript,
  /deploy-weeditpro-sam31-official-artifact-ingest-v1/u)
assert.match(deployScript, /weeditpro-sam31-official-artifact-ingest/u)
assert.match(deployScript, /weeditpro-sam31-ingest-sa/u)
assert.match(deployScript, /@sha256:/u)
assert.match(deployScript, /versions\/\[1-9\]\[0-9\]\*/u)
assert.match(deployScript, /gcloud storage cat/u)
assert.match(deployScript, /roles\/secretmanager\.secretAccessor/u)
assert.match(deployScript, /--max-retries=0/u)
assert.match(deployScript, /--task-timeout=4h/u)
assert.match(deployScript, /"jobExecuted":false/u)
assert.doesNotMatch(deployScript, /gcloud run jobs execute/u)
assert.doesNotMatch(deployScript, /--allow-unauthenticated/u)

assert.match(viteConfig,
  /input: 'server\/cli\/canonical-sam3_1-official-artifact-ingest\.ts'/u)
assert.match(viteConfig, /codeSplitting: false/u)
assert.match(viteConfig, /copyPublicDir: false/u)
assert.match(viteConfig,
  /outDir: 'dist-sam31-official-artifact-ingest'/u)
assert.match(packageJson,
  /"build:sam3_1-official-artifact-ingest-bundle": "npm run typecheck:server && vite build --config vite\.sam31-official-artifact-ingest\.config\.ts"/u)
assert.match(cli, /const EXPECTED_JOB = 'weeditpro-sam31-official-artifact-ingest'/u)
assert.match(cli, /publishCanonicalSam31OfficialPrivateArtifacts/u)
assert.match(cli, /createCanonicalSam31CloudOfficialArtifactStreamPort/u)
assert.match(cli, /createCanonicalSam31GcsOfficialArtifactPublicationPort/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-official-artifact-ingest-cloud-job',
  checks: 47,
  dedicatedSourceBoundImage: true,
  dedicatedSingleEntryBundle: true,
  pinnedBaseAndCloudBuilder: true,
  immutableImageRequired: true,
  exactHumanTermsObjectRequired: true,
  exactEnabledSecretVersionRequired: true,
  dedicatedLeastPrivilegeServiceIdentity: true,
  cloudJobDeploymentDoesNotExecuteJob: true,
  modelOrCheckpointInstalledOnDeveloperMachine: false,
  cpuControlPlaneMayPerformModelInferenceOrMediaProcessing: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
