#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_read_only_gcp_preflight_completed_with_blockers_ready_for_foundation_resource_creation_plan'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_cloud_worker_runtime_plan_completed_with_warnings_ready_for_cloud_worker_runtime_owner_review_no_deploy'
const SOURCE_HEAD = '7adc9e38fbb5e38c72184837b9e5ceee9d696c2c'
const SCRIPT_NAME = 'worker-runtime-jobs:sound-cpu-read-only-gcp-preflight:diagnostics'

const DOCS = {
  preflight: {
    path: 'docs/worker-runtime-jobs-sound-cpu-read-only-gcp-preflight.md',
    label: 'worker-runtime-jobs-sound-cpu-read-only-gcp-preflight',
  },
  readback: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-resource-readback-register.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-resource-readback-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-preflight-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-preflight-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-preflight-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-preflight-claim-policy',
  },
}

const REQUIRED_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-cloud-worker-runtime-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-cloud-worker-tool-mapping-register.md',
  'docs/worker-runtime-jobs-sound-cpu-cloud-worker-gcp-template-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-gcp-foundation-resource-creation-plan.md',
  'scripts/gcp/prod/09a-deploy-sound-cpu-analysis-worker-job.example.sh',
  'scripts/gcp/prod/09b-deploy-sound-audio-metadata-worker-job.example.sh',
  'server/config/gcp-production-config.ts',
  'package.json',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  assert(existsSync(file), `Missing required file: ${file}`)
  return readFileSync(file, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`)
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`)
}

for (const file of REQUIRED_FILES) read(file)

const parsed = Object.fromEntries(
  Object.entries(DOCS).map(([key, info]) => [key, parseBlock(info.path, info.label)]),
)

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  assert(doc.decision === DECISION, `${key} decision mismatch`)
}

const source = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-cloud-worker-runtime-plan.md',
  'worker-runtime-jobs-sound-cpu-cloud-worker-runtime-plan',
)
assert(source.decision === SOURCE_DECISION, 'source decision mismatch')
assert(source.sourceEvidence.sourceMergeCommit === '96d416eb9a3fb8ad5b023a854e5778b2fd908e05', 'source #2406 input mismatch')
assert(source.cloudWorkerPlanResult.cloudRunJobTemplatesAdded === 2, 'source Cloud Run template count mismatch')

const preflight = parsed.preflight
assert(preflight.sourceEvidence.sourceHead === SOURCE_HEAD, 'preflight source head mismatch')
assert(preflight.sourceEvidence.sourcePr === 2406, 'preflight source PR mismatch')
assert(preflight.sourceEvidence.sourceMergeCommit === SOURCE_HEAD, 'preflight source merge mismatch')
assert(preflight.sourceEvidence.sourceDecision === SOURCE_DECISION, 'preflight source decision mismatch')
assert(preflight.readOnlyPreflight.projectId === 'reeditpro', 'project id mismatch')
assert(preflight.readOnlyPreflight.projectNumber === '390722338345', 'project number mismatch')
assert(preflight.readOnlyPreflight.activeGcloudAccount === 'aiediting@reeditpro.com', 'active account mismatch')
assert(preflight.readOnlyPreflight.region === 'us-central1', 'region mismatch')
assert(preflight.readOnlyPreflight.artifactRepository === 'reeditpro-workers', 'artifact repository mismatch')
assert(preflight.readOnlyPreflight.readOnlyGoogleCloudInspectionCallsExecuted === true, 'read-only GCP preflight not recorded')
for (const key of [
  'googleCloudMutationExecuted',
  'secretManagerMutationExecuted',
  'cloudRunDeploymentExecuted',
  'cloudRunJobExecuted',
  'dockerBuildExecuted',
  'dockerPushExecuted',
  'dockerRunExecuted',
  'workerExecutionEnabled',
  'routeExecutionEnabled',
  'mediaProcessingEnabled',
  'supabaseMutationEnabled',
  'artifactWriteEnabled',
  'externalBetaUnlocked',
  'productionUnlocked',
]) {
  assert(preflight.readOnlyPreflight[key] === false, `${key} must stay false`)
}
assert(preflight.result.gcpProjectAccessible === true, 'project accessibility missing')
assert(preflight.result.requiredCoreApisEnabledForPreflight === true, 'core API readback missing')
assert(preflight.result.artifactRepositoryExists === true, 'artifact repository readback missing')
assert(preflight.result.artifactRepositoryVulnerabilityScanningEnabled === false, 'container scanning must be false')
assert(preflight.result.cpuWorkerServiceAccountExists === false, 'CPU worker service account should be missing')
assert(preflight.result.soundCpuAnalysisImageExists === false, 'analysis image should be missing')
assert(preflight.result.soundAudioMetadataImageExists === false, 'metadata image should be missing')
assert(preflight.result.soundCpuAnalysisCloudRunJobExists === false, 'analysis job should be missing')
assert(preflight.result.soundAudioMetadataCloudRunJobExists === false, 'metadata job should be missing')
assert(preflight.result.allFifteenToolsCloudExecutableNow === false, 'cloud executable must stay false')
assert(preflight.result.externalBetaReadyNow === false, 'external beta must stay false')

const readback = parsed.readback
for (const api of [
  'artifactregistry.googleapis.com',
  'cloudbuild.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'iam.googleapis.com',
  'run.googleapis.com',
  'secretmanager.googleapis.com',
]) {
  assert(readback.enabledApisObserved.includes(api), `missing observed API ${api}`)
}
assert(readback.enabledApisNotObserved.includes('containerscanning.googleapis.com'), 'container scanning API absence missing')
assert(readback.artifactRepository.exists === true, 'artifact repository missing')
assert(readback.artifactRepository.registryUri === 'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers', 'registry URI mismatch')
assert(readback.artifactRepository.vulnerabilityScanningEnablementState === 'SCANNING_DISABLED', 'scanning state mismatch')
assert(readback.serviceAccounts.reeditproCpuWorkerSaExists === false, 'CPU worker SA should be absent')
assert(readback.artifactImages.listResultCount === 0, 'SOUND image count should be zero')
assert(readback.cloudRunJobs.reeditproSoundCpuAnalysisWorkerExists === false, 'analysis Cloud Run job should be absent')
assert(readback.cloudRunJobs.reeditproSoundAudioMetadataWorkerExists === false, 'metadata Cloud Run job should be absent')

const blockers = parsed.blockers
for (const blocker of [
  'project_environment_tag_missing_or_unverified',
  'containerscanning_api_not_enabled',
  'cpu_worker_service_account_missing',
  'sound_cpu_images_not_pushed',
  'sound_cpu_cloud_run_jobs_not_deployed',
  'cloud_run_jobs_not_executed',
  'external_beta_not_ready',
]) {
  assert(blockers.blockingBeforeCloudExecution.some((entry) => entry.blocker === blocker), `missing blocker ${blocker}`)
}
for (const claim of ['cloud_run_ready', 'google_cloud_execution_ready', 'external_beta_ready', 'production_ready']) {
  assert(blockers.notClaimed.includes(claim), `missing notClaimed ${claim}`)
}

const claims = parsed.claims
assert(claims.allowedClaims.readOnlyGcpPreflightCompleted === true, 'read-only preflight claim missing')
assert(claims.allowedClaims.artifactRepositoryExists === true, 'artifact repo claim missing')
assert(claims.allowedClaims.missingServiceAccountIdentified === true, 'missing SA claim missing')
assert(claims.acceptedForToday.readOnlyGoogleCloudInspectionCalls === 'yes', 'read-only GCP inspection should be yes')
assert(claims.acceptedForToday.gcpFoundationResourceCreationPlanning === 'yes', 'foundation planning should be yes')
for (const [key, value] of Object.entries(claims.acceptedForToday)) {
  if (key === 'readOnlyGoogleCloudInspectionCalls' || key === 'gcpFoundationResourceCreationPlanning') continue
  assert(value === 'no', `${key} must stay no`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-gcp-foundation-resource-creation-plan.md')
assert(promptText.includes(DECISION), 'next prompt missing preflight decision')
assert(promptText.includes('reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'), 'next prompt missing service-account blocker')
assert(promptText.includes('no Cloud Run execution'), 'next prompt must block Cloud Run execution')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[SCRIPT_NAME] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-read-only-gcp-preflight-diagnostics.mjs',
  'package diagnostics script missing',
)

for (const file of Object.values(DOCS).map((info) => info.path)) {
  const text = read(file)
  assert(!/"(?:googleCloudMutationExecuted|secretManagerMutationExecuted|cloudRunDeploymentExecuted|cloudRunJobExecuted|dockerBuildExecuted|dockerPushExecuted|dockerRunExecuted|workerExecutionEnabled|routeExecutionEnabled|mediaProcessingEnabled|supabaseMutationEnabled|artifactWriteEnabled|externalBetaUnlocked|productionUnlocked)"\s*:\s*true/.test(text), `${file} widens execution claim`)
  assert(!/generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i.test(text), `${file} claims generated_local_fixture_passed`)
  assert(!/dry_run_passed\s*[:=]\s*(true|passed|ready)/i.test(text), `${file} claims dry_run_passed`)
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  projectId: 'reeditpro',
  region: 'us-central1',
  artifactRepositoryExists: true,
  cpuWorkerServiceAccountExists: false,
  soundCpuImagesExist: false,
  soundCpuCloudRunJobsExist: false,
  googleCloudMutationExecuted: false,
  cloudRunJobExecuted: false,
  externalBetaReadyNow: false,
}, null, 2))
