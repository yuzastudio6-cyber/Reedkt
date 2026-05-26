import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { AudioAnalysisSummary, AudioFoundationRunnerInput } from './audio-foundation-types'

export function buildAudioAnalysisSummary(input: AudioFoundationRunnerInput): AudioAnalysisSummary {
  const mediaAudio = input.mediaAudioAnalysis ?? input.mediaAnalysisReport?.audioAnalysis
  const mock = input.mockAnalysis ?? {}
  const speechDetected = input.mediaAnalysisReport?.speechAnalysis.speechDetected ??
    (input.transcriptSegments ? input.transcriptSegments.length > 0 : undefined)
  const issues: ProductionToolIssue[] = [
    ...(mediaAudio?.issues ?? []),
    ...(mock.issues ?? []),
  ]

  if (!mediaAudio && !mock.advancedAnalysisRan) {
    issues.push({
      code: 'advanced_audio_analysis_not_run',
      message: 'Milestone 9 is using deterministic placeholder/mock audio analysis only.',
      severity: 'info',
    })
  }

  return {
    durationSeconds: mock.durationSeconds ??
      input.mediaAnalysisReport?.metadata.durationSeconds ??
      durationFromTranscript(input) ??
      0,
    peakDb: mock.peakDb,
    integratedLufs: mock.integratedLufs ?? mediaAudio?.loudness,
    truePeakDb: mock.truePeakDb,
    clippingDetected: mock.clippingDetected ?? mediaAudio?.clippingDetected ?? false,
    silenceSegments: mock.silenceSegments ?? mediaAudio?.silenceSegments ?? [],
    noiseLevel: mock.noiseLevel ?? mediaAudio?.noiseLevel,
    speechPresence: speechDetected === true ? 'present' : speechDetected === false ? 'absent' : 'unknown',
    musicDetected: mock.musicDetected ?? mediaAudio?.musicDetected ?? false,
    musicSpeechOverlap: mock.musicSpeechOverlap ?? mediaAudio?.musicSpeechOverlap ?? false,
    energyCurveArtifactId: mock.energyCurveArtifactId ?? mediaAudio?.energyCurveArtifactId,
    advancedAnalysisRan: mock.advancedAnalysisRan ?? false,
    issues,
  }
}

function durationFromTranscript(input: AudioFoundationRunnerInput): number | undefined {
  return input.transcriptSegments?.at(-1)?.endSeconds ??
    input.captionSegments?.at(-1)?.endSeconds
}
