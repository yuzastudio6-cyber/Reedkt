import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_five_with_runtime_blocks'
const blockedStatus =
  'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_blocked_pending_worker_claim_and_dispatch_smoke_proof'
const sourceDecision =
  'ai_graphics_external_agent_cpu_static_private_worker_dispatch_smoke_proof_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-tool-execution-dry-run-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof-diagnostics.mjs'
const sourceQueueProofScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
const claimAndDispatchProofScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
const queueName = 'ai_graphics_external_agent_cpu_static_private_worker_queue'

const tools = [
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

const dryRunPreparedTools = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  toolExecutionDryRunProofPreparedTools: 0,
  dryToolExecutionContractsPreparedTools: 0,
  adapterPayloadShapeValidatedTools: 0,
  privateOutputManifestContractValidatedTools: 0,
  toolResultSchemaValidatedTools: 0,
  sourceDispatchSmokeProofAcceptedTools: 5,
  sourceWorkerClaimAndDispatchSmokeProofAcceptedTools: 0,
  satoriBlockedPendingApprovedFontFixtureTools: 1,
  nonCpuStaticDeferredTools: 15,
  externalAgentCanDispatchPrivateWorkerJobNowTools: 0,
  externalAgentCanSubmitPrivateWorkerQueueNowTools: 0,
  externalAgentCanRequestPrivateWorkerHandoffNowTools: 0,
  externalAgentCanInvokeAdapterNowTools: 0,
  externalAgentExecutableNowTools: 0,
  backendQueueSubmissionApprovedNowTools: 0,
  liveQueueWriteApprovedNowTools: 0,
  workerClaimApprovedNowTools: 0,
  workerDispatchApprovedNowTools: 0,
  workerEnqueueApprovedNowTools: 0,
  toolExecutionApprovedNowTools: 0,
  publicArtifactAllowedTools: 0,
  signedUrlAllowedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
}

const trueKeys = [
  'externalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofCompleted',
  'sourceDispatchSmokeProofAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'satoriBlockedPendingApprovedFontFixture',
  'fifteenRuntimeDeferredToolsPreserved',
  'privateArtifactOnlyPolicyAccepted',
  'noAdapterInvocationByDryRun',
  'noToolExecutionByDryRun',
  'nextGateRequiresControlledPrivateToolExecutionProof',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'sourceWorkerClaimAndDispatchSmokeProofAccepted',
  'allFiveCpuStaticToolExecutionDryRunProofsPrepared',
  'allFiveDryToolExecutionContractsPrepared',
  'allFiveAdapterPayloadShapesValidated',
  'allFivePrivateOutputManifestContractsValidated',
  'allFiveToolResultSchemasValidated',
  'sourceDispatchSmokeEvidenceRefsPreserved',
  'sourceWorkerClaimAndDispatchEvidenceRefsPreserved',
  'externalAgentCanDispatchPrivateWorkerJobNow',
  'externalAgentCanSubmitPrivateWorkerQueueNow',
  'externalAgentCanRequestPrivateWorkerHandoffNow',
  'externalAgentCanInvokeAdapterNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerClaimApprovedNow',
  'workerDispatchApprovedNow',
  'workerExecutionApprovedNow',
  'workerEnqueueApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformed',
  'workerClaimPerformed',
  'workerDispatchPerformed',
  'workerEnqueuePerformed',
  'toolExecutionPerformed',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.json',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-evidence-sequence-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-diagnostics.mjs",',
])

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /externalAgentCanDispatchPrivateWorkerJobNow["`:\s=]+true/i,
  /externalAgentCanSubmitPrivateWorkerQueueNow["`:\s=]+true/i,
  /externalAgentCanRequestPrivateWorkerHandoffNow["`:\s=]+true/i,
  /externalAgentCanInvokeAdapterNow["`:\s=]+true/i,
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerClaimApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerClaimPerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(absolute(file), 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function exec(command) {
  return childProcess.execSync(command, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 60 * 1024 * 1024,
  })
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function acceptedQueueWriteSmokeResult() {
  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_passed_with_cleanup',
    status:
      'non_production_service_role_queue_write_smoke_passed_with_cleanup_no_worker_dispatch_or_tool_execution',
    queueName,
    toolsSubmitted: 5,
    toolsSubmittedIds: dryRunPreparedTools,
    queueRowsWritten: 5,
    queueRowsCleanedUp: 5,
    queueRowsPersistedAfterCleanup: 0,
    workerClaimsCreated: 0,
    workerDispatchesPerformed: 0,
    workerExecutionsPerformed: 0,
    toolExecutionsPerformed: 0,
    serviceRoleBoundaryRef:
      'private://ai-graphics/cpu-static/service-role-boundary/non-production-smoke',
    privateEvidenceRef:
      'private://ai-graphics/cpu-static/service-role-queue-write-smoke/evidence.json',
    telemetryRef:
      'private://ai-graphics/cpu-static/service-role-queue-write-smoke/telemetry.json',
    cleanupProofRef:
      'private://ai-graphics/cpu-static/service-role-queue-write-smoke/cleanup.json',
    rollbackRef:
      'private://ai-graphics/cpu-static/service-role-queue-write-smoke/rollback.md',
    sourcePreflightDecision:
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_with_runtime_blocks',
    sourcePreflightAccepted: true,
    liveServiceRoleQueueWriteSmokeExecutedNow: true,
    liveSupabaseQueueWritesNow: 5,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeShouldStartNow: false,
    externalAgentExecutableNowTools: 0,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }
}

function acceptedClaimAndDispatchSmokeResult() {
  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_passed_with_cleanup',
    status:
      'non_production_worker_claim_and_dispatch_smoke_passed_with_cleanup_no_tool_execution',
    queueName,
    toolsClaimed: 5,
    toolsClaimedIds: dryRunPreparedTools,
    queueRowsRead: 5,
    workerClaimsCreated: 5,
    workerDispatchHandoffsCreated: 5,
    workerDispatchLeasesReleased: 5,
    workerExecutionsPerformed: 0,
    toolExecutionsPerformed: 0,
    queueRowsCleanedUp: 5,
    queueRowsPersistedAfterCleanup: 0,
    serviceRoleBoundaryRef:
      'private://ai-graphics/cpu-static/service-role-boundary/non-production-claim-dispatch-smoke',
    privateEvidenceRef:
      'private://ai-graphics/cpu-static/worker-claim-dispatch-smoke/evidence.json',
    telemetryRef:
      'private://ai-graphics/cpu-static/worker-claim-dispatch-smoke/telemetry.json',
    leaseAuditRef:
      'private://ai-graphics/cpu-static/worker-claim-dispatch-smoke/lease-audit.json',
    cleanupProofRef:
      'private://ai-graphics/cpu-static/worker-claim-dispatch-smoke/cleanup.json',
    rollbackRef:
      'private://ai-graphics/cpu-static/worker-claim-dispatch-smoke/rollback.md',
    sourceQueueWriteSmokeProofDecision:
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_proof_validator_prepared_with_runtime_blocks',
    sourceQueueWriteSmokeProofAccepted: true,
    liveWorkerClaimAndDispatchSmokeExecutedNow: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeShouldStartNow: false,
    externalAgentExecutableNowTools: 0,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }
}

function runJson(scriptName, args) {
  return JSON.parse(
    childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
      cwd: root,
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 60 * 1024 * 1024,
    }),
  )
}

function buildAcceptedClaimAndDispatchProofPath() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reeditpro-ai-graphics-dry-run-'))
  const queueResultPath = path.join(tempDir, 'accepted-queue-write-smoke-result.json')
  writeJson(queueResultPath, acceptedQueueWriteSmokeResult())
  const sourceQueueProof = runJson(sourceQueueProofScriptName, [
    '--external-agent-cpu-static-service-role-queue-write-smoke-result',
    queueResultPath,
    '--print-only',
  ])
  const sourceQueueProofPath = path.join(tempDir, 'accepted-queue-write-smoke-proof.json')
  writeJson(sourceQueueProofPath, sourceQueueProof)
  const claimResultPath = path.join(tempDir, 'accepted-claim-dispatch-smoke-result.json')
  writeJson(claimResultPath, acceptedClaimAndDispatchSmokeResult())
  const claimProof = runJson(claimAndDispatchProofScriptName, [
    '--source-service-role-queue-write-smoke-proof-packet',
    sourceQueueProofPath,
    '--external-agent-cpu-static-worker-claim-and-dispatch-smoke-result',
    claimResultPath,
    '--print-only',
  ])
  const claimProofPath = path.join(tempDir, 'accepted-claim-dispatch-smoke-proof.json')
  writeJson(claimProofPath, claimProof)
  return claimProofPath
}

function checkList(label, list, expected) {
  if (!Array.isArray(list)) {
    fail(`${label}_not_array`)
    return
  }
  if (list.length !== expected.length) fail(`${label}_count_mismatch`)
  for (const value of expected) {
    if (!list.includes(value)) fail(`${label}_missing:${value}`)
  }
}

function checkCounts(label, counts) {
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts?.[key] !== value) fail(`${label}_count_mismatch:${key}:${counts?.[key]}`)
  }
}

function checkBooleans(label, booleans) {
  for (const key of trueKeys) {
    if (booleans?.[key] !== true) fail(`${label}_boolean_not_true:${key}`)
  }
  for (const key of falseKeys) {
    if (booleans?.[key] !== false) fail(`${label}_boolean_not_false:${key}`)
  }
}

function checkContract(label, toolId, contract) {
  if (!contract) {
    fail(`${label}_missing_contract:${toolId}`)
    return
  }
  const expectedPrefixes = {
    approvedPlanSnapshotRef: 'approved-plan-snapshot://',
    creditReservationRef: 'credit-reservation://',
    privateArtifactManifestRef: 'private://',
    adapterInvocationDryRunRef: 'adapter-dry-run://',
    toolInputContractRef: 'tool-input-contract://',
    expectedPrivateOutputContractRef: 'private-output-contract://',
    expectedToolResultSchemaRef: 'tool-result-schema://',
    toolSpecificQaGateRef: 'tool-qa-gate://',
  }
  for (const [key, prefix] of Object.entries(expectedPrefixes)) {
    if (!String(contract[key] ?? '').startsWith(prefix)) {
      fail(`${label}_contract_prefix_mismatch:${toolId}:${key}`)
    }
  }
  if (
    !String(contract.sourceWorkerDispatchAttemptRef ?? '').startsWith('dispatch://') &&
    !String(contract.sourceWorkerDispatchAttemptRef ?? '').startsWith(
      'worker-claim-dispatch://',
    )
  ) {
    fail(`${label}_contract_prefix_mismatch:${toolId}:sourceWorkerDispatchAttemptRef`)
  }
  if (
    !String(contract.workerDispatchSmokeEvidenceRef ?? '').startsWith('evidence://') &&
    !String(contract.workerDispatchSmokeEvidenceRef ?? '').startsWith('private://')
  ) {
    fail(`${label}_contract_prefix_mismatch:${toolId}:workerDispatchSmokeEvidenceRef`)
  }
  if (
    !String(contract.workerDispatchSmokeTelemetryRef ?? '').startsWith('telemetry://') &&
    !String(contract.workerDispatchSmokeTelemetryRef ?? '').startsWith('private://')
  ) {
    fail(`${label}_contract_prefix_mismatch:${toolId}:workerDispatchSmokeTelemetryRef`)
  }
  for (const key of [
    'queuePayloadIdempotencyKey',
    'dryDispatchIdempotencyKey',
    'dryToolExecutionIdempotencyKey',
    'workerDispatchSmokeEvidenceRef',
    'workerDispatchSmokeTelemetryRef',
    'adapterInvocationDryRunRef',
    'toolInputContractRef',
    'expectedPrivateOutputContractRef',
    'expectedToolResultSchemaRef',
    'toolSpecificQaGateRef',
  ]) {
    if (!String(contract[key] ?? '').includes(toolId)) {
      fail(`${label}_contract_missing_tool:${toolId}:${key}`)
    }
  }
  if (contract.queueName !== queueName) fail(`${label}_queue_mismatch:${toolId}`)
  if (
    contract.toolExecutionDryRunMode !==
    'dry_contract_only_no_adapter_invocation_or_tool_execution'
  ) {
    fail(`${label}_dry_run_mode_mismatch:${toolId}`)
  }
  if (contract.expectedOutputVisibility !== 'private_artifact_only') {
    fail(`${label}_visibility_mismatch:${toolId}`)
  }
}

function checkRows(label, rows, expectPrepared = false) {
  if (!Array.isArray(rows)) {
    fail(`${label}_rows_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_rows_count_mismatch:${rows.length}`)
  for (const toolId of tools) {
    const row = rows.find((entry) => entry.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_row:${toolId}`)
      continue
    }
    if (dryRunPreparedTools.includes(toolId)) {
      const expectedStatus = expectPrepared
        ? 'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked'
        : 'private_worker_tool_execution_dry_run_proof_blocked_missing_worker_claim_and_dispatch_smoke_proof'
      if (row.toolExecutionDryRunStatus !== expectedStatus) {
        fail(`${label}_dry_run_status_mismatch:${toolId}:${row.toolExecutionDryRunStatus}`)
      }
      if (row.queueName !== (expectPrepared ? queueName : null)) {
        fail(`${label}_queue_name_mismatch:${toolId}`)
      }
      if (row.sourceDispatchSmokeProofAccepted !== true) {
        fail(`${label}_source_dispatch_smoke_not_accepted:${toolId}`)
      }
      if (row.sourceDispatchSmokeEvidenceAccepted !== true) {
        fail(`${label}_source_dispatch_smoke_evidence_not_accepted:${toolId}`)
      }
      for (const field of [
        'dryToolExecutionProofPrepared',
        'dryToolExecutionContractPrepared',
        'adapterPayloadShapeValidated',
        'privateOutputManifestContractValidated',
        'toolResultSchemaValidated',
      ]) {
        if (row[field] !== expectPrepared) {
          fail(`${label}_row_field_mismatch:${toolId}:${field}:${row[field]}`)
        }
      }
      if (row.sourceWorkerClaimAndDispatchSmokeProofAccepted !== expectPrepared) {
        fail(`${label}_source_claim_dispatch_mismatch:${toolId}`)
      }
      if (row.sourceWorkerClaimAndDispatchEvidenceAccepted !== expectPrepared) {
        fail(`${label}_source_claim_dispatch_evidence_mismatch:${toolId}`)
      }
      if (expectPrepared) {
        checkContract(label, toolId, row.dryRunContract)
      } else if (row.dryRunContract !== null) {
        fail(`${label}_unexpected_contract:${toolId}`)
      }
    }
    if (toolId === 'satori') {
      if (
        row.toolExecutionDryRunStatus !==
        'private_worker_tool_execution_dry_run_proof_blocked_pending_satori_font_fixture'
      ) {
        fail(`${label}_satori_status_mismatch:${row.toolExecutionDryRunStatus}`)
      }
      if (!/font/i.test(row.blocker ?? '')) fail(`${label}_satori_blocker_missing_font`)
      if (row.dryToolExecutionProofPrepared !== false) {
        fail(`${label}_satori_unexpected_dry_run_proof`)
      }
    }
    if (!dryRunPreparedTools.includes(toolId) && toolId !== 'satori') {
      if (
        row.toolExecutionDryRunStatus !==
        'private_worker_tool_execution_dry_run_proof_deferred_non_cpu_static_runtime_boundary'
      ) {
        fail(`${label}_deferred_status_mismatch:${toolId}:${row.toolExecutionDryRunStatus}`)
      }
      if (row.dryToolExecutionProofPrepared !== false) {
        fail(`${label}_unexpected_dry_run_proof:${toolId}`)
      }
    }
    for (const field of [
      'externalAgentCanDispatchPrivateWorkerJobNow',
      'externalAgentCanSubmitPrivateWorkerQueueNow',
      'externalAgentCanRequestPrivateWorkerHandoffNow',
      'externalAgentCanInvokeAdapterNow',
      'agentCanExecuteToolsNow',
      'routeExecutionApprovedNow',
      'backendQueueSubmissionApprovedNow',
      'liveQueueWriteApprovedNow',
      'workerClaimApprovedNow',
      'workerDispatchApprovedNow',
      'workerExecutionApprovedNow',
      'workerEnqueueApprovedNow',
      'toolExecutionApprovedNow',
      'providerRuntimeApprovedNow',
      'browserWebglCanvasRuntimeApprovedNow',
      'gpuRuntimeApprovedNow',
      'gpuRuntimeShouldStartNow',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
      'publicArtifactAllowed',
      'signedUrlAllowed',
    ]) {
      if (row[field] !== false) fail(`${label}_row_runtime_gate_not_false:${toolId}:${field}`)
    }
  }
}

function checkPackageDiff(command, label) {
  const diff = exec(command)
  for (const line of diff.split('\n')) {
    if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
      continue
    }
    if (line.startsWith('+') && allowedPackageDiffLines.has(line)) continue
    if (line.startsWith('+') || line.startsWith('-')) {
      fail(`${label}_unexpected_package_diff:${line}`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.md',
)
const promptResult = read(
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof-results.md',
)
const implementationPrompt = read(
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.md',
)
const source = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.json',
)
const packageJson = json('package.json')
const moduleSource = read(
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts',
)
const cliSource = read(
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts',
)
const diagnosticSource = read(
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof-diagnostics.mjs',
)
const indexSource = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== blockedStatus) fail('docs_status_mismatch')
if (docs.sourceDispatchSmokeProofDecision !== sourceDecision) {
  fail('docs_source_decision_mismatch')
}
if (docs.queueName !== queueName) fail('docs_queue_name_mismatch')
if (source.decision !== sourceDecision) fail('source_decision_mismatch')
if (
  source.status !==
  'external_agent_cpu_static_private_worker_dispatch_smoke_proof_accepted_five_with_runtime_blocks'
) {
  fail('source_status_mismatch')
}

checkList('docs_tools', docs.tools, tools)
checkList('docs_capabilities', docs.capabilities, capabilities)
checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)
checkRows('docs', docs.rows)

if (
  docs.toolExecutionDryRunPolicy?.mode !==
  'prepare_tool_execution_dry_run_contracts_without_adapter_invocation_or_tool_execution'
) {
  fail('dry_run_policy_mode_mismatch')
}
for (const key of [
  'sourceDispatchSmokeProofRequired',
  'sourceWorkerClaimAndDispatchSmokeProofRequired',
  'validatesProvidedDispatchSmokeEvidence',
  'validatesProvidedWorkerClaimAndDispatchEvidence',
  'adapterPayloadShapeRequired',
  'privateOutputManifestContractRequired',
  'toolResultSchemaRequired',
  'noAdapterInvocationByDryRun',
  'noToolExecutionByDryRun',
  'privateArtifactOnly',
  'gpuRuntimeOnDemandOnly',
  'nextGateRequiresControlledPrivateToolExecutionProof',
]) {
  if (docs.toolExecutionDryRunPolicy?.[key] !== true) {
    fail(`dry_run_policy_boolean_missing:${key}`)
  }
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION',
  'buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof',
  'prepare_tool_execution_dry_run_contracts_without_adapter_invocation_or_tool_execution',
  'adapterPayloadShapeValidated',
  'privateOutputManifestContractValidated',
  'toolResultSchemaValidated',
  'externalAgentCanInvokeAdapterNow: false',
  'toolExecutionApprovedNow: false',
  'agentCanExecuteToolsNow: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!moduleSource.includes(required)) fail(`module_missing_required_text:${required}`)
}

for (const required of [
  'sourceDispatchSmokeProofPath',
  '--source-worker-claim-and-dispatch-smoke-proof-packet',
  'buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof',
  '--write-records',
  'expectedPreparedTools',
  'report.booleans.agentCanExecuteToolsNow === false',
  'report.booleans.externalAgentCanInvokeAdapterNow === false',
]) {
  if (!cliSource.includes(required)) fail(`cli_missing_required_text:${required}`)
}

if (!diagnosticSource.includes('forbiddenDocPatterns')) fail('diagnostic_missing_forbidden_patterns')
if (!diagnosticSource.includes('generatedArtifactPattern')) {
  fail('diagnostic_missing_generated_artifact_scan')
}
if (
  !indexSource.includes(
    "export * from './ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'",
  )
) {
  fail('index_missing_tool_execution_dry_run_proof_export')
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
} catch (error) {
  fail(`cli_report_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== blockedStatus) fail('cli_status_mismatch')
checkList('cli_tools', cliReport.tools, tools)
checkList('cli_capabilities', cliReport.capabilities, capabilities)
checkCounts('cli', cliReport.counts)
checkBooleans('cli', cliReport.booleans)
checkRows('cli', cliReport.rows)

if (JSON.stringify(docs.counts) !== JSON.stringify(cliReport.counts)) {
  fail('docs_cli_counts_mismatch')
}
if (JSON.stringify(docs.booleans) !== JSON.stringify(cliReport.booleans)) {
  fail('docs_cli_booleans_mismatch')
}

let claimAndDispatchSourceCliReport = {}
try {
  const claimProofPath = buildAcceptedClaimAndDispatchProofPath()
  claimAndDispatchSourceCliReport = runJson(runScriptName, [
    '--source-worker-claim-and-dispatch-smoke-proof-packet',
    claimProofPath,
  ])
} catch (error) {
  fail(`claim_dispatch_source_cli_report_failed:${error.message}`)
}

if (claimAndDispatchSourceCliReport.decision !== decision) {
  fail('claim_dispatch_source_cli_decision_mismatch')
}
if (claimAndDispatchSourceCliReport.status !== acceptedStatus) {
  fail('claim_dispatch_source_cli_status_mismatch')
}
if (
  claimAndDispatchSourceCliReport.counts?.sourceWorkerClaimAndDispatchSmokeProofAcceptedTools !== 5
) {
  fail('claim_dispatch_source_cli_source_tools_not_5')
}
if (claimAndDispatchSourceCliReport.counts?.toolExecutionDryRunProofPreparedTools !== 5) {
  fail('claim_dispatch_source_cli_dry_run_tools_not_5')
}
if (claimAndDispatchSourceCliReport.booleans?.sourceWorkerClaimAndDispatchSmokeProofAccepted !== true) {
  fail('claim_dispatch_source_cli_source_not_true')
}
if (claimAndDispatchSourceCliReport.booleans?.sourceWorkerClaimAndDispatchEvidenceRefsPreserved !== true) {
  fail('claim_dispatch_source_cli_refs_not_true')
}
if (claimAndDispatchSourceCliReport.booleans?.agentCanExecuteToolsNow !== false) {
  fail('claim_dispatch_source_cli_agent_execution_not_false')
}
if (claimAndDispatchSourceCliReport.booleans?.toolExecutionApprovedNow !== false) {
  fail('claim_dispatch_source_cli_tool_execution_not_false')
}
if (claimAndDispatchSourceCliReport.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('claim_dispatch_source_cli_gpu_start_not_false')
}
checkRows('claim_dispatch_source_cli', claimAndDispatchSourceCliReport.rows, true)
for (const toolId of dryRunPreparedTools) {
  const row = claimAndDispatchSourceCliReport.rows?.find((entry) => entry.toolId === toolId)
  const contract = row?.dryRunContract
  if (row?.sourceWorkerClaimAndDispatchSmokeProofAccepted !== true) {
    fail(`claim_dispatch_source_cli_source_row_not_true:${toolId}`)
  }
  if (row?.sourceWorkerClaimAndDispatchEvidenceAccepted !== true) {
    fail(`claim_dispatch_source_cli_evidence_row_not_true:${toolId}`)
  }
  if (!String(contract?.sourceWorkerDispatchAttemptRef ?? '').startsWith('worker-claim-dispatch://')) {
    fail(`claim_dispatch_source_cli_not_using_claim_dispatch_handoff:${toolId}`)
  }
  if (!String(contract?.workerDispatchSmokeEvidenceRef ?? '').startsWith('private://')) {
    fail(`claim_dispatch_source_cli_not_using_claim_dispatch_evidence:${toolId}`)
  }
  if (!String(contract?.workerDispatchSmokeTelemetryRef ?? '').startsWith('private://')) {
    fail(`claim_dispatch_source_cli_not_using_claim_dispatch_telemetry:${toolId}`)
  }
}

for (const fileText of [JSON.stringify(docs), docsMd, promptResult, implementationPrompt]) {
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(fileText)) fail(`forbidden_doc_claim:${pattern}`)
  }
}

for (const required of [
  decision,
  blockedStatus,
  queueName,
  'externalAgentCanInvokeAdapterNow=false',
  'toolExecutionApprovedNow=false',
  'agentCanExecuteToolsNow=false',
  'gpuRuntimeShouldStartNow=false',
  'Private worker dispatch smoke-proof packet',
  'Tool execution dry-run proofs prepared',
  'Source worker claim/dispatch smoke proof accepted tools',
]) {
  if (!docsMd.includes(required)) fail(`docs_md_missing:${required}`)
}

for (const required of [
  'AI Graphics External Agent CPU Static Private Worker Tool Execution Dry-Run Proof',
  decision,
  'toolExecutionDryRunProofPreparedTools=0',
  'dryToolExecutionContractsPreparedTools=0',
  'adapterPayloadShapeValidatedTools=0',
  'externalAgentCanInvokeAdapterNowTools=0',
  'toolExecutionApprovedNowTools=0',
  'gpuRuntimeShouldStartNowTools=0',
]) {
  if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
}

checkPackageDiff('git diff --unified=0 -- package.json', 'working')
checkPackageDiff('git diff --cached --unified=0 -- package.json', 'cached')

const packageLockDiff = [
  exec('git diff -- package-lock.json'),
  exec('git diff --cached -- package-lock.json'),
].join('\n').trim()
if (packageLockDiff) fail('package_lock_changed')

const changedFiles = [
  exec('git diff --name-only HEAD'),
  exec('git diff --cached --name-only'),
  exec('git ls-files --others --exclude-standard'),
].join('\n')

for (const file of changedFiles.split('\n').filter(Boolean)) {
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

const localArtifacts = [
  exec('git ls-files .local-artifacts'),
  exec('git diff --name-only HEAD -- .local-artifacts'),
  exec('git diff --cached --name-only -- .local-artifacts'),
].join('\n').trim()
if (localArtifacts) fail(`local_artifacts_changed:${localArtifacts}`)

if (failures.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        failures,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      acceptedStatus: docs.status,
      toolExecutionDryRunProofPreparedTools:
        docs.counts.toolExecutionDryRunProofPreparedTools,
      agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
      externalAgentCanInvokeAdapterNow: docs.booleans.externalAgentCanInvokeAdapterNow,
      toolExecutionApprovedNow: docs.booleans.toolExecutionApprovedNow,
      gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
      packageLockUnchanged: true,
      localArtifactsCommitted: false,
    },
    null,
    2,
  ),
)
