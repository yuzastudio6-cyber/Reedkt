import {
  SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR,
  buildSupabaseBranchingPlanBillingReports,
  writeSupabaseBranchingPlanBillingArtifacts,
} from '../activation/supabase-branching-plan-billing-review'

const reports = buildSupabaseBranchingPlanBillingReports()
await writeSupabaseBranchingPlanBillingArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR,
  decision: reports.decision.decision,
  approvalStatus: reports.decision.approvalStatus,
  branchCreated: false,
  billingMutationRun: false,
  planUpgradeRun: false,
  sqlExecuted: false,
  migrationDeployed: false,
  migrationRepairRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
