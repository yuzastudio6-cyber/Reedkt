import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cliFile =
  'server/cli/ai-graphics-external-agent-native-cuda-closeout.ts'
const diagnosticFile =
  'scripts/validation/ai-graphics-external-agent-native-cuda-closeout-diagnostics.mjs'
const runScriptName = 'ai-graphics:external-agent-native-cuda-closeout'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-native-cuda-closeout.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-native-cuda-closeout:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-native-cuda-closeout-diagnostics.mjs'
const baseRef = 'HEAD'
const targetTools = ['sam2', 'birefnet']
const runtimeBuckets = [
  'native_cuda_closeout_blocked_until_eligible_host_private_models_and_private_source_are_present',
  'native_cuda_closeout_accepted_for_remaining_two_tools',
]
const forbiddenOutputTrueBooleans = [
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoadedByThisRunner',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
]
const forbiddenTextPatterns = [
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
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
  const filePath = absolute(file)
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function execFile(command, args, options = {}) {
  return childProcess.execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
    timeout: options.timeout ?? 120_000,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

function exec(command) {
  return childProcess.execSync(command, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 120 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

function runNpmJson(scriptName, args = []) {
  const output = execFile('npm', ['run', '--silent', scriptName, '--', ...args], {
    timeout: 180_000,
  })
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_npm_json:${scriptName}:${error.message}`)
    return {}
  }
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function packageJsonAt(ref) {
  try {
    return JSON.parse(exec(`git show ${ref}:package.json`))
  } catch (error) {
    fail(`package_json_ref_read_failed:${ref}:${error.message}`)
    return {}
  }
}

function validatePackageSections(packageJson) {
  assert(
    packageJson.scripts?.[runScriptName] === runScriptCommand,
    'missing_or_wrong_native_cuda_closeout_script',
  )
  assert(
    packageJson.scripts?.[diagnosticScriptName] === diagnosticScriptCommand,
    'missing_or_wrong_native_cuda_closeout_diagnostic_script',
  )
  const basePackageJson = packageJsonAt(baseRef)
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const current = JSON.stringify(packageJson[section] ?? {}, null, 2)
    const base = JSON.stringify(basePackageJson[section] ?? {}, null, 2)
    if (current !== base) fail(`package_dependency_section_changed:${section}`)
  }
}

function makeDiagnosticFixtures() {
  const fixtureRoot = absolute(
    '.local-artifacts/ai-graphics/native-cuda-closeout-diagnostic',
  )
  const modelRoot = path.join(fixtureRoot, 'private-model-root')
  const sourceImage = path.join(fixtureRoot, 'private-approved-frame.ppm')
  fs.mkdirSync(modelRoot, { recursive: true })
  fs.writeFileSync(
    path.join(modelRoot, 'sam2.1_hiera_tiny.pt'),
    Buffer.alloc(1024 * 1024 + 1, 1),
  )
  const birefnetRoot = path.join(modelRoot, 'ZhengPeng7', 'BiRefNet')
  fs.mkdirSync(birefnetRoot, { recursive: true })
  const safetensorsHeader = Buffer.from(JSON.stringify({ fake: { dtype: 'F32', shape: [1], data_offsets: [0, 4] } }))
  const headerPrefix = Buffer.alloc(8)
  headerPrefix.writeBigUInt64LE(BigInt(safetensorsHeader.length), 0)
  fs.writeFileSync(
    path.join(birefnetRoot, 'model.safetensors'),
    Buffer.concat([headerPrefix, safetensorsHeader, Buffer.alloc(1024 * 1024 + 1, 2)]),
  )
  fs.writeFileSync(sourceImage, 'P3\n1 1\n255\n255 255 255\n')
  return {
    modelRoot: path.relative(root, modelRoot),
    sourceImage: path.relative(root, sourceImage),
    outputRoot:
      '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout-diagnostic',
  }
}

function validateDefaultReport(report) {
  assert(report.decision === 'ai_graphics_external_agent_native_cuda_closeout_prepared_for_remaining_two_tools', 'decision_mismatch')
  assert(runtimeBuckets.includes(report.status), `unexpected_status:${report.status}`)
  assert(report.status === runtimeBuckets[0], `default_report_not_blocked:${report.status}`)
  assert(report.toolsCovered === 2, `tools_covered_mismatch:${report.toolsCovered}`)
  assert(report.counts?.callableTools === 2, 'callable_count_mismatch')
  assert(report.counts?.executableTools === 0, 'default_executable_count_not_zero')
  assert(report.booleans?.nativeCudaCloseoutRunnerReady === true, 'runner_ready_not_true')
  assert(report.booleans?.allRemainingNativeCudaToolsCovered === true, 'remaining_tools_not_covered')
  assert(report.booleans?.agentCanSubmitControlledRequestsForRemainingTools === true, 'remaining_tools_not_callable')
  assert(report.booleans?.agentCanExecuteRemainingNativeCudaToolsNow === false, 'remaining_tools_executable_default_true')
  assert(report.booleans?.agentCanExecuteAll21ToolsNow === false, 'all21_executable_default_true')
  assert(report.booleans?.gpuRuntimeOnDemandOnly === true, 'gpu_not_on_demand')
  assert(report.booleans?.noIdleGpuRuntimeApproved === true, 'idle_gpu_allowed')
  assert(report.booleans?.gpuRuntimeShouldStartNow === false, 'gpu_runtime_should_start_default')
  for (const key of forbiddenOutputTrueBooleans) {
    assert(report.booleans?.[key] === false, `forbidden_boolean_true:${key}`)
  }
  for (const toolId of targetTools) {
    const row = report.tools?.find((tool) => tool.toolId === toolId)
    assert(Boolean(row), `missing_tool_row:${toolId}`)
    assert(row?.callableNow === true, `tool_not_callable:${toolId}`)
    assert(row?.executableNow === false, `tool_executable_without_proof:${toolId}`)
    assert(row?.executionState === 'blocked_with_reason', `tool_not_blocked:${toolId}`)
    assert(String(row?.nativeGpuProofSequenceCommand ?? '').includes('--require-host-eligible'), `missing_host_gate_command:${toolId}`)
    assert(String(row?.nativeGpuProofSequenceCommand ?? '').includes('--require-accepted-proof'), `missing_accepted_proof_gate_command:${toolId}`)
    assert(String(row?.finalExternalAgentToolCallCommand ?? '').includes('--strict-exit-code'), `missing_strict_tool_call:${toolId}`)
    assert(String(row?.finalExternalAgentToolCallCommand ?? '').includes('--require-private-only-boundary'), `missing_private_boundary:${toolId}`)
  }
}

function validateFixtureReport(report) {
  assert(report.status === runtimeBuckets[0], `fixture_report_not_blocked:${report.status}`)
  assert(report.counts?.executableTools === 0, 'fixture_executable_without_attempt')
  assert(report.booleans?.runtimeAttemptRequested === false, 'fixture_runtime_attempt_requested')
  assert(report.booleans?.toolExecutionPerformed === false, 'fixture_tool_execution_performed')
  assert(report.booleans?.gpuRuntimePerformed === false, 'fixture_gpu_runtime_performed')
  assert(report.booleans?.acceptedNativeCudaProofForAllRemainingTools === false, 'fixture_all_remaining_proof_not_false')
  assert(report.booleans?.agentCanExecuteRemainingNativeCudaToolsNow === false, 'fixture_remaining_native_cuda_executable_not_false')
  for (const toolId of targetTools) {
    const row = report.tools?.find((tool) => tool.toolId === toolId)
    assert(row?.privateModelRootCandidatePresent === true, `fixture_model_candidate_missing:${toolId}`)
    assert(row?.sourceImageExists === true, `fixture_source_image_missing:${toolId}`)
    assert(row?.runtimeAttemptPerformed === false, `fixture_runtime_attempt_performed:${toolId}`)
    assert(row?.runtimeAttemptAccepted === false, `fixture_runtime_attempt_accepted:${toolId}`)
    assert(String(row?.manifestMaterializerCommand ?? '').includes('--private-model-root'), `fixture_manifest_missing_private_root:${toolId}`)
  }
}

function validateScopedTimeoutReport(report) {
  assert(report.status === runtimeBuckets[0], `scoped_timeout_report_not_blocked:${report.status}`)
  assert(report.toolsCovered === 1, `scoped_timeout_tools_covered_unexpected:${report.toolsCovered}`)
  assert(report.booleans?.allRemainingNativeCudaToolsCovered === false, 'scoped_timeout_all_remaining_covered_true')
  assert(report.booleans?.acceptedNativeCudaProofForAllRequestedTools === false, 'scoped_timeout_all_requested_proof_true')
  assert(report.booleans?.acceptedNativeCudaProofForAllRemainingTools === false, 'scoped_timeout_all_remaining_proof_true')
  assert(report.booleans?.agentCanExecuteAll21ToolsNow === false, 'scoped_timeout_all21_true')
  const row = report.tools?.find((tool) => tool.toolId === 'sam2')
  assert(Boolean(row), 'scoped_timeout_missing_sam2_row')
  assert(String(row?.nativeGpuProofSequenceCommand ?? '').includes('--timeout-ms 123456'), 'scoped_timeout_proof_sequence_missing_timeout')
  assert(String(row?.finalExternalAgentToolCallCommand ?? '').includes('--timeout-ms 123456'), 'scoped_timeout_final_tool_call_missing_timeout')
}

function validateCommittedText() {
  const text = [
    read(cliFile),
    read('package.json'),
  ].join('\n')
  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(text)) fail(`forbidden_committed_text:${pattern}`)
  }
  assert(text.includes('sam2.1_hiera_tiny.pt'), 'sam2_candidate_missing_from_cli')
  assert(text.includes('ZhengPeng7/BiRefNet'), 'birefnet_candidate_missing_from_cli')
  assert(text.includes('--require-host-eligible'), 'require_host_eligible_missing_from_cli')
  assert(text.includes('--require-accepted-proof'), 'require_accepted_proof_missing_from_cli')
  assert(text.includes('--require-private-only-boundary'), 'private_boundary_missing_from_cli')
}

validatePackageSections(json('package.json'))
validateCommittedText()

const defaultReport = runNpmJson(runScriptName)
validateDefaultReport(defaultReport)

const fixtures = makeDiagnosticFixtures()
const fixtureReport = runNpmJson(runScriptName, [
  '--private-model-root',
  fixtures.modelRoot,
  '--source-image',
  fixtures.sourceImage,
  '--output-root',
  fixtures.outputRoot,
])
validateFixtureReport(fixtureReport)

const scopedTimeoutReport = runNpmJson(runScriptName, [
  '--tool',
  'sam2',
  '--timeout-ms',
  '123456',
])
validateScopedTimeoutReport(scopedTimeoutReport)

const packageLockDiff = exec('git diff --name-only HEAD -- package-lock.json').trim()
if (packageLockDiff) fail('package_lock_changed')

const changedFiles = exec('git diff --name-only HEAD').trim().split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_changed:${file}`)
}

const trackedLocalArtifacts = exec('git ls-files .local-artifacts').trim()
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const result = {
  ok: failures.length === 0,
  diagnostic: diagnosticScriptName,
  runScript: runScriptName,
  targetTools,
  defaultStatus: defaultReport.status,
  fixtureStatus: fixtureReport.status,
  defaultCounts: defaultReport.counts,
  fixtureCounts: fixtureReport.counts,
  packageLockUnchanged: packageLockDiff.length === 0,
  trackedLocalArtifacts: trackedLocalArtifacts.length === 0,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
