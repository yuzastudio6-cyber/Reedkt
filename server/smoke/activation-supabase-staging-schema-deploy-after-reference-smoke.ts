import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_ALLOWED_CONFIRMATIONS,
  SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_EXPECTED_REPORTS,
  SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_FORBIDDEN_CONFIRMATIONS,
  SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
  buildSupabaseStagingSchemaAfterReferenceReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference'

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
  'activation:supabase-staging-schema-deploy-after-reference:plan',
  'activation:supabase-staging-schema-deploy-after-reference:preflight',
  'activation:supabase-staging-schema-deploy-after-reference:deploy',
  'activation:supabase-staging-schema-deploy-after-reference:verify',
  'activation:supabase-staging-schema-deploy-after-reference:report',
  'activation:supabase-staging-schema-deploy-after-reference:summary',
  'smoke:activation-supabase-staging-schema-deploy-after-reference',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference.ts',
  'server/cli/activation-supabase-staging-schema-deploy-after-reference-plan.ts',
  'server/cli/activation-supabase-staging-schema-deploy-after-reference-preflight.ts',
  'server/cli/activation-supabase-staging-schema-deploy-after-reference-deploy.ts',
  'server/cli/activation-supabase-staging-schema-deploy-after-reference-verify.ts',
  'server/cli/activation-supabase-staging-schema-deploy-after-reference-report.ts',
  'server/cli/activation-supabase-staging-schema-deploy-after-reference-summary.ts',
]) {
  assert(existsSync(file), `Missing after-reference file: ${file}`)
}

for (const file of [
  'docs/supabase-staging-schema-deploy-after-approved-target-reference.md',
  'docs/supabase-staging-schema-deploy-after-reference-secret-policy.md',
  'docs/supabase-trackb-backfill-rerun-after-staging-schema-deploy.md',
  'docs/implementation-prompts/prompt-supabase-trackb-staging-backfill-rerun-after-staging-schema-deploy.md',
]) {
  assert(existsSync(file), `Missing after-reference doc: ${file}`)
}

assert(!existsSync('server/workers/supabase-staging-schema-deploy-after-reference'), 'After-reference phase must not add a worker.')

const moduleText = [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-target-policy.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference.ts',
].map((file) => readFileSync(file, 'utf8')).join('\n')

for (const required of [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF',
  'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'delegate_to_pr209_pr206_migration_safe_deploy_path',
  'blocked_no_migration_safe_deploy_path',
  'directManualSqlAllowed: false',
  'trackBRowsWritten: false',
  'productionAffected: false',
  'secretPayloadsRead: false',
]) {
  assert(moduleText.includes(required), `After-reference module missing guard: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'console.log(process.env',
  'serviceRoleKey',
  'supabase.from(',
  'execute_sql',
  'from "../track-a',
  'from "../../track-a',
]) {
  assert(!moduleText.includes(forbidden), `After-reference module must not include forbidden path/token: ${forbidden}`)
}

const savedEnv = new Map<string, string | undefined>()
for (const name of [
  ...SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_ALLOWED_CONFIRMATIONS,
  ...SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_FORBIDDEN_CONFIRMATIONS,
]) {
  savedEnv.set(name, process.env[name])
  delete process.env[name]
}

const baselineReports = await buildSupabaseStagingSchemaAfterReferenceReports()
const baselineApproved = baselineReports.approvedStagingTargetReferenceLoadedReport as {
  status?: string
  approvedStagingProjectName?: string
  approvedStagingProjectRef?: string
  approvedEnvironment?: string
}
const baselineProof = baselineReports.pluginTargetProofAfterReferenceReport as {
  stagingTargetProofPassed?: boolean
  blockers?: string[]
}
assert(baselineApproved.status === 'passed', 'Approved staging target reference must load from PR #212 metadata.')
assert(baselineApproved.approvedStagingProjectName === 'Reeditpro', 'Approved staging target name mismatch.')
assert(baselineApproved.approvedStagingProjectRef === 'wmyyttnynmteqgcdishd', 'Approved staging target ref mismatch.')
assert(baselineApproved.approvedEnvironment === 'staging', 'Approved staging environment mismatch.')
assert(baselineProof.stagingTargetProofPassed === false, 'Target proof must not pass without proof confirmations.')
assert((baselineProof.blockers ?? []).includes('supabase_plugin_staging_target_check_not_confirmed'), 'Target proof must require plugin target-check confirmation.')

process.env.REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF = 'true'
process.env.REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK = 'true'
const proofConfirmedReports = await buildSupabaseStagingSchemaAfterReferenceReports()
const proofConfirmed = proofConfirmedReports.pluginTargetProofAfterReferenceReport as {
  stagingTargetProofPassed?: boolean
  secretPayloadsRead?: boolean
  credentialPayloadsPrinted?: boolean
}
const deploy = proofConfirmedReports.schemaDeployAfterReferenceReport as {
  deployPerformed?: boolean
  remoteSqlRun?: boolean
  directManualSqlRun?: boolean
  productionAffected?: boolean
  trackBRowsWritten?: boolean
}
const readiness = proofConfirmedReports.readinessReport as {
  status?: string
  pr198BackfillRowsWritten?: boolean
  productionAffected?: boolean
  remoteSqlRun?: boolean
}
assert(proofConfirmed.stagingTargetProofPassed === true, 'Target proof should pass when PR #212 reference and plugin check confirmations are set.')
assert(proofConfirmed.secretPayloadsRead === false, 'Target proof must not read secret payloads.')
assert(proofConfirmed.credentialPayloadsPrinted === false, 'Target proof must not print credential payloads.')
assert(deploy.deployPerformed === false, 'Smoke must not perform staging deploy.')
assert(deploy.remoteSqlRun === false, 'Smoke must not run remote SQL.')
assert(deploy.directManualSqlRun === false, 'Smoke must not run direct manual SQL.')
assert(deploy.productionAffected === false, 'Smoke must not affect production.')
assert(deploy.trackBRowsWritten === false, 'Smoke must not write Track B rows.')
assert(readiness.status === 'blocked', 'Readiness must remain blocked without deploy/verify evidence.')
assert(readiness.pr198BackfillRowsWritten === false, 'Readiness must keep PR #198 backfill writes blocked.')
assert(readiness.remoteSqlRun === false, 'Readiness must record no remote SQL.')
assert(readiness.productionAffected === false, 'Readiness must keep production unaffected.')

for (const [name, value] of savedEnv) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

for (const report of SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR, report)), `Missing after-reference report: ${report}`)
}

const reportText = readAllFiles(SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR).map(({ text }) => text).join('\n')
for (const forbidden of [
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://',
  '"serviceRoleKey":',
  '"secretValue"',
  '"signedUrl"',
  'private-user-images.githubusercontent.com',
]) {
  assert(!reportText.includes(forbidden), `After-reference reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-schema-deploy-after-target-reference',
  reportDir: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_REPORT_DIR,
  expectedReports: SUPABASE_STAGING_SCHEMA_AFTER_REFERENCE_EXPECTED_REPORTS.length,
  approvedTargetReference: 'passed',
  proofPassesWithAllowedConfirmations: true,
  deployPerformed: false,
  trackBRowsWritten: false,
  productionAffected: false,
  remoteSqlRun: false,
  trackA: 'not_touched',
}, null, 2))
