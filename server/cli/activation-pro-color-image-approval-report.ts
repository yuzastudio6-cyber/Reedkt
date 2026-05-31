import {
  buildProColorImageApprovalReport,
  summarizeProColorImageApprovalReport,
} from '../activation/pro-color-image-approval'

const report = buildProColorImageApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeProColorImageApprovalReport(report))
