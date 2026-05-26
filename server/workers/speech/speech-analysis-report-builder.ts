import type { MediaAnalysisReport, SpeechAnalysisSummary } from '../../../src/backend/contracts/media-analysis-report'
import type { SpeechAnalysisUpdate, TranscriptArtifactPayload } from './speech-worker-types'
import { detectFillerSegments } from './filler-word-detector'
import { detectRepeatedTakeCandidates } from './repeated-take-detector'

export function buildSpeechAnalysisUpdate(input: {
  transcript: TranscriptArtifactPayload
  transcriptArtifactId?: string
  wordTimestampArtifactId?: string
}): SpeechAnalysisUpdate {
  const fillerSegments = detectFillerSegments(input.transcript.segments)
  const repeatedTakeCandidates = detectRepeatedTakeCandidates(input.transcript.segments)
  return {
    speechDetected: input.transcript.fullText.length > 0,
    transcriptArtifactId: input.transcriptArtifactId,
    wordTimestampArtifactId: input.wordTimestampArtifactId,
    language: input.transcript.language,
    confidence: input.transcript.confidence,
    fillerSegments,
    repeatedTakeCandidates,
    issues: input.transcript.issues,
  }
}

export function applySpeechAnalysisToMediaReport(
  report: MediaAnalysisReport,
  update: SpeechAnalysisUpdate,
): MediaAnalysisReport {
  const speechAnalysis: SpeechAnalysisSummary = {
    speechDetected: update.speechDetected,
    transcriptArtifactId: update.transcriptArtifactId,
    wordTimestampArtifactId: update.wordTimestampArtifactId,
    language: update.language,
    confidence: update.confidence,
    fillerSegments: update.fillerSegments,
    repeatedTakeCandidates: update.repeatedTakeCandidates,
  }

  return {
    ...report,
    updatedAt: new Date().toISOString(),
    speechAnalysis,
    qualityIssues: [
      ...report.qualityIssues,
      ...update.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        severity: issue.severity,
      })),
    ],
    status: report.status === 'completed' ? 'partial' : report.status,
  }
}
