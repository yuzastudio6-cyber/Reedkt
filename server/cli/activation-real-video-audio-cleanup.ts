import {
  buildRealVideoAudioCleanupReport,
  executeRealVideoAudioCleanup,
  summarizeRealVideoAudioCleanupReport,
  writePhase31CommandPlan,
} from '../activation/real-video-audio-cleanup'

const jsonOutput = process.argv.includes('--json')
const mode = readArg('--mode') ?? 'report'

if (mode === 'execute') {
  const runtimeReport = await executeRealVideoAudioCleanup()
  if (jsonOutput) console.log(JSON.stringify(runtimeReport, null, 2))
  else {
    const report = buildRealVideoAudioCleanupReport()
    console.log(summarizeRealVideoAudioCleanupReport(report))
  }
} else if (mode === 'plan') {
  const outputPath = await writePhase31CommandPlan()
  if (jsonOutput) console.log(JSON.stringify({ ok: true, outputPath }, null, 2))
  else console.log(`Wrote Phase 31 command plan to ${outputPath}`)
} else {
  const report = buildRealVideoAudioCleanupReport()
  if (jsonOutput) console.log(JSON.stringify(report, null, 2))
  else console.log(summarizeRealVideoAudioCleanupReport(report))
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
