import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks'
const acceptedStatus = 'mounted_route_returns_structured_tool_not_ready_for_all_21'
const runScriptName = 'ai-graphics:external-agent-mounted-blocked-route-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-mounted-blocked-route-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-mounted-blocked-route-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-mounted-blocked-route-smoke-diagnostics.mjs'
const baseRef = 'origin/codex/rp-ai-graphics-gpu-model-runtime-readiness-gate'

const allTools = [
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

const allCapabilities = [
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

const gpuTools = new Set([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const trueBooleanKeys = [
  'externalAgentMountedBlockedRouteSmokePassed',
  'routeMountFeatureFlagEnabledInSmoke',
  'defaultRouteMountFeatureFlagDisabled',
  'flagDisabledRouteUnmounted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'requestAcceptedForPlanningMetadataForAll21',
  'structuredToolNotReadyReturnedForAll21',
  'structuredToolNotReadyReturnedForAll12Capabilities',
  'localHttpSmokePerformed',
  'agentCanSelectForPlanning',
]

const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerEnqueueApprovedNow',
  'workerDispatchApprovedNow',
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

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-mounted-blocked-route-smoke.ts',
  'scripts/validation/ai-graphics-external-agent-mounted-blocked-route-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.md',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/app.ts',
  'server/config/env.ts',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-mount-feature-flag.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

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
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 20 * 1024 * 1024,
  }).trim()
}

function runSmoke() {
  const output = execFileSync('npm', ['run', '--silent', runScriptName], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 20 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function assertTrueBooleans(label, booleans) {
  for (const key of trueBooleanKeys) {
    if (booleans?.[key] !== true) fail(`${label}_${key}_not_true`)
  }
}

function assertFalseBooleans(label, booleans) {
  for (const key of falseBooleanKeys) {
    if (booleans?.[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

function assertCounts(label, report) {
  const counts = report.counts ?? {}
  const expected = {
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    toolSmokeCases: 21,
    capabilitySmokeCases: 12,
    mountedBlockedRouteSmokeCases: 33,
    flagEnabledToolNotReadyResponses: 33,
    flagDisabledRouteStatus: 404,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    gpuRuntimeShouldStartNowTools: 0,
    queueWriteApprovedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    toolExecutionApprovedNowTools: 0,
    externalAgentExecutableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  for (const [key, value] of Object.entries(expected)) {
    if (counts[key] !== value) fail(`${label}_${key}_expected_${value}_got_${counts[key]}`)
  }
}

function assertToolRows(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_tools_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_tool_count_not_21`)
  for (const toolId of allTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${toolId}_status_not_409`)
    if (row.errorCode !== 'TOOL_NOT_READY') fail(`${label}_${toolId}_code_not_tool_not_ready`)
    if (row.requestAcceptedForPlanningMetadata !== true) {
      fail(`${label}_${toolId}_planning_metadata_not_true`)
    }
    if (row.selectedRequestedTool !== true) fail(`${label}_${toolId}_selected_tool_not_true`)
    if (row.gpuRuntimeTargetedTool !== gpuTools.has(toolId)) {
      fail(`${label}_${toolId}_gpu_target_mismatch`)
    }
    if (row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== gpuTools.has(toolId)) {
      fail(`${label}_${toolId}_gpu_start_allowed_mismatch`)
    }
    for (const key of [
      'directAgentToolExecutionApprovedNow',
      'routeExecutionApprovedNow',
      'gpuRuntimeShouldStartNow',
      'queueWriteApprovedNow',
      'workerEnqueueApprovedNow',
      'workerDispatchApprovedNow',
      'toolExecutionApprovedNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
  }
}

function assertCapabilityRows(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_capabilities_not_array`)
    return
  }
  if (rows.length !== 12) fail(`${label}_capability_count_not_12`)
  for (const capabilityId of allCapabilities) {
    const row = rows.find((item) => item.capabilityId === capabilityId)
    if (!row) {
      fail(`${label}_missing_capability:${capabilityId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${capabilityId}_status_not_409`)
    if (row.errorCode !== 'TOOL_NOT_READY') {
      fail(`${label}_${capabilityId}_code_not_tool_not_ready`)
    }
    if (row.requestAcceptedForPlanningMetadata !== true) {
      fail(`${label}_${capabilityId}_planning_metadata_not_true`)
    }
    if (row.selectedRequestedTool !== true) {
      fail(`${label}_${capabilityId}_selected_tool_not_true`)
    }
    for (const key of [
      'directAgentToolExecutionApprovedNow',
      'routeExecutionApprovedNow',
      'gpuRuntimeShouldStartNow',
      'queueWriteApprovedNow',
      'workerDispatchApprovedNow',
      'toolExecutionApprovedNow',
    ]) {
      if (row[key] !== false) fail(`${label}_${capabilityId}_${key}_not_false`)
    }
  }
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.md')
const cliSource = read('server/cli/ai-graphics-external-agent-mounted-blocked-route-smoke.ts')
const appSource = read('server/app.ts')
const envSource = read('server/config/env.ts')
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
assertCounts('docs', docs)
assertToolRows('docs', docs.tools)
assertCapabilityRows('docs', docs.capabilities)
assertTrueBooleans('docs', docs.booleans)
assertFalseBooleans('docs', docs.booleans)

for (const phrase of [
  '409 TOOL_NOT_READY',
  'feature flag disabled',
  '21',
  '12',
  '33',
  'GPU runtime started now: `0`',
  'Queue writes approved now: `0`',
  'Worker dispatch approved now: `0`',
  'Tool execution approved now: `0`',
  'External-agent executable tools now: `0`',
  'agentCanExecuteToolsNow=false',
  'routeExecutionPerformed=false',
  'gpuRuntimeShouldStartNow=false',
]) {
  if (!docsMd.includes(phrase)) fail(`docs_md_missing:${phrase}`)
}

for (const phrase of [
  'createReeditProApiApp',
  'loadRuntimeEnv',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED',
  'listAiGraphicsExternalBetaToolCallBlockedReadinessCases',
  'buildAiGraphicsToolCallHandoffContract',
  'result.statusCode !== 409',
  "result.errorCode !== 'TOOL_NOT_READY'",
  'gpuRuntimeShouldStartNow',
  'queueWriteApprovedNow',
  'workerDispatchApprovedNow',
  'toolExecutionApprovedNow',
]) {
  if (!cliSource.includes(phrase)) fail(`cli_missing:${phrase}`)
}

if (!appSource.includes('env.aiGraphicsExternalBetaToolCallRouteMountEnabled')) {
  fail('app_route_mount_flag_missing')
}
if (!envSource.includes('AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED')) {
  fail('env_route_mount_flag_missing')
}
if (!routeSource.includes('TOOL_NOT_READY')) fail('route_tool_not_ready_missing')
if (!routeSource.includes('buildAiGraphicsExternalBetaToolCallBlockedDetails')) {
  fail('route_blocked_details_builder_missing')
}

const runtimeReport = runSmoke()
if (runtimeReport.decision !== decision) fail('runtime_decision_mismatch')
if (runtimeReport.status !== acceptedStatus) fail('runtime_status_mismatch')
assertCounts('runtime', runtimeReport)
assertToolRows('runtime', runtimeReport.tools)
assertCapabilityRows('runtime', runtimeReport.capabilities)
assertTrueBooleans('runtime', runtimeReport.booleans)
assertFalseBooleans('runtime', runtimeReport.booleans)
if (JSON.stringify(runtimeReport.tools) !== JSON.stringify(docs.tools)) {
  fail('runtime_tools_do_not_match_docs')
}
if (JSON.stringify(runtimeReport.capabilities) !== JSON.stringify(docs.capabilities)) {
  fail('runtime_capabilities_do_not_match_docs')
}

for (const phrase of [
  'AI Graphics External Agent Mounted Blocked Route Smoke',
  'ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks',
  'mountedBlockedRouteSmokeCases: 33',
  'flagDisabledRouteStatus: 404',
  'gpuRuntimeShouldStartNow=false',
  'agentCanExecuteToolsNow=false',
]) {
  if (!scorecard.includes(phrase)) fail(`scorecard_missing:${phrase}`)
}

for (const pattern of [
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"workerEnqueueApprovedNow"\s*:\s*true/i,
  /"workerDispatchApprovedNow"\s*:\s*true/i,
  /"toolExecutionApprovedNow"\s*:\s*true/i,
  /"providerRuntimeApprovedNow"\s*:\s*true/i,
  /"browserWebglCanvasRuntimeApprovedNow"\s*:\s*true/i,
  /"gpuRuntimeApprovedNow"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /"backendQueueSubmissionPerformed"\s*:\s*true/i,
  /"liveQueueWritePerformed"\s*:\s*true/i,
  /"workerEnqueuePerformed"\s*:\s*true/i,
  /"workerDispatchPerformed"\s*:\s*true/i,
  /"toolExecutionPerformed"\s*:\s*true/i,
  /"routeExecutionPerformed"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"browserWebglCanvasRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"modelWeightsDownloaded"\s*:\s*true/i,
  /"modelWeightsLoaded"\s*:\s*true/i,
  /"mediaProcessingPerformed"\s*:\s*true/i,
  /"supabaseMutationPerformed"\s*:\s*true/i,
  /"gcsUploadPerformed"\s*:\s*true/i,
  /"publicArtifactCreated"\s*:\s*true/i,
  /"signedUrlCreated"\s*:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  for (const file of [
    'server/cli/ai-graphics-external-agent-mounted-blocked-route-smoke.ts',
    'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.json',
    'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.md',
  ]) {
    if (pattern.test(read(file))) fail(`forbidden_claim:${file}:${pattern}`)
  }
}

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch (error) {
  fail(`base_package_unavailable:${error.message}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(packageJson[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package_lock_changed')
}
if (git(['ls-files', '.local-artifacts'])) {
  fail('local_artifacts_tracked')
}
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_staged')
}
const packetChangedFiles = new Set([
  ...git(['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean),
  ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
])
const trackedGeneratedOutputs = [...packetChangedFiles].filter((file) =>
    /\.(png|jpe?g|webp|gif|mp4|mov|webm|svg)$/i.test(file) &&
    /(ai-graphics|tool-intelligence|local-artifacts|public\/|render|browser|canvas|webgl)/i.test(file),
)
if (trackedGeneratedOutputs.length) {
  fail(`generated_media_or_public_outputs_tracked:${trackedGeneratedOutputs.join(',')}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: 21,
  capabilitiesCovered: 12,
  mountedBlockedRouteSmokeCases: 33,
  flagEnabledToolNotReadyResponses: 33,
  flagDisabledRouteStatus: 404,
  gpuRuntimeTargetedTools: 8,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
  routeExecutionApprovedNow: false,
  workerDispatchApprovedNow: false,
  toolExecutionApprovedNow: false,
  packageLockChanged: false,
}, null, 2))
