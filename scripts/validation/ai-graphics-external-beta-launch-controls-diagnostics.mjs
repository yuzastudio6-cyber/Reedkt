import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { acceptedExternalBetaLaunchControlsPacket } from './ai-graphics-external-beta-launch-controls-fixture-packet.mjs'

const runScriptName = 'ai-graphics:external-beta-launch-controls'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-launch-controls.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-launch-controls:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs'
const readinessGateScriptName = 'ai-graphics:external-beta-readiness-gate'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'

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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-launch-controls.ts',
  'server/cli/ai-graphics-external-beta-launch-controls.ts',
  'scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs',
  'scripts/validation/ai-graphics-external-beta-launch-controls-fixture-packet.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-controls.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-controls.md',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-gap-report.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json',
]

const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
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
  const content = read(filePath)
  if (!content) return {}
  try {
    return JSON.parse(content)
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

function parseJson(output, label) {
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

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-launch-controls.json')
const source = read('server/tool-registry/ai-graphics-external-beta-launch-controls.ts')
const cli = read('server/cli/ai-graphics-external-beta-launch-controls.ts')
const index = read('server/tool-registry/index.ts')
const readinessSource = read('server/tool-registry/ai-graphics-external-beta-readiness-gate.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-launch-controls'")) {
  fail('missing_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_launch_controls_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_tool_count_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.counts?.requiredControlRefs !== 12) fail('docs_required_refs_not_12')
if (docs.counts?.defaultAcceptedControlRefs !== 0) fail('docs_default_refs_not_0')
if (docs.counts?.acceptedFixtureControlRefs !== 12) fail('docs_fixture_refs_not_12')
if (docs.policy?.technicalAdmissionBundleIsNotLaunchApproval !== true) {
  fail('docs_missing_admission_separation')
}
if (docs.policy?.launchControlsPacketRequiredForExternalBetaCandidate !== true) {
  fail('docs_missing_launch_controls_requirement')
}

for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
for (const key of [
  'externalBetaLaunchControlsPrepared',
  'technicalAdmissionBundleIsNotLaunchApproval',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}

for (const needle of [
  'acceptedAiGraphicsExternalBetaLaunchControls',
  'privateEvidenceRefsOnly: true',
  'approvesRuntimeNow: false',
  'approvesExternalBetaTrafficNow: false',
  'approvesProductionNow: false',
  'externalBetaLaunchControlsAccepted',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--internal-beta-runtime-soak-ref',
  '--external-beta-qa-evidence-ref',
  '--external-beta-worker-dispatch-smoke-proof-ref',
  'evaluatorOnly: true',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'externalBetaLaunchControls',
  'externalBetaLaunchControlsAccepted',
  'external-beta launch controls packet is not accepted',
]) {
  if (!readinessSource.includes(needle)) fail(`readiness_source_missing:${needle}`)
}

const defaultOutput = parseJson(runNpm(runScriptName), 'default_launch_controls')
if (defaultOutput.status !== 'missing_external_beta_launch_controls') fail('default_status_unexpected')
if (defaultOutput.acceptedControlRefs !== 0) fail('default_refs_not_0')
if (defaultOutput.booleans?.externalBetaLaunchControlsAccepted !== false) {
  fail('default_controls_accepted_not_false')
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-launch-controls-'))
const acceptedControlsPath = writeJson(
  path.join(tempRoot, 'external-beta-launch-controls.json'),
  acceptedExternalBetaLaunchControlsPacket(),
)
const acceptedOutput = parseJson(
  runNpm(runScriptName, [
    '--internal-beta-runtime-soak-ref',
    'private://ai-graphics/external-beta/runtime-soak',
    '--external-beta-qa-evidence-ref',
    'private://ai-graphics/external-beta/qa',
    '--external-beta-cost-concurrency-privacy-rollback-ref',
    'private://ai-graphics/external-beta/cost-concurrency-privacy-rollback',
    '--external-beta-incident-response-ref',
    'private://ai-graphics/external-beta/incident-response',
    '--external-beta-owner-approval-ref',
    'private://ai-graphics/external-beta/owner-approval',
    '--external-beta-launch-switch-ref',
    'private://ai-graphics/external-beta/launch-switch',
    '--external-beta-rollout-cohort-ref',
    'private://ai-graphics/external-beta/rollout-cohort',
    '--external-beta-cost-concurrency-ceiling-ref',
    'private://ai-graphics/external-beta/cost-concurrency-ceiling',
    '--external-beta-rollback-incident-runbook-ref',
    'private://ai-graphics/external-beta/rollback-incident-runbook',
    '--external-beta-private-artifact-retention-support-ref',
    'private://ai-graphics/external-beta/private-artifact-retention-support',
    '--external-beta-support-ownership-ref',
    'private://ai-graphics/external-beta/support-ownership',
    '--external-beta-worker-dispatch-smoke-proof-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof',
  ]),
  'accepted_launch_controls',
)
if (acceptedOutput.status !== 'external_beta_launch_controls_accepted_with_runtime_blocks') {
  fail('accepted_status_unexpected')
}
if (acceptedOutput.acceptedControlRefs !== 12) fail('accepted_refs_not_12')
for (const key of falseBooleanKeys) {
  if (acceptedOutput.booleans?.[key] !== false && acceptedOutput.input?.[key] !== false) {
    fail(`accepted_output_required_false_not_false:${key}`)
  }
}

const broadFlagsWithoutControls = parseJson(
  runNpm(readinessGateScriptName, [
    '--all-shared-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--native-gpu-runtime-proof-passed',
    '--model-weight-manifests-approved',
    '--model-weight-review-packet-accepted',
    '--all-external-beta-evidence-passed',
  ]),
  'readiness_broad_flags_without_controls',
)
if (broadFlagsWithoutControls.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('broad_flags_without_controls_unexpected_ready_tools')
}
if (broadFlagsWithoutControls.booleans?.sourceExternalBetaLaunchControlsAccepted !== false) {
  fail('broad_flags_without_controls_unexpected_controls')
}
if (!broadFlagsWithoutControls.externalBetaGlobalBlockers?.includes('external-beta launch controls packet is not accepted')) {
  fail('broad_flags_without_controls_missing_blocker')
}

const broadFlagsWithControls = parseJson(
  runNpm(readinessGateScriptName, [
    '--all-shared-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--native-gpu-runtime-proof-passed',
    '--model-weight-manifests-approved',
    '--model-weight-review-packet-accepted',
    '--all-external-beta-evidence-passed',
    '--external-beta-launch-controls',
    acceptedControlsPath,
  ]),
  'readiness_broad_flags_with_controls',
)
if (broadFlagsWithControls.externalBetaReadyWithProvidedEvidenceTools !== 0) {
  fail('broad_flags_with_controls_ready_tools_not_0_without_worker_dispatch_smoke_proof')
}
if (broadFlagsWithControls.booleans?.sourceExternalBetaLaunchControlsAccepted !== true) {
  fail('broad_flags_with_controls_not_accepted')
}
if (!broadFlagsWithControls.externalBetaGlobalBlockers?.includes(
  'external-beta worker dispatch smoke proof is not accepted',
)) {
  fail('broad_flags_with_controls_missing_worker_dispatch_smoke_proof_blocker')
}
if (broadFlagsWithControls.externalBetaReadyNowTools !== 0) fail('with_controls_ready_now_not_0')
if (broadFlagsWithControls.productionReadyNowTools !== 0) fail('with_controls_production_not_0')

for (const toolId of allTools) {
  if (!broadFlagsWithControls.tools?.some((tool) => tool.toolId === toolId)) {
    fail(`with_controls_missing_tool:${toolId}`)
  }
}

if (!scorecard.includes('ai_graphics_external_beta_launch_controls_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_launch_controls')
}

const combinedText = requiredFiles
  .filter((filePath) => (
    filePath !== 'scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs' &&
    filePath !== 'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json'
  ))
  .map(read)
  .join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeShouldStartNow["`:\s]+true/i,
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
  acceptedControlRefs: acceptedOutput.acceptedControlRefs,
  broadFlagsWithoutControlsReadyTools:
    broadFlagsWithoutControls.externalBetaReadyWithProvidedEvidenceTools,
  broadFlagsWithControlsReadyTools:
    broadFlagsWithControls.externalBetaReadyWithProvidedEvidenceTools,
  externalBetaReadyNowTools: broadFlagsWithControls.externalBetaReadyNowTools,
  productionReadyNowTools: broadFlagsWithControls.productionReadyNowTools,
  agentCanExecuteToolsNow: broadFlagsWithControls.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: broadFlagsWithControls.booleans?.gpuRuntimeShouldStartNow,
}, null, 2))
