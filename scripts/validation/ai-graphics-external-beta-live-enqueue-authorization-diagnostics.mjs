import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName = 'ai-graphics:external-beta-live-enqueue-authorization'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-live-enqueue-authorization:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs'
const controlledRuntimeApprovalScriptName =
  'ai-graphics:external-beta-controlled-runtime-execution-approval'
const decision =
  'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks'
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
  'server/tool-registry/ai-graphics-external-beta-live-enqueue-authorization.ts',
  'server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts',
  'scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.md',
  'docs/tool-intelligence/ai-graphics/external-beta-controlled-runtime-execution-approval.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json',
  'docs/production-beta-readiness-scorecard.md',
]

const falseBooleanKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'liveJobBatchInsertApprovedNow',
  'liveJobInsertApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
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
  'workerEnqueuePerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'serviceRoleQueueSmokePerformed',
  'serviceRoleTransactionPerformed',
  'supabaseMutationPerformed',
  'liveQueueWritePerformed',
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

const bannedRuntimeClaims = [
  /agentCanExecuteToolsNow["':\s]+true/,
  /routeExecutionApprovedNow["':\s]+true/,
  /workerExecutionApprovedNow["':\s]+true/,
  /workerQueueApprovedNow["':\s]+true/,
  /backendQueueSubmissionApprovedNow["':\s]+true/,
  /liveQueueWriteApprovedNow["':\s]+true/,
  /toolExecutionApprovedNow["':\s]+true/,
  /providerRuntimeApprovedNow["':\s]+true/,
  /browserWebglCanvasRuntimeApprovedNow["':\s]+true/,
  /gpuRuntimeApprovedNow["':\s]+true/,
  /runtimeReadyNow["':\s]+true/,
  /internalBetaReadyNow["':\s]+true/,
  /externalBetaReadyNow["':\s]+true/,
  /productionReadyNow["':\s]+true/,
  /dependencyInstallPerformed["':\s]+true/,
  /packageLockMutationPerformed["':\s]+true/,
  /toolExecutionPerformed["':\s]+true/,
  /workerExecutionPerformed["':\s]+true/,
  /routeExecutionPerformed["':\s]+true/,
  /supabaseMutationPerformed["':\s]+true/,
  /gcsUploadPerformed["':\s]+true/,
  /publicArtifactCreated["':\s]+true/,
  /signedUrlCreated["':\s]+true/,
  /dry_run_passed/,
  /generated_local_fixture_passed/,
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

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeTempJson(root, filename, value) {
  const filePath = path.join(root, filename)
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function assertFalseBooleans(report, label) {
  for (const key of falseBooleanKeys) {
    if (report.booleans?.[key] !== false) {
      fail(`${label}_boolean_${key}_not_false:${report.booleans?.[key]}`)
    }
  }
}

function assertToolScopes(report, label, expectedRecordedScopes, expectedGpuStartAllowed) {
  const scopes = Array.isArray(report.toolScopes) ? report.toolScopes : []
  if (scopes.length !== 21) fail(`${label}_scope_count_not_21:${scopes.length}`)
  for (const toolId of allTools) {
    if (!scopes.some((scope) => scope.toolId === toolId)) {
      fail(`${label}_missing_tool_scope:${toolId}`)
    }
  }
  const recorded = scopes.filter(
    (scope) => scope.liveEnqueueAuthorizationRecordedWithProvidedEvidence,
  )
  if (recorded.length !== expectedRecordedScopes) {
    fail(`${label}_recorded_scope_count_expected_${expectedRecordedScopes}_got_${recorded.length}`)
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
    if (scope?.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_gpu_tool_should_start_now_not_false:${toolId}`)
    }
  }
}

function assertCounts(report, label, expectedRecordedScopes, expectedGpuStartAllowed) {
  if (report.totalAiGraphicsTools !== 21) fail(`${label}_total_tools_not_21`)
  if (report.totalProductFacingCapabilities !== 12) fail(`${label}_capabilities_not_12`)
  if (report.controlledRuntimeExecutionApprovedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_controlled_runtime_scopes_not_21`)
  }
  if (report.runtimeQueueServiceBridgeAcceptedWithProvidedEvidenceRequests !== 1) {
    fail(`${label}_runtime_queue_service_bridge_request_not_1`)
  }
  if (report.liveEnqueueAuthorizationCandidateToolsWithProvidedEvidence !== 21) {
    fail(`${label}_candidate_scopes_not_21`)
  }
  if (report.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence !== expectedRecordedScopes) {
    fail(`${label}_recorded_scopes_expected_${expectedRecordedScopes}_got_${report.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence}`)
  }
  if (report.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_targeted_not_8`)
  if (report.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools !== expectedGpuStartAllowed) {
    fail(`${label}_gpu_start_allowed_expected_${expectedGpuStartAllowed}_got_${report.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools}`)
  }
  for (const [key, expected] of [
    ['heavyToolsIncorrectlyTargetingCpu', 0],
    ['liveQueueWritesApprovedNowTools', 0],
    ['liveQueueWritesPerformedNowTools', 0],
    ['workerDispatchApprovedNowTools', 0],
    ['toolExecutionApprovedNowTools', 0],
    ['externalBetaReadyNowTools', 0],
    ['productionReadyNowTools', 0],
  ]) {
    if (report[key] !== expected) fail(`${label}_${key}_expected_${expected}_got_${report[key]}`)
  }
}

function runtimeQueueServiceBridgeFixture() {
  return {
    decision: 'external_beta_runtime_queue_service_payload_ready',
    sourceDecision:
      'ai_graphics_external_beta_runtime_queue_service_bridge_prepared_with_runtime_blocks',
    sourceExternalBetaLocalQueueStorageDecision:
      'ai_graphics_external_beta_local_queue_storage_mock_write_prepared_with_runtime_blocks',
    capabilityId: 'subject_segmentation',
    requestedToolId: 'sam2',
    executionRequested: true,
    sourceExternalBetaLocalQueueStorageAccepted: true,
    sourceExternalBetaLocalQueueStorageProofBridgeAccepted: true,
    missingRuntimeQueueServiceControls: [],
    externalBetaRuntimeQueueServiceControlsSatisfied: true,
    runtimeQueueServicePayloadReadyWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true,
    localMockRuntimeQueueServiceBatchesCreatedNow: 1,
    localMockRuntimeQueueServiceJobsCreatedNow: 1,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      externalBetaRuntimeQueueServiceBridgePrepared: true,
      sourceExternalBetaLocalQueueStorageAccepted: true,
      sourceExternalBetaLocalQueueStorageProofBridgeAccepted: true,
      externalBetaRuntimeQueueServiceControlsSatisfied: true,
      runtimeQueueServicePayloadReadyWithProvidedEvidence: true,
      canonicalRuntimeQueueServiceValidationPassed: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      usesExistingAiGraphicsRuntimeQueueService: true,
      runtimeQueueServiceMockOnly: true,
      runtimeQueueServiceUsesServiceRoleRpcNames: true,
      aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit: true,
      approvedSnapshotRefAccepted: true,
      creditReservationRefAccepted: true,
      privateArtifactManifestOnly: true,
      workerClaimReadinessPreparedButNotCalled: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

for (const filePath of requiredFiles) read(filePath)

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const pkg = json('package.json')
const source = read('server/tool-registry/ai-graphics-external-beta-live-enqueue-authorization.ts')
const cli = read('server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts')
const index = read('server/tool-registry/index.ts')

if (docs.decision !== decision) fail(`docs_decision_unexpected:${docs.decision}`)
if (docs.interfaces?.packageScript !== runScriptName) fail('docs_package_script_missing')
if (docs.interfaces?.diagnosticScript !== diagnosticScriptName) {
  fail('docs_diagnostic_script_missing')
}
if (!docsMd.includes(decision)) fail('markdown_missing_decision')
if (!scorecard.includes(decision)) fail('scorecard_missing_live_enqueue_authorization')
if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_missing')
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_missing')
}
if (!index.includes("export * from './ai-graphics-external-beta-live-enqueue-authorization'")) {
  fail('index_export_missing')
}
if (!source.includes('external_beta_live_enqueue_authorization_recorded_runtime_still_blocked')) {
  fail('source_missing_recorded_status')
}
if (!source.includes('AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OPERATOR')) {
  fail('source_missing_runtime_operator_role')
}
if (!source.includes('gpuRuntimeOnDemandOnly: true')) fail('source_missing_gpu_on_demand')
if (!source.includes('liveQueueWriteApprovedNow: false')) {
  fail('source_missing_live_queue_block')
}
if (!cli.includes('--external-beta-controlled-runtime-execution-approval-packet')) {
  fail('cli_missing_controlled_runtime_packet_flag')
}
if (!cli.includes('--external-beta-live-enqueue-authorization-granted')) {
  fail('cli_missing_authorization_flag')
}

for (const toolId of allTools) {
  if (!docs.tools?.includes(toolId)) fail(`docs_missing_tool:${toolId}`)
}
for (const toolId of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(toolId)) {
    fail(`docs_missing_gpu_tool:${toolId}`)
  }
}
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail('docs_capabilities_not_12')
}
if (docs.counts?.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence !== 21) {
  fail('docs_recorded_scope_count_not_21')
}
if (docs.counts?.liveQueueWritesApprovedNowTools !== 0) {
  fail('docs_live_queue_approved_now_not_0')
}
if (docs.counts?.externalBetaReadyNowTools !== 0) {
  fail('docs_external_beta_ready_now_not_0')
}
if (docs.counts?.productionReadyNowTools !== 0) {
  fail('docs_production_ready_now_not_0')
}
if (docs.authorizationScope?.liveQueueWriteNow !== false) {
  fail('docs_authorization_scope_allows_live_queue_write')
}
if (docs.authorizationScope?.runtimeNow !== false) {
  fail('docs_authorization_scope_allows_runtime')
}

for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_boolean_${key}_not_false`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-live-enqueue-auth-'))

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

const acceptedRuntimeAdmissionPacket = {
  sourceDecision: 'ai_graphics_external_beta_runtime_admission_contract_prepared_with_runtime_blocks',
  decision: 'external_beta_runtime_admission_ready_for_worker_enqueue',
  sourceLaunchGoNoGoAccepted: true,
  sourceLaunchGoNoGoRuntimeProofBridgeAccepted: true,
  externalBetaRuntimeAdmissionReadyWithProvidedEvidence: true,
  externalBetaWorkerEnqueueAllowedWithProvidedEvidence: true,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  booleans: {
    sourceExternalBetaLaunchGoNoGoAccepted: true,
    sourceExternalBetaLaunchGoNoGoRuntimeProofBridgeAccepted: true,
    agentCanExecuteToolsNow: false,
    workerQueueApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
  },
}

const acceptedCandidateFile = writeTempJson(
  tmpRoot,
  'accepted-candidate-evidence-assembly.json',
  acceptedCandidatePacket,
)
const acceptedRuntimeAdmissionFile = writeTempJson(
  tmpRoot,
  'accepted-runtime-admission.json',
  acceptedRuntimeAdmissionPacket,
)

const controlledRuntimeApproval = parseJsonOutput(
  runNpm(controlledRuntimeApprovalScriptName, [
    '--external-beta-candidate-evidence-assembly-packet',
    acceptedCandidateFile,
    '--external-beta-runtime-admission-packet',
    acceptedRuntimeAdmissionFile,
    '--external-beta-controlled-runtime-execution-approval-granted',
    '--external-beta-controlled-runtime-execution-approval-ref',
    'external-beta-runtime://controlled-runtime-approval/diagnostic',
    '--external-beta-controlled-runtime-execution-approver-role',
    'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OWNER',
  ]),
  'controlled_runtime_approval',
)
const controlledRuntimeFile = writeTempJson(
  tmpRoot,
  'controlled-runtime-approval.json',
  controlledRuntimeApproval,
)
const runtimeQueueServiceBridgeFile = writeTempJson(
  tmpRoot,
  'runtime-queue-service-bridge.json',
  runtimeQueueServiceBridgeFixture(),
)

const missingControlled = parseJsonOutput(
  runNpm(runScriptName),
  'missing_controlled',
)
if (missingControlled.status !== 'missing_external_beta_controlled_runtime_execution_approval') {
  fail(`missing_controlled_status_unexpected:${missingControlled.status}`)
}

const awaitingAuthorization = parseJsonOutput(
  runNpm(runScriptName, [
    '--external-beta-controlled-runtime-execution-approval-packet',
    controlledRuntimeFile,
    '--external-beta-runtime-queue-service-bridge-packet',
    runtimeQueueServiceBridgeFile,
  ]),
  'awaiting_authorization',
)
if (awaitingAuthorization.status !== 'awaiting_external_beta_live_enqueue_authorization') {
  fail(`awaiting_authorization_status_unexpected:${awaitingAuthorization.status}`)
}
assertCounts(awaitingAuthorization, 'awaiting_authorization', 0, 0)
assertFalseBooleans(awaitingAuthorization, 'awaiting_authorization')
assertToolScopes(awaitingAuthorization, 'awaiting_authorization', 0, 0)

const accepted = parseJsonOutput(
  runNpm(runScriptName, [
    '--external-beta-controlled-runtime-execution-approval-packet',
    controlledRuntimeFile,
    '--external-beta-runtime-queue-service-bridge-packet',
    runtimeQueueServiceBridgeFile,
    '--external-beta-live-enqueue-authorization-granted',
    '--external-beta-live-enqueue-authorization-ref',
    'external-beta-live-enqueue://authorization/diagnostic',
    '--external-beta-live-enqueue-operator-role',
    'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OPERATOR',
    '--external-beta-non-production-environment-ref',
    'external-beta-runtime://environment/non-production-diagnostic',
    '--external-beta-queue-write-window-ref',
    'external-beta-runtime://queue-window/non-production-diagnostic',
    '--external-beta-cleanup-plan-ref',
    'external-beta-runtime://cleanup/non-production-diagnostic',
    '--external-beta-rollback-plan-ref',
    'external-beta-runtime://rollback/non-production-diagnostic',
    '--external-beta-cost-ceiling-ref',
    'external-beta-runtime://cost-ceiling/non-production-diagnostic',
  ]),
  'accepted',
)
if (accepted.decision !== decision) fail(`accepted_decision_unexpected:${accepted.decision}`)
if (accepted.status !== 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked') {
  fail(`accepted_status_unexpected:${accepted.status}`)
}
assertCounts(accepted, 'accepted', 21, 8)
assertFalseBooleans(accepted, 'accepted')
assertToolScopes(accepted, 'accepted', 21, 8)
if (accepted.liveEnqueueAuthorizationRecord?.authorizesLiveQueueWriteNow !== false) {
  fail('accepted_record_authorizes_live_queue_write_now')
}
if (accepted.liveEnqueueAuthorizationRecord?.authorizesRuntimeNow !== false) {
  fail('accepted_record_authorizes_runtime_now')
}
if (accepted.booleans?.all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence !== true) {
  fail('accepted_scopes_not_recorded_with_provided_evidence')
}
if (accepted.booleans?.sourceControlledRuntimeExecutionApprovalAccepted !== true) {
  fail('accepted_source_controlled_runtime_not_accepted')
}
if (accepted.booleans?.sourceRuntimeQueueServiceBridgeAccepted !== true) {
  fail('accepted_runtime_queue_bridge_not_accepted')
}
if (accepted.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('accepted_gpu_should_start_now_not_false')
}

const changedFiles = git(['diff', '--name-only', baseRef])
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean)

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package_lock_changed')
}
if (git(['ls-files', '.local-artifacts'])) fail('local_artifacts_tracked')
if (changedFiles.some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_changed')
}
for (const filePath of changedFiles) {
  if (
    /(^|\/)(generated|render|browser|canvas|webgl|public|signed-url|media-output|video-output|image-output)(\/|$)/i.test(filePath)
  ) {
    fail(`generated_or_public_output_changed:${filePath}`)
  }
}

const pkgDiff = git(['diff', baseRef, '--', 'package.json'])
if (/^\+.*"(dependencies|devDependencies|optionalDependencies|peerDependencies)"/m.test(pkgDiff)) {
  fail('package_dependency_section_changed')
}
if (!pkgDiff.includes(runScriptName) || !pkgDiff.includes(diagnosticScriptName)) {
  fail('package_diff_missing_new_scripts')
}

for (const filePath of [
  'server/tool-registry/ai-graphics-external-beta-live-enqueue-authorization.ts',
  'server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.md',
  'docs/production-beta-readiness-scorecard.md',
]) {
  const content = read(filePath)
  for (const pattern of bannedRuntimeClaims) {
    if (pattern.test(content)) fail(`banned_runtime_claim:${filePath}:${pattern}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  checkedTools: allTools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence:
    accepted.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence,
  liveQueueWritesApprovedNowTools: accepted.liveQueueWritesApprovedNowTools,
  liveQueueWritesPerformedNowTools: accepted.liveQueueWritesPerformedNowTools,
  gpuRuntimeShouldStartNow: accepted.booleans.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: accepted.externalBetaReadyNowTools,
  productionReadyNowTools: accepted.productionReadyNowTools,
}, null, 2))
