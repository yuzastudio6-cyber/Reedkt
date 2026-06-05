import { runSupabaseMilestoneSync, summarizeSupabaseMilestoneSyncReport, buildSupabaseMilestoneSyncReport } from '../activation/supabase-milestone-sync'

async function main() {
  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(summarizeSupabaseMilestoneSyncReport(buildSupabaseMilestoneSyncReport()))
    return
  }
  const { executionReport, localReportPath, iamChanges } = await runSupabaseMilestoneSync({ execute: true })
  console.log(summarizeSupabaseMilestoneSyncReport(buildSupabaseMilestoneSyncReport()))
  console.log(`Local report: ${localReportPath}`)
  console.log(`IAM changes: ${iamChanges.join('; ')}`)
  if (!executionReport.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
