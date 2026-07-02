import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import { buildTranscriptArtifactRecord, buildTranscriptPayload } from './transcript-artifact-builder'
import { buildWordTimestampArtifactRecord, buildWordTimestampPayload } from './word-timestamp-artifact-builder'
import { normalizeTranscriptSegments } from './transcript-segment-normalizer'
import { runFasterWhisperTranscription } from './faster-whisper-adapter'
import { applySpeechAnalysisToMediaReport, buildSpeechAnalysisUpdate } from './speech-analysis-report-builder'
import type {
  FasterWhisperInput,
  SpeechFoundationResult,
  SpeechFoundationRunnerInput,
  SpeechFoundationTask,
  TranscriptSegment,
} from './speech-worker-types'

const defaultSpeechTasks: SpeechFoundationTask[] = [
  'transcribe',
  'build_transcript_artifact',
  'build_word_timestamp_artifact',
  'detect_fillers',
  'detect_repeated_takes',
  'build_speech_analysis_report',
]

export async function runSpeechFoundation(input: SpeechFoundationRunnerInput): Promise<SpeechFoundationResult> {
  validateSpeechFoundationInput(input)
  const expectedActions = input.tasks ?? defaultSpeechTasks

  if (input.mode === 'production_blocked') {
    return {
      mode: input.mode,
      status: 'blocked',
      expectedActions,
      artifacts: [],
      skipReasons: [{
        code: 'production_transcription_blocked',
        message: 'Milestone 7 blocks production speech transcription until model-weight and deployment approval.',
        tool: 'faster_whisper',
      }],
      warnings: ['No faster-whisper command was executed.'],
    }
  }

  if (input.mode === 'dry_run') {
    const segments = normalizeTranscriptSegments(input.mockSegments ?? mockTranscriptSegments())
    return buildSpeechFoundationResult(input, expectedActions, segments, {
      toolId: 'mock_transcript',
      modelName: 'dry-run-mock',
    }, 'dry_run')
  }

  const fasterWhisperInput = buildFasterWhisperInput(input)
  const transcription = await runFasterWhisperTranscription(fasterWhisperInput)

  if (transcription.status === 'skipped') {
    return {
      mode: input.mode,
      status: 'skipped',
      expectedActions,
      artifacts: [],
      skipReasons: transcription.skipReason ? [transcription.skipReason] : [],
      warnings: ['local_dev transcription skipped without downloading models.'],
    }
  }

  return buildSpeechFoundationResult(
    input,
    expectedActions,
    transcription.segments,
    transcription.modelInfo,
    'completed',
    transcription.language,
    transcription.confidence,
  )
}

function validateSpeechFoundationInput(input: SpeechFoundationRunnerInput): void {
  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }

  if (!input.workspaceId || !input.projectId || !input.mediaAssetId || !input.sourceAudioArtifactId) {
    throw new Error('Speech foundation requires workspaceId, projectId, mediaAssetId, and sourceAudioArtifactId.')
  }
}

function buildFasterWhisperInput(input: SpeechFoundationRunnerInput): FasterWhisperInput {
  return {
    localAudioPath: input.localAudioPath,
    outputJsonPath: input.outputRoot ? `${input.outputRoot}/faster-whisper-output.json` : undefined,
    modelName: input.fasterWhisper?.modelName,
    localModelPath: input.fasterWhisper?.localModelPath,
    device: input.fasterWhisper?.device ?? 'auto',
    computeType: input.fasterWhisper?.computeType,
    language: input.fasterWhisper?.language,
    wordTimestamps: input.fasterWhisper?.wordTimestamps ?? true,
    vadFilter: input.fasterWhisper?.vadFilter ?? true,
    beamSize: input.fasterWhisper?.beamSize,
    timeoutMs: input.timeoutMs ?? input.fasterWhisper?.timeoutMs ?? 60_000,
    fasterWhisperCommand: input.fasterWhisper?.fasterWhisperCommand,
    pythonCommand: input.fasterWhisper?.pythonCommand,
    allowModelDownload: input.fasterWhisper?.allowModelDownload ?? false,
    modelWeightManifestId: input.fasterWhisper?.modelWeightManifestId,
    runMode: input.mode,
  }
}

function buildSpeechFoundationResult(
  input: SpeechFoundationRunnerInput,
  expectedActions: SpeechFoundationTask[],
  segments: TranscriptSegment[],
  modelInfo: { toolId: 'faster_whisper' | 'mock_transcript'; modelName?: string; modelWeightManifestId?: string; localModelReference?: string },
  status: 'dry_run' | 'completed',
  language = 'en',
  confidence?: number,
): SpeechFoundationResult {
  const normalizedSegments = normalizeTranscriptSegments(segments)
  const transcript = buildTranscriptPayload({
    language,
    segments: normalizedSegments,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    modelInfo,
    confidence,
    issues: [{
      code: status === 'dry_run' ? 'speech_dry_run_mock_transcript' : 'speech_local_dev_transcript',
      message: status === 'dry_run'
        ? 'Dry-run transcript was generated from mock segments without faster-whisper.'
        : 'Local-dev transcript was produced from an existing local faster-whisper setup.',
      severity: 'info',
    }],
  })
  const wordTimestamps = buildWordTimestampPayload({
    segments: normalizedSegments,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    modelInfo,
  })
  const transcriptArtifact = buildTranscriptArtifactRecord({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    segments: normalizedSegments,
    modelInfo,
    language,
    confidence: transcript.confidence,
    issues: transcript.issues,
  })
  const wordTimestampArtifact = buildWordTimestampArtifactRecord({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    segments: normalizedSegments,
    modelInfo,
  })
  const speechAnalysis = buildSpeechAnalysisUpdate({
    transcript,
    transcriptArtifactId: transcriptArtifact.id,
    wordTimestampArtifactId: wordTimestampArtifact.id,
  })

  return {
    mode: input.mode,
    status,
    expectedActions,
    transcript,
    wordTimestamps,
    artifacts: [transcriptArtifact, wordTimestampArtifact],
    speechAnalysis,
    updatedMediaAnalysisReport: input.existingMediaAnalysisReport
      ? applySpeechAnalysisToMediaReport(input.existingMediaAnalysisReport, speechAnalysis)
      : undefined,
    skipReasons: [],
    warnings: ['Milestone 7 speech foundation does not perform smart cuts, audio cleanup, caption rendering, provider calls, or production GPU jobs.'],
  }
}

function mockTranscriptSegments(): TranscriptSegment[] {
  return [{
    segmentId: 'mock-segment-1',
    startSeconds: 0,
    endSeconds: 2.2,
    text: 'Hello there, this is a clean dry run transcript.',
    confidence: 0.9,
    words: [
      { word: 'Hello', startSeconds: 0, endSeconds: 0.3, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'there,', startSeconds: 0.3, endSeconds: 0.6, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'this', startSeconds: 0.6, endSeconds: 0.9, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'is', startSeconds: 0.9, endSeconds: 1.1, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'a', startSeconds: 1.1, endSeconds: 1.2, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'clean', startSeconds: 1.2, endSeconds: 1.5, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'dry', startSeconds: 1.5, endSeconds: 1.8, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'run', startSeconds: 1.8, endSeconds: 2, confidence: 0.9, segmentId: 'mock-segment-1' },
      { word: 'transcript.', startSeconds: 2, endSeconds: 2.2, confidence: 0.9, segmentId: 'mock-segment-1' },
    ],
  }]
}
