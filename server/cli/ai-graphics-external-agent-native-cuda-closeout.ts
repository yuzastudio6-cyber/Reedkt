import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  hasReadableSafetensorsHeader,
  minimumPrivateModelFileBytes,
  probePrivateSourceImage,
} from '../workers/masks/private-runtime-input-preflight'
import {
  SAM2_MODEL_DOWNLOAD_GCS_PATH,
  SAM2_MODEL_DOWNLOAD_LOCAL_DIR,
} from '../activation/sam2-model-download/sam2-model-download-policy'
import { MASK_MODEL_DOWNLOAD_LOCAL_DIR } from '../activation/mask-model-download/mask-model-download-policy'
import { BIREFNET_STAGING_PATH } from '../activation/mask-model-approval/mask-model-candidate-registry'

const decision =
  'ai_graphics_external_agent_native_cuda_closeout_prepared_for_remaining_two_tools'
const blockedStatus =
  'native_cuda_closeout_blocked_until_eligible_host_private_models_and_private_source_are_present'
const acceptedStatus =
  'native_cuda_closeout_accepted_for_remaining_two_tools'
const privateModelRootEnvVar = 'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT'
const privateModelManifestDirEnvVar =
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_MANIFEST_DIR'
const sam2CheckpointEnvVar = 'REEDITPRO_AI_GRAPHICS_SAM2_CHECKPOINT'
const birefnetModelEnvVar = 'REEDITPRO_AI_GRAPHICS_BIREFNET_MODEL'
const restoreApprovedModelCacheEnvVar =
  'REEDITPRO_AI_GRAPHICS_RESTORE_APPROVED_MODEL_CACHE'
const defaultPrivateModelRoot =
  '.local-artifacts/ai-graphics/private-model-cache'
const defaultOutputRoot =
  '.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout'
const runtimeContainerPlatform = 'linux/amd64'
const hostPreflightScript = 'ai-graphics:gpu-runtime-proof-local-preflight'
const modelWeightManifestReviewScript =
  'ai-graphics:model-weight-manifest-review:validate'
const manifestScript =
  'ai-graphics:external-agent-gpu-model-runtime-input-manifest'
const proofSequenceScript =
  'ai-graphics:external-agent-gpu-model-private-proof-sequence'
const toolCallScript = 'ai-graphics:external-agent-tool-call'
const readinessScript = 'ai-graphics:external-agent-execution-readiness'
const nativeCudaCloseoutResultRootFlag = '--native-cuda-closeout-result-root'
const defaultCpuSafeGpuModelRouteProofPacket =
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-safe-gpu-model-route-proof.json'
const defaultCpuModelGpuModelRouteProofPacket =
  '.local-artifacts/ai-graphics/external-agent-execution-readiness/cpu-model-gpu-model-route-proof-next.json'

const toolIds = ['sam2', 'birefnet'] as const
type ToolId = typeof toolIds[number]
const requiredBirefNetRuntimeFiles = [
  'model.safetensors',
  'config.json',
  'BiRefNet_config.py',
  'birefnet.py',
]
const minimumPrivateCheckpointBytes = minimumPrivateModelFileBytes
const acceptedSam2CheckpointExtensions = new Set(['.pt', '.pth'])

type RuntimeTarget = {
  image: string
  modelField: string
  modelFlag: string
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
  modelWeightManifestDir?: string
  sam2CheckpointLocalPath?: string
  birefnetModelLocalPath?: string
  outputRoot: string
  sourceImage?: string
  existingProofResults: string[]
  cpuSafeGpuModelRouteProofPacket?: string
  cpuModelGpuModelRouteProofPacket?: string
  scriptOut?: string
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
  explicitModelPathProvided: boolean
  explicitModelPathAccepted: boolean
  modelPathSource: 'explicit_path' | 'private_model_root_candidate' | null
  modelWeightManifestDirProvided: boolean
  modelWeightManifestReviewAccepted: boolean
  modelWeightManifestReviewBlocker: string | null
  sourceImageProvided: boolean
  sourceImageExists: boolean
  sourceImageAccepted: boolean
  sourceImageFileType: string | null
  sourceImageBlocker: string | null
  callableNow: true
  executableNow: boolean
  executionState: 'executable' | 'blocked_with_reason' | 'failed_with_diagnostics'
  blockingPrerequisites: string[]
  outputDirectory: string
  runtimeInputManifestPath: string
  proofResultPath: string
  finalExternalAgentToolCallResultPath: string
  modelWeightManifestReviewCommand: string
  manifestMaterializerCommand: string
  nativeGpuProofSequenceCommand: string
  finalExternalAgentToolCallCommand: string
  runtimeAttemptPerformed: boolean
  runtimeAttemptAccepted: boolean
  runtimeAttemptFailure: string | null
  reports: {
    modelWeightManifestReview: JsonRecord | null
    manifest: JsonRecord | null
    proofSequence: JsonRecord | null
    readiness: JsonRecord | null
  }
}

const runtimeTargets: Record<ToolId, RuntimeTarget> = {
  sam2: {
    image: 'reeditpro/ai-graphics-sam2-runtime:proof-local',
    modelField: 'sam2CheckpointLocalPath',
    modelFlag: '--sam2-checkpoint',
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
    modelFlag: '--birefnet-model',
    manifestId: 'birefnet_private_manifest_review_v1',
    checksumEvidenceRef:
      'private://reeditpro/ai-graphics/checksum-evidence/birefnet.json',
    candidates: ['.', 'birefnet', 'ZhengPeng7/BiRefNet', 'BiRefNet'],
    candidateKind: 'birefnet_model_directory',
  },
}
const approvedActivationLocalModelRootCandidatesByTool: Record<ToolId, string[]> = {
  sam2: [SAM2_MODEL_DOWNLOAD_LOCAL_DIR],
  birefnet: [MASK_MODEL_DOWNLOAD_LOCAL_DIR],
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
    modelWeightManifestDir:
      stringFlag('--model-weight-manifest-dir') ??
      process.env[privateModelManifestDirEnvVar],
    sam2CheckpointLocalPath:
      stringFlag('--sam2-checkpoint') ??
      process.env[sam2CheckpointEnvVar],
    birefnetModelLocalPath:
      stringFlag('--birefnet-model') ??
      process.env[birefnetModelEnvVar],
    outputRoot: stringFlag('--output-root') ?? defaultOutputRoot,
    sourceImage: stringFlag('--source-image'),
    existingProofResults: stringFlags('--existing-proof-result'),
    cpuSafeGpuModelRouteProofPacket:
      stringFlag('--cpu-safe-gpu-model-route-proof-packet') ??
      defaultCpuSafeGpuModelRouteProofPacket,
    cpuModelGpuModelRouteProofPacket:
      stringFlag('--cpu-model-gpu-model-route-proof-packet') ??
      defaultCpuModelGpuModelRouteProofPacket,
    scriptOut: stringFlag('--script-out'),
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

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

type ScriptToken = string | { raw: string }

function scriptToken(token: ScriptToken): string {
  return typeof token === 'string' ? shellQuote(token) : token.raw
}

function bashCommand(tokens: ScriptToken[]): string {
  return tokens.map(scriptToken).join(' ')
}

function bashContinuation(tokens: ScriptToken[]): string {
  return tokens.map(scriptToken).join(' \\\n  ')
}

function explicitModelPathForTool(
  args: Pick<ParsedArgs, 'sam2CheckpointLocalPath' | 'birefnetModelLocalPath'>,
  toolId: ToolId,
): string | undefined {
  return toolId === 'sam2'
    ? args.sam2CheckpointLocalPath
    : args.birefnetModelLocalPath
}

function sam2CheckpointAccepted(candidatePath: string): boolean {
  if (!fs.existsSync(candidatePath)) return false
  const checkpointStats = fs.statSync(candidatePath)
  return (
    checkpointStats.isFile() &&
    checkpointStats.size >= minimumPrivateCheckpointBytes &&
    acceptedSam2CheckpointExtensions.has(path.extname(candidatePath).toLowerCase())
  )
}

function birefNetModelDirectoryAccepted(candidatePath: string): boolean {
  if (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isDirectory()) {
    return false
  }
  if (
    !requiredBirefNetRuntimeFiles.every((fileName) => {
      const requiredFile = path.join(candidatePath, fileName)
      return fs.existsSync(requiredFile) && fs.statSync(requiredFile).isFile()
    })
  ) {
    return false
  }
  const modelFile = path.join(candidatePath, 'model.safetensors')
  return (
    fs.statSync(modelFile).size >= minimumPrivateModelFileBytes &&
    hasReadableSafetensorsHeader(modelFile)
  )
}

function readableDirectory(value: string): boolean {
  try {
    return fs.existsSync(value) && fs.statSync(value).isDirectory()
  } catch {
    return false
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function modelRootCandidates(toolId: ToolId, privateModelRoot: string): string[] {
  return uniqueStrings([
    privateModelRoot,
    ...approvedActivationLocalModelRootCandidatesByTool[toolId].filter(
      readableDirectory,
    ),
  ])
}

function modelCandidatePath(root: string, candidate: string): string {
  return candidate === '.' ? root : path.join(root, candidate)
}

function modelCandidateForTool(
  toolId: ToolId,
  privateModelRoot: string,
  explicitModelPath: string | undefined,
): {
  present: boolean
  matchingCandidate: string | null
  blocker: string | null
  source: 'explicit_path' | 'private_model_root_candidate' | null
} {
  const target = runtimeTargets[toolId]
  try {
    if (explicitModelPath) {
      assertLocalPath(target.modelFlag, explicitModelPath)
      if (target.candidateKind === 'file') {
        if (sam2CheckpointAccepted(explicitModelPath)) {
          return {
            present: true,
            matchingCandidate: explicitModelPath,
            blocker: null,
            source: 'explicit_path',
          }
        }
        return {
          present: false,
          matchingCandidate: null,
          blocker:
            `${target.modelFlag} must point to an existing private local SAM2 checkpoint ` +
            `(.pt/.pth, at least ${minimumPrivateCheckpointBytes} bytes): ${explicitModelPath}`,
          source: null,
        }
      }
      if (birefNetModelDirectoryAccepted(explicitModelPath)) {
        return {
          present: true,
          matchingCandidate: explicitModelPath,
          blocker: null,
          source: 'explicit_path',
        }
      }
      return {
        present: false,
        matchingCandidate: null,
        blocker:
          `${target.modelFlag} must point to an existing private local BiRefNet model directory containing ${requiredBirefNetRuntimeFiles.join(', ')}: ${explicitModelPath}`,
        source: null,
      }
    }
    const roots = modelRootCandidates(toolId, privateModelRoot)
    const checkedCandidates: string[] = []
    const rootBlockers: string[] = []
    for (const root of roots) {
      assertLocalPath('--private-model-root', root)
      if (!fs.existsSync(root)) {
        rootBlockers.push(`private model root does not exist: ${root}`)
        continue
      }
      if (!fs.statSync(root).isDirectory()) {
        rootBlockers.push(`private model root is not a directory: ${root}`)
        continue
      }
      for (const candidate of target.candidates) {
        const candidatePath = modelCandidatePath(root, candidate)
        checkedCandidates.push(candidatePath)
        if (target.candidateKind === 'file') {
          if (sam2CheckpointAccepted(candidatePath)) {
            return {
              present: true,
              matchingCandidate: candidatePath,
              blocker: null,
              source: 'private_model_root_candidate',
            }
          }
          continue
        }
        if (birefNetModelDirectoryAccepted(candidatePath)) {
          return {
            present: true,
            matchingCandidate: candidatePath,
            blocker: null,
            source: 'private_model_root_candidate',
          }
        }
      }
    }
    if (rootBlockers.length && checkedCandidates.length === 0) {
      return {
        present: false,
        matchingCandidate: null,
        blocker: rootBlockers.join('; '),
        source: null,
      }
    }
    return {
      present: false,
      matchingCandidate: null,
      blocker:
        `private model root did not contain ${target.modelField}; checked ` +
        (checkedCandidates.length ? checkedCandidates.join(', ') : target.candidates.join(', ')) +
        (toolId === 'birefnet'
          ? `; BiRefNet candidates must include ${requiredBirefNetRuntimeFiles.join(', ')} with a readable model.safetensors header`
          : `; SAM2 candidates must be .pt/.pth files at least ${minimumPrivateCheckpointBytes} bytes`),
      source: null,
    }
  } catch (error) {
    return {
      present: false,
      matchingCandidate: null,
      blocker: error instanceof Error ? error.message : String(error),
      source: null,
    }
  }
}

function acceptedModelPathForTool(args: ParsedArgs, toolId: ToolId): string | undefined {
  const explicitModelPath = explicitModelPathForTool(args, toolId)
  const candidate = modelCandidateForTool(
    toolId,
    args.privateModelRoot,
    explicitModelPath,
  )
  return candidate.present && candidate.matchingCandidate
    ? candidate.matchingCandidate
    : undefined
}

function sourceImageProbe(sourceImage: string | undefined): {
  exists: boolean
  accepted: boolean
  fileType: string | null
  blocker: string | null
} {
  if (!sourceImage) {
    return {
      exists: false,
      accepted: false,
      fileType: null,
      blocker: '--source-image must point to a private approved local frame',
    }
  }
  try {
    assertLocalPath('--source-image', sourceImage)
    return probePrivateSourceImage(sourceImage)
  } catch (error) {
    return {
      exists: false,
      accepted: false,
      fileType: null,
      blocker: error instanceof Error ? error.message : String(error),
    }
  }
}

function modelWeightManifestReviewArgs(
  args: ParsedArgs,
): string[] {
  return [
    '--manifest-dir',
    args.modelWeightManifestDir ?? '<reviewed-private-model-weight-manifests>',
    '--allow-partial',
  ]
}

function modelWeightManifestReviewCommand(args: ParsedArgs): string {
  return shellCommand(modelWeightManifestReviewScript, modelWeightManifestReviewArgs(args))
}

function manifestReviewErrorFromResult(result: JsonRecord | undefined): string {
  const errors = result?.errors
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.filter((entry): entry is string => typeof entry === 'string').join('; ')
  }
  return 'reviewed private model-weight manifest was not accepted for native GPU proof input'
}

function evaluateModelWeightManifestReview(args: ParsedArgs): {
  report: JsonRecord | null
  acceptedToolIds: Set<ToolId>
  blockerByToolId: Record<ToolId, string | null>
  failure: string | null
} {
  const initialBlockers = Object.fromEntries(toolIds.map((toolId) => [
    toolId,
    null,
  ])) as Record<ToolId, string | null>
  const acceptedToolIds = new Set<ToolId>()
  if (!args.modelWeightManifestDir) {
    return {
      report: null,
      acceptedToolIds,
      blockerByToolId: Object.fromEntries(toolIds.map((toolId) => [
        toolId,
        `reviewed private model-weight manifest directory is required; pass --model-weight-manifest-dir or set ${privateModelManifestDirEnvVar}`,
      ])) as Record<ToolId, string | null>,
      failure: null,
    }
  }

  try {
    assertLocalPath('--model-weight-manifest-dir', args.modelWeightManifestDir)
    if (!fs.existsSync(args.modelWeightManifestDir)) {
      return {
        report: null,
        acceptedToolIds,
        blockerByToolId: Object.fromEntries(toolIds.map((toolId) => [
          toolId,
          `reviewed private model-weight manifest directory does not exist: ${args.modelWeightManifestDir}`,
        ])) as Record<ToolId, string | null>,
        failure: null,
      }
    }
    if (!fs.statSync(args.modelWeightManifestDir).isDirectory()) {
      return {
        report: null,
        acceptedToolIds,
        blockerByToolId: Object.fromEntries(toolIds.map((toolId) => [
          toolId,
          `reviewed private model-weight manifest path is not a directory: ${args.modelWeightManifestDir}`,
        ])) as Record<ToolId, string | null>,
        failure: null,
      }
    }

    const report = runNpmJson(
      modelWeightManifestReviewScript,
      modelWeightManifestReviewArgs(args),
      args.timeoutMs,
    )
    const validationResults = Array.isArray(report.validationResults)
      ? report.validationResults.filter((entry): entry is JsonRecord =>
          entry !== null && typeof entry === 'object')
      : []
    const blockerByToolId = { ...initialBlockers }
    for (const toolId of toolIds) {
      const result = validationResults.find((entry) => entry.toolId === toolId)
      if (
        result?.reviewAccepted === true &&
        result?.eligibleForNativeGpuProofInput === true
      ) {
        acceptedToolIds.add(toolId)
      } else {
        blockerByToolId[toolId] = manifestReviewErrorFromResult(result)
      }
    }
    return {
      report,
      acceptedToolIds,
      blockerByToolId,
      failure: null,
    }
  } catch (error) {
    return {
      report: null,
      acceptedToolIds,
      blockerByToolId: Object.fromEntries(toolIds.map((toolId) => [
        toolId,
        `reviewed private model-weight manifest validation failed: ${formatCaughtError(error)}`,
      ])) as Record<ToolId, string | null>,
      failure: formatCaughtError(error),
    }
  }
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
  const acceptedModelPath = acceptedModelPathForTool(args, toolId)
  const manifestArgs = [
    '--tool',
    toolId,
    '--source-image',
    args.sourceImage ?? '<private-approved-frame.png>',
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
  if (acceptedModelPath) {
    manifestArgs.push(target.modelFlag, acceptedModelPath)
  } else {
    manifestArgs.push('--private-model-root', args.privateModelRoot)
  }
  if (args.modelWeightManifestDir) {
    manifestArgs.push(
      '--model-weight-manifest-dir',
      args.modelWeightManifestDir,
    )
  }
  return manifestArgs
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
  const requestedNativeCudaProofArgs = allRemainingNativeCudaToolsRequested(args)
    ? [
        nativeCudaCloseoutResultRootFlag,
        args.outputRoot,
      ]
    : args.requestedTools.flatMap((toolId) => [
        '--local-runtime-proof-result',
        proofResultPath(args.outputRoot, toolId),
      ])
  return [
    ...(args.cpuSafeGpuModelRouteProofPacket
      ? [
          '--cpu-safe-gpu-model-route-proof-packet',
          args.cpuSafeGpuModelRouteProofPacket,
        ]
      : []),
    ...(args.cpuModelGpuModelRouteProofPacket
      ? [
          '--cpu-model-gpu-model-route-proof-packet',
          args.cpuModelGpuModelRouteProofPacket,
        ]
      : []),
    ...args.existingProofResults.flatMap((file) => [
      '--local-runtime-proof-result',
      file,
    ]),
    ...requestedNativeCudaProofArgs,
  ]
}

function allRemainingNativeCudaToolsRequested(args: ParsedArgs): boolean {
  return toolIds.every((toolId) => args.requestedTools.includes(toolId))
}

function readinessResultHandoff(args: ParsedArgs): JsonRecord {
  const usesResultRoot = allRemainingNativeCudaToolsRequested(args)
  return {
    mode: usesResultRoot
      ? 'native_cuda_closeout_result_root'
      : 'scoped_local_runtime_proof_results',
    usesNativeCudaCloseoutResultRoot: usesResultRoot,
    usesScopedLocalRuntimeProofResults: !usesResultRoot,
    nativeCudaCloseoutResultRoot: usesResultRoot ? args.outputRoot : null,
    requestedTools: args.requestedTools,
    expectedProofResults: args.requestedTools.map((toolId) =>
      proofResultPath(args.outputRoot, toolId)),
    existingProofResults: args.existingProofResults,
  }
}

function nativeCudaCloseoutScriptPrivateInputChecks(args: ParsedArgs): string[] {
  const lines = [
    'if [[ ! -f "$PRIVATE_SOURCE_IMAGE" ]]; then',
    '  echo "Private approved source image file is missing: $PRIVATE_SOURCE_IMAGE" >&2',
    '  exit 2',
    'fi',
    'MODEL_PATH_ARGS=()',
  ]

  if (args.requestedTools.includes('sam2')) {
    lines.push(
      'if [[ -n "$SAM2_CHECKPOINT" ]]; then',
      '  if [[ ! -f "$SAM2_CHECKPOINT" ]]; then',
      '    echo "Explicit private SAM2 checkpoint is missing or not a file: $SAM2_CHECKPOINT" >&2',
      '    exit 2',
      '  fi',
      '  MODEL_PATH_ARGS+=(--sam2-checkpoint "$SAM2_CHECKPOINT")',
      'else',
      '  if [[ -z "$PRIVATE_MODEL_ROOT" || ! -d "$PRIVATE_MODEL_ROOT" ]]; then',
      '    echo "Private model root is missing or is not a directory: $PRIVATE_MODEL_ROOT" >&2',
      '    exit 2',
      '  fi',
      '  SAM2_CHECKPOINT_FOUND=0',
      `  for candidate in ${runtimeTargets.sam2.candidates
        .map((candidate) => `"${`$PRIVATE_MODEL_ROOT/${candidate}`}"`)
        .join(' ')}; do`,
      '    if [[ -f "$candidate" ]]; then',
      '      SAM2_CHECKPOINT_FOUND=1',
      '      break',
      '    fi',
      '  done',
      '  if [[ "$SAM2_CHECKPOINT_FOUND" != "1" ]]; then',
      `    echo "Private SAM2 checkpoint not found under $PRIVATE_MODEL_ROOT; expected one of: ${runtimeTargets.sam2.candidates.join(', ')}" >&2`,
      '    exit 2',
      '  fi',
      'fi',
    )
  }

  if (args.requestedTools.includes('birefnet')) {
    lines.push(
      'if [[ -n "$BIREFNET_MODEL" ]]; then',
      '  if [[ ! -d "$BIREFNET_MODEL" || ! -f "$BIREFNET_MODEL/model.safetensors" || ! -f "$BIREFNET_MODEL/config.json" || ! -f "$BIREFNET_MODEL/BiRefNet_config.py" || ! -f "$BIREFNET_MODEL/birefnet.py" ]]; then',
      `    echo "Explicit private BiRefNet model directory is missing required files (${requiredBirefNetRuntimeFiles.join(', ')}): $BIREFNET_MODEL" >&2`,
      '    exit 2',
      '  fi',
      '  MODEL_PATH_ARGS+=(--birefnet-model "$BIREFNET_MODEL")',
      'else',
      '  if [[ -z "$PRIVATE_MODEL_ROOT" || ! -d "$PRIVATE_MODEL_ROOT" ]]; then',
      '    echo "Private model root is missing or is not a directory: $PRIVATE_MODEL_ROOT" >&2',
      '    exit 2',
      '  fi',
      '  BIREFNET_MODEL_FOUND=0',
      `  for candidate in ${runtimeTargets.birefnet.candidates
        .map((candidate) => `"${`$PRIVATE_MODEL_ROOT/${candidate}`}"`)
        .join(' ')}; do`,
      '    if [[ -d "$candidate" && -f "$candidate/model.safetensors" && -f "$candidate/config.json" && -f "$candidate/BiRefNet_config.py" && -f "$candidate/birefnet.py" ]]; then',
      '      BIREFNET_MODEL_FOUND=1',
      '      break',
      '    fi',
      '  done',
      '  if [[ "$BIREFNET_MODEL_FOUND" != "1" ]]; then',
      `    echo "Private BiRefNet model directory not found under $PRIVATE_MODEL_ROOT; expected one candidate containing: ${requiredBirefNetRuntimeFiles.join(', ')}" >&2`,
      '    exit 2',
      '  fi',
      'fi',
    )
  }

  return lines
}

function nativeCudaCloseoutScriptApprovedActivationDefaults(
  args: ParsedArgs,
): string[] {
  const lines: string[] = []
  if (args.requestedTools.includes('sam2')) {
    const sam2Root = approvedActivationLocalModelRootCandidatesByTool.sam2[0]
    lines.push(
      'if [[ -z "$SAM2_CHECKPOINT" ]]; then',
      `  APPROVED_SAM2_CACHE_CHECKPOINT=${shellQuote(path.join(sam2Root, 'sam2.1_hiera_tiny.pt'))}`,
      '  if [[ -f "$APPROVED_SAM2_CACHE_CHECKPOINT" ]]; then',
      '    SAM2_CHECKPOINT="$APPROVED_SAM2_CACHE_CHECKPOINT"',
      '  fi',
      'fi',
    )
  }
  if (args.requestedTools.includes('birefnet')) {
    const birefnetRoot = approvedActivationLocalModelRootCandidatesByTool.birefnet[0]
    lines.push(
      'if [[ -z "$BIREFNET_MODEL" ]]; then',
      `  APPROVED_BIREFNET_CACHE_MODEL=${shellQuote(birefnetRoot)}`,
      '  if [[ -d "$APPROVED_BIREFNET_CACHE_MODEL" && -f "$APPROVED_BIREFNET_CACHE_MODEL/model.safetensors" && -f "$APPROVED_BIREFNET_CACHE_MODEL/config.json" && -f "$APPROVED_BIREFNET_CACHE_MODEL/BiRefNet_config.py" && -f "$APPROVED_BIREFNET_CACHE_MODEL/birefnet.py" ]]; then',
      '    BIREFNET_MODEL="$APPROVED_BIREFNET_CACHE_MODEL"',
      '  fi',
      'fi',
    )
  }
  return lines
}

function nativeCudaModelRestoreCommands(): JsonRecord {
  return {
    restoreApprovedModelCacheEnvVar,
    restoreApprovedModelCacheOptInValue: 'true',
    sam2ApprovedStagingRestoreCommand:
      `mkdir -p ${shellQuote(SAM2_MODEL_DOWNLOAD_LOCAL_DIR)} && ` +
      `gcloud storage rsync --recursive ${shellQuote(SAM2_MODEL_DOWNLOAD_GCS_PATH)} ${shellQuote(SAM2_MODEL_DOWNLOAD_LOCAL_DIR)}`,
    birefnetApprovedStagingRestoreCommand:
      `mkdir -p ${shellQuote(MASK_MODEL_DOWNLOAD_LOCAL_DIR)} && ` +
      `gcloud storage rsync --recursive ${shellQuote(BIREFNET_STAGING_PATH)} ${shellQuote(MASK_MODEL_DOWNLOAD_LOCAL_DIR)}`,
    sam2ApprovedLocalCacheDir: SAM2_MODEL_DOWNLOAD_LOCAL_DIR,
    birefnetApprovedLocalCacheDir: MASK_MODEL_DOWNLOAD_LOCAL_DIR,
    localOnlyRuntimeUse: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function nativeCudaCloseoutScriptApprovedModelRestore(args: ParsedArgs): string[] {
  const lines = [
    `${restoreApprovedModelCacheEnvVar}="\${${restoreApprovedModelCacheEnvVar}:-false}"`,
    `if [[ "$${restoreApprovedModelCacheEnvVar}" == "true" ]]; then`,
    '  echo "Restoring approved private model cache for native CUDA closeout."',
  ]
  if (args.requestedTools.includes('sam2')) {
    lines.push(
      `  mkdir -p ${shellQuote(SAM2_MODEL_DOWNLOAD_LOCAL_DIR)}`,
      `  gcloud storage rsync --recursive ${shellQuote(SAM2_MODEL_DOWNLOAD_GCS_PATH)} ${shellQuote(SAM2_MODEL_DOWNLOAD_LOCAL_DIR)}`,
    )
  }
  if (args.requestedTools.includes('birefnet')) {
    lines.push(
      `  mkdir -p ${shellQuote(MASK_MODEL_DOWNLOAD_LOCAL_DIR)}`,
      `  gcloud storage rsync --recursive ${shellQuote(BIREFNET_STAGING_PATH)} ${shellQuote(MASK_MODEL_DOWNLOAD_LOCAL_DIR)}`,
    )
  }
  lines.push('fi')
  return lines
}

function writeNativeCudaCloseoutScript(
  args: ParsedArgs,
  scriptOut: string,
): JsonRecord {
  assertLocalArtifactPath('--script-out', scriptOut)
  const scriptDir = path.dirname(scriptOut)
  fs.mkdirSync(scriptDir, { recursive: true })
  const closeoutTokens: ScriptToken[] = [
    'npm',
    'run',
    '--silent',
    'ai-graphics:external-agent-native-cuda-closeout',
    '--',
    '--detect-host',
    '--attempt-local-runtime',
    '--strict-exit-code',
    '--private-model-root',
    { raw: '"$PRIVATE_MODEL_ROOT"' },
    '--model-weight-manifest-dir',
    { raw: '"$PRIVATE_MODEL_MANIFEST_DIR"' },
    '--source-image',
    { raw: '"$PRIVATE_SOURCE_IMAGE"' },
    { raw: '"${MODEL_PATH_ARGS[@]}"' },
    '--output-root',
    { raw: '"$OUTPUT_ROOT"' },
    '--cpu-safe-gpu-model-route-proof-packet',
    { raw: '"$CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET"' },
    '--cpu-model-gpu-model-route-proof-packet',
    { raw: '"$CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET"' },
    ...args.requestedTools.flatMap((toolId): ScriptToken[] => [
      '--tool',
      toolId,
    ]),
    ...args.existingProofResults.flatMap((file): ScriptToken[] => [
      '--existing-proof-result',
      file,
    ]),
  ]
  if (args.timeoutMs) {
    closeoutTokens.push('--timeout-ms', String(args.timeoutMs))
  }

  const requestedNativeCudaReadinessTokens: ScriptToken[] =
    allRemainingNativeCudaToolsRequested(args)
      ? [
          nativeCudaCloseoutResultRootFlag,
          { raw: '"$OUTPUT_ROOT"' },
        ]
      : args.requestedTools.flatMap((toolId): ScriptToken[] => [
          '--local-runtime-proof-result',
          { raw: `"$OUTPUT_ROOT/${toolId}/harness-result.json"` },
        ])
  const readinessTokens: ScriptToken[] = [
    'npm',
    'run',
    '--silent',
    readinessScript,
    '--',
    ...(args.cpuSafeGpuModelRouteProofPacket
      ? [
          '--cpu-safe-gpu-model-route-proof-packet',
          { raw: '"$CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET"' },
        ]
      : []),
    ...(args.cpuModelGpuModelRouteProofPacket
      ? [
          '--cpu-model-gpu-model-route-proof-packet',
          { raw: '"$CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET"' },
        ]
      : []),
    ...args.existingProofResults.flatMap((file): ScriptToken[] => [
      '--local-runtime-proof-result',
      file,
    ]),
    ...requestedNativeCudaReadinessTokens,
  ]

  const contents = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    '# Local-only native CUDA closeout for the remaining AI graphics tools.',
    '# GPU work is on-demand only while this scoped script is running.',
    '# Do not commit .local-artifacts outputs, model weights, source media, or proof artifacts.',
    'export DEVELOPER_DIR="${DEVELOPER_DIR:-/Library/Developer/CommandLineTools}"',
    `PRIVATE_MODEL_ROOT="\${${privateModelRootEnvVar}:-}"`,
    `PRIVATE_MODEL_MANIFEST_DIR="\${${privateModelManifestDirEnvVar}:-}"`,
    `SAM2_CHECKPOINT="\${${sam2CheckpointEnvVar}:-}"`,
    `BIREFNET_MODEL="\${${birefnetModelEnvVar}:-}"`,
    'PRIVATE_SOURCE_IMAGE="${REEDITPRO_AI_GRAPHICS_PRIVATE_SOURCE_IMAGE:-}"',
    'OUTPUT_ROOT="${REEDITPRO_AI_GRAPHICS_NATIVE_CUDA_CLOSEOUT_OUTPUT_ROOT:-}"',
    'CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET="${REEDITPRO_AI_GRAPHICS_CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET:-}"',
    'CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET="${REEDITPRO_AI_GRAPHICS_CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET:-}"',
    'if [[ -z "$PRIVATE_MODEL_ROOT" ]]; then',
    `  PRIVATE_MODEL_ROOT=${shellQuote(args.privateModelRoot)}`,
    'fi',
    'if [[ -z "$PRIVATE_SOURCE_IMAGE" ]]; then',
    `  PRIVATE_SOURCE_IMAGE=${shellQuote(args.sourceImage ?? '')}`,
    'fi',
    'if [[ -z "$SAM2_CHECKPOINT" ]]; then',
    `  SAM2_CHECKPOINT=${shellQuote(args.sam2CheckpointLocalPath ?? '')}`,
    'fi',
    'if [[ -z "$BIREFNET_MODEL" ]]; then',
    `  BIREFNET_MODEL=${shellQuote(args.birefnetModelLocalPath ?? '')}`,
    'fi',
    'if [[ -z "$PRIVATE_MODEL_MANIFEST_DIR" ]]; then',
    `  PRIVATE_MODEL_MANIFEST_DIR=${shellQuote(args.modelWeightManifestDir ?? '')}`,
    'fi',
    ...nativeCudaCloseoutScriptApprovedModelRestore(args),
    ...nativeCudaCloseoutScriptApprovedActivationDefaults(args),
    'if [[ -z "$OUTPUT_ROOT" ]]; then',
    `  OUTPUT_ROOT=${shellQuote(args.outputRoot)}`,
    'fi',
    'if [[ -z "$CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET" ]]; then',
    `  CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET=${shellQuote(args.cpuSafeGpuModelRouteProofPacket ?? '')}`,
    'fi',
    'if [[ -z "$CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET" ]]; then',
    `  CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET=${shellQuote(args.cpuModelGpuModelRouteProofPacket ?? '')}`,
    'fi',
    'if [[ -z "$PRIVATE_SOURCE_IMAGE" ]]; then',
    '  echo "Set REEDITPRO_AI_GRAPHICS_PRIVATE_SOURCE_IMAGE to an approved private local frame." >&2',
    '  exit 2',
    'fi',
    'if [[ -z "$CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET" || -z "$CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET" ]]; then',
    '  echo "Set accepted CPU-safe and CPU-model GPU/model route proof packet paths before the native CUDA closeout." >&2',
    '  exit 2',
    'fi',
    'if [[ ! -f "$CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET" ]]; then',
    '  echo "Accepted CPU-safe GPU/model route proof packet file is missing: $CPU_SAFE_GPU_MODEL_ROUTE_PROOF_PACKET" >&2',
    '  exit 2',
    'fi',
    'if [[ ! -f "$CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET" ]]; then',
    '  echo "Accepted CPU-model GPU/model route proof packet file is missing: $CPU_MODEL_GPU_MODEL_ROUTE_PROOF_PACKET" >&2',
    '  exit 2',
    'fi',
    'if [[ -z "$PRIVATE_MODEL_MANIFEST_DIR" ]]; then',
    `  echo "Set ${privateModelManifestDirEnvVar} to reviewed private model-weight manifests." >&2`,
    '  exit 2',
    'fi',
    ...nativeCudaCloseoutScriptPrivateInputChecks(args),
    '',
    bashCommand([
      'npm',
      'run',
      '--silent',
      modelWeightManifestReviewScript,
      '--',
      '--manifest-dir',
      { raw: '"$PRIVATE_MODEL_MANIFEST_DIR"' },
      '--allow-partial',
    ]),
    '',
    bashCommand([
      'npm',
      'run',
      '--silent',
      hostPreflightScript,
      '--',
      '--detect-host',
      '--require-host-eligible',
    ]),
    '',
    bashContinuation(closeoutTokens),
    '',
    bashContinuation(readinessTokens),
    '',
  ].join('\n')

  fs.writeFileSync(scriptOut, contents)
  fs.chmodSync(scriptOut, 0o700)

  return {
    path: scriptOut,
    written: true,
    localOnly: true,
    executable: true,
    hostPreflightCommand: bashCommand([
      'npm',
      'run',
      '--silent',
      hostPreflightScript,
      '--',
      '--detect-host',
      '--require-host-eligible',
    ]),
    modelWeightManifestReviewCommand: bashCommand([
      'npm',
      'run',
      '--silent',
      modelWeightManifestReviewScript,
      '--',
      '--manifest-dir',
      { raw: '"$PRIVATE_MODEL_MANIFEST_DIR"' },
      '--allow-partial',
    ]),
    modelRestoreCommands: nativeCudaModelRestoreCommands(),
    nativeCudaCloseoutCommand: bashContinuation(closeoutTokens),
    all21ReadinessRecheckCommand: bashContinuation(readinessTokens),
    cpuSafeGpuModelRouteProofPacket:
      args.cpuSafeGpuModelRouteProofPacket ?? null,
    cpuModelGpuModelRouteProofPacket:
      args.cpuModelGpuModelRouteProofPacket ?? null,
    readinessResultHandoff: readinessResultHandoff(args),
    privateInputPreflightChecks: {
      privateModelRootDirectoryRequired: args.requestedTools.some((toolId) =>
        !explicitModelPathForTool(args, toolId)),
      privateSourceImageFileRequired: true,
      sam2CheckpointCandidateRequired: args.requestedTools.includes('sam2'),
      sam2ExplicitCheckpointEnvVar: sam2CheckpointEnvVar,
      sam2ExplicitCheckpointPathProvided:
        Boolean(args.sam2CheckpointLocalPath),
      birefnetModelDirectoryRequired:
        args.requestedTools.includes('birefnet'),
      birefnetExplicitModelEnvVar: birefnetModelEnvVar,
      birefnetExplicitModelPathProvided:
        Boolean(args.birefnetModelLocalPath),
      birefnetRequiredFiles: requiredBirefNetRuntimeFiles,
    },
    expectedProofResults: args.requestedTools.map((toolId) =>
      path.join(args.outputRoot, toolId, 'harness-result.json')),
  }
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
  modelManifestReview: ReturnType<typeof evaluateModelWeightManifestReview>,
): ToolProbe {
  const target = runtimeTargets[toolId]
  const explicitModelPath = explicitModelPathForTool(args, toolId)
  const candidate = modelCandidateForTool(
    toolId,
    args.privateModelRoot,
    explicitModelPath,
  )
  const sourceImage = sourceImageProbe(args.sourceImage)
  const modelWeightManifestReviewAccepted =
    modelManifestReview.acceptedToolIds.has(toolId)
  const modelWeightManifestReviewBlocker =
    modelManifestReview.blockerByToolId[toolId]
  const blockingPrerequisites = [
    !currentHostEligible
      ? `native CUDA host not eligible: ${currentHostBlockers.join('; ') || 'run --detect-host on the execution host'}`
      : null,
    !candidate.present ? candidate.blocker : null,
    !modelWeightManifestReviewAccepted ? modelWeightManifestReviewBlocker : null,
    !sourceImage.accepted ? sourceImage.blocker : null,
  ].filter((entry): entry is string => Boolean(entry))
  const canAttempt =
    args.attemptLocalRuntime &&
    currentHostEligible &&
    candidate.present &&
    modelWeightManifestReviewAccepted &&
    sourceImage.accepted
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
    explicitModelPathProvided: Boolean(explicitModelPath),
    explicitModelPathAccepted:
      Boolean(explicitModelPath) && candidate.present && candidate.source === 'explicit_path',
    modelPathSource: candidate.source,
    modelWeightManifestDirProvided: Boolean(args.modelWeightManifestDir),
    modelWeightManifestReviewAccepted,
    modelWeightManifestReviewBlocker,
    sourceImageProvided: Boolean(args.sourceImage),
    sourceImageExists: sourceImage.exists,
    sourceImageAccepted: sourceImage.accepted,
    sourceImageFileType: sourceImage.fileType,
    sourceImageBlocker: sourceImage.blocker,
    callableNow: true,
    executableNow: attempt.accepted,
    executionState,
    blockingPrerequisites,
    outputDirectory: outputDirectoryForTool(args.outputRoot, toolId),
    runtimeInputManifestPath: runtimeInputManifestPath(args.outputRoot, toolId),
    proofResultPath: proofResultPath(args.outputRoot, toolId),
    finalExternalAgentToolCallResultPath: finalToolCallResultPath(args.outputRoot, toolId),
    modelWeightManifestReviewCommand: modelWeightManifestReviewCommand(args),
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
      modelWeightManifestReview: modelManifestReview.report,
      manifest: attempt.manifest,
      proofSequence: attempt.proofSequence,
      readiness: attempt.readiness,
    },
  }
}

function buildReport(args: ParsedArgs): JsonRecord {
  assertLocalPath('--private-model-root', args.privateModelRoot)
  assertLocalArtifactPath('--output-root', args.outputRoot)
  if (args.scriptOut) assertLocalArtifactPath('--script-out', args.scriptOut)
  if (args.sourceImage) assertLocalPath('--source-image', args.sourceImage)
  if (args.sam2CheckpointLocalPath) {
    assertLocalPath('--sam2-checkpoint', args.sam2CheckpointLocalPath)
  }
  if (args.birefnetModelLocalPath) {
    assertLocalPath('--birefnet-model', args.birefnetModelLocalPath)
  }
  if (args.modelWeightManifestDir) {
    assertLocalPath('--model-weight-manifest-dir', args.modelWeightManifestDir)
  }
  for (const proofResult of args.existingProofResults) {
    assertLocalPath('--existing-proof-result', proofResult)
  }
  if (args.cpuSafeGpuModelRouteProofPacket) {
    assertLocalPath(
      '--cpu-safe-gpu-model-route-proof-packet',
      args.cpuSafeGpuModelRouteProofPacket,
    )
  }
  if (args.cpuModelGpuModelRouteProofPacket) {
    assertLocalPath(
      '--cpu-model-gpu-model-route-proof-packet',
      args.cpuModelGpuModelRouteProofPacket,
    )
  }
  const preflight = hostPreflight(args.detectHost)
  const currentHostBlockers = hostBlockers(preflight)
  const currentHostEligible = args.detectHost ? hostEligible(preflight) : false
  const modelManifestReview = evaluateModelWeightManifestReview(args)
  const tools = args.requestedTools.map((toolId) =>
    toolProbe(
      args,
      toolId,
      currentHostBlockers,
      currentHostEligible,
      modelManifestReview,
    ))
  const executableTools = tools.filter((tool) => tool.executableNow)
  const allRequestedToolsExecutable = executableTools.length === tools.length
  const allRemainingNativeCudaToolsCovered = tools.length === toolIds.length
  const allRemainingNativeCudaToolsExecutable =
    allRemainingNativeCudaToolsCovered && allRequestedToolsExecutable
  const readinessCommand = shellCommand(readinessScript, readinessArgs(args))
  const scriptReport = args.scriptOut
    ? writeNativeCudaCloseoutScript(args, args.scriptOut)
    : null

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
      modelWeightManifestDir: args.modelWeightManifestDir ?? null,
      modelWeightManifestDirEnvVar: privateModelManifestDirEnvVar,
      sam2CheckpointLocalPath: args.sam2CheckpointLocalPath ?? null,
      sam2CheckpointEnvVar,
      birefnetModelLocalPath: args.birefnetModelLocalPath ?? null,
      birefnetModelEnvVar,
      sourceImage: args.sourceImage ?? null,
      outputRoot: args.outputRoot,
      existingProofResults: args.existingProofResults,
      cpuSafeGpuModelRouteProofPacket:
        args.cpuSafeGpuModelRouteProofPacket ?? null,
      cpuModelGpuModelRouteProofPacket:
        args.cpuModelGpuModelRouteProofPacket ?? null,
      localOnly: true,
    },
    nativeCudaCloseoutLocalOnlyScript: scriptReport,
    readinessResultHandoff: readinessResultHandoff(args),
    currentHostGpuProofPreflight: {
      requested: args.detectHost,
      hostEligibleForNativeGpuProof: currentHostEligible,
      blockers: currentHostBlockers,
      report: preflight,
      command:
        `npm run --silent ${hostPreflightScript} -- --detect-host --require-host-eligible`,
    },
    modelWeightManifestReview: {
      requested: Boolean(args.modelWeightManifestDir),
      manifestDir: args.modelWeightManifestDir ?? null,
      command: modelWeightManifestReviewCommand(args),
      acceptedRequestedTools: args.requestedTools.filter((toolId) =>
        modelManifestReview.acceptedToolIds.has(toolId)),
      blockedRequestedTools: args.requestedTools.filter((toolId) =>
        !modelManifestReview.acceptedToolIds.has(toolId)),
      failure: modelManifestReview.failure,
      report: modelManifestReview.report,
    },
    tools,
    modelRestoreCommands: nativeCudaModelRestoreCommands(),
    all21ReadinessRecheckCommand: readinessCommand,
    closeoutSequence: {
      step1:
        `Restore the approved private model cache with ${restoreApprovedModelCacheEnvVar}=true in the generated script, place private SAM2 and BiRefNet model weights under the private model root, or pass --sam2-checkpoint/--birefnet-model with exact private local paths.`,
      step2:
        `Pass --model-weight-manifest-dir or set ${privateModelManifestDirEnvVar} with accepted private SAM2/BiRefNet manifest records.`,
      step3: 'Pass --source-image with an approved private local frame.',
      step4: 'Run on native linux/amd64 with Docker NVIDIA runtime and nvidia-smi visible.',
      step5:
        'Run this command with --detect-host --attempt-local-runtime --strict-exit-code.',
      step6:
        'Rerun all-21 readiness with the accepted CPU-safe and CPU-model GPU/model route proof packets plus the new SAM2 and BiRefNet harness-result.json files.',
    },
    booleans: {
      nativeCudaCloseoutRunnerReady: true,
      sourceRuntimeInputManifestMaterializerReused: true,
      sourcePrivateProofSequenceReused: true,
      sourceExternalAgentToolCallReused: true,
      sourceModelWeightManifestReviewValidatorReused: true,
      allRemainingNativeCudaToolsCovered,
      readinessRecheckUsesNativeCudaCloseoutResultRoot:
        allRemainingNativeCudaToolsRequested(args),
      readinessRecheckUsesScopedLocalRuntimeProofResults:
        !allRemainingNativeCudaToolsRequested(args),
      sam2Covered: args.requestedTools.includes('sam2'),
      birefnetCovered: args.requestedTools.includes('birefnet'),
      reviewedPrivateManifestDirProvided:
        Boolean(args.modelWeightManifestDir),
      reviewedPrivateManifestAcceptedForAllRequestedTools:
        args.requestedTools.every((toolId) =>
          modelManifestReview.acceptedToolIds.has(toolId)),
      currentHostEligibleForNativeGpuProof: currentHostEligible,
      runtimeAttemptRequested: args.attemptLocalRuntime,
      runtimeAttemptPerformed: tools.some((tool) => tool.runtimeAttemptPerformed),
      acceptedNativeCudaProofForAllRequestedTools: allRequestedToolsExecutable,
      acceptedNativeCudaProofForAllRemainingTools:
        allRemainingNativeCudaToolsExecutable,
      nativeCudaCloseoutLocalOnlyScriptGenerated: scriptReport !== null,
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
