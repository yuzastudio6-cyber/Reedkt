#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_audioflux_dockerfile_pip_readiness_reconciliation_completed_with_warnings_ready_for_launch_core_readiness_recheck_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_dockerfile_backed_readiness_reconciliation_completed_with_warnings_ready_for_launch_core_dependency_readiness_recheck_no_media_no_production'
const RUNTIME_DEPENDENCY_OWNER_DECISION =
  'worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_owner_review_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation_refresh'
const SOURCE_HEAD = '83651c9aeababdacd6604967a7c77e7f47e94ec7'
const RUNNER_PATH = 'server/workers/production-readiness/production-tool-readiness-runner.ts'
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile'
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-READINESS-RECHECK-AFTER-AUDIOFLUX-DOCKERFILE-PIP-RECONCILIATION'

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-reconciliation',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-tool-register.md',
    label: 'worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-tool-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-blocker-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-blocker-delta-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-audioflux-dockerfile-pip-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-audioflux-dockerfile-pip-reconciliation',
  },
}

const FALSE_FIELDS = [
  'toolCallProofPassedByThisChange',
  'mediaPolicyClosedByThisChange',
  'runtimePolicyClosedByThisChange',
  'productionReadinessUnlockedByThisChange',
  'acceptedForToolCallExecutionToday',
  'acceptedForWorkerExecutionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForProductionToday',
  'realUserMediaBetaUnlocked',
  'paidProductionUnlocked',
  'audiofluxImportExecuted',
  'audiofluxToolCallReady',
  'audiofluxWorkerExecutionReady',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'ffmpegMediaExecution',
  'ffprobeMediaExecution',
  'modelWeightsDownloaded',
  'artifactCreation',
  'supabaseMutation',
  'sqlExecution',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function parseBlock(info) {
  const text = read(info.path)
  const marker = '```json ' + info.label
  const start = text.indexOf(marker)
  assert(start >= 0, `${info.path} missing fenced JSON label ${info.label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${info.path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function scanFalse(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FALSE_FIELDS.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must be false`)
    scanFalse(child, trail.concat(key))
  }
}

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-dockerfile-backed-readiness-reconciliation.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'required Dockerfile-backed source decision missing')
const runtimeDependencyDoc = read('docs/worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-review.md')
assert(runtimeDependencyDoc.includes(RUNTIME_DEPENDENCY_OWNER_DECISION), 'runtime dependency source-fix owner decision missing')

const dockerfile = read(DOCKERFILE_PATH)
assert(dockerfile.includes('server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'), 'Dockerfile requirements copy missing')
assert(dockerfile.includes('pip install --no-cache-dir --requirement ./requirements.sound-oss-tools.txt'), 'Dockerfile pip install missing')
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'media disabled flag missing')

const requirements = read(REQUIREMENTS_PATH)
assert(requirements.split(/\r?\n/).map((line) => line.trim()).includes('audioflux==0.1.9'), 'AudioFlux requirement missing')

const runner = read(RUNNER_PATH)
for (const marker of [
  "const soundCpuControlledRequirementsPath = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt'",
  'dockerfileBackedPythonRequirementPackages',
  "['audioflux', 'audioflux==0.1.9']",
  'buildDockerfilePipBackedToolSet',
  'dockerfilePipStaticReviewClosedToolIds',
  'SOUND CPU Dockerfile pip requirements declaration, controlled install/import proof, and source-fix owner review passed',
]) {
  assert(runner.includes(marker), `runner missing marker ${marker}`)
}

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  if (name !== 'prompt') {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
    assert(doc.decision === DECISION, `${name} decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, name)
  }
  scanFalse(doc, [name])
}

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(reconciliation.sourceBase.dockerfileBackedReadinessPr === 1534, 'source PR mismatch')
assert(reconciliation.sourceBase.dockerfileBackedReadinessDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.reconciliation.runnerPath === RUNNER_PATH, 'runner path mismatch')
assert(reconciliation.reconciliation.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch')
assert(reconciliation.reconciliation.requirementsPath === REQUIREMENTS_PATH, 'requirements path mismatch')
assert(reconciliation.reconciliation.recognizedTool === 'audioflux', 'recognized tool mismatch')
assert(reconciliation.reconciliation.recognizedRequirement === 'audioflux==0.1.9', 'recognized requirement mismatch')
assert(reconciliation.reconciliation.statusTransition === 'missing_to_warning_for_static_dry_run_only', 'status transition mismatch')
assert(reconciliation.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const row = parsed.tools.toolRegister[0]
assert(row.toolId === 'audioflux', 'tool row mismatch')
assert(row.previousDryRunStatus === 'missing', 'previous status mismatch')
assert(row.newDryRunStatus === 'warning', 'new status mismatch')
assert(row.requiredRequirementLine === 'audioflux==0.1.9', 'required requirement mismatch')

const blockers = parsed.blockers
assert(blockers.closedStaticFalseMissingBlockers.includes('audioflux_dockerfile_pip_requirement_not_reflected_in_dry_run_readiness'), 'closed AudioFlux blocker missing')
assert(blockers.stillBlocked.includes('signalsmith_stretch_launch_core_missing'), 'Signalsmith blocker must remain')
assert(blockers.expectedReadinessDelta.hardBlockerReductionFromFalseMissingStaticReadiness === 3, 'expected hard blocker delta mismatch')

assert(parsed.claims.allowedClaims.audiofluxDockerfilePipStaticEvidenceRecognized === true, 'allowed claim missing')
assert(parsed.claims.blockedClaims.audiofluxImportExecuted === false, 'AudioFlux import must remain false')

const prompt = parsed.prompt
assert(prompt.owner === 'WORKER_RUNTIME_JOBS', 'prompt owner mismatch')
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.expectedInputs.tool === 'audioflux', 'prompt tool mismatch')
assert(prompt.expectedInputs.expectedDryRunStatus === 'warning', 'prompt expected status mismatch')
assert(prompt.scope.blocked.includes('AudioFlux import'), 'prompt import boundary missing')
assert(prompt.scope.blocked.includes('media processing'), 'prompt media boundary missing')
assert(prompt.scope.blocked.includes('beta or production unlock'), 'prompt beta/production boundary missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-audioflux-dockerfile-pip-readiness-reconciliation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-audioflux-dockerfile-pip-readiness-reconciliation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      dockerfilePath: DOCKERFILE_PATH,
      requirementsPath: REQUIREMENTS_PATH,
      tool: 'audioflux',
      statusTransition: 'missing_to_warning_for_static_dry_run_only',
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
