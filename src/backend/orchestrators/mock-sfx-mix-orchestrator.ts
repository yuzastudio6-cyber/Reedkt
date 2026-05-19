import type {
  SFXMixPlanRecord,
} from '../../types'
import type { CreateSFXMixFlowResponse } from '../contracts/sfx-director-contracts'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import {
  getDefaultMockSFXMixScenario,
  getMockSFXMixScenarioById,
  mockSFXMixScenarios,
  type MockSFXMixScenario,
} from '../mock/mock-sfx-mix-scenarios'
import {
  createSFXChatReadyMixSummary,
  createSFXMixPlan,
} from '../services/sfx-mix-planning-service'
import { validateSFXMixPlan } from '../services/sfx-mix-validation-service'
import { unwrapServiceResult } from '../service-result'

export interface MockSFXMixFlowInput {
  scenario?: MockSFXMixScenario
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  videoTone?: string
}

function applyBadMixScenarioAdjustments(
  scenario: MockSFXMixScenario,
  mixPlan: SFXMixPlanRecord,
): void {
  if (scenario.expectedValidationIssues.includes('too_loud_for_dialogue')) {
    mixPlan.volumeProfile = 'impact'
    mixPlan.targetGainDb = -4
    mixPlan.duckUnderVoice = false
    mixPlan.sidechainToVoice = false
    mixPlan.fadeInMs = 5
    mixPlan.fadeOutMs = 25
    mixPlan.stereoWidth = 80
    mixPlan.eqProfile = 'tight_social'
    mixPlan.notes.push('Intentional bad mix scenario: impact SFX under dialogue without ducking.')
  }

  if (scenario.expectedValidationIssues.includes('too_quiet_to_notice')) {
    mixPlan.targetGainDb = -40
    mixPlan.notes.push('Intentional bad mix scenario: cue is too quiet to notice.')
  }

  if (scenario.expectedValidationIssues.includes('reverb_mismatch')) {
    mixPlan.reverbProfile = 'dry'
    mixPlan.reverbMatch = 'Dry graphic-style reverb does not match the indoor room.'
    mixPlan.roomMatch = 'No explicit room match provided.'
    mixPlan.notes.push('Intentional bad mix scenario: indoor Real Motion room mismatch.')
  }
}

export function runMockSFXMixFlow(
  input: MockSFXMixFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): CreateSFXMixFlowResponse {
  const scenario = input.scenario ?? getDefaultMockSFXMixScenario()
  const speechPresent = input.speechPresent ?? scenario.speechPresent
  const musicPresent = input.musicPresent ?? scenario.musicPresent
  const ambienceImportant = input.ambienceImportant ?? scenario.ambienceImportant
  const videoTone = input.videoTone ?? scenario.videoTone
  const mixPlan = unwrapServiceResult(createSFXMixPlan(db, {
    sfxEventPlan: scenario.eventPlan,
    sfxGeneratedAsset: scenario.generatedAsset,
    sfxTrimPlan: scenario.trimPlan,
    sfxTimingAlignment: scenario.timingAlignment,
    speechPresent,
    musicPresent,
    ambienceImportant,
    videoTone,
  })).sfxMixPlan

  applyBadMixScenarioAdjustments(scenario, mixPlan)

  const validation = validateSFXMixPlan({
    sfxMixPlan: mixPlan,
    sfxEventPlan: scenario.eventPlan,
    sfxTimingAlignment: scenario.timingAlignment,
    speechPresent,
    musicPresent,
    ambienceImportant,
  }).validation

  return {
    mixPlan,
    validation,
    chatSummary: createSFXChatReadyMixSummary(mixPlan),
    nextStep: 'run_sfx_qa',
    warnings: [
      ...validation.warnings,
      'RP-SFX-07 is mock mix metadata only; RP-SFX-08 handles QA and regeneration decisions.',
    ],
  }
}

function runScenarioSet(
  ids: string[],
  db: MockDatabase = createMockDatabase(),
) {
  const flows = ids
    .map((id) => getMockSFXMixScenarioById(id))
    .filter((scenario): scenario is MockSFXMixScenario => Boolean(scenario))
    .map((scenario) => ({
      scenario,
      ...runMockSFXMixFlow({ scenario }, db),
    }))

  return {
    flows,
    nextStep: 'run_sfx_qa' as const,
    warnings: [
      'Mock mix flow only; no real audio processing, provider calls, rendering, uploads, or QA execution occurred.',
    ],
  }
}

export function runMockLakeComoSFXMixFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'dialogue-transition-whoosh',
    'chapter-title-premium-hit',
    'montage-beat-accent',
    'ambience-important-bridge',
    'cta-reveal-chime',
  ], db)
}

export function runMockStrokeMotionSFXMixFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'stroke-line-draw',
    'stroke-circle-complete',
  ], db)
}

export function runMockRealMotionSFXMixFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'real-motion-object-settle',
  ], db)
}

export function runMockFaithTeachingSFXMixFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'faith-teaching-whisper',
  ], db)
}

export function runMockHighEnergySFXMixFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'fitness-impact-hit',
    'montage-beat-accent',
  ], db)
}

export function runMockBadSFXMixValidationFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'bad-impact-under-dialogue',
    'bad-sfx-too-quiet',
    'bad-indoor-reverb-mismatch',
  ], db)
}

export function listMockSFXMixScenarios(): MockSFXMixScenario[] {
  return mockSFXMixScenarios
}
