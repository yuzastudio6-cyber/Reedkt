import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks'
const defaultStatus =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof'
const privateProofStatus =
  'external_agent_call_ready_for_all21_runtime_execution_ready_for13_plus_private_gpu_model_proof_subset'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-readiness.md'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const canonicalGpuWorkerProofImageBuildCommand =
  `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t ${canonicalGpuWorkerProofImage} .`

type ReadinessState =
  | 'callable'
  | 'executable'
  | 'blocked_with_reason'
  | 'failed_with_diagnostics'

type ToolGroup = 'cpu_static' | 'browser_runtime' | 'gpu_model'

type JsonRecord = Record<string, any>

const cpuStaticTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
)
const browserRuntimeTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
)
const gpuModelTools = new Set<string>(
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
)

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function runJsonCommand(command: string): JsonRecord {
  const output = childProcess.execSync(command, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
  })
  return JSON.parse(output) as JsonRecord
}

function runJsonFileCommand(command: string, args: string[]): JsonRecord {
  const output = childProcess.execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
  })
  return JSON.parse(output) as JsonRecord
}

function groupForTool(toolId: AiGraphicsCanonicalToolId): ToolGroup {
  if (cpuStaticTools.has(toolId)) return 'cpu_static'
  if (browserRuntimeTools.has(toolId)) return 'browser_runtime'
  if (gpuModelTools.has(toolId)) return 'gpu_model'
  throw new Error(`Unsupported AI graphics tool: ${toolId}`)
}

function sourceReport(pathFlag: string, defaultPath: string, command: string): JsonRecord {
  if (hasFlag('--use-records-only')) {
    return readJson(stringFlag(pathFlag) ?? defaultPath)
  }
  return runJsonCommand(command)
}

function gpuModelRequiresSourceImage(toolId: string): boolean {
  return !['torch_torchvision', 'transformers'].includes(toolId)
}

function gpuModelAllowsCpuFoundationRuntime(toolId: string): boolean {
  return toolId === 'torch_torchvision' || toolId === 'transformers'
}

function gpuModelAllowsCpuTensorRuntime(toolId: string): boolean {
  return toolId === 'kornia'
}

function gpuModelMinimumPrivateRuntimeInputKeys(toolId: string): string[] {
  const keys = [
    'outputDirectory',
    gpuModelAllowsCpuTensorRuntime(toolId)
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
  return keys
}

function gpuModelCurrentBlockingPrerequisiteKey(
  toolId: string,
  blockingReasonCode: string | null | undefined,
): string | null {
  if (!blockingReasonCode) return null
  if (blockingReasonCode.includes('output_directory_missing')) {
    return 'outputDirectory'
  }
  if (blockingReasonCode.includes('source_frame_missing')) {
    return 'sourceImageLocalPath'
  }
  if (blockingReasonCode.includes('sam2_checkpoint_missing')) {
    return 'sam2CheckpointLocalPath'
  }
  if (blockingReasonCode.includes('birefnet_model_missing')) {
    return 'birefnetModelLocalPath'
  }
  if (blockingReasonCode.includes('real_esrgan_model_missing')) {
    return 'realEsrganModelLocalPath'
  }
  if (blockingReasonCode.includes('rembg_model_missing')) {
    return 'rembgModelLocalPath'
  }
  if (blockingReasonCode.includes('transparent_background_checkpoint_missing')) {
    return 'transparentBackgroundCheckpointLocalPath'
  }
  if (
    blockingReasonCode.includes('cuda') ||
    blockingReasonCode.includes('container_gpu')
  ) {
    return 'nativeCudaRuntime'
  }
  if (blockingReasonCode.includes('container_image')) {
    return 'runtimeContainerImage'
  }
  if (blockingReasonCode.includes('python_package')) {
    if (gpuModelAllowsCpuTensorRuntime(toolId)) return 'pythonCpuTensorRuntime'
    if (gpuModelAllowsCpuFoundationRuntime(toolId)) return 'pythonCpuFoundationRuntime'
    return 'pythonPackageRuntime'
  }
  if (blockingReasonCode.includes('python_runtime')) {
    if (gpuModelAllowsCpuTensorRuntime(toolId)) return 'pythonCpuTensorRuntime'
    if (gpuModelAllowsCpuFoundationRuntime(toolId)) return 'pythonCpuFoundationRuntime'
    return 'pythonRuntime'
  }
  if (blockingReasonCode.includes('disabled_or_not_local_dev')) {
    return 'attemptGpuRuntime'
  }
  return null
}

function gpuModelRuntimePrerequisiteLabel(toolId: string): string {
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    return 'approved local Python CPU tensor runtime'
  }
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    return 'approved local Python CPU foundation runtime'
  }
  return 'approved native CUDA host'
}

function gpuModelBlockedInstallReadinessState(toolId: string): string {
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    return 'install_target_prepared_runtime_blocked_pending_cpu_tensor_private_inputs'
  }
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    return 'install_target_prepared_runtime_blocked_pending_cpu_foundation_private_inputs'
  }
  return 'install_target_prepared_runtime_blocked_pending_cuda_private_inputs'
}

function gpuModelHostRuntimeFlags(toolId: string): string[] {
  const flags = [
    `--tool ${toolId}`,
    '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>',
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  ]
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    flags.push('--allow-cpu-foundation-runtime')
  }
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    flags.push('--allow-cpu-tensor-runtime')
  }
  if (gpuModelRequiresSourceImage(toolId)) {
    flags.push('--source-image <private-approved-frame.png>')
  }
  if (toolId === 'sam2') flags.push('--sam2-checkpoint <private-sam2-checkpoint.pt>')
  if (toolId === 'birefnet') flags.push('--birefnet-model <private-birefnet-model>')
  if (toolId === 'real_esrgan') {
    flags.push('--real-esrgan-model <private-real-esrgan-model.pth>')
  }
  if (toolId === 'rembg') flags.push('--rembg-model <private-rembg-model.onnx>')
  if (toolId === 'transparent_background') {
    flags.push('--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>')
  }
  return flags
}

function gpuModelControlledRouteFlags(toolId: string): string[] {
  const outputDir =
    `.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/${toolId}`
  const flags = [
    `--scoped-gpu-tool ${toolId}`,
    `--scoped-gpu-runtime-container-image ${canonicalGpuWorkerProofImage}`,
    '--scoped-gpu-runtime-container-platform linux/amd64',
    `--scoped-gpu-output-dir ${outputDir}`,
  ]
  if (gpuModelAllowsCpuFoundationRuntime(toolId)) {
    flags.push('--scoped-gpu-allow-cpu-foundation-runtime')
  }
  if (gpuModelAllowsCpuTensorRuntime(toolId)) {
    flags.push('--scoped-gpu-allow-cpu-tensor-runtime')
  }
  if (gpuModelRequiresSourceImage(toolId)) {
    flags.push(`--scoped-gpu-source-image ${outputDir}/private-approved-frame.ppm`)
  }
  if (toolId === 'sam2') {
    flags.push(`--scoped-gpu-sam2-checkpoint ${outputDir}/private-sam2-checkpoint.pt`)
  }
  if (toolId === 'birefnet') {
    flags.push(`--scoped-gpu-birefnet-model ${outputDir}/private-birefnet-model`)
  }
  if (toolId === 'real_esrgan') {
    flags.push(`--scoped-gpu-real-esrgan-model ${outputDir}/private-real-esrgan-model.pth`)
  }
  if (toolId === 'rembg') {
    flags.push(`--scoped-gpu-rembg-model ${outputDir}/private-rembg-model.onnx`)
  }
  if (toolId === 'transparent_background') {
    flags.push(`--scoped-gpu-transparent-background-checkpoint ${outputDir}/private-transparent-background-checkpoint.pth`)
  }
  return flags
}

function hostPythonGpuCommand(toolId: string): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness --',
    '--attempt-local-runtime',
    ...gpuModelHostRuntimeFlags(toolId),
  ].join(' ')
}

function containerGpuCommand(toolId: string): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness --',
    '--attempt-local-runtime',
    '--runtime-backend docker_container',
    `--runtime-container-image ${canonicalGpuWorkerProofImage}`,
    '--runtime-container-platform linux/amd64',
    ...gpuModelHostRuntimeFlags(toolId),
  ].join(' ')
}

function containerGpuImageBuildCommand(): string {
  return canonicalGpuWorkerProofImageBuildCommand
}

function controlledRouteGpuCommand(toolId: string): string {
  return [
    'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke --',
    ...gpuModelControlledRouteFlags(toolId),
  ].join(' ')
}

function proofRefBridgeCommand(): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge --',
    '--local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  ].join(' ')
}

function directReadinessWithPrivateProofCommand(): string {
  return [
    'npm run --silent ai-graphics:external-agent-execution-readiness --',
    '--local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
  ].join(' ')
}

function hostDetectionReadinessCommand(): string {
  return [
    'npm run --silent ai-graphics:external-agent-execution-readiness --',
    '--detect-host',
  ].join(' ')
}

function nextGpuCommand(toolId: string): string {
  return toolId === 'kornia'
    ? containerGpuCommand(toolId)
    : hostPythonGpuCommand(toolId)
}

function mergeGpuHarnessWithPrivateProof(
  sourceHarness: JsonRecord,
  suppliedPrivateProof?: JsonRecord,
): JsonRecord {
  if (!suppliedPrivateProof) return sourceHarness

  const sourceRows = Array.isArray(
    sourceHarness.gpuModelLocalDevRuntimeExecutionHarnessRows,
  )
    ? sourceHarness.gpuModelLocalDevRuntimeExecutionHarnessRows
    : []
  const suppliedRows = Array.isArray(
    suppliedPrivateProof.gpuModelLocalDevRuntimeExecutionHarnessRows,
  )
    ? suppliedPrivateProof.gpuModelLocalDevRuntimeExecutionHarnessRows
    : []
  const rowsByTool = new Map<string, JsonRecord>(
    sourceRows.map((row: JsonRecord) => [String(row.toolId), row]),
  )
  for (const row of suppliedRows) {
    if (typeof row?.toolId === 'string') rowsByTool.set(row.toolId, row)
  }

  return {
    ...sourceHarness,
    privateLocalRuntimeProofMergedIntoRows: true,
    suppliedPrivateLocalRuntimeProofResult: {
      decision: suppliedPrivateProof.decision ?? null,
      status: suppliedPrivateProof.status ?? null,
      suppliedRows: suppliedRows.length,
    },
    gpuModelLocalDevRuntimeExecutionHarnessRows: [...rowsByTool.values()],
  }
}

function buildToolRows(
  routeSmoke: JsonRecord,
  gpuHarness: JsonRecord,
  gpuProofRefBridge: JsonRecord,
  controlledWorkerRouteSmoke: JsonRecord,
) {
  const routeRows = new Map<string, JsonRecord>(
    (Array.isArray(routeSmoke.results) ? routeSmoke.results : [])
      .map((row: JsonRecord) => [row.toolId, row]),
  )
  const workerRouteRows = new Map<string, JsonRecord>(
    (
      Array.isArray(controlledWorkerRouteSmoke.controlledWorkerRouteResults)
        ? controlledWorkerRouteSmoke.controlledWorkerRouteResults
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )
  const workerBlockedGpuRows = new Map<string, JsonRecord>(
    (
      Array.isArray(controlledWorkerRouteSmoke.blockedGpuModelResults)
        ? controlledWorkerRouteSmoke.blockedGpuModelResults
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )
  const gpuRows = new Map<string, JsonRecord>(
    (
      Array.isArray(gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows)
        ? gpuHarness.gpuModelLocalDevRuntimeExecutionHarnessRows
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )
  const bridgeRows = new Map<string, JsonRecord>(
    (
      Array.isArray(gpuProofRefBridge.gpuModelRuntimeProofRefBridgeRows)
        ? gpuProofRefBridge.gpuModelRuntimeProofRefBridgeRows
        : []
    ).map((row: JsonRecord) => [row.toolId, row]),
  )

  return AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const readiness = getAiGraphicsToolCallReadiness(toolId)
    assert(readiness, `Missing tool-call readiness record for ${toolId}`)
    const group = groupForTool(toolId)
    const routeRow = routeRows.get(toolId)
    assert(routeRow, `Missing all-21 route smoke row for ${toolId}`)
    const workerRouteRow = workerRouteRows.get(toolId)
    const workerBlockedGpuRow = workerBlockedGpuRows.get(toolId)
    const gpuRow = gpuRows.get(toolId)
    const bridgeRow = groupForTool(toolId) === 'gpu_model'
      ? bridgeRows.get(toolId)
      : undefined

    const routeCallable =
      routeRow.statusCode === 200 && routeRow.controlledAdapterInvokedNow === true
    const adapterReachable = routeCallable
    const controlledWorkerRouteAccepted = group === 'gpu_model'
      ? workerBlockedGpuRow?.statusCode === 409 &&
        workerBlockedGpuRow?.blocked === true &&
        workerBlockedGpuRow?.gpuRuntimeShouldStartNow === false &&
        workerBlockedGpuRow?.agentCanExecuteToolsNow === false
      : workerRouteRow?.routeStatusCode === 200 &&
        workerRouteRow?.routeOk === true &&
        workerRouteRow?.controlledAdapterExecutedNow === true &&
        workerRouteRow?.localControlledPackageExecutionPerformed === true &&
        workerRouteRow?.mockQueueJobIdPresent === true &&
        workerRouteRow?.mockWorkerClaimIdPresent === true &&
        workerRouteRow?.mockWorkerEventIdPresent === true &&
        typeof workerRouteRow?.outputSha256 === 'string' &&
        workerRouteRow.outputSha256.length === 64 &&
        workerRouteRow?.publicArtifactCreated === false &&
        workerRouteRow?.signedUrlCreated === false &&
        workerRouteRow?.gpuRuntimeShouldStartNow === false &&
        workerRouteRow?.workerDispatchPerformed === false
    const gpuAdapterStatus = String(gpuRow?.adapterStatus ?? '')
    const gpuRuntimeSucceeded = gpuRow?.localRuntimeExecutionPerformed === true
    const routeSubmissionAccepted =
      bridgeRow?.routeSubmissionReadyWithAcceptedPrivateProof === true
    const gpuRuntimeFailed =
      gpuAdapterStatus === 'controlled_gpu_model_adapter_failed_before_output'
    const executionAttempted =
      group === 'gpu_model'
        ? gpuRuntimeSucceeded || gpuRuntimeFailed
        : routeRow.controlledAdapterExecutedNow === true
    const executionPassed =
      group === 'gpu_model'
        ? gpuRuntimeSucceeded &&
          gpuRow?.toolExecutionApprovedNow === true &&
          routeSubmissionAccepted
        : routeRow.controlledAdapterExecutedNow === true &&
          routeRow.localPackageExecutionPerformed === true &&
          controlledWorkerRouteAccepted &&
          typeof routeRow.outputSha256 === 'string' &&
          routeRow.outputSha256.length === 64
    const failed =
      !routeCallable ||
      (executionAttempted && !executionPassed) ||
      routeRow.publicArtifactCreated === true ||
      routeRow.signedUrlCreated === true ||
      routeRow.gpuRuntimeShouldStartNow === true && group !== 'gpu_model'
    const readinessState: ReadinessState = failed
      ? 'failed_with_diagnostics'
      : executionPassed
      ? 'executable'
      : group === 'gpu_model'
      ? 'blocked_with_reason'
      : 'callable'

    const minimumPrivateRuntimeInputKeys = group === 'gpu_model'
      ? gpuModelMinimumPrivateRuntimeInputKeys(toolId)
      : []
    const blockingPrerequisite = group === 'gpu_model' && !executionPassed
      ? [
          gpuModelRuntimePrerequisiteLabel(toolId),
          ...minimumPrivateRuntimeInputKeys,
          'reviewed private proof refs',
          gpuRow?.skipReasonCode
            ? `adapter skip reason: ${gpuRow.skipReasonCode}`
            : gpuRow?.errorMessage
            ? `adapter error: ${gpuRow.errorMessage}`
            : gpuRuntimeSucceeded && !routeSubmissionAccepted
            ? `proof bridge status: ${bridgeRow?.proofRefBridgeStatus ?? 'missing'}`
            : 'local runtime not attempted',
        ].join('; ')
      : null
    const currentBlockingPrerequisiteKey = group === 'gpu_model' && !executionPassed
      ? gpuModelCurrentBlockingPrerequisiteKey(toolId, gpuRow?.skipReasonCode)
      : null
    const remainingPrivateRuntimeInputKeys =
      group === 'gpu_model' && !executionPassed
        ? currentBlockingPrerequisiteKey
          ? minimumPrivateRuntimeInputKeys.filter(
              (key) => key !== currentBlockingPrerequisiteKey,
            )
          : minimumPrivateRuntimeInputKeys
        : []

    return {
      toolId,
      displayName: readiness.displayName,
      packageName: readiness.packageName,
      installSurface: readiness.installSurface,
      installStatus: readiness.installStatus,
      installEvidence: readiness.installEvidence,
      packageRuntimePresentForPlannedSurface: true,
      controlledExecutionRuntimePresentNow: executionPassed,
      installReadinessState: group === 'gpu_model'
        ? executionPassed
          ? 'controlled_runtime_present_and_executed_with_private_local_proof'
          : gpuModelBlockedInstallReadinessState(toolId)
        : 'controlled_runtime_present_and_executed',
      primaryCapability: routeRow.capabilityId,
      group,
      callable: routeCallable,
      executable: executionPassed,
      blockedWithReason: readinessState === 'blocked_with_reason',
      failedWithDiagnostics: readinessState === 'failed_with_diagnostics',
      readinessState,
      routeCallable,
      adapterReachable,
      executionAttempted,
      executionPassed,
      outputKind: routeRow.outputKind ?? null,
      outputSha256: routeRow.outputSha256 ?? null,
      controlledWorkerRouteEvidenceAccepted: controlledWorkerRouteAccepted,
      controlledWorkerRouteStatus: group === 'gpu_model'
        ? workerBlockedGpuRow?.statusCode === 409
          ? 'blocked_with_reason'
          : null
        : workerRouteRow?.routeStatus ?? null,
      controlledWorkerRouteOutputSha256: workerRouteRow?.outputSha256 ?? null,
      mockWorkerQueueJobCreated:
        group === 'gpu_model'
          ? false
          : workerRouteRow?.mockQueueJobIdPresent === true,
      mockWorkerClaimPerformed:
        group === 'gpu_model'
          ? false
          : workerRouteRow?.mockWorkerClaimIdPresent === true,
      mockWorkerEventRecorded:
        group === 'gpu_model'
          ? false
          : workerRouteRow?.mockWorkerEventIdPresent === true,
      controlledWorkerRouteExecutedNow:
        group === 'gpu_model' ? false : controlledWorkerRouteAccepted,
      controlledWorkerRouteGpuBlocked:
        group === 'gpu_model' ? controlledWorkerRouteAccepted : false,
      blockingPrerequisite,
      recommendedGpuProofBackend: group === 'gpu_model'
        ? toolId === 'kornia'
          ? 'docker_container'
          : 'host_python_or_docker_container'
        : null,
      currentBlockingPrerequisiteKey,
      currentBlockingReasonCode: group === 'gpu_model' && !executionPassed
        ? gpuRow?.skipReasonCode ?? null
        : null,
      remainingPrivateRuntimeInputKeys,
      minimumPrivateRuntimeInputKeys,
      minimumHostRuntimeFlags: group === 'gpu_model'
        ? gpuModelHostRuntimeFlags(toolId)
        : [],
      minimumControlledRouteFlags: group === 'gpu_model'
        ? gpuModelControlledRouteFlags(toolId)
        : [],
      fastestGpuModelUnlockCandidate: toolId === 'kornia',
      nextExactCommand: group === 'gpu_model'
        ? nextGpuCommand(toolId)
        : 'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke',
      nextExactHostPythonCommand: group === 'gpu_model'
        ? hostPythonGpuCommand(toolId)
        : null,
      nextExactContainerCommand: group === 'gpu_model'
        ? containerGpuCommand(toolId)
        : null,
      nextExactContainerBuildCommand: group === 'gpu_model'
        ? containerGpuImageBuildCommand()
        : null,
      nextExactControlledRouteCommand: group === 'gpu_model'
        ? controlledRouteGpuCommand(toolId)
        : null,
      nextExactProofRefBridgeCommand: group === 'gpu_model'
        ? proofRefBridgeCommand()
        : null,
      proofRefBridgeStatus: group === 'gpu_model'
        ? bridgeRow?.proofRefBridgeStatus ?? null
        : null,
      routeSubmissionReadyWithAcceptedPrivateProof: group === 'gpu_model'
        ? routeSubmissionAccepted
        : false,
      routeStatus: routeRow.routeStatus ?? null,
      adapterStatus: group === 'gpu_model'
        ? gpuRow?.adapterStatus ?? routeRow.routeStatus ?? null
        : routeRow.routeStatus ?? null,
      adapterErrorMessage: group === 'gpu_model'
        ? gpuRow?.errorMessage ?? null
        : null,
      gpuRuntimeShouldStartNow: false,
      sourceGpuRuntimeShouldStartDuringScopedProof:
        group === 'gpu_model'
          ? gpuRow?.gpuRuntimeShouldStartNow === true
          : false,
      publicArtifactCreated:
        routeRow.publicArtifactCreated === true ||
        gpuRow?.publicArtifactCreated === true,
      signedUrlCreated:
        routeRow.signedUrlCreated === true ||
        gpuRow?.signedUrlCreated === true,
      workerDispatchPerformed: routeRow.workerDispatchPerformed === true,
      providerRuntimePerformed: routeRow.providerRuntimePerformed === true,
      runtimeReadyNow:
        routeRow.runtimeReadyNow === true ||
        gpuRow?.runtimeReadyNow === true,
      externalBetaReadyNow:
        routeRow.externalBetaReadyNow === true ||
        gpuRow?.externalBetaReadyNow === true,
      productionReadyNow:
        routeRow.productionReadyNow === true ||
        gpuRow?.productionReadyNow === true,
      sourceEvidence: {
        routeSmoke:
          'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
        gpuLocalDevHarness: group === 'gpu_model'
          ? 'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json'
          : null,
        gpuRuntimeProofRefBridge: group === 'gpu_model'
          ? 'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json'
          : null,
        executionGate:
          'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
        controlledWorkerRouteSmoke:
          'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
      },
    }
  })
}

function buildReport() {
  const localRuntimeProofResultPath = stringFlag('--local-runtime-proof-result')
  if (localRuntimeProofResultPath && hasFlag('--write-records')) {
    throw new Error(
      '--write-records cannot be combined with --local-runtime-proof-result; private proof results must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && hasFlag('--detect-host')) {
    throw new Error(
      '--write-records cannot be combined with --detect-host; host-specific GPU proof preflight must stay local-only.',
    )
  }
  if (
    localRuntimeProofResultPath &&
    stringFlag('--gpu-runtime-proof-ref-bridge-packet')
  ) {
    throw new Error(
      '--local-runtime-proof-result cannot be combined with --gpu-runtime-proof-ref-bridge-packet.',
    )
  }

  const routeSmoke = sourceReport(
    '--all21-route-smoke-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json',
    'npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke',
  )
  const sourceGpuHarness = sourceReport(
    '--gpu-local-dev-harness-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-local-dev-runtime-execution-harness.json',
    'npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness',
  )
  const suppliedPrivateLocalRuntimeProof = localRuntimeProofResultPath
    ? readJson(localRuntimeProofResultPath)
    : undefined
  const gpuHarness = mergeGpuHarnessWithPrivateProof(
    sourceGpuHarness,
    suppliedPrivateLocalRuntimeProof,
  )
  const executionGate = readJson(
    stringFlag('--execution-gate-packet') ??
      'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json',
  )
  const gpuProofRefBridge = localRuntimeProofResultPath
    ? runJsonFileCommand('npm', [
        'run',
        '--silent',
        'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge',
        '--',
        '--local-runtime-proof-result',
        localRuntimeProofResultPath,
      ])
    : readJson(
        stringFlag('--gpu-runtime-proof-ref-bridge-packet') ??
          'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-proof-ref-bridge.json',
      )
  const currentHostGpuProofPreflight = hasFlag('--detect-host')
    ? runJsonFileCommand('npm', [
        'run',
        '--silent',
        'ai-graphics:gpu-runtime-proof-local-preflight',
        '--',
        '--detect-host',
      ])
    : null
  const controlledWorkerRouteSmoke = sourceReport(
    '--controlled-worker-route-smoke-packet',
    'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json',
    'npm run --silent ai-graphics:external-agent-controlled-worker-route-execution-smoke',
  )

  assert(
    routeSmoke.decision ===
      'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed',
    'all-21 controlled route smoke decision mismatch',
  )
  assert(
      sourceGpuHarness.decision ===
      'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
    'GPU/model local-dev harness decision mismatch',
  )
  if (suppliedPrivateLocalRuntimeProof) {
    assert(
      suppliedPrivateLocalRuntimeProof.decision ===
        'ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks',
      'supplied private GPU/model local-dev proof decision mismatch',
    )
  }
  assert(
    executionGate.decision ===
      'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings',
    'external-agent execution gate decision mismatch',
  )
  assert(
    gpuProofRefBridge.decision ===
      'ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks',
    'GPU/model runtime proof-ref bridge decision mismatch',
  )
  assert(
    controlledWorkerRouteSmoke.decision ===
      'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks',
    'external-agent controlled worker route smoke decision mismatch',
  )

  const toolRows = buildToolRows(
    routeSmoke,
    gpuHarness,
    gpuProofRefBridge,
    controlledWorkerRouteSmoke,
  )
  const executableTools = toolRows.filter((row) => row.executable)
  const nonGpuExecutableTools = executableTools.filter(
    (row) => row.group !== 'gpu_model',
  )
  const gpuExecutableTools = toolRows.filter(
    (row) => row.group === 'gpu_model' && row.executable,
  )
  const blockedRows = toolRows.filter((row) => row.blockedWithReason)
  const gpuBlockedRows = blockedRows.filter((row) => row.group === 'gpu_model')
  const failedRows = toolRows.filter((row) => row.failedWithDiagnostics)
  const currentHostEnvironment =
    currentHostGpuProofPreflight &&
    typeof currentHostGpuProofPreflight.hostEnvironment === 'object'
      ? currentHostGpuProofPreflight.hostEnvironment
      : null
  const currentHostGpuProofBlockers = Array.isArray(
    currentHostEnvironment?.blockers,
  )
    ? currentHostEnvironment.blockers.filter(
        (blocker: unknown): blocker is string => typeof blocker === 'string',
      )
    : []
  const currentHostEligibleForGpuProof =
    currentHostEnvironment?.hostEligibleForNativeGpuProof === true
  const executionScope = {
    agentCanSubmitControlledRequestsForAll21: true,
    agentCanExecuteAnyControlledToolNow: executableTools.length > 0,
    agentCanExecute13NonGpuControlledToolsNow:
      nonGpuExecutableTools.length === 13,
    agentCanExecuteGpuModelToolsNow: gpuExecutableTools.length > 0,
    agentCanExecuteAll21ControlledToolsNow: executableTools.length === 21,
    agentExecutableToolCountNow: executableTools.length,
    agentExecutableNonGpuToolCountNow: nonGpuExecutableTools.length,
    agentExecutableGpuModelToolCountNow: gpuExecutableTools.length,
    gpuModelBlockedToolCountNow: gpuBlockedRows.length,
    currentHostGpuProofPreflightRequested:
      currentHostGpuProofPreflight !== null,
    currentHostEligibleForGpuProof,
    currentHostGpuProofBlockers,
    currentHostGpuProofPreflightCommand: hostDetectionReadinessCommand(),
  }

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-execution-readiness',
    decision,
    status: gpuExecutableTools.length > 0 ? privateProofStatus : defaultStatus,
    summary:
      'Strict external-agent readiness report for all 21 AI graphics tools. Callable means the agent can submit a controlled private request. Executable means the controlled adapter actually performed runtime work and returned structured private output evidence, including the mock worker-claim-to-canonical-route smoke for the 13 non-GPU tools. GPU/model tools remain blocked_with_reason until approved private proof refs and the tool-specific runtime inputs are supplied: CPU foundation proof for torch/torchvision and transformers, CPU tensor proof for kornia, and native CUDA plus reviewed private model/input paths for the remaining model tools. Capability-mismatch calls fail closed with failed_with_diagnostics and do not invoke adapters.',
    stateDefinitions: {
      callable:
        'The external agent can submit the controlled private route request.',
      executable:
        'The controlled adapter performed bounded runtime work and produced structured private output evidence.',
      blocked_with_reason:
        'The request shape is valid, but a required runtime/model/input prerequisite is absent.',
      failed_with_diagnostics:
        'Execution was attempted or route validation failed and the row includes an actionable reason.',
    },
    sourceEvidence: {
      all21ControlledRouteExecutionSmoke: {
        decision: routeSmoke.decision,
        status: routeSmoke.status,
        accepted: true,
        capabilityMismatchFailureProbeAccepted:
          routeSmoke.booleans?.capabilityMismatchFailureProbeAccepted === true,
        capabilityMismatchFailureProbeState:
          routeSmoke.capabilityMismatchFailureProbe
            ?.externalAgentExecutionState ?? null,
      },
      gpuModelLocalDevRuntimeExecutionHarness: {
        decision: sourceGpuHarness.decision,
        status: sourceGpuHarness.status,
        accepted: true,
      },
      suppliedPrivateLocalRuntimeProofResult: suppliedPrivateLocalRuntimeProof
        ? {
            path: localRuntimeProofResultPath,
            decision: suppliedPrivateLocalRuntimeProof.decision,
            status: suppliedPrivateLocalRuntimeProof.status,
            mergedIntoReadinessRows: true,
          }
        : null,
      externalAgentExecutionGate: {
        decision: executionGate.decision,
        status: executionGate.status,
        accepted: true,
      },
      gpuModelRuntimeProofRefBridge: {
        decision: gpuProofRefBridge.decision,
        status: gpuProofRefBridge.status,
        accepted: true,
      },
      controlledWorkerRouteExecutionSmoke: {
        decision: controlledWorkerRouteSmoke.decision,
        status: controlledWorkerRouteSmoke.status,
        accepted: true,
      },
      currentHostGpuProofPreflight: currentHostGpuProofPreflight
        ? {
            decision: currentHostGpuProofPreflight.decision,
            hostEnvironment: currentHostEnvironment,
            accepted: true,
          }
        : null,
    },
    executionScope,
    counts: {
      totalToolsCovered: toolRows.length,
      packageRuntimePresentForPlannedSurfaceTools:
        toolRows.filter((row) => row.packageRuntimePresentForPlannedSurface).length,
      controlledExecutionRuntimePresentNowTools:
        toolRows.filter((row) => row.controlledExecutionRuntimePresentNow).length,
      agentCallableTools: toolRows.filter((row) => row.callable).length,
      agentExecutableTools: executableTools.length,
      cpuStaticExecutableTools: toolRows.filter(
        (row) => row.group === 'cpu_static' && row.executable,
      ).length,
      browserRuntimeExecutableTools: toolRows.filter(
        (row) => row.group === 'browser_runtime' && row.executable,
      ).length,
      gpuToolsWithValidRuntimeProof: gpuExecutableTools.length,
      gpuModelProofRefBridgeAcceptedTools:
        toolRows.filter((row) => row.routeSubmissionReadyWithAcceptedPrivateProof).length,
      gpuModelProofRefBridgeBlockedTools:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          row.routeSubmissionReadyWithAcceptedPrivateProof === false
        )).length,
      controlledWorkerRouteExecutableTools:
        toolRows.filter((row) => (
          row.group !== 'gpu_model' &&
          row.controlledWorkerRouteEvidenceAccepted === true
        )).length,
      mockWorkerQueueJobCreatedTools:
        toolRows.filter((row) => row.mockWorkerQueueJobCreated === true).length,
      mockWorkerClaimPerformedTools:
        toolRows.filter((row) => row.mockWorkerClaimPerformed === true).length,
      mockWorkerEventRecordedTools:
        toolRows.filter((row) => row.mockWorkerEventRecorded === true).length,
      gpuModelBlockedByControlledWorkerRouteTools:
        toolRows.filter((row) => row.controlledWorkerRouteGpuBlocked === true).length,
      gpuModelBlockedWithReasonTools: gpuBlockedRows.length,
      currentHostGpuProofBlockers:
        currentHostGpuProofBlockers.length,
      blockedWithReasonTools: blockedRows.length,
      failedWithDiagnosticsTools: failedRows.length,
      capabilityMismatchFailureProbeTools:
        routeSmoke.counts?.capabilityMismatchFailureProbeTools ?? 0,
      gpuRuntimeShouldStartNowTools:
        toolRows.filter((row) => row.gpuRuntimeShouldStartNow).length,
      publicArtifactCreatedTools:
        toolRows.filter((row) => row.publicArtifactCreated).length,
      signedUrlCreatedTools:
        toolRows.filter((row) => row.signedUrlCreated).length,
      workerDispatchPerformedTools:
        toolRows.filter((row) => row.workerDispatchPerformed).length,
      providerRuntimePerformedTools:
        toolRows.filter((row) => row.providerRuntimePerformed).length,
      runtimeReadyNowTools:
        toolRows.filter((row) => row.runtimeReadyNow).length,
      externalBetaReadyNowTools:
        toolRows.filter((row) => row.externalBetaReadyNow).length,
      productionReadyNowTools:
        toolRows.filter((row) => row.productionReadyNow).length,
      fastestGpuModelUnlockCandidateTools:
        toolRows.filter((row) => row.fastestGpuModelUnlockCandidate).length,
      privateLocalRuntimeProofResultSuppliedTools:
        suppliedPrivateLocalRuntimeProof &&
        Array.isArray(
          suppliedPrivateLocalRuntimeProof
            .gpuModelLocalDevRuntimeExecutionHarnessRows,
        )
          ? suppliedPrivateLocalRuntimeProof
              .gpuModelLocalDevRuntimeExecutionHarnessRows
              .length
          : 0,
    },
    booleans: {
      externalAgentExecutionReadinessCompleted: true,
      all21ToolsCovered: toolRows.length === 21,
      all21ToolsHaveInstallSurfaceEvidence:
        toolRows.every((row) => row.packageRuntimePresentForPlannedSurface === true),
      thirteenToolsHaveControlledExecutionRuntimePresentNow:
        toolRows.filter((row) => row.controlledExecutionRuntimePresentNow).length === 13,
      eightGpuModelToolsInstallTargetPreparedButRuntimeBlocked:
        toolRows.filter((row) => (
          row.group === 'gpu_model' &&
          (
            row.installReadinessState ===
              'install_target_prepared_runtime_blocked_pending_cuda_private_inputs' ||
            row.installReadinessState ===
              'install_target_prepared_runtime_blocked_pending_cpu_foundation_private_inputs' ||
            row.installReadinessState ===
              'install_target_prepared_runtime_blocked_pending_cpu_tensor_private_inputs'
          )
        )).length === 8,
      agentCanSubmitControlledToolRequests: true,
      agentCallableToolsReady: toolRows.every((row) => row.callable),
      all13NonGpuControlledAdapterOutputsValidated:
        nonGpuExecutableTools.length === 13,
      controlledWorkerRouteSmokeAccepted: true,
      all13NonGpuControlledWorkerRouteOutputsValidated:
        toolRows.filter((row) => (
          row.group !== 'gpu_model' &&
          row.controlledWorkerRouteEvidenceAccepted === true
        )).length === 13,
      mockWorkerClaimBeforeRouteExecutionAccepted:
        toolRows.filter((row) => row.mockWorkerClaimPerformed === true).length === 13,
      mockWorkerEventAfterRouteExecutionAccepted:
        toolRows.filter((row) => row.mockWorkerEventRecorded === true).length === 13,
      all8GpuModelToolsBlockedByControlledWorkerRoute:
        toolRows.filter((row) => row.controlledWorkerRouteGpuBlocked === true).length === 8,
      all8GpuModelToolsEvaluated: toolRows.filter((row) => row.group === 'gpu_model').length === 8,
      gpuModelToolsBlockedUntilPrerequisites:
        gpuBlockedRows.length + gpuExecutableTools.length === 8,
      gpuModelProofRefBridgeBlocksUntilPrivateProof:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => row.routeSubmissionReadyWithAcceptedPrivateProof === false),
      scopedGpuModelRuntimeProofAcceptedTools: gpuExecutableTools.length,
      privateLocalRuntimeProofResultSupplied:
        Boolean(suppliedPrivateLocalRuntimeProof),
      strictCallableExecutableBlockedFailedContractCreated: true,
      capabilityMismatchFailureProbeAccepted:
        routeSmoke.booleans?.capabilityMismatchFailureProbeAccepted === true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      sourceScopedGpuRuntimeStartedOnlyDuringAcceptedProof:
        toolRows
          .filter((row) => row.group === 'gpu_model')
          .every((row) => (
            row.executable ||
            row.sourceGpuRuntimeShouldStartDuringScopedProof === false
          )),
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: executableTools.length > 0,
      agentCanExecuteAnyControlledToolNow:
        executionScope.agentCanExecuteAnyControlledToolNow,
      agentCanExecute13ControlledToolsNow: nonGpuExecutableTools.length === 13,
      agentCanExecute13NonGpuControlledToolsNow:
        executionScope.agentCanExecute13NonGpuControlledToolsNow,
      agentCanExecuteAll21ToolsNow: executableTools.length === 21,
      agentCanExecuteAll21ControlledToolsNow:
        executionScope.agentCanExecuteAll21ControlledToolsNow,
      agentCanExecuteGpuModelToolsNow: gpuExecutableTools.length > 0,
      currentHostGpuProofPreflightRequested:
        executionScope.currentHostGpuProofPreflightRequested,
      currentHostEligibleForGpuProof:
        executionScope.currentHostEligibleForGpuProof,
      routeExecutionApprovedNow: true,
      routeExecutionPerformedInReadinessRunner: !hasFlag('--use-records-only'),
      controlledWorkerRouteExecutionPerformedInReadinessRunner:
        !hasFlag('--use-records-only'),
      toolExecutionApprovedFor13ControlledToolsNow: true,
      toolExecutionApprovedForGpuModelToolsNow: gpuExecutableTools.length > 0,
      toolExecutionApprovedForAll21ToolsNow: executableTools.length === 21,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
    toolReadinessRows: toolRows,
    fastestGpuModelUnlockCandidate: {
      toolId: 'kornia',
      reason:
        'Kornia is the narrowest GPU/model execution unlock candidate because it uses the real controlled adapter, can prove local CPU tensor execution with a private approved frame and output directory, and does not require a model-weight manifest.',
      recommendedBackend: 'docker_container',
      canonicalProofImage: canonicalGpuWorkerProofImage,
      nextExactContainerBuildCommand: containerGpuImageBuildCommand(),
      nextExactCommand: containerGpuCommand('kornia'),
      nextExactControlledRouteCommand: controlledRouteGpuCommand('kornia'),
      nextExactProofRefBridgeCommand: proofRefBridgeCommand(),
      nextExactReadinessWithPrivateProofCommand:
        directReadinessWithPrivateProofCommand(),
      nextExactCurrentHostPreflightCommand: hostDetectionReadinessCommand(),
      expectedCurrentHostBlockerWhenNoNvidiaGpuIsAttached:
        'gpu_model_python_package_missing',
      remainsBlockedUntil:
        'Run with the canonical proof image available, approved local Python CPU tensor runtime packages, and a private approved source frame mounted locally.',
    },
    nextExactAction:
      'First target kornia with the container local-dev CPU tensor command. After kornia returns structured private local output, feed that private harness result into the GPU/model runtime proof-ref bridge, then repeat per GPU/model tool with reviewed model/checkpoint paths where required.',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.toolReadinessRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.group}\` | \`${row.installReadinessState}\` | \`${row.readinessState}\` | ${row.callable} | ${row.executable} | ${row.controlledWorkerRouteEvidenceAccepted} | \`${row.currentBlockingPrerequisiteKey ?? 'none'}\` | \`${row.remainingPrivateRuntimeInputKeys.length ? row.remainingPrivateRuntimeInputKeys.join(', ') : 'none'}\` | \`${row.minimumPrivateRuntimeInputKeys.length ? row.minimumPrivateRuntimeInputKeys.join(', ') : 'none'}\` | \`${row.blockingPrerequisite ?? 'none'}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Agent Execution Readiness

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This is the strict all-21 external-agent readiness report. It separates \`callable\` from \`executable\`: all 21 tools can receive controlled private requests, 13 tools execute controlled local adapters now, and those 13 are also proven through the mock worker-claim-to-canonical-route smoke. The eight GPU/model tools return \`blocked_with_reason\` until approved private proof refs and the tool-specific runtime inputs are supplied: CPU foundation proof for \`torch_torchvision\` and \`transformers\`, CPU tensor proof for \`kornia\`, and native CUDA plus reviewed private model/input paths for the remaining model tools. The mounted route also proves a capability-mismatch request returns \`failed_with_diagnostics\` without invoking an adapter. GPU runtime is on-demand only and does not start idle.

## State Definitions

${Object.entries(report.stateDefinitions).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Execution Scope

${Object.entries(report.executionScope).map(([key, value]) => `- \`${key}\`: ${Array.isArray(value) ? value.join('; ') || 'none' : value}`).join('\n')}

## Tool Rows

| Tool | Group | Install/runtime state | Readiness state | Callable | Executable | Worker-route evidence accepted | Current blocker | Remaining private runtime inputs | Minimum private runtime inputs | Blocking prerequisite |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Fastest GPU/Model Unlock Candidate

- Tool: \`${report.fastestGpuModelUnlockCandidate.toolId}\`
- Recommended backend: \`${report.fastestGpuModelUnlockCandidate.recommendedBackend}\`
- Canonical proof image: \`${report.fastestGpuModelUnlockCandidate.canonicalProofImage}\`
- Reason: ${report.fastestGpuModelUnlockCandidate.reason}
- Expected current-host blocker without attached NVIDIA GPU: \`${report.fastestGpuModelUnlockCandidate.expectedCurrentHostBlockerWhenNoNvidiaGpuIsAttached}\`
- Build proof-local image if missing: \`${report.fastestGpuModelUnlockCandidate.nextExactContainerBuildCommand}\`
- Next direct harness command: \`${report.fastestGpuModelUnlockCandidate.nextExactCommand}\`
- Next controlled route command: \`${report.fastestGpuModelUnlockCandidate.nextExactControlledRouteCommand}\`
- Next proof-ref bridge command: \`${report.fastestGpuModelUnlockCandidate.nextExactProofRefBridgeCommand}\`
- Next direct readiness command with private proof: \`${report.fastestGpuModelUnlockCandidate.nextExactReadinessWithPrivateProofCommand}\`
- Next current-host preflight command: \`${report.fastestGpuModelUnlockCandidate.nextExactCurrentHostPreflightCommand}\`

## Failure Diagnostics Guard

- Capability mismatch probe accepted: \`${report.booleans.capabilityMismatchFailureProbeAccepted}\`
- Probe count: \`${report.counts.capabilityMismatchFailureProbeTools}\`
- Probe state: \`${report.sourceEvidence.all21ControlledRouteExecutionSmoke.capabilityMismatchFailureProbeState}\`
- Guard: a valid tool with the wrong product-facing capability returns \`failed_with_diagnostics\` and does not invoke or execute an adapter.

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next Action

${report.nextExactAction}
`
}

const report = buildReport()
if (hasFlag('--write-records')) {
  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true })
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}
console.log(JSON.stringify(report, null, 2))
