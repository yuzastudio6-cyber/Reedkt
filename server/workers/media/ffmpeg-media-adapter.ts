import { execFile } from 'node:child_process'
import { chmod, mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { inspectLocalMediaFileAuthority } from './media-file-integrity'
import {
  assertExistingLocalFile,
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
  assertOutputPathInsideRoot,
  assertSourceNotOverwritten,
} from './media-path-safety'
import type {
  CreateProxyVideoInput,
  ExtractAudioTrackInput,
  ExtractKeyframesInput,
  ExtractRepresentativeFramesInput,
  FFmpegCommandInput,
  MediaFoundationArtifactSummary,
} from './media-worker-types'

const execFileAsync = promisify(execFile)

export async function runFFmpegCommand(input: FFmpegCommandInput): Promise<void> {
  for (const arg of input.args) {
    assertNoSignedUrlOrRawUrl(arg, 'ffmpegArg')
  }

  await execFileAsync(input.ffmpegBin, input.args, {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  })

  for (const outputPath of input.expectedOutputPaths) {
    await validateFFmpegOutputFile({ outputLocalPath: outputPath, purpose: input.purpose })
    await chmod(outputPath, 0o600)
  }
}

export async function createProxyVideo(input: CreateProxyVideoInput): Promise<MediaFoundationArtifactSummary> {
  const outputPath = prepareOutputFile(input.sourceLocalPath, input.outputLocalPath, input.safeOutputRoot)
  await preparePrivateOutputDirectory(path.dirname(outputPath))
  const args = buildProxyVideoArgs(input, outputPath)

  await runFFmpegCommand({
    ffmpegBin: input.ffmpegBin,
    args,
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [outputPath],
    purpose: 'create_proxy',
  })

  const outputStat = await stat(outputPath)
  const outputAuthority = await inspectLocalMediaFileAuthority(outputPath)
  return {
    artifactId: `proxy-${path.basename(outputPath, path.extname(outputPath))}`,
    artifactType: 'proxy_video',
    storageBucketPurpose: 'proxy_media',
    storageObjectPath: path.basename(outputPath),
    localFilePath: outputPath,
    contentType: 'video/mp4',
    sizeBytes: outputStat.size,
    checksum: outputAuthority.checksumSha256,
    sourceOfTruth: true,
    isPrivate: true,
  }
}

export function buildProxyVideoArgs(input: CreateProxyVideoInput, outputPath: string): string[] {
  const keepAudio = input.keepAudio ?? true
  const targetMaxWidth = input.targetMaxWidth ?? 1280
  const targetMaxHeight = input.targetMaxHeight ?? 720
  const videoPreset = input.videoPreset ?? 'fast'
  const videoCrf = Math.max(0, Math.min(51, input.videoCrf ?? 18))
  const videoMaxBitrate = input.videoMaxBitrate ?? '20M'
  const videoBufferSize = input.videoBufferSize ?? '40M'
  const audioBitrate = input.audioBitrate ?? '192k'
  const outputColorSpace = input.outputColorSpace ?? 'bt709'
  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostats',
    '-nostdin',
    '-n',
    '-i',
    input.sourceLocalPath,
    '-map',
    '0:v:0',
    ...(keepAudio ? ['-map', '0:a?'] : ['-an']),
    '-map_metadata',
    '-1',
    '-map_chapters',
    '-1',
    '-sn',
    '-dn',
    '-vf',
    `scale=w='min(${targetMaxWidth},iw)':h='min(${targetMaxHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
    '-c:v',
    'libx264',
    '-preset',
    videoPreset,
    '-crf',
    String(videoCrf),
    '-maxrate:v',
    videoMaxBitrate,
    '-bufsize:v',
    videoBufferSize,
    '-profile:v',
    'high',
    '-pix_fmt',
    'yuv420p',
    '-colorspace:v',
    outputColorSpace,
    '-color_primaries:v',
    outputColorSpace,
    '-color_trc:v',
    outputColorSpace,
    '-color_range:v',
    'tv',
    '-fps_mode:v',
    'passthrough',
    ...(keepAudio ? ['-c:a', 'aac', '-b:a', audioBitrate, '-ar', '48000'] : []),
    '-movflags',
    '+faststart',
    outputPath,
  ]
}

export async function extractAudioTrack(input: ExtractAudioTrackInput): Promise<MediaFoundationArtifactSummary> {
  const outputPath = prepareOutputFile(input.sourceLocalPath, input.outputLocalPath, input.safeOutputRoot)
  await preparePrivateOutputDirectory(path.dirname(outputPath))

  await runFFmpegCommand({
    ffmpegBin: input.ffmpegBin,
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [outputPath],
    purpose: 'extract_audio',
    args: [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostats',
      '-nostdin',
      '-n',
      '-i',
      input.sourceLocalPath,
      '-vn',
      '-ac',
      String(input.channels ?? 1),
      '-ar',
      String(input.sampleRate ?? 16000),
      '-c:a',
      'pcm_s16le',
      outputPath,
    ],
  })

  const outputStat = await stat(outputPath)
  const outputAuthority = await inspectLocalMediaFileAuthority(outputPath)
  return {
    artifactId: `audio-${path.basename(outputPath, path.extname(outputPath))}`,
    artifactType: 'extracted_audio',
    storageBucketPurpose: 'analysis_artifacts',
    storageObjectPath: path.basename(outputPath),
    localFilePath: outputPath,
    contentType: 'audio/wav',
    sizeBytes: outputStat.size,
    checksum: outputAuthority.checksumSha256,
    sourceOfTruth: true,
    isPrivate: true,
  }
}

export async function extractKeyframes(input: ExtractKeyframesInput): Promise<MediaFoundationArtifactSummary[]> {
  const outputDirectory = assertOutputDirectory(input.outputDirectory, input.safeOutputRoot)
  await preparePrivateOutputDirectory(outputDirectory)
  const maxFrameCount = Math.max(1, Math.min(input.maxFrameCount ?? 5, 25))
  const frameIntervalSeconds = Math.max(1, input.frameIntervalSeconds ?? 2)
  const pattern = path.join(outputDirectory, 'keyframe-%03d.jpg')

  await runFFmpegCommand({
    ffmpegBin: input.ffmpegBin,
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [],
    purpose: 'extract_keyframes',
    args: [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostats',
      '-nostdin',
      '-n',
      '-i',
      input.sourceLocalPath,
      '-vf',
      `fps=1/${frameIntervalSeconds}`,
      '-frames:v',
      String(maxFrameCount),
      '-q:v',
      '3',
      pattern,
    ],
  })

  return summarizeFrameOutputs(outputDirectory, 'keyframe_image')
}

export async function extractRepresentativeFrames(
  input: ExtractRepresentativeFramesInput,
): Promise<MediaFoundationArtifactSummary[]> {
  const outputDirectory = assertOutputDirectory(input.outputDirectory, input.safeOutputRoot)
  await preparePrivateOutputDirectory(outputDirectory)
  const maxFrameCount = Math.max(1, Math.min(input.maxFrameCount ?? 3, 5))
  const sampleTimes = buildRepresentativeSampleTimes(input.durationSeconds, maxFrameCount)
  const outputs: string[] = []

  for (const [index, timeSeconds] of sampleTimes.entries()) {
    const outputPath = path.join(outputDirectory, `representative-${String(index + 1).padStart(3, '0')}.jpg`)
    outputs.push(outputPath)
    await runFFmpegCommand({
      ffmpegBin: input.ffmpegBin,
      timeoutMs: input.timeoutMs,
      expectedOutputPaths: [outputPath],
      purpose: 'extract_representative_frames',
      args: [
        '-hide_banner',
        '-loglevel',
        'error',
        '-nostats',
        '-nostdin',
        '-n',
        '-ss',
        String(timeSeconds),
        '-i',
        input.sourceLocalPath,
        '-frames:v',
        '1',
        '-q:v',
        '3',
        outputPath,
      ],
    })
  }

  return Promise.all(outputs.map(async (outputPath, index) => {
    const outputStat = await stat(outputPath)
    const outputAuthority = await inspectLocalMediaFileAuthority(outputPath)
    return {
      artifactId: `representative-${index + 1}`,
      artifactType: 'representative_frame' as const,
      storageBucketPurpose: 'analysis_artifacts' as const,
      storageObjectPath: path.basename(outputPath),
      localFilePath: outputPath,
      contentType: 'image/jpeg',
      sizeBytes: outputStat.size,
      checksum: outputAuthority.checksumSha256,
      timeSeconds: sampleTimes[index],
      frameNumber: index + 1,
      sourceOfTruth: true as const,
      isPrivate: true as const,
    }
  }))
}

export async function validateFFmpegOutputFile(input: {
  outputLocalPath: string
  purpose: string
}): Promise<void> {
  const outputStat = await stat(input.outputLocalPath)
  if (outputStat.size <= 0) {
    throw new Error(`FFmpeg ${input.purpose} output is empty.`)
  }
}

function prepareOutputFile(sourcePath: string, outputPath: string, safeOutputRoot: string): string {
  assertExistingLocalFile(sourcePath)
  const resolvedOutput = assertOutputPathInsideRoot(outputPath, safeOutputRoot)
  assertSourceNotOverwritten(sourcePath, resolvedOutput)
  return resolvedOutput
}

function assertOutputDirectory(outputDirectory: string, safeOutputRoot: string): string {
  assertNoSignedUrlOrRawUrl(outputDirectory, 'outputDirectory')
  assertNoPathTraversal(outputDirectory, 'outputDirectory')
  return assertOutputPathInsideRoot(outputDirectory, safeOutputRoot)
}

async function summarizeFrameOutputs(
  outputDirectory: string,
  artifactType: 'keyframe_image' | 'representative_frame',
): Promise<MediaFoundationArtifactSummary[]> {
  const filenames = (await readdir(outputDirectory))
    .filter((filename) => filename.toLowerCase().endsWith('.jpg'))
    .sort()

  return Promise.all(filenames.map(async (filename, index) => {
    const outputPath = path.join(outputDirectory, filename)
    await chmod(outputPath, 0o600)
    const outputStat = await stat(outputPath)
    const outputAuthority = await inspectLocalMediaFileAuthority(outputPath)
    return {
      artifactId: `${artifactType}-${index + 1}`,
      artifactType,
      storageBucketPurpose: 'analysis_artifacts',
      storageObjectPath: filename,
      localFilePath: outputPath,
      contentType: 'image/jpeg',
      sizeBytes: outputStat.size,
      checksum: outputAuthority.checksumSha256,
      frameNumber: index + 1,
      sourceOfTruth: true,
      isPrivate: true,
    }
  }))
}

async function preparePrivateOutputDirectory(directoryPath: string): Promise<void> {
  await mkdir(directoryPath, { recursive: true, mode: 0o700 })
  await chmod(directoryPath, 0o700)
}

function buildRepresentativeSampleTimes(durationSeconds: number | undefined, maxFrameCount: number): number[] {
  const duration = Math.max(0.1, durationSeconds ?? 1)
  if (maxFrameCount === 1) return [0]
  if (maxFrameCount === 2) return [0, Math.max(0, duration - 0.1)]
  return [
    0,
    Number((duration / 2).toFixed(3)),
    Math.max(0, Number((duration - 0.1).toFixed(3))),
  ].slice(0, maxFrameCount)
}
