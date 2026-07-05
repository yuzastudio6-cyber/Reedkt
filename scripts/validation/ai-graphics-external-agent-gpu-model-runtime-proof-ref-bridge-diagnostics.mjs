import childProcess from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks'
const status =
  'gpu_model_runtime_proof_ref_bridge_blocked_until_private_local_runtime_proof_is_supplied'
const acceptedStatus =
  'gpu_model_runtime_proof_ref_bridge_accepts_private_local_runtime_proof_for_scoped_route_submission'
const runScriptName =
  'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge-diagnostics.mjs'

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

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const scopedProofFixtureCases = [
  { toolId: 'sam2', capabilityId: 'subject_segmentation', proofMode: 'native_gpu', gpuShouldStartDuringScopedProof: true },
  { toolId: 'birefnet', capabilityId: 'background_removal', proofMode: 'native_gpu', gpuShouldStartDuringScopedProof: true },
  { toolId: 'real_esrgan', capabilityId: 'upscaling', proofMode: 'native_gpu', gpuShouldStartDuringScopedProof: true },
  { toolId: 'real_esrgan', capabilityId: 'upscaling', proofMode: 'cpu_model', gpuShouldStartDuringScopedProof: false },
  { toolId: 'kornia', capabilityId: 'tensor_image_ops', proofMode: 'cpu_tensor', gpuShouldStartDuringScopedProof: false },
  { toolId: 'rembg', capabilityId: 'background_removal', proofMode: 'native_gpu', gpuShouldStartDuringScopedProof: true },
  { toolId: 'rembg', capabilityId: 'background_removal', proofMode: 'cpu_model', gpuShouldStartDuringScopedProof: false },
  { toolId: 'transparent_background', capabilityId: 'background_removal', proofMode: 'native_gpu', gpuShouldStartDuringScopedProof: true },
]

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts',
  'scripts/validation/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
  'server/cli/ai-graphics-external-agent-gpu-model-local-dev-runtime-execution-harness.ts',
  'server/cli/ai-graphics-external-agent-gpu-model-proof-ref-route-caller.ts',
  'package.json',
]

const expectedCounts = {
  totalAiGraphicsTools: 21,
  gpuModelToolsCovered: 8,
  sourceLocalDevHarnessToolsCovered: 8,
  sourceProofRefRouteCallerToolsCovered: 8,
  privateLocalRuntimeProofResultSuppliedTools: 0,
  acceptedPrivateLocalRuntimeProofTools: 0,
  routeSubmissionReadyWithAcceptedPrivateProofTools: 0,
  blockedMissingPrivateLocalRuntimeProofResultTools: 8,
  blockedPrivateLocalRuntimeProofNotExecutedTools: 0,
  blockedPrivateLocalRuntimeOutputMissingTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  liveQueueWritePerformedTools: 0,
  workerDispatchPerformedTools: 0,
  toolExecutionPerformedByBridgeTools: 0,
  modelWeightsLoadedByBridgeTools: 0,
  publicArtifactCreatedByBridgeTools: 0,
  signedUrlCreatedByBridgeTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}

const trueBooleans = [
  'externalAgentGpuModelRuntimeProofRefBridgePrepared',
  'sourceLocalDevRuntimeExecutionHarnessAccepted',
  'sourceProofRefRouteCallerAccepted',
  'all8GpuModelToolsCoveredByBridge',
  'privateLocalRuntimeProofRequiredBeforeProofRefsAccepted',
  'exactPerToolPrivateProofEvidenceShapeEnforced',
  'committedRecordAcceptsZeroGpuModelRuntimeProofs',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForScopedAcceptedToolCall',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'routeSubmissionAllowedOnlyWithAcceptedPrivateProof',
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'routeExecutionPerformedInThisLane',
  'backendQueueSubmissionApprovedNow',
  'backendQueueSubmissionPerformed',
  'liveQueueWriteApprovedNow',
  'liveQueueWritePerformed',
  'workerExecutionApprovedNow',
  'workerExecutionPerformed',
  'workerDispatchApprovedNow',
  'workerDispatchPerformed',
  'toolExecutionApprovedNow',
  'toolExecutionPerformed',
  'providerRuntimeApprovedNow',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimeApprovedNow',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimeApprovedNow',
  'gpuRuntimePerformed',
  'gpuRuntimeShouldStartNow',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
]

const forbiddenPatterns = [
  /"agentCanExecuteGpuModelToolsNow"\s*:\s*true/i,
  /"agentCanExecuteAll21ToolsNow"\s*:\s*true/i,
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
  /"backendQueueSubmissionPerformed"\s*:\s*true/i,
  /"liveQueueWritePerformed"\s*:\s*true/i,
  /"workerExecutionPerformed"\s*:\s*true/i,
  /"workerDispatchPerformed"\s*:\s*true/i,
  /"toolExecutionPerformed"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"modelWeightsDownloaded"\s*:\s*true/i,
  /"modelWeightsLoaded"\s*:\s*true/i,
  /"modelInferencePerformed"\s*:\s*true/i,
  /"publicArtifactCreated"\s*:\s*true/i,
  /"signedUrlCreated"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
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
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
  })
}

function execFileJson(command, args) {
  return JSON.parse(childProcess.execFileSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
  }))
}

function privateOutputJsonForTool(toolId, tempDir, proofMode = 'native_gpu') {
  const p = (name) => path.join(tempDir, name)
  switch (toolId) {
    case 'sam2':
      return {
        ok: true,
        toolId: 'sam2',
        cudaAvailable: true,
        deviceName: 'NVIDIA L4',
        privateSourceFrame: {
          sourceImagePath: p('private-source-frame.png'),
          width: 512,
          height: 512,
          frameCount: 5,
          framePaths: [p('frame-000.png'), p('frame-001.png')],
          jpegFramePaths: [p('frame-000.jpg'), p('frame-001.jpg')],
        },
        prompt: {
          type: 'box',
          box: [168, 176, 336, 344],
          frameIndex: 0,
          objectId: 1,
        },
        masks: {
          maskPaths: [p('frame-000-mask.png')],
          overlayPaths: [p('frame-000-overlay.png')],
          perFrame: [{
            frameIndex: 0,
            nonZeroRatio: 0.42,
          }],
        },
        runtime: {
          modelId: 'sam2.1_hiera_tiny',
          configName: 'configs/sam2.1/sam2.1_hiera_t.yaml',
          externalModelDownloadAttempted: false,
          modelDownloadedExternally: false,
          providerRuntimePerformed: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
          privateSourceFrameUsed: true,
          realMediaUsed: false,
          broadRealMediaInputEnabled: false,
        },
      }
    case 'birefnet':
      return {
        ok: true,
        toolId: 'birefnet',
        cudaAvailable: true,
        deviceName: 'NVIDIA L4',
        runtime: {
          modelDownloadedExternally: false,
          providerRuntimePerformed: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
        fixture: {
          width: 512,
          height: 512,
          path: p('private-source-frame.png'),
          kind: 'real_video_frame',
        },
        mask: {
          width: 512,
          height: 512,
          nonZeroRatio: 0.54,
          meanAlpha: 0.48,
          minAlpha: 0,
          maxAlpha: 1,
          path: p('birefnet-mask.png'),
          cutoutPath: p('birefnet-cutout.png'),
        },
        warnings: [],
      }
    case 'real_esrgan':
      if (proofMode === 'cpu_model') {
        return {
          ok: true,
          toolId: 'real_esrgan',
          cudaAvailable: false,
          deviceName: 'cpu',
          enhanced: {
            width: 1024,
            height: 1024,
            scale: 4,
            path: p('real-esrgan-enhanced.png'),
            sizeBytes: 4096,
          },
          runtime: {
            modelName: 'RealESRGAN_x4plus',
            runtimeDevice: 'cpu',
            cpuModelRuntimeAllowed: true,
            tile: 64,
            faceEnhanceRan: false,
            gfpganImported: false,
            filmUsed: false,
            modelDownloadedExternally: false,
            providerRuntimePerformed: false,
            publicArtifactCreated: false,
            signedUrlCreated: false,
          },
          sourceFrame: {
            width: 512,
            height: 512,
            path: p('private-source-frame.png'),
            kind: 'approved_phase33d_frame',
          },
          sampleCrop: {
            x: 0,
            y: 0,
            width: 256,
            height: 256,
            path: p('real-esrgan-sample.png'),
          },
          warnings: [],
        }
      }
      return {
        ok: true,
        toolId: 'real_esrgan',
        cudaAvailable: true,
        deviceName: 'NVIDIA L4',
        enhanced: {
          width: 1024,
          height: 1024,
          scale: 4,
          path: p('real-esrgan-enhanced.png'),
          sizeBytes: 4096,
        },
        runtime: {
          modelName: 'RealESRGAN_x4plus',
          tile: 64,
          faceEnhanceRan: false,
          gfpganImported: false,
          filmUsed: false,
          modelDownloadedExternally: false,
          providerRuntimePerformed: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
        sourceFrame: {
          width: 512,
          height: 512,
          path: p('private-source-frame.png'),
          kind: 'approved_phase33d_frame',
        },
        sampleCrop: {
          x: 0,
          y: 0,
          width: 256,
          height: 256,
          path: p('real-esrgan-sample.png'),
        },
        warnings: [],
      }
    case 'kornia':
      return {
        ok: true,
        toolId: 'kornia',
        cudaAvailable: false,
        deviceType: 'cpu',
        cpuTensorRuntimeAllowed: true,
        runtime: {
          modelDownloadedExternally: false,
          providerRuntimePerformed: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
        mask: {
          path: p('private-kornia-mask.pgm'),
        },
        metrics: {
          gaussianKernel: 1,
        },
      }
    case 'rembg':
      if (proofMode === 'cpu_model') {
        return {
          ok: true,
          toolId: 'rembg',
          cudaExecutionProviderAvailable: false,
          runtime: {
            onnxRuntimeDevice: 'CPU',
            selectedProviders: ['CPUExecutionProvider'],
            availableProviders: ['CPUExecutionProvider'],
            cpuModelRuntimeAllowed: true,
            modelName: 'u2net',
            modelDownloadedExternally: false,
            providerRuntimePerformed: false,
            publicArtifactCreated: false,
            signedUrlCreated: false,
          },
          input: {
            path: p('private-source-frame.png'),
            width: 512,
            height: 512,
          },
          mask: {
            path: p('rembg-mask.png'),
            cutoutPath: p('rembg-cutout.png'),
            meanAlpha: 0.46,
            nonZeroRatio: 0.52,
          },
          warnings: [],
        }
      }
      return {
        ok: true,
        toolId: 'rembg',
        cudaExecutionProviderAvailable: true,
        runtime: {
          onnxRuntimeDevice: 'GPU',
          availableProviders: ['CUDAExecutionProvider', 'CPUExecutionProvider'],
          modelName: 'u2net',
          modelDownloadedExternally: false,
          providerRuntimePerformed: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
        input: {
          path: p('private-source-frame.png'),
          width: 512,
          height: 512,
        },
        mask: {
          path: p('rembg-mask.png'),
          cutoutPath: p('rembg-cutout.png'),
          meanAlpha: 0.46,
          nonZeroRatio: 0.52,
        },
        warnings: [],
      }
    case 'transparent_background':
      return {
        ok: true,
        toolId: 'transparent_background',
        cudaAvailable: true,
        deviceName: 'NVIDIA L4',
        runtime: {
          mode: 'base',
          checkpointPath: p('transparent-background-checkpoint.pth'),
          modelDownloadedExternally: false,
          providerRuntimePerformed: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
        input: {
          path: p('private-source-frame.png'),
          width: 512,
          height: 512,
        },
        mask: {
          path: p('transparent-background-mask.png'),
          cutoutPath: p('transparent-background-cutout.png'),
          meanAlpha: 0.43,
          nonZeroRatio: 0.5,
        },
        warnings: [],
      }
    default:
      throw new Error(`Unhandled scoped proof fixture tool: ${toolId}`)
  }
}

function createScopedPrivateProofFixture(caseDef) {
  const fixtureRoot = path.join(
    root,
    '.local-artifacts',
    'ai-graphics',
    'gpu-model-local-dev-runtime',
  )
  fs.mkdirSync(fixtureRoot, { recursive: true })
  const tempDir = fs.mkdtempSync(
    path.join(fixtureRoot, `diagnostic-${caseDef.toolId}-private-proof-`),
  )
  const outputJsonPath = path.join(tempDir, `${caseDef.toolId}-runtime-result.json`)
  const outputJson = {
    ...privateOutputJsonForTool(
      caseDef.toolId,
      tempDir,
      caseDef.proofMode,
    ),
    privateLocalProofFixture: true,
  }
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(outputJson, null, 2)}\n`)
  const outputJsonSha256 = createHash('sha256')
    .update(fs.readFileSync(outputJsonPath))
    .digest('hex')

  const source = json(
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  )
  const proof = {
    ...source,
    status:
      'local_dev_runtime_executed_for_private_opt_in_subset_not_global_ready',
    counts: {
      ...(source.counts ?? {}),
      requestedGpuModelTools: 1,
      gpuModelToolsCovered: 1,
      localDevAdapterBranchInvokedTools: 1,
      localDevPrerequisiteCheckOnlyTools: 0,
      localRuntimeExecutionPerformedTools: 1,
      toolExecutionApprovedNowTools: 1,
      gpuRuntimeApprovedForScopedControlledToolCallTools:
        caseDef.gpuShouldStartDuringScopedProof ? 1 : 0,
      gpuRuntimeShouldStartNowTools:
        caseDef.gpuShouldStartDuringScopedProof ? 1 : 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      runtimeReadyNowTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    gpuModelLocalDevRuntimeExecutionHarnessRows: [{
      toolId: caseDef.toolId,
      capabilityId: caseDef.capabilityId,
      adapterDecision:
        'ai_graphics_external_agent_gpu_model_controlled_adapter_executable_eight_on_demand_with_runtime_blocks',
      adapterStatus: 'controlled_gpu_model_adapter_executed_private_output_ready',
      executionState: 'executable',
      controlledAdapterExecutableNow: true,
      controlledAdapterInvokedNow: true,
      harnessMode: 'local_dev_runtime_attempt_requested',
      localRuntimeExecutionPerformed: true,
      toolExecutionApprovedNow: true,
      gpuRuntimeApprovedForScopedControlledToolCall:
        caseDef.gpuShouldStartDuringScopedProof,
      gpuRuntimeShouldStartNow: caseDef.gpuShouldStartDuringScopedProof,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      skipReasonCode: null,
      errorMessage: null,
      outputJsonPath,
      outputJsonSha256,
      allowCpuTensorRuntime: caseDef.toolId === 'kornia',
      allowCpuFoundationRuntime: false,
      allowCpuModelRuntime: caseDef.proofMode === 'cpu_model',
      localInputRequirements: [
        {
          key: 'outputDirectory',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Private local worker output directory; must not be public artifact storage.',
        },
        {
          key: 'sourceImageLocalPath',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Private local representative image/frame selected from an approved plan.',
        },
        {
          key: 'pythonCpuTensorRuntime',
          requiredForDefaultHarness: false,
          requiredForActualExecution: true,
          description:
            'Approved local Python CPU tensor runtime with torch, PIL, numpy, and kornia; no model weight required.',
        },
      ],
      warnings: [
        'Diagnostic-only private proof fixture; no GPU/runtime was started by this diagnostic.',
      ],
    }],
  }
  const proofPath = path.join(tempDir, 'harness-result.json')
  fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`)
  return proofPath
}

function checkPackageJson() {
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
      if (JSON.stringify(pkg[section] ?? {}) !== JSON.stringify(headPkg[section] ?? {})) {
        fail(`package_dependency_section_changed:${section}`)
      }
    }
  } catch (error) {
    fail(`package_dependency_comparison_failed:${error.message}`)
  }
}

function checkPackageLockUnchanged() {
  try {
    exec('git diff --quiet -- package-lock.json')
  } catch {
    fail('package_lock_changed')
  }
}

function checkChangedFiles() {
  let changed = ''
  try {
    changed = exec('git diff --name-only HEAD')
  } catch (error) {
    fail(`git_diff_name_only_failed:${error.message}`)
    return
  }

  for (const file of changed.split(/\r?\n/).filter(Boolean)) {
    if (file === 'package-lock.json') fail('package_lock_changed_in_diff')
    if (file.includes('.local-artifacts')) fail(`local_artifact_changed:${file}`)
    if (generatedArtifactPattern.test(file)) fail(`generated_artifact_changed:${file}`)
  }
}

for (const file of requiredFiles) read(file)
checkPackageJson()
checkPackageLockUnchanged()
checkChangedFiles()

const report = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md',
)
const cli = read(
  'server/cli/ai-graphics-external-agent-gpu-model-runtime-proof-ref-bridge.ts',
)
const sourceHarness = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
)
const sourceProofRefCaller = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json',
)

if (report.decision !== decision) fail('decision_mismatch')
if (report.status !== status) fail('status_mismatch')
if (
  sourceHarness.decision !==
  'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks'
) {
  fail('source_harness_decision_mismatch')
}
if (
  sourceProofRefCaller.decision !==
  'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks'
) {
  fail('source_proof_ref_route_caller_decision_mismatch')
}

for (const row of sourceHarness.gpuModelLocalDevRuntimeExecutionHarnessRows ?? []) {
  if (!gpuModelTools.includes(row.toolId)) continue
  if (row.executionState !== 'blocked_with_reason') {
    fail(`source_harness_execution_state_mismatch:${row.toolId}:${row.executionState}`)
  }
}

for (const [key, expected] of Object.entries(expectedCounts)) {
  if (report.counts?.[key] !== expected) {
    fail(`count_mismatch:${key}:expected_${expected}:got_${report.counts?.[key]}`)
  }
}

for (const key of trueBooleans) {
  if (report.booleans?.[key] !== true) fail(`boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (report.booleans?.[key] !== false) fail(`boolean_not_false:${key}`)
}

if (
  !Array.isArray(report.gpuModelRuntimeProofRefBridgeRows) ||
  report.gpuModelRuntimeProofRefBridgeRows.length !== 8
) {
  fail('bridge_rows_count_mismatch')
} else {
  const rowsByTool = new Map(
    report.gpuModelRuntimeProofRefBridgeRows.map((row) => [row.toolId, row]),
  )
  for (const toolId of gpuModelTools) {
    const row = rowsByTool.get(toolId)
    if (!row) {
      fail(`missing_bridge_row:${toolId}`)
      continue
    }
    if (row.localRuntimeProofResultProvided !== false) {
      fail(`committed_local_proof_unexpectedly_supplied:${toolId}`)
    }
    if (row.localRuntimeProofAccepted !== false) {
      fail(`committed_local_proof_unexpectedly_accepted:${toolId}`)
    }
    if (
      row.proofRefBridgeStatus !==
      'blocked_missing_private_local_runtime_proof_result'
    ) {
      fail(`bridge_status_mismatch:${toolId}:${row.proofRefBridgeStatus}`)
    }
    if (row.routeSubmissionReadyWithAcceptedPrivateProof !== false) {
      fail(`route_submission_unexpectedly_ready:${toolId}`)
    }
    if (row.gpuRuntimeShouldStartNow !== false) {
      fail(`gpu_start_unexpectedly_ready:${toolId}`)
    }
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      if (row.modelWeightManifestRequired !== true) {
        fail(`model_manifest_required_missing:${toolId}`)
      }
      if (!String(row.modelWeightManifestRef ?? '').startsWith('private://')) {
        fail(`model_manifest_private_ref_missing:${toolId}`)
      }
    } else if (row.modelWeightManifestRequired !== false) {
      fail(`unexpected_model_manifest_required:${toolId}`)
    }
    for (const key of [
      'nativeGpuRuntimeProofRef',
      'externalBetaPerToolRuntimeProofRef',
    ]) {
      if (!String(row[key] ?? '').startsWith('private://')) {
        fail(`private_ref_missing:${toolId}:${key}`)
      }
    }
    for (const key of [
      'liveQueueWritePerformed',
      'workerDispatchPerformed',
      'toolExecutionPerformedByBridge',
      'modelWeightsLoadedByBridge',
      'publicArtifactCreatedByBridge',
      'signedUrlCreatedByBridge',
    ]) {
      if (row[key] !== false) fail(`row_forbidden_not_false:${toolId}:${key}`)
    }
  }
}

for (const toolId of gpuModelTools) {
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}

for (const phrase of [
  'accepts zero GPU/model proofs',
  'does not start GPU runtime',
  'write live queues',
  'dispatch workers',
  'create public artifacts',
  'create signed URLs',
  '--local-runtime-proof-result',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const phrase of [
  '--local-runtime-proof-result',
  '--write-records cannot be combined',
  'privateOutputJsonPathExists',
  'privateOutputJsonSha256Matches',
  'localRuntimeExecutionPerformed',
  'routeSubmissionReadyWithAcceptedPrivateProof',
  'acceptsSam2GpuProof',
  'acceptsBirefnetGpuProof',
  'acceptsRealEsrganGpuProof',
  'acceptsRembgGpuProof',
  'acceptsTransparentBackgroundGpuProof',
  'acceptsToolSpecificGpuProof',
  'exactPerToolPrivateOutputContracts',
  'generic CUDA-looking JSON is not enough',
  'modelWeightsDownloaded',
  'private_output_json_sha256_missing',
  'private_output_json_sha256_mismatch',
  'private_output_json_outside_local_artifacts_gpu_model_runtime_namespace',
  'privateLocalProofFixture',
  'requiresPrivateOutputJsonSha256Match',
  'requiresPrivateOutputJsonUnderLocalArtifactsGpuModelRuntime',
  'sha256File',
  'createHash',
  'path.relative(process.cwd(), file)',
  'return isLocalGpuModelProofOutputPath(relative)',
]) {
  if (!cli.includes(phrase)) fail(`cli_missing_phrase:${phrase}`)
}

if (
  report.proofRefBridgePolicy?.requiresPrivateOutputJsonUnderLocalArtifactsGpuModelRuntime !==
    true
) {
  fail('proof_ref_bridge_policy_missing_local_artifacts_namespace_requirement')
}
if (report.proofRefBridgePolicy?.requiresPrivateOutputJsonSha256Match !== true) {
  fail('proof_ref_bridge_policy_missing_output_sha256_match_requirement')
}
if (report.proofRefBridgePolicy?.rejectsDiagnosticOnlyPrivateProofFixtures !== true) {
  fail('proof_ref_bridge_policy_missing_diagnostic_fixture_rejection')
}
for (const toolId of gpuModelTools) {
  const contract =
    report.proofRefBridgePolicy?.exactPerToolPrivateOutputContracts?.[toolId]
  if (!contract) fail(`missing_exact_private_output_contract:${toolId}`)
  if (!contract?.acceptedRuntimeEvidence) {
    fail(`missing_exact_private_output_contract_evidence:${toolId}`)
  }
  if (!Array.isArray(contract?.requiredPrivateOutputFields) ||
    contract.requiredPrivateOutputFields.length === 0) {
    fail(`missing_exact_private_output_contract_fields:${toolId}`)
  }
}

if (
  !String(report.interfaces?.upstreamPrivateProofCommand ?? '').includes(
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  )
) {
  fail('upstream_private_proof_command_missing_result_out')
}

for (const forbidden of forbiddenPatterns) {
  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.md',
  ]) {
    if (forbidden.test(read(file))) fail(`forbidden_claim:${file}:${forbidden}`)
  }
}

for (const caseDef of scopedProofFixtureCases) {
  const scopedProofPath = createScopedPrivateProofFixture(caseDef)
  const scopedBridge = execFileJson('npm', [
    'run',
    '--silent',
    runScriptName,
    '--',
    '--local-runtime-proof-result',
    scopedProofPath,
  ])
  if (scopedBridge.status !== status) {
    fail(`diagnostic_only_scoped_bridge_status_mismatch:${caseDef.toolId}:${scopedBridge.status}`)
  }
  if (scopedBridge.counts?.privateLocalRuntimeProofResultSuppliedTools !== 1) {
    fail(`diagnostic_only_scoped_bridge_supplied_count_not_one:${caseDef.toolId}`)
  }
  if (scopedBridge.counts?.acceptedPrivateLocalRuntimeProofTools !== 0) {
    fail(`diagnostic_only_scoped_bridge_accepted_count_not_zero:${caseDef.toolId}`)
  }
  if (scopedBridge.counts?.routeSubmissionReadyWithAcceptedPrivateProofTools !== 0) {
    fail(`diagnostic_only_scoped_bridge_route_ready_count_not_zero:${caseDef.toolId}`)
  }
  if (scopedBridge.counts?.blockedMissingPrivateLocalRuntimeProofResultTools !== 7) {
    fail(`diagnostic_only_scoped_bridge_remaining_missing_count_not_seven:${caseDef.toolId}`)
  }
  if (scopedBridge.counts?.blockedPrivateLocalRuntimeOutputMissingTools !== 1) {
    fail(`diagnostic_only_scoped_bridge_output_missing_count_not_one:${caseDef.toolId}`)
  }
  const scopedBridgeRows = Array.isArray(scopedBridge.gpuModelRuntimeProofRefBridgeRows)
    ? scopedBridge.gpuModelRuntimeProofRefBridgeRows
    : []
  const scopedRow = scopedBridgeRows.find((row) => row.toolId === caseDef.toolId)
  if (!scopedRow) {
    fail(`diagnostic_only_scoped_bridge_missing_row:${caseDef.toolId}`)
  } else {
    if (scopedRow.localRuntimeProofAccepted !== false) {
      fail(`diagnostic_only_scoped_bridge_row_accepted:${caseDef.toolId}`)
    }
    if (scopedRow.routeSubmissionReadyWithAcceptedPrivateProof !== false) {
      fail(`diagnostic_only_scoped_bridge_route_ready:${caseDef.toolId}`)
    }
    if (
      scopedRow.proofRefBridgeStatus !==
      'blocked_private_local_runtime_output_missing'
    ) {
      fail(`diagnostic_only_scoped_bridge_status:${caseDef.toolId}:${scopedRow.proofRefBridgeStatus}`)
    }
    if (
      scopedRow.localProofEvidenceObserved
        ?.privateOutputJsonAccepted !== false
    ) {
      fail(`diagnostic_only_scoped_bridge_output_json_accepted:${caseDef.toolId}`)
    }
    if (
      scopedRow.localProofEvidenceObserved
        ?.privateOutputJsonRejectionReason !==
      'private_output_json_contains_forbidden_success_or_runtime_flag'
    ) {
      fail(`diagnostic_only_scoped_bridge_output_rejection:${caseDef.toolId}:${scopedRow.localProofEvidenceObserved?.privateOutputJsonRejectionReason}`)
    }
    if (
      scopedRow.localProofEvidenceObserved
        ?.gpuRuntimeShouldStartNowDuringScopedProof !==
      caseDef.gpuShouldStartDuringScopedProof
    ) {
      fail(`synthetic_scoped_bridge_scoped_gpu_expectation_mismatch:${caseDef.toolId}`)
    }
    if (scopedRow.gpuRuntimeShouldStartNow !== false) {
      fail(`synthetic_scoped_bridge_bridge_started_gpu:${caseDef.toolId}`)
    }
  }
  for (const row of scopedBridgeRows.filter((item) => item.toolId !== caseDef.toolId)) {
    if (row.proofRefBridgeStatus !== 'blocked_missing_private_local_runtime_proof_result') {
      fail(`scoped_bridge_unexpected_non_target_status:${caseDef.toolId}:${row.toolId}:${row.proofRefBridgeStatus}`)
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  gpuModelToolsCovered: 8,
  acceptedPrivateLocalRuntimeProofTools: 0,
  routeSubmissionReadyWithAcceptedPrivateProofTools: 0,
  gpuRuntimeShouldStartNowTools: 0,
  packageLockUnchanged: true,
}, null, 2))
