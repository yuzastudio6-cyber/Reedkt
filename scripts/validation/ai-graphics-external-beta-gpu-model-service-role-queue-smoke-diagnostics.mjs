import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const runScriptName =
  'ai-graphics:external-beta-gpu-model-service-role-queue-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-gpu-model-service-role-queue-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-diagnostics.mjs'
const decision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_harness_prepared_with_runtime_blocks'
const status = 'gpu_model_service_role_queue_smoke_prepared_not_executed'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'

const gpuModelTools = [
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
  'server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.md',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-operator-preflight.json',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/supabase/admin-client.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const falseBooleanKeys = [
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'serviceRoleQueueSmokeApprovedNow',
  'liveServiceRoleQueueSmokeExecutedNow',
  'liveQueueWriteApprovedNow',
  'liveWorkerClaimApprovedNow',
  'workerDispatchApprovedNow',
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
  'routeExecutionPerformed',
  'workerExecutionPerformed',
  'workerDispatchPerformed',
  'toolExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const forbiddenDocPatterns = [
  /agentCanExecuteGpuModelToolsNow[`":\s=]+true/i,
  /agentCanExecuteAll21ToolsNow[`":\s=]+true/i,
  /workerExecutionApprovedNow[`":\s=]+true/i,
  /toolExecutionApprovedNow[`":\s=]+true/i,
  /gpuRuntimeApprovedNow[`":\s=]+true/i,
  /gpuRuntimeShouldStartNow[`":\s=]+true/i,
  /runtimeReadyNow[`":\s=]+true/i,
  /externalBetaReadyNow[`":\s=]+true/i,
  /productionReadyNow[`":\s=]+true/i,
  /modelWeightsDownloaded[`":\s=]+true/i,
  /modelWeightsLoaded[`":\s=]+true/i,
  /modelInferencePerformed[`":\s=]+true/i,
  /gcsUploadPerformed[`":\s=]+true/i,
  /publicArtifactCreated[`":\s=]+true/i,
  /signedUrlCreated[`":\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif|pdf)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  const filePath = absolute(file)
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function exec(name, args) {
  return execFileSync(name, args, {
    cwd: root,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 128 * 1024 * 1024,
  })
}

function git(args) {
  return exec('git', args).trim()
}

function runNpm(scriptName) {
  return exec('npm', ['run', '--silent', scriptName])
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  if (report.preparedScript !== runScriptName) fail(`${label}_prepared_script_mismatch`)
  if (
    report.executeFlagRequired !==
    '--execute-external-beta-gpu-model-service-role-queue-smoke'
  ) {
    fail(`${label}_execute_flag_mismatch`)
  }

  const tools = Array.isArray(report.gpuModelTools) ? report.gpuModelTools : []
  if (tools.length !== 8) fail(`${label}_gpu_tool_count_mismatch:${tools.length}`)
  const seen = new Set(tools.map((tool) => tool.toolId))
  for (const tool of gpuModelTools) {
    if (!seen.has(tool)) fail(`${label}_missing_gpu_model_tool:${tool}`)
  }
  for (const tool of tools) {
    if (tool.workerType !== 'gpu_ai_worker') fail(`${label}_${tool.toolId}_worker_mismatch`)
    if (!String(tool.runtimeTarget ?? '').includes('native_linux_amd64_nvidia_l4')) {
      fail(`${label}_${tool.toolId}_runtime_target_not_gpu`)
    }
    if (tool.queueSmokeReadyWithProvidedEvidence !== true) {
      fail(`${label}_${tool.toolId}_queue_smoke_not_ready`)
    }
    if (tool.productionWorkerRouteableToSpecificHandler !== true) {
      fail(`${label}_${tool.toolId}_production_worker_specific_handler_not_true`)
    }
    if (!String(tool.productionWorkerFutureHandler ?? '').startsWith('gpu_ai_worker_')) {
      fail(`${label}_${tool.toolId}_production_worker_future_handler_missing`)
    }
    if (tool.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_${tool.toolId}_gpu_start_now_not_false`)
    }
  }

  const counts = report.counts ?? {}
  const expectedCounts = {
    totalAiGraphicsTools: 21,
    gpuModelToolsCovered: 8,
    sourceGpuModelWorkerBoundaryProofAcceptedTools: 8,
    sourceExternalAgentGpuModelRuntimeQueueServiceBridgeAcceptedTools: 8,
    sourceProductionWorkerPayloadsPreparedWithProvidedEvidenceTools: 8,
    sourceProductionWorkerSpecificHandlerRoutesWithProvidedEvidenceTools: 8,
    sourceModelRuntimeFoundationWorkerRoutesWithProvidedEvidenceTools: 2,
    sourceMaskCompositionWorkerRoutesWithProvidedEvidenceTools: 5,
    sourceEnhancementWorkerRoutesWithProvidedEvidenceTools: 1,
    gpuModelServiceRoleQueueSmokeReadyTools: 8,
    gpuModelServiceRoleQueueSmokeExecutableWhenExplicitlyAuthorizedTools: 8,
    expectedLiveQueueRowsBeforeCleanup: 8,
    expectedWorkerClaimRowsBeforeCleanup: 8,
    expectedPersistedRowsAfterCleanup: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    liveServiceRoleQueueSmokeExecutedNow: 0,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNowTools: 0,
    modelWeightsLoadedTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (counts[key] !== expected) fail(`${label}_count_${key}_mismatch:${counts[key]}`)
  }

  const booleans = report.booleans ?? {}
  const requiredTrue = [
    'externalBetaGpuModelServiceRoleQueueSmokeHarnessPrepared',
    'sourceGpuModelWorkerBoundaryProofAccepted',
    'sourceExternalAgentGpuModelRuntimeQueueServiceBridgeAccepted',
    'all8GpuModelProductionWorkerPayloadsPreparedWithProvidedEvidence',
    'all8GpuModelProductionWorkerRoutesHitSpecificHandlersWithProvidedEvidence',
    'twoFoundationWorkerRoutesAcceptedWithProvidedEvidence',
    'fiveMaskWorkerRoutesAcceptedWithProvidedEvidence',
    'oneEnhancementWorkerRouteAcceptedWithProvidedEvidence',
    'sourceServiceRoleQueueSmokeAuthorizationRequired',
    'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightRequired',
    'all8GpuModelToolsCovered',
    'all8GpuModelToolsTargetGpuRuntime',
    'all8GpuModelToolsReadyForExplicitNonProductionQueueSmoke',
    'usesExistingAiGraphicsRuntimeQueueService',
    'usesExistingProductionWorkerDispatcherBoundary',
    'serviceRoleCredentialsServerOnly',
    'nonProductionEnvironmentRequired',
    'explicitSmokeConfirmationRequired',
    'cleanupRequired',
    'rollbackRequired',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuStartsOnlyForApprovedWorkerOrToolCall',
    'agentCanSelectForPlanning',
  ]
  for (const key of requiredTrue) {
    if (booleans[key] !== true) fail(`${label}_boolean_${key}_not_true`)
  }
  for (const key of falseBooleanKeys) {
    if (booleans[key] !== false) fail(`${label}_boolean_${key}_not_false`)
  }
  if (booleans.newGpuWorkerCreated !== false) {
    fail(`${label}_boolean_newGpuWorkerCreated_not_false`)
  }
}

function checkSourcePackets() {
  const boundary = json('docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.json')
  if (boundary.decision !== 'ai_graphics_external_beta_gpu_model_worker_boundary_proof_passed_with_existing_worker_path') {
    fail('source_boundary_decision_mismatch')
  }
  if (boundary.counts?.gpuModelToolsCovered !== 8) fail('source_boundary_tool_count_mismatch')
  if (boundary.booleans?.newGpuWorkerCreated !== false) fail('source_boundary_new_gpu_worker_not_false')
  if (boundary.booleans?.gpuRuntimeShouldStartNow !== false) fail('source_boundary_gpu_start_not_false')

  const bridge = json('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.json')
  if (bridge.decision !== 'ai_graphics_external_agent_gpu_model_runtime_queue_service_bridge_prepared_with_runtime_blocks') {
    fail('source_runtime_queue_bridge_decision_mismatch')
  }
  if (bridge.counts?.productionWorkerPayloadsPrepared !== 8) {
    fail('source_runtime_queue_bridge_payload_count_mismatch')
  }
  if (bridge.counts?.productionWorkerSpecificHandlerRoutesCompleted !== 8) {
    fail('source_runtime_queue_bridge_specific_handler_count_mismatch')
  }
  if (bridge.counts?.modelRuntimeFoundationWorkerRoutesCompleted !== 2) {
    fail('source_runtime_queue_bridge_foundation_handler_count_mismatch')
  }
  if (bridge.counts?.maskCompositionWorkerRoutesCompleted !== 5) {
    fail('source_runtime_queue_bridge_mask_handler_count_mismatch')
  }
  if (bridge.counts?.enhancementWorkerRoutesCompleted !== 1) {
    fail('source_runtime_queue_bridge_enhancement_handler_count_mismatch')
  }
  if (bridge.booleans?.all8GpuModelProductionWorkerRoutesHitSpecificHandlers !== true) {
    fail('source_runtime_queue_bridge_specific_handler_boolean_not_true')
  }
  if (bridge.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail('source_runtime_queue_bridge_gpu_start_not_false')
  }

  const authorization = json('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json')
  if (authorization.decision !== 'ai_graphics_external_beta_service_role_queue_smoke_authorization_prepared_with_runtime_blocks') {
    fail('source_authorization_decision_mismatch')
  }
  if (authorization.counts?.serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence !== 21) {
    fail('source_authorization_tool_count_mismatch')
  }
  if (authorization.counts?.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools !== 8) {
    fail('source_authorization_gpu_tool_count_mismatch')
  }

  const operator = json('docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-operator-preflight.json')
  if (operator.decision !== 'ai_graphics_external_beta_route_bound_service_role_queue_smoke_operator_preflight_prepared_with_runtime_blocks') {
    fail('source_operator_preflight_decision_mismatch')
  }
  if (operator.counts?.expectedLiveQueueRowsBeforeCleanup !== 21) {
    fail('source_operator_expected_live_rows_mismatch')
  }
  if (operator.counts?.expectedPersistedRowsAfterCleanup !== 0) {
    fail('source_operator_cleanup_count_mismatch')
  }
}

function runExpectedConfirmationFailure() {
  const result = spawnSync('npm', [
    'run',
    '--silent',
    runScriptName,
    '--',
    '--execute-external-beta-gpu-model-service-role-queue-smoke',
  ], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  if (result.status === 0) fail('execute_without_confirmation_unexpectedly_succeeded')
  const text = `${result.stdout}\n${result.stderr}`
  if (!text.includes('REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE=true')) {
    fail('execute_without_confirmation_missing_expected_error')
  }
}

function runExpectedCredentialFailure() {
  const result = spawnSync('npm', [
    'run',
    '--silent',
    runScriptName,
    '--',
    '--execute-external-beta-gpu-model-service-role-queue-smoke',
    '--workspace-id',
    'workspace_external_beta_gpu_model_smoke',
    '--project-id',
    'project_external_beta_gpu_model_smoke',
    '--approved-plan-snapshot-id',
    'approved_plan_snapshot_external_beta_gpu_model_smoke',
    '--credit-reservation-id',
    'credit_reservation_external_beta_gpu_model_smoke',
    '--idempotency-prefix',
    'ai-graphics-external-beta-gpu-model-service-role-queue-smoke',
    '--source-gpu-model-worker-boundary-proof-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.json',
    '--external-agent-gpu-model-runtime-queue-service-bridge-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.json',
    '--external-beta-service-role-queue-smoke-authorization-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json',
    '--route-bound-service-role-queue-smoke-operator-preflight-packet',
    'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-operator-preflight.json',
    '--service-role-queue-smoke-readiness-ref',
    'external-beta-service-role://queue-smoke-readiness',
    '--runtime-queue-service-proof-bridge-ref',
    'external-beta-service-role://runtime-queue-service-proof-bridge',
    '--source-runtime-queue-service-proof-bridge-accepted',
  ], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE: 'true',
      REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE_ENV: 'non_production',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'mock',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
  })
  if (result.status === 0) fail('execute_without_credentials_unexpectedly_succeeded')
  const text = `${result.stdout}\n${result.stderr}`
  if (!text.includes('requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')) {
    fail('execute_without_credentials_missing_expected_error')
  }
}

function checkPackageJson() {
  const packageJson = json('package.json')
  if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
    fail('package_json_missing_run_script')
  }
  if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
    fail('package_json_missing_diagnostic_script')
  }

  const packageDiffLines = git(['diff', '--', 'package.json'])
    .split('\n')
    .filter((line) => line.startsWith('+    "ai-graphics:'))
  const allowedPackageAdditions = new Set([
    `+    "${runScriptName}": "${runScriptCommand}",`,
    `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
    '+    "ai-graphics:external-agent-gpu-model-proof-ref-route-caller": "tsx server/cli/ai-graphics-external-agent-gpu-model-proof-ref-route-caller.ts",',
    '+    "ai-graphics:external-agent-gpu-model-proof-ref-route-caller:diagnostics": "node scripts/validation/ai-graphics-external-agent-gpu-model-proof-ref-route-caller-diagnostics.mjs",',
    '+    "ai-graphics:external-agent-gpu-model-runtime-queue-service-bridge": "tsx server/cli/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge.ts",',
    '+    "ai-graphics:external-agent-gpu-model-runtime-queue-service-bridge:diagnostics": "node scripts/validation/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge-diagnostics.mjs",',
    '+    "ai-graphics:external-agent-gpu-model-controlled-worker-dispatch-proof": "tsx server/cli/ai-graphics-external-agent-gpu-model-controlled-worker-dispatch-proof.ts",',
    '+    "ai-graphics:external-agent-gpu-model-controlled-worker-dispatch-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-gpu-model-controlled-worker-dispatch-proof-diagnostics.mjs",',
    '+    "ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness": "tsx server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts",',
    '+    "ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness:diagnostics": "node scripts/validation/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness-diagnostics.mjs",',
    '+    "ai-graphics:external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke": "tsx server/cli/ai-graphics-external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.ts",',
    '+    "ai-graphics:external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke-diagnostics.mjs",',
    '+    "ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-proof.ts",',
    '+    "ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-proof-diagnostics.mjs",',
  ])
  for (const line of packageDiffLines) {
    if (!allowedPackageAdditions.has(line)) {
      fail(`unexpected_package_json_script_addition:${line}`)
    }
  }
}

function checkNoPackageLockChange() {
  const diff = git(['diff', '--', 'package-lock.json'])
  if (diff.trim()) fail('package_lock_changed')
}

function checkGeneratedArtifacts() {
  const changed = [
    ...git(['diff', '--name-only']).split('\n').filter(Boolean),
    ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
  ]
  for (const file of changed) {
    if (generatedArtifactPattern.test(file)) {
      fail(`generated_artifact_path_changed:${file}`)
    }
  }
}

function checkDocsForForbiddenClaims() {
  const files = [
    'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.json',
    'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.md',
    'docs/production-beta-readiness-scorecard.md',
  ]
  for (const file of files) {
    const text = read(file)
    for (const pattern of forbiddenDocPatterns) {
      if (pattern.test(text)) fail(`forbidden_claim:${file}:${pattern}`)
    }
  }
}

function checkRequiredSourceText() {
  const cli = read('server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke.ts')
  for (const required of [
    'createAiGraphicsToolRuntimeQueueService',
    'createSupabaseAdminClient',
    'enqueueToolRuntimeJobs',
    'claimToolRuntimeJob',
    'recordWorkerEvent',
    'recordAuditEvent',
    'cleanupSmokeRows',
    'sourceExternalAgentGpuModelRuntimeQueueServiceBridgeAccepted',
    'sourceProductionWorkerRouteableToSpecificHandler',
    'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE',
    'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE_ENV',
    'gpuRuntimeShouldStartNow: false',
    'workerDispatchPerformed: false',
    'toolExecutionPerformed: false',
  ]) {
    if (!cli.includes(required)) fail(`cli_missing_required_text:${required}`)
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_required_file:${file}`)
}

const liveReport = parseJsonOutput(runNpm(runScriptName), 'prepared_contract_stdout')
const committedReport = json('docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.json')
checkReport('live', liveReport)
checkReport('committed', committedReport)
checkSourcePackets()
runExpectedConfirmationFailure()
runExpectedCredentialFailure()
checkPackageJson()
checkNoPackageLockChange()
checkGeneratedArtifacts()
checkDocsForForbiddenClaims()
checkRequiredSourceText()

if (git(['ls-files', '.local-artifacts']).trim()) fail('local_artifacts_tracked')

if (failures.length) {
  console.error('AI graphics external beta GPU/model service-role queue smoke diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics external beta GPU/model service-role queue smoke diagnostics passed.')
console.log(JSON.stringify({
  decision,
  status,
  toolsCovered: committedReport.counts?.gpuModelToolsCovered,
  expectedLiveQueueRowsBeforeCleanup:
    committedReport.counts?.expectedLiveQueueRowsBeforeCleanup,
  expectedWorkerClaimRowsBeforeCleanup:
    committedReport.counts?.expectedWorkerClaimRowsBeforeCleanup,
  expectedPersistedRowsAfterCleanup:
    committedReport.counts?.expectedPersistedRowsAfterCleanup,
  liveServiceRoleQueueSmokeExecutedNow:
    committedReport.booleans?.liveServiceRoleQueueSmokeExecutedNow,
  gpuRuntimeShouldStartNow:
    committedReport.booleans?.gpuRuntimeShouldStartNow,
  newGpuWorkerCreated:
    committedReport.booleans?.newGpuWorkerCreated,
  agentCanExecuteGpuModelToolsNow:
    committedReport.booleans?.agentCanExecuteGpuModelToolsNow,
  packageLockUnchanged: true,
}, null, 2))
