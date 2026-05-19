import {
  getDefaultMockSFXProviderIntegrationScenario,
  getMockSFXProviderIntegrationScenarioById,
  mockSFXProviderIntegrationScenarios,
  type MockSFXProviderIntegrationScenario,
} from '../mock/mock-sfx-provider-integration-scenarios'
import {
  assertSFXProviderCallAllowed,
  buildSFXProviderRequestFromPromptPlan,
  createSFXProviderResponseSummary,
  generateSFXWithProvider,
  normalizeSFXProviderKey,
  parseSFXProviderResponse,
} from '../providers/sfx'

function missingScenario(id: string): never {
  throw new Error(`Missing SFX provider integration scenario: ${id}`)
}

export function runMockSFXProviderIntegrationFlow(
  scenario: MockSFXProviderIntegrationScenario = getDefaultMockSFXProviderIntegrationScenario(),
) {
  const safetyGate = assertSFXProviderCallAllowed({
    mode: scenario.mode,
    eventPlan: scenario.eventPlan,
    providerRoute: scenario.providerRoute,
    promptPlan: scenario.promptPlan,
    generationRequest: scenario.generationRequest,
    creditReservation: scenario.creditReservation,
    editPlan: scenario.editPlan,
    sourceFootageApproved: scenario.sourceFootageApproved,
  })

  if (!scenario.eventPlan || !scenario.providerRoute || !scenario.promptPlan) {
    return {
      scenario,
      safetyGate,
      providerResult: {
        ok: false,
        error: {
          code: 'SFX_PROVIDER_SCENARIO_INCOMPLETE',
          message: 'Mock SFX provider scenario is missing an event plan, provider route, or prompt plan.',
        },
      },
      warnings: ['Scenario cannot build an SFX provider request.'],
      nextStep: 'fix_provider_gate' as const,
    }
  }

  const providerRequest = buildSFXProviderRequestFromPromptPlan({
    eventPlan: scenario.eventPlan,
    providerRoute: scenario.providerRoute,
    promptPlan: scenario.promptPlan,
    providerKey: normalizeSFXProviderKey(scenario.providerKey ?? scenario.promptPlan.provider),
    outputFormat: scenario.outputFormat,
    metadata: {
      scenarioId: scenario.id,
      matchedLibraryAssetId: scenario.matchedLibraryAssetId,
    },
  })

  if (!safetyGate.ok) {
    return {
      scenario,
      providerRequest,
      safetyGate,
      providerResult: {
        ok: false,
        error: {
          code: safetyGate.code ?? 'SFX_PROVIDER_SAFETY_GATE_FAILED',
          message: safetyGate.message,
        },
        warnings: safetyGate.warnings,
      },
      warnings: safetyGate.warnings,
      nextStep: scenario.expectedNextStep,
    }
  }

  const providerResult = generateSFXWithProvider(providerRequest, { mode: scenario.mode })

  if (!providerResult.ok || !providerResult.response) {
    return {
      scenario,
      providerRequest,
      safetyGate,
      providerResult,
      warnings: providerResult.warnings ?? [],
      nextStep: scenario.expectedNextStep,
    }
  }

  const parsedResponse = parseSFXProviderResponse({
    rawResponse: providerResult.response,
    providerKey: providerResult.response.providerKey,
    providerName: providerResult.response.providerName,
    modelName: providerResult.response.modelName,
    durationSeconds: providerResult.response.durationSeconds,
    outputFormat: providerResult.response.outputFormat,
    mockStoragePath: providerResult.response.mockStoragePath,
    mockOnly: providerResult.response.mockOnly,
  })
  const warnings = [
    ...(providerResult.warnings ?? []),
    ...parsedResponse.warnings,
  ]

  return {
    scenario,
    providerRequest,
    safetyGate,
    providerResult,
    providerResponse: providerResult.response,
    parsedResponse: parsedResponse.response,
    responseSummary: createSFXProviderResponseSummary(providerResult.response),
    warnings,
    nextStep: 'run_sfx_worker_trim_mix_qa' as const,
  }
}

export function runMockMireloProviderFlow() {
  const scenarioIds = [
    'mirelo-mock-soft-premium-transition',
    'mirelo-mock-stroke-motion-draw',
    'mirelo-mock-graphic-design-reveal',
    'mirelo-mock-real-motion-settle',
  ]

  return {
    runs: scenarioIds.map((id) => runMockSFXProviderIntegrationFlow(
      getMockSFXProviderIntegrationScenarioById(id) ?? missingScenario(id),
    )),
    summary: [
      'Mirelo SFX V1.5 is prepared as the future production SFX provider.',
      'All RP-SFX-12 runs use deterministic mock responses and mock:// storage paths.',
    ],
    nextStep: 'run_sfx_worker_trim_mix_qa' as const,
  }
}

export function runMockMMAudioProviderFlow() {
  const scenarioIds = [
    'mmaudio-mock-transition-draft',
    'mmaudio-mock-ambient-bridge',
  ]

  return {
    runs: scenarioIds.map((id) => runMockSFXProviderIntegrationFlow(
      getMockSFXProviderIntegrationScenarioById(id) ?? missingScenario(id),
    )),
    summary: [
      'MMAudio V is prepared as the future draft/basic/pro fallback.',
      'Mock MMAudio prompts remain short and video-conditioned.',
    ],
    nextStep: 'run_sfx_worker_trim_mix_qa' as const,
  }
}

export function runMockInternalLibraryProviderFlow() {
  const scenarioIds = [
    'internal-library-match-found',
    'internal-library-no-match-fallback-needed',
  ]

  return {
    runs: scenarioIds.map((id) => runMockSFXProviderIntegrationFlow(
      getMockSFXProviderIntegrationScenarioById(id) ?? missingScenario(id),
    )),
    summary: [
      'Internal library routing can use an approved match without provider generation.',
      'No-match scenarios require an explicit fallback route before generation.',
    ],
    nextStep: 'run_sfx_worker_trim_mix_qa' as const,
  }
}

export function runDisabledSFXProviderFlow() {
  const scenario = getMockSFXProviderIntegrationScenarioById('provider-mode-disabled') ??
    missingScenario('provider-mode-disabled')
  return runMockSFXProviderIntegrationFlow(scenario)
}

export function runRealModeBlockedSFXProviderFlow() {
  const scenario = getMockSFXProviderIntegrationScenarioById('real-mode-blocked-without-runtime') ??
    missingScenario('real-mode-blocked-without-runtime')
  return runMockSFXProviderIntegrationFlow(scenario)
}

export function runNoSFXProviderBlockedFlow() {
  const scenario = getMockSFXProviderIntegrationScenarioById('no-sfx-provider-route-blocked') ??
    missingScenario('no-sfx-provider-route-blocked')
  return runMockSFXProviderIntegrationFlow(scenario)
}

export function runLakeComoSFXProviderFlow() {
  const scenario = getMockSFXProviderIntegrationScenarioById('lake-como-provider-flow') ??
    missingScenario('lake-como-provider-flow')
  return runMockSFXProviderIntegrationFlow(scenario)
}

export function runSignatureSFXProviderFlow() {
  const scenario = getMockSFXProviderIntegrationScenarioById('signature-provider-flow') ??
    missingScenario('signature-provider-flow')
  return runMockSFXProviderIntegrationFlow(scenario)
}

export function listMockSFXProviderIntegrationScenarios() {
  return mockSFXProviderIntegrationScenarios
}
