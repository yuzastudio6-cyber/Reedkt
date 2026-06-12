import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_BRANCHING_PLAN_BILLING_DOCS,
  SUPABASE_BRANCHING_PLAN_BILLING_EXPECTED_REPORTS,
  SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR,
  buildSupabaseBranchingPlanBillingReports,
  scanSupabaseBranchingPlanBillingPayloadText,
} from '../activation/supabase-branching-plan-billing-review'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) files.push(...readAllFiles(full))
    else files.push({ file: full, text: readFileSync(full, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-branching-plan-billing:plan',
  'activation:supabase-branching-plan-billing',
  'activation:supabase-branching-plan-billing:report',
  'activation:supabase-branching-plan-billing:summary',
  'smoke:activation-supabase-branching-plan-billing',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-branching-plan-billing-review'),
  'Supabase branching plan billing activation module missing.',
)
assert(
  !existsSync('server/workers/supabase-branching-plan-billing-review'),
  'Branching plan billing phase must not add a worker.',
)

for (const report of SUPABASE_BRANCHING_PLAN_BILLING_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR, report)),
    `Missing branching plan billing report: ${report}`,
  )
}
for (const doc of SUPABASE_BRANCHING_PLAN_BILLING_DOCS) {
  assert(existsSync(doc), `Missing branching plan billing doc: ${doc}`)
}

const reports = buildSupabaseBranchingPlanBillingReports()
assert(
  asRecord(reports.evidenceInventory.pr283).failureClass === 'branch_create_plan_or_billing_unavailable',
  'PR #283 plan/billing blocker evidence missing.',
)
assert(
  asRecord(reports.evidenceInventory.pr283).withData === false,
  'Clean staging branch must remain data-less.',
)
assert(
  reports.decision.decision === 'blocked_pending_operator_billing_action' ||
    reports.decision.decision === 'approved_for_future_branch_create_after_billing_enablement',
  'Decision must block on operator billing action or approve only a future rerun.',
)
assert(reports.decision.branchCreated === false, 'Branch creation must not run in billing review.')
assert(reports.decision.billingMutationRun === false, 'Billing mutation must not run.')
assert(reports.decision.planUpgradeRun === false, 'Plan upgrade must not run.')
assert(reports.decision.sqlExecuted === false, 'SQL must not run.')
assert(reports.decision.migrationDeployed === false, 'Migration deploy must not run.')
assert(reports.decision.migrationRepairRun === false, 'Migration repair must remain blocked.')
assert(reports.decision.trackBBackfillRowsWritten === false, 'Track B backfill writes must remain blocked.')
assert(reports.decision.productionAffected === false, 'Production must remain blocked.')
assert(reports.decision.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const moduleText = readAllFiles('server/activation/supabase-branching-plan-billing-review')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'node:child_process',
  'gcloud secrets versions access',
  'supabase db reset',
  'supabase db push',
  'supabase migration repair',
  'supabase branches create',
  'supabase projects create',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
]) {
  assert(!moduleText.includes(forbidden), `Forbidden execution path found: ${forbidden}`)
}

for (const forbiddenConfirmation of [
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_EXECUTE=true',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_CREATE=true',
  'REEDITPRO_CONFIRM_SUPABASE_BILLING_MUTATION=true',
  'REEDITPRO_CONFIRM_SUPABASE_PLAN_UPGRADE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
]) {
  assert(!moduleText.includes(forbiddenConfirmation), `Forbidden confirmation unlock found: ${forbiddenConfirmation}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR)
  .concat(SUPABASE_BRANCHING_PLAN_BILLING_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
const sensitivePatterns = scanSupabaseBranchingPlanBillingPayloadText(reportsAndDocs)
assert(sensitivePatterns.length === 0, `Reports/docs contain forbidden payload pattern: ${sensitivePatterns.join(', ')}`)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-branching-plan-billing-review',
  reportDir: SUPABASE_BRANCHING_PLAN_BILLING_REPORT_DIR,
  reports: SUPABASE_BRANCHING_PLAN_BILLING_EXPECTED_REPORTS.length,
  decision: reports.decision.decision,
  branchCreated: false,
  billingMutationRun: false,
  planUpgradeRun: false,
  sqlExecuted: false,
  migrationDeployed: false,
  migrationRepairRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
