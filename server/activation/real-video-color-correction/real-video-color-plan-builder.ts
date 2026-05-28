import { phase32Prefix, realVideoColorCorrectionConfig } from './real-video-color-correction-policy'
import type { RealVideoColorAnalysisSummary, RealVideoColorCorrectionPlan, RealVideoColorGradeRecipe } from './real-video-color-correction-types'

export function buildRealVideoColorCorrectionPlan(input: { runId: string }): RealVideoColorCorrectionPlan {
  const config = realVideoColorCorrectionConfig
  const prefix = phase32Prefix(input.runId)
  return {
    planId: `phase32-color-correction-${input.runId}`,
    sourcePhase31RunId: config.phase31RunId,
    inputGcsUri: config.inputGcsUri,
    operations: ['ffprobe_stream_inspection', 'ffmpeg_signalstats_sampling', 'ffmpeg_clean_color_export'],
    output: {
      colorAnalysisGcsUri: `gs://${config.analysisBucket}/${prefix}/color/color-analysis.json`,
      colorGradeRecipeGcsUri: `gs://${config.analysisBucket}/${prefix}/color/color-grade-recipe.json`,
      colorCorrectedExportGcsUri: `gs://${config.finalExportsBucket}/${prefix}/color-corrected-export.mp4`,
    },
    safety: {
      approvedPhase31InputOnly: true,
      sourceOverwriteAllowed: false,
      publicDeliveryAllowed: false,
      providerExecutionAllowed: false,
      gpuAllowed: false,
      modelDownloadAllowed: false,
      openColorIoAllowed: false,
      openImageIoAllowed: false,
      arbitraryFfmpegArgsAllowed: false,
      unapprovedLutsAllowed: false,
    },
  }
}

export function buildColorGradeRecipe(analysis: RealVideoColorAnalysisSummary): RealVideoColorGradeRecipe {
  if (analysis.sampledFrameCount <= 0) {
    return recipe('blocked', 'Color analysis did not produce frame samples.', 0, 1, 1, 1)
  }
  if (analysis.highlightClippingRisk === 'high' || analysis.overexposedRisk === 'high') {
    return recipe('minimal_correction', 'Minimal exposure reduction selected due to overexposure/highlight risk.', -0.015, 0.98, 1, 1)
  }
  if (analysis.underexposedRisk === 'high') {
    return recipe('minimal_correction', 'Minimal brightness/contrast lift selected due to underexposure risk.', 0.025, 1.04, 1.03, 1)
  }
  if (analysis.saturationRisk === 'high') {
    return recipe('minimal_correction', 'Minimal saturation correction selected due to saturation risk.', 0, 1, 0.98, 1)
  }
  return recipe('no_op', 'No clear color correction risk justified a visible grade; creating neutral color-reviewed export.', 0, 1, 1, 1)
}

function recipe(
  decision: RealVideoColorGradeRecipe['decision'],
  reason: string,
  brightness: number,
  contrast: number,
  saturation: number,
  gamma: number,
): RealVideoColorGradeRecipe {
  const ffmpegFilter = decision === 'minimal_correction'
    ? `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}`
    : undefined
  return {
    decision,
    reason,
    ffmpegFilter,
    parameters: { brightness, contrast, saturation, gamma },
    correctionStrength: decision === 'minimal_correction' ? 'minimal' : 'none',
    colorGradeStyle: 'clean_natural',
  }
}
