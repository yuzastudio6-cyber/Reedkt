import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL } from '../../src/backend/mock/mock-supabase-sound-local-baseline-harness-approval'
import { SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN } from '../../src/backend/mock/mock-supabase-sound-local-baseline-schema-harness-plan'
import { SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-harness-validation-result'

const reportPath = 'docs/supabase-sound-local-harness-validation-report.md'
const approvalDocPath = 'docs/supabase-sound-local-baseline-harness-approval.md'
const harnessPlanPath = 'docs/supabase-sound-local-baseline-schema-harness-plan.md'
const baselineReportPath = 'docs/supabase-sound-local-baseline-validation-report.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-harness-validation-result'
const scriptCommand =
  'tsx server/smoke/supabase-sound-local-harness-validation-result-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-HARNESS-FIX: fix local Supabase harness setup for SOUND draft validation, no SQL'

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

function requireText(source: string, text: string, label: string): void {
  check(source.includes(text), `${label} must include ${text}.`)
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
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('database_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('db_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('password='), `${label} must not contain database password values.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('raw_provider_prompt'), `${label} must not contain raw provider prompt fields.`)
  check(!lower.includes('raw_prompt_payload'), `${label} must not contain raw prompt payload fields.`)
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

check(existsSync(reportPath), 'Local harness validation report must exist.')
check(existsSync(approvalDocPath), 'Baseline harness approval doc must exist.')
check(existsSync(harnessPlanPath), 'Baseline schema harness plan doc must exist.')
check(existsSync(baselineReportPath), 'Prior baseline validation report must exist.')
check(!existsSync(activeMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const report = readFileSync(reportPath, 'utf8')
const approvalDoc = readFileSync(approvalDocPath, 'utf8')
const harnessPlanDoc = readFileSync(harnessPlanPath, 'utf8')
const baselineReport = readFileSync(baselineReportPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const result = SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT

for (const required of [
  '# SUPABASE-SOUND-4-RETRY-HARNESS Local Supabase Harness Validation Report',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'This document reports local Supabase-compatible harness validation only.',
  'No deployment occurred.',
  'No Supabase cloud target was used.',
  'No production or staging target was used.',
  'No live customer data was used.',
  'No generated_local_fixture_passed claim is made.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'selected harness path: blocked.',
  '`supabase/config.toml` present: no.',
  'approved repo-local baseline harness found: no.',
  'Supabase CLI command availability: command path found, but version check failed with incompatible executable on this host.',
  'Harness execution did not occur because `supabase/config.toml` is absent',
  '`auth.users` exists: not attempted.',
  '`storage.buckets` exists: not attempted.',
  '`storage.objects` exists: not attempted.',
  '`public.approved_plan_snapshots` exists: not attempted.',
  'draftMigrationPassed: blocked.',
  'draftTestsPassed: blocked.',
  'generatedLocalFixturePassedClaimed: false.',
  recommendedImmediateNextPrompt,
]) {
  requireText(report, required, 'report')
}

for (const owner of requiredOwners) {
  requireText(report, owner, 'report')
  check(
    result.ownerEvidence.some(
      (entry) =>
        entry.owner === owner &&
        entry.conditionalNoExecutionAcceptance === true &&
        entry.executionAllowedNow === false,
    ),
    `Owner evidence must include ${owner}.`,
  )
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(result.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(result.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(result.mode === 'local_supabase_harness_validation_result', 'Mode must match.')
check(result.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  result.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(result.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')
check(result.decision.localHarnessValidationAttempted === false, 'Harness validation must be blocked.')
check(result.decision.localHarnessValidationPassed === false, 'Harness validation must not pass.')
check(
  result.decision.platformPrerequisitesSatisfied === 'blocked',
  'Platform prerequisites must be blocked.',
)
check(result.decision.appBaselineSatisfied === 'blocked', 'App baseline must be blocked.')
check(result.decision.draftMigrationPassed === 'blocked', 'Draft migration must be blocked.')
check(result.decision.draftTestsPassed === 'blocked', 'Draft tests must be blocked.')
check(
  result.decision.generatedLocalFixturePassedClaimed === false,
  'Generated local fixture pass must not be claimed.',
)
check(
  result.decision.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

check(result.harness.selectedHarnessPath === 'blocked', 'Selected harness path must be blocked.')
check(result.harness.supabaseCliUsed === false, 'Supabase CLI must not be used for harness execution.')
check(result.harness.dockerUsed === false, 'Docker must not be used.')
check(result.harness.harnessStartedByThisPrompt === false, 'Harness must not be started.')
check(result.harness.harnessStoppedByThisPrompt === false, 'Harness must not be stopped.')
check(result.harness.cleanupVerified === false, 'Cleanup must be false because nothing was started.')

check(result.commandAvailability.supabaseCommandFound === true, 'Supabase command should be found.')
check(
  result.commandAvailability.supabaseVersionCheckPassed === false,
  'Supabase version check must be blocked.',
)
check(result.commandAvailability.dockerCommandFound === true, 'Docker command should be found.')
check(result.commandAvailability.psqlCommandFound === true, 'psql command should be found.')
check(result.commandAvailability.pgIsreadyCommandFound === true, 'pg_isready command should be found.')
check(
  result.commandAvailability.supabaseConfigTomlPresent === false,
  'supabase/config.toml must be absent.',
)
check(
  result.commandAvailability.approvedRepoLocalHarnessFound === false,
  'Approved repo-local harness must be absent.',
)

check(result.platformPrerequisites.authUsersExists === 'not_attempted', 'auth.users must be not attempted.')
check(
  result.platformPrerequisites.storageBucketsExists === 'not_attempted',
  'storage.buckets must be not attempted.',
)
check(
  result.platformPrerequisites.storageObjectsExists === 'not_attempted',
  'storage.objects must be not attempted.',
)
check(
  result.platformPrerequisites.approvedPlanSnapshotsExists === 'not_attempted',
  'approved_plan_snapshots must be not attempted.',
)

check(result.safety.localOnly === true, 'Safety must be local-only.')
check(result.safety.noDeploy === true, 'Safety must be no deploy.')
check(result.safety.noProduction === true, 'Safety must be no production.')
check(result.safety.noStaging === true, 'Safety must be no staging.')
check(result.safety.noLiveCustomerData === true, 'Safety must be no live customer data.')
check(result.safety.supabaseCloudTouched === false, 'Supabase cloud must not be touched.')
check(result.safety.supabaseMigrationsChanged === false, 'Supabase migrations must not change.')
check(result.safety.draftSqlFilesChanged === false, 'Draft SQL files must not change.')
check(result.safety.secretsExposed === false, 'Secrets must not be exposed.')

for (const [key, value] of Object.entries(result.execution)) {
  check(value === false, `Execution flag ${key} must be false.`)
}

check(result.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(
  result.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source path must require private GCS path.',
)
check(result.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(result.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(
  result.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source path must require approved snapshot.',
)
check(
  result.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(result.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')
check(
  result.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt execution must be blocked.',
)
check(
  result.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(result.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(
  result.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshot must be required.',
)

check(
  SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL.decision.futureLocalHarnessExecutionApproved === true,
  'Baseline harness approval must still approve a future harness prompt.',
)
check(
  SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN.recommendedHarnessPath
    .plainPostgresOnlyAllowed === false,
  'Plain Postgres only must remain blocked.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_PROPOSAL === true,
  'Final owner rollup proposal must remain true.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW === false,
  'Final owner rollup execution must remain false.',
)

requireText(approvalDoc, '# SUPABASE-SOUND-4-BASELINE-APPROVAL Local Baseline Harness Approval', 'approvalDoc')
requireText(harnessPlanDoc, '# SUPABASE-SOUND-4-BASELINE-PLAN Local Baseline Schema Harness Plan', 'harnessPlanDoc')
requireText(baselineReport, '`auth.users`: missing.', 'baselineReport')

assertNoConcreteForbiddenText(report, 'report')
assertNoConcreteForbiddenText(approvalDoc, 'approvalDoc')
assertNoConcreteForbiddenText(harnessPlanDoc, 'harnessPlanDoc')
assertNoConcreteForbiddenText(baselineReport, 'baselineReport')
scanForbiddenValues(result, 'SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT')

console.log(JSON.stringify({
  ok: true,
  workstream: result.workstream,
  requestingWorkstream: result.requestingWorkstream,
  smoke: 'supabase-sound-local-harness-validation-result',
  mode: result.mode,
  localHarnessValidationAttempted: result.decision.localHarnessValidationAttempted,
  localHarnessValidationPassed: result.decision.localHarnessValidationPassed,
  platformPrerequisitesSatisfied: result.decision.platformPrerequisitesSatisfied,
  appBaselineSatisfied: result.decision.appBaselineSatisfied,
  draftMigrationPassed: result.decision.draftMigrationPassed,
  claimsGeneratedLocalFixturePassed: result.claimsGeneratedLocalFixturePassed,
  supabaseCloudTouched: result.safety.supabaseCloudTouched,
  recommendedImmediateNextPrompt: result.decision.recommendedImmediateNextPrompt,
}))
