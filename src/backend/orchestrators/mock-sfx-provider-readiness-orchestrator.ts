import {
  getDefaultMockSFXProviderReadinessScenario,
  getMockSFXProviderReadinessScenarioById,
  type MockSFXProviderReadinessScenario,
} from '../mock/mock-sfx-provider-readiness-scenarios'
import {
  checkSFXProviderExecutionReadiness,
  createSFXProviderReadinessSummary,
} from '../services/sfx-provider-readiness-service'

export interface MockSFXProviderReadinessFlowResult {
  scenario: MockSFXProviderReadinessScenario
  readiness: ReturnType<typeof checkSFXProviderExecutionReadiness>
  summary: string[]
  expected: {
    readyForRealTransport: boolean
    blockReasons: string[]
    safeNextStep: string
  }
  warnings: string[]
}

export function runMockSFXProviderReadinessFlow(
  scenarioInput?: MockSFXProviderReadinessScenario | string,
): MockSFXProviderReadinessFlowResult {
  const scenario = typeof scenarioInput === 'string'
    ? getMockSFXProviderReadinessScenarioById(scenarioInput) ?? getDefaultMockSFXProviderReadinessScenario()
    : scenarioInput ?? getDefaultMockSFXProviderReadinessScenario()

  const readiness = checkSFXProviderExecutionReadiness(scenario.input)
  const summary = createSFXProviderReadinessSummary(readiness)

  return {
    scenario,
    readiness,
    summary,
    expected: {
      readyForRealTransport: scenario.expectedReadyForRealTransport,
      blockReasons: scenario.expectedBlockReasons,
      safeNextStep: scenario.expectedSafeNextStep,
    },
    warnings: [
      ...readiness.warnings,
      'RP-FIX-15 is readiness-only; no Mirelo or MMAudio transport is implemented or called.',
    ],
  }
}

export function runMockMireloSFXProviderReadinessFlow(): MockSFXProviderReadinessFlowResult {
  return runMockSFXProviderReadinessFlow('real-mirelo-ready-for-future-transport')
}

export function runMockMMAudioSFXProviderReadinessFlow(): MockSFXProviderReadinessFlowResult {
  return runMockSFXProviderReadinessFlow('real-mmaudio-ready-for-future-transport')
}

export function runMockSFXProviderFrontendBlockedFlow(): MockSFXProviderReadinessFlowResult {
  return runMockSFXProviderReadinessFlow('frontend-real-mode-blocked')
}

export function runMockSFXProviderMissingSecretFlow(): MockSFXProviderReadinessFlowResult {
  return runMockSFXProviderReadinessFlow('real-mirelo-missing-secret-ref')
}

export function runMockSFXProviderCreditBlockedFlow(): MockSFXProviderReadinessFlowResult {
  return runMockSFXProviderReadinessFlow('missing-credit-reservation')
}
