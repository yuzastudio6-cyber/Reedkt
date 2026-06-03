import { validateWebSearchUiApiRequest } from '../web-search-ui-api-gating'
import type { WebSearchRegressionScenario } from './web-search-regression-types'

export function buildApiGatingRegressionScenarios(): WebSearchRegressionScenario[] {
  return [
    scenario(
      'internal_api_rejects_blocked_provider',
      { query: 'ReeditPro blocked provider regression', providerMode: 'private_fixture_provider', paidProvidersAllowed: true },
      'api_paid_provider_rejected',
      'Internal API validator rejects blocked provider flags before any backend execution.',
    ),
    scenario(
      'internal_api_rejects_arbitrary_capture',
      { query: 'ReeditPro arbitrary capture regression', providerMode: 'private_fixture_provider', arbitraryUrlCaptureAllowed: true, captureRequested: true },
      'api_arbitrary_capture_rejected',
      'Internal API validator rejects arbitrary capture before any browser or worker path.',
    ),
  ]
}

function scenario(
  scenarioId: WebSearchRegressionScenario['scenarioId'],
  input: Record<string, unknown>,
  failureMode: string,
  safetyImpact: string,
): WebSearchRegressionScenario {
  const validation = validateWebSearchUiApiRequest(input)
  const actualResult = validation.ok ? 'pass' : 'fail_closed'
  return {
    scenarioId,
    category: 'api_ui_gating',
    input: {
      ...input,
      validatorBlockers: validation.blockers,
    },
    expectedResult: 'fail_closed',
    actualResult,
    passed: actualResult === 'fail_closed',
    failureMode,
    safetyImpact,
    artifactsGenerated: false,
    notes: ['Direct Phase 49I validator regression; no server was started and no route executed live work.'],
  }
}
