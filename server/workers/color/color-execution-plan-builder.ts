import { buildColorAnalysisSummary } from './color-analysis-summary-builder'
import { buildColorCorrectionPlan } from './color-correction-plan-builder'
import { buildColorShotMatchPlan } from './color-shot-match-plan-builder'
import { buildColorLookTransformPlan } from './color-look-transform-plan-builder'
import type { ColorExecutionInput, ColorExecutionOperation, ColorExecutionPlan } from './color-execution-types'

export function buildColorExecutionPlan(input: ColorExecutionInput): ColorExecutionPlan {
  const analysis = buildColorAnalysisSummary(input)
  const correctionPlan = input.colorCorrectionPlan ?? buildColorCorrectionPlan({ executionInput: input, analysis })
  const shotMatchPlan = buildColorShotMatchPlan({ executionInput: input, analysis })
  const lookTransformPlan = buildColorLookTransformPlan(input)
  const selectedOperations = buildOperations({ correctionPlan, shotMatchPlan, lookTransformPlan })

  return {
    executionPlanId: `color-execution-${input.mediaAssetId}`,
    selectedOperations,
    correctionPlan,
    shotMatchPlan,
    lookTransformPlan,
    ffmpegOperationPlan: {
      previewOnly: true,
    },
    opencolorioOperationPlan: input.enableOpenColorIOExecution
      ? { enabled: true, skipSafe: true, reason: 'OpenColorIO execution is explicitly enabled but readiness-gated.' }
      : undefined,
    openimageioOperationPlan: input.enableOpenImageIOExecution
      ? { enabled: true, skipSafe: true, reason: 'OpenImageIO execution is explicitly enabled but readiness-gated.' }
      : undefined,
    expectedArtifacts: ['color_analysis_json', 'color_grade_recipe', 'qa_report'],
    requiredQualityGates: ['color_exposure', 'color_skin_tone', 'color_export_space', 'color_shot_match'],
    reasons: [
      ...correctionPlan.reasons,
      ...(shotMatchPlan.enabled ? ['Shot matching is planned from frame/reference mismatch evidence.'] : []),
      ...(lookTransformPlan.enabled ? [`${lookTransformPlan.style} look transform is capped and QA-checked.`] : []),
    ],
    warnings: [
      ...correctionPlan.warnings,
      ...shotMatchPlan.warnings,
      ...lookTransformPlan.warnings,
    ],
    finalExportAllowed: false,
  }
}

function buildOperations(input: {
  correctionPlan: ReturnType<typeof buildColorCorrectionPlan>
  shotMatchPlan: ReturnType<typeof buildColorShotMatchPlan>
  lookTransformPlan: ReturnType<typeof buildColorLookTransformPlan>
}): ColorExecutionOperation[] {
  const operations: ColorExecutionOperation[] = ['analyze_color']
  operations.push(...input.correctionPlan.operations.map((operation) => operation.operationType))
  if (input.shotMatchPlan.enabled) operations.push('shot_matching')
  if (input.lookTransformPlan.operations.some((operation) => operation.operationType === 'lut_application')) operations.push('lut_application')
  if (input.lookTransformPlan.enabled) operations.push('look_transform')
  operations.push('display_transform', 'output_color_transform', 'color_qa')
  return [...new Set(operations)]
}
