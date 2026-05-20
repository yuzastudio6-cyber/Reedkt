import type { EditComplexity } from '../../types/planning'
import type { SignatureSystem } from '../../types/signature-systems'
import type { TimingEventRecord } from '../../types/storytiming'

const wordsIn = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length

export function estimateGraphicReadabilityDuration(
  text: string,
  editComplexity: EditComplexity = 'pro_edit',
): number {
  const baseSeconds = editComplexity === 'basic_edit' ? 1.6 : 1.4
  const wordSeconds = wordsIn(text) * 0.22
  return Math.max(baseSeconds, Math.min(4.8, baseSeconds + wordSeconds))
}

export function estimateOverlayComprehensionDuration(
  signatureSystem: SignatureSystem,
  label: string,
  editComplexity: EditComplexity = 'pro_edit',
): number {
  if (signatureSystem === 'graphic_design') {
    return estimateGraphicReadabilityDuration(label, editComplexity)
  }

  if (signatureSystem === 'real_motion') {
    return editComplexity === 'premium_signature_edit' ? 1.8 : 1.4
  }

  if (signatureSystem === 'stroke_motion') {
    return 0.9
  }

  return 1.2
}

export function detectOverlayTooFast(
  event: TimingEventRecord,
  minDurationSeconds = estimateOverlayComprehensionDuration(event.signatureSystem ?? 'none', event.label),
): boolean {
  return event.durationSeconds > 0 && event.durationSeconds < minDurationSeconds
}

export function detectOverlayTooLong(
  event: TimingEventRecord,
  maxDurationSeconds = event.trackType === 'real_motion' ? 4.5 : 6,
): boolean {
  return event.durationSeconds > maxDurationSeconds
}

export function createSignatureReadabilitySummary(events: TimingEventRecord[]): string {
  const readableEvents = events.filter(
    (event) => event.trackType === 'graphic_design' || event.trackType === 'stroke_motion' || event.trackType === 'real_motion',
  )
  const tooFast = readableEvents.filter((event) => detectOverlayTooFast(event)).length
  const tooLong = readableEvents.filter((event) => detectOverlayTooLong(event)).length

  return `${readableEvents.length} signature overlay event(s) checked for comprehension timing; ${tooFast} too fast and ${tooLong} too long.`
}
