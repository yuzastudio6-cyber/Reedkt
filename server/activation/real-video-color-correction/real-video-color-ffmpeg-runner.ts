export function buildPhase32SignalStatsCommandPlan(inputPath = '[worker-temp-input-phase31-export.mp4]'): string[] {
  return [
    'ffmpeg',
    '-hide_banner',
    '-nostdin',
    '-ss',
    '[sample-time]',
    '-i',
    inputPath,
    '-frames:v',
    '1',
    '-vf',
    'signalstats,metadata=mode=print:file=[worker-temp-signalstats.txt]',
    '-f',
    'null',
    '-',
  ]
}
