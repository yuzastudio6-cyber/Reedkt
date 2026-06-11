import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  CLEAN_STAGING_BRANCH_PROJECT_REF,
  SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_EXPECTED_REPORTS,
  SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR,
  buildSupabaseTrackBCleanStagingBackfillReports,
} from '../activation/supabase-trackb-backfill'

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
  'activation:supabase-trackb-clean-staging-backfill:plan',
  'activation:supabase-trackb-clean-staging-backfill:preflight',
  'activation:supabase-trackb-clean-staging-backfill:diff',
  'activation:supabase-trackb-clean-staging-backfill',
  'activation:supabase-trackb-clean-staging-backfill:verify',
  'activation:supabase-trackb-clean-staging-backfill:report',
  'activation:supabase-trackb-clean-staging-backfill:summary',
  'smoke:activation-supabase-trackb-clean-staging-backfill',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/supabase-trackb-backfill/trackb-clean-staging.ts'), 'Clean-staging Track B backfill module missing.')
assert(!existsSync('server/workers/supabase-trackb-clean-staging-backfill'), 'Clean-staging backfill must not add a worker.')
assert(existsSync(SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR), 'Clean-staging report directory missing.')
for (const report of SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR, report)), `Missing clean-staging report: ${report}`)
}
for (const doc of [
  'docs/supabase-trackb-clean-staging-backfill.md',
  'docs/supabase-trackb-clean-staging-backfill-verification.md',
  'docs/supabase-trackb-clean-staging-backfill-secret-policy.md',
  'docs/supabase-trackb-clean-staging-backfill-rollback.md',
  'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-trackb-backfill.md',
]) {
  assert(existsSync(doc), `Missing clean-staging doc: ${doc}`)
}

const reports = buildSupabaseTrackBCleanStagingBackfillReports()
const exportValidation = reports.exportValidationReport as {
  status?: string
  recordCount?: number
  canonicalToolIdsCovered?: boolean
}
assert(exportValidation.status === 'passed', 'Track B export validation must pass.')
assert(exportValidation.recordCount === 30, 'Track B export should contain the 30 PR #196 records.')
assert(exportValidation.canonicalToolIdsCovered === true, 'Track B export must cover all canonical tool IDs.')

const preflight = reports.targetPreflightReport as {
  status?: string
  targetProjectRef?: string
  activationRegistryTableCount?: number
  rlsEnabledOnRegistryTables?: boolean
  publicAnonAuthenticatedUnsafeAccess?: boolean
  productionAffected?: boolean
  brokenOriginalStagingAffected?: boolean
}
assert(preflight.status === 'passed', 'Clean staging target preflight must pass from PR #283 evidence.')
assert(preflight.targetProjectRef === CLEAN_STAGING_BRANCH_PROJECT_REF, 'Clean staging target ref mismatch.')
assert(preflight.activationRegistryTableCount === 11, 'Activation registry must contain 11 tables.')
assert(preflight.rlsEnabledOnRegistryTables === true, 'RLS must be enabled on registry tables.')
assert(preflight.publicAnonAuthenticatedUnsafeAccess === false, 'Public/anon/authenticated unsafe access must be absent.')
assert(preflight.productionAffected === false, 'Production must not be affected.')
assert(preflight.brokenOriginalStagingAffected === false, 'Broken original staging must not be affected.')

const mapping = reports.mappingReport as { status?: string; rowCountsByTable?: Record<string, number>; canonicalToolIdsCovered?: boolean }
assert(mapping.status === 'passed', 'Mapping must pass.')
assert(mapping.rowCountsByTable?.activation_milestones === 30, 'Milestone mapping should include 30 rows.')
assert(mapping.rowCountsByTable?.activation_tool_readiness === 18, 'Tool readiness mapping should include the 18 canonical Track B tool rows.')
assert(mapping.canonicalToolIdsCovered === true, 'Tool readiness mapping must cover canonical tool IDs.')

const write = reports.writeReport as {
  productionAffected?: boolean
  brokenOriginalStagingAffected?: boolean
  trackBRuntimeExecution?: boolean
  providerCalls?: boolean
  mediaProcessing?: boolean
  secretsPrintedOrCommitted?: boolean
}
assert(write.productionAffected === false, 'Write report must preserve productionAffected=false.')
assert(write.brokenOriginalStagingAffected === false, 'Write report must not touch broken original staging.')
assert(write.trackBRuntimeExecution === false, 'Track B runtime execution must stay false.')
assert(write.providerCalls === false, 'Provider calls must stay false.')
assert(write.mediaProcessing === false, 'Media processing must stay false.')
assert(write.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const moduleCorpus = readAllFiles('server/activation/supabase-trackb-backfill')
const reportDocCorpus = [
  ...readAllFiles(SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR),
  ...[
    'docs/supabase-trackb-clean-staging-backfill.md',
    'docs/supabase-trackb-clean-staging-backfill-verification.md',
    'docs/supabase-trackb-clean-staging-backfill-secret-policy.md',
    'docs/supabase-trackb-clean-staging-backfill-rollback.md',
    'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-trackb-backfill.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of moduleCorpus.concat(reportDocCorpus)) {
  for (const forbidden of [
    '--with-data',
    'supabase db reset',
    'supabase migration repair',
    'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
    'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true',
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT=true',
    'from "../track-a',
    "from '../track-a",
  ]) {
    assert(!text.includes(forbidden), `Forbidden execution path found in ${file}: ${forbidden}`)
  }
}

const reportAndDocsText = reportDocCorpus.map(({ text }) => text).join('\n')
for (const forbidden of [
  'postgres://',
  'postgresql://',
  'BEGIN PRIVATE KEY',
  'x-goog-signature=',
  'service_role_key=',
  'anon_key=',
  'access_token=',
  'jwt_secret=',
  'sbp_',
  '"secretValue"',
  '"privatePayload"',
  '"signedUrl"',
]) {
  assert(!reportAndDocsText.includes(forbidden), `Reports/docs contain forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-trackb-clean-staging-backfill',
  reportDir: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR,
  targetProjectRef: CLEAN_STAGING_BRANCH_PROJECT_REF,
  exportRecords: exportValidation.recordCount,
  productionAffected: false,
  brokenOriginalStagingAffected: false,
  trackBRuntimeExecution: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
