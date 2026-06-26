import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-dry-run-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-dry-run-readiness.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-dry-run-readiness:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-internal-beta-dry-run-readiness-diagnostics.mjs'

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-internal-beta-dry-run-'))
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
  'server/tool-registry/ai-graphics-internal-beta-dry-run-readiness.ts',
  'server/cli/ai-graphics-internal-beta-dry-run-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-dry-run-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-dry-run-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-dry-run-readiness.json',
  'docs/tool-intelligence/ai-graphics/beta-execution-handoff-readiness.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-dry-run-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-dry-run-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-dry-run-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-dry-run-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-internal-beta-dry-run-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_dry_run_readiness')
}
if (docs.decision !== 'ai_graphics_internal_beta_dry_run_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_metadata_dry_run_ready',
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
for (const token of [
  'metadataDryRunToolCasesPrepared',
  'metadataDryRunCapabilityScenariosPrepared',
  'internalBetaMetadataDryRunReadyWithProvidedEvidence',
  '--require-owner-approved-metadata-dry-run-ready',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token)) {
    fail(`source_missing:${token}`)
  }
}
if (docs.counts?.metadataDryRunToolCasesPrepared !== 21) fail('docs_tool_cases_not_21')
if (docs.counts?.metadataDryRunCapabilityScenariosPrepared !== 12) fail('docs_capability_cases_not_12')
if (docs.counts?.ownerApprovedMetadataDryRunReadyToolsWithProvidedEvidence !== 21) {
  fail('docs_owner_ready_tools_not_21')
}
if (docs.counts?.ownerApprovedMetadataDryRunReadyCapabilitiesWithProvidedEvidence !== 12) {
  fail('docs_owner_ready_capabilities_not_12')
}
if (docs.counts?.metadataDryRunReadyToolsNow !== 0) fail('docs_ready_now_tools_not_0')
if (docs.counts?.metadataDryRunReadyCapabilitiesNow !== 0) fail('docs_ready_now_capabilities_not_0')

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_internal_beta_dry_run')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.internalBetaMetadataDryRunReadyWithProvidedEvidence !== false) {
  fail('default_metadata_dry_run_ready_not_false')
}
if (defaultOutput.metadataDryRunReadyToolsWithProvidedEvidence !== 0) fail('default_ready_tools_not_0')

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
    '--require-owner-approved-metadata-dry-run-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)
if (awaitingOutput.sourceOwnerApprovedHandoffAccepted !== false) fail('awaiting_source_handoff_not_false')
if (awaitingOutput.internalBetaMetadataDryRunReadyWithProvidedEvidence !== false) {
  fail('awaiting_metadata_dry_run_ready_not_false')
}

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
  '--require-owner-approved-metadata-dry-run-ready',
]), 'approved_internal_beta_dry_run')

if (approvedOutput.status !== 'owner_approved_metadata_dry_run_ready') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.sourceOwnerApprovedHandoffAccepted !== true) fail('approved_source_handoff_not_true')
if (approvedOutput.internalBetaMetadataDryRunReadyWithProvidedEvidence !== true) {
  fail('approved_metadata_dry_run_ready_not_true')
}
if (approvedOutput.metadataDryRunToolCasesPrepared !== 21) fail('approved_tool_cases_not_21')
if (approvedOutput.metadataDryRunCapabilityScenariosPrepared !== 12) fail('approved_capability_cases_not_12')
if (approvedOutput.metadataDryRunReadyToolsWithProvidedEvidence !== 21) fail('approved_ready_tools_not_21')
if (approvedOutput.metadataDryRunReadyCapabilitiesWithProvidedEvidence !== 12) fail('approved_ready_capabilities_not_12')
if (approvedOutput.metadataDryRunReadyToolsNow !== 0) fail('approved_ready_now_tools_not_0')
if (approvedOutput.metadataDryRunReadyCapabilitiesNow !== 0) fail('approved_ready_now_capabilities_not_0')
if (approvedOutput.toolCases?.length !== 21) fail('approved_tool_case_length_not_21')
if (approvedOutput.capabilityCases?.length !== 12) fail('approved_capability_case_length_not_12')

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_dry_run_readiness_contract_prepared_with_fail_closed_runtime')) {
  fail('scorecard_missing_internal_beta_dry_run_readiness_decision')
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
  'docs/tool-intelligence/ai-graphics/internal-beta-dry-run-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-dry-run-readiness.json',
  'server/tool-registry/ai-graphics-internal-beta-dry-run-readiness.ts',
  'server/cli/ai-graphics-internal-beta-dry-run-readiness.ts',
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
  metadataDryRunReadyToolsWithProvidedEvidence: approvedOutput.metadataDryRunReadyToolsWithProvidedEvidence,
  metadataDryRunReadyCapabilitiesWithProvidedEvidence: approvedOutput.metadataDryRunReadyCapabilitiesWithProvidedEvidence,
  metadataDryRunReadyToolsNow: approvedOutput.metadataDryRunReadyToolsNow,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
}, null, 2))
