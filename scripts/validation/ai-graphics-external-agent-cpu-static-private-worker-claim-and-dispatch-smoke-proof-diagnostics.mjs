import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_proof_validator_prepared_with_runtime_blocks'
const blockedStatus = 'blocked_pending_source_non_production_service_role_queue_write_smoke_proof'
const acceptedStatus = 'accepted_saved_worker_claim_and_dispatch_smoke_result_execution_blocked'
const rejectedStatus = 'rejected_saved_worker_claim_and_dispatch_smoke_result'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof-diagnostics.mjs'
const sourceQueueProofScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
const queueName = 'ai_graphics_external_agent_cpu_static_private_worker_queue'

const proofTools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js']
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
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
  'server/tool-registry/index.ts',
  'package.json',
]

const falseKeys = [
  'externalAgentCanInvokeAdapterNow',
  'externalAgentCanSubmitPrivateWorkerQueueNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerEnqueueApprovedNow',
  'workerClaimApprovedNow',
  'workerDispatchApprovedNow',
  'workerExecutionApprovedNow',
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
  'workerClaimAndDispatchSmokePerformedByValidator',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformedByValidator',
  'workerEnqueuePerformed',
  'workerClaimPerformedByValidator',
  'workerDispatchPerformedByValidator',
  'workerExecutionPerformed',
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

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function runNpm(scriptName, args = []) {
  const output = execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return JSON.parse(output)
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
    toolsSubmittedIds: proofTools,
    jobBatchId: 'job-batch-ai-graphics-cpu-static-queue-smoke-0001',
    jobIds: [
      'job-ai-graphics-cpu-static-queue-smoke-d3',
      'job-ai-graphics-cpu-static-queue-smoke-vega-lite',
      'job-ai-graphics-cpu-static-queue-smoke-vega',
      'job-ai-graphics-cpu-static-queue-smoke-svgdotjs',
      'job-ai-graphics-cpu-static-queue-smoke-viz-js',
    ],
    jobIdByToolId: {
      d3: 'job-ai-graphics-cpu-static-queue-smoke-d3',
      vega_lite: 'job-ai-graphics-cpu-static-queue-smoke-vega-lite',
      vega: 'job-ai-graphics-cpu-static-queue-smoke-vega',
      svgdotjs_svg_js: 'job-ai-graphics-cpu-static-queue-smoke-svgdotjs',
      viz_js: 'job-ai-graphics-cpu-static-queue-smoke-viz-js',
    },
    idempotencyPrefix: 'ai_graphics_cpu_static_queue_write_smoke_0001',
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

function acceptedClaimAndDispatchSmokeResult(overrides = {}) {
  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_passed_with_cleanup',
    status:
      'non_production_worker_claim_and_dispatch_smoke_passed_with_cleanup_no_tool_execution',
    queueName,
    toolsClaimed: 5,
    toolsClaimedIds: proofTools,
    jobBatchId: 'job-batch-ai-graphics-cpu-static-claim-dispatch-smoke-0001',
    jobIds: [
      'job-ai-graphics-cpu-static-claim-dispatch-d3',
      'job-ai-graphics-cpu-static-claim-dispatch-vega-lite',
      'job-ai-graphics-cpu-static-claim-dispatch-vega',
      'job-ai-graphics-cpu-static-claim-dispatch-svgdotjs',
      'job-ai-graphics-cpu-static-claim-dispatch-viz-js',
    ],
    jobIdByToolId: {
      d3: 'job-ai-graphics-cpu-static-claim-dispatch-d3',
      vega_lite: 'job-ai-graphics-cpu-static-claim-dispatch-vega-lite',
      vega: 'job-ai-graphics-cpu-static-claim-dispatch-vega',
      svgdotjs_svg_js: 'job-ai-graphics-cpu-static-claim-dispatch-svgdotjs',
      viz_js: 'job-ai-graphics-cpu-static-claim-dispatch-viz-js',
    },
    idempotencyPrefix: 'ai_graphics_cpu_static_claim_dispatch_smoke_0001',
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
    sourceQueueWriteSmokeJobBatchId: 'job-batch-ai-graphics-cpu-static-queue-smoke-0001',
    sourceQueueWriteSmokeJobIds: [
      'job-ai-graphics-cpu-static-queue-smoke-d3',
      'job-ai-graphics-cpu-static-queue-smoke-vega-lite',
      'job-ai-graphics-cpu-static-queue-smoke-vega',
      'job-ai-graphics-cpu-static-queue-smoke-svgdotjs',
      'job-ai-graphics-cpu-static-queue-smoke-viz-js',
    ],
    sourceQueueWriteSmokeIdempotencyPrefix: 'ai_graphics_cpu_static_queue_write_smoke_0001',
    liveWorkerClaimAndDispatchSmokeExecutedNow: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeShouldStartNow: false,
    externalAgentExecutableNowTools: 0,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    ...overrides,
  }
}

function buildAcceptedSourceQueueProof(tempDir) {
  const queueResultPath = path.join(tempDir, 'accepted-queue-write-smoke-result.json')
  writeJson(queueResultPath, acceptedQueueWriteSmokeResult())
  const output = execFileSync(
    'npm',
    [
      'run',
      '--silent',
      sourceQueueProofScriptName,
      '--',
      '--external-agent-cpu-static-service-role-queue-write-smoke-result',
      queueResultPath,
      '--print-only',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    },
  )
  const sourceProofPath = path.join(tempDir, 'accepted-queue-write-smoke-proof.json')
  fs.writeFileSync(sourceProofPath, output)
  return sourceProofPath
}

function assertFalseBooleans(label, booleans) {
  for (const key of falseKeys) {
    if (booleans?.[key] !== false) {
      fail(`${label}_${key}_not_false`)
    }
  }
}

function assertToolCoverage(label, rows) {
  if (!Array.isArray(rows)) {
    fail(`${label}_rows_not_array`)
    return
  }
  if (rows.length !== 21) fail(`${label}_row_count_not_21`)
  for (const toolId of allTools) {
    if (!rows.some((row) => row.toolId === toolId)) {
      fail(`${label}_missing_tool:${toolId}`)
    }
  }
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const indexSource = read('server/tool-registry/index.ts')
if (!indexSource.includes("export * from './ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'")) {
  fail('registry_export_missing')
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== blockedStatus) fail('docs_status_mismatch')
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.sourceQueueWriteSmokeProofAcceptedTools !== 0) {
  fail('docs_source_queue_proof_tools_not_0')
}
if (docs.counts?.sourceQueueWriteSmokeTraceAcceptedWithProvidedEvidenceTools !== 0) {
  fail('docs_source_queue_trace_tools_not_0')
}
if (docs.counts?.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence !== 0) {
  fail('docs_saved_claim_dispatch_tools_not_0')
}
if (docs.counts?.exactRequestLineagePreservedWithProvidedEvidenceTools !== 0) {
  fail('docs_exact_request_lineage_not_0')
}
if (docs.counts?.workerClaimAndDispatchTraceAcceptedWithProvidedEvidenceTools !== 0) {
  fail('docs_worker_claim_dispatch_trace_not_0')
}
if (docs.counts?.workerClaimsAcceptedWithProvidedEvidence !== 0) {
  fail('docs_worker_claims_not_0')
}
if (docs.counts?.workerDispatchHandoffsAcceptedWithProvidedEvidence !== 0) {
  fail('docs_dispatch_handoffs_not_0')
}
if (docs.counts?.workerExecutionsPerformedNow !== 0) {
  fail('docs_worker_executions_not_0')
}
if (docs.counts?.toolExecutionsPerformedNow !== 0) {
  fail('docs_tool_executions_not_0')
}
if (docs.counts?.externalAgentExecutableNowTools !== 0) {
  fail('docs_executable_not_0')
}
if (docs.counts?.gpuRuntimeShouldStartNowTools !== 0) {
  fail('docs_gpu_start_not_0')
}
assertToolCoverage('docs', docs.rows)
assertFalseBooleans('docs', docs.booleans)
if (docs.booleans?.externalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofValidatorPrepared !== true) {
  fail('docs_validator_prepared_not_true')
}
if (docs.booleans?.sourceNonProductionServiceRoleQueueWriteSmokeProofAccepted !== false) {
  fail('docs_source_queue_write_proof_not_false')
}
if (docs.booleans?.sourceExactExecutionAdmissionAccepted !== true) {
  fail('docs_source_exact_execution_admission_not_true')
}
if (docs.booleans?.agentCanSelectForPlanning !== true) {
  fail('docs_agent_planning_not_true')
}
for (const field of [
  'jobBatchId',
  'jobIds',
  'jobIdByToolId',
  'idempotencyPrefix',
  'sourceQueueWriteSmokeJobBatchId',
  'sourceQueueWriteSmokeJobIds',
  'sourceQueueWriteSmokeIdempotencyPrefix',
]) {
  if (!docs.operatorResultTemplate?.requiredResultFields?.includes(field)) {
    fail(`docs_operator_template_missing_trace_result_field:${field}`)
  }
}

for (const phrase of [
  'validates a saved non-production worker claim and dispatch handoff smoke result',
  'Source queue-write smoke proof accepted tools: `0`',
  'Saved worker claim and dispatch smoke accepted tools with provided evidence: `0`',
  'Exact request lineages preserved with provided evidence: `0`',
  'Worker executions performed now: `0`',
  'Tool executions performed now: `0`',
  'External-agent executable now tools: `0`',
  'GPU runtime starts now: `0`',
  'agentCanExecuteToolsNow=false',
  'gpuRuntimeShouldStartNow=false',
]) {
  if (!docsMd.includes(phrase)) fail(`docs_md_missing:${phrase}`)
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reeditpro-ai-graphics-claim-dispatch-'))
const acceptedSourceProofPath = buildAcceptedSourceQueueProof(tempDir)
const acceptedResultPath = path.join(tempDir, 'accepted-claim-dispatch-smoke-result.json')
writeJson(acceptedResultPath, acceptedClaimAndDispatchSmokeResult())
const acceptedReport = runNpm(runScriptName, [
  '--source-service-role-queue-write-smoke-proof-packet',
  acceptedSourceProofPath,
  '--external-agent-cpu-static-worker-claim-and-dispatch-smoke-result',
  acceptedResultPath,
  '--print-only',
])
if (acceptedReport.status !== acceptedStatus) fail('accepted_fixture_status_mismatch')
if (acceptedReport.counts?.sourceQueueWriteSmokeProofAcceptedTools !== 5) {
  fail('accepted_fixture_source_queue_proof_tools_not_5')
}
if (acceptedReport.counts?.sourceQueueWriteSmokeTraceAcceptedWithProvidedEvidenceTools !== 5) {
  fail('accepted_fixture_source_queue_trace_tools_not_5')
}
if (acceptedReport.counts?.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence !== 5) {
  fail('accepted_fixture_claim_dispatch_tools_not_5')
}
if (acceptedReport.counts?.exactRequestLineagePreservedWithProvidedEvidenceTools !== 5) {
  fail('accepted_fixture_exact_request_lineage_tools_not_5')
}
if (acceptedReport.counts?.workerClaimAndDispatchTraceAcceptedWithProvidedEvidenceTools !== 5) {
  fail('accepted_fixture_worker_claim_dispatch_trace_tools_not_5')
}
if (acceptedReport.counts?.queueRowsReadAcceptedWithProvidedEvidence !== 5) {
  fail('accepted_fixture_queue_rows_read_not_5')
}
if (acceptedReport.counts?.workerClaimsAcceptedWithProvidedEvidence !== 5) {
  fail('accepted_fixture_worker_claims_not_5')
}
if (acceptedReport.counts?.workerDispatchHandoffsAcceptedWithProvidedEvidence !== 5) {
  fail('accepted_fixture_dispatch_handoffs_not_5')
}
if (acceptedReport.counts?.workerDispatchLeasesReleasedWithProvidedEvidence !== 5) {
  fail('accepted_fixture_leases_released_not_5')
}
if (acceptedReport.counts?.toolExecutionsPerformedNow !== 0) {
  fail('accepted_fixture_tool_execution_not_0')
}
if (acceptedReport.counts?.externalAgentExecutableNowTools !== 0) {
  fail('accepted_fixture_executable_not_0')
}
if (acceptedReport.booleans?.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence !== true) {
  fail('accepted_fixture_claim_dispatch_proof_not_true')
}
if (acceptedReport.booleans?.allFiveCpuStaticWorkerClaimAndDispatchSmokeResultsAcceptedWithProvidedEvidence !== true) {
  fail('accepted_fixture_all_five_not_true')
}
if (acceptedReport.booleans?.sourceExactExecutionAdmissionAccepted !== true) {
  fail('accepted_fixture_source_exact_admission_not_true')
}
if (acceptedReport.booleans?.allFiveCpuStaticExactRequestLineagesPreservedWithProvidedEvidence !== true) {
  fail('accepted_fixture_exact_request_lineage_not_true')
}
if (acceptedReport.booleans?.sourceQueueWriteSmokeTracePreservedWithProvidedEvidence !== true) {
  fail('accepted_fixture_source_queue_trace_not_true')
}
if (acceptedReport.booleans?.workerClaimAndDispatchTracePreservedWithProvidedEvidence !== true) {
  fail('accepted_fixture_worker_claim_dispatch_trace_not_true')
}
if (acceptedReport.booleans?.cleanupVerifiedWithProvidedEvidence !== true) {
  fail('accepted_fixture_cleanup_not_true')
}
if (acceptedReport.booleans?.workerDispatchLeasesReleasedWithProvidedEvidence !== true) {
  fail('accepted_fixture_leases_not_true')
}
assertToolCoverage('accepted_fixture', acceptedReport.rows)
assertFalseBooleans('accepted_fixture', acceptedReport.booleans)
for (const toolId of proofTools) {
  const row = acceptedReport.rows.find((candidate) => candidate.toolId === toolId)
  const lineage = row?.exactRequestLineage
  if (!row?.exactRequestLineagePreserved || !lineage) {
    fail(`accepted_fixture_missing_exact_lineage:${toolId}`)
    continue
  }
  const lineageChecks = [
    lineage.approvedPlanSnapshotRef?.startsWith('approved-plan-snapshot://'),
    lineage.creditReservationRef?.startsWith('credit-reservation://'),
    lineage.privateArtifactManifestRef?.startsWith('private://'),
    lineage.queuePayloadIdempotencyKey?.includes(toolId),
    lineage.externalAgentExactRequestEnvelopeRef?.includes(toolId),
    lineage.workerAcceptedRequestSchemaRef?.includes(toolId),
    lineage.toolResultSchemaRef?.includes(toolId),
    lineage.toolSpecificQaGateRef?.includes(toolId),
    lineage.workerClaimAndDispatchEvidenceRef?.startsWith('private://'),
    lineage.workerClaimAndDispatchTelemetryRef?.startsWith('private://'),
    lineage.workerClaimAndDispatchLeaseAuditRef?.startsWith('private://'),
    lineage.workerClaimAndDispatchHandoffRef?.includes(toolId),
    lineage.expectedOutputVisibility === 'private_artifact_only',
  ]
  if (!lineageChecks.every(Boolean)) {
    fail(`accepted_fixture_invalid_exact_lineage:${toolId}`)
  }
  if (!String(row.sourceQueueWriteSmokeJobBatchId ?? '').startsWith('job-batch-')) {
    fail(`accepted_fixture_missing_source_queue_job_batch_trace:${toolId}`)
  }
  if (!String(row.sourceQueueWriteSmokeJobId ?? '').startsWith('job-')) {
    fail(`accepted_fixture_missing_source_queue_job_id_trace:${toolId}`)
  }
  if (!String(row.sourceQueueWriteSmokeIdempotencyPrefix ?? '').includes('smoke')) {
    fail(`accepted_fixture_missing_source_queue_idempotency_trace:${toolId}`)
  }
  if (!String(row.workerClaimAndDispatchJobBatchId ?? '').startsWith('job-batch-')) {
    fail(`accepted_fixture_missing_worker_claim_dispatch_job_batch_trace:${toolId}`)
  }
  if (!String(row.workerClaimAndDispatchJobId ?? '').startsWith('job-')) {
    fail(`accepted_fixture_missing_worker_claim_dispatch_job_id_trace:${toolId}`)
  }
  if (!String(row.workerClaimAndDispatchIdempotencyPrefix ?? '').includes('smoke')) {
    fail(`accepted_fixture_missing_worker_claim_dispatch_idempotency_trace:${toolId}`)
  }
}

const unsafeResultPath = path.join(tempDir, 'unsafe-claim-dispatch-smoke-result.json')
writeJson(unsafeResultPath, acceptedClaimAndDispatchSmokeResult({
  toolExecutionsPerformed: 1,
}))
const unsafeReport = runNpm(runScriptName, [
  '--source-service-role-queue-write-smoke-proof-packet',
  acceptedSourceProofPath,
  '--external-agent-cpu-static-worker-claim-and-dispatch-smoke-result',
  unsafeResultPath,
  '--print-only',
])
if (unsafeReport.status !== rejectedStatus) fail('unsafe_fixture_status_mismatch')
if (unsafeReport.counts?.savedWorkerClaimAndDispatchSmokeRejectedTools !== 5) {
  fail('unsafe_fixture_rejected_tools_not_5')
}
if (!unsafeReport.rejectionReasons?.some((reason) => reason.includes('must not execute tools'))) {
  fail('unsafe_fixture_missing_tool_execution_rejection')
}
assertFalseBooleans('unsafe_fixture', unsafeReport.booleans)

for (const forbidden of [
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"workerDispatchApprovedNow"\s*:\s*true/i,
  /"toolExecutionApprovedNow"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  for (const file of [
    'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
    'server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts',
    'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.json',
    'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.md',
  ]) {
    if (forbidden.test(read(file))) {
      fail(`forbidden_claim:${file}:${forbidden}`)
    }
  }
}

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package_lock_changed')
}
const stagedFiles = git(['diff', '--cached', '--name-only'])
if (stagedFiles.split('\n').filter(Boolean).some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_staged')
}
const generatedPathPattern =
  /(^|\/)(generated|renders?|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i
if (stagedFiles.split('\n').filter(Boolean).some((file) => generatedPathPattern.test(file))) {
  fail('generated_output_staged')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: docs.status,
  sourceQueueWriteSmokeProofAcceptedTools:
    docs.counts.sourceQueueWriteSmokeProofAcceptedTools,
  savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence:
    docs.counts.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence,
  acceptedFixtureStatus: acceptedReport.status,
  acceptedFixtureTools:
    acceptedReport.counts.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence,
  unsafeFixtureStatus: unsafeReport.status,
  externalAgentExecutableNowTools: docs.counts.externalAgentExecutableNowTools,
  agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
