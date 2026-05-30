import {
  buildDeepFilterNetDownloadReport,
  summarizeDeepFilterNetDownloadReport,
} from '../activation/audio-ai-download'

const report = buildDeepFilterNetDownloadReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeDeepFilterNetDownloadReport(report))
