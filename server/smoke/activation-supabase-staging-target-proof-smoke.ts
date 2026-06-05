import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_TARGET_PROOF_EXPECTED_REPORTS,
  SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
  buildSupabaseStagingTargetProofReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof'

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
  'activation:supabase-staging-target-proof:plan',
  'activation:supabase-staging-target-proof:preflight',
  'activation:supabase-staging-target-proof:deploy',
  'activation:supabase-staging-target-proof:verify',
  'activation:supabase-staging-target-proof:report',
  'activation:supabase-staging-target-proof:summary',
  'smoke:activation-supabase-staging-target-proof',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-target-policy.ts',
  'server/cli/activation-supabase-staging-target-proof-plan.ts',
  'server/cli/activation-supabase-staging-target-proof-preflight.ts',
  'server/cli/activation-supabase-staging-target-proof-deploy.ts',
  'server/cli/activation-supabase-staging-target-proof-verify.ts',
  'server/cli/activation-supabase-staging-target-proof-report.ts',
  'server/cli/activation-supabase-staging-target-proof-summary.ts',
]) {
  assert(existsSync(file), `Missing staging target proof file: ${file}`)
}

for (const file of [
  'docs/supabase-staging-target-proof-policy.md',
  'docs/supabase-plugin-staging-target-proof-report.md',
  'docs/supabase-milestone-registry-staging-deploy-rerun.md',
  'docs/supabase-trackb-backfill-rerun-after-target-proof.md',
  'docs/implementation-prompts/prompt-supabase-trackb-staging-backfill-rerun-after-target-proof.md',
]) {
  assert(existsSync(file), `Missing staging target proof doc: ${file}`)
}

assert(!existsSync('server/workers/supabase-staging-target-proof'), 'Staging target proof phase must not add a worker.')

const moduleText = [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-reference.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof.ts',
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-target-policy.ts',
].map((file) => readFileSync(file, 'utf8')).join('\n')

for (const required of [
  'approved_staging_target_reference_missing',
  'supabase_plugin_target_not_confirmed_as_staging',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF',
  'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK',
  'delegatesToExistingPr206PathOnlyAfterProofPasses: true',
  'deployTrackBExportRows: false',
  'rawAdHocSql: false',
  'secretPayloadsPrinted: false',
  'productionAffected: false',
  'trackBRowsWritten: false',
]) {
  assert(moduleText.includes(required), `Staging target proof module missing guard: ${required}`)
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
  assert(!moduleText.includes(forbidden), `Staging target proof module must not include forbidden path/token: ${forbidden}`)
}

const reports = await buildSupabaseStagingTargetProofReports()
const approved = reports.approvedTargetReferenceReport as { status?: string; blockers?: string[] }
const proof = reports.pluginTargetProofReport as {
  status?: string
  stagingTargetProofPassed?: boolean
  blockers?: string[]
  secretPayloadsPrinted?: boolean
  secretPayloadsRead?: boolean
}
const deploy = reports.schemaDeployRerunReport as {
  deployPerformed?: boolean
  remoteSqlRun?: boolean
  productionAffected?: boolean
  trackBRowsWritten?: boolean
}
const readiness = reports.readinessReport as {
  status?: string
  pr198BackfillRowsWritten?: boolean
  remoteSqlRun?: boolean
  productionAffected?: boolean
  blockers?: string[]
}
assert(approved.status === 'blocked', 'Smoke baseline must keep approved staging reference blocked until repo-safe proof exists.')
assert((approved.blockers ?? []).includes('approved_staging_target_reference_missing'), 'Approved target reference blocker missing.')
assert(proof.stagingTargetProofPassed === false, 'Plugin target proof must not pass without approved reference.')
assert((proof.blockers ?? []).includes('supabase_plugin_target_not_confirmed_as_staging'), 'Plugin target proof must record ambiguous target blocker.')
assert(proof.secretPayloadsPrinted === false && proof.secretPayloadsRead === false, 'Target proof must not read or print secret payloads.')
assert(deploy.deployPerformed === false, 'Smoke must not perform staging deploy.')
assert(deploy.remoteSqlRun === false, 'Smoke must not run remote SQL.')
assert(deploy.productionAffected === false, 'Smoke must not affect production.')
assert(deploy.trackBRowsWritten === false, 'Smoke must not write Track B rows.')
assert(readiness.status === 'blocked', 'Readiness must stay blocked in missing-target-proof baseline.')
assert(readiness.pr198BackfillRowsWritten === false, 'Readiness must keep PR #198 backfill writes blocked.')
assert(readiness.remoteSqlRun === false, 'Readiness must record no remote SQL.')
assert(readiness.productionAffected === false, 'Readiness must keep production unaffected.')

for (const report of SUPABASE_STAGING_TARGET_PROOF_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR, report)), `Missing staging target proof report: ${report}`)
}

const reportText = readAllFiles(SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR).map(({ text }) => text).join('\n')
for (const forbidden of [
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://',
  '"serviceRoleKey":',
  '"secretValue"',
  '"signedUrl"',
  'private-user-images.githubusercontent.com',
]) {
  assert(!reportText.includes(forbidden), `Staging target proof reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-target-proof-deploy-rerun',
  reportDir: SUPABASE_STAGING_TARGET_PROOF_REPORT_DIR,
  expectedReports: SUPABASE_STAGING_TARGET_PROOF_EXPECTED_REPORTS.length,
  approvedTargetReference: 'missing_by_design',
  pluginTargetProofPassed: false,
  deployPerformed: false,
  trackBRowsWritten: false,
  productionAffected: false,
  remoteSqlRun: false,
  trackA: 'not_touched',
}, null, 2))
