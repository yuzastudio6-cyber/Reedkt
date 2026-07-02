import { buildTranscriptPayload } from './transcript-artifact-builder'
import { buildWordTimestampPayload } from './word-timestamp-artifact-builder'
import { normalizeTranscriptSegments } from './transcript-segment-normalizer'
import { validateSpeechExecutionPolicy } from './faster-whisper-execution-policy'
import { runFasterWhisperExecutionCommand } from './faster-whisper-command-runner'
import {
  buildSpeechExecutionQaResults,
} from './speech-execution-qa-builder'
import {
  buildSpeechExecutionQaArtifact,
  buildSpeechExecutionTranscriptArtifact,
  buildSpeechExecutionWordTimestampArtifact,
} from './speech-execution-artifact-writer'
import type { SpeechExecutionInput, SpeechExecutionResult } from '../speech-caption/speech-caption-pipeline-types'
import type { SpeechModelInfo, TranscriptSegment } from './speech-worker-types'

export async function runSpeechExecution(input: SpeechExecutionInput): Promise<SpeechExecutionResult> {
  const policy = validateSpeechExecutionPolicy(input)
  const modelInfo: SpeechModelInfo = {
    toolId: input.mode === 'dry_run' ? 'mock_transcript' : 'faster_whisper',
    modelName: input.modelName,
    modelWeightManifestId: input.modelWeightManifestId,
    localModelReference: input.localModelPath,
  }

  if (!policy.allowed && (input.mode === 'production_ready' || input.mode === 'production_blocked')) {
    return {
      mode: input.mode,
      status: 'blocked',
      artifacts: [],
      qaResults: [],
      modelWeightStatus: policy.modelWeightStatus,
      skippedReasons: policy.blockingReasons.map((reason) => ({
        code: 'speech_execution_policy_blocked',
        message: reason,
        tool: 'faster_whisper',
      })),
      warnings: policy.warnings,
    }
  }

  if (input.mode === 'container_ready') {
    return {
      mode: input.mode,
      status: 'skipped',
      artifacts: [],
      qaResults: [],
      modelWeightStatus: policy.modelWeightStatus,
      skippedReasons: [{
        code: 'container_ready_command_plan_only',
        message: 'container_ready prepares execution payloads but does not run faster-whisper on the host.',
        tool: 'faster_whisper',
      }],
      warnings: policy.warnings,
    }
  }

  let segments: TranscriptSegment[]
  let language = input.language ?? 'en'
  let confidence = 0.9
  const skippedReasons = []
  const warnings = [...policy.warnings]
  let status: SpeechExecutionResult['status'] = input.mode === 'dry_run' ? 'dry_run' : 'completed'

  if (input.mode === 'dry_run') {
    segments = normalizeTranscriptSegments(input.mockSegments ?? mockSpeechExecutionSegments())
  } else {
    const run = await runFasterWhisperExecutionCommand(input)
    if (run.status === 'completed' && run.parsed) {
      segments = run.parsed.segments
      language = run.parsed.language ?? language
      confidence = run.parsed.confidence
    } else {
      segments = normalizeTranscriptSegments(input.mockSegments ?? mockSpeechExecutionSegments())
      status = run.status === 'failed' ? 'failed' : 'skipped'
      if (run.skipReason) skippedReasons.push(run.skipReason)
      if (run.errorMessage) warnings.push(run.errorMessage)
    }
  }

  const transcript = buildTranscriptPayload({
    language,
    segments,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    modelInfo,
    confidence,
    issues: [{
      code: input.mode === 'dry_run' ? 'speech_execution_dry_run' : 'speech_execution_local_dev',
      message: input.mode === 'dry_run'
        ? 'Dry-run transcript was generated from a mock fixture.'
        : 'Speech execution used local-dev policy; skipped runs do not download models.',
      severity: 'info',
    }],
  })
  const wordTimestamps = buildWordTimestampPayload({
    segments,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    modelInfo,
  })
  const transcriptArtifact = buildSpeechExecutionTranscriptArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    transcript,
    modelInfo,
  })
  const wordTimestampArtifact = buildSpeechExecutionWordTimestampArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    wordTimestamps,
    modelInfo,
  })
  const qaResults = buildSpeechExecutionQaResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    transcriptSegments: segments,
    words: wordTimestamps.words,
    confidence,
  })
  const qaArtifact = buildSpeechExecutionQaArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    qaResults,
  })

  return {
    mode: input.mode,
    status,
    transcript,
    wordTimestamps,
    artifacts: [transcriptArtifact, wordTimestampArtifact, qaArtifact],
    qaResults,
    modelWeightStatus: policy.modelWeightStatus,
    skippedReasons,
    warnings,
  }
}

function mockSpeechExecutionSegments(): TranscriptSegment[] {
  return [{
    segmentId: 'speech-exec-mock-1',
    startSeconds: 0,
    endSeconds: 2.4,
    text: 'Real speech caption execution can dry run safely.',
    confidence: 0.93,
    words: [
      { word: 'Real', startSeconds: 0, endSeconds: 0.28, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
      { word: 'speech', startSeconds: 0.28, endSeconds: 0.65, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
      { word: 'caption', startSeconds: 0.65, endSeconds: 1.05, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
      { word: 'execution', startSeconds: 1.05, endSeconds: 1.48, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
      { word: 'can', startSeconds: 1.48, endSeconds: 1.7, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
      { word: 'dry', startSeconds: 1.7, endSeconds: 1.95, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
      { word: 'run', startSeconds: 1.95, endSeconds: 2.15, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
      { word: 'safely.', startSeconds: 2.15, endSeconds: 2.4, confidence: 0.93, segmentId: 'speech-exec-mock-1' },
    ],
  }]
}
