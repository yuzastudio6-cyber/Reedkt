import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:external-beta-readiness-gate:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-external-beta-readiness-gate-diagnostics.mjs'
const evaluatorScriptName = 'ai-graphics:external-beta-readiness-gate'
const evaluatorScriptCommand = 'tsx server/cli/ai-graphics-external-beta-readiness-gate.ts'

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

function runEvaluator(args = []) {
  return execFileSync('npm', ['run', '--silent', evaluatorScriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.md')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const betaToolCall = json('docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json')
const installAudit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const gpuGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const rollup = json('docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json')
const source = read('server/tool-registry/ai-graphics-external-beta-readiness-gate.ts')
const cli = read('server/cli/ai-graphics-external-beta-readiness-gate.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (pkg.scripts?.[evaluatorScriptName] !== evaluatorScriptCommand) {
  fail(`missing_package_script:${evaluatorScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-readiness-gate'")) {
  fail('server_registry_index_missing_external_beta_gate_export')
}

if (docs.decision !== 'ai_graphics_external_beta_readiness_gate_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (betaGate.decision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail(`unexpected_beta_gate_decision:${betaGate.decision}`)
}
if (betaToolCall.decision !== 'ai_graphics_beta_tool_call_readiness_contract_prepared_with_fail_closed_defaults') {
  fail(`unexpected_beta_tool_call_decision:${betaToolCall.decision}`)
}
if (installAudit.counts?.properlyInstalledForPlannedSurface !== 21) fail('install_audit_not_21')
if (installAudit.counts?.heavyToolsTargetingGpu !== 8) fail('install_audit_gpu_tool_count_not_8')
if (installAudit.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('install_audit_cpu_fallback_count_not_0')
if (gpuGate.gpuRuntimePolicy?.onDemandOnly !== true) fail('gpu_gate_not_on_demand')
if (gpuGate.gpuRuntimePolicy?.cpuFallbackAllowedForHeavyTools !== false) fail('gpu_gate_cpu_fallback_allowed')
if (rollup.counts?.externalBetaReadyNowTools !== 0) fail('rollup_external_beta_ready_now_not_0')

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!docsMd.includes(`\`${tool}\``) && !docsMd.includes('21')) fail(`docs_markdown_missing_tool_context:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION',
  'buildAiGraphicsExternalBetaReadinessGate',
  'buildAiGraphicsBetaReadinessGate',
  'buildAiGraphicsBetaToolCallReadiness',
  'externalBetaReadyWithProvidedEvidenceTools',
  'externalBetaReadyNowTools: 0',
  'externalBetaBlockedNowTools: 21',
  'productionReadyNowTools: 0',
  'internalBetaRuntimeSoakAccepted',
  'externalBetaCostConcurrencyPrivacyRollbackAccepted',
  'externalBetaIncidentResponseAccepted',
  'gpuRuntimeOnDemandOnly: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--all-external-beta-evidence-passed',
  '--internal-beta-runtime-soak-accepted',
  '--external-beta-qa-accepted',
  '--external-beta-cost-concurrency-privacy-rollback-accepted',
  '--external-beta-incident-response-accepted',
  '--external-beta-owner-approval-granted',
  'evaluatorOnly: true',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.counts?.installedForPlannedSurface !== 21) fail('docs_installed_not_21')
if (docs.counts?.productionMappedTools !== 21) fail('docs_mapped_not_21')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_targeted_not_8')
if (docs.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('docs_gpu_cpu_fallback_count_not_0')
if (docs.counts?.defaultExternalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('docs_default_external_beta_ready_with_evidence_not_0')
}
if (docs.counts?.fullEvidenceExternalBetaReadyWithProvidedEvidenceTools !== 21) {
  fail('docs_full_external_beta_ready_with_evidence_not_21')
}
if (docs.counts?.externalBetaReadyNowTools !== 0) fail('docs_external_beta_ready_now_not_0')
if (docs.counts?.externalBetaBlockedNowTools !== 21) fail('docs_external_beta_blocked_now_not_21')
if (docs.counts?.productionReadyNowTools !== 0) fail('docs_production_ready_now_not_0')

for (const key of [
  'externalBetaReadinessGatePrepared',
  'sourceBetaReadinessGateAccepted',
  'sourceBetaToolCallReadinessAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ToolsInstalledForPlannedSurface',
  'all21ToolsMappedToProductionRegistry',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'externalBetaToolCallReadinessSeparated',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
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
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

const defaultOutput = parseJsonOutput(runEvaluator(), 'external_beta_default')
if (defaultOutput.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('default_external_beta_ready_with_evidence_not_0')
}
if (defaultOutput.externalBetaReadyNowTools !== 0) fail('default_external_beta_ready_now_not_0')
if (defaultOutput.externalBetaBlockedNowTools !== 21) fail('default_external_beta_blocked_now_not_21')
if (defaultOutput.tools?.length !== 21) fail('default_tool_count_not_21')

const fullOutput = parseJsonOutput(runEvaluator([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--all-external-beta-evidence-passed',
]), 'external_beta_full_evidence')
if (fullOutput.betaTestingReadyWithProvidedEvidenceTools !== 21) {
  fail('full_beta_testing_ready_with_evidence_not_21')
}
if (fullOutput.externalBetaReadyWithProvidedEvidenceTools !== 21) {
  fail('full_external_beta_ready_with_evidence_not_21')
}
if (fullOutput.externalBetaReadyNowTools !== 0) fail('full_external_beta_ready_now_not_0')
if (fullOutput.externalBetaBlockedNowTools !== 21) fail('full_external_beta_blocked_now_not_21')
if (fullOutput.productionReadyNowTools !== 0) fail('full_production_ready_now_not_0')

for (const output of [defaultOutput, fullOutput]) {
  for (const tool of allTools) {
    const row = output.tools?.find((entry) => entry.toolId === tool)
    if (!row) fail(`output_missing_tool:${tool}`)
    if (row?.externalBetaReadyNow !== false) fail(`tool_external_beta_ready_now_not_false:${tool}`)
    if (row?.productionReadyNow !== false) fail(`tool_production_ready_now_not_false:${tool}`)
  }
  for (const key of [
    'agentCanExecuteToolsNow',
    'routeExecutionApprovedNow',
    'workerExecutionApprovedNow',
    'toolExecutionApprovedNow',
    'providerRuntimeApprovedNow',
    'browserWebglCanvasRuntimeApprovedNow',
    'gpuRuntimeApprovedNow',
    'runtimeReadyNow',
    'internalBetaReadyNow',
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
    'modelWeightsDownloaded',
    'modelWeightsLoaded',
    'mediaProcessingPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
  ]) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_external_beta_readiness_gate_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_external_beta_readiness_gate_decision')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.md',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
  'server/tool-registry/ai-graphics-external-beta-readiness-gate.ts',
  'server/cli/ai-graphics-external-beta-readiness-gate.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')

for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff) fail('package_lock_changed')

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /(generated|render|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i.test(file))) {
  fail('generated_output_staged')
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  toolsCovered: allTools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  defaultExternalBetaReadyWithProvidedEvidenceTools:
    defaultOutput.externalBetaReadyWithProvidedEvidenceTools,
  fullEvidenceExternalBetaReadyWithProvidedEvidenceTools:
    fullOutput.externalBetaReadyWithProvidedEvidenceTools,
  externalBetaReadyNowTools: fullOutput.externalBetaReadyNowTools,
  externalBetaBlockedNowTools: fullOutput.externalBetaBlockedNowTools,
  agentCanExecuteToolsNow: fullOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: fullOutput.booleans?.runtimeReadyNow,
}, null, 2))
