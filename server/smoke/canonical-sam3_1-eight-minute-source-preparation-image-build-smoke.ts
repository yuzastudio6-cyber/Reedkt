import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const dockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1-source-preparation/Dockerfile.candidate',
  'utf8',
)
const cloudBuild = readFileSync(
  'docker/prod/gpu-worker/sam3_1-source-preparation/cloudbuild.candidate.yaml',
  'utf8',
)
const operator = readFileSync(
  'scripts/gcp/prod/56-build-sam31-source-preparation-l4-image.sh',
  'utf8',
)

assert.match(cloudBuild, /gcr\.io\/cloud-builders\/docker@sha256:[a-f0-9]{64}/u)
assert.match(cloudBuild, /--platform=linux\/amd64/u)
assert.match(cloudBuild, /Dockerfile\.candidate/u)
assert.match(cloudBuild, /WEEDITPRO_SOURCE_COMMIT_SHA=/u)
assert.match(cloudBuild, /WEEDITPRO_SOURCE_TREE_HASH=/u)
assert.match(cloudBuild, /WEEDITPRO_SOURCE_CLEAN=true/u)
assert.match(cloudBuild, /requestedVerifyOption: VERIFIED/u)
assert.match(cloudBuild, /sourceProvenanceHash:\n {4}- SHA256/u)
assert.match(cloudBuild, /reeditpro-image-builder-sa@reeditpro/u)
assert.match(cloudBuild, /source-preparation-l4/u)
assert.match(cloudBuild, /machineType: E2_HIGHCPU_32/u)
assert.doesNotMatch(cloudBuild, /secret|availableSecrets|sam3_1\.pt/u)

assert.match(
  dockerfile,
  /5c868087e6a0d4243b97776c16f3bfe1511cc53f15c26c822b393a3289608121/u,
)
assert.match(
  dockerfile,
  /67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829/u,
)
assert.match(
  dockerfile,
  /dbeaec433d93b850714760282f1d0992b1254fc3b5a6cb7d76fc1340a1e47563/u,
)
assert.match(dockerfile, /sha256sum --check --strict/u)
assert.match(dockerfile, /stat --format='%s'/u)
assert.match(dockerfile, /NODE_OPTIONS=--max-old-space-size=12288/u)

assert.match(operator, /git status --porcelain --untracked-files=all/u)
assert.match(operator, /git merge-base --is-ancestor/u)
assert.match(operator, /git archive --format=tar\.gz/u)
assert.match(operator, /shasum -a 256/u)
assert.match(operator, /source-prep-\$\{SHORT_ID\}/u)
assert.match(operator, /gcloud builds submit/u)
assert.match(operator, /runtime_release_granted=false/u)
assert.match(operator, /gpu_job_dispatched=false/u)
assert.match(operator, /customer_credits_mutated=false/u)
assert.match(operator, /production_ready=false/u)
assert.doesNotMatch(operator, /docker run|jobs execute|endpoints predict/u)

assert.match(dockerfile, /io\.weeditpro\.runtime\.qualification="candidate-only"/u)
assert.match(
  dockerfile,
  /io\.weeditpro\.runtime\.model-or-checkpoint-included="false"/u,
)
assert.doesNotMatch(dockerfile, /FROM python|pip install|sam2|sam2\.1/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-source-preparation-image-build',
  checks: 32,
  product: 'WeEditPro',
  exactCleanPublishedGitArchiveRequired: true,
  purposeBoundL4Image: true,
  verifiedCloudBuildProvenanceRequested: true,
  modelOrCheckpointIncluded: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}))
