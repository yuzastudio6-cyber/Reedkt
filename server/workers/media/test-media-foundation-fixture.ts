import { execFile } from 'node:child_process'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES } from '../../../src/types/large-media'
import type { MediaFoundationSkipReason } from './media-worker-types'

const execFileAsync = promisify(execFile)

export interface MediaFoundationFixture {
  tempDir: string
  sourceVideoPath: string
  cleanup: () => Promise<void>
}

export type MediaFoundationFixtureResult =
  | { ok: true; fixture: MediaFoundationFixture }
  | { ok: false; skipReason: MediaFoundationSkipReason }

export async function createMediaFoundationFixture(input: {
  ffmpegBin?: string
  ffprobeBin?: string
  timeoutMs?: number
} = {}): Promise<MediaFoundationFixtureResult> {
  const ffmpegBin = input.ffmpegBin ?? 'ffmpeg'
  const ffprobeBin = input.ffprobeBin ?? 'ffprobe'
  const timeoutMs = input.timeoutMs ?? 15_000

  const ffmpegAvailable = await commandAvailable(ffmpegBin, ['-version'], timeoutMs)
  if (!ffmpegAvailable.ok) return { ok: false, skipReason: ffmpegAvailable.skipReason }

  const ffprobeAvailable = await commandAvailable(ffprobeBin, ['-version'], timeoutMs)
  if (!ffprobeAvailable.ok) return { ok: false, skipReason: ffprobeAvailable.skipReason }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-media-foundation-'))
  const sourceVideoPath = path.join(tempDir, 'fixture-source.mp4')

  try {
    await execFileAsync(ffmpegBin, [
      '-hide_banner',
      '-nostdin',
      '-f',
      'lavfi',
      '-i',
      'testsrc=size=160x90:rate=10:duration=1',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=1000:duration=1',
      '-shortest',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      sourceVideoPath,
    ], {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    })
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true })
    return {
      ok: false,
      skipReason: {
        code: 'fixture_generation_failed',
        message: error instanceof Error
          ? `FFmpeg is present but could not generate the tiny fixture: ${error.message}`
          : 'FFmpeg is present but could not generate the tiny fixture.',
        tool: 'ffmpeg',
      },
    }
  }

  return {
    ok: true,
    fixture: {
      tempDir,
      sourceVideoPath,
      cleanup: () => rm(tempDir, { recursive: true, force: true }),
    },
  }
}

/**
 * Creates a short but byte-representative 4K acquisition master. FFV1 plus a
 * deterministic high-detail source keeps the fixture lossless and guarantees
 * it crosses the resumable-upload boundary without pretending to be a long or
 * multi-gigabyte production recording.
 */
export async function createProfessional4kResumableMediaFixture(input: {
  ffmpegBin?: string
  ffprobeBin?: string
  timeoutMs?: number
  minimumSizeBytes?: number
} = {}): Promise<MediaFoundationFixtureResult> {
  const ffmpegBin = input.ffmpegBin ?? 'ffmpeg'
  const ffprobeBin = input.ffprobeBin ?? 'ffprobe'
  const timeoutMs = input.timeoutMs ?? 30_000
  const minimumSizeBytes = input.minimumSizeBytes ?? REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES

  const ffmpegAvailable = await commandAvailable(ffmpegBin, ['-version'], timeoutMs)
  if (!ffmpegAvailable.ok) return { ok: false, skipReason: ffmpegAvailable.skipReason }
  const ffprobeAvailable = await commandAvailable(ffprobeBin, ['-version'], timeoutMs)
  if (!ffprobeAvailable.ok) return { ok: false, skipReason: ffprobeAvailable.skipReason }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-large-4k-media-'))
  const sourceVideoPath = path.join(tempDir, 'professional-4k-source.mkv')
  try {
    await execFileAsync(ffmpegBin, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostats',
      '-nostdin',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=3840x2160:rate=3:duration=1,noise=alls=60:allf=t+u',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=1000:sample_rate=48000:duration=1',
      '-shortest',
      '-c:v',
      'ffv1',
      '-level',
      '3',
      '-pix_fmt',
      'yuv420p',
      '-colorspace',
      'bt709',
      '-color_primaries',
      'bt709',
      '-color_trc',
      'bt709',
      '-color_range',
      'tv',
      '-c:a',
      'pcm_s24le',
      '-ar',
      '48000',
      '-ac',
      '2',
      sourceVideoPath,
    ], {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    })
    const sourceStat = await stat(sourceVideoPath)
    if (sourceStat.size <= minimumSizeBytes) {
      throw new Error(
        `4K fixture size ${sourceStat.size} did not cross required boundary ${minimumSizeBytes}.`,
      )
    }
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true })
    return {
      ok: false,
      skipReason: {
        code: 'fixture_generation_failed',
        message: error instanceof Error
          ? `FFmpeg could not generate the resumable-size 4K fixture: ${error.message}`
          : 'FFmpeg could not generate the resumable-size 4K fixture.',
        tool: 'ffmpeg',
      },
    }
  }

  return {
    ok: true,
    fixture: {
      tempDir,
      sourceVideoPath,
      cleanup: () => rm(tempDir, { recursive: true, force: true }),
    },
  }
}

async function commandAvailable(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<{ ok: true } | { ok: false; skipReason: MediaFoundationSkipReason }> {
  try {
    await execFileAsync(command, args, {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 512 * 1024,
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      skipReason: {
        code: 'media_tool_unavailable',
        message: error instanceof Error
          ? `${command} is unavailable for local fixture processing: ${error.message}`
          : `${command} is unavailable for local fixture processing.`,
        tool: command.toLowerCase().includes('probe') ? 'ffprobe' : 'ffmpeg',
      },
    }
  }
}
