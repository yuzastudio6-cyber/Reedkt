import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-go-no-go'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-go-no-go.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-go-no-go:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs'

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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
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
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
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

function writeAcceptedEvidencePackets() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-internal-beta-go-no-go-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  fs.writeFileSync(manifestPacketPath, `${JSON.stringify({
    manifestRecordsProvided: 5,
    schemaValidManifestRecords: 5,
    reviewAcceptedManifestRecords: 5,
    nativeGpuProofInputEligibleRecords: 5,
    privateArtifactRefsLogged: 0,
    booleans: {
      privateArtifactRefsNotLogged: true,
      publicOrSignedArtifactRefsRejected: true,
    },
  }, null, 2)}\n`, 'utf8')
  fs.writeFileSync(gpuPacketPath, `${JSON.stringify({
    runtimeProofResultsProvided: 4,
    runtimeProofResultsAcceptedForOwnerReview: 4,
    nativeGpuRuntimeProofResultsAccepted: true,
    booleans: {
      nativeGpuRuntimeProofResultsAcceptedForOwnerReview: true,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
    },
  }, null, 2)}\n`, 'utf8')
  return { manifestPacketPath, gpuPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-go-no-go.ts',
  'server/cli/ai-graphics-internal-beta-go-no-go.ts',
  'scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.md',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-go-no-go.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-go-no-go.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-go-no-go'")) {
  fail('server_registry_index_does_not_export_internal_beta_go_no_go')
}

if (docs.decision !== 'ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'awaiting_internal_beta_go_no_go_approval') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecision !== 'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_source_decision:${docs.sourceDecision}`)
}

for (const status of [
  'missing_technical_evidence',
  'awaiting_internal_beta_go_no_go_approval',
  'internal_beta_go_no_go_approved_runtime_still_blocked',
]) {
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
  if (!markdown.includes(`\`${capability}\``)) fail(`markdown_missing_capability:${capability}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  goNoGoCandidateToolsWithProvidedEvidence: 21,
  goNoGoCandidateCapabilitiesWithProvidedEvidence: 12,
  internalBetaGoNoGoApprovedToolsWithProvidedEvidence: 0,
  internalBetaReadyNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count_mismatch:${key}:${docs.counts?.[key]}`)
}

for (const [key, expected] of Object.entries({
  required: true,
  approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  goNoGoRefRequired: true,
  approvesRuntimeNow: false,
})) {
  if (docs.requiredApprovalRecord?.[key] !== expected) {
    fail(`docs_approval_record_mismatch:${key}:${docs.requiredApprovalRecord?.[key]}`)
  }
}

for (const action of [
  'accept all-21 install, ranking, GPU targeting, and cross-owner coordination evidence',
  'accept all-21 production worker gate checks with provided evidence and zero hard failures',
  'record owner go/no-go approval metadata for the future internal beta runtime lane',
  'return explicit runtime, Tool Route, Worker, artifact, external beta, and production blockers',
]) {
  if (!docs.allowedGoNoGoActions?.includes(action)) fail(`docs_missing_allowed_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_allowed_action:${action}`)
}

for (const action of [
  'Tool Route execution',
  'Worker queue enqueue',
  'production worker dispatch',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'signed URL creation',
  'public artifact creation',
  'external beta unlock',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(action)) fail(`docs_missing_blocked_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_blocked_action:${action}`)
}

for (const key of [
  'internalBetaGoNoGoContractPrepared',
  'sourceBetaProductionReadinessRollupAccepted',
  'internalBetaGoNoGoReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}

for (const key of [
  'internalBetaGoNoGoApprovalRecordAccepted',
  'all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence',
  ...falseGateKeys,
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_go_no_go')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== false) {
  fail('default_internal_beta_ready_with_evidence_not_false')
}

const { manifestPacketPath, gpuPacketPath } = writeAcceptedEvidencePackets()
let awaitingExited = false
let awaitingOutputText = ''
try {
  awaitingOutputText = runNpm(runScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--owner-approval-granted',
    '--owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
    '--require-internal-beta-go-no-go-approved',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_go_no_go')
if (!awaitingExited) fail('awaiting_internal_beta_go_no_go_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_internal_beta_go_no_go_approval') {
  fail(`awaiting_status:${awaitingOutput.status}`)
}
if (awaitingOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== true) {
  fail('awaiting_ready_with_provided_evidence_not_true')
}
if (awaitingOutput.booleans?.internalBetaGoNoGoApprovalRecordAccepted !== false) {
  fail('awaiting_approval_record_not_false')
}

const approvedArgs = [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--internal-beta-go-no-go-approved',
  '--internal-beta-go-no-go-ref',
  'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-approved',
]
const approvedOutput = parseJsonOutput(runNpm(runScriptName, approvedArgs), 'approved_go_no_go')
if (approvedOutput.status !== 'internal_beta_go_no_go_approved_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.totalAiGraphicsTools !== 21) fail('approved_total_tools_not_21')
if (approvedOutput.totalProductFacingCapabilities !== 12) fail('approved_capabilities_not_12')
if (approvedOutput.goNoGoCandidateToolsWithProvidedEvidence !== 21) {
  fail('approved_candidate_tools_not_21')
}
if (approvedOutput.goNoGoCandidateCapabilitiesWithProvidedEvidence !== 12) {
  fail('approved_candidate_capabilities_not_12')
}
if (approvedOutput.internalBetaGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
  fail('approved_tools_not_21')
}
if (approvedOutput.internalBetaReadyNowTools !== 0) fail('approved_internal_beta_now_tools_not_0')
if (approvedOutput.externalBetaReadyNowTools !== 0) fail('approved_external_beta_now_tools_not_0')
if (approvedOutput.productionReadyNowTools !== 0) fail('approved_production_now_tools_not_0')
if (approvedOutput.requiredApprovalRecord?.approverRole !== 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') {
  fail('approved_required_role_mismatch')
}
if (approvedOutput.requiredApprovalRecord?.approvesRuntimeNow !== false) {
  fail('approved_record_unexpectedly_approves_runtime')
}
if (approvedOutput.booleans?.all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence !== true) {
  fail('approved_all21_go_no_go_not_true')
}

let runtimeRequireExited = false
try {
  runNpm(runScriptName, [...approvedArgs, '--require-runtime-ready'])
} catch {
  runtimeRequireExited = true
}
if (!runtimeRequireExited) fail('require_runtime_ready_did_not_fail')

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_internal_beta_go_no_go_decision')
}
if (!scorecard.includes('awaiting_internal_beta_go_no_go_approval')) {
  fail('scorecard_missing_awaiting_internal_beta_go_no_go_status')
}

const forbiddenTruePatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /productionWorkerJobEnqueueApprovedNow["`:\s]+true/i,
  /productionWorkerDispatchApprovedNow["`:\s]+true/i,
  /productionWorkerRouteExecutionApprovedNow["`:\s]+true/i,
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
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /productionWorkerDispatchPerformed["`:\s]+true/i,
  /productionWorkerRouteExecutionPerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
const combinedText = [
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.json',
  'server/tool-registry/ai-graphics-internal-beta-go-no-go.ts',
  'server/cli/ai-graphics-internal-beta-go-no-go.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')
for (const pattern of forbiddenTruePatterns) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i.test(file))) {
  fail('generated_media_staged')
}
if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')

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
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval": "tsx server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-owner-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval": "tsx server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-admission-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-adapter-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-adapter-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-dispatcher-readiness-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  docsStatus: docs.status,
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  approvedToolsWithProvidedEvidence:
    approvedOutput.internalBetaGoNoGoApprovedToolsWithProvidedEvidence,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  routeExecutionApprovedNow: approvedOutput.booleans?.routeExecutionApprovedNow,
  workerExecutionApprovedNow: approvedOutput.booleans?.workerExecutionApprovedNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  internalBetaReadyNow: approvedOutput.booleans?.internalBetaReadyNow,
  externalBetaReadyNow: approvedOutput.booleans?.externalBetaReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
