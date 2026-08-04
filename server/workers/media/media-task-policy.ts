import type { MediaFoundationTask, MediaProbeResult } from './media-worker-types'

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const GIB = 1024 ** 3

export interface MediaTaskBudgetInput {
  task: MediaFoundationTask
  probe?: Pick<MediaProbeResult, 'durationSeconds' | 'sizeBytes'>
  sourceSizeBytes?: number
}

/**
 * Derives a bounded wall-clock budget from source duration/size. This is a
 * command safety ceiling, not a progress or worker-lease substitute.
 */
export function deriveMediaTaskTimeoutMs(input: MediaTaskBudgetInput): number {
  const durationSeconds = positiveNumber(input.probe?.durationSeconds) ?? 0
  const sizeBytes = positiveNumber(input.probe?.sizeBytes) ?? positiveNumber(input.sourceSizeBytes) ?? 0
  const sizeGiB = sizeBytes / GIB

  if (input.task === 'probe') {
    return clamp(2 * MINUTE + sizeGiB * 15 * SECOND, 2 * MINUTE, 30 * MINUTE)
  }
  if (input.task === 'create_proxy') {
    return clamp(10 * MINUTE + durationSeconds * 4 * SECOND + sizeGiB * 30 * SECOND, 10 * MINUTE, 24 * HOUR)
  }
  if (input.task === 'extract_audio') {
    return clamp(5 * MINUTE + durationSeconds * 2 * SECOND, 5 * MINUTE, 12 * HOUR)
  }
  if (input.task === 'extract_keyframes' || input.task === 'extract_representative_frames') {
    return clamp(5 * MINUTE + sizeGiB * 5 * SECOND, 5 * MINUTE, 2 * HOUR)
  }
  return clamp(5 * MINUTE + durationSeconds * SECOND, 5 * MINUTE, 2 * HOUR)
}

function positiveNumber(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.round(Math.min(maximum, Math.max(minimum, value)))
}
