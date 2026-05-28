import {
  buildRealVideoSmartCutReport,
  executeRealVideoSmartCut,
  summarizeRealVideoSmartCutReport,
} from '../activation/real-video-smart-cut'

const jsonOutput = process.argv.includes('--json')
const mode = readArg('--mode') ?? 'report'

if (mode === 'execute') {
  const runtimeReport = await executeRealVideoSmartCut()
  if (jsonOutput) console.log(JSON.stringify(runtimeReport, null, 2))
  else {
    const report = buildRealVideoSmartCutReport()
    console.log(summarizeRealVideoSmartCutReport(report))
  }
} else {
  const report = buildRealVideoSmartCutReport()
  if (jsonOutput) console.log(JSON.stringify(report, null, 2))
  else console.log(summarizeRealVideoSmartCutReport(report))
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
