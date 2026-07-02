import type {
  MusicBeatGridRecord,
  MusicDuckingTimingPlanRecord,
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
  getDefaultMockMusicSFXTimingScenario,
  getMockMusicSFXTimingScenarioById,
  type MockMusicSFXTimingScenario,
} from '../mock/mock-music-sfx-timing-scenarios'
import { createStoryTimingPlan } from '../services/storytiming-planner-service'
import { createMusicBeatGridSummary } from '../services/storytiming-music-beat-grid-service'
import { createMusicDuckingTimingSummary } from '../services/storytiming-music-ducking-service'
import { createMusicTimingSummary } from '../services/storytiming-music-service'
import { createSFXTimingSummary } from '../services/storytiming-sfx-integration-service'
import { createMusicSFXSyncSummary } from '../services/storytiming-music-sfx-sync-service'
import { createSoundSyncConflictSummary } from '../services/storytiming-soundsync-conflict-service'
import { createSoundSyncTimingQASummary } from '../services/storytiming-soundsync-qa-service'

export interface MockMusicSFXTimingFlowInput {
  scenario?: MockMusicSFXTimingScenario
  scenarioId?: string
  persistToMockDatabase?: boolean
}

export interface MockMusicSFXTimingFlowOutput {
  musicAnchors: TimingAnchorRecord[]
  musicEvents: TimingEventRecord[]
  beatGrids: MusicBeatGridRecord[]
  duckingPlans: MusicDuckingTimingPlanRecord[]
  duckingEvents: TimingEventRecord[]
  sfxAnchors: TimingAnchorRecord[]
  sfxEvents: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  qaChecks: StoryTimingQACheckRecord[]
  chatSummary: string[]
  nextStep: 'integrate_signature_animation_timing'
  warnings: string[]
  storyTimingPlan: CreateStoryTimingPlanResponse
}

const resolveScenario = (input: MockMusicSFXTimingFlowInput): MockMusicSFXTimingScenario => {
  if (input.scenario) return input.scenario
  if (input.scenarioId) return getMockMusicSFXTimingScenarioById(input.scenarioId) ?? getDefaultMockMusicSFXTimingScenario()
  return getDefaultMockMusicSFXTimingScenario()
}

const persistSoundSyncOutputs = (
  db: MockDatabase,
  output: MockMusicSFXTimingFlowOutput,
): void => {
  output.beatGrids.forEach((beatGrid) => insertMockRecord(db, 'musicBeatGrids', beatGrid))
  output.duckingPlans.forEach((plan) => insertMockRecord(db, 'musicDuckingTimingPlans', plan))
  if (output.storyTimingPlan.soundSyncTimingIntegration) {
    insertMockRecord(db, 'soundSyncTimingIntegrations', output.storyTimingPlan.soundSyncTimingIntegration)
  }
}

export function runMockMusicSFXTimingFlow(
  input: MockMusicSFXTimingFlowInput = {},
  db: MockDatabase = createMockDatabase(),
): MockMusicSFXTimingFlowOutput {
  const scenario = resolveScenario(input)
  const result = createStoryTimingPlan({
    workspaceId: 'mock-workspace-storytiming',
    projectId: scenario.projectId,
    editPlanId: scenario.editPlanId,
    targetPlatform: scenario.targetPlatform ?? 'instagram',
    editComplexity: scenario.editComplexity,
    userTimingInstructions: scenario.userTimingInstructions,
    avoidTimingInstructions: scenario.avoidTimingInstructions,
    sources: scenario.inputTimingSources,
  })

  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }

  const soundSyncQAChecks = result.data.qaChecks.filter((check) =>
    check.checkType === 'music_beat_alignment' ||
    check.checkType === 'music_ducking_timing' ||
    check.checkType === 'sfx_hit_alignment' ||
    check.checkType === 'sfx_tail_safety' ||
    check.checkType === 'overall_rhythm' ||
    check.checkType === 'platform_pacing',
  )
  const output: MockMusicSFXTimingFlowOutput = {
    musicAnchors: result.data.musicAnchors,
    musicEvents: result.data.musicEvents,
    beatGrids: result.data.beatGrids,
    duckingPlans: result.data.duckingPlans,
    duckingEvents: result.data.duckingEvents,
    sfxAnchors: result.data.sfxAnchors,
    sfxEvents: result.data.sfxEvents,
    dependencies: result.data.dependencies.filter((dependency) =>
      dependency.reason.toLowerCase().includes('sfx') ||
      dependency.reason.toLowerCase().includes('music') ||
      dependency.reason.toLowerCase().includes('duck'),
    ),
    conflicts: result.data.conflicts.filter((conflict) =>
      conflict.conflictType === 'music_ducking_misses_speech' ||
      conflict.conflictType === 'sfx_hit_late' ||
      conflict.conflictType === 'sfx_hit_early' ||
      conflict.conflictType === 'sfx_tail_over_speech' ||
      conflict.conflictType === 'too_many_events_same_moment' ||
      conflict.description.toLowerCase().includes('ambience'),
    ),
    qaChecks: soundSyncQAChecks,
    chatSummary: [
      createMusicTimingSummary(result.data.musicEvents, result.data.musicAnchors),
      createMusicBeatGridSummary(result.data.beatGrids),
      createMusicDuckingTimingSummary(result.data.duckingPlans),
      createSFXTimingSummary(result.data.sfxEvents, result.data.sfxAnchors),
      createMusicSFXSyncSummary(result.data.dependencies),
      createSoundSyncConflictSummary(result.data.conflicts),
      createSoundSyncTimingQASummary(soundSyncQAChecks),
      'No real audio processing, provider calls, rendering, or remote persistence occurred.',
    ],
    nextStep: 'integrate_signature_animation_timing',
    warnings: result.data.warnings,
    storyTimingPlan: result.data,
  }

  if (input.persistToMockDatabase) {
    persistSoundSyncOutputs(db, output)
  }

  return output
}

export function runMockLifestyleMusicSFXTimingFlow(): MockMusicSFXTimingFlowOutput {
  return runMockMusicSFXTimingFlow({ scenarioId: 'lifestyle_vacation_multi_cue_music_timing' })
}

export function runMockDialogueMusicDuckingFlow(): MockMusicSFXTimingFlowOutput {
  return runMockMusicSFXTimingFlow({ scenarioId: 'dialogue_bed_music_ducking' })
}

export function runMockMontageBeatSFXFlow(): MockMusicSFXTimingFlowOutput {
  return runMockMusicSFXTimingFlow({ scenarioId: 'montage_beat_grid_and_sfx_hits' })
}

export function runMockFaithSoundSyncTimingFlow(): MockMusicSFXTimingFlowOutput {
  return runMockMusicSFXTimingFlow({ scenarioId: 'faith_serious_voice_first_music_timing' })
}

export function runMockSFXHitLateConflictFlow(): MockMusicSFXTimingFlowOutput {
  return runMockMusicSFXTimingFlow({ scenarioId: 'sfx_hit_lands_late_conflict' })
}

export function runMockMusicDuckingConflictFlow(): MockMusicSFXTimingFlowOutput {
  return runMockMusicSFXTimingFlow({ scenarioId: 'music_ducking_starts_late_conflict' })
}

export function runMockAmbiencePreservationFlow(): MockMusicSFXTimingFlowOutput {
  return runMockMusicSFXTimingFlow({ scenarioId: 'food_social_ambience_preservation' })
}
