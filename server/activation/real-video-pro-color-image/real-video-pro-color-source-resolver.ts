import { realVideoProColorImageConfig } from './real-video-pro-color-image-policy'
import type { RealVideoProColorImageSourceSummary } from './real-video-pro-color-image-types'

export function buildRealVideoProColorSourceSummary(): RealVideoProColorImageSourceSummary {
  return {
    inputVideoGcsUri: realVideoProColorImageConfig.approvedInputVideoGcsUri,
    sourceRunId: realVideoProColorImageConfig.sourceRunId,
    sourcePhase: 32,
    expectedDurationSeconds: realVideoProColorImageConfig.expectedDurationSeconds,
    knownBaselineColorCorrection: 'eq=brightness=0.025:contrast=1.04:saturation=1.03:gamma=1',
    privateSourceOnly: true,
    arbitraryMediaAllowed: false,
    fullVideoProcessingAllowed: false,
    warnings: [
      'Audio stream presence is validated for source integrity only; audio is not processed in Phase 40C.',
      'The source is the controlled Phase 32 private export only.',
    ],
  }
}

