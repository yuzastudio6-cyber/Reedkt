import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL } from '../../src/backend/mock/mock-supabase-sound-local-baseline-harness-approval'
import { SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_PLAN } from '../../src/backend/mock/mock-supabase-sound-local-harness-config-plan'
import { SUPABASE_SOUND_LOCAL_HARNESS_SETUP_FIX } from '../../src/backend/mock/mock-supabase-sound-local-harness-setup-fix'
import { SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-harness-validation-result'

const configPlanDocPath = 'docs/supabase-sound-local-harness-config-plan.md'
const setupFixDocPath = 'docs/supabase-sound-local-harness-setup-fix.md'
const validationReportPath = 'docs/supabase-sound-local-harness-validation-report.md'
const baselineApprovalDocPath = 'docs/supabase-sound-local-baseline-harness-approval.md'
const finalRollupDocPath = 'docs/supabase-sound-final-owner-evidence-rollup.md'
const optionalConfigPath = 'supabase/config.toml'
const activeDraftMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-harness-config-plan'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-harness-config-plan-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-HARNESS-CONFIG-CREATE: create safe local supabase/config.toml, no execution'

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
  check(!lower.includes('service-role key value:'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('database_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('db_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('password='), `${label} must not contain database password values.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('raw_provider_prompt'), `${label} must not contain raw provider prompt fields.`)
  check(!lower.includes('raw_prompt_payload'), `${label} must not contain raw prompt payload fields.`)
  check(!lower.includes('supabase.co'), `${label} must not contain Supabase cloud URLs.`)
  check(!lower.includes('storageobjectscreated: true'), `${label} must not contain storage mutation markers.`)
  check(!lower.includes('signedurlscreated: true'), `${label} must not contain signed URL mutation markers.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('supabasecliexecuted: true'), `${label} must not contain Supabase CLI execution markers.`)
  check(!lower.includes('dockerused: true'), `${label} must not contain Docker execution markers.`)
  check(!lower.includes('generatedassetscreated: true'), `${label} must not contain asset creation markers.`)
  check(!lower.includes('publicartifactscreated: true'), `${label} must not contain public artifact markers.`)
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

check(existsSync(configPlanDocPath), 'Config plan doc must exist.')
check(existsSync(setupFixDocPath), 'Harness setup fix doc must exist.')
check(existsSync(validationReportPath), 'Prior harness validation report must exist.')
check(existsSync(baselineApprovalDocPath), 'Baseline harness approval doc must exist.')
check(existsSync(finalRollupDocPath), 'Final owner evidence rollup doc must exist.')
if (existsSync(optionalConfigPath)) {
  const optionalConfig = readFileSync(optionalConfigPath, 'utf8')
  requireText(
    optionalConfig,
    'project_id = "reeditpro_sound_local_harness"',
    'optionalConfig',
  )
  check(!optionalConfig.includes('supabase.co'), 'optionalConfig must not contain cloud URLs.')
}
check(!existsSync(activeDraftMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const configPlanDoc = readFileSync(configPlanDocPath, 'utf8')
const setupFixDoc = readFileSync(setupFixDocPath, 'utf8')
const validationReport = readFileSync(validationReportPath, 'utf8')
const baselineApprovalDoc = readFileSync(baselineApprovalDocPath, 'utf8')
const finalRollupDoc = readFileSync(finalRollupDocPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const configPlan = SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_PLAN

for (const required of [
  '# SUPABASE-SOUND-4-HARNESS-CONFIG-PLAN Safe Local Supabase Config Plan',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'This document is config-plan-only.',
  'This document does not create `supabase/config.toml`.',
  'This document does not execute SQL.',
  'This document does not run Supabase CLI commands.',
  'This document does not use Docker.',
  'This document does not touch Supabase cloud.',
  'unlock generated_local_fixture_passed',
  'Node architecture: arm64.',
  'Supabase CLI architecture: arm64.',
  'Docker CLI availability verified in the prior no-SQL check.',
  '`supabase/config.toml` remains missing.',
  'Local harness retry remains blocked until a safe local config exists.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'The future config must be local-only.',
  'The future config must contain no secrets.',
  'The future config must contain no remote project refs.',
  'The future config must contain no Supabase cloud URL.',
  'The future config must contain no production project identifiers.',
  'The future config must contain no staging project identifiers.',
  'service_role',
  'access_token',
  'database password',
  'provider keys',
  'Stripe keys',
  'remote project refs',
  'Supabase cloud URLs',
  'production or staging project identifiers',
  'project id/name such as `reeditpro_sound_local_harness`',
  'The future config shape should be described and reviewed before creation.',
  'A text-only smoke validates the config content before any harness run.',
  'SQL executed: false.',
  'Supabase CLI executed: false.',
  'Docker used: false.',
  'database created: false.',
  'service started: false.',
  'migration deployed: false.',
  'Supabase cloud touched: false.',
  'rows created: false.',
  'storage objects created: false.',
  'signed URLs created: false.',
  'provider calls made: false.',
  'workers dispatched: false.',
  'generated assets created: false.',
  'media processing run: false.',
  'render run: false.',
  'export run: false.',
  'credit spend occurred: false.',
  'generated_local_fixture_passed claimed: false.',
  recommendedImmediateNextPrompt,
]) {
  requireText(configPlanDoc, required, 'configPlanDoc')
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(configPlan.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(configPlan.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(configPlan.mode === 'local_harness_config_plan_only', 'Mode must match.')
check(configPlan.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  configPlan.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(configPlan.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')

check(configPlan.currentPrerequisites.arm64NodeVerified === true, 'arm64 Node must be verified.')
check(
  configPlan.currentPrerequisites.arm64SupabaseCliVerified === true,
  'arm64 Supabase CLI must be verified.',
)
check(configPlan.currentPrerequisites.dockerCliVerified === true, 'Docker CLI must be verified.')
check(configPlan.currentPrerequisites.configTomlExists === false, 'Config must remain absent.')
check(
  configPlan.currentPrerequisites.readyForHarnessRetry === false,
  'Harness retry must remain blocked.',
)

check(configPlan.configPlan.configCreatedNow === false, 'Config must not be created now.')
check(
  configPlan.configPlan.configCreationAllowedNextPrompt === true,
  'Config creation must be reserved for the next prompt.',
)
check(
  configPlan.configPlan.recommendedProjectId === 'reeditpro_sound_local_harness',
  'Recommended project id must match.',
)
check(configPlan.configPlan.localOnly === true, 'Config plan must be local-only.')
check(configPlan.configPlan.noSecrets === true, 'Config plan must require no secrets.')
check(configPlan.configPlan.noRemoteProjectRef === true, 'Config plan must require no remote refs.')
check(configPlan.configPlan.noSupabaseCloudUrl === true, 'Config plan must require no cloud URL.')
check(
  configPlan.configPlan.noProductionStagingIds === true,
  'Config plan must require no production/staging ids.',
)

check(configPlan.forbiddenConfigValues.length >= 10, 'Forbidden config values must be populated.')
check(
  configPlan.futureConfigSafetyCriteria.length >= 10,
  'Future config safety criteria must be populated.',
)
check(
  configPlan.forbiddenConfigValues.some((value) => value.includes('service_role')),
  'Forbidden config values must include service_role policy text.',
)
check(
  configPlan.futureConfigSafetyCriteria.some((value) =>
    value.includes('text-only smoke validates config content'),
  ),
  'Future criteria must require text-only smoke validation.',
)

for (const [key, value] of Object.entries(configPlan.execution)) {
  check(value === false, `Execution flag ${key} must be false.`)
}

check(configPlan.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(
  configPlan.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source path must require private GCS path.',
)
check(configPlan.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(configPlan.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(
  configPlan.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source path must require approved snapshot.',
)
check(
  configPlan.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(configPlan.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')

check(
  configPlan.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must be blocked.',
)
check(
  configPlan.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(configPlan.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(
  configPlan.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshot must be required.',
)
check(
  configPlan.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

check(
  SUPABASE_SOUND_LOCAL_HARNESS_SETUP_FIX.fixDecision.configTomlCreated === false,
  'Setup fix must not have created config.',
)
check(
  SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT.commandAvailability.supabaseConfigTomlPresent ===
    false,
  'Prior validation must have recorded missing config.',
)
check(
  SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL.decision.futureLocalHarnessExecutionApproved ===
    true,
  'Baseline harness approval must still approve a future local harness prompt.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW === false,
  'Final rollup must keep execution blocked now.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.generatedLocalFixturePassedClaimed === false,
  'Final rollup must not claim fixture pass.',
)

scanForbiddenValues(configPlan, 'configPlan')
for (const [label, source] of Object.entries({
  configPlanDoc,
  setupFixDoc,
  validationReport,
  baselineApprovalDoc,
  finalRollupDoc,
})) {
  assertNoConcreteForbiddenText(source, label)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      workstream: configPlan.workstream,
      requestingWorkstream: configPlan.requestingWorkstream,
      smoke: 'supabase-sound-local-harness-config-plan',
      mode: configPlan.mode,
      arm64NodeVerified: configPlan.currentPrerequisites.arm64NodeVerified,
      arm64SupabaseCliVerified: configPlan.currentPrerequisites.arm64SupabaseCliVerified,
      dockerCliVerified: configPlan.currentPrerequisites.dockerCliVerified,
      configCreatedNow: configPlan.configPlan.configCreatedNow,
      claimsGeneratedLocalFixturePassed: configPlan.claimsGeneratedLocalFixturePassed,
      recommendedImmediateNextPrompt: configPlan.recommendedImmediateNextPrompt,
    },
    null,
    2,
  ),
)
