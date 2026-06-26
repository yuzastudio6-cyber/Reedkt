import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-go-no-go-owner-approval'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-go-no-go-owner-approval:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-go-no-go-owner-approval-diagnostics.mjs'

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-go-no-go-owner-approval-'))
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
  'server/tool-registry/ai-graphics-internal-beta-go-no-go-owner-approval.ts',
  'server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts',
  'scripts/validation/ai-graphics-internal-beta-go-no-go-owner-approval-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-go-no-go-owner-approval.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-go-no-go-owner-approval.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-go-no-go-owner-approval.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-go-no-go-owner-approval'")) {
  fail('server_registry_index_does_not_export_internal_beta_go_no_go_owner_approval')
}

if (docs.decision !== 'ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'internal_beta_go_no_go_owner_approved_runtime_still_blocked') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecision !== 'ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_source_decision:${docs.sourceDecision}`)
}

for (const status of [
  'missing_technical_evidence',
  'awaiting_internal_beta_go_no_go_owner_approval',
  'internal_beta_go_no_go_owner_approved_runtime_still_blocked',
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
  ownerApprovedToolsWithProvidedEvidence: 21,
  ownerApprovedCapabilitiesWithProvidedEvidence: 12,
  internalBetaReadyNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count_mismatch:${key}:${docs.counts?.[key]}`)
}

for (const [key, expected] of Object.entries({
  accepted: true,
  approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  approvalRef: 'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_PACKET',
  approvesRuntimeNow: false,
})) {
  if (docs.ownerApprovalRecord?.[key] !== expected) {
    fail(`docs_owner_approval_record_mismatch:${key}:${docs.ownerApprovalRecord?.[key]}`)
  }
}

for (const scope of [
  'owner-approve the all-21 AI graphics internal beta go/no-go evidence record',
  'confirm all 21 tools remain installed or represented for their planned ReeditPro surface',
  'confirm eight heavy/model tools remain targeted to GPU worker runtime lanes',
  'confirm duplicate production tool mappings remain absent across owner lanes',
  'authorize only a future runtime-enqueue approval packet to evaluate internal beta runtime scope',
]) {
  if (!docs.approvedScope?.includes(scope)) fail(`docs_missing_approved_scope:${scope}`)
  if (!moduleSource.includes(scope)) fail(`module_missing_approved_scope:${scope}`)
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
  'internalBetaGoNoGoOwnerApprovalPrepared',
  'sourceInternalBetaGoNoGoAccepted',
  'internalBetaGoNoGoOwnerApprovalRecordAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}

for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_owner_approval')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)

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
    '--require-internal-beta-go-no-go-owner-approved',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'missing_technical_evidence') {
  fail(`awaiting_status:${awaitingOutput.status}`)
}
if (awaitingOutput.sourceGoNoGo?.status !== 'awaiting_internal_beta_go_no_go_approval') {
  fail(`awaiting_source_status:${awaitingOutput.sourceGoNoGo?.status}`)
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
  '--internal-beta-go-no-go-owner-approval-granted',
  '--internal-beta-go-no-go-owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-owner-approved',
]
const approvedOutput = parseJsonOutput(runNpm(runScriptName, approvedArgs), 'approved_owner_approval')
if (approvedOutput.status !== 'internal_beta_go_no_go_owner_approved_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.ownerApprovedToolsWithProvidedEvidence !== 21) fail('approved_tools_not_21')
if (approvedOutput.ownerApprovedCapabilitiesWithProvidedEvidence !== 12) {
  fail('approved_capabilities_not_12')
}
if (approvedOutput.sourceGoNoGo?.status !== 'internal_beta_go_no_go_approved_runtime_still_blocked') {
  fail(`approved_source_status:${approvedOutput.sourceGoNoGo?.status}`)
}
if (approvedOutput.ownerApprovalRecord?.approverRole !== 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') {
  fail('approved_owner_role_mismatch')
}
if (approvedOutput.ownerApprovalRecord?.approvesRuntimeNow !== false) {
  fail('approved_record_unexpectedly_approves_runtime')
}
if (approvedOutput.booleans?.all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence !== true) {
  fail('approved_all21_owner_approval_not_true')
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

if (!scorecard.includes('ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks')) {
  fail('scorecard_missing_internal_beta_go_no_go_owner_approval_decision')
}
if (!scorecard.includes('internal_beta_go_no_go_owner_approved_runtime_still_blocked')) {
  fail('scorecard_missing_owner_approval_status')
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
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go-owner-approval.json',
  'server/tool-registry/ai-graphics-internal-beta-go-no-go-owner-approval.ts',
  'server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts',
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
  '+    "ai-graphics:internal-beta-go-no-go": "tsx server/cli/ai-graphics-internal-beta-go-no-go.ts",',
  '+    "ai-graphics:internal-beta-go-no-go:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval": "tsx server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-admission-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-adapter-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-adapter-readiness-diagnostics.mjs",',
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
  ownerApprovedToolsWithProvidedEvidence:
    approvedOutput.ownerApprovedToolsWithProvidedEvidence,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  routeExecutionApprovedNow: approvedOutput.booleans?.routeExecutionApprovedNow,
  workerExecutionApprovedNow: approvedOutput.booleans?.workerExecutionApprovedNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  internalBetaReadyNow: approvedOutput.booleans?.internalBetaReadyNow,
  externalBetaReadyNow: approvedOutput.booleans?.externalBetaReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
