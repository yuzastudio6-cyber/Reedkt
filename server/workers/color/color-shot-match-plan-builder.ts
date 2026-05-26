import type { ColorAnalysisSummary, ColorExecutionInput, ColorShotMatchPlan } from './color-execution-types'

export function buildColorShotMatchPlan(input: {
  executionInput: ColorExecutionInput
  analysis: ColorAnalysisSummary
}): ColorShotMatchPlan {
  const enabled = input.analysis.shotMismatch ||
    (input.executionInput.representativeFrameArtifactIds?.length ?? 0) > 1 ||
    (input.executionInput.representativeFrameLocalPaths?.length ?? 0) > 1 ||
    Boolean(input.executionInput.referenceClipArtifactId)

  return {
    enabled,
    referenceClipArtifactId: input.executionInput.referenceClipArtifactId,
    operations: enabled
      ? [
        { operationId: 'shot-match-exposure', matchType: 'exposure', tolerance: 'balanced', reason: 'Match exposure across representative clips/frames.' },
        { operationId: 'shot-match-white-balance', matchType: 'white_balance', tolerance: 'balanced', reason: 'Match white balance without forcing a stylized cast.' },
        { operationId: 'shot-match-contrast', matchType: 'contrast', tolerance: 'balanced', reason: 'Match contrast while preserving highlight/shadow detail.' },
        { operationId: 'shot-match-saturation', matchType: 'saturation', tolerance: 'loose', reason: 'Normalize saturation without imposing an extreme look.' },
        { operationId: 'shot-match-skin-tone', matchType: 'skin_tone', tolerance: 'strict', reason: 'Protect skin tone continuity where people are visible or risk is unknown.' },
      ]
      : [],
    warnings: enabled ? [] : ['Shot matching remains metadata-only because no mismatch/reference evidence was provided.'],
  }
}
