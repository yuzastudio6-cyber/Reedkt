import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName = 'ai-graphics:external-beta-candidate-evidence-assembly'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-candidate-evidence-assembly:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs'
const decision =
  'ai_graphics_external_beta_candidate_evidence_assembly_prepared_with_runtime_blocks'
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-candidate-evidence-assembly.ts',
  'server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts',
  'scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-candidate-evidence-assembly.json',
  'docs/tool-intelligence/ai-graphics/external-beta-candidate-evidence-assembly.md',
  'docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-private-artifact-manifest.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-controls.json',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/external-beta-readiness-gate.json',
  'docs/production-beta-readiness-scorecard.md',
]

const trueBooleanKeys = [
  'externalBetaCandidateEvidenceAssemblyPrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ToolsInstalledForPlannedSurface',
  'all21ToolsMappedToProductionRegistry',
  'all8GpuToolsTargetGpuRuntime',
  'heavyToolsIncorrectlyTargetingCpuAbsent',
  'agentCanSelectForPlanning',
]

const falseBooleanKeys = [
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

function parseReport(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_report:${label}:${error.message}`)
    return {}
  }
}

function writeTempJson(root, filename, value) {
  const filePath = path.join(root, filename)
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
  return filePath
}

function assertCount(report, key, expected, label) {
  const actual = report.counts?.[key]
  if (actual !== expected) fail(`${label}_count_${key}_expected_${expected}_got_${actual}`)
}

function assertFalseBooleans(report, label) {
  for (const key of falseBooleanKeys) {
    if (report.booleans?.[key] !== false) {
      fail(`${label}_boolean_${key}_not_false:${report.booleans?.[key]}`)
    }
  }
}

function assertToolCoverage(report, label) {
  const records = Array.isArray(report.records) ? report.records : []
  if (records.length !== 21) fail(`${label}_record_count_not_21:${records.length}`)
  for (const toolId of allTools) {
    if (!records.some((record) => record.toolId === toolId)) {
      fail(`${label}_missing_tool:${toolId}`)
    }
  }
  const gpuRecords = records.filter((record) => record.gpuRequiredForRuntime)
  if (gpuRecords.length !== 8) fail(`${label}_gpu_record_count_not_8:${gpuRecords.length}`)
  for (const toolId of gpuTools) {
    const record = records.find((item) => item.toolId === toolId)
    if (!record?.gpuRequiredForRuntime) fail(`${label}_gpu_tool_not_targeted:${toolId}`)
    if (record?.cpuFallbackAllowedForHeavyTool !== false) {
      fail(`${label}_gpu_tool_cpu_fallback_not_false:${toolId}`)
    }
    if (record?.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_gpu_tool_should_start_now_not_false:${toolId}`)
    }
  }
}

for (const filePath of requiredFiles) read(filePath)

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-candidate-evidence-assembly.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-candidate-evidence-assembly.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const pkg = json('package.json')
const source = read('server/tool-registry/ai-graphics-external-beta-candidate-evidence-assembly.ts')
const cli = read('server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts')
const index = read('server/tool-registry/index.ts')

if (docs.decision !== decision) fail(`docs_decision_unexpected:${docs.decision}`)
if (docs.interfaces?.packageScript !== runScriptName) fail('docs_package_script_missing')
if (docs.interfaces?.diagnosticScript !== diagnosticScriptName) fail('docs_diagnostic_script_missing')
if (!docsMd.includes(decision)) fail('markdown_missing_decision')
if (!scorecard.includes(decision)) fail('scorecard_missing_candidate_assembly_decision')
if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_missing_or_changed')
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_missing_or_changed')
}
if (!index.includes("export * from './ai-graphics-external-beta-candidate-evidence-assembly'")) {
  fail('index_export_missing')
}
if (!source.includes('external_beta_candidate_evidence_assembled_runtime_still_blocked')) {
  fail('source_missing_assembled_status')
}
if (!source.includes('gpuRuntimeOnDemandOnly: true')) fail('source_missing_gpu_on_demand_policy')
if (!cli.includes('--external-beta-end-to-end-readiness-packet')) {
  fail('cli_missing_end_to_end_packet_flag')
}
if (!cli.includes('--external-beta-private-artifact-manifest-packet')) {
  fail('cli_missing_private_artifact_packet_flag')
}

for (const toolId of allTools) {
  if (!docs.tools?.includes(toolId)) fail(`docs_missing_tool:${toolId}`)
}
for (const toolId of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(toolId)) fail(`docs_missing_gpu_tool:${toolId}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_total_capabilities_not_12')
if (docs.counts?.installReadyTools !== 21) fail('docs_install_ready_not_21')
if (docs.counts?.productionMappedTools !== 21) fail('docs_production_mapped_not_21')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) {
  fail('docs_heavy_tools_cpu_target_not_0')
}
if (docs.counts?.defaultAssembledExternalBetaCandidateToolsWithProvidedEvidence !== 0) {
  fail('docs_default_assembled_not_0')
}
if (docs.counts?.fullAssembledExternalBetaCandidateToolsWithProvidedEvidence !== 21) {
  fail('docs_full_assembled_not_21')
}
if (docs.counts?.externalBetaReadyNowTools !== 0) fail('docs_external_beta_ready_now_not_0')
if (docs.counts?.productionReadyNowTools !== 0) fail('docs_production_ready_now_not_0')
if (docs.policy?.gpuRuntimeOnDemandOnly !== true) fail('docs_gpu_on_demand_not_true')
if (docs.policy?.noIdleGpuRuntimeApproved !== true) fail('docs_no_idle_gpu_not_true')
if (docs.policy?.cpuFallbackAllowedForHeavyTools !== false) fail('docs_cpu_fallback_not_false')

for (const key of trueBooleanKeys) {
  if (docs.booleans?.[key] !== true) fail(`docs_boolean_${key}_not_true:${docs.booleans?.[key]}`)
}
for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) {
    fail(`docs_boolean_${key}_not_false:${docs.booleans?.[key]}`)
  }
}

const acceptedEndToEndPacket = {
  decision: 'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks',
  status: 'external_beta_candidate_with_provided_evidence_runtime_still_blocked',
  counts: {
    externalBetaCandidateReadyWithProvidedEvidenceTools: 21,
    serviceRoleQueueSmokePreflightReadyToExecute: 1,
    serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence: 21,
    workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
    externalBetaLaunchControlsAcceptedWithProvidedEvidence: 1,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  },
  booleans: {
    externalBetaCandidateReadyWithProvidedEvidence: true,
    externalBetaLaunchControlsAcceptedWithProvidedEvidence: true,
    agentCanExecuteToolsNow: false,
    workerExecutionApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  },
}

const acceptedPrivateArtifactManifestPacket = {
  sourceDecision: 'ai_graphics_external_beta_private_artifact_manifest_prepared_with_runtime_blocks',
  decision: 'external_beta_private_artifact_manifest_ready_with_runtime_blocks',
  privateArtifactManifestReadyWithProvidedEvidence: true,
  manifestRecordsReadyWithProvidedEvidence: 21,
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  booleans: {
    privateArtifactManifestReadyWithProvidedEvidence: true,
    publicArtifactRefsRejected: true,
    signedUrlRefsRejected: true,
    agentCanExecuteToolsNow: false,
    workerDispatchPerformed: false,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  },
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-candidate-'))
const endToEndPath = writeTempJson(tmpDir, 'accepted-end-to-end.json', acceptedEndToEndPacket)
const artifactManifestPath = writeTempJson(
  tmpDir,
  'accepted-private-artifact-manifest.json',
  acceptedPrivateArtifactManifestPacket,
)
const rejectedEndToEndPath = writeTempJson(tmpDir, 'rejected-end-to-end.json', {
  ...acceptedEndToEndPacket,
  counts: {
    ...acceptedEndToEndPacket.counts,
    externalBetaLaunchControlsAcceptedWithProvidedEvidence: 0,
  },
})
const rejectedArtifactManifestPath = writeTempJson(tmpDir, 'rejected-artifact-manifest.json', {
  ...acceptedPrivateArtifactManifestPacket,
  booleans: {
    ...acceptedPrivateArtifactManifestPacket.booleans,
    signedUrlRefsRejected: false,
  },
})

const defaultReport = parseReport(runNpm(runScriptName), 'default')
if (defaultReport.decision !== decision) fail('default_decision_unexpected')
if (defaultReport.status !== 'missing_external_beta_end_to_end_readiness') {
  fail(`default_status_unexpected:${defaultReport.status}`)
}
assertToolCoverage(defaultReport, 'default')
assertCount(defaultReport, 'sourceEndToEndCandidateAcceptedToolsWithProvidedEvidence', 0, 'default')
assertCount(defaultReport, 'sourcePrivateArtifactManifestAcceptedToolsWithProvidedEvidence', 0, 'default')
assertCount(defaultReport, 'assembledExternalBetaCandidateToolsWithProvidedEvidence', 0, 'default')
assertCount(defaultReport, 'externalBetaReadyNowTools', 0, 'default')
assertCount(defaultReport, 'productionReadyNowTools', 0, 'default')
assertFalseBooleans(defaultReport, 'default')

const endToEndOnlyReport = parseReport(runNpm(runScriptName, [
  '--external-beta-end-to-end-readiness-packet',
  endToEndPath,
]), 'end_to_end_only')
if (endToEndOnlyReport.status !== 'missing_external_beta_private_artifact_manifest') {
  fail(`end_to_end_only_status_unexpected:${endToEndOnlyReport.status}`)
}
if (endToEndOnlyReport.booleans?.sourceExternalBetaEndToEndReadinessAccepted !== true) {
  fail('end_to_end_only_source_not_accepted')
}
if (endToEndOnlyReport.booleans?.sourceExternalBetaPrivateArtifactManifestAccepted !== false) {
  fail('end_to_end_only_artifact_accepted')
}
assertCount(endToEndOnlyReport, 'sourceEndToEndCandidateAcceptedToolsWithProvidedEvidence', 21, 'end_to_end_only')
assertCount(endToEndOnlyReport, 'assembledExternalBetaCandidateToolsWithProvidedEvidence', 0, 'end_to_end_only')
assertFalseBooleans(endToEndOnlyReport, 'end_to_end_only')

const rejectedEndToEndReport = parseReport(runNpm(runScriptName, [
  '--external-beta-end-to-end-readiness-packet',
  rejectedEndToEndPath,
]), 'rejected_end_to_end')
if (rejectedEndToEndReport.status !== 'external_beta_end_to_end_readiness_rejected') {
  fail(`rejected_end_to_end_status_unexpected:${rejectedEndToEndReport.status}`)
}
assertCount(rejectedEndToEndReport, 'assembledExternalBetaCandidateToolsWithProvidedEvidence', 0, 'rejected_end_to_end')

const rejectedArtifactReport = parseReport(runNpm(runScriptName, [
  '--external-beta-end-to-end-readiness-packet',
  endToEndPath,
  '--external-beta-private-artifact-manifest-packet',
  rejectedArtifactManifestPath,
]), 'rejected_artifact')
if (rejectedArtifactReport.status !== 'external_beta_private_artifact_manifest_rejected') {
  fail(`rejected_artifact_status_unexpected:${rejectedArtifactReport.status}`)
}
assertCount(rejectedArtifactReport, 'assembledExternalBetaCandidateToolsWithProvidedEvidence', 0, 'rejected_artifact')

const fullReport = parseReport(runNpm(runScriptName, [
  '--external-beta-end-to-end-readiness-packet',
  endToEndPath,
  '--external-beta-private-artifact-manifest-packet',
  artifactManifestPath,
  '--external-beta-candidate-evidence-assembly-ref',
  'external-beta-evidence://ai-graphics/candidate-evidence-assembly/2026-06-29',
]), 'full')
if (fullReport.status !== 'external_beta_candidate_evidence_assembled_runtime_still_blocked') {
  fail(`full_status_unexpected:${fullReport.status}`)
}
if (fullReport.candidateEvidenceAssemblyRef !== 'external-beta-evidence://ai-graphics/candidate-evidence-assembly/2026-06-29') {
  fail('full_candidate_evidence_ref_unexpected')
}
assertToolCoverage(fullReport, 'full')
assertCount(fullReport, 'sourceEndToEndCandidateAcceptedToolsWithProvidedEvidence', 21, 'full')
assertCount(fullReport, 'sourcePrivateArtifactManifestAcceptedToolsWithProvidedEvidence', 21, 'full')
assertCount(fullReport, 'assembledExternalBetaCandidateToolsWithProvidedEvidence', 21, 'full')
assertCount(fullReport, 'externalBetaReadyNowTools', 0, 'full')
assertCount(fullReport, 'productionReadyNowTools', 0, 'full')
if (fullReport.booleans?.sourceExternalBetaEndToEndReadinessAccepted !== true) {
  fail('full_end_to_end_source_not_accepted')
}
if (fullReport.booleans?.sourceExternalBetaPrivateArtifactManifestAccepted !== true) {
  fail('full_artifact_source_not_accepted')
}
if (fullReport.booleans?.assembledExternalBetaCandidateWithProvidedEvidence !== true) {
  fail('full_assembled_boolean_not_true')
}
assertFalseBooleans(fullReport, 'full')
for (const record of fullReport.records || []) {
  if (record.candidateEvidenceAssembledWithProvidedEvidence !== true) {
    fail(`full_record_not_assembled:${record.toolId}`)
  }
  if (record.externalBetaReadyNow !== false || record.productionReadyNow !== false) {
    fail(`full_record_ready_now_not_false:${record.toolId}`)
  }
}

const combinedText = requiredFiles
  .filter((filePath) => filePath !== 'scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs')
  .map(read)
  .join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /workerDispatchApprovedNow["`:\s]+true/i,
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

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
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
  decision,
  defaultStatus: defaultReport.status,
  fullStatus: fullReport.status,
  toolsCovered: allTools.length,
  gpuToolsCovered: gpuTools.length,
  assembledExternalBetaCandidateToolsWithProvidedEvidence:
    fullReport.counts?.assembledExternalBetaCandidateToolsWithProvidedEvidence,
  externalBetaReadyNowTools: fullReport.counts?.externalBetaReadyNowTools,
  productionReadyNowTools: fullReport.counts?.productionReadyNowTools,
  agentCanExecuteToolsNow: fullReport.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: fullReport.booleans?.gpuRuntimeShouldStartNow,
}, null, 2))
