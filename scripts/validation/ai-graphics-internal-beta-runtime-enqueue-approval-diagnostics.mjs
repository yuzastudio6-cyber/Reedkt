import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-runtime-enqueue-approval'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-runtime-enqueue-approval:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs'

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

const gpuToolIds = new Set([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-runtime-enqueue-approval-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  fs.writeFileSync(
    manifestPacketPath,
    `${JSON.stringify(acceptedModelWeightManifestReviewPacket(), null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    gpuPacketPath,
    `${JSON.stringify(acceptedGpuRuntimeProofResultPacket(), null, 2)}\n`,
    'utf8',
  )
  return { manifestPacketPath, gpuPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-runtime-enqueue-approval.ts',
  'server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts',
  'scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-runtime-enqueue-approval.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-runtime-enqueue-approval.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go-owner-approval.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-runtime-enqueue-approval.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-runtime-enqueue-approval.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-runtime-enqueue-approval.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-runtime-enqueue-approval'")) {
  fail('server_registry_index_does_not_export_internal_beta_runtime_enqueue_approval')
}

if (docs.decision !== 'ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecision !== 'ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks') {
  fail(`unexpected_docs_source_decision:${docs.sourceDecision}`)
}

for (const status of [
  'missing_owner_approval_evidence',
  'awaiting_internal_beta_runtime_enqueue_approval',
  'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked',
]) {
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
  if (!docs.toolScopes?.some((scope) => scope.toolId === tool)) fail(`docs_missing_tool_scope:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
  if (!markdown.includes(`\`${capability}\``)) fail(`markdown_missing_capability:${capability}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  enqueueScopeCandidateToolsWithProvidedEvidence: 21,
  enqueueScopeApprovedToolsWithProvidedEvidence: 21,
  gpuRuntimeTargetedTools: 8,
  heavyToolsIncorrectlyTargetingCpu: 0,
  liveWorkerQueueApprovedNowTools: 0,
  liveWorkerExecutionApprovedNowTools: 0,
  internalBetaReadyNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count_mismatch:${key}:${docs.counts?.[key]}`)
}

for (const [key, expected] of Object.entries({
  accepted: true,
  approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  approvalRef: 'AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_PACKET',
  approvesLiveQueueNow: false,
  approvesRuntimeNow: false,
})) {
  if (docs.runtimeEnqueueApprovalRecord?.[key] !== expected) {
    fail(`docs_enqueue_record_mismatch:${key}:${docs.runtimeEnqueueApprovalRecord?.[key]}`)
  }
}

for (const action of [
  'name productionToolId, workerType, runtimeTarget, and capability ids for each AI graphics tool',
  'confirm internal beta enqueue scope candidates for all 21 tools with provided evidence',
  'confirm eight heavy/model tools target GPU worker runtime lanes',
  'record a future runtime-enqueue approval reference without enqueueing work',
  'return live queue, execution, artifact, external beta, and production blockers',
  'bind GPU runtime activation to on-demand approved worker or tool calls only',
]) {
  if (!docs.allowedRuntimeEnqueueScopeActions?.includes(action)) fail(`docs_missing_allowed_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_allowed_action:${action}`)
}

for (const action of [
  'live worker queue enqueue',
  'idle or always-on GPU runtime',
  'worker execution',
  'Tool Route execution',
  'production worker dispatch',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'signed URL creation',
  'public artifact creation',
  'internal beta runtime unlock',
  'external beta unlock',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(action)) fail(`docs_missing_blocked_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_blocked_action:${action}`)
}

for (const key of [
  'internalBetaRuntimeEnqueueApprovalPrepared',
  'sourceGoNoGoOwnerApprovalAccepted',
  'internalBetaRuntimeEnqueueApprovalRecordAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21RuntimeEnqueueScopesPrepared',
  'all21RuntimeEnqueueScopesApprovedWithProvidedEvidence',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}
for (const [key, expected] of Object.entries({
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  gpuStartsOnlyForApprovedWorkerOrToolCall: true,
  cpuFallbackAllowedForHeavyTools: false,
})) {
  if (docs.booleans?.[key] !== expected) fail(`docs_gpu_policy_boolean_mismatch:${key}:${docs.booleans?.[key]}`)
}
for (const [key, expected] of Object.entries({
  onDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  startsOnlyForApprovedWorkerOrToolCall: true,
  cpuFallbackAllowedForHeavyTools: false,
})) {
  if (docs.gpuRuntimeActivationPolicy?.[key] !== expected) {
    fail(`docs_gpu_activation_policy_mismatch:${key}:${docs.gpuRuntimeActivationPolicy?.[key]}`)
  }
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_runtime_enqueue')
if (defaultOutput.status !== 'missing_owner_approval_evidence') fail(`default_status:${defaultOutput.status}`)

const { manifestPacketPath, gpuPacketPath } = writeAcceptedEvidencePackets()
const commonArgs = [
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
]

let awaitingExited = false
let awaitingOutputText = ''
try {
  awaitingOutputText = runNpm(runScriptName, [
    ...commonArgs,
    '--require-internal-beta-runtime-enqueue-approved',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_runtime_enqueue')
if (!awaitingExited) fail('awaiting_runtime_enqueue_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_internal_beta_runtime_enqueue_approval') {
  fail(`awaiting_status:${awaitingOutput.status}`)
}

const approvedArgs = [
  ...commonArgs,
  '--internal-beta-runtime-enqueue-approval-granted',
  '--internal-beta-runtime-enqueue-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_LOCAL_FIXTURE',
  '--require-internal-beta-runtime-enqueue-approved',
]
const approvedOutput = parseJsonOutput(runNpm(runScriptName, approvedArgs), 'approved_runtime_enqueue')
if (approvedOutput.status !== 'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.enqueueScopeApprovedToolsWithProvidedEvidence !== 21) fail('approved_scopes_not_21')
if (approvedOutput.gpuRuntimeTargetedTools !== 8) fail('approved_gpu_targets_not_8')
if (approvedOutput.heavyToolsIncorrectlyTargetingCpu !== 0) fail('approved_heavy_cpu_mismatch')
if (!Array.isArray(approvedOutput.toolScopes) || approvedOutput.toolScopes.length !== 21) {
  fail('approved_tool_scopes_not_21')
}
for (const tool of allTools) {
  const scope = approvedOutput.toolScopes?.find((candidate) => candidate.toolId === tool)
  if (!scope) fail(`approved_missing_tool_scope:${tool}`)
  if (scope?.enqueueScopeApprovedWithProvidedEvidence !== true) fail(`approved_tool_scope_not_approved:${tool}`)
  if (scope?.liveWorkerQueueApprovedNow !== false) fail(`approved_tool_live_queue_not_false:${tool}`)
  if (scope?.liveWorkerExecutionApprovedNow !== false) fail(`approved_tool_live_execution_not_false:${tool}`)
  if (!scope?.productionToolId || !scope?.workerType || !scope?.runtimeTarget) {
    fail(`approved_tool_scope_missing_runtime_mapping:${tool}`)
  }
  if (gpuToolIds.has(tool)) {
    if (scope?.runtimeActivationPolicy?.onDemandOnly !== true) fail(`approved_tool_gpu_not_on_demand:${tool}`)
    if (scope?.runtimeActivationPolicy?.noIdleGpuRuntimeApproved !== true) fail(`approved_tool_idle_gpu_allowed:${tool}`)
    if (scope?.runtimeActivationPolicy?.startsOnlyForApprovedWorkerOrToolCall !== true) {
      fail(`approved_tool_gpu_start_policy_mismatch:${tool}`)
    }
    if (scope?.runtimeActivationPolicy?.cpuFallbackAllowedForHeavyTools !== false) {
      fail(`approved_tool_cpu_fallback_allowed:${tool}`)
    }
  } else if (scope?.runtimeActivationPolicy !== null) {
    fail(`approved_non_gpu_tool_has_gpu_policy:${tool}`)
  }
}

let liveQueueRequireExited = false
try {
  runNpm(runScriptName, [...approvedArgs, '--require-live-worker-queue'])
} catch {
  liveQueueRequireExited = true
}
if (!liveQueueRequireExited) fail('require_live_worker_queue_did_not_fail')

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_runtime_enqueue_decision')
}
if (!scorecard.includes('does not live-enqueue workers')) fail('scorecard_missing_live_enqueue_block')

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
  'docs/tool-intelligence/ai-graphics/internal-beta-runtime-enqueue-approval.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-runtime-enqueue-approval.json',
  'server/tool-registry/ai-graphics-internal-beta-runtime-enqueue-approval.ts',
  'server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts',
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
  '+    "ai-graphics:internal-beta-queue-admission-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-admission-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-adapter-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-adapter-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-dispatcher-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness": "tsx server/cli/ai-graphics-internal-beta-backend-queue-storage-readiness.ts",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-backend-queue-storage-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-queue-transaction-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-implementation-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs",',
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
  enqueueScopeApprovedToolsWithProvidedEvidence:
    approvedOutput.enqueueScopeApprovedToolsWithProvidedEvidence,
  gpuRuntimeTargetedTools: approvedOutput.gpuRuntimeTargetedTools,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  workerQueueApprovedNow: approvedOutput.booleans?.workerQueueApprovedNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  internalBetaReadyNow: approvedOutput.booleans?.internalBetaReadyNow,
  externalBetaReadyNow: approvedOutput.booleans?.externalBetaReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
