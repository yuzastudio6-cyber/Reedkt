#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_gcp_foundation_resource_creation_result_completed_with_blockers_ready_for_iam_role_binding_plan'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_read_only_gcp_preflight_completed_with_blockers_ready_for_foundation_resource_creation_plan'
const SOURCE_HEAD = '85c5ce26093a52e2751d7da47f4d52c2ae5f2aec'
const SERVICE_ACCOUNT = 'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const SCRIPT_NAME = 'worker-runtime-jobs:sound-cpu-gcp-foundation-resource-creation-result:diagnostics'

const DOCS = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-foundation-resource-creation-result.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-foundation-resource-creation-result',
  },
  serviceAccount: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-service-account-creation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-service-account-creation-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-foundation-remaining-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-foundation-remaining-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-foundation-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-foundation-claim-policy',
  },
}

const REQUIRED_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-read-only-gcp-preflight.md',
  'docs/worker-runtime-jobs-sound-cpu-gcp-preflight-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-cloud-worker-runtime-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-plan.md',
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

const preflight = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-read-only-gcp-preflight.md',
  'worker-runtime-jobs-sound-cpu-read-only-gcp-preflight',
)
assert(preflight.decision === SOURCE_DECISION, 'source preflight decision mismatch')
assert(preflight.result.cpuWorkerServiceAccountExists === false, 'source preflight should show missing service account')
assert(preflight.result.soundCpuAnalysisImageExists === false, 'source preflight should show analysis image absent')
assert(preflight.result.soundAudioMetadataImageExists === false, 'source preflight should show metadata image absent')
assert(preflight.result.soundCpuAnalysisCloudRunJobExists === false, 'source preflight should show analysis job absent')
assert(preflight.result.soundAudioMetadataCloudRunJobExists === false, 'source preflight should show metadata job absent')

const result = parsed.result
assert(result.sourceEvidence.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceEvidence.sourcePr === 2408, 'source PR mismatch')
assert(result.sourceEvidence.sourceMergeCommit === SOURCE_HEAD, 'source merge commit mismatch')
assert(result.sourceEvidence.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.boundedGoogleCloudMutation.projectId === 'reeditpro', 'project mismatch')
assert(result.boundedGoogleCloudMutation.serviceAccountCreated === true, 'service account creation not recorded')
assert(result.boundedGoogleCloudMutation.serviceAccountEmail === SERVICE_ACCOUNT, 'service account email mismatch')
assert(result.boundedGoogleCloudMutation.serviceAccountUniqueId === '102190881435179482338', 'service account unique ID mismatch')
assert(result.boundedGoogleCloudMutation.projectLevelIamRolesBound === false, 'IAM roles must not be claimed bound')
for (const key of [
  'secretManagerValueWritten',
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
  assert(result.boundedGoogleCloudMutation[key] === false, `${key} must stay false`)
}
assert(result.result.cpuWorkerServiceAccountExists === true, 'service account existence not recorded')
assert(result.result.soundCpuAnalysisImageExists === false, 'analysis image must remain absent')
assert(result.result.soundAudioMetadataImageExists === false, 'metadata image must remain absent')
assert(result.result.soundCpuAnalysisCloudRunJobExists === false, 'analysis job must remain absent')
assert(result.result.soundAudioMetadataCloudRunJobExists === false, 'metadata job must remain absent')
assert(result.result.allFifteenToolsCloudExecutableNow === false, 'cloud executable readiness must stay false')
assert(result.result.externalBetaReadyNow === false, 'external beta must stay false')

const serviceAccount = parsed.serviceAccount.serviceAccount
assert(serviceAccount.email === SERVICE_ACCOUNT, 'service-account register email mismatch')
assert(serviceAccount.existsAfterCreation === true, 'service-account register existence missing')
assert(serviceAccount.projectLevelIamRolesBoundAfterCreation === false, 'service-account register must not claim roles')
for (const [key, value] of Object.entries(parsed.serviceAccount.notAllowedByThisGate)) {
  assert(value === false, `${key} must stay false`)
}

const blockers = parsed.blockers
assert(blockers.closedByThisGate.includes('cpu_worker_service_account_missing'), 'closed service-account blocker missing')
for (const blocker of [
  'cpu_worker_service_account_has_no_project_level_roles',
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
assert(claims.allowedClaims.serviceAccountCreated === true, 'service account allowed claim missing')
assert(claims.acceptedForToday.serviceAccountCreation === 'yes', 'service account creation should be accepted')
assert(claims.acceptedForToday.serviceAccountReadback === 'yes', 'service account readback should be accepted')
for (const [key, value] of Object.entries(claims.acceptedForToday)) {
  if (key === 'serviceAccountCreation' || key === 'serviceAccountReadback') continue
  assert(value === 'no', `${key} must stay no`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-plan.md')
assert(promptText.includes(DECISION), 'IAM prompt missing source decision')
assert(promptText.includes(SERVICE_ACCOUNT), 'IAM prompt missing service account')
assert(promptText.includes('no Cloud Run execution'), 'IAM prompt must block Cloud Run execution')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[SCRIPT_NAME] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-gcp-foundation-resource-creation-result-diagnostics.mjs',
  'package script missing',
)

console.log(`${SCRIPT_NAME}: ok`)
