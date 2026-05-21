import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { parseCommandLine } from '../workers/tools/tool-check-utils'
import { assertPathInsideRoot } from './local-media-paths'

const execFileAsync = promisify(execFile)

export interface SyntheticMediaFixtureResult {
  available: boolean
  outputPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  width?: number
  height?: number
  warnings: string[]
  errorCode?: string
}

export async function createSyntheticMp4Fixture(input: {
  outputPath: string
  localStorageRoot: string
  ffmpegBin?: string
  timeoutMs?: number
  durationSeconds?: number
  width?: number
  height?: number
}): Promise<SyntheticMediaFixtureResult> {
  const absoluteOutputPath = assertPathInsideRoot(input.localStorageRoot, input.outputPath)
  const parsedCommand = parseCommandLine(input.ffmpegBin ?? 'ffmpeg')
  const durationSeconds = input.durationSeconds ?? 2
  const width = input.width ?? 320
  const height = input.height ?? 180
  await mkdir(path.dirname(absoluteOutputPath), { recursive: true })

  try {
    await execFileAsync(parsedCommand.command, [
      ...parsedCommand.args,
      '-y',
      '-f',
      'lavfi',
      '-i',
      `testsrc=size=${width}x${height}:rate=30`,
      '-t',
      String(durationSeconds),
      '-c:v',
      'mpeg4',
      '-q:v',
      '5',
      '-pix_fmt',
      'yuv420p',
      '-an',
      absoluteOutputPath,
    ], {
      timeout: input.timeoutMs ?? 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
  } catch (error) {
    return {
      available: false,
      warnings: [error instanceof Error ? error.message : 'FFmpeg fixture generation failed.'],
      errorCode: 'ffmpeg_unavailable',
    }
  }

  const [fileStat, bytes] = await Promise.all([stat(absoluteOutputPath), readFile(absoluteOutputPath)])
  return {
    available: true,
    outputPath: absoluteOutputPath,
    durationSeconds,
    sizeBytes: fileStat.size,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
    width,
    height,
    warnings: [],
  }
}
