import { readFileSync } from 'node:fs'
import {
  GCP_PRODUCTION_API_SERVICE,
  GCP_PRODUCTION_BUCKETS,
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
  GCP_PRODUCTION_DEFAULTS,
  GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES,
  GCP_PRODUCTION_LEGACY_SERVICE_ACCOUNTS,
  GCP_PRODUCTION_NON_DEPLOYED_TOOLS,
  GCP_PRODUCTION_PREMIUM_GPU_OPTION,
  GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES,
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
  'model_artifacts',
  'image_build_inputs',
  'image_supply_chain_evidence',
  'control_plane_state',
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
  'serviceusage.googleapis.com',
  'run.googleapis.com',
  'batch.googleapis.com',
  'compute.googleapis.com',
  'aiplatform.googleapis.com',
  'cloudbilling.googleapis.com',
  'artifactregistry.googleapis.com',
  'storage.googleapis.com',
  'secretmanager.googleapis.com',
  'iam.googleapis.com',
  'cloudbuild.googleapis.com',
  'cloudkms.googleapis.com',
  'containeranalysis.googleapis.com',
  'containerscanning.googleapis.com',
  'binaryauthorization.googleapis.com',
  'logging.googleapis.com',
  'monitoring.googleapis.com',
  'eventarc.googleapis.com',
  'pubsub.googleapis.com',
  'cloudtasks.googleapis.com',
  'iamcredentials.googleapis.com',
]

for (const api of expectedApis) {
  check(GCP_PRODUCTION_REQUIRED_APIS.includes(api as (typeof GCP_PRODUCTION_REQUIRED_APIS)[number]), `Missing required API ${api}`)
}

const gcloudCommon = readRepoFile('scripts/gcp/prod/lib/gcloud-common.sh')
for (const api of expectedApis) {
  check(gcloudCommon.includes(api), `GCP setup scripts cannot enable required API ${api}`)
}
for (const secretName of [
  'MODEL_WEIGHT_ACCESS_TOKEN',
  'HUGGINGFACE_TOKEN',
]) {
  check(
    gcloudCommon.includes(secretName),
    `GCP setup scripts cannot create required model-artifact placeholder ${secretName}`,
  )
}
check(
  !gcloudCommon.includes('secrets versions access'),
  'GCP setup helpers must never read secret payloads.',
)

const expectedServiceAccounts = [
  'reeditpro-api-sa',
  'reeditpro-image-builder-sa',
  'reeditpro-image-signer-sa',
  'reeditpro-gpu-worker-sa',
]

for (const accountId of expectedServiceAccounts) {
  check(
    GCP_PRODUCTION_SERVICE_ACCOUNTS.some((account) => account.accountId === accountId),
    `Missing service account ${accountId}`,
  )
}
check(GCP_PRODUCTION_SERVICE_ACCOUNTS.length === 4,
  'Only API, image-build/sign, and GPU identities may remain active.')
check(GCP_PRODUCTION_LEGACY_SERVICE_ACCOUNTS.historicalReadbackOnly,
  'Retired worker identities must remain historical readback only.')
check(!GCP_PRODUCTION_LEGACY_SERVICE_ACCOUNTS.mayAuthorizeNewWork,
  'Retired worker identities must not authorize new work.')
for (const accountId of [
  'reeditpro-cpu-worker-sa',
  'reeditpro-render-worker-sa',
  'reeditpro-qa-worker-sa',
  'reeditpro-tool-readiness-sa',
] as const) {
  check(!GCP_PRODUCTION_SERVICE_ACCOUNTS.some((account) =>
    account.accountId === accountId),
  `${accountId} must not be an active foundation identity.`)
  check(GCP_PRODUCTION_LEGACY_SERVICE_ACCOUNTS.entries.some((account) =>
    account.accountId === accountId),
  `${accountId} historical readback coordinate is missing.`)
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

const a100 = GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.find((runtime) =>
  runtime.routeId === 'a100_80gb_heavy_primary')
const l4Fallback = GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.find((runtime) =>
  runtime.routeId === 'l4_heavy_fallback')
const l4Standard = GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.find((runtime) =>
  runtime.routeId === 'l4_standard_primary')
check(Boolean(a100 && l4Fallback && l4Standard), 'The complete quality-first GPU topology must exist.')
check(a100?.runtimeKind === 'google_cloud_batch_job', 'A100 heavy primary must use a Batch job.')
check(a100?.machineType === 'a2-ultragpu-1g', 'A100 heavy primary must use a2-ultragpu-1g.')
check(a100?.accelerator === 'nvidia_a100_80gb', 'A100 heavy primary must use NVIDIA A100 80 GB.')
check(a100?.gpuMemoryGiB === 80 && a100.cpu === 12 && a100.memoryGiB === 170, 'A100 route resources are incomplete.')
check(a100?.localScratchGiB === 375, 'A100 route must preserve its local scratch requirement.')
check(l4Fallback?.routeRole === 'heavy_fallback', 'The L4 heavy route must remain fallback-only.')
check(l4Standard?.routeRole === 'standard_primary', 'The L4 standard route must remain primary for normal GPU work.')
for (const l4 of [l4Fallback, l4Standard]) {
  check(l4?.runtimeKind === 'google_cloud_run_job', 'L4 routes must use Cloud Run jobs.')
  check(l4?.accelerator === 'nvidia_l4', 'L4 routes must use NVIDIA L4.')
  check(l4?.gpuMemoryGiB === 24 && l4.cpu === 8 && l4.memoryGiB === 32, 'L4 route resources are incomplete.')
}
for (const runtime of GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES) {
  check(runtime.minimumIdleInstances === 0, `${runtime.routeId} must scale from zero.`)
  check(runtime.maximumConcurrentAttemptsPerInstance === 1, `${runtime.routeId} must isolate attempts.`)
  check(runtime.maximumTaskRetries === 0, `${runtime.routeId} must leave retry authority to the canonical owner.`)
  check(runtime.startsOnlyFromConsumedApprovedUserAttempt, `${runtime.routeId} must require approved user work.`)
  check(runtime.stopsAtTerminalAttempt, `${runtime.routeId} must stop at terminal state.`)
  check(!runtime.cpuOnlySubstantiveExecutionAllowed, `${runtime.routeId} must not admit substantive CPU fallback.`)
  check(!runtime.qualityReducingFallbackAllowed, `${runtime.routeId} must not reduce quality.`)
  check(!runtime.runtimeNetworkDownloadAllowed, `${runtime.routeId} must not download models at runtime.`)
  check(!runtime.productionQualified, `${runtime.routeId} source must not self-claim cloud qualification.`)
}

check(GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES.historicalReadbackOnly, 'Legacy Cloud Run templates must remain historical.')
check(!GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES.mayAuthorizeNewWork, 'Legacy Cloud Run templates must not authorize fresh work.')
check(
  GCP_PRODUCTION_PREMIUM_GPU_OPTION.status === 'retired_not_in_current_quality_first_policy',
  'RTX PRO 6000 must remain outside the current A100/L4 policy.',
)
check(!GCP_PRODUCTION_PREMIUM_GPU_OPTION.mayAuthorizeNewWork, 'RTX PRO 6000 must not authorize new work.')

check(GCP_PRODUCTION_NON_DEPLOYED_TOOLS.includes('revideo'), 'Revideo must be marked non-deployed.')
check(!GCP_PRODUCTION_API_SERVICE.includesRevideo, 'API service template must not include Revideo.')
for (const job of GCP_PRODUCTION_CLOUD_RUN_JOBS) {
  check(!job.includesRevideo, `${job.name} must not deploy Revideo.`)
  check(!job.deployedByMilestone3, `${job.name} must remain template-only in Milestone 3.`)
  check(job.maxRetries === 0, `${job.name} must not hide execution retries from the package queue.`)
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
  'scripts/gcp/prod/02-create-image-signing-key.sh',
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
  const retiredOrManualBypass = [
    'scripts/gcp/prod/09-deploy-cpu-worker-job.example.sh',
    'scripts/gcp/prod/11-deploy-render-worker-job.example.sh',
    'scripts/gcp/prod/12-deploy-qa-worker-job.example.sh',
    'scripts/gcp/prod/13-run-tool-readiness-job.example.sh',
    'scripts/gcp/prod/14-run-gpu-smoke-job.example.sh',
  ].includes(scriptPath)
  if (retiredOrManualBypass) {
    check(script.includes('Blocked:'), `${scriptPath} must identify the blocked legacy or manual path.`)
    check(script.includes('exit 2'), `${scriptPath} must fail closed.`)
    check(!script.includes('run_gcloud'), `${scriptPath} must not create a cloud job.`)
  } else {
    check(script.includes('confirm_prod_action'), `${scriptPath} must require production confirmation.`)
    check(script.includes('REEDITPRO_CONFIRM_PROD_SETUP'), `${scriptPath} must mention REEDITPRO_CONFIRM_PROD_SETUP.`)
  }
  check(!/roles\/(owner|editor)\b/.test(script), `${scriptPath} must not grant owner/editor roles.`)
  check(!/\bgcloud\s+(?:run|services|artifacts|storage|iam|secrets|projects|builds)[\s\S]*(?:delete|remove)\b/.test(script), `${scriptPath} must not delete resources.`)
}

const gpuScript = readRepoFile('scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh')
check(gpuScript.includes('reeditpro-professional-l4'), 'GPU deploy example must define the L4 standard-primary job.')
check(gpuScript.includes('reeditpro-sam31-l4-fallback'), 'GPU deploy example must define the separately qualified SAM 3.1 L4 fallback job.')
check(gpuScript.includes('reeditpro-track-all-mask-qa-l4'), 'GPU deploy example must define the dedicated Track All L4 mask-QA job.')
check((gpuScript.match(/--gpu=1/gu) ?? []).length === 3, 'All three L4 jobs must include --gpu=1.')
check((gpuScript.match(/--gpu-type=nvidia-l4/gu) ?? []).length === 3, 'All three L4 jobs must use nvidia-l4.')
check((gpuScript.match(/--no-gpu-zonal-redundancy/gu) ?? []).length === 3, 'All three L4 jobs must disable GPU zonal redundancy.')
check((gpuScript.match(/--cpu=8/gu) ?? []).length === 3, 'All three L4 jobs must use 8 vCPU.')
check((gpuScript.match(/--memory=32Gi/gu) ?? []).length === 3, 'All three L4 jobs must use 32Gi memory.')
check((gpuScript.match(/--parallelism=1/gu) ?? []).length === 3, 'All three L4 jobs must use parallelism 1.')
check(!gpuScript.includes('--min-instances=1'), 'L4 jobs must not configure a warm instance.')
check(gpuScript.includes('REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT'), 'GPU deploy example must use the GPU worker service account env var.')
check(gpuScript.includes('WEEDITPRO_L4_MEDIA_IMAGE_DIGEST'),
  'L4 standard definition must require an immutable image digest.')
check(gpuScript.includes('WEEDITPRO_SAM31_IMAGE_DIGEST'),
  'SAM 3.1 L4 fallback definition must require an immutable image digest.')
check(gpuScript.includes('WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_DIGEST'),
  'Track All mask QA must require its own immutable image digest.')
check(gpuScript.includes('reeditpro-track-all-l4-task-qa@'),
  'Track All mask QA must use its dedicated immutable image repository.')
check(gpuScript.includes('mount-path=/mnt/reeditpro,type=cloud-storage'),
  'Track All mask QA must mount the fixed private object root.')
check(gpuScript.includes('bucket=${MASK_BUCKET},readonly=false'),
  'Track All mask QA must use the fixed private mask bucket.')
check(gpuScript.includes('uid=65532;gid=65532;implicit-dirs=true'),
  'Track All mask QA private mount must match its non-root worker identity.')
check(gpuScript.includes('deploy-weeditpro-qualified-l4-job-definitions-v1'),
  'L4 definition deployment must require a second exact confirmation.')
check(!gpuScript.includes('artifact_image reeditpro-l4-media-worker'),
  'L4 definitions must not use mutable image tags.')
check(!gpuScript.includes('run jobs execute'),
  'Definition deployment must not start a GPU execution.')
check(envExample.includes('REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT=reeditpro-gpu-worker-sa'), 'Env example must map GPU worker service account to reeditpro-gpu-worker-sa.')
check(envExample.includes('REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT=reeditpro-image-builder-sa'), 'Env example must map the private image-builder service account.')
check(envExample.includes('REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT=reeditpro-image-signer-sa'), 'Env example must map the immutable image-signer service account.')
for (const retiredEnv of [
  'REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT=',
  'REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT=',
  'REEDITPRO_QA_WORKER_SERVICE_ACCOUNT=',
  'REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT=',
] as const) check(!envExample.includes(retiredEnv),
  `${retiredEnv} must not remain an active foundation input.`)

const iamScript = readRepoFile('scripts/gcp/prod/06-configure-iam.sh')
check(iamScript.includes('roles/cloudbuild.builds.editor'), 'API orchestration must have the bounded Cloud Build create/read role.')
check(iamScript.includes('roles/iam.serviceAccountTokenCreator'), 'Cloud Build service agent must be able to mint the user-specified build identity.')
check(
  iamScript.includes('grant_artifact_repository_role "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" roles/artifactregistry.writer'),
  'Image builder must write only the configured Artifact Registry repository.',
)
check(
  iamScript.includes('grant_artifact_repository_role "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" roles/artifactregistry.writer'),
  'Dedicated signer must be able to append cosign OCI referrers in only the configured repository.',
)
check(
  iamScript.includes('grant_artifact_repository_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/artifactregistry.reader'),
  'Supply-chain authority must use repository-scoped reads.',
)
check(
  iamScript.includes('grant_artifact_repository_role "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" roles/artifactregistry.reader'),
  'GPU worker must be able to pull only from the configured image repository.',
)
check(
  /grant_cloud_build_service_agent_token_creator \\\n\s+"\$\{REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT\}"/u.test(iamScript),
  'Cloud Build must be able to use the dedicated image-signing identity.',
)
check(iamScript.includes('roles/cloudkms.signerVerifier'), 'Image signer must use only the versioned Cloud KMS signing key.')
check(iamScript.includes('roles/containeranalysis.occurrences.viewer'), 'Supply-chain owner must reread Artifact Analysis occurrences.')
check(
  iamScript.includes('grant_bucket_role image-build-inputs "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" roles/storage.objectViewer'),
  'Image builder must exact-reread the checkpoint-free private build-input bucket.',
)
check(
  iamScript.includes('grant_bucket_role image-build-inputs "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" roles/storage.objectCreator'),
  'Image builder must create the fixed private build-source artifact without object deletion authority.',
)
check(
  /grant_cloud_build_source_bucket_role \\\n+\s+"\$\{REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT\}" roles\/storage\.objectViewer/u.test(iamScript),
  'Image builder must read the submitted Cloud Build source archive without receiving write or delete authority.',
)
check(
  iamScript.includes('grant_bucket_role image-build-inputs "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectCreator')
    && iamScript.includes('grant_bucket_role image-build-inputs "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer'),
  'API image-build owner must create and exact-reread private checkpoint-free build capsules.',
)
check(
  iamScript.includes('grant_bucket_role image-supply-chain-evidence "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" roles/storage.objectCreator'),
  'Dedicated image signer must create only private supply-chain evidence objects.',
)
check(
  iamScript.includes('grant_bucket_role image-supply-chain-evidence "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" roles/storage.bucketViewer'),
  'Dedicated image signer must have only the bucket-metadata visibility required by the Cloud Build artifact uploader.',
)
check(
  iamScript.includes('grant_bucket_role image-supply-chain-evidence "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer'),
  'API supply-chain owner must exact-reread private supply-chain evidence.',
)
check(
  !iamScript.includes('grant_bucket_role image-supply-chain-evidence "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}"')
    && !iamScript.includes('grant_bucket_role image-supply-chain-evidence "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}"'),
  'Image builder and GPU worker must not read or write supply-chain evidence.',
)
check(
  iamScript.includes('grant_bucket_role control-plane-state "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectCreator')
    && iamScript.includes('grant_bucket_role control-plane-state "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer'),
  'API orchestration must create and exact-reread immutable control-plane state.',
)
check(
  iamScript.includes('grant_bucket_role masks "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectCreator')
    && iamScript.includes('grant_bucket_role masks "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer'),
  'API task owner must create and exact-reread private SAM and L4 task objects.',
)
check(
  !iamScript.includes('grant_bucket_role control-plane-state "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}"')
    && !iamScript.includes('grant_bucket_role control-plane-state "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}"'),
  'Build and GPU workers must not read backend control-plane authority state.',
)
check(
  !iamScript.includes('grant_bucket_role model-artifacts "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}"'),
  'Image builder must never read the SAM 3.1 checkpoint bucket.',
)
check(
  iamScript.includes('worker-temp model-artifacts'),
  'GPU runtime must read the private model-artifact bucket.',
)
for (const retiredEnv of [
  'REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT',
  'REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT',
  'REEDITPRO_QA_WORKER_SERVICE_ACCOUNT',
  'REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT',
] as const) check(!iamScript.includes(retiredEnv),
  `${retiredEnv} must not receive fresh IAM grants.`)
check(iamScript.includes('worker-temp previews final-exports qa-artifacts'),
  'The shared GPU identity must own render and QA output creation.')
check(iamScript.includes('analysis-artifacts previews final-exports qa-artifacts'),
  'The shared GPU identity must exact-reread render and QA artifacts.')

for (const workerScriptPath of [
  'scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh',
]) {
  const workerScript = readRepoFile(workerScriptPath)
  check(workerScript.includes('--max-retries=0'), `${workerScriptPath} must leave retries to the canonical package queue.`)
  check(!/--max-retries=[1-9]/u.test(workerScript), `${workerScriptPath} must not configure hidden Cloud Run retries.`)
}

const allScriptText = [...scriptPaths.map(readRepoFile), gcloudCommon].join('\n')
check(!/signed_url/i.test(allScriptText), 'Scripts must not persist signed_url fields.')
check(!/SECRET_VALUE|REAL_SECRET|paste secret/i.test(allScriptText), 'Scripts must not include secret payload prompts or values.')

console.log(JSON.stringify({
  ok: true,
  bucketPurposes: bucketPurposes.length,
  requiredApis: GCP_PRODUCTION_REQUIRED_APIS.length,
  serviceAccounts: GCP_PRODUCTION_SERVICE_ACCOUNTS.length,
  secretPlaceholders: GCP_PRODUCTION_SECRET_PLACEHOLDERS.length,
  cloudRunJobTemplates: GCP_PRODUCTION_CLOUD_RUN_JOBS.length,
  activeQualityFirstGpuRoutes: GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.map((runtime) => ({
    routeId: runtime.routeId,
    runtimeKind: runtime.runtimeKind,
    accelerator: runtime.accelerator,
    minimumIdleInstances: runtime.minimumIdleInstances,
  })),
}, null, 2))
