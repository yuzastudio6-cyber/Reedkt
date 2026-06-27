import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-launch-go-no-go'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-launch-go-no-go.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-launch-go-no-go:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-launch-go-no-go-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const launchGapScriptName = 'ai-graphics:external-beta-launch-gap-report'

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

const requiredLaunchFields = [
  'externalBetaLaunchRef',
  'externalBetaRolloutCohortRef',
  'externalBetaCostConcurrencyCeilingRef',
  'externalBetaRollbackIncidentRunbookRef',
  'externalBetaPrivateArtifactRetentionSupportRef',
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

const fullEvidenceArgs = [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
]

const launchApprovalArgs = [
  '--all-external-beta-launch-gates-approved',
  '--external-beta-launch-ref',
  'external-beta-launch://launch-switch-approved',
  '--external-beta-rollout-cohort-ref',
  'external-beta-launch://rollout-cohort-approved',
  '--external-beta-cost-concurrency-ceiling-ref',
  'external-beta-launch://cost-concurrency-ceiling-approved',
  '--external-beta-rollback-incident-runbook-ref',
  'external-beta-launch://rollback-incident-runbook-approved',
  '--external-beta-private-artifact-retention-support-ref',
  'external-beta-launch://private-artifact-retention-support-approved',
  '--external-beta-launch-approver-role',
  'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-launch-go-no-go.ts',
  'server/cli/ai-graphics-external-beta-launch-go-no-go.ts',
  'server/tool-registry/ai-graphics-external-beta-launch-gap-report.ts',
  'server/tool-registry/ai-graphics-external-beta-readiness-gate.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.md')
const source = read('server/tool-registry/ai-graphics-external-beta-launch-go-no-go.ts')
const cli = read('server/cli/ai-graphics-external-beta-launch-go-no-go.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-launch-go-no-go'")) {
  fail('server_registry_index_missing_external_beta_launch_go_no_go_export')
}
if (docs.decision !== 'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultExternalBetaLaunchCandidateToolsWithProvidedEvidence: 0,
  fullEvidenceExternalBetaLaunchCandidateToolsWithProvidedEvidence: 21,
  fullLaunchApprovalExternalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: 21,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const field of requiredLaunchFields) {
  if (!source.includes(field)) fail(`source_missing_launch_field:${field}`)
}
for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION',
  'buildAiGraphicsExternalBetaLaunchGoNoGo',
  'buildAiGraphicsExternalBetaLaunchGapReport',
  'externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'gpuRuntimeOnDemandOnly: true',
  'agentCanExecuteToolsNow: false',
  'external beta user traffic enablement',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-launch-gap-report-packet',
  '--external-beta-evidence-packet',
  '--all-external-beta-launch-gates-approved',
  '--external-beta-launch-ref',
  '--external-beta-private-artifact-retention-support-ref',
  'evaluatorOnly: true',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const key of [
  'externalBetaLaunchGoNoGoContractPrepared',
  'sourceExternalBetaLaunchGapAccepted',
  'externalBetaLaunchCandidateWithProvidedEvidence',
  'externalBetaLaunchGoNoGoApprovalRecordAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
if (!docsMd.includes('External-beta-ready now: `0`')) fail('markdown_missing_external_beta_ready_zero')
if (!scorecard.includes('ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_external_beta_launch_go_no_go_decision')
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-launch-go-no-go-'))
const fullRecordsPath = writeJson(path.join(tempRoot, 'full-records.json'), allTools.map(acceptedRecord))
const fullPacketPath = writeJson(
  path.join(tempRoot, 'full-packet.json'),
  parseJsonOutput(
    runNpm(packetScriptName, ['--evidence-records', fullRecordsPath]),
    'full_packet_source',
  ),
)
const fullLaunchGapPath = writeJson(
  path.join(tempRoot, 'full-launch-gap-report.json'),
  parseJsonOutput(
    runNpm(launchGapScriptName, [
      ...fullEvidenceArgs,
      '--external-beta-evidence-packet',
      fullPacketPath,
    ]),
    'full_launch_gap_source',
  ),
)

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_launch_go_no_go')
const fullEvidenceOutput = parseJsonOutput(runNpm(runScriptName, [
  ...fullEvidenceArgs,
  '--external-beta-evidence-packet',
  fullPacketPath,
]), 'full_evidence_launch_go_no_go')
const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
  ...fullEvidenceArgs,
  '--external-beta-evidence-packet',
  fullPacketPath,
  ...launchApprovalArgs,
]), 'approved_launch_go_no_go')
const packetFedApprovedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-launch-gap-report-packet',
  fullLaunchGapPath,
  ...launchApprovalArgs,
]), 'packet_fed_approved_launch_go_no_go')

if (defaultOutput.status !== 'missing_external_beta_candidate_evidence') {
  fail(`default_status_unexpected:${defaultOutput.status}`)
}
if (defaultOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 0) {
  fail('default_candidate_tools_not_0')
}
if (defaultOutput.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 0) {
  fail('default_approved_tools_not_0')
}

if (fullEvidenceOutput.status !== 'awaiting_external_beta_launch_go_no_go_approval') {
  fail(`full_evidence_status_unexpected:${fullEvidenceOutput.status}`)
}
if (fullEvidenceOutput.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 21) {
  fail('full_evidence_candidate_tools_not_21')
}
if (fullEvidenceOutput.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 0) {
  fail('full_evidence_approved_tools_not_0')
}
if (!fullEvidenceOutput.missingLaunchGoNoGoEvidence?.includes('external_beta_launch_ref')) {
  fail('full_evidence_missing_launch_ref_not_reported')
}

for (const [label, output] of Object.entries({
  approvedOutput,
  packetFedApprovedOutput,
})) {
  if (output.status !== 'external_beta_launch_go_no_go_approved_runtime_still_blocked') {
    fail(`${label}_status_unexpected:${output.status}`)
  }
  if (output.externalBetaLaunchCandidateToolsWithProvidedEvidence !== 21) {
    fail(`${label}_candidate_tools_not_21`)
  }
  if (output.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_approved_tools_not_21`)
  }
  if (output.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_ready_now_not_0`)
  if (output.productionReadyNowTools !== 0) fail(`${label}_production_ready_now_not_0`)
  if (output.booleans?.all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence !== true) {
    fail(`${label}_approved_boolean_not_true`)
  }
}

for (const output of [defaultOutput, fullEvidenceOutput, approvedOutput, packetFedApprovedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'server/tool-registry/ai-graphics-external-beta-launch-go-no-go.ts',
  'server/cli/ai-graphics-external-beta-launch-go-no-go.ts',
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
  defaultStatus: defaultOutput.status,
  fullEvidenceStatus: fullEvidenceOutput.status,
  approvedStatus: approvedOutput.status,
  packetFedApprovedStatus: packetFedApprovedOutput.status,
  externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence:
    approvedOutput.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence,
  externalBetaReadyNowTools: approvedOutput.externalBetaReadyNowTools,
  productionReadyNowTools: approvedOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeApprovedNow: approvedOutput.booleans?.gpuRuntimeApprovedNow,
}, null, 2))
