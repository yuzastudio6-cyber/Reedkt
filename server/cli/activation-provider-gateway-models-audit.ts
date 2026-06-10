import { runProviderModelsAudit, summarizeProviderModelsAuditReport } from '../activation/provider-gateway-models-audit'

const execute = process.argv.includes('--execute')

runProviderModelsAudit({ execute })
  .then(({ executionReport, localReportPath, iamChanges }) => {
    console.log(summarizeProviderModelsAuditReport({ ...executionReport, reportId: 'activation-provider-0-provider-gateway-models-audit', executionReport, createdAt: executionReport.createdAt }))
    console.log(`Local report: ${localReportPath}`)
    console.log(`IAM changes: ${iamChanges.join('; ')}`)
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
