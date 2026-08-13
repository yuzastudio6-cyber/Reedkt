import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const path =
  'scripts/gcp/prod/55-deploy-sam31-eight-minute-source-preparation-l4-job.sh'
const [script, dockerfile] = await Promise.all([
  readFile(path, 'utf8'),
  readFile(
    'docker/prod/gpu-worker/sam3_1-source-preparation/Dockerfile.candidate',
    'utf8',
  ),
])

assert.match(script, /weeditpro-sam31-source-prep-l4/u)
assert.match(script, /WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST/u)
assert.match(
  script,
  /@\$\{WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST\}/u,
)
assert.match(script, /--command=\/nodejs\/bin\/node/u)
assert.match(script,
  /weeditpro-sam3_1-eight-minute-source-preparation-worker\.js/u)
assert.match(script, /--gpu-type=nvidia-l4/u)
assert.match(script, /--cpu=8/u)
assert.match(script, /--memory=32Gi/u)
assert.match(script, /--tasks=1/u)
assert.match(script, /--parallelism=1/u)
assert.match(script, /--max-retries=0/u)
assert.match(script, /--task-timeout=7200s/u)
assert.match(script, /type=in-memory,size-limit=24Gi/u)
assert.match(script, /WORKER_GROUP=l4_standard_primary/u)
assert.match(script, /GCS_CONTROL_PLANE_STATE_BUCKET=/u)
assert.match(script, /executionStartedByDeployment: false/u)
assert.doesNotMatch(script, /--execute-now|gcloud run jobs execute/u)
assert.doesNotMatch(script, /--set-secrets/u)
assert.match(dockerfile,
  /weeditpro-sam3_1-eight-minute-source-preparation-worker\.js/u)
assert.match(dockerfile, /gcr\.io\/distroless\/nodejs24-debian13:nonroot@sha256:/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-source-preparation-cloud-run-definition',
  checks: 21,
  exactImageDigestRequired: true,
  accelerator: 'nvidia_l4',
  taskCount: 1,
  maximumRetries: 0,
  minimumIdleInstances: 0,
  deploymentStartsExecution: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))
