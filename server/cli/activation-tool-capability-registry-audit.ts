import {
  buildToolCapabilityRegistryReport,
  runToolCapabilityRegistryAudit,
  summarizeToolCapabilityRegistryReport,
} from '../activation/tool-capability-registry-audit'

async function main() {
  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(summarizeToolCapabilityRegistryReport(buildToolCapabilityRegistryReport()))
    return
  }

  const { executionReport, localReportPath, iamChanges } = await runToolCapabilityRegistryAudit({ execute: true })
  console.log(summarizeToolCapabilityRegistryReport(buildToolCapabilityRegistryReport()))
  console.log(`Local report: ${localReportPath}`)
  console.log(`IAM changes: ${iamChanges.join('; ')}`)
  if (!executionReport.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
