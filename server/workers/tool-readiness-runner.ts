import { createWorkerClaimService } from '../services/worker-claim-service'
import type { ServiceContext } from '../types'
import { checkAudioFlux } from './tools/audioflux-check'
import { checkFFmpeg } from './tools/ffmpeg-check'
import { checkFFprobe } from './tools/ffprobe-check'
import { checkOpenCV } from './tools/opencv-check'
import { checkPlaywright } from './tools/playwright-check'
import { checkPySceneDetect } from './tools/pyscenedetect-check'
import { checkRemotion } from './tools/remotion-check'
import { checkSharpLibvips } from './tools/sharp-libvips-check'
import { checkSignalsmithStretch } from './tools/signalsmith-stretch-check'
import { checkVapourSynth } from './tools/vapoursynth-check'
import { checkWhisper } from './tools/whisper-check'
import type { ToolCheck, ToolReadinessCheckResult, WorkerToolName } from './tool-readiness-types'
import { WORKER_TOOL_NAMES } from './tool-readiness-types'

const TOOL_CHECKS: Record<WorkerToolName, ToolCheck> = {
  ffmpeg: checkFFmpeg,
  ffprobe: checkFFprobe,
  remotion: checkRemotion,
  sharp_libvips: checkSharpLibvips,
  audioflux: checkAudioFlux,
  signalsmith_stretch: checkSignalsmithStretch,
  whisper: checkWhisper,
  pyscenedetect: checkPySceneDetect,
  opencv: checkOpenCV,
  vapoursynth: checkVapourSynth,
  playwright: checkPlaywright,
}

const REQUIRED_BY_DEFAULT = new Set<WorkerToolName>(['ffmpeg', 'ffprobe'])

export interface ToolReadinessRunnerInput {
  workspaceId?: string
  workerType?: string
  toolName?: WorkerToolName
  recordResults?: boolean
  requiredTools?: WorkerToolName[]
}

export interface ToolReadinessRunnerResult {
  runtimeMode: string
  checks: ToolReadinessCheckResult[]
  missingRequiredTools: string[]
  warnings: string[]
}

export async function runToolReadinessChecks(
  context: ServiceContext,
  input: ToolReadinessRunnerInput = {},
): Promise<ToolReadinessRunnerResult> {
  const toolNames = input.toolName ? [input.toolName] : [...WORKER_TOOL_NAMES]
  const requiredTools = new Set(input.requiredTools ?? [...REQUIRED_BY_DEFAULT])
  const checks = await Promise.all(toolNames.map((toolName) => TOOL_CHECKS[toolName]({
    env: context.env,
    required: requiredTools.has(toolName),
  })))

  if (input.recordResults && input.workspaceId) {
    const service = createWorkerClaimService(context)
    await Promise.all(checks.map((check) => service.recordToolRuntimeCheck({
      workspaceId: input.workspaceId ?? 'workspace-unknown',
      workerType: input.workerType ?? 'tool_readiness_worker',
      runtimeRegion: context.env.gcsDefaultRegion === 'europe-west1' ? 'europe-west1' : 'us-east1',
      toolName: check.toolName,
      toolVersion: check.version,
      checkStatus: check.status,
      checkSummary: check.summary,
      binaryPath: check.binaryPath,
      capabilitiesJson: {
        capabilities: check.capabilities,
        required: check.required,
        durationMs: check.durationMs,
        errorCode: check.errorCode,
      },
    })))
  }

  const missingRequiredTools = checks
    .filter((check) => check.required && check.status !== 'passed')
    .map((check) => check.toolName)

  const warnings = [
    ...checks
      .filter((check) => !check.required && check.status !== 'passed')
      .map((check) => `${check.toolName}: ${check.summary}`),
  ]

  if (context.env.strictToolReadiness && missingRequiredTools.length > 0) {
    warnings.push(`STRICT_TOOL_READINESS blocked required tools: ${missingRequiredTools.join(', ')}.`)
  }

  return {
    runtimeMode: context.env.workerRuntimeMode,
    checks,
    missingRequiredTools,
    warnings,
  }
}
