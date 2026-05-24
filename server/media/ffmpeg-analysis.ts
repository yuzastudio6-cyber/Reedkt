import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { ApiError } from '../errors/api-error'
import { parseCommandLine } from '../workers/tools/tool-check-utils'
import { assertPathInsideRoot } from './local-media-paths'

const execFileAsync = promisify(execFile)

export interface ThumbnailExtractionOutput {
  outputPath: string
  mimeType: 'image/jpeg'
  sizeBytes: number
  checksumSha256: string
  width: number
  height: number
}

export async function extractThumbnailFrame(input: {
  inputPath: string
  outputPath: string
  localStorageRoot: string
  ffmpegBin?: string
  timeoutMs?: number
  width?: number
  height?: number
}): Promise<ThumbnailExtractionOutput> {
  const absoluteOutputPath = assertPathInsideRoot(input.localStorageRoot, input.outputPath)
  const parsedCommand = parseCommandLine(input.ffmpegBin ?? 'ffmpeg')
  const width = input.width ?? 160
  const height = input.height ?? 90

  await mkdir(path.dirname(absoluteOutputPath), { recursive: true })

  try {
    await execFileAsync(parsedCommand.command, [
      ...parsedCommand.args,
      '-y',
      '-ss',
      '0',
      '-i',
      input.inputPath,
      '-frames:v',
      '1',
      '-vf',
      `scale=${width}:${height}`,
      '-q:v',
      '3',
      absoluteOutputPath,
    ], {
      timeout: input.timeoutMs ?? 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
  } catch (error) {
    throw new ApiError('FFMPEG_RENDER_FAILED', error instanceof Error ? error.message : 'FFmpeg thumbnail extraction failed.', 409)
  }

  const [fileStat, bytes] = await Promise.all([stat(absoluteOutputPath), readFile(absoluteOutputPath)])
  return {
    outputPath: absoluteOutputPath,
    mimeType: 'image/jpeg',
    sizeBytes: fileStat.size,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
    width,
    height,
  }
}

export async function checkAudioStreamWithFfmpeg(input: {
  inputPath: string
  ffmpegBin?: string
  timeoutMs?: number
}): Promise<{ checkedWithFfmpeg: true; hasAudio: boolean; summary: string }> {
  const parsedCommand = parseCommandLine(input.ffmpegBin ?? 'ffmpeg')
  try {
    await execFileAsync(parsedCommand.command, [
      ...parsedCommand.args,
      '-v',
      'error',
      '-i',
      input.inputPath,
      '-map',
      '0:a:0',
      '-t',
      '0.1',
      '-f',
      'null',
      '-',
    ], {
      timeout: input.timeoutMs ?? 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
    return { checkedWithFfmpeg: true, hasAudio: true, summary: 'FFmpeg found an audio stream.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('matches no streams') || message.includes('Stream map')) {
      return { checkedWithFfmpeg: true, hasAudio: false, summary: 'FFmpeg found no audio stream.' }
    }
    throw new ApiError('FFMPEG_RENDER_FAILED', error instanceof Error ? error.message : 'FFmpeg audio stream check failed.', 409)
  }
}
