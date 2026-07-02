import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ColorAnalysisSummary, ColorExecutionInput } from './color-execution-types'

export function buildColorAnalysisSummary(input: ColorExecutionInput): ColorAnalysisSummary {
  const mock = input.mockAnalysis ?? {}
  const frameCount = mock.representativeFrameCount ??
    input.representativeFrameLocalPaths?.length ??
    input.representativeFrameArtifactIds?.length ??
    0
  const advancedAnalysisRan = mock.advancedAnalysisRan === true
  const issues: ProductionToolIssue[] = [...(mock.issues ?? [])]
  const missingEvidenceWarnings: string[] = [...(mock.missingEvidenceWarnings ?? [])]

  if (!advancedAnalysisRan) {
    issues.push({
      code: 'advanced_color_analysis_not_run',
      message: 'Milestone 15B is using deterministic placeholder/mock color analysis only.',
      severity: 'info',
    })
  }
  if (frameCount === 0) missingEvidenceWarnings.push('No representative frames were provided; color analysis uses conservative defaults.')

  return {
    representativeFrameCount: frameCount,
    colorSpaceAssumption: mock.colorSpaceAssumption ?? 'bt709',
    transferAssumption: mock.transferAssumption ?? 'bt709',
    hdrDetected: mock.hdrDetected ?? false,
    underexposed: mock.underexposed ?? false,
    overexposed: mock.overexposed ?? false,
    whiteBalanceIssue: mock.whiteBalanceIssue ?? false,
    shotMismatch: mock.shotMismatch ?? (frameCount > 1 || Boolean(input.referenceClipArtifactId)),
    skinToneRisk: mock.skinToneRisk ?? 'unknown',
    highlightRisk: mock.highlightRisk ?? (mock.overexposed ? 'medium' : 'low'),
    shadowRisk: mock.shadowRisk ?? (mock.underexposed ? 'medium' : 'low'),
    saturationRisk: mock.saturationRisk ?? 'low',
    histogramSummary: mock.histogramSummary,
    issues,
    confidence: mock.confidence ?? (advancedAnalysisRan ? 0.78 : frameCount > 0 ? 0.52 : 0.38),
    advancedAnalysisRan,
    missingEvidenceWarnings,
  }
}
