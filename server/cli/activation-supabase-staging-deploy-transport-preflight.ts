import {
  SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  buildSupabaseStagingDeployTransportReports,
  writeSupabaseStagingDeployTransportArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

const reports = await buildSupabaseStagingDeployTransportReports()
await writeSupabaseStagingDeployTransportArtifacts(reports)

console.log(JSON.stringify({
  status: reports.preflightReport.status,
  reportDir: SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  strategyStatus: reports.strategyReport.status,
  deployStatus: reports.schemaDeployTransportReport.status,
  verifyStatus: reports.schemaVerifyAfterTransportReport.status,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
