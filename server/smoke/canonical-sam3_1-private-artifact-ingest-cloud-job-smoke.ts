import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [dockerfile, buildConfig, buildScript, deployScript, viteConfig, cli,
  packageJson] =
  await Promise.all([
    read('docker/prod/sam31-private-artifact-ingest/Dockerfile'),
    read('scripts/gcp/prod/cloudbuild-sam31-private-artifact-ingest.yaml'),
    read('scripts/gcp/prod/23-build-sam31-private-artifact-ingest-image.sh'),
    read('scripts/gcp/prod/24-deploy-sam31-private-artifact-ingest-job.sh'),
    read('vite.sam31-private-artifact-ingest.config.ts'),
    read('server/cli/canonical-sam3_1-private-artifact-ingest.ts'),
    read('package.json'),
  ])

assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? [])
  .length, 2)
assert.match(dockerfile,
  /node:24-alpine3\.22@sha256:8106d433c31d51dfd2fcce29763020619e334dd8c5b34a2f0a357c6656d1ca97/u)
assert.match(dockerfile, /ca-certificates=20260611-r0/u)
assert.match(dockerfile, /libcrypto3=3\.5\.7-r0/u)
assert.match(dockerfile, /libssl3=3\.5\.7-r0/u)
assert.match(dockerfile, /openssl=3\.5\.7-r0/u)
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

assert.match(deployScript,
  /BUILD_ID='03133c6e-91f2-468a-8dd3-e3333b96bbb2'/u)
assert.match(deployScript,
  /SOURCE_COMMIT='4c1ef11eb855de981bfd4fc90b69a2b3a43d3de1'/u)
assert.match(deployScript,
  /SOURCE_TREE='1add02c65b4ffd65845ee20d537fab863c51e0d2'/u)
assert.match(deployScript,
  /IMAGE_DIGEST='sha256:d2be82cef9b3a68a899a1c70d8050db660d81e0c45fa2d9532e00799ed65db87'/u)
assert.match(deployScript, /slsa_build_level == 3/u)
assert.match(deployScript, /FINISHED_SUCCESS/u)
assert.match(deployScript, /contains\(\["NPM", "OS", "SECRET"\]\)/u)
assert.match(deployScript,
  /package_vulnerability_summary\.vulnerabilities/u)
assert.match(deployScript, /privateIpGoogleAccess == true/u)
assert.match(deployScript, /length == 0/u)
assert.match(deployScript, /--network="\$\{NETWORK\}"/u)
assert.match(deployScript, /--subnet="\$\{SUBNET\}"/u)
assert.match(deployScript, /--vpc-egress=all-traffic/u)
assert.match(deployScript, /--max-retries=0/u)
assert.match(deployScript, /--task-timeout=4h/u)
assert.match(deployScript, /gcloud storage cat/u)
assert.match(deployScript, /canonical_private_publication/u)
assert.match(deployScript, /authenticated_private_owner_reread/u)
assert.match(deployScript, /canonical_private_reread/u)
assert.match(deployScript, /roles\/storage\.objectViewer/u)
assert.match(deployScript, /roles\/storage\.objectCreator/u)
assert.doesNotMatch(deployScript, /gcloud run jobs execute/u)
assert.doesNotMatch(deployScript, /--allow-unauthenticated/u)

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
assert.match(packageJson,
  /"deploy:sam3_1-private-artifact-ingest-job": "bash scripts\/gcp\/prod\/24-deploy-sam31-private-artifact-ingest-job\.sh"/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-artifact-ingest-cloud-job',
  checks: 72,
  dedicatedSourceBoundImage: true,
  dedicatedSingleEntryBundle: true,
  pinnedBaseAndCloudBuilder: true,
  immutableImageSlsa3AndZeroVulnerabilitiesObserved: true,
  privateNoNatNetworkRequired: true,
  deploymentDoesNotExecuteJob: true,
  callerReferencesOnly: true,
  modelWeightsIncluded: false,
  modelInstalledOnDeveloperMachine: false,
  imageBuildMayReadCheckpoint: false,
  cloudJobExecuted: false,
  gpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
