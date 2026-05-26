import { execFile } from 'node:child_process'
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
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
  }
}

export async function createProxyVideo(input: CreateProxyVideoInput): Promise<MediaFoundationArtifactSummary> {
  const outputPath = prepareOutputFile(input.sourceLocalPath, input.outputLocalPath, input.safeOutputRoot)
  await mkdir(path.dirname(outputPath), { recursive: true })

  const keepAudio = input.keepAudio ?? true
  const targetMaxWidth = input.targetMaxWidth ?? 1280
  const args = [
    '-hide_banner',
    '-nostdin',
    '-n',
    '-i',
    input.sourceLocalPath,
    '-map',
    '0:v:0',
    ...(keepAudio ? ['-map', '0:a?'] : ['-an']),
    '-vf',
    `scale='min(${targetMaxWidth},iw)':-2`,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '28',
    '-pix_fmt',
    'yuv420p',
    ...(keepAudio ? ['-c:a', 'aac', '-b:a', '96k'] : []),
    '-movflags',
    '+faststart',
    outputPath,
  ]

  await runFFmpegCommand({
    ffmpegBin: input.ffmpegBin,
    args,
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [outputPath],
    purpose: 'create_proxy',
  })

  const outputStat = await stat(outputPath)
  return {
    artifactId: `proxy-${path.basename(outputPath, path.extname(outputPath))}`,
    artifactType: 'proxy_video',
    storageBucketPurpose: 'proxy_media',
    storageObjectPath: path.basename(outputPath),
    localFilePath: outputPath,
    contentType: 'video/mp4',
    sizeBytes: outputStat.size,
    sourceOfTruth: true,
    isPrivate: true,
  }
}

export async function extractAudioTrack(input: ExtractAudioTrackInput): Promise<MediaFoundationArtifactSummary> {
  const outputPath = prepareOutputFile(input.sourceLocalPath, input.outputLocalPath, input.safeOutputRoot)
  await mkdir(path.dirname(outputPath), { recursive: true })

  await runFFmpegCommand({
    ffmpegBin: input.ffmpegBin,
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [outputPath],
    purpose: 'extract_audio',
    args: [
      '-hide_banner',
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
  return {
    artifactId: `audio-${path.basename(outputPath, path.extname(outputPath))}`,
    artifactType: 'extracted_audio',
    storageBucketPurpose: 'analysis_artifacts',
    storageObjectPath: path.basename(outputPath),
    localFilePath: outputPath,
    contentType: 'audio/wav',
    sizeBytes: outputStat.size,
    sourceOfTruth: true,
    isPrivate: true,
  }
}

export async function extractKeyframes(input: ExtractKeyframesInput): Promise<MediaFoundationArtifactSummary[]> {
  const outputDirectory = assertOutputDirectory(input.outputDirectory, input.safeOutputRoot)
  await mkdir(outputDirectory, { recursive: true })
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
  await mkdir(outputDirectory, { recursive: true })
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

  return Promise.all(outputs.map(async (outputPath, index) => ({
    artifactId: `representative-${index + 1}`,
    artifactType: 'representative_frame' as const,
    storageBucketPurpose: 'analysis_artifacts' as const,
    storageObjectPath: path.basename(outputPath),
    localFilePath: outputPath,
    contentType: 'image/jpeg',
    sizeBytes: (await stat(outputPath)).size,
    timeSeconds: sampleTimes[index],
    frameNumber: index + 1,
    sourceOfTruth: true as const,
    isPrivate: true as const,
  })))
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
    return {
      artifactId: `${artifactType}-${index + 1}`,
      artifactType,
      storageBucketPurpose: 'analysis_artifacts',
      storageObjectPath: filename,
      localFilePath: outputPath,
      contentType: 'image/jpeg',
      sizeBytes: (await stat(outputPath)).size,
      frameNumber: index + 1,
      sourceOfTruth: true,
      isPrivate: true,
    }
  }))
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
