export function buildPhase31MuxCommandPlan(input: {
  sourcePath?: string
  normalizedAudioPath?: string
  outputPath?: string
} = {}): string[] {
  return [
    'ffmpeg',
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input.sourcePath ?? '[worker-temp-input-final-export.mp4]',
    '-i',
    input.normalizedAudioPath ?? '[worker-temp-normalized-audio.m4a]',
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    input.outputPath ?? '[worker-temp-audio-normalized-export.mp4]',
  ]
}
