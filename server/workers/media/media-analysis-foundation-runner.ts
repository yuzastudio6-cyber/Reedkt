import path from 'node:path'
import { assertExistingLocalFile } from './media-path-safety'
import { buildArtifactRecordsFromSummaries } from './media-artifact-record-builder'
import { buildMediaAnalysisReport } from './media-analysis-report-builder'
import { buildMediaObjectPath, resolveLocalMediaPathFromStorageRef } from './media-storage-resolver'
import { runAudioExtractProductionWorker } from './audio-extract-production-worker'
import { runKeyframeExtractProductionWorker } from './keyframe-extract-production-worker'
import { runMediaProbeProductionWorker } from './media-probe-production-worker'
import { runMediaProxyProductionWorker } from './media-proxy-production-worker'
import { resolveAnalysisProxyColorDecision } from './media-proxy-policy'
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
import { REEDITPRO_ANALYSIS_PROXY_POLICY } from '../../../src/types/large-media'
import { deriveMediaTaskTimeoutMs } from './media-task-policy'
import { verifyLocalMediaFileAuthority } from './media-file-integrity'

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

  if (input.mode === 'production_blocked') {
    return {
      mode: input.mode,
      status: 'blocked',
      expectedActions,
      artifactRecords: [],
      skipReasons: [{
        code: 'production_execution_blocked',
        message: 'Milestone 6 media foundation real execution is local/dev only until a future deployment milestone approves production runtime.',
      }],
      warnings: ['No FFmpeg/FFprobe command was executed.'],
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
  if (!outputRoot) {
    throw new Error('local_dev media foundation requires outputRoot.')
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
  const sourceAuthorityBefore = await verifyExactSourceAuthorityIfRequired(
    input,
    resolvedSource.localFilePath,
  )

  const ffprobeBin = input.ffprobeBin ?? 'ffprobe'
  const ffmpegBin = input.ffmpegBin ?? 'ffmpeg'
  const probeTimeoutMs = input.timeoutMs ?? deriveMediaTaskTimeoutMs({
    task: 'probe',
    sourceSizeBytes: input.source.sizeBytes,
  })
  const summaries: MediaFoundationArtifactSummary[] = []
  const probe = expectedActions.includes('probe')
    ? await runMediaProbeProductionWorker({
      localFilePath: resolvedSource.localFilePath,
      ffprobeBin,
      timeoutMs: probeTimeoutMs,
    })
    : undefined

  if (!probe) {
    throw new Error('Milestone 6 local_dev runner requires probe task before artifacts/report assembly.')
  }

  const timeoutFor = (task: MediaFoundationTask) => input.timeoutMs ?? deriveMediaTaskTimeoutMs({
    task,
    probe,
    sourceSizeBytes: input.source.sizeBytes,
  })

  const proxy = expectedActions.includes('create_proxy')
    ? await runProxyTask(input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutFor('create_proxy'), summaries, probe)
    : undefined
  const audio = expectedActions.includes('extract_audio')
    ? await runAudioTask(input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutFor('extract_audio'), probe.audioStreams.length > 0, summaries)
    : undefined
  const keyframes = expectedActions.includes('extract_keyframes')
    ? await runFrameTask('keyframes', input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutFor('extract_keyframes'), summaries)
    : undefined
  const representativeFrames = expectedActions.includes('extract_representative_frames')
    ? await runFrameTask('representative', input, resolvedSource.localFilePath, outputRoot, ffmpegBin, timeoutFor('extract_representative_frames'), summaries, probe.durationSeconds)
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

  const sourceAuthorityEvidence = sourceAuthorityBefore
    ? await verifySourceMasterPreserved(input, resolvedSource.localFilePath, sourceAuthorityBefore)
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
    ...(sourceAuthorityEvidence ? { sourceAuthorityEvidence } : {}),
    artifactRecords,
    mediaAnalysisReport,
    skipReasons: [
      ...(proxy?.skipReason ? [proxy.skipReason] : []),
      ...(audio?.skipReason ? [audio.skipReason] : []),
      ...(keyframes?.skipReason ? [keyframes.skipReason] : []),
      ...(representativeFrames?.skipReason ? [representativeFrames.skipReason] : []),
    ],
    warnings: [
      ...(proxy?.colorAssumptionWarning ? [proxy.colorAssumptionWarning] : []),
      'Milestone 6 did not run transcript, scene intelligence, OpenCV visual analysis, color grading, OCR, masks, enhancement, or final render.',
    ],
  }
}

function validateRunnerInput(input: MediaFoundationRunnerInput): void {
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
  if (input.requireExactSourceAuthority) {
    if (
      input.source.authorityRole !== 'immutable_source_master' ||
      !Number.isSafeInteger(input.source.sizeBytes) ||
      Number(input.source.sizeBytes) <= 0 ||
      !/^[a-f0-9]{64}$/.test(input.source.checksumSha256 ?? '')
    ) {
      throw new Error('Exact media foundation execution requires immutable source-master size and SHA-256 authority.')
    }
    if (input.source.generation && !input.source.etag || input.source.etag && !input.source.generation) {
      throw new Error('Exact generation-bound source authority requires generation and ETag together.')
    }
  }
}

async function runProxyTask(
  input: MediaFoundationRunnerInput,
  sourceLocalPath: string,
  outputRoot: string,
  ffmpegBin: string,
  timeoutMs: number,
  summaries: MediaFoundationArtifactSummary[],
  probe: NonNullable<MediaFoundationResult['probe']>,
): Promise<MediaProxyResult> {
  const colorDecision = resolveAnalysisProxyColorDecision(probe.videoStreams[0])
  if (colorDecision.status !== 'ready') {
    return {
      status: 'skipped',
      ...fitProxyDimensions(probe.width, probe.height, probe.rotation),
      durationSeconds: probe.durationSeconds,
      profileId: colorDecision.profileId,
      sourceDynamicRange: colorDecision.sourceDynamicRange,
      outputColorSpace: colorDecision.outputColorSpace,
      originalMasterPreserved: true,
      skipReason: {
        code: colorDecision.reasonCode,
        message: colorDecision.message,
        tool: 'ffmpeg',
      },
    }
  }
  const outputLocalPath = path.join(outputRoot, 'proxy', `${input.mediaAssetId}-proxy.mp4`)
  const artifact = await runMediaProxyProductionWorker({
    sourceLocalPath,
    outputLocalPath,
    safeOutputRoot: outputRoot,
    ffmpegBin,
    timeoutMs,
    targetMaxWidth: REEDITPRO_ANALYSIS_PROXY_POLICY.maxWidth,
    targetMaxHeight: REEDITPRO_ANALYSIS_PROXY_POLICY.maxHeight,
    videoPreset: REEDITPRO_ANALYSIS_PROXY_POLICY.videoPreset,
    videoCrf: REEDITPRO_ANALYSIS_PROXY_POLICY.videoCrf,
    videoMaxBitrate: REEDITPRO_ANALYSIS_PROXY_POLICY.videoMaxBitrate,
    videoBufferSize: REEDITPRO_ANALYSIS_PROXY_POLICY.videoBufferSize,
    audioBitrate: REEDITPRO_ANALYSIS_PROXY_POLICY.audioBitrate,
    keepAudio: true,
    outputColorSpace: REEDITPRO_ANALYSIS_PROXY_POLICY.outputColorSpace,
  })
  const canonical = withCanonicalStoragePath(input, artifact, 'proxy', `${input.mediaAssetId}-proxy.mp4`)
  summaries.push(canonical)
  return {
    status: 'created',
    artifact: canonical,
    ...fitProxyDimensions(probe.width, probe.height, probe.rotation),
    durationSeconds: probe.durationSeconds,
    profileId: colorDecision.profileId,
    sourceDynamicRange: colorDecision.sourceDynamicRange,
    outputColorSpace: colorDecision.outputColorSpace,
    originalMasterPreserved: true,
    colorAssumptionWarning: colorDecision.warning,
  }
}

function fitProxyDimensions(width: number, height: number, rotation: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  const quarterTurn = Math.abs(rotation) % 180 === 90
  const displayWidth = quarterTurn ? height : width
  const displayHeight = quarterTurn ? width : height
  const scale = Math.min(
    1,
    REEDITPRO_ANALYSIS_PROXY_POLICY.maxWidth / displayWidth,
    REEDITPRO_ANALYSIS_PROXY_POLICY.maxHeight / displayHeight,
  )
  return {
    width: makeEven(Math.max(2, Math.round(displayWidth * scale))),
    height: makeEven(Math.max(2, Math.round(displayHeight * scale))),
  }
}

function makeEven(value: number): number {
  return value % 2 === 0 ? value : value - 1
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
  const derivativeRole = artifact.artifactType === 'proxy_video'
    ? 'analysis_proxy'
    : artifact.artifactType === 'extracted_audio'
      ? 'analysis_audio'
      : 'analysis_frame'
  return {
    ...artifact,
    storageObjectPath: buildMediaObjectPath({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      folder,
      filename,
    }),
    sourceStorageObjectId: input.sourceStorageObjectId,
    sourceChecksumSha256: input.source.checksumSha256,
    sourceGeneration: input.source.generation,
    sourceEtag: input.source.etag,
    sourceAuthorityRole: input.source.authorityRole === 'immutable_source_master'
      ? 'immutable_source_master'
      : undefined,
    derivativeRole,
    finalRenderEligible: false,
    immutableSourceMasterPreserved: true,
  }
}

async function verifyExactSourceAuthorityIfRequired(
  input: MediaFoundationRunnerInput,
  localFilePath: string,
): Promise<{ sizeBytes: number; checksumSha256: string } | undefined> {
  if (!input.requireExactSourceAuthority) return undefined
  return verifyLocalMediaFileAuthority({
    localFilePath,
    expectedSizeBytes: Number(input.source.sizeBytes),
    expectedChecksumSha256: input.source.checksumSha256!,
  })
}

async function verifySourceMasterPreserved(
  input: MediaFoundationRunnerInput,
  localFilePath: string,
  before: { sizeBytes: number; checksumSha256: string },
): Promise<NonNullable<MediaFoundationResult['sourceAuthorityEvidence']>> {
  const after = await verifyLocalMediaFileAuthority({
    localFilePath,
    expectedSizeBytes: before.sizeBytes,
    expectedChecksumSha256: before.checksumSha256,
  })
  return {
    sourceStorageObjectId: input.sourceStorageObjectId,
    authorityRole: 'immutable_source_master',
    expectedSizeBytes: after.sizeBytes,
    expectedChecksumSha256: after.checksumSha256,
    generation: input.source.generation,
    etag: input.source.etag,
    verifiedBeforeProcessing: true,
    verifiedAfterProcessing: true,
    immutableSourceMasterPreserved: true,
    analysisDerivativesFinalRenderEligible: false,
  }
}
