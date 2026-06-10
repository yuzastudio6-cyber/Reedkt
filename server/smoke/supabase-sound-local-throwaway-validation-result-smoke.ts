import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-throwaway-validation-result'

const validationReportPath = 'docs/supabase-sound-local-throwaway-validation-report.md'
const finalRollupDocPath = 'docs/supabase-sound-final-owner-evidence-rollup.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-throwaway-validation-result'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-throwaway-validation-result-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-BLOCKED: local throwaway database setup plan, no SQL'

const requiredOwners = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

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
  check(!lower.includes('supabasecloudtouched: true'), `${label} must not contain cloud touch markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!lower.includes('storageobjectscreated: true'), `${label} must not contain storage object markers.`)
  check(!lower.includes('signedurlscreated: true'), `${label} must not contain signed URL markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function assertNoConcreteSecretsOrUrls(source: string, label: string): void {
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

check(existsSync(validationReportPath), 'Validation report must exist.')
check(existsSync(finalRollupDocPath), 'Final owner evidence rollup must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const validationReport = readFileSync(validationReportPath, 'utf8')
const finalRollupDoc = readFileSync(finalRollupDocPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-4 Local Throwaway Validation Report',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Validation outcome: blocked before SQL execution.',
  'No deployment occurred.',
  'No production or staging target was used.',
  'No live customer data was used.',
  'No generated_local_fixture_passed claim is made.',
  'No Supabase cloud project was touched.',
  'No active migration was created under `supabase/migrations`.',
  'Draft SQL and draft test SQL were inspected only and not modified.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'local target used: none.',
  'host proof: `pg_isready -h localhost` returned `localhost:5432 - no response`.',
  'database name proof: no database was created; proposed name `reeditpro_sound_fixture_validation_throwaway` was not used.',
  'no-production proof: no connection to production was attempted.',
  'no-staging proof: no connection to staging was attempted.',
  'no-live-data proof: no database connection was made.',
  'Supabase cloud avoided: yes.',
  '`supabase/migrations` untouched: yes.',
  'draft SQL/test files unchanged: yes.',
  'No SQL command was run.',
  'No `psql` command was run.',
  'No `createdb` command was run.',
  'No `dropdb` command was run.',
  'executed: no.',
  'result: blocked.',
  'throwaway database created: no.',
  'throwaway database dropped: not created.',
  'cleanup verified: yes, because no database was created.',
  'provider calls: false.',
  'worker dispatch: false.',
  'Supabase cloud mutation: false.',
  'storage writes: false.',
  'signed URLs: false.',
  'generated audio/assets: false.',
  'media processing: false.',
  'render/export: false.',
  'credit spend/reservation: false.',
  'localValidationAttempted: false.',
  'localValidationPassed: false.',
  'draftMigrationPassed: blocked.',
  'draftTestsPassed: blocked.',
  'generatedLocalFixturePassedClaimed: false.',
  'Supabase environment touched: none.',
  'SQL executed: no.',
  'Migration deployed: no.',
  'SUPABASE-SOUND-4-BLOCKED: local throwaway database setup plan, no SQL',
]) {
  requireText(validationReport, required, `Validation report must include ${required}.`)
}

for (const owner of requiredOwners) {
  requireText(validationReport, owner, `Validation report must include owner ${owner}.`)
  check(
    SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.ownerEvidence.some(
      (entry) => entry.owner === owner && entry.conditionalNoExecutionAcceptance,
    ),
    `Validation result must include owner ${owner}.`,
  )
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.workstream === 'SUPABASE_RLS_STORAGE_DATABASE',
  'Workstream must be Supabase.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.requestingWorkstream === 'SOUND_MUSIC_AUDIO',
  'Requesting workstream must be SOUND.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.mode === 'local_throwaway_validation_result',
  'Mode must be local_throwaway_validation_result.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.claimsGeneratedLocalFixturePassed === false,
  'generated_local_fixture_passed must not be claimed.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.generatedLocalFixturePassedClaimed === false,
  'Decision must not claim generated_local_fixture_passed.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.localValidationAttempted === false,
  'Local validation must not be attempted in blocked path.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.localValidationPassed === false,
  'Local validation must not pass in blocked path.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.draftMigrationPassed === 'blocked',
  'Draft migration must be blocked.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.draftTestsPassed === 'blocked',
  'Draft tests must be blocked.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.recommendedImmediateNextPrompt ===
    recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

const safety = SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.safety
check(safety.localThrowawayOnly === true, 'Safety must require local throwaway only.')
check(safety.noDeploy === true, 'Safety must be no deploy.')
check(safety.noProduction === true, 'Safety must be no production.')
check(safety.noStaging === true, 'Safety must be no staging.')
check(safety.noLiveCustomerData === true, 'Safety must be no live customer data.')
check(safety.supabaseCloudTouched === false, 'Supabase cloud must not be touched.')
check(safety.supabaseMigrationsChanged === false, 'Supabase migrations must not change.')
check(safety.draftSqlFilesChanged === false, 'Draft SQL files must not change.')
check(safety.secretsExposed === false, 'Secrets must not be exposed.')
check(safety.localTargetVerified === false, 'Local target must not be verified in blocked path.')
check(safety.pgIsReadyResult === 'localhost:5432 - no response', 'pg_isready result must be recorded.')

assertAllExecutionFlagsFalse(SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.execution, 'validation.execution')

check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.cleanup.throwawayDatabaseCreated === false,
  'Throwaway database must not be created.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.cleanup.throwawayDatabaseDropped === false,
  'Throwaway database must not be dropped because it was not created.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.cleanup.cleanupVerified === true,
  'Cleanup must be verified.',
)

check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.sourceOfTruthPath.requiresSupabaseRow === true,
  'Source-of-truth path must require Supabase row.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source-of-truth path must require private GCS path.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.sourceOfTruthPath.requiresManifest === true,
  'Source-of-truth path must require manifest.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.sourceOfTruthPath.requiresChecksum === true,
  'Source-of-truth path must require checksum.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved snapshot.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.sourceOfTruthPath.publicUrlsAllowed === false,
  'Public URLs must remain blocked.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt execution must remain blocked.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.rawPromptRule.requiresEditIntents === true,
  'Edit intents must be required.',
)
check(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved snapshot must be required.',
)

check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_PROPOSAL === true,
  'Prior rollup proposal must remain true.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW === false,
  'Prior rollup execution must remain false.',
)
assertAllExecutionFlagsFalse(SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.execution, 'rollup.execution')

assertNoConcreteForbiddenText(validationReport, 'validationReport')
assertNoConcreteForbiddenText(finalRollupDoc, 'finalRollupDoc')
scanForbiddenValues(
  SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT,
  'SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT',
)
assertNoConcreteSecretsOrUrls(draftMigration, 'draftMigration')
assertNoConcreteSecretsOrUrls(draftTests, 'draftTests')

console.log(JSON.stringify({
  ok: true,
  workstream: SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.workstream,
  requestingWorkstream: SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.requestingWorkstream,
  smoke: 'supabase-sound-local-throwaway-validation-result',
  mode: SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.mode,
  localValidationAttempted:
    SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.localValidationAttempted,
  localValidationPassed:
    SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.localValidationPassed,
  claimsGeneratedLocalFixturePassed:
    SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.claimsGeneratedLocalFixturePassed,
  sqlExecutedOnlyAgainstLocalThrowaway:
    SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.execution.sqlExecutedOnlyAgainstLocalThrowaway,
  migrationDeployed: SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.execution.migrationDeployed,
  supabaseCloudTouched: SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.safety.supabaseCloudTouched,
  recommendedImmediateNextPrompt:
    SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT.decision.recommendedImmediateNextPrompt,
}))
