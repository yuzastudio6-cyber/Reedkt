export function buildPhase32ColorExportCommandPlan(input: {
  sourcePath?: string
  outputPath?: string
  ffmpegFilter?: string
} = {}): string[] {
  if (!input.ffmpegFilter) {
    return [
      'ffmpeg',
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.sourcePath ?? '[worker-temp-input-phase31-export.mp4]',
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      input.outputPath ?? '[worker-temp-color-reviewed-export.mp4]',
    ]
  }
  return [
    'ffmpeg',
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input.sourcePath ?? '[worker-temp-input-phase31-export.mp4]',
    '-vf',
    input.ffmpegFilter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'copy',
    '-movflags',
    '+faststart',
    input.outputPath ?? '[worker-temp-color-corrected-export.mp4]',
  ]
}
