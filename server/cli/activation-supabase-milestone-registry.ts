import { runSupabaseMilestoneRegistry } from '../activation/supabase-milestone-registry'

const execute = process.argv.includes('--execute')
const applyMigration = process.argv.includes('--apply-migration')

runSupabaseMilestoneRegistry({ execute, applyMigration })
  .then(({ executionReport, localReportPath, iamChanges }) => {
    console.log(`Phase 51B Supabase milestone registry ${executionReport.ok ? 'completed' : 'partial/blocked'}.`)
    console.log(`Run ID: ${executionReport.runId}`)
    console.log(`Schema verification: ${executionReport.schemaVerification.status}`)
    console.log(`Migration status: ${executionReport.migrationSummary.status}`)
    console.log(`Write verification: ${executionReport.writeVerification.status}`)
    console.log(`Phase51C readiness: ${executionReport.phase51CReadiness}`)
    console.log(`Local report: ${localReportPath}`)
    console.log(`IAM changes: ${iamChanges.join('; ')}`)
    if (executionReport.blockers.length) {
      console.log('Blockers:')
      for (const blocker of executionReport.blockers) console.log(`- ${blocker}`)
    }
    if (executionReport.warnings.length) {
      console.log('Warnings:')
      for (const warning of executionReport.warnings) console.log(`- ${warning}`)
    }
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
