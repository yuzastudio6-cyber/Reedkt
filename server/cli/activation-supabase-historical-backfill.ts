import { runSupabaseHistoricalBackfill } from '../activation/supabase-historical-backfill'

const execute = process.argv.includes('--execute')

runSupabaseHistoricalBackfill({ execute })
  .then(({ executionReport, localReportPath, iamChanges }) => {
    console.log(`Phase 51C Supabase historical backfill ${executionReport.ok ? 'completed' : executionReport.summary.writesPerformed ? 'partial' : 'blocked'}.`)
    console.log(`Run ID: ${executionReport.runId}`)
    console.log(`Phases written: ${executionReport.summary.writtenPhases.join(', ') || 'none'}`)
    console.log(`Phases skipped: ${executionReport.summary.skippedPhases.map((phase) => phase.phaseId).join(', ') || 'none'}`)
    console.log(`Phase51D readiness: ${executionReport.phase51DReadiness}`)
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
