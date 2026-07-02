import type {
  SFXEventPlanRecord,
  SFXGeneratedAssetRecord,
  SFXPromptPlanRecord,
  SFXTimingAlignmentRecord,
  SFXTimelinePlacement,
  SFXTrimPlanRecord,
} from '../../types'
import type { CreateSFXTimingFlowResponse } from '../contracts/sfx-director-contracts'
import { createMockDatabase, createMockId, insertMockRecord, nowIso, type MockDatabase } from '../mock/mock-database'
import {
  getDefaultMockSFXTimingScenario,
  getMockSFXTimingScenarioById,
  mockSFXTimingScenarios,
  type MockSFXTimingScenario,
} from '../mock/mock-sfx-timing-scenarios'
import { createSFXDurationPlan } from '../services/sfx-duration-planning-service'
import { createSFXTimingAlignment } from '../services/sfx-hit-alignment-service'
import { createFinalSFXTimelinePlacement } from '../services/sfx-timeline-placement-service'
import { detectSFXTransient } from '../services/sfx-transient-detection-service'
import { createSFXTrimPlan } from '../services/sfx-trim-service'
import { validateSFXTiming } from '../services/sfx-timing-validation-service'
import { analyzeMockSFXWaveform } from '../services/sfx-waveform-analysis-service'
import { unwrapServiceResult } from '../service-result'

export interface MockSFXTimingFlowInput {
  sfxEventPlan: SFXEventPlanRecord
  sfxPromptPlan: SFXPromptPlanRecord
  sfxGeneratedAsset?: SFXGeneratedAssetRecord
  fps?: 24 | 25 | 30 | 60
  speechPresent?: boolean
  musicBeatTimeSeconds?: number
}

function createMockGeneratedAsset(
  db: MockDatabase,
  eventPlan: SFXEventPlanRecord,
  promptPlan: SFXPromptPlanRecord,
): SFXGeneratedAssetRecord {
  return insertMockRecord(db, 'sfxGeneratedAssets', {
    id: createMockId('sfx-generated-asset'),
    projectId: eventPlan.projectId,
    editPlanId: eventPlan.editPlanId,
    sfxEventPlanId: eventPlan.id,
    sfxPromptPlanId: promptPlan.id,
    provider: promptPlan.provider,
    modelName: promptPlan.modelName,
    origin: 'mock_generated',
    storagePath: `mock://sfx/${eventPlan.id}/${promptPlan.id}.wav`,
    fullGeneratedDurationSeconds: Math.max(promptPlan.durationToGenerateSeconds, promptPlan.durationNeededSeconds),
    reuseStatus: 'project_generated',
    qaStatus: 'pending',
    licenseScope: 'project_only',
    status: 'generated',
    notes: [
      'Mock generated asset metadata only.',
      'No real SFX was generated, uploaded, stored, or processed.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noProviderCall: true, noAudioProcessing: true },
  })
}

function applyBadScenarioAdjustments(
  scenario: MockSFXTimingScenario | undefined,
  trimPlan: SFXTrimPlanRecord,
  timingAlignment: SFXTimingAlignmentRecord,
  timelinePlacement: SFXTimelinePlacement,
): void {
  if (!scenario) return

  if (scenario.expectedValidationIssues.includes('hit_late')) {
    timingAlignment.hitTimeSeconds = Number((timingAlignment.hitTimeSeconds + 0.2).toFixed(3))
    timelinePlacement.hitTimeSeconds = Number((timelinePlacement.hitTimeSeconds + 0.2).toFixed(3))
  }

  if (scenario.expectedValidationIssues.includes('tail_too_long')) {
    trimPlan.tailMs = 2200
    timingAlignment.tailMs = 2200
  }

  if (scenario.expectedValidationIssues.includes('trim_too_short')) {
    trimPlan.trimEndSeconds = Number((trimPlan.trimStartSeconds + 0.1).toFixed(3))
    trimPlan.hitOffsetInsideTrimMs = 600
    timingAlignment.hitOffsetInsideTrimMs = 600
  }
}

export function runMockSFXTimingFlow(
  input?: MockSFXTimingFlowInput,
  db: MockDatabase = createMockDatabase(),
  scenario?: MockSFXTimingScenario,
): CreateSFXTimingFlowResponse {
  const defaultScenario = scenario ?? getDefaultMockSFXTimingScenario()
  const sfxEventPlan = input?.sfxEventPlan ?? defaultScenario.eventPlan
  const sfxPromptPlan = input?.sfxPromptPlan ?? defaultScenario.promptPlan
  const generatedAsset = input?.sfxGeneratedAsset ?? createMockGeneratedAsset(db, sfxEventPlan, sfxPromptPlan)
  const durationPlan = createSFXDurationPlan(sfxEventPlan, sfxPromptPlan)
  const waveformAnalysis = unwrapServiceResult(analyzeMockSFXWaveform(db, {
    sfxEventPlan,
    sfxPromptPlan,
    sfxGeneratedAsset: generatedAsset,
  })).waveformAnalysis
  const transientDetection = detectSFXTransient(sfxEventPlan, waveformAnalysis)
  const trimPlan = unwrapServiceResult(createSFXTrimPlan(db, {
    sfxEventPlan,
    sfxPromptPlan,
    sfxGeneratedAsset: generatedAsset,
    waveformAnalysis,
    transientDetection,
  })).sfxTrimPlan
  const timingAlignment = unwrapServiceResult(createSFXTimingAlignment(db, {
    sfxEventPlan,
    sfxTrimPlan: trimPlan,
    waveformAnalysis,
  })).sfxTimingAlignment
  const timelinePlacement = createFinalSFXTimelinePlacement({
    sfxTimingAlignment: timingAlignment,
    fps: input?.fps,
    speechPresent: input?.speechPresent ?? defaultScenario.speechPresent,
    musicBeatTimeSeconds: input?.musicBeatTimeSeconds ?? defaultScenario.musicBeatTimeSeconds,
  }).timelinePlacement

  applyBadScenarioAdjustments(scenario, trimPlan, timingAlignment, timelinePlacement)

  const validation = validateSFXTiming({
    sfxEventPlan,
    sfxTrimPlan: trimPlan,
    sfxTimingAlignment: timingAlignment,
    timelinePlacement,
    speechPresent: input?.speechPresent ?? defaultScenario.speechPresent,
    musicBeatTimeSeconds: input?.musicBeatTimeSeconds ?? defaultScenario.musicBeatTimeSeconds,
  }).validation

  return {
    durationPlan,
    generatedAsset,
    waveformAnalysis,
    transientDetection,
    trimPlan,
    timingAlignment,
    timelinePlacement,
    validation,
    nextStep: 'create_sfx_mix_plan',
    warnings: [
      ...durationPlan.warnings,
      ...transientDetection.warnings,
      ...timelinePlacement.warnings,
      ...validation.warnings,
      'RP-SFX-06 is mock timing metadata only; RP-SFX-07 handles mix and ducking.',
    ],
  }
}

function runScenarioSet(
  ids: string[],
  db: MockDatabase = createMockDatabase(),
) {
  const flows = ids
    .map((id) => getMockSFXTimingScenarioById(id))
    .filter((scenario): scenario is MockSFXTimingScenario => Boolean(scenario))
    .map((scenario) => ({
      scenario,
      ...runMockSFXTimingFlow(undefined, db, scenario),
    }))

  return {
    flows,
    nextStep: 'create_sfx_mix_plan' as const,
    warnings: [
      'Mock timing flow only; no real audio processing, provider calls, rendering, or uploads were run.',
    ],
  }
}

export function runMockLakeComoSFXTimingFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'transition-whoosh-hit-on-cut',
    'chapter-title-hit-on-reveal',
    'montage-beat-accent',
    'food-social-ambience-bridge',
    'cta-reveal-chime',
  ], db)
}

export function runMockStrokeMotionSFXTimingFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'stroke-line-draw-texture',
    'stroke-line-crack-hit',
    'stroke-circle-complete',
  ], db)
}

export function runMockRealMotionSFXTimingFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'real-motion-object-settle',
  ], db)
}

export function runMockAmbientBridgeTimingFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'ambient-bridge-no-transient',
    'food-social-ambience-bridge',
  ], db)
}

export function runMockBadTimingValidationFlow(db: MockDatabase = createMockDatabase()) {
  return runScenarioSet([
    'bad-timing-hit-late',
    'bad-timing-tail-too-long',
    'bad-trim-hit-cut-off',
  ], db)
}

export function listMockSFXTimingScenarios(): MockSFXTimingScenario[] {
  return mockSFXTimingScenarios
}
