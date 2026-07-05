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
const requiredBirefNetRuntimeFiles = [
  'model.safetensors',
  'config.json',
  'BiRefNet_config.py',
  'birefnet.py',
]
const manifestRecordByTool = {
  sam2: {
    manifestId: 'diagnostic_sam2_private_manifest_review_v1',
    toolId: 'sam2',
    templateId: 'sam2_checkpoint',
    sourceCandidateId: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
    privateArtifactRef: 'private://diagnostic/ai-graphics/model-weights/sam2',
    checksumSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
    checksumEvidenceRef: 'private://diagnostic/ai-graphics/checksum-evidence/sam2',
    sourceLicenseRef: 'private://diagnostic/ai-graphics/license-review/sam2',
    modelCardRef: 'private://diagnostic/ai-graphics/model-card/sam2',
    checksumEvidenceReviewed: true,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    provenanceReviewed: true,
    approvedForInternalBeta: true,
  },
  birefnet: {
    manifestId: 'diagnostic_birefnet_private_manifest_review_v1',
    toolId: 'birefnet',
    templateId: 'birefnet_model',
    sourceCandidateId: 'zhengpeng7_birefnet_official_weights_review_candidate',
    privateArtifactRef: 'private://diagnostic/ai-graphics/model-weights/birefnet',
    checksumSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
    checksumEvidenceRef: 'private://diagnostic/ai-graphics/checksum-evidence/birefnet',
    sourceLicenseRef: 'private://diagnostic/ai-graphics/license-review/birefnet',
    modelCardRef: 'private://diagnostic/ai-graphics/model-card/birefnet',
    checksumEvidenceReviewed: true,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    provenanceReviewed: true,
    approvedForInternalBeta: true,
  },
}
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

function writeBirefNetSupportFiles(modelDir) {
  for (const fileName of requiredBirefNetRuntimeFiles.filter((entry) => entry !== 'model.safetensors')) {
    fs.writeFileSync(
      path.join(modelDir, fileName),
      `diagnostic local-only ${fileName}; not a real BiRefNet runtime file\n`,
    )
  }
}

function makeDiagnosticFixtures() {
  const fixtureRoot = absolute(
    '.local-artifacts/ai-graphics/native-cuda-closeout-diagnostic',
  )
  const modelRoot = path.join(fixtureRoot, 'private-model-root')
  const modelManifestDir = path.join(fixtureRoot, 'model-weight-manifests')
  const sourceImage = path.join(fixtureRoot, 'private-approved-frame.ppm')
  const invalidSourceImage = path.join(fixtureRoot, 'not-an-image.txt')
  fs.mkdirSync(modelRoot, { recursive: true })
  fs.mkdirSync(path.join(modelManifestDir, 'sam2'), { recursive: true })
  fs.mkdirSync(path.join(modelManifestDir, 'birefnet'), { recursive: true })
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
  writeBirefNetSupportFiles(birefnetRoot)
  fs.writeFileSync(
    path.join(modelManifestDir, 'sam2', 'model_tree_manifest.json'),
    JSON.stringify(manifestRecordByTool.sam2, null, 2),
  )
  fs.writeFileSync(
    path.join(modelManifestDir, 'birefnet', 'model_tree_manifest.json'),
    JSON.stringify(manifestRecordByTool.birefnet, null, 2),
  )
  fs.writeFileSync(sourceImage, 'P3\n1 1\n255\n255 255 255\n')
  fs.writeFileSync(invalidSourceImage, 'diagnostic local-only text file; not an image\n')
  return {
    modelRoot: path.relative(root, modelRoot),
    modelManifestDir: path.relative(root, modelManifestDir),
    sam2Checkpoint: path.relative(root, path.join(modelRoot, 'sam2.1_hiera_tiny.pt')),
    birefnetModel: path.relative(root, birefnetRoot),
    sourceImage: path.relative(root, sourceImage),
    invalidSourceImage: path.relative(root, invalidSourceImage),
    outputRoot:
      '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout-diagnostic',
    scriptOut:
      '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout-diagnostic/run-native-cuda-closeout.sh',
    explicitOutputRoot:
      '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout-diagnostic-explicit',
    explicitScriptOut:
      '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout-diagnostic-explicit/run-native-cuda-closeout.sh',
    missingModelRoot:
      '.local-artifacts/ai-graphics/native-cuda-closeout-diagnostic/missing-private-model-root',
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
  assert(report.booleans?.readinessRecheckUsesNativeCudaCloseoutResultRoot === true, 'default_readiness_result_root_not_used')
  assert(report.booleans?.readinessRecheckUsesScopedLocalRuntimeProofResults === false, 'default_scoped_readiness_used')
  assert(report.readinessResultHandoff?.mode === 'native_cuda_closeout_result_root', `default_readiness_handoff_mode_unexpected:${report.readinessResultHandoff?.mode}`)
  assert(report.readinessResultHandoff?.usesNativeCudaCloseoutResultRoot === true, 'default_readiness_handoff_root_false')
  assert(report.readinessResultHandoff?.nativeCudaCloseoutResultRoot === '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout', 'default_readiness_handoff_root_path_mismatch')
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
    assert(row?.modelWeightManifestDirProvided === false, `default_manifest_dir_unexpected:${toolId}`)
    assert(row?.modelWeightManifestReviewAccepted === false, `default_manifest_review_accepted:${toolId}`)
    assert(String(row?.modelWeightManifestReviewBlocker ?? '').includes('model-weight manifest directory is required'), `default_manifest_review_blocker_missing:${toolId}`)
  }
}

function validateFixtureReport(report) {
  assert(report.status === runtimeBuckets[0], `fixture_report_not_blocked:${report.status}`)
  assert(report.counts?.executableTools === 0, 'fixture_executable_without_attempt')
  assert(report.booleans?.runtimeAttemptRequested === false, 'fixture_runtime_attempt_requested')
  assert(report.booleans?.toolExecutionPerformed === false, 'fixture_tool_execution_performed')
  assert(report.booleans?.gpuRuntimePerformed === false, 'fixture_gpu_runtime_performed')
  assert(report.booleans?.nativeCudaCloseoutLocalOnlyScriptGenerated === true, 'fixture_closeout_script_not_generated')
  assert(report.booleans?.acceptedNativeCudaProofForAllRemainingTools === false, 'fixture_all_remaining_proof_not_false')
  assert(report.booleans?.agentCanExecuteRemainingNativeCudaToolsNow === false, 'fixture_remaining_native_cuda_executable_not_false')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.written === true, 'fixture_closeout_script_written_not_true')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.localOnly === true, 'fixture_closeout_script_not_local_only')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.hostPreflightCommand?.includes('--require-host-eligible'), 'fixture_closeout_script_missing_host_preflight')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.modelWeightManifestReviewCommand?.includes('ai-graphics:model-weight-manifest-review:validate'), 'fixture_closeout_script_missing_manifest_review')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.modelWeightManifestReviewCommand?.includes('--allow-partial'), 'fixture_closeout_script_missing_manifest_allow_partial')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.nativeCudaCloseoutCommand?.includes('--attempt-local-runtime'), 'fixture_closeout_script_missing_runtime_attempt')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.nativeCudaCloseoutCommand?.includes('--strict-exit-code'), 'fixture_closeout_script_missing_strict_exit')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.nativeCudaCloseoutCommand?.includes('--existing-proof-result'), 'fixture_closeout_script_missing_existing_proof_refs')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.nativeCudaCloseoutCommand?.includes('--cpu-safe-gpu-model-route-proof-packet'), 'fixture_closeout_script_missing_cpu_safe_route_proof_packet')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.nativeCudaCloseoutCommand?.includes('--cpu-model-gpu-model-route-proof-packet'), 'fixture_closeout_script_missing_cpu_model_route_proof_packet')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.nativeCudaCloseoutCommand?.includes('--model-weight-manifest-dir'), 'fixture_closeout_script_missing_manifest_dir_arg')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.all21ReadinessRecheckCommand?.includes('ai-graphics:external-agent-execution-readiness'), 'fixture_closeout_script_missing_readiness_recheck')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.all21ReadinessRecheckCommand?.includes('--cpu-safe-gpu-model-route-proof-packet'), 'fixture_closeout_script_missing_cpu_safe_readiness_ref')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.all21ReadinessRecheckCommand?.includes('--cpu-model-gpu-model-route-proof-packet'), 'fixture_closeout_script_missing_cpu_model_readiness_ref')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.all21ReadinessRecheckCommand?.includes('--native-cuda-closeout-result-root'), 'fixture_closeout_script_missing_result_root_readiness_ref')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.all21ReadinessRecheckCommand?.includes('"$OUTPUT_ROOT"'), 'fixture_closeout_script_missing_output_root_readiness_ref')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.privateInputPreflightChecks?.privateModelRootDirectoryRequired === true, 'fixture_closeout_script_missing_model_root_preflight_metadata')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.privateInputPreflightChecks?.privateSourceImageFileRequired === true, 'fixture_closeout_script_missing_source_image_preflight_metadata')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.privateInputPreflightChecks?.sam2CheckpointCandidateRequired === true, 'fixture_closeout_script_missing_sam2_preflight_metadata')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.privateInputPreflightChecks?.birefnetModelDirectoryRequired === true, 'fixture_closeout_script_missing_birefnet_preflight_metadata')
  assert(report.readinessResultHandoff?.mode === 'native_cuda_closeout_result_root', `fixture_readiness_handoff_mode_unexpected:${report.readinessResultHandoff?.mode}`)
  assert(report.readinessResultHandoff?.usesNativeCudaCloseoutResultRoot === true, 'fixture_readiness_handoff_root_false')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.readinessResultHandoff?.mode === 'native_cuda_closeout_result_root', `fixture_script_readiness_handoff_mode_unexpected:${report.nativeCudaCloseoutLocalOnlyScript?.readinessResultHandoff?.mode}`)
  const generatedScriptPath = report.nativeCudaCloseoutLocalOnlyScript?.path
  assert(typeof generatedScriptPath === 'string', 'fixture_closeout_script_path_missing')
  if (typeof generatedScriptPath === 'string') {
    const generatedScriptText = read(generatedScriptPath)
    assert(generatedScriptText.startsWith('#!/usr/bin/env bash'), 'fixture_closeout_script_missing_shebang')
    assert(generatedScriptText.includes('set -euo pipefail'), 'fixture_closeout_script_missing_strict_shell')
    assert(generatedScriptText.includes('GPU work is on-demand only'), 'fixture_closeout_script_missing_on_demand_policy')
    assert(generatedScriptText.includes('PRIVATE_MODEL_MANIFEST_DIR'), 'fixture_closeout_script_missing_manifest_dir_env')
    assert(generatedScriptText.includes('REEDITPRO_AI_GRAPHICS_SAM2_CHECKPOINT'), 'fixture_closeout_script_missing_sam2_checkpoint_env')
    assert(generatedScriptText.includes('REEDITPRO_AI_GRAPHICS_BIREFNET_MODEL'), 'fixture_closeout_script_missing_birefnet_model_env')
    assert(generatedScriptText.includes('MODEL_PATH_ARGS=()'), 'fixture_closeout_script_missing_model_path_args')
    assert(generatedScriptText.includes('"${MODEL_PATH_ARGS[@]}"'), 'fixture_closeout_script_missing_model_path_arg_forwarding')
    assert(generatedScriptText.includes('ai-graphics:model-weight-manifest-review:validate'), 'fixture_closeout_script_missing_manifest_review_command')
    assert(generatedScriptText.includes('--allow-partial'), 'fixture_closeout_script_missing_manifest_allow_partial_flag')
    assert(generatedScriptText.includes('ai-graphics:gpu-runtime-proof-local-preflight'), 'fixture_closeout_script_missing_host_preflight_script')
    assert(generatedScriptText.includes('--require-host-eligible'), 'fixture_closeout_script_missing_require_host_eligible')
    assert(generatedScriptText.includes('ai-graphics:external-agent-native-cuda-closeout'), 'fixture_closeout_script_missing_closeout_command')
    assert(generatedScriptText.includes('--attempt-local-runtime'), 'fixture_closeout_script_missing_attempt_flag')
    assert(generatedScriptText.includes('--strict-exit-code'), 'fixture_closeout_script_missing_strict_flag')
    assert(generatedScriptText.includes('--existing-proof-result'), 'fixture_closeout_script_missing_existing_proof_flag')
    assert(generatedScriptText.includes('--cpu-safe-gpu-model-route-proof-packet'), 'fixture_closeout_script_missing_cpu_safe_packet_flag')
    assert(generatedScriptText.includes('--cpu-model-gpu-model-route-proof-packet'), 'fixture_closeout_script_missing_cpu_model_packet_flag')
    assert(generatedScriptText.includes('! -f "$CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET"'), 'fixture_closeout_script_missing_cpu_safe_packet_file_check')
    assert(generatedScriptText.includes('! -f "$CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET"'), 'fixture_closeout_script_missing_cpu_model_packet_file_check')
    assert(generatedScriptText.includes('Accepted CPU-safe GPU/model route proof packet file is missing'), 'fixture_closeout_script_missing_cpu_safe_packet_error')
    assert(generatedScriptText.includes('Accepted CPU-model GPU/model route proof packet file is missing'), 'fixture_closeout_script_missing_cpu_model_packet_error')
    assert(generatedScriptText.includes('! -d "$PRIVATE_MODEL_ROOT"'), 'fixture_closeout_script_missing_model_root_directory_check')
    assert(generatedScriptText.includes('! -f "$PRIVATE_SOURCE_IMAGE"'), 'fixture_closeout_script_missing_source_image_file_check')
    assert(generatedScriptText.includes('SAM2_CHECKPOINT_FOUND=0'), 'fixture_closeout_script_missing_sam2_checkpoint_check')
    assert(generatedScriptText.includes('Explicit private SAM2 checkpoint is missing or not a file'), 'fixture_closeout_script_missing_explicit_sam2_preflight')
    assert(generatedScriptText.includes('sam2.1_hiera_tiny.pt'), 'fixture_closeout_script_missing_sam2_candidate')
    assert(generatedScriptText.includes('BIREFNET_MODEL_FOUND=0'), 'fixture_closeout_script_missing_birefnet_model_check')
    assert(generatedScriptText.includes('Explicit private BiRefNet model directory is missing required files'), 'fixture_closeout_script_missing_explicit_birefnet_preflight')
    assert(generatedScriptText.includes('model.safetensors'), 'fixture_closeout_script_missing_birefnet_safetensors_check')
    assert(generatedScriptText.includes('BiRefNet_config.py'), 'fixture_closeout_script_missing_birefnet_config_check')
    assert(generatedScriptText.includes('ai-graphics:external-agent-execution-readiness'), 'fixture_closeout_script_missing_readiness_command')
    assert(generatedScriptText.includes('--native-cuda-closeout-result-root'), 'fixture_closeout_script_missing_result_root_flag')
    assert(generatedScriptText.includes('"$OUTPUT_ROOT"'), 'fixture_closeout_script_missing_output_root_result_ref')
  }
  for (const toolId of targetTools) {
    const row = report.tools?.find((tool) => tool.toolId === toolId)
    assert(row?.privateModelRootCandidatePresent === true, `fixture_model_candidate_missing:${toolId}`)
    assert(row?.explicitModelPathProvided === false, `fixture_explicit_path_unexpected:${toolId}`)
    assert(row?.explicitModelPathAccepted === false, `fixture_explicit_path_accepted:${toolId}`)
    assert(row?.modelPathSource === 'private_model_root_candidate', `fixture_model_path_source_unexpected:${toolId}:${row?.modelPathSource}`)
    assert(row?.modelWeightManifestDirProvided === true, `fixture_manifest_dir_missing:${toolId}`)
    assert(row?.modelWeightManifestReviewAccepted === true, `fixture_manifest_review_not_accepted:${toolId}`)
    assert(row?.modelWeightManifestReviewBlocker === null, `fixture_manifest_review_blocker_unexpected:${toolId}:${row?.modelWeightManifestReviewBlocker}`)
    assert(row?.sourceImageExists === true, `fixture_source_image_missing:${toolId}`)
    assert(row?.sourceImageAccepted === true, `fixture_source_image_not_accepted:${toolId}`)
    assert(row?.sourceImageFileType === 'ppm', `fixture_source_image_type_unexpected:${toolId}:${row?.sourceImageFileType}`)
    assert(row?.sourceImageBlocker === null, `fixture_source_image_blocker_unexpected:${toolId}:${row?.sourceImageBlocker}`)
    assert(row?.runtimeAttemptPerformed === false, `fixture_runtime_attempt_performed:${toolId}`)
    assert(row?.runtimeAttemptAccepted === false, `fixture_runtime_attempt_accepted:${toolId}`)
    const command = String(row?.manifestMaterializerCommand ?? '')
    assert(command.includes('--model-weight-manifest-dir'), `fixture_manifest_missing_manifest_dir:${toolId}`)
    if (toolId === 'sam2') {
      assert(command.includes('--sam2-checkpoint'), 'fixture_manifest_missing_sam2_flag')
      assert(command.includes('sam2.1_hiera_tiny.pt'), 'fixture_manifest_missing_sam2_path')
    } else {
      assert(command.includes('--birefnet-model'), 'fixture_manifest_missing_birefnet_flag')
      assert(command.includes('ZhengPeng7/BiRefNet'), 'fixture_manifest_missing_birefnet_path')
    }
  }
}

function validateExplicitModelPathReport(report) {
  assert(report.status === runtimeBuckets[0], `explicit_report_not_blocked:${report.status}`)
  assert(report.counts?.executableTools === 0, 'explicit_executable_without_host')
  assert(report.booleans?.nativeCudaCloseoutLocalOnlyScriptGenerated === true, 'explicit_closeout_script_not_generated')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.privateInputPreflightChecks?.privateModelRootDirectoryRequired === false, 'explicit_model_root_still_required')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.privateInputPreflightChecks?.sam2ExplicitCheckpointPathProvided === true, 'explicit_sam2_metadata_missing')
  assert(report.nativeCudaCloseoutLocalOnlyScript?.privateInputPreflightChecks?.birefnetExplicitModelPathProvided === true, 'explicit_birefnet_metadata_missing')
  assert(report.inputs?.sam2CheckpointLocalPath?.endsWith('sam2.1_hiera_tiny.pt'), 'explicit_inputs_missing_sam2_checkpoint')
  assert(report.inputs?.birefnetModelLocalPath?.endsWith('ZhengPeng7/BiRefNet'), 'explicit_inputs_missing_birefnet_model')
  const generatedScriptPath = report.nativeCudaCloseoutLocalOnlyScript?.path
  assert(typeof generatedScriptPath === 'string', 'explicit_closeout_script_path_missing')
  if (typeof generatedScriptPath === 'string') {
    const generatedScriptText = read(generatedScriptPath)
    assert(generatedScriptText.includes('REEDITPRO_AI_GRAPHICS_SAM2_CHECKPOINT'), 'explicit_script_missing_sam2_env')
    assert(generatedScriptText.includes('REEDITPRO_AI_GRAPHICS_BIREFNET_MODEL'), 'explicit_script_missing_birefnet_env')
    assert(generatedScriptText.includes('SAM2_CHECKPOINT='), 'explicit_script_missing_sam2_assignment')
    assert(generatedScriptText.includes('BIREFNET_MODEL='), 'explicit_script_missing_birefnet_assignment')
    assert(generatedScriptText.includes('MODEL_PATH_ARGS+=(--sam2-checkpoint "$SAM2_CHECKPOINT")'), 'explicit_script_missing_sam2_arg_append')
    assert(generatedScriptText.includes('MODEL_PATH_ARGS+=(--birefnet-model "$BIREFNET_MODEL")'), 'explicit_script_missing_birefnet_arg_append')
    assert(generatedScriptText.includes('"${MODEL_PATH_ARGS[@]}"'), 'explicit_script_missing_model_arg_forwarding')
  }
  for (const toolId of targetTools) {
    const row = report.tools?.find((tool) => tool.toolId === toolId)
    assert(Boolean(row), `explicit_missing_tool_row:${toolId}`)
    assert(row?.privateModelRootCandidatePresent === true, `explicit_model_candidate_missing:${toolId}`)
    assert(row?.privateModelRootBlocker === null, `explicit_model_blocker_unexpected:${toolId}:${row?.privateModelRootBlocker}`)
    assert(row?.explicitModelPathProvided === true, `explicit_path_not_recorded:${toolId}`)
    assert(row?.explicitModelPathAccepted === true, `explicit_path_not_accepted:${toolId}`)
    assert(row?.modelPathSource === 'explicit_path', `explicit_model_path_source_unexpected:${toolId}:${row?.modelPathSource}`)
    assert(row?.modelWeightManifestReviewAccepted === true, `explicit_manifest_review_not_accepted:${toolId}`)
    assert(row?.sourceImageAccepted === true, `explicit_source_not_accepted:${toolId}`)
    const command = String(row?.manifestMaterializerCommand ?? '')
    if (toolId === 'sam2') {
      assert(command.includes('--sam2-checkpoint'), 'explicit_manifest_missing_sam2_flag')
      assert(command.includes('sam2.1_hiera_tiny.pt'), 'explicit_manifest_missing_sam2_path')
    } else {
      assert(command.includes('--birefnet-model'), 'explicit_manifest_missing_birefnet_flag')
      assert(command.includes('ZhengPeng7/BiRefNet'), 'explicit_manifest_missing_birefnet_path')
    }
  }
}

function validateInvalidSourceReport(report) {
  assert(report.status === runtimeBuckets[0], `invalid_source_report_not_blocked:${report.status}`)
  assert(report.counts?.runtimeAttemptsPerformed === 0, 'invalid_source_attempt_performed')
  assert(report.booleans?.runtimeAttemptRequested === true, 'invalid_source_runtime_attempt_not_requested')
  assert(report.booleans?.runtimeAttemptPerformed === false, 'invalid_source_runtime_attempt_performed')
  assert(report.booleans?.gpuRuntimePerformed === false, 'invalid_source_gpu_runtime_performed')
  for (const toolId of targetTools) {
    const row = report.tools?.find((tool) => tool.toolId === toolId)
    assert(Boolean(row), `invalid_source_missing_tool_row:${toolId}`)
    assert(row?.sourceImageExists === true, `invalid_source_file_missing:${toolId}`)
    assert(row?.sourceImageAccepted === false, `invalid_source_accepted:${toolId}`)
    assert(String(row?.sourceImageBlocker ?? '').includes('must be PNG, JPEG, WebP, or PPM'), `invalid_source_blocker_missing:${toolId}:${row?.sourceImageBlocker}`)
    assert(row?.runtimeAttemptPerformed === false, `invalid_source_tool_runtime_attempted:${toolId}`)
    assert(row?.executionState === 'blocked_with_reason', `invalid_source_tool_state_unexpected:${toolId}:${row?.executionState}`)
  }
}

function validateScopedTimeoutReport(report) {
  assert(report.status === runtimeBuckets[0], `scoped_timeout_report_not_blocked:${report.status}`)
  assert(report.toolsCovered === 1, `scoped_timeout_tools_covered_unexpected:${report.toolsCovered}`)
  assert(report.booleans?.allRemainingNativeCudaToolsCovered === false, 'scoped_timeout_all_remaining_covered_true')
  assert(report.booleans?.acceptedNativeCudaProofForAllRequestedTools === false, 'scoped_timeout_all_requested_proof_true')
  assert(report.booleans?.acceptedNativeCudaProofForAllRemainingTools === false, 'scoped_timeout_all_remaining_proof_true')
  assert(report.booleans?.agentCanExecuteAll21ToolsNow === false, 'scoped_timeout_all21_true')
  assert(report.booleans?.readinessRecheckUsesNativeCudaCloseoutResultRoot === false, 'scoped_timeout_result_root_used')
  assert(report.booleans?.readinessRecheckUsesScopedLocalRuntimeProofResults === true, 'scoped_timeout_scoped_readiness_not_used')
  assert(report.readinessResultHandoff?.mode === 'scoped_local_runtime_proof_results', `scoped_timeout_readiness_handoff_mode_unexpected:${report.readinessResultHandoff?.mode}`)
  assert(report.readinessResultHandoff?.usesScopedLocalRuntimeProofResults === true, 'scoped_timeout_scoped_handoff_false')
  assert(report.readinessResultHandoff?.nativeCudaCloseoutResultRoot === null, 'scoped_timeout_result_root_not_null')
  assert(String(report.all21ReadinessRecheckCommand ?? '').includes('--local-runtime-proof-result'), 'scoped_timeout_readiness_missing_local_proof_flag')
  assert(String(report.all21ReadinessRecheckCommand ?? '').includes('sam2/harness-result.json'), 'scoped_timeout_readiness_missing_sam2_result')
  assert(!String(report.all21ReadinessRecheckCommand ?? '').includes('--native-cuda-closeout-result-root'), 'scoped_timeout_readiness_unexpected_result_root')
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
  assert(text.includes('ai-graphics:model-weight-manifest-review:validate'), 'manifest_review_validator_missing_from_cli')
  assert(text.includes('REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_MANIFEST_DIR'), 'manifest_dir_env_missing_from_cli')
  assert(text.includes('REEDITPRO_AI_GRAPHICS_SAM2_CHECKPOINT'), 'sam2_explicit_env_missing_from_cli')
  assert(text.includes('REEDITPRO_AI_GRAPHICS_BIREFNET_MODEL'), 'birefnet_explicit_env_missing_from_cli')
  assert(text.includes('--sam2-checkpoint'), 'sam2_explicit_flag_missing_from_cli')
  assert(text.includes('--birefnet-model'), 'birefnet_explicit_flag_missing_from_cli')
  assert(text.includes('MODEL_PATH_ARGS'), 'model_path_arg_forwarding_missing_from_cli')
  assert(text.includes('--model-weight-manifest-dir'), 'manifest_dir_flag_missing_from_cli')
  assert(text.includes('--script-out'), 'script_out_missing_from_cli')
  assert(text.includes('writeNativeCudaCloseoutScript'), 'script_writer_missing_from_cli')
  assert(text.includes('ai-graphics:gpu-runtime-proof-local-preflight'), 'host_preflight_script_missing_from_cli')

  const runtimeText = [
    read('server/workers/ai-graphics-runtime-script-runner.ts'),
    read('server/workers/masks/sam2-execution-runner.ts'),
    read('server/workers/masks/birefnet-execution-runner.ts'),
    read('docker/prod/birefnet-runtime/birefnet_local.py'),
  ].join('\n')
  assert(runtimeText.includes('requiredCudaDeviceNamePattern'), 'l4_device_pattern_proof_missing_from_runtime_runner')
  assert(runtimeText.includes("requiredCudaDeviceNamePattern: 'L4'"), 'l4_device_pattern_missing_from_native_tool_runners')
  assert(runtimeText.includes('NVIDIA L4 is required for controlled BiRefNet runtime verification'), 'birefnet_l4_runtime_guard_missing')
}

validatePackageSections(json('package.json'))
validateCommittedText()

const defaultReport = runNpmJson(runScriptName)
validateDefaultReport(defaultReport)

const fixtures = makeDiagnosticFixtures()
const fixtureReport = runNpmJson(runScriptName, [
  '--private-model-root',
  fixtures.modelRoot,
  '--model-weight-manifest-dir',
  fixtures.modelManifestDir,
  '--source-image',
  fixtures.sourceImage,
  '--output-root',
  fixtures.outputRoot,
  '--existing-proof-result',
  '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/external-agent-execution-local-private-proof/run-placeholder/adapter-proof/harness-result.json',
  '--cpu-safe-gpu-model-route-proof-packet',
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-safe-gpu-model-route-proof.json',
  '--cpu-model-gpu-model-route-proof-packet',
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-model-gpu-model-route-proof-next.json',
  '--script-out',
  fixtures.scriptOut,
])
validateFixtureReport(fixtureReport)

const explicitModelPathReport = runNpmJson(runScriptName, [
  '--private-model-root',
  fixtures.missingModelRoot,
  '--model-weight-manifest-dir',
  fixtures.modelManifestDir,
  '--sam2-checkpoint',
  fixtures.sam2Checkpoint,
  '--birefnet-model',
  fixtures.birefnetModel,
  '--source-image',
  fixtures.sourceImage,
  '--output-root',
  fixtures.explicitOutputRoot,
  '--existing-proof-result',
  '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/external-agent-execution-local-private-proof/run-placeholder/adapter-proof/harness-result.json',
  '--cpu-safe-gpu-model-route-proof-packet',
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-safe-gpu-model-route-proof.json',
  '--cpu-model-gpu-model-route-proof-packet',
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-model-gpu-model-route-proof-next.json',
  '--script-out',
  fixtures.explicitScriptOut,
])
validateExplicitModelPathReport(explicitModelPathReport)

const invalidSourceReport = runNpmJson(runScriptName, [
  '--private-model-root',
  fixtures.modelRoot,
  '--model-weight-manifest-dir',
  fixtures.modelManifestDir,
  '--source-image',
  fixtures.invalidSourceImage,
  '--output-root',
  fixtures.outputRoot,
  '--attempt-local-runtime',
])
validateInvalidSourceReport(invalidSourceReport)

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
  explicitModelPathStatus: explicitModelPathReport.status,
  invalidSourceStatus: invalidSourceReport.status,
  defaultCounts: defaultReport.counts,
  fixtureCounts: fixtureReport.counts,
  explicitModelPathCounts: explicitModelPathReport.counts,
  invalidSourceCounts: invalidSourceReport.counts,
  packageLockUnchanged: packageLockDiff.length === 0,
  trackedLocalArtifacts: trackedLocalArtifacts.length === 0,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
