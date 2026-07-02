import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_five_execution_blocked'
const sourceDecision =
  'ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight-diagnostics.mjs'

const tools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const preflightTools = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const capabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  sourceLiveAdapterQueueWriteProofAcceptedTools: 5,
  nonProductionServiceRoleQueueWriteSmokePreflightReadyTools: 5,
  nonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools: 5,
  satoriBlockedPendingApprovedFontFixtureTools: 1,
  nonCpuStaticDeferredTools: 15,
  serviceRoleQueueWriteSmokeApprovedNowTools: 0,
  liveQueueWriteApprovedNowTools: 0,
  liveQueueWritePerformedNowTools: 0,
  workerClaimApprovedNowTools: 0,
  workerClaimPerformedNowTools: 0,
  workerDispatchApprovedNowTools: 0,
  workerDispatchPerformedNowTools: 0,
  workerExecutionApprovedNowTools: 0,
  toolExecutionApprovedNowTools: 0,
  toolExecutionPerformedNowTools: 0,
  externalAgentExecutableNowTools: 0,
  publicArtifactAllowedTools: 0,
  signedUrlAllowedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
}

const trueKeys = [
  'externalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightPrepared',
  'sourceLiveAdapterQueueWriteProofAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady',
  'allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence',
  'satoriBlockedPendingApprovedFontFixture',
  'fifteenRuntimeDeferredToolsPreserved',
  'serverOnlyServiceRoleCredentialsRequired',
  'nonProductionEnvironmentRequired',
  'explicitOperatorConfirmationRequired',
  'savedSmokeResultRequiredBeforeExecutionGateCanAdvance',
  'cleanupRequired',
  'rollbackRequired',
  'telemetryRequired',
  'privateArtifactOnlyPolicyAccepted',
  'noSupabaseQueueWriteByPreflight',
  'noLiveQueueWriteByPreflight',
  'noWorkerClaimByPreflight',
  'noWorkerDispatchByPreflight',
  'noToolExecutionByPreflight',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'externalAgentCanInvokeAdapterNow',
  'externalAgentCanSubmitPrivateWorkerQueueNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'serviceRoleQueueWriteSmokeApprovedNow',
  'liveQueueWriteApprovedNow',
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
  'liveQueueWritePerformed',
  'workerEnqueuePerformed',
  'workerClaimPerformed',
  'workerDispatchPerformed',
  'toolExecutionPerformed',
  'routeExecutionPerformed',
  'workerExecutionPerformed',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.json',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof-diagnostics.mjs",',
])

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /externalAgentCanInvokeAdapterNow["`:\s=]+true/i,
  /externalAgentCanSubmitPrivateWorkerQueueNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /serviceRoleQueueWriteSmokeApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerClaimApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /serviceRoleQueueWriteSmokePerformed["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerClaimPerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /mediaProcessingPerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(absolute(file), 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function sameSet(actual, expected, label) {
  if (!Array.isArray(actual)) {
    fail(`${label}:not_array`)
    return
  }
  const sortedActual = [...actual].sort()
  const sortedExpected = [...expected].sort()
  if (
    sortedActual.length !== sortedExpected.length ||
    sortedExpected.some((value, index) => sortedActual[index] !== value)
  ) {
    fail(`${label}:mismatch`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_required_file:${file}`)
  }
}

const report = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.md',
)
const sourceProof = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.json',
)
const packageJson = json('package.json')
const indexSource = read('server/tool-registry/index.ts')
const source = read(
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts',
)
const cli = read(
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts',
)
const promptResult = read(
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight-results.md',
)
const implementationPrompt = read(
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.md',
)
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (report.decision !== decision) fail('decision_mismatch')
if (report.status !== acceptedStatus) fail('status_mismatch')
if (report.sourceLiveAdapterQueueWriteProofDecision !== sourceDecision) {
  fail('source_decision_mismatch')
}
if (sourceProof.decision !== sourceDecision) fail('source_proof_not_available')
if (report.schemaVersion !==
  '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight') {
  fail('schema_version_mismatch')
}

sameSet(report.tools, tools, 'tools')
sameSet(report.capabilities, capabilities, 'capabilities')
if (!Array.isArray(report.rows) || report.rows.length !== 21) fail('rows_length_not_21')

for (const [key, expected] of Object.entries(expectedCounts)) {
  if (report.counts?.[key] !== expected) {
    fail(`count_mismatch:${key}:expected_${expected}:actual_${report.counts?.[key]}`)
  }
}

for (const key of trueKeys) {
  if (report.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}

for (const key of falseKeys) {
  if (report.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

for (const toolId of preflightTools) {
  const row = report.rows?.find((candidate) => candidate.toolId === toolId)
  if (!row) {
    fail(`missing_preflight_tool_row:${toolId}`)
    continue
  }
  if (row.nonProductionServiceRoleQueueWriteSmokePreflightStatus !==
    'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked') {
    fail(`preflight_status_mismatch:${toolId}`)
  }
  if (row.nonProductionServiceRoleQueueWriteSmokePreflightReady !== true) {
    fail(`preflight_not_ready:${toolId}`)
  }
  if (!row.preflightContract || !row.preflightEvidence) {
    fail(`preflight_contract_or_evidence_missing:${toolId}`)
  }
  if (row.serviceRoleQueueWriteSmokeApprovedNow !== false ||
    row.liveQueueWriteApprovedNow !== false ||
    row.workerClaimApprovedNow !== false ||
    row.workerDispatchApprovedNow !== false ||
    row.toolExecutionApprovedNow !== false ||
    row.gpuRuntimeShouldStartNow !== false) {
    fail(`runtime_gate_not_false:${toolId}`)
  }
  if (!row.preflightContract?.requiredEnvironment?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    fail(`missing_service_role_env:${toolId}`)
  }
  if (row.preflightContract?.expectedQueueRowsBeforeCleanup !== 5 ||
    row.preflightContract?.expectedQueueRowsAfterCleanup !== 0) {
    fail(`smoke_row_count_contract_mismatch:${toolId}`)
  }
}

const satori = report.rows?.find((candidate) => candidate.toolId === 'satori')
if (satori?.nonProductionServiceRoleQueueWriteSmokePreflightStatus !==
  'non_production_service_role_queue_write_smoke_preflight_blocked_pending_satori_font_fixture') {
  fail('satori_block_status_mismatch')
}

for (const toolId of tools.filter((tool) => !preflightTools.includes(tool) && tool !== 'satori')) {
  const row = report.rows?.find((candidate) => candidate.toolId === toolId)
  if (row?.nonProductionServiceRoleQueueWriteSmokePreflightStatus !==
    'non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary') {
    fail(`non_cpu_static_deferred_status_mismatch:${toolId}`)
  }
}

const packageScripts = packageJson.scripts ?? {}
if (packageScripts[runScriptName] !== runScriptCommand) fail('missing_run_script')
if (packageScripts[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('missing_diagnostic_script')
}

if (!indexSource.includes(
  "export * from './ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'",
)) {
  fail('missing_registry_export')
}

for (const phrase of [
  `Decision: \`${decision}\``,
  `Status: \`${acceptedStatus}\``,
  'CPU/static service-role queue-write smoke preflights ready: `5`',
  'Service-role queue-write smoke approved now: `0`',
  'Live queue writes performed now: `0`',
  '`agentCanExecuteToolsNow=false`',
  '`serviceRoleQueueWriteSmokeApprovedNow=false`',
  '`liveQueueWriteApprovedNow=false`',
  '`toolExecutionApprovedNow=false`',
]) {
  if (!docsMd.includes(phrase)) fail(`docs_missing_phrase:${phrase}`)
}

for (const text of [docsMd, promptResult, implementationPrompt, scorecard]) {
  if (!text.includes(decision)) fail('decision_missing_from_docs')
}

for (const text of [source, cli, docsMd, promptResult, implementationPrompt, JSON.stringify(report)]) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden_claim:${pattern}`)
  }
}

let packageDiff = ''
try {
  packageDiff = git(['diff', '--', 'package.json'])
} catch {
  fail('package_diff_failed')
}
for (const line of packageDiff.split('\n').filter(Boolean)) {
  if (
    line.startsWith('+') &&
    !line.startsWith('+++') &&
    !allowedPackageDiffLines.has(line)
  ) {
    fail(`unexpected_package_json_addition:${line}`)
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    fail(`unexpected_package_json_removal:${line}`)
  }
}

try {
  const lockDiff = git(['diff', '--', 'package-lock.json'])
  if (lockDiff.trim().length > 0) fail('package_lock_changed')
} catch {
  fail('package_lock_diff_failed')
}

try {
  const changed = git(['diff', '--name-only'])
    .split('\n')
    .filter(Boolean)
  for (const file of changed) {
    if (generatedArtifactPattern.test(file)) {
      fail(`generated_artifact_path_changed:${file}`)
    }
  }
} catch {
  fail('changed_file_scan_failed')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({
    ok: true,
    decision,
    acceptedStatus,
    preflightReadyTools:
      report.counts.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools,
    sourceLiveAdapterQueueWriteProofAcceptedTools:
      report.counts.sourceLiveAdapterQueueWriteProofAcceptedTools,
    serviceRoleQueueWriteSmokeApprovedNow:
      report.booleans.serviceRoleQueueWriteSmokeApprovedNow,
    liveQueueWritePerformed:
      report.booleans.liveQueueWritePerformed,
    workerDispatchApprovedNow:
      report.booleans.workerDispatchApprovedNow,
    toolExecutionApprovedNow:
      report.booleans.toolExecutionApprovedNow,
    agentCanExecuteToolsNow:
      report.booleans.agentCanExecuteToolsNow,
    gpuRuntimeShouldStartNow:
      report.booleans.gpuRuntimeShouldStartNow,
    packageLockUnchanged: true,
  }, null, 2))
}
