import { runProviderModelApproval, summarizeProviderModelApprovalReport } from '../activation/provider-model-approval-policy'

const execute = process.argv.includes('--execute')

runProviderModelApproval({ execute })
  .then(({ executionReport, localReportPath, iamChanges }) => {
    console.log(summarizeProviderModelApprovalReport({ ...executionReport, reportId: 'activation-provider-1-deepseek-qwen-api-approval-policy', executionReport, createdAt: executionReport.createdAt }))
    console.log(`Local report: ${localReportPath}`)
    console.log(`IAM changes: ${iamChanges.join('; ')}`)
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
