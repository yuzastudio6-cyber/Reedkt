import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_LOCAL_HARNESS_PORTS_FIX } from '../../src/backend/mock/mock-supabase-sound-local-harness-ports-fix'

const reportPath = 'docs/supabase-sound-local-harness-ports-fix-report.md'
const specPath = 'src/backend/mock/mock-supabase-sound-local-harness-ports-fix.ts'
const configPath = 'supabase/config.toml'
const activeDraftMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-harness-ports-fix'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-harness-ports-fix-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-HARNESS-PORTS-VERIFY: verify local harness port fix and prerequisites, no SQL'

const defaultConflictingPorts = [54320, 54321, 54322, 54323, 54324, 54327, 54329]

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, label: string): void {
  check(source.includes(text), `${label} must include ${text}.`)
}

function assertNoConcreteSecretOrUrlText(source: string, label: string): void {
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
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
  check(
    !/eyj[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}\.[a-z0-9_-]{12,}/i.test(source),
    `${label} must not contain JWT-like values.`,
  )
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

  const urls = Array.from(config.matchAll(/https?:\/\/[^\s"',\]]+/g)).map((match) => match[0])
  check(urls.length > 0, 'Config must contain local URL values.')
  for (const url of urls) {
    check(
      url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost'),
      `Config URL must be local-only: ${url}`,
    )
  }
}

function readSection(config: string, sectionName: string): string {
  const sectionStart = config.indexOf(`[${sectionName}]`)
  check(sectionStart >= 0, `Config must contain [${sectionName}].`)
  const rest = config.slice(sectionStart)
  const nextSection = rest.slice(1).search(/\n\[[^\]]+\]/)
  return nextSection >= 0 ? rest.slice(0, nextSection + 1) : rest
}

function readNumericKey(config: string, sectionName: string, key: string): number {
  const section = readSection(config, sectionName)
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = section.match(new RegExp(`^${escapedKey}\\s*=\\s*(\\d+)`, 'm'))
  check(Boolean(match), `Config [${sectionName}] must contain numeric ${key}.`)
  return Number(match?.[1])
}

check(existsSync(reportPath), 'Port fix report must exist.')
check(existsSync(specPath), 'Port fix spec must exist.')
check(existsSync(configPath), 'supabase/config.toml must exist.')
check(!existsSync(activeDraftMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const report = readFileSync(reportPath, 'utf8')
const specSource = readFileSync(specPath, 'utf8')
const config = readFileSync(configPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const result = SUPABASE_SOUND_LOCAL_HARNESS_PORTS_FIX

for (const required of [
  '# SUPABASE-SOUND-4-HARNESS-PORTS-FIX Local Harness Port Conflict Fix',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE',
  'Requesting workstream: SOUND_MUSIC_AUDIO',
  'This document reports local config port fix only.',
  'This document does not execute SQL.',
  'This document does not run Supabase CLI commands.',
  'This document does not run Docker containers.',
  'This document does not touch Supabase cloud.',
  'This document does not unlock generated_local_fixture_passed.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'existing Docker stack detected: yes.',
  'existing stack name: reeditpro-local.',
  'selected new port range: 55420-55429.',
  'port conflict detected after fix: no.',
  'no Docker containers stopped: true.',
  'no Supabase CLI runtime command run: true.',
  'supabase/config.toml updated: yes.',
  'project_id unchanged: yes.',
  'local-only URLs retained: yes.',
  'forbidden values absent: yes.',
  'default conflicting ports removed: yes.',
  'SQL executed: false.',
  'Supabase CLI executed: false.',
  'Docker containers started/stopped: false.',
  'generated_local_fixture_passed: false.',
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
check(result.mode === 'local_harness_ports_fix_only', 'Mode must match.')
check(result.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  result.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(result.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')
check(result.previousBlocker.prompt === 'SUPABASE-SOUND-4-RETRY-HARNESS-3', 'Previous prompt must match.')
check(result.previousBlocker.portConflictDetected === true, 'Previous blocker must be a port conflict.')
check(
  result.previousBlocker.existingDockerStackName === 'reeditpro-local',
  'Existing Docker stack name must match.',
)
check(result.previousBlocker.conflictedPorts.includes(54321), 'Previous blocker must include 54321.')
check(result.previousBlocker.conflictedPorts.includes(54324), 'Previous blocker must include 54324.')
check(result.portFix.configUpdatedNow === true, 'Config must be updated now.')
check(result.portFix.selectedPortRange === '55420-55429', 'Selected range must match.')
check(result.portFix.projectIdUnchanged === true, 'Project id must be unchanged.')
check(result.portFix.localOnlyUrlsRetained === true, 'Local-only URLs must be retained.')
check(result.portFix.defaultConflictingPortsRemoved === true, 'Default conflicting ports must be removed.')
check(result.portFix.portConflictAfterFix === false, 'Port conflict after fix must be false.')

const selectedPortValues = Object.values(result.selectedPorts)
check(selectedPortValues.length === 7, 'All selected ports must exist.')
for (const port of selectedPortValues) {
  check(Number.isInteger(port), `Selected port ${port} must be an integer.`)
  check(!defaultConflictingPorts.includes(port), `Selected port ${port} must not be a default port.`)
  check(port >= 55420 && port <= 55429, `Selected port ${port} must be in the 55420-55429 range.`)
}

check(readNumericKey(config, 'api', 'port') === result.selectedPorts.apiPort, 'API port must match spec.')
check(readNumericKey(config, 'db', 'port') === result.selectedPorts.dbPort, 'DB port must match spec.')
check(
  readNumericKey(config, 'db', 'shadow_port') === result.selectedPorts.shadowPort,
  'DB shadow port must match spec.',
)
check(readNumericKey(config, 'studio', 'port') === result.selectedPorts.studioPort, 'Studio port must match spec.')
check(
  readNumericKey(config, 'inbucket', 'port') === result.selectedPorts.inbucketPort,
  'Inbucket port must match spec.',
)
check(
  readNumericKey(config, 'analytics', 'port') === result.selectedPorts.analyticsPort,
  'Analytics port must match spec.',
)
check(
  readNumericKey(config, 'db.pooler', 'port') === result.selectedPorts.poolerPort,
  'Pooler port must match spec.',
)

for (const port of defaultConflictingPorts) {
  check(!new RegExp(`(^|\\n)\\s*(port|shadow_port)\\s*=\\s*${port}(\\s|$)`).test(config), `Config must not use ${port}.`)
}

for (const [key, value] of Object.entries(result.configSafety)) {
  check(value === false, `Config safety flag ${key} must be false.`)
}

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
check(result.rawPromptRule.requiresStructuredAgentFindings === true, 'Structured findings required.')
check(result.rawPromptRule.requiresEditIntents === true, 'Edit intents required.')
check(result.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Approved snapshot required.')
check(result.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt, 'Next prompt must match.')

assertSafeConfig(config)
assertNoConcreteSecretOrUrlText(report, 'report')
assertNoConcreteSecretOrUrlText(specSource, 'spec')

console.log(
  JSON.stringify(
    {
      ok: true,
      workstream: result.workstream,
      requestingWorkstream: result.requestingWorkstream,
      smoke: 'supabase-sound-local-harness-ports-fix',
      mode: result.mode,
      existingDockerStackName: result.previousBlocker.existingDockerStackName,
      configUpdatedNow: result.portFix.configUpdatedNow,
      selectedPortRange: result.portFix.selectedPortRange,
      claimsGeneratedLocalFixturePassed: result.claimsGeneratedLocalFixturePassed,
      sqlExecuted: result.execution.sqlExecuted,
      supabaseCliExecuted: result.execution.supabaseCliExecuted,
      dockerContainersStartedStopped: result.execution.dockerContainersStartedStopped,
      recommendedImmediateNextPrompt: result.recommendedImmediateNextPrompt,
    },
    null,
    2,
  ),
)
