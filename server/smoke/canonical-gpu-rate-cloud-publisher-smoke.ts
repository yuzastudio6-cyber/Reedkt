import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [cli, vite, dockerfile, buildConfig, buildScript, deployScript,
  runScript, packageJson] = await Promise.all([
  read('server/cli/canonical-gpu-account-effective-rate-cloud-job.ts'),
  read('vite.gpu-rate-publisher.config.ts'),
  read('docker/prod/gpu-rate-publisher/Dockerfile'),
  read('scripts/gcp/prod/cloudbuild-gpu-rate-publisher.yaml'),
  read('scripts/gcp/prod/47-build-gpu-rate-publisher-image.sh'),
  read('scripts/gcp/prod/48-deploy-gpu-rate-publisher-job.sh'),
  read('scripts/gcp/prod/49-run-gpu-rate-publisher-job.sh'),
  read('package.json'),
])

assert.match(cli, /weeditpro-gpu-rate-publisher/u)
assert.match(cli, /z\.literal\('publish_all_routes'\)/u)
assert.match(cli, /CLOUD_RUN_TASK_INDEX !== '0'/u)
assert.match(cli, /process\.argv\[2\] !== '--execute'/u)
assert.match(cli, /gpu-rates-us-central1-\$\{execution\}/u)
assert.match(cli, /publicationVersion: 1/u)
assert.match(cli, /createGoogleCloudAccountEffectiveGpuRateReadPort/u)
assert.match(cli,
  /createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository/u)
assert.doesNotMatch(cli,
  /WEEDITPRO_GPU_RATE_PUBLICATION_ID|callerPrice|serviceFee/u)
assert.doesNotMatch(cli, /execFile|spawn|ffmpeg|ffprobe|python|torch|cuda/u)

assert.match(vite, /canonical-gpu-account-effective-rate-cloud-job\.ts/u)
assert.match(vite, /codeSplitting: false/u)
assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? [])
  .length, 2)
assert.match(dockerfile, /WEEDITPRO_GPU_RATE_OPERATOR_ACTION=disabled/u)
assert.match(dockerfile,
  /io\.weeditpro\.billing\.account\.coordinate\.included="false"/u)
assert.match(dockerfile, /io\.weeditpro\.model\.weights\.included="false"/u)
assert.match(dockerfile, /io\.weeditpro\.media\.processing\.allowed="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.inference\.allowed="false"/u)
assert.match(dockerfile,
  /io\.weeditpro\.customer\.credit\.mutation\.allowed="false"/u)
assert.match(dockerfile, /USER node/u)
assert.doesNotMatch(dockerfile, /ffmpeg|python|torch|cuda|nvidia/u)

assert.match(buildConfig,
  /gcr\.io\/cloud-builders\/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147/u)
assert.match(buildConfig, /requestedVerifyOption:\s*VERIFIED/u)
assert.match(buildConfig, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.doesNotMatch(buildConfig, /secretEnv|availableSecrets/u)
assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript, /"billingPriceReadAttempted":false/u)

assert.match(deployScript, /reeditpro-api-sa@reeditpro/u)
assert.match(deployScript, /roles\/storage\.objectCreator/u)
assert.match(deployScript, /roles\/storage\.objectViewer/u)
assert.match(deployScript, /vulnerabilities \/\/ \{\}/u)
assert.match(deployScript, /--max-retries=0/u)
assert.match(deployScript, /--task-timeout=5m/u)
assert.match(deployScript, /WEEDITPRO_GPU_RATE_OPERATOR_ACTION=disabled/u)
assert.match(deployScript, /canonicalGpuRouteCount":3/u)
assert.match(deployScript, /minimumIdleInstances":0/u)
assert.doesNotMatch(deployScript,
  /roles\/billing\.viewer|gcloud run jobs execute|--gpu/u)

assert.match(runScript, /gcloud billing projects describe/u)
assert.match(runScript, /gcloud run jobs execute/u)
assert.match(runScript, /--update-env-vars/u)
assert.match(runScript,
  /WEEDITPRO_GPU_RATE_OPERATOR_ACTION=publish_all_routes/u)
assert.match(runScript,
  /WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME=\$\{linked_account\}/u)
assert.match(runScript,
  /a100_80gb_heavy_primary.*l4_heavy_fallback.*l4_standard_primary/su)
assert.match(runScript, /allCanonicalRoutesObservedBeforeAnyPersistence/u)
assert.match(runScript, /operatorRemainsUnarmed/u)
assert.match(runScript, /billingAccountIdentifierReturned == false/u)
assert.match(runScript, /providerOrGpuJobStarted == false/u)
assert.match(runScript, /walletOrCreditMutationAuthorityGranted == false/u)
assert.match(runScript, /productionAuthorityGranted == false/u)
assert.doesNotMatch(runScript,
  /WEEDITPRO_GPU_RATE_PUBLICATION_ID|ffmpeg|ffprobe|python|docker|--gpu/u)
assert.doesNotMatch(runScript, /printf[^\n]*linked_account/u)

assert.match(packageJson,
  /"smoke:gpu-account-effective-rate-cloud-publisher"/u)
assert.match(packageJson, /"build:gpu-rate-publisher-bundle"/u)
assert.match(packageJson, /"build:gpu-rate-publisher-image"/u)
assert.match(packageJson, /"deploy:gpu-rate-publisher-job"/u)
assert.match(packageJson, /"run:gpu-rate-publisher-job"/u)

console.log(JSON.stringify({
  smoke: 'canonical-gpu-rate-cloud-publisher',
  checks: 69,
  canonicalGpuRouteCount: 3,
  allRoutesObservedBeforePersistence: true,
  billingAccountCoordinatePersisted: false,
  exactLinkedAccountResolvedByOperator: true,
  serverOwnedPublicationIdentity: true,
  billingAccountEffectivePriceReadOnly: true,
  deployedConfigurationPermanentlyUnarmed: true,
  executionOnlyPublicationOverride: true,
  scaleFromZero: true,
  providerOrGpuJobStarted: false,
  customerCreditsMutated: false,
  publicDeliveryAuthorityGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
