import {
  getDefaultMockLyriaIntegrationScenario,
  getMockLyriaIntegrationScenarioById,
  mockLyriaIntegrationScenarios,
  type MockLyriaIntegrationScenario,
} from '../mock/mock-lyria-integration-scenarios'
import {
  buildLyriaGenerateMusicRequestFromPromptPlan,
  convertLyriaResponseToGeneratedAsset,
  convertLyriaResponseToGeneratedMusicTrack,
  createLyriaResponseSummary,
  generateLyriaMusic,
  parseLyriaResponse,
  assertLyriaGenerationAllowed,
} from '../providers/lyria'
import { analyzeGeneratedMusicTrack } from '../services/music-track-analysis-service'
import { createMusicMixPlan } from '../services/music-mix-planning-service'
import { createMusicQAReport } from '../services/music-qa-service'

function missingScenario(id: string): never {
  throw new Error(`Missing Lyria integration scenario: ${id}`)
}

export function runMockLyriaIntegrationFlow(
  scenario: MockLyriaIntegrationScenario = getDefaultMockLyriaIntegrationScenario(),
) {
  const safetyGate = assertLyriaGenerationAllowed({
    mode: scenario.mode,
    promptPlan: scenario.promptPlan,
    musicCue: scenario.musicCue,
    generationRequest: scenario.generationRequest,
    creditReservation: scenario.creditReservation,
  })

  if (!scenario.promptPlan || !scenario.musicCue) {
    return {
      scenario,
      safetyGate,
      providerResult: {
        ok: false,
        error: {
          code: 'LYRIA_SCENARIO_INCOMPLETE',
          message: 'Mock Lyria integration scenario is missing a prompt plan or music cue.',
        },
      },
      warnings: ['Scenario cannot build a provider request.'],
      nextStep: 'fix_mock_scenario' as const,
    }
  }

  const request = buildLyriaGenerateMusicRequestFromPromptPlan({
    promptPlan: scenario.promptPlan,
    musicCue: scenario.musicCue,
    outputMimeType: scenario.outputMimeType,
  })

  if (!safetyGate.ok) {
    return {
      scenario,
      request,
      safetyGate,
      providerResult: {
        ok: false,
        error: {
          code: safetyGate.code ?? 'LYRIA_SAFETY_GATE_FAILED',
          message: safetyGate.message,
        },
        warnings: safetyGate.warnings,
      },
      warnings: safetyGate.warnings,
      nextStep: scenario.mode === 'disabled' ? 'disabled' as const : 'blocked' as const,
    }
  }

  const providerResult = scenario.rawResponseOverride
    ? {
        ok: true,
        response: parseLyriaResponse({
          rawResponse: scenario.rawResponseOverride,
          model: request.model,
          mockOnly: true,
        }).response,
        warnings: parseLyriaResponse({
          rawResponse: scenario.rawResponseOverride,
          model: request.model,
          mockOnly: true,
        }).warnings,
      }
    : generateLyriaMusic(request, { mode: scenario.mode })

  if (!providerResult.ok || !providerResult.response) {
    return {
      scenario,
      request,
      safetyGate,
      providerResult,
      warnings: providerResult.warnings ?? [],
      nextStep: scenario.mode === 'real' ? 'real_mode_blocked' as const : 'blocked' as const,
    }
  }

  const generatedMusicTrack = convertLyriaResponseToGeneratedMusicTrack({
    response: providerResult.response,
    request,
    promptPlan: scenario.promptPlan,
    musicCue: scenario.musicCue,
    projectId: scenario.generationRequest?.projectId,
  })
  const generatedAsset = convertLyriaResponseToGeneratedAsset({
    response: providerResult.response,
    request,
    generatedMusicTrack,
    projectId: scenario.generationRequest?.projectId ?? 'mock-lyria-integration-project',
    workspaceId: scenario.generationRequest?.workspaceId,
    generationRequestId: scenario.generationRequest?.id,
  })
  const trackAnalysis = analyzeGeneratedMusicTrack({ track: generatedMusicTrack })
  const qaReport = createMusicQAReport({
    track: generatedMusicTrack,
    analysis: trackAnalysis,
    cue: scenario.musicCue,
    userInstructions: 'Use reference style DNA only; do not copy music.',
  })
  const mixPlan = createMusicMixPlan({
    track: generatedMusicTrack,
    analysis: trackAnalysis,
    qaReport,
    cue: scenario.musicCue,
  })

  return {
    scenario,
    request,
    safetyGate,
    providerResult,
    responseSummary: createLyriaResponseSummary(providerResult.response),
    generatedMusicTrack,
    generatedAsset,
    trackAnalysis,
    qaReport,
    mixPlan,
    warnings: providerResult.warnings ?? [],
    nextStep: qaReport.status === 'failed' ? 'regenerate' as const : 'use_in_preview' as const,
  }
}

export function runDisabledLyriaIntegrationFlow() {
  const scenario = getMockLyriaIntegrationScenarioById('disabled-mode') ?? missingScenario('disabled-mode')
  return runMockLyriaIntegrationFlow(scenario)
}

export function runRealModeBlockedWithoutCredentialsFlow() {
  const scenario = getMockLyriaIntegrationScenarioById('real-mode-blocked-without-credentials') ??
    missingScenario('real-mode-blocked-without-credentials')
  return runMockLyriaIntegrationFlow(scenario)
}

export function runLakeComoMockLyriaIntegrationFlow() {
  const scenarioIds = [
    'mock-successful-dialogue-bed',
    'mock-successful-montage-cue',
    'lake-como-multi-cue-mock-generation',
  ]
  const runs = scenarioIds.map((id) => {
    const scenario = getMockLyriaIntegrationScenarioById(id) ?? missingScenario(id)
    return runMockLyriaIntegrationFlow(scenario)
  })

  return {
    runs,
    summary: [
      'Lake Como mock integration uses Lyria Pro request building only.',
      'Responses include mock text/song structure and placeholder audio parts.',
      'Generated tracks/assets are local placeholders and still pass through QA/mix planning.',
    ],
    warnings: [
      'No real audio was generated.',
      'No Google API or storage API was called.',
    ],
    nextStep: 'use_mock_music_assets_after_qa' as const,
  }
}

export function listMockLyriaIntegrationScenarios() {
  return mockLyriaIntegrationScenarios
}
