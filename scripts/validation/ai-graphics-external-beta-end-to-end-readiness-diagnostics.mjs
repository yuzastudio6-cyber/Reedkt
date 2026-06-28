import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const runScriptName = 'ai-graphics:external-beta-end-to-end-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-end-to-end-readiness.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-end-to-end-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-end-to-end-readiness-diagnostics.mjs'

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

const gpuTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-end-to-end-readiness.ts',
  'server/cli/ai-graphics-external-beta-end-to-end-readiness.ts',
  'scripts/validation/ai-graphics-external-beta-end-to-end-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.md',
]

const falseBooleanKeys = [
  'externalBetaReadyNow',
  'productionReadyNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
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

function readJson(filePath) {
  const content = read(filePath)
  if (!content) return {}
  try {
    return JSON.parse(content)
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function runCli(args = []) {
  const output = execFileSync(
    'npm',
    ['run', '--silent', runScriptName, '--', ...args],
    { encoding: 'utf8' },
  )
  return JSON.parse(output)
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

function assertCount(record, key, expected, label) {
  if (record?.counts?.[key] !== expected) {
    fail(`${label}_${key}_expected_${expected}_got_${record?.counts?.[key]}`)
  }
}

function assertBooleanMap(record, label) {
  const booleans = record?.booleans ?? {}
  for (const key of falseBooleanKeys) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }
  if (booleans.agentCanSelectForPlanning !== true) {
    fail(`${label}_agentCanSelectForPlanning_not_true`)
  }
  if (booleans.all21ToolsCovered !== true) fail(`${label}_all21ToolsCovered_not_true`)
  if (booleans.all12CapabilitiesCovered !== true) fail(`${label}_all12CapabilitiesCovered_not_true`)
  if (booleans.all8GpuToolsTargetGpuRuntime !== true) {
    fail(`${label}_all8GpuToolsTargetGpuRuntime_not_true`)
  }
  if (booleans.noDuplicateAiGraphicsProductionMappings !== true) {
    fail(`${label}_duplicate_mapping_guard_not_true`)
  }
}

function assertTools(record, label) {
  const toolIds = (record?.tools ?? []).map((tool) => tool.toolId)
  for (const toolId of allTools) {
    if (!toolIds.includes(toolId)) fail(`${label}_missing_tool:${toolId}`)
  }
  if (toolIds.length !== 21) fail(`${label}_tool_count_${toolIds.length}`)

  for (const tool of record?.tools ?? []) {
    if (tool.installReadyForPlannedSurface !== true) fail(`${label}_install_not_true:${tool.toolId}`)
    if (tool.productionMapped !== true) fail(`${label}_production_mapping_not_true:${tool.toolId}`)
    if (tool.rankingSelectionReadyForPlanning !== true) {
      fail(`${label}_ranking_not_true:${tool.toolId}`)
    }
    if (tool.externalBetaReadyNow !== false) fail(`${label}_external_beta_ready_now:${tool.toolId}`)
    if (tool.productionReadyNow !== false) fail(`${label}_production_ready_now:${tool.toolId}`)
    if (tool.cpuFallbackAllowedForHeavyTool !== false) {
      fail(`${label}_cpu_fallback_not_false:${tool.toolId}`)
    }
    if (gpuTools.includes(tool.toolId)) {
      if (tool.gpuRequiredForRuntime !== true) fail(`${label}_gpu_required_not_true:${tool.toolId}`)
      if (!String(tool.runtimeTarget).includes('nvidia_l4')) {
        fail(`${label}_gpu_runtime_target_not_nvidia_l4:${tool.toolId}`)
      }
    }
  }
}

for (const filePath of requiredFiles) read(filePath)

const packageJson = readJson('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const indexTs = read('server/tool-registry/index.ts')
if (!indexTs.includes("export * from './ai-graphics-external-beta-end-to-end-readiness'")) {
  fail('missing_registry_export')
}

const docsJson = readJson('docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json')
if (docsJson.decision !== 'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks') {
  fail('docs_decision_mismatch')
}
assertCount(docsJson, 'totalAiGraphicsTools', 21, 'docs')
assertCount(docsJson, 'totalProductFacingCapabilities', 12, 'docs')
assertCount(docsJson, 'installReadyTools', 21, 'docs')
assertCount(docsJson, 'productionMappedTools', 21, 'docs')
assertCount(docsJson, 'gpuRuntimeTargetedTools', 8, 'docs')
assertCount(docsJson, 'heavyToolsIncorrectlyTargetingCpu', 0, 'docs')
assertCount(docsJson, 'duplicateAiGraphicsProductionToolIds', 0, 'docs')
assertCount(docsJson, 'externalBetaReadyNowTools', 0, 'docs')
assertCount(docsJson, 'productionReadyNowTools', 0, 'docs')
if (docsJson.counts?.fullEvidenceExternalBetaCandidateReadyWithProvidedEvidenceTools !== 21) {
  fail('docs_full_evidence_candidate_count_not_21')
}
assertBooleanMap(docsJson, 'docs')

const defaultReport = runCli()
if (defaultReport.status !== 'installed_and_mapped_runtime_blocked') {
  fail(`default_status:${defaultReport.status}`)
}
assertCount(defaultReport, 'totalAiGraphicsTools', 21, 'default')
assertCount(defaultReport, 'installReadyTools', 21, 'default')
assertCount(defaultReport, 'productionMappedTools', 21, 'default')
assertCount(defaultReport, 'gpuRuntimeTargetedTools', 8, 'default')
assertCount(defaultReport, 'externalBetaCandidateReadyWithProvidedEvidenceTools', 0, 'default')
assertCount(defaultReport, 'externalBetaReadyNowTools', 0, 'default')
assertBooleanMap(defaultReport, 'default')
assertTools(defaultReport, 'default')

const fullEvidenceReport = runCli([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--internal-beta-owner-approval-granted',
  '--all-external-beta-evidence-passed',
])
if (
  fullEvidenceReport.status !==
  'external_beta_candidate_with_provided_evidence_runtime_still_blocked'
) {
  fail(`full_evidence_status:${fullEvidenceReport.status}`)
}
assertCount(fullEvidenceReport, 'betaTechnicalEvidenceReadyWithProvidedEvidenceTools', 21, 'full')
assertCount(fullEvidenceReport, 'externalBetaCandidateReadyWithProvidedEvidenceTools', 21, 'full')
assertCount(fullEvidenceReport, 'externalBetaReadyNowTools', 0, 'full')
assertCount(fullEvidenceReport, 'productionReadyNowTools', 0, 'full')
assertBooleanMap(fullEvidenceReport, 'full')
assertTools(fullEvidenceReport, 'full')
if (fullEvidenceReport.booleans?.externalBetaCandidateReadyWithProvidedEvidence !== true) {
  fail('full_evidence_candidate_boolean_not_true')
}

const claimScanFiles = requiredFiles.filter((filePath) => !filePath.endsWith('-diagnostics.mjs'))
const allText = claimScanFiles.map((filePath) => read(filePath)).join('\n')
for (const key of falseBooleanKeys) {
  const pattern = new RegExp(`${key}["\`]?\\s*[:=]\\s*true`, 'i')
  if (pattern.test(allText)) fail(`forbidden_true_claim:${key}`)
}
for (const phrase of [
  'dry_run_passed',
  'generated_local_fixture_passed',
  'external beta ready now: true',
  'production ready now: true',
]) {
  if (allText.toLowerCase().includes(phrase)) fail(`forbidden_phrase:${phrase}`)
}

const packageLockDiff = git(['diff', '--name-only', '--', 'package-lock.json']).trim()
if (packageLockDiff) fail('package_lock_changed')

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts']).trim()
if (trackedLocalArtifacts) fail('tracked_local_artifacts')

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
for (const filePath of stagedFiles) {
  if (/(\.local-artifacts|generated-media|render-output|browser-output|canvas-output|webgl-output|public-artifact)/i.test(filePath)) {
    fail(`staged_generated_output:${filePath}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: 'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks',
  toolsCovered: defaultReport.counts.totalAiGraphicsTools,
  gpuToolsTargeted: defaultReport.counts.gpuRuntimeTargetedTools,
  duplicateAiGraphicsProductionToolIds: defaultReport.counts.duplicateAiGraphicsProductionToolIds,
  defaultExternalBetaCandidateReadyWithProvidedEvidenceTools:
    defaultReport.counts.externalBetaCandidateReadyWithProvidedEvidenceTools,
  fullEvidenceExternalBetaCandidateReadyWithProvidedEvidenceTools:
    fullEvidenceReport.counts.externalBetaCandidateReadyWithProvidedEvidenceTools,
  externalBetaReadyNowTools: defaultReport.counts.externalBetaReadyNowTools,
  productionReadyNowTools: defaultReport.counts.productionReadyNowTools,
  gpuRuntimeShouldStartNow: defaultReport.booleans.gpuRuntimeShouldStartNow,
  agentCanExecuteToolsNow: defaultReport.booleans.agentCanExecuteToolsNow,
}, null, 2))
