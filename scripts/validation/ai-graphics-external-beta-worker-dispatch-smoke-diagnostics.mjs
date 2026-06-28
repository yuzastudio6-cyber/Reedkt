import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-worker-dispatch-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-diagnostics.mjs'
const proofScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke-proof'
const proofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts'
const proofDiagnosticScriptName =
  'ai-graphics:external-beta-worker-dispatch-smoke-proof:diagnostics'
const proofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-proof-diagnostics.mjs'
const privateArtifactManifestScriptName =
  'ai-graphics:external-beta-private-artifact-manifest'
const privateArtifactManifestScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts'
const privateArtifactManifestDiagnosticScriptName =
  'ai-graphics:external-beta-private-artifact-manifest:diagnostics'
const privateArtifactManifestDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-private-artifact-manifest-diagnostics.mjs'
const toolRouteRuntimeProofScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof'
const toolRouteRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts'
const toolRouteRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof:diagnostics'
const toolRouteRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-route-runtime-proof-diagnostics.mjs'

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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'serviceRoleQueueSmokePerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'workerDispatchPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
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
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-worker-dispatch-smoke.ts',
  'server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts',
  'server/tool-registry/ai-graphics-external-beta-worker-dispatch-readiness.ts',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-lease-manager.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-readiness.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke.md')
const source = read('server/tool-registry/ai-graphics-external-beta-worker-dispatch-smoke.ts')
const cli = read('server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-worker-dispatch-smoke'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_worker_dispatch_smoke_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const [key, expected] of Object.entries({
  smokeJobsPrepared: 21,
  smokeJobsCompletedWithProvidedEvidence: 21,
  smokeCapabilityScenariosPrepared: 12,
  smokeCapabilityScenariosCompletedWithProvidedEvidence: 12,
  gpuRuntimeTargetedTools: 8,
  inMemoryLeaseRecordsCreated: 21,
  inMemoryLeaseRecordsReleased: 21,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.acceptanceCriteria?.[key] !== expected) {
    fail(`unexpected_docs_acceptance:${key}:${docs.acceptanceCriteria?.[key]}`)
  }
}
for (const key of [
  'externalBetaWorkerDispatchSmokePrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'allToolRunResultsEmpty',
  'allArtifactRecordsEmpty',
  'allQualityGateResultsEmpty',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

for (const phrase of [
  '--external-beta-worker-dispatch-readiness-packet',
  '--external-beta-worker-dispatch-smoke-ref',
  '--external-beta-worker-dispatch-smoke-telemetry-ref',
  '--external-beta-worker-dispatch-smoke-lease-audit-ref',
  '--external-beta-worker-dispatch-smoke-cleanup-ref',
  'external_beta_worker_dispatch_smoke_completed_without_tool_execution',
  'dispatchProductionWorkerJob',
  'metadata_dry_run',
  'noLiveWorkerLeaseBySmoke',
  'noToolExecutionBySmoke',
  'noGpuRuntimeStartBySmoke',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta Worker Dispatch Smoke')) {
  fail('scorecard_missing_external_beta_worker_dispatch_smoke')
}

const missingOutput = parseJsonOutput(runNpm(runScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_worker_dispatch_readiness') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}
if (missingOutput.smokeJobsPrepared !== 21) {
  fail(`missing_smoke_jobs_prepared:${missingOutput.smokeJobsPrepared}`)
}
if (missingOutput.smokeJobsCompletedWithProvidedEvidence !== 0) {
  fail('missing_smoke_jobs_should_not_complete')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-worker-dispatch-smoke-'))
try {
  const readinessPacketPath = writeJson(path.join(tmpRoot, 'worker-dispatch-readiness.json'), {
    decision: 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
    workerDispatchReadinessPreparedWithProvidedEvidence: true,
    workerDispatchReadinessRecordsPreparedWithProvidedEvidence: 21,
    workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: 12,
    gpuRuntimeTargetedTools: 8,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    booleans: {
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  })
  const accepted = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-worker-dispatch-readiness-packet',
    readinessPacketPath,
    '--external-beta-worker-dispatch-smoke-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/report.json',
    '--external-beta-worker-dispatch-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/telemetry.json',
    '--external-beta-worker-dispatch-smoke-lease-audit-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/lease-audit.json',
    '--external-beta-worker-dispatch-smoke-cleanup-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/cleanup.json',
  ]), 'accepted')
  if (accepted.decision !== 'external_beta_worker_dispatch_smoke_completed_without_tool_execution') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.smokeJobsCompletedWithProvidedEvidence !== 21) {
    fail(`accepted_smoke_jobs_not_21:${accepted.smokeJobsCompletedWithProvidedEvidence}`)
  }
  if (accepted.smokeCapabilityScenariosCompletedWithProvidedEvidence !== 12) {
    fail(`accepted_capabilities_not_12:${accepted.smokeCapabilityScenariosCompletedWithProvidedEvidence}`)
  }
  if (accepted.gpuRuntimeTargetedTools !== 8) fail(`accepted_gpu_tools_not_8:${accepted.gpuRuntimeTargetedTools}`)
  if (accepted.inMemoryLeaseRecordsCreated !== 21) fail(`accepted_leases_created_not_21:${accepted.inMemoryLeaseRecordsCreated}`)
  if (accepted.inMemoryLeaseRecordsReleased !== 21) fail(`accepted_leases_released_not_21:${accepted.inMemoryLeaseRecordsReleased}`)
  if (accepted.liveWorkerLeasesCreatedNow !== 0) fail('accepted_live_leases_not_0')
  if (accepted.liveWorkerDispatchesNow !== 0) fail('accepted_live_dispatches_not_0')
  if (accepted.liveToolExecutionsNow !== 0) fail('accepted_live_tool_exec_not_0')
  if (accepted.records?.length !== 21) fail(`accepted_records_not_21:${accepted.records?.length}`)
  if ((accepted.records ?? []).filter((record) => record.workerType === 'gpu_ai_worker').length !== 8) {
    fail('accepted_records_gpu_worker_count_not_8')
  }
  for (const record of accepted.records ?? []) {
    if (record.productionWorkerJobStatus !== 'completed') fail(`record_not_completed:${record.toolId}`)
    if (record.hardGateBlockCount !== 0) fail(`record_hard_gate_block:${record.toolId}`)
    if (record.mockOnlyRoute !== true) fail(`record_not_mock_only:${record.toolId}`)
    if (record.aiGraphicsToolCallHandoffRoute !== true) fail(`record_missing_handoff:${record.toolId}`)
    if (record.inMemoryLeaseCreated !== true) fail(`record_lease_not_created:${record.toolId}`)
    if (record.inMemoryLeaseReleased !== true) fail(`record_lease_not_released:${record.toolId}`)
    if (record.toolRunResultsCreated !== 0) fail(`record_tool_runs_created:${record.toolId}`)
    if (record.artifactRecordsCreated !== 0) fail(`record_artifacts_created:${record.toolId}`)
    if (record.qualityGateResultsCreated !== 0) fail(`record_quality_gates_created:${record.toolId}`)
    if (record.gpuRuntimeShouldStartNow !== false) fail(`record_gpu_start_now_not_false:${record.toolId}`)
    if (record.liveWorkerLeaseCreatedNow !== false) fail(`record_live_lease_not_false:${record.toolId}`)
    if (record.liveWorkerDispatchPerformedNow !== false) fail(`record_live_dispatch_not_false:${record.toolId}`)
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const forbiddenDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
  /workerDispatchApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
]) {
  if (pattern.test(forbiddenDocs)) fail(`forbidden_docs_claim:${pattern}`)
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
  `+    "${proofScriptName}": "${proofScriptCommand}",`,
  `+    "${proofDiagnosticScriptName}": "${proofDiagnosticScriptCommand}",`,
  `+    "${privateArtifactManifestScriptName}": "${privateArtifactManifestScriptCommand}",`,
  `+    "${privateArtifactManifestDiagnosticScriptName}": "${privateArtifactManifestDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}
const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  acceptedDecision: 'external_beta_worker_dispatch_smoke_completed_without_tool_execution',
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  gpuToolsCovered: gpuTools.length,
  smokeJobsCompletedWithProvidedEvidence: 21,
  smokeCapabilityScenariosCompletedWithProvidedEvidence: 12,
  inMemoryLeaseRecordsCreated: 21,
  inMemoryLeaseRecordsReleased: 21,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
