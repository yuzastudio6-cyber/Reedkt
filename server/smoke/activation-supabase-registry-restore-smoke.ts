import { existsSync, readFileSync } from 'node:fs'
import {
  SUPABASE_REGISTRY_RESTORE_BASE_BRANCH,
  SUPABASE_REGISTRY_RESTORE_BRANCH,
  SUPABASE_REGISTRY_RESTORE_EXPECTED_LOCAL_ARTIFACTS,
  SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV,
  runSupabaseRegistryRestore,
} from '../activation/supabase-registry-restore'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-registry-restore',
  'activation:supabase-registry-restore:report',
  'activation:supabase-registry-restore:summary',
  'smoke:activation-supabase-registry-restore',
  'activation:supabase-milestone-sync:report',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/supabase-registry-restore/index.ts',
  'server/activation/supabase-milestone-registry/index.ts',
  'server/activation/supabase-milestone-sync/index.ts',
  'supabase/migrations/202606040001_activation_milestone_registry.sql',
  'docs/supabase-approved-staging-target-reference.md',
]) {
  assert(existsSync(file), `Missing SUPABASE-REGISTRY-1 file: ${file}`)
}

const migrationText = readFileSync('supabase/migrations/202606040001_activation_milestone_registry.sql', 'utf8')
for (const tableName of [
  'activation_runs',
  'activation_artifacts',
  'activation_qa_gates',
  'readiness_snapshots',
  'tool_capabilities',
  'feature_gates',
]) {
  assert(migrationText.includes(`public.${tableName}`), `Migration missing ${tableName}`)
}

const moduleText = readFileSync('server/activation/supabase-registry-restore/index.ts', 'utf8')
for (const required of [
  SUPABASE_REGISTRY_RESTORE_BRANCH,
  SUPABASE_REGISTRY_RESTORE_BASE_BRANCH,
  'REEDITPRO_CONFIRM_SUPABASE_REGISTRY_RESTORE',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL',
  '--execute',
  'GCP_PROJECT_ID',
  'GCP_REGION',
  'REEDITPRO_ENV',
  'requiredSecretSource: \'google_secret_manager\'',
  'ready_to_rerun_PROVIDER_1_milestone_sync',
  'Proof-only or blocked guard mode does not read service-role secret payloads.',
  'dbPushOverFullMigrationDirectoryAllowed: false',
  'historicalBackfillAllowed: false',
  'provider1RerunAllowed: false',
  'publicArtifactsAllowed: false',
]) {
  assert(moduleText.includes(required), `Restore module missing guard: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL=true',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'console.log(process.env',
  'supabase.from(',
  'db push',
  'docker',
]) {
  assert(!moduleText.includes(forbidden), `Restore module must not include forbidden token/path: ${forbidden}`)
}

const savedEnv = new Map<string, string | undefined>()
const guardEnvNames = Object.keys(SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV)
for (const name of guardEnvNames) {
  savedEnv.set(name, process.env[name])
  delete process.env[name]
}

try {
  const report = await runSupabaseRegistryRestore({
    runId: 'registry1-smoke',
    writeLocalArtifacts: false,
  })

  assert(report.execution === 'proof_only_completed', 'Smoke must run in proof-only mode without confirmations.')
  assert(report.sqlExecuted === false, 'Smoke must not execute SQL.')
  assert(report.migrationDeployed === false, 'Smoke must not deploy migrations.')
  assert(report.supabaseRowsWritten === false, 'Smoke must not write Supabase rows.')
  assert(report.gcsUploaded === false, 'Smoke must not upload GCS artifacts.')
  assert(report.secretMetadata.secretPayloadsRead === false, 'Proof-only smoke must not read secret payloads.')
  assert(report.secretMetadata.secretPayloadsPrinted === false, 'Proof-only smoke must not print secret payloads.')
  assert(report.approvedStagingTarget.approvedStagingProjectRef === 'wmyyttnynmteqgcdishd', 'Approved staging target ref mismatch.')
  assert(report.approvedStagingTarget.approvedEnvironment === 'staging', 'Approved staging environment mismatch.')
  assert(report.provider1UnblockHandoff.status === 'blocked', 'Provider-1 must remain blocked in proof-only smoke.')

  for (const [name, value] of Object.entries(SUPABASE_REGISTRY_RESTORE_REQUIRED_EXECUTION_ENV)) {
    process.env[name] = value
  }
  const flagsWithoutExecute = await runSupabaseRegistryRestore({
    runId: 'registry1-smoke',
    writeLocalArtifacts: false,
    execute: false,
  })
  assert(flagsWithoutExecute.execution === 'blocked', 'Confirmation flags without --execute must stay blocked.')
  assert(flagsWithoutExecute.executionGuard.status === 'blocked', 'Confirmation flags without --execute must fail the execution guard.')
  assert(flagsWithoutExecute.sqlExecuted === false, 'Confirmation flags without --execute must not execute SQL.')
  assert(flagsWithoutExecute.migrationDeployed === false, 'Confirmation flags without --execute must not deploy migrations.')
  assert(flagsWithoutExecute.gcsUploaded === false, 'Confirmation flags without --execute must not upload GCS artifacts.')
  assert(flagsWithoutExecute.secretMetadata.secretPayloadsRead === false, 'Confirmation flags without --execute must not read secret payloads.')

  process.env.GCP_PROJECT_ID = 'not-reeditpro'
  const envMismatch = await runSupabaseRegistryRestore({
    runId: 'registry1-smoke',
    writeLocalArtifacts: false,
    execute: true,
  })
  assert(envMismatch.execution === 'blocked', 'Env mismatch with --execute must stay blocked.')
  assert(envMismatch.executionGuard.status === 'blocked', 'Env mismatch must fail the execution guard.')
  assert(envMismatch.sqlExecuted === false, 'Env mismatch must not execute SQL.')
  assert(envMismatch.migrationDeployed === false, 'Env mismatch must not deploy migrations.')
  assert(envMismatch.gcsUploaded === false, 'Env mismatch must not upload GCS artifacts.')
  assert(envMismatch.secretMetadata.secretPayloadsRead === false, 'Env mismatch must not read secret payloads.')

  for (const relativePath of SUPABASE_REGISTRY_RESTORE_EXPECTED_LOCAL_ARTIFACTS) {
    assert(relativePath.endsWith('.json'), `Expected artifact must be JSON: ${relativePath}`)
  }
  assert(
    SUPABASE_REGISTRY_RESTORE_EXPECTED_LOCAL_ARTIFACTS.includes('restore/registry-restore-result.json'),
    'Confirmed artifact list must include restore/registry-restore-result.json',
  )
  assert(
    SUPABASE_REGISTRY_RESTORE_EXPECTED_LOCAL_ARTIFACTS.includes('qa/supabase-registry-restore-qa.json'),
    'Confirmed artifact list must include QA artifact.',
  )
  assert(
    SUPABASE_REGISTRY_RESTORE_EXPECTED_LOCAL_ARTIFACTS.includes('reports/supabase-registry-restore-report.json'),
    'Confirmed artifact list must include report artifact.',
  )
} finally {
  for (const [name, value] of savedEnv) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-registry-1',
  branch: SUPABASE_REGISTRY_RESTORE_BRANCH,
  baseBranch: SUPABASE_REGISTRY_RESTORE_BASE_BRANCH,
  proofOnlyExecution: true,
  sqlExecuted: false,
  migrationDeployed: false,
  gcsUploaded: false,
  provider1Unblocked: false,
}, null, 2))
