import type { MediaAnalysisReport } from '../../../src/backend/contracts/media-analysis-report'
import type { CaptionPlacement, CaptionPolicyIssue } from './caption-worker-types'

export function chooseCaptionPlacement(input: {
  requestedPlacement?: CaptionPlacement
  mediaAnalysisReport?: MediaAnalysisReport
  placeholderNoCoverZones?: string[]
}): { placement: CaptionPlacement; issues: CaptionPolicyIssue[] } {
  const issues: CaptionPolicyIssue[] = []

  if (!input.mediaAnalysisReport?.visualAnalysis.safeZoneReportArtifactId) {
    issues.push({
      code: 'safe_zone_analysis_missing',
      message: 'Face/product/safe-zone analysis has not run yet; caption placement is conservative.',
      severity: 'warning',
    })
  }

  if (!input.mediaAnalysisReport?.ocrAnalysis.textRegionsArtifactId) {
    issues.push({
      code: 'ocr_text_regions_missing',
      message: 'OCR text-region analysis has not run yet; caption no-cover zones are incomplete.',
      severity: 'warning',
    })
  }

  return {
    placement: input.requestedPlacement ?? 'bottom_safe',
    issues,
  }
}
