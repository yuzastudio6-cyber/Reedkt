import type {
  ProcessGeneratedSFXForLibraryGrowthResponse,
  SFXLibraryGrowthNextStep,
} from '../contracts/sfx-director-contracts'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import {
  getDefaultMockSFXLibraryScenario,
  getMockSFXLibraryQAScenario,
  getMockSFXLibraryScenarioById,
  mockSFXLibraryScenarios,
  type MockSFXLibraryScenario,
} from '../mock/mock-sfx-library-scenarios'
import { getMockSFXQAMixScenario } from '../mock/mock-sfx-qa-scenarios'
import { processGeneratedSFXForLibraryGrowth } from '../services/sfx-library-service'
import { unwrapServiceResult } from '../service-result'
import { runMockSFXMixFlow } from './mock-sfx-mix-orchestrator'
import { runMockSFXQAFlow } from './mock-sfx-qa-orchestrator'

export interface MockSFXLibraryGrowthFlowInput {
  scenario?: MockSFXLibraryScenario
}

export interface MockSFXLibraryGrowthFlowResponse extends ProcessGeneratedSFXForLibraryGrowthResponse {
  scenario: MockSFXLibraryScenario
}

export interface MockSFXLibraryGrowthFlowSetResponse {
  flows: MockSFXLibraryGrowthFlowResponse[]
  nextStep: SFXLibraryGrowthNextStep
  warnings: string[]
}

export function runMockSFXLibraryGrowthFlow(
  input: MockSFXLibraryGrowthFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): MockSFXLibraryGrowthFlowResponse {
  const scenario = input.scenario ?? getDefaultMockSFXLibraryScenario()
  const qaScenario = getMockSFXLibraryQAScenario(scenario)
  const mixScenario = getMockSFXQAMixScenario(qaScenario)
  const mixFlow = runMockSFXMixFlow({ scenario: mixScenario }, db)
  const qaFlow = runMockSFXQAFlow({ scenario: qaScenario }, db)
  const eventPlan = {
    ...mixScenario.eventPlan,
    ...qaScenario.eventOverrides,
  }
  const generatedAsset = {
    ...mixScenario.generatedAsset,
    sfxEventPlanId: eventPlan.id,
    licenseProvenanceId: scenario.providerTermsKnown ? `mock-license-provenance-${scenario.id}` : undefined,
    notes: [
      ...mixScenario.generatedAsset.notes,
      scenario.generatedAssetSummary,
      scenario.provenanceState,
    ],
    ...qaScenario.generatedAssetOverrides,
  }
  const trimPlan = {
    ...mixScenario.trimPlan,
    sfxEventPlanId: eventPlan.id,
    sfxGeneratedAssetId: generatedAsset.id,
    ...qaScenario.trimOverrides,
  }
  const timingAlignment = {
    ...mixScenario.timingAlignment,
    sfxEventPlanId: eventPlan.id,
    sfxTrimPlanId: trimPlan.id,
    ...qaScenario.timingOverrides,
  }
  const mixPlan = {
    ...mixFlow.mixPlan,
    sfxEventPlanId: eventPlan.id,
    sfxGeneratedAssetId: generatedAsset.id,
    ...qaScenario.mixOverrides,
  }

  return {
    scenario,
    ...unwrapServiceResult(processGeneratedSFXForLibraryGrowth(db, {
      workspaceId: 'mock-sfx-library-workspace',
      projectId: eventPlan.projectId,
      sfxEventPlan: eventPlan,
      sfxGeneratedAsset: generatedAsset,
      sfxTrimPlan: trimPlan,
      sfxTimingAlignment: timingAlignment,
      sfxMixPlan: mixPlan,
      sfxQAReport: qaFlow.qaReport,
      sfxQAIssues: qaFlow.qaIssues,
      usageType: scenario.usageType,
      userKept: scenario.userKept,
      userRemoved: scenario.userRemoved,
      providerTermsKnown: scenario.providerTermsKnown,
      commercialAllowed: scenario.commercialAllowed,
      adsAllowed: scenario.adsAllowed,
      clientWorkAllowed: scenario.clientWorkAllowed,
      reuseAcrossUsersAllowed: scenario.reuseAcrossUsersAllowed,
      requiresAttribution: scenario.requiresAttribution,
      privacyContext: scenario.privacyContext,
      provenanceNotes: [scenario.provenanceState, scenario.generatedAssetSummary],
      simulateApprovedLibraryMatch: scenario.simulateApprovedLibraryMatch,
      simulateMockApproval: scenario.simulateMockApproval,
    })),
  }
}

function runScenarioSet(
  ids: string[],
  db: MockDatabase = createMockDatabase(),
): MockSFXLibraryGrowthFlowSetResponse {
  const flows = ids
    .map((id) => getMockSFXLibraryScenarioById(id))
    .filter((scenario): scenario is MockSFXLibraryScenario => Boolean(scenario))
    .map((scenario) => runMockSFXLibraryGrowthFlow({ scenario }, db))

  return {
    flows,
    nextStep: 'show_chat_native_sfx_ui',
    warnings: [
      'RP-SFX-09 is mock library-growth metadata only; no provider call, upload, render, Supabase connection, or real library promotion occurred.',
    ],
  }
}

export function runMockEmptyLibrarySearchFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet(['empty-library-generate-soft-whoosh'], db)
}

export function runMockApprovedLibraryMatchFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet(['approved-library-match-soft-whoosh'], db)
}

export function runMockSFXProjectOnlyFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'real-motion-object-settle-project-only',
    'project-specific-sfx-project-only',
    'ambient-bridge-scene-specific-project-only',
  ], db)
}

export function runMockSFXLibraryCandidateFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'generated-soft-whoosh-candidate',
    'stroke-motion-draw-candidate',
    'graphic-design-reveal-candidate',
    'fitness-impact-candidate-controlled',
  ], db)
}

export function runMockSFXWorkspaceOnlyFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet(['client-branded-workspace-only'], db)
}

export function runMockSFXBlockedReuseFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'user-voice-identity-blocked',
    'qa-failed-blocked',
    'candidate-rejected-private-context',
    'faith-no-sfx-no-candidate',
  ], db)
}

export function runMockSFXTermsReviewFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'provider-terms-unclear-review',
    'lake-como-title-hit-candidate',
  ], db)
}

export function runMockLakeComoSFXLibraryFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'empty-library-generate-soft-whoosh',
    'lake-como-title-hit-candidate',
    'ambient-bridge-scene-specific-project-only',
    'approved-library-match-soft-whoosh',
  ], db)
}

export function listMockSFXLibraryScenarios(): MockSFXLibraryScenario[] {
  return mockSFXLibraryScenarios
}
