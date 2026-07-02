import { buildEnhancementSamplePolicy } from './enhancement-sample-policy'
import type { EnhancementExecutionInput, EnhancementTaskPlan, EnhancementToolId } from './enhancement-execution-types'

export function buildEnhancementTaskPlan(input: EnhancementExecutionInput): EnhancementTaskPlan {
  const samplePolicy = buildEnhancementSamplePolicy(input)
  const targetScale = input.targetScale ?? 2
  const recommendedNoEnhancement = !input.sourceQualityIssueDetected && !input.approvedEnhancementReason
  const warnings = [
    ...samplePolicy.missingEvidenceWarnings,
    ...(targetScale > 2 ? ['Target scale above 2x requires careful artifact QA.'] : []),
    ...(recommendedNoEnhancement ? ['No enhancement is recommended until source quality evidence or approved request exists.'] : []),
  ]

  return {
    taskPlanId: `enhancement-task-${input.mediaAssetId}-${input.enhancementIntent}`,
    enhancementIntent: input.enhancementIntent,
    primaryTool: recommendedNoEnhancement ? 'none' : 'real_esrgan',
    fallbackTools: recommendedNoEnhancement ? ['none'] : fallbackTools(input),
    selectedSamples: samplePolicy.selectedSamples,
    selectedClipRanges: input.selectedClipRanges ?? [],
    sampleFirstPolicy: samplePolicy,
    targetScale,
    targetResolution: input.targetResolution,
    expectedArtifacts: expectedArtifacts(input, recommendedNoEnhancement),
    modelWeightRequirements: recommendedNoEnhancement ? [] : ['real_esrgan_model'],
    qaGatePlan: ['enhancement_artifacts', 'render_asset_integrity'],
    previewAllowed: input.mode === 'local_dev' && input.enableFfmpegFallbackPreview === true,
    finalRenderAllowed: false,
    reasons: [
      recommendedNoEnhancement ? 'No enhancement is selected because no quality issue or approved reason exists.' : 'Real-ESRGAN is planned as sample-first enhancement only.',
      'Enhancement must be evaluated on samples before any full-clip use.',
      'M15D does not final render/export enhanced media.',
    ],
    warnings,
    recommendedNoEnhancement,
  }
}

function fallbackTools(input: EnhancementExecutionInput): EnhancementToolId[] {
  if (input.enhancementIntent === 'enhance_thumbnail' || input.enhancementIntent === 'upscale_image') return ['sharp', 'ffmpeg']
  return ['ffmpeg', 'opencv', 'sharp']
}

function expectedArtifacts(input: EnhancementExecutionInput, recommendedNoEnhancement: boolean): EnhancementTaskPlan['expectedArtifacts'] {
  const artifacts: EnhancementTaskPlan['expectedArtifacts'] = ['qa_report']
  artifacts.unshift(input.enhancementIntent === 'upscale_image' || input.enhancementIntent === 'enhance_thumbnail' ? 'representative_frame' : 'enhanced_video')
  if (input.enableFfmpegFallbackPreview === true && !recommendedNoEnhancement) artifacts.push('preview_video')
  return [...new Set(artifacts)]
}
