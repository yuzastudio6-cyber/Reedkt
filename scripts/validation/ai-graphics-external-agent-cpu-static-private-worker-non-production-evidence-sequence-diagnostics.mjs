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

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence-diagnostics.mjs',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
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
  'assertAcceptedQueueProof',
  'assertAcceptedClaimDispatchProof',
  'queue-write-smoke-proof.json',
  'claim-and-dispatch-smoke-proof.json',
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
if (prepared.liveEvidenceSequenceExecutedNow !== false) fail('prepared_live_sequence_not_false')
if (prepared.liveSupabaseQueueWritesNow !== 0) fail('prepared_live_queue_writes_not_0')
if (prepared.liveWorkerClaimsNow !== 0) fail('prepared_worker_claims_not_0')
if (prepared.liveWorkerDispatchHandoffsNow !== 0) fail('prepared_worker_handoffs_not_0')
if (prepared.toolExecutionsPerformedNow !== 0) fail('prepared_tool_executions_not_0')
if (!Array.isArray(prepared.stages) || prepared.stages.length !== 2) {
  fail('prepared_stages_not_2')
}
for (const key of falseBooleanKeys) {
  if (prepared.booleans?.[key] !== false) fail(`prepared_false_gate_not_false:${key}`)
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
