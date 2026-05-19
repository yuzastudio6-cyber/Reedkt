import type {
  RunSFXQAResponse,
  SFXQANextStep,
} from '../contracts/sfx-director-contracts'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import {
  getDefaultMockSFXQAScenario,
  getMockSFXQAMixScenario,
  getMockSFXQAScenarioById,
  mockSFXQAScenarios,
  type MockSFXQAScenario,
} from '../mock/mock-sfx-qa-scenarios'
import { runSFXQA } from '../services/sfx-qa-service'
import { unwrapServiceResult } from '../service-result'
import { runMockSFXMixFlow } from './mock-sfx-mix-orchestrator'

export interface MockSFXQAFlowInput {
  scenario?: MockSFXQAScenario
}

export interface MockSFXQAFlowResponse extends RunSFXQAResponse {
  scenario: MockSFXQAScenario
}

export interface MockSFXQAFlowSetResponse {
  flows: MockSFXQAFlowResponse[]
  nextStep: SFXQANextStep
  warnings: string[]
}

export function runMockSFXQAFlow(
  input: MockSFXQAFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): MockSFXQAFlowResponse {
  const scenario = input.scenario ?? getDefaultMockSFXQAScenario()
  const mixScenario = getMockSFXQAMixScenario(scenario)
  const mixFlow = runMockSFXMixFlow({ scenario: mixScenario }, db)
  const eventPlan = {
    ...mixScenario.eventPlan,
    ...scenario.eventOverrides,
  }
  const generatedAsset = {
    ...mixScenario.generatedAsset,
    sfxEventPlanId: eventPlan.id,
    ...scenario.generatedAssetOverrides,
  }
  const trimPlan = {
    ...mixScenario.trimPlan,
    sfxEventPlanId: eventPlan.id,
    sfxGeneratedAssetId: generatedAsset.id,
    ...scenario.trimOverrides,
  }
  const timingAlignment = {
    ...mixScenario.timingAlignment,
    sfxEventPlanId: eventPlan.id,
    sfxTrimPlanId: trimPlan.id,
    ...scenario.timingOverrides,
  }
  const mixPlan = {
    ...mixFlow.mixPlan,
    sfxEventPlanId: eventPlan.id,
    sfxGeneratedAssetId: generatedAsset.id,
    ...scenario.mixOverrides,
  }

  return {
    scenario,
    ...unwrapServiceResult(runSFXQA(db, {
      sfxEventPlan: eventPlan,
      sfxGeneratedAsset: generatedAsset,
      sfxTrimPlan: trimPlan,
      sfxTimingAlignment: timingAlignment,
      sfxMixPlan: mixPlan,
      speechPresent: mixScenario.speechPresent,
      musicPresent: mixScenario.musicPresent,
      ambienceImportant: mixScenario.ambienceImportant,
      videoTone: mixScenario.videoTone,
      editLevel: eventPlan.editLevel,
      userSFXInstructions: scenario.userSFXInstructions,
      avoidSFXInstructions: scenario.avoidSFXInstructions,
      mockOutputSummary: scenario.mockOutputSummary,
    })),
  }
}

function runScenarioSet(
  ids: string[],
  db: MockDatabase = createMockDatabase(),
): MockSFXQAFlowSetResponse {
  const flows = ids
    .map((id) => getMockSFXQAScenarioById(id))
    .filter((scenario): scenario is MockSFXQAScenario => Boolean(scenario))
    .map((scenario) => runMockSFXQAFlow({ scenario }, db))

  return {
    flows,
    nextStep: flows.some((flow) => flow.nextStep === 'regenerate_sfx')
      ? 'regenerate_sfx'
      : flows.some((flow) => flow.nextStep === 'adjust_sfx')
        ? 'adjust_sfx'
        : flows.some((flow) => flow.nextStep === 'remove_sfx')
          ? 'remove_sfx'
          : 'use_sfx',
    warnings: [
      'RP-SFX-08 is mock QA and decision metadata only; no real audio analysis, provider calls, rendering, uploads, or library promotion occurred.',
    ],
  }
}

export function runMockLakeComoSFXQAFlow(db: MockDatabase = createMockDatabase()): MockSFXQAFlowSetResponse {
  return runScenarioSet([
    'soft-transition-whoosh-passes',
    'luxury-title-hit-too-harsh',
    'montage-beat-accent-passes',
    'ambient-bridge-fights-ambience',
    'library-replacement-soft-whoosh',
  ], db)
}

export function runMockStrokeMotionSFXQAFlow(db: MockDatabase = createMockDatabase()): MockSFXQAFlowSetResponse {
  return runScenarioSet([
    'stroke-motion-line-draw-passes',
    'stroke-motion-line-draw-scratchy',
  ], db)
}

export function runMockRealMotionSFXQAFlow(db: MockDatabase = createMockDatabase()): MockSFXQAFlowSetResponse {
  return runScenarioSet([
    'real-motion-object-settle-passes',
    'real-motion-object-settle-cartoon-bounce',
  ], db)
}

export function runMockFaithTeachingSFXQAFlow(db: MockDatabase = createMockDatabase()): MockSFXQAFlowSetResponse {
  return runScenarioSet([
    'faith-teaching-sfx-removed',
    'simple-talking-head-no-sfx',
  ], db)
}

export function runMockBadSFXQAFlow(db: MockDatabase = createMockDatabase()): MockSFXQAFlowSetResponse {
  return runScenarioSet([
    'transition-too-loud-under-dialogue',
    'transition-hit-lands-late',
    'bad-trim-cuts-off-hit',
    'long-tail-overlaps-speech',
    'provider-output-artifact',
    'fake-footsteps-source-policy-rejected',
  ], db)
}

export function runMockSFXRegenerationDecisionFlow(db: MockDatabase = createMockDatabase()): MockSFXQAFlowSetResponse {
  return runScenarioSet([
    'graphic-card-reveal-cheap-cartoon',
    'real-motion-object-settle-cartoon-bounce',
    'cta-reveal-childish-chime',
    'library-replacement-soft-whoosh',
  ], db)
}

export function listMockSFXQAScenarios(): MockSFXQAScenario[] {
  return mockSFXQAScenarios
}
