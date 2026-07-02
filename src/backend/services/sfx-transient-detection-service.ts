import type {
  SFXEventPlanRecord,
  SFXMockWaveformAnalysisRecord,
  SFXTransientDetectionResult,
  SFXTransientStrength,
} from '../../types'

export function classifyTransientStrength(
  waveformAnalysis: SFXMockWaveformAnalysisRecord,
): SFXTransientStrength {
  if (waveformAnalysis.detectedHitStrength === 'too_harsh') return 'too_harsh'
  if (waveformAnalysis.waveformShape === 'ambient_swell') return 'none'
  if (waveformAnalysis.waveformShape === 'draw_texture') return 'soft'
  return waveformAnalysis.detectedHitStrength
}

export function chooseBestSFXHitPoint(
  eventPlan: SFXEventPlanRecord,
  waveformAnalysis: SFXMockWaveformAnalysisRecord,
): number | undefined {
  if (eventPlan.targetLayer === 'ambient_bridge') return undefined

  if (eventPlan.anchorType === 'stroke_motion_start') {
    return waveformAnalysis.suggestedTrimStartSeconds ?? waveformAnalysis.cleanStartTimeSeconds
  }

  if (eventPlan.targetLayer === 'stroke_motion' && waveformAnalysis.detectedHitTimeSeconds === undefined) {
    return waveformAnalysis.cleanStartTimeSeconds
  }

  return waveformAnalysis.detectedHitTimeSeconds ??
    waveformAnalysis.suggestedTrimStartSeconds ??
    waveformAnalysis.cleanStartTimeSeconds
}

export function estimateSFXHitOffsetInsideTrim(
  hitTimeSeconds: number | undefined,
  trimStartSeconds: number | undefined,
): number {
  if (hitTimeSeconds === undefined || trimStartSeconds === undefined) return 0
  return Math.max(0, Math.round((hitTimeSeconds - trimStartSeconds) * 1000))
}

export function detectSFXTransient(
  eventPlan: SFXEventPlanRecord,
  waveformAnalysis: SFXMockWaveformAnalysisRecord,
): SFXTransientDetectionResult {
  const chosenHitTimeSeconds = chooseBestSFXHitPoint(eventPlan, waveformAnalysis)
  const detectedHitStrength = classifyTransientStrength(waveformAnalysis)
  const hitOffsetInsideTrimMs = estimateSFXHitOffsetInsideTrim(
    chosenHitTimeSeconds,
    waveformAnalysis.suggestedTrimStartSeconds,
  )
  const warnings: string[] = []

  if (detectedHitStrength === 'none') {
    warnings.push('No sharp transient detected; align the clean region to the visual bridge instead of a hit.')
  }

  if (detectedHitStrength === 'too_harsh') {
    warnings.push('Transient is too harsh for default ReeditPro SFX and should be regenerated or softened later.')
  }

  return {
    detectedHitTimeSeconds: waveformAnalysis.detectedHitTimeSeconds,
    chosenHitTimeSeconds,
    detectedHitStrength,
    hitOffsetInsideTrimMs,
    alignmentNote: detectedHitStrength === 'none'
      ? 'Use clean region start and crossfade timing; no hit point is required.'
      : 'Align the chosen hit point to the SFX timing anchor.',
    confidence: waveformAnalysis.confidence,
    warnings,
  }
}

export function createTransientDetectionSummary(
  transientDetection: SFXTransientDetectionResult,
): string[] {
  return [
    transientDetection.chosenHitTimeSeconds === undefined
      ? 'No transient chosen; use bridge-style placement.'
      : `Chosen hit point: ${transientDetection.chosenHitTimeSeconds}s.`,
    `Hit strength: ${transientDetection.detectedHitStrength}.`,
    `Hit offset inside trim: ${transientDetection.hitOffsetInsideTrimMs ?? 0}ms.`,
    transientDetection.alignmentNote,
  ]
}
