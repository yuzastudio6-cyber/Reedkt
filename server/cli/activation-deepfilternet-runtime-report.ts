import {
  buildDeepFilterNetRuntimeReport,
  summarizeDeepFilterNetRuntimeReport,
} from '../activation/deepfilternet-runtime'

const report = buildDeepFilterNetRuntimeReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeDeepFilterNetRuntimeReport(report))
