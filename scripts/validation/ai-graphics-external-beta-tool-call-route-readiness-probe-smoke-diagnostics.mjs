import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_beta_tool_call_route_readiness_probe_smoke_passed'
const status =
  'canonical_tool_call_route_readiness_probe_reports_all_21_route_callable_with_13_runtime_executable_and_8_gpu_proof_required'
const runScriptName =
  'ai-graphics:external-beta-tool-call-route-readiness-probe-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-call-route-readiness-probe-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-tool-call-route-readiness-probe-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-call-route-readiness-probe-smoke-diagnostics.mjs'

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

const cpuStaticTools = [
  'd3',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
]

const browserRuntimeTools = [
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/cli/ai-graphics-external-beta-tool-call-route-readiness-probe-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-tool-call-route-readiness-probe-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-browser-runtime-controlled-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const forbiddenDocPatterns = [
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionPerformedByReadinessProbe["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformedByReadinessProbe["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /modelInferencePerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif|pdf)$/i

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
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 128 * 1024 * 1024,
  })
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  if (
    report.routeDecision !==
    'ai_graphics_external_beta_tool_call_route_readiness_probe_passed'
  ) {
    fail(`${label}_route_decision_mismatch`)
  }
  if (
    report.routeStatus !==
    'canonical_tool_call_route_readiness_reports_all_twenty_one_route_callable_and_eight_gpu_model_runtime_proof_required'
  ) {
    fail(`${label}_route_status_mismatch`)
  }
  if (report.routePath !== '/api/ai-graphics/external-beta/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }
  if (
    report.readinessRoutePath !==
    '/api/ai-graphics/external-beta/tool-call/readiness'
  ) {
    fail(`${label}_readiness_route_path_mismatch`)
  }

  const rows = report.toolSummary
  if (!Array.isArray(rows) || rows.length !== 21) {
    fail(`${label}_tool_summary_count_mismatch`)
    return
  }
  for (const toolId of allTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_tool:${toolId}`)
      continue
    }
    if (row.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_${toolId}_gpu_runtime_started`)
    }
  }
  for (const toolId of cpuStaticTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) continue
    if (row.canonicalRouteMode !== 'cpu_static_controlled_execution') {
      fail(`${label}_${toolId}_mode_mismatch`)
    }
    if (row.externalAgentCanExecuteThisToolNow !== true) {
      fail(`${label}_${toolId}_not_executable_now`)
    }
    if (row.httpStatusIfCalledNow !== 200) fail(`${label}_${toolId}_status_not_200`)
  }
  for (const toolId of browserRuntimeTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) continue
    if (row.canonicalRouteMode !== 'browser_runtime_controlled_execution') {
      fail(`${label}_${toolId}_mode_mismatch`)
    }
    if (row.externalAgentCanExecuteThisToolNow !== true) {
      fail(`${label}_${toolId}_not_executable_now`)
    }
    if (row.httpStatusIfCalledNow !== 200) fail(`${label}_${toolId}_status_not_200`)
  }
  for (const toolId of gpuModelTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) continue
    if (row.canonicalRouteMode !== 'gpu_model_controlled_execution') {
      fail(`${label}_${toolId}_mode_mismatch`)
    }
    if (row.externalAgentCanExecuteThisToolNow !== true) {
      fail(`${label}_${toolId}_not_executable_now`)
    }
    if (row.routeCanEvaluateFailClosedGpuModelAdmissionNow !== true) {
      fail(`${label}_${toolId}_gpu_admission_not_evaluated`)
    }
    if (row.httpStatusIfCalledNow !== 200) fail(`${label}_${toolId}_status_not_200`)
    if (row.gpuModelUnblockPlanStatus === null) {
      fail(`${label}_${toolId}_missing_gpu_unblock_plan_status`)
    }
    if (row.nextExternalAgentAction === null) {
      fail(`${label}_${toolId}_missing_next_external_agent_action`)
    }
    if (row.nativeGpuRuntimeProofRequired !== true) {
      fail(`${label}_${toolId}_native_gpu_proof_not_required`)
    }
    if (row.nativeGpuRuntimeProofAccepted !== false) {
      fail(`${label}_${toolId}_native_gpu_proof_unexpectedly_accepted`)
    }
    if (row.nextProofCommandCount <= 0) {
      fail(`${label}_${toolId}_next_proof_commands_missing`)
    }
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      if (row.modelWeightManifestRequired !== true) {
        fail(`${label}_${toolId}_model_manifest_not_required`)
      }
      if (row.modelWeightPrivateEvidenceRequired !== true) {
        fail(`${label}_${toolId}_private_model_evidence_not_required`)
      }
      if (row.modelWeightPrivateEvidenceAccepted !== false) {
        fail(`${label}_${toolId}_private_model_evidence_unexpectedly_accepted`)
      }
    } else if (row.modelWeightPrivateEvidenceRequired !== false) {
      fail(`${label}_${toolId}_private_model_evidence_unexpectedly_required`)
    }
  }

  const counts = report.counts ?? {}
  const expectedCounts = {
    totalAiGraphicsTools: 21,
    productFacingCapabilities: 12,
    externalAgentRouteCallableNowTools: 21,
    externalAgentRouteExecutableNowTools: 21,
    realRuntimeExecutableNowTools: 13,
    cpuStaticControlledExecutableNowTools: 6,
    browserRuntimeControlledExecutableNowTools: 7,
    gpuModelRuntimeAdmissionBlockedTools: 0,
    gpuModelRuntimeAdmissionEvaluatedFailClosedTools: 8,
    gpuModelRuntimeUnblockPlanExposedTools: 8,
    gpuModelNativeGpuProofRequiredTools: 8,
    gpuModelPrivateEvidenceAndNativeGpuProofRequiredTools: 5,
    gpuModelNativeGpuProofOnlyRequiredTools: 3,
    gpuModelRuntimeProofRequiredTools: 8,
    gpuModelToolsReadyForExecutionAfterCurrentEvidence: 0,
    modelWeightManifestRequiredTools: 5,
    gpuRuntimeShouldStartNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    workerDispatchPerformedTools: 0,
    providerRuntimePerformedTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_${key}_mismatch:${counts[key]}`)
  }

  const booleans = report.booleans ?? {}
  for (const key of [
    'externalBetaToolCallRouteReadinessProbeSafe',
    'routeMountedByAppNow',
    'mockOnlyRuntimeModeEnforced',
    'agentCanSelectForPlanning',
    'agentCanCallAll21ControlledRoutesNow',
    'externalAgentCanExecuteSomeToolsNow',
    'agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow',
    'agentCanExecuteRealRuntimeFor13ToolsNow',
    'gpuModelUnblockPlanExposed',
    'allEightGpuModelToolsHaveActionableUnblockPlan',
    'fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof',
    'threeFoundationGpuToolsRequireNativeGpuProofOnly',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'gpuModelToolsReadyForExecutionAfterCurrentEvidence',
    'gpuModelRuntimeProofAcceptedNow',
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'routeExecutionPerformedByReadinessProbe',
    'workerExecutionApprovedNow',
    'workerDispatchApprovedNow',
    'workerDispatchPerformed',
    'toolExecutionApprovedNow',
    'toolExecutionPerformedByReadinessProbe',
    'providerRuntimePerformed',
    'browserWebglCanvasRuntimePerformedByReadinessProbe',
    'gpuRuntimePerformed',
    'gpuRuntimeShouldStartNow',
    'modelWeightsDownloaded',
    'modelWeightsLoaded',
    'modelInferencePerformed',
    'mediaProcessingPerformed',
    'supabaseMutationPerformed',
    'gcsUploadPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
    'dependencyInstallPerformed',
    'packageLockMutationPerformed',
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

for (const file of requiredFiles) read(file)

const docs = json(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.md',
)
const packageJson = json('package.json')
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
const cliSource = read('server/cli/ai-graphics-external-beta-tool-call-route-readiness-probe-smoke.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const browserRouteSmoke = json(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-browser-runtime-controlled-execution-smoke.json',
)
const gpuAdmissionSmoke = json(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json',
)

checkReport('docs', docs)
const live = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', live)

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_mismatch')
}
for (const phrase of [
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH',
  'buildAiGraphicsExternalBetaToolCallRouteReadiness',
  'externalAgentCanExecuteThisToolNow',
  'gpu_model_runtime_admission_blocked',
  'buildAiGraphicsGpuModelUnblockPlan',
  'AI_GRAPHICS_GPU_MODEL_PRIVATE_EVIDENCE_COMMANDS',
  'AI_GRAPHICS_GPU_MODEL_NATIVE_PROOF_COMMANDS',
  'AI_GRAPHICS_GPU_MODEL_PER_TOOL_RECHECK_COMMANDS',
  "router.get(AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH",
]) {
  if (!routeSource.includes(phrase)) fail(`route_missing:${phrase}`)
}
for (const phrase of [
  'expected 21 tools',
  'expectedCounts',
  'externalAgentCanExecuteThisToolNow',
  'nextExternalAgentAction',
  'nativeGpuRuntimeProofRequired',
  'GPU/model tools remain on-demand only',
]) {
  if (!cliSource.includes(phrase)) fail(`cli_missing:${phrase}`)
}
if (browserRouteSmoke.counts?.controlledCanonicalRouteExecutedTools !== 13) {
  fail('browser_route_smoke_controlled_count_mismatch')
}
if (gpuAdmissionSmoke.counts?.gpuModelRuntimeAdmissionBlockedTools !== 8) {
  fail('gpu_admission_smoke_blocked_count_mismatch')
}
if (
  !scorecard.includes(
    'AI Graphics External Beta Tool Call Route Readiness Probe Smoke',
  )
) {
  fail('scorecard_missing_route_readiness_probe_section')
}
if (!scorecard.includes('externalAgentRouteExecutableNowTools=21')) {
  fail('scorecard_missing_route_executable_count')
}
if (!scorecard.includes('agentCanCallAll21ControlledRoutesNow=true')) {
  fail('scorecard_missing_all21_route_callable_true')
}
if (!scorecard.includes('agentCanExecuteAll21ToolsNow=false')) {
  fail('scorecard_missing_all21_false')
}
if (!scorecard.includes('gpuRuntimeShouldStartNow=false')) {
  fail('scorecard_missing_gpu_runtime_false')
}
if (!JSON.stringify(docs).includes('gpuModelUnblockPlanStatus')) {
  fail('docs_json_missing_gpu_unblock_plan_status')
}
if (!docsMd.includes('GPU/model unblock plan')) {
  fail('docs_md_missing_gpu_unblock_plan_column')
}
for (const toolId of allTools) {
  if (!JSON.stringify(docs).includes(`"${toolId}"`)) fail(`docs_json_missing_tool:${toolId}`)
  if (!docsMd.includes(`\`${toolId}\``)) fail(`docs_md_missing_tool:${toolId}`)
}

for (const [label, text] of [
  ['docs_md', docsMd],
  ['docs_json', JSON.stringify(docs)],
]) {
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(text)) fail(`${label}_forbidden_pattern:${pattern}`)
  }
}

const packageLockDiff = exec('git diff -- package-lock.json')
if (packageLockDiff.trim()) fail('package_lock_changed')

const trackedLocalArtifacts = exec('git ls-files .local-artifacts')
if (trackedLocalArtifacts.trim()) fail('local_artifacts_tracked')

const changedFiles = [
  ...exec('git diff --name-only HEAD').split('\n'),
  ...exec('git ls-files --others --exclude-standard').split('\n'),
].filter(Boolean)
for (const file of changedFiles) {
  if (changedGeneratedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  externalAgentRouteExecutableNowTools:
    docs.counts.externalAgentRouteExecutableNowTools,
  realRuntimeExecutableNowTools:
    docs.counts.realRuntimeExecutableNowTools,
  gpuModelRuntimeAdmissionBlockedTools:
    docs.counts.gpuModelRuntimeAdmissionBlockedTools,
  agentCanExecuteAll21ToolsNow:
    docs.booleans.agentCanExecuteAll21ToolsNow,
  gpuRuntimeShouldStartNow:
    docs.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
