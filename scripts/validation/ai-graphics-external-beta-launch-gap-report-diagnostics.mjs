import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-launch-gap-report'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-launch-gap-report.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-launch-gap-report:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-launch-gap-report-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'

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

const finalLaunchGateBlockers = [
  'external beta launch switch is not approved',
  'external beta rollout cohort is not approved',
  'external beta cost and concurrency ceiling is not approved',
  'external beta rollback and incident-response runbook is not approved for live users',
  'external beta private artifact retention and support ownership are not approved',
]

const falseGateKeys = [
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

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function acceptedRecord(toolId) {
  const prefix = `external-beta-evidence://${toolId}`
  return {
    toolId,
    internalRuntimeSoakEvidenceRef: `${prefix}:internal-runtime-soak`,
    externalBetaQaEvidenceRef: `${prefix}:external-qa`,
    costConcurrencyPrivacyRollbackEvidenceRef: `${prefix}:cost-concurrency-privacy-rollback`,
    incidentResponseEvidenceRef: `${prefix}:incident-response`,
    ownerApprovalRef: `${prefix}:owner-approval`,
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts',
  'server/cli/ai-graphics-external-beta-launch-gap-report.ts',
  'server/tool-registry/ai-graphics-external-beta-evidence-scaffold.ts',
  'server/tool-registry/ai-graphics-external-beta-evidence-packet.ts',
  'server/tool-registry/ai-graphics-external-beta-readiness-gate.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-scaffold.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.md')
const source = read('server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts')
const cli = read('server/cli/ai-graphics-external-beta-launch-gap-report.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-launch-gap-report'")) {
  fail('server_registry_index_missing_external_beta_launch_gap_report_export')
}
if (docs.decision !== 'ai_graphics_external_beta_launch_gap_report_prepared_with_remaining_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  evidenceScaffoldRecordsPrepared: 21,
  installReadyTools: 21,
  productionMappedTools: 21,
  planningSelectableTools: 21,
  gpuRuntimeTargetedTools: 8,
  defaultExternalBetaCandidatesWithProvidedEvidenceTools: 0,
  fullEvidenceExternalBetaCandidatesWithProvidedEvidenceTools: 21,
  externalBetaReadyNowTools: 0,
  externalBetaBlockedNowTools: 21,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
if (gpuTools.length !== 8) fail('diagnostic_gpu_tool_count_not_8')

for (const blocker of finalLaunchGateBlockers) {
  if (!docs.remainingExternalBetaLaunchGates?.includes(blocker)) {
    fail(`docs_missing_launch_gate_blocker:${blocker}`)
  }
  if (!source.includes(blocker)) fail(`source_missing_launch_gate_blocker:${blocker}`)
}
for (const sequenceNeedle of [
  'Generate local-only external-beta evidence templates',
  'Replace all rejected public placeholders with private/backend evidence refs',
  'Validate the sanitized evidence',
  'Feed the validated packet into ai-graphics:external-beta-readiness-gate',
  'Run a separate external-beta launch go/no-go',
]) {
  if (!source.includes(sequenceNeedle)) fail(`source_missing_launch_sequence:${sequenceNeedle}`)
}
for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION',
  'buildAiGraphicsExternalBetaLaunchGapReport',
  'buildAiGraphicsExternalBetaReadinessGate',
  'buildAiGraphicsExternalBetaEvidenceScaffoldPacket',
  'externalBetaReadyNowTools: 0',
  'externalBetaBlockedNowTools: 21',
  'productionReadyNowTools: 0',
  'gpuRuntimeOnDemandOnly: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-evidence-packet',
  '--all-shared-gates-passed',
  '--all-external-beta-evidence-passed',
  'reportOnly: true',
  'toolExecutionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}

for (const key of [
  'externalBetaLaunchGapReportPrepared',
  'sourceExternalBetaReadinessGateAccepted',
  'sourceExternalBetaEvidenceScaffoldAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ToolsInstalledForPlannedSurface',
  'all21ToolsMappedToProductionRegistry',
  'evidenceScaffoldPreparedForAll21Tools',
  'gpuRuntimeOnDemandOnly',
  'externalBetaCandidatesWithProvidedEvidence',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
if (!scorecard.includes('ai_graphics_external_beta_launch_gap_report_prepared_with_remaining_blocks')) {
  fail('scorecard_missing_external_beta_launch_gap_report_decision')
}
if (!docsMd.includes('External-beta-ready now: `0`')) fail('markdown_missing_external_beta_ready_zero')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-launch-gap-'))
const fullRecordsPath = writeJson(path.join(tempRoot, 'full-records.json'), allTools.map(acceptedRecord))
const fullPacketPath = writeJson(
  path.join(tempRoot, 'full-packet.json'),
  parseJsonOutput(
    runNpm(packetScriptName, ['--evidence-records', fullRecordsPath]),
    'full_packet_source',
  ),
)

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_launch_gap_report')
const fullOutput = parseJsonOutput(runNpm(runScriptName, [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  '--external-beta-evidence-packet',
  fullPacketPath,
]), 'full_launch_gap_report')

if (defaultOutput.externalBetaCandidatesWithProvidedEvidenceTools !== 0) {
  fail('default_launch_gap_candidates_not_0')
}
if (defaultOutput.externalBetaReadyNowTools !== 0) fail('default_launch_gap_ready_now_not_0')
if (defaultOutput.externalBetaBlockedNowTools !== 21) fail('default_launch_gap_blocked_not_21')
if (defaultOutput.productionReadyNowTools !== 0) fail('default_launch_gap_production_not_0')
if (defaultOutput.booleans?.externalBetaCandidatesWithProvidedEvidence !== false) {
  fail('default_launch_gap_candidate_boolean_not_false')
}

if (fullOutput.externalBetaCandidatesWithProvidedEvidenceTools !== 21) {
  fail('full_launch_gap_candidates_not_21')
}
if (fullOutput.externalBetaReadyNowTools !== 0) fail('full_launch_gap_ready_now_not_0')
if (fullOutput.externalBetaBlockedNowTools !== 21) fail('full_launch_gap_blocked_not_21')
if (fullOutput.productionReadyNowTools !== 0) fail('full_launch_gap_production_not_0')
if (fullOutput.booleans?.externalBetaCandidatesWithProvidedEvidence !== true) {
  fail('full_launch_gap_candidate_boolean_not_true')
}
for (const tool of allTools) {
  const defaultTool = defaultOutput.tools?.find((entry) => entry.toolId === tool)
  const fullTool = fullOutput.tools?.find((entry) => entry.toolId === tool)
  if (!defaultTool) fail(`default_output_missing_tool:${tool}`)
  if (!fullTool) fail(`full_output_missing_tool:${tool}`)
  if (defaultTool?.externalBetaReadyNow !== false) fail(`default_tool_ready_now_not_false:${tool}`)
  if (fullTool?.externalBetaReadyNow !== false) fail(`full_tool_ready_now_not_false:${tool}`)
  if (fullTool?.productionReadyNow !== false) fail(`full_tool_production_not_false:${tool}`)
  for (const blocker of finalLaunchGateBlockers) {
    if (!fullTool?.remainingLaunchGates?.includes(blocker)) {
      fail(`full_tool_missing_remaining_launch_gate:${tool}:${blocker}`)
    }
  }
}
for (const tool of gpuTools) {
  const fullTool = fullOutput.tools?.find((entry) => entry.toolId === tool)
  if (fullTool?.gpuRequiredForRuntime !== true) fail(`gpu_tool_not_gpu_required:${tool}`)
}

for (const output of [defaultOutput, fullOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json',
  'server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts',
  'server/cli/ai-graphics-external-beta-launch-gap-report.ts',
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
  /providerRuntimePerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

if (git(['diff', '--', 'package-lock.json'])) fail('package_lock_changed')

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

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-launch-go-no-go": "tsx server/cli/ai-graphics-external-beta-launch-go-no-go.ts",',
  '+    "ai-graphics:external-beta-launch-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-runtime-admission": "tsx server/cli/ai-graphics-external-beta-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-tool-call-gateway": "tsx server/cli/ai-graphics-external-beta-tool-call-gateway.ts",',
  '+    "ai-graphics:external-beta-tool-call-gateway:diagnostics": "node scripts/validation/ai-graphics-external-beta-tool-call-gateway-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter": "tsx server/cli/ai-graphics-external-beta-worker-enqueue-adapter.ts",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-enqueue-adapter-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-backend-queue-submission": "tsx server/cli/ai-graphics-external-beta-backend-queue-submission.ts",',
  '+    "ai-graphics:external-beta-backend-queue-submission:diagnostics": "node scripts/validation/ai-graphics-external-beta-backend-queue-submission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction": "tsx server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-transaction-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-local-queue-storage": "tsx server/cli/ai-graphics-external-beta-local-queue-storage.ts",',
  '+    "ai-graphics:external-beta-local-queue-storage:diagnostics": "node scripts/validation/ai-graphics-external-beta-local-queue-storage-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge": "tsx server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-queue-service-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /(generated|render|renders|media|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i.test(file))) {
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
  gpuToolsCovered: gpuTools.length,
  defaultExternalBetaCandidatesWithProvidedEvidenceTools:
    defaultOutput.externalBetaCandidatesWithProvidedEvidenceTools,
  fullExternalBetaCandidatesWithProvidedEvidenceTools:
    fullOutput.externalBetaCandidatesWithProvidedEvidenceTools,
  externalBetaReadyNowTools: fullOutput.externalBetaReadyNowTools,
  externalBetaBlockedNowTools: fullOutput.externalBetaBlockedNowTools,
  productionReadyNowTools: fullOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: fullOutput.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeApprovedNow: fullOutput.booleans?.gpuRuntimeApprovedNow,
}, null, 2))
