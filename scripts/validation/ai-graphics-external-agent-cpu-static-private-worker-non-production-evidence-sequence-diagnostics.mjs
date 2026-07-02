import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence-diagnostics.mjs'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-evidence-sequence.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-evidence-sequence.md'
const promptResultPath =
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence-results.md'
const implementationPromptPath =
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence.md'

const proofTools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js']
const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'externalAgentCanInvokeAdapterNow',
  'externalAgentCanSubmitPrivateWorkerQueueNow',
  'liveQueueWriteApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'workerEnqueueApprovedNow',
  'workerClaimApprovedNow',
  'workerDispatchApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  try {
    return JSON.parse(read(filePath))
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function runPrepared() {
  const output = execFileSync('npm', ['run', '--silent', runScriptName], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return JSON.parse(output)
}

function runRejectedExecutionProbe() {
  try {
    execFileSync(
      'npm',
      [
        'run',
        '--silent',
        runScriptName,
        '--',
        '--execute-ai-graphics-external-agent-cpu-static-non-production-evidence-sequence',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        env: {
          ...process.env,
          DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
          REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE:
            '',
          REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE:
            '',
          REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE:
            '',
          E2E_RUNTIME_MODE: 'local',
          WORKER_RUNTIME_MODE: 'mock',
        },
        stdio: 'pipe',
      },
    )
    fail('execution_probe_unexpectedly_succeeded')
    return ''
  } catch (error) {
    return `${error.stderr ?? ''}${error.stdout ?? ''}`
  }
}

function runOperatorPreflightProbe() {
  const output = execFileSync(
    'npm',
    ['run', '--silent', runScriptName, '--', '--operator-preflight'],
    {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
        REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE:
          '',
        REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE:
          '',
        REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE:
          '',
        SUPABASE_URL: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        E2E_RUNTIME_MODE: '',
        WORKER_RUNTIME_MODE: '',
      },
      stdio: 'pipe',
    },
  )
  return JSON.parse(output)
}

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence-diagnostics.mjs',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
  outputJsonPath,
  outputMdPath,
  promptResultPath,
  implementationPromptPath,
  'package.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const source = read('server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

for (const phrase of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE_ENV',
  'non_production',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE',
  'WORKER_RUNTIME_MODE',
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke',
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof',
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke',
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof',
  '--print-only',
  '--operator-preflight',
  'assertAcceptedQueueProof',
  'assertAcceptedClaimDispatchProof',
  'buildOperatorPreflightReport',
  'operatorPreflightOnly',
  'canRunEvidenceSequenceNow',
  'missingOrMismatchedEnv',
  'missingFlags',
  'sourcePacketChecks',
  'queue-write-smoke-proof.json',
  'claim-and-dispatch-smoke-proof.json',
  'evidence-sequence-result.json',
  'localOnlySuggestedSequenceResult',
  'evidenceSequenceResultPath',
  'writeJson(sequenceResultPath, sequenceResult)',
  '--write-records',
  outputJsonPath,
  outputMdPath,
  'toolExecutionsPerformed: 0',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(phrase)) fail(`source_missing_phrase:${phrase}`)
}

for (const forbidden of [
  'toolExecutionPerformed: true',
  'workerExecutionApprovedNow: true',
  'toolExecutionApprovedNow: true',
  'gpuRuntimeShouldStartNow: true',
  'publicArtifactCreated: true',
  'signedUrlCreated: true',
  'providerRuntimePerformed: true',
  'browserWebglCanvasRuntimePerformed: true',
  'gpuRuntimePerformed: true',
]) {
  if (source.includes(forbidden)) fail(`source_forbidden_phrase:${forbidden}`)
}

for (const toolId of proofTools) {
  if (!source.includes(`'${toolId}'`)) fail(`source_missing_tool:${toolId}`)
}
for (const deferredTool of ['satori', 'echarts', 'three_js', 'pixi_js', 'babylonjs', 'sam2']) {
  if (source.includes(`'${deferredTool}'`)) fail(`source_should_not_name_deferred_tool:${deferredTool}`)
}

const prepared = runPrepared()
const operatorPreflight = runOperatorPreflightProbe()
const committed = json(outputJsonPath)
const committedMd = read(outputMdPath)
const promptResult = read(promptResultPath)
const implementationPrompt = read(implementationPromptPath)

if (prepared.decision !== 'ai_graphics_external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_with_runtime_blocks') {
  fail(`prepared_decision_mismatch:${prepared.decision}`)
}
if (prepared.status !== 'external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_not_executed') {
  fail(`prepared_status_mismatch:${prepared.status}`)
}
if (prepared.toolsCovered !== 5) fail('prepared_tools_covered_not_5')
if (JSON.stringify([...prepared.toolsCoveredIds].sort()) !== JSON.stringify([...proofTools].sort())) {
  fail('prepared_tool_ids_mismatch')
}
if (committed.decision !== prepared.decision) fail(`committed_decision_mismatch:${committed.decision}`)
if (committed.status !== prepared.status) fail(`committed_status_mismatch:${committed.status}`)
if (committed.toolsCovered !== 5) fail('committed_tools_covered_not_5')
if (JSON.stringify([...(committed.toolsCoveredIds ?? [])].sort()) !== JSON.stringify([...proofTools].sort())) {
  fail('committed_tool_ids_mismatch')
}
if (committed.liveEvidenceSequenceExecutedNow !== false) fail('committed_live_sequence_not_false')
if (committed.liveSupabaseQueueWritesNow !== 0) fail('committed_live_queue_writes_not_0')
if (committed.liveWorkerClaimsNow !== 0) fail('committed_worker_claims_not_0')
if (committed.liveWorkerDispatchHandoffsNow !== 0) fail('committed_worker_handoffs_not_0')
if (committed.toolExecutionsPerformedNow !== 0) fail('committed_tool_executions_not_0')
if (
  committed.localOnlySuggestedSequenceResult !==
  '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence/evidence-sequence-result.json'
) {
  fail('committed_sequence_result_path_mismatch')
}
if (prepared.liveEvidenceSequenceExecutedNow !== false) fail('prepared_live_sequence_not_false')
if (prepared.liveSupabaseQueueWritesNow !== 0) fail('prepared_live_queue_writes_not_0')
if (prepared.liveWorkerClaimsNow !== 0) fail('prepared_worker_claims_not_0')
if (prepared.liveWorkerDispatchHandoffsNow !== 0) fail('prepared_worker_handoffs_not_0')
if (prepared.toolExecutionsPerformedNow !== 0) fail('prepared_tool_executions_not_0')
if (
  prepared.localOnlySuggestedSequenceResult !==
  '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence/evidence-sequence-result.json'
) {
  fail('prepared_sequence_result_path_mismatch')
}
if (operatorPreflight.decision !== 'ai_graphics_external_agent_cpu_static_private_worker_non_production_evidence_sequence_operator_preflight_completed_with_runtime_blocks') {
  fail(`operator_preflight_decision_mismatch:${operatorPreflight.decision}`)
}
if (operatorPreflight.operatorPreflightOnly !== true) fail('operator_preflight_only_not_true')
if (operatorPreflight.canRunEvidenceSequenceNow !== false) {
  fail('operator_preflight_unexpectedly_ready_without_env_or_flags')
}
if (operatorPreflight.liveEvidenceSequenceExecutedNow !== false) {
  fail('operator_preflight_live_sequence_not_false')
}
if (operatorPreflight.liveSupabaseQueueWritesNow !== 0) fail('operator_preflight_live_queue_writes_not_0')
if (operatorPreflight.liveWorkerClaimsNow !== 0) fail('operator_preflight_worker_claims_not_0')
if (operatorPreflight.liveWorkerDispatchHandoffsNow !== 0) {
  fail('operator_preflight_worker_dispatch_handoffs_not_0')
}
if (operatorPreflight.toolExecutionsPerformedNow !== 0) {
  fail('operator_preflight_tool_executions_not_0')
}
if (operatorPreflight.booleans?.agentCanExecuteToolsNow !== false) {
  fail('operator_preflight_agent_execute_not_false')
}
if (operatorPreflight.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('operator_preflight_gpu_start_not_false')
}
for (const expectedMissing of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE',
  'WORKER_RUNTIME_MODE',
]) {
  if (!operatorPreflight.missingOrMismatchedEnv?.includes(expectedMissing)) {
    fail(`operator_preflight_missing_expected_env_blocker:${expectedMissing}`)
  }
}
for (const expectedMissingFlag of [
  '--execute-ai-graphics-external-agent-cpu-static-non-production-evidence-sequence',
  '--workspace-id',
  '--project-id',
  '--approved-plan-snapshot-id',
  '--credit-reservation-id',
  '--idempotency-prefix',
]) {
  if (!operatorPreflight.missingFlags?.includes(expectedMissingFlag)) {
    fail(`operator_preflight_missing_expected_flag_blocker:${expectedMissingFlag}`)
  }
}
if (!Array.isArray(prepared.stages) || prepared.stages.length !== 2) {
  fail('prepared_stages_not_2')
}
if (!Array.isArray(committed.stages) || committed.stages.length !== 2) {
  fail('committed_stages_not_2')
}
for (const key of falseBooleanKeys) {
  if (prepared.booleans?.[key] !== false) fail(`prepared_false_gate_not_false:${key}`)
  if (committed.booleans?.[key] !== false) fail(`committed_false_gate_not_false:${key}`)
}
for (const env of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE=true',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
]) {
  if (!prepared.requiredEnv?.includes(env)) fail(`prepared_missing_env:${env}`)
  if (!committed.requiredEnv?.includes(env)) fail(`committed_missing_env:${env}`)
}

for (const phrase of [
  'queue-write smoke first',
  'worker claim/dispatch smoke',
  'does not execute the sequence',
  'server-only service-role credentials',
  '--operator-preflight',
  'canRunEvidenceSequenceNow',
  'No-Scope',
  'Agent can execute tools now: `false`',
  'Local-only sequence result',
  'evidence-sequence-result.json',
]) {
  if (!committedMd.includes(phrase) && !promptResult.includes(phrase) && !implementationPrompt.includes(phrase)) {
    fail(`committed_docs_missing_phrase:${phrase}`)
  }
}

for (const forbidden of [
  'Agent can execute tools now: `true`',
  '`agentCanExecuteToolsNow=true`',
  '`gpuRuntimeShouldStartNow=true`',
  'runtimeReadyNow=true',
  'externalBetaReadyNow=true',
  'productionReadyNow=true',
]) {
  if (
    committedMd.includes(forbidden) ||
    promptResult.includes(forbidden) ||
    implementationPrompt.includes(forbidden)
  ) {
    fail(`committed_docs_forbidden_phrase:${forbidden}`)
  }
}

const rejected = runRejectedExecutionProbe()
if (!/REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE=true/.test(rejected)) {
  fail('execution_probe_missing_sequence_confirmation_rejection')
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff.trim().length > 0) fail('package_lock_changed')
const tracked = git(['ls-files'])
if (tracked.split('\n').some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_tracked')
}
for (const file of git(['diff', '--name-only']).split('\n').filter(Boolean)) {
  if (/(^|\/)(\.local-artifacts|renders?|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i.test(file)) {
    fail(`generated_artifact_path_changed:${file}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: prepared.decision,
  status: prepared.status,
  toolsCovered: prepared.toolsCovered,
  toolsCoveredIds: prepared.toolsCoveredIds,
  liveEvidenceSequenceExecutedNow: prepared.liveEvidenceSequenceExecutedNow,
  liveSupabaseQueueWritesNow: prepared.liveSupabaseQueueWritesNow,
  liveWorkerClaimsNow: prepared.liveWorkerClaimsNow,
  liveWorkerDispatchHandoffsNow: prepared.liveWorkerDispatchHandoffsNow,
  toolExecutionsPerformedNow: prepared.toolExecutionsPerformedNow,
  agentCanExecuteToolsNow: prepared.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: prepared.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
