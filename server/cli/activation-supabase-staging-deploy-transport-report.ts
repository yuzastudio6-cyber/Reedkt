import {
  SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  buildSupabaseStagingDeployTransportReports,
  writeSupabaseStagingDeployTransportArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

const reports = await buildSupabaseStagingDeployTransportReports()
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
