import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  type AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
} from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_gpu_model_private_proof_sequence_prepared_with_runtime_blocks'
const defaultStatus =
  'gpu_model_private_proof_sequence_ready_kornia_first_blocked_until_scoped_private_cuda_proof'
const privateProofStatus =
  'gpu_model_private_proof_sequence_accepted_scoped_private_runtime_proof'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-private-proof-sequence.md'
const canonicalGpuWorkerProofImage =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const harnessScript =
  'ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness'
const bridgeScript =
  'ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge'
const readinessScript =
  'ai-graphics:external-agent-execution-readiness'
const hostPreflightScript =
  'ai-graphics:gpu-runtime-proof-local-preflight'

type JsonRecord = Record<string, any>

type SequenceArgs = {
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId
  attemptLocalRuntime: boolean
  writeRecords: boolean
  detectHost: boolean
  requireHostEligible: boolean
  requireAcceptedProof: boolean
  outputDirectory?: string
  resultOut?: string
  runtimeBackend?: 'host_python' | 'docker_container'
  runtimeContainerImage?: string
  runtimeContainerPlatform?: string
  sourceImageLocalPath?: string
  sam2CheckpointLocalPath?: string
  birefnetModelLocalPath?: string
  realEsrganModelLocalPath?: string
  rembgModelLocalPath?: string
  transparentBackgroundCheckpointLocalPath?: string
  timeoutMs?: string
}

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

function isGpuModelTool(
  toolId: string,
): toolId is AiGraphicsExternalAgentGpuModelControlledAdapterToolId {
  return AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.includes(
    toolId as AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  )
}

function isLocalArtifactPath(filePath: string): boolean {
  const normalized = path.normalize(filePath)
  return normalized === '.local-artifacts' ||
    normalized.startsWith(`.local-artifacts${path.sep}`)
}

function parseArgs(): SequenceArgs {
  const toolId = stringFlag('--tool') ?? 'kornia'
  if (!isGpuModelTool(toolId)) {
    throw new Error(`Unsupported GPU/model tool id for private proof sequence: ${toolId}`)
  }

  const attemptLocalRuntime = hasFlag('--attempt-local-runtime')
  const outputDirectory = stringFlag('--output-dir')
  const resultOut =
    stringFlag('--result-out') ??
    (attemptLocalRuntime && outputDirectory
      ? path.join(outputDirectory, 'harness-result.json')
      : undefined)
  const requestedBackend = stringFlag('--runtime-backend')
  const runtimeBackend =
    requestedBackend === 'docker_container'
      ? 'docker_container'
      : requestedBackend === 'host_python'
      ? 'host_python'
      : toolId === 'kornia' && attemptLocalRuntime
      ? 'docker_container'
      : 'host_python'
  const runtimeContainerImage =
    stringFlag('--runtime-container-image') ??
    (runtimeBackend === 'docker_container' ? canonicalGpuWorkerProofImage : undefined)
  const runtimeContainerPlatform =
    stringFlag('--runtime-container-platform') ??
    (runtimeBackend === 'docker_container' ? 'linux/amd64' : undefined)

  if (hasFlag('--write-records') && attemptLocalRuntime) {
    throw new Error(
      '--write-records cannot be combined with --attempt-local-runtime; private proof execution output must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && stringFlag('--result-out')) {
    throw new Error(
      '--write-records cannot be combined with --result-out; private proof result files must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && hasFlag('--detect-host')) {
    throw new Error(
      '--write-records cannot be combined with --detect-host; host-specific proof preflight must stay local-only.',
    )
  }
  if (hasFlag('--write-records') && hasFlag('--require-accepted-proof')) {
    throw new Error(
      '--write-records cannot be combined with --require-accepted-proof; committed records must remain blocked without private proof.',
    )
  }
  if (attemptLocalRuntime && !outputDirectory) {
    throw new Error('--attempt-local-runtime requires --output-dir')
  }
  if (resultOut && !isLocalArtifactPath(resultOut)) {
    throw new Error('--result-out must stay under .local-artifacts/')
  }
  if (outputDirectory && !isLocalArtifactPath(outputDirectory)) {
    throw new Error('--output-dir must stay under .local-artifacts/')
  }

  return {
    toolId,
    attemptLocalRuntime,
    writeRecords: hasFlag('--write-records'),
    detectHost: hasFlag('--detect-host') || hasFlag('--require-host-eligible'),
    requireHostEligible: hasFlag('--require-host-eligible'),
    requireAcceptedProof: hasFlag('--require-accepted-proof'),
    outputDirectory,
    resultOut,
    runtimeBackend,
    runtimeContainerImage,
    runtimeContainerPlatform,
    sourceImageLocalPath: stringFlag('--source-image'),
    sam2CheckpointLocalPath: stringFlag('--sam2-checkpoint'),
    birefnetModelLocalPath: stringFlag('--birefnet-model'),
    realEsrganModelLocalPath: stringFlag('--real-esrgan-model'),
    rembgModelLocalPath: stringFlag('--rembg-model'),
    transparentBackgroundCheckpointLocalPath:
      stringFlag('--transparent-background-checkpoint'),
    timeoutMs: stringFlag('--timeout-ms'),
  }
}

function runJsonScript(scriptName: string, args: string[]): JsonRecord {
  const output = childProcess.execFileSync('npm', [
    'run',
    '--silent',
    scriptName,
    '--',
    ...args,
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 180 * 1024 * 1024,
    env: {
      ...process.env,
      DEVELOPER_DIR:
        process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
    },
  })
  return JSON.parse(output) as JsonRecord
}

function pushIfValue(args: string[], flag: string, value: string | undefined): void {
  if (value) args.push(flag, value)
}

function harnessArgs(input: SequenceArgs): string[] {
  const args = ['--tool', input.toolId]
  if (input.attemptLocalRuntime) args.push('--attempt-local-runtime')
  pushIfValue(args, '--output-dir', input.outputDirectory)
  pushIfValue(args, '--result-out', input.resultOut)
  if (input.runtimeBackend) args.push('--runtime-backend', input.runtimeBackend)
  pushIfValue(args, '--runtime-container-image', input.runtimeContainerImage)
  pushIfValue(args, '--runtime-container-platform', input.runtimeContainerPlatform)
  pushIfValue(args, '--source-image', input.sourceImageLocalPath)
  pushIfValue(args, '--sam2-checkpoint', input.sam2CheckpointLocalPath)
  pushIfValue(args, '--birefnet-model', input.birefnetModelLocalPath)
  pushIfValue(args, '--real-esrgan-model', input.realEsrganModelLocalPath)
  pushIfValue(args, '--rembg-model', input.rembgModelLocalPath)
  pushIfValue(
    args,
    '--transparent-background-checkpoint',
    input.transparentBackgroundCheckpointLocalPath,
  )
  pushIfValue(args, '--timeout-ms', input.timeoutMs)
  return args
}

function directHarnessCommand(input: SequenceArgs): string {
  return [
    `npm run --silent ${harnessScript} --`,
    ...harnessArgs(input),
  ].join(' ')
}

function bridgeCommand(resultPath: string): string {
  return [
    `npm run --silent ${bridgeScript} --`,
    '--local-runtime-proof-result',
    resultPath,
  ].join(' ')
}

function readinessCommand(resultPath: string): string {
  return [
    `npm run --silent ${readinessScript} --`,
    '--local-runtime-proof-result',
    resultPath,
  ].join(' ')
}

function defaultKorniaCommand(): string {
  return [
    `npm run --silent ${harnessScript} --`,
    '--attempt-local-runtime',
    '--runtime-backend docker_container',
    `--runtime-container-image ${canonicalGpuWorkerProofImage}`,
    '--runtime-container-platform linux/amd64',
    '--tool kornia',
    '--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>',
    '--result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json',
    '--source-image <private-approved-frame.png>',
  ].join(' ')
}

function privateProofSequenceInputFlags(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): string[] {
  const flags: string[] = []
  if (!['torch_torchvision', 'transformers'].includes(toolId)) {
    flags.push('--source-image <private-approved-frame.png>')
  }
  if (toolId === 'sam2') {
    flags.push('--sam2-checkpoint <private-sam2-checkpoint.pt>')
  }
  if (toolId === 'birefnet') {
    flags.push('--birefnet-model <private-birefnet-model>')
  }
  if (toolId === 'real_esrgan') {
    flags.push('--real-esrgan-model <private-real-esrgan-model.pth>')
  }
  if (toolId === 'rembg') {
    flags.push('--rembg-model <private-rembg-model.onnx>')
  }
  if (toolId === 'transparent_background') {
    flags.push(
      '--transparent-background-checkpoint <private-transparent-background-checkpoint.pth>',
    )
  }
  return flags
}

function sequenceCommandForTool(
  toolId: AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
): string {
  return [
    'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence --',
    '--attempt-local-runtime',
    `--tool ${toolId}`,
    `--output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-${toolId}>`,
    ...privateProofSequenceInputFlags(toolId),
    '--detect-host',
    '--require-host-eligible',
    '--require-accepted-proof',
  ].join(' ')
}

function sequenceCommand(): string {
  return sequenceCommandForTool('kornia')
}

function privateProofSequenceCommandsByTool(): Record<
  AiGraphicsExternalAgentGpuModelControlledAdapterToolId,
  string
> {
  return Object.fromEntries(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS.map(
      (toolId) => [toolId, sequenceCommandForTool(toolId)],
    ),
  ) as Record<AiGraphicsExternalAgentGpuModelControlledAdapterToolId, string>
}

function rowForTool(report: JsonRecord, toolId: string): JsonRecord {
  const rows = Array.isArray(report.gpuModelLocalDevRuntimeExecutionHarnessRows)
    ? report.gpuModelLocalDevRuntimeExecutionHarnessRows
    : []
  return rows.find((row: JsonRecord) => row.toolId === toolId) ?? {}
}

function readinessToolRow(report: JsonRecord, toolId: string): JsonRecord {
  const rows = Array.isArray(report.toolReadinessRows)
    ? report.toolReadinessRows
    : []
  return rows.find((row: JsonRecord) => row.toolId === toolId) ?? {}
}

function buildReport(input: SequenceArgs) {
  const harness = runJsonScript(harnessScript, harnessArgs(input))
  const harnessRow = rowForTool(harness, input.toolId)
  const localRuntimeExecuted = harnessRow.localRuntimeExecutionPerformed === true
  const privateResultPath = input.resultOut ?? null
  const shouldRunPrivateProofChecks =
    input.attemptLocalRuntime && typeof privateResultPath === 'string'
  const bridge = shouldRunPrivateProofChecks
    ? runJsonScript(bridgeScript, ['--local-runtime-proof-result', privateResultPath])
    : runJsonScript(bridgeScript, [])
  const readiness = shouldRunPrivateProofChecks
    ? runJsonScript(readinessScript, ['--local-runtime-proof-result', privateResultPath])
    : runJsonScript(readinessScript, [])
  const hostPreflight = input.detectHost
    ? runJsonScript(hostPreflightScript, ['--detect-host'])
    : null
  const readinessRow = readinessToolRow(readiness, input.toolId)
  const bridgeRows = Array.isArray(bridge.gpuModelRuntimeProofRefBridgeRows)
    ? bridge.gpuModelRuntimeProofRefBridgeRows
    : []
  const bridgeRow =
    bridgeRows.find((row: JsonRecord) => row.toolId === input.toolId) ?? {}
  const acceptedPrivateProof =
    bridgeRow.routeSubmissionReadyWithAcceptedPrivateProof === true &&
    readinessRow.executable === true
  const hostEnvironment =
    hostPreflight && typeof hostPreflight.hostEnvironment === 'object'
      ? hostPreflight.hostEnvironment
      : null
  const hostEligibleForNativeGpuProof =
    hostEnvironment?.hostEligibleForNativeGpuProof === true
  const hostBlockers = Array.isArray(hostEnvironment?.blockers)
    ? hostEnvironment.blockers.filter((blocker: unknown): blocker is string => typeof blocker === 'string')
    : []

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-gpu-model-private-proof-sequence',
    decision,
    status: acceptedPrivateProof ? privateProofStatus : defaultStatus,
    summary:
      'Runs the scoped GPU/model private proof sequence for one tool: local-dev controlled adapter harness, SHA-checked proof-ref bridge, then all-21 external-agent readiness recomputation. The default committed record targets Kornia without runtime execution and stays blocked. Actual GPU execution requires --attempt-local-runtime plus private inputs and remains local-only.',
    requestedToolId: input.toolId,
    fastestUnlockCandidate: 'kornia',
    sourceEvidence: {
      gpuModelLocalDevRuntimeExecutionHarness: {
        decision: harness.decision,
        status: harness.status,
        accepted: true,
      },
      gpuModelRuntimeProofRefBridge: {
        decision: bridge.decision,
        status: bridge.status,
        accepted: true,
      },
      externalAgentExecutionReadiness: {
        decision: readiness.decision,
        status: readiness.status,
        accepted: true,
      },
      currentHostGpuProofPreflight: hostPreflight
        ? {
            decision: hostPreflight.decision,
            hostEnvironment,
            accepted: true,
          }
        : null,
    },
    interfaces: {
      packageScript:
        'ai-graphics:external-agent-gpu-model-private-proof-sequence',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-private-proof-sequence:diagnostics',
      cli:
        'server/cli/ai-graphics-external-agent-gpu-model-private-proof-sequence.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-private-proof-sequence-diagnostics.mjs',
      defaultCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence',
      writeRecordsCommand:
        'npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --write-records',
      korniaFirstPrivateProofSequenceCommand: sequenceCommand(),
      privateProofSequenceCommandsByTool: privateProofSequenceCommandsByTool(),
      directHarnessCommand: directHarnessCommand(input),
      defaultKorniaHarnessCommand: defaultKorniaCommand(),
      bridgeCommand: privateResultPath ? bridgeCommand(privateResultPath) : null,
      readinessCommand: privateResultPath ? readinessCommand(privateResultPath) : null,
      hostPreflightCommand:
        `npm run --silent ${hostPreflightScript} -- --detect-host`,
      canonicalGpuWorkerProofImage,
      canonicalGpuWorkerProofImageBuildCommand:
        `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t ${canonicalGpuWorkerProofImage} .`,
    },
    sequencePolicy: {
      scopedToolOnly: true,
      oneToolPerPrivateProofSequence: true,
      defaultTool: 'kornia',
      allGpuModelToolsHaveExactPrivateProofSequenceCommand: true,
      defaultToolReason:
        'Kornia requires CUDA plus one private approved frame and no private model/checkpoint file, so it is the fastest honest GPU/model unlock candidate.',
      explicitRuntimeAttemptRequired: true,
      privateInputsRequired: true,
      privateProofResultMustStayUnderLocalArtifacts: true,
      proofBridgeRequiresOutputJsonSha256Match: true,
      noIdleGpuRuntimeApproved: true,
      gpuMayStartOnlyDuringScopedLocalRuntimeAttempt:
        input.attemptLocalRuntime === true,
      noCpuFallbackForGpuModelTools: true,
      noModelDownload: true,
      noProviderRuntime: true,
      noPublicArtifacts: true,
      noSignedUrls: true,
      noExternalBetaUnlock: true,
      noProductionUnlock: true,
      hostEligibilityGateSupported: true,
      requireHostEligibleFlagSupported: true,
      requireAcceptedProofFlagSupported: true,
      perToolPrivateProofSequenceCommandsPrepared: true,
    },
    counts: {
      requestedGpuModelTools: 1,
      localRuntimeExecutionPerformedTools:
        harness.counts?.localRuntimeExecutionPerformedTools ?? 0,
      toolExecutionApprovedNowTools:
        harness.counts?.toolExecutionApprovedNowTools ?? 0,
      acceptedPrivateProofTools:
        bridge.counts?.acceptedPrivateLocalRuntimeProofTools ?? 0,
      routeSubmissionReadyWithAcceptedPrivateProofTools:
        bridge.counts?.routeSubmissionReadyWithAcceptedPrivateProofTools ?? 0,
      readinessAgentExecutableTools:
        readiness.counts?.agentExecutableTools ?? 0,
      readinessGpuToolsWithValidRuntimeProof:
        readiness.counts?.gpuToolsWithValidRuntimeProof ?? 0,
      readinessBlockedWithReasonTools:
        readiness.counts?.blockedWithReasonTools ?? 0,
      gpuRuntimeShouldStartNowTools:
        readiness.counts?.gpuRuntimeShouldStartNowTools ?? 0,
      publicArtifactCreatedTools:
        readiness.counts?.publicArtifactCreatedTools ?? 0,
      signedUrlCreatedTools:
        readiness.counts?.signedUrlCreatedTools ?? 0,
      currentHostGpuProofBlockers: hostBlockers.length,
    },
    currentHostGpuProofPreflight: {
      requested: input.detectHost,
      hostEligibleForNativeGpuProof,
      blockers: hostBlockers,
      hostEnvironment,
    },
    requestedToolResult: {
      harness: {
        adapterStatus: harnessRow.adapterStatus ?? null,
        executionState: harnessRow.executionState ?? null,
        localRuntimeExecutionPerformed:
          harnessRow.localRuntimeExecutionPerformed === true,
        toolExecutionApprovedNow:
          harnessRow.toolExecutionApprovedNow === true,
        gpuRuntimeShouldStartNow:
          harnessRow.gpuRuntimeShouldStartNow === true,
        skipReasonCode: harnessRow.skipReasonCode ?? null,
        errorMessage: harnessRow.errorMessage ?? null,
        outputJsonPath: harnessRow.outputJsonPath ?? null,
        outputJsonSha256: harnessRow.outputJsonSha256 ?? null,
      },
      bridge: {
        proofRefBridgeStatus: bridgeRow.proofRefBridgeStatus ?? null,
        routeSubmissionReadyWithAcceptedPrivateProof:
          bridgeRow.routeSubmissionReadyWithAcceptedPrivateProof === true,
        localRuntimeProofAccepted:
          bridgeRow.localRuntimeProofAccepted === true,
        privateOutputJsonSha256Matches:
          bridgeRow.localProofEvidenceObserved
            ?.privateOutputJsonSha256Matches === true,
        privateOutputJsonRejectionReason:
          bridgeRow.localProofEvidenceObserved
            ?.privateOutputJsonRejectionReason ?? null,
      },
      readiness: {
        readinessState: readinessRow.readinessState ?? null,
        executable: readinessRow.executable === true,
        routeSubmissionReadyWithAcceptedPrivateProof:
          readinessRow.routeSubmissionReadyWithAcceptedPrivateProof === true,
        blockingPrerequisite: readinessRow.blockingPrerequisite ?? null,
      },
    },
    booleans: {
      externalAgentGpuModelPrivateProofSequencePrepared: true,
      korniaFirstUnlockPathPrepared: true,
      scopedToolOnly: true,
      localRuntimeAttemptRequested: input.attemptLocalRuntime,
      localRuntimeExecutedForRequestedTool: localRuntimeExecuted,
      proofBridgeExecuted: true,
      readinessRecomputed: true,
      acceptedPrivateProofForRequestedTool: acceptedPrivateProof,
      hostPreflightRequested: input.detectHost,
      hostEligibleForNativeGpuProof,
      requireHostEligible: input.requireHostEligible,
      requireAcceptedProof: input.requireAcceptedProof,
      agentCanExecute13NonGpuControlledToolsNow:
        readiness.booleans?.agentCanExecute13NonGpuControlledToolsNow === true,
      agentCanExecuteGpuModelToolsNow:
        readiness.booleans?.agentCanExecuteGpuModelToolsNow === true,
      agentCanExecuteAll21ToolsNow:
        readiness.booleans?.agentCanExecuteAll21ToolsNow === true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      gpuRuntimeStartedOnlyDuringScopedAttempt:
        !localRuntimeExecuted || harnessRow.gpuRuntimeShouldStartNow === true,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      providerRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    nextExactAction: acceptedPrivateProof
      ? 'Feed the accepted private proof into the controlled external-agent route admission path for this scoped tool, then repeat the sequence for the next GPU/model tool.'
      : input.detectHost && !hostEligibleForNativeGpuProof
      ? 'Move this proof sequence to an approved native Linux/amd64 NVIDIA CUDA host, then rerun with --require-host-eligible and --require-accepted-proof.'
      : 'Run the Kornia-first private proof sequence on an approved native Linux/amd64 NVIDIA CUDA host with the canonical proof image and one private approved source frame.',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  return `# AI Graphics External Agent GPU Model Private Proof Sequence

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This runner is the one-command local-only path for a scoped GPU/model proof: it calls the real local-dev controlled adapter harness, validates the resulting private proof through the SHA-checked proof-ref bridge, then recomputes all-21 external-agent readiness.

## Requested Tool

- Tool: \`${report.requestedToolId}\`
- Fastest unlock candidate: \`${report.fastestUnlockCandidate}\`
- Local runtime attempted: \`${report.booleans.localRuntimeAttemptRequested}\`
- Local runtime executed for requested tool: \`${report.booleans.localRuntimeExecutedForRequestedTool}\`
- Accepted private proof: \`${report.booleans.acceptedPrivateProofForRequestedTool}\`
- Host preflight requested: \`${report.booleans.hostPreflightRequested}\`
- Host eligible for native GPU proof: \`${report.booleans.hostEligibleForNativeGpuProof}\`

## Kornia First Command

\`${report.interfaces.korniaFirstPrivateProofSequenceCommand}\`

## Per-Tool Private Proof Sequence Commands

${Object.entries(report.interfaces.privateProofSequenceCommandsByTool).map(([toolId, command]) => `- \`${toolId}\`: \`${command}\``).join('\n')}

## Requested Tool Result

- Harness adapter status: \`${report.requestedToolResult.harness.adapterStatus}\`
- Harness execution state: \`${report.requestedToolResult.harness.executionState}\`
- Harness skip reason: \`${report.requestedToolResult.harness.skipReasonCode}\`
- Harness output JSON SHA-256: \`${report.requestedToolResult.harness.outputJsonSha256}\`
- Bridge status: \`${report.requestedToolResult.bridge.proofRefBridgeStatus}\`
- Bridge SHA-256 accepted: \`${report.requestedToolResult.bridge.privateOutputJsonSha256Matches}\`
- Readiness state: \`${report.requestedToolResult.readiness.readinessState}\`
- Readiness blocking prerequisite: \`${report.requestedToolResult.readiness.blockingPrerequisite}\`

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Current Host Preflight

- Requested: \`${report.currentHostGpuProofPreflight.requested}\`
- Eligible: \`${report.currentHostGpuProofPreflight.hostEligibleForNativeGpuProof}\`
- Blockers: \`${report.currentHostGpuProofPreflight.blockers.join('; ') || 'none'}\`

## Safety Boundary

${Object.entries(report.sequencePolicy).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next Action

${report.nextExactAction}
`
}

const args = parseArgs()
const report = buildReport(args)
if (args.writeRecords) {
  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true })
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}
console.log(JSON.stringify(report, null, 2))
if (args.requireHostEligible && !report.currentHostGpuProofPreflight.hostEligibleForNativeGpuProof) {
  process.exitCode = 2
} else if (args.requireAcceptedProof && !report.booleans.acceptedPrivateProofForRequestedTool) {
  process.exitCode = 2
}
