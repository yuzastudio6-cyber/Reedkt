import type {
  CaptionReadabilityRisk,
  CaptionTimingPlanRecord,
  MasterTimingMapRecord,
  StoryTimingQACheckRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

export function countCaptionWords(captionText: string): number {
  return captionText.trim().split(/\s+/).filter(Boolean).length
}

export function estimateCaptionReadabilityDuration(captionText: string): number {
  const words = countCaptionWords(captionText)

  if (words <= 4) {
    return 1.1
  }

  if (words <= 9) {
    return 1.8
  }

  return Math.min(3, Math.max(2.4, words * 0.22))
}

export function detectCaptionTooFast(captionText: string, durationSeconds: number): boolean {
  return durationSeconds < estimateCaptionReadabilityDuration(captionText) - 0.15
}

export function detectCaptionTooLong(captionText: string, durationSeconds: number): boolean {
  return countCaptionWords(captionText) <= 5 && durationSeconds > 4.2
}

export function detectCaptionTooManyWords(captionText: string): boolean {
  return countCaptionWords(captionText) > 12
}

export function detectCaptionRevealTooEarly(startTimeSeconds: number, speechStartSeconds: number): boolean {
  return startTimeSeconds < speechStartSeconds - 0.25
}

export function detectCaptionLaggingSpeech(startTimeSeconds: number, speechStartSeconds: number): boolean {
  return startTimeSeconds > speechStartSeconds + 0.35
}

export function getCaptionReadabilityRisk(input: {
  captionText: string
  startTimeSeconds: number
  endTimeSeconds: number
  speechStartSeconds: number
}): CaptionReadabilityRisk {
  const duration = input.endTimeSeconds - input.startTimeSeconds

  if (detectCaptionTooFast(input.captionText, duration)) return 'too_fast'
  if (detectCaptionTooLong(input.captionText, duration)) return 'too_long'
  if (detectCaptionTooManyWords(input.captionText)) return 'too_many_words'
  if (detectCaptionRevealTooEarly(input.startTimeSeconds, input.speechStartSeconds)) return 'reveals_too_early'
  if (detectCaptionLaggingSpeech(input.startTimeSeconds, input.speechStartSeconds)) return 'lags_speech'

  return 'none'
}

export function createCaptionReadabilityCheck(
  masterTimingMap: MasterTimingMapRecord,
  captionTimingPlan: CaptionTimingPlanRecord,
): StoryTimingQACheckRecord {
  const risk = captionTimingPlan.readabilityRisk
  const failed = risk !== 'none'

  return {
    id: createMockId('caption-readability-check'),
    masterTimingMapId: masterTimingMap.id,
    projectId: masterTimingMap.projectId,
    editPlanId: masterTimingMap.editPlanId,
    segmentId: captionTimingPlan.segmentId,
    checkType: 'caption_readability_duration',
    status: failed ? 'requires_adjustment' : 'passed',
    score: failed ? 72 : 96,
    timeRange: {
      startSeconds: captionTimingPlan.startTimeSeconds,
      endSeconds: captionTimingPlan.endTimeSeconds,
    },
    relatedEventIds: [],
    relatedAnchorIds: captionTimingPlan.emphasisWordAnchors,
    summary: failed
      ? `Caption readability risk detected: ${risk}.`
      : 'Caption read window is acceptable for mock timing review.',
    recommendedFix: failed ? 'Split, extend, or retime the caption before render readiness.' : undefined,
    blocksRender: risk === 'too_fast' || risk === 'too_many_words',
    requiresManualReview: risk === 'manual_review',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      captionTimingPlanId: captionTimingPlan.id,
      mockOnly: true,
    },
  }
}

export function createCaptionReadabilitySummary(captionTimingPlans: CaptionTimingPlanRecord[]): string {
  const risky = captionTimingPlans.filter((plan) => plan.readabilityRisk !== 'none').length

  return `${captionTimingPlans.length} caption timing plan(s) checked; ${risky} readability risk(s) found.`
}
