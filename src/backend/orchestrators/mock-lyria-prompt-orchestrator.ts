import type {
  LyriaPromptPlanRecord,
  LyriaPromptSegment,
  LyriaPromptValidationWarning,
  MusicCueRecord,
} from '../../types'
import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase, insertMockRecord } from '../mock/mock-database'
import type { MockMusicPlanningOrchestratorResult } from './mock-music-planning-orchestrator'
import { runMockLakeComoMusicPlanningFlow } from './mock-music-planning-orchestrator'
import { buildLyriaPromptsForCueSheet } from '../services/lyria-prompt-service'
import { validateLyriaPromptPlan } from '../services/lyria-prompt-validation-service'
import { ok, type ServiceResult, unwrapServiceResult } from '../service-result'

export interface MockLyriaPromptPlanningResult {
  cueSheetId: string
  promptPlans: LyriaPromptPlanRecord[]
  promptSegments: LyriaPromptSegment[]
  validationWarnings: LyriaPromptValidationWarning[]
  nextStep: 'create_credit_estimate_for_music_generation'
}

export interface MockPromptValidationResult {
  promptPlanId: string
  validationWarnings: LyriaPromptValidationWarning[]
}

export function runMockLyriaPromptPlanningFlow(
  musicPlanningResult: MockMusicPlanningOrchestratorResult,
  db: MockDatabase = createMockDatabase(),
): ServiceResult<MockLyriaPromptPlanningResult> {
  const result = buildLyriaPromptsForCueSheet({
    cueSheet: musicPlanningResult.cueSheet,
    cues: musicPlanningResult.cues,
    musicContextAnalysis: musicPlanningResult.musicContextAnalysis,
    languageContexts: musicPlanningResult.languageContexts,
    referenceMusicDNA: musicPlanningResult.referenceMusicDNA,
    userInstruction: musicPlanningResult.musicContextAnalysis.userMusicInstructions.join(' '),
    avoidInstruction: musicPlanningResult.musicContextAnalysis.avoidMusicInstructions.join(' '),
  })

  result.promptPlans.forEach((promptPlan) => insertMockRecord(db, 'lyriaPromptPlans', promptPlan))
  result.promptSegments.forEach((promptSegment) => insertMockRecord(db, 'lyriaPromptSegments', promptSegment))

  return ok({
    cueSheetId: musicPlanningResult.cueSheet.id,
    promptPlans: result.promptPlans,
    promptSegments: result.promptSegments,
    validationWarnings: result.validationWarnings,
    nextStep: 'create_credit_estimate_for_music_generation',
  })
}

export function runMockLakeComoLyriaPromptFlow(
  db: MockDatabase = createMockDatabase(),
): ServiceResult<MockLyriaPromptPlanningResult> {
  const musicPlanningResult = unwrapServiceResult(runMockLakeComoMusicPlanningFlow(db))
  return runMockLyriaPromptPlanningFlow(musicPlanningResult, db)
}

export function runMockPromptValidationFlow(
  promptPlan: LyriaPromptPlanRecord,
  cue: MusicCueRecord,
): ServiceResult<MockPromptValidationResult> {
  return ok({
    promptPlanId: promptPlan.id,
    validationWarnings: validateLyriaPromptPlan({ promptPlan, cue }),
  })
}
