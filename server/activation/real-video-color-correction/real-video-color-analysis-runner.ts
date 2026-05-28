import type { RealVideoColorAnalysisSummary, RealVideoColorSample } from './real-video-color-correction-types'

export function buildColorAnalysisSummary(input: {
  durationSeconds?: number
  colorSpace?: string
  colorTransfer?: string
  samples: RealVideoColorSample[]
}): RealVideoColorAnalysisSummary {
  const yAvg = average(input.samples, 'YAVG')
  const yMin = min(input.samples, 'YMIN')
  const yMax = max(input.samples, 'YMAX')
  const satAvg = average(input.samples, 'SATAVG')
  const missingEvidenceWarnings: string[] = []
  if (input.samples.length < 3) missingEvidenceWarnings.push('Fewer than three representative frame samples were available.')
  if (yAvg === undefined) missingEvidenceWarnings.push('Luma average was unavailable from signalstats.')
  if (satAvg === undefined) missingEvidenceWarnings.push('Saturation average was unavailable from signalstats.')
  return {
    durationSeconds: input.durationSeconds,
    sampledFrameCount: input.samples.length,
    colorSpaceAssumption: input.colorSpace ?? 'bt709_or_source_unspecified',
    transferAssumption: input.colorTransfer ?? 'bt709_or_source_unspecified',
    underexposedRisk: risk(yAvg !== undefined && yAvg < 72, yAvg !== undefined && yAvg < 86),
    overexposedRisk: risk(yAvg !== undefined && yAvg > 205, yAvg !== undefined && yAvg > 190),
    highlightClippingRisk: risk(yMax !== undefined && yMax > 252, yMax !== undefined && yMax > 246),
    shadowCrushingRisk: risk(yMin !== undefined && yMin < 3, yMin !== undefined && yMin < 8),
    saturationRisk: risk(satAvg !== undefined && (satAvg > 145 || satAvg < 25), satAvg !== undefined && (satAvg > 125 || satAvg < 35)),
    whiteBalanceIssue: 'unknown',
    skinToneRisk: 'warning_only_not_measured',
    shotMismatch: 'not_applicable_single_clip',
    missingEvidenceWarnings,
  }
}

function average(samples: RealVideoColorSample[], key: string): number | undefined {
  const values = samples.map((sample) => sample.stats[key]).filter((value): value is number => Number.isFinite(value))
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined
}

function min(samples: RealVideoColorSample[], key: string): number | undefined {
  const values = samples.map((sample) => sample.stats[key]).filter((value): value is number => Number.isFinite(value))
  return values.length ? Math.min(...values) : undefined
}

function max(samples: RealVideoColorSample[], key: string): number | undefined {
  const values = samples.map((sample) => sample.stats[key]).filter((value): value is number => Number.isFinite(value))
  return values.length ? Math.max(...values) : undefined
}

function risk(high: boolean, warning: boolean): 'low' | 'warning' | 'high' {
  if (high) return 'high'
  if (warning) return 'warning'
  return 'low'
}
