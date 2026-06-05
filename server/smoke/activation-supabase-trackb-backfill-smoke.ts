import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_TRACKB_BACKFILL_EXPECTED_REPORTS,
  SUPABASE_TRACKB_BACKFILL_REPORT_DIR,
  buildSupabaseTrackBBackfillReports,
} from '../activation/supabase-trackb-backfill'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-trackb-backfill:plan',
  'activation:supabase-trackb-backfill:preflight',
  'activation:supabase-trackb-backfill:diff',
  'activation:supabase-trackb-backfill',
  'activation:supabase-trackb-backfill:report',
  'activation:supabase-trackb-backfill:summary',
  'activation:supabase-trackb-backfill:iam-plan',
  'activation:supabase-trackb-backfill:cost-summary',
  'smoke:activation-supabase-trackb-backfill',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/supabase-trackb-backfill'), 'Supabase Track B backfill activation module missing.')
assert(!existsSync('server/workers/supabase-trackb-backfill'), 'Supabase Track B backfill must not add a worker.')
assert(SUPABASE_TRACKB_BACKFILL_REPORT_DIR === 'docs/activation-supabase-trackb-backfill-reports', 'Unexpected report directory.')
for (const report of SUPABASE_TRACKB_BACKFILL_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_TRACKB_BACKFILL_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/supabase-trackb-milestone-staging-backfill.md',
  'docs/supabase-trackb-backfill-rls-and-secret-policy.md',
  'docs/supabase-trackb-backfill-rollback-plan.md',
  'docs/supabase-trackb-backfill-verification.md',
  'docs/implementation-prompts/prompt-supabase-trackb-milestone-production-promotion-approval.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

for (const { file, text } of readAllFiles('server/activation/supabase-trackb-backfill')) {
  assert(!text.includes("from 'node:child_process'"), `Backfill module must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Backfill module must not spawn processes: ${file}`)
  assert(!text.includes('execFile'), `Backfill module must not execute subprocesses: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Backfill module must not import Track A: ${file}`)
  assert(!text.includes('OPENAI_API_KEY'), `Backfill module must not reference provider env vars: ${file}`)
  assert(!text.includes('ANTHROPIC_API_KEY'), `Backfill module must not reference provider env vars: ${file}`)
  assert(!text.includes('console.log(process.env'), `Backfill module must not print environment payloads: ${file}`)
  assert(!text.includes('supabase db push'), `Backfill module must not deploy migrations: ${file}`)
  assert(!text.includes('supabase migration'), `Backfill module must not deploy migrations: ${file}`)
}

const reports = buildSupabaseTrackBBackfillReports()
const exportValidation = reports.exportValidationReport as {
  status?: string
  recordCount?: number
  canonicalToolIdsCovered?: boolean
  remoteSqlRun?: boolean
  migrationDeployment?: boolean
}
assert(exportValidation.status === 'passed', 'Track B export validation must pass.')
assert((exportValidation.recordCount ?? 0) >= 29, 'Track B export must contain the PR #196 milestone records.')
assert(exportValidation.canonicalToolIdsCovered === true, 'Track B export must cover canonical tool IDs.')
assert(exportValidation.remoteSqlRun === false, 'Source export must not have run remote SQL.')
assert(exportValidation.migrationDeployment === false, 'Source export must not deploy migrations.')

const schemaCheck = reports.registrySchemaCheck as { status?: string; blockers?: string[]; schemaMutationPerformed?: boolean; migrationDeploymentPerformed?: boolean }
assert(schemaCheck.status === 'blocked', 'PR #196 base should block because registry schema evidence is absent.')
assert(schemaCheck.blockers?.includes('supabase_milestone_registry_schema_missing'), 'Schema missing blocker must be explicit.')
assert(schemaCheck.schemaMutationPerformed === false, 'Schema mutation must not be performed.')
assert(schemaCheck.migrationDeploymentPerformed === false, 'Migration deployment must not be performed.')

const writeReport = reports.writeReport as { writePerformed?: boolean; remoteSqlRun?: boolean; productionAffected?: boolean; migrationDeployment?: boolean }
assert(writeReport.writePerformed === false, 'Staging write must not run while schema is missing.')
assert(writeReport.remoteSqlRun === false, 'Remote SQL must not run.')
assert(writeReport.productionAffected === false, 'Production must not be affected.')
assert(writeReport.migrationDeployment === false, 'Migration deployment must remain false.')

const blockerReport = reports.blockerReport as { activeBlockers?: string[]; stillBlockedScopes?: string[] }
assert(blockerReport.activeBlockers?.includes('supabase_milestone_registry_schema_missing'), 'Blocker report must include schema blocker.')
for (const scope of ['production_supabase_write', 'route_execution', 'worker_execution', 'provider_calls', 'track_a']) {
  assert(blockerReport.stillBlockedScopes?.includes(scope), `Blocked scope must remain listed: ${scope}`)
}

const reportText = JSON.stringify(reports)
for (const forbidden of ['BEGIN PRIVATE KEY', 'private-user-images.githubusercontent.com', 'postgres://', 'postgresql://']) {
  assert(!reportText.includes(forbidden), `Reports must not include forbidden payload: ${forbidden}`)
}
assert(!reportText.includes('"secretValue"'), 'Reports must not include secretValue payload keys.')
assert(!reportText.includes('"signedUrl"'), 'Reports must not include signedUrl payload keys.')

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-trackb-milestone-staging-backfill',
  reportDir: SUPABASE_TRACKB_BACKFILL_REPORT_DIR,
  exportRecords: exportValidation.recordCount,
  expectedBlocker: 'supabase_milestone_registry_schema_missing',
  stagingWrite: 'not_run',
  remoteSql: 'not_run',
  migrationDeployment: 'not_run',
  productionAffected: false,
  trackA: 'not_touched',
}, null, 2))
