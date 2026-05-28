import {
  buildEnhancementModelApprovalReport,
  summarizeEnhancementModelApprovalReport,
} from '../activation/enhancement-model-approval'

const report = buildEnhancementModelApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeEnhancementModelApprovalReport(report))
