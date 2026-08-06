import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'scripts/gcp/prod/19-deploy-track-all-sam31-l4-task-qa-job.sh',
  'utf8',
)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly PROJECT_NUMBER='390722338345'",
  "readonly REGION='us-central1'",
  "readonly REPOSITORY='reeditpro-workers'",
  "readonly IMAGE_NAME='reeditpro-track-all-l4-task-qa'",
  "readonly JOB_NAME='reeditpro-track-all-mask-qa-l4'",
  "readonly GPU_WORKER_SERVICE_ACCOUNT='reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'",
  "readonly MASK_BUCKET='reeditpro-production-reeditpro-masks'",
  "readonly VOLUME_NAME='reeditpro-private-gpu-objects'",
  "readonly CONFIRMATION='deploy-weeditpro-track-all-sam31-l4-task-qa-v1'",
  '--execution-environment=gen2',
  '--cpu=8',
  '--memory=32Gi',
  '--gpu=1',
  '--gpu-type=nvidia-l4',
  '--no-gpu-zonal-redundancy',
  '--tasks=1',
  '--parallelism=1',
  '--max-retries=0',
  '--task-timeout=3600s',
  'name=${VOLUME_NAME},type=cloud-storage',
  'volume=${VOLUME_NAME},mount-path=/mnt/reeditpro',
  'readonly=false',
  'uid=65532;gid=65532;implicit-dirs=true',
  'WEEDITPRO_GPU_ACCELERATOR_CLASS=nvidia_l4',
  'release=qualification-candidate',
  '"minimumIdleInstances":0',
  '"jobExecutionStartedByThisOperator":false',
] as const) assert.ok(source.includes(expected), `missing ${expected}`)

for (const forbidden of [
  /gcloud run jobs (?:execute|delete)/u,
  /--execute-now/u,
  /gcloud batch jobs/u,
  /gcloud builds submit/u,
  /(?:^|\n)\s*docker\s/um,
  /(?:^|\n)\s*python(?:3)?\s/um,
  /(?:^|\n)\s*ffmpeg\s/um,
  /(?:^|\n)\s*ffprobe\s/um,
  /secrets versions/u,
  /billing accounts add-iam/u,
  /wallet/u,
] as const) assert.doesNotMatch(source, forbidden)

assert.ok(source.includes('@${digest}'))
assert.doesNotMatch(source, /IMAGE_NAME[}]?:[A-Za-z0-9._-]+/u)

console.log(JSON.stringify({
  smoke: 'track-all-sam31-l4-task-qa-job-definition',
  productName: 'WeEditPro',
  exactJobDefinitionOnly: true,
  immutableImageDigestRequired: true,
  l4Gpu: true,
  scaleFromZero: true,
  automaticRetry: false,
  jobExecuted: false,
  modelOrProviderExecuted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
