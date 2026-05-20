import type {
  FullStoryTimingQANextStep,
  RunFullStoryTimingQAResponse,
} from '../contracts/storytiming-contracts'
import {
  createMockDatabase,
  insertMockRecord,
  type MockDatabase,
} from '../mock/mock-database'
import {
  getDefaultMockTimingQAScenario,
  getMockTimingQAScenarioById,
  type MockTimingQAScenario,
} from '../mock/mock-timing-qa-scenarios'
import { runFullStoryTimingQA } from '../services/storytiming-full-qa-service'
import type {
  StoryTimingAdjustmentRecommendationRecord,
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  StoryTimingReadinessDecision,
  TimingConflictRecord,
} from '../../types/storytiming'

export interface MockTimingQAFlowInput {
  scenario?: MockTimingQAScenario
  scenarioId?: string
  persistToMockDatabase?: boolean
}

export interface MockTimingQAFlowOutput {
  qaReport: StoryTimingQAReportRecord
  qaChecks: StoryTimingQACheckRecord[]
  conflicts: TimingConflictRecord[]
  adjustmentRecommendations: StoryTimingAdjustmentRecommendationRecord[]
  readinessDecision: StoryTimingReadinessDecision
  chatSummary: string[]
  nextStep: FullStoryTimingQANextStep
  warnings: string[]
  storyTimingQA: RunFullStoryTimingQAResponse
}

const resolveScenario = (input: MockTimingQAFlowInput): MockTimingQAScenario => {
  if (input.scenario) return input.scenario
  if (input.scenarioId) return getMockTimingQAScenarioById(input.scenarioId) ?? getDefaultMockTimingQAScenario()
  return getDefaultMockTimingQAScenario()
}

const persistTimingQAOutputs = (
  db: MockDatabase,
  scenario: MockTimingQAScenario,
  output: MockTimingQAFlowOutput,
): void => {
  insertMockRecord(db, 'masterTimingMaps', scenario.masterTimingMap)
  scenario.segments.forEach((segment) => insertMockRecord(db, 'storyTimingSegments', segment))
  scenario.anchors.forEach((anchor) => insertMockRecord(db, 'timingAnchors', anchor))
  scenario.events.forEach((event) => insertMockRecord(db, 'timingEvents', event))
  scenario.dependencies.forEach((dependency) => insertMockRecord(db, 'timingDependencies', dependency))
  output.conflicts.forEach((conflict) => insertMockRecord(db, 'timingConflicts', conflict))
  output.qaChecks.forEach((qaCheck) => insertMockRecord(db, 'storyTimingQAChecks', qaCheck))
  output.adjustmentRecommendations.forEach((recommendation) =>
    insertMockRecord(db, 'storyTimingAdjustmentRecommendations', recommendation),
  )
  insertMockRecord(db, 'storyTimingQAReports', output.qaReport)
  if (scenario.renderTimingManifest) {
    insertMockRecord(db, 'renderTimingManifests', scenario.renderTimingManifest)
  }
}

export function runMockFullTimingQAFlow(
  input: MockTimingQAFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): MockTimingQAFlowOutput {
  const scenario = resolveScenario(input)
  const result = runFullStoryTimingQA({
    masterTimingMap: scenario.masterTimingMap,
    segments: scenario.segments,
    anchors: scenario.anchors,
    events: scenario.events,
    dependencies: scenario.dependencies,
    conflicts: scenario.conflicts,
    renderTimingManifest: scenario.renderTimingManifest,
    qaChecks: scenario.qaChecks,
    videoTone: scenario.label,
  })

  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }

  const output: MockTimingQAFlowOutput = {
    qaReport: result.data.qaReport,
    qaChecks: result.data.qaChecks,
    conflicts: result.data.conflicts,
    adjustmentRecommendations: result.data.adjustmentRecommendations,
    readinessDecision: result.data.readinessDecision,
    chatSummary: result.data.chatSummary,
    nextStep: result.data.nextStep,
    warnings: result.data.warnings,
    storyTimingQA: result.data,
  }

  if (input.persistToMockDatabase) {
    persistTimingQAOutputs(db, scenario, output)
  }

  return output
}

export function runMockTimingReadyFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'fully_ready_timing_map' })
}

export function runMockTimingWarningFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'ready_with_minor_caption_warning' })
}

export function runMockTimingBlockedFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'real_motion_blocks_face' })
}

export function runMockTimingUserReviewFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'faith_serious_timing_needs_user_review' })
}

export function runMockLakeComoTimingQAFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'lake_como_lifestyle_ready_with_ambience_warning' })
}

export function runMockFaithTimingQAFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'faith_serious_timing_needs_user_review' })
}

export function runMockSignatureTimingQAFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'signature_timing_blocked_by_overlay_collision' })
}

export function runMockRenderReadinessQAFlow(): MockTimingQAFlowOutput {
  return runMockFullTimingQAFlow({ scenarioId: 'render_manifest_ready' })
}
