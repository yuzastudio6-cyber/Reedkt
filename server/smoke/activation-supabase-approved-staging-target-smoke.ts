import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_APPROVED_STAGING_TARGET_EXPECTED_REPORTS,
  SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR,
  buildSupabaseApprovedStagingTargetReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-report'
import {
  SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_SOURCES,
  buildApprovedStagingTargetReferenceReport,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference'

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
  'activation:supabase-approved-staging-target:plan',
  'activation:supabase-approved-staging-target:report',
  'activation:supabase-approved-staging-target:summary',
  'smoke:activation-supabase-approved-staging-target',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'docs/supabase-approved-staging-target-reference.md',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-report.ts',
  'server/cli/activation-supabase-approved-staging-target-plan.ts',
  'server/cli/activation-supabase-approved-staging-target-report.ts',
  'server/cli/activation-supabase-approved-staging-target-summary.ts',
]) {
  assert(existsSync(file), `Missing approved staging target file: ${file}`)
}

assert(!existsSync('server/workers/supabase-approved-staging-target'), 'Approved staging target phase must not add a worker.')
assert(
  (SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_SOURCES as readonly string[]).includes('docs/supabase-approved-staging-target-reference.md'),
  'Approved target loader must include docs/supabase-approved-staging-target-reference.md.',
)

const referenceDoc = readFileSync('docs/supabase-approved-staging-target-reference.md', 'utf8')
for (const required of [
  'approved_staging_target_reference_status: approved',
  'approved_staging_supabase_project_name: Reeditpro',
  'approved_staging_supabase_project_ref: wmyyttnynmteqgcdishd',
  'approved_staging_environment: staging',
  'remote_sql_run: false',
  'migration_deployment: false',
  'production_affected: false',
]) {
  assert(referenceDoc.includes(required), `Approved staging target doc missing marker: ${required}`)
}

const moduleText = [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-report.ts',
].map((file) => readFileSync(file, 'utf8')).join('\n')

for (const required of [
  'REEDITPRO_CONFIRM_SUPABASE_APPROVED_STAGING_TARGET_REFERENCE',
  'stagingSqlExecutionAllowedInThisPhase: false',
  'migrationDeployment: false',
  'trackBBackfillWrite: false',
  'productionAffected: false',
  'credentialPayloadViewed: false',
  'credentialPayloadPrinted: false',
]) {
  assert(moduleText.includes(required), `Approved staging target module missing guard: ${required}`)
}

for (const forbidden of [
  'createClient(',
  'supabase.from(',
  'execute_sql',
  'db push',
  'psql',
  'process.env.SUPABASE_SERVICE',
  'process.env.SUPABASE_DB',
  'console.log(process.env',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'from "../track-a',
  'from "../../track-a',
]) {
  assert(!moduleText.includes(forbidden), `Approved staging target module must not include forbidden path/token: ${forbidden}`)
}

const loaderReport = buildApprovedStagingTargetReferenceReport()
assert(loaderReport.status === 'passed', 'Approved staging target loader must pass after the reviewed reference is committed.')
assert(loaderReport.approvedStagingProjectName === 'Reeditpro', 'Approved staging project name mismatch.')
assert(loaderReport.approvedStagingProjectRef === 'wmyyttnynmteqgcdishd', 'Approved staging project ref mismatch.')
assert(loaderReport.approvedEnvironment === 'staging', 'Approved staging environment mismatch.')
assert(loaderReport.secretPayloadsPrinted === false && loaderReport.secretPayloadsRead === false, 'Approved target loader must not read or print secret payloads.')

const reports = buildSupabaseApprovedStagingTargetReports()
const reference = reports.approvedStagingTargetReference as {
  approved?: boolean
  blockers?: string[]
  remoteSqlRun?: boolean
  migrationDeployment?: boolean
  productionAffected?: boolean
}
const readiness = reports.readinessReport as {
  status?: string
  stagingExecutionAllowed?: boolean
  remoteSqlRun?: boolean
  migrationDeployment?: boolean
  productionAffected?: boolean
}
const blockers = reports.blockerReport as { activeBlockers?: string[] }
assert(reference.approved === true, 'Approved target reference report must be approved.')
assert((reference.blockers ?? []).length === 0, 'Approved target reference report must have no blockers.')
assert(reference.remoteSqlRun === false, 'Approved target phase must not run remote SQL.')
assert(reference.migrationDeployment === false, 'Approved target phase must not deploy migrations.')
assert(reference.productionAffected === false, 'Approved target phase must not affect production.')
assert(readiness.status === 'passed', 'Approved target readiness must pass.')
assert(readiness.stagingExecutionAllowed === false, 'Approved target phase must not allow staging execution by itself.')
assert(readiness.remoteSqlRun === false, 'Readiness must record no remote SQL.')
assert(readiness.migrationDeployment === false, 'Readiness must record no migration deployment.')
assert(readiness.productionAffected === false, 'Readiness must keep production unaffected.')
assert((blockers.activeBlockers ?? []).length === 0, 'Approved target blocker report must have no active blockers.')

for (const report of SUPABASE_APPROVED_STAGING_TARGET_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR, report)), `Missing approved target report: ${report}`)
}

const reportText = readAllFiles(SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR).map(({ text }) => text).join('\n')
for (const forbidden of [
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://',
  '"serviceRoleKey":',
  '"secretValue"',
  '"signedUrl"',
  'private-user-images.githubusercontent.com',
]) {
  assert(!reportText.includes(forbidden), `Approved target reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-approved-staging-target-reference',
  reportDir: SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR,
  expectedReports: SUPABASE_APPROVED_STAGING_TARGET_EXPECTED_REPORTS.length,
  approvedStagingProjectName: loaderReport.approvedStagingProjectName,
  approvedStagingProjectRef: loaderReport.approvedStagingProjectRef,
  approvedEnvironment: loaderReport.approvedEnvironment,
  stagingExecutionAllowed: false,
  remoteSqlRun: false,
  migrationDeployment: false,
  productionAffected: false,
  trackA: 'not_touched',
}, null, 2))
