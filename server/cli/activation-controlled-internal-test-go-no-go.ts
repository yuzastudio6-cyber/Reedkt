import { buildGoNoGoReport, runControlledInternalTestGoNoGo, summarizeGoNoGoReport } from '../activation/controlled-internal-test-go-no-go'

const execute = process.argv.includes('--execute')

if (execute) {
  const { executionReport, localReportPath, iamChanges } = await runControlledInternalTestGoNoGo({ execute: true })
  console.log(summarizeGoNoGoReport({ ...executionReport, reportId: 'activation-phase-52g-controlled-internal-test-go-no-go', executionReport }))
  console.log(`Local report: ${localReportPath}`)
  console.log(`IAM changes: ${iamChanges.join('; ')}`)
} else {
  console.log(summarizeGoNoGoReport(buildGoNoGoReport()))
}
