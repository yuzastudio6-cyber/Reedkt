import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_cpu_static_private_worker_dispatch_smoke_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_agent_cpu_static_private_worker_dispatch_smoke_proof_accepted_five_with_runtime_blocks'
const sourceDecision =
  'ai_graphics_external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-dispatch-smoke-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-cpu-static-private-worker-dispatch-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof-diagnostics.mjs'
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

const smokeAcceptedTools = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  dispatchSmokeProofAcceptedTools: 5,
  dispatchSmokeProofAcceptedWithProvidedEvidenceTools: 5,
  sourceDispatchDryProofPreparedTools: 5,
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
  'externalAgentCpuStaticPrivateWorkerDispatchSmokeProofCompleted',
  'sourceDispatchDryProofAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'allFiveCpuStaticDispatchSmokeProofsAcceptedWithProvidedEvidence',
  'satoriBlockedPendingApprovedFontFixture',
  'fifteenRuntimeDeferredToolsPreserved',
  'providedSmokeEvidenceRefsPreserved',
  'sourceDryDispatchContractsPreserved',
  'privateArtifactOnlyPolicyAccepted',
  'noLiveWorkerLeaseBySmokeProof',
  'noLiveWorkerDispatchBySmokeProof',
  'noToolExecutionBySmokeProof',
  'nextGateRequiresToolExecutionDryRunProof',
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
  'server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts',
  'server/cli/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts',
  'scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.md',
  'docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-dry-proof.json',
  'server/tool-registry/index.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const allowedPackageDiffLines = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-cpu-static-private-worker-tool-execution-dry-run-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-tool-execution-dry-run-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission": "tsx server/cli/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts",',
  '+    "ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission:diagnostics": "node scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission-diagnostics.mjs",',
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

function checkEvidence(label, toolId, evidence) {
  if (!evidence) {
    fail(`${label}_missing_evidence:${toolId}`)
    return
  }
  for (const [key, prefix] of Object.entries({
    workerDispatchSmokeEvidenceRef: 'evidence://',
    workerDispatchSmokeTelemetryRef: 'telemetry://',
    workerDispatchSmokeLeaseAuditRef: 'lease-audit://',
    workerDispatchSmokeCleanupProofRef: 'cleanup://',
    sourceWorkerDispatchAttemptRef: 'dispatch://',
    approvedPlanSnapshotRef: 'approved-plan-snapshot://',
    creditReservationRef: 'credit-reservation://',
    privateArtifactManifestRef: 'private://',
  })) {
    if (!String(evidence[key] ?? '').startsWith(prefix)) {
      fail(`${label}_evidence_prefix_mismatch:${toolId}:${key}`)
    }
  }
  for (const key of [
    'workerDispatchSmokeEvidenceRef',
    'workerDispatchSmokeTelemetryRef',
    'workerDispatchSmokeLeaseAuditRef',
    'workerDispatchSmokeCleanupProofRef',
    'queuePayloadIdempotencyKey',
    'dryDispatchIdempotencyKey',
  ]) {
    if (!String(evidence[key] ?? '').includes(toolId)) {
      fail(`${label}_evidence_missing_tool:${toolId}:${key}`)
    }
  }
  if (evidence.expectedOutputVisibility !== 'private_artifact_only') {
    fail(`${label}_evidence_visibility_mismatch:${toolId}`)
  }
}

function checkRows(label, rows) {
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
    if (smokeAcceptedTools.includes(toolId)) {
      if (
        row.dispatchSmokeProofStatus !==
        'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked'
      ) {
        fail(`${label}_smoke_status_mismatch:${toolId}:${row.dispatchSmokeProofStatus}`)
      }
      if (row.queueName !== queueName) fail(`${label}_queue_name_mismatch:${toolId}`)
      if (row.sourceDryDispatchProofAccepted !== true) {
        fail(`${label}_source_dry_dispatch_not_accepted:${toolId}`)
      }
      if (row.sourceDryDispatchEnvelopePrepared !== true) {
        fail(`${label}_source_dry_dispatch_envelope_missing:${toolId}`)
      }
      if (row.providedDispatchSmokeEvidenceAccepted !== true) {
        fail(`${label}_provided_smoke_evidence_not_accepted:${toolId}`)
      }
      if (row.workerDispatchSmokeCompletedWithProvidedEvidence !== true) {
        fail(`${label}_smoke_not_completed_with_evidence:${toolId}`)
      }
      if (row.workerDispatchSmokeProofAcceptedWithProvidedEvidence !== true) {
        fail(`${label}_smoke_proof_not_accepted:${toolId}`)
      }
      checkEvidence(label, toolId, row.providedDispatchSmokeEvidence)
    }
    if (toolId === 'satori') {
      if (
        row.dispatchSmokeProofStatus !==
        'private_worker_dispatch_smoke_proof_blocked_pending_satori_font_fixture'
      ) {
        fail(`${label}_satori_status_mismatch:${row.dispatchSmokeProofStatus}`)
      }
      if (!/font/i.test(row.blocker ?? '')) fail(`${label}_satori_blocker_missing_font`)
      if (row.workerDispatchSmokeProofAcceptedWithProvidedEvidence !== false) {
        fail(`${label}_satori_unexpected_smoke_proof`)
      }
    }
    if (!smokeAcceptedTools.includes(toolId) && toolId !== 'satori') {
      if (
        row.dispatchSmokeProofStatus !==
        'private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary'
      ) {
        fail(`${label}_deferred_status_mismatch:${toolId}:${row.dispatchSmokeProofStatus}`)
      }
      if (row.workerDispatchSmokeProofAcceptedWithProvidedEvidence !== false) {
        fail(`${label}_unexpected_smoke_proof:${toolId}`)
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

const docs = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-smoke-proof.md')
const promptResult = read('docs/prompt-ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof-results.md')
const implementationPrompt = read('docs/implementation-prompts/prompt-ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.md')
const source = json('docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-dry-proof.json')
const packageJson = json('package.json')
const moduleSource = read('server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts')
const cliSource = read('server/cli/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts')
const diagnosticSource = read('scripts/validation/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof-diagnostics.mjs')
const indexSource = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.sourceDispatchDryProofDecision !== sourceDecision) fail('docs_source_decision_mismatch')
if (docs.queueName !== queueName) fail('docs_queue_name_mismatch')
if (source.decision !== sourceDecision) fail('source_decision_mismatch')
if (
  source.status !==
  'external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_five_dispatchable_one_blocked_execution_blocked'
) {
  fail('source_status_mismatch')
}

checkList('docs_tools', docs.tools, tools)
checkList('docs_capabilities', docs.capabilities, capabilities)
checkCounts('docs', docs.counts)
checkBooleans('docs', docs.booleans)
checkRows('docs', docs.rows)

if (docs.dispatchSmokeProofPolicy?.validatesProvidedSmokeEvidenceOnly !== true) {
  fail('smoke_policy_not_provided_evidence_only')
}
if (
  docs.dispatchSmokeProofPolicy?.mode !==
  'validate_saved_private_worker_dispatch_smoke_evidence_without_worker_dispatch_or_tool_execution'
) {
  fail('smoke_policy_mode_mismatch')
}
for (const key of [
  'sourceDryDispatchProofRequired',
  'noLiveWorkerLeaseBySmokeProof',
  'noLiveWorkerDispatchBySmokeProof',
  'noToolExecutionBySmokeProof',
  'privateArtifactOnly',
  'gpuRuntimeOnDemandOnly',
  'nextGateRequiresToolExecutionDryRunProof',
]) {
  if (docs.dispatchSmokeProofPolicy?.[key] !== true) fail(`smoke_policy_boolean_missing:${key}`)
}

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('package_run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

for (const required of [
  'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION',
  'buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof',
  'validatesProvidedSmokeEvidenceOnly',
  'providedDispatchSmokeEvidenceAccepted',
  'workerDispatchSmokeProofAcceptedWithProvidedEvidence',
  'externalAgentCanDispatchPrivateWorkerJobNow: false',
  'workerDispatchApprovedNow: false',
  'agentCanExecuteToolsNow: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!moduleSource.includes(required)) fail(`module_missing_required_text:${required}`)
}

for (const required of [
  'sourceDispatchDryProofPath',
  'buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof',
  '--write-records',
  'report.counts.dispatchSmokeProofAcceptedTools === 5',
  'report.booleans.agentCanExecuteToolsNow === false',
  'report.booleans.workerDispatchApprovedNow === false',
]) {
  if (!cliSource.includes(required)) fail(`cli_missing_required_text:${required}`)
}

if (!diagnosticSource.includes('forbiddenDocPatterns')) fail('diagnostic_missing_forbidden_patterns')
if (!diagnosticSource.includes('generatedArtifactPattern')) {
  fail('diagnostic_missing_generated_artifact_scan')
}
if (!indexSource.includes("export * from './ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof'")) {
  fail('index_missing_private_worker_dispatch_smoke_proof_export')
}

let cliReport = {}
try {
  cliReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
} catch (error) {
  fail(`cli_report_failed:${error.message}`)
}

if (cliReport.decision !== decision) fail('cli_decision_mismatch')
if (cliReport.status !== acceptedStatus) fail('cli_status_mismatch')
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

for (const fileText of [JSON.stringify(docs), docsMd, promptResult, implementationPrompt]) {
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(fileText)) fail(`forbidden_doc_claim:${pattern}`)
  }
}

for (const required of [
  decision,
  acceptedStatus,
  queueName,
  'externalAgentCanDispatchPrivateWorkerJobNow=false',
  'workerDispatchApprovedNow=false',
  'agentCanExecuteToolsNow=false',
  'gpuRuntimeShouldStartNow=false',
  'Private worker dispatch dry-proof packet',
  'Dispatch smoke proof accepted tools',
]) {
  if (!docsMd.includes(required)) fail(`docs_md_missing:${required}`)
}

for (const required of [
  'AI Graphics External Agent CPU Static Private Worker Dispatch Smoke Proof',
  decision,
  'dispatchSmokeProofAcceptedTools=5',
  'dispatchSmokeProofAcceptedWithProvidedEvidenceTools=5',
  'satoriBlockedPendingApprovedFontFixtureTools=1',
  'externalAgentCanDispatchPrivateWorkerJobNowTools=0',
  'workerDispatchApprovedNowTools=0',
  'toolExecutionApprovedNowTools=0',
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
      acceptedStatus,
      dispatchSmokeProofAcceptedTools: docs.counts.dispatchSmokeProofAcceptedTools,
      agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
      workerDispatchApprovedNow: docs.booleans.workerDispatchApprovedNow,
      gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
      packageLockUnchanged: true,
      localArtifactsCommitted: false,
    },
    null,
    2,
  ),
)
