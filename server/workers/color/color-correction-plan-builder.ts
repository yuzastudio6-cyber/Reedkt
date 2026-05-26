import type { ColorAnalysisSummary, ColorCorrectionPlan, ColorExecutionInput } from './color-execution-types'

export function buildColorCorrectionPlan(input: {
  executionInput: ColorExecutionInput
  analysis: ColorAnalysisSummary
}): ColorCorrectionPlan {
  const style = input.executionInput.colorGradeStyle ?? 'clean_natural'
  const intensity = clamp(input.executionInput.colorIntensity ?? 0.35, 0, 1)
  const operations: ColorCorrectionPlan['operations'] = [
    {
      operationId: 'color-exposure-correction',
      operationType: 'exposure_correction',
      amount: input.analysis.underexposed ? 0.18 : input.analysis.overexposed ? -0.12 : 0.04,
      reason: 'Clean-first exposure correction before any creative look.',
      risks: input.analysis.highlightRisk === 'high' ? ['highlight_clipping_risk'] : [],
    },
    {
      operationId: 'color-white-balance',
      operationType: 'white_balance',
      amount: input.analysis.whiteBalanceIssue ? 0.18 : 0.04,
      reason: 'Neutral white balance pass protects source truth before style.',
      risks: [],
    },
    {
      operationId: 'color-contrast-curve',
      operationType: 'contrast_curve',
      amount: Math.min(0.18, intensity * 0.35),
      reason: 'Natural contrast curve without crushing shadows.',
      risks: input.analysis.shadowRisk === 'high' ? ['crushed_shadow_risk'] : [],
    },
    {
      operationId: 'color-highlight-recovery',
      operationType: 'highlight_recovery',
      amount: input.analysis.highlightRisk === 'high' ? 0.24 : 0.1,
      reason: 'Recover highlight detail before look transforms.',
      risks: [],
    },
    {
      operationId: 'color-shadow-control',
      operationType: 'shadow_control',
      amount: input.analysis.shadowRisk === 'high' ? 0.2 : 0.08,
      reason: 'Lift/control shadows without flattening the image.',
      risks: [],
    },
    {
      operationId: 'color-saturation-vibrance',
      operationType: 'saturation_vibrance_control',
      amount: input.analysis.saturationRisk === 'high' ? -0.12 : Math.min(0.12, intensity * 0.25),
      reason: 'Controlled saturation/vibrance after exposure and balance.',
      risks: input.analysis.saturationRisk === 'high' ? ['oversaturation_risk'] : [],
    },
    {
      operationId: 'color-skin-tone-protection',
      operationType: 'skin_tone_protection',
      amount: 1,
      reason: 'Skin tone protection is required for professional color QA.',
      risks: input.analysis.skinToneRisk === 'high' ? ['skin_tone_review_required'] : [],
    },
  ]

  return {
    id: `color-correction-${input.executionInput.mediaAssetId}`,
    style,
    intensity,
    operations,
    cleanFirst: true,
    reasons: ['Clean/natural correction is applied before any strong look or LUT.'],
    warnings: [
      ...input.analysis.missingEvidenceWarnings,
      ...(intensity > 0.75 ? ['High color intensity requires review and may be reduced by QA.'] : []),
    ],
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
