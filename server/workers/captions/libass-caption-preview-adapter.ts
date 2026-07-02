import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot } from '../media/media-path-safety'
import type { CaptionFoundationSkipReason } from './caption-worker-types'

const execFileAsync = promisify(execFile)

export interface CaptionPreviewInput {
  ffmpegBin: string
  sourceVideoLocalPath?: string
  assCaptionLocalPath?: string
  outputPreviewPath?: string
  safeOutputRoot?: string
  timeoutMs: number
}

export function prepareLibassCaptionPreviewCommand(input: CaptionPreviewInput): {
  command: string
  args: string[]
  skipReason?: CaptionFoundationSkipReason
} {
  const skipReason = buildCaptionPreviewSkipReason(input)
  if (skipReason) return { command: input.ffmpegBin, args: [], skipReason }

  const outputPath = assertOutputPathInsideRoot(input.outputPreviewPath as string, input.safeOutputRoot as string)
  return {
    command: input.ffmpegBin,
    args: [
      '-hide_banner',
      '-nostdin',
      '-n',
      '-i',
      input.sourceVideoLocalPath as string,
      '-vf',
      `ass=${input.assCaptionLocalPath as string}`,
      '-t',
      '5',
      '-an',
      outputPath,
    ],
  }
}

export async function runLibassCaptionPreview(input: CaptionPreviewInput): Promise<{
  status: 'created' | 'skipped'
  outputPreviewPath?: string
  skipReason?: CaptionFoundationSkipReason
}> {
  const plan = prepareLibassCaptionPreviewCommand(input)
  if (plan.skipReason) return { status: 'skipped', skipReason: plan.skipReason }

  await execFileAsync(plan.command, plan.args, {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  })

  return { status: 'created', outputPreviewPath: input.outputPreviewPath }
}

function buildCaptionPreviewSkipReason(input: CaptionPreviewInput): CaptionFoundationSkipReason | undefined {
  if (!input.sourceVideoLocalPath || !existsSync(input.sourceVideoLocalPath)) {
    return { code: 'caption_preview_source_missing', message: 'Caption preview skipped because source video is missing.', tool: 'ffmpeg' }
  }
  if (!input.assCaptionLocalPath || !existsSync(input.assCaptionLocalPath)) {
    return { code: 'caption_preview_ass_missing', message: 'Caption preview skipped because ASS caption file is missing.', tool: 'libass' }
  }
  if (!input.outputPreviewPath || !input.safeOutputRoot) {
    return { code: 'caption_preview_output_missing', message: 'Caption preview skipped because safe output path is missing.', tool: 'ffmpeg' }
  }

  for (const value of [input.sourceVideoLocalPath, input.assCaptionLocalPath, input.outputPreviewPath]) {
    assertNoSignedUrlOrRawUrl(value, 'captionPreviewPath')
    assertNoPathTraversal(value, 'captionPreviewPath')
  }

  return undefined
}
