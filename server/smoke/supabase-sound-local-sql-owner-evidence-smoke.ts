import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE } from '../../src/backend/mock/mock-supabase-sound-local-sql-owner-evidence'

const evidenceDocPath = 'docs/supabase-sound-local-sql-validation-owner-evidence.md'
const ownerAcceptancePath = 'docs/supabase-sound-local-sql-validation-owner-acceptance.md'
const validationPlanPath = 'docs/supabase-sound-local-fixture-validation-plan.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-sql-owner-evidence'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-sql-owner-evidence-smoke.ts'
const recommendedNextPrompt =
  'SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution'

const requiredOwners = [
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
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
  check(!lower.includes('provider secret value'), `${label} must not contain provider secret values.`)
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('rawworkerprompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('raw_prompt_worker_payload'), `${label} must not contain raw prompt worker payload fields.`)
  check(!lower.includes('objectcreated'), `${label} must not contain object creation markers.`)
  check(!lower.includes('rowscreated: true'), `${label} must not contain row mutation markers.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
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

function ownerSection(source: string, owner: string): string {
  const start = source.indexOf(`### ${owner}`)
  check(start >= 0, `Owner section missing: ${owner}`)
  const next = source.indexOf('\n### ', start + 1)
  return next >= 0 ? source.slice(start, next) : source.slice(start)
}

check(existsSync(evidenceDocPath), 'Owner evidence document must exist.')
check(existsSync(ownerAcceptancePath), 'Owner acceptance packet must exist.')
check(existsSync(validationPlanPath), 'Local validation plan document must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const evidenceDoc = readFileSync(evidenceDocPath, 'utf8')
const ownerAcceptance = readFileSync(ownerAcceptancePath, 'utf8')
const validationPlan = readFileSync(validationPlanPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-3B Local SQL Validation Owner Evidence Packet',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'Current acceptance state: evidence_collection_only.',
  'goForSUPABASE_SOUND_4: false.',
  'This packet is owner-evidence-collection-only.',
  'This packet does not execute SQL.',
  'This packet does not run migrations.',
  'This packet does not deploy migrations.',
  'This packet does not create rows.',
  'This packet does not create storage buckets or objects.',
  'This packet does not create signed URLs.',
  'This packet does not call providers.',
  'This packet does not dispatch workers.',
  'This packet does not create generated assets.',
  'This packet does not create credit or approval records.',
  'This packet does not unlock generated_local_fixture_passed.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  '## Acceptance evidence summary',
  'Plan-only continuation accepted: true.',
  'Local-only fixture planning with mock/reference IDs accepted: true.',
  'Generated/local fixture execution accepted: false.',
  'Local SQL validation accepted: false.',
  '## Inputs reviewed for evidence collection',
  ownerAcceptancePath,
  validationPlanPath,
  'docs/supabase-sound-local-fixture-mutation-plan.md',
  draftMigrationPath,
  draftTestPath,
  '## Owner evidence matrix',
  '## Missing evidence',
  '## Forbidden actions while evidence is incomplete',
  '## Go / no-go result',
  'SUPABASE-SOUND-4 local SQL validation is blocked.',
  'generated_local_fixture_passed is not claimed.',
  '## Evidence required before SUPABASE-SOUND-4',
  '## Recommendation',
  recommendedNextPrompt,
]) {
  requireText(evidenceDoc, required, `Owner evidence doc must include ${required}.`)
}

for (const missing of [
  'no explicit SUPABASE_RLS_STORAGE_DATABASE command approval for local SQL validation',
  'no explicit local/non-production target proof',
  'no explicit no-live-data proof',
  'no explicit rollback/cleanup approval',
  'no explicit Worker Runtime acceptance',
  'no explicit Provider Gateway acceptance',
  'no explicit Observability acceptance',
  'no explicit Billing acceptance',
  'no explicit Track A acceptance',
  'no explicit Track B acceptance',
]) {
  requireText(evidenceDoc, missing, `Owner evidence doc must include missing evidence: ${missing}`)
}

for (const forbidden of [
  'no SQL execution',
  'no migration commands',
  'no Supabase mutation',
  'no storage writes',
  'no signed URLs',
  'no provider calls',
  'no worker dispatch',
  'no generated assets',
  'no credit rows',
  'no public artifacts',
  'no staging, beta, external beta, paid production, or production claims',
]) {
  requireText(evidenceDoc, forbidden, `Owner evidence doc must include forbidden action: ${forbidden}`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(evidenceDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} must include owner field.`)
  requireText(section, 'acceptanceForPlanOnly: accepted.', `${owner} must accept plan-only continuation.`)
  requireText(
    section,
    'acceptanceForLocalFixturePlanning: accepted.',
    `${owner} must accept local fixture planning.`,
  )
  requireText(section, 'acceptanceForExecution: not_accepted.', `${owner} must reject execution.`)
  requireText(section, 'evidenceFound:', `${owner} must include evidenceFound.`)
  requireText(section, 'evidenceMissing:', `${owner} must include evidenceMissing.`)
  requireText(section, 'blockers:', `${owner} must include blockers.`)
  requireText(
    section,
    'requiredBeforeSUPABASE_SOUND_4:',
    `${owner} must include requirements before SUPABASE-SOUND-4.`,
  )
  requireText(section, `nextRecommendedPrompt: ${recommendedNextPrompt}.`, `${owner} must include next prompt.`)
}

requireText(
  ownerSection(evidenceDoc, 'SUPABASE_RLS_STORAGE_DATABASE'),
  'acceptanceForLocalSqlValidation: not_accepted.',
  'Supabase owner must not accept local SQL validation yet.',
)
requireText(
  ownerSection(evidenceDoc, 'SOUND_MUSIC_AUDIO'),
  'acceptanceForLocalSqlValidation: pending_or_not_applicable.',
  'SOUND local SQL acceptance must be pending or not applicable.',
)

for (const owner of requiredOwners.filter((owner) => owner !== 'SOUND_MUSIC_AUDIO')) {
  requireText(
    ownerSection(evidenceDoc, owner),
    'acceptanceForLocalSqlValidation: not_accepted.',
    `${owner} must not accept local SQL validation yet.`,
  )
}

for (const ownerAcceptanceRequired of [
  '# SUPABASE-SOUND-3A Local SQL Validation Owner Acceptance Packet',
  'This packet is owner-acceptance-only.',
  'Acceptance status: not_accepted_for_execution.',
  'SUPABASE-SOUND-3B: collect owner acceptance evidence, no execution',
]) {
  requireText(
    ownerAcceptance,
    ownerAcceptanceRequired,
    `Owner acceptance packet must still include ${ownerAcceptanceRequired}.`,
  )
}

for (const validationPlanRequired of [
  '# SUPABASE-SOUND-3 Local Fixture Validation Plan',
  'This document is a local validation plan only.',
  'These commands require SUPABASE_RLS_STORAGE_DATABASE owner acceptance before use.',
  'SUPABASE-SOUND-3A: owner acceptance packet for local SQL validation, no execution',
]) {
  requireText(validationPlan, validationPlanRequired, `Validation plan must still include ${validationPlanRequired}.`)
}

for (const draftRequired of [
  'DRAFT ONLY',
  'DO NOT APPLY',
  'DO NOT DEPLOY',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Raw prompts must not become worker execution payloads.',
]) {
  requireText(draftMigration, draftRequired, `Draft migration must still include ${draftRequired}.`)
}

for (const draftTestRequired of [
  'DRAFT TESTS ONLY',
  'DO NOT RUN AGAINST PRODUCTION',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Raw prompts must not become worker execution payloads.',
]) {
  requireText(draftTests, draftTestRequired, `Draft test SQL must still include ${draftTestRequired}.`)
}

const evidence = SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE
check(evidence.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Evidence spec must be Supabase-owned.')
check(evidence.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Evidence spec must request SOUND_MUSIC_AUDIO.')
check(evidence.mode === 'owner_evidence_collection_only', 'Evidence spec mode must be evidence collection only.')
check(evidence.currentUnlockStage === 'dry_run_passed', 'Current stage must remain dry_run_passed.')
check(
  evidence.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target future stage must be generated_local_fixture_passed.',
)
check(evidence.claimsGeneratedLocalFixturePassed === false, 'Evidence spec must not claim generated local fixture passed.')
check(evidence.goForSUPABASE_SOUND_4 === false, 'Evidence spec must not approve SUPABASE-SOUND-4.')

for (const [key, value] of Object.entries(evidence.execution)) {
  check(value === false, `Execution flag must remain false: ${key}`)
}

check(evidence.sourceOfTruthPath.requiresSupabaseRow === true, 'Source-of-truth path must require Supabase row.')
check(evidence.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Source-of-truth path must require private GCS path.')
check(evidence.sourceOfTruthPath.requiresManifest === true, 'Source-of-truth path must require manifest.')
check(evidence.sourceOfTruthPath.requiresChecksum === true, 'Source-of-truth path must require checksum.')
check(
  evidence.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved snapshot.',
)
check(evidence.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
check(evidence.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')

check(evidence.rawPromptRule.rawPromptDirectExecutionAllowed === false, 'Raw prompt execution must remain blocked.')
check(evidence.rawPromptRule.requiresStructuredAgentFindings === true, 'Structured findings must be required.')
check(evidence.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(evidence.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Approved snapshots must be required.')

check(evidence.acceptanceEvidenceSummary.planOnlyContinuationAccepted === true, 'Plan-only continuation must be accepted.')
check(
  evidence.acceptanceEvidenceSummary.localOnlyFixturePlanningWithMockReferenceIdsAccepted === true,
  'Mock/reference planning must be accepted.',
)
check(
  evidence.acceptanceEvidenceSummary.generatedLocalFixtureExecutionAccepted === false,
  'Generated/local fixture execution must remain unaccepted.',
)
check(
  evidence.acceptanceEvidenceSummary.localSqlValidationAccepted === false,
  'Local SQL validation must remain unaccepted.',
)
check(
  evidence.acceptanceEvidenceSummary.currentAcceptanceState === 'evidence_collection_only',
  'Evidence state must be evidence_collection_only.',
)

check(evidence.owners.length === requiredOwners.length, 'Evidence spec must include all required owners.')
for (const owner of requiredOwners) {
  const entry = evidence.owners.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Evidence spec owner missing: ${owner}`)
  if (!entry) continue
  check(entry.acceptanceForPlanOnly === 'accepted', `${owner} plan-only acceptance must be accepted.`)
  check(
    entry.acceptanceForLocalFixturePlanning === 'accepted',
    `${owner} local fixture planning acceptance must be accepted.`,
  )
  check(entry.acceptanceForExecution === 'not_accepted', `${owner} execution must remain not accepted.`)
  check(entry.evidenceFound.length > 0, `${owner} evidenceFound must be non-empty.`)
  check(entry.evidenceMissing.length > 0, `${owner} evidenceMissing must be non-empty.`)
  check(entry.blockers.length > 0, `${owner} blockers must be non-empty.`)
  check(
    entry.requiredBeforeSUPABASE_SOUND_4.length > 0,
    `${owner} requirements before SUPABASE-SOUND-4 must be non-empty.`,
  )
  check(entry.nextRecommendedPrompt === recommendedNextPrompt, `${owner} must point to the next evidence prompt.`)
}

const soundEntry = evidence.owners.find((entry) => entry.owner === 'SOUND_MUSIC_AUDIO')
check(
  soundEntry?.acceptanceForLocalSqlValidation === 'pending_or_not_applicable',
  'SOUND local SQL validation acceptance must be pending_or_not_applicable.',
)
for (const owner of requiredOwners.filter((owner) => owner !== 'SOUND_MUSIC_AUDIO')) {
  const entry = evidence.owners.find((candidate) => candidate.owner === owner)
  check(entry?.acceptanceForLocalSqlValidation === 'not_accepted', `${owner} local SQL validation must be not accepted.`)
}

for (const missing of [
  'no explicit SUPABASE_RLS_STORAGE_DATABASE command approval for local SQL validation',
  'no explicit local/non-production target proof',
  'no explicit no-live-data proof',
  'no explicit rollback/cleanup approval',
  'no explicit Worker Runtime acceptance',
  'no explicit Provider Gateway acceptance',
  'no explicit Observability acceptance',
  'no explicit Billing acceptance',
  'no explicit Track A acceptance',
  'no explicit Track B acceptance',
]) {
  check(evidence.missingEvidence.includes(missing), `Evidence spec must include missing evidence: ${missing}`)
}

for (const forbidden of [
  'no SQL execution',
  'no migration commands',
  'no Supabase mutation',
  'no storage writes',
  'no signed URLs',
  'no provider calls',
  'no worker dispatch',
  'no generated assets',
  'no credit rows',
  'no public artifacts',
]) {
  check(
    evidence.forbiddenActionsWhileIncomplete.some((entry) => entry.includes(forbidden)),
    `Evidence spec must include forbidden action: ${forbidden}`,
  )
}

check(
  evidence.recommendedImmediateNextPrompt === recommendedNextPrompt,
  'Evidence spec must point at the exact next prompt.',
)

assertNoConcreteForbiddenText(evidenceDoc, 'Owner evidence doc')
assertNoConcreteForbiddenText(ownerAcceptance, 'Owner acceptance packet')
assertNoConcreteForbiddenText(validationPlan, 'Validation plan')
assertNoConcreteForbiddenText(draftMigration, 'Draft migration')
assertNoConcreteForbiddenText(draftTests, 'Draft tests')
scanForbiddenValues(evidence, 'SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE')

check(packageJson.scripts?.[scriptName] === scriptCommand, `${scriptName} package script must point at the owner evidence smoke.`)

console.log(JSON.stringify({
  ok: true,
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'supabase-sound-local-sql-owner-evidence',
  ownerEvidenceCollectionOnly: true,
  goForSUPABASE_SOUND_4: false,
  sqlExecuted: false,
  migrationDeployed: false,
  rowsCreated: false,
  storageObjectsCreated: false,
  signedUrlsCreated: false,
  claimsGeneratedLocalFixturePassed: false,
  owners: requiredOwners.length,
  recommendedNextPrompt,
}, null, 2))
