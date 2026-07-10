import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import type {
  AutonomousEditPlanDraft,
  AutonomousEditPlanningAttempt,
  AutonomousEditReferenceEvidence,
  AutonomousEditSourceEvidence,
  CreateAutonomousEditPlanRequest,
} from '../../src/types'
import {
  runQwenAutonomousEditPlanner,
  type QwenAutonomousEditPlannerPrivateEvidence,
} from '../../src/backend/qwen-runtime/qwen-autonomous-edit-planner-service'
import { ApiError } from '../errors/api-error'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import type { ServiceContext } from '../types'
import {
  analyzeEditAudioEvidence,
  analyzeEditColorEvidence,
  analyzeEditVisualRhythmEvidence,
  runMediaAnalysisFoundation,
} from '../workers/media'
import { runSpeechCaptionExecutionPipeline } from '../workers/speech-caption'
import type { TranscriptSegment } from '../workers/speech'
import { getRequiredAuthUserId } from './service-helpers'
import { createUploadService } from './upload-service'
import { createQwenVisualUnderstandingProvider } from './qwen-visual-understanding-provider'

export interface AutonomousVisualUnderstandingResult {
  status: 'completed' | 'blocked'
  summary?: string
  visibleSubjects: string[]
  visibleObjects: string[]
  screenTextRegions: string[]
  compositionRisks: string[]
  brollOpportunities: string[]
  captionObservations: string[]
  styleObservations: string[]
  frameEvidence: Array<{
    frameId: string
    timeSeconds?: number
    summary: string
    safeZones: string[]
    uncertainty: string[]
  }>
  evidenceArtifactIds: string[]
  blockers: string[]
  warnings: string[]
}

export interface AutonomousVisualUnderstandingProvider {
  analyze(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    mediaAssetId: string
    analysisRole: 'source_edit_planning' | 'reference_style_analysis'
    frameArtifacts: Array<{
      artifactId: string
      localFilePath: string
      timeSeconds?: number
      checksum?: string
    }>
  }): Promise<AutonomousVisualUnderstandingResult>
}

export interface CreateAutonomousEditPlanningServiceOptions {
  visualUnderstandingProvider?: AutonomousVisualUnderstandingProvider
  plannerFetchImpl?: typeof fetch
}

const attemptsByIdempotencyKey = new Map<string, AutonomousEditPlanningAttempt>()
const attemptsById = new Map<string, AutonomousEditPlanningAttempt>()
const privateExecutionEvidenceByAttemptId = new Map<string, AutonomousPrivateExecutionEvidence>()

export interface AutonomousPrivateExecutionEvidence {
  attemptId: string
  sourceLocalPath: string
  planningOutputRoot: string
  transcriptSegments: TranscriptSegment[]
  transcriptText?: string
  mediaProbe: NonNullable<Awaited<ReturnType<typeof runMediaAnalysisFoundation>>['probe']>
  mediaAnalysisReport?: NonNullable<Awaited<ReturnType<typeof runMediaAnalysisFoundation>>['mediaAnalysisReport']>
  sourceAudio?: {
    artifactId: string
    localFilePath: string
  }
  representativeFrames: Array<{
    artifactId: string
    localFilePath: string
    timeSeconds?: number
  }>
}

export function getAutonomousEditPlanningAttempt(
  attemptId: string,
): AutonomousEditPlanningAttempt | undefined {
  return attemptsById.get(attemptId)
}

export function getAutonomousPrivateExecutionEvidence(
  attemptId: string,
): AutonomousPrivateExecutionEvidence | undefined {
  return privateExecutionEvidenceByAttemptId.get(attemptId)
}

export function createAutonomousEditPlanningService(
  context: ServiceContext,
  options: CreateAutonomousEditPlanningServiceOptions = {},
) {
  return {
    async createPlan(input: CreateAutonomousEditPlanRequest & {
      projectId: string
      editSessionId: string
      idempotencyKey: string
    }): Promise<AutonomousEditPlanningAttempt> {
      getRequiredAuthUserId(context)
      const replayKey = `${input.workspaceId}:${input.projectId}:${input.editSessionId}:${input.idempotencyKey}`
      const replay = attemptsByIdempotencyKey.get(replayKey)
      if (replay) return replay

      assertLocalInternalPlanningRuntime(context, input)
      const storageRecord = (await createUploadService(context).getStorageObjectRecord(
        input.source.storageObjectRecordId,
        input.workspaceId,
      )).storageObjectRecord
      assertCanonicalSourceMatches(input, storageRecord)

      const attemptId = buildAttemptId(input)
      const outputRoot = resolvePlanningOutputRoot(context.env.localStorageRoot, attemptId)
      await mkdir(outputRoot, { recursive: true })
      const sourceLocalPath = resolveLocalStorageObjectPath(
        context.env.localStorageRoot,
        storageRecord.bucketName,
        storageRecord.objectPath,
      )
      if (!existsSync(sourceLocalPath)) {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Finalized private source media is missing from local storage.', 404)
      }

      const media = await runMediaAnalysisFoundation({
        mode: 'local_dev',
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        mediaAssetId: input.source.mediaAssetId,
        sourceStorageObjectId: input.source.storageObjectRecordId,
        source: {
          sourceStorageObjectId: input.source.storageObjectRecordId,
          storageBucketPurpose: 'source_media',
          storageObjectPath: storageRecord.objectPath,
          localFilePath: sourceLocalPath,
          contentType: storageRecord.mimeType,
          sizeBytes: storageRecord.sizeBytes,
          isPrivate: true,
          sourceOfTruth: true,
        },
        localStorageRoot: context.env.localStorageRoot,
        outputRoot: path.join(outputRoot, 'media'),
        ffprobeBin: context.env.ffprobeBin,
        ffmpegBin: context.env.ffmpegBin,
        timeoutMs: 180_000,
        maxRepresentativeFrameCount: 8,
        tasks: ['probe', 'extract_audio', 'extract_representative_frames', 'build_analysis_report'],
      })
      if (!media.probe) {
        const attempt = failedAttempt({
          attemptId,
          input,
          blocker: 'source_probe_failed',
          warning: 'Source probing did not produce trusted media evidence.',
        })
        storeAttempt(replayKey, attempt)
        return attempt
      }

      const speech = await collectSpeechEvidence({
        input,
        media,
        outputRoot,
      })
      const visualProvider = options.visualUnderstandingProvider ?? createQwenVisualUnderstandingProvider({ env: process.env })
      const measurements = await collectDeterministicMediaEvidence({
        media,
        sourceLocalPath,
        ffmpegBin: context.env.ffmpegBin,
      })
      const visual = await visualProvider.analyze({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        mediaAssetId: input.source.mediaAssetId,
        analysisRole: 'source_edit_planning',
        frameArtifacts: (media.representativeFrames?.artifacts ?? []).flatMap((artifact) =>
          artifact.localFilePath
            ? [{
                artifactId: artifact.artifactId,
                localFilePath: artifact.localFilePath,
                timeSeconds: artifact.timeSeconds,
                checksum: artifact.checksum,
              }]
            : [],
        ),
      })

      const referenceEvidence = input.referenceSource
        ? await collectReferenceEvidence({
            context,
            input,
            outputRoot,
            referenceSource: input.referenceSource,
            visualProvider,
          })
        : undefined

      const sourceEvidence = buildSourceEvidence({ input, media, speech, visual, measurements })
      const privateEvidence: QwenAutonomousEditPlannerPrivateEvidence = {
        transcriptText: speech.transcriptText,
        transcriptSegments: speech.transcriptSegments,
        visualSummary: visual.summary,
        visibleSubjects: visual.visibleSubjects,
        visibleObjects: visual.visibleObjects,
        screenTextRegions: visual.screenTextRegions,
        compositionRisks: visual.compositionRisks,
        brollOpportunities: visual.brollOpportunities,
        captionObservations: visual.captionObservations,
        styleObservations: visual.styleObservations,
        frameEvidence: visual.frameEvidence,
        referenceDna: referenceEvidence?.referenceDna,
      }
      const planner = await runQwenAutonomousEditPlanner({
        request: input,
        sourceEvidence,
        referenceEvidence,
        privateEvidence,
        env: process.env,
        fetchImpl: options.plannerFetchImpl,
      })
      const createdAt = new Date().toISOString()
      const plan = planner.candidate
        ? buildPlanDraft({
            attemptId,
            input,
            sourceEvidence,
            referenceEvidence,
            candidate: planner.candidate,
            planner,
            createdAt,
          })
        : undefined
      if (plan) {
        privateExecutionEvidenceByAttemptId.set(attemptId, {
          attemptId,
          sourceLocalPath,
          planningOutputRoot: outputRoot,
          transcriptSegments: structuredClone(speech.rawTranscriptSegments),
          transcriptText: speech.transcriptText,
          mediaProbe: structuredClone(media.probe),
          mediaAnalysisReport: media.mediaAnalysisReport ? structuredClone(media.mediaAnalysisReport) : undefined,
          sourceAudio: media.audio?.artifact?.localFilePath
            ? { artifactId: media.audio.artifact.artifactId, localFilePath: media.audio.artifact.localFilePath }
            : undefined,
          representativeFrames: (media.representativeFrames?.artifacts ?? []).flatMap((artifact) => artifact.localFilePath
            ? [{ artifactId: artifact.artifactId, localFilePath: artifact.localFilePath, timeSeconds: artifact.timeSeconds }]
            : []),
        })
      }
      const blockers = unique([
        ...sourceEvidence.blockers,
        ...planner.errors,
        ...(plan?.blockers ?? []),
      ])
      const attempt: AutonomousEditPlanningAttempt = {
        attemptId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        status: plan?.status === 'ready_for_approval'
          ? 'completed'
          : planner.status === 'completed'
            ? 'blocked'
            : planner.status.startsWith('blocked_')
              ? 'blocked'
              : 'failed',
        sourceEvidence,
        referenceEvidence,
        plan,
        blockers,
        runtime: {
          mediaAnalysisRun: true,
          transcriptionRun: speech.transcriptionRun,
          visualUnderstandingRun: visual.status === 'completed',
          providerCallMade: planner.providerCallMade,
          qwenCallMade: planner.qwenCallMade,
          deterministicCreativeFallbackUsed: false,
          workerExecutionStarted: false,
          renderStarted: false,
          creditReservedOrSpent: false,
        },
        createdAt,
        warnings: unique([
          ...media.warnings,
          ...speech.warnings,
          ...visual.warnings,
          ...(referenceEvidence?.blockers.length ? ['Attached reference evidence could not be accepted safely.'] : []),
          ...planner.warnings,
          'Planning read private source evidence only. No approved edit worker, render, export, or credit spend started.',
        ]),
      }
      storeAttempt(replayKey, attempt)
      return attempt
    },
  }
}

function storeAttempt(replayKey: string, attempt: AutonomousEditPlanningAttempt): void {
  attemptsByIdempotencyKey.set(replayKey, attempt)
  attemptsById.set(attempt.attemptId, attempt)
}

async function collectSpeechEvidence(input: {
  input: CreateAutonomousEditPlanRequest & { projectId: string; editSessionId: string }
  media: Awaited<ReturnType<typeof runMediaAnalysisFoundation>>
  outputRoot: string
}): Promise<{
  status: 'completed' | 'not_required' | 'blocked'
  transcriptionRun: boolean
  language?: string
  confidence?: number
  transcriptText?: string
  transcriptSegments: QwenAutonomousEditPlannerPrivateEvidence['transcriptSegments']
  rawTranscriptSegments: TranscriptSegment[]
  transcriptArtifactId?: string
  wordTimestampArtifactId?: string
  warnings: string[]
}> {
  if (input.media.probe?.audioStreams.length === 0) {
    return {
      status: 'not_required',
      transcriptionRun: false,
      transcriptSegments: [],
      rawTranscriptSegments: [],
      warnings: ['Source has no audio stream; transcript evidence is not required.'],
    }
  }
  const audio = input.media.audio?.artifact
  if (!audio?.localFilePath) {
    return {
      status: 'blocked',
      transcriptionRun: false,
      transcriptSegments: [],
      rawTranscriptSegments: [],
      warnings: ['Source audio extraction did not produce a private local audio artifact.'],
    }
  }
  const localModelPath = resolveExistingPath([
    process.env.REEDITPRO_FASTER_WHISPER_MODEL_PATH,
    process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH,
    '/private/tmp/reeditpro-approved-local-models/faster-whisper-small',
  ])
  const pythonCommand = resolveExistingPath([
    process.env.REEDITPRO_FASTER_WHISPER_PYTHON_COMMAND,
    process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND,
    '/private/tmp/reeditpro-internal-testing-faster-whisper-runtime/venv/bin/python',
  ])
  if (!localModelPath || !pythonCommand) {
    return {
      status: 'blocked',
      transcriptionRun: false,
      transcriptSegments: [],
      rawTranscriptSegments: [],
      warnings: ['Approved local transcription runtime or model path is unavailable; no model download was attempted.'],
    }
  }
  const speech = await runSpeechCaptionExecutionPipeline({
    mode: 'local_dev',
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    mediaAssetId: input.input.source.mediaAssetId,
    idempotencyKey: `autonomous-plan-speech:${input.input.source.checksumSha256 ?? input.input.source.storageObjectRecordId}`,
    sourceAudioArtifactId: audio.artifactId,
    sourceAudioLocalPath: audio.localFilePath,
    outputDirectory: path.join(input.outputRoot, 'speech'),
    modelWeightManifestId: 'faster_whisper_model',
    modelName: 'faster-whisper-small-approved-local',
    localModelPath,
    language: 'en',
    device: 'cpu',
    computeType: 'int8',
    wordTimestamps: true,
    vadFilter: true,
    beamSize: 5,
    timeoutMs: 180_000,
    enableRealTranscription: true,
    allowModelDownload: false,
    pythonCommand,
    buildSpeech: true,
    buildCaptions: false,
    existingMediaAnalysisReport: input.media.mediaAnalysisReport,
  })
  const transcript = speech.status === 'completed' ? speech.transcript : undefined
  return {
    status: transcript ? 'completed' : 'blocked',
    transcriptionRun: speech.status === 'completed',
    language: transcript?.language,
    confidence: transcript?.confidence,
    transcriptText: transcript?.fullText,
    transcriptSegments: transcript?.segments.map((segment) => ({
      id: segment.segmentId,
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      text: segment.text,
    })) ?? [],
    rawTranscriptSegments: transcript?.segments ?? [],
    transcriptArtifactId: speech.transcriptArtifacts.find((artifact) => artifact.artifactType === 'transcript_json')?.id,
    wordTimestampArtifactId: speech.transcriptArtifacts.find((artifact) => artifact.artifactType === 'word_timestamps_json')?.id,
    warnings: speech.warnings,
  }
}

type DeterministicMediaEvidence = {
  audio: Awaited<ReturnType<typeof analyzeEditAudioEvidence>>
  visualRhythm: Awaited<ReturnType<typeof analyzeEditVisualRhythmEvidence>>
  color: Awaited<ReturnType<typeof analyzeEditColorEvidence>>
}

async function collectDeterministicMediaEvidence(input: {
  media: Awaited<ReturnType<typeof runMediaAnalysisFoundation>>
  sourceLocalPath: string
  ffmpegBin: string
}): Promise<DeterministicMediaEvidence> {
  const probe = input.media.probe
  if (!probe) throw new Error('Deterministic media evidence requires a completed source probe.')
  const sourceAudioLocalPath = input.media.audio?.artifact?.localFilePath
  const [audio, visualRhythm, color] = await Promise.all([
    analyzeEditAudioEvidence({
      sourceAudioLocalPath,
      audioRequired: probe.audioStreams.length > 0,
      ffmpegBin: input.ffmpegBin,
      timeoutMs: 180_000,
    }),
    analyzeEditVisualRhythmEvidence({
      sourceVideoLocalPath: input.sourceLocalPath,
      durationSeconds: probe.durationSeconds,
      ffmpegBin: input.ffmpegBin,
      timeoutMs: 180_000,
    }),
    analyzeEditColorEvidence({
      sourceVideoLocalPath: input.sourceLocalPath,
      ffmpegBin: input.ffmpegBin,
      timeoutMs: 180_000,
    }),
  ])
  return { audio, visualRhythm, color }
}

async function collectReferenceEvidence(input: {
  context: ServiceContext
  input: CreateAutonomousEditPlanRequest & { projectId: string; editSessionId: string }
  outputRoot: string
  referenceSource: CreateAutonomousEditPlanRequest['source']
  visualProvider: AutonomousVisualUnderstandingProvider
}): Promise<AutonomousEditReferenceEvidence> {
  const storageRecord = (await createUploadService(input.context).getStorageObjectRecord(
    input.referenceSource.storageObjectRecordId,
    input.input.workspaceId,
  )).storageObjectRecord
  assertCanonicalMediaMatches({
    projectId: input.input.projectId,
    source: input.referenceSource,
    storageRecord,
    expectedPurpose: 'reference_media',
  })
  const localPath = resolveLocalStorageObjectPath(
    input.context.env.localStorageRoot,
    storageRecord.bucketName,
    storageRecord.objectPath,
  )
  if (!existsSync(localPath)) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Finalized private reference media is missing from local storage.', 404)
  }
  const referenceOutputRoot = path.join(input.outputRoot, 'reference')
  const media = await runMediaAnalysisFoundation({
    mode: 'local_dev',
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    mediaAssetId: input.referenceSource.mediaAssetId,
    sourceStorageObjectId: input.referenceSource.storageObjectRecordId,
    source: {
      sourceStorageObjectId: input.referenceSource.storageObjectRecordId,
      storageBucketPurpose: 'source_media',
      storageObjectPath: storageRecord.objectPath,
      localFilePath: localPath,
      contentType: storageRecord.mimeType,
      sizeBytes: storageRecord.sizeBytes,
      isPrivate: true,
      sourceOfTruth: true,
    },
    localStorageRoot: input.context.env.localStorageRoot,
    outputRoot: referenceOutputRoot,
    ffprobeBin: input.context.env.ffprobeBin,
    ffmpegBin: input.context.env.ffmpegBin,
    timeoutMs: 180_000,
    maxRepresentativeFrameCount: 8,
    tasks: ['probe', 'extract_audio', 'extract_representative_frames', 'build_analysis_report'],
  })
  if (!media.probe) return blockedReferenceEvidence(input.referenceSource, 'reference_probe_failed')
  const measurements = await collectDeterministicMediaEvidence({
    media,
    sourceLocalPath: localPath,
    ffmpegBin: input.context.env.ffmpegBin,
  })
  const visual = await input.visualProvider.analyze({
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    editSessionId: input.input.editSessionId,
    mediaAssetId: input.referenceSource.mediaAssetId,
    analysisRole: 'reference_style_analysis',
    frameArtifacts: (media.representativeFrames?.artifacts ?? []).flatMap((artifact) => artifact.localFilePath
      ? [{ artifactId: artifact.artifactId, localFilePath: artifact.localFilePath, timeSeconds: artifact.timeSeconds, checksum: artifact.checksum }]
      : []),
  })
  const evidenceArtifactIds = unique([
    ...media.artifactRecords.map((artifact) => artifact.id),
    ...visual.evidenceArtifactIds,
  ])
  const blockers = unique([
    ...visual.blockers,
    ...measurements.visualRhythm.blockers,
  ])
  const referenceDna = blockers.length === 0
    ? buildReferenceDna({ source: input.referenceSource, visual, measurements, evidenceArtifactIds })
    : undefined
  return {
    status: referenceDna ? 'completed' : 'blocked',
    source: input.referenceSource,
    probe: {
      durationSeconds: media.probe.durationSeconds,
      width: media.probe.width,
      height: media.probe.height,
      frameRate: media.probe.fps,
      videoStreamCount: media.probe.videoStreams.length,
      audioStreamCount: media.probe.audioStreams.length,
    },
    audio: measurements.audio,
    visualRhythm: measurements.visualRhythm,
    color: measurements.color,
    visualUnderstanding: {
      status: visual.status,
      sampledFrameCount: media.representativeFrames?.artifacts.length ?? 0,
      summary: visual.summary,
      visibleSubjects: visual.visibleSubjects,
      visibleObjects: visual.visibleObjects,
      screenTextRegions: visual.screenTextRegions,
      compositionRisks: visual.compositionRisks,
      brollOpportunities: visual.brollOpportunities,
      captionObservations: visual.captionObservations,
      styleObservations: visual.styleObservations,
      frameEvidence: visual.frameEvidence,
      evidenceArtifactIds: visual.evidenceArtifactIds,
    },
    referenceDna,
    privateArtifactIds: evidenceArtifactIds,
    blockers,
  }
}

function buildReferenceDna(input: {
  source: CreateAutonomousEditPlanRequest['source']
  visual: AutonomousVisualUnderstandingResult
  measurements: DeterministicMediaEvidence
  evidenceArtifactIds: string[]
}): NonNullable<AutonomousEditReferenceEvidence['referenceDna']> {
  const rhythm = input.measurements.visualRhythm
  const audio = input.measurements.audio
  const pacingTraits = [
    `Observed ${rhythm.detectedCutCount} visual cuts at scene threshold ${rhythm.threshold}.`,
    rhythm.averageShotDurationSeconds !== undefined
      ? `Observed ${rhythm.pacingClass} pacing with about ${rhythm.averageShotDurationSeconds.toFixed(2)} seconds per detected shot.`
      : undefined,
  ].filter((value): value is string => Boolean(value))
  const audioTraits = [
    audio.integratedLufs !== undefined ? `Measured reference loudness: ${audio.integratedLufs.toFixed(1)} LUFS.` : undefined,
    audio.silenceRanges.length > 0 ? `Observed ${audio.silenceRanges.length} silence or pause ranges.` : undefined,
  ].filter((value): value is string => Boolean(value))
  return {
    summary: input.visual.summary ?? 'Private reference style evidence was measured from the uploaded reference video.',
    pacingTraits,
    captionTraits: input.visual.captionObservations,
    visualTraits: input.visual.styleObservations,
    audioTraits,
    doNotCopy: [
      'Adapt principles only; do not copy wording, identity, brand marks, creator likeness, or shots.',
      'Use the source video and user request as the story authority.',
      'Do not reproduce a reference layout when it conflicts with source safe zones or readability.',
    ],
    sourceStorageObjectRecordId: input.source.storageObjectRecordId,
    sourceChecksumSha256: input.source.checksumSha256,
    evidenceArtifactIds: input.evidenceArtifactIds,
    derivedBy: 'qwen_live_with_deterministic_measurements',
  }
}

function blockedReferenceEvidence(
  source: CreateAutonomousEditPlanRequest['source'],
  blocker: string,
): AutonomousEditReferenceEvidence {
  const audio = {
    status: 'blocked' as const, clippingDetected: false, noiseCondition: 'not_measured' as const,
    silenceRanges: [], analysisMethods: [], blockers: [blocker],
  }
  return {
    status: 'blocked', source,
    probe: { durationSeconds: 0, width: 0, height: 0, videoStreamCount: 0, audioStreamCount: 0 },
    audio,
    visualRhythm: { status: 'blocked', detectedCutTimesSeconds: [], detectedCutCount: 0, pacingClass: 'unknown', threshold: 0.32, analysisMethods: [], blockers: [blocker] },
    color: { status: 'blocked', sampledFrameCount: 0, exposureCondition: 'not_measured', contrastCondition: 'not_measured', analysisMethods: [], blockers: [blocker] },
    visualUnderstanding: { status: 'blocked', sampledFrameCount: 0, visibleSubjects: [], visibleObjects: [], screenTextRegions: [], compositionRisks: [], brollOpportunities: [], captionObservations: [], styleObservations: [], frameEvidence: [], evidenceArtifactIds: [] },
    privateArtifactIds: [], blockers: [blocker],
  }
}

function buildSourceEvidence(input: {
  input: CreateAutonomousEditPlanRequest
  media: Awaited<ReturnType<typeof runMediaAnalysisFoundation>>
  speech: Awaited<ReturnType<typeof collectSpeechEvidence>>
  visual: AutonomousVisualUnderstandingResult
  measurements: DeterministicMediaEvidence
}): AutonomousEditSourceEvidence {
  const probe = input.media.probe
  if (!probe) throw new Error('Source evidence cannot be built without a media probe.')
  const transcriptWordCount = input.speech.transcriptText?.trim()
    ? input.speech.transcriptText.trim().split(/\s+/).length
    : 0
  const blockers = unique([
    input.speech.status === 'blocked' ? 'source_transcription_required' : undefined,
    ...input.visual.blockers,
  ].filter((value): value is string => Boolean(value)))
  return {
    evidenceVersion: 'autonomous-edit-source-evidence-v1',
    sourceStorageObjectRecordId: input.input.source.storageObjectRecordId,
    sourceChecksumSha256: input.input.source.checksumSha256,
    probe: {
      durationSeconds: probe.durationSeconds,
      width: probe.width,
      height: probe.height,
      frameRate: probe.fps,
      videoStreamCount: probe.videoStreams.length,
      audioStreamCount: probe.audioStreams.length,
    },
    transcript: {
      status: input.speech.status,
      language: input.speech.language,
      confidence: input.speech.confidence,
      segmentCount: input.speech.transcriptSegments.length,
      wordCount: transcriptWordCount,
      transcriptArtifactId: input.speech.transcriptArtifactId,
      wordTimestampArtifactId: input.speech.wordTimestampArtifactId,
    },
    audio: input.measurements.audio,
    visualRhythm: input.measurements.visualRhythm,
    color: input.measurements.color,
    visualUnderstanding: {
      status: input.visual.status,
      sampledFrameCount: input.media.representativeFrames?.artifacts.length ?? 0,
      summary: input.visual.summary,
      visibleSubjects: input.visual.visibleSubjects,
      visibleObjects: input.visual.visibleObjects,
      screenTextRegions: input.visual.screenTextRegions,
      compositionRisks: input.visual.compositionRisks,
      brollOpportunities: input.visual.brollOpportunities,
      captionObservations: input.visual.captionObservations,
      styleObservations: input.visual.styleObservations,
      frameEvidence: input.visual.frameEvidence,
      evidenceArtifactIds: input.visual.evidenceArtifactIds,
    },
    privateArtifactIds: unique([
      ...input.media.artifactRecords.map((artifact) => artifact.id),
      input.speech.transcriptArtifactId,
      input.speech.wordTimestampArtifactId,
      ...input.visual.evidenceArtifactIds,
    ].filter((value): value is string => Boolean(value))),
    blockers,
  }
}

function buildPlanDraft(input: {
  attemptId: string
  input: CreateAutonomousEditPlanRequest & { projectId: string; editSessionId: string }
  sourceEvidence: AutonomousEditSourceEvidence
  referenceEvidence?: AutonomousEditReferenceEvidence
  candidate: NonNullable<Awaited<ReturnType<typeof runQwenAutonomousEditPlanner>>['candidate']>
  planner: Awaited<ReturnType<typeof runQwenAutonomousEditPlanner>>
  createdAt: string
}): AutonomousEditPlanDraft {
  const planId = `autonomous-plan-${input.attemptId.replace(/^autonomous-attempt-/, '')}`
  return {
    version: 'autonomous-edit-plan-v1',
    planId,
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    editSessionId: input.input.editSessionId,
    status: input.candidate.status,
    title: input.candidate.title,
    summary: input.candidate.summary,
    userIntentSummary: input.candidate.userIntentSummary,
    storyStrategy: input.candidate.storyStrategy,
    sourceOrderPolicy: 'preserve_unless_evidence_supports_change',
    outputFrame: input.input.outputFrame,
    segments: input.candidate.segments,
    skillSelections: input.candidate.skillSelections,
    globalQaChecks: input.candidate.globalQaChecks,
    clarificationQuestions: input.candidate.clarificationQuestions,
    blockers: input.candidate.blockers,
    sourceEvidence: input.sourceEvidence,
    referenceEvidence: input.referenceEvidence,
    runtime: {
      plannerSource: 'qwen_live',
      providerCallMade: input.planner.providerCallMade,
      qwenCallMade: input.planner.qwenCallMade,
      mediaAnalysisRun: true,
      transcriptionRun: input.sourceEvidence.transcript.status === 'completed',
      visualUnderstandingRun: input.sourceEvidence.visualUnderstanding.status === 'completed',
      deterministicCreativeFallbackUsed: false,
      rawPromptStored: false,
      workerExecutionStarted: false,
      renderStarted: false,
      creditReservedOrSpent: false,
    },
    approvalRequired: true,
    approved: false,
    createdAt: input.createdAt,
    warnings: input.planner.warnings,
  }
}

function assertLocalInternalPlanningRuntime(
  context: ServiceContext,
  input: CreateAutonomousEditPlanRequest,
): void {
  if (input.analysisMode !== 'local_internal') {
    throw new ApiError('VALIDATION_FAILED', 'Autonomous planning currently accepts local_internal analysis only.', 400)
  }
  if (context.env.mode !== 'local' || context.env.storageMode !== 'local') {
    throw new ApiError(
      'LOCAL_STORAGE_REQUIRED',
      'Autonomous source analysis requires the approved local/internal runtime and private local storage.',
      409,
    )
  }
}

function assertCanonicalSourceMatches(
  input: CreateAutonomousEditPlanRequest & { projectId: string },
  storageRecord: {
    id: string
    projectId?: string
    mediaAssetId?: string
    bucketName: string
    objectPath: string
    mimeType?: string
    sizeBytes?: number
    checksumSha256?: string
    status: string
    objectPurpose?: string
  },
): void {
  assertCanonicalMediaMatches({
    projectId: input.projectId,
    source: input.source,
    storageRecord,
    expectedPurpose: 'source_media',
  })
}

function assertCanonicalMediaMatches(input: {
  projectId: string
  source: CreateAutonomousEditPlanRequest['source']
  expectedPurpose: 'source_media' | 'reference_media'
  storageRecord: {
    id: string
    projectId?: string
    mediaAssetId?: string
    bucketName: string
    objectPath: string
    objectPurpose?: string
    mimeType?: string
    sizeBytes?: number
    checksumSha256?: string
    status: string
  }
}): void {
  const mismatches = [
    input.storageRecord.id === input.source.storageObjectRecordId ? undefined : 'storage object id',
    input.storageRecord.projectId === undefined || input.storageRecord.projectId === input.projectId ? undefined : 'project id',
    input.storageRecord.mediaAssetId === undefined || input.storageRecord.mediaAssetId === input.source.mediaAssetId ? undefined : 'media asset id',
    input.storageRecord.bucketName === input.source.bucketName ? undefined : 'bucket',
    input.storageRecord.objectPath === input.source.objectPath ? undefined : 'object path',
    input.storageRecord.objectPurpose === undefined || input.storageRecord.objectPurpose === input.expectedPurpose ? undefined : 'object purpose',
    input.storageRecord.sizeBytes === undefined || input.storageRecord.sizeBytes === input.source.sizeBytes ? undefined : 'size',
    !input.source.checksumSha256 || !input.storageRecord.checksumSha256 || input.storageRecord.checksumSha256 === input.source.checksumSha256
      ? undefined
      : 'checksum',
    input.storageRecord.status === 'ready' ? undefined : 'storage status',
  ].filter((value): value is string => Boolean(value))
  if (mismatches.length > 0) {
    throw new ApiError('VALIDATION_FAILED', `Source metadata does not match canonical private storage: ${mismatches.join(', ')}.`, 409)
  }
}

function resolvePlanningOutputRoot(localStorageRoot: string, attemptId: string): string {
  const root = path.resolve(localStorageRoot)
  const output = path.resolve(root, 'worker-temp', 'autonomous-planning', attemptId)
  if (!output.startsWith(`${root}${path.sep}`)) {
    throw new ApiError('VALIDATION_FAILED', 'Autonomous planning output path escaped private storage.', 400)
  }
  return output
}

function buildAttemptId(input: CreateAutonomousEditPlanRequest & { projectId: string; editSessionId: string }): string {
  const digest = createHash('sha256').update(JSON.stringify({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    sourceChecksum: input.source.checksumSha256 ?? input.source.storageObjectRecordId,
    referenceChecksum: input.referenceSource?.checksumSha256 ?? input.referenceSource?.storageObjectRecordId,
    prompt: input.prompt,
    briefFingerprint: input.editBrief?.briefFingerprint,
    outputFrame: input.outputFrame,
  })).digest('hex').slice(0, 20)
  return `autonomous-attempt-${digest}`
}

function failedAttempt(input: {
  attemptId: string
  input: CreateAutonomousEditPlanRequest & { projectId: string; editSessionId: string }
  blocker: string
  warning: string
}): AutonomousEditPlanningAttempt {
  const sourceEvidence: AutonomousEditSourceEvidence = {
    evidenceVersion: 'autonomous-edit-source-evidence-v1',
    sourceStorageObjectRecordId: input.input.source.storageObjectRecordId,
    sourceChecksumSha256: input.input.source.checksumSha256,
    probe: {
      durationSeconds: 0,
      width: 0,
      height: 0,
      videoStreamCount: 0,
      audioStreamCount: 0,
    },
    transcript: { status: 'blocked', segmentCount: 0, wordCount: 0 },
    audio: {
      status: 'blocked', clippingDetected: false, noiseCondition: 'not_measured', silenceRanges: [],
      analysisMethods: [], blockers: [input.blocker],
    },
    visualRhythm: {
      status: 'blocked', detectedCutTimesSeconds: [], detectedCutCount: 0, pacingClass: 'unknown',
      threshold: 0.32, analysisMethods: [], blockers: [input.blocker],
    },
    color: {
      status: 'blocked', sampledFrameCount: 0, exposureCondition: 'not_measured', contrastCondition: 'not_measured',
      analysisMethods: [], blockers: [input.blocker],
    },
    visualUnderstanding: {
      status: 'blocked',
      sampledFrameCount: 0,
      visibleSubjects: [],
      visibleObjects: [],
      screenTextRegions: [],
      compositionRisks: [],
      brollOpportunities: [],
      captionObservations: [],
      styleObservations: [],
      frameEvidence: [],
      evidenceArtifactIds: [],
    },
    privateArtifactIds: [],
    blockers: [input.blocker],
  }
  return {
    attemptId: input.attemptId,
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    editSessionId: input.input.editSessionId,
    status: 'failed',
    sourceEvidence,
    blockers: [input.blocker],
    runtime: {
      mediaAnalysisRun: false,
      transcriptionRun: false,
      visualUnderstandingRun: false,
      providerCallMade: false,
      qwenCallMade: false,
      deterministicCreativeFallbackUsed: false,
      workerExecutionStarted: false,
      renderStarted: false,
      creditReservedOrSpent: false,
    },
    createdAt: new Date().toISOString(),
    warnings: [input.warning],
  }
}

function resolveExistingPath(candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && existsSync(value)) return path.resolve(value)
  }
  return undefined
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
