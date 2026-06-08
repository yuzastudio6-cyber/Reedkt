import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  buildSupabaseStagingDeployTransportReports,
  writeSupabaseStagingDeployTransportArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

function readExistingAttemptReport(fileName: string): Record<string, unknown> | undefined {
  const fullPath = path.join(SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR, fileName)
  if (!existsSync(fullPath)) return undefined
  try {
    const report = JSON.parse(readFileSync(fullPath, 'utf8')) as Record<string, unknown>
    const hasAttemptState =
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
  schemaDeployTransportReport: readExistingAttemptReport('staging_schema_deploy_transport_report.json'),
  schemaVerifyAfterTransportReport: readExistingAttemptReport('staging_schema_verify_after_transport_report.json'),
  rlsVerifyAfterTransportReport: readExistingAttemptReport('staging_rls_verify_after_transport_report.json'),
})
await writeSupabaseStagingDeployTransportArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  reportsWritten: true,
  readinessStatus: reports.readinessReport.status,
  selectedStrategy: (reports.strategyReport as { selectedStrategy?: string }).selectedStrategy,
  deployStatus: reports.schemaDeployTransportReport.status,
  verifyStatus: reports.schemaVerifyAfterTransportReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
