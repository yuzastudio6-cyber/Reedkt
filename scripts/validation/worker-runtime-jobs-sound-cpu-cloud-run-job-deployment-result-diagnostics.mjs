#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_cloud_run_job_deployment_result_completed_with_blockers_ready_for_controlled_cloud_run_no_media_execution_proof'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan'
const SOURCE_HEAD = 'f80db3f414fd0b896d357a12ab893f1341d73b11'
const DIGEST = 'sha256:00e534546735201494c980557f89eabfce5dd2c6ecab8103b085cc90a9ec9b1d'
const SCRIPT_NAME = 'worker-runtime-jobs:sound-cpu-cloud-run-job-deployment-result:diagnostics'

const DOCS = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-result.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-result',
  },
  deployment: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-register.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-register',
  },
  architecture: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-run-image-architecture-correction-register.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-run-image-architecture-correction-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-run-job-remaining-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-run-job-remaining-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-run-job-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-run-job-claim-policy',
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
  'docs/worker-runtime-jobs-sound-cpu-docker-image-build-push-result.md',
  'worker-runtime-jobs-sound-cpu-docker-image-build-push-result',
)
assert(source.decision === SOURCE_DECISION, 'source image build/push decision mismatch')
assert(source.result.soundCpuAnalysisImagePushed === true, 'source analysis image push missing')
assert(source.result.soundAudioMetadataImagePushed === true, 'source metadata image push missing')

const result = parsed.result
assert(result.sourceEvidence.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceEvidence.sourcePr === 2413, 'source PR mismatch')
assert(result.sourceEvidence.sourceMergeCommit === SOURCE_HEAD, 'source merge mismatch')
assert(result.boundedGoogleCloudMutation.cloudRunDeploymentExecuted === true, 'deployment should be true')
assert(result.boundedGoogleCloudMutation.dockerBuildExecutedForAmd64Fix === true, 'amd64 build fix should be true')
assert(result.boundedGoogleCloudMutation.dockerPushExecutedForAmd64Fix === true, 'amd64 push fix should be true')
for (const key of [
  'cloudRunJobExecuted',
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
assert(result.deploymentResult.analysisJobReady === true, 'analysis job not ready')
assert(result.deploymentResult.metadataJobReady === true, 'metadata job not ready')
assert(result.deploymentResult.analysisJobExecutionCount === 0, 'analysis execution count widened')
assert(result.deploymentResult.metadataJobExecutionCount === 0, 'metadata execution count widened')
assert(result.imageArchitectureCorrection.initialManifestPlatform === 'linux/arm64', 'initial platform mismatch')
assert(result.imageArchitectureCorrection.correctedTag === 'source-f80db3f41-amd64', 'corrected tag mismatch')
assert(result.imageArchitectureCorrection.correctedDigest === DIGEST, 'corrected digest mismatch')
assert(result.imageArchitectureCorrection.correctedCloudRunReady === true, 'corrected Cloud Run readiness missing')
assert(result.result.allFifteenToolsImageInstalledInCloudRunDigest === true, 'fifteen tool cloud digest claim missing')
assert(result.result.soundCpuAnalysisCloudRunJobExists === true, 'analysis job exists claim missing')
assert(result.result.soundAudioMetadataCloudRunJobExists === true, 'metadata job exists claim missing')
assert(result.result.cloudRunControlledExecutionPassed === false, 'controlled execution claim widened')
assert(result.result.agentCloudToolCallPassed === false, 'agent cloud tool call claim widened')
assert(result.result.externalBetaReadyNow === false, 'external beta claim widened')

const deployment = parsed.deployment
assert(deployment.jobs.length === 2, 'job count mismatch')
for (const job of deployment.jobs) {
  assert(job.ready === true, `${job.jobName} should be ready`)
  assert(job.image.endsWith(`@${DIGEST}`), `${job.jobName} digest mismatch`)
  assert(job.serviceAccount === 'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com', `${job.jobName} service account mismatch`)
  assert(job.cpu === '2', `${job.jobName} CPU mismatch`)
  assert(job.memory === '4Gi', `${job.jobName} memory mismatch`)
  assert(job.taskCount === 1, `${job.jobName} task count mismatch`)
  assert(job.parallelism === 1, `${job.jobName} parallelism mismatch`)
  assert(job.maxRetries === 0, `${job.jobName} max retries mismatch`)
  assert(job.executionCount === 0, `${job.jobName} execution count widened`)
  for (const [name, value] of Object.entries(job.runtimeDisabledEnvFlags)) {
    assert(value === '0' || value === 'false', `${job.jobName} ${name} flag widened`)
  }
}

const architecture = parsed.architecture
assert(architecture.initialFailedDeployment.jobExecuted === false, 'initial failed job should not execute')
assert(architecture.correctedBuildPush.platform === 'linux/amd64', 'corrected platform mismatch')
assert(architecture.correctedBuildPush.provenanceEnabled === false, 'provenance should stay false')
assert(architecture.correctedBuildPush.sbomEnabled === false, 'sbom should stay false')
assert(architecture.correctedBuildPush.digest === DIGEST, 'architecture digest mismatch')
assert(architecture.correctedDeployment.analysisJobReady === true, 'architecture analysis ready missing')
assert(architecture.correctedDeployment.metadataJobReady === true, 'architecture metadata ready missing')
assert(architecture.correctedDeployment.cloudRunJobExecutionStarted === false, 'architecture execution widened')

const blockers = parsed.blockers
assert(blockers.closedByThisGate.includes('sound_cpu_cloud_run_jobs_not_deployed'), 'deployment blocker not closed')
assert(blockers.closedByThisGate.includes('cloud_run_rejected_arm64_image_manifest'), 'manifest blocker not closed')
for (const blocker of [
  'cloud_run_jobs_not_executed',
  'current_dockerfile_cmd_is_fail_closed_runtime_placeholder',
  'agent_cloud_tool_call_not_verified',
  'external_beta_not_ready',
]) {
  assert(blockers.blockingBeforeExternalBeta.some((entry) => entry.blocker === blocker), `missing blocker ${blocker}`)
}

const claims = parsed.claims
assert(claims.allowedClaims.cloudRunJobsDeployed === true, 'Cloud Run deploy allowed claim missing')
assert(claims.allowedClaims.cloudRunJobsReady === true, 'Cloud Run ready allowed claim missing')
assert(claims.acceptedForToday.cloudRunJobDeployment === 'yes', 'deployment accepted claim mismatch')
assert(claims.acceptedForToday.dockerBuildForAmd64Fix === 'yes', 'amd64 build accepted claim mismatch')
assert(claims.acceptedForToday.dockerPushForAmd64Fix === 'yes', 'amd64 push accepted claim mismatch')
for (const [key, value] of Object.entries(claims.acceptedForToday)) {
  if (['cloudRunJobDeployment', 'dockerBuildForAmd64Fix', 'dockerPushForAmd64Fix'].includes(key)) continue
  assert(value === 'no', `${key} must stay no`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-proof.md')
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('fail-closed placeholder'), 'next prompt must require entrypoint preflight')
assert(promptText.includes(DIGEST), 'next prompt missing digest')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[SCRIPT_NAME] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-result-diagnostics.mjs',
  'package script missing',
)

console.log(`${SCRIPT_NAME}: ok`)
