import {
  buildRealVideoColorCorrectionReport,
  executeRealVideoColorCorrection,
  summarizeRealVideoColorCorrectionReport,
  writePhase32CommandPlan,
} from '../activation/real-video-color-correction'

const jsonOutput = process.argv.includes('--json')
const mode = readArg('--mode') ?? 'report'

if (mode === 'execute') {
  const runtimeReport = await executeRealVideoColorCorrection()
  if (jsonOutput) console.log(JSON.stringify(runtimeReport, null, 2))
  else {
    const report = buildRealVideoColorCorrectionReport()
    console.log(summarizeRealVideoColorCorrectionReport(report))
  }
} else if (mode === 'plan') {
  const outputPath = await writePhase32CommandPlan()
  if (jsonOutput) console.log(JSON.stringify({ ok: true, outputPath }, null, 2))
  else console.log(`Wrote Phase 32 command plan to ${outputPath}`)
} else {
  const report = buildRealVideoColorCorrectionReport()
  if (jsonOutput) console.log(JSON.stringify(report, null, 2))
  else console.log(summarizeRealVideoColorCorrectionReport(report))
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
