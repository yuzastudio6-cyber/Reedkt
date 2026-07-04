#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_execution_readback_passed_with_warnings_ready_for_agent_cloud_tool_call_proof'
const PREVIOUS_DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_image_rebuild_deploy_execution_proof_blocked_gcloud_reauth_readback'
const SOURCE_HEAD = '2ce15a576eeb0fed92e9f6237cc400fee25307af'
const EXECUTION_NAME = 'reeditpro-sound-cpu-analysis-worker-rdxcv'
const DIGEST = 'sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366'
const TOOLS = [
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

const DOCS = {
  proof: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-proof.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-proof',
  ],
  status: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-status-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-status-register',
  ],
  logs: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-log-summary-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-log-summary-register',
  ],
  tools: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-tool-result-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-tool-result-register',
  ],
  safety: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-runtime-safety-register.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-runtime-safety-register',
  ],
  claims: [
    'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-claim-policy',
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

assert(parsed.proof.sourceEvidence.previousPacketPr === 2417, 'previous PR mismatch')
assert(parsed.proof.sourceEvidence.previousPacketMergeCommit === SOURCE_HEAD, 'source merge commit mismatch')
assert(parsed.proof.sourceEvidence.previousPacketDecision === PREVIOUS_DECISION, 'previous decision mismatch')
assert(parsed.proof.sourceEvidence.closedBlocker === 'gcloud_noninteractive_reauth_required_before_execution_readback', 'closed blocker mismatch')
assert(parsed.proof.executionEvidence.executionName === EXECUTION_NAME, 'execution name mismatch')
assert(parsed.proof.executionEvidence.executionCompleted === true, 'execution must be completed')
assert(parsed.proof.executionEvidence.containerExitCode === 0, 'container exit mismatch')
assert(parsed.proof.executionEvidence.imageDigest === DIGEST, 'image digest mismatch')
assert(parsed.proof.executionEvidence.metadataWorkerExecutionsObserved === 0, 'metadata worker execution widened')
assert(parsed.proof.toolProof.attemptedToolCount === 15, 'attempted tool count mismatch')
assert(parsed.proof.toolProof.passedToolCount === 15, 'passed tool count mismatch')
assert(parsed.proof.toolProof.failedToolCount === 0, 'failed tool count mismatch')
assert(parsed.proof.toolProof.allFifteenToolsPassedInCloudRun === true, '15-tool Cloud Run proof missing')
assert(parsed.proof.toolProof.runnerOk === true, 'runner ok mismatch')
assert(parsed.proof.acceptedForToday.newCloudRunExecutionInThisPacket === 'no', 'new execution claim widened')
assert(parsed.proof.acceptedForToday.metadataWorkerExecution === 'no', 'metadata execution claim widened')
assertSupabaseNoop(parsed.proof.supabaseClassification, 'proof')

assert(parsed.status.execution.executionName === EXECUTION_NAME, 'status execution mismatch')
assert(parsed.status.execution.completedCondition === true, 'completed condition missing')
assert(parsed.status.execution.containerExit === 'exit(0)', 'container exit text mismatch')
assert(parsed.status.jobConfiguration.image.endsWith(`@${DIGEST}`), 'status image digest mismatch')
assert(parsed.status.jobConfiguration.cpu === '2', 'cpu mismatch')
assert(parsed.status.jobConfiguration.memory === '4Gi', 'memory mismatch')
assert(parsed.status.jobConfiguration.maxRetries === 0, 'maxRetries mismatch')
for (const [name, value] of Object.entries(parsed.status.disabledEnvFlags)) {
  assert(value === '0' || value === 'false', `${name} disabled flag widened`)
}
assert(parsed.status.otherJobExecutions.metadataWorkerExecuted === false, 'metadata worker should stay unexecuted')

assert(parsed.logs.logReadback.stdoutJsonParsed === true, 'stdout JSON readback missing')
assert(parsed.logs.runnerSummary.ok === true, 'log runner ok mismatch')
assert(parsed.logs.runnerSummary.attemptedToolCount === 15, 'log attempted tool count mismatch')
assert(parsed.logs.runnerSummary.failedToolCount === 0, 'log failed tool count mismatch')
for (const [name, value] of Object.entries(parsed.logs.sideEffects)) {
  assert(value === false, `${name} side effect widened`)
}

assert(parsed.tools.toolCounts.attempted === 15, 'tool register attempted mismatch')
assert(parsed.tools.toolCounts.passed === 15, 'tool register passed mismatch')
assert(parsed.tools.toolCounts.failed === 0, 'tool register failed mismatch')
const actualTools = parsed.tools.tools.map((tool) => tool.toolId)
assert(JSON.stringify(actualTools) === JSON.stringify(TOOLS), 'tool order or ids mismatch')
for (const tool of parsed.tools.tools) {
  assert(tool.passed === true, `${tool.toolId} did not pass`)
  assert(typeof tool.version === 'string' && tool.version.length > 0, `${tool.toolId} version missing`)
}

for (const [name, value] of Object.entries(parsed.safety.closedScopes)) {
  assert(value === 'no', `${name} closed scope widened`)
}
assert(parsed.safety.runtimeClaims.allFifteenToolsCloudRunProof === 'passed', 'tool proof claim missing')
for (const [name, value] of Object.entries(parsed.safety.runtimeClaims)) {
  if (name !== 'allFifteenToolsCloudRunProof') {
    assert(value === 'unclaimed' || value === 'not_yet_proven', `${name} readiness claim widened`)
  }
}

assert(parsed.claims.allowedClaims.previousGcloudReadbackBlockerClosed === true, 'blocker closure claim missing')
assert(parsed.claims.allowedClaims.allFifteenToolsPassedInCloudRunNoMediaProof === true, '15-tool allowed claim missing')
for (const value of Object.values(parsed.claims.forbiddenClaims)) {
  assert(value === 'unclaimed', 'forbidden claim widened')
}
assertSupabaseNoop(parsed.claims.supabaseClassification, 'claims')

const previousProof = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof.md',
  'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof',
)
assert(previousProof.decision === PREVIOUS_DECISION, 'previous blocker decision changed unexpectedly')
assert(previousProof.result.cloudRunExecutionName === EXECUTION_NAME, 'previous execution mismatch')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-proof.md')
assert(prompt.includes(DECISION), 'next prompt missing source decision')
assert(prompt.includes('no-media') || prompt.includes('no media'), 'next prompt missing no-media boundary')
assert(prompt.includes('Stop instead of forcing'), 'next prompt missing stop guard')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-cloud-run-no-media-execution-readback-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-proof-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      executionName: EXECUTION_NAME,
      attemptedToolCount: 15,
      passedToolCount: 15,
      failedToolCount: 0,
      metadataWorkerExecuted: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-AGENT-CLOUD-TOOL-CALL-PROOF',
    },
    null,
    2,
  ),
)
