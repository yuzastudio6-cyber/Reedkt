# Project Edit Brief Production Readiness Gates

## Decision

`project_edit_brief_production_readiness_gates_passed_conditional_gate_policy_ready_for_owner_review`

## Scope

RP-EDITBRIEF-14 converts the Edit Brief launch posture from stale blanket blocking to conditional readiness gates. This milestone does not enable external beta, real-user-media beta, paid production, live Supabase reads/writes, migrations, SQL execution, Supabase CLI, Storage writes, provider/model calls, uploads, media processing, worker dispatch, render/export, or credit reservation/spend.

The important change is that launch states can now become true when explicit evidence is supplied to the readiness evaluator. They remain false by default because the required owner approvals and production evidence are not present in this branch.

## Gate Model

Launch stages:

- `internal_dry_run`
- `bounded_tool_execution`
- `external_beta`
- `real_user_media_beta`
- `paid_production`

Permanent safety invariants remain hard:

- No raw prompts as source truth.
- No secrets or service-role credentials in browser/frontend code.
- No signed URLs as source truth.
- Heavy execution stays backend/worker-only.
- Approved plan snapshot policy and credit estimate/reservation policy are required before expensive work.
- License/model-weight review is required before external beta.
- No silent billing, ledger mutation, Stripe, or wallet mutation without billing persistence approval.

## Current Edit Brief Status

Default status remains blocked beyond internal dry-run because evidence is still missing:

- Owner approval for canonical Edit Brief workflow.
- Production durable-root schema approval for `edit_briefs`, `edit_cues`, cue child tables, application logs, and export settings.
- RLS, explicit Data API grant, Storage policy, service-role, migration, typegen, local and remote Supabase validation.
- Authenticated project/session access policy.
- Durable media/upload/source asset lifecycle.
- Planner integration from Brief hints into approved plan snapshots.
- Credit estimate/reservation integration.
- Worker/provider/render gates and monitoring.

## Evidence-Driven Readiness

The readiness evaluator can allow:

- External beta when dry-run evidence, safety/cost docs, approved snapshot/credit policy, deployment, security, storage/privacy, model/license, checklist, and production-readiness gates pass.
- Real-user-media beta only after external beta plus private media approval and artifact privacy evidence.
- Paid production only after real-user-media beta plus production deployment, billing/ledger persistence, cost controls, incident/runbook, observability, and no hard launch blockers.

## Boundary Confirmations

- No production route was enabled.
- Project Edit Brief mock routes remain `productionReady: false`.
- No Supabase migration or SQL was added.
- No generated database types changed.
- No provider/model call, media processing, worker dispatch, render/export, or credit action was enabled.
- No package-lock, Dockerfile, `.dockerignore`, runtime source, Supabase SQL, media artifact, signed URL, or secret was added.

## Next Milestone

`RP-EDITBRIEF-15 - Owner Review and Production Gate Evidence Collection`
*** Add File: /private/tmp/reeditpro-edit-brief-reconciliation/docs/project-edit-brief-production-readiness-gates.json
{
  "id": "project-edit-brief-production-readiness-gates",
  "milestone": "RP-EDITBRIEF-14",
  "decision": "project_edit_brief_production_readiness_gates_passed_conditional_gate_policy_ready_for_owner_review",
  "status": "passed_conditional_gate_policy_only",
  "launchStages": [
    "internal_dry_run",
    "bounded_tool_execution",
    "external_beta",
    "real_user_media_beta",
    "paid_production"
  ],
  "defaultAllowed": {
    "internalDryRunTestingAllowed": true,
    "limitedLocalDevInternalTestingAllowed": false,
    "externalBetaAllowed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  },
  "conditionalPassesWhenEvidenceSupplied": {
    "externalBetaAllowed": true,
    "realUserMediaBetaAllowed": true,
    "paidProductionAllowed": true
  },
  "hardInvariants": [
    "no_raw_prompts_as_source_truth",
    "no_secrets_or_service_role_in_frontend",
    "no_signed_urls_as_source_truth",
    "backend_worker_only_heavy_execution",
    "approved_plan_snapshot_required",
    "credit_estimate_reservation_required",
    "license_model_weight_review_required",
    "no_silent_billing"
  ],
  "currentMissingEvidence": [
    "owner_canonical_workflow_approval",
    "durable_root_schema_approval",
    "rls_explicit_grants_storage_service_role_review",
    "migration_typegen_local_remote_supabase_validation",
    "authenticated_project_session_access_policy",
    "durable_media_upload_source_asset_lifecycle",
    "planner_integration_to_approved_snapshots",
    "credit_estimate_reservation_integration",
    "worker_provider_render_monitoring_gates"
  ],
  "blockedScope": {
    "externalBetaEnabled": false,
    "realUserMediaBetaEnabled": false,
    "paidProductionEnabled": false,
    "supabaseMigrationAdded": false,
    "sqlExecuted": false,
    "supabaseCliCommandRun": false,
    "supabaseReadWriteEnabled": false,
    "storageWriteEnabled": false,
    "productionRouteEnabled": false,
    "providerOrModelCall": false,
    "mediaProcessing": false,
    "workerDispatch": false,
    "renderOrExportJob": false,
    "creditReservationOrSpend": false
  },
  "nextMilestone": "RP-EDITBRIEF-15 - Owner Review and Production Gate Evidence Collection"
}
*** Add File: /private/tmp/reeditpro-edit-brief-reconciliation/server/smoke/project-edit-brief-production-readiness-gates-smoke.ts
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_API_ROUTES,
  createProjectEditBriefApiRouteRegistrySummary,
} from '../../src/backend/api/project-edit-brief-api-route-registry'
import {
  buildBetaReadinessReport,
  evaluateBetaGoNoGo,
  launchReadinessGatePolicy,
} from '../beta-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const docs = [
  'docs/project-edit-brief-production-readiness-gates.md',
  'docs/project-edit-brief-production-readiness-gates.json',
  'docs/project-edit-brief-supabase-persistence-plan.md',
  'docs/edit-brief-milestone-roadmap.md',
]

for (const doc of docs) {
  assert.equal(existsSync(path.join(repoRoot, doc)), true, `${doc} should exist`)
}

const gateDoc = read('docs/project-edit-brief-production-readiness-gates.md')
const gateJson = JSON.parse(read('docs/project-edit-brief-production-readiness-gates.json')) as {
  decision?: string
  launchStages?: string[]
  defaultAllowed?: Record<string, boolean>
  conditionalPassesWhenEvidenceSupplied?: Record<string, boolean>
  hardInvariants?: string[]
  blockedScope?: Record<string, boolean>
  nextMilestone?: string
}

assert.equal(gateJson.decision, 'project_edit_brief_production_readiness_gates_passed_conditional_gate_policy_ready_for_owner_review')
assert.deepEqual(gateJson.launchStages, ['internal_dry_run', 'bounded_tool_execution', 'external_beta', 'real_user_media_beta', 'paid_production'])
assert.deepEqual(launchReadinessGatePolicy.map((item) => item.stage), gateJson.launchStages)
assert.equal(gateJson.nextMilestone, 'RP-EDITBRIEF-15 - Owner Review and Production Gate Evidence Collection')

for (const invariant of [
  'no_raw_prompts_as_source_truth',
  'no_secrets_or_service_role_in_frontend',
  'no_signed_urls_as_source_truth',
  'approved_plan_snapshot_required',
  'credit_estimate_reservation_required',
  'no_silent_billing',
]) {
  assert.ok(gateJson.hardInvariants?.includes(invariant), `gate JSON should preserve ${invariant}`)
}

for (const [key, value] of Object.entries(gateJson.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain disabled by RP-EDITBRIEF-14`)
}

const defaultReport = buildBetaReadinessReport()
assert.equal(defaultReport.goNoGo.internalDryRunTestingAllowed, gateJson.defaultAllowed?.internalDryRunTestingAllowed)
assert.equal(defaultReport.goNoGo.externalBetaAllowed, false)
assert.equal(defaultReport.goNoGo.realUserMediaBetaAllowed, false)
assert.equal(defaultReport.goNoGo.paidProductionAllowed, false)
assert.equal(defaultReport.productionReady, false)

const passedChecklist = [
  { id: 'architecture_docs_complete', label: 'Architecture docs complete', status: 'passed' as const, requiredForExternalBeta: true, notes: [] },
  { id: 'contracts_schema_complete', label: 'Contracts/schema complete', status: 'passed' as const, requiredForExternalBeta: true, notes: [] },
]
const externalAllowed = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
})
assert.equal(externalAllowed.externalBetaAllowed, true, 'external beta should be conditional, not permanently false')

const productionAllowed = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  e2eDryRunPassed: true,
  safetyDocsExist: true,
  costDocsExist: true,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  privateMediaApproved: true,
  artifactPrivacyEvidenceApproved: true,
  productionDeploymentApproved: true,
  billingLedgerPersistenceApproved: true,
  costControlsApproved: true,
  incidentRunbookApproved: true,
  observabilityApproved: true,
  noHardLaunchBlockers: true,
})
assert.equal(productionAllowed.realUserMediaBetaAllowed, true, 'real-user-media beta should pass with explicit evidence')
assert.equal(productionAllowed.paidProductionAllowed, true, 'paid production should pass with explicit evidence')

const rawPromptBlocked = evaluateBetaGoNoGo({
  checklist: passedChecklist,
  productionReadinessBlocked: false,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  modelLicensesApproved: true,
  approvedSnapshotPolicyApproved: true,
  creditReservationPolicyApproved: true,
  rawPromptSafetyPassed: false,
})
assert.equal(rawPromptBlocked.externalBetaAllowed, false, 'raw prompt safety should remain a hard blocker')

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0, 'Project Edit Brief routes should remain non-production in RP-EDITBRIEF-14')
assert.equal(PROJECT_EDIT_BRIEF_API_ROUTES.every((route) => !route.requiresSupabase), true, 'Project Edit Brief mock routes should not require Supabase yet')
assert.ok(gateDoc.includes('stale blanket blocking'), 'gate doc should explain stale blocker replacement')
assert.ok(gateDoc.includes('No production route was enabled.'), 'gate doc should preserve no-runtime boundary')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-production-readiness-gates',
  status: 'passed',
  decision: gateJson.decision,
  defaultExternalBetaAllowed: defaultReport.goNoGo.externalBetaAllowed,
  conditionalExternalBetaAllowed: externalAllowed.externalBetaAllowed,
  conditionalPaidProductionAllowed: productionAllowed.paidProductionAllowed,
  productionReadyRoutes: routeSummary.productionReadyCount,
  nextMilestone: gateJson.nextMilestone,
}, null, 2))
