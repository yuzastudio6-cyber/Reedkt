import {
  buildEnhancementModelDownloadReport,
  summarizeEnhancementModelDownloadReport,
} from '../activation/enhancement-model-download'

const report = buildEnhancementModelDownloadReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeEnhancementModelDownloadReport(report))
