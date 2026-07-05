import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_agent_native_cuda_closeout_prepared_for_remaining_two_tools'
const blockedStatus =
  'native_cuda_closeout_blocked_until_eligible_host_private_models_and_private_source_are_present'
const acceptedStatus =
  'native_cuda_closeout_accepted_for_remaining_two_tools'
const privateModelRootEnvVar = 'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT'
const defaultPrivateModelRoot =
  '.local-artifacts/ai-graphics/private-model-cache'
const defaultOutputRoot =
  '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout'
const runtimeContainerPlatform = 'linux/amd64'
const hostPreflightScript = 'ai-graphics:gpu-runtime-proof-local-preflight'
const manifestScript =
  'ai-graphics:external-agent-gpu-model-runtime-input-manifest'
const proofSequenceScript =
  'ai-graphics:external-agent-gpu-model-private-proof-sequence'
const toolCallScript = 'ai-graphics:external-agent-tool-call'
const readinessScript = 'ai-graphics:external-agent-execution-readiness'

const toolIds = ['sam2', 'birefnet'] as const
type ToolId = typeof toolIds[number]
const requiredBirefNetRuntimeFiles = [
  'model.safetensors',
  'config.json',
  'BiRefNet_config.py',
  'birefnet.py',
]

type RuntimeTarget = {
  image: string
  modelField: string
  manifestId: string
  checksumEvidenceRef: string
  candidates: string[]
  candidateKind: 'file' | 'birefnet_model_directory'
}

type JsonRecord = Record<string, unknown>

type ParsedArgs = {
  requestedTools: ToolId[]
  detectHost: boolean
  attemptLocalRuntime: boolean
  strictExitCode: boolean
  privateModelRoot: string
  outputRoot: string
  sourceImage?: string
  existingProofResults: string[]
  timeoutMs?: number
}

type ToolProbe = {
  toolId: ToolId
  modelField: string
  runtimeContainerImage: string
  expectedPrivateModelRootCandidates: string[]
  privateModelRootCandidatePresent: boolean
  privateModelRootMatchingCandidate: string | null
  privateModelRootBlocker: string | null
  sourceImageProvided: boolean
  sourceImageExists: boolean
  callableNow: true
  executableNow: boolean
  executionState: 'executable' | 'blocked_with_reason' | 'failed_with_diagnostics'
  blockingPrerequisites: string[]
  outputDirectory: string
  runtimeInputManifestPath: string
  proofResultPath: string
  finalExternalAgentToolCallResultPath: string
  manifestMaterializerCommand: string
  nativeGpuProofSequenceCommand: string
  finalExternalAgentToolCallCommand: string
  runtimeAttemptPerformed: boolean
  runtimeAttemptAccepted: boolean
  runtimeAttemptFailure: string | null
  reports: {
    manifest: JsonRecord | null
    proofSequence: JsonRecord | null
    readiness: JsonRecord | null
  }
}

const runtimeTargets: Record<ToolId, RuntimeTarget> = {
  sam2: {
    image: 'reeditpro/ai-graphics-sam2-runtime:proof-local',
    modelField: 'sam2CheckpointLocalPath',
    manifestId: 'sam2_private_manifest_review_v1',
    checksumEvidenceRef:
      'private://reeditpro/ai-graphics/checksum-evidence/sam2.json',
    candidates: [
      'sam2.1_hiera_tiny.pt',
      'sam2/sam2.1_hiera_tiny.pt',
      'sam2/sam2-checkpoint.pt',
      'sam2/checkpoint.pt',
    ],
    candidateKind: 'file',
  },
  birefnet: {
    image: 'reeditpro/ai-graphics-birefnet-runtime:proof-local',
    modelField: 'birefnetModelLocalPath',
    manifestId: 'birefnet_private_manifest_review_v1',
    checksumEvidenceRef:
      'private://reeditpro/ai-graphics/checksum-evidence/birefnet.json',
    candidates: ['birefnet', 'ZhengPeng7/BiRefNet', 'BiRefNet'],
    candidateKind: 'birefnet_model_directory',
  },
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

function stringFlags(flag: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== flag) continue
    const value = process.argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`${flag} requires a value`)
    }
    values.push(value)
  }
  return values
}

function isToolId(value: string): value is ToolId {
  return toolIds.includes(value as ToolId)
}

function parseArgs(): ParsedArgs {
  const requestedTools = stringFlags('--tool')
  const parsedTools = requestedTools.length === 0
    ? [...toolIds]
    : requestedTools.map((toolId) => {
        if (!isToolId(toolId)) {
          throw new Error(`--tool must be one of ${toolIds.join(', ')}`)
        }
        return toolId
      })
  const timeoutValue = stringFlag('--timeout-ms')
  const timeoutMs = timeoutValue ? Number(timeoutValue) : undefined
  if (timeoutValue && (!Number.isInteger(timeoutMs) || Number(timeoutMs) <= 0)) {
    throw new Error('--timeout-ms must be a positive integer')
  }
  return {
    requestedTools: [...new Set(parsedTools)],
    detectHost: hasFlag('--detect-host'),
    attemptLocalRuntime: hasFlag('--attempt-local-runtime'),
    strictExitCode: hasFlag('--strict-exit-code'),
    privateModelRoot:
      stringFlag('--private-model-root') ??
      process.env[privateModelRootEnvVar] ??
      defaultPrivateModelRoot,
    outputRoot: stringFlag('--output-root') ?? defaultOutputRoot,
    sourceImage: stringFlag('--source-image'),
    existingProofResults: stringFlags('--existing-proof-result'),
    timeoutMs,
  }
}

function isLocalArtifactPath(value: string): boolean {
  const normalized = path.normalize(value)
  return normalized === '.local-artifacts' ||
    normalized.startsWith(`.local-artifacts${path.sep}`)
}

function assertLocalPath(label: string, value: string): void {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    throw new Error(`${label} must be a local path, not a URL or URI`)
  }
  if (value.includes('\0')) throw new Error(`${label} must not contain null bytes`)
  if (value.split(/[\\/]+/).includes('..')) {
    throw new Error(`${label} must not contain path traversal segments`)
  }
}

function assertLocalArtifactPath(label: string, value: string): void {
  assertLocalPath(label, value)
  if (!isLocalArtifactPath(value)) {
    throw new Error(`${label} must stay under .local-artifacts/`)
  }
}

function shellCommand(script: string, args: string[]): string {
  return ['npm run --silent', script, '--', ...args].join(' ')
}

function modelCandidateForTool(
  toolId: ToolId,
  privateModelRoot: string,
): {
  present: boolean
  matchingCandidate: string | null
  blocker: string | null
} {
  const target = runtimeTargets[toolId]
  try {
    assertLocalPath('--private-model-root', privateModelRoot)
    if (!fs.existsSync(privateModelRoot)) {
      return {
        present: false,
        matchingCandidate: null,
        blocker: `private model root does not exist: ${privateModelRoot}`,
      }
    }
    if (!fs.statSync(privateModelRoot).isDirectory()) {
      return {
        present: false,
        matchingCandidate: null,
        blocker: `private model root is not a directory: ${privateModelRoot}`,
      }
    }
    for (const candidate of target.candidates) {
      const candidatePath = path.join(privateModelRoot, candidate)
      if (target.candidateKind === 'file') {
        if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
          return {
            present: true,
            matchingCandidate: candidatePath,
            blocker: null,
          }
        }
        continue
      }
      const modelFile = path.join(candidatePath, 'model.safetensors')
      const requiredFilesPresent = requiredBirefNetRuntimeFiles.every((fileName) => {
        const requiredFile = path.join(candidatePath, fileName)
        return fs.existsSync(requiredFile) && fs.statSync(requiredFile).isFile()
      })
      if (
        fs.existsSync(candidatePath) &&
        fs.statSync(candidatePath).isDirectory() &&
        fs.existsSync(modelFile) &&
        fs.statSync(modelFile).isFile() &&
        requiredFilesPresent
      ) {
        return {
          present: true,
          matchingCandidate: candidatePath,
          blocker: null,
        }
      }
    }
    return {
      present: false,
      matchingCandidate: null,
      blocker:
        `private model root did not contain ${target.modelField}; checked ` +
        target.candidates.join(', ') +
        (toolId === 'birefnet'
          ? `; BiRefNet candidates must include ${requiredBirefNetRuntimeFiles.join(', ')}`
          : ''),
    }
  } catch (error) {
    return {
      present: false,
      matchingCandidate: null,
      blocker: error instanceof Error ? error.message : String(error),
    }
  }
}

function sourceImageExists(sourceImage: string | undefined): boolean {
  if (!sourceImage) return false
  assertLocalPath('--source-image', sourceImage)
  return fs.existsSync(sourceImage) && fs.statSync(sourceImage).isFile()
}

function outputDirectoryForTool(outputRoot: string, toolId: ToolId): string {
  return path.join(outputRoot, toolId)
}

function runtimeInputManifestPath(outputRoot: string, toolId: ToolId): string {
  return path.join(outputDirectoryForTool(outputRoot, toolId), 'runtime-inputs.json')
}

function proofResultPath(outputRoot: string, toolId: ToolId): string {
  return path.join(outputDirectoryForTool(outputRoot, toolId), 'harness-result.json')
}

function finalToolCallResultPath(outputRoot: string, toolId: ToolId): string {
  return path.join(
    outputDirectoryForTool(outputRoot, toolId),
    'external-agent-single-tool-call-result.json',
  )
}

function manifestArgs(args: ParsedArgs, toolId: ToolId): string[] {
  const target = runtimeTargets[toolId]
  return [
    '--tool',
    toolId,
    '--source-image',
    args.sourceImage ?? '<private-approved-frame.png>',
    '--private-model-root',
    args.privateModelRoot,
    '--output-dir',
    outputDirectoryForTool(args.outputRoot, toolId),
    '--manifest-out',
    runtimeInputManifestPath(args.outputRoot, toolId),
    '--model-weight-manifest-id',
    target.manifestId,
    '--model-weight-checksum-evidence-ref',
    target.checksumEvidenceRef,
    '--runtime-container-image',
    target.image,
    '--runtime-container-platform',
    runtimeContainerPlatform,
  ]
}

function proofSequenceArgs(args: ParsedArgs, toolId: ToolId): string[] {
  const target = runtimeTargets[toolId]
  const proofArgs = [
    '--attempt-local-runtime',
    '--runtime-backend',
    'docker_container',
    '--runtime-container-image',
    target.image,
    '--runtime-container-platform',
    runtimeContainerPlatform,
    '--tool',
    toolId,
    '--runtime-input-manifest',
    runtimeInputManifestPath(args.outputRoot, toolId),
    '--detect-host',
    '--require-host-eligible',
    '--require-accepted-proof',
    '--result-out',
    proofResultPath(args.outputRoot, toolId),
  ]
  if (args.timeoutMs) proofArgs.push('--timeout-ms', String(args.timeoutMs))
  return proofArgs
}

function finalToolCallArgs(args: ParsedArgs, toolId: ToolId): string[] {
  const target = runtimeTargets[toolId]
  const toolCallArgs = [
    '--tool',
    toolId,
    '--attempt-gpu-runtime',
    '--expect-state',
    'executable',
    '--require-output-hash',
    '--require-private-only-boundary',
    '--strict-exit-code',
    '--runtime-backend',
    'docker_container',
    '--runtime-container-image',
    target.image,
    '--runtime-container-platform',
    runtimeContainerPlatform,
    '--runtime-input-manifest',
    runtimeInputManifestPath(args.outputRoot, toolId),
    '--result-out',
    finalToolCallResultPath(args.outputRoot, toolId),
  ]
  if (args.timeoutMs) toolCallArgs.push('--timeout-ms', String(args.timeoutMs))
  return toolCallArgs
}

function readinessArgs(args: ParsedArgs): string[] {
  return [
    ...args.existingProofResults.flatMap((file) => [
      '--local-runtime-proof-result',
      file,
    ]),
    ...args.requestedTools.flatMap((toolId) => [
      '--local-runtime-proof-result',
      proofResultPath(args.outputRoot, toolId),
    ]),
  ]
}

function runNpmJson(
  script: string,
  args: string[],
  timeoutMs: number | undefined,
): JsonRecord {
  const output = childProcess.execFileSync(
    'npm',
    ['run', '--silent', script, '--', ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 240 * 1024 * 1024,
      timeout: timeoutMs ?? 20 * 60 * 1000,
      env: {
        ...process.env,
        DEVELOPER_DIR:
          process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
      },
    },
  )
  return JSON.parse(output) as JsonRecord
}

function formatCaughtError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const maybeChildError = error as Error & {
    stdout?: unknown
    stderr?: unknown
  }
  return [
    error.message,
    maybeChildError.stdout
      ? `stdout: ${String(maybeChildError.stdout).slice(0, 4000)}`
      : '',
    maybeChildError.stderr
      ? `stderr: ${String(maybeChildError.stderr).slice(0, 4000)}`
      : '',
  ].filter(Boolean).join('\n')
}

function hostPreflight(detectHost: boolean): JsonRecord | null {
  if (!detectHost) return null
  return runNpmJson(hostPreflightScript, ['--detect-host'], undefined)
}

function hostBlockers(preflight: JsonRecord | null): string[] {
  const hostEnvironment = preflight?.hostEnvironment
  if (!hostEnvironment || typeof hostEnvironment !== 'object') return []
  const blockers = (hostEnvironment as JsonRecord).blockers
  return Array.isArray(blockers)
    ? blockers.filter((entry): entry is string => typeof entry === 'string')
    : []
}

function hostEligible(preflight: JsonRecord | null): boolean {
  const hostEnvironment = preflight?.hostEnvironment
  if (!hostEnvironment || typeof hostEnvironment !== 'object') return false
  return (hostEnvironment as JsonRecord).hostEligibleForNativeGpuProof === true
}

function attemptToolCloseout(
  args: ParsedArgs,
  toolId: ToolId,
): {
  manifest: JsonRecord | null
  proofSequence: JsonRecord | null
  readiness: JsonRecord | null
  accepted: boolean
  failure: string | null
} {
  try {
    fs.mkdirSync(outputDirectoryForTool(args.outputRoot, toolId), {
      recursive: true,
    })
    const manifest = runNpmJson(manifestScript, manifestArgs(args, toolId), args.timeoutMs)
    const proofSequence = runNpmJson(
      proofSequenceScript,
      proofSequenceArgs(args, toolId),
      args.timeoutMs,
    )
    const readiness = runNpmJson(readinessScript, readinessArgs(args), args.timeoutMs)
    const accepted =
      (proofSequence.booleans as JsonRecord | undefined)
        ?.acceptedPrivateProofForRequestedTool === true &&
      (proofSequence.booleans as JsonRecord | undefined)
        ?.finalExternalAgentSingleToolCallExecutable === true
    return {
      manifest,
      proofSequence,
      readiness,
      accepted,
      failure: accepted ? null : 'private proof sequence did not accept the scoped runtime proof',
    }
  } catch (error) {
    return {
      manifest: null,
      proofSequence: null,
      readiness: null,
      accepted: false,
      failure: formatCaughtError(error),
    }
  }
}

function toolProbe(
  args: ParsedArgs,
  toolId: ToolId,
  currentHostBlockers: string[],
  currentHostEligible: boolean,
): ToolProbe {
  const target = runtimeTargets[toolId]
  const candidate = modelCandidateForTool(toolId, args.privateModelRoot)
  const hasSourceImage = sourceImageExists(args.sourceImage)
  const blockingPrerequisites = [
    !currentHostEligible
      ? `native CUDA host not eligible: ${currentHostBlockers.join('; ') || 'run --detect-host on the execution host'}`
      : null,
    !candidate.present ? candidate.blocker : null,
    !hasSourceImage
      ? '--source-image must point to a private approved local frame'
      : null,
  ].filter((entry): entry is string => Boolean(entry))
  const canAttempt =
    args.attemptLocalRuntime &&
    currentHostEligible &&
    candidate.present &&
    hasSourceImage
  const attempt = canAttempt
    ? attemptToolCloseout(args, toolId)
    : {
        manifest: null,
        proofSequence: null,
        readiness: null,
        accepted: false,
        failure: null,
      }
  const executionState = attempt.accepted
    ? 'executable'
    : attempt.failure
    ? 'failed_with_diagnostics'
    : 'blocked_with_reason'

  return {
    toolId,
    modelField: target.modelField,
    runtimeContainerImage: target.image,
    expectedPrivateModelRootCandidates: target.candidates,
    privateModelRootCandidatePresent: candidate.present,
    privateModelRootMatchingCandidate: candidate.matchingCandidate,
    privateModelRootBlocker: candidate.blocker,
    sourceImageProvided: Boolean(args.sourceImage),
    sourceImageExists: hasSourceImage,
    callableNow: true,
    executableNow: attempt.accepted,
    executionState,
    blockingPrerequisites,
    outputDirectory: outputDirectoryForTool(args.outputRoot, toolId),
    runtimeInputManifestPath: runtimeInputManifestPath(args.outputRoot, toolId),
    proofResultPath: proofResultPath(args.outputRoot, toolId),
    finalExternalAgentToolCallResultPath: finalToolCallResultPath(args.outputRoot, toolId),
    manifestMaterializerCommand: shellCommand(manifestScript, manifestArgs(args, toolId)),
    nativeGpuProofSequenceCommand: shellCommand(
      proofSequenceScript,
      proofSequenceArgs(args, toolId),
    ),
    finalExternalAgentToolCallCommand: shellCommand(
      toolCallScript,
      finalToolCallArgs(args, toolId),
    ),
    runtimeAttemptPerformed: canAttempt,
    runtimeAttemptAccepted: attempt.accepted,
    runtimeAttemptFailure: attempt.failure,
    reports: {
      manifest: attempt.manifest,
      proofSequence: attempt.proofSequence,
      readiness: attempt.readiness,
    },
  }
}

function buildReport(args: ParsedArgs): JsonRecord {
  assertLocalPath('--private-model-root', args.privateModelRoot)
  assertLocalArtifactPath('--output-root', args.outputRoot)
  if (args.sourceImage) assertLocalPath('--source-image', args.sourceImage)
  for (const proofResult of args.existingProofResults) {
    assertLocalPath('--existing-proof-result', proofResult)
  }
  const preflight = hostPreflight(args.detectHost)
  const currentHostBlockers = hostBlockers(preflight)
  const currentHostEligible = args.detectHost ? hostEligible(preflight) : false
  const tools = args.requestedTools.map((toolId) =>
    toolProbe(args, toolId, currentHostBlockers, currentHostEligible))
  const executableTools = tools.filter((tool) => tool.executableNow)
  const allRequestedToolsExecutable = executableTools.length === tools.length
  const allRemainingNativeCudaToolsCovered = tools.length === toolIds.length
  const allRemainingNativeCudaToolsExecutable =
    allRemainingNativeCudaToolsCovered && allRequestedToolsExecutable
  const readinessCommand = shellCommand(readinessScript, readinessArgs(args))

  return {
    schemaVersion:
      '2026-07-04.ai-graphics.external-agent-native-cuda-closeout',
    decision,
    status: allRequestedToolsExecutable ? acceptedStatus : blockedStatus,
    summary:
      'Coordinates the final native CUDA closeout for the two remaining AI graphics tools, SAM2 and BiRefNet. Defaults to inspection and command planning only. Runtime execution is opt-in, scoped per tool, requires private local model/input paths, requires an eligible native Linux/amd64 NVIDIA host, and keeps GPU startup on-demand only.',
    targetToolIds: args.requestedTools,
    toolsCovered: tools.length,
    counts: {
      toolsCovered: tools.length,
      callableTools: tools.length,
      executableTools: executableTools.length,
      blockedWithReasonTools:
        tools.filter((tool) => tool.executionState === 'blocked_with_reason').length,
      failedWithDiagnosticsTools:
        tools.filter((tool) => tool.executionState === 'failed_with_diagnostics').length,
      runtimeAttemptsPerformed: tools.filter((tool) => tool.runtimeAttemptPerformed).length,
      acceptedNativeCudaRuntimeProofs:
        tools.filter((tool) => tool.runtimeAttemptAccepted).length,
    },
    inputs: {
      privateModelRoot: args.privateModelRoot,
      privateModelRootEnvVar,
      sourceImage: args.sourceImage ?? null,
      outputRoot: args.outputRoot,
      existingProofResults: args.existingProofResults,
      localOnly: true,
    },
    currentHostGpuProofPreflight: {
      requested: args.detectHost,
      hostEligibleForNativeGpuProof: currentHostEligible,
      blockers: currentHostBlockers,
      report: preflight,
      command:
        `npm run --silent ${hostPreflightScript} -- --detect-host --require-host-eligible`,
    },
    tools,
    all21ReadinessRecheckCommand: readinessCommand,
    closeoutSequence: {
      step1: 'Place private SAM2 and BiRefNet model weights under the private model root or pass --private-model-root.',
      step2: 'Pass --source-image with an approved private local frame.',
      step3: 'Run on native linux/amd64 with Docker NVIDIA runtime and nvidia-smi visible.',
      step4:
        'Run this command with --detect-host --attempt-local-runtime --strict-exit-code.',
      step5:
        'Rerun all-21 readiness with existing proof refs plus the new SAM2 and BiRefNet harness-result.json files.',
    },
    booleans: {
      nativeCudaCloseoutRunnerReady: true,
      sourceRuntimeInputManifestMaterializerReused: true,
      sourcePrivateProofSequenceReused: true,
      sourceExternalAgentToolCallReused: true,
      allRemainingNativeCudaToolsCovered,
      sam2Covered: args.requestedTools.includes('sam2'),
      birefnetCovered: args.requestedTools.includes('birefnet'),
      currentHostEligibleForNativeGpuProof: currentHostEligible,
      runtimeAttemptRequested: args.attemptLocalRuntime,
      runtimeAttemptPerformed: tools.some((tool) => tool.runtimeAttemptPerformed),
      acceptedNativeCudaProofForAllRequestedTools: allRequestedToolsExecutable,
      acceptedNativeCudaProofForAllRemainingTools:
        allRemainingNativeCudaToolsExecutable,
      agentCanSubmitControlledRequestsForRemainingTools: true,
      agentCanExecuteRemainingNativeCudaToolsNow:
        allRemainingNativeCudaToolsExecutable,
      agentCanExecuteAll21ToolsNow: allRemainingNativeCudaToolsExecutable,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoadedByThisRunner: false,
      toolExecutionPerformed: tools.some((tool) => tool.runtimeAttemptPerformed),
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: tools.some((tool) => tool.runtimeAttemptPerformed),
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

try {
  const args = parseArgs()
  const report = buildReport(args)
  console.log(JSON.stringify(report, null, 2))
  const accepted =
    (report.booleans as JsonRecord).acceptedNativeCudaProofForAllRequestedTools === true
  if (args.strictExitCode && !accepted) {
    process.exitCode = 2
  }
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    status: 'native_cuda_closeout_failed_with_diagnostics',
    errorMessage: error instanceof Error ? error.message : String(error),
    booleans: {
      nativeCudaCloseoutRunnerReady: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      modelWeightsDownloaded: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }, null, 2))
  process.exit(2)
}
