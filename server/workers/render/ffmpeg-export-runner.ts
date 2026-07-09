import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { promisify } from 'node:util'
import { probeMediaFile } from '../media/ffprobe-media-adapter'
import { buildRenderArtifactRecord } from './render-artifact-writer'
import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest, RenderToolExecutionResult } from './render-execution-types'

const execFileAsync = promisify(execFile)

export async function runFfmpegExport(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
  commandPlan: RenderCommandPlan
}): Promise<RenderToolExecutionResult> {
  if (input.commandPlan.tool !== 'ffmpeg') {
    return skipped(input.commandPlan, 'ffmpeg_not_selected', 'FFmpeg command plan was not selected.')
  }
  if (input.executionInput.mode !== 'local_dev' || input.executionInput.enableLocalDevRender !== true) {
    return skipped(input.commandPlan, 'ffmpeg_render_disabled_or_not_local_dev', 'FFmpeg preview/export runs only when explicitly enabled in local-dev.')
  }
  const sourcePath = input.executionInput.proxyLocalPaths?.[0] ?? input.executionInput.sourceLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return skipped(input.commandPlan, 'ffmpeg_render_source_missing', 'Safe local source/proxy media is unavailable.')
  }
  if (!input.executionInput.outputDirectory || !existsSync(input.executionInput.outputDirectory)) {
    return skipped(input.commandPlan, 'ffmpeg_render_output_root_missing', 'Safe local output directory is unavailable.')
  }
  if (!input.commandPlan.expectedOutputPath) {
    return skipped(input.commandPlan, 'ffmpeg_render_output_path_missing', 'The allowlisted command plan has no output path.')
  }
  if (input.executionInput.sourceAudioRequired !== false) {
    const audioSourcePath = input.executionInput.audioLocalPaths?.[0] ?? sourcePath
    const sourceProbe = await probeMediaFile({
      localFilePath: audioSourcePath,
      ffprobeBin: input.executionInput.ffprobeBin ?? 'ffprobe',
      timeoutMs: Math.min(input.executionInput.timeoutMs ?? 600_000, 60_000),
    })
    if (sourceProbe.audioStreams.length === 0) {
      return skipped(input.commandPlan, 'ffmpeg_render_source_audio_missing', 'The approved render profile requires source audio, but no audio stream was found.')
    }
  }

  try {
    await execFileAsync(input.commandPlan.command, input.commandPlan.args, {
      timeout: input.executionInput.timeoutMs ?? 600_000,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    })
    const outputPath = input.commandPlan.expectedOutputPath
    const [outputStat, outputProbe, checksumSha256] = await Promise.all([
      stat(outputPath),
      probeMediaFile({
        localFilePath: outputPath,
        ffprobeBin: input.executionInput.ffprobeBin ?? 'ffprobe',
        timeoutMs: Math.min(input.executionInput.timeoutMs ?? 600_000, 60_000),
      }),
      sha256File(outputPath),
    ])
    const artifact = buildFfmpegOutputArtifact({
      executionInput: input.executionInput,
      sizeBytes: outputStat.size,
      checksumSha256,
      durationSeconds: outputProbe.durationSeconds,
      width: outputProbe.width,
      height: outputProbe.height,
      videoCodec: outputProbe.videoStreams[0]?.codecName ?? outputProbe.codecName,
      audioCodec: outputProbe.audioStreams[0]?.codecName ?? 'none',
    })
    return {
      status: 'completed',
      tool: 'ffmpeg',
      commandPlan: input.commandPlan,
      artifact,
      outputLocalPath: outputPath,
      outputProbe,
      warnings: ['Private local render completed; no public delivery, signed URL, provider call, or production deployment occurred.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: 'ffmpeg',
      commandPlan: input.commandPlan,
      warnings: [],
      errorMessage: error instanceof Error ? error.message : 'FFmpeg final render execution failed.',
    }
  }
}

function skipped(commandPlan: RenderCommandPlan, code: string, message: string): RenderToolExecutionResult {
  return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code, message, tool: 'ffmpeg' }, warnings: [] }
}

export function buildFfmpegOutputArtifact(input: {
  executionInput: FinalRenderExecutionInput
  sizeBytes?: number
  checksumSha256?: string
  durationSeconds?: number
  width?: number
  height?: number
  videoCodec?: string
  audioCodec?: string
}): ReturnType<typeof buildRenderArtifactRecord> {
  return buildRenderArtifactRecord({
    workspaceId: input.executionInput.workspaceId,
    projectId: input.executionInput.projectId,
    mediaAssetId: input.executionInput.mediaAssetId,
    artifactType: input.executionInput.renderMode === 'final_export' ? 'final_export' : 'preview_video',
    fileName: input.executionInput.outputFileName ?? (input.executionInput.renderMode === 'final_export' ? 'm16a-final-export.mp4' : 'm16a-preview.mp4'),
    sourceOfTruth: input.executionInput.renderMode === 'final_export',
    previewAllowed: input.executionInput.renderMode !== 'final_export',
    sizeBytes: input.sizeBytes,
    checksum: input.checksumSha256,
    metadata: {
      tool: 'ffmpeg',
      plannedOnly: false,
      privateLocalExecution: true,
      ...(typeof input.durationSeconds === 'number' ? { durationSeconds: input.durationSeconds } : {}),
      ...(typeof input.width === 'number' ? { width: input.width } : {}),
      ...(typeof input.height === 'number' ? { height: input.height } : {}),
      ...(input.videoCodec ? { videoCodec: input.videoCodec } : {}),
      ...(input.audioCodec ? { audioCodec: input.audioCodec } : {}),
    },
  })
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  const stream = createReadStream(filePath)
  for await (const chunk of stream) hash.update(chunk)
  return hash.digest('hex')
}
