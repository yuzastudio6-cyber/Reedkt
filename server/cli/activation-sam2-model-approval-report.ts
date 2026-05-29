import {
  buildSam2ModelApprovalReport,
  summarizeSam2ModelApprovalReport,
} from '../activation/sam2-model-approval'

const report = buildSam2ModelApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeSam2ModelApprovalReport(report))
