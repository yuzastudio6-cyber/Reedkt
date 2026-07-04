#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_gcp_iam_role_binding_result_completed_with_blockers_ready_for_docker_image_build_push_plan'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_gcp_foundation_resource_creation_result_completed_with_blockers_ready_for_iam_role_binding_plan'
const SOURCE_HEAD = '06945b26b21802c8de30e451c9945300d75d358e'
const SERVICE_ACCOUNT = 'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const SCRIPT_NAME = 'worker-runtime-jobs:sound-cpu-gcp-iam-role-binding-result:diagnostics'

const DOCS = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-result.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-result',
  },
  register: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-register.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-iam-remaining-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-iam-remaining-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-gcp-iam-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-gcp-iam-claim-policy',
  },
}

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

const parsed = Object.fromEntries(
  Object.entries(DOCS).map(([key, info]) => [key, parseBlock(info.path, info.label)]),
)

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  assert(doc.decision === DECISION, `${key} decision mismatch`)
}

const source = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-gcp-foundation-resource-creation-result.md',
  'worker-runtime-jobs-sound-cpu-gcp-foundation-resource-creation-result',
)
assert(source.decision === SOURCE_DECISION, 'source foundation decision mismatch')
assert(source.result.cpuWorkerServiceAccountExists === true, 'source service account should exist')
assert(source.boundedGoogleCloudMutation.projectLevelIamRolesBound === false, 'source should not claim IAM roles')

const result = parsed.result
assert(result.sourceEvidence.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceEvidence.sourcePr === 2409, 'source PR mismatch')
assert(result.sourceEvidence.sourceMergeCommit === SOURCE_HEAD, 'source merge mismatch')
assert(result.boundedGoogleCloudMutation.serviceAccountEmail === SERVICE_ACCOUNT, 'service account mismatch')
assert(result.boundedGoogleCloudMutation.projectIamRolesBound.includes('roles/logging.logWriter'), 'logging role missing')
assert(result.boundedGoogleCloudMutation.projectIamRolesBound.includes('roles/monitoring.metricWriter'), 'monitoring role missing')
assert(result.boundedGoogleCloudMutation.projectIamRolesBound.length === 2, 'unexpected role count')
for (const key of [
  'storageRolesBound',
  'secretManagerRolesBound',
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
assert(result.result.minimalProjectIamRolesBound === true, 'minimal IAM role result missing')
assert(result.result.soundCpuAnalysisImageExists === false, 'analysis image must remain absent')
assert(result.result.soundAudioMetadataImageExists === false, 'metadata image must remain absent')
assert(result.result.soundCpuAnalysisCloudRunJobExists === false, 'analysis job must remain absent')
assert(result.result.soundAudioMetadataCloudRunJobExists === false, 'metadata job must remain absent')
assert(result.result.allFifteenToolsCloudExecutableNow === false, 'cloud executable readiness must stay false')
assert(result.result.externalBetaReadyNow === false, 'external beta must stay false')

const register = parsed.register
assert(register.serviceAccount === SERVICE_ACCOUNT, 'register service account mismatch')
assert(register.bindings.length === 2, 'register role count mismatch')
assert(register.bindingReadback.rolesLoggingLogWriterPresent === true, 'logging readback missing')
assert(register.bindingReadback.rolesMonitoringMetricWriterPresent === true, 'monitoring readback missing')
assert(register.bindingReadback.unexpectedBroadRolesForCpuWorkerObserved === false, 'broad role readback widened')
for (const role of ['roles/storage.objectViewer', 'roles/secretmanager.secretAccessor', 'roles/run.developer']) {
  assert(register.notBound.includes(role), `missing notBound ${role}`)
}

const blockers = parsed.blockers
assert(blockers.closedByThisGate.includes('cpu_worker_service_account_has_no_project_level_roles'), 'closed IAM blocker missing')
for (const blocker of [
  'sound_cpu_images_not_pushed',
  'sound_cpu_cloud_run_jobs_not_deployed',
  'cloud_run_jobs_not_executed',
  'external_beta_not_ready',
]) {
  assert(blockers.blockingBeforeCloudExecution.some((entry) => entry.blocker === blocker), `missing blocker ${blocker}`)
}

const claims = parsed.claims
assert(claims.allowedClaims.minimalProjectIamRolesBound === true, 'minimal IAM allowed claim missing')
assert(claims.acceptedForToday.loggingWriterIamBinding === 'yes', 'logging binding should be yes')
assert(claims.acceptedForToday.monitoringMetricWriterIamBinding === 'yes', 'monitoring binding should be yes')
for (const [key, value] of Object.entries(claims.acceptedForToday)) {
  if (key === 'serviceAccountCreation') {
    assert(value === 'previous_gate', 'serviceAccountCreation should reference previous gate')
    continue
  }
  if (key === 'loggingWriterIamBinding' || key === 'monitoringMetricWriterIamBinding') continue
  assert(value === 'no', `${key} must stay no`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-image-build-push-plan.md')
assert(promptText.includes(DECISION), 'image prompt missing source decision')
assert(promptText.includes('no Cloud Run execution'), 'image prompt must block Cloud Run execution')
assert(promptText.includes('no Docker run'), 'image prompt must block Docker run')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[SCRIPT_NAME] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-result-diagnostics.mjs',
  'package script missing',
)

console.log(`${SCRIPT_NAME}: ok`)
