import { existsSync, readFileSync } from 'node:fs'

import { BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE } from '../../src/backend/mock/mock-billing-sound-fixture-credit-placeholder-acceptance'
import { OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE } from '../../src/backend/mock/mock-observability-sound-fixture-evidence-acceptance'
import { PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE } from '../../src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const billingDocPath = 'docs/billing-sound-fixture-credit-placeholder-audit.md'
const observabilityDocPath = 'docs/observability-sound-fixture-evidence-audit.md'
const providerGatewayDocPath = 'docs/provider-gateway-sound-fixture-boundary-audit.md'
const workerRuntimeDocPath = 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md'
const supabaseDecisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const soundFixturePlanPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const soundOwnerChecklistPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const creditRuntimeGatePath = 'docs/credit-runtime-approval-gate.md'
const creditReservationFlowPath = 'docs/credit-reservation-spend-refund-flow.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:billing-sound-fixture-credit-placeholder-acceptance'
const scriptCommand = 'tsx server/smoke/billing-sound-fixture-credit-placeholder-acceptance-smoke.ts'
const recommendedImmediateNextPrompt = 'TRACK-A-SOUND-0: audio fixture final composition handoff audit'

const requiredOwners = [
  'BILLING_STRIPE_CREDITS',
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

const acceptedOwners = [
  'BILLING_STRIPE_CREDITS',
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
] as const

const missingOwners = [
  'SOUND_MUSIC_AUDIO',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

const requiredCreditAreas = [
  'no_credit_estimate_row',
  'no_credit_approval_row',
  'no_credit_reservation_row',
  'no_spend',
  'no_refund',
  'no_release',
  'no_stripe_call',
  'no_payment_object',
  'metadata_only_cost_placeholder',
  'provider_cost_placeholder',
  'worker_cost_placeholder',
  'generated_asset_cost_placeholder',
  'audit_cost_evidence_link',
  'rollback_refund_release_future_requirement',
  'no_beta_no_production_evidence',
] as const

const requiredCreditAreaDocText: Record<(typeof requiredCreditAreas)[number], string> = {
  no_credit_estimate_row: 'no credit estimate row',
  no_credit_approval_row: 'no credit approval row',
  no_credit_reservation_row: 'no credit reservation row',
  no_spend: 'no spend',
  no_refund: 'no refund',
  no_release: 'no release',
  no_stripe_call: 'no Stripe call',
  no_payment_object: 'no payment object',
  metadata_only_cost_placeholder: 'metadata-only cost placeholder',
  provider_cost_placeholder: 'provider cost placeholder',
  worker_cost_placeholder: 'worker cost placeholder',
  generated_asset_cost_placeholder: 'generated asset cost placeholder',
  audit_cost_evidence_link: 'audit/cost evidence link',
  rollback_refund_release_future_requirement: 'rollback/refund/release future requirement',
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
  check(!lower.includes('stripe_secret'), `${label} must not contain Stripe secret fields.`)
  check(!lower.includes('payment_token'), `${label} must not contain payment token fields.`)
  check(!lower.includes('paymenttoken'), `${label} must not contain payment token fields.`)
  check(!lower.includes('rowscreated: true'), `${label} must not contain row mutation markers.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk_(live|test)_[a-z0-9]{12,}/i.test(source), `${label} must not contain Stripe secret key shapes.`)
  check(!/pk_(live|test)_[a-z0-9]{12,}/i.test(source), `${label} must not contain Stripe publishable key shapes.`)
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

check(existsSync(billingDocPath), 'Billing fixture credit placeholder audit document must exist.')
check(existsSync(observabilityDocPath), 'Observability fixture evidence audit document must exist.')
check(existsSync(providerGatewayDocPath), 'Provider Gateway boundary audit document must exist.')
check(existsSync(workerRuntimeDocPath), 'Worker Runtime audit document must exist.')
check(existsSync(supabaseDecisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(soundFixturePlanPath), 'SOUND generated/local fixture plan must exist.')
check(existsSync(soundOwnerChecklistPath), 'SOUND owner checklist must exist.')
check(existsSync(creditRuntimeGatePath), 'Credit runtime approval gate doc must exist.')
check(existsSync(creditReservationFlowPath), 'Credit reservation flow doc must exist.')
check(existsSync(draftMigrationPath), 'SUPABASE-SOUND draft migration file must exist.')
check(existsSync(draftTestPath), 'SUPABASE-SOUND draft test file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const billingDoc = readFileSync(billingDocPath, 'utf8')
const observabilityDoc = readFileSync(observabilityDocPath, 'utf8')
const providerGatewayDoc = readFileSync(providerGatewayDocPath, 'utf8')
const workerRuntimeDoc = readFileSync(workerRuntimeDocPath, 'utf8')
const supabaseDecisionDoc = readFileSync(supabaseDecisionDocPath, 'utf8')
const soundFixturePlan = readFileSync(soundFixturePlanPath, 'utf8')
const soundOwnerChecklist = readFileSync(soundOwnerChecklistPath, 'utf8')
const creditRuntimeGate = readFileSync(creditRuntimeGatePath, 'utf8')
const creditReservationFlow = readFileSync(creditReservationFlowPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# BILLING-SOUND-0 Fixture Credit Placeholder Acceptance Audit',
  'Workstream owner: BILLING_STRIPE_CREDITS',
  'Requesting workstream: SOUND_MUSIC_AUDIO',
  'Related source workstreams: SUPABASE_RLS_STORAGE_DATABASE, WORKER_RUNTIME_JOBS, PROVIDER_GATEWAY_MODELS, OBSERVABILITY_AUDIT_COST',
  'Current SOUND stage: dry_run_passed',
  'Target future stage: generated_local_fixture_passed',
  'Decision: conditional_billing_acceptance_for_no_spend_fixture_credit_placeholder',
  'This document is audit-only.',
  'This document does not create credit estimates.',
  'This document does not create credit approvals.',
  'This document does not create credit reservations.',
  'This document does not spend, reserve, refund, or release credits.',
  'This document does not call Stripe or create payment objects.',
  'This document does not mutate Supabase.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked because cross-owner approvals are incomplete.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'Billing evidence later must map back to approved source-of-truth records.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  'Billing events must not be triggered from raw prompt execution.',
  'BILLING_STRIPE_CREDITS conditionally accepts future SOUND local fixture credit evidence only as metadata/spec placeholder expectations.',
  'billingAllowsMetadataOnlyCreditPlaceholderExpectations: true.',
  'billingAllowsPersistedCreditRows: false.',
  'billingAllowsSpend: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Accepted by Billing/Stripe/Credits',
  'metadata-only credit placeholder expectations',
  'no persisted credit estimate rows',
  'no persisted credit approval rows',
  'no persisted credit reservation rows',
  'no spend',
  'no reservation',
  'no refund',
  'no release',
  'no Stripe calls',
  'no payment objects',
  '## Rejected / still blocked by Billing/Stripe/Credits',
  'persisted credit estimates',
  'persisted credit approvals',
  'persisted credit reservations',
  'Stripe checkout/payment/customer/subscription/payment intent operations',
  'generated_local_fixture_passed claim',
  '## Credit placeholder readiness table',
  '## Credit placeholder format future requirements',
  'creditPlaceholderId: mock/reference-only now',
  'estimatedCostRecordedNow: false',
  'creditEstimateCreatedNow: false',
  'creditApprovalCreatedNow: false',
  'creditReservationCreatedNow: false',
  'spendOccurred: false',
  'refundOccurred: false',
  'releaseOccurred: false',
  'stripeOperationOccurred: false',
  'persistedNow: false',
  '## Future billing readiness requirements',
  'Billing owner accepts credit estimate policy.',
  'Billing owner accepts approval policy.',
  'Billing owner accepts reservation policy.',
  'Billing owner accepts refund/release policy.',
  'Billing owner accepts no-spend local fixture policy.',
  '## Required before BILLING-SOUND-1',
  'metadata-only credit placeholder spec approved;',
  'no-persisted-credit-rows smoke;',
  'no-spend/no-reservation smoke;',
  'no-Stripe-call smoke;',
  'no-beta/no-production claim smoke;',
  '## Cross-owner status after Billing decision',
  '## Go / no-go for SUPABASE-SOUND-4',
  'globalGoForSUPABASE_SOUND_4 remains false.',
  '## Runtime / provider / gate behavior',
  'credit estimate rows: false.',
  'credit approval rows: false.',
  'credit reservation rows: false.',
  'spend: false.',
  'refund: false.',
  'release: false.',
  'Stripe calls: false.',
  'payment objects: false.',
  'provider calls: false.',
  'worker dispatch: false.',
  'Supabase mutation: false.',
  'SQL execution: false.',
  'migration deploy: false.',
  'storage buckets or objects: false.',
  'signed URL creation: false.',
  'generated assets: false.',
  'feature gates changed: false.',
  'tool capabilities seeded: false.',
  'worker runtime configs created: false.',
  '## Supabase update classification',
  'Supabase update required: no.',
  'Supabase environment touched: no.',
  'SQL executed: no.',
  'Migration deployed: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(billingDoc, required, `Billing audit doc must include ${required}.`)
}

for (const area of requiredCreditAreas) {
  requireText(billingDoc, requiredCreditAreaDocText[area], `Billing doc table must include ${area}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(billingDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status:', `${owner} section must include status.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
}

for (const owner of acceptedOwners) {
  requireText(ownerSection(billingDoc, owner), 'status: accepted_conditionally.', `${owner} must be accepted conditionally.`)
}

for (const owner of missingOwners) {
  requireText(ownerSection(billingDoc, owner), 'status: missing.', `${owner} must remain missing.`)
}

for (const priorRequired of [
  '# OBSERVABILITY-SOUND-0 QA / Audit / Cost Fixture Evidence Audit',
  'observabilityAllowsMetadataOnlyEvidenceExpectations: true.',
  'observabilityAllowsPersistedEvidenceRows: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  'BILLING-SOUND-0: fixture credit placeholder acceptance audit',
]) {
  requireText(observabilityDoc, priorRequired, `Observability doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# PROVIDER-GATEWAY-SOUND-0 Provider / License Fixture Boundary Audit',
  'providerGatewayAllowsNoProviderLocalFixture: true.',
  'providerGatewayAllowsProviderCalls: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(providerGatewayDoc, priorRequired, `Provider Gateway doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# WORKER-RUNTIME-SOUND-0 Audio Fixture Payload Acceptance Audit',
  'workerRuntimeAllowsFuturePayloadShapeValidation: true.',
  'workerRuntimeAllowsDispatch: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(workerRuntimeDoc, priorRequired, `Worker Runtime doc must still include ${priorRequired}.`)
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
  'Billing/credit placeholder',
  'This plan creates no QA row, no audit event, no cost record, no credit estimate, no credit approval, no credit reservation, no credit spend, no refund, and no release.',
]) {
  requireText(soundFixturePlan, priorRequired, `SOUND fixture plan must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist',
  'BILLING_STRIPE_CREDITS',
  'no credit rows, no spend claims, no reservation, no Stripe/payment operation',
]) {
  requireText(soundOwnerChecklist, priorRequired, `SOUND owner checklist must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'Frontend code may display estimates and mock gate results.',
  'It must not be trusted to reserve, spend, release, or refund real credits.',
  'The mock gate returns allowed/blocked decisions and warnings. It does not call Stripe, provider APIs, workers, rendering, or remote Supabase.',
]) {
  requireText(creditRuntimeGate, priorRequired, `Credit runtime gate doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'Real reservation, spend, release, and refund must be transactional, idempotent, and backend-only.',
  'No Stripe checkout, webhook, subscription, purchase, or money refund flow is implemented.',
]) {
  requireText(creditReservationFlow, priorRequired, `Credit reservation flow doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'credit_estimates',
  'credit_approvals',
  'credit_reservations',
  'Credit reservation, spend, refund, and release rows remain blocked for SOUND local fixture draft planning.',
]) {
  requireText(draftMigration, priorRequired, `Draft migration must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'credit rows are not required for local fixture until Billing accepts placeholder policy',
  'QA billing feature tool and worker config tables remain owner gated',
]) {
  requireText(draftTests, priorRequired, `Draft tests must still include ${priorRequired}.`)
}

const spec = BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE

check(spec.workstream === 'BILLING_STRIPE_CREDITS', 'Spec workstream must be Billing.')
check(spec.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Spec requesting workstream must be SOUND.')
check(
  spec.relatedSourceWorkstreams.includes('SUPABASE_RLS_STORAGE_DATABASE')
    && spec.relatedSourceWorkstreams.includes('WORKER_RUNTIME_JOBS')
    && spec.relatedSourceWorkstreams.includes('PROVIDER_GATEWAY_MODELS')
    && spec.relatedSourceWorkstreams.includes('OBSERVABILITY_AUDIT_COST'),
  'Spec must include Supabase, Worker Runtime, Provider Gateway, and Observability related sources.',
)
check(spec.mode === 'billing_fixture_credit_placeholder_audit_only', 'Spec mode must be audit only.')
check(spec.currentUnlockStage === 'dry_run_passed', 'Spec current stage must be dry_run_passed.')
check(
  spec.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Spec target stage must be generated_local_fixture_passed.',
)
check(spec.claimsGeneratedLocalFixturePassed === false, 'Spec must not claim generated_local_fixture_passed.')
check(
  spec.decision.billingDecision === 'conditional_billing_acceptance_for_no_spend_fixture_credit_placeholder',
  'Billing decision must be conditional no-spend placeholder acceptance.',
)
check(
  typeof spec.decision.billingAllowsMetadataOnlyCreditPlaceholderExpectations === 'boolean',
  'Billing metadata-only placeholder flag must be boolean.',
)
check(
  spec.decision.billingAllowsMetadataOnlyCreditPlaceholderExpectations === true,
  'Billing must allow metadata-only credit placeholder expectations.',
)
check(spec.decision.billingAllowsPersistedCreditRows === false, 'Billing must not allow persisted credit rows.')
check(spec.decision.billingAllowsSpend === false, 'Billing must not allow spend.')
check(spec.decision.globalGoForSUPABASE_SOUND_4 === false, 'Global go must remain false.')
check(spec.decision.reasonGlobalGoBlocked.length > 0, 'Global go block reasons must be present.')
assertAllExecutionFlagsFalse(spec.execution, 'billingSpec.execution')
check(spec.acceptedConditions.length > 0, 'Accepted conditions must exist.')
check(spec.rejectedOrStillBlocked.length > 0, 'Rejected/still blocked uses must exist.')

for (const area of requiredCreditAreas) {
  const row = spec.creditPlaceholderReadiness.find((entry) => entry.area === area)
  check(Boolean(row), `Spec credit placeholder readiness must include ${area}.`)
  check(row?.metadataOnlyAcceptedNow === true, `${area} must be metadata-only accepted now.`)
  check(row?.persistedBillingEvidenceAllowedNow === false, `${area} must not allow persisted billing evidence now.`)
  check(row?.requiredBeforeGeneratedLocalFixturePassed === true, `${area} must be required before target stage.`)
}

check(
  spec.creditPlaceholderFormatExpectation.persistedNow === false,
  'Credit placeholder must not persist now.',
)
check(
  spec.creditPlaceholderFormatExpectation.estimatedCostRecordedNow === false,
  'Estimated cost must not be recorded now.',
)
check(
  spec.creditPlaceholderFormatExpectation.creditEstimateCreatedNow === false,
  'Credit estimate must not be created now.',
)
check(
  spec.creditPlaceholderFormatExpectation.creditApprovalCreatedNow === false,
  'Credit approval must not be created now.',
)
check(
  spec.creditPlaceholderFormatExpectation.creditReservationCreatedNow === false,
  'Credit reservation must not be created now.',
)
check(spec.creditPlaceholderFormatExpectation.spendOccurred === false, 'Spend must not occur.')
check(spec.creditPlaceholderFormatExpectation.refundOccurred === false, 'Refund must not occur.')
check(spec.creditPlaceholderFormatExpectation.releaseOccurred === false, 'Release must not occur.')
check(
  spec.creditPlaceholderFormatExpectation.stripeOperationOccurred === false,
  'Stripe operation must not occur.',
)
check(
  spec.creditPlaceholderFormatExpectation.status === 'metadata_only_expected',
  'Credit placeholder status must be metadata-only expected.',
)
check(spec.futureBillingReadinessRequirements.length >= 10, 'Future Billing requirements must be populated.')
check(spec.requiredBeforeBILLING_SOUND_1.length >= 10, 'Required before BILLING-SOUND-1 must be populated.')
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
check(
  spec.rawPromptRule.billingTriggeredFromRawPromptAllowed === false,
  'Billing must not be triggered from raw prompt execution.',
)
check(spec.rawPromptRule.requiresStructuredAgentFindings === true, 'Raw prompt rule must require findings.')
check(spec.rawPromptRule.requiresEditIntents === true, 'Raw prompt rule must require edit intents.')
check(spec.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Raw prompt rule must require snapshots.')
check(spec.crossOwnerStatus.length === requiredOwners.length, 'Spec must include all owner statuses.')

for (const owner of requiredOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Spec owner status missing: ${owner}.`)
  check((entry?.evidence.length ?? 0) > 0, `${owner} evidence must be present.`)
  check((entry?.missingEvidence.length ?? 0) > 0, `${owner} missing evidence must be present.`)
}

for (const owner of acceptedOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'accepted_conditionally', `${owner} must be accepted conditionally in spec.`)
}

for (const owner of missingOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'missing', `${owner} must remain missing in spec.`)
}

check(spec.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt, 'Spec must recommend Track A next.')
check(packageJson.scripts?.[scriptName] === scriptCommand, 'package.json must include the Billing smoke script.')

check(
  OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE.decision
    .observabilityAllowsMetadataOnlyEvidenceExpectations === true,
  'Observability prior decision must allow metadata-only evidence expectations.',
)
check(
  OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE.decision.observabilityAllowsPersistedEvidenceRows === false,
  'Observability prior decision must keep persisted evidence rows false.',
)
check(
  PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.decision.providerGatewayAllowsProviderCalls === false,
  'Provider Gateway prior decision must keep provider calls false.',
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

assertNoConcreteForbiddenText(billingDoc, billingDocPath)
scanForbiddenValues(spec, 'BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE')

console.log(JSON.stringify({
  ok: true,
  workstream: spec.workstream,
  requestingWorkstream: spec.requestingWorkstream,
  smoke: 'billing-sound-fixture-credit-placeholder-acceptance',
  mode: spec.mode,
  claimsGeneratedLocalFixturePassed: spec.claimsGeneratedLocalFixturePassed,
  billingAllowsMetadataOnlyCreditPlaceholderExpectations:
    spec.decision.billingAllowsMetadataOnlyCreditPlaceholderExpectations,
  billingAllowsPersistedCreditRows: spec.decision.billingAllowsPersistedCreditRows,
  billingAllowsSpend: spec.decision.billingAllowsSpend,
  globalGoForSUPABASE_SOUND_4: spec.decision.globalGoForSUPABASE_SOUND_4,
  creditEstimatesCreated: spec.execution.creditEstimatesCreated,
  creditApprovalsCreated: spec.execution.creditApprovalsCreated,
  creditReservationsCreated: spec.execution.creditReservationsCreated,
  spendOccurred: spec.execution.spendOccurred,
  stripeCallsMade: spec.execution.stripeCallsMade,
  recommendedImmediateNextPrompt: spec.recommendedImmediateNextPrompt,
}, null, 2))
