import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-queue-admission-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-queue-admission-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-queue-admission-readiness-diagnostics.mjs'

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

const expectedGpuRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

const requiredQueueAdmissionEvidence = [
  'approvedPlanSnapshotId',
  'creditReservationId',
  'privateArtifactManifestRef',
  'artifactBoundaryApprovalRef',
  'toolRouteApprovalRef',
  'workerApprovalRef',
  'workerQueueTransportRef',
  'workerIdempotencyNamespace',
  'internalBetaRuntimeOwnerApprovalRef',
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-queue-admission-'))
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

function acceptedSourceArgs(manifestPacketPath, gpuPacketPath) {
  return [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--owner-approval-granted',
    '--owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_PACKET',
    '--internal-beta-go-no-go-owner-approval-granted',
    '--internal-beta-go-no-go-owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_PACKET',
    '--internal-beta-runtime-enqueue-approval-granted',
    '--internal-beta-runtime-enqueue-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_PACKET',
  ]
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-queue-admission-readiness.ts',
  'server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-queue-admission-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-queue-admission-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-queue-admission-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-runtime-enqueue-approval.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-queue-admission-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-queue-admission-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-queue-admission-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-queue-admission-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_queue_admission_readiness')
}

if (docs.decision !== 'ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'internal_beta_queue_admission_ready_runtime_still_blocked') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecision !== 'ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_source_decision:${docs.sourceDecision}`)
}

for (const status of [
  'missing_runtime_enqueue_scope_approval',
  'missing_queue_admission_prerequisites',
  'internal_beta_queue_admission_ready_runtime_still_blocked',
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
for (const key of requiredQueueAdmissionEvidence) {
  if (!docs.requiredQueueAdmissionEvidence?.includes(key)) fail(`docs_missing_queue_evidence:${key}`)
  if (!moduleSource.includes(key)) fail(`module_missing_queue_evidence:${key}`)
  if (!markdown.includes(`\`${key}\``)) fail(`markdown_missing_queue_evidence:${key}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  queueAdmissionPacketsPrepared: 21,
  queueAdmissionPacketsReadyWithProvidedEvidence: 21,
  queueAdmissionCapabilitiesReadyWithProvidedEvidence: 12,
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
  gpuToolsUseNativeL4: true,
  gpuRuntimeTargetsExact: true,
  gpuRuntimeOnDemandOnly: true,
  idleGpuRuntimeApprovedNow: false,
  gpuStartsOnlyAfterApprovedWorkerJob: true,
})) {
  if (docs.runtimeTargets?.[key] !== expected) {
    fail(`docs_runtime_target_policy_mismatch:${key}:${docs.runtimeTargets?.[key]}`)
  }
}
for (const [tool, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool] !== runtimeTarget) {
    fail(`docs_expected_gpu_runtime_target_mismatch:${tool}:${docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool]}`)
  }
  if (!markdown.includes(runtimeTarget)) fail(`markdown_missing_gpu_runtime_target:${tool}`)
  if (!moduleSource.includes(runtimeTarget)) fail(`module_missing_gpu_runtime_target:${tool}`)
}
if (!markdown.includes('GPU runtime remains on-demand only')) {
  fail('markdown_missing_gpu_on_demand_policy')
}

if (!docs.queueAdmissionEvidenceShape?.privateArtifactManifestRef?.startsWith('private://')) {
  fail('docs_private_artifact_manifest_not_private_scheme')
}
if (JSON.stringify(docs.queueAdmissionEvidenceShape).match(/https?:\/\/|signed:\/\/|public:\/\/|gs:\/\//i)) {
  fail('docs_queue_evidence_contains_public_or_signed_artifact_ref')
}

for (const action of [
  'bind all 21 AI graphics production tool IDs to approved snapshot and credit reservation evidence',
  'bind each candidate to a private artifact manifest reference',
  'bind Tool Route and Worker approval references without executing either surface',
  'bind worker queue transport and idempotency namespace metadata without enqueueing work',
]) {
  if (!docs.allowedQueueAdmissionPreparationActions?.includes(action)) fail(`docs_missing_allowed_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_allowed_action:${action}`)
}

for (const action of [
  'live worker queue enqueue',
  'production worker dispatch',
  'Tool Route execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'signed URL creation',
  'public artifact creation',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(action)) fail(`docs_missing_blocked_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_blocked_action:${action}`)
  if (!markdown.includes(action)) fail(`markdown_missing_blocked_action:${action}`)
}

for (const [key, expected] of Object.entries({
  internalBetaQueueAdmissionReadinessPrepared: true,
  sourceRuntimeEnqueueScopeAccepted: true,
  queueAdmissionPrerequisitesSatisfied: true,
  all21ToolsCovered: true,
  all12CapabilitiesCovered: true,
  all21QueueAdmissionPacketsPrepared: true,
  all21QueueAdmissionPacketsReadyWithProvidedEvidence: true,
  all12CapabilitiesReadyWithProvidedEvidence: true,
  privateArtifactManifestOnly: true,
  gpuHeavyToolsTargetGpuRuntime: true,
  gpuRuntimeTargetsExact: true,
  gpuRuntimeOnDemandOnly: true,
  agentCanSelectForPlanning: true,
})) {
  if (docs.booleans?.[key] !== expected) fail(`docs_boolean_mismatch:${key}:${docs.booleans?.[key]}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_gate_not_false:${key}`)
}

for (const token of [
  'ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks',
  'internal_beta_queue_admission_ready_runtime_still_blocked',
  'private://ai-graphics/internal-beta/artifact-manifest.json',
]) {
  if (!markdown.includes(token) && !JSON.stringify(docs).includes(token) && !moduleSource.includes(token)) {
    fail(`missing_token:${token}`)
  }
}
if (!scorecard.includes('ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_internal_beta_queue_admission_readiness')
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_queue_admission')
if (defaultOutput.status !== 'missing_runtime_enqueue_scope_approval') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.queueAdmissionPacketsReadyWithProvidedEvidence !== 0) fail('default_queue_ready_not_0')

const { manifestPacketPath, gpuPacketPath } = writeAcceptedEvidencePackets()
const sourceApprovedOutput = parseJsonOutput(
  runNpm(runScriptName, acceptedSourceArgs(manifestPacketPath, gpuPacketPath)),
  'source_approved_queue_admission',
)
if (sourceApprovedOutput.status !== 'missing_queue_admission_prerequisites') {
  fail(`source_approved_status:${sourceApprovedOutput.status}`)
}
if (sourceApprovedOutput.sourceRuntimeEnqueueScopeAccepted !== true) fail('source_runtime_enqueue_not_accepted')
if (sourceApprovedOutput.queueAdmissionPrerequisitesSatisfied !== false) fail('source_approved_queue_prereqs_not_false')

let badArtifactExited = false
try {
  runNpm(runScriptName, [
    ...acceptedSourceArgs(manifestPacketPath, gpuPacketPath),
    '--all-queue-admission-prerequisites-provided',
    '--private-artifact-manifest-ref',
    'https://example.test/not-private.json',
    '--require-queue-admission-ready',
  ])
} catch (error) {
  badArtifactExited = true
  const badOutput = parseJsonOutput(error.stdout.toString(), 'bad_artifact_queue_admission')
  if (!badOutput.missingQueueAdmissionPrerequisites?.includes('privateArtifactManifestRef must use a private-only scheme')) {
    fail('bad_artifact_did_not_report_private_scheme_blocker')
  }
}
if (!badArtifactExited) fail('bad_artifact_ref_did_not_fail_required_queue_admission')

const approvedOutput = parseJsonOutput(
  runNpm(runScriptName, [
    ...acceptedSourceArgs(manifestPacketPath, gpuPacketPath),
    '--all-queue-admission-prerequisites-provided',
    '--require-queue-admission-ready',
  ]),
  'approved_queue_admission',
)
if (approvedOutput.status !== 'internal_beta_queue_admission_ready_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.queueAdmissionPacketsReadyWithProvidedEvidence !== 21) fail('approved_queue_packets_not_21')
if (approvedOutput.queueAdmissionCapabilitiesReadyWithProvidedEvidence !== 12) fail('approved_capabilities_not_12')
if (approvedOutput.queueAdmissionPackets?.length !== 21) fail('approved_queue_packet_length_not_21')
if (approvedOutput.queueAdmissionPackets?.filter((packet) => packet.gpuRequiredForRuntime).length !== 8) {
  fail('approved_gpu_queue_packets_not_8')
}
for (const key of falseGateKeys) {
  if (approvedOutput.booleans?.[key] !== false) fail(`approved_false_gate_not_false:${key}`)
  if (approvedOutput.input?.[key] === true) fail(`approved_input_performed_gate_true:${key}`)
}
if (approvedOutput.booleans?.privateArtifactManifestOnly !== true) fail('approved_private_manifest_not_true')
if (approvedOutput.booleans?.gpuRuntimeTargetsExact !== true) fail('approved_gpu_runtime_targets_not_exact')
if (approvedOutput.booleans?.gpuRuntimeOnDemandOnly !== true) fail('approved_gpu_runtime_not_on_demand')
for (const [tool, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  const packet = approvedOutput.queueAdmissionPackets?.find((item) => item.toolId === tool)
  if (!packet) fail(`approved_missing_gpu_tool_packet:${tool}`)
  if (packet?.workerType !== 'gpu_ai_worker') fail(`approved_gpu_tool_not_gpu_worker:${tool}`)
  if (packet?.runtimeTarget !== runtimeTarget) {
    fail(`approved_gpu_runtime_target_mismatch:${tool}:${packet?.runtimeTarget}`)
  }
}

let liveQueueExited = false
try {
  runNpm(runScriptName, [
    ...acceptedSourceArgs(manifestPacketPath, gpuPacketPath),
    '--all-queue-admission-prerequisites-provided',
    '--require-live-worker-queue',
  ])
} catch {
  liveQueueExited = true
}
if (!liveQueueExited) fail('require_live_worker_queue_did_not_fail_closed')

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /workerQueueApprovedNow["`:= ]+true/i,
  /productionWorkerJobEnqueueApprovedNow["`:= ]+true/i,
  /productionWorkerDispatchApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /internalBetaReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
for (const [label, content] of Object.entries({
  moduleSource,
  cliSource,
  markdown,
  docs: JSON.stringify(docs),
})) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

try {
  const basePkg = JSON.parse(git(['show', `${baseRef}:package.json`]))
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(basePkg[key] ?? {}) !== JSON.stringify(pkg[key] ?? {})) {
      fail(`package_dependency_section_changed:${key}`)
    }
  }
} catch (error) {
  fail(`package_dependency_compare_failed:${error.message}`)
}

try {
  const lockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
  if (lockDiff.trim()) fail('package_lock_changed')
} catch (error) {
  fail(`package_lock_diff_failed:${error.message}`)
}

try {
  const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
  if (trackedLocalArtifacts.trim()) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
} catch (error) {
  fail(`local_artifacts_scan_failed:${error.message}`)
}

const generatedPathPattern = /(^|\/)(render|renders|media|canvas|webgl|public|signed-url|signed-urls|gcs)(\/|$)/i
try {
  const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
  for (const file of changedFiles) {
    if (generatedPathPattern.test(file)) fail(`generated_output_path_changed:${file}`)
  }
} catch (error) {
  fail(`generated_output_scan_failed:${error.message}`)
}

if (failures.length > 0) {
  console.error([
    'AI graphics internal beta queue-admission readiness diagnostics failed:',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  tools: docs.tools.length,
  capabilities: docs.capabilities.length,
  queueAdmissionPacketsPrepared: docs.counts.queueAdmissionPacketsPrepared,
  queueAdmissionPacketsReadyWithProvidedEvidence:
    docs.counts.queueAdmissionPacketsReadyWithProvidedEvidence,
  gpuRuntimeTargetedTools: docs.counts.gpuRuntimeTargetedTools,
  workerQueueApprovedNow: docs.booleans.workerQueueApprovedNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
