import { readFileSync } from 'node:fs'
import {
  GCP_PRODUCTION_API_SERVICE,
  GCP_PRODUCTION_BUCKETS,
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
  GCP_PRODUCTION_DEFAULTS,
  GCP_PRODUCTION_NON_DEPLOYED_TOOLS,
  GCP_PRODUCTION_PREMIUM_GPU_OPTION,
  GCP_PRODUCTION_REQUIRED_APIS,
  GCP_PRODUCTION_SECRET_PLACEHOLDERS,
  GCP_PRODUCTION_SERVICE_ACCOUNTS,
  getGcpProductionArtifactRegistryImage,
  getGcpProductionBucketName,
} from '../config/gcp-production-config'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

const expectedBucketPurposes = [
  'source_media',
  'proxy_media',
  'analysis_artifacts',
  'transcripts',
  'masks',
  'generated_assets',
  'previews',
  'final_exports',
  'worker_temp',
  'qa_artifacts',
]

const bucketPurposes = GCP_PRODUCTION_BUCKETS.map((bucket) => bucket.purpose)
for (const purpose of expectedBucketPurposes) {
  check(bucketPurposes.includes(purpose as (typeof bucketPurposes)[number]), `Missing bucket purpose ${purpose}`)
}

for (const bucket of GCP_PRODUCTION_BUCKETS) {
  const bucketName = getGcpProductionBucketName(bucket.purpose, { projectId: 'example-project' })
  check(
    bucketName === `reeditpro-production-example-project-${bucket.suffix}`,
    `Unexpected bucket name pattern for ${bucket.purpose}: ${bucketName}`,
  )
}

const expectedApis = [
  'run.googleapis.com',
  'artifactregistry.googleapis.com',
  'storage.googleapis.com',
  'secretmanager.googleapis.com',
  'iam.googleapis.com',
  'cloudbuild.googleapis.com',
  'logging.googleapis.com',
  'monitoring.googleapis.com',
  'eventarc.googleapis.com',
  'pubsub.googleapis.com',
]

for (const api of expectedApis) {
  check(GCP_PRODUCTION_REQUIRED_APIS.includes(api as (typeof GCP_PRODUCTION_REQUIRED_APIS)[number]), `Missing required API ${api}`)
}

const expectedServiceAccounts = [
  'reeditpro-api-sa',
  'reeditpro-cpu-worker-sa',
  'reeditpro-gpu-worker-sa',
  'reeditpro-render-worker-sa',
  'reeditpro-qa-worker-sa',
  'reeditpro-tool-readiness-sa',
]

for (const accountId of expectedServiceAccounts) {
  check(
    GCP_PRODUCTION_SERVICE_ACCOUNTS.some((account) => account.accountId === accountId),
    `Missing service account ${accountId}`,
  )
}

const expectedSecrets = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'PROVIDER_GATEWAY_SHARED_SECRET',
  'WORKER_WEBHOOK_SECRET',
  'MODEL_WEIGHT_ACCESS_TOKEN',
]

for (const secretName of expectedSecrets) {
  check(
    GCP_PRODUCTION_SECRET_PLACEHOLDERS.some((secret) => secret.name === secretName),
    `Missing secret placeholder ${secretName}`,
  )
}

check(GCP_PRODUCTION_DEFAULTS.artifactRepository === 'reeditpro-workers', 'Artifact Registry repository default must be present.')
check(
  getGcpProductionArtifactRegistryImage('reeditpro-api', { projectId: 'example-project' }).includes('/reeditpro-workers/reeditpro-api:manual-not-set'),
  'Artifact Registry image naming must include repository and image tag.',
)

const gpuJob = GCP_PRODUCTION_CLOUD_RUN_JOBS.find((job) => job.name === 'reeditpro-gpu-ai-worker')
check(Boolean(gpuJob), 'GPU worker job template must exist.')
check(gpuJob?.gpuType === 'nvidia-l4', 'GPU worker must use nvidia-l4 for first production test.')
check(gpuJob?.gpuCount === 1, 'GPU worker must request one GPU.')
check(gpuJob?.noGpuZonalRedundancy === true, 'GPU worker must include no-gpu-zonal-redundancy.')
check((gpuJob?.cpu ?? 0) >= 4, 'GPU worker must use at least 4 CPU.')
check(gpuJob?.memory === '16Gi', 'GPU worker must use at least 16Gi memory.')
check(gpuJob?.parallelism === 1, 'GPU worker parallelism must default to 1.')

check(
  GCP_PRODUCTION_PREMIUM_GPU_OPTION.status === 'future_premium_evaluation_only',
  'RTX PRO 6000 must remain future/premium/evaluation only.',
)
check(GCP_PRODUCTION_PREMIUM_GPU_OPTION.minimumCpu >= 20, 'RTX PRO 6000 note must require at least 20 CPU.')
check(GCP_PRODUCTION_PREMIUM_GPU_OPTION.minimumMemory === '80Gi', 'RTX PRO 6000 note must require 80Gi memory.')

check(GCP_PRODUCTION_NON_DEPLOYED_TOOLS.includes('revideo'), 'Revideo must be marked non-deployed.')
check(!GCP_PRODUCTION_API_SERVICE.includesRevideo, 'API service template must not include Revideo.')
for (const job of GCP_PRODUCTION_CLOUD_RUN_JOBS) {
  check(!job.includesRevideo, `${job.name} must not deploy Revideo.`)
  check(!job.deployedByMilestone3, `${job.name} must remain template-only in Milestone 3.`)
}

const packageJson = readRepoFile('package.json')
check(!/gcloud/.test(packageJson), 'package.json scripts must not run gcloud.')
check(packageJson.includes('smoke:gcp-foundation'), 'package.json must include smoke:gcp-foundation.')

const envExample = readRepoFile('.env.gcp.production.example')
check(envExample.includes('REEDITPRO_CONFIRM_PROD_SETUP=false'), 'Env example must not enable production confirmation by default.')
check(!/sk-|AIza|secret_[A-Za-z0-9]|ghp_|xoxb-|-----BEGIN/.test(envExample), 'Env example must not contain secret-looking values.')

const scriptPaths = [
  'scripts/gcp/prod/01-enable-apis.sh',
  'scripts/gcp/prod/02-create-artifact-registry.sh',
  'scripts/gcp/prod/03-create-gcs-buckets.sh',
  'scripts/gcp/prod/04-create-service-accounts.sh',
  'scripts/gcp/prod/05-create-secret-placeholders.sh',
  'scripts/gcp/prod/06-configure-iam.sh',
  'scripts/gcp/prod/08-deploy-api-service.example.sh',
  'scripts/gcp/prod/09-deploy-cpu-worker-job.example.sh',
  'scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh',
  'scripts/gcp/prod/11-deploy-render-worker-job.example.sh',
  'scripts/gcp/prod/12-deploy-qa-worker-job.example.sh',
  'scripts/gcp/prod/13-run-tool-readiness-job.example.sh',
  'scripts/gcp/prod/14-run-gpu-smoke-job.example.sh',
]

for (const scriptPath of scriptPaths) {
  const script = readRepoFile(scriptPath)
  check(script.includes('confirm_prod_action'), `${scriptPath} must require production confirmation.`)
  check(script.includes('REEDITPRO_CONFIRM_PROD_SETUP'), `${scriptPath} must mention REEDITPRO_CONFIRM_PROD_SETUP.`)
  check(!/roles\/(owner|editor)\b/.test(script), `${scriptPath} must not grant owner/editor roles.`)
  check(!/\bgcloud\s+(?:run|services|artifacts|storage|iam|secrets|projects|builds)[\s\S]*(?:delete|remove)\b/.test(script), `${scriptPath} must not delete resources.`)
}

const gpuScript = readRepoFile('scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh')
check(gpuScript.includes('--gpu=1'), 'GPU deploy example must include --gpu=1.')
check(gpuScript.includes('--gpu-type=nvidia-l4'), 'GPU deploy example must include --gpu-type=nvidia-l4.')
check(gpuScript.includes('--no-gpu-zonal-redundancy'), 'GPU deploy example must include --no-gpu-zonal-redundancy.')
check(gpuScript.includes('--cpu=4'), 'GPU deploy example must include --cpu=4.')
check(gpuScript.includes('--memory=16Gi'), 'GPU deploy example must include --memory=16Gi.')
check(gpuScript.includes('--parallelism=1'), 'GPU deploy example must include --parallelism=1.')
check(gpuScript.includes('REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT'), 'GPU deploy example must use the GPU worker service account env var.')
check(envExample.includes('REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT=reeditpro-gpu-worker-sa'), 'Env example must map GPU worker service account to reeditpro-gpu-worker-sa.')

const allScriptText = scriptPaths.map(readRepoFile).join('\n')
check(!/signed_url/i.test(allScriptText), 'Scripts must not persist signed_url fields.')
check(!/SECRET_VALUE|REAL_SECRET|paste secret/i.test(allScriptText), 'Scripts must not include secret payload prompts or values.')

console.log(JSON.stringify({
  ok: true,
  bucketPurposes: bucketPurposes.length,
  requiredApis: GCP_PRODUCTION_REQUIRED_APIS.length,
  serviceAccounts: GCP_PRODUCTION_SERVICE_ACCOUNTS.length,
  secretPlaceholders: GCP_PRODUCTION_SECRET_PLACEHOLDERS.length,
  cloudRunJobTemplates: GCP_PRODUCTION_CLOUD_RUN_JOBS.length,
  gpuTemplate: {
    gpuType: gpuJob?.gpuType,
    gpuCount: gpuJob?.gpuCount,
    cpu: gpuJob?.cpu,
    memory: gpuJob?.memory,
    noGpuZonalRedundancy: gpuJob?.noGpuZonalRedundancy,
  },
}, null, 2))
