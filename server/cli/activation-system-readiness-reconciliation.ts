import { buildSystemReadinessReport, runSystemReadinessReconciliation, summarizeSystemReadinessReport } from '../activation/system-readiness-reconciliation'

const execute = process.argv.includes('--execute')

if (execute) {
  const result = await runSystemReadinessReconciliation({ execute: true })
  const report = result.executionReport
  console.log('Phase 52F system readiness reconciliation')
  console.log(`Status: ${report.status}`)
  console.log(`Run ID: ${report.runId}`)
  console.log(`Workstreams: ${report.workstreamReadiness.length}`)
  console.log(`Controlled test lanes: ${report.controlledInternalTestPlan.length}`)
  console.log(`Handoff packets: ${report.handoffPackets.length}`)
  console.log(`QA: ${report.qa.status}`)
  console.log(`Supabase sync: ${report.supabaseSyncResult.status}`)
  console.log(`Phase52G readiness: ${report.phase52GReadiness}`)
  console.log(`Artifacts: ${report.artifacts.length}`)
  if (report.blockers.length) console.log(`Blockers: ${report.blockers.join('; ')}`)
  if (report.warnings.length) console.log(`Warnings: ${report.warnings.join('; ')}`)
  console.log(`Local report: ${result.localReportPath}`)
  console.log(`IAM changes: ${result.iamChanges.join('; ')}`)
} else {
  console.log(summarizeSystemReadinessReport(buildSystemReadinessReport()))
}
