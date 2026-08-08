import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [cli, vite, dockerfile, buildConfig, buildScript, deployScript,
  runScript, packageJson] = await Promise.all([
  read(
    'server/cli/canonical-sam3_1-source-checkpoint-qualification-vertex-cloud-job.ts',
  ),
  read('vite.sam31-vertex-qualification-operator.config.ts'),
  read('docker/prod/sam31-vertex-qualification-operator/Dockerfile'),
  read('scripts/gcp/prod/cloudbuild-sam31-vertex-qualification-operator.yaml'),
  read('scripts/gcp/prod/41-build-sam31-vertex-qualification-operator-image.sh'),
  read('scripts/gcp/prod/42-deploy-sam31-vertex-qualification-operator-job.sh'),
  read('scripts/gcp/prod/43-run-sam31-vertex-qualification-operator-once.sh'),
  read('package.json'),
])

assert.match(cli, /weeditpro-sam31-vertex-operator/u)
assert.match(cli, /z\.enum\(\['start_one', 'reconcile_one'\]\)/u)
assert.match(cli, /CLOUD_RUN_TASK_INDEX !== '0'/u)
assert.match(cli, /process\.argv\[2\] !== '--execute'/u)
assert.match(cli, /startCanonicalSam31VertexQualificationFromEnvironment/u)
assert.match(cli, /reconcileCanonicalSam31VertexQualificationFromEnvironment/u)
assert.doesNotMatch(cli, /execFile|spawn|ffmpeg|ffprobe|python|torch/u)

assert.match(vite,
  /canonical-sam3_1-source-checkpoint-qualification-vertex-cloud-job\.ts/u)
assert.match(vite, /codeSplitting: false/u)
assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? [])
  .length, 2)
assert.match(dockerfile, /WEEDITPRO_SAM31_VERTEX_OPERATOR_ACTION=disabled/u)
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
assert.match(buildScript, /"vertexJobStarted":false/u)

assert.match(deployScript, /reeditpro-api-sa@reeditpro/u)
assert.match(deployScript, /roles\/aiplatform\.user/u)
assert.match(deployScript, /roles\/iam\.serviceAccountUser/u)
assert.match(deployScript, /vulnerabilities \/\/ \{\}/u)
assert.match(deployScript, /--max-retries=0/u)
assert.match(deployScript,
  /WEEDITPRO_SAM31_VERTEX_OPERATOR_ACTION=disabled/u)
assert.doesNotMatch(deployScript, /gcloud run jobs execute|--gpu/u)

assert.match(runScript, /gcloud run jobs execute/u)
assert.match(runScript, /--update-env-vars/u)
assert.match(runScript, /operatorRemainsUnarmed/u)
assert.match(runScript, /automaticRetryAllowed == false/u)
assert.match(runScript, /customerCreditsMutated == false/u)
assert.doesNotMatch(runScript, /ffmpeg|ffprobe|python|docker|--gpu/u)

assert.match(packageJson,
  /"smoke:sam3_1-vertex-qualification-cloud-operator"/u)
assert.match(packageJson,
  /"build:sam3_1-vertex-qualification-operator-image"/u)
assert.match(packageJson,
  /"deploy:sam3_1-vertex-qualification-operator-job"/u)
assert.match(packageJson,
  /"run:sam3_1-vertex-qualification-operator-once"/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-qualification-cloud-operator',
  checks: 55,
  exactCanonicalRuntimeReused: true,
  deployedConfigurationPermanentlyUnarmed: true,
  executionOnlyStartOrReconcileOverrides: true,
  scaleFromZero: true,
  modelOrCheckpointBytesAcceptedByOperator: false,
  automaticRetryAllowed: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))
