import {
  buildModelApprovalPlanReport,
  summarizeModelApprovalPlan,
} from '../activation/model-approval'

const report = buildModelApprovalPlanReport()
if (report.blockers.length > 0) process.exitCode = 1

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeModelApprovalPlan(report))
