import type {
  SFXEventPlanRecord,
  SFXMockWaveformAnalysisRecord,
  SFXTrimPlanRecord,
} from '../../types'
import type {
  CreateSFXTrimPlanRequest,
  CreateSFXTrimPlanResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

function roundSeconds(value: number): number {
  return Number(value.toFixed(3))
}

export function calculateTrimWindow(
  eventPlan: SFXEventPlanRecord,
  waveformAnalysis: SFXMockWaveformAnalysisRecord,
): { trimStartSeconds: number; trimEndSeconds: number } {
  const trimStartSeconds = waveformAnalysis.suggestedTrimStartSeconds ??
    waveformAnalysis.cleanStartTimeSeconds ??
    0
  const suggestedTrimEnd = waveformAnalysis.suggestedTrimEndSeconds ??
    waveformAnalysis.cleanEndTimeSeconds ??
    trimStartSeconds + 0.5
  const minimumDuration = eventPlan.targetLayer === 'ambient_bridge'
    ? 3
    : eventPlan.targetLayer === 'stroke_motion'
      ? 0.8
      : 0.32
  const trimEndSeconds = Math.max(suggestedTrimEnd, trimStartSeconds + minimumDuration)

  return {
    trimStartSeconds: roundSeconds(trimStartSeconds),
    trimEndSeconds: roundSeconds(trimEndSeconds),
  }
}

export function calculateFadeInMs(eventPlan: SFXEventPlanRecord): number {
  if (eventPlan.targetLayer === 'ambient_bridge') return 500
  if (eventPlan.targetLayer === 'transition') return 40
  if (eventPlan.targetLayer === 'stroke_motion') return 35
  return 15
}

export function calculateFadeOutMs(eventPlan: SFXEventPlanRecord): number {
  if (eventPlan.targetLayer === 'ambient_bridge') return 650
  if (eventPlan.targetLayer === 'transition') return 180
  if (eventPlan.targetLayer === 'stroke_motion') return 140
  return 90
}

export function calculateTailMs(
  eventPlan: SFXEventPlanRecord,
  waveformAnalysis: SFXMockWaveformAnalysisRecord,
): number {
  if (eventPlan.targetLayer === 'ambient_bridge') return Math.max(900, waveformAnalysis.tailDurationMs ?? 0)
  if (eventPlan.targetLayer === 'transition') return Math.max(300, waveformAnalysis.tailDurationMs ?? 0)
  return waveformAnalysis.tailDurationMs ?? 160
}

export function validateTrimWindow(
  trimStartSeconds: number,
  trimEndSeconds: number,
  generatedDurationSeconds: number,
): string[] {
  const warnings: string[] = []

  if (trimStartSeconds < 0) warnings.push('Trim start is before the generated file begins.')
  if (trimEndSeconds <= trimStartSeconds) warnings.push('Trim end must be after trim start.')
  if (trimEndSeconds > generatedDurationSeconds) warnings.push('Trim end exceeds mock generated duration.')
  if (trimEndSeconds - trimStartSeconds < 0.25) warnings.push('Trim window is too short for a clean fade and tail.')

  return warnings
}

export function createSFXTrimPlanFromWaveformAnalysis(
  request: CreateSFXTrimPlanRequest,
): SFXTrimPlanRecord {
  const { sfxEventPlan, sfxPromptPlan, sfxGeneratedAsset, waveformAnalysis, transientDetection } = request
  const { trimStartSeconds, trimEndSeconds } = calculateTrimWindow(sfxEventPlan, waveformAnalysis)
  const validationWarnings = validateTrimWindow(
    trimStartSeconds,
    trimEndSeconds,
    sfxGeneratedAsset.fullGeneratedDurationSeconds,
  )
  const hitOffsetInsideTrimMs = transientDetection.hitOffsetInsideTrimMs ??
    Math.max(0, Math.round(((transientDetection.chosenHitTimeSeconds ?? trimStartSeconds) - trimStartSeconds) * 1000))

  return {
    id: createMockId('sfx-trim-plan'),
    projectId: sfxEventPlan.projectId,
    editPlanId: sfxEventPlan.editPlanId,
    sfxEventPlanId: sfxEventPlan.id,
    sfxGeneratedAssetId: sfxGeneratedAsset.id,
    generatedDurationSeconds: sfxGeneratedAsset.fullGeneratedDurationSeconds,
    neededDurationSeconds: sfxPromptPlan.durationNeededSeconds,
    trimStartSeconds,
    trimEndSeconds,
    hitOffsetInsideTrimMs,
    fadeInMs: calculateFadeInMs(sfxEventPlan),
    fadeOutMs: calculateFadeOutMs(sfxEventPlan),
    tailMs: calculateTailMs(sfxEventPlan, waveformAnalysis),
    reason: 'Mock trim plan keeps the best clean region and preserves the chosen hit point for alignment.',
    requiresManualReview: validationWarnings.length > 0 || waveformAnalysis.confidence < 70,
    status: 'trimmed',
    notes: [
      ...validationWarnings,
      'Generated SFX is not placed blindly; the trim window is prepared before timeline alignment.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      waveformShape: waveformAnalysis.waveformShape,
      trimConfidence: validationWarnings.length > 0 ? 'needs_manual_review' : 'high',
    },
  }
}

export function createSFXTrimPlan(
  db: MockDatabase,
  request: CreateSFXTrimPlanRequest,
): ServiceResult<CreateSFXTrimPlanResponse> {
  return ok({
    sfxTrimPlan: insertMockRecord(db, 'sfxTrimPlans', createSFXTrimPlanFromWaveformAnalysis(request)),
  })
}

export function createSFXTrimSummary(trimPlan: SFXTrimPlanRecord): string[] {
  return [
    `Trim range: ${trimPlan.trimStartSeconds}s-${trimPlan.trimEndSeconds}s.`,
    `Hit offset inside trim: ${trimPlan.hitOffsetInsideTrimMs}ms.`,
    `Fade in/out: ${trimPlan.fadeInMs}ms / ${trimPlan.fadeOutMs}ms.`,
    trimPlan.requiresManualReview ? 'Manual review is recommended.' : 'Trim is mock-approved for timing alignment.',
  ]
}
