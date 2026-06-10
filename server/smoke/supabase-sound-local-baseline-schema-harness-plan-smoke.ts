import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-baseline-validation-result'
import { SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN } from '../../src/backend/mock/mock-supabase-sound-local-baseline-schema-harness-plan'

const planDocPath = 'docs/supabase-sound-local-baseline-schema-harness-plan.md'
const priorReportPath = 'docs/supabase-sound-local-baseline-validation-report.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-baseline-schema-harness-plan'
const scriptCommand =
  'tsx server/smoke/supabase-sound-local-baseline-schema-harness-plan-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-BASELINE-APPROVAL: approve local Supabase baseline harness execution, no SQL'

const requiredPlatformRelations = ['auth.users', 'storage.buckets', 'storage.objects'] as const

const requiredDependencies = [
  ...requiredPlatformRelations,
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
  'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql',
  'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql',
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
  check(!lower.includes('service-role key value'), `${label} must not contain service-role values.`)
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

check(existsSync(planDocPath), 'Baseline schema harness plan doc must exist.')
check(existsSync(priorReportPath), 'Prior local baseline validation report must exist.')
check(!existsSync(activeMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const planDoc = readFileSync(planDocPath, 'utf8')
const priorReport = readFileSync(priorReportPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const plan = SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN
const priorResult = SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT

for (const required of [
  '# SUPABASE-SOUND-4-BASELINE-PLAN Local Baseline Schema Harness Plan',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'This document is plan/spec only.',
  'SQL executed by this prompt: no.',
  'Supabase CLI executed by this prompt: no.',
  'Docker or local service startup executed by this prompt: no.',
  'generated_local_fixture_passed claimed: no.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'SUPABASE-SOUND-4-RETRY-BASELINE',
  '`auth.users`',
  '`storage.buckets`',
  '`storage.objects`',
  'Option A: Approved Local Supabase Platform Stack',
  'Option B: Approved Repo-Local Baseline Harness',
  'Option C: Minimal Platform Prerequisite Stub Harness',
  'Option D: Plain Local PostgreSQL Only',
  'Use an approved local Supabase-platform baseline harness.',
  'Plain PostgreSQL alone remains blocked.',
  'Manual platform stubs are not the default',
  recommendedImmediateNextPrompt,
]) {
  requireText(planDoc, required, 'planDoc')
}

for (const dependency of requiredDependencies) {
  requireText(planDoc, dependency, 'planDoc')
  check(
    plan.dependencyClassification.some((entry) => entry.relationOrFile === dependency),
    `Spec must include dependency ${dependency}.`,
  )
}

for (const relation of requiredPlatformRelations) {
  check(
    plan.blocker.missingPlatformRelations.includes(relation),
    `Spec must include missing platform relation ${relation}.`,
  )
  check(
    plan.dependencyClassification.some(
      (entry) =>
        entry.relationOrFile === relation &&
        entry.classification === 'supabase_platform_provided' &&
        entry.requiredBeforeDraft === true &&
        entry.currentPlainPostgresStatus === 'missing' &&
        entry.createsRelation === false &&
        entry.seedsRows === false,
    ),
    `Spec must classify ${relation} as missing Supabase platform dependency.`,
  )
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(plan.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Plan workstream must be Supabase.')
check(plan.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Plan requester must be SOUND.')
check(plan.mode === 'local_baseline_schema_harness_plan_only', 'Mode must be harness plan only.')
check(plan.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  plan.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(plan.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')
check(plan.blocker.previousPrompt === 'SUPABASE-SOUND-4-RETRY-BASELINE', 'Previous prompt must match.')
check(
  plan.blocker.blockerType === 'missing_supabase_platform_prerequisites',
  'Blocker type must match.',
)
check(plan.blocker.plainPostgresOnlyInsufficient === true, 'Plain Postgres must be insufficient.')
check(plan.blocker.baselineMigrationsAttempted === 0, 'No baseline migrations may be attempted.')
check(plan.blocker.draftMigrationAttempted === false, 'Draft migration must remain unattempted.')
check(plan.blocker.draftTestsAttempted === false, 'Draft tests must remain unattempted.')
check(plan.blocker.cleanupVerified === true, 'Cleanup must remain verified.')

for (const [key, value] of Object.entries(plan.harnessPlan)) {
  if (key === 'planOnly') {
    check(value === true, 'Harness plan must be plan-only.')
  } else {
    check(value === false, `Harness plan flag ${key} must be false.`)
  }
}

const optionIds = plan.harnessOptions.map((option) => option.optionId)
for (const optionId of [
  'option_a_local_supabase_platform_stack',
  'option_b_repo_local_baseline_harness',
  'option_c_minimal_platform_stub_harness',
  'option_d_plain_postgres_only',
] as const) {
  check(optionIds.includes(optionId), `Harness options must include ${optionId}.`)
}
for (const option of plan.harnessOptions) {
  check(option.allowedNow === false, `Harness option ${option.optionId} must not be allowed now.`)
}

check(
  plan.recommendedHarnessPath.preferredPath === 'approved_local_supabase_platform_baseline_harness',
  'Preferred harness path must be approved local Supabase platform baseline harness.',
)
check(
  plan.recommendedHarnessPath.optionAAfterExplicitApproval === true,
  'Option A must require explicit approval.',
)
check(
  plan.recommendedHarnessPath.optionBIfApprovedRepoHarnessAppears === true,
  'Option B must be allowed only if an approved repo harness appears.',
)
check(
  plan.recommendedHarnessPath.manualPlatformStubsRecommended === false,
  'Manual platform stubs must not be recommended.',
)
check(
  plan.recommendedHarnessPath.plainPostgresOnlyAllowed === false,
  'Plain Postgres only must not be allowed.',
)
check(plan.futureSafetyPreflight.length >= 6, 'Future preflight requirements must be present.')
check(plan.forbiddenHarnessPaths.length >= 7, 'Forbidden harness paths must be present.')
check(plan.evidenceRequiredBeforeRetry.length >= 6, 'Evidence requirements must be present.')

check(plan.sourceOfTruthPath.requiresSupabaseRow === true, 'Source of truth must require Supabase row.')
check(
  plan.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source of truth must require private GCS path.',
)
check(plan.sourceOfTruthPath.requiresManifest === true, 'Source of truth must require manifest.')
check(plan.sourceOfTruthPath.requiresChecksum === true, 'Source of truth must require checksum.')
check(
  plan.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source of truth must require approved snapshot.',
)
check(
  plan.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(plan.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')
check(
  plan.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must remain blocked.',
)
check(
  plan.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(plan.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(
  plan.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshot must be required.',
)

for (const [key, value] of Object.entries(plan.execution)) {
  check(value === false, `Execution flag ${key} must be false.`)
}

check(
  priorResult.decision.recommendedImmediateNextPrompt ===
    'SUPABASE-SOUND-4-BASELINE-PLAN: define approved local baseline schema harness, no SQL',
  'Prior result must point to this harness plan.',
)
check(priorResult.decision.localBaselineValidationAttempted === false, 'Prior baseline must be blocked.')
check(priorResult.decision.baselineSchemaLoaded === 'blocked', 'Prior baseline schema load must be blocked.')
for (const relation of requiredPlatformRelations) {
  check(
    priorResult.baseline.missingPlatformPrerequisites.includes(relation),
    `Prior result must include missing platform relation ${relation}.`,
  )
}
requireText(priorReport, '`auth.users`: missing.', 'priorReport')
requireText(priorReport, '`storage.buckets`: missing.', 'priorReport')
requireText(priorReport, '`storage.objects`: missing.', 'priorReport')

check(
  plan.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

assertNoConcreteForbiddenText(planDoc, 'planDoc')
assertNoConcreteForbiddenText(priorReport, 'priorReport')
scanForbiddenValues(plan, 'SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN')

console.log(JSON.stringify({
  ok: true,
  workstream: plan.workstream,
  requestingWorkstream: plan.requestingWorkstream,
  smoke: 'supabase-sound-local-baseline-schema-harness-plan',
  mode: plan.mode,
  missingPlatformRelationCount: plan.blocker.missingPlatformRelations.length,
  dependencyCount: plan.dependencyClassification.length,
  harnessOptionCount: plan.harnessOptions.length,
  sqlExecuted: plan.execution.sqlExecuted,
  psqlExecuted: plan.execution.psqlExecuted,
  supabaseCliExecuted: plan.execution.supabaseCliExecuted,
  dockerUsed: plan.execution.dockerUsed,
  serviceStarted: plan.execution.serviceStarted,
  migrationDeployed: plan.execution.migrationDeployed,
  supabaseMutationPerformed: plan.execution.supabaseMutationPerformed,
  claimsGeneratedLocalFixturePassed: plan.claimsGeneratedLocalFixturePassed,
  recommendedImmediateNextPrompt: plan.recommendedImmediateNextPrompt,
}))
