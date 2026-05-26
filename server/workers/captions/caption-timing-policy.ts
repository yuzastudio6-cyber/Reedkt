import type { CaptionPolicyScore, CaptionSegment } from './caption-worker-types'

export function scoreCaptionTiming(captions: CaptionSegment[]): CaptionPolicyScore {
  const issues: CaptionPolicyScore['issues'] = []
  const sorted = [...captions].sort((a, b) => a.startSeconds - b.startSeconds)

  for (const [index, caption] of sorted.entries()) {
    if (caption.startSeconds < 0 || caption.endSeconds < 0) {
      issues.push({
        code: 'caption_negative_timestamp',
        message: `Caption ${caption.captionId} has a negative timestamp.`,
        severity: 'blocking',
      })
    }
    if (caption.endSeconds < caption.startSeconds) {
      issues.push({
        code: 'caption_end_before_start',
        message: `Caption ${caption.captionId} ends before it starts.`,
        severity: 'blocking',
      })
    }

    const previous = sorted[index - 1]
    if (previous && caption.startSeconds < previous.endSeconds) {
      issues.push({
        code: 'caption_overlap',
        message: `Caption ${caption.captionId} overlaps the prior caption.`,
        severity: 'blocking',
      })
    }

    const firstWord = caption.words[0]
    const lastWord = caption.words.at(-1)
    if (firstWord && Math.abs(firstWord.startSeconds - caption.startSeconds) > 0.35) {
      issues.push({
        code: 'caption_word_alignment_risk',
        message: `Caption ${caption.captionId} may be misaligned with its first word timestamp.`,
        severity: 'warning',
      })
    }
    if (lastWord && caption.endSeconds < lastWord.endSeconds) {
      issues.push({
        code: 'caption_mid_word_split_risk',
        message: `Caption ${caption.captionId} ends before the last word completes.`,
        severity: 'blocking',
      })
    }
  }

  return {
    score: Math.max(0, 1 - issues.length * 0.15),
    threshold: 0.8,
    issues,
    recommendations: issues.length > 0
      ? ['Resolve overlaps, invalid timestamps, and word alignment risks before preview/final export.']
      : ['Caption timing passes deterministic Milestone 7 checks.'],
  }
}
