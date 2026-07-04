#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_agent_cloud_tool_call_proof_passed_with_warnings_ready_for_external_beta_blocker_reconciliation'
const PREVIOUS_DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_execution_readback_passed_with_warnings_ready_for_agent_cloud_tool_call_proof'
const SOURCE_HEAD = '65da0a9d7117fcb6bc05c238795d815a40a14b44'
const EXECUTION_NAME = 'reeditpro-sound-cpu-analysis-worker-k64rf'
const IMAGE_DIGEST = 'sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366'
const TOOLS = [
  ['librosa', 'librosa', '0.11.0'],
  ['audioread', 'audioread', '3.1.0'],
  ['pydub', 'pydub', '0.25.1'],
  ['scipy', 'scipy', '1.17.1'],
  ['resampy', 'resampy', '0.4.3'],
  ['pyloudnorm', 'pyloudnorm', '0.2.0'],
  ['audioflux', 'audioflux', '0.1.9'],
  ['music21', 'music21', '10.3.0'],
  ['pretty_midi', 'pretty_midi', '0.2.11'],
  ['mido', 'mido', '1.3.3'],
  ['noisereduce', 'noisereduce', '3.0.3'],
  ['pedalboard', 'pedalboard', '0.9.23'],
  ['mir_eval', 'mir_eval', '0.8.2'],
  ['pydub_effects', 'pydub', '0.25.1'],
  ['ebu_r128_pyloudnorm', 'pyloudnorm', '0.2.0'],
]

const DOCS = {
  proof: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-proof.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-proof',
  ],
  envelope: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-envelope-register.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-envelope-register',
  ],
  execution: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-execution-register.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-execution-register',
  ],
  logs: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-log-summary-register.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-log-summary-register',
  ],
  tools: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-tool-result-register.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-tool-result-register',
  ],
  safety: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-runtime-safety-register.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-runtime-safety-register',
  ],
  claims: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-claim-policy',
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

assert(parsed.proof.sourceEvidence.previousPacketPr === 2419, 'previous PR mismatch')
assert(parsed.proof.sourceEvidence.previousPacketMergeCommit === SOURCE_HEAD, 'source merge commit mismatch')
assert(parsed.proof.sourceEvidence.previousPacketDecision === PREVIOUS_DECISION, 'previous decision mismatch')
assert(parsed.proof.agentEnvelopeEvidence.selfTestStatus === 'passed', 'agent envelope self-test must pass')
assert(parsed.proof.agentEnvelopeEvidence.invocationCount === 4, 'agent invocation count mismatch')
assert(parsed.proof.agentEnvelopeEvidence.acceptedInvocationCount === 4, 'accepted invocation count mismatch')
assert(parsed.proof.agentEnvelopeEvidence.acceptedToolCountPerInvocation === 15, 'tool descriptor count mismatch')
assert(parsed.proof.cloudInvocationEvidence.executionName === EXECUTION_NAME, 'cloud execution name mismatch')
assert(parsed.proof.cloudInvocationEvidence.executionCompleted === true, 'cloud execution did not complete')
assert(parsed.proof.cloudInvocationEvidence.succeededCount === 1, 'cloud execution succeeded count mismatch')
assert(parsed.proof.cloudInvocationEvidence.imageDigest === IMAGE_DIGEST, 'image digest mismatch')
assert(parsed.proof.cloudInvocationEvidence.metadataWorkerExecutionsObserved === 0, 'metadata worker execution widened')
assert(parsed.proof.toolProof.attemptedToolCount === 15, 'attempted tool count mismatch')
assert(parsed.proof.toolProof.passedToolCount === 15, 'passed tool count mismatch')
assert(parsed.proof.toolProof.failedToolCount === 0, 'failed tool count mismatch')
assert(parsed.proof.toolProof.allFifteenToolsPassedInCloudRun === true, 'all 15 tool proof missing')
assert(parsed.proof.acceptedForToday.controlledCloudRunJobExecution === 'yes_no_media_no_artifact_boundary', 'cloud execution claim mismatch')
for (const [name, value] of Object.entries(parsed.proof.acceptedForToday)) {
  if (!['syntheticAgentEnvelopeValidation', 'controlledCloudRunJobExecution', 'cloudRunLogReadback'].includes(name)) {
    assert(value === 'no', `${name} accepted scope widened`)
  }
}
assertSupabaseNoop(parsed.proof.supabaseClassification, 'proof')

assert(parsed.envelope.adapter.selfTestStatus === 'passed', 'envelope self-test mismatch')
assert(parsed.envelope.adapter.invocationCount === 4, 'envelope invocation count mismatch')
assert(parsed.envelope.adapter.acceptedInvocationCount === 4, 'envelope accepted count mismatch')
assert(parsed.envelope.adapter.toolDescriptorCountPerInvocation === 15, 'envelope tool count mismatch')
assert(parsed.envelope.acceptedWorkers.length === 2, 'worker count mismatch')
assert(parsed.envelope.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.envelope.acceptedJobTypes.length === 4, 'job type count mismatch')
for (const value of Object.values(parsed.envelope.syntheticBoundary)) {
  if (typeof value === 'boolean' && value !== true) assert(value === false, 'synthetic boundary boolean widened')
}
assert(parsed.envelope.syntheticBoundary.syntheticOrNoMediaInput === true, 'synthetic input flag missing')
for (const field of ['rawPrompt', 'signedUrl', 'publicArtifactUrl', 'serviceRolePayload', 'sqlStatement']) {
  assert(parsed.envelope.rejectedPayloadFields.includes(field), `${field} rejection missing`)
}

assert(parsed.execution.execution.executionName === EXECUTION_NAME, 'execution register name mismatch')
assert(parsed.execution.execution.executionCompleted === true, 'execution register completion missing')
assert(parsed.execution.execution.maxRetries === 0, 'maxRetries widened')
assert(parsed.execution.jobConfiguration.image.endsWith(`@${IMAGE_DIGEST}`), 'execution image digest mismatch')
assert(parsed.execution.jobConfiguration.cpu === '2', 'cpu mismatch')
assert(parsed.execution.jobConfiguration.memory === '4Gi', 'memory mismatch')
for (const [name, value] of Object.entries(parsed.execution.disabledEnvFlags)) {
  assert(value === '0' || value === 'false', `${name} disabled flag widened`)
}
assert(parsed.execution.otherJobExecutions.metadataWorkerExecuted === false, 'metadata worker should stay unexecuted')
assert(parsed.execution.otherJobExecutions.metadataWorkerExecutionsObserved === 0, 'metadata execution count widened')

assert(parsed.logs.logReadback.stdoutJsonParsed === true, 'stdout readback missing')
assert(parsed.logs.runnerSummary.ok === true, 'runner ok mismatch')
assert(parsed.logs.runnerSummary.attemptedToolCount === 15, 'log attempted count mismatch')
assert(parsed.logs.runnerSummary.passedToolCount === 15, 'log passed count mismatch')
assert(parsed.logs.runnerSummary.failedToolCount === 0, 'log failed count mismatch')
for (const [name, value] of Object.entries(parsed.logs.sideEffects)) {
  assert(value === false, `${name} side effect widened`)
}

assert(parsed.tools.toolCounts.attempted === 15, 'tool attempted count mismatch')
assert(parsed.tools.toolCounts.passed === 15, 'tool passed count mismatch')
assert(parsed.tools.toolCounts.failed === 0, 'tool failed count mismatch')
assert(parsed.tools.tools.length === TOOLS.length, 'tool array length mismatch')
for (const [index, [toolId, packageName, version]] of TOOLS.entries()) {
  const tool = parsed.tools.tools[index]
  assert(tool.toolId === toolId, `${toolId} order mismatch`)
  assert(tool.package === packageName, `${toolId} package mismatch`)
  assert(tool.version === version, `${toolId} version mismatch`)
  assert(tool.passed === true, `${toolId} did not pass`)
}

for (const [name, value] of Object.entries(parsed.safety.closedScopes)) {
  assert(value === 'no', `${name} closed scope widened`)
}
assert(parsed.safety.runtimeClaims.agentCloudToolCallProof === 'passed', 'agent cloud proof claim missing')
assert(parsed.safety.runtimeClaims.allFifteenToolsCloudRunProof === 'passed', '15-tool proof claim missing')
for (const [name, value] of Object.entries(parsed.safety.runtimeClaims)) {
  if (!['agentCloudToolCallProof', 'allFifteenToolsCloudRunProof'].includes(name)) {
    assert(value === 'unclaimed', `${name} readiness claim widened`)
  }
}

for (const value of Object.values(parsed.claims.allowedClaims)) {
  assert(value === true, 'allowed claim should be true evidence')
}
for (const value of Object.values(parsed.claims.forbiddenClaims)) {
  assert(value === 'unclaimed', 'forbidden claim widened')
}
assertSupabaseNoop(parsed.claims.supabaseClassification, 'claims')

const previous = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-proof.md',
  'worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-proof',
)
assert(previous.decision === PREVIOUS_DECISION, 'previous readback decision changed')
assert(previous.executionEvidence.executionName === 'reeditpro-sound-cpu-analysis-worker-rdxcv', 'previous execution changed')
assert(previous.toolProof.passedToolCount === 15, 'previous 15-tool pass missing')

const nextPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-agent-cloud-proof.md',
)
assert(nextPrompt.includes(DECISION), 'next prompt missing source decision')
assert(nextPrompt.includes('no beta unlock'), 'next prompt must preserve no beta unlock')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-agent-cloud-tool-call-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-proof-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      executionName: EXECUTION_NAME,
      agentEnvelopeAccepted: true,
      attemptedToolCount: 15,
      passedToolCount: 15,
      failedToolCount: 0,
      metadataWorkerExecuted: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-EXTERNAL-BETA-BLOCKER-RECONCILIATION-AFTER-AGENT-CLOUD-PROOF',
    },
    null,
    2,
  ),
)
