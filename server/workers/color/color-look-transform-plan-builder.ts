import type { ColorExecutionInput, ColorLookTransformPlan } from './color-execution-types'

const lookStyles = new Set([
  'premium_clean',
  'warm_lifestyle',
  'cinematic_contrast',
  'luxury_real_estate',
  'bright_social',
  'moody_dramatic',
  'film_emulation_light',
  'muted_editorial',
  'high_key_clean',
  'monochrome',
  'custom',
])

export function buildColorLookTransformPlan(input: ColorExecutionInput): ColorLookTransformPlan {
  const style = input.colorGradeStyle ?? 'clean_natural'
  const lookIntensity = clamp(input.colorIntensity ?? 0.35, 0, 1)
  const lutStrength = clamp(input.lutStrength ?? (input.lutArtifactId || input.lutLocalPath ? 0.25 : 0), 0, 0.6)
  const enabled = lookStyles.has(style) || lutStrength > 0
  const operations: ColorLookTransformPlan['operations'] = []

  if (enabled) {
    operations.push({
      operationId: 'look-transform-controlled',
      operationType: 'look_transform',
      strength: Math.min(0.6, lookIntensity),
      reason: `Controlled ${style} look transform after clean correction.`,
      risks: lookIntensity > 0.75 ? ['strong_look_review_required'] : [],
    })
  }
  if (lutStrength > 0) {
    operations.push({
      operationId: 'lut-application-controlled',
      operationType: 'lut_application',
      strength: lutStrength,
      reason: 'Approved/safe LUT application with capped strength.',
      risks: lutStrength > 0.45 ? ['lut_strength_warning'] : [],
    })
  }
  operations.push({
    operationId: 'display-transform-placeholder',
    operationType: 'display_transform',
    strength: 1,
    reason: 'Display transform metadata is tracked for later color-managed render/export.',
    risks: [],
  })
  operations.push({
    operationId: 'output-color-transform-placeholder',
    operationType: 'output_color_transform',
    strength: 1,
    reason: 'Output color space assumptions remain explicit for QA.',
    risks: [],
  })

  return {
    enabled,
    style,
    lookIntensity,
    lutStrength,
    lutArtifactId: input.lutArtifactId,
    lutLocalPath: input.lutLocalPath,
    operations,
    warnings: [
      ...(lutStrength > 0.45 ? ['LUT strength is high and should be reviewed or reduced before preview/export.'] : []),
      ...(lookIntensity > 0.75 ? ['Strong look intensity risks overprocessing.'] : []),
    ],
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
