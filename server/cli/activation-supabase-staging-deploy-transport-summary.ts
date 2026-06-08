import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
  SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
  buildSupabaseStagingDeployTransportReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

function readExistingAttemptReport(fileName: string): Record<string, unknown> | undefined {
  const fullPath = path.join(SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR, fileName)
  if (!existsSync(fullPath)) return undefined
  try {
    const report = JSON.parse(readFileSync(fullPath, 'utf8')) as Record<string, unknown>
    const hasAttemptState =
      report.auditPerformed === true ||
      report.deployPerformed === true ||
      report.deployAttempted === true ||
      report.dryRunPerformed === true ||
      report.verificationPerformed === true
    return hasAttemptState ? report : undefined
  } catch {
    return undefined
  }
}

const reports = await buildSupabaseStagingDeployTransportReports({
  schemaDeployAfterHistoryAuditReport: readExistingAttemptReport('staging_schema_deploy_after_history_audit_report.json'),
  schemaVerifyAfterHistoryAuditReport: readExistingAttemptReport('staging_schema_verify_after_history_audit_report.json'),
  schemaDeployTransportReport: readExistingAttemptReport('staging_schema_deploy_transport_report.json'),
  schemaVerifyAfterTransportReport: readExistingAttemptReport('staging_schema_verify_after_transport_report.json'),
  rlsVerifyAfterTransportReport: readExistingAttemptReport('staging_rls_verify_after_transport_report.json'),
})
const readiness = reports.readinessReport as {
  status?: string
  stagingSchemaVerified?: boolean
  nextRecommendedPhase?: string
}
const blocker = reports.blockerReport as { activeBlockers?: string[] }
const strategy = reports.strategyReport as { selectedStrategy?: string }

console.log(JSON.stringify({
  phase: SUPABASE_STAGING_DEPLOY_TRANSPORT_PHASE,
  runId: SUPABASE_STAGING_DEPLOY_TRANSPORT_RUN_ID,
  status: readiness.status,
  selectedStrategy: strategy.selectedStrategy,
  stagingSchemaVerified: readiness.stagingSchemaVerified === true,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  directManualSqlRun: false,
  secretsPrintedOrCommitted: false,
  activeBlockers: blocker.activeBlockers ?? [],
  nextRecommendedPhase: readiness.nextRecommendedPhase,
}, null, 2))
