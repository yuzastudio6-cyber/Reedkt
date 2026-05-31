import { proColorImageFeatureE2EConfig } from './pro-color-image-feature-e2e-policy'
import type { ProColorImageFeatureE2ESourceSummary } from './pro-color-image-feature-e2e-types'

export function buildProColorImageFeatureSourceSummary(): ProColorImageFeatureE2ESourceSummary {
  return {
    inputVideoGcsUri: proColorImageFeatureE2EConfig.approvedInputVideoGcsUri,
    sourceRunId: proColorImageFeatureE2EConfig.sourceRunId,
    sourcePhase: 32,
    expectedDurationSeconds: proColorImageFeatureE2EConfig.expectedDurationSeconds,
    phase40CRunId: proColorImageFeatureE2EConfig.phase40CRunId,
    phase40CReportUri: proColorImageFeatureE2EConfig.phase40CReportUri,
    privateSourceOnly: true,
    arbitraryMediaAllowed: false,
    fullVideoProcessingAllowed: false,
    warnings: [
      'Audio stream presence is validated for source integrity only; audio is not processed in Phase 40D.',
      'The source is the controlled Phase 32 private export only.',
    ],
  }
}
