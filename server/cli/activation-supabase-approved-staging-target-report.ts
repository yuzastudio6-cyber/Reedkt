import {
  SUPABASE_APPROVED_STAGING_TARGET_CONFIRMATION,
  SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR,
  buildSupabaseApprovedStagingTargetReports,
  writeSupabaseApprovedStagingTargetArtifacts,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-report'

const executeRequested = process.argv.includes('--execute')
if (executeRequested && process.env[SUPABASE_APPROVED_STAGING_TARGET_CONFIRMATION] !== 'true') {
  throw new Error(`Missing required confirmation for approved staging target report generation: ${SUPABASE_APPROVED_STAGING_TARGET_CONFIRMATION}=true`)
}

const reports = buildSupabaseApprovedStagingTargetReports()
await writeSupabaseApprovedStagingTargetArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR,
  reportsWritten: true,
  executeRequested,
  confirmationSet: process.env[SUPABASE_APPROVED_STAGING_TARGET_CONFIRMATION] === 'true',
  readinessStatus: reports.readinessReport.status,
  approvalStatus: reports.approvedStagingTargetReference.approvalStatus,
  approvedStagingProjectRef: reports.approvedStagingTargetReference.approvedStagingProjectRef,
  remoteSqlRun: false,
  migrationDeployment: false,
  productionAffected: false,
  blockers: (reports.blockerReport as { activeBlockers?: string[] }).activeBlockers,
}, null, 2))
