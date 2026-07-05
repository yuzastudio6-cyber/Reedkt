import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-diagnostics.mjs'

const proofTools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js']
const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'serviceRoleQueueWriteSmokeApprovedNow',
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
  'serviceRoleQueueWriteSmokePerformed',
  'backendQueueSubmissionPerformed',
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

function runOperatorPreflightProbe() {
  const output = execFileSync('npm', ['run', '--silent', runScriptName, '--', '--operator-preflight'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE: '',
      REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      E2E_RUNTIME_MODE: '',
      WORKER_RUNTIME_MODE: '',
    },
  })
  return JSON.parse(output)
}

function runPlaceholderOperatorPreflightProbe() {
  const output = execFileSync(
    'npm',
    [
      'run',
      '--silent',
      runScriptName,
      '--',
      '--operator-preflight',
      '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
      '--source-non-production-service-role-queue-write-smoke-preflight-packet',
      'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
      '--workspace-id',
      '<non-production-workspace-id>',
      '--project-id',
      '<non-production-project-id>',
      '--approved-plan-snapshot-id',
      '<approved-plan-snapshot-id>',
      '--credit-reservation-id',
      '<credit-reservation-id>',
      '--idempotency-prefix',
      '<unique-smoke-prefix>',
      '--service-role-boundary-ref',
      '<service-role-boundary-ref>',
      '--private-evidence-ref',
      '<private-evidence-ref>',
      '--telemetry-ref',
      '<telemetry-ref>',
      '--cleanup-proof-ref',
      '<cleanup-proof-ref>',
      '--rollback-ref',
      '<rollback-ref>',
      '--output-result',
      '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json',
    ],
    {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
        REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE:
          'true',
        REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV:
          'non_production',
        SUPABASE_URL: 'https://non-production.supabase.example',
        SUPABASE_SERVICE_ROLE_KEY: 'non-production-service-role-placeholder',
        E2E_RUNTIME_MODE: 'local',
        WORKER_RUNTIME_MODE: 'mock',
      },
    },
  )
  return JSON.parse(output)
}

function runPlaceholderEnvOperatorPreflightProbe() {
  const output = execFileSync(
    'npm',
    [
      'run',
      '--silent',
      runScriptName,
      '--',
      '--operator-preflight',
      '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
      '--source-non-production-service-role-queue-write-smoke-preflight-packet',
      'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
      '--workspace-id',
      'workspace-smoke-nonprod-0001',
      '--project-id',
      'project-smoke-nonprod-0001',
      '--approved-plan-snapshot-id',
      'approved-snapshot-smoke-nonprod-0001',
      '--credit-reservation-id',
      'credit-reservation-smoke-nonprod-0001',
      '--idempotency-prefix',
      'ai_graphics_smoke_nonprod_0001',
      '--service-role-boundary-ref',
      'service-role-boundary://ai-graphics/non-production-smoke',
      '--private-evidence-ref',
      'private://ai-graphics/non-production-smoke/evidence.json',
      '--telemetry-ref',
      'private://ai-graphics/non-production-smoke/telemetry.json',
      '--cleanup-proof-ref',
      'private://ai-graphics/non-production-smoke/cleanup.json',
      '--rollback-ref',
      'private://ai-graphics/non-production-smoke/rollback.md',
      '--output-result',
      '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json',
    ],
    {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
        REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE:
          'true',
        REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV:
          'non_production',
        SUPABASE_URL: 'https://non-production.supabase.example',
        SUPABASE_SERVICE_ROLE_KEY: 'non-production-service-role-placeholder',
        E2E_RUNTIME_MODE: 'local',
        WORKER_RUNTIME_MODE: 'mock',
      },
    },
  )
  return JSON.parse(output)
}

function runRejectedExecutionProbe() {
  try {
    execFileSync('npm', ['run', '--silent', runScriptName, '--', '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke'], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
        REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE: '',
        REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV: '',
        E2E_RUNTIME_MODE: 'local',
        WORKER_RUNTIME_MODE: 'mock',
      },
      stdio: 'pipe',
    })
    fail('execution_probe_unexpectedly_succeeded')
    return ''
  } catch (error) {
    return `${error.stderr ?? ''}${error.stdout ?? ''}`
  }
}

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-diagnostics.mjs',
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts',
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json',
  'package.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const source = read('server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke.ts')
const proofSource = read('server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts')
const proofDocs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

for (const phrase of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV',
  'non_production',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
  '--source-non-production-service-role-queue-write-smoke-preflight-packet',
  '--output-result',
  '--operator-preflight',
  'buildOperatorPreflightReport',
  'operatorPreflightOnly',
  'canRunQueueWriteSmokeNow',
  'missingOrMismatchedEnv',
  'missingFlags',
  'invalidFlagValues',
  'invalidEnvValues',
  'assertRuntimeFlagValues',
  'assertRuntimeEnvValues',
  'envValueRejection',
  'sourcePreflightChecks',
  'createAiGraphicsToolRuntimeQueueService',
  'createSupabaseAdminClient',
  'enqueueToolRuntimeJobs',
  'cleanupSmokeRows',
  'workerClaimsCreated: 0',
  'workerDispatchesPerformed: 0',
  'toolExecutionsPerformed: 0',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(phrase)) fail(`runner_source_missing_phrase:${phrase}`)
}

for (const forbidden of [
  'claimToolRuntimeJob(',
  'recordWorkerEvent(',
  'toolExecutionPerformed: true',
  'workerDispatchPerformed: true',
  'gpuRuntimeShouldStartNow: true',
  'publicArtifactCreated: true',
  'signedUrlCreated: true',
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
if (prepared.decision !== 'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_runner_prepared_with_runtime_blocks') {
  fail(`prepared_decision_mismatch:${prepared.decision}`)
}
if (prepared.status !== 'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_runner_prepared_not_executed') {
  fail(`prepared_status_mismatch:${prepared.status}`)
}
if (prepared.toolsSubmitted !== 5) fail('prepared_tools_submitted_not_5')
if (JSON.stringify([...prepared.toolsSubmittedIds].sort()) !== JSON.stringify([...proofTools].sort())) {
  fail('prepared_tool_ids_mismatch')
}
if (prepared.liveServiceRoleQueueWriteSmokeExecutedNow !== false) {
  fail('prepared_live_smoke_not_false')
}
if (prepared.liveSupabaseQueueWritesNow !== 0) fail('prepared_live_writes_not_0')
if (prepared.operatorPreflightFlag !== '--operator-preflight') {
  fail('prepared_missing_operator_preflight_flag')
}
for (const key of falseBooleanKeys) {
  if (prepared.booleans?.[key] !== false) fail(`prepared_false_gate_not_false:${key}`)
}
for (const env of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
]) {
  if (!prepared.requiredEnv?.includes(env)) fail(`prepared_missing_env:${env}`)
}
for (const flag of [
  '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
  '--source-non-production-service-role-queue-write-smoke-preflight-packet',
  '--private-evidence-ref',
  '--output-result',
]) {
  if (!prepared.requiredFlags?.includes(flag)) fail(`prepared_missing_flag:${flag}`)
}

const operatorPreflight = runOperatorPreflightProbe()
const placeholderOperatorPreflight = runPlaceholderOperatorPreflightProbe()
const placeholderEnvOperatorPreflight = runPlaceholderEnvOperatorPreflightProbe()
if (operatorPreflight.decision !== 'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_operator_preflight_completed_with_runtime_blocks') {
  fail(`operator_preflight_decision_mismatch:${operatorPreflight.decision}`)
}
if (operatorPreflight.operatorPreflightOnly !== true) fail('operator_preflight_only_not_true')
if (operatorPreflight.canRunQueueWriteSmokeNow !== false) {
  fail('operator_preflight_unexpectedly_ready_without_env_or_flags')
}
if (operatorPreflight.liveServiceRoleQueueWriteSmokeExecutedNow !== false) {
  fail('operator_preflight_live_smoke_not_false')
}
if (operatorPreflight.liveSupabaseQueueWritesNow !== 0) {
  fail('operator_preflight_live_writes_not_0')
}
if (operatorPreflight.workerClaimsCreatedNow !== 0) fail('operator_preflight_worker_claims_not_0')
if (operatorPreflight.workerDispatchesPerformedNow !== 0) {
  fail('operator_preflight_worker_dispatches_not_0')
}
if (operatorPreflight.toolExecutionsPerformedNow !== 0) {
  fail('operator_preflight_tool_executions_not_0')
}
if (operatorPreflight.agentCanExecuteToolsNow !== false) {
  fail('operator_preflight_agent_execute_not_false')
}
if (operatorPreflight.gpuRuntimeShouldStartNow !== false) {
  fail('operator_preflight_gpu_should_start_not_false')
}
for (const envName of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE',
  'WORKER_RUNTIME_MODE',
]) {
  if (!operatorPreflight.missingOrMismatchedEnv?.some((entry) => entry.name === envName)) {
    fail(`operator_preflight_missing_env_blocker:${envName}`)
  }
}
for (const flag of [
  '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
  '--workspace-id',
  '--project-id',
  '--approved-plan-snapshot-id',
  '--credit-reservation-id',
  '--idempotency-prefix',
  '--source-non-production-service-role-queue-write-smoke-preflight-packet',
  '--service-role-boundary-ref',
  '--private-evidence-ref',
  '--telemetry-ref',
  '--cleanup-proof-ref',
  '--rollback-ref',
  '--output-result',
]) {
  if (!operatorPreflight.missingFlags?.includes(flag)) {
    fail(`operator_preflight_missing_flag_blocker:${flag}`)
  }
}
if (placeholderOperatorPreflight.canRunQueueWriteSmokeNow !== false) {
  fail('placeholder_operator_preflight_unexpectedly_ready')
}
if (!Array.isArray(placeholderOperatorPreflight.invalidFlagValues)) {
  fail('placeholder_operator_preflight_missing_invalid_flag_values')
} else {
  for (const flag of [
    '--workspace-id',
    '--project-id',
    '--approved-plan-snapshot-id',
    '--credit-reservation-id',
    '--idempotency-prefix',
    '--service-role-boundary-ref',
    '--private-evidence-ref',
    '--telemetry-ref',
    '--cleanup-proof-ref',
    '--rollback-ref',
  ]) {
    if (!placeholderOperatorPreflight.invalidFlagValues.some((entry) => entry.flag === flag)) {
      fail(`placeholder_operator_preflight_missing_invalid_flag:${flag}`)
    }
  }
}
if (placeholderOperatorPreflight.liveServiceRoleQueueWriteSmokeExecutedNow !== false) {
  fail('placeholder_operator_preflight_live_smoke_not_false')
}
if (placeholderOperatorPreflight.liveSupabaseQueueWritesNow !== 0) {
  fail('placeholder_operator_preflight_live_writes_not_0')
}
if (placeholderEnvOperatorPreflight.canRunQueueWriteSmokeNow !== false) {
  fail('placeholder_env_operator_preflight_unexpectedly_ready')
}
if (!Array.isArray(placeholderEnvOperatorPreflight.invalidEnvValues)) {
  fail('placeholder_env_operator_preflight_missing_invalid_env_values')
} else {
  for (const name of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!placeholderEnvOperatorPreflight.invalidEnvValues.some((entry) => entry.name === name)) {
      fail(`placeholder_env_operator_preflight_missing_invalid_env:${name}`)
    }
  }
}
if (placeholderEnvOperatorPreflight.liveServiceRoleQueueWriteSmokeExecutedNow !== false) {
  fail('placeholder_env_operator_preflight_live_smoke_not_false')
}
if (placeholderEnvOperatorPreflight.liveSupabaseQueueWritesNow !== 0) {
  fail('placeholder_env_operator_preflight_live_writes_not_0')
}

const rejected = runRejectedExecutionProbe()
if (!/REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true/.test(rejected)) {
  fail('execution_probe_missing_confirmation_rejection')
}

if (!proofSource.includes('runnerCommand')) fail('proof_template_missing_runner_command')
if (!proofSource.includes('operatorPreflightCommand')) fail('proof_template_missing_preflight_command')
if (!proofSource.includes(runScriptName)) fail('proof_template_missing_runner_script_name')
if (!proofDocs.operatorResultTemplate?.operatorPreflightCommand?.includes('--operator-preflight')) {
  fail('proof_docs_missing_operator_preflight_command')
}
if (!proofDocs.operatorResultTemplate?.runnerCommand?.includes(runScriptName)) {
  fail('proof_docs_missing_runner_command')
}
for (const flag of prepared.requiredFlags ?? []) {
  if (!proofDocs.operatorResultTemplate?.operatorPreflightCommand?.includes(flag)) {
    fail(`proof_docs_operator_preflight_missing_required_flag:${flag}`)
  }
}
if (proofDocs.operatorResultTemplate?.canBeUsedAsAcceptedResultWithoutLiveSmoke !== false) {
  fail('proof_docs_template_accepts_without_live_smoke')
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
  toolsSubmitted: prepared.toolsSubmitted,
  toolsSubmittedIds: prepared.toolsSubmittedIds,
  liveServiceRoleQueueWriteSmokeExecutedNow:
    prepared.liveServiceRoleQueueWriteSmokeExecutedNow,
  liveSupabaseQueueWritesNow: prepared.liveSupabaseQueueWritesNow,
  operatorPreflightOnly: operatorPreflight.operatorPreflightOnly,
  canRunQueueWriteSmokeNow: operatorPreflight.canRunQueueWriteSmokeNow,
  placeholderPreflightBlocked: placeholderOperatorPreflight.canRunQueueWriteSmokeNow === false,
  placeholderInvalidFlagValues:
    placeholderOperatorPreflight.invalidFlagValues?.length ?? 0,
  placeholderEnvPreflightBlocked:
    placeholderEnvOperatorPreflight.canRunQueueWriteSmokeNow === false,
  placeholderInvalidEnvValues:
    placeholderEnvOperatorPreflight.invalidEnvValues?.length ?? 0,
  agentCanExecuteToolsNow: prepared.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: prepared.booleans.gpuRuntimeShouldStartNow,
  proofTemplateRunnerCommandPresent: true,
  packageLockUnchanged: true,
}, null, 2))
