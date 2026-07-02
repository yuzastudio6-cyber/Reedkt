import type { CaptionSegment } from './caption-worker-types'

export function buildWebVttCaptionText(captions: CaptionSegment[]): string {
  const cues = captions.map((caption) => [
    `${formatWebVttTime(caption.startSeconds)} --> ${formatWebVttTime(caption.endSeconds)}`,
    caption.lines.join('\n'),
  ].join('\n')).join('\n\n')
  return `WEBVTT\n\n${cues}\n`
}

export function formatWebVttTime(seconds: number): string {
  if (seconds < 0) throw new Error('WebVTT timecode cannot be negative.')
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const wholeSeconds = Math.floor(seconds % 60)
  const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000)
  return `${pad(hours)}:${pad(minutes)}:${pad(wholeSeconds)}.${String(milliseconds).padStart(3, '0')}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
