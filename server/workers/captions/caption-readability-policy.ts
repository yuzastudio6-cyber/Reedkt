import type { CaptionPolicyScore, CaptionSegment } from './caption-worker-types'

export function scoreCaptionReadability(captions: CaptionSegment[]): CaptionPolicyScore {
  const issues: CaptionPolicyScore['issues'] = []

  for (const caption of captions) {
    const duration = caption.endSeconds - caption.startSeconds
    const wordCount = caption.words.length
    const wordsPerSecond = duration > 0 ? wordCount / duration : Number.POSITIVE_INFINITY

    if (caption.lines.some((line) => line.length > 34)) {
      issues.push({
        code: 'caption_line_too_long',
        message: `Caption ${caption.captionId} has a line longer than mobile-readable policy.`,
        severity: 'warning',
      })
    }
    if (caption.lines.length > 2) {
      issues.push({
        code: 'caption_too_many_lines',
        message: `Caption ${caption.captionId} exceeds the two-line default.`,
        severity: 'blocking',
      })
    }
    if (wordsPerSecond > 4.5) {
      issues.push({
        code: 'caption_words_per_second_high',
        message: `Caption ${caption.captionId} is too dense at ${wordsPerSecond.toFixed(1)} words/sec.`,
        severity: 'warning',
      })
    }
    if (duration < 0.4) {
      issues.push({
        code: 'caption_duration_too_short',
        message: `Caption ${caption.captionId} is shorter than readability policy.`,
        severity: 'warning',
      })
    }
  }

  return {
    score: Math.max(0, 1 - issues.length * 0.12),
    threshold: 0.78,
    issues,
    recommendations: issues.length > 0
      ? ['Split long captions, reduce word density, or extend caption duration before preview/final export.']
      : ['Caption readability passes deterministic Milestone 7 checks.'],
  }
}
