import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_DATA_IMPACT_BACKUP_DOCS,
  SUPABASE_STAGING_DATA_IMPACT_BACKUP_EXPECTED_REPORTS,
  SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR,
  buildSupabaseStagingDataImpactBackupReports,
} from '../activation/supabase-staging-data-impact-backup'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-staging-data-impact-backup:plan',
  'activation:supabase-staging-data-impact-backup',
  'activation:supabase-staging-data-impact-backup:report',
  'activation:supabase-staging-data-impact-backup:summary',
  'smoke:activation-supabase-staging-data-impact-backup',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-staging-data-impact-backup'),
  'Staging data-impact backup module is missing.',
)
assert(
  !existsSync('server/workers/supabase-staging-data-impact-backup'),
  'Staging data-impact backup packet must not add a worker.',
)

for (const report of SUPABASE_STAGING_DATA_IMPACT_BACKUP_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR, report)),
    `Missing staging data-impact backup report: ${report}`,
  )
}
for (const doc of SUPABASE_STAGING_DATA_IMPACT_BACKUP_DOCS) {
  assert(existsSync(doc), `Missing staging data-impact backup doc: ${doc}`)
}

const reports = buildSupabaseStagingDataImpactBackupReports()
assert(reports.evidenceInventory.pr248.decision === 'blocked_pending_staging_data_impact_review', 'PR #248 reset decision evidence is missing.')
assert(reports.evidenceInventory.pr247.selectedStrategy === 'staging_reset_and_reapply_migrations', 'PR #247 strategy evidence is missing.')
assert(reports.evidenceInventory.pr241.overallEquivalence === 'not_equivalent', 'PR #241 equivalence evidence is missing.')
assert(reports.backupSnapshotPlan.backupRunInThisPhase === false, 'Backup must not run in this packet.')
assert(reports.approvalDecision.resetExecutionApproved === false, 'Reset execution must not be approved in this packet.')
assert(reports.approvalDecision.migrationRepairApproved === false, 'Migration repair must not be approved.')
assert(reports.approvalDecision.schemaDeployApproved === false, 'Schema deploy must not be approved.')
assert(reports.approvalDecision.trackBBackfillApproved === false, 'Track B backfill must not be approved.')
assert(reports.approvalDecision.productionAffected === false, 'Production must not be affected.')
assert(
  reports.ownerAcceptance.accepted === true ||
    reports.approvalDecision.decision !== 'approved_for_future_staging_reset_and_reapply_migrations',
  'Future reset must not be approved without explicit staging-owner data-loss acceptance.',
)
assert(
  reports.ownerAcceptance.accepted !== true ||
    reports.ownerAcceptance.confirmationSet === true ||
    reports.ownerAcceptance.persistedDecisionUpdateAccepted === true,
  'Owner acceptance artifact must have explicit current confirmation or committed decision-update proof.',
)
assert(
  reports.approvalDecision.decision !== 'approved_for_future_staging_reset_and_reapply_migrations' ||
    reports.ownerAcceptanceArtifact.status === 'approved',
  'Approved future reset decision requires an approved owner data-loss acceptance artifact.',
)
assert(
  reports.approvalDecision.decision !== 'approved_for_future_staging_reset_and_reapply_migrations' ||
    reports.ownerAcceptanceDecisionUpdate.ownerAcceptanceAccepted === true,
  'Approved future reset decision requires owner acceptance in the decision update report.',
)
assert(
  reports.readonlyInspection.dbUrlValuePrinted === false &&
    reports.readonlyInspection.secretPayloadPrinted === false &&
    reports.readonlyInspection.secretPayloadCommitted === false,
  'Read-only inspection reports must keep DB URL and secret payloads redacted.',
)

const moduleText = readAllFiles('server/activation/supabase-staging-data-impact-backup')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'gcloud secrets versions access',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
  'supabase db reset',
  'supabase db push',
  'supabase migration repair',
]) {
  assert(!moduleText.includes(forbidden), `Staging data-impact backup module must not include forbidden path: ${forbidden}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR)
  .concat(SUPABASE_STAGING_DATA_IMPACT_BACKUP_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  '"secretValue"',
  '"signedUrl"',
  ['x-goog-signature', '='].join(''),
  ['service_role_key', '='].join(''),
  ['access_token', '='].join(''),
]) {
  assert(!reportsAndDocs.includes(forbidden), `Reports/docs must not include forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-data-impact-backup-approval',
  reportDir: SUPABASE_STAGING_DATA_IMPACT_BACKUP_REPORT_DIR,
  reports: SUPABASE_STAGING_DATA_IMPACT_BACKUP_EXPECTED_REPORTS.length,
  decision: reports.approvalDecision.decision,
  liveStagingInspection: reports.readonlyInspection.status,
  dataImpact: reports.dataImpactInventory.status,
  backupSnapshot: reports.backupSnapshotPlan.status,
  ownerAcceptance: reports.ownerAcceptance.status,
  stagingResetRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRun: false,
  productionAffected: false,
  directDdlDmlRun: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))
