import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_private_proof_sequence_prepared_with_runtime_blocks'
const status =
  'gpu_model_private_proof_sequence_ready_kornia_first_blocked_until_scoped_private_cuda_proof'
const runScriptName =
  'ai-graphics:external-agent-gpu-model-private-proof-sequence'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-gpu-model-private-proof-sequence.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-gpu-model-private-proof-sequence:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-gpu-model-private-proof-sequence-diagnostics.mjs'

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

const sourceImageRequiredTools = new Set([
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const toolSpecificPrivateProofFlagByTool = {
  sam2: '--sam2-checkpoint <private-sam2-checkpoint.pt>',
  birefnet: '--birefnet-model <private-birefnet-model>',
  real_esrgan: '--real-esrgan-model <private-real-esrgan-model.pth>',
  rembg: '--rembg-model <private-rembg-model.onnx>',
  transparent_background:
    '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>',
}

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-gpu-model-private-proof-sequence.ts',
  'scripts/validation/ai-graphics-external-agent-gpu-model-private-proof-sequence-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.md',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json',
  'package.json',
]

const forbiddenCommittedTruePatterns = [
  /acceptedPrivateProofForRequestedTool["`:\s=]+true/i,
  /localRuntimeExecutedForRequestedTool["`:\s=]+true/i,
  /agentCanExecuteGpuModelToolsNow["`:\s=]+true/i,
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
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
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

function runJsonScript(args = []) {
  return JSON.parse(childProcess.execFileSync('npm', [
    'run',
    '--silent',
    runScriptName,
    '--',
    ...args,
  ], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  }))
}

function runScriptStatus(args = []) {
  const result = childProcess.spawnSync('npm', [
    'run',
    '--silent',
    runScriptName,
    '--',
    ...args,
  ], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_required_file:${file}`)
}

const pkg = json('package.json')
if (pkg.scripts?.[runScriptName] !== runScriptCommand) {
  fail('run_script_command_mismatch')
}
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_command_mismatch')
}

try {
  const headPkg = JSON.parse(exec('git show HEAD:package.json'))
  for (const section of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    if (
      JSON.stringify(pkg[section] ?? {}) !==
      JSON.stringify(headPkg[section] ?? {})
    ) {
      fail(`package_dependency_section_changed:${section}`)
    }
  }
} catch (error) {
  fail(`package_dependency_comparison_failed:${error.message}`)
}

const source = read('server/cli/ai-graphics-external-agent-gpu-model-private-proof-sequence.ts')
for (const phrase of [
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
  'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
  'ai-graphics:external-agent-execution-readiness',
  'ai-graphics:gpu-runtime-proof-local-preflight',
  '--local-runtime-proof-result',
  '--detect-host',
  '--require-host-eligible',
  '--require-accepted-proof',
  'outputJsonSha256',
  'korniaFirstPrivateProofSequenceCommand',
  'privateProofSequenceCommandsByTool',
  'sequenceCommandForTool',
  'allGpuModelToolsHaveExactPrivateProofSequenceCommand',
  '--write-records cannot be combined with --attempt-local-runtime',
  '--write-records cannot be combined with --detect-host',
  '--result-out must stay under .local-artifacts/',
  'currentHostGpuProofPreflight',
  'hostEligibilityGateSupported',
  'noIdleGpuRuntimeApproved',
  'proofBridgeRequiresOutputJsonSha256Match',
]) {
  if (!source.includes(phrase)) fail(`source_missing_phrase:${phrase}`)
}

const record = json('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.json')
const live = runJsonScript()

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch:${report.status}`)
  if (report.requestedToolId !== 'kornia') fail(`${label}_requested_tool_not_kornia`)
  if (report.fastestUnlockCandidate !== 'kornia') fail(`${label}_fastest_candidate_not_kornia`)
  if (report.sourceEvidence?.gpuModelLocalDevRuntimeExecutionHarness?.accepted !== true) {
    fail(`${label}_harness_not_accepted`)
  }
  if (report.sourceEvidence?.gpuModelRuntimeProofRefBridge?.accepted !== true) {
    fail(`${label}_bridge_not_accepted`)
  }
  if (report.sourceEvidence?.externalAgentExecutionReadiness?.accepted !== true) {
    fail(`${label}_readiness_not_accepted`)
  }
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceCommand ?? '').includes('--tool kornia')) {
    fail(`${label}_missing_kornia_sequence_command`)
  }
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceCommand ?? '').includes('--attempt-local-runtime')) {
    fail(`${label}_kornia_sequence_not_runtime_attempt`)
  }
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceCommand ?? '').includes('--source-image <private-approved-frame.png>')) {
    fail(`${label}_kornia_sequence_missing_private_source_image`)
  }
  const perToolCommands = report.interfaces?.privateProofSequenceCommandsByTool ?? {}
  for (const tool of gpuModelTools) {
    const command = String(perToolCommands[tool] ?? '')
    if (!command) fail(`${label}_missing_private_proof_sequence_command:${tool}`)
    if (!command.includes('--attempt-local-runtime')) {
      fail(`${label}_private_proof_sequence_missing_attempt_runtime:${tool}`)
    }
    if (!command.includes(`--tool ${tool}`)) {
      fail(`${label}_private_proof_sequence_missing_tool:${tool}`)
    }
    if (!command.includes(`.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>`)) {
      fail(`${label}_private_proof_sequence_missing_local_output_dir:${tool}`)
    }
    if (!command.includes('--detect-host')) {
      fail(`${label}_private_proof_sequence_missing_detect_host:${tool}`)
    }
    if (!command.includes('--require-host-eligible')) {
      fail(`${label}_private_proof_sequence_missing_host_gate:${tool}`)
    }
    if (!command.includes('--require-accepted-proof')) {
      fail(`${label}_private_proof_sequence_missing_accepted_proof_gate:${tool}`)
    }
    if (sourceImageRequiredTools.has(tool)) {
      if (!command.includes('--source-image <private-approved-frame.png>')) {
        fail(`${label}_private_proof_sequence_missing_source_image:${tool}`)
      }
    } else if (command.includes('--source-image')) {
      fail(`${label}_private_proof_sequence_unnecessary_source_image:${tool}`)
    }
    const toolSpecificFlag = toolSpecificPrivateProofFlagByTool[tool]
    if (toolSpecificFlag && !command.includes(toolSpecificFlag)) {
      fail(`${label}_private_proof_sequence_missing_tool_specific_flag:${tool}`)
    }
  }
  if (!String(report.interfaces?.defaultKorniaHarnessCommand ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
    fail(`${label}_default_kornia_harness_missing_canonical_image`)
  }
  if (report.sequencePolicy?.proofBridgeRequiresOutputJsonSha256Match !== true) {
    fail(`${label}_sha256_policy_not_true`)
  }
  if (report.sequencePolicy?.noIdleGpuRuntimeApproved !== true) {
    fail(`${label}_no_idle_gpu_policy_not_true`)
  }
  if (report.sequencePolicy?.noPublicArtifacts !== true) {
    fail(`${label}_public_artifact_policy_not_true`)
  }
  if (report.sequencePolicy?.noSignedUrls !== true) {
    fail(`${label}_signed_url_policy_not_true`)
  }
  for (const key of [
    'hostEligibilityGateSupported',
    'requireHostEligibleFlagSupported',
    'requireAcceptedProofFlagSupported',
    'allGpuModelToolsHaveExactPrivateProofSequenceCommand',
    'perToolPrivateProofSequenceCommandsPrepared',
  ]) {
    if (report.sequencePolicy?.[key] !== true) {
      fail(`${label}_sequence_policy_${key}_not_true`)
    }
  }
  const counts = report.counts ?? {}
  const expectedCounts = {
    requestedGpuModelTools: 1,
    localRuntimeExecutionPerformedTools: 0,
    toolExecutionApprovedNowTools: 0,
    acceptedPrivateProofTools: 0,
    routeSubmissionReadyWithAcceptedPrivateProofTools: 0,
    readinessAgentExecutableTools: 13,
    readinessGpuToolsWithValidRuntimeProof: 0,
    readinessBlockedWithReasonTools: 8,
    gpuRuntimeShouldStartNowTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
    currentHostGpuProofBlockers: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_mismatch:${key}:${counts[key]}`)
  }
  const booleans = report.booleans ?? {}
  for (const key of [
    'externalAgentGpuModelPrivateProofSequencePrepared',
    'korniaFirstUnlockPathPrepared',
    'scopedToolOnly',
    'proofBridgeExecuted',
    'readinessRecomputed',
    'agentCanExecute13NonGpuControlledToolsNow',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuRuntimeStartedOnlyDuringScopedAttempt',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'localRuntimeAttemptRequested',
    'localRuntimeExecutedForRequestedTool',
    'acceptedPrivateProofForRequestedTool',
    'hostPreflightRequested',
    'hostEligibleForNativeGpuProof',
    'requireHostEligible',
    'requireAcceptedProof',
    'agentCanExecuteGpuModelToolsNow',
    'agentCanExecuteAll21ToolsNow',
    'gpuRuntimeShouldStartNow',
    'dependencyInstallPerformed',
    'packageLockMutationPerformed',
    'providerRuntimePerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }
  const requested = report.requestedToolResult ?? {}
  if (requested.harness?.executionState !== 'blocked_with_reason') {
    fail(`${label}_harness_not_blocked:${requested.harness?.executionState}`)
  }
  if (requested.harness?.skipReasonCode !== 'kornia_source_frame_missing') {
    fail(`${label}_default_harness_skip_reason_mismatch:${requested.harness?.skipReasonCode}`)
  }
  if (requested.bridge?.proofRefBridgeStatus !== 'blocked_missing_private_local_runtime_proof_result') {
    fail(`${label}_bridge_default_status_mismatch:${requested.bridge?.proofRefBridgeStatus}`)
  }
  if (requested.readiness?.readinessState !== 'blocked_with_reason') {
    fail(`${label}_readiness_state_mismatch:${requested.readiness?.readinessState}`)
  }
  if (report.currentHostGpuProofPreflight?.requested !== false) {
    fail(`${label}_default_host_preflight_requested_not_false`)
  }
  if (report.currentHostGpuProofPreflight?.hostEligibleForNativeGpuProof !== false) {
    fail(`${label}_default_host_eligible_not_false`)
  }
  if (!Array.isArray(report.currentHostGpuProofPreflight?.blockers)) {
    fail(`${label}_default_host_blockers_not_array`)
  } else if (report.currentHostGpuProofPreflight.blockers.length !== 0) {
    fail(`${label}_default_host_blockers_not_empty`)
  }
}

checkReport('record', record)
checkReport('live', live)

let detected = null
try {
  detected = runJsonScript(['--detect-host'])
} catch (error) {
  fail(`detect_host_run_failed:${error.message}`)
}

if (detected) {
  if (detected.currentHostGpuProofPreflight?.requested !== true) {
    fail('detect_host_preflight_requested_not_true')
  }
  if (typeof detected.currentHostGpuProofPreflight?.hostEligibleForNativeGpuProof !== 'boolean') {
    fail('detect_host_eligible_not_boolean')
  }
  if (!Array.isArray(detected.currentHostGpuProofPreflight?.blockers)) {
    fail('detect_host_blockers_not_array')
  }
  if (detected.booleans?.hostPreflightRequested !== true) {
    fail('detect_host_boolean_host_preflight_not_true')
  }
  if (
    detected.booleans?.hostEligibleForNativeGpuProof !==
    detected.currentHostGpuProofPreflight?.hostEligibleForNativeGpuProof
  ) {
    fail('detect_host_boolean_eligibility_mismatch')
  }
  if (
    detected.counts?.currentHostGpuProofBlockers !==
    detected.currentHostGpuProofPreflight?.blockers?.length
  ) {
    fail('detect_host_blocker_count_mismatch')
  }
  if (detected.currentHostGpuProofPreflight?.hostEligibleForNativeGpuProof !== true) {
    const requiredHost = runScriptStatus(['--require-host-eligible'])
    if (requiredHost.status !== 2) {
      fail(`require_host_eligible_exit_status_mismatch:${requiredHost.status}`)
    }
  }
}

const requiredAcceptedProof = runScriptStatus(['--require-accepted-proof'])
if (requiredAcceptedProof.status !== 2) {
  fail(`require_accepted_proof_exit_status_mismatch:${requiredAcceptedProof.status}`)
}

for (const pattern of forbiddenCommittedTruePatterns) {
  if (pattern.test(JSON.stringify(record)) || pattern.test(read('docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.md'))) {
    fail(`committed_record_forbidden_pattern:${pattern}`)
  }
}

const changedFiles = exec('git diff --name-only HEAD').trim().split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_changed:${file}`)
}

const packageLockDiff = exec('git diff --name-only HEAD -- package-lock.json').trim()
if (packageLockDiff) fail('package_lock_changed')

const trackedLocalArtifacts = exec('git ls-files .local-artifacts').trim()
if (trackedLocalArtifacts) fail(`tracked_local_artifacts:${trackedLocalArtifacts}`)

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  requestedToolId: record.requestedToolId,
  readinessAgentExecutableTools: record.counts?.readinessAgentExecutableTools,
  readinessGpuToolsWithValidRuntimeProof:
    record.counts?.readinessGpuToolsWithValidRuntimeProof,
  acceptedPrivateProofTools: record.counts?.acceptedPrivateProofTools,
  gpuRuntimeShouldStartNow: record.booleans?.gpuRuntimeShouldStartNow,
  hostPreflightSupported: detected?.booleans?.hostPreflightRequested === true,
  hostEligibleForNativeGpuProof:
    detected?.currentHostGpuProofPreflight?.hostEligibleForNativeGpuProof,
  packageLockUnchanged: true,
}, null, 2))
