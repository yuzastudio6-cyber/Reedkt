import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof-diagnostics.mjs'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'

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

const falseBooleanKeys = [
  'externalAgentCanInvokeAdapterNow',
  'externalAgentCanSubmitPrivateWorkerQueueNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'serviceRoleQueueWriteSmokeApprovedNow',
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
  'serviceRoleQueueWriteSmokePerformedByValidator',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformedByValidator',
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
  try {
    return JSON.parse(read(filePath))
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

function runProof(args = []) {
  const output = execFileSync('npm', ['run', '--silent', runScriptName, '--', '--print-only', ...args], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return JSON.parse(output)
}

function writeTempJson(root, name, value) {
  const filePath = path.join(root, name)
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
}

function validSmokeResult() {
  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_passed_with_cleanup',
    status:
      'non_production_service_role_queue_write_smoke_passed_with_cleanup_no_worker_dispatch_or_tool_execution',
    queueName: 'ai_graphics_external_agent_cpu_static_private_worker_queue',
    toolsSubmitted: 5,
    toolsSubmittedIds: proofTools,
    queueRowsWritten: 5,
    queueRowsCleanedUp: 5,
    queueRowsPersistedAfterCleanup: 0,
    workerClaimsCreated: 0,
    workerDispatchesPerformed: 0,
    workerExecutionsPerformed: 0,
    toolExecutionsPerformed: 0,
    serviceRoleBoundaryRef:
      'service-role-boundary://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/non-production',
    privateEvidenceRef:
      'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/evidence.json',
    telemetryRef:
      'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/telemetry.json',
    cleanupProofRef:
      'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/cleanup.json',
    rollbackRef:
      'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/rollback.json',
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.md',
  'docs/production-beta-readiness-scorecard.md',
  'server/tool-registry/index.ts',
  'package.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.md')
const promptResult = read('docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof-results.md')
const implementationPrompt = read('docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.md')
const source = read('server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts')
const cli = read('server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_proof_validator_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'blocked_pending_saved_non_production_service_role_queue_write_smoke_result') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.counts?.sourcePreflightReadyTools !== 5) fail('docs_source_preflight_ready_not_5')
if (docs.counts?.savedSmokeResultAcceptedToolsWithProvidedEvidence !== 0) {
  fail('docs_saved_smoke_result_should_not_be_accepted_without_result')
}
if (docs.counts?.externalAgentExecutableNowTools !== 0) fail('docs_executable_now_not_zero')
if (docs.counts?.gpuRuntimeShouldStartNowTools !== 0) fail('docs_gpu_start_now_not_zero')
if (!Array.isArray(docs.tools) || docs.tools.length !== 21) fail('docs_tools_not_21')
for (const toolId of allTools) {
  if (!docs.tools?.includes(toolId)) fail(`docs_missing_tool:${toolId}`)
}
for (const toolId of proofTools) {
  const row = docs.rows?.find((candidate) => candidate.toolId === toolId)
  if (!row) fail(`docs_missing_proof_tool_row:${toolId}`)
  if (row?.sourcePreflightReady !== true) fail(`docs_source_preflight_not_ready:${toolId}`)
  if (row?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence !== false) {
    fail(`docs_unexpected_acceptance_without_result:${toolId}`)
  }
}
for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_gate_not_false:${key}`)
}
for (const [key, expected] of Object.entries({
  externalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofValidatorPrepared: true,
  sourceNonProductionServiceRoleQueueWriteSmokePreflightAccepted: true,
  savedNonProductionServiceRoleQueueWriteSmokeResultProvided: false,
  serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence: false,
  allFiveCpuStaticSavedSmokeResultsAcceptedWithProvidedEvidence: false,
  cleanupVerifiedWithProvidedEvidence: false,
  serverOnlyServiceRoleCredentialsRequired: true,
  nonProductionEnvironmentRequired: true,
  noSupabaseMutationByValidator: true,
  noLiveQueueWriteByValidator: true,
  noWorkerClaimByValidator: true,
  noWorkerDispatchByValidator: true,
  noToolExecutionByValidator: true,
  noGpuRuntimeStartByValidator: true,
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  agentCanSelectForPlanning: true,
})) {
  if (docs.booleans?.[key] !== expected) fail(`docs_boolean_mismatch:${key}`)
}

for (const phrase of [
  'blocked_pending_saved_non_production_service_role_queue_write_smoke_result',
  'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked',
  '--external-agent-cpu-static-service-role-queue-write-smoke-result',
  '--print-only',
  'queueRowsPersistedAfterCleanup',
  'noSupabaseMutationByValidator',
  'noWorkerDispatchByValidator',
  'noToolExecutionByValidator',
  'gpuRuntimeShouldStartNow=false',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes(docs.decision)) fail('scorecard_missing_decision')
if (!promptResult.includes(docs.decision)) fail('prompt_result_missing_decision')
if (!implementationPrompt.includes(docs.decision)) fail('implementation_prompt_missing_decision')

const pendingOutput = runProof()
if (pendingOutput.status !== 'blocked_pending_saved_non_production_service_role_queue_write_smoke_result') {
  fail(`pending_output_status_mismatch:${pendingOutput.status}`)
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-cpu-static-service-role-smoke-proof-'))
const acceptedResultPath = writeTempJson(tempDir, 'accepted-result.json', validSmokeResult())
const acceptedOutput = runProof([
  '--external-agent-cpu-static-service-role-queue-write-smoke-result',
  acceptedResultPath,
])
if (acceptedOutput.status !== 'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked') {
  fail(`accepted_output_status_mismatch:${acceptedOutput.status}`)
}
if (acceptedOutput.counts?.savedSmokeResultAcceptedToolsWithProvidedEvidence !== 5) {
  fail('accepted_output_saved_smoke_result_not_5')
}
if (acceptedOutput.counts?.serviceRoleQueueWritesAcceptedWithProvidedEvidence !== 5) {
  fail('accepted_output_queue_writes_not_5')
}
if (acceptedOutput.counts?.queueRowsPersistedAfterCleanup !== 0) {
  fail('accepted_output_cleanup_not_zero')
}
for (const key of falseBooleanKeys) {
  if (acceptedOutput.booleans?.[key] !== false) fail(`accepted_output_false_gate_not_false:${key}`)
}
if (acceptedOutput.booleans?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence !== true) {
  fail('accepted_output_proof_not_accepted')
}
if (acceptedOutput.booleans?.agentCanExecuteToolsNow !== false) {
  fail('accepted_output_agent_execute_not_false')
}

const unsafeResult = {
  ...validSmokeResult(),
  queueRowsPersistedAfterCleanup: 1,
}
const unsafeResultPath = writeTempJson(tempDir, 'unsafe-result.json', unsafeResult)
const unsafeOutput = runProof([
  '--external-agent-cpu-static-service-role-queue-write-smoke-result',
  unsafeResultPath,
])
if (unsafeOutput.status !== 'rejected_saved_non_production_service_role_queue_write_smoke_result') {
  fail(`unsafe_output_status_mismatch:${unsafeOutput.status}`)
}
if (!unsafeOutput.rejectionReasons?.some((reason) => /zero persisted queue rows/i.test(reason))) {
  fail('unsafe_output_missing_cleanup_rejection')
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff.trim().length > 0) fail('package_lock_changed')
const tracked = git(['ls-files'])
if (tracked.split('\n').some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_tracked')
}
for (const file of git(['diff', '--name-only']).split('\n').filter(Boolean)) {
  if (/(^|\/)(\.local-artifacts|renders?|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i.test(file)) {
    fail(`generated_artifact_path_changed:${file}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  sourcePreflightReadyTools: docs.counts.sourcePreflightReadyTools,
  savedSmokeResultAcceptedToolsWithProvidedEvidence:
    docs.counts.savedSmokeResultAcceptedToolsWithProvidedEvidence,
  acceptedFixtureStatus: acceptedOutput.status,
  acceptedFixtureTools:
    acceptedOutput.counts.savedSmokeResultAcceptedToolsWithProvidedEvidence,
  unsafeFixtureStatus: unsafeOutput.status,
  externalAgentExecutableNowTools: docs.counts.externalAgentExecutableNowTools,
  agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
