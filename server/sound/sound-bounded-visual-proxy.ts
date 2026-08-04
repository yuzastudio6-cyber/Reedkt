import { createHash, randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { chmod, lstat, readFile, realpath, rm } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import {
  ensurePrivateDirectoryWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  framesToSeconds,
  normalizeTimelineRate,
  timelineRatesEqual,
  type TimelineRate,
} from '../edit-skills/core/timeline-rate'
import type { SoundArtifactRef, SoundFrameRange } from './sound-contracts'

const execFileAsync = promisify(execFile)
const MAX_PROXY_BYTES = 256 * 1024 * 1024
const APPROVED_PROXY_PROFILE = Object.freeze({
  profileKey: 'sound.proxy.visual_bounded.v2',
  profileVersion: '2.0.0',
  codec: 'h264',
  container: 'mp4',
  pixelFormat: 'yuv420p',
  maximumWidth: 1280,
  maximumHeight: 720,
  audioIncludedByDefault: false,
})

export interface BoundedSoundVisualProxyRequest {
  schemaVersion: 'sound-bounded-visual-proxy-request-v1'
  executionId: string
  approvedSnapshotId: string
  approvedSnapshotHash: string
  approvedWorkItemId: string
  privateOutputScopeId: string
  idempotencyKey: string
  source: {
    artifact: SoundArtifactRef
    absolutePath: string
    visualVersion: number
    visualHash: string
    expectedChecksumSha256: string
  }
  approvedInputRoot: string
  privateOutputRoot: string
  outputRelativePath: string
  outputArtifactId: string
  eventRange: SoundFrameRange
  authorizedSourceRange: SoundFrameRange
  preRollFrames: number
  postRollFrames: number
  timelineRate: TimelineRate
  timelineManifestRate: TimelineRate
  outputConstraints: {
    maximumWidth: number
    maximumHeight: number
    maximumBytes: number
    contentType: 'video/mp4'
    removeSourceAudio: true
  }
  providerProfile: {
    providerKey: 'mirelo_sfx'
    providerProfileKey: 'sound.mirelo.video_sfx_1_6.v1'
    providerProfileVersion: '1.0.0'
  }
}

export interface BoundedSoundVisualProxyResult {
  schemaVersion: 'sound-bounded-visual-proxy-result-v1'
  executionId: string
  status: 'completed'
  idempotentReplay: boolean
  artifact: SoundArtifactRef
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  proxyDurationFrames: number
  timelineRate: TimelineRate
  sourceVisualHash: string
  sourceArtifactVersion: number
  checksumSha256: string
  privateStorageReference: string
  contentType: 'video/mp4'
  byteSize: number
  toolRuntimeEvidence: {
    operationKey: 'prepare_bounded_private_visual_proxy'
    operationProfileKey: 'sound.proxy.visual_bounded.v2'
    ffmpegVersion: string
    ffprobeVersion: string
    elapsedMilliseconds: number
    arbitraryArgumentsAccepted: false
    arbitraryPathsAccepted: false
  }
  noSourceOverwriteEvidence: {
    sourceChecksumBefore: string
    sourceChecksumAfter: string
    sourceUnchanged: true
    providerVisualMayReplaceApprovedVisual: false
  }
  proxyQaEvidence: {
    checksumVerified: true
    mediaTypeVerified: true
    timelineRateVerified: true
    durationVerified: true
    audioRemoved: true
    privatePermissionsVerified: true
  }
  providerBinding: BoundedSoundVisualProxyRequest['providerProfile']
}

interface VideoProbe {
  format: { duration?: string }
  streams: Array<{
    codec_type?: string
    avg_frame_rate?: string
    r_frame_rate?: string
  }>
}

export async function prepareBoundedPrivateVisualProxy(
  input: BoundedSoundVisualProxyRequest,
): Promise<BoundedSoundVisualProxyResult> {
  const startedAt = performance.now()
  validateRequest(input)
  await validateSourcePath(input)
  const sourceChecksumBefore = await checksumFile(input.source.absolutePath)
  if (sourceChecksumBefore !== input.source.expectedChecksumSha256 ||
    sourceChecksumBefore !== input.source.artifact.checksumSha256) {
    throw new Error('Bounded visual proxy source checksum mismatch.')
  }
  const sourceProbe = await probeVideo(input.source.absolutePath)
  if (!timelineRatesEqual(sourceProbe.timelineRate, input.timelineRate)) {
    throw new Error('Bounded visual proxy source timeline-rate mismatch.')
  }

  const sourceStartFrame = input.eventRange.startFrame - input.preRollFrames
  const sourceEndFrameExclusive = input.eventRange.endFrameExclusive + input.postRollFrames
  const proxyDurationFrames = sourceEndFrameExclusive - sourceStartFrame
  const outputDirectory = await ensurePrivateDirectoryWithinRoot({
    rootPath: input.privateOutputRoot,
    relativePath: `.sound-proxy-temp/${input.executionId}-${randomUUID()}`,
  })
  const temporaryPath = resolve(outputDirectory, 'proxy.mp4')
  try {
    const rateText = `${input.timelineRate.numerator}/${input.timelineRate.denominator}`
    const filter = [
      `trim=start_frame=${sourceStartFrame}:end_frame=${sourceEndFrameExclusive}`,
      `setpts=N/(${rateText}*TB)`,
      `scale=w='min(${input.outputConstraints.maximumWidth},iw)':h='min(${input.outputConstraints.maximumHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
    ].join(',')
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-n',
      '-i', input.source.absolutePath,
      '-map', '0:v:0', '-an', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1',
      '-vf', filter,
      '-fps_mode', 'cfr', '-r', rateText,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-pix_fmt', APPROVED_PROXY_PROFILE.pixelFormat,
      '-movflags', '+faststart', temporaryPath,
    ], { timeout: 600_000, maxBuffer: 8 * 1024 * 1024 })

    const temporaryBytes = await readFile(temporaryPath)
    if (temporaryBytes.length <= 0 || temporaryBytes.length > input.outputConstraints.maximumBytes ||
      temporaryBytes.length > MAX_PROXY_BYTES) {
      throw new Error('Bounded visual proxy output is empty or exceeds its approved byte limit.')
    }
    const committed = await writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.privateOutputRoot,
      relativePath: input.outputRelativePath,
      content: temporaryBytes,
    })
    const committedBytes = await readFile(committed.absolutePath)
    const candidateChecksum = createHash('sha256').update(temporaryBytes).digest('hex')
    const committedChecksum = createHash('sha256').update(committedBytes).digest('hex')
    if (!committed.created && candidateChecksum !== committedChecksum) {
      throw new Error('Bounded visual proxy idempotency collision: existing output differs from the admitted replay.')
    }
    await chmod(committed.absolutePath, 0o600)
    const [outputProbe, outputStat, sourceChecksumAfter, ffmpegVersion, ffprobeVersion] = await Promise.all([
      probeVideo(committed.absolutePath),
      lstat(committed.absolutePath),
      checksumFile(input.source.absolutePath),
      binaryVersion('ffmpeg'),
      binaryVersion('ffprobe'),
    ])
    if (outputProbe.hasAudio) throw new Error('Bounded visual proxy unexpectedly contains source audio.')
    if (!timelineRatesEqual(outputProbe.timelineRate, input.timelineRate)) {
      throw new Error('Bounded visual proxy output timeline-rate mismatch.')
    }
    const expectedSeconds = framesToSeconds(proxyDurationFrames, input.timelineRate)
    const frameToleranceSeconds = framesToSeconds(1, input.timelineRate)
    if (Math.abs(outputProbe.durationSeconds - expectedSeconds) > frameToleranceSeconds) {
      throw new Error('Bounded visual proxy output duration is outside one-frame tolerance.')
    }
    if (sourceChecksumAfter !== sourceChecksumBefore) throw new Error('Bounded visual proxy modified the source artifact.')
    if (!outputStat.isFile() || outputStat.isSymbolicLink() || (outputStat.mode & 0o077) !== 0) {
      throw new Error('Bounded visual proxy private file permissions are unsafe.')
    }
    const checksumSha256 = committedChecksum
    const artifact: SoundArtifactRef = {
      artifactId: input.outputArtifactId,
      artifactType: 'bounded_private_visual_proxy',
      version: 1,
      checksumSha256,
      storageObjectId: input.outputRelativePath.replaceAll('/', ':'),
      private: true,
      contentType: 'video/mp4',
      durationFrames: proxyDurationFrames,
      timelineRate: input.timelineRate,
    }
    return {
      schemaVersion: 'sound-bounded-visual-proxy-result-v1',
      executionId: input.executionId,
      status: 'completed',
      idempotentReplay: !committed.created,
      artifact,
      sourceStartFrame,
      sourceEndFrameExclusive,
      proxyDurationFrames,
      timelineRate: input.timelineRate,
      sourceVisualHash: input.source.visualHash,
      sourceArtifactVersion: input.source.artifact.version,
      checksumSha256,
      privateStorageReference: artifact.storageObjectId,
      contentType: 'video/mp4',
      byteSize: committedBytes.length,
      toolRuntimeEvidence: {
        operationKey: 'prepare_bounded_private_visual_proxy',
        operationProfileKey: APPROVED_PROXY_PROFILE.profileKey,
        ffmpegVersion,
        ffprobeVersion,
        elapsedMilliseconds: Math.round(performance.now() - startedAt),
        arbitraryArgumentsAccepted: false,
        arbitraryPathsAccepted: false,
      },
      noSourceOverwriteEvidence: {
        sourceChecksumBefore,
        sourceChecksumAfter,
        sourceUnchanged: true,
        providerVisualMayReplaceApprovedVisual: false,
      },
      proxyQaEvidence: {
        checksumVerified: true,
        mediaTypeVerified: true,
        timelineRateVerified: true,
        durationVerified: true,
        audioRemoved: true,
        privatePermissionsVerified: true,
      },
      providerBinding: input.providerProfile,
    }
  } finally {
    await rm(outputDirectory, { recursive: true, force: true }).catch(() => undefined)
  }
}

function validateRequest(input: BoundedSoundVisualProxyRequest): void {
  if (input.schemaVersion !== 'sound-bounded-visual-proxy-request-v1') throw new Error('Unknown bounded visual proxy schema.')
  for (const value of [input.executionId, input.approvedSnapshotId, input.approvedSnapshotHash,
    input.approvedWorkItemId, input.privateOutputScopeId, input.idempotencyKey, input.outputArtifactId]) {
    if (!value || typeof value !== 'string') throw new Error('Bounded visual proxy requires exact execution authority.')
  }
  if (!timelineRatesEqual(input.timelineRate, input.timelineManifestRate)) {
    throw new Error('Bounded visual proxy timeline manifest rate mismatch.')
  }
  if (input.source.artifact.timelineRate && !timelineRatesEqual(input.source.artifact.timelineRate, input.timelineRate)) {
    throw new Error('Bounded visual proxy source artifact rate mismatch.')
  }
  if (input.source.artifact.version !== input.source.visualVersion) {
    throw new Error('Bounded visual proxy source artifact version mismatch.')
  }
  if (!/^[a-f0-9]{64}$/u.test(input.source.visualHash) || !/^[a-f0-9]{64}$/u.test(input.source.expectedChecksumSha256)) {
    throw new Error('Bounded visual proxy requires exact source hashes.')
  }
  if (input.source.visualHash !== input.source.artifact.checksumSha256) {
    throw new Error('Bounded visual proxy source visual hash mismatch.')
  }
  if (!Number.isSafeInteger(input.preRollFrames) || input.preRollFrames < 0 ||
    !Number.isSafeInteger(input.postRollFrames) || input.postRollFrames < 0) {
    throw new Error('Bounded visual proxy handles must be non-negative frame counts.')
  }
  const start = input.eventRange.startFrame - input.preRollFrames
  const end = input.eventRange.endFrameExclusive + input.postRollFrames
  if (start < input.authorizedSourceRange.startFrame || end > input.authorizedSourceRange.endFrameExclusive) {
    throw new Error('Bounded visual proxy range and handles exceed approved source authority.')
  }
  if (end <= start) throw new Error('Bounded visual proxy range must have positive duration.')
  if (input.outputConstraints.removeSourceAudio !== true || input.outputConstraints.contentType !== 'video/mp4') {
    throw new Error('Bounded visual proxy must use the approved silent MP4 profile.')
  }
  if (input.outputConstraints.maximumWidth < 16 || input.outputConstraints.maximumWidth > APPROVED_PROXY_PROFILE.maximumWidth ||
    input.outputConstraints.maximumHeight < 16 || input.outputConstraints.maximumHeight > APPROVED_PROXY_PROFILE.maximumHeight ||
    input.outputConstraints.maximumBytes <= 0 || input.outputConstraints.maximumBytes > MAX_PROXY_BYTES) {
    throw new Error('Bounded visual proxy output constraints exceed the approved profile.')
  }
  if (input.providerProfile.providerKey !== 'mirelo_sfx' ||
    input.providerProfile.providerProfileKey !== 'sound.mirelo.video_sfx_1_6.v1' ||
    input.providerProfile.providerProfileVersion !== '1.0.0') {
    throw new Error('Bounded visual proxy provider profile is not approved.')
  }
  if (isAbsolute(input.outputRelativePath) || input.outputRelativePath.split(/[\\/]/u).includes('..')) {
    throw new Error('Bounded visual proxy output path is unsafe.')
  }
}

async function validateSourcePath(input: BoundedSoundVisualProxyRequest): Promise<void> {
  assertPathWithinRoot(input.approvedInputRoot, input.source.absolutePath, 'Bounded visual proxy source')
  const [rootRealPath, sourceRealPath, sourceStat] = await Promise.all([
    realpath(input.approvedInputRoot), realpath(input.source.absolutePath), lstat(input.source.absolutePath),
  ])
  if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) throw new Error('Bounded visual proxy source must be a regular non-symlink file.')
  assertPathWithinRoot(rootRealPath, sourceRealPath, 'Resolved bounded visual proxy source')
  const outputPath = resolve(input.privateOutputRoot, input.outputRelativePath)
  assertPathWithinRoot(input.privateOutputRoot, outputPath, 'Bounded visual proxy output')
  if (resolve(input.source.absolutePath) === outputPath) throw new Error('Bounded visual proxy cannot overwrite its source.')
}

async function probeVideo(path: string): Promise<{
  durationSeconds: number
  timelineRate: TimelineRate
  hasAudio: boolean
}> {
  const result = await execFileAsync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,avg_frame_rate,r_frame_rate',
    '-of', 'json', path,
  ], { timeout: 30_000, maxBuffer: 4 * 1024 * 1024 })
  const parsed = JSON.parse(String(result.stdout)) as VideoProbe
  const video = parsed.streams.find((stream) => stream.codec_type === 'video')
  if (!video) throw new Error('Bounded visual proxy input has no decodable video stream.')
  const rate = parseRate(video.avg_frame_rate || video.r_frame_rate || '')
  const durationSeconds = Number(parsed.format.duration)
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('Bounded visual proxy media duration is invalid.')
  return {
    durationSeconds,
    timelineRate: rate,
    hasAudio: parsed.streams.some((stream) => stream.codec_type === 'audio'),
  }
}

function parseRate(value: string): TimelineRate {
  const [numeratorText, denominatorText] = value.split('/')
  const numerator = Number(numeratorText)
  const denominator = Number(denominatorText)
  if (!Number.isSafeInteger(numerator) || numerator <= 0 || !Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new Error('Bounded visual proxy media frame rate is invalid.')
  }
  return normalizeTimelineRate({ numerator, denominator })
}

function assertPathWithinRoot(rootPath: string, targetPath: string, label: string): void {
  const root = resolve(rootPath)
  const target = resolve(targetPath)
  const relativePath = relative(root, target)
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`${label} escapes its approved root.`)
  }
}

async function checksumFile(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function binaryVersion(binary: string): Promise<string> {
  const result = await execFileAsync(binary, ['-version'], { timeout: 10_000, maxBuffer: 1024 * 1024 })
  return String(result.stdout).split(/\r?\n/u)[0]?.trim() ?? 'unknown'
}

export function getBoundedSoundVisualProxyProfile() {
  return structuredClone(APPROVED_PROXY_PROFILE)
}
