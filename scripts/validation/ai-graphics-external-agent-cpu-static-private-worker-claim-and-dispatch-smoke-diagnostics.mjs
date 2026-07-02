import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-diagnostics.mjs'
const proofScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'

const proofTools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js']
const falseBooleanKeys = [
  'externalAgentCanSubmitPrivateWorkerQueueNow',
  'agentCanExecuteToolsNow',
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
  'backendQueueSubmissionPerformed',
  'serviceRoleQueueWriteSmokePerformed',
  'liveQueueWritePerformed',
  'workerEnqueuePerformed',
  'workerClaimPerformed',
  'workerDispatchPerformed',
  'workerExecutionPerformed',
  'toolExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
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
        '--execute-ai-graphics-external-agent-cpu-static-worker-claim-and-dispatch-smoke',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        env: {
          ...process.env,
          DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
          REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE:
            '',
          REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV:
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
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-diagnostics.mjs',
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
  'package.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const source = read('server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke.ts')
const proofSource = read('server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts')
const proofCli = read('server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts')
const proofDocs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.json')
const proofMd = read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

for (const phrase of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV',
  'non_production',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
  '--source-service-role-queue-write-smoke-proof-packet',
  '--source-exact-execution-admission-packet',
  '--lease-audit-ref',
  '--output-result',
  'createAiGraphicsToolRuntimeQueueService',
  'createSupabaseAdminClient',
  'enqueueToolRuntimeJobs',
  'claimToolRuntimeJob',
  'recordWorkerEvent',
  'recordAuditEvent',
  'cleanupSmokeRows',
  'workerDispatchHandoffsCreated',
  'workerDispatchLeasesReleased: 5',
  'workerExecutionsPerformed: 0',
  'toolExecutionsPerformed: 0',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(phrase)) fail(`runner_source_missing_phrase:${phrase}`)
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
  if (source.includes(forbidden)) fail(`runner_source_forbidden_phrase:${forbidden}`)
}

for (const toolId of proofTools) {
  if (!source.includes(`'${toolId}'`)) fail(`runner_source_missing_tool:${toolId}`)
}
for (const deferredTool of ['satori', 'echarts', 'three_js', 'pixi_js', 'babylonjs', 'sam2']) {
  if (source.includes(`'${deferredTool}'`)) fail(`runner_source_should_not_name_deferred_tool:${deferredTool}`)
}

const prepared = runPrepared()
if (prepared.decision !== 'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_runner_prepared_with_runtime_blocks') {
  fail(`prepared_decision_mismatch:${prepared.decision}`)
}
if (prepared.status !== 'external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_runner_prepared_not_executed') {
  fail(`prepared_status_mismatch:${prepared.status}`)
}
if (prepared.toolsClaimed !== 5) fail('prepared_tools_claimed_not_5')
if (JSON.stringify([...prepared.toolsClaimedIds].sort()) !== JSON.stringify([...proofTools].sort())) {
  fail('prepared_tool_ids_mismatch')
}
if (prepared.liveWorkerClaimAndDispatchSmokeExecutedNow !== false) {
  fail('prepared_live_claim_dispatch_not_false')
}
if (prepared.liveSupabaseQueueWritesNow !== 0) fail('prepared_live_writes_not_0')
if (prepared.liveWorkerClaimsNow !== 0) fail('prepared_worker_claims_not_0')
if (prepared.liveWorkerDispatchHandoffsNow !== 0) fail('prepared_worker_handoffs_not_0')
for (const key of falseBooleanKeys) {
  if (prepared.booleans?.[key] !== false) fail(`prepared_false_gate_not_false:${key}`)
}
for (const env of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
]) {
  if (!prepared.requiredEnv?.includes(env)) fail(`prepared_missing_env:${env}`)
}
for (const flag of [
  '--execute-ai-graphics-external-agent-cpu-static-worker-claim-and-dispatch-smoke',
  '--source-service-role-queue-write-smoke-proof-packet',
  '--source-exact-execution-admission-packet',
  '--private-evidence-ref',
  '--lease-audit-ref',
  '--output-result',
]) {
  if (!prepared.requiredFlags?.includes(flag)) fail(`prepared_missing_flag:${flag}`)
}

const rejected = runRejectedExecutionProbe()
if (!/REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true/.test(rejected)) {
  fail('execution_probe_missing_confirmation_rejection')
}

if (!proofSource.includes('operatorResultTemplate')) fail('proof_source_missing_operator_template')
if (!proofSource.includes('runnerCommand')) fail('proof_source_missing_runner_command')
if (!proofSource.includes(runScriptName)) fail('proof_source_missing_runner_script_name')
if (!proofCli.includes('## Operator Runner')) fail('proof_cli_missing_operator_runner_markdown')
if (!proofDocs.operatorResultTemplate?.runnerCommand?.includes(runScriptName)) {
  fail('proof_docs_missing_runner_command')
}
if (proofDocs.operatorResultTemplate?.canBeUsedAsAcceptedResultWithoutLiveSmoke !== false) {
  fail('proof_docs_template_accepts_without_live_smoke')
}
if (proofDocs.operatorResultTemplate?.expectedWorkerClaimsCreated !== 5) {
  fail('proof_docs_template_worker_claims_not_5')
}
if (proofDocs.operatorResultTemplate?.expectedWorkerDispatchHandoffsCreated !== 5) {
  fail('proof_docs_template_handoffs_not_5')
}
if (proofDocs.operatorResultTemplate?.expectedWorkerDispatchLeasesReleased !== 5) {
  fail('proof_docs_template_lease_release_not_5')
}
if (!proofDocs.safeCommands?.some((command) => command.includes(diagnosticScriptName))) {
  fail('proof_docs_missing_runner_diagnostic_safe_command')
}
if (!proofMd.includes('## Operator Runner')) fail('proof_md_missing_operator_runner_section')
if (!proofMd.includes(runScriptName)) fail('proof_md_missing_runner_script_name')

const proofOutput = execFileSync(
  'npm',
  ['run', '--silent', proofScriptName, '--', '--print-only'],
  {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  },
)
const proofPrint = JSON.parse(proofOutput)
if (!proofPrint.operatorResultTemplate?.runnerCommand?.includes(runScriptName)) {
  fail('proof_print_missing_runner_command')
}
if (proofPrint.booleans?.agentCanExecuteToolsNow !== false) {
  fail('proof_print_agent_execute_not_false')
}
if (proofPrint.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('proof_print_gpu_start_not_false')
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
  toolsClaimed: prepared.toolsClaimed,
  toolsClaimedIds: prepared.toolsClaimedIds,
  liveWorkerClaimAndDispatchSmokeExecutedNow:
    prepared.liveWorkerClaimAndDispatchSmokeExecutedNow,
  liveSupabaseQueueWritesNow: prepared.liveSupabaseQueueWritesNow,
  liveWorkerClaimsNow: prepared.liveWorkerClaimsNow,
  liveWorkerDispatchHandoffsNow: prepared.liveWorkerDispatchHandoffsNow,
  agentCanExecuteToolsNow: prepared.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: prepared.booleans.gpuRuntimeShouldStartNow,
  proofTemplateRunnerCommandPresent: true,
  packageLockUnchanged: true,
}, null, 2))
