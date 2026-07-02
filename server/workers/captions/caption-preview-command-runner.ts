import { runLibassCaptionPreview, prepareLibassCaptionPreviewCommand } from './libass-caption-preview-adapter'
import type { CaptionFoundationSkipReason } from './caption-worker-types'

export interface CaptionPreviewExecutionInput {
  enabled: boolean
  ffmpegBin?: string
  sourceVideoLocalPath?: string
  assCaptionLocalPath?: string
  outputPreviewPath?: string
  safeOutputRoot?: string
  timeoutMs?: number
}

export function prepareCaptionPreviewExecutionCommand(input: CaptionPreviewExecutionInput) {
  if (!input.enabled) {
    return {
      command: input.ffmpegBin ?? 'ffmpeg',
      args: [],
      skipReason: {
        code: 'caption_preview_disabled',
        message: 'Caption preview is disabled by default in M13.',
        tool: 'ffmpeg' as const,
      },
    }
  }

  return prepareLibassCaptionPreviewCommand({
    ffmpegBin: input.ffmpegBin ?? 'ffmpeg',
    sourceVideoLocalPath: input.sourceVideoLocalPath,
    assCaptionLocalPath: input.assCaptionLocalPath,
    outputPreviewPath: input.outputPreviewPath,
    safeOutputRoot: input.safeOutputRoot,
    timeoutMs: input.timeoutMs ?? 20_000,
  })
}

export async function runCaptionPreviewExecution(input: CaptionPreviewExecutionInput): Promise<{
  status: 'created' | 'skipped'
  outputPreviewPath?: string
  skipReason?: CaptionFoundationSkipReason
}> {
  if (!input.enabled) {
    return {
      status: 'skipped',
      skipReason: {
        code: 'caption_preview_disabled',
        message: 'Caption preview is disabled by default in M13.',
        tool: 'ffmpeg',
      },
    }
  }

  return runLibassCaptionPreview({
    ffmpegBin: input.ffmpegBin ?? 'ffmpeg',
    sourceVideoLocalPath: input.sourceVideoLocalPath,
    assCaptionLocalPath: input.assCaptionLocalPath,
    outputPreviewPath: input.outputPreviewPath,
    safeOutputRoot: input.safeOutputRoot,
    timeoutMs: input.timeoutMs ?? 20_000,
  })
}
