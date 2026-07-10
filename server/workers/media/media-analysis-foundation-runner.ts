import path from 'node:path'
import { assertExistingLocalFile } from './media-path-safety'
import { buildArtifactRecordsFromSummaries } from './media-artifact-record-builder'
import { buildMediaAnalysisReport } from './media-analysis-report-builder'
import { buildMediaObjectPath, resolveLocalMediaPathFromStorageRef } from './media-storage-resolver'
import { runAudioExtractProductionWorker } from './audio-extract-production-worker'
import { runKeyframeExtractProductionWorker } from './keyframe-extract-production-worker'
import { runMediaProbeProductionWorker } from './media-probe-production-worker'
import { runMediaProxyProductionWorker } from './media-proxy-production-worker'
import { runRepresentativeFrameProductionWorker } from './representative-frame-production-worker'
import type {
  ExtractedAudioResult,
  ExtractedFrameResult,
  MediaFoundationArtifactSummary,
  MediaFoundationResult,
  MediaFoundationRunnerInput,
  MediaFoundationTask,
  MediaProxyResult,
} from './media-worker-types'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'

const defaultTasks: MediaFoundationTask[] = [
  'probe',
  'create_proxy',
  'extract_audio',
  'extract_keyframes',
  'extract_representative_frames',
  'build_analysis_report',
]

export async function runMediaAnalysisFoundation(input: MediaFoundationRunnerInput): Promise<MediaFoundationResult> {
  validateRunnerInput(input)
  const expectedActions = input.tasks ?? defaultTasks
  const outputTasks = expectedActions.filter((task) => (
    task === 'create_proxy' ||
    task === 'extract_audio' ||
    task === 'extract_keyframes' ||
    task === 'extract_representative_frames'
  ))
  const gatewayAdapterId = typeof input.workerPayload?.metadata?.gatewayAdapterId === 'string'
    ? input.workerPayload.metadata.gatewayAdapterId
    : undefined
  const productionAudioExtractAllowed = input.mode === 'production_ready' &&
    gatewayAdapterId === 'cpu_analysis_worker_media_audio_extract' &&
    outputTasks.length === 1 &&
    outputTasks[0] === 'extract_audio'
  const productionProxyAllowed = input.mode === 'production_ready' &&
    gatewayAdapterId === 'cpu_analysis_worker_media_proxy' &&
    outputTasks.length === 1 &&
    outputTasks[0] === 'create_proxy'
  const productionKeyframesAllowed = input.mode === 'production_ready' &&
    gatewayAdapterId === 'cpu_analysis_worker_media_keyframes' &&
    outputTasks.length === 1 &&
    outputTasks[0] === 'extract_keyframes'
  const productionRepresentativeFramesAllowed = input.mode === 'production_ready' &&
    gatewayAdapterId === 'cpu_analysis_worker_media_representative_frames' &&
    outputTasks.length === 1 &&
    outputTasks[0] === 'extract_representative_frames'

  if (input.mode === 'production_blocked') {
    return {
      mode: input.mode,
      status: 'blocked',
      expectedActions,
      artifactRecords: [],
      skipReasons: [{
        code: 'production_execution_blocked',
        message: 'Media foundation production execution is blocked unless a later approved production_ready handler path is selected.',
      }],
      warnings: ['No FFmpeg/FFprobe command was executed.'],
    }
  }

  if (
    input.mode === 'production_ready' &&
    outputTasks.length > 0 &&
    !productionAudioExtractAllowed &&
    !productionProxyAllowed &&
    !productionKeyframesAllowed &&
    !productionRepresentativeFramesAllowed
  ) {
    return {
      mode: input.mode,
      status: 'blocked',
      expectedActions,
      artifactRecords: [],
      skipReasons: [{
        code: 'production_media_output_tasks_blocked',
        message: 'Production-ready media foundation is currently limited to bounded ffprobe probe/report execution; FFmpeg output tasks require a separate approved handler gate.',
        tool: 'ffmpeg',
      }],
      warnings: ['No FFmpeg output command was executed.'],
    }
  }

  if (input.mode === 'dry_run') {
    return {
      mode: input.mode,
      status: 'dry_run',
      expectedActions,
      artifactRecords: [],
      skipReasons: [],
      warnings: [
        'Dry-run validates media foundation intent only and does not require FFmpeg/FFprobe.',
        'Real media processing remains local/dev-only in Milestone 6.',
      ],
    }
  }

  const outputRoot = input.outputRoot
  if (!outputRoot && outputTasks.length > 0) {
    throw new Error(`${input.mode} media foundation requires outputRoot for output-producing tasks.`)
  }

  const resolvedSource = resolveLocalMediaPathFromStorageRef({
    storageReference: input.source,
    localStorageRoot: input.localStorageRoot,
    storageMode: 'local',
  })
  if (!resolvedSource.localFilePath) {
    throw new Error('local_dev media foundation requires a resolved local source file path.')
  }

  assertExistingLocalFile(resolvedSource.localFilePath)

  const ffprobeBin = input.ffprobeBin ?? 'ffprobe'
  const ffmpegBin = input.ffmpegBin ?? 'ffmpeg'
  const timeoutMs = input.timeoutMs ?? 30_000
  const summaries: MediaFoundationArtifactSummary[] = []
  const probe = expectedActions.includes('probe')
    ? await runMediaProbeProductionWorker({
      localFilePath: resolvedSource.localFilePath,
      ffprobeBin,
      timeoutMs,
    })
    : undefined

  if (!probe) {
    throw new Error('Milestone 6 local_dev runner requires probe task before artifacts/report assembly.')
  }

  const proxy = outputRoot && expectedActions.includes('create_proxy')
    ? await runProxyTask(input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutMs, summaries)
    : undefined
  const audio = outputRoot && expectedActions.includes('extract_audio')
    ? await runAudioTask(input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutMs, probe.audioStreams.length > 0, summaries)
    : undefined
  const keyframes = outputRoot && expectedActions.includes('extract_keyframes')
    ? await runFrameTask('keyframes', input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutMs, summaries)
    : undefined
  const representativeFrames = outputRoot && expectedActions.includes('extract_representative_frames')
    ? await runFrameTask('representative', input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutMs, summaries, probe.durationSeconds)
    : undefined

  const artifactRecords = buildArtifactRecordsFromSummaries({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    summaries,
  })

  const mediaAnalysisReport = expectedActions.includes('build_analysis_report')
    ? buildMediaAnalysisReport({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      sourceStorageObjectId: input.sourceStorageObjectId,
      probe,
      proxy,
      audio,
      keyframes,
      representativeFrames,
      status: 'partial',
    })
    : undefined

  return {
    mode: input.mode,
    status: mediaAnalysisReport ? 'partial' : 'completed',
    expectedActions,
    probe,
    proxy,
    audio,
    keyframes,
    representativeFrames,
    artifactRecords,
    mediaAnalysisReport,
    skipReasons: [
      ...(audio?.skipReason ? [audio.skipReason] : []),
      ...(keyframes?.skipReason ? [keyframes.skipReason] : []),
      ...(representativeFrames?.skipReason ? [representativeFrames.skipReason] : []),
    ],
    warnings: input.mode === 'production_ready'
      ? productionAudioExtractAllowed
        ? [
          'Production-ready media foundation ran only bounded ffprobe plus FFmpeg extracted-audio handler.',
          'No proxy, keyframe, representative-frame, transcript, scene intelligence, OpenCV visual analysis, color grading, OCR, masks, enhancement, or final render ran.',
        ]
        : productionProxyAllowed
          ? [
            'Production-ready media foundation ran only bounded ffprobe plus FFmpeg proxy handler.',
            'No extracted audio, keyframe, representative-frame, transcript, scene intelligence, OpenCV visual analysis, color grading, OCR, masks, enhancement, or final render ran.',
          ]
          : productionKeyframesAllowed
            ? [
              'Production-ready media foundation ran only bounded ffprobe plus FFmpeg keyframe extraction handler.',
              'No proxy, extracted audio, representative-frame, transcript, scene intelligence, OpenCV visual analysis, color grading, OCR, masks, enhancement, or final render ran.',
            ]
            : productionRepresentativeFramesAllowed
              ? [
                'Production-ready media foundation ran only bounded ffprobe plus FFmpeg representative-frame extraction handler.',
                'No proxy, extracted audio, keyframe, transcript, scene intelligence, OpenCV visual analysis, color grading, OCR, masks, enhancement, or final render ran.',
              ]
        : [
          'Production-ready media foundation ran only the bounded ffprobe probe/report handler.',
          'No FFmpeg output tasks, transcript, scene intelligence, OpenCV visual analysis, color grading, OCR, masks, enhancement, or final render ran.',
        ]
      : ['Milestone 6 did not run transcript, scene intelligence, OpenCV visual analysis, color grading, OCR, masks, enhancement, or final render.'],
  }
}

function validateRunnerInput(input: MediaFoundationRunnerInput): void {
  if (input.mode === 'production_ready' && !input.workerPayload) {
    throw new Error('production_ready media foundation requires the approved worker payload context.')
  }

  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }

  if (!input.workspaceId || !input.projectId || !input.mediaAssetId || !input.sourceStorageObjectId) {
    throw new Error('Media foundation requires workspaceId, projectId, mediaAssetId, and sourceStorageObjectId.')
  }
}

async function runProxyTask(
  input: MediaFoundationRunnerInput,
  sourceLocalPath: string,
  outputRoot: string,
  ffmpegBin: string,
  timeoutMs: number,
  summaries: MediaFoundationArtifactSummary[],
): Promise<MediaProxyResult> {
  const outputLocalPath = path.join(outputRoot, 'proxy', `${input.mediaAssetId}-proxy.mp4`)
  const artifact = await runMediaProxyProductionWorker({
    sourceLocalPath,
    outputLocalPath,
    safeOutputRoot: outputRoot,
    ffmpegBin,
    timeoutMs,
    targetMaxWidth: 1280,
    keepAudio: true,
  })
  const canonical = withCanonicalStoragePath(input, artifact, 'proxy', `${input.mediaAssetId}-proxy.mp4`)
  summaries.push(canonical)
  return {
    status: 'created',
    artifact: canonical,
  }
}

async function runAudioTask(
  input: MediaFoundationRunnerInput,
  sourceLocalPath: string,
  outputRoot: string,
  ffmpegBin: string,
  timeoutMs: number,
  audioStreamExists: boolean,
  summaries: MediaFoundationArtifactSummary[],
): Promise<ExtractedAudioResult> {
  if (!audioStreamExists) {
    return {
      status: 'skipped',
      skipReason: {
        code: 'no_audio_stream',
        message: 'Source media has no audio stream to extract.',
        tool: 'ffmpeg',
      },
    }
  }

  const filename = `${input.mediaAssetId}-audio.wav`
  const artifact = await runAudioExtractProductionWorker({
    sourceLocalPath,
    outputLocalPath: path.join(outputRoot, 'audio', filename),
    safeOutputRoot: outputRoot,
    ffmpegBin,
    timeoutMs,
    sampleRate: 16000,
    channels: 1,
  })
  const canonical = withCanonicalStoragePath(input, artifact, 'audio', filename)
  summaries.push(canonical)
  return {
    status: 'created',
    artifact: canonical,
    sampleRate: 16000,
    channels: 1,
  }
}

async function runFrameTask(
  frameKind: 'keyframes' | 'representative',
  input: MediaFoundationRunnerInput,
  sourceLocalPath: string,
  outputRoot: string,
  ffmpegBin: string,
  timeoutMs: number,
  summaries: MediaFoundationArtifactSummary[],
  durationSeconds?: number,
): Promise<ExtractedFrameResult> {
  const outputDirectory = path.join(outputRoot, frameKind)
  const artifacts = frameKind === 'keyframes'
    ? await runKeyframeExtractProductionWorker({
      sourceLocalPath,
      outputDirectory,
      safeOutputRoot: outputRoot,
      ffmpegBin,
      timeoutMs,
      maxFrameCount: input.maxKeyframeCount ?? 3,
      frameIntervalSeconds: 2,
    })
    : await runRepresentativeFrameProductionWorker({
      sourceLocalPath,
      outputDirectory,
      safeOutputRoot: outputRoot,
      ffmpegBin,
      timeoutMs,
      durationSeconds,
      maxFrameCount: input.maxRepresentativeFrameCount ?? 3,
    })

  const canonicalArtifacts = artifacts.map((artifact) => withCanonicalStoragePath(
    input,
    artifact,
    frameKind,
    artifact.storageObjectPath,
  ))
  summaries.push(...canonicalArtifacts)
  return {
    status: canonicalArtifacts.length > 0 ? 'created' : 'skipped',
    artifacts: canonicalArtifacts,
    skipReason: canonicalArtifacts.length > 0
      ? undefined
      : {
        code: `${frameKind}_not_created`,
        message: `No ${frameKind} were created by FFmpeg.`,
        tool: 'ffmpeg',
      },
  }
}

function withCanonicalStoragePath(
  input: MediaFoundationRunnerInput,
  artifact: MediaFoundationArtifactSummary,
  folder: string,
  filename: string,
): MediaFoundationArtifactSummary {
  return {
    ...artifact,
    storageObjectPath: buildMediaObjectPath({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      folder,
      filename,
    }),
  }
}
