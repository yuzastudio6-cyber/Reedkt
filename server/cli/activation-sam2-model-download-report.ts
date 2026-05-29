import {
  buildSam2ModelDownloadReport,
  summarizeSam2ModelDownloadReport,
} from '../activation/sam2-model-download'

const report = buildSam2ModelDownloadReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeSam2ModelDownloadReport(report))
