import {
  buildOcrModelDownloadReport,
  summarizeOcrModelDownloadReport,
} from '../activation/ocr-model-download'

const report = buildOcrModelDownloadReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeOcrModelDownloadReport(report))
