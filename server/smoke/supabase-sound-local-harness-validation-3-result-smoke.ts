import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_3_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-harness-validation-3-result'

const reportPath = 'docs/supabase-sound-local-harness-validation-3-report.md'
const specPath = 'src/backend/mock/mock-supabase-sound-local-harness-validation-3-result.ts'
const activeDraftMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-harness-validation-3-result'
const scriptCommand =
  'tsx server/smoke/supabase-sound-local-harness-validation-3-result-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-HARNESS-PORTS-FIX: resolve local Supabase port/stack conflict, no SQL'

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

function assertNoForbiddenText(source: string, label: string): void {
  const lower = source.toLowerCase()
  check(!/https?:\/\/[^\s"',\]]+/i.test(source), `${label} must not contain concrete URLs.`)
  check(!lower.includes('x-goog-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('x-amz-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('signature='), `${label} must not contain signed URL query values.`)
  check(!lower.includes('token='), `${label} must not contain tokenized URL values.`)
  check(!lower.includes('storage.googleapis.com'), `${label} must not contain storage public URLs.`)
  check(!lower.includes('gs://'), `${label} must not contain storage URI values.`)
  check(!lower.includes('gcs://'), `${label} must not contain storage URI values.`)
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
  check(
    !/eyj[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}/i.test(source),
    `${label} must not contain JWT-like values.`,
  )
}

function scanForbiddenValues(value: unknown, label: string): void {
  if (typeof value === 'string') {
    assertNoForbiddenText(value, label)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbiddenValues(item, `${label}[${index}]`))
    return
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      assertNoForbiddenText(key, `${label}.${key}`)
      scanForbiddenValues(nestedValue, `${label}.${key}`)
    }
  }
}

check(existsSync(reportPath), 'Harness validation 3 report must exist.')
check(existsSync(specPath), 'Harness validation 3 result spec must exist.')
check(!existsSync(activeDraftMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const report = readFileSync(reportPath, 'utf8')
const spec = readFileSync(specPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const result = SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_3_RESULT

for (const required of [
  '# SUPABASE-SOUND-4-RETRY-HARNESS-3 Local Supabase Harness Validation Report',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE',
  'Requesting workstream: SOUND_MUSIC_AUDIO',
  'This document reports approved local Supabase harness validation only.',
  'No deployment occurred.',
  'No Supabase cloud target was used.',
  'No production or staging target was used.',
  'No live customer data was used.',
  'No generated_local_fixture_passed claim is made.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n-> structured agent findings\n-> edit intents\n-> approved plan snapshot\n-> worker execution',
  'selected harness path: blocked.',
  'existing Docker stack detected: yes.',
  'existing Docker stack name: `reeditpro-local`.',
  'Supabase cloud avoided: yes.',
  'supabase/migrations untouched: yes.',
  'draft SQL/test files unchanged: yes.',
  'secrets redacted: yes.',
  'port conflict detected: yes.',
  'auth.users exists: not attempted.',
  'storage.buckets exists: not attempted.',
  'storage.objects exists: not attempted.',
  'public.approved_plan_snapshots exists: not attempted.',
  'draftMigrationPassed: blocked.',
  'draftTestsPassed: blocked.',
  'generatedLocalFixturePassedClaimed: false.',
  recommendedImmediateNextPrompt,
]) {
  requireText(report, required, 'report')
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(result.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(result.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(result.mode === 'local_supabase_harness_validation_3_result', 'Mode must match.')
check(result.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  result.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(result.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')
check(result.decision.localHarnessValidationAttempted === false, 'Harness validation must not run.')
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
check(result.harness.supabaseCliUsed === true, 'Supabase CLI must be preflight-only.')
check(result.harness.dockerUsed === true, 'Docker must be inspection-only.')
check(result.harness.existingDockerStackDetected === true, 'Existing Docker stack must be detected.')
check(result.harness.existingDockerStackName === 'reeditpro-local', 'Existing stack name must match.')
check(result.harness.portConflictDetected === true, 'Port conflict must be detected.')
check(result.harness.harnessStartedByThisPrompt === false, 'Harness must not be started.')
check(result.harness.harnessStoppedByThisPrompt === false, 'Harness must not be stopped.')
check(result.harness.cleanupVerified === 'not_applicable', 'Cleanup must be not applicable.')

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

for (const owner of requiredOwners) {
  requireText(report, owner, 'report')
  check(
    result.ownerEvidence.some(
      (entry) => entry.owner === owner && entry.conditionalNoExecutionAcceptance === true,
    ),
    `Owner evidence must include ${owner}.`,
  )
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
check(result.rawPromptRule.requiresStructuredAgentFindings === true, 'Structured findings required.')
check(result.rawPromptRule.requiresEditIntents === true, 'Edit intents required.')
check(result.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Approved snapshot required.')

assertNoForbiddenText(report, 'report')
assertNoForbiddenText(spec, 'spec')
scanForbiddenValues(result, 'SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_3_RESULT')

console.log(
  JSON.stringify(
    {
      ok: true,
      workstream: result.workstream,
      requestingWorkstream: result.requestingWorkstream,
      smoke: 'supabase-sound-local-harness-validation-3-result',
      mode: result.mode,
      localHarnessValidationAttempted: result.decision.localHarnessValidationAttempted,
      localHarnessValidationPassed: result.decision.localHarnessValidationPassed,
      platformPrerequisitesSatisfied: result.decision.platformPrerequisitesSatisfied,
      appBaselineSatisfied: result.decision.appBaselineSatisfied,
      draftMigrationPassed: result.decision.draftMigrationPassed,
      claimsGeneratedLocalFixturePassed: result.claimsGeneratedLocalFixturePassed,
      supabaseCloudTouched: result.safety.supabaseCloudTouched,
      recommendedImmediateNextPrompt: result.decision.recommendedImmediateNextPrompt,
    },
    null,
    2,
  ),
)
