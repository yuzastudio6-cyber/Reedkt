import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_five_with_runtime_blocks'
const sourceExactDecision =
  'ai_graphics_external_agent_cpu_static_private_worker_exact_execution_admission_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission-diagnostics.mjs'
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

const admittedTools = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  adapterInvocationEnqueueAdmissionReadyTools: 5,
  sourceExactExecutionAdmissionAcceptedTools: 5,
  exactRequestEnvelopeAcceptedTools: 5,
  adapterInvocationEnvelopePreparedTools: 5,
  adapterInvocationContractAcceptedTools: 5,
  workerEnqueuePayloadPreparedTools: 5,
  workerEnqueueAdmissionContractAcceptedTools: 5,
  productionWorkerJobPayloadAcceptedTools: 5,
  backendQueueAdapterRefAcceptedTools: 5,
  serviceRoleBoundaryAcceptedTools: 5,
  workerPayloadSchemaAcceptedTools: 5,
  privateStoragePolicyAcceptedTools: 5,
  retryPolicyAcceptedTools: 5,
  deadLetterPolicyAcceptedTools: 5,
  checkbackPolicyAcceptedTools: 5,
  fallbackPolicyAcceptedTools: 5,
  idempotencyAcceptedTools: 5,
  satoriBlockedPendingApprovedFontFixtureTools: 1,
  nonCpuStaticDeferredTools: 15,
  externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools: 5,
  externalAgentCanInvokeAdapterNowTools: 0,
  externalAgentCanSubmitPrivateWorkerQueueNowTools: 0,
  backendQueueSubmissionApprovedNowTools: 0,
  liveQueueWriteApprovedNowTools: 0,
  workerEnqueueApprovedNowTools: 0,
  workerClaimApprovedNowTools: 0,
  workerDispatchApprovedNowTools: 0,
  workerExecutionApprovedNowTools: 0,
  toolExecutionApprovedNowTools: 0,
  externalAgentExecutableNowTools: 0,
  publicArtifactAllowedTools: 0,
  signedUrlAllowedTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
}

const trueKeys = [
  'externalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionCompleted',
  'sourceExactExecutionAdmissionAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'allFiveAdapterInvocationEnqueueAdmissionsReady',
  'allFiveSourceExactAdmissionsAccepted',
  'allFiveAdapterInvocationEnvelopesPrepared',
  'allFiveWorkerEnqueuePayloadsPrepared',
  'allFiveProductionWorkerJobPayloadsAccepted',
  'allFiveBackendQueueAdapterRefsAccepted',
  'allFiveServiceRoleBoundariesAccepted',
  'allFiveWorkerPayloadSchemasAccepted',
  'allFivePrivateStoragePoliciesAccepted',
  'allFiveRetryPoliciesAccepted',
  'allFiveDeadLetterPoliciesAccepted',
  'allFiveCheckbackPoliciesAccepted',
  'allFiveFallbackPoliciesAccepted',
  'allFiveIdempotencyContractsAccepted',
  'satoriBlockedPendingApprovedFontFixture',
  'fifteenRuntimeDeferredToolsPreserved',
  'privateArtifactOnlyPolicyAccepted',
  'adapterInvocationEnqueueRefsPreserved',
  'noAdapterInvocationByAdmission',
  'noBackendQueueSubmissionByAdmission',
  'noLiveQueueWriteByAdmission',
  'noWorkerEnqueueByAdmission',
  'noWorkerDispatchByAdmission',
  'noToolExecutionByAdmission',
  'nextGateRequiresLiveAdapterInvocationAndQueueWriteProof',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
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
  'adapterInvocationPerformed',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformed',
  'workerEnqueuePerformed',
  'workerClaimPerformed',
  'workerDispatchPerformed',
  'toolExecutionPerformed',
  'routeExecutionPerformed',
  'workerExecutionPerformed',
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
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
])

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /externalAgentCanInvokeAdapterNow["`:\s=]+true/i,
  /externalAgentCanSubmitPrivateWorkerQueueNow["`:\s=]+true/i,
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
  /adapterInvocationPerformed["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerClaimPerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
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

function checkEvidence(toolId, evidence, row) {
  if (!evidence) {
    fail(`missing_adapter_enqueue_evidence:${toolId}`)
    return
  }
  const expectedPrefixes = {
    sourceExactRequestEnvelopeRef: 'exact-request-envelope://',
    sourceExactAdmissionDecisionRef: 'exact-execution-admission://',
    sourceWorkerAcceptedRequestSchemaRef: 'worker-accepted-request-schema://',
    sourcePrivateOutputManifestRef: 'private-output-contract://',
    sourceToolResultSchemaRef: 'tool-result-schema://',
    sourceToolSpecificQaGateRef: 'tool-qa-gate://',
    approvedPlanSnapshotRef: 'approved-plan-snapshot://',
    creditReservationRef: 'credit-reservation://',
    privateArtifactManifestRef: 'private://',
    adapterInvocationEnvelopeRef: 'adapter-invocation-envelope://',
    adapterInvocationAuthorizationRef: 'adapter-invocation-authorization://',
    adapterInvocationIdempotencyKey: 'adapter-invocation://',
    workerEnqueuePayloadRef: 'worker-enqueue-payload://',
    workerEnqueueAdmissionRef: 'worker-enqueue-admission://',
    workerPayloadSchemaRef: 'worker-payload-schema://',
    backendQueueAdapterRef: 'backend-queue-adapter://',
    serviceRoleBoundaryRef: 'service-role-boundary://',
    privateStoragePolicyRef: 'private-storage-policy://',
    retryPolicyRef: 'worker-retry-policy://',
    deadLetterPolicyRef: 'worker-dead-letter-policy://',
    checkbackPolicyRef: 'worker-checkback-policy://',
    fallbackPolicyRef: 'worker-fallback-policy://',
  }
  for (const [key, prefix] of Object.entries(expectedPrefixes)) {
    if (!String(evidence[key] ?? '').startsWith(prefix)) {
      fail(`evidence_prefix_mismatch:${toolId}:${key}`)
    }
  }
  for (const key of Object.keys(expectedPrefixes)) {
    if (!String(evidence[key] ?? '').includes(toolId)) {
      fail(`evidence_missing_tool:${toolId}:${key}`)
    }
  }
  if (evidence.queueName !== queueName) fail(`evidence_queue_mismatch:${toolId}`)
  if (
    evidence.admissionMode !==
    'prepare_adapter_invocation_and_worker_enqueue_payload_without_calling_adapter_or_queue'
  ) {
    fail(`admission_mode_mismatch:${toolId}`)
  }
  if (evidence.expectedOutputVisibility !== 'private_artifact_only') {
    fail(`visibility_mismatch:${toolId}`)
  }
  const payload = evidence.productionWorkerJobPayload
  if (!payload) {
    fail(`missing_worker_payload:${toolId}`)
    return
  }
  if (!String(payload.jobId ?? '').includes(toolId)) fail(`payload_job_missing_tool:${toolId}`)
  if (payload.executionMode !== 'production_blocked') fail(`payload_execution_mode:${toolId}`)
  if (!String(payload.idempotencyKey ?? '').startsWith('prod-worker:')) {
    fail(`payload_idempotency_prefix:${toolId}`)
  }
  if (!Array.isArray(payload.requestedToolIds) || payload.requestedToolIds[0] !== row.productionToolId) {
    fail(`payload_requested_tool_mismatch:${toolId}`)
  }
  if (
    !Array.isArray(payload.storageReferenceIds) ||
    payload.storageReferenceIds[0] !== evidence.privateArtifactManifestRef
  ) {
    fail(`payload_storage_ref_mismatch:${toolId}`)
  }
  for (const key of [
    'adapterInvocationPerformed',
    'backendQueueSubmissionPerformed',
    'liveQueueWritePerformed',
    'workerEnqueuePerformed',
    'workerDispatchPerformed',
    'toolExecutionPerformed',
    'gpuRuntimeShouldStartNow',
    'agentCanExecuteToolsNow',
  ]) {
    if (payload.metadata?.[key] !== false) fail(`payload_boolean_not_false:${toolId}:${key}`)
  }
}

for (const file of requiredFiles) read(file)

const report = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.json',
)
const sourceExact = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
)
const packageJson = json('package.json')

if (report.decision !== decision) fail(`decision_mismatch:${report.decision}`)
if (report.status !== acceptedStatus) fail(`status_mismatch:${report.status}`)
if (report.sourceExactExecutionAdmissionDecision !== sourceExactDecision) {
  fail(`source_decision_mismatch:${report.sourceExactExecutionAdmissionDecision}`)
}
if (
  report.schemaVersion !==
  '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'
) {
  fail(`schema_version_mismatch:${report.schemaVersion}`)
}
if (report.queueName !== queueName) fail(`queue_name_mismatch:${report.queueName}`)
checkList('tools', report.tools, tools)
checkList('capabilities', report.capabilities, capabilities)
checkCounts('report', report.counts)
checkBooleans('report', report.booleans)

if (sourceExact.decision !== sourceExactDecision) fail('source_exact_decision_missing')
if (sourceExact.counts?.exactExecutionAdmissionReadyTools !== 5) {
  fail('source_exact_count_mismatch')
}
if (sourceExact.booleans?.agentCanExecuteToolsNow !== false) {
  fail('source_exact_execution_not_blocked')
}

const rows = Array.isArray(report.rows) ? report.rows : []
if (rows.length !== 21) fail(`row_count_mismatch:${rows.length}`)

for (const toolId of admittedTools) {
  const row = rows.find((candidate) => candidate.toolId === toolId)
  if (!row) {
    fail(`missing_admitted_tool_row:${toolId}`)
    continue
  }
  if (
    row.adapterInvocationEnqueueAdmissionStatus !==
    'adapter_invocation_enqueue_admission_ready_execution_still_blocked'
  ) {
    fail(`admitted_tool_status_mismatch:${toolId}:${row.adapterInvocationEnqueueAdmissionStatus}`)
  }
  for (const key of [
    'sourceExactExecutionAdmissionAccepted',
    'adapterInvocationEnqueueAdmissionReady',
    'exactRequestEnvelopeAccepted',
    'adapterInvocationEnvelopePrepared',
    'adapterInvocationContractAccepted',
    'workerEnqueuePayloadPrepared',
    'workerEnqueueAdmissionContractAccepted',
    'productionWorkerJobPayloadAccepted',
    'backendQueueAdapterRefAccepted',
    'serviceRoleBoundaryAccepted',
    'workerPayloadSchemaAccepted',
    'privateStoragePolicyAccepted',
    'retryPolicyAccepted',
    'deadLetterPolicyAccepted',
    'checkbackPolicyAccepted',
    'fallbackPolicyAccepted',
    'idempotencyAccepted',
    'externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence',
  ]) {
    if (row[key] !== true) fail(`admitted_tool_boolean_not_true:${toolId}:${key}`)
  }
  for (const key of [
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
    'gpuRuntimeShouldStartNow',
  ]) {
    if (row[key] !== false) fail(`admitted_tool_boolean_not_false:${toolId}:${key}`)
  }
  checkEvidence(toolId, row.adapterInvocationEnqueueEvidence, row)
}

const satori = rows.find((row) => row.toolId === 'satori')
if (
  satori?.adapterInvocationEnqueueAdmissionStatus !==
  'adapter_invocation_enqueue_admission_blocked_pending_satori_font_fixture'
) {
  fail(`satori_status_mismatch:${satori?.adapterInvocationEnqueueAdmissionStatus}`)
}
if (!/font fixture/i.test(satori?.blocker ?? '')) fail('satori_font_fixture_block_missing')

for (const row of rows.filter((candidate) => !admittedTools.includes(candidate.toolId) && candidate.toolId !== 'satori')) {
  if (
    row.adapterInvocationEnqueueAdmissionStatus !==
    'adapter_invocation_enqueue_admission_deferred_non_cpu_static_runtime_boundary'
  ) {
    fail(`deferred_status_mismatch:${row.toolId}:${row.adapterInvocationEnqueueAdmissionStatus}`)
  }
  if (row.adapterInvocationEnqueueAdmissionReady !== false) fail(`deferred_ready_not_false:${row.toolId}`)
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_missing')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_missing')
}

const packageDiff = exec('git diff -- package.json')
for (const line of packageDiff.split('\n')) {
  if (!line.startsWith('+') || line.startsWith('+++')) continue
  if (!allowedPackageDiffLines.has(line)) fail(`unexpected_package_json_diff:${line}`)
}

if (exec('git diff --name-only -- package-lock.json').trim() !== '') {
  fail('package_lock_changed')
}

const changedFiles = exec('git diff --name-only').split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
}

const trackedLocalArtifacts = exec('git ls-files .local-artifacts').trim()
if (trackedLocalArtifacts) fail(`tracked_local_artifacts:${trackedLocalArtifacts}`)

const combinedDocs = [
  read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.md'),
  read('docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission-results.md'),
  read('docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.md'),
  read('docs/production-beta-readiness-scorecard.md'),
].join('\n')

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(combinedDocs)) fail(`forbidden_doc_claim:${pattern}`)
}
for (const required of [
  decision,
  'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_AND_QUEUE_WRITE_PROOF',
  '`agentCanExecuteToolsNow=false`',
  '`externalAgentCanInvokeAdapterNow=false`',
  '`workerEnqueueApprovedNow=false`',
  '`toolExecutionApprovedNow=false`',
  '`gpuRuntimeShouldStartNow=false`',
  'temporary',
]) {
  if (!combinedDocs.includes(required)) fail(`missing_doc_phrase:${required}`)
}

const indexSource = read('server/tool-registry/index.ts')
if (!indexSource.includes("export * from './ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'")) {
  fail('index_export_missing')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  acceptedStatus: report.status,
  adapterInvocationEnqueueAdmissionReadyTools:
    report.counts.adapterInvocationEnqueueAdmissionReadyTools,
  productionWorkerJobPayloadAcceptedTools:
    report.counts.productionWorkerJobPayloadAcceptedTools,
  agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
  externalAgentCanInvokeAdapterNow: report.booleans.externalAgentCanInvokeAdapterNow,
  workerEnqueueApprovedNow: report.booleans.workerEnqueueApprovedNow,
  toolExecutionApprovedNow: report.booleans.toolExecutionApprovedNow,
  gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
  localArtifactsCommitted: false,
}, null, 2))
