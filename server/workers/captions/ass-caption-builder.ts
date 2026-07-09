import type { CaptionSegment, CaptionStylePreset } from './caption-worker-types'

export function buildAssCaptionText(captions: CaptionSegment[], style: CaptionStylePreset): string {
  const assStyle = resolveAssStyle(style)
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
Style: Default,${assStyle.fontName},${assStyle.fontSize},&H00FFFFFF,&H00FFFFFF,&H00000000,${assStyle.backColour},${assStyle.bold},0,0,0,100,100,0,0,${assStyle.borderStyle},${assStyle.outline},${assStyle.shadow},${assStyle.alignment},72,72,${assStyle.marginV},1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
${events}
`
}

function resolveAssStyle(style: CaptionStylePreset): {
  fontName: string
  fontSize: number
  backColour: string
  bold: number
  borderStyle: number
  outline: number
  shadow: number
  alignment: number
  marginV: number
} {
  const fontName = sanitizeAssField(style.fontFamilyFallback.split(',')[0] ?? 'Arial') || 'Arial'
  switch (style.presetId) {
    case 'bold_social_captions':
      return { fontName, fontSize: 66, backColour: '&H70000000', bold: -1, borderStyle: 1, outline: 4, shadow: 2, alignment: 2, marginV: 330 }
    case 'keyword_emphasis_captions':
      return { fontName, fontSize: 62, backColour: '&H68000000', bold: -1, borderStyle: 1, outline: 4, shadow: 2, alignment: 2, marginV: 310 }
    case 'small_premium_subtitle':
      return { fontName, fontSize: 46, backColour: '&H44000000', bold: 0, borderStyle: 1, outline: 2, shadow: 1, alignment: 2, marginV: 150 }
    case 'documentary_lower_third':
      return { fontName, fontSize: 48, backColour: '&H50000000', bold: 0, borderStyle: 1, outline: 2, shadow: 1, alignment: 1, marginV: 150 }
    default:
      return { fontName, fontSize: 54, backColour: '&H66000000', bold: 0, borderStyle: 1, outline: 3, shadow: 1, alignment: 2, marginV: 140 }
  }
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
