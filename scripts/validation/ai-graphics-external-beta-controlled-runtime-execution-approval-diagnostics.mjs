import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName = 'ai-graphics:external-beta-controlled-runtime-execution-approval'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs'
const decision =
  'ai_graphics_external_beta_controlled_runtime_execution_approval_prepared_with_runtime_blocks'
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
  'server/tool-registry/ai-graphics-external-beta-controlled-runtime-execution-approval.ts',
  'server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts',
  'scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-runtime-execution-approval.json',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-runtime-execution-approval.md',
  'docs/tool-intelligence/ai-graphics/external-beta-candidate-evidence-assembly.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-cpu-static-runtime-admission.json',
  'docs/production-beta-readiness-scorecard.md',
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
  const actual = report[key] ?? report.counts?.[key]
  if (actual !== expected) fail(`${label}_count_${key}_expected_${expected}_got_${actual}`)
}

function assertFalseBooleans(report, label) {
  for (const key of falseBooleanKeys) {
    if (report.booleans?.[key] !== false) {
      fail(`${label}_boolean_${key}_not_false:${report.booleans?.[key]}`)
    }
  }
}

function assertToolScopes(report, label, expectedApprovedScopes, expectedGpuStartAllowed) {
  const scopes = Array.isArray(report.toolScopes) ? report.toolScopes : []
  if (scopes.length !== 21) fail(`${label}_tool_scope_count_not_21:${scopes.length}`)
  for (const toolId of allTools) {
    if (!scopes.some((scope) => scope.toolId === toolId)) {
      fail(`${label}_missing_tool_scope:${toolId}`)
    }
  }
  const approvedScopes = scopes.filter(
    (scope) => scope.controlledRuntimeExecutionScopeApprovedWithProvidedEvidence,
  )
  if (approvedScopes.length !== expectedApprovedScopes) {
    fail(`${label}_approved_scope_count_expected_${expectedApprovedScopes}_got_${approvedScopes.length}`)
  }
  const gpuScopes = scopes.filter((scope) => scope.gpuRequiredForRuntime)
  if (gpuScopes.length !== 8) fail(`${label}_gpu_scope_count_not_8:${gpuScopes.length}`)
  const gpuStartAllowed = gpuScopes.filter(
    (scope) => scope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  )
  if (gpuStartAllowed.length !== expectedGpuStartAllowed) {
    fail(`${label}_gpu_start_allowed_expected_${expectedGpuStartAllowed}_got_${gpuStartAllowed.length}`)
  }
  for (const toolId of gpuTools) {
    const scope = scopes.find((item) => item.toolId === toolId)
    if (!scope?.gpuRequiredForRuntime) fail(`${label}_gpu_tool_not_targeted:${toolId}`)
    if (scope?.controlledRuntimeActivationPolicy?.onDemandOnly !== true) {
      fail(`${label}_gpu_tool_missing_on_demand_policy:${toolId}`)
    }
    if (scope?.controlledRuntimeActivationPolicy?.noIdleGpuRuntimeApproved !== true) {
      fail(`${label}_gpu_tool_missing_no_idle_policy:${toolId}`)
    }
    if (scope?.controlledRuntimeActivationPolicy?.cpuFallbackAllowedForHeavyTools !== false) {
      fail(`${label}_gpu_tool_cpu_fallback_not_false:${toolId}`)
    }
    if (scope?.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_gpu_tool_should_start_now_not_false:${toolId}`)
    }
  }
}

for (const filePath of requiredFiles) read(filePath)

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-controlled-runtime-execution-approval.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-controlled-runtime-execution-approval.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const pkg = json('package.json')
const source = read('server/tool-registry/ai-graphics-external-beta-controlled-runtime-execution-approval.ts')
const cli = read('server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts')
const index = read('server/tool-registry/index.ts')

if (docs.decision !== decision) fail(`docs_decision_unexpected:${docs.decision}`)
if (docs.interfaces?.packageScript !== runScriptName) fail('docs_package_script_missing')
if (docs.interfaces?.diagnosticScript !== diagnosticScriptName) fail('docs_diagnostic_script_missing')
if (!docsMd.includes(decision)) fail('markdown_missing_decision')
if (!scorecard.includes(decision)) fail('scorecard_missing_controlled_runtime_approval')
if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_missing_or_changed')
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_missing_or_changed')
}
if (!index.includes("export * from './ai-graphics-external-beta-controlled-runtime-execution-approval'")) {
  fail('index_export_missing')
}
if (!source.includes('external_beta_controlled_runtime_execution_scope_approved_runtime_still_blocked')) {
  fail('source_missing_approved_status')
}
if (!source.includes('gpuRuntimeOnDemandOnly: true')) fail('source_missing_gpu_on_demand')
if (!source.includes('sourceRuntimeAdmissionServiceRoleQueueSmokeAuthorizationAccepted')) {
  fail('source_missing_runtime_authorization_acceptance')
}
if (!source.includes("mode === 'all_tools_external_beta' || tool.gpuRequiredForRuntime === false")) {
  fail('source_missing_cpu_static_scope_limit')
}
if (!cli.includes('--external-beta-candidate-evidence-assembly-packet')) {
  fail('cli_missing_candidate_packet_flag')
}
if (!cli.includes('--external-beta-controlled-runtime-execution-approval-ref')) {
  fail('cli_missing_approval_ref_flag')
}

for (const toolId of allTools) {
  if (!docs.tools?.includes(toolId)) fail(`docs_missing_tool:${toolId}`)
}
for (const toolId of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(toolId)) fail(`docs_missing_gpu_tool:${toolId}`)
}
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_total_capabilities_not_12')
if (docs.counts?.candidateEvidenceAssembledToolsWithProvidedEvidence !== 21) {
  fail('docs_candidate_evidence_not_21')
}
if (docs.counts?.fullControlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence !== 21) {
  fail('docs_full_controlled_scope_not_21')
}
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.counts?.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools !== 8) {
  fail('docs_gpu_start_allowed_not_8')
}
if (docs.counts?.externalBetaReadyNowTools !== 0) fail('docs_external_beta_ready_now_not_0')
if (docs.counts?.productionReadyNowTools !== 0) fail('docs_production_ready_now_not_0')
if (docs.booleans?.sourceRuntimeAdmissionRuntimeQueueServiceProofBridgeAccepted !== true) {
  fail('docs_source_runtime_admission_proof_bridge_not_true')
}
if (docs.booleans?.sourceRuntimeAdmissionServiceRoleQueueSmokeAuthorizationAccepted !== true) {
  fail('docs_source_runtime_admission_authorization_not_true')
}
if (docs.gpuRuntimeActivationPolicy?.onDemandOnly !== true) fail('docs_gpu_on_demand_not_true')
if (docs.gpuRuntimeActivationPolicy?.noIdleGpuRuntimeApproved !== true) fail('docs_no_idle_gpu_not_true')
if (docs.gpuRuntimeActivationPolicy?.cpuFallbackAllowedForHeavyTools !== false) {
  fail('docs_cpu_fallback_not_false')
}
for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) {
    fail(`docs_boolean_${key}_not_false:${docs.booleans?.[key]}`)
  }
}

const acceptedCandidatePacket = {
  decision: 'ai_graphics_external_beta_candidate_evidence_assembly_prepared_with_runtime_blocks',
  status: 'external_beta_candidate_evidence_assembled_runtime_still_blocked',
  counts: {
    assembledExternalBetaCandidateToolsWithProvidedEvidence: 21,
    gpuRuntimeTargetedTools: 8,
    heavyToolsIncorrectlyTargetingCpu: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  },
  booleans: {
    sourceExternalBetaEndToEndReadinessAccepted: true,
    sourceExternalBetaPrivateArtifactManifestAccepted: true,
    assembledExternalBetaCandidateWithProvidedEvidence: true,
    agentCanExecuteToolsNow: false,
    workerExecutionApprovedNow: false,
    workerQueueApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  },
}

const acceptedAllToolsRuntimeAdmissionPacket = {
  sourceDecision: 'ai_graphics_external_beta_runtime_admission_contract_prepared_with_runtime_blocks',
  decision: 'external_beta_runtime_admission_ready_for_worker_enqueue',
  sourceLaunchGoNoGoAccepted: true,
  sourceLaunchGoNoGoRuntimeProofBridgeAccepted: true,
  sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted: true,
  externalBetaRuntimeAdmissionReadyWithProvidedEvidence: true,
  externalBetaWorkerEnqueueAllowedWithProvidedEvidence: true,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  booleans: {
    sourceExternalBetaLaunchGoNoGoAccepted: true,
    sourceExternalBetaLaunchGoNoGoRuntimeProofBridgeAccepted: true,
    sourceExternalBetaLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted: true,
    agentCanExecuteToolsNow: false,
    workerQueueApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
  },
}

const acceptedCpuStaticRuntimeAdmissionPacket = {
  sourceDecision: 'ai_graphics_external_beta_cpu_static_runtime_admission_prepared_with_gpu_blocks',
  decision: 'external_beta_cpu_static_runtime_admission_ready_for_worker_enqueue',
  sourceRuntimeQueueServiceProofBridgeAccepted: true,
  sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
  cpuStaticRuntimeAdmissionReadyWithProvidedEvidence: true,
  externalBetaWorkerEnqueueAllowedWithProvidedEvidence: true,
  selectedToolInCpuStaticCohort: true,
  selectedToolBlockedPendingNativeGpuProof: false,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  booleans: {
    sourceRuntimeQueueServiceProofBridgeAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    agentCanExecuteToolsNow: false,
    workerQueueApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
  },
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-controlled-runtime-approval-'))
const candidatePath = writeTempJson(tmpRoot, 'accepted-candidate.json', acceptedCandidatePacket)
const runtimeAdmissionPath = writeTempJson(
  tmpRoot,
  'accepted-runtime-admission.json',
  acceptedAllToolsRuntimeAdmissionPacket,
)
const cpuStaticRuntimeAdmissionPath = writeTempJson(
  tmpRoot,
  'accepted-cpu-static-runtime-admission.json',
  acceptedCpuStaticRuntimeAdmissionPacket,
)
const rejectedCandidatePath = writeTempJson(tmpRoot, 'rejected-candidate.json', {
  ...acceptedCandidatePacket,
  counts: {
    ...acceptedCandidatePacket.counts,
    assembledExternalBetaCandidateToolsWithProvidedEvidence: 0,
  },
})
const rejectedRuntimeAdmissionPath = writeTempJson(tmpRoot, 'rejected-runtime-admission.json', {
  ...acceptedAllToolsRuntimeAdmissionPacket,
  booleans: {
    ...acceptedAllToolsRuntimeAdmissionPacket.booleans,
    gpuRuntimeShouldStartNow: true,
  },
})

const defaultReport = parseReport(runNpm(runScriptName), 'default')
if (defaultReport.decision !== decision) fail('default_decision_unexpected')
if (defaultReport.status !== 'missing_external_beta_candidate_evidence_assembly') {
  fail(`default_status_unexpected:${defaultReport.status}`)
}
assertToolScopes(defaultReport, 'default', 0, 0)
assertCount(defaultReport, 'controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence', 0, 'default')
assertFalseBooleans(defaultReport, 'default')

const candidateOnlyReport = parseReport(runNpm(runScriptName, [
  '--external-beta-candidate-evidence-assembly-packet',
  candidatePath,
]), 'candidate_only')
if (candidateOnlyReport.status !== 'missing_external_beta_runtime_admission') {
  fail(`candidate_only_status_unexpected:${candidateOnlyReport.status}`)
}
assertCount(candidateOnlyReport, 'candidateEvidenceAssembledToolsWithProvidedEvidence', 21, 'candidate_only')
assertCount(candidateOnlyReport, 'controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence', 0, 'candidate_only')
assertFalseBooleans(candidateOnlyReport, 'candidate_only')

const rejectedCandidateReport = parseReport(runNpm(runScriptName, [
  '--external-beta-candidate-evidence-assembly-packet',
  rejectedCandidatePath,
]), 'rejected_candidate')
if (rejectedCandidateReport.status !== 'external_beta_candidate_evidence_assembly_rejected') {
  fail(`rejected_candidate_status_unexpected:${rejectedCandidateReport.status}`)
}

const rejectedRuntimeReport = parseReport(runNpm(runScriptName, [
  '--external-beta-candidate-evidence-assembly-packet',
  candidatePath,
  '--external-beta-runtime-admission-packet',
  rejectedRuntimeAdmissionPath,
]), 'rejected_runtime')
if (rejectedRuntimeReport.status !== 'external_beta_runtime_admission_rejected') {
  fail(`rejected_runtime_status_unexpected:${rejectedRuntimeReport.status}`)
}

const awaitingReport = parseReport(runNpm(runScriptName, [
  '--external-beta-candidate-evidence-assembly-packet',
  candidatePath,
  '--external-beta-runtime-admission-packet',
  runtimeAdmissionPath,
]), 'awaiting')
if (awaitingReport.status !== 'awaiting_external_beta_controlled_runtime_execution_approval') {
  fail(`awaiting_status_unexpected:${awaitingReport.status}`)
}
if (awaitingReport.booleans?.sourceExternalBetaRuntimeAdmissionAccepted !== true) {
  fail('awaiting_runtime_admission_not_accepted')
}
if (
  awaitingReport.booleans
    ?.sourceRuntimeAdmissionServiceRoleQueueSmokeAuthorizationAccepted !== true
) {
  fail('awaiting_runtime_authorization_not_accepted')
}
assertToolScopes(awaitingReport, 'awaiting', 0, 0)
assertCount(awaitingReport, 'controlledRuntimeExecutionCandidateToolsWithProvidedEvidence', 21, 'awaiting')
assertCount(awaitingReport, 'controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence', 0, 'awaiting')
assertFalseBooleans(awaitingReport, 'awaiting')

const fullReport = parseReport(runNpm(runScriptName, [
  '--external-beta-candidate-evidence-assembly-packet',
  candidatePath,
  '--external-beta-runtime-admission-packet',
  runtimeAdmissionPath,
  '--external-beta-controlled-runtime-execution-approval-granted',
  '--external-beta-controlled-runtime-execution-approval-ref',
  'external-beta-runtime://ai-graphics/controlled-runtime-execution/approval',
  '--external-beta-controlled-runtime-execution-approver-role',
  'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER',
]), 'full')
if (fullReport.status !== 'external_beta_controlled_runtime_execution_scope_approved_runtime_still_blocked') {
  fail(`full_status_unexpected:${fullReport.status}`)
}
if (fullReport.sourceRuntimeAdmissionMode !== 'all_tools_external_beta') {
  fail(`full_runtime_mode_unexpected:${fullReport.sourceRuntimeAdmissionMode}`)
}
assertToolScopes(fullReport, 'full', 21, 8)
assertCount(fullReport, 'controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence', 21, 'full')
assertCount(fullReport, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools', 8, 'full')
assertCount(fullReport, 'externalBetaReadyNowTools', 0, 'full')
assertCount(fullReport, 'productionReadyNowTools', 0, 'full')
if (fullReport.controlledRuntimeExecutionApprovalRecord?.approvesRuntimeNow !== false) {
  fail('full_approval_record_approves_runtime_now_not_false')
}
assertFalseBooleans(fullReport, 'full')

const strippedAuthorizationRuntimeAdmissionPath = writeTempJson(
  tmpRoot,
  'stripped-authorization-runtime-admission.json',
  {
    ...acceptedAllToolsRuntimeAdmissionPacket,
    sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted: false,
    booleans: {
      ...acceptedAllToolsRuntimeAdmissionPacket.booleans,
      sourceExternalBetaLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted:
        false,
    },
  },
)
const strippedAuthorizationReport = parseReport(runNpm(runScriptName, [
  '--external-beta-candidate-evidence-assembly-packet',
  candidatePath,
  '--external-beta-runtime-admission-packet',
  strippedAuthorizationRuntimeAdmissionPath,
  '--external-beta-controlled-runtime-execution-approval-granted',
  '--external-beta-controlled-runtime-execution-approval-ref',
  'external-beta-runtime://ai-graphics/controlled-runtime-execution/approval',
  '--external-beta-controlled-runtime-execution-approver-role',
  'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER',
]), 'stripped_authorization')
if (strippedAuthorizationReport.status !== 'external_beta_runtime_admission_rejected') {
  fail(`stripped_authorization_status:${strippedAuthorizationReport.status}`)
}

const cpuStaticReport = parseReport(runNpm(runScriptName, [
  '--external-beta-candidate-evidence-assembly-packet',
  candidatePath,
  '--external-beta-cpu-static-runtime-admission-packet',
  cpuStaticRuntimeAdmissionPath,
  '--external-beta-controlled-runtime-execution-approval-granted',
  '--external-beta-controlled-runtime-execution-approval-ref',
  'external-beta-runtime://ai-graphics/controlled-runtime-execution/cpu-static-approval',
  '--external-beta-controlled-runtime-execution-approver-role',
  'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER',
]), 'cpu_static')
if (cpuStaticReport.status !== 'external_beta_controlled_runtime_execution_scope_approved_runtime_still_blocked') {
  fail(`cpu_static_status_unexpected:${cpuStaticReport.status}`)
}
if (cpuStaticReport.sourceRuntimeAdmissionMode !== 'cpu_static_first_cohort') {
  fail(`cpu_static_runtime_mode_unexpected:${cpuStaticReport.sourceRuntimeAdmissionMode}`)
}
assertToolScopes(cpuStaticReport, 'cpu_static', 13, 0)
assertCount(cpuStaticReport, 'controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence', 13, 'cpu_static')
assertCount(cpuStaticReport, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools', 0, 'cpu_static')
assertFalseBooleans(cpuStaticReport, 'cpu_static')

const combinedText = requiredFiles
  .filter((filePath) => filePath !== 'scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs')
  .map(read)
  .join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s]+true/i,
  /liveQueueWriteApprovedNow["`:\s]+true/i,
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
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization": "tsx server/cli/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization.ts",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result": "tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activation-go-no-go": "tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts",',
  '+    "ai-graphics:external-beta-activation-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
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
  cpuStaticApprovedScopes:
    cpuStaticReport.controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence,
  fullApprovedScopes:
    fullReport.controlledRuntimeExecutionScopeApprovedToolsWithProvidedEvidence,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
    fullReport.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools,
  externalBetaReadyNowTools: fullReport.externalBetaReadyNowTools,
  productionReadyNowTools: fullReport.productionReadyNowTools,
  agentCanExecuteToolsNow: fullReport.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: fullReport.booleans?.gpuRuntimeShouldStartNow,
}, null, 2))
