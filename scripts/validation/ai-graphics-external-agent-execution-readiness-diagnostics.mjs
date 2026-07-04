import childProcess from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks'
const status =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof'
const privateProofStatus =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_plus_private_gpu_model_proof_subset'
const runScriptName = 'ai-graphics:external-agent-execution-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-agent-execution-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:external-agent-execution-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-agent-execution-readiness-diagnostics.mjs'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const canonicalGpuWorkerProofImageBuildCommand =
  `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t ${canonicalGpuWorkerProofImage} .`

const cpuStaticTools = [
  'd3',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
]
const browserRuntimeTools = [
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]
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

const gpuModelCpuFoundationTools = ['torch_torchvision', 'transformers']
const gpuModelCpuTensorTools = ['kornia']
const gpuModelWeightManifestTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]
const allTools = [...gpuModelTools, ...cpuStaticTools, ...browserRuntimeTools]
const gpuModelInstallProofProfiles = {
  torch_torchvision: ['gpu_worker_ai_graphics', 'sam2', 'birefnet', 'real_esrgan'],
  transformers: ['gpu_worker_ai_graphics', 'birefnet'],
  sam2: ['gpu_worker_ai_graphics', 'sam2'],
  birefnet: ['birefnet'],
  real_esrgan: ['gpu_worker_ai_graphics', 'real_esrgan'],
  kornia: ['gpu_worker_ai_graphics', 'birefnet'],
  rembg: ['gpu_worker_ai_graphics'],
  transparent_background: ['gpu_worker_ai_graphics'],
}
const gpuModelPrimaryInstallProofProfiles = {
  torch_torchvision: 'gpu_worker_ai_graphics',
  transformers: 'gpu_worker_ai_graphics',
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real_esrgan',
  kornia: 'gpu_worker_ai_graphics',
  rembg: 'gpu_worker_ai_graphics',
  transparent_background: 'gpu_worker_ai_graphics',
}

const scopedProofFixtureCases = [
  { toolId: 'torch_torchvision', capabilityId: 'model_runtime_foundation', gpuShouldStartDuringScopedProof: false },
  { toolId: 'transformers', capabilityId: 'model_runtime_foundation', gpuShouldStartDuringScopedProof: false },
  { toolId: 'sam2', capabilityId: 'subject_segmentation', gpuShouldStartDuringScopedProof: true },
  { toolId: 'birefnet', capabilityId: 'background_removal', gpuShouldStartDuringScopedProof: true },
  { toolId: 'real_esrgan', capabilityId: 'upscaling', gpuShouldStartDuringScopedProof: true },
  { toolId: 'kornia', capabilityId: 'tensor_image_ops', gpuShouldStartDuringScopedProof: false },
  { toolId: 'rembg', capabilityId: 'background_removal', gpuShouldStartDuringScopedProof: true },
  { toolId: 'transparent_background', capabilityId: 'background_removal', gpuShouldStartDuringScopedProof: true },
]

const requiredFiles = [
  'server/cli/ai-graphics-external-agent-execution-readiness.ts',
  'server/cli/ai-graphics-external-agent-gpu-model-runtime-input-manifest.ts',
  'scripts/validation/ai-graphics-external-agent-execution-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md',
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json',
  'package.json',
]

const forbiddenPatterns = [
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /agentCanExecuteGpuModelToolsNow["`:\s=]+true/i,
  /toolExecutionApprovedForAll21ToolsNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /modelInferencePerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
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
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
}

function execFileJson(command, args) {
  return JSON.parse(childProcess.execFileSync(command, args, {
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

function privateOutputJsonForTool(toolId, tempDir) {
  const p = (name) => path.join(tempDir, name)
  if (toolId === 'torch_torchvision' || toolId === 'transformers') {
    return {
      ok: true,
      toolId,
      runtime: {
        cpuFoundationRuntimeAllowed: true,
        cudaAvailable: false,
        deviceType: 'cpu',
        modelInferencePerformed: false,
        mediaProcessed: false,
        modelDownloadedExternally: false,
        providerRuntimePerformed: false,
        publicArtifactCreated: false,
        signedUrlCreated: false,
      },
    }
  }
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
      }
    case 'real_esrgan':
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
          kind: 'approved_private_frame',
        },
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
    path.join(fixtureRoot, `diagnostic-${caseDef.toolId}-readiness-proof-`),
  )
  const outputJsonPath = path.join(tempDir, `${caseDef.toolId}-runtime-result.json`)
  const outputJson = privateOutputJsonForTool(caseDef.toolId, tempDir)
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
      allowCpuFoundationRuntime:
        caseDef.toolId === 'torch_torchvision' ||
        caseDef.toolId === 'transformers',
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
}

function expectedGroup(toolId) {
  if (cpuStaticTools.includes(toolId)) return 'cpu_static'
  if (browserRuntimeTools.includes(toolId)) return 'browser_runtime'
  if (gpuModelTools.includes(toolId)) return 'gpu_model'
  return null
}

function expectedGpuInstallReadinessState(toolId) {
  if (gpuModelCpuFoundationTools.includes(toolId)) {
    return 'install_target_prepared_runtime_blocked_pending_cpu_foundation_private_inputs'
  }
  if (gpuModelCpuTensorTools.includes(toolId)) {
    return 'install_target_prepared_runtime_blocked_pending_cpu_tensor_private_inputs'
  }
  return 'install_target_prepared_runtime_blocked_pending_cuda_private_inputs'
}

function expectedGpuRuntimeBlocker(toolId) {
  if (gpuModelCpuFoundationTools.includes(toolId)) {
    return 'approved local Python CPU foundation runtime'
  }
  if (gpuModelCpuTensorTools.includes(toolId)) {
    return 'approved local Python CPU tensor runtime'
  }
  return 'approved native CUDA host'
}

function gpuModelRequiresSourceImage(toolId) {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function gpuModelAllowsCpuFoundationRuntime(toolId) {
  return toolId === 'torch_torchvision' || toolId === 'transformers'
}

function gpuModelRequiresModelWeightManifest(toolId) {
  return gpuModelWeightManifestTools.includes(toolId)
}

function expectedRuntimeInputManifestModelFlag(toolId) {
  return {
    sam2: '--sam2-checkpoint <private-sam2-checkpoint.pt>',
    birefnet:
      '--birefnet-model <private-birefnet-model-dir-containing-model.safetensors>',
    real_esrgan:
      '--real-esrgan-model <private-real-esrgan-model-dir/RealESRGAN_x4plus.pth>',
    rembg: '--rembg-model <private-rembg-model.onnx>',
    transparent_background:
      '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>',
  }[toolId] ?? null
}

function expectedMinimumPrivateRuntimeInputKeys(toolId) {
  const keys = [
    'outputDirectory',
    toolId === 'kornia'
      ? 'pythonCpuTensorRuntime'
      : gpuModelAllowsCpuFoundationRuntime(toolId)
      ? 'pythonCpuFoundationRuntime'
      : 'nativeCudaRuntime',
  ]
  if (gpuModelRequiresSourceImage(toolId)) keys.push('sourceImageLocalPath')
  if (toolId === 'sam2') keys.push('sam2CheckpointLocalPath')
  if (toolId === 'birefnet') keys.push('birefnetModelLocalPath')
  if (toolId === 'real_esrgan') keys.push('realEsrganModelLocalPath')
  if (toolId === 'rembg') keys.push('rembgModelLocalPath')
  if (toolId === 'transparent_background') {
    keys.push('transparentBackgroundCheckpointLocalPath')
  }
  if (['sam2', 'birefnet', 'real_esrgan', 'rembg', 'transparent_background'].includes(toolId)) {
    keys.push('modelWeightManifestEvidence')
  }
  return keys
}

function expectedCurrentBlockingPrerequisiteKey(toolId) {
  return {
    torch_torchvision: 'outputDirectory',
    transformers: 'outputDirectory',
    sam2: 'sam2CheckpointLocalPath',
    birefnet: 'birefnetModelLocalPath',
    real_esrgan: 'realEsrganModelLocalPath',
    kornia: 'sourceImageLocalPath',
    rembg: 'rembgModelLocalPath',
    transparent_background: 'transparentBackgroundCheckpointLocalPath',
  }[toolId] ?? null
}

function expectedHostRuntimeFlags(toolId) {
  const flags = [`--tool ${toolId}`, '--output-dir']
  if (toolId === 'kornia') flags.push('--allow-cpu-tensor-runtime')
  if (gpuModelRequiresSourceImage(toolId)) flags.push('--source-image')
  if (toolId === 'sam2') flags.push('--sam2-checkpoint')
  if (toolId === 'birefnet') flags.push('--birefnet-model')
  if (toolId === 'real_esrgan') flags.push('--real-esrgan-model')
  if (toolId === 'rembg') flags.push('--rembg-model')
  if (toolId === 'transparent_background') {
    flags.push('--transparent-background-checkpoint')
  }
  return flags
}

function expectedControlledRouteFlags(toolId) {
  const flags = [
    `--scoped-gpu-tool ${toolId}`,
    '--scoped-gpu-runtime-container-image',
    '--scoped-gpu-runtime-container-platform',
    '--scoped-gpu-output-dir',
  ]
  if (toolId === 'kornia') flags.push('--scoped-gpu-allow-cpu-tensor-runtime')
  if (gpuModelRequiresSourceImage(toolId)) flags.push('--scoped-gpu-source-image')
  if (toolId === 'sam2') flags.push('--scoped-gpu-sam2-checkpoint')
  if (toolId === 'birefnet') flags.push('--scoped-gpu-birefnet-model')
  if (toolId === 'real_esrgan') flags.push('--scoped-gpu-real-esrgan-model')
  if (toolId === 'rembg') flags.push('--scoped-gpu-rembg-model')
  if (toolId === 'transparent_background') {
    flags.push('--scoped-gpu-transparent-background-checkpoint')
  }
  return flags
}

function arrayMatches(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    expected.every((value) => actual.includes(value))
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  const counts = report.counts ?? {}
  const expectedCounts = {
    totalToolsCovered: 21,
    packageRuntimePresentForPlannedSurfaceTools: 21,
    packageRuntimeInstallProofPresentTools: 21,
    gpuModelInstallProofTargetPreparedTools: 8,
    gpuModelInstallProofImportSmokePassedTools: 8,
    controlledExecutionRuntimePresentNowTools: 13,
    agentCallableTools: 21,
    agentExecutableTools: 13,
    cpuStaticExecutableTools: 6,
    browserRuntimeExecutableTools: 7,
    gpuToolsWithValidRuntimeProof: 0,
    gpuModelProofRefBridgeAcceptedTools: 0,
    gpuModelProofRefBridgeBlockedTools: 8,
    controlledWorkerRouteExecutableTools: 13,
    mockWorkerQueueJobCreatedTools: 13,
    mockWorkerClaimPerformedTools: 13,
    mockWorkerEventRecordedTools: 13,
    gpuModelBlockedByControlledWorkerRouteTools: 8,
    gpuModelBlockedWithReasonTools: 8,
    currentHostGpuProofBlockers: 0,
    blockedWithReasonTools: 8,
    failedWithDiagnosticsTools: 0,
    capabilityMismatchFailureProbeTools: 1,
    gpuRuntimeShouldStartNowTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
    workerDispatchPerformedTools: 0,
    providerRuntimePerformedTools: 0,
    runtimeReadyNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    fastestGpuModelUnlockCandidateTools: 1,
    privateLocalRuntimeProofResultSuppliedTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_mismatch:${key}:${counts[key]}`)
  }
  const routeSource =
    report.sourceEvidence?.all21ControlledRouteExecutionSmoke ?? {}
  if (routeSource.capabilityMismatchFailureProbeAccepted !== true) {
    fail(`${label}_capability_mismatch_source_not_accepted`)
  }
  if (
    routeSource.capabilityMismatchFailureProbeState !==
    'failed_with_diagnostics'
  ) {
    fail(`${label}_capability_mismatch_source_state_mismatch:${routeSource.capabilityMismatchFailureProbeState}`)
  }
  const gpuInstallSource =
    report.sourceEvidence?.gpuModelInstallBuildTargets ?? {}
  if (gpuInstallSource.accepted !== true) {
    fail(`${label}_gpu_install_source_not_accepted`)
  }
  if (
    gpuInstallSource.decision !==
    'ai_graphics_gpu_model_install_build_targets_prepared_with_warnings'
  ) {
    fail(`${label}_gpu_install_source_decision_mismatch:${gpuInstallSource.decision}`)
  }
  if (
    gpuInstallSource.all8GpuModelInstallProofTargetsBuiltLocally !== true
  ) {
    fail(`${label}_gpu_install_source_all8_not_built_locally`)
  }
  if (gpuInstallSource.nativeGpuRuntimeStillRequired !== true) {
    fail(`${label}_gpu_install_source_native_runtime_not_required`)
  }

  const booleans = report.booleans ?? {}
  for (const key of [
    'externalAgentExecutionReadinessCompleted',
    'all21ToolsCovered',
    'all21ToolsHaveInstallSurfaceEvidence',
    'all21ToolsHaveRuntimeInstallProofEvidence',
    'all8GpuModelToolsHaveInstallProofTargetEvidence',
    'all8GpuModelInstallProofImportSmokesPassed',
    'gpuModelInstallProofSeparatedFromRuntimeExecution',
    'gpuModelInstallProofDidNotStartNativeGpu',
    'gpuModelInstallProofDidNotLoadModelsOrProcessMedia',
    'thirteenToolsHaveControlledExecutionRuntimePresentNow',
    'eightGpuModelToolsInstallTargetPreparedButRuntimeBlocked',
    'agentCanSubmitControlledToolRequests',
    'agentCallableToolsReady',
    'all13NonGpuControlledAdapterOutputsValidated',
    'controlledWorkerRouteSmokeAccepted',
    'all13NonGpuControlledWorkerRouteOutputsValidated',
    'mockWorkerClaimBeforeRouteExecutionAccepted',
    'mockWorkerEventAfterRouteExecutionAccepted',
    'all8GpuModelToolsBlockedByControlledWorkerRoute',
    'all8GpuModelToolsEvaluated',
    'gpuModelToolsBlockedUntilPrerequisites',
    'gpuModelProofRefBridgeBlocksUntilPrivateProof',
    'strictCallableExecutableBlockedFailedContractCreated',
    'capabilityMismatchFailureProbeAccepted',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'agentCanSelectForPlanning',
    'agentCanExecuteToolsNow',
    'agentCanExecuteAnyControlledToolNow',
    'agentCanExecute13ControlledToolsNow',
    'agentCanExecute13NonGpuControlledToolsNow',
    'routeExecutionApprovedNow',
    'controlledWorkerRouteExecutionPerformedInReadinessRunner',
    'toolExecutionApprovedFor13ControlledToolsNow',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'gpuRuntimeShouldStartNow',
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteAll21ControlledToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'currentHostGpuProofPreflightRequested',
    'currentHostEligibleForGpuProof',
    'privateLocalRuntimeProofResultSupplied',
    'toolExecutionApprovedForGpuModelToolsNow',
    'toolExecutionApprovedForAll21ToolsNow',
    'workerExecutionApprovedNow',
    'workerExecutionPerformed',
    'workerDispatchPerformed',
    'providerRuntimeApprovedNow',
    'providerRuntimePerformed',
    'browserWebglCanvasRuntimeApprovedNow',
    'gpuRuntimeApprovedNow',
    'gpuRuntimePerformed',
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
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }

  const executionScope = report.executionScope ?? {}
  const expectedScope = {
    agentCanSubmitControlledRequestsForAll21: true,
    agentCanExecuteAnyControlledToolNow: true,
    agentCanExecute13NonGpuControlledToolsNow: true,
    agentCanExecuteGpuModelToolsNow: false,
    agentCanExecuteAll21ControlledToolsNow: false,
    agentExecutableToolCountNow: 13,
    agentExecutableNonGpuToolCountNow: 13,
    agentExecutableGpuModelToolCountNow: 0,
    gpuModelBlockedToolCountNow: 8,
    currentHostGpuProofPreflightRequested: false,
    currentHostEligibleForGpuProof: false,
  }
  for (const [key, value] of Object.entries(expectedScope)) {
    if (executionScope[key] !== value) {
      fail(`${label}_execution_scope_mismatch:${key}:${executionScope[key]}`)
    }
  }
  if (!Array.isArray(executionScope.currentHostGpuProofBlockers)) {
    fail(`${label}_execution_scope_host_blockers_not_array`)
  } else if (executionScope.currentHostGpuProofBlockers.length !== 0) {
    fail(`${label}_execution_scope_default_host_blockers_not_empty`)
  }
  if (
    !String(executionScope.currentHostGpuProofPreflightCommand ?? '').includes(
      '--detect-host',
    )
  ) {
    fail(`${label}_execution_scope_missing_detect_host_command`)
  }

  const rows = Array.isArray(report.toolReadinessRows)
    ? report.toolReadinessRows
    : []
  if (rows.length !== 21) {
    fail(`${label}_row_count_mismatch:${rows.length}`)
    return
  }
  for (const toolId of allTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_tool:${toolId}`)
      continue
    }
    if (row.group !== expectedGroup(toolId)) fail(`${label}_${toolId}_group_mismatch`)
    if (typeof row.installSurface !== 'string' || row.installSurface.length === 0) {
      fail(`${label}_${toolId}_missing_install_surface`)
    }
    if (typeof row.installStatus !== 'string' || row.installStatus.length === 0) {
      fail(`${label}_${toolId}_missing_install_status`)
    }
    if (!Array.isArray(row.installEvidence) || row.installEvidence.length === 0) {
      fail(`${label}_${toolId}_missing_install_evidence`)
    }
    if (row.packageRuntimePresentForPlannedSurface !== true) {
      fail(`${label}_${toolId}_planned_surface_runtime_not_present`)
    }
    if (row.packageRuntimeInstallProofPresent !== true) {
      fail(`${label}_${toolId}_runtime_install_proof_not_present`)
    }
    if (row.callable !== true) fail(`${label}_${toolId}_not_callable`)
    if (row.routeCallable !== true) fail(`${label}_${toolId}_route_not_callable`)
    if (row.adapterReachable !== true) fail(`${label}_${toolId}_adapter_not_reachable`)
    if (row.controlledWorkerRouteEvidenceAccepted !== true) {
      fail(`${label}_${toolId}_worker_route_evidence_not_accepted`)
    }
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'publicArtifactCreated',
      'signedUrlCreated',
      'workerDispatchPerformed',
      'providerRuntimePerformed',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
    if (gpuModelTools.includes(toolId)) {
      if (row.readinessState !== 'blocked_with_reason') {
        fail(`${label}_${toolId}_gpu_state_not_blocked:${row.readinessState}`)
      }
      if (row.executable !== false || row.executionPassed !== false) {
        fail(`${label}_${toolId}_gpu_claimed_executable`)
      }
      if (row.controlledExecutionRuntimePresentNow !== false) {
        fail(`${label}_${toolId}_gpu_controlled_runtime_present`)
      }
      if (
        row.packageRuntimeInstallProofSource !==
        'docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json'
      ) {
        fail(`${label}_${toolId}_gpu_install_source_mismatch:${row.packageRuntimeInstallProofSource}`)
      }
      if (!arrayMatches(
        row.packageRuntimeInstallProofProfiles,
        gpuModelInstallProofProfiles[toolId],
      )) {
        fail(`${label}_${toolId}_gpu_install_profiles_mismatch:${JSON.stringify(row.packageRuntimeInstallProofProfiles)}`)
      }
      if (
        row.packageRuntimeInstallProofPrimaryProfile !==
        gpuModelPrimaryInstallProofProfiles[toolId]
      ) {
        fail(`${label}_${toolId}_gpu_install_primary_profile_mismatch:${row.packageRuntimeInstallProofPrimaryProfile}`)
      }
      if (
        row.packageRuntimeInstallProofStatus !==
        'install_proof_target_prepared_runtime_gpu_required'
      ) {
        fail(`${label}_${toolId}_gpu_install_status_mismatch:${row.packageRuntimeInstallProofStatus}`)
      }
      if (row.packageRuntimeInstallProofTargetPrepared !== true) {
        fail(`${label}_${toolId}_gpu_install_target_not_prepared`)
      }
      if (row.packageRuntimeInstallProofImportSmokePassed !== true) {
        fail(`${label}_${toolId}_gpu_import_smoke_not_passed`)
      }
      if (
        typeof row.packageRuntimeInstallProofPrimaryDockerfile !== 'string' ||
        !row.packageRuntimeInstallProofPrimaryDockerfile.includes('docker/prod/')
      ) {
        fail(`${label}_${toolId}_gpu_install_missing_primary_dockerfile`)
      }
      if (row.packageRuntimeInstallProofPrimaryTarget !== 'ai_graphics_install_proof') {
        fail(`${label}_${toolId}_gpu_install_primary_target_mismatch:${row.packageRuntimeInstallProofPrimaryTarget}`)
      }
      if (row.packageRuntimeInstallProofPrimaryPlatform !== 'linux/amd64') {
        fail(`${label}_${toolId}_gpu_install_primary_platform_mismatch:${row.packageRuntimeInstallProofPrimaryPlatform}`)
      }
      if (
        !String(row.packageRuntimeInstallProofPrimaryBuildCommand ?? '').includes(
          '--target ai_graphics_install_proof',
        )
      ) {
        fail(`${label}_${toolId}_gpu_install_primary_build_command_missing_target`)
      }
      if (
        !String(row.packageRuntimeInstallProofPrimaryImportSmokeCommand ?? '').includes(
          '--profile',
        )
      ) {
        fail(`${label}_${toolId}_gpu_install_import_smoke_missing_profile`)
      }
      if (row.packageRuntimeInstallProofRuntimeProofStillRequired !== true) {
        fail(`${label}_${toolId}_gpu_install_runtime_proof_not_required`)
      }
      for (const key of [
        'packageRuntimeInstallProofNativeGpuRuntimeUsed',
        'packageRuntimeInstallProofModelWeightsRequired',
        'packageRuntimeInstallProofModelWeightsLoaded',
        'packageRuntimeInstallProofMediaProcessed',
        'packageRuntimeInstallProofProviderRuntimeUsed',
        'packageRuntimeInstallProofPublicArtifactCreated',
        'packageRuntimeInstallProofSignedUrlCreated',
      ]) {
        if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
      }
      const expectedInstallReadinessState =
        expectedGpuInstallReadinessState(toolId)
      if (row.installReadinessState !== expectedInstallReadinessState) {
        fail(`${label}_${toolId}_gpu_install_state_mismatch:${row.installReadinessState}`)
      }
      const expectedRuntimeBlocker = expectedGpuRuntimeBlocker(toolId)
      if (!String(row.blockingPrerequisite ?? '').includes(expectedRuntimeBlocker)) {
        fail(`${label}_${toolId}_missing_runtime_blocker:${expectedRuntimeBlocker}`)
      }
      if (!String(row.nextExactCommand ?? '').includes('--attempt-local-runtime')) {
        fail(`${label}_${toolId}_missing_gpu_next_command`)
      }
      if (!String(row.nextExactCommand ?? '').includes(`--tool ${toolId}`)) {
        fail(`${label}_${toolId}_gpu_next_command_not_tool_scoped`)
      }
      if (!String(row.nextExactCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
        fail(`${label}_${toolId}_gpu_next_command_missing_result_out`)
      }
      if (!String(row.nextExactContainerCommand ?? '').includes('--runtime-backend docker_container')) {
        fail(`${label}_${toolId}_missing_gpu_container_command`)
      }
      if (!String(row.nextExactHostPythonCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
        fail(`${label}_${toolId}_host_python_command_missing_result_out`)
      }
      if (!String(row.nextExactContainerCommand ?? '').includes('--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json')) {
        fail(`${label}_${toolId}_container_command_missing_result_out`)
      }
      if (!String(row.nextExactContainerCommand ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
        fail(`${label}_${toolId}_gpu_container_command_not_canonical_image`)
      }
      if (row.nextExactContainerBuildCommand !== canonicalGpuWorkerProofImageBuildCommand) {
        fail(`${label}_${toolId}_gpu_container_build_command_mismatch`)
      }
      if (!String(row.nextExactHostPythonCommand ?? '').includes('--attempt-local-runtime')) {
        fail(`${label}_${toolId}_missing_gpu_host_python_command`)
      }
      const expectedInputKeys = expectedMinimumPrivateRuntimeInputKeys(toolId)
      if (!arrayMatches(row.minimumPrivateRuntimeInputKeys, expectedInputKeys)) {
        fail(`${label}_${toolId}_minimum_input_keys_mismatch:${JSON.stringify(row.minimumPrivateRuntimeInputKeys)}`)
      }
      const expectedCurrentBlocker =
        expectedCurrentBlockingPrerequisiteKey(toolId)
      if (row.currentBlockingPrerequisiteKey !== expectedCurrentBlocker) {
        fail(`${label}_${toolId}_current_blocker_mismatch:${row.currentBlockingPrerequisiteKey}`)
      }
      if (typeof row.currentBlockingReasonCode !== 'string' ||
        row.currentBlockingReasonCode.length === 0) {
        fail(`${label}_${toolId}_missing_current_blocking_reason_code`)
      }
      const expectedRemainingInputKeys = expectedInputKeys.filter(
        (key) => key !== expectedCurrentBlocker,
      )
      if (!arrayMatches(row.remainingPrivateRuntimeInputKeys, expectedRemainingInputKeys)) {
        fail(`${label}_${toolId}_remaining_input_keys_mismatch:${JSON.stringify(row.remainingPrivateRuntimeInputKeys)}`)
      }
      if (row.remainingPrivateRuntimeInputKeys?.includes(expectedCurrentBlocker)) {
        fail(`${label}_${toolId}_remaining_inputs_include_current_blocker`)
      }
      for (const flag of expectedHostRuntimeFlags(toolId)) {
        if (!String(row.nextExactHostPythonCommand ?? '').includes(flag)) {
          fail(`${label}_${toolId}_host_python_command_missing:${flag}`)
        }
        if (!String(row.nextExactContainerCommand ?? '').includes(flag)) {
          fail(`${label}_${toolId}_container_command_missing:${flag}`)
        }
        if (!row.minimumHostRuntimeFlags?.some((value) => String(value).includes(flag))) {
          fail(`${label}_${toolId}_minimum_host_flags_missing:${flag}`)
        }
      }
      if (!gpuModelRequiresSourceImage(toolId)) {
        if (String(row.nextExactHostPythonCommand ?? '').includes('--source-image')) {
          fail(`${label}_${toolId}_host_python_command_has_unneeded_source_image`)
        }
        if (String(row.nextExactContainerCommand ?? '').includes('--source-image')) {
          fail(`${label}_${toolId}_container_command_has_unneeded_source_image`)
        }
        if (row.minimumPrivateRuntimeInputKeys?.includes('sourceImageLocalPath')) {
          fail(`${label}_${toolId}_minimum_inputs_include_unneeded_source_image`)
        }
      }
      if (
        !String(row.nextExactControlledRouteCommand ?? '').includes(
          'ai-graphics:external-agent-all21-controlled-route-execution-smoke',
        )
      ) {
        fail(`${label}_${toolId}_missing_gpu_controlled_route_command`)
      }
      if (!String(row.nextExactControlledRouteCommand ?? '').includes(`--scoped-gpu-tool ${toolId}`)) {
        fail(`${label}_${toolId}_controlled_route_command_not_tool_scoped`)
      }
      if (gpuModelRequiresModelWeightManifest(toolId)) {
        const manifestCommand =
          String(row.nextExactRuntimeInputManifestMaterializerCommand ?? '')
        const manifestPath =
          '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json'
        for (const fragment of [
          'ai-graphics:external-agent-gpu-model-runtime-input-manifest',
          `--tool ${toolId}`,
          '--source-image <private-approved-frame.png>',
          expectedRuntimeInputManifestModelFlag(toolId),
          '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>',
          `--manifest-out ${manifestPath}`,
          '--model-weight-manifest-id <reviewed-private-model-weight-manifest-id>',
          `--model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/${toolId}.json`,
          '--runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local',
          '--runtime-container-platform linux/amd64',
        ]) {
          if (!manifestCommand.includes(fragment)) {
            fail(`${label}_${toolId}_runtime_input_manifest_command_missing:${fragment}`)
          }
        }
        if (row.nextExactRuntimeInputManifestPath !== manifestPath) {
          fail(`${label}_${toolId}_runtime_input_manifest_path_mismatch`)
        }
        if (
          !String(row.nextExactRuntimeInputManifestScopedToolCallCommand ?? '')
            .includes(`--runtime-input-manifest ${manifestPath}`)
        ) {
          fail(`${label}_${toolId}_runtime_input_manifest_tool_call_missing`)
        }
        if (
          !String(row.nextExactRuntimeInputManifestHarnessCommand ?? '')
            .includes(`--runtime-input-manifest ${manifestPath}`)
        ) {
          fail(`${label}_${toolId}_runtime_input_manifest_harness_missing`)
        }
      } else if (
        row.nextExactRuntimeInputManifestMaterializerCommand !== null ||
        row.nextExactRuntimeInputManifestPath !== null ||
        row.nextExactRuntimeInputManifestScopedToolCallCommand !== null ||
        row.nextExactRuntimeInputManifestHarnessCommand !== null
      ) {
        fail(`${label}_${toolId}_unexpected_runtime_input_manifest_command`)
      }
      if (
        row.proofRefBridgeStatus !==
        'blocked_missing_private_local_runtime_proof_result'
      ) {
        fail(`${label}_${toolId}_proof_ref_bridge_status_mismatch:${row.proofRefBridgeStatus}`)
      }
      if (row.routeSubmissionReadyWithAcceptedPrivateProof !== false) {
        fail(`${label}_${toolId}_proof_ref_route_submission_unexpectedly_ready`)
      }
      if (row.controlledWorkerRouteGpuBlocked !== true) {
        fail(`${label}_${toolId}_worker_route_gpu_block_not_true`)
      }
      if (row.controlledWorkerRouteExecutedNow !== false) {
        fail(`${label}_${toolId}_worker_route_executed_unexpectedly`)
      }
      if (
        !String(row.nextExactProofRefBridgeCommand ?? '').includes(
          'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
        )
      ) {
        fail(`${label}_${toolId}_missing_proof_ref_bridge_command`)
      }
      if (!String(row.nextExactProofRefBridgeCommand ?? '').includes('--local-runtime-proof-result')) {
        fail(`${label}_${toolId}_proof_ref_bridge_command_missing_private_result_flag`)
      }
      const unlockPlan = Array.isArray(row.executionUnlockPlan)
        ? row.executionUnlockPlan
        : []
      const expectedUnlockActions = gpuModelRequiresModelWeightManifest(toolId)
        ? [
            'resolve_current_blocker',
            'materialize_model_weight_runtime_input_manifest',
            'prepare_runtime_surface',
            'run_scoped_private_local_runtime_proof',
            'bridge_private_runtime_proof_ref',
            'recompute_external_agent_readiness_with_private_proof',
            'retry_controlled_route_with_accepted_private_proof',
          ]
        : [
            'resolve_current_blocker',
            'prepare_runtime_surface',
            'run_scoped_private_local_runtime_proof',
            'bridge_private_runtime_proof_ref',
            'recompute_external_agent_readiness_with_private_proof',
            'retry_controlled_route_with_accepted_private_proof',
          ]
      if (unlockPlan.length !== expectedUnlockActions.length) {
        fail(`${label}_${toolId}_unlock_plan_step_count_mismatch:${unlockPlan.length}`)
      }
      for (const [index, action] of expectedUnlockActions.entries()) {
        if (unlockPlan[index]?.action !== action) {
          fail(`${label}_${toolId}_unlock_plan_action_mismatch:${index}:${unlockPlan[index]?.action}`)
        }
      }
      if (unlockPlan[0]?.currentBlockingPrerequisiteKey !== row.currentBlockingPrerequisiteKey) {
        fail(`${label}_${toolId}_unlock_plan_current_blocker_mismatch`)
      }
      if (unlockPlan[0]?.currentBlockingReasonCode !== row.currentBlockingReasonCode) {
        fail(`${label}_${toolId}_unlock_plan_current_reason_mismatch`)
      }
      const materializeStep = unlockPlan.find(
        (step) => step.action === 'materialize_model_weight_runtime_input_manifest',
      )
      if (gpuModelRequiresModelWeightManifest(toolId)) {
        if (
          !String(materializeStep?.command ?? '').includes(
            'ai-graphics:external-agent-gpu-model-runtime-input-manifest',
          )
        ) {
          fail(`${label}_${toolId}_unlock_plan_materializer_command_missing`)
        }
        if (
          materializeStep?.gpuStartsDuringManifestMaterialization !== false ||
          materializeStep?.privateOutputOnly !== true ||
          materializeStep?.requiresReviewedPrivateModelWeightManifest !== true
        ) {
          fail(`${label}_${toolId}_unlock_plan_materializer_boundary_mismatch`)
        }
      } else if (materializeStep) {
        fail(`${label}_${toolId}_unexpected_unlock_plan_materializer_step`)
      }
      const prepareStep = unlockPlan.find(
        (step) => step.action === 'prepare_runtime_surface',
      )
      const runtimeProofStep = unlockPlan.find(
        (step) => step.action === 'run_scoped_private_local_runtime_proof',
      )
      const proofRefBridgeStep = unlockPlan.find(
        (step) => step.action === 'bridge_private_runtime_proof_ref',
      )
      const readinessStep = unlockPlan.find(
        (step) => step.action === 'recompute_external_agent_readiness_with_private_proof',
      )
      const retryStep = unlockPlan.find(
        (step) => step.action === 'retry_controlled_route_with_accepted_private_proof',
      )
      if (prepareStep?.buildCommand !== canonicalGpuWorkerProofImageBuildCommand) {
        fail(`${label}_${toolId}_unlock_plan_build_command_mismatch`)
      }
      if (prepareStep?.gpuStartsDuringBuild !== false ||
        prepareStep?.gpuStartsIdle !== false) {
        fail(`${label}_${toolId}_unlock_plan_gpu_idle_policy_mismatch`)
      }
      if (!String(runtimeProofStep?.hostPythonCommand ?? '').includes(`--tool ${toolId}`)) {
        fail(`${label}_${toolId}_unlock_plan_host_command_not_tool_scoped`)
      }
      if (!String(runtimeProofStep?.containerCommand ?? '').includes('reeditpro/ai-graphics-gpu-worker:proof-local')) {
        fail(`${label}_${toolId}_unlock_plan_container_command_not_canonical_image`)
      }
      if (toolId === 'kornia' &&
        !String(runtimeProofStep?.containerCommand ?? '').includes('--allow-cpu-tensor-runtime')) {
        fail(`${label}_${toolId}_unlock_plan_kornia_missing_cpu_tensor_flag`)
      }
      if (gpuModelCpuFoundationTools.includes(toolId) &&
        !String(runtimeProofStep?.hostPythonCommand ?? '').includes('--allow-cpu-foundation-runtime')) {
        fail(`${label}_${toolId}_unlock_plan_foundation_missing_cpu_flag`)
      }
      if (!String(proofRefBridgeStep?.command ?? '').includes('--local-runtime-proof-result')) {
        fail(`${label}_${toolId}_unlock_plan_bridge_missing_private_result`)
      }
      if (!String(readinessStep?.command ?? '').includes('ai-graphics:external-agent-execution-readiness')) {
        fail(`${label}_${toolId}_unlock_plan_readiness_command_missing`)
      }
      if (retryStep?.productionStillBlocked !== true ||
        retryStep?.publicArtifactsStillBlocked !== true) {
        fail(`${label}_${toolId}_unlock_plan_production_or_public_artifact_not_blocked`)
      }
      for (const flag of expectedControlledRouteFlags(toolId)) {
        if (!String(row.nextExactControlledRouteCommand ?? '').includes(flag)) {
          fail(`${label}_${toolId}_controlled_route_command_missing:${flag}`)
        }
        if (!row.minimumControlledRouteFlags?.some((value) => String(value).includes(flag))) {
          fail(`${label}_${toolId}_minimum_controlled_route_flags_missing:${flag}`)
        }
      }
      if (!gpuModelRequiresSourceImage(toolId)) {
        if (String(row.nextExactControlledRouteCommand ?? '').includes('--scoped-gpu-source-image')) {
          fail(`${label}_${toolId}_controlled_route_command_has_unneeded_source_image`)
        }
      }
      if (toolId === 'kornia') {
        if (row.fastestGpuModelUnlockCandidate !== true) {
          fail(`${label}_${toolId}_not_fastest_gpu_unlock_candidate`)
        }
        if (row.recommendedGpuProofBackend !== 'docker_container') {
          fail(`${label}_${toolId}_recommended_backend_not_container`)
        }
        if (!String(row.nextExactCommand ?? '').includes('--runtime-backend docker_container')) {
          fail(`${label}_${toolId}_next_command_not_container_first`)
        }
      } else if (row.fastestGpuModelUnlockCandidate !== false) {
        fail(`${label}_${toolId}_unexpected_fastest_gpu_unlock_candidate`)
      }
    } else {
      if (row.readinessState !== 'executable') {
        fail(`${label}_${toolId}_non_gpu_state_not_executable:${row.readinessState}`)
      }
      if (row.executable !== true || row.executionPassed !== true) {
        fail(`${label}_${toolId}_non_gpu_not_executable`)
      }
      if (row.controlledExecutionRuntimePresentNow !== true) {
        fail(`${label}_${toolId}_non_gpu_controlled_runtime_not_present`)
      }
      if (row.installReadinessState !== 'controlled_runtime_present_and_executed') {
        fail(`${label}_${toolId}_non_gpu_install_state_mismatch:${row.installReadinessState}`)
      }
      if (row.controlledWorkerRouteExecutedNow !== true) {
        fail(`${label}_${toolId}_worker_route_not_executed`)
      }
      if (row.mockWorkerQueueJobCreated !== true) {
        fail(`${label}_${toolId}_mock_worker_queue_job_missing`)
      }
      if (row.mockWorkerClaimPerformed !== true) {
        fail(`${label}_${toolId}_mock_worker_claim_missing`)
      }
      if (row.mockWorkerEventRecorded !== true) {
        fail(`${label}_${toolId}_mock_worker_event_missing`)
      }
      if (!row.controlledWorkerRouteOutputSha256 || row.controlledWorkerRouteOutputSha256.length !== 64) {
        fail(`${label}_${toolId}_worker_route_missing_output_hash`)
      }
      if (!row.outputSha256 || row.outputSha256.length !== 64) {
        fail(`${label}_${toolId}_missing_output_hash`)
      }
    }
  }
}

function checkMountedControlledRouteSmoke(label, report) {
  if (report.decision !== 'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed') {
    fail(`${label}_decision_mismatch`)
  }
  if (report.status !== 'external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand') {
    fail(`${label}_status_mismatch`)
  }
  if (report.routePath !== '/api/ai-graphics/external-agent/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }
  if (
    report.routeFlags?.routeMount !==
    'AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_ENABLED'
  ) {
    fail(`${label}_route_mount_flag_mismatch`)
  }

  const expectedCounts = {
    totalAiGraphicsTools: 21,
    controlledRouteHttp200Tools: 21,
    controlledRouteCallableTools: 21,
    controlledRouteAdapterInvokedTools: 21,
    controlledRouteAdapterExecutedTools: 13,
    realRuntimeExecutedTools: 13,
    executableStateTools: 13,
    blockedWithReasonStateTools: 8,
    failedWithDiagnosticsStateTools: 0,
    normalizedExternalAgentToolCallResultTools: 21,
    normalizedExternalAgentCallableResultTools: 21,
    normalizedExternalAgentExecutableResultTools: 13,
    normalizedExternalAgentBlockedWithReasonResultTools: 8,
    normalizedExternalAgentFailedWithDiagnosticsResultTools: 0,
    cpuStaticControlledRouteExecutedTools: 6,
    browserRuntimeControlledRouteExecutedTools: 7,
    gpuModelControlledRouteInvokedTools: 8,
    gpuModelRuntimeProofRequiredTools: 8,
    localPackageExecutionPerformedTools: 13,
    localGpuModelRuntimeExecutionPerformedTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    workerDispatchPerformedTools: 0,
    providerRuntimePerformedTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
  }
  const counts = report.counts ?? {}
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${counts[key]}`)
    }
  }

  const requiredTrueBooleans = [
    'all21ControlledRouteExecutionSmokePassed',
    'all21ToolsCovered',
    'all21ToolsReturnedHttp200',
    'all21ControlledAdaptersInvoked',
    'cpuStaticControlledAdaptersExecuted',
    'browserRuntimeControlledAdaptersExecuted',
    'gpuModelControlledAdaptersInvoked',
    'normalizedExternalAgentExecutionStatesReturned',
    'normalizedExternalAgentToolCallResultsReturned',
    'normalizedExternalAgentToolCallResultsMatchStates',
    'normalizedExternalAgentToolCallResultsPreserveSafetyGates',
    'thirteenToolsReturnExecutableState',
    'eightGpuModelToolsReturnBlockedWithReasonState',
    'agentCanCallAll21ControlledRoutesNow',
    'agentCanExecuteRealRuntimeFor13ToolsNow',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
  ]
  const requiredFalseBooleans = [
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'agentCanExecuteRealRuntimeForAll21ToolsNow',
    'gpuModelRuntimeProofAcceptedNow',
    'workerExecutionApprovedNow',
    'workerExecutionPerformed',
    'workerDispatchApprovedNow',
    'workerDispatchPerformed',
    'providerRuntimeApprovedNow',
    'providerRuntimePerformed',
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
  const booleans = report.booleans ?? {}
  for (const key of requiredTrueBooleans) {
    if (booleans[key] !== true) fail(`${label}_boolean_not_true:${key}`)
  }
  for (const key of requiredFalseBooleans) {
    if (booleans[key] !== false) fail(`${label}_boolean_not_false:${key}`)
  }

  const rows = Array.isArray(report.results) ? report.results : []
  if (rows.length !== 21) {
    fail(`${label}_result_count_mismatch:${rows.length}`)
    return
  }
  for (const toolId of allTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_route_result:${toolId}`)
      continue
    }
    const normalized = row.externalAgentToolCallResult ?? {}
    if (row.statusCode !== 200) fail(`${label}_${toolId}_status_not_200`)
    if (row.ok !== true) fail(`${label}_${toolId}_ok_not_true`)
    if (row.controlledAdapterInvokedNow !== true) {
      fail(`${label}_${toolId}_adapter_not_invoked`)
    }
    if (normalized.callable !== true) {
      fail(`${label}_${toolId}_normalized_callable_not_true`)
    }
    if (normalized.routeExecutionPerformed !== true) {
      fail(`${label}_${toolId}_normalized_route_execution_not_true`)
    }
    if (normalized.gpuRuntimeShouldStartNow !== false) {
      fail(`${label}_${toolId}_normalized_gpu_start_not_false`)
    }
    if (normalized.outputAccess?.publicArtifactCreated !== false) {
      fail(`${label}_${toolId}_normalized_public_artifact_not_false`)
    }
    if (normalized.outputAccess?.signedUrlCreated !== false) {
      fail(`${label}_${toolId}_normalized_signed_url_not_false`)
    }
    if (gpuModelTools.includes(toolId)) {
      if (row.externalAgentExecutionState !== 'blocked_with_reason') {
        fail(`${label}_${toolId}_gpu_state_not_blocked:${row.externalAgentExecutionState}`)
      }
      if (normalized.executable !== false) {
        fail(`${label}_${toolId}_normalized_gpu_executable_not_false`)
      }
      if (normalized.blockedWithReason !== true) {
        fail(`${label}_${toolId}_normalized_gpu_blocked_not_true`)
      }
      if (normalized.failedWithDiagnostics !== false) {
        fail(`${label}_${toolId}_normalized_gpu_failed_not_false`)
      }
      if (row.localGpuModelRuntimeExecutionPerformed !== false) {
        fail(`${label}_${toolId}_gpu_runtime_performed`)
      }
    } else {
      if (row.externalAgentExecutionState !== 'executable') {
        fail(`${label}_${toolId}_non_gpu_state_not_executable:${row.externalAgentExecutionState}`)
      }
      if (normalized.executable !== true) {
        fail(`${label}_${toolId}_normalized_non_gpu_executable_not_true`)
      }
      if (normalized.blockedWithReason !== false) {
        fail(`${label}_${toolId}_normalized_non_gpu_blocked_not_false`)
      }
      if (normalized.failedWithDiagnostics !== false) {
        fail(`${label}_${toolId}_normalized_non_gpu_failed_not_false`)
      }
      if (row.localPackageExecutionPerformed !== true) {
        fail(`${label}_${toolId}_local_package_not_executed`)
      }
      if (!row.outputSha256 || row.outputSha256.length !== 64) {
        fail(`${label}_${toolId}_missing_private_output_hash`)
      }
    }
  }
}

function checkControlledWorkerRouteSmoke(label, report) {
  if (
    report.decision !==
    'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks'
  ) {
    fail(`${label}_decision_mismatch`)
  }
  if (
    report.status !==
    'controlled_worker_claim_route_execution_passed_for_thirteen_tools_gpu_model_still_blocked'
  ) {
    fail(`${label}_status_mismatch`)
  }

  const expectedCounts = {
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    controlledWorkerRouteExecutionAttemptedTools: 13,
    controlledWorkerRouteExecutionCompletedTools: 13,
    mockQueueInsertedJobsWithProvidedEvidence: 13,
    mockWorkerClaimsCreatedWithProvidedEvidence: 13,
    mockWorkerEventsRecordedWithProvidedEvidence: 13,
    controlledCanonicalRouteExecutedToolsWithProvidedEvidence: 13,
    cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 6,
    browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 7,
    localControlledPackageExecutionPerformedToolsWithProvidedEvidence: 13,
    controlledAdapterExecutedToolsWithProvidedEvidence: 13,
    gpuModelBlockedToolsWithProvidedEvidence: 8,
    externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence: 13,
    externalAgentBroadExecutableNowTools: 0,
    workerDispatchPerformedTools: 0,
    routeExecutionPerformedTools: 13,
    toolExecutionPerformedTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (report.counts?.[key] !== value) {
      fail(`${label}_count_mismatch:${key}:expected_${value}:got_${report.counts?.[key]}`)
    }
  }

  const rows = Array.isArray(report.controlledWorkerRouteResults)
    ? report.controlledWorkerRouteResults
    : []
  if (rows.length !== 13) fail(`${label}_controlled_row_count_mismatch:${rows.length}`)
  for (const toolId of [...cpuStaticTools, ...browserRuntimeTools]) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_worker_route_tool:${toolId}`)
      continue
    }
    if (row.routeStatusCode !== 200) fail(`${label}_${toolId}_status_not_200`)
    if (row.routeOk !== true) fail(`${label}_${toolId}_ok_not_true`)
    if (row.controlledAdapterExecutedNow !== true) fail(`${label}_${toolId}_adapter_not_executed`)
    if (row.localControlledPackageExecutionPerformed !== true) fail(`${label}_${toolId}_local_package_not_executed`)
    if (row.mockQueueJobIdPresent !== true) fail(`${label}_${toolId}_missing_mock_queue_job`)
    if (row.mockWorkerClaimIdPresent !== true) fail(`${label}_${toolId}_missing_mock_worker_claim`)
    if (row.mockWorkerEventIdPresent !== true) fail(`${label}_${toolId}_missing_mock_worker_event`)
    if (!row.outputSha256 || row.outputSha256.length !== 64) {
      fail(`${label}_${toolId}_missing_private_output_hash`)
    }
    for (const key of [
      'publicArtifactCreated',
      'signedUrlCreated',
      'gpuRuntimeShouldStartNow',
      'workerDispatchPerformed',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
  }

  const blocked = Array.isArray(report.blockedGpuModelResults)
    ? report.blockedGpuModelResults
    : []
  if (blocked.length !== 8) fail(`${label}_blocked_gpu_count_mismatch:${blocked.length}`)
  for (const toolId of gpuModelTools) {
    const row = blocked.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_blocked_gpu_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${toolId}_blocked_status_not_409`)
    if (row.blocked !== true) fail(`${label}_${toolId}_blocked_not_true`)
    if (row.gpuRuntimeShouldStartNow !== false) fail(`${label}_${toolId}_gpu_start_not_false`)
    if (row.agentCanExecuteToolsNow !== false) fail(`${label}_${toolId}_agent_execution_not_false`)
  }
}

for (const file of requiredFiles) read(file)
checkPackageJson()

const docs = json(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md',
)
const routeSmoke = json(
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
)
const gpuHarness = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
)
const gpuProofRefBridge = json(
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
)
const executionGate = json(
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
)
const controlledWorkerRouteSmoke = json(
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
)
const gpuInstallProof = json(
  'docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json',
)

if (
  gpuInstallProof.decision !==
  'ai_graphics_gpu_model_install_build_targets_prepared_with_warnings'
) {
  fail(`gpu_install_proof_decision_mismatch:${gpuInstallProof.decision}`)
}
if (gpuInstallProof.booleans?.all8GpuModelInstallProofTargetsBuiltLocally !== true) {
  fail('gpu_install_proof_all8_not_built_locally')
}
if (gpuInstallProof.booleans?.nativeGpuRuntimeStillRequired !== true) {
  fail('gpu_install_proof_native_runtime_not_required')
}
for (const toolId of gpuModelTools) {
  const toolRow = Array.isArray(gpuInstallProof.tools)
    ? gpuInstallProof.tools.find((row) => row.toolId === toolId)
    : undefined
  if (!toolRow) {
    fail(`gpu_install_proof_missing_tool:${toolId}`)
    continue
  }
  if (!arrayMatches(toolRow.profiles, gpuModelInstallProofProfiles[toolId])) {
    fail(`gpu_install_proof_profiles_mismatch:${toolId}:${JSON.stringify(toolRow.profiles)}`)
  }
  const evidenceRows = Array.isArray(gpuInstallProof.localBuildEvidence)
    ? gpuInstallProof.localBuildEvidence.filter((row) => (
      toolRow.profiles?.includes(row.profileId)
    ))
    : []
  if (!evidenceRows.some((row) => row.status === 'passed')) {
    fail(`gpu_install_proof_no_passed_build_evidence:${toolId}`)
  }
  if (!evidenceRows.some((row) => row.importSmokeStatus === 'passed')) {
    fail(`gpu_install_proof_no_passed_import_smoke:${toolId}`)
  }
}

const sam2HarnessRow = Array.isArray(
  gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows,
)
  ? gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows.find(
    (row) => row.toolId === 'sam2',
  )
  : undefined
if (!sam2HarnessRow) {
  fail('gpu_harness_missing_sam2_row')
} else {
  const sam2NativeRequirement = Array.isArray(sam2HarnessRow.localInputRequirements)
    ? sam2HarnessRow.localInputRequirements.find(
      (entry) => entry.key === 'nativeCudaRuntime',
    )
    : undefined
  if (
    !String(sam2NativeRequirement?.description ?? '').includes(
      'one approved private source frame',
    )
  ) {
    fail('gpu_harness_sam2_missing_private_source_frame_requirement')
  }
  if (
    JSON.stringify(sam2HarnessRow).includes(
      'Current script uses an approved generated fixture only',
    )
  ) {
    fail('gpu_harness_sam2_still_describes_generated_fixture_only')
  }
}

const sam2RunnerSource = read('server/workers/masks/sam2-execution-runner.ts')
for (const requiredSam2Token of [
  'sam2_source_frame_missing',
  "'--source-image-path'",
  "APPROVED_PRIVATE_SOURCE_FRAME_ENABLED: 'true'",
  'privateSourceFrameUsed: true',
]) {
  if (!sam2RunnerSource.includes(requiredSam2Token)) {
    fail(`sam2_runner_missing_readiness_token:${requiredSam2Token}`)
  }
}
if (sam2RunnerSource.includes('generatedFixtureOnly: true')) {
  fail('sam2_runner_still_claims_generated_fixture_only')
}

const sam2RuntimeSource = read('docker/prod/sam2-runtime/sam2_runtime_local.py')
for (const requiredSam2RuntimeToken of [
  'parser.add_argument("--source-image-path", required=True)',
  'APPROVED_PRIVATE_SOURCE_FRAME_ENABLED',
  'create_source_frame_sequence',
  'privateSourceFrameUsed',
]) {
  if (!sam2RuntimeSource.includes(requiredSam2RuntimeToken)) {
    fail(`sam2_runtime_missing_readiness_token:${requiredSam2RuntimeToken}`)
  }
}
if (sam2RuntimeSource.includes('create_fixture_frames')) {
  fail('sam2_runtime_still_uses_generated_fixture_frame_builder')
}

if (docs.fastestGpuModelUnlockCandidate?.toolId !== 'kornia') {
  fail('fastest_gpu_unlock_candidate_not_kornia')
}
if (
  docs.fastestGpuModelUnlockCandidate?.expectedCurrentHostBlockerWhenNoNvidiaGpuIsAttached !==
  'gpu_model_python_package_missing'
) {
  fail('fastest_gpu_unlock_candidate_missing_expected_python_package_blocker')
}
if (
  !String(docs.fastestGpuModelUnlockCandidate?.nextExactCommand ?? '').includes(
    canonicalGpuWorkerProofImage,
  )
) {
  fail('fastest_gpu_unlock_candidate_not_using_canonical_image')
}
if (
  docs.fastestGpuModelUnlockCandidate?.nextExactContainerBuildCommand !==
  canonicalGpuWorkerProofImageBuildCommand
) {
  fail('fastest_gpu_unlock_candidate_container_build_command_mismatch')
}
if (
  !String(docs.fastestGpuModelUnlockCandidate?.nextExactCommand ?? '').includes(
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  )
) {
  fail('fastest_gpu_unlock_candidate_missing_result_out')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate?.nextExactControlledRouteCommand ?? '',
  ).includes('ai-graphics:external-agent-all21-controlled-route-execution-smoke')
) {
  fail('fastest_gpu_unlock_candidate_missing_controlled_route_command')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate?.nextExactProofRefBridgeCommand ?? '',
  ).includes('ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge')
) {
  fail('fastest_gpu_unlock_candidate_missing_proof_ref_bridge_command')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate?.nextExactProofRefBridgeCommand ?? '',
  ).includes('--local-runtime-proof-result')
) {
  fail('fastest_gpu_unlock_candidate_proof_ref_bridge_missing_private_result_flag')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate
      ?.nextExactReadinessWithPrivateProofCommand ?? '',
  ).includes('ai-graphics:external-agent-execution-readiness')
) {
  fail('fastest_gpu_unlock_candidate_missing_private_proof_readiness_command')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate
      ?.nextExactReadinessWithPrivateProofCommand ?? '',
  ).includes('--local-runtime-proof-result')
) {
  fail('fastest_gpu_unlock_candidate_readiness_command_missing_private_result_flag')
}
if (
  !String(
    docs.fastestGpuModelUnlockCandidate
      ?.nextExactCurrentHostPreflightCommand ?? '',
  ).includes('--detect-host')
) {
  fail('fastest_gpu_unlock_candidate_missing_current_host_preflight_command')
}
for (const flag of [
  '--scoped-gpu-tool kornia',
  '--scoped-gpu-runtime-container-image',
  '--scoped-gpu-runtime-container-platform',
  '--scoped-gpu-allow-cpu-tensor-runtime',
  '--scoped-gpu-output-dir',
  '--scoped-gpu-source-image',
]) {
  if (
    !String(
      docs.fastestGpuModelUnlockCandidate?.nextExactControlledRouteCommand ?? '',
    ).includes(flag)
  ) {
    fail(`fastest_gpu_unlock_candidate_controlled_route_command_missing:${flag}`)
  }
}

checkMountedControlledRouteSmoke('route_smoke', routeSmoke)
checkControlledWorkerRouteSmoke('controlled_worker_route_smoke', controlledWorkerRouteSmoke)
checkReport('docs', docs)
const live = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', live)
for (const caseDef of scopedProofFixtureCases) {
  const scopedProofPath = createScopedPrivateProofFixture(caseDef)
  const liveWithPrivateProof = execFileJson('npm', [
    'run',
    '--silent',
    runScriptName,
    '--',
    '--local-runtime-proof-result',
    scopedProofPath,
  ])
  if (liveWithPrivateProof.status !== privateProofStatus) {
    fail(`synthetic_private_proof_status_mismatch:${caseDef.toolId}:${liveWithPrivateProof.status}`)
  }
  if (liveWithPrivateProof.counts?.agentExecutableTools !== 14) {
    fail(`synthetic_private_proof_executable_count_mismatch:${caseDef.toolId}:${liveWithPrivateProof.counts?.agentExecutableTools}`)
  }
  if (liveWithPrivateProof.counts?.gpuToolsWithValidRuntimeProof !== 1) {
    fail(`synthetic_private_proof_gpu_valid_count_not_one:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.counts?.gpuModelProofRefBridgeAcceptedTools !== 1) {
    fail(`synthetic_private_proof_bridge_accepted_count_not_one:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.counts?.gpuModelProofRefBridgeBlockedTools !== 7) {
    fail(`synthetic_private_proof_bridge_blocked_count_not_seven:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.counts?.blockedWithReasonTools !== 7) {
    fail(`synthetic_private_proof_blocked_count_not_seven:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.counts?.failedWithDiagnosticsTools !== 0) {
    fail(`synthetic_private_proof_failed_count_not_zero:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.counts?.gpuRuntimeShouldStartNowTools !== 0) {
    fail(`synthetic_private_proof_readiness_started_gpu:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.booleans?.privateLocalRuntimeProofResultSupplied !== true) {
    fail(`synthetic_private_proof_result_not_marked_supplied:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.booleans?.agentCanExecuteGpuModelToolsNow !== true) {
    fail(`synthetic_private_proof_gpu_tools_not_marked_executable:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.booleans?.toolExecutionApprovedForGpuModelToolsNow !== true) {
    fail(`synthetic_private_proof_gpu_tool_execution_not_marked_approved:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.booleans?.agentCanExecuteAll21ToolsNow !== false) {
    fail(`synthetic_private_proof_claims_all21_executable:${caseDef.toolId}`)
  }
  if (liveWithPrivateProof.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail(`synthetic_private_proof_idle_gpu_start_claim:${caseDef.toolId}`)
  }
  const privateProofRows = Array.isArray(liveWithPrivateProof.toolReadinessRows)
    ? liveWithPrivateProof.toolReadinessRows
    : []
  const privateProofTool = privateProofRows.find((row) => row.toolId === caseDef.toolId)
  if (!privateProofTool) {
    fail(`synthetic_private_proof_missing_row:${caseDef.toolId}`)
  } else {
    if (privateProofTool.readinessState !== 'executable') {
      fail(`synthetic_private_proof_not_executable:${caseDef.toolId}:${privateProofTool.readinessState}`)
    }
    if (privateProofTool.executable !== true) {
      fail(`synthetic_private_proof_executable_false:${caseDef.toolId}`)
    }
    if (privateProofTool.routeSubmissionReadyWithAcceptedPrivateProof !== true) {
      fail(`synthetic_private_proof_route_submission_not_ready:${caseDef.toolId}`)
    }
    if (
      privateProofTool.proofRefBridgeStatus !==
      'accepted_private_local_runtime_proof_ready_for_proof_ref_route_submission'
    ) {
      fail(`synthetic_private_proof_bridge_status:${caseDef.toolId}:${privateProofTool.proofRefBridgeStatus}`)
    }
    if (privateProofTool.blockingPrerequisite !== null) {
      fail(`synthetic_private_proof_unexpected_blocker:${caseDef.toolId}:${privateProofTool.blockingPrerequisite}`)
    }
    if (privateProofTool.gpuRuntimeShouldStartNow !== false) {
      fail(`synthetic_private_proof_idle_gpu_start_claim:${caseDef.toolId}`)
    }
    if (
      privateProofTool.sourceGpuRuntimeShouldStartDuringScopedProof !==
      caseDef.gpuShouldStartDuringScopedProof
    ) {
      fail(`synthetic_private_proof_scoped_gpu_start_mismatch:${caseDef.toolId}`)
    }
  }
  for (const row of privateProofRows.filter((item) => (
    gpuModelTools.includes(item.toolId) && item.toolId !== caseDef.toolId
  ))) {
    if (row.readinessState !== 'blocked_with_reason') {
      fail(`synthetic_private_proof_unexpected_non_target_gpu_state:${caseDef.toolId}:${row.toolId}:${row.readinessState}`)
    }
  }
}
const liveHost = JSON.parse(exec(`npm run --silent ${runScriptName} -- --detect-host`))
if (liveHost.executionScope?.currentHostGpuProofPreflightRequested !== true) {
  fail('live_host_preflight_not_requested')
}
if (liveHost.booleans?.currentHostGpuProofPreflightRequested !== true) {
  fail('live_host_boolean_preflight_not_requested')
}
if (liveHost.sourceEvidence?.currentHostGpuProofPreflight?.accepted !== true) {
  fail('live_host_preflight_source_not_accepted')
}
if (
  typeof liveHost.executionScope?.currentHostEligibleForGpuProof !== 'boolean'
) {
  fail('live_host_eligible_not_boolean')
}
const liveHostBlockers = liveHost.executionScope?.currentHostGpuProofBlockers
if (!Array.isArray(liveHostBlockers)) {
  fail('live_host_blockers_not_array')
} else if (
  liveHost.executionScope.currentHostEligibleForGpuProof === false &&
  liveHostBlockers.length === 0
) {
  fail('live_host_ineligible_without_blockers')
}
if (
  liveHost.counts?.currentHostGpuProofBlockers !==
  (Array.isArray(liveHostBlockers) ? liveHostBlockers.length : undefined)
) {
  fail('live_host_blocker_count_mismatch')
}

const cli = read('server/cli/ai-graphics-external-agent-execution-readiness.ts')
for (const phrase of [
  '--local-runtime-proof-result',
  '--write-records cannot be combined with --local-runtime-proof-result',
  '--write-records cannot be combined with --detect-host',
  'hostDetectionReadinessCommand',
  'currentHostGpuProofPreflight',
  'currentHostEligibleForGpuProof',
  'mergeGpuHarnessWithPrivateProof',
  'runJsonFileCommand',
  'controlledWorkerRouteSmoke',
  '--controlled-worker-route-smoke-packet',
  'controlledWorkerRouteEvidenceAccepted',
  'gpuModelInstallBuildTargetsPath',
  '--gpu-model-install-build-targets-packet',
  'gpuModelInstallProofForTool',
  'packageRuntimeInstallProofPrimaryProfile',
  'privateProofStatus',
  'capabilityMismatchFailureProbeAccepted',
  'nextExactReadinessWithPrivateProofCommand',
  'nextExactCurrentHostPreflightCommand',
]) {
  if (!cli.includes(phrase)) fail(`cli_missing_private_proof_phrase:${phrase}`)
}

if (routeSmoke.counts?.controlledRouteAdapterExecutedTools !== 13) {
  fail('route_smoke_executed_count_not_13')
}
if (routeSmoke.counts?.gpuModelRuntimeProofRequiredTools !== 8) {
  fail('route_smoke_gpu_proof_required_not_8')
}
if (routeSmoke.counts?.capabilityMismatchFailureProbeTools !== 1) {
  fail('route_smoke_capability_mismatch_probe_count_not_1')
}
if (routeSmoke.booleans?.capabilityMismatchFailureProbeAccepted !== true) {
  fail('route_smoke_capability_mismatch_probe_not_accepted')
}
if (
  routeSmoke.capabilityMismatchFailureProbe?.externalAgentExecutionState !==
  'failed_with_diagnostics'
) {
  fail('route_smoke_capability_mismatch_probe_state_mismatch')
}
if (
  routeSmoke.capabilityMismatchFailureProbe?.controlledAdapterInvokedNow !==
  false
) {
  fail('route_smoke_capability_mismatch_probe_invoked_adapter')
}
if (gpuHarness.counts?.localRuntimeExecutionPerformedTools !== 0) {
  fail('gpu_harness_default_executed_runtime')
}
if (gpuHarness.counts?.gpuRuntimeShouldStartNowTools !== 0) {
  fail('gpu_harness_default_started_gpu')
}
if (gpuProofRefBridge.counts?.acceptedPrivateLocalRuntimeProofTools !== 0) {
  fail('proof_ref_bridge_default_accepted_private_proof')
}
if (gpuProofRefBridge.counts?.routeSubmissionReadyWithAcceptedPrivateProofTools !== 0) {
  fail('proof_ref_bridge_default_route_submission_ready')
}
if (executionGate.counts?.externalAgentExecutableNowTools !== 13) {
  fail('execution_gate_executable_now_not_13')
}
if (executionGate.booleans?.agentCanExecuteAll21ToolsNow !== false) {
  fail('execution_gate_claims_all21_execution')
}
if (controlledWorkerRouteSmoke.counts?.controlledWorkerRouteExecutionCompletedTools !== 13) {
  fail('controlled_worker_route_smoke_completed_count_not_13')
}
if (controlledWorkerRouteSmoke.counts?.mockWorkerClaimsCreatedWithProvidedEvidence !== 13) {
  fail('controlled_worker_route_smoke_claim_count_not_13')
}
if (controlledWorkerRouteSmoke.counts?.mockWorkerEventsRecordedWithProvidedEvidence !== 13) {
  fail('controlled_worker_route_smoke_event_count_not_13')
}
if (controlledWorkerRouteSmoke.counts?.gpuModelBlockedToolsWithProvidedEvidence !== 8) {
  fail('controlled_worker_route_smoke_gpu_blocked_not_8')
}
if (controlledWorkerRouteSmoke.booleans?.workerDispatchPerformed !== false) {
  fail('controlled_worker_route_smoke_worker_dispatch_performed')
}

for (const toolId of allTools) {
  if (!JSON.stringify(docs).includes(`"${toolId}"`)) fail(`docs_missing_tool:${toolId}`)
  if (!markdown.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}
for (const phrase of [
  'callable',
  'executable',
  'blocked_with_reason',
  'failed_with_diagnostics',
  'GPU runtime is on-demand only',
  '13 tools execute controlled local adapters now',
  'mock worker-claim-to-canonical-route smoke',
  'Install Proof Linkage',
  'gpu-model-install-build-targets',
  'install/import-smoke proof is not runtime execution proof',
  'Execution Scope',
  'Fastest GPU/Model Unlock Candidate',
  'Next controlled route command',
  'Next proof-ref bridge command',
  'Next direct readiness command with private proof',
  'Next current-host preflight command',
  'Failure Diagnostics Guard',
  'failed_with_diagnostics',
  'gpu_model_python_package_missing',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_phrase:${phrase}`)
}

for (const pattern of forbiddenPatterns) {
  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json',
    'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md',
  ]) {
    if (pattern.test(read(file))) fail(`forbidden_claim:${file}:${pattern}`)
  }
}

try {
  exec('git diff --quiet -- package-lock.json')
} catch {
  fail('package_lock_changed')
}

const trackedLocalArtifacts = exec('git ls-files .local-artifacts')
if (trackedLocalArtifacts.trim()) fail('local_artifacts_tracked')

const changedFiles = [
  ...exec('git diff --name-only HEAD').split('\n'),
  ...exec('git ls-files --others --exclude-standard').split('\n'),
].filter(Boolean)
for (const file of changedFiles) {
  if (file === 'package-lock.json') fail('package_lock_changed_in_diff')
  if (generatedArtifactPattern.test(file)) {
    fail(`generated_artifact_path_changed:${file}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  totalToolsCovered: docs.counts.totalToolsCovered,
  agentCallableTools: docs.counts.agentCallableTools,
  agentExecutableTools: docs.counts.agentExecutableTools,
  gpuToolsWithValidRuntimeProof: docs.counts.gpuToolsWithValidRuntimeProof,
  blockedWithReasonTools: docs.counts.blockedWithReasonTools,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  packageLockUnchanged: true,
}, null, 2))
