import type { CaptionSegment } from './caption-worker-types'

export function buildSrtCaptionText(captions: CaptionSegment[]): string {
  return captions.map((caption, index) => [
    String(index + 1),
    `${formatSrtTime(caption.startSeconds)} --> ${formatSrtTime(caption.endSeconds)}`,
    caption.lines.join('\n'),
  ].join('\n')).join('\n\n')
}

export function formatSrtTime(seconds: number): string {
  if (seconds < 0) throw new Error('SRT timecode cannot be negative.')
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const wholeSeconds = Math.floor(seconds % 60)
  const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000)
  return `${pad(hours)}:${pad(minutes)}:${pad(wholeSeconds)},${String(milliseconds).padStart(3, '0')}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
