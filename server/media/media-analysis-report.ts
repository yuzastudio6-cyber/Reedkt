import type {
  AudioStreamSummary,
  FrameSampleArtifact,
  MediaAnalysisReport,
  MediaAnalysisSafetyFlags,
  OptionalAnalysisReadiness,
} from './media-analysis-contracts'
import type { MediaProbeSummary } from './ffprobe'

export function createMediaAnalysisSafetyFlags(): MediaAnalysisSafetyFlags {
  return {
    stagingOnly: true,
    noProductionFlowsRan: true,
    noStripePaymentFlowsRan: true,
    noExternalProviderGenerationCallsRan: true,
    noCustomerMediaUsed: true,
    noBroadE2eSuiteRan: true,
    noQueueDrainRan: true,
    noServiceAccountJsonKeyUsed: true,
    signedUrlsStoredAsCanonicalTruth: false,
  }
}

export function buildMediaAnalysisReport(input: {
  smokeRunId: string
  source: MediaAnalysisReport['source']
  probe: MediaProbeSummary
  thumbnail: FrameSampleArtifact
  audio: AudioStreamSummary
  optionalReadiness: OptionalAnalysisReadiness[]
}): MediaAnalysisReport {
  return {
    smokeRunId: input.smokeRunId,
    source: input.source,
    probe: input.probe,
    thumbnail: input.thumbnail,
    audio: input.audio,
    optionalReadiness: input.optionalReadiness,
    safety: createMediaAnalysisSafetyFlags(),
  }
}
