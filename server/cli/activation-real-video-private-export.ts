import {
  buildRealVideoPrivateExportReport,
  executeRealVideoPrivateExport,
  summarizeRealVideoPrivateExportReport,
  writePhase30CommandPlan,
} from '../activation/real-video-private-export'

const jsonOutput = process.argv.includes('--json')
const mode = readArg('--mode') ?? 'report'

if (mode === 'execute') {
  const runtimeReport = await executeRealVideoPrivateExport()
  if (jsonOutput) console.log(JSON.stringify(runtimeReport, null, 2))
  else {
    const report = buildRealVideoPrivateExportReport()
    console.log(summarizeRealVideoPrivateExportReport(report))
  }
} else if (mode === 'plan') {
  const outputPath = await writePhase30CommandPlan()
  if (jsonOutput) console.log(JSON.stringify({ ok: true, outputPath }, null, 2))
  else console.log(`Wrote Phase 30 command plan to ${outputPath}`)
} else {
  const report = buildRealVideoPrivateExportReport()
  if (jsonOutput) console.log(JSON.stringify(report, null, 2))
  else console.log(summarizeRealVideoPrivateExportReport(report))
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
