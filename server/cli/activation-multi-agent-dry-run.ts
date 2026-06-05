import {
  buildMultiAgentDryRunReport,
  runMultiAgentDryRun,
  summarizeMultiAgentDryRunReport,
} from '../activation/multi-agent-dry-run'

async function main() {
  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(summarizeMultiAgentDryRunReport(buildMultiAgentDryRunReport()))
    return
  }

  const { executionReport, localReportPath, iamChanges } = await runMultiAgentDryRun({ execute: true })
  console.log(summarizeMultiAgentDryRunReport(buildMultiAgentDryRunReport()))
  console.log(`Local report: ${localReportPath}`)
  console.log(`IAM changes: ${iamChanges.join('; ')}`)
  if (!executionReport.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
