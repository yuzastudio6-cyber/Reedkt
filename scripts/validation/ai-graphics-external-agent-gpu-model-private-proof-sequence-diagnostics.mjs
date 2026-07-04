import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_private_proof_sequence_prepared_with_runtime_blocks'
const status =
  'gpu_model_private_proof_sequence_ready_kornia_first_blocked_until_scoped_private_runtime_proof'
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

const runtimeContainerTargetByTool = {
  torch_torchvision: {
    image: 'reeditpro/ai-graphics-gpu-worker:proof-local',
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  transformers: {
    image: 'reeditpro/ai-graphics-gpu-worker:proof-local',
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  sam2: {
    image: 'reeditpro/ai-graphics-sam2-runtime:proof-local',
    dockerfile: 'docker/prod/sam2-runtime/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  birefnet: {
    image: 'reeditpro/ai-graphics-birefnet-runtime:proof-local',
    dockerfile: 'docker/prod/birefnet-runtime/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  real_esrgan: {
    image: 'reeditpro/ai-graphics-real-esrgan-runtime:proof-local',
    dockerfile: 'docker/prod/real-esrgan-runtime/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  kornia: {
    image: 'reeditpro/ai-graphics-gpu-worker:proof-local',
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  rembg: {
    image: 'reeditpro/ai-graphics-gpu-worker:proof-local',
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
  transparent_background: {
    image: 'reeditpro/ai-graphics-gpu-worker:proof-local',
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    target: 'ai_graphics_install_proof',
  },
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
  /finalExternalAgentSingleToolCallAttempted["`:\s=]+true/i,
  /finalExternalAgentSingleToolCallExecutable["`:\s=]+true/i,
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
  'ai-graphics:external-agent-tool-call',
  '--local-runtime-proof-result',
  '--detect-host',
  '--require-host-eligible',
  '--require-accepted-proof',
  '--runtime-input-manifest',
  '--allow-cpu-tensor-runtime',
  'manifestBooleanForTool',
  'readRuntimeInputManifest',
  'manifestStringForTool',
  '--expect-state',
  '--require-output-hash',
  '--require-private-only-boundary',
  '--strict-exit-code',
  'outputJsonSha256',
  'korniaFirstPrivateProofSequenceCommand',
  'finalExternalAgentToolCallCommand',
  'finalExternalAgentToolCallArgs',
  'finalExternalAgentToolCallCommandForTool',
  'finalExternalAgentToolCallCommandsByTool',
  'finalExternalAgentSingleToolCall',
  'privateContainerProofSequenceCommandsByTool',
  'privateHostProofSequenceCommandsByTool',
  'privateContainerProofSequenceManifestCommandsByTool',
  'privateHostProofSequenceManifestCommandsByTool',
  'korniaFirstPrivateProofSequenceManifestCommand',
  'defaultKorniaCpuTensorHarnessCommand',
  'korniaCpuTensorRuntimeAllowedWhenExplicitlyRequested',
  'korniaCpuTensorRuntimeDoesNotStartGpu',
  'sequenceCommandForTool',
  'sequenceManifestCommandForTool',
  'allGpuModelToolsHaveExactPrivateProofSequenceCommand',
  'allGpuModelToolsHaveExactContainerPrivateProofSequenceCommand',
  '--write-records cannot be combined with --attempt-local-runtime',
  '--write-records cannot be combined with --runtime-input-manifest',
  '--write-records cannot be combined with --detect-host',
  '--runtime-input-manifest must stay under .local-artifacts/',
  '--result-out must stay under .local-artifacts/',
  'currentHostGpuProofPreflight',
  'currentHostProofPreflight',
  'hostEligibleForRequestedProof',
  'hostEligibilityGateUsesRequestedProofMode',
  'nativeGpuHostEligibilityRequired',
  'cpuHostEligibilityCanSatisfyRequestedProof',
  'hostEligibilityGateSupported',
  'noIdleGpuRuntimeApproved',
  'proofBridgeRequiresOutputJsonSha256Match',
  'finalExternalAgentSingleToolCallProofRunsAfterAcceptedPrivateProof',
  'finalExternalAgentSingleToolCallRequiresExecutableState',
  'allGpuModelToolsHaveExactFinalExternalAgentSingleToolCallCommand',
  'allGpuModelToolsHaveExactContainerFinalExternalAgentSingleToolCallCommand',
  'allGpuModelToolsHaveExactHostFinalExternalAgentSingleToolCallCommand',
  'gpuModelRuntimeContainerTargets',
  'gpuModelRuntimeContainerImage',
  'gpuModelRuntimeContainerBuildCommand',
  'gpuModelRuntimeContainerBuildCommandsByTool',
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
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceCommand ?? '').includes('--runtime-backend docker_container')) {
    fail(`${label}_kornia_sequence_missing_container_backend`)
  }
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceCommand ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
    fail(`${label}_kornia_sequence_missing_canonical_container_image`)
  }
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceCommand ?? '').includes('--runtime-container-platform linux/amd64')) {
    fail(`${label}_kornia_sequence_missing_container_platform`)
  }
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceCommand ?? '').includes('--source-image <private-approved-frame.png>')) {
    fail(`${label}_kornia_sequence_missing_private_source_image`)
  }
  if (!String(report.interfaces?.korniaFirstPrivateProofSequenceManifestCommand ?? '').includes('--runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/runtime-inputs.json')) {
    fail(`${label}_kornia_manifest_sequence_missing_private_manifest`)
  }
  const perToolCommands =
    report.interfaces?.privateContainerProofSequenceCommandsByTool ?? {}
  const hostPerToolCommands =
    report.interfaces?.privateHostProofSequenceCommandsByTool ?? {}
  const perToolManifestCommands =
    report.interfaces?.privateContainerProofSequenceManifestCommandsByTool ?? {}
  const hostPerToolManifestCommands =
    report.interfaces?.privateHostProofSequenceManifestCommandsByTool ?? {}
  const finalContainerCommands =
    report.interfaces?.finalExternalAgentSingleToolCallContainerCommandsByTool ?? {}
  const finalHostCommands =
    report.interfaces?.finalExternalAgentSingleToolCallHostCommandsByTool ?? {}
  for (const tool of gpuModelTools) {
    const expectedRuntimeTarget = runtimeContainerTargetByTool[tool]
    const expectedRuntimeImage = expectedRuntimeTarget.image
    const command = String(perToolCommands[tool] ?? '')
    const hostCommand = String(hostPerToolCommands[tool] ?? '')
    const manifestCommand = String(perToolManifestCommands[tool] ?? '')
    const hostManifestCommand = String(hostPerToolManifestCommands[tool] ?? '')
    const finalContainerCommand = String(finalContainerCommands[tool] ?? '')
    const finalHostCommand = String(finalHostCommands[tool] ?? '')
    const buildCommand = String(
      report.interfaces?.gpuModelRuntimeContainerBuildCommandsByTool?.[tool] ?? '',
    )
    if (!command) fail(`${label}_missing_container_private_proof_sequence_command:${tool}`)
    if (!hostCommand) fail(`${label}_missing_host_private_proof_sequence_command:${tool}`)
    if (!manifestCommand) fail(`${label}_missing_container_private_manifest_proof_sequence_command:${tool}`)
    if (!hostManifestCommand) fail(`${label}_missing_host_private_manifest_proof_sequence_command:${tool}`)
    if (!finalContainerCommand) fail(`${label}_missing_container_final_single_tool_call_command:${tool}`)
    if (!finalHostCommand) fail(`${label}_missing_host_final_single_tool_call_command:${tool}`)
    if (!buildCommand) fail(`${label}_missing_runtime_container_build_command:${tool}`)
    for (const fragment of [
      'docker buildx build --platform linux/amd64',
      `--target ${expectedRuntimeTarget.target}`,
      `-f ${expectedRuntimeTarget.dockerfile}`,
      `-t ${expectedRuntimeTarget.image}`,
    ]) {
      if (!buildCommand.includes(fragment)) {
        fail(`${label}_runtime_container_build_command_missing:${tool}:${fragment}`)
      }
    }
    if (!command.includes('--attempt-local-runtime')) {
      fail(`${label}_container_private_proof_sequence_missing_attempt_runtime:${tool}`)
    }
    if (!hostCommand.includes('--attempt-local-runtime')) {
      fail(`${label}_host_private_proof_sequence_missing_attempt_runtime:${tool}`)
    }
    if (!manifestCommand.includes('--attempt-local-runtime')) {
      fail(`${label}_container_private_manifest_proof_sequence_missing_attempt_runtime:${tool}`)
    }
    if (!hostManifestCommand.includes('--attempt-local-runtime')) {
      fail(`${label}_host_private_manifest_proof_sequence_missing_attempt_runtime:${tool}`)
    }
    if (!command.includes('--runtime-backend docker_container')) {
      fail(`${label}_container_private_proof_sequence_missing_backend:${tool}`)
    }
    if (!command.includes(expectedRuntimeImage)) {
      fail(`${label}_container_private_proof_sequence_missing_runtime_image:${tool}:${expectedRuntimeImage}`)
    }
    if (!command.includes('--runtime-container-platform linux/amd64')) {
      fail(`${label}_container_private_proof_sequence_missing_platform:${tool}`)
    }
    if (!manifestCommand.includes(expectedRuntimeImage)) {
      fail(`${label}_container_private_manifest_proof_sequence_missing_runtime_image:${tool}:${expectedRuntimeImage}`)
    }
    if (hostCommand.includes('--runtime-backend docker_container')) {
      fail(`${label}_host_private_proof_sequence_unexpected_container_backend:${tool}`)
    }
    for (const runtimeTarget of Object.values(runtimeContainerTargetByTool)) {
      if (hostCommand.includes(runtimeTarget.image)) {
        fail(`${label}_host_private_proof_sequence_unexpected_container_image:${tool}:${runtimeTarget.image}`)
      }
      if (hostManifestCommand.includes(runtimeTarget.image)) {
        fail(`${label}_host_private_manifest_proof_sequence_unexpected_container_image:${tool}:${runtimeTarget.image}`)
      }
    }
    for (const fragment of [
      'ai-graphics:external-agent-tool-call',
      `--tool ${tool}`,
      '--attempt-gpu-runtime',
      '--expect-state executable',
      '--require-output-hash',
      '--require-private-only-boundary',
      '--strict-exit-code',
      '--runtime-backend docker_container',
      expectedRuntimeImage,
      '--runtime-container-platform linux/amd64',
      `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>/external-agent-single-tool-call/${tool}`,
      `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>/external-agent-single-tool-call-result.json`,
    ]) {
      if (!finalContainerCommand.includes(fragment)) {
        fail(`${label}_container_final_single_tool_call_missing:${tool}:${fragment}`)
      }
    }
    for (const fragment of [
      'ai-graphics:external-agent-tool-call',
      `--tool ${tool}`,
      '--attempt-gpu-runtime',
      '--expect-state executable',
      '--require-output-hash',
      '--require-private-only-boundary',
      '--strict-exit-code',
      '--runtime-backend host_python',
      `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>/external-agent-single-tool-call/${tool}`,
      `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>/external-agent-single-tool-call-result.json`,
    ]) {
      if (!finalHostCommand.includes(fragment)) {
        fail(`${label}_host_final_single_tool_call_missing:${tool}:${fragment}`)
      }
    }
    if (finalHostCommand.includes('--runtime-backend docker_container')) {
      fail(`${label}_host_final_single_tool_call_unexpected_container_backend:${tool}`)
    }
    for (const runtimeTarget of Object.values(runtimeContainerTargetByTool)) {
      if (finalHostCommand.includes(runtimeTarget.image)) {
        fail(`${label}_host_final_single_tool_call_unexpected_container_image:${tool}:${runtimeTarget.image}`)
      }
    }
    if (!command.includes(`--tool ${tool}`)) {
      fail(`${label}_container_private_proof_sequence_missing_tool:${tool}`)
    }
    if (!hostCommand.includes(`--tool ${tool}`)) {
      fail(`${label}_host_private_proof_sequence_missing_tool:${tool}`)
    }
    if (!manifestCommand.includes(`--tool ${tool}`)) {
      fail(`${label}_container_private_manifest_proof_sequence_missing_tool:${tool}`)
    }
    if (!hostManifestCommand.includes(`--tool ${tool}`)) {
      fail(`${label}_host_private_manifest_proof_sequence_missing_tool:${tool}`)
    }
    if (!manifestCommand.includes(`--runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>/runtime-inputs.json`)) {
      fail(`${label}_container_private_manifest_proof_sequence_missing_manifest:${tool}`)
    }
    if (!hostManifestCommand.includes(`--runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>/runtime-inputs.json`)) {
      fail(`${label}_host_private_manifest_proof_sequence_missing_manifest:${tool}`)
    }
    if (!command.includes(`.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>`)) {
      fail(`${label}_container_private_proof_sequence_missing_local_output_dir:${tool}`)
    }
    if (!hostCommand.includes(`.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${tool}>`)) {
      fail(`${label}_host_private_proof_sequence_missing_local_output_dir:${tool}`)
    }
    if (!command.includes('--detect-host')) {
      fail(`${label}_container_private_proof_sequence_missing_detect_host:${tool}`)
    }
    if (!hostCommand.includes('--detect-host')) {
      fail(`${label}_host_private_proof_sequence_missing_detect_host:${tool}`)
    }
    if (!command.includes('--require-host-eligible')) {
      fail(`${label}_container_private_proof_sequence_missing_host_gate:${tool}`)
    }
    if (!hostCommand.includes('--require-host-eligible')) {
      fail(`${label}_host_private_proof_sequence_missing_host_gate:${tool}`)
    }
    if (!command.includes('--require-accepted-proof')) {
      fail(`${label}_container_private_proof_sequence_missing_accepted_proof_gate:${tool}`)
    }
    if (!hostCommand.includes('--require-accepted-proof')) {
      fail(`${label}_host_private_proof_sequence_missing_accepted_proof_gate:${tool}`)
    }
    if (sourceImageRequiredTools.has(tool)) {
      if (!command.includes('--source-image <private-approved-frame.png>')) {
        fail(`${label}_container_private_proof_sequence_missing_source_image:${tool}`)
      }
      if (!hostCommand.includes('--source-image <private-approved-frame.png>')) {
        fail(`${label}_host_private_proof_sequence_missing_source_image:${tool}`)
      }
      if (!finalContainerCommand.includes('--source-image <private-approved-frame.png>')) {
        fail(`${label}_container_final_single_tool_call_missing_source_image:${tool}`)
      }
      if (!finalHostCommand.includes('--source-image <private-approved-frame.png>')) {
        fail(`${label}_host_final_single_tool_call_missing_source_image:${tool}`)
      }
    } else if (command.includes('--source-image')) {
      fail(`${label}_container_private_proof_sequence_unnecessary_source_image:${tool}`)
    } else if (hostCommand.includes('--source-image')) {
      fail(`${label}_host_private_proof_sequence_unnecessary_source_image:${tool}`)
    } else if (finalContainerCommand.includes('--source-image')) {
      fail(`${label}_container_final_single_tool_call_unnecessary_source_image:${tool}`)
    } else if (finalHostCommand.includes('--source-image')) {
      fail(`${label}_host_final_single_tool_call_unnecessary_source_image:${tool}`)
    }
    const toolSpecificFlag = toolSpecificPrivateProofFlagByTool[tool]
    if (toolSpecificFlag && !command.includes(toolSpecificFlag)) {
      fail(`${label}_container_private_proof_sequence_missing_tool_specific_flag:${tool}`)
    }
    if (toolSpecificFlag && !hostCommand.includes(toolSpecificFlag)) {
      fail(`${label}_host_private_proof_sequence_missing_tool_specific_flag:${tool}`)
    }
    if (toolSpecificFlag && !finalContainerCommand.includes(toolSpecificFlag)) {
      fail(`${label}_container_final_single_tool_call_missing_tool_specific_flag:${tool}`)
    }
    if (toolSpecificFlag && !finalHostCommand.includes(toolSpecificFlag)) {
      fail(`${label}_host_final_single_tool_call_missing_tool_specific_flag:${tool}`)
    }
  }
  if (!String(report.interfaces?.defaultKorniaHarnessCommand ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
    fail(`${label}_default_kornia_harness_missing_canonical_image`)
  }
  if (report.sequencePolicy?.proofBridgeRequiresOutputJsonSha256Match !== true) {
    fail(`${label}_sha256_policy_not_true`)
  }
  if (
    report.sequencePolicy?.finalExternalAgentSingleToolCallProofRunsAfterAcceptedPrivateProof !==
    true
  ) {
    fail(`${label}_final_single_tool_call_policy_not_true`)
  }
  if (
    report.sequencePolicy?.finalExternalAgentSingleToolCallRequiresExecutableState !==
    true
  ) {
    fail(`${label}_final_single_tool_call_executable_policy_not_true`)
  }
  if (report.sequencePolicy?.noIdleGpuRuntimeApproved !== true) {
    fail(`${label}_no_idle_gpu_policy_not_true`)
  }
  if (report.sequencePolicy?.privateRuntimeInputManifestSupported !== true) {
    fail(`${label}_private_manifest_policy_not_true`)
  }
  if (report.sequencePolicy?.privateRuntimeInputManifestUsedNow !== false) {
    fail(`${label}_private_manifest_used_in_default_record`)
  }
  if (report.sequencePolicy?.privateRuntimeInputManifestMustStayUnderLocalArtifacts !== true) {
    fail(`${label}_private_manifest_local_artifact_policy_not_true`)
  }
  if (report.sequencePolicy?.privateRuntimeInputManifestRejectedForWriteRecords !== true) {
    fail(`${label}_private_manifest_write_records_rejection_policy_not_true`)
  }
  if (report.sequencePolicy?.noPublicArtifacts !== true) {
    fail(`${label}_public_artifact_policy_not_true`)
  }
  if (report.sequencePolicy?.noSignedUrls !== true) {
    fail(`${label}_signed_url_policy_not_true`)
  }
  for (const key of [
    'hostEligibilityGateSupported',
    'hostEligibilityGateUsesRequestedProofMode',
    'requireHostEligibleFlagSupported',
    'requireAcceptedProofFlagSupported',
    'allGpuModelToolsHaveExactPrivateProofSequenceCommand',
    'allGpuModelToolsHaveExactContainerPrivateProofSequenceCommand',
    'allGpuModelToolsHaveExactHostPrivateProofSequenceCommand',
    'perToolPrivateProofSequenceCommandsPrepared',
    'perToolContainerPrivateProofSequenceCommandsPrepared',
    'perToolHostPrivateProofSequenceCommandsPrepared',
    'allGpuModelToolsHaveExactFinalExternalAgentSingleToolCallCommand',
    'allGpuModelToolsHaveExactContainerFinalExternalAgentSingleToolCallCommand',
    'allGpuModelToolsHaveExactHostFinalExternalAgentSingleToolCallCommand',
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
    currentRequestedProofHostBlockers: 0,
    finalExternalAgentSingleToolCallsExecuted: 0,
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
    'privateRuntimeInputManifestSupported',
    'agentCanExecute13NonGpuControlledToolsNow',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuRuntimeStartedOnlyDuringScopedAttempt',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'localRuntimeAttemptRequested',
    'privateRuntimeInputManifestUsedNow',
    'localRuntimeExecutedForRequestedTool',
    'acceptedPrivateProofForRequestedTool',
    'finalExternalAgentSingleToolCallAttempted',
    'finalExternalAgentSingleToolCallExecutable',
    'hostPreflightRequested',
    'hostEligibleForNativeGpuProof',
    'hostEligibleForRequestedProof',
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
  const finalCall = requested.finalExternalAgentSingleToolCall ?? {}
  if (finalCall.status !== 'not_run_until_private_proof_is_accepted') {
    fail(`${label}_final_single_tool_call_status_mismatch:${finalCall.status}`)
  }
  if (finalCall.executionState !== null) {
    fail(`${label}_final_single_tool_call_execution_state_not_null`)
  }
  if (finalCall.executable !== false) {
    fail(`${label}_final_single_tool_call_executable_not_false`)
  }
  if (finalCall.outputSource !== null || finalCall.outputSha256 !== null || finalCall.outputJsonPath !== null) {
    fail(`${label}_final_single_tool_call_output_not_null`)
  }
  if (finalCall.gpuRuntimeShouldStartNow !== false) {
    fail(`${label}_final_single_tool_call_gpu_start_not_false`)
  }
  if (finalCall.publicArtifactCreated !== false || finalCall.signedUrlCreated !== false) {
    fail(`${label}_final_single_tool_call_public_boundary_not_false`)
  }
  const finalCommand = String(report.interfaces?.finalExternalAgentSingleToolCallCommand ?? '')
  for (const fragment of [
    'ai-graphics:external-agent-tool-call',
    '--tool kornia',
    '--attempt-gpu-runtime',
    '--runtime-backend docker_container',
    'reeditpro/ai-graphics-gpu-worker:proof-local',
    '--runtime-container-platform linux/amd64',
    '--gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call/kornia',
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call-result.json',
    '--source-image <private-approved-frame.png>',
    '--expect-state executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
  ]) {
    if (!finalCommand.includes(fragment)) {
      fail(`${label}_final_single_tool_call_command_missing:${fragment}`)
    }
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
  if (report.currentHostProofPreflight?.requested !== false) {
    fail(`${label}_default_requested_host_preflight_requested_not_false`)
  }
  if (report.currentHostProofPreflight?.requestedProofMode !== 'native_gpu') {
    fail(`${label}_default_requested_proof_mode_mismatch:${report.currentHostProofPreflight?.requestedProofMode}`)
  }
  if (report.currentHostProofPreflight?.nativeGpuHostEligibilityRequired !== true) {
    fail(`${label}_default_requested_native_gpu_required_not_true`)
  }
  if (report.currentHostProofPreflight?.hostEligibleForRequestedProof !== false) {
    fail(`${label}_default_requested_proof_eligible_not_false`)
  }
  if (!Array.isArray(report.currentHostProofPreflight?.requestedProofBlockers)) {
    fail(`${label}_default_requested_proof_blockers_not_array`)
  } else if (report.currentHostProofPreflight.requestedProofBlockers.length !== 0) {
    fail(`${label}_default_requested_proof_blockers_not_empty`)
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
  if (detected.currentHostProofPreflight?.requested !== true) {
    fail('detect_host_requested_proof_preflight_not_true')
  }
  if (detected.currentHostProofPreflight?.requestedProofMode !== 'native_gpu') {
    fail(`detect_host_requested_proof_mode_mismatch:${detected.currentHostProofPreflight?.requestedProofMode}`)
  }
  if (detected.currentHostProofPreflight?.nativeGpuHostEligibilityRequired !== true) {
    fail('detect_host_requested_native_gpu_required_not_true')
  }
  if (
    detected.currentHostProofPreflight?.hostEligibleForRequestedProof !==
    detected.currentHostGpuProofPreflight?.hostEligibleForNativeGpuProof
  ) {
    fail('detect_host_requested_proof_eligibility_not_native_eligibility')
  }
  if (
    detected.booleans?.hostEligibleForRequestedProof !==
    detected.currentHostProofPreflight?.hostEligibleForRequestedProof
  ) {
    fail('detect_host_requested_proof_boolean_mismatch')
  }
  if (
    detected.counts?.currentRequestedProofHostBlockers !==
    detected.currentHostProofPreflight?.requestedProofBlockers?.length
  ) {
    fail('detect_host_requested_proof_blocker_count_mismatch')
  }
  if (detected.currentHostGpuProofPreflight?.hostEligibleForNativeGpuProof !== true) {
    const requiredHost = runScriptStatus(['--require-host-eligible'])
    if (requiredHost.status !== 2) {
      fail(`require_host_eligible_exit_status_mismatch:${requiredHost.status}`)
    }
  }
}

const cpuFoundationRequiredHost = runScriptStatus([
  '--attempt-local-runtime',
  '--runtime-backend',
  'host_python',
  '--allow-cpu-foundation-runtime',
  '--tool',
  'torch_torchvision',
  '--output-dir',
  '.local-artifacts/ai-graphics/gpu-model-private-proof-sequence-diagnostic/cpu-foundation',
  '--detect-host',
  '--require-host-eligible',
])
let cpuFoundationReport = null
try {
  cpuFoundationReport = JSON.parse(cpuFoundationRequiredHost.stdout)
} catch (error) {
  fail(`cpu_foundation_required_host_json_parse_failed:${error.message}`)
}
if (cpuFoundationReport) {
  if (cpuFoundationReport.currentHostProofPreflight?.requestedProofMode !== 'cpu_foundation') {
    fail(`cpu_foundation_requested_proof_mode_mismatch:${cpuFoundationReport.currentHostProofPreflight?.requestedProofMode}`)
  }
  if (cpuFoundationReport.currentHostProofPreflight?.nativeGpuHostEligibilityRequired !== false) {
    fail('cpu_foundation_native_gpu_required_not_false')
  }
  if (cpuFoundationReport.booleans?.nativeGpuHostEligibilityRequired !== false) {
    fail('cpu_foundation_native_gpu_boolean_not_false')
  }
  if (!Array.isArray(cpuFoundationReport.currentHostProofPreflight?.requestedProofBlockers)) {
    fail('cpu_foundation_requested_proof_blockers_not_array')
  }
  if (
    cpuFoundationReport.currentHostProofPreflight?.hostEligibleForRequestedProof !==
    cpuFoundationReport.booleans?.hostEligibleForRequestedProof
  ) {
    fail('cpu_foundation_requested_proof_boolean_mismatch')
  }
  if (
    cpuFoundationReport.currentHostProofPreflight?.hostEligibleForRequestedProof === false &&
    !String(cpuFoundationReport.nextExactAction ?? '').includes('local Python CPU runtime')
  ) {
    fail('cpu_foundation_missing_cpu_next_action')
  }
  if (cpuFoundationReport.requestedToolResult?.harness?.skipReasonCode === 'gpu_model_native_cuda_runtime_missing') {
    fail('cpu_foundation_wrongly_blocked_on_native_cuda')
  }
  if (cpuFoundationReport.requestedToolResult?.harness?.skipReasonCode === 'gpu_model_runtime_container_gpu_unavailable') {
    fail('cpu_foundation_wrongly_blocked_on_container_gpu')
  }
}

const requiredAcceptedProof = runScriptStatus(['--require-accepted-proof'])
if (requiredAcceptedProof.status !== 2) {
  fail(`require_accepted_proof_exit_status_mismatch:${requiredAcceptedProof.status}`)
}

const runtimeManifestDir =
  '.local-artifacts/ai-graphics/gpu-model-private-proof-sequence-diagnostic/manifest'
const runtimeManifestPath = `${runtimeManifestDir}/runtime-inputs.json`
fs.mkdirSync(absolute(runtimeManifestDir), { recursive: true })
fs.writeFileSync(absolute(runtimeManifestPath), JSON.stringify({
  outputDirectory: `${runtimeManifestDir}/kornia-output`,
  toolInputs: {
    kornia: {
      sourceImageLocalPath: '/tmp/reeditpro-missing-private-approved-frame.png',
    },
  },
}, null, 2))
let manifestRun = null
try {
  manifestRun = runJsonScript([
    '--attempt-local-runtime',
    '--tool',
    'kornia',
    '--runtime-input-manifest',
    runtimeManifestPath,
  ])
} catch (error) {
  fail(`runtime_manifest_sequence_run_failed:${error.message}`)
}
if (manifestRun) {
  if (manifestRun.booleans?.privateRuntimeInputManifestUsedNow !== true) {
    fail('runtime_manifest_sequence_manifest_used_not_true')
  }
  if (manifestRun.booleans?.localRuntimeExecutedForRequestedTool !== false) {
    fail('runtime_manifest_sequence_executed_without_private_frame')
  }
  if (manifestRun.booleans?.finalExternalAgentSingleToolCallAttempted !== false) {
    fail('runtime_manifest_sequence_final_call_attempted_without_private_proof')
  }
  if (manifestRun.requestedToolResult?.harness?.skipReasonCode !== 'kornia_source_frame_missing') {
    fail(`runtime_manifest_sequence_skip_reason_mismatch:${manifestRun.requestedToolResult?.harness?.skipReasonCode}`)
  }
  if (manifestRun.counts?.gpuRuntimeShouldStartNowTools !== 0) {
    fail('runtime_manifest_sequence_gpu_started')
  }
}

const invalidManifestPath = runScriptStatus([
  '--attempt-local-runtime',
  '--tool',
  'kornia',
  '--runtime-input-manifest',
  '/tmp/reeditpro-runtime-inputs.json',
])
if (invalidManifestPath.status === 0) {
  fail('invalid_runtime_manifest_path_unexpected_success')
}
if (!invalidManifestPath.stderr.includes('--runtime-input-manifest must stay under .local-artifacts/')) {
  fail('invalid_runtime_manifest_path_missing_diagnostic')
}

const unsupportedManifestFieldPath = `${runtimeManifestDir}/unsupported-field-runtime-inputs.json`
fs.writeFileSync(absolute(unsupportedManifestFieldPath), JSON.stringify({
  outputDirectory: `${runtimeManifestDir}/unsupported-field-output`,
  unexpectedProofField: 'typo',
  toolInputs: {
    kornia: {
      sourceImageLocalPath: '/tmp/reeditpro-missing-private-approved-frame.png',
    },
  },
}, null, 2))
const unsupportedManifestField = runScriptStatus([
  '--attempt-local-runtime',
  '--tool',
  'kornia',
  '--runtime-input-manifest',
  unsupportedManifestFieldPath,
])
if (unsupportedManifestField.status === 0) {
  fail('unsupported_runtime_manifest_field_unexpected_success')
}
if (!unsupportedManifestField.stderr.includes('runtime input manifest contains unsupported field unexpectedProofField')) {
  fail('unsupported_runtime_manifest_field_missing_diagnostic')
}

const unsupportedManifestToolPath = `${runtimeManifestDir}/unsupported-tool-runtime-inputs.json`
fs.writeFileSync(absolute(unsupportedManifestToolPath), JSON.stringify({
  outputDirectory: `${runtimeManifestDir}/unsupported-tool-output`,
  toolInputs: {
    not_an_ai_graphics_tool: {
      sourceImageLocalPath: '/tmp/reeditpro-missing-private-approved-frame.png',
    },
  },
}, null, 2))
const unsupportedManifestTool = runScriptStatus([
  '--attempt-local-runtime',
  '--tool',
  'kornia',
  '--runtime-input-manifest',
  unsupportedManifestToolPath,
])
if (unsupportedManifestTool.status === 0) {
  fail('unsupported_runtime_manifest_tool_unexpected_success')
}
if (!unsupportedManifestTool.stderr.includes('runtime input manifest references unsupported tool id not_an_ai_graphics_tool')) {
  fail('unsupported_runtime_manifest_tool_missing_diagnostic')
}

const uriManifestPath = `${runtimeManifestDir}/uri-runtime-inputs.json`
fs.writeFileSync(absolute(uriManifestPath), JSON.stringify({
  outputDirectory: `${runtimeManifestDir}/uri-output`,
  toolInputs: {
    kornia: {
      sourceImageLocalPath: 'private://approved-frame.png',
    },
  },
}, null, 2))
const uriManifest = runScriptStatus([
  '--attempt-local-runtime',
  '--tool',
  'kornia',
  '--runtime-input-manifest',
  uriManifestPath,
])
if (uriManifest.status === 0) {
  fail('uri_runtime_manifest_path_unexpected_success')
}
if (!uriManifest.stderr.includes('runtime input manifest field sourceImageLocalPath must be a private local path')) {
  fail('uri_runtime_manifest_path_missing_diagnostic')
}

const invalidChecksumManifestPath =
  `${runtimeManifestDir}/invalid-model-weight-checksum-runtime-inputs.json`
fs.writeFileSync(absolute(invalidChecksumManifestPath), JSON.stringify({
  toolInputs: {
    rembg: {
      outputDirectory: `${runtimeManifestDir}/invalid-checksum-output`,
      sourceImageLocalPath: '/tmp/reeditpro-missing-private-approved-frame.png',
      rembgModelLocalPath: '/tmp/reeditpro-private-rembg-model.onnx',
      modelWeightManifestId: 'rembg_private_manifest_review_v1',
      modelWeightChecksumSha256: 'not-a-sha256',
      modelWeightChecksumEvidenceRef:
        'private://reeditpro/ai-graphics/checksum-evidence/rembg.json',
    },
  },
}, null, 2))
const invalidChecksumManifest = runScriptStatus([
  '--attempt-local-runtime',
  '--tool',
  'rembg',
  '--runtime-input-manifest',
  invalidChecksumManifestPath,
])
if (invalidChecksumManifest.status === 0) {
  fail('invalid_checksum_runtime_manifest_unexpected_success')
}
if (!invalidChecksumManifest.stderr.includes('modelWeightChecksumSha256 must be a 64-character SHA-256 hex digest')) {
  fail('invalid_checksum_runtime_manifest_missing_diagnostic')
}

const publicEvidenceManifestPath =
  `${runtimeManifestDir}/public-model-weight-evidence-runtime-inputs.json`
fs.writeFileSync(absolute(publicEvidenceManifestPath), JSON.stringify({
  toolInputs: {
    rembg: {
      outputDirectory: `${runtimeManifestDir}/public-evidence-output`,
      sourceImageLocalPath: '/tmp/reeditpro-missing-private-approved-frame.png',
      rembgModelLocalPath: '/tmp/reeditpro-private-rembg-model.onnx',
      modelWeightManifestId: 'rembg_private_manifest_review_v1',
      modelWeightChecksumSha256: 'b'.repeat(64),
      modelWeightChecksumEvidenceRef:
        'https://signed.example.invalid/rembg/checksum.json?signature=abc',
    },
  },
}, null, 2))
const publicEvidenceManifest = runScriptStatus([
  '--attempt-local-runtime',
  '--tool',
  'rembg',
  '--runtime-input-manifest',
  publicEvidenceManifestPath,
])
if (publicEvidenceManifest.status === 0) {
  fail('public_evidence_runtime_manifest_unexpected_success')
}
if (!publicEvidenceManifest.stderr.includes('modelWeightChecksumEvidenceRef must be a reviewed private:// checksum evidence ref')) {
  fail('public_evidence_runtime_manifest_missing_diagnostic')
}

const writeRecordsWithManifest = runScriptStatus([
  '--write-records',
  '--runtime-input-manifest',
  runtimeManifestPath,
])
if (writeRecordsWithManifest.status === 0) {
  fail('write_records_with_runtime_manifest_unexpected_success')
}
if (!writeRecordsWithManifest.stderr.includes('--write-records cannot be combined with --runtime-input-manifest')) {
  fail('write_records_with_runtime_manifest_missing_diagnostic')
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
