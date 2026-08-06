import type { OfflineColorPixelAnalysis } from './offline-media-binary-types'

export const OFFLINE_CROSS_CHUNK_TECHNICAL_SPLIT_MAXIMUM_MEAN_LUMA_DELTA =
  18 as const
export const OFFLINE_CROSS_CHUNK_TECHNICAL_SPLIT_MAXIMUM_CHROMATICITY_DELTA =
  0.06 as const
export const OFFLINE_CROSS_CHUNK_EDITORIAL_CUT_MAXIMUM_MEAN_LUMA_DELTA =
  36 as const
export const OFFLINE_CROSS_CHUNK_EDITORIAL_CUT_MAXIMUM_CHROMATICITY_DELTA =
  0.12 as const

export interface OfflineCrossChunkColorContinuityEvaluation {
  boundaryClass: 'technical_continuation' | 'editorial_cut'
  meanLumaDelta: number
  maximumMeanLumaDelta: 18 | 36
  chromaticityDelta: number
  maximumChromaticityDelta: 0.06 | 0.12
  clippingSafe: boolean
  withinContinuityTolerance: boolean
  mismatchDisposition: 'block_finalization' | 'review_required'
  outcome: 'passed' | 'blocked' | 'review_required'
}

export function evaluateOfflineMediaBinaryCrossChunkColorContinuity(input: {
  boundaryBefore: 'continuous_technical_split' | 'approved_hard_cut'
  left: OfflineColorPixelAnalysis
  right: OfflineColorPixelAnalysis
}): OfflineCrossChunkColorContinuityEvaluation {
  const leftChromaticity = chromaticity(input.left)
  const rightChromaticity = chromaticity(input.right)
  const meanLumaDelta = Math.abs(input.left.meanLuma - input.right.meanLuma)
  const chromaticityDelta = leftChromaticity.reduce(
    (total, value, index) =>
      total + Math.abs(value - rightChromaticity[index]!),
    0,
  )
  const technicalSplit = input.boundaryBefore === 'continuous_technical_split'
  const maximumMeanLumaDelta = technicalSplit
    ? OFFLINE_CROSS_CHUNK_TECHNICAL_SPLIT_MAXIMUM_MEAN_LUMA_DELTA
    : OFFLINE_CROSS_CHUNK_EDITORIAL_CUT_MAXIMUM_MEAN_LUMA_DELTA
  const maximumChromaticityDelta = technicalSplit
    ? OFFLINE_CROSS_CHUNK_TECHNICAL_SPLIT_MAXIMUM_CHROMATICITY_DELTA
    : OFFLINE_CROSS_CHUNK_EDITORIAL_CUT_MAXIMUM_CHROMATICITY_DELTA
  const clippingSafe = [input.left, input.right].every((analysis) =>
    analysis.meanLuma > 8 && analysis.meanLuma < 247 &&
    analysis.blackLumaFraction < 0.98 &&
    analysis.whiteLumaFraction < 0.98)
  const withinContinuityTolerance = clippingSafe &&
    meanLumaDelta <= maximumMeanLumaDelta &&
    chromaticityDelta <= maximumChromaticityDelta
  const outcome = !clippingSafe ||
      (technicalSplit && !withinContinuityTolerance)
    ? 'blocked' as const
    : withinContinuityTolerance
      ? 'passed' as const
      : 'review_required' as const
  return {
    boundaryClass: technicalSplit
      ? 'technical_continuation'
      : 'editorial_cut',
    meanLumaDelta: rounded(meanLumaDelta, 4),
    maximumMeanLumaDelta,
    chromaticityDelta: rounded(chromaticityDelta, 6),
    maximumChromaticityDelta,
    clippingSafe,
    withinContinuityTolerance,
    mismatchDisposition: technicalSplit
      ? 'block_finalization'
      : 'review_required',
    outcome,
  }
}

function chromaticity(analysis: OfflineColorPixelAnalysis): number[] {
  const total = Math.max(
    1,
    analysis.meanRed + analysis.meanGreen + analysis.meanBlue,
  )
  return [
    analysis.meanRed / total,
    analysis.meanGreen / total,
    analysis.meanBlue / total,
  ]
}

function rounded(value: number, digits: number): number {
  return Number(value.toFixed(digits))
}
