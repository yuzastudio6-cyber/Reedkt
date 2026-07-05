import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-worker-payload-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-worker-payload-readiness.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-worker-payload-readiness:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-internal-beta-worker-payload-readiness-diagnostics.mjs'

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

const payloadFields = [
  'jobId',
  'workspaceId',
  'projectId',
  'approvedSnapshotId',
  'editPlanId',
  'creditReservationId',
  'workerType',
  'executionMode',
  'idempotencyKey',
  'attempt',
  'maxAttempts',
  'toolId',
  'productionToolId',
  'runtimeTarget',
  'capabilityIds',
  'toolStrategyId',
  'privateArtifactManifestRef',
  'runtimeActivationPolicy',
  'expectedOutputRefs',
]

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-worker-payload-readiness-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  const nativeGpuProofCollectionPacketPath = path.join(root, 'native-gpu-proof-collection-packet.json')
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
  fs.writeFileSync(
    nativeGpuProofCollectionPacketPath,
    `${JSON.stringify(acceptedNativeGpuProofCollectionPacket(), null, 2)}\n`,
    'utf8',
  )
  return { manifestPacketPath, gpuPacketPath, nativeGpuProofCollectionPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-worker-payload-readiness.ts',
  'server/cli/ai-graphics-internal-beta-worker-payload-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-worker-payload-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-worker-payload-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-worker-payload-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-dry-run-readiness.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-worker-payload-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-worker-payload-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-worker-payload-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-worker-payload-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-internal-beta-worker-payload-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_worker_payload_readiness')
}
if (docs.decision !== 'ai_graphics_internal_beta_worker_payload_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_worker_payloads_ready',
]) {
  if (!docs.states?.includes(status)) fail(`docs_missing_status:${status}`)
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const field of payloadFields) {
  if (!docs.payloadFields?.includes(field)) fail(`docs_missing_payload_field:${field}`)
  if (!moduleSource.includes(field)) fail(`module_missing_payload_field:${field}`)
}
for (const token of [
  'metadata_dry_run_payload_only',
  'idempotencyKey',
  'creditReservationId',
  'privateArtifactManifestRef',
  'runtimeActivationPolicy',
  '--credit-reservation-id',
  'expectedOutputRefs',
  '--require-owner-approved-worker-payloads-ready',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token)) {
    fail(`source_missing:${token}`)
  }
}
if (docs.counts?.workerPayloadsPrepared !== 21) fail('docs_worker_payloads_not_21')
if (docs.counts?.capabilityPayloadScenariosPrepared !== 12) fail('docs_capability_payloads_not_12')
if (docs.counts?.ownerApprovedWorkerPayloadsReadyWithProvidedEvidence !== 21) fail('docs_owner_payloads_not_21')
if (docs.counts?.ownerApprovedCapabilityPayloadScenariosReadyWithProvidedEvidence !== 12) {
  fail('docs_owner_capability_payloads_not_12')
}
if (docs.counts?.workerPayloadsReadyNow !== 0) fail('docs_payloads_ready_now_not_0')
if (docs.runtimeTargets?.gpuRuntimeOnDemandOnly !== true) fail('docs_gpu_runtime_not_on_demand')
if (docs.runtimeTargets?.noIdleGpuRuntimeApproved !== true) fail('docs_idle_gpu_policy_not_blocked')
if (docs.runtimeTargets?.startsOnlyForApprovedWorkerOrToolCall !== true) {
  fail('docs_gpu_start_policy_not_worker_call_only')
}
if (docs.runtimeTargets?.cpuFallbackAllowedForHeavyTools !== false) fail('docs_cpu_fallback_not_false')

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_worker_payload')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.ownerApprovedPayloadEvidenceAccepted !== false) fail('default_owner_payload_not_false')
if (defaultOutput.workerPayloadsReadyWithProvidedEvidence !== 0) fail('default_payloads_not_0')

const { manifestPacketPath, gpuPacketPath, nativeGpuProofCollectionPacketPath } = writeAcceptedEvidencePackets()
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
    '--external-beta-native-gpu-proof-collection-packet',
    nativeGpuProofCollectionPacketPath,
    '--require-owner-approved-worker-payloads-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)
if (awaitingOutput.ownerApprovedPayloadEvidenceAccepted !== false) fail('awaiting_owner_payload_not_false')

const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--external-beta-native-gpu-proof-collection-packet',
  nativeGpuProofCollectionPacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--require-owner-approved-worker-payloads-ready',
]), 'approved_worker_payload')

if (approvedOutput.status !== 'owner_approved_worker_payloads_ready') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.ownerApprovedPayloadEvidenceAccepted !== true) fail('approved_owner_payload_not_true')
if (approvedOutput.workerPayloadsPrepared !== 21) fail('approved_worker_payloads_not_21')
if (approvedOutput.capabilityPayloadScenariosPrepared !== 12) fail('approved_capability_payloads_not_12')
if (approvedOutput.workerPayloadsReadyWithProvidedEvidence !== 21) fail('approved_ready_payloads_not_21')
if (approvedOutput.capabilityPayloadScenariosReadyWithProvidedEvidence !== 12) fail('approved_ready_capability_payloads_not_12')
if (approvedOutput.workerPayloadsReadyNow !== 0) fail('approved_payloads_ready_now_not_0')
if (approvedOutput.workerPayloads?.length !== 21) fail('approved_payload_length_not_21')
if (approvedOutput.capabilityPayloadScenarios?.length !== 12) fail('approved_capability_payload_length_not_12')

for (const payload of approvedOutput.workerPayloads ?? []) {
  for (const field of payloadFields) {
    if (!Object.hasOwn(payload, field)) fail(`approved_payload_missing_field:${payload.toolId}:${field}`)
  }
  if (payload.executionMode !== 'metadata_dry_run_payload_only') fail(`payload_bad_execution_mode:${payload.toolId}`)
  if (!payload.idempotencyKey?.startsWith('ai_graphics_beta_')) fail(`payload_bad_idempotency:${payload.toolId}`)
  if (!payload.creditReservationId) fail(`payload_missing_credit_reservation:${payload.toolId}`)
  if (!Array.isArray(payload.expectedOutputRefs) || payload.expectedOutputRefs.length !== 3) {
    fail(`payload_bad_expected_outputs:${payload.toolId}`)
  }
  if (payload.privateArtifactManifestRef.includes('signed') || payload.privateArtifactManifestRef.includes('http')) {
    fail(`payload_private_manifest_ref_not_private:${payload.toolId}`)
  }
  if (payload.canQueueWorkerNow !== false) fail(`payload_queue_not_false:${payload.toolId}`)
  if (payload.canExecuteWorkerNow !== false) fail(`payload_execute_not_false:${payload.toolId}`)
  if (payload.runtimeActivationPolicy?.onDemandOnly !== true) fail(`payload_gpu_policy_not_on_demand:${payload.toolId}`)
  if (payload.runtimeActivationPolicy?.noIdleGpuRuntimeApproved !== true) fail(`payload_idle_gpu_allowed:${payload.toolId}`)
  if (payload.runtimeActivationPolicy?.startsOnlyForApprovedWorkerOrToolCall !== true) {
    fail(`payload_gpu_start_policy_not_worker_call_only:${payload.toolId}`)
  }
  if (payload.runtimeActivationPolicy?.cpuFallbackAllowedForHeavyTools !== false) {
    fail(`payload_cpu_fallback_not_false:${payload.toolId}`)
  }
  if (gpuTools.includes(payload.toolId)) {
    if (payload.workerType !== 'gpu_ai_worker') fail(`gpu_tool_not_gpu_worker:${payload.toolId}:${payload.workerType}`)
    if (!payload.runtimeTarget.includes('nvidia_l4')) fail(`gpu_tool_not_l4_target:${payload.toolId}:${payload.runtimeTarget}`)
  }
}

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_worker_payload_readiness_contract_prepared_with_fail_closed_runtime')) {
  fail('scorecard_missing_internal_beta_worker_payload_readiness_decision')
}

const forbiddenTruePatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
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
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
const combinedText = [
  'docs/tool-intelligence/ai-graphics/internal-beta-worker-payload-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-worker-payload-readiness.json',
  'server/tool-registry/ai-graphics-internal-beta-worker-payload-readiness.ts',
  'server/cli/ai-graphics-internal-beta-worker-payload-readiness.ts',
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

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  toolsCovered: allTools.length,
  workerPayloadsReadyWithProvidedEvidence: approvedOutput.workerPayloadsReadyWithProvidedEvidence,
  capabilityPayloadScenariosReadyWithProvidedEvidence: approvedOutput.capabilityPayloadScenariosReadyWithProvidedEvidence,
  workerPayloadsReadyNow: approvedOutput.workerPayloadsReadyNow,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
}, null, 2))
