import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_mock_queue_insertion_proof_passed_with_runtime_blocks'
const acceptedStatus =
  'mock_queue_insertion_validated_all_21_live_queue_still_blocked'
const sourceDecision =
  'ai_graphics_external_agent_route_to_queue_blocked_admission_prepared_with_runtime_blocks'
const runScriptName = 'ai-graphics:external-agent-mock-queue-insertion-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-mock-queue-insertion-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-mock-queue-insertion-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-mock-queue-insertion-proof-diagnostics.mjs'

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

const expectedCounts = {
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  sourceRouteToQueueBlockedAdmissionMappedTools: 21,
  mockQueueInsertionAttemptedTools: 21,
  mockQueueInsertedJobCount: 21,
  mockQueueReturnedJobIds: 21,
  queueValidationAcceptedTools: 21,
  gpuRuntimeTargetedTools: 8,
  gpuRuntimeShouldStartNowTools: 0,
  liveQueueWritePerformedTools: 0,
  workerEnqueuePerformedTools: 0,
  workerDispatchPerformedTools: 0,
  toolExecutionPerformedTools: 0,
  externalAgentExecutableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueKeys = [
  'externalAgentMockQueueInsertionProofPassed',
  'sourceRouteToQueueBlockedAdmissionAccepted',
  'mockQueueServiceValidationAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21QueueJobsValidatedByService',
  'mockQueueInsertionProofPerformed',
  'mockOnlyRuntimeModeEnforced',
  'privateArtifactManifestRefsOnly',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'routeToQueueAuthorizationApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerExecutionApprovedNow',
  'workerEnqueueApprovedNow',
  'workerDispatchApprovedNow',
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
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
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

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerEnqueueApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerEnqueuePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-mock-queue-insertion-proof.ts',
  'scripts/validation/ai-graphics-external-agent-mock-queue-insertion-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-mock-queue-insertion-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-mock-queue-insertion-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-route-to-queue-blocked-admission.json',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/tool-registry/ai-graphics-tool-call-readiness.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

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
    maxBuffer: 30 * 1024 * 1024,
  })
}

function checkCounts(label, counts) {
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts?.[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${counts?.[key]}`)
    }
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

function checkJobs(label, jobs) {
  if (!Array.isArray(jobs)) {
    fail(`${label}_jobs_not_array`)
    return
  }
  if (jobs.length !== 21) fail(`${label}_job_count_not_21`)
  for (const toolId of tools) {
    const job = jobs.find((item) => item.toolId === toolId)
    if (!job) {
      fail(`${label}_missing_job:${toolId}`)
      continue
    }
    if (!job.productionToolId) fail(`${label}_missing_production_tool_id:${toolId}`)
    if (!job.workerType) fail(`${label}_missing_worker_type:${toolId}`)
    if (!job.runtimeTarget) fail(`${label}_missing_runtime_target:${toolId}`)
    if (job.mockQueueInsertionValidated !== true) {
      fail(`${label}_mock_queue_validation_not_true:${toolId}`)
    }
    for (const key of [
      'liveQueueWritePerformed',
      'workerEnqueuePerformed',
      'workerDispatchPerformed',
      'toolExecutionPerformed',
      'gpuRuntimeShouldStartNow',
    ]) {
      if (job[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
    if (job.privateArtifactManifestRef && !String(job.privateArtifactManifestRef).startsWith('private://')) {
      fail(`${label}_${toolId}_private_artifact_ref_not_private`)
    }
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-mock-queue-insertion-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-mock-queue-insertion-proof.md')
const source = json('docs/tool-intelligence/ai-graphics/external-agent-route-to-queue-blocked-admission.json')
const packageJson = json('package.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
const cliSource = read('server/cli/ai-graphics-external-agent-mock-queue-insertion-proof.ts')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (source.decision !== sourceDecision) fail('source_decision_mismatch')
if (source.booleans?.agentCanExecuteToolsNow !== false) fail('source_agent_execution_not_false')
if (source.booleans?.liveQueueWritePerformed !== false) fail('source_live_queue_not_false')

checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)
checkJobs('docs', docs.jobs)

for (const toolId of tools) {
  if (!docsMd.includes(toolId)) fail(`markdown_missing_tool:${toolId}`)
}
for (const required of [
  'external-agent-route-to-queue-blocked-admission.json',
  'createAiGraphicsToolRuntimeQueueService',
  'mock mode',
  'no live queue write',
  'no tool execution',
]) {
  if (!JSON.stringify(docs).includes(required) && !docsMd.includes(required)) {
    fail(`missing_reference:${required}`)
  }
}
for (const required of [
  'createAiGraphicsToolRuntimeQueueService',
  'E2E_RUNTIME_MODE',
  'mock',
  'private://ai-graphics/external-agent/mock-queue-insertion-proof',
  'liveQueueWritePerformed: false',
  'workerDispatchPerformed: false',
  'toolExecutionPerformed: false',
]) {
  if (!cliSource.includes(required)) fail(`cli_missing:${required}`)
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(JSON.stringify(docs)) || pattern.test(docsMd)) {
    fail(`forbidden_claim:${pattern}`)
  }
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

if (!scorecard.includes(decision) ||
    !scorecard.includes('External Agent Mock Queue Insertion Proof')) {
  fail('scorecard_missing_mock_queue_insertion_section')
}
if (/runtimeReadyNow["`:\s=]+true/i.test(scorecard) ||
    /productionReadyNow["`:\s=]+true/i.test(scorecard)) {
  fail('scorecard_claims_runtime_or_production_ready')
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
} catch (error) {
  fail(`cli_execution_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
checkCounts('cli', cliReport.counts)
checkBooleans('cli', cliReport.booleans)
checkJobs('cli', cliReport.jobs)
if (cliReport.queueResult?.mockOnly !== true) fail('cli_queue_result_not_mock_only')
if (cliReport.queueResult?.insertedJobCount !== 21) fail('cli_inserted_count_not_21')
if (cliReport.queueResult?.liveToolExecutionPerformed !== false) {
  fail('cli_live_tool_execution_not_false')
}

const packageDiff = [
  exec('git diff -- package.json'),
  exec('git diff --cached -- package.json'),
].join('\n')
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-mock-worker-claim-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-claim-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-claim-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-claim-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof": "tsx server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-controlled-dispatcher-dry-run-proof": "tsx server/cli/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof.ts",',
  '+    "ai-graphics:external-agent-controlled-dispatcher-dry-run-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-tool-adapter-authorization-proof": "tsx server/cli/ai-graphics-external-agent-tool-adapter-authorization-proof.ts",',
  '+    "ai-graphics:external-agent-tool-adapter-authorization-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-tool-adapter-authorization-proof-diagnostics.mjs",',
])
const unexpectedPackageAdditions = packageDiff
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .filter((line) => !allowedPackageAdditions.has(line))
if (unexpectedPackageAdditions.length > 0) {
  fail(`unexpected_package_json_additions:${unexpectedPackageAdditions.join('|')}`)
}

const lockDiff = [
  exec('git diff -- package-lock.json'),
  exec('git diff --cached -- package-lock.json'),
].join('').trim()
if (lockDiff.length > 0) fail('package_lock_changed')

const changedFiles = [
  exec('git diff --name-only'),
  exec('git diff --cached --name-only'),
].join('\n').split('\n').filter(Boolean)
for (const changedFile of changedFiles) {
  if (changedGeneratedArtifactPattern.test(changedFile)) {
    fail(`generated_artifact_path_changed:${changedFile}`)
  }
}
if (changedFiles.some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_changed')
}

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    acceptedStatus,
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  acceptedStatus,
  mockQueueInsertedJobCount: 21,
  queueValidationAcceptedTools: 21,
  gpuRuntimeShouldStartNowTools: 0,
  liveQueueWritePerformed: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  packageLockUnchanged: true,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
