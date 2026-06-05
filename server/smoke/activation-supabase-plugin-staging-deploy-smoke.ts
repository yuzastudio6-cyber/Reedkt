import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_PLUGIN_STAGING_DEPLOY_EXPECTED_REPORTS,
  SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR,
  buildSupabasePluginStagingDeployReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan'

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
  'activation:supabase-plugin-staging-deploy:plan',
  'activation:supabase-plugin-staging-deploy:preflight',
  'activation:supabase-plugin-staging-deploy:deploy',
  'activation:supabase-plugin-staging-deploy:verify',
  'activation:supabase-plugin-staging-deploy:report',
  'activation:supabase-plugin-staging-deploy:summary',
  'smoke:activation-supabase-plugin-staging-deploy',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-preflight.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-target-check.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-schema-verify.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-report.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-target-policy.ts',
]) {
  assert(existsSync(file), `Missing plugin staging deploy module file: ${file}`)
}

assert(!existsSync('server/workers/supabase-plugin-staging-deploy'), 'Plugin staging deploy phase must not add a worker.')

const moduleText = readFileSync('server/activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan.ts', 'utf8')
const policyText = readFileSync('server/activation/supabase-milestone-registry-schema/milestone-registry-staging-target-policy.ts', 'utf8')
for (const required of [
  'supabase_plugin_target_not_confirmed_as_staging',
  'blocked_no_migration_safe_deploy_path',
  'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'directSqlFallbackAllowed: false',
  'pluginReadOnlyCatalogSqlRun: false',
  'trackBRowsWritten: false',
  'credentialPayloadsPrinted: false',
]) {
  assert(`${moduleText}\n${policyText}`.includes(required), `Plugin deploy code missing required guard: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ=true',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'console.log(process.env',
  'shell: true',
  'spawn(',
  'from "../track-a',
  'from "../../track-a',
]) {
  assert(!`${moduleText}\n${policyText}`.includes(forbidden), `Plugin deploy module must not include forbidden path/token: ${forbidden}`)
}

const reports = await buildSupabasePluginStagingDeployReports()
const target = reports.targetPreflightReport as {
  stagingTargetConfirmed?: boolean
  blockers?: string[]
  credentialPayloadsPrinted?: boolean
}
const deploy = reports.schemaDeployReport as {
  deployPerformed?: boolean
  remoteSqlRun?: boolean
  productionAffected?: boolean
  trackBRowsWritten?: boolean
}
const readiness = reports.readinessReport as {
  status?: string
  productionAffected?: boolean
  pr198BackfillRowsWritten?: boolean
  remoteSqlRun?: boolean
  blockers?: string[]
}
assert(target.stagingTargetConfirmed === false, 'Smoke baseline must not infer staging from ambiguous plugin target.')
assert((target.blockers ?? []).includes('supabase_plugin_target_not_confirmed_as_staging'), 'Smoke baseline must record ambiguous plugin target blocker.')
assert(target.credentialPayloadsPrinted === false, 'Plugin preflight must not print credential payloads.')
assert(deploy.deployPerformed === false, 'Smoke must not perform staging deploy.')
assert(deploy.remoteSqlRun === false, 'Smoke must not run remote SQL.')
assert(deploy.productionAffected === false, 'Smoke must not affect production.')
assert(deploy.trackBRowsWritten === false, 'Smoke must not write Track B rows.')
assert(readiness.status === 'blocked', 'Readiness must stay blocked in ambiguous-target baseline.')
assert(readiness.productionAffected === false, 'Readiness must keep production unaffected.')
assert(readiness.pr198BackfillRowsWritten === false, 'Readiness must keep PR #198 backfill writes blocked.')
assert(readiness.remoteSqlRun === false, 'Readiness must record no remote SQL.')

for (const report of SUPABASE_PLUGIN_STAGING_DEPLOY_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR, report)), `Missing plugin deploy report: ${report}`)
}

const reportText = readAllFiles(SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR)
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
  assert(!reportText.includes(forbidden), `Plugin staging deploy reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-plugin-staging-milestone-registry-deploy-verify',
  reportDir: SUPABASE_PLUGIN_STAGING_DEPLOY_REPORT_DIR,
  expectedReports: SUPABASE_PLUGIN_STAGING_DEPLOY_EXPECTED_REPORTS.length,
  pluginTargetConfirmed: false,
  deployPerformed: false,
  trackBRowsWritten: false,
  productionAffected: false,
  remoteSqlRun: false,
  trackA: 'not_touched',
}, null, 2))
