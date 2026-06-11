import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_CREATE } from '../../src/backend/mock/mock-supabase-sound-local-harness-config-create'
import { SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_PLAN } from '../../src/backend/mock/mock-supabase-sound-local-harness-config-plan'

const configPath = 'supabase/config.toml'
const reportPath = 'docs/supabase-sound-local-harness-config-create-report.md'
const configPlanDocPath = 'docs/supabase-sound-local-harness-config-plan.md'
const activeDraftMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-harness-config-create'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-harness-config-create-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-HARNESS-CONFIG-VERIFY: verify safe local config and harness prerequisites, no SQL'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, label: string): void {
  check(source.includes(text), `${label} must include ${text}.`)
}

function assertNoConcreteForbiddenText(source: string, label: string): void {
  const lower = source.toLowerCase()
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
  check(
    !/https?:\/\/[^\s"',\]]*supabase\.co/i.test(source),
    `${label} must not contain Supabase cloud URLs.`,
  )
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

function assertSafeConfig(config: string): void {
  const lower = config.toLowerCase()
  check(config.includes('project_id = "reeditpro_sound_local_harness"'), 'Config project_id must match.')
  check(!lower.includes('supabase.co'), 'Config must not contain Supabase cloud URLs.')
  check(!lower.includes('service_role'), 'Config must not contain service_role markers.')
  check(!lower.includes('service_role_key'), 'Config must not contain service_role_key markers.')
  check(!lower.includes('anon_key'), 'Config must not contain anon_key markers.')
  check(!lower.includes('access_token'), 'Config must not contain access_token markers.')
  check(!lower.includes('jwt_secret'), 'Config must not contain jwt_secret markers.')
  check(!lower.includes('database_password'), 'Config must not contain database_password markers.')
  check(!lower.includes('db_password'), 'Config must not contain db_password markers.')
  check(!/(^|\s)password\s*=/im.test(config), 'Config must not contain password assignments.')
  check(!lower.includes('stripe'), 'Config must not contain Stripe markers.')
  check(!lower.includes('provider_secret'), 'Config must not contain provider secret markers.')
  check(!lower.includes('providercredential'), 'Config must not contain provider credential markers.')
  check(!lower.includes('env('), 'Config must not contain env(...) placeholders.')
  check(!lower.includes('x-goog-signature'), 'Config must not contain signed URL signatures.')
  check(!lower.includes('x-amz-signature'), 'Config must not contain signed URL signatures.')
  check(!lower.includes('signature='), 'Config must not contain signed URL query values.')
  check(!lower.includes('storage.googleapis.com'), 'Config must not contain storage public URLs.')
  check(!lower.includes('gs://'), 'Config must not contain real storage URIs.')
  check(!lower.includes('gcs://'), 'Config must not contain real storage URIs.')
  check(!lower.includes('raw_prompt'), 'Config must not contain raw prompt markers.')
  check(!/akia[0-9a-z]{12,}/i.test(config), 'Config must not contain access key shapes.')
  check(!/sk-[a-z0-9_-]{12,}/i.test(config), 'Config must not contain provider credential shapes.')
  check(!/eyj[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}/i.test(config), 'Config must not contain JWT-like values.')

  const urls = Array.from(config.matchAll(/https?:\/\/[^\s"',\]]+/g)).map((match) => match[0])
  check(urls.length > 0, 'Config must contain local URL values.')
  for (const url of urls) {
    check(
      url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost'),
      `Config URL must be local-only: ${url}`,
    )
  }

  for (const section of [
    '[api]',
    '[api.tls]',
    '[db]',
    '[db.pooler]',
    '[db.migrations]',
    '[db.seed]',
    '[realtime]',
    '[studio]',
    '[inbucket]',
    '[storage]',
    '[storage.s3_protocol]',
    '[auth]',
    '[auth.email]',
    '[auth.sms]',
    '[auth.mfa]',
    '[auth.mfa.totp]',
    '[auth.mfa.phone]',
    '[edge_runtime]',
    '[analytics]',
  ]) {
    requireText(config, section, 'config')
  }

  requireText(config, 'enabled = false', 'config')
  requireText(config, 'schema_paths = []', 'config')
  requireText(config, 'sql_paths = []', 'config')
  requireText(config, 'enable_signup = false', 'config')
  requireText(config, 'enable_anonymous_sign_ins = false', 'config')
}

check(existsSync(reportPath), 'Config creation report must exist.')
check(existsSync(configPlanDocPath), 'Config plan doc must exist.')
check(existsSync(configPath), 'supabase/config.toml must exist.')
check(!existsSync(activeDraftMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const report = readFileSync(reportPath, 'utf8')
const configPlanDoc = readFileSync(configPlanDocPath, 'utf8')
const config = readFileSync(configPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const createSpec = SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_CREATE

for (const required of [
  '# SUPABASE-SOUND-4-HARNESS-CONFIG-CREATE Safe Local Supabase Config Creation Report',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'This document reports safe local config creation only.',
  'This document does not execute SQL.',
  'This document does not run Supabase CLI commands.',
  'This document does not use Docker.',
  'This document does not touch Supabase cloud.',
  'unlock generated_local_fixture_passed',
  '`supabase/config.toml` status before this prompt: missing.',
  '`supabase/config.toml` status after this prompt: exists.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'config existed before: no.',
  'config created now: yes.',
  'config overwritten: no.',
  'config path: `supabase/config.toml`.',
  'local-only: yes.',
  'allowed local URLs only: yes.',
  'project id/name: `reeditpro_sound_local_harness`.',
  'no service_role key values.',
  'no anon key values.',
  'no access token.',
  'no JWT secret value.',
  'no database password.',
  'no provider keys.',
  'no Stripe keys.',
  'no remote project ref.',
  'no supabase.co URL.',
  'no production/staging identifier.',
  'no signed URL settings as source of truth.',
  'no public artifact settings.',
  'no worker/provider execution settings.',
  'SQL executed: false.',
  'Supabase CLI executed: false.',
  'Docker used: false.',
  'database created: false.',
  'service started: false.',
  'Supabase cloud touched: false.',
  'storage writes: false.',
  'signed URLs: false.',
  'provider calls: false.',
  'worker dispatch: false.',
  'generated audio/assets: false.',
  'media processing: false.',
  'render/export: false.',
  'credit spend/reservation: false.',
  'generated_local_fixture_passed: false.',
  recommendedImmediateNextPrompt,
]) {
  requireText(report, required, 'report')
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(createSpec.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(createSpec.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(createSpec.mode === 'local_harness_config_create_only', 'Mode must match.')
check(createSpec.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  createSpec.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(createSpec.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')
check(createSpec.currentPrerequisites.arm64NodeVerified === true, 'arm64 Node must be verified.')
check(
  createSpec.currentPrerequisites.arm64SupabaseCliVerified === true,
  'arm64 Supabase CLI must be verified.',
)
check(createSpec.currentPrerequisites.dockerCliVerified === true, 'Docker CLI must be verified.')
check(createSpec.currentPrerequisites.configTomlExistsAfter === true, 'Config must exist after creation.')
check(
  createSpec.currentPrerequisites.readyForHarnessRetry === false,
  'Harness retry must remain blocked.',
)

check(createSpec.configResult.configExistedBefore === false, 'Config must be recorded as absent before.')
check(createSpec.configResult.configCreatedNow === true, 'Config must be recorded as created now.')
check(createSpec.configResult.configOverwritten === false, 'Config must not be overwritten.')
check(createSpec.configResult.configPath === 'supabase/config.toml', 'Config path must match.')
check(createSpec.configResult.localOnly === true, 'Config must be local-only.')
check(createSpec.configResult.noSecrets === true, 'Config must have no secrets.')
check(createSpec.configResult.noRemoteProjectRef === true, 'Config must have no remote refs.')
check(createSpec.configResult.noSupabaseCloudUrl === true, 'Config must have no cloud URL.')
check(createSpec.configResult.noProductionStagingIds === true, 'Config must have no production/staging ids.')
check(createSpec.configResult.allowedLocalUrlsOnly === true, 'Config must allow local URLs only.')
check(
  createSpec.configResult.recommendedProjectId === 'reeditpro_sound_local_harness',
  'Recommended project id must match.',
)

for (const [key, value] of Object.entries(createSpec.configSafety)) {
  check(value === false, `Config safety flag ${key} must be false.`)
}

for (const [key, value] of Object.entries(createSpec.execution)) {
  check(value === false, `Execution flag ${key} must be false.`)
}

check(createSpec.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(
  createSpec.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source path must require private GCS path.',
)
check(createSpec.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(createSpec.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(
  createSpec.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source path must require approved snapshot.',
)
check(
  createSpec.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(createSpec.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')
check(
  createSpec.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt execution must be blocked.',
)
check(createSpec.rawPromptRule.requiresStructuredAgentFindings === true, 'Structured findings required.')
check(createSpec.rawPromptRule.requiresEditIntents === true, 'Edit intents required.')
check(createSpec.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Approved snapshot required.')
check(createSpec.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt, 'Next prompt must match.')

check(
  SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_PLAN.configPlan.configCreationAllowedNextPrompt === true,
  'Config plan must allow the create prompt.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW === false,
  'Final rollup must keep execution blocked.',
)

assertSafeConfig(config)
scanForbiddenValues(createSpec, 'createSpec')
assertNoConcreteForbiddenText(report, 'report')
assertNoConcreteForbiddenText(configPlanDoc, 'configPlanDoc')

console.log(
  JSON.stringify(
    {
      ok: true,
      workstream: createSpec.workstream,
      requestingWorkstream: createSpec.requestingWorkstream,
      smoke: 'supabase-sound-local-harness-config-create',
      mode: createSpec.mode,
      configTomlExistsAfter: createSpec.currentPrerequisites.configTomlExistsAfter,
      configCreatedNow: createSpec.configResult.configCreatedNow,
      localOnly: createSpec.configResult.localOnly,
      noSecrets: createSpec.configResult.noSecrets,
      supabaseCliExecuted: createSpec.execution.supabaseCliExecuted,
      dockerUsed: createSpec.execution.dockerUsed,
      sqlExecuted: createSpec.execution.sqlExecuted,
      claimsGeneratedLocalFixturePassed: createSpec.claimsGeneratedLocalFixturePassed,
      recommendedImmediateNextPrompt: createSpec.recommendedImmediateNextPrompt,
    },
    null,
    2,
  ),
)
