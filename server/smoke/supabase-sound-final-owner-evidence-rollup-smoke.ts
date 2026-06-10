import { existsSync, readFileSync } from 'node:fs'

import { BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE } from '../../src/backend/mock/mock-billing-sound-fixture-credit-placeholder-acceptance'
import { OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE } from '../../src/backend/mock/mock-observability-sound-fixture-evidence-acceptance'
import { PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE } from '../../src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance'
import { SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE } from '../../src/backend/mock/mock-sound-supabase-local-sql-scope-acceptance'
import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE } from '../../src/backend/mock/mock-track-a-sound-final-composition-handoff-acceptance'
import { TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE } from '../../src/backend/mock/mock-track-b-sound-media-processing-handoff-acceptance'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const rollupDocPath = 'docs/supabase-sound-final-owner-evidence-rollup.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const scriptName = 'smoke:supabase-sound-final-owner-evidence-rollup'
const scriptCommand = 'tsx server/smoke/supabase-sound-final-owner-evidence-rollup-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4: run draft migration validation in approved local throwaway database, no deploy'

const ownerSpecs = {
  SOUND_MUSIC_AUDIO: SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE,
  SUPABASE_RLS_STORAGE_DATABASE: SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION,
  WORKER_RUNTIME_JOBS: WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE,
  PROVIDER_GATEWAY_MODELS: PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE,
  OBSERVABILITY_AUDIT_COST: OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE,
  BILLING_STRIPE_CREDITS: BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE,
  TRACK_A_RENDER_EXPORT: TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE,
  TRACK_B_MEDIA_PROCESSING: TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE,
} as const

const requiredOwners = Object.keys(ownerSpecs) as Array<keyof typeof ownerSpecs>

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
  check(!lower.includes('providercredential'), `${label} must not contain provider credential markers.`)
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('raw_prompt'), `${label} must not contain raw prompt fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('sqlpayload'), `${label} must not contain SQL payload markers.`)
  check(!lower.includes('workerexecutionpayload'), `${label} must not contain worker execution payload markers.`)
  check(!lower.includes('providerexecutionpayload'), `${label} must not contain provider execution payload markers.`)
  check(!lower.includes('rowscreated: true'), `${label} must not contain row mutation markers.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('supabasemutationperformed: true'), `${label} must not contain mutation markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function assertNoConcreteSecretsOrUrls(source: string, label: string): void {
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
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
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

function assertAllExecutionFlagsFalse(flags: Record<string, boolean>, label: string): void {
  for (const [key, value] of Object.entries(flags)) {
    check(value === false, `${label}.${key} must be false.`)
  }
}

check(existsSync(rollupDocPath), 'Final owner evidence rollup document must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const rollupDoc = readFileSync(rollupDocPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const entry of SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.ownerEvidence) {
  check(existsSync(entry.evidenceDoc), `${entry.owner} evidence doc must exist: ${entry.evidenceDoc}`)
  check(existsSync(entry.specFile), `${entry.owner} spec file must exist: ${entry.specFile}`)
  check(existsSync(entry.smokeFile), `${entry.owner} smoke file must exist: ${entry.smokeFile}`)
}

for (const required of [
  '# SUPABASE-SOUND-3E Final Owner Evidence Rollup',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'This document is rollup-only.',
  'This document does not execute SQL.',
  'This document does not mutate Supabase.',
  'This document does not deploy migrations.',
  'This document does not create rows.',
  'This document does not create storage buckets or objects.',
  'This document does not create signed URLs.',
  'This document does not call providers.',
  'This document does not dispatch workers.',
  'This document does not unlock generated_local_fixture_passed.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'signed URLs are not source of truth;',
  'public URLs are blocked;',
  'public artifacts are blocked.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'raw prompt execution is blocked;',
  'goForSUPABASE_SOUND_4_PROPOSAL: true.',
  'goForSUPABASE_SOUND_4_EXECUTION_NOW: false.',
  'generatedLocalFixturePassedClaimed: false.',
  'A future SUPABASE-SOUND-4 prompt may be drafted.',
  'SUPABASE-SOUND-4 must still be local/throwaway/non-production only.',
  'SUPABASE-SOUND-4 must still be no-deploy.',
  'SUPABASE-SOUND-4 must not use live customer data.',
  'SUPABASE-SOUND-4 must not call providers.',
  'SUPABASE-SOUND-4 must not dispatch workers.',
  'SUPABASE-SOUND-4 must not create signed URLs.',
  'SUPABASE-SOUND-4 must not claim generated_local_fixture_passed.',
  '## SUPABASE-SOUND-4 allowed future scope',
  'validate draft migration SQL in an approved local throwaway database;',
  'validate draft RLS/storage test SQL in an approved local throwaway database;',
  'use mock IDs and mock fixture rows only;',
  'record validation output only.',
  '## SUPABASE-SOUND-4 forbidden scope',
  'production Supabase;',
  'active migration deployment;',
  'real Supabase mutation;',
  'provider calls;',
  'worker dispatch;',
  'media processing;',
  'beta, external beta, production, or paid production unlock.',
  '## Preconditions for future SUPABASE-SOUND-4 prompt',
  'final owner evidence rollup smoke passed;',
  'local throwaway target identified in the prompt;',
  'generated_local_fixture_passed not claimed.',
  '## Runtime gate behavior',
  'SQL execution: false.',
  'Supabase mutation: false.',
  'provider calls: false.',
  'worker dispatch: false.',
  'generated audio creation: false.',
  'generated asset creation: false.',
  'media processing: false.',
  'render: false.',
  'export: false.',
  '## Supabase update classification',
  'Supabase update required: no.',
  'Supabase environment touched: no.',
  'SQL executed: no.',
  'Migration deployed: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(rollupDoc, required, `Rollup doc must include ${required}.`)
}

for (const owner of requiredOwners) {
  const ownerEntry = SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.ownerEvidence.find(
    (entry) => entry.owner === owner,
  )
  check(ownerEntry !== undefined, `Rollup spec must include owner ${owner}.`)
  check(ownerEntry.conditionalNoExecutionAcceptance === true, `${owner} must be conditionally accepted.`)
  check(ownerEntry.executionAllowedNow === false, `${owner} execution must remain blocked.`)
  check(ownerEntry.sufficientForSUPABASE_SOUND_4Proposal === true, `${owner} must be sufficient for proposal.`)
  check(ownerEntry.evidenceDoc.length > 0, `${owner} evidence doc path must be present.`)
  check(ownerEntry.specFile.length > 0, `${owner} spec path must be present.`)
  check(ownerEntry.smokeFile.length > 0, `${owner} smoke path must be present.`)
  check(ownerEntry.decision.length > 0, `${owner} decision must be present.`)

  requireText(rollupDoc, owner, `Rollup doc table must include owner ${owner}.`)
  requireText(rollupDoc, ownerEntry.evidenceDoc, `Rollup doc must include evidence doc for ${owner}.`)
  requireText(rollupDoc, ownerEntry.specFile, `Rollup doc must include spec file for ${owner}.`)
  requireText(rollupDoc, ownerEntry.smokeFile, `Rollup doc must include smoke file for ${owner}.`)
  requireText(rollupDoc, ownerEntry.decision, `Rollup doc must include decision for ${owner}.`)
}

check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.workstream === 'SUPABASE_RLS_STORAGE_DATABASE',
  'Rollup workstream must be Supabase.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.requestingWorkstream === 'SOUND_MUSIC_AUDIO',
  'Rollup requesting workstream must be SOUND.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.mode === 'final_owner_evidence_rollup_only',
  'Rollup mode must be final owner evidence rollup only.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.claimsGeneratedLocalFixturePassed === false,
  'Rollup must not claim generated_local_fixture_passed.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_PROPOSAL === true,
  'SUPABASE-SOUND-4 proposal should be allowed.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW === false,
  'SUPABASE-SOUND-4 execution must not be allowed now.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.generatedLocalFixturePassedClaimed === false,
  'generated_local_fixture_passed must not be claimed.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended immediate next prompt must match.',
)

assertAllExecutionFlagsFalse(SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.execution, 'rollup.execution')

const scope = SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.futureSUPABASE_SOUND_4Scope
check(scope.localThrowawayOnly === true, 'Future scope must be local throwaway only.')
check(scope.noDeploy === true, 'Future scope must be no deploy.')
check(scope.noProduction === true, 'Future scope must be no production.')
check(scope.noStagingUnlessSeparatelyApproved === true, 'Future scope must block staging unless separately approved.')
check(scope.noLiveCustomerData === true, 'Future scope must block live customer data.')
check(scope.draftSqlValidationOnly === true, 'Future scope must be draft SQL validation only.')
check(scope.draftRlsStorageTestValidationOnly === true, 'Future scope must be draft RLS/storage test validation only.')
check(scope.noProviderCalls === true, 'Future scope must block provider calls.')
check(scope.noWorkerDispatch === true, 'Future scope must block worker dispatch.')
check(scope.noSignedUrls === true, 'Future scope must block signed URLs.')
check(scope.noPublicArtifacts === true, 'Future scope must block public artifacts.')
check(scope.noGeneratedAudioOrAssets === true, 'Future scope must block generated audio/assets.')
check(scope.noCreditSpendOrReservation === true, 'Future scope must block credit spend/reservation.')
check(scope.noRenderExport === true, 'Future scope must block render/export.')
check(scope.claimsGeneratedLocalFixturePassed === false, 'Future scope must not claim generated_local_fixture_passed.')

check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.sourceOfTruthPath.requiresSupabaseRow === true,
  'Source-of-truth path must require Supabase row.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source-of-truth path must require private GCS path.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.sourceOfTruthPath.requiresManifest === true,
  'Source-of-truth path must require manifest.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.sourceOfTruthPath.requiresChecksum === true,
  'Source-of-truth path must require checksum.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved plan snapshot.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.sourceOfTruthPath.publicUrlsAllowed === false,
  'Public URLs must remain blocked.',
)

check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must be blocked.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.rawPromptRule.requiresEditIntents === true,
  'Edit intents must be required.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshot must be required.',
)

assertAllExecutionFlagsFalse(SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.execution, 'soundScope.execution')
assertAllExecutionFlagsFalse(SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.execution, 'supabaseDecision.execution')
assertAllExecutionFlagsFalse(WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.execution, 'workerRuntime.execution')
assertAllExecutionFlagsFalse(PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.execution, 'providerGateway.execution')
assertAllExecutionFlagsFalse(OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE.execution, 'observability.execution')
assertAllExecutionFlagsFalse(BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE.execution, 'billing.execution')
assertAllExecutionFlagsFalse(TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE.execution, 'trackA.execution')
assertAllExecutionFlagsFalse(TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE.execution, 'trackB.execution')

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

assertNoConcreteForbiddenText(rollupDoc, 'rollupDoc')
scanForbiddenValues(SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP, 'SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP')
assertNoConcreteSecretsOrUrls(draftMigration, 'draftMigration')
assertNoConcreteSecretsOrUrls(draftTests, 'draftTests')

console.log(JSON.stringify({
  ok: true,
  workstream: SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.workstream,
  requestingWorkstream: SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.requestingWorkstream,
  smoke: 'supabase-sound-final-owner-evidence-rollup',
  mode: SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.mode,
  goForSUPABASE_SOUND_4_PROPOSAL:
    SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_PROPOSAL,
  goForSUPABASE_SOUND_4_EXECUTION_NOW:
    SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW,
  claimsGeneratedLocalFixturePassed:
    SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.claimsGeneratedLocalFixturePassed,
  sqlExecuted: SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.execution.sqlExecuted,
  migrationDeployed: SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.execution.migrationDeployed,
  supabaseMutationPerformed:
    SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.execution.supabaseMutationPerformed,
  recommendedImmediateNextPrompt:
    SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.recommendedImmediateNextPrompt,
}))
