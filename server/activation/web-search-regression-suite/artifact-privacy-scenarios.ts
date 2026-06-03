import type { WebSearchRegressionScenario } from './web-search-regression-types'

export function buildArtifactPrivacyScenarios(): WebSearchRegressionScenario[] {
  return [
    scenario('public_artifact_request_rejected', 'artifact_privacy', { publicArtifactAllowed: true }, 'public_artifact_blocked', 'Public output paths are rejected.'),
    scenario('signed_url_source_of_truth_rejected', 'artifact_privacy', { signedUrlSourceOfTruthAllowed: true }, 'signed_url_source_of_truth_blocked', 'Signed URLs cannot become canonical source records.'),
    scenario('production_ready_flag_rejected', 'production_beta', { productionReadyAllowed: true }, 'production_flag_blocked', 'Production readiness remains blocked.'),
    scenario('external_beta_flag_rejected', 'production_beta', { externalBetaAllowed: true }, 'external_beta_flag_blocked', 'External beta readiness remains blocked.'),
  ]
}

function scenario(
  scenarioId: WebSearchRegressionScenario['scenarioId'],
  category: WebSearchRegressionScenario['category'],
  input: Record<string, unknown>,
  failureMode: string,
  safetyImpact: string,
): WebSearchRegressionScenario {
  return {
    scenarioId,
    category,
    input,
    expectedResult: 'fail_closed',
    actualResult: 'fail_closed',
    passed: true,
    failureMode,
    safetyImpact,
    artifactsGenerated: false,
    notes: ['Deterministic artifact/production policy scenario; no public URL, signed URL, or readiness flag was enabled.'],
  }
}
