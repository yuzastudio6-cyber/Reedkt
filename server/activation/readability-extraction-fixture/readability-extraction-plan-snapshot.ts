import { readabilityExtractionArtifactPrefix, readabilityExtractionConfig, readabilityExtractionSafetyFlags } from './readability-extraction-policy'
import type { ApprovedReadabilityExtractionPlanSnapshot } from './readability-extraction-types'

export function buildApprovedReadabilityExtractionPlanSnapshot(runId: string): ApprovedReadabilityExtractionPlanSnapshot {
  const prefix = readabilityExtractionArtifactPrefix(runId)
  return {
    planId: 'phase49d-readability-generated-local-extraction-plan',
    phase49DRunId: runId,
    fixtureMode: readabilityExtractionConfig.fixtureMode,
    approvedPhase49CRunId: readabilityExtractionConfig.approvedPhase49CRunId,
    approvedPhase49CManifestUri: readabilityExtractionConfig.approvedPhase49CManifestUri,
    approvedPhase49CReportUri: readabilityExtractionConfig.approvedPhase49CReportUri,
    domImplementation: readabilityExtractionConfig.domImplementation,
    sanitizer: readabilityExtractionConfig.sanitizer,
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    liveSearchAllowed: false,
    publicWebExtractionAllowed: false,
    browserCaptureAllowed: false,
    paidProviderAllowed: false,
    publicArtifactAllowed: false,
    outputPrefixes: {
      generatedAssets: `gs://${readabilityExtractionConfig.generatedAssetsBucket}/${prefix}/`,
      qaArtifacts: `gs://${readabilityExtractionConfig.qaBucket}/${prefix}/`,
    },
    safety: readabilityExtractionSafetyFlags,
  }
}
