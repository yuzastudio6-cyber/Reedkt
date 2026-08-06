import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string): string => readFileSync(path, 'utf8')
const cli = read('server/cli/canonical-sam3_1-authorized-terms-finalization.ts')
const verifier = read(
  'server/services/canonical-sam3_1-hugging-face-official-access-verifier.ts',
)
const dockerfile = read(
  'docker/prod/sam31-authorized-terms-finalization/Dockerfile',
)
const cloudBuild = read(
  'scripts/gcp/prod/cloudbuild-sam31-authorized-terms-finalization.yaml',
)
const buildScript = read(
  'scripts/gcp/prod/25-build-sam31-authorized-terms-finalization-image.sh',
)
const deployScript = read(
  'scripts/gcp/prod/26-deploy-sam31-authorized-terms-finalization-job.sh',
)
const viteConfig = read('vite.sam31-authorized-terms-finalization.config.ts')
const packageJson = JSON.parse(read('package.json')) as {
  scripts?: Record<string, string>
}

assert.match(cli, /weeditpro-sam31-terms-finalization/u)
assert.match(cli, /finalize-authorized-sam31-terms-once/u)
assert.match(cli, /CLOUD_RUN_TASK_INDEX !== '0'/u)
assert.match(cli, /HUGGINGFACE_TOKEN\|MODEL_WEIGHT_ACCESS_TOKEN/u)
assert.match(cli, /humanTermsIntentRef/u)
assert.match(cli, /credentialVersionAuthorityRef/u)
assert.match(cli, /officialGatedAccessVerifiedByServer/u)
assert.match(cli, /checkpointBytesDownloaded/u)
assert.match(cli, /modelInstalledOnDeveloperMachine/u)
assert.doesNotMatch(cli, /accessGranted:\s*true/u)
assert.doesNotMatch(cli, /gcloud|execSync|spawnSync/u)

assert.match(verifier, /method: 'HEAD'/u)
assert.match(verifier, /redirect: 'manual'/u)
assert.match(verifier, /redirect: 'error'/u)
assert.match(verifier, /secretmanager\.googleapis\.com/u)
assert.match(verifier, /checkpointBytesDownloaded: false/u)
assert.match(verifier, /responseBodyPersisted: false/u)
assert.match(verifier, /secretValuePersistedLoggedOrReturned: false/u)
assert.doesNotMatch(verifier, /redirect: 'follow'/u)

assert.match(dockerfile, /^FROM node:24-alpine3\.22@sha256:[a-f0-9]{64}/mu)
assert.match(dockerfile, /USER node/u)
assert.match(dockerfile, /npm ci --ignore-scripts --no-audit --no-fund/u)
assert.match(dockerfile, /libssl3=3\.5\.7-r0/u)
assert.match(dockerfile, /io\.weeditpro\.model\.weights\.included="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.inference\.allowed="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.gpu\.required="false"/u)
assert.doesNotMatch(dockerfile, /COPY .*\.pt|nvidia|cuda|python/u)

assert.match(cloudBuild, /--platform=linux\/amd64/u)
assert.match(cloudBuild, /--no-cache/u)
assert.match(cloudBuild, /requestedVerifyOption: VERIFIED/u)
assert.match(cloudBuild, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.match(cloudBuild,
  /reeditpro-image-builder-sa@reeditpro\.iam\.gserviceaccount\.com/u)
assert.doesNotMatch(cloudBuild, /machineType:.*GPU|accelerator|gcloud run/u)

assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript, /git rev-parse 'HEAD\^\{tree\}'/u)
assert.match(buildScript, /WEEDITPRO_CONFIRM_SAM31_AUTHORIZED_TERMS_FINALIZATION_IMAGE_BUILD/u)
assert.match(buildScript, /cloudJobStarted":false/u)
assert.match(buildScript, /gpuStarted":false/u)
assert.match(buildScript, /checkpointRead":false/u)
assert.doesNotMatch(buildScript, /gcloud run jobs execute/u)

assert.match(deployScript, /weeditpro-sam31-terms-finalization/u)
assert.match(deployScript,
  /WEEDITPRO_CONFIRM_SAM31_AUTHORIZED_TERMS_FINALIZATION_JOB_DEPLOY/u)
assert.match(deployScript,
  /BUILD_ID='0ffbead4-979a-46b7-960b-4cc49e2e81fb'/u)
assert.match(deployScript,
  /SOURCE_COMMIT='83f63eaa10296f6b9ee87fd25f2f14b7a91e493c'/u)
assert.match(deployScript,
  /SOURCE_TREE='8cb0e5bc827cc5f117945b6856cf8481c0cef144'/u)
assert.match(deployScript,
  /IMAGE_DIGEST='sha256:b593e9994d66efbbede674819f0914c491d53b9e498f941746f5fd8cce6356a4'/u)
assert.match(deployScript,
  /canonical-sam3_1-authorized-human-terms-intent-v1/u)
assert.match(deployScript,
  /authenticated_authorized_human_action/u)
assert.match(deployScript, /contactInformationSharingAcceptedByAuthorizedHuman/u)
assert.match(deployScript, /termsAcceptedByAutomation == false/u)
assert.match(deployScript, /callerTokenPathUrlOrCredentialAccepted == false/u)
assert.match(deployScript, /projects\/\$\{PROJECT_ID\}\/secrets\//u)
assert.match(deployScript, /\.state == "ENABLED"/u)
assert.match(deployScript, /roles\/secretmanager\.secretAccessor/u)
assert.match(deployScript, /roles\/storage\.objectCreator/u)
assert.match(deployScript, /roles\/storage\.objectViewer/u)
assert.match(deployScript,
  /resource\.name\.startsWith\('projects\/_\/buckets\/\$\{CONTROL_BUCKET\}\/objects\/private\/sam3_1\/'\)/u)
assert.match(deployScript, /--max-retries=0/u)
assert.match(deployScript, /--tasks=1 --parallelism=1/u)
assert.match(deployScript, /--cpu=1 --memory=1Gi/u)
assert.match(deployScript, /--task-timeout=15m/u)
assert.match(deployScript, /release=prequalification,scale=zero/u)
assert.match(deployScript, /nodeSelector \/\/ \{\}\) == \{\}/u)
assert.match(deployScript, /run\.googleapis\.com\/network-interfaces/u)
assert.match(deployScript, /from_entries/u)
assert.match(deployScript, /credentialVersionAuthorityRef/u)
assert.match(deployScript, /minimumInstances":0/u)
assert.match(deployScript, /jobExecuted":false/u)
assert.match(deployScript, /checkpointBytesDownloaded":false/u)
assert.match(deployScript, /modelInstalledOnDeveloperMachine":false/u)
assert.match(deployScript, /gpuStarted":false/u)
assert.match(deployScript, /customerCreditsMutated":false/u)
assert.doesNotMatch(deployScript, /gcloud secrets versions access/u)
assert.doesNotMatch(deployScript, /--set-secrets/u)
assert.doesNotMatch(deployScript, /gcloud run jobs execute/u)
assert.doesNotMatch(deployScript, /--gpu|--accelerator|--min-instances/u)
assert.doesNotMatch(deployScript, /--allow-unauthenticated/u)

assert.match(viteConfig,
  /server\/cli\/canonical-sam3_1-authorized-terms-finalization\.ts/u)
assert.match(viteConfig, /codeSplitting: false/u)
assert.equal(
  packageJson.scripts?.['build:sam3_1-authorized-terms-finalization-bundle'],
  'npm run typecheck:server && vite build --config vite.sam31-authorized-terms-finalization.config.ts',
)
assert.equal(
  packageJson.scripts?.['build:sam3_1-authorized-terms-finalization-image'],
  'bash scripts/gcp/prod/25-build-sam31-authorized-terms-finalization-image.sh',
)
assert.equal(
  packageJson.scripts?.['deploy:sam3_1-authorized-terms-finalization-job'],
  'bash scripts/gcp/prod/26-deploy-sam31-authorized-terms-finalization-job.sh',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-authorized-terms-finalization-cloud-job',
  checks: 82,
  sourceBoundCloudJobPackaged: true,
  immutableLinuxAmd64ImageBuildConfigured: true,
  sourceBoundImageBuiltAndScanPinned: true,
  sourceCommitAndTreeRequired: true,
  pinnedSecretManagerVersionRequired: true,
  authenticatedHumanIntentObjectRequired: true,
  privateScaleFromZeroDeploymentPrepared: true,
  officialCheckpointHeadOnly: true,
  termsAcceptedByBuild: false,
  checkpointBytesDownloaded: false,
  modelInstalledOnDeveloperMachine: false,
  cloudJobStarted: false,
  gpuStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
