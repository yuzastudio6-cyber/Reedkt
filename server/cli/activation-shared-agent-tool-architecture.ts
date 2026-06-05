import {
  buildSharedAgentToolArchitectureReport,
  runSharedAgentToolArchitecture,
  summarizeSharedAgentToolArchitectureReport,
} from '../activation/shared-agent-tool-architecture'

async function main() {
  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(summarizeSharedAgentToolArchitectureReport(buildSharedAgentToolArchitectureReport()))
    return
  }

  const { executionReport, localReportPath, iamChanges } = await runSharedAgentToolArchitecture({ execute: true })
  console.log(summarizeSharedAgentToolArchitectureReport(buildSharedAgentToolArchitectureReport()))
  console.log(`Local report: ${localReportPath}`)
  console.log(`IAM changes: ${iamChanges.join('; ')}`)
  if (!executionReport.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
