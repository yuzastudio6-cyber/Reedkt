import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_LOCAL_SQL_APPROVAL_REQUESTS } from '../../src/backend/mock/mock-supabase-sound-local-sql-approval-requests'
import { SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE } from '../../src/backend/mock/mock-supabase-sound-local-sql-owner-evidence'

const approvalDocPath = 'docs/supabase-sound-local-sql-validation-owner-approval-requests.md'
const evidenceDocPath = 'docs/supabase-sound-local-sql-validation-owner-evidence.md'
const ownerAcceptancePath = 'docs/supabase-sound-local-sql-validation-owner-acceptance.md'
const validationPlanPath = 'docs/supabase-sound-local-fixture-validation-plan.md'
const mutationPlanPath = 'docs/supabase-sound-local-fixture-mutation-plan.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-sql-approval-requests'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-sql-approval-requests-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-3D: Supabase owner approval decision for local SQL validation, no execution'

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

check(existsSync(approvalDocPath), 'Approval request document must exist.')
check(existsSync(evidenceDocPath), 'Owner evidence document must exist.')
check(existsSync(ownerAcceptancePath), 'Owner acceptance packet must exist.')
check(existsSync(validationPlanPath), 'Local validation plan must exist.')
check(existsSync(mutationPlanPath), 'Mutation plan must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

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
  '# SUPABASE-SOUND-3C Local SQL Validation Owner Approval Requests',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'This document is approval-request-only.',
  'This document does not execute SQL.',
  'This document does not run migrations.',
  'This document does not deploy migrations.',
  'This document does not create rows.',
  'This document does not create storage buckets or objects.',
  'This document does not create signed URLs.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains blocked until owner approvals are complete.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'signed URLs are not source of truth;',
  'public URLs are blocked;',
  'public artifacts are blocked;',
  'source media must remain immutable;',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'raw prompt execution is blocked;',
  'Supabase records must not store raw prompt execution payloads for workers.',
  'goForSUPABASE_SOUND_4: false.',
  'Reason: missing owner acceptance evidence.',
  'Local SQL validation cannot run yet.',
  'generated_local_fixture_passed cannot be claimed.',
  '## Approval requests by owner',
  '## Aggregate missing evidence',
  '## SUPABASE-SOUND-4 status',
  'SUPABASE-SOUND-4 is blocked.',
  'Do not run local SQL validation yet.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(approvalDoc, required, `Approval request doc must include ${required}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(approvalDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} must include owner field.`)
  requireText(section, 'currentStatus:', `${owner} must include currentStatus.`)
  requireText(section, 'approvalRequest:', `${owner} must include approvalRequest.`)
  requireText(section, 'evidenceNeeded:', `${owner} must include evidenceNeeded.`)
  requireText(section, 'forbiddenBypasses:', `${owner} must include forbiddenBypasses.`)
  requireText(section, 'requestedResponseFormat:', `${owner} must include requestedResponseFormat.`)
  requireText(section, 'nextOwnerPrompt:', `${owner} must include nextOwnerPrompt.`)
}

for (const expected of [
  'SUPABASE-SOUND-3D: Supabase owner approval decision for local SQL validation, no execution',
  'SOUND-SUPABASE-ACCEPT-0: approve local SQL validation scope for SOUND fixture records, no execution',
  'WORKER-RUNTIME-SOUND-0: audio fixture payload acceptance audit',
  'PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit',
  'OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit',
  'BILLING-SOUND-0: fixture credit placeholder acceptance audit',
  'TRACK-A-SOUND-0: audio fixture final composition handoff audit',
  'TRACK-B-SOUND-0: audio fixture media processing handoff audit',
]) {
  requireText(approvalDoc, expected, `Approval request doc must include next prompt: ${expected}`)
}

for (const missingEvidence of [
  'Supabase local target approval',
  'Supabase no-production/no-live-data proof',
  'Supabase rollback/cleanup approval',
  'Worker Runtime no-dispatch acceptance',
  'Provider Gateway no-provider acceptance',
  'Observability evidence-capture acceptance',
  'Billing no-spend acceptance',
  'Track A no-export acceptance',
  'Track B no-processing acceptance',
  'SOUND scope acceptance for local SQL validation',
]) {
  requireText(approvalDoc, missingEvidence, `Approval request doc must include aggregate missing evidence: ${missingEvidence}`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3B Local SQL Validation Owner Evidence Packet',
  'goForSUPABASE_SOUND_4: false.',
  'SUPABASE-SOUND-4 local SQL validation is blocked.',
  'SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution',
]) {
  requireText(evidenceDoc, priorRequired, `Owner evidence packet must still include ${priorRequired}.`)
}

for (const ownerAcceptanceRequired of [
  '# SUPABASE-SOUND-3A Local SQL Validation Owner Acceptance Packet',
  'This packet is owner-acceptance-only.',
  'Acceptance status: not_accepted_for_execution.',
]) {
  requireText(ownerAcceptance, ownerAcceptanceRequired, `Owner acceptance packet must still include ${ownerAcceptanceRequired}.`)
}

for (const validationPlanRequired of [
  '# SUPABASE-SOUND-3 Local Fixture Validation Plan',
  'This document is a local validation plan only.',
  'These commands require SUPABASE_RLS_STORAGE_DATABASE owner acceptance before use.',
]) {
  requireText(validationPlan, validationPlanRequired, `Validation plan must still include ${validationPlanRequired}.`)
}

for (const mutationPlanRequired of [
  '# SUPABASE-SOUND-1 Local Fixture Mutation Plan',
  'This document is a mutation plan only.',
  'Signed URLs are not source of truth.',
]) {
  requireText(mutationPlan, mutationPlanRequired, `Mutation plan must still include ${mutationPlanRequired}.`)
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

const approvalRequests = SUPABASE_SOUND_LOCAL_SQL_APPROVAL_REQUESTS
check(approvalRequests.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Approval request spec must be Supabase-owned.')
check(approvalRequests.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Approval request spec must request SOUND_MUSIC_AUDIO.')
check(approvalRequests.mode === 'owner_approval_requests_only', 'Approval request spec mode must be owner_approval_requests_only.')
check(approvalRequests.currentUnlockStage === 'dry_run_passed', 'Current stage must remain dry_run_passed.')
check(
  approvalRequests.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target future stage must be generated_local_fixture_passed.',
)
check(
  approvalRequests.claimsGeneratedLocalFixturePassed === false,
  'Approval request spec must not claim generated local fixture passed.',
)
check(approvalRequests.goForSUPABASE_SOUND_4 === false, 'Approval request spec must not approve SUPABASE-SOUND-4.')

for (const [key, value] of Object.entries(approvalRequests.execution)) {
  check(value === false, `Execution flag must remain false: ${key}`)
}

check(approvalRequests.sourceOfTruthPath.requiresSupabaseRow === true, 'Source-of-truth path must require Supabase row.')
check(
  approvalRequests.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source-of-truth path must require private GCS path.',
)
check(approvalRequests.sourceOfTruthPath.requiresManifest === true, 'Source-of-truth path must require manifest.')
check(approvalRequests.sourceOfTruthPath.requiresChecksum === true, 'Source-of-truth path must require checksum.')
check(
  approvalRequests.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved snapshot.',
)
check(
  approvalRequests.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(approvalRequests.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')

check(
  approvalRequests.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt execution must remain blocked.',
)
check(
  approvalRequests.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(approvalRequests.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(
  approvalRequests.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved snapshots must be required.',
)

check(approvalRequests.approvalRequests.length === requiredOwners.length, 'Approval request spec must include all owners.')
for (const owner of requiredOwners) {
  const entry = approvalRequests.approvalRequests.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Approval request spec owner missing: ${owner}`)
  if (!entry) continue
  check(entry.currentStatus.length > 0, `${owner} currentStatus must be non-empty.`)
  check(entry.approvalRequest.length > 0, `${owner} approvalRequest must be non-empty.`)
  check(entry.evidenceNeeded.length > 0, `${owner} evidenceNeeded must be non-empty.`)
  check(entry.forbiddenBypasses.length > 0, `${owner} forbiddenBypasses must be non-empty.`)
  check(entry.requestedResponseFormat.length > 0, `${owner} requestedResponseFormat must be non-empty.`)
  check(entry.nextOwnerPrompt.length > 0, `${owner} nextOwnerPrompt must be non-empty.`)
}

for (const missingEvidence of [
  'Supabase local target approval',
  'Supabase no-production/no-live-data proof',
  'Supabase rollback/cleanup approval',
  'Worker Runtime no-dispatch acceptance',
  'Provider Gateway no-provider acceptance',
  'Observability evidence-capture acceptance',
  'Billing no-spend acceptance',
  'Track A no-export acceptance',
  'Track B no-processing acceptance',
  'SOUND scope acceptance for local SQL validation',
]) {
  check(
    approvalRequests.aggregateMissingEvidence.includes(missingEvidence),
    `Approval request spec must include aggregate missing evidence: ${missingEvidence}`,
  )
}

check(
  approvalRequests.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Approval request spec must point at SUPABASE-SOUND-3D.',
)

check(
  SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE.goForSUPABASE_SOUND_4 === false,
  'Prior evidence spec must keep SUPABASE-SOUND-4 blocked.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE.recommendedImmediateNextPrompt ===
    'SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution',
  'Prior evidence spec must still point to SUPABASE-SOUND-3C.',
)

assertNoConcreteForbiddenText(approvalDoc, 'Approval request doc')
assertNoConcreteForbiddenText(evidenceDoc, 'Owner evidence doc')
assertNoConcreteForbiddenText(ownerAcceptance, 'Owner acceptance packet')
assertNoConcreteForbiddenText(validationPlan, 'Validation plan')
assertNoConcreteForbiddenText(mutationPlan, 'Mutation plan')
assertNoConcreteForbiddenText(draftMigration, 'Draft migration')
assertNoConcreteForbiddenText(draftTests, 'Draft tests')
scanForbiddenValues(approvalRequests, 'SUPABASE_SOUND_LOCAL_SQL_APPROVAL_REQUESTS')

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must point at the approval request smoke.`,
)

console.log(JSON.stringify({
  ok: true,
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'supabase-sound-local-sql-approval-requests',
  mode: 'owner_approval_requests_only',
  claimsGeneratedLocalFixturePassed: false,
  goForSUPABASE_SOUND_4: false,
  sqlExecuted: false,
  migrationDeployed: false,
  rowsCreated: false,
  storageObjectsCreated: false,
  signedUrlsCreated: false,
  approvalRequestCount: requiredOwners.length,
  recommendedImmediateNextPrompt,
}, null, 2))
