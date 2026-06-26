import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-production-worker-gate-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-production-worker-gate-readiness:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-internal-beta-production-worker-gate-readiness-diagnostics.mjs'

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

const requiredGateNames = [
  'approved_snapshot',
  'idempotency',
  'raw_prompt_block',
  'signed_url_block',
  'secret_block',
  'registry_runtime',
  'license_model_weight',
  'credit_reservation',
  'artifact_policy',
  'qa_policy',
  'worker_mode',
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-production-worker-gate-readiness-'))
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
  'server/tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
  'server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-production-worker-gate-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.json',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-idempotency.ts',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-internal-beta-production-worker-gate-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_production_worker_gate_readiness')
}
if (docs.decision !== 'ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.sourceDecision !== 'ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_source_decision:${docs.sourceDecision}`)
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_production_worker_gate_checks_ready',
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
for (const gateName of requiredGateNames) {
  if (!docs.requiredGateNames?.includes(gateName)) fail(`docs_missing_gate:${gateName}`)
  if (!moduleSource.includes(gateName)) fail(`module_missing_gate:${gateName}`)
  if (!markdown.includes(`\`${gateName}\``)) fail(`markdown_missing_gate:${gateName}`)
}
for (const token of [
  'runProductionWorkerGates',
  'getHardFailedGates',
  'production worker dispatch',
  'production worker route execution',
  '--require-owner-approved-production-worker-gates-ready',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token) && !markdown.includes(token)) {
    fail(`source_missing:${token}`)
  }
}
if (docs.counts?.productionWorkerGateChecksPrepared !== 21) fail('docs_gate_checks_not_21')
if (docs.counts?.capabilityProductionWorkerGateScenariosPrepared !== 12) fail('docs_capability_gate_scenarios_not_12')
if (docs.counts?.ownerApprovedProductionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) {
  fail('docs_owner_gate_checks_not_21')
}
if (docs.counts?.ownerApprovedCapabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('docs_owner_capability_gate_scenarios_not_12')
}
if (docs.counts?.hardFailedGateChecksWithProvidedEvidence !== 0) fail('docs_hard_failed_gate_checks_not_0')
if (docs.counts?.productionWorkerGateChecksReadyNow !== 0) fail('docs_gate_checks_ready_now_not_0')

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_production_worker_gate')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.ownerApprovedProductionWorkerGateEvidenceAccepted !== false) fail('default_owner_gate_not_false')
if (defaultOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 0) fail('default_gate_checks_not_0')

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
    '--require-owner-approved-production-worker-gates-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)
if (awaitingOutput.ownerApprovedProductionWorkerGateEvidenceAccepted !== false) fail('awaiting_owner_gate_not_false')

const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
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
  '--require-owner-approved-production-worker-gates-ready',
]), 'approved_production_worker_gate')

if (approvedOutput.status !== 'owner_approved_production_worker_gate_checks_ready') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.ownerApprovedProductionWorkerGateEvidenceAccepted !== true) fail('approved_owner_gate_not_true')
if (approvedOutput.productionWorkerGateChecksPrepared !== 21) fail('approved_gate_checks_not_21')
if (approvedOutput.capabilityProductionWorkerGateScenariosPrepared !== 12) fail('approved_capability_gate_scenarios_not_12')
if (approvedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) fail('approved_gate_checks_accepted_not_21')
if (approvedOutput.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('approved_capability_gate_scenarios_accepted_not_12')
}
if (approvedOutput.hardFailedGateChecksWithProvidedEvidence !== 0) fail('approved_hard_failed_gate_checks_not_0')
if (approvedOutput.productionWorkerGateChecksReadyNow !== 0) fail('approved_gate_checks_ready_now_not_0')
if (approvedOutput.productionWorkerGateChecks?.length !== 21) fail('approved_gate_payload_length_not_21')
if (approvedOutput.capabilityProductionWorkerGateScenarios?.length !== 12) {
  fail('approved_capability_gate_payload_length_not_12')
}

for (const gateResult of approvedOutput.productionWorkerGateChecks ?? []) {
  if (gateResult.gateCheckShapeValid !== true) fail(`gate_shape_invalid:${gateResult.toolId}`)
  if (gateResult.gateChecksAcceptedWithProvidedEvidence !== true) fail(`gate_not_accepted:${gateResult.toolId}`)
  if (gateResult.hardFailedGateNames?.length !== 0) fail(`gate_hard_failures:${gateResult.toolId}`)
  if (gateResult.canEnqueueProductionWorkerJobNow !== false) fail(`gate_enqueue_not_false:${gateResult.toolId}`)
  if (gateResult.canDispatchProductionWorkerJobNow !== false) fail(`gate_dispatch_not_false:${gateResult.toolId}`)
  if (gateResult.canRunProductionWorkerRouteNow !== false) fail(`gate_route_not_false:${gateResult.toolId}`)
  if (gateResult.canExecuteToolNow !== false) fail(`gate_execute_not_false:${gateResult.toolId}`)
  const gateNames = (gateResult.gateChecks ?? []).map((gate) => gate.gateName)
  for (const gateName of requiredGateNames) {
    if (!gateNames.includes(gateName)) fail(`gate_result_missing_gate:${gateResult.toolId}:${gateName}`)
  }
  for (const gate of gateResult.gateChecks ?? []) {
    if (!gate.gateName || !gate.status || typeof gate.hardBlock !== 'boolean' || !gate.message || !Array.isArray(gate.warnings)) {
      fail(`gate_result_bad_shape:${gateResult.toolId}:${gate.gateName}`)
    }
  }
}

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime')) {
  fail('scorecard_missing_internal_beta_production_worker_gate_readiness_decision')
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
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.json',
  'server/tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
  'server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
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
  '+    "ai-graphics:internal-beta-production-worker-job-readiness": "tsx server/cli/ai-graphics-internal-beta-production-worker-job-readiness.ts",',
  '+    "ai-graphics:internal-beta-production-worker-job-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-production-worker-job-readiness-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:beta-production-readiness-rollup": "tsx server/cli/ai-graphics-beta-production-readiness-rollup.ts",',
  '+    "ai-graphics:beta-production-readiness-rollup:diagnostics": "node scripts/validation/ai-graphics-beta-production-readiness-rollup-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go": "tsx server/cli/ai-graphics-internal-beta-go-no-go.ts",',
  '+    "ai-graphics:internal-beta-go-no-go:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs",',
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
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  toolsCovered: allTools.length,
  productionWorkerGateChecksAcceptedWithProvidedEvidence:
    approvedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence,
  capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence:
    approvedOutput.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence,
  hardFailedGateChecksWithProvidedEvidence: approvedOutput.hardFailedGateChecksWithProvidedEvidence,
  productionWorkerGateChecksReadyNow: approvedOutput.productionWorkerGateChecksReadyNow,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
