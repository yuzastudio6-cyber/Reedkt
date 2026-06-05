import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_EXPECTED_REPORTS,
  SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR,
  buildSupabaseMilestoneRegistryStagingDeployReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-verify'

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
  'activation:supabase-milestone-registry-schema:staging-deploy',
  'activation:supabase-milestone-registry-schema:staging-verify',
  'activation:supabase-milestone-registry-schema:staging-deploy-report',
  'activation:supabase-milestone-registry-schema:staging-deploy-summary',
  'smoke:activation-supabase-milestone-registry-staging-deploy',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-verify.ts'), 'Staging deploy/verify module missing.')
assert(!existsSync('server/workers/supabase-milestone-registry-staging-deploy'), 'Staging deploy phase must not add a worker.')

const moduleText = readFileSync('server/activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-verify.ts', 'utf8')
for (const required of [
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_SUPABASE_CLI_PATH',
  'supabase_db_push_db_url_dry_run_then_apply',
  'supabase_migration_list_db_url_plus_static_migration_rls_evidence',
  'trackBRowsWritten: false',
  'seedFilesIncluded: false',
  'credentialPayloadsPrinted: false',
  'shell: false',
]) {
  assert(moduleText.includes(required), `Staging deploy module missing required guard: ${required}`)
}

for (const forbidden of [
  'activation:supabase-trackb-backfill -- --execute',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ=true',
  'from "../track-a',
  'from "../../track-a',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'console.log(process.env',
  'shell: true',
  'spawn(',
]) {
  assert(!moduleText.includes(forbidden), `Staging deploy module must not include forbidden path/token: ${forbidden}`)
}

const reports = await buildSupabaseMilestoneRegistryStagingDeployReports()
const deploy = reports.schemaDeployReport as {
  deployPerformed?: boolean
  remoteSqlRun?: boolean
  productionAffected?: boolean
  seedFilesIncluded?: boolean
  trackBRowsWritten?: boolean
  tempDeployContextPolicy?: { seedFilesIncluded?: boolean }
}
const readiness = reports.readinessReport as { blockers?: string[]; productionAffected?: boolean; trackBBackfillRowsWritten?: boolean }
assert(deploy.deployPerformed === false, 'Smoke must not perform staging deploy.')
assert(deploy.remoteSqlRun === false, 'Smoke must not run remote SQL.')
assert(deploy.productionAffected === false, 'Smoke must not affect production.')
assert(deploy.seedFilesIncluded === false || deploy.tempDeployContextPolicy?.seedFilesIncluded === false, 'Deploy context must exclude seed files.')
assert(deploy.trackBRowsWritten === false, 'Staging deploy phase must not write Track B rows.')
assert(readiness.productionAffected === false, 'Readiness must keep production unaffected.')
assert(readiness.trackBBackfillRowsWritten === false, 'Readiness must keep Track B backfill writes blocked.')
assert((readiness.blockers ?? []).length > 0, 'Current safe baseline should record staging blockers unless operator supplied credentials/CLI.')

for (const report of SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR, report)), `Missing staging deploy report: ${report}`)
}

const reportText = readAllFiles(SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR)
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://',
  '"serviceRoleKey":',
  '"secretValue"',
  '"signedUrl"',
  'private-user-images.githubusercontent.com',
]) {
  assert(!reportText.includes(forbidden), `Staging deploy reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-milestone-registry-staging-deploy-verify',
  reportDir: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_REPORT_DIR,
  expectedReports: SUPABASE_MILESTONE_REGISTRY_STAGING_DEPLOY_EXPECTED_REPORTS.length,
  deployPerformed: false,
  trackBRowsWritten: false,
  productionAffected: false,
  remoteSqlRun: false,
  trackA: 'not_touched',
}, null, 2))
