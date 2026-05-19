import type {
  CaptionTimingPlanRecord,
  CutTimingPlanRecord,
  StoryTimingQACheckRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { CreateStoryTimingPlanResponse } from '../contracts/storytiming-contracts'
import {
  createMockDatabase,
  insertMockRecord,
  type MockDatabase,
} from '../mock/mock-database'
import {
  getDefaultMockCaptionCutTimingScenario,
  getMockCaptionCutTimingScenarioById,
  type MockCaptionCutTimingScenario,
} from '../mock/mock-caption-cut-timing-scenarios'
import { createStoryTimingPlan } from '../services/storytiming-planner-service'
import {
  createJCutTimingHint,
  createLCutTimingHint,
  type JCutLCutHint,
} from '../services/storytiming-jcut-lcut-service'

export interface MockCaptionCutTimingFlowInput {
  scenario?: MockCaptionCutTimingScenario
  scenarioId?: string
  persistToMockDatabase?: boolean
}

export interface MockCaptionCutTimingFlowOutput {
  transcriptAnchors: TimingAnchorRecord[]
  captionTimingPlans: CaptionTimingPlanRecord[]
  captionEvents: TimingEventRecord[]
  cutTimingPlans: CutTimingPlanRecord[]
  cutEvents: TimingEventRecord[]
  pauseAnchors: TimingAnchorRecord[]
  jCutLCutHints: JCutLCutHint[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  chatSummary: string[]
  nextStep: 'integrate_music_sfx_timing'
  warnings: string[]
  storyTimingPlan: CreateStoryTimingPlanResponse
}

const resolveScenario = (input: MockCaptionCutTimingFlowInput): MockCaptionCutTimingScenario => {
  if (input.scenario) return input.scenario
  if (input.scenarioId) return getMockCaptionCutTimingScenarioById(input.scenarioId) ?? getDefaultMockCaptionCutTimingScenario()
  return getDefaultMockCaptionCutTimingScenario()
}

const createJCutLCutHints = (
  scenario: MockCaptionCutTimingScenario,
  cutTimingPlans: CutTimingPlanRecord[],
): JCutLCutHint[] => {
  const instructions = scenario.userTimingInstructions.join(' ').toLowerCase()

  return cutTimingPlans.flatMap((plan) => {
    const cutDecision = scenario.inputTimingSources.cutDecisions?.find((candidate) => candidate.id === plan.cutDecisionId)

    if (instructions.includes('l-cut') || plan.intent === 'l_cut') {
      return [createLCutTimingHint(plan, cutDecision)]
    }

    if (instructions.includes('j-cut') || plan.intent === 'j_cut') {
      return [createJCutTimingHint(plan, cutDecision)]
    }

    return []
  })
}

const persistCaptionCutOutputs = (
  db: MockDatabase,
  output: MockCaptionCutTimingFlowOutput,
): void => {
  output.captionTimingPlans.forEach((plan) => insertMockRecord(db, 'captionTimingPlans', plan))
  output.cutTimingPlans.forEach((plan) => insertMockRecord(db, 'cutTimingPlans', plan))
}

export function runMockCaptionCutTimingFlow(
  input: MockCaptionCutTimingFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): MockCaptionCutTimingFlowOutput {
  const scenario = resolveScenario(input)
  const result = createStoryTimingPlan({
    workspaceId: 'mock-workspace-storytiming',
    projectId: scenario.projectId,
    editPlanId: scenario.editPlanId,
    targetPlatform: 'instagram',
    userTimingInstructions: scenario.userTimingInstructions,
    avoidTimingInstructions: scenario.avoidTimingInstructions,
    sources: scenario.inputTimingSources,
  })

  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }

  const jCutLCutHints = createJCutLCutHints(scenario, result.data.cutTimingPlans)
  const output: MockCaptionCutTimingFlowOutput = {
    transcriptAnchors: result.data.transcriptAnchors,
    captionTimingPlans: result.data.captionTimingPlans,
    captionEvents: result.data.captionEvents,
    cutTimingPlans: result.data.cutTimingPlans,
    cutEvents: result.data.cutEvents,
    pauseAnchors: result.data.pauseAnchors,
    jCutLCutHints,
    dependencies: result.data.dependencies,
    conflicts: result.data.conflicts,
    qaChecks: result.data.qaChecks.filter((check) =>
      check.checkType === 'caption_sync' ||
      check.checkType === 'caption_readability_duration' ||
      check.checkType === 'caption_overlay_collision' ||
      check.checkType === 'speech_cut_integrity' ||
      check.checkType === 'emotional_pause_preservation' ||
      check.checkType === 'platform_pacing',
    ),
    chatSummary: [
      `Created ${result.data.captionTimingPlans.length} caption timing plan(s) and ${result.data.cutTimingPlans.length} cut timing plan(s).`,
      `Transcript anchors are mock inferred; no real word alignment has run.`,
      result.data.conflicts.length === 0
        ? 'No caption/cut timing conflicts were detected.'
        : `${result.data.conflicts.length} timing conflict(s) need review before later timing layers.`,
      jCutLCutHints.length === 0
        ? 'No J-cut/L-cut hint was needed.'
        : `${jCutLCutHints.length} J-cut/L-cut hint(s) were prepared for smoother dialogue flow.`,
    ],
    nextStep: 'integrate_music_sfx_timing',
    warnings: result.data.warnings,
    storyTimingPlan: result.data,
  }

  if (input.persistToMockDatabase) {
    persistCaptionCutOutputs(db, output)
  }

  return output
}

export function runMockTalkingHeadCaptionCutFlow(): MockCaptionCutTimingFlowOutput {
  return runMockCaptionCutTimingFlow({ scenarioId: 'talking_head_clean_edit_captions_cuts' })
}

export function runMockFaithTeachingCaptionCutFlow(): MockCaptionCutTimingFlowOutput {
  return runMockCaptionCutTimingFlow({ scenarioId: 'faith_teaching_emotional_pause' })
}

export function runMockSocialShortCaptionCutFlow(): MockCaptionCutTimingFlowOutput {
  return runMockCaptionCutTimingFlow({ scenarioId: 'social_short_fast_captions' })
}

export function runMockCaptionConflictFlow(): MockCaptionCutTimingFlowOutput {
  return runMockCaptionCutTimingFlow({ scenarioId: 'caption_overlaps_graphic_overlay' })
}

export function runMockEmotionalPauseConflictFlow(): MockCaptionCutTimingFlowOutput {
  return runMockCaptionCutTimingFlow({ scenarioId: 'emotional_pause_removed_incorrectly' })
}
