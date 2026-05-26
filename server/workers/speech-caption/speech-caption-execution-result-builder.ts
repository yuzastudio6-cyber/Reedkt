import { applySpeechAnalysisToMediaReport, buildSpeechAnalysisUpdate } from '../speech/speech-analysis-report-builder'
import type {
  CaptionExecutionResult,
  SpeechCaptionExecutionPipelineInput,
  SpeechCaptionExecutionPipelineResult,
  SpeechExecutionResult,
} from './speech-caption-pipeline-types'

export function buildSpeechCaptionExecutionPipelineResult(input: {
  request: SpeechCaptionExecutionPipelineInput
  speech?: SpeechExecutionResult
  captions?: CaptionExecutionResult
}): SpeechCaptionExecutionPipelineResult {
  const qaResults = [
    ...(input.speech?.qaResults ?? []),
    ...(input.captions?.qaResults ?? []),
  ]
  const skippedReasons = [
    ...(input.speech?.skippedReasons ?? []),
    ...(input.captions?.skippedReasons ?? []),
  ]
  const warnings = [
    ...(input.speech?.warnings ?? []),
    ...(input.captions?.warnings ?? []),
  ]
  const transcriptArtifacts = (input.speech?.artifacts ?? []).filter((artifact) => (
    artifact.artifactType === 'transcript_json' ||
    artifact.artifactType === 'word_timestamps_json'
  ))
  const captionArtifacts = (input.captions?.artifacts ?? []).filter((artifact) => (
    artifact.artifactType === 'caption_segments_json' ||
    artifact.artifactType === 'qa_report' ||
    artifact.artifactType === 'preview_video'
  ))
  const blocksPreview = qaResults.some((gate) => gate.blocksPreview) ||
    input.speech?.status === 'blocked' ||
    input.captions?.status === 'blocked'
  const blocksFinalExport = true
  const speechAnalysis = input.speech?.transcript && transcriptArtifacts.length > 0
    ? buildSpeechAnalysisUpdate({
      transcript: input.speech.transcript,
      transcriptArtifactId: transcriptArtifacts.find((artifact) => artifact.artifactType === 'transcript_json')?.id,
      wordTimestampArtifactId: transcriptArtifacts.find((artifact) => artifact.artifactType === 'word_timestamps_json')?.id,
    })
    : undefined

  return {
    mode: input.request.mode,
    status: resolveStatus(input.speech?.status, input.captions?.status),
    transcriptArtifacts,
    captionArtifacts,
    qaResults,
    modelWeightStatus: input.speech?.modelWeightStatus ?? 'not_required',
    skippedReasons,
    warnings,
    blocksPreview,
    blocksFinalExport,
    transcript: input.speech?.transcript,
    wordTimestamps: input.speech?.wordTimestamps,
    captionSegments: input.captions?.captionSegments ?? [],
    captionFiles: input.captions?.captionFiles ?? [],
    updatedMediaAnalysisReport: input.request.existingMediaAnalysisReport && speechAnalysis
      ? applySpeechAnalysisToMediaReport(input.request.existingMediaAnalysisReport, speechAnalysis)
      : undefined,
  }
}

function resolveStatus(
  speechStatus?: SpeechExecutionResult['status'],
  captionStatus?: CaptionExecutionResult['status'],
): SpeechCaptionExecutionPipelineResult['status'] {
  const statuses = [speechStatus, captionStatus].filter(Boolean)
  if (statuses.includes('blocked')) return 'blocked'
  if (statuses.includes('failed')) return 'failed'
  if (statuses.includes('partial')) return 'partial'
  if (statuses.includes('skipped')) return 'skipped'
  if (statuses.includes('completed')) return 'completed'
  return 'dry_run'
}
