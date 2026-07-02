import type { EnhancementExecutionInput, EnhancementSamplePolicy } from './enhancement-execution-types'

const MAX_SAMPLE_COUNT = 12

export function buildEnhancementSamplePolicy(input: EnhancementExecutionInput): EnhancementSamplePolicy {
  const selectedSamples: EnhancementSamplePolicy['selectedSamples'] = (input.representativeFrameArtifactIds ?? [])
    .slice(0, Math.min(input.sampleCount ?? 3, MAX_SAMPLE_COUNT))
    .map((artifactId, index) => ({
      sampleId: `enhancement-sample-${index + 1}`,
      artifactId,
      reason: index === 0 ? 'primary before/after comparison frame' : 'additional quality-risk sample',
    }))

  if (selectedSamples.length === 0) {
    selectedSamples.push({
      sampleId: `${input.mediaAssetId}-enhancement-sample-planned`,
      timeSeconds: input.selectedClipRanges?.[0]?.startSeconds ?? 0,
      reason: 'planned representative sample placeholder',
    })
  }

  return {
    sampleFirst: true,
    selectedSamples,
    maxSampleCount: MAX_SAMPLE_COUNT,
    beforeAfterComparisonRequired: true,
    rejectConditions: [
      'plastic_skin',
      'oversharpening',
      'texture_artifacts',
      'flicker_risk',
      'hallucinated_detail',
      'no_measurable_improvement',
    ],
    missingEvidenceWarnings: [
      ...(!input.sourceQualityIssueDetected && !input.approvedEnhancementReason ? ['No source quality issue or approved enhancement request was provided.'] : []),
      ...(input.mediaAnalysisReportId ? [] : ['No media analysis report was provided for enhancement evidence.']),
    ],
  }
}
