import { runSupabaseMilestoneSync, summarizeSupabaseMilestoneSyncReport } from '../activation/supabase-milestone-sync'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 51D Supabase milestone sync is static by default. Pass --execute with REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true to write the self-sync record.')
  process.exit(0)
}

const { executionReport, localReportPath, iamChanges } = await runSupabaseMilestoneSync({ execute })
console.log(summarizeSupabaseMilestoneSyncReport({ ...executionReport, reportId: 'activation-phase-51d-supabase-milestone-sync', status: executionReport.ok ? 'completed' : 'blocked', config: (await import('../activation/supabase-milestone-sync')).supabaseMilestoneSyncConfig, executionReport }))
console.log(`Local report: ${localReportPath}`)
console.log(`IAM changes: ${iamChanges.join('; ')}`)
if (!executionReport.ok) process.exitCode = 1
