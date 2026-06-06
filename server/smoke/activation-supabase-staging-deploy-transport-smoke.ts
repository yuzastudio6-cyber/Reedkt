import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS,
  SUPABASE_STAGING_DEPLOY_TRANSPORT_FORBIDDEN_CONFIRMATIONS,
  SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  buildSupabaseStagingDeployTransportReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

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
  'activation:supabase-staging-deploy-transport:plan',
  'activation:supabase-staging-deploy-transport:preflight',
  'activation:supabase-staging-deploy-transport:deploy',
  'activation:supabase-staging-deploy-transport:verify',
  'activation:supabase-staging-deploy-transport:report',
  'activation:supabase-staging-deploy-transport:summary',
  'smoke:activation-supabase-staging-deploy-transport',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport.ts',
  'server/cli/activation-supabase-staging-deploy-transport-plan.ts',
  'server/cli/activation-supabase-staging-deploy-transport-preflight.ts',
  'server/cli/activation-supabase-staging-deploy-transport-deploy.ts',
  'server/cli/activation-supabase-staging-deploy-transport-verify.ts',
  'server/cli/activation-supabase-staging-deploy-transport-report.ts',
  'server/cli/activation-supabase-staging-deploy-transport-summary.ts',
]) {
  assert(existsSync(file), `Missing transport file: ${file}`)
}

for (const file of [
  'docs/supabase-staging-deploy-transport-policy.md',
  'docs/supabase-staging-db-url-secret-reference-policy.md',
  'docs/supabase-staging-schema-deploy-transport-rerun.md',
  'docs/supabase-trackb-backfill-rerun-after-transport-deploy.md',
  'docs/implementation-prompts/prompt-supabase-trackb-staging-backfill-after-transport-deploy.md',
]) {
  assert(existsSync(file), `Missing transport doc: ${file}`)
}

assert(!existsSync('server/workers/supabase-staging-deploy-transport'), 'Transport phase must not add a worker.')

const moduleText = readFileSync(
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport.ts',
  'utf8',
)
for (const required of [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
  'npx_cli_db_push',
  '--dry-run',
  'directManualSqlAllowed: false',
  'trackBRowsWritten: false',
  'productionAffected: false',
  'credentialPayloadsPrinted: false',
  'secretPayloadsRead: false',
]) {
  assert(moduleText.includes(required), `Transport module missing guard: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
  'execute_sql',
  'supabase.from(',
  'from "../track-a',
  'from "../../track-a',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'console.log(process.env',
]) {
  assert(!moduleText.includes(forbidden), `Transport module must not include forbidden path/token: ${forbidden}`)
}

const savedEnv = new Map<string, string | undefined>()
for (const name of [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF',
  'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  ...SUPABASE_STAGING_DEPLOY_TRANSPORT_FORBIDDEN_CONFIRMATIONS,
]) {
  savedEnv.set(name, process.env[name])
  delete process.env[name]
}

const baselineReports = await buildSupabaseStagingDeployTransportReports()
const baselinePreflight = baselineReports.preflightReport as {
  status?: string
  npxPreflightReport?: { status?: string; npxDownloadAttempted?: boolean; blockers?: string[] }
  secretReferenceGuardReport?: { blockers?: string[]; dbUrlPayloadViewed?: boolean; dbUrlValuePrinted?: boolean }
}
const baselineStrategy = baselineReports.strategyReport as {
  selectedStrategy?: string
  blockers?: string[]
}
const baselineDeploy = baselineReports.schemaDeployTransportReport as {
  deployPerformed?: boolean
  dryRunPerformed?: boolean
  trackBRowsWritten?: boolean
  productionAffected?: boolean
  directManualSqlRun?: boolean
}
assert(baselinePreflight.npxPreflightReport?.status === 'skipped', 'npx preflight must skip without confirmation.')
assert(baselinePreflight.npxPreflightReport?.npxDownloadAttempted === false, 'npx must not download without confirmation.')
assert(
  baselinePreflight.secretReferenceGuardReport?.dbUrlPayloadViewed === false &&
    baselinePreflight.secretReferenceGuardReport?.dbUrlValuePrinted === false,
  'DB URL guard must not view or print payloads.',
)
assert(
  baselineStrategy.selectedStrategy === 'blocked_target_not_staging' ||
    baselineStrategy.selectedStrategy === 'blocked_credentials_unavailable' ||
    baselineStrategy.selectedStrategy === 'blocked_no_migration_safe_deploy_path',
  `Unexpected baseline strategy: ${baselineStrategy.selectedStrategy}`,
)
assert(baselineDeploy.deployPerformed === false, 'Smoke must not deploy.')
assert(baselineDeploy.dryRunPerformed === false, 'Smoke must not run dry-run.')
assert(baselineDeploy.trackBRowsWritten === false, 'Smoke must not write Track B rows.')
assert(baselineDeploy.productionAffected === false, 'Smoke must not affect production.')
assert(baselineDeploy.directManualSqlRun === false, 'Smoke must not run direct/manual SQL.')

process.env.REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF = 'true'
process.env.REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK = 'true'
const proofReports = await buildSupabaseStagingDeployTransportReports()
const proofPreflight = proofReports.preflightReport as {
  pluginTargetProofReport?: { stagingTargetConfirmed?: boolean }
  secretReferenceGuardReport?: { blockers?: string[] }
}
const proofStrategy = proofReports.strategyReport as { selectedStrategy?: string; blockers?: string[] }
assert(proofPreflight.pluginTargetProofReport?.stagingTargetConfirmed === true, 'Target proof should pass with approved proof confirmations.')
assert(
  proofPreflight.secretReferenceGuardReport?.blockers?.includes('staging_supabase_db_url_secret_reference_missing'),
  'Missing DB URL secret reference must block transport.',
)
assert(
  proofStrategy.selectedStrategy === 'blocked_credentials_unavailable' ||
    proofStrategy.selectedStrategy === 'blocked_no_migration_safe_deploy_path',
  `Proof-confirmed strategy must remain blocked without DB URL/CLI transport, saw ${proofStrategy.selectedStrategy}`,
)

for (const [name, value] of savedEnv) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

for (const report of SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR, report)), `Missing transport report: ${report}`)
}

const reportText = readAllFiles(SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR).map(({ text }) => text).join('\n')
for (const forbidden of [
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://',
  '"serviceRoleKey":',
  '"secretValue"',
  '"signedUrl"',
  'private-user-images.githubusercontent.com',
]) {
  assert(!reportText.includes(forbidden), `Transport reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-deploy-transport-rerun',
  reportDir: SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  expectedReports: SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS.length,
  npxSkippedWithoutConfirmation: true,
  targetProofPassesWithAllowedConfirmations: true,
  deployPerformed: false,
  trackBRowsWritten: false,
  productionAffected: false,
  directManualSqlRun: false,
  trackA: 'not_touched',
}, null, 2))
