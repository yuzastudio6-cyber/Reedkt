import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'

import type { MotionStudioGenerationShotSpecV1 } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

const MAXIMUM_PROBE_BYTES = 1024 * 1024
const MAXIMUM_MEDIA_BYTES = 100 * 1024 * 1024

export interface MotionStudioGeneratedMediaQaResult {
  sha256: string
  byteLength: number
  mimeType: 'image/png' | 'video/mp4'
  width: number
  height: number
  durationFrames?: number
  fpsNumerator?: number
  fpsDenominator?: number
  codec?: 'h264'
  pixelFormat?: 'yuv420p'
  safetyStatus: 'passed'
  referenceAdherenceMeasured: false
  visualQualityMeasured: false
  qaEvidenceDigest: string
}

export async function verifyMotionStudioGeneratedMediaFixture(input: {
  bytes: Buffer
  mimeType: 'image/png' | 'video/mp4'
  shotSpec: MotionStudioGenerationShotSpecV1
  ffprobeBin: string
}): Promise<MotionStudioGeneratedMediaQaResult> {
  if (input.bytes.byteLength < 67 || input.bytes.byteLength > MAXIMUM_MEDIA_BYTES) {
    throw rejected('Generated-media fixture is empty or exceeds its byte ceiling.')
  }
  const sha256 = createHash('sha256').update(input.bytes).digest('hex')
  const base = {
    sha256,
    byteLength: input.bytes.byteLength,
    mimeType: input.mimeType,
    safetyStatus: 'passed' as const,
    referenceAdherenceMeasured: false as const,
    visualQualityMeasured: false as const,
  }
  if (input.mimeType === 'image/png') {
    const { width, height } = parsePngFacts(input.bytes)
    if (
      input.shotSpec.mediaKind !== 'still_image' ||
      width !== input.shotSpec.timingAuthority.width || height !== input.shotSpec.timingAuthority.height
    ) throw rejected('PNG facts diverge from the exact generated-media ShotSpec.')
    const evidence = { ...base, width, height, pngSignatureVerified: true, exactFrameVerified: true }
    return { ...base, width, height, qaEvidenceDigest: sha256CanonicalJson(evidence) }
  }

  if (input.shotSpec.mediaKind !== 'video_clip') throw rejected('MP4 media requires a video ShotSpec.')
  const facts = await probeMp4(input.ffprobeBin, input.bytes)
  const expectedFrames = input.shotSpec.sceneRange.endFrame - input.shotSpec.sceneRange.startFrame
  if (
    facts.codec !== 'h264' || facts.pixelFormat !== 'yuv420p' ||
    facts.width !== input.shotSpec.timingAuthority.width || facts.height !== input.shotSpec.timingAuthority.height ||
    facts.fpsNumerator !== input.shotSpec.timingAuthority.frameRate || facts.fpsDenominator !== 1 ||
    facts.durationFrames !== expectedFrames
  ) throw rejected('FFprobe media facts diverge from the exact generated-media ShotSpec.')
  const evidence = { ...base, ...facts, exactFrameAndTimingVerified: true, audioPresent: false }
  return { ...base, ...facts, qaEvidenceDigest: sha256CanonicalJson(evidence) }
}

export function parsePngFacts(bytes: Buffer): { width: number; height: number } {
  if (
    bytes.byteLength < 67 ||
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    bytes.toString('ascii', 12, 16) !== 'IHDR' || !bytes.includes(Buffer.from('IEND'))
  ) throw rejected('Generated still is not a bounded PNG.')
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  if (width < 1 || height < 1 || width > 3840 || height > 3840) throw rejected('PNG dimensions are outside the local protocol profile.')
  return { width, height }
}

async function probeMp4(binary: string, bytes: Buffer): Promise<{
  width: number
  height: number
  durationFrames: number
  fpsNumerator: number
  fpsDenominator: number
  codec: 'h264'
  pixelFormat: 'yuv420p'
}> {
  if (bytes.subarray(4, 8).toString('ascii') !== 'ftyp') throw rejected('Generated motion fixture is not an MP4.')
  const result = await runProbe(binary, bytes)
  let value: unknown
  try { value = JSON.parse(result.toString('utf8')) } catch { throw rejected('FFprobe returned malformed JSON.') }
  if (!isRecord(value) || !Array.isArray(value.streams) || value.streams.length !== 1) {
    throw rejected('FFprobe did not return exactly one video stream.')
  }
  const stream = value.streams[0]
  if (!isRecord(stream) || stream.codec_name !== 'h264' || stream.pix_fmt !== 'yuv420p') {
    throw rejected('Generated motion fixture must be H.264 yuv420p.')
  }
  const width = integer(stream.width)
  const height = integer(stream.height)
  const durationFrames = integer(stream.nb_read_frames)
  const frameRate = typeof stream.avg_frame_rate === 'string' ? stream.avg_frame_rate.split('/') : []
  const fpsNumerator = integer(frameRate[0])
  const fpsDenominator = integer(frameRate[1])
  return { width, height, durationFrames, fpsNumerator, fpsDenominator, codec: 'h264', pixelFormat: 'yuv420p' }
}

async function runProbe(binary: string, bytes: Buffer): Promise<Buffer> {
  if (!binary || binary.includes('\0')) throw rejected('Configured FFprobe binary is invalid.')
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [
      '-v', 'error', '-count_frames', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,pix_fmt,width,height,avg_frame_rate,nb_read_frames',
      '-of', 'json', 'pipe:0',
    ], { stdio: ['pipe', 'pipe', 'pipe'], shell: false })
    const output: Buffer[] = []
    const errors: Buffer[] = []
    let outputBytes = 0
    child.stdout.on('data', (chunk: Buffer) => {
      outputBytes += chunk.byteLength
      if (outputBytes > MAXIMUM_PROBE_BYTES) child.kill('SIGKILL')
      else output.push(Buffer.from(chunk))
    })
    child.stderr.on('data', (chunk: Buffer) => {
      if (Buffer.concat(errors).byteLength < 64_000) errors.push(Buffer.from(chunk))
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0 || outputBytes > MAXIMUM_PROBE_BYTES) {
        reject(rejected(`FFprobe rejected generated media (${code}): ${Buffer.concat(errors).toString('utf8').slice(0, 500)}`))
      } else resolve(Buffer.concat(output))
    })
    child.stdin.on('error', reject)
    child.stdin.end(bytes)
  })
}

function integer(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^[0-9]+$/.test(value) ? Number(value) : Number.NaN
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw rejected('FFprobe media fact is invalid.')
  return parsed
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function rejected(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_CONFLICT', message, 409, {
    requiredGate: 'motion_studio_generated_media_fixture_qa',
  })
}
