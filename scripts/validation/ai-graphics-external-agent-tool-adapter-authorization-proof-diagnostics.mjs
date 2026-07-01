import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_tool_adapter_authorization_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_tool_adapter_authorization_prepared_all_21_execution_blocked'
const sourceDecision =
  'ai_graphics_external_agent_controlled_dispatcher_dry_run_proof_passed_with_runtime_blocks'
const sourceStatus =
  'controlled_dispatcher_dry_run_completed_all_21_no_tool_execution'
const runScriptName =
  'ai-graphics:external-agent-tool-adapter-authorization-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-tool-adapter-authorization-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-tool-adapter-authorization-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-tool-adapter-authorization-proof-diagnostics.mjs'
const cpuStaticAdapterSmokeRunScriptName =
  'ai-graphics:external-agent-cpu-static-adapter-smoke'
const cpuStaticAdapterSmokeRunScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-adapter-smoke.ts'
const cpuStaticAdapterSmokeDiagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-adapter-smoke:diagnostics'
const cpuStaticAdapterSmokeDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-adapter-smoke-diagnostics.mjs'

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

const adapterBoundaryTools = {
  cpu_static_tool_adapter_contract: [
    'd3',
    'vega_lite',
    'vega',
    'satori',
    'svgdotjs_svg_js',
    'viz_js',
  ],
  browser_runtime_tool_adapter_contract: [
    'echarts',
    'lottie_web',
    'animejs',
    'three_js',
    'pixi_js',
    'konva',
    'babylonjs',
  ],
  gpu_model_tool_adapter_contract: [
    'torch_torchvision',
    'transformers',
    'sam2',
    'birefnet',
    'real_esrgan',
    'kornia',
    'rembg',
    'transparent_background',
  ],
}

const expectedCounts = {
  sourceControlledDispatcherDryRunCompletedTools: 21,
  sourceAiGraphicsHandoffRouteTools: 21,
  adapterAuthorizationRows: 21,
  adapterContractsAuthorizedWithRuntimeBlocks: 21,
  cpuStaticToolAdapterContracts: 6,
  browserRuntimeToolAdapterContracts: 7,
  gpuModelToolAdapterContracts: 8,
  mappedProductionProfilesAccepted: 21,
  externalAgentCanInvokeAdapterNowTools: 0,
  externalAgentExecutableNowTools: 0,
  toolExecutionApprovedNowTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
}

const trueKeys = [
  'externalAgentToolAdapterAuthorizationPrepared',
  'sourceControlledDispatcherDryRunAccepted',
  'sourceAiGraphicsHandoffRoutesAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21AdapterContractsAuthorizedWithRuntimeBlocks',
  'all21MappedProductionProfilesAccepted',
  'all8GpuToolsTargetOnDemandGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'adapterAuthorizationIsContractOnly',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'externalAgentCanInvokeAdapterNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
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
  'liveQueueWritePerformed',
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
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

const forbiddenDocPatterns = [
  /externalAgentCanInvokeAdapterNow["`:\s=]+true/i,
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-tool-adapter-authorization.ts',
  'server/cli/ai-graphics-external-agent-tool-adapter-authorization-proof.ts',
  'scripts/validation/ai-graphics-external-agent-tool-adapter-authorization-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.md',
  'server/tool-registry/ai-graphics-tool-call-readiness.ts',
  'server/tool-registry/ai-graphics-tool-call-handoff.ts',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  `+    "${cpuStaticAdapterSmokeRunScriptName}": "${cpuStaticAdapterSmokeRunScriptCommand}",`,
  `+    "${cpuStaticAdapterSmokeDiagnosticScriptName}": "${cpuStaticAdapterSmokeDiagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-cpu-static-private-worker-handoff-admission": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-handoff-admission:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission-diagnostics.mjs",',
])

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

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

function exec(command) {
  return childProcess.execSync(command, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 40 * 1024 * 1024,
  })
}

function checkList(label, list, expected) {
  if (!Array.isArray(list)) {
    fail(`${label}_not_array`)
    return
  }
  if (list.length !== expected.length) fail(`${label}_count_mismatch`)
  for (const value of expected) {
    if (!list.includes(value)) fail(`${label}_missing:${value}`)
  }
}

function checkCounts(label, counts) {
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts?.[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${counts?.[key]}`)
    }
  }
}

function checkBooleans(label, booleans) {
  for (const key of trueKeys) {
    if (booleans?.[key] !== true) fail(`${label}_boolean_not_true:${key}`)
  }
  for (const key of falseKeys) {
    if (booleans?.[key] !== false) fail(`${label}_boolean_not_false:${key}`)
  }
}

function checkAdapterBoundaries(label, boundaries) {
  for (const [boundary, expectedTools] of Object.entries(adapterBoundaryTools)) {
    checkList(`${label}_${boundary}`, boundaries?.[boundary], expectedTools)
  }
}

function checkRows(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_rows_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_row_count_not_21`)
  for (const toolId of tools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_row:${toolId}`)
      continue
    }
    const expectedBoundary = Object.entries(adapterBoundaryTools)
      .find(([, boundaryTools]) => boundaryTools.includes(toolId))?.[0]
    if (row.adapterBoundary !== expectedBoundary) {
      fail(`${label}_${toolId}_adapter_boundary_mismatch`)
    }
    if (!row.productionToolId) fail(`${label}_${toolId}_missing_production_tool_id`)
    if (!row.workerType) fail(`${label}_${toolId}_missing_worker_type`)
    if (!row.runtimeTarget) fail(`${label}_${toolId}_missing_runtime_target`)
    if (row.authorizationStatus !== 'adapter_authorized_for_contract_only_execution_blocked') {
      fail(`${label}_${toolId}_authorization_status_mismatch`)
    }
    for (const key of [
      'sourceControlledDispatcherDryRunAccepted',
      'sourceAiGraphicsHandoffRouteAccepted',
      'mappedProductionProfileAccepted',
      'adapterContractAuthorizedWithRuntimeBlocks',
      'adapterCanBePreparedForApprovedHandoff',
    ]) {
      if (row[key] !== true) fail(`${label}_${toolId}_${key}_not_true`)
    }
    for (const key of [
      'externalAgentCanInvokeAdapterNow',
      'agentCanExecuteToolsNow',
      'routeExecutionApprovedNow',
      'workerExecutionApprovedNow',
      'toolExecutionApprovedNow',
      'providerRuntimeApprovedNow',
      'browserWebglCanvasRuntimeApprovedNow',
      'gpuRuntimeApprovedNow',
      'gpuRuntimeShouldStartNow',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
    if (!Array.isArray(row.unblockRequirements) || row.unblockRequirements.length < 4) {
      fail(`${label}_${toolId}_missing_unblock_requirements`)
    }
    if (typeof row.nextProofMilestone !== 'string' || row.nextProofMilestone.length < 10) {
      fail(`${label}_${toolId}_missing_next_milestone`)
    }
  }
}

function checkPackageDiff(command, label) {
  const diff = exec(command)
  for (const line of diff.split('\n')) {
    if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
      continue
    }
    if (line.startsWith('+') && allowedPackageDiffLines.has(line)) continue
    if (line.startsWith('+') || line.startsWith('-')) {
      fail(`${label}_unexpected_package_diff:${line}`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.md')
const source = json('docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.json')
const packageJson = json('package.json')
const moduleSource = read('server/tool-registry/ai-graphics-external-agent-tool-adapter-authorization.ts')
const cliSource = read('server/cli/ai-graphics-external-agent-tool-adapter-authorization-proof.ts')
const diagnosticSource = read('scripts/validation/ai-graphics-external-agent-tool-adapter-authorization-proof-diagnostics.mjs')
const indexSource = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.sourceEvidence?.controlledDispatcherDryRunDecision !== sourceDecision) {
  fail('docs_source_decision_mismatch')
}
if (docs.sourceEvidence?.controlledDispatcherDryRunStatus !== sourceStatus) {
  fail('docs_source_status_mismatch')
}
if (docs.interfaces?.packageScript !== runScriptName) fail('docs_package_script_mismatch')
if (docs.interfaces?.diagnosticScript !== diagnosticScriptName) fail('docs_diagnostic_script_mismatch')
if (docs.interfaces?.adapterContractMode !== 'contract_only_execution_blocked') {
  fail('docs_adapter_contract_mode_mismatch')
}
checkList('docs_tools', docs.tools, tools)
checkList('docs_capabilities', docs.capabilities, capabilities)
checkAdapterBoundaries('docs_adapter_boundaries', docs.adapterBoundaries)
checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)

if (source.decision !== sourceDecision) fail('source_decision_mismatch')
if (source.status !== sourceStatus) fail('source_status_mismatch')
if (source.counts?.controlledDispatcherDryRunCompletedTools !== 21) {
  fail('source_controlled_dispatcher_count_mismatch')
}
if (source.counts?.aiGraphicsToolCallHandoffRouteTools !== 21) {
  fail('source_handoff_route_count_mismatch')
}
if (source.counts?.gpuRuntimeShouldStartNowTools !== 0) {
  fail('source_gpu_start_count_not_zero')
}
if (source.booleans?.agentCanExecuteToolsNow !== false) fail('source_agent_execute_not_false')
if (source.booleans?.toolExecutionPerformed !== false) fail('source_tool_execution_not_false')
if (source.booleans?.gpuRuntimePerformed !== false) fail('source_gpu_runtime_not_false')

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION',
  'buildAiGraphicsExternalAgentToolAdapterAuthorization',
  'adapterBoundaryForRuntime',
  'gpuRuntimeOnDemandOnly: true',
  'externalAgentCanInvokeAdapterNow: false',
  'agentCanExecuteToolsNow: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!moduleSource.includes(required)) fail(`module_missing_required_text:${required}`)
}

for (const required of [
  'sourceControlledDispatcherDryRunPath',
  'buildAiGraphicsExternalAgentToolAdapterAuthorization',
  'source.counts.controlledDispatcherDryRunCompletedTools',
  'report.counts.adapterAuthorizationRows === 21',
  'report.counts.gpuRuntimeShouldStartNowTools === 0',
]) {
  if (!cliSource.includes(required)) fail(`cli_missing_required_text:${required}`)
}

if (!indexSource.includes("export * from './ai-graphics-external-agent-tool-adapter-authorization'")) {
  fail('index_missing_adapter_authorization_export')
}
if (!diagnosticSource.includes('forbiddenDocPatterns')) fail('diagnostic_missing_forbidden_patterns')
if (!diagnosticSource.includes('changedGeneratedArtifactPattern')) {
  fail('diagnostic_missing_generated_artifact_scan')
}

for (const required of [
  decision,
  acceptedStatus,
  'externalAgentCanInvokeAdapterNow=false',
  'agentCanExecuteToolsNow=false',
  'gpuRuntimeShouldStartNow=false',
  'CPU/static adapter contracts',
  'Browser/runtime adapter contracts',
  'GPU/model adapter contracts',
]) {
  if (!docsMd.includes(required)) fail(`docs_md_missing:${required}`)
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_doc_claim:${pattern}`)
  }
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
} catch (error) {
  fail(`cli_report_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
if (cliReport.sourceDecision !== 'ai_graphics_tool_call_handoff_contract_prepared_with_execution_blocks') {
  fail('cli_source_handoff_decision_mismatch')
}
if (cliReport.totalAiGraphicsTools !== 21) fail('cli_total_tools_mismatch')
if (cliReport.totalProductFacingCapabilities !== 12) fail('cli_total_capabilities_mismatch')
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_count_mismatch')
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail('docs_total_capabilities_count_mismatch')
}
checkCounts('cli', cliReport.counts)
checkBooleans('cli', cliReport.booleans)
checkRows('cli', cliReport.rows)

for (const [key, value] of Object.entries(expectedCounts)) {
  if (docs.counts?.[key] !== value || cliReport.counts?.[key] !== value) {
    fail(`docs_cli_expected_count_mismatch:${key}`)
  }
}
for (const key of trueKeys) {
  if (docs.booleans?.[key] !== cliReport.booleans?.[key]) {
    fail(`docs_cli_true_boolean_mismatch:${key}`)
  }
}
for (const key of falseKeys) {
  if (docs.booleans?.[key] !== cliReport.booleans?.[key]) {
    fail(`docs_cli_false_boolean_mismatch:${key}`)
  }
}

for (const [boundary, expectedTools] of Object.entries(adapterBoundaryTools)) {
  const actualTools = cliReport.rows
    ?.filter((row) => row.adapterBoundary === boundary)
    .map((row) => row.toolId)
  checkList(`cli_${boundary}`, actualTools, expectedTools)
}

for (const required of [
  'AI Graphics External Agent Tool Adapter Authorization Proof',
  decision,
  'adapterContractsAuthorizedWithRuntimeBlocks=21',
  'cpuStaticToolAdapterContracts=6',
  'browserRuntimeToolAdapterContracts=7',
  'gpuModelToolAdapterContracts=8',
  'externalAgentCanInvokeAdapterNowTools=0',
  'gpuRuntimeShouldStartNowTools=0',
]) {
  if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
}

checkPackageDiff('git diff --unified=0 -- package.json', 'working')
checkPackageDiff('git diff --cached --unified=0 -- package.json', 'cached')

const packageLockDiff = [
  exec('git diff -- package-lock.json'),
  exec('git diff --cached -- package-lock.json'),
].join('\n').trim()
if (packageLockDiff) fail('package_lock_changed')

const changedFiles = [
  exec('git diff --name-only HEAD'),
  exec('git diff --cached --name-only'),
  exec('git ls-files --others --exclude-standard'),
].join('\n')

for (const file of changedFiles.split('\n').filter(Boolean)) {
  if (changedGeneratedArtifactPattern.test(file)) {
    fail(`generated_artifact_path_changed:${file}`)
  }
}

const localArtifacts = [
  exec('git ls-files .local-artifacts'),
  exec('git diff --name-only HEAD -- .local-artifacts'),
  exec('git diff --cached --name-only -- .local-artifacts'),
].join('\n').trim()
if (localArtifacts) fail(`local_artifacts_changed:${localArtifacts}`)

if (failures.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        failures,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      status: acceptedStatus,
      tools: tools.length,
      capabilities: capabilities.length,
      counts: expectedCounts,
      agentCanSelectForPlanning: true,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      gpuRuntimeShouldStartNow: false,
      packageLockUnchanged: true,
    },
    null,
    2,
  ),
)
