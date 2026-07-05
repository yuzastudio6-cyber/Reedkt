import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_five_with_runtime_blocks'
const blockedStatus =
  'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_blocked_pending_worker_claim_and_dispatch_smoke_proof'
const sourceDryRunDecision =
  'ai_graphics_external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_with_runtime_blocks'
const sourcePhase0Decision =
  'ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-diagnostics.mjs'
const sourceQueueProofScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
const claimAndDispatchProofScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
const dryRunProofScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'
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

const controlledProofTools = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  controlledToolExecutionProofAcceptedTools: 0,
  sourceToolExecutionDryRunProofPreparedTools: 0,
  sourceWorkerClaimAndDispatchSmokeProofAcceptedTools: 0,
  sourcePhase0ProofPassedTools: 5,
  exactRequestContractsAcceptedTools: 0,
  privateOutputManifestAcceptedTools: 0,
  toolResultSchemaAcceptedTools: 0,
  toolSpecificQaGateAcceptedTools: 0,
  phase0LocalArtifactEvidenceAcceptedTools: 0,
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
  'externalAgentCpuStaticPrivateWorkerControlledToolExecutionProofCompleted',
  'sourcePhase0ExecutionProofAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'satoriBlockedPendingApprovedFontFixture',
  'fifteenRuntimeDeferredToolsPreserved',
  'privateArtifactOnlyPolicyAccepted',
  'noNewToolExecutionByControlledProof',
  'noAdapterInvocationByControlledProof',
  'nextGateRequiresExactExternalAgentExecutionAdmission',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'sourceToolExecutionDryRunProofAccepted',
  'sourceWorkerClaimAndDispatchSmokeProofAccepted',
  'allFiveControlledToolExecutionProofsAccepted',
  'allFiveSourceDryRunContractsAccepted',
  'allFivePhase0ExecutionEvidenceAccepted',
  'allFivePrivateOutputManifestsAccepted',
  'allFiveToolResultSchemasAccepted',
  'allFiveToolSpecificQaGatesAccepted',
  'sourceDryRunContractRefsPreserved',
  'sourceWorkerClaimAndDispatchEvidenceRefsPreserved',
  'phase0LocalArtifactPolicyAccepted',
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
  'adapterInvocationPerformed',
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
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
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
  /adapterInvocationPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /mediaProcessingPerformed["`:\s=]+true/i,
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
    maxBuffer: 80 * 1024 * 1024,
  })
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
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
      maxBuffer: 80 * 1024 * 1024,
    }),
  )
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
    toolsSubmittedIds: controlledProofTools,
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
    toolsClaimedIds: controlledProofTools,
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

function checkList(label, list, expected) {
  if (!Array.isArray(list)) {
    fail(`${label}_not_array`)
    return
  }
  if (list.length !== expected.length) fail(`${label}_count_mismatch:${list.length}`)
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

function checkEvidence(label, toolId, evidence) {
  if (!evidence) {
    fail(`${label}_missing_controlled_evidence:${toolId}`)
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
    controlledToolExecutionEvidenceRef: 'controlled-tool-execution-proof://',
    phase0LocalArtifactEvidenceRef: 'phase0-local-artifact-evidence://',
  }
  for (const [key, prefix] of Object.entries(expectedPrefixes)) {
    if (!String(evidence[key] ?? '').startsWith(prefix)) {
      fail(`${label}_evidence_prefix_mismatch:${toolId}:${key}`)
    }
  }
  if (
    !String(evidence.sourceWorkerDispatchAttemptRef ?? '').startsWith('dispatch://') &&
    !String(evidence.sourceWorkerDispatchAttemptRef ?? '').startsWith(
      'worker-claim-dispatch://',
    )
  ) {
    fail(`${label}_evidence_prefix_mismatch:${toolId}:sourceWorkerDispatchAttemptRef`)
  }
  if (
    !String(evidence.workerDispatchSmokeEvidenceRef ?? '').startsWith('evidence://') &&
    !String(evidence.workerDispatchSmokeEvidenceRef ?? '').startsWith('private://')
  ) {
    fail(`${label}_evidence_prefix_mismatch:${toolId}:workerDispatchSmokeEvidenceRef`)
  }
  if (
    !String(evidence.workerDispatchSmokeTelemetryRef ?? '').startsWith('telemetry://') &&
    !String(evidence.workerDispatchSmokeTelemetryRef ?? '').startsWith('private://')
  ) {
    fail(`${label}_evidence_prefix_mismatch:${toolId}:workerDispatchSmokeTelemetryRef`)
  }
  for (const key of [
    'queuePayloadIdempotencyKey',
    'dryDispatchIdempotencyKey',
    'dryToolExecutionIdempotencyKey',
    'controlledToolExecutionIdempotencyKey',
    'sourceWorkerDispatchAttemptRef',
    'workerDispatchSmokeEvidenceRef',
    'workerDispatchSmokeTelemetryRef',
    'adapterInvocationDryRunRef',
    'toolInputContractRef',
    'expectedPrivateOutputContractRef',
    'expectedToolResultSchemaRef',
    'toolSpecificQaGateRef',
    'controlledToolExecutionEvidenceRef',
    'phase0LocalArtifactEvidenceRef',
  ]) {
    if (!String(evidence[key] ?? '').includes(toolId)) {
      fail(`${label}_evidence_missing_tool:${toolId}:${key}`)
    }
  }
  if (evidence.queueName !== queueName) fail(`${label}_queue_mismatch:${toolId}`)
  if (
    evidence.controlledProofMode !==
    'accept_phase0_local_execution_evidence_without_new_tool_execution'
  ) {
    fail(`${label}_controlled_mode_mismatch:${toolId}`)
  }
  if (evidence.expectedOutputVisibility !== 'private_artifact_only') {
    fail(`${label}_visibility_mismatch:${toolId}`)
  }
  if (!Array.isArray(evidence.phase0LocalArtifactPaths) || evidence.phase0LocalArtifactPaths.length === 0) {
    fail(`${label}_missing_phase0_local_artifacts:${toolId}`)
  }
  for (const artifactPath of evidence.phase0LocalArtifactPaths ?? []) {
    if (!artifactPath.startsWith('.local-artifacts/ai-graphics/cpu-static-proof/')) {
      fail(`${label}_phase0_artifact_policy_mismatch:${toolId}:${artifactPath}`)
    }
  }
}

function checkRows(label, rows, expectAccepted = false) {
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
    if (controlledProofTools.includes(toolId)) {
      const expectedStatus = expectAccepted
        ? 'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked'
        : 'controlled_private_tool_execution_proof_blocked_missing_tool_execution_dry_run_proof'
      if (row.controlledToolExecutionProofStatus !== expectedStatus) {
        fail(`${label}_controlled_status_mismatch:${toolId}:${row.controlledToolExecutionProofStatus}`)
      }
      for (const field of [
        'sourceToolExecutionDryRunProofPrepared',
        'sourceDryRunContractAccepted',
        'controlledToolExecutionProofAccepted',
        'phase0ExecutionEvidenceAccepted',
        'exactRequestContractAccepted',
        'privateOutputManifestAccepted',
        'toolResultSchemaAccepted',
        'toolSpecificQaGateAccepted',
      ]) {
        if (row[field] !== expectAccepted) {
          fail(`${label}_row_field_mismatch:${toolId}:${field}:${row[field]}`)
        }
      }
      for (const field of [
        'sourceWorkerClaimAndDispatchSmokeProofAccepted',
        'sourceWorkerClaimAndDispatchEvidenceAccepted',
      ]) {
        if (row[field] !== expectAccepted) {
          fail(`${label}_row_field_mismatch:${toolId}:${field}:${row[field]}`)
        }
      }
      if (row.phase0Status !== 'proof_passed') fail(`${label}_phase0_status_mismatch:${toolId}`)
      if (row.phase0ImportStatus !== 'passed') fail(`${label}_phase0_import_mismatch:${toolId}`)
      if (row.phase0FixtureStatus !== 'executed') fail(`${label}_phase0_fixture_mismatch:${toolId}`)
      if (row.phase0OutputContractStatus !== 'checked') {
        fail(`${label}_phase0_output_contract_mismatch:${toolId}`)
      }
      if (row.queueName !== (expectAccepted ? queueName : null)) {
        fail(`${label}_queue_name_mismatch:${toolId}`)
      }
      if (expectAccepted) {
        checkEvidence(label, toolId, row.controlledToolExecutionEvidence)
      } else if (row.controlledToolExecutionEvidence !== null) {
        fail(`${label}_unexpected_controlled_evidence:${toolId}`)
      }
    }
    if (toolId === 'satori') {
      if (
        row.controlledToolExecutionProofStatus !==
        'controlled_private_tool_execution_proof_blocked_pending_satori_font_fixture'
      ) {
        fail(`${label}_satori_status_mismatch:${row.controlledToolExecutionProofStatus}`)
      }
      if (!/font/i.test(row.blocker ?? '')) fail(`${label}_satori_blocker_missing_font`)
      if (row.controlledToolExecutionProofAccepted !== false) {
        fail(`${label}_satori_unexpected_controlled_proof`)
      }
    }
    if (!controlledProofTools.includes(toolId) && toolId !== 'satori') {
      if (
        row.controlledToolExecutionProofStatus !==
        'controlled_private_tool_execution_proof_deferred_non_cpu_static_runtime_boundary'
      ) {
        fail(`${label}_deferred_status_mismatch:${toolId}:${row.controlledToolExecutionProofStatus}`)
      }
      if (row.controlledToolExecutionProofAccepted !== false) {
        fail(`${label}_unexpected_controlled_proof:${toolId}`)
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
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.md',
)
const promptResult = read(
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-results.md',
)
const implementationPrompt = read(
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.md',
)
const sourceDryRun = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.json',
)
const sourcePhase0 = json(
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json',
)
const packageJson = json('package.json')
const moduleSource = read(
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts',
)
const cliSource = read(
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts',
)
const diagnosticSource = read(
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-diagnostics.mjs',
)
const indexSource = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== blockedStatus) fail('docs_status_mismatch')
if (docs.sourceToolExecutionDryRunProofDecision !== sourceDryRunDecision) {
  fail('docs_source_dry_run_decision_mismatch')
}
if (docs.sourcePhase0Decision !== sourcePhase0Decision) {
  fail('docs_source_phase0_decision_mismatch')
}
if (docs.queueName !== queueName) fail('docs_queue_name_mismatch')
if (sourceDryRun.decision !== sourceDryRunDecision) fail('source_dry_run_decision_mismatch')
if (
  sourceDryRun.status !==
  'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_blocked_pending_worker_claim_and_dispatch_smoke_proof'
) {
  fail('source_dry_run_status_mismatch')
}
if (sourcePhase0.decision !== sourcePhase0Decision) fail('source_phase0_decision_mismatch')
if (sourcePhase0.status !== 'completed_with_warnings') fail('source_phase0_status_mismatch')
if (sourcePhase0.packageLockStatus !== 'unchanged') fail('source_phase0_package_lock_mismatch')

checkList('docs_tools', docs.tools, tools)
checkList('docs_capabilities', docs.capabilities, capabilities)
checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)
checkRows('docs', docs.rows)

if (
  docs.controlledToolExecutionPolicy?.mode !==
  'accept_phase0_local_execution_evidence_and_bind_to_private_worker_contracts_without_new_tool_execution'
) {
  fail('controlled_policy_mode_mismatch')
}
for (const key of [
  'sourceToolExecutionDryRunProofRequired',
  'sourcePhase0ExecutionEvidenceRequired',
  'exactRequestContractRequired',
  'privateArtifactManifestRequired',
  'toolResultSchemaRequired',
  'toolSpecificQaGateRequired',
  'noNewToolExecutionByControlledProof',
  'noAdapterInvocationByControlledProof',
  'privateArtifactOnly',
  'gpuRuntimeOnDemandOnly',
  'nextGateRequiresExactExternalAgentExecutionAdmission',
]) {
  if (docs.controlledToolExecutionPolicy?.[key] !== true) {
    fail(`controlled_policy_boolean_missing:${key}`)
  }
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}
if (!moduleSource.includes(decision)) fail('module_missing_decision')
if (!cliSource.includes('--write-records')) fail('cli_missing_write_records')
if (!diagnosticSource.includes('allowedPackageDiffLines')) fail('diagnostic_missing_package_diff_guard')
if (!cliSource.includes('--source-tool-execution-dry-run-proof-packet')) {
  fail('cli_missing_source_dry_run_packet_flag')
}
if (!cliSource.includes('--source-phase0-packet')) {
  fail('cli_missing_source_phase0_packet_flag')
}
if (
  !indexSource.includes(
    "export * from './ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof'",
  )
) {
  fail('index_missing_export')
}
if (!scorecard.includes('AI Graphics External Agent CPU Static Private Worker Controlled Tool Execution Proof')) {
  fail('scorecard_missing_section')
}

const satoriPhase0 = sourcePhase0.tools?.find((tool) => tool.toolId === 'satori')
if (satoriPhase0?.status !== 'proof_blocked_missing_runtime') fail('phase0_satori_status_mismatch')
if (!/font/i.test(satoriPhase0?.blockedReason ?? '')) fail('phase0_satori_missing_font_reason')
for (const toolId of controlledProofTools) {
  const phase0Tool = sourcePhase0.tools?.find((tool) => tool.toolId === toolId)
  if (phase0Tool?.status !== 'proof_passed') fail(`phase0_tool_not_passed:${toolId}`)
  if (!Array.isArray(phase0Tool?.localArtifactPaths) || phase0Tool.localArtifactPaths.length === 0) {
    fail(`phase0_tool_missing_local_artifacts:${toolId}`)
  }
}

for (const text of [docsMd, promptResult, implementationPrompt, scorecard]) {
  if (!text.includes(decision)) fail('text_missing_decision')
  if (!text.includes('agentCanExecuteToolsNow=false')) fail('text_missing_agent_execution_false')
  if (!text.includes('gpuRuntimeShouldStartNow=false')) fail('text_missing_gpu_runtime_false')
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(text)) fail(`forbidden_claim:${pattern}`)
  }
}

function makeClaimDispatchSourcedDryRunPacket() {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'reeditpro-controlled-tool-exec-claim-dispatch-'),
  )
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
  const dryRunProof = runJson(dryRunProofScriptName, [
    '--source-worker-claim-and-dispatch-smoke-proof-packet',
    claimProofPath,
  ])
  const packetPath = path.join(tempDir, 'claim-dispatch-sourced-dry-run.json')
  writeJson(packetPath, dryRunProof)
  return packetPath
}

checkPackageDiff('git diff -- package.json', 'worktree_package_json')
checkPackageDiff('git diff --cached -- package.json', 'cached_package_json')

for (const command of [
  'git diff -- package-lock.json',
  'git diff --cached -- package-lock.json',
]) {
  if (exec(command).trim().length > 0) fail(`package_lock_changed:${command}`)
}

for (const command of [
  'git diff --name-only HEAD',
  'git diff --cached --name-only',
  'git ls-files --others --exclude-standard',
]) {
  for (const changedPath of exec(command).split('\n').filter(Boolean)) {
    if (generatedArtifactPattern.test(changedPath)) fail(`generated_artifact_path:${changedPath}`)
  }
}

if (exec('git ls-files .local-artifacts').trim()) fail('local_artifacts_tracked')
if (exec('git diff --cached --name-only -- .local-artifacts').trim()) fail('local_artifacts_staged')

const cliOutput = JSON.parse(exec(`npm run --silent ${runScriptName}`))
if (cliOutput.decision !== decision) fail('cli_decision_mismatch')
if (cliOutput.acceptedStatus !== blockedStatus) fail('cli_status_mismatch')
if (cliOutput.controlledToolExecutionProofAcceptedTools !== 0) fail('cli_count_mismatch')
if (cliOutput.sourceWorkerClaimAndDispatchSmokeProofAcceptedTools !== 0) {
  fail('cli_default_claim_dispatch_source_count_not_0')
}
if (cliOutput.sourceWorkerClaimAndDispatchEvidenceRefsPreserved !== false) {
  fail('cli_default_claim_dispatch_refs_not_false')
}
if (cliOutput.agentCanExecuteToolsNow !== false) fail('cli_agent_execution_not_false')
if (cliOutput.externalAgentCanInvokeAdapterNow !== false) fail('cli_adapter_not_false')
if (cliOutput.toolExecutionApprovedNow !== false) fail('cli_tool_execution_not_false')
if (cliOutput.gpuRuntimeShouldStartNow !== false) fail('cli_gpu_runtime_not_false')

const claimDispatchSourcedDryRunPacket = makeClaimDispatchSourcedDryRunPacket()
const claimDispatchSourceCliOutput = JSON.parse(exec([
  `npm run --silent ${runScriptName} --`,
  `--source-tool-execution-dry-run-proof-packet ${JSON.stringify(claimDispatchSourcedDryRunPacket)}`,
  '--source-phase0-packet docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json',
].join(' ')))
if (claimDispatchSourceCliOutput.decision !== decision) {
  fail('claim_dispatch_source_cli_decision_mismatch')
}
if (claimDispatchSourceCliOutput.acceptedStatus !== acceptedStatus) {
  fail('claim_dispatch_source_cli_status_mismatch')
}
if (claimDispatchSourceCliOutput.controlledToolExecutionProofAcceptedTools !== 5) {
  fail('claim_dispatch_source_cli_count_mismatch')
}
if (claimDispatchSourceCliOutput.sourceWorkerClaimAndDispatchSmokeProofAcceptedTools !== 5) {
  fail('claim_dispatch_source_cli_claim_dispatch_source_count_not_5')
}
if (claimDispatchSourceCliOutput.sourceWorkerClaimAndDispatchEvidenceRefsPreserved !== true) {
  fail('claim_dispatch_source_cli_claim_dispatch_refs_not_true')
}
if (claimDispatchSourceCliOutput.agentCanExecuteToolsNow !== false) {
  fail('claim_dispatch_source_cli_agent_execution_not_false')
}
if (claimDispatchSourceCliOutput.externalAgentCanInvokeAdapterNow !== false) {
  fail('claim_dispatch_source_cli_adapter_not_false')
}
if (claimDispatchSourceCliOutput.toolExecutionApprovedNow !== false) {
  fail('claim_dispatch_source_cli_tool_execution_not_false')
}
if (claimDispatchSourceCliOutput.gpuRuntimeShouldStartNow !== false) {
  fail('claim_dispatch_source_cli_gpu_runtime_not_false')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      acceptedStatus: docs.status,
      controlledToolExecutionProofAcceptedTools:
        docs.counts.controlledToolExecutionProofAcceptedTools,
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
