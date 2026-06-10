import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_DRAFT_MIGRATION_BASELINE_GUARD_FIX } from '../../src/backend/mock/mock-supabase-sound-draft-migration-baseline-guard-fix'
import { SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RETRY_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-throwaway-validation-retry-result'

const fixDocPath = 'docs/supabase-sound-draft-migration-baseline-guard-fix.md'
const retryReportPath = 'docs/supabase-sound-local-throwaway-validation-retry-report.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestsPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-draft-migration-baseline-guard-fix'
const scriptCommand =
  'tsx server/smoke/supabase-sound-draft-migration-baseline-guard-fix-smoke.ts'
const errorCode = 'SUPABASE_SOUND_DRAFT_REQUIRES_BASELINE_SCHEMA'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-RETRY-BASELINE: run draft validation against approved local baseline schema, no deploy'

const requiredRelations = [
  'public.approved_plan_snapshots',
  'public.storage_object_records',
  'public.signed_url_events',
  'public.generation_requests',
  'public.generated_assets',
  'public.jobs',
  'public.job_events',
  'public.sound_effect_plans',
  'public.ambient_sound_plans',
  'public.music_plans',
  'public.audio_environment_analysis',
  'public.qa_reports',
  'public.credit_estimates',
  'public.credit_approvals',
  'public.credit_reservations',
  'public.worker_runtime_configs',
] as const

const optionalRelations = [
  'public.feature_gates',
  'public.tool_capabilities',
] as const

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, label: string): void {
  check(source.includes(text), `${label} must include ${text}.`)
}

function stripSqlComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n')
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
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('raw_provider_prompt'), `${label} must not contain raw provider prompt fields.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function assertNoMutationStatements(source: string, label: string): void {
  const uncommentedSql = stripSqlComments(source).toLowerCase()
  check(!/\binsert\s+into\b/.test(uncommentedSql), `${label} must not contain insert statements.`)
  check(!/\bcreate\s+table\b/.test(uncommentedSql), `${label} must not create baseline tables.`)
  check(!/\bcreate\s+policy\b/.test(uncommentedSql), `${label} must not create active policies.`)
  check(
    !/\bcreate\s+trigger\b/.test(uncommentedSql),
    `${label} must not create active triggers.`,
  )
  check(
    !/insert\s+into\s+public\.(feature_gates|tool_capabilities|worker_runtime_configs)/.test(
      uncommentedSql,
    ),
    `${label} must not seed feature gates, tool capabilities, or worker runtime configs.`,
  )
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

check(existsSync(fixDocPath), 'Baseline guard fix doc must exist.')
check(existsSync(retryReportPath), 'Retry validation report must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestsPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const fixDoc = readFileSync(fixDocPath, 'utf8')
const retryReport = readFileSync(retryReportPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestsPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-4-FIX Draft Migration Baseline Guard Fix',
  'Status: draft-repair-only.',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'user/chat request → structured agent findings → edit intents → approved plan snapshot → worker execution',
  'relation "public.approved_plan_snapshots" does not exist',
  errorCode,
  recommendedImmediateNextPrompt,
]) {
  requireText(fixDoc, required, 'fixDoc')
}

for (const required of [
  '-- DRAFT ONLY.',
  '-- DO NOT APPLY.',
  '-- DO NOT DEPLOY.',
  '-- Baseline prerequisite guard',
  'do $$',
  'to_regclass(required_relation)',
  errorCode,
  'Required starting relation includes public.approved_plan_snapshots.',
]) {
  requireText(draftMigration, required, 'draftMigration')
}

for (const required of [
  '-- DRAFT TESTS ONLY.',
  '-- DO NOT RUN AGAINST PRODUCTION.',
  '-- Baseline prerequisite guard.',
  'do $$',
  'to_regclass(required_relation)',
  errorCode,
  'Required starting relation includes public.approved_plan_snapshots.',
]) {
  requireText(draftTests, required, 'draftTests')
}

for (const relation of requiredRelations) {
  requireText(draftMigration, `'${relation}'`, 'draftMigration')
  requireText(draftTests, `'${relation}'`, 'draftTests')
  check(
    SUPABASE_SOUND_DRAFT_MIGRATION_BASELINE_GUARD_FIX.baselineDependencyClassification.some(
      (entry) =>
        entry.relation === relation &&
        entry.classification === 'required_baseline_relation' &&
        entry.createsRelation === false &&
        entry.seedsRows === false,
    ),
    `Spec must classify ${relation} as required baseline relation.`,
  )
}

for (const relation of optionalRelations) {
  requireText(draftMigration, `to_regclass('${relation}')`, 'draftMigration')
  check(
    SUPABASE_SOUND_DRAFT_MIGRATION_BASELINE_GUARD_FIX.baselineDependencyClassification.some(
      (entry) =>
        entry.relation === relation &&
        entry.classification === 'optional_live_metadata_relation' &&
        entry.createsRelation === false &&
        entry.seedsRows === false,
    ),
    `Spec must classify ${relation} as optional live metadata relation.`,
  )
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

const retryResult = SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RETRY_RESULT
check(
  retryResult.validation.draftMigrationErrorSummary ===
    'relation "public.approved_plan_snapshots" does not exist',
  'Retry result must preserve the baseline-missing failure.',
)
check(retryResult.cleanup.cleanupVerified === true, 'Retry cleanup must be verified.')
check(retryResult.claimsGeneratedLocalFixturePassed === false, 'Retry result must not claim fixture pass.')

const fix = SUPABASE_SOUND_DRAFT_MIGRATION_BASELINE_GUARD_FIX
check(fix.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Fix workstream must be Supabase.')
check(fix.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Fix requester must be SOUND.')
check(fix.mode === 'draft_migration_baseline_guard_fix_only', 'Fix mode must be draft-only.')
check(fix.claimsGeneratedLocalFixturePassed === false, 'Fix must not claim generated_local_fixture_passed.')
check(fix.retryFailure.missingRelation === 'public.approved_plan_snapshots', 'Missing relation must match.')
check(fix.retryFailure.draftTestsExecuted === false, 'Draft tests must remain unexecuted in retry.')
check(fix.retryFailure.cleanupVerified === true, 'Cleanup must be represented.')
check(fix.retryFailure.supabaseCloudTouched === false, 'Supabase cloud must not be touched.')
check(fix.fix.errorCode === errorCode, 'Fix error code must match.')
check(fix.fix.migrationDraftGuarded === true, 'Migration draft must be guarded.')
check(fix.fix.draftTestsGuarded === true, 'Draft tests must be guarded.')
check(fix.fix.usesToRegclass === true, 'Fix must use to_regclass.')
check(fix.fix.recreatesBaselineSchema === false, 'Fix must not recreate baseline schema.')
check(fix.fix.createsActiveMigration === false, 'Fix must not create active migration.')
check(fix.fix.featureGatesOptionalCommentOnly === true, 'Feature gates must be optional comment-only.')
check(fix.fix.toolCapabilitiesOptionalCommentOnly === true, 'Tool capabilities must be optional comment-only.')
check(fix.sourceOfTruthPath.requiresSupabaseRow === true, 'Source of truth must require Supabase row.')
check(
  fix.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source of truth must require private GCS path.',
)
check(fix.sourceOfTruthPath.requiresManifest === true, 'Source of truth must require manifest.')
check(fix.sourceOfTruthPath.requiresChecksum === true, 'Source of truth must require checksum.')
check(
  fix.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source of truth must require approved snapshot.',
)
check(fix.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source.')
check(fix.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')
check(
  fix.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must remain blocked.',
)
check(
  fix.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

for (const [key, value] of Object.entries(fix.execution)) {
  check(value === false, `Execution flag ${key} must be false.`)
}

assertNoMutationStatements(draftMigration, 'draftMigration')
assertNoMutationStatements(draftTests, 'draftTests')
assertNoConcreteForbiddenText(fixDoc, 'fixDoc')
assertNoConcreteForbiddenText(retryReport, 'retryReport')
assertNoConcreteForbiddenText(draftMigration, 'draftMigration')
assertNoConcreteForbiddenText(draftTests, 'draftTests')
scanForbiddenValues(fix, 'SUPABASE_SOUND_DRAFT_MIGRATION_BASELINE_GUARD_FIX')

console.log(JSON.stringify({
  ok: true,
  workstream: fix.workstream,
  requestingWorkstream: fix.requestingWorkstream,
  smoke: 'supabase-sound-draft-migration-baseline-guard-fix',
  mode: fix.mode,
  errorCode: fix.fix.errorCode,
  requiredBaselineRelationCount: requiredRelations.length,
  optionalLiveMetadataRelationCount: optionalRelations.length,
  sqlExecuted: fix.execution.sqlExecuted,
  migrationDeployed: fix.execution.migrationDeployed,
  supabaseMutationPerformed: fix.execution.supabaseMutationPerformed,
  claimsGeneratedLocalFixturePassed: fix.claimsGeneratedLocalFixturePassed,
  recommendedImmediateNextPrompt: fix.recommendedImmediateNextPrompt,
}))
