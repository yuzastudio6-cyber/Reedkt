#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_cloud_worker_runtime_plan_completed_with_warnings_ready_for_cloud_worker_runtime_owner_review_no_deploy'
const SOURCE_HEAD = '96d416eb9a3fb8ad5b023a854e5778b2fd908e05'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_agent_callable_execution_ready_with_warnings'
const SCRIPT_NAME = 'worker-runtime-jobs:sound-cpu-cloud-worker-runtime-plan:diagnostics'

const EXPECTED_TOOLS = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
]

const DIRECT_PACKAGES = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
]

const SOUND_JOBS = [
  {
    jobName: 'reeditpro-sound-cpu-analysis-worker',
    imageName: 'reeditpro-sound-cpu-analysis-worker',
    deployScript: 'scripts/gcp/prod/09a-deploy-sound-cpu-analysis-worker-job.example.sh',
    buildScript: 'scripts/docker/prod/02a-build-sound-cpu-analysis-worker-image.example.sh',
  },
  {
    jobName: 'reeditpro-sound-audio-metadata-worker',
    imageName: 'reeditpro-sound-audio-metadata-worker',
    deployScript: 'scripts/gcp/prod/09b-deploy-sound-audio-metadata-worker-job.example.sh',
    buildScript: 'scripts/docker/prod/02b-build-sound-audio-metadata-worker-image.example.sh',
  },
]

const DOCS = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-worker-runtime-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-worker-runtime-plan',
  },
  mapping: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-worker-tool-mapping-register.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-worker-tool-mapping-register',
  },
  gcp: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-worker-gcp-template-register.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-worker-gcp-template-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-worker-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-worker-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-cloud-worker-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-cloud-worker-claim-policy',
  },
}

const REQUIRED_FILES = [
  'server/config/gcp-production-config.ts',
  'server/smoke/gcp-foundation-config-smoke.ts',
  'server/workers/sound-cpu/Dockerfile',
  'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt',
  'scripts/docker/prod/00-print-image-config.sh',
  'scripts/docker/prod/07-push-images.example.sh',
  'scripts/docker/prod/README.md',
  'scripts/gcp/prod/README.md',
  'docs/google-cloud/production-cloud-run-job-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-cloud-worker-runtime-owner-review.md',
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

function assertNoopSupabase(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`)
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`)
}

function assertClosed(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'unclaimed', `${label} must stay closed`)
}

for (const file of REQUIRED_FILES) read(file)
for (const job of SOUND_JOBS) {
  read(job.deployScript)
  read(job.buildScript)
}

const parsed = Object.fromEntries(
  Object.entries(DOCS).map(([key, info]) => [key, parseBlock(info.path, info.label)]),
)

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  assert(doc.decision === DECISION, `${key} decision mismatch`)
}

const plan = parsed.plan
assert(plan.sourceEvidence.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(plan.sourceEvidence.sourcePr === 2396, 'source PR mismatch')
assert(plan.sourceEvidence.sourceMergeCommit === SOURCE_HEAD, 'source merge commit mismatch')
assert(plan.sourceEvidence.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(plan.cloudWorkerPlanResult.allFifteenToolsMapped === true, '15-tool mapping not marked complete')
assert(plan.cloudWorkerPlanResult.cpuOnlyToolCount === 15, 'CPU tool count mismatch')
assert(plan.cloudWorkerPlanResult.gpuToolCount === 0, 'GPU tool count must be zero')
assert(plan.cloudWorkerPlanResult.cloudRunJobTemplatesAdded === 2, 'Cloud Run template count mismatch')
assert(plan.cloudWorkerPlanResult.dockerImageTemplatesAdded === 2, 'Docker image template count mismatch')
assert(plan.cloudWorkerPlanResult.gcpDeployExampleScriptsAdded === 2, 'GCP deploy example count mismatch')
assert(plan.cloudWorkerPlanResult.dockerBuildExampleScriptsAdded === 2, 'Docker build example count mismatch')
for (const key of [
  'googleCloudApiCallExecuted',
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
  assert(plan.cloudWorkerPlanResult[key] === false, `plan.${key} must stay false`)
}
assertNoopSupabase(plan.supabaseClassification, 'runtime plan')

const mapping = parsed.mapping.toolMapping
assert(mapping.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(mapping.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(mapping.aliasCoveredToolCount === 2, 'alias tool count mismatch')
assert(mapping.serviceAccountKey === 'cpu_analysis_worker', 'service account key mismatch')
assert(mapping.serviceAccountId === 'reeditpro-cpu-worker-sa', 'service account id mismatch')
assert(mapping.sourceDockerfile === 'server/workers/sound-cpu/Dockerfile', 'source Dockerfile mismatch')
assert(mapping.requirementsSource === 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt', 'requirements source mismatch')
assert(mapping.tools.length === 15, 'tool register length mismatch')
for (const tool of EXPECTED_TOOLS) {
  const entry = mapping.tools.find((candidate) => candidate.toolId === tool)
  assert(entry, `missing tool mapping: ${tool}`)
  assert(entry.runtimeLane === 'cpu', `${tool} must be CPU lane`)
  assert(entry.gpuRequired === false, `${tool} must not require GPU`)
  assert(mapping.cpuWorkerTargets.includes(entry.cloudRunTarget), `${tool} mapped to unknown Cloud Run target`)
}
assert(mapping.tools.find((tool) => tool.toolId === 'pydub_effects')?.aliasCoveredBy === 'pydub', 'pydub_effects alias mismatch')
assert(
  mapping.tools.find((tool) => tool.toolId === 'ebu_r128_pyloudnorm')?.aliasCoveredBy === 'pyloudnorm',
  'ebu_r128_pyloudnorm alias mismatch',
)

const gcpTemplates = parsed.gcp.gcpTemplates
assert(gcpTemplates.configFile === 'server/config/gcp-production-config.ts', 'GCP config file mismatch')
assert(gcpTemplates.cloudRunJobs.length === 2, 'GCP job count mismatch')
for (const expected of SOUND_JOBS) {
  const job = gcpTemplates.cloudRunJobs.find((candidate) => candidate.jobName === expected.jobName)
  assert(job, `missing GCP job doc entry: ${expected.jobName}`)
  assert(job.imageName === expected.imageName, `${expected.jobName} image mismatch`)
  assert(job.serviceAccountKey === 'cpu_analysis_worker', `${expected.jobName} service account mismatch`)
  assert(job.cpu === 2, `${expected.jobName} CPU mismatch`)
  assert(job.memory === '4Gi', `${expected.jobName} memory mismatch`)
  assert(job.gpu === 'none', `${expected.jobName} GPU must be none`)
  assert(job.parallelism === 1, `${expected.jobName} parallelism mismatch`)
  assert(job.maxRetries === 0, `${expected.jobName} retry mismatch`)
  assert(job.deployScript === expected.deployScript, `${expected.jobName} deploy script mismatch`)
  assert(gcpTemplates.dockerBuildExamples.includes(expected.buildScript), `${expected.jobName} build script missing from docs`)
}
for (const env of [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0',
  'REEDITPRO_WORKER_EXECUTION_ENABLED=0',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED=0',
  'REEDITPRO_SUPABASE_MUTATION_ENABLED=0',
  'REEDITPRO_ARTIFACT_WRITE_ENABLED=0',
]) {
  assert(gcpTemplates.runtimeDisabledEnvVars.includes(env), `missing disabled env doc: ${env}`)
}

const blockers = parsed.blockers
for (const closed of [
  '15_tool_cpu_vs_gpu_classification',
  'sound_cpu_artifact_registry_image_names',
  'sound_cpu_cloud_run_job_template_names',
  'sound_cpu_deploy_example_script_paths',
  'runtime_disabled_env_var_mapping',
]) {
  assert(blockers.closedForPlanning.includes(closed), `missing planning closure: ${closed}`)
}
for (const gate of [
  'docker_build_for_cloud_image',
  'docker_push_to_artifact_registry',
  'google_cloud_api_calls',
  'cloud_run_job_deployment',
  'cloud_run_job_execution',
  'worker_execution',
  'route_execution',
  'media_processing',
  'supabase_sql_storage',
  'artifact_delivery',
  'external_beta',
  'production',
]) {
  const entry = blockers.stillBlocked.find((candidate) => candidate.gate === gate)
  assert(entry, `missing blocker gate: ${gate}`)
  assert(entry.status.startsWith('blocked_'), `${gate} blocker status widened`)
}
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'cloud_run_ready',
  'worker_ready',
  'runtime_ready',
  'media_ready',
  'external_beta_ready',
  'production_ready',
]) {
  assert(blockers.notClaimed.includes(claim), `missing unclaimed status: ${claim}`)
}

const claims = parsed.claims
assert(claims.allowedClaims.allFifteenToolsClassifiedCpuOnly === true, 'CPU classification claim missing')
assert(claims.allowedClaims.soundCpuCloudRunJobTemplatesExist === true, 'Cloud Run template claim missing')
assert(claims.allowedClaims.soundCpuDeployExamplesExist === true, 'deploy example claim missing')
assert(claims.allowedClaims.runtimeDisabledByDefault === true, 'disabled runtime claim missing')
for (const [key, value] of Object.entries(claims.acceptedForToday)) {
  if (key === 'cloudWorkerRuntimeOwnerReview' || key === 'readOnlyGcpPreflightPlanning') {
    assert(value === 'yes', `${key} should be allowed for next review planning`)
  } else {
    assertClosed(value, `acceptedForToday.${key}`)
  }
}
assertNoopSupabase(claims.supabaseClassification, 'claim policy')

const requirementsText = read('server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt')
for (const pkg of DIRECT_PACKAGES) {
  assert(new RegExp(`^${pkg.replace('_', '[_-]')}==`, 'm').test(requirementsText), `missing pinned package ${pkg}`)
}
assert(
  requirementsText
    .trim()
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#')).length === 13,
  'requirements file must contain 13 direct package pins',
)

const dockerfile = read('server/workers/sound-cpu/Dockerfile')
assert(dockerfile.includes('python:3.13-slim'), 'Dockerfile must use Python 3.13 slim')
assert(dockerfile.includes('requirements.sound-oss-tools.txt'), 'Dockerfile must copy/install SOUND requirements')
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile missing disabled runtime env')
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile missing disabled worker env')
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile missing disabled media env')
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile must use non-root user')
assert(dockerfile.includes('runtime execution is disabled'), 'Dockerfile must fail closed')

const gcpConfig = read('server/config/gcp-production-config.ts')
const smoke = read('server/smoke/gcp-foundation-config-smoke.ts')
for (const expected of SOUND_JOBS) {
  assert(gcpConfig.includes(`name: '${expected.jobName}'`), `GCP config missing job ${expected.jobName}`)
  assert(gcpConfig.includes(`imageName: '${expected.imageName}'`), `GCP config missing image ${expected.imageName}`)
  assert(gcpConfig.includes("serviceAccountKey: 'cpu_analysis_worker'"), `GCP config service account missing for ${expected.jobName}`)
  assert(smoke.includes(expected.jobName), `GCP smoke missing ${expected.jobName}`)
}
assert(!gcpConfig.includes("gpuType: '") || !/reeditpro-sound-[\s\S]{0,500}gpuType: '/.test(gcpConfig), 'SOUND CPU jobs must not request GPU')

const imageConfig = read('scripts/docker/prod/00-print-image-config.sh')
const pushScript = read('scripts/docker/prod/07-push-images.example.sh')
for (const expected of SOUND_JOBS) {
  const buildScript = read(expected.buildScript)
  const deployScript = read(expected.deployScript)
  assert(imageConfig.includes(expected.imageName), `image config missing ${expected.imageName}`)
  assert(buildScript.includes('server/workers/sound-cpu/Dockerfile'), `${expected.buildScript} must use SOUND CPU Dockerfile`)
  assert(buildScript.includes(`image_name ${expected.imageName}`), `${expected.buildScript} must tag ${expected.imageName}`)
  assert(pushScript.includes(`image_name ${expected.imageName}`), `push script missing ${expected.imageName}`)
  assert(deployScript.includes('confirm_prod_action'), `${expected.deployScript} must require production confirmation`)
  assert(deployScript.includes(`run jobs deploy ${expected.jobName}`), `${expected.deployScript} deploy target mismatch`)
  assert(deployScript.includes(`artifact_image ${expected.imageName}`), `${expected.deployScript} image target mismatch`)
  assert(deployScript.includes('${REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT}'), `${expected.deployScript} must use CPU service account`)
  for (const envName of [
    'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0',
    'REEDITPRO_WORKER_EXECUTION_ENABLED=0',
    'REEDITPRO_MEDIA_PROCESSING_ENABLED=0',
    'REEDITPRO_SUPABASE_MUTATION_ENABLED=0',
    'REEDITPRO_ARTIFACT_WRITE_ENABLED=0',
  ]) {
    assert(deployScript.includes(envName), `${expected.deployScript} missing ${envName}`)
  }
  assert(!deployScript.includes('run jobs execute'), `${expected.deployScript} must not execute a Cloud Run job`)
}

const dockerReadme = read('scripts/docker/prod/README.md')
const gcpReadme = read('scripts/gcp/prod/README.md')
const cloudRunPlan = read('docs/google-cloud/production-cloud-run-job-plan.md')
for (const expected of SOUND_JOBS) {
  assert(dockerReadme.includes(expected.imageName), `Docker README missing ${expected.imageName}`)
  assert(gcpReadme.includes(expected.jobName), `GCP README missing ${expected.jobName}`)
  assert(cloudRunPlan.includes(expected.jobName), `Cloud Run plan missing ${expected.jobName}`)
}

const sourceDoc = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness.md',
  'worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-execution-readiness',
)
assert(sourceDoc.decision === SOURCE_DECISION, 'source readiness decision mismatch')
assert(sourceDoc.readiness?.acceptedToolCount === 15, 'source accepted tool count mismatch')
assert(sourceDoc.readiness?.agentCanCallAndExecuteTools === true, 'source agent-call evidence missing')

const promptText = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-cloud-worker-runtime-owner-review.md')
assert(promptText.includes(DECISION), 'owner review prompt missing decision')
assert(promptText.includes('no deploy'), 'owner review prompt must keep no-deploy scope')
assert(promptText.includes('Google Cloud API call'), 'owner review prompt missing no-scope statement')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[SCRIPT_NAME] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-cloud-worker-runtime-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

for (const file of Object.values(DOCS).map((info) => info.path)) {
  const text = read(file)
  assert(!/"(?:dockerBuild|dockerPush|dockerRun|cloudRunDeployment|cloudRunJob|workerExecution|routeExecution|mediaProcessing|supabaseMutation|artifactWrite|externalBeta|production)(?:Enabled|Executed|Unlocked|Ready)?"\s*:\s*true/.test(text), `${file} widens execution claim`)
  assert(!/generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i.test(text), `${file} claims generated_local_fixture_passed`)
  assert(!/dry_run_passed\s*[:=]\s*(true|passed|ready)/i.test(text), `${file} claims dry_run_passed`)
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  sourcePr: 2396,
  soundCpuToolCount: 15,
  directPinnedPackageCount: 13,
  aliasCoveredToolCount: 2,
  cloudRunJobTemplates: SOUND_JOBS.map((job) => job.jobName),
  gpuToolCount: 0,
  googleCloudApiCallExecuted: false,
  cloudRunDeploymentExecuted: false,
  cloudRunJobExecuted: false,
  dockerBuildExecuted: false,
  dockerPushExecuted: false,
  dockerRunExecuted: false,
  externalBetaUnlocked: false,
  productionUnlocked: false,
}, null, 2))
