import {
  buildMaskModelApprovalReport,
  summarizeMaskModelApprovalReport,
} from '../activation/mask-model-approval'

const report = buildMaskModelApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeMaskModelApprovalReport(report))
