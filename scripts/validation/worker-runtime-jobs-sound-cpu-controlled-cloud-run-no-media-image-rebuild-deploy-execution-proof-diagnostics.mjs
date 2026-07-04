#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_image_rebuild_deploy_execution_proof_blocked_gcloud_reauth_readback'
const SOURCE_HEAD = 'a1c6fdb13d8c1d7d5259940f688d59ae5996702f'
const FIXED_DIGEST = 'sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366'
const EXECUTION_NAME = 'reeditpro-sound-cpu-analysis-worker-rdxcv'

const DOCS = {
  result: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof',
  ],
  image: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-register',
  ],
  deploy: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-job-deploy-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-job-deploy-register',
  ],
  readback: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-blocker-register',
  ],
  permission: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-permission-fix-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-permission-fix-register',
  ],
  claims: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-claim-policy',
  ],
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseBlock(path, label) {
  const text = read(path)
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON block ${label} in ${path}`)
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
  Object.entries(DOCS).map(([key, [path, label]]) => [key, parseBlock(path, label)]),
)

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  assert(doc.decision === DECISION, `${key} decision mismatch`)
}

assert(parsed.result.sourceEvidence.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(parsed.result.sourceEvidence.entrypointSourcePr === 2415, 'source PR mismatch')
assert(parsed.result.toolScope.toolCount === 15, 'tool count mismatch')
assert(parsed.result.toolScope.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(parsed.result.toolScope.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(parsed.result.result.fixedImageBuildPushPassed === true, 'fixed image build/push not recorded')
assert(parsed.result.result.cloudRunJobsRedeployedToFixedDigest === true, 'job redeploy not recorded')
assert(parsed.result.result.cloudRunExecutionCreated === true, 'execution creation not recorded')
assert(parsed.result.result.cloudRunExecutionName === EXECUTION_NAME, 'execution name mismatch')
assert(parsed.result.result.cloudRunExecutionFinalStateVerified === false, 'execution final state must remain unverified')
assert(parsed.result.result.allFifteenToolsPassedInCloudRun === 'unverified', 'Cloud Run tool pass claim widened')
assert(parsed.result.result.blocker === 'gcloud_noninteractive_reauth_required_before_execution_readback', 'blocker mismatch')

assert(parsed.image.fixedEntrypointImage.digest === FIXED_DIGEST, 'fixed image digest mismatch')
assert(parsed.image.fixedEntrypointImage.buildPushPassed === true, 'fixed build/push missing')
assert(parsed.image.initialEntrypointImage.executionFailed === true, 'initial permission failure missing')
assert(parsed.image.initialEntrypointImage.failure.includes('Permission denied'), 'initial failure reason missing')

assert(parsed.deploy.fixedDigest === FIXED_DIGEST, 'deploy digest mismatch')
assert(parsed.deploy.jobs.length === 2, 'job count mismatch')
for (const job of parsed.deploy.jobs) {
  assert(job.ready === true, `${job.jobName} readiness mismatch`)
  assert(job.image.endsWith(`@${FIXED_DIGEST}`), `${job.jobName} image digest mismatch`)
  assert(job.cpu === '2', `${job.jobName} cpu mismatch`)
  assert(job.memory === '4Gi', `${job.jobName} memory mismatch`)
  assert(job.maxRetries === 0, `${job.jobName} maxRetries mismatch`)
}
for (const [name, value] of Object.entries(parsed.deploy.disabledEnvFlags)) {
  assert(value === '0' || value === 'false', `${name} disabled flag widened`)
}
assert(parsed.deploy.executionPolicy.analysisJobExecutionCreated === EXECUTION_NAME, 'analysis execution mismatch')
assert(parsed.deploy.executionPolicy.metadataJobExecutionCreated === 'no', 'metadata job execution must stay no')
assert(parsed.deploy.executionPolicy.doNotRerunBeforeReadback === true, 'rerun guard missing')

assert(parsed.readback.executionAttempt.executionName === EXECUTION_NAME, 'readback execution mismatch')
assert(parsed.readback.executionAttempt.finalStatusRead === false, 'readback final status widened')
assert(parsed.readback.readbackBlocker.blocker === 'gcloud_noninteractive_reauth_required', 'readback blocker mismatch')
assert(parsed.readback.safeResume.rerunAllowedBeforeReadback === false, 'rerun allowed before readback')

assert(parsed.permission.sourceFile === 'server/workers/sound-cpu/Dockerfile', 'permission source mismatch')
assert(parsed.permission.closedBlocker.blocker === 'non_root_cloud_run_user_cannot_read_copied_runner', 'closed blocker mismatch')
assert(parsed.permission.remainingBlocker.fixedDigest === FIXED_DIGEST, 'remaining blocker digest mismatch')
assert(parsed.permission.scope.dockerfileModified === 'yes', 'Dockerfile modification not recorded')
for (const forbidden of ['workerImplementationChanged', 'routeChanged', 'supabaseChanged', 'sqlChanged', 'mediaChanged']) {
  assert(parsed.permission.scope[forbidden] === 'no', `${forbidden} widened`)
}

assert(parsed.claims.allowedClaims.fixedImageBuildPushed === true, 'fixed image claim missing')
for (const value of Object.values(parsed.claims.forbiddenClaims)) {
  assert(value === 'unclaimed', 'forbidden readiness claim widened')
}
for (const value of Object.values(parsed.claims.closedGates)) {
  assert(value === 'no', 'closed gate widened')
}
assertSupabaseNoop(parsed.claims.supabaseClassification, 'claim policy')

const dockerfile = read('server/workers/sound-cpu/Dockerfile')
assert(
  dockerfile.includes(
    'COPY --chmod=0644 server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt ./requirements.sound-oss-tools.txt',
  ),
  'Dockerfile missing chmod requirements copy',
)
assert(
  dockerfile.includes(
    'COPY --chmod=0644 scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py ./controlled-tool-execution-runner.py',
  ),
  'Dockerfile missing chmod runner copy',
)
assert(dockerfile.includes('CMD ["python", "./controlled-tool-execution-runner.py", "--require-disabled-env"]'), 'Dockerfile CMD mismatch')

const prompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-after-reauth.md',
)
assert(prompt.includes(DECISION), 'reauth prompt missing decision')
assert(prompt.includes(EXECUTION_NAME), 'reauth prompt missing execution name')
assert(prompt.includes('before any rerun'), 'reauth prompt must prohibit rerun before readback')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      fixedDigest: FIXED_DIGEST,
      executionName: EXECUTION_NAME,
      allFifteenToolsPassedInCloudRun: 'unverified',
      blocker: parsed.result.result.blocker,
    },
    null,
    2,
  ),
)
