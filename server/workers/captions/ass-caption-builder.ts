import type { CaptionSegment, CaptionStylePreset } from './caption-worker-types'

export function buildAssCaptionText(captions: CaptionSegment[], style: CaptionStylePreset): string {
  const events = captions.map((caption) => {
    const text = caption.lines.map((line) => sanitizeAssText(line)).join('\\N')
    return `Dialogue: 0,${formatAssTime(caption.startSeconds)},${formatAssTime(caption.endSeconds)},Default,,0,0,0,,${text}`
  }).join('\n')

  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,${sanitizeAssField(style.fontFamilyFallback)},54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H66000000,0,0,0,0,100,100,0,0,1,3,1,2,72,72,120,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
${events}
`
}

export function sanitizeAssText(text: string): string {
  if (/[{}]/.test(text) || /\\[A-Za-z]+/.test(text)) {
    throw new Error('Unsafe ASS override tags are not allowed in Milestone 7 captions.')
  }
  return text.replace(/\r?\n/g, '\\N')
}

function sanitizeAssField(text: string): string {
  return text.replace(/[,{}\\]/g, ' ').trim()
}

function formatAssTime(seconds: number): string {
  if (seconds < 0) throw new Error('ASS timecode cannot be negative.')
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const wholeSeconds = Math.floor(seconds % 60)
  const centiseconds = Math.round((seconds - Math.floor(seconds)) * 100)
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}
