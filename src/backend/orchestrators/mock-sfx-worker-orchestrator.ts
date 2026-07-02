import {
  getDefaultMockSFXWorkerScenario,
  getLakeComoSFXWorkerScenarios,
  getMockSFXWorkerScenarioById,
  getSignatureSFXWorkerScenarios,
  type MockSFXWorkerScenario,
} from '../mock/mock-sfx-worker-scenarios'
import { createMockDatabase } from '../mock/mock-database'
import { runSFXWorkerSkeleton } from '../workers/sfx-worker-skeleton'

type SFXWorkerNextStep =
  | 'use_in_preview'
  | 'reserve_credits'
  | 'approve_plan'
  | 'fix_prompt'
  | 'regenerate'
  | 'remove_sfx'
  | 'library_review'

function nextStepForRun(scenario: MockSFXWorkerScenario, status: 'mock_generated' | 'library_match_used' | 'blocked' | 'failed' | 'completed'): SFXWorkerNextStep {
  if (status === 'blocked') {
    if (scenario.expectedNextStep === 'reserve_credits') return 'reserve_credits'
    if (scenario.expectedNextStep === 'approve_plan') return 'approve_plan'
    if (scenario.expectedNextStep === 'remove_sfx') return 'remove_sfx'
    return 'fix_prompt'
  }

  if (status === 'failed') {
    return scenario.expectedNextStep === 'remove_sfx' ? 'remove_sfx' : 'regenerate'
  }

  return scenario.expectedNextStep
}

export function runMockSFXWorkerFlow(
  scenario: MockSFXWorkerScenario = getDefaultMockSFXWorkerScenario(),
) {
  const db = createMockDatabase()
  const result = runSFXWorkerSkeleton({
    db,
    workerInput: scenario.workerInput,
    records: scenario.records,
  })

  return {
    scenario,
    workerOutput: result.output,
    workerEvents: result.events,
    providerResponse: result.providerResponse,
    generatedSFXAsset: result.generatedSFXAsset,
    generatedAsset: result.generatedAsset,
    waveformAnalysis: result.waveformAnalysis,
    transientDetection: result.transientDetection,
    trimPlan: result.trimPlan,
    timingAlignment: result.timingAlignment,
    mixPlan: result.mixPlan,
    qaReport: result.qaReport,
    usageRecord: result.usageRecord,
    libraryCandidate: result.libraryCandidate,
    librarySearchRecord: result.librarySearchRecord,
    provenanceReview: result.provenanceReview,
    usageLearning: result.usageLearning,
    libraryGrowth: result.libraryGrowth,
    failure: result.failure,
    expectedWorkerResult: scenario.expectedWorkerResult,
    expectedQAResult: scenario.expectedQAResult,
    expectedLibraryDecision: scenario.expectedLibraryDecision,
    nextStep: nextStepForRun(scenario, result.output.status),
    warnings: [
      'Mock SFX worker orchestration only; no Mirelo, MMAudio, Google Cloud, Supabase, storage, or audio processing API is called.',
      ...result.output.warnings,
    ],
  }
}

function runScenarioById(id: string) {
  const scenario = getMockSFXWorkerScenarioById(id)

  if (!scenario) {
    throw new Error(`Missing SFX worker scenario: ${id}`)
  }

  return runMockSFXWorkerFlow(scenario)
}

export function runMockMireloSFXWorkerFlow() {
  const runs = [
    runScenarioById('mirelo-soft-transition-success'),
    runScenarioById('mirelo-stroke-draw-success'),
    runScenarioById('mirelo-graphic-reveal-success'),
    runScenarioById('mirelo-real-motion-settle-success'),
  ]

  return {
    runs,
    summary: [
      'Mirelo production SFX is simulated with mock storage metadata only.',
      'Each run still performs trim, hit alignment, mix planning, QA, usage, and library-growth decisions.',
    ],
    warnings: [
      'No Mirelo request is sent and no audio file is created.',
    ],
    nextStep: 'use_in_preview' as const,
  }
}

export function runMockMMAudioSFXWorkerFlow() {
  const runs = [
    runScenarioById('mmaudio-draft-transition-success'),
    runScenarioById('mmaudio-ambient-bridge-success'),
    runScenarioById('provider-unavailable-fallback-mmaudio'),
  ]

  return {
    runs,
    summary: [
      'MMAudio draft/fallback SFX is simulated with short prompt metadata and mock storage paths.',
      'Provider-unavailable routing falls back to MMAudio only when the mock route explicitly allows it.',
    ],
    warnings: [
      'No MMAudio request is sent and no video-conditioned audio is processed.',
    ],
    nextStep: 'use_in_preview' as const,
  }
}

export function runMockInternalLibrarySFXWorkerFlow() {
  return runScenarioById('internal-library-match-used')
}

export function runMockBlockedSFXWorkerFlow() {
  const runs = [
    runScenarioById('missing-credit-reservation-blocked'),
    runScenarioById('edit-plan-not-approved-blocked'),
    runScenarioById('sfx-decision-avoid-blocked'),
    runScenarioById('sfx-decision-not-needed-blocked'),
    runScenarioById('provider-route-no-sfx-blocked'),
    runScenarioById('prompt-validation-failed-blocked'),
  ]

  return {
    runs,
    summary: [
      'Blocked scenarios stop before mock provider simulation.',
      'The gate protects edit approval, credit approval, credit reservation, prompt safety, and no-SFX decisions.',
    ],
    warnings: [
      'Blocked runs return worker events and failure details only; they do not create generated assets.',
    ],
    nextStep: 'fix_prompt' as const,
  }
}

export function runMockFailedQASFXWorkerFlow() {
  const runs = [
    runScenarioById('qa-too-loud-dialogue-failed'),
    runScenarioById('qa-cartoonish-luxury-title-failed'),
  ]

  return {
    runs,
    summary: [
      'QA-failed scenarios create mock generated metadata, then fail before preview-ready usage.',
      'The worker keeps QA/regeneration information available for future adjustment or regeneration.',
    ],
    warnings: [
      'Failed QA runs do not approve SFX for preview/export use.',
    ],
    nextStep: 'regenerate' as const,
  }
}

export function runMockLakeComoSFXWorkerFlow() {
  const runs = getLakeComoSFXWorkerScenarios().map((scenario) => runMockSFXWorkerFlow(scenario))

  return {
    runs,
    summary: [
      'Lake Como lifestyle SFX uses premium soft edit-layer cues: title, transition, and ambience bridge.',
      'The worker keeps source-footage sounds restrained and routes every generated cue through trim, mix, QA, and library-growth decisions.',
    ],
    warnings: [
      'Lake Como worker flow is mock-only and does not call providers or store real media.',
    ],
    nextStep: 'library_review' as const,
  }
}

export function runMockSignatureSFXWorkerFlow() {
  const runs = getSignatureSFXWorkerScenarios().map((scenario) => runMockSFXWorkerFlow(scenario))

  return {
    runs,
    summary: [
      'Signature SFX worker flow covers Stroke Motion draw/completion, Graphic Design reveal, and Real Motion object settle.',
      'Each cue remains edit-layer based and voice-first.',
    ],
    warnings: [
      'Signature SFX worker output uses mock provider metadata only.',
    ],
    nextStep: 'library_review' as const,
  }
}
