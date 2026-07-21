import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { chmod, lstat, mkdir, readFile, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import type { RuntimeEnv } from '../config/env'
import { runFFmpegCommand } from '../workers/media/ffmpeg-media-adapter'
import {
  assertExistingLocalFile,
  assertOutputPathInsideRoot,
  assertSourceNotOverwritten,
} from '../workers/media/media-path-safety'
import { runMediaProbeProductionWorker } from '../workers/media/media-probe-production-worker'
import type { MediaProbeResult } from '../workers/media/media-worker-types'
import { runEditReferenceColorSignalStudy } from './edit-reference-color-signal-study'
import {
  type EditReferenceLongFormStudyChunkPlan,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyWorkItem,
} from './edit-reference-long-form-study-contract'
import {
  createEditReferenceLongFormStudyWorkOutput,
  type EditReferenceLongFormStudyOutputArtifact,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import { createUnmeteredEditReferenceLongFormStudyUsage } from './edit-reference-long-form-study-usage-contract'
import { runEditReferenceMotionSignalStudy } from './edit-reference-motion-signal-study'
import { runEditReferenceSceneBoundaryStudy } from './edit-reference-scene-boundary-study'

const MIN_STAGE_TIMEOUT_MS = 10 * 60 * 1_000
const MAX_STAGE_TIMEOUT_MS = 2 * 60 * 60 * 1_000
const MAX_VISUAL_SAMPLES_PER_CHUNK = 24

export interface ExecuteEditReferenceLongFormChunkMediaStageInput {
  readonly env: RuntimeEnv
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: import('./edit-reference-long-form-study-contract').EditReferenceLongFormStudyRunRecord
  readonly runId: string
  readonly workItem: EditReferenceLongFormStudyWorkItem
  readonly sourceLocalPath: string
  readonly sourceBackingFilePaths?: readonly string[]
  readonly sourceProtocolWhitelist?: 'file,concat'
  readonly outputDirectory: string
  readonly dependencyOutputs: readonly EditReferenceLongFormStudyWorkOutput[]
  readonly dependencyArtifactLocalPaths: Readonly<Record<string, string>>
  readonly createdAt: string
}

export async function executeEditReferenceLongFormChunkMediaStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  const chunk = requireChunk(input.plan, input.workItem)
  if (input.sourceProtocolWhitelist) {
    if (
      input.sourceProtocolWhitelist !== 'file,concat'
      || !input.sourceLocalPath.startsWith('concat:')
      || !input.sourceBackingFilePaths?.length
    ) throw new Error('The managed long-form media input is invalid.')
    for (const file of input.sourceBackingFilePaths) assertExistingLocalFile(file)
  } else {
    assertExistingLocalFile(input.sourceLocalPath)
  }
  await mkdir(input.outputDirectory, { recursive: true, mode: 0o700 })
  await chmod(input.outputDirectory, 0o700)
  const started = process.hrtime.bigint()
  const timeoutMs = deriveEditReferenceLongFormChunkStageTimeoutMs(
    chunk.coreEndSeconds - chunk.coreStartSeconds,
  )

  let executed: {
    readonly result: EditReferenceLongFormStudyWorkOutput['result']
    readonly artifacts: readonly EditReferenceLongFormStudyOutputArtifact[]
    readonly toolIds: EditReferenceLongFormStudyWorkOutput['toolIds']
  }
  if (input.workItem.stageId === 'analysis_proxy') {
    executed = await createAnalysisProxy(input, chunk, timeoutMs)
  } else if (input.workItem.stageId === 'audio_extract') {
    executed = await createStudyAudio(input, chunk, timeoutMs)
  } else if (input.workItem.stageId === 'scene_boundary_scan') {
    executed = await studySceneBoundaries(input, chunk, timeoutMs)
  } else if (input.workItem.stageId === 'visual_sampling') {
    executed = await createVisualSamples(input, chunk, timeoutMs)
  } else if (input.workItem.stageId === 'color_motion_signals') {
    executed = await studyColorAndMotion(input, chunk, timeoutMs)
  } else {
    throw new Error(`The bounded local media worker does not own ${input.workItem.stageId}.`)
  }

  const observedWallClockMs = Math.max(1, Number((process.hrtime.bigint() - started) / 1_000_000n))
  return createEditReferenceLongFormStudyWorkOutput({
    runId: input.runId,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    workItemId: input.workItem.workItemId,
    stageId: executed.result.kind,
    chunkId: chunk.chunkId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceCoverageStartSeconds: chunk.coreStartSeconds,
    sourceCoverageEndSeconds: chunk.coreEndSeconds,
    toolIds: executed.toolIds,
    artifacts: executed.artifacts,
    result: executed.result,
    runtimeSource: 'verified_local',
    completionAuthority: 'authoritative',
    usage: createUnmeteredEditReferenceLongFormStudyUsage({
      mode: 'backend_local_unmetered',
      observedWallClockMs,
      inputMediaSeconds: chunk.coreEndSeconds - chunk.coreStartSeconds,
      outputBytes: executed.artifacts.reduce((sum, artifact) => sum + artifact.sizeBytes, 0),
    }),
    originalRemainsImmutable: true,
    rawProcessOutputPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
    createdAt: input.createdAt,
  })
}

export function deriveEditReferenceLongFormChunkStageTimeoutMs(coreDurationSeconds: number): number {
  if (!Number.isFinite(coreDurationSeconds) || coreDurationSeconds <= 0 || coreDurationSeconds > 15 * 60) {
    throw new Error('Long-form chunk duration is invalid for timeout planning.')
  }
  return Math.min(
    MAX_STAGE_TIMEOUT_MS,
    Math.max(MIN_STAGE_TIMEOUT_MS, Math.ceil(coreDurationSeconds * 12 * 1_000)),
  )
}

async function createAnalysisProxy(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  chunk: EditReferenceLongFormStudyChunkPlan,
  timeoutMs: number,
) {
  const outputPath = path.join(input.outputDirectory, 'analysis-proxy.mp4')
  const coreDuration = chunk.coreEndSeconds - chunk.coreStartSeconds
  const probe = await createOrRecoverMediaFile({
    sourceLocalPath: input.sourceLocalPath,
    outputLocalPath: outputPath,
    safeOutputRoot: input.outputDirectory,
    ffmpegBin: input.env.ffmpegBin,
    ffprobeBin: input.env.ffprobeBin,
    timeoutMs,
    purpose: 'create_proxy',
    validateProbe: (candidate) => (
      candidate.videoStreams.length === 1
      && candidate.audioStreams.length === 0
      && candidate.width >= 1
      && candidate.height >= 1
      && candidate.width <= input.plan.normalization.maxWidth
      && candidate.height <= input.plan.normalization.maxHeight
      && candidate.fps > 0
      && candidate.fps <= input.plan.normalization.maxFrameRate + 0.01
      && Math.abs(candidate.durationSeconds - coreDuration) <= Math.max(0.25, 2 / Math.max(1, candidate.fps))
    ),
    args: [
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-n',
      ...sourceProtocolArgs(input),
      '-ss', seconds(chunk.decodeStartSeconds),
      '-t', seconds(chunk.decodeEndSeconds - chunk.decodeStartSeconds),
      '-i', input.sourceLocalPath,
      '-map', '0:v:0',
      '-an',
      '-vf', [
        `trim=start=${seconds(chunk.overlapBeforeSeconds)}:duration=${seconds(coreDuration)}`,
        'setpts=PTS-STARTPTS',
        "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      ].join(','),
      '-fpsmax', '30',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    ],
  })
  const artifact = await mediaArtifact('analysis_proxy', 'video/mp4', outputPath, input.outputDirectory)
  return {
    result: {
      kind: 'analysis_proxy' as const,
      durationSeconds: rounded(probe.durationSeconds),
      width: probe.width,
      height: probe.height,
      frameRate: rounded(probe.fps),
      videoCodec: probe.codecName,
      pixelFormat: probe.videoStreams[0]?.pixelFormat ?? 'unknown',
      maxWidth: 1280 as const,
      maxHeight: 1280 as const,
      maxFrameRate: 30 as const,
      constantRateFactor: 28 as const,
      audioIncluded: false as const,
      decodeOverlapUsed: true as const,
    },
    artifacts: [artifact],
    toolIds: ['ffmpeg', 'ffprobe'] as const,
  }
}

async function createStudyAudio(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  chunk: EditReferenceLongFormStudyChunkPlan,
  timeoutMs: number,
) {
  const outputPath = path.join(input.outputDirectory, 'study-audio.wav')
  const coreDuration = chunk.coreEndSeconds - chunk.coreStartSeconds
  const probe = await createOrRecoverMediaFile({
    sourceLocalPath: input.sourceLocalPath,
    outputLocalPath: outputPath,
    safeOutputRoot: input.outputDirectory,
    ffmpegBin: input.env.ffmpegBin,
    ffprobeBin: input.env.ffprobeBin,
    timeoutMs,
    purpose: 'extract_audio',
    validateProbe: (candidate) => {
      const candidateAudio = candidate.audioStreams[0]
      return candidate.videoStreams.length === 0
        && candidate.audioStreams.length === 1
        && candidateAudio?.sampleRate === 16000
        && candidateAudio?.channels === 1
        && Math.abs(candidate.durationSeconds - coreDuration) <= 0.25
    },
    args: [
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-n',
      ...sourceProtocolArgs(input),
      '-ss', seconds(chunk.decodeStartSeconds),
      '-t', seconds(chunk.decodeEndSeconds - chunk.decodeStartSeconds),
      '-i', input.sourceLocalPath,
      '-map', '0:a:0',
      '-vn',
      '-af', `atrim=start=${seconds(chunk.overlapBeforeSeconds)}:duration=${seconds(coreDuration)},asetpts=PTS-STARTPTS`,
      '-ac', '1',
      '-ar', '16000',
      '-c:a', 'pcm_s16le',
    ],
  })
  const audio = probe.audioStreams[0]
  if (!audio) throw new Error('The bounded study-audio copy lost its validated audio stream.')
  const artifact = await mediaArtifact('study_audio', 'audio/wav', outputPath, input.outputDirectory)
  return {
    result: {
      kind: 'audio_extract' as const,
      durationSeconds: rounded(probe.durationSeconds),
      sampleRate: 16000 as const,
      channels: 1 as const,
      codec: 'pcm_s16le' as const,
      decodeOverlapUsed: true as const,
    },
    artifacts: [artifact],
    toolIds: ['ffmpeg', 'ffprobe'] as const,
  }
}

async function studySceneBoundaries(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  chunk: EditReferenceLongFormStudyChunkPlan,
  timeoutMs: number,
) {
  const proxy = requireDependencyArtifact(input, 'analysis_proxy')
  const coreDuration = chunk.coreEndSeconds - chunk.coreStartSeconds
  const result = await runEditReferenceSceneBoundaryStudy({
    sourceLocalPath: proxy,
    ffmpegBin: input.env.ffmpegBin,
    timeoutMs,
    durationSeconds: coreDuration,
    maxScanDurationSeconds: coreDuration,
    maxBoundaryCount: 50,
  })
  if (result.status !== 'verified_local_bounded' || result.coverage !== 'full') {
    throw new Error(result.blockerCode ?? 'The bounded scene-boundary scan did not cover the full section.')
  }
  const boundaryTimesSeconds = result.boundaryTimesSeconds.map((value) => rounded(chunk.coreStartSeconds + value))
  return {
    result: {
      kind: 'scene_boundary_scan' as const,
      threshold: result.threshold,
      boundaryTimesSeconds,
      boundaryCount: boundaryTimesSeconds.length,
      technicalCandidatesOnly: true as const,
      semanticSceneAnalysisRan: false as const,
      fullCoreCoverage: true as const,
    },
    artifacts: [] as const,
    toolIds: ['ffmpeg'] as const,
  }
}

async function createVisualSamples(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  chunk: EditReferenceLongFormStudyChunkPlan,
  timeoutMs: number,
) {
  const proxy = requireDependencyArtifact(input, 'analysis_proxy')
  const sceneOutput = input.dependencyOutputs.find((output) => output.stageId === 'scene_boundary_scan')
  if (!sceneOutput || sceneOutput.result.kind !== 'scene_boundary_scan') {
    throw new Error('Visual sampling requires the exact completed scene-boundary output for this section.')
  }
  const sampleTimesSeconds = adaptiveSampleTimes({
    chunk,
    minimumCount: chunk.minimumVisualSampleCount,
    sceneBoundaryTimesSeconds: sceneOutput.result.boundaryTimesSeconds,
  })
  const framesDirectory = path.join(input.outputDirectory, 'frames')
  await mkdir(framesDirectory, { recursive: true, mode: 0o700 })
  await chmod(framesDirectory, 0o700)
  const artifacts: EditReferenceLongFormStudyOutputArtifact[] = []
  for (const [index, sourceTimeSeconds] of sampleTimesSeconds.entries()) {
    const outputPath = path.join(framesDirectory, `visual-sample-${String(index + 1).padStart(3, '0')}.jpg`)
    await createOrRecoverJpeg({
      sourceLocalPath: proxy,
      outputLocalPath: outputPath,
      safeOutputRoot: input.outputDirectory,
      ffmpegBin: input.env.ffmpegBin,
      timeoutMs,
      localTimeSeconds: sourceTimeSeconds - chunk.coreStartSeconds,
    })
    artifacts.push(await mediaArtifact(
      'visual_sample',
      'image/jpeg',
      outputPath,
      input.outputDirectory,
      sourceTimeSeconds,
    ))
  }
  return {
    result: {
      kind: 'visual_sampling' as const,
      sampleTimesSeconds,
      sampleCount: sampleTimesSeconds.length,
      minimumSampleCountSatisfied: true as const,
      adaptiveSceneSamplingRequiredForSemanticPass: true as const,
      semanticVisualAnalysisRan: false as const,
      fullCoreCoverage: true as const,
    },
    artifacts,
    toolIds: ['ffmpeg'] as const,
  }
}

async function studyColorAndMotion(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  chunk: EditReferenceLongFormStudyChunkPlan,
  timeoutMs: number,
) {
  const proxy = requireDependencyArtifact(input, 'analysis_proxy')
  const coreDuration = chunk.coreEndSeconds - chunk.coreStartSeconds
  const [color, motion] = await Promise.all([
    runEditReferenceColorSignalStudy({
      sourceLocalPath: proxy,
      ffmpegBin: input.env.ffmpegBin,
      ffprobeBin: input.env.ffprobeBin,
      timeoutMs,
      durationSeconds: coreDuration,
      maxScanDurationSeconds: coreDuration,
      maxSampleCount: 12,
    }),
    runEditReferenceMotionSignalStudy({
      sourceLocalPath: proxy,
      ffmpegBin: input.env.ffmpegBin,
      timeoutMs,
      durationSeconds: coreDuration,
      maxScanDurationSeconds: coreDuration,
      maxSampleCount: 24,
    }),
  ])
  if (
    color.status !== 'verified_local_bounded'
    || color.coverage !== 'full'
    || motion.status !== 'verified_local_bounded'
    || motion.coverage !== 'full'
  ) throw new Error('The bounded color/motion signal pass did not cover the full section.')
  return {
    result: {
      kind: 'color_motion_signals' as const,
      color,
      motion,
      technicalSignalsOnly: true as const,
      semanticColorAnalysisRan: false as const,
      semanticMotionAnalysisRan: false as const,
      fullCoreCoverage: true as const,
    },
    artifacts: [] as const,
    toolIds: ['ffmpeg', 'ffprobe'] as const,
  }
}

async function createOrRecoverMediaFile(input: {
  readonly sourceLocalPath: string
  readonly outputLocalPath: string
  readonly safeOutputRoot: string
  readonly ffmpegBin: string
  readonly ffprobeBin: string
  readonly timeoutMs: number
  readonly purpose: 'create_proxy' | 'extract_audio'
  readonly args: readonly string[]
  readonly validateProbe: (probe: MediaProbeResult) => boolean
}) {
  const output = assertOutputPathInsideRoot(input.outputLocalPath, input.safeOutputRoot)
  assertSourceNotOverwritten(input.sourceLocalPath, output)
  if (await regularFileExists(output)) {
    try {
      const recovered = await runMediaProbeProductionWorker({
        localFilePath: output,
        ffprobeBin: input.ffprobeBin,
        timeoutMs: input.timeoutMs,
      })
      if (input.validateProbe(recovered)) return recovered
    } catch {
      // A generated derivative may be rebuilt; the immutable source is never removed.
    }
    await removeGeneratedPartial(output, input.safeOutputRoot)
  }
  const partial = partialPath(output)
  await removeGeneratedPartial(partial, input.safeOutputRoot)
  await runFFmpegCommand({
    ffmpegBin: input.ffmpegBin,
    args: replaceFinalOutput(input.args, partial),
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [partial],
    purpose: input.purpose,
  })
  const probe = await runMediaProbeProductionWorker({
    localFilePath: partial,
    ffprobeBin: input.ffprobeBin,
    timeoutMs: input.timeoutMs,
  })
  if (!input.validateProbe(probe)) {
    await removeGeneratedPartial(partial, input.safeOutputRoot)
    throw new Error('The regenerated bounded media derivative failed its exact output validation.')
  }
  await chmod(partial, 0o600)
  await rename(partial, output)
  await chmod(output, 0o600)
  return probe
}

async function createOrRecoverJpeg(input: {
  readonly sourceLocalPath: string
  readonly outputLocalPath: string
  readonly safeOutputRoot: string
  readonly ffmpegBin: string
  readonly timeoutMs: number
  readonly localTimeSeconds: number
}): Promise<void> {
  const output = assertOutputPathInsideRoot(input.outputLocalPath, input.safeOutputRoot)
  assertSourceNotOverwritten(input.sourceLocalPath, output)
  if (await validJpegExists(output)) return
  const partial = partialPath(output)
  await removeGeneratedPartial(partial, input.safeOutputRoot)
  await runFFmpegCommand({
    ffmpegBin: input.ffmpegBin,
    args: [
      '-hide_banner', '-nostdin', '-loglevel', 'error', '-n',
      '-ss', seconds(Math.max(0, input.localTimeSeconds)),
      '-i', input.sourceLocalPath,
      '-frames:v', '1',
      '-vf', "scale=w='min(768,iw)':h='min(768,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      '-pix_fmt', 'yuvj420p',
      '-q:v', '3',
      partial,
    ],
    timeoutMs: input.timeoutMs,
    expectedOutputPaths: [partial],
    purpose: 'extract_representative_frames',
  })
  if (!await validJpegExists(partial)) throw new Error('The bounded visual sample is not a valid JPEG output.')
  await chmod(partial, 0o600)
  await rename(partial, output)
  await chmod(output, 0o600)
}

function requireDependencyArtifact(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  stageId: 'analysis_proxy',
): string {
  const output = input.dependencyOutputs.find((candidate) => candidate.stageId === stageId)
  const artifact = output?.artifacts.find((candidate) => candidate.role === stageId)
  if (!output || !artifact || output.chunkId !== input.workItem.chunkId) {
    throw new Error(`The exact ${stageId} dependency is unavailable for this section.`)
  }
  const localPath = input.dependencyArtifactLocalPaths[dependencyArtifactKey(
    output.workItemId,
    artifact.storageObjectPath,
  )]
  if (!localPath) throw new Error(`The exact ${stageId} private artifact path is unavailable.`)
  assertExistingLocalFile(localPath)
  return localPath
}

function sourceProtocolArgs(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
): string[] {
  return input.sourceProtocolWhitelist
    ? ['-protocol_whitelist', input.sourceProtocolWhitelist]
    : []
}

function requireChunk(
  plan: EditReferenceLongFormStudyPlan,
  workItem: EditReferenceLongFormStudyWorkItem,
): EditReferenceLongFormStudyChunkPlan {
  const chunk = plan.chunks.find((candidate) => candidate.chunkId === workItem.chunkId)
  if (!chunk) throw new Error('Long-form chunk media work requires an exact planned section.')
  return chunk
}

function adaptiveSampleTimes(input: {
  readonly chunk: EditReferenceLongFormStudyChunkPlan
  readonly minimumCount: number
  readonly sceneBoundaryTimesSeconds: readonly number[]
}): number[] {
  const start = input.chunk.coreStartSeconds
  const end = input.chunk.coreEndSeconds
  const duration = end - start
  const latestBoundarySample = Math.max(start, end - Math.min(1, duration / 2))
  const uniform: number[] = []
  for (let windowStart = start; windowStart < end; windowStart += 120) {
    const windowEnd = Math.min(end, windowStart + 120)
    const windowDuration = windowEnd - windowStart
    for (let ordinal = 1; ordinal <= 4; ordinal += 1) {
      uniform.push(rounded(windowStart + (windowDuration * ordinal) / 5))
    }
  }
  for (let index = uniform.length; index < input.minimumCount; index += 1) {
    uniform.push(rounded(start + duration * ((index + 0.5) / input.minimumCount)))
  }
  uniform.sort((left, right) => left - right)
  const boundaryCandidates: number[] = []
  for (const boundary of input.sceneBoundaryTimesSeconds) {
    boundaryCandidates.push(Math.max(start, boundary - 0.25), Math.min(latestBoundarySample, boundary + 0.25))
  }
  const availableBoundarySlots = Math.max(0, MAX_VISUAL_SAMPLES_PER_CHUNK - uniform.length)
  const boundaryExtras = [...new Set(boundaryCandidates
    .map((value) => rounded(Math.min(latestBoundarySample, Math.max(start, value))))
    .filter((value) => value >= start && value < end && !uniform.includes(value)))]
    .sort((left, right) => left - right)
  const selectedBoundaryExtras = evenlySelect(boundaryExtras, availableBoundarySlots)
  return [...new Set([...uniform, ...selectedBoundaryExtras])].sort((left, right) => left - right)
}

function evenlySelect(values: readonly number[], maximumCount: number): number[] {
  if (maximumCount <= 0 || values.length === 0) return []
  if (values.length <= maximumCount) return [...values]
  if (maximumCount === 1) return [values[Math.floor(values.length / 2)] as number]
  const selected = new Set<number>()
  for (let index = 0; index < maximumCount; index += 1) {
    selected.add(values[Math.round((index / (maximumCount - 1)) * (values.length - 1))] as number)
  }
  return [...selected]
}

async function mediaArtifact(
  role: EditReferenceLongFormStudyOutputArtifact['role'],
  contentType: EditReferenceLongFormStudyOutputArtifact['contentType'],
  localPath: string,
  outputDirectory: string,
  sourceTimeSeconds?: number,
): Promise<EditReferenceLongFormStudyOutputArtifact> {
  const file = await lstat(localPath)
  if (!file.isFile() || file.isSymbolicLink() || file.size <= 0) {
    throw new Error('Long-form generated artifact is missing, empty, or unsafe.')
  }
  const storageObjectPath = path.relative(outputDirectory, localPath).split(path.sep).join('/')
  return {
    role,
    storageObjectPath,
    contentType,
    sizeBytes: file.size,
    checksumSha256: await checksumFile(localPath),
    ...(sourceTimeSeconds === undefined ? {} : { sourceTimeSeconds: rounded(sourceTimeSeconds) }),
  }
}

async function checksumFile(file: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer)
  return hash.digest('hex')
}

async function regularFileExists(file: string): Promise<boolean> {
  try {
    const stat = await lstat(file)
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size <= 0) {
      throw new Error('A generated long-form output path is unsafe.')
    }
    return true
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return false
    throw error
  }
}

async function validJpegExists(file: string): Promise<boolean> {
  if (!await regularFileExists(file)) return false
  const bytes = await readFile(file)
  return bytes.length >= 4
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes.at(-2) === 0xff
    && bytes.at(-1) === 0xd9
}

async function removeGeneratedPartial(file: string, safeOutputRoot: string): Promise<void> {
  assertOutputPathInsideRoot(file, safeOutputRoot)
  try {
    const stat = await lstat(file)
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('A partial long-form output path is unsafe.')
    await rm(file, { force: true })
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) throw error
  }
}

function replaceFinalOutput(args: readonly string[], output: string): string[] {
  return [...args, output]
}

function partialPath(output: string): string {
  const extension = path.extname(output)
  return `${output.slice(0, -extension.length)}.partial${extension}`
}

function seconds(value: number): string {
  return Math.max(0, value).toFixed(3)
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}

function isNodeError(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}

export function editReferenceLongFormDependencyArtifactKey(
  workItemId: string,
  storageObjectPath: string,
): string {
  return dependencyArtifactKey(workItemId, storageObjectPath)
}

function dependencyArtifactKey(workItemId: string, storageObjectPath: string): string {
  return `${workItemId}\u0000${storageObjectPath}`
}
