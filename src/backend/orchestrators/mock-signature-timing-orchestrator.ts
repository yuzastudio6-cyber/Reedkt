import type { CreateStoryTimingPlanResponse } from '../contracts/storytiming-contracts'
import {
  createMockDatabase,
  insertMockRecord,
  type MockDatabase,
} from '../mock/mock-database'
import {
  getDefaultMockSignatureTimingScenario,
  getMockSignatureTimingScenarioById,
  type MockSignatureTimingScenario,
} from '../mock/mock-signature-timing-scenarios'
import { createStoryTimingPlan } from '../services/storytiming-planner-service'
import { createSignatureOverlayConflictSummary } from '../services/storytiming-signature-overlay-conflict-service'
import { createSignatureTimingQASummary } from '../services/storytiming-signature-qa-service'
import { createSignatureSFXSyncSummary } from '../services/storytiming-signature-sfx-sync-service'
import type {
  SignatureTimingPlanRecord,
  StoryTimingQACheckRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'

export interface MockSignatureTimingFlowInput {
  scenario?: MockSignatureTimingScenario
  scenarioId?: string
  persistToMockDatabase?: boolean
}

export interface MockSignatureTimingFlowOutput {
  signatureTimingPlans: SignatureTimingPlanRecord[]
  anchors: TimingAnchorRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  chatSummary: string[]
  nextStep: 'run_full_timing_qa'
  warnings: string[]
  storyTimingPlan: CreateStoryTimingPlanResponse
}

const resolveScenario = (input: MockSignatureTimingFlowInput): MockSignatureTimingScenario => {
  if (input.scenario) return input.scenario
  if (input.scenarioId) return getMockSignatureTimingScenarioById(input.scenarioId) ?? getDefaultMockSignatureTimingScenario()
  return getDefaultMockSignatureTimingScenario()
}

const persistSignatureTimingOutputs = (
  db: MockDatabase,
  output: MockSignatureTimingFlowOutput,
): void => {
  output.signatureTimingPlans.forEach((plan) => insertMockRecord(db, 'signatureTimingPlans', plan))
  output.anchors.forEach((anchor) => insertMockRecord(db, 'timingAnchors', anchor))
  output.events.forEach((event) => insertMockRecord(db, 'timingEvents', event))
  output.dependencies.forEach((dependency) => insertMockRecord(db, 'timingDependencies', dependency))
  output.conflicts.forEach((conflict) => insertMockRecord(db, 'timingConflicts', conflict))
  output.qaChecks.forEach((qaCheck) => insertMockRecord(db, 'storyTimingQAChecks', qaCheck))
}

export function runMockSignatureTimingFlow(
  input: MockSignatureTimingFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): MockSignatureTimingFlowOutput {
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

  const output: MockSignatureTimingFlowOutput = {
    signatureTimingPlans: result.data.signatureTimingPlans,
    anchors: result.data.signatureAnchors,
    events: result.data.signatureEvents,
    dependencies: result.data.signatureDependencies,
    conflicts: result.data.signatureConflicts,
    qaChecks: result.data.signatureQAChecks,
    chatSummary: [
      ...result.data.chatSummary.filter((line) => line.toLowerCase().includes('signature')),
      createSignatureSFXSyncSummary(result.data.signatureDependencies, result.data.signatureConflicts),
      createSignatureOverlayConflictSummary(result.data.signatureConflicts),
      createSignatureTimingQASummary(result.data.signatureQAChecks),
      'Signature timing flow is mock-only; no provider calls, media processing, rendering, migrations, or remote persistence occurred.',
    ],
    nextStep: 'run_full_timing_qa',
    warnings: result.data.warnings,
    storyTimingPlan: result.data,
  }

  if (input.persistToMockDatabase) {
    persistSignatureTimingOutputs(db, output)
  }

  return output
}

export function runMockStrokeMotionTimingFlow(): MockSignatureTimingFlowOutput {
  return runMockSignatureTimingFlow({ scenarioId: 'stroke_motion_story_beat_sync' })
}

export function runMockGraphicDesignTimingFlow(): MockSignatureTimingFlowOutput {
  return runMockSignatureTimingFlow({ scenarioId: 'graphic_card_reveal_after_concept' })
}

export function runMockRealMotionTimingFlow(): MockSignatureTimingFlowOutput {
  return runMockSignatureTimingFlow({ scenarioId: 'real_motion_object_settles_key_phrase' })
}

export function runMockSignatureOverlayConflictFlow(): MockSignatureTimingFlowOutput {
  return runMockSignatureTimingFlow({ scenarioId: 'too_many_overlays_same_moment_conflict' })
}

export function runMockSignatureSFXSyncFlow(): MockSignatureTimingFlowOutput {
  return runMockSignatureTimingFlow({ scenarioId: 'stroke_motion_line_draw_sfx_sync' })
}

export function runMockFaithSignatureTimingFlow(): MockSignatureTimingFlowOutput {
  return runMockSignatureTimingFlow({ scenarioId: 'faith_restrained_stroke_motion_timing' })
}

export function runMockEducationalSignatureTimingFlow(): MockSignatureTimingFlowOutput {
  return runMockSignatureTimingFlow({ scenarioId: 'educational_visualexplain_timing' })
}
