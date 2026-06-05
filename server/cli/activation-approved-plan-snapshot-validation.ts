import {
  buildApprovedPlanValidationReport,
  runApprovedPlanValidation,
  summarizeApprovedPlanValidationReport,
} from '../activation/approved-plan-snapshot-validation'

async function main() {
  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(summarizeApprovedPlanValidationReport(await buildApprovedPlanValidationReport()))
    return
  }

  const { executionReport, localReportPath, iamChanges } = await runApprovedPlanValidation({ execute: true })
  console.log(summarizeApprovedPlanValidationReport(await buildApprovedPlanValidationReport()))
  console.log(`Local report: ${localReportPath}`)
  console.log(`IAM changes: ${iamChanges.join('; ')}`)
  if (!executionReport.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
