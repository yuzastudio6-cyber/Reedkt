import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL } from '../../src/backend/mock/mock-supabase-sound-local-baseline-harness-approval'
import { SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-baseline-validation-result'
import { SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN } from '../../src/backend/mock/mock-supabase-sound-local-baseline-schema-harness-plan'

const approvalDocPath = 'docs/supabase-sound-local-baseline-harness-approval.md'
const harnessPlanPath = 'docs/supabase-sound-local-baseline-schema-harness-plan.md'
const baselineValidationReportPath = 'docs/supabase-sound-local-baseline-validation-report.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-baseline-harness-approval'
const scriptCommand =
  'tsx server/smoke/supabase-sound-local-baseline-harness-approval-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-RETRY-HARNESS: run draft validation with approved local Supabase baseline harness, no deploy'

const requiredPlatformRelations = ['auth.users', 'storage.buckets', 'storage.objects'] as const

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

check(existsSync(approvalDocPath), 'Baseline harness approval doc must exist.')
check(existsSync(harnessPlanPath), 'Prior baseline schema harness plan must exist.')
check(existsSync(baselineValidationReportPath), 'Prior baseline validation report must exist.')
check(!existsSync(activeMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const approvalDoc = readFileSync(approvalDocPath, 'utf8')
const harnessPlanDoc = readFileSync(harnessPlanPath, 'utf8')
const baselineValidationReport = readFileSync(baselineValidationReportPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const approval = SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL
const harnessPlan = SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN
const baselineResult = SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT

for (const required of [
  '# SUPABASE-SOUND-4-BASELINE-APPROVAL Local Baseline Harness Approval',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'This document is approval-only.',
  'This document does not execute SQL.',
  'This document does not run Supabase CLI commands.',
  'This document does not use Docker.',
  'This document does not create databases.',
  'This document does not start services.',
  'This document does not deploy migrations.',
  'This document does not touch Supabase cloud.',
  'This document does not unlock generated_local_fixture_passed.',
  'Plain local PostgreSQL was insufficient.',
  'Missing Supabase platform prerequisites were `auth.users`, `storage.buckets`, and `storage.objects`.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'approvalDecision: conditional_approval_for_future_local_supabase_baseline_harness_execution.',
  'futureLocalHarnessExecutionApproved: true.',
  'futureDockerOrSupabaseCliAllowedOnlyInNextPrompt: true.',
  'generatedLocalFixturePassedClaimed: false.',
  'Option A future local Supabase stack execution is approved only after the next prompt repeats all safety gates.',
  'Option B remains available only if an approved repo-local harness appears later.',
  'Plain PostgreSQL alone remains blocked',
  'Manual platform stubs are not the default and are not approved here.',
  'No command is run now.',
  'local Supabase-compatible platform harness startup',
  'fixed SOUND draft migration validation inside the local harness only',
  'fixed SOUND draft test validation inside the local harness only',
  'Supabase cloud.',
  'production.',
  'generated_local_fixture_passed claim.',
  'SQL executed now: false.',
  'Supabase CLI executed now: false.',
  'Docker used now: false.',
  'generated_local_fixture_passed Status',
  recommendedImmediateNextPrompt,
]) {
  requireText(approvalDoc, required, 'approvalDoc')
}

for (const relation of requiredPlatformRelations) {
  requireText(approvalDoc, relation, 'approvalDoc')
  check(
    approval.blockerAddressed.missingPlatformRelations.includes(relation),
    `Approval spec must include missing platform relation ${relation}.`,
  )
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(approval.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Approval workstream must be Supabase.')
check(approval.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Approval requester must be SOUND.')
check(approval.mode === 'local_baseline_harness_approval_only', 'Mode must be approval-only.')
check(approval.currentUnlockStage === 'dry_run_passed', 'Current stage must remain dry_run_passed.')
check(
  approval.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target future stage must be generated_local_fixture_passed.',
)
check(approval.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')
check(
  approval.decision.approvalDecision ===
    'conditional_approval_for_future_local_supabase_baseline_harness_execution',
  'Approval decision must be conditional harness approval.',
)
check(
  typeof approval.decision.futureLocalHarnessExecutionApproved === 'boolean',
  'Future harness approval must be boolean.',
)
check(
  approval.decision.futureLocalHarnessExecutionApproved === true,
  'Future local harness execution should be conditionally approved.',
)
check(
  approval.decision.futureDockerOrSupabaseCliAllowedOnlyInNextPrompt === true,
  'Docker/Supabase CLI allowance must be future-prompt-only.',
)
check(
  approval.decision.generatedLocalFixturePassedClaimed === false,
  'Decision must not claim generated_local_fixture_passed.',
)
check(
  approval.decision.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

check(
  approval.blockerAddressed.previousBlockerType === 'missing_supabase_platform_prerequisites',
  'Previous blocker type must match.',
)
check(
  approval.blockerAddressed.plainPostgresOnlyInsufficient === true,
  'Plain Postgres only must be insufficient.',
)
check(
  approval.approvedFutureHarnessPath.requiresSupabasePlatformSchemas === true,
  'Harness must require Supabase platform schemas.',
)
check(approval.approvedFutureHarnessPath.requiresAuthUsers === true, 'Harness must require auth.users.')
check(
  approval.approvedFutureHarnessPath.requiresStorageBuckets === true,
  'Harness must require storage.buckets.',
)
check(
  approval.approvedFutureHarnessPath.requiresStorageObjects === true,
  'Harness must require storage.objects.',
)
check(
  approval.approvedFutureHarnessPath.optionAApprovedForFuturePrompt === true,
  'Option A must be approved only for a future prompt.',
)
check(
  approval.approvedFutureHarnessPath.optionBAllowedOnlyIfApprovedRepoHarnessAppears === true,
  'Option B must be allowed only if an approved repo harness appears.',
)
check(
  approval.approvedFutureHarnessPath.plainPostgresOnlyAllowed === false,
  'Plain Postgres only must be blocked.',
)
check(
  approval.approvedFutureHarnessPath.manualPlatformStubsApproved === false,
  'Manual platform stubs must not be approved.',
)
check(
  approval.approvedFutureHarnessPath.supabaseCloudAllowed === false,
  'Supabase cloud must not be allowed.',
)
check(approval.approvedFutureHarnessPath.productionAllowed === false, 'Production must be blocked.')
check(approval.approvedFutureHarnessPath.stagingAllowed === false, 'Staging must be blocked.')
check(
  approval.approvedFutureHarnessPath.liveCustomerDataAllowed === false,
  'Live customer data must be blocked.',
)

check(
  approval.conditionsForFutureExecution.length >= 12,
  'Future execution conditions must be present.',
)
check(
  approval.approvedFutureCommandCategories.length >= 5,
  'Approved future command categories must be present.',
)
check(approval.forbiddenPaths.length >= 12, 'Forbidden paths must be present.')
check(approval.futureEvidenceRequired.length >= 12, 'Future evidence requirements must be present.')

for (const [key, value] of Object.entries(approval.execution)) {
  check(value === false, `Execution flag ${key} must be false.`)
}

check(
  approval.sourceOfTruthPath.requiresSupabaseRow === true,
  'Source-of-truth path must require Supabase row.',
)
check(
  approval.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source-of-truth path must require private GCS path.',
)
check(approval.sourceOfTruthPath.requiresManifest === true, 'Source-of-truth path must require manifest.')
check(approval.sourceOfTruthPath.requiresChecksum === true, 'Source-of-truth path must require checksum.')
check(
  approval.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved snapshot.',
)
check(
  approval.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(approval.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')
check(
  approval.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must remain blocked.',
)
check(
  approval.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(approval.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(
  approval.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshot must be required.',
)

check(
  harnessPlan.recommendedImmediateNextPrompt ===
    'SUPABASE-SOUND-4-BASELINE-APPROVAL: approve local Supabase baseline harness execution, no SQL',
  'Prior harness plan must point to this approval prompt.',
)
check(
  harnessPlan.blocker.plainPostgresOnlyInsufficient === true,
  'Prior harness plan must keep plain Postgres blocked.',
)
check(
  harnessPlan.recommendedHarnessPath.optionAAfterExplicitApproval === true,
  'Prior harness plan must require Option A explicit approval.',
)
check(
  harnessPlan.recommendedHarnessPath.optionBIfApprovedRepoHarnessAppears === true,
  'Prior harness plan must allow Option B only if repo harness appears.',
)
check(
  harnessPlan.recommendedHarnessPath.manualPlatformStubsRecommended === false,
  'Prior harness plan must not recommend manual stubs.',
)
check(
  baselineResult.decision.baselineSchemaLoaded === 'blocked',
  'Prior baseline validation must remain blocked.',
)
check(
  baselineResult.decision.generatedLocalFixturePassedClaimed === false,
  'Prior baseline validation must not claim fixture pass.',
)

requireText(harnessPlanDoc, '# SUPABASE-SOUND-4-BASELINE-PLAN Local Baseline Schema Harness Plan', 'harnessPlanDoc')
requireText(harnessPlanDoc, 'Plain PostgreSQL alone remains blocked.', 'harnessPlanDoc')
requireText(baselineValidationReport, '`auth.users`: missing.', 'baselineValidationReport')
requireText(baselineValidationReport, '`storage.buckets`: missing.', 'baselineValidationReport')
requireText(baselineValidationReport, '`storage.objects`: missing.', 'baselineValidationReport')

assertNoConcreteForbiddenText(approvalDoc, 'approvalDoc')
assertNoConcreteForbiddenText(harnessPlanDoc, 'harnessPlanDoc')
assertNoConcreteForbiddenText(baselineValidationReport, 'baselineValidationReport')
scanForbiddenValues(approval, 'SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL')

console.log(JSON.stringify({
  ok: true,
  workstream: approval.workstream,
  requestingWorkstream: approval.requestingWorkstream,
  smoke: 'supabase-sound-local-baseline-harness-approval',
  mode: approval.mode,
  approvalDecision: approval.decision.approvalDecision,
  futureLocalHarnessExecutionApproved:
    approval.decision.futureLocalHarnessExecutionApproved,
  sqlExecuted: approval.execution.sqlExecuted,
  supabaseCliExecuted: approval.execution.supabaseCliExecuted,
  dockerUsed: approval.execution.dockerUsed,
  claimsGeneratedLocalFixturePassed: approval.claimsGeneratedLocalFixturePassed,
  recommendedImmediateNextPrompt: approval.decision.recommendedImmediateNextPrompt,
}))
