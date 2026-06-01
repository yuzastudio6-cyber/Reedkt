import {
  buildVlmModelDownloadReportFromCurrentMetadata,
  summarizeVlmModelDownloadReport,
} from '../activation/vlm-model-download'

const report = await buildVlmModelDownloadReportFromCurrentMetadata()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeVlmModelDownloadReport(report))
