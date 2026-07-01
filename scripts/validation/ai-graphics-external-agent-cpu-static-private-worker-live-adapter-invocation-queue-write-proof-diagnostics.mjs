import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_five_mock_queue_validated_execution_blocked'
const sourceDecision =
  'ai_graphics_external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof-diagnostics.mjs'
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

const proofTools = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  sourceAdapterInvocationEnqueueAdmissionAcceptedTools: 5,
  localAdapterInvocationProofPassedTools: 5,
  queueServiceAdapterValidationPassedTools: 5,
  mockQueueWriteValidationPassedTools: 5,
  sourceAdapterInvocationEnvelopeAcceptedTools: 5,
  sourceWorkerEnqueuePayloadAcceptedTools: 5,
  sourceProductionWorkerJobPayloadAcceptedTools: 5,
  satoriBlockedPendingApprovedFontFixtureTools: 1,
  nonCpuStaticDeferredTools: 15,
  externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidenceTools: 5,
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
  'externalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofCompleted',
  'sourceAdapterInvocationEnqueueAdmissionAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'allFiveLocalAdapterInvocationProofsPassed',
  'allFiveQueueServiceAdapterValidationsPassed',
  'allFiveMockQueueWriteValidationsPassed',
  'queueServiceMockOnlyRuntimeAccepted',
  'queueServiceReturnedFiveMockJobs',
  'satoriBlockedPendingApprovedFontFixture',
  'fifteenRuntimeDeferredToolsPreserved',
  'privateArtifactOnlyPolicyAccepted',
  'runtimeQueueServiceValidationAccepted',
  'noSupabaseQueueWriteByProof',
  'noLiveQueueWriteByProof',
  'noWorkerEnqueueByProof',
  'noWorkerDispatchByProof',
  'noToolExecutionByProof',
  'nextGateRequiresNonProductionServiceRoleQueueWriteSmoke',
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
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.json',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof-diagnostics.mjs",',
])

const forbiddenPatterns = [
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

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

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
  return childProcess.execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_required_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.json')
const source = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.md')
const promptResult = read('docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof-results.md')
const implementationPrompt = read('docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.md')
const moduleSource = read('server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts')
const cliSource = read('server/cli/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.ts')
const diagnosticSource = read('scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof-diagnostics.mjs')
const packageJson = json('package.json')
const indexSource = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('unexpected_decision')
if (docs.status !== acceptedStatus) fail('unexpected_status')
if (docs.sourceAdapterInvocationEnqueueAdmissionDecision !== sourceDecision) {
  fail('source_decision_not_recorded')
}
if (source.decision !== sourceDecision) fail('source_packet_decision_mismatch')
if (docs.queueName !== queueName) fail('queue_name_mismatch')
if (!Array.isArray(docs.tools) || docs.tools.length !== 21) fail('tools_length_mismatch')
if (!Array.isArray(docs.capabilities) || docs.capabilities.length !== 12) {
  fail('capabilities_length_mismatch')
}
for (const tool of tools) {
  if (!docs.tools?.includes(tool)) fail(`missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`missing_capability:${capability}`)
}

for (const [key, expected] of Object.entries(expectedCounts)) {
  if (docs.counts?.[key] !== expected) {
    fail(`count_mismatch:${key}:expected_${expected}:actual_${docs.counts?.[key]}`)
  }
}
for (const key of trueKeys) {
  if (docs.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}
for (const key of falseKeys) {
  if (docs.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

if (docs.proofPolicy?.mode !== 'invoke_runtime_queue_service_adapter_in_mock_only_mode_without_supabase_worker_or_tool_execution') {
  fail('proof_policy_mode_mismatch')
}
if (docs.queueServiceProof?.serviceMode !== 'mock_only_no_supabase_write') {
  fail('queue_service_not_mock_only')
}
if (docs.queueServiceProof?.mockOnly !== true) fail('queue_service_mock_only_false')
if (docs.queueServiceProof?.insertedJobCount !== 5) fail('queue_service_inserted_count_mismatch')
if (docs.queueServiceProof?.returnedJobIdCount !== 5) fail('queue_service_returned_job_count_mismatch')
if (docs.queueServiceProof?.liveToolExecutionPerformed !== false) {
  fail('queue_service_live_tool_execution_not_false')
}
if (!Array.isArray(docs.queueServiceProof?.jobs) || docs.queueServiceProof.jobs.length !== 5) {
  fail('queue_service_jobs_length_mismatch')
}

for (const tool of proofTools) {
  const row = docs.rows?.find((candidate) => candidate.toolId === tool)
  const job = docs.queueServiceProof?.jobs?.find((candidate) => candidate.toolId === tool)
  if (!row) fail(`missing_row:${tool}`)
  if (!job) fail(`missing_queue_service_job:${tool}`)
  if (row?.liveAdapterInvocationQueueWriteProofStatus !== 'live_adapter_invocation_queue_write_proof_passed_mock_queue_validated_execution_blocked') {
    fail(`unexpected_ready_status:${tool}`)
  }
  if (row?.localAdapterInvocationProofPassed !== true) fail(`adapter_proof_not_passed:${tool}`)
  if (row?.mockQueueWriteValidationPassed !== true) fail(`mock_queue_validation_not_passed:${tool}`)
  if (row?.liveAdapterInvocationQueueWriteProofEvidence?.queueServiceMockOnly !== true) {
    fail(`missing_mock_only_evidence:${tool}`)
  }
  if (!row?.liveAdapterInvocationQueueWriteProofEvidence?.privateArtifactManifestRef?.startsWith('private://')) {
    fail(`private_artifact_ref_missing:${tool}`)
  }
  if (job?.localAdapterInvocationValidated !== true) fail(`job_adapter_validation_missing:${tool}`)
  if (job?.mockQueueWriteValidated !== true) fail(`job_mock_queue_validation_missing:${tool}`)
  if (job?.liveQueueWritePerformed !== false) fail(`job_live_queue_write_not_false:${tool}`)
  if (job?.workerEnqueuePerformed !== false) fail(`job_worker_enqueue_not_false:${tool}`)
  if (job?.workerDispatchPerformed !== false) fail(`job_worker_dispatch_not_false:${tool}`)
  if (job?.toolExecutionPerformed !== false) fail(`job_tool_execution_not_false:${tool}`)
  if (job?.gpuRuntimeShouldStartNow !== false) fail(`job_gpu_runtime_not_false:${tool}`)
}

const satori = docs.rows?.find((row) => row.toolId === 'satori')
if (satori?.liveAdapterInvocationQueueWriteProofStatus !== 'live_adapter_invocation_queue_write_proof_blocked_pending_satori_font_fixture') {
  fail('satori_status_mismatch')
}
if (!/font fixture/i.test(satori?.blocker ?? '')) fail('satori_font_fixture_blocker_missing')

const deferredRows = docs.rows?.filter((row) =>
  row.liveAdapterInvocationQueueWriteProofStatus ===
    'live_adapter_invocation_queue_write_proof_deferred_non_cpu_static_runtime_boundary')
if (deferredRows?.length !== 15) fail('runtime_deferred_row_count_mismatch')

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('missing_run_script')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('missing_diagnostic_script')
}
if (!indexSource.includes("export * from './ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof'")) {
  fail('missing_index_export')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_decision')

for (const requiredText of [
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'mock-only mode',
  'non-production service-role queue write',
  'agentCanExecuteToolsNow=false',
  'gpuRuntimeShouldStartNow=false',
]) {
  if (!docsMd.includes(requiredText) && !promptResult.includes(requiredText) && !implementationPrompt.includes(requiredText)) {
    fail(`missing_doc_text:${requiredText}`)
  }
}
for (const requiredText of [
  'createAiGraphicsToolRuntimeQueueService',
  'E2E_RUNTIME_MODE',
  'mock',
  'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION',
]) {
  if (!cliSource.includes(requiredText) && !moduleSource.includes(requiredText)) {
    fail(`missing_source_text:${requiredText}`)
  }
}

for (const [label, body] of [
  ['docs_json', JSON.stringify(docs)],
  ['docs_md', docsMd],
  ['prompt_result', promptResult],
  ['implementation_prompt', implementationPrompt],
  ['module_source', moduleSource],
  ['cli_source', cliSource],
]) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(body)) fail(`forbidden_claim:${label}:${pattern}`)
  }
}

for (const file of git(['diff', '--name-only']).split('\n').filter(Boolean)) {
  if (file === 'package-lock.json') fail('package_lock_changed')
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

const packageDiff = git(['diff', '--', 'package.json'])
for (const line of packageDiff.split('\n')) {
  if (!line.startsWith('+') || line.startsWith('+++')) continue
  if (!allowedPackageDiffLines.has(line)) {
    fail(`unexpected_package_json_addition:${line}`)
  }
}
for (const forbiddenPackageToken of ['"dependencies"', '"devDependencies"', '"optionalDependencies"', '"peerDependencies"']) {
  if (packageDiff.includes(forbiddenPackageToken)) {
    fail(`dependency_section_changed:${forbiddenPackageToken}`)
  }
}

const localArtifacts = git(['ls-files', '.local-artifacts']).trim()
if (localArtifacts) fail(`local_artifacts_tracked:${localArtifacts}`)

if (!diagnosticSource.includes(runScriptName) || !diagnosticSource.includes(diagnosticScriptName)) {
  fail('diagnostic_missing_script_refs')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  localAdapterInvocationProofPassedTools:
    docs.counts.localAdapterInvocationProofPassedTools,
  mockQueueWriteValidationPassedTools:
    docs.counts.mockQueueWriteValidationPassedTools,
  externalAgentExecutableNowTools:
    docs.counts.externalAgentExecutableNowTools,
  liveQueueWriteApprovedNowTools:
    docs.counts.liveQueueWriteApprovedNowTools,
  toolExecutionApprovedNowTools:
    docs.counts.toolExecutionApprovedNowTools,
  gpuRuntimeShouldStartNowTools:
    docs.counts.gpuRuntimeShouldStartNowTools,
}, null, 2))
