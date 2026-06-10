import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_THROWAWAY_DB_SETUP_PLAN } from '../../src/backend/mock/mock-supabase-sound-local-throwaway-db-setup-plan'
import { SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-throwaway-validation-result'

const setupPlanDocPath = 'docs/supabase-sound-local-throwaway-db-setup-plan.md'
const validationReportPath = 'docs/supabase-sound-local-throwaway-validation-report.md'
const finalRollupDocPath = 'docs/supabase-sound-final-owner-evidence-rollup.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-throwaway-db-setup-plan'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-throwaway-db-setup-plan-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-RETRY: run draft migration validation in approved local throwaway database, no deploy'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, message = `Missing required text: ${text}`): void {
  check(source.includes(text), message)
}

function assertNoConcreteForbiddenText(source: string, label: string): void {
  const lower = source.toLowerCase()
  check(!/^https?:\/\//im.test(source), `${label} must not contain concrete public URLs.`)
  check(!lower.includes('x-goog-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('x-amz-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('signature='), `${label} must not contain signed URL query values.`)
  check(!lower.includes('token='), `${label} must not contain tokenized URL values.`)
  check(!lower.includes('storage.googleapis.com'), `${label} must not contain storage public URLs.`)
  check(!lower.includes('gs://'), `${label} must not contain concrete storage URIs.`)
  check(!lower.includes('gcs://'), `${label} must not contain concrete storage URIs.`)
  check(!lower.includes('provider_secret'), `${label} must not contain provider secret fields.`)
  check(!lower.includes('providercredential'), `${label} must not contain provider credential markers.`)
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('database_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('db_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('password='), `${label} must not contain database password values.`)
  check(!lower.includes('raw_prompt'), `${label} must not contain raw prompt fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('databasecreatednow: true'), `${label} must not contain database creation markers.`)
  check(!lower.includes('servicestartednow: true'), `${label} must not contain service start markers.`)
  check(!lower.includes('supabasecloudtouched: true'), `${label} must not contain cloud touch markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!lower.includes('storageobjectscreated: true'), `${label} must not contain storage object markers.`)
  check(!lower.includes('signedurlscreated: true'), `${label} must not contain signed URL markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function scanForbiddenValues(value: unknown, label: string): void {
  if (typeof value === 'string') {
    assertNoConcreteForbiddenText(value, label)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbiddenValues(item, `${label}[${index}]`))
    return
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      assertNoConcreteForbiddenText(key, `${label}.${key}`)
      scanForbiddenValues(nestedValue, `${label}.${key}`)
    }
  }
}

function assertAllExecutionFlagsFalse(flags: Record<string, boolean>, label: string): void {
  for (const [key, value] of Object.entries(flags)) {
    check(value === false, `${label}.${key} must be false.`)
  }
}

check(existsSync(setupPlanDocPath), 'Setup plan doc must exist.')
check(existsSync(validationReportPath), 'Prior blocked validation report must exist.')
check(existsSync(finalRollupDocPath), 'Final owner evidence rollup doc must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const setupPlanDoc = readFileSync(setupPlanDocPath, 'utf8')
const validationReport = readFileSync(validationReportPath, 'utf8')
const finalRollupDoc = readFileSync(finalRollupDocPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-4-BLOCKED Local Throwaway Database Setup Plan',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'This document is setup-plan-only.',
  'This document does not execute SQL.',
  'This document does not create or drop databases.',
  'This document does not start services.',
  'This document does not install packages.',
  'This document does not touch Supabase cloud.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 was blocked because local PostgreSQL was unavailable during that attempt.',
  '`pg_isready -h localhost` returned no response during the blocked validation result.',
  '`pg_isready -h localhost` now reports `localhost:5432 - accepting connections`.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'The target must be local or throwaway non-production only.',
  'The host must be localhost, 127.0.0.1, ::1, or a Unix socket.',
  'The database name must include local, test, throwaway, or sound_fixture_validation.',
  'Supabase cloud URLs are forbidden.',
  'These options document acceptable setup paths only. They are not executed by this prompt.',
  'The following are examples only. They are not run now.',
  'Docker is not allowed by default.',
  'SUPABASE-SOUND-4-RETRY: run draft migration validation in approved local throwaway database, no deploy',
]) {
  requireText(setupPlanDoc, required, `Setup plan doc must include ${required}.`)
}

for (const required of [
  '# SUPABASE-SOUND-4 Local Throwaway Validation Report',
  'Validation outcome: blocked before SQL execution.',
  'No SQL command was run.',
  'No `psql` command was run.',
  'No `createdb` command was run.',
  'No `dropdb` command was run.',
  'localValidationAttempted: false.',
  'generatedLocalFixturePassedClaimed: false.',
]) {
  requireText(validationReport, required, `Blocked validation report must include ${required}.`)
}

requireText(finalRollupDoc, 'goForSUPABASE_SOUND_4_PROPOSAL: true.')
requireText(finalRollupDoc, 'goForSUPABASE_SOUND_4_EXECUTION_NOW: false.')
requireText(finalRollupDoc, 'generatedLocalFixturePassedClaimed: false.')

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

const setupPlan = SUPABASE_SOUND_LOCAL_THROWAWAY_DB_SETUP_PLAN
check(setupPlan.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(setupPlan.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(setupPlan.mode === 'local_throwaway_db_setup_plan_only', 'Mode must be setup-plan-only.')
check(setupPlan.claimsGeneratedLocalFixturePassed === false, 'generated_local_fixture_passed must not be claimed.')
check(setupPlan.previousBlockedResult.reason === 'local_postgres_unavailable', 'Historical blocker must be recorded.')
check(
  setupPlan.previousBlockedResult.pgIsReadyLocalhostStatus === 'localhost:5432 - no response',
  'Historical pg_isready status must be recorded.',
)
check(setupPlan.previousBlockedResult.localValidationAttempted === false, 'Prior local validation must be blocked.')
check(setupPlan.previousBlockedResult.sqlExecuted === false, 'Prior SQL execution must be false.')
check(setupPlan.currentLocalTooling.psqlAvailable === true, 'psql availability must be recorded.')
check(setupPlan.currentLocalTooling.pgIsReadyAvailable === true, 'pg_isready availability must be recorded.')
check(setupPlan.currentLocalTooling.createdbAvailable === true, 'createdb availability must be recorded.')
check(setupPlan.currentLocalTooling.dropdbAvailable === true, 'dropdb availability must be recorded.')
check(
  setupPlan.currentLocalTooling.pgIsReadyLocalhostStatus === 'localhost:5432 - accepting connections',
  'Current localhost readiness must be recorded.',
)
check(setupPlan.currentLocalTooling.localPostgresResponds === true, 'Current local Postgres response must be true.')
check(setupPlan.setupPlan.setupExecutedNow === false, 'Setup must not execute now.')
check(setupPlan.setupPlan.databaseCreatedNow === false, 'Database must not be created now.')
check(setupPlan.setupPlan.databaseDroppedNow === false, 'Database must not be dropped now.')
check(setupPlan.setupPlan.serviceStartedNow === false, 'Service must not be started now.')
check(setupPlan.setupPlan.packagesInstalledNow === false, 'Packages must not be installed now.')
check(setupPlan.setupPlan.dockerUsedNow === false, 'Docker must not be used now.')
check(setupPlan.setupPlan.supabaseCloudTouched === false, 'Supabase cloud must not be touched.')
check(setupPlan.requirements.localThrowawayOnly === true, 'Local throwaway must be required.')
check(setupPlan.requirements.noDeploy === true, 'No-deploy must be required.')
check(setupPlan.requirements.noProduction === true, 'No-production must be required.')
check(setupPlan.requirements.noLiveCustomerData === true, 'No live customer data must be required.')
check(setupPlan.requirements.hostMustBeLocal === true, 'Host must be local.')
check(setupPlan.requirements.databaseNameMustBeThrowaway === true, 'Database name must be throwaway.')
check(
  setupPlan.requirements.supabaseMigrationsMustRemainUntouched === true,
  'Supabase migrations must remain untouched.',
)
check(
  setupPlan.requirements.draftSqlFilesMustRemainUnchanged === true,
  'Draft SQL files must remain unchanged.',
)
check(setupPlan.futureRetry.currentReadinessSupportsRetryPrompt === true, 'Current readiness must support retry prompt.')
check(
  setupPlan.futureRetry.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match current readiness.',
)

assertAllExecutionFlagsFalse(setupPlan.execution, 'setupPlan.execution')
assertAllExecutionFlagsFalse(SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.execution, 'validation.execution')
assertAllExecutionFlagsFalse(SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.execution, 'rollup.execution')

check(setupPlan.sourceOfTruthPath.requiresSupabaseRow === true, 'Source-of-truth path must require Supabase row.')
check(setupPlan.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Source-of-truth path must require private GCS path.')
check(setupPlan.sourceOfTruthPath.requiresManifest === true, 'Source-of-truth path must require manifest.')
check(setupPlan.sourceOfTruthPath.requiresChecksum === true, 'Source-of-truth path must require checksum.')
check(
  setupPlan.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved snapshot.',
)
check(setupPlan.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
check(setupPlan.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')
check(setupPlan.rawPromptRule.rawPromptDirectExecutionAllowed === false, 'Raw prompt execution must remain blocked.')
check(setupPlan.rawPromptRule.requiresStructuredAgentFindings === true, 'Structured findings must be required.')
check(setupPlan.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(setupPlan.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Approved snapshot must be required.')

assertNoConcreteForbiddenText(setupPlanDoc, 'setupPlanDoc')
assertNoConcreteForbiddenText(validationReport, 'validationReport')
assertNoConcreteForbiddenText(finalRollupDoc, 'finalRollupDoc')
scanForbiddenValues(setupPlan, 'SUPABASE_SOUND_LOCAL_THROWAWAY_DB_SETUP_PLAN')

console.log(JSON.stringify({
  ok: true,
  workstream: setupPlan.workstream,
  requestingWorkstream: setupPlan.requestingWorkstream,
  smoke: 'supabase-sound-local-throwaway-db-setup-plan',
  mode: setupPlan.mode,
  historicalBlocker: setupPlan.previousBlockedResult.reason,
  currentLocalPostgresResponds: setupPlan.currentLocalTooling.localPostgresResponds,
  sqlExecuted: setupPlan.execution.sqlExecuted,
  databaseCreatedNow: setupPlan.setupPlan.databaseCreatedNow,
  serviceStartedNow: setupPlan.setupPlan.serviceStartedNow,
  supabaseCloudTouched: setupPlan.setupPlan.supabaseCloudTouched,
  claimsGeneratedLocalFixturePassed: setupPlan.claimsGeneratedLocalFixturePassed,
  recommendedImmediateNextPrompt: setupPlan.futureRetry.recommendedImmediateNextPrompt,
}))
