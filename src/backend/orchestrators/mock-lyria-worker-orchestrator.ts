import {
  getDefaultMockLyriaWorkerScenario,
  getLakeComoLyriaWorkerScenarios,
  getMockLyriaWorkerScenarioById,
  type MockLyriaWorkerScenario,
} from '../mock/mock-lyria-worker-scenarios'
import { runLyriaWorkerSkeleton } from '../workers/lyria-worker-skeleton'

function nextStepForRun(scenario: MockLyriaWorkerScenario, status: 'mock_generated' | 'blocked' | 'failed') {
  if (status === 'blocked') return scenario.expectedNextStep === 'reserve_credits' ? 'reserve_credits' : 'fix_prompt'
  if (status === 'failed') return scenario.expectedNextStep === 'fix_prompt' ? 'fix_prompt' : 'regenerate'
  return scenario.expectedNextStep
}

export function runMockLyriaWorkerFlow(
  scenario: MockLyriaWorkerScenario = getDefaultMockLyriaWorkerScenario(),
) {
  const result = runLyriaWorkerSkeleton({
    workerInput: scenario.workerInput,
    records: scenario.records,
  })

  return {
    scenario,
    workerOutput: result.output,
    workerEvents: result.events,
    generatedMusicTrack: result.generatedMusicTrack,
    generatedAsset: result.generatedAsset,
    trackAnalysis: result.trackAnalysis,
    qaReport: result.qaReport,
    mixPlan: result.mixPlan,
    libraryCandidate: result.libraryCandidate,
    providerResponse: result.providerResponse,
    failure: result.failure,
    expectedWorkerResult: scenario.expectedWorkerResult,
    expectedQAResult: scenario.expectedQAResult,
    nextStep: nextStepForRun(scenario, result.output.status),
    warnings: [
      'Mock worker orchestration only; no Lyria, Google, Supabase, or storage API is called.',
      ...result.output.warnings,
    ],
  }
}

export function runMockLakeComoLyriaWorkerFlow() {
  const runs = getLakeComoLyriaWorkerScenarios().map((scenario) => runMockLyriaWorkerFlow(scenario))

  return {
    runs,
    summary: [
      'Dialogue bed generated as a mock project music asset and passed QA.',
      'Movement montage generated with no-speech vocal texture policy and passed QA.',
      'Outro generated as a project asset with mix adjustment for fade/resolve.',
    ],
    warnings: [
      'Lake Como worker flow uses style DNA only and does not copy any track, melody, lyric, or timing.',
      'Generated assets use mock:// storage paths only.',
    ],
    nextStep: 'use_in_preview' as const,
  }
}

export function runMockBlockedLyriaWorkerFlow() {
  const scenario = getMockLyriaWorkerScenarioById('credits-missing-worker-blocked')

  if (!scenario) {
    throw new Error('Missing blocked Lyria worker scenario.')
  }

  return runMockLyriaWorkerFlow(scenario)
}

export function runMockFailedQALyriaWorkerFlow() {
  const scenario = getMockLyriaWorkerScenarioById('generated-track-qa-unwanted-vocals')

  if (!scenario) {
    throw new Error('Missing QA-failed Lyria worker scenario.')
  }

  return runMockLyriaWorkerFlow(scenario)
}
