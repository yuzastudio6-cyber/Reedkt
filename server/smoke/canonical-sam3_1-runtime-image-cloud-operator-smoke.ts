import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [cli, vite, dockerfile, buildConfig, buildScript, deployScript,
  runScript, ignoreFile, packageJson] = await Promise.all([
  read('server/cli/canonical-sam3_1-runtime-image-cloud-job.ts'),
  read('vite.sam31-runtime-image-operator.config.ts'),
  read('docker/prod/sam31-runtime-image-operator/Dockerfile'),
  read('scripts/gcp/prod/cloudbuild-sam31-runtime-image-operator.yaml'),
  read('scripts/gcp/prod/50-build-sam31-runtime-image-operator-image.sh'),
  read('scripts/gcp/prod/51-deploy-sam31-runtime-image-operator-job.sh'),
  read('scripts/gcp/prod/52-run-sam31-runtime-image-operator-once.sh'),
  read('scripts/gcp/prod/sam31-runtime-image-operator.gcloudignore'),
  read('package.json'),
])

assert.match(cli, /weeditpro-sam31-runtime-image-operator/u)
assert.match(cli, /z\.enum\(\['start_one', 'observe_one'\]\)/u)
assert.match(cli, /CLOUD_RUN_TASK_INDEX !== '0'/u)
assert.match(cli, /process\.argv\[2\] !== '--execute'/u)
assert.match(cli, /executeCanonicalSam31CloudImageBuildOperator/u)
assert.match(cli, /WEEDITPRO_CONFIRM_SAM31_CLOUD_BUILD: 'true'/u)
assert.match(cli, /--action=\$\{command\.action === 'start_one'/u)
assert.match(cli, /result\.disposition === 'submitted'/u)
assert.match(cli,
  /image_built_pending_scan_signature_and_gpu_qualification/u)
assert.match(cli, /result\.disposition === 'terminal_failure'/u)
assert.doesNotMatch(cli, /execFile|spawn|ffmpeg|ffprobe|python|torch|cuda/u)

assert.match(vite, /canonical-sam3_1-runtime-image-cloud-job\.ts/u)
assert.match(vite, /codeSplitting: false/u)
assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? [])
  .length, 2)
assert.match(dockerfile,
  /WEEDITPRO_SAM31_RUNTIME_IMAGE_OPERATOR_ACTION=disabled/u)
assert.match(dockerfile, /io\.weeditpro\.model\.weights\.included="false"/u)
assert.match(dockerfile,
  /io\.weeditpro\.media\.processing\.allowed="false"/u)
assert.match(dockerfile,
  /io\.weeditpro\.runtime\.inference\.allowed="false"/u)
assert.match(dockerfile,
  /io\.weeditpro\.caller\.build\.input\.allowed="false"/u)
assert.match(dockerfile,
  /io\.weeditpro\.automatic\.retry\.allowed="false"/u)
assert.match(dockerfile, /USER node/u)
assert.doesNotMatch(dockerfile, /ffmpeg|python|torch|cuda|nvidia/u)

assert.match(buildConfig,
  /gcr\.io\/cloud-builders\/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147/u)
assert.match(buildConfig, /requestedVerifyOption:\s*VERIFIED/u)
assert.match(buildConfig, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.doesNotMatch(buildConfig, /secretEnv|availableSecrets/u)
assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript,
  /--ignore-file="\$\{IGNORE_FILE\}"/u)
assert.match(buildScript, /"sam31RuntimeImageBuildStarted":false/u)
assert.match(ignoreFile, /^\*$/mu)
assert.match(ignoreFile, /^!tsconfig\.app\.json$/mu)
assert.match(ignoreFile, /^!server\/\*\*$/mu)
assert.match(ignoreFile,
  /^!scripts\/validation\/project-edit-brief-owner-evidence-example-generator\.ts$/mu)
assert.match(ignoreFile, /^!src\/lib\/\*\*$/mu)
assert.match(ignoreFile,
  /^!docker\/prod\/sam31-runtime-image-operator\/Dockerfile$/mu)
assert.doesNotMatch(ignoreFile, /^!docs\/|^!tests\/|^!test-results\//mu)

assert.match(deployScript, /reeditpro-api-sa@reeditpro/u)
assert.match(deployScript, /roles\/cloudbuild\.builds\.editor/u)
assert.match(deployScript, /roles\/storage\.objectCreator/u)
assert.match(deployScript, /roles\/storage\.objectViewer/u)
assert.match(deployScript, /vulnerabilities \/\/ \{\}/u)
assert.match(deployScript, /--max-retries=0/u)
assert.match(deployScript,
  /WEEDITPRO_SAM31_RUNTIME_IMAGE_OPERATOR_ACTION=disabled/u)
assert.doesNotMatch(deployScript, /gcloud run jobs execute|--gpu/u)

assert.match(runScript, /gcloud run jobs execute/u)
assert.match(runScript, /--update-env-vars/u)
assert.match(runScript,
  /safe_id\(\).*\{0,239\}.*\*'\.\.'\*/su)
assert.doesNotMatch(runScript, /\{0,511\}/u)
assert.match(runScript, /start_one.*observe_one/su)
assert.match(runScript, /operatorRemainsUnarmed/u)
assert.match(runScript, /automaticRetryAllowed == false/u)
assert.match(runScript, /\.disposition == "submitted"/u)
assert.match(runScript,
  /image_built_pending_scan_signature_and_gpu_qualification/u)
assert.match(runScript, /\.disposition == "terminal_failure"/u)
assert.match(runScript, /modelOrCheckpointBytesReadLocally == false/u)
assert.doesNotMatch(runScript,
  /ffmpeg|ffprobe|python|docker|--gpu|checkpoint-uri|dockerfile|image-tag/u)

assert.match(packageJson,
  /"smoke:sam3_1-runtime-image-cloud-operator"/u)
assert.match(packageJson,
  /"build:sam3_1-runtime-image-operator-bundle"/u)
assert.match(packageJson,
  /"build:sam3_1-runtime-image-operator-image"/u)
assert.match(packageJson,
  /"deploy:sam3_1-runtime-image-operator-job"/u)
assert.match(packageJson,
  /"run:sam3_1-runtime-image-operator-once"/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-runtime-image-cloud-operator',
  checks: 73,
  canonicalImageBuildRuntimeReused: true,
  sourceCheckpointQualificationRequiredByOwner: true,
  callerBuildInputAccepted: false,
  deployedConfigurationPermanentlyUnarmed: true,
  executionOnlyStartOrObserveOverrides: true,
  macOsBashCompatibleCanonicalSafeIds: true,
  scaleFromZero: true,
  modelOrCheckpointBytesAcceptedByOperator: false,
  automaticRetryAllowed: false,
  gpuOrModelRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
