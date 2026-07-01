import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_exact_execution_admission_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks'
const sourceControlledDecision =
  'ai_graphics_external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission-diagnostics.mjs'
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
  exactExecutionAdmissionReadyTools: 5,
  sourceControlledToolExecutionProofAcceptedTools: 5,
  exactRequestEnvelopeAcceptedTools: 5,
  approvedPlanSnapshotAcceptedTools: 5,
  creditReservationAcceptedTools: 5,
  privateArtifactManifestAcceptedTools: 5,
  workerAcceptedRequestSchemaAcceptedTools: 5,
  toolSpecificQaGateAcceptedTools: 5,
  satoriBlockedPendingApprovedFontFixtureTools: 1,
  nonCpuStaticDeferredTools: 15,
  externalAgentExactRequestAdmittedWithProvidedEvidenceTools: 5,
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
  'externalAgentCpuStaticPrivateWorkerExactExecutionAdmissionCompleted',
  'sourceControlledToolExecutionProofAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'allFiveExactExecutionAdmissionsReady',
  'allFiveSourceControlledProofsAccepted',
  'allFiveExactRequestEnvelopesAccepted',
  'allFiveApprovedPlanSnapshotsAccepted',
  'allFiveCreditReservationsAccepted',
  'allFivePrivateArtifactManifestsAccepted',
  'allFiveWorkerAcceptedRequestSchemasAccepted',
  'allFiveToolSpecificQaGatesAccepted',
  'satoriBlockedPendingApprovedFontFixture',
  'fifteenRuntimeDeferredToolsPreserved',
  'exactExecutionAdmissionRefsPreserved',
  'privateArtifactOnlyPolicyAccepted',
  'noLiveQueueWriteByAdmission',
  'noAdapterInvocationByAdmission',
  'noToolExecutionByAdmission',
  'nextGateRequiresAdapterInvocationAndWorkerEnqueueAdmission',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
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
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.json',
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

function checkEvidence(toolId, evidence) {
  if (!evidence) {
    fail(`missing_exact_admission_evidence:${toolId}`)
    return
  }
  const expectedPrefixes = {
    approvedPlanSnapshotRef: 'approved-plan-snapshot://',
    creditReservationRef: 'credit-reservation://',
    privateArtifactManifestRef: 'private://',
    sourceControlledToolExecutionEvidenceRef: 'controlled-tool-execution-proof://',
    sourcePhase0LocalArtifactEvidenceRef: 'phase0-local-artifact-evidence://',
    sourceAdapterInvocationDryRunRef: 'adapter-dry-run://',
    externalAgentExactRequestEnvelopeRef: 'exact-request-envelope://',
    externalAgentAdmissionDecisionRef: 'exact-execution-admission://',
    workerAcceptedRequestSchemaRef: 'worker-accepted-request-schema://',
    privateOutputManifestRef: 'private-output-contract://',
    toolResultSchemaRef: 'tool-result-schema://',
    toolSpecificQaGateRef: 'tool-qa-gate://',
    executionUnlockConditionRef: 'execution-unlock-condition://',
  }
  for (const [key, prefix] of Object.entries(expectedPrefixes)) {
    if (!String(evidence[key] ?? '').startsWith(prefix)) {
      fail(`evidence_prefix_mismatch:${toolId}:${key}`)
    }
  }
  for (const key of [
    'exactExecutionAdmissionIdempotencyKey',
    'sourceControlledToolExecutionEvidenceRef',
    'sourcePhase0LocalArtifactEvidenceRef',
    'sourceAdapterInvocationDryRunRef',
    'externalAgentExactRequestEnvelopeRef',
    'externalAgentAdmissionDecisionRef',
    'workerAcceptedRequestSchemaRef',
    'privateOutputManifestRef',
    'toolResultSchemaRef',
    'toolSpecificQaGateRef',
    'executionUnlockConditionRef',
  ]) {
    if (!String(evidence[key] ?? '').includes(toolId)) {
      fail(`evidence_missing_tool:${toolId}:${key}`)
    }
  }
  if (evidence.queueName !== queueName) fail(`evidence_queue_mismatch:${toolId}`)
  if (
    evidence.exactExecutionAdmissionMode !==
    'admit_exact_private_worker_request_without_live_queue_or_adapter_execution'
  ) {
    fail(`exact_admission_mode_mismatch:${toolId}`)
  }
  if (evidence.expectedOutputVisibility !== 'private_artifact_only') {
    fail(`visibility_mismatch:${toolId}`)
  }
}

for (const file of requiredFiles) read(file)

const report = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json',
)
const sourceControlled = json(
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.json',
)
const packageJson = json('package.json')

if (report.decision !== decision) fail(`decision_mismatch:${report.decision}`)
if (report.status !== acceptedStatus) fail(`status_mismatch:${report.status}`)
if (report.sourceControlledToolExecutionProofDecision !== sourceControlledDecision) {
  fail(`source_decision_mismatch:${report.sourceControlledToolExecutionProofDecision}`)
}
if (report.schemaVersion !==
  '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-exact-execution-admission') {
  fail(`schema_version_mismatch:${report.schemaVersion}`)
}
if (report.queueName !== queueName) fail(`queue_name_mismatch:${report.queueName}`)
checkList('tools', report.tools, tools)
checkList('capabilities', report.capabilities, capabilities)
checkCounts('report', report.counts)
checkBooleans('report', report.booleans)

if (sourceControlled.decision !== sourceControlledDecision) fail('source_controlled_decision_missing')
if (sourceControlled.counts?.controlledToolExecutionProofAcceptedTools !== 5) {
  fail('source_controlled_count_mismatch')
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
    row.exactExecutionAdmissionStatus !==
    'exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked'
  ) {
    fail(`admitted_tool_status_mismatch:${toolId}:${row.exactExecutionAdmissionStatus}`)
  }
  for (const key of [
    'sourceControlledToolExecutionProofAccepted',
    'exactExecutionAdmissionReady',
    'exactRequestEnvelopeAccepted',
    'approvedPlanSnapshotAccepted',
    'creditReservationAccepted',
    'privateArtifactManifestAccepted',
    'sourceControlledEvidenceAccepted',
    'workerAcceptedRequestSchemaAccepted',
    'toolSpecificQaGateAccepted',
    'externalAgentExactRequestAdmittedWithProvidedEvidence',
  ]) {
    if (row[key] !== true) fail(`admitted_tool_boolean_not_true:${toolId}:${key}`)
  }
  for (const key of [
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
    'gpuRuntimeShouldStartNow',
  ]) {
    if (row[key] !== false) fail(`admitted_tool_boolean_not_false:${toolId}:${key}`)
  }
  checkEvidence(toolId, row.exactExecutionAdmissionEvidence)
}

const satori = rows.find((row) => row.toolId === 'satori')
if (
  satori?.exactExecutionAdmissionStatus !==
  'exact_external_agent_execution_admission_blocked_pending_satori_font_fixture'
) {
  fail(`satori_status_mismatch:${satori?.exactExecutionAdmissionStatus}`)
}
if (!/font fixture/i.test(satori?.blocker ?? '')) fail('satori_font_fixture_block_missing')

for (const row of rows.filter((candidate) => !admittedTools.includes(candidate.toolId) && candidate.toolId !== 'satori')) {
  if (
    row.exactExecutionAdmissionStatus !==
    'exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary'
  ) {
    fail(`deferred_status_mismatch:${row.toolId}:${row.exactExecutionAdmissionStatus}`)
  }
  if (row.exactExecutionAdmissionReady !== false) fail(`deferred_ready_not_false:${row.toolId}`)
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
  read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.md'),
  read('docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission-results.md'),
  read('docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.md'),
  read('docs/production-beta-readiness-scorecard.md'),
].join('\n')

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(combinedDocs)) fail(`forbidden_doc_claim:${pattern}`)
}
for (const required of [
  decision,
  'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_AND_ENQUEUE_ADMISSION',
  '`agentCanExecuteToolsNow=false`',
  '`externalAgentCanInvokeAdapterNow=false`',
  '`toolExecutionApprovedNow=false`',
  '`gpuRuntimeShouldStartNow=false`',
  'temporary and intentional',
]) {
  if (!combinedDocs.includes(required)) fail(`missing_doc_phrase:${required}`)
}

const indexSource = read('server/tool-registry/index.ts')
if (!indexSource.includes("export * from './ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'")) {
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
  exactExecutionAdmissionReadyTools: report.counts.exactExecutionAdmissionReadyTools,
  agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
  externalAgentCanInvokeAdapterNow: report.booleans.externalAgentCanInvokeAdapterNow,
  toolExecutionApprovedNow: report.booleans.toolExecutionApprovedNow,
  gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
  localArtifactsCommitted: false,
}, null, 2))
