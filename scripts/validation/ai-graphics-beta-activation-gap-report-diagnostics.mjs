import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const reportScriptName = 'ai-graphics:beta-activation-gap-report'
const reportScriptCommand = 'tsx server/cli/ai-graphics-beta-activation-gap-report.ts'
const diagnosticScriptName = 'ai-graphics:beta-activation-gap-report:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-beta-activation-gap-report-diagnostics.mjs'

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

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
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

function runReport() {
  return execFileSync('npm', ['run', '--silent', reportScriptName], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-beta-activation-gap-report.ts',
  'server/cli/ai-graphics-beta-activation-gap-report.ts',
  'server/tool-registry/production-tool-profiles.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/beta-activation-gap-report.md',
  'docs/tool-intelligence/ai-graphics/beta-activation-gap-report.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
  'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docPacket = json('docs/tool-intelligence/ai-graphics/beta-activation-gap-report.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const proofResultPacket = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json')
const nodeRuntimeProof = json('docs/tool-intelligence/ai-graphics/node-runtime-proof.json')
const browserRuntimeProof = json('docs/tool-intelligence/ai-graphics/browser-runtime-proof.json')
const satoriFontRuntimeProof = json('docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json')
const moduleSource = read('server/tool-registry/ai-graphics-beta-activation-gap-report.ts')
const cliSource = read('server/cli/ai-graphics-beta-activation-gap-report.ts')
const profilesSource = read('server/tool-registry/production-tool-profiles.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/beta-activation-gap-report.md')

if (pkg.scripts?.[reportScriptName] !== reportScriptCommand) fail(`missing_package_script:${reportScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-beta-activation-gap-report'")) {
  fail('server_registry_index_does_not_export_beta_activation_gap_report')
}
if (docPacket.decision !== 'ai_graphics_beta_activation_gap_report_prepared_with_remaining_blocks') {
  fail(`unexpected_doc_decision:${docPacket.decision}`)
}
if (betaGate.decision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail('source_beta_gate_decision_not_accepted')
}
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) {
  fail('proper_install_audit_not_21')
}
if (proofResultPacket.decision !== 'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results') {
  fail('gpu_runtime_proof_result_packet_missing')
}
if (nodeRuntimeProof.decision !== 'ai_graphics_node_runtime_proof_completed_with_warnings') {
  fail('node_runtime_proof_packet_missing')
}
if (browserRuntimeProof.decision !== 'ai_graphics_browser_runtime_proof_completed_with_warnings') {
  fail('browser_runtime_proof_packet_missing')
}
if (satoriFontRuntimeProof.decision !== 'ai_graphics_satori_font_runtime_proof_completed_with_warnings') {
  fail('satori_font_runtime_proof_packet_missing')
}

const reportOutput = runReport()
const report = JSON.parse(reportOutput)

if (report.decision !== docPacket.decision) fail(`report_decision_mismatch:${report.decision}`)
if (report.totalAiGraphicsTools !== 21) fail('report_total_tools_not_21')
if (report.properInstallForPlannedSurface !== 21) fail('report_proper_install_not_21')
if (report.productionMappedTools !== 21) fail('report_production_mapped_not_21')
if (report.duplicateProductionMappings !== 0) fail('report_duplicate_mappings_not_zero')
if (report.gpuRuntimeTargetedTools?.length !== 8) fail('report_gpu_tool_count_not_8')
if (report.heavyToolsIncorrectlyTargetingCpu !== 0) fail('report_heavy_cpu_count_not_zero')
if (report.betaActivationReadyTools !== 0) fail('report_beta_activation_ready_not_zero')
if (report.blockedTools !== 21) fail('report_blocked_tools_not_21')
if (report.duplicateMappingRows?.length !== 0) fail('report_duplicate_mapping_rows_not_empty')
if (report.input?.reportOnly !== true) fail('report_input_not_report_only')
if (report.input?.committedRuntimeProofPacketsRead !== true) fail('committed_runtime_proof_packets_not_read')
if (report.input?.nodeRuntimeProofPacketAccepted !== true) fail('node_runtime_proof_packet_not_accepted')
if (report.input?.browserRuntimeProofPacketAccepted !== true) fail('browser_runtime_proof_packet_not_accepted')
if (report.input?.satoriFontRuntimeProofPacketAccepted !== true) fail('satori_font_runtime_proof_packet_not_accepted')
if (report.committedRuntimeProofs?.nodeRuntimeProofAccepted !== true) fail('report_node_runtime_proof_not_accepted')
if (report.committedRuntimeProofs?.browserRuntimeProofAccepted !== true) fail('report_browser_runtime_proof_not_accepted')
if (report.committedRuntimeProofs?.satoriFontRuntimeProofAccepted !== true) fail('report_satori_runtime_proof_not_accepted')
if (!report.committedRuntimeProofs?.acceptedRuntimeProofGates?.includes('browser_canvas_webgl_runtime_sandbox_proof_packet')) {
  fail('report_missing_browser_runtime_accepted_gate')
}
if (docPacket.committedRuntimeProofs?.browserRuntimeProofAccepted !== true) {
  fail('doc_browser_runtime_proof_not_accepted')
}

for (const tool of allTools) {
  if (!docPacket.allTools?.includes(tool)) fail(`doc_missing_tool:${tool}`)
  const row = (report.tools || []).find((entry) => entry.toolId === tool)
  if (!row) {
    fail(`report_missing_tool:${tool}`)
    continue
  }
  if (row.properInstallForPlannedSurface !== true) fail(`tool_not_proper_install:${tool}`)
  if (row.duplicateProductionMapping !== false) fail(`tool_duplicate_mapping:${tool}`)
  if (row.betaActivationReadyNow !== false) fail(`tool_beta_ready_now_not_false:${tool}`)
  if (!row.requiredEvidenceGates?.includes('approved_plan_snapshot_gate')) fail(`tool_missing_snapshot_gate:${tool}`)
  if (!Array.isArray(row.acceptedEvidenceGates)) fail(`tool_missing_accepted_evidence_gates:${tool}`)
  if (!Array.isArray(row.remainingEvidenceGates)) fail(`tool_missing_remaining_evidence_gates:${tool}`)
  if (!row.routeWorkerGates?.includes('tool_route_execution_approval')) fail(`tool_missing_route_gate:${tool}`)
  if (!row.routeWorkerGates?.includes('worker_execution_approval')) fail(`tool_missing_worker_gate:${tool}`)
  if (!row.nextAction) fail(`tool_missing_next_action:${tool}`)
}

for (const tool of ['echarts']) {
  const row = (report.tools || []).find((entry) => entry.toolId === tool)
  if (!row?.acceptedEvidenceGates?.includes('browser_chart_runtime_sandbox_proof')) {
    fail(`browser_chart_tool_missing_accepted_browser_proof:${tool}`)
  }
  if (row?.remainingEvidenceGates?.includes('browser_chart_runtime_sandbox_proof')) {
    fail(`browser_chart_tool_still_remaining_browser_proof:${tool}`)
  }
}

for (const tool of ['lottie_web', 'animejs']) {
  const row = (report.tools || []).find((entry) => entry.toolId === tool)
  if (!row?.acceptedEvidenceGates?.includes('browser_animation_runtime_sandbox_proof')) {
    fail(`browser_animation_tool_missing_accepted_browser_proof:${tool}`)
  }
  if (row?.remainingEvidenceGates?.includes('browser_animation_runtime_sandbox_proof')) {
    fail(`browser_animation_tool_still_remaining_browser_proof:${tool}`)
  }
}

for (const tool of ['three_js', 'pixi_js', 'konva', 'babylonjs']) {
  const row = (report.tools || []).find((entry) => entry.toolId === tool)
  if (!row?.acceptedEvidenceGates?.includes('browser_canvas_webgl_runtime_sandbox_proof')) {
    fail(`browser_canvas_webgl_tool_missing_accepted_browser_proof:${tool}`)
  }
  if (row?.remainingEvidenceGates?.includes('browser_canvas_webgl_runtime_sandbox_proof')) {
    fail(`browser_canvas_webgl_tool_still_remaining_browser_proof:${tool}`)
  }
}

const satoriRow = (report.tools || []).find((entry) => entry.toolId === 'satori')
if (!satoriRow?.acceptedEvidenceGates?.includes('approved_satori_font_fixture_for_text_svg_layout')) {
  fail('satori_missing_accepted_font_runtime_proof')
}
if (satoriRow?.remainingEvidenceGates?.includes('approved_satori_font_fixture_for_text_svg_layout')) {
  fail('satori_font_runtime_proof_still_remaining')
}

for (const tool of gpuTools) {
  if (!docPacket.gpuRuntimeTargetedTools?.includes(tool)) fail(`doc_missing_gpu_tool:${tool}`)
  const row = (report.tools || []).find((entry) => entry.toolId === tool)
  if (row?.gpuRequiredForRuntime !== true) fail(`gpu_tool_not_gpu_required:${tool}`)
  if (row?.heavyToolTargetsGpu !== true) fail(`gpu_tool_not_targeting_gpu:${tool}`)
  if (!row?.runtimeTarget?.includes('nvidia_l4')) fail(`gpu_tool_runtime_not_l4:${tool}`)
  if (!row?.requiredEvidenceGates?.includes('native_gpu_runtime_proof_result_accepted')) {
    fail(`gpu_tool_missing_native_proof_gate:${tool}`)
  }
}

for (const tool of modelWeightTools) {
  const row = (report.tools || []).find((entry) => entry.toolId === tool)
  if (!row?.requiredEvidenceGates?.includes('reviewed_private_model_weight_manifest')) {
    fail(`model_weight_tool_missing_manifest_gate:${tool}`)
  }
}

for (const tool of ['kornia', 'rembg', 'transparent_background']) {
  const index = profilesSource.indexOf(`toolId: '${tool}'`)
  const block = index >= 0 ? profilesSource.slice(index, index + 900) : ''
  if (!block.includes('cpuAllowed: false')) fail(`gpu_profile_cpu_allowed_not_false:${tool}`)
}

for (const token of [
  'AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION',
  'buildAiGraphicsBetaActivationGapReport',
  'duplicateProductionMappings',
  'heavyToolsIncorrectlyTargetingCpu',
  'native_gpu_runtime_proof_result_accepted',
  'reviewed_private_model_weight_manifest',
  'browser_canvas_webgl_runtime_sandbox_proof',
  'acceptedEvidenceGates',
  'remainingEvidenceGates',
  'committedRuntimeProofs',
  'nodeRuntimeProofAccepted',
  'browserRuntimeProofAccepted',
  'satoriFontRuntimeProofAccepted',
  'production profile workerType must move away from planning_only',
]) {
  if (!moduleSource.includes(token) && !markdown.includes(token) && !JSON.stringify(docPacket).includes(token)) {
    fail(`missing_contract_token:${token}`)
  }
}

for (const token of [
  'reportOnly: true',
  'committedRuntimeProofPacketsRead: true',
  'nodeRuntimeProofPacketAccepted',
  'browserRuntimeProofPacketAccepted',
  'satoriFontRuntimeProofPacketAccepted',
  'dependencyInstallPerformed: false',
  'gpuRuntimePerformed: false',
  'modelWeightsLoaded: false',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const key of [
  'betaActivationGapReportPrepared',
  'committedNodeRuntimeProofAccepted',
  'committedBrowserRuntimeProofAccepted',
  'committedSatoriFontRuntimeProofAccepted',
  'sourceBetaReadinessGateAccepted',
  'all21ToolsCovered',
  'all21ToolsProperlyInstalledForPlannedSurface',
  'all21ToolsMappedToProductionRegistry',
  'noDuplicateProductionMappings',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]) {
  if (docPacket.booleans?.[key] !== true) fail(`doc_required_true_boolean_not_true:${key}`)
  if (report.booleans?.[key] !== true) fail(`report_required_true_boolean_not_true:${key}`)
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
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (docPacket.booleans?.[key] !== false) fail(`doc_required_false_boolean_not_false:${key}`)
  if (report.booleans?.[key] !== false) fail(`report_required_false_boolean_not_false:${key}`)
}

const forbiddenTruePatterns = [
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
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /modelInferencePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

for (const [label, text] of [
  ['module', moduleSource],
  ['cli', cliSource],
  ['markdown', markdown],
  ['docPacket', JSON.stringify(docPacket)],
  ['report', JSON.stringify(report)],
]) {
  for (const pattern of forbiddenTruePatterns) {
    if (pattern.test(text)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

const packageLockDiff = git(['diff', '--name-only', '--', 'package-lock.json'])
if (packageLockDiff) fail('package_lock_changed')

const changedPackageJson = git(['diff', '--', 'package.json'])
if (/dependencies|devDependencies|optionalDependencies|peerDependencies/.test(changedPackageJson)) {
  fail('package_dependency_section_changed')
}

const changedFiles = git(['diff', '--name-only'])
for (const file of changedFiles.split('\n').filter(Boolean)) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|build|coverage|public\/generated|generated|render|renders|browser-output|canvas-output|webgl-output|media-output)\//i.test(file)) {
    fail(`generated_output_changed:${file}`)
  }
}

try {
  git(['cat-file', '-e', `${baseRef}:package-lock.json`])
  const lockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
  if (lockDiff) fail('package_lock_differs_from_base')
} catch {
  fail(`base_ref_unavailable:${baseRef}`)
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: report.decision,
  toolsCovered: report.totalAiGraphicsTools,
  properInstallForPlannedSurface: report.properInstallForPlannedSurface,
  productionMappedTools: report.productionMappedTools,
  duplicateProductionMappings: report.duplicateProductionMappings,
  gpuRuntimeTargetedTools: report.gpuRuntimeTargetedTools.length,
  heavyToolsIncorrectlyTargetingCpu: report.heavyToolsIncorrectlyTargetingCpu,
  betaActivationReadyTools: report.betaActivationReadyTools,
  blockedTools: report.blockedTools,
  committedBrowserRuntimeProofAccepted: report.committedRuntimeProofs?.browserRuntimeProofAccepted,
  agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: report.booleans.runtimeReadyNow,
  packageLockChanged: false,
}, null, 2))
