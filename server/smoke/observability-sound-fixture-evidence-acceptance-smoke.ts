import { existsSync, readFileSync } from 'node:fs'

import { OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE } from '../../src/backend/mock/mock-observability-sound-fixture-evidence-acceptance'
import { PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE } from '../../src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const auditDocPath = 'docs/observability-sound-fixture-evidence-audit.md'
const providerGatewayAuditDocPath = 'docs/provider-gateway-sound-fixture-boundary-audit.md'
const workerRuntimeAuditDocPath = 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md'
const supabaseDecisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const soundFixturePlanPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const soundOwnerChecklistPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:observability-sound-fixture-evidence-acceptance'
const scriptCommand = 'tsx server/smoke/observability-sound-fixture-evidence-acceptance-smoke.ts'
const recommendedImmediateNextPrompt = 'BILLING-SOUND-0: fixture credit placeholder acceptance audit'

const requiredOwners = [
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

const requiredEvidenceAreas = [
  'audio_qa_metadata',
  'speech_ducking_warnings',
  'no_random_sfx_policy',
  'sfx_usefulness_evidence',
  'music_over_voice_evidence',
  'loudness_expectation_metadata',
  'sync_timing_expectation_metadata',
  'naturalness_artifact_expectation_metadata',
  'provider_license_blocked_evidence',
  'worker_no_dispatch_evidence',
  'supabase_no_mutation_evidence',
  'storage_source_of_truth_evidence',
  'signed_url_rejection_evidence',
  'public_artifact_rejection_evidence',
  'generated_asset_rejection_evidence',
  'cost_placeholder_evidence',
  'billing_no_spend_evidence',
  'owner_decision_evidence',
  'rollback_cleanup_expectation_evidence',
  'advisor_output_capture_expectations',
  'no_beta_no_production_evidence',
] as const

const requiredEvidenceAreaDocText: Record<(typeof requiredEvidenceAreas)[number], string> = {
  audio_qa_metadata: 'audio QA metadata',
  speech_ducking_warnings: 'speech/ducking warnings',
  no_random_sfx_policy: 'no-random-SFX policy',
  sfx_usefulness_evidence: 'SFX usefulness evidence',
  music_over_voice_evidence: 'music-over-voice evidence',
  loudness_expectation_metadata: 'loudness expectation metadata',
  sync_timing_expectation_metadata: 'sync/timing expectation metadata',
  naturalness_artifact_expectation_metadata: 'naturalness/artifact expectation metadata',
  provider_license_blocked_evidence: 'provider/license blocked evidence',
  worker_no_dispatch_evidence: 'worker no-dispatch evidence',
  supabase_no_mutation_evidence: 'Supabase no-mutation evidence',
  storage_source_of_truth_evidence: 'storage/source-of-truth evidence',
  signed_url_rejection_evidence: 'signed URL rejection evidence',
  public_artifact_rejection_evidence: 'public artifact rejection evidence',
  generated_asset_rejection_evidence: 'generated asset rejection evidence',
  cost_placeholder_evidence: 'cost placeholder evidence',
  billing_no_spend_evidence: 'billing no-spend evidence',
  owner_decision_evidence: 'owner decision evidence',
  rollback_cleanup_expectation_evidence: 'rollback/cleanup expectation evidence',
  advisor_output_capture_expectations: 'advisor output capture expectations',
  no_beta_no_production_evidence: 'no-beta/no-production evidence',
}

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
  check(!lower.includes('raw_prompt'), `${label} must not contain raw prompt fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('rawworkerprompt'), `${label} must not contain raw worker prompt fields.`)
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

check(existsSync(auditDocPath), 'Observability fixture evidence audit document must exist.')
check(existsSync(providerGatewayAuditDocPath), 'Provider Gateway boundary audit document must exist.')
check(existsSync(workerRuntimeAuditDocPath), 'Worker Runtime audit document must exist.')
check(existsSync(supabaseDecisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(soundFixturePlanPath), 'SOUND generated/local fixture plan must exist.')
check(existsSync(soundOwnerChecklistPath), 'SOUND owner checklist must exist.')
check(existsSync(draftMigrationPath), 'SUPABASE-SOUND draft migration file must exist.')
check(existsSync(draftTestPath), 'SUPABASE-SOUND draft test file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const auditDoc = readFileSync(auditDocPath, 'utf8')
const providerGatewayAuditDoc = readFileSync(providerGatewayAuditDocPath, 'utf8')
const workerRuntimeAuditDoc = readFileSync(workerRuntimeAuditDocPath, 'utf8')
const supabaseDecisionDoc = readFileSync(supabaseDecisionDocPath, 'utf8')
const soundFixturePlan = readFileSync(soundFixturePlanPath, 'utf8')
const soundOwnerChecklist = readFileSync(soundOwnerChecklistPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# OBSERVABILITY-SOUND-0 QA / Audit / Cost Fixture Evidence Audit',
  'Workstream owner: OBSERVABILITY_AUDIT_COST',
  'Requesting workstream: SOUND_MUSIC_AUDIO',
  'Related source workstreams: SUPABASE_RLS_STORAGE_DATABASE, WORKER_RUNTIME_JOBS, PROVIDER_GATEWAY_MODELS',
  'Current SOUND stage: dry_run_passed',
  'Target future stage: generated_local_fixture_passed',
  'Decision: conditional_observability_acceptance_for_metadata_only_fixture_evidence',
  'This document is audit-only.',
  'This document does not create QA reports.',
  'This document does not create audit events.',
  'This document does not create cost records.',
  'This document does not mutate Supabase.',
  'This document does not run media analysis.',
  'This document does not run advisor commands.',
  'This document does not run FFmpeg.',
  'This document does not call providers.',
  'This document does not dispatch workers.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked because cross-owner approvals are incomplete.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  'OBSERVABILITY_AUDIT_COST conditionally accepts future SOUND local fixture evidence only as metadata/spec evidence expectations.',
  'observabilityAllowsMetadataOnlyEvidenceExpectations: true.',
  'observabilityAllowsPersistedEvidenceRows: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Accepted by Observability/Audit/Cost',
  'metadata-only QA evidence expectations',
  'metadata-only audit evidence expectations',
  'metadata-only cost placeholder expectations',
  'no persisted QA rows',
  'no audit event rows',
  'no cost rows',
  'no beta readiness claim',
  'no production readiness claim',
  'no silent acceptance',
  '## Rejected / still blocked by Observability/Audit/Cost',
  'persisted QA reports',
  'persisted audit events',
  'persisted cost rows',
  'generated_local_fixture_passed claim',
  '## Evidence readiness table',
  '## QA evidence format future requirements',
  'validatedNow: false',
  'persistedNow: false',
  '## Audit evidence format future requirements',
  'generated_local_fixture_passed claimed: false',
  '## Cost evidence format future requirements',
  'spendOccurred: false',
  'creditReserved: false',
  'refundOrReleaseOccurred: false',
  'billingOwnerRequired: true',
  '## Advisor / readiness evidence plan',
  'no advisor execution now.',
  '## Required before OBSERVABILITY-SOUND-1',
  'metadata-only QA evidence spec approved;',
  'metadata-only audit evidence spec approved;',
  'metadata-only cost placeholder spec approved;',
  'no-persisted-rows smoke;',
  'no-beta/no-production claim smoke;',
  'no-silent-acceptance smoke;',
  '## Cross-owner status after Observability decision',
  '## Go / no-go for SUPABASE-SOUND-4',
  'globalGoForSUPABASE_SOUND_4 remains false.',
  '## Runtime / provider / gate behavior',
  'QA report rows: false.',
  'audit event rows: false.',
  'cost rows: false.',
  'advisor commands: false.',
  'media analysis: false.',
  'FFmpeg: false.',
  'provider calls: false.',
  'worker dispatch: false.',
  'Supabase mutation: false.',
  'SQL execution: false.',
  'signed URLs: false.',
  'generated assets: false.',
  'credit rows: false.',
  '## Supabase update classification',
  'Supabase update required: no.',
  'Supabase environment touched: no.',
  'SQL executed: no.',
  'Migration deployed: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(auditDoc, required, `Audit doc must include ${required}.`)
}

for (const area of requiredEvidenceAreas) {
  requireText(auditDoc, requiredEvidenceAreaDocText[area], `Audit doc table must include ${area}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(auditDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status:', `${owner} section must include status.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
}

for (const owner of [
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
] as const) {
  requireText(ownerSection(auditDoc, owner), 'status: accepted_conditionally.', `${owner} must be accepted conditionally.`)
}

for (const owner of requiredOwners.filter((owner) => (
  owner !== 'OBSERVABILITY_AUDIT_COST'
  && owner !== 'PROVIDER_GATEWAY_MODELS'
  && owner !== 'WORKER_RUNTIME_JOBS'
  && owner !== 'SUPABASE_RLS_STORAGE_DATABASE'
))) {
  requireText(ownerSection(auditDoc, owner), 'status: missing.', `${owner} must remain missing.`)
}

for (const priorRequired of [
  '# PROVIDER-GATEWAY-SOUND-0 Provider / License Fixture Boundary Audit',
  'providerGatewayAllowsNoProviderLocalFixture: true.',
  'providerGatewayAllowsProviderCalls: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  'OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit',
]) {
  requireText(providerGatewayAuditDoc, priorRequired, `Provider Gateway audit doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# WORKER-RUNTIME-SOUND-0 Audio Fixture Payload Acceptance Audit',
  'workerRuntimeAllowsFuturePayloadShapeValidation: true.',
  'workerRuntimeAllowsDispatch: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(workerRuntimeAuditDoc, priorRequired, `Worker Runtime audit doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3D Supabase Owner Decision for Local SQL Validation',
  'supabaseOwnerAllowsFutureLocalValidation: true.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(supabaseDecisionDoc, priorRequired, `Supabase decision doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Generated/Local Fixture Plan',
  'QA, Observability, And Billing Rules',
  'This plan creates no QA row, no audit event, no cost record',
]) {
  requireText(soundFixturePlan, priorRequired, `SOUND fixture plan must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist',
  'OBSERVABILITY_AUDIT_COST',
  'QA, audit, cost placeholder requirements',
]) {
  requireText(soundOwnerChecklist, priorRequired, `SOUND owner checklist must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'qa_reports',
  'credit_estimates',
  'signed_url_events',
  'QA rows remain owner-gated',
]) {
  requireText(draftMigration, priorRequired, `Draft migration must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'signed_url_events are audit only',
  'credit rows are not required for local fixture until Billing accepts placeholder policy',
  'QA billing feature tool and worker config tables remain owner gated',
]) {
  requireText(draftTests, priorRequired, `Draft tests must still include ${priorRequired}.`)
}

const spec = OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE

check(spec.workstream === 'OBSERVABILITY_AUDIT_COST', 'Spec workstream must be Observability.')
check(spec.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Spec requesting workstream must be SOUND.')
check(
  spec.relatedSourceWorkstreams.includes('SUPABASE_RLS_STORAGE_DATABASE')
    && spec.relatedSourceWorkstreams.includes('WORKER_RUNTIME_JOBS')
    && spec.relatedSourceWorkstreams.includes('PROVIDER_GATEWAY_MODELS'),
  'Spec must include Supabase, Worker Runtime, and Provider Gateway related sources.',
)
check(spec.mode === 'observability_fixture_evidence_audit_only', 'Spec mode must be audit only.')
check(spec.currentUnlockStage === 'dry_run_passed', 'Spec current stage must be dry_run_passed.')
check(
  spec.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Spec target stage must be generated_local_fixture_passed.',
)
check(spec.claimsGeneratedLocalFixturePassed === false, 'Spec must not claim generated_local_fixture_passed.')
check(
  spec.decision.observabilityDecision === 'conditional_observability_acceptance_for_metadata_only_fixture_evidence',
  'Observability decision must be conditional metadata-only evidence acceptance.',
)
check(
  spec.decision.observabilityAllowsMetadataOnlyEvidenceExpectations === true,
  'Observability must allow metadata-only evidence expectations.',
)
check(
  spec.decision.observabilityAllowsPersistedEvidenceRows === false,
  'Observability must not allow persisted evidence rows.',
)
check(spec.decision.globalGoForSUPABASE_SOUND_4 === false, 'Global go must remain false.')
check(spec.decision.reasonGlobalGoBlocked.length > 0, 'Global go block reasons must be present.')
assertAllExecutionFlagsFalse(spec.execution, 'observabilitySpec.execution')
check(spec.acceptedConditions.length > 0, 'Accepted conditions must exist.')
check(spec.rejectedOrStillBlocked.length > 0, 'Rejected/still blocked uses must exist.')

for (const area of requiredEvidenceAreas) {
  const row = spec.evidenceReadiness.find((entry) => entry.area === area)
  check(Boolean(row), `Spec evidence readiness must include ${area}.`)
  check(row?.metadataOnlyAcceptedNow === true, `${area} must be metadata-only accepted now.`)
  check(row?.persistedEvidenceAllowedNow === false, `${area} must not allow persisted evidence now.`)
  check(row?.requiredBeforeGeneratedLocalFixturePassed === true, `${area} must be required before target stage.`)
}

check(spec.qaEvidenceFormatExpectation.persistedNow === false, 'QA evidence must not persist now.')
check(spec.qaEvidenceFormatExpectation.validatedNow === false, 'QA evidence must not validate now.')
check(spec.auditEvidenceFormatExpectation.persistedNow === false, 'Audit evidence must not persist now.')
check(
  spec.auditEvidenceFormatExpectation.claimsGeneratedLocalFixturePassed === false,
  'Audit evidence must not claim generated_local_fixture_passed.',
)
check(spec.costEvidenceFormatExpectation.persistedNow === false, 'Cost evidence must not persist now.')
check(spec.costEvidenceFormatExpectation.estimatedCostRecordedNow === false, 'Cost estimate must not be recorded now.')
check(spec.costEvidenceFormatExpectation.spendOccurred === false, 'Spend must not occur.')
check(spec.costEvidenceFormatExpectation.creditReserved === false, 'Credit reservation must not occur.')
check(spec.costEvidenceFormatExpectation.refundOrReleaseOccurred === false, 'Refund/release must not occur.')
check(spec.costEvidenceFormatExpectation.billingOwnerRequired === true, 'Billing owner must be required.')

check(spec.advisorReadinessPlan.advisorCommandsRunNow === false, 'Advisor commands must not run now.')
check(
  spec.advisorReadinessPlan.securityAdvisorOutputCaptureLater === true
    && spec.advisorReadinessPlan.performanceAdvisorOutputCaptureLater === true
    && spec.advisorReadinessPlan.rlsNoPolicyFindingsCaptureLater === true
    && spec.advisorReadinessPlan.mutableSearchPathFindingsCaptureLater === true
    && spec.advisorReadinessPlan.securityDefinerFindingsCaptureLater === true
    && spec.advisorReadinessPlan.unindexedFkFindingsCaptureLater === true
    && spec.advisorReadinessPlan.storagePolicyFindingsCaptureLater === true,
  'Advisor readiness plan must defer all required captures.',
)
check(
  spec.requiredBeforeOBSERVABILITY_SOUND_1.length >= 10,
  'Required before OBSERVABILITY-SOUND-1 list must be populated.',
)
check(spec.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(spec.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Source path must require private GCS path.')
check(spec.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(spec.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(
  spec.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source path must require approved plan snapshot.',
)
check(
  spec.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(spec.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')
check(spec.rawPromptRule.rawPromptDirectExecutionAllowed === false, 'Raw prompt direct execution must be blocked.')
check(spec.rawPromptRule.requiresStructuredAgentFindings === true, 'Raw prompt rule must require structured findings.')
check(spec.rawPromptRule.requiresEditIntents === true, 'Raw prompt rule must require edit intents.')
check(spec.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Raw prompt rule must require approved snapshots.')
check(spec.crossOwnerStatus.length === requiredOwners.length, 'Spec must include all owner statuses.')

for (const owner of requiredOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Spec owner status missing: ${owner}.`)
  check((entry?.evidence.length ?? 0) > 0, `${owner} evidence must be present.`)
  check((entry?.missingEvidence.length ?? 0) > 0, `${owner} missing evidence must be present.`)
}

for (const owner of [
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
] as const) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'accepted_conditionally', `${owner} must be accepted conditionally in spec.`)
}

for (const owner of requiredOwners.filter((owner) => (
  owner !== 'OBSERVABILITY_AUDIT_COST'
  && owner !== 'PROVIDER_GATEWAY_MODELS'
  && owner !== 'WORKER_RUNTIME_JOBS'
  && owner !== 'SUPABASE_RLS_STORAGE_DATABASE'
))) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'missing', `${owner} must remain missing in spec.`)
}

check(
  spec.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Spec must recommend BILLING-SOUND-0 next.',
)
check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  'package.json must include the Observability fixture evidence smoke script.',
)

check(
  PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.decision.providerGatewayAllowsNoProviderLocalFixture === true,
  'Provider Gateway prior decision must still allow no-provider local fixture metadata/spec validation conditionally.',
)
check(
  PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.decision.providerGatewayAllowsProviderCalls === false,
  'Provider Gateway prior decision must keep provider calls false.',
)
check(
  PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Provider Gateway prior decision must keep global go false.',
)
assertAllExecutionFlagsFalse(
  PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.execution,
  'providerGatewayAcceptance.execution',
)
check(
  WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.decision
    .workerRuntimeAllowsFuturePayloadShapeValidation === true,
  'Worker Runtime prior decision must allow future payload-shape validation conditionally.',
)
check(
  WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.decision.workerRuntimeAllowsDispatch === false,
  'Worker Runtime prior decision must keep dispatch false.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.supabaseOwnerAllowsFutureLocalValidation === true,
  'Supabase prior decision must allow future local validation conditionally.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Supabase prior decision must keep global go false.',
)

assertNoConcreteForbiddenText(auditDoc, auditDocPath)
scanForbiddenValues(spec, 'OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE')

console.log(JSON.stringify({
  ok: true,
  workstream: spec.workstream,
  requestingWorkstream: spec.requestingWorkstream,
  smoke: 'observability-sound-fixture-evidence-acceptance',
  mode: spec.mode,
  claimsGeneratedLocalFixturePassed: spec.claimsGeneratedLocalFixturePassed,
  observabilityAllowsMetadataOnlyEvidenceExpectations:
    spec.decision.observabilityAllowsMetadataOnlyEvidenceExpectations,
  observabilityAllowsPersistedEvidenceRows: spec.decision.observabilityAllowsPersistedEvidenceRows,
  globalGoForSUPABASE_SOUND_4: spec.decision.globalGoForSUPABASE_SOUND_4,
  qaReportsCreated: spec.execution.qaReportsCreated,
  auditEventsCreated: spec.execution.auditEventsCreated,
  costRowsCreated: spec.execution.costRowsCreated,
  advisorCommandsRun: spec.execution.advisorCommandsRun,
  mediaAnalysisRun: spec.execution.mediaAnalysisRun,
  ffmpegRun: spec.execution.ffmpegRun,
  recommendedImmediateNextPrompt: spec.recommendedImmediateNextPrompt,
}, null, 2))
