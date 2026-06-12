import {
  SUPABASE_BRANCHING_COST_REVIEW_CONFIRMATION,
  SUPABASE_BRANCHING_PLAN_BILLING_REVIEW_CONFIRMATION,
  executeSupabaseBranchingPlanBillingReview,
  summarizeSupabaseBranchingPlanBillingReports,
} from '../activation/supabase-branching-plan-billing-review'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'supabase_branching_plan_billing_review_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_BRANCHING_PLAN_BILLING_REVIEW_CONFIRMATION,
      SUPABASE_BRANCHING_COST_REVIEW_CONFIRMATION,
    ],
    branchCreated: false,
    billingMutationRun: false,
    planUpgradeRun: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseBranchingPlanBillingReview({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(summarizeSupabaseBranchingPlanBillingReports(result.reports), null, 2))
process.exit(result.exitCode)
