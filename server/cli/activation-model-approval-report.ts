import {
  buildModelApprovalReport,
  summarizeModelApprovalReport,
} from '../activation/model-approval'

const report = buildModelApprovalReport()
if (report.blockers.length > 0) process.exitCode = 1

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeModelApprovalReport(report))
