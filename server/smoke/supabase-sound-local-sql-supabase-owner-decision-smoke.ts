import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_LOCAL_SQL_APPROVAL_REQUESTS } from '../../src/backend/mock/mock-supabase-sound-local-sql-approval-requests'
import { SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE } from '../../src/backend/mock/mock-supabase-sound-local-sql-owner-evidence'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'

const decisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const approvalDocPath = 'docs/supabase-sound-local-sql-validation-owner-approval-requests.md'
const evidenceDocPath = 'docs/supabase-sound-local-sql-validation-owner-evidence.md'
const ownerAcceptancePath = 'docs/supabase-sound-local-sql-validation-owner-acceptance.md'
const validationPlanPath = 'docs/supabase-sound-local-fixture-validation-plan.md'
const mutationPlanPath = 'docs/supabase-sound-local-fixture-mutation-plan.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-sql-supabase-owner-decision'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-sql-supabase-owner-decision-smoke.ts'
const recommendedImmediateNextPrompt = 'WORKER-RUNTIME-SOUND-0: audio fixture payload acceptance audit'

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

function assertAllExecutionFlagsFalse(flags: Record<string, boolean>, label: string): void {
  for (const [key, value] of Object.entries(flags)) {
    check(value === false, `${label}.${key} must be false.`)
  }
}

check(existsSync(decisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(approvalDocPath), 'Approval request document must exist.')
check(existsSync(evidenceDocPath), 'Owner evidence document must exist.')
check(existsSync(ownerAcceptancePath), 'Owner acceptance packet must exist.')
check(existsSync(validationPlanPath), 'Local validation plan document must exist.')
check(existsSync(mutationPlanPath), 'Mutation plan document must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const decisionDoc = readFileSync(decisionDocPath, 'utf8')
const approvalDoc = readFileSync(approvalDocPath, 'utf8')
const evidenceDoc = readFileSync(evidenceDocPath, 'utf8')
const ownerAcceptance = readFileSync(ownerAcceptancePath, 'utf8')
const validationPlan = readFileSync(validationPlanPath, 'utf8')
const mutationPlan = readFileSync(mutationPlanPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-3D Supabase Owner Decision for Local SQL Validation',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'Decision mode: supabase_owner_decision_only.',
  'This document is Supabase-owner-decision-only.',
  'This document does not execute SQL.',
  'This document does not run migrations.',
  'This document does not deploy migrations.',
  'This document does not create rows.',
  'This document does not create storage buckets or objects.',
  'This document does not create signed URLs.',
  'This document does not call providers.',
  'This document does not dispatch workers.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked until cross-owner approvals are complete.',
  'supabaseOwnerDecision: conditional_supabase_owner_acceptance_for_future_local_sql_validation.',
  'supabaseOwnerAllowsFutureLocalValidation: true.',
  'globalGoForSUPABASE_SOUND_4: false.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'signed URLs are not source of truth;',
  'public URLs are blocked;',
  'public artifacts are blocked;',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'raw prompt execution is blocked;',
  'Supabase records must not store raw prompt execution payloads for workers;',
  '## Accepted By Supabase Owner',
  'future local SQL validation may be considered only in a local or throwaway non-production database;',
  'no production target is accepted;',
  'no live customer data is accepted;',
  'staging is not accepted without a later explicit staging approval;',
  'DB type regeneration remains blocked until a future accepted migration application in an approved environment;',
  '## Rejected Or Still Blocked By Supabase Owner',
  'production SQL validation;',
  'live Supabase mutation;',
  'active migration deployment;',
  'feature gate changes;',
  'tool capability seeding;',
  'worker runtime config creation;',
  'generated_local_fixture_passed claim.',
  '## Required Before SUPABASE-SOUND-4',
  'local or throwaway non-production environment target named;',
  'WORKER_RUNTIME_JOBS no-dispatch and raw prompt rejection acceptance captured;',
  'PROVIDER_GATEWAY_MODELS no-provider and credential exclusion acceptance captured;',
  '## Cross-owner Status',
  '## Go / No-go Result',
  'Local SQL validation must not run yet.',
  'generated_local_fixture_passed cannot be claimed.',
  '## Supabase Update Classification',
  'Supabase update required: no live update in this prompt.',
  'Supabase environment touched: none.',
  'SQL executed: no.',
  'Migration deployed: no.',
  'Rows created: no.',
  'Storage objects created: no.',
  'Signed URLs created: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(decisionDoc, required, `Decision doc must include ${required}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(decisionDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status:', `${owner} section must include status.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
}

requireText(
  ownerSection(decisionDoc, 'SUPABASE_RLS_STORAGE_DATABASE'),
  'status: accepted_conditionally.',
  'Supabase owner must be conditionally accepted.',
)

for (const owner of requiredOwners.filter((owner) => owner !== 'SUPABASE_RLS_STORAGE_DATABASE')) {
  requireText(ownerSection(decisionDoc, owner), 'status: missing.', `${owner} must remain missing.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3C Local SQL Validation Owner Approval Requests',
  'goForSUPABASE_SOUND_4: false.',
  'Local SQL validation cannot run yet.',
  'SUPABASE-SOUND-3D: Supabase owner approval decision for local SQL validation, no execution',
]) {
  requireText(approvalDoc, priorRequired, `Approval request doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3B Local SQL Validation Owner Evidence Packet',
  'goForSUPABASE_SOUND_4: false.',
  'SUPABASE-SOUND-4 local SQL validation is blocked.',
  'SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution',
]) {
  requireText(evidenceDoc, priorRequired, `Owner evidence packet must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3A Local SQL Validation Owner Acceptance Packet',
  'This packet is owner-acceptance-only.',
  'Acceptance status: not_accepted_for_execution.',
]) {
  requireText(ownerAcceptance, priorRequired, `Owner acceptance packet must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3 Local Fixture Validation Plan',
  'This document is a local validation plan only.',
  'These commands require SUPABASE_RLS_STORAGE_DATABASE owner acceptance before use.',
]) {
  requireText(validationPlan, priorRequired, `Validation plan must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-1 Local Fixture Mutation Plan',
  'This document is a mutation plan only.',
  'Signed URLs are not source of truth.',
]) {
  requireText(mutationPlan, priorRequired, `Mutation plan must still include ${priorRequired}.`)
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
  'Future local/staging validation must use mock IDs only.',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
]) {
  requireText(draftTests, draftTestRequired, `Draft tests must still include ${draftTestRequired}.`)
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must be ${scriptCommand}.`,
)

const decision = SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION

check(decision.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Decision workstream must be Supabase.')
check(decision.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Decision requesting workstream must be SOUND.')
check(decision.mode === 'supabase_owner_decision_only', 'Decision mode must be owner-decision-only.')
check(decision.currentUnlockStage === 'dry_run_passed', 'Current stage must remain dry_run_passed.')
check(
  decision.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target future stage must be generated_local_fixture_passed.',
)
check(decision.claimsGeneratedLocalFixturePassed === false, 'Decision must not claim generated_local_fixture_passed.')
check(
  decision.decision.supabaseOwnerDecision ===
    'conditional_supabase_owner_acceptance_for_future_local_sql_validation',
  'Supabase owner decision must be conditional acceptance.',
)
check(
  decision.decision.supabaseOwnerAllowsFutureLocalValidation === true,
  'Supabase owner should allow future local validation conditionally.',
)
check(decision.decision.globalGoForSUPABASE_SOUND_4 === false, 'Global go for SUPABASE-SOUND-4 must stay false.')
check(decision.decision.reasonGlobalGoBlocked.length >= 7, 'Decision must list cross-owner blockers.')
assertAllExecutionFlagsFalse(decision.execution, 'decision.execution')
check(decision.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(decision.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Source path must require private GCS path.')
check(decision.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(decision.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(decision.sourceOfTruthPath.requiresApprovedPlanSnapshot === true, 'Source path must require approved snapshot.')
check(decision.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
check(decision.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must not be allowed.')
check(decision.rawPromptRule.rawPromptDirectExecutionAllowed === false, 'Raw prompt execution must be blocked.')
check(decision.rawPromptRule.requiresStructuredAgentFindings === true, 'Structured findings must be required.')
check(decision.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(decision.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Approved snapshot must be required.')
check(decision.acceptedConditions.length >= 10, 'Accepted conditions must be populated.')
check(decision.rejectedOrStillBlocked.length >= 20, 'Rejected or blocked uses must be populated.')
check(decision.requiredBeforeSUPABASE_SOUND_4.length >= 10, 'SUPABASE-SOUND-4 requirements must be populated.')
check(
  decision.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Decision next prompt must be Worker Runtime.',
)

for (const owner of requiredOwners) {
  const entry = decision.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Decision must include cross-owner status for ${owner}.`)
  check((entry?.evidence.length ?? 0) > 0, `${owner} must include evidence.`)
  check((entry?.missingEvidence.length ?? 0) > 0, `${owner} must include missing evidence.`)
}

const supabaseEntry = decision.crossOwnerStatus.find((entry) => entry.owner === 'SUPABASE_RLS_STORAGE_DATABASE')
check(supabaseEntry?.status === 'accepted_conditionally', 'Supabase owner must be conditionally accepted.')

for (const owner of requiredOwners.filter((owner) => owner !== 'SUPABASE_RLS_STORAGE_DATABASE')) {
  const entry = decision.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'missing', `${owner} must remain missing.`)
}

check(
  SUPABASE_SOUND_LOCAL_SQL_APPROVAL_REQUESTS.goForSUPABASE_SOUND_4 === false,
  'Prior approval request spec must keep SUPABASE-SOUND-4 blocked.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE.goForSUPABASE_SOUND_4 === false,
  'Prior owner evidence spec must keep SUPABASE-SOUND-4 blocked.',
)

for (const source of [
  ['decisionDoc', decisionDoc],
  ['approvalDoc', approvalDoc],
  ['evidenceDoc', evidenceDoc],
  ['ownerAcceptance', ownerAcceptance],
  ['validationPlan', validationPlan],
  ['mutationPlan', mutationPlan],
  ['draftMigration', draftMigration],
  ['draftTests', draftTests],
] as const) {
  assertNoConcreteForbiddenText(source[1], source[0])
}

scanForbiddenValues(SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION, 'supabaseOwnerDecision')
scanForbiddenValues(SUPABASE_SOUND_LOCAL_SQL_APPROVAL_REQUESTS, 'approvalRequests')
scanForbiddenValues(SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE, 'ownerEvidence')

console.log(
  JSON.stringify(
    {
      ok: true,
      workstream: decision.workstream,
      requestingWorkstream: decision.requestingWorkstream,
      smoke: 'supabase-sound-local-sql-supabase-owner-decision',
      mode: decision.mode,
      claimsGeneratedLocalFixturePassed: decision.claimsGeneratedLocalFixturePassed,
      supabaseOwnerAllowsFutureLocalValidation:
        decision.decision.supabaseOwnerAllowsFutureLocalValidation,
      globalGoForSUPABASE_SOUND_4: decision.decision.globalGoForSUPABASE_SOUND_4,
      sqlExecuted: decision.execution.sqlExecuted,
      migrationDeployed: decision.execution.migrationDeployed,
      rowsCreated: decision.execution.rowsCreated,
      storageObjectsCreated: decision.execution.storageObjectsCreated,
      signedUrlsCreated: decision.execution.signedUrlsCreated,
      recommendedImmediateNextPrompt: decision.recommendedImmediateNextPrompt,
    },
    null,
    2,
  ),
)
