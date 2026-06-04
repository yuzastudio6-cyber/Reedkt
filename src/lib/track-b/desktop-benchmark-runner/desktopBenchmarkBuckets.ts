import type { DesktopBenchmarkPerformanceBucket, DesktopBenchmarkToolAvailability } from './desktopBenchmarkTypes'

export function bucketDurationMs(value: number | undefined): DesktopBenchmarkPerformanceBucket {
  if (!Number.isFinite(value) || value === undefined) return 'unknown'
  if (value <= 80) return 'fast'
  if (value <= 250) return 'mid'
  return 'slow'
}

export function bucketRuntimeTools(input: {
  nodeAvailable?: DesktopBenchmarkToolAvailability
  pythonAvailable?: DesktopBenchmarkToolAvailability
  ffmpegAvailable?: DesktopBenchmarkToolAvailability
  ffprobeAvailable?: DesktopBenchmarkToolAvailability
}): 'available' | 'partial' | 'unavailable' | 'unknown' {
  const values = [input.nodeAvailable, input.pythonAvailable, input.ffmpegAvailable, input.ffprobeAvailable]
  const known = values.filter((value) => value !== undefined && value !== 'unknown')
  if (known.length === 0) return 'unknown'
  if (known.every((value) => value === true)) return 'available'
  if (known.every((value) => value === false)) return 'unavailable'
  return 'partial'
}

export function bucketHashPrefix(value: string): string {
  return value.slice(0, 12)
}
