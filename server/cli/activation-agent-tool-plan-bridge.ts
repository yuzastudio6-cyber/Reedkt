import {
  buildAgentToolPlanBridgeReport,
  runAgentToolPlanBridge,
  summarizeAgentToolPlanBridgeReport,
} from '../activation/agent-tool-plan-bridge'

async function main() {
  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(summarizeAgentToolPlanBridgeReport(await buildAgentToolPlanBridgeReport()))
    return
  }

  const { executionReport, localReportPath, iamChanges } = await runAgentToolPlanBridge({ execute: true })
  console.log(summarizeAgentToolPlanBridgeReport(await buildAgentToolPlanBridgeReport()))
  console.log(`Local report: ${localReportPath}`)
  console.log(`IAM changes: ${iamChanges.join('; ')}`)
  if (!executionReport.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
