import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL } from '../../src/backend/mock/mock-supabase-sound-local-baseline-harness-approval'
import { SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN } from '../../src/backend/mock/mock-supabase-sound-local-baseline-schema-harness-plan'
import { SUPABASE_SOUND_LOCAL_HARNESS_SETUP_FIX } from '../../src/backend/mock/mock-supabase-sound-local-harness-setup-fix'
import { SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-harness-validation-result'

const setupDocPath = 'docs/supabase-sound-local-harness-setup-fix.md'
const validationReportPath = 'docs/supabase-sound-local-harness-validation-report.md'
const approvalDocPath = 'docs/supabase-sound-local-baseline-harness-approval.md'
const harnessPlanPath = 'docs/supabase-sound-local-baseline-schema-harness-plan.md'
const finalRollupPath = 'docs/supabase-sound-final-owner-evidence-rollup.md'
const optionalConfigPath = 'supabase/config.toml'
const activeDraftMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-harness-setup-fix'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-harness-setup-fix-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-HARNESS-SETUP-USER: install compatible local Supabase CLI, no repo changes'

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
  check(!lower.includes('supabase.co'), `${label} must not contain Supabase cloud URLs.`)
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
  check(!/eyj[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}/i.test(source), `${label} must not contain JWT-like values.`)
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

check(existsSync(setupDocPath), 'Harness setup fix doc must exist.')
check(existsSync(validationReportPath), 'Prior harness validation report must exist.')
check(existsSync(approvalDocPath), 'Baseline harness approval doc must exist.')
check(existsSync(harnessPlanPath), 'Baseline schema harness plan must exist.')
check(existsSync(finalRollupPath), 'Final owner evidence rollup must exist.')
check(!existsSync(activeDraftMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const setupDoc = readFileSync(setupDocPath, 'utf8')
const validationReport = readFileSync(validationReportPath, 'utf8')
const approvalDoc = readFileSync(approvalDocPath, 'utf8')
const harnessPlan = readFileSync(harnessPlanPath, 'utf8')
const finalRollup = readFileSync(finalRollupPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const setupFix = SUPABASE_SOUND_LOCAL_HARNESS_SETUP_FIX

for (const required of [
  '# SUPABASE-SOUND-4-HARNESS-FIX Local Supabase Harness Setup Fix',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE',
  'Requesting workstream: SOUND_MUSIC_AUDIO',
  'This document is setup-fix-only.',
  'This document does not execute SQL.',
  'This document does not run Supabase CLI commands.',
  'This document does not use Docker.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4-RETRY-HARNESS was blocked.',
  '`supabase/config.toml` was absent.',
  'The local Supabase binary reported `bad CPU type in executable`.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  '`supabase/config.toml` exists: no.',
  'Supabase binary architecture status: incompatible.',
  'Host architecture: `arm64`.',
  'Docker binary found: yes.',
  'psql found: yes.',
  'pg_isready found: yes.',
  'Repo-local harness found: no.',
  'setupFixDecision: `harness_setup_blocked_pending_compatible_supabase_cli`.',
  '`supabase/config.toml` created: no.',
  'secrets included: false.',
  'remote project ref included: false.',
  'Supabase cloud URL included: false.',
  'draft SQL/test files changed: false.',
  'active migrations changed: false.',
  'readyForHarnessRetry: false.',
  'generated_local_fixture_passed claimed: false.',
  recommendedImmediateNextPrompt,
]) {
  requireText(setupDoc, required, 'setupDoc')
}

check(packageJson.scripts?.[scriptName] === scriptCommand, `${scriptName} script must be correct.`)

check(setupFix.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(setupFix.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(setupFix.mode === 'local_harness_setup_fix_only', 'Mode must match.')
check(setupFix.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  setupFix.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(setupFix.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')

check(setupFix.previousBlocker.prompt === 'SUPABASE-SOUND-4-RETRY-HARNESS', 'Previous prompt must match.')
check(setupFix.previousBlocker.configTomlMissing === true, 'Missing config blocker must be recorded.')
check(setupFix.previousBlocker.approvedRepoHarnessFound === false, 'Repo harness must remain absent.')
check(setupFix.previousBlocker.supabaseBinaryBadCpuType === true, 'Bad CPU type blocker must be recorded.')
check(setupFix.previousBlocker.harnessValidationAttempted === false, 'Harness validation must not be attempted.')

check(
  setupFix.fixDecision.setupFixDecision === 'harness_setup_blocked_pending_compatible_supabase_cli',
  'Setup fix decision must be blocked pending compatible CLI.',
)
check(setupFix.fixDecision.configTomlCreated === false, 'Config must not be created.')
check(setupFix.fixDecision.localConfigReady === false, 'Local config must not be ready.')
check(
  setupFix.fixDecision.compatibleSupabaseCliAvailable === false,
  'Compatible Supabase CLI must remain unavailable.',
)
check(setupFix.fixDecision.repoLocalHarnessAvailable === false, 'Repo-local harness must be absent.')
check(setupFix.fixDecision.readyForHarnessRetry === false, 'Harness retry must not be ready.')
check(
  setupFix.fixDecision.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Next prompt must match.',
)

check(setupFix.localSetupInspection.hostArchitecture === 'arm64', 'Host architecture must be arm64.')
check(setupFix.localSetupInspection.supabaseBinaryFound === true, 'Supabase binary must be found.')
check(
  setupFix.localSetupInspection.supabaseBinaryArchitectureStatus === 'incompatible',
  'Supabase binary architecture must be incompatible.',
)
check(setupFix.localSetupInspection.dockerBinaryFound === true, 'Docker binary must be found.')
check(setupFix.localSetupInspection.psqlFound === true, 'psql must be found.')
check(setupFix.localSetupInspection.pgIsReadyFound === true, 'pg_isready must be found.')
check(
  setupFix.localSetupInspection.supabaseConfigTomlExists === false,
  'supabase/config.toml must remain absent.',
)
check(
  setupFix.localSetupInspection.setupCanBeFixedByRepoFilesAlone === false,
  'Setup must not be fixable by repo files alone.',
)
check(
  setupFix.localSetupInspection.manualUserActionRequired === true,
  'Manual user action must be required.',
)

for (const [key, value] of Object.entries(setupFix.safety)) {
  check(value === (key === 'planOnly' ? true : false), `Safety flag ${key} must be fail-closed.`)
}

for (const [key, value] of Object.entries(setupFix.configSafety)) {
  check(value === false, `Config safety flag ${key} must be false.`)
}

for (const [key, value] of Object.entries(setupFix.execution)) {
  check(value === false, `Execution flag ${key} must be false.`)
}

check(setupFix.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(
  setupFix.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source path must require private GCS path.',
)
check(setupFix.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(setupFix.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(
  setupFix.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source path must require approved snapshot.',
)
check(
  setupFix.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(setupFix.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')
check(
  setupFix.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must be blocked.',
)
check(
  setupFix.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(setupFix.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(
  setupFix.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshot must be required.',
)

check(
  SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT.decision.localHarnessValidationAttempted === false,
  'Prior harness validation must remain blocked.',
)
check(
  SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT.commandAvailability.supabaseConfigTomlPresent === false,
  'Prior validation must record missing config.',
)
check(
  SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL.decision.futureLocalHarnessExecutionApproved === true,
  'Baseline harness approval must remain future-only accepted.',
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

assertNoConcreteForbiddenText(setupDoc, 'setupDoc')
assertNoConcreteForbiddenText(validationReport, 'validationReport')
assertNoConcreteForbiddenText(approvalDoc, 'approvalDoc')
assertNoConcreteForbiddenText(harnessPlan, 'harnessPlan')
assertNoConcreteForbiddenText(finalRollup, 'finalRollup')
scanForbiddenValues(setupFix, 'SUPABASE_SOUND_LOCAL_HARNESS_SETUP_FIX')

if (existsSync(optionalConfigPath)) {
  const config = readFileSync(optionalConfigPath, 'utf8')
  assertNoConcreteForbiddenText(config, optionalConfigPath)
  check(!config.toLowerCase().includes('service_role'), 'Config must not contain service_role markers.')
  check(!config.toLowerCase().includes('anon_key'), 'Config must not contain anon key markers.')
  check(!config.toLowerCase().includes('access_token'), 'Config must not contain access token markers.')
  check(!config.toLowerCase().includes('project_ref'), 'Config must not contain remote project refs.')
}

console.log(JSON.stringify({
  ok: true,
  workstream: setupFix.workstream,
  requestingWorkstream: setupFix.requestingWorkstream,
  smoke: 'supabase-sound-local-harness-setup-fix',
  mode: setupFix.mode,
  setupFixDecision: setupFix.fixDecision.setupFixDecision,
  configTomlCreated: setupFix.fixDecision.configTomlCreated,
  readyForHarnessRetry: setupFix.fixDecision.readyForHarnessRetry,
  sqlExecuted: setupFix.safety.sqlExecuted,
  supabaseCliExecuted: setupFix.safety.supabaseCliExecuted,
  dockerUsed: setupFix.safety.dockerUsed,
  claimsGeneratedLocalFixturePassed: setupFix.claimsGeneratedLocalFixturePassed,
  recommendedImmediateNextPrompt: setupFix.fixDecision.recommendedImmediateNextPrompt,
}))
