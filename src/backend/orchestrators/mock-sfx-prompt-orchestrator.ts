import type {
  SFXEventPlanRecord,
  SFXProviderRouteRecord,
} from '../../types'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import {
  getDefaultMockSFXPromptScenario,
  getMockSFXPromptScenarioById,
  type MockSFXPromptScenario,
} from '../mock/mock-sfx-prompt-scenarios'
import {
  createSFXPromptPlan,
  createSFXPromptPlanSummary,
  createSFXPromptPlansForEvents,
} from '../services/sfx-prompt-plan-service'
import { validateSFXPromptPlan } from '../services/sfx-prompt-validation-service'
import { unwrapServiceResult } from '../service-result'
import {
  runMockLakeComoSFXPlanningFlow,
  runMockSignatureSFXPlanningFlow,
} from './mock-sfx-planning-orchestrator'

function runPromptFlowFromRecords(
  db: MockDatabase,
  sfxEventPlans: SFXEventPlanRecord[],
  providerRoutes: SFXProviderRouteRecord[],
) {
  const result = unwrapServiceResult(createSFXPromptPlansForEvents(db, {
    sfxEventPlans,
    providerRoutes,
  }))

  return {
    ...result,
    promptSummary: createSFXPromptPlanSummary(result),
  }
}

export function runMockSFXPromptPlanningFlow(
  input?: {
    sfxEventPlans: SFXEventPlanRecord[]
    providerRoutes: SFXProviderRouteRecord[]
  },
  db: MockDatabase = createMockDatabase(),
) {
  if (input) return runPromptFlowFromRecords(db, input.sfxEventPlans, input.providerRoutes)

  const planningFlow = runMockLakeComoSFXPlanningFlow(db)
  return {
    planningFlow,
    ...runPromptFlowFromRecords(db, planningFlow.sfxEventPlans, planningFlow.providerRoutes),
  }
}

function runSinglePromptScenario(
  scenario: MockSFXPromptScenario,
  db: MockDatabase = createMockDatabase(),
) {
  const result = unwrapServiceResult(createSFXPromptPlan(db, {
    sfxEventPlan: scenario.eventPlan,
    providerRoute: scenario.providerRoute,
  }))
  const validation = result.promptPlan
    ? validateSFXPromptPlan({
        promptPlan: result.promptPlan,
        sfxEventPlan: scenario.eventPlan,
        providerRoute: scenario.providerRoute,
      })
    : undefined

  return {
    scenario,
    result,
    validation,
    sfxPromptPlans: result.promptPlan ? [result.promptPlan] : [],
    validationWarnings: result.warnings,
    nextStep: 'create_sfx_timing_trim_alignment_plan' as const,
    warnings: [
      'Mock prompt flow only; no provider call is made.',
    ],
  }
}

export function runMockMireloPromptFlow(
  db: MockDatabase = createMockDatabase(),
) {
  const scenario = getMockSFXPromptScenarioById('mirelo-soft-premium-transition') ??
    getDefaultMockSFXPromptScenario()
  return runSinglePromptScenario(scenario, db)
}

export function runMockMMAudioPromptFlow(
  db: MockDatabase = createMockDatabase(),
) {
  const scenario = getMockSFXPromptScenarioById('mmaudio-soft-transition-draft') ??
    getDefaultMockSFXPromptScenario()
  return runSinglePromptScenario(scenario, db)
}

export function runMockLibrarySearchPromptFlow(
  db: MockDatabase = createMockDatabase(),
) {
  const scenario = getMockSFXPromptScenarioById('library-soft-whoosh-search') ??
    getDefaultMockSFXPromptScenario()
  return runSinglePromptScenario(scenario, db)
}

export function runMockLakeComoSFXPromptFlow(
  db: MockDatabase = createMockDatabase(),
) {
  const planningFlow = runMockLakeComoSFXPlanningFlow(db)
  return {
    planningFlow,
    ...runPromptFlowFromRecords(db, planningFlow.sfxEventPlans, planningFlow.providerRoutes),
  }
}

export function runMockSignatureSFXPromptFlow(
  db: MockDatabase = createMockDatabase(),
) {
  const planningFlow = runMockSignatureSFXPlanningFlow(db)
  return {
    planningFlow,
    ...runPromptFlowFromRecords(db, planningFlow.sfxEventPlans, planningFlow.providerRoutes),
  }
}
