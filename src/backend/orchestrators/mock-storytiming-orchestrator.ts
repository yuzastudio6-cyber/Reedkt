import type {
  CreateStoryTimingPlanResponse,
} from '../contracts/storytiming-contracts'
import { createStoryTimingPlan } from '../services/storytiming-planner-service'
import {
  createMockDatabase,
  insertMockRecord,
  type MockDatabase,
} from '../mock/mock-database'
import {
  getDefaultMockStoryTimingScenario,
  getMockStoryTimingScenarioById,
  type MockStoryTimingScenario,
} from '../mock/mock-storytiming-scenarios'

export interface MockStoryTimingPlannerFlowInput {
  scenario?: MockStoryTimingScenario
  scenarioId?: string
  persistToMockDatabase?: boolean
}

const resolveScenario = (input: MockStoryTimingPlannerFlowInput): MockStoryTimingScenario => {
  if (input.scenario) {
    return input.scenario
  }

  if (input.scenarioId) {
    return getMockStoryTimingScenarioById(input.scenarioId) ?? getDefaultMockStoryTimingScenario()
  }

  return getDefaultMockStoryTimingScenario()
}

const persistPlanToMockDatabase = (
  db: MockDatabase,
  output: CreateStoryTimingPlanResponse,
): void => {
  insertMockRecord(db, 'masterTimingMaps', output.masterTimingMap)
  output.segments.forEach((segment) => insertMockRecord(db, 'storyTimingSegments', segment))
  output.anchors.forEach((anchor) => insertMockRecord(db, 'timingAnchors', anchor))
  output.events.forEach((event) => insertMockRecord(db, 'timingEvents', event))
  output.dependencies.forEach((dependency) => insertMockRecord(db, 'timingDependencies', dependency))
  output.conflicts.forEach((conflict) => insertMockRecord(db, 'timingConflicts', conflict))
  output.conflictResolutions.forEach((resolution) => insertMockRecord(db, 'timingConflictResolutions', resolution))
  output.qaChecks.forEach((qaCheck) => insertMockRecord(db, 'storyTimingQAChecks', qaCheck))
  insertMockRecord(db, 'renderTimingManifests', output.renderTimingManifest)
}

export function runMockStoryTimingPlannerFlow(
  input: MockStoryTimingPlannerFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): CreateStoryTimingPlanResponse {
  const scenario = resolveScenario(input)
  const result = createStoryTimingPlan({
    workspaceId: 'mock-workspace-storytiming',
    projectId: scenario.projectId,
    editPlanId: scenario.editPlanId,
    chatSessionId: scenario.chatSessionId,
    targetPlatform: scenario.targetPlatform,
    editComplexity: scenario.editComplexity,
    userTimingInstructions: scenario.userTimingInstructions,
    avoidTimingInstructions: scenario.avoidTimingInstructions,
    sources: scenario.inputTimingSources,
  })

  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }

  if (input.persistToMockDatabase) {
    persistPlanToMockDatabase(db, result.data)
  }

  return result.data
}

export function runMockLakeComoStoryTimingFlow(): CreateStoryTimingPlanResponse {
  return runMockStoryTimingPlannerFlow({ scenarioId: 'lake_como_lifestyle_timing' })
}

export function runMockFaithTeachingStoryTimingFlow(): CreateStoryTimingPlanResponse {
  return runMockStoryTimingPlannerFlow({ scenarioId: 'faith_bible_teaching_timing' })
}

export function runMockSignatureStoryTimingFlow(): CreateStoryTimingPlanResponse {
  return runMockStoryTimingPlannerFlow({ scenarioId: 'signature_storytiming_full_stack' })
}

export function runMockTimingConflictFlow(): CreateStoryTimingPlanResponse {
  return runMockStoryTimingPlannerFlow({ scenarioId: 'render_manifest_blocked_case' })
}

export function runMockRenderTimingManifestFlow(): CreateStoryTimingPlanResponse {
  return runMockStoryTimingPlannerFlow({ scenarioId: 'render_manifest_ready_case' })
}
