import type {
  SFXEventPlanRecord,
  SFXMockWaveformAnalysisRecord,
  SFXWaveformShape,
} from '../../types'
import type {
  AnalyzeMockSFXWaveformRequest,
  AnalyzeMockSFXWaveformResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

function clampSeconds(value: number, min: number, max: number): number {
  return Number(Math.min(Math.max(value, min), max).toFixed(3))
}

export function inferWaveformShapeFromUseCase(eventPlan: SFXEventPlanRecord): SFXWaveformShape {
  if (eventPlan.targetLayer === 'ambient_bridge' || eventPlan.targetLayer === 'source_footage_repair') {
    return 'ambient_swell'
  }

  if (eventPlan.targetLayer === 'transition' || eventPlan.useCase.includes('whoosh')) {
    return 'whoosh_rise_hit_tail'
  }

  if (eventPlan.targetLayer === 'stroke_motion' || eventPlan.useCase.startsWith('stroke_')) {
    return eventPlan.useCase === 'stroke_line_crack' || eventPlan.useCase === 'stroke_circle_complete'
      ? 'single_hit'
      : 'draw_texture'
  }

  if (eventPlan.targetLayer === 'real_motion' || eventPlan.useCase.startsWith('real_motion_')) {
    return 'object_movement'
  }

  if (eventPlan.targetLayer === 'graphic_design' || eventPlan.targetLayer === 'cta_reveal') {
    return 'soft_pop'
  }

  if (eventPlan.targetLayer === 'title_card' || eventPlan.targetLayer === 'chapter_card' || eventPlan.targetLayer === 'montage_hit') {
    return 'single_hit'
  }

  return 'unknown'
}

export function inferCleanRegionFromGeneratedDuration(
  waveformShape: SFXWaveformShape,
  generatedDurationSeconds: number,
): {
  cleanStartTimeSeconds: number
  cleanEndTimeSeconds: number
  suggestedTrimStartSeconds: number
  suggestedTrimEndSeconds: number
  detectedHitTimeSeconds?: number
  tailDurationMs: number
} {
  const duration = Math.max(0.5, generatedDurationSeconds)

  if (waveformShape === 'ambient_swell') {
    return {
      cleanStartTimeSeconds: clampSeconds(duration * 0.12, 0.5, 1.1),
      cleanEndTimeSeconds: clampSeconds(duration * 0.72, 3.8, duration - 0.4),
      suggestedTrimStartSeconds: clampSeconds(duration * 0.14, 0.6, 1.2),
      suggestedTrimEndSeconds: clampSeconds(duration * 0.74, 4.2, duration - 0.2),
      tailDurationMs: 900,
    }
  }

  if (waveformShape === 'draw_texture') {
    return {
      cleanStartTimeSeconds: clampSeconds(duration * 0.12, 0.3, 0.5),
      cleanEndTimeSeconds: clampSeconds(duration * 0.5, 1.4, duration - 0.25),
      suggestedTrimStartSeconds: clampSeconds(duration * 0.13, 0.35, 0.55),
      suggestedTrimEndSeconds: clampSeconds(duration * 0.52, 1.45, duration - 0.2),
      detectedHitTimeSeconds: clampSeconds(duration * 0.13, 0.35, 0.55),
      tailDurationMs: 160,
    }
  }

  if (waveformShape === 'object_movement') {
    return {
      cleanStartTimeSeconds: clampSeconds(duration * 0.32, 0.75, 1.0),
      cleanEndTimeSeconds: clampSeconds(duration * 0.58, 1.35, duration - 0.2),
      suggestedTrimStartSeconds: clampSeconds(duration * 0.34, 0.85, 1.0),
      suggestedTrimEndSeconds: clampSeconds(duration * 0.6, 1.45, duration - 0.15),
      detectedHitTimeSeconds: clampSeconds(duration * 0.44, 1.0, 1.15),
      tailDurationMs: 350,
    }
  }

  if (waveformShape === 'soft_pop' || waveformShape === 'single_hit') {
    return {
      cleanStartTimeSeconds: clampSeconds(duration * 0.34, 0.72, 0.9),
      cleanEndTimeSeconds: clampSeconds(duration * 0.5, 1.2, duration - 0.2),
      suggestedTrimStartSeconds: clampSeconds(duration * 0.33, 0.78, 0.9),
      suggestedTrimEndSeconds: clampSeconds(duration * 0.52, 1.25, duration - 0.15),
      detectedHitTimeSeconds: clampSeconds(duration * 0.4, 0.88, 1.02),
      tailDurationMs: waveformShape === 'single_hit' ? 320 : 260,
    }
  }

  return {
    cleanStartTimeSeconds: clampSeconds(duration * 0.28, 0.65, 0.82),
    cleanEndTimeSeconds: clampSeconds(duration * 0.58, 1.42, duration - 0.2),
    suggestedTrimStartSeconds: clampSeconds(duration * 0.31, 0.72, 0.86),
    suggestedTrimEndSeconds: clampSeconds(duration * 0.55, 1.34, duration - 0.15),
    detectedHitTimeSeconds: clampSeconds(duration * 0.41, 0.96, 1.05),
    tailDurationMs: 380,
  }
}

function hitStrengthForShape(waveformShape: SFXWaveformShape): SFXMockWaveformAnalysisRecord['detectedHitStrength'] {
  if (waveformShape === 'ambient_swell') return 'none'
  if (waveformShape === 'draw_texture') return 'soft'
  if (waveformShape === 'whoosh_rise_hit_tail' || waveformShape === 'single_hit') return 'medium'
  if (waveformShape === 'soft_pop' || waveformShape === 'object_movement') return 'soft'
  return 'none'
}

export function createMockWaveformAnalysisFromPrompt(
  request: AnalyzeMockSFXWaveformRequest,
): SFXMockWaveformAnalysisRecord {
  const waveformShape = inferWaveformShapeFromUseCase(request.sfxEventPlan)
  const generatedDurationSeconds = request.sfxGeneratedAsset?.fullGeneratedDurationSeconds ??
    Math.max(request.sfxPromptPlan.durationToGenerateSeconds, request.sfxPromptPlan.durationNeededSeconds)
  const region = inferCleanRegionFromGeneratedDuration(waveformShape, generatedDurationSeconds)

  return {
    id: createMockId('sfx-waveform-analysis'),
    projectId: request.sfxEventPlan.projectId,
    editPlanId: request.sfxEventPlan.editPlanId,
    sfxGeneratedAssetId: request.sfxGeneratedAsset?.id,
    sfxEventPlanId: request.sfxEventPlan.id,
    waveformShape,
    detectedHitTimeSeconds: region.detectedHitTimeSeconds,
    detectedHitStrength: hitStrengthForShape(waveformShape),
    cleanStartTimeSeconds: region.cleanStartTimeSeconds,
    cleanEndTimeSeconds: region.cleanEndTimeSeconds,
    suggestedTrimStartSeconds: region.suggestedTrimStartSeconds,
    suggestedTrimEndSeconds: region.suggestedTrimEndSeconds,
    tailDurationMs: region.tailDurationMs,
    noiseOrArtifactNotes: waveformShape === 'unknown'
      ? ['Unknown waveform shape requires manual review in a future worker.']
      : [],
    confidence: waveformShape === 'unknown' ? 55 : waveformShape === 'ambient_swell' ? 82 : 88,
    createdAt: nowIso(),
  }
}

export function analyzeMockSFXWaveform(
  db: MockDatabase,
  request: AnalyzeMockSFXWaveformRequest,
): ServiceResult<AnalyzeMockSFXWaveformResponse> {
  return ok({
    waveformAnalysis: insertMockRecord(
      db,
      'sfxWaveformAnalyses',
      createMockWaveformAnalysisFromPrompt(request),
    ),
  })
}

export function createWaveformAnalysisSummary(
  waveformAnalysis: SFXMockWaveformAnalysisRecord,
): string[] {
  return [
    `Mock waveform shape: ${waveformAnalysis.waveformShape}.`,
    waveformAnalysis.detectedHitTimeSeconds === undefined
      ? 'No sharp hit detected; align by motion/bridge region.'
      : `Detected hit candidate: ${waveformAnalysis.detectedHitTimeSeconds}s.`,
    `Suggested trim: ${waveformAnalysis.suggestedTrimStartSeconds}s-${waveformAnalysis.suggestedTrimEndSeconds}s.`,
    'This is deterministic mock metadata, not real audio analysis.',
  ]
}
