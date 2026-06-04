import { runSupabaseDataPlaneAudit } from '../activation/supabase-data-plane-audit'

const execute = process.argv.includes('--execute')

runSupabaseDataPlaneAudit({ execute })
  .then(({ executionReport, localReportPath, iamChanges }) => {
    console.log(`Phase 51A Supabase data-plane audit ${executionReport.ok ? 'completed' : 'partial/blocked'}.`)
    console.log(`Run ID: ${executionReport.runId}`)
    console.log(`Remote activity audit: ${executionReport.remoteActivityAudit.status}`)
    console.log(`P0 data-plane gaps: ${executionReport.dataModelGapAnalysis.p0Count}`)
    console.log(`canRunLocalSql: ${executionReport.canRunLocalSql}`)
    console.log(`canProceedToPrompt20B: ${executionReport.canProceedToPrompt20B}`)
    console.log(`Phase51B readiness: ${executionReport.phase51BReadiness}`)
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
